"use client";

import { Building2, Calendar, Banknote, Globe2 } from "lucide-react";
import { ClusterStageTemplate, type ClusterStageContent } from "./ClusterStageTemplate";

/**
 * Cluster D — Extreme Deep Tech 4/4: 파운드리 파트너십 / 파일럿 라인
 *
 * 검증 출처 (이중 검증):
 *   • Silicon Analysts Q1 2026 — TSMC N3 fully booked, CoWoS 50+ weeks
 *     https://siliconanalysts.com/analysis/foundry-allocation-status-q1-2026
 *   • Dataconomy — TSMC advanced capacity booked through 2028
 *   • SamMobile · BigGo Finance — Samsung 2nm 21,000 wafers/mo target by 2026
 *   • TrendForce — 8-inch foundry 85-90% utilization 2026
 */

const semiconductor: ClusterStageContent = {
  keyAction: {
    title: "파운드리 파트너십 일찍 락인 — TSMC 2/3nm 2027-2028까지 매진",
    detail: "TSMC N2/N3/N5 fully booked through 2027-2028. Samsung Foundry 가 대안 (2nm 21,000 wafers/mo 목표). 구형 노드 (28nm·12nm) 는 SkyWater·Tower·X-FAB·UMC 옵션. CoWoS advanced packaging 52-78주 leadtime.",
  },
  facts: [
    {
      icon: Calendar,
      label: "TSMC 캐파 현황 (2026 Q1 기준)",
      value: "2nm/3nm: 2027-2028 까지 매진 (Apple·Nvidia·AMD·Qualcomm 예약). 7nm 일부 가용",
      source: "Silicon Analysts · Dataconomy",
    },
    {
      icon: Calendar,
      label: "CoWoS Advanced Packaging",
      value: "52-78주 leadtime, 일부는 78-104주. AI 칩 수요 폭발로 advanced packaging 이 새로운 병목",
      source: "Silicon Analysts Q1 2026",
    },
    {
      icon: Building2,
      label: "Samsung Foundry 대안",
      value: "Samsung 2nm 가동, 2026년 말 21,000 wafers/mo 목표. 일부 고객사 (Tesla·Nvidia) 이미 확보",
      source: "SamMobile · BigGo Finance",
    },
    {
      icon: Globe2,
      label: "구형 노드 (28nm 이상) 옵션",
      value: "SkyWater (미국) · Tower (이스라엘) · X-FAB (유럽) · UMC (대만) · GlobalFoundries — startup 친화적 노드 다양",
    },
    {
      icon: Banknote,
      label: "Full mask 양산 비용",
      value: "28nm $1M+ / 7nm $10M+ / 2-3nm 그 이상. 양산 commitment 시 시드 자본 대부분 소진",
      source: "Wikipedia · Silicon Analysts",
    },
  ],
  traps: [
    { label: "TSMC 7nm/5nm 락인 늦음 → 양산 시점 1-2년 지연", text: "최첨단 노드는 2-3년 전 booking. MPW 단계부터 파운드리와 long-term partnership 협의 시작 필수." },
    { label: "CoWoS advanced packaging 무시 → AI 칩 양산 불가", text: "AI 칩은 HBM + interposer + die — CoWoS 필수. 52-78주 leadtime 양산 일정에 반영 안 하면 발표 후 출하 못 함." },
    { label: "구형 노드만 보고 차세대 시장 놓침", text: "28nm 는 진입 장벽 낮지만 AI/모바일/automotive 차세대 칩 7nm 이하. 시장 포지셔닝과 노드 선택 일치 필수." },
  ],
  links: [
    { name: "TSMC Q1 2026 Foundry Allocation Status", href: "https://siliconanalysts.com/analysis/foundry-allocation-status-q1-2026" },
    { name: "TSMC capacity sold through 2028 — Dataconomy", href: "https://dataconomy.com/2026/03/31/tsmcs-advanced-chip-capacity-is-booked-out-through-2028/" },
    { name: "Samsung Foundry 21,000 wafers — Digitimes", href: "https://www.digitimes.com/news/a20251121PD240/samsung-2026-tsmc-2nm-qualcomm.html" },
  ],
};

const climate: ClusterStageContent = {
  keyAction: {
    title: "파일럿 라인 또는 양산 파트너 락인 — 인프라 자본 100억+ 단계",
    detail: "직접 파일럿 라인 구축 (자본 100억+) vs 위탁 양산 파트너 (자본 효율). 정부 R&D 지원·녹색 펀드 활용 + 대기업 (LG에너지솔루션·삼성SDI·한화큐셀 등) 위탁 옵션 비교.",
  },
  facts: [
    {
      icon: Building2,
      label: "한국 클린테크 인프라 옵션",
      value: "배터리: LG에너지솔루션·삼성SDI 위탁 / 태양광: 한화큐셀·신성이엔지 / 에너지: 한전 ESS 파일럿 협업",
    },
    {
      icon: Banknote,
      label: "정부 지원",
      value: "탄소중립 R&D + ESG 투자 + 녹색금융 + KDB 국가성장펀드 (7.45조 규모, 일부 클린테크)",
      source: "KoreaTechDesk 2026",
    },
  ],
  traps: [
    { label: "직접 파일럿 라인 무리하게 구축 → 자본 소진", text: "초기엔 위탁 양산으로 자본 효율. 매출·검증 후 직접 라인 검토." },
  ],
};

export function PartnerFoundationOrPilotLineStage() {
  return (
    <ClusterStageTemplate
      stepLabel="Cluster D — Extreme Deep Tech 4/4"
      title="파운드리 파트너십 / 파일럿 라인"
      contextLabel="12단계 / 22"
      contentBySubIndustry={{
        "semiconductor": semiconductor,
        "climate-energy": climate,
      }}
      defaultContent={semiconductor}
    />
  );
}
