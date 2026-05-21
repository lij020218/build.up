//
//  cluster-budget-benchmarks.ts — cluster 별 평균 창업 자본 벤치마크 (만원 단위)
//
//  목적:
//   사용자의 시작 자본금 입력값을 동일 cluster 신규 창업자 평균과 비교해 표시.
//   "부족" 같은 verdict 가 아니라 "평균과의 차이"라는 descriptive frame.
//   부족분이 있으면 매칭되는 지원 프로그램을 항상 함께 표시 (action pair).
//
//  데이터는 실제 공개 자료에 기반 (각 cluster source 필드 참조).
//  추정치인 경우 isEstimate: true 로 명시 — UI 에 "추정" 라벨 표시.
//
//  자료 검증 완료: 2026-05 (한식진흥원·공정위 정보공개서·중기부·TheVC·바이오타임즈 등)
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
  /** 데이터 출처 표기 (실제 자료 인용) */
  source: string;
  /** 데이터 기준 연도 */
  yearReported: number;
  /** 추정치 여부 (true 면 UI 에 "추정" 라벨 표시) */
  isEstimate?: boolean;
  /** 추가 컨텍스트 (예: "시드 라운드 받은 경우 평균 17억, 부트스트랩 평균 표시 중") */
  noteKo?: string;
  /** 월 운영비 추정치 (만원) — 자본금-평균 차이를 개월수로 환산할 때 사용 */
  monthlyOpsEstimateWan: number;
}

