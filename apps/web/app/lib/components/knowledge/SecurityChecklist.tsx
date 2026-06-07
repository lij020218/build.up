"use client";

import { useState, useMemo } from "react";
import { SECURITY_CHECKLIST, SECURITY_CATEGORIES, calculateSecurityScore, type SecurityCategory } from "@foundone/shared";

type Props = { ko: boolean; checks: Record<string, boolean>; onToggle: (id: string) => void };

export function SecurityChecklist({ ko, checks, onToggle }: Props) {
  const [activeCategory, setActiveCategory] = useState<SecurityCategory | "all">("all");
  const score = useMemo(() => calculateSecurityScore(checks), [checks]);

  const filtered = activeCategory === "all"
    ? SECURITY_CHECKLIST
    : SECURITY_CHECKLIST.filter(item => item.category === activeCategory);

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...filtered].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const priorityColor = { critical: "#b64c4c", high: "#191970", medium: "#2563eb", low: "rgba(15,23,42,0.35)" };
  const priorityLabel = { critical: ko ? "필수" : "Critical", high: ko ? "높음" : "High", medium: ko ? "보통" : "Medium", low: ko ? "낮음" : "Low" };

  const readinessLabel = {
    not_started: ko ? "시작 전" : "Not Started",
    basic: ko ? "기초" : "Basic",
    intermediate: ko ? "중간" : "Intermediate",
    production_ready: ko ? "프로덕션 준비 완료" : "Production Ready",
  };
  const readinessColor = { not_started: "#b64c4c", basic: "#191970", intermediate: "#2563eb", production_ready: "#1d3557" };

  // SVG 원형 게이지
  const circumference = 2 * Math.PI * 38;
  const strokeDash = (score.score / 100) * circumference;

  return (
    <div style={card}>
      {/* 헤더 + 점수 게이지 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={eyebrow}>{ko ? "보안 기반 체크리스트" : "Security Baseline"}</div>
          <div style={title}>{score.completed} / {score.total}</div>
          <div style={{ fontSize: "12px", fontWeight: 620, color: readinessColor[score.readiness], marginTop: "2px" }}>
            {readinessLabel[score.readiness]}
          </div>
        </div>
        <div style={{ position: "relative" as const, width: "80px", height: "80px" }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="38" fill="none" stroke="rgba(15,23,42,0.05)" strokeWidth="4" />
            <circle cx="40" cy="40" r="38" fill="none"
              stroke={readinessColor[score.readiness]}
              strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              transform="rotate(-90 40 40)"
              style={{ transition: "stroke-dasharray 1s cubic-bezier(0.22, 1, 0.36, 1)" }}
            />
          </svg>
          <div style={{ position: "absolute" as const, inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="bento-number" style={{ fontSize: "22px", fontWeight: 780, color: readinessColor[score.readiness] }}>{score.score}</span>
          </div>
        </div>
      </div>

      {/* Critical 경고 */}
      {score.criticalCompleted < score.criticalTotal && (
        <div style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(182,76,76,0.04)", border: "1px solid rgba(182,76,76,0.08)", display: "flex", gap: "8px", alignItems: "center", marginTop: "8px" }} className="bento-fade-in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b64c4c" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#b64c4c" }}>
            {ko ? `필수 항목 ${score.criticalTotal - score.criticalCompleted}개 미완료` : `${score.criticalTotal - score.criticalCompleted} critical items incomplete`}
          </span>
        </div>
      )}

      {/* 카테고리 필터 */}
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" as const, marginTop: "12px" }}>
        <button type="button" onClick={() => setActiveCategory("all")} style={{
          ...filterBtn, background: activeCategory === "all" ? "#0f172a" : "transparent",
          color: activeCategory === "all" ? "#fff" : "rgba(15,23,42,0.4)",
        }}>{ko ? "전체" : "All"} ({score.total})</button>
        {SECURITY_CATEGORIES.map(cat => {
          const count = SECURITY_CHECKLIST.filter(i => i.category === cat.id).length;
          const done = SECURITY_CHECKLIST.filter(i => i.category === cat.id && checks[i.id]).length;
          return (
            <button key={cat.id} type="button" onClick={() => setActiveCategory(cat.id)} style={{
              ...filterBtn, background: activeCategory === cat.id ? cat.color : "transparent",
              color: activeCategory === cat.id ? "#fff" : "rgba(15,23,42,0.4)",
            }}>{cat.icon} {done}/{count}</button>
          );
        })}
      </div>

      {/* 체크리스트 */}
      <div style={{ display: "grid", gap: "6px", marginTop: "10px", maxHeight: "400px", overflowY: "auto" }}>
        {sorted.map(item => {
          const checked = !!checks[item.id];
          return (
            <div key={item.id} onClick={() => onToggle(item.id)} style={{
              display: "flex", gap: "12px", padding: "12px 14px", borderRadius: "14px", cursor: "pointer",
              background: checked ? "rgba(25,25,112,0.03)" : "rgba(255,255,255,0.6)",
              border: checked ? "1px solid rgba(25,25,112,0.1)" : "1px solid rgba(15,23,42,0.04)",
              transition: "all 0.2s ease",
            }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "6px", flexShrink: 0,
                border: checked ? "none" : `1.5px solid ${priorityColor[item.priority]}40`,
                background: checked ? "#1d3557" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s ease",
              }}>
                {checked && <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.2 7.5L8 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                  <span style={{ fontSize: "13px", fontWeight: checked ? 550 : 620, color: checked ? "rgba(15,23,42,0.4)" : "#0f172a", textDecoration: checked ? "line-through" : "none" }}>
                    {ko ? item.title.ko : item.title.en}
                  </span>
                  <span style={{ fontSize: "9px", fontWeight: 650, padding: "1px 5px", borderRadius: "4px", background: `${priorityColor[item.priority]}10`, color: priorityColor[item.priority] }}>
                    {priorityLabel[item.priority]}
                  </span>
                  {item.requiredForSOC2 && <span style={{ fontSize: "8px", fontWeight: 650, padding: "1px 4px", borderRadius: "3px", background: "rgba(37,99,235,0.06)", color: "#2563eb" }}>SOC2</span>}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.4 }}>
                  {ko ? item.description.ko : item.description.en}
                </div>
              </div>
              <div style={{ fontSize: "10px", color: "var(--muted)", flexShrink: 0, whiteSpace: "nowrap" as const }}>
                ~{item.estimatedMinutes}{ko ? "분" : "m"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  borderRadius: "22px", padding: "22px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))",
  border: "1px solid rgba(15,23,42,0.05)",
  boxShadow: "0 2px 12px rgba(15,23,42,0.03), 0 1px 0 rgba(255,255,255,0.8) inset",
};
const eyebrow: React.CSSProperties = { fontSize: "11px", fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" };
const title: React.CSSProperties = { fontSize: "24px", fontWeight: 780, letterSpacing: "-0.04em", color: "#0f172a", lineHeight: 1, fontVariantNumeric: "tabular-nums" };
const filterBtn: React.CSSProperties = {
  padding: "4px 10px", borderRadius: "8px", border: "1px solid rgba(15,23,42,0.06)",
  fontSize: "11px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease", whiteSpace: "nowrap",
};
