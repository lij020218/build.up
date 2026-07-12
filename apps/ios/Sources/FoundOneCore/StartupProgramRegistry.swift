//
//  StartupProgramRegistry.swift — 청년·소상공인 창업 지원 프로그램 92개.
//
//  웹 SSOT: packages/shared/src/startup-programs.ts (startupPrograms + getMatchedProgramsV2)
//
//  데이터 소스:
//    Resources/startup-programs.json — TS 에서 자동 추출.
//    Pre-Startup Package, TIPS, 소상공인 정책자금, 소상공인 도약·온라인판로·스마트상점,
//    KAIST OverEdge, 혁신소상공인 AI, 지역신보 보증, 재창업자금 등 92개.
//
//  추출 방법 (web↔iOS 동기화):
//    npx tsx scripts/gen-startup-programs-json.mts
//    ⚠️ match() 점수 로직은 손수 포팅이므로 로직 변경 시 이 파일도 직접 미러링.
//

import Foundation

// MARK: - DTOs (웹 StartupProgram 1:1 미러)

public struct StartupProgramLocalized: Decodable, Sendable, Hashable {
    public let ko: String
    public let en: String
}

public struct StartupProgramLoanDetails: Decodable, Sendable, Hashable {
    public let limitWon: Int?
    public let interestRatePctMin: Double?
    public let interestRatePctMax: Double?
    public let termMonths: Int?
}

public struct StartupProgram: Decodable, Sendable, Hashable, Identifiable {
    public let id: String
    public let category: String
    public let name: StartupProgramLocalized
    public let organizer: StartupProgramLocalized
    public let target: StartupProgramLocalized
    public let benefit: StartupProgramLocalized
    public let amount: String?
    public let season: StartupProgramLocalized
    public let url: String
    /// 앱 내부 신청형 — true 면 외부 URL 대신 앱 안에서 바로 "신청하기" 플로우(현 사업체 즉시 신청).
    public let internalApply: Bool?
    public let forSmallBiz: Bool
    public let forFranchise: Bool
    public let highlight: Bool?
    public let dataYear: String?
    public let maxAge: Int?
    public let businessYearRange: [Int]?
    public let industries: [String]?
    /// 세부업종 화이트리스트 (nil/미설정 = 세부업종 무관). 설정 시 그 세부업종에만 노출 (웹 subIndustries 미러).
    public let subIndustries: [String]?
    public let regions: [String]?
    public let applicationStatus: String?     // "open" | "upcoming" | "closed"
    public let requiredDocs: [StartupProgramLocalized]?
    public let applicationDeadline: String?
    public let fundingType: String?           // "cash" | "equity" | "grant" | "credit" | "other"
    public let loanDetails: StartupProgramLoanDetails?
    public let policyFundSubCategory: String?
    public let requiresClosure: Bool?
    public let forDisabledOwner: Bool?
    public let maxNcbScore: Int?
}

// MARK: - 매칭 입력 (웹 MatchCriteria 1:1 미러)

public struct StartupProgramMatchCriteria: Sendable {
    public var startupType: String?
    public var industryCategoryId: String?
    public var subIndustryId: String?
    public var age: Int?
    public var businessYears: Int?
    public var region: String?
    public var capital: Int?
    public var businessStage: String?
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
        startupType: String? = nil, industryCategoryId: String? = nil, subIndustryId: String? = nil, age: Int? = nil,
        businessYears: Int? = nil, region: String? = nil, capital: Int? = nil,
        businessStage: String? = nil, runwayMonths: Double? = nil, weeklySalesChangePct: Double? = nil,
        employeesCount: Int? = nil, monthlyAvgRevenue: Int? = nil, hasUserSales: Bool? = nil,
        ncbScore: Int? = nil, consideringClosure: Bool? = nil, salesDeclinePct: Double? = nil,
        isDisabledOwner: Bool? = nil
    ) {
        self.startupType = startupType; self.industryCategoryId = industryCategoryId; self.subIndustryId = subIndustryId; self.age = age
        self.businessYears = businessYears; self.region = region; self.capital = capital
        self.businessStage = businessStage; self.runwayMonths = runwayMonths
        self.weeklySalesChangePct = weeklySalesChangePct; self.employeesCount = employeesCount
        self.monthlyAvgRevenue = monthlyAvgRevenue; self.hasUserSales = hasUserSales
        self.ncbScore = ncbScore; self.consideringClosure = consideringClosure
        self.salesDeclinePct = salesDeclinePct; self.isDisabledOwner = isDisabledOwner
    }
}

