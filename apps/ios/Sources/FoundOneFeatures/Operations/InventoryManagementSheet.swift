//
//  InventoryManagementSheet.swift — 재고 항목 CRUD + CSV 가져오기
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/analytics/InventoryManagementCard.tsx
//
//  편집: 항목 목록 + 추가/수정 폼 (이름·수량·단위·최소임계·일소진량·카테고리)
//  CSV:  파일 선택 → AI 파싱 (/api/ai/products/parse) → 미리보기 → 일괄 추가
//  저장: storeInfoStore.commit { $0.inventory = ... } → debounced Supabase sync
//

import SwiftUI
import UniformTypeIdentifiers
import FoundOneCore
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

/// 재고 카테고리 코드 → 한글 라벨 (표시·정렬 그룹용). 폼 categoryLabels 와 일치.
func inventoryCategoryLabel(_ code: String) -> String {
    switch code {
    case "fresh": return "신선식품"
    case "dry": return "건식품"
    case "frozen": return "냉동"
    case "beverage": return "음료"
    case "supply": return "소모품"
    default: return "기타"
    }
}

/// 재고 항목의 분류 칩 라벨. 상품(product)은 자유분류(displayCategory) 우선, 식자재는 enum 라벨.
/// nil = 칩 미표시. (2026-07-22 상품모델 통합, 웹 정합)
func inventoryCategoryChipLabel(_ item: BUInventoryItem) -> String? {
    if item.itemType == "product", let d = item.displayCategory, !d.isEmpty { return d }
    if !item.category.isEmpty && item.category != "other" { return inventoryCategoryLabel(item.category) }
    return nil
}

public struct InventoryManagementSheet: View {

    @Environment(\.dismiss) private var dismiss

    @ObservedObject var storeInfoStore: StoreInfoStore

    @State private var showForm = false
    @State private var editingItem: BUInventoryItem?
    @State private var pendingDeleteItem: BUInventoryItem?
    @State private var sortMode: InvSortMode = .urgency
    private enum InvSortMode: String, CaseIterable, Identifiable {
        case urgency, name, category
        var id: String { rawValue }
        var label: String {
            switch self {
            case .urgency: return "긴급도"
            case .name: return "가나다"
            case .category: return "분류"
            }
        }
    }

    // CSV import states
    @State private var showFilePicker = false
    @State private var isImporting = false
    @State private var importPreviewItems: [BUInventoryItem] = []
    @State private var showImportPreview = false
    @State private var importError: String?

    /// 메뉴 업종(음식·카페·서비스) 여부 — true 면 메뉴 폼에서 재고 수량 숨김 +
    /// 신규 메뉴 저장 직후 레시피(재료 선택) 편집 자동 오픈. (2026-07-22 사장님 지시, 웹 정합)
    let isMenuIndustry: Bool
    let goldenMax: Double
    /// 업종 카테고리 — 스타터팩(콜드스타트 체크리스트) 노출 판단용 (2026-08-25, 웹 정합)
    let categoryId: String?
    @State private var recipeEditMenuId: String?
    @State private var starterDeselected: Set<String> = []

    public init(storeInfoStore: StoreInfoStore, isMenuIndustry: Bool = false, goldenMax: Double = 33, categoryId: String? = nil) {
        self.storeInfoStore = storeInfoStore
        self.isMenuIndustry = isMenuIndustry
        self.goldenMax = goldenMax
        self.categoryId = categoryId
    }

    private var items: [BUInventoryItem] { storeInfoStore.state.inventory }

