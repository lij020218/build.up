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
//  iOS RoadmapStore 의 StageDecision (stageId / completedAt / inputs[String:String])
//  은 stage_decisions 의 부분집합. 다른 컬럼 (selected_*, notes) 은 보존 모드 — 읽을 때만
//  무시, 쓸 때는 inputs 외 컬럼은 건드리지 않는다 (웹 데이터 유실 방지).
//

import Foundation
import Supabase
import FoundOneCore

// MARK: - Repository protocol

public protocol RoadmapDecisionsRepositoryProtocol: Sendable {
    func fetchAll() async throws -> [StageDecision]
    func upsert(_ decision: StageDecision) async throws
    func delete(stageId: String) async throws
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
            .select("stage_code,inputs,completed_at")
            .eq("roadmap_id", value: roadmapId)
            .execute()
            .value

        return rows.map { $0.toDomain() }
    }

    public func upsert(_ decision: StageDecision) async throws {
        let userId = try await getUserId()
        let roadmapId = try await resolveRoadmapId(userId: userId, createIfMissing: true)!

        let nowIso = ISO8601DateFormatter().string(from: Date())
        let payload = StageDecisionWriteDTO(
            roadmap_id: roadmapId,
            stage_code: decision.stageId,
            inputs: AnyJSONDict.fromStringDict(decision.inputs),
            completed_at: decision.completedAt,
            updated_at: nowIso
        )

        try await supabase
            .from("stage_decisions")
            .upsert(payload, onConflict: "roadmap_id,stage_code")
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
    let inputs: AnyJSONDict?
    let completed_at: String?

    func toDomain() -> StageDecision {
        StageDecision(
            stageId: stage_code,
            completedAt: completed_at,
            inputs: inputs?.toStringDict() ?? [:]
        )
    }
}

private struct StageDecisionWriteDTO: Encodable {
    let roadmap_id: UUID
    let stage_code: String
    let inputs: AnyJSONDict
    let completed_at: String?
    let updated_at: String
}

// MARK: - JSONB 디코딩 보조

/// JSONB 컬럼 → [String: String] 변환을 위한 헬퍼.
/// 웹의 inputs 는 string | number | boolean | string[] | null 다양한 타입을 갖지만
/// iOS RoadmapStore 는 String dictionary 만 다룬다 → 다른 타입은 String 으로 coerce.
struct AnyJSONDict: Codable, Sendable {
    var values: [String: String]

    static func fromStringDict(_ dict: [String: String]) -> AnyJSONDict {
        AnyJSONDict(values: dict)
    }

    func toStringDict() -> [String: String] { values }

    func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: DynamicCodingKey.self)
        for (k, v) in values {
            guard let key = DynamicCodingKey(stringValue: k) else { continue }
            try container.encode(v, forKey: key)
        }
    }

    init(values: [String: String]) {
        self.values = values
    }

    init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: DynamicCodingKey.self)
        var out: [String: String] = [:]
        for key in container.allKeys {
            // String / Number / Bool / Array<String> 등 다양한 케이스를 coerce
            if let s = try? container.decode(String.self, forKey: key) {
                out[key.stringValue] = s
            } else if let d = try? container.decode(Double.self, forKey: key) {
                // 정수면 정수처럼, 아니면 소수
                if d.rounded() == d, abs(d) < Double(Int.max) {
                    out[key.stringValue] = String(Int(d))
                } else {
                    out[key.stringValue] = String(d)
                }
            } else if let b = try? container.decode(Bool.self, forKey: key) {
                out[key.stringValue] = b ? "true" : "false"
            } else if let arr = try? container.decode([String].self, forKey: key) {
                // JSON 배열 → 콤마 join (RoadmapStore 가 다시 split 할 수 있도록)
                out[key.stringValue] = arr.joined(separator: ",")
            }
            // null / 기타 타입은 skip — 분실 안전 (decoder graceful)
        }
        self.values = out
    }

    private struct DynamicCodingKey: CodingKey {
        var stringValue: String
        var intValue: Int? { nil }
        init?(stringValue: String) { self.stringValue = stringValue }
        init?(intValue: Int) { return nil }
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
}
