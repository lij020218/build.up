//
//  BUEnvironment.swift — 환경 변수 / Supabase 설정
//
//  실제 키 값은 App target 의 Info.plist 또는 .xcconfig 에서 주입.
//  Swift Package 안에는 절대 commit 하지 않음.
//
//  사장님 셋업 가이드 (README):
//   1. Supabase 대시보드 → Project Settings → API
//   2. URL + anon key 복사
//   3. Xcode App target 의 Info.plist 에 추가:
//      • SUPABASE_URL  = https://xxxxx.supabase.co
//      • SUPABASE_ANON_KEY = eyJhbGc...
//

import Foundation

public struct BUEnvironment: Sendable {

    public let supabaseURL: URL
    public let supabaseAnonKey: String
    public let environment: Environment
    /// AI 로드맵 API 등 웹 앱 엔드포인트 기반 URL.
    /// 개발: http://localhost:3000 | 프로덕션: https://your-domain.com
    public let webAppURL: URL

    public enum Environment: String, Sendable {
        case development
        case staging
        case production
    }

    public init(supabaseURL: URL, supabaseAnonKey: String, environment: Environment, webAppURL: URL) {
        self.supabaseURL = supabaseURL
        self.supabaseAnonKey = supabaseAnonKey
        self.environment = environment
        self.webAppURL = webAppURL
    }

    /// Info.plist 에서 환경 로드. 누락 시 fatalError (실제 빌드에선 반드시 주입 필요).
    public static func loadFromInfoPlist() -> BUEnvironment {
        let info = Bundle.main.infoDictionary ?? [:]

        guard let urlString = info["SUPABASE_URL"] as? String,
              let url = URL(string: urlString) else {
            fatalError("""
            ❌ SUPABASE_URL 누락
               Xcode App target 의 Info.plist 에 SUPABASE_URL 추가 필요.
               예: SUPABASE_URL = https://xxxxx.supabase.co
            """)
        }
        guard let anonKey = info["SUPABASE_ANON_KEY"] as? String, !anonKey.isEmpty else {
            fatalError("""
            ❌ SUPABASE_ANON_KEY 누락
               Xcode App target 의 Info.plist 에 SUPABASE_ANON_KEY 추가 필요.
            """)
        }

        let envString = info["BU_ENVIRONMENT"] as? String ?? "production"
        let env = Environment(rawValue: envString) ?? .production

        // ⚠️ 2026-05-25 fix: Info.plist 누락 시 production 환경 기본값을 Vercel 배포 URL 로.
        //   이전: localhost:3000 — Mac 에서 next dev 안 돌고 있으면 모든 AI 호출 실패.
        let webURLString = info["WEB_APP_URL"] as? String ?? "https://build-up-gamma.vercel.app"
        let webURL = URL(string: webURLString) ?? URL(string: "https://build-up-gamma.vercel.app")!

        return BUEnvironment(supabaseURL: url, supabaseAnonKey: anonKey, environment: env, webAppURL: webURL)
    }

    /// Preview / 단위 테스트 더미 값.
    public static let mockForPreview = BUEnvironment(
        supabaseURL: URL(string: "https://mock.supabase.co")!,
        supabaseAnonKey: "mock-anon-key",
        environment: .development,
        webAppURL: URL(string: "http://localhost:3000")!
    )
}
