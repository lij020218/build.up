"use client";

/**
 * useReportSnapshot — 일·주·월·분기 단위 보고서 본문 데이터 집계.
 *
 * 데이터 소스: dailyEntries + monthlyCosts + costHistory (모두 zustand · 로컬 데이터, LLM/네트워크 0).
 * 출력: ReportShell 이 그대로 렌더링할 수 있는 정규화된 메트릭 + 7~14 포인트 차트 시리즈.
 *
 * 기간 정의 (KST 기준, getBusinessDay 동일 컷오프 가능하지만 Snapshot 은 단순화 — 자정 기준):
 *   - day:     오늘 (가장 최근 entry, 없으면 어제 폴백)
 *   - week:    이번 주 월~일
 *   - month:   이번 달 1일~말일
 *   - quarter: 이번 분기 (1~3 / 4~6 / 7~9 / 10~12)
 *
 * 비교 기간:
 *   - day → 7일 평균 vs 그 이전 7일 평균 (요일 효과 흡수)
 *   - week → 지난 주
 *   - month → 지난 달
 *   - quarter → 직전 분기
 */

import { useMemo } from "react";
import type { DashboardHook, DailyEntry, MonthlyCosts } from "../useDashboard";
import { getKstDate } from "../utils/business-day";

export type ReportPeriod = "day" | "week" | "month" | "quarter";

export type ReportSnapshot = {
  period: ReportPeriod;
  /** 사람에게 보여줄 라벨 (예: "5월 5일", "5월 1주", "2026년 5월", "Q2 2026") */
  label: string;
  /** 매출 합계 (원) */
  revenueKrw: number;
  /** 비교 기간 매출 합계 */
  prevRevenueKrw: number;
  /** 매출 증감 % (이전 기간 대비) — 비교 불가능하면 null */
  revenueChangePct: number | null;
  /** 매출 발생 일수 */
  daysWithSales: number;
  /** 일평균 매출 */
  avgDailyRevenue: number;
  /** 비용 합계 (해당 기간에 비례 분배 — 월 비용 × 일수/30) */
  costsKrw: number;
  /** 마진 (revenue - costs) */
  marginKrw: number;
  /** 마진률 % */
  marginPct: number | null;
  /** Prime cost (재료비 + 인건비) 비율 */
  primeRatePct: number | null;
  /** 차트용 시리즈 (label, value) */
  chartSeries: Array<{ label: string; value: number }>;
  /** 비용 분해 (해당 기간 비례) */
  costBreakdown: { ingredients: number; labor: number; rent: number; utilities: number; other: number };
  /** 핵심 한 줄 (룰 기반 — LLM 호출 X) */
  headline: string;
  /** 다음 액션 추천 (1개) */
  nextAction: string;
  /** 정보 부족 여부 */
  insufficientData: boolean;
};

