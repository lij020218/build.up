//
//  StoreInfoStore.swift — "내 가게" 상태 보관 + 600ms debounce → Supabase flush
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/components/my-store/useStoreInfoSaver.tsx (600ms)
//             apps/web/app/lib/hooks/usePersistence.ts:flushStoreDataImmediate
//
//  사용 패턴:
//   1) @StateObject StoreInfoStore in MyStoreView
//   2) View 가 await store.load() 호출 (.task)
//   3) View 가 state.binding 으로 필드 편집
//   4) state 변경 → 600ms debounce → repository.save()
//   5) saveStatus: .idle → .saving → .saved / .error
//

import Foundation
import Supabase

@MainActor
public final class StoreInfoStore: ObservableObject {

    public enum SaveStatus: Equatable, Sendable {
        case idle
        case loading
        case saving
        case saved(Date)
        case error(String)
    }

    @Published public private(set) var state: StoreInfoState
    @Published public private(set) var saveStatus: SaveStatus = .idle
    @Published public private(set) var isLoaded: Bool = false

    private let repository: any StoreInfoRepositoryProtocol
    private var saveTask: Task<Void, Never>?

    public init(repository: any StoreInfoRepositoryProtocol,
                initial: StoreInfoState = StoreInfoState()) {
        self.repository = repository
        self.state = initial
    }

    // MARK: - Load

    public func load() async {
        guard !isLoaded else { return }
        saveStatus = .loading
        do {
            let loaded = try await repository.load()
            self.state = loaded
            self.isLoaded = true
            self.saveStatus = .idle
        } catch {
            self.saveStatus = .error(error.localizedDescription)
            // hydrate 실패해도 빈 state 로 진입 가능 — sandbox 모드처럼
            self.isLoaded = true
        }
    }

    // MARK: - Mutate + debounced save

    /// 호출자가 state 를 변경하고 debounced save 를 트리거.
    /// SwiftUI 의 Binding<T> 변화에 의해 자동 호출되는 게 아니라 명시적으로 commit().
    public func commit(_ mutate: (inout StoreInfoState) -> Void) {
        mutate(&state)
        scheduleSave()
    }

    /// 즉시 저장 (debounce 우회) — 사진 업로드처럼 큰 변경 직후.
    public func flushImmediate() async {
        saveTask?.cancel()
        await performSave()
    }

    // MARK: - Internals

    private func scheduleSave() {
        saveTask?.cancel()
        saveTask = Task { [weak self] in
            // 600ms debounce (웹 SSOT 와 동일)
            try? await Task.sleep(nanoseconds: 600_000_000)
            guard !Task.isCancelled else { return }
            await self?.performSave()
        }
    }

    private func performSave() async {
        saveStatus = .saving
        do {
            try await repository.save(state)
            saveStatus = .saved(Date())
            // 2초 후 idle 로 복귀 (웹 SSOT 와 동일)
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            if case .saved = saveStatus {
                saveStatus = .idle
            }
        } catch {
            saveStatus = .error(error.localizedDescription)
        }
    }
}

// MARK: - Mock for previews

#if DEBUG
public actor MockStoreInfoRepository: StoreInfoRepositoryProtocol {
    private var snapshot: StoreInfoState

    public init(seed: StoreInfoState = StoreInfoState()) {
        self.snapshot = seed
    }

    public func load() async throws -> StoreInfoState { snapshot }
    public func save(_ state: StoreInfoState) async throws { self.snapshot = state }
}
#endif
