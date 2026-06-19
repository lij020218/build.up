//
//  BenchmarkTextRegistry.swift — 업종 벤치마크 비교 텍스트 SSOT (iOS)
//
//  웹 SSOT 1:1 미러: packages/shared/src/finance/benchmark-text.ts (benchmarkText)
//  "내 지표 vs 업종 평균" 한 줄 비교 생성. 손익카드·일일보고서·코칭이 끌어쓴다.
//
//  ⚠️ 수치·로직은 웹 SSOT와 동일해야 함. 변경 시 양쪽 동시 수정(웹·모바일 동기화 원칙).
//
//  설계 원칙(웹과 동일):
//   1. 가짜숫자 0: 해당 업종+지표 벤치마크 없으면 nil 반환 → 미표시. 코호트 사칭 금지.
//   2. source 는 현재 항상 .industry(공개 실태조사값). 유저 실측이 셀당 N≥30 쌓이면
//      같은 UI 문구의 데이터 소스만 .industry→.cohort 로 교체(UI 불변, 출처만 moat 업그레이드).
//   3. revenueStage: Toast 조사 결론(피어셋 정밀도) 반영해 받지만, 현재 (A) 큐레이트
//      데이터는 전부 업종-only(단계 무관)라 단계별 숫자 위조 없이 폴백. (B) 코호트에서 활성.
//   4. 신호등 0: status 는 데이터일 뿐. 색은 UI 가 결정(good=네이비 농담, risk만 벽돌).
//
//  재사용(신설 아닌 심화): KpiThreshold/.grade() (IndustryThresholds.swift, 웹 gradeKpi 거울),
//    IndustryBenchmarkRegistry (매출 평균), HealthGrade.
//
//  ⚠️ 알려진 패리티 부채: IndustryThresholds.swift 의 cafe·general 값이 웹 COST_RATIO_THRESHOLDS
//     와 일부 드리프트(예: cafe 식자재 28 vs 웹 30). 본 파일은 **웹 값을 정본**으로 미러한다.
//     PLHeroCard 게이지(IndustryThresholds)와의 정합은 restaurant(주 사용처)에서 일치.
//

import Foundation

// MARK: - 타입 (웹 benchmark-text.ts 미러)

public enum BenchmarkMetric: Sendable {
    case ingredientRatio
    case laborRatio
    case rentRatio
    case primeCost
    case marketingRatio
    case deliveryRatio
    case operatingMargin
    case monthlyRevenue // 만원 단위
}

/// 매출단계. (A) 큐레이트는 단계 무관이라 현재 폴백, (B) 코호트용 forward-compat.
public enum RevenueStage: Sendable {
    case seed   // 월매출 ~1천만 미만
    case growth // 1천만 ~ 5천만
    case scale  // 5천만 ~ 3억
    case mature // 3억+
}

public enum BenchmarkSource: Sendable {
    case industry // 공개 실태조사값 (현재)
    case cohort   // 유저 실측 집계 (스케일 도달 후)
}

public enum BenchmarkStatus: Sendable {
    case good
    case watch
    case risk
}

public struct BenchmarkResult: Sendable, Equatable {
    public let label: String       // "외식 평균 식자재율"
    public let rangeLabel: String  // "35–45%" · "≥10%" · "월 1,950만원"
    public let myLabel: String     // "34%" · "월 1,800만원"
    public let narrative: String   // "외식 평균 식자재율 35–45% · 사장님 34% — 양호"
    public let status: BenchmarkStatus
    public let source: BenchmarkSource
    public let sourceNote: String

    public static func == (l: BenchmarkResult, r: BenchmarkResult) -> Bool {
        l.narrative == r.narrative && l.status == r.status && l.source == r.source
    }
}

// MARK: - IndustryGroup (웹 IndustryGroup 미러)

public enum BenchmarkIndustryGroup: String, Sendable {
    case restaurant, cafe, retail, ecommerce, service, saas, general
}

public enum BenchmarkTextRegistry {

    public typealias Lang = String // "ko" | "en"

