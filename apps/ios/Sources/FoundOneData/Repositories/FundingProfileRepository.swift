//
//  FundingProfileRepository.swift — 펀딩 매칭/AI평가에 필요한 사장님 컨텍스트 빌더
//
//  웹 GuidesView.tsx 의 `criteria` (113–138) + AI score 의 `user` 컨텍스트 (188–280) 와
//  동일한 데이터 셰이프를 iOS 에서도 한 번에 만든다.
//
//  데이터 출처 (모두 기존 Supabase 컬럼, 추가 마이그레이션 0):
//   • business_profiles: industry_category_id, sub_industry_id, startup_type, capital,
//                        preferred_regions[]
//   • user_store_data:   store_name, business_launched(_date), daily_entries[],
//                        monthly_costs, current_balance_manual_krw, people_directory[]
//
//  파생:
//   • businessYears        = floor((today - business_launched_date) / 365)
//   • monthlyAvgRevenue    = avg(last 7 entries.sales) × 26 (영업일)
//   • runwayMonths         = max(1, cash / (monthly_cost - monthly_rev))
//   • weeklySalesChangePct = (avg7 - avgPrev7) / avgPrev7 × 100
//   • employeesCount       = people_directory.count
//   • hasUserSales         = entries.any { sales > 0 }
//

import Foundation
import Supabase
import FoundOneCore

public struct FundingProfileSnapshot: Sendable, Hashable {
    public let storeName: String?
    public let industryCategoryId: String?
    public let subIndustryId: String?
    public let startupType: String?
    public let capital: Int?
    public let preferredRegion: String?
    public let businessLaunched: Bool
    public let businessLaunchedDate: String?    // ISO YYYY-MM-DD
    public let daysSinceLaunch: Int
    public let businessYears: Int
    // 매출 신호
    public let monthlyAvgRevenue: Int?
    public let avgDailySales: Int?
    public let weeklySalesChangePct: Double?
    public let hasUserSales: Bool
    // 비용 / 런웨이
    public let monthlyCosts: MonthlyCosts?
    public let totalMonthlyCost: Int?
    public let monthlyProfit: Int?
    public let primeRatePct: Double?
    public let runwayMonths: Double?
    public let currentBalanceKrw: Int?
    // 인력
    public let employeesCount: Int
    // raw 원본 (AI score 에 활용)
    public let entriesCount: Int
}

