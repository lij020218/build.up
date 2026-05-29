//
//  ConversionFunnelFocusCard.swift — 온라인/SaaS funnel 전환율 (Today 7번째 슬롯, 업종 분기)
//
//  사장님 결정 (2026-05-19):
//   • 온라인/SaaS 는 "전환율" 이 가장 본질적인 지표 — 운영 대시보드에 반드시 반영.
//   • 매출은 funnel 의 최종 결과물 — funnel 단계별 이탈률을 봐야 무엇을 고칠지 보임.
//
//  웹 SSOT:
//   - apps/web/app/lib/components/dashboard/EcommerceConversionCard.tsx (305줄)
//   - apps/web/app/lib/components/dashboard/StartupMetricsCard.tsx (137줄)
//
//  Mode 별 funnel 단계:
//   - .commerce (ecommerce):  방문 → 장바구니 → 결제 시작 → 구매
//   - .saas (startupTech):    방문 → 가입 → 활성화 → 유료
//
//  startup-tech 의 경우 런웨이(Cash Zero Date)도 우상단 mini chip 으로 유지.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents
import FoundOneData

public struct ConversionFunnelFocusCard: View {

    public enum Mode {
        case commerce   // ecommerce (스마트스토어·자체몰)
        case saas       // startup-tech (SaaS·앱)
    }

    let mock: MockData
    let mode: Mode

    // Phase 1 — 수동 입력 (UserDefaults).
    // Phase 2 (예정): GA4 OAuth + Custom Webhook → saas_metrics_* Supabase 테이블.
    @AppStorage("funnel.commerce.visitors")    private var commerceVisitors: Int    = 0
    @AppStorage("funnel.commerce.carts")       private var commerceCarts: Int       = 0
    @AppStorage("funnel.commerce.checkouts")   private var commerceCheckouts: Int   = 0
    @AppStorage("funnel.commerce.purchases")   private var commercePurchases: Int   = 0

    @AppStorage("funnel.saas.visitors")        private var saasVisitors: Int        = 0
    @AppStorage("funnel.saas.signups")         private var saasSignups: Int         = 0
    @AppStorage("funnel.saas.activations")     private var saasActivations: Int     = 0
    @AppStorage("funnel.saas.paid")            private var saasPaid: Int            = 0

    @State private var showEditSheet = false

    public init(mock: MockData, mode: Mode) {
        self.mock = mock
        self.mode = mode
    }

    // MARK: - Step labels per mode

    private var stepLabels: [String] {
        switch mode {
        case .commerce: return ["방문", "장바구니", "결제 시작", "구매"]
        case .saas:     return ["방문", "가입", "활성화", "유료"]
        }
    }

    /// 우선순위:
    ///  1) 사장님 수동 입력값 (UserDefaults — Phase 1)
    ///  2) Phase 2 (예정): GA4 / Webhook 에서 적재된 saas_metrics_*
    ///  3) Fallback: sample (입력 전 카드가 비어보이지 않도록 light demo)
    private var stepValues: [Int] {
        let manual: [Int]
        switch mode {
        case .commerce: manual = [commerceVisitors, commerceCarts, commerceCheckouts, commercePurchases]
        case .saas:     manual = [saasVisitors, saasSignups, saasActivations, saasPaid]
        }
        // 입력값이 모두 0 이면 sample 표시 (입력 안내가 뜸)
        if manual.allSatisfy({ $0 == 0 }) {
            switch mode {
            case .commerce: return [1240, 396, 148, 39]
            case .saas:     return [2480, 287, 98, 23]
            }
        }
        return manual
    }

    private var isManualEmpty: Bool {
        switch mode {
        case .commerce: return commerceVisitors == 0 && commerceCarts == 0 && commerceCheckouts == 0 && commercePurchases == 0
        case .saas:     return saasVisitors == 0 && saasSignups == 0 && saasActivations == 0 && saasPaid == 0
        }
    }

    /// WoW 변화 (sample)
    private var conversionWoWPct: Double {
        switch mode {
        case .commerce: return 0.4    // +0.4%p
        case .saas:     return -0.2   // -0.2%p
        }
    }

    private var overallConvPct: Double {
        guard let first = stepValues.first, first > 0, let last = stepValues.last else { return 0 }
        return Double(last) / Double(first) * 100
    }

