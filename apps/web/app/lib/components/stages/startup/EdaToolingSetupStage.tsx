"use client";

import { Cpu, FileCode, KeyRound, Server } from "lucide-react";
import { ClusterStageTemplate, type ClusterStageContent } from "./ClusterStageTemplate";

/**
 * Cluster D — Extreme Deep Tech 1/4: EDA 도구·설계 환경 셋업
 *
 * 검증 출처 (이중 검증):
 *   • Vendr Marketplace — Synopsys pricing custom, multi-year discount
 *   • Quora / EDABoard — premium tools $750K/seat
 *   • Datagravity Synopsys/Cadence 분석
 *   • JIM Semiconductor Playbook — startup seed $2M-$5M for EDA + tape-out
 */

const semiconductor: ClusterStageContent = {
  keyAction: {
    title: "Multi-year EDA 라이선스 협상 (10-25% 할인) — 칩 설계의 가장 큰 병목입니다",
    detail: "Synopsys/Cadence 라이선스는 6-12개월 commit 단위. Multi-year 계약 시 10-25% 할인. 스타트업 티어 (token-based 또는 startup-tier 옵션) 비교 후 시작. 라이선스 락인 늦으면 설계 진행 자체가 멈춤.",
  },
  facts: [
    {
      icon: KeyRound,
      label: "EDA 라이선스 비용 (참고치 — 협상 가변)",
      value: "premium 단일 시트 $750K/년 가능 (예: SoC Encounter GXL). 스타트업 티어는 더 저렴, full-service all-you-can-eat 도 옵션",
      source: "EDABoard · Quora",
    },
    {
      icon: FileCode,
      label: "Multi-year 할인",
      value: "Synopsys 는 multi-year commit 선호 — 2-3년 계약 시 10-25% 할인 표준",
      source: "Vendr Marketplace 2026",
    },
    {
      icon: Cpu,
      label: "Token-based pricing 옵션",
      value: "단기 / 가변 사용량 startup 에는 token 모델 — 필요 시 도구별 사용. Synopsys Cadence 모두 제공",
      source: "Datagravity",
    },
    {
      icon: Server,
      label: "설계 환경",
      value: "라이선스 서버 + RHEL 작업 서버 + 시뮬레이션 클러스터 (CPU 64+ / RAM 256GB+) + GIT/SVN 형상관리 + 백업",
    },
  ],
  traps: [
    { label: "premium 도구를 처음부터 풀 라이선스로 구매 → 자본 소진", text: "초기엔 startup-tier 또는 token 으로 시작 → 자본 소진 방지. 정식 양산 단계에서 풀 라이선스로 전환." },
    { label: "1-year 계약으로 시작 → 다음 해 협상력 약함", text: "Synopsys/Cadence 는 multi-year 선호. 1년 계약 후 갱신 시 가격 인상. 처음부터 2-3년 계약으로 락인." },
  ],
  links: [
    { name: "Synopsys Pricing — Vendr Marketplace", href: "https://www.vendr.com/marketplace/synopsys" },
    { name: "Semiconductor Founder Playbook — JIM", href: "https://www.jim.com/blog/how-to-start-a-semiconductor-company" },
  ],
};

const climate: ClusterStageContent = {
  keyAction: {
    title: "시뮬레이션 도구·실험설계 — 인프라 투자 전 디지털 검증으로 자본 절감",
    detail: "MATLAB/Simulink·OpenModelica·Comsol 등 시뮬레이션 도구로 디지털 트윈 검증. 실제 인프라 투자 (배터리·열교환기·태양광 셀) 전에 모델로 1차 검증해 시제품 개발 비용 80% 절감.",
  },
  facts: [
    { icon: FileCode, label: "디지털 트윈 도구", value: "에너지 시뮬레이션: HOMER, EnergyPLAN / 배터리: BMS Designer / 열역학: Comsol Multiphysics / 일반: MATLAB/Simulink" },
    { icon: Server, label: "고성능 컴퓨팅", value: "CFD·FEM·열역학 시뮬레이션은 GPU 또는 클러스터 필요. 클라우드 (AWS/Azure HPC) 옵션이 자본 효율" },
  ],
  traps: [
    { label: "시뮬레이션 없이 실제 인프라 투자 → 수억 손실", text: "에너지·배터리는 직접 만들기 전 모델 검증 필수. 시뮬레이션 비용 100만원 vs 실패한 시제품 1억." },
  ],
};

export function EdaToolingSetupStage() {
  return (
    <ClusterStageTemplate
      stepLabel="Cluster D — Extreme Deep Tech 1/4"
      title="EDA 도구·설계 환경 셋업"
      contextLabel="9단계 / 22"
      contentBySubIndustry={{
        "semiconductor": semiconductor,
        "climate-energy": climate,
      }}
      defaultContent={semiconductor}
    />
  );
}
