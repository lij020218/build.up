//
//  AuthCoordinator.swift — 앱 전체 인증 상태 관리
//
//  @Observable — SwiftUI 가 로그인/로그아웃 자동 반응.
//  카카오 + Apple + 이메일 provider 통합 — 호출 측은 provider 종류만 선택.
//

import Foundation
import Observation
import Supabase
import FoundOneCore
import FoundOneData

@MainActor
@Observable
public final class AuthCoordinator {

    public enum State: Sendable {
        case unauthenticated
        case authenticating
        case authenticated(AuthSession)
        case needsEmailConfirmation(String)  // pending email address
        case failed(String)
    }

    public private(set) var state: State = .unauthenticated

    // MARK: - 비밀번호 재설정 (앱 네이티브 흐름)
    //
    // 메일 링크(foundone://auth/reset?code=…)가 앱을 다시 열면 onOpenURL →
    // handlePasswordRecoveryURL → PKCE code 교환으로 복구 세션 생성 →
    // isPasswordRecovery=true → AppRoot 가 ResetPasswordView(앱 내 새 비번 화면) 표시.
    // 웹과 동일한 안내·흐름이되, 완료는 앱 안에서 이뤄진다.

    /// 메일 링크로 진입해 새 비밀번호 입력 화면을 띄워야 하는 상태.
    public private(set) var isPasswordRecovery: Bool = false
    /// 코드 교환 실패 등 복구 진입 자체가 실패한 경우의 메시지(있으면 화면이 에러를 표시).
    public private(set) var recoveryError: String?

    public var currentSession: AuthSession? {
        if case .authenticated(let session) = state { return session }
        return nil
    }

    public var isAuthenticated: Bool {
        if case .authenticated = state { return true }
        return false
    }

    private let supabase: SupabaseClient
    private let appleProvider: AppleAuthProvider
    private let kakaoProvider: KakaoAuthProvider

    public init(supabase: SupabaseClient) {
        self.supabase = supabase
        self.appleProvider = AppleAuthProvider(supabase: supabase)
        // isAvailable=false (Kakao SDK 미연결) — 사장님 키 받고 활성화
        self.kakaoProvider = KakaoAuthProvider(supabase: supabase, isAvailable: false)

        // 기존 세션 복원
        restoreSessionIfPresent()
    }

    private func restoreSessionIfPresent() {
        if let user = supabase.auth.currentUser {
            let provider: AuthProviderKind = {
                if let raw = user.appMetadata["provider"]?.stringValue,
                   let kind = AuthProviderKind(rawValue: raw) {
                    return kind
                }
                return .email
            }()
            self.state = .authenticated(AuthSession(
                userId: user.id,
                email: user.email,
                displayName: user.userMetadata["display_name"]?.stringValue,
                provider: provider
            ))
        }
    }

    // MARK: - Sign in flows

    public func signInWithApple() async {
        state = .authenticating
        do {
            let session = try await appleProvider.signIn()
            // 삭제 시 Apple revoke 용 refresh_token 확보 — 실패해도 로그인엔 영향 없음(best-effort)
            if let code = session.appleAuthorizationCode { Task.detached { await Self.linkAppleAuthorizationCode(code) } }
            // ⚠️ 2026-06-05: 이메일 경로와 동일하게 워크스페이스 부트스트랩(business_profiles 행 보장).
            //   누락 시 OAuth 신규 사용자는 role/profile 미초기화로 웹·앱 정합성이 비대칭이 됨.
            try? await bootstrapAccountWorkspace(for: session.userId)
            state = .authenticated(session)
        } catch {
            state = .failed((error as? (any LocalizedError))?.errorDescription ?? String(describing: error))
        }
    }

    public func signInWithKakao() async {
        state = .authenticating
        do {
            let session = try await kakaoProvider.signIn()
            try? await bootstrapAccountWorkspace(for: session.userId)   // 이메일 경로와 동일 보장
            state = .authenticated(session)
        } catch {
            state = .failed((error as? (any LocalizedError))?.errorDescription ?? String(describing: error))
        }
    }

