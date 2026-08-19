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
    /// 마지막 성공 저장 이후 로컬 변경이 있는가 — commit()/mutation 에서 set, performSave 성공 시 clear.
    ///   flushImmediate/refresh 는 !isDirty 면 저장하지 않는다 (불필요한 upsert·realtime 자기 에코 차단).
    @Published public private(set) var isDirty: Bool = false
    /// 마지막 load() 가 실패했는가 — refresh 시 재시도. (persistence 불변식: 서버 로드 성공 전 자동저장 금지)
    public private(set) var loadFailed: Bool = false
    /// 서버 로드가 한 번이라도 성공했는가 — 이게 false 면 어떤 경로로도 save 하지 않는다.
    ///   (P0 데이터 손실 가드: 초기 load 실패 → 빈 state 를 서버 row 위에 upsert 하던 사고 차단, 2026-08-19)
    private var hasLoadedOnce: Bool = false

    /// commit 마다 증가 — save 중 들어온 새 변경을 isDirty=false 로 잘못 지우지 않기 위한 세대 번호.
    private var mutationGeneration: UInt64 = 0

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
            self.hasLoadedOnce = true
            self.loadFailed = false
            self.isDirty = false
            self.saveStatus = .idle
        } catch {
            self.saveStatus = .error(error.localizedDescription)
            self.loadFailed = true
            // ⚠️ 종전엔 실패해도 isLoaded=true(빈 state) 로 진입 → 이후 refresh/flush 가 빈 state 를
            //   서버 row 위에 upsert 하는 P0 데이터 손실. 이제 성공 이력이 없으면 loaded/ready 로 표시하지
            //   않고(저장도 차단), 이전에 성공한 적이 있으면 기존 state 를 유지한 채 loaded 상태로 복귀.
            self.isLoaded = hasLoadedOnce
        }
    }

    // MARK: - Mutate + debounced save

    /// 호출자가 state 를 변경하고 debounced save 를 트리거.
    /// SwiftUI 의 Binding<T> 변화에 의해 자동 호출되는 게 아니라 명시적으로 commit().
    public func commit(_ mutate: (inout StoreInfoState) -> Void) {
        mutate(&state)
        isDirty = true
        mutationGeneration &+= 1
        scheduleSave()
    }

    /// 즉시 저장 (debounce 우회) — 사진 업로드처럼 큰 변경 직후.
    /// 변경분(isDirty)이 없으면 no-op — 무의미한 upsert 와 realtime 자기 에코를 만들지 않는다.
    public func flushImmediate() async {
        saveTask?.cancel()
        guard isDirty else { return }
        await performSave()
    }

    /// 포그라운드 복귀 시 원격 재동기화 — 미저장 로컬 편집이 *있을 때만* 먼저 flush(클로버 방지)한 뒤
    /// isLoaded 가드를 풀어 fresh 데이터를 다시 읽는다. state 는 비우지 않으므로(load 가 성공 시에만
    /// overwrite) 깜빡임·데이터 손실 없음. 웹에서 바꾼 "내 가게" 필드가 앱에 반영되게 한다.
    /// 초기 load 가 실패했던 경우(loadFailed) 여기서 재시도된다.
    public func refresh() async {
        await flushImmediate()
        isLoaded = false
        await load()
    }

    /// 진행 초기화 — in-memory state 를 빈값으로 리셋. 저장은 호출하지 않음
    /// (서버 row 는 ProfileView 의 performReset 안에서 AccountResetRepository 가 별도 처리).
    /// isLoaded=false 로 되돌려 다음 .load() 호출이 fresh 데이터를 받게 함.
    public func reset() {
        saveTask?.cancel()
        saveTask = nil
        self.state = StoreInfoState()
        self.saveStatus = .idle
        self.isLoaded = false
        self.isDirty = false
        self.loadFailed = false
        // 다음 load() 성공 전까지 저장 금지 (초기화 직후 빈 state 가 서버로 되살아나는 것 차단).
        self.hasLoadedOnce = false
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
        // persistence 불변식: 서버 로드가 성공한 적이 없으면 절대 저장하지 않는다 (빈 state 로 서버 덮어쓰기 차단).
        //   isDirty 는 유지 → load 성공 뒤 다음 commit/flush 에서 저장 재시도.
        guard hasLoadedOnce else {
            saveStatus = .error("서버 데이터를 아직 불러오지 못해 저장을 보류했어요. 네트워크 확인 후 다시 시도해 주세요.")
            return
        }
        saveStatus = .saving
        let generationAtSave = mutationGeneration
        do {
            try await repository.save(state)
            // save 도중 새 commit 이 없었을 때만 clean 처리 (있었다면 debounce 가 다시 저장한다).
            if generationAtSave == mutationGeneration { isDirty = false }
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
