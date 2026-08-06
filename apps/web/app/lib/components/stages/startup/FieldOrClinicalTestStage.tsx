"use client";

import { ClipboardCheck, Users, FileText, Stethoscope } from "lucide-react";
import { ClusterStageTemplate, type ClusterStageContent } from "./ClusterStageTemplate";

/**
 * Cluster C — Deep Tech Lab 3/4: 필드 테스트 / 임상 시험
 *
 * 검증 출처:
 *   • IntoInWorld 2026 — Korea MFDS IND 4-6주 (30 working days)
 *   • Pre-IND consultation 7일 단축 가능
 *   • Total startup time 6-8주 (IRB 병행)
 *   • MFDS 2025: 126건 의료기기 IND 승인
 *   • Subject Injury Compensation insurance 필수 (IND 제출 요건)
 */

const robotics: ClusterStageContent = {
  keyAction: {
    title: "필드 사이트 + 모니터링 시스템 + 안전 인증 — 동작 데이터가 인허가의 핵심 증거",
    detail: "실제 사용 환경에서 일정 기간 가동 데이터 수집. 동작 로그·고장 통계·사용자 피드백 수집 시스템 미리 구축. 사고 발생 시 책임 보험 가입 필수.",
  },
  facts: [
    {
      icon: ClipboardCheck,
      label: "테스트 프로토콜",
      value: "운영 환경 정의 (온도·습도·진동) + 시험 기간 (최소 4주) + 합격 기준 (가동률·고장률·정확도) + 모니터링 빈도",
    },
    {
      icon: Users,
      label: "필드 사이트 확보",
      value: "실제 고객 또는 파일럿 파트너 1-3개 사이트. 사용 동의서 + 책임 한정 계약 + 사고 보험 사전 체결",
    },
    {
      icon: FileText,
      label: "데이터 수집 표준",
      value: "동작 로그 (1초 단위) + 환경 데이터 + 사용자 인터벤션 기록 + 영상 + 고장 모드 분류",
    },
  ],
  traps: [
    { label: "보험 없이 필드 테스트 — 사고 시 회사 파산", text: "로봇 사고는 인적·재산 피해 큼. 제품책임보험 + 영업배상책임보험 가입 후 시작. 한국 보험사 다수 취급." },
    { label: "데이터 수집 시스템 없이 시작", text: "사고 발생 시 원인 분석 불가 → 인허가 단계에서 데이터 부족으로 거부. 자동 로깅 + 백업 필수." },
  ],
  wrapup: {
    nextStageLabelKo: "규제 제출",
    doneItemsKo: [
      { label: "1. 필드 사이트 1~3곳 확보", detail: "실제 고객·파일럿 파트너 + 사용 동의서 + 책임 한정 계약" },
      { label: "2. 보험 가입", detail: "제품책임보험 + 영업배상책임보험 사전 체결, 사고 시 회사 보호" },
      { label: "3. 데이터 수집 시스템", detail: "동작 로그 1초 단위 + 환경 데이터 + 영상·고장 모드 자동 로깅" },
      { label: "4. 시험 기간·합격 기준", detail: "최소 4주 + 가동률·고장률·정확도 임계 정의" },
    ],
    verifyItemsKo: [
      "보험 — 가입 없이 시작 시 사고 발생 시 무한 책임, 한국 보험사(현대·삼성·DB) 사전 견적",
      "사고 보고 — 인적 피해 발생 시 24시간 내 산업안전보건공단 신고 의무, 미신고 시 형사처벌",
      "데이터 보안 — 고객 환경 영상·로그는 개인정보 포함 가능, 익명화·암호화 의무",
      "리스크 평가 — FMEA(고장모드영향분석) 사전 수행, 누락 시 인증 단계 데이터 부족 거절",
      "사용 동의서 — 「영업비밀」「데이터 활용권」 명시, 모호한 합의는 분쟁 1순위",
      "회수 시나리오 — 결함 발견 시 즉시 회수·교체 절차 매뉴얼화, PL 위반 시 형사책임",
    ],
    nextSummaryKo: "필드 사이트·보험·데이터 시스템 + 시험 기간 통과 → 규제 제출 단계로 진입",
  },
};

