//
//  RoadmapStore.swift — 로드맵 워크플로우 엔진 (iOS 네이티브)
//
//  웹 SSOT 미러:
//    apps/web/app/lib/hooks/useComputedDashboard.ts (path-aware traversal)
//    apps/web/app/lib/hooks/useTaskHandlers.ts     (handleStageContinue)
//    packages/shared/src/roadmap/workflow.ts       (resolveNextStageIds, zombie 감지)
//
//  책임:
//   • cluster 선택 (영구 저장)
//   • stage 별 decision (completedAt + inputs) 영구 저장
//   • currentStageId / completedStageIds 계산 (decisions 기반)
//   • completeStage(_:) / uncompleteStage(_:) / advanceToNext()
//
//  Persistence:
//   • UserDefaults (JSON Codable) — Supabase 동기화는 후속 단계 (선택)
//   • Key: "foundone.roadmap.decisions.v1"
//
//  좀비 (zombie) 방지:
//   • completeStage 호출은 cluster path 에 속한 stageId 만 허용
//   • cluster 변경 시 path 외 decisions 는 보존하되 currentStage 계산에서는 제외
//

import Foundation
import Observation
import OSLog
import FoundOneCore

private let logger = Logger(subsystem: "com.foundone.ios", category: "RoadmapStore")

// MARK: - StageDecision

/// 단계별 사용자 결정 — 웹의 `roadmap_decisions` row 미러.
public struct StageDecision: Codable, Sendable, Equatable {
    public let stageId: String
    /// ISO 8601 형식. nil → 미완료.
    public var completedAt: String?
    /// 단계별 자유 형식 JSON 입력값 (선택 카드·체크박스 등).
    /// Codable 안전성을 위해 String dictionary 로 직렬화.
    public var inputs: [String: String]
    /// 웹 stage_decisions.selected_primary_option_id 미러 (예: industry-selection 의 sub-industry id).
    /// 웹 분기 엔진(workflow.ts resolveDecisionValue)이 inputs 가 아닌 이 컬럼을 직접 읽는다.
    /// nil → 쓰기 시 컬럼을 건드리지 않음 (웹이 쓴 값 보존). 구버전 로컬 캐시 디코드 시 자동 nil (하위호환).
    public var selectedPrimaryOptionId: String?

    public init(
        stageId: String,
        completedAt: String? = nil,
        inputs: [String: String] = [:],
        selectedPrimaryOptionId: String? = nil
    ) {
        self.stageId = stageId
        self.completedAt = completedAt
        self.inputs = inputs
        self.selectedPrimaryOptionId = selectedPrimaryOptionId
    }

    public var isCompleted: Bool { completedAt != nil }
}

// MARK: - RoadmapStore

@MainActor
@Observable
public final class RoadmapStore {

    // MARK: - Persisted State

    /// 사장님이 선택한 cluster (업종).
    public private(set) var cluster: String = "offline-food"

    /// stageId → decision.
    public private(set) var decisions: [String: StageDecision] = [:]

    /// upsert 에 실패한 stageId — 다음 syncFromRemote 성공(네트워크 복구) 시 재전송.
    ///   fire-and-forget 가 실패하면 그 단계가 영영 서버 미반영되던 것 보정. 멱등(서버 upsert 키 머지).
    private var pendingPushStageIds: Set<String> = []

    // MARK: - Derived

    /// cluster path 의 stageId 순서 — RoadmapSampleData 에 위임.
    /// 외부 (RoadmapView) 가 주입하지 않으면 빈 배열.
    public var pathProvider: (@MainActor (String) -> [String])? = nil {
        didSet { pathCache = nil }
    }

    /// pathStageIds 캐시 — cluster 별 1회 계산 (RoadmapView 가 stage 마다 status(for:) 호출 →
    ///   매번 pathFor(cluster) 재구성하던 비용 제거, 성능 2026-08-19). cluster/provider 변경 시 무효화.
    @ObservationIgnored private var pathCache: (cluster: String, ids: [String], set: Set<String>)? = nil

    private func resolvedPath() -> (ids: [String], set: Set<String>) {
        if let c = pathCache, c.cluster == cluster { return (c.ids, c.set) }
        let ids = pathProvider?(cluster) ?? []
        let set = Set(ids)
        pathCache = (cluster, ids, set)
        return (ids, set)
    }