    // ── 웹 COST_RATIO_THRESHOLDS 1:1 (unified-health.ts) ──
    // direction 전부 lowerIsBetter, unit .percent.
    private static let costThresholds: [BenchmarkIndustryGroup: [CostMetric: KpiThreshold]] = [
        .restaurant: [
            .ingredients: KpiThreshold(healthy: 35, caution: 40, warning: 45, direction: .lowerIsBetter, unit: .percent, source: "KREI 2024 외식업체 경영실태조사 (평균 40.7%)"),
            .labor:       KpiThreshold(healthy: 25, caution: 33, warning: 40, direction: .lowerIsBetter, unit: .percent, source: "KREI 2024 외식업체 경영실태조사 (평균 33.9%)"),
            .primeCost:   KpiThreshold(healthy: 65, caution: 70, warning: 75, direction: .lowerIsBetter, unit: .percent, source: "한국외식산업경영연구원 / Toast POS 황금률 65%"),
            .rent:        KpiThreshold(healthy: 8,  caution: 12, warning: 15, direction: .lowerIsBetter, unit: .percent, source: "KREI 2024 (평균 8.4%) / Paytronix 5-15%"),
            .marketing:   KpiThreshold(healthy: 5,  caution: 8,  warning: 12, direction: .lowerIsBetter, unit: .percent, source: "외식업 표준 5-8%"),
            .delivery:    KpiThreshold(healthy: 17, caution: 22, warning: 27, direction: .lowerIsBetter, unit: .percent, source: "공정위 2024 분석 (배달앱 총수수료 16.9-29.3%)"),
        ],
        .cafe: [
            .ingredients: KpiThreshold(healthy: 30, caution: 35, warning: 40, direction: .lowerIsBetter, unit: .percent, source: "카페 평균 25-35% (KB자영업분석)"),
            .labor:       KpiThreshold(healthy: 22, caution: 28, warning: 35, direction: .lowerIsBetter, unit: .percent, source: "카페 인건비 20-28%"),
            .primeCost:   KpiThreshold(healthy: 60, caution: 65, warning: 72, direction: .lowerIsBetter, unit: .percent, source: "카페 황금률 (외식보다 5%p 낮게)"),
            .rent:        KpiThreshold(healthy: 10, caution: 15, warning: 20, direction: .lowerIsBetter, unit: .percent, source: "카페 임차료 10-18%"),
        ],
        .retail: [
            .ingredients: KpiThreshold(healthy: 65, caution: 70, warning: 75, direction: .lowerIsBetter, unit: .percent, source: "소매 매입원가 50-65% (편의점 평균 ~75%)"),
            .labor:       KpiThreshold(healthy: 12, caution: 18, warning: 25, direction: .lowerIsBetter, unit: .percent, source: "소매업 인건비 10-20% (Glasswallet)"),
            .rent:        KpiThreshold(healthy: 8,  caution: 12, warning: 18, direction: .lowerIsBetter, unit: .percent, source: "소매업 임차료 8-15%"),
        ],
        .ecommerce: [
            .ingredients: KpiThreshold(healthy: 50, caution: 60, warning: 70, direction: .lowerIsBetter, unit: .percent, source: "이커머스 매입원가 (KPMG 2024)"),
            .marketing:   KpiThreshold(healthy: 12, caution: 18, warning: 25, direction: .lowerIsBetter, unit: .percent, source: "이커머스 광고비 (의류 카테고리 ROAS 1000% 기준)"),
        ],
        .service: [
            .labor:       KpiThreshold(healthy: 35, caution: 45, warning: 55, direction: .lowerIsBetter, unit: .percent, source: "서비스업 인건비 30-50% (Glasswallet)"),
            .rent:        KpiThreshold(healthy: 12, caution: 18, warning: 25, direction: .lowerIsBetter, unit: .percent, source: "서비스업 표준"),
        ],
        .saas: [
            .ingredients: KpiThreshold(healthy: 25, caution: 35, warning: 45, direction: .lowerIsBetter, unit: .percent, source: "SaaS COGS (호스팅·CDN·CS) — Gross Margin 75%+ 목표"),
            .labor:       KpiThreshold(healthy: 50, caution: 60, warning: 70, direction: .lowerIsBetter, unit: .percent, source: "SaaS 인건비 50-70% (a16z)"),
        ],
        .general: [
            .ingredients: KpiThreshold(healthy: 40, caution: 50, warning: 60, direction: .lowerIsBetter, unit: .percent, source: "보수적 기본값 (업종 미지정)"),
            .labor:       KpiThreshold(healthy: 30, caution: 40, warning: 50, direction: .lowerIsBetter, unit: .percent, source: "보수적 기본값"),
            .primeCost:   KpiThreshold(healthy: 65, caution: 72, warning: 80, direction: .lowerIsBetter, unit: .percent, source: "보수적 기본값"),
            .rent:        KpiThreshold(healthy: 10, caution: 15, warning: 20, direction: .lowerIsBetter, unit: .percent, source: "보수적 기본값"),
        ],
    ]

