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
//   • Key: "buildup.roadmap.decisions.v1"
//
//  좀비 (zombie) 방지:
//   • completeStage 호출은 cluster path 에 속한 stageId 만 허용
//   • cluster 변경 시 path 외 decisions 는 보존하되 currentStage 계산에서는 제외
//

import Foundation
import Observation
import OSLog

private let logger = Logger(subsystem: "com.buildup.ios", category: "RoadmapStore")

// MARK: - StageDecision

/// 단계별 사용자 결정 — 웹의 `roadmap_decisions` row 미러.
public struct StageDecision: Codable, Sendable, Equatable {
    public let stageId: String
    /// ISO 8601 형식. nil → 미완료.
    public var completedAt: String?
    /// 단계별 자유 형식 JSON 입력값 (선택 카드·체크박스 등).
    /// Codable 안전성을 위해 String dictionary 로 직렬화.
    public var inputs: [String: String]

    public init(stageId: String, completedAt: String? = nil, inputs: [String: String] = [:]) {
        self.stageId = stageId
        self.completedAt = completedAt
        self.inputs = inputs
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

    private static let userDefaultsKey = "buildup.roadmap.decisions.v1"
    private static let clusterKey = "buildup.roadmap.cluster.v1"
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
    public func completeStage(_ stageId: String, inputs: [String: String] = [:]) {
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
        decisions[stageId] = d
        persist()
        pushUpsert(d)
    }

    /// 완료된 단계의 입력값만 갱신 (advance 없이). 웹 SSOT: handleStageEdit.
    ///   • 이미 완료된 stage 만 동작 — 미완료 stage 는 false 반환.
    ///   • completedAt 새로고침 + inputs 머지 + Supabase 즉시 sync.
    ///   • 다른 단계 상태에 영향 없음.
    @discardableResult
    public func saveStageEdit(currentStageId stageId: String, inputs: [String: String] = [:]) -> Bool {
        guard var d = decisions[stageId], d.completedAt != nil else { return false }
        d.completedAt = Self.isoNow()
        for (k, v) in inputs { d.inputs[k] = v }
        decisions[stageId] = d
        persist()
        pushUpsert(d)
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
    public func advanceToNext(currentStageId: String, inputs: [String: String] = [:]) -> String? {
        completeStage(currentStageId, inputs: inputs)
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
            "taxGuide.", "vc.", "buildup.roadmap.",
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
                    merged[r.stageId] = combined
                } else {
                    merged[r.stageId] = r
                }
            }
            decisions = merged
            persist()
        } catch {
            logger.error("syncFromRemote 실패: \(error.localizedDescription)")
        }
    }

    /// 사장님이 로그아웃·재로그인 했을 때 — 로컬 캐시 비우고 원격 hydrate.
    public func resetForNewUser() async {
        resetAll()
        await syncFromRemote()
    }

    /// 백그라운드 fire-and-forget upsert. Supabase upsert 는 idempotent → debounce 불필요.
    private func pushUpsert(_ decision: StageDecision) {
        guard let repo else { return }
        Task { [decision] in
            do {
                try await repo.upsert(decision)
            } catch {
                logger.error("upsert 실패 stageId=\(decision.stageId, privacy: .public): \(error.localizedDescription)")
            }
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
    /// Preview / 테스트용 시나리오 시드.
    public static func previewSeeded(cluster: String = "offline-food", completedCount: Int = 5) -> RoadmapStore {
        let store = RoadmapStore(defaults: UserDefaults(suiteName: "preview-\(UUID().uuidString)") ?? .standard)
        store.setCluster(cluster)
        return store
    }
}
#endif