const fmtMonthDay = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`;

function periodRange(period: ReportPeriod, now: Date): { start: Date; end: Date; prevStart: Date; prevEnd: Date; label: string } {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  if (period === "day") {
    const start = startOfDay(now);
    const end = endOfDay(now);
    const prevStart = startOfDay(new Date(now.getTime() - 86_400_000));
    const prevEnd = endOfDay(new Date(now.getTime() - 86_400_000));
    return { start, end, prevStart, prevEnd, label: fmtMonthDay(now) };
  }

  if (period === "week") {
    const dow = now.getDay();
    const monOffset = dow === 0 ? -6 : 1 - dow;
    const monday = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + monOffset));
    const sunday = endOfDay(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6));
    const prevMonday = startOfDay(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 7));
    const prevSunday = endOfDay(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 1));
    return { start: monday, end: sunday, prevStart: prevMonday, prevEnd: prevSunday, label: `${fmtMonthDay(monday)} ~ ${fmtMonthDay(sunday)}` };
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start, end, prevStart, prevEnd, label: `${now.getFullYear()}년 ${now.getMonth() + 1}월` };
  }

  // quarter
  const q = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), q * 3, 1);
  const end = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
  const prevQ = q === 0 ? { y: now.getFullYear() - 1, q: 3 } : { y: now.getFullYear(), q: q - 1 };
  const prevStart = new Date(prevQ.y, prevQ.q * 3, 1);
  const prevEnd = new Date(prevQ.y, prevQ.q * 3 + 3, 0, 23, 59, 59, 999);
  return { start, end, prevStart, prevEnd, label: `Q${q + 1} ${now.getFullYear()}` };
}

function isoStr(d: Date): string {
  return getKstDate(d);
}

function sumRevenue(entries: DailyEntry[], start: Date, end: Date): { sum: number; days: number } {
  const sIso = isoStr(start);
  const eIso = isoStr(end);
  const filtered = entries.filter((e) => e.date >= sIso && e.date <= eIso);
  return {
    sum: filtered.reduce((s, e) => s + e.sales, 0),
    days: filtered.length,
  };
}

function periodCostFactor(period: ReportPeriod, start: Date, end: Date): number {
  // 월 비용을 기간에 비례 분배. day=1/30, week=7/30, month=1.0, quarter=3.0
  if (period === "day") return 1 / 30;
  if (period === "week") return 7 / 30;
  if (period === "month") return 1;
  if (period === "quarter") {
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    return days / 30;
  }
  return 1;
}

export function useReportSnapshot(d: DashboardHook, period: ReportPeriod, referenceNow?: Date): ReportSnapshot {
  return useMemo(() => {
    const entries = ((d.dailyEntries as DailyEntry[] | undefined) ?? []).slice().sort((a, b) => a.date.localeCompare(b.date));
    const costs = (d.monthlyCosts as MonthlyCosts | undefined) ?? { ingredients: 0, labor: 0, rent: 0, utilities: 0, sga: 0, marketing: 0, other: 0, interest: 0 } as MonthlyCosts;

    const now = referenceNow ?? new Date();
    const { start, end, prevStart, prevEnd, label } = periodRange(period, now);

    const cur = sumRevenue(entries, start, end);
    const prev = sumRevenue(entries, prevStart, prevEnd);

    const factor = periodCostFactor(period, start, end);
    const monthlyCostsTotal =
      costs.ingredients + costs.labor + costs.rent + costs.utilities +
      (costs.sga ?? 0) + (costs.marketing ?? 0) + costs.other + (costs.interest ?? 0);
    const costsForPeriod = Math.round(monthlyCostsTotal * factor);
    const margin = cur.sum - costsForPeriod;
    const marginPct = cur.sum > 0 ? Math.round((margin / cur.sum) * 1000) / 10 : null;
    const primePct = cur.sum > 0
      ? Math.round(((costs.ingredients + costs.labor) * factor / cur.sum) * 1000) / 10
      : null;

    const revenueChangePct = prev.sum > 0
      ? Math.round(((cur.sum - prev.sum) / prev.sum) * 1000) / 10
      : null;

    // 차트 시리즈 — period 별 그라뉼래러티
    const chartSeries = (() => {
      if (period === "day") {
        // 최근 14일 일별
        const last14: Array<{ label: string; value: number }> = [];
        for (let i = 13; i >= 0; i--) {
          const t = new Date(now.getTime() - i * 86_400_000);
          const iso = isoStr(t);
          const s = entries.filter((e) => e.date === iso).reduce((sum, e) => sum + e.sales, 0);
          last14.push({ label: `${t.getMonth() + 1}/${t.getDate()}`, value: s });
        }
        return last14;
      }
      if (period === "week") {
        // 최근 8주 주별 합계
        const arr: Array<{ label: string; value: number }> = [];
        const dow = now.getDay();
        const monOffset = dow === 0 ? -6 : 1 - dow;
        const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + monOffset);
        for (let w = 7; w >= 0; w--) {
          const wMon = new Date(thisMonday.getTime() - w * 7 * 86_400_000);
          const wSun = new Date(wMon.getTime() + 6 * 86_400_000 + (24 * 3600 - 1) * 1000);
          const s = sumRevenue(entries, wMon, wSun).sum;
          arr.push({ label: `${wMon.getMonth() + 1}/${wMon.getDate()}`, value: s });
        }
        return arr;
      }
      if (period === "month") {
        // 최근 6개월 월별 합계
        const arr: Array<{ label: string; value: number }> = [];
        for (let m = 5; m >= 0; m--) {
          const start = new Date(now.getFullYear(), now.getMonth() - m, 1);
          const end = new Date(now.getFullYear(), now.getMonth() - m + 1, 0, 23, 59, 59);
          const s = sumRevenue(entries, start, end).sum;
          arr.push({ label: `${start.getMonth() + 1}월`, value: s });
        }
        return arr;
      }
      // quarter — 최근 4분기
      const arr: Array<{ label: string; value: number }> = [];
      const q = Math.floor(now.getMonth() / 3);
      for (let qi = 3; qi >= 0; qi--) {
        const tq = q - qi;
        const yr = now.getFullYear() + Math.floor(tq / 4);
        const qNorm = ((tq % 4) + 4) % 4;
        const start = new Date(yr, qNorm * 3, 1);
        const end = new Date(yr, qNorm * 3 + 3, 0, 23, 59, 59);
        const s = sumRevenue(entries, start, end).sum;
        arr.push({ label: `Q${qNorm + 1}`, value: s });
      }
      return arr;
    })();

    const insufficientData = entries.length === 0 || (period !== "day" && cur.days === 0);

    // ─── headline & nextAction (룰 기반, LLM 0) ───
    let headline: string;
    let nextAction: string;

    if (insufficientData) {
      headline = "아직 데이터가 부족해요.";
      nextAction = "오늘 매출을 입력하면 첫 보고서가 만들어집니다.";
    } else if (period === "day") {
      // referenceNow 기준 그 일자의 매출만 카운트 (cur 은 이미 start/end 로 필터됨).
      // 영업 중 모드에서 referenceNow=어제 → 오늘 잘못 입력된 데이터가 섞이지 않음.
      const isToday = isoStr(now) === isoStr(new Date());
      const dayLabel = isToday ? "오늘" : "어제";
      const last7 = entries.slice(-7).reduce((s, e) => s + e.sales, 0) / Math.min(7, entries.length);
      const dayValue = cur.sum;
      const diff = last7 > 0 ? ((dayValue - last7) / last7) * 100 : 0;
      headline = diff >= 5
        ? `${dayLabel} 매출 ${formatKrw(dayValue)} — 7일 평균 대비 +${Math.round(diff)}%, 좋은 흐름입니다.`
        : diff <= -5
          ? `${dayLabel} 매출 ${formatKrw(dayValue)} — 7일 평균 대비 ${Math.round(diff)}%, 원인 점검이 필요합니다.`
          : `${dayLabel} 매출 ${formatKrw(dayValue)} — 7일 평균과 비슷한 흐름.`;
      nextAction = diff <= -5
        ? "매출이 떨어진 요일·시간대를 확인하고, 운영 메모를 1줄 적어두세요."
        : `${dayLabel} 잘 팔린 메뉴 1개와 그 이유를 1줄로 메모하면, 패턴이 보이기 시작합니다.`;
    } else {
      const trendTxt = revenueChangePct == null
        ? "비교할 이전 기간 데이터가 없어요"
        : revenueChangePct >= 5 ? `이전 대비 +${revenueChangePct}% 상승`
          : revenueChangePct <= -5 ? `이전 대비 ${revenueChangePct}% 하락`
          : `이전 대비 ${revenueChangePct >= 0 ? "+" : ""}${revenueChangePct}% — 안정`;
      headline = `${label} 매출 ${formatKrw(cur.sum)} · ${trendTxt}.`;
      if (primePct != null && primePct > 65) {
        nextAction = `프라임코스트가 ${primePct}% — 65% 위험선 초과. 재료비·인건비 분해부터 점검하세요.`;
      } else if (revenueChangePct != null && revenueChangePct <= -5) {
        nextAction = "하락 원인 진단이 우선. 요일·메뉴·리뷰 3축에서 1개라도 가설을 세워 보세요.";
      } else if (revenueChangePct != null && revenueChangePct >= 5) {
        nextAction = "상승세를 만든 변화를 1줄로 적어두세요. 다음 분기에 그것이 자산이 됩니다.";
      } else {
        nextAction = "안정 구간입니다. 한 가지 작은 실험(메뉴·시간·채널)으로 다음 단계를 준비해 보세요.";
      }
    }

    return {
      period,
      label,
      revenueKrw: cur.sum,
      prevRevenueKrw: prev.sum,
      revenueChangePct,
      daysWithSales: cur.days,
      avgDailyRevenue: cur.days > 0 ? Math.round(cur.sum / cur.days) : 0,
      costsKrw: costsForPeriod,
      marginKrw: margin,
      marginPct,
      primeRatePct: primePct,
      chartSeries,
      costBreakdown: {
        ingredients: Math.round(costs.ingredients * factor),
        labor: Math.round(costs.labor * factor),
        rent: Math.round(costs.rent * factor),
        utilities: Math.round(costs.utilities * factor),
        other: Math.round((costs.other + (costs.sga ?? 0) + (costs.marketing ?? 0) + (costs.interest ?? 0)) * factor),
      },
      headline,
      nextAction,
      insufficientData,
    };
  }, [d.dailyEntries, d.monthlyCosts, period, referenceNow]);
}

function formatKrw(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만원`;
  return `${Math.round(n).toLocaleString()}원`;
}
