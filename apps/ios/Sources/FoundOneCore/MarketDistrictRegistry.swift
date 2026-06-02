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

    /// 한 번에 보여줄 최대 상권 후보 수 (대형 상권 비교 UX).
    public static let maxMatches = 6

    /// 입력 지역명 매칭 → 상권 후보 목록(점수 높은 순).
    ///
    /// ⚠️ 단순 키워드 매칭만 하면 "강남역" 처럼 특정 역명을 입력했을 때 그 키워드를 가진
    ///   상권 1개만 잡혀(예: gangnam-station), 강남 같은 대형 상권이 1곳만 보이는 문제가 있었다.
    ///   실제 데이터엔 강남구 7곳(강남역·삼성코엑스·역삼·신사가로수·압구정·고속터미널·대치) 처럼
    ///   비교할 상권이 충분하다 → **직접 매칭 + 같은 구(區) 형제 상권 확장**으로 후보를 넓힌다.
    ///   (웹 라이브 Kakao 반경 sub-area 발굴과 동일 정신.)
    public static func match(_ query: String) -> [MarketDistrict] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return [] }

        // 1) 직접 매칭 — 키워드 / 제목 / 구 이름.
        let direct = all.filter { d in
            if d.matchKeywords.contains(where: { q.contains($0.lowercased()) || $0.lowercased().contains(q) }) { return true }
            if d.title.ko.lowercased().contains(q) || d.guName.lowercased().contains(q) { return true }
            return false
        }
        guard !direct.isEmpty else { return [] }

        // 2) 같은 구(區)의 형제 상권으로 확장 — 대형 상권은 인근 후보를 함께 비교.
        let directIds = Set(direct.map(\.id))
        let gus = Set(direct.map(\.guName))
        let siblings = all.filter { gus.contains($0.guName) && !directIds.contains($0.id) }

        // 검색 지역(직접 매칭) 우선 → 그다음 형제. 각 그룹 내 점수 내림차순. 최대 maxMatches.
        let ordered = direct.sorted { $0.score > $1.score } + siblings.sorted { $0.score > $1.score }
        return Array(ordered.prefix(maxMatches))
    }
}
