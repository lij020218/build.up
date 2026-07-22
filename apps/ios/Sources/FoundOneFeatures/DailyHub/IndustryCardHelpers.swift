//
//  IndustryCardHelpers.swift — FoundOneData 타입 → FoundOneCore 계산기 타입 변환
//
//  FoundOneCore 는 FoundOneData 를 import 할 수 없으므로(순환 의존성),
//  FoundOneFeatures 레이어에서 양쪽을 연결한다.
//

import Foundation
import FoundOneCore
import FoundOneData

// MARK: - BUInventoryItem → SellThroughProduct

public extension BUInventoryItem {
    /// 소매 sell-through 카드용 변환.
    /// monthlySold > 0 이면 실값, == 0 이면 dailyUsage × 26 추정 + isEstimated = true.
    func toSellThroughProduct() -> SellThroughProduct {
        // 상품 자유분류(displayCategory) 우선, 없으면 enum category 폴백 (2026-07-22 통합, 웹 정합)
        let cat = (displayCategory?.isEmpty == false) ? displayCategory! : category
        if monthlySold > 0 {
            return SellThroughProduct(
                id: id, name: name, category: cat,
                price: sellingPrice, cost: unitCost, stock: quantity,
                monthlySold: monthlySold, isEstimated: false
            )
        } else {
            return SellThroughProduct(
                id: id, name: name, category: cat,
                price: sellingPrice, cost: unitCost, stock: quantity,
                monthlySold: dailyUsage * 26, isEstimated: true
            )
        }
    }
}

// MARK: - BUMember → CohortMember

public extension BUMember {
    func toCohortMember() -> CohortMember {
        CohortMember(id: id, startDate: startDate, endDate: endDate)
    }
}

public extension Array where Element == BUMember {
    func asCohortMembers() -> [CohortMember] {
        map { $0.toCohortMember() }
    }
}
