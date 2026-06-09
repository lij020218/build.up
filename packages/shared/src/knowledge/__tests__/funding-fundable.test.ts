import { describe, it, expect } from "vitest";
import { isFundableProgram, detectRubric } from "../funding-evaluation-criteria";

describe("isFundableProgram — 점수·유리점 노출 게이팅", () => {
  it("자금지원형 → true", () => {
    expect(isFundableProgram("예비창업패키지")).toBe(true);
    expect(isFundableProgram("청년창업사관학교")).toBe(true);
    expect(isFundableProgram("초기창업패키지 사업화 지원")).toBe(true);
    expect(isFundableProgram("소상공인 정책자금")).toBe(true);
    expect(isFundableProgram("TIPS 프로그램")).toBe(true);
  });
  it("정보·참가·인프라형 → false (라이브 K-Startup 분야값 포함)", () => {
    expect(isFundableProgram("2026 창업보육센터 입주기업 수출상담회", undefined)).toBe(false);
    expect(isFundableProgram("스타트업 글로벌 캠퍼스 과정", "멘토링ㆍ컨설팅ㆍ교육")).toBe(false);
    expect(isFundableProgram("청년 1인 창업지원실 입주자 모집", "시설ㆍ공간ㆍ보육")).toBe(false);
    expect(isFundableProgram("내 아이디어로 창업 가능할까?", "창업교육")).toBe(false);
    expect(isFundableProgram("ChinaJoy B2B 참가기업", "판로ㆍ해외진출")).toBe(false);
  });
  it("detectRubric 은 자금지원형에서 적절 루브릭", () => {
    expect(detectRubric("TIPS 일반").framework).toBe("tips");
    expect(detectRubric("소상공인 정책자금").framework).toBe("policy-loan");
    expect(detectRubric("예비창업패키지").framework).toBe("psst");
  });
});
