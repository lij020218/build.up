import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * usage-store.ts — Adaptive Interface 의 첫 단계.
 *
 * 사장님이 어떤 카드/탭을 자주 보는지 추적해서 향후 자동 정렬·강조에 활용.
 *
 * 현재 단계 (MVP):
 *   - 카드별 viewCount + lastViewedAt 기록
 *   - DeepDive 펼침 횟수 별도 카운트
 *   - 탭 방문 횟수
 *
 * 다음 단계 (별도 작업):
 *   - 자주 보는 DeepDive 카드 자동 unfold
 *   - 자주 안 보는 카드 시각 강도 ↓
 *   - 첫 진입 시 "어제 가장 많이 본 카드는 X 였어요" 같은 인사이트
 *
 * 익명 통계 — 외부 전송 없음. localStorage 단일.
 */

export type UsageEvent = {
  /** "morning-briefing" · "cashflow-hero" · "what-if" · "guides-tab" 등 */
  key: string;
  viewCount: number;
  lastViewedAt: string;       // ISO 날짜
  expandedCount?: number;     // DeepDive 같은 접힘 카드 펼침 횟수
};

type UsageState = {
  events: Record<string, UsageEvent>;
  totalSessions: number;
  firstUsedAt: string | null;
};

type UsageActions = {
  /** 카드/탭 view 카운트 증가 (자동: useEffect로 mount 시 호출) */
  trackView: (key: string) => void;
  /** DeepDive 같은 접힘 카드 펼침 카운트 */
  trackExpand: (key: string) => void;
  /** 세션 시작 (대시보드 첫 로드) */
  startSession: () => void;
  /** 가장 자주 본 N개 키 */
  getTopKeys: (n: number) => string[];
  /** 특정 키의 인기도 (0-1, 다른 키들 대비) */
  getPopularity: (key: string) => number;
  resetAll: () => void;
};

const initialState: UsageState = {
  events: {},
  totalSessions: 0,
  firstUsedAt: null,
};

export const useUsageStore = create<UsageState & UsageActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      trackView: (key) => {
        const now = new Date().toISOString();
        const today = now.slice(0, 10);
        set((s) => {
          const prev = s.events[key];
          // 같은 날 중복 카운트 방지 (성능 + 정확도)
          if (prev && prev.lastViewedAt.slice(0, 10) === today) return s;
          return {
            events: {
              ...s.events,
              [key]: {
                key,
                viewCount: (prev?.viewCount ?? 0) + 1,
                lastViewedAt: now,
                expandedCount: prev?.expandedCount,
              },
            },
            firstUsedAt: s.firstUsedAt ?? now,
          };
        });
      },
      trackExpand: (key) => {
        set((s) => {
          const prev = s.events[key];
          return {
            events: {
              ...s.events,
              [key]: {
                ...(prev ?? { key, viewCount: 0, lastViewedAt: new Date().toISOString() }),
                expandedCount: (prev?.expandedCount ?? 0) + 1,
              },
            },
          };
        });
      },
      startSession: () => {
        set((s) => ({
          totalSessions: s.totalSessions + 1,
          firstUsedAt: s.firstUsedAt ?? new Date().toISOString(),
        }));
      },
      getTopKeys: (n) => {
        const entries = Object.values(get().events);
        return entries
          .sort((a, b) => (b.viewCount + (b.expandedCount ?? 0) * 2) - (a.viewCount + (a.expandedCount ?? 0) * 2))
          .slice(0, n)
          .map((e) => e.key);
      },
      getPopularity: (key) => {
        const events = get().events;
        const target = events[key];
        if (!target) return 0;
        const totalViews = Object.values(events).reduce((s, e) => s + e.viewCount, 0);
        if (totalViews === 0) return 0;
        return target.viewCount / totalViews;
      },
      resetAll: () => set(initialState),
    }),
    {
      name: "foundone-usage-stats-v1",
      skipHydration: true,
      version: 1,
    }
  )
);
