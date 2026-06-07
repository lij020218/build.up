"use client";

import { useDashboardCtx } from "../../contexts/DashboardContext";
import { useRoadmapStore } from "../../stores";
import type { AiRoadmapSnapshot } from "../../stores/roadmap-store";

/* ── helpers ── */
const fmt = (n: number) =>
  n >= 1_0000_0000
    ? `${(n / 1_0000_0000).toFixed(1)}억`
    : n >= 1_0000
      ? `${Math.round(n / 1_0000).toLocaleString()}만`
      : n.toLocaleString();

const pct = (part: number, total: number) =>
  total === 0 ? "0" : ((part / total) * 100).toFixed(1);

const gradeColor: Record<string, string> = {
  S: "#7c3aed", A: "#1d3557", B: "#2563eb", C: "#191970", D: "#b64c4c",
};

const riskColor: Record<string, { bg: string; fg: string; border: string }> = {
  high:   { bg: "rgba(182,76,76,0.06)",  fg: "#b64c4c", border: "rgba(182,76,76,0.15)" },
  medium: { bg: "rgba(25,25,112,0.06)", fg: "#191970", border: "rgba(25,25,112,0.15)" },
  low:    { bg: "rgba(25,25,112,0.06)", fg: "#1d3557", border: "rgba(25,25,112,0.15)" },
};

const riskLabel: Record<string, string> = { high: "높음", medium: "보통", low: "낮음" };

/* ── shared inline style tokens ── */
const CARD: React.CSSProperties = {
  borderRadius: "20px",
  padding: "28px",
  border: "1px solid rgba(255,255,255,0.82)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)",
  backdropFilter: "blur(20px)",
  boxShadow:
    "0 12px 32px rgba(17,17,17,0.04), 0 1px 0 rgba(255,255,255,0.9) inset",
};

const CARD_TITLE: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: "18px",
};

const METRIC_TILE: React.CSSProperties = {
  borderRadius: "14px",
  padding: "16px",
  border: "1px solid rgba(29,53,87,0.06)",
  background: "rgba(255,255,255,0.7)",
  textAlign: "center",
};

const BADGE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  borderRadius: "10px",
  letterSpacing: "-0.02em",
};

