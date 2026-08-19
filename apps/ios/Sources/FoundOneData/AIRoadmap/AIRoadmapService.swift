//
//  AIRoadmapService.swift — AI 로드맵 생성 API 호출
//
//  웹 API: POST /api/ai/roadmap/generate
//  Pass 1 (Claude) + Pass 2 (풀 매칭) 총 30~180초 소요.
//  2026-08-19 비동기 작업 모드: `x-ai-async: 1` → 202 {jobId} → GET /api/ai/jobs/{id} 폴링(최대 6분).
//    클라이언트 타임아웃 제거("타임아웃은 정말 심각한 버그"). 300s URLRequest 타임아웃은 동기 폴백 경로만.
//

import Foundation
import Supabase

public actor AIRoadmapService {

    private let webAppURL: URL
    private let supabaseClient: SupabaseClient

    public init(webAppURL: URL, supabaseClient: SupabaseClient) {
        self.webAppURL = webAppURL
        self.supabaseClient = supabaseClient
    }

    /// 업종 분류 후보 (2026-08-03 분류 분리) — 생성 쿼터를 쓰지 않는 경량 호출
    public func classify(ideaText: String) async throws -> [IndustryCandidateItem] {
        let endpoint = webAppURL.appendingPathComponent("/api/ai/roadmap/classify")
        var request = URLRequest(url: endpoint, timeoutInterval: 30)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = supabaseClient.auth.currentSession?.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = try JSONEncoder().encode(["ideaText": ideaText])

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            struct Err: Decodable { let error: String? }
            let msg = (try? JSONDecoder().decode(Err.self, from: data))?.error
            throw AIRoadmapError.apiError(msg ?? "업종 분석 실패")
        }
        struct Payload: Decodable { let candidates: [IndustryCandidateItem] }
        return try JSONDecoder().decode(Payload.self, from: data).candidates
    }

    /// 로드맵 생성 — 비동기 작업 모드 (2026-08-19 "타임아웃은 정말 심각한 버그")
    ///   POST + `x-ai-async: 1` → 202 {jobId} → GET /api/ai/jobs/{id} 를 2s(30s 이후 4s) 간격으로 최대 6분 폴링.
    ///   서버가 200 전체 결과를 바로 주면(동기 폴백) 그대로 디코딩. 웹 AIRoadmapWizard 와 동일 계약·cadence.
    ///   onProgress: 서버 진행 문구(ai_jobs.progress — "업종 분석 중…" 등) 콜백.
    public func generate(
        input: AIRoadmapInput,
        onProgress: (@Sendable (String?) -> Void)? = nil
    ) async throws -> AIRoadmapResult {
        let endpoint = webAppURL.appendingPathComponent("/api/ai/roadmap/generate")

        // 300s 는 동기 폴백 경로(서버가 202 대신 200 을 줄 때)만을 위한 상한. 정상 경로는 202 가 수 초 내 온다.
        var request = URLRequest(url: endpoint, timeoutInterval: 300)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("1", forHTTPHeaderField: "x-ai-async")

        // Supabase 세션 토큰 주입
        if let token = supabaseClient.auth.currentSession?.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(input)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse else {
            throw AIRoadmapError.networkError("응답을 받을 수 없습니다.")
        }

        switch http.statusCode {
        case 202:
            struct Accepted: Decodable { let jobId: String }
            guard let accepted = try? JSONDecoder().decode(Accepted.self, from: data) else {
                throw AIRoadmapError.decodingError("작업 ID 를 받지 못했습니다.")
            }
            return try await pollJob(id: accepted.jobId, onProgress: onProgress)
        case 200:
            // 동기 폴백(레거시) — 종전과 동일
            do {
                return try JSONDecoder().decode(AIRoadmapResult.self, from: data)
            } catch {
                throw AIRoadmapError.decodingError(error.localizedDescription)
            }
        default:
            if let apiError = try? JSONDecoder().decode(AIRoadmapAPIError.self, from: data) {
                throw AIRoadmapError.apiError(apiError.error)
            }
            throw AIRoadmapError.apiError("오류 코드: \(http.statusCode)")
        }
    }

    // MARK: - 작업 폴링 (GET /api/ai/jobs/{id})

    private struct AIJobView: Decodable {
        let id: String
        let status: String          // queued | running | succeeded | failed
        let progress: String?
        let error: String?
        // result 는 상태가 succeeded 일 때만 — 별도 디코딩을 위해 raw 보관
    }

    private static let pollMaxSeconds: TimeInterval = 6 * 60

    private func pollJob(id: String, onProgress: (@Sendable (String?) -> Void)?) async throws -> AIRoadmapResult {
        let startedAt = Date()
        var notFoundStreak = 0
        let endpoint = webAppURL.appendingPathComponent("/api/ai/jobs/\(id)")

        while true {
            try Task.checkCancellation()
            let elapsed = Date().timeIntervalSince(startedAt)
            if elapsed > Self.pollMaxSeconds {
                throw AIRoadmapError.jobFailed("로드맵 생성이 예상보다 오래 걸리고 있어요. 잠시 후 '내 로드맵'에서 다시 확인하거나 다시 시도해 주세요.")
            }
            try await Task.sleep(nanoseconds: elapsed > 30 ? 4_000_000_000 : 2_000_000_000)

            var request = URLRequest(url: endpoint, timeoutInterval: 20)
            request.httpMethod = "GET"
            request.cachePolicy = .reloadIgnoringLocalCacheData
            if let token = supabaseClient.auth.currentSession?.accessToken {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }

            let data: Data
            let http: HTTPURLResponse
            do {
                let (d, r) = try await URLSession.shared.data(for: request)
                guard let h = r as? HTTPURLResponse else { continue }
                data = d; http = h
            } catch is CancellationError {
                throw CancellationError()
            } catch {
                continue // 일시 네트워크 오류 — 다음 틱에 재시도
            }

            if http.statusCode == 404 {
                notFoundStreak += 1
                if notFoundStreak >= 3 { throw AIRoadmapError.jobFailed("작업을 찾을 수 없어요. 다시 시도해 주세요.") }
                continue
            }
            guard http.statusCode == 200 else { continue }

            guard let view = try? JSONDecoder().decode(AIJobView.self, from: data) else { continue }
            switch view.status {
            case "succeeded":
                // result 만 다시 꺼내 AIRoadmapResult 로 디코딩 (웹과 동일한 페이로드)
                guard let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let resultObj = obj["result"],
                      JSONSerialization.isValidJSONObject(resultObj),
                      let resultData = try? JSONSerialization.data(withJSONObject: resultObj) else {
                    throw AIRoadmapError.decodingError("결과 본문이 비어 있습니다.")
                }
                do {
                    return try JSONDecoder().decode(AIRoadmapResult.self, from: resultData)
                } catch {
                    throw AIRoadmapError.decodingError(error.localizedDescription)
                }
            case "failed":
                throw AIRoadmapError.jobFailed(view.error ?? "로드맵 생성에 실패했습니다. 사용 횟수는 차감되지 않았어요.")
            default:
                onProgress?(view.progress)
            }
        }
    }
}

// MARK: - Errors

public enum AIRoadmapError: LocalizedError, Sendable {
    case networkError(String)
    case apiError(String)
    case decodingError(String)
    /// 비동기 작업이 failed 로 끝났거나 폴링 상한(6분)을 넘김 — 메시지는 서버 문구 그대로
    case jobFailed(String)

    public var errorDescription: String? {
        switch self {
        case .networkError(let msg): return "네트워크 오류: \(msg)"
        case .apiError(let msg):     return msg
        case .decodingError(let msg): return "데이터 파싱 오류: \(msg)"
        case .jobFailed(let msg):    return msg
        }
    }
}
