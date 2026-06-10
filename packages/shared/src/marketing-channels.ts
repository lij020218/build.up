/* ─────────────────────────────────────────────
 *  marketing-channels.ts — 마케팅 채널 SSOT (Single Source Of Truth)
 *
 *  웹·iOS 가 같은 채널 메타·업종별 추천을 쓰도록 한 곳에서 정의.
 *   - 웹: marketing-store.ts 가 여기서 import (CHANNEL_LIST 는 lucide 아이콘만 웹에서 덧붙임).
 *   - iOS: MarketingChannelMeta(Swift) 가 손으로 미러. 드리프트는
 *          __tests__/marketing-channels-ios-sync.test.ts 가 CI 에서 차단.
 *
 *  채널을 추가/변경하면 ① 이 파일 ② iOS MarketingRepository.swift 둘 다 수정 →
 *   동기화 테스트가 일치를 강제한다.
 * ───────────────────────────────────────────── */

export type MarketingChannelKey =
  | "naver-place" | "instagram" | "delivery-ads" | "naver-keyword"
  | "daangn" | "blog-review" | "kakao" | "google-ads" | "meta-ads" | "offline";

export type MarketingChannelMeta = {
  key: MarketingChannelKey;
  labelKo: string;
  labelEn: string;
  /** 브랜드 컬러 (hex) — 웹 아이콘·iOS 칩 공통 */
  color: string;
};

/** 채널 메타 — 키·라벨·컬러 (순서 = 기본 노출 순서) */
export const MARKETING_CHANNELS: MarketingChannelMeta[] = [
  { key: "naver-place",   labelKo: "네이버 플레이스",  labelEn: "Naver Place",   color: "#059669" },
  { key: "instagram",     labelKo: "인스타그램",       labelEn: "Instagram",     color: "#e1306c" },
  { key: "delivery-ads",  labelKo: "배달앱 광고",      labelEn: "Delivery Ads",  color: "#2ac1bc" },
  { key: "naver-keyword", labelKo: "네이버 키워드",    labelEn: "Naver Keyword", color: "#03c75a" },
  { key: "daangn",        labelKo: "당근마켓",         labelEn: "Daangn",        color: "#ff7e36" },
  { key: "blog-review",   labelKo: "블로그·체험단",     labelEn: "Blog Review",   color: "#2563eb" },
  { key: "kakao",         labelKo: "카카오톡 채널",    labelEn: "KakaoTalk",     color: "#fee500" },
  { key: "google-ads",    labelKo: "구글 애즈",        labelEn: "Google Ads",    color: "#4285f4" },
  { key: "meta-ads",      labelKo: "Meta 광고",        labelEn: "Meta Ads",      color: "#1877f2" },
  { key: "offline",       labelKo: "오프라인 (전단지 등)", labelEn: "Offline",   color: "#64748b" },
];

/** 업종별 추천 채널 (우선순위 순) */
export const RECOMMENDED_CHANNELS: Record<string, MarketingChannelKey[]> = {
  "food": ["naver-place", "delivery-ads", "instagram", "daangn", "blog-review"],
  "cafe-dessert": ["instagram", "blog-review", "naver-place", "daangn"],
  "retail": ["daangn", "naver-keyword", "instagram"],
  "beauty": ["naver-place", "blog-review", "kakao", "instagram"],
  "pet": ["naver-place", "blog-review", "kakao", "instagram"],
  "fitness": ["daangn", "instagram", "naver-place", "kakao"],
  "education": ["daangn", "instagram", "naver-place", "kakao"],
  "space": ["naver-place", "instagram", "daangn"],
  "online-digital": ["naver-keyword", "meta-ads", "instagram", "google-ads"],
  "startup-tech": ["meta-ads", "google-ads", "instagram", "blog-review"],
  "living-service": ["daangn", "naver-place", "kakao"],
};

/** iOS default (업종 미상) 와 동일한 폴백 */
export const DEFAULT_RECOMMENDED_CHANNELS: MarketingChannelKey[] = ["naver-place", "instagram", "kakao", "daangn"];

export function recommendedChannelsFor(categoryId: string | null | undefined): MarketingChannelKey[] {
  return (categoryId && RECOMMENDED_CHANNELS[categoryId]) || DEFAULT_RECOMMENDED_CHANNELS;
}
