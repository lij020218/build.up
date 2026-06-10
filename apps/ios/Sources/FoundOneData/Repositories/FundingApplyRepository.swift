//
//  FundingApplyRepository.swift — 지원사업 앱 내부 신청 (POST /api/funding/apply).
//   파운드원이 직접 운영하는 지원사업(internalApply)을 현 사업체로 즉시 신청.
//   웹 GuidesView 의 신청 플로우와 동일 엔드포인트·페이로드. 접수 기간 게이팅은 서버가 진실.
//

import Foundation
import Supabase

public struct FundingApplyResult: Sendable {
    public let ok: Bool
    /// 실패 시 서버 메시지(기간 밖/오류 등). 성공이면 nil.
    public let message: String?
    /// 성공 시 발표일(YYYY-MM-DD).
    public let announce: String?
}

public struct FundingApplyStatus: Sendable {
    public let applied: Bool
    public let status: String?
}

public struct FundingApplyRepository: Sendable {
    private let supabase: SupabaseClient
    private let baseURL: URL

    public init(supabase: SupabaseClient, baseURL: URL = URL(string: "https://foundone.dev")!) {
        self.supabase = supabase
        self.baseURL = baseURL
    }

    /// 본인 신청 여부 조회 — 버튼 "신청 완료" 표시용. 실패 시 applied=false.
    public func status(programId: String) async -> FundingApplyStatus {
        guard let token = try? await supabase.auth.session.accessToken else {
            return FundingApplyStatus(applied: false, status: nil)
        }
        var comps = URLComponents(url: baseURL.appendingPathComponent("/api/funding/apply"), resolvingAgainstBaseURL: false)
        comps?.queryItems = [URLQueryItem(name: "programId", value: programId)]
        guard let url = comps?.url else { return FundingApplyStatus(applied: false, status: nil) }

        var req = URLRequest(url: url)
        req.httpMethod = "GET"
        req.timeoutInterval = 15
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        guard let (data, resp) = try? await URLSession.shared.data(for: req),
              let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return FundingApplyStatus(applied: false, status: nil)
        }
        return FundingApplyStatus(applied: (json["applied"] as? Bool) ?? false, status: json["status"] as? String)
    }

    /// 신청 접수 — 현 사업체 스냅샷 + 아이디어 한두 줄(선택)을 함께 전송.
    public func apply(programId: String, pitch: String?, snapshot: FundingProfileSnapshot) async -> FundingApplyResult {
        guard let token = try? await supabase.auth.session.accessToken else {
            return FundingApplyResult(ok: false, message: "로그인이 필요합니다.", announce: nil)
        }

        var req = URLRequest(url: baseURL.appendingPathComponent("/api/funding/apply"))
        req.httpMethod = "POST"
        req.timeoutInterval = 20
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // ⚠️ Optional 을 [String: Any] 에 직접 넣으면 Optional 박싱 → JSONSerialization 실패.
        //   nil 이 아닌 값만 명시적으로 언랩해 넣는다(서버는 누락 키를 null 로 처리).
        var snap: [String: Any] = [
            "businessLaunched": snapshot.businessLaunched,
            "hasUserSales": snapshot.hasUserSales,
            "employeesCount": snapshot.employeesCount,
        ]
        if let v = snapshot.storeName { snap["storeName"] = v }
        if let v = snapshot.industryCategoryId { snap["industryCategoryId"] = v }
        if let v = snapshot.businessLaunchedDate { snap["businessLaunchedDate"] = v }
        if let v = snapshot.monthlyAvgRevenue { snap["monthlyAvgRevenue"] = v }
        if let v = snapshot.weeklySalesChangePct { snap["weeklySalesChangePct"] = v }

        var body: [String: Any] = ["programId": programId, "snapshot": snap]
        if let p = pitch?.trimmingCharacters(in: .whitespacesAndNewlines), !p.isEmpty {
            body["pitch"] = p
        }
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)

        guard let (data, resp) = try? await URLSession.shared.data(for: req),
              let http = resp as? HTTPURLResponse else {
            return FundingApplyResult(ok: false, message: "네트워크 오류예요. 잠시 후 다시 시도해주세요.", announce: nil)
        }
        let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
        if (200..<300).contains(http.statusCode) {
            return FundingApplyResult(ok: true, message: nil, announce: json?["announce"] as? String)
        }
        return FundingApplyResult(ok: false, message: (json?["error"] as? String) ?? "신청에 실패했어요.", announce: nil)
    }
}
