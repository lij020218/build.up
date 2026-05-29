"use client";

/**
 * Cashflow13WeekForecastCard — 13주 rolling cash flow forecast.
 *
 * 글로벌 SMB 표준 (Quicken·CFO 매뉴얼) — 13주 = 약 90일 = 1분기.
 * 캐시노트가 못 푸는 영역. Found.One 만의 "위기 조기 감지" 무기.
 *
 * 작동:
 *   1. 기존 projectCashflow 엔진을 91일로 호출 (이미 projectionDays 옵션 보유)
 *   2. 일별 결과를 주별로 집계 (월~일 = 1주, 13주 카드 표시)
 *   3. 어느 주에서 잔고가 음수로 빠지는지 즉시 식별
 *   4. AI 처방: "X주 후 -200만 → 지금 무엇을 해야 하나" 한 줄 권고
 *
 * 디자인: Found.One 토큰 (lavender-mist + 미드나잇 네이비 + cream amber 경고).
 *
 * 분기: 사용자가 currentBalance 또는 fixedExpenses 등록 시점부터 표시.
 *       미설정 시 onboarding nudge.
 */

import { useMemo, useState } from "react";
import { TrendingDown, AlertCircle, Sparkles, Settings } from "lucide-react";
import { useCashflowStore } from "../../stores/cashflow-store";
import {
  projectCashflow,
  type DayProjection,
  type DailyEntry,
} from "../../services/cashflow-projection";

type Props = {
  ko: boolean;
  dailyEntries: DailyEntry[];
  fallbackMonthlyCostsTotal?: number;
  onOpenSetup?: () => void;
};

type WeekBucket = {
  weekIndex: number;             // 0..12
  startDate: string;             // ISO
  endDate: string;
  inflow: number;
  outflow: number;
  netChange: number;             // inflow - outflow
  endBalance: number;            // 마지막 일자의 endBalance
  minBalance: number;            // 주중 최저 잔고
  isNegative: boolean;
};

const MIDNIGHT = "#1E2A55";
const MIDNIGHT_DEEP = "#141C3D";
const MIDNIGHT_SOFT = "#5A6BAE";
const TEXT_BODY = "#1A1F36";
const TEXT_MUTED = "#6B7393";
const SURFACE_LAVENDER = "#F4F5FB";
const HAIRLINE = "rgba(30,42,85,0.08)";
const HAIRLINE_STRONG = "rgba(30,42,85,0.16)";
const AMBER_BG = "#FFF6E5";
const AMBER_TEXT = "#8A5B11";
const ROSE_BG = "#FCEEF1";
const ROSE_TEXT = "#9F1A2D";
const SKY = "#3B5BBF";

