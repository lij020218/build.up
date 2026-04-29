"use client";

import { Boxes, TestTube, TrendingUp, Shield } from "lucide-react";
import { ClusterStageTemplate, type ClusterStageContent } from "./ClusterStageTemplate";

/**
 * Cluster D — Extreme Deep Tech 3/4: 패키징 및 테스트 (OSAT)
 *
 * 검증 출처 (이중 검증):
 *   • Silicon Analysts — OSAT 가격 5-20% 인상 (2026), specialists +30%
 *     https://siliconanalysts.com/analysis/semiconductor-repricing-wave-price-hikes-reshape-chip-supply-chain
 *   • TrendForce — OSAT 90% utilization (AI demand)
 *   • MarketGrowth Reports — 2026 시장 USD 51.12B
 *   • AnySilicon · Wevolver — OSAT 정의·기능
 */

const semiconductor: ClusterStageContent = {
  keyAction: {
    title: "OSAT 파트너 일찍 락인 — 2026년 가격 5-30% 인상, 가동률 90%",
    detail: "ASE·Amkor·JCET·Powertech 등 OSAT 비교. AI 수요로 캐파 부족 — 늦으면 양산 일정 흔들림. 테스트 플랜 (wafer-level / package-level + ATE + burn-in + yield 임계치) 미리 정의.",
  },
  facts: [
    {
      icon: TrendingUp,
      label: "2026 OSAT 가격 동향",
      value: "ASE 가격 5-20% 인상, 메모리 패키징 specialists 최대 30% 인상. AI 서버 수요로 가동률 90%",
      source: "Silicon Analysts · TrendForce 2026",
    },
    {
      icon: Boxes,
      label: "주요 OSAT (글로벌)",
      value: "ASE Technology (1위) · Amkor · JCET · Powertech · ChipMOS · SPIL · Tongfu — 능력·캐파·기술 비교",
      source: "OSAT Market Reports 2026",
    },
    {
      icon: TestTube,
      label: "테스트 단계",
      value: "wafer-level (CP) → die separation → package assembly → package-level (FT) → reliability/burn-in → outgoing QA",
      source: "AnySilicon",
    },
    {
      icon: Shield,
      label: "Yield 임계치",
      value: "wafer yield (정상 die 비율) + final test yield (최종 양품 비율) — 두 단계 모두 95%+ 가 양산 손익 분기",
    },
  ],
  traps: [
    { label: "OSAT 락인 늦음 → 캐파 부족으로 양산 지연", text: "AI 수요로 OSAT 가동률 90% — 늦으면 6-12개월 대기. MPW 단계부터 OSAT 협의 시작." },
    { label: "테스트 플랜 부실 → 불량 양품 출하", text: "테스트 커버리지 부족하면 고객사 RMA 폭발. 양산 전 테스트 패턴 검증 + DPM (Defects Per Million) 목표 설정." },
    { label: "패키지 변경 = 재설계 + 재검증", text: "패키지 종류 (BGA·QFN·CSP) 한 번 정하면 변경 시 die 핀 배치 재설계. 처음에 신중히 결정." },
  ],
  links: [
    { name: "OSAT 시장 분석 — Silicon Analysts", href: "https://siliconanalysts.com/analysis/semiconductor-repricing-wave-price-hikes-reshape-chip-supply-chain" },
    { name: "OSAT Backbone — Wevolver", href: "https://www.wevolver.com/article/osat-semiconductor-services-the-backbone-of-outsourced-chip-assembly-testing" },
    { name: "OSAT 기본 — AnySilicon", href: "https://anysilicon.com/osat-outsourced-semiconductor-assembly-and-test/" },
  ],
};

const climate: ClusterStageContent = {
  keyAction: {
    title: "파일럿 양산 검증 — 1차 product 의 일관성·내구성·안전 시험",
    detail: "파일럿 라인에서 만든 1차 제품을 최소 4-12주 시험. 내구성 사이클 + 환경 적응 (온도·습도·UV·진동) + 안전 (전기·화학·기계) 모두 통과.",
  },
  facts: [
    { icon: TestTube, label: "내구성 시험", value: "배터리: 1000-3000 cycle / 태양광: UV 1000h+ / 열교환기: 5000h 가속 노화" },
    { icon: Shield, label: "안전 시험", value: "전기: 절연·누설전류 / 화학: 누출·독성 / 기계: 진동·낙하·압력" },
  ],
  traps: [
    { label: "단기 시험만으로 양산 → 장기 사용에서 결함 폭발", text: "가속 노화 시험으로 5-10년 시뮬레이션 미리. 단기 데이터만으로 양산 = 회수 + 평판 손실." },
  ],
};

export function PackagingAndTestStage() {
  return (
    <ClusterStageTemplate
      stepLabel="Cluster D — Extreme Deep Tech 3/4"
      title="패키징 및 테스트 (OSAT)"
      contextLabel="11단계 / 22"
      contentBySubIndustry={{
        "semiconductor": semiconductor,
        "climate-energy": climate,
      }}
      defaultContent={semiconductor}
    />
  );
}
