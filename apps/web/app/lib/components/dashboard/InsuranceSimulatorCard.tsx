"use client";

/**
 * InsuranceSimulatorCard — 4대보험 + 두루누리 시뮬레이터.
 *
 * **분기 / 노출 조건**:
 *   - 직원 1명 이상 또는 인건비 입력 있을 때 자동 표시
 *   - 채용 검토 단계 사장님이 "직원 1명 채용하면 실제 얼마?" 즉답
 *
 * 핵심 가치:
 *   1. 월급만 입력하면 4대보험 5종 + 두루누리 80% 지원 자동 계산
 *   2. 사장님 실 부담액 (월급 + 사업주 보험료) 명시 — 채용 결정 즉답
 *   3. 단시간 근로자(주 15h 미만) 자동 분기
 *   4. 정규직 vs 파트타임 시뮬 — 같은 인건비로 어느 쪽이 유리한가
 *
 * 디자인: Found.One 토큰 (lavender-mist + 미드나잇).
 */

import { useMemo, useState } from "react";
import { Users, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import {
  simulateInsurance,
  MINIMUM_WAGE_2026,
  hourlyToMonthly,
  TOTAL_EMPLOYER_RATE_PCT,
  type InsuranceSimResult,
} from "@foundone/shared";

const MIN_WAGE_2026_HOURLY = MINIMUM_WAGE_2026;
const MIN_WAGE_2026_MONTHLY = hourlyToMonthly(MINIMUM_WAGE_2026, 40);

const MIDNIGHT_DEEP = "#141C3D";
const MIDNIGHT_SOFT = "#5A6BAE";
const TEXT_BODY = "#1A1F36";
const TEXT_MUTED = "#6B7393";
const SURFACE_LAVENDER = "#F4F5FB";
const HAIRLINE = "rgba(30,42,85,0.08)";
const HAIRLINE_STRONG = "rgba(30,42,85,0.16)";
const SKY = "#3B5BBF";
const SKY_BG = "#EAF2FF";
const AMBER_BG = "#FFF6E5";
const AMBER_TEXT = "#8A5B11";

type Props = {
  ko: boolean;
  /** 현재 사업장 직원 수 (두루누리 자격 판단) */
  currentEmployeeCount: number;
};

const PRESETS = [
  { id: "min-fulltime",  labelKo: "최저시급 풀타임", labelEn: "Min wage full-time", salary: MIN_WAGE_2026_MONTHLY, hours: 40 },
  { id: "common-3m",     labelKo: "월 300만원 정규직",  labelEn: "₩3M full-time",        salary: 3_000_000,            hours: 40 },
  { id: "part-25h",      labelKo: "파트타임 25시간",    labelEn: "Part-time 25h",        salary: Math.round(MIN_WAGE_2026_HOURLY * 25 * 4.345), hours: 25 },
  { id: "part-15h-edge", labelKo: "주 14시간 단시간",   labelEn: "Short-time 14h",       salary: Math.round(MIN_WAGE_2026_HOURLY * 14 * 4.345), hours: 14 },
];

export function InsuranceSimulatorCard({ ko, currentEmployeeCount }: Props) {
  const [salary, setSalary] = useState<number>(MIN_WAGE_2026_MONTHLY);
  const [weeklyHours, setWeeklyHours] = useState<number>(40);
  const [duruDuru, setDuruDuru] = useState<boolean>(true);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

  const totalEmployeeCount = currentEmployeeCount + 1;     // 시뮬 직원 1명 추가 가정

  const sim = useMemo<InsuranceSimResult>(
    () =>
      simulateInsurance({
        monthlySalary: salary,
        weeklyHours,
        totalEmployeeCount,
        isDuruduriEligible: duruDuru,
      }),
    [salary, weeklyHours, totalEmployeeCount, duruDuru],
  );

  const employerBurdenPct = salary > 0 ? ((sim.employer.afterDuruduri / salary) * 100) : 0;
  const takeHomePct = salary > 0 ? (((salary - sim.employee.afterDuruduri) / salary) * 100) : 0;

  function applyPreset(p: typeof PRESETS[number]) {
    setSalary(p.salary);
    setWeeklyHours(p.hours);
  }

  return (
    <article style={section}>
      <header style={{ display: "grid", gap: "4px" }}>
        <div style={eyebrow}>{ko ? "4대보험 시뮬레이터" : "Insurance Simulator"}</div>
        <div style={title}>{ko ? "직원 1명 채용하면 실제 얼마?" : "How much per new hire?"}</div>
        <div style={{ fontSize: "12px", color: TEXT_MUTED, lineHeight: 1.55, marginTop: "2px" }}>
          {ko
            ? "2026 4대보험 요율 + 두루누리 80% 지원 자동 반영. 채용 결정 5분 안에."
            : "2026 rates + 80% Duruduri subsidy auto-applied."}
        </div>
      </header>

      {/* 프리셋 칩 */}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p)}
            style={{
              ...presetChip,
              background: salary === p.salary && weeklyHours === p.hours ? SKY_BG : "#fff",
              borderColor: salary === p.salary && weeklyHours === p.hours ? SKY : HAIRLINE_STRONG,
              color: salary === p.salary && weeklyHours === p.hours ? "#1F46A8" : MIDNIGHT_SOFT,
            }}
          >
            {ko ? p.labelKo : p.labelEn}
          </button>
        ))}
      </div>

      {/* 직접 입력 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <Field
          label={ko ? "월급 (원)" : "Monthly salary"}
          value={salary}
          onChange={setSalary}
          step={100_000}
          min={0}
          max={20_000_000}
          format={(n) => n.toLocaleString()}
        />
        <Field
          label={ko ? "주 근무시간" : "Hours/week"}
          value={weeklyHours}
          onChange={setWeeklyHours}
          step={1}
          min={1}
          max={60}
          suffix={ko ? "시간" : "h"}
          format={(n) => String(n)}
        />
      </div>

      {/* 두루누리 토글 */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          borderRadius: "10px",
          background: duruDuru && sim.duruduriEligible ? SKY_BG : SURFACE_LAVENDER,
          border: `1px solid ${duruDuru && sim.duruduriEligible ? SKY : HAIRLINE}`,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={duruDuru}
          onChange={(e) => setDuruDuru(e.target.checked)}
          style={{ accentColor: SKY, width: "16px", height: "16px" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "12.5px", fontWeight: 700, color: MIDNIGHT_DEEP }}>
            {ko ? "두루누리 80% 지원 적용" : "Apply Duruduri 80% subsidy"}
          </div>
          <div style={{ fontSize: "10.5px", color: TEXT_MUTED, marginTop: "1px", lineHeight: 1.4 }}>
            {ko ? "월 270만 미만 + 10인 미만 + 신규 가입 36개월" : "<₩2.7M + <10 emp + 36mo new"}
          </div>
        </div>
      </label>

      {/* 핵심 결과 (3개) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
          marginTop: "4px",
        }}
      >
        <Stat
          label={ko ? "사장님 실부담" : "Employer total"}
          value={formatWonShort(sim.totalMonthlyCostToEmployer)}
          sub={ko ? `급여 + 보험 ${employerBurdenPct.toFixed(1)}%` : `salary +${employerBurdenPct.toFixed(1)}%`}
          tone="amber"
        />
        <Stat
          label={ko ? "직원 실수령" : "Take-home"}
          value={formatWonShort(salary - sim.employee.afterDuruduri)}
          sub={ko ? `${takeHomePct.toFixed(1)}% 수령` : `${takeHomePct.toFixed(1)}% net`}
          tone="midnight"
        />
        <Stat
          label={ko ? "두루누리 절감" : "Subsidy save"}
          value={formatWonShort(sim.duruduriMonthlySaving)}
          sub={sim.duruduriEligible ? (ko ? "/ 월" : "/ mo") : (ko ? "자격 X" : "n/a")}
          tone={sim.duruduriEligible ? "sky" : "muted"}
        />
      </div>

      {/* 알림 */}
      {sim.warnings.length > 0 && (
        <div style={alertBox}>
          <Sparkles size={13} strokeWidth={2} color={AMBER_TEXT} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "11.5px", color: AMBER_TEXT, lineHeight: 1.55 }}>
            {sim.warnings.map((w, i) => (
              <div key={i} style={{ marginBottom: i < sim.warnings.length - 1 ? "4px" : 0 }}>
                • {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 분해 (펼침) */}
      <button
        type="button"
        onClick={() => setShowBreakdown(!showBreakdown)}
        style={breakdownToggle}
      >
        <span>{ko ? "보험료 항목별 분해" : "Detailed breakdown"}</span>
        {showBreakdown ? <ChevronUp size={14} color={MIDNIGHT_SOFT} /> : <ChevronDown size={14} color={MIDNIGHT_SOFT} />}
      </button>
      {showBreakdown && (
        <div style={breakdownGrid}>
          <BreakdownRow ko={ko} labelKo="국민연금" labelEn="Pension" employer={sim.employer.pension} employee={sim.employee.pension} />
          <BreakdownRow ko={ko} labelKo="건강보험" labelEn="Health" employer={sim.employer.health} employee={sim.employee.health} />
          <BreakdownRow ko={ko} labelKo="장기요양" labelEn="Long-term care" employer={sim.employer.longTermCare} employee={sim.employee.longTermCare} />
          <BreakdownRow ko={ko} labelKo="고용보험" labelEn="Employment" employer={sim.employer.employment} employee={sim.employee.employment} />
          <BreakdownRow ko={ko} labelKo="산재보험" labelEn="Workers" employer={sim.employer.workers} employee={0} note={ko ? "사업주 부담 100%" : "100% employer"} />
          <div style={{ borderTop: `1px solid ${HAIRLINE_STRONG}`, paddingTop: "6px", marginTop: "2px" }}>
            <BreakdownRow ko={ko} labelKo="합계 (적용 전)" labelEn="Total (before subsidy)" employer={sim.employer.total} employee={sim.employee.total} bold />
            {sim.duruduriEligible && (
              <BreakdownRow ko={ko} labelKo="두루누리 적용 후" labelEn="After subsidy" employer={sim.employer.afterDuruduri} employee={sim.employee.afterDuruduri} bold tone="sky" />
            )}
          </div>
        </div>
      )}

      {/* footer 안내 */}
      <div
        style={{
          fontSize: "10.5px",
          color: TEXT_MUTED,
          lineHeight: 1.55,
          paddingTop: "8px",
          borderTop: `1px solid ${HAIRLINE}`,
        }}
      >
        {ko
          ? `2026 요율 기준 (산재 0.7% 일반 서비스업 가정). 사업주 총 부담률 ${TOTAL_EMPLOYER_RATE_PCT.toFixed(2)}% — 정확한 산재 요율은 근로복지공단(1588-0075)에서 업종별 확인.`
          : `2026 rates (0.7% workers' comp assumed). Total employer ${TOTAL_EMPLOYER_RATE_PCT.toFixed(2)}%.`}
      </div>
    </article>
  );
}

// ─── 하위 컴포넌트 ──────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  step,
  min,
  max,
  format,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
  min: number;
  max: number;
  format: (n: number) => string;
  suffix?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: "10.5px", fontWeight: 700, color: MIDNIGHT_SOFT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "4px" }}>
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 10px",
          background: SURFACE_LAVENDER,
          borderRadius: "10px",
          border: `1px solid ${HAIRLINE}`,
        }}
      >
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontSize: "14px",
            fontWeight: 700,
            color: MIDNIGHT_DEEP,
            fontVariantNumeric: "tabular-nums",
            outline: "none",
            minWidth: 0,
          }}
        />
        {suffix && <span style={{ fontSize: "11.5px", color: TEXT_MUTED, fontWeight: 600 }}>{suffix}</span>}
      </div>
      <div style={{ fontSize: "10.5px", color: TEXT_MUTED, marginTop: "3px" }}>
        {suffix ? `${value}${suffix}` : `${format(value)}원`}
      </div>
    </label>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "midnight" | "amber" | "sky" | "muted";
}) {
  const color =
    tone === "amber" ? AMBER_TEXT :
    tone === "sky" ? "#1F46A8" :
    tone === "muted" ? TEXT_MUTED :
    MIDNIGHT_DEEP;
  const bg =
    tone === "amber" ? AMBER_BG :
    tone === "sky" ? SKY_BG :
    SURFACE_LAVENDER;
  return (
    <div style={{ padding: "10px 12px", borderRadius: "10px", background: bg, border: `1px solid ${HAIRLINE}` }}>
      <div style={{ fontSize: "10px", fontWeight: 700, color: MIDNIGHT_SOFT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "3px" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color,
          letterSpacing: "-0.025em",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "10px", color: TEXT_MUTED, marginTop: "2px", fontWeight: 600 }}>
        {sub}
      </div>
    </div>
  );
}