export function Cashflow13WeekForecastCard({
  ko,
  dailyEntries,
  fallbackMonthlyCostsTotal,
  onOpenSetup,
}: Props) {
  const {
    currentBalance,
    salesChannels,
    fixedExpenses,
    vatReserveEnabled,
    setupCompletedAt,
  } = useCashflowStore();

  const [hoverWeek, setHoverWeek] = useState<number | null>(null);

  const projection = useMemo<DayProjection[]>(() => {
    return projectCashflow({
      currentBalance,
      recentDailyEntries: dailyEntries,
      salesChannels,
      fixedExpenses,
      vatReserveEnabled,
      projectionDays: 91,
      fallbackMonthlyCostsTotal,
    });
  }, [currentBalance, dailyEntries, salesChannels, fixedExpenses, vatReserveEnabled, fallbackMonthlyCostsTotal]);

  const weeks = useMemo<WeekBucket[]>(() => {
    if (projection.length === 0) return [];
    const buckets: WeekBucket[] = [];
    for (let w = 0; w < 13; w++) {
      const slice = projection.slice(w * 7, (w + 1) * 7);
      if (slice.length === 0) break;
      const inflow = slice.reduce((s, d) => s + d.inflow, 0);
      const outflow = slice.reduce((s, d) => s + d.outflow, 0);
      const lastDay = slice[slice.length - 1];
      const minBalance = Math.min(...slice.map((d) => d.endBalance));
      buckets.push({
        weekIndex: w,
        startDate: slice[0].date,
        endDate: lastDay.date,
        inflow,
        outflow,
        netChange: inflow - outflow,
        endBalance: lastDay.endBalance,
        minBalance,
        isNegative: minBalance < 0,
      });
    }
    return buckets;
  }, [projection]);

  // ── Onboarding nudge: 잔고 또는 채널 미설정 시 ─────────────────
  const isUnconfigured = !setupCompletedAt && currentBalance === 0 && fixedExpenses.length === 0;
  if (isUnconfigured) {
    return (
      <article style={section}>
        <header style={header}>
          <div style={eyebrow}>{ko ? "13주 자금 흐름 예측" : "13-Week Cash Forecast"}</div>
          <div style={title}>{ko ? "이대로면 X주 후 어떨까요?" : "Where will you be in 13 weeks?"}</div>
        </header>
        <div style={emptyBox}>
          <div style={{ fontSize: "12.5px", color: TEXT_BODY, lineHeight: 1.55, marginBottom: "10px" }}>
            {ko
              ? "현재 통장 잔고 + 정산 채널 + 고정비를 한 번 등록하시면, 앞으로 13주의 현금흐름이 매주 자동으로 보입니다. 위기는 미리 보일 때 막을 수 있습니다."
              : "Register your balance, settlement channels, and fixed expenses once — see the next 13 weeks automatically. Crises are preventable when seen early."}
          </div>
          {onOpenSetup && (
            <button type="button" onClick={onOpenSetup} style={primaryBtn}>
              <Settings size={14} strokeWidth={2} style={{ marginRight: "6px" }} />
              {ko ? "현금흐름 설정 (3분)" : "Set up cashflow (3 min)"}
            </button>
          )}
        </div>
      </article>
    );
  }

  if (weeks.length === 0) return null;

  // ── 위기 분석 ────────────────────────────────────────────────────
  const firstNegativeWeek = weeks.find((w) => w.isNegative);
  const minBalanceWeek = weeks.reduce(
    (acc, w) => (w.minBalance < acc.minBalance ? w : acc),
    weeks[0],
  );
  const finalEndBalance = weeks[weeks.length - 1].endBalance;
  const crisis = firstNegativeWeek != null;

  // 차트 스케일링
  const allBalances = weeks.map((w) => w.endBalance);
  const maxBal = Math.max(currentBalance, ...allBalances, 0);
  const minBal = Math.min(0, ...allBalances);
  const range = maxBal - minBal || 1;
  const chartHeight = 120;

  return (
    <article style={section}>
      <header style={header}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "grid", gap: "4px" }}>
            <div style={eyebrow}>{ko ? "13주 자금 흐름 예측" : "13-Week Cash Forecast"}</div>
            <div style={title}>
              {crisis
                ? ko
                  ? `${firstNegativeWeek!.weekIndex + 1}주 후 잔고 부족 신호`
                  : `Cash crunch in week ${firstNegativeWeek!.weekIndex + 1}`
                : ko
                  ? "13주 후도 흑자 흐름"
                  : "Positive through 13 weeks"}
            </div>
          </div>
          {onOpenSetup && (
            <button type="button" onClick={onOpenSetup} style={settingsBtn} aria-label="설정">
              <Settings size={14} strokeWidth={2} color={MIDNIGHT_SOFT} />
            </button>
          )}
        </div>
      </header>

      {/* ── 핵심 수치 3개 ── */}
      <div style={statsRow}>
        <Stat
          label={ko ? "현재 잔고" : "Current"}
          value={formatWon(currentBalance)}
          tone="midnight"
        />
        <Stat
          label={ko ? "13주 후 예상" : "End of 13w"}
          value={formatWon(finalEndBalance)}
          tone={finalEndBalance < 0 ? "rose" : finalEndBalance < currentBalance * 0.5 ? "amber" : "midnight"}
        />
        <Stat
          label={ko ? "최저 잔고 (주차)" : "Lowest (week)"}
          value={`${formatWon(minBalanceWeek.minBalance)}`}
          subValue={ko ? `${minBalanceWeek.weekIndex + 1}주차` : `W${minBalanceWeek.weekIndex + 1}`}
          tone={minBalanceWeek.minBalance < 0 ? "rose" : "amber"}
        />
      </div>

      {/* ── 13주 막대 차트 ── */}
      <div
        style={{
          marginTop: "16px",
          padding: "16px 8px 8px",
          background: SURFACE_LAVENDER,
          borderRadius: "12px",
          border: `1px solid ${HAIRLINE}`,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
            gap: "4px",
            height: chartHeight,
            alignItems: "end",
            position: "relative",
          }}
        >
          {/* 0 baseline */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: `${((0 - minBal) / range) * chartHeight}px`,
              height: "1px",
              background: HAIRLINE_STRONG,
              zIndex: 1,
            }}
          />
          {weeks.map((w) => {
            const isHovered = hoverWeek === w.weekIndex;
            const top = w.endBalance >= 0
              ? ((w.endBalance - 0) / range) * chartHeight
              : 0;
            const bottomNeg = w.endBalance < 0
              ? ((0 - w.endBalance) / range) * chartHeight
              : 0;
            const baselineY = ((0 - minBal) / range) * chartHeight;
            const barColor = w.isNegative ? "#B42334" : w.endBalance < currentBalance * 0.5 ? "#D69121" : SKY;
            return (
              <div
                key={w.weekIndex}
                style={{ position: "relative", height: "100%", cursor: "pointer" }}
                onMouseEnter={() => setHoverWeek(w.weekIndex)}
                onMouseLeave={() => setHoverWeek(null)}
              >
                {/* 양수 바 (baseline 위) */}
                {w.endBalance > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: `${baselineY}px`,
                      height: `${top}px`,
                      background: barColor,
                      opacity: isHovered ? 1 : 0.85,
                      borderRadius: "3px 3px 0 0",
                      transition: "opacity 120ms ease",
                    }}
                  />
                )}
                {/* 음수 바 (baseline 아래) */}
                {w.endBalance < 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: `${chartHeight - baselineY}px`,
                      height: `${bottomNeg}px`,
                      background: barColor,
                      opacity: isHovered ? 1 : 0.85,
                      borderRadius: "0 0 3px 3px",
                      transition: "opacity 120ms ease",
                    }}
                  />
                )}
                {/* hover 툴팁 */}
                {isHovered && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: `${chartHeight + 4}px`,
                      left: "50%",
                      transform: "translateX(-50%)",
                      padding: "6px 10px",
                      background: MIDNIGHT_DEEP,
                      color: "#fff",
                      borderRadius: "8px",
                      fontSize: "10.5px",
                      lineHeight: 1.4,
                      whiteSpace: "nowrap",
                      zIndex: 10,
                      boxShadow: "0 4px 12px rgba(20,28,61,0.3)",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {ko ? `${w.weekIndex + 1}주차` : `Week ${w.weekIndex + 1}`}
                    </div>
                    <div>{ko ? "잔고: " : "Balance: "}{formatWon(w.endBalance)}</div>
                    <div style={{ opacity: 0.7, fontSize: "9.5px" }}>
                      {w.startDate} ~ {w.endDate}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* X축 눈금 (1주, 4주, 8주, 13주) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
            gap: "4px",
            marginTop: "6px",
            fontSize: "9px",
            color: TEXT_MUTED,
            fontWeight: 600,
          }}
        >
          {weeks.map((w) => (
            <div key={w.weekIndex} style={{ textAlign: "center" }}>
              {[0, 3, 7, 12].includes(w.weekIndex) ? `${w.weekIndex + 1}주` : ""}
            </div>
          ))}
        </div>
      </div>

      {/* ── AI 처방 ── */}
      <div style={crisis ? prescriptionCrisis : prescriptionSafe}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          {crisis ? (
            <AlertCircle size={16} strokeWidth={2} color={ROSE_TEXT} style={{ flexShrink: 0, marginTop: "2px" }} />
          ) : (
            <Sparkles size={16} strokeWidth={2} color={SKY} style={{ flexShrink: 0, marginTop: "2px" }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: crisis ? ROSE_TEXT : SKY,
                marginBottom: "4px",
              }}
            >
              {ko ? "지금 무엇을 해야 하나" : "What to do now"}
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: MIDNIGHT_DEEP, lineHeight: 1.45 }}>
              {buildPrescriptionHeadline(weeks, currentBalance, ko)}
            </div>
            <div style={{ fontSize: "11.5px", color: TEXT_BODY, lineHeight: 1.55, marginTop: "4px" }}>
              {buildPrescriptionAction(weeks, currentBalance, ko)}
            </div>
          </div>
        </div>
      </div>

      {/* ── 13주 표 (간략) ── */}
      <details style={{ marginTop: "12px" }}>
        <summary
          style={{
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: 600,
            color: MIDNIGHT_SOFT,
            padding: "4px 0",
          }}
        >
          {ko ? "주별 상세 보기" : "Show weekly details"}
        </summary>
        <div
          style={{
            marginTop: "8px",
            display: "grid",
            gap: "4px",
            fontSize: "11px",
          }}
        >
          {weeks.map((w) => (
            <div
              key={w.weekIndex}
              style={{
                display: "grid",
                gridTemplateColumns: "60px 1fr 1fr 1fr",
                gap: "8px",
                padding: "6px 8px",
                borderRadius: "6px",
                background: w.isNegative ? ROSE_BG : "transparent",
                color: w.isNegative ? ROSE_TEXT : TEXT_BODY,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span style={{ fontWeight: 700 }}>
                {ko ? `${w.weekIndex + 1}주` : `W${w.weekIndex + 1}`}
              </span>
              <span style={{ color: SKY }}>+{formatWon(w.inflow)}</span>
              <span style={{ color: w.outflow > 0 ? "#9F1A2D" : TEXT_MUTED }}>
                −{formatWon(w.outflow)}
              </span>
              <span style={{ fontWeight: 700, textAlign: "right" }}>
                {formatWon(w.endBalance)}
              </span>
            </div>
          ))}
        </div>
      </details>
    </article>
  );
}