export const CLUSTER_BUDGET_BENCHMARKS: Record<ClusterId, ClusterBudgetBenchmark> = {
  // ── 오프라인 ──
  "offline-food": {
    avgWan: 10436,
    medianWan: 9000,
    p25Wan: 5000,
    p75Wan: 15000,
    source: "농식품부·한식진흥원 한식산업 실태조사 (1,500점 표본)",
    yearReported: 2022,
    monthlyOpsEstimateWan: 1500,
    noteKo: "임대료·인건비·식자재 등 매월 1,200~1,700만원 소요. 가맹점은 평균보다 30~50% 상회 가능.",
  },
  "offline-cafe": {
    avgWan: 12394,
    medianWan: 12000,
    p25Wan: 7000,
    p75Wan: 20000,
    source: "이투데이·퍼펙트커피뉴스 카페창업 평균 (16평 기준)",
    yearReported: 2023,
    monthlyOpsEstimateWan: 1000,
    noteKo: "10평 소형 7,000~10,000만원 / 30평 중형 20,000~30,000만원. 디저트·베이커리는 +30~50%.",
  },
  "offline-retail": {
    avgWan: 17000,
    medianWan: 15000,
    p25Wan: 8000,
    p75Wan: 25000,
    source: "공정위 편의점 정보공개서 (CU·GS25·세븐일레븐) + 의류매장 추정",
    yearReported: 2024,
    isEstimate: true,
    monthlyOpsEstimateWan: 800,
    noteKo: "편의점 17,000만원 / 무인점포 3,000만원 / 의류 1,000~4,000만원. 카테고리 편차 매우 큼.",
  },
  "offline-beauty": {
    avgWan: 5000,
    medianWan: 4000,
    p25Wan: 1200,
    p75Wan: 10000,
    source: "큐플레이스 미용실 가이드 + 에스테틱 1인샵 실제 사례",
    yearReported: 2024,
    monthlyOpsEstimateWan: 600,
    noteKo: "1인 에스테틱·네일·왁싱 1,200만원대부터 / 미용실 10평 5,000~7,000만원 / 대형 30,000만원+",
  },
  "offline-fitness": {
    avgWan: 20000,
    medianWan: 15000,
    p25Wan: 5000,
    p75Wan: 50000,
    source: "ssjum·butterflyinvest 헬스장·필라테스 창업가이드",
    yearReported: 2024,
    monthlyOpsEstimateWan: 1500,
    noteKo: "PT 스튜디오 3,000~7,000만원 / 헬스장 5,000~20,000만원 / 100평+ 50,000만원+. 폐업률 매우 높음.",
  },
  "offline-education": {
    avgWan: 17000,
    medianWan: 15000,
    p25Wan: 10000,
    p75Wan: 25000,
    source: "마이스터디카페·imbeyonder 스터디카페 창업비용 (50평 기준)",
    yearReported: 2024,
    monthlyOpsEstimateWan: 800,
    noteKo: "공부방 1,000만원 미만 / 스터디카페 15,000~20,000만원 / 학원 5,000~30,000만원 편차 큼.",
  },
  "offline-pet": {
    avgWan: 12000,
    medianWan: 10000,
    p25Wan: 3000,
    p75Wan: 20000,
    source: "부자비즈 펫샵 표준비용 (폴리파크·야옹아멍멍해봐 프랜차이즈)",
    yearReported: 2024,
    isEstimate: true,
    monthlyOpsEstimateWan: 700,
    noteKo: "무인 애견샵 3,000만원 / 멀티펫샵 30평 9,500~20,000만원. 동물병원은 별도 (30,000만원+).",
  },
  "offline-living": {
    avgWan: 9000,
    medianWan: 9000,
    p25Wan: 6000,
    p75Wan: 13000,
    source: "모두코리아·imbeyonder 무인세탁(빨래방) 비교",
    yearReported: 2024,
    monthlyOpsEstimateWan: 300,
    noteKo: "무인세탁 6,000~13,000만원 / 일반 세탁소 3,000~7,000만원 / 청소·수리는 1,000~3,000만원.",
  },
  "offline-space": {
    avgWan: 5000,
    medianWan: 3000,
    p25Wan: 2000,
    p75Wan: 8000,
    source: "마이프차 파티룸 + 드림캐쳐스 공유오피스 정보공개서",
    yearReported: 2024,
    isEstimate: true,
    monthlyOpsEstimateWan: 300,
    noteKo: "파티룸 2,000~3,000만원 (가장 저렴) / 공유오피스 프랜차이즈 16,000만원 / 사진 스튜디오 3,000~10,000만원.",
  },

  // ── 온라인 ──
  "online-digital": {
    avgWan: 1500,
    medianWan: 1000,
    p25Wan: 300,
    p75Wan: 3000,
    source: "카페24·토스페이먼츠·아이보스 셀러 가이드 종합",
    yearReported: 2024,
    isEstimate: true,
    monthlyOpsEstimateWan: 250,
    noteKo: "위탁판매 모델 500만원 미만 가능 / 자체 사입+자체몰 3,000만원+. 플랫폼 수수료 3.74~10.8%.",
  },

  // ── 기술 스타트업 ──
  "tech-software": {
    avgWan: 5000,
    medianWan: 3000,
    p25Wan: 1500,
    p75Wan: 8000,
    source: "중기부 창업기업 실태조사 (소프트웨어 부트스트랩 단계)",
    yearReported: 2024,
    monthlyOpsEstimateWan: 2000,
    noteKo: "부트스트랩 평균 표시 중. 시드 라운드 받은 경우 평균 17.3억 (TheVC 2025, 전년比 2배). 3인 팀 월 burn 2,000~2,800만원.",
  },
  "tech-hardware": {
    avgWan: 15000,
    medianWan: 10000,
    p25Wan: 5000,
    p75Wan: 30000,
    source: "와디즈 펀딩 사례 + 중기부 TIPS 하드웨어 지원 평균",
    yearReported: 2024,
    isEstimate: true,
    monthlyOpsEstimateWan: 2000,
    noteKo: "EVT 500~3,000만원 / DVT 3,000~10,000만원 / PVT 10,000~30,000만원 / 금형 3,000~10,000만원 / KC인증 200~800만원.",
  },
  "tech-deeptech-lab": {
    avgWan: 100000,
    medianWan: 80000,
    p25Wan: 30000,
    p75Wan: 200000,
    source: "바이오타임즈 K-의료기기 2024 평균 라운드 + TIPS 딥테크 매칭 18~30억",
    yearReported: 2024,
    isEstimate: true,
    monthlyOpsEstimateWan: 6000,
    noteKo: "의료기기 임상 1건 평균 1.1억 (식약처) / 5인 R&D 팀 월 burn 5,000~9,000만원 / TIPS 딥테크 트랙 최대 15억 + 후속 30억.",
  },
  "tech-extreme-deeptech": {
    avgWan: 500000,
    medianWan: 300000,
    p25Wan: 100000,
    p75Wan: 1000000,
    source: "스타트업레시피·와우테일 팹리스 시드~시리즈A 실제 라운드 (2024~2025)",
    yearReported: 2025,
    isEstimate: true,
    monthlyOpsEstimateWan: 15000,
    noteKo: "팹리스 시드 10~50억 / 시리즈A 100억~900억 (보스반도체 870억·디노티시아 900억). MPW 28nm 7,000만~3.5억 / EDA 라이선스 연 수억~수십억.",
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
  /** delta 의 절대값을 (월 운영비 기준) 개월수로 환산 */
  deltaMonths: number;
  /** 사람이 읽는 한 줄 요약 (verdict 가 아니라 descriptive) */
  headlineKo: string;
  /** 부연 설명 */
  subtitleKo: string;
  /** 매칭 프로그램 추천 사유 */
  programIntroKo: string;
  /** 원본 벤치마크 */
  benchmark: ClusterBudgetBenchmark;
}

/**
 * 사용자 입력 자본금과 cluster 평균을 비교해 인사이트를 생성한다.
 * @param cluster — 사용자의 cluster
 * @param userBudgetWon — 사용자가 입력한 시작 자본금 (원 단위, 0 이면 미입력)
 * @param monthlyEstimateWan — 선택적 override. 미지정 시 benchmark.monthlyOpsEstimateWan 사용.
 * @param franchiseRecommendedWon — 선택. 프랜차이즈 권장 창업 비용 (원 단위). 제공되면 *그 권장값* 과
 *   비교한 결과가 1차 baseline 이 됨. 사용자가 시스템이 알려준 권장값 그대로 입력했으면 "이 브랜드에
 *   적합한 자본금" 으로 표시 (업종 평균과의 모순 메시지 회피).
 */
export function computeBudgetInsight(
  cluster: ClusterId,
  userBudgetWon: number,
  monthlyEstimateWan?: number,
  franchiseRecommendedWon?: number,
): BudgetInsight {
  const benchmark = CLUSTER_BUDGET_BENCHMARKS[cluster];
  const userWan = Math.round(userBudgetWon / 10_000);
  const deltaWan = userWan - benchmark.avgWan;
  const monthlyEst = monthlyEstimateWan ?? benchmark.monthlyOpsEstimateWan;
  const deltaMonths = monthlyEst > 0 ? Math.abs(deltaWan) / monthlyEst : 0;

  // ⚠️ 2026-05-18: 프랜차이즈 권장값 매칭 — 사장님이 시스템이 알려준 프랜차이즈 권장값으로 자본금
  //   설정한 케이스. 업종 평균과의 모순 ("권장 7,000만원으로 설정" → "업종 평균보다 3,436만 부족")
  //   을 차단하고 "이 브랜드에는 적합" + "업종 평균과의 차이는 부가 정보" 톤으로 변경.
  if (franchiseRecommendedWon && franchiseRecommendedWon > 0 && userBudgetWon > 0) {
    const franchiseWan = Math.round(franchiseRecommendedWon / 10_000);
    const franchiseRatio = userBudgetWon / franchiseRecommendedWon;
    const franchiseDelta = userWan - franchiseWan;
    // ±10% 이내면 권장값에 적합한 것으로 판정
    if (franchiseRatio >= 0.9 && franchiseRatio <= 1.1) {
      return {
        tone: "near-average",
        userWan,
        avgWan: benchmark.avgWan,
        deltaWan,
        deltaMonths,
        headlineKo: "이 프랜차이즈에 적합한 자본금이에요",
        subtitleKo:
          `프랜차이즈 권장 ${franchiseWan.toLocaleString()}만원과 ${
            franchiseDelta === 0 ? "동일" : `${franchiseDelta > 0 ? "+" : ""}${franchiseDelta.toLocaleString()}만원 차이`
          } · 같은 업종 평균은 ${benchmark.avgWan.toLocaleString()}만원 (참고)`,
        programIntroKo: "이 프랜차이즈와 함께 받을 수 있는 추가 지원이에요",
        benchmark,
      };
    }
    // 권장값보다 명백히 적으면 (90% 미만) — 그래도 *업종 평균* 단정 메시지는 피하고 *프랜차이즈 권장* 기준
    if (franchiseRatio < 0.9) {
      return {
        tone: "shortage",
        userWan,
        avgWan: benchmark.avgWan,
        deltaWan,
        deltaMonths,
        headlineKo: `이 프랜차이즈 권장 ${franchiseWan.toLocaleString()}만원보다 ${Math.abs(franchiseDelta).toLocaleString()}만원 적습니다`,
        subtitleKo: `같은 업종 평균은 ${benchmark.avgWan.toLocaleString()}만원 (참고)`,
        programIntroKo: "이 차이를 보완할 수 있는 지원 프로그램이에요",
        benchmark,
      };
    }
    // 권장값보다 명백히 많으면 (110% 초과)
    return {
      tone: "surplus",
      userWan,
      avgWan: benchmark.avgWan,
      deltaWan,
      deltaMonths,
      headlineKo: `이 프랜차이즈 권장 ${franchiseWan.toLocaleString()}만원보다 ${franchiseDelta.toLocaleString()}만원 여유 있어요`,
      subtitleKo: `초기 운영자금에 활용 가능 · 같은 업종 평균 ${benchmark.avgWan.toLocaleString()}만원 (참고)`,
      programIntroKo: "이 단계에서 활용해보면 좋은 보너스 프로그램이에요",
      benchmark,
    };
  }

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
