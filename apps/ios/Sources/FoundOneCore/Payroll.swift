//
//  Payroll.swift — 근태 기반 급여 계산 (웹 SSOT 미러).
//
//  웹 SSOT: packages/shared/src/payroll/rates-2026.ts · engine.ts
//   (동기화 가드: apps/web/__tests__/payroll-ios-sync.test.ts)
//
//  정확도 구분 — 화면에도 이대로 표시할 것:
//   · 지급항목(기본급·주휴·연장·야간·휴일) — 법정 계산식 그대로. 확정값.
//   · 4대보험 — 고시 요율 그대로. 확정값. (산재요율만 사업장별로 다름)
//   · 소득세·지방소득세 — 추정. 법적 기준은 국세청 간이세액표.
//
//  근거: 근로기준법 §55(주휴)·§56(가산)·§48②(임금명세서), 소득세법 §47·§50·§55.
//

import Foundation

public enum BUPayrollRates {
    /// 이 파일의 값들을 다시 확인해야 하는 날짜.
    public static let reviewBy = "2027-01-15"

    /// 최저임금 — 고용노동부 고시(2025-08-05), 2026-01-01 시행.
    public static let minimumWage = 10_320

    /// 월 소정근로시간 209 = (40 + 주휴 8) × 4.345.
    public static let monthlyStandardHours = 209.0
    public static let weeksPerMonth = 365.0 / 7.0 / 12.0
    public static let legalWeeklyHours = 40.0
    public static let weeklyHolidayMaxHours = 8.0
    public static let shortTimeWeeklyHours = 15.0
    /// 가산수당 의무가 생기는 상시 근로자 수 (근기법 §11).
    public static let premiumPayMinHeadcount = 5

    /// 가산율 — 근기법 §56. 5인 이상만 의무.
    public static let overtimePremium = 0.5
    public static let nightPremium = 0.5
    public static let holidayWithin8hPremium = 0.5
    public static let holidayOver8hPremium = 1.0

    /// 4대보험 요율 — 2026.
    public static let pensionEmployee = 0.0475
    public static let pensionEmployer = 0.0475
    public static let healthEmployee = 0.03595
    public static let healthEmployer = 0.03595
    /// 장기요양 = 건강보험료 × 13.14% (0.9448 ÷ 7.19).
    public static let longTermCareOfHealth = 0.1314
    public static let employmentEmployee = 0.009
    public static let employmentEmployer = 0.009
    /// 고용안정·직업능력개발 — 사업주 전액, 150인 미만 0.25%.
    public static let employmentStabilityEmployer = 0.0025

    /// 산재 — 도소매·음식·숙박 0.8%. 사업장마다 다르니 고지서 값이 정답.
    public static let accidentDefaultRate = 0.008
    /// 출퇴근재해 — 전 업종 공통 별도 가산 0.06%.
    public static let commuteAccidentRate = 0.0006

    /// 국민연금 기준소득월액 상·하한 (2026-07-01 조정).
    public static let pensionIncomeMin = 410_000
    public static let pensionIncomeMax = 6_590_000

    /// 두루누리 — 4insure.or.kr.
    public static let duruduriSalaryThreshold = 2_700_000
    public static let duruduriMaxEmployees = 10
    public static let duruduriSubsidyPct = 0.8

    /// 비과세 식대 한도 — 소득세법 시행령 §17의2, 월 20만원.
    public static let taxFreeMealMax = 200_000

    /// 퇴직급여 — 계속근로 1년 이상 + 주 15시간 이상.
    public static let severanceMinDays = 365
}

// MARK: - 계산 (웹 engine.ts 미러)

public enum BUPayroll {

    /// 주 소정근로시간 → 그 주의 주휴 시간. (소정/40)×8, 최대 8시간, 15시간 미만은 0.
    public static func weeklyHolidayHours(_ scheduledWeeklyHours: Double) -> Double {
        guard scheduledWeeklyHours >= BUPayrollRates.shortTimeWeeklyHours else { return 0 }
        return min(
            (scheduledWeeklyHours / BUPayrollRates.legalWeeklyHours) * BUPayrollRates.weeklyHolidayMaxHours,
            BUPayrollRates.weeklyHolidayMaxHours
        )
    }

