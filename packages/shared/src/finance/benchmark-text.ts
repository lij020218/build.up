// ════════════════════════════════════════════════════════════════════════
// benchmark-text.ts — 업종 벤치마크 비교 텍스트 SSOT
// ════════════════════════════════════════════════════════════════════════
//
// "내 지표 vs 업종 평균" 한 줄 비교를 생성하는 단일 진입점.
// 손익/원가율 카드 · 매출 카드 · 일일 보고서 · AI 코칭이 모두 이 함수를 끌어쓴다.
//
// ── 설계 원칙 (LAUNCH_READINESS_MASTER §A · Toast/LinkedIn Salary 조사 기반) ──
//  1. 가짜숫자 0: 해당 category+metric 벤치마크가 없으면 null 반환 → 미표시.
//     절대 "상위 30%" 같은 코호트 사칭 금지(아직 유저 실측 집계 없음).
//  2. 정직한 라벨: source 는 현재 항상 "industry"(공개 연구·실태조사값).
//     유저 데이터가 카테고리×매출단계 셀당 N≥30 쌓이면 같은 UI 문구의
//     데이터 소스만 "industry"→"cohort" 로 교체(UI 불변, 출처만 moat 업그레이드).
//  3. 매출단계(revenueStage): Toast 조사 결론 "피어셋 정밀도가 결론을 가른다" 반영해
//     시그니처에 받지만, **현재 (A) 큐레이트 데이터는 전부 category-only(단계 무관)** 라
//     단계별 숫자를 위조하지 않고 category 기준으로 폴백한다. 단계는 (B) 코호트
//     집계(v_cohort_benchmarks by category×stage)가 생길 때 비로소 사용된다.
//  4. 신호등 0: status 는 데이터일 뿐. 색은 UI 가 결정(good=네이비 농담, risk만 벽돌).
//
// 재사용(신설 아닌 심화): COST_RATIO_THRESHOLDS · COMMON_THRESHOLDS · gradeKpi ·
//   mapIndustryToGroup · getCostThreshold (finance/unified-health.ts) +
//   getIndustryBenchmark (knowledge/franchise-benchmarks.ts).
// iOS 미러: apps/ios/Sources/FoundOneCore/BenchmarkTextRegistry.swift (1:1, 양쪽 동시 수정).

import {
  COMMON_THRESHOLDS,
  COST_RATIO_THRESHOLDS,
  gradeKpi,
  mapIndustryToGroup,
  type IndustryGroup,
  type KpiThreshold,
  type HealthGrade,
} from "./unified-health";
import { getIndustryBenchmark } from "../knowledge/franchise-benchmarks";

/** 비교 가능한 지표. cost-ratio 계열은 COST_RATIO_THRESHOLDS, margin 은 COMMON_THRESHOLDS,
 *  monthlyRevenue 는 INDUSTRY_BENCHMARKS(평균 기반)를 끌어쓴다. */
export type BenchmarkMetric =
  | "ingredientRatio"
  | "laborRatio"
  | "rentRatio"
  | "primeCost"
  | "marketingRatio"
  | "deliveryRatio"
  | "operatingMargin"
  | "monthlyRevenue"; // 만원 단위

/**
 * 매출단계(사업 규모). (A) 큐레이트 데이터는 아직 단계 무관이라 폴백되지만,
 * 호출부가 지금부터 넘겨두면 (B) 코호트 전환 시 UI 변경 없이 정밀도만 올라간다.
 * undefined = 단계 미상(category 기준).
 */
export type RevenueStage =
  | "seed" // 월매출 ~1천만 미만 / 극초기
  | "growth" // 1천만 ~ 5천만
  | "scale" // 5천만 ~ 3억
  | "mature"; // 3억+

/** 데이터 출처 종류. "industry"=공개 실태조사값(현재) · "cohort"=유저 실측 집계(스케일 도달 후). */
export type BenchmarkSource = "industry" | "cohort";

/** UI 가 소비하는 비교 상태. 색 매핑은 UI 책임(여기선 색 결정 안 함). */
export type BenchmarkStatus = "good" | "watch" | "risk";

