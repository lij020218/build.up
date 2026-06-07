"use client";

/**
 * CashZeroDateCard — Cash Zero Date 표시 + 채용 시뮬레이터 (실리콘밸리 2026 표준).
 *
 *  ── 왜 만들었나 (2026-05-12 Phase 2-startup) ──────────────────────────
 *  30+ 실리콘밸리 2025-2026 자료 (Mercury·Puzzle·Bessemer·ICONIQ·a16z·
 *  YC W26 Demo Day 등) 합의:
 *    "런웨이 14개월" 같은 *추상 월수* 가 아니라 **"2027-08-15에 자본 0원 도달"**
 *    *절대 날짜* 가 2025-2026 실리콘밸리 founder daily KPI 표준 #1.
 *
 *  Found.One StartupFounderBrief 는 runway "월수" 만 표시 — 갭.
 *  → 절대 날짜 (YYYY-MM-DD) + 18m 임계 경고 + 채용 시뮬 추가.
 *
 *  ── 채용 시뮬 ────────────────────────────────────────────────────────
 *  한국 스타트업 핵심 trade-off: "팀원 1명 추가하면 cash zero 가 얼마나 당겨지나?"
 *  사장님이 *매일* 보면 *채용 의사결정* 객관적 기준이 됨.
 *
 *  계산: 추가 인건비 (4대보험 포함 ~월 600만원) 추가 시 새 burn rate 계산
 *       → 새 runway 월수 → 새 cash zero date.
 *
 *  ── 출처 (3개) ──────────────────────────────────────────────────────
 *  · Puzzle.io Founder's Guide to Burn & Runway (절대 날짜 표시 권장)
 *  · Mercury Default Alive Calculator (Paul Graham)
 *  · Bessemer The State of AI 2025 (cash zero as #1 daily metric)
 *  ────────────────────────────────────────────────────────────────────
 */

import { useMemo, useState } from "react";
import { Calendar, AlertTriangle, UserPlus, Sliders } from "lucide-react";
import { useFinanceStore } from "../../stores/finance-store";
import { useProfileStore } from "../../stores/profile-store";
// 2026-05-13 — SSOT (cash-zero-date.ts, 7 unit tests 검증)
//   computeCashZeroDate — Mercury·Puzzle·Bessemer 표준 (절대 날짜 + 채용 시뮬).
import { computeCashZeroDate, DEFAULT_HIRE_COST_KRW } from "@foundone/shared";

const MIDNIGHT = "#191970";

type Props = { ko: boolean };