    /// 통상시급 — 시급제는 시급 그대로, 월급제는 월급 ÷ 통상임금 산정 기준시간.
    public static func ordinaryHourlyWage(
        hourlyWage: Int?,
        monthlyBaseSalary: Int?,
        contractedWeeklyHours: Double
    ) -> Int {
        if let h = hourlyWage, h > 0 { return h }
        guard let base = monthlyBaseSalary, base > 0 else { return 0 }
        let weekly = contractedWeeklyHours > 0 ? contractedWeeklyHours : BUPayrollRates.legalWeeklyHours
        let monthlyHours: Double = weekly >= BUPayrollRates.legalWeeklyHours
            ? BUPayrollRates.monthlyStandardHours
            : (weekly + weeklyHolidayHours(weekly)) * BUPayrollRates.weeksPerMonth
        guard monthlyHours > 0 else { return 0 }
        return Int((Double(base) / monthlyHours).rounded())
    }

    /// 가산 배수 — 5인 미만이면 가산 없이 1배.
    public static func premiumMultiplier(headcount: Int, premium: Double) -> Double {
        headcount >= BUPayrollRates.premiumPayMinHeadcount ? 1 + premium : 1
    }

    /// 국민연금 기준소득월액 — 상·하한으로 자른다.
    public static func pensionBase(_ taxableGross: Int) -> Int {
        min(max(taxableGross, BUPayrollRates.pensionIncomeMin), BUPayrollRates.pensionIncomeMax)
    }

    /// 최저임금 미달 여부 — 통상시급 기준.
    public static func belowMinimumWage(ordinaryHourly: Int) -> Bool {
        ordinaryHourly > 0 && ordinaryHourly < BUPayrollRates.minimumWage
    }
}

// MARK: - 명세서 계산 (웹 calculatePayroll 미러)

public struct BUPayItem: Identifiable, Sendable, Hashable {
    public let id = UUID()
    /// 명세서에 그대로 찍히는 이름.
    public let label: String
    public let amount: Int
    /// 근기법 §48② — "출근일수·시간에 따라 달라지는 항목"은 계산방법을 적어야 한다.
    public let method: String?
    /// 연장·야간·휴일은 **시간 수**도 필수 기재.
    public let hours: Double?

    public init(label: String, amount: Int, method: String? = nil, hours: Double? = nil) {
        self.label = label; self.amount = amount; self.method = method; self.hours = hours
    }
}

public struct BUPayrollWarning: Identifiable, Sendable, Hashable {
    public enum Level: String, Sendable { case violation, check }
    public let id = UUID()
    public let level: Level
    public let message: String
    public let law: String?
    public init(level: Level, message: String, law: String? = nil) {
        self.level = level; self.message = message; self.law = law
    }
}

/// 한 주의 근태 — 주휴는 주 단위로 판정한다(개근 요건).
public struct BUWeekAttendance: Sendable, Hashable {
    public let weekStart: String
    public let scheduledHours: Double
    public let absentDays: Int
    public let monthShare: Double
    public init(weekStart: String, scheduledHours: Double, absentDays: Int, monthShare: Double = 1) {
        self.weekStart = weekStart; self.scheduledHours = scheduledHours
        self.absentDays = absentDays; self.monthShare = monthShare
    }
}

public struct BUPayrollInput: Sendable {
    public var period: String
    public var headcount: Int
    public var industrialAccidentRate: Double?
    public var hourlyWage: Int?
    public var monthlyBaseSalary: Int?
    public var contractedWeeklyHours: Double
    public var hiredAfter65: Bool
    public var insuranceEnrolled: Bool
    public var duruduriEligible: Bool
    public var weeks: [BUWeekAttendance]
    public var actualWorkedHours: Double?
    public var overtimeHours: Double
    public var nightHours: Double
    public var holidayHours: Double
    public var dependents: Int
    public var taxFreeAllowance: Int
    public var tenureDays: Int?

