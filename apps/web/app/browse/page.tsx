import BrowseClient from "./browse-client";

/**
 * /browse — 로그인 없이 둘러보기 (게스트 모드).
 * iOS 5.1.1(v) 게스트 모드의 웹 미러 — /auth "로그인 없이 둘러보기" 링크가 진입점.
 */
export const metadata = {
  title: "둘러보기 — Found.One",
  description: "가입 없이 프랜차이즈 비교, 세금 안내, 창업 로드맵을 둘러보세요.",
};

export default function BrowsePage() {
  return <BrowseClient />;
}
