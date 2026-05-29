//
//  TossConnectSheet.swift — 토스페이먼츠 Secret Key 연결 마법사
//
//  웹 SSOT: apps/web/app/api/integrations/toss/connect/route.ts
//
//  Step 1: 토스페이먼츠 대시보드에서 Secret Key 발급 안내
//  Step 2: Secret Key (+옵션 Client Key) 입력
//  Step 3: 서버 검증 중
//
//  Key 형식: test_sk_... (테스트) / live_sk_... (라이브)
//

import SwiftUI
import FoundOneCore
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct TossConnectSheet: View {

    @Environment(\.dismiss) private var dismiss

    enum Step: Int { case guide = 1, input = 2, validating = 3 }

    @State private var step: Step = .guide
    @State private var apiSecret: String = ""
    @State private var clientKey: String = ""
    @State private var errorMessage: String?
    @State private var isSubmitting: Bool = false

    @FocusState private var focusedField: Field?
    enum Field: Hashable { case secret, clientKey }

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
                        case .guide:      guideView
                        case .input:      inputForm
                        case .validating: validatingView
                        }
                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("토스페이먼츠 연결")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarLeading) {
                    if step == .input {
                        Button("← 이전") { step = .guide }
                            .foregroundStyle(BUColor.midnight)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight)
                }
                #endif
            }
            .safeAreaInset(edge: .bottom) {
                if step != .validating { primaryActionBar.background(.thinMaterial) }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Step Header

    private var stepHeader: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("토스페이먼츠 연결 · \(step.rawValue)/3")
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
        case .guide:      return "대시보드에서 Secret Key 발급"
        case .input:      return "발급된 Secret Key 입력"
        case .validating: return "검증 중…"
        }
    }

    // MARK: - Step 1: Guide

    private var guideView: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 12) {
                guideStep(num: "1", text: "토스페이먼츠 대시보드에 로그인", linkTitle: "dashboard.tosspayments.com", linkUrl: "https://dashboard.tosspayments.com")
                guideStep(num: "2", text: "좌측 메뉴 → [개발 설정] → [API 키]")
                guideStep(num: "3", text: "Secret Key 복사 (live_sk_... 또는 test_sk_...)")
                guideStep(
                    num: "4",
                    text: "Secret Key 는 절대 외부에 노출하지 마세요. Found.One 서버가 암호화하여 보관합니다.",
                    warning: true
                )
                guideStep(num: "5", text: "복사한 Secret Key 를 다음 단계에 붙여넣으세요")
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
                if let title = linkTitle, let urlStr = linkUrl, let parsed = URL(string: urlStr) {
                    Link(title, destination: parsed)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                        .underline()
                }
            }
            Spacer(minLength: 0)
        }
    }

    // MARK: - Step 2: Input

    private var inputForm: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.md) {
                // Secret Key
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 3) {
                        Text("Secret Key")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(BUColor.inkMuted)
                        Text("*")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(BUColor.danger)
                    }
                    SecureField("test_sk_... 또는 live_sk_...", text: $apiSecret)
                        .textContentType(.password)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .focused($focusedField, equals: .secret)
                        .textFieldStyle(.roundedBorder)
                        .font(.system(.body, design: .monospaced))
                    Text("V1 Key (sk_...) 는 지원되지 않습니다. V2 Secret Key (test_sk_... / live_sk_...) 만 가능.")
                        .font(.system(size: 11))
                        .foregroundStyle(BUColor.inkMuted)
                }

                // Client Key (optional)
                VStack(alignment: .leading, spacing: 4) {
                    Text("Client Key (선택 — 결제 위젯 연동 시)")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(BUColor.inkMuted)
                    TextField("test_ck_... 또는 live_ck_...", text: $clientKey)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .focused($focusedField, equals: .clientKey)
                        .textFieldStyle(.roundedBorder)
                        .font(.system(.body, design: .monospaced))
                    Text("결제 위젯을 쓰지 않는다면 비워 두세요.")
                        .font(.system(size: 11))
                        .foregroundStyle(BUColor.inkMuted)
                }

                if let error = errorMessage {
                    errorBanner(error)
                }
            }
        }
    }

    // MARK: - Step 3: Validating

    private var validatingView: some View {
        VStack(spacing: 14) {
            ProgressView().scaleEffect(1.4)
            Text("토스페이먼츠에 검증 호출 중…")
                .font(.system(size: 13.5, weight: .semibold))
                .foregroundStyle(BUColor.inkSecondary)
        }
        .frame(maxWidth: .infinity, minHeight: 200)
    }

    // MARK: - Primary action bar

    private var primaryActionBar: some View {
        HStack {
            Spacer()
            Button { handlePrimaryAction() } label: {
                Text(primaryButtonTitle)
                    .font(.system(size: 14.5, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(minWidth: 140, minHeight: 44)
                    .padding(.horizontal, 18)
                    .background(
                        LinearGradient(colors: [BUColor.midnight, BUColor.midnight.opacity(0.82)],
                                       startPoint: .topLeading, endPoint: .bottomTrailing),
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
        case .guide:      return "다음 →"
        case .input:      return isSubmitting ? "검증 중…" : "연결"
        case .validating: return "검증 중…"
        }
    }

    private var primaryButtonEnabled: Bool {
        switch step {
        case .guide:      return true
        case .input:      return !apiSecret.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isSubmitting
        case .validating: return false
        }
    }

    // MARK: - Actions

    private func handlePrimaryAction() {
        switch step {
        case .guide:
            step = .input
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { focusedField = .secret }
        case .input:
            submitConnection()
        case .validating:
            break
        }
    }

    private func submitConnection() {
        let trimmedSecret = apiSecret.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedClient = clientKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedSecret.isEmpty else { return }

        errorMessage = nil
        isSubmitting = true
        step = .validating

        Task {
            defer { isSubmitting = false }
            let repo = TossRepository(supabase: BUSupabase.shared.client)
            do {
                let response = try await repo.connect(
                    apiSecret: trimmedSecret,
                    clientKey: trimmedClient.isEmpty ? nil : trimmedClient
                )
                if response.ok {
                    onConnected?()
                    dismiss()
                } else {
                    let msg = response.code == "INVALID_FORMAT"
                        ? "Secret Key 형식이 맞지 않습니다 (test_sk_... / live_sk_...)."
                        : response.error ?? "연결 실패 — Secret Key 를 확인해 주세요."
                    errorMessage = msg
                    step = .input
                }
            } catch let repoError as TossRepositoryError {
                errorMessage = repoError.errorDescription ?? "오류가 발생했습니다."
                step = .input
            } catch {
                errorMessage = "네트워크 오류: \(error.localizedDescription)"
                step = .input
            }
        }
    }

    // MARK: - Shared UI helpers

    private func errorBanner(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(BUColor.danger)
            Text(text)
                .font(.system(size: 12.5, weight: .semibold))
                .foregroundStyle(BUColor.danger)
                .lineSpacing(2)
        }
        .padding(10)
        .background(BUColor.danger.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
    }
}

#if DEBUG
#Preview { TossConnectSheet() }
#endif
