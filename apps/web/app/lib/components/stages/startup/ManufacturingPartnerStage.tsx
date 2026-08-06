"use client";

import { Factory, ClipboardCheck, FileSignature, Users } from "lucide-react";
import { ClusterStageTemplate, type ClusterStageContent } from "./ClusterStageTemplate";

/**
 * Cluster B — Hardware/IoT NPI 4/4: 제조 파트너 (EMS/CM) 선정
 *
 * 검증 출처:
 *   • MistyWest Hardware Product Development 가이드
 *   • Xavor / Peko Precision / Digital Hill — EMS 선정 표준
 */
const defaultContent: ClusterStageContent = {
  keyAction: {
    title: "EMS 후보 3-5개 비교 + 직접 감사 — 잘못된 파트너는 회사를 위험에 빠뜨림",
    detail: "능력·캐파·QC 시스템·ISO 9001 등 인증 비교. 직접 방문(또는 화상 라인 점검). MOQ·결제조건·불량률 임계치·IPI(In-Process Inspection) 검사 포인트를 1차 양산 계약에 명시.",
  },
  facts: [
    {
      icon: Factory,
      label: "EMS vs CM",
      value: "EMS (Electronics Manufacturing Service): 통합 서비스, 외주 매니지먼트 / CM (Contract Manufacturer): 협업 폭 좁고 가격 경쟁력 — 규모와 복잡도에 따라 선택",
      source: "Peko Precision · MistyWest",
    },
    {
      icon: ClipboardCheck,
      label: "감사 표준",
      value: "ISO 9001 (품질) + ISO 13485 (의료) + IATF 16949 (자동차) 인증 보유 + 기존 고객 레퍼런스 + 라인 직접 견학",
      source: "Xavor · Digital Hill",
    },
    {
      icon: FileSignature,
      label: "계약 핵심 조항",
      value: "MOQ·결제조건(T/T·L/C)·납기·불량률 임계치(2-5%)·IPI 검사 포인트·금형 소유권·NDA",
      source: "MistyWest 표준 계약",
    },
    {
      icon: Users,
      label: "한국 EMS 선택지",
      value: "삼성전기·LG이노텍·SI파브리케이션·이엠텍 등 / 중국 OEM (Foxconn·Pegatron) 대비 한국 EMS는 IP 보호·통신 편의 강점",
      source: "한국 제조 생태계",
    },
  ],
  traps: [
    {
      label: "최저가 EMS 선정 후 불량률 폭발",
      text: "단가 차이 10%를 위해 품질 떨어지는 EMS 선택 → 불량률 5%+ → RMA 비용이 단가 차이를 다 잡아먹고 평판 손상까지. 첫 양산은 가격보다 품질·신뢰성.",
    },
    {
      label: "현장 감사 생략 → 라인 실태 모름",
      text: "화상 견학이라도 필수. ESD 보호·작업자 훈련·환경 통제 직접 확인. 감사 안 한 EMS 와 양산 시작은 도박.",
    },
    {
      label: "금형 소유권 명시 안 함 → 변경 불가",
      text: "금형(Tooling)을 EMS 가 보유하면 다른 EMS 로 이관 불가. 계약서에 금형 소유권 = 발주사 명시 + 인도 의무 조항.",
    },
  ],
  links: [
    { name: "Hardware 제조 종합 가이드 — MistyWest", href: "https://www.mistywest.com/complete-guide-to-hardware-product-development/" },
    { name: "Hardware 개발 펀더멘털 — Peko Precision", href: "https://www.pekoprecision.com/blog/new-product-development-hardware-fundamentals-for-startups/" },
    { name: "RNDSquare — 스타트업 하드웨어 가속화", href: "https://rndsquare.com/insights/startup-hardware-product-development" },
  ],
  wrapup: {
    nextStageLabelKo: "법인 설립·운영",
    doneItemsKo: [
      { label: "1. EMS 후보 3~5개 비교", detail: "능력·캐파·QC·인증·레퍼런스 비교 + 직접/화상 감사" },
      { label: "2. 1차 양산 계약 체결", detail: "MOQ·결제조건·불량률 임계·IPI 검사·금형 소유권 명문화" },
      { label: "3. 인증 통합 관리", detail: "ISO 9001·13485·IATF 16949 보유 EMS 검증 후 계약" },
      { label: "4. 양산 일정·품질 추적", detail: "불량률·납기·재공품 모니터링 + 월간 QBR(Quarterly Business Review)" },
    ],
    verifyItemsKo: [
      "금형 소유권 — 발주사 보유 명문화, EMS 보유 시 다른 EMS 이관 불가 + 가격 협상력 상실",
      "NDA·IP — 회로도·펌웨어·노하우 NDA 체결, 위반 시 손해배상 + 형사책임 조항",
      "MOQ — 첫 양산 MOQ 너무 크면 재고 부담, 가능한 한 단계적 발주 협상",
      "불량률 임계 — 2~5% 초과 시 EMS 보상·재제조 의무 명문화, 발주사 부담 룰 X",
      "결제 — T/T 30% 발주·40% 출고 전·30% 검수 후 분할이 표준, 100% 선결제 거절",
      "복수 EMS — 핵심 제품은 2차 EMS 백업 사전 확보, 단일 EMS 의존 시 부도·파업 리스크",
    ],
    nextSummaryKo: "EMS 선정·계약·인증 통합 관리 완료 → 법인 설립·운영 단계로 진입",
  },
};

export function ManufacturingPartnerStage() {
  return (
    <ClusterStageTemplate
      stageId="manufacturing-partner"
      stepLabel="Cluster B — Hardware NPI 4/4"
      title="제조 파트너 (EMS / CM) 선정"
      contentBySubIndustry={{ "hardware-iot": defaultContent }}
      defaultContent={defaultContent}
    />
  );
}
