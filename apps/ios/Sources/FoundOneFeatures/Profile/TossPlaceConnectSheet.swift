//
//  TossPlaceConnectSheet.swift — 토스 단말기(TOSS Place) 연결 마법사
//
//  웹 SSOT: apps/web/app/lib/components/profile/TossPlaceConnectCard.tsx
//
//  Step 1: developer.tossplace.com 에서 Access Key + Secret 발급 안내
//  Step 2: Access Key + Access Secret + 매장 ID 입력
//  Step 3: 서버 검증 중
//
//  발급: 매장 대시보드 → 앱 사용 활성화 토글 ON → Access Key 발급 (1회만 표시)
//

import SwiftUI
import FoundOneCore
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct TossPlaceConnectSheet: View {

    @Environment(\.dismiss) private var dismiss

    enum Step: Int { case guide = 1, input = 2, validating = 3 }

    @State private var step: Step = .guide
    @State private var accessKey: String = ""
    @State private var accessSecret: String = ""
    @State private var merchantId: String = ""
    @State private var errorMessage: String?
    @State private var isSubmitting: Bool = false

    @FocusState private var focusedField: Field?
    enum Field: Hashable { case accessKey, accessSecret, merchantId }

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
            .navigationTitle("TOSS Place 연결")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarLeading) {
                    if step == .input {
                        Button("← 이전") { step = .guide }.foregroundStyle(BUColor.midnight)
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
            Text("TOSS Place 연결 · \(step.rawValue)/3")
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
        case .guide:      return "개발자 콘솔에서 Access Key 발급"
        case .input:      return "Access Key + 매장 ID 입력"
        case .validating: return "검증 중…"
        }
    }

    // MARK: - Step 1: Guide

    private var guideView: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 12) {
                guideStep(num: "1", text: "TOSS Place 개발자 콘솔에 로그인", linkTitle: "developer.tossplace.com", linkUrl: "https://developer.tossplace.com")
                guideStep(num: "2", text: "앱 등록 → Access Key 발급 (이름: \"foundone\" 권장)")
                guideStep(
                    num: "3",
                    text: "Access Secret 은 발급 직후 1회만 표시됩니다 — 미리 복사해 두세요.",
                    warning: true
                )
                guideStep(num: "4", text: "매장 대시보드 → 앱 사용 활성화 토글 ON")
                guideStep(num: "5", text: "매장 ID(merchant-xxxx)를 확인하세요")
                guideStep(num: "6", text: "세 값을 모두 준비한 뒤 다음 단계로 진행하세요")
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
                fieldBlock(label: "Access Key", required: true, placeholder: "tp_live_...") {
                    TextField("tp_live_...", text: $accessKey)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .focused($focusedField, equals: .accessKey)
                        .textFieldStyle(.roundedBorder)
                        .font(.system(.body, design: .monospaced))
                }

                fieldBlock(label: "Access Secret", required: true, placeholder: "") {
                    SecureField("Access Secret", text: $accessSecret)
                        .textContentType(.password)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .focused($focusedField, equals: .accessSecret)
                        .textFieldStyle(.roundedBorder)
                        .font(.system(.body, design: .monospaced))
                }

                fieldBlock(label: "매장 ID", required: true, placeholder: "merchant-xxxx", hint: "대시보드에 표시된 ID") {
                    TextField("merchant-xxxx", text: $merchantId)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .focused($focusedField, equals: .merchantId)
                        .textFieldStyle(.roundedBorder)
                        .font(.system(.body, design: .monospaced))
                }

                if let error = errorMessage { errorBanner(error) }
            }
        }
    }

    private func fieldBlock<Content: View>(
        label: String, required: Bool, placeholder: String, hint: String? = nil,
        @ViewBuilder content: () -> Content
    ) -> some View {
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

    // MARK: - Step 3: Validating

    private var validatingView: some View {
        VStack(spacing: 14) {
            ProgressView().scaleEffect(1.4)
            Text("TOSS Place 에 검증 호출 중…")
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
        let allFilled = !accessKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !accessSecret.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !merchantId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        switch step {
        case .guide:      return true
        case .input:      return allFilled && !isSubmitting
        case .validating: return false
        }
    }

    // MARK: - Actions

    private func handlePrimaryAction() {
        switch step {
        case .guide:
            step = .input
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { focusedField = .accessKey }
        case .input:
            submitConnection()
        case .validating:
            break
        }
    }

    private func submitConnection() {
        let key    = accessKey.trimmingCharacters(in: .whitespacesAndNewlines)
        let secret = accessSecret.trimmingCharacters(in: .whitespacesAndNewlines)
        let mid    = merchantId.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !key.isEmpty, !secret.isEmpty, !mid.isEmpty else { return }

        errorMessage = nil
        isSubmitting = true
        step = .validating

        Task {
            defer { isSubmitting = false }
            let repo = TossPlaceRepository(supabase: BUSupabase.shared.client)
            do {
                let response = try await repo.connect(accessKey: key, accessSecret: secret, merchantId: mid)
                if response.ok {
                    onConnected?()
                    dismiss()
                } else {
                    errorMessage = response.error ?? "연결 실패 — 입력 값을 확인해 주세요."
                    step = .input
                }
            } catch let repoError as TossPlaceRepositoryError {
                errorMessage = repoError.errorDescription ?? "오류가 발생했습니다."
                step = .input
            } catch {
                errorMessage = "네트워크 오류: \(error.localizedDescription)"
                step = .input
            }
        }
    }

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
#Preview { TossPlaceConnectSheet() }
#endif
