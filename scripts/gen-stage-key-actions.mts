/**
 * gen-stage-key-actions.mts
 * 웹 SSOT(packages/shared/src/stages/stage-key-actions.ts)의 특수업종별 KEY ACTION을
 * iOS가 읽는 stage-key-actions.json 으로 직렬화.
 *
 * 선례: gen-stage-content-json.mts (TS 모듈 직접 import → JSON write, 파싱 0 → 전사 오류 0).
 *
 * 실행: npx tsx scripts/gen-stage-key-actions.mts
 * 출력: packages/shared/src/stages/stage-key-actions.json
 *        (apps/ios/Sources/FoundOneCore/Resources/stage-key-actions.json 심볼릭 링크)
 *
 * 형태: { [specialtyOrCategoryId]: { [stageId]: { title, detail, bullets } } }
 */
import { writeFileSync } from "node:fs";

const mod = await import(new URL("../packages/shared/src/stages/stage-key-actions.ts", import.meta.url).href);
const registry = mod.STAGE_KEY_ACTIONS_BY_SPECIALTY as Record<string, Record<string, unknown>>;

const dest = new URL("../packages/shared/src/stages/stage-key-actions.json", import.meta.url);
writeFileSync(dest, JSON.stringify(registry, null, 2) + "\n", "utf8");

const keys = Object.keys(registry);
const pairs = keys.reduce((n, k) => n + Object.keys(registry[k]).length, 0);
console.log(`generated stage-key-actions.json — ${keys.length} specialty/category key(s), ${pairs} key-action(s): ${keys.join(", ")}`);
