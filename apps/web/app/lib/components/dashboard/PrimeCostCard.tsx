"use client";

/**
 * PrimeCostCard — Prime Cost (식자재 + 인건비) 외식 핵심 KPI.
 *
 *  ── 2026-05-11 전면 재작업 (사용자 요청) ──────────────────────────
 *  웹 조사 결과 (Toast POS·Restaurant365·TouchBistro·KB금융·한국외식산업통계연감)
 *  반영해서 *진짜* 업계 표준대로 재구현:
 *
 *   ✓ 주간 추적 디폴트 (good operators track weekly, not monthly — RestaurantOwner.com)
 *   ✓ 인건비에 4대보험·퇴직금 자동 가산 (KB금융: "사업주 부담 = 급여의 약 10% 추가")
 *   ✓ COGS 근거 투명화 — 사장님 입력값은 *매입액* (purchases). 진짜 COGS 공식은
 *     beginning + purchases - ending. 재고 추적 안 하면 매입으로 근사 — UI 명시.
 *   ✓ 업종별 한국 시장 벤치마크 (food/cafe-dessert/chicken 등) — KB·KFIRI 출처
 *   ✓ 신뢰도 게이트 (cost-ratios SSOT 와 동일) — days<7·매출 표본부족 시 empty state
 *
 *  핵심 계산은 packages/shared/finance/prime-cost.ts SSOT 위임.
 *  ──────────────────────────────────────────────────────────────────
 *
 *  아이콘 — Apple SF Symbols 톤 (lucide-react, strokeWidth 1.5).
 */

import { useState } from "react";
import {
  Sprout, Users, Activity, Lightbulb, TrendingUp, AlertCircle, Info,
} from "lucide-react";
import {
  calculatePrimeCost,
  getPrimeCostBenchmark,
  toneFromPrime,
  toneFromCogs,
  toneFromLabor,
  LABOR_EMPLOYER_BURDEN_MULTIPLIER,
  type PrimeTone,
  type PrimeCostBenchmark,
} from "@build-up/shared";

// ─── 디자인 토큰 ─────────────────────────────────────────────────
const MIDNIGHT_DEEP = "#141C3D";
const MIDNIGHT_SOFT = "#5A6BAE";
const TEXT_BODY = "#1A1F36";
const TEXT_MUTED = "#6B7393";
const SURFACE_LAVENDER = "#F4F5FB";
const HAIRLINE = "rgba(30,42,85,0.08)";
const SKY = "#3B5BBF";
const SKY_BG = "#EAF2FF";
const AMBER_BG = "#FFF6E5";
const AMBER_TEXT = "#8A5B11";
const ROSE_BG = "#FCEEF1";
const ROSE_TEXT = "#9F1A2D";
const GREEN_BG = "#E8F4ED";
const GREEN_TEXT = "#1F7A4C";

const TONE_STYLE: Record<PrimeTone, { bg: string; text: string; ko: string; en: string }> = {
  good:     { bg: GREEN_BG, text: GREEN_TEXT, ko: "우수", en: "GOOD" },
  ok:       { bg: SKY_BG,   text: SKY,        ko: "적정", en: "OK" },
  warning:  { bg: AMBER_BG, text: AMBER_TEXT, ko: "주의", en: "WATCH" },
  critical: { bg: ROSE_BG,  text: ROSE_TEXT,  ko: "위험", en: "CRIT" },
};

function formatWon(won: number): string {
  if (!isFinite(won) || won <= 0) return "—";
  if (won >= 100_000_000) {
    const eok = Math.floor(won / 100_000_000);
    const manRest = Math.floor((won % 100_000_000) / 10_000);
    return `${eok}억${manRest > 0 ? ` ${manRest.toLocaleString()}만` : ""}원`;
  }
  if (won >= 10_000) return `${Math.floor(won / 10_000).toLocaleString()}만원`;
  return `${Math.round(won).toLocaleString()}원`;
}