    // 영업이익률 — 웹 COMMON_THRESHOLDS.operatingMargin (higherIsBetter)
    private static let operatingMarginThreshold = KpiThreshold(
        healthy: 10, caution: 5, warning: 0,
        direction: .higherIsBetter, unit: .percent,
        source: "KREI 2024 외식업 평균 8.7% / CFA Operating Margin"
    )

    private enum CostMetric: Hashable { case ingredients, labor, rent, marketing, primeCost, delivery }

    private static func costMetricKey(_ m: BenchmarkMetric) -> CostMetric? {
        switch m {
        case .ingredientRatio: return .ingredients
        case .laborRatio:      return .labor
        case .rentRatio:       return .rent
        case .marketingRatio:  return .marketing
        case .primeCost:       return .primeCost
        case .deliveryRatio:   return .delivery
        default:               return nil
        }
    }

    /// 웹 mapIndustryToGroup(categoryId) 1:1 (느슨 매칭).
    public static func group(forCategoryId categoryId: String?) -> BenchmarkIndustryGroup {
        guard let raw = categoryId?.lowercased(), !raw.isEmpty else { return .general }
        if raw.contains("cafe") || raw.contains("dessert") || raw.contains("bakery") { return .cafe }
        if raw.contains("food") || raw.contains("restaurant") || raw.contains("bar") { return .restaurant }
        if raw.contains("online") || raw.contains("digital") || raw.contains("ecom") { return .ecommerce }
        if raw.contains("retail") || raw.contains("convenience") || raw.contains("apparel") { return .retail }
        if raw.contains("startup") || raw.contains("tech") || raw.contains("saas") { return .saas }
        if raw.contains("beauty") || raw.contains("fitness") || raw.contains("education")
            || raw.contains("pet") || raw.contains("living-service") || raw.contains("space") { return .service }
        return .general
    }

    // MARK: 라벨

    private static func groupLabel(_ g: BenchmarkIndustryGroup, _ lang: Lang) -> String {
        let ko: [BenchmarkIndustryGroup: String] = [
            .restaurant: "외식", .cafe: "카페", .retail: "소매", .ecommerce: "이커머스",
            .service: "서비스업", .saas: "SaaS", .general: "업종",
        ]
        let en: [BenchmarkIndustryGroup: String] = [
            .restaurant: "Restaurant", .cafe: "Cafe", .retail: "Retail", .ecommerce: "E-commerce",
            .service: "Service", .saas: "SaaS", .general: "Industry",
        ]
        return (lang == "en" ? en[g] : ko[g]) ?? (lang == "en" ? "Industry" : "업종")
    }

    private static func metricLabel(_ m: BenchmarkMetric, _ lang: Lang) -> String {
        switch (m, lang == "en") {
        case (.ingredientRatio, false): return "식자재율"
        case (.ingredientRatio, true):  return "food-cost ratio"
        case (.laborRatio, false):      return "인건비율"
        case (.laborRatio, true):       return "labor ratio"
        case (.rentRatio, false):       return "임차료율"
        case (.rentRatio, true):        return "rent ratio"
        case (.primeCost, false):       return "원가율(프라임코스트)"
        case (.primeCost, true):        return "prime cost"
        case (.marketingRatio, false):  return "마케팅비율"
        case (.marketingRatio, true):   return "marketing ratio"
        case (.deliveryRatio, false):   return "배달수수료율"
        case (.deliveryRatio, true):    return "delivery-fee ratio"
        case (.operatingMargin, false): return "영업이익률"
        case (.operatingMargin, true):  return "operating margin"
        case (.monthlyRevenue, false):  return "월매출"
        case (.monthlyRevenue, true):   return "monthly revenue"
        }
    }

    private static func statusWord(_ s: BenchmarkStatus, _ lang: Lang) -> String {
        switch (s, lang == "en") {
        case (.good, false): return "양호"
        case (.good, true): return "good"
        case (.watch, false): return "주의"
        case (.watch, true): return "watch"
        case (.risk, false): return "관리 필요"
        case (.risk, true): return "needs attention"
        }
    }

