//
//  InsuranceSimulator.swift — 4대보험 시뮬레이션 SSOT (iOS)
//
//  웹 SSOT 1:1 포팅: packages/shared/src/finance/hiring-cost.ts
//    (INSURANCE_RATES_2026 / DURUNURI_2026 / simulateInsurance / hourlyToMonthly)
//
//  ⚠️ 요율은 이 파일 한 곳에서만 정의한다 (중복정의 금지).
//     InsuranceTaxSetupStageView 도 InsuranceRates2026 상수를 참조한다 —
//     과거 "옛 요율 버그"는 스테이지뷰가 요율을 따로 들고 있어 드리프트한 게 원인이었음.
//
//  2026 요율 (WebSearch 검증 2026-06-04 — 국민연금공단·건강보험공단·근로복지공단 고시):
//    국민연금  9.5%  (근로자·사업주 각 4.75%)   — 2026.1 인상 (9% → 9.5%)
//    건강보험  7.19% (각 3.595%)                — 2026.1 인상 (7.09% → 7.19%)
//    장기요양  임금의 0.9448% (= 건강보험료 × 13.14%)
//    고용보험  실업급여 1.8% (각 0.9%)           — 2026 인상 (1.6% → 1.8%)
//    산재보험  ~0.7% (업종별 상이, 전액 사업주) — 일반 서비스업 가정
//

import Foundation

// MARK: - 2026 요율 (SSOT)

public enum InsuranceRates2026 {
    /// 국민연금 (각 4.75%, 총 9.5%)
    public static let pensionEmployer  = 0.0475
    public static let pensionEmployee  = 0.0475
    /// 건강보험 (각 3.595%, 총 7.19%)
    public static let healthEmployer   = 0.03595
    public static let healthEmployee   = 0.03595
    /// 장기요양 = 건강보험료 × 13.14% (= 임금의 0.9448%)
    public static let longTermCareRateOfHealth = 0.1314
    /// 고용보험 실업급여 (각 0.9%, 총 1.8%)
    public static let employmentEmployer = 0.009
    public static let employmentEmployee = 0.009
    /// 산재보험 — 일반 서비스업 기본 가정 (전액 사업주, 업종별 상이)
    public static let accidentEmployerDefault = 0.007
    /// 고용안정·직업능력개발사업 (사업주만, 150인 미만 0.25%) — 스테이지 상세 부담 계산용
    public static let employmentStabilityEmployer = 0.0025
}

public let MINIMUM_WAGE_2026 = 10_320       // 시급 (원) — 2026 확정 (2025 10,030 → +290)
public let MONTHLY_WORK_HOURS_2026 = 209    // 주 40시간 기준 월 소정근로시간 (주휴 포함)

public enum Duruduri2026 {
    /// 월급 상한 (원)
    public static let monthlySalaryThreshold = 2_700_000
    /// 사업장 직원 수 상한
    public static let maxEmployees = 10
    /// 지원 비율 (국민연금·고용보험 부담분, 사업주·근로자 모두)
    public static let subsidyPct = 80
    /// 지원 기간
    public static let durationMonths = 36
}

/// 시급 → 월급 변환 (주휴 미포함, 365.25/7/12 환산). 웹 `hourlyToMonthly` 1:1.
public func hourlyToMonthly(_ hourly: Int, weeklyHours: Double = 40) -> Int {
    Int((Double(hourly) * weeklyHours * (365.25 / 7 / 12)).rounded())
}

// MARK: - 시뮬레이션 입출력

public struct InsuranceSimInput: Sendable, Equatable {
    /// 월 급여 (원) — 세전
    public var monthlySalary: Int
    /// 주 근무시간 (단시간 < 15h 분기)
    public var weeklyHours: Double
    /// 사업장 총 직원 수 (시뮬 직원 포함) — 두루누리 자격 판단용
    public var totalEmployeeCount: Int
    /// 두루누리 신청 의향 + 가입 36개월 이내 신규 여부
    public var isDuruduriEligible: Bool
    /// 산재 요율 (소수). 기본 0.7% 일반 서비스업. 스테이지뷰는 업종별 요율 주입.
    public var accidentRate: Double

    public init(
        monthlySalary: Int,
        weeklyHours: Double = 40,
        totalEmployeeCount: Int = 1,
        isDuruduriEligible: Bool = false,
        accidentRate: Double = InsuranceRates2026.accidentEmployerDefault
    ) {
        self.monthlySalary = monthlySalary
        self.weeklyHours = weeklyHours
        self.totalEmployeeCount = totalEmployeeCount
        self.isDuruduriEligible = isDuruduriEligible
        self.accidentRate = accidentRate
    }
}

