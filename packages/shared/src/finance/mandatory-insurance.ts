//
//  mandatory-insurance.ts — 업종별 법정 의무보험 SSOT (웹·iOS 공용)
//
//  ⚠️ 가짜숫자 금지: 모든 조건·과태료는 법령·공식 출처 검증값. 변경 시 출처 재확인.
//  검증 출처(2026):
//   • 다중이용업소의 안전관리에 관한 특별법(국가법령정보센터 lsiSeq=162387) — 화재배상책임보험 26개 업종 의무
//   • 찾기쉬운 생활법령 "화재배상책임보험 가입"(easylaw onhunqueSeq=4365)
//   • 체육시설법·학원법 — 배상책임보험 의무(시·도 등록 요건)
//
//  로드맵 함의: 흩어진 보험 언급(permit-check 시설요건 / pre-launch 토글)을 "보험 의무" 단일 렌즈로 통합.
//  창업 전 셋업 단계(보험·세무)에서 "내 업종이 의무 가입 대상인가 + 미가입 시 과태료" 자가판단 제공.
//

/** 법정 의무보험 1건 — 업종별 가입 의무·조건·미가입 제재. */
export interface MandatoryInsurance {
  /** 보험명 (예: 화재배상책임보험) */
  name: string;
  /** 근거 법령 */
  law: string;
  /** 의무 발생 조건 (자가판단용 — 면적·시설 기준). 무조건 의무면 null. */
  condition: string | null;
  /** 미가입 시 제재 (과태료 등) */
  penalty: string;
  /** 어디서 가입하나 */
  where: string;
  /** 출처 라벨 */
  source: string;
}

/** 카테고리(웹 industryCategoryId 표준) → 법정 의무보험 목록. 없으면 빈 배열. */
export const MANDATORY_INSURANCE_BY_CATEGORY: Record<string, MandatoryInsurance[]> = {
  food: [
    {
      name: "화재배상책임보험",
      law: "다중이용업소의 안전관리에 관한 특별법",
      condition:
        "바닥면적 합계 100㎡(지하층 66㎡) 이상이면 의무. 단 지상 1층 또는 지면과 직접 연결된 주출입구는 제외.",
      penalty: "미가입 기간에 따라 과태료 100만~300만원",
      where: "손해보험사(다중이용업소 화재배상책임보험) — 영업신고 시 가입 증빙 제출",
      source: "다중이용업소 안전관리 특별법 / 찾기쉬운 생활법령(2026)",
    },
  ],
  "cafe-dessert": [
    {
      name: "화재배상책임보험",
      law: "다중이용업소의 안전관리에 관한 특별법",
      condition:
        "바닥면적 합계 100㎡(지하층 66㎡) 이상이면 의무. 단 지상 1층 또는 지면과 직접 연결된 주출입구는 제외.",
      penalty: "미가입 기간에 따라 과태료 100만~300만원",
      where: "손해보험사(다중이용업소 화재배상책임보험) — 영업신고 시 가입 증빙 제출",
      source: "다중이용업소 안전관리 특별법 / 찾기쉬운 생활법령(2026)",
    },
  ],
  fitness: [
    {
      name: "체육시설 배상책임보험",
      law: "체육시설의 설치·이용에 관한 법률",
      condition: null,
      penalty: "미가입 시 등록 거부·시정명령·과태료",
      where: "손해보험사 — 체육시설업 신고·등록 시 필수",
      source: "체육시설법(2026)",
    },
  ],
  education: [
    {
      name: "학원 배상책임보험",
      law: "학원의 설립·운영 및 과외교습에 관한 법률",
      condition: null,
      penalty: "미가입 시 등록 거부·시정명령",
      where: "손해보험사 — 교육청 학원 등록 시 필수",
      source: "학원법(2026)",
    },
  ],
};

/** 해당 카테고리의 의무보험 목록(없으면 빈 배열). */
export function mandatoryInsuranceFor(categoryId: string | null | undefined): MandatoryInsurance[] {
  if (!categoryId) return [];
  return MANDATORY_INSURANCE_BY_CATEGORY[categoryId] ?? [];
}
