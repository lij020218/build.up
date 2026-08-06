//
//  InspirationQuotesTests.swift — "오늘의 영감" 로더 검증
//
//  웹 SSOT: packages/shared/src/inspiration-quotes.ts
//  가드 목적: 번들 리소스 디코딩 실패(문장이 통째로 사라짐)와
//            날짜 순환 공식이 웹과 어긋나는 것(두 플랫폼이 다른 말)을 막는다.
//

import Testing
import Foundation
@testable import FoundOneCore

@Suite("BUInspiration")
struct InspirationQuotesTests {

    @Test("번들 JSON 이 디코딩되고 30개 이상이다")
    func loads() {
        #expect(BUInspiration.all.count >= 30)
    }

    @Test("모든 문장에 저자·출처·출처 URL 이 있다 (출처 없는 인용 금지)")
    func allSourced() {
        let bad = BUInspiration.all.filter {
            $0.author.isEmpty || $0.source.isEmpty || !$0.sourceUrl.hasPrefix("http")
        }
        #expect(bad.isEmpty)
    }

    @Test("같은 날이면 같은 문장, 다음 날이면 다른 문장 (KST 자정 기준)")
    func rotatesDaily() {
        // 2026-08-06 10:00 KST / 같은 날 23:59 KST / 다음 날 00:01 KST
        let morning = Date(timeIntervalSince1970: 1_785_978_000)      // 2026-08-06T10:00+09:00
        let lateNight = morning.addingTimeInterval(13 * 3600 + 59 * 60)
        let nextDay = morning.addingTimeInterval(14 * 3600 + 1 * 60)

        #expect(BUInspiration.forDate(morning)?.id == BUInspiration.forDate(lateNight)?.id)
        #expect(BUInspiration.forDate(nextDay)?.id != BUInspiration.forDate(morning)?.id)
    }

    @Test("종전 출처 불명 문장이 남아 있지 않다")
    func noUnsourcedLegacyQuote() {
        #expect(!BUInspiration.all.contains { $0.text.contains("가장 중요한 한 가지를 정하고") })
    }
}
