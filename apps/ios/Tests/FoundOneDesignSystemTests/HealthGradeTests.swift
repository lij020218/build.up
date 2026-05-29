//
//  HealthGradeTests.swift — HealthGrade.from(score:) 단위 테스트
//
//  웹 SSOT (packages/shared/src/__tests__/health-score.test.ts) 과 동일 cutoff 검증:
//    healthy ≥ 75 / caution ≥ 55 / warning ≥ 35 / critical < 35
//

import Testing
@testable import FoundOneDesignSystem
@testable import FoundOneCore

@Suite("HealthGrade.from(score:)")
struct HealthGradeTests {

    @Test("75점 이상 → healthy")
    func healthyCutoff() {
        #expect(HealthGrade.from(score: 100) == .healthy)
        #expect(HealthGrade.from(score: 75)  == .healthy)
    }

    @Test("55~74 → caution")
    func cautionCutoff() {
        #expect(HealthGrade.from(score: 74.99) == .caution)
        #expect(HealthGrade.from(score: 55)    == .caution)
    }

    @Test("35~54 → warning")
    func warningCutoff() {
        #expect(HealthGrade.from(score: 54.99) == .warning)
        #expect(HealthGrade.from(score: 35)    == .warning)
    }

    @Test("35 미만 → critical")
    func criticalCutoff() {
        #expect(HealthGrade.from(score: 34.99) == .critical)
        #expect(HealthGrade.from(score: 0)     == .critical)
        #expect(HealthGrade.from(score: -10)   == .critical)
    }

    @Test("NaN / Infinity → unknown")
    func unknownForInvalid() {
        #expect(HealthGrade.from(score: .nan)      == .unknown)
        #expect(HealthGrade.from(score: .infinity) == .unknown)
    }

    @Test("한국어 라벨")
    func koreanLabels() {
        #expect(HealthGrade.healthy.labelKo  == "건강")
        #expect(HealthGrade.caution.labelKo  == "주의")
        #expect(HealthGrade.warning.labelKo  == "위험")
        #expect(HealthGrade.critical.labelKo == "긴급")
        #expect(HealthGrade.unknown.labelKo  == "분석 준비 중")
    }
}
