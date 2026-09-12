/**
 * marketing/cardnews-themes.ts — 카드뉴스 렌더 테마 SSOT (2026-09-12).
 *
 * 왜 필요한가(냉정 점검의 결론): 카드뉴스가 템플릿 1종(남색)뿐이라
 *   이 기능을 쓰는 모든 가게가 **같은 카드**를 올리게 된다. 업종·분위기가 달라도 결과가 같으면
 *   "내 가게 콘텐츠"가 아니라 "파운드원 카드"가 된다.
 *
 * 웹(canvas)과 iOS(ImageRenderer)가 같은 색을 써야 결과물이 갈라지지 않는다 →
 *   토큰은 여기 한 곳에만 둔다. iOS 는 gen-marketing-cardnews-json.mts 로 만든
 *   cardnews-themes.json 을 읽는다(apps/web/__tests__/cardnews-themes-ios-sync.test.ts 가 대조).
 *
 * 색 선정 기준: 인스타 피드에서 사진과 섞였을 때 글자가 읽히는 대비(표지 텍스트는 항상 흰색),
 *   본문 카드는 밝은 배경 + 진한 잉크. 3종 이상 늘리지 않는다 — 선택지가 많으면 고르다 지친다.
 */

export type CardNewsThemeId = "midnight" | "cream" | "mono";

export type CardNewsTheme = {
  id: CardNewsThemeId;
  label: { ko: string; en: string };
  /** 어떤 가게에 어울리는지 — UI 칩 보조 문구 */
  hint: { ko: string; en: string };
  /** 표지 그라데이션 (좌상 → 우하) */
  coverFrom: string;
  coverTo: string;
  /** 본문 카드 배경 */
  bodyBg: string;
  /** 본문 진한 글자색 */
  ink: string;
  /** 강조색 — highlight 단어·번호·페이지 도트 */
  accent: string;
  /** 어두운 배경 위 강조색 (표지 highlight) */
  accentOnDark: string;
  /** 마지막(로고) 장 배경 */
  ctaBg: string;
};

export const CARDNEWS_THEMES: readonly CardNewsTheme[] = [
  {
    id: "midnight",
    label: { ko: "미드나잇", en: "Midnight" },
    hint: { ko: "기본 · 신뢰감", en: "Default · trustworthy" },
    coverFrom: "#191970",
    coverTo: "#10104a",
    bodyBg: "#F7F8FE",
    ink: "#10104a",
    accent: "#191970",
    accentOnDark: "#B9BBFF",
    ctaBg: "#F7F6F1",
  },
  {
    id: "cream",
    label: { ko: "크림", en: "Cream" },
    hint: { ko: "카페·베이커리·디저트", en: "Cafe & bakery" },
    coverFrom: "#6B4A2F",
    coverTo: "#3D2817",
    bodyBg: "#FBF6EE",
    ink: "#3D2817",
    accent: "#A9714B",
    accentOnDark: "#F0C9A0",
    ctaBg: "#FBF6EE",
  },
  {
    id: "mono",
    label: { ko: "모노", en: "Mono" },
    hint: { ko: "뷰티·피트니스·스튜디오", en: "Beauty & fitness" },
    coverFrom: "#1A1A1A",
    coverTo: "#000000",
    bodyBg: "#F4F4F4",
    ink: "#111111",
    accent: "#111111",
    accentOnDark: "#FFFFFF",
    ctaBg: "#FFFFFF",
  },
];

export const DEFAULT_CARDNEWS_THEME: CardNewsThemeId = "midnight";

/** 테마 조회 — 모르는 id 는 기본 테마. */
export function resolveCardNewsTheme(id: string | null | undefined): CardNewsTheme {
  return CARDNEWS_THEMES.find((t) => t.id === id) ?? CARDNEWS_THEMES[0];
}

/**
 * 업종 기본 테마 — 사장님이 고르기 전에 "그럴듯한" 것으로 시작한다.
 *  카페·디저트 → 크림 / 뷰티·피트니스 → 모노 / 그 외 → 미드나잇.
 */
export function defaultThemeForCategory(categoryId: string | null | undefined): CardNewsThemeId {
  if (categoryId === "cafe-dessert") return "cream";
  if (categoryId === "beauty" || categoryId === "fitness") return "mono";
  return DEFAULT_CARDNEWS_THEME;
}
