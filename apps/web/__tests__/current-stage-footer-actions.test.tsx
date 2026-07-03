import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContractReviewStageFooter } from "../app/lib/components/surfaces/ContractReviewStageFooter";
import { GenericTaskStageFooter } from "../app/lib/components/surfaces/GenericTaskStageFooter";

describe("current stage footer actions", () => {
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

  function createGenericFooterProps(
    overrides: Partial<React.ComponentProps<typeof GenericTaskStageFooter>> = {},
  ): React.ComponentProps<typeof GenericTaskStageFooter> {
    return {
      allDone: true,
      editStatus: null,
      footerMode: "task_continue",
      industryCategoryId: "food",
      isStageCompleted: false,
      language: "ko",
      onBack: vi.fn(),
      onContinueStage: vi.fn(),
      onEditStage: vi.fn(),
      onLaunchBusiness: vi.fn(),
      onPersistCurrentState: vi.fn().mockResolvedValue(undefined),
      onReset: vi.fn(),
      onSetSaveStatus: vi.fn(),
      resetLabel: "초기화",
      saveStatus: "idle",
      stageId: "operations-setup",
      stageLockedContent: React.createElement("button", { type: "button" }, "다음 페이지"),
      ...overrides,
    };
  }

  function renderGenericFooter(
    overrides: Partial<React.ComponentProps<typeof GenericTaskStageFooter>> = {},
  ) {
    const props = createGenericFooterProps(overrides);

    act(() => {
      root.render(
        React.createElement(GenericTaskStageFooter, props),
      );
    });

    return props;
  }

  function createContractFooterProps({
    canContinue = true,
    hasMoreReadingPages = false,
  }: {
    canContinue?: boolean;
    hasMoreReadingPages?: boolean;
  } = {}): React.ComponentProps<typeof ContractReviewStageFooter> {
    return {
      editStatus: null,
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
      isStageCompleted: false,
      language: "ko",
      onBack: vi.fn(),
      onContinue: vi.fn(),
      onEdit: vi.fn(),
      onReset: vi.fn(),
      resetLabel: "초기화",
      stageLockedContent: React.createElement("button", { type: "button" }, "다음 페이지"),
    };
  }

  function renderContractFooter(options: {
    canContinue?: boolean;
    hasMoreReadingPages?: boolean;
  } = {}) {
    const props = createContractFooterProps(options);

    act(() => {
      root.render(
        React.createElement(ContractReviewStageFooter, props),
      );
    });

    return props;
  }

  function findButton(label: string): HTMLButtonElement {
    const button = Array.from(container.querySelectorAll("button")).find(
      (item) => item.textContent === label,
    );
    if (!button) throw new Error(`Button not found: ${label}`);
    return button;
  }

  it("calls the generic stage continue action only from the enabled continue button", () => {
    const props = renderGenericFooter();

    expect(props.onContinueStage).not.toHaveBeenCalled();

    act(() => {
      findButton("다음 단계로").click();
    });

    expect(props.onContinueStage).toHaveBeenCalledTimes(1);
    expect(props.onContinueStage).toHaveBeenCalledWith("operations-setup");
  });

  it("does not call generic stage continue while the task gate is incomplete", () => {
    const props = renderGenericFooter({ allDone: false });
    const continueButton = findButton("다음 단계로");

    expect(continueButton.disabled).toBe(true);

    act(() => {
      continueButton.click();
    });

    expect(props.onContinueStage).not.toHaveBeenCalled();
  });

  it("keeps generic stage actions locked while reading pages remain", () => {
    const props = renderGenericFooter({ footerMode: "page_locked" });

    expect(container.textContent).toContain("다음 페이지");
    expect(container.textContent).not.toContain("다음 단계로");
    expect(props.onContinueStage).not.toHaveBeenCalled();

    act(() => {
      findButton("다음 페이지").click();
    });

    expect(props.onContinueStage).not.toHaveBeenCalled();
    expect(props.onLaunchBusiness).not.toHaveBeenCalled();
  });

  it("does not call generic launch actions while final tasks are incomplete", () => {
    const props = renderGenericFooter({
      allDone: false,
      footerMode: "launch",
      stageId: "pre-launch-final",
    });
    const launchButton = findButton("🚀 개업하기");

    expect(launchButton.disabled).toBe(true);

    act(() => {
      launchButton.click();
    });

    expect(props.onContinueStage).not.toHaveBeenCalled();
    expect(props.onLaunchBusiness).not.toHaveBeenCalled();
  });

  it("does not persist completed-stage edits while a save is already running", () => {
    const props = renderGenericFooter({
      footerMode: "save_completed",
      saveStatus: "saving",
    });
    const saveButton = findButton("저장 중…");

    expect(saveButton.disabled).toBe(true);

    act(() => {
      saveButton.click();
    });

    expect(props.onPersistCurrentState).not.toHaveBeenCalled();
    expect(props.onSetSaveStatus).not.toHaveBeenCalled();
  });

  it("calls contract continue only from the enabled contract button", () => {
    const props = renderContractFooter();

    expect(props.onContinue).not.toHaveBeenCalled();

    act(() => {
      findButton("계약 검토 완료 — 다음 단계로").click();
    });

    expect(props.onContinue).toHaveBeenCalledTimes(1);
  });

  it("does not call contract continue while the contract gate is incomplete", () => {
    const props = renderContractFooter({ canContinue: false });
    const disabledButton = findButton("↑ 9대 핵심 조항 0/9");

    expect(disabledButton.disabled).toBe(true);

    act(() => {
      disabledButton.click();
    });

    expect(props.onContinue).not.toHaveBeenCalled();
  });

  it("disables completed contract edit while the contract gate is incomplete", () => {
    const props = renderContractFooter({ canContinue: false });

    act(() => {
      root.render(
        React.createElement(ContractReviewStageFooter, {
          ...props,
          isStageCompleted: true,
        }),
      );
    });

    const editButton = findButton("✓ 수정 저장");

    expect(editButton.disabled).toBe(true);

    act(() => {
      editButton.click();
    });

    expect(props.onEdit).not.toHaveBeenCalled();
  });

  it("does not call contract continue while reading pages remain", () => {
    const props = renderContractFooter({ hasMoreReadingPages: true });

    expect(container.textContent).toContain("다음 페이지");
    expect(container.textContent).not.toContain("계약 검토 완료 — 다음 단계로");

    act(() => {
      findButton("다음 페이지").click();
    });

    expect(props.onContinue).not.toHaveBeenCalled();
  });
});