    /// 현재 진행 중인 stageId — path 중 첫 번째 미완료 stage.
    public var currentStageId: String? {
        let ids = pathStageIds
        return ids.first { (decisions[$0]?.completedAt) == nil }
    }

    /// 완료된 stage 개수 (path 안의 것만).
    public var completedCount: Int {
        let ids = Set(pathStageIds)
        return decisions.values.filter { $0.isCompleted && ids.contains($0.stageId) }.count
    }

    /// 전체 path 길이.
    public var totalCount: Int { pathStageIds.count }

    /// path stageId 배열.
    public var pathStageIds: [String] { resolvedPath().ids }

    /// path 포함 여부 — Set 기반 O(1).
    private func pathContains(_ stageId: String) -> Bool { resolvedPath().set.contains(stageId) }

    /// 특정 stage 가 완료되었는지 — path 에 없으면 false (좀비 차단).
    public func isStageCompleted(_ stageId: String) -> Bool {
        guard pathContains(stageId) else { return false }
        return decisions[stageId]?.isCompleted ?? false
    }

    /// stage 의 status (.completed / .current / .upcoming) — RoadmapStage UI 용.
    public enum Status: String, Sendable { case completed, current, upcoming }

    public func status(for stageId: String) -> Status {
        guard pathContains(stageId) else { return .upcoming }
        if isStageCompleted(stageId) { return .completed }
        if currentStageId == stageId { return .current }
        return .upcoming
    }

    // MARK: - Persistence

    private static let userDefaultsKey = "foundone.roadmap.decisions.v1"
    private static let clusterKey = "foundone.roadmap.cluster.v1"
    private let defaults: UserDefaults
    private let repo: (any RoadmapDecisionsRepositoryProtocol)?

    public init(
        defaults: UserDefaults = .standard,
        repo: (any RoadmapDecisionsRepositoryProtocol)? = nil
    ) {
        self.defaults = defaults
        self.repo = repo
        loadFromDefaults()
    }

    private func loadFromDefaults() {
        if let raw = defaults.string(forKey: Self.clusterKey), !raw.isEmpty {
            self.cluster = raw
        }
        guard let data = defaults.data(forKey: Self.userDefaultsKey) else { return }
        do {
            let decoded = try JSONDecoder().decode([String: StageDecision].self, from: data)
            self.decisions = decoded
        } catch {
            logger.error("RoadmapStore decode 실패 — 초기화: \(error.localizedDescription)")
            self.decisions = [:]
        }
    }

    private func persist() {
        do {
            let data = try JSONEncoder().encode(decisions)
            defaults.set(data, forKey: Self.userDefaultsKey)
        } catch {
            logger.error("RoadmapStore encode 실패: \(error.localizedDescription)")
        }
        defaults.set(cluster, forKey: Self.clusterKey)
    }

    // MARK: - Mutations

    /// 사장님이 cluster 를 변경 — decisions 는 보존 (다시 돌아오면 진행 상태 유지).
    public func setCluster(_ raw: String) {
        guard cluster != raw else { return }
        cluster = raw
        pathCache = nil
        persist()
    }

    /// 특정 stage 완료 처리. 이미 완료된 stage 는 no-op.
    /// `selectedPrimaryOptionId` — 웹 분기 엔진이 읽는 컬럼 미러. nil 이면 기존 값 유지 (지우지 않음).
    public func completeStage(
        _ stageId: String,
        inputs: [String: String] = [:],
        selectedPrimaryOptionId: String? = nil
    ) {
        // path 외 stageId 차단 (좀비 방지)
        guard pathStageIds.contains(stageId) else {
            logger.warning("completeStage 거부 — path 외 stageId: \(stageId, privacy: .public)")
            return
        }
        var d = decisions[stageId] ?? StageDecision(stageId: stageId)
        if d.completedAt == nil {
            d.completedAt = Self.isoNow()
        }
        // inputs 머지 (덮어쓰기 X — 사장님 데이터 보호)
        for (k, v) in inputs { d.inputs[k] = v }
        if let primary = selectedPrimaryOptionId { d.selectedPrimaryOptionId = primary }
        decisions[stageId] = d
        persist()
        pushUpsert(d)
    }