export interface BenchmarkResult {
  /** 예: "외식 평균 원가율" / "Restaurant avg. food-cost" */
  label: string;
  /** 업종 평균 범위/기준 라벨. 예: "35–45%" · "≥10%" · "월 2,100만원" */
  rangeLabel: string;
  /** 사장님 값 라벨. 예: "34%" · "월 1,800만원" */
  myLabel: string;
  /** 완성된 한 줄. 예: "외식 평균 원가율 35–45% · 사장님 34% — 양호" */
  narrative: string;
  status: BenchmarkStatus;
  source: BenchmarkSource;
  /** 감사 가능성: 임계값/평균의 출처 문구(KREI 2024 등). */
  sourceNote: string;
}

type Lang = "ko" | "en";

// cost-ratio metric → unified-health 의 cost 카테고리 키 매핑
const COST_METRIC_KEY: Partial<
  Record<BenchmarkMetric, "ingredients" | "labor" | "rent" | "marketing" | "primeCost" | "delivery">
> = {
  ingredientRatio: "ingredients",
  laborRatio: "labor",
  rentRatio: "rent",
  marketingRatio: "marketing",
  primeCost: "primeCost",
  deliveryRatio: "delivery",
};

const GROUP_LABEL: Record<IndustryGroup, { ko: string; en: string }> = {
  restaurant: { ko: "외식", en: "Restaurant" },
  cafe: { ko: "카페", en: "Cafe" },
  retail: { ko: "소매", en: "Retail" },
  ecommerce: { ko: "이커머스", en: "E-commerce" },
  beauty: { ko: "미용", en: "Beauty" },
  service: { ko: "서비스업", en: "Service" },
  saas: { ko: "SaaS", en: "SaaS" },
  general: { ko: "업종", en: "Industry" },
};

const METRIC_LABEL: Record<BenchmarkMetric, { ko: string; en: string }> = {
  ingredientRatio: { ko: "식자재율", en: "food-cost ratio" },
  laborRatio: { ko: "인건비율", en: "labor ratio" },
  rentRatio: { ko: "임차료율", en: "rent ratio" },
  primeCost: { ko: "원가율(프라임코스트)", en: "prime cost" },
  marketingRatio: { ko: "마케팅비율", en: "marketing ratio" },
  deliveryRatio: { ko: "배달수수료율", en: "delivery-fee ratio" },
  operatingMargin: { ko: "영업이익률", en: "operating margin" },
  monthlyRevenue: { ko: "월매출", en: "monthly revenue" },
};

const STATUS_WORD: Record<BenchmarkStatus, { ko: string; en: string }> = {
  good: { ko: "양호", en: "good" },
  watch: { ko: "주의", en: "watch" },
  risk: { ko: "관리 필요", en: "needs attention" },
};

function gradeToStatus(grade: HealthGrade): BenchmarkStatus | null {
  switch (grade) {
    case "healthy":
      return "good";
    case "caution":
      return "watch";
    case "warning":
    case "critical":
      return "risk";
    default:
      return null; // unknown → 미표시
  }
}

/** lowerIsBetter: "healthy–warning" 정상~상한 범위. higherIsBetter: "≥healthy". */
function rangeLabelFor(t: KpiThreshold): string {
  if (t.direction === "higherIsBetter") {
    return `≥${t.healthy}%`;
  }
  return `${t.healthy}–${t.warning}%`;
}

function pct(v: number): string {
  return `${Math.round(v * 10) / 10}%`;
}

/** 만원 단위 금액 → "월 2,100만원" / "₩21.0M/mo" */
function manwon(v: number, lang: Lang): string {
  const rounded = Math.round(v);
  if (lang === "en") {
    return `₩${(rounded / 100).toFixed(1)}M/mo`;
  }
  return `월 ${rounded.toLocaleString("ko-KR")}만원`;
}

function buildNarrative(
  label: string,
  rangeLabel: string,
  myLabel: string,
  status: BenchmarkStatus,
  lang: Lang
): string {
  const word = STATUS_WORD[status][lang];
  if (lang === "en") {
    return `${label} ${rangeLabel} · you ${myLabel} — ${word}`;
  }
  return `${label} ${rangeLabel} · 사장님 ${myLabel} — ${word}`;
}

/**
 * 내 지표 vs 업종 평균 한 줄 비교를 생성한다.
 *
 * @param categoryId 업종 ID(웹 union "food"|"cafe-dessert"|... 또는 iOS rawValue). 느슨 매칭됨.
 * @param revenueStage 매출단계(현재 (A)는 단계 무관 → 폴백, (B) 코호트용 forward-compat).
 * @param metric 비교 지표.
 * @param myValue 사장님 값(비율 metric=%, monthlyRevenue=만원).
 * @param language "ko" | "en".
 * @returns 벤치마크 없으면 **null**(미표시). 가짜 0 절대 금지.
 */