    /// 산업 평균 (benchmark) — 메시지 톤 결정용
    private var benchmarkPct: Double {
        switch mode {
        case .commerce: return 2.0  // 이커머스 평균 ~2-3%
        case .saas:     return 1.0  // SaaS trial→paid 평균 ~1-3%
        }
    }

    private var grade: HealthGrade {
        let ratio = overallConvPct / benchmarkPct
        if ratio >= 1.5 { return .healthy }
        if ratio >= 1.0 { return .caution }
        if ratio >= 0.6 { return .warning }
        return .critical
    }

    // MARK: - Cash Zero Date (startup-tech only, mini chip)

    private var monthlyBurn: Double {
        let totalRev = mock.entries.reduce(0.0) { $0 + $1.sales }
        let dailyAvg = mock.entries.isEmpty ? 0 : totalRev / Double(mock.entries.count)
        return mock.costs.total - dailyAvg * 26
    }

    private var daysUntilZero: Int? {
        guard let cash = mock.currentCash, monthlyBurn > 0 else { return nil }
        let dailyBurn = monthlyBurn / 30
        return dailyBurn > 0 ? Int(cash / dailyBurn) : nil
    }

    // MARK: - Body

    public var body: some View {
        let palette = HealthColors.palette(for: grade)

        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                headerRow(palette: palette)
                primaryMetricRow(palette: palette)
                funnelBars
                if isManualEmpty {
                    manualEntryCTA
                } else {
                    messageRow
                }
            }
        }
        .sheet(isPresented: $showEditSheet) {
            FunnelManualInputSheet(mode: mode)
        }
    }

    // MARK: - Manual entry CTA (when no data)

    private var manualEntryCTA: some View {
        Button { showEditSheet = true } label: {
            HStack(spacing: 8) {
                Image(systemName: "square.and.pencil")
                    .font(.system(size: 13, weight: .semibold))
                Text("내 가게 funnel 입력하기")
                    .font(.system(size: 12.5, weight: .heavy))
                Spacer(minLength: 0)
                Image(systemName: "chevron.right")
                    .font(.system(size: 10, weight: .bold))
            }
            .foregroundStyle(BUColor.midnight)
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(BUColor.midnight08, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(BUColor.midnight.opacity(0.18), style: StrokeStyle(lineWidth: 1, dash: [4, 3]))
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Header

    private func headerRow(palette: HealthColorPalette) -> some View {
        HStack(spacing: 10) {
            ZStack {
                Circle().fill(palette.dot.opacity(0.15)).frame(width: 36, height: 36)
                Image(systemName: mode == .commerce ? "cart.fill" : "chart.line.uptrend.xyaxis")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(palette.dot)
            }
            VStack(alignment: .leading, spacing: 1) {
                // 2026-05-19 사장님 결정: 두 모드 모두 헤더에 "전환율" 명시.
                Text(mode == .commerce ? "온라인 커머스 · 전환율" : "스타트업 · 전환율")
                    .buSectionEyebrowStyle()
                Text(mode == .commerce
                     ? "방문 → 구매 funnel"
                     : "가입 → 유료 funnel")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            }
            Spacer(minLength: 0)
            // SaaS 모드: 런웨이 mini chip
            if mode == .saas, let d = daysUntilZero {
                HStack(spacing: 3) {
                    Image(systemName: "hourglass")
                        .font(.system(size: 9, weight: .bold))
                    Text("D-\(d)")
                        .font(.system(size: 10, weight: .heavy))
                        .monospacedDigit()
                }
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(BUColor.midnight08, in: Capsule())
            }
            // Edit 버튼 (실 데이터 있을 때 작게)
            if !isManualEmpty {
                Button { showEditSheet = true } label: {
                    Image(systemName: "square.and.pencil")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                        .padding(6)
                        .background(BUColor.midnight08, in: Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("funnel 수치 수정")
            }
        }
    }

    // MARK: - Primary metric (big %)

    private func primaryMetricRow(palette: HealthColorPalette) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Text(String(format: "%.1f", overallConvPct))
                .font(.system(size: 32, weight: .bold))
                .foregroundStyle(palette.text)
                .tracking(-1.2)
                .monospacedDigit()
            Text("%")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(palette.text.opacity(0.7))
            Text(mode == .commerce ? "구매 전환" : "유료 전환")
                .font(.system(size: 11.5, weight: .semibold))
                .foregroundStyle(BUColor.inkMuted)
                .padding(.leading, 4)
            Spacer(minLength: 0)
            // WoW trend pill
            HStack(spacing: 3) {
                Image(systemName: conversionWoWPct >= 0 ? "arrow.up.right" : "arrow.down.right")
                    .font(.system(size: 9, weight: .heavy))
                Text(String(format: "%+.1f%%p WoW", conversionWoWPct))
                    .font(.system(size: 10, weight: .heavy))
                    .monospacedDigit()
            }
            .foregroundStyle(conversionWoWPct >= 0 ? BUColor.success : BUColor.danger)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                (conversionWoWPct >= 0 ? BUColor.success : BUColor.danger).opacity(0.10),
                in: Capsule()
            )
        }
    }

    // MARK: - Funnel bars (4 horizontal segmented widths)

    private var funnelBars: some View {
        VStack(alignment: .leading, spacing: 5) {
            ForEach(Array(stepLabels.enumerated()), id: \.offset) { idx, label in
                funnelRow(index: idx, label: label)
            }
        }
        .padding(.top, 4)
    }

    private func funnelRow(index: Int, label: String) -> some View {
        let count = stepValues[index]
        let first = max(stepValues.first ?? 1, 1)
        let widthRatio = Double(count) / Double(first)
        let stepConv: Double? = {
            guard index > 0, stepValues[index - 1] > 0 else { return nil }
            return Double(count) / Double(stepValues[index - 1]) * 100
        }()
        return HStack(spacing: 8) {
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(BUColor.ink)
                .frame(width: 56, alignment: .leading)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4, style: .continuous)
                        .fill(BUColor.midnight.opacity(0.06))
                    RoundedRectangle(cornerRadius: 4, style: .continuous)
                        .fill(funnelGradient(forStep: index))
                        .frame(width: max(8, geo.size.width * widthRatio))
                }
            }
            .frame(height: 18)
            HStack(spacing: 4) {
                Text(count.formatted())
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                    .monospacedDigit()
                if let stepConv {
                    Text(String(format: "%.0f%%", stepConv))
                        .font(.system(size: 9.5, weight: .bold))
                        .foregroundStyle(BUColor.inkMuted)
                        .monospacedDigit()
                        .padding(.horizontal, 5)
                        .padding(.vertical, 1)
                        .background(BUColor.midnight08, in: Capsule())
                }
            }
            .frame(width: 90, alignment: .trailing)
        }
    }

    private func funnelGradient(forStep idx: Int) -> LinearGradient {
        // 단계별로 점점 진해지는 미드나잇 그라데이션
        let opacityMap: [Double] = [0.45, 0.60, 0.75, 0.90]
        let alpha = opacityMap[min(idx, opacityMap.count - 1)]
        return LinearGradient(
            colors: [BUColor.midnight.opacity(alpha), BUColor.midnight.opacity(alpha * 0.85)],
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    // MARK: - Action message

    private var messageRow: some View {
        Text(actionMessage)
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(BUColor.inkSecondary)
            .lineSpacing(2)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// 단계별 이탈률에서 가장 큰 leak 을 찾아 액션 메시지 생성.
    private var actionMessage: String {
        // 단계별 conversion 계산
        var leaks: [(stepIdx: Int, dropPct: Double)] = []
        for i in 1..<stepValues.count {
            guard stepValues[i - 1] > 0 else { continue }
            let conv = Double(stepValues[i]) / Double(stepValues[i - 1])
            let drop = (1 - conv) * 100
            leaks.append((i, drop))
        }
        guard let worst = leaks.max(by: { $0.dropPct < $1.dropPct }) else {
            return "전환 데이터가 더 쌓이면 정확해집니다."
        }

        let benchText = String(format: "%.1f%%", benchmarkPct)
        let curText = String(format: "%.1f%%", overallConvPct)
        let cmpText: String = {
            if overallConvPct >= benchmarkPct {
                return "산업 평균 \(benchText) 대비 양호한 수준 (\(curText))."
            } else {
                return "산업 평균 \(benchText) 대비 부족 (\(curText))."
            }
        }()

        let leakLabel = stepLabels[worst.stepIdx]
        let prevLabel = stepLabels[worst.stepIdx - 1]
        let leakText = String(format: "%@ → %@ 이탈 %.0f%%", prevLabel, leakLabel, worst.dropPct)

        let leverHint: String = {
            switch mode {
            case .commerce:
                switch worst.stepIdx {
                case 1: return "상품 카드의 사진·가격·리뷰 노출 강화."
                case 2: return "장바구니 → 결제 페이지 속도·디자인 점검."
                case 3: return "결제 단계 간소화 (게스트 결제·간편결제 도입)."
                default: return ""
                }
            case .saas:
                switch worst.stepIdx {
                case 1: return "랜딩 페이지 가치 제안 + 가입 폼 마찰 줄이기."
                case 2: return "온보딩 첫 5분 핵심 기능 도달율 점검 (Aha moment)."
                case 3: return "Freemium 한계 + 유료 전환 trigger UX 점검."
                default: return ""
                }
            }
        }()

        return "\(cmpText) \(leakText) → \(leverHint)"
    }
}

// MARK: - Manual input sheet (Phase 1)
//
// Phase 1 데이터 수집 — 사장님이 주간 funnel 4개 숫자 직접 입력.
// 입력값은 UserDefaults 에 저장 (실 서비스에선 Supabase saas_metrics_manual_weekly).
//
// Phase 2 (예정):
//   • GA4 OAuth 연동 — "내 정보 · 데이터 연결" 에서 사장님 GA4 property 인증 →
//     일일 cron 이 GA4 Data API pull → saas_metrics_ga4_daily 적재.
//   • Custom Webhook — 자체 서버에서 POST /v1/track → saas_metrics_events_raw → rollup.
//   • 두 채널 모두 v_saas_metrics_unified view 로 통합 조회.
//

private struct FunnelManualInputSheet: View {

    let mode: ConversionFunnelFocusCard.Mode

    @AppStorage("funnel.commerce.visitors")    private var commerceVisitors: Int    = 0
    @AppStorage("funnel.commerce.carts")       private var commerceCarts: Int       = 0
    @AppStorage("funnel.commerce.checkouts")   private var commerceCheckouts: Int   = 0
    @AppStorage("funnel.commerce.purchases")   private var commercePurchases: Int   = 0

    @AppStorage("funnel.saas.visitors")        private var saasVisitors: Int        = 0
    @AppStorage("funnel.saas.signups")         private var saasSignups: Int         = 0
    @AppStorage("funnel.saas.activations")     private var saasActivations: Int     = 0
    @AppStorage("funnel.saas.paid")            private var saasPaid: Int            = 0

    @Environment(\.dismiss) private var dismiss

    private var stepFields: [(label: String, helper: String, binding: Binding<Int>)] {
        switch mode {
        case .commerce:
            return [
                ("방문",       "지난 7일 페이지 방문 수 (GA4 또는 스마트스토어 노출수)",
                 Binding(get: { commerceVisitors }, set: { commerceVisitors = $0 })),
                ("장바구니",   "장바구니 담은 횟수 (또는 결제 페이지 진입수)",
                 Binding(get: { commerceCarts }, set: { commerceCarts = $0 })),
                ("결제 시작",  "결제 버튼 클릭 / 입력 페이지 진입",
                 Binding(get: { commerceCheckouts }, set: { commerceCheckouts = $0 })),
                ("구매",       "완료된 주문 건수",
                 Binding(get: { commercePurchases }, set: { commercePurchases = $0 })),
            ]
        case .saas:
            return [
                ("방문",     "지난 7일 랜딩/홈 페이지 방문 수",
                 Binding(get: { saasVisitors }, set: { saasVisitors = $0 })),
                ("가입",     "신규 가입 완료 건수",
                 Binding(get: { saasSignups }, set: { saasSignups = $0 })),
                ("활성화",   "핵심 기능 사용 (Aha moment 도달)",
                 Binding(get: { saasActivations }, set: { saasActivations = $0 })),
                ("유료",     "유료 결제 / 구독 시작 건수",
                 Binding(get: { saasPaid }, set: { saasPaid = $0 })),
            ]
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(mode == .commerce ? "온라인 커머스 전환율" : "스타트업 전환율")
                                .font(.system(size: 22, weight: .bold))
                                .foregroundStyle(BUColor.ink)
                                .tracking(-0.4)
                            Text("지난 7일 funnel 4단계 인원수를 입력하세요. 사장님 데이터로 정확한 전환율과 leak 진단을 보여드립니다.")
                                .font(.system(size: 13))
                                .foregroundStyle(BUColor.inkMuted)
                                .lineSpacing(3)
                        }

                        ForEach(Array(stepFields.enumerated()), id: \.offset) { idx, field in
                            stepInputCard(rank: idx + 1, field: field)
                        }

                        // Phase 2 안내 (자동 수집)
                        VStack(alignment: .leading, spacing: 6) {
                            HStack(spacing: 6) {
                                Image(systemName: "info.circle.fill")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(BUColor.midnight.opacity(0.6))
                                Text("자동 수집은 다음 업데이트에")
                                    .font(.system(size: 11, weight: .heavy))
                                    .tracking(0.3)
                                    .foregroundStyle(BUColor.midnight)
                            }
                            Text("GA4 OAuth 연결 + Custom Webhook 두 채널로 일일 자동 갱신됩니다. 그 전까지는 주간 1회 직접 입력해주세요.")
                                .font(.system(size: 11))
                                .foregroundStyle(BUColor.inkMuted)
                                .lineSpacing(2)
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(BUColor.midnight08, in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                        Spacer(minLength: 40)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("전환율 입력")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarLeading) {
                    Button("취소") { dismiss() }.foregroundStyle(BUColor.inkMuted)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("저장") { saveAndDismiss() }
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .cancellationAction) { Button("취소") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) { Button("저장") { saveAndDismiss() } }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    /// 로컬 (@AppStorage) 은 이미 binding 으로 즉시 저장됨 — 추가로 Supabase 에
    /// fire-and-forget upsert. 인증 안 된 데모 모드면 skip.
    private func saveAndDismiss() {
        let mode: FunnelMode = (self.mode == .commerce) ? .commerce : .saas
        let steps: [Int] = {
            switch self.mode {
            case .commerce: return [commerceVisitors, commerceCarts, commerceCheckouts, commercePurchases]
            case .saas:     return [saasVisitors, saasSignups, saasActivations, saasPaid]
            }
        }()
        let weekStart = FunnelMetricsHelpers.mondayISODate()

        // Fire-and-forget — 실패해도 로컬 데이터는 유지.
        Task {
            do {
                guard let uid = try await BUSupabase.shared.currentUser?.id else { return }
                let repo = FunnelMetricsRepository(
                    supabase: BUSupabase.shared.client,
                    getUserId: { uid }
                )
                try await repo.upsertManualEntry(mode: mode, weekStart: weekStart, steps: steps)
            } catch {
                // 무시 — 로컬은 이미 저장됨. 다음에 다시 시도되도록 nothing.
            }
        }
        dismiss()
    }

    private func stepInputCard(rank: Int, field: (label: String, helper: String, binding: Binding<Int>)) -> some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                Circle()
                    .fill(BUColor.midnight.opacity(0.10))
                    .frame(width: 32, height: 32)
                Text("\(rank)")
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(BUColor.midnight)
                    .monospacedDigit()
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(field.label)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text(field.helper)
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)

                TextField("0", value: field.binding, format: .number)
                    #if os(iOS)
                    .keyboardType(.numberPad)
                    #endif
                    .font(.system(size: 17, weight: .heavy, design: .rounded))
                    .foregroundStyle(BUColor.ink)
                    .monospacedDigit()
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .padding(.top, 2)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(Color.black.opacity(0.05), lineWidth: 1)
        )
    }
}

// MARK: - Preview

#if DEBUG
#Preview("ConversionFunnel — Commerce") {
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            ConversionFunnelFocusCard(mock: .healthyRestaurant, mode: .commerce)
                .padding(BUSpacing.md)
        }
    }
}

#Preview("ConversionFunnel — SaaS") {
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            ConversionFunnelFocusCard(mock: .criticalSaaS, mode: .saas)
                .padding(BUSpacing.md)
        }
    }
}
#endif
