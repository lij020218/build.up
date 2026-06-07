//
//  IndustryFocusCard.swift — 업종 특화 1개 카드 (Today 7번째 슬롯)
//
//  사장님 업종에 따라 자동 분기:
//   • 외식/카페     → PrimeCost (식자재 + 인건비 합)
//   • 스타트업/SaaS → funnel 전환율
//   • 소매          → RetailSellThroughCard (sell-through + best seller + dead stock)
//   • 피트니스      → FitnessRetentionCard (cohort 잔존율 + D-7 만료)
//   • 교육          → EducationEnrollmentCard (재등록 D-14 + cohort 잔존율)
//   • 미용/펫/기타  → 예약 현황 (데이터 없을 때 정직한 빈상태)
//   • 일반          → 빠른 영감 (Drucker 인용)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents
import FoundOneData

// MARK: - IndustryFocusCard

public struct IndustryFocusCard: View {

    let mock: MockData
    let members: [BUMember]
    let inventory: [BUInventoryItem]

    public init(mock: MockData, members: [BUMember] = [], inventory: [BUInventoryItem] = []) {
        self.mock = mock
        self.members = members
        self.inventory = inventory
    }

    public var body: some View {
        switch mock.category {
        case .restaurant, .cafe:
            PrimeCostFocusCard(mock: mock)
        case .startupTech:
            // 2026-05-19 사장님 결정: SaaS 핵심 KPI = funnel 전환율.
            ConversionFunnelFocusCard(mock: mock, mode: .saas)
        case .ecommerce:
            // 2026-05-19: 온라인은 구매 전환율이 최우선 KPI.
            ConversionFunnelFocusCard(mock: mock, mode: .commerce)
        case .retail:
            // 실카드 — BUInventoryItem(itemType=="product") + SellThroughCalculator
            RetailSellThroughCard(items: inventory)
        case .fitness:
            // 실카드 — BUMember + CohortRetentionCalculator (FIA 90d=50% 기준)
            FitnessRetentionCard(members: members)
        case .education:
            // 실카드 — BUMember + CohortRetentionCalculator (한국 학원 D-14·1년 잔존)
            EducationEnrollmentCard(members: members)
        case .beauty, .pet, .livingService, .space:
            BookingFocusCard(mock: mock)
        case .general:
            InspirationCard()
        }
    }
}

// MARK: - 외식/카페: Prime Cost Focus

private struct PrimeCostFocusCard: View {
    let mock: MockData

    private var ratios: CostRatiosResult {
        CostRatios.calculate(
            costs: mock.costs,
            totalRevenue: mock.entries.reduce(0) { $0 + $1.sales },
            days: mock.entries.count
        )
    }

    private var thr: KpiThreshold? {
        IndustryThresholds.thresholds(for: mock.category).primeCost
    }

    var body: some View {
        let grade = thr?.grade(ratios.primeCostRatio) ?? .unknown
        let palette = HealthColors.palette(for: grade)
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(palette.dot.opacity(0.15)).frame(width: 36, height: 36)
                        Image(systemName: "fork.knife")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(palette.dot)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("외식 · 원가율")
                            .buSectionEyebrowStyle()
                        Text("Prime Cost — 식자재 + 인건비")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                    Spacer()
                }

                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(String(format: "%.0f", ratios.primeCostRatio))
                        .font(.system(size: 32, weight: .bold))
                        .foregroundStyle(palette.text)
                        .tracking(-1.2)
                        .monospacedDigit()
                    Text("%")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(palette.text.opacity(0.7))
                    Spacer()
                    if let t = thr {
                        Text("목표 \(Int(t.healthy))%")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(BUColor.inkMuted)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(BUColor.midnight08, in: Capsule())
                    }
                }

                if let t = thr {
                    BUGaugeBar(value: ratios.primeCostRatio, target: t.healthy * 1.5, grade: grade, height: 6)
                }

                Text(message(for: grade))
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private func message(for grade: HealthGrade) -> String {
        switch grade {
        case .healthy:  return "황금률 유지. 메뉴 단가/원가 변동 없는지 주간 점검."
        case .caution:  return "조금 더 압박이 옵니다. 상위 3 메뉴 단가 재검토."
        case .warning:  return "원가 압박이 큽니다. 공급처 협상 + 메뉴 단가 조정 필요."
        case .critical: return "긴급. 핵심 메뉴 원가 30%p 절감 또는 가격 인상 결정."
        case .unknown:  return "데이터가 더 쌓이면 정확해집니다."
        }
    }
}

// MARK: - 스타트업: Cash Zero Date

private struct CashZeroDateFocusCard: View {
    let mock: MockData

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