    /// 프리필 — **완료 없이** 입력값만 채운다 (웹 SSOT: 위저드의 "채우되 완료는 사용자" 패턴).
    ///   AI 위저드 인수인계용 (2026-08-03): completedAt 을 찍으면 경로에 구멍이 생겨
    ///   웹 heal 이 사이 단계를 무단 완료하거나(재방문 상태 변화) 완료 단계를 건너뛰는
    ///   점프가 생긴다. 결정은 만들되 완료 도장은 사용자의 "다음 단계로"만 찍는다.
    public func prefillStage(
        _ stageId: String,
        inputs: [String: String] = [:],
        selectedPrimaryOptionId: String? = nil
    ) {
        guard pathStageIds.contains(stageId) else {
            logger.warning("prefillStage 거부 — path 외 stageId: \(stageId, privacy: .public)")
            return
        }
        var d = decisions[stageId] ?? StageDecision(stageId: stageId)
        // completedAt 은 건드리지 않는다 — 이미 완료된 단계면 완료 유지, 미완료면 미완료 유지
        for (k, v) in inputs where d.inputs[k] == nil { d.inputs[k] = v }   // 기존 사용자 입력 보호
        if let primary = selectedPrimaryOptionId, d.selectedPrimaryOptionId == nil {
            d.selectedPrimaryOptionId = primary
        }
        decisions[stageId] = d
        persist()
        pushUpsert(d)
    }

    /// 완료된 단계의 입력값만 갱신 (advance 없이). 웹 SSOT: handleStageEdit.
    ///   • 이미 완료된 stage 만 동작 — 미완료 stage 는 false 반환.
    ///   • completedAt 새로고침 + inputs 머지 + Supabase 즉시 sync.
    ///   • 다른 단계 상태에 영향 없음.
    @discardableResult
    public func saveStageEdit(
        currentStageId stageId: String,
        inputs: [String: String] = [:],
        selectedPrimaryOptionId: String? = nil
    ) -> Bool {
        guard var d = decisions[stageId], d.completedAt != nil else { return false }
        d.completedAt = Self.isoNow()
        for (k, v) in inputs { d.inputs[k] = v }
        if let primary = selectedPrimaryOptionId { d.selectedPrimaryOptionId = primary }
        decisions[stageId] = d
        persist()
        pushUpsert(d)
        // 정식 컬럼 중앙 투영 (수동 persist* 누락 방지). 사용자 commit 지점에서만 호출.
        StageInputProjector.project(inputs)
        return true
    }

    /// 입력 초안 저장 — **완료 상태를 건드리지 않고** inputs 만 로컬+서버에 upsert.
    ///   예산 단계처럼 입력이 많은 화면에서 "다음" 을 누르기 전에 이탈해도 값이 살아남고,
    ///   다른 기기(웹)가 같은 stage_decisions 를 하이드레이트한다 (2026-08-07 사장님 지시).
    ///   completedAt 은 WriteDTO encodeIfPresent 라 미완료면 키가 생략돼 서버 완료 상태 무해.
    ///   ⚠️ StageInputProjector 는 호출하지 않는다 — 정식 컬럼 투영은 사용자 commit 시점에만.
    public func saveInputsDraft(_ stageId: String, inputs: [String: String]) {
        guard !inputs.isEmpty else { return }
        var d = decisions[stageId] ?? StageDecision(stageId: stageId)
        for (k, v) in inputs { d.inputs[k] = v }
        decisions[stageId] = d
        persist()
        pushUpsert(d)
    }

    /// 완료 취소 — 사장님이 단계를 다시 열고 "되돌리기" 했을 때.
    ///   ⚠️ pushUpsert 금지: WriteDTO 가 encodeIfPresent 라 completedAt=nil 이면 키가 생략되어
    ///   서버 완료 상태가 그대로 남고, 다음 sync 의 원격우선 머지가 로컬 되돌리기를 원복했다
    ///   (2026-07-20 감사 P1). 전용 clearCompletedAt(명시적 NULL UPDATE)으로 지운다.
    public func uncompleteStage(_ stageId: String) {
        guard var d = decisions[stageId] else { return }
        d.completedAt = nil
        decisions[stageId] = d
        persist()
        pushClearCompletedAt(stageId)
    }

    /// stage 의 입력값만 부분 업데이트.
    public func setInput(_ stageId: String, key: String, value: String) {
        var d = decisions[stageId] ?? StageDecision(stageId: stageId)
        d.inputs[key] = value
        decisions[stageId] = d
        persist()
        pushUpsert(d)
    }

    public func input(_ stageId: String, key: String) -> String? {
        decisions[stageId]?.inputs[key]
    }

