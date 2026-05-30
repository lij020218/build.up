//
//  AIDashboardActionsRepository.swift — AI 모닝 브리핑 (오늘의 액션 3개 + 위기 알림)
//
//  웹 SSOT:
//   • POST /api/ai/dashboard/actions
//   • Body: DashboardContext (packages/ai/src/dashboard/prompt.ts)
//   • Response: DashboardActionsResponse { todayActions[], crisisActions[], insight, insightReferencedCase? }
//
//  iOS 사용처:
//   • TodayView 의 hero — 매일 사장님이 첫 화면에서 보는 AI 코칭
//   • 1일 30회·1분 5회 rate limit (web 측 보안 적용)
//   • 캐시: 24h KST (server 측 처리 — useDashboard.ts 의 buildAiActionsCacheKey 패턴과 동일)
//
//  주의:
//   • industryCategoryId 와 storeName 만 server 필수. 나머지 optional → server enrichDashboardContext 가 채움
//   • Fallback 빈 응답 가능 (LLM 파싱 실패 시 todayActions=[], insight="" 반환)
//

import Foundation
import Supabase
import FoundOneCore

// MARK: - Response DTOs (web TypeScript 타입과 1:1 매핑)

public struct AIDashboardReferencedCase: Sendable, Decodable, Hashable {
    public let id: String
    public let name: String
}

public struct AIDashboardActionEvidence: Sendable, Decodable, Hashable {
    public let text: String
}

public struct AIDashboardAction: Sendable, Decodable, Identifiable, Hashable {
    public let title: String
    public let reason: String
    /// "high" | "medium" — web SSOT 그대로 raw string
    public let priority: String
    public let referencedCase: AIDashboardReferencedCase?
    /// Found.One 기능 ID (features-catalog SSOT). UI 에서 navigate 시 사용.
    public let feature: String?
    public let evidence: [AIDashboardActionEvidence]?

    public var id: String { title }
}

public struct AIDashboardCrisisAction: Sendable, Decodable, Identifiable, Hashable {
    public let title: String
    public let impact: String
    /// "easy" | "medium" | "hard"
    public let difficulty: String
    public let referencedCase: AIDashboardReferencedCase?
    public let feature: String?
    public let evidence: [AIDashboardActionEvidence]?

    public var id: String { title }
}

public struct AIDashboardActionsResponse: Sendable, Decodable {
    public let todayActions: [AIDashboardAction]
    public let crisisActions: [AIDashboardCrisisAction]
    public let insight: String
    public let insightReferencedCase: AIDashboardReferencedCase?
    /// LLM 파싱 실패 시 server graceful fallback. true 면 todayActions·insight 비어있음.
    public let _fallback: Bool?
    public let _reason: String?

    /// 서버 응답 → 기존 `AiAction` (HeroResolver) 변환.
    /// HeroOuterCard / Row3CoachingNested 가 그대로 사용 가능.
    /// priority 가 "high"·"medium" 외 값이면 medium 으로 안전 변환.
    public func toAiActions() -> [AiAction] {
        todayActions.map { action in
            let priority: Hero.Priority = {
                switch action.priority {
                case "high": return .high
                case "medium": return .medium
                case "low": return .low
                default: return .medium
                }
            }()
            let referencedCase: Hero.ReferencedCase? = action.referencedCase.map {
                Hero.ReferencedCase(id: $0.id, name: $0.name)
            }
            return AiAction(
                title: action.title,
                reason: action.reason,
                priority: priority,
                referencedCase: referencedCase
            )
        }
    }
}

// MARK: - Request DTO (DashboardContext) — server 가 industryCategoryId + storeName 만 검증

/// 클라이언트가 채워 보내는 최소 컨텍스트. server `enrichDashboardContext()` 가 나머지를 enrich.
/// 모든 필드 optional 처리한 이유: nil 인 필드는 server 에서 industry default 로 추정.
public struct AIDashboardContext: Sendable, Encodable {
    // ── 필수 ──
    public var industryCategoryId: String
    public var storeName: String
    public var industryLabel: String

    // ── 사장님이 알려줄 수 있는 운영 데이터 ──
    public var industrySubIndustryId: String?
    public var monthlySales: Int               // 원
    public var monthlyCosts: AIDashboardMonthlyCosts
    public var weeklyChange: Double            // % (지난주 대비)
    public var primeRate: Double               // 0~1 (식자재+인건비/매출)
    public var runway: Double                  // 개월 (음수 = 과거 흑자)
    public var hasEmployees: Bool
    public var employeeCount: Int
    public var businessHealthScore: String     // "healthy" | "caution" | "danger" | "unknown"
    public var daysSinceLaunch: Int

    public var operatingPhase: String?         // "pre-launch" | "early" | "growth" | "mature"
    public var salesTrendDirection: String?    // "improving" | "declining" | "stable" | "insufficient"

    public var pendingTaxEvents: [String]
    public var lowStockItems: [String]
    public var upcomingFixedExpenses: [String]