function BreakdownRow({
  ko,
  labelKo,
  labelEn,
  employer,
  employee,
  note,
  bold = false,
  tone,
}: {
  ko: boolean;
  labelKo: string;
  labelEn: string;
  employer: number;
  employee: number;
  note?: string;
  bold?: boolean;
  tone?: "sky";
}) {
  const color = tone === "sky" ? "#1F46A8" : MIDNIGHT_DEEP;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        gap: "12px",
        padding: "5px 0",
        fontSize: "11.5px",
        fontVariantNumeric: "tabular-nums",
        color: bold ? color : TEXT_BODY,
        fontWeight: bold ? 700 : 500,
      }}
    >
      <div>
        {ko ? labelKo : labelEn}
        {note && <span style={{ color: TEXT_MUTED, fontWeight: 400, marginLeft: "4px", fontSize: "10px" }}>· {note}</span>}
      </div>
      <div style={{ color: AMBER_TEXT, minWidth: "60px", textAlign: "right" as const }}>
        {ko ? "사장 " : ""}{employer.toLocaleString()}원
      </div>
      <div style={{ color: TEXT_MUTED, minWidth: "60px", textAlign: "right" as const }}>
        {ko ? "직원 " : ""}{employee.toLocaleString()}원
      </div>
    </div>
  );
}