    /// 현재 stage 를 완료 처리하고 다음으로 진행. 다음 stage 가 없으면 nil 반환.
    @discardableResult
    public func advanceToNext(
        currentStageId: String,
        inputs: [String: String] = [:],
        selectedPrimaryOptionId: String? = nil
    ) -> String? {
        completeStage(currentStageId, inputs: inputs, selectedPrimaryOptionId: selectedPrimaryOptionId)
        // 정식 컬럼 중앙 투영 (수동 persist* 누락 방지). 사용자 commit 지점에서만 호출.
        StageInputProjector.project(inputs)
        let path = pathStageIds
        guard let idx = path.firstIndex(of: currentStageId) else { return nil }
        // sanity check — 웹의 "idx diff > 4" 좀비 점프 방지와 동일 정신
        let nextIdx = idx + 1
        guard nextIdx < path.count else { return nil }
        return path[nextIdx]
    }

    /// 업종 *전환* — 이전 업종의 로드맵 진행 전체 삭제 후 새 industry-selection 만 남긴다.
    ///   웹 SSOT: useSelectionHandlers.executeIndustrySwitch (사장님 결정 2026-07-21).
    ///   왜 전부: stageId 가 업종 간 공유(biz-registration·tax-guide 등)라 이전 completedAt 이
    ///   새 path 의 강신호가 되어 heal 이 미열람 단계를 통째로 완료 처리하고, inputs 잔재
    ///   (permitType·specialtyId·franchiseBrandId)가 새 업종을 오염시킨다.
    ///   운영 데이터(매출·직원 등)는 건드리지 않는다 — 그건 "진행 초기화" 영역.
    public func switchIndustry(
        inputs: [String: String],
        selectedPrimaryOptionId: String?
    ) {
        // 1) 로컬 wipe — 스테이지 @AppStorage 입력(옛 업종 permit.* 등) + decisions 전체
        clearAllAppStorage()
        pendingPushStageIds.removeAll()   // 옛 업종 단계의 재전송 예약도 폐기 (부활 차단)
        // 새 cluster 즉시 반영 — 아래 persist() 가 cluster 도 재기록하므로 옛 cluster 가
        // 다시 저장되지 않게 한다 (inputs["cluster"] 는 뷰 currentInputs 계약 키).
        if let newCluster = inputs["cluster"], !newCluster.isEmpty { cluster = newCluster }

        // 2) 새 industry-selection 완료 기록 (fresh — 옛 inputs 머지 없음)
        let d = StageDecision(
            stageId: "industry-selection",
            completedAt: Self.isoNow(),
            inputs: inputs,
            selectedPrimaryOptionId: selectedPrimaryOptionId
        )
        decisions["industry-selection"] = d
        persist()
        StageInputProjector.project(inputs)

        // 3) 서버 purge → fresh row push. purge 가 industry-selection 행까지 지우므로
        //    upsert 의 server-inputs 머지에 옛 값이 섞일 수 없다.
        //    purge 완료 전에는 pendingIndustrySwitchPurge 플래그로 syncFromRemote 의
        //    원격 머지를 보류한다 — 안 그러면 원격에 남은 옛 업종 진행이 로컬로 부활한다.
        guard let repo else { return }
        pendingIndustrySwitchPurge = true
        Task { [d] in
            do {
                try await repo.purgeAllForIndustrySwitch()
                try await repo.upsert(d)
                self.pendingIndustrySwitchPurge = false
            } catch {
                logger.error("업종 전환 purge/upsert 실패(다음 sync 에서 재시도): \(error.localizedDescription)")
            }
        }
    }

    /// 업종 전환의 서버 purge 가 아직 완료되지 않았는지 (오프라인·실패 시 true 잔존).
    ///   true 인 동안 syncFromRemote 는 원격 머지를 보류하고 purge 를 재시도한다.
    ///   UserDefaults 영속 — 앱 재시작 후에도 옛 진행 부활을 차단.
    ///   (clearAllAppStorage 가 "foundone.roadmap." prefix 로 이 키도 지우므로,
    ///    switchIndustry 는 wipe *후에* 플래그를 세운다.)
    private static let pendingSwitchPurgeKey = "foundone.roadmap.pendingIndustrySwitchPurge"
    private var pendingIndustrySwitchPurge: Bool {
        get { UserDefaults.standard.bool(forKey: Self.pendingSwitchPurgeKey) }
        set { UserDefaults.standard.set(newValue, forKey: Self.pendingSwitchPurgeKey) }
    }