// MARK: - 매칭 결과

public struct StartupProgramMatchReason: Sendable, Hashable {
    public let kind: String         // "personal" | "size" | "region" | "industry" | "crisis" | "stage"
    public let textKo: String
    public let textEn: String
    public let weight: Int
}

public struct StartupProgramMatch: Sendable {
    public let program: StartupProgram
    public let matchScore: Int          // 0-100 clamped
    public let personalFitScore: Int    // 0-100 clamped
    public let eligible: Bool
    public let daysUntilDeadline: Int?
    public let matchReasons: [StartupProgramMatchReason]  // top 4 by weight
}

// MARK: - Registry

public enum StartupProgramRegistry {

    public static let all: [StartupProgram] = loadFromBundle()

    public static func program(by id: String) -> StartupProgram? {
        all.first { $0.id == id }
    }

    // MARK: - getMatchedProgramsV2 Swift 포팅
    //
    // 웹 SSOT: packages/shared/src/startup-programs.ts:1594-1810
    // 결정론적 매칭 알고리즘 — 동일 criteria → 동일 출력 보장.
    //
    public static func match(criteria: StartupProgramMatchCriteria, today: Date = Date()) -> [StartupProgramMatch] {
        let isFranchise = criteria.startupType == "franchise"
        let isCashCrisis = (criteria.runwayMonths.map { $0 < 6 } ?? false) ||
                           (criteria.weeklySalesChangePct.map { $0 <= -15 } ?? false)
        let isUrgentCrisis = criteria.runwayMonths.map { $0 < 3 } ?? false

        let monthlyRev = criteria.monthlyAvgRevenue ?? 0
        let sizeTier: String
        if monthlyRev <= 0 || monthlyRev < 10_000_000 {
            sizeTier = "micro"
        } else if monthlyRev < 50_000_000 {
            sizeTier = "small"
        } else if monthlyRev < 300_000_000 {
            sizeTier = "medium"
        } else {
            sizeTier = "large"
        }

        let results: [StartupProgramMatch] = all.map { p in
            var score = 0
            var personalFitScore = 0
            var eligible = true
            var reasons: [StartupProgramMatchReason] = []

            // 기본 자격
            if let maxAge = p.maxAge, let age = criteria.age {
                if age > maxAge { eligible = false }
                else {
                    score += 15; personalFitScore += 15
                    reasons.append(.init(kind: "personal", textKo: "만 \(maxAge)세 이하 자격", textEn: "Age ≤\(maxAge) qualified", weight: 15))
                }
            }

            if let range = p.businessYearRange, range.count == 2, let years = criteria.businessYears {
                let mn = range[0], mx = range[1]
                if years < mn || years > mx { eligible = false }
                else {
                    score += 15; personalFitScore += 15
                    reasons.append(.init(kind: "stage", textKo: "창업 \(years)년차 조건 부합", textEn: "\(years)yr-in-biz match", weight: 15))
                }
            }

            // 사업 유형 가드
            if isFranchise && p.forFranchise == false { eligible = false }
            if !isFranchise && p.forFranchise == true && p.forSmallBiz == false { eligible = false }

            // 대상자(audience) 하드필터 (2026-06-29, 웹 startup-programs.ts V2 와 동일):
            //   forSmallBiz=false & forFranchise=false = 순수 스타트업/VC/딥테크 전용.
            //   기술 스타트업 사용자에게만 노출, 소상공인·프랜차이즈 사장님에겐 제외.
            let isTechStartupUser = criteria.industryCategoryId == "startup-tech"
            if !isTechStartupUser && p.forSmallBiz == false && p.forFranchise == false {
                eligible = false
            }

            // industries hard filter — 업종 제한이 있으면 미설정·불일치 모두 부적격
            //   (웹 match.ts 와 동일: industryCategoryId 미설정 시에도 업종 격리 프로그램은 제외)
            if let inds = p.industries, !inds.isEmpty {
                if let cid = criteria.industryCategoryId, inds.contains(cid) {
                    // 일치 — 통과
                } else {
                    eligible = false
                }
            }

            // 세부업종 하드필터 (2026-07-10, 웹 미러) — 도메인 특화(스마트공장=제조 등).
            //   subIndustryId 미전달 시 무필터(후방호환).
            if let subs = p.subIndustries, !subs.isEmpty, let sid = criteria.subIndustryId {
                if !subs.contains(sid) { eligible = false }
            }

            // 정책자금 가드
            if p.requiresClosure == true && (criteria.consideringClosure ?? false) == false { eligible = false }
            if let maxNcb = p.maxNcbScore, let ncb = criteria.ncbScore, ncb > maxNcb { eligible = false }
            if p.forDisabledOwner == true && criteria.isDisabledOwner == false { eligible = false }

            // 매칭 가산
            if isFranchise && p.forFranchise {
                score += 10; personalFitScore += 10
                reasons.append(.init(kind: "stage", textKo: "프랜차이즈 가맹점 대상", textEn: "Franchise-eligible", weight: 10))
            }
            if isFranchise && !p.forFranchise && !p.forSmallBiz { score -= 5 }
            if p.forSmallBiz {
                score += 10; personalFitScore += 10
                reasons.append(.init(kind: "size", textKo: "소상공인 지원 대상", textEn: "Small-biz program", weight: 10))
            }

            if let regs = p.regions, let userRegion = criteria.region {
                if regs.contains(where: { userRegion.contains($0) }) {
                    score += 10; personalFitScore += 10
                    reasons.append(.init(kind: "region", textKo: "\(userRegion) 지역 매칭", textEn: "\(userRegion) region", weight: 10))
                } else {
                    score -= 3
                }
            }

            if let inds = p.industries, let cid = criteria.industryCategoryId, inds.contains(cid) {
                score += 15; personalFitScore += 15
                reasons.append(.init(kind: "industry", textKo: "업종(\(cid)) 직접 매칭", textEn: "Direct industry match", weight: 15))
            }

            // 사업 규모 매칭
            if (sizeTier == "micro" || sizeTier == "small") && p.forSmallBiz {
                score += 12; personalFitScore += 12
                reasons.append(.init(kind: "size", textKo: sizeTier == "micro" ? "영세 사업자 적합" : "소규모 사업자 적합", textEn: "Fits micro/small biz", weight: 12))
            }
            if (sizeTier == "medium" || sizeTier == "large") && p.fundingType == "equity" {
                score += 10; personalFitScore += 10
                reasons.append(.init(kind: "size", textKo: "성장 단계 — 투자 유치 적합", textEn: "Growth-stage equity match", weight: 10))
            }
            if sizeTier == "medium" && (p.category == "private" || p.category == "corporate") {
                score += 6; personalFitScore += 6
                reasons.append(.init(kind: "size", textKo: "성장 단계 — 액셀러레이터·대기업 프로그램 적합", textEn: "Growth-stage — accelerator/corporate fit", weight: 6))
            }
            if sizeTier == "large" && p.fundingType == "grant" && p.category == "government" {
                score += 6; personalFitScore += 6
                reasons.append(.init(kind: "size", textKo: "규모 있는 사업 — 정부 보조금 사업 적합", textEn: "Scaled biz — government grant fit", weight: 6))
            }

            // ── 자본금(예산) 매칭 — capital 입력 실제 반영 (종전 무효 버그 수정 2026-06-05) ──
            if let cap = criteria.capital, cap > 0 {
                let isFundingSupplement = p.category == "government" &&
                    (p.fundingType == "cash" || p.fundingType == "credit" || p.fundingType == "grant")
                if isFundingSupplement {
                    if cap < 30_000_000 {
                        score += 15; personalFitScore += 15
                        reasons.append(.init(kind: "size", textKo: "창업 자본이 적어 정책자금 보완이 중요", textEn: "Low capital — policy funding important", weight: 15))
                    } else if cap < 100_000_000 {
                        score += 8; personalFitScore += 8
                        reasons.append(.init(kind: "size", textKo: "자본 보완에 정책자금 활용 권장", textEn: "Policy funding recommended to supplement capital", weight: 8))
                    }
                }
            }

            // 모집 상태
            if p.applicationStatus == "open" { score += 20 }
            else if p.applicationStatus == "upcoming" { score += 5 }
            else if p.applicationStatus == "closed" { score -= 10 }

            if p.highlight == true { score += 5 }

            // 위기 부스트
            if isCashCrisis && p.fundingType == "cash" {
                score += 30; personalFitScore += 30
                reasons.append(.init(kind: "crisis", textKo: "긴급 현금 — 현재 위기 상황에 직접 도움", textEn: "Crisis cash — direct help", weight: 30))
            }
            if isUrgentCrisis && p.fundingType == "cash" {
                score += 20; personalFitScore += 20
                reasons.append(.init(kind: "crisis", textKo: "런웨이 3개월 미만 — 즉시 현금 확보 시급", textEn: "Runway <3mo — urgent cash", weight: 20))
            }
            if isCashCrisis && p.fundingType == "credit" {
                score += 15; personalFitScore += 15
                reasons.append(.init(kind: "crisis", textKo: "보증·대출 — 단기 현금 확보 가능", textEn: "Loan/credit — short-term cash", weight: 15))
            }
            if !isCashCrisis && p.fundingType == "equity" &&
               (criteria.businessStage == "growth" || criteria.businessStage == "early") {
                score += 15; personalFitScore += 15
                let stageKo = criteria.businessStage == "growth" ? "성장" : "초기"
                reasons.append(.init(kind: "stage", textKo: "\(stageKo) 단계 — 투자 적합", textEn: "\(criteria.businessStage ?? "")-stage equity", weight: 15))
            }

            // 정책자금 세부 카테고리 부스트
            if p.policyFundSubCategory == "low-credit", let ncb = criteria.ncbScore, ncb <= 839 {
                score += 30; personalFitScore += 30
                reasons.append(.init(kind: "personal", textKo: "신용점수 NCB 839 이하 — 일반 자금 거절자도 신청 가능", textEn: "NCB ≤839 — fits low-credit fund", weight: 30))
            }
            if p.policyFundSubCategory == "refinance", let ncb = criteria.ncbScore, ncb <= 919 {
                score += 25; personalFitScore += 25
                reasons.append(.init(kind: "crisis", textKo: "기존 대출 이자 부담 시 즉시 절감 가능", textEn: "Refinance high-rate loans now", weight: 25))
            }
            if p.policyFundSubCategory == "youth" && (criteria.age ?? 999) <= 39 {
                score += 20; personalFitScore += 20
                reasons.append(.init(kind: "personal", textKo: "만 39세 이하 청년 사장님 우대 — 기준금리만 부담", textEn: "Youth-preferred rate", weight: 20))
            }
            if p.policyFundSubCategory == "closure" && (criteria.consideringClosure ?? false) {
                score += 35; personalFitScore += 35
                reasons.append(.init(kind: "crisis", textKo: "폐업 검토 중이라면 정리 부담 줄이고 재출발 가능", textEn: "Eases closure burden", weight: 35))
            }
            if p.policyFundSubCategory == "redemption" && (criteria.consideringClosure ?? false) {
                score += 25; personalFitScore += 25
                reasons.append(.init(kind: "crisis", textKo: "폐업 후 재창업 단계 — 재도전 전용 자금 우대", textEn: "Re-entry stage — redemption fund preferred", weight: 25))
            }
            if p.policyFundSubCategory == "operation", let decline = criteria.salesDeclinePct, decline > 10 {
                score += 20; personalFitScore += 20
                reasons.append(.init(kind: "crisis", textKo: "최근 매출 감소 \(Int(decline))% — 운영자금 보충 권장", textEn: "Sales down \(Int(decline))% — operating fund recommended", weight: 20))
            }
            if p.policyFundSubCategory == "growth",
               (criteria.businessYears ?? 0) >= 3,
               (criteria.monthlyAvgRevenue ?? 0) >= 5_000_000 {
                score += 15; personalFitScore += 15
                reasons.append(.init(kind: "stage", textKo: "업력 3년+ 안정 운영 → 시설·디지털 전환 투자 적기", textEn: "3yr+ stable → growth fund fit", weight: 15))
            }
            if p.forDisabledOwner == true && criteria.isDisabledOwner == true {
                score += 30; personalFitScore += 30
                reasons.append(.init(kind: "personal", textKo: "장애인 사장님 우대 금리 적용", textEn: "Disabled-owner preferred rate", weight: 30))
            }

            // 마감 임박 부스트 (정렬용)
            var daysUntilDeadline: Int? = nil
            if let dline = p.applicationDeadline,
               let deadlineDate = isoDate(dline) {
                let secs = deadlineDate.timeIntervalSince(today)
                let days = Int(ceil(secs / 86_400.0))
                daysUntilDeadline = days
                if days >= 0 && days <= 3 { score += 50 }
                else if days > 3 && days <= 7 { score += 25 }
                else if days > 7 && days <= 14 { score += 10 }
                else if days < 0 { score -= 30 }
            }

            // weight 내림차순, 상위 4개
            let topReasons = reasons.sorted { $0.weight > $1.weight }.prefix(4)

            let clampedScore = max(0, min(100, score))
            let clampedPersonal = max(0, min(100, personalFitScore))

            return StartupProgramMatch(
                program: p,
                matchScore: clampedScore,
                personalFitScore: clampedPersonal,
                eligible: eligible,
                daysUntilDeadline: daysUntilDeadline,
                matchReasons: Array(topReasons)
            )
        }

        // 마감 지난(applicationDeadline < today) · closed 프로그램 제외 (웹 isProgramExpired 패리티)
        // 정렬: 자격 → 마감 임박 (≤7d) → 상태 → 점수
        return results.filter { !programExpired($0.program, today) }.sorted { a, b in
            if a.eligible != b.eligible { return a.eligible }
            let aUrgent = (a.daysUntilDeadline.map { $0 >= 0 && $0 <= 7 } ?? false)
            let bUrgent = (b.daysUntilDeadline.map { $0 >= 0 && $0 <= 7 } ?? false)
            if aUrgent != bUrgent { return aUrgent }
            let aStatus = statusOrder(a.program.applicationStatus)
            let bStatus = statusOrder(b.program.applicationStatus)
            if aStatus != bStatus { return aStatus < bStatus }
            return a.matchScore > b.matchScore
        }
    }

