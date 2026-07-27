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
    private var goldenMax: Double { kind == "service-menu" ? 25 : 33 }

    private var inventory: [BUInventoryItem] {
        storeInfoStore.isLoaded ? storeInfoStore.state.inventory : []
    }
    private var products: [BUInventoryItem] { inventory.filter { $0.itemType == "product" } }

    public var body: some View {
        ZStack {
            ScrollView {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    header

                    if kind == "hidden" {
                        EmptyView() // 탭 미노출 업종 — 방어적 (직접 진입 없음)
                    } else if isInventoryKind {
                        // 기존 통합 카드 재사용 — 메뉴 업종은 메뉴 섹션 동봉 (TodayView 정합)
                        InventoryOpsCard(
                            items: isMenuKind ? inventory.filter { $0.itemType != "product" } : inventory,
                            onManage: { showManageSheet = true },
                            menuItems: isMenuKind ? products : [],
                            onManageMenus: isMenuKind ? { showRecipeSheet = true } : nil
                        )
                    } else {
                        catalogCard
                    }

                    Color.clear.frame(height: 110)
                }
                .padding(.horizontal, BUSpacing.screenMargin)
                .padding(.top, BUSpacing.md)
            }
        }
        .navigationTitle(meta?.tabLabelKo ?? "내가 파는 것")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .task {
            guard let uid = BUSupabase.shared.currentUser?.id else { return }
            let repo = FundingProfileRepository(supabase: BUSupabase.shared.client, userId: uid)
            profile = try? await repo.loadSnapshot()
        }
        .sheet(isPresented: $showManageSheet) {
            InventoryManagementSheet(storeInfoStore: storeInfoStore, isMenuIndustry: isMenuKind, goldenMax: goldenMax)
        }
        .sheet(isPresented: $showRecipeSheet) {
            MenuRecipeSheet(storeInfoStore: storeInfoStore, goldenMax: goldenMax)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("OFFERINGS")
                .font(.system(size: 11, weight: .semibold))
                .tracking(1.54)
                .foregroundStyle(BUColor.inkMuted.opacity(0.7))
            Text(meta?.tabLabelKo ?? "내가 파는 것")
                .font(.system(size: 28, weight: .bold))
                .tracking(-1.12)
                .foregroundStyle(BUColor.ink)
            Text(meta?.pageSubKo ?? "")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(BUColor.inkMuted.opacity(0.78))
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 2)
        }
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

    /// 판매 delta — monthlySold ± + (레시피 있으면) 재고 차감 (웹 handleProdSoldChange · MenuRecipeSheet.recordSale 정합)
    private func recordSale(_ itemId: String, _ delta: Int) {
        storeInfoStore.commit { s in
            s.inventory = s.inventory.map { it in
                guard it.id == itemId else { return it }
                var c = it; c.monthlySold = max(0, c.monthlySold + Double(delta)); return c
            }
            s.inventory = RecipeCost.applyRecipeStockDelta(s.inventory, menuId: itemId, delta: Double(delta))
        }
    }
}
