//
//  FundingRepository.swift — 펀딩(정책자금·창업지원) 매칭 + AI 점수 평가
//
//  웹 API 경유 (단일 진실 출처):
//   • POST /api/funding/match          — 매칭 알고리즘 (결정론적, packages/shared)
//   • POST /api/ai/funding/score       — AI 평가 점수 (OpenAI gpt-5.4-mini, 일 20회/분당 5회)
//
//  웹 GuidesView.tsx 가 packages/shared 의 startupPrograms 79개 + getMatchedProgramsV2 를
//  직접 import 하는 것과 동일한 결과를 보장한다. iOS 는 직접 import 못 하므로 서버 경유.
//
//  Repository 패턴은 FunnelConnectionRepository 와 동일 (Bearer + JSON).
//

import Foundation
import Supabase
import FoundOneCore

// MARK: - Public DTOs

/// 매칭된 펀딩 프로그램 — 서버가 language(ko/en) 미리 resolve 후 string 으로 내려준다.
public struct FundingProgram: Sendable, Decodable, Identifiable, Hashable {
    public let id: String
    public let category: String                // "government" | "private" | "local" | "corporate" | "competition"
    public let name: String
    public let organizer: String
    public let target: String
    public let benefit: String
    public let amount: String?
    public let season: String
    public let url: String
    /// 앱 내부 신청형 — true 면 외부 URL 대신 앱 안에서 "신청하기" 플로우(현 사업체 즉시 신청).
    public var internalApply: Bool = false
    public let forSmallBiz: Bool
    public let forFranchise: Bool
    public let highlight: Bool
    public let dataYear: String
    public let applicationStatus: String       // "open" | "upcoming" | "closed"
    public let applicationDeadline: String?    // ISO YYYY-MM-DD
    public let requiredDocs: [String]
    public let fundingType: String?            // "cash" | "equity" | "grant" | "credit" | "other"
    public let loanDetails: FundingLoanDetails?
    public let policyFundSubCategory: String?
    public let matchScore: Int
    public let personalFitScore: Int
    public let eligible: Bool
    public let daysUntilDeadline: Int?
    public let matchReasons: [FundingMatchReason]

    public init(
        id: String, category: String, name: String, organizer: String, target: String,
        benefit: String, amount: String?, season: String, url: String, internalApply: Bool = false,
        forSmallBiz: Bool, forFranchise: Bool, highlight: Bool, dataYear: String,
        applicationStatus: String, applicationDeadline: String?, requiredDocs: [String],
        fundingType: String?, loanDetails: FundingLoanDetails?, policyFundSubCategory: String?,
        matchScore: Int, personalFitScore: Int, eligible: Bool, daysUntilDeadline: Int?,
        matchReasons: [FundingMatchReason]
    ) {
        self.id = id; self.category = category; self.name = name; self.organizer = organizer
        self.target = target; self.benefit = benefit; self.amount = amount; self.season = season
        self.url = url; self.internalApply = internalApply
        self.forSmallBiz = forSmallBiz; self.forFranchise = forFranchise
        self.highlight = highlight; self.dataYear = dataYear
        self.applicationStatus = applicationStatus; self.applicationDeadline = applicationDeadline
        self.requiredDocs = requiredDocs; self.fundingType = fundingType
        self.loanDetails = loanDetails; self.policyFundSubCategory = policyFundSubCategory
        self.matchScore = matchScore; self.personalFitScore = personalFitScore
        self.eligible = eligible; self.daysUntilDeadline = daysUntilDeadline
        self.matchReasons = matchReasons
    }

    enum CodingKeys: String, CodingKey {
        case id, category, name, organizer, target, benefit, amount, season, url
        case forSmallBiz, forFranchise, highlight, dataYear
        case applicationStatus, applicationDeadline, requiredDocs
        case fundingType, loanDetails, policyFundSubCategory
        case matchScore, personalFitScore, eligible, daysUntilDeadline, matchReasons
    }
}

