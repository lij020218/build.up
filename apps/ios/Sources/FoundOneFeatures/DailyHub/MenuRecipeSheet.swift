//
//  MenuRecipeSheet.swift — 메뉴 레시피(BOM) 관리 (2026-07-22)
//
//  웹 SSOT: apps/web/.../analytics/RecipeEditorModal.tsx + ProductPerformanceCard(재료 버튼)
//  메뉴별 재료(material) 소요량 지정 → 원가율 자동 계산 + "판매 1개 기록" 시 재고 자동 차감.
//  저장: storeInfoStore.commit { $0.inventory = ... } → debounced Supabase sync.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

private let brick = Color(red: 0.71, green: 0.30, blue: 0.30)
private func won(_ n: Double) -> String { "₩\(Int(n.rounded()).formatted())" }

// MARK: - 메뉴 목록 시트

public struct MenuRecipeSheet: View {
    @ObservedObject var storeInfoStore: StoreInfoStore
    let goldenMax: Double
    @Environment(\.dismiss) private var dismiss

    public init(storeInfoStore: StoreInfoStore, goldenMax: Double = 33) {
        self.storeInfoStore = storeInfoStore
        self.goldenMax = goldenMax
    }

    private var menus: [BUInventoryItem] { storeInfoStore.state.inventory.filter { $0.itemType == "product" } }
    private var materials: [BUInventoryItem] { storeInfoStore.state.inventory.filter { $0.itemType != "product" } }

    public var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUBackgroundSurface()
                ScrollView {
                    VStack(spacing: BUSpacing.sm) {
                        if menus.isEmpty {
                            Text("메뉴를 먼저 등록하세요. (로드맵 메뉴 설계 또는 재고 관리)")
                                .font(.system(size: 13)).foregroundStyle(BUColor.inkSecondary)
                                .frame(maxWidth: .infinity).padding(.vertical, 40)
                        }
                        ForEach(menus) { menu in
                            menuCard(menu)
                        }
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("메뉴 레시피")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight) } }
        }
    }

    private func menuCard(_ menu: BUInventoryItem) -> some View {
        let cost = RecipeCost.menuCostPerServing(menu, materials: materials)
        let ratio = menu.sellingPrice > 0 ? cost / menu.sellingPrice * 100 : 0
        let count = menu.recipe?.count ?? 0
        return BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                // 상단: 이름·원가 + 원가율
                HStack(spacing: 10) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(menu.name).font(.system(size: 14.5, weight: .semibold)).foregroundStyle(BUColor.ink)
                        Text("\(won(menu.sellingPrice)) · 원가 \(won(cost)) · 재료 \(count)종")
                            .font(.system(size: 11.5)).foregroundStyle(BUColor.inkSecondary)
                    }
                    Spacer()
                    if menu.sellingPrice > 0 {
                        Text("\(Int(ratio.rounded()))%")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(ratio > goldenMax ? brick : BUColor.midnight)
                    }
                }
                // 하단: 판매 −/＋ 카운터(재고 자동 차감·복구) + 레시피 편집 진입 (웹 판매량 카운터 정합)
                HStack(spacing: 10) {
                    HStack(spacing: 0) {
                        stepBtn("minus", disabled: menu.monthlySold <= 0) { recordSale(menu.id, -1) }
                        Text("\(Int(menu.monthlySold))\u{00A0}판매")
                            .font(.system(size: 12.5, weight: .semibold)).foregroundStyle(BUColor.ink)
                            .frame(minWidth: 62).monospacedDigit()
                        stepBtn("plus", disabled: count == 0) { recordSale(menu.id, 1) }
                    }
                    if count == 0 {
                        Text("재료 등록 후 차감").font(.system(size: 10.5)).foregroundStyle(BUColor.inkMuted)
                    }
                    Spacer()
                    NavigationLink {
                        RecipeEditorView(storeInfoStore: storeInfoStore, menuId: menu.id, goldenMax: goldenMax)
                    } label: {
                        HStack(spacing: 3) {
                            Text("재료").font(.system(size: 12.5, weight: .semibold))
                            Image(systemName: "chevron.right").font(.system(size: 10, weight: .semibold))
                        }
                        .foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 10).padding(.vertical, 6)
                        .background(BUColor.midnight.opacity(0.07), in: Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func stepBtn(_ sf: String, disabled: Bool, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: sf).font(.system(size: 13, weight: .bold))
                .frame(width: 30, height: 30)
                .foregroundStyle(disabled ? BUColor.inkMuted : BUColor.midnight)
                .background(BUColor.midnight.opacity(disabled ? 0.03 : 0.08), in: RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain).disabled(disabled)
    }

    /// 판매 delta 기록 — 판매량 +/− + 레시피만큼 재고 차감/복구 (웹 handleProdSoldChange 정합).
    private func recordSale(_ menuId: String, _ delta: Int) {
        storeInfoStore.commit { s in
            s.inventory = s.inventory.map { it in
                guard it.id == menuId else { return it }
                var c = it; c.monthlySold = max(0, c.monthlySold + Double(delta)); return c
            }
            s.inventory = RecipeCost.applyRecipeStockDelta(s.inventory, menuId: menuId, delta: Double(delta))
        }
    }
}

