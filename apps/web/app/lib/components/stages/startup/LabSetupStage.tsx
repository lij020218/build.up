"use client";

import { Microscope, ShieldAlert, Wrench, Building2 } from "lucide-react";
import { ClusterStageTemplate, type ClusterStageContent } from "./ClusterStageTemplate";

/**
 * Cluster C — Deep Tech Lab 1/4: 연구실·시제품 작업장 셋업
 *
 * 검증 출처:
 *   • Korea biotech: BSL-1/2 + GLP 표준 (식약처 우수 실험실 운영기준 — MFDS GLP)
 *   • OECD GLP Principles (1981, 의약품 안전성 평가)
 *   • 한국 산업안전보건공단 (안전 매뉴얼 표준)
 */

const robotics: ClusterStageContent = {
  keyAction: {
    title: "안전 펜스·EMC 차폐·비상정지 시스템 — 사고 한 번에 운영 전체가 정지합니다",
    detail: "로봇 작업 영역 펜스로 분리, EMC 차폐 (전자파 간섭 방지), 비상정지 버튼 다중화, 전원 격리 절차. 사고 발생 시 산업안전보건법에 따라 영업정지·피해보상·인증 박탈 가능.",
  },
  facts: [
    {
      icon: Building2,
      label: "필요 시설",
      value: "최소 30평 — 로봇 작업 영역 + 컨트롤룸 + 부품 보관 + 작업대. 천장고 3m+ (수직 모션 고려), 콘크리트 슬래브 (진동 흡수)",
    },
    {
      icon: ShieldAlert,
      label: "안전 시스템 (필수)",
      value: "안전 펜스 + 안전 라이트 커튼 + 비상정지 다중화 + Power Lockout/Tagout (LOTO) 절차",
      source: "산업안전보건공단",
    },
    {
      icon: Wrench,
      label: "핵심 장비",
      value: "모션캡처 (Vicon·OptiTrack 1억~3억) + 로드셀·6축 F/T 센서 + 오실로스코프 + 진동 측정기",
    },
  ],
  traps: [
    { label: "안전 매뉴얼 없이 시작 — 첫 사고가 회사 끝", text: "산업안전보건법 위반 시 영업정지 + 형사처벌. 시작 전 안전 컨설팅 + LOTO 절차 + 매주 안전 점검 필수." },
    { label: "EMC 차폐 부재 → 인근 장비 간섭으로 측정값 오염", text: "데이터 신뢰 못 함 → 모든 실험 재시도. Faraday cage 또는 차폐룸 설치." },
  ],
  wrapup: {
    nextStageLabelKo: "프로토타입 반복",
    doneItemsKo: [
      { label: "1. 시설·작업 영역 분리", detail: "로봇 펜스·컨트롤룸·부품 보관·작업대 — 안전 동선 확보" },
      { label: "2. 안전 시스템 셋업", detail: "안전 펜스·라이트 커튼·비상정지·LOTO 절차 매뉴얼화" },
      { label: "3. 핵심 장비 도입", detail: "모션캡처·F/T 센서·오실로스코프·진동 측정기 등 검증" },
      { label: "4. EMC 차폐", detail: "Faraday cage·차폐룸 설치, 측정 데이터 신뢰성 확보" },
    ],
    verifyItemsKo: [
      "산업안전보건법 — 사고 시 영업정지 + 형사처벌, LOTO 절차 미준수 시 1년 이하 징역",
      "보험 — 시설배상·근로자재해보상·생산물배상 3종 별도, 사고 시 자기부담 한계 점검",
      "PL(제조물책임) — 시제품 단계라도 외부 노출 시 PL 보험 가입 권장",
      "전기 용량·소방 — 고전력 장비는 한전 사전 증설 + 소방 별도 신고 필수",
      "환경부 — 화학·생물 폐기물 처리 위탁 계약, 자가 폐기 시 환경법 위반 + 형사처벌",
      "데이터 무결성 — 모든 측정 SOP·교정증명서 보관, 미보관 시 인허가 데이터 무효",
    ],
    nextSummaryKo: "시설·안전·EMC·장비 셋업 완료 → 프로토타입 반복 단계로 진입",
  },
};