public struct FundingLoanDetails: Sendable, Decodable, Hashable {
    public let limitWon: Int?
    public let interestRatePctMin: Double?
    public let interestRatePctMax: Double?
    public let termMonths: Int?

    public init(limitWon: Int? = nil, interestRatePctMin: Double? = nil, interestRatePctMax: Double? = nil, termMonths: Int? = nil) {
        self.limitWon = limitWon
        self.interestRatePctMin = interestRatePctMin
        self.interestRatePctMax = interestRatePctMax
        self.termMonths = termMonths
    }
}

public struct FundingMatchReason: Sendable, Decodable, Hashable {
    public let kind: String     // "personal" | "stage" | "size" | "region" | "industry" | "crisis"
    public let text: String
    public let weight: Int

    public init(kind: String, text: String, weight: Int) {
        self.kind = kind
        self.text = text
        self.weight = weight
    }
}

public struct FundingMatchStats: Sendable, Decodable, Hashable {
    public let total: Int
    public let eligible: Int
    public let open: Int
    public let upcoming: Int

    public init(total: Int, eligible: Int, open: Int, upcoming: Int) {
        self.total = total
        self.eligible = eligible
        self.open = open
        self.upcoming = upcoming
    }
}

public struct FundingMatchResponse: Sendable, Decodable {
    public let ok: Bool
    public let language: String
    public let mode: String
    public let programs: [FundingProgram]
    public let stats: FundingMatchStats
    public let generatedAt: String

    public init(ok: Bool, language: String, mode: String, programs: [FundingProgram], stats: FundingMatchStats, generatedAt: String) {
        self.ok = ok
        self.language = language
        self.mode = mode
        self.programs = programs
        self.stats = stats
        self.generatedAt = generatedAt
    }
}

// MARK: - Criteria

/// 매칭 입력 — DashboardStore + BusinessProfileStore 에서 채워서 보냄.
/// 누락된 필드는 매칭에서 무가산 (eligible 판단에만 hard filter 영향).
public struct FundingMatchCriteria: Sendable, Encodable {
    public var startupType: String?              // "independent" | "franchise"
    public var industryCategoryId: String?
    public var subIndustryId: String?
    public var age: Int?
    public var businessYears: Int?
    public var region: String?
    public var capital: Int?
    public var businessStage: String?            // "pre-startup" | "early" | "growth" | "established"
    public var runwayMonths: Double?
    public var weeklySalesChangePct: Double?
    public var employeesCount: Int?
    public var monthlyAvgRevenue: Int?
    public var hasUserSales: Bool?
    public var ncbScore: Int?
    public var consideringClosure: Bool?
    public var salesDeclinePct: Double?
    public var isDisabledOwner: Bool?

    public init(
        startupType: String? = nil,
        industryCategoryId: String? = nil,
        subIndustryId: String? = nil,
        age: Int? = nil,
        businessYears: Int? = nil,
        region: String? = nil,
        capital: Int? = nil,
        businessStage: String? = nil,
        runwayMonths: Double? = nil,
        weeklySalesChangePct: Double? = nil,
        employeesCount: Int? = nil,
        monthlyAvgRevenue: Int? = nil,
        hasUserSales: Bool? = nil,
        ncbScore: Int? = nil,
        consideringClosure: Bool? = nil,
        salesDeclinePct: Double? = nil,
        isDisabledOwner: Bool? = nil
    ) {
        self.startupType = startupType
        self.industryCategoryId = industryCategoryId
        self.subIndustryId = subIndustryId
        self.age = age
        self.businessYears = businessYears
        self.region = region
        self.capital = capital
        self.businessStage = businessStage
        self.runwayMonths = runwayMonths
        self.weeklySalesChangePct = weeklySalesChangePct
        self.employeesCount = employeesCount
        self.monthlyAvgRevenue = monthlyAvgRevenue
        self.hasUserSales = hasUserSales
        self.ncbScore = ncbScore
        self.consideringClosure = consideringClosure
        self.salesDeclinePct = salesDeclinePct
        self.isDisabledOwner = isDisabledOwner
    }
}

