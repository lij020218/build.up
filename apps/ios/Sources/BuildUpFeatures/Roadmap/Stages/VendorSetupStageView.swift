//
//  VendorSetupStageView.swift — 공급처·장비·POS 선택 + 초기 발주 계획 (iOS 네이티브)
//
//  웹 SSOT:
//   apps/web/app/lib/components/stages/offline/VendorSetupStage.tsx
//   apps/web/app/lib/components/stages/offline/InitialOrderPlanCard.tsx
//   apps/web/app/lib/components/stages/offline/vendor-setup-data.ts
//  stageId: "vendor-setup"
//
//  섹션 구조 (linear scroll):
//    Hero banner
//    § 1 — 식재료 공급처 (delivery-meals 특화 + food base)
//    § 2 — 주방 장비 (delivery-meals 특화 + food base)
//    § 3 — POS / 예약 (food base)
//    리디렉션 안내 카드
//    § 4 — 초기 발주 계획 (선택된 공급처별 원자재 입력 → 재고 연동)
//    Wrapup 체크리스트
//
//  데이터:
//    @AppStorage "stage.vendor.suppliersJson"  — [String] (선택된 공급처 이름)
//    @AppStorage "stage.vendor.equipmentJson"  — [String] (선택된 장비 이름)
//    @AppStorage "stage.vendor.posJson"        — [String] (선택된 POS 이름)
//    @AppStorage "stage.vendor.materialsJson"  — [InitialMaterialItem] JSON
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

// MARK: - Data models

struct InitialMaterialItem: Identifiable, Codable {
    let id: String
    var name: String
    var supplier: String
    var quantity: Double
    var unit: String
    var unitCost: Int
    var category: String

    var totalCost: Int { Int(quantity) * unitCost }
}

// MARK: - Static vendor data (delivery-meals path, food base)

private struct VendorEntry: Identifiable {
    let id = UUID()
    let name: String
    let desc: String
    let tag: String?
}

private let supplierData: [VendorEntry] = [
    VendorEntry(name: "포장의신",       desc: "도시락 용기·포장재 전문",         tag: "도시락 특화"),
    VendorEntry(name: "푸드팡",        desc: "도시락 패키지·식재료 통합 공급",    tag: "도시락 특화"),
    VendorEntry(name: "가락시장",       desc: "채소·과일 도매",                  tag: nil),
    VendorEntry(name: "마장축산물시장", desc: "육류 직거래 도매",                 tag: nil),
    VendorEntry(name: "CJ프레시웨이",  desc: "냉동·가공식품 대형 공급사",        tag: nil),
    VendorEntry(name: "트레이더스",    desc: "창고형 대용량 식재료",              tag: nil),
]

private let equipmentData: [VendorEntry] = [
    VendorEntry(name: "도시락 자동포장기",  desc: "도시락 트레이 자동 밀봉·포장",   tag: "도시락 특화"),
    VendorEntry(name: "배달 보온백",       desc: "배달 품질 유지 보온 가방",        tag: "도시락 특화"),
    VendorEntry(name: "냉장·냉동고",       desc: "식재료 보관 필수 장비",           tag: nil),
    VendorEntry(name: "가스레인지/인덕션", desc: "주방 핵심 조리 장비",             tag: nil),
    VendorEntry(name: "식기세척기",        desc: "용기·기구 위생 세척",             tag: nil),
    VendorEntry(name: "스테인리스 작업대", desc: "조리·포장 작업 공간",             tag: nil),
    VendorEntry(name: "주방 환풍기(후드)", desc: "연기·냄새 환기 필수",             tag: nil),
    VendorEntry(name: "황학동 중고주방",   desc: "중고 장비 최저가 매입",           tag: "중고"),
    VendorEntry(name: "번개장터",         desc: "개인 간 중고 장비 거래",           tag: "중고"),
]