function formatWonShort(won: number): string {
  if (won === 0) return "0원";
  if (Math.abs(won) >= 100_000_000) return `${(won / 100_000_000).toFixed(1)}억`;
  if (Math.abs(won) >= 10_000) return `${Math.round(won / 10_000).toLocaleString()}만`;
  return `${won.toLocaleString()}원`;
}

// ─── styles ────────────────────────────────────────────────────────

const section: React.CSSProperties = {
  padding: "22px 24px",
  background: "#fff",
  border: `1px solid ${HAIRLINE}`,
  borderRadius: "16px",
  boxShadow: "0 1px 2px rgba(30,42,85,0.03), 0 8px 28px rgba(30,42,85,0.04)",
  display: "grid",
  gap: "12px",
  fontFamily: "Pretendard Variable, Pretendard, -apple-system, sans-serif",
};

const eyebrow: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: SKY,
};

const title: React.CSSProperties = {
  fontSize: "19px",
  fontWeight: 700,
  letterSpacing: "-0.025em",
  color: MIDNIGHT_DEEP,
};

const presetChip: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  padding: "6px 11px",
  borderRadius: "999px",
  border: "1px solid",
  cursor: "pointer",
  transition: "all 120ms ease",
};

const alertBox: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  padding: "10px 12px",
  borderRadius: "10px",
  background: AMBER_BG,
  border: "1px solid rgba(214,145,33,0.25)",
};

const breakdownToggle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  padding: "8px 12px",
  background: SURFACE_LAVENDER,
  border: `1px solid ${HAIRLINE}`,
  borderRadius: "10px",
  fontSize: "12px",
  fontWeight: 600,
  color: MIDNIGHT_DEEP,
  cursor: "pointer",
};

const breakdownGrid: React.CSSProperties = {
  padding: "10px 14px",
  background: "#fff",
  border: `1px solid ${HAIRLINE}`,
  borderRadius: "10px",
};
