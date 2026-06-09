// inspiration-brands.json(SSOT) → inspiration-data.ts(웹 import) 재생성.
//  데이터는 JSON 이 단일 소스. JSON 편집 후 이 스크립트로 TS 를 다시 만든다.
//  실행: node scripts/gen-inspiration-data.cjs

const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const JSON_PATH = path.join(ROOT, "packages/shared/src/inspiration-brands.json");
const TS_PATH = path.join(ROOT, "packages/shared/src/inspiration-data.ts");

const arr = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
const json = JSON.stringify(arr, null, 2);
const ts = `// ⚠️ AUTO-GENERATED — 손으로 편집 금지.
//  SSOT: packages/shared/src/inspiration-brands.json. 편집 후 \`node scripts/gen-inspiration-data.cjs\`.
//
//  창업 성공 스타트업 카드 데이터 — 웹 FloatingInspiration + iOS FloatingInspirationView 공유.
//  iOS 는 동일 JSON(심볼릭 링크) + 실제 로고 PNG(scripts/gen-inspiration-logos.cjs)를 번들.

export type InspirationBrand = {
  name: string;
  tagline: string;
  color: string;
  iconSlug?: string;
  iconColor?: string;
  /** true = 실제 앱 아이콘(풀컬러, 타일 가득) — 한국 브랜드. false/없음 = Simple Icons 실루엣. */
  appIcon?: boolean;
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
fs.writeFileSync(TS_PATH, ts);
console.log(`OK — ${arr.length} brands → inspiration-data.ts`);