// MARK: - AI Score DTOs

public struct FundingScoreBreakdown: Sendable, Decodable, Hashable {
    public let item: String
    public let weight: Int
    public let itemScore: Int
    public let reason: String
}

public struct FundingScoreResult: Sendable, Decodable {
    public let score: Int
    public let level: String        // "high" | "medium" | "low"
    public let framework: String
    public let passingScore: Int
    public let headline: String
    public let breakdown: [FundingScoreBreakdown]
    public let strengths: [String]
    public let weaknesses: [String]
    public let improvements: [String]
    public let verdict: String
    public let bonusEligible: [String]
    public let disqualified: [String]
}

public struct FundingScoreResponse: Sendable, Decodable {
    public let ok: Bool
    public let result: FundingScoreResult
    public let remaining: Int?
}

/// 사장님 풍부한 컨텍스트 — AI 점수 평가용. nil 필드는 보내지 않음.
public struct FundingScoreUserContext: Sendable, Encodable {
    public var storeName: String?
    public var mission: String?
    public var shortDescription: String?
    public var industryCategoryId: String?
    public var subIndustryId: String?
    public var selectedSpecialtyId: String?
    public var startupType: String?
    public var region: String?
    public var addressRoad: String?
    public var age: Int?
    public var businessYears: Int?
    public var daysSinceLaunch: Int?
    public var bizRegistrationDate: String?
    public var hasBizRegistration: Bool?
    public var capital: Int?
    public var currentBalanceKrw: Int?
    public var runwayMonths: Double?
    public var avgDailySales: Int?
    public var weeklySalesChangePct: Double?
    public var monthlyAvgRevenue: Int?
    public var hasUserSales: Bool?
    public var monthlyCosts: FundingMonthlyCostsBreakdown?
    public var totalMonthlyCost: Int?
    public var monthlyProfit: Int?
    public var primeRatePct: Double?
    public var employeesCount: Int?
    public var fourInsuranceEstablished: Bool?
    public var customerInterviewCount: Int?
    public var productsCount: Int?
    public var hasMVP: Bool?
    public var marketingCampaignsCount: Int?
    public var marketingMonthlyBudget: Int?
    public var taxType: String?             // "general" | "simplified" | "exempt"
    public var hasNorangusan: Bool?
    public var matchScore: Int?
    public var eligible: Bool?

    public init() {}
}

public struct FundingMonthlyCostsBreakdown: Sendable, Encodable {
    public var ingredients: Int?
    public var labor: Int?
    public var rent: Int?
    public var utilities: Int?
    public var sga: Int?
    public var marketing: Int?
    public var other: Int?
    public var interest: Int?
    public init() {}
}

/// AI 점수 평가에 필요한 프로그램 정보 — 매칭 결과에서 추출해 보냄.
public struct FundingScoreProgramInput: Sendable, Encodable {
    public let name: String
    public let organizer: String
    public let category: String
    public let target: String
    public let benefit: String
    public let amount: String?
    public let season: String?
    public let requiredDocs: [String]?
    public let eligibility: [String]?

    public init(
        name: String,
        organizer: String,
        category: String,
        target: String,
        benefit: String,
        amount: String?,
        season: String?,
        requiredDocs: [String]?,
        eligibility: [String]?
    ) {
        self.name = name
        self.organizer = organizer
        self.category = category
        self.target = target
        self.benefit = benefit
        self.amount = amount
        self.season = season
        self.requiredDocs = requiredDocs
        self.eligibility = eligibility
    }
}

// MARK: - Errors

public enum FundingRepositoryError: LocalizedError, Sendable {
    case notAuthenticated
    case invalidURL
    case network(URLError)
    case httpStatus(Int, String?)
    case rateLimited(String)            // 429 — Daily(20) or burst(5/min)
    case decoding(String)