// ─── AI 처방 로직 ──────────────────────────────────────────────────
//
// 룰 기반 처방 — 외부 AI 호출 없이 즉시 응답. 데이터 패턴이 명확해
// LLM 보다 결정론적·빠름·무료. 향후 quick-query AI 와 연결도 가능.

function buildPrescriptionHeadline(
  weeks: WeekBucket[],
  currentBalance: number,
  ko: boolean,
): string {
  const firstNeg = weeks.find((w) => w.isNegative);
  if (firstNeg) {
    const shortfall = Math.abs(firstNeg.minBalance);
    return ko
      ? `${firstNeg.weekIndex + 1}주 후 ${formatWon(shortfall)} 부족이 예상됩니다.`
      : `Shortfall of ${formatWon(shortfall)} expected in week ${firstNeg.weekIndex + 1}.`;
  }
  const finalBalance = weeks[weeks.length - 1].endBalance;
  if (finalBalance < currentBalance * 0.5) {
    return ko
      ? `13주 후 잔고가 절반 이하(${formatWon(finalBalance)})로 줄어듭니다.`
      : `Balance drops below half (${formatWon(finalBalance)}) in 13 weeks.`;
  }
  return ko
    ? `13주 후 잔고는 ${formatWon(finalBalance)} — 안정적입니다.`
    : `Stable: ${formatWon(finalBalance)} at week 13.`;
}

