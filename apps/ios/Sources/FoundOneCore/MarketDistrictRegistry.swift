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

    /// 입력 지역명을 matchKeywords/title 로 매칭 — 점수 높은 순. (웹 loadBestMarketSignal 키워드 매칭 미러)
    public static func match(_ query: String) -> [MarketDistrict] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        guard !q.isEmpty else { return [] }
        let hits = all.filter { d in
            if d.matchKeywords.contains(where: { q.contains($0.lowercased()) || $0.lowercased().contains(q) }) { return true }
            if d.title.ko.lowercased().contains(q) || d.guName.lowercased().contains(q) { return true }
            return false
        }
        return hits.sorted { $0.score > $1.score }
    }
}
