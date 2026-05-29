//
//  CsvParseRepository.swift — AI 기반 CSV 파싱 (재고·회원)
//
//  사용처:
//   • InventoryManagementSheet → parseInventory → [BUInventoryItem]
//   • CustomerManagementSheet → parseMembers   → [BUMember]
//
//  웹 SSOT:
//   • POST /api/ai/products/parse  { text, language } → { products: [...] }
//   • POST /api/ai/members/parse   { text, language } → { members:  [...] }
//

import Foundation
import Supabase

// MARK: - Private response DTOs

private struct ParseProductsResponse: Decodable {
    let products: [ParsedProduct]?
    let error: String?
}

private struct ParsedProduct: Decodable {
    let name: String
    let category: String?
    let price: Double?
    let cost: Double?
    let stock: Double?
    let unit: String?
}

private struct ParseMembersResponse: Decodable {
    let members: [ParsedMember]?
    let error: String?
}

private struct ParsedMember: Decodable {
    let name: String
    let plan: String?
    let fee: Double?
    let startDate: String?
    let endDate: String?
}

// MARK: - Errors

public enum CsvParseError: LocalizedError, Sendable {
    case network(URLError)
    case httpStatus(Int, String?)
    case decoding(String)
    case server(String)
    case unauthenticated
    case emptyResult

    public var errorDescription: String? {
        switch self {
        case .network(let e):      return "네트워크 오류: \(e.localizedDescription)"
        case .httpStatus(let c, _): return "서버 오류 (\(c))"
        case .decoding(let m):     return "응답 해석 실패: \(m)"
        case .server(let m):       return m
        case .unauthenticated:     return "로그인이 필요합니다."
        case .emptyResult:         return "인식된 항목이 없습니다. CSV 형식을 확인해 주세요."
        }
    }
}

// MARK: - Repository

public actor CsvParseRepository {

    private let supabase: SupabaseClient
    private let baseURL: URL
    private let urlSession: URLSession

    public init(
        supabase: SupabaseClient,
        baseURL: URL = URL(string: "https://build-up-gamma.vercel.app")!,
        urlSession: URLSession = .shared
    ) {
        self.supabase = supabase
        self.baseURL = baseURL
        self.urlSession = urlSession
    }

    // MARK: Inventory

    public func parseInventory(text: String, language: String = "ko") async throws -> [BUInventoryItem] {
        let resp: ParseProductsResponse = try await postParse(
            path: "/api/ai/products/parse",
            text: text,
            language: language
        )
        if let err = resp.error { throw CsvParseError.server(err) }
        let products = resp.products ?? []
        if products.isEmpty { throw CsvParseError.emptyResult }
        return products.map { p in
            BUInventoryItem(
                id: UUID().uuidString,
                name: p.name,
                quantity: p.stock ?? 0,
                unit: p.unit.flatMap { $0.isEmpty ? nil : $0 } ?? "개",
                minThreshold: 0,
                unitCost: p.cost ?? 0,
                category: p.category.flatMap { $0.isEmpty ? nil : $0 } ?? "other",
                itemType: "material",
                sellingPrice: p.price ?? 0,
                leadTimeDays: 1,
                dailyUsage: 0,
                lastOrderedAt: nil,
                wasteLog: []
            )
        }
    }

    // MARK: Members

    public func parseMembers(text: String, language: String = "ko") async throws -> [BUMember] {
        let resp: ParseMembersResponse = try await postParse(
            path: "/api/ai/members/parse",
            text: text,
            language: language
        )
        if let err = resp.error { throw CsvParseError.server(err) }
        let members = resp.members ?? []
        if members.isEmpty { throw CsvParseError.emptyResult }
        return members.map { m in
            BUMember(
                id: UUID().uuidString,
                name: m.name,
                plan: m.plan ?? "일반",
                fee: m.fee ?? 0,
                startDate: m.startDate ?? "",
                endDate: m.endDate ?? ""
            )
        }
    }

    // MARK: - Private

    private func postParse<T: Decodable>(path: String, text: String, language: String) async throws -> T {
        let session: Session
        do {
            session = try await supabase.auth.session
        } catch {
            throw CsvParseError.unauthenticated
        }

        let payload = ["text": text, "language": language]
        let body: Data
        do {
            body = try JSONEncoder().encode(payload)
        } catch {
            throw CsvParseError.decoding("Encoding failed")
        }

        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = "POST"
        req.timeoutInterval = 60
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = body

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await urlSession.data(for: req)
        } catch let urlError as URLError {
            throw CsvParseError.network(urlError)
        } catch {
            throw CsvParseError.network(URLError(.unknown))
        }

        guard let http = response as? HTTPURLResponse else {
            throw CsvParseError.httpStatus(0, nil)
        }
        if http.statusCode >= 500 {
            let bodyStr = String(data: data, encoding: .utf8)
            throw CsvParseError.httpStatus(http.statusCode, bodyStr)
        }
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw CsvParseError.decoding(error.localizedDescription)
        }
    }
}