const biotech: ClusterStageContent = {
  keyAction: {
    title: "GLP 또는 BSL-1/2 시설 — 인허가 데이터의 신뢰성은 시설에서 시작",
    detail: "MFDS GLP (우수 실험실 운영기준) 또는 BSL-1/2 (Biosafety Level) 시설. 시설이 표준 미달이면 IND 제출 시 데이터 자체가 무효 처리. 처음부터 GLP 인증 시설 또는 GLP 인증 시설 위탁 (CRO).",
  },
  facts: [
    {
      icon: Building2,
      label: "BSL 등급",
      value: "BSL-1: 일반 미생물 / BSL-2: 인체 감염 가능 (대부분 임상 1상 후보) / BSL-3: 결핵·SARS / BSL-4: 에볼라급. 연구 대상에 따라 시설 차등",
      source: "OECD GLP",
    },
    {
      icon: Microscope,
      label: "GLP 핵심 요건",
      value: "교정된 장비 + SOP (표준작업절차서) + 시험기록부 + QA 검증 + 시설관리·보안",
      source: "MFDS GLP 가이드",
    },
    {
      icon: ShieldAlert,
      label: "생물학적 폐기물 처리",
      value: "고온멸균 → 전용 폐기물 업체 위탁. 미준수 시 환경부 처분 + 영업정지",
    },
  ],
  traps: [
    { label: "비-GLP 시설에서 데이터 생성 → IND 거절", text: "MFDS 는 GLP 시설 데이터만 인정. 자가 시설로 시작했다가 IND 단계에서 모두 재시험해야 함. 처음부터 GLP 시설 또는 인증 CRO 위탁이 정답." },
    { label: "SOP 없이 실험 — 재현성 0", text: "SOP 없는 데이터는 인허가 검토에서 무효. 첫 실험 시작 전 SOP 작성·QA 서명·교육 이수." },
  ],
  wrapup: {
    nextStageLabelKo: "프로토타입 반복",
    doneItemsKo: [
      { label: "1. GLP 또는 BSL-1/2 시설 확보", detail: "자가 시설 또는 인증 CRO 위탁으로 데이터 무결성 확보" },
      { label: "2. SOP·QA 시스템", detail: "표준작업절차서 + QA 검증 + 시험기록부 시스템 구축" },
      { label: "3. 장비 교정·인증", detail: "모든 측정 장비 교정증명서 + 정기 검증 일정 셋업" },
      { label: "4. 폐기물·안전 절차", detail: "고온멸균 + 전용 폐기물 업체 위탁 + 사고 대응 매뉴얼" },
    ],
    verifyItemsKo: [
      "MFDS GLP — 비-GLP 시설 데이터는 IND 거절, 처음부터 GLP 시설 또는 인증 CRO 위탁 필수",
      "BSL 등급 — 연구 대상에 맞지 않으면 보건복지부 영업정지 + 형사처벌",
      "환경부 — 생물학적 폐기물 자가 처리 시 환경법 위반, 위탁 계약서 보관 필수",
      "동물실험 — IACUC(동물실험윤리위원회) 승인 의무, 미승인 시 데이터 무효 + 처분",
      "임상 데이터 — IRB(임상시험심사위원회) 승인 사전 확보, 무승인 시험은 IND 거절",
      "특허 — 시험 전 특허 출원 또는 발명신고서 작성, 외부 발표 후 특허성 상실 위험",
    ],
    nextSummaryKo: "GLP 시설·SOP·교정·폐기물 절차 완료 → 프로토타입 반복 단계로 진입",
  },
};

export function LabSetupStage() {
  return (
    <ClusterStageTemplate
      stageId="lab-setup"
      stepLabel="Cluster C — Deep Tech Lab 1/4"
      title="연구실·시제품 작업장 셋업"
      contentBySubIndustry={{
        "robotics-physical-ai": robotics,
        "biotech-medtech": biotech,
      }}
      defaultContent={biotech}
    />
  );
}
