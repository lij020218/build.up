//
//  ProfileView.swift — 내 정보 surface (web ProfileView.tsx 1:1 미러)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/ProfileView.tsx (317 lines)
//
//  섹션 구성 (위→아래, 웹과 동일 순서):
//    1. header           — 아바타 + 사장님 이름 + 가게 이름
//    2. accountCard      — 이메일 / 로그인 방식 / 사용자 ID / 계정 유형 배지 (게스트/등록)
//    3. journeyCard      — 내 여정 진행도 (단계 N완료 + % + bar + 개업 상태)
//    4. storeCard        — 가게 이름 / 업종 / 운영 N일째 / 현재 단계 (탭 → StoreInfoEditSheet)
//    5. dataConnectionCard — 데이터 연결 (시트)
//    6. notificationCard — 4개 토글 (iOS 고유 — 푸시 알림)
//    7. languageCard     — 한국어 ↔ English 토글 (@AppStorage 영구)
//    8. supportCard      — 도움말 / 이용약관 / 개인정보 / 문의하기
//    9. accountActionsCard — 진행 초기화 (Supabase reset) + 로그아웃 / 계정 삭제
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents
import FoundOneAuth
import FoundOneData

public struct ProfileView: View {
    let store: DashboardStore
    let coordinator: AuthCoordinator?
    /// 옵셔널 — 진행 초기화 시 in-memory state 도 함께 reset 하기 위해 필요.
    /// nil 이면 reset 시 dashboardStore 만 처리 (이전 동작 호환).
    let storeInfo: StoreInfoStore?

    public init(store: DashboardStore, coordinator: AuthCoordinator?, storeInfo: StoreInfoStore? = nil) {
        self.store = store
        self.coordinator = coordinator
        self.storeInfo = storeInfo
    }

    // 알림 토글
    @AppStorage("profile.notif.staleSales")     private var notifStaleSales:    Bool = true
    @AppStorage("profile.notif.taxDeadline")    private var notifTaxDeadline:   Bool = true
    @AppStorage("profile.notif.permitExpiry")   private var notifPermitExpiry:  Bool = true
    @AppStorage("profile.notif.weeklyCheckup")  private var notifWeeklyCheckup: Bool = true

    // 언어 — 웹과 동일하게 localStorage(@AppStorage) 만. Supabase 동기화 X (사용자별 디바이스 선호).
    @AppStorage("foundone.language") private var language: String = "ko"

    @Environment(RoadmapStore.self) private var roadmap
    @Environment(ResetCoordinator.self) private var resetCoordinator

    @State private var showDeleteConfirm: Bool = false
    @State private var showResetConfirm: Bool = false
    // 서버 초기화 실패 시 — 로컬을 지우지 않고 사장님께 명확히 알림(가짜 "완료" 금지).
    @State private var resetFailedMsg: String?
    @State private var showDataConnections: Bool = false
    @State private var showStoreConnect: Bool = false
    @State private var showFeedbackSheet: Bool = false
    @State private var showStoreEdit: Bool = false
    @State private var connectionCount: Int? = nil
    @State private var resetting: Bool = false
    @State private var storeBusinessOpen: String? = nil
    @State private var storeBusinessClose: String? = nil