    public func signInWithEmail(email: String, password: String) async {
        state = .authenticating
        do {
            let session = try await supabase.auth.signIn(email: email, password: password)
            try await bootstrapAccountWorkspace(for: session.user.id)
            state = .authenticated(AuthSession(
                userId: session.user.id,
                email: session.user.email,
                displayName: Self.displayName(from: session.user),
                provider: .email
            ))
        } catch {
            // 미인증 계정 로그인 → 에러 텍스트가 아니라 인증 대기 화면(재발송 포함)으로.
            //   (2026-07-28 사장님 피드백, 웹 handleLogin 미러)
            let raw = String(describing: error).lowercased()
            if raw.contains("not confirmed") || raw.contains("email_not_confirmed") {
                state = .needsEmailConfirmation(email)
                return
            }
            state = .failed(Self.authErrorMessage(error))
        }
    }

    public func signUpWithEmail(
        firstName: String,
        lastName: String,
        birthYear: Int?,
        email: String,
        password: String
    ) async {
        state = .authenticating
        do {
            let displayName = "\(lastName)\(firstName)".trimmingCharacters(in: .whitespaces)
            var metadata: [String: AnyJSON] = [
                "first_name": .string(firstName),
                "last_name": .string(lastName),
                "name": .string(displayName),
                // 가입 플랫폼 — Supabase 인증 메일 템플릿이 {{ .Data.signup_platform }} 를 보고
                //   링크에 from=ios 를 붙여, 웹 콜백이 "앱으로 돌아가 로그인" 안내를 보여준다 (재발송에도 유지).
                "signup_platform": .string("ios"),
            ]
            if let year = birthYear {
                metadata["birth_year"] = .string(String(year))
            }

            // redirectTo — 인증 메일 링크가 웹 콜백(flow=confirm)으로 가도록. 미지정 시 Site URL
            //   루트로 떨어져 "인증 완료" 안내 없이 랜딩만 보인다 (웹 emailRedirectTo 미러).
            let response = try await supabase.auth.signUp(
                email: email,
                password: password,
                data: metadata,
                redirectTo: URL(string: "\(BUSupabase.shared.env.webAppURL.absoluteString)/auth/callback?flow=confirm&from=ios")
            )

            guard let session = response.session else {
                // Email confirmation required — normal expected flow
                state = .needsEmailConfirmation(email)
                return
            }

            try await bootstrapAccountWorkspace(for: session.user.id)
            state = .authenticated(AuthSession(
                userId: session.user.id,
                email: session.user.email,
                displayName: Self.displayName(from: session.user),
                provider: .email
            ))
        } catch {
            state = .failed(Self.authErrorMessage(error))
        }
    }

    public func resendEmailConfirmation(email: String) async {
        do {
            // 재발송도 첫 가입 메일과 같은 콜백(flow=confirm)으로 — 미지정 시 Site URL 루트로 떨어져
            //   "회원가입 완료" 안내 없이 랜딩만 보였다 (웹 resendConfirmationEmail 과 동일하게, 2026-08-14).
            try await supabase.auth.resend(
                email: email,
                type: .signup,
                emailRedirectTo: URL(string: "\(BUSupabase.shared.env.webAppURL.absoluteString)/auth/callback?flow=confirm&from=ios")
            )
        } catch {
            state = .failed(Self.authErrorMessage(error))
        }
    }

    /// 비밀번호 재설정 메일 발송.
    /// 2026-08-14: 링크를 웹 콜백으로 통일. Supabase 메일 템플릿이 token_hash 방식이라
    /// **어느 기기·브라우저에서 열어도** 웹에서 새 비밀번호를 정할 수 있다(사장님 실사용: 노트북 요청→
    /// 데스크탑 클릭 실패 → 수정). 종전 foundone:// 딥링크는 PKCE verifier 가 이 폰에만 있어 같은 폰에서만 됐다.
    /// handlePasswordRecoveryURL(딥링크 수신)은 하위호환으로 유지.
    public func sendPasswordReset(email: String) async throws {
        let redirect = URL(string: "\(BUSupabase.shared.env.webAppURL.absoluteString)/auth/callback?type=recovery")
        try await supabase.auth.resetPasswordForEmail(email, redirectTo: redirect)
    }

