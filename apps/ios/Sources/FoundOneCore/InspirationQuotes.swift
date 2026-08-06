//
//  InspirationQuotes.swift — "오늘의 영감" 명언 로더 (웹 SSOT codegen)
//
//  웹 SSOT: packages/shared/src/inspiration-quotes.ts
//  데이터:  Resources/inspiration-quotes.json (packages/shared/src 심볼릭 링크 — 수동 편집 금지)
//  생성:    npx tsx scripts/gen-inspiration-quotes-json.mts
//
//  종전에는 출처 불명 문장 하나가 하드코딩돼 매일 같은 말만 나왔다 (2026-08-06 교체).
//  수록 문장은 전부 1차 출처(책·연설 원고·본인 에세이·공식 홈페이지)가 확인된 것만이다.
//

import Foundation

public struct BUInspirationQuote: Decodable, Sendable, Hashable, Identifiable {
    public let id: String
    /// 화면에 보여줄 한국어 문장
    public let text: String
    /// 원문 (한국어 원문이면 nil)
    public let original: String?
    public let author: String
    /// 출처 표기 (책·연설 + 연도)
    public let source: String
    /// 1차 출처 URL
    public let sourceUrl: String
}

public enum BUInspiration {

    private struct Root: Decodable { let quotes: [BUInspirationQuote] }

    public static let all: [BUInspirationQuote] = {
        guard let url = Bundle.module.url(forResource: "inspiration-quotes", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let root = try? JSONDecoder().decode(Root.self, from: data)
        else { return [] }
        return root.quotes
    }()

    /// KST 자정 기준 "그날의" 명언 — 웹 inspirationForDate 와 같은 식이라 두 플랫폼이 같은 문장을 보여준다.
    public static func forDate(_ date: Date = Date()) -> BUInspirationQuote? {
        guard !all.isEmpty else { return nil }
        let kstMs = date.timeIntervalSince1970 * 1000 + 9 * 60 * 60 * 1000
        let dayNumber = Int(floor(kstMs / 86_400_000))
        let count = all.count
        let idx = ((dayNumber % count) + count) % count
        return all[idx]
    }
}
