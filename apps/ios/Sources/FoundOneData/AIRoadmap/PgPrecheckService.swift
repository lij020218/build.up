//
//  PgPrecheckService.swift — PG 입점심사 사전 검사 (iOS).
//
//  웹 SSOT: apps/web/app/api/compliance/pg-precheck/route.ts (@foundone/shared runPgPrecheck).
//  사이트 URL → 서버가 https·SSRF 가드 후 HTML 을 받아 규칙 검사 → 항목별 통과/미달·반려 문구.
//  ContractAnalysisService 와 같은 호출 패턴(webAppURL + Supabase Bearer).
//

import Foundation
import Supabase

public struct PgPrecheckItem: Decodable, Sendable, Hashable, Identifiable {
    public let id: String
    public let label: String
    public let severity: String   // reject | warn | info
    public let status: String     // pass | fail | warn | info
    public let evidence: String?
    public let rejectAs: String
    public let fix: String
}

public struct PgPrecheckResult: Decodable, Sendable, Hashable {
    public let url: String
    public let items: [PgPrecheckItem]
    public let rejectRiskCount: Int
    public let warnCount: Int
    public let spaSuspect: Bool
    public let textLength: Int
    public let appOnlyNote: String
}

public enum PgPrecheckError: Error, LocalizedError {
    case network(String)
    case api(String)
    public var errorDescription: String? {
        switch self {
        case let .network(m): return m
        case let .api(m): return m
        }
    }
}

public actor PgPrecheckService {
    private let webAppURL: URL
    private let supabaseClient: SupabaseClient

    public init(webAppURL: URL, supabaseClient: SupabaseClient) {
        self.webAppURL = webAppURL
        self.supabaseClient = supabaseClient
    }

    @MainActor
    public static func shared() -> PgPrecheckService {
        PgPrecheckService(webAppURL: BUSupabase.shared.env.webAppURL, supabaseClient: BUSupabase.shared.client)
    }

    private struct RequestBody: Encodable { let url: String }
    private struct Envelope: Decodable {
        let ok: Bool
        let error: String?
        let result: PgPrecheckResult?
    }

    public func check(url siteURL: String) async throws -> PgPrecheckResult {
        let endpoint = webAppURL.appendingPathComponent("/api/compliance/pg-precheck")
        var request = URLRequest(url: endpoint, timeoutInterval: 30)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token = supabaseClient.auth.currentSession?.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = try JSONEncoder().encode(RequestBody(url: siteURL))

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw PgPrecheckError.network("네트워크 오류 — 잠시 후 다시 시도해 주세요.")
        }
        guard response is HTTPURLResponse else { throw PgPrecheckError.network("응답을 받을 수 없습니다.") }
        let env = try JSONDecoder().decode(Envelope.self, from: data)
        guard env.ok, let result = env.result else {
            throw PgPrecheckError.api(env.error ?? "검사에 실패했습니다.")
        }
        return result
    }
}
