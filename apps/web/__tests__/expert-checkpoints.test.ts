import { describe, it, expect } from "vitest";
import {
  starterStageFlow,
  EXPERT_CHECKPOINTS,
  EXPERT_CHANNELS,
  expertCheckpointForStage,
  nearbySearchUrl,
} from "@foundone/shared";

/**
 * 전문가 체크포인트 가드 (2026-07-27).
 * - 유령 stageId 금지: 오타·삭제된 단계에 조용히 카드가 안 뜨는 사고 방지.
 * - 채널 무결성: 전화·URL·지도검색 중 하나는 반드시 있어야 렌더 가능.
 * - 정직성: 무료 배지는 공공 채널에만 (nearby 지도 검색에 무료 배지 금지 — 유료 사무소).
 */

describe("expert-checkpoints 가드", () => {
  const stageIds = new Set(starterStageFlow.map((s) => s.stageId));

  it("모든 체크포인트 stageId 가 실제 로드맵 단계다 (유령 금지)", () => {
    const ghosts = EXPERT_CHECKPOINTS.flatMap((c) => c.stageIds).filter((id) => !stageIds.has(id));
    expect(ghosts, `starterStageFlow 에 없는 stageId: ${ghosts.join(", ")}`).toEqual([]);
  });

  it("한 단계에 체크포인트는 최대 1개 (중복 매핑 금지)", () => {
    const all = EXPERT_CHECKPOINTS.flatMap((c) => c.stageIds);
    const dup = all.filter((id, i) => all.indexOf(id) !== i);
    expect(dup, `중복 매핑: ${dup.join(", ")}`).toEqual([]);
  });

  it("모든 채널은 phone/url/nearbyQuery 중 최소 1개 보유", () => {
    for (const ch of Object.values(EXPERT_CHANNELS)) {
      expect(
        Boolean(ch.phone || ch.url || ch.nearbyQuery),
        `렌더 불가 채널: ${ch.key}`,
      ).toBe(true);
    }
  });

  it("무료 배지는 공공 채널에만 — 지도 검색(nearby)에 무료 표시 금지", () => {
    for (const ch of Object.values(EXPERT_CHANNELS)) {
      if (ch.nearbyQuery) expect(ch.free ?? false, `${ch.key}: nearby 에 free 금지`).toBe(false);
    }
  });

  it("각 체크포인트의 채널 순서 — 무료 공공이 nearby 보다 앞 (사장님 우선순위)", () => {
    for (const c of EXPERT_CHECKPOINTS) {
      const firstNearby = c.channels.findIndex((ch) => ch.nearbyQuery);
      const lastFree = c.channels.reduce((acc, ch, i) => (ch.free ? i : acc), -1);
      if (firstNearby >= 0 && lastFree >= 0) {
        expect(firstNearby, `${c.stageIds[0]}: nearby 가 무료 채널보다 앞`).toBeGreaterThan(lastFree);
      }
    }
  });

  it("스네이크 code 로도 조회된다 (웹 currentStage.code 정규화)", () => {
    expect(expertCheckpointForStage("tax_guide")?.expert.ko).toBe("세무사");
    expect(expertCheckpointForStage("contract-review")?.expert.ko).toContain("변호사");
    expect(expertCheckpointForStage("menu-design")).toBeNull(); // 미지정 단계 = 미노출
  });

  it("nearby URL 이 지역을 접두한다", () => {
    expect(nearbySearchUrl("세무사", "서초동")).toContain(encodeURIComponent("서초동 세무사"));
    expect(nearbySearchUrl("세무사", null)).toContain(encodeURIComponent("세무사"));
  });
});
