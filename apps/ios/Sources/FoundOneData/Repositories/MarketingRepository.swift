//
//  MarketingRepository.swift — 마케팅 사례 엔진·캠페인 통합
//
//  웹 SSOT:
//   • /api/ai/marketing/cases        — 업종 최신 성공사례·트렌드 → 내 사업 적용 plays (주 1회 캐시)
//   • /api/ai/marketing/play-progress — 플레이 "했어요" 피드백 루프
//   • user_store_data.marketing_campaigns (JSONB) — 캠페인 기록
//   • user_store_data.marketing_monthly_budget (int) — 월 예산
//
//  2026-06-10: 코칭(/coach)·트렌드(/trends) endpoint 는 사례 엔진(/cases)으로 통합 — 관련 DTO/메서드 제거.
//  cases endpoint 는 공개 (auth 불필요) 지만 Bearer 첨부해 telemetry/일관성 유지.
//

import Foundation
import Supabase
import FoundOneCore

// MARK: - DTOs

public struct CampaignRecord: Sendable, Codable, Identifiable, Hashable {
    public var id: String
    public var channel: String       // MarketingChannel raw value
    public var month: String         // "YYYY-MM"
    public var spend: Int            // 원
    public var attributedRevenue: Int?
    public var note: String?

    public init(id: String = UUID().uuidString, channel: String, month: String, spend: Int, attributedRevenue: Int? = nil, note: String? = nil) {
        self.id = id
        self.channel = channel
        self.month = month
        self.spend = spend
        self.attributedRevenue = attributedRevenue
        self.note = note
    }
}

public struct MarketingChannelMeta: Sendable, Hashable {
    public let key: String
    public let labelKo: String
    public let labelEn: String
    public let colorHex: String

    public static let all: [MarketingChannelMeta] = [
        .init(key: "naver-place",   labelKo: "네이버 플레이스",  labelEn: "Naver Place",   colorHex: "#059669"),
        .init(key: "instagram",     labelKo: "인스타그램",       labelEn: "Instagram",     colorHex: "#e1306c"),
        .init(key: "delivery-ads",  labelKo: "배달앱 광고",      labelEn: "Delivery Ads",  colorHex: "#2ac1bc"),
        .init(key: "naver-keyword", labelKo: "네이버 키워드",    labelEn: "Naver Keyword", colorHex: "#03c75a"),
        .init(key: "daangn",        labelKo: "당근마켓",         labelEn: "Daangn",        colorHex: "#ff7e36"),
        .init(key: "blog-review",   labelKo: "블로그·체험단",     labelEn: "Blog Review",   colorHex: "#2563eb"),
        .init(key: "kakao",         labelKo: "카카오톡 채널",    labelEn: "KakaoTalk",     colorHex: "#fee500"),
        .init(key: "google-ads",    labelKo: "구글 애즈",        labelEn: "Google Ads",    colorHex: "#4285f4"),
        .init(key: "meta-ads",      labelKo: "Meta 광고",        labelEn: "Meta Ads",      colorHex: "#1877f2"),
        .init(key: "offline",       labelKo: "오프라인 (전단지 등)", labelEn: "Offline",   colorHex: "#64748b"),
    ]

    public static func meta(for key: String) -> MarketingChannelMeta? {
        all.first { $0.key == key }
    }

    /// 업종별 추천 채널 (우선순위 순).
    ///  SSOT = packages/shared/src/marketing-channels.ts (RECOMMENDED_CHANNELS).
    ///  드리프트는 marketing-channels-ios-sync.test.ts 가 이 파일을 파싱해 CI 에서 차단.
    public static func recommendedChannels(for industryCategoryId: String?) -> [String] {
        switch industryCategoryId {
        case "food":            return ["naver-place", "delivery-ads", "instagram", "daangn", "blog-review"]
        case "cafe-dessert":    return ["instagram", "blog-review", "naver-place", "daangn"]
        case "retail":          return ["daangn", "naver-keyword", "instagram"]
        case "beauty":          return ["naver-place", "blog-review", "kakao", "instagram"]
        case "pet":             return ["naver-place", "blog-review", "kakao", "instagram"]
        case "fitness":         return ["daangn", "instagram", "naver-place", "kakao"]
        case "education":       return ["daangn", "instagram", "naver-place", "kakao"]
        case "space":           return ["naver-place", "instagram", "daangn"]
        case "online-digital":  return ["naver-keyword", "meta-ads", "instagram", "google-ads"]
        case "startup-tech":    return ["meta-ads", "google-ads", "instagram", "blog-review"]
        case "living-service":  return ["daangn", "naver-place", "kakao"]
        default:                return ["naver-place", "instagram", "kakao", "daangn"]
        }
    }

