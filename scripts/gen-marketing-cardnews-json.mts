/**
 * gen-marketing-cardnews-json.mts
 * 웹 SSOT(marketing/cardnews-themes.ts)의 카드뉴스 테마를 iOS 가 읽는 JSON 으로 직렬화.
 * (웹→iOS codegen 원칙 — Swift 손미러 금지. 색 토큰이 갈라지면 같은 기능이 플랫폼마다 다른 결과물을 낸다)
 *
 * 실행: npx tsx scripts/gen-marketing-cardnews-json.mts
 * 출력: packages/shared/src/marketing/cardnews-themes.json
 *        (apps/ios/Sources/FoundOneCore/Resources/cardnews-themes.json 가 심볼릭 링크)
 */
import { writeFileSync } from "node:fs";

const mod = await import(new URL("../packages/shared/src/marketing/cardnews-themes.ts", import.meta.url).href);
const out = {
  themes: mod.CARDNEWS_THEMES,
  defaultThemeId: mod.DEFAULT_CARDNEWS_THEME,
  /** 업종 기본 테마 — iOS 가 같은 규칙을 쓰도록 표로 내보낸다. */
  defaultByCategory: Object.fromEntries(
    ["food", "cafe-dessert", "retail", "beauty", "fitness", "education", "pet", "living-service", "space", "online-digital", "startup-tech"]
      .map((c) => [c, mod.defaultThemeForCategory(c)]),
  ),
};
const dest = new URL("../packages/shared/src/marketing/cardnews-themes.json", import.meta.url);
writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(`generated cardnews-themes.json — themes ${out.themes.length}, default ${out.defaultThemeId}`);
