//
//  CustomPullSetupSheet.swift — Custom Pull URL 등록 sheet
//
//  사장님이 본인 서버 endpoint 를 등록하면 Found.One 이 매일 새벽
//  Authorization: Bearer <token> 헤더로 GET 호출해 funnel 4 step 을 적재한다.
//
//  Flow:
//    idle → (사장님이 URL/Token 입력) → testing → testSucceeded(data) → saving → dismiss(toast)
//                                                  ↘ testFailed(message)
//

import SwiftUI
import FoundOneCore
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct CustomPullSetupSheet: View {

    public enum FormMode: String, CaseIterable, Identifiable {
        case commerce
        case saas
        public var id: String { rawValue }
        var label: String {
            switch self {
            case .commerce: return "온라인 커머스"
            case .saas:     return "스타트업"
            }
        }
    }

    private enum Phase {
        case idle
        case testing
        case testSucceeded(PulledFunnelData)
        case testFailed(String)
        case saving
        case saveFailed(String)

        var isTesting: Bool { if case .testing = self { return true }; return false }
        var isSaving: Bool  { if case .saving  = self { return true }; return false }
    }

    @Environment(\.dismiss) private var dismiss

    /// 부모가 성공적으로 저장된 뒤 알림 받을 수 있는 콜백.
    public var onSaved: (@MainActor () -> Void)?

    @State private var label: String = ""
    @State private var mode: FormMode = .saas
    @State private var endpointURL: String = ""
    @State private var secretToken: String = ""
    @State private var showCurlCard: Bool = true
    @State private var phase: Phase = .idle
    @FocusState private var focusedField: Field?

    private enum Field: Hashable { case label, url, token }

    public init(onSaved: (@MainActor () -> Void)? = nil) {
        self.onSaved = onSaved
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.lg) {
                        introBlock
                        formCard
                        curlCard
                        if case .testSucceeded(let data) = phase {
                            previewCard(data: data)
                        }
                        if let msg = errorMessage {
                            errorCard(message: msg)
                        }
                        actionButtons
                        Color.clear.frame(height: 60)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("내 서버 endpoint 등록")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar { toolbarContent }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        #if os(iOS)
        ToolbarItem(placement: .topBarLeading) {
            Button("취소") { dismiss() }
                .foregroundStyle(BUColor.inkSecondary)
                .disabled(phase.isTesting || phase.isSaving)
        }
        ToolbarItemGroup(placement: .keyboard) {
            Spacer()
            Button("완료") { focusedField = nil }
                .fontWeight(.semibold)
        }
        #else
        ToolbarItem(placement: .cancellationAction) {
            Button("취소") { dismiss() }
        }
        #endif
    }

    // MARK: - Sections

    private var introBlock: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("자체 서버 endpoint")
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.6)
                .foregroundStyle(BUColor.midnight.opacity(0.7))
            Text("내 서버 URL 등록")
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(BUColor.ink)
                .tracking(-0.4)
            Text("매일 새벽 Found.One 이 GET 호출해 funnel 4단계를 가져옵니다. 입력은 한 번이면 됩니다.")
                .font(.system(size: 13))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var formCard: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            fieldGroup(title: "연결 라벨", helper: "구분용 이름 (예: \"내 SaaS\")") {
                TextField("내 SaaS", text: $label)
                    .textFieldStyle(.plain)
                    .font(.system(size: 15))
                    .foregroundStyle(BUColor.ink)
                    .focused($focusedField, equals: .label)
                    #if os(iOS)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    #endif
            }

            Divider().background(BUColor.borderSubtle)

            fieldGroup(title: "모드", helper: "사장님 서비스 타입") {
                Picker("모드", selection: $mode) {
                    ForEach(FormMode.allCases) { m in
                        Text(m.label).tag(m)
                    }
                }
                .pickerStyle(.segmented)
            }

            Divider().background(BUColor.borderSubtle)

            fieldGroup(title: "Endpoint URL", helper: "https:// 로 시작하는 사장님 서버 주소") {
                TextField("https://api.example.com/foundone/funnel", text: $endpointURL)
                    .textFieldStyle(.plain)
                    .font(.system(size: 14, design: .monospaced))
                    .foregroundStyle(BUColor.ink)
                    .focused($focusedField, equals: .url)
                    #if os(iOS)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.URL)
                    #endif
            }

            Divider().background(BUColor.borderSubtle)

            fieldGroup(title: "인증 토큰", helper: "Authorization: Bearer 뒤에 붙는 비밀 값") {
                SecureField("YOUR_BEARER_TOKEN", text: $secretToken)
                    .textFieldStyle(.plain)
                    .font(.system(size: 14, design: .monospaced))
                    .foregroundStyle(BUColor.ink)
                    .focused($focusedField, equals: .token)
                    #if os(iOS)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    #endif
            }
        }
        .padding(BUSpacing.md)
        .background(Color.white.opacity(0.78), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }

    private func fieldGroup<Content: View>(
        title: String,
        helper: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 13, weight: .heavy))
                .foregroundStyle(BUColor.ink)
            Text(helper)
                .font(.system(size: 11))
                .foregroundStyle(BUColor.inkMuted)
            content()
                .padding(.horizontal, 10)
                .padding(.vertical, 9)
                .frame(minHeight: 44)
                .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                .padding(.top, 2)
        }
    }

    private var curlCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Button { withAnimation(.easeInOut(duration: 0.18)) { showCurlCard.toggle() } } label: {
                HStack(spacing: 6) {
                    Image(systemName: "curlybraces")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                    Text("응답 형식 확인")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Spacer(minLength: 0)
                    Image(systemName: showCurlCard ? "chevron.up" : "chevron.down")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(BUColor.inkMuted)
                }
            }
            .buttonStyle(.plain)

            if showCurlCard {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Found.One 이 매일 새벽 GET 호출:")
                        .font(.system(size: 11))
                        .foregroundStyle(BUColor.inkSecondary)
                    codeBlock("""
                    curl -X GET https://your-server.com/funnel \\
                      -H "Authorization: Bearer YOUR_TOKEN"
                    """)
                    Text("응답 형식:")
                        .font(.system(size: 11))
                        .foregroundStyle(BUColor.inkSecondary)
                        .padding(.top, 2)
                    codeBlock("""
                    {
                      "as_of": "2026-05-19",
                      "mode": "saas",
                      "step_1": 2480,
                      "step_2": 287,
                      "step_3": 98,
                      "step_4": 23
                    }
                    """)
                }
            }
        }
        .padding(BUSpacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight08, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.10), lineWidth: 1)
        )
    }

    private func codeBlock(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 11.5, weight: .medium, design: .monospaced))
            .foregroundStyle(BUColor.ink)
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white.opacity(0.8), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .strokeBorder(BUColor.cardBorder, lineWidth: 1)
            )
            .textSelection(.enabled)
    }

    private func previewCard(data: PulledFunnelData) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: "checkmark.seal.fill")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(BUColor.success)
                Text("연결 성공 — 사장님 데이터 미리보기")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Spacer()
            }
            HStack(spacing: 8) {
                previewPill(title: "기준일", value: data.asOf)
                previewPill(title: "모드", value: data.mode)
            }
            VStack(spacing: 6) {
                previewRow(label: "1단계", value: data.step1)
                previewRow(label: "2단계", value: data.step2)
                previewRow(label: "3단계", value: data.step3)
                previewRow(label: "4단계 (전환)", value: data.step4)
            }
            Text("연결을 저장하면 매일 새벽 자동 갱신됩니다.")
                .font(.system(size: 11))
                .foregroundStyle(BUColor.inkMuted)
                .padding(.top, 2)
        }
        .padding(BUSpacing.md)
        .background(BUColor.success.opacity(0.06), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(BUColor.success.opacity(0.30), lineWidth: 1)
        )
    }

    private func previewPill(title: String, value: String) -> some View {
        HStack(spacing: 4) {
            Text(title)
                .font(.system(size: 10, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
            Text(value)
                .font(.system(size: 11, weight: .bold, design: .monospaced))
                .foregroundStyle(BUColor.ink)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.white.opacity(0.8), in: Capsule())
    }

    private func previewRow(label: String, value: Int) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(BUColor.inkSecondary)
            Spacer()
            Text(value.formatted())
                .font(.system(size: 14, weight: .heavy, design: .rounded))
                .foregroundStyle(BUColor.ink)
                .monospacedDigit()
        }
    }

    private func errorCard(message: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(BUColor.danger)
            VStack(alignment: .leading, spacing: 4) {
                Text("연결 테스트 실패")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text(message)
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(BUSpacing.md)
        .background(BUColor.danger.opacity(0.06), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(BUColor.danger.opacity(0.25), lineWidth: 1)
        )
    }

    private var actionButtons: some View {
        VStack(spacing: 10) {
            Button {
                Task { await runTest() }
            } label: {
                HStack(spacing: 8) {
                    if phase.isTesting {
                        ProgressView().controlSize(.small)
                    } else {
                        Image(systemName: "bolt.horizontal")
                            .font(.system(size: 13, weight: .semibold))
                    }
                    Text(phase.isTesting ? "테스트 중..." : "연결 테스트")
                        .font(.system(size: 14, weight: .heavy))
                }
                .frame(maxWidth: .infinity, minHeight: 48)
                .foregroundStyle(BUColor.midnight)
                .background(BUColor.midnight08, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .strokeBorder(BUColor.midnight.opacity(0.18), lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            .disabled(!canTest)

            Button {
                Task { await runSave() }
            } label: {
                HStack(spacing: 8) {
                    if phase.isSaving {
                        ProgressView().controlSize(.small).tint(.white)
                    } else {
                        Image(systemName: "link.badge.plus")
                            .font(.system(size: 13, weight: .semibold))
                    }
                    Text(phase.isSaving ? "저장 중..." : "연결하기")
                        .font(.system(size: 15, weight: .heavy))
                }
                .frame(maxWidth: .infinity, minHeight: 52)
                .foregroundStyle(.white)
                .background(
                    canSave ? AnyShapeStyle(BUColor.midnight) : AnyShapeStyle(BUColor.inkMuted),
                    in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                )
            }
            .buttonStyle(.plain)
            .disabled(!canSave)
        }
    }

    // MARK: - Derived

    private var trimmedURL: String { endpointURL.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var trimmedToken: String { secretToken.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var trimmedLabel: String { label.trimmingCharacters(in: .whitespacesAndNewlines) }

    private var urlLooksValid: Bool {
        guard !trimmedURL.isEmpty else { return false }
        guard let u = URL(string: trimmedURL) else { return false }
        return u.scheme == "https"
    }

    private var canTest: Bool {
        guard !phase.isTesting && !phase.isSaving else { return false }
        return urlLooksValid && !trimmedToken.isEmpty
    }

    private var canSave: Bool {
        guard !phase.isTesting && !phase.isSaving else { return false }
        guard urlLooksValid, !trimmedToken.isEmpty, !trimmedLabel.isEmpty else { return false }
        if case .testSucceeded = phase { return true }
        return false
    }

    private var errorMessage: String? {
        switch phase {
        case .testFailed(let m), .saveFailed(let m): return m
        default: return nil
        }
    }

    // MARK: - Actions

    @MainActor
    private func runTest() async {
        focusedField = nil
        guard urlLooksValid else {
            phase = .testFailed("주소가 https:// 로 시작해야 합니다.")
            return
        }
        phase = .testing
        let repo = FunnelConnectionRepository(supabase: BUSupabase.shared.client)
        do {
            let result = try await repo.testPullConnection(
                endpointURL: trimmedURL,
                secretToken: trimmedToken,
                mode: mode.rawValue
            )
            if result.success, let data = result.data {
                phase = .testSucceeded(data)
            } else {
                let msg = result.error ?? "사장님 서버가 \(result.httpStatus) 로 응답했습니다."
                phase = .testFailed(msg)
            }
        } catch let e as FunnelConnectionError {
            phase = .testFailed(e.errorDescription ?? "알 수 없는 오류")
        } catch {
            phase = .testFailed(error.localizedDescription)
        }
    }

    @MainActor
    private func runSave() async {
        focusedField = nil
        phase = .saving
        let repo = FunnelConnectionRepository(supabase: BUSupabase.shared.client)
        do {
            _ = try await repo.savePullConnection(
                endpointURL: trimmedURL,
                secretToken: trimmedToken,
                mode: mode.rawValue,
                label: trimmedLabel
            )
            onSaved?()
            dismiss()
        } catch let e as FunnelConnectionError {
            phase = .saveFailed(e.errorDescription ?? "저장에 실패했습니다.")
        } catch {
            phase = .saveFailed(error.localizedDescription)
        }
    }
}

#if DEBUG
#Preview {
    CustomPullSetupSheet()
}
#endif
