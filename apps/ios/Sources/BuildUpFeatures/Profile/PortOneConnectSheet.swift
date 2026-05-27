//
//  PortOneConnectSheet.swift — 포트원 V2 API Secret 연결 마법사 (3단계)
//
//  웹 SSOT: apps/web/app/lib/components/profile/PortOneConnectCard.tsx
//
//  Step 1: 콘솔 가이드 (admin.portone.io 에서 Secret 발급 안내)
//  Step 2: Secret + Store ID 입력
//  Step 3: 서버 검증 중
//
//  보안:
//   • Secret 은 한 번만 표시되는 토큰 → 사장님이 메모장에 복사 후 붙여넣기
//   • 서버에서 GET /payments size=1 호출로 검증 후 AES-256-GCM 봉투 암호화 저장
//   • 평문은 디스크/로그 어디에도 남지 않음
//

import SwiftUI
import BuildUpCore
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct PortOneConnectSheet: View {

    @Environment(\.dismiss) private var dismiss

    enum Step: Int { case console = 1, input = 2, validating = 3 }

    @State private var step: Step = .console
    @State private var apiSecret: String = ""
    @State private var storeId: String = ""
    @State private var errorMessage: String?
    @State private var isSubmitting: Bool = false

    @FocusState private var focusedField: Field?
    enum Field: Hashable { case secret, storeId }

    /// 연결 성공 시 부모(DataConnectionSheet)에 알림 — 상태 갱신용
    public var onConnected: (() -> Void)?

    public init(onConnected: (() -> Void)? = nil) {
        self.onConnected = onConnected
    }

    public var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.lg) {
                        stepHeader
                        switch step {
                        case .console:
                            consoleGuide
                        case .input:
                            inputForm
                        case .validating:
                            validatingView
                        }
                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("포트원 연결")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarLeading) {
                    if step == .input {
                        Button("← 이전") { step = .console }
                            .foregroundStyle(BUColor.midnight)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }
                        .foregroundStyle(BUColor.midnight)
                }
                #endif
            }
            .safeAreaInset(edge: .bottom) {
                if step != .validating {
                    primaryActionBar
                        .background(.thinMaterial)
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Step Header

    private var stepHeader: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("포트원 연결 · \(step.rawValue)/3")
                .font(.system(size: 11, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
                .textCase(.uppercase)
                .tracking(0.5)

            Text(stepTitle)
                .font(.system(size: 19, weight: .heavy))
                .foregroundStyle(BUColor.ink)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var stepTitle: String {
        switch step {
        case .console: return "포트원 콘솔에서 V2 Secret 발급"
        case .input: return "발급된 Secret 입력"
        case .validating: return "검증 중…"
        }
    }

    // MARK: - Step 1: 콘솔 가이드

    private var consoleGuide: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 12) {
                guideStep(num: "1", text: "포트원 콘솔에 Owner/Admin 계정으로 로그인", linkTitle: "admin.portone.io", linkUrl: "https://admin.portone.io")
                guideStep(num: "2", text: "좌측 메뉴 → [결제연동] → [API Keys]")
                guideStep(num: "3", text: "[V2 API Secret 발급] 버튼 클릭")
                guideStep(num: "4", text: "이름: \"buildup-readonly\", 만료: 90일 권장")
                guideStep(
                    num: "5",
                    text: "발급 직후 한 번만 보입니다 — 미리 메모장에 복사하세요",
                    warning: true
                )
                guideStep(num: "6", text: "복사한 Secret 을 다음 단계에 붙여넣으세요")
            }
        }
    }

    private func guideStep(num: String, text: String, linkTitle: String? = nil, linkUrl: String? = nil, warning: Bool = false) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text(num)
                .font(.system(size: 11, weight: .heavy))
                .foregroundStyle(.white)
                .frame(width: 20, height: 20)
                .background(warning ? BUColor.warn : BUColor.midnight, in: Circle())

            VStack(alignment: .leading, spacing: 2) {
                Text(text)
                    .font(.system(size: 13.5, weight: warning ? .heavy : .medium))
                    .foregroundStyle(warning ? BUColor.warn : BUColor.ink)
                    .lineSpacing(2)
                if let title = linkTitle, let url = linkUrl, let parsed = URL(string: url) {
                    Link(title, destination: parsed)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                        .underline()
                }
            }
            Spacer(minLength: 0)
        }
    }

    // MARK: - Step 2: Input form

    private var inputForm: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.md) {
                // Secret
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 3) {
                        Text("V2 API Secret")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(BUColor.inkMuted)
                        Text("*")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(BUColor.danger)
                    }
                    SecureField("포트원 V2 Secret", text: $apiSecret)
                        .textContentType(.password)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .focused($focusedField, equals: .secret)
                        .textFieldStyle(.roundedBorder)
                        .font(.system(.body, design: .monospaced))

                    Text("V1 키는 호환되지 않습니다. \"V2 API Secret\" 만 가능.")
                        .font(.system(size: 11))
                        .foregroundStyle(BUColor.inkMuted)
                }

                // Store ID
                VStack(alignment: .leading, spacing: 4) {
                    Text("Store ID (멀티스토어인 경우)")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(BUColor.inkMuted)
                    TextField("store-xxxx (옵션)", text: $storeId)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .focused($focusedField, equals: .storeId)
                        .textFieldStyle(.roundedBorder)
                        .font(.system(.body, design: .monospaced))
                    Text("단일 스토어면 비워 두세요.")
                        .font(.system(size: 11))
                        .foregroundStyle(BUColor.inkMuted)
                }

                if let error = errorMessage {
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(BUColor.danger)
                        Text(error)
                            .font(.system(size: 12.5, weight: .semibold))
                            .foregroundStyle(BUColor.danger)
                            .lineSpacing(2)
                    }
                    .padding(10)
                    .background(BUColor.danger.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
                }
            }
        }
    }

    // MARK: - Step 3: Validating

    private var validatingView: some View {
        VStack(spacing: 14) {
            ProgressView()
                .scaleEffect(1.4)
            Text("포트원에 검증 호출 중…")
                .font(.system(size: 13.5, weight: .semibold))
                .foregroundStyle(BUColor.inkSecondary)
        }
        .frame(maxWidth: .infinity, minHeight: 200)
    }

    // MARK: - Primary action bar

    private var primaryActionBar: some View {
        HStack {
            Spacer()
            Button {
                handlePrimaryAction()
            } label: {
                Text(primaryButtonTitle)
                    .font(.system(size: 14.5, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(minWidth: 140, minHeight: 44)
                    .padding(.horizontal, 18)
                    .background(
                        LinearGradient(
                            colors: [BUColor.midnight, BUColor.midnight.opacity(0.82)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                    )
                    .opacity(primaryButtonEnabled ? 1.0 : 0.5)
            }
            .disabled(!primaryButtonEnabled)
            .buttonStyle(.plain)
            .padding(.horizontal, BUSpacing.md)
            .padding(.vertical, 10)
        }
    }

    private var primaryButtonTitle: String {
        switch step {
        case .console: return "다음 →"
        case .input: return isSubmitting ? "검증 중…" : "연결"
        case .validating: return "검증 중…"
        }
    }

    private var primaryButtonEnabled: Bool {
        switch step {
        case .console: return true
        case .input: return !apiSecret.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isSubmitting
        case .validating: return false
        }
    }

    // MARK: - Action

    private func handlePrimaryAction() {
        switch step {
        case .console:
            step = .input
            // 한 박자 늦게 포커스 (트랜지션 후)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                focusedField = .secret
            }
        case .input:
            submitConnection()
        case .validating:
            break
        }
    }

    private func submitConnection() {
        let trimmedSecret = apiSecret.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedStore = storeId.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedSecret.isEmpty else { return }

        errorMessage = nil
        isSubmitting = true
        step = .validating

        Task {
            defer {
                isSubmitting = false
                // 성공 시엔 dismiss 됨. 실패 시 다시 input 으로.
            }
            let repo = PortOneRepository(supabase: BUSupabase.shared.client)
            do {
                let response = try await repo.connect(
                    apiSecret: trimmedSecret,
                    storeId: trimmedStore.isEmpty ? nil : trimmedStore
                )
                if response.ok {
                    // 성공 → 부모 알림 + dismiss
                    onConnected?()
                    dismiss()
                } else {
                    errorMessage = response.error ?? "연결 실패 — Secret 을 확인해 주세요."
                    step = .input
                }
            } catch let repoError as PortOneRepositoryError {
                errorMessage = repoError.localizedDescription ?? "오류가 발생했습니다."
                step = .input
            } catch {
                errorMessage = "네트워크 오류: \(error.localizedDescription)"
                step = .input
            }
        }
    }
}