const PRIMARY_BTN: React.CSSProperties = {
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(180deg, #1d3557 0%, #15293f 100%)",
  color: "#fff",
  padding: "14px 22px",
  fontSize: "15px",
  fontWeight: 650,
  cursor: "pointer",
};

const SECONDARY_BTN: React.CSSProperties = {
  borderRadius: "14px",
  border: "1px solid rgba(29,53,87,0.12)",
  background: "rgba(255,255,255,0.6)",
  color: "#1d3557",
  padding: "12px 20px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  backdropFilter: "blur(12px)",
};

/* ── Component ── */
export function AiRoadmapSummary() {
  const d = useDashboardCtx();
  const { language, navigateToSurface } = d;
  const aiResult = useRoadmapStore((s) => s.aiRoadmapResult);
  const ko = language === "ko";

  /* ── Empty state ── */
  if (!aiResult) {
    return (
      <section style={{ marginTop: "42px" }}>
        <div style={{
          ...CARD,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          minHeight: "340px",
          textAlign: "center",
        }}>
          {/* empty illustration */}
          <div style={{
            width: 72, height: 72, borderRadius: "22px",
            background: "rgba(29,53,87,0.05)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="6" y="8" width="24" height="20" rx="4" stroke="#1d3557" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 16h8M14 20h5" stroke="#1d3557" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="27" cy="10" r="5" fill="#7c3aed" />
              <path d="M25.5 10h3M27 8.5v3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em", color: "#0f172a", marginBottom: "6px" }}>
              {ko ? "AI 로드맵을 먼저 생성해 주세요" : "Generate your AI roadmap first"}
            </div>
            <div style={{ fontSize: "15px", color: "var(--muted)", lineHeight: 1.6 }}>
              {ko
                ? "업종, 예산, 지역 정보를 입력하면 AI가 맞춤 창업 로드맵을 만들어 드립니다."
                : "Enter your industry, budget, and location to get a personalized startup roadmap."}
            </div>
          </div>
          <button
            type="button"
            style={PRIMARY_BTN}
            onClick={() => navigateToSurface("current")}
          >
            {ko ? "AI 로드맵 생성하기" : "Generate AI Roadmap"}
          </button>
        </div>
      </section>
    );
  }

  /* ── Main content ── */
  const {
    generatedAt,
    marketAnalysis: ma,
    budgetAllocation: ba,
    recommendations: rec,
    timeline: tl,
    risks,
  } = aiResult;

  const budgetItems = [
    { key: "deposit", label: ko ? "보증금" : "Deposit", amount: ba.deposit, color: "#1d3557" },
    { key: "interior", label: ko ? "인테리어" : "Interior", amount: ba.interior, color: "#2563eb" },
    { key: "equipment", label: ko ? "집기/장비" : "Equipment", amount: ba.equipment, color: "#7c3aed" },
    { key: "workingCapital", label: ko ? "운영자금" : "Working Capital", amount: ba.workingCapital, color: "#1d3557" },
  ];

  const dateStr = (() => {
    try {
      const dt = new Date(generatedAt);
      return ko
        ? `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일`
        : dt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch { return generatedAt; }
  })();

  return (
    <section style={{ marginTop: "42px", display: "grid", gap: "20px" }}>

      {/* ── 1. Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "12px",
      }}>
        <div>
          <div style={{
            fontSize: "11px", fontWeight: 650, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px",
          }}>
            AI Startup Roadmap
          </div>
          <div style={{
            fontSize: "28px", fontWeight: 740, letterSpacing: "-0.04em",
            color: "#0f172a", lineHeight: 1.1,
          }}>
            {ko ? "AI 창업 로드맵" : "AI Startup Roadmap"}
          </div>
          <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
            {ko ? `생성일: ${dateStr}` : `Generated: ${dateStr}`}
          </div>
        </div>
        <button
          type="button"
          style={SECONDARY_BTN}
          onClick={() => navigateToSurface("current")}
        >
          {ko ? "다시 생성" : "Regenerate"}
        </button>
      </div>

      {/* ── 2. Market Analysis ── */}
      <div style={CARD}>
        <div style={CARD_TITLE}>{ko ? "상권 분석" : "Market Analysis"}</div>

        {/* Grade + Score */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
          <div style={{
            ...BADGE,
            width: 56, height: 56, fontSize: "28px",
            background: `${gradeColor[ma.grade] ?? "#64748b"}12`,
            color: gradeColor[ma.grade] ?? "#64748b",
          }}>
            {ma.grade}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "6px" }}>
              {ko ? "종합 점수" : "Overall Score"} <span style={{ fontWeight: 800, fontSize: "20px", letterSpacing: "-0.02em" }}>{ma.score}</span>
              <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--muted)" }}>/100</span>
            </div>
            {/* score bar */}
            <div style={{ height: "6px", borderRadius: "3px", background: "rgba(0,0,0,0.05)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "3px",
                width: `${Math.min(ma.score, 100)}%`,
                background: `linear-gradient(90deg, ${gradeColor[ma.grade] ?? "#64748b"}, ${gradeColor[ma.grade] ?? "#64748b"}aa)`,
                transition: "width 0.6s ease",
              }} />
            </div>
          </div>
        </div>

        {/* 4 metric tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "16px" }}>
          {([
            { label: ko ? "유동인구" : "Foot Traffic", value: ma.footTraffic },
            { label: ko ? "경쟁 강도" : "Competition", value: ma.competition },
            { label: ko ? "임대료 수준" : "Rent Level", value: ma.rentLevel },
            { label: ko ? "타겟 적합도" : "Target Fit", value: ma.targetFit },
          ] as const).map((m) => (
            <div key={m.label} style={METRIC_TILE}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px", letterSpacing: "0.04em" }}>
                {m.label}
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* summary */}
        <div style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(15,23,42,0.6)" }}>
          {ma.summary}
        </div>
      </div>

      {/* ── 3. Budget Allocation ── */}
      <div style={CARD}>
        <div style={CARD_TITLE}>{ko ? "예산 배분" : "Budget Allocation"}</div>

        {/* Total */}
        <div style={{ fontSize: "26px", fontWeight: 780, letterSpacing: "-0.04em", color: "#0f172a", marginBottom: "16px" }}>
          {fmt(ba.total)}<span style={{ fontSize: "14px", fontWeight: 500, color: "var(--muted)", marginLeft: "4px" }}>{ko ? "원" : "KRW"}</span>
        </div>

        {/* Stacked bar */}
        <div style={{ display: "flex", height: "14px", borderRadius: "7px", overflow: "hidden", marginBottom: "20px" }}>
          {budgetItems.map((bi) => (
            <div
              key={bi.key}
              style={{
                flex: bi.amount,
                background: bi.color,
                transition: "flex 0.5s ease",
              }}
              title={`${bi.label}: ${fmt(bi.amount)} (${pct(bi.amount, ba.total)}%)`}
            />
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          {budgetItems.map((bi) => (
            <div key={bi.key} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "3px", background: bi.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{bi.label}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                  {fmt(bi.amount)} ({pct(bi.amount, ba.total)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Recommended Suppliers ── */}
      {rec.suppliers.length > 0 && (
        <div style={CARD}>
          <div style={CARD_TITLE}>{ko ? "추천 공급업체" : "Recommended Suppliers"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
            {rec.suppliers.map((s, i) => (
              <div key={i} style={{
                borderRadius: "14px", padding: "18px",
                border: "1px solid rgba(29,53,87,0.06)",
                background: "rgba(255,255,255,0.7)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{s.name}</div>
                  <span style={{
                    fontSize: "10px", fontWeight: 650, padding: "3px 10px",
                    borderRadius: "8px", background: "rgba(29,53,87,0.06)",
                    color: "#1d3557", letterSpacing: "0.02em",
                  }}>
                    {s.category}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.55, marginBottom: "6px" }}>
                  {s.reason}
                </div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#1d3557" }}>
                  {s.priceRange}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Interior Recommendations ── */}
      {rec.interior.length > 0 && (
        <div style={CARD}>
          <div style={CARD_TITLE}>{ko ? "인테리어 추천" : "Interior Recommendations"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
            {rec.interior.map((item, i) => (
              <div key={i} style={{
                borderRadius: "14px", padding: "16px",
                border: "1px solid rgba(29,53,87,0.06)",
                background: "rgba(255,255,255,0.7)",
                display: "grid", gap: "4px",
              }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{item.item}</div>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>{item.vendor}</div>
                <div style={{ fontSize: "13px", fontWeight: 650, color: "#1d3557" }}>{item.estimatedCost}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. Timeline ── */}
      <div style={CARD}>
        <div style={CARD_TITLE}>{ko ? "예상 타임라인" : "Timeline"}</div>

        {/* Meta: total weeks + open date */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{
            borderRadius: "12px", padding: "12px 18px",
            background: "rgba(29,53,87,0.04)",
          }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "2px" }}>
              {ko ? "전체 기간" : "Total Duration"}
            </div>
            <div style={{ fontSize: "18px", fontWeight: 750, color: "#0f172a" }}>
              {tl.totalWeeks}{ko ? "주" : " weeks"}
            </div>
          </div>
          <div style={{
            borderRadius: "12px", padding: "12px 18px",
            background: "rgba(29,53,87,0.04)",
          }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "2px" }}>
              {ko ? "목표 오픈일" : "Target Open"}
            </div>
            <div style={{ fontSize: "18px", fontWeight: 750, color: "#0f172a" }}>
              {tl.targetOpenDate}
            </div>
          </div>
        </div>

        {/* Horizontal timeline */}
        <div style={{ display: "flex", gap: "4px", alignItems: "flex-end" }}>
          {tl.phases.map((phase, i) => {
            const widthPct = tl.totalWeeks > 0 ? (phase.weeks / tl.totalWeeks) * 100 : 100 / tl.phases.length;
            // 네이비 농담: 단계마다 배경 opacity만 증가 (무지개 hue 대신 미드나이트 네이비 톤)
            const bgOpacity = 0.07 + i * 0.045;
            return (
              <div key={i} style={{ flex: widthPct, minWidth: 0 }}>
                <div style={{
                  fontSize: "11px", fontWeight: 600, color: "var(--primary)",
                  marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {phase.name}
                </div>
                <div style={{
                  height: "36px",
                  borderRadius: i === 0 ? "8px 0 0 8px" : i === tl.phases.length - 1 ? "0 8px 8px 0" : "0",
                  background: `rgba(29,53,87,${bgOpacity.toFixed(2)})`,
                  border: "1px solid rgba(29,53,87,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", fontWeight: 700, color: "var(--primary)",
                }}>
                  {phase.weeks}{ko ? "주" : "w"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 7. Risks ── */}
      {risks.length > 0 && (
        <div style={CARD}>
          <div style={CARD_TITLE}>{ko ? "리스크 분석" : "Risk Analysis"}</div>
          <div style={{ display: "grid", gap: "10px" }}>
            {risks.map((r, i) => {
              const rc = riskColor[r.level] ?? riskColor.medium;
              return (
                <div key={i} style={{
                  borderRadius: "14px", padding: "16px 18px",
                  background: rc.bg,
                  border: `1px solid ${rc.border}`,
                  display: "grid", gap: "6px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      fontSize: "10px", fontWeight: 700, padding: "3px 10px",
                      borderRadius: "6px", background: `${rc.fg}14`, color: rc.fg,
                      textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>
                      {riskLabel[r.level] ?? r.level}
                    </span>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", lineHeight: 1.5 }}>
                    {r.description}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.55 }}>
                    <span style={{ fontWeight: 650, color: "rgba(15,23,42,0.7)" }}>
                      {ko ? "대응:" : "Mitigation:"}
                    </span>{" "}
                    {r.mitigation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 8. Permits ── */}
      {rec.permits.length > 0 && (
        <div style={CARD}>
          <div style={CARD_TITLE}>{ko ? "필요 인허가" : "Required Permits"}</div>
          <div style={{ display: "grid", gap: "8px" }}>
            {rec.permits.map((permit, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(29,53,87,0.06)",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "7px",
                  background: "rgba(29,53,87,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6l2.5 2.5 4.5-5" stroke="#1d3557" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#0f172a" }}>{permit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 9. Tax Advice ── */}
      {rec.taxAdvice && (
        <div style={CARD}>
          <div style={CARD_TITLE}>{ko ? "절세 가이드" : "Tax Advice"}</div>
          <div style={{
            fontSize: "14px", lineHeight: 1.75, color: "rgba(15,23,42,0.65)",
            whiteSpace: "pre-wrap",
          }}>
            {rec.taxAdvice}
          </div>
        </div>
      )}
    </section>
  );
}
