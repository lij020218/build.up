/**
 * computeWeakestDayPct — 요일별 매출 패턴: 가장 약한 요일이 일평균의 몇 %인지.
 *
 *  AI 코칭에 "월요일만 일평균 수준으로 끌어올리면 월 +N만원" 류 제안을 유도하는 신호.
 *  반환: 예) 64 = 최약 요일 평균이 전체 일평균의 64%. 편차가 거의 없으면(>=95) undefined.
 *  조건: 최소 2주(14일)치 매출 + 표본 2개 이상인 요일이 4종 이상 (신뢰 가능할 때만).
 *  날짜 요일은 KST 달력 기준 — `T00:00:00Z` + getUTCDay 로 타임존 무관하게 계산.
 */
export function computeWeakestDayPct(entries: ReadonlyArray<{ date: string; sales: number }>): number | undefined {
  const withSales = entries.filter((e) => e.sales > 0);
  if (withSales.length < 14) return undefined;

  const sums = new Array(7).fill(0);
  const counts = new Array(7).fill(0);
  for (const e of withSales) {
    const dow = new Date(`${e.date}T00:00:00Z`).getUTCDay(); // 0=일 … 6=토
    sums[dow] += e.sales;
    counts[dow] += 1;
  }

  const weekdayAvgs: number[] = [];
  for (let i = 0; i < 7; i++) if (counts[i] >= 2) weekdayAvgs.push(sums[i] / counts[i]);
  if (weekdayAvgs.length < 4) return undefined; // 요일 다양성 부족

  const overallAvg = withSales.reduce((s, e) => s + e.sales, 0) / withSales.length;
  if (overallAvg <= 0) return undefined;

  const pct = Math.round((Math.min(...weekdayAvgs) / overallAvg) * 100);
  return pct < 95 ? pct : undefined; // 편차 거의 없으면 노이즈 → 생략
}
