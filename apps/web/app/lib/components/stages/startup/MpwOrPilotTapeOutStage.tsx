"use client";

import { Layers, Banknote, ClipboardCheck, Hourglass } from "lucide-react";
import { ClusterStageTemplate, type ClusterStageContent } from "./ClusterStageTemplate";

/**
 * Cluster D — Extreme Deep Tech 2/4: MPW 또는 파일럿 테이프아웃
 *
 * 검증 출처 (이중 검증):
 *   • AnySilicon — MPW 90-95% 절감, 6-9개월 생산
 *     https://anysilicon.com/multi-project-wafer-mpw-service-and-price/
 *   • Wikipedia MPW service — 동일 정의
 *   • TSMC MPW Shared Block (Muse Semiconductor)
 *   • SkyWater · GlobalFoundries · Tower · X-FAB · EUROPRACTICE — 다양한 옵션
 *   • Silicon Analysts — Full mask: 28nm $1M+, 7nm $10M+
 */

const semiconductor: ClusterStageContent = {
  keyAction: {
    title: "MPW shuttle 우선 — Full mask 의 5-10% 비용으로 검증 후 양산 결정",
    detail: "MPW (Multi-Project Wafer) 는 shared wafer run 으로 여러 design 동시 제작. 비용 90-95% 절감 (수만~수십만달러). 검증 후 Full mask 전환 (28nm $1M+, 7nm $10M+). 단, 생산 시간은 동일 (6-9개월). 잘못된 노드 선택 = 전면 재설계.",
  },
  facts: [
    {
      icon: Layers,
      label: "MPW vs Full Mask",
      value: "MPW: 공유 wafer, 90-95% 절감, 수만~수십만달러 / Full mask: 단독 wafer, 28nm $1M+, 7nm $10M+",
      source: "AnySilicon · Silicon Analysts",
    },
    {
      icon: Hourglass,
      label: "생산 시간",
      value: "MPW 도 Full mask 도 6-9개월 동일. 비용은 다르지만 일정은 동일",
      source: "AnySilicon",
    },
    {
      icon: Banknote,
      label: "MPW 옵션",
      value: "TSMC Shared Block (Muse Semi), SkyWater, GlobalFoundries, Tower, X-FAB, EUROPRACTICE — 노드·공정·일정 비교",
      source: "Muse Semi · EUROPRACTICE",
    },
    {
      icon: ClipboardCheck,
      label: "테이프아웃 패키지 요건",
      value: "GDS-II + DRC clean + LVS clean + 검증 보고서 + 일정 등록. 4개 이상 sub-design = TSMC $1,000 추가 verification fee",
      source: "Muse Semi · TSMC",
    },
  ],
  traps: [
    { label: "공정 노드 잘못 선택 → 전면 재설계 (1-2년 손실)", text: "성능·전력·비용 trade-off 잘못 추정 시 노드 변경 = 전면 재설계. EDA 단계에서 정확한 추정 + 파운드리 사전 협의." },
    { label: "MPW shuttle 일정 놓침 → 6개월 대기", text: "MPW 는 정해진 일정에만 진행. 일정 놓치면 다음 shuttle 까지 6개월 대기. EUROPRACTICE/TSMC schedule 미리 확인." },
    { label: "DRC/LVS clean 안 된 상태로 제출 → 거부", text: "Design Rule Check / Layout Versus Schematic clean 안 되면 즉시 거부. 제출 1-2주 전 마지막 verification." },
  ],
  links: [
    { name: "MPW Service & Price — AnySilicon", href: "https://anysilicon.com/multi-project-wafer-mpw-service-and-price/" },
    { name: "TSMC MPW Shared Block — Muse Semi", href: "https://www.musesemi.com/shared-block-tapeout-pricing" },
    { name: "EUROPRACTICE MPW (유럽)", href: "https://europractice-ic.com/services/fabrication/" },
    { name: "SkyWater MPW Programs", href: "https://www.skywatertechnology.com/technology-and-design-enablement/mpw-programs/" },
  ],
  wrapup: {
    nextStageLabelKo: "패키징·테스트",
    doneItemsKo: [
      { label: "1. MPW shuttle 일정 등록", detail: "TSMC·SkyWater·EUROPRACTICE 비교 후 1순위 등록" },
      { label: "2. GDS-II + DRC/LVS clean", detail: "제출 1~2주 전 마지막 verification, clean 미달 시 거부" },
      { label: "3. 노드 결정", detail: "성능·전력·비용 trade-off 분석 후 노드 확정 (28nm·22nm·14nm·7nm)" },
      { label: "4. 검증 보고서·일정", detail: "Foundry 요구 검증 자료 + 4+ sub-design 시 verification fee 별도" },
    ],
    verifyItemsKo: [
      "노드 — 잘못 선택 시 전면 재설계 1~2년 손실, EDA 단계에서 정확한 추정 + Foundry 협의",
      "MPW 일정 — 정해진 일정만 진행, 놓치면 다음 shuttle 6개월 대기",
      "DRC/LVS — clean 안 된 상태 제출 시 즉시 거부, 마지막 verification 필수",
      "양산 전환 비용 — 28nm $1M+·7nm $10M+, MPW 검증 후 자본 확보 후 양산",
      "공급망 — Foundry 캐파 확보 사전 계약, 양산 직전 캐파 부족 위험",
      "수출 통제 — 14nm 이하 첨단 노드는 수출 통제 대상, 외국 투자·고객 사전 검토",
    ],
    nextSummaryKo: "MPW 테이프아웃 + DRC/LVS 통과 → 패키징·테스트 단계로 진입",
  },
};