    var body: some View {
        let days = daysUntilZero
        let tone: HealthGrade = {
            guard let d = days else { return .unknown }
            if d < 60 { return .critical }
            if d < 180 { return .warning }
            if d < 365 { return .caution }
            return .healthy
        }()
        let palette = HealthColors.palette(for: tone)

        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(palette.dot.opacity(0.15)).frame(width: 36, height: 36)
                        Image(systemName: "hourglass")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(palette.dot)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("스타트업 · 런웨이")
                            .buSectionEyebrowStyle()
                        Text("Cash Zero Date — 현금 소진 D-day")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                    Spacer()
                }

                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    if let d = days {
                        Text("D-\(d)")
                            .font(.system(size: 32, weight: .heavy))
                            .foregroundStyle(palette.text)
                            .tracking(-1.0)
                            .monospacedDigit()
                    } else {
                        Text("흑자")
                            .font(.system(size: 32, weight: .heavy))
                            .foregroundStyle(BUColor.success)
                            .tracking(-1.0)
                    }
                    Spacer()
                    Text(daysUntilZero.map { "\($0)일 후" } ?? "OK")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(BUColor.inkMuted)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(BUColor.midnight08, in: Capsule())
                }

                Text(message(for: tone))
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private func message(for grade: HealthGrade) -> String {
        switch grade {
        case .healthy:  return "여유. 성장 투자 + 수익 다각화에 집중하세요."
        case .caution:  return "1년 안 흑자 전환 또는 추가 자금 준비 시작."
        case .warning:  return "6개월 미만. 자금 조달 + 비용 절감 즉시 시작."
        case .critical: return "긴급. 2달 안 자금 확보 또는 다운사이징 결정."
        case .unknown:  return "현금 잔고를 입력하면 정확한 D-day 가 보입니다."
        }
    }
}

// MARK: - 미용/펫/피트니스: Booking Focus
//
//  정직성 (가짜 숫자 금지): iOS 에는 예약·노쇼 데이터 모델이 없음(DailyEntry 는 매출·고객수만).
//   따라서 "오늘 예약 8 / 노쇼 2 / 노쇼율 3.2%" 같은 허구 수치를 표시하지 않는다.
//   실데이터로 줄 수 있는 「최근 일평균 고객」만 보여주고, 예약·노쇼는 연동 안내로 정직하게 처리.
//   예약 시스템(네이버 예약·캐치테이블 등) 연동 시 실 예약·노쇼율로 교체.

private struct BookingFocusCard: View {
    let mock: MockData

    /// 최근 기록된 일평균 고객 수 — 실데이터(기록 없으면 nil).
    private var avgDailyCustomers: Int? {
        let withData = mock.entries.filter { $0.customers > 0 }
        guard !withData.isEmpty else { return nil }
        let total = withData.reduce(0) { $0 + $1.customers }
        return Int((Double(total) / Double(withData.count)).rounded())
    }

    var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(BUColor.midnight08).frame(width: 36, height: 36)
                        Image(systemName: "calendar.badge.clock")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("\(mock.category.labelKo) · 예약")
                            .buSectionEyebrowStyle()
                        Text("예약·노쇼 관리")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                    Spacer()
                }

                // 실데이터: 최근 일평균 고객 (기록 있을 때만)
                if let avg = avgDailyCustomers {
                    statTile(label: "최근 일평균 고객", value: "\(avg)명", tint: BUColor.midnight)
                }

                Text(bookingNote)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private var bookingNote: String {
        avgDailyCustomers == nil
            ? "매출·고객을 기록하면 일평균 방문 추세가 표시돼요. 예약·노쇼율은 예약 시스템 연동 시 자동 집계됩니다."
            : "예약·노쇼율은 예약 시스템(네이버 예약·캐치테이블 등) 연동 시 자동 집계됩니다. 노쇼가 잦은 시간대 고객에게 미리 확인 연락을 하면 회수율이 올라가요."
    }

    private func statTile(label: String, value: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label.uppercased())
                .font(.system(size: 9.5, weight: .bold))
                .foregroundStyle(BUColor.ink.opacity(0.48))
                .tracking(0.4)
            Text(value)
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(tint)
                .tracking(-0.5)
                .monospacedDigit()
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 9)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 10))
    }
}

// MARK: - 일반: Inspiration

private struct InspirationCard: View {
    var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(BUColor.midnight08).frame(width: 36, height: 36)
                        Image(systemName: "quote.opening")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    }
                    Text("오늘의 영감")
                        .buSectionEyebrowStyle()
                    Spacer()
                }

                Text("\"가장 중요한 한 가지를 정하고, 그것만 오늘 끝내라.\"")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                    .lineSpacing(4)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)

                Text("— Peter Drucker")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            }
        }
    }
}

// MARK: - Preview

#if DEBUG
#Preview("IndustryFocus — 외식") {
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            IndustryFocusCard(mock: .warningCafe)
                .padding(BUSpacing.md)
        }
    }
}

#Preview("IndustryFocus — 스타트업") {
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            IndustryFocusCard(mock: .criticalSaaS)
                .padding(BUSpacing.md)
        }
    }
}
#endif
