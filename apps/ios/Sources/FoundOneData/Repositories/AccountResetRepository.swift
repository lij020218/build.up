//
//  AccountResetRepository.swift — 진행 초기화 (웹 /api/account/reset 라우팅, SSOT).
//
//  2026-06-07 변경: Supabase 직접 delete → 웹 API(/api/account/reset) POST 로 복귀.
//   이유(점검 결과): iOS 직접 delete 는 *사용자 JWT* 라 RLS 적용을 받는데, 결제/통합
//   테이블 다수는 self-DELETE 정책이 없어(SELECT만, 쓰기는 service_role) iOS 가 목록을
//   늘려도 0 row 만 삭제됨 → 웹 reset(service_role, account-wipe.ts USER_TABLES 전체)과
//   삭제 집합이 크게 달라 "초기화" 결과가 플랫폼마다 달랐다.
//   → 웹 API 를 단일 SSOT 로 삼아 "무엇을 지우는가"를 account-wipe.ts 한 곳에서 관리.
//   (foundone.dev 는 현재 다른 모든 repo 가 쓰는 운영 도메인 — 2026-05-20 의 미배포 사유 해소.)
//
//  웹 라우트가 service_role 로 USER_TABLES + OWNER_TABLES 전수 삭제(구독·결제 보존).
//  roadmaps → stage_decisions/stage_tasks 는 FK CASCADE 로 함께 삭제.
//

import Foundation
import Supabase
import FoundOneCore

public struct AccountResetResult: Sendable {
    /// 성공적으로 시도된 테이블 수.
    public let attemptedTables: Int
    /// 실제 핵심 테이블 (3개) 중 실패한 것 — partial 판단에 사용.
    public let coreFailures: [String]

    public var isFullSuccess: Bool { coreFailures.isEmpty }
}

public enum AccountResetError: LocalizedError, Sendable {
    case notAuthenticated
    case partial(failures: [String])

    public var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "로그인이 필요합니다."
        case .partial(let f):
            return "일부 데이터 삭제 실패: \(f.joined(separator: ", "))"
        }
    }
}

public actor AccountResetRepository {

    private let supabase: SupabaseClient
    private let baseURL: URL

    public init(
        supabase: SupabaseClient,
        baseURL: URL = URL(string: "https://foundone.dev")!
    ) {
        self.supabase = supabase
        self.baseURL = baseURL
    }

    /// 사장님 본인 데이터 일괄 초기화 — 웹 /api/account/reset 위임 (service_role 전수 삭제).
    ///
    /// 웹 라우트가 account-wipe.ts 의 USER_TABLES + OWNER_TABLES 를 전부 지우고
    /// `{ ok, failures, totalDeleted }` 를 반환한다. ok=false(일부 테이블 실패) 또는
    /// 네트워크/인증 실패 시 throw 하여 호출부가 partial/실패를 인지하게 한다.
    @discardableResult
    public func resetAccount() async throws -> AccountResetResult {
        // 인증 토큰 확보
        let token: String
        do {
            token = try await supabase.auth.session.accessToken
        } catch {
            throw AccountResetError.notAuthenticated
        }

        var req = URLRequest(url: baseURL.appendingPathComponent("/api/account/reset"))
        req.httpMethod = "POST"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: req)
        } catch {
            throw AccountResetError.partial(failures: ["network"])
        }

        guard let http = response as? HTTPURLResponse else {
            throw AccountResetError.partial(failures: ["no-response"])
        }
        if http.statusCode == 401 || http.statusCode == 403 {
            throw AccountResetError.notAuthenticated
        }

        // 응답 파싱 — ok=false 면 실패한 테이블 목록을 partial 로 전달.
        let decoded = try? JSONDecoder().decode(ResetResponse.self, from: data)
        if http.statusCode != 200 || decoded?.ok != true {
            let failed = decoded?.failures?.map { $0.table } ?? ["server"]
            throw AccountResetError.partial(failures: failed)
        }

        return AccountResetResult(attemptedTables: decoded?.totalDeleted ?? 0, coreFailures: [])
    }

    // MARK: - Response DTO

    private struct ResetResponse: Decodable {
        let ok: Bool
        let totalDeleted: Int?
        let failures: [Failure]?
        struct Failure: Decodable { let table: String }
    }
}
