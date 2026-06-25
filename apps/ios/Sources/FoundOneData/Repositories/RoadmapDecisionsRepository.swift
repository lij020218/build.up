//
//  RoadmapDecisionsRepository.swift — 로드맵 stage decisions CRUD
//
//  ⚠️ 웹 SSOT: `stage_decisions` 테이블 (FK: roadmap_id → roadmaps.id).
//   웹 packages/shared/src/supabase/persistence.ts 와 호환.
//
//  스키마 (supabase/migrations/20260319_000001_initial_build_up_schema.sql):
//   roadmaps(id uuid pk, user_id uuid, template_id text, current_stage_code text,
//            progress_percent int, status text, created_at, updated_at)
//   stage_decisions(id uuid pk, roadmap_id uuid FK, stage_code text,
//                   selected_primary_option_id text, selected_option_ids text[],
//                   inputs jsonb, notes text, completed_at timestamptz,
//                   created_at, updated_at, unique(roadmap_id, stage_code))
//
//  iOS RoadmapStore 의 StageDecision (stageId / completedAt / inputs[String:String] /
//  selectedPrimaryOptionId) 은 stage_decisions 의 부분집합.
//   • inputs — read-merge-write: 서버 원본(AnyJSON 원형) 위에 iOS 가 가진 키만 patch.
//     웹 전용 키·nested 객체·null 보존, 타입(number/bool/array) 보존. (2026-06-10 P0-A)
//   • selected_primary_option_id — decision 에 값이 있을 때만 기록 (nil → 컬럼 미포함 = 웹 값 보존).
//   • 그 외 컬럼 (selected_option_ids, notes) — 건드리지 않는다 (웹 데이터 유실 방지).
//

import Foundation
import Supabase
import FoundOneCore

// MARK: - Repository protocol

public protocol RoadmapDecisionsRepositoryProtocol: Sendable {
    func fetchAll() async throws -> [StageDecision]
    func upsert(_ decision: StageDecision) async throws
    func delete(stageId: String) async throws
    /// hiring-setup 채용계획 — inputs.staffPlan(중첩 객체) + inputs.hiringStatus(문자열) 직접 I/O.
    /// 웹 MyHiringPlanCard 와 같은 위치(stage_decisions.inputs)에 web 호환 JSON 으로 저장.
    /// [String:String] 모델로는 중첩 객체 표현 불가 → 전용 경로(AnyJSON).
    func fetchStaffPlan() async throws -> (plan: StaffPlan?, status: String?)
    func saveStaffPlan(_ plan: StaffPlan, status: String) async throws
}

// MARK: - Supabase 실제 구현