function nextActionMessage(
  cogsPct: number, laborPct: number, primePct: number,
  bench: PrimeCostBenchmark, ko: boolean,
): string | null {
  if (primePct < bench.primeWarnAt) return null;
  const cogsOver = cogsPct - bench.cogsTargetMax;
  const laborOver = laborPct - bench.laborTargetMax;
  if (cogsOver > 0 && cogsOver >= laborOver) {
    return ko
      ? `식자재 ${cogsPct.toFixed(1)}% — 목표 ${bench.cogsTargetMax}% 초과. 공급처 견적 비교, 메뉴 마진 점검, 폐기율 추적을 권장합니다.`
      : `Food cost ${cogsPct.toFixed(1)}% — over ${bench.cogsTargetMax}%. Compare suppliers, review menu margins, track waste.`;
  }
  if (laborOver > 0) {
    return ko
      ? `인건비 ${laborPct.toFixed(1)}% — 목표 ${bench.laborTargetMax}% 초과. 피크 시간대 인력 집중, 매출/시간 효율 점검을 권장합니다.`
      : `Labor ${laborPct.toFixed(1)}% — over ${bench.laborTargetMax}%. Concentrate staffing at peaks, review sales-per-labor-hour.`;
  }
  return ko
    ? `Prime ${primePct.toFixed(1)}% — 통제 가능 비용이 임계 근접 (${bench.primeWarnAt}%). 두 항목 미세 조정 필요.`
    : `Prime ${primePct.toFixed(1)}% — controllable costs near threshold (${bench.primeWarnAt}%). Fine-tune both.`;
}

// ─── Props ───────────────────────────────────────────────────────

