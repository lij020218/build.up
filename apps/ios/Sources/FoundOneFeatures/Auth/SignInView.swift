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

                // 2026-08-14 리디자인: 브랜드 → 헤드라인 → 글래스 카드 그리드, 순차 페이드업.
                //   이전: 마크+워드마크+한 줄 부제 + 좌측 정렬 소형 리스트 3줄 → 위아래가 비고 밋밋했다.
                BrandMark()
                    .padding(.bottom, BUSpacing.xxl)
                    .foEntrance(delay: 0)

                ValuePropositions()
                    .padding(.horizontal, BUSpacing.md)
                    .foEntrance(delay: 0.12)

                Spacer(minLength: BUSpacing.xl)

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
    /// 2.1(a) 심사 반려(2026-08-20, iPad 호환 모드): 버튼이 disabled 라 "눌러도 무반응"으로 보였다.
    /// → 버튼은 항상 탭 가능, 미충족 사유를 여기 담아 빨간 문구로 안내.
    @State private var validationMessage: String? = nil
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

                    Text("메일이 안 보이면 스팸함도 확인해 주세요.")
                        .font(.system(size: 12.5))
                        .foregroundStyle(BUColor.inkSubtle)
                        .padding(.top, 8)

                    Spacer()

                    VStack(spacing: 10) {
                        // 메일 앱 바로 열기 — 인증 대기 화면의 1차 행동 (웹 메일함 바로가기 미러)
                        if let mailURL = URL(string: "message://") {
                            Link(destination: mailURL) {
                                Text("메일 앱 열기")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundStyle(.white)
                                    .frame(maxWidth: .infinity, minHeight: 52)
                                    .background(BUColor.auroraNavy, in: RoundedRectangle(cornerRadius: 15, style: .continuous))
                            }
                        }

                        Button {
                            Task { await coordinator.resendEmailConfirmation(email: pendingEmail) }
                        } label: {
                            Text("인증 이메일 재발송")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(BUColor.auroraNavy)
                                .frame(maxWidth: .infinity, minHeight: 52)
                                .background(
                                    RoundedRectangle(cornerRadius: 15, style: .continuous)
                                        .strokeBorder(BUColor.auroraNavy.opacity(0.45), lineWidth: 1)
                                )
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

                        // 무료 앵커 관리 — 웹 auth/page.tsx 와 동일 문구 (웹·iOS 동시 원칙).
                        //   "영구 무료" 앵커 방지: 가입 순간부터 한시 프로모션으로 기대 설정. 가격 미정이라 금액 없음.
                        Text("지금은 전 기능 무료 프로모션 기간입니다. 정식 운영 후 일부 프리미엄 기능은 유료로 전환될 수 있어요. 입력하신 데이터는 그대로 유지됩니다.")
                            .font(.system(size: 11.5))
                            .foregroundStyle(BUColor.inkMuted.opacity(0.85))
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.top, 2)
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
                        .opacity(isAuthenticating ? 0.6 : 1)
                    }
                    .buttonStyle(PressableButtonStyle())
                    .disabled(isAuthenticating)

                    if let vmsg = validationMessage {
                        Text(vmsg)
                            .font(.system(size: 12.5, weight: .semibold))
                            .foregroundStyle(BUColor.danger)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

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
                resetInfo = "재설정 메일을 보냈습니다. 어느 기기에서든 메일의 「새 비밀번호 설정」 링크를 열어 새 비밀번호를 정한 뒤, 앱으로 돌아와 로그인해 주세요. (Apple 로그인 계정은 메일이 오지 않습니다)"
            } catch {
                resetIsError = true
                resetInfo = "메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요."
            }
        }
    }

    /// 미충족 항목 첫 번째를 사람 말로 — "무반응 버튼" 금지 (2.1(a) 재발 방지)
    private func firstValidationProblem() -> String? {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedEmail.contains("@") { return "이메일 주소를 입력해주세요." }
        if mode == .login {
            if password.isEmpty { return "비밀번호를 입력해주세요." }
            return nil
        }
        if !passwordStrong { return "비밀번호는 8자 이상, 영문과 숫자를 포함해야 해요." }
        if lastName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            || firstName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return "이름(성·이름)을 입력해주세요." }
        let year = Int(birthYearText) ?? 0
        let maxYear = Calendar.current.component(.year, from: Date()) - 14
        if !(year >= 1900 && year <= maxYear) { return "출생연도 4자리를 입력해주세요. (만 14세 이상 가입 가능)" }
        if !agreedToTerms { return "이용약관·개인정보처리방침에 동의해주세요. (버튼 위 스위치)" }
        return nil
    }

    private func submit() {
        guard !isAuthenticating else { return }
        if let problem = firstValidationProblem() {
            validationMessage = problem
            #if canImport(UIKit)
            UINotificationFeedbackGenerator().notificationOccurred(.warning)
            #endif
            return
        }
        validationMessage = nil
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
        VStack(spacing: 0) {
            // Logo mark — 뒤에 은은한 브랜드 글로우 (Aurora 배경 위에서 마크가 떠 보이게)
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [BUColor.midnightBright.opacity(0.22), BUColor.midnightBright.opacity(0.0)],
                            center: .center, startRadius: 6, endRadius: 78
                        )
                    )
                    .frame(width: 156, height: 156)
                FoundOneSpiralLogo(size: 76, color: BUColor.midnightBright)
                    .frame(width: 80, height: 80)
                    .shadow(color: BUColor.midnightBright.opacity(0.28), radius: 18, x: 0, y: 8)
            }
            .padding(.bottom, 2)

            // Wordmark — 공식 로고 서체(FoundOneWordmark). "." 은 마크색 액센트.
            FoundOneWordmark(height: 26, color: BUColor.ink, dotColor: BUColor.midnightBright)
                .padding(.bottom, BUSpacing.lg)

            // 헤드라인 — 부제 한 줄에서 "약속" 두 줄로 격상
            Text("사장님의 하루를\n5초로 정리해 드릴게요")
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(BUColor.ink)
                .multilineTextAlignment(.center)
                .tracking(-0.6)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.bottom, 8)

            Text("창업 준비부터 매출 관리까지, 한 흐름으로")
                .font(.system(size: 13.5, weight: .medium))
                .foregroundStyle(BUColor.inkSecondary)
                .multilineTextAlignment(.center)
                .tracking(-0.2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

// MARK: - Value Propositions (글래스 카드 그리드)

private struct ValuePropositions: View {
    // ⚠️ 총 단계 수를 문구로 박지 않는다 — 사장님이 보는 수는 업종별로 다르다
    //    (오프라인 21 · 온라인 15 · 스타트업 19 · 하드웨어/랩/반도체 23). (2026-08-06)
    // 제목은 모두 2줄로 맞춰 카드 3장의 높이를 균일하게 (한 장만 3줄이면 들쭉날쭉)
    private let items: [(icon: String, title: String, detail: String)] = [
        ("chart.line.uptrend.xyaxis", "매일 30초\n코칭", "어제 매출과\n오늘 할 일 하나"),
        ("bell.badge.fill", "현금 위기\n미리 알림", "통장 부족 예상\n7일 전 푸시"),
        ("map.fill", "업종 맞춤\n로드맵", "내 업종에 필요한\n단계만 골라서"),
    ]

    var body: some View {
        // ⚠️ 카드 높이는 고정(fixedSize) — 이전 Spacer 방식은 부모 세로 공간을 전부 먹어
        //    카드가 화면 절반까지 늘어났다 (2026-08-14 실렌더에서 발견).
        HStack(alignment: .top, spacing: 10) {
            ForEach(Array(items.enumerated()), id: \.offset) { i, item in
                valueCard(icon: item.icon, title: item.title, detail: item.detail)
                    .foEntrance(delay: 0.16 + Double(i) * 0.07)
            }
        }
        .fixedSize(horizontal: false, vertical: true)
    }

    private func valueCard(icon: String, title: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [BUColor.midnight, BUColor.midnightBright],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 34, height: 34)
                    .shadow(color: BUColor.midnight.opacity(0.22), radius: 6, x: 0, y: 3)
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 12.5, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                    .tracking(-0.2)
                    .fixedSize(horizontal: false, vertical: true)
                Text(detail)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(1)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, minHeight: 132, alignment: .topLeading)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white.opacity(0.62))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .strokeBorder(Color.white.opacity(0.75), lineWidth: 0.8)
                )
                .shadow(color: BUColor.midnight.opacity(0.06), radius: 12, x: 0, y: 6)
        )
    }
}

// MARK: - Entrance animation (순차 페이드업)

private struct FoEntranceModifier: ViewModifier {
    let delay: Double
    @State private var shown = false
    func body(content: Content) -> some View {
        content
            .opacity(shown ? 1 : 0)
            .offset(y: shown ? 0 : 10)
            .onAppear {
                withAnimation(.easeOut(duration: 0.55).delay(delay)) { shown = true }
            }
    }
}

private extension View {
    func foEntrance(delay: Double) -> some View { modifier(FoEntranceModifier(delay: delay)) }
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