function buildPrescriptionAction(
  weeks: WeekBucket[],
  currentBalance: number,
  ko: boolean,
): string {
  const firstNeg = weeks.find((w) => w.isNegative);
  if (firstNeg) {
    const weeksLeft = firstNeg.weekIndex;
    const shortfall = Math.abs(firstNeg.minBalance);
    if (weeksLeft <= 4) {
      return ko
        ? `긴급: ${weeksLeft}주 안에 ${formatWon(shortfall)} 확보가 필요합니다. ① 정책자금(소상공인 일반경영안정자금) 신청 검토, ② 단골 win-back 캠페인으로 즉시 매출 회복, ③ 고정비 1개 일시 축소를 검토해 주세요.`
        : `Urgent: secure ${formatWon(shortfall)} within ${weeksLeft} weeks. ① Apply for policy fund, ② Run win-back campaign, ③ Trim 1 fixed expense.`;
    }
    return ko
      ? `${weeksLeft}주 여유가 있으니 지금부터 매출 +${(shortfall / weeksLeft / 1_000_000).toFixed(1)}백만/주 또는 비용 절감으로 메꿀 수 있습니다. 객단가 +10% (사이드메뉴·세트구성) 또는 단골 재방문 5%↑ 가 가장 빠른 길입니다.`
      : `${weeksLeft} weeks of runway. Bridge with revenue +₩${(shortfall / weeksLeft / 1_000_000).toFixed(1)}M/week. Easiest: avg-ticket +10% via upsell.`;
  }
  const finalBalance = weeks[weeks.length - 1].endBalance;
  if (finalBalance < currentBalance * 0.5) {
    return ko
      ? `위기는 아니지만 잔고가 조금씩 줄고 있습니다. 비용 구조 점검(프라임코스트 65% 이하 유지)과 단골 재방문 캠페인을 권장합니다.`
      : `No crisis, but balance is shrinking. Review cost structure and run a retention campaign.`;
  }
  return ko
    ? `현재 흐름이 좋습니다. 잔고 여유분으로 1개 새로운 실험(메뉴 추가·마케팅 채널)을 권장합니다.`
    : `Healthy cashflow. Use surplus for one experiment (new menu / channel).`;
}

