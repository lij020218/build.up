import { describe, it, expect } from "vitest";
import { isExistingBusinessRegistration, readSetupMeta, SETUP_META_KEY } from "../app/lib/setup-missions";

/**
 * 가게 세팅 미션 노출 판정 가드 —
 *   "로드맵·AI 로드맵 진행자에게 보이면 안 된다" (2026-07-28 사장님 지시)를 테스트로 고정.
 */

const at = (t: string) => ({ completedAt: t });

describe("isExistingBusinessRegistration", () => {
  it("마커(path=existing)가 있으면 항상 true", () => {
    expect(isExistingBusinessRegistration({ path: "existing" }, {})).toBe(true);
  });

  it("기존 등록 구유저 — 전 스테이지 동일 타임스탬프(20개) → true", () => {
    const now = "2026-07-01T09:00:00.000Z";
    const decisions = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`stage-${i}`, at(now)]));
    expect(isExistingBusinessRegistration(null, decisions)).toBe(true);
  });

  it("AI 위저드 유저 — prefill 8개만 동일 타임스탬프 → false (오노출 금지)", () => {
    const now = "2026-07-01T09:00:00.000Z";
    const decisions = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`stage-${i}`, at(now)]));
    expect(isExistingBusinessRegistration(null, decisions)).toBe(false);
  });

  it("로드맵 실완주 유저 — 22개 전부 다른 시각 완료 → false (오노출 금지)", () => {
    const decisions = Object.fromEntries(
      Array.from({ length: 22 }, (_, i) => [`stage-${i}`, at(`2026-06-${String((i % 28) + 1).padStart(2, "0")}T09:0${i % 10}:00.000Z`)]),
    );
    expect(isExistingBusinessRegistration(null, decisions)).toBe(false);
  });

  it("decisions 없음 → false", () => {
    expect(isExistingBusinessRegistration(null, null)).toBe(false);
    expect(isExistingBusinessRegistration(null, {})).toBe(false);
  });
});

describe("readSetupMeta", () => {
  it("industrySpecifics 예약 키에서 읽는다", () => {
    expect(readSetupMeta({ [SETUP_META_KEY]: { path: "existing", dismissed: true } })).toEqual({ path: "existing", dismissed: true });
    expect(readSetupMeta({})).toBeNull();
    expect(readSetupMeta(null)).toBeNull();
  });
});
