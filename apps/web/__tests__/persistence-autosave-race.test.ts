/**
 * usePersistence 의 safeSaveStoreData in-flight serializer 검증.
 *
 *  배경 (2026-05-18 audit):
 *    4채널 (800ms autosave / 1s debounce / 5s interval / immediate) 이 동시 호출되면
 *    stale upsert 가 fresh 를 덮어쓸 위험. safeSaveStoreData 가 직전 in-flight 이 끝난
 *    뒤 실행하도록 직렬화.
 *
 *  이 테스트는 그 시리얼라이저 패턴의 *순수 로직* 을 미러한다. usePersistence 본 hook 은
 *  React 환경에서만 동작하므로, 핵심 동시성 규칙만 분리해서 검증.
 *
 *  변경 시 usePersistence.ts:safeSaveStoreData 와 동기화 필요.
 */

import { describe, expect, it, vi } from "vitest";

type Payload = { id: number; value: string };

/**
 * usePersistence.ts 의 safeSaveStoreData 패턴 미러.
 *
 *  변경 시 양쪽 같이 수정 필요.
 */
function createSerializer<T>(saveImpl: (payload: T) => Promise<void>) {
  let inflight: Promise<unknown> | null = null;
  return async function safeSave(payload: T): Promise<void> {
    if (inflight) {
      try { await inflight; } catch { /* ignore prior failure */ }
    }
    const p = saveImpl(payload).finally(() => {
      if (inflight === p) inflight = null;
    });
    inflight = p;
    return p;
  };
}

describe("safeSaveStoreData serializer", () => {
  it("두 동시 호출이 직렬로 실행되어 *마지막* payload 가 최종 저장된다", async () => {
    const callOrder: number[] = [];
    const savedValues: string[] = [];
    let resolveFirst!: () => void;
    let resolveSecond!: () => void;

    const saveImpl = vi.fn(async (p: Payload) => {
      callOrder.push(p.id);
      if (p.id === 1) await new Promise<void>((r) => { resolveFirst = r; });
      else if (p.id === 2) await new Promise<void>((r) => { resolveSecond = r; });
      savedValues.push(p.value);
    });
    const safeSave = createSerializer(saveImpl);

    const p1 = safeSave({ id: 1, value: "stale" });
    const p2 = safeSave({ id: 2, value: "fresh" });

    // 첫 번째는 시작됨
    expect(callOrder).toEqual([1]);
    // 두 번째는 아직 대기 (await inflight)
    expect(callOrder.length).toBe(1);

    resolveFirst();
    await p1;
    // 첫 번째 끝나면 두 번째 시작
    await new Promise((r) => setTimeout(r, 0));
    expect(callOrder).toEqual([1, 2]);

    resolveSecond();
    await p2;

    // 최종적으로 fresh 가 마지막 저장 (stale 덮어쓰기 없음)
    expect(savedValues).toEqual(["stale", "fresh"]);
  });

  it("첫 번째 호출이 실패해도 두 번째는 정상 실행", async () => {
    const callOrder: number[] = [];
    const saveImpl = vi.fn(async (p: Payload) => {
      callOrder.push(p.id);
      if (p.id === 1) throw new Error("first failed");
    });
    const safeSave = createSerializer(saveImpl);

    await expect(safeSave({ id: 1, value: "a" })).rejects.toThrow("first failed");
    await safeSave({ id: 2, value: "b" });
    expect(callOrder).toEqual([1, 2]);
  });

  it("3개 동시 호출이 1 → 2 → 3 순서로 실행 (병렬 호출 차단)", async () => {
    const callOrder: number[] = [];
    const resolvers: Array<() => void> = [];
    const saveImpl = vi.fn(async (p: Payload) => {
      callOrder.push(p.id);
      await new Promise<void>((r) => { resolvers.push(r); });
    });
    const safeSave = createSerializer(saveImpl);

    const p1 = safeSave({ id: 1, value: "x" });
    const p2 = safeSave({ id: 2, value: "y" });
    const p3 = safeSave({ id: 3, value: "z" });

    // 시작 시점엔 1만 실행 중 (병렬 시작 차단)
    expect(callOrder).toEqual([1]);
    expect(resolvers.length).toBe(1);

    resolvers[0]!();
    await p1;
    resolvers[1]!();
    await p2;
    resolvers[2]!();
    await p3;

    // 최종 실행 순서는 입력 순서 보존
    expect(callOrder).toEqual([1, 2, 3]);
  });
});

