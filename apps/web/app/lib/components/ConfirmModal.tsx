"use client";

import { useEffect, useRef } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // ESC 닫기 + focus trap
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* 배경 블러 오버레이 */}
      <div
        aria-hidden="true"
        onClick={onCancel}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15,23,42,0.4)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* 모달 패널 */}
      <div
        style={{
          position: "relative",
          background: "var(--surface-strong)",
          borderRadius: "16px",
          padding: "28px 24px 20px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 24px 48px rgba(15,23,42,0.18), 0 1px 0 rgba(255,255,255,0.8) inset",
          border: "1px solid var(--border)",
        }}
      >
        <p
          id="confirm-modal-title"
          style={{
            margin: 0,
            marginBottom: "10px",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--text)",
            lineHeight: 1.4,
          }}
        >
          {title}
        </p>
        <p
          style={{
            margin: 0,
            marginBottom: "24px",
            fontSize: "14px",
            color: "var(--muted)",
            lineHeight: 1.65,
            whiteSpace: "pre-wrap",
          }}
        >
          {message}
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            style={{
              padding: "9px 18px",
              borderRadius: "8px",
              border: "1.5px solid var(--border)",
              background: "transparent",
              color: "var(--muted)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              minWidth: "80px",
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "9px 18px",
              borderRadius: "8px",
              border: "none",
              background: danger ? "var(--danger)" : "var(--primary)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              minWidth: "80px",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