    /// 전체 reset — 테스트·디버그 용도.
    public func resetAll() {
        decisions = [:]
        persist()
    }

    /// "진행 초기화" 전용: 모든 스테이지 @AppStorage 키를 UserDefaults 에서 삭제 후
    /// decisions 도 비운다.  일반 resetAll() 은 decisions 만 지우므로 대신 이 메서드를 호출.
    public func clearAllAppStorage() {
        let prefixes: [String] = [
            "biz.", "bom.", "cd.", "cert.", "construction.", "contract.", "cs.",
            "eda.", "fct.", "fin.", "fr.", "ge.", "gl.", "gtm.", "hiring.", "hp.",
            "insTax.", "lab.", "loan.", "loc.", "mfg.", "mpw.", "mvp.", "om.",
            "ops.", "or2.", "permit.", "pf.", "pi.", "pkg.", "plf.", "prelaunch.",
            "ps.", "regsub.", "roadmap.", "sf.", "src.", "stage.", "sto.",
            "taxGuide.", "vc.", "foundone.roadmap.",
        ]
        let defaults = UserDefaults.standard
        for key in defaults.dictionaryRepresentation().keys {
            if prefixes.contains(where: { key.hasPrefix($0) }) {
                defaults.removeObject(forKey: key)
            }
        }
        // decisions + persist()
        resetAll()
    }

    // MARK: - Supabase 동기화

    /// 원격에서 decisions 를 불러와 로컬과 머지.
    /// 정책:
    ///   • completedAt — 원격 우선 (서버가 source of truth on login)
    ///   • inputs — key-by-key 머지. 로컬에만 있는 key 는 보존 (오프라인 입력 보호).
    /// 실패 시 로컬 상태 유지 (조용히 로그).
    public func syncFromRemote() async {
        guard let repo else { return }
        // ── 업종 전환 purge 미완(오프라인 등) — 원격에 옛 업종 진행이 남아 있으므로 머지 금지.
        //    purge 재시도 성공 시에만 계속, 실패하면 로컬(새 업종만)을 유지하고 다음 기회에.
        if pendingIndustrySwitchPurge {
            do {
                try await repo.purgeAllForIndustrySwitch()
                if let d = decisions["industry-selection"] { try await repo.upsert(d) }
                pendingIndustrySwitchPurge = false
            } catch {
                logger.error("업종 전환 purge 재시도 실패 — 원격 머지 보류: \(error.localizedDescription)")
                return
            }
        }
        do {
            let remote = try await repo.fetchAll()
            // ── 원격 업종 전환 감지(다른 기기에서 전환) — key-by-key 머지 대신 원격 전체 채택.
            //    머지하면 서버에서 purge 로 지워진 옛 업종 진행이 로컬에서 부활한다.
            if let r = remote.first(where: { $0.stageId == "industry-selection" }),
               let l = decisions["industry-selection"],
               let remoteSub = r.selectedPrimaryOptionId ?? r.inputs["subIndustryId"],
               let localSub = l.selectedPrimaryOptionId ?? l.inputs["subIndustryId"],
               remoteSub != localSub {
                clearAllAppStorage()   // 옛 업종의 스테이지 @AppStorage 입력도 함께 폐기
                decisions = Dictionary(uniqueKeysWithValues: remote.map { ($0.stageId, $0) })
                pendingPushStageIds.removeAll()
                persist()
                return
            }
            var merged = decisions
            for r in remote {
                // 미전송 로컬 변경(오프라인 완료·되돌리기)은 원격우선 머지로 원복하지 않는다 —
                // 로컬을 유지하고 아래 retryPendingPushes 가 그 값을 서버로 push (P2-4 레이스 픽스).
                if pendingPushStageIds.contains(r.stageId), merged[r.stageId] != nil {
                    continue
                }
                if let existing = merged[r.stageId] {
                    var combined = r
                    for (k, v) in existing.inputs where combined.inputs[k] == nil {
                        combined.inputs[k] = v
                    }
                    // selectedPrimaryOptionId — 원격 우선, 원격에 없으면 로컬 보존 (오프라인 입력 보호)
                    if combined.selectedPrimaryOptionId == nil {
                        combined.selectedPrimaryOptionId = existing.selectedPrimaryOptionId
                    }
                    merged[r.stageId] = combined
                } else {
                    merged[r.stageId] = r
                }
            }
            decisions = merged
            persist()
            retryPendingPushes()  // 네트워크 복구됨 — 이전에 실패한 단계 재전송(보정)
        } catch {
            logger.error("syncFromRemote 실패: \(error.localizedDescription)")
        }
    }

