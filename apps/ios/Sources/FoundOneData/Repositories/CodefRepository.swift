//
//  CodefRepository.swift — 10개 카드사 매출 자동 동기화 (CODEF API)
//
//  웹 SSOT: apps/web/app/lib/components/profile/CodefConnectCard.tsx
//
//  API:
//   • GET  /api/integrations/codef/status   — 연결 상태 + 30일 카드매출 수
//   • POST /api/integrations/codef/connect  — 사업자번호 + 생년월일 + 카드사 + 계좌
//   • POST /api/integrations/codef/sync     — 카드 매출 데이터 수집
//
//  비용 정책: CODEF_NOT_CONFIGURED(503) 반환 시 "곧 활성화" 친절 메시지.
//            사용자 100명+ & 가치 입증 후 서버 환경변수 활성화.
//
//  카드사 코드 (여신금융협회):
//   0301=KB국민, 0302=신한, 0303=삼성, 0304=현대, 0305=롯데,
//   0306=하나, 0307=BC, 0308=NH농협, 0309=우리, 0310=씨티
//

import Foundation
import Supabase

// MARK: - DTOs

public struct CodefStatusResponse: Sendable, Decodable {
    public let ok: Bool
    public let connected: Bool?
    public let businessNumberMask: String?
    public let businessName: String?
    public let status: String?           // "active" | "invalid" | ...
    public let lastSyncAt: String?
    public let lastSyncError: String?
    public let salesCount30d: Int?
    public let error: String?
}

public struct CodefConnectRequest: Sendable, Encodable {
    public let businessNumber: String
    public let representativeBirthday: String  // YYYYMMDD
    public let cardCompany: String             // "0301" ~ "0310"
    public let bankAccountNumber: String

    public init(
        businessNumber: String,
        representativeBirthday: String,
        cardCompany: String,
        bankAccountNumber: String
    ) {
        self.businessNumber          = businessNumber
        self.representativeBirthday  = representativeBirthday
        self.cardCompany             = cardCompany
        self.bankAccountNumber       = bankAccountNumber
    }
}

public struct CodefConnectResponse: Sendable, Decodable {
    public let ok: Bool
    public let status: String?
    public let error: String?
    public let code: String?             // "CODEF_NOT_CONFIGURED" 등
}

public struct CodefSyncResponse: Sendable, Decodable {
    public let ok: Bool
    public let fetched: Int?
    public let upserted: Int?
    public let error: String?
    public let code: String?
}

// MARK: - Static card company data (웹 SSOT 거울)

public struct CodefCardCompany: Sendable {
    public let code: String
    public let name: String

    public static let all: [CodefCardCompany] = [
        .init(code: "0301", name: "KB국민카드"),
        .init(code: "0302", name: "신한카드"),
        .init(code: "0303", name: "삼성카드"),
        .init(code: "0304", name: "현대카드"),
        .init(code: "0305", name: "롯데카드"),
        .init(code: "0306", name: "하나카드"),
        .init(code: "0307", name: "BC카드"),
        .init(code: "0308", name: "NH농협카드"),
        .init(code: "0309", name: "우리카드"),
        .init(code: "0310", name: "씨티카드"),
    ]
}

// MARK: - Errors

public enum CodefRepositoryError: LocalizedError, Sendable {
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

public actor CodefRepository {

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

    public func fetchStatus() async throws -> CodefStatusResponse {
        var req = URLRequest(url: baseURL.appendingPathComponent("/api/integrations/codef/status"))
        req.httpMethod   = "GET"
        req.timeoutInterval = 20
        req.cachePolicy  = .reloadIgnoringLocalCacheData
        try await attachAuth(&req)
        return try await perform(req)
    }

    // MARK: Connect

    public func connect(
        businessNumber: String,
        representativeBirthday: String,
        cardCompany: String,
        bankAccountNumber: String
    ) async throws -> CodefConnectResponse {
        let body = CodefConnectRequest(
            businessNumber: businessNumber,
            representativeBirthday: representativeBirthday,
            cardCompany: cardCompany,
            bankAccountNumber: bankAccountNumber
        )
        let req = try await jsonRequest(path: "/api/integrations/codef/connect", method: "POST", body: body, timeoutSec: 30)
        return try await perform(req)
    }

    // MARK: Sync

    public func sync(fromDays: Int = 30) async throws -> CodefSyncResponse {
        struct SyncBody: Encodable { let fromDays: Int }
        let req = try await jsonRequest(path: "/api/integrations/codef/sync", method: "POST", body: SyncBody(fromDays: fromDays), timeoutSec: 60)
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
        catch { throw CodefRepositoryError.unauthenticated }
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
    }

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        do { (data, response) = try await urlSession.data(for: request) }
        catch let urlError as URLError { throw CodefRepositoryError.network(urlError) }
        catch { throw CodefRepositoryError.network(URLError(.unknown)) }
        guard let http = response as? HTTPURLResponse else {
            throw CodefRepositoryError.httpStatus(0, nil)
        }
        // 503 = CODEF_NOT_CONFIGURED
        if http.statusCode == 503 { throw CodefRepositoryError.notConfigured }
        if http.statusCode >= 500 {
            throw CodefRepositoryError.httpStatus(http.statusCode, String(data: data, encoding: .utf8))
        }
        do { return try JSONDecoder().decode(T.self, from: data) }
        catch { throw CodefRepositoryError.decoding(error.localizedDescription) }
    }
}
