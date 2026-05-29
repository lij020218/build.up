//
//  TeamManagementSheet.swift — 직원 CRUD (web SSOT: StaffLaborCard.tsx)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/analytics/StaffLaborCard.tsx
//
//  급여 공식 (web 완전 동일):
//   weeklyAllowance = weeklyHours >= 15 ? (weeklyHours/5) × hourlyWage : 0
//   monthlyWage     = (hourlyWage × weeklyHours + weeklyAllowance) × 4.345
//   insurance       = isInsured ? monthlyWage × 0.1041 : 0
//
//  저장: storeInfoStore.commit { $0.employees = ... } → debounced Supabase sync
//

import SwiftUI
import FoundOneCore
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct TeamManagementSheet: View {

    @Environment(\.dismiss) private var dismiss

    @ObservedObject var storeInfoStore: StoreInfoStore

    @State private var showForm = false
    @State private var editingEmployee: BUEmployee?

    public init(storeInfoStore: StoreInfoStore) {
        self.storeInfoStore = storeInfoStore
    }

    private var employees: [BUEmployee] { storeInfoStore.state.employees }

    private var totalPayroll: Double { employees.reduce(0) { $0 + $1.monthlyBurden } }
    private var insuredCount: Int { employees.filter { $0.isInsured }.count }

    public var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        headerBlock
                        if employees.isEmpty {
                            emptyState
                        } else {
                            summaryRow
                            employeeList
                        }
                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("직원 관리")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarLeading) {
                    Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        editingEmployee = nil
                        showForm = true
                    } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    }
                }
                #endif
            }
            .sheet(isPresented: $showForm) {
                EmployeeForm(
                    existing: editingEmployee,
                    onSave: { emp in
                        storeInfoStore.commit { state in
                            if let idx = state.employees.firstIndex(where: { $0.id == emp.id }) {
                                state.employees[idx] = emp
                            } else {
                                state.employees.append(emp)
                            }
                        }
                        showForm = false
                    },
                    onCancel: { showForm = false }
                )
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    private var headerBlock: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("직원 \(employees.count)명 · 4대보험 \(insuredCount)명")
                .font(.system(size: 11, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
                .textCase(.uppercase)
                .tracking(0.5)
            Text("팀 현황")
                .font(.system(size: 19, weight: .heavy))
                .foregroundStyle(BUColor.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var summaryRow: some View {
        HStack(spacing: 8) {
            summaryTile(label: "월 총 인건비", value: formatKRWCompact(totalPayroll) + "원")
            summaryTile(label: "4대보험 가입", value: "\(insuredCount)/\(employees.count)명")
        }
    }

    private func summaryTile(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 10, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
                .textCase(.uppercase)
                .tracking(0.3)
            Text(value)
                .font(.system(size: 17, weight: .heavy))
                .foregroundStyle(BUColor.ink)
                .monospacedDigit()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(BUColor.midnight.opacity(0.06), lineWidth: 1))
    }

    private var emptyState: some View {
        BUCard(.outer) {
            VStack(spacing: 12) {
                Image(systemName: "person.2")
                    .font(.system(size: 32, weight: .light))
                    .foregroundStyle(BUColor.inkMuted)
                Text("등록된 직원이 없습니다")
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text("오른쪽 위 + 버튼으로 직원을 추가하세요.\n월 인건비와 4대보험 부담금을 자동 계산합니다.")
                    .font(.system(size: 13))
                    .foregroundStyle(BUColor.inkSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
    }

    private var employeeList: some View {
        VStack(spacing: 8) {
            ForEach(employees) { emp in
                employeeRow(emp)
            }
        }
    }

    private func employeeRow(_ emp: BUEmployee) -> some View {
        BUCard(.outer) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 8) {
                        Text(emp.name)
                            .font(.system(size: 14, weight: .heavy))
                            .foregroundStyle(BUColor.ink)
                        if emp.isInsured {
                            Text("4대보험")
                                .font(.system(size: 9.5, weight: .bold))
                                .foregroundStyle(BUColor.midnight)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(BUColor.midnight08, in: Capsule())
                        }
                        Spacer(minLength: 0)
                    }
                    HStack(spacing: 12) {
                        infoChip(label: "시급", value: formatKRWCompact(emp.hourlyWage) + "원")
                        infoChip(label: "주당", value: "\(Int(emp.weeklyHours))h")
                        infoChip(label: "월부담", value: formatKRWCompact(emp.monthlyBurden) + "원")
                    }
                    if emp.weeklyHours >= 15 {
                        Text("주휴수당 포함 \(formatKRWCompact(emp.monthlyWage))원 · 4대보험 \(formatKRWCompact(emp.employerInsurance))원")
                            .font(.system(size: 11))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                }
                Menu {
                    Button("수정") {
                        editingEmployee = emp
                        showForm = true
                    }
                    Button("삭제", role: .destructive) {
                        storeInfoStore.commit { state in
                            state.employees.removeAll { $0.id == emp.id }
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
}

// MARK: - EmployeeForm

private struct EmployeeForm: View {

    @Environment(\.dismiss) private var dismiss

    let existing: BUEmployee?
    let onSave: (BUEmployee) -> Void
    let onCancel: () -> Void

    @State private var name: String
    @State private var hourlyWage: String
    @State private var weeklyHours: String
    @State private var isInsured: Bool
    @State private var hireDate: String

    init(existing: BUEmployee?, onSave: @escaping (BUEmployee) -> Void, onCancel: @escaping () -> Void) {
        self.existing = existing
        self.onSave = onSave
        self.onCancel = onCancel
        _name        = State(initialValue: existing?.name ?? "")
        _hourlyWage  = State(initialValue: existing.map { "\(Int($0.hourlyWage))" } ?? "10320")
        _weeklyHours = State(initialValue: existing.map { "\(Int($0.weeklyHours))" } ?? "40")
        _isInsured   = State(initialValue: existing?.isInsured ?? false)
        _hireDate    = State(initialValue: existing?.hireDate ?? "")
    }

    private var parsedWage: Double { Double(hourlyWage) ?? 10_320 }
    private var parsedHours: Double { Double(weeklyHours) ?? 40 }

    // Live preview of payroll calculation
    private var previewEmployee: BUEmployee {
        BUEmployee(name: "", hourlyWage: parsedWage, weeklyHours: parsedHours, isInsured: isInsured)
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
                                formField(label: "이름", required: true) {
                                    TextField("예) 김민준", text: $name)
                                        .textFieldStyle(.roundedBorder)
                                }
                                formField(label: "시급 (원)", required: false, hint: "2026 최저시급: 10,320원") {
                                    TextField("10320", text: $hourlyWage)
                                        .keyboardType(.numberPad)
                                        .textFieldStyle(.roundedBorder)
                                }
                                formField(label: "주당 근무시간", required: false, hint: "15h 이상 → 주휴수당 자동 계산") {
                                    TextField("40", text: $weeklyHours)
                                        .keyboardType(.numberPad)
                                        .textFieldStyle(.roundedBorder)
                                }
                                Toggle(isOn: $isInsured) {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("4대보험 가입")
                                            .font(.system(size: 13, weight: .semibold))
                                            .foregroundStyle(BUColor.ink)
                                        Text("사업주 부담 10.41% 자동 계산")
                                            .font(.system(size: 11))
                                            .foregroundStyle(BUColor.inkMuted)
                                    }
                                }
                                .tint(BUColor.midnight)
                                formField(label: "입사일 (연차 알림용, 선택)", required: false) {
                                    TextField("YYYY-MM-DD", text: $hireDate)
                                        .keyboardType(.numbersAndPunctuation)
                                        .textFieldStyle(.roundedBorder)
                                }
                            }
                        }

                        // 실시간 급여 미리보기
                        payrollPreview

                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle(existing == nil ? "직원 추가" : "직원 수정")
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

    private var payrollPreview: some View {
        let emp = previewEmployee
        return BUCard(.outer) {
            VStack(alignment: .leading, spacing: 8) {
                Text("급여 예상 (미리보기)")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(BUColor.inkMuted)
                    .textCase(.uppercase)
                    .tracking(0.5)

                HStack(spacing: 0) {
                    previewItem(label: "월급", value: formatKRWCompact(emp.monthlyWage) + "원")
                    Divider().frame(height: 28)
                    if emp.weeklyHours >= 15 {
                        previewItem(label: "주휴수당 포함", value: "✓")
                        Divider().frame(height: 28)
                    }
                    previewItem(label: "사업주 부담", value: formatKRWCompact(emp.monthlyBurden) + "원",
                                highlight: true)
                }
                .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(BUColor.midnight.opacity(0.06), lineWidth: 1))
            }
        }
    }

    private func previewItem(label: String, value: String, highlight: Bool = false) -> some View {
        VStack(spacing: 3) {
            Text(label)
                .font(.system(size: 9.5, weight: .bold))
                .foregroundStyle(BUColor.inkMuted)
            Text(value)
                .font(.system(size: 13, weight: .heavy))
                .foregroundStyle(highlight ? BUColor.midnight : BUColor.ink)
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
    }

    private func formField<Content: View>(label: String, required: Bool, hint: String? = nil, @ViewBuilder content: () -> Content) -> some View {
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
            if let hint {
                Text(hint).font(.system(size: 11)).foregroundStyle(BUColor.inkMuted)
            }
        }
    }

    private func save() {
        let emp = BUEmployee(
            id: existing?.id ?? UUID().uuidString,
            name: name.trimmingCharacters(in: .whitespaces),
            hourlyWage: parsedWage,
            weeklyHours: parsedHours,
            isInsured: isInsured,
            hireDate: hireDate.isEmpty ? nil : hireDate
        )
        onSave(emp)
    }
}

private func formatKRWCompact(_ value: Double) -> String {
    let v = Int(round(value))
    if v >= 100_000_000 { return "\(String(format: "%.1f", Double(v) / 100_000_000))억" }
    if v >= 10_000 { return "\(v / 10_000)만" }
    return v.formatted()
}

#if DEBUG
#Preview("TeamManagementSheet") {
    TeamManagementSheet(storeInfoStore: StoreInfoStore(repository: MockStoreInfoRepository()))
}
#endif