    /// SF Symbol icon name 매핑 (웹은 lucide icons — 가까운 SF Symbol 로 변환).
    public var iconSystemName: String {
        switch key {
        case "naver-place":   return "mappin.circle.fill"
        case "instagram":     return "camera.fill"
        case "delivery-ads":  return "bicycle"
        case "naver-keyword": return "magnifyingglass.circle.fill"
        case "daangn":        return "carrot"
        case "blog-review":   return "pencil.line"
        case "kakao":         return "bubble.left.fill"
        case "google-ads":    return "globe"
        case "meta-ads":      return "rectangle.stack.badge.plus"
        case "offline":       return "doc.text.fill"
        default:              return "tag.fill"
        }
    }
}

// MARK: - Errors

public enum MarketingRepositoryError: LocalizedError, Sendable {
    case notAuthenticated
    case network(URLError)
    case httpStatus(Int, String?)
    case decoding(String)

    public var errorDescription: String? {
        switch self {
        case .notAuthenticated: return "로그인이 필요합니다."
        case .network(let urlError):
            switch urlError.code {
            case .notConnectedToInternet, .networkConnectionLost:
                return "인터넷 연결을 확인해주세요."
            case .timedOut:
                return "응답이 너무 늦습니다."
            default:
                return "네트워크 오류: \(urlError.localizedDescription)"
            }
        case .httpStatus(let code, let body):
            // 웹 humanizeAiError 패리티 — raw json/HTTP 코드 대신 한국어 안내.
            //   raw 에 API 키·청구 정보 포함 가능 → 그대로 노출 금지.
            let lower = (body ?? "").lowercased()
            if code == 429 || (lower.contains("rate") && (lower.contains("limit") || lower.contains("exceeded"))) {
                return "AI 호출이 잠시 몰렸어요. 1분 뒤 다시 시도해주세요."
            }
            if lower.contains("daily") && lower.contains("limit") {
                return "오늘 사용량 한도에 도달했어요. 내일 다시 시도해주세요."
            }
            if code == 402 || lower.contains("credit balance") || lower.contains("billing") || lower.contains("payment_required") {
                return "AI 일시 중단 — 관리자에게 문의해주세요 (서비스 점검 중)."
            }
            if code == 529 || lower.contains("overloaded") {
                return "AI 서버 일시 과부하. 잠시 후 다시 시도해주세요."
            }
            if code == 401 || lower.contains("authentication") || lower.contains("invalid api") {
                return "AI 인증 오류 — 관리자에게 문의해주세요."
            }
            return "AI 응답을 받지 못했어요. 잠시 후 다시 시도해주세요."
        case .decoding(let msg): return "응답 형식 오류: \(msg)"
        }
    }
}

// MARK: - Coach Context

public struct MarketingCoachContext: Sendable, Encodable {
    public var storeName: String?
    public var industryCategoryId: String?
    public var subIndustryId: String?
    public var subIndustryLabel: String?
    public var monthlyRevenueWon: Int?
    public var monthlySpendWon: Int?
    public var blendedRoas: Double?
    public var activeChannels: [String]?
    public var currentStageLabel: String?
    public var launchDate: String?
    public var language: String?
    /// 매출 데이터 유무 — cases 엔진이 "돈 적게 드는 플레이 우선" 판단에 사용.
    public var hasUserSales: Bool?
    /// 최근 매출 추세(%, 최근 vs 직전) — 피드백 루프(지난주 실행 후 숫자 변화) 반영.
    public var salesTrendPct: Double?
    /// true → 서버가 Supabase 캐시 무시하고 LLM 재생성 (사용자 "재생성" 버튼).
    public var force: Bool?

    public init() {}
}

// MARK: - Marketing Cases (성공사례·트렌드 → 내 사업 적용)