private let posData: [VendorEntry] = [
    VendorEntry(name: "토스플레이스",  desc: "수수료 0% · 정산 빠름",     tag: "추천"),
    VendorEntry(name: "오케이포스",   desc: "소상공인 특화 종합 POS",     tag: nil),
    VendorEntry(name: "페이히어",    desc: "모바일 결제 + 배달 연동",      tag: nil),
    VendorEntry(name: "캐치테이블",  desc: "예약·대기 관리 특화",          tag: nil),
    VendorEntry(name: "테이블링",    desc: "예약 + POS 통합",              tag: nil),
]

private let materialCategories = ["식재료", "포장재", "소모품", "기타"]

// MARK: - JSON helpers

private func parseStrings(_ json: String) -> [String] {
    guard let data = json.data(using: .utf8),
          let arr = try? JSONDecoder().decode([String].self, from: data) else { return [] }
    return arr
}

private func encodeStrings(_ arr: [String]) -> String {
    guard let data = try? JSONEncoder().encode(arr),
          let str = String(data: data, encoding: .utf8) else { return "[]" }
    return str
}

private func parseMaterials(_ json: String) -> [InitialMaterialItem] {
    guard let data = json.data(using: .utf8),
          let arr = try? JSONDecoder().decode([InitialMaterialItem].self, from: data) else { return [] }
    return arr
}

private func encodeMaterials(_ arr: [InitialMaterialItem]) -> String {
    guard let data = try? JSONEncoder().encode(arr),
          let str = String(data: data, encoding: .utf8) else { return "[]" }
    return str
}

// MARK: - VendorSetupStageView

public struct VendorSetupStageView: View {

    @Environment(\.dismiss) private var dismiss

    @AppStorage("stage.vendor.suppliersJson")  private var suppliersJson  = "[]"
    @AppStorage("stage.vendor.equipmentJson")  private var equipmentJson  = "[]"
    @AppStorage("stage.vendor.posJson")        private var posJson        = "[]"
    @AppStorage("stage.vendor.materialsJson")  private var materialsJson  = "[]"

    private var selectedSuppliers: [String] { parseStrings(suppliersJson) }
    private var selectedEquipment: [String]  { parseStrings(equipmentJson) }
    private var selectedPos: [String]        { parseStrings(posJson) }
    private var materials: [InitialMaterialItem] { parseMaterials(materialsJson) }

    // Initial order form state
    @State private var fMatName     = ""
    @State private var fSupplier    = ""
    @State private var fQtyText     = ""
    @State private var fUnit        = "kg"
    @State private var fCostText    = ""
    @State private var fCategory    = "식재료"

    private var canAddMaterial: Bool {
        !fMatName.trimmingCharacters(in: .whitespaces).isEmpty &&
        !fSupplier.trimmingCharacters(in: .whitespaces).isEmpty &&
        (Double(fQtyText) ?? 0) > 0 &&
        (Int(fCostText) ?? 0) > 0
    }

    private var totalOrderCost: Int { materials.reduce(0) { $0 + $1.totalCost } }

    private var wrapupDone: Bool {
        !selectedSuppliers.isEmpty && !selectedEquipment.isEmpty && !selectedPos.isEmpty && !materials.isEmpty
    }

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()

