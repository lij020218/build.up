"use client";

import { ShieldCheck, Globe2, FileCheck, Clock } from "lucide-react";
import { ClusterStageTemplate, type ClusterStageContent } from "./ClusterStageTemplate";

/**
 * Cluster B — Hardware/IoT NPI 3/4: 인증 (KC·CE·FCC)
 *
 * 검증 출처 (이중 검증):
 *   • IB-Lenhardt: KC 4-8주 (CB conversion 시 2-3주)
 *     https://ib-lenhardt.com/product-certification/kc-south-korea
 *   • BlueAsiaLabs: 8-10주 표준
 *   • MPR Korea: 무선 = KC-RRA + Safety + EMC 3개 인증 모두 필요
 *   • 2026년 4월 1일~ 11월 KC 5G NR 강화 시행 (RRA)
 */
const defaultContent: ClusterStageContent = {
  keyAction: {
    title: "Pre-compliance 테스트로 정식 KC 신청 전 결함 잡기 — 수개월·수천만원 절감",
    detail: "공식 인증 신청 전 자체 EMC/Safety 사전 검증으로 'fail and re-submit' 사이클 방지. 한국 시험소 + 한국 대리인 지정은 KC 필수. 무선 제품은 KC-RRA + Safety + EMC 3개 모두 받아야 합법 판매.",
  },
  facts: [
    {
      icon: Clock,
      label: "KC 인증 일정 — 비무선",
      value: "표준 4-8주, CB conversion 시 2-3주. 처리 흐름은 한국 인증기관 제출 → 시험 → 결과 검토",
      source: "IB-Lenhardt 2026",
    },
    {
      icon: Clock,
      label: "KC 인증 일정 — 무선",
      value: "8-16주 (KC-RRA + Safety + EMC 모두 필요). 2026년 4월~11월 5G NR 표준 강화",
      source: "BlueAsiaLabs · GMA Labs",
    },
    {
      icon: ShieldCheck,
      label: "KC 필수 요건",
      value: "한국에서 시험 / 한국 대리인 지정 / 한국어 문서 / 제품 샘플 제출",
      source: "IB-Lenhardt",
    },
    {
      icon: Globe2,
      label: "글로벌 인증 동시 진행",
      value: "한국 KC + 유럽 CE + 미국 FCC. 동시 진행하면 비용·일정 절감",
      source: "EMC FastPass",
    },
    {
      icon: FileCheck,
      label: "Pre-compliance 효과",
      value: "정식 인증 전 자체 시험 — 정식 시험에서 fail 시 1-2개월 + 추가 비용. Pre-compliance 테스트는 수개월 단축",
      source: "EMC FastPass",
    },
  ],
  traps: [
    {
      label: "PVT 후 인증 신청 — 일정이 8-16주 늦춰짐",
      text: "DVT 단계부터 인증 준비 병행 필수. PVT 후 신청은 양산 일정에 8-16주 추가됨.",
    },
    {
      label: "한국 대리인 미지정 → 신청 거부",
      text: "외국 기업이 한국 대리인 지정 없이 신청하면 즉시 거부. 첫 단계에서 한국 대리인 (수입자·인증대행사) 계약 필수.",
    },
    {
      label: "무선 제품에 KC-RRA만 받고 판매 시작",
      text: "무선은 RRA + Safety + EMC 3개 모두 필요. 하나라도 빠지면 불법 판매로 즉시 회수·과태료.",
    },
  ],
  links: [
    { name: "KC 인증 가이드 (영문) — IB-Lenhardt", href: "https://ib-lenhardt.com/product-certification/kc-south-korea" },
    { name: "KC 인증 일정·문서 — BlueAsiaLabs", href: "https://www.blueasialabs.com/shouyehuandeng/kc-safety-certification-documents-and-timeline" },
    { name: "글로벌 인증 가이드 — EMC FastPass", href: "https://emcfastpass.com/cert-ebook/" },
    { name: "한국 RRA (전파응용기기 인증)", href: "https://rra.go.kr/", desc: "공식 KC-RRA 인증기관" },
  ],
  wrapup: {
    nextStageLabelKo: "양산 파트너 셋업",
    doneItemsKo: [
      { label: "1. Pre-compliance 자체 시험", detail: "정식 신청 전 EMC·Safety 사전 검증 — 'fail and re-submit' 방지" },
      { label: "2. 한국 대리인 지정", detail: "수입자·인증대행사 계약 — 외국 기업 KC 신청 필수" },
      { label: "3. KC·CE·FCC 동시 진행", detail: "글로벌 3대 인증 일정·비용 통합 관리로 절감" },
      { label: "4. 무선 3종 인증", detail: "무선 제품은 RRA + Safety + EMC 3개 인증 누락 없이 완료" },
    ],
    verifyItemsKo: [
      "DVT 단계부터 인증 병행 — PVT 후 신청은 양산 일정 8~16주 지연 (1순위 출시 지연 원인)",
      "무선 — RRA·Safety·EMC 중 1개라도 누락 시 불법 판매, 즉시 회수·과태료 + 형사책임",
      "유럽 CE — Notified Body 지정·DoC 작성 의무, 위반 시 EU 시장 진입 차단",
      "미국 FCC — Title 47 Part 15·18 별도 인증, Class B 가정용·Class A 산업용 구분",
      "어린이 제품 — 안전인증 별도, 위반 시 5천만원 이하 과징금 + 영업정지 가능",
      "인증 라벨 — KC·CE·FCC 마크 누락·위조 시 표시광고법 + 인증기관 행정처분",
    ],
    nextSummaryKo: "KC·CE·FCC 인증 + 한국 대리인 지정 완료 → 양산 파트너 셋업 단계로 진입",
  },
};

export function CertificationKcCeStage() {
  return (
    <ClusterStageTemplate
      stepLabel="Cluster B — Hardware NPI 3/4"
      title="인증 (KC · CE · FCC)"
      contextLabel="11단계 / 22"
      contentBySubIndustry={{ "hardware-iot": defaultContent }}
      defaultContent={defaultContent}
    />
  );
}
