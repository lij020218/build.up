//
//  CashflowStore.swift — cashflow_settings 상태 보관 + Supabase 저장 (P3·P4b 공유 SSOT)
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/stores/cashflow-store.ts (Zustand + usePersistence 자동 sync)
//  iOS 는 설정 시트의 명시적 "저장" 버튼으로 persist (수정/저장 모드 패턴) → CashflowRepository.save.
//
//  사용 패턴:
//   1) AppRoot 가 로그인 후 CashflowStore(repository:defaultCategoryKey:) 생성 + load().
//   2) TodayView 가 settings.isConfigured 로 HeroCard 게이팅 (미설정 → 설정 프롬프트).
//   3) CashflowSetupSheet 가 working copy 편집 → store.save(working) 로 일괄 저장.
//   4) saveStatus: .idle → .saving → .saved / .error
//
//  데모/프리뷰: repository == nil → 메모리 전용 (업종 기본 믹스로 채운 미설정 상태).
//

import Foundation

@MainActor
public final class CashflowStore: ObservableObject {

    public enum SaveStatus: Equatable, Sendable {
        case idle
        case loading
        case saving
        case saved(Date)
        case error(String)
    }

    @Published public private(set) var settings: CashflowSettings
    @Published public private(set) var saveStatus: SaveStatus = .idle
    @Published public private(set) var isLoaded: Bool = false

    /// nil = 데모/프리뷰 (메모리 전용). 실제 사용자는 Supabase 연결 repository.
    private let repository: CashflowRepository?
    /// 미설정 진입 시 채워 넣을 업종 기본 채널 믹스 키 (웹 카테고리 id — 예: "food").
    private let defaultCategoryKey: String?

    public init(
        repository: CashflowRepository?,
        defaultCategoryKey: String?,
        initial: CashflowSettings? = nil
    ) {
        self.repository = repository
        self.defaultCategoryKey = defaultCategoryKey
        // 초기값이 없으면 업종 기본 믹스로 채운 미설정 상태로 시작.
        if let initial {
            self.settings = initial
        } else {
            var s = CashflowSettings()
            s.salesChannels = CashflowRepository.defaultChannels(forCategoryKey: defaultCategoryKey)
            self.settings = s
        }
    }

    // MARK: - Load

    public func load() async {
        guard !isLoaded else { return }
        guard let repository else {
            // 데모 모드 — 메모리 기본값 그대로 사용.
            isLoaded = true
            return
        }
        await reloadFromRemote(repository)
    }

    /// 원격 재동기화 — isLoaded 가드를 우회해 Supabase 에서 다시 읽는다.
    ///   포커스 복귀·realtime 수신 시 AppRoot.refreshAllFromRemote 가 호출.
    ///   설정 시트는 별도 working copy 를 편집하므로 진행 중 편집을 덮어쓰지 않는다.
    ///   (cashflow 는 명시적 저장만 하므로 미저장 store 상태가 없어 reload 안전.)
    public func refresh() async {
        guard let repository else { return }
        await reloadFromRemote(repository)
    }

    private func reloadFromRemote(_ repository: CashflowRepository) async {
        saveStatus = .loading
        do {
            let loaded = try await repository.load(defaultCategoryKey: defaultCategoryKey)
            self.settings = loaded
            self.isLoaded = true
            self.saveStatus = .idle
        } catch {
            // hydrate 실패해도 기본값으로 진입 가능 (사장님 화면 보호).
            self.saveStatus = .error(error.localizedDescription)
            self.isLoaded = true
        }
    }

    // MARK: - Save (명시적 — 설정 시트 "저장" 버튼)

    /// working copy 전체를 저장. setupCompletedAt/currentBalanceUpdatedAt 스탬핑은
    /// 호출자(설정 시트)가 마치고 넘긴다 (웹 handleSaveAndClose 와 동일 의미).
    public func save(_ newSettings: CashflowSettings) async {
        self.settings = newSettings
        guard let repository else {
            // 데모 모드 — 메모리에만 반영.
            saveStatus = .saved(Date())
            return
        }
        saveStatus = .saving
        do {
            try await repository.save(newSettings)
            saveStatus = .saved(Date())
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            if case .saved = saveStatus { saveStatus = .idle }
        } catch {
            saveStatus = .error(error.localizedDescription)
        }
    }
}
