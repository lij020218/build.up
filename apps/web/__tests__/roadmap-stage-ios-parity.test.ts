import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { starterStageFlow } from "@foundone/shared";

/**
 * 로드맵 단계 목록 웹↔iOS 드리프트 가드 (2026-08-06, 출시 전수감사).
 *
 * SSOT = packages/shared/src/starter-data.ts 의 starterStageFlow.
 * iOS 는 RoadmapStage.swift 의 sharedPrefix + cluster 별 path 로 손미러 —
 * 한쪽에만 단계를 추가하면 그 단계가 iOS(또는 웹)에서 통째로 사라진다.
 *
 * 배경: "46단계 로드맵" 문구가 실제 48개·화면 표시 21개와 어긋나 있었다.
 * 총 단계 수를 사용자 문구로 박지 말 것 — 사장님이 보는 수는 업종(cluster)별로 다르다.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const IOS_STAGES = join(
  HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Roadmap", "RoadmapStage.swift",
);

const IOS_PATH_NAMES = [
  "sharedPrefix",
  "offlinePath",
  "onlinePath",
  "startupTechPath",
  "hardwarePath",
  "labPath",
  "semiPath",
];

/** franchise-application 은 path 배열이 아니라 pathFor 안에서 조건부 insert 된다. */
const IOS_CONDITIONAL_STAGES = ["franchise-application"];

function iosStageIds(swift: string): Set<string> {
  const ids = new Set<string>();
  for (const name of IOS_PATH_NAMES) {
    const re = new RegExp(`\\b${name}\\b[^\\[]*\\[([\\s\\S]*?)\\n\\s*\\]`);
    const m = swift.match(re);
    expect(m, `RoadmapStage.swift 에서 ${name} 배열을 찾지 못했습니다`).toBeTruthy();
    for (const hit of m![1].matchAll(/\("([a-z0-9-]+)"/g)) ids.add(hit[1]);
  }
  for (const id of IOS_CONDITIONAL_STAGES) {
    expect(swift, `${id} 조건부 삽입이 사라졌습니다`).toContain(`"${id}"`);
    ids.add(id);
  }
  return ids;
}

describe("로드맵 단계 웹↔iOS 동기화", () => {
  const swift = readFileSync(IOS_STAGES, "utf8");
  const ios = iosStageIds(swift);
  const web = new Set(starterStageFlow.map((s) => s.stageId));

  it("웹 SSOT 의 모든 단계가 iOS path 에도 존재한다", () => {
    expect([...web].filter((id) => !ios.has(id))).toEqual([]);
  });

  it("iOS 에만 있는 유령 단계가 없다", () => {
    expect([...ios].filter((id) => !web.has(id))).toEqual([]);
  });

  it("사용자 문구에 총 단계 수를 하드코딩하지 않는다 (업종별 15~23단계로 다르다)", () => {
    // "46단계 로드맵"(로그인) · "14단계 로드맵"(창업 형태 선택) 처럼 화면마다 다른 숫자가
    // 박혀 있었고 실제 화면과 어긋났다 (2026-08-06). 숫자를 쓰지 말고 "이후 로드맵"으로.
    const targets = [
      join(HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Auth", "SignInView.swift"),
      join(HERE, "..", "..", "ios", "Sources", "FoundOneCore", "StageKeyActionRegistry.swift"),
      join(HERE, "..", "app", "lib", "components", "stages", "selection", "StartupTypeSelectionStage.tsx"),
      join(HERE, "..", "app", "lib", "components", "stages", "selection", "IndustrySelectionStage.tsx"),
    ];
    const offenders = targets.filter((f) => /\d+\s*단계\s*(로드맵|가이드)/.test(readFileSync(f, "utf8")));
    expect(offenders.map((f) => f.split("/").pop())).toEqual([]);
  });
});
