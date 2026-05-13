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
            state = .authenticated(AuthSession(
                userId: session.user.id,
                email: session.user.email,
                displayName: session.user.userMetadata["display_name"]?.stringValue,
                provider: .email
            ))
        } catch {
            state = .failed(String(describing: error))
        }
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
}
