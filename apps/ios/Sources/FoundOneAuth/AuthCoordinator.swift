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
            ]
            if let year = birthYear {
                metadata["birth_year"] = .string(String(year))
            }

            let response = try await supabase.auth.signUp(
                email: email,
                password: password,
                data: metadata
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
            try await supabase.auth.resend(email: email, type: .signup)
        } catch {
            state = .failed(Self.authErrorMessage(error))
        }
    }

    /// 비밀번호 재설정 메일 발송.
    /// redirect 를 앱 커스텀 스킴(foundone://auth/reset)으로 보내, 같은 기기에서 메일 링크를 열면
    /// 앱이 다시 열리고 앱 안에서 새 비밀번호를 설정한다. (PKCE — verifier 가 이 기기에 저장돼 있어야 함)
    public func sendPasswordReset(email: String) async throws {
        let redirect = URL(string: "foundone://auth/reset")
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
            // 만료/위변조/다른 기기 등 — 화면은 띄우되 에러를 보여 재요청을 안내.
            recoveryError = "링크가 만료되었거나 유효하지 않습니다. 비밀번호 재설정을 다시 요청해 주세요."
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

    public func deleteAccount() async {
        let provider = currentSession?.provider
        do {
            // 1. 서버에서 데이터 + auth 계정 완전 삭제 (토큰 유효한 동안 먼저).
            try await deleteAccountOnServer()
            // 2. 로컬 세션 정리 (provider 별 signOut — 서버에서 이미 계정 삭제됨).
            switch provider {
            case .apple: try? await appleProvider.signOut()
            case .kakao: try? await kakaoProvider.signOut()
            default:     try? await supabase.auth.signOut()
            }
            // 서버 삭제에 더해 로컬 캐시도 전면 제거.
            LocalDataWipe.wipeAllLocalUserData()
            state = .unauthenticated
        } catch {
            state = .failed("계정 삭제 실패: \(error.localizedDescription)")
        }
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
        if raw.lowercased().contains("network") || raw.lowercased().contains("fetch") {
            return "네트워크 연결을 확인해 주세요."
        }
        return raw
    }
}

private struct BusinessProfileBootstrapDTO: Encodable, Sendable {
    let user_id: UUID
}
