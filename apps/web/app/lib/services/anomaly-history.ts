import { getKstDate } from "../utils/business-day";
/**
 * anomaly-history.ts
 *
 * 룰 기반 이상 감지 결과의 시간 추적.
 * "어제부터 신호" / "새로 발생" / "N일째 지속" 같은 맥락을 사장님에게 제공.
 *
 * localStorage 영구 저장. 30일 지난 기록은 자동 정리.
 */

const STORAGE_KEY = "foundone-anomaly-history-v1";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30일

export type AnomalyHistoryEntry = {
  /** anomaly kind (예: "profit-margin-drop") */
  kind: string;
  /** 최초 감지 시점 (ISO 날짜) */
  firstDetectedAt: string;
  /** 마지막 감지 시점 (ISO 날짜) — 매일 갱신 */
  lastSeenAt: string;
  /** 연속 감지 일수 */
  consecutiveDays: number;
};

type HistoryStore = {
  entries: Record<string, AnomalyHistoryEntry>;  // key = kind
  lastUpdate: string;
};

function loadStore(): HistoryStore {
  if (typeof window === "undefined") return { entries: {}, lastUpdate: "" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: {}, lastUpdate: "" };
    const parsed = JSON.parse(raw) as HistoryStore;
    // 30일+ 오래된 entry 정리
    const now = Date.now();
    Object.keys(parsed.entries).forEach((k) => {
      const entry = parsed.entries[k];
      if (now - new Date(entry.lastSeenAt).getTime() > MAX_AGE_MS) {
        delete parsed.entries[k];
      }
    });
    return parsed;
  } catch {
    return { entries: {}, lastUpdate: "" };
  }
}

function saveStore(store: HistoryStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch { /* quota exceeded — silent */ }
}

/**
 * 현재 감지된 anomaly 목록을 처리하여 history 갱신.
 * 반환: 각 kind별 history 정보 (최초 감지일, 연속 감지 일수).
 *
 * 규칙:
 *   - 오늘 감지된 kind: lastSeenAt = today
 *     · 어제 lastSeenAt = 어제 → consecutiveDays += 1
 *     · 어제 안 봄 → consecutiveDays = 1, firstDetectedAt = today (재발생)
 *   - 오늘 감지 안 된 기존 kind: 그대로 두되 lastSeenAt 변하지 않음 (재발 시점에 reset)
 */
export function updateAnomalyHistory(currentKinds: string[]): Record<string, AnomalyHistoryEntry> {
  if (typeof window === "undefined") return {};
  const store = loadStore();
  const today = getKstDate(new Date());
  const yesterday = getKstDate(new Date(Date.now() - 86400000));

  // 같은 날 중복 갱신 방지 (성능)
  if (store.lastUpdate === today && currentKinds.every((k) => store.entries[k]?.lastSeenAt === today)) {
    return store.entries;
  }

  currentKinds.forEach((kind) => {
    const existing = store.entries[kind];
    if (!existing) {
      // 신규 발생
      store.entries[kind] = {
        kind,
        firstDetectedAt: today,
        lastSeenAt: today,
        consecutiveDays: 1,
      };
    } else if (existing.lastSeenAt === today) {
      // 오늘 이미 갱신됨 — skip
    } else if (existing.lastSeenAt === yesterday) {
      // 어제부터 연속
      store.entries[kind] = {
        ...existing,
        lastSeenAt: today,
        consecutiveDays: existing.consecutiveDays + 1,
      };
    } else {
      // 재발 (며칠 끊겼다가 다시) — firstDetectedAt 리셋
      store.entries[kind] = {
        kind,
        firstDetectedAt: today,
        lastSeenAt: today,
        consecutiveDays: 1,
      };
    }
  });

  store.lastUpdate = today;
  saveStore(store);
  return store.entries;
}

/** 특정 kind 의 history 조회 (UI 라벨용) */
export function getAnomalyContext(kind: string): {
  isNew: boolean;
  consecutiveDays: number;
  daysSinceFirst: number;
  label: string;  // "오늘 새로 발생" | "어제부터 2일째" | "5일째 지속"
} | null {
  if (typeof window === "undefined") return null;
  const store = loadStore();
  const entry = store.entries[kind];
  if (!entry) return null;
  const today = getKstDate(new Date());
  if (entry.lastSeenAt !== today) return null;  // 오늘 감지된 것만

  const daysSinceFirst = Math.round(
    (new Date(today).getTime() - new Date(entry.firstDetectedAt).getTime()) / 86400000
  );
  const isNew = entry.consecutiveDays === 1;
  let label = "";
  if (isNew) {
    label = "오늘 새로 발생";
  } else if (entry.consecutiveDays === 2) {
    label = "어제부터 2일째";
  } else if (entry.consecutiveDays <= 7) {
    label = `${entry.consecutiveDays}일째 지속`;
  } else {
    label = `${entry.consecutiveDays}일째 지속 — 만성화`;
  }
  return { isNew, consecutiveDays: entry.consecutiveDays, daysSinceFirst, label };
}
