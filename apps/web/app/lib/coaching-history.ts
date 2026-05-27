/**
 * 코칭 히스토리 SSOT — 사장님 lock-in moat.
 *
 *  ── 왜 만들었나 (2026-05-12) ──────────────────────────────────────────
 *  자체 평가 결과: "AI 데일리 브리프" 컨셉 자체는 글로벌 commodity (Toast IQ·
 *  Amplitude·Ramp 가 이미 동급). 진짜 moat 는 *데이터 누적* 과 *코칭 히스토리*.
 *
 *  사장님이 떠나면 1년치 코칭 일지·신호 패턴·대응 결과를 잃음 → 전환비용 발생.
 *  캐시노트가 같은 기능 출시해도 누적된 history 는 못 따라옴.
 *
 *  ── 데이터 모델 ──────────────────────────────────────────────────
 *  매일 FounderBrief 가 노출될 때 hero signal 자동 기록.
 *  사장님이 "했음/안했음/메모" 로 대응 입력 → 결과 연동 (다음 주 매출 변화).
 *
 *  ── 저장 방식 (v2, 2026-05-12 추가) ───────────────────────────────────
 *  · localStorage (즉시 응답 / 오프라인) — primary
 *  · Supabase `coaching_history` 테이블 + RLS — mirror (다중 디바이스 / 영구)
 *    recordSignal·markActionTaken 호출 시 background fetch 로 sync.
 *    fetch 실패해도 localStorage 는 그대로 (graceful) — 다음 호출에 재시도.
 *  · hydrate() 호출 시 Supabase → localStorage 로 가져옴 (다른 디바이스 데이터 받기)
 *
 *  ── 윈도우 ──────────────────────────────────────────────────────
 *  localStorage 30일 / Supabase 90일 (서버 보관 더 김).
 *  ────────────────────────────────────────────────────────────────
 */

import { supabase } from "../../lib/supabase";
import { getKstDate } from "./utils/business-day";

export type CoachingSignalKind = "critical" | "important" | "notable" | "good";

export type CoachingEntry = {
  /** YYYY-MM-DD */
  date: string;
  /** 어느 브리프에서 발생 */
  brief: "offline" | "startup";
  /** 그 날 노출된 hero 신호 */
  signal: {
    kind: CoachingSignalKind;
    headline: string;
    action: string;
  };
  /** 사장님 대응 (사장님이 직접 입력) */
  response?: {
    taken: boolean;
    note?: string;
    /** ISO 8601 */
    takenAt?: string;
  };
};

const STORAGE_KEY = "buildup_coaching_history_v1";
const WINDOW_DAYS = 30;

function todayKey(): string {
  return getKstDate(new Date());
}

function daysAgo(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
}

function readRaw(): CoachingEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e): e is CoachingEntry => {
      return (
        typeof e === "object" && e != null &&
        typeof e.date === "string" &&
        typeof e.brief === "string" &&
        typeof e.signal === "object" && e.signal != null &&
        typeof e.signal.headline === "string"
      );
    });
  } catch {
    return [];
  }
}

function writeRaw(entries: CoachingEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // quota exceeded or disabled — 무시 (UX 차단 X)
  }
}

/** 30일 이상 된 entry 정리 */
export function pruneOld(): void {
  const entries = readRaw().filter((e) => daysAgo(e.date) <= WINDOW_DAYS);
  writeRaw(entries);
}

/** 최근 N일 entry 가져오기 (기본 14일) */
export function getHistory(days: number = 14): CoachingEntry[] {
  return readRaw()
    .filter((e) => daysAgo(e.date) <= days)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // 최신 먼저
}

/**
 * 오늘의 신호 기록 (동일 날짜·브리프 중복 시 덮어쓰기 — 하루 한 번만).
 * 신호가 바뀌었어도 그 날의 *마지막* 신호만 저장 (대시보드 리로드 안전).
 */
export function recordSignal(
  brief: "offline" | "startup",
  signal: CoachingEntry["signal"],
): void {
  const date = todayKey();
  const entries = readRaw();
  const idx = entries.findIndex((e) => e.date === date && e.brief === brief);
  const next: CoachingEntry = {
    date,
    brief,
    signal,
    // 기존 response 가 있으면 보존 (사장님 입력 보호)
    response: idx >= 0 ? entries[idx].response : undefined,
  };
  if (idx >= 0) {
    entries[idx] = next;
  } else {
    entries.push(next);
  }
  // 30일 prune 동시 수행
  const pruned = entries.filter((e) => daysAgo(e.date) <= WINDOW_DAYS);
  writeRaw(pruned);
  // Supabase mirror — fire and forget
  void mirrorEntry(next);
}

