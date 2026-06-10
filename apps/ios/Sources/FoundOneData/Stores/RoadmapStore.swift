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
    public var pathProvider: (@MainActor (String) -> [String])? = nil

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
    public var pathStageIds: [String] {
        pathProvider?(cluster) ?? []
    }

    /// 특정 stage 가 완료되었는지 — path 에 없으면 false (좀비 차단).
    public func isStageCompleted(_ stageId: String) -> Bool {
        guard pathStageIds.contains(stageId) else { return false }
        return decisions[stageId]?.isCompleted ?? false
    }

    /// stage 의 status (.completed / .current / .upcoming) — RoadmapStage UI 용.
    public enum Status: String, Sendable { case completed, current, upcoming }

    public func status(for stageId: String) -> Status {
        guard pathStageIds.contains(stageId) else { return .upcoming }
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

    /// 완료 취소 — 사장님이 단계를 다시 열고 "되돌리기" 했을 때.
    public func uncompleteStage(_ stageId: String) {
        guard var d = decisions[stageId] else { return }
        d.completedAt = nil
        decisions[stageId] = d
        persist()
        pushUpsert(d)
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
        do {
            let remote = try await repo.fetchAll()
            var merged = decisions
            for r in remote {
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

    /// 사장님이 로그아웃·재로그인 했을 때 — 로컬 캐시 비우고 원격 hydrate.
    public func resetForNewUser() async {
        resetAll()
        await syncFromRemote()
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

    /// syncFromRemote 성공(=네트워크 복구) 직후 호출 — 미전송 단계를 현재 로컬 값으로 재-push.
    ///   무한 루프 방지: 재시도분도 실패 시 pendingPushStageIds 에 그대로 남아 다음 sync 때 다시 시도.
    private func retryPendingPushes() {
        guard !pendingPushStageIds.isEmpty else { return }
        for stageId in Array(pendingPushStageIds) {  // 복사본 순회 — 아래 remove(순회 중 변경) 안전
            if let d = decisions[stageId] { pushUpsert(d) }
            else { pendingPushStageIds.remove(stageId) }  // 더 이상 로컬에 없으면 폐기
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
