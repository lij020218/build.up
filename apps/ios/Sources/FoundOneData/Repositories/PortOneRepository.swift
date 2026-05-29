//
//  PortOneRepository.swift — 사장님 포트원 V2 결제 자동 동기화
//
//  웹 SSOT: apps/web/app/lib/components/profile/PortOneConnectCard.tsx
//
//  API:
//   • GET  /api/integrations/portone/status      — 연결 상태 + 30일 결제 건수
//   • POST /api/integrations/portone/connect     — API Secret 검증 + 봉투 암호화 저장
//   • POST /api/integrations/portone/sync        — 결제 데이터 동기화 (full 백필 옵션)
//   • POST /api/integrations/portone/disconnect  — 연결 해제 (Secret 폐기)
//
//  보안 약속:
//   - Secret 은 AES-256-GCM 봉투 암호화 (서버 측에서). 평문은 디스크/로그 어디에도 없음.
//   - Read-only — PortOneClient (서버) 가 GET 만 호출 가능. 결제·환불·변경 불가.
//   - 사장님 1클릭 disconnect.
//

import Foundation
import Supabase

// MARK: - DTOs

public struct PortOneStatusResponse: Sendable, Decodable {
    public let ok: Bool
    public let connected: Bool?
    public let storeId: String?
    public let maskedSecret: String?
    /// "active" | "invalid" | "revoked"
    public let status: String?
    public let lastValidatedAt: String?
    public let lastSyncAt: String?
    public let lastSyncError: String?
    public let createdAt: String?
    public let paymentCount30d: Int?
    public let error: String?
}

public struct PortOneConnectRequest: Sendable, Encodable {
    public let apiSecret: String
    public let storeId: String?

    public init(apiSecret: String, storeId: String? = nil) {
        self.apiSecret = apiSecret
        self.storeId = storeId
    }
}

public struct PortOneConnectResponse: Sendable, Decodable {
    public let ok: Bool
    public let status: String?     // "active"
    public let maskedSecret: String?
    public let error: String?
    public let code: String?       // "KEK_MISSING" 등
}

public struct PortOneSyncResponse: Sendable, Decodable {
    public let ok: Bool
    public let fetched: Int?
    public let upserted: Int?
    public let error: String?
}

public struct PortOneSimpleResponse: Sendable, Decodable {
    public let ok: Bool
    public let error: String?
}

// MARK: - Errors

public enum PortOneRepositoryError: LocalizedError, Sendable {
    case network(URLError)
    case httpStatus(Int, String?)
    case decoding(String)
    case server(String)
    case unauthenticated

    public var errorDescription: String? {
        switch self {
        case .network(let e): return "네트워크 오류: \(e.localizedDescription)"
        case .httpStatus(let code, let body): return "서버 오류 (\(code))\(body.map { ": \($0)" } ?? "")"
        case .decoding(let msg): return "응답 해석 실패: \(msg)"
        case .server(let msg): return msg
        case .unauthenticated: return "로그인이 필요합니다."
        }
    }
}

// MARK: - Repository

public actor PortOneRepository {

    private let supabase: SupabaseClient
    private let baseURL: URL
    private let urlSession: URLSession

    public init(
        supabase: SupabaseClient,
        baseURL: URL = URL(string: "https://build-up-gamma.vercel.app")!,
        urlSession: URLSession = .shared
    ) {
        self.supabase = supabase
        self.baseURL = baseURL
        self.urlSession = urlSession
    }

    // MARK: Status

    public func fetchStatus() async throws -> PortOneStatusResponse {
        var req = URLRequest(url: baseURL.appendingPathComponent("/api/integrations/portone/status"))
        req.httpMethod = "GET"
        req.timeoutInterval = 20
        req.cachePolicy = .reloadIgnoringLocalCacheData
        try await attachAuth(&req)
        return try await perform(req)
    }

    // MARK: Connect

    /// API Secret 을 검증 + 저장. 분당 5회 server rate limit.
    /// - Throws: PortOneRepositoryError.server(msg) — 검증 실패·KEK 미설정 등
    public func connect(apiSecret: String, storeId: String? = nil) async throws -> PortOneConnectResponse {
        let body = PortOneConnectRequest(apiSecret: apiSecret, storeId: storeId)
        let req = try await jsonRequest(
            path: "/api/integrations/portone/connect",
            method: "POST",
            body: body,
            timeoutSec: 30
        )
        return try await perform(req)
    }

    // MARK: Sync

    /// 결제 데이터 동기화. fullBackfill=true 면 30일 전체, false 면 마지막 동기화 이후 증분.
    public func sync(fullBackfill: Bool = false) async throws -> PortOneSyncResponse {
        struct SyncBody: Encodable { let fullBackfill: Bool }
        let req = try await jsonRequest(
            path: "/api/integrations/portone/sync",
            method: "POST",
            body: SyncBody(fullBackfill: fullBackfill),
            timeoutSec: 60
        )
        return try await perform(req)
    }

    // MARK: Disconnect

    public func disconnect() async throws -> PortOneSimpleResponse {
        var req = URLRequest(url: baseURL.appendingPathComponent("/api/integrations/portone/disconnect"))
        req.httpMethod = "POST"
        req.timeoutInterval = 20
        try await attachAuth(&req)
        return try await perform(req)
    }

    // MARK: - Helpers

    private func jsonRequest<Body: Encodable>(
        path: String,
        method: String,
        body: Body,
        timeoutSec: TimeInterval
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
        do {
            session = try await supabase.auth.session
        } catch {
            throw PortOneRepositoryError.unauthenticated
        }
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
    }

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await urlSession.data(for: request)
        } catch let urlError as URLError {
            throw PortOneRepositoryError.network(urlError)
        } catch {
            throw PortOneRepositoryError.network(URLError(.unknown))
        }
        guard let http = response as? HTTPURLResponse else {
            throw PortOneRepositoryError.httpStatus(0, nil)
        }
        // 5xx 만 raw 에러. 4xx 는 server 가 JSON ok:false 로 반환 → decode 시도.
        if http.statusCode >= 500 {
            let bodyStr = String(data: data, encoding: .utf8)
            throw PortOneRepositoryError.httpStatus(http.statusCode, bodyStr)
        }
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw PortOneRepositoryError.decoding(error.localizedDescription)
        }
    }
}
