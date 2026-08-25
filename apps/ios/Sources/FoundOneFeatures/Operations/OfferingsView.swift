//
//  OfferingsView.swift — "내가 파는 것" 탭 (2026-07-25 신설, 웹 OfferingsSurface 1:1 미러)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/OfferingsSurface.tsx
//  분기 SSOT: OfferingKindsRegistry.swift (자동 생성 — packages/shared/src/offering-kinds.ts)
//
//  · menu-bom / stocked-goods / service-menu → 기존 InventoryOpsCard + 관리 시트 (CRUD·레시피 완비)
//  · membership / space-booking / digital-goods / subscription-plan / project-service
//    → 권종 카탈로그 + 권종별 판매 수 (사장님 결정 2026-07-25: 스터디카페는
//      갱신 관리가 아니라 "시간권·5,000원권 몇 명" 회전 관리)
//  · hidden(startup-tech 계열) 은 탭 자체가 미노출 (AppRoot webSurfaceTabs)
//
//  정직성: 원가율 자동계산은 menu-bom 만 (offering-kinds 가드 테스트로 강제).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData
import FoundOneCore

/// 등록 직후 레시피 편집기 sheet(item:) 대상 래퍼
private struct RecipeTarget: Identifiable {
    let id: String
}

public struct OfferingsView: View {
    @ObservedObject var storeInfoStore: StoreInfoStore
    /// 프로필 로드 전 폴백 (AppRoot resolverInput.categoryId)
    let fallbackCategoryId: String?

    @State private var profile: FundingProfileSnapshot? = nil
    @State private var showManageSheet = false
    @State private var showRecipeSheet = false
    // 카탈로그 추가 폼 (권종·플랜·요금제)
    @State private var showAddForm = false
    @State private var newName = ""
    @State private var newPrice = ""
    @State private var newCategory = ""
    // 메뉴 카드 인라인 등록 폼 (2026-07-27 사장님 지시 — 메뉴 등록도 메뉴 카드에서)
    @State private var showMenuAddForm = false
    @State private var newMenuName = ""
    @State private var newMenuPrice = ""
    @State private var newMenuCategory = ""
    /// 등록 직후 재료 선택(레시피 편집기) 자동 오픈 대상 — 웹 handleInvSave→setRecipeMenuId 정합 (2026-07-27)
    @State private var recipeTarget: RecipeTarget? = nil

    public init(storeInfoStore: StoreInfoStore, fallbackCategoryId: String?) {
        self.storeInfoStore = storeInfoStore
        self.fallbackCategoryId = fallbackCategoryId
    }

    private var categoryId: String? { profile?.industryCategoryId ?? fallbackCategoryId }
    private var kind: String {
        BUOfferingKinds.resolve(subIndustryId: profile?.subIndustryId, categoryId: categoryId)
    }
    private var meta: BUOfferingKindMeta? { BUOfferingKinds.metaFor(kind) }
    private var isInventoryKind: Bool {
        kind == "menu-bom" || kind == "stocked-goods" || kind == "service-menu"
    }
    private var isMenuKind: Bool { kind == "menu-bom" }
    /// 메뉴/시술 카드와 재고 카드를 분리 렌더하는 유형 (2026-07-27 사장님 지시 — 웹 section prop 미러).
    ///  소매(stocked-goods)는 상품=재고라 분리할 두 실체가 없어 통합 유지.
    private var isSplitKind: Bool { kind == "menu-bom" || kind == "service-menu" }
    private var goldenMax: Double { kind == "service-menu" ? 25 : 33 }

    private var inventory: [BUInventoryItem] {
        storeInfoStore.isLoaded ? storeInfoStore.state.inventory : []
    }
    private var products: [BUInventoryItem] { inventory.filter { $0.itemType == "product" } }

