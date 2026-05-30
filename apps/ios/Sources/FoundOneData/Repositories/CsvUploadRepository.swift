//
//  CsvUploadRepository.swift — 매출 CSV/Excel 업로드 (모든 사장님 fallback).
//
//  웹 SSOT:
//   • POST /api/integrations/csv/upload   — multipart/form-data { file, sourceLabel? }
//   • GET  /api/integrations/csv/list     — 최근 업로드 + 일별 합계
//
//  iOS 사용처:
//   • ProfileView 의 "엑셀/CSV 업로드" 카드 → CsvUploadSheet
//   • PG/POS 없는 사장님이 엑셀에서 export 한 매출을 그대로 업로드
//
//  형식: 헤더 자동 감지 ("날짜·매출" / "date·amount" 등). 최대 5MB / 10,000 행.
//

import Foundation
import Supabase

// MARK: - DTOs

public struct CsvUploadResponse: Sendable, Decodable {
    public let ok: Bool
    public let uploadId: String?
    public let rowCount: Int?
    /// 원 단위 합계 (서버에서 만원→원 변환 후 누적)
    public let totalAmount: Int?
    public let detectedHeaders: [String]?
    public let sample: [CsvUploadSampleRow]?
    public let error: String?
}

public struct CsvUploadSampleRow: Sendable, Decodable {
    public let date: String
    public let amount: Int
    public let customers: Int?
    public let description: String?
}

public struct CsvUploadRecord: Sendable, Decodable, Identifiable {
    public let id: String
    public let filename: String
    public let source_label: String?
    public let row_count: Int
    public let total_amount: Int
    public let uploaded_at: String
}

public struct CsvDailySummaryRow: Sendable, Decodable {
    public let date: String
    public let sales: Int
    public let customers: Int
    public let source: String
}

public struct CsvListResponse: Sendable, Decodable {
    public let ok: Bool
    public let uploads: [CsvUploadRecord]?
    public let dailySummary: [CsvDailySummaryRow]?
    public let error: String?
}

// MARK: - Errors

public enum CsvUploadRepositoryError: LocalizedError, Sendable {
    case network(URLError)
    case httpStatus(Int, String?)
    case decoding(String)
    case server(String)
    case unauthenticated

    public var errorDescription: String? {
        switch self {
        case .network(let e): return "네트워크 오류: \(e.localizedDescription)"
        case .httpStatus(let code, let body): return "서버 오류 (\(code))\(body.map { ": \($0)" } ?? "")"
        case .decoding(let msg): return "응답 해석 실패: \(msg)"
        case .server(let msg): return msg
        case .unauthenticated: return "로그인이 필요합니다."
        }
    }
}

// MARK: - Repository

public actor CsvUploadRepository {

    private let supabase: SupabaseClient
    private let baseURL: URL
    private let urlSession: URLSession

    public init(
        supabase: SupabaseClient,
        // ⚠️ 2026-05-25: foundone.dev DNS A 미설정 — Vercel URL 사용 (MarketingRepository 와 동일).
        baseURL: URL = URL(string: "https://foundone.dev")!,
        urlSession: URLSession = .shared
    ) {
        self.supabase = supabase
        self.baseURL = baseURL
        self.urlSession = urlSession
    }

    // MARK: Upload

    /// CSV 파일 업로드. Multipart/form-data 직접 구성 (URLSession + Foundation 만 사용).
    /// - Parameters:
    ///   - fileData: 파일 raw bytes (≤ 5MB, server 검증)
    ///   - filename: 표시용 파일명 (예: "smartstore_2026_05.csv")
    ///   - sourceLabel: 출처 메모 (예: "스마트스토어"). nil 이면 생략.
    public func uploadCsv(
        fileData: Data,
        filename: String,
        sourceLabel: String?
    ) async throws -> CsvUploadResponse {
        // 인증 토큰 미리 가져옴 (실패 시 unauthenticated)
        let session: Session
        do {
            session = try await supabase.auth.session
        } catch {
            throw CsvUploadRepositoryError.unauthenticated
        }

        let boundary = "Boundary-\(UUID().uuidString)"
        let body = makeMultipartBody(
            fileData: fileData,
            filename: filename,
            sourceLabel: sourceLabel,
            boundary: boundary
        )

        var req = URLRequest(url: baseURL.appendingPathComponent("/api/integrations/csv/upload"))
        req.httpMethod = "POST"
        req.timeoutInterval = 60 // server maxDuration 30s + 여유
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        req.httpBody = body

        return try await perform(req)
    }

    // MARK: List

    /// 최근 업로드 이력 + 일별 합계 조회. 사용처: CSV 업로드 시트에서 "최근 업로드" 섹션.
    public func listUploads(fromDays: Int = 30) async throws -> CsvListResponse {
        var components = URLComponents(
            url: baseURL.appendingPathComponent("/api/integrations/csv/list"),
            resolvingAgainstBaseURL: false
        )
        components?.queryItems = [URLQueryItem(name: "fromDays", value: String(fromDays))]
        guard let url = components?.url else {
            throw CsvUploadRepositoryError.server("Invalid URL")
        }

        var req = URLRequest(url: url)
        req.httpMethod = "GET"
        req.timeoutInterval = 20
        try await attachAuth(&req)

        return try await perform(req)
    }

    // MARK: - Helpers

    /// Multipart/form-data body 구성 — RFC 7578 표준.
    ///   각 파트: --boundary\r\nContent-Disposition: ...\r\n\r\n<value>\r\n
    ///   마지막: --boundary--\r\n
    private func makeMultipartBody(
        fileData: Data,
        filename: String,
        sourceLabel: String?,
        boundary: String
    ) -> Data {
        var body = Data()

        // file 파트
        body.appendString("--\(boundary)\r\n")
        body.appendString("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n")
        body.appendString("Content-Type: text/csv\r\n\r\n")
        body.append(fileData)
        body.appendString("\r\n")

        // sourceLabel 파트 (있을 때만)
        if let label = sourceLabel?.trimmingCharacters(in: .whitespacesAndNewlines), !label.isEmpty {
            body.appendString("--\(boundary)\r\n")
            body.appendString("Content-Disposition: form-data; name=\"sourceLabel\"\r\n\r\n")
            body.appendString(label)
            body.appendString("\r\n")
        }

        // 종료
        body.appendString("--\(boundary)--\r\n")
        return body
    }

    private func attachAuth(_ req: inout URLRequest) async throws {
        let session: Session
        do {
            session = try await supabase.auth.session
        } catch {
            throw CsvUploadRepositoryError.unauthenticated
        }
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
    }

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await urlSession.data(for: request)
        } catch let urlError as URLError {
            throw CsvUploadRepositoryError.network(urlError)
        } catch {
            throw CsvUploadRepositoryError.network(URLError(.unknown))
        }
        guard let http = response as? HTTPURLResponse else {
            throw CsvUploadRepositoryError.httpStatus(0, nil)
        }
        // 400 도 server 가 JSON ok:false 로 응답 → decode 시도. 4xx/5xx 만 raw 에러.
        if http.statusCode >= 500 {
            let bodyStr = String(data: data, encoding: .utf8)
            throw CsvUploadRepositoryError.httpStatus(http.statusCode, bodyStr)
        }
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw CsvUploadRepositoryError.decoding(error.localizedDescription)
        }
    }
}

// MARK: - Data 확장 (multipart string 추가)

private extension Data {
    mutating func appendString(_ string: String) {
        if let d = string.data(using: .utf8) {
            self.append(d)
        }
    }
}
