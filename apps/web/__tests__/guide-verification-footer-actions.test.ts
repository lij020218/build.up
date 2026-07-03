import { describe, expect, it, vi } from "vitest";
import { runGuideVerificationConfirmAction } from "../app/lib/components/surfaces/guide-verification-footer-actions";

describe("guide verification footer actions", () => {
  it("does not confirm while the verification gate is not ready", () => {
    const onConfirm = vi.fn();

    runGuideVerificationConfirmAction({
      onConfirm,
      ready: false,
    });

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("confirms only when the verification gate is ready", () => {
    const onConfirm = vi.fn();

    runGuideVerificationConfirmAction({
      onConfirm,
      ready: true,
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