    public init(
        industryCategoryId: String,
        storeName: String,
        industryLabel: String,
        industrySubIndustryId: String? = nil,
        monthlySales: Int = 0,
        monthlyCosts: AIDashboardMonthlyCosts = .init(),
        weeklyChange: Double = 0,
        primeRate: Double = 0,
        runway: Double = 0,
        hasEmployees: Bool = false,
        employeeCount: Int = 0,
        businessHealthScore: String = "unknown",
        daysSinceLaunch: Int = 0,
        operatingPhase: String? = nil,
        salesTrendDirection: String? = nil,
        pendingTaxEvents: [String] = [],
        lowStockItems: [String] = [],
        upcomingFixedExpenses: [String] = []
    ) {
        self.industryCategoryId = industryCategoryId
        self.storeName = storeName
        self.industryLabel = industryLabel
        self.industrySubIndustryId = industrySubIndustryId
        self.monthlySales = monthlySales
        self.monthlyCosts = monthlyCosts
        self.weeklyChange = weeklyChange
        self.primeRate = primeRate
        self.runway = runway
        self.hasEmployees = hasEmployees
        self.employeeCount = employeeCount
        self.businessHealthScore = businessHealthScore
        self.daysSinceLaunch = daysSinceLaunch
        self.operatingPhase = operatingPhase
        self.salesTrendDirection = salesTrendDirection
        self.pendingTaxEvents = pendingTaxEvents
        self.lowStockItems = lowStockItems
        self.upcomingFixedExpenses = upcomingFixedExpenses
    }
}

/// iOS `IndustryCategory` (restaurant/cafe/startupTech …) → web SSOT id (food/cafe-dessert/startup-tech …).
/// AI dashboard/actions API 는 web raw value 를 기대.
public func webCategoryId(from category: IndustryCategory) -> String {
    switch category {
    case .restaurant:    return "food"
    case .cafe:          return "cafe-dessert"
    case .beauty:        return "beauty"
    case .retail:        return "retail"
    case .ecommerce:     return "ecommerce"
    case .fitness:       return "fitness"
    case .education:     return "education"
    case .pet:           return "pet"
    case .livingService: return "living-service"
    case .space:         return "space"
    case .startupTech:   return "startup-tech"
    case .general:       return "general"
    }
}

public struct AIDashboardMonthlyCosts: Sendable, Encodable {
    public var ingredients: Int
    public var labor: Int
    public var rent: Int
    public var utilities: Int
    public var other: Int

    public init(ingredients: Int = 0, labor: Int = 0, rent: Int = 0, utilities: Int = 0, other: Int = 0) {
        self.ingredients = ingredients
        self.labor = labor
        self.rent = rent
        self.utilities = utilities
        self.other = other
    }
}

// MARK: - Errors

public enum AIDashboardActionsRepositoryError: LocalizedError, Sendable {
    case network(URLError)
    case httpStatus(Int, String?)
    case decoding(String)
    case rateLimited(String)

    public var errorDescription: String? {
        switch self {
        case .network(let e): return "네트워크 오류: \(e.localizedDescription)"
        case .httpStatus(let code, let body): return "서버 오류 (\(code))\(body.map { ": \($0)" } ?? "")"
        case .decoding(let msg): return "응답 해석 실패: \(msg)"
        case .rateLimited(let msg): return msg
        }
    }
}

// MARK: - Repository

public actor AIDashboardActionsRepository {

    private let supabase: SupabaseClient
    private let baseURL: URL
    private let urlSession: URLSession

    public init(
        supabase: SupabaseClient,
        // ⚠️ 2026-05-25: foundone.dev DNS A 레코드 미설정. MarketingRepository 와 동일 fallback.
        baseURL: URL = URL(string: "https://foundone.dev")!,
        urlSession: URLSession = .shared
    ) {
        self.supabase = supabase
        self.baseURL = baseURL
        self.urlSession = urlSession
    }

    /// AI 가 사장님 매장 컨텍스트로 오늘의 액션 3개 + 위기 알림 + 인사이트 생성.
    /// 매일 1회만 호출 권장 — server 측 24h KST 캐시 + rate limit (30/day) 적용.
    public func fetchActions(context: AIDashboardContext) async throws -> AIDashboardActionsResponse {
        let req = try await jsonRequest(
            path: "/api/ai/dashboard/actions",
            method: "POST",
            body: context,
            // server maxDuration 60s — 여유 5s 더 줘서 client timeout 65s
            timeoutSec: 65
        )
        return try await perform(req)
    }

    // MARK: - Helpers (Marketing/Funding Repository 와 동일 패턴)

    private func jsonRequest<Body: Encodable>(
        path: String,
        method: String,
        body: Body,
        timeoutSec: TimeInterval
    ) async throws -> URLRequest {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.timeoutInterval = timeoutSec
        // /api/ai/dashboard/actions 는 requireApiUser → 인증 필수.
        try await attachAuth(&req)
        req.httpBody = try JSONEncoder().encode(body)
        return req
    }

    private func attachAuth(_ req: inout URLRequest) async throws {
        let session = try await supabase.auth.session
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
    }

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await urlSession.data(for: request)
        } catch let urlError as URLError {
            throw AIDashboardActionsRepositoryError.network(urlError)
        } catch {
            throw AIDashboardActionsRepositoryError.network(URLError(.unknown))
        }
        guard let http = response as? HTTPURLResponse else {
            throw AIDashboardActionsRepositoryError.httpStatus(0, nil)
        }
        // 429 rate limit — 사용자에게 친절 메시지
        if http.statusCode == 429 {
            let bodyStr = String(data: data, encoding: .utf8) ?? "AI 사용량 초과"
            throw AIDashboardActionsRepositoryError.rateLimited(bodyStr)
        }
        guard (200...299).contains(http.statusCode) else {
            let bodyStr = String(data: data, encoding: .utf8)
            throw AIDashboardActionsRepositoryError.httpStatus(http.statusCode, bodyStr)
        }
        do {
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: data)
        } catch {
            throw AIDashboardActionsRepositoryError.decoding(error.localizedDescription)
        }
    }
}
