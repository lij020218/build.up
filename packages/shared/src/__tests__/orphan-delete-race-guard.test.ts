import { describe, expect, it } from "vitest";
import { ORPHAN_DELETE_GUARD_MS, recentlyTouchedKeys } from "../supabase/persistence";

/**
 * orphan 삭제 레이스 가드 (2026-06-10 P1-2) 검증.
 *
 *  배경: 웹 saveRoadmapState 의 "upsert + delete-orphans" 는 이번 payload 에 없는 stage_code/task_code
 *    row 를 orphan 으로 보고 삭제한다. 웹 realtime 재조회는 5초 throttle 이라, iOS 가 방금 새로 만든
 *    단계 row 를 웹 로컬 상태가 모르는 사이 그 단계를 orphan 으로 오인해 삭제 → iOS 진행 유실.
 *
 *  가드(recentlyTouchedKeys): 후보 row 의 updated_at 이 최근 N분(ORPHAN_DELETE_GUARD_MS) 내면 보존.
 *    - iOS 는 매 upsert 에 updated_at=now 를 명시 기록 → 최근 row = 다른 기기 쓰기 신호.
 *    - 웹 자신의 stage upsert 는 updated_at 을 건드리지 않으므로 오탐 없음.
 */
describe("recentlyTouchedKeys — orphan 삭제 레이스 가드", () => {
  const NOW = Date.UTC(2026, 5, 10, 12, 0, 0); // 고정 기준 시각

  const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();

  it("최근(가드 윈도우 내) 갱신된 row 는 보존 키로 분류된다 — iOS 방금 쓴 단계 보호", () => {
    const rows = [
      { stage_code: "permit-check", updated_at: iso(10_000) }, // 10초 전 — 다른 기기가 방금
      { stage_code: "biz-registration", updated_at: iso(30_000) }, // 30초 전
    ];
    const recent = recentlyTouchedKeys(rows, "stage_code", NOW);
    expect(recent.has("permit-check")).toBe(true);
    expect(recent.has("biz-registration")).toBe(true);
  });

  it("오래된 row(가드 윈도우 밖) 는 보존 대상이 아니다 — 진짜 orphan 은 정리된다", () => {
    const rows = [
      { stage_code: "old-stage", updated_at: iso(ORPHAN_DELETE_GUARD_MS + 60_000) }, // 윈도우+1분 전
      { stage_code: "ancient-stage", updated_at: iso(10 * 60 * 1000) }, // 10분 전
    ];
    const recent = recentlyTouchedKeys(rows, "stage_code", NOW);
    expect(recent.has("old-stage")).toBe(false);
    expect(recent.has("ancient-stage")).toBe(false);
  });

  it("가드 윈도우 정확히 경계: 미만은 보존, 이상은 삭제 허용", () => {
    const rows = [
      { stage_code: "just-inside", updated_at: iso(ORPHAN_DELETE_GUARD_MS - 1) },
      { stage_code: "exactly-edge", updated_at: iso(ORPHAN_DELETE_GUARD_MS) },
    ];
    const recent = recentlyTouchedKeys(rows, "stage_code", NOW);
    expect(recent.has("just-inside")).toBe(true);   // now-ts < window
    expect(recent.has("exactly-edge")).toBe(false); // now-ts === window → 삭제 허용
  });

  it("updated_at 누락/파싱불가 row 는 보수적으로 보존(데이터 유실 방지)", () => {
    const rows = [
      { stage_code: "no-updated-at" },
      { stage_code: "garbage-updated-at", updated_at: "not-a-date" },
      { stage_code: "null-updated-at", updated_at: null },
    ];
    const recent = recentlyTouchedKeys(rows, "stage_code", NOW);
    expect(recent.has("no-updated-at")).toBe(true);
    expect(recent.has("garbage-updated-at")).toBe(true);
    expect(recent.has("null-updated-at")).toBe(true);
  });

  it("task_code 키 필드로도 동작 (stage_tasks 경로)", () => {
    const rows = [
      { task_code: "recent-task", updated_at: iso(5_000) },
      { task_code: "stale-task", updated_at: iso(5 * 60 * 1000) },
    ];
    const recent = recentlyTouchedKeys(rows, "task_code", NOW);
    expect(recent.has("recent-task")).toBe(true);
    expect(recent.has("stale-task")).toBe(false);
  });

  it("키 필드가 string 이 아닌 row 는 무시(보존 집합에 안 들어감)", () => {
    const rows = [
      { stage_code: 123 as unknown as string, updated_at: iso(1_000) },
    ];
    const recent = recentlyTouchedKeys(rows, "stage_code", NOW);
    expect(recent.size).toBe(0);
  });

  /**
   * 시나리오 통합: 웹 autosave 가 [industry-selection, budget-setup] payload 로 저장하는 동안,
   * iOS 가 방금 [permit-check] 를 완료해 새 row 를 만들었다. 웹 로컬 상태엔 permit-check 가 없어
   * orphan 후보가 되지만, updated_at 이 최근이라 가드가 보호 → 삭제되지 않는다.
   * 반대로 사용자가 경로를 바꿔 더는 안 쓰는 old-path-stage(오래 전 갱신)는 정상 정리된다.
   */
  it("통합: iOS 방금 쓴 단계는 보존, 경로변경 옛 단계는 삭제 허용", () => {
    const keepCodes = new Set(["industry-selection", "budget-setup"]);
    const existingRows = [
      { stage_code: "industry-selection", updated_at: iso(0) }, // payload 에 포함 (keep)
      { stage_code: "budget-setup", updated_at: iso(0) },        // payload 에 포함 (keep)
      { stage_code: "permit-check", updated_at: iso(8_000) },    // iOS 가 8초 전에 새로 씀 → 보호
      { stage_code: "old-path-stage", updated_at: iso(20 * 60 * 1000) }, // 20분 전 진짜 orphan
    ];
    const recent = recentlyTouchedKeys(existingRows, "stage_code", NOW);
    const orphanCodes = existingRows
      .map((r) => r.stage_code)
      .filter((code) => !keepCodes.has(code) && !recent.has(code));

    expect(orphanCodes).toEqual(["old-path-stage"]);
    expect(orphanCodes).not.toContain("permit-check");
  });
});
