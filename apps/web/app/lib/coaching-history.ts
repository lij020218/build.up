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
 *  매일 FounderBrief 가 노출될 때 hero signal 자동 기록 (localStorage v1).
 *  사장님이 "했음/안했음/메모" 로 대응 입력 → 결과 연동 (다음 주 매출 변화).
 *
 *  ── 저장 방식 ──────────────────────────────────────────────────
 *  v1: localStorage (Supabase 의존성 0, 단일 디바이스)
 *  v2: Supabase `coaching_history` 테이블 + RLS (다중 디바이스, 영구 보관)
 *
 *  ── 윈도우 ──────────────────────────────────────────────────────
 *  30일 윈도우. 그 이전 entry 는 prune (localStorage 용량 절약).
 *  ────────────────────────────────────────────────────────────────
 */

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
  return new Date().toISOString().slice(0, 10);
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
