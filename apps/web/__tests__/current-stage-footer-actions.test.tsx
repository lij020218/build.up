import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContractReviewStageFooter } from "../app/lib/components/surfaces/ContractReviewStageFooter";
import { GenericTaskStageFooter } from "../app/lib/components/surfaces/GenericTaskStageFooter";

const dashboardMock = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock("../app/lib/contexts/DashboardContext", () => ({
  useDashboardCtx: () => dashboardMock.value,
}));

describe("current stage footer actions", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    dashboardMock.value = createDashboardContext();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  function createDashboardContext(overrides: Record<string, unknown> = {}) {
    return {
      copy: { common: { resetDemo: "초기화" } },
      decisions: {},
      editSaveStatus: null,
      handleContractContinue: vi.fn(),
      handleLaunchBusiness: vi.fn(),
      handleStageContinue: vi.fn(),
      handleStageEdit: vi.fn(),
      industryCategoryId: "food",
      language: "ko",
      persistCurrentState: vi.fn().mockResolvedValue(undefined),
      resetDemo: vi.fn(),
      saveStatus: "idle",
      setSaveStatus: vi.fn(),
      ...overrides,
    };
  }

  function renderGenericFooter({
    allDone = true,
    footerMode = "task_continue",
    isViewingPastStage = false,
    stageLockedContent = React.createElement("button", { type: "button" }, "다음 페이지"),
  }: Partial<React.ComponentProps<typeof GenericTaskStageFooter>> = {}) {
    const onBack = vi.fn();

    act(() => {
      root.render(
        React.createElement(GenericTaskStageFooter, {
          allDone,
          footerMode,
          isViewingPastStage,
          onBack,
          stageId: "operations-setup",
          stageLockedContent,
        }),
      );
    });

    return { onBack };
  }

  function renderContractFooter({
    canContinue = true,
    hasMoreReadingPages = false,
  }: {
    canContinue?: boolean;
    hasMoreReadingPages?: boolean;
  } = {}) {
    const onBack = vi.fn();

    act(() => {
      root.render(
        React.createElement(ContractReviewStageFooter, {
          gateState: {
            allClausesDone: canContinue,
            canContinue,
            clauseIds: [
              "rent",
              "deposit",
              "term",
              "renewal",
              "repair",
              "restoration",
              "transfer",
              "penalty",
              "special",
            ],
            doneCount: canContinue ? 9 : 0,
            signed: canContinue,
            totalCount: 9,
          },
          hasMoreReadingPages,
          onBack,
          stageLockedContent: React.createElement("button", { type: "button" }, "다음 페이지"),
        }),
      );
    });

    return { onBack };
  }

  function findButton(label: string): HTMLButtonElement {
    const button = Array.from(container.querySelectorAll("button")).find(
      (item) => item.textContent === label,
    );
    if (!button) throw new Error(`Button not found: ${label}`);
    return button;
  }

  it("calls the generic stage continue action only from the enabled continue button", () => {
    renderGenericFooter();

    expect(dashboardMock.value.handleStageContinue).not.toHaveBeenCalled();

    act(() => {
      findButton("다음 단계로").click();
    });

    expect(dashboardMock.value.handleStageContinue).toHaveBeenCalledTimes(1);
    expect(dashboardMock.value.handleStageContinue).toHaveBeenCalledWith("operations-setup");
  });

  it("does not call generic stage continue while the task gate is incomplete", () => {
    renderGenericFooter({ allDone: false });
    const continueButton = findButton("다음 단계로");

    expect(continueButton.disabled).toBe(true);

    act(() => {
      continueButton.click();
    });

    expect(dashboardMock.value.handleStageContinue).not.toHaveBeenCalled();
  });

  it("keeps generic stage actions locked while reading pages remain", () => {
    renderGenericFooter({ footerMode: "page_locked" });

    expect(container.textContent).toContain("다음 페이지");
    expect(container.textContent).not.toContain("다음 단계로");
    expect(dashboardMock.value.handleStageContinue).not.toHaveBeenCalled();

    act(() => {
      findButton("다음 페이지").click();
    });

    expect(dashboardMock.value.handleStageContinue).not.toHaveBeenCalled();
    expect(dashboardMock.value.handleLaunchBusiness).not.toHaveBeenCalled();
  });

  it("calls contract continue only from the enabled contract button", () => {
    renderContractFooter();

    expect(dashboardMock.value.handleContractContinue).not.toHaveBeenCalled();

    act(() => {
      findButton("계약 검토 완료 — 다음 단계로").click();
    });

    expect(dashboardMock.value.handleContractContinue).toHaveBeenCalledTimes(1);
  });

  it("does not call contract continue while the contract gate is incomplete", () => {
    renderContractFooter({ canContinue: false });
    const disabledButton = findButton("↑ 9대 핵심 조항 0/9");

    expect(disabledButton.disabled).toBe(true);

    act(() => {
      disabledButton.click();
    });

    expect(dashboardMock.value.handleContractContinue).not.toHaveBeenCalled();
  });

  it("does not call contract continue while reading pages remain", () => {
    renderContractFooter({ hasMoreReadingPages: true });

    expect(container.textContent).toContain("다음 페이지");
    expect(container.textContent).not.toContain("계약 검토 완료 — 다음 단계로");

    act(() => {
      findButton("다음 페이지").click();
    });

    expect(dashboardMock.value.handleContractContinue).not.toHaveBeenCalled();
  });
});
