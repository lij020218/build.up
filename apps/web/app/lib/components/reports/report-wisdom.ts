/**
 * Period 별 거장 인용 풀.
 *
 * 톤 가이드:
 *   - 일: 오늘의 행동·고객 응대 — Bezos·Graham (가장 짧은 호흡)
 *   - 주: PMF·실험·반복 — Graham·Altman·Hoffman
 *   - 월: 리듬·훈련·운영 — Bezos·Horowitz
 *   - 분기: 장기 회고·전략 — Munger·Buffett·Thiel
 *
 * 모두 정적 — LLM 호출 0. period × date 기반 stable selection.
 */

export type ReportPeriodKey = "day" | "week" | "month" | "quarter";

type WisdomEntry = { ko: string; en: string };

const DAY: WisdomEntry[] = [
  { ko: "오늘 한 명의 고객을 정성스레 응대하면 내일 두 명이 옵니다. — Jeff Bezos", en: "Treat one customer with care today; two come tomorrow. — Jeff Bezos" },
  { ko: "사장은 오늘의 작은 결정 하나로 사업 전체의 결을 만든다. — Ben Horowitz", en: "Small daily decisions shape the whole business grain. — Ben Horowitz" },
  { ko: "사람들이 원하는 것을 만들어라. 그게 전부다. — Paul Graham", en: "Make something people want. That's all. — Paul Graham" },
  { ko: "오늘은 Day 1입니다. 어제 잘 됐다고 오늘 방심하지 마세요. — Jeff Bezos", en: "It's always Day 1. Yesterday's success doesn't bring tomorrow's. — Jeff Bezos" },
  { ko: "고객이 떠나는 이유 1개를 찾으면, 매출 10%가 돌아옵니다. — Sam Altman", en: "Find one reason customers leave; 10% revenue returns. — Sam Altman" },
  { ko: "지능보다 결정력. 오늘도 한 번 더 해봅니다. — Paul Graham", en: "Determination beats intelligence. Try once more. — Paul Graham" },
  { ko: "오늘의 매출은 어제까지의 신뢰의 결과입니다. — Warren Buffett", en: "Today's revenue is the residue of yesterday's trust. — Warren Buffett" },
  { ko: "단순하게 하세요. 복잡함은 적이고 단순함은 우군입니다. — Charlie Munger", en: "Simplify. Complexity is the enemy. — Charlie Munger" },
];

const WEEK: WisdomEntry[] = [
  { ko: "이번 주에 잘 된 한 가지 — 그것이 다음 주의 자산입니다. — Paul Graham", en: "What worked this week becomes next week's asset. — Paul Graham" },
  { ko: "PMF 전엔 매출보다 학습이 우선입니다. 어떤 가설이 검증됐나요? — Sam Altman", en: "Before PMF, learning > revenue. Which hypothesis got confirmed? — Sam Altman" },
  { ko: "Make → Measure → Learn — 한 주는 이 세 단계를 한 번 도는 단위입니다. — Eric Ries", en: "Make → Measure → Learn — that's one weekly cycle. — Eric Ries" },
  { ko: "매주 작은 실험 하나. 일년이면 52개의 데이터 포인트입니다. — Reid Hoffman", en: "One small weekly experiment = 52 data points a year. — Reid Hoffman" },
  { ko: "한 주를 정리할 때 「무엇을 그만둘까」가 가장 강력한 질문입니다. — Peter Drucker", en: "End-of-week's strongest question: what will you stop doing? — Peter Drucker" },
  { ko: "주간 리듬이 흔들리면 월간 결과도 흔들립니다. — Ben Horowitz", en: "Shaky weekly rhythm = shaky monthly results. — Ben Horowitz" },
  { ko: "이번 주 단골 1명을 알아두는 것이 광고비 100만원보다 효과적입니다. — Paul Graham", en: "Knowing one regular this week beats 1M won in ads. — Paul Graham" },
  { ko: "주간 회고는 자랑이 아니라 수정입니다. — Jeff Bezos", en: "Weekly retros are corrections, not victories. — Jeff Bezos" },
];