                ScrollView {
                    LazyVStack(alignment: .leading, spacing: BUSpacing.lg) {

                        heroBanner
                            .padding(.horizontal, BUSpacing.md)

                        vendorSection(
                            title: "식재료 공급처",
                            subtitle: "복수 선택 가능 — 단가 비교 후 발주 분산 권장",
                            icon: "cart.fill",
                            entries: supplierData,
                            selectedJson: $suppliersJson
                        )

                        vendorSection(
                            title: "주방 장비",
                            subtitle: "신품 vs 중고 혼합 전략 — 황학동·번개장터 활용",
                            icon: "fork.knife",
                            entries: equipmentData,
                            selectedJson: $equipmentJson
                        )

                        vendorSection(
                            title: "POS / 예약 시스템",
                            subtitle: "토스플레이스는 수수료 0% — 배달 앱 연동 확인",
                            icon: "creditcard.fill",
                            entries: posData,
                            selectedJson: $posJson
                        )

                        redirectionCard
                            .padding(.horizontal, BUSpacing.md)

                        initialOrderSection
                            .padding(.horizontal, BUSpacing.md)

                        wrapupSection
                            .padding(.horizontal, BUSpacing.md)

                        Spacer(minLength: BUSpacing.xxxl)
                    }
                    .padding(.top, BUSpacing.md)
                }
            }
            .navigationTitle("공급처 설정")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }
                        .foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Hero banner

    private var heroBanner: some View {
        BUCard(.hero) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("단계 15 · 공급처 설정")

                Text("공급처 계약이\n원가를 결정합니다")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(BUColor.midnightDeep)
                    .tracking(-0.3)
                    .lineSpacing(4)

                Text("식재료·장비·POS를 확정해야 초기 발주와 재고 등록이 시작됩니다.")
                    .font(BUFont.bodySmall)
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
                    .padding(.top, 2)

                HStack(spacing: BUSpacing.sm) {
                    heroMini(icon: "truck.box.fill",    value: "공급처",  label: "식재료·포장재")
                    heroMini(icon: "wrench.and.screwdriver.fill", value: "장비", label: "주방·포장기")
                    heroMini(icon: "creditcard.fill",   value: "POS",    label: "결제·예약")
                }
                .padding(.top, 4)
            }
        }
    }

    private func heroMini(icon: String, value: String, label: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(BUColor.midnight)
            Text(value)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BUColor.midnightDeep)
            Text(label)
                .font(BUFont.eyebrow)
                .foregroundStyle(BUColor.inkMuted)
        }
        .padding(BUSpacing.sm)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous))
    }

    // MARK: - Vendor section builder

    private func vendorSection(
        title: String,
        subtitle: String,
        icon: String,
        entries: [VendorEntry],
        selectedJson: Binding<String>
    ) -> some View {
        VStack(alignment: .leading, spacing: BUSpacing.sm) {
            HStack(spacing: BUSpacing.xs) {
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
                Text(title)
                    .font(BUFont.cardTitleSmall)
                    .foregroundStyle(BUColor.midnightDeep)
            }
            .padding(.horizontal, BUSpacing.md)

            Text(subtitle)
                .font(BUFont.bodyCaption)
                .foregroundStyle(BUColor.inkSecondary)
                .padding(.horizontal, BUSpacing.md)

            VStack(spacing: 0) {
                ForEach(entries) { entry in
                    VendorRow(
                        entry: entry,
                        selectedJson: selectedJson
                    )
                    if entry.id != entries.last?.id {
                        Divider()
                            .padding(.leading, 52)
                    }
                }
            }
            .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
            .padding(.horizontal, BUSpacing.md)
        }
    }

    // MARK: - Redirection card

    private var redirectionCard: some View {
        BUCard(.card) {
            HStack(spacing: BUSpacing.sm) {
                Image(systemName: "info.circle.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(BUColor.midnight.opacity(0.7))
                VStack(alignment: .leading, spacing: 3) {
                    Text("계약서·허가증 검토는 별도 단계")
                        .font(BUFont.bodySmall.weight(.semibold))
                        .foregroundStyle(BUColor.ink)
                    Text("8단계 '계약서 검토'에서 공급처 계약서를 점검합니다.")
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(2)
                }
            }
        }
    }

    // MARK: - Initial order section

    private var initialOrderSection: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {

            // Header
            VStack(alignment: .leading, spacing: 4) {
                BUEyebrow("초기 발주 계획")
                Text("선택한 공급처에서 구매할 원자재를 등록하면\n재고에 자동 반영됩니다.")
                    .font(BUFont.bodySmall)
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
            }

            if selectedSuppliers.isEmpty {
                BUCard(.card) {
                    HStack(spacing: BUSpacing.sm) {
                        Image(systemName: "exclamationmark.triangle")
                            .foregroundStyle(BUColor.inkMuted)
                        Text("위에서 식재료 공급처를 먼저 선택해 주세요.")
                            .font(BUFont.bodySmall)
                            .foregroundStyle(BUColor.inkMuted)
                    }
                }
            } else {
                // Add form
                BUCard(.card) {
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        Text("원자재 추가")
                            .font(BUFont.bodySmall.weight(.semibold))
                            .foregroundStyle(BUColor.ink)

                        TextField("원자재명 (예: 쌀, 닭가슴살)", text: $fMatName)
                            .buTextFieldStyle()

                        // Supplier chip selection
                        VStack(alignment: .leading, spacing: 6) {
                            Text("공급처")
                                .font(BUFont.eyebrow)
                                .foregroundStyle(BUColor.inkMuted)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 6) {
                                    ForEach(selectedSuppliers, id: \.self) { s in
                                        SupplierChip(label: s, isSelected: fSupplier == s) {
                                            fSupplier = s
                                        }
                                    }
                                }
                            }
                        }

                        HStack(spacing: BUSpacing.sm) {
                            TextField("수량", text: $fQtyText)
                                .buTextFieldStyle()
                                .keyboardType(.decimalPad)
                                .frame(maxWidth: 80)

                            TextField("단위", text: $fUnit)
                                .buTextFieldStyle()
                                .frame(maxWidth: 60)

                            TextField("단가(원)", text: $fCostText)
                                .buTextFieldStyle()
                                .keyboardType(.numberPad)
                        }

                        // Category chips
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                ForEach(materialCategories, id: \.self) { cat in
                                    MatCategoryChip(label: cat, isSelected: fCategory == cat) {
                                        fCategory = cat
                                    }
                                }
                            }
                        }

                        Button(action: addMaterial) {
                            Label("추가", systemImage: "plus")
                                .font(BUFont.bodySmall.weight(.semibold))
                                .foregroundStyle(canAddMaterial ? .white : BUColor.inkMuted)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(
                                    canAddMaterial ? BUColor.midnight : BUColor.midnight.opacity(0.12),
                                    in: RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                                )
                        }
                        .disabled(!canAddMaterial)
                    }
                }

                // Material list
                if !materials.isEmpty {
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        HStack {
                            Text("등록 원자재 \(materials.count)개")
                                .font(BUFont.eyebrow)
                                .foregroundStyle(BUColor.inkMuted)
                            Spacer()
                            Text("총 예상 비용 \(totalOrderCost.formatted())원")
                                .font(BUFont.bodyCaption.weight(.semibold))
                                .foregroundStyle(BUColor.midnight)
                        }

                        ForEach(materials) { item in
                            MaterialItemRow(item: item) {
                                deleteMaterial(id: item.id)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - Wrapup

    private var wrapupSection: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("완료 체크리스트")

                CheckRow(label: "식재료 공급처 선택 완료", done: !selectedSuppliers.isEmpty)
                CheckRow(label: "주방 장비 선택 완료",    done: !selectedEquipment.isEmpty)
                CheckRow(label: "POS 시스템 선택 완료",   done: !selectedPos.isEmpty)
                CheckRow(label: "초기 발주 원자재 등록",  done: !materials.isEmpty)

                if wrapupDone {
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundStyle(BUColor.success)
                        Text("공급처 설정 완료! 재고가 자동 등록됩니다.")
                            .font(BUFont.bodySmall.weight(.semibold))
                            .foregroundStyle(BUColor.success)
                    }
                    .padding(.top, 4)
                }
            }
        }
    }

    // MARK: - Actions

    private func addMaterial() {
        guard canAddMaterial else { return }
        let qty = Double(fQtyText) ?? 0
        let cost = Int(fCostText) ?? 0
        let item = InitialMaterialItem(
            id: UUID().uuidString,
            name: fMatName.trimmingCharacters(in: .whitespaces),
            supplier: fSupplier,
            quantity: qty,
            unit: fUnit.trimmingCharacters(in: .whitespaces).isEmpty ? "개" : fUnit,
            unitCost: cost,
            category: fCategory
        )
        var current = materials
        current.append(item)
        materialsJson = encodeMaterials(current)
        fMatName = ""; fSupplier = ""; fQtyText = ""; fCostText = ""; fUnit = "kg"; fCategory = "식재료"
    }

    private func deleteMaterial(id: String) {
        var current = materials
        current.removeAll { $0.id == id }
        materialsJson = encodeMaterials(current)
    }
}

