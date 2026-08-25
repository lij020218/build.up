//
//  InventoryStarterPacks.swift — 재고 스타터팩 레지스트리
//
//  웹 SSOT: packages/shared/src/inventory-starter-packs.ts 손미러 — 수정 시 양쪽 동시.
//  프리셋 = 품목 체크리스트만 (수량·단가·레시피 양 프리필 금지 — 교차검증 판정).
//  단위가 곧 관리 방식: ml·g = 원가·발주 리듬 / 개·팩 = 수량 추적.
//

import Foundation

public struct BUStarterPackItem: Sendable, Identifiable {
    public var id: String { name }
    public let name: String
    public let unit: String
    public let category: String

    public init(name: String, unit: String, category: String) {
        self.name = name; self.unit = unit; self.category = category
    }
}

public struct BUStarterPack: Sendable {
    public let id: String
    public let title: String
    public let items: [BUStarterPackItem]
}

public enum BUInventoryStarterPacks {

    /// 카페·디저트 — 음료 원가의 20~25%가 부자재(컵·뚜껑·빨대)라 개수 추적 가치가 가장 큰 업종
    private static let cafePack = BUStarterPack(
        id: "cafe-dessert",
        title: "카페에서 많이 쓰는 품목",
        items: [
            // 부어 쓰는 재료 → 원가·발주 리듬
            .init(name: "원두", unit: "g", category: "beverage"),
            .init(name: "우유", unit: "ml", category: "fresh"),
            .init(name: "시럽", unit: "ml", category: "dry"),
            // 개수 부자재 → 수량 추적 + 판매 자동차감
            .init(name: "아이스컵", unit: "개", category: "supply"),
            .init(name: "핫컵", unit: "개", category: "supply"),
            .init(name: "컵 뚜껑", unit: "개", category: "supply"),
            .init(name: "빨대", unit: "개", category: "supply"),
            .init(name: "컵 홀더", unit: "개", category: "supply"),
            .init(name: "캐리어", unit: "개", category: "supply"),
            .init(name: "냅킨", unit: "팩", category: "supply"),
        ]
    )

    /// 업종 카테고리 → 스타터팩. 없는 업종은 nil (억지 프리셋 금지). 파일럿 = cafe-dessert.
    public static func resolve(categoryId: String?) -> BUStarterPack? {
        guard let categoryId else { return nil }
        return categoryId == "cafe-dessert" ? cafePack : nil
    }
}