const MONTH: WisdomEntry[] = [
  { ko: "이번 달 핵심 한 가지가 다음 달 핵심으로 이어지는지 보세요. — Jeff Bezos", en: "Does this month's core action carry into next? — Jeff Bezos" },
  { ko: "매월 같은 실수를 반복하지 않으면, 사업은 계속 자랍니다. — Charlie Munger", en: "Stop repeating monthly mistakes; the business compounds. — Charlie Munger" },
  { ko: "월별 매출보다 월별 마진의 추세를 보세요. — Warren Buffett", en: "Watch margin trend, not just monthly revenue. — Warren Buffett" },
  { ko: "사람 > 제품 > 이익. 이번 달 우선순위가 맞나요? — Ben Horowitz", en: "People > Products > Profits. Right priority this month? — Ben Horowitz" },
  { ko: "Default Alive — 흑자가 아니어도 흑자로 가는 길이 보이는 상태. — Paul Graham", en: "Default alive — visible path to profitability. — Paul Graham" },
  { ko: "운영의 본질은 반복입니다. 한 달은 그 반복의 측정 단위입니다. — Andy Grove", en: "Ops is repetition; a month is the measurement unit. — Andy Grove" },
  { ko: "고객 인터뷰 5건이 매출 보고서 1년치보다 통찰을 줍니다. — Steve Blank", en: "5 customer interviews > 1 year of reports. — Steve Blank" },
  { ko: "Marines → Army → Police 3단으로 채용해 가세요. — Reid Hoffman", en: "Hire Marines, then Army, then Police. — Reid Hoffman" },
];

const QUARTER: WisdomEntry[] = [
  { ko: "역지사지로 거꾸로 생각하라. 패할 길을 먼저 지워라. — Charlie Munger", en: "Invert. Always invert. Avoid losing first. — Charlie Munger" },
  { ko: "Day 1을 잃지 않는 것이 모든 것이다. — Jeff Bezos", en: "It's always Day 1. — Jeff Bezos" },
  { ko: "장기적으로 욕심을 내라 (long-term greedy). — Warren Buffett", en: "Be long-term greedy. — Warren Buffett" },
  { ko: "경쟁하지 말고 독점하라. 작은 시장의 1등이 되라. — Peter Thiel", en: "Don't compete, monopolize. Be #1 of a small market. — Peter Thiel" },
  { ko: "Hire slowly. 분기마다 채용 패턴이 회사를 만든다. — Ben Horowitz", en: "Hire slowly. Quarterly patterns build the company. — Ben Horowitz" },
  { ko: "분기 회고는 「잘한 것」보다 「반복하지 말 것」 정리에 가치가 있다. — Charlie Munger", en: "Quarterly retro: 'don't repeat' beats 'celebrate'. — Charlie Munger" },
  { ko: "PMF 이전엔 가설 검증, 이후엔 시스템 구축. 분기는 그 전환점이다. — Sam Altman", en: "Pre-PMF: hypotheses. Post-PMF: systems. Quarter is the pivot. — Sam Altman" },
  { ko: "사장의 시간이 자산 배분 결정과 같다. 다음 분기 어디에 쏟나? — Warren Buffett", en: "Founder's time = capital allocation. Where next quarter? — Warren Buffett" },
];

const POOLS: Record<ReportPeriodKey, WisdomEntry[]> = {
  day: DAY,
  week: WEEK,
  month: MONTH,
  quarter: QUARTER,
};

/**
 * Stable selection — 같은 period+날짜 단위 동안 같은 인용을 유지.
 *   - day: 일자 단위 (어제와 오늘 다른 인용)
 *   - week: 주 단위
 *   - month: 월 단위
 *   - quarter: 분기 단위
 */
export function pickReportWisdom(period: ReportPeriodKey, ko: boolean, now: Date = new Date()): string {
  const pool = POOLS[period];
  let seed: number;
  if (period === "day") {
    seed = now.getFullYear() * 366 + Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  } else if (period === "week") {
    const start = new Date(now.getFullYear(), 0, 1);
    seed = now.getFullYear() * 53 + Math.floor((now.getTime() - start.getTime()) / (7 * 86400000));
  } else if (period === "month") {
    seed = now.getFullYear() * 12 + now.getMonth();
  } else {
    seed = now.getFullYear() * 4 + Math.floor(now.getMonth() / 3);
  }
  const idx = ((seed % pool.length) + pool.length) % pool.length;
  const entry = pool[idx];
  return ko ? entry.ko : entry.en;
}
