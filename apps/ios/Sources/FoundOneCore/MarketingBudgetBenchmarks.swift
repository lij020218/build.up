//
//  MarketingBudgetBenchmarks.swift — 마케팅 예산 벤치마크 (웹 SSOT 손-미러)
//
//  ⚠️ 웹 SSOT: packages/shared/src/marketing-budget-benchmarks.ts
//   값·출처를 바꾸면 두 곳을 같이 고쳐야 한다 — shared 의
//   marketing-budget-ios-sync.test.ts 가 이 파일을 파싱해 드리프트를 차단한다.
//
//  정직성 경계: 한국 소상공인 "매출 대비 마케팅비" 공식 통계는 없다.
//   아래 수치는 미국 업계 통용 기준이며 UI 는 출처를 함께 표시한다.
//

import Foundation

public struct MarketingBudgetBenchmark: Sendable, Hashable {
    public let lowPct: Double
    public let highPct: Double
    public let newBizLowPct: Double?
    public let newBizHighPct: Double?
    public let sourceLabelKo: String
    public let sourceUrl: String
}

public enum MarketingBudgetBenchmarks {

    /// 판정에 필요한 최소 월매출 — 이보다 적으면 비율이 노이즈라 판정하지 않는다.
    public static let minRevenueForAssessmentWon = 500_000

    public static func benchmark(for categoryId: String?) -> MarketingBudgetBenchmark {
        switch categoryId {
        case "food", "cafe-dessert":
            return MarketingBudgetBenchmark(
                lowPct: 3, highPct: 6,
                newBizLowPct: 5, newBizHighPct: 10,
                sourceLabelKo: "미국 외식업계 통용 기준",
                sourceUrl: "https://backofhouse.io/resources/whats-an-average-restaurant-marketing-budget"
            )
        default:
            return MarketingBudgetBenchmark(
                lowPct: 7, highPct: 8,
                newBizLowPct: nil, newBizHighPct: nil,
                sourceLabelKo: "미국 중소기업청(SBA) 권고",
                sourceUrl: "https://www.crestmontcapital.com/blog/marketing-spend-benchmarks-small-business"
            )
        }
    }

    public enum Band: Sendable { case below, within, above }

    public struct Assessment: Sendable {
        public let pct: Double
        public let band: Band
        public let lowPct: Double
        public let highPct: Double
        public let isNewBiz: Bool
        public let benchmark: MarketingBudgetBenchmark
    }

    /// 이달 지출 수준 판정 — 웹 assessMarketingSpend 와 동일 규칙.
    ///  매출이 최소치 미만이면 nil (판정 불가 = 표시 안 함). 지출 0 + 매출 존재 = below.
    public static func assess(spendWon: Int, revenueWon: Int, categoryId: String?, isNewBiz: Bool) -> Assessment? {
        guard revenueWon >= minRevenueForAssessmentWon else { return nil }
        let benchmark = benchmark(for: categoryId)
        let useNewBiz = isNewBiz && benchmark.newBizLowPct != nil && benchmark.newBizHighPct != nil
        let low = useNewBiz ? benchmark.newBizLowPct! : benchmark.lowPct
        let high = useNewBiz ? benchmark.newBizHighPct! : benchmark.highPct
        let pct = (Double(max(0, spendWon)) / Double(revenueWon) * 1000).rounded() / 10
        let band: Band = pct < low ? .below : (pct > high ? .above : .within)
        return Assessment(pct: pct, band: band, lowPct: low, highPct: high, isNewBiz: useNewBiz, benchmark: benchmark)
    }
}
