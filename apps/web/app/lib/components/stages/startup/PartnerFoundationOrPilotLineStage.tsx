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
  wrapup: {
    nextStageLabelKo: "법인 설립·운영",
    doneItemsKo: [
      { label: "1. 파운드리 파트너 락인", detail: "TSMC·Samsung·UMC·SkyWater 비교 + 2~3년 전 booking" },
      { label: "2. CoWoS·advanced packaging", detail: "52~78주 leadtime 일정 역산 + 캐파 사전 확보" },
      { label: "3. 노드 vs 시장 포지셔닝", detail: "AI/모바일·automotive·IoT 별 적정 노드 매칭" },
      { label: "4. 양산 자본 확보", detail: "28nm $1M+·7nm $10M+ 이상, 시드 자본 또는 시리즈 A 사전 확보" },
    ],
    verifyItemsKo: [
      "TSMC N2/N3 — 2027~2028 매진, 락인 늦으면 양산 1~2년 지연",
      "CoWoS 무시 — AI 칩은 HBM + interposer + die 필수, 52~78주 leadtime 일정 반영",
      "수출 통제 — 14nm 이하·HBM 등 첨단 노드는 미·중·EU 수출 통제, 외국 고객 사전 검토",
      "노드 선택 — 28nm 진입 장벽 낮지만 차세대 시장 놓침, 시장 포지셔닝과 일치 필수",
      "Foundry 캐파 — 단일 Foundry 의존 시 부도·파업 리스크, 백업 Foundry 사전 검토",
      "지정학 — TSMC 의존 시 대만 지정학 리스크, Samsung·미국 Foundry 분산 검토",
    ],
    nextSummaryKo: "Foundry 락인·CoWoS 캐파·자본 확보 → 법인 설립·운영 단계로 진입",
  },
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
  wrapup: {
    nextStageLabelKo: "법인 설립·운영",
    doneItemsKo: [
      { label: "1. 양산 모델 결정", detail: "직접 파일럿 라인 vs 위탁 양산 비교 — 자본 효율 우선" },
      { label: "2. 한국 대기업 파트너십", detail: "LG에너지솔루션·삼성SDI·한화큐셀 등 위탁 양산 협의" },
      { label: "3. 정부 R&D 지원", detail: "탄소중립·녹색금융·KDB 국가성장펀드 활용" },
      { label: "4. ESG 인증·환경 표준", detail: "친환경 인증 사전 확보, 글로벌 시장 진입 자격" },
    ],
    verifyItemsKo: [
      "자본 — 직접 라인 100억+ 자본 필요, 매출·검증 전 무리 시 자본 소진",
      "환경법 — 폐기물·배출량 사전 인허가, 미준수 시 영업정지 + 환경법 위반",
      "ESG — 글로벌 시장 진입 시 ESG 인증 필수, 미보유 시 대기업 위탁 거절",
      "원자재 — 리튬·코발트·실리콘 등 글로벌 공급망 리스크, 다중 공급사 확보",
      "탄소배출권 — 탄소중립 정책 활용, 미활용 시 비용 부담 증가",
      "정부 지원 — 신청 후 입금 4~12주, 일정 역산 필수",
    ],
    nextSummaryKo: "양산 모델·파트너·ESG 점검 → 법인 설립·운영 단계로 진입",
  },
};

export function PartnerFoundationOrPilotLineStage() {
  return (
    <ClusterStageTemplate
      stageId="partner-foundation-or-pilot-line"
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
