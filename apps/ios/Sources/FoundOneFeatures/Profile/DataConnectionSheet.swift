//
//  DataConnectionSheet.swift — 사장님 데이터 연결 hub
//
//  현재 활성: Custom Pull URL (사장님 endpoint).
//  추후 출시: Cafe24 / 네이버 / Stripe / Supabase / GA4 (placeholder).
//
//  Flow:
//   • 카드 탭 → 해당 sub-sheet open (현재 pull 만 구현)
//   • 등록된 연결 목록 표시 + 해제 버튼
//

import SwiftUI
import FoundOneCore
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct DataConnectionSheet: View {

    @Environment(\.dismiss) private var dismiss

    @State private var connections: [SaasConnection] = []
    @State private var isLoading: Bool = true
    @State private var loadError: String?
    @State private var showCustomPullSetup: Bool = false
    @State private var showCsvUpload: Bool = false
    @State private var showPortOneConnect: Bool = false
    @State private var portOneStatus: PortOneStatusResponse?
    // P0-D: Toss Payments
    @State private var showTossConnect: Bool = false
    @State private var tossStatus: TossStatusResponse?
    // P0-D: Toss Place
    @State private var showTossPlaceConnect: Bool = false
    @State private var tossPlaceStatus: TossPlaceStatusResponse?
    // P0-D: Popbill
    @State private var showPopbillConnect: Bool = false
    @State private var popbillConn: PopbillConnectionInfo?
    // P0-D: Codef
    @State private var showCodefConnect: Bool = false
    @State private var codefStatus: CodefStatusResponse?
    @State private var pendingDeleteId: UUID?
    @State private var toastMessage: String?
    @State private var comingSoonName: String?

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.lg) {
                        introBlock
                        existingConnectionsBlock
                        availableSection
                        // 2026-08-19 심사 대비: 15개 "곧 출시" 타일(탭→준비 중 알림)은 2.1 placeholder 지적 요인 → 한 줄 안내로 축소
                        comingSoonNote
                        Color.clear.frame(height: 60)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
                if let toast = toastMessage {
                    toastView(toast)
                        .padding(.bottom, 28)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .navigationTitle("데이터 연결")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }
                        .foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .confirmationAction) {
                    Button("닫기") { dismiss() }
                }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .sheet(isPresented: $showCustomPullSetup) {
            CustomPullSetupSheet(onSaved: {
                showToast("연결되었습니다.")
                Task { await loadConnections() }
            })
        }
        .sheet(isPresented: $showCsvUpload) {
            CsvUploadSheet(onUploaded: {
                showToast("업로드 완료 — 매출 흐름에 반영됐어요.")
            })
        }
        .sheet(isPresented: $showPortOneConnect) {
            PortOneConnectSheet(onConnected: {
                showToast("포트원 연결 완료 — 결제 데이터가 자동으로 들어옵니다.")
                Task { await loadPortOneStatus() }
            })
        }
        // P0-D: Toss Payments
        .sheet(isPresented: $showTossConnect) {
            TossConnectSheet(onConnected: {
                showToast("토스페이먼츠 연결 완료 — 결제 데이터가 자동으로 들어옵니다.")
                Task { await loadTossStatus() }
            })
        }
        // P0-D: Toss Place
        .sheet(isPresented: $showTossPlaceConnect) {
            TossPlaceConnectSheet(onConnected: {
                showToast("TOSS Place 연결 완료 — 단말기 매출이 자동으로 들어옵니다.")
                Task { await loadTossPlaceStatus() }
            })
        }
        // P0-D: Popbill
        .sheet(isPresented: $showPopbillConnect) {
            PopbillConnectSheet(onConnected: {
                showToast("홈택스 수집 등록 완료 — 세금계산서·현금영수증이 매일 들어옵니다.")
                Task { await loadPopbillStatus() }
            })
        }
        // P0-D: Codef
        .sheet(isPresented: $showCodefConnect) {
            CodefConnectSheet(onConnected: {
                showToast("카드사 연결 완료 — 10개 카드사 매출이 매일 자동으로 들어옵니다.")
                Task { await loadCodefStatus() }
            })
        }
        .alert(
            "연결을 해제할까요?",
            isPresented: deleteAlertBinding,
            presenting: pendingDeleteId
        ) { id in
            Button("해제", role: .destructive) {
                Task { await deleteConnection(id: id) }
            }
            Button("취소", role: .cancel) { pendingDeleteId = nil }
        } message: { _ in
            Text("매일 새벽 자동 수집이 멈춥니다. 다시 등록할 수 있어요.")
        }
        .alert(
            "곧 출시 예정",
            isPresented: comingSoonAlertBinding,
            presenting: comingSoonName
        ) { _ in
            Button("확인", role: .cancel) { comingSoonName = nil }
        } message: { name in
            Text("\(name) 연동은 준비 중입니다. 그 전까지는 '내 서버 URL' 로 연결해주세요.")
        }
        .task {
            await loadConnections()
            async let p1: () = loadPortOneStatus()
            async let p2: () = loadTossStatus()
            async let p3: () = loadTossPlaceStatus()
            async let p4: () = loadPopbillStatus()
            async let p5: () = loadCodefStatus()
            _ = await (p1, p2, p3, p4, p5)
        }
    }

    // MARK: - Intro

    private var introBlock: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("사장님 서비스 데이터 자동 가져오기")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(BUColor.ink)
                .tracking(-0.3)
            Text("매일 새벽 자동 수집 — 입력이 필요 없습니다.")
                .font(.system(size: 13))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(2)
        }
    }

    // MARK: - Existing connections

    @ViewBuilder
    private var existingConnectionsBlock: some View {
        if isLoading {
            HStack(spacing: 8) {
                ProgressView().controlSize(.small)
                Text("연결 목록 불러오는 중...")
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkMuted)
            }
            .padding(.vertical, 4)
        } else if let err = loadError {
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(BUColor.danger)
                Text(err)
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                Spacer()
                Button("다시 시도") { Task { await loadConnections() } }
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
            .padding(12)
            .background(BUColor.danger.opacity(0.06), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        } else if !connections.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "link")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(BUColor.midnight)
                    Text("연결된 데이터 소스")
                        .font(.system(size: 11, weight: .heavy))
                        .tracking(0.5)
                        .foregroundStyle(BUColor.midnight)
                    Spacer()
                    Text("\(connections.count)개")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(BUColor.inkMuted)
                }

                VStack(spacing: 8) {
                    ForEach(connections) { conn in
                        connectionRow(conn)
                    }
                }
            }
        }
    }

    private func connectionRow(_ conn: SaasConnection) -> some View {
        let title = conn.connectionLabel?.isEmpty == false ? conn.connectionLabel! : sourceDisplayName(conn.source)
        let statusText: String = {
            switch conn.status {
            case "active":   return "활성"
            case "paused":   return "일시중지"
            case "error":    return "오류"
            default:         return conn.status ?? "—"
            }
        }()
        let statusColor: Color = {
            switch conn.status {
            case "active": return BUColor.success
            case "error":  return BUColor.danger
            default:       return BUColor.inkMuted
            }
        }()
        return HStack(alignment: .center, spacing: 12) {
            ZStack {
                Circle()
                    .fill(BUColor.midnight08)
                    .frame(width: 36, height: 36)
                Image(systemName: sourceIcon(conn.source))
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                    .lineLimit(1)
                HStack(spacing: 6) {
                    Circle().fill(statusColor).frame(width: 5, height: 5)
                    Text(statusText)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(statusColor)
                    if let url = conn.endpointUrl, !url.isEmpty {
                        Text("·")
                            .font(.system(size: 11))
                            .foregroundStyle(BUColor.inkMuted)
                        Text(displayHost(url))
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineLimit(1)
                            .truncationMode(.middle)
                    }
                }
            }
            Spacer(minLength: 0)
            Button {
                pendingDeleteId = conn.id
            } label: {
                Image(systemName: "link.badge.minus")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("연결 해제")
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color.white.opacity(0.78), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }

    // MARK: - Available

    private var availableSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            sectionEyebrow("사용 가능한 채널")

            // 1) CSV/Excel 업로드 — PG/POS 없는 모든 사장님의 fallback (2026-05-27 P0-B 추가)
            Button { showCsvUpload = true } label: {
                connectionTile(
                    iconSystemName: "doc.badge.arrow.up",
                    iconBackground: BUColor.success,
                    title: "엑셀/CSV 업로드",
                    badgeText: "누구나",
                    badgeColor: BUColor.midnight,
                    subtitle: "엑셀·구글시트 export 그대로. 헤더 자동 인식."
                )
            }
            .buttonStyle(.plain)

            // 2) 포트원 V2 결제 자동 동기화 (2026-05-27 P0-C 추가)
            Button { showPortOneConnect = true } label: {
                connectionTile(
                    iconSystemName: "wallet.pass.fill",
                    iconBackground: BUColor.midnight,
                    title: portOneTitle,
                    badgeText: portOneBadge,
                    badgeColor: portOneBadgeColor,
                    subtitle: portOneSubtitle
                )
            }
            .buttonStyle(.plain)

            // 3) 토스페이먼츠 — PG 4강 (P0-D)
            Button { showTossConnect = true } label: {
                connectionTile(
                    iconSystemName: "wonsign.circle.fill",
                    iconBackground: BUColor.midnight,
                    title: tossTitle,
                    badgeText: tossBadge,
                    badgeColor: tossBadgeColor,
                    subtitle: tossSubtitle
                )
            }
            .buttonStyle(.plain)

            // 4) TOSS Place — 단말기 사장님 (P0-D)
            Button { showTossPlaceConnect = true } label: {
                connectionTile(
                    iconSystemName: "iphone.gen3",
                    iconBackground: Color(red: 0, green: 0.39, blue: 1.0),
                    title: tossPlaceTitle,
                    badgeText: tossPlaceBadge,
                    badgeColor: tossPlaceBadgeColor,
                    subtitle: tossPlaceSubtitle
                )
            }
            .buttonStyle(.plain)

            // 5) 홈택스 자동 수집 (팝빌) — 세금계산서·현금영수증 (P0-D)
            Button { showPopbillConnect = true } label: {
                connectionTile(
                    iconSystemName: "doc.text.fill",
                    iconBackground: Color(red: 0.12, green: 0.17, blue: 0.33),
                    title: popbillTitle,
                    badgeText: popbillBadge,
                    badgeColor: popbillBadgeColor,
                    subtitle: popbillSubtitle
                )
            }
            .buttonStyle(.plain)

            // 6) 10개 카드사 자동 (CODEF) — 여신금융협회 통합조회 (P0-D)
            Button { showCodefConnect = true } label: {
                connectionTile(
                    iconSystemName: "creditcard.and.123",
                    iconBackground: BUColor.warn,
                    title: codefTitle,
                    badgeText: codefBadge,
                    badgeColor: codefBadgeColor,
                    subtitle: codefSubtitle
                )
            }
            .buttonStyle(.plain)

            // 7) 내 서버 URL 직접 입력 (Pull API) — 개발팀 있는 사장님
            Button { showCustomPullSetup = true } label: {
                connectionTile(
                    iconSystemName: "server.rack",
                    iconBackground: BUColor.midnight,
                    title: "내 서버 URL 직접 입력",
                    badgeText: "개발자",
                    badgeColor: BUColor.midnight,
                    subtitle: "사장님 endpoint 노출 후 등록 — 어떤 서비스든 가능"
                )
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: - PortOne tile state (P0-C)

    private var portOneConnected: Bool {
        portOneStatus?.connected == true
    }

    private var portOneTitle: String {
        portOneConnected ? "포트원 연결됨" : "포트원 V2 자동 동기화"
    }

    private var portOneBadge: String {
        if portOneConnected {
            return "활성"
        }
        return "PG 사용자"
    }

    private var portOneBadgeColor: Color {
        portOneConnected ? BUColor.success : BUColor.midnight
    }

    private var portOneSubtitle: String {
        if portOneConnected {
            if let count = portOneStatus?.paymentCount30d {
                return "최근 30일 \(count)건 동기화 · 매일 자동"
            }
            return "매일 자동 동기화 중"
        }
        return "Read-only Secret 연결 → 결제·환불 자동 매출 반영"
    }

    private func loadPortOneStatus() async {
        guard BUSupabase.shared.currentUser != nil else { return }
        let repo = PortOneRepository(supabase: BUSupabase.shared.client)
        do { portOneStatus = try await repo.fetchStatus() }
        catch { portOneStatus = nil }
    }

    // MARK: - P0-D tile state: Toss Payments

    private var tossConnected: Bool { tossStatus?.connected == true }

    private var tossTitle: String {
        tossConnected ? "토스페이먼츠 연결됨" : "토스페이먼츠 자동 동기화"
    }
    private var tossBadge: String { tossConnected ? "활성" : "PG 사용자" }
    private var tossBadgeColor: Color { tossConnected ? BUColor.success : BUColor.midnight }
    private var tossSubtitle: String {
        if tossConnected {
            if let count = tossStatus?.eventCount30d { return "최근 30일 \(count)건 동기화 · 매일 자동" }
            return "매일 자동 동기화 중"
        }
        return "Secret Key 연결 → 결제·취소 자동 매출 반영 (test_sk_... / live_sk_...)"
    }

    private func loadTossStatus() async {
        guard BUSupabase.shared.currentUser != nil else { return }
        let repo = TossRepository(supabase: BUSupabase.shared.client)
        do { tossStatus = try await repo.fetchStatus() }
        catch { tossStatus = nil }
    }

    // MARK: - P0-D tile state: Toss Place

    private var tossPlaceConnected: Bool { tossPlaceStatus?.connected == true }

    private var tossPlaceTitle: String {
        tossPlaceConnected ? "TOSS Place 연결됨" : "TOSS Place 단말기 연동"
    }
    private var tossPlaceBadge: String { tossPlaceConnected ? "활성" : "단말기 사장님" }
    private var tossPlaceBadgeColor: Color { tossPlaceConnected ? BUColor.success : Color(red: 0, green: 0.39, blue: 1.0) }
    private var tossPlaceSubtitle: String {
        if tossPlaceConnected {
            if let count = tossPlaceStatus?.paymentCount30d { return "최근 30일 \(count)건 동기화 · 매일 자동" }
            return "매일 자동 동기화 중"
        }
        return "토스 단말기 매출 자동 수집 — developer.tossplace.com 에서 Access Key 발급"
    }

    private func loadTossPlaceStatus() async {
        guard BUSupabase.shared.currentUser != nil else { return }
        let repo = TossPlaceRepository(supabase: BUSupabase.shared.client)
        do { tossPlaceStatus = try await repo.fetchStatus() }
        catch { tossPlaceStatus = nil }
    }

    // MARK: - P0-D tile state: Popbill

    private var popbillActive: Bool { popbillConn?.status == "active" }

    private var popbillTitle: String {
        popbillActive ? "홈택스 수집 연결됨" : "홈택스 자동 수집 (팝빌)"
    }
    private var popbillBadge: String { popbillActive ? "활성" : "사업자 등록 필요" }
    private var popbillBadgeColor: Color { popbillActive ? BUColor.success : Color(red: 0.12, green: 0.17, blue: 0.33) }
    private var popbillSubtitle: String {
        if popbillActive {
            return "세금계산서·현금영수증 매일 자동 수집"
        }
        if popbillConn?.status == "pending" {
            return "팝빌 인증서 위임 대기 중 — 팝빌에서 홈택스 인증서를 등록해 주세요"
        }
        return "사업자번호 등록 1회로 세금계산서·현금영수증 매출 자동 수집"
    }

    private func loadPopbillStatus() async {
        guard BUSupabase.shared.currentUser != nil else { return }
        let repo = PopbillRepository(supabase: BUSupabase.shared.client)
        do {
            let resp = try await repo.fetchStatus()
            popbillConn = resp.connection
        }
        catch { popbillConn = nil }
    }

    // MARK: - P0-D tile state: Codef

    private var codefConnected: Bool { codefStatus?.connected == true }

    private var codefTitle: String {
        codefConnected ? "카드사 연결됨" : "10개 카드사 자동 동기화"
    }
    private var codefBadge: String { codefConnected ? "활성" : "베타" }
    private var codefBadgeColor: Color { codefConnected ? BUColor.success : BUColor.warn }
    private var codefSubtitle: String {
        if codefConnected {
            if let count = codefStatus?.salesCount30d { return "최근 30일 \(count)건 카드매출 · 매일 자동" }
            return "KB·신한·삼성·현대·롯데·하나 등 10개 카드사 매일 자동"
        }
        return "KB·신한·삼성·현대·롯데 등 10개 카드사 — 사업자번호 + 생년월일 + 계좌 1개로 연결"
    }

    private func loadCodefStatus() async {
        guard BUSupabase.shared.currentUser != nil else { return }
        let repo = CodefRepository(supabase: BUSupabase.shared.client)
        do { codefStatus = try await repo.fetchStatus() }
        catch { codefStatus = nil }
    }

    /// 사용 가능한 채널 행 — 카드 UI 통일 (2026-05-27 P0-B 에서 추출).
    private func connectionTile(
        iconSystemName: String,
        iconBackground: Color,
        title: String,
        badgeText: String,
        badgeColor: Color,
        subtitle: String
    ) -> some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(iconBackground)
                    .frame(width: 44, height: 44)
                Image(systemName: iconSystemName)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(.white)
            }
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(title)
                        .font(.system(size: 14.5, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Text(badgeText)
                        .font(.system(size: 9, weight: .heavy))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(badgeColor, in: Capsule())
                }
                Text(subtitle)
                    .font(.system(size: 11.5))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
                    .multilineTextAlignment(.leading)
            }
            Spacer(minLength: 0)
            Image(systemName: "chevron.right")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(BUColor.inkMuted)
        }
        .padding(BUSpacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.85), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.18), lineWidth: 1)
        )
    }

    // MARK: - Coming soon

    private struct ComingSoonItem: Identifiable {
        let id: String
        let title: String
        let subtitle: String
        let icon: String
    }

    // 2026-05-19 v2: 한국 실제 시장 점유율 검증 후 재정렬 (WebSearch 기반).
    //   - Cafe24: 자체몰 70% (압도적 1위)
    //   - GA4: 분석 압도적 1위 (UA 후속)
    //   - 쿠팡 23% > 네이버 스마트스토어 20.7%
    //   - PG 빅4 (KG이니시스 19만 가맹점 / NHN KCP / 토스 / 나이스)
    //   - Stripe 한국 점유율 미미 → 후순위
    private let comingSoonItems: [ComingSoonItem] = [
        .init(id: "cafe24",     title: "Cafe24",            subtitle: "자체몰 70% · 주문·고객·통계",      icon: "cart"),
        .init(id: "ga4",        title: "GA4",               subtitle: "분석 1위 · 방문·세션",             icon: "chart.line.uptrend.xyaxis"),
        .init(id: "coupang",    title: "쿠팡 Wing",          subtitle: "마켓 1위 23%",                    icon: "shippingbox"),
        .init(id: "naver",      title: "네이버 스마트스토어",   subtitle: "마켓 2위 20.7%",                  icon: "storefront"),
        .init(id: "kg_inicis",  title: "KG이니시스",            subtitle: "PG 최대 (19만 가맹점)",            icon: "creditcard"),
        .init(id: "nhn_kcp",    title: "NHN KCP",           subtitle: "PG 4강",                          icon: "creditcard.and.123"),
        .init(id: "nice_pay",   title: "나이스페이먼츠",        subtitle: "PG 4강 · 포스타트 프로그램",         icon: "building.columns"),
        .init(id: "kakao_pay",  title: "카카오페이",            subtitle: "간편결제",                        icon: "message.fill"),
        .init(id: "naver_pay",  title: "네이버페이",            subtitle: "간편결제",                        icon: "n.circle.fill"),
        .init(id: "imweb",      title: "아임웹",                subtitle: "자체몰 신흥",                     icon: "globe"),
        .init(id: "mixpanel",   title: "Mixpanel",          subtitle: "스타트업 분석 · 6천만 credit",       icon: "chart.bar.xaxis"),
        .init(id: "amplitude",  title: "Amplitude",         subtitle: "전사 데이터팀 표준",                icon: "waveform.path"),
        .init(id: "supabase",   title: "Supabase",          subtitle: "사장님 자체 DB",                   icon: "cylinder.split.1x2"),
        .init(id: "firebase",   title: "Firebase",          subtitle: "사장님 자체 DB",                   icon: "flame"),
        .init(id: "stripe",     title: "Stripe Connect",    subtitle: "글로벌 SaaS",                      icon: "globe.americas"),
    ]

    private var comingSoonNote: some View {
        Text("Cafe24·GA4·쿠팡·네이버·PG 등 추가 연동은 순차 지원 예정이에요. 그 전까진 CSV·내 서버 URL 연결을 이용해 주세요.")
            .font(.system(size: 12))
            .foregroundStyle(BUColor.inkMuted)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 4)
            .padding(.top, 4)
    }

    @ViewBuilder private var comingSoonSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            sectionEyebrow("곧 출시")
            VStack(spacing: 0) {
                ForEach(Array(comingSoonItems.enumerated()), id: \.element.id) { idx, item in
                    Button { comingSoonName = item.title } label: {
                        HStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(BUColor.midnight.opacity(0.06))
                                    .frame(width: 32, height: 32)
                                Image(systemName: item.icon)
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(BUColor.inkMuted)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.title)
                                    .font(.system(size: 13.5, weight: .semibold))
                                    .foregroundStyle(BUColor.ink)
                                Text(item.subtitle)
                                    .font(.system(size: 11))
                                    .foregroundStyle(BUColor.inkMuted)
                            }
                            Spacer(minLength: 0)
                            Text("곧 출시")
                                .font(.system(size: 10, weight: .heavy))
                                .tracking(0.4)
                                .foregroundStyle(BUColor.inkMuted)
                                .padding(.horizontal, 7)
                                .padding(.vertical, 3)
                                .background(BUColor.midnight.opacity(0.06), in: Capsule())
                        }
                        .padding(.horizontal, BUSpacing.md)
                        .frame(minHeight: 56)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    if idx < comingSoonItems.count - 1 {
                        Divider().background(BUColor.borderSubtle).padding(.horizontal, BUSpacing.md)
                    }
                }
            }
            .background(Color.white.opacity(0.65), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(BUColor.cardBorder, lineWidth: 1)
            )
        }
    }

    // MARK: - Helpers (UI)

    private func sectionEyebrow(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 11, weight: .heavy))
            .tracking(0.5)
            .foregroundStyle(BUColor.midnight.opacity(0.7))
    }

    private func sourceDisplayName(_ source: String) -> String {
        switch source {
        case "custom_pull": return "내 서버 (Pull)"
        case "ga4":         return "GA4"
        case "cafe24":      return "Cafe24"
        case "naver":       return "네이버 스마트스토어"
        case "stripe":      return "Stripe"
        case "supabase":    return "Supabase"
        default:            return source
        }
    }

    private func sourceIcon(_ source: String) -> String {
        switch source {
        case "custom_pull": return "server.rack"
        case "ga4":         return "chart.line.uptrend.xyaxis"
        case "cafe24":      return "cart"
        case "naver":       return "storefront"
        case "stripe":      return "creditcard"
        case "supabase":    return "cylinder.split.1x2"
        default:            return "link"
        }
    }

    private func displayHost(_ urlString: String) -> String {
        if let u = URL(string: urlString), let host = u.host { return host }
        return urlString
    }

    private func toastView(_ text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white)
            Text(text)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.white)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(BUColor.midnight, in: Capsule())
        .shadow(color: BUColor.midnight.opacity(0.2), radius: 14, y: 6)
    }

    // MARK: - Bindings

    private var deleteAlertBinding: Binding<Bool> {
        Binding(
            get: { pendingDeleteId != nil },
            set: { if !$0 { pendingDeleteId = nil } }
        )
    }

    private var comingSoonAlertBinding: Binding<Bool> {
        Binding(
            get: { comingSoonName != nil },
            set: { if !$0 { comingSoonName = nil } }
        )
    }

    // MARK: - Data actions

    @MainActor
    private func loadConnections() async {
        isLoading = true
        loadError = nil
        let repo = FunnelConnectionRepository(supabase: BUSupabase.shared.client, baseURL: BUSupabase.shared.env.webAppURL)
        do {
            connections = try await repo.listConnections()
        } catch let e as FunnelConnectionError {
            loadError = e.errorDescription ?? "목록을 불러오지 못했습니다."
        } catch {
            loadError = error.localizedDescription
        }
        isLoading = false
    }

    @MainActor
    private func deleteConnection(id: UUID) async {
        let repo = FunnelConnectionRepository(supabase: BUSupabase.shared.client, baseURL: BUSupabase.shared.env.webAppURL)
        do {
            try await repo.deletePullConnection(connectionId: id)
            pendingDeleteId = nil
            showToast("연결이 해제되었습니다.")
            await loadConnections()
        } catch let e as FunnelConnectionError {
            pendingDeleteId = nil
            loadError = e.errorDescription ?? "해제에 실패했습니다."
        } catch {
            pendingDeleteId = nil
            loadError = error.localizedDescription
        }
    }

    @MainActor
    private func showToast(_ text: String) {
        withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
            toastMessage = text
        }
        Task {
            try? await Task.sleep(nanoseconds: 2_500_000_000)
            await MainActor.run {
                withAnimation(.easeOut(duration: 0.25)) {
                    toastMessage = nil
                }
            }
        }
    }
}

#if DEBUG
#Preview {
    DataConnectionSheet()
}
#endif