const climate: ClusterStageContent = {
  keyAction: {
    title: "파일럿 라인 또는 1차 시제품 양산 — 디지털 검증 후 실물 검증",
    detail: "디지털 시뮬레이션 통과한 디자인을 작은 규모 실물로 제작. 배터리: 셀 100-1000개 / 태양광: 모듈 10-100개 / 열교환기: 1-3 unit. 첫 실물 검증에서 spec 80%+ 달성 시 다음 단계.",
  },
  facts: [
    { icon: Layers, label: "파일럿 규모", value: "전체 양산의 0.1-1% — 핵심 spec 검증 가능한 최소 수량" },
    { icon: ClipboardCheck, label: "검증 항목", value: "기능·성능·안전·내구성·환경 영향 - 5개 모두 통과해야 양산 진입" },
  ],
  traps: [
    { label: "디지털 검증만 믿고 양산 시작 → 1차 양산 spec 미달", text: "시뮬레이션과 실물은 항상 차이. 파일럿으로 차이 확인 후 양산." },
  ],
  wrapup: {
    nextStageLabelKo: "패키징·테스트",
    doneItemsKo: [
      { label: "1. 파일럿 규모 결정", detail: "전체 양산의 0.1~1% — 핵심 spec 검증 가능 최소 수량" },
      { label: "2. 5축 검증", detail: "기능·성능·안전·내구성·환경 영향 모두 통과 확인" },
      { label: "3. 양산 차이 분석", detail: "시뮬레이션 vs 실물 차이 정량화, 양산 보정 계수 도출" },
      { label: "4. 인증·표준 점검", detail: "전기·환경·안전 표준 사전 점검, 양산 전 인증 확보" },
    ],
    verifyItemsKo: [
      "환경 영향 — 라이프사이클 평가 (LCA) 사전 수행, 양산 후 환경법 위반 적발 위험",
      "안전 — 고전압·화학 시스템은 PL 보험 + 사고 대비 시설",
      "표준 — IEC·KS·UL 등 적용 표준 사전 식별, 누락 시 양산 후 인증 거부",
      "환경부 — 폐기물 처리 위탁 계약, 자가 처리 시 환경법 위반",
      "지속가능성 — ESG 인증·친환경 인증 사전 검토, 정부 지원금·탄소배출권 활용",
      "수율 — 파일럿 수율과 양산 수율 차이 시뮬, 양산 캐파 충분 확보",
    ],
    nextSummaryKo: "파일럿 양산 + 5축 검증 통과 → 패키징·테스트 단계로 진입",
  },
};

export function MpwOrPilotTapeOutStage() {
  return (
    <ClusterStageTemplate
      stageId="mpw-or-pilot-tape-out"
      stepLabel="Cluster D — Extreme Deep Tech 2/4"
      title="MPW 또는 파일럿 테이프아웃"
      contextLabel="10단계 / 22"
      contentBySubIndustry={{
        "semiconductor": semiconductor,
        "climate-energy": climate,
      }}
      defaultContent={semiconductor}
    />
  );
}
