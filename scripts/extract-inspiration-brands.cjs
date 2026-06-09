const fs = require("fs");
const src = fs.readFileSync("apps/web/app/lib/components/FloatingInspiration.tsx", "utf8");
const m = src.match(/const BRANDS:\s*Brand\[\]\s*=\s*(\[[\s\S]*?\n\]);/);
if (!m) { console.error("BRANDS not found"); process.exit(1); }
// eval the JS array literal (unquoted keys, comments, trailing commas all valid JS)
const arr = eval(m[1]);
if (!Array.isArray(arr) || arr.length < 10) { console.error("parse failed, len=", arr.length); process.exit(1); }
const json = JSON.stringify(arr, null, 2);

// 1) shared JSON (iOS 심볼릭 링크 대상)
fs.writeFileSync("packages/shared/src/inspiration-brands.json", json + "\n");

// 2) shared TS SSOT (웹 import 대상) — JSON 은 유효한 TS 리터럴
const ts = `// ⚠️ AUTO-GENERATED — 손으로 편집 금지.
//  소스(SSOT): apps/web/app/lib/components/FloatingInspiration.tsx 의 BRANDS 배열.
//  재생성: node /tmp/extract_brands.cjs (스크립트는 scripts/extract-inspiration-brands.cjs 로도 보관).
//
//  창업 성공 스타트업 카드 데이터 — 웹 FloatingInspiration + iOS FloatingInspirationView 공유.
//  iOS 는 동일 데이터를 packages/shared/src/inspiration-brands.json(심볼릭 링크)로 번들.

export type InspirationBrand = {
  name: string;
  tagline: string;
  color: string;
  iconSlug?: string;
  iconColor?: string;
  glyph: string;
  textColor?: string;
  /** 창업 시작 — "어떤 인사이트로 시작했는가" (모달 헤드) */
  origin: string;
  /** 핵심 차별점 — bullet 3개 */
  keys: string[];
  /** 사장님에게 주는 한 줄 교훈 */
  lesson: string;
  /** 창립 연도 + 본사 */
  founded: string;
};

export const inspirationBrands: InspirationBrand[] = ${json};
`;
fs.writeFileSync("packages/shared/src/inspiration-data.ts", ts);
console.log("OK — wrote", arr.length, "brands → inspiration-brands.json + inspiration-data.ts");
console.log("names:", arr.map(b => b.name).join(", "));
