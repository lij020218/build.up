//
//  SignInView.swift — 모바일 전용 로그인 화면
//
//  사장님 지침 (2026-05-14): "모바일 전용 로그인 페이지를 만들자"
//
//   • 웹의 다크 hero / mockup preview 패턴 안 따라감 — 모바일에 안 맞음
//   • 라이트 모드 + Aurora 배경 (앱 전체 톤 통일)
//   • Apple iOS 표준 onboarding 패턴 — Brand mark + 가치 제안 + 3 버튼 + 정책
//   • Dynamic Type 자동 지원 / 모든 Text fixedSize wrap
//   • viewport 꽉 채움 (status bar~home indicator)
//

import SwiftUI
import AuthenticationServices
import FoundOneDesignSystem
import FoundOneAuth
import FoundOneData

#if canImport(UIKit)
import UIKit
#endif

public struct SignInView: View {

    @Bindable public var coordinator: AuthCoordinator
    @State private var showEmailAuth = false

    public init(coordinator: AuthCoordinator) {
        self.coordinator = coordinator
    }

    public var body: some View {
        ZStack {
            BUBackgroundSurface()  // Aurora — 앱 전체와 동일 톤

            VStack(spacing: 0) {
                Spacer(minLength: 0)

                BrandMark()
                    .padding(.bottom, BUSpacing.xl)

                ValuePropositions()
                    .padding(.horizontal, BUSpacing.lg)
                    .padding(.bottom, BUSpacing.xl)

                Spacer(minLength: 0)

                VStack(spacing: 10) {
                    // ⚠️ 카카오 로그인은 네이티브 SDK 미연동(KakaoAuthProvider 스텁, Package.swift 주석)이라
                    //   누르면 개발자 에러가 노출됨 → 출시 전 버튼 숨김. SDK 연동 + Supabase/카카오콘솔 설정 후 복구.
                    //    KakaoButton { Task { await coordinator.signInWithKakao() } }
                    AppleButton {
                        Task { await coordinator.signInWithApple() }
                    }
                    EmailButton {
                        showEmailAuth = true
                    }
                }
                .padding(.horizontal, BUSpacing.md)

                statusView
                    .padding(.top, BUSpacing.sm)

                LegalFooter()
                    .padding(.top, BUSpacing.md)
                    .padding(.bottom, BUSpacing.lg)
                    .padding(.horizontal, BUSpacing.lg)
            }
        }
        .sheet(isPresented: $showEmailAuth) {
            EmailAuthSheet(coordinator: coordinator)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
    }

    @ViewBuilder
    private var statusView: some View {
        switch coordinator.state {
        case .authenticating:
            HStack(spacing: 6) {
                ProgressView()
                    .controlSize(.small)
                Text("로그인 중")
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            }
        case .failed(let msg):
            Text(msg)
                .font(.system(size: 12.5, weight: .medium))
                .foregroundStyle(BUColor.danger)
                .multilineTextAlignment(.center)
                .padding(.horizontal, BUSpacing.lg)
                .fixedSize(horizontal: false, vertical: true)
        default:
            EmptyView()
        }
    }
}

private enum EmailAuthMode: String, CaseIterable, Identifiable {
    case login = "로그인"
    case signup = "가입"

    var id: String { rawValue }
}

private struct EmailAuthSheet: View {
    @Bindable var coordinator: AuthCoordinator
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    @State private var mode: EmailAuthMode = .login
    @State private var lastName = ""
    @State private var firstName = ""
    @State private var birthYearText = ""
    @State private var email = ""
    @State private var password = ""
    @State private var agreedToTerms = false
    @State private var resetInfo: String?
    @State private var resetIsError = false
    @FocusState private var focusedField: Field?

    private enum Field: Hashable {
        case lastName
        case firstName
        case birthYear
        case email
        case password
    }

    // 웹 SSOT(@foundone/shared validatePassword)와 동일 규칙: 8자 이상 + 영문 + 숫자 + 흔한 비번 제외.
    private var passwordStrong: Bool { PasswordPolicy.isStrong(password) }

    private var canSubmit: Bool {
        let hasEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).contains("@")
        let hasPassword = password.count >= 1
        if mode == .signup {
            let year = Int(birthYearText) ?? 0
            let validYear = year >= 1900 && year <= Calendar.current.component(.year, from: Date()) - 14
            // 신규 가입: 강력한 비밀번호 + 이름 + 출생연도 + 약관 모두 필요
            return hasEmail && passwordStrong
                && !lastName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                && !firstName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                && validYear
                && agreedToTerms
        }
        // 로그인: Supabase가 실제 인증 처리 — 형식만 확인
        return hasEmail && hasPassword
    }

