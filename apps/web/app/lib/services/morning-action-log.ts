/**
 * morning-action-log.ts — AI 모닝 히어로 "액션→결과 루프" 로컬 기록.
 *
 *  목적: 어제 AI가 제안한 최우선 액션 + 사장님 실행 여부를 기기에 저장 →
 *        다음 날 아침 프롬프트가 "어제 제안한 X 해보셨어요? 결과는…" 으로 후속.
 *        이게 "매일 보는 운세" 를 "진짜 오른팔" 로 만드는 핵심.
 *
 *  ⚠️ 민감하지 않은 1줄 메모라 localStorage 로컬 전용 (서버 미전송).
 *     사용자별 키로 분리. 날짜는 KST 영업일 기준.
 */
/** KST 날짜 YYYY-MM-DD (useDashboard 의 todayKst 와 동일 포맷). */
function todayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export type MorningActionStatus = "done" | "pending";

export type MorningActionLog = {
  /** KST 날짜 YYYY-MM-DD — 이 액션이 제안된 날 */
  date: string;
  /** 제안된 최우선 액션 제목 */
  title: string;
  /** 사장님 실행 여부 */
  status: MorningActionStatus;
};

const key = (userId: string) => `morning-action:${userId}`;

function read(userId: string): MorningActionLog | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = window.localStorage.getItem(key(userId));
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<MorningActionLog>;
    if (typeof v.date === "string" && typeof v.title === "string" && (v.status === "done" || v.status === "pending")) {
      return { date: v.date, title: v.title, status: v.status };
    }
  } catch { /* corrupt — ignore */ }
  return null;
}

function write(userId: string, log: MorningActionLog): void {
  if (typeof window === "undefined" || !userId) return;
  try { window.localStorage.setItem(key(userId), JSON.stringify(log)); } catch { /* quota — ignore */ }
}

/**
 * 오늘 제안된 최우선 액션을 기록 (status는 pending 으로 시작).
 *  같은 날 이미 기록돼 있으면 — 제목이 같으면 status(done) 보존, 다르면 갱신.
 */
export function recordTodayAction(userId: string, title: string): void {
  const t = title.trim();
  if (!t) return;
  const today = todayKst();
  const existing = read(userId);
  if (existing && existing.date === today && existing.title === t) {
    return; // 같은 날 같은 액션 — done 표시 보존
  }
  write(userId, { date: today, title: t, status: "pending" });
}

/** 사장님이 "했어요 ✓" 누름 — 오늘 기록을 done 으로. */
export function markActionDone(userId: string): void {
  const existing = read(userId);
  if (!existing) return;
  write(userId, { ...existing, status: "done" });
}

/** 현재 기록 (UI 버튼 상태 표시용). */
export function getActionLog(userId: string): MorningActionLog | null {
  return read(userId);
}

/**
 * 프롬프트로 보낼 "전일 제안" — 오늘보다 이전 날짜의 기록만 반환.
 *  (오늘 기록은 "현재" 제안이지 "전일" 이 아니므로 제외.)
 */
export function getPreviousActionForPrompt(
  userId: string,
): { title: string; status: "done" | "pending" | "unknown"; date: string } | null {
  const log = read(userId);
  if (!log) return null;
  if (log.date >= todayKst()) return null; // 오늘 것은 후속 대상 아님
  return { title: log.title, status: log.status, date: log.date };
}
