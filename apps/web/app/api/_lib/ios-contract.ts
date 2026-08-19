/**
 * iOS 응답 계약 정규화 헬퍼 (2026-08-19).
 *
 * 출시된 iOS 앱의 Decodable 모델이 기대하는 키·타입을 서버가 항상 만족하도록,
 * 라우트가 응답 직전에 거치는 *순수 함수* 모음. 원칙:
 *   - 키는 추가만(하위 호환), 기존 키 제거 금지
 *   - required string 은 절대 null/undefined 로 내려가지 않게 String(x ?? "")
 *   - 정수 필드는 Math.round(Number(x)) || 0
 * 순수 함수라 __tests__/ios-contract-shapes.test.ts 에서 단위 테스트한다.
 */

/** ok/http_status 진단 응답 → success(=ok) · http_status(number, 미상=0) · httpStatus(alias) 보강. */
export function withIosContract<T extends { ok: boolean; http_status?: number | null }>(
  payload: T,
): Omit<T, "http_status"> & { success: boolean; http_status: number; httpStatus: number } {
  const st =
    typeof payload.http_status === "number" && Number.isFinite(payload.http_status) ? payload.http_status : 0;
  return { ...payload, success: payload.ok, http_status: st, httpStatus: st };
}

/** 정수 정규화 — 숫자 문자열 허용, NaN/비유한/누락 → 0. */
export function toInt(v: unknown): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : 0;
}

/** null/undefined 를 "" 로, 나머지는 String(). */
export function toStr(v: unknown): string {
  return v == null ? "" : String(v);
}

export type BreakdownItem = { item: string; weight: number; itemScore: number; reason: string };

/** funding/score breakdown — item 문자열인 항목만, weight/itemScore 정수, reason 문자열 보장. */
export function normalizeBreakdown(raw: unknown, maxItems: number): BreakdownItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((b): b is Record<string, unknown> => !!b && typeof b === "object" && typeof (b as { item?: unknown }).item === "string")
    .slice(0, maxItems)
    .map((b) => ({
      item: String(b.item),
      weight: toInt(b.weight),
      itemScore: toInt(b.itemScore),
      reason: toStr(b.reason),
    }));
}

export type DailySummaryRow = { date: string; sales: number; customers: number; source: "csv" };

/** csv/list dailyEntries → iOS `dailySummary` (동일 shape, 숫자·문자열 보장). */
export function toDailySummary(
  entries: ReadonlyArray<{ date: unknown; sales?: unknown; customers?: unknown }>,
): DailySummaryRow[] {
  return entries.map((e) => ({
    date: toStr(e.date),
    sales: Number(e.sales) || 0,
    customers: Number(e.customers) || 0,
    source: "csv",
  }));
}

/** popbill/sync results → iOS `summary` [{docType, collected}]. */
export function toPopbillSummary(
  results: ReadonlyArray<{ kind: unknown; collected?: unknown }>,
): Array<{ docType: string; collected: number }> {
  return results.map((r) => ({ docType: toStr(r.kind), collected: toInt(r.collected) }));
}

/** 객체의 지정 키를 required string 으로 보장 (없으면 "" 로 추가). 나머지 키는 그대로. */
export function ensureStringKeys<T extends object, K extends string>(
  obj: T,
  keys: readonly K[],
): Omit<T, K> & Record<K, string> {
  const out = { ...obj } as Omit<T, K> & Record<K, string>;
  for (const k of keys) {
    (out as Record<string, unknown>)[k] = toStr((obj as Record<string, unknown>)[k]);
  }
  return out;
}

export const MEME_ITEM_REQUIRED_STRINGS = ["title", "originDesc", "originUrl", "sourceName", "applyHint"] as const;
export const INFLUENCER_REQUIRED_STRINGS = ["name", "handle", "platform", "regionKo", "profileUrl"] as const;
export const INFLUENCER_PLAY_REQUIRED_STRINGS = ["id", "titleKo", "targetKo", "practiceKo", "collabType", "dmTemplateKo"] as const;
