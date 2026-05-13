//
//  AuthProvider.swift — 인증 제공자 추상화
//
//  카카오 / Apple / 이메일 등 여러 provider 를 같은 인터페이스로 통일.
//  실제 구현은 KakaoAuthProvider / AppleAuthProvider / EmailAuthProvider 에서.
//

import Foundation
import BuildUpCore

// MARK: - AuthSession

public struct AuthSession: Sendable, Hashable {
    public let userId: UUID
    public let email: String?
    public let displayName: String?
    public let provider: AuthProviderKind

    public init(userId: UUID, email: String? = nil, displayName: String? = nil, provider: AuthProviderKind) {
        self.userId = userId
        self.email = email
        self.displayName = displayName
        self.provider = provider
    }
}

public enum AuthProviderKind: String, Sendable, Codable {
    case kakao
    case apple
    case email
}

// MARK: - Provider protocol

public protocol AuthProvider: Sendable {
    /// 로그인 흐름 시작 — UI 화면 띄움 + 결과 반환.
    func signIn() async throws -> AuthSession

    /// 로그아웃 — provider 측에서도 토큰 폐기.
    func signOut() async throws

    /// 계정 삭제 (Apple 정책 의무).
    func deleteAccount() async throws
}

// MARK: - AuthError

public enum AuthError: LocalizedError, Sendable {
    case cancelledByUser
    case providerMissingCredentials
    case networkFailure(String)
    case kakaoSDKNotInstalled
    case appleSignInFailed(String)
    case supabaseExchangeFailed(String)

    public var errorDescription: String? {
        switch self {
        case .cancelledByUser:           return "로그인이 취소되었습니다."
        case .providerMissingCredentials: return "인증 정보를 확인할 수 없습니다."
        case .networkFailure(let m):     return "네트워크 오류: \(m)"
        case .kakaoSDKNotInstalled:      return "카카오 SDK 가 연결되지 않았습니다. Xcode 에서 Kakao SDK 패키지를 추가해 주세요."
        case .appleSignInFailed(let m):  return "Apple 로그인 실패: \(m)"
        case .supabaseExchangeFailed(let m): return "Supabase 인증 실패: \(m)"
        }
    }
}