    public init(
        period: String, headcount: Int, industrialAccidentRate: Double? = nil,
        hourlyWage: Int? = nil, monthlyBaseSalary: Int? = nil, contractedWeeklyHours: Double,
        hiredAfter65: Bool = false, insuranceEnrolled: Bool = true, duruduriEligible: Bool = false,
        weeks: [BUWeekAttendance] = [], actualWorkedHours: Double? = nil,
        overtimeHours: Double = 0, nightHours: Double = 0, holidayHours: Double = 0,
        dependents: Int = 1, taxFreeAllowance: Int = 0, tenureDays: Int? = nil
    ) {
        self.period = period; self.headcount = headcount; self.industrialAccidentRate = industrialAccidentRate
        self.hourlyWage = hourlyWage; self.monthlyBaseSalary = monthlyBaseSalary
        self.contractedWeeklyHours = contractedWeeklyHours
        self.hiredAfter65 = hiredAfter65; self.insuranceEnrolled = insuranceEnrolled
        self.duruduriEligible = duruduriEligible
        self.weeks = weeks; self.actualWorkedHours = actualWorkedHours
        self.overtimeHours = overtimeHours; self.nightHours = nightHours; self.holidayHours = holidayHours
        self.dependents = dependents; self.taxFreeAllowance = taxFreeAllowance; self.tenureDays = tenureDays
    }
}

public struct BUPayrollResult: Sendable {
    public let period: String
    public let ordinaryHourlyWage: Int
    public let earnings: [BUPayItem]
    public let grossPay: Int
    public let taxFreeAmount: Int
    public let deductions: [BUPayItem]
    public let deductionTotal: Int
    public let netPay: Int
    public let employerBurden: [BUPayItem]
    public let employerBurdenTotal: Int
    public let totalEmployerCost: Int
    public let severanceReserve: Int
    public let warnings: [BUPayrollWarning]
    /// 확정 항목 이름 / 추정 항목과 이유 — 화면에서 구분해 보여준다.
    public let exactItems: [String]
    public let estimatedItems: [(item: String, why: String)]
}

extension BUPayroll {

    private static func won(_ v: Double) -> Int { Int(v.rounded()) }
    private static func round1(_ v: Double) -> Double { (v * 10).rounded() / 10 }
    private static func fmt(_ v: Int) -> String { v.formatted(.number.grouping(.automatic)) }

