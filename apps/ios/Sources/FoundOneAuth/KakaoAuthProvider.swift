//
//  KakaoAuthProvider.swift — 카카오 로그인 + Supabase 브릿지 (스텁)
//
//  실제 작동을 위해서는 다음이 필요:
//   1. 사장님이 Kakao Developers (developers.kakao.com) 에서 앱 등록
//   2. Native App Key 발급
//   3. Package.swift dependencies 에 추가:
//      .package(url: "https://github.com/kakao/kakao-ios-sdk", from: "2.23.0")
//   4. FoundOneAuth target dependencies 에:
//      .product(name: "KakaoSDKUser", package: "kakao-ios-sdk")
//      .product(name: "KakaoSDKAuth", package: "kakao-ios-sdk")
//   5. App target Info.plist 에 LSApplicationQueriesSchemes / URL types 추가
//   6. App lifecycle 에서 KakaoSDK.initSDK(appKey:) 호출
//
//  본 파일은 인터페이스만 정의 + Supabase 브릿지 청사진 제공.
//

import Foundation
import Supabase
import FoundOneCore
import FoundOneData

@MainActor
public final class KakaoAuthProvider: AuthProvider, @unchecked Sendable {

    private let supabase: SupabaseClient
    public let isAvailable: Bool

    public init(supabase: SupabaseClient, isAvailable: Bool = false) {
        self.supabase = supabase
        // 실제 KakaoSDK 가 link 되면 true 로 (런타임 #if canImport(KakaoSDKAuth) 분기)
        self.isAvailable = isAvailable
    }

    public func signIn() async throws -> AuthSession {
        guard isAvailable else {
            throw AuthError.kakaoSDKNotInstalled
        }

        // ─────────────────────────────────────────────────────────────────
        // 실제 구현 시 아래 패턴 사용 (KakaoSDK import 후):
        //
        //   import KakaoSDKAuth
        //   import KakaoSDKUser
        //
        //   let oauthToken: OAuthToken = try await withCheckedThrowingContinuation { cont in
        //       if UserApi.isKakaoTalkLoginAvailable() {
        //           UserApi.shared.loginWithKakaoTalk { token, error in
        //               if let e = error { cont.resume(throwing: e) }
        //               else if let t = token { cont.resume(returning: t) }
        //           }
        //       } else {
        //           UserApi.shared.loginWithKakaoAccount { token, error in ... }
        //       }
        //   }
        //
        //   let idToken = oauthToken.idToken ?? oauthToken.accessToken
        //   let session = try await supabase.auth.signInWithIdToken(
        //       credentials: .init(provider: .kakao, idToken: idToken)
        //   )
        //   return AuthSession(
        //       userId: session.user.id,
        //       email: session.user.email,
        //       displayName: /* UserApi.shared.me() 로 조회 */,
        //       provider: .kakao
        //   )
        // ─────────────────────────────────────────────────────────────────

        throw AuthError.kakaoSDKNotInstalled
    }

    public func signOut() async throws {
        try await supabase.auth.signOut()
        // 실제 구현: UserApi.shared.logout { error in ... }
    }

    public func deleteAccount() async throws {
        // Apple 정책 + Kakao 정책: 가게 데이터 + auth.users 삭제
        // 1. KakaoSDK: UserApi.shared.unlink (앱 연결 해제 — Kakao 정책 의무)
        // 2. Supabase Edge Function: delete-user-account
        try await signOut()
    }
}