    public var body: some View {
        ZStack {
            ScrollView {
                VStack(spacing: 0) {
                    // 공통 페이지 헤더 (2026-08-19 통일) — 업종별 오퍼링 라벨(offering-kinds SSOT) + 한 줄 설명
                    BUPageHeader(
                        title: meta?.tabLabelKo ?? "내가 파는 것",
                        subtitle: (meta?.pageSubKo).flatMap { $0.split(separator: ".").first.map(String.init) }
                    )
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        if kind == "hidden" {
                            EmptyView() // 탭 미노출 업종 — 방어적 (직접 진입 없음)
                        } else if isSplitKind {
                            // 메뉴/시술 카드 ↔ 재고 카드 분리 (2026-07-27 사장님 지시 —
                            //   통합 카드는 대시보드 몫, 전용 페이지는 명확 구분. 웹 section prop 미러)
                            menuListCard
                            InventoryOpsCard(
                                items: inventory.filter { $0.itemType != "product" },
                                onManage: { showManageSheet = true },
                                titleOverride: kind == "service-menu" ? "소모품 재고" : "재료 재고"
                            )
                        } else if isInventoryKind {
                            // 소매·이커머스 — 상품=재고, 통합 카드 유지
                            InventoryOpsCard(
                                items: inventory,
                                onManage: { showManageSheet = true }
                            )
                        } else {
                            catalogCard
                        }

                        Color.clear.frame(height: 110)
                    }
                    .padding(.horizontal, BUSpacing.screenMargin)
                }
            }
        }
        .task {
            guard let uid = BUSupabase.shared.currentUser?.id else { return }
            let repo = FundingProfileRepository(supabase: BUSupabase.shared.client, userId: uid)
            profile = try? await repo.loadSnapshot()
        }
        .sheet(isPresented: $showManageSheet) {
            InventoryManagementSheet(storeInfoStore: storeInfoStore, isMenuIndustry: isMenuKind, goldenMax: goldenMax, categoryId: categoryId)
        }
        .sheet(isPresented: $showRecipeSheet) {
            MenuRecipeSheet(storeInfoStore: storeInfoStore, goldenMax: goldenMax)
        }
        .sheet(item: $recipeTarget) { target in
            // 메뉴 등록 직후 이어지는 "재료 선택 + 수량" 단계 — 등록된 원재료 중 고르고
            //   소요량 입력 → 원가율 자동·판매 시 재고 차감 (웹 저장 직후 레시피 팝업 정합)
            NavigationStack {
                RecipeEditorView(storeInfoStore: storeInfoStore, menuId: target.id, goldenMax: goldenMax)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("닫기") { recipeTarget = nil }
                        }
                    }
            }
        }
    }

    // MARK: - 메뉴/시술 카드 (분리 렌더 — 웹 InventoryOpsCard section="menu" 미러)

    private var menuNoun: String { kind == "service-menu" ? "시술·서비스" : "메뉴" }

    private var menuListCard: some View {
        let materials = inventory.filter { $0.itemType == "material" }
        let overCount = products.filter { m in
            guard m.sellingPrice > 0 else { return false }
            return RecipeCost.menuCostPerServing(m, materials: materials) / m.sellingPrice * 100 > goldenMax
        }.count
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                ZStack {
                    Circle()
                        .fill(BUColor.midnight.opacity(0.08))
                        .frame(width: 36, height: 36)
                    Image(systemName: kind == "service-menu" ? "scissors" : "fork.knife")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                }
                VStack(alignment: .leading, spacing: 1) {
                    Text("\(menuNoun) 관리")
                        .font(.system(size: 11, weight: .heavy))
                        .tracking(0.8)
                        .foregroundStyle(BUColor.midnight)
                        .textCase(.uppercase)
                    Text(products.isEmpty
                         ? "\(menuNoun) 없음"
                         : (overCount > 0 ? "원가율 초과 \(overCount)개" : "\(products.count)개 등록"))
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                }
                Spacer(minLength: 0)
                // 등록은 여기서 바로 (사장님 지시), 판매±·레시피·수정은 관리 시트에서
                Button {
                    withAnimation(.easeInOut(duration: 0.15)) { showMenuAddForm.toggle() }
                } label: {
                    Text(showMenuAddForm ? "닫기" : "\(menuNoun) 추가")
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(showMenuAddForm ? BUColor.midnight : .white)
                        .padding(.horizontal, 12).padding(.vertical, 7)
                        .background(
                            showMenuAddForm ? AnyShapeStyle(BUColor.midnight.opacity(0.06)) : AnyShapeStyle(BUColor.midnight),
                            in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                        )
                }
                .buttonStyle(.plain)
                Button("관리 →") { showRecipeSheet = true }
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
                    .buttonStyle(.plain)
            }

            if showMenuAddForm { menuAddForm }

            if products.isEmpty {
                if !showMenuAddForm {
                    Text("[\(menuNoun) 추가]로 등록하면 가격·원가율·판매 기록이 여기서 보여요.")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            } else {
                VStack(spacing: 6) {
                    ForEach(products.prefix(5)) { m in
                        let cost = RecipeCost.menuCostPerServing(m, materials: materials)
                        let ratio = m.sellingPrice > 0 ? cost / m.sellingPrice * 100 : 0
                        let over = m.sellingPrice > 0 && ratio > goldenMax
                        HStack(spacing: 8) {
                            Text(m.name)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(BUColor.ink)
                                .lineLimit(1)
                            Spacer(minLength: 0)
                            Text(m.sellingPrice > 0 ? "\(Int(m.sellingPrice).formatted())원" : "—")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(BUColor.inkMuted)
                                .monospacedDigit()
                            if m.sellingPrice > 0, cost > 0 {
                                Text("\(Int(ratio))%")
                                    .font(.system(size: 12, weight: .heavy))
                                    .foregroundStyle(over ? BUColor.danger : BUColor.midnight)
                                    .monospacedDigit()
                            }
                        }
                        .padding(.horizontal, 12).padding(.vertical, 9)
                        .background(
                            over ? BUColor.danger.opacity(0.03) : BUColor.midnight.opacity(0.02),
                            in: RoundedRectangle(cornerRadius: 11, style: .continuous)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 11, style: .continuous)
                                .strokeBorder(over ? BUColor.danger.opacity(0.18) : BUColor.midnight.opacity(0.08), lineWidth: 1)
                        )
                    }
                    if products.count > 5 {
                        Text("+ \(products.count - 5)개 더 — 관리하기에서")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                }
            }
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous).fill(Color.white.opacity(0.85)))
        .overlay(RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
    }

    /// 메뉴 인라인 등록 폼 — 이름·가격·분류만 빠르게. 레시피(원가율)는 [관리 →]에서 연결.
    private var menuAddForm: some View {
        VStack(spacing: 8) {
            TextField("\(menuNoun) 이름 (예: 제육 도시락)", text: $newMenuName)
                .textFieldStyle(.roundedBorder)
            HStack(spacing: 8) {
                TextField("판매가 (원)", text: $newMenuPrice)
                    #if os(iOS)
                    .keyboardType(.numberPad)
                    #endif
                    .textFieldStyle(.roundedBorder)
                TextField(kind == "service-menu" ? "분류 (예: 시술·케어)" : "분류 (예: 메인·사이드)", text: $newMenuCategory)
                    .textFieldStyle(.roundedBorder)
            }
            Button {
                let name = newMenuName.trimmingCharacters(in: .whitespaces)
                guard !name.isEmpty else { return }
                let price = Double(newMenuPrice.filter(\.isNumber)) ?? 0
                let cat = newMenuCategory.trimmingCharacters(in: .whitespaces)
                let newId = UUID().uuidString
                storeInfoStore.commit { s in
                    s.inventory.append(BUInventoryItem(
                        id: newId,
                        name: name, itemType: "product",
                        displayCategory: cat.isEmpty ? nil : cat,
                        sellingPrice: price
                    ))
                }
                newMenuName = ""; newMenuPrice = ""; newMenuCategory = ""
                showMenuAddForm = false
                // 바로 재료 선택 단계로 — 어떤 원재료가 얼마나 쓰이는지 지정 (사장님 지시)
                recipeTarget = RecipeTarget(id: newId)
            } label: {
                Text("추가하고 재료 선택")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(
                        newMenuName.trimmingCharacters(in: .whitespaces).isEmpty ? AnyShapeStyle(BUColor.inkMuted.opacity(0.3)) : AnyShapeStyle(BUColor.midnight),
                        in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                    )
            }
            .buttonStyle(.plain)
            .disabled(newMenuName.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .padding(12)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.08), lineWidth: 1))
    }

    // MARK: - 권종 카탈로그 (membership 계열 — 재고·원가 어휘 없음, 웹 OfferingCatalogCard 미러)

    private var unitLabel: String { meta?.unitLabelKo ?? "항목" }
    private var soldLabel: String {
        kind == "membership" ? "이번 달 이용" : kind == "project-service" ? "이번 달 수주" : "이번 달 판매"
    }
    private var categoryPlaceholder: String {
        switch kind {
        case "membership": return "분류 (예: 시간권 · 기간권 · 금액권)"
        case "space-booking": return "분류 (예: 평일 · 주말 · 야간)"
        case "subscription-plan": return "분류 (예: 베이식 · 프로)"
        default: return "분류 (선택)"
        }
    }

    private var catalogCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("\(unitLabel) 목록")
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(0.8)
                    .foregroundStyle(BUColor.midnight)
                    .textCase(.uppercase)
                Spacer(minLength: 0)
                Button {
                    withAnimation(.easeInOut(duration: 0.15)) { showAddForm.toggle() }
                } label: {
                    Text(showAddForm ? "닫기" : "\(unitLabel) 추가")
                        .font(.system(size: 12.5, weight: .heavy))
                        .foregroundStyle(showAddForm ? BUColor.midnight : .white)
                        .padding(.horizontal, 14).padding(.vertical, 8)
                        .background(
                            showAddForm ? AnyShapeStyle(BUColor.midnight.opacity(0.06)) : AnyShapeStyle(BUColor.midnight),
                            in: RoundedRectangle(cornerRadius: 11, style: .continuous)
                        )
                }
                .buttonStyle(.plain)
            }

            if showAddForm { addForm }

            if products.isEmpty {
                VStack(spacing: 4) {
                    Text("아직 등록된 \(unitLabel)이 없어요")
                        .font(.system(size: 13.5, weight: .semibold))
                        .foregroundStyle(BUColor.ink)
                    Text("위의 [\(unitLabel) 추가]로 첫 \(unitLabel)을 등록해 보세요.")
                        .font(.system(size: 12.5, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 26)
            } else {
                VStack(spacing: 8) {
                    ForEach(products) { item in catalogRow(item) }
                }
            }
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous).fill(Color.white.opacity(0.85)))
        .overlay(RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
    }

    private var addForm: some View {
        VStack(spacing: 8) {
            TextField("\(unitLabel) 이름 (예: 4시간권)", text: $newName)
                .textFieldStyle(.roundedBorder)
            HStack(spacing: 8) {
                TextField("가격 (원)", text: $newPrice)
                    #if os(iOS)
                    .keyboardType(.numberPad)
                    #endif
                    .textFieldStyle(.roundedBorder)
                TextField(categoryPlaceholder, text: $newCategory)
                    .textFieldStyle(.roundedBorder)
            }
            Button {
                let name = newName.trimmingCharacters(in: .whitespaces)
                guard !name.isEmpty else { return }
                let price = Double(newPrice.filter(\.isNumber)) ?? 0
                let cat = newCategory.trimmingCharacters(in: .whitespaces)
                storeInfoStore.commit { s in
                    s.inventory.append(BUInventoryItem(
                        name: name, itemType: "product",
                        displayCategory: cat.isEmpty ? nil : cat,
                        sellingPrice: price
                    ))
                }
                newName = ""; newPrice = ""; newCategory = ""
                showAddForm = false
            } label: {
                Text("추가")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(
                        newName.trimmingCharacters(in: .whitespaces).isEmpty ? AnyShapeStyle(BUColor.inkMuted.opacity(0.3)) : AnyShapeStyle(BUColor.midnight),
                        in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                    )
            }
            .buttonStyle(.plain)
            .disabled(newName.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .padding(12)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.08), lineWidth: 1))
    }

    private func catalogRow(_ item: BUInventoryItem) -> some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(item.name)
                        .font(.system(size: 13.5, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                        .lineLimit(1)
                    if let cat = item.displayCategory, !cat.isEmpty {
                        Text(cat)
                            .font(.system(size: 10.5, weight: .heavy))
                            .foregroundStyle(BUColor.midnight)
                            .padding(.horizontal, 8).padding(.vertical, 2)
                            .background(BUColor.midnight.opacity(0.07), in: Capsule())
                    }
                }
                Text(item.sellingPrice > 0 ? "\(Int(item.sellingPrice).formatted())원" : "—")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .monospacedDigit()
            }
            Spacer(minLength: 0)

            // 판매/이용 수 ± — 사장님 결정: 권종별 몇 명인지가 관리의 핵심
            HStack(spacing: 6) {
                Text(soldLabel)
                    .font(.system(size: 10.5, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
                stepButton("minus", disabled: item.monthlySold <= 0) { recordSale(item.id, -1) }
                Text("\(Int(item.monthlySold))")
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                    .monospacedDigit()
                    .frame(minWidth: 24)
                stepButton("plus", disabled: false) { recordSale(item.id, 1) }
            }

            Button {
                storeInfoStore.commit { s in s.inventory.removeAll { $0.id == item.id } }
            } label: {
                Image(systemName: "trash")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BUColor.danger.opacity(0.75))
                    .padding(6)
                    .background(BUColor.danger.opacity(0.06), in: RoundedRectangle(cornerRadius: 8))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .background(BUColor.midnight.opacity(0.015), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(BUColor.cardBorder, lineWidth: 1))
    }

    private func stepButton(_ symbol: String, disabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(symbol == "plus" ? .white : BUColor.midnight)
                .frame(width: 26, height: 26)
                .background(
                    symbol == "plus" ? AnyShapeStyle(BUColor.midnight) : AnyShapeStyle(Color.white),
                    in: RoundedRectangle(cornerRadius: 8, style: .continuous)
                )
                .overlay(RoundedRectangle(cornerRadius: 8, style: .continuous).strokeBorder(BUColor.midnight.opacity(symbol == "plus" ? 0 : 0.16), lineWidth: 1))
        }
        .buttonStyle(.plain)
        .disabled(disabled)
        .opacity(disabled ? 0.4 : 1)
    }

    /// 판매 delta — 홀/포장 SSOT(RecipeCost.recordSale) 위임. 이 카탈로그(권종·서비스)는 홀 기본 (웹 정합)
    private func recordSale(_ itemId: String, _ delta: Int) {
        storeInfoStore.commit { s in
            s.inventory = RecipeCost.recordSale(s.inventory, menuId: itemId, delta: delta)
        }
    }
}