const biotech: ClusterStageContent = {
  keyAction: {
    title: "MFDS IND 제출 (4-6주) + IRB 윤리 심사 병행 — 한국은 세계에서 가장 빠른 IND 중 하나",
    detail: "Pre-IND consultation 으로 사전 협의 (최단 7일 단축). IND 정식 제출 후 4-6주 (30 working days) 내 결정. IRB 윤리 심사 병행 시 총 6-8주에 임상 시작 가능. 피험자 보상 보험은 IND 제출 시 필수.",
  },
  facts: [
    {
      icon: Stethoscope,
      label: "한국 MFDS IND 일정",
      value: "정식 제출 후 4-6주 (30 working days). Pre-IND consultation 으로 7일까지 단축 가능. IRB 윤리 심사 병행 → 총 6-8주",
      source: "IntoInWorld 2026 · MFDS",
    },
    {
      icon: ClipboardCheck,
      label: "IND dossier 필수 항목",
      value: "임상시험계획서 (Protocol) + Investigator's Brochure + 동물시험 데이터 + 제조 정보 (CMC) + 피험자 보상 보험 증서",
      source: "MFDS Pre-Consultation Guideline",
    },
    {
      icon: Users,
      label: "임상시험 기관 (CRO) 선택",
      value: "한국은 700+ 임상시험 매년, 의료기기 IND 126건 (2025). CRO 선정 시 해당 적응증 경험·KGCP 인증·과거 IND 통과율 확인",
      source: "MFDS 2025 통계",
    },
    {
      icon: FileText,
      label: "Subject Injury Compensation",
      value: "피험자 보상 보험 또는 가이드라인 — IND 제출 시 한국어 번역본 필수. 사고 시 보상 미지급 = 임상 즉시 중단",
      source: "OMC Medical · IntoInWorld",
    },
  ],
  traps: [
    { label: "Pre-IND 없이 정식 제출 — fail 시 8-12주 손실", text: "Pre-IND consultation 으로 사전에 우려사항 식별. 데이터 부족·프로토콜 결함 미리 보완. 7일에 끝나는 단축 옵션도 있음." },
    { label: "피험자 보상 보험 없이 IND 제출 → 즉시 거부", text: "한국 임상시험 보험사 (현대해상·삼성화재 등) 대부분 취급. 보험 증서 한국어 번역본 IND dossier 에 반드시 포함." },
    { label: "CRO 경험 부족 — 1상 fail 사례", text: "해당 적응증 IND 통과 경험 없는 CRO 선정 시 프로토콜 결함 잡지 못해 1상 fail. 레퍼런스 5건+ 확인 후 계약." },
  ],
  links: [
    { name: "Korea MFDS Pre-Consultation Guideline (RegDesk)", href: "https://www.regdesk.co/blog/south-koreas-updated-mfds-pre-consultation-guideline-what-medical-innovators-need-to-know/" },
    { name: "IND Application Process (Precision for Medicine)", href: "https://www.precisionformedicine.com/blog/how-to-launch-a-clinical-trial-in-south-korea-investigational-new-drug-application-process" },
    { name: "MFDS 의료기기 인허가", href: "https://www.mfds.go.kr/eng/wpge/m_39/denofile.do" },
  ],
  wrapup: {
    nextStageLabelKo: "규제 제출",
    doneItemsKo: [
      { label: "1. Pre-IND consultation", detail: "사전 협의로 우려사항 식별 + 7일 단축 옵션" },
      { label: "2. IND dossier 완비", detail: "프로토콜·IB·동물시험·CMC·피험자 보험 5종 동시 작성" },
      { label: "3. CRO·임상기관 선정", detail: "해당 적응증 IND 5건+ 통과 경험 + KGCP 인증 보유" },
      { label: "4. IRB 윤리 심사 병행", detail: "MFDS IND + IRB 동시 진행, 총 6~8주에 임상 시작" },
    ],
    verifyItemsKo: [
      "피험자 보상 보험 — IND 제출 시 한국어 증서 필수, 미제출 시 즉시 거절",
      "CRO 경험 — 적응증별 IND 통과 경험 없으면 1상 fail 위험, 레퍼런스 5건+ 확인",
      "IRB 승인 — 미승인 시 임상 진행 불가, 사전 신청·심사 일정 역산",
      "동물시험 — IACUC 승인 + GLP 시설 데이터만 인정, 비-GLP 데이터는 IND 거절",
      "임상 비용 — 1상 평균 5~10억, 진입 전 자본 또는 추가 펀딩 사전 확보",
      "데이터 무결성 — eCRF·EDC 시스템 + 21 CFR Part 11 준수, 위반 시 데이터 무효",
    ],
    nextSummaryKo: "IND·IRB 승인 + 임상 1상 시작 → 규제 제출 단계로 진입",
  },
};

export function FieldOrClinicalTestStage() {
  return (
    <ClusterStageTemplate
      stageId="field-or-clinical-test"
      stepLabel="Cluster C — Deep Tech Lab 3/4"
      title="필드 테스트 / 임상 시험"
      contentBySubIndustry={{
        "robotics-physical-ai": robotics,
        "biotech-medtech": biotech,
      }}
      defaultContent={biotech}
    />
  );
}
