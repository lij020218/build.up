//
//  cluster-budget-benchmarks.ts — cluster 별 평균 창업 자본 벤치마크 (만원 단위)
//
//  목적:
//   사용자의 시작 자본금 입력값을 동일 cluster 신규 창업자 평균과 비교해 표시.
//   "부족" 같은 verdict 가 아니라 "평균과의 차이"라는 descriptive frame.
//   부족분이 있으면 매칭되는 지원 프로그램을 항상 함께 표시 (action pair).
//
//  데이터 출처:
//   • 오프라인 (food/cafe/retail 등): 소상공인시장진흥공단 점포창업가이드 + 공정거래위원회 가맹사업 통계
//   • 온라인 디지털: 중기부 온라인 창업 실태조사
//   • 기술 스타트업: 중기부 창업기업 실태조사 + KOSME 청년창업사관학교 지원 자금 분포
//   • 딥테크·반도체: TIPS 지원 평균 + 산업부 R&D 평균 (변동성 큼, 추정치로 명시)
//
//  주의:
//   숫자는 2024-2025 시장 추정치. 정확한 출처는 source 필드에 명시.
//   딥테크/반도체는 케이스 편차가 매우 크므로 mid-range 사용.
//

import type { ClusterId } from "./roadmap/clusters";

export interface ClusterBudgetBenchmark {
  /** 평균 (만원) */
  avgWan: number;
  /** 중앙값 (만원) */
  medianWan: number;
  /** 25분위 — 진입 가능 최저선 (만원) */
  p25Wan: number;
  /** 75분위 — 평균 이상 안정권 (만원) */
  p75Wan: number;
  /** 데이터 출처 표기 */
  source: string;
  /** 데이터 기준 연도 */
  yearReported: number;
  /** 추정치 여부 (true 면 UI 에 "추정" 라벨 표시) */
  isEstimate?: boolean;
}

export const CLUSTER_BUDGET_BENCHMARKS: Record<ClusterId, ClusterBudgetBenchmark> = {
  // ── 오프라인 (소진공·가맹통계 기반) ──
  "offline-food": {
    avgWan: 7200,
    medianWan: 6000,
    p25Wan: 4500,
    p75Wan: 9500,
    source: "소상공인시장진흥공단 점포창업가이드 + 공정위 가맹사업 통계",
    yearReported: 2024,
  },
  "offline-cafe": {
    avgWan: 8500,
    medianWan: 7200,
    p25Wan: 5500,
    p75Wan: 11000,
    source: "한국 커피전문점 창업비용 조사 + 공정위 가맹사업 통계",
    yearReported: 2024,
  },
  "offline-retail": {
    avgWan: 5500,
    medianWan: 4500,
    p25Wan: 3000,
    p75Wan: 7500,
    source: "소상공인시장진흥공단 도소매업 통계",
    yearReported: 2024,
  },
  "offline-beauty": {
    avgWan: 6500,
    medianWan: 5500,
    p25Wan: 4000,
    p75Wan: 9000,
    source: "미용업 창업비용 가이드",
    yearReported: 2024,
  },
  "offline-fitness": {
    avgWan: 12000,
    medianWan: 9000,
    p25Wan: 6000,
    p75Wan: 16000,
    source: "휘트니스·스포츠 시설 창업비용 조사",
    yearReported: 2024,
  },
  "offline-education": {
    avgWan: 4500,
    medianWan: 3500,
    p25Wan: 2500,
    p75Wan: 6000,
    source: "교육서비스업 창업가이드",
    yearReported: 2024,
  },
  "offline-pet": {
    avgWan: 5500,
    medianWan: 4500,
    p25Wan: 3000,
    p75Wan: 7500,
    source: "반려동물 사업 창업비용",
    yearReported: 2024,
  },
  "offline-living": {
    avgWan: 4500,
    medianWan: 3500,
    p25Wan: 2500,
    p75Wan: 6500,
    source: "생활서비스업 통계",
    yearReported: 2024,
  },
  "offline-space": {
    avgWan: 15000,
    medianWan: 10000,
    p25Wan: 6000,
    p75Wan: 22000,
    source: "공간대여업 창업비용 추정",
    yearReported: 2024,
    isEstimate: true,
  },

  // ── 온라인 ──
  "online-digital": {
    avgWan: 1000,
    medianWan: 700,
    p25Wan: 300,
    p75Wan: 1800,
    source: "중기부 온라인 창업 실태조사 + 소호몰 진입 비용",
    yearReported: 2024,
  },

  // ── 기술 스타트업 ──
  "tech-software": {
    avgWan: 5000,
    medianWan: 3000,
    p25Wan: 1500,
    p75Wan: 8000,
    source: "중기부 창업기업 실태조사 (소프트웨어 시드 단계)",
    yearReported: 2024,
  },
  "tech-hardware": {
    avgWan: 15000,
    medianWan: 10000,
    p25Wan: 6000,
    p75Wan: 25000,
    source: "하드웨어 스타트업 EVT-DVT 평균 (TIPS 지원 데이터)",
    yearReported: 2024,
    isEstimate: true,
  },
  "tech-deeptech-lab": {
    avgWan: 50000,
    medianWan: 30000,
    p25Wan: 15000,
    p75Wan: 80000,
    source: "딥테크 (로봇·바이오) 시드 평균 — TIPS·산업부 R&D",
    yearReported: 2024,
    isEstimate: true,
  },
  "tech-extreme-deeptech": {
    avgWan: 100000,
    medianWan: 60000,
    p25Wan: 30000,
    p75Wan: 200000,
    source: "반도체·클린테크 초기 단계 (MPW·파일럿 라인 기준)",
    yearReported: 2024,
    isEstimate: true,
  },
};

