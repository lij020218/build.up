//
//  FunnelConnectionRepository.swift — 사장님 외부 데이터 연결 (Pull URL etc.)
//
//  iOS 는 Supabase 에 직접 쓰지 않고 web API 엔드포인트를 호출한다.
//  이유: 사장님 secret token 은 envelope encryption 으로 저장되며 KEK 는 서버에만 있음.
//
//  Web API endpoints (apps/web/app/api/integrations/saas-metrics/pull/*):
//   • POST   /api/integrations/saas-metrics/pull/test     — endpoint + token 으로 즉시 호출 테스트
//   • POST   /api/integrations/saas-metrics/pull/connect  — 등록 (envelope encrypt + insert)
//   • DELETE /api/integrations/saas-metrics/pull/connect  — 연결 해제 (id query param)
//
//  Supabase 테이블 saas_metrics_connections 는 RLS 로 본인 row 만 SELECT 가능 →
//  목록 조회만 iOS 가 직접 한다 (token 은 read 안 됨).
//

import Foundation
import Supabase
import FoundOneCore

// MARK: - DTO

/// Pull endpoint 테스트 결과 — 서버가 사장님 endpoint 를 한 번 호출해 보고 응답을 그대로 forward.
public struct PullConnectionTestResult: Sendable, Decodable {
    public let success: Bool
    public let httpStatus: Int
    public let data: PulledFunnelData?
    public let error: String?

    enum CodingKeys: String, CodingKey {
        case success
        case httpStatus = "http_status"
        case data
        case error
    }
}

/// 사장님 endpoint 가 반환해야 하는 JSON 스키마.
public struct PulledFunnelData: Sendable, Decodable {
    public let asOf: String
    public let mode: String
    public let step1: Int
    public let step2: Int
    public let step3: Int
    public let step4: Int

    enum CodingKeys: String, CodingKey {
        case asOf = "as_of"
        case mode
        case step1 = "step_1"
        case step2 = "step_2"
        case step3 = "step_3"
        case step4 = "step_4"
    }
}

/// saas_metrics_connections row — 사장님 화면에 노출되는 메타만.
public struct SaasConnection: Sendable, Decodable, Identifiable, Hashable {
    public let id: UUID
    public let source: String              // "custom_pull" | "ga4" | "cafe24" ...
    public let connectionLabel: String?
    public let endpointUrl: String?
    public let funnelMode: String?         // "commerce" | "saas"
    public let status: String?             // "active" | "paused" | "error"
    public let lastSyncedAt: String?       // ISO timestamp
    public let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case source
        case connectionLabel = "connection_label"
        case endpointUrl = "endpoint_url"
        case funnelMode = "funnel_mode"
        case status
        case lastSyncedAt = "last_synced_at"
        case createdAt = "created_at"
    }
}

// MARK: - Errors

public enum FunnelConnectionError: LocalizedError, Sendable {
    case notAuthenticated
    case invalidURL
    case network(URLError)
    case httpStatus(Int, String?)
    case decoding(String)
    case serverMessage(String)

    public var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "로그인이 필요합니다. 다시 로그인해주세요."
        case .invalidURL:
            return "주소 형식이 올바르지 않습니다. https:// 로 시작하는지 확인해주세요."
        case .network(let urlError):
            switch urlError.code {
            case .notConnectedToInternet, .networkConnectionLost:
                return "인터넷 연결을 확인해주세요."
            case .timedOut:
                return "응답이 너무 늦습니다. 잠시 후 다시 시도해주세요."
            case .cannotFindHost, .cannotConnectToHost, .dnsLookupFailed:
                return "서버 주소를 찾을 수 없습니다. URL 을 다시 확인해주세요."
            default:
                return "네트워크 오류: \(urlError.localizedDescription)"
            }
        case .httpStatus(let code, let body):
            if code == 401 { return "인증 실패 (401). 토큰을 다시 확인해주세요." }
            if code == 403 { return "권한 없음 (403). endpoint 가 Found.One 호출을 허용하는지 확인해주세요." }
            if code == 404 { return "endpoint 를 찾을 수 없습니다 (404)." }
            if code >= 500 { return "사장님 서버 오류 (\(code))." }
            if let body, !body.isEmpty { return "HTTP \(code) — \(body)" }
            return "HTTP \(code) 오류."
        case .decoding(let message):
            return "응답 형식이 올바르지 않습니다: \(message)"
        case .serverMessage(let message):
            return message
        }
    }
}

// MARK: - Repository

