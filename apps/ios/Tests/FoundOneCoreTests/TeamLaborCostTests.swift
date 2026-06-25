//
//  TeamLaborCostTests.swift — 팀 인건비 계산 web↔iOS 동일성 회귀.
//
//  기대값은 웹 SSOT calculateMonthlyTeamLaborCost(@foundone/shared)로 산출(tsx).
//  iOS 포팅이 같은 숫자를 내는지 박아둠 — 다르면 사장님이 web/iOS에서 다른 인건비를 본다.
//

import Testing
@testable import FoundOneCore

@Suite("calculateMonthlyTeamLaborCost — web 동일성")
struct TeamLaborCostTests {

    @Test("food 기본 (정규1 + 알바2 25h)")
    func foodDefault() {
        let r = calculateMonthlyTeamLaborCost(StaffPlan(fullTimeCount: 1, partTimeCount: 2, partTimeHoursPerWeek: 25))
        #expect(r.fullTimeCost == 2_563_195)
        #expect(r.partTimeCost == 3_203_990)
        #expect(r.total == 5_767_185)
    }

    @Test("알바 단가 지정 (12000원 30h)")
    func partTimeCustom() {
        let r = calculateMonthlyTeamLaborCost(StaffPlan(partTimeCount: 1, partTimeHourlyWage: 12_000, partTimeHoursPerWeek: 30))
        #expect(r.total == 2_235_342)
    }

    @Test("정규 월급 지정 (300만)")
    func fullTimeCustom() {
        let r = calculateMonthlyTeamLaborCost(StaffPlan(fullTimeCount: 1, fullTimeMonthlyBase: 3_000_000))
        #expect(r.total == 4_284_026)
    }
}