public actor RoadmapDecisionsRepository: RoadmapDecisionsRepositoryProtocol {

    private let supabase: SupabaseClient
    private let getUserId: @Sendable () async throws -> UUID

    /// 캐시된 roadmap row id — 첫 호출 시 lazy 로 찾고 (없으면 생성), 이후 재사용.
    /// userId 변경 시 reset 필요 (resetForNewUser 경로).
    private var cachedRoadmapId: UUID?
    private var cachedForUserId: UUID?

    public init(
        supabase: SupabaseClient,
        getUserId: @escaping @Sendable () async throws -> UUID
    ) {
        self.supabase = supabase
        self.getUserId = getUserId
    }

    // MARK: - Public API

    public func fetchAll() async throws -> [StageDecision] {
        let userId = try await getUserId()
        guard let roadmapId = try await resolveRoadmapId(userId: userId, createIfMissing: false) else {
            return []
        }

        let rows: [StageDecisionReadDTO] = try await supabase
            .from("stage_decisions")
            .select("stage_code,selected_primary_option_id,inputs,completed_at")
            .eq("roadmap_id", value: roadmapId)
            .execute()
            .value

        return rows.map { $0.toDomain() }
    }

    public func upsert(_ decision: StageDecision) async throws {
        let userId = try await getUserId()
        let roadmapId = try await resolveRoadmapId(userId: userId, createIfMissing: true)!

        // ── 2026-06-10 P0-A: read-merge-write — inputs 전체 덮어쓰기 금지.
        //   종전: iOS 의 [String:String] 강제변환 dict 로 inputs 컬럼 전체를 교체 →
        //         웹이 저장한 number/bool/array 가 string 으로, nested 객체·null 은 통째로 소실.
        //   현행: 서버 원본 inputs(AnyJSON 원형) 위에 iOS 가 가진 키만 patch.
        //     • 서버에만 있는 키(nested 객체, null, 웹 전용 키)는 그대로 보존
        //     • 값이 안 바뀐 키는 서버 원형(타입 그대로) 유지 — 디코드→인코드 왕복 무손실
        //     • 값이 바뀐 키는 서버 타입에 맞춰 재인코딩 (StageInputsCodec.patchedValue)
        //   서버 읽기 실패 시 throw — 파괴적 덮어쓰기로 fallback 하지 않는다 (다음 commit 에서 재시도).
        let serverInputs = try await fetchServerInputs(roadmapId: roadmapId, stageCode: decision.stageId)
        var mergedInputs = serverInputs
        for (key, newValue) in decision.inputs {
            mergedInputs[key] = StageInputsCodec.patchedValue(
                key: key,
                newString: newValue,
                server: serverInputs[key]
            )
        }

        let nowIso = ISO8601DateFormatter().string(from: Date())
        let payload = StageDecisionWriteDTO(
            roadmap_id: roadmapId,
            stage_code: decision.stageId,
            selected_primary_option_id: decision.selectedPrimaryOptionId,
            inputs: mergedInputs,
            completed_at: decision.completedAt,
            updated_at: nowIso
        )

        try await supabase
            .from("stage_decisions")
            .upsert(payload, onConflict: "roadmap_id,stage_code")
            .execute()

        // roadmaps.updated_at bump — realtime(roadmaps user_id 필터) 발화용.
        //   stage_decisions 는 user_id 컬럼이 없어 직접 필터 구독 불가하므로, 부모 roadmaps 를
        //   touch 해 웹·다른 기기가 즉시 재조회하게 한다. (웹 saveRoadmapState 도 동일하게 bump)
        await touchRoadmap(roadmapId)
    }

    // MARK: - staffPlan (hiring-setup 채용계획) — AnyJSON 객체 직접 I/O

    public func fetchStaffPlan() async throws -> (plan: StaffPlan?, status: String?) {
        let userId = try await getUserId()
        guard let roadmapId = try await resolveRoadmapId(userId: userId, createIfMissing: false) else {
            return (nil, nil)
        }
        let inputs = try await fetchServerInputs(roadmapId: roadmapId, stageCode: "hiring-setup")
        let status: String?
        if case let .string(s) = inputs["hiringStatus"] { status = s } else { status = nil }
        var plan: StaffPlan?
        if case let .object(obj) = inputs["staffPlan"] {
            func int(_ k: String) -> Int? {
                switch obj[k] {
                case let .integer(n): return n
                case let .double(d): return Int(d)
                default: return nil
                }
            }
            plan = StaffPlan(
                fullTimeCount: int("fullTimeCount"),
                partTimeCount: int("partTimeCount"),
                fullTimeMonthlyBase: int("fullTimeMonthlyBase"),
                partTimeHourlyWage: int("partTimeHourlyWage"),
                partTimeHoursPerWeek: int("partTimeHoursPerWeek")
            )
        }
        return (plan, status)
    }

    public func saveStaffPlan(_ plan: StaffPlan, status: String) async throws {
        let userId = try await getUserId()
        let roadmapId = try await resolveRoadmapId(userId: userId, createIfMissing: true)!

        // read-merge-write — 기존 inputs 보존(웹 전용 키·완료 토글 등), staffPlan·hiringStatus 만 patch.
        var merged = try await fetchServerInputs(roadmapId: roadmapId, stageCode: "hiring-setup")
        var planObj: [String: AnyJSON] = [:]
        if let v = plan.fullTimeCount { planObj["fullTimeCount"] = .integer(v) }
        if let v = plan.partTimeCount { planObj["partTimeCount"] = .integer(v) }
        if let v = plan.fullTimeMonthlyBase { planObj["fullTimeMonthlyBase"] = .integer(v) }
        if let v = plan.partTimeHourlyWage { planObj["partTimeHourlyWage"] = .integer(v) }
        if let v = plan.partTimeHoursPerWeek { planObj["partTimeHoursPerWeek"] = .integer(v) }
        merged["staffPlan"] = .object(planObj)
        merged["hiringStatus"] = .string(status)

        let nowIso = ISO8601DateFormatter().string(from: Date())
        let payload = StageDecisionWriteDTO(
            roadmap_id: roadmapId,
            stage_code: "hiring-setup",
            selected_primary_option_id: nil,
            inputs: merged,
            completed_at: nil,
            updated_at: nowIso
        )
        try await supabase
            .from("stage_decisions")
            .upsert(payload, onConflict: "roadmap_id,stage_code")
            .execute()
        await touchRoadmap(roadmapId)
    }

    /// upsert 전 read-merge 용 — 서버에 저장된 원본 inputs (AnyJSON 원형) 조회.
    /// row 가 아직 없으면 빈 dict (정상). 네트워크 오류는 throw (호출부에서 upsert 자체를 중단).
    private func fetchServerInputs(roadmapId: UUID, stageCode: String) async throws -> [String: AnyJSON] {
        struct InputsRowDTO: Decodable {
            let inputs: [String: AnyJSON]?
        }
        let rows: [InputsRowDTO] = try await supabase
            .from("stage_decisions")
            .select("inputs")
            .eq("roadmap_id", value: roadmapId)
            .eq("stage_code", value: stageCode)
            .limit(1)
            .execute()
            .value
        return rows.first?.inputs ?? [:]
    }

    /// roadmaps.updated_at 갱신 (best-effort, realtime 트리거용). 실패해도 decision 저장은 유효.
    private func touchRoadmap(_ roadmapId: UUID) async {
        let nowIso = ISO8601DateFormatter().string(from: Date())
        _ = try? await supabase
            .from("roadmaps")
            .update(RoadmapTouchDTO(updated_at: nowIso))
            .eq("id", value: roadmapId)
            .execute()
    }

    public func delete(stageId: String) async throws {
        let userId = try await getUserId()
        guard let roadmapId = try await resolveRoadmapId(userId: userId, createIfMissing: false) else {
            return
        }

        try await supabase
            .from("stage_decisions")
            .delete()
            .eq("roadmap_id", value: roadmapId)
            .eq("stage_code", value: stageId)
            .execute()

        await touchRoadmap(roadmapId)
    }

    // MARK: - Roadmap row 보장

    /// 현재 user 의 가장 최근 roadmap row id 를 반환.
    /// createIfMissing=true 면 없을 경우 starter roadmap 을 INSERT 한다.
    private func resolveRoadmapId(userId: UUID, createIfMissing: Bool) async throws -> UUID? {
        if let cached = cachedRoadmapId, cachedForUserId == userId {
            return cached
        }
        // user 가 바뀌었으면 cache 무효화
        if cachedForUserId != userId {
            cachedRoadmapId = nil
            cachedForUserId = userId
        }

        let rows: [RoadmapRowDTO] = try await supabase
            .from("roadmaps")
            .select("id,updated_at")
            .eq("user_id", value: userId)
            .order("updated_at", ascending: false)
            .limit(1)
            .execute()
            .value

        if let first = rows.first {
            cachedRoadmapId = first.id
            return first.id
        }

        guard createIfMissing else { return nil }

        // starter roadmap insert — 웹 packages/shared/src/roadmap/starter.ts 의 기본 구조.
        // ⚠️ roadmaps.unique(user_id) (20260604 마이그레이션) 때문에 웹·다른 기기와 *동시 최초 생성*
        //   레이스 시 insert 가 unique 위반으로 실패할 수 있다. 그 경우 다른 클라이언트가 방금 만든
        //   row 를 재조회해 사용 — 중복 생성 대신 공유 (진행도 분할 방지).
        do {
            let inserted: [RoadmapRowDTO] = try await supabase
                .from("roadmaps")
                .insert(
                    RoadmapInsertDTO(
                        user_id: userId,
                        template_id: "default",
                        current_stage_code: "industry-selection",
                        progress_percent: 0,
                        status: "in_progress"
                    )
                )
                .select("id,updated_at")
                .execute()
                .value
            if let row = inserted.first {
                cachedRoadmapId = row.id
                return row.id
            }
        } catch {
            // unique(user_id) 레이스 추정 — 재조회로 기존 row 회수.
            let retry: [RoadmapRowDTO] = try await supabase
                .from("roadmaps")
                .select("id,updated_at")
                .eq("user_id", value: userId)
                .order("updated_at", ascending: false)
                .limit(1)
                .execute()
                .value
            if let row = retry.first {
                cachedRoadmapId = row.id
                return row.id
            }
            throw error
        }
        throw RoadmapDecisionsRepositoryError.roadmapInsertFailed
    }
}

