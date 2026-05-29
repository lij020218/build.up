//
//  CustomerManagementSheet.swift — 회원/고객 CRUD + CSV 가져오기
//
//  웹 SSOT:
//   • apps/web/app/lib/components/dashboard/CustomerSummaryCard.tsx
//   • apps/web/app/lib/components/surfaces/analytics/MemberManagementCard.tsx
//
//  Mode 별 UI:
//   membership  → 회원 목록 / 만료일 / 이용권 / 월 회비
//   appointment → 고객 목록 / 마지막 방문 / 시술 기록
//   repeat      → 단골 목록 / 방문 횟수 / 마지막 방문
//   ecommerce   → 구매자 목록 / 구매액
//
//  CSV:  파일 선택 → AI 파싱 (/api/ai/members/parse) → 미리보기 → 일괄 추가
//  저장: storeInfoStore.commit { $0.members = ... } → 600ms debounce → Supabase
//

import SwiftUI
import UniformTypeIdentifiers
import FoundOneCore
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct CustomerManagementSheet: View {

    @Environment(\.dismiss) private var dismiss

    @ObservedObject var storeInfoStore: StoreInfoStore
    let mode: BUCustomerMode
    let label: String

    @State private var showForm = false
    @State private var editingMember: BUMember?

    // CSV import states
    @State private var showFilePicker = false
    @State private var isImporting = false
    @State private var importPreviewMembers: [BUMember] = []
    @State private var showImportPreview = false
    @State private var importError: String?

    public init(storeInfoStore: StoreInfoStore, mode: BUCustomerMode, label: String) {
        self.storeInfoStore = storeInfoStore
        self.mode = mode
        self.label = label
    }

    private var members: [BUMember] { storeInfoStore.state.members }
    private var activeCount: Int { members.filter { $0.isActive }.count }
    private var expiringCount: Int { members.filter { $0.isExpiringSoon }.count }
    private var totalRevenue: Double { members.filter { $0.isActive }.reduce(0) { $0 + $1.fee } }

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        headerBlock
                        if !members.isEmpty {
                            summaryRow
                        }
                        if members.isEmpty {
                            emptyState
                        } else {
                            memberList
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
            .navigationTitle(label)
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
                            editingMember = nil
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
                allowedContentTypes: [.commaSeparatedText, .plainText, .tabSeparatedText],
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
                MemberForm(
                    existing: editingMember,
                    mode: mode,
                    onSave: { member in
                        storeInfoStore.commit { state in
                            if let idx = state.members.firstIndex(where: { $0.id == member.id }) {
                                state.members[idx] = member
                            } else {
                                state.members.append(member)
                            }
                        }
                        showForm = false
                    },
                    onCancel: { showForm = false }
                )
            }
            .sheet(isPresented: $showImportPreview) {
                MemberImportPreviewSheet(
                    members: importPreviewMembers,
                    mode: mode,
                    onConfirm: { confirmed in
                        storeInfoStore.commit { state in
                            for member in confirmed {
                                state.members.append(member)
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
            Text("\(mode == .membership ? "회원" : "고객") \(members.count)명 · 활성 \(activeCount)명\(expiringCount > 0 ? " · 만료임박 \(expiringCount)명" : "")")
                .font(.system(size: 11, weight: .heavy))
                .foregroundStyle(expiringCount > 0 ? BUColor.warn : BUColor.inkMuted)
                .tracking(0.5)
            Text(label)
                .font(.system(size: 19, weight: .heavy))
                .foregroundStyle(BUColor.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var summaryRow: some View {
        HStack(spacing: 8) {
            summaryTile(label: "활성", value: "\(activeCount)명", alert: false)
            if mode == .membership || mode == .appointment {
                summaryTile(label: "만료 임박", value: expiringCount > 0 ? "\(expiringCount)명" : "—",
                            alert: expiringCount > 0)
            }
            if totalRevenue > 0 {
                summaryTile(label: "월 매출", value: formatKRWCompact(totalRevenue) + "원", alert: false)
            }
        }
    }

    private func summaryTile(label: String, value: String, alert: Bool) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 10, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
                .textCase(.uppercase)
                .tracking(0.3)
            Text(value)
                .font(.system(size: 17, weight: .heavy))
                .foregroundStyle(alert ? BUColor.danger : BUColor.ink)
                .monospacedDigit()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(alert ? BUColor.danger.opacity(0.04) : BUColor.midnight.opacity(0.03),
                    in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12)
            .strokeBorder(alert ? BUColor.danger.opacity(0.15) : BUColor.midnight.opacity(0.06), lineWidth: 1))
    }

    private var emptyState: some View {
        BUCard(.outer) {
            VStack(spacing: 12) {
                Image(systemName: "person.2")
                    .font(.system(size: 32, weight: .light))
                    .foregroundStyle(BUColor.inkMuted)
                Text(mode == .membership ? "등록된 회원이 없습니다" : "등록된 고객이 없습니다")
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text(emptyHint)
                    .font(.system(size: 13))
                    .foregroundStyle(BUColor.inkSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
    }

    private var emptyHint: String {
        switch mode {
        case .membership:  return "+ 버튼으로 회원 추가, 파일 버튼으로 CSV 일괄 등록.\n만료·갱신 현황을 자동으로 추적합니다."
        case .appointment: return "고객을 등록하면 예약·방문 이력을 관리할 수 있습니다."
        case .repeat:      return "단골을 등록하면 재방문 패턴을 볼 수 있습니다."
        default:           return "고객을 등록하면 현황을 추적할 수 있습니다."
        }
    }

    private var memberList: some View {
        VStack(spacing: 8) {
            ForEach(sortedMembers) { member in
                memberRow(member)
            }
        }
    }

    private var sortedMembers: [BUMember] {
        let expiring = members.filter { $0.isExpiringSoon }.sorted { $0.name < $1.name }
        let expired  = members.filter { !$0.isActive && !$0.isExpiringSoon }.sorted { $0.name < $1.name }
        let active   = members.filter { $0.isActive && !$0.isExpiringSoon }.sorted { $0.name < $1.name }
        return expiring + expired + active
    }

    private func memberRow(_ member: BUMember) -> some View {
        BUCard(.outer) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 5) {
                    HStack(spacing: 8) {
                        Text(member.name)
                            .font(.system(size: 14, weight: .heavy))
                            .foregroundStyle(BUColor.ink)
                        statusBadge(member)
                        Spacer(minLength: 0)
                    }
                    HStack(spacing: 12) {
                        if !member.plan.isEmpty {
                            infoChip(label: "이용권", value: member.plan)
                        }
                        if member.fee > 0 {
                            infoChip(label: "금액", value: formatKRWCompact(member.fee) + "원")
                        }
                        if !member.endDate.isEmpty {
                            infoChip(label: "만료", value: member.endDate)
                        }
                    }
                }
                Menu {
                    Button("수정") {
                        editingMember = member
                        showForm = true
                    }
                    Button("삭제", role: .destructive) {
                        storeInfoStore.commit { state in
                            state.members.removeAll { $0.id == member.id }
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

    @ViewBuilder
    private func statusBadge(_ member: BUMember) -> some View {
        if member.isExpiringSoon {
            Text("만료 임박")
                .font(.system(size: 9.5, weight: .bold))
                .foregroundStyle(BUColor.warn)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(BUColor.warn.opacity(0.12), in: Capsule())
        } else if !member.isActive {
            Text("만료")
                .font(.system(size: 9.5, weight: .bold))
                .foregroundStyle(BUColor.danger)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(BUColor.danger.opacity(0.10), in: Capsule())
        } else {
            EmptyView()
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

    private func handleFileImport(_ result: Result<[URL], Error>) {
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
        guard let text = String(data: data, encoding: .utf8) ?? String(data: data, encoding: .isoLatin1) else {
            isImporting = false
            importError = "텍스트 파일만 가져올 수 있습니다. Excel에서 CSV로 저장 후 가져오세요."
            return
        }

        let repo = CsvParseRepository(supabase: BUSupabase.shared.client)
        do {
            let parsed = try await repo.parseMembers(text: text)
            isImporting = false
            importPreviewMembers = parsed
            showImportPreview = true
        } catch {
            isImporting = false
            importError = error.localizedDescription
        }
    }
}

// MARK: - MemberImportPreviewSheet

private struct MemberImportPreviewSheet: View {

    @Environment(\.dismiss) private var dismiss

    let members: [BUMember]
    let mode: BUCustomerMode
    let onConfirm: ([BUMember]) -> Void
    let onCancel: () -> Void

    private var entityLabel: String { mode == .membership ? "회원" : "고객" }

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
                                Text("총 \(members.count)명을 인식했습니다. \(entityLabel) 목록에 추가하시겠습니까?")
                                    .font(.system(size: 13))
                                    .foregroundStyle(BUColor.inkSecondary)
                            }
                        }
                        ForEach(members) { member in
                            importMemberRow(member)
                        }
                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("\(entityLabel) \(members.count)명 가져오기")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarLeading) {
                    Button("취소", action: onCancel).foregroundStyle(BUColor.inkMuted)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("추가") { onConfirm(members) }
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(BUColor.midnight)
                }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    private func importMemberRow(_ member: BUMember) -> some View {
        BUCard(.outer) {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(member.name)
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    HStack(spacing: 10) {
                        if !member.plan.isEmpty && member.plan != "일반" {
                            importChip(label: "이용권", value: member.plan)
                        }
                        if member.fee > 0 {
                            importChip(label: "금액", value: formatKRWCompact(member.fee) + "원")
                        }
                        if !member.endDate.isEmpty {
                            importChip(label: "만료", value: member.endDate)
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

// MARK: - MemberForm

private struct MemberForm: View {

    @Environment(\.dismiss) private var dismiss

    let existing: BUMember?
    let mode: BUCustomerMode
    let onSave: (BUMember) -> Void
    let onCancel: () -> Void

    @State private var name: String
    @State private var plan: String
    @State private var fee: String
    @State private var startDate: String
    @State private var endDate: String

    private let planPresets: [String]

    init(existing: BUMember?, mode: BUCustomerMode, onSave: @escaping (BUMember) -> Void, onCancel: @escaping () -> Void) {
        self.existing = existing
        self.mode = mode
        self.onSave = onSave
        self.onCancel = onCancel
        _name      = State(initialValue: existing?.name ?? "")
        _plan      = State(initialValue: existing?.plan ?? "")
        _fee       = State(initialValue: existing.map { $0.fee > 0 ? "\(Int($0.fee))" : "" } ?? "")
        _startDate = State(initialValue: existing?.startDate ?? isoToday())
        _endDate   = State(initialValue: existing?.endDate ?? "")

        switch mode {
        case .membership:
            planPresets = ["1개월", "3개월", "6개월", "12개월", "PT 10회", "PT 20회", "PT 30회"]
        case .appointment:
            planPresets = ["일반 고객", "VIP", "단골", "신규"]
        default:
            planPresets = ["일반", "단골", "VIP"]
        }
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
                                formField(label: mode == .membership ? "회원 이름" : "고객 이름", required: true) {
                                    TextField("예) 김민준", text: $name)
                                        .textFieldStyle(.roundedBorder)
                                }

                                formField(label: "이용권 / 등급", required: false) {
                                    VStack(alignment: .leading, spacing: 6) {
                                        TextField("예) 1개월", text: $plan)
                                            .textFieldStyle(.roundedBorder)
                                        ScrollView(.horizontal, showsIndicators: false) {
                                            HStack(spacing: 6) {
                                                ForEach(planPresets, id: \.self) { preset in
                                                    Button(preset) { plan = preset }
                                                        .font(.system(size: 11, weight: .semibold))
                                                        .foregroundStyle(plan == preset ? .white : BUColor.midnight)
                                                        .padding(.horizontal, 10)
                                                        .padding(.vertical, 5)
                                                        .background(
                                                            plan == preset ? BUColor.midnight : BUColor.midnight08,
                                                            in: Capsule()
                                                        )
                                                }
                                            }
                                        }
                                    }
                                }

                                formField(label: "금액 (원)", required: false) {
                                    TextField("0", text: $fee)
                                        .keyboardType(.numberPad)
                                        .textFieldStyle(.roundedBorder)
                                }

                                HStack(spacing: 8) {
                                    formField(label: "시작일", required: false) {
                                        TextField("YYYY-MM-DD", text: $startDate)
                                            .keyboardType(.numbersAndPunctuation)
                                            .textFieldStyle(.roundedBorder)
                                            .font(.system(.body, design: .monospaced))
                                    }
                                    formField(label: "만료일", required: false) {
                                        TextField("YYYY-MM-DD", text: $endDate)
                                            .keyboardType(.numbersAndPunctuation)
                                            .textFieldStyle(.roundedBorder)
                                            .font(.system(.body, design: .monospaced))
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
            .navigationTitle(existing == nil
                ? (mode == .membership ? "회원 추가" : "고객 추가")
                : (mode == .membership ? "회원 수정" : "고객 수정"))
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
        let member = BUMember(
            id: existing?.id ?? UUID().uuidString,
            name: name.trimmingCharacters(in: .whitespaces),
            plan: plan.trimmingCharacters(in: .whitespaces),
            fee: Double(fee) ?? 0,
            startDate: startDate.isEmpty ? isoToday() : startDate,
            endDate: endDate.trimmingCharacters(in: .whitespaces)
        )
        onSave(member)
    }
}

private func isoToday() -> String {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withFullDate]
    return f.string(from: Date())
}

private func formatKRWCompact(_ value: Double) -> String {
    let v = Int(round(value))
    if v >= 100_000_000 { return "\(String(format: "%.1f", Double(v) / 100_000_000))억" }
    if v >= 10_000 { return "\(v / 10_000)만" }
    return v.formatted()
}

#if DEBUG
#Preview("CustomerManagementSheet — membership") {
    CustomerManagementSheet(
        storeInfoStore: StoreInfoStore(repository: MockStoreInfoRepository()),
        mode: .membership,
        label: "회원 관리"
    )
}
#Preview("CustomerManagementSheet — appointment") {
    CustomerManagementSheet(
        storeInfoStore: StoreInfoStore(repository: MockStoreInfoRepository()),
        mode: .appointment,
        label: "고객·예약 관리"
    )
}
#endif
