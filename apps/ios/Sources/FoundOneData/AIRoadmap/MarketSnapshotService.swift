//
//  MarketSnapshotService.swift — 지역 실측 스냅샷 (LLM 무관, 웹 패리티 2026-08-03)
//
//  웹 API: POST /api/data/market-snapshot
//  지역 입력(디바운스)만으로 소진공 경쟁·프랜차이즈 실측·행안부 인구·부동산원 임대/공실·
//  자체 추이를 자동 표시. 축별 nil = 실측 없음 (클라이언트는 그 축 미표시 — 위조 금지).
//
//  웹 SSOT: apps/web/app/api/data/market-snapshot/route.ts + MarketSnapshotPanel.tsx
//

import Foundation
import Supabase

public struct MarketSnapshotAxes: Decodable, Sendable, Hashable {
    public let competition: String?
    public let competitionMap: String?
    public let franchise: String?
    public let population: String?
    public let rent: String?
    public let trend: String?
    public let brandRegional: String?

    /// 표시용 (아이콘, 라인) — nil 축 제외, 웹 AXIS_ORDER 미러
    public var displayLines: [String] {
        var lines: [String] = []
        if let v = competition { lines.append("🏪 " + v) }
        if let v = competitionMap { lines.append("🗺️ " + v) }
        if let v = franchise { lines.append("🏢 " + v) }
        if let v = population { lines.append("👥 " + v) }
        if let v = rent { lines.append("💰 " + v) }
        if let v = trend { lines.append("📈 " + v) }
        if let v = brandRegional { lines.append("🗾 " + v) }
        return lines
    }
}

public actor MarketSnapshotService {

    private let webAppURL: URL
    private let supabaseClient: SupabaseClient

    public init(webAppURL: URL, supabaseClient: SupabaseClient) {
        self.webAppURL = webAppURL
        self.supabaseClient = supabaseClient
    }

    @MainActor
    public static func shared() -> MarketSnapshotService {
        MarketSnapshotService(webAppURL: BUSupabase.shared.env.webAppURL, supabaseClient: BUSupabase.shared.client)
    }

    private struct Body: Encodable {
        let region: String
        let categoryId: String
        let subIndustryId: String?
        let franchiseBrandId: String?
    }
    private struct Response: Decodable {
        struct Snapshot: Decodable { let axes: MarketSnapshotAxes }
        let ok: Bool
        let snapshot: Snapshot?
        let error: String?
    }

    /// 실패는 nil — 스냅샷은 보조 정보라 실패 화면을 만들지 않는다 (조용히 생략).
    public func fetch(region: String, categoryId: String, subIndustryId: String?, franchiseBrandId: String?) async -> MarketSnapshotAxes? {
        guard region.count >= 2 else { return nil }
        let endpoint = webAppURL.appendingPathComponent("/api/data/market-snapshot")
        var request = URLRequest(url: endpoint, timeoutInterval: 20)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        guard let token = supabaseClient.auth.currentSession?.accessToken else { return nil }
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        guard let body = try? JSONEncoder().encode(Body(region: region, categoryId: categoryId, subIndustryId: subIndustryId, franchiseBrandId: franchiseBrandId)) else { return nil }
        request.httpBody = body
        guard let (data, response) = try? await URLSession.shared.data(for: request),
              let http = response as? HTTPURLResponse, http.statusCode == 200,
              let decoded = try? JSONDecoder().decode(Response.self, from: data),
              decoded.ok else { return nil }
        return decoded.snapshot?.axes
    }
}
