/**
 * gen-compliance-json.mts
 * 웹 SSOT(packages/shared/src/compliance) 의 데이터(본인인증 채널·PG 프리체크 규칙·서류 용어)를
 * iOS 가 읽는 compliance-data.json 으로 직렬화. 로직(선택기·검사기)은 iOS 가 Swift 로 미러하고
 * 데이터만 공유한다(apps/web/__tests__/app-compliance-ios-sync.test.ts 가 대조).
 *
 * 실행: npx tsx scripts/gen-compliance-json.mts
 * 출력: packages/shared/src/compliance/compliance-data.json
 *        (apps/ios/Sources/FoundOneCore/Resources/compliance-data.json 심볼릭 링크)
 */
import { writeFileSync } from "node:fs";

const mod = await import(new URL("../packages/shared/src/compliance/index.ts", import.meta.url).href);
const out = {
  identityChannels: mod.IDENTITY_CHANNELS,
  portoneConsoleStepsIdentityOnly: mod.PORTONE_CONSOLE_STEPS_IDENTITY_ONLY,
  pgPrecheckRules: mod.PG_PRECHECK_RULES,
  appOnlyNote: mod.APP_ONLY_NOTE,
  docTerms: mod.DOC_TERMS,
};
const dest = new URL("../packages/shared/src/compliance/compliance-data.json", import.meta.url);
writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(
  `generated compliance-data.json — channels ${out.identityChannels.length}, rules ${out.pgPrecheckRules.length}, docTerms ${out.docTerms.length}`,
);
