//
//  MarketDistrictRegistry.swift — 서울 113개 상권 정적 DB (웹 SSOT 미러)
//
//  웹 SSOT: packages/shared/src/market/seoul-districts.ts (seoulMarketDistricts)
//  데이터: Resources/seoul-districts.json — 위 파일 심볼릭 링크.
//    입력 지역명을 matchKeywords 로 매칭해 풍부한 상권 카드(점수·요약·메타) 제공.
//    AI 라이브 추천(market-recommend)과 별개로 즉시·오프라인 동작.
//

import Foundation

public struct MarketDistrict: Decodable, Sendable, Identifiable, Hashable {
    public struct Localized: Decodable, Sendable, Hashable { public let ko: String; public let en: String }
    public struct Meta: Decodable, Sendable, Hashable {
        public let districtName: String
        public let rentBand: String          // low|mid|mid-high|high
        public let competitionLevel: String  // low|mid|high
        public let customerFit: String
        public let footTraffic: String       // mid|high|very-high
        public let growthTrend: String        // stable|rising|declining
        public let marketStyle: String
    }
    public let id: String
    public let guName: String
    public let matchKeywords: [String]
    public let title: Localized
    public let score: Int
    public let summary: Localized
    public let meta: Meta
}

public enum MarketDistrictRegistry {

    public static let all: [MarketDistrict] = {
        guard let url = Bundle.module.url(forResource: "seoul-districts", withExtension: "json") else {
            #if DEBUG
            print("⚠️ seoul-districts.json 번들 누락")
            #endif
            return []
        }
        do { return try JSONDecoder().decode([MarketDistrict].self, from: try Data(contentsOf: url)) }
        catch {
            #if DEBUG
            print("⚠️ seoul-districts.json 디코딩 실패: \(error)")
            #endif
            return []
        }
    }()

    /// 입력 지역명 매칭 → 상권 후보 목록.
    ///
    /// ⚠️ **웹 SSOT `findMatchingDistricts`(packages/shared/src/market/seoul-districts.ts) 1:1 포팅.**
    ///   웹·앱 결과가 반드시 동일해야 함 → 알고리즘·정렬·cap 을 그대로 미러한다(임의 변형 금지).
    ///   단순 키워드 매칭은 "강남역"이 1곳만 잡히던 문제 → 웹과 동일하게 정확매칭(≥3) → 같은 구 →
    ///   fuzzy → 인근 구 보충 → 구 추출 fallback. 강남역 → 강남구 7곳(점수순) 반환.
    public static func match(_ regionInput: String) -> [MarketDistrict] {
        // 웹: regionInput.trim().replace(/\s+/g, "") — 공백 전부 제거. 소문자화 안 함(한글).
        let q = regionInput.components(separatedBy: .whitespacesAndNewlines).joined()
        guard !q.isEmpty else { return [] }
        let byScore: (MarketDistrict, MarketDistrict) -> Bool = { $0.score > $1.score }

        // 1. 정확 키워드 매칭
        let exact = all.filter { d in d.matchKeywords.contains { q.contains($0) || $0.contains(q) } }
        if exact.count >= 3 { return exact.sorted(by: byScore) }

        // 2. 같은 구(區)로 매칭됐고 3개 미만이면 그 구 전체
        if let matchedGu = exact.first?.guName {
            let guResults = all.filter { $0.guName == matchedGu }.sorted(by: byScore)
            if guResults.count >= 3 { return guResults }
        }

        // 3. fuzzy — 부분 키워드 / 구 이름 / 제목
        let fuzzy = all.filter { d in
            d.matchKeywords.contains { $0.contains(q) || q.contains($0) }
                || d.guName.contains(q) || d.title.ko.contains(q)
        }
        if fuzzy.count >= 3 { return fuzzy.sorted(by: byScore) }

        // 4. 그래도 3개 미만이면 인근 구(점수 상위) 보충
        if !exact.isEmpty || !fuzzy.isEmpty {
            let base = !exact.isEmpty ? exact : fuzzy
            let baseGus = Set(base.map(\.guName))
            let supplement = all.filter { !baseGus.contains($0.guName) }
                .sorted(by: byScore)
                .prefix(max(0, 3 - base.count))
            return (base + supplement).sorted(by: byScore)
        }

        // 5. 입력에서 "○○구" 추출 → 그 구 전체
        if let r = q.range(of: "[가-힣]+구", options: .regularExpression) {
            let guName = String(q[r])
            let guResults = all.filter { $0.guName == guName || $0.guName.contains(guName) }.sorted(by: byScore)
            if !guResults.isEmpty { return guResults }
        }

        // 5b. 동(洞) 이름 기반 구 추정: "장위" → "장위동" 등
        let dongBase = String(q.filter { !"동로가".contains($0) })
        if let guFromDong = all.first(where: { d in
            d.matchKeywords.contains { kw in
                let kwBase = String(kw.filter { !"동로가역".contains($0) })
                return dongBase.count >= 2 && kwBase.count >= 2
                    && (dongBase == kwBase || dongBase.contains(kwBase) || kwBase.contains(dongBase))
            }
        }) {
            let guResults = all.filter { $0.guName == guFromDong.guName }.sorted(by: byScore)
            if !guResults.isEmpty { return guResults }
        }

        // 5c. 최후 fallback: 임대료 낮은(접근성↑) 순 → 점수 순, 상위 3개
        let rentOrder: [String: Int] = ["low": 0, "mid-low": 1, "mid": 2, "mid-high": 3, "high": 4]
        return Array(all.sorted { a, b in
            let ra = rentOrder[a.meta.rentBand] ?? 2
            let rb = rentOrder[b.meta.rentBand] ?? 2
            return ra != rb ? ra < rb : a.score > b.score
        }.prefix(3))
    }
}