public struct InsuranceSimResult: Sendable, Equatable {
    public struct EmployerPart: Sendable, Equatable {
        public let pension: Int
        public let health: Int
        public let longTermCare: Int
        public let employment: Int
        public let workers: Int
        public let total: Int
        /// 두루누리 적용 후
        public let afterDuruduri: Int
    }
    public struct EmployeePart: Sendable, Equatable {
        public let pension: Int
        public let health: Int
        public let longTermCare: Int
        public let employment: Int
        public let total: Int
        public let afterDuruduri: Int
    }
    public let employer: EmployerPart
    public let employee: EmployeePart
    /// 사장님 실 월부담 = 급여 + 사업주 보험료 (두루누리 적용 후)
    public let totalMonthlyCostToEmployer: Int
    public let duruduriEligible: Bool
    public let duruduriMonthlySaving: Int
    public let warnings: [String]
}

/// 4대보험 시뮬레이션 (두루누리 80% 지원 + 단시간 분기 포함).
/// 웹 SSOT `simulateInsurance` 1:1 — 채용 결정 즉답 UI 용.
public func simulateInsurance(_ input: InsuranceSimInput) -> InsuranceSimResult {
    let salary = max(0, input.monthlySalary)
    let weeklyHours = input.weeklyHours
    let totalEmployeeCount = input.totalEmployeeCount
    var warnings: [String] = []

    let isShortTime = weeklyHours < 15
    if isShortTime {
        warnings.append("주 15시간 미만 근로자 — 국민연금·건강보험 면제, 고용·산재만 가입")
    }

    // 사업주 부담
    let empPension    = isShortTime ? 0 : Int((Double(salary) * InsuranceRates2026.pensionEmployer).rounded())
    let empHealth     = isShortTime ? 0 : Int((Double(salary) * InsuranceRates2026.healthEmployer).rounded())
    let empLtc        = isShortTime ? 0 : Int((Double(empHealth) * InsuranceRates2026.longTermCareRateOfHealth).rounded())
    // 고용보험 사업주분 = 실업급여(0.9%, 두루누리 대상) + 고용안정·직업능력개발(0.25%, 사업주 전액·비대상)
    let empUnemployment = Int((Double(salary) * InsuranceRates2026.employmentEmployer).rounded())
    let empStability    = Int((Double(salary) * InsuranceRates2026.employmentStabilityEmployer).rounded())
    let empEmployment   = empUnemployment + empStability
    let empWorkers    = Int((Double(salary) * input.accidentRate).rounded())
    let empTotal      = empPension + empHealth + empLtc + empEmployment + empWorkers

    // 근로자 부담
    let eePension     = isShortTime ? 0 : Int((Double(salary) * InsuranceRates2026.pensionEmployee).rounded())
    let eeHealth      = isShortTime ? 0 : Int((Double(salary) * InsuranceRates2026.healthEmployee).rounded())
    let eeLtc         = isShortTime ? 0 : Int((Double(eeHealth) * InsuranceRates2026.longTermCareRateOfHealth).rounded())
    let eeEmployment  = Int((Double(salary) * InsuranceRates2026.employmentEmployee).rounded())
    let eeTotal       = eePension + eeHealth + eeLtc + eeEmployment

    let duruduriEligible =
        salary < Duruduri2026.monthlySalaryThreshold &&
        totalEmployeeCount < Duruduri2026.maxEmployees &&
        input.isDuruduriEligible

    // 두루누리는 국민연금 + 고용보험 실업급여분만 지원 (고용안정·직업능력개발분은 비대상)
    let employerSaving = duruduriEligible
        ? Int((Double(empPension + empUnemployment) * (Double(Duruduri2026.subsidyPct) / 100)).rounded())
        : 0
    let employeeSaving = duruduriEligible
        ? Int((Double(eePension + eeEmployment) * (Double(Duruduri2026.subsidyPct) / 100)).rounded())
        : 0

    if duruduriEligible {
        warnings.append("두루누리 80% 지원 자격 — 가입 36개월간 국민연금·고용보험 부담 대폭 감소")
    } else if salary < Duruduri2026.monthlySalaryThreshold &&
              totalEmployeeCount < Duruduri2026.maxEmployees {
        warnings.append("두루누리 자격 가능 — 신규 가입자(가입 36개월 이내)면 80% 지원 신청 가능")
    }

    return InsuranceSimResult(
        employer: .init(
            pension: empPension,
            health: empHealth,
            longTermCare: empLtc,
            employment: empEmployment,
            workers: empWorkers,
            total: empTotal,
            afterDuruduri: empTotal - employerSaving
        ),
        employee: .init(
            pension: eePension,
            health: eeHealth,
            longTermCare: eeLtc,
            employment: eeEmployment,
            total: eeTotal,
            afterDuruduri: eeTotal - employeeSaving
        ),
        totalMonthlyCostToEmployer: salary + empTotal - employerSaving,
        duruduriEligible: duruduriEligible,
        duruduriMonthlySaving: employerSaving + employeeSaving,
        warnings: warnings
    )
}
