//
//  TossRepository.swift — 사장님 Toss Payments PG 자동 동기화
//
//  웹 SSOT:
//   • GET    /api/integrations/toss/status   — 연결 상태 + 최근 30일 이벤트 수
//   • POST   /api/integrations/toss/connect  — Secret Key 등록 (test_sk_... / live_sk_...)
//   • DELETE /api/integrations/toss/connect  — 연결 해제
//
//  보안:
//   - Secret 은 서버에서 AES-256-GCM 봉투 암호화. 평문 미보관.
//   - Read-only. 결제·환불·변경 불가.
//

import Foundation
import Supabase

// MARK: - DTOs

public struct TossStatusResponse: Sendable, Decodable {
    public let ok: Bool
    public let connected: Bool?
    public let maskedSecret: String?
    public let clientKey: String?
    public let status: String?           // "active" | "invalid" | "revoked"
    public let lastValidatedAt: String?
    public let lastSyncAt: String?
    public let lastSyncError: String?
    public let createdAt: String?
    public let eventCount30d: Int?
    public let webhookUrl: String?
    public let error: String?
}

public struct TossConnectRequest: Sendable, Encodable {
    public let apiSecret: String
    public let clientKey: String?

    public init(apiSecret: String, clientKey: String? = nil) {
        self.apiSecret = apiSecret
        self.clientKey = clientKey
    }
}

public struct TossConnectResponse: Sendable, Decodable {
    public let ok: Bool
    public let status: String?
    public let maskedSecret: String?
    public let error: String?
    public let code: String?             // "KEK_MISSING" | "INVALID_FORMAT" 등
}

public struct TossSimpleResponse: Sendable, Decodable {
    public let ok: Bool
    public let error: String?
}

// MARK: - Errors

public enum TossRepositoryError: LocalizedError, Sendable {
    case network(URLError)
    case httpStatus(Int, String?)
    case decoding(String)
    case server(String)
    case unauthenticated

    public var errorDescription: String? {
        switch self {
        case .network(let e):          return "네트워크 오류: \(e.localizedDescription)"
        case .httpStatus(let c, let b): return "서버 오류 (\(c))\(b.map { ": \($0)" } ?? "")"
        case .decoding(let m):         return "응답 해석 실패: \(m)"
        case .server(let m):           return m
        case .unauthenticated:         return "로그인이 필요합니다."
        }
    }
}

// MARK: - Repository

public actor TossRepository {

    private let supabase: SupabaseClient
    private let baseURL: URL
    private let urlSession: URLSession

    public init(
        supabase: SupabaseClient,
        baseURL: URL = URL(string: "https://foundone.dev")!,
        urlSession: URLSession = .shared
    ) {
        self.supabase = supabase
        self.baseURL  = baseURL
        self.urlSession = urlSession
    }

    // MARK: Status

    public func fetchStatus() async throws -> TossStatusResponse {
        var req = URLRequest(url: baseURL.appendingPathComponent("/api/integrations/toss/status"))
        req.httpMethod = "GET"
        req.timeoutInterval = 20
        req.cachePolicy = .reloadIgnoringLocalCacheData
        try await attachAuth(&req)
        return try await perform(req)
    }

    // MARK: Connect

    public func connect(apiSecret: String, clientKey: String? = nil) async throws -> TossConnectResponse {
        let body = TossConnectRequest(apiSecret: apiSecret, clientKey: clientKey)
        let req  = try await jsonRequest(path: "/api/integrations/toss/connect", method: "POST", body: body, timeoutSec: 30)
        return try await perform(req)
    }

    // MARK: Disconnect

    public func disconnect() async throws -> TossSimpleResponse {
        var req = URLRequest(url: baseURL.appendingPathComponent("/api/integrations/toss/connect"))
        req.httpMethod = "DELETE"
        req.timeoutInterval = 20
        try await attachAuth(&req)
        return try await perform(req)
    }

    // MARK: - Helpers

    private func jsonRequest<Body: Encodable>(
        path: String, method: String, body: Body, timeoutSec: TimeInterval
    ) async throws -> URLRequest {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.timeoutInterval = timeoutSec
        try await attachAuth(&req)
        req.httpBody = try JSONEncoder().encode(body)
        return req
    }

    private func attachAuth(_ req: inout URLRequest) async throws {
        let session: Session
        do { session = try await supabase.auth.session }
        catch { throw TossRepositoryError.unauthenticated }
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
    }

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        do { (data, response) = try await urlSession.data(for: request) }
        catch let urlError as URLError { throw TossRepositoryError.network(urlError) }
        catch { throw TossRepositoryError.network(URLError(.unknown)) }
        guard let http = response as? HTTPURLResponse else {
            throw TossRepositoryError.httpStatus(0, nil)
        }
        if http.statusCode >= 500 {
            throw TossRepositoryError.httpStatus(http.statusCode, String(data: data, encoding: .utf8))
        }
        do { return try JSONDecoder().decode(T.self, from: data) }
        catch { throw TossRepositoryError.decoding(error.localizedDescription) }
    }
}
