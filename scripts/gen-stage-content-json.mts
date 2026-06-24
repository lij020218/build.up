/**
 * gen-stage-content-json.mts
 * 웹 SSOT(packages/shared/src/stages) 의 단계 콘텐츠 레지스트리를
 * iOS 가 읽는 stage-content.json 으로 직렬화.
 *
 * 선례: gen-mobile-launch-json.mts (TS 모듈 직접 import → JSON write, 파싱 0 → 전사 오류 0).
 *
 * 실행: npx tsx scripts/gen-stage-content-json.mts
 * 출력: packages/shared/src/stages/stage-content.json
 *        (apps/ios/Sources/FoundOneCore/Resources/stage-content.json 심볼릭 링크)
 *
 * 형태: { [stageId]: StageContent }  — iOS 는 stageId 로 조회.
 */
import { writeFileSync } from "node:fs";

const mod = await import(new URL("../packages/shared/src/stages/index.ts", import.meta.url).href);
const registry = mod.STAGE_CONTENT_REGISTRY as Record<string, { stageId: string; pages: unknown[]; byCategory: Record<string, unknown> }>;

const dest = new URL("../packages/shared/src/stages/stage-content.json", import.meta.url);
writeFileSync(dest, JSON.stringify(registry, null, 2) + "\n", "utf8");

const stages = Object.values(registry);
console.log(
  `generated stage-content.json — ${stages.length} stage(s): ` +
    stages.map((s) => `${s.stageId}(pages ${s.pages.length}, cats ${Object.keys(s.byCategory).length})`).join(", "),
);