    public var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "로그인이 필요합니다. 다시 로그인해주세요."
        case .invalidURL:
            return "주소가 잘못됐어요."
        case .network(let urlError):
            switch urlError.code {
            case .notConnectedToInternet, .networkConnectionLost:
                return "인터넷 연결을 확인해주세요."
            case .timedOut:
                return "응답이 너무 늦습니다. 잠시 후 다시 시도해주세요."
            default:
                return "네트워크 오류: \(urlError.localizedDescription)"
            }
        case .httpStatus(let code, let body):
            if let body, !body.isEmpty { return "HTTP \(code) — \(body)" }
            return "HTTP \(code) 오류."
        case .rateLimited(let msg):
            return msg
        case .decoding(let msg):
            return "응답 형식이 올바르지 않습니다: \(msg)"
        }
    }
}

// MARK: - Repository

public actor FundingRepository {

    private let baseURL: URL
    private let supabase: SupabaseClient
    private let urlSession: URLSession

    public init(
        supabase: SupabaseClient,
        // ⚠️ 2026-05-25: foundone.dev DNS A 레코드 미설정 → Vercel 배포 URL 사용.
        baseURL: URL = URL(string: "https://foundone.dev")!,
        urlSession: URLSession = .shared
    ) {
        self.supabase = supabase
        self.baseURL = baseURL
        self.urlSession = urlSession
    }

    // MARK: - Match (로컬 파이프라인 — 웹 SSOT 1:1 미러)
    //
    // ⚠️ 종전엔 foundone.dev /api/funding/match HTTP 호출 (DNS 미해석 → 항상 실패).
    //   2026-05-21 로컬 처리로 전환: FoundOneCore.StartupProgramRegistry 가
    //   packages/shared/src/startup-programs.ts 와 동일 데이터(79개) + 동일
    //   getMatchedProgramsV2 알고리즘을 보유. 결정론적 결과 → 웹 결과와 일치.

    /// 전체 매칭 결과 (마감된 프로그램 제외). 디폴트 목록 정렬: 마감 임박 > 상태 > 점수.
    public func matchAll(criteria: FundingMatchCriteria, language: String = "ko") async throws -> FundingMatchResponse {
        await runLocalMatch(criteria: criteria, language: language, mode: "all", limit: nil)
    }

    /// 추천 모드 — personalFitScore 내림차순 top-N (자격 충족 + fit≥25).
    public func recommend(criteria: FundingMatchCriteria, limit: Int = 6, language: String = "ko") async throws -> FundingMatchResponse {
        await runLocalMatch(criteria: criteria, language: language, mode: "recommend", limit: limit)
    }

    private func runLocalMatch(criteria: FundingMatchCriteria, language: String, mode: String, limit: Int?) async -> FundingMatchResponse {
        let coreCriteria = StartupProgramMatchCriteria(
            startupType: criteria.startupType,
            industryCategoryId: criteria.industryCategoryId,
            subIndustryId: criteria.subIndustryId,
            age: criteria.age,
            businessYears: criteria.businessYears,
            region: criteria.region,
            capital: criteria.capital,
            businessStage: criteria.businessStage,
            runwayMonths: criteria.runwayMonths,
            weeklySalesChangePct: criteria.weeklySalesChangePct,
            employeesCount: criteria.employeesCount,
            monthlyAvgRevenue: criteria.monthlyAvgRevenue,
            hasUserSales: criteria.hasUserSales,
            ncbScore: criteria.ncbScore,
            consideringClosure: criteria.consideringClosure,
            salesDeclinePct: criteria.salesDeclinePct,
            isDisabledOwner: criteria.isDisabledOwner
        )

        let matches: [StartupProgramMatch]
        if mode == "recommend" {
            matches = StartupProgramRegistry.recommend(criteria: coreCriteria, limit: limit ?? 6)
        } else {
            // matchAll: closed 제외 (웹 SSOT 와 동일)
            matches = StartupProgramRegistry.match(criteria: coreCriteria)
                .filter { $0.program.applicationStatus != "closed" }
        }

        let programs = matches.map { Self.convert($0, language: language) }

        let stats = FundingMatchStats(
            total: matches.count,
            eligible: matches.filter { $0.eligible }.count,
            open: matches.filter { $0.program.applicationStatus == "open" }.count,
            upcoming: matches.filter { $0.program.applicationStatus == "upcoming" }.count
        )

        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime]

        return FundingMatchResponse(
            ok: true,
            language: language,
            mode: mode,
            programs: programs,
            stats: stats,
            generatedAt: iso.string(from: Date())
        )
    }

    /// StartupProgramMatch → FundingProgram (language resolve + DTO 변환)
    private static func convert(_ m: StartupProgramMatch, language: String) -> FundingProgram {
        let p = m.program
        let pick: (StartupProgramLocalized) -> String = { language == "en" ? $0.en : $0.ko }

        let docs: [String] = (p.requiredDocs ?? []).map(pick)
        let loan: FundingLoanDetails? = p.loanDetails.map {
            FundingLoanDetails(
                limitWon: $0.limitWon,
                interestRatePctMin: $0.interestRatePctMin,
                interestRatePctMax: $0.interestRatePctMax,
                termMonths: $0.termMonths
            )
        }
        let reasons = m.matchReasons.map {
            FundingMatchReason(kind: $0.kind, text: language == "en" ? $0.textEn : $0.textKo, weight: $0.weight)
        }

        return FundingProgram(
            id: p.id,
            category: p.category,
            name: pick(p.name),
            organizer: pick(p.organizer),
            target: pick(p.target),
            benefit: pick(p.benefit),
            amount: p.amount,
            season: pick(p.season),
            url: p.url,
            internalApply: p.internalApply ?? false,
            forSmallBiz: p.forSmallBiz,
            forFranchise: p.forFranchise,
            highlight: p.highlight ?? false,
            dataYear: p.dataYear ?? "",
            applicationStatus: p.applicationStatus ?? "upcoming",
            applicationDeadline: p.applicationDeadline,
            requiredDocs: docs,
            fundingType: p.fundingType,
            loanDetails: loan,
            policyFundSubCategory: p.policyFundSubCategory,
            matchScore: m.matchScore,
            personalFitScore: m.personalFitScore,
            eligible: m.eligible,
            daysUntilDeadline: m.daysUntilDeadline,
            matchReasons: reasons
        )
    }

    // MARK: - AI Score

    public func scoreProgram(
        program: FundingScoreProgramInput,
        user: FundingScoreUserContext
    ) async throws -> FundingScoreResult {
        struct Body: Encodable {
            let program: FundingScoreProgramInput
            let user: FundingScoreUserContext
        }
        let body = Body(program: program, user: user)
        let req = try await authedRequest(path: "/api/ai/funding/score", method: "POST", body: body)
        let response: FundingScoreResponse = try await perform(req)
        return response.result
    }

    // MARK: - 공고 맞춤 사업계획서 (2026-08-14, 주 2회 — 웹 FundingPlanModal 미러)

    /// POST /api/ai/business-plan/generate 의 program 모드 응답 섹션.
    public struct BusinessPlanSection: Sendable, Decodable {
        public let title: String
        public let content: String

        public init(title: String, content: String) {
            self.title = title
            self.content = content
        }
    }

    public struct BusinessPlanDraft: Sendable, Decodable {
        public let summary: String?
        public let sections: [BusinessPlanSection]

        public init(summary: String?, sections: [BusinessPlanSection]) {
            self.summary = summary
            self.sections = sections
        }
    }

    /// 로드맵 프로필 → 사업계획서 사용자 입력 (웹 PlanUserPayload 와 동일 필드).
    public struct PlanUserInput: Sendable, Encodable {
        public let industry: String
        public let subIndustry: String
        public let startupType: String
        public let businessModel: String
        public let capital: Int
        public let targetOpenDate: String
        public let location: String?
        public let language: String
        public let purpose: String

        public init(profile: FundingProfileSnapshot) {
            self.industry = profile.industryCategoryId ?? ""
            self.subIndustry = profile.subIndustryId ?? ""
            self.startupType = profile.startupType ?? "independent"
            self.businessModel = ""
            self.capital = profile.capital ?? 0
            self.targetOpenDate = profile.businessLaunchedDate ?? ""
            self.location = profile.preferredRegion
            self.language = "ko"
            self.purpose = "govt-support"
        }
    }

    /// 공고 맞춤 초안 생성 — 서버가 주 2회 한도(business-plan-program)를 집행한다(429 = 한도).
    public func generateProgramPlan(
        program: FundingProgram,
        user: PlanUserInput
    ) async throws -> BusinessPlanDraft {
        struct ProgramContext: Encodable {
            let id: String, name: String
            let organizer: String?, category: String?, target: String?, benefit: String?
            let applicationEnd: String?
        }
        struct Body: Encodable {
            let industry: String, subIndustry: String, startupType: String, businessModel: String
            let capital: Int, targetOpenDate: String
            let location: String?, language: String, purpose: String
            let program: ProgramContext
        }
        let body = Body(
            industry: user.industry, subIndustry: user.subIndustry, startupType: user.startupType,
            businessModel: user.businessModel, capital: user.capital, targetOpenDate: user.targetOpenDate,
            location: user.location, language: user.language, purpose: user.purpose,
            program: ProgramContext(
                id: program.id, name: program.name, organizer: program.organizer,
                category: program.category, target: program.target, benefit: program.benefit,
                applicationEnd: program.applicationDeadline
            )
        )
        // 사업계획서는 장문 생성 — 서버 maxDuration 120s 에 맞춰 타임아웃 확장
        let req = try await authedRequest(path: "/api/ai/business-plan/generate", method: "POST", body: body, timeout: 130)
        let draft: BusinessPlanDraft = try await perform(req)
        return draft
    }

    // MARK: - Helpers

    private func authedRequest<Body: Encodable>(path: String, method: String, body: Body, timeout: TimeInterval = 45) async throws -> URLRequest {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.timeoutInterval = timeout   // AI score 45s / 사업계획서 130s
        try await attachAuth(&req)
        let encoder = JSONEncoder()
        encoder.outputFormatting = []
        req.httpBody = try encoder.encode(body)
        return req
    }

    private func attachAuth(_ req: inout URLRequest) async throws {
        let session: Session
        do {
            session = try await supabase.auth.session
        } catch {
            throw FundingRepositoryError.notAuthenticated
        }
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
    }

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await urlSession.data(for: request)
        } catch let urlError as URLError {
            throw FundingRepositoryError.network(urlError)
        } catch {
            throw FundingRepositoryError.network(URLError(.unknown))
        }

        guard let http = response as? HTTPURLResponse else {
            throw FundingRepositoryError.httpStatus(0, nil)
        }

        // 429 — rate limit (Daily 20 or burst 5/min)
        if http.statusCode == 429 {
            let msg: String = {
                if let errBody = try? JSONDecoder().decode(ServerError.self, from: data),
                   let m = errBody.error, !m.isEmpty { return m }
                return "AI 평가 한도에 도달했어요. 잠시 후 다시 시도해주세요."
            }()
            throw FundingRepositoryError.rateLimited(msg)
        }

        guard (200...299).contains(http.statusCode) else {
            if let errBody = try? JSONDecoder().decode(ServerError.self, from: data) {
                throw FundingRepositoryError.httpStatus(http.statusCode, errBody.error)
            }
            let bodyStr = String(data: data, encoding: .utf8)
            throw FundingRepositoryError.httpStatus(http.statusCode, bodyStr)
        }

        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw FundingRepositoryError.decoding(error.localizedDescription)
        }
    }

    private struct ServerError: Decodable {
        let error: String?
    }
}