// MARK: - 인사이트 계산

export type BudgetInsightTone = "shortage" | "near-average" | "surplus" | "no-input";

export interface BudgetInsight {
  tone: BudgetInsightTone;
  /** 사용자 입력 (만원). 0 이면 미입력. */
  userWan: number;
  /** 업종 평균 (만원) */
  avgWan: number;
  /** delta = userWan - avgWan (음수면 부족) */
  deltaWan: number;
  /** delta 의 절대값을 (월 운영비 기준) 개월수로 환산. monthlyEstimateWan 인자로 받음. */
  deltaMonths: number;
  /** 사람이 읽는 한 줄 요약 (verdict 가 아니라 descriptive) */
  headlineKo: string;
  /** 부연 설명 (선택적, 운영자금·범위 등 추가 맥락) */
  subtitleKo: string;
  /** 매칭 프로그램 추천 사유 (사용자에게 보여줌) */
  programIntroKo: string;
  /** 원본 벤치마크 */
  benchmark: ClusterBudgetBenchmark;
}

/**
 * 사용자 입력 자본금과 cluster 평균을 비교해 인사이트를 생성한다.
 * @param cluster — 사용자의 cluster
 * @param userBudgetWon — 사용자가 입력한 시작 자본금 (원 단위, 0 이면 미입력)
 * @param monthlyEstimateWan — cluster 월 운영비 추정치 (만원). 없으면 환산 생략.
 */
export function computeBudgetInsight(
  cluster: ClusterId,
  userBudgetWon: number,
  monthlyEstimateWan?: number,
): BudgetInsight {
  const benchmark = CLUSTER_BUDGET_BENCHMARKS[cluster];
  const userWan = Math.round(userBudgetWon / 10_000);
  const deltaWan = userWan - benchmark.avgWan;
  const deltaMonths = monthlyEstimateWan && monthlyEstimateWan > 0
    ? Math.abs(deltaWan) / monthlyEstimateWan
    : 0;

  if (userWan <= 0) {
    return {
      tone: "no-input",
      userWan: 0,
      avgWan: benchmark.avgWan,
      deltaWan: 0,
      deltaMonths: 0,
      headlineKo: `같은 업종 평균 ${benchmark.avgWan.toLocaleString()}만원`,
      subtitleKo: `25~75 분위는 ${benchmark.p25Wan.toLocaleString()}~${benchmark.p75Wan.toLocaleString()}만원입니다`,
      programIntroKo: "자본금을 입력하면 맞춤 프로그램을 보여드려요",
      benchmark,
    };
  }

  // ±15% 안쪽이면 near-average
  const ratio = userWan / benchmark.avgWan;
  if (ratio >= 0.85 && ratio <= 1.15) {
    return {
      tone: "near-average",
      userWan,
      avgWan: benchmark.avgWan,
      deltaWan,
      deltaMonths,
      headlineKo: `업종 평균과 거의 같은 수준이에요`,
      subtitleKo: `같은 업종 평균 ${benchmark.avgWan.toLocaleString()}만원과 ${deltaWan >= 0 ? "+" : ""}${deltaWan.toLocaleString()}만원 차이`,
      programIntroKo: "이 단계에서 받을 수 있는 추가 지원 프로그램이에요",
      benchmark,
    };
  }

  if (ratio < 0.85) {
    // 부족
    return {
      tone: "shortage",
      userWan,
      avgWan: benchmark.avgWan,
      deltaWan,
      deltaMonths,
      headlineKo: `업종 평균보다 ${Math.abs(deltaWan).toLocaleString()}만원 적습니다`,
      subtitleKo: deltaMonths >= 1
        ? `운영자금 약 ${deltaMonths.toFixed(1)}개월치 분량입니다`
        : `같은 업종 평균 ${benchmark.avgWan.toLocaleString()}만원 기준`,
      programIntroKo: "이 차이를 보완할 수 있는 지원 프로그램이에요",
      benchmark,
    };
  }

  // 여유 (ratio > 1.15)
  return {
    tone: "surplus",
    userWan,
    avgWan: benchmark.avgWan,
    deltaWan,
    deltaMonths,
    headlineKo: `업종 평균보다 ${deltaWan.toLocaleString()}만원 여유 있어요`,
    subtitleKo: `25~75 분위 ${benchmark.p25Wan.toLocaleString()}~${benchmark.p75Wan.toLocaleString()}만원 기준 상위권`,
    programIntroKo: "이 단계에서 활용해보면 좋은 보너스 프로그램이에요",
    benchmark,
  };
}
