/**
 * 브라우저 알림 (Web Notifications API) 래퍼.
 *
 * 제약: 웹 앱은 service worker push 가 없으면 페이지가 열려있을 때만 알림 가능.
 *  - 사장님이 build.up 탭을 닫으면 알림 안 옴 (PWA 마이그레이션 시 service worker 로 백그라운드 푸시 가능)
 *  - 그래도 페이지 열려있는 동안에는 OS 시스템 알림으로 정상 노출
 *
 * 정책:
 *  - 권한 요청: 사장님이 토글 ON 할 때만 (자동 호출 금지 — 브라우저 정책 위반)
 *  - 중복 방지: localStorage 에 "lastFiredAt:<key>" 저장, 같은 종류는 하루 1회만
 *  - 사용자 클릭 시: 페이지를 포그라운드로 가져오기
 */

export type NotificationKind = "cashflow-crisis" | "morning-briefing";

const LS_KEY = "buildup-notification-history";

type NotificationHistory = Record<string, number>; // kind:dateKey → epoch ms

function loadHistory(): NotificationHistory {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") as NotificationHistory;
  } catch {
    return {};
  }
}

function saveHistory(h: NotificationHistory): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(h));
  } catch {
    // storage 가득 — 무시
  }
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * 알림 권한 상태.
 * - "default": 아직 요청 안 함
 * - "granted": 허용됨
 * - "denied": 거부됨 (브라우저 설정에서만 변경 가능)
 * - "unsupported": 브라우저가 Notifications API 미지원
 */
export type NotificationPermStatus = "default" | "granted" | "denied" | "unsupported";

export function getNotificationPermission(): NotificationPermStatus {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  return Notification.permission as NotificationPermStatus;
}

/**
 * 사용자 액션(토글 ON 등) 시점에만 호출. 브라우저는 자동 호출은 거부함.
 */
export async function requestNotificationPermission(): Promise<NotificationPermStatus> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermStatus;
  } catch {
    return "denied";
  }
}

/**
 * 오늘 이미 같은 종류 알림을 보냈는지 체크 + 보냈으면 false 리턴.
 *  - true: 보낼 수 있음
 *  - false: 오늘 이미 보냄 (중복 방지)
 */
export function canFireToday(kind: NotificationKind): boolean {
  const history = loadHistory();
  const key = `${kind}:${todayKey()}`;
  return !history[key];
}

/**
 * 알림 발송 (권한 + 중복 방지 체크 후).
 * 반환: true 면 실제 발송됨, false 면 권한 없음/중복/미지원으로 스킵.
 */
export function fireNotification(params: {
  kind: NotificationKind;
  title: string;
  body: string;
  /** 알림 고유 tag — 같은 tag 의 이전 알림은 OS 가 자동 교체 */
  tag?: string;
  /** 클릭 시 포커스할 URL (현재 탭 우선) */
  clickUrl?: string;
  /** 중복 방지 우회 — 강제 발송 (디버깅·테스트용) */
  force?: boolean;
}): boolean {
  if (typeof window === "undefined" || typeof Notification === "undefined") return false;
  if (Notification.permission !== "granted") return false;
  if (!params.force && !canFireToday(params.kind)) return false;

  try {
    const n = new Notification(params.title, {
      body: params.body,
      tag: params.tag ?? params.kind,
      icon: "/icon-192.png",  // PWA 아이콘이 있으면 사용 (없으면 브라우저 기본)
      badge: "/icon-72.png",
    });
    n.onclick = () => {
      window.focus();
      if (params.clickUrl) window.location.href = params.clickUrl;
      n.close();
    };
    // 이력 기록
    const history = loadHistory();
    history[`${params.kind}:${todayKey()}`] = Date.now();
    saveHistory(history);
    return true;
  } catch (err) {
    console.warn("[notifications] fire failed:", err);
    return false;
  }
}

/**
 * 디버그/테스트용 — 모든 이력 삭제 (다시 알림 받을 수 있음)
 */
export function clearNotificationHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_KEY);
}
