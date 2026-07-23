import Foundation

/// 레시피(BOM) 원가·재고차감 SSOT — web recipe-cost.ts 완전 미러 (2026-07-22).
///  · 원가/1인분 = Σ 재료단가(원/재료단위) × 소요량(재료단위 환산)
///  · 원가율 = 원가/판매가 ·  판매 n개 → 재료 quantity 를 n × 소요량 차감(0 클램프)
///  단위 환산은 무게(g·kg·mg)·부피(ml·l·cc) 차원 내에서만. 비호환(개↔g)은 nil → UI 가 호환 단위만 노출.
public enum RecipeCost {
    private static let weight: [String: Double] = ["mg": 0.001, "g": 1, "kg": 1000]
    private static let volume: [String: Double] = ["ml": 1, "cc": 1, "l": 1000]

    /// 한글·구어 단위 별칭 (웹 recipe-cost.ts UNIT_ALIAS 미러) — 그램·킬로·리터도 환산.
    private static let unitAlias: [String: String] = [
        "그램": "g", "그람": "g", "밀리그램": "mg",
        "킬로": "kg", "키로": "kg", "킬로그램": "kg", "키로그램": "kg",
        "밀리리터": "ml", "미리리터": "ml", "미리": "ml", "씨씨": "cc",
        "리터": "l", "ℓ": "l",
    ]

    private static func norm(_ u: String) -> String {
        let t = u.trimmingCharacters(in: .whitespaces).lowercased()
        return unitAlias[t] ?? t
    }
    /// qty(fromUnit) → toUnit 환산. 같은 차원만 성공, 비호환이면 nil.
    public static func convertQty(_ qty: Double, from: String, to: String) -> Double? {
        let f = norm(from), t = norm(to)
        if f == t { return qty }
        if let wf = weight[f], let wt = weight[t] { return qty * wf / wt }
        if let vf = volume[f], let vt = volume[t] { return qty * vf / vt }
        return nil
    }

    /// 재료 단위와 호환되는 레시피 입력 단위(첫 항목 = 재료 단위 자체 = 기본값).
    /// 정규화 기준 중복 제거(그램+g 이중표시 방지) — 웹 compatibleUnits 미러.
    public static func compatibleUnits(_ materialUnit: String) -> [String] {
        let u = norm(materialUnit)
        let candidates: [String] =
            weight[u] != nil ? [materialUnit, "g", "kg"]
            : volume[u] != nil ? [materialUnit, "ml", "l"]
            : [materialUnit.isEmpty ? "개" : materialUnit]
        var seen = Set<String>()
        return candidates.filter { seen.insert(norm($0)).inserted }
    }

    /// 재료 한 줄 원가(원). 재료 없거나 단위 비호환이면 nil.
    public static func ingredientCost(_ ing: BURecipeIngredient, materials: [BUInventoryItem]) -> Double? {
        guard let mat = materials.first(where: { $0.id == ing.materialId }) else { return nil }
        guard let inMatUnit = convertQty(ing.qty, from: ing.unit, to: mat.unit) else { return nil }
        return mat.unitCost * inMatUnit
    }

    /// 메뉴 1개 원가. recipe 있으면 재료 합산(계산 가능한 것만), 없으면 수동 unitCost 폴백.
    public static func menuCostPerServing(_ menu: BUInventoryItem, materials: [BUInventoryItem]) -> Double {
        let recipe = menu.recipe ?? []
        if recipe.isEmpty { return menu.unitCost }
        return recipe.reduce(0) { $0 + (ingredientCost($1, materials: materials) ?? 0) }
    }

    /// recipe 원가율(%). 판매가 0 이면 0.
    public static func menuCostRatio(_ menu: BUInventoryItem, materials: [BUInventoryItem]) -> Double {
        let price = menu.sellingPrice
        if price <= 0 { return 0 }
        return menuCostPerServing(menu, materials: materials) / price * 100
    }

    /// 판매 delta 개 → 재료 재고 차감(delta>0)·복구(delta<0). 0 클램프. 레시피/재료 없으면 무변.
    public static func applyRecipeStockDelta(_ inventory: [BUInventoryItem], menuId: String, delta: Double) -> [BUInventoryItem] {
        guard delta != 0,
              let menu = inventory.first(where: { $0.id == menuId }),
              let recipe = menu.recipe, !recipe.isEmpty else { return inventory }
        var deduct: [String: Double] = [:]
        for ing in recipe {
            guard let mat = inventory.first(where: { $0.id == ing.materialId }),
                  let per = convertQty(ing.qty, from: ing.unit, to: mat.unit) else { continue }
            deduct[ing.materialId, default: 0] += per * delta
        }
        if deduct.isEmpty { return inventory }
        return inventory.map { item in
            guard let d = deduct[item.id] else { return item }
            var copy = item
            copy.quantity = max(0, ((item.quantity - d) * 10000).rounded() / 10000)
            return copy
        }
    }
}
