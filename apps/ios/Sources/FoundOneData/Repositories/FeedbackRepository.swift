//
//  FeedbackRepository.swift — 인앱 피드백 전송 (POST /api/feedback → user_feedback).
//   웹 FeedbackCard 와 동일 엔드포인트·페이로드. best-effort(실패 시 false).
//

import Foundation
import Supabase

public struct FeedbackRepository: Sendable {
    private let supabase: SupabaseClient
    private let baseURL: URL

    public init(supabase: SupabaseClient, baseURL: URL = URL(string: "https://foundone.dev")!) {
        self.supabase = supabase
        self.baseURL = baseURL
    }

    /// 피드백 전송. category: "bug"|"idea"|"ux"|"other". 성공 시 true.
    public func send(category: String, message: String, screen: String = "ios") async -> Bool {
        guard let token = try? await supabase.auth.session.accessToken else { return false }

        var req = URLRequest(url: baseURL.appendingPathComponent("/api/feedback"))
        req.httpMethod = "POST"
        req.timeoutInterval = 20
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "category": category,
            "message": message,
            "context": ["platform": "ios", "screen": screen],
        ]
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)

        guard let (_, resp) = try? await URLSession.shared.data(for: req),
              let http = resp as? HTTPURLResponse,
              (200..<300).contains(http.statusCode) else {
            return false
        }
        return true
    }
}
