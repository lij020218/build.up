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

    /// "지금 재료로 몇 개 만들 수 있나" — 웹 makeableServings 미러(레시피×재고 파생, 위조 0).
    public struct Makeable: Sendable { public let servings: Int; public let limitingMaterialId: String? }

    /// 지금 재료 재고로 만들 수 있는 메뉴 수(병목 재료 포함).
    /// 레시피 없음·재료 삭제·단위 비호환 등 정직하게 계산 불가면 nil(비표시).
    public static func makeableServings(_ menu: BUInventoryItem, materials: [BUInventoryItem]) -> Makeable? {
        let recipe = menu.recipe ?? []
        if recipe.isEmpty { return nil }
        var minServ = Double.infinity
        var limiting: String? = nil
        var counted = 0
        for ing in recipe {
            if ing.qty <= 0 { continue }
            guard let mat = materials.first(where: { $0.id == ing.materialId }) else { return nil }
            // 벌크(무게·부피 단위) 재료는 잔량 미추적 → 제약으로 잡으면 "0개 가능" 가짜 숫자 (2026-08-25 추적모드 분리, 웹 미러)
            if mat.isBulkTracked { continue }
            guard let per = convertQty(ing.qty, from: ing.unit, to: mat.unit), per > 0 else { return nil }
            counted += 1
            let s = mat.quantity / per
            if s < minServ { minServ = s; limiting = mat.id }
        }
        if counted == 0 { return nil }
        return Makeable(servings: Int(minServ.rounded(.down)), limitingMaterialId: limiting)
    }

    /// 포장(테이크아웃) 추가 원가 — takeoutRecipe(컵·뚜껑·빨대) 합산. 없으면 0.
    /// 포장 원가 = menuCostPerServing + takeoutExtraCost. web takeoutExtraCost 미러 (2026-08-25 홀/포장 분리)
    public static func takeoutExtraCost(_ menu: BUInventoryItem, materials: [BUInventoryItem]) -> Double {
        (menu.takeoutRecipe ?? []).reduce(0) { $0 + (ingredientCost($1, materials: materials) ?? 0) }
    }

    /// 판매 delta 개 → 재료 재고 차감(delta>0)·복구(delta<0). 0 클램프. 레시피/재료 없으면 무변.
    /// takeout=true 면 기본 레시피에 takeoutRecipe 를 합산 차감 (2026-08-25 홀/포장 분리, 웹 미러).
    public static func applyRecipeStockDelta(_ inventory: [BUInventoryItem], menuId: String, delta: Double, takeout: Bool = false) -> [BUInventoryItem] {
        guard delta != 0,
              let menu = inventory.first(where: { $0.id == menuId }) else { return inventory }
        let recipe = (menu.recipe ?? []) + (takeout ? (menu.takeoutRecipe ?? []) : [])
        guard !recipe.isEmpty else { return inventory }
        var deduct: [String: Double] = [:]
        for ing in recipe {
            guard let mat = inventory.first(where: { $0.id == ing.materialId }),
                  // 벌크 재료는 잔량 미추적 → 차감 시 음수 클램프 쓰레기값만 누적 (2026-08-25, 웹 미러)
                  !mat.isBulkTracked,
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

    /// 판매 기록 — 홀/포장 분리 (웹 handleProdSoldChange 완전 미러, 2026-08-25).
    ///  monthlySold = 총 판매(기존 소비처 유지), monthlySoldTakeout = 그중 포장.
    ///  포장 ± 는 총·포장 동시 갱신 + takeoutRecipe 추가 차감 / 홀 ± 는 홀(총−포장)만 0 클램프.
    public static func recordSale(_ inventory: [BUInventoryItem], menuId: String, delta: Int, takeout: Bool = false) -> [BUInventoryItem] {
        guard let menu = inventory.first(where: { $0.id == menuId }) else { return inventory }
        let total = menu.monthlySold
        let tk = menu.monthlySoldTakeout
        let actualDelta: Double
        var nextTk = tk
        if takeout {
            nextTk = max(0, tk + Double(delta))
            actualDelta = nextTk - tk
        } else {
            let hall = max(0, total - tk)
            actualDelta = max(0, hall + Double(delta)) - hall
        }
        if actualDelta == 0 { return inventory }
        let withSold = inventory.map { it -> BUInventoryItem in
            guard it.id == menuId else { return it }
            var c = it
            c.monthlySold = max(0, total + actualDelta)
            c.monthlySoldTakeout = nextTk
            return c
        }
        return applyRecipeStockDelta(withSold, menuId: menuId, delta: actualDelta, takeout: takeout)
    }
}