/**
 * 사용자 path 외 stage backfill 차단 검증.
 *
 *  helpers.ts:advanceStageWithChainBackfill 의 path-aware chain-backfill 로직 미러.
 *  종전엔 baseRoadmap.stages 배열 순서 (offline→tech→cluster→franchise→online→tail) 로
 *  모든 prior stage 를 completedAt 마킹 → online 셀러가 startup-only stage 도 완료 표시.
 *  이제는 resolveNextStageIds 따라가며 *현재 path 의 prior* 만 backfill.
 */
describe("chain-backfill path 무결성", () => {
  type Stage = { stageId: string; nextStageIds: string[]; nextStageConditions?: Array<{ matchValue: string; stageIds: string[] }> };
  function traversePriorPath(
    stages: Stage[],
    targetStageId: string,
    decisions: { category?: string },
  ): string[] {
    const stageById = new Map(stages.map((s) => [s.stageId, s]));
    const seen = new Set<string>();
    const prior: string[] = [];
    let cursor = stages[0];
    while (cursor && cursor.stageId !== targetStageId && !seen.has(cursor.stageId)) {
      seen.add(cursor.stageId);
      prior.push(cursor.stageId);
      // 분기 조건 평가
      let nextIds = cursor.nextStageIds;
      if (cursor.nextStageConditions) {
        for (const cond of cursor.nextStageConditions) {
          if (decisions.category === cond.matchValue) {
            nextIds = cond.stageIds;
            break;
          }
        }
      }
      const next = nextIds.map((id) => stageById.get(id)).find(Boolean);
      if (!next) break;
      cursor = next;
    }
    return cursor?.stageId === targetStageId ? prior : [];
  }

  const stages: Stage[] = [
    { stageId: "industry-selection", nextStageIds: ["budget-setup"] },
    {
      stageId: "budget-setup",
      nextStageIds: ["permit-check"],
      nextStageConditions: [
        { matchValue: "online-digital", stageIds: ["platform-setup"] },
        { matchValue: "startup-tech", stageIds: ["startup-foundation"] },
      ],
    },
    { stageId: "permit-check", nextStageIds: ["contract-review"] },
    { stageId: "contract-review", nextStageIds: ["biz-registration"] },
    { stageId: "platform-setup", nextStageIds: ["online-registration"] },
    { stageId: "online-registration", nextStageIds: ["biz-registration"] },
    { stageId: "startup-foundation", nextStageIds: ["mvp-build"] },
    { stageId: "mvp-build", nextStageIds: ["biz-registration"] },
    { stageId: "biz-registration", nextStageIds: [] },
  ];

  it("online 사용자가 biz-registration 완료 시 startup-foundation/mvp-build 가 backfill 되지 않는다", () => {
    const prior = traversePriorPath(stages, "biz-registration", { category: "online-digital" });
    expect(prior).toEqual(["industry-selection", "budget-setup", "platform-setup", "online-registration"]);
    expect(prior).not.toContain("startup-foundation");
    expect(prior).not.toContain("mvp-build");
    expect(prior).not.toContain("permit-check");
  });

  it("startup-tech 사용자가 biz-registration 완료 시 permit-check/contract-review 가 backfill 되지 않는다", () => {
    const prior = traversePriorPath(stages, "biz-registration", { category: "startup-tech" });
    expect(prior).toEqual(["industry-selection", "budget-setup", "startup-foundation", "mvp-build"]);
    expect(prior).not.toContain("permit-check");
    expect(prior).not.toContain("contract-review");
    expect(prior).not.toContain("platform-setup");
  });

  it("offline (default) 사용자는 permit-check / contract-review path 를 따라간다", () => {
    const prior = traversePriorPath(stages, "biz-registration", {});
    expect(prior).toEqual(["industry-selection", "budget-setup", "permit-check", "contract-review"]);
    expect(prior).not.toContain("startup-foundation");
    expect(prior).not.toContain("platform-setup");
  });
});
