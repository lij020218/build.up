//
//  AuthCoordinator.swift — 앱 전체 인증 상태 관리
//
//  @Observable — SwiftUI 가 로그인/로그아웃 자동 반응.
//  카카오 + Apple + 이메일 provider 통합 — 호출 측은 provider 종류만 선택.
//

import Foundation
import Observation
import Supabase
import BuildUpCore
import BuildUpData

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
            state = .authenticated(session)
        } catch {
            state = .failed((error as? (any LocalizedError))?.errorDescription ?? String(describing: error))
        }
    }

    public func signInWithKakao() async {
        state = .authenticating
        do {
            let session = try await kakaoProvider.signIn()
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

    public func cancelSignup() {
        state = .unauthenticated
    }

    public func signOut() async {
        // 현재 provider 에 맞게 sign out
        let provider = currentSession?.provider
        do {
            switch provider {
            case .apple: try await appleProvider.signOut()
            case .kakao: try await kakaoProvider.signOut()
            default:     try await supabase.auth.signOut()
            }
            state = .unauthenticated
        } catch {
            state = .failed("로그아웃 실패: \(error.localizedDescription)")
        }
    }

    public func deleteAccount() async {
        let provider = currentSession?.provider
        do {
            switch provider {
            case .apple: try await appleProvider.deleteAccount()
            case .kakao: try await kakaoProvider.deleteAccount()
            default:     try await supabase.auth.signOut()
            }
            state = .unauthenticated
        } catch {
            state = .failed("계정 삭제 실패: \(error.localizedDescription)")
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
