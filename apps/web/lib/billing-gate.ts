/**
 * 결제 UI 게이트.
 *
 * 서비스 정책상 2026년 6~8월은 전 기능 무료 → 결제(요금제·구독관리) UI를 전면 폐쇄한다.
 * `NEXT_PUBLIC_BILLING_ENABLED` 가 "true" 일 때만 결제 UI 가 열린다(미설정/그 외 = 닫힘).
 *
 * 9월 유료 전환 시 env 하나(`NEXT_PUBLIC_BILLING_ENABLED=true`)로 재개방.
 * 결제 백엔드(api/billing/*)는 이 게이트와 무관하게 동작한다 — UI 노출만 통제.
 */
export const BILLING_ENABLED = process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

/** 프리미엄 월 요금(원). 단일 소스 — pricing/billing 양쪽이 참조. */
export const PREMIUM_PRICE_KRW = Number(process.env.NEXT_PUBLIC_PREMIUM_PRICE_KRW ?? 19900);