// MARK: - Errors

public enum RoadmapDecisionsRepositoryError: Error, Sendable {
    case roadmapInsertFailed
}

// MARK: - DTOs

private struct RoadmapRowDTO: Decodable {
    let id: UUID
    let updated_at: String?
}

private struct RoadmapInsertDTO: Encodable {
    let user_id: UUID
    let template_id: String
    let current_stage_code: String
    let progress_percent: Int
    let status: String
}

private struct StageDecisionReadDTO: Decodable {
    let stage_code: String
    let selected_primary_option_id: String?
    let inputs: [String: AnyJSON]?
    let completed_at: String?

    func toDomain() -> StageDecision {
        StageDecision(
            stageId: stage_code,
            completedAt: completed_at,
            inputs: StageInputsCodec.toStringDict(inputs ?? [:]),
            selectedPrimaryOptionId: selected_primary_option_id
        )
    }
}

private struct RoadmapTouchDTO: Encodable {
    let updated_at: String
}

private struct StageDecisionWriteDTO: Encodable {
    let roadmap_id: UUID
    let stage_code: String
    /// nil 이면 synthesized Codable 의 encodeIfPresent 로 키 자체가 생략 →
    /// PostgREST upsert 가 이 컬럼을 건드리지 않음 (웹이 쓴 기존 값 보존).
    let selected_primary_option_id: String?
    /// AnyJSON 원형 — 서버 inputs 와 read-merge 된 결과 (타입 보존).
    let inputs: [String: AnyJSON]
    let completed_at: String?
    let updated_at: String
}

