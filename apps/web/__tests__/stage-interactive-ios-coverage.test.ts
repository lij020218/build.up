import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { STAGE_CONTENT_REGISTRY } from "@foundone/shared";

/**
 * 단계 interactive ref → iOS 렌더러 커버리지 가드 (2026-08-06, 출시 전수감사).
 *
 * BUStageContentRenderer.swift 의 switch 는 `default: EmptyView()` — 미처리 ref 는
 * iOS 에서 소리 없이 사라진다. platforms 미지정(=양쪽) 또는 "ios" 포함인 ref 가
 * Swift 에 case 로 없으면 여기서 실패시켜 무언 공백을 막는다.
 * 웹 전용 위젯은 SSOT 에 platforms: ["web"] 를 명시하면 통과.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const IOS_RENDERER = join(
  HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Roadmap", "Stages", "BUStageContentRenderer.swift",
);

type InteractiveSection = { kind: "interactive"; ref: string; platforms?: Array<"web" | "ios"> };

function collectIosRefs(): Map<string, string[]> {
  const byRef = new Map<string, string[]>();
  for (const [stageId, content] of Object.entries(STAGE_CONTENT_REGISTRY)) {
    for (const page of content.pages) {
      for (const section of page.sections) {
        if (section.kind !== "interactive") continue;
        const s = section as InteractiveSection;
        const needsIos = !s.platforms || s.platforms.includes("ios");
        if (!needsIos) continue;
        byRef.set(s.ref, [...(byRef.get(s.ref) ?? []), `${stageId}/${page.id}`]);
      }
    }
  }
  return byRef;
}

describe("단계 interactive ref iOS 커버리지", () => {
  const swift = readFileSync(IOS_RENDERER, "utf8");
  const iosRefs = collectIosRefs();

  it("iOS 대상 ref 가 하나 이상 존재한다 (수집 로직 자체 검증)", () => {
    expect(iosRefs.size).toBeGreaterThan(5);
  });

  it("platforms에 ios가 포함된(또는 미지정) 모든 ref 는 Swift 렌더러에 case 가 있다", () => {
    const missing: string[] = [];
    for (const [ref, where] of iosRefs) {
      if (!swift.includes(`case "${ref}"`)) missing.push(`${ref} (사용처: ${where.join(", ")})`);
    }
    expect(missing, `iOS 렌더러에 case 없음 — 구현하거나 SSOT 에 platforms: ["web"] 명시:\n${missing.join("\n")}`).toEqual([]);
  });
});
