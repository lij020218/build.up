//
//  TossPlaceRepository.swift — 토스 단말기(TOSS Place) 매출 자동 동기화
//
//  웹 SSOT: apps/web/app/lib/components/profile/TossPlaceConnectCard.tsx
//
//  API:
//   • GET  /api/integrations/tossplace/status     — 연결 상태 + 최근 30일 결제 수
//   • POST /api/integrations/tossplace/connect    — Access Key + Secret + merchantId 등록
//   • POST /api/integrations/tossplace/sync       — 결제 데이터 동기화
//   • POST /api/integrations/tossplace/disconnect — 연결 해제
//
//  발급 경로: developer.tossplace.com → 앱 등록 → Access Key + Secret (1회 표시)
//

import Foundation
import Supabase

// MARK: - DTOs

public struct TossPlaceStatusResponse: Sendable, Decodable {
    public let ok: Bool
    public let connected: Bool?
    public let merchantId: String?
    public let accessKeyMask: String?
    public let status: String?
    public let lastSyncAt: String?
    public let lastSyncError: String?
    public let paymentCount30d: Int?
    public let error: String?
}

public struct TossPlaceConnectRequest: Sendable, Encodable {
    public let accessKey: String
    public let accessSecret: String
    public let merchantId: String

    public init(accessKey: String, accessSecret: String, merchantId: String) {
        self.accessKey    = accessKey
        self.accessSecret = accessSecret
        self.merchantId   = merchantId
    }
}

public struct TossPlaceConnectResponse: Sendable, Decodable {
    public let ok: Bool
    public let status: String?
    public let maskedKey: String?
    public let error: String?
    public let code: String?
}

public struct TossPlaceSyncResponse: Sendable, Decodable {
    public let ok: Bool
    public let fetched: Int?
    public let upserted: Int?
    public let error: String?
}

public struct TossPlaceSimpleResponse: Sendable, Decodable {
    public let ok: Bool
    public let error: String?
}

// MARK: - Errors

public enum TossPlaceRepositoryError: LocalizedError, Sendable {
    case network(URLError)
    case httpStatus(Int, String?)
    case decoding(String)
    case server(String)
    case unauthenticated

    public var errorDescription: String? {
        switch self {
        case .network(let e):           return "네트워크 오류: \(e.localizedDescription)"
        case .httpStatus(let c, let b): return "서버 오류 (\(c))\(b.map { ": \($0)" } ?? "")"
        case .decoding(let m):          return "응답 해석 실패: \(m)"
        case .server(let m):            return m
        case .unauthenticated:          return "로그인이 필요합니다."
        }
    }
}

// MARK: - Repository

public actor TossPlaceRepository {

    private let supabase: SupabaseClient
    private let baseURL: URL
    private let urlSession: URLSession

    public init(
        supabase: SupabaseClient,
        baseURL: URL = URL(string: "https://build-up-gamma.vercel.app")!,
        urlSession: URLSession = .shared
    ) {
        self.supabase   = supabase
        self.baseURL    = baseURL
        self.urlSession = urlSession
    }

    // MARK: Status

    public func fetchStatus() async throws -> TossPlaceStatusResponse {
        var req = URLRequest(url: baseURL.appendingPathComponent("/api/integrations/tossplace/status"))
        req.httpMethod   = "GET"
        req.timeoutInterval = 20
        req.cachePolicy  = .reloadIgnoringLocalCacheData
        try await attachAuth(&req)
        return try await perform(req)
    }

    // MARK: Connect

    public func connect(accessKey: String, accessSecret: String, merchantId: String) async throws -> TossPlaceConnectResponse {
        let body = TossPlaceConnectRequest(accessKey: accessKey, accessSecret: accessSecret, merchantId: merchantId)
        let req  = try await jsonRequest(path: "/api/integrations/tossplace/connect", method: "POST", body: body, timeoutSec: 30)
        return try await perform(req)
    }

    // MARK: Sync

    public func sync(fullBackfill: Bool = false) async throws -> TossPlaceSyncResponse {
        struct SyncBody: Encodable { let fullBackfill: Bool }
        let req = try await jsonRequest(path: "/api/integrations/tossplace/sync", method: "POST", body: SyncBody(fullBackfill: fullBackfill), timeoutSec: 60)
        return try await perform(req)
    }

    // MARK: Disconnect

    public func disconnect() async throws -> TossPlaceSimpleResponse {
        var req = URLRequest(url: baseURL.appendingPathComponent("/api/integrations/tossplace/disconnect"))
        req.httpMethod = "POST"
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
        catch { throw TossPlaceRepositoryError.unauthenticated }
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
    }

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        do { (data, response) = try await urlSession.data(for: request) }
        catch let urlError as URLError { throw TossPlaceRepositoryError.network(urlError) }
        catch { throw TossPlaceRepositoryError.network(URLError(.unknown)) }
        guard let http = response as? HTTPURLResponse else {
            throw TossPlaceRepositoryError.httpStatus(0, nil)
        }
        if http.statusCode >= 500 {
            throw TossPlaceRepositoryError.httpStatus(http.statusCode, String(data: data, encoding: .utf8))
        }
        do { return try JSONDecoder().decode(T.self, from: data) }
        catch { throw TossPlaceRepositoryError.decoding(error.localizedDescription) }
    }
}
