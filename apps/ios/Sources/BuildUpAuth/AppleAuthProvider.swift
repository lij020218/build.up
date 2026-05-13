//
//  AppleAuthProvider.swift — Apple Sign In + Supabase 브릿지
//
//  Apple 정책: 카카오/Google 등 3rd-party 로그인 있으면 Apple 도 필수 제공.
//  AuthenticationServices.framework 사용 — Apple 표준.
//
//  흐름:
//   1. SignInWithAppleButton 누름
//   2. ASAuthorization 얻음 → identityToken (JWT)
//   3. Supabase 의 signInWithIdToken(provider: .apple, idToken:) 호출
//   4. AuthSession 반환
//

import Foundation
import AuthenticationServices
import CryptoKit
import Supabase
import BuildUpCore
import BuildUpData

#if canImport(UIKit)
import UIKit
#endif

@MainActor
public final class AppleAuthProvider: NSObject, AuthProvider, @unchecked Sendable {

    private let supabase: SupabaseClient
    private var pendingContinuation: CheckedContinuation<AuthSession, any Error>?
    private var pendingNonce: String?

    public init(supabase: SupabaseClient) {
        self.supabase = supabase
    }

    public func signIn() async throws -> AuthSession {

        try await withCheckedThrowingContinuation { [weak self] (continuation: CheckedContinuation<AuthSession, any Error>) in
            guard let self else {
                continuation.resume(throwing: AuthError.appleSignInFailed("Provider deallocated"))
                return
            }

            let nonce = Self.randomNonce()
            self.pendingNonce = nonce
            self.pendingContinuation = continuation

            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.fullName, .email]
            request.nonce = Self.sha256(nonce)

            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }

    public func signOut() async throws {
        try await supabase.auth.signOut()
    }

    public func deleteAccount() async throws {
        // 1. Supabase 의 user 삭제는 RPC 또는 admin API 통해서만 가능
        //    → app side 에서는 sign out 후 안내. 실제 삭제는 backend Edge Function.
        try await signOut()
        // TODO: Supabase Edge Function `delete-user-account` 호출 추가
    }

    // MARK: - Helpers

    /// Apple identity token nonce — 무작위 32바이트.
    private static func randomNonce(length: Int = 32) -> String {
        precondition(length > 0)
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remaining = length
        while remaining > 0 {
            let randoms: [UInt8] = (0..<16).map { _ in UInt8.random(in: 0...255) }
            for r in randoms where remaining > 0 {
                if r < charset.count {
                    result.append(charset[Int(r)])
                    remaining -= 1
                }
            }
        }
        return result
    }

    private static func sha256(_ input: String) -> String {
        let data = Data(input.utf8)
        let digest = SHA256.hash(data: data)
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}

// MARK: - ASAuthorizationControllerDelegate

extension AppleAuthProvider: ASAuthorizationControllerDelegate {

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {

        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            pendingContinuation?.resume(throwing: AuthError.providerMissingCredentials)
            pendingContinuation = nil
            return
        }

        guard let idTokenData = credential.identityToken,
              let idToken = String(data: idTokenData, encoding: .utf8) else {
            pendingContinuation?.resume(throwing: AuthError.providerMissingCredentials)
            pendingContinuation = nil
            return
        }

        let nonce = pendingNonce
        let continuation = pendingContinuation
        let supabase = self.supabase

        // 이름 조합
        let displayName: String? = {
            let givenName = credential.fullName?.givenName ?? ""
            let familyName = credential.fullName?.familyName ?? ""
            let combined = "\(familyName)\(givenName)".trimmingCharacters(in: .whitespaces)
            return combined.isEmpty ? nil : combined
        }()
        let email = credential.email

        Task { @MainActor in
            do {
                let session = try await supabase.auth.signInWithIdToken(
                    credentials: .init(provider: .apple, idToken: idToken, nonce: nonce)
                )
                let authSession = AuthSession(
                    userId: session.user.id,
                    email: email ?? session.user.email,
                    displayName: displayName,
                    provider: .apple
                )
                continuation?.resume(returning: authSession)
            } catch {
                continuation?.resume(throwing: AuthError.supabaseExchangeFailed(String(describing: error)))
            }
        }
        pendingContinuation = nil
        pendingNonce = nil
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: any Error) {
        let nsError = error as NSError
        if nsError.code == ASAuthorizationError.canceled.rawValue {
            pendingContinuation?.resume(throwing: AuthError.cancelledByUser)
        } else {
            pendingContinuation?.resume(throwing: AuthError.appleSignInFailed(error.localizedDescription))
        }
        pendingContinuation = nil
        pendingNonce = nil
    }
}

// MARK: - ASAuthorizationControllerPresentationContextProviding

extension AppleAuthProvider: ASAuthorizationControllerPresentationContextProviding {
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        #if canImport(UIKit)
        // 키 윈도우 반환 — iOS 15+ active scene
        if let scene = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first(where: { $0.activationState == .foregroundActive }) {
            return scene.windows.first { $0.isKeyWindow } ?? UIWindow()
        }
        return UIWindow()
        #else
        return ASPresentationAnchor()
        #endif
    }
}