export function benchmarkText(
  categoryId: string | undefined,
  revenueStage: RevenueStage | undefined,
  metric: BenchmarkMetric,
  myValue: number,
  language: Lang = "ko"
): BenchmarkResult | null {
  if (!Number.isFinite(myValue)) return null;
  // revenueStage 는 현재 (A) 단계에서 의도적으로 미사용(데이터 단계 무관). (B) 코호트에서 활성.
  void revenueStage;

  const group = mapIndustryToGroup(categoryId);

  // ── 1. cost-ratio 계열 (식자재/인건비/임차료/프라임/마케팅/배달) ──
  const costKey = COST_METRIC_KEY[metric];
  if (costKey) {
    // 직접 조회(cross-group 폴백 금지): 해당 업종에 그 지표가 실제 정의된 경우에만 노출.
    // getCostThreshold 는 group→general→restaurant 로 폴백해 "업종 평균"이라며 외식 숫자를
    // 보여줄 수 있어(부정직) 여기선 쓰지 않는다.
    const t = COST_RATIO_THRESHOLDS[group]?.[costKey];
    if (!t) return null; // 해당 업종에 이 비용항목 벤치마크 없음 → 미표시
    const status = gradeToStatus(gradeKpi(myValue, t));
    if (!status) return null;
    const label =
      language === "en"
        ? `${GROUP_LABEL[group].en} avg. ${METRIC_LABEL[metric].en}`
        : `${GROUP_LABEL[group].ko} 평균 ${METRIC_LABEL[metric].ko}`;
    const rangeLabel = rangeLabelFor(t);
    const myLabel = pct(myValue);
    return {
      label,
      rangeLabel,
      myLabel,
      status,
      source: "industry",
      sourceNote: t.source,
      narrative: buildNarrative(label, rangeLabel, myLabel, status, language),
    };
  }

  // ── 2. 영업이익률 (전 업종 공통 기준) ──
  if (metric === "operatingMargin") {
    const t = COMMON_THRESHOLDS.operatingMargin;
    const status = gradeToStatus(gradeKpi(myValue, t));
    if (!status) return null;
    const label =
      language === "en"
        ? `Industry avg. ${METRIC_LABEL.operatingMargin.en}`
        : `${METRIC_LABEL.operatingMargin.ko} 기준`;
    const rangeLabel = rangeLabelFor(t);
    const myLabel = pct(myValue);
    return {
      label,
      rangeLabel,
      myLabel,
      status,
      source: "industry",
      sourceNote: t.source,
      narrative: buildNarrative(label, rangeLabel, myLabel, status, language),
    };
  }

  // ── 3. 월매출 (업종 평균 기반 — 분포 상한/하한 없이 평균 대비 위치만, 가치판단 최소화) ──
  if (metric === "monthlyRevenue") {
    const ib = getIndustryBenchmark(categoryId ?? "");
    if (!ib || !Number.isFinite(ib.avgAnnualRevenue) || ib.avgAnnualRevenue <= 0) return null;
    const avgMonthly = ib.avgAnnualRevenue / 12; // 만원
    // 평균 대비 ±15% 밴드: 안쪽=평균권(watch=중립), 위=good, 아래=risk(매출 부진 신호)
    const ratio = myValue / avgMonthly;
    const status: BenchmarkStatus = ratio >= 1.15 ? "good" : ratio >= 0.85 ? "watch" : "risk";
    const label =
      language === "en"
        ? `${GROUP_LABEL[group].en} avg. ${METRIC_LABEL.monthlyRevenue.en}`
        : `${GROUP_LABEL[group].ko} 평균 ${METRIC_LABEL.monthlyRevenue.ko}`;
    const rangeLabel = manwon(avgMonthly, language);
    const myLabel = manwon(myValue, language);
    return {
      label,
      rangeLabel,
      myLabel,
      status,
      source: "industry",
      // 분포가 추정인 업종은 그 사실을 출처에 명시(정직성)
      sourceNote: ib.isEstimate
        ? "소상공인시장진흥공단 실태조사 평균 (분포 추정)"
        : "소상공인시장진흥공단 실태조사 평균",
      narrative: buildNarrative(label, rangeLabel, myLabel, status, language),
    };
  }

  return null;
}
