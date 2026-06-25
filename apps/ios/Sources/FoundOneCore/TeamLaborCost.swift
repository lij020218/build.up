//
//  TeamLaborCost.swift — 팀 단위 월 인건비 (사업주 총 부담).
//
//  웹 SSOT: packages/shared/src/finance/hiring-cost.ts
//    calculateMonthlyTeamLaborCost / calculateHiringCost(totalEmployerCostMonthly) 1:1 포팅.
//  목적: hiring-setup 채용계획(staffPlan) → 월 인건비 미리보기. web↔iOS 동일 숫자.
//
//  2026 4대보험 요율(INSURANCE_RATES_2026)·퇴직 적립·주휴 포함. 산재는 calculateHiringCost
//  와 동일하게 일반 0.7% 고정(업종별 아님 — 팀 추정 일관성).
//

import Foundation

/// 웹 StaffPlan(@foundone/shared) 미러 — stage_decisions.inputs.staffPlan JSON 1:1.
public struct StaffPlan: Codable, Sendable, Equatable {
    public var fullTimeCount: Int?
    public var partTimeCount: Int?
    public var fullTimeMonthlyBase: Int?
    public var partTimeHourlyWage: Int?
    public var partTimeHoursPerWeek: Int?

    public init(
        fullTimeCount: Int? = nil,
        partTimeCount: Int? = nil,
        fullTimeMonthlyBase: Int? = nil,
        partTimeHourlyWage: Int? = nil,
        partTimeHoursPerWeek: Int? = nil
    ) {
        self.fullTimeCount = fullTimeCount
        self.partTimeCount = partTimeCount
        self.fullTimeMonthlyBase = fullTimeMonthlyBase
        self.partTimeHourlyWage = partTimeHourlyWage
        self.partTimeHoursPerWeek = partTimeHoursPerWeek
    }
}

public struct TeamLaborCost: Sendable, Equatable {
    public let fullTimeCost: Int
    public let partTimeCost: Int
    public let total: Int
}

public enum HiringCost2026 {
    static let minimumWage = 10_320            // LEGAL.MINIMUM_WAGE_HOURLY
    static let pensionEmployer = 0.0475
    static let healthEmployer = 0.03595
    static let ltcRateOfHealth = 0.1314
    static let employmentEmployer = 0.009 + 0.0025  // 실업급여 + 고용안정
    static let accidentEmployer = 0.007             // 일반 0.7% 고정(calculateHiringCost 동일)
    static let severanceRate = 1.0 / 12.0

    /// 1인 월 사업주 총 부담 = 총급여(기본+주휴) + 4대보험 사업주분 + 퇴직 적립.
    /// 웹 calculateHiringCost(...).totalEmployerCostMonthly 1:1.
    static func employerCostMonthly(monthlySalary: Int, weeklyHours: Double) -> Int {
        let includeWeeklyHoliday = weeklyHours >= 15
        let weeklyHolidayPay = includeWeeklyHoliday ? Int((Double(monthlySalary) * (8.0 / 40.0)).rounded()) : 0
        let totalGross = monthlySalary + weeklyHolidayPay
        let g = Double(totalGross)
        let pension = Int((g * pensionEmployer).rounded())
        let health = Int((g * healthEmployer).rounded())
        let ltc = Int((Double(health) * ltcRateOfHealth).rounded())
        let employment = Int((g * employmentEmployer).rounded())
        let accident = Int((g * accidentEmployer).rounded())
        let totalInsuranceEmployer = pension + health + ltc + employment + accident
        let severance = Int((g * severanceRate).rounded())
        return totalGross + totalInsuranceEmployer + severance
    }
}

/// 웹 calculateMonthlyTeamLaborCost(plan) 1:1 — 정직원·알바 팀 월 사업주 총 부담.
public func calculateMonthlyTeamLaborCost(_ plan: StaffPlan) -> TeamLaborCost {
    let fullTimeCount = max(0, plan.fullTimeCount ?? 0)
    let partTimeCount = max(0, plan.partTimeCount ?? 0)

    let fullTimeBase = plan.fullTimeMonthlyBase ?? hourlyToMonthly(HiringCost2026.minimumWage, weeklyHours: 40)
    let fullTimeSingle = HiringCost2026.employerCostMonthly(monthlySalary: fullTimeBase, weeklyHours: 40)
    let fullTimeCost = fullTimeCount * fullTimeSingle

    let partTimeHourly = plan.partTimeHourlyWage ?? HiringCost2026.minimumWage
    let partTimeHours = Double(plan.partTimeHoursPerWeek ?? 20)
    let partTimeMonthly = hourlyToMonthly(partTimeHourly, weeklyHours: partTimeHours)
    let partTimeSingle = HiringCost2026.employerCostMonthly(monthlySalary: partTimeMonthly, weeklyHours: partTimeHours)
    let partTimeCost = partTimeCount * partTimeSingle

    return TeamLaborCost(fullTimeCost: fullTimeCost, partTimeCost: partTimeCost, total: fullTimeCost + partTimeCost)
}
