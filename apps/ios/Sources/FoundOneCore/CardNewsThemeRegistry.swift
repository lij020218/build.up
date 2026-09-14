//
//  CardNewsThemeRegistry.swift — 카드뉴스 테마(JSON) 디코드 + 조회.
//
//  웹 SSOT: packages/shared/src/marketing/cardnews-themes.ts
//  생성:    scripts/gen-marketing-cardnews-json.mts → cardnews-themes.json (Resources 심볼릭 링크)
//
//  색 토큰을 Swift 로 손미러하지 않는 이유: 웹과 iOS 가 같은 기능으로 **다른 색 결과물**을 내보내면
//  사장님 계정 하나에서 만든 카드가 기기마다 달라진다. 토큰은 shared 한 곳에만 둔다.
//  (동기화 가드: apps/web/__tests__/cardnews-themes-ios-sync.test.ts)
//
//  이 파일은 순수 데이터(Decodable) — SwiftUI 비의존. Color 변환은 Features 레이어에서.
//

import Foundation

public struct BUCardNewsTheme: Decodable, Sendable, Hashable, Identifiable {
    public struct Localized: Decodable, Sendable, Hashable {
        public let ko: String
        public let en: String
    }
    public let id: String
    public let label: Localized
    public let hint: Localized
    /// 표지 그라데이션 (좌상 → 우하)
    public let coverFrom: String
    public let coverTo: String
    /// 본문 카드 배경
    public let bodyBg: String
    /// 본문 진한 글자색
    public let ink: String
    /// 강조색 — highlight 단어·번호·페이지 도트
    public let accent: String
    /// 어두운 배경 위 강조색 (표지 highlight)
    public let accentOnDark: String
    /// 마지막(로고) 장 배경
    public let ctaBg: String
}

public enum CardNewsThemeRegistry {

    private struct Payload: Decodable {
        let themes: [BUCardNewsTheme]
        let defaultThemeId: String
        let defaultByCategory: [String: String]
    }

    private static let payload: Payload? = load()

    /// 선택 가능한 테마 목록(웹 칩 순서와 동일).
    public static var themes: [BUCardNewsTheme] { payload?.themes ?? [] }

    /// 테마 조회 — 모르는 id 는 기본 테마. 목록이 비면 nil.
    public static func resolve(_ id: String?) -> BUCardNewsTheme? {
        guard let payload else { return nil }
        if let id, let hit = payload.themes.first(where: { $0.id == id }) { return hit }
        return payload.themes.first(where: { $0.id == payload.defaultThemeId }) ?? payload.themes.first
    }

    /// 업종 기본 테마 id — 웹 defaultThemeForCategory 와 같은 표를 쓴다.
    public static func defaultThemeId(categoryId: String?) -> String {
        guard let payload else { return "midnight" }
        if let categoryId, let hit = payload.defaultByCategory[categoryId] { return hit }
        return payload.defaultThemeId
    }

    private static func load() -> Payload? {
        guard let url = Bundle.module.url(forResource: "cardnews-themes", withExtension: "json") else {
            print("⚠️ cardnews-themes.json 번들 누락")
            return nil
        }
        do {
            return try JSONDecoder().decode(Payload.self, from: try Data(contentsOf: url))
        } catch {
            print("⚠️ cardnews-themes.json 디코딩 실패: \(error)")
            return nil
        }
    }
}
