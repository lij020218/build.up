import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AuthChannelPickerWidget, DocRequestDecoderWidget } from "../app/lib/components/stages/shared/CompliancePanels";

/**
 * 앱·플랫폼 규제·계약 도구(웹) 실렌더 — 게스트 /browse 는 interactive 를 잠그므로 여기서 동작을 검증.
 *  · 채널 선택기: 기본값(성별 필요·결제 없음) → 통합인증 '제외', 다날 '추천', 33만 원 경고·콘솔 경로 표시.
 *    '결제도 받음' 토글 → 경고·콘솔 경로 사라짐.
 *  · 서류 해석기: 메일 붙여넣기 → 인감증명서·실제소유자 카드 + 체크리스트.
 */
describe("CompliancePanels", () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("채널 선택기 — 기본 요건에서 통합인증 제외·다날 추천·카드 PG 함정 경고", () => {
    act(() => { root.render(<AuthChannelPickerWidget ko config={{ title: "선택기" }} />); });
    const text = container.textContent ?? "";
    expect(text).toContain("제외");
    expect(text).toContain("KG이니시스 통합인증");
    expect(text).toContain("추천");
    expect(text).toContain("월정액 50,000원 (1,200건 요금제)");
    expect(text).toContain("33만 원");
    expect(text).toContain("채널 속성");

    const payToggle = Array.from(container.querySelectorAll("button")).find((b) => b.textContent?.includes("결제(카드 등)도 같이 받음"))!;
    act(() => { payToggle.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    const after = container.textContent ?? "";
    expect(after).not.toContain("33만 원");
    expect(after).not.toContain("채널 속성");
  });

  it("서류 해석기 — 메일 본문에서 인감증명서·실제소유자 확인서를 찾아 체크리스트를 만든다", () => {
    act(() => { root.render(<DocRequestDecoderWidget ko config={{ title: "해석기" }} />); });
    const ta = container.querySelector("textarea") as HTMLTextAreaElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    act(() => {
      setter.call(ta, "사업자등록증 사본, 인감증명서(전자계약 시 생략), 고객정보 및 실제소유자 확인서 부탁드립니다");
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const text = container.textContent ?? "";
    expect(text).toContain("인감증명서");
    expect(text).toContain("주민센터");
    expect(text).toContain("고객정보 및 실제소유자 확인서");
    expect(text).toContain("자동 생성 준비 체크리스트");
    expect(text).toContain("전자계약이 언급됐습니다");
  });
});
