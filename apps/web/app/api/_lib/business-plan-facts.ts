/**
 * 사업계획서 — 검증된 정량 데이터 블록 빌더.
 *
 *  배경(2026-07 실호출 품질 리뷰): 프롬프트가 "TAM/SAM/SOM 은 출처를 명시하라"고 요구하지만
 *  정작 *데이터를 주지 않아*, 모델이 기관명만 대고 수치는 회피하는 출력을 냈다.
 *    · "통계청 「전국사업체조사」에 따르면 … 비중은 매우 크며"  ← 수치 없음 = 인용 흉내
 *    · "국내 소상공인을 수십만~수백만 단위로 볼 수 있으나"      ← 시장규모 정량화 실패
 *  심사위원이 원문 대조하면 오히려 신뢰도가 깎이는, 우리 서비스 급소.
 *
 *  해법: 지어내게 두지 말고 **우리 SSOT 를 주입**하고(=C), 없는 값은 **정직하게 비우게**(=B) 한다.
 *  우리 데이터에도 없는 특수 업종이거나 데이터가 낡았을 때만 web_search 로 보강(=A).
 *
 *  ⚠️ 이 블록에 넣는 수치는 전부 SSOT 원본이어야 한다. 여기서 임의 가공/추정하면
 *     "가짜 출처"를 우리 손으로 만드는 셈이라 목적이 무너진다.
 */

import {
  getIndustryBenchmark,
  resolveBudgetBenchmark,
  getClusterForSubIndustry,
  getFranchiseBrandById,
  CLUSTER_LABEL,
  SPECIALTY_BUDGET_BENCHMARKS,
} from "@foundone/shared";

/**
 * web_search 로 보강할 만큼 데이터가 낡았다고 볼 연차.
 *
 *  ⚠️ 3 으로 두면 안 된다 — offline-food 클러스터 벤치마크가 2022년(농식품부 실태조사) 기준이라
 *     *가장 흔한 업종인 음식점 전부* 가 web_search 를 타게 된다. "특수 케이스만" 이라는 원칙이 깨지고
 *     비용·지연이 상시화된다. 5 로 두면 현재 데이터(2022~2025)는 아무것도 트리거하지 않고,
 *     연식은 아래 STALE_NOTE_YEARS 로 *정직하게 표기*해 해결한다(B).
 */
const STALE_AFTER_YEARS = 5;

/** 이 연차 이상이면 web_search 는 안 하되, 블록에 "연식 주의" 를 붙여 모델이 밝히게 한다. */
const STALE_NOTE_YEARS = 3;

export type PlanFacts = {
  /** 프롬프트에 주입할 검증된 데이터 블록. 빈 문자열이면 주입할 사실이 없음. */
  factsBlock: string;
  /** true 면 web_search 로 시장 데이터를 보강해야 함 (특수 업종 or 노후 데이터). */
  needsWebSearch: boolean;
  /** web_search 가 필요한 사유 (로그·프롬프트용). null 이면 불필요. */
  webSearchReason: string | null;
  /** web_search 시 사용할 검색 주제 라벨 (사람이 읽는 업종명). */
  searchLabel: string;
};

