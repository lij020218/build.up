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
};

export function MpwOrPilotTapeOutStage() {
  return (
    <ClusterStageTemplate
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