// MARK: - VendorRow

private struct VendorRow: View {
    let entry: VendorEntry
    @Binding var selectedJson: String

    private var selected: [String] { parseStrings(selectedJson) }
    private var isSelected: Bool { selected.contains(entry.name) }

    var body: some View {
        Button {
            toggle()
        } label: {
            HStack(spacing: BUSpacing.sm) {
                ZStack {
                    Circle()
                        .fill(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.08))
                        .frame(width: 32, height: 32)
                    Image(systemName: isSelected ? "checkmark" : "plus")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(isSelected ? .white : BUColor.inkMuted)
                }

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(entry.name)
                            .font(BUFont.bodySmall.weight(.semibold))
                            .foregroundStyle(BUColor.ink)
                        if let tag = entry.tag {
                            Text(tag)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundStyle(BUColor.midnight)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(BUColor.midnight.opacity(0.1), in: Capsule())
                        }
                    }
                    Text(entry.desc)
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                }
                Spacer()
            }
            .padding(.horizontal, BUSpacing.md)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func toggle() {
        var arr = selected
        if isSelected {
            arr.removeAll { $0 == entry.name }
        } else {
            arr.append(entry.name)
        }
        selectedJson = encodeStrings(arr)
    }
}

// MARK: - Small sub-views

private struct SupplierChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 12, weight: isSelected ? .semibold : .regular))
                .foregroundStyle(isSelected ? .white : BUColor.inkSecondary)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(
                    isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.08),
                    in: Capsule()
                )
        }
        .buttonStyle(.plain)
    }
}