    /// 메일 링크(foundone://auth/reset?code=…)로 앱이 열렸을 때 호출.
    /// PKCE code 를 교환해 복구 세션을 만들고, 새 비밀번호 입력 화면을 띄운다.
    public func handlePasswordRecoveryURL(_ url: URL) async {
        recoveryError = nil
        do {
            _ = try await supabase.auth.session(from: url)
            // 복구 세션 확보 — 새 비밀번호 화면 표시. (자동 로그인 분기로 새지 않도록
            //  state 는 아직 .unauthenticated 로 두고, 화면이 cover 로 덮는다.)
            isPasswordRecovery = true
        } catch {
            // 실패 원인은 만료뿐 아니라 *다른 기기에서 링크를 연 경우*(PKCE 검증자가 요청 기기에만
            //  있어 교차기기 시 실패)도 흔하다. 둘 다 포괄해 정확히 안내한다(이전: "만료"로만 오표기).
            recoveryError = "링크가 만료되었거나, 재설정을 요청한 기기와 다른 기기에서 열렸을 수 있어요. "
                + "요청한 기기에서 메일 링크를 다시 열거나, 비밀번호 재설정을 다시 요청해 주세요."
            isPasswordRecovery = true
        }
    }

    /// 복구 세션 상태에서 새 비밀번호로 변경.
    public func updatePassword(_ newPassword: String) async throws {
        _ = try await supabase.auth.update(user: UserAttributes(password: newPassword))
    }

    /// 비밀번호 변경 성공 후 — 복구 세션을 그대로 로그인 상태로 승격하고 화면을 닫는다.
    public func completePasswordRecovery() {
        isPasswordRecovery = false
        recoveryError = nil
        restoreSessionIfPresent()
    }

    /// 사용자가 새 비밀번호 화면을 취소 — 복구 세션을 정리하고 로그인 화면으로 돌아간다.
    public func cancelPasswordRecovery() async {
        isPasswordRecovery = false
        recoveryError = nil
        try? await supabase.auth.signOut()
        state = .unauthenticated
    }

    public func cancelSignup() {
        state = .unauthenticated
    }

    public func signOut() async {
        // 현재 provider 에 맞게 sign out.
        // 원격 signOut 은 best-effort — 네트워크 실패해도 사용자는 로그아웃 의도이므로
        //   로컬 데이터/세션은 *반드시* 정리하고 비인증 상태로 전환한다(이전: catch 에서
        //   wipe·상태전환을 건너뛰어 데이터가 남고 로그인 상태로 보이던 버그).
        let provider = currentSession?.provider
        do {
            switch provider {
            case .apple: try await appleProvider.signOut()
            case .kakao: try await kakaoProvider.signOut()
            default:     try await supabase.auth.signOut()
            }
        } catch {
            // 원격 실패 무시 — 로컬 정리는 아래에서 보장.
        }
        // 로컬 사용자 데이터 전면 제거 — cross-account 누출 방지(공용기기에서 다음 사용자 보호).
        LocalDataWipe.wipeAllLocalUserData()
        state = .unauthenticated
    }

    /// 세션 만료·토큰 refresh 실패·외부(다른 기기) 로그아웃을 감지했을 때 호출.
    /// 로컬 데이터를 정리하고 비인증 상태로 전환 → UI 가 로그인 화면으로 재렌더된다.
    /// 이미 비인증이면 no-op (초기 nil 세션 이벤트로 인한 오작동 방지).
    public func handleSessionLost() {
        guard isAuthenticated else { return }
        LocalDataWipe.wipeAllLocalUserData()
        state = .unauthenticated
    }

    /// 계정 삭제 실패 메시지 — 서버 삭제가 실패하면 세션은 그대로(.authenticated) 두고 이 값만 채운다.
    ///   ProfileView 가 alert 로 표시하고 확인 시 clearDeleteError(). (2026-08-19: 종전엔 state=.failed 로
    ///   전환해 로그인 화면으로 튕기면서도 서버 데이터는 남는, 거짓 실패 화면이었다.)
    public private(set) var deleteError: String?