export function buildPlanFacts(input: {
  industryCategoryId: string;
  specialtyId?: string;
  franchiseBrandId?: string;
  /** 사장님 초기 자본금(원). 벤치마크 대비 비교를 *서버에서* 계산해 넣기 위해 받는다. */
  capitalWon?: number;
  /** 클라이언트가 아는 사람이 읽는 업종명(있으면 우선). 서버엔 category/specialty 라벨 SSOT 가 없다. */
  industryLabel?: string;
  subIndustryLabel?: string;
}): PlanFacts {
  const { industryCategoryId, specialtyId, franchiseBrandId } = input;
  const lines: string[] = [];
  const missing: string[] = [];

  const cluster = getClusterForSubIndustry(specialtyId, industryCategoryId);
  // 라벨 우선순위: 클라 전달 > 클러스터 라벨 > ID 그대로. (없는 라벨을 지어내지 않는다)
  const catLabel = input.industryLabel?.trim()
    || (cluster ? CLUSTER_LABEL[cluster].ko : industryCategoryId);
  const spLabel = input.subIndustryLabel?.trim() || null;
  const searchLabel = spLabel ?? catLabel;

  // ── 1. 업종 매출 벤치마크 (연매출 평균·상위10%·하위10%) ──
  const ib = getIndustryBenchmark(industryCategoryId);
  if (ib) {
    lines.push(
      `[업종 연매출 벤치마크 — ${catLabel}]`,
      `· 평균 연매출: ${ib.avgAnnualRevenue.toLocaleString()}만원`,
      `· 상위 10%: ${ib.top10PctRevenue.toLocaleString()}만원 / 하위 10%: ${ib.bottom10PctRevenue.toLocaleString()}만원`,
      `· 상위권 공통 차별화 요인: ${ib.keyDifferentiators.join(" / ")}`,
    );
    // 출처 표기 — 공식 통계면 그대로 인용, 내부 추정이면 추정임을 밝히게 한다.
    //   (2026-07 데이터 부채 해결로 source/yearReported 가 생겼다. 그전엔 모델이
    //    "출처: 업종 연매출 벤치마크, 연도 미제공" 이라고 써서 오히려 이상했다)
    if (ib.avgIsEstimate) {
      lines.push(
        `· ※ 평균 연매출은 **내부 추정치**(공식 통계 미확인)입니다. 기관 출처를 만들어 붙이지 말고,`,
        `   "업계 추정 기준" 으로만 쓰거나 "[확인 필요: 공식 통계 출처]" 를 병기하세요.`,
      );
    } else {
      lines.push(`· 출처: ${ib.source}${ib.yearReported ? ` (${ib.yearReported}년 기준)` : ""}`);
      const age = ib.yearReported ? new Date().getFullYear() - ib.yearReported : 0;
      if (age >= STALE_NOTE_YEARS) {
        lines.push(`· ⚠️ ${age}년 전 조사 기준 — 본문에 조사연도를 밝히고 현재와 차이가 있을 수 있음을 함께 쓰세요.`);
      }
    }
    if (ib.isEstimate) {
      lines.push(`· ※ 상위10%/하위10% 분포는 추정치입니다. 단정하지 말고 "추정 분포" 로 표기하세요.`);
    }
  } else {
    missing.push(`${catLabel} 업종 평균 연매출`);
  }

  // ── 2. 창업비용 벤치마크 (세부 업종 우선 → 없으면 클러스터) ──
  //    resolveBudgetBenchmark 는 source·yearReported·isEstimate 를 함께 준다 →
  //    "출처 없는 숫자" 를 막을 유일한 재료라 반드시 같이 싣는다.
  const bb = cluster ? resolveBudgetBenchmark(cluster, specialtyId) : null;
  // 세부업종 벤치마크가 실제로 있는지 — resolveBudgetBenchmark 는 없으면 클러스터로 폴백하므로
  //   반환값만으로는 구분이 안 된다. 키 존재로 직접 확인해야 "특수 업종" 판정이 정확해진다.
  const specialtyHit = Boolean(specialtyId && SPECIALTY_BUDGET_BENCHMARKS[specialtyId]);
  if (bb) {
    const est = bb.isEstimate ? " ※ 추정치" : "";
    lines.push(
      "",
      `[창업비용 벤치마크 — ${specialtyHit ? searchLabel : catLabel}]${est}`,
      `· 평균 ${bb.avgWan.toLocaleString()}만원 / 중앙값 ${bb.medianWan.toLocaleString()}만원`,
      `· 하위25% ${bb.p25Wan.toLocaleString()}만원 ~ 상위25% ${bb.p75Wan.toLocaleString()}만원`,
      `· 월 운영비 추정: ${bb.monthlyOpsEstimateWan.toLocaleString()}만원`,
      `· 출처: ${bb.source} (${bb.yearReported}년 기준)`,
    );
    if (bb.noteKo) lines.push(`· 참고: ${bb.noteKo}`);
    // 벤치마크 대비 비교는 *여기서 계산해서* 준다.
    //   실호출에서 모델이 "8,000만원은 중앙값(9,000만원)보다 높고" 라고 틀린 적이 있다.
    //   사업계획서에서 산수 오류는 곧 신뢰도 붕괴 → LLM 에게 비교를 맡기지 않는다.
    if (input.capitalWon && input.capitalWon > 0) {
      const capWan = Math.round(input.capitalWon / 10000);
      const dAvg = capWan - bb.avgWan;
      const dMed = capWan - bb.medianWan;
      const pct = bb.medianWan > 0 ? Math.round((Math.abs(dMed) / bb.medianWan) * 100) : 0;
      lines.push(
        `· [사장님 자본금 대비 — 계산 완료, 그대로 인용하세요]`,
        `  자본금 ${capWan.toLocaleString()}만원 = 평균(${bb.avgWan.toLocaleString()}만원) 대비 ${dAvg >= 0 ? "+" : "−"}${Math.abs(dAvg).toLocaleString()}만원, ` +
          `중앙값(${bb.medianWan.toLocaleString()}만원) 대비 ${dMed >= 0 ? "+" : "−"}${Math.abs(dMed).toLocaleString()}만원(${pct}% ${dMed >= 0 ? "많음" : "부족"})`,
      );
    }
    // 연식이 오래된 데이터는 web_search 대신 "밝히게" 한다 — 숨기면 그게 가짜 숫자다.
    const age = new Date().getFullYear() - bb.yearReported;
    if (age >= STALE_NOTE_YEARS) {
      lines.push(`· ⚠️ ${age}년 전 조사 기준 — 본문에 조사연도를 반드시 밝히고, 현재 시세와 차이가 있을 수 있음을 함께 쓰세요.`);
    }
  } else {
    missing.push(`${searchLabel} 창업비용 평균`);
  }

  // ── 3. 프랜차이즈 브랜드 실데이터 (공정위 정보공개서 기반) ──
  if (franchiseBrandId) {
    const brand = getFranchiseBrandById(franchiseBrandId);
    if (brand) {
      lines.push(
        "",
        `[프랜차이즈 실데이터 — ${brand.name.ko}]`,
        `· 창업비용 ${brand.startupCostWon.toLocaleString()}만원 / 가맹비 ${brand.franchiseFee.toLocaleString()}만원`,
        `· 가맹점 평균 연매출: ${brand.avgAnnualRevenueWon.toLocaleString()}만원`,
        `· 가맹점 수 ${brand.storeCount.toLocaleString()}개 / 폐점률 ${brand.closureRate}%`,
      );
    }
  }

  // ── 4. web_search 판단 ──
  //    사장님 지침: web_search 는 "특수 업종" 또는 "우리 데이터 오염" 일 때만.
  //    · 특수 업종 = 업종 벤치마크도, 세부 창업비용도 못 찾음 (클러스터 폴백조차 부실)
  //    · 오염     = 데이터가 STALE_AFTER_YEARS 이상 낡음
  //    isEstimate(추정치) 는 트리거 아님 — 전체 41건으로 과반이라 켜면 web_search 남발.
  //      대신 위 블록에 "※ 추정치" 를 붙여 모델이 정직하게 말하도록 한다(B).
  const currentYear = new Date().getFullYear();
  const isStale = Boolean(bb && currentYear - bb.yearReported >= STALE_AFTER_YEARS);
  const isUncovered = !ib && !specialtyHit;

  let webSearchReason: string | null = null;
  if (isUncovered) {
    webSearchReason = `우리 데이터에 '${searchLabel}' 업종 벤치마크가 없음 (특수 업종)`;
  } else if (isStale) {
    webSearchReason = `창업비용 데이터가 ${bb!.yearReported}년 기준으로 ${currentYear - bb!.yearReported}년 경과 (노후)`;
  }

  if (missing.length > 0) {
    lines.push("", `[우리 데이터에 없는 값] ${missing.join(", ")}`);
  }

  return {
    factsBlock: lines.join("\n"),
    needsWebSearch: webSearchReason !== null,
    webSearchReason,
    searchLabel,
  };
}

