/**
 * 결제 UI 게이트.
 *
 * 서비스 정책상 2026년 6~8월은 전 기능 무료 → 결제(요금제·구독관리) UI를 전면 폐쇄한다.
 * `NEXT_PUBLIC_BILLING_ENABLED` 가 "true" 일 때만 결제 UI 가 열린다(미설정/그 외 = 닫힘).
 *
 * 9월 유료 전환 시 env 하나(`NEXT_PUBLIC_BILLING_ENABLED=true`)로 재개방.
 */
export const BILLING_ENABLED = process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

/**
 * 결제 *백엔드* 킬스위치 (실제 과금 가드). **서버 전용** — `NEXT_PUBLIC_` 아님이라
 * 클라이언트 번들엔 false 로만 박혀 우회 불가. fail-closed: 미설정/그 외 = 과금 비활성.
 *
 * 출시 정책(2026년 9월 전 전 기능 무료)상 출시 시점엔 반드시 OFF. UI 게이트(BILLING_ENABLED)는
 * 노출만 막지 과금 경로(api/billing/subscribe·cron/billing-renew)를 막지 못하므로 별도 서버 가드 필요.
 * 9월 유료화 시 Vercel 서버 env `BILLING_BACKEND_ENABLED=true` 로 활성.
 */
export const BILLING_BACKEND_ENABLED = process.env.BILLING_BACKEND_ENABLED === "true";

/** 프리미엄 월 요금(원). 단일 소스 — pricing/billing 양쪽이 참조. */
export const PREMIUM_PRICE_KRW = Number(process.env.NEXT_PUBLIC_PREMIUM_PRICE_KRW ?? 19900);