    private var isAuthenticating: Bool {
        if case .authenticating = coordinator.state { return true }
        return false
    }

    var body: some View {
        ZStack {
            BUBackgroundSurface()

            if case .needsEmailConfirmation(let pendingEmail) = coordinator.state {
                // ── 이메일 인증 대기 화면 ──
                VStack(spacing: 0) {
                    Spacer()
                    ZStack {
                        Circle()
                            .fill(BUColor.auroraNavy.opacity(0.1))
                            .frame(width: 72, height: 72)
                        Image(systemName: "envelope.badge.fill")
                            .font(.system(size: 28))
                            .foregroundStyle(BUColor.auroraNavy)
                    }
                    .padding(.bottom, 20)

                    Text("이메일을 확인해 주세요")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                        .padding(.bottom, 10)

                    Text("\(pendingEmail)로\n인증 링크를 발송했습니다.\n링크 클릭 후 앱으로 돌아와 로그인해 주세요.")
                        .font(.system(size: 14))
                        .foregroundStyle(BUColor.inkMuted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)

                    Spacer()

                    VStack(spacing: 10) {
                        Button {
                            Task { await coordinator.resendEmailConfirmation(email: pendingEmail) }
                        } label: {
                            Text("인증 이메일 재발송")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity, minHeight: 52)
                                .background(BUColor.auroraNavy, in: RoundedRectangle(cornerRadius: 15, style: .continuous))
                        }
                        .buttonStyle(PressableButtonStyle())

                        Button {
                            mode = .login
                            coordinator.cancelSignup()
                        } label: {
                            Text("로그인으로 돌아가기")
                                .font(.system(size: 14))
                                .foregroundStyle(BUColor.inkSecondary)
                        }
                    }
                }
                .padding(BUSpacing.lg)
            } else {
                // ── 로그인 / 회원가입 폼 ──
                VStack(alignment: .leading, spacing: 18) {
                    HStack {
                        Text(mode == .signup ? "이메일로 가입" : "이메일 로그인")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(BUColor.ink)
                        Spacer(minLength: 0)
                        Button("닫기") { dismiss() }
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.inkSecondary)
                    }

                    Picker("이메일 인증 모드", selection: $mode) {
                        ForEach(EmailAuthMode.allCases) { item in
                            Text(item.rawValue).tag(item)
                        }
                    }
                    .pickerStyle(.segmented)

                    VStack(alignment: .leading, spacing: 10) {
                        if mode == .signup {
                            HStack(spacing: 8) {
                                AuthTextField(title: "성", text: $lastName, submitLabel: .next)
                                    .focused($focusedField, equals: .lastName)
                                    .onSubmit { focusedField = .firstName }
                                AuthTextField(title: "이름", text: $firstName, submitLabel: .next)
                                    .focused($focusedField, equals: .firstName)
                                    .onSubmit { focusedField = .birthYear }
                            }
                            AuthTextField(title: "출생연도 (예: 1990)", text: $birthYearText, submitLabel: .next)
                                .focused($focusedField, equals: .birthYear)
                                .onSubmit { focusedField = .email }
                        }

                        AuthTextField(title: "이메일", text: $email, submitLabel: .next)
                            .focused($focusedField, equals: .email)
                            .onSubmit { focusedField = .password }

                        AuthSecureField(title: "비밀번호", text: $password)
                            .focused($focusedField, equals: .password)
                            .onSubmit { submit() }

                        if mode == .signup && !password.isEmpty {
                            Text("8자 이상, 영문·숫자 포함\(passwordStrong ? " ✓" : "")")
                                .font(.system(size: 11))
                                .foregroundStyle(passwordStrong ? BUColor.success : BUColor.danger)
                        }
                    }

                    if case .failed(let message) = coordinator.state {
                        Text(message)
                            .font(.system(size: 12.5, weight: .medium))
                            .foregroundStyle(BUColor.danger)
                            .fixedSize(horizontal: false, vertical: true)
                    } else {
                        Text(mode == .signup ? "웹과 같은 계정으로 새 워크스페이스를 만듭니다." : "웹에서 쓰는 이메일 계정 그대로 로그인합니다.")
                            .font(.system(size: 12.5, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                    }

                    if mode == .signup {
                        HStack(alignment: .top, spacing: 10) {
                            Toggle("", isOn: $agreedToTerms)
                                .labelsHidden()
                                .tint(BUColor.auroraNavy)
                                .frame(width: 32)
                            HStack(spacing: 0) {
                                Button("이용약관") { openURL(URL(string: "https://foundone.dev/terms")!) }
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundStyle(BUColor.auroraNavy)
                                Text(" 및 ")
                                    .font(.system(size: 12))
                                    .foregroundStyle(BUColor.inkMuted)
                                Button("개인정보처리방침") { openURL(URL(string: "https://foundone.dev/privacy")!) }
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundStyle(BUColor.auroraNavy)
                                Text("에 동의합니다")
                                    .font(.system(size: 12))
                                    .foregroundStyle(BUColor.inkMuted)
                            }
                        }
                    }

                    Button(action: submit) {
                        HStack(spacing: 8) {
                            if isAuthenticating {
                                ProgressView().controlSize(.small).tint(.white)
                            }
                            Text(mode == .signup ? "계정 만들기" : "로그인")
                                .font(.system(size: 15, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 52)
                        .background(
                            LinearGradient(colors: [BUColor.auroraNavy, BUColor.auroraBlue], startPoint: .leading, endPoint: .trailing),
                            in: RoundedRectangle(cornerRadius: 15, style: .continuous)
                        )
                        .opacity(canSubmit && !isAuthenticating ? 1 : 0.48)
                    }
                    .buttonStyle(PressableButtonStyle())
                    .disabled(!canSubmit || isAuthenticating)

                    if mode == .login {
                        Button {
                            sendReset()
                        } label: {
                            Text("비밀번호를 잊으셨나요?")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(BUColor.inkSecondary)
                                .underline()
                                .frame(maxWidth: .infinity)
                                .padding(.top, 4)
                        }
                        .buttonStyle(.plain)
                        Button {
                            resetIsError = false
                            resetInfo = "FoundOne은 가입한 이메일이 곧 아이디입니다. Apple로 가입하셨다면 이 창을 닫고 Apple 버튼으로 바로 로그인하세요. 이메일로 가입하셨다면 기억나는 이메일로 「비밀번호를 잊으셨나요?」를 눌러 확인하세요."
                        } label: {
                            Text("이메일(아이디)이 기억나지 않으세요?")
                                .font(.system(size: 12.5, weight: .regular))
                                .foregroundStyle(BUColor.inkMuted)
                                .underline()
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.plain)
                        if let resetInfo {
                            Text(resetInfo)
                                .font(.system(size: 12.5))
                                .foregroundStyle(resetIsError ? BUColor.danger : BUColor.success)
                                .multilineTextAlignment(.center)
                                .lineSpacing(2)
                                .frame(maxWidth: .infinity)
                        }
                    }

                    Spacer(minLength: 0)
                }
                .padding(BUSpacing.lg)
            }
        }
        .onChange(of: coordinator.isAuthenticated) { _, isAuthenticated in
            if isAuthenticated { dismiss() }
        }
    }

    private func sendReset() {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, trimmed.contains("@") else {
            resetIsError = true
            resetInfo = "가입한 이메일을 먼저 입력해 주세요."
            return
        }
        Task {
            do {
                try await coordinator.sendPasswordReset(email: trimmed)
                resetIsError = false
                resetInfo = "재설정 메일을 보냈습니다. 이 기기에서 메일의 「새 비밀번호 설정」 링크를 누르면 앱으로 돌아와 바로 새 비밀번호를 설정할 수 있어요. (Apple 로그인 계정은 메일이 오지 않습니다)"
            } catch {
                resetIsError = true
                resetInfo = "메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요."
            }
        }
    }

    private func submit() {
        guard canSubmit, !isAuthenticating else { return }
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedFirstName = firstName.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedLastName = lastName.trimmingCharacters(in: .whitespacesAndNewlines)
        Task {
            switch mode {
            case .login:
                await coordinator.signInWithEmail(email: trimmedEmail, password: password)
            case .signup:
                await coordinator.signUpWithEmail(
                    firstName: trimmedFirstName,
                    lastName: trimmedLastName,
                    birthYear: Int(birthYearText),
                    email: trimmedEmail,
                    password: password
                )
            }
        }
    }
}

private struct AuthTextField: View {
    let title: String
    @Binding var text: String
    var submitLabel: SubmitLabel = .done

    var body: some View {
        TextField(title, text: $text)
            .submitLabel(submitLabel)
            .font(.system(size: 15, weight: .medium))
            .foregroundStyle(BUColor.ink)
            .padding(.horizontal, 14)
            .frame(minHeight: 50)
            .background(Color.white.opacity(0.84), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(BUColor.borderSubtle, lineWidth: 1)
            )
    }
}

private struct AuthSecureField: View {
    let title: String
    @Binding var text: String

    var body: some View {
        SecureField(title, text: $text)
            .textContentType(.password)
            .submitLabel(.go)
            .font(.system(size: 15, weight: .medium))
            .foregroundStyle(BUColor.ink)
            .padding(.horizontal, 14)
            .frame(minHeight: 50)
            .background(Color.white.opacity(0.84), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(BUColor.borderSubtle, lineWidth: 1)
            )
    }
}

// MARK: - Brand Mark

private struct BrandMark: View {
    var body: some View {
        VStack(spacing: BUSpacing.md) {
            // Logo mark — 둥근 사각 + Aurora 그라디언트 (BrandBar 와 동일 톤)
            FoundOneSpiralLogo(size: 68, color: BUColor.midnightBright)
                .frame(width: 72, height: 72)

            // Wordmark — 공식 로고 서체(FoundOneWordmark). "." 은 마크색 액센트.
            FoundOneWordmark(height: 27, color: BUColor.ink, dotColor: BUColor.midnightBright)

            // 부제목
            Text("매일 5초, 사장님 옆에 함께")
                .font(.system(size: 14.5, weight: .regular))
                .foregroundStyle(BUColor.inkSecondary)
                .multilineTextAlignment(.center)
                .tracking(-0.2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

// MARK: - Value Propositions

private struct ValuePropositions: View {
    var body: some View {
        VStack(spacing: 10) {
            valueRow(
                icon: "chart.line.uptrend.xyaxis",
                title: "매일 30초 코칭",
                detail: "어제 매출 + 오늘 행동 1개"
            )
            valueRow(
                icon: "exclamationmark.shield.fill",
                title: "현금 위기 7일 전 알림",
                detail: "통장 부족 예상 즉시 푸시"
            )
            valueRow(
                icon: "map.fill",
                title: "46단계 로드맵",
                detail: "사장님 단계 맞춤 카드"
            )
        }
    }

    private func valueRow(icon: String, title: String, detail: String) -> some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(BUColor.midnight08)
                    .frame(width: 36, height: 36)
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Text(detail)
                    .font(.system(size: 11.5, weight: .regular))
                    .foregroundStyle(BUColor.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
    }
}

// MARK: - Buttons

private struct KakaoButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: "message.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.black.opacity(0.85))
                Text("카카오로 시작하기")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.black.opacity(0.85))
            }
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(
                BUColor.warn,
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )
        }
        .buttonStyle(PressableButtonStyle())
    }
}

private struct AppleButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: "apple.logo")
                    .font(.system(size: 16, weight: .medium))
                    .offset(y: -1.5)
                Text("Apple로 시작하기")
                    .font(.system(size: 15, weight: .semibold))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(
                LinearGradient(
                    colors: [
                        Color(red: 0x1E/255, green: 0x2A/255, blue: 0x55/255),
                        Color(red: 0x2C/255, green: 0x4F/255, blue: 0x80/255),
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ),
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )
            .shadow(
                color: Color(red: 0x1E/255, green: 0x2A/255, blue: 0x55/255).opacity(0.20),
                radius: 8,
                x: 0,
                y: 2
            )
        }
        .buttonStyle(PressableButtonStyle())
    }
}

