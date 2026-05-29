"use client";

import { useState, useMemo } from "react";
import { calculateHiringCost, MINIMUM_WAGE_2026, checkMinimumWage, annualToMonthly } from "@foundone/shared";

type Props = { ko: boolean; industryCategoryId?: string };

const fmt = (n: number) => {
  const abs = Math.abs(Math.round(n));
  if (abs >= 10000) return `${Math.round(n / 10000).toLocaleString()}만원`;
  return `${abs.toLocaleString()}원`;
};

// 업종별 평균 월급 벤치마크 (만원/월, 2025 한국 소상공인 기준)
const SALARY_BENCHMARKS: Record<string, { label: string; monthly: number }> = {
  "food": { label: "외식업", monthly: 230 },
  "cafe-dessert": { label: "카페·디저트", monthly: 220 },
  "beauty": { label: "뷰티", monthly: 250 },
  "fitness": { label: "피트니스", monthly: 280 },
  "education": { label: "교육", monthly: 260 },
  "retail": { label: "소매", monthly: 210 },
  "pet": { label: "반려동물", monthly: 220 },
  "living-service": { label: "생활서비스", monthly: 220 },
  "space": { label: "공간·숙박", monthly: 230 },
};

export function HiringCostCalculator({ ko, industryCategoryId }: Props) {
  const [inputMode, setInputMode] = useState<"monthly" | "annual">("monthly");
  const benchmark = SALARY_BENCHMARKS[industryCategoryId ?? ""] ?? SALARY_BENCHMARKS["food"];
  const [salaryText, setSalaryText] = useState(String(benchmark.monthly));

  const monthlySalary = useMemo(() => {
    const raw = Number(salaryText.replace(/[^0-9]/g, "")) || 0;
    return inputMode === "annual" ? annualToMonthly(raw * 10000) : raw * 10000;
  }, [salaryText, inputMode]);

  const result = useMemo(() => calculateHiringCost({ monthlySalary }), [monthlySalary]);
  const minWageCheck = useMemo(() => checkMinimumWage(monthlySalary), [monthlySalary]);

  const barMax = result.totalEmployerCostMonthly || 1;
  const segments = [
    { label: ko ? "기본급" : "Base", value: result.baseSalary, color: "#1d3557" },
    { label: ko ? "주휴수당" : "Holiday", value: result.weeklyHolidayPay, color: "#457b9d" },
    { label: ko ? "4대보험" : "Insurance", value: result.totalInsuranceEmployer, color: "#e63946" },
    { label: ko ? "퇴직금" : "Severance", value: result.severanceMonthly, color: "#f4a261" },
  ];

  return (
    <div style={card}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={eyebrow}>{ko ? "채용 비용 계산기" : "Hiring Cost Calculator"}</div>
          <div style={title}>{ko ? "실제 사업주 부담은?" : "What does it really cost?"}</div>
        </div>
        <div style={{ display: "flex", gap: "4px", background: "rgba(15,23,42,0.04)", borderRadius: "10px", padding: "3px" }}>
          {(["monthly", "annual"] as const).map(m => (
            <button key={m} type="button" onClick={() => { setInputMode(m); setSalaryText(m === "monthly" ? String(benchmark.monthly) : String(benchmark.monthly * 12)); }} style={{
              padding: "5px 12px", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              background: inputMode === m ? "#fff" : "transparent",
              color: inputMode === m ? "#0f172a" : "rgba(15,23,42,0.4)",
              boxShadow: inputMode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s ease",
            }}>
              {m === "annual" ? (ko ? "연봉" : "Annual") : (ko ? "월급" : "Monthly")}
            </button>
          ))}
        </div>
      </div>

      {/* 입력 */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px" }}>
        <input
          type="text"
          inputMode="numeric"
          value={salaryText}
          onChange={e => setSalaryText(e.target.value.replace(/[^0-9]/g, ""))}
          style={inputStyle}
          placeholder={inputMode === "annual" ? "3500" : "292"}
        />
        <span style={{ fontSize: "14px", color: "rgba(15,23,42,0.4)", flexShrink: 0 }}>
          {ko ? "만원" : "만₩"} / {inputMode === "annual" ? (ko ? "연" : "yr") : (ko ? "월" : "mo")}
        </span>
      </div>

      {/* 업종별 벤치마크 */}
      {industryCategoryId && benchmark && (
        <div style={{ marginTop: "8px", padding: "8px 12px", borderRadius: "10px", background: "rgba(5,97,252,0.04)", border: "1px solid rgba(5,97,252,0.08)", display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)" }}>
            {ko ? `${benchmark.label} 평균 월급: 약 ${benchmark.monthly}만원 (2025 소상공인 기준)` : `${benchmark.label} avg: ~${benchmark.monthly}만원/mo (2025 SME benchmark)`}
          </span>
        </div>
      )}

      {/* 최저임금 경고 */}
      {monthlySalary > 0 && !minWageCheck.compliant && (
        <div style={{ marginTop: "8px", padding: "8px 12px", borderRadius: "10px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.1)", display: "flex", gap: "6px", alignItems: "center" }} className="bento-fade-in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#dc2626" }}>
            {ko ? `최저임금 미달! 최소 월 ${fmt(minWageCheck.minimumMonthly)} (시급 ${MINIMUM_WAGE_2026.toLocaleString()}원)` : `Below minimum wage! Min ${fmt(minWageCheck.minimumMonthly)}/mo`}
          </span>
        </div>
      )}

      {/* 비용 분해 스택 바 */}
      {monthlySalary > 0 && (
        <>
          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
              {segments.filter(s => s.value > 0).map((s, i) => (
                <div key={s.label} style={{
                  width: `${(s.value / barMax) * 100}%`,
                  background: s.color,
                  transition: "width 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                  borderRadius: i === 0 ? "6px 0 0 6px" : i === segments.filter(x => x.value > 0).length - 1 ? "0 6px 6px 0" : "0",
                }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "8px", flexWrap: "wrap" as const }}>
              {segments.filter(s => s.value > 0).map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: s.color }} />
                  <span style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)" }}>{s.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 660, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>{fmt(s.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 핵심 수치 3열 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "14px" }}>
            <div style={metricCard}>
              <div style={metricLabel}>{ko ? "사업주 월 총비용" : "Employer monthly"}</div>
              <div className="bento-number" style={{ ...metricValue, color: "#dc2626" }}>{fmt(result.totalEmployerCostMonthly)}</div>
              <div style={metricSub}>+{result.totalOverheadRatio.toFixed(0)}% {ko ? "추가 부담" : "overhead"}</div>
            </div>
            <div style={metricCard}>
              <div style={metricLabel}>{ko ? "직원 실수령" : "Employee net"}</div>
              <div className="bento-number" style={{ ...metricValue, color: "#059669" }}>{fmt(result.netPayToEmployee)}</div>
            </div>
            <div style={metricCard}>
              <div style={metricLabel}>{ko ? "연간 총비용" : "Annual total"}</div>
              <div className="bento-number" style={{ ...metricValue, color: "#0f172a" }}>{fmt(result.totalEmployerCostAnnual)}</div>
            </div>
          </div>

          {/* 4대보험 상세 (접이식) */}
          <details style={{ marginTop: "12px" }}>
            <summary style={{ fontSize: "12px", fontWeight: 600, color: "rgba(15,23,42,0.4)", cursor: "pointer", padding: "4px 0" }}>
              {ko ? "4대보험 상세 보기" : "View insurance breakdown"}
            </summary>
            <div style={{ display: "grid", gap: "4px", marginTop: "6px" }} className="bento-fade-in">
              {[
                { label: ko ? "국민연금" : "Pension", emp: result.pension, ee: Math.round(monthlySalary * 0.045) },
                { label: ko ? "건강보험" : "Health", emp: result.health, ee: Math.round(monthlySalary * 0.03545) },
                { label: ko ? "장기요양" : "Long-term", emp: result.longTermCare, ee: Math.round(result.health * 0.1281) },
                { label: ko ? "고용보험" : "Employment", emp: result.employment, ee: Math.round(monthlySalary * 0.009) },
                { label: ko ? "산재보험" : "Accident", emp: result.accident, ee: 0 },
              ].map(row => (
                <div key={row.label} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", padding: "6px 8px", borderRadius: "8px", background: "rgba(15,23,42,0.02)", fontSize: "12px" }}>
                  <span style={{ color: "rgba(15,23,42,0.5)" }}>{row.label}</span>
                  <span style={{ textAlign: "right" as const, fontWeight: 600, color: "#dc2626" }}>{fmt(row.emp)}</span>
                  <span style={{ textAlign: "right" as const, color: "rgba(15,23,42,0.4)" }}>{row.ee > 0 ? fmt(row.ee) : "—"}</span>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "4px 8px", fontSize: "10px", color: "rgba(15,23,42,0.3)" }}>
                <span />
                <span style={{ textAlign: "right" as const }}>{ko ? "사업주" : "Employer"}</span>
                <span style={{ textAlign: "right" as const }}>{ko ? "근로자" : "Employee"}</span>
              </div>
            </div>
          </details>
        </>
      )}
    </div>
  );
}

/* ─── Styles ─── */
const card: React.CSSProperties = {
  borderRadius: "22px", padding: "22px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))",
  border: "1px solid rgba(15,23,42,0.05)",
  boxShadow: "0 2px 12px rgba(15,23,42,0.03), 0 1px 0 rgba(255,255,255,0.8) inset",
  display: "grid", gap: "4px",
};
const eyebrow: React.CSSProperties = { fontSize: "11px", fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,23,42,0.4)" };
const title: React.CSSProperties = { fontSize: "18px", fontWeight: 740, letterSpacing: "-0.03em", color: "#0f172a", lineHeight: 1.1 };
const inputStyle: React.CSSProperties = {
  flex: 1, padding: "12px 16px", borderRadius: "14px", border: "1.5px solid rgba(15,23,42,0.08)",
  fontSize: "22px", fontWeight: 740, letterSpacing: "-0.03em", color: "#0f172a",
  outline: "none", background: "rgba(255,255,255,0.8)", fontVariantNumeric: "tabular-nums",
  transition: "border-color 0.2s ease",
};
const metricCard: React.CSSProperties = {
  padding: "12px", borderRadius: "14px",
  background: "linear-gradient(180deg, rgba(248,250,253,0.92), rgba(242,246,250,0.82))",
  border: "1px solid rgba(15,23,42,0.04)",
};
const metricLabel: React.CSSProperties = { fontSize: "10px", fontWeight: 650, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(15,23,42,0.4)", marginBottom: "4px" };
const metricValue: React.CSSProperties = { fontSize: "16px", fontWeight: 760, letterSpacing: "-0.03em", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" };
const metricSub: React.CSSProperties = { fontSize: "10px", color: "rgba(15,23,42,0.35)", marginTop: "2px" };