// MARK: - 레시피 편집기

struct RecipeEditorView: View {
    @ObservedObject var storeInfoStore: StoreInfoStore
    let menuId: String
    let goldenMax: Double
    @Environment(\.dismiss) private var dismiss

    @State private var recipe: [BURecipeIngredient] = []
    @State private var addSel: String = ""
    @State private var loaded = false

    private var menu: BUInventoryItem? { storeInfoStore.state.inventory.first { $0.id == menuId } }
    private var materials: [BUInventoryItem] { storeInfoStore.state.inventory.filter { $0.itemType != "product" } }
    private var usedIds: Set<String> { Set(recipe.map { $0.materialId }) }
    private var addable: [BUInventoryItem] { materials.filter { !usedIds.contains($0.id) } }

    // 미리보기 원가(현재 편집 중 recipe 기준)
    private var previewCost: Double {
        guard let m = menu else { return 0 }
        var probe = m; probe.recipe = recipe
        return RecipeCost.menuCostPerServing(probe, materials: materials)
    }
    private var previewRatio: Double {
        guard let m = menu, m.sellingPrice > 0 else { return 0 }
        return previewCost / m.sellingPrice * 100
    }

    var body: some View {
        ZStack(alignment: .top) {
            BUBackgroundSurface()
            ScrollView {
                VStack(spacing: BUSpacing.md) {
                    summaryCard
                    ingredientsCard
                    saveButton
                }
                .padding(.horizontal, BUSpacing.md)
                .padding(.top, BUSpacing.sm)
                .padding(.bottom, 40)
            }
        }
        .navigationTitle(menu?.name ?? "레시피")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { if !loaded { recipe = menu?.recipe ?? []; loaded = true } }
    }

    private var summaryCard: some View {
        BUCard(.outer) {
            HStack(spacing: 8) {
                tile("판매가", won(menu?.sellingPrice ?? 0), BUColor.midnight)
                tile("재료 원가", won(previewCost), BUColor.midnight)
                tile("원가율", (menu?.sellingPrice ?? 0) > 0 ? "\(Int(previewRatio.rounded()))%" : "—",
                     previewRatio > goldenMax && (menu?.sellingPrice ?? 0) > 0 ? brick : BUColor.midnight,
                     sub: "황금률 \(Int(goldenMax))%")
            }
        }
    }

