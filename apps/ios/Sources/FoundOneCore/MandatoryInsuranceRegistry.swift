//
//  MandatoryInsuranceRegistry.swift — 업종별 법정 의무보험 (웹 SSOT 미러)
//
//  ⚠️ SSOT: packages/shared/src/finance/mandatory-insurance.ts — 변경 시 양쪽 동시 수정.
//  가짜숫자 금지: 조건·과태료는 법령 검증값(다중이용업소 안전관리 특별법·체육시설법·학원법, 2026).
//

import Foundation

public struct MandatoryInsurance: Sendable, Hashable {
    public let name: String
    public let law: String
    /// 의무 발생 조건(면적·시설). 무조건 의무면 nil.
    public let condition: String?
    public let penalty: String
    /// 어디서 가입하나
    public let whereToGet: String
    public let source: String

    public init(name: String, law: String, condition: String?, penalty: String, whereToGet: String, source: String) {
        self.name = name; self.law = law; self.condition = condition
        self.penalty = penalty; self.whereToGet = whereToGet; self.source = source
    }
}

public enum MandatoryInsuranceRegistry {

    /// 카테고리(web industryCategoryId 표준) → 법정 의무보험. 없으면 빈 배열.
    public static func forCategory(_ categoryId: String?) -> [MandatoryInsurance] {
        guard let id = categoryId else { return [] }
        return byCategory[id] ?? []
    }

    private static let fireLiability = MandatoryInsurance(
        name: "화재배상책임보험",
        law: "다중이용업소의 안전관리에 관한 특별법",
        condition: "바닥면적 합계 100㎡(지하층 66㎡) 이상이면 의무. 단 지상 1층 또는 지면과 직접 연결된 주출입구는 제외.",
        penalty: "미가입 기간에 따라 과태료 100만~300만원",
        whereToGet: "손해보험사(다중이용업소 화재배상책임보험) — 영업신고 시 가입 증빙 제출",
        source: "다중이용업소 안전관리 특별법 / 찾기쉬운 생활법령(2026)"
    )

    private static let byCategory: [String: [MandatoryInsurance]] = [
        "food": [fireLiability],
        "cafe-dessert": [fireLiability],
        "fitness": [MandatoryInsurance(
            name: "체육시설 배상책임보험",
            law: "체육시설의 설치·이용에 관한 법률",
            condition: nil,
            penalty: "미가입 시 등록 거부·시정명령·과태료",
            whereToGet: "손해보험사 — 체육시설업 신고·등록 시 필수",
            source: "체육시설법(2026)"
        )],
        "education": [MandatoryInsurance(
            name: "학원 배상책임보험",
            law: "학원의 설립·운영 및 과외교습에 관한 법률",
            condition: nil,
            penalty: "미가입 시 등록 거부·시정명령",
            whereToGet: "손해보험사 — 교육청 학원 등록 시 필수",
            source: "학원법(2026)"
        )],
    ]
}
