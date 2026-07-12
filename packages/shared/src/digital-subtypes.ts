/**
 * digital-subtypes — 물리 배송이 없는 디지털·창작자 온라인 서브타입 SSOT.
 *
 *  소비처:
 *   - 웹 컴포넌트 게이팅: apps/web .../online/DigitalFulfillmentNotice.tsx (isDigitalFulfillment 재수출)
 *   - 태스크 라벨 오버라이드: i18n.ts localizeTaskTitle 의 "{taskId}__digital" 계층
 *   - iOS 미러: apps/ios/Sources/FoundOneCore/DigitalSubtypes.swift
 *
 *  이 서브타입들은 재고·택배·포장·KC인증이 성립하지 않음(결제 즉시 다운로드/접근권한 전달).
 */
export const DIGITAL_ONLINE_SUBTYPES = [
  "digital-products",
  "creator-service",
  "newsletter-membership",
  "ai-application",
] as const;

export function isDigitalOnlineSubtype(subIndustryId: string | null | undefined): boolean {
  return !!subIndustryId && (DIGITAL_ONLINE_SUBTYPES as readonly string[]).includes(subIndustryId);
}
