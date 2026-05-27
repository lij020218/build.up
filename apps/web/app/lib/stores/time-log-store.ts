import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getKstDate } from "../utils/business-day";

/**
 * Time Log Store — Drucker "시간이 어디로 가는지 알라" 적용.
 *
 * 매일 저녁 5분 체크인 (3 카테고리 슬라이더 + 선택 메모):
 * - customer (고객 응대)
 * - operations (운영·관리·회계)
 * - marketing (마케팅·성장)
 * - other는 100에서 나머지로 자동 계산
 *
 * 목적:
 * - 자영업자가 "어디에 시간을 쓰는지" 인식
 * - 7일 누적 → 주간 성찰
 * - Hook Model Investment 단계 (입력할수록 서비스가 가치 있어짐)
 */

export type TimeLogCategory = "customer" | "operations" | "marketing";

export type TimeLogEntry = {
  date: string;                 // ISO "2026-04-18"
  customerPct: number;           // 0-100
  operationsPct: number;         // 0-100
  marketingPct: number;          // 0-100
  // otherPct는 max(0, 100 - 위 3개)로 파생
  note?: string;                  // 자유 메모 (선택)
  createdAt: string;              // ISO timestamp
};

type TimeLogState = {
  entries: TimeLogEntry[];                     // 최대 90일 유지
  lastPromptDismissedAt: string | null;        // 오늘 프롬프트 닫았으면 저장
  enabled: boolean;                             // 사용자가 기능 끌 수 있음
};

type TimeLogActions = {
  addEntry: (entry: TimeLogEntry) => void;
  removeEntry: (date: string) => void;
  /** Supabase 동기화에서 통째로 복원 시 사용 */
  setEntries: (v: TimeLogEntry[]) => void;
  dismissTodayPrompt: () => void;
  setEnabled: (v: boolean) => void;
  resetAll: () => void;
};

const initialState: TimeLogState = {
  entries: [],
  lastPromptDismissedAt: null,
  enabled: true,
};

export const useTimeLogStore = create<TimeLogState & TimeLogActions>()(
  persist(
    (set) => ({
      ...initialState,
      addEntry: (entry) =>
        set((s) => {
          // 같은 날짜 있으면 덮어쓰기
          const filtered = s.entries.filter((e) => e.date !== entry.date);
          // 90일 이전 데이터 제거
          const cutoff = getKstDate(new Date(Date.now() - 90 * 86400000));
          const kept = filtered.filter((e) => e.date >= cutoff);
          return { entries: [entry, ...kept] };
        }),
      removeEntry: (date) =>
        set((s) => ({ entries: s.entries.filter((e) => e.date !== date) })),
      setEntries: (v) => set({ entries: v }),
      dismissTodayPrompt: () =>
        set({ lastPromptDismissedAt: new Date().toISOString() }),
      setEnabled: (v) => set({ enabled: v }),
      resetAll: () => set(initialState),
    }),
    {
      name: "buildup-time-log",
      partialize: (state) => ({
        entries: state.entries,
        lastPromptDismissedAt: state.lastPromptDismissedAt,
        enabled: state.enabled,
      }),
    }
  )
);

// ─── Utility selectors ───

/** 오늘 이미 입력했는지 */
export function hasTodayEntry(entries: TimeLogEntry[], today: string = getKstDate(new Date())): boolean {
  return entries.some((e) => e.date === today);
}

/** 오늘 프롬프트 표시 여부 — 저녁 시간대(18시 이후) + 오늘 입력 X + 오늘 닫지 않음 */
export function shouldPromptToday(
  entries: TimeLogEntry[],
  lastDismissedAt: string | null,
  enabled: boolean,
  now: Date = new Date()
): boolean {
  if (!enabled) return false;
  const hour = now.getHours();
  if (hour < 17) return false; // 저녁 5시부터
  const today = getKstDate(now);
  if (hasTodayEntry(entries, today)) return false;
  if (lastDismissedAt) {
    const dismissedDate = lastDismissedAt.slice(0, 10);
    if (dismissedDate === today) return false;
  }
  return true;
}

/** 최근 7일 평균 (비율) */
export function weeklyAverage(entries: TimeLogEntry[], now: Date = new Date()): {
  days: number;
  customerAvg: number;
  operationsAvg: number;
  marketingAvg: number;
  otherAvg: number;
} | null {
  const cutoff = getKstDate(new Date(now.getTime() - 7 * 86400000));
  const recent = entries.filter((e) => e.date >= cutoff);
  if (recent.length === 0) return null;
  const sum = recent.reduce(
    (acc, e) => ({
      customer: acc.customer + e.customerPct,
      operations: acc.operations + e.operationsPct,
      marketing: acc.marketing + e.marketingPct,
    }),
    { customer: 0, operations: 0, marketing: 0 }
  );
  const n = recent.length;
  const customerAvg = Math.round(sum.customer / n);
  const operationsAvg = Math.round(sum.operations / n);
  const marketingAvg = Math.round(sum.marketing / n);
  const otherAvg = Math.max(0, 100 - customerAvg - operationsAvg - marketingAvg);
  return { days: n, customerAvg, operationsAvg, marketingAvg, otherAvg };
}

/** 연속 기록 일수 (streak) — 오늘 포함 */
export function recordStreak(entries: TimeLogEntry[], now: Date = new Date()): number {
  if (entries.length === 0) return 0;
  const dates = new Set(entries.map((e) => e.date));
  let streak = 0;
  const cursor = new Date(now);
  for (;;) {
    const dateStr = getKstDate(cursor);
    if (dates.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0 && dateStr === getKstDate(now)) {
      // 오늘 안 했어도 어제부터 세줌
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
    if (streak > 90) break;
  }
  return streak;
}