// MARK: - inputs JSONB 타입 보존 codec (2026-06-10 P0-A)

/// stage_decisions.inputs JSONB ↔ iOS [String: String] 변환 규칙.
///
/// 원칙: **저장 레이어는 AnyJSON 원형을 보존**하고, String 변환은 *읽기(표시)* 에서만 수행.
///  • 읽기: AnyJSON → 표시용 String coerce (number → "50000000", bool → "true", [String] → "a,b").
///    nested 객체·null 은 String 으로 표현 불가 → 표시 dict 에서 제외 (upsert 의 read-merge 가 보존).
///  • 쓰기: 서버 원형과 비교 — 값이 같으면 서버 원형 그대로 (디코드→인코드 왕복 무손실),
///    값이 바뀌었으면 서버 타입에 맞춰 재인코딩 (웹의 typeof === "number" / Array.isArray 계약 유지).
///
/// `AnyJSON` 은 supabase-swift SDK 의 타입 보존 JSON enum (.null/.bool/.integer/.double/.string/.object/.array).
enum StageInputsCodec {

    /// 웹이 number 로 읽는 키 — 서버에 기존 값이 없어도 number 로 기록해야 하는 키.
    /// 웹 사용처: inputs.capital → usePersistence.ts(typeof === "number"),
    ///   persistence.ts buildProfilePatchFromState, helpers.ts hydrateSavedFinanceSnapshot.
    static let numberKeys: Set<String> = ["capital"]