// ─── helpers ───────────────────────────────────────────────────────

function formatWon(won: number): string {
  if (won === 0) return "0원";
  const abs = Math.abs(won);
  const sign = won < 0 ? "-" : "";
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000) return `${sign}${Math.round(abs / 10_000).toLocaleString()}만`;
  return `${sign}${abs.toLocaleString()}원`;
}

function Stat({
  label,
  value,
  subValue,
  tone,
}: {
  label: string;
  value: string;
  subValue?: string;
  tone: "midnight" | "amber" | "rose";
}) {
  const color = tone === "rose" ? ROSE_TEXT : tone === "amber" ? AMBER_TEXT : MIDNIGHT_DEEP;
  const bg = tone === "rose" ? ROSE_BG : tone === "amber" ? AMBER_BG : SURFACE_LAVENDER;
  return (
    <div style={{ padding: "12px 14px", borderRadius: "12px", background: bg, border: `1px solid ${HAIRLINE}` }}>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: MIDNIGHT_SOFT,
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {subValue && (
        <div style={{ fontSize: "10.5px", color: MIDNIGHT_SOFT, marginTop: "2px" }}>{subValue}</div>
      )}
    </div>
  );
}

// ─── styles ────────────────────────────────────────────────────────

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

const statsRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "8px",
};

const prescriptionCrisis: React.CSSProperties = {
  marginTop: "14px",
  padding: "14px 16px",
  background: ROSE_BG,
  border: `1px solid rgba(180,35,52,0.25)`,
  borderRadius: "12px",
};

const prescriptionSafe: React.CSSProperties = {
  marginTop: "14px",
  padding: "14px 16px",
  background: SURFACE_LAVENDER,
  border: `1px solid ${HAIRLINE}`,
  borderRadius: "12px",
};

const emptyBox: React.CSSProperties = {
  padding: "16px",
  background: SURFACE_LAVENDER,
  border: `1px dashed ${HAIRLINE_STRONG}`,
  borderRadius: "12px",
};

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  fontSize: "13px",
  fontWeight: 650,
  padding: "10px 16px",
  borderRadius: "10px",
  border: "none",
  background: `linear-gradient(135deg, ${MIDNIGHT} 0%, #2C4F80 100%)`,
  color: "#fff",
  cursor: "pointer",
  letterSpacing: "-0.01em",
  boxShadow: "0 2px 8px rgba(30,42,85,0.18)",
};

const settingsBtn: React.CSSProperties = {
  width: "32px",
  height: "32px",
  border: `1px solid ${HAIRLINE}`,
  background: "#fff",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
