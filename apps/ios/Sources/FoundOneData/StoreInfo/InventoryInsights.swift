//
//  InventoryInsights.swift — 재고 인사이트 (웹 shared/inventory-insights.ts 손미러, 2026-08-05)
//
//  공식 (조사 근거는 웹 SSOT 주석 참조):
//   · 일수요: 상품=월판매/30, 재료=일사용량 (없으면 nil — 추정 금지)
//   · 안전재고 제안 = ceil(일수요 × 리드타임 × 1.3)
//   · ABC = 매출기여(월판매×단가) 누적 80%/95% → A(품절 금지)/B/C
//   · 풀필먼트(로켓그로스) 무료 보관 60일 초과 = 장기보관비 경고
//  ⚠️ 수정 시 웹 SSOT 와 양쪽 동시.
//

import Foundation

public enum InventoryInsights {

    public static let fulfillmentFreeStorageDays = 60

    public static let abcTargetKo: [String: String] = [
        "A": "품절 절대 금지 (재고율 98~99% 목표) — 품절 시 랭킹·노출 하락",
        "B": "정기 점검 (재고율 95% 목표)",
        "C": "최소 관리 — 과재고가 더 위험 (재고율 90%)",
    ]

    public static func dailyDemand(_ i: BUInventoryItem) -> Double? {
        if i.itemType == "product" {
            return i.monthlySold > 0 ? i.monthlySold / 30 : nil
        }
        return i.dailyUsage > 0 ? i.dailyUsage : nil
    }

    public static func daysOfStock(_ i: BUInventoryItem) -> Int? {
        guard i.quantity > 0 else { return 0 }
        guard let d = dailyDemand(i) else { return nil }
        return Int(floor(i.quantity / d))
    }

    public static func suggestedThreshold(_ i: BUInventoryItem) -> Int? {
        guard let d = dailyDemand(i) else { return nil }
        let lead = max(1, i.leadTimeDays)
        return Int(ceil(d * Double(lead) * 1.3))
    }

    /// 입력 배열과 같은 순서의 등급("A"/"B"/"C") — 매출 계산 불가 항목은 nil.
    public static func abcClassify(_ items: [BUInventoryItem]) -> [String?] {
        let revenues: [Double?] = items.map { i in
            (i.itemType == "product" && i.monthlySold > 0 && i.unitCost > 0) ? i.monthlySold * i.unitCost : nil
        }
        let total = revenues.compactMap { $0 }.reduce(0, +)
        guard total > 0 else { return items.map { _ in nil } }
        let order = revenues.enumerated()
            .compactMap { idx, r in r.map { (idx: idx, r: $0) } }
            .sorted { $0.r > $1.r }
        var grade: [Int: String] = [:]
        var cum = 0.0
        for e in order {
            cum += e.r
            grade[e.idx] = cum / total <= 0.8 ? "A" : (cum / total <= 0.95 ? "B" : "C")
        }
        return items.indices.map { grade[$0] }
    }
}
