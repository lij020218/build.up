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

public struct InventoryManagementSheet: View {

    @Environment(\.dismiss) private var dismiss

    @ObservedObject var storeInfoStore: StoreInfoStore

    @State private var showForm = false
    @State private var editingItem: BUInventoryItem?

    // CSV import states
    @State private var showFilePicker = false
    @State private var isImporting = false
    @State private var importPreviewItems: [BUInventoryItem] = []
    @State private var showImportPreview = false
    @State private var importError: String?

    public init(storeInfoStore: StoreInfoStore) {
        self.storeInfoStore = storeInfoStore
    }

    private var items: [BUInventoryItem] { storeInfoStore.state.inventory }

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        headerBlock
                        if items.isEmpty {
                            emptyState
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
                    onSave: { newItem in
                        storeInfoStore.commit { state in
                            if let idx = state.inventory.firstIndex(where: { $0.id == newItem.id }) {
                                state.inventory[idx] = newItem
                            } else {
                                state.inventory.append(newItem)
                            }
                        }
                        showForm = false
                    },
                    onCancel: { showForm = false }
                )
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

    private var itemList: some View {
        VStack(spacing: 8) {
            ForEach(sortedItems) { item in
                itemRow(item)
            }
        }
    }

    private var sortedItems: [BUInventoryItem] {
        let alert  = items.filter { $0.isLowStock }
        let watch  = items.filter { !$0.isLowStock && $0.daysUntilStockout <= 7 }
        let normal = items.filter { !$0.isLowStock && $0.daysUntilStockout > 7 }
        return alert + watch + normal
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
                        storeInfoStore.commit { state in
                            state.inventory.removeAll { $0.id == item.id }
                        }
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
                BUBackgroundSurface()
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
                        if !item.category.isEmpty && item.category != "other" {
                            importChip(label: "분류", value: item.category)
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
    let onSave: (BUInventoryItem) -> Void
    let onCancel: () -> Void

    @State private var name: String
    @State private var quantity: String
    @State private var unit: String
    @State private var minThreshold: String
    @State private var dailyUsage: String
    @State private var unitCost: String
    @State private var category: String

    private let categories = ["fresh", "dry", "frozen", "beverage", "supply", "other"]
    private let categoryLabels: [String: String] = [
        "fresh": "신선식품", "dry": "건식품", "frozen": "냉동",
        "beverage": "음료", "supply": "소모품", "other": "기타"
    ]

    init(existing: BUInventoryItem?, onSave: @escaping (BUInventoryItem) -> Void, onCancel: @escaping () -> Void) {
        self.existing = existing
        self.onSave = onSave
        self.onCancel = onCancel
        _name         = State(initialValue: existing?.name ?? "")
        _quantity     = State(initialValue: existing.map { "\(Int($0.quantity))" } ?? "")
        _unit         = State(initialValue: existing?.unit ?? "개")
        _minThreshold = State(initialValue: existing.map { "\(Int($0.minThreshold))" } ?? "")
        _dailyUsage   = State(initialValue: existing.map { $0.dailyUsage > 0 ? "\(Int($0.dailyUsage))" : "" } ?? "")
        _unitCost     = State(initialValue: existing.map { $0.unitCost > 0 ? "\(Int($0.unitCost))" : "" } ?? "")
        _category     = State(initialValue: existing?.category ?? "other")
    }

    private var canSave: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUBackgroundSurface()
                ScrollView {
                    VStack(spacing: BUSpacing.md) {
                        BUCard(.outer) {
                            VStack(alignment: .leading, spacing: BUSpacing.md) {
                                formField(label: "항목명", required: true) {
                                    TextField("예) 식자재 — 양파", text: $name)
                                        .textFieldStyle(.roundedBorder)
                                }
                                HStack(spacing: 8) {
                                    formField(label: "현재 재고", required: true) {
                                        TextField("0", text: $quantity)
                                            .keyboardType(.numberPad)
                                            .textFieldStyle(.roundedBorder)
                                    }
                                    formField(label: "단위", required: false) {
                                        TextField("개", text: $unit)
                                            .textFieldStyle(.roundedBorder)
                                    }
                                    .frame(width: 70)
                                }
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
                                formField(label: "단가 (원, 선택)", required: false) {
                                    TextField("0", text: $unitCost)
                                        .keyboardType(.numberPad)
                                        .textFieldStyle(.roundedBorder)
                                }
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
                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle(existing == nil ? "재고 추가" : "재고 수정")
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
        let item = BUInventoryItem(
            id: existing?.id ?? UUID().uuidString,
            name: name.trimmingCharacters(in: .whitespaces),
            quantity: Double(quantity) ?? 0,
            unit: unit.isEmpty ? "개" : unit,
            minThreshold: Double(minThreshold) ?? 0,
            unitCost: Double(unitCost) ?? 0,
            category: category,
            itemType: existing?.itemType ?? "material",
            sellingPrice: existing?.sellingPrice ?? 0,
            leadTimeDays: existing?.leadTimeDays ?? 1,
            dailyUsage: Double(dailyUsage) ?? 0,
            lastOrderedAt: existing?.lastOrderedAt,
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