    private func tile(_ label: String, _ value: String, _ color: Color, sub: String? = nil) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.system(size: 16, weight: .bold)).foregroundStyle(color)
            Text(label).font(.system(size: 10.5, weight: .semibold)).foregroundStyle(BUColor.ink)
            if let sub { Text(sub).font(.system(size: 9)).foregroundStyle(BUColor.inkMuted) }
        }.frame(maxWidth: .infinity)
    }

    private var ingredientsCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                if materials.isEmpty {
                    Text("재고 관리에서 재료를 먼저 등록하세요.\n등록된 재료가 여기 선택지로 나타납니다.")
                        .font(.system(size: 12.5)).foregroundStyle(BUColor.inkSecondary)
                } else {
                    if recipe.isEmpty {
                        Text("아직 재료가 없습니다. 아래에서 추가하세요.")
                            .font(.system(size: 12.5)).foregroundStyle(BUColor.inkSecondary)
                    }
                    ForEach(Array(recipe.enumerated()), id: \.offset) { idx, ing in
                        ingredientRow(idx: idx, ing: ing)
                    }
                    if !addable.isEmpty { addRow }
                }
            }
        }
    }

    private func ingredientRow(idx: Int, ing: BURecipeIngredient) -> some View {
        let mat = materials.first { $0.id == ing.materialId }
        let units = RecipeCost.compatibleUnits(mat?.unit ?? "개")
        let lineCost = RecipeCost.ingredientCost(ing, materials: materials)
        return HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 2) {
                Text(mat?.name ?? "삭제된 재료").font(.system(size: 13.5, weight: .semibold)).foregroundStyle(BUColor.ink)
                Text("\(won(mat?.unitCost ?? 0))/\(mat?.unit ?? "") · 재고 \(fmtQty(mat?.quantity ?? 0))\(mat?.unit ?? "")" + (lineCost != nil ? " · \(won(lineCost!))" : ""))
                    .font(.system(size: 10.5)).foregroundStyle(BUColor.inkSecondary)
            }
            Spacer(minLength: 4)
            TextField("0", text: Binding(
                get: { fmtQty(ing.qty) },
                set: { recipe[idx].qty = Double($0.filter { "0123456789.".contains($0) }) ?? 0 }
            ))
            .keyboardType(.decimalPad).multilineTextAlignment(.trailing)
            .frame(width: 54).textFieldStyle(.roundedBorder)
            Picker("", selection: Binding(get: { ing.unit }, set: { recipe[idx].unit = $0 })) {
                ForEach(units, id: \.self) { Text($0).tag($0) }
            }.pickerStyle(.menu).tint(BUColor.midnight).frame(minWidth: 44)
            Button { recipe.remove(at: idx) } label: {
                Image(systemName: "trash").font(.system(size: 14)).foregroundStyle(brick)
            }
        }
    }

    private var addRow: some View {
        HStack(spacing: 8) {
            Picker("재료 선택…", selection: $addSel) {
                Text("재료 선택…").tag("")
                ForEach(addable) { Text("\($0.name) (\(won($0.unitCost))/\($0.unit))").tag($0.id) }
            }.pickerStyle(.menu).tint(BUColor.midnight).frame(maxWidth: .infinity, alignment: .leading)
            Button {
                guard let mat = materials.first(where: { $0.id == addSel }) else { return }
                recipe.append(BURecipeIngredient(materialId: mat.id, qty: 1, unit: RecipeCost.compatibleUnits(mat.unit)[0]))
                addSel = ""
            } label: {
                Label("추가", systemImage: "plus").font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white).padding(.horizontal, 14).padding(.vertical, 9)
                    .background(addSel.isEmpty ? BUColor.midnight.opacity(0.35) : BUColor.midnight, in: RoundedRectangle(cornerRadius: 10))
            }.disabled(addSel.isEmpty)
        }
    }

    private var saveButton: some View {
        // 판매 기록(재고 차감)은 메뉴 목록의 −/＋ 카운터에서 — 여기선 레시피 저장만. (웹 정합)
        Button {
            saveRecipe()
            dismiss()
        } label: {
            Text("저장").font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                .frame(maxWidth: .infinity).padding(.vertical, 13)
                .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 12))
        }
    }

    private func saveRecipe() {
        storeInfoStore.commit { s in
            s.inventory = s.inventory.map { it in
                guard it.id == menuId else { return it }
                var c = it; c.recipe = recipe; return c
            }
        }
    }
}

private func fmtQty(_ n: Double) -> String {
    if n == n.rounded() { return String(Int(n)) }
    return String(format: "%g", n)
}
