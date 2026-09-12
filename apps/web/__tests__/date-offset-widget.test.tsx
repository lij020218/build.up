import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DateOffsetWidget } from "../app/lib/components/stages/shared/StageContentRenderer";

/**
 * dateOffset 위젯(app-compliance) 실렌더 — 게스트 /browse 는 interactive 를 잠그므로 여기서 동작을 검증.
 *  · 위치정보법: 개시일 + 30일 = 신고 마감
 *  · 개정 고지: 시행일 - 7일 = 고지 마감 + noticeTemplate {{input}}/{{result}} 치환
 */
describe("DateOffsetWidget", () => {
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

  function setDate(value: string) {
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    act(() => {
      setter.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  it("D+30 — 서비스 개시일 2026-09-06 → 신고 마감 2026-10-06", () => {
    act(() => {
      root.render(
        <DateOffsetWidget ko config={{ title: "위치정보법", inputLabel: "서비스 개시일", offsetDays: 30, direction: "after", resultLabel: "신고 마감" }} />,
      );
    });
    expect(container.textContent).toContain("날짜를 고르면");
    setDate("2026-09-06");
    expect(container.textContent).toContain("2026-10-06 (화)");
  });

  it("7일 전 — 시행 예정일 2026-10-01 → 고지 마감 2026-09-24 + 고지 문구 치환", () => {
    act(() => {
      root.render(
        <DateOffsetWidget
          ko
          config={{
            title: "개정 고지", inputLabel: "개정 시행 예정일", offsetDays: 7, direction: "before", resultLabel: "고지 마감",
            noticeTemplate: "방침이 {{input}}부로 개정됩니다. {{result}}까지 게시.",
          }}
        />,
      );
    });
    setDate("2026-10-01");
    const text = container.textContent ?? "";
    expect(text).toContain("2026-09-24 (목)");
    expect(text).toContain("방침이 2026-10-01 (목)부로 개정됩니다. 2026-09-24 (목)까지 게시.");
  });
});
