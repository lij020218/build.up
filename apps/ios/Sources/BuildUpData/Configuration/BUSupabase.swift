//
//  BUSupabase.swift — SupabaseClient 싱글톤 + 세션 관리
//
//  앱 전체에서 공유되는 단일 SupabaseClient 인스턴스.
//  Auth state 변화를 Observation 으로 노출 → SwiftUI 가 자동 반응.
//
//  사용:
//   @MainActor
//   class AppRoot {
//       let supabase = BUSupabase.shared
//   }
//

import Foundation
import Supabase

#if canImport(UIKit)
import UIKit
#endif

/// 앱 전역 Supabase 인스턴스. Singleton — 환경 변수는 1회 로드.
@MainActor
public final class BUSupabase {

    public static let shared: BUSupabase = {
        let env = BUEnvironment.loadFromInfoPlist()
        return BUSupabase(env: env)
    }()

    /// 단위 테스트 / Preview 용 — 임의 환경으로 생성.
    public static func makeForTest(env: BUEnvironment) -> BUSupabase {
        BUSupabase(env: env)
    }

    public let env: BUEnvironment
    public let client: SupabaseClient

    private init(env: BUEnvironment) {
        self.env = env
        self.client = SupabaseClient(
            supabaseURL: env.supabaseURL,
            supabaseKey: env.supabaseAnonKey
        )
    }

    // MARK: - Auth helpers (Repository 가 직접 .auth 호출하기 좋게 wrapping)

    /// 현재 로그인된 사용자 — 없으면 nil. SwiftUI 에서 sync 사용 가능.
    public var currentUser: User? {
        client.auth.currentUser
    }

    public var currentSession: Session? {
        client.auth.currentSession
    }

    /// AuthStateChange async stream — 로그인/로그아웃 자동 알림.
    /// 사용: `for await change in BUSupabase.shared.authStateChanges { ... }`
    public var authStateChanges: AsyncStream<(event: AuthChangeEvent, session: Session?)> {
        AsyncStream { continuation in
            Task { [weak self] in
                guard let self else { return }
                for await change in self.client.auth.authStateChanges {
                    continuation.yield((change.event, change.session))
                }
                continuation.finish()
            }
        }
    }
}
