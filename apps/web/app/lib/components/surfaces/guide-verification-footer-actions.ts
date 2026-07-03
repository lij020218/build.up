type ConfirmHandler = () => void;

export function runGuideVerificationConfirmAction({
  onConfirm,
  ready,
}: {
  onConfirm: ConfirmHandler;
  ready: boolean;
}) {
  if (!ready) {
    return;
  }

  onConfirm();
}
