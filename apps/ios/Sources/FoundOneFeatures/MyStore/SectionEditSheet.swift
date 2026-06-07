//
//  SectionEditSheet.swift — 섹션 편집 sheet (Object-mode + Array-mode)
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/components/my-store/SectionRenderer.tsx (edit mode)
//
//  Phase A.5 progress:
//   ✅ Object-mode: 단일 필드 편집 (snapshot/cancel/저장)
//   ✅ 키보드 toolbar: 이전·다음·완료 (FocusState navigation)
//   ✅ Array-mode: legal/people/insurance + 카테고리 섹션 industrySpecifics 통합 처리
//
//  저장 동작:
//   • FieldEditorView 의 onChange → store.commit → 600ms debounce 후 Supabase 저장
//   • "저장" 버튼: flushImmediate + dismiss
//   • "취소" 버튼: snapshot 으로 state 복원 + dismiss (debounce 도 새 값 저장하지만 즉시 다음 saveTask 가 덮어쓰므로 일관)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct SectionEditSheet: View {

    public let spec: SectionSpec
    @ObservedObject var store: StoreInfoStore
    @Environment(\.dismiss) private var dismiss

    /// 진입 시점 state 사본 — "취소" 시 복원.
    @State private var snapshot: StoreInfoState?
    /// 현재 포커스된 필드의 key.
    @FocusState private var focusedKey: String?
    /// 배열 항목 편집 sheet 의 현재 항목 id (nil 이면 sheet 닫힘).
    @State private var editingItemId: String?
    /// 삭제 확인 알림이 표시될 항목 id.
    @State private var pendingDeleteId: String?

    public init(spec: SectionSpec, store: StoreInfoStore) {
        self.spec = spec
        self.store = store
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()

                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.lg) {
                        if let sub = spec.subtitle {
                            Text(sub)
                                .font(.system(size: 12))
                                .foregroundStyle(BUColor.inkSecondary)
                                .lineSpacing(3)
                                .padding(.horizontal, BUSpacing.md)
                                .padding(.top, 4)
                        }

                        if !spec.fields.isEmpty {
                            objectFieldsCard
                                .padding(.horizontal, BUSpacing.md)
                        }

                        if spec.arrayItem != nil {
                            arrayEditorCard
                                .padding(.horizontal, BUSpacing.md)
                        }

                        Spacer(minLength: BUSpacing.xxxl)
                    }
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle(spec.title)
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar { mainToolbar }
            .toolbar { keyboardToolbar }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .interactiveDismissDisabled(hasChanges)
        .onAppear {
            if snapshot == nil { snapshot = store.state }
        }
    }

    // MARK: - Object fields card

    private var objectFieldsCard: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.md) {
                ForEach(Array(spec.fields.enumerated()), id: \.element.key) { idx, field in
                    FieldEditorView(
                        spec: field,
                        value: StoreInfoAccessor.binding(
                            in: store,
                            sectionId: spec.id,
                            field: field
                        ),
                        focused: $focusedKey
                    )
                    if idx < spec.fields.count - 1 {
                        Divider().background(BUColor.midnight.opacity(0.06))
                    }
                }
            }
        }
    }

    // MARK: - Array editor card

    private var arrayEditorCard: some View {
        guard let itemSpec = spec.arrayItem else {
            return AnyView(EmptyView())
        }
        let rows = ArraySectionAccessor.rows(in: store.state,
                                             sectionId: spec.id,
                                             titleField: itemSpec.titleField,
                                             expiryKey: itemSpec.expiryKey)
        let arrayLabel = itemSpec.addLabel
            .replacingOccurrences(of: "+ ", with: "")
            .replacingOccurrences(of: " 추가", with: "")
        return AnyView(
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 6) {
                        Image(systemName: "list.bullet.rectangle")
                            .font(.system(size: 14))
                            .foregroundStyle(BUColor.midnight.opacity(0.7))
                        Text(arrayLabel)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(BUColor.ink)
                        Spacer()
                        Text("\(rows.count)건")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                            .monospacedDigit()
                    }

                    if rows.isEmpty {
                        Text(itemSpec.emptyText)
                            .font(.system(size: 12))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineSpacing(2)
                            .padding(.vertical, 6)
                    } else {
                        VStack(spacing: 0) {
                            ForEach(rows, id: \.id) { row in
                                arrayRowView(row)
                                if row.id != rows.last?.id {
                                    Divider().background(BUColor.midnight.opacity(0.05))
                                }
                            }
                        }
                    }

                    Button {
                        var newId: String = ""
                        store.commit { state in
                            newId = ArraySectionAccessor.appendItem(
                                in: &state,
                                sectionId: spec.id,
                                fields: itemSpec.fields
                            )
                        }
                        editingItemId = newId
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 14))
                            Text(itemSpec.addLabel
                                    .replacingOccurrences(of: "+ ", with: ""))
                                .font(.system(size: 12.5, weight: .semibold))
                        }
                        .foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 9)
                        .frame(maxWidth: .infinity)
                        .background(
                            BUColor.midnight.opacity(0.08),
                            in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                        )
                    }
                    .buttonStyle(.plain)
                    .padding(.top, 4)
                }
            }
            .sheet(item: editingItemBinding) { (item: ItemIDBox) in
                ArrayItemEditSheet(
                    sectionId: spec.id,
                    itemId: item.id,
                    itemSpec: itemSpec,
                    store: store
                )
            }
            .alert("항목 삭제", isPresented: deleteConfirmBinding, presenting: pendingDeleteId) { itemId in
                Button("삭제", role: .destructive) {
                    store.commit { state in
                        ArraySectionAccessor.removeItem(in: &state,
                                                        sectionId: spec.id,
                                                        itemId: itemId)
                    }
                    pendingDeleteId = nil
                }
                Button("취소", role: .cancel) { pendingDeleteId = nil }
            } message: { _ in
                Text("이 항목을 삭제하시겠습니까?")
            }
        )
    }

    private func arrayRowView(_ row: ArraySectionAccessor.Row) -> some View {
        Button {
            editingItemId = row.id
        } label: {
            HStack(spacing: 10) {
                Circle()
                    .fill(BUColor.midnight.opacity(0.35))
                    .frame(width: 6, height: 6)
                VStack(alignment: .leading, spacing: 2) {
                    Text(row.title.isEmpty ? "미입력" : row.title)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(BUColor.ink)
                        .lineLimit(1)
                    if let exp = row.expiresAt, !exp.isEmpty {
                        Text("만료 \(StoreInfoFormatters.dateDotted(exp))")
                            .font(.system(size: 10.5))
                            .foregroundStyle(BUColor.inkMuted)
                            .monospacedDigit()
                    }
                }
                Spacer()
                Button {
                    pendingDeleteId = row.id
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                        .padding(8)
                }
                .buttonStyle(.plain)
                Image(systemName: "chevron.right")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
            }
            .padding(.vertical, 8)
        }
        .buttonStyle(.plain)
    }

    private struct ItemIDBox: Identifiable {
        let id: String
    }

    private var editingItemBinding: Binding<ItemIDBox?> {
        Binding(
            get: { editingItemId.map { ItemIDBox(id: $0) } },
            set: { editingItemId = $0?.id }
        )
    }

    private var deleteConfirmBinding: Binding<Bool> {
        Binding(
            get: { pendingDeleteId != nil },
            set: { if !$0 { pendingDeleteId = nil } }
        )
    }

    // MARK: - Main toolbar (취소 / 저장)

    @ToolbarContentBuilder
    private var mainToolbar: some ToolbarContent {
        #if os(iOS)
        ToolbarItem(placement: .topBarLeading) {
            Button("취소") { handleCancel() }
                .foregroundStyle(BUColor.midnight)
                .disabled(store.saveStatus == .saving)
        }
        ToolbarItem(placement: .topBarTrailing) {
            Button {
                handleSave()
            } label: {
                saveButtonLabel
            }
            .disabled(!hasChanges || store.saveStatus == .saving)
        }
        #else
        ToolbarItem(placement: .cancellationAction) {
            Button("취소") { handleCancel() }
        }
        ToolbarItem(placement: .confirmationAction) {
            Button("저장") { handleSave() }
                .disabled(!hasChanges || store.saveStatus == .saving)
        }
        #endif
    }

    @ViewBuilder
    private var saveButtonLabel: some View {
        switch store.saveStatus {
        case .saving:
            HStack(spacing: 4) {
                ProgressView()
                    .scaleEffect(0.75)
                    .tint(BUColor.inkMuted)
                Text("저장 중")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
            }
        case .saved:
            HStack(spacing: 4) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(BUColor.midnight)
                Text("저장됨")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
        case .error:
            HStack(spacing: 4) {
                Image(systemName: "exclamationmark.circle.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(Color.red)
                Text("재시도")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color.red)
            }
        default:
            Text("저장")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(hasChanges ? BUColor.midnight : BUColor.inkMuted)
        }
    }

    // MARK: - Keyboard toolbar (이전 / 다음 / 완료)

    @ToolbarContentBuilder
    private var keyboardToolbar: some ToolbarContent {
        #if os(iOS)
        ToolbarItemGroup(placement: .keyboard) {
            Button {
                focusPrevious()
            } label: {
                Image(systemName: "chevron.up")
            }
            .disabled(!canFocusPrevious)

            Button {
                focusNext()
            } label: {
                Image(systemName: "chevron.down")
            }
            .disabled(!canFocusNext)

            Spacer()

            Button("완료") {
                focusedKey = nil
            }
            .fontWeight(.semibold)
        }
        #endif
    }

    // MARK: - Actions

    private func handleSave() {
        Task {
            await store.flushImmediate()
            // .saved 상태를 0.5초 보여준 후 닫기
            try? await Task.sleep(nanoseconds: 500_000_000)
            dismiss()
        }
    }

    private func handleCancel() {
        if let snap = snapshot, snap != store.state {
            store.commit { $0 = snap }
        }
        dismiss()
    }

    // MARK: - Focus navigation

    private var focusableKeys: [String] {
        // FieldEditorView 가 focus 받는 type 만 (select/multiselect/date 는 자체 picker)
        spec.fields
            .filter { focusableTypes.contains($0.type) }
            .map { $0.key }
    }

    private let focusableTypes: Set<FieldType> = [
        .text, .textarea, .number, .won, .percent, .phone, .url, .email, .time
    ]

    private var currentFocusIndex: Int? {
        guard let key = focusedKey else { return nil }
        return focusableKeys.firstIndex(of: key)
    }

    private var canFocusPrevious: Bool {
        guard let idx = currentFocusIndex else { return false }
        return idx > 0
    }

    private var canFocusNext: Bool {
        guard let idx = currentFocusIndex else { return false }
        return idx < focusableKeys.count - 1
    }

    private func focusPrevious() {
        guard let idx = currentFocusIndex, idx > 0 else { return }
        focusedKey = focusableKeys[idx - 1]
    }

    private func focusNext() {
        guard let idx = currentFocusIndex, idx < focusableKeys.count - 1 else { return }
        focusedKey = focusableKeys[idx + 1]
    }

    // MARK: - Change detection

    private var hasChanges: Bool {
        guard let snap = snapshot else { return false }
        return snap != store.state
    }
}