private struct MatCategoryChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 12, weight: isSelected ? .semibold : .regular))
                .foregroundStyle(isSelected ? .white : BUColor.inkSecondary)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(
                    isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.08),
                    in: Capsule()
                )
        }
        .buttonStyle(.plain)
    }
}

private struct MaterialItemRow: View {
    let item: InitialMaterialItem
    let onDelete: () -> Void

    var body: some View {
        HStack(spacing: BUSpacing.sm) {
            VStack(alignment: .leading, spacing: 2) {
                Text(item.name)
                    .font(BUFont.bodySmall.weight(.semibold))
                    .foregroundStyle(BUColor.ink)
                HStack(spacing: 4) {
                    Text(item.supplier)
                        .font(BUFont.eyebrow)
                        .foregroundStyle(BUColor.midnight)
                    Text("·")
                        .foregroundStyle(BUColor.inkSubtle)
                    Text("\(item.quantity.formatted()) \(item.unit) × \(item.unitCost.formatted())원")
                        .font(BUFont.eyebrow)
                        .foregroundStyle(BUColor.inkMuted)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(item.totalCost.formatted())원")
                    .font(BUFont.bodyCaption.weight(.semibold))
                    .foregroundStyle(BUColor.midnightDeep)
                Text(item.category)
                    .font(BUFont.eyebrow)
                    .foregroundStyle(BUColor.inkMuted)
            }
            Button(action: onDelete) {
                Image(systemName: "minus.circle.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(BUColor.inkSubtle)
            }
            .buttonStyle(.plain)
        }
        .padding(BUSpacing.sm)
        .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous))
    }
}

private struct CheckRow: View {
    let label: String
    let done: Bool

    var body: some View {
        HStack(spacing: BUSpacing.sm) {
            Image(systemName: done ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 16))
                .foregroundStyle(done ? BUColor.success : BUColor.inkSubtle)
            Text(label)
                .font(BUFont.bodySmall)
                .foregroundStyle(done ? BUColor.ink : BUColor.inkMuted)
            Spacer()
        }
    }
}

// MARK: - TextField style

private extension View {
    func buTextFieldStyle() -> some View {
        self
            .font(BUFont.body)
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

// MARK: - Preview

#if DEBUG
#Preview("VendorSetup — 공급처 설정") {
    VendorSetupStageView()
}

#Preview("VendorSetup — Dark") {
    VendorSetupStageView()
        .preferredColorScheme(.dark)
}
#endif