export function PrimeCostCard({
  ko,
  industryCategoryId,
  subIndustryId,
  ingredientPurchases,
  laborBaseWages,
  hasEmployees,
  totalRevenue,
  days,
}: {
  ko: boolean;
  industryCategoryId: string | null | undefined;
  subIndustryId?: string | null;
  /** 사장님이 입력한 월 식자재 *매입액* — 진짜 COGS 가 아닌 근사 (재고 추적 X) */
  ingredientPurchases: number;
  /** 사장님이 입력한 월 인건비 — 보통 *기본급* (4대보험·퇴직 미포함) */
  laborBaseWages: number;
  /** 직원 등록 여부 — true 면 SSOT 가 4대보험·퇴직 18.5% 자동 가산 */
  hasEmployees: boolean;
  /** dailyEntries 매출 합 (N일치) */
  totalRevenue: number;
  /** dailyEntries.length (N일) */
  days: number;
}) {
  // 외식·카페 전용 — 다른 업종은 컨셉 자체가 맞지 않음 (예: 학원 식자재 X)
  if (industryCategoryId !== "food" && industryCategoryId !== "cafe-dessert") return null;

  // 추적 주기 — 업계 표준 (Toast POS·R365·RestaurantOwner.com): 주간 디폴트.
  //  "Good operators know their prime cost weekly, not monthly" (R365)
  const [period, setPeriod] = useState<"week" | "month">("week");

  const bench = getPrimeCostBenchmark(industryCategoryId, subIndustryId);
  const result = calculatePrimeCost({
    ingredientPurchases,
    laborBaseWages,
    hasEmployees,
    totalRevenue,
    days,
    period,
  });

  const hasCostInput = (ingredientPurchases + laborBaseWages) > 0;

  // ── Empty state — 비용 미입력 OR 신뢰도 부족 ────────────────────
  if (!hasCostInput || !result.ready) {
    const reasonKo =
      !hasCostInput ? "식자재 매입액과 인건비를 비용 카드에서 입력하시면 매주 자동 계산됩니다."
      : result.notReadyReason === "no-sales" ? "매출 입력이 없어 비율을 계산할 수 없어요. 일별 매출을 기록해 주세요."
      : result.notReadyReason === "few-days" ? `매출 입력이 ${days}일치 — 표본이 부족합니다. 7일+ 입력 후 정확한 비율 표시.`
      : "월 환산 매출이 비용 대비 너무 작아 비율 신뢰 불가. 매출을 더 입력하거나 월말까지 데이터를 모아주세요.";
    const reasonEn =
      !hasCostInput ? "Enter food purchases and labor cost to auto-calculate weekly."
      : result.notReadyReason === "no-sales" ? "No sales recorded — log daily revenue first."
      : result.notReadyReason === "few-days" ? `Only ${days} day(s) of sales — need 7+ for reliable ratios.`
      : "Sample too small vs. costs — add more sales entries.";
    return (
      <article style={section} data-prime-cost-card>
        <header style={header}>
          <div style={eyebrowRow}>
            <Activity size={12} strokeWidth={1.5} color={SKY} />
            <span style={eyebrow}>PRIME COST</span>
          </div>
          <div style={title}>{ko ? "식자재 + 인건비" : "Food + Labor"}</div>
          <div style={description}>
            {ko
              ? `${bench.industryLabel.ko} 1순위 KPI — 적정 ${bench.primeIdealRange[0]}-${bench.primeIdealRange[1]}%`
              : `#1 KPI for ${bench.industryLabel.en} — ideal ${bench.primeIdealRange[0]}-${bench.primeIdealRange[1]}%`}
          </div>
        </header>
        <div style={emptyBox}>
          <AlertCircle size={14} strokeWidth={1.5} color={MIDNIGHT_SOFT} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{ko ? reasonKo : reasonEn}</span>
        </div>
      </article>
    );
  }

  // ── 정상 — SSOT 결과로 렌더 ─────────────────────────────────
  const cogsPct = result.cogsPct;
  const laborPct = result.laborPct;
  const primePct = result.primePct;
  const tone = toneFromPrime(primePct, bench);
  const cogsT = toneFromCogs(cogsPct, bench);
  const laborT = toneFromLabor(laborPct, bench);
  const action = nextActionMessage(cogsPct, laborPct, primePct, bench, ko);
  const periodLabel = period === "week" ? (ko ? "주간" : "Weekly") : (ko ? "월간" : "Monthly");

  return (
    <article style={section} data-prime-cost-card>
      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ display: "grid", gap: "4px", flex: 1, minWidth: 0 }}>
          <div style={eyebrowRow}>
            <Activity size={12} strokeWidth={1.5} color={SKY} />
            <span style={eyebrow}>PRIME COST · {periodLabel}</span>
          </div>
          <div style={title}>{ko ? "식자재 + 인건비 한눈에" : "Food + Labor at a glance"}</div>
          <div style={description}>
            {ko
              ? `${bench.industryLabel.ko} 적정 ${bench.primeIdealRange[0]}-${bench.primeIdealRange[1]}% · 위험선 ${bench.primeCritAt}%`
              : `${bench.industryLabel.en} ideal ${bench.primeIdealRange[0]}-${bench.primeIdealRange[1]}% · crit ${bench.primeCritAt}%`}
          </div>
        </div>
        <div style={{
          padding: "10px 14px", borderRadius: "12px",
          background: TONE_STYLE[tone].bg, border: `1px solid ${HAIRLINE}`,
          minWidth: "112px", textAlign: "center" as const,
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 700, color: MIDNIGHT_SOFT, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
            <TrendingUp size={10} strokeWidth={1.5} />
            <span>Prime</span>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: MIDNIGHT_DEEP, lineHeight: 1.1, letterSpacing: "-0.02em", marginTop: "2px" }}>
            {primePct.toFixed(1)}%
          </div>
          <div style={{ fontSize: "10.5px", fontWeight: 700, color: TONE_STYLE[tone].text, marginTop: "2px" }}>
            {ko ? TONE_STYLE[tone].ko : TONE_STYLE[tone].en}
          </div>
        </div>
      </header>

      {/* 주간/월간 토글 — Toast POS·R365 베스트 프랙티스 (주간 디폴트) */}
      <div style={togglerWrap}>
        <button
          type="button"
          onClick={() => setPeriod("week")}
          style={{ ...togglerBtn, ...(period === "week" ? togglerBtnActive : {}) }}
          aria-pressed={period === "week"}
        >
          {ko ? "주간 (권장)" : "Week (recommended)"}
        </button>
        <button
          type="button"
          onClick={() => setPeriod("month")}
          style={{ ...togglerBtn, ...(period === "month" ? togglerBtnActive : {}) }}
          aria-pressed={period === "month"}
        >
          {ko ? "월간" : "Month"}
        </button>
      </div>

      {/* 3-column breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
        <BreakdownCell
          Icon={Sprout}
          label={ko ? "식자재 (COGS)" : "Food (COGS)"}
          pct={cogsPct}
          won={result.cogs / (period === "week" ? 4.33 : 1)}
          benchmark={ko ? `목표 ≤${bench.cogsTargetMax}%` : `Target ≤${bench.cogsTargetMax}%`}
          tone={cogsT}
          ko={ko}
        />
        <BreakdownCell
          Icon={Users}
          label={ko ? "인건비 (Labor)" : "Labor"}
          pct={laborPct}
          won={result.enrichedLabor / (period === "week" ? 4.33 : 1)}
          benchmark={ko ? `목표 ≤${bench.laborTargetMax}%` : `Target ≤${bench.laborTargetMax}%`}
          tone={laborT}
          ko={ko}
        />
        <BreakdownCell
          Icon={Activity}
          label={ko ? "Prime 합계" : "Prime Total"}
          pct={primePct}
          won={result.primeCostAmount}
          benchmark={ko ? `목표 ${bench.primeIdealRange[0]}-${bench.primeIdealRange[1]}%` : `Target ${bench.primeIdealRange[0]}-${bench.primeIdealRange[1]}%`}
          tone={tone}
          highlight
          ko={ko}
        />
      </div>

      {/* 근거·가정 투명화 — 사장님이 *왜 이 숫자가 나오는지* 추적 가능 */}
      <div style={sourceBox}>
        <Info size={11} strokeWidth={1.5} color={MIDNIGHT_SOFT} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: "10.5px", color: TEXT_MUTED, lineHeight: 1.55, letterSpacing: "-0.005em" }}>
          {ko ? (
            <>
              <b style={{ color: TEXT_BODY }}>매출 분모:</b> {periodLabel} 환산 {formatWon(result.revenueBasis)}
              {" · "}<b style={{ color: TEXT_BODY }}>{days}일 입력</b> 기반
              <br />
              <b style={{ color: TEXT_BODY }}>COGS:</b> 식자재 *매입액* (재고 추적 X — 실제 COGS = 시작재고+매입-끝재고)
              {hasEmployees && (
                <>
                  <br />
                  <b style={{ color: TEXT_BODY }}>인건비:</b> 기본급 {formatWon(laborBaseWages)} × {LABOR_EMPLOYER_BURDEN_MULTIPLIER}배
                  {" (4대보험·퇴직금 사업주 부담 +"}{Math.round((LABOR_EMPLOYER_BURDEN_MULTIPLIER - 1) * 100)}{"%)"} = {formatWon(result.enrichedLabor)}
                </>
              )}
              <br />
              <b style={{ color: TEXT_BODY }}>출처:</b> {bench.source}
            </>
          ) : (
            <>
              <b style={{ color: TEXT_BODY }}>Revenue:</b> {periodLabel} equiv. {formatWon(result.revenueBasis)} from {days} day(s).
              {" "}<b style={{ color: TEXT_BODY }}>COGS:</b> Purchases-based proxy.
              {hasEmployees && (<> <b style={{ color: TEXT_BODY }}>Labor:</b> base × {LABOR_EMPLOYER_BURDEN_MULTIPLIER} (employer burden).</>)}
              <br />
              <b style={{ color: TEXT_BODY }}>Source:</b> {bench.source}
            </>
          )}
        </div>
      </div>

      {/* Next action (only when over threshold) */}
      {action && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "10px",
          padding: "12px 14px", borderRadius: "10px",
          background: tone === "critical" ? ROSE_BG : AMBER_BG,
          border: `1px solid ${HAIRLINE}`,
        }}>
          <Lightbulb
            size={14} strokeWidth={1.5}
            color={tone === "critical" ? ROSE_TEXT : AMBER_TEXT}
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <div style={{
            fontSize: "12.5px", color: tone === "critical" ? ROSE_TEXT : AMBER_TEXT,
            fontWeight: 600, lineHeight: 1.55, letterSpacing: "-0.005em",
          }}>
            {action}
          </div>
        </div>
      )}
    </article>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────

