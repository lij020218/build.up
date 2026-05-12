"use client";

/**
 * useIndustryRuleSignal — 11 업종 임계값 기반 룰 신호 hook.
 *
 *  ── 왜 만들었나 (2026-05-12) ──────────────────────────────────────
 *  종전: 같은 룰엔진이 OfflineFounderBrief.tsx 안에 *고립* — Tier 1 hero
 *       (CEOMorningHero) 가 이 신호를 *못 사용* → 두 카드가 비슷한 신호
 *       제시 (안티패턴, Toast IQ·Amplitude 통합 패턴 위배).
 *
 *  현재: 룰엔진을 hook 으로 분리 → CEOMorningHero 의 resolveHero 가
 *       industry rule 우선순위 (1.6) 로 자동 사용. 통합된 단일 hero.
 *
 *  ── 입력 ────────────────────────────────────────────────────────
 *  업종 ID + ratios (재료비/인건비/임대료/primecost) + bepProgress +
 *  weeklySalesChange + 객단가 (totalSales/totalCustomers).
 *  ratiosReady=false 일 때는 비율 신호 제외.
 *
 *  ── 출력 ────────────────────────────────────────────────────────
 *  hero(가장 critical 1개) + secondary(보조 2개). signal=null 이면 신호 없음.
 *  ────────────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import { getIndustryThresholds } from "../industry-thresholds";

export type IndustryRuleSignalKind = "critical" | "important" | "notable" | "good";

export type IndustryRuleSignal = {
  kind: IndustryRuleSignalKind;
  headline: string;
  /** 한국 통계 + 업종 평균 인용 */
  why: string;
  /** 오늘의 행동 — 사장님 본업 어휘 (메뉴/시술/수업/예약) 사용 */
  action: string;
};

export type IndustryRuleResult = {
  /** 가장 critical 한 1개 hero 신호 (null = 데이터 부족 또는 안정 상태) */
  hero: IndustryRuleSignal | null;
  /** 보조 신호 (hero 다음 우선순위 2개) */
  secondary: IndustryRuleSignal[];
  /** 업종 라벨 — hero 카드 헤더 표시용 */
  industryLabel: string;
};

export type IndustryRuleInput = {
  industryCategoryId: string;
  ingredientRatio: number;
  laborRatio: number;
  rentRatio: number;
  primeCost: number;
  ratiosReady: boolean;
  bepProgress: number;
  weeklySalesChange: number;
  totalCustomers: number;
  totalSales: number;
  /** dailyEntries 길이 — 데이터 충분성 가드 */
  dailyEntriesCount: number;
  /** 코칭 메시지 한국어/영어 */
  ko: boolean;
};

export function useIndustryRuleSignal(input: IndustryRuleInput): IndustryRuleResult {
  return useMemo(() => computeIndustryRule(input), [
    input.industryCategoryId,
    input.ingredientRatio,
    input.laborRatio,
    input.rentRatio,
    input.primeCost,
    input.ratiosReady,
    input.bepProgress,
    input.weeklySalesChange,
    input.totalCustomers,
    input.totalSales,
    input.dailyEntriesCount,
    input.ko,
  ]);
}