private struct EmailButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text("이메일로 계속하기")
                .font(.system(size: 13.5, weight: .medium))
                .foregroundStyle(BUColor.inkSecondary)
                .frame(maxWidth: .infinity, minHeight: 44)
        }
        .buttonStyle(.plain)
    }
}

private struct LegalFooter: View {
    @Environment(\.openURL) private var openURL

    var body: some View {
        VStack(spacing: 6) {
            Text("로그인 시 약관에 동의합니다")
                .font(.system(size: 11, weight: .regular))
                .foregroundStyle(BUColor.inkMuted.opacity(0.7))

            HStack(spacing: BUSpacing.sm) {
                Button("이용약관") {
                    openURL(URL(string: "https://foundone.dev/terms")!)
                }
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(BUColor.inkSecondary)
                Text("·")
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkSubtle)
                Button("개인정보처리방침") {
                    openURL(URL(string: "https://foundone.dev/privacy")!)
                }
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(BUColor.inkSecondary)
            }
        }
    }
}

// MARK: - Press style

private struct PressableButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .opacity(configuration.isPressed ? 0.88 : 1.0)
            .animation(.spring(response: 0.22, dampingFraction: 0.75), value: configuration.isPressed)
    }
}

// MARK: - Preview

#if DEBUG
@MainActor
private func makePreviewCoordinator() -> AuthCoordinator {
    let supabase = BUSupabase.makeForTest(env: .mockForPreview).client
    return AuthCoordinator(supabase: supabase)
}

#Preview("SignInView — Mobile Native") {
    SignInView(coordinator: makePreviewCoordinator())
}
#endif
