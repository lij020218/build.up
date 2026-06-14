/**
 * gen-mobile-launch-json.mts
 * 웹 SSOT(mobile-launch-guide.ts)를 iOS 가 읽는 mobile-launch-guide.json 으로 직렬화.
 *
 * 실행: npx tsx scripts/gen-mobile-launch-json.mts
 * 출력: packages/shared/src/mobile-launch-guide.json
 *        (apps/ios/Sources/FoundOneCore/Resources/mobile-launch-guide.json 심볼릭 링크)
 */
import { writeFileSync } from "node:fs";

const mod = await import(new URL("../packages/shared/src/mobile-launch-guide.ts", import.meta.url).href);
const out = mod.MOBILE_LAUNCH_GUIDE as unknown;
const dest = new URL("../packages/shared/src/mobile-launch-guide.json", import.meta.url);
writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
const g = out as { apple: unknown[]; google: unknown[]; korea: unknown[]; crossCutting: unknown[] };
console.log(`generated mobile-launch-guide.json — apple ${g.apple.length}, google ${g.google.length}, korea ${g.korea.length}, crossCutting ${g.crossCutting.length}`);
