/**
 * gen-startup-tools-json.mts
 * 웹 SSOT(startup-tools.ts)의 스타트업 단계별 도구·추천 스택·서브카테고리 오버라이드를
 * iOS 가 읽는 startup-tools.json 으로 직렬화. (웹→iOS codegen 원칙)
 *
 * 실행: npx tsx scripts/gen-startup-tools-json.mts
 * 출력: packages/shared/src/startup-tools.json
 *        (apps/ios/Sources/FoundOneCore/Resources/startup-tools.json 가 심볼릭 링크)
 *
 * 구조: { stages: {stageId: StageToolKit}, stacks: RecommendedStack[], overrides: {subId: SubCategoryToolOverride} }
 */
import { writeFileSync } from "node:fs";

const mod = await import(new URL("../packages/shared/src/startup-tools.ts", import.meta.url).href);
const STARTUP_STAGE_TOOLS = mod.STARTUP_STAGE_TOOLS as Array<{ stageId: string }>;
const RECOMMENDED_STACKS = mod.RECOMMENDED_STACKS as unknown[];
const SUB_CATEGORY_TOOL_OVERRIDES = mod.SUB_CATEGORY_TOOL_OVERRIDES as Record<string, unknown>;

const stages: Record<string, unknown> = {};
for (const s of STARTUP_STAGE_TOOLS) stages[s.stageId] = s;

const out = { stages, stacks: RECOMMENDED_STACKS, overrides: SUB_CATEGORY_TOOL_OVERRIDES };
const dest = new URL("../packages/shared/src/startup-tools.json", import.meta.url);
writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(`generated startup-tools.json — stages: ${Object.keys(stages).length}, stacks: ${RECOMMENDED_STACKS.length}, overrides: ${Object.keys(SUB_CATEGORY_TOOL_OVERRIDES).length}`);