public actor FundingProfileRepository {

    private let supabase: SupabaseClient
    private let userId: UUID

    public init(supabase: SupabaseClient, userId: UUID) {
        self.supabase = supabase
        self.userId = userId
    }

    public func loadSnapshot() async throws -> FundingProfileSnapshot {
        async let storeFuture: UserStoreDataRow? = fetchStoreData()
        async let profileFuture: BusinessProfileRow? = fetchBusinessProfile()

        let store = try await storeFuture
        let profile = try await profileFuture

        let entries = store?.daily_entries ?? []
        let costs = store?.monthly_costs
        let businessLaunched = store?.business_launched ?? false
        let businessLaunchedDate = store?.business_launched_date
        let daysSinceLaunch = Self.daysSince(businessLaunchedDate)
        let businessYears = max(0, daysSinceLaunch / 365)

        // ── 매출 ──
        let sortedEntries = entries.sorted { $0.date < $1.date }
        let last7 = Array(sortedEntries.suffix(7))
        let avgDaily: Int? = last7.isEmpty ? nil : Int(round(last7.map(\.sales).reduce(0, +) / Double(last7.count)))
        let monthlyAvgRevenue: Int? = avgDaily.flatMap { $0 > 0 ? $0 * 26 : nil }
        let hasUserSales = entries.contains { $0.sales > 0 }

        // 주간 변화율
        let weeklySalesChangePct: Double? = {
            guard entries.count >= 14 else { return nil }
            let last7 = Array(sortedEntries.suffix(7))
            let prev7 = Array(sortedEntries.suffix(14).prefix(7))
            let avg7 = last7.map(\.sales).reduce(0, +) / Double(max(1, last7.count))
            let avgPrev = prev7.map(\.sales).reduce(0, +) / Double(max(1, prev7.count))
            guard avgPrev > 0 else { return nil }
            let pct = ((avg7 - avgPrev) / avgPrev) * 100
            return (pct * 10).rounded() / 10
        }()

        // ── 비용 / 런웨이 ──
        let totalMonthlyCost: Int? = costs.map { Int($0.total) }
        let monthlyProfit: Int? = {
            guard let cost = totalMonthlyCost else { return nil }
            return (monthlyAvgRevenue ?? 0) - cost
        }()
        let primeRatePct: Double? = {
            guard let costs, costs.total > 0 else { return nil }
            // ingredients + labor = prime cost (식재료 + 인건비)
            let prime = costs.ingredients + costs.labor
            return (prime / costs.total) * 100
        }()
        let cashWon: Double? = store?.current_balance_manual_krw ?? profile?.capital.map { Double($0) }
        let currentBalanceKrw: Int? = cashWon.map { Int($0) }
        let runwayMonths: Double? = {
            guard let cash = cashWon, cash > 0, let totalCost = costs?.total, totalCost > 0 else { return nil }
            let monthlyRev = Double(monthlyAvgRevenue ?? 0)
            let burn = max(1, totalCost - monthlyRev)
            let r = cash / burn
            return (r * 10).rounded() / 10   // 한 자리 소수
        }()

        // ── 인력 ──
        let employeesCount = store?.people_directory?.count ?? 0

        // ── 지역 ──
        let preferredRegion: String? = profile?.preferred_regions?.first

        return FundingProfileSnapshot(
            storeName: Self.nonEmpty(store?.store_name),
            industryCategoryId: profile?.industry_category_id,
            subIndustryId: profile?.sub_industry_id,
            startupType: profile?.startup_type,
            capital: profile?.capital,
            preferredRegion: preferredRegion,
            businessLaunched: businessLaunched,
            businessLaunchedDate: businessLaunchedDate,
            daysSinceLaunch: daysSinceLaunch,
            businessYears: businessYears,
            monthlyAvgRevenue: monthlyAvgRevenue,
            avgDailySales: avgDaily,
            weeklySalesChangePct: weeklySalesChangePct,
            hasUserSales: hasUserSales,
            monthlyCosts: costs,
            totalMonthlyCost: totalMonthlyCost,
            monthlyProfit: monthlyProfit,
            primeRatePct: primeRatePct,
            runwayMonths: runwayMonths,
            currentBalanceKrw: currentBalanceKrw,
            employeesCount: employeesCount,
            entriesCount: entries.count
        )
    }

    /// 매칭용 criteria — FundingRepository.matchAll/recommend 의 입력.
    public static func makeCriteria(from snapshot: FundingProfileSnapshot) -> FundingMatchCriteria {
        let businessStage: String = {
            guard snapshot.businessLaunched else { return "pre-startup" }
            if snapshot.businessYears >= 3 { return "growth" }
            return "early"
        }()
        return FundingMatchCriteria(
            startupType: snapshot.startupType,
            industryCategoryId: snapshot.industryCategoryId,
            age: nil,                           // iOS 에 age 필드 없음 (스키마 미존재)
            businessYears: snapshot.businessLaunched ? snapshot.businessYears : 0,
            region: snapshot.preferredRegion,
            capital: snapshot.capital,
            businessStage: businessStage,
            runwayMonths: snapshot.runwayMonths,
            weeklySalesChangePct: snapshot.weeklySalesChangePct,
            employeesCount: snapshot.employeesCount,
            monthlyAvgRevenue: snapshot.monthlyAvgRevenue,
            hasUserSales: snapshot.hasUserSales,
            ncbScore: nil,
            consideringClosure: nil,
            salesDeclinePct: nil,
            isDisabledOwner: nil
        )
    }

    /// AI 점수 평가용 풍부 컨텍스트 — FundingRepository.scoreProgram 의 user 입력.
    public static func makeScoreContext(from snapshot: FundingProfileSnapshot, taxType: String? = nil) -> FundingScoreUserContext {
        var ctx = FundingScoreUserContext()
        ctx.storeName = snapshot.storeName
        ctx.industryCategoryId = snapshot.industryCategoryId
        ctx.subIndustryId = snapshot.subIndustryId
        ctx.startupType = snapshot.startupType
        ctx.region = snapshot.preferredRegion
        ctx.businessYears = snapshot.businessLaunched ? snapshot.businessYears : 0
        ctx.daysSinceLaunch = snapshot.daysSinceLaunch
        ctx.bizRegistrationDate = snapshot.businessLaunchedDate
        ctx.hasBizRegistration = snapshot.businessLaunched
        ctx.capital = snapshot.capital
        ctx.currentBalanceKrw = snapshot.currentBalanceKrw
        ctx.runwayMonths = snapshot.runwayMonths
        ctx.avgDailySales = snapshot.avgDailySales
        ctx.weeklySalesChangePct = snapshot.weeklySalesChangePct
        ctx.monthlyAvgRevenue = snapshot.monthlyAvgRevenue
        ctx.hasUserSales = snapshot.hasUserSales
        if let costs = snapshot.monthlyCosts {
            var breakdown = FundingMonthlyCostsBreakdown()
            breakdown.ingredients = Int(costs.ingredients)
            breakdown.labor = Int(costs.labor)
            breakdown.rent = Int(costs.rent)
            breakdown.utilities = Int(costs.utilities)
            breakdown.sga = Int(costs.sga)
            breakdown.marketing = Int(costs.marketing)
            breakdown.other = Int(costs.other)
            breakdown.interest = Int(costs.interest)
            ctx.monthlyCosts = breakdown
        }
        ctx.totalMonthlyCost = snapshot.totalMonthlyCost
        ctx.monthlyProfit = snapshot.monthlyProfit
        ctx.primeRatePct = snapshot.primeRatePct
        ctx.employeesCount = snapshot.employeesCount
        ctx.taxType = taxType
        return ctx
    }

    // MARK: - Supabase fetch

    private func fetchStoreData() async throws -> UserStoreDataRow? {
        let rows: [UserStoreDataRow] = try await supabase
            .from("user_store_data")
            .select("store_name, business_launched, business_launched_date, current_balance_manual_krw, monthly_costs, daily_entries, people_directory")
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value
        return rows.first
    }

    private func fetchBusinessProfile() async throws -> BusinessProfileRow? {
        let rows: [BusinessProfileRow] = try await supabase
            .from("business_profiles")
            .select("industry_category_id, sub_industry_id, startup_type, capital, preferred_regions")
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value
        return rows.first
    }

    // MARK: - Helpers

    private static func nonEmpty(_ s: String?) -> String? {
        let t = s?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return t.isEmpty ? nil : t
    }

    private static func daysSince(_ isoDate: String?) -> Int {
        guard let isoDate, let date = Self.dateFormatter.date(from: isoDate) else { return 0 }
        return max(0, Calendar(identifier: .gregorian).dateComponents([.day], from: date, to: Date()).day ?? 0)
    }

    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        return f
    }()
}

// MARK: - Supabase row DTOs (file-private)

private struct UserStoreDataRow: Decodable, Sendable, Hashable {
    let store_name: String?
    let business_launched: Bool?
    let business_launched_date: String?
    let current_balance_manual_krw: Double?
    let monthly_costs: MonthlyCosts?
    let daily_entries: [DailyEntry]?
    let people_directory: [PersonRow]?
}

private struct PersonRow: Decodable, Sendable, Hashable {
    let id: String?
    let name: String?
}

private struct BusinessProfileRow: Decodable, Sendable, Hashable {
    let industry_category_id: String?
    let sub_industry_id: String?
    let startup_type: String?
    let capital: Int?
    let preferred_regions: [String]?
}
