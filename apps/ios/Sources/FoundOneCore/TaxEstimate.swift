//
//  TaxEstimate.swift — 세금 간이 예상 (웹 tax-estimate.ts 미러, 2026-07-22)
//
//  웹 SSOT: packages/shared/src/finance/tax-estimate.ts
//  ⚠️ 계산 로직이라 codegen 부적합 → 수기 포팅. 값 변경 시 웹과 동시 수정.
//     예상 간이치·범위만 — 최종 세액은 홈택스·세무사 (세금 오차 = 신뢰 붕괴).
//

import Foundation

public enum TaxEstimate {

    /// 간이과세 기준 연매출 (부가가치세법 시행령 §109) — 웹 LEGAL.SIMPLIFIED_TAX_THRESHOLD 미러.
    public static let simplifiedThresholdWon = 104_000_000

    // ── 업종별 부가가치율(%) — 부가세법 시행령 §111. 카테고리 대표값(홈택스 확인 유도) ──
    private static let vatRateByCategory: [String: Int] = [
        "food": 15, "cafe-dessert": 15, "retail": 15, "online-digital": 15,
        "beauty": 30, "fitness": 30, "education": 30, "pet": 30, "living-service": 30,
        "space": 25, "startup-tech": 30,
    ]
    private static let defaultVatRate = 30

    public static func vatValueAddedRatePct(_ categoryId: String?) -> Int {
        guard let c = categoryId, let r = vatRateByCategory[c] else { return defaultVatRate }
        return r
    }

    // ── 과세유형 판정 ──
    public struct TaxTypeVerdict: Sendable {
        public let simplifiedEligible: Bool
        public let annualRevenueWon: Int
        public let noteKo: String
    }

    public static func classifyTaxType(annualRevenueWon: Int) -> TaxTypeVerdict {
        let eligible = annualRevenueWon > 0 && annualRevenueWon < simplifiedThresholdWon
        let note: String
        if annualRevenueWon <= 0 {
            note = "매출을 기록하면 과세유형(간이/일반)을 판정해 드려요."
        } else if eligible {
            note = "연매출 추정 \(manwon(annualRevenueWon)) — 간이과세 가능 구간(1억 400만 미만). 단 간이배제 업종·법인은 제외."
        } else {
            note = "연매출 추정 \(manwon(annualRevenueWon)) — 일반과세 대상(1억 400만 이상). 매입세액 환급이 가능해요."
        }
        return .init(simplifiedEligible: eligible, annualRevenueWon: annualRevenueWon, noteKo: note)
    }

    // ── 부가세 예상 (범위) ──
    public struct VatEstimate: Sendable {
        public let lowWon: Int
        public let highWon: Int
        public let valueAddedRatePct: Int
        public let noteKo: String
    }

    public static func estimateVat(annualRevenueWon: Int, categoryId: String?, simplified: Bool) -> VatEstimate {
        let rev = max(0, annualRevenueWon)
        let vatRate = vatValueAddedRatePct(categoryId)
        if simplified {
            let base = Int((Double(rev) * Double(vatRate) / 100.0) * 0.1)
            let creditFloor = base - Int(Double(rev) * 0.013)
            return .init(
                lowWon: max(0, creditFloor), highWon: base, valueAddedRatePct: vatRate,
                noteKo: "간이과세 예상: 공급대가 × 업종부가율(\(vatRate)%) × 10%. 실제 부가율은 업종코드로 결정되고 세액공제·재고매입에 따라 달라져요 → 홈택스 확정."
            )
        }
        let salesVat = Int(Double(rev) * 0.1)
        return .init(
            lowWon: max(0, Int(Double(salesVat) * 0.4)), highWon: max(0, Int(Double(salesVat) * 0.7)),
            valueAddedRatePct: 10,
            noteKo: "일반과세 예상: 매출세액(10%) − 매입세액. 매입 증빙이 많을수록 줄어요. 실제 매입세액 기준으로 홈택스에서 확정."
        )
    }

    // ── 종합소득세 — 계산 대신 구간 안내 ──
    public struct IncomeTaxGuide: Sendable {
        public let estimatedBusinessIncomeWon: Int?
        public let marginalBracketPct: Int?
        public let noteKo: String
    }

    /// 소득세법 §55 과표 구간(원) → 세율(%).
    private static let brackets: [(upTo: Int, ratePct: Int)] = [
        (14_000_000, 6), (50_000_000, 15), (88_000_000, 24), (150_000_000, 35),
        (300_000_000, 38), (500_000_000, 40), (1_000_000_000, 42), (Int.max, 45),
    ]

    public static func guideIncomeTax(annualRevenueWon: Int, expenseRatioAssumption: Double = 0.7) -> IncomeTaxGuide {
        guard annualRevenueWon > 0 else {
            return .init(estimatedBusinessIncomeWon: nil, marginalBracketPct: nil,
                         noteKo: "매출을 기록하면 예상 종합소득세 구간을 안내해 드려요. 정확한 세액은 필요경비·소득공제에 따라 달라져 홈택스·세무사로 확정하세요.")
        }
        let income = Int(Double(annualRevenueWon) * (1 - expenseRatioAssumption))
        let bracket = brackets.first(where: { income <= $0.upTo })
        let pct = Int((1 - expenseRatioAssumption) * 100)
        return .init(
            estimatedBusinessIncomeWon: income, marginalBracketPct: bracket?.ratePct,
            noteKo: "사업소득을 매출의 약 \(pct)%로 가정한 개략치예요(업종·경비에 따라 크게 달라짐). 실제 필요경비·소득공제·세액공제를 반영하면 세액이 낮아져요 — 홈택스·세무사 확정."
        )
    }

    // ── helper ──
    public static func manwon(_ won: Int) -> String {
        let man = Int((Double(won) / 10_000).rounded())
        if man >= 10_000 {
            let eok = Double(man) / 10_000
            return man % 10_000 == 0 ? "\(Int(eok))억원" : String(format: "%.1f억원", eok)
        }
        return "\(man.formatted())만원"
    }
}