    /// 스타터팩 — 재료 0개 콜드스타트에서만 (재진입 소음 방지) + 이미 있는 이름 제외 (웹 정합)
    private var starterItems: [BUStarterPackItem] {
        guard let pack = BUInventoryStarterPacks.resolve(categoryId: categoryId),
              !items.contains(where: { $0.itemType != "product" }) else { return [] }
        return pack.items.filter { s in !items.contains { $0.name == s.name } }
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                BUFlatBackground()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        headerBlock
                        // 스타터 패널은 재료 0개일 때 목록(메뉴 등)과 공존 — 메뉴만 있는 매장도 재료 콜드스타트 해소
                        if !starterItems.isEmpty {
                            starterPanel
                        }
                        if items.isEmpty {
                            if starterItems.isEmpty { emptyState }
                        } else {
                            itemList
                        }
                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
                if isImporting {
                    importingOverlay
                }
            }
            .navigationTitle("재고 관리")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarLeading) {
                    Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 6) {
                        Button {
                            showFilePicker = true
                        } label: {
                            Image(systemName: "doc.badge.plus")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(BUColor.midnight)
                        }
                        Button {
                            editingItem = nil
                            showForm = true
                        } label: {
                            Image(systemName: "plus")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(BUColor.midnight)
                        }
                    }
                }
                #endif
            }
            .fileImporter(
                isPresented: $showFilePicker,
                allowedContentTypes: ([.commaSeparatedText, .plainText, .tabSeparatedText] as [UTType])
                    + [UTType(filenameExtension: "xlsx"), UTType(filenameExtension: "xls")].compactMap { $0 },
                allowsMultipleSelection: false
            ) { result in
                handleFileImport(result)
            }
            .alert("가져오기 오류", isPresented: Binding(
                get: { importError != nil },
                set: { if !$0 { importError = nil } }
            )) {
                Button("확인", role: .cancel) { importError = nil }
            } message: {
                Text(importError ?? "")
            }
            .sheet(isPresented: $showForm) {
                InventoryItemForm(
                    existing: editingItem,
                    isMenuIndustry: isMenuIndustry,
                    onSave: { newItem in
                        var isNew = false
                        storeInfoStore.commit { state in
                            if let idx = state.inventory.firstIndex(where: { $0.id == newItem.id }) {
                                state.inventory[idx] = newItem
                            } else {
                                state.inventory.append(newItem)
                                isNew = true
                            }
                        }
                        showForm = false
                        // 신규 메뉴 → 재료 선택(레시피) 자동 오픈: 추가→레시피가 한 흐름. (웹 정합)
                        if isNew && isMenuIndustry && newItem.itemType == "product" {
                            recipeEditMenuId = newItem.id
                        }
                    },
                    onCancel: { showForm = false }
                )
            }
            .sheet(isPresented: Binding(get: { recipeEditMenuId != nil }, set: { if !$0 { recipeEditMenuId = nil } })) {
                if let menuId = recipeEditMenuId {
                    NavigationStack {
                        RecipeEditorView(storeInfoStore: storeInfoStore, menuId: menuId, goldenMax: goldenMax)
                            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("닫기") { recipeEditMenuId = nil }.foregroundStyle(BUColor.midnight) } }
                    }
                }
            }
            .sheet(isPresented: $showImportPreview) {
                InventoryImportPreviewSheet(
                    items: importPreviewItems,
                    onConfirm: { confirmed in
                        storeInfoStore.commit { state in
                            for item in confirmed {
                                state.inventory.append(item)
                            }
                        }
                        showImportPreview = false
                    },
                    onCancel: { showImportPreview = false }
                )
            }
            .confirmationDialog(
                "재고를 삭제하시겠습니까?",
                isPresented: Binding(get: { pendingDeleteItem != nil }, set: { if !$0 { pendingDeleteItem = nil } }),
                presenting: pendingDeleteItem
            ) { item in
                Button("삭제", role: .destructive) {
                    storeInfoStore.commit { state in
                        state.inventory.removeAll { $0.id == item.id }
                    }
                    pendingDeleteItem = nil
                }
                Button("취소", role: .cancel) { pendingDeleteItem = nil }
            } message: { item in
                Text("'\(item.name)' 재고를 삭제하면 되돌릴 수 없습니다.")
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Subviews

    private var headerBlock: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("재고 \(items.count)개 · \(items.filter { $0.isLowStock }.count)건 재주문")
                .font(.system(size: 11, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
                .textCase(.uppercase)
                .tracking(0.5)
            Text("재고 목록")
                .font(.system(size: 19, weight: .heavy))
                .foregroundStyle(BUColor.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var emptyState: some View {
        BUCard(.outer) {
            VStack(spacing: 12) {
                Image(systemName: "shippingbox")
                    .font(.system(size: 32, weight: .light))
                    .foregroundStyle(BUColor.inkMuted)
                Text("재고 항목이 없습니다")
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text("오른쪽 위 + 버튼으로 추가하거나\n파일 버튼으로 CSV·엑셀(.xlsx)을 한 번에 가져오세요.")
                    .font(.system(size: 13))
                    .foregroundStyle(BUColor.inkSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
    }

    /// 스타터 체크리스트 — 콜드스타트 해소 (2026-08-25, 웹 InventoryOpsCard 정합).
    /// 기본 전체 선택(카페는 안 쓰는 게 더 적음), 칩에서 단위=관리 방식 자연 학습.
    private var starterPanel: some View {
        let pack = BUInventoryStarterPacks.resolve(categoryId: categoryId)
        let pickedCount = starterItems.filter { !starterDeselected.contains($0.name) }.count
        return BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                Text(pack?.title ?? "많이 쓰는 품목")
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text("쓰는 것만 골라 한 번에 추가하세요. 수량·가격은 나중에 아는 것부터 채우면 돼요.")
                    .font(.system(size: 11.5))
                    .foregroundStyle(BUColor.inkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
                BUWrapLayout(spacing: 6) {
                    ForEach(starterItems) { s in
                        starterChip(s)
                    }
                }
                Button {
                    let picked = starterItems.filter { !starterDeselected.contains($0.name) }
                    guard !picked.isEmpty else { return }
                    storeInfoStore.commit { state in
                        for s in picked {
                            state.inventory.append(BUInventoryItem(
                                name: s.name, quantity: 0, unit: s.unit,
                                category: s.category, itemType: "material"
                            ))
                        }
                    }
                } label: {
                    Text("\(pickedCount)개 품목 추가")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 11)
                        .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 12))
                }
                .buttonStyle(.plain)
                .disabled(pickedCount == 0)
            }
        }
    }

    private func starterChip(_ s: BUStarterPackItem) -> some View {
        let selected = !starterDeselected.contains(s.name)
        let bulk = BUInventoryItem.bulkUnits.contains(s.unit.lowercased())
        return Button {
            if selected { starterDeselected.insert(s.name) } else { starterDeselected.remove(s.name) }
        } label: {
            HStack(spacing: 4) {
                Text("\(selected ? "✓ " : "")\(s.name)")
                    .font(.system(size: 12, weight: .semibold))
                Text("\(s.unit) · \(bulk ? "원가·리듬" : "수량")")
                    .font(.system(size: 10))
                    .opacity(0.7)
            }
            .foregroundStyle(selected ? BUColor.midnight : BUColor.inkMuted)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(selected ? BUColor.midnight.opacity(0.08) : Color(.systemBackground), in: Capsule())
            .overlay(Capsule().strokeBorder(selected ? BUColor.midnight.opacity(0.3) : BUColor.cardBorder, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private var itemList: some View {
        VStack(spacing: 8) {
            Picker("정렬", selection: $sortMode) {
                ForEach(InvSortMode.allCases) { mode in
                    Text(mode.label).tag(mode)
                }
            }
            .pickerStyle(.segmented)
            .padding(.bottom, 4)
            ForEach(sortedItems) { item in
                itemRow(item)
            }
            // ── 원가·발주 리듬 재료 (벌크 단위) — 잔량 대신 마지막 발주 경과일 (2026-08-25, 웹 정합) ──
            if !bulkItems.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("원가·발주 리듬 관리")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(BUColor.midnight)
                        .textCase(.uppercase)
                        .tracking(0.5)
                        .padding(.top, 8)
                    Text("무게·부피 단위 재료는 잔량 대신 원가 계산과 발주 리듬으로 관리돼요.")
                        .font(.system(size: 11))
                        .foregroundStyle(BUColor.inkMuted)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                ForEach(bulkItems) { item in
                    bulkItemRow(item)
                }
            }
        }
    }

    /// 수량 추적 대상 (개수 단위 재료 + 상품) / 벌크(무게·부피 단위) 재료 분리 — 추적모드 분리 (2026-08-25)
    private var countedItems: [BUInventoryItem] { items.filter { !$0.isBulkTracked } }
    private var bulkItems: [BUInventoryItem] { items.filter { $0.isBulkTracked } }

    private var sortedItems: [BUInventoryItem] {
        let base = countedItems
        switch sortMode {
        case .name:
            return base.sorted { $0.name.localizedCompare($1.name) == .orderedAscending }
        case .category:
            return base.sorted {
                if $0.category != $1.category { return $0.category < $1.category }
                return $0.name.localizedCompare($1.name) == .orderedAscending
            }
        case .urgency:
            let alert  = base.filter { $0.isLowStock }
            let watch  = base.filter { !$0.isLowStock && $0.daysUntilStockout <= 7 }
            let normal = base.filter { !$0.isLowStock && $0.daysUntilStockout > 7 }
            return alert + watch + normal
        }
    }

    private func itemRow(_ item: BUInventoryItem) -> some View {
        BUCard(.outer) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(item.name)
                            .font(.system(size: 14, weight: .heavy))
                            .foregroundStyle(BUColor.ink)
                        if item.isLowStock {
                            Text("재주문")
                                .font(.system(size: 9.5, weight: .bold))
                                .foregroundStyle(BUColor.warn)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(BUColor.warn.opacity(0.12), in: Capsule())
                        } else if item.daysUntilStockout <= 7 {
                            Text("주의")
                                .font(.system(size: 9.5, weight: .bold))
                                .foregroundStyle(BUColor.inkSecondary)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(BUColor.midnight08, in: Capsule())
                        }
                        if let catLabel = inventoryCategoryChipLabel(item) {
                            Text(catLabel)
                                .font(.system(size: 9.5, weight: .semibold))
                                .foregroundStyle(BUColor.inkSecondary)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(BUColor.midnight.opacity(0.06), in: Capsule())
                        }
                        Spacer(minLength: 0)
                    }
                    HStack(spacing: 12) {
                        infoChip(label: "재고", value: "\(Int(item.quantity))\(item.unit)")
                        infoChip(label: "최소", value: "\(Int(item.minThreshold))\(item.unit)")
                        if item.dailyUsage > 0 {
                            infoChip(label: "소진", value: "\(item.daysUntilStockout)일")
                        }
                    }
                }
                Menu {
                    Button("수정") {
                        editingItem = item
                        showForm = true
                    }
                    Button("삭제", role: .destructive) {
                        pendingDeleteItem = item
                    }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                        .padding(8)
                }
            }
        }
    }

    /// 벌크(무게·부피 단위) 재료 행 — 잔량 없이 단가·발주 리듬 + [오늘 발주] (2026-08-25, 웹 정합)
    private func bulkItemRow(_ item: BUInventoryItem) -> some View {
        let daysSince = item.daysSinceLastOrder(todayKST: CoachingHistoryRepository.todayKST())
        let cycle = item.orderCycleDays ?? 0
        let overdue = cycle > 0 && (daysSince ?? 0) >= cycle && daysSince != nil
        return BUCard(.outer) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(item.name)
                            .font(.system(size: 14, weight: .heavy))
                            .foregroundStyle(BUColor.ink)
                        if overdue {
                            Text("발주 시기 확인")
                                .font(.system(size: 9.5, weight: .bold))
                                .foregroundStyle(BUColor.danger)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(BUColor.danger.opacity(0.10), in: Capsule())
                        }
                        if let catLabel = inventoryCategoryChipLabel(item) {
                            Text(catLabel)
                                .font(.system(size: 9.5, weight: .semibold))
                                .foregroundStyle(BUColor.inkSecondary)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(BUColor.midnight.opacity(0.06), in: Capsule())
                        }
                        Spacer(minLength: 0)
                    }
                    HStack(spacing: 12) {
                        // 단가는 사장님 언어로 — 구매 묶음("1L 2,600원") > L·kg 환산 > 원단위 (웹 정합).
                        //  금액은 절사 없는 정확 표기 — formatKRWCompact 는 18,000→"1만" 절사라 원가 맥락에 부적합 (2026-08-25)
                        if let size = item.purchasePackSize, let price = item.purchasePackPrice, size > 0, price > 0 {
                            infoChip(label: "구매", value: "\(BUInventoryItem.packSizeLabel(size, unit: item.unit)) \(Int(price).formatted())원")
                        } else if let disp = item.bulkCostDisplay {
                            infoChip(label: "단가", value: "\(Int(disp.amount).formatted())원/\(disp.perUnit)")
                        } else if item.unitCost > 0 {
                            infoChip(label: "단가", value: "\(Int(item.unitCost).formatted())원/\(item.unit)")
                        }
                        infoChip(
                            label: "발주",
                            value: daysSince.map { "\($0)일 전" } ?? "기록 없음"
                        )
                        if cycle > 0 {
                            infoChip(label: "주기", value: "\(cycle)일")
                        }
                    }
                }
                Menu {
                    Button("오늘 발주") {
                        let today = CoachingHistoryRepository.todayKST()
                        storeInfoStore.commit { state in
                            if let idx = state.inventory.firstIndex(where: { $0.id == item.id }) {
                                state.inventory[idx].lastOrderedAt = today
                            }
                        }
                    }
                    Button("수정") {
                        editingItem = item
                        showForm = true
                    }
                    Button("삭제", role: .destructive) {
                        pendingDeleteItem = item
                    }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                        .padding(8)
                }
            }
        }
    }

    private func infoChip(label: String, value: String) -> some View {
        HStack(spacing: 3) {
            Text(label)
                .font(.system(size: 10, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
            Text(value)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(BUColor.ink)
        }
    }

    private var importingOverlay: some View {
        Color.black.opacity(0.35)
            .ignoresSafeArea()
            .overlay {
                VStack(spacing: 10) {
                    ProgressView()
                        .scaleEffect(1.1)
                        .tint(BUColor.midnight)
                    Text("AI가 파일을 분석하는 중…")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(BUColor.ink)
                }
                .padding(.horizontal, 28)
                .padding(.vertical, 20)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
            }
    }

    // MARK: - File Import

    private func handleFileImport(_ result: Result<[URL], any Error>) {
        guard case .success(let urls) = result, let url = urls.first else { return }
        isImporting = true
        Task {
            await doImport(url: url)
        }
    }

    private func doImport(url: URL) async {
        guard url.startAccessingSecurityScopedResource() else {
            isImporting = false
            importError = "파일 접근 권한이 없습니다."
            return
        }
        defer { url.stopAccessingSecurityScopedResource() }

        guard let data = try? Data(contentsOf: url) else {
            isImporting = false
            importError = "파일을 읽을 수 없습니다."
            return
        }
        guard data.count <= 5 * 1024 * 1024 else {
            isImporting = false
            importError = "파일이 너무 큽니다 (최대 5MB)."
            return
        }
        let ext = url.pathExtension.lowercased()
        let repo = CsvParseRepository(supabase: BUSupabase.shared.client)
        do {
            let items: [BUInventoryItem]
            if ext == "xlsx" || ext == "xls" {
                // 엑셀: iOS 네이티브 파싱 불가 → 파일 base64 전송, 서버(exceljs)가 CSV 변환.
                items = try await repo.parseInventory(fileBase64: data.base64EncodedString(), fileName: url.lastPathComponent)
            } else {
                guard let text = String(data: data, encoding: .utf8) ?? String(data: data, encoding: .isoLatin1) else {
                    isImporting = false
                    importError = "텍스트 파일을 읽을 수 없습니다. CSV 또는 엑셀(.xlsx) 파일을 선택해 주세요."
                    return
                }
                items = try await repo.parseInventory(text: text)
            }
            isImporting = false
            importPreviewItems = items
            showImportPreview = true
        } catch {
            isImporting = false
            importError = error.localizedDescription
        }
    }
}

// MARK: - InventoryImportPreviewSheet

private struct InventoryImportPreviewSheet: View {

    @Environment(\.dismiss) private var dismiss

    let items: [BUInventoryItem]
    let onConfirm: ([BUInventoryItem]) -> Void
    let onCancel: () -> Void

    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUFlatBackground()
                ScrollView {
                    VStack(spacing: 8) {
                        BUCard(.outer) {
                            HStack(spacing: 8) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(BUColor.success)
                                Text("총 \(items.count)개 항목을 인식했습니다. 재고 목록에 추가하시겠습니까?")
                                    .font(.system(size: 13))
                                    .foregroundStyle(BUColor.inkSecondary)
                            }
                        }
                        ForEach(items) { item in
                            importItemRow(item)
                        }
                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("재고 \(items.count)개 가져오기")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarLeading) {
                    Button("취소", action: onCancel).foregroundStyle(BUColor.inkMuted)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("추가") { onConfirm(items) }
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(BUColor.midnight)
                }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    private func importItemRow(_ item: BUInventoryItem) -> some View {
        BUCard(.outer) {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.name)
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    HStack(spacing: 10) {
                        importChip(label: "재고", value: "\(Int(item.quantity))\(item.unit)")
                        if item.unitCost > 0 {
                            importChip(label: "단가", value: formatKRWCompact(item.unitCost) + "원")
                        }
                        if let catLabel = inventoryCategoryChipLabel(item) {
                            importChip(label: "분류", value: catLabel)
                        }
                    }
                }
                Spacer(minLength: 0)
            }
        }
    }

    private func importChip(label: String, value: String) -> some View {
        HStack(spacing: 3) {
            Text(label)
                .font(.system(size: 10, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
            Text(value)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(BUColor.ink)
        }
    }
}

// MARK: - InventoryItemForm

private struct InventoryItemForm: View {

    @Environment(\.dismiss) private var dismiss

    let existing: BUInventoryItem?
    /// 메뉴 업종이면 메뉴 폼에서 재고 수량 숨김(만들어 파는 품목) — 웹 폼 정합. (2026-07-22)
    let isMenuIndustry: Bool
    let onSave: (BUInventoryItem) -> Void
    let onCancel: () -> Void

    @State private var name: String
    @State private var quantity: String
    @State private var unit: String
    @State private var minThreshold: String
    @State private var dailyUsage: String
    @State private var unitCost: String
    @State private var category: String
    // 유형 토글 + 메뉴 전용 필드 (2026-07-22 통합 — 웹 InventoryOpsCard 폼 정합)
    @State private var itemType: String
    @State private var sellingPrice: String
    @State private var displayCategory: String
    /// 벌크(무게·부피 단위) 재료 전용 — 발주 주기(일) (2026-08-25 추적모드 분리, 웹 정합)
    @State private var orderCycleDays: String
    /// 벌크 재료 전용 — 구매 묶음(한 번에 사는 양·가격) → 단가 자동 파생 (웹 정합)
    @State private var purchasePackSize: String
    @State private var purchasePackPrice: String

    private let categories = ["fresh", "dry", "frozen", "beverage", "supply", "other"]
    private let categoryLabels: [String: String] = [
        "fresh": "신선식품", "dry": "건식품", "frozen": "냉동",
        "beverage": "음료", "supply": "소모품", "other": "기타"
    ]

    init(existing: BUInventoryItem?, isMenuIndustry: Bool = false, onSave: @escaping (BUInventoryItem) -> Void, onCancel: @escaping () -> Void) {
        self.existing = existing
        self.isMenuIndustry = isMenuIndustry
        self.onSave = onSave
        self.onCancel = onCancel
        _name         = State(initialValue: existing?.name ?? "")
        _quantity     = State(initialValue: existing.map { "\(Int($0.quantity))" } ?? "")
        _unit         = State(initialValue: existing?.unit ?? "개")
        _minThreshold = State(initialValue: existing.map { "\(Int($0.minThreshold))" } ?? "")
        _dailyUsage   = State(initialValue: existing.map { $0.dailyUsage > 0 ? "\(Int($0.dailyUsage))" : "" } ?? "")
        _unitCost     = State(initialValue: existing.map { $0.unitCost > 0 ? "\(Int($0.unitCost))" : "" } ?? "")
        _category     = State(initialValue: existing?.category ?? "other")
        _itemType     = State(initialValue: existing?.itemType ?? "material")
        _sellingPrice = State(initialValue: existing.map { $0.sellingPrice > 0 ? "\(Int($0.sellingPrice))" : "" } ?? "")
        _displayCategory = State(initialValue: existing?.displayCategory ?? "")
        _orderCycleDays = State(initialValue: existing?.orderCycleDays.map { "\($0)" } ?? "")
        _purchasePackSize = State(initialValue: existing?.purchasePackSize.map { "\(Int($0))" } ?? "")
        _purchasePackPrice = State(initialValue: existing?.purchasePackPrice.map { "\(Int($0))" } ?? "")
    }

    /// 벌크(무게·부피 단위) 재료 — 수량·임계·소진량 대신 발주 주기 (2026-08-25 추적모드 분리)
    private var isBulkForm: Bool {
        itemType != "product" && BUInventoryItem.bulkUnits.contains(unit.trimmingCharacters(in: .whitespaces).lowercased())
    }

    /// 구매 묶음 입력 시 파생 단가 안내, 아니면 관리 방식 설명 (웹 폼 힌트 정합)
    private var bulkFormHint: String {
        let size = Double(purchasePackSize) ?? 0
        let price = Double(purchasePackPrice) ?? 0
        if size > 0 && price > 0 {
            let per = price / size
            // 절사 없는 정확 표기 (formatKRWCompact 는 18,000→"1만" 절사)
            let scaled = ["ml", "cc", "g"].contains(unit.lowercased()) ? " (\(unit.lowercased() == "g" ? "kg" : "L")당 \(Int(per * 1000).formatted())원)" : ""
            return "\(BUInventoryItem.packSizeLabel(size, unit: unit)) \(Int(price).formatted())원 → 단가 자동 계산\(scaled)"
        }
        return "부어 쓰는(무게·부피) 재료는 잔량 대신 원가 계산과 발주 리듬으로 관리돼요 — 수량 입력이 필요 없어요."
    }

    private var canSave: Bool {
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else { return false }
        // 메뉴·판매상품은 판매가 필수 (웹 폼 정합)
        if itemType == "product" { return (Double(sellingPrice) ?? 0) > 0 }
        return true
    }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUFlatBackground()
                ScrollView {
                    VStack(spacing: BUSpacing.md) {
                        BUCard(.outer) {
                            VStack(alignment: .leading, spacing: BUSpacing.md) {
                                // 유형 토글: 원재료 / 메뉴·판매상품 (2026-07-22 통합, 웹 폼 정합)
                                Picker("유형", selection: $itemType) {
                                    Text("원재료").tag("material")
                                    Text(isMenuIndustry ? "메뉴" : "메뉴·판매상품").tag("product")
                                }
                                .pickerStyle(.segmented)
                                formField(label: "항목명", required: true) {
                                    TextField(itemType == "product" ? "예) 김치볶음밥" : "예) 식자재 — 양파", text: $name)
                                        .textFieldStyle(.roundedBorder)
                                }
                                if itemType == "product" {
                                    formField(label: "판매가 (원)", required: true) {
                                        TextField("12000", text: $sellingPrice)
                                            .keyboardType(.numberPad)
                                            .textFieldStyle(.roundedBorder)
                                    }
                                    formField(label: "분류 (예: 메인·사이드·음료)", required: false) {
                                        TextField("메인", text: $displayCategory)
                                            .textFieldStyle(.roundedBorder)
                                    }
                                    if isMenuIndustry {
                                        // 메뉴는 재고 수량 없음(만들어 파는 품목) — 저장하면 재료 선택이 바로 열림. (웹 정합)
                                        Text("저장하면 들어가는 재료를 고르는 화면이 열립니다 — 재료·소요량(0.3개, 200g)으로 원가율 자동 계산, 판매 시 재고 자동 차감.")
                                            .font(.system(size: 11.5)).foregroundStyle(BUColor.inkSecondary)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                }
                                if !(itemType == "product" && isMenuIndustry) {
                                HStack(spacing: 8) {
                                    if !isBulkForm {
                                        formField(label: itemType == "product" ? "재고 수량" : "현재 재고", required: itemType != "product") {
                                            TextField("0", text: $quantity)
                                                .keyboardType(.numberPad)
                                                .textFieldStyle(.roundedBorder)
                                        }
                                    }
                                    formField(label: "단위", required: false) {
                                        // g·kg·ml·l 로 등록하면 레시피 소요량에서 그램·리터 환산 활성화
                                        TextField("개·g·kg·ml", text: $unit)
                                            .textFieldStyle(.roundedBorder)
                                    }
                                    .frame(width: isBulkForm ? nil : 90)
                                }
                                }
                                if itemType != "product" {
                                if isBulkForm {
                                    // 벌크 재료: 잔량 대신 발주 리듬 — 수량·임계·소진량 입력 없음 (2026-08-25, 웹 정합)
                                    formField(label: "발주 주기 (일, 선택)", required: false) {
                                        TextField("예) 3", text: $orderCycleDays)
                                            .keyboardType(.numberPad)
                                            .textFieldStyle(.roundedBorder)
                                    }
                                    // 단가 = 구매 묶음으로 입력 — 사장님은 "우유 1L 2,600원"으로 기억 (웹 정합)
                                    HStack(spacing: 8) {
                                        formField(label: "한 번에 사는 양 (\(unit))", required: false) {
                                            TextField("1000", text: $purchasePackSize)
                                                .keyboardType(.numberPad)
                                                .textFieldStyle(.roundedBorder)
                                        }
                                        formField(label: "그 가격 (원)", required: false) {
                                            TextField("2600", text: $purchasePackPrice)
                                                .keyboardType(.numberPad)
                                                .textFieldStyle(.roundedBorder)
                                        }
                                    }
                                    Text(bulkFormHint)
                                        .font(.system(size: 11.5)).foregroundStyle(BUColor.inkSecondary)
                                        .fixedSize(horizontal: false, vertical: true)
                                } else {
                                formField(label: "최소 임계 (재주문 기준)", required: false) {
                                    TextField("0", text: $minThreshold)
                                        .keyboardType(.numberPad)
                                        .textFieldStyle(.roundedBorder)
                                }
                                formField(label: "일 평균 소진량 (소진일 계산용)", required: false) {
                                    TextField("0", text: $dailyUsage)
                                        .keyboardType(.numberPad)
                                        .textFieldStyle(.roundedBorder)
                                }
                                }
                                }
                                if !isBulkForm {
                                formField(label: itemType == "product" ? "원가 (원, 선택 — 레시피 지정 시 자동)" : "단가 (원, 선택)", required: false) {
                                    TextField("0", text: $unitCost)
                                        .keyboardType(.numberPad)
                                        .textFieldStyle(.roundedBorder)
                                }
                                }
                                if itemType != "product" {
                                formField(label: "카테고리", required: false) {
                                    Picker("카테고리", selection: $category) {
                                        ForEach(categories, id: \.self) { c in
                                            Text(categoryLabels[c] ?? c).tag(c)
                                        }
                                    }
                                    .pickerStyle(.menu)
                                    .tint(BUColor.midnight)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 8)
                                    .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 8))
                                    .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(BUColor.cardBorder, lineWidth: 1))
                                }
                                }
                            }
                        }
                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle(existing == nil ? "메뉴·재료 추가" : (itemType == "product" ? "메뉴 수정" : "재료 수정"))
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarLeading) {
                    Button("취소", action: onCancel).foregroundStyle(BUColor.midnight)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("저장") { save() }
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(canSave ? BUColor.midnight : BUColor.inkMuted)
                        .disabled(!canSave)
                }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    private func formField<Content: View>(label: String, required: Bool, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 3) {
                Text(label)
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(BUColor.inkMuted)
                if required {
                    Text("*").font(.system(size: 11, weight: .heavy)).foregroundStyle(BUColor.danger)
                }
            }
            content()
        }
    }

    private func save() {
        // 구매 묶음 있으면 단가 자동 파생 (웹 handleInvSave 정합)
        let packSize = Double(purchasePackSize) ?? 0
        let packPrice = Double(purchasePackPrice) ?? 0
        let derivedUnitCost: Double? = (packSize > 0 && packPrice > 0) ? packPrice / packSize : nil
        let item = BUInventoryItem(
            id: existing?.id ?? UUID().uuidString,
            name: name.trimmingCharacters(in: .whitespaces),
            // 메뉴(수량 필드 숨김)·벌크 재료(잔량 미추적)는 기존 수량 보존 (신규는 0)
            quantity: ((itemType == "product" && isMenuIndustry) || isBulkForm) ? (existing?.quantity ?? 0) : (Double(quantity) ?? 0),
            unit: unit.isEmpty ? "개" : unit,
            minThreshold: Double(minThreshold) ?? 0,
            unitCost: derivedUnitCost ?? (Double(unitCost) ?? 0),
            category: category,
            itemType: itemType,
            // 상품 자유분류 — 폼 입력 우선(비면 nil), material 은 nil (2026-07-22 통합)
            displayCategory: itemType == "product"
                ? (displayCategory.trimmingCharacters(in: .whitespaces).isEmpty ? nil : displayCategory.trimmingCharacters(in: .whitespaces))
                : nil,
            recipe: existing?.recipe, // 레시피 보존 — 편집은 MenuRecipeSheet 에서
            takeoutRecipe: existing?.takeoutRecipe, // 포장 추가 재료 보존 (2026-08-25 홀/포장 분리)
            sellingPrice: itemType == "product" ? (Double(sellingPrice) ?? 0) : (existing?.sellingPrice ?? 0),
            leadTimeDays: existing?.leadTimeDays ?? 1,
            dailyUsage: Double(dailyUsage) ?? 0,
            monthlySold: existing?.monthlySold ?? 0, // 편집 시 판매량 리셋 버그 수정 (기존 값 보존)
            monthlySoldTakeout: existing?.monthlySoldTakeout ?? 0,
            lastOrderedAt: existing?.lastOrderedAt,
            orderCycleDays: (Int(orderCycleDays) ?? 0) > 0 ? Int(orderCycleDays) : nil,
            purchasePackSize: packSize > 0 ? packSize : nil,
            purchasePackPrice: packPrice > 0 ? packPrice : nil,
            wasteLog: existing?.wasteLog ?? []
        )
        onSave(item)
    }
}

private func formatKRWCompact(_ value: Double) -> String {
    let v = Int(round(value))
    if v >= 100_000_000 { return "\(String(format: "%.1f", Double(v) / 100_000_000))억" }
    if v >= 10_000 { return "\(v / 10_000)만" }
    return v.formatted()
}

#if DEBUG
#Preview("InventoryManagementSheet") {
    InventoryManagementSheet(storeInfoStore: StoreInfoStore(repository: MockStoreInfoRepository()))
}
#endif
