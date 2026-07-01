import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuideVerificationFooter } from "../app/lib/components/surfaces/GuideVerificationFooter";

describe("GuideVerificationFooter", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  function renderFooter({
    ready,
    hasMoreReadingPages = false,
    onConfirm = vi.fn(),
    onBack = vi.fn(),
  }: {
    ready: boolean;
    hasMoreReadingPages?: boolean;
    onConfirm?: () => void;
    onBack?: () => void;
  }) {
    act(() => {
      root.render(
        React.createElement(GuideVerificationFooter, {
          language: "ko",
          hasMoreReadingPages,
          lockedContent: React.createElement("button", { type: "button" }, "다음 페이지"),
          ready,
          title: ready ? undefined : "먼저 체크",
          label: ready ? "검토 완료" : "아직 잠김",
          onBack,
          onConfirm,
        }),
      );
    });

    return { onConfirm, onBack };
  }

  it("does not call onConfirm when the verification gate is not ready", () => {
    const { onConfirm } = renderFooter({ ready: false });
    const confirmButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "아직 잠김",
    );

    expect(confirmButton).toBeTruthy();
    expect(confirmButton?.disabled).toBe(true);

    act(() => {
      confirmButton?.click();
    });

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm only from the ready verification button", () => {
    const { onConfirm, onBack } = renderFooter({ ready: true });

    act(() => {
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent === "검토 완료")
        ?.click();
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();
  });

  it("renders locked page content instead of the verification button while pages remain", () => {
    const { onConfirm } = renderFooter({ ready: true, hasMoreReadingPages: true });

    expect(container.textContent).toContain("다음 페이지");
    expect(container.textContent).not.toContain("검토 완료");

    act(() => {
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent === "다음 페이지")
        ?.click();
    });

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
