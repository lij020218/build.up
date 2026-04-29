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
};

export function LabSetupStage() {
  return (
    <ClusterStageTemplate
      stepLabel="Cluster C — Deep Tech Lab 1/4"
      title="연구실·시제품 작업장 셋업"
      contextLabel="9단계 / 22"
      contentBySubIndustry={{
        "robotics-physical-ai": robotics,
        "biotech-medtech": biotech,
      }}
      defaultContent={biotech}
    />
  );
}
