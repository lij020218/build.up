"use client";

import { ListChecks, ShieldCheck, GitBranch, Package } from "lucide-react";
import { ClusterStageTemplate, type ClusterStageContent } from "./ClusterStageTemplate";

/**
 * Cluster B — Hardware/IoT NPI 2/4: BOM 및 공급망 락인
 *
 * 검증 출처:
 *   • CISA HBOM Framework (Hardware Bill of Materials Framework for Supply Chain Risk)
 *     https://www.cisa.gov/resources-tools/resources/hardware-bill-materials-hbom-framework-supply-chain-risk-management
 *   • Z2Data, OpenBOM, Altium, AGS — single-source 리스크 + dual-sourcing 표준 권장
 */
const defaultContent: ClusterStageContent = {
  keyAction: {
    title: "Single-source 부품 식별 + 2차 공급사 확보 — 6-12개월 단종 위험을 미리 잡습니다",
    detail: "BOM 에 부품·공급사·리드타임·대안 부품을 모두 명시. 핵심 부품 dual-sourcing 계약 (CISA HBOM 표준 권장). Single-source 리스크가 있는 항목은 안전재고 (safety stock) 또는 재설계 옵션 미리 준비.",
  },
  facts: [
    {
      icon: ListChecks,
      label: "BOM 항목 표준",
      value: "부품번호 + 제조사 + 공급사 + 단가 + 리드타임 + 대안 부품 + 사용 위치 + 수량 + 인증/RoHS 정보",
      source: "Z2Data · OpenBOM",
    },
    {
      icon: ShieldCheck,
      label: "CISA HBOM 권장: dual-sourcing",
      value: "핵심 부품은 1차/2차 공급사 동시 계약. Single-source 의존은 공급망 단절·품질 이슈·가격 협상력 상실의 직접 원인",
      source: "CISA HBOM Framework",
    },
    {
      icon: GitBranch,
      label: "Long-leadtime 부품 식별",
      value: "MCU·통신칩·디스플레이·센서 등 일반적으로 12-26주 leadtime — 양산 일정 잡기 전 락인",
      source: "Altium BOM Guide",
    },
    {
      icon: Package,
      label: "안전재고 (safety stock) 계획",
      value: "Single-source 부품은 평균 사용량의 3-6개월분 미리 확보. 재설계 가능 부품은 1-2개월분",
      source: "OpenBOM · CISA",
    },
  ],
  traps: [
    {
      label: "Single-source 부품을 모르고 양산 시작",
      text: "MCU·센서·디스플레이 한 개라도 단종되면 6-12개월 양산 정지. BOM에 dual-source 안 된 항목은 빨강으로 표시 + 재설계 트리거 정의.",
    },
    {
      label: "리드타임을 부품가에만 신경 쓰고 양산 일정에 반영 안 함",
      text: "26주 부품을 '여유 있게 8주 전 발주'하면 양산 18주 정지. 가장 긴 리드타임이 양산 시작 시점을 결정.",
    },
    {
      label: "공급사 신용·재무 상태 미확인",
      text: "공급사가 1년 후 부도 → 핵심 부품 단종. 발주 전 공급사 매출·신용등급·생산 캐파 확인 필수.",
    },
  ],
  links: [
    { name: "CISA HBOM Framework (영문 PDF)", href: "https://www.cisa.gov/sites/default/files/2023-09/A%20Hardware%20Bill%20of%20Materials%20Framework%20for%20Supply%20Chain%20Risk%20Management%20(508).pdf", desc: "공급망 리스크 관리 표준" },
    { name: "BOM 종합 가이드 — Z2Data", href: "https://www.z2data.com/insights/what-is-a-bill-of-materials" },
  ],
};

export function BomSupplyChainStage() {
  return (
    <ClusterStageTemplate
      stepLabel="Cluster B — Hardware NPI 2/4"
      title="BOM 및 공급망 락인"
      contextLabel="10단계 / 22"
      contentBySubIndustry={{ "hardware-iot": defaultContent }}
      defaultContent={defaultContent}
    />
  );
}
