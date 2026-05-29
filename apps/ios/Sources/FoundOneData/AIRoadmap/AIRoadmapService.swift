//
//  AIRoadmapService.swift — AI 로드맵 생성 API 호출
//
//  웹 API: POST /api/ai/roadmap/generate
//  Pass 1 (Claude) + Pass 2 (풀 매칭) 총 30~70초 소요.
//  타임아웃은 넉넉하게 120초 설정 (Vercel Pro maxDuration=120 과 동일).
//

import Foundation
import Supabase

public actor AIRoadmapService {

    private let webAppURL: URL
    private let supabaseClient: SupabaseClient

    public init(webAppURL: URL, supabaseClient: SupabaseClient) {
        self.webAppURL = webAppURL
        self.supabaseClient = supabaseClient
    }

    public func generate(input: AIRoadmapInput) async throws -> AIRoadmapResult {
        let endpoint = webAppURL.appendingPathComponent("/api/ai/roadmap/generate")

        var request = URLRequest(url: endpoint, timeoutInterval: 120)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Supabase 세션 토큰 주입
        if let token = supabaseClient.auth.currentSession?.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(input)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse else {
            throw AIRoadmapError.networkError("응답을 받을 수 없습니다.")
        }

        if http.statusCode == 200 {
            let decoder = JSONDecoder()
            do {
                return try decoder.decode(AIRoadmapResult.self, from: data)
            } catch {
                throw AIRoadmapError.decodingError(error.localizedDescription)
            }
        } else {
            let decoder = JSONDecoder()
            if let apiError = try? decoder.decode(AIRoadmapAPIError.self, from: data) {
                throw AIRoadmapError.apiError(apiError.error)
            }
            throw AIRoadmapError.apiError("오류 코드: \(http.statusCode)")
        }
    }
}

// MARK: - Errors

public enum AIRoadmapError: LocalizedError, Sendable {
    case networkError(String)
    case apiError(String)
    case decodingError(String)

    public var errorDescription: String? {
        switch self {
        case .networkError(let msg): return "네트워크 오류: \(msg)"
        case .apiError(let msg):     return msg
        case .decodingError(let msg): return "데이터 파싱 오류: \(msg)"
        }
    }
}