    /// AnyJSON → 표시용 String. 표현 불가 타입 (object/null) 은 nil.
    static func displayString(_ value: AnyJSON) -> String? {
        switch value {
        case .string(let s):
            return s
        case .integer(let n):
            return String(n)
        case .double(let d):
            // 정수면 정수처럼, 아니면 소수 (종전 AnyJSONDict 와 동일 규칙)
            if d.rounded() == d, abs(d) < Double(Int.max) { return String(Int(d)) }
            return String(d)
        case .bool(let b):
            return b ? "true" : "false"
        case .array(let arr):
            // 전부 String 인 배열만 콤마 join (RoadmapStore 가 다시 split 할 수 있도록)
            let strings = arr.compactMap(\.stringValue)
            guard strings.count == arr.count else { return nil }
            return strings.joined(separator: ",")
        case .object, .null:
            return nil
        }
    }

    /// [String: AnyJSON] → 표시용 [String: String] (RoadmapStore 소비용 읽기 레이어).
    static func toStringDict(_ json: [String: AnyJSON]) -> [String: String] {
        var out: [String: String] = [:]
        out.reserveCapacity(json.count)
        for (k, v) in json {
            if let s = displayString(v) { out[k] = s }
        }
        return out
    }

    /// iOS 의 String 입력값 1개를 서버 원형과 비교해 최종 저장값 결정.
    static func patchedValue(key: String, newString: String, server: AnyJSON?) -> AnyJSON {
        if let server {
            // 1) 변경 없음 (읽기 시 coerce 했던 값 그대로) → 서버 원형 유지. 타입 파괴 0.
            if displayString(server) == newString { return server }
            // 2) 실제 변경 → 서버 타입에 맞춰 재인코딩.
            switch server {
            case .integer:
                if let n = Int(newString) { return .integer(n) }
            case .double:
                if let d = Double(newString) { return .double(d) }
            case .bool:
                if newString == "true" { return .bool(true) }
                if newString == "false" { return .bool(false) }
            case .array(let arr) where arr.allSatisfy({ $0.stringValue != nil }):
                // 읽기 시 콤마 join → 쓰기 시 콤마 split 으로 복원
                return .array(newString.split(separator: ",").map { .string(String($0)) })
            default:
                break
            }
            return .string(newString)
        }
        // 3) 서버에 없는 신규 키 — 키 스키마로 타입 결정.
        if numberKeys.contains(key) {
            if let n = Int(newString) { return .integer(n) }
            if let d = Double(newString) { return .double(d) }
        }
        return .string(newString)
    }
}

// MARK: - In-memory mock

public actor MockRoadmapDecisionsRepository: RoadmapDecisionsRepositoryProtocol {
    private var storage: [String: StageDecision] = [:]

    public init(seed: [StageDecision] = []) {
        for d in seed { storage[d.stageId] = d }
    }

    public func fetchAll() async throws -> [StageDecision] {
        Array(storage.values)
    }

    public func upsert(_ decision: StageDecision) async throws {
        storage[decision.stageId] = decision
    }

    public func delete(stageId: String) async throws {
        storage.removeValue(forKey: stageId)
    }

    private var mockStaffPlan: StaffPlan?
    private var mockStatus: String?
    public func fetchStaffPlan() async throws -> (plan: StaffPlan?, status: String?) {
        (mockStaffPlan, mockStatus)
    }
    public func saveStaffPlan(_ plan: StaffPlan, status: String) async throws {
        mockStaffPlan = plan
        mockStatus = status
    }
}