    /// 추천 모드 — personalFitScore 내림차순 + (eligible && fit≥25) 필터 + top-N.
    public static func recommend(criteria: StartupProgramMatchCriteria, limit: Int = 6, today: Date = Date()) -> [StartupProgramMatch] {
        match(criteria: criteria, today: today)
            .filter { $0.eligible && $0.personalFitScore >= 25 }
            .sorted { $0.personalFitScore > $1.personalFitScore }
            .prefix(limit)
            .map { $0 }
    }

    // MARK: - helpers

    private static func statusOrder(_ s: String?) -> Int {
        switch s {
        case "open": return 0
        case "upcoming": return 1
        case "closed": return 2
        default: return 1
        }
    }

    private static func isoDate(_ s: String) -> Date? {
        // YYYY-MM-DD
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        return f.date(from: s)
    }

    /// 웹 isProgramExpired 패리티 — closed 이거나 applicationDeadline 이 지났으면 만료.
    ///   수동 status 가 "open" 이어도 마감일이 지났으면 매칭에서 제외(지난 일정 노출 방지).
    private static func programExpired(_ p: StartupProgram, _ now: Date) -> Bool {
        if p.applicationStatus == "closed" { return true }
        if let dl = p.applicationDeadline, let d = isoDate(dl), d < now { return true }
        return false
    }

    // MARK: - Bundle loader

    private static func loadFromBundle() -> [StartupProgram] {
        guard let url = Bundle.module.url(forResource: "startup-programs", withExtension: "json") else {
            #if DEBUG
            print("⚠️ startup-programs.json 번들에 누락")
            #endif
            return []
        }
        do {
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode([StartupProgram].self, from: data)
        } catch {
            #if DEBUG
            print("⚠️ startup-programs.json 디코딩 실패: \(error)")
            #endif
            return []
        }
    }
}
