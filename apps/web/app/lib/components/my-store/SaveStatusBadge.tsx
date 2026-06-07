"use client";

/**
 * SaveStatusBadge — 페이지 상단 sticky 저장 상태 표시.
 * persistStatus 를 그대로 노출해서 사장이 "저장됐나?" 즉시 확인.
 *
 * idle (변경 0)  → "최신 상태"
 * saving        → "저장 중" (스피너)
 * saved         → "저장됨" (체크)
 * error         → "저장 실패" — 클릭하면 실제 에러 메시지 펼침
 */

import { useState } from "react";
import { CheckCircle2, Loader2, AlertCircle, Cloud, X, RefreshCw } from "lucide-react";
import { PALETTE } from "./styles";
import { resetCircuit } from "../../services/save-circuit-breaker";

type Props = {
  ko: boolean;
  status: "idle" | "saving" | "saved" | "error" | undefined;
  lastSavedAt?: string | null;
  /** 에러 시 실제 메시지 (예: "column does not exist") — 마이그레이션 미적용 같은 진짜 원인 노출 */
  errorMessage?: string | null;
};

export function SaveStatusBadge({ ko, status, lastSavedAt, errorMessage }: Props) {
  const s = status ?? "idle";
  const [open, setOpen] = useState(false);

  const palette = (() => {
    if (s === "saving") return { bg: "rgba(25,25,112,0.08)", color: PALETTE.MIDNIGHT, label: ko ? "Supabase 저장 중" : "Saving to Supabase" };
    if (s === "saved")  return { bg: "rgba(52,199,89,0.10)", color: "#1d3557",            label: ko ? "저장됨" : "Saved" };
    if (s === "error")  return { bg: "rgba(182,76,76,0.10)", color: "#b32419",            label: ko ? "저장 실패" : "Save failed" };
    return { bg: "rgba(25,25,112,0.04)", color: PALETTE.MIDNIGHT, label: ko ? "최신 상태" : "Up to date" };
  })();

  const Icon = s === "saving" ? Loader2 : s === "error" ? AlertCircle : s === "saved" ? CheckCircle2 : Cloud;
  const isMigrationError = !!errorMessage && /column|relation|does not exist|schema cache/i.test(errorMessage);

  return (
    <div style={{ position: "relative" as const, display: "inline-block" }}>
      <button
        type="button"
        onClick={() => s === "error" && setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center" as const,
          gap: 6,
          padding: "6px 12px",
          borderRadius: 999,
          background: palette.bg,
          color: palette.color,
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: "-0.005em",
          whiteSpace: "nowrap" as const,
          border: `1px solid ${PALETTE.MIDNIGHT_BORDER}`,
          cursor: s === "error" ? "pointer" : "default",
          fontFamily: "inherit",
        }}
      >
        <Icon
          size={12}
          strokeWidth={1.5}
          strokeLinecap="round"
          className={s === "saving" ? "save-status-spin" : undefined}
        />
        {palette.label}
        {s === "saved" && lastSavedAt && (
          <span style={{ fontWeight: 500, color: PALETTE.HINT, marginLeft: 2, fontVariantNumeric: "tabular-nums" as const }}>
            {fmtTime(lastSavedAt, ko)}
          </span>
        )}
        {s === "error" && (
          <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.7, marginLeft: 2 }}>
            {open ? "▲" : "▼"}
          </span>
        )}
      </button>

      {open && s === "error" && (
        <div style={{
          position: "absolute" as const,
          top: "calc(100% + 6px)",
          right: 0,
          minWidth: 320,
          maxWidth: 460,
          padding: "12px 14px",
          background: "white",
          border: "1px solid rgba(182,76,76,0.30)",
          borderRadius: 12,
          boxShadow: "0 12px 32px rgba(25,25,112,0.14)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column" as const,
          gap: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#b32419", letterSpacing: "-0.01em" }}>
              {ko ? "저장 실패 원인" : "Failure reason"}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ border: "none", background: "transparent", cursor: "pointer", color: PALETTE.MUTED, padding: 0, lineHeight: 1 }}
              aria-label={ko ? "닫기" : "Close"}
            >
              <X size={12} strokeWidth={1.5} />
            </button>
          </div>
          {errorMessage && (
            <div style={{
              fontSize: 11,
              fontFamily: "ui-monospace, Menlo, monospace",
              color: PALETTE.INK,
              background: "rgba(182,76,76,0.04)",
              padding: "8px 10px",
              borderRadius: 8,
              wordBreak: "break-word" as const,
              lineHeight: 1.5,
            }}>
              {errorMessage}
            </div>
          )}
          {isMigrationError && (
            <div style={{
              fontSize: 11.5,
              color: PALETTE.INK,
              background: "rgba(25,25,112,0.04)",
              padding: "10px 12px",
              borderRadius: 8,
              lineHeight: 1.6,
              fontWeight: 500,
            }}>
              {ko ? (
                <>
                  <strong style={{ color: PALETTE.MIDNIGHT }}>마이그레이션 미적용</strong>이 원인입니다. 터미널에서 실행:
                  <pre style={{ margin: "6px 0", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, padding: "6px 8px", background: "rgba(25,25,112,0.06)", borderRadius: 6 }}>
{`pnpm supabase db push`}
                  </pre>
                  적용된 후 아래 버튼으로 재시도하세요 (자동 저장은 회로가 차단된 상태):
                </>
              ) : (
                <>
                  Likely cause: <strong>migration not applied</strong>. Run in terminal:
                  <pre style={{ margin: "6px 0", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, padding: "6px 8px", background: "rgba(25,25,112,0.06)", borderRadius: 6 }}>
{`pnpm supabase db push`}
                  </pre>
                  Then retry below (auto-save is currently circuit-broken):
                </>
              )}
            </div>
          )}
          {/* 모든 error 케이스에서 수동 재시도 — circuit breaker reset */}
          <button
            type="button"
            onClick={() => {
              resetCircuit();
              setOpen(false);
            }}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "8px 14px",
              borderRadius: 10,
              border: "none",
              background: PALETTE.MIDNIGHT,
              color: "white",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              alignSelf: "flex-start" as const,
            }}
          >
            <RefreshCw size={12} strokeWidth={1.5} />
            {ko ? "회로 리셋 + 재시도" : "Reset circuit + retry"}
          </button>
        </div>
      )}

      <style jsx>{`
        :global(.save-status-spin) { animation: ssbs-rot 0.8s linear infinite; }
        @keyframes ssbs-rot { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function fmtTime(iso: string, ko: boolean): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const fmt = new Intl.DateTimeFormat(ko ? "ko-KR" : "en-US", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return fmt.format(d);
  } catch { return ""; }
}
