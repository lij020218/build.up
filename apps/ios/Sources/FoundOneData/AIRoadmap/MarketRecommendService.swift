//
//  MarketRecommendService.swift — AI 상권 추천 라이브 데이터 (웹 패리티)
//
//  웹 API: POST /api/data/market-recommend  (Kakao Local + Claude 점수화)
//  요청: { region, categoryId, subIndustryId?, capital?, language }
//  응답: { ok, items: [{ id, title, score, summary, reasons[], warnings[] }], centerLat, centerLng }
//
//  웹 SSOT: apps/web/app/lib/components/stages/selection/LocationCandidatesStage.tsx
//    (requestAiMarketRecommend) — iOS 가 동일 엔드포인트 호출해 113개 상권/AI 추천을 미러.
//

import Foundation
import Supabase

public struct MarketScoredItem: Decodable, Sendable, Identifiable, Hashable {
    public let id: String
    public let title: String
    public let score: Int
    public let summary: String
    public let reasons: [String]
    public let warnings: [String]
}

public struct MarketRecommendInput: Encodable, Sendable {
    public let region: String
    public let categoryId: String
    public let subIndustryId: String?
    public let capital: Int?
    public let language: String

    public init(region: String, categoryId: String, subIndustryId: String? = nil, capital: Int? = nil, language: String = "ko") {
        self.region = region
        self.categoryId = categoryId
        self.subIndustryId = subIndustryId
        self.capital = capital
        self.language = language
    }
}

public actor MarketRecommendService {

    private let webAppURL: URL
    private let supabaseClient: SupabaseClient

    public init(webAppURL: URL, supabaseClient: SupabaseClient) {
        self.webAppURL = webAppURL
        self.supabaseClient = supabaseClient
    }

    /// 편의 초기화 — 공유 싱글톤 사용. (BUSupabase.shared 가 @MainActor 라 메인에서 생성)
    @MainActor
    public static func shared() -> MarketRecommendService {
        MarketRecommendService(webAppURL: BUSupabase.shared.env.webAppURL, supabaseClient: BUSupabase.shared.client)
    }

    private struct Response: Decodable {
        let ok: Bool
        let items: [MarketScoredItem]?
        let error: String?
    }

    public func recommend(_ input: MarketRecommendInput) async throws -> [MarketScoredItem] {
        let endpoint = webAppURL.appendingPathComponent("/api/data/market-recommend")
        var request = URLRequest(url: endpoint, timeoutInterval: 60)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = supabaseClient.auth.currentSession?.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = try JSONEncoder().encode(input)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw AIRoadmapError.networkError("응답을 받을 수 없습니다.")
        }
        let decoded = try? JSONDecoder().decode(Response.self, from: data)
        if http.statusCode == 200, let decoded, decoded.ok, let items = decoded.items {
            return items
        }
        throw AIRoadmapError.apiError(decoded?.error ?? "상권 추천 오류 (\(http.statusCode))")
    }
}
