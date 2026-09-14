import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  APP_COMPLIANCE_CONTENT,
  STAGE_CONTENT_REGISTRY,
  NON_SOFTWARE_STARTUP_SUB_INDUSTRIES,
  showsAppCompliance,
  type Section,
} from "@foundone/shared";

/**
 * 앱·플랫폼 규제·계약(app-compliance) 웹↔iOS 드리프트 가드 (2026-09-11, 구함 사례).
 *
 * SSOT = packages/shared/src/stages/content/app-compliance.ts → stage-content.json(코드젠) → iOS.
 * iOS 가 수동 미러하는 두 곳만 Swift 파일을 파싱해 대조한다:
 *   ① 섹션 kind 디코더(StageContentRegistry.swift) — SSOT 가 쓰는 kind 를 모두 디코드하는가
 *   ② IndustryCluster.nonSoftwareStartupSubIndustries — clusters.ts 의 비소프트웨어 스타트업 목록과 동일한가
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const IOS_CORE = join(HERE, "..", "..", "ios", "Sources", "FoundOneCore");
const IOS_RENDERER = join(HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Roadmap", "Stages", "BUStageContentRenderer.swift");

function collectKinds(sections: Section[], into: Set<string>) {
  for (const s of sections) {
    into.add(s.kind);
  }
}

describe("app-compliance 섹션 kind — iOS 디코더 커버리지", () => {
  const registry = readFileSync(join(IOS_CORE, "StageContentRegistry.swift"), "utf8");
  const decodedKinds = new Set<string>();
  for (const m of registry.matchAll(/case "([a-zA-Z]+)":\s*\n\s*self = \./g)) decodedKinds.add(m[1]);

  it("SSOT 전 단계가 쓰는 모든 kind 를 iOS 가 디코드한다(unsupported 로 떨어지는 kind 없음)", () => {
    const used = new Set<string>();
    for (const content of Object.values(STAGE_CONTENT_REGISTRY)) {
      for (const p of content.pages) collectKinds(p.sections, used);
    }
    const missing = [...used].filter((k) => !decodedKinds.has(k));
    expect(missing, `iOS StageContentRegistry.swift 에 디코드 case 가 없는 kind: ${missing.join(", ")}`).toEqual([]);
  });

  it("app-compliance 의 interactive ref(dateOffset) 를 iOS 렌더러가 매핑한다", () => {
    const renderer = readFileSync(IOS_RENDERER, "utf8");
    const refs = new Set<string>();
    for (const p of APP_COMPLIANCE_CONTENT.pages) {
      for (const s of p.sections) {
        if (s.kind === "interactive" && (s.platforms ?? ["web", "ios"]).includes("ios")) refs.add(s.ref);
      }
    }
    for (const ref of refs) {
      expect(renderer.includes(`case "${ref}":`), `iOS interactiveSection 에 "${ref}" 매핑 없음`).toBe(true);
    }
  });
});

describe("소프트웨어 스타트업 판정 — clusters.ts ↔ IndustryCluster.swift", () => {
  it("iOS nonSoftwareStartupSubIndustries 가 SSOT 목록과 집합으로 일치한다", () => {
    const swift = readFileSync(join(IOS_CORE, "IndustryCluster.swift"), "utf8");
    const block = /nonSoftwareStartupSubIndustries:\s*Set<String>\s*=\s*\[([\s\S]*?)\]/.exec(swift);
    expect(block, "IndustryCluster.swift 에 nonSoftwareStartupSubIndustries 정의 없음").not.toBeNull();
    const ios = [...block![1].matchAll(/"([^"]+)"/g)].map((m) => m[1]).sort();
    expect(ios).toEqual([...NON_SOFTWARE_STARTUP_SUB_INDUSTRIES].sort());
  });

  it("showsAppCompliance — 소프트웨어(ai-application·세부 미선택 startup-tech)만 true, 하드웨어·딥테크·오프라인은 false", () => {
    expect(showsAppCompliance("ai-application", "startup-tech")).toBe(true);
    expect(showsAppCompliance(undefined, "startup-tech")).toBe(true);
    expect(showsAppCompliance("hardware-iot", "startup-tech")).toBe(false);
    expect(showsAppCompliance("semiconductor", "startup-tech")).toBe(false);
    expect(showsAppCompliance("korean-casual", "food")).toBe(false);
    expect(showsAppCompliance("creator-service", "online-digital")).toBe(false);
  });
});