    // MARK: - hiring-setup 채용계획(staffPlan) — inputs 중첩 객체 직접 I/O

    /// 서버에서 staffPlan + hiringStatus 로드(없으면 nil). 데모/오프라인은 nil.
    public func loadStaffPlan() async -> (plan: StaffPlan?, status: String?) {
        guard let repo else { return (nil, nil) }
        return (try? await repo.fetchStaffPlan()) ?? (nil, nil)
    }

    /// staffPlan + hiringStatus 저장(fire-and-forget, 웹 호환 inputs.staffPlan). 실패해도 UI 진행.
    public func saveStaffPlan(_ plan: StaffPlan, status: String) {
        guard let repo else { return }
        Task { try? await repo.saveStaffPlan(plan, status: status) }
    }

    /// 백그라운드 upsert. Supabase upsert 는 idempotent → debounce 불필요.
    ///   실패 시 stageId 를 pendingPushStageIds 에 적재 → 다음 syncFromRemote 성공 시 재전송(보정).
    private func pushUpsert(_ decision: StageDecision) {
        guard let repo else { return }
        Task { [decision] in
            do {
                try await repo.upsert(decision)
                self.pendingPushStageIds.remove(decision.stageId)
            } catch {
                self.pendingPushStageIds.insert(decision.stageId)
                logger.error("upsert 실패(재전송 대기) stageId=\(decision.stageId, privacy: .public): \(error.localizedDescription)")
            }
        }
    }

    /// 되돌리기 백그라운드 push — completed_at 명시적 NULL. 실패 시 pending 적재(다음 sync 재시도).
    private func pushClearCompletedAt(_ stageId: String) {
        guard let repo else { return }
        Task {
            do {
                try await repo.clearCompletedAt(stageId: stageId)
                self.pendingPushStageIds.remove(stageId)
            } catch {
                self.pendingPushStageIds.insert(stageId)
                logger.error("clearCompletedAt 실패(재전송 대기) stageId=\(stageId, privacy: .public): \(error.localizedDescription)")
            }
        }
    }

    /// syncFromRemote 성공(=네트워크 복구) 직후 호출 — 미전송 단계를 현재 로컬 값으로 재-push.
    ///   무한 루프 방지: 재시도분도 실패 시 pendingPushStageIds 에 그대로 남아 다음 sync 때 다시 시도.
    ///   되돌리기(completedAt=nil) 단계는 upsert 가 아닌 clearCompletedAt 으로 재시도 —
    ///   upsert 는 nil 키 생략이라 서버 완료 상태를 못 지운다.
    private func retryPendingPushes() {
        guard !pendingPushStageIds.isEmpty else { return }
        for stageId in Array(pendingPushStageIds) {  // 복사본 순회 — 아래 remove(순회 중 변경) 안전
            if let d = decisions[stageId] {
                if d.completedAt == nil { pushClearCompletedAt(stageId) } else { pushUpsert(d) }
            } else { pendingPushStageIds.remove(stageId) }  // 더 이상 로컬에 없으면 폐기
        }
    }

    // MARK: - Helpers

    private static func isoNow() -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f.string(from: Date())
    }
}

#if DEBUG
extension RoadmapStore {
    /// 투영 커버리지 감사 — 완료된 decision 들의 투영 키 값이 정식 컬럼에 반영됐는지 점검(경고만).
    /// AppRoot 가 syncFromRemote() 직후 호출. best-effort.
    public func auditProjectionCoverage() async {
        var merged: [String: String] = [:]
        for d in decisions.values where d.isCompleted {
            for (k, v) in d.inputs where StageInputProjector.projectedKeys.contains(k) {
                merged[k] = v
            }
        }
        guard !merged.isEmpty else { return }
        await StageInputProjector.audit(mergedInputs: merged)
    }

    /// Preview / 테스트용 시나리오 시드.
    public static func previewSeeded(cluster: String = "offline-food", completedCount: Int = 5) -> RoadmapStore {
        let store = RoadmapStore(defaults: UserDefaults(suiteName: "preview-\(UUID().uuidString)") ?? .standard)
        store.setCluster(cluster)
        return store
    }
}
#endif
