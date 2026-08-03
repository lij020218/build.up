/**
 * 결정론 점수 엔진 경계값 테스트 (measured-v1)
 *  — 밴드는 구 SCORING_SYSTEM_PROMPT 이식본. 여기 값이 바뀌면 점수 분포가 바뀐다 (의도 확인 필수).
 */
import { describe, it, expect } from "vitest";
import { scoreCandidateDeterministic, type ScoreInput } from "../app/api/_lib/market-scoring";

const baseInput: ScoreInput = { categoryId: "food", cafeCount: 8, subwayCount: 0, cultureCount: 1 };

function scoreOf(partial: Partial<ScoreInput>): number {
  return scoreCandidateDeterministic({ ...baseInput, ...partial }).score;
}
function axisDelta(partial: Partial<ScoreInput>, axis: string): number {
  const r = scoreCandidateDeterministic({ ...baseInput, ...partial });
  return r.axes.find((a) => a.axis === axis)!.delta;
}

describe("경쟁 밴드 — 공식(소진공) 소스", () => {
  const table: Array<[number, number]> = [
    [0, -10], [5, -10], [6, 10], [30, 10], [31, 5], [70, 5], [71, -12], [120, -12], [121, -20],
  ];
  it.each(table)("공식 %i개 → %i", (n, expected) => {
    expect(axisDelta({ officialSameCount: n }, "competition")).toBe(expected);
  });
  it("공식 0~5개는 수요 미검증 강제 경고", () => {
    const r = scoreCandidateDeterministic({ ...baseInput, officialSameCount: 3 });
    expect(r.mandatoryWarnings.some((w) => w.includes("수요가 검증되지"))).toBe(true);
  });
});

describe("경쟁 밴드 — 지도(카카오) 폴백", () => {
  const table: Array<[number, number]> = [
    [0, -10], [3, -10], [4, 10], [15, 10], [16, 5], [35, 5], [36, -12], [60, -12], [61, -20],
  ];
  it.each(table)("지도 %i개 → %i", (n, expected) => {
    expect(axisDelta({ officialSameCount: null, competitionCount: n }, "competition")).toBe(expected);
  });
});

describe("유동·접근·앵커", () => {
  it("카페 30+ → +10 / 10~29 → +5 / 0~4 → -7+경고", () => {
    expect(axisDelta({ cafeCount: 30 }, "foot")).toBe(10);
    expect(axisDelta({ cafeCount: 10 }, "foot")).toBe(5);
    expect(axisDelta({ cafeCount: 9 }, "foot")).toBe(0);
    const r = scoreCandidateDeterministic({ ...baseInput, cafeCount: 4 });
    expect(r.axes.find((a) => a.axis === "foot")!.delta).toBe(-7);
    expect(r.mandatoryWarnings.some((w) => w.includes("유동 신호가 약해"))).toBe(true);
  });
  it("지하철 1+ → +5, 문화 5+ → +5, 문화 0+앵커의존 → -3", () => {
    expect(axisDelta({ subwayCount: 1 }, "access")).toBe(5);
    expect(axisDelta({ cultureCount: 5 }, "anchor")).toBe(5);
    expect(axisDelta({ cultureCount: 0, categoryId: "cafe" }, "anchor")).toBe(-3);
    expect(axisDelta({ cultureCount: 0, categoryId: "food" }, "anchor")).toBe(0);
  });
});

describe("프랜차이즈 — 강제 경고는 LLM이 못 지운다", () => {
  it("sameBrand 1+ → -15 + warnings 선두", () => {
    const r = scoreCandidateDeterministic({
      ...baseInput,
      franchise: { sameBrand: 2, peers: [] },
    });
    expect(r.axes.find((a) => a.axis === "franchise")!.delta).toBe(-15);
    expect(r.mandatoryWarnings[0]).toContain("영업지역 보호");
    expect(r.mandatoryWarnings[0]).toContain("2개");
  });
  it("peers 합 5+ → -7 (브랜드명 인용) / 실측 없음 → delta 0·measured false", () => {
    const r = scoreCandidateDeterministic({
      ...baseInput,
      franchise: { sameBrand: 0, peers: [{ name: "A", count: 3 }, { name: "B", count: 2 }] },
    });
    const ax = r.axes.find((a) => a.axis === "franchise")!;
    expect(ax.delta).toBe(-7);
    expect(ax.evidence).toContain("A 3");
    const none = scoreCandidateDeterministic(baseInput).axes.find((a) => a.axis === "franchise")!;
    expect(none.delta).toBe(0);
    expect(none.measured).toBe(false);
  });
});

describe("공실·인구·복합·clamp", () => {
  it("공실 8%+ → -5+경고, 실측 없음 → 0", () => {
    const r = scoreCandidateDeterministic({ ...baseInput, vacancyPct: 8 });
    expect(r.axes.find((a) => a.axis === "vacancy")!.delta).toBe(-5);
    expect(r.mandatoryWarnings.some((w) => w.includes("공실률 8%"))).toBe(true);
    expect(axisDelta({ vacancyPct: 7.9 }, "vacancy")).toBe(0);
    expect(axisDelta({}, "vacancy")).toBe(0);
  });
  it("인구 — 젊은층 타깃 ±3, 비타깃 업종은 0 (과잉 판정 금지)", () => {
    expect(axisDelta({ categoryId: "cafe", population: { age2030Pct: 30, age40PlusPct: 40 } }, "population")).toBe(3);
    expect(axisDelta({ categoryId: "cafe", population: { age2030Pct: 19, age40PlusPct: 40 } }, "population")).toBe(-3);
    expect(axisDelta({ categoryId: "food", population: { age2030Pct: 35, age40PlusPct: 40 } }, "population")).toBe(0);
    expect(axisDelta({ categoryId: "cafe" }, "population")).toBe(0); // 결측 = 중립
  });
  it("레드오션 ∧ 카페<5 → 복합 -8", () => {
    const r = scoreCandidateDeterministic({ ...baseInput, officialSameCount: 130, cafeCount: 4 });
    expect(r.axes.find((a) => a.axis === "compound")!.delta).toBe(-8);
    // 60 -20(경쟁) -7(유동) -8(복합) = 25
    expect(r.score).toBe(25);
  });
  it("clamp 0~100 + breakdown에 기준·출처 포함", () => {
    const worst = scoreCandidateDeterministic({
      categoryId: "cafe", officialSameCount: 200, cafeCount: 0, subwayCount: 0, cultureCount: 0,
      franchise: { sameBrand: 3, peers: [] }, vacancyPct: 12,
      population: { age2030Pct: 10, age40PlusPct: 60 },
    });
    expect(worst.score).toBeGreaterThanOrEqual(0);
    expect(worst.breakdown).toContain("기준 60");
    expect(worst.breakdown).toContain("소진공");
  });
  it("결측 축은 delta 0 불변식 — measured=false면 가감 없음", () => {
    const r = scoreCandidateDeterministic(baseInput);
    for (const a of r.axes) {
      if (!a.measured) expect(a.delta).toBe(0);
    }
  });
});
