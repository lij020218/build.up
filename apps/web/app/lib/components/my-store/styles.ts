/**
 * 내 가게 — 공유 스타일 토큰.
 * Apple Settings + Linear + Stripe Sigma 톤. 미니멀, 회계 차분함, 사진/차트 강조.
 */

export const PALETTE = {
  MIDNIGHT: "#191970",
  MIDNIGHT_DEEP: "#0f0f4a",
  MIDNIGHT_4: "rgba(25,25,112,0.04)",
  MIDNIGHT_6: "rgba(25,25,112,0.06)",
  MIDNIGHT_8: "rgba(25,25,112,0.08)",
  MIDNIGHT_BORDER: "rgba(25,25,112,0.10)",
  HAIRLINE: "rgba(25,25,112,0.07)",
  INK: "#0f172a",
  MUTED: "rgba(15,23,42,0.55)",
  HINT: "rgba(15,23,42,0.4)",
  GHOST: "rgba(15,23,42,0.28)",
  SUBTLE: "rgba(25,25,112,0.04)",
  SUCCESS: "#1d3557", // 신호등 금지 — good=미드나잇 네이비
  WARN: "#191970",    // 주의 = 미드나잇 (황색 아님)
  DANGER: "#b64c4c",  // 위험 = 벽돌 (유일한 컬러 상태)
} as const;

/** 섹션 카드 — 흰색 베이스, hairline 보더, 부드러운 그림자 */
export const card: React.CSSProperties = {
  borderRadius: 20,
  padding: 0,
  background: "white",
  border: `1px solid ${PALETTE.MIDNIGHT_BORDER}`,
  boxShadow: "0 1px 3px rgba(25,25,112,0.03), 0 12px 28px -16px rgba(25,25,112,0.12)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden", // hairline divider가 깔끔하게 보이도록
};

/** 섹션 헤더 — 카드 상단 영역 (padding 별도) */
export const sectionHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "20px 24px 16px",
  borderBottom: `1px solid ${PALETTE.HAIRLINE}`,
};

export const sectionTitle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  color: PALETTE.MIDNIGHT_DEEP,
  letterSpacing: "-0.02em",
  lineHeight: 1.3,
};

export const sectionSubtitle: React.CSSProperties = {
  fontSize: 12.5,
  color: PALETTE.MUTED,
  fontWeight: 500,
  marginTop: 3,
  lineHeight: 1.45,
};

export const sectionBody: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

/** Settings-style row: label (left) | input/value (right) */
export const settingsRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(140px, 200px) 1fr",
  alignItems: "center",
  gap: 16,
  padding: "12px 24px",
  minHeight: 52,
  borderBottom: `1px solid ${PALETTE.HAIRLINE}`,
  transition: "background 0.15s ease",
};

export const settingsRowFull: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: "14px 24px",
  borderBottom: `1px solid ${PALETTE.HAIRLINE}`,
};

export const rowLabel: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: PALETTE.INK,
  letterSpacing: "-0.005em",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

export const rowLabelOptional: React.CSSProperties = {
  ...rowLabel,
  color: PALETTE.MUTED,
  fontWeight: 500,
};

export const rowHelper: React.CSSProperties = {
  fontSize: 11.5,
  color: PALETTE.HINT,
  fontWeight: 500,
  lineHeight: 1.5,
  marginTop: 4,
};

/** Inline input — borderless 기본, 하단 hairline */
export const inlineInput = (filled: boolean): React.CSSProperties => ({
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 0",
  border: "none",
  borderBottom: `1px solid ${filled ? PALETTE.MIDNIGHT_BORDER : "transparent"}`,
  fontSize: 14,
  fontWeight: filled ? 600 : 400,
  color: filled ? PALETTE.INK : PALETTE.GHOST,
  background: "transparent",
  outline: "none",
  fontFamily: "inherit",
  letterSpacing: "-0.005em",
  transition: "border-color 0.15s ease, color 0.15s ease",
  textAlign: "right" as const,
});

/** 우측 정렬용 number/won/percent input */
export const numberInput = (filled: boolean): React.CSSProperties => ({
  ...inlineInput(filled),
  fontVariantNumeric: "tabular-nums" as const,
  textAlign: "right" as const,
});

