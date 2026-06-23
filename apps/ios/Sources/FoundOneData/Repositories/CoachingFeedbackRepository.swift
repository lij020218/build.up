//
//  CoachingFeedbackRepository.swift — AI 코칭 피드백 전송 (도움됨/안맞음 + 이유).
//
//  웹 SSOT: POST /api/ai/coaching-feedback { source, insightKey, headline, ... verdict, reason }
//  저장된 "안맞음"은 다음 코칭 생성 시 prompt 에 주입돼 AI 자가개선(웹·iOS 공통 테이블).
//

import Foundation
import Supabase

public actor CoachingFeedbackRepository {

    public enum Verdict: String, Sendable { case up, down }
    public enum Reason: String, Sendable {
        case industryMismatch = "industry-mismatch"
        case alreadyKnow = "already-know"
        case inaccurate
        case hardToAct = "hard-to-act"
    }

    private let supabase: SupabaseClient
    private let baseURL: URL
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

    /// 피드백 전송. 실패해도 throw 안 함(코칭 UX 보호) — best-effort.
    public func submit(
        headline: String,
        verdict: Verdict,
        reason: Reason? = nil,
        category: String? = nil,
        industryCategoryId: String? = nil,
        specialtyId: String? = nil
    ) async {
        guard let session = try? await supabase.auth.session else { return }
        var payload: [String: String] = [
            "source": "dashboard-actions",
            "insightKey": String(headline.prefix(200)),
            "headline": String(headline.prefix(300)),
            "verdict": verdict.rawValue,
        ]
        if verdict == .down, let reason { payload["reason"] = reason.rawValue }
        if let category { payload["category"] = category }
        if let industryCategoryId { payload["industryCategoryId"] = industryCategoryId }
        if let specialtyId { payload["specialtyId"] = specialtyId }

        guard let body = try? JSONEncoder().encode(payload) else { return }
        var req = URLRequest(url: baseURL.appendingPathComponent("/api/ai/coaching-feedback"))
        req.httpMethod = "POST"
        req.timeoutInterval = 15
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = body
        _ = try? await urlSession.data(for: req)
    }
}