/**
 * 정직성 규칙 — 모든 사업계획서 프롬프트에 공통 주입.
 *  리뷰에서 잡힌 실패 3종(수치 회피 / 기관명만 인용 / 상권 뭉뚱그리기)을 정면으로 금지한다.
 */
export const PLAN_HONESTY_RULES = `
🔒 수치·출처 규칙 (위반 시 사업계획서가 심사에서 탈락합니다):
1. [검증된 데이터] 블록에 있는 수치는 **출처와 연도를 함께** 인용하세요.
   예: "창업비용 평균 7,270만원 (소상공인시장진흥공단, 2024년 기준)"
2. 블록에 **없는 수치는 절대 지어내지 마세요.** 대신 대괄호 플레이스홀더로 남기세요.
   예: "SAM은 [확인 필요: 통계청 전국사업체조사 기준 해당 업종 사업체 수]로 추정"
3. **기관명만 대고 수치를 흐리는 표현을 금지합니다.**
   ❌ "통계청에 따르면 비중이 매우 크며" / "수십만~수백만 단위로 볼 수 있으나"
   ✅ "통계청 전국사업체조사(2024) 기준 OO개" 또는 "[확인 필요: OO]"
4. "※ 추정치" 표기가 붙은 데이터는 본문에서도 **추정치임을 밝히세요.**
   예: "업계 추정 기준 약 50만원 (정확한 수치는 확인 필요)"
5. 사장님이 입력한 값(자본금·손익분기·인터뷰 결과 등)은 **그대로** 쓰세요. 반올림·각색 금지.
6. **직접 계산하지 마세요.** "계산 완료" 로 표시된 비교 문구는 그대로 인용하고, 표시 안 된 값끼리
   크다/작다·증감률을 새로 계산하지 마세요. (실제로 8,000만원을 9,000만원보다 "높다"고 쓴 오류가 있었습니다.
   사업계획서의 산수 오류는 심사에서 신뢰를 통째로 잃습니다.)
`.trim();
