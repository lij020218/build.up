/**
 * 행동 루프 헬퍼 (2026-08-01) — 코칭 일지(coaching_history)의 실행/무시 패턴을
 * 브리핑 프롬프트 블록으로. Duolingo Birdbrain 원리의 우리 규모 번역:
 * "매 상호작용이 다음 코칭을 조정한다" — 실행한 유형은 심화, 무시된 유형은 반복 금지.
 *
 *  ⚠️ 정직성: 앱이 아는 건 "했음 체크 여부"뿐 — 실제로 효과가 있었는지는 모른다.
 *    블록 문구도 "실행/무시"까지만 말하고 효과 판단은 싣지 않는다.
 *  테이블 미존재·조회 실패는 graceful — 빈 문자열 (코칭 자체는 정상 동작, coaching-feedback 관례).
 */

import { getSupabaseAdmin } from "./supabase-admin";

type HistoryRow = {
  signal_headline: string;
  signal_kind: string;
  response_taken: boolean | null;
};

/** 최근 14일 일지 → 프롬프트 블록. 데이터 3건 미만이면 빈 문자열 (패턴이라 부르기엔 부족). */
export async function fetchBehaviorBlock(userId: string): Promise<string> {
  const supa = getSupabaseAdmin();
  if (!supa) return "";
  try {
    const since = new Date(Date.now() - 14 * 86400_000).toISOString().slice(0, 10);
    const { data, error } = await supa
      .from("coaching_history")
      .select("signal_headline, signal_kind, response_taken")
      .eq("user_id", userId)
      .gte("date", since)
      .order("date", { ascending: false })
      .limit(20);
    if (error || !data) return "";
    return formatBehaviorBlock(data as HistoryRow[]);
  } catch {
    return "";
  }
}

/** 순수 포매터 — 테스트 대상. rows 는 최신순. */
export function formatBehaviorBlock(rows: HistoryRow[]): string {
  // 응답이 있는 행만 패턴 신호 (null = 미응답 — 무시로 단정하지 않는다)
  const answered = rows.filter((r) => r.response_taken !== null);
  if (answered.length < 3) return "";

  const taken = answered.filter((r) => r.response_taken === true).slice(0, 3);
  const ignored = answered.filter((r) => r.response_taken === false).slice(0, 3);
  const takenRate = Math.round((answered.filter((r) => r.response_taken === true).length / answered.length) * 100);

  const lines: string[] = [
    "",
    "## 사장님 행동 패턴 (최근 14일 코칭 일지 — 행동 루프 규칙 적용)",
    `- 응답한 코칭 ${answered.length}건 중 실행 ${takenRate}%`,
  ];
  if (taken.length) {
    lines.push(`- 실행한 조언 (이 방향을 심화): ${taken.map((r) => `"${r.signal_headline.slice(0, 40)}"`).join(" / ")}`);
  }
  if (ignored.length) {
    lines.push(`- 안 한 조언 (같은 형태로 반복 금지 — 접근을 바꾸거나 제외): ${ignored.map((r) => `"${r.signal_headline.slice(0, 40)}"`).join(" / ")}`);
  }
  return lines.join("\n") + "\n";
}
