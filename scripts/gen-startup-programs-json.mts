/**
 * gen-startup-programs-json.mts
 * 웹 SSOT(startup-programs.ts)의 startupPrograms 배열을 iOS 번들 JSON으로 추출.
 * 목적: 지원사업 데이터 web↔iOS 동기화 (StartupProgramRegistry.swift 가 디코드).
 *
 * 실행: npx tsx scripts/gen-startup-programs-json.mts
 * 출력: apps/ios/Sources/FoundOneCore/Resources/startup-programs.json
 *
 * 주의: 점수 매칭 로직(getMatchedProgramsV2)은 Swift 에 손수 포팅돼 있음.
 *   데이터(필드) 변경은 이 스크립트로 동기화되지만, 매칭 '로직' 변경 시
 *   StartupProgramRegistry.swift 의 match() 도 직접 미러링해야 함.
 */
import { writeFileSync } from "node:fs";

const mod = await import(
  new URL("../packages/shared/src/startup-programs.ts", import.meta.url).href
);
const programs = (mod.startupPrograms ?? mod.default) as unknown[];
if (!Array.isArray(programs) || programs.length === 0) {
  throw new Error("startupPrograms 배열을 찾지 못함");
}

const outPath = new URL(
  "../apps/ios/Sources/FoundOneCore/Resources/startup-programs.json",
  import.meta.url
);
writeFileSync(outPath, JSON.stringify(programs, null, 2) + "\n", "utf8");
console.log(`✓ ${programs.length} programs → startup-programs.json`);
