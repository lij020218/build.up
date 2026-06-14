/**
 * gen-vendor-json.mts
 * 웹 SSOT(vendor-setup-data.ts)의 getVendorData 를 모든 카테고리·세부업종에 대해 호출해
 * iOS 가 읽는 vendor-data.json 을 생성. (이전 /tmp/gen-vendor.ts 의 정식 커밋 버전)
 *
 * 실행: npx tsx scripts/gen-vendor-json.mts
 * 출력: packages/shared/src/vendor-data.json
 *        (apps/ios/Sources/FoundOneCore/Resources/vendor-data.json 가 이 파일로 심볼릭 링크됨)
 *
 * 구조: { categories: { [cat]: Bundle }, subIndustries: { [subId]: Bundle(+category) } }
 *   Bundle = { suppliers, equipment, pos, channels }  (각 항목에 budgetTier 포함)
 */
import { writeFileSync } from "node:fs";

const mod = await import(
  new URL("../apps/web/app/lib/components/stages/offline/vendor-setup-data.ts", import.meta.url).href
);
const getVendorData = mod.getVendorData as (s?: string, c?: string, sp?: string) => unknown;
const CATEGORY_VENDOR_BASE = mod.CATEGORY_VENDOR_BASE as Record<string, unknown>;
const SUB_TO_CATEGORY = mod.SUB_TO_CATEGORY as Record<string, string>;

const categories: Record<string, unknown> = {};
for (const cat of Object.keys(CATEGORY_VENDOR_BASE)) {
  categories[cat] = getVendorData(undefined, cat, undefined);
}

const subIndustries: Record<string, unknown> = {};
for (const subId of Object.keys(SUB_TO_CATEGORY)) {
  const category = SUB_TO_CATEGORY[subId];
  subIndustries[subId] = { category, ...(getVendorData(subId, undefined, undefined) as object) };
}

const out = { categories, subIndustries };
const dest = new URL("../packages/shared/src/vendor-data.json", import.meta.url);
writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");

const nCat = Object.keys(categories).length;
const nSub = Object.keys(subIndustries).length;
console.log(`generated vendor-data.json — categories: ${nCat}, subIndustries: ${nSub}`);
