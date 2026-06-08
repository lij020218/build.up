/**
 * 피드백 기능 영역(area) 레지스트리 — SSOT.
 *   보내기(FeedbackCard)·서버(POST /api/feedback)·관리자(필터/배지)가 공유.
 *   "use client" 없음 — 클라이언트/서버 양쪽 import. iOS 는 FeedbackArea.swift 로 동일 키 미러.
 *
 *   영역은 screen 경로에서 자동 판별하되 사장님이 수정 가능(progressive).
 *   세무·자금·인건비·입지는 로드맵 단계 내부라 자동값이 roadmap 으로 잡힐 수 있어 수정 UI 가 중요.
 */

export const FEEDBACK_AREAS = [
  { key: "roadmap", label: "로드맵·창업단계" },
  { key: "dashboard", label: "운영 대시보드" },
  { key: "revenue", label: "매출·매출연동" },
  { key: "franchise", label: "프랜차이즈 정보" },
  { key: "location", label: "입지·상권" },
  { key: "tax", label: "세무·간이과세" },
  { key: "funding", label: "자금·4대보험" },
  { key: "hiring", label: "인건비·고용" },
  { key: "account_billing", label: "계정·결제·설정" },
  { key: "other", label: "기타·앱 전반" },
] as const;

export type FeedbackAreaKey = (typeof FEEDBACK_AREAS)[number]["key"];

export const FEEDBACK_AREA_KEYS: FeedbackAreaKey[] = FEEDBACK_AREAS.map((a) => a.key);

export function isFeedbackArea(v: unknown): v is FeedbackAreaKey {
  return typeof v === "string" && (FEEDBACK_AREA_KEYS as string[]).includes(v);
}

export function areaLabel(key: string | null | undefined): string {
  const found = FEEDBACK_AREAS.find((a) => a.key === key);
  return found ? found.label : "기타·앱 전반";
}

/**
 * 화면 식별자(웹 pathname 또는 iOS screen 키)를 영역으로 매핑.
 *   매칭 안 되면 "other". 로드맵 내부 세부영역(세무/자금/인건비/입지)은 여기서 roadmap 으로 잡히고
 *   사용자가 보내기 화면에서 수정.
 */
export function screenToArea(screen: string | null | undefined): FeedbackAreaKey {
  if (!screen) return "other";
  const s = screen.toLowerCase();

  // 명시 키워드 우선 (iOS screen 키 + 웹 경로 공통)
  if (s.includes("roadmap")) return "roadmap";
  if (s.includes("franchise")) return "franchise";
  if (s.includes("location") || s.includes("district") || s.includes("입지") || s.includes("상권")) return "location";
  if (s.includes("revenue") || s.includes("sales") || s.includes("매출")) return "revenue";
  if (s.includes("billing") || s.includes("subscription") || s.includes("payment") || s.includes("pricing")) return "account_billing";
  if (s.includes("profile") || s.includes("auth") || s.includes("login") || s.includes("setting") || s.includes("account")) return "account_billing";
  if (s.includes("tax") || s.includes("세무")) return "tax";
  if (s.includes("funding") || s.includes("insurance") || s.includes("자금")) return "funding";
  if (s.includes("hiring") || s.includes("employee") || s.includes("인건")) return "hiring";
  if (s.includes("today") || s.includes("dashboard") || s.includes("analysis") || s.includes("analytics") || s.includes("report") || s === "/") return "dashboard";

  return "other";
}
