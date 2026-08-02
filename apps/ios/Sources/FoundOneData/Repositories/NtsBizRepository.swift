//
//  NtsBizRepository.swift — 국세청 사업자 상태조회 (POST /api/data/business/status).
//   웹 NtsBizVerifyCard 와 동일 엔드포인트·해석 규칙 (2026-08-03 감사 P1-2).
//
//  정직성 규칙 (웹과 1:1 — nts-business.ts 감사에서 확정):
//   · unregistered ≠ 폐업·실패 — 갓 발급된 번호는 전산 반영 전일 수 있다.
//   · 네트워크/5xx 오류 ≠ 미등록 — 던져서(throw) 호출측이 재시도 상태로 보여준다.
//   · 상태는 서버가 명시한 값만 전달 — 여기서 기본값을 지어내지 않는다.
//

import Foundation
import Supabase

public struct NtsBizStatusResult: Sendable {
    /// "active" | "suspended" | "closed" | "unregistered" | "unknown" — 서버 어댑터 판정 그대로
    public let operatingStatus: String
    /// 과세유형 문구 ("부가가치세 간이과세자" 등). 미등록이면 국세청 안내문이 들어있음
    public let taxType: String
}

public struct NtsBizRepository: Sendable {
    private let supabase: SupabaseClient
    private let baseURL: URL

    public init(supabase: SupabaseClient, baseURL: URL = URL(string: "https://foundone.dev")!) {
        self.supabase = supabase
        self.baseURL = baseURL
    }

    public func checkStatus(businessNumber: String) async throws -> NtsBizStatusResult {
        let token = try await supabase.auth.session.accessToken

        var req = URLRequest(url: baseURL.appendingPathComponent("/api/data/business/status"))
        req.httpMethod = "POST"
        req.timeoutInterval = 15
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: ["businessNumbers": [businessNumber]])

        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)   // 오류는 오류로 — "미등록" 으로 뭉개지 않는다
        }

        struct Payload: Decodable {
            struct Item: Decodable {
                let operatingStatus: String
                let taxType: String
            }
            let data: [Item]
        }
        let payload = try JSONDecoder().decode(Payload.self, from: data)
        guard let item = payload.data.first else { throw URLError(.cannotParseResponse) }
        return NtsBizStatusResult(operatingStatus: item.operatingStatus, taxType: item.taxType)
    }
}
