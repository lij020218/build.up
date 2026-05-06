/**
 * 외부 API raw 응답 → NormalizedXxx 변환 헬퍼.
 *
 * 어댑터 구현 코드가 모두 raw 응답을 손수 변환하지 않도록 공용화.
 * 단순 규칙만 — 비즈니스 로직(카테고리 분류 등) 은 별도.
 */

import type {
  NormalizedBankTransaction,
  BankTransactionCategory,
} from "./types";

// ─────────────────────────────────────────────────────────────────
//  은행 거래내역
// ─────────────────────────────────────────────────────────────────

/**
 * CODEF resAccountTrDate (YYYYMMDD) + resAccountTrTime (HHMMSS) → ISO (KST 기준).
 */
export function combineCodefDateTime(
  date: string,
  time?: string,
  tz: string = "+09:00"
): string {
  const d = (date ?? "").replace(/[^0-9]/g, "").padEnd(8, "0").slice(0, 8);
  const t = (time ?? "000000").replace(/[^0-9]/g, "").padEnd(6, "0").slice(0, 6);
  const yyyy = d.slice(0, 4);
  const mm = d.slice(4, 6);
  const dd = d.slice(6, 8);
  const hh = t.slice(0, 2);
  const mi = t.slice(2, 4);
  const ss = t.slice(4, 6);
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${tz}`;
}

/**
 * desc1~4 → trim & 합치기.
 */
export function joinBankDescription(parts: Array<string | undefined | null>): string {
  return parts
    .map((p) => (p ?? "").trim())
    .filter((p) => p.length > 0)
    .join(" / ");
}

/**
 * 합성 fingerprint (DB unique 제약과 동일한 키).
 */
export function bankTxFingerprint(input: {
  accountId: string;
  transactionAt: string;
  amountIn: number;
  amountOut: number;
  balanceAfter: number | null;
}): string {
  return [
    input.accountId,
    input.transactionAt,
    input.amountIn,
    input.amountOut,
    input.balanceAfter ?? "",
  ].join("|");
}

/**
 * 거래설명 → 카테고리 자동 분류 (간단한 keyword rule — 추후 ML 가능).
 *
 * 정확도는 80% 정도 목표. 정확한 분류는 사장님 수동 보정.
 */
export function classifyBankTransaction(input: {
  description: string;
  amountIn: number;
  amountOut: number;
}): BankTransactionCategory {
  const d = input.description.toLowerCase();

  // 카드사 정산 입금 (가장 빈도 높음)
  const CARD_KEYWORDS = ["카드", "신한", "삼성", "현대", "비씨", "롯데", "kb국민", "nh", "하나", "우리", "씨티", "bc"];
  if (input.amountIn > 0 && CARD_KEYWORDS.some((k) => d.includes(k))) {
    return "card_settlement";
  }

  // 임대료
  if (input.amountOut > 0 && /(임대료|월세|rent)/i.test(d)) return "rent";

  // 공과금
  if (input.amountOut > 0 && /(전기|가스|수도|kt|skt|lg유플)/i.test(d)) return "utility";

  // 인건비
  if (input.amountOut > 0 && /(급여|임금|일당|아르바이트|알바)/i.test(d)) return "salary";

  // 세금
  if (input.amountOut > 0 && /(부가세|소득세|법인세|세무서|국세청|지방세)/i.test(d)) return "tax";

  // 대출
  if (/(대출|상환|이자)/i.test(d)) return "loan";

  // 매입 (식자재·도매 키워드)
  if (input.amountOut > 0 && /(식자재|도매|cj|롯데마트|이마트|아워홈|쌀|음료)/i.test(d)) {
    return "purchase";
  }

  // 현금영수증/매출 입금 (애매하면 transfer_in)
  if (input.amountIn > 0) return "transfer_in";
  if (input.amountOut > 0) return "transfer_out";
  return "other";
}

/**
 * CODEF resTrHistoryList 단건 → NormalizedBankTransaction.
 */
export function normalizeCodefBankTx(input: {
  accountId: string;
  raw: {
    resAccountTrDate?: string;
    resAccountTrTime?: string;
    resAccountIn?: string | number;
    resAccountOut?: string | number;
    resAfterTranBalance?: string | number;
    resAccountDesc1?: string;
    resAccountDesc2?: string;
    resAccountDesc3?: string;
    resAccountDesc4?: string;
    [k: string]: unknown;
  };
}): NormalizedBankTransaction {
  const r = input.raw;
  const transactionAt = combineCodefDateTime(r.resAccountTrDate ?? "", r.resAccountTrTime);
  const amountIn = numberish(r.resAccountIn);
  const amountOut = numberish(r.resAccountOut);
  const balanceAfter = r.resAfterTranBalance == null ? null : numberish(r.resAfterTranBalance);
  const description = joinBankDescription([
    r.resAccountDesc1,
    r.resAccountDesc2,
    r.resAccountDesc3,
    r.resAccountDesc4,
  ]);
  const category = classifyBankTransaction({ description, amountIn, amountOut });
  return {
    fingerprint: bankTxFingerprint({
      accountId: input.accountId,
      transactionAt,
      amountIn,
      amountOut,
      balanceAfter,
    }),
    accountId: input.accountId,
    transactionAt,
    amountIn,
    amountOut,
    balanceAfter,
    description,
    counterparty: extractCounterparty(description),
    category,
    raw: r,
  };
}

// ─────────────────────────────────────────────────────────────────
//  유틸
// ─────────────────────────────────────────────────────────────────

function numberish(v: unknown): number {
  if (typeof v === "number") return Math.round(v);
  if (typeof v === "string") {
    const cleaned = v.replace(/[^0-9.\-]/g, "");
    if (!cleaned) return 0;
    const n = Number(cleaned);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }
  return 0;
}

function extractCounterparty(description: string): string | null {
  if (!description) return null;
  // CODEF 거래설명 예: "신한카드 / 신한카드(주)" → "신한카드"
  const first = description.split(/[\/,]/)[0]?.trim();
  return first && first.length > 1 ? first : null;
}