public actor FunnelConnectionRepository {

    /// Found.One web API base URL. 환경 변수에서 가져오는 게 이상적이지만,
    /// TODO: BUEnvironment 에 webApiBaseURL 추가 필요. 그 전까지 prod 고정.
    private let baseURL: URL
    private let supabase: SupabaseClient
    private let urlSession: URLSession

    public init(
        supabase: SupabaseClient,
        baseURL: URL = URL(string: "https://foundone.dev")!,
        urlSession: URLSession = .shared
    ) {
        self.supabase = supabase
        self.baseURL = baseURL
        self.urlSession = urlSession
    }

    // MARK: - Public API

    /// 사장님이 입력한 endpoint + token 으로 서버가 호출 테스트.
    /// 성공/실패 모두 200 으로 응답하고 body 에 success flag 가 있음.
    public func testPullConnection(
        endpointURL: String,
        secretToken: String,
        mode: String
    ) async throws -> PullConnectionTestResult {
        struct Body: Encodable {
            let endpoint_url: String
            let secret_token: String
            let funnel_mode: String
        }
        let body = Body(endpoint_url: endpointURL, secret_token: secretToken, funnel_mode: mode)
        let req = try await authedRequest(
            path: "/api/integrations/saas-metrics/pull/test",
            method: "POST",
            body: body
        )
        return try await perform(req)
    }

    /// 연결을 저장. 서버가 envelope encrypt 후 saas_metrics_connections insert.
    @discardableResult
    public func savePullConnection(
        endpointURL: String,
        secretToken: String,
        mode: String,
        label: String
    ) async throws -> UUID {
        struct Body: Encodable {
            let endpoint_url: String
            let secret_token: String
            let funnel_mode: String
            let connection_label: String
        }
        struct Resp: Decodable {
            let id: UUID
        }
        let body = Body(
            endpoint_url: endpointURL,
            secret_token: secretToken,
            funnel_mode: mode,
            connection_label: label
        )
        let req = try await authedRequest(
            path: "/api/integrations/saas-metrics/pull/connect",
            method: "POST",
            body: body
        )
        let resp: Resp = try await perform(req)
        return resp.id
    }

    public func deletePullConnection(connectionId: UUID) async throws {
        var components = URLComponents(
            url: baseURL.appendingPathComponent("/api/integrations/saas-metrics/pull/connect"),
            resolvingAgainstBaseURL: false
        )!
        components.queryItems = [URLQueryItem(name: "id", value: connectionId.uuidString)]
        guard let url = components.url else { throw FunnelConnectionError.invalidURL }

        var req = URLRequest(url: url)
        req.httpMethod = "DELETE"
        try await attachAuth(&req)
        let _: EmptyResponse = try await perform(req)
    }

    /// 본인 연결 목록 — Supabase 직접 조회 (RLS 보호, token 칼럼은 select 안 함).
    public func listConnections() async throws -> [SaasConnection] {
        let rows: [SaasConnection] = try await supabase
            .from("saas_metrics_connections")
            .select("id, source, connection_label, endpoint_url, funnel_mode, status, last_synced_at, created_at")
            .order("created_at", ascending: false)
            .execute()
            .value
        return rows
    }

    // MARK: - Helpers

    private struct EmptyResponse: Codable {}

    private func authedRequest<Body: Encodable>(
        path: String, method: String, body: Body?
    ) async throws -> URLRequest {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.timeoutInterval = 25
        try await attachAuth(&req)
        if let body {
            req.httpBody = try JSONEncoder().encode(body)
        }
        return req
    }

    /// Body-less convenience (GET / DELETE).
    private func authedRequest(path: String, method: String) async throws -> URLRequest {
        let nilBody: EmptyResponse? = nil
        return try await authedRequest(path: path, method: method, body: nilBody)
    }

    private func attachAuth(_ req: inout URLRequest) async throws {
        let session: Session
        do {
            session = try await supabase.auth.session
        } catch {
            throw FunnelConnectionError.notAuthenticated
        }
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
    }

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await urlSession.data(for: request)
        } catch let urlError as URLError {
            throw FunnelConnectionError.network(urlError)
        } catch {
            throw FunnelConnectionError.network(URLError(.unknown))
        }

        guard let http = response as? HTTPURLResponse else {
            throw FunnelConnectionError.httpStatus(0, nil)
        }

        guard (200...299).contains(http.statusCode) else {
            // Try to extract { error: "..." } message
            if let errBody = try? JSONDecoder().decode(ServerError.self, from: data) {
                throw FunnelConnectionError.httpStatus(http.statusCode, errBody.error)
            }
            let bodyStr = String(data: data, encoding: .utf8)
            throw FunnelConnectionError.httpStatus(http.statusCode, bodyStr)
        }

        if T.self == EmptyResponse.self {
            return EmptyResponse() as! T
        }
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw FunnelConnectionError.decoding(error.localizedDescription)
        }
    }

    private struct ServerError: Decodable {
        let error: String?
    }
}

// AnyEncodable 은 DailyEntryRepository 에 이미 존재 — 충돌 회피 위해 제네릭 패턴으로 변경.