    public func clearDeleteError() { deleteError = nil }

    /// 계정 삭제. 성공 시에만 signOut + LocalDataWipe + .unauthenticated. 실패 시 세션 유지 + deleteError.
    /// - Returns: 성공 여부
    @discardableResult
    public func deleteAccount() async -> Bool {
        let provider = currentSession?.provider
        deleteError = nil
        do {
            // 1. 서버에서 데이터 + auth 계정 완전 삭제 (토큰 유효한 동안 먼저).
            try await deleteAccountOnServer()
        } catch {
            // 서버 실패 — 계정·세션·로컬 데이터 모두 그대로. 화면은 로그인 상태 유지 + 에러 alert.
            deleteError = "계정 삭제에 실패했어요. 계정과 데이터는 그대로 남아 있습니다.\n\n\(error.localizedDescription)"
            return false
        }
        // 2. 로컬 세션 정리 (provider 별 signOut — 서버에서 이미 계정 삭제됨).
        switch provider {
        case .apple: try? await appleProvider.signOut()
        case .kakao: try? await kakaoProvider.signOut()
        default:     try? await supabase.auth.signOut()
        }
        // 서버 삭제에 더해 로컬 캐시도 전면 제거.
        LocalDataWipe.wipeAllLocalUserData()
        state = .unauthenticated
        return true
    }

    /// POST /api/account/apple-link { authorizationCode } — 서버가 Apple refresh_token 교환·암호화 보관.
    ///   App Store 5.1.1(v): 계정 삭제 시 Apple 토큰 revoke 필수. 서버 미설정이면 { skipped } 로 무해.
    nonisolated private static func linkAppleAuthorizationCode(_ code: String) async {
        guard let token = await BUSupabase.shared.client.auth.currentSession?.accessToken else { return }
        let base = await BUSupabase.shared.env.webAppURL
        var req = URLRequest(url: base.appendingPathComponent("/api/account/apple-link"), timeoutInterval: 15)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["authorizationCode": code])
        _ = try? await URLSession.shared.data(for: req)
    }

    /// 웹 API `/api/account/delete` 호출 — 데이터 + auth 계정 본체 삭제.
    /// 개인정보처리방침 "계정 삭제" 권리 + Apple 5.1.1(v) 충족.
    private func deleteAccountOnServer() async throws {
        let token = try await supabase.auth.session.accessToken
        let base = BUSupabase.shared.env.webAppURL
        let url = base.appendingPathComponent("api/account/delete")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.timeoutInterval = 30
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            let body = String(data: data, encoding: .utf8) ?? ""
            throw AuthError.networkFailure("계정 삭제 서버 오류 (\((resp as? HTTPURLResponse)?.statusCode ?? -1)): \(body)")
        }
    }

    private func bootstrapAccountWorkspace(for userId: UUID) async throws {
        try await supabase
            .from("business_profiles")
            .upsert(BusinessProfileBootstrapDTO(user_id: userId), onConflict: "user_id")
            .execute()
    }

    private static func displayName(from user: User) -> String? {
        user.userMetadata["name"]?.stringValue
        ?? user.userMetadata["display_name"]?.stringValue
        ?? user.userMetadata["full_name"]?.stringValue
    }

    private static func authErrorMessage(_ error: any Error) -> String {
        let raw = String(describing: error)
        if raw.lowercased().contains("invalid login credentials") {
            return "이메일 또는 비밀번호가 올바르지 않습니다."
        }
        if raw.lowercased().contains("already registered") || raw.lowercased().contains("already exists") {
            return "이미 가입된 이메일입니다. 로그인으로 전환해 주세요."
        }
        if raw.lowercased().contains("not confirmed") {
            return "이메일 인증이 필요합니다. 받은 편지함을 확인해 주세요."
        }
        if raw.lowercased().contains("network") || raw.lowercased().contains("fetch") {
            return "네트워크 연결을 확인해 주세요."
        }
        return raw
    }
}

private struct BusinessProfileBootstrapDTO: Encodable, Sendable {
    let user_id: UUID
}