    public var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: BUSpacing.md) {
                header
                accountCard
                journeyCard
                storeCard
                ownerProfileCard
                dataConnectionCard
                storeConnectCard
                notificationCard
                languageCard
                supportCard
                feedbackCard
                accountActionsCard
                Color.clear.frame(height: 110)
            }
            .padding(.horizontal, BUSpacing.screenMargin)
            .padding(.top, BUSpacing.md)
        }
        // ⚠️ 2026-05-25: 중복 BUBackgroundSurface 제거 — MobileShell 이 풀스크린으로 깖.
        .sheet(isPresented: $showDataConnections, onDismiss: {
            Task { await refreshConnectionCount() }
        }) {
            DataConnectionSheet()
        }
        .sheet(isPresented: $showStoreConnect) {
            StoreConnectSheet()
        }
        .sheet(isPresented: $showFeedbackSheet) {
            FeedbackSheet()
        }
        .sheet(isPresented: $showStoreEdit) {
            StoreInfoEditSheet(
                initialStoreName: store.storeName,
                initialOpen: storeBusinessOpen,
                initialClose: storeBusinessClose,
                industryCategoryId: store.category.rawValue
            ) { newName, newOpen, newClose in
                // 저장 성공 → 로컬 캐시 갱신
                store.updateStoreName(newName)
                storeBusinessOpen = newOpen
                storeBusinessClose = newClose
            }
        }
        .task {
            await refreshConnectionCount()
            await loadStoreHours()
        }
        .alert("계정을 삭제하시겠어요?", isPresented: $showDeleteConfirm) {
            Button("취소", role: .cancel) {}
            Button("삭제", role: .destructive) {
                guard let coordinator else { return }
                Task { await coordinator.deleteAccount() }
            }
        } message: {
            Text("모든 데이터가 영구 삭제됩니다. 되돌릴 수 없습니다.")
        }
        .alert("진행을 초기화하시겠어요?", isPresented: $showResetConfirm) {
            Button("취소", role: .cancel) {}
            Button("초기화", role: .destructive) {
                Task { await performReset() }
            }
        } message: {
            Text("모든 단계 결정·입력값·매출 기록이 삭제됩니다. 계정은 유지됩니다.")
        }
        .alert("초기화에 실패했습니다", isPresented: Binding(get: { resetFailedMsg != nil }, set: { if !$0 { resetFailedMsg = nil } })) {
            Button("확인", role: .cancel) { resetFailedMsg = nil }
        } message: {
            Text("서버 데이터가 그대로 유지되어 초기화를 중단했습니다. 데이터는 안전합니다 — 네트워크 확인 후 다시 시도해 주세요.\n\n\(resetFailedMsg ?? "")")
        }
    }

    // MARK: - 1. header (avatar + 이름 + 가게)

    private var header: some View {
        let session = coordinator?.currentSession
        let displayName: String = {
            if let n = session?.displayName, !n.isEmpty { return n }
            if let e = session?.email, !e.isEmpty { return e }
            return store.userName
        }()
        let initialChar: String = {
            let trimmed = displayName.trimmingCharacters(in: .whitespaces)
            return trimmed.first.map { String($0).uppercased() } ?? "?"
        }()
        let isAnonymous = session == nil

        return HStack(spacing: BUSpacing.md) {
            // 큰 아바타 원
            ZStack {
                Circle()
                    .fill(
                        isAnonymous
                        ? AnyShapeStyle(BUColor.midnight08)
                        : AnyShapeStyle(LinearGradient(
                            colors: [BUColor.midnight, BUColor.midnightDeep],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                    )
                    .frame(width: 64, height: 64)
                if isAnonymous {
                    Image(systemName: "person.crop.circle")
                        .font(.system(size: 28, weight: .regular))
                        .foregroundStyle(BUColor.inkMuted)
                } else {
                    Text(initialChar)
                        .font(.system(size: 26, weight: .bold))
                        .foregroundStyle(.white)
                }
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(isAnonymous ? "로그인이 필요합니다" : displayName)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                Text(store.storeName.isEmpty ? "가게 이름을 입력해 주세요" : store.storeName)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
        }
        .padding(.vertical, BUSpacing.xs)
    }

    // MARK: - 2. accountCard

    private var accountCard: some View {
        profileCard(eyebrow: "ACCOUNT · 계정", title: "계정 정보") {
            VStack(spacing: 0) {
                if let email = coordinator?.currentSession?.email, !email.isEmpty {
                    infoRow(label: "이메일", value: email, isMono: true)
                    divider
                } else {
                    infoRow(label: "이메일", value: "미로그인")
                    divider
                }
                infoRow(label: "로그인 방식", value: providerLabel)
                divider
                if let uid = coordinator?.currentSession?.userId {
                    infoRow(label: "사용자 ID", value: shortUserId(uid), isMono: true)
                    divider
                }
                HStack(alignment: .center) {
                    Text("계정 유형")
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(BUColor.inkSecondary)
                    Spacer(minLength: BUSpacing.sm)
                    AccountTypeBadge(isAnonymous: isAnonymousAccount)
                }
                .frame(minHeight: 44)
                .padding(.horizontal, BUSpacing.md)
            }
        }
    }

    private var providerLabel: String {
        guard let kind = coordinator?.currentSession?.provider else { return "—" }
        switch kind {
        case .apple: return "Apple"
        case .kakao: return "카카오"
        case .email: return "이메일"
        }
    }

    private var isAnonymousAccount: Bool {
        guard let session = coordinator?.currentSession else { return true }
        return session.email == nil || session.email?.isEmpty == true
    }

    private func shortUserId(_ uid: UUID) -> String {
        let prefix = uid.uuidString.prefix(8)
        return "\(prefix)…"
    }

    // MARK: - 3. journeyCard (내 여정 진행도 — 웹 156–184 미러)

    private var journeyCard: some View {
        profileCard(eyebrow: "MY JOURNEY · 내 여정", title: "진행 상황") {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .firstTextBaseline) {
                    Text("\(roadmap.completedCount)개 단계 완료")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                    Spacer(minLength: 0)
                    Text("\(progressPercent)%")
                        .font(.system(size: 22, weight: .heavy))
                        .tracking(-0.5)
                        .foregroundStyle(progressPercent >= 100
                            ? BUColor.success
                            : Color(red: 0, green: 0.478, blue: 1.0))
                }
                ProgressBar(percent: progressPercent)
                Text(journeySubtitle)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            }
            .padding(.horizontal, BUSpacing.md)
            .padding(.vertical, BUSpacing.sm + 4)
        }
    }

    private var progressPercent: Int {
        let total = max(1, roadmap.totalCount)
        let done = max(0, min(roadmap.completedCount, total))
        return Int((Double(done) / Double(total) * 100).rounded())
    }

    private var journeySubtitle: String {
        let total = roadmap.totalCount
        let prefix = total > 0 ? "전체 \(total)단계 중" : "단계 정보 로딩 중"
        let suffix = store.businessLaunched ? " · 개업 완료" : " · 창업 준비 중"
        return prefix + suffix
    }

    // MARK: - 4. storeCard (탭 → StoreInfoEditSheet)

    private var storeCard: some View {
        Button {
            showStoreEdit = true
        } label: {
            profileCard(eyebrow: "STORE · 가게", title: "가게 정보", trailing: {
                AnyView(
                    HStack(spacing: 4) {
                        Text("편집")
                            .font(.system(size: 11, weight: .heavy))
                        Image(systemName: "pencil")
                            .font(.system(size: 10, weight: .heavy))
                    }
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(BUColor.midnight.opacity(0.08), in: Capsule())
                )
            }) {
                VStack(spacing: 0) {
                    infoRow(label: "가게 이름", value: store.storeName.isEmpty ? "미입력" : store.storeName)
                    divider
                    infoRow(label: "업종", value: store.category.labelKo)
                    if !hideHoursForCategory {
                        divider
                        infoRow(label: "영업시간", value: businessHoursLabel)
                    }
                    divider
                    infoRow(
                        label: "운영 기간",
                        value: store.businessLaunched
                            ? "\(store.daysSinceLaunch)일째"
                            : "운영 시작 안 함"
                    )
                    divider
                    infoRow(
                        label: "현재 단계",
                        value: stageLabel
                    )
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var hideHoursForCategory: Bool {
        let raw = store.category.rawValue
        return raw == "ecommerce" || raw == "startupTech"
    }

    private var businessHoursLabel: String {
        if let o = storeBusinessOpen, let c = storeBusinessClose, !o.isEmpty, !c.isEmpty {
            return "\(o) – \(c)"
        }
        return "24시간 / 미설정"
    }

    private var stageLabel: String {
        guard store.businessLaunched else { return "창업 준비 중" }
        switch store.stage {
        case .early:  return "초기 운영"
        case .growth: return "성장기"
        case .mature: return "안정 운영"
        }
    }

    // MARK: - 의견 보내기 (인앱 피드백)

    private var feedbackCard: some View {
        Button { showFeedbackSheet = true } label: {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(BUColor.midnight08)
                        .frame(width: 40, height: 40)
                    Image(systemName: "bubble.left.and.text.bubble.right")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text("의견 보내기")
                        .font(.system(size: 14.5, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Text("불편한 점·제안 무엇이든 — 빠르게 반영하겠습니다")
                        .font(.system(size: 11.5))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineLimit(2)
                }
                Spacer(minLength: 8)
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(BUColor.inkMuted)
            }
            .padding(BUSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(Color.white.opacity(0.72)))
            .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    // MARK: - 3.5 dataConnectionCard (사장님 외부 데이터 자동 수집)

    private var dataConnectionCard: some View {
        Button { showDataConnections = true } label: {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(BUColor.midnight08)
                        .frame(width: 40, height: 40)
                    Image(systemName: "antenna.radiowaves.left.and.right")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text("데이터 연결")
                        .font(.system(size: 14.5, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Text("자체 서비스 데이터 자동 수집 — 매일 새벽 갱신")
                        .font(.system(size: 11.5))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineLimit(2)
                }
                Spacer(minLength: 8)
                if let n = connectionCount, n > 0 {
                    Text("현재 \(n)개 연결")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(BUColor.success)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(BUColor.success.opacity(0.10), in: Capsule())
                }
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(BUColor.inkMuted)
            }
            .padding(BUSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(Color.white.opacity(0.72))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(BUColor.cardBorder, lineWidth: 1)
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    // ── 가게 연결 (직원용) — 초대 코드 입력·받은 초대 (2026-07-12, 웹 StoreConnectCard 미러) ──
    private var storeConnectCard: some View {
        Button { showStoreConnect = true } label: {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(BUColor.midnight08)
                        .frame(width: 40, height: 40)
                    Image(systemName: "person.badge.key")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text("가게 연결 (직원용)")
                        .font(.system(size: 14.5, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Text("사장님께 받은 초대 코드로 직원 연결 — 근무표·연차")
                        .font(.system(size: 11.5))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineLimit(2)
                }
                Spacer(minLength: 8)
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(BUColor.inkMuted)
            }
            .padding(BUSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(Color.white.opacity(0.72))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(BUColor.cardBorder, lineWidth: 1)
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    @MainActor
    private func refreshConnectionCount() async {
        // 로그인 안 됐을 땐 조회 skip — 0 표시.
        guard BUSupabase.shared.currentSession != nil else {
            connectionCount = nil
            return
        }
        let repo = FunnelConnectionRepository(supabase: BUSupabase.shared.client)
        do {
            let rows = try await repo.listConnections()
            connectionCount = rows.count
        } catch {
            // 실패하면 배지 숨김 (조용히).
            connectionCount = nil
        }
    }

    // MARK: - 4. notificationCard

    private var notificationCard: some View {
        profileCard(eyebrow: "NOTIFICATIONS · 알림", title: "알림 설정") {
            VStack(spacing: 0) {
                toggleRow(
                    title: "매출 미입력 알림",
                    subtitle: "3일 이상 매출이 비면 알려드려요",
                    isOn: $notifStaleSales
                )
                divider
                toggleRow(
                    title: "세금 신고 임박",
                    subtitle: "신고 마감 7일 전부터 안내",
                    isOn: $notifTaxDeadline
                )
                divider
                toggleRow(
                    title: "인허가 만료 임박",
                    subtitle: "만료 30일 전부터 안내",
                    isOn: $notifPermitExpiry
                )
                divider
                toggleRow(
                    title: "매주 운영 점검",
                    subtitle: "월요일 아침 한 주 미리보기",
                    isOn: $notifWeeklyCheckup
                )
            }
        }
    }

    // MARK: - 4.5 ownerProfileCard (지원사업 매칭 — 출생연도·신용·폐업·장애, 로컬 전용·서버 미전송)

    private var ownerProfileCard: some View {
        profileCard(eyebrow: "OWNER · 사장님", title: "지원사업 매칭 정보") {
            VStack(alignment: .leading, spacing: 8) {
                Text("출생연도를 알려주시면 청년(만 39세 이하)·시니어(40세+) 전용 지원을 더 정확히 찾아드려요. 모두 선택 · 기기에만 저장.")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
                OwnerProfileChips(onChange: {})
            }
            .padding(.horizontal, BUSpacing.md)
            .padding(.vertical, BUSpacing.sm)
        }
    }

    // MARK: - 7. languageCard (ko/en 실제 토글 — @AppStorage 영구)

    private var languageCard: some View {
        profileCard(eyebrow: "LANGUAGE · 언어", title: "설정") {
            HStack(alignment: .center) {
                Text("언어")
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(BUColor.inkSecondary)
                Spacer(minLength: BUSpacing.sm)
                LanguageToggle(language: $language)
            }
            .frame(minHeight: 44)
            .padding(.horizontal, BUSpacing.md)
        }
    }

    // MARK: - 6. supportCard

    private var supportCard: some View {
        profileCard(eyebrow: "SUPPORT · 지원", title: "도움말 및 지원") {
            VStack(spacing: 0) {
                supportRow(
                    title: "이용약관",
                    url: URL(string: "https://foundone.dev/terms")
                )
                divider
                supportRow(
                    title: "개인정보처리방침",
                    url: URL(string: "https://foundone.dev/privacy")
                )
                divider
                supportRow(
                    title: "문의하기",
                    url: URL(string: "mailto:support@foundone.dev")
                )
                divider
                HStack {
                    Text("버전")
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(BUColor.inkSecondary)
                    Spacer(minLength: BUSpacing.sm)
                    Text(appVersionString)
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(BUColor.inkMuted)
                }
                .frame(minHeight: 44)
                .padding(.horizontal, BUSpacing.md)
            }
        }
    }

    private var appVersionString: String {
        let v = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "—"
        let b = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "—"
        return "\(v) (\(b))"
    }

    // MARK: - 9. accountActionsCard (진행 초기화 + 로그아웃 + 계정 삭제)

    private var accountActionsCard: some View {
        VStack(spacing: BUSpacing.sm) {
            // 진행 초기화 — 모든 사장님에게 노출 (anon 도 자기 데이터 지울 수 있음)
            Button {
                showResetConfirm = true
            } label: {
                HStack(spacing: 10) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("진행 초기화")
                            .font(.system(size: 14, weight: .heavy))
                            .foregroundStyle(BUColor.ink)
                        Text("모든 단계 결정·매출·캠페인 데이터를 초기화합니다")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineLimit(2)
                    }
                    Spacer(minLength: 8)
                    if resetting {
                        ProgressView().scaleEffect(0.85)
                    } else {
                        Text("초기화")
                            .font(.system(size: 12, weight: .heavy))
                            .foregroundStyle(BUColor.danger)
                            .padding(.horizontal, 12).padding(.vertical, 7)
                            .background(BUColor.danger.opacity(0.08), in: Capsule())
                    }
                }
                .padding(BUSpacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(Color.white.opacity(0.72))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .strokeBorder(BUColor.cardBorder, lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            .disabled(resetting)

            if coordinator != nil {
                Button {
                    guard let coordinator else { return }
                    Task { await coordinator.signOut() }
                } label: {
                    Text("로그아웃")
                        .font(BUFont.label)
                        .foregroundStyle(BUColor.inkSecondary)
                        .frame(maxWidth: .infinity, minHeight: 52)
                        .background(
                            RoundedRectangle(cornerRadius: BURadius.md, style: .continuous)
                                .fill(BUColor.surfaceElevated)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: BURadius.md, style: .continuous)
                                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
                        )
                }
                .buttonStyle(.plain)

                // 계정 삭제는 실계정만 — 익명 세션은 /api/account/delete 가 401 이므로 버튼 숨김.
                if !isAnonymousAccount {
                    Button {
                        showDeleteConfirm = true
                    } label: {
                        Text("계정 삭제")
                            .font(BUFont.label)
                            .foregroundStyle(BUColor.danger)
                            .frame(maxWidth: .infinity, minHeight: 52)
                            .background(
                                RoundedRectangle(cornerRadius: BURadius.md, style: .continuous)
                                    .fill(BUColor.danger.opacity(0.06))
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: BURadius.md, style: .continuous)
                                    .strokeBorder(BUColor.danger.opacity(0.20), lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.top, BUSpacing.xs)
    }

    // MARK: - Reset action

    @MainActor
    private func performReset() async {
        // 웹 패턴 미러 (resetDemo @ useSelectionHandlers.ts):
        //   1) 오버레이 표시 + 진행률 0 시작
        //   2) 서버 + 로컬 정리 작업 진행 (진행률 점진 증가)
        //   3) 진행률 1.0 도달 + "완료!" 잠시 유지
        //   4) 마지막 순간 store.resetAll() + clearAllAppStorage() 호출
        //      → AppRoot.needsOnboarding() = true → OnboardingFlow 마운트 (오버레이가 가려줌)
        //   5) 오버레이 fade-out → OnboardingChoiceView 가 자연스럽게 나타남
        //
        //   ⚠️ 4번을 마지막에 두는 이유: store.resetAll() 호출 즉시 AppRoot 가 ProfileView 를
        //      destroy 하므로 async 함수의 나머지 await 들이 끊어질 가능성. 모든 progress 애니메이션
        //      을 먼저 끝낸 뒤 마지막에 navigation 트리거.
        resetting = true
        resetCoordinator.start()
        defer { resetting = false }

        // ── ⓿ 준비 (0 → 0.20)
        await tick(to: 0.20, over: 0.25)

        // ── ① 서버 reset (0.20 → 0.85)
        //   ⚠️ 서버 삭제가 실패하면 *로컬을 지우지 않고 중단*. 로컬만 비우면 (a) 가짜 "완료" 표시,
        //      (b) 서버 데이터 잔존 → realtime/재로딩으로 부활 → "초기화 후 데이터 복구" 사장님 신고.
        //      web(useSelectionHandlers) 의 "검증 실패 시 reload 차단" 패턴 미러.
        let repo = AccountResetRepository(supabase: BUSupabase.shared.client)
        await tick(to: 0.30, over: 0.1)
        var serverFailMsg: String?
        var resetResultAt: String?
        do {
            let result = try await repo.resetAccount()
            if !result.coreFailures.isEmpty {
                serverFailMsg = "핵심 데이터가 서버에 남아있습니다: \(result.coreFailures.joined(separator: ", "))"
            } else {
                resetResultAt = result.resetAt
                await tick(to: 0.65, over: 0.25)
            }
        } catch {
            serverFailMsg = (error as? (any LocalizedError))?.errorDescription ?? error.localizedDescription
        }

        if let failMsg = serverFailMsg {
            // 서버 삭제 실패 → 로컬 보존 + 오버레이 중단 + 명확한 알림. (로컬·서버 일관성 유지)
            store.recordError("초기화 중단 — 서버 데이터 유지: \(failMsg)")
            resetCoordinator.stop()
            resetFailedMsg = failMsg
            return
        }

        // 초기화 표식(tombstone) — *이 기기*가 본 reset_at 저장. 없으면 재실행 시 본인 초기화를
        //   "다른 기기 초기화"로 오인해 불필요한 wipe 사이클. ("account." 접두사라 clearAllAppStorage 안 지움)
        if let ra = resetResultAt { UserDefaults.standard.set(ra, forKey: "account.reset.seen") }

        // ── ② 마무리 진행률 (0.65 → 1.0) — 시각적 완료감
        await tick(to: 0.95, over: 0.3)
        await tick(to: 1.0, over: 0.15)

        // "완료!" 메시지 잠시 유지
        try? await Task.sleep(nanoseconds: 600_000_000)

        // ── ③ 실제 로컬 정리 + navigation 트리거 (마지막에)
        //     이 시점에서 AppRoot 가 즉시 OnboardingFlow 로 전환되지만, 오버레이가 가려줌.
        store.resetAll()                  // DashboardStore — storeName / entries / costs 비움
        roadmap.clearAllAppStorage()      // 모든 stage @AppStorage 키 삭제
        storeInfo?.reset()                // 2026-05-25: StoreInfoStore in-memory state 초기화 —
                                          // 이걸 빠뜨리면 사장님 신고: "전부 초기화 후 상호명 잔존".

        // 짧은 holding — OnboardingFlow 가 mount 완료될 시간
        try? await Task.sleep(nanoseconds: 200_000_000)

        // ── ④ 오버레이 fade-out → OnboardingChoiceView 가 자연스럽게 노출
        resetCoordinator.stop()
    }

    /// progress 를 점진적으로 target 까지 증가 (over: 초). 60fps 가량.
    @MainActor
    private func tick(to target: Double, over seconds: Double) async {
        let steps = max(1, Int(seconds * 30))
        let start = resetCoordinator.progress
        let delta = target - start
        for i in 1...steps {
            let t = Double(i) / Double(steps)
            resetCoordinator.setProgress(start + delta * t)
            try? await Task.sleep(nanoseconds: UInt64((seconds / Double(steps)) * 1_000_000_000))
        }
    }

    // MARK: - Load store hours

    @MainActor
    private func loadStoreHours() async {
        guard let uid = BUSupabase.shared.currentUser?.id else { return }
        let repo = StoreProfileRepository(supabase: BUSupabase.shared.client, userId: uid)
        if let info = try? await repo.load() {
            storeBusinessOpen = info.businessOpenTime
            storeBusinessClose = info.businessCloseTime
        }
    }

    // MARK: - Reusable building blocks

    @ViewBuilder
    private func profileCard<Content: View>(
        eyebrow: String,
        title: String,
        trailing: (() -> AnyView)? = nil,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 4) {
                    BUEyebrow(eyebrow)
                    Text(title)
                        .font(BUFont.cardTitleSmall)
                        .foregroundStyle(BUColor.ink)
                }
                Spacer(minLength: 8)
                if let trailing { trailing() }
            }
            .padding(.horizontal, BUSpacing.md)
            .padding(.top, BUSpacing.md)
            .padding(.bottom, BUSpacing.sm)

            content()
        }
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.72))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }

    private var divider: some View {
        Rectangle()
            .fill(BUColor.borderSubtle)
            .frame(height: 1)
            .padding(.horizontal, BUSpacing.md)
    }

    private func infoRow(label: String, value: String, isMono: Bool = false) -> some View {
        HStack(alignment: .center) {
            Text(label)
                .font(.system(size: 13, weight: .regular))
                .foregroundStyle(BUColor.inkSecondary)
            Spacer(minLength: BUSpacing.sm)
            Text(value)
                .font(.system(size: 13, weight: .medium, design: isMono ? .monospaced : .default))
                .foregroundStyle(BUColor.ink)
                .multilineTextAlignment(.trailing)
                .lineLimit(1)
                .truncationMode(.middle)
        }
        .frame(minHeight: 44)
        .padding(.horizontal, BUSpacing.md)
    }

    private func toggleRow(title: String, subtitle: String, isOn: Binding<Bool>) -> some View {
        HStack(alignment: .center, spacing: BUSpacing.sm) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                Text(subtitle)
                    .font(.system(size: 12, weight: .regular))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineLimit(2)
            }
            Spacer(minLength: BUSpacing.sm)
            Toggle("", isOn: isOn)
                .labelsHidden()
                .tint(BUColor.midnight)
        }
        .frame(minHeight: 52)
        .padding(.horizontal, BUSpacing.md)
        .padding(.vertical, BUSpacing.xs)
    }

    @ViewBuilder
    private func supportRow(title: String, url: URL?) -> some View {
        if let url {
            Link(destination: url) {
                supportRowContent(title: title)
            }
            .buttonStyle(.plain)
        } else {
            supportRowContent(title: title)
        }
    }

    private func supportRowContent(title: String) -> some View {
        HStack {
            Text(title)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(BUColor.ink)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(BUColor.inkSubtle)
        }
        .frame(minHeight: 44)
        .padding(.horizontal, BUSpacing.md)
        .contentShape(Rectangle())
    }
}

// MARK: - Helper components

/// 계정 유형 배지 — 미로그인 (주황) / 등록 (초록).
private struct AccountTypeBadge: View {
    let isAnonymous: Bool

    var body: some View {
        let (label, fg, bg, border): (String, Color, Color, Color) = isAnonymous
            ? ("미로그인", BUColor.warn, BUColor.warn.opacity(0.10), BUColor.warn.opacity(0.2))
            : ("이메일 계정", BUColor.success, BUColor.success.opacity(0.10), BUColor.success.opacity(0.2))
        return Text(label)
            .font(.system(size: 11, weight: .heavy))
            .foregroundStyle(fg)
            .padding(.horizontal, 10).padding(.vertical, 3)
            .background(bg, in: Capsule())
            .overlay(Capsule().strokeBorder(border, lineWidth: 1))
    }
}

/// 진행도 막대 — 0–100, 100% 면 초록.
private struct ProgressBar: View {
    let percent: Int

    var body: some View {
        GeometryReader { proxy in
            let w = proxy.size.width
            let clamped = max(0, min(100, percent))
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(BUColor.ink.opacity(0.07))
                RoundedRectangle(cornerRadius: 4)
                    .fill(
                        clamped >= 100
                            ? AnyShapeStyle(BUColor.success)
                            : AnyShapeStyle(LinearGradient(
                                colors: [Color(red: 0, green: 0.478, blue: 1.0), Color(red: 0.353, green: 0.784, blue: 0.98)],
                                startPoint: .leading, endPoint: .trailing
                            ))
                    )
                    .frame(width: w * CGFloat(clamped) / 100)
                    .animation(.easeOut(duration: 0.4), value: clamped)
            }
        }
        .frame(height: 6)
    }
}

/// 언어 토글 — 한국어 / English 두 버튼.
private struct LanguageToggle: View {
    @Binding var language: String

    var body: some View {
        HStack(spacing: 6) {
            languageButton(code: "ko", label: "한국어")
            languageButton(code: "en", label: "English")
        }
    }

    private func languageButton(code: String, label: String) -> some View {
        Button {
            language = code
        } label: {
            Text(label)
                .font(.system(size: 12, weight: .heavy))
                .foregroundStyle(language == code ? .white : BUColor.inkMuted)
                .padding(.horizontal, 14).padding(.vertical, 6)
                .background(
                    language == code
                        ? AnyShapeStyle(Color(red: 0, green: 0.478, blue: 1.0))
                        : AnyShapeStyle(Color.clear),
                    in: RoundedRectangle(cornerRadius: 8)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .strokeBorder(language == code ? Color.clear : BUColor.cardBorder, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }
}