/** Pure computation — testable, no React dependencies */
export function computeIndustryRule(input: IndustryRuleInput): IndustryRuleResult {
  const {
    industryCategoryId,
    ingredientRatio,
    laborRatio,
    rentRatio,
    primeCost,
    ratiosReady,
    bepProgress,
    weeklySalesChange,
    totalCustomers,
    totalSales,
    ko,
  } = input;

  const t = getIndustryThresholds(industryCategoryId);
  const hasMaterial = t.materialWarn != null && t.materialCritical != null;
  const isFoodLike = industryCategoryId === "food" || industryCategoryId === "cafe-dessert";
  const unitWord = t.unitWord ?? "상품";

  const signals: IndustryRuleSignal[] = [];

  // ── ① Critical signals ──

  // 매출 급락 (업종 무관)
  if (weeklySalesChange < -15) {
    signals.push({
      kind: "critical",
      headline: ko
        ? `매출 WoW ${weeklySalesChange.toFixed(0)}% — 15%+ 급락`
        : `Revenue WoW ${weeklySalesChange.toFixed(0)}% — 15%+ drop`,
      why: ko
        ? `${t.closureStat}. 2주 연속 -15% 하락은 폐업 위험 신호 — 단발성인지 트렌드인지 즉시 확인.`
        : `${t.closureStat}. 2-week consecutive -15% = closure risk.`,
      action: ko
        ? `오늘: 지난 2주 사이 변경 (${unitWord}·가격·운영시간·인력) 1개 점검 + 단골 5명에게 직접 "요즘 어떠셔요" 전화`
        : "Today: review one change in past 2 weeks. Call 5 regulars.",
    });
  }

  // 재료비/매입원가 (업종별; 데이터 있는 업종만)
  if (hasMaterial && ratiosReady && ingredientRatio > (t.materialCritical ?? 999)) {
    signals.push({
      kind: "critical",
      headline: ko
        ? `${t.materialKind} ${ingredientRatio.toFixed(0)}% — ${t.label} 위험선 ${t.materialCritical}% 초과`
        : `${t.materialKind} ${ingredientRatio.toFixed(0)}% — exceeds ${t.materialCritical}%`,
      why: ko
        ? `${t.label} 평균 ${t.materialAvg}. ${t.materialCritical}%+ 는 마진 붕괴 — 즉시 매입처/${unitWord} 재편 필요.`
        : `${t.labelEn} avg ${t.materialAvg}. ${t.materialCritical}%+ = margin collapse.`,
      action: ko
        ? `이번 주: ① 매출 상위 5 ${unitWord} 원가율 재계산 ② 공급처/매입처 3곳 견적 비교 ③ 저마진+저인기 ${unitWord} ${isFoodLike ? "단종" : "정리"}`
        : "This week: ① recompute COGS for top 5 ② quote 3 suppliers ③ kill low-margin items",
    });
  } else if (hasMaterial && ratiosReady && ingredientRatio > (t.materialWarn ?? 999)) {
    signals.push({
      kind: "important",
      headline: ko
        ? `${t.materialKind} ${ingredientRatio.toFixed(0)}% — 점검선`
        : `${t.materialKind} ${ingredientRatio.toFixed(0)}% — review`,
      why: ko
        ? `${t.label} 평균 ${t.materialAvg} 근접. 위험선 ${t.materialCritical}% 진입 전 점검 시점.`
        : `Near ${t.labelEn} avg. Review before ${t.materialCritical}% threshold.`,
      action: ko ? `이번 주: 매출 상위 5 ${unitWord} 원가율 재계산` : "This week: recompute COGS for top 5",
    });
  }

  // 인건비 (업종별 임계값)
  if (ratiosReady && laborRatio > t.laborCritical) {
    signals.push({
      kind: "critical",
      headline: ko
        ? `인건비 ${laborRatio.toFixed(0)}% — ${t.label} 위험선 ${t.laborCritical}% 초과`
        : `Labor ${laborRatio.toFixed(0)}% — exceeds ${t.laborCritical}%`,
      why: ko
        ? `${t.label} 표준 ${t.laborAvg}. ${t.laborCritical}%+ 는 매출 회전 부족 또는 과잉 인력 신호.`
        : `${t.labelEn} std ${t.laborAvg}. ${t.laborCritical}%+ = low turnover OR overstaff.`,
      action: ko
        ? "이번 주: ① 시간대별/요일별 매출 분석 (피크 vs 비피크) ② 비피크 인력 파트타임 전환 검토 ③ 인당 매출(매출/직원수) 추적"
        : "This week: ① time-slot analysis ② shift off-peak to part-time ③ track rev/employee",
    });
  } else if (ratiosReady && laborRatio > t.laborWarn) {
    signals.push({
      kind: "important",
      headline: ko ? `인건비 ${laborRatio.toFixed(0)}% — 점검선` : `Labor ${laborRatio.toFixed(0)}% — review`,
      why: ko ? `${t.label} 표준 상한 ${t.laborWarn}% 근접.` : `Near ${t.labelEn} ceiling.`,
      action: ko ? "이번 달: 시간대별 가동률·인당 매출 점검" : "This month: check time-slot utilization",
    });
  }

  // 임대료 (업종별; 공간임대는 30-50% 정상이라 임계값이 매우 높음)
  if (ratiosReady && rentRatio > t.rentCritical) {
    signals.push({
      kind: "critical",
      headline: ko
        ? `임대료 ${rentRatio.toFixed(0)}% — ${t.label} 위험선 ${t.rentCritical}% 초과`
        : `Rent ${rentRatio.toFixed(0)}% — exceeds ${t.rentCritical}%`,
      why: ko
        ? `${t.label} 표준 ${t.rentAvg}. ${t.rentCritical}%+ 는 고정비 구조상 흑자 도달 어려움.`
        : `${t.labelEn} std ${t.rentAvg}. ${t.rentCritical}%+ = hard to reach profit.`,
      action: ko
        ? "이번 달: ① 임대인과 인하 협상 (인근 시세·공실 데이터 근거) ② 매출 25%+ 증가 plan B ③ 사업 모델 전환 검토"
        : "This month: ① rent negotiation ② +25% revenue plan B ③ business model pivot",
    });
  } else if (ratiosReady && rentRatio > t.rentWarn) {
    signals.push({
      kind: "important",
      headline: ko ? `임대료 ${rentRatio.toFixed(0)}% — 점검선` : `Rent ${rentRatio.toFixed(0)}% — review`,
      why: ko
        ? `${t.label} 표준 상한 ${t.rentWarn}% 근접. 흑자 도달 부담.`
        : `Near ${t.labelEn} ${t.rentWarn}% ceiling.`,
      action: ko ? "이번 분기: 임대료 인하 협상 준비 (시세 데이터 수집)" : "This Q: prep rent negotiation",
    });
  }

  // BEP 진행률 (업종 무관)
  if (ratiosReady && bepProgress > 0 && bepProgress < 60) {
    signals.push({
      kind: "critical",
      headline: ko
        ? `BEP 진행률 ${bepProgress.toFixed(0)}% — 손익분기 60% 미만`
        : `BEP progress ${bepProgress.toFixed(0)}% — below 60%`,
      why: ko
        ? "월 매출이 월 비용의 60% 미만 = 자본 빠르게 소진. 3개월 연속 시 폐업 위험 진입."
        : "Monthly rev < 60% of cost = burning capital.",
      action: ko
        ? "이번 주: ① 현재 자본 잔액·런웨이 계산 (월 적자 × N개월) ② 재도전특별자금 신청 검토 (sbiz.or.kr)"
        : "This week: ① compute runway ② consider 재도전특별자금",
    });
  } else if (ratiosReady && bepProgress >= 60 && bepProgress < 80) {
    signals.push({
      kind: "important",
      headline: ko ? `BEP 진행률 ${bepProgress.toFixed(0)}% — 80% 미만` : `BEP ${bepProgress.toFixed(0)}% — below 80%`,
      why: ko ? "흑자 도달까지 매출 +20% 또는 비용 -20% 필요." : "Need +20% rev or -20% cost.",
      action: ko ? "이번 달: ① 객단가 5% 인상 시도 ② 변동비 -10% 시뮬" : "This month: ① +5% ticket ② -10% variable cost sim",
    });
  }

  // 객단가 (avg ticket) — 업종별 평균 대비
  const avgTicketActual = totalCustomers > 0 ? totalSales / totalCustomers : 0;
  if (t.avgTicketTypical && t.avgTicketTypical > 0 && avgTicketActual > 0) {
    const ratio = avgTicketActual / t.avgTicketTypical;
    const actualWon = Math.round(avgTicketActual).toLocaleString();
    const typicalWon = Math.round(t.avgTicketTypical).toLocaleString();
    const ticketLabel = t.avgTicketLabel ?? "객단가";

    if (ratio < 0.7) {
      signals.push({
        kind: "critical",
        headline: ko
          ? `${ticketLabel} ${actualWon}원 — ${t.label} 평균 ${typicalWon}원의 ${Math.round(ratio * 100)}%`
          : `${ticketLabel} ${actualWon} — ${Math.round(ratio * 100)}% of ${t.labelEn} avg ${typicalWon}`,
        why: ko
          ? `${t.label} 평균 ${typicalWon}원 대비 30%+ 낮음. 저가 ${unitWord} 비중 과다 또는 가격 책정 부족.`
          : `30%+ below ${t.labelEn} avg. Low-price mix overweight OR underpriced.`,
        action: ko
          ? `이번 주: ① 매출 상위 5 ${unitWord} 객단가 vs 평균 비교 ② 업셀 옵션 1개 추가 ③ 가격 인상 5-10% 시뮬`
          : `This week: ① top 5 unit price audit ② add 1 upsell option ③ simulate +5-10% pricing`,
      });
    } else if (ratio < 0.85) {
      signals.push({
        kind: "important",
        headline: ko
          ? `${ticketLabel} ${actualWon}원 — ${t.label} 평균보다 낮음`
          : `${ticketLabel} ${actualWon} — below ${t.labelEn} avg`,
        why: ko ? `${t.label} 평균 ${typicalWon}원. 15-30% 낮음 — 업셀 여지.` : `${t.labelEn} avg ${typicalWon}.`,
        action: ko ? `이번 주: ${unitWord} 1개 업셀 옵션 추가` : `This week: add one upsell option`,
      });
    } else if (ratio > 1.15) {
      signals.push({
        kind: "good",
        headline: ko
          ? `${ticketLabel} ${actualWon}원 — ${t.label} 평균 +${Math.round((ratio - 1) * 100)}%`
          : `${ticketLabel} ${actualWon} — +${Math.round((ratio - 1) * 100)}% vs ${t.labelEn} avg`,
        why: ko ? `프리미엄 포지셔닝 성공 — 객수 확장 단계.` : `Premium positioning success.`,
        action: ko ? "이번 분기: 단골 추천 캠페인·SNS 콘텐츠로 객수 확장" : "This Q: regular-referral + SNS",
      });
    }
  }

  // ── ③ Good signals ──
  if (ratiosReady && bepProgress >= 100) {
    signals.push({
      kind: "good",
      headline: ko ? `BEP 진행률 ${bepProgress.toFixed(0)}% — 흑자 운영` : `BEP ${bepProgress.toFixed(0)}% — profitable`,
      why: ko ? `월 매출 > 월 비용. ${t.label} 안정 운영 단계.` : `Revenue > cost. ${t.labelEn} stable.`,
      action: ko ? "이번 분기: 성장 투자 시점 — 인접 매장·온라인 확장·상품 다각화" : "This Q: growth investment time",
    });
  }

  if (weeklySalesChange > 10) {
    signals.push({
      kind: "good",
      headline: ko ? `매출 WoW +${weeklySalesChange.toFixed(0)}% 성장` : `Revenue WoW +${weeklySalesChange.toFixed(0)}%`,
      why: ko ? `10%+ WoW 성장은 한국 SMB 상위 10% 신호.` : "10%+ WoW = top 10% KR SMB.",
      action: ko ? "이번 주: 지난 2주 어떤 변화가 매출 증가 만들었는지 분석" : "This week: analyze what drove growth",
    });
  }

  if (isFoodLike && ratiosReady && primeCost > 0 && primeCost < (t.primeCostHealthy ?? 60)) {
    signals.push({
      kind: "good",
      headline: ko ? `프라임코스트 ${primeCost.toFixed(0)}% — ${t.label} 표준 우수` : `Prime ${primeCost.toFixed(0)}% — strong`,
      why: ko ? `Toast·NetSuite·Sage 글로벌 상위 quartile.` : "Global top quartile.",
      action: ko ? "유지 — 매분기 재점검" : "Maintain — quarterly review",
    });
  }

  const sortOrder = { critical: 0, important: 1, notable: 2, good: 3 };
  signals.sort((a, b) => sortOrder[a.kind] - sortOrder[b.kind]);
  const hero = signals[0] ?? null;
  const secondary = signals.slice(1, 3);

  return { hero, secondary, industryLabel: t.label };
}