/** Textarea — full-width, soft fill */
export const textareaInput = (filled: boolean): React.CSSProperties => ({
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${filled ? PALETTE.MIDNIGHT_BORDER : PALETTE.HAIRLINE}`,
  background: filled ? "white" : PALETTE.MIDNIGHT_4,
  fontSize: 13.5,
  fontWeight: 500,
  color: PALETTE.INK,
  outline: "none",
  fontFamily: "inherit",
  letterSpacing: "-0.005em",
  resize: "vertical" as const,
  minHeight: 64,
  lineHeight: 1.55,
  transition: "border-color 0.15s ease, background 0.15s ease",
});

export const ddayPill = (days: number): React.CSSProperties => {
  const isCritical = days <= 7;
  const isWarn = days <= 30;
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 10.5,
    fontWeight: 700,
    color: isCritical ? PALETTE.DANGER : isWarn ? PALETTE.WARN : PALETTE.MIDNIGHT,
    background: isCritical ? "rgba(182,76,76,0.10)" : isWarn ? "rgba(25,25,112,0.10)" : PALETTE.MIDNIGHT_8,
    fontVariantNumeric: "tabular-nums" as const,
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap" as const,
  };
};

export const ghostButton: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  padding: "10px 16px",
  borderRadius: 10,
  border: `1px dashed ${PALETTE.MIDNIGHT_BORDER}`,
  background: "transparent",
  color: PALETTE.MIDNIGHT,
  cursor: "pointer",
  fontFamily: "inherit",
  letterSpacing: "-0.005em",
  transition: "background 0.15s ease, border-color 0.15s ease",
};

export const subtleButton: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  padding: "5px 11px",
  borderRadius: 8,
  border: `1px solid ${PALETTE.MIDNIGHT_BORDER}`,
  background: "white",
  color: PALETTE.MIDNIGHT,
  cursor: "pointer",
  fontFamily: "inherit",
};

/** legacy aliases (다른 곳에서 사용) — 새 디자인에 맞게 매핑 */
export const fieldLabel: React.CSSProperties = rowLabel;
export const fieldHelper: React.CSSProperties = rowHelper;
export const inputBase = textareaInput;
export const inputFocus = (filled: boolean): React.CSSProperties => ({
  borderColor: filled ? PALETTE.MIDNIGHT : PALETTE.MIDNIGHT_BORDER,
});
export const optionalBadge: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  color: PALETTE.GHOST,
};

// ─── 수정·저장·취소 버튼 (object-mode 카드 공용) ──────────────────
//   CostManagementCard / SectionRenderer 가 import 해서 사용.
//   이 파일에 두는 이유: React Fast Refresh 가 module-level const 새 추가 시
//   stale 참조 버그 발생 — 외부 import 는 안정적.
export const editBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "6px 12px",
  borderRadius: 8,
  background: "white",
  color: PALETTE.MIDNIGHT,
  border: `1px solid ${PALETTE.MIDNIGHT_BORDER}`,
  fontSize: 12,
  fontWeight: 650,
  fontFamily: "inherit",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const saveBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "6px 14px",
  borderRadius: 8,
  background: PALETTE.MIDNIGHT,
  color: "white",
  border: "none",
  fontSize: 12,
  fontWeight: 700,
  fontFamily: "inherit",
  cursor: "pointer",
  whiteSpace: "nowrap",
  boxShadow: "0 2px 8px rgba(30,42,85,0.18)",
};

export const cancelBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "6px 12px",
  borderRadius: 8,
  background: "transparent",
  color: PALETTE.MUTED,
  border: `1px solid ${PALETTE.HAIRLINE}`,
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const readonlyValueStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 6,
  fontSize: 13.5,
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
  padding: "8px 12px",
  borderRadius: 8,
  background: PALETTE.SUBTLE,
  border: `1px solid ${PALETTE.HAIRLINE}`,
  minHeight: 36,
  boxSizing: "border-box" as const,
};

export const readonlySuffixStyle: React.CSSProperties = {
  fontSize: 11,
  color: PALETTE.HINT,
  fontWeight: 600,
};
