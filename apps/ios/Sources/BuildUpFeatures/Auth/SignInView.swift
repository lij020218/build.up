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
import BuildUpDesignSystem
import BuildUpAuth
import BuildUpData

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
                    KakaoButton {
                        Task { await coordinator.signInWithKakao() }
                    }
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
    @FocusState private var focusedField: Field?

    private enum Field: Hashable {
        case lastName
        case firstName
        case birthYear
        case email
        case password
    }

    private var passwordStrong: Bool {
        password.count >= 8 && password.range(of: #"[0-9]"#, options: .regularExpression) != nil
    }

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
                            Text("8자 이상, 숫자 포함\(passwordStrong ? " ✓" : "")")
                                .font(.system(size: 11))
                                .foregroundStyle(passwordStrong ? Color(red: 0.2, green: 0.78, blue: 0.35) : BUColor.danger)
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
                                Button("이용약관") { openURL(URL(string: "https://buildup.kr/terms")!) }
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundStyle(BUColor.auroraNavy)
                                Text(" 및 ")
                                    .font(.system(size: 12))
                                    .foregroundStyle(BUColor.inkMuted)
                                Button("개인정보처리방침") { openURL(URL(string: "https://buildup.kr/privacy")!) }
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

                    Spacer(minLength: 0)
                }
                .padding(BUSpacing.lg)
            }
        }
        .onChange(of: coordinator.isAuthenticated) { _, isAuthenticated in
            if isAuthenticated { dismiss() }
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
            ZStack {
                LinearGradient(
                    colors: [BUColor.auroraNavy, BUColor.auroraBlue, BUColor.auroraTeal],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                Text("b")
                    .font(.system(size: 36, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
                    .tracking(-0.5)
            }
            .frame(width: 72, height: 72)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .shadow(color: BUColor.midnightInk.opacity(0.18), radius: 16, x: 0, y: 8)

            // Wordmark
            HStack(spacing: 0) {
                Text("Build")
                    .font(.system(size: 30, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                Text(".")
                    .font(.system(size: 30, weight: .bold))
                    .foregroundStyle(BUColor.midnightInk)
                Text("UP")
                    .font(.system(size: 30, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
            }
            .tracking(-1.1)

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
                Color(red: 0.99, green: 0.85, blue: 0.0),
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
                    openURL(URL(string: "https://buildup.kr/terms")!)
                }
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(BUColor.inkSecondary)
                Text("·")
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkSubtle)
                Button("개인정보처리방침") {
                    openURL(URL(string: "https://buildup.kr/privacy")!)
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
