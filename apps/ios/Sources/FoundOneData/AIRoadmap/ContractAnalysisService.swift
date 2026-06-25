//
//  ContractAnalysisService.swift — 계약서 AI 분석 (iOS).
//
//  웹 SSOT: apps/web/app/api/ai/contract/analyze/route.ts (@foundone/ai analyzeContract).
//  계약서 원문 → 위험조항·누락항목·특이조건·다음행동 분석. web↔iOS 동일 기능(contract-review 마무리).
//

import Foundation
import Supabase

/// 웹 ContractAnalysisResult(@foundone/ai) 미러 — JSON 1:1.
public struct ContractClause: Decodable, Sendable, Hashable {
    public let excerpt: String
    public let issue: String
    public let severity: String   // "warning" | "danger"
}

public struct ContractAnalysisResult: Decodable, Sendable, Hashable {
    public let riskLevel: String  // "low" | "medium" | "high" | "critical"
    public let flaggedClauses: [ContractClause]
    public let missingItems: [String]
    public let unusualTerms: [String]
    public let summary: String
    public let nextActions: [String]
}

public enum ContractAnalysisError: Error, LocalizedError {
    case network(String)
    case api(String)

    public var errorDescription: String? {
        switch self {
        case let .network(m): return m
        case let .api(m): return m
        }
    }
}

public actor ContractAnalysisService {

    private let webAppURL: URL
    private let supabaseClient: SupabaseClient

    public init(webAppURL: URL, supabaseClient: SupabaseClient) {
        self.webAppURL = webAppURL
        self.supabaseClient = supabaseClient
    }

    /// 편의 초기화 — 공유 싱글톤(메인에서 생성).
    @MainActor
    public static func shared() -> ContractAnalysisService {
        ContractAnalysisService(webAppURL: BUSupabase.shared.env.webAppURL, supabaseClient: BUSupabase.shared.client)
    }

    private struct RequestBody: Encodable {
        let contractText: String
        let contractType: String
    }
    private struct ErrorBody: Decodable { let error: String? }

    public func analyze(_ contractText: String) async throws -> ContractAnalysisResult {
        let endpoint = webAppURL.appendingPathComponent("/api/ai/contract/analyze")
        var request = URLRequest(url: endpoint, timeoutInterval: 90)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token = supabaseClient.auth.currentSession?.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = try JSONEncoder().encode(RequestBody(contractText: contractText, contractType: "commercial_lease"))

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw ContractAnalysisError.network("네트워크 오류 — 잠시 후 다시 시도해 주세요.")
        }
        guard let http = response as? HTTPURLResponse else {
            throw ContractAnalysisError.network("응답을 받을 수 없습니다.")
        }
        guard (200...299).contains(http.statusCode) else {
            let msg = (try? JSONDecoder().decode(ErrorBody.self, from: data))?.error
            throw ContractAnalysisError.api(msg ?? "계약서 분석 오류 (\(http.statusCode))")
        }
        do {
            return try JSONDecoder().decode(ContractAnalysisResult.self, from: data)
        } catch {
            throw ContractAnalysisError.api("AI 응답을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.")
        }
    }
}