    public static func calculate(_ input: BUPayrollInput) -> BUPayrollResult {
        var warnings: [BUPayrollWarning] = []
        var exact: [String] = []
        var estimated: [(item: String, why: String)] = []

        let hourly = ordinaryHourlyWage(
            hourlyWage: input.hourlyWage,
            monthlyBaseSalary: input.monthlyBaseSalary,
            contractedWeeklyHours: input.contractedWeeklyHours
        )
        let weekly = input.contractedWeeklyHours > 0 ? input.contractedWeeklyHours : BUPayrollRates.legalWeeklyHours
        let isShortTime = weekly < BUPayrollRates.shortTimeWeeklyHours
        let premiumRequired = input.headcount >= BUPayrollRates.premiumPayMinHeadcount

        // 1. 최저임금
        if belowMinimumWage(ordinaryHourly: hourly) {
            warnings.append(.init(
                level: .violation,
                message: "통상시급 \(fmt(hourly))원 — 2026년 최저임금 \(fmt(BUPayrollRates.minimumWage))원보다 \(fmt(BUPayrollRates.minimumWage - hourly))원 낮습니다.",
                law: "최저임금법 §6"
            ))
        }

        // 2. 지급
        var earnings: [BUPayItem] = []
        let weeksInMonth = input.weeks.isEmpty
            ? BUPayrollRates.weeksPerMonth
            : input.weeks.reduce(0) { $0 + $1.monthShare }
        let workedHours = input.actualWorkedHours ?? (weekly * weeksInMonth)

        if let base = input.monthlyBaseSalary, base > 0 {
            earnings.append(.init(label: "기본급", amount: base,
                                  method: "월 고정급 (통상시급 \(fmt(hourly))원 기준)"))
        } else {
            earnings.append(.init(label: "기본급", amount: won(Double(hourly) * workedHours),
                                  method: "\(fmt(hourly))원 × \(round1(workedHours))시간",
                                  hours: round1(workedHours)))
        }
        exact.append("기본급")

        // 주휴 — 주 단위 개근 판정
        var holidayPayHours: Double = 0
        var paidWeeks = 0
        var skippedWeeks = 0
        var needsHolidayEstimateNote = false
        if !input.weeks.isEmpty {
            for w in input.weeks {
                let hrs = weeklyHolidayHours(w.scheduledHours)
                if hrs <= 0 { continue }
                if w.absentDays > 0 { skippedWeeks += 1; continue }
                holidayPayHours += hrs * w.monthShare
                paidWeeks += 1
            }
        } else if !isShortTime {
            holidayPayHours = weeklyHolidayHours(weekly) * BUPayrollRates.weeksPerMonth
            needsHolidayEstimateNote = true
        }

        // 월급제는 209시간에 주휴가 이미 들어 있다 — 두 번 주지 않는다.
        let holidayIncludedInBase = (input.monthlyBaseSalary ?? 0) > 0
        if holidayPayHours > 0 && !holidayIncludedInBase {
            earnings.append(.init(
                label: "주휴수당",
                amount: won(Double(hourly) * holidayPayHours),
                // 주별 기록이 있으면 "개근 N주", 없으면 추정임을 밝힌다("개근 0주" 는 거짓말).
                method: needsHolidayEstimateNote
                    ? "\(fmt(hourly))원 × \(round1(holidayPayHours))시간 (주 \(round1(weeklyHolidayHours(weekly)))시간 × 약 \(round1(BUPayrollRates.weeksPerMonth))주 — 출결 기록 없어 추정)"
                    : "\(fmt(hourly))원 × \(round1(holidayPayHours))시간 (주 \(round1(weeklyHolidayHours(weekly)))시간 × 개근 \(paidWeeks)주)",
                hours: round1(holidayPayHours)
            ))
            exact.append("주휴수당")
            if needsHolidayEstimateNote {
                estimated.append((item: "주휴수당", why: "주별 출결 기록이 없어 계약 시간으로 추정했습니다. 결근이 있으면 그 주는 빠집니다."))
            }
        }
        if skippedWeeks > 0 {
            warnings.append(.init(level: .check,
                message: "결근이 있어 주휴수당이 빠진 주가 \(skippedWeeks)주 있습니다. 지각·조퇴는 결근이 아니니 기록을 확인하세요.",
                law: "근로기준법 §55"))
        }
        if isShortTime {
            warnings.append(.init(level: .check,
                message: "주 소정근로 15시간 미만 — 주휴수당·연차 의무가 없고 국민연금·건강보험도 제외됩니다.",
                law: "근로기준법 §18③"))
        }

        // 가산
        func addPremium(_ label: String, _ hours: Double, _ premium: Double, _ note: String) {
            guard hours > 0 else { return }
            let m = premiumMultiplier(headcount: input.headcount, premium: premium)
            earnings.append(.init(
                label: label,
                amount: won(Double(hourly) * hours * m),
                method: "\(fmt(hourly))원 × \(round1(hours))시간 × \(m)배 (\(note))",
                hours: round1(hours)
            ))
            exact.append(label)
        }
        let premNote = premiumRequired ? "5인 이상 50% 가산" : "5인 미만 — 가산 의무 없음"
        addPremium("연장근로수당", input.overtimeHours, BUPayrollRates.overtimePremium, premNote)
        addPremium("야간근로수당", input.nightHours, BUPayrollRates.nightPremium,
                   premiumRequired ? "22시~6시 50% 가산" : "5인 미만 — 가산 의무 없음")
        if input.holidayHours > 0 {
            let within = min(input.holidayHours, 8)
            let over = max(0, input.holidayHours - 8)
            addPremium("휴일근로수당", within, BUPayrollRates.holidayWithin8hPremium,
                       premiumRequired ? "8시간 이내 50% 가산" : "5인 미만 — 가산 의무 없음")
            if over > 0 {
                addPremium("휴일근로수당(8시간 초과)", over, BUPayrollRates.holidayOver8hPremium,
                           premiumRequired ? "8시간 초과 100% 가산" : "5인 미만 — 가산 의무 없음")
            }
        }
        if !premiumRequired && (input.overtimeHours > 0 || input.nightHours > 0 || input.holidayHours > 0) {
            warnings.append(.init(level: .check,
                message: "상시 5인 미만이라 연장·야간·휴일 가산(50%) 의무가 없습니다. 근로계약서에 가산을 약속했다면 그 약속이 우선합니다.",
                law: "근로기준법 §11 · §56"))
        }

        // 비과세
        let taxFreeAmount = min(input.taxFreeAllowance, BUPayrollRates.taxFreeMealMax)
        if input.taxFreeAllowance > 0 {
            earnings.append(.init(label: "식대(비과세)", amount: input.taxFreeAllowance,
                method: input.taxFreeAllowance > BUPayrollRates.taxFreeMealMax
                    ? "비과세 한도 \(fmt(BUPayrollRates.taxFreeMealMax))원 초과분은 과세"
                    : "비과세"))
            exact.append("식대")
        }

        let grossPay = earnings.reduce(0) { $0 + $1.amount }
        let taxableGross = max(0, grossPay - taxFreeAmount)

        // 3. 4대보험
        let enrolled = input.insuranceEnrolled
        let pBase = pensionBase(taxableGross)
        let unemploymentExempt = input.hiredAfter65

        let eePension = (enrolled && !isShortTime) ? won(Double(pBase) * BUPayrollRates.pensionEmployee) : 0
        let eeHealth = (enrolled && !isShortTime) ? won(Double(taxableGross) * BUPayrollRates.healthEmployee) : 0
        let eeLtc = won(Double(eeHealth) * BUPayrollRates.longTermCareOfHealth)
        let eeEmployment = (enrolled && !unemploymentExempt) ? won(Double(taxableGross) * BUPayrollRates.employmentEmployee) : 0

        let erPension = (enrolled && !isShortTime) ? won(Double(pBase) * BUPayrollRates.pensionEmployer) : 0
        let erHealth = (enrolled && !isShortTime) ? won(Double(taxableGross) * BUPayrollRates.healthEmployer) : 0
        let erLtc = won(Double(erHealth) * BUPayrollRates.longTermCareOfHealth)
        let erUnemployment = (enrolled && !unemploymentExempt) ? won(Double(taxableGross) * BUPayrollRates.employmentEmployer) : 0
        let erStability = enrolled ? won(Double(taxableGross) * BUPayrollRates.employmentStabilityEmployer) : 0

        let accidentRate = input.industrialAccidentRate ?? BUPayrollRates.accidentDefaultRate
        let erAccident = enrolled ? won(Double(taxableGross) * (accidentRate + BUPayrollRates.commuteAccidentRate)) : 0
        if input.industrialAccidentRate == nil {
            estimated.append((item: "산재보험료",
                why: "업종 기본값 \(String(format: "%.1f", BUPayrollRates.accidentDefaultRate * 100))%로 계산했습니다. 실제 요율은 근로복지공단 고지서에 있습니다."))
        } else {
            exact.append("산재보험료")
        }

        if !enrolled {
            warnings.append(.init(level: .violation,
                message: "4대보험 미가입으로 계산했습니다. 주 15시간 이상이면 가입 의무가 있고, 미가입 시 소급 부과와 과태료가 따릅니다.",
                law: "국민연금법 §8 · 국민건강보험법 §6"))
        }

        // 두루누리
        let duruduri = enrolled && input.duruduriEligible
            && taxableGross < BUPayrollRates.duruduriSalaryThreshold
            && input.headcount < BUPayrollRates.duruduriMaxEmployees
        func afterDuruduri(_ v: Int) -> Int {
            duruduri ? won(Double(v) * (1 - BUPayrollRates.duruduriSubsidyPct)) : v
        }
        if !duruduri && enrolled && !isShortTime
            && taxableGross < BUPayrollRates.duruduriSalaryThreshold
            && input.headcount < BUPayrollRates.duruduriMaxEmployees {
            warnings.append(.init(level: .check,
                message: "두루누리 사회보험 지원 대상일 수 있습니다. 신규 가입 36개월 이내면 국민연금·고용보험을 80% 지원받습니다."))
        }

        // 4. 소득세 — 추정
        let incomeTax = estimateMonthlyIncomeTax(
            monthlyTaxableGross: taxableGross,
            dependents: input.dependents,
            monthlyPensionPremium: eePension
        )
        let localTax = won(Double(incomeTax) * 0.1)
        estimated.append((item: "소득세·지방소득세",
            why: "국세청 간이세액표의 산식 구조로 추정했습니다. 법적 기준은 홈택스의 간이세액표이며 수천 원 차이가 날 수 있습니다."))

        // 5. 조립
        var deductions: [BUPayItem] = []
        func addDeduction(_ label: String, _ amount: Int, _ method: String) {
            if amount > 0 { deductions.append(.init(label: label, amount: amount, method: method)) }
        }
        addDeduction("국민연금", afterDuruduri(eePension),
                     "기준소득월액 \(fmt(pBase))원 × 4.75%" + (duruduri ? " (두루누리 80% 지원)" : ""))
        addDeduction("건강보험", eeHealth, "보수월액 × 3.595%")
        addDeduction("장기요양보험", eeLtc, "건강보험료 × 13.14%")
        addDeduction("고용보험", afterDuruduri(eeEmployment),
                     unemploymentExempt ? "65세 이후 고용 — 실업급여 적용 제외" : "보수월액 × 0.9%")
        addDeduction("소득세(추정)", incomeTax, "간이세액표 추정")
        addDeduction("지방소득세(추정)", localTax, "소득세의 10%")

        // 실제로 공제된 항목만 확정으로 센다.
        for d in deductions where ["국민연금", "건강보험", "장기요양보험", "고용보험"].contains(d.label) {
            exact.append(d.label)
        }

        let deductionTotal = deductions.reduce(0) { $0 + $1.amount }

        var employerBurden: [BUPayItem] = []
        func addBurden(_ label: String, _ amount: Int, _ method: String) {
            if amount > 0 { employerBurden.append(.init(label: label, amount: amount, method: method)) }
        }
        addBurden("국민연금(사업주)", afterDuruduri(erPension), "기준소득월액 × 4.75%")
        addBurden("건강보험(사업주)", erHealth, "보수월액 × 3.595%")
        addBurden("장기요양보험(사업주)", erLtc, "건강보험료 × 13.14%")
        addBurden("고용보험(사업주)", afterDuruduri(erUnemployment) + erStability,
                  "실업급여 0.9% + 고용안정·직업능력개발 0.25%")
        addBurden("산재보험(사업주)", erAccident,
                  "보수월액 × \(String(format: "%.2f", (accidentRate + BUPayrollRates.commuteAccidentRate) * 100))% (출퇴근재해 포함)")

        let employerBurdenTotal = employerBurden.reduce(0) { $0 + $1.amount }

        // 퇴직급여 — 1년 이상 + 주 15시간 이상.
        let severanceReserve = isShortTime ? 0 : won(Double(grossPay) / 12)
        if !isShortTime, let tenure = input.tenureDays, tenure < BUPayrollRates.severanceMinDays {
            warnings.append(.init(level: .check,
                message: "근속 \(tenure)일 — 1년(365일)을 채우면 퇴직급여 지급 의무가 생깁니다. 미리 적립해 두세요.",
                law: "근로자퇴직급여보장법 §4"))
        }

        return BUPayrollResult(
            period: input.period,
            ordinaryHourlyWage: hourly,
            earnings: earnings,
            grossPay: grossPay,
            taxFreeAmount: taxFreeAmount,
            deductions: deductions,
            deductionTotal: deductionTotal,
            netPay: grossPay - deductionTotal,
            employerBurden: employerBurden,
            employerBurdenTotal: employerBurdenTotal,
            totalEmployerCost: grossPay + employerBurdenTotal,
            severanceReserve: severanceReserve,
            warnings: warnings,
            exactItems: Array(Set(exact)).sorted(),
            estimatedItems: estimated
        )
    }