    private static func status(from grade: HealthGrade) -> BenchmarkStatus? {
        switch grade {
        case .healthy: return .good
        case .caution: return .watch
        case .warning, .critical: return .risk
        case .unknown: return nil
        }
    }

    private static func rangeLabel(_ t: KpiThreshold) -> String {
        t.direction == .higherIsBetter
            ? "≥\(num(t.healthy))%"
            : "\(num(t.healthy))–\(num(t.warning))%"
    }

    private static func num(_ v: Double) -> String {
        v == v.rounded() ? String(Int(v)) : String(format: "%.1f", v)
    }

    private static func pct(_ v: Double) -> String { "\(num((v * 10).rounded() / 10))%" }

    private static func manwon(_ v: Double, _ lang: Lang) -> String {
        let rounded = Int(v.rounded())
        if lang == "en" { return String(format: "₩%.1fM/mo", Double(rounded) / 100) }
        let fmt = NumberFormatter()
        fmt.numberStyle = .decimal
        fmt.locale = Locale(identifier: "ko_KR")
        let s = fmt.string(from: NSNumber(value: rounded)) ?? "\(rounded)"
        return "월 \(s)만원"
    }

    private static func narrative(_ label: String, _ range: String, _ my: String, _ s: BenchmarkStatus, _ lang: Lang) -> String {
        let w = statusWord(s, lang)
        return lang == "en" ? "\(label) \(range) · you \(my) — \(w)" : "\(label) \(range) · 사장님 \(my) — \(w)"
    }

    // MARK: - 진입점 (웹 benchmarkText 1:1)

    /// 내 지표 vs 업종 평균 한 줄 비교. 벤치마크 없으면 nil(미표시). 가짜 0 금지.
    public static func benchmarkText(
        categoryId: String?,
        revenueStage: RevenueStage? = nil,
        metric: BenchmarkMetric,
        myValue: Double,
        language: Lang = "ko"
    ) -> BenchmarkResult? {
        guard myValue.isFinite else { return nil }
        _ = revenueStage // (A) 단계 무관 — (B) 코호트에서 활성
        let g = group(forCategoryId: categoryId)

        // 1. cost-ratio 계열 — 직접 조회(cross-group 폴백 금지: "업종 평균"이라며 타 업종 숫자 노출 방지)
        if let key = costMetricKey(metric) {
            guard let t = costThresholds[g]?[key], let st = status(from: t.grade(myValue)) else { return nil }
            let label = language == "en"
                ? "\(groupLabel(g, language)) avg. \(metricLabel(metric, language))"
                : "\(groupLabel(g, language)) 평균 \(metricLabel(metric, language))"
            let range = rangeLabel(t)
            let my = pct(myValue)
            return BenchmarkResult(label: label, rangeLabel: range, myLabel: my,
                                   narrative: narrative(label, range, my, st, language),
                                   status: st, source: .industry, sourceNote: t.source)
        }

        // 2. 영업이익률
        if metric == .operatingMargin {
            let t = operatingMarginThreshold
            guard let st = status(from: t.grade(myValue)) else { return nil }
            let label = language == "en" ? "Industry avg. operating margin" : "영업이익률 기준"
            let range = rangeLabel(t)
            let my = pct(myValue)
            return BenchmarkResult(label: label, rangeLabel: range, myLabel: my,
                                   narrative: narrative(label, range, my, st, language),
                                   status: st, source: .industry, sourceNote: t.source)
        }

        // 3. 월매출 (업종 평균 기반, ±15% 밴드)
        if metric == .monthlyRevenue {
            guard let ib = IndustryBenchmarkRegistry.benchmark(categoryId: categoryId ?? ""),
                  ib.avgAnnualRevenue > 0 else { return nil }
            let avgMonthly = Double(ib.avgAnnualRevenue) / 12 // 만원
            let ratio = myValue / avgMonthly
            let st: BenchmarkStatus = ratio >= 1.15 ? .good : (ratio >= 0.85 ? .watch : .risk)
            let label = language == "en"
                ? "\(groupLabel(g, language)) avg. monthly revenue"
                : "\(groupLabel(g, language)) 평균 월매출"
            let range = manwon(avgMonthly, language)
            let my = manwon(myValue, language)
            return BenchmarkResult(label: label, rangeLabel: range, myLabel: my,
                                   narrative: narrative(label, range, my, st, language),
                                   status: st, source: .industry,
                                   sourceNote: "소상공인시장진흥공단 실태조사 평균 (분포 추정)")
        }

        return nil
    }
}
