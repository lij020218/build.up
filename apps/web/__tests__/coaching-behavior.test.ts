import { describe, it, expect } from "vitest";
import { formatBehaviorBlock } from "../app/api/_lib/coaching-behavior";

/**
 * 행동 루프 블록 가드 (2026-08-01).
 *  브리핑이 "실행한 조언은 심화, 무시된 조언은 반복 금지"를 하려면
 *  이 블록의 정직성 경계가 지켜져야 한다.
 */

const row = (headline: string, taken: boolean | null) => ({
  signal_headline: headline,
  signal_kind: "important",
  response_taken: taken,
});

describe("formatBehaviorBlock", () => {
  it("응답 3건 미만이면 빈 문자열 — 2건으로 '패턴'을 단정하지 않는다", () => {
    expect(formatBehaviorBlock([row("a", true), row("b", false)])).toBe("");
    expect(formatBehaviorBlock([])).toBe("");
  });

  it("🔴 미응답(null)은 '무시'로 세지 않는다 — 안 본 것과 안 한 것은 다르다", () => {
    const block = formatBehaviorBlock([
      row("실행한 것", true), row("실행한 것2", true), row("실행한 것3", true),
      row("미응답1", null), row("미응답2", null),
    ]);
    expect(block).toContain("응답한 코칭 3건 중 실행 100%");
    expect(block).not.toContain("미응답1");   // 무시 목록에 없어야 함
    expect(block).not.toContain("반복 금지 —"); // 무시 항목 자체가 없으면 그 줄 생략
  });

  it("실행·무시가 각각 올바른 줄에 들어간다", () => {
    const block = formatBehaviorBlock([
      row("리뷰 답변 3건 달기", true),
      row("인스타 릴스 올리기", false),
      row("원가율 점검", true),
      row("전단지 돌리기", false),
    ]);
    expect(block).toContain("실행 50%");
    expect(block).toMatch(/실행한 조언.*리뷰 답변 3건 달기/);
    expect(block).toMatch(/실행한 조언.*원가율 점검/);
    expect(block).toMatch(/안 한 조언.*인스타 릴스 올리기/);
    expect(block).toMatch(/안 한 조언.*전단지 돌리기/);
  });

  it("효과 판단 어휘 없음 — 앱이 아는 건 체크 여부뿐", () => {
    const block = formatBehaviorBlock([row("a", true), row("b", true), row("c", false)]);
    expect(block).not.toMatch(/효과|성공|성과가/);
  });

  it("헤드라인 40자 절단 + 각 목록 3건 상한 (프롬프트 비대 방지)", () => {
    const long = "아".repeat(80);
    const rows = [row(long, true), row("b", true), row("c", true), row("d", true), row("e", true)];
    const block = formatBehaviorBlock(rows);
    expect(block).toContain("아".repeat(40));
    expect(block).not.toContain("아".repeat(41));
    expect((block.match(/"/g) ?? []).length).toBe(6); // 따옴표 3쌍 = 3건
  });
});
