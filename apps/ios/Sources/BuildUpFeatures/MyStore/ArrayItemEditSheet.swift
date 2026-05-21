//
//  ArrayItemEditSheet.swift — 배열 섹션의 단일 항목 추가/수정 sheet
//
//  ArraySectionAccessor 와 협력해 typed 배열 (Permit/Person/Insurance/Vehicle/
//  DigitalFootprint) + industrySpecifics jsonb 배열을 단일 UI 로 편집.
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct ArrayItemEditSheet: View {

    public let sectionId: String
    public let itemId: String
    public let itemSpec: ArrayItemSpec
    @ObservedObject var store: StoreInfoStore
    @Environment(\.dismiss) private var dismiss

    @FocusState private var focusedKey: String?

    public init(sectionId: String, itemId: String,
                itemSpec: ArrayItemSpec, store: StoreInfoStore) {
        self.sectionId = sectionId
        self.itemId = itemId
        self.itemSpec = itemSpec
        self.store = store
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()

                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.lg) {
                        BUCard(.card) {
                            VStack(alignment: .leading, spacing: BUSpacing.md) {
                                ForEach(Array(itemSpec.fields.enumerated()), id: \.element.key) { idx, field in
                                    FieldEditorView(
                                        spec: field,
                                        value: binding(for: field),
                                        focused: $focusedKey
                                    )
                                    if idx < itemSpec.fields.count - 1 {
                                        Divider().background(BUColor.midnight.opacity(0.06))
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, BUSpacing.md)

                        Spacer(minLength: BUSpacing.xxxl)
                    }
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("항목 편집")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("완료") {
                        Task {
                            await store.flushImmediate()
                            dismiss()
                        }
                    }
                    .fontWeight(.semibold)
                    .foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .confirmationAction) {
                    Button("완료") {
                        Task {
                            await store.flushImmediate()
                            dismiss()
                        }
                    }
                }
                #endif
            }
            #if os(iOS)
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("완료") { focusedKey = nil }
                        .fontWeight(.semibold)
                }
            }
            #endif
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private func binding(for field: FieldSpec) -> Binding<FieldValue> {
        Binding(
            get: {
                ArraySectionAccessor.itemFieldValue(
                    in: store.state,
                    sectionId: sectionId,
                    itemId: itemId,
                    fieldKey: field.key
                )
            },
            set: { newValue in
                store.commit { state in
                    ArraySectionAccessor.setItemFieldValue(
                        newValue,
                        in: &state,
                        sectionId: sectionId,
                        itemId: itemId,
                        fieldKey: field.key
                    )
                }
            }
        )
    }
}