public struct PlayTool: Sendable, Decodable, Hashable {
    public let name: String
    public let purpose: String
    public let tier: String          // "free" | "paid" | "freemium"
    public let url: String?
}

public struct PlaySource: Sendable, Decodable, Hashable {
    public let brand: String?
    public let whatHappened: String
    public let whyItWorked: String
    public let metric: String?
    public let url: String?
}

public struct PlayApplication: Sendable, Decodable, Hashable {
    public let steps: [String]
    public let expectedEffect: String
    public let effortLevel: String   // "low" | "medium" | "high"
}

public struct MarketingPlay: Sendable, Decodable, Identifiable, Hashable {
    public var id: String { "\(kind)-\(title)" }
    public let kind: String          // "case" | "trend"
    public let title: String
    public let source: PlaySource
    public let application: PlayApplication
    public let tools: [PlayTool]
}

public struct CasesSourceItem: Sendable, Decodable, Hashable {
    public let name: String
    public let url: String
}

public struct CasesResponse: Sendable, Decodable {
    public let plays: [MarketingPlay]
    public let sources: [CasesSourceItem]?
    public let cached: Bool?
    public let weekKey: String?
    public let error: String?
}

struct PlayProgressResponse: Decodable { let done: [String] }

// MARK: - Repository

public actor MarketingRepository {

    private let supabase: SupabaseClient
    private let userId: UUID
    private let baseURL: URL
    private let urlSession: URLSession

    public init(
        supabase: SupabaseClient,
        userId: UUID,
        // ⚠️ 2026-05-25: foundone.dev 은 도메인은 보유 중이나 DNS A 레코드 미설정 → resolve 실패.
        //   Vercel 배포 URL 로 변경. foundone.dev 도메인 연결 완료 후 다시 변경 가능.
        //   BUEnvironment.webAppURL 을 받도록 리팩토링하면 환경별 분기 가능.
        baseURL: URL = URL(string: "https://foundone.dev")!,
        urlSession: URLSession = .shared
    ) {
        self.supabase = supabase
        self.userId = userId
        self.baseURL = baseURL
        self.urlSession = urlSession
    }

    // MARK: - Cases (성공사례·트렌드 → 내 사업 적용)

    public func fetchCases(context: MarketingCoachContext) async throws -> CasesResponse {
        var ctx = context
        if ctx.language == nil { ctx.language = "ko" }
        let req = try await jsonRequest(path: "/api/ai/marketing/cases", method: "POST", body: ctx, timeoutSec: 75)
        let resp: CasesResponse = try await perform(req)
        if let err = resp.error, !err.isEmpty, resp.plays.isEmpty {
            throw MarketingRepositoryError.httpStatus(500, err)
        }
        return resp
    }

    // MARK: - Play progress ("했어요" 피드백 루프)

    /// 이번 주 완료한 플레이 제목 목록. 실패 시 빈 배열.
    public func playProgress(weekKey: String) async -> [String] {
        guard var comps = URLComponents(url: baseURL.appendingPathComponent("/api/ai/marketing/play-progress"), resolvingAgainstBaseURL: false) else { return [] }
        comps.queryItems = [URLQueryItem(name: "weekKey", value: weekKey)]
        guard let url = comps.url else { return [] }
        var req = URLRequest(url: url)
        req.httpMethod = "GET"
        req.timeoutInterval = 20
        do {
            try await attachAuth(&req)
            let resp: PlayProgressResponse = try await perform(req)
            return resp.done
        } catch {
            return []
        }
    }

    /// 플레이 "했어요" 체크/해제. best-effort.
    public func setPlayDone(weekKey: String, title: String, done: Bool) async {
        struct Body: Encodable { let weekKey: String; let playTitle: String; let done: Bool }
        guard let req = try? await jsonRequest(
            path: "/api/ai/marketing/play-progress", method: "POST",
            body: Body(weekKey: weekKey, playTitle: title, done: done), timeoutSec: 20
        ) else { return }
        let _: PlayProgressResponse? = try? await perform(req)
    }

    // MARK: - Campaigns (Supabase user_store_data 직접)

    public func listCampaigns() async throws -> (campaigns: [CampaignRecord], monthlyBudget: Int) {
        let rows: [MarketingDataRow] = try await supabase
            .from("user_store_data")
            .select("marketing_campaigns, marketing_monthly_budget")
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value
        let row = rows.first
        let campaigns = row?.marketing_campaigns ?? []
        let budget = row?.marketing_monthly_budget ?? 0
        return (campaigns, budget)
    }

    public func saveCampaigns(_ campaigns: [CampaignRecord], monthlyBudget: Int?) async throws {
        // upsert keyed by user_id (user_store_data 는 user_id 기준 유일)
        let payload = CampaignsUpsert(
            user_id: userId,
            marketing_campaigns: campaigns,
            marketing_monthly_budget: monthlyBudget
        )
        _ = try await supabase
            .from("user_store_data")
            .upsert(payload, onConflict: "user_id")
            .execute()
    }

    public func addCampaign(_ campaign: CampaignRecord) async throws -> [CampaignRecord] {
        var (campaigns, budget) = try await listCampaigns()
        campaigns.append(campaign)
        try await saveCampaigns(campaigns, monthlyBudget: budget)
        return campaigns
    }

    public func deleteCampaign(id: String) async throws -> [CampaignRecord] {
        var (campaigns, budget) = try await listCampaigns()
        campaigns.removeAll { $0.id == id }
        try await saveCampaigns(campaigns, monthlyBudget: budget)
        return campaigns
    }

    // MARK: - KPI helpers (campaigns 기반)

    public static func currentMonthKey(now: Date = Date(), timeZone: TimeZone = TimeZone(identifier: "Asia/Seoul")!) -> String {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        let comps = cal.dateComponents([.year, .month], from: now)
        return String(format: "%04d-%02d", comps.year ?? 2026, comps.month ?? 1)
    }

    public static func computeKpis(from campaigns: [CampaignRecord], month: String? = nil) -> MarketingKpis {
        let target = month ?? Self.currentMonthKey()
        let monthCamps = campaigns.filter { $0.month == target }
        let spend = monthCamps.reduce(0) { $0 + $1.spend }
        let rev = monthCamps.reduce(0) { $0 + ($1.attributedRevenue ?? 0) }
        let roas = spend > 0 ? Double(rev) / Double(spend) : 0
        let active = Set(monthCamps.map(\.channel)).count
        return MarketingKpis(month: target, spendWon: spend, attributedRevenueWon: rev, blendedRoas: roas, activeChannels: active)
    }

    // MARK: - Helpers

    private func jsonRequest<Body: Encodable>(path: String, method: String, body: Body, timeoutSec: TimeInterval) async throws -> URLRequest {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.timeoutInterval = timeoutSec
        try? await attachAuth(&req)  // 공개 endpoint 라 실패 OK
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
            throw MarketingRepositoryError.network(urlError)
        } catch {
            throw MarketingRepositoryError.network(URLError(.unknown))
        }
        guard let http = response as? HTTPURLResponse else {
            throw MarketingRepositoryError.httpStatus(0, nil)
        }
        guard (200...299).contains(http.statusCode) else {
            let bodyStr = String(data: data, encoding: .utf8)
            throw MarketingRepositoryError.httpStatus(http.statusCode, bodyStr)
        }
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw MarketingRepositoryError.decoding(error.localizedDescription)
        }
    }
}

// MARK: - KPI struct

public struct MarketingKpis: Sendable, Hashable {
    public let month: String
    public let spendWon: Int
    public let attributedRevenueWon: Int
    public let blendedRoas: Double
    public let activeChannels: Int

    public init(month: String, spendWon: Int, attributedRevenueWon: Int, blendedRoas: Double, activeChannels: Int) {
        self.month = month
        self.spendWon = spendWon
        self.attributedRevenueWon = attributedRevenueWon
        self.blendedRoas = blendedRoas
        self.activeChannels = activeChannels
    }
}

// MARK: - Supabase row DTO

private struct MarketingDataRow: Decodable, Sendable, Hashable {
    let marketing_campaigns: [CampaignRecord]?
    let marketing_monthly_budget: Int?
}

private struct CampaignsUpsert: Encodable, Sendable {
    let user_id: UUID
    let marketing_campaigns: [CampaignRecord]
    let marketing_monthly_budget: Int?
}
