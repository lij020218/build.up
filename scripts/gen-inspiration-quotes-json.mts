/**
 * gen-inspiration-quotes-json.mts
 * 웹 SSOT(inspiration-quotes.ts)의 "오늘의 영감" 명언을 iOS 가 읽는 JSON 으로 직렬화.
 * (웹→iOS codegen 원칙 — Swift 손미러 금지, 문장이 길어 오타 위험이 크다)
 *
 * 실행: npx tsx scripts/gen-inspiration-quotes-json.mts
 * 출력: packages/shared/src/inspiration-quotes.json
 *        (apps/ios/Sources/FoundOneCore/Resources/inspiration-quotes.json 가 심볼릭 링크)
 */
import { writeFileSync } from "node:fs";

const mod = await import(new URL("../packages/shared/src/inspiration-quotes.ts", import.meta.url).href);
const quotes = mod.INSPIRATION_QUOTES as Array<{ id: string; source?: string; sourceUrl?: string }>;

const missing = quotes.filter((q) => !q.source || !q.sourceUrl);
if (missing.length > 0) {
  throw new Error(`출처 없는 명언은 넣을 수 없습니다: ${missing.map((q) => q.id).join(", ")}`);
}

const dest = new URL("../packages/shared/src/inspiration-quotes.json", import.meta.url);
writeFileSync(dest, JSON.stringify({ quotes }, null, 2) + "\n", "utf8");
console.log(`generated inspiration-quotes.json — ${quotes.length} quotes`);
