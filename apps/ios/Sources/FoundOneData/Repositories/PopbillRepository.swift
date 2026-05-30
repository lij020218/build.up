//
//  PopbillRepository.swift — 홈택스 세금계산서·현금영수증 자동 수집 (Popbill 경유)
//
//  웹 SSOT: apps/web/app/lib/components/profile/PopbillConnectCard.tsx
//
//  API:
//   • GET  /api/integrations/popbill/status   — 연결 상태 + 30일 통계
//   • POST /api/integrations/popbill/connect  — 사업자번호 등록 (팝빌 회원사 여부 확인)
//   • POST /api/integrations/popbill/sync     — 세금계산서·현금영수증 수집
//
//  비용 정책: POPBILL_NOT_CONFIGURED(503) 반환 시 "곧 활성화" 친절 메시지.
//            사용자 100명+ & 가치 입증 후 서버 환경변수 활성화.
//

import Foundation
import Supabase

// MARK: - DTOs

public struct PopbillConnectionInfo: Sendable, Decodable {
    public let status: String?                   // "not_connected" | "pending" | "active" | "invalid" | "revoked"
    public let businessNumberMask: String?
    public let businessName: String?
    public let hometaxCertRegistered: Bool?
    public let lastSyncAt: String?
    public let lastSyncError: String?
}

public struct PopbillStats30d: Sendable, Decodable {
    public struct Entry: Sendable, Decodable {
        public let count: Int
        public let amount: Int
    }
    public let taxinvoiceSell: Entry?
    public let taxinvoiceBuy: Entry?
    public let cashbill: Entry?
}

public struct PopbillStatusResponse: Sendable, Decodable {
    public let ok: Bool
    public let connection: PopbillConnectionInfo?
    public let stats30d: PopbillStats30d?
    public let error: String?
}

public struct PopbillConnectRequest: Sendable, Encodable {
    public let businessNumber: String
    public let businessName: String?

    public init(businessNumber: String, businessName: String? = nil) {
        self.businessNumber = businessNumber
        self.businessName   = businessName
    }
}

public struct PopbillConnectResponse: Sendable, Decodable {
    public let ok: Bool
    public let status: String?
    public let isMember: Bool?
    public let nextStep: String?
    public let error: String?
    public let code: String?             // "POPBILL_NOT_CONFIGURED" 등
}

public struct PopbillSyncSummaryItem: Sendable, Decodable {
    public let docType: String
    public let collected: Int
}

public struct PopbillSyncResponse: Sendable, Decodable {
    public let ok: Bool
    public let summary: [PopbillSyncSummaryItem]?
    public let error: String?
    public let code: String?
}

// MARK: - Errors

public enum PopbillRepositoryError: LocalizedError, Sendable {
    case network(URLError)
    case httpStatus(Int, String?)
    case decoding(String)
    case server(String)
    case notConfigured
    case unauthenticated

    public var errorDescription: String? {
        switch self {
        case .network(let e):           return "네트워크 오류: \(e.localizedDescription)"
        case .httpStatus(let c, let b): return "서버 오류 (\(c))\(b.map { ": \($0)" } ?? "")"
        case .decoding(let m):          return "응답 해석 실패: \(m)"
        case .server(let m):            return m
        case .notConfigured:            return "이 기능은 곧 활성화됩니다. 잠시 후 다시 시도해 주세요."
        case .unauthenticated:          return "로그인이 필요합니다."
        }
    }
}

// MARK: - Repository

public actor PopbillRepository {

    private let supabase: SupabaseClient
    private let baseURL: URL
    private let urlSession: URLSession

    public init(
        supabase: SupabaseClient,
        baseURL: URL = URL(string: "https://foundone.dev")!,
        urlSession: URLSession = .shared
    ) {
        self.supabase   = supabase
        self.baseURL    = baseURL
        self.urlSession = urlSession
    }

    // MARK: Status

    public func fetchStatus() async throws -> PopbillStatusResponse {
        var req = URLRequest(url: baseURL.appendingPathComponent("/api/integrations/popbill/status"))
        req.httpMethod   = "GET"
        req.timeoutInterval = 20
        req.cachePolicy  = .reloadIgnoringLocalCacheData
        try await attachAuth(&req)
        return try await perform(req)
    }

    // MARK: Connect

    public func connect(businessNumber: String, businessName: String? = nil) async throws -> PopbillConnectResponse {
        let body = PopbillConnectRequest(businessNumber: businessNumber, businessName: businessName)
        let req  = try await jsonRequest(path: "/api/integrations/popbill/connect", method: "POST", body: body, timeoutSec: 30)
        return try await perform(req)
    }

    // MARK: Sync

    public func sync(fromDays: Int = 30) async throws -> PopbillSyncResponse {
        struct SyncBody: Encodable { let fromDays: Int }
        let req = try await jsonRequest(path: "/api/integrations/popbill/sync", method: "POST", body: SyncBody(fromDays: fromDays), timeoutSec: 60)
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
        catch { throw PopbillRepositoryError.unauthenticated }
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
    }

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        do { (data, response) = try await urlSession.data(for: request) }
        catch let urlError as URLError { throw PopbillRepositoryError.network(urlError) }
        catch { throw PopbillRepositoryError.network(URLError(.unknown)) }
        guard let http = response as? HTTPURLResponse else {
            throw PopbillRepositoryError.httpStatus(0, nil)
        }
        // 503 = POPBILL_NOT_CONFIGURED
        if http.statusCode == 503 { throw PopbillRepositoryError.notConfigured }
        if http.statusCode >= 500 {
            throw PopbillRepositoryError.httpStatus(http.statusCode, String(data: data, encoding: .utf8))
        }
        do { return try JSONDecoder().decode(T.self, from: data) }
        catch { throw PopbillRepositoryError.decoding(error.localizedDescription) }
    }
}