export function CashZeroDateCard({ ko }: Props) {
  const { monthlyCosts } = useFinanceStore();
  const { selectedBudget, initialOperatingCapital } = useProfileStore();
  const [hireCount, setHireCount] = useState(0);

  // 2026-05-13 — SSOT (computeCashZeroDate) 사용. 카드는 *입력 수집* + *UI 결정* 만.
  //   7 unit tests 검증 (자본 미입력·월 비용 미입력·자본 2억 20m·자본 6천 6m·
  //   채용 1명 7.5m 당겨짐·절대 날짜 365일 후 등).
  const result = useMemo(() => {
    const totalCapital = (selectedBudget ?? 0) + (initialOperatingCapital ?? 0);
    const monthlyBurn =
      (monthlyCosts?.ingredients ?? 0) +
      (monthlyCosts?.labor ?? 0) +
      (monthlyCosts?.rent ?? 0) +
      (monthlyCosts?.utilities ?? 0) +
      (monthlyCosts?.sga ?? 0) +
      (monthlyCosts?.marketing ?? 0) +
      (monthlyCosts?.other ?? 0) +
      (monthlyCosts?.interest ?? 0);

    const ssotResult = computeCashZeroDate({
      totalCapital,
      currentMonthlyBurn: monthlyBurn,
      hireCount,
    });

    // not ready 케이스 — 한국어 사유 메시지로 변환
    if (!ssotResult.ready) {
      const reason = ssotResult.reason === "초기 자본 미입력"
        ? (ko ? "초기 자본을 입력하세요" : "Enter initial capital")
        : (ko ? "월 비용을 입력하면 cash zero 계산 시작" : "Enter monthly costs");
      return { ready: false as const, reason };
    }

    return {
      ready: true as const,
      currentRunway: ssotResult.currentRunwayMonths,
      simulatedRunway: ssotResult.simulatedRunwayMonths,
      cashZeroStr: ssotResult.cashZeroDateStr,
      cashZeroDate: ssotResult.cashZeroDate,
      daysAhead: ssotResult.daysAhead,
      monthsShifted: ssotResult.monthsShifted,
      tone: ssotResult.tone,
      monthlyBurn,
      simulatedBurn: ssotResult.simulatedBurn,
      hireCount,
    };
  }, [monthlyCosts, selectedBudget, initialOperatingCapital, hireCount, ko]);

  if (!result.ready) {
    return (
      <article style={cardStyle}>
        <header style={headerRow}>
          <span style={iconBadge}><Calendar size={14} strokeWidth={2.2} /></span>
          <div style={labelStyle}>{ko ? "Cash Zero Date" : "Cash Zero Date"}</div>
        </header>
        <div style={{ padding: "20px 0", textAlign: "center" as const, color: "var(--muted)", fontSize: 13 }}>
          {result.reason}
        </div>
      </article>
    );
  }

  const colors = {
    critical: { bg: "rgba(182,76,76,0.06)", border: "rgba(182,76,76,0.20)", text: "#b64c4c" },
    warning: { bg: "rgba(25,25,112,0.06)", border: "rgba(25,25,112,0.20)", text: "#191970" },
    good: { bg: "rgba(25,25,112,0.05)", border: "rgba(25,25,112,0.18)", text: "#1d3557" },
  } as const;
  const c = colors[result.tone];

  // YYYY-MM-DD → "2027년 8월 15일 (월)" 한국어 / "Aug 15, 2027" 영어
  const cashZeroFormatted = ko
    ? `${result.cashZeroDate.getFullYear()}년 ${result.cashZeroDate.getMonth() + 1}월 ${result.cashZeroDate.getDate()}일`
    : result.cashZeroDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <article style={cardStyle}>
      <header style={headerRow}>
        <span style={iconBadge}><Calendar size={14} strokeWidth={2.2} /></span>
        <div style={labelStyle}>
          {ko ? "Cash Zero Date · 실리콘밸리 2026 표준" : "Cash Zero Date · SV 2026 Standard"}
        </div>
      </header>

      <div style={{ fontSize: 13, color: "rgba(15,23,42,0.6)", lineHeight: 1.4, marginTop: -4 }}>
        {ko
          ? "런웨이 \"개월\" 추상 → \"이 날짜에 자본 0원\" 절대 날짜로. 채용 시뮬레이터로 의사결정 객관화."
          : "Abstract \"months\" → absolute date. Hire simulator for objective decisions."}
      </div>

      {/* Cash Zero Date — Big display */}
      <div style={{
        padding: "20px 22px", borderRadius: 16,
        background: c.bg, border: `1px solid ${c.border}`,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: c.text, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 4 }}>
          {result.tone === "critical"
            ? (ko ? "⚠️ 위기 — 즉시 펀딩 또는 비용 절감" : "⚠️ Critical")
            : result.tone === "warning"
              ? (ko ? "⚠️ 점검 — 18개월 미만" : "⚠️ Below 18m")
              : (ko ? "✓ 안전 (18개월+)" : "✓ Safe (18m+)")}
        </div>
        <div style={{
          fontSize: 30, fontWeight: 700, color: c.text,
          letterSpacing: "-0.02em", lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}>
          {cashZeroFormatted}
        </div>
        <div style={{ fontSize: 13, color: "rgba(15,23,42,0.65)", marginTop: 6 }}>
          {ko
            ? `${result.daysAhead}일 후 · ${result.simulatedRunway.toFixed(1)}개월 운영 가능`
            : `${result.daysAhead} days · ${result.simulatedRunway.toFixed(1)}mo runway`}
        </div>
      </div>

      {/* 채용 시뮬레이터 */}
      <div style={{
        padding: "14px 16px", borderRadius: 14,
        background: "white", border: "1px solid rgba(25,25,112,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <UserPlus size={14} strokeWidth={2.2} style={{ color: MIDNIGHT, opacity: 0.7 }} />
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>
            {ko ? "채용 시뮬레이터" : "Hire Simulator"}
          </div>
          <span style={{
            marginLeft: "auto", fontSize: 10.5, color: "var(--muted)", fontWeight: 600,
          }}>
            {ko ? `1명당 월 ${Math.round(DEFAULT_HIRE_COST_KRW / 10000)}만원 기준` : `${Math.round(DEFAULT_HIRE_COST_KRW / 10000)}만/mo per hire`}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Sliders size={13} strokeWidth={2} style={{ color: "var(--muted)" }} />
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={hireCount}
            onChange={(e) => setHireCount(parseInt(e.target.value, 10))}
            style={{ flex: 1, accentColor: MIDNIGHT }}
            aria-label={ko ? "추가 채용 인원" : "Additional hires"}
          />
          <div style={{
            minWidth: 60, textAlign: "right" as const,
            fontSize: 16, fontWeight: 700, color: MIDNIGHT, fontVariantNumeric: "tabular-nums",
          }}>
            +{hireCount}명
          </div>
        </div>

        {hireCount > 0 && (
          <div style={{
            marginTop: 10, padding: "9px 12px", borderRadius: 9,
            background: "rgba(25,25,112,0.06)", border: "1px solid rgba(25,25,112,0.18)",
            fontSize: 12, color: "#0f172a", lineHeight: 1.5,
            display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <AlertTriangle size={13} strokeWidth={2.2} style={{ color: "#191970", flexShrink: 0, marginTop: 1 }} />
            <span>
              {ko
                ? <><strong>cash zero -{result.monthsShifted.toFixed(1)}개월 당겨짐</strong> · {hireCount}명 추가 시 월 burn {Math.round(result.simulatedBurn / 10000).toLocaleString()}만원 ({Math.round((hireCount * DEFAULT_HIRE_COST_KRW) / 10000).toLocaleString()}만 추가)</>
                : <><strong>Cash zero -{result.monthsShifted.toFixed(1)}mo earlier</strong> · burn ↑ ₩{Math.round(result.simulatedBurn / 10000).toLocaleString()}만/mo</>}
            </span>
          </div>
        )}
      </div>

      {/* footer — 자료 인용 */}
      <div style={{
        fontSize: 10.5, color: "var(--muted)", lineHeight: 1.5,
        padding: "8px 12px", borderRadius: 9,
        background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.06)",
      }}>
        {ko
          ? "출처: Puzzle.io · Mercury Default Alive · Bessemer State of AI 2025 — 절대 날짜 표시 + 채용 시뮬은 2025-2026 실리콘밸리 founder daily KPI 표준 #1"
          : "Sources: Puzzle.io · Mercury · Bessemer 2025 — absolute date + hire sim = SV 2026 daily KPI #1"}
      </div>
    </article>
  );
}

// ─── styles ──────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 20,
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
  padding: "22px 24px",
  display: "flex", flexDirection: "column" as const, gap: 14,
};

const headerRow: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10,
};

const iconBadge: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8,
  background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.85) 100%)`,
  color: "white",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 4px 12px rgba(25,25,112,0.25)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: MIDNIGHT,
  opacity: 0.75,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};
