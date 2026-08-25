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
    @State private var showProfitDetail = false // 수익성 상세 팝업 (2026-07-22 사장님 지시)

    public init(storeInfoStore: StoreInfoStore, goldenMax: Double = 33) {
        self.storeInfoStore = storeInfoStore
        self.goldenMax = goldenMax
    }

    private var menus: [BUInventoryItem] { storeInfoStore.state.inventory.filter { $0.itemType == "product" } }
    private var materials: [BUInventoryItem] { storeInfoStore.state.inventory.filter { $0.itemType != "product" } }

    public var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUFlatBackground()
                ScrollView {
                    VStack(spacing: BUSpacing.sm) {
                        if menus.isEmpty {
                            Text("메뉴를 먼저 등록하세요. (로드맵 메뉴 설계 또는 재고 관리)")
                                .font(.system(size: 13)).foregroundStyle(BUColor.inkSecondary)
                                .frame(maxWidth: .infinity).padding(.vertical, 40)
                        } else {
                            profitSummaryRow // [자세히 보기] → 수익성 상세 팝업 (웹 정합)
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
            .sheet(isPresented: $showProfitDetail) {
                MenuProfitabilityDetailSheet(menus: menus, materials: materials, goldenMax: goldenMax, noun: "메뉴")
            }
        }
    }

    /// 수익성 요약 줄 — 평균 원가율·초과 경보 + [자세히 보기] (웹 MenuProfitabilityModal 진입 정합).
    private var profitSummaryRow: some View {
        let totalRevenue = menus.reduce(0) { $0 + $1.sellingPrice }
        let totalCost = menus.reduce(0) { $0 + RecipeCost.menuCostPerServing($1, materials: materials) }
        let avgRatio = totalRevenue > 0 ? totalCost / totalRevenue * 100 : 0
        let overCount = menus.filter { m in
            guard m.sellingPrice > 0 else { return false }
            return RecipeCost.menuCostPerServing(m, materials: materials) / m.sellingPrice * 100 > goldenMax
        }.count
        return Button { showProfitDetail = true } label: {
            HStack(spacing: 8) {
                Text("평균 원가율 \(Int(avgRatio.rounded()))%")
                    .font(.system(size: 12.5, weight: .bold))
                    .foregroundStyle(avgRatio > goldenMax ? brick : BUColor.midnight)
                if overCount > 0 {
                    Text("초과 \(overCount)개")
                        .font(.system(size: 10.5, weight: .bold)).foregroundStyle(brick)
                        .padding(.horizontal, 7).padding(.vertical, 2)
                        .background(brick.opacity(0.08), in: Capsule())
                }
                Spacer()
                Text("자세히 보기 →").font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.midnight)
            }
            .padding(.horizontal, 12).padding(.vertical, 10)
            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func menuCard(_ menu: BUInventoryItem) -> some View {
        let cost = RecipeCost.menuCostPerServing(menu, materials: materials)
        let ratio = menu.sellingPrice > 0 ? cost / menu.sellingPrice * 100 : 0
        let count = menu.recipe?.count ?? 0
        // "지금 재료로 N개 가능" — 입력이 아니라 레시피×재고에서 계산 (웹 정합, 2026-07-23)
        let makeable = RecipeCost.makeableServings(menu, materials: materials)
        return BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                // 상단: 이름·원가 + 원가율
                HStack(spacing: 10) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(menu.name).font(.system(size: 14.5, weight: .semibold)).foregroundStyle(BUColor.ink)
                        // 홀/포장 분리 (2026-08-25, 웹 정합) — 포장 추가 재료 지정 시 포장 원가 병기
                        let extra = RecipeCost.takeoutExtraCost(menu, materials: materials)
                        Text("\(won(menu.sellingPrice)) · 원가 \(won(cost)) · 재료 \(count)종" + (extra > 0 ? " · 포장 +\(won(extra))" : ""))
                            .font(.system(size: 11.5)).foregroundStyle(BUColor.inkSecondary)
                        if let mk = makeable {
                            if mk.servings <= 0 {
                                let limName = mk.limitingMaterialId.flatMap { id in materials.first { $0.id == id }?.name } ?? "재료"
                                Text("\(limName) 소진 — 만들 수 없음")
                                    .font(.system(size: 10.5, weight: .bold)).foregroundStyle(brick)
                            } else {
                                Text("지금 재료로 \(mk.servings)개 가능")
                                    .font(.system(size: 10.5)).foregroundStyle(BUColor.inkMuted)
                            }
                        }
                    }
                    Spacer()
                    if menu.sellingPrice > 0 {
                        // 포장 지정 메뉴는 홀/포장 원가율 병기 — 포장 쪽이 진짜 마진 (2026-08-25, 웹 정합)
                        let extra = RecipeCost.takeoutExtraCost(menu, materials: materials)
                        let hasTakeout = !(menu.takeoutRecipe ?? []).isEmpty
                        let tkRatio = (cost + extra) / menu.sellingPrice * 100
                        let overAny = (hasTakeout ? max(ratio, tkRatio) : ratio) > goldenMax
                        Text(hasTakeout ? "홀 \(Int(ratio.rounded()))% · 포장 \(Int(tkRatio.rounded()))%" : "\(Int(ratio.rounded()))%")
                            .font(.system(size: hasTakeout ? 12 : 15, weight: .bold))
                            .foregroundStyle(overAny ? brick : BUColor.midnight)
                    }
                }
                // 하단: 판매 −/＋ 카운터(재고 자동 차감·복구) + 레시피 편집 진입 (웹 판매량 카운터 정합)
                //  포장 추가 재료 지정 메뉴는 홀/포장 카운터 분할 — 포장만 부자재 차감 (2026-08-25)
                let hasTakeoutCounter = !(menu.takeoutRecipe ?? []).isEmpty
                let hallCount = max(0, menu.monthlySold - menu.monthlySoldTakeout)
                HStack(spacing: 10) {
                    if hasTakeoutCounter {
                        HStack(spacing: 0) {
                            stepBtn("minus", disabled: hallCount <= 0) { recordSale(menu.id, -1) }
                            Text("\(Int(hallCount))\u{00A0}홀")
                                .font(.system(size: 12.5, weight: .semibold)).foregroundStyle(BUColor.ink)
                                .frame(minWidth: 46).monospacedDigit()
                            stepBtn("plus", disabled: count == 0) { recordSale(menu.id, 1) }
                        }
                        HStack(spacing: 0) {
                            stepBtn("minus", disabled: menu.monthlySoldTakeout <= 0) { recordSale(menu.id, -1, takeout: true) }
                            Text("\(Int(menu.monthlySoldTakeout))\u{00A0}포장")
                                .font(.system(size: 12.5, weight: .semibold)).foregroundStyle(BUColor.ink)
                                .frame(minWidth: 46).monospacedDigit()
                            stepBtn("plus", disabled: count == 0) { recordSale(menu.id, 1, takeout: true) }
                        }
                    } else {
                    HStack(spacing: 0) {
                        stepBtn("minus", disabled: menu.monthlySold <= 0) { recordSale(menu.id, -1) }
                        Text("\(Int(menu.monthlySold))\u{00A0}판매")
                            .font(.system(size: 12.5, weight: .semibold)).foregroundStyle(BUColor.ink)
                            .frame(minWidth: 62).monospacedDigit()
                        stepBtn("plus", disabled: count == 0) { recordSale(menu.id, 1) }
                    }
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

    /// 판매 delta 기록 — 홀/포장 분리 SSOT(RecipeCost.recordSale)에 위임 (웹 handleProdSoldChange 정합).
    private func recordSale(_ menuId: String, _ delta: Int, takeout: Bool = false) {
        storeInfoStore.commit { s in
            s.inventory = RecipeCost.recordSale(s.inventory, menuId: menuId, delta: delta, takeout: takeout)
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
    /// 소요량 입력 텍스트 (recipe 와 index 동기) — 숫자에 바로 묶으면 "0." 중간 상태에서
    /// 소수점이 먹혀 0.3 입력 불가 → 문자열로 유지. (웹 RecipeEditorModal EditRow 정합)
    @State private var qtyTexts: [String] = []
    @State private var addSel: String = ""
    /// 포장 추가 재료 — 컵·뚜껑·빨대. 포장 판매에만 차감·원가 반영 (2026-08-25 홀/포장 분리, 웹 정합)
    @State private var tkRecipe: [BURecipeIngredient] = []
    @State private var tkQtyTexts: [String] = []
    @State private var tkAddSel: String = ""
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
    /// 포장 추가 원가·원가율 미리보기 (편집 중 tkRecipe 기준)
    private var previewTakeoutExtra: Double {
        guard let m = menu else { return 0 }
        var probe = m; probe.takeoutRecipe = tkRecipe
        return RecipeCost.takeoutExtraCost(probe, materials: materials)
    }
    private var previewTakeoutRatio: Double {
        guard let m = menu, m.sellingPrice > 0 else { return 0 }
        return (previewCost + previewTakeoutExtra) / m.sellingPrice * 100
    }

    var body: some View {
        ZStack(alignment: .top) {
            BUFlatBackground()
            ScrollView {
                VStack(spacing: BUSpacing.md) {
                    summaryCard
                    ingredientsCard
                    takeoutCard
                    saveButton
                }
                .padding(.horizontal, BUSpacing.md)
                .padding(.top, BUSpacing.sm)
                .padding(.bottom, 40)
            }
        }
        .navigationTitle(menu?.name ?? "레시피")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if !loaded {
                recipe = menu?.recipe ?? []
                qtyTexts = recipe.map { fmtQty($0.qty) }
                tkRecipe = menu?.takeoutRecipe ?? []
                tkQtyTexts = tkRecipe.map { fmtQty($0.qty) }
                loaded = true
            }
        }
    }

    private var summaryCard: some View {
        BUCard(.outer) {
            HStack(spacing: 8) {
                tile("판매가", won(menu?.sellingPrice ?? 0), BUColor.midnight)
                tile("재료 원가", won(previewCost), BUColor.midnight,
                     sub: !tkRecipe.isEmpty && previewTakeoutExtra > 0 ? "포장 +\(won(previewTakeoutExtra))" : nil)
                tile("원가율", (menu?.sellingPrice ?? 0) > 0 ? "\(Int(previewRatio.rounded()))%" : "—",
                     max(previewRatio, tkRecipe.isEmpty ? 0 : previewTakeoutRatio) > goldenMax && (menu?.sellingPrice ?? 0) > 0 ? brick : BUColor.midnight,
                     sub: !tkRecipe.isEmpty && (menu?.sellingPrice ?? 0) > 0
                        ? "포장 \(Int(previewTakeoutRatio.rounded()))% · 황금률 \(Int(goldenMax))%"
                        : "황금률 \(Int(goldenMax))%")
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

    /// 포장 추가 재료 카드 — 컵·뚜껑·빨대. 소모품(supply)은 원탭 칩 (웹 RecipeEditorModal 정합, 2026-08-25).
    /// 아이스/핫 구성이 메뉴마다 달라 자동 세팅은 하지 않는다.
    private var takeoutCard: some View {
        let tkUsed = Set(tkRecipe.map { $0.materialId })
        let supplyChips = materials.filter { $0.category == "supply" && !$0.isBulkTracked && !tkUsed.contains($0.id) }
        let tkAddable = materials.filter { !tkUsed.contains($0.id) }
        return BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                Text("포장 추가 재료")
                    .font(.system(size: 11, weight: .heavy)).foregroundStyle(BUColor.midnight)
                    .textCase(.uppercase).tracking(0.5)
                Text("컵·뚜껑·빨대처럼 포장 판매에만 붙는 재료. 지정하면 판매 기록이 홀/포장으로 나뉘어요.")
                    .font(.system(size: 11.5)).foregroundStyle(BUColor.inkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
                if !materials.isEmpty {
                    if tkRecipe.isEmpty && !supplyChips.isEmpty {
                        BUWrapLayout(spacing: 6) {
                            ForEach(supplyChips) { m in
                                Button {
                                    tkRecipe.append(BURecipeIngredient(materialId: m.id, qty: 1, unit: RecipeCost.compatibleUnits(m.unit)[0]))
                                    tkQtyTexts.append("1")
                                } label: {
                                    Text("+ \(m.name)")
                                        .font(.system(size: 12, weight: .semibold))
                                        .foregroundStyle(BUColor.midnight)
                                        .padding(.horizontal, 10).padding(.vertical, 6)
                                        .background(BUColor.midnight.opacity(0.05), in: Capsule())
                                        .overlay(Capsule().strokeBorder(BUColor.midnight.opacity(0.25), lineWidth: 1))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    if tkRecipe.isEmpty {
                        Text("지정 안 하면 지금처럼 판매 카운터 하나로 동작해요.")
                            .font(.system(size: 11)).foregroundStyle(BUColor.inkMuted)
                    }
                    ForEach(Array(tkRecipe.enumerated()), id: \.offset) { idx, ing in
                        tkIngredientRow(idx: idx, ing: ing)
                    }
                    if !tkAddable.isEmpty { tkAddRow(tkAddable) }
                }
            }
        }
    }

    private func tkIngredientRow(idx: Int, ing: BURecipeIngredient) -> some View {
        let mat = materials.first { $0.id == ing.materialId }
        let units = RecipeCost.compatibleUnits(mat?.unit ?? "개")
        let lineCost = RecipeCost.ingredientCost(ing, materials: materials)
        return HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 2) {
                Text(mat?.name ?? "삭제된 재료").font(.system(size: 13.5, weight: .semibold)).foregroundStyle(BUColor.ink)
                if let mat {
                    let costPart = mat.unitCost > 0 ? "\(won(mat.unitCost))/\(mat.unit)" : "단가 미입력"
                    let linePart = (lineCost != nil && lineCost! > 0) ? " · \(won(lineCost!))" : ""
                    Text(costPart + (mat.isBulkTracked ? "" : " · 재고 \(fmtQty(mat.quantity))\(mat.unit)") + linePart)
                        .font(.system(size: 10.5))
                        .foregroundStyle(mat.unitCost > 0 ? BUColor.inkSecondary : BUColor.danger)
                }
            }
            Spacer(minLength: 4)
            TextField("0", text: Binding(
                get: { idx < tkQtyTexts.count ? tkQtyTexts[idx] : fmtQty(ing.qty) },
                set: { newValue in
                    var sanitized = newValue.filter { "0123456789.".contains($0) }
                    if let first = sanitized.firstIndex(of: ".") {
                        let after = sanitized.index(after: first)
                        sanitized = String(sanitized[..<after]) + sanitized[after...].filter { $0 != "." }
                    }
                    if idx < tkQtyTexts.count { tkQtyTexts[idx] = sanitized }
                    tkRecipe[idx].qty = Double(sanitized) ?? 0
                }
            ))
            .keyboardType(.decimalPad).multilineTextAlignment(.trailing)
            .frame(width: 54).textFieldStyle(.roundedBorder)
            Picker("", selection: Binding(get: { ing.unit }, set: { tkRecipe[idx].unit = $0 })) {
                ForEach(units, id: \.self) { Text($0).tag($0) }
            }.pickerStyle(.menu).tint(BUColor.midnight).frame(minWidth: 44)
            Button {
                tkRecipe.remove(at: idx)
                if idx < tkQtyTexts.count { tkQtyTexts.remove(at: idx) }
            } label: {
                Image(systemName: "trash").font(.system(size: 14)).foregroundStyle(brick)
            }
        }
    }

    private func tkAddRow(_ addable: [BUInventoryItem]) -> some View {
        HStack(spacing: 8) {
            Picker("재료 선택…", selection: $tkAddSel) {
                Text("재료 선택…").tag("")
                ForEach(addable) { Text("\($0.name) (\(won($0.unitCost))/\($0.unit))").tag($0.id) }
            }.pickerStyle(.menu).tint(BUColor.midnight).frame(maxWidth: .infinity, alignment: .leading)
            Button {
                guard let mat = materials.first(where: { $0.id == tkAddSel }) else { return }
                tkRecipe.append(BURecipeIngredient(materialId: mat.id, qty: 1, unit: RecipeCost.compatibleUnits(mat.unit)[0]))
                tkQtyTexts.append("1")
                tkAddSel = ""
            } label: {
                Label("추가", systemImage: "plus").font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white).padding(.horizontal, 14).padding(.vertical, 9)
                    .background(tkAddSel.isEmpty ? BUColor.midnight.opacity(0.35) : BUColor.midnight, in: RoundedRectangle(cornerRadius: 10))
            }.disabled(tkAddSel.isEmpty)
        }
    }

    private func ingredientRow(idx: Int, ing: BURecipeIngredient) -> some View {
        let mat = materials.first { $0.id == ing.materialId }
        let units = RecipeCost.compatibleUnits(mat?.unit ?? "개")
        let lineCost = RecipeCost.ingredientCost(ing, materials: materials)
        return HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 2) {
                Text(mat?.name ?? "삭제된 재료").font(.system(size: 13.5, weight: .semibold)).foregroundStyle(BUColor.ink)
                // 단가 0 = 원가율 과소표시 위험 → "단가 미입력" 정직 표기. 벌크 재료는 잔량 미추적이라 재고 숨김 (2026-08-25, 웹 정합)
                if let mat {
                    let costPart = mat.unitCost > 0 ? "\(won(mat.unitCost))/\(mat.unit)" : "단가 미입력"
                    let stockPart = mat.isBulkTracked ? "" : " · 재고 \(fmtQty(mat.quantity))\(mat.unit)"
                    let linePart = (lineCost != nil && lineCost! > 0) ? " · \(won(lineCost!))" : ""
                    Text(costPart + stockPart + linePart)
                        .font(.system(size: 10.5))
                        .foregroundStyle(mat.unitCost > 0 ? BUColor.inkSecondary : BUColor.danger)
                }
            }
            Spacer(minLength: 4)
            TextField("0", text: Binding(
                get: { idx < qtyTexts.count ? qtyTexts[idx] : fmtQty(ing.qty) },
                set: { newValue in
                    // 소수점 1개까지 허용 — "0." 중간 상태 보존해 0.3 입력 가능 (웹 sanitizeQty 정합)
                    var sanitized = newValue.filter { "0123456789.".contains($0) }
                    if let first = sanitized.firstIndex(of: ".") {
                        let after = sanitized.index(after: first)
                        sanitized = String(sanitized[..<after]) + sanitized[after...].filter { $0 != "." }
                    }
                    if idx < qtyTexts.count { qtyTexts[idx] = sanitized }
                    recipe[idx].qty = Double(sanitized) ?? 0
                }
            ))
            .keyboardType(.decimalPad).multilineTextAlignment(.trailing)
            .frame(width: 54).textFieldStyle(.roundedBorder)
            Picker("", selection: Binding(get: { ing.unit }, set: { recipe[idx].unit = $0 })) {
                ForEach(units, id: \.self) { Text($0).tag($0) }
            }.pickerStyle(.menu).tint(BUColor.midnight).frame(minWidth: 44)
            Button {
                recipe.remove(at: idx)
                if idx < qtyTexts.count { qtyTexts.remove(at: idx) }
            } label: {
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
                qtyTexts.append("1")
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
                var c = it
                c.recipe = recipe
                // 포장 추가 재료 — 비면 nil (판매 카운터 단일로 복귀). (2026-08-25 홀/포장 분리)
                c.takeoutRecipe = tkRecipe.isEmpty ? nil : tkRecipe
                return c
            }
        }
    }
}

private func fmtQty(_ n: Double) -> String {
    if n == n.rounded() { return String(Int(n)) }
    return String(format: "%g", n)
}
