import type React from "react";

export const shell: React.CSSProperties = {
  display: "grid",
  gap: "18px",
  fontFamily:
    '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

export const heroPanel: React.CSSProperties = {
  borderRadius: "16px",
  padding: "24px",
  background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(232,240,255,0.4) 100%)",
  border: "1px solid rgba(5, 97, 252, 0.06)",
  boxShadow: "0 21px 94px rgba(0, 0, 0, 0.03)",
  display: "grid",
  gap: "20px",
  transition: "box-shadow 0.3s ease, transform 0.3s ease",
};

export const heroHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "16px",
  flexWrap: "wrap",
};

export const heroEyebrow: React.CSSProperties = {
  fontSize: "12px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(15, 23, 42, 0.48)",
  marginBottom: "6px",
};

export const heroTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 4vw, 40px)",
  lineHeight: 1.08,
  letterSpacing: "-0.025em",
  fontWeight: 600,
  color: "#1d1d1f",
};

export const heroBody: React.CSSProperties = {
  margin: "10px 0 0",
  maxWidth: "64ch",
  fontSize: "15px",
  lineHeight: 1.65,
  color: "rgba(15, 23, 42, 0.62)",
};

export const heroActions: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

export const primaryAction: React.CSSProperties = {
  border: "none",
  borderRadius: "8px",
  padding: "12px 18px",
  background: "#0561fc",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(5, 97, 252, 0.25)",
};

export const secondaryAction: React.CSSProperties = {
  border: "1px solid rgba(5, 97, 252, 0.12)",
  borderRadius: "8px",
  padding: "12px 18px",
  background: "rgba(255,255,255,0.9)",
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 21px 94px rgba(0, 0, 0, 0.03)",
};

export const headlineGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

export const headlineCard: React.CSSProperties = {
  borderRadius: "12px",
  padding: "20px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(240,244,255,0.5) 100%)",
  border: "1px solid rgba(5, 97, 252, 0.06)",
  boxShadow: "0 21px 94px rgba(0, 0, 0, 0.03)",
  transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease",
  cursor: "default",
};

export const headlineLabel: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(15, 23, 42, 0.48)",
  marginBottom: "8px",
};

export const headlineValue: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 780,
  letterSpacing: "-0.045em",
  lineHeight: 1.05,
  fontVariantNumeric: "tabular-nums",
};

export const headlineNote: React.CSSProperties = {
  marginTop: "8px",
  fontSize: "12px",
  lineHeight: 1.5,
  color: "rgba(15, 23, 42, 0.52)",
};

export const coreGrid: React.CSSProperties = {
  display: "grid",
  gap: "16px",
  alignItems: "stretch",
};

export const survivalGrid: React.CSSProperties = {
  display: "grid",
  gap: "16px",
  alignItems: "stretch",
};

export const opsCard: React.CSSProperties = {
  borderRadius: "14px",
  padding: "22px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(240,244,255,0.45) 100%)",
  border: "1px solid rgba(5, 97, 252, 0.06)",
  boxShadow: "0 21px 94px rgba(0, 0, 0, 0.03)",
  display: "grid",
  gap: "14px",
};

export const opsHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

export const sectionEyebrow: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: "rgba(15, 23, 42, 0.46)",
  marginBottom: "6px",
};

export const emptyState: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "10px",
  background: "linear-gradient(180deg, rgba(240,244,255,0.4) 0%, rgba(248,250,255,0.25) 100%)",
  border: "1px solid rgba(5,97,252,0.04)",
  fontSize: "13px",
  lineHeight: 1.55,
  color: "rgba(15, 23, 42, 0.58)",
};

export const detailSection: React.CSSProperties = {
  display: "grid",
  gap: "12px",
};

export const detailSectionHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
};

export const detailSectionTitle: React.CSSProperties = {
  fontSize: "20px",
  lineHeight: 1.3,
  fontWeight: 720,
  letterSpacing: "-0.03em",
  color: "#0f172a",
};

/* ── ActivitySnapshotCard styles ── */

export const activityCard: React.CSSProperties = {
  borderRadius: "14px",
  padding: "22px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(240,244,255,0.45) 100%)",
  border: "1px solid rgba(5, 97, 252, 0.06)",
  boxShadow: "0 21px 94px rgba(0, 0, 0, 0.03)",
  display: "grid",
  gap: "18px",
};

export const activityHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap",
};

export const activityTitle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 740,
  letterSpacing: "-0.04em",
  color: "#0f172a",
};

export const activityStatRail: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

export const activityMiniStat: React.CSSProperties = {
  minWidth: "124px",
  borderRadius: "10px",
  padding: "12px 14px",
  background: "linear-gradient(180deg, rgba(240,244,255,0.6) 0%, rgba(248,250,255,0.4) 100%)",
  border: "1px solid rgba(5,97,252,0.06)",
};

export const activityMiniLabel: React.CSSProperties = {
  fontSize: "11px",
  color: "rgba(15,23,42,0.48)",
  marginBottom: "6px",
};

export const activityMiniValue: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 750,
  letterSpacing: "-0.05em",
  color: "#0f172a",
  lineHeight: 1,
};

export const activityChartWrap: React.CSSProperties = {
  height: "138px",
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: "10px",
  alignItems: "end",
  padding: "8px 2px 0",
};

export const activityBarCol: React.CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "8px",
};

export const activityBarTrack: React.CSSProperties = {
  width: "100%",
  height: "110px",
  display: "flex",
  alignItems: "flex-end",
  padding: "0 4px",
};

export const activityBarFill: React.CSSProperties = {
  width: "100%",
  borderRadius: "14px",
  minHeight: "4px",
  transition: "height 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
};

export const activityBarLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
};

/* ── Bento micro-interaction: inject global hover styles once ── */
export const bentoHoverCSS = `
@keyframes bentoFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes bentoPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
@keyframes bentoProgress { from { width: 0; } }
@keyframes bentoBarGrow { from { height: 0; transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes bentoBarPulse { 0% { opacity: 0.7; transform: scaleY(0.95); } 50% { opacity: 1; transform: scaleY(1.02); } 100% { opacity: 1; transform: scaleY(1); } }
@keyframes bentoCountUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bentoGlow { 0%, 100% { box-shadow: 0 0 0 rgba(29,53,87,0); } 50% { box-shadow: 0 0 12px rgba(29,53,87,0.08); } }
.bento-card { transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease !important; }
.bento-card:hover { transform: translateY(-2px) !important; box-shadow: 0 21px 94px rgba(0,0,0,0.06) !important; }
.bento-headline { transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease !important; }
.bento-headline:hover { transform: translateY(-1px) !important; box-shadow: 0 21px 94px rgba(0,0,0,0.04) !important; }
.bento-btn { transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease !important; }
.bento-btn:active { transform: scale(0.97) !important; }
.bento-meter-fill { animation: bentoProgress 0.8s cubic-bezier(0.22, 1, 0.36, 1) !important; }
.bento-fade-in { animation: bentoFadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both !important; }
.bento-number { animation: bentoCountUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; font-variant-numeric: tabular-nums; }
`;
