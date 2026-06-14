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
  wrapup: {
    nextStageLabelKo: "MPW·파일럿 테이프아웃",
    doneItemsKo: [
      { label: "1. EDA 라이선스 모델", detail: "Startup-tier·token·풀 라이선스 비교 + multi-year 협상 (10~25% 할인)" },
      { label: "2. 설계 환경 구축", detail: "RHEL 작업 서버 + 시뮬레이션 클러스터 + GIT 형상관리" },
      { label: "3. IP 라이브러리·표준셀", detail: "Foundry IP·SerDes·메모리 컴파일러 라이선스 사전 확보" },
      { label: "4. 보안·NDA", detail: "Foundry NDA + IP NDA + 직원 NDA 모두 체결, IP 유출 방지" },
    ],
    verifyItemsKo: [
      "라이선스 — 1년 계약 후 갱신 시 가격 인상, 처음부터 2~3년 multi-year 락인",
      "Token 모델 — 단기·가변 사용량 시 비용 효율, 풀 라이선스 자본 소진 방지",
      "IP 보호 — Foundry NDA·IP NDA 체결 없이 EDA 시작 시 IP 유출 + 법적 분쟁",
      "백업·DR — 설계 데이터 다중 백업, EDA 라이선스 서버 다운 시 설계 정지",
      "퇴사자 — 직원 퇴사 시 NDA·경업 금지 강제 가능 한도 확인 (5년 이내가 한계)",
      "Foundry 선정 — TSMC·Samsung·UMC·SMIC 비교, 노드별 가격·캐파·NDA 정책 차이",
    ],
    nextSummaryKo: "EDA 라이선스·설계 환경 셋업 완료 → MPW·파일럿 테이프아웃 단계로 진입",
  },
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
  wrapup: {
    nextStageLabelKo: "MPW·파일럿 테이프아웃",
    doneItemsKo: [
      { label: "1. 시뮬레이션 도구", detail: "MATLAB·Simulink·Comsol·HOMER·EnergyPLAN 도입" },
      { label: "2. 디지털 트윈 모델", detail: "에너지·배터리·열역학 모델로 1차 검증 — 시제품 비용 80% 절감" },
      { label: "3. HPC 환경", detail: "CFD·FEM 시뮬레이션용 GPU·클러스터 또는 AWS/Azure HPC" },
      { label: "4. 실험 데이터 저장", detail: "raw data + 환경 + 모델 버전 자동 로깅, 재현성 보장" },
    ],
    verifyItemsKo: [
      "시뮬레이션 — 미실시 시 실제 인프라 1억 vs 시뮬 100만원, 자본 효율 큰 차이",
      "안전 — 배터리·고전압 시제품은 PL 보험 + 사고 대비 시설 필수",
      "환경법 — 화학·폐기물 처리 사전 위탁, 자가 처리 시 환경법 위반",
      "특허 — 모델·알고리즘 특허 출원, 외부 발표 전 출원 완료",
      "데이터 — raw data + 환경 메타데이터 보관, 인증 자료 활용",
      "외부 자문 — 영역 전문가 자문, 미상황 결정 방지",
    ],
    nextSummaryKo: "시뮬레이션·디지털 트윈·HPC 셋업 완료 → 파일럿 테이프아웃 단계로 진입",
  },
};

export function EdaToolingSetupStage() {
  return (
    <ClusterStageTemplate
      stageId="eda-tooling-setup"
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