/** 사장님이 "오늘 액션 했음" 마크 */
export function markActionTaken(
  date: string,
  brief: "offline" | "startup",
  taken: boolean,
  note?: string,
): void {
  const entries = readRaw();
  const idx = entries.findIndex((e) => e.date === date && e.brief === brief);
  if (idx < 0) return;
  entries[idx] = {
    ...entries[idx],
    response: {
      taken,
      note,
      takenAt: taken ? new Date().toISOString() : undefined,
    },
  };
  writeRaw(entries);
  void mirrorEntry(entries[idx]);
}

// ─── Supabase mirror (v2) ───────────────────────────────────────────
//
//  fire-and-forget. fetch 실패하면 localStorage 는 그대로 (graceful).
//  로그인 안 되어 있으면 silent skip (anonymous 도 거부 — RLS 에서 차단됨).

async function getAuthToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/** 신호 1개를 Supabase 에 mirror. 실패해도 throw 안 함 (background) */
async function mirrorEntry(entry: CoachingEntry): Promise<void> {
  const token = await getAuthToken();
  if (!token) return; // 미로그인 시 skip
  try {
    await fetch("/api/coaching-history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        date: entry.date,
        brief: entry.brief,
        signal: entry.signal,
        response: entry.response
          ? {
              taken: entry.response.taken,
              note: entry.response.note ?? null,
              takenAt: entry.response.takenAt ?? null,
            }
          : undefined,
      }),
    });
  } catch {
    // network/server 오류 — localStorage 가 source of truth 이므로 무시
  }
}

/**
 * Supabase 에서 최근 90일 entry 를 가져와 localStorage 와 머지.
 * 다른 디바이스에서 기록한 entry 를 받아옴. response (사장님 입력) 우선 보존.
 * 로그인 후 1번 호출 권장 (앱 마운트 시).
 */
export async function hydrateFromSupabase(): Promise<{
  stats14d: null | {
    total_days: number;
    actions_taken: number;
    critical_signals: number;
    taken_rate_pct: number;
  };
  meta30d: null | {
    days_30: number;
    critical_taken_rate: number | null;
    weekend_days: number;
    weekend_actions: number;
    most_common_kind: string | null;
    recent_critical_7d: number;
  };
}> {
  const empty = { stats14d: null, meta30d: null };
  const token = await getAuthToken();
  if (!token) return empty;
  try {
    const res = await fetch("/api/coaching-history?days=90", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return empty;
    const data = await res.json();
    if (!data?.ok) return empty;

    const remote: CoachingEntry[] = Array.isArray(data.entries) ? data.entries : [];
    const local = readRaw();
    const byKey = new Map<string, CoachingEntry>();

    // local 먼저 (사장님이 방금 입력한 response 보호)
    for (const e of local) {
      byKey.set(`${e.date}|${e.brief}`, e);
    }
    // remote 추가 — local 에 같은 key 있으면 response 는 더 최신(takenAt) 우선
    for (const e of remote) {
      const key = `${e.date}|${e.brief}`;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, e);
      } else {
        // signal 은 remote 우선 (서버가 다른 디바이스 최신 보유 가능)
        // response 는 takenAt 더 최근인 쪽
        const remoteTakenAt = e.response?.takenAt ?? "";
        const localTakenAt = existing.response?.takenAt ?? "";
        const responseWinner = remoteTakenAt > localTakenAt ? e.response : existing.response;
        byKey.set(key, {
          date: e.date,
          brief: e.brief,
          signal: e.signal,
          response: responseWinner,
        });
      }
    }

    const merged = Array.from(byKey.values()).filter((e) => daysAgo(e.date) <= WINDOW_DAYS);
    writeRaw(merged);
    return {
      stats14d: data.stats14d ?? null,
      meta30d: data.meta30d ?? null,
    };
  } catch {
    return empty;
  }
}

/** 히스토리 통계 — 카드 헤더에서 사용 */
export function getStats(days: number = 14): {
  totalDays: number;
  actionsTaken: number;
  criticalSignals: number;
  takenRate: number; // 0-100
} {
  const entries = getHistory(days);
  const totalDays = entries.length;
  const actionsTaken = entries.filter((e) => e.response?.taken === true).length;
  const criticalSignals = entries.filter((e) => e.signal.kind === "critical").length;
  const takenRate = totalDays > 0 ? Math.round((actionsTaken / totalDays) * 100) : 0;
  return { totalDays, actionsTaken, criticalSignals, takenRate };
}