function BreakdownCell({
  Icon, label, pct, won, benchmark, tone, highlight, ko,
}: {
  Icon: typeof Sprout;
  label: string;
  pct: number;
  won: number;
  benchmark: string;
  tone: PrimeTone;
  highlight?: boolean;
  ko: boolean;
}) {
  return (
    <div style={{
      padding: "12px 14px", borderRadius: "12px",
      background: highlight ? SURFACE_LAVENDER : "#fff",
      border: `1px solid ${highlight ? "rgba(30,42,85,0.14)" : HAIRLINE}`,
      display: "grid", gap: "4px",
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        fontSize: "10.5px", fontWeight: 700, color: MIDNIGHT_SOFT,
        letterSpacing: "0.06em", textTransform: "uppercase" as const,
      }}>
        <Icon size={11} strokeWidth={1.5} />
        <span>{label}</span>
      </div>
      <div style={{
        fontSize: "20px", fontWeight: 700, color: MIDNIGHT_DEEP,
        lineHeight: 1.15, letterSpacing: "-0.015em",
      }}>
        {pct.toFixed(1)}%
      </div>
      <div style={{ fontSize: "11.5px", color: TEXT_BODY, fontWeight: 500 }}>
        {formatWon(won)}
      </div>
      <div style={{
        fontSize: "10px", fontWeight: 700,
        color: TONE_STYLE[tone].text, marginTop: "2px", letterSpacing: "-0.005em",
      }}>
        {benchmark} · {ko ? TONE_STYLE[tone].ko : TONE_STYLE[tone].en}
      </div>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const section: React.CSSProperties = {
  padding: "22px 24px",
  background: "#fff",
  border: `1px solid ${HAIRLINE}`,
  borderRadius: "16px",
  boxShadow: "0 1px 2px rgba(30,42,85,0.03), 0 8px 28px rgba(30,42,85,0.04)",
  display: "grid",
  gap: "14px",
  fontFamily: "Pretendard Variable, Pretendard, -apple-system, sans-serif",
};

const header: React.CSSProperties = { display: "grid", gap: "4px" };

const eyebrowRow: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "5px",
};

const eyebrow: React.CSSProperties = {
  fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.1em",
  textTransform: "uppercase", color: SKY,
};

const title: React.CSSProperties = {
  fontSize: "19px", fontWeight: 700, letterSpacing: "-0.025em",
  color: MIDNIGHT_DEEP,
};

const description: React.CSSProperties = {
  fontSize: "12px", color: TEXT_MUTED, lineHeight: 1.55, marginTop: "2px",
};

const togglerWrap: React.CSSProperties = {
  display: "inline-flex", gap: "0",
  background: SURFACE_LAVENDER,
  border: `1px solid ${HAIRLINE}`,
  borderRadius: "10px",
  padding: "3px",
  alignSelf: "flex-start" as const,
};

const togglerBtn: React.CSSProperties = {
  padding: "6px 12px", border: "none", background: "transparent",
  fontSize: "11.5px", fontWeight: 650, color: TEXT_MUTED,
  borderRadius: "7px", cursor: "pointer", letterSpacing: "-0.005em",
  fontFamily: "inherit",
  transition: "background .15s, color .15s",
};

const togglerBtnActive: React.CSSProperties = {
  background: "#fff",
  color: MIDNIGHT_DEEP,
  boxShadow: "0 1px 3px rgba(30,42,85,0.10)",
};

const sourceBox: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: "8px",
  padding: "10px 12px", borderRadius: "10px",
  background: SURFACE_LAVENDER,
  border: `1px solid ${HAIRLINE}`,
};

const emptyBox: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: "10px",
  padding: "14px 16px", borderRadius: "12px",
  background: SURFACE_LAVENDER,
  border: `1px solid ${HAIRLINE}`,
  fontSize: "12.5px", color: TEXT_MUTED, lineHeight: 1.6,
};