    // MARK: 소득세 추정 (웹 estimateMonthlyIncomeTax 미러)

    private static let earnedIncomeDeductionBrackets: [(upTo: Double, base: Double, rate: Double)] = [
        (5_000_000, 0, 0.7),
        (15_000_000, 3_500_000, 0.4),
        (45_000_000, 7_500_000, 0.15),
        (100_000_000, 12_000_000, 0.05),
        (.infinity, 14_750_000, 0.02),
    ]
    private static let taxBrackets: [(upTo: Double, rate: Double, progressive: Double)] = [
        (14_000_000, 0.06, 0),
        (50_000_000, 0.15, 1_260_000),
        (88_000_000, 0.24, 5_760_000),
        (150_000_000, 0.35, 15_440_000),
        (300_000_000, 0.38, 19_940_000),
        (500_000_000, 0.40, 25_940_000),
        (1_000_000_000, 0.42, 35_940_000),
        (.infinity, 0.45, 65_940_000),
    ]

    public static func estimateMonthlyIncomeTax(
        monthlyTaxableGross: Int,
        dependents: Int,
        monthlyPensionPremium: Int,
        withholdingRatio: Double = 1.0
    ) -> Int {
        let annual = Double(max(0, monthlyTaxableGross)) * 12
        guard annual > 0 else { return 0 }

        var prev: Double = 0
        var deduction = 20_000_000.0
        for b in earnedIncomeDeductionBrackets {
            if annual <= b.upTo { deduction = min(b.base + (annual - prev) * b.rate, 20_000_000); break }
            prev = b.upTo
        }
        let incomeAmount = annual - deduction
        let personal = 1_500_000.0 * Double(max(1, dependents))
        let pension = Double(max(0, monthlyPensionPremium)) * 12
        let special = deemedSpecialDeduction(annual: annual, dependents: dependents)

        let taxBase = max(0, incomeAmount - personal - pension - special)
        var computed: Double = 0
        for b in taxBrackets where taxBase <= b.upTo {
            computed = max(0, taxBase * b.rate - b.progressive); break
        }

        let rawCredit = computed <= 1_300_000
            ? computed * 0.55
            : 1_300_000 * 0.55 + (computed - 1_300_000) * 0.3
        let cap: Double = annual <= 33_000_000 ? 740_000
            : annual <= 70_000_000 ? max(660_000, 740_000 - (annual - 33_000_000) * 0.008)
            : max(500_000, 660_000 - (annual - 70_000_000) / 2)

        let annualTax = max(0, computed - min(rawCredit, cap))
        return won(annualTax / 12 * withholdingRatio)
    }

    /// 간이세액표의 "특별소득공제·특별세액공제 중 일부" 간주액 (소득세법 시행령 별표2 비고).
    private static func deemedSpecialDeduction(annual: Double, dependents: Int) -> Double {
        let tier = dependents <= 1 ? 1 : (dependents == 2 ? 2 : 3)
        func base(_ g: Double) -> Double {
            switch tier {
            case 1: return 3_100_000 + g * 0.04
            case 2: return 3_600_000 + g * 0.04
            default: return 5_000_000 + g * 0.07 + max(0, g - 40_000_000) * 0.04
            }
        }
        let amount: Double
        if annual <= 30_000_000 {
            amount = base(annual)
        } else if annual <= 45_000_000 {
            amount = base(annual) - (annual - 30_000_000) * 0.05
        } else if annual <= 70_000_000 {
            amount = tier == 1 ? 3_100_000 + annual * 0.015
                : tier == 2 ? 3_600_000 + annual * 0.02
                : 5_000_000 + annual * 0.05
        } else {
            amount = tier == 1 ? 3_100_000 + annual * 0.005
                : tier == 2 ? 3_600_000 + annual * 0.01
                : 5_000_000 + annual * 0.03
        }
        return max(0, amount)
    }
}
