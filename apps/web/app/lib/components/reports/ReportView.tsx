"use client";

/**
 * ReportView — period 별 정식 보고서 본문.
 *
 * 디자인 철학 (Found.One):
 *   - Apple 미니멀 + Midnight #191970 단색 + 1px outline
 *   - 사이드 컬러 strip 절대 금지 — 1px outline + 살짝 틴트 배경으로 대체
 *   - lucide stroke 1.5, round caps, 8 배수 size
 *   - 큰 숫자 hero (period에 따라 다름: 일·주·월=매출, 분기=마진)
 *   - bento-card 클래스로 hover transition 통일
 *
 * 레이아웃:
 *   1. Hero — eyebrow + 큰 숫자(매출 or 마진) + 변화율
 *   2. 보조 KPI 3 (hero가 매출이면 비용·마진·Prime / 분기는 매출·비용·Prime)
 *   3. ReportChart (period 별 시리즈)
 *   4. ReportDonut (도넛 + bar + sparkline + delta — 4종 viz)
 *   5. 이상 신호 (있을 때만)
 *   6. 다음 액션 + 거장 인용 + 미사용 기능 nudge
 *   7. 분기에만: 분기 회고 단일 카드 (거장 + K-히트 + 다음 1가지)
 *   8. PDF/CSV placeholder (Phase 2)
 */

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Quote, Sparkles, FileDown, BookOpen } from "lucide-react";
import { useReportSnapshot, type ReportPeriod } from "../../hooks/useReportSnapshot";
import { useMorningBriefingBrain } from "../../hooks/useMorningBriefingBrain";
import { useFeatureNudges } from "../../hooks/useFeatureNudges";
import { useReportAIInsight } from "../../hooks/useReportAIInsight";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { isBusinessDayClosed, dailyReportActiveTimeLabel } from "../../utils/business-day";
import { useProfileStore } from "../../stores/profile-store";
import { useFinanceStore } from "../../stores/finance-store";
import { ReportChart } from "./ReportChart";
import { ReportDonut } from "./ReportDonut";
import { ReportEmptyState } from "./ReportEmptyState";
import { pickReportWisdom } from "./report-wisdom";
import {
  getKHitCasesForCategory,
  detectBusinessSituation,
  matchCaseStudies,
  type CaseStudy,
  type BusinessSituation,
} from "@foundone/shared";

const MIDNIGHT = "#191970";
const MIDNIGHT_DEEP = "#0f0f4a";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";
const GREEN = "#1d3557";
const RED = "#b64c4c";

type Props = { period: ReportPeriod };

const fmtKrw = (n: number): string => {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만원`;
  return `${Math.round(n).toLocaleString()}원`;
};

const fmtPct = (n: number | null): string => n == null ? "-" : `${n}%`;

export function ReportView({ period }: Props) {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const businessCloseTime = useProfileStore((s) => s.businessCloseTime);
  const costHistory = useFinanceStore((s) => s.costHistory);

  // 일일 보고서: 영업 종료 전이면 어제 영업일 기준 보고서를 보여줌.
  // 다음날 영업 종료 시점에 자동으로 새 영업일 보고서로 롤오버.
  const isDayClosed = useMemo(() => {
    if (period !== "day") return true;
    return isBusinessDayClosed(new Date(), {
      categoryId: d.industryCategoryId,
      closeTime: businessCloseTime,
    });
  }, [period, d.industryCategoryId, businessCloseTime]);

  const referenceNow = useMemo<Date | undefined>(() => {
    if (period !== "day") return undefined;
    if (isDayClosed) return undefined;
    // 영업 중 → 어제 정오 기준 (timezone 안전)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    return yesterday;
  }, [period, isDayClosed]);

  const snap = useReportSnapshot(d, period, referenceNow);
  const brain = useMorningBriefingBrain(d);
  const nudges = useFeatureNudges(d, brain.phase);
  const aiInsight = useReportAIInsight(snap, brain, d.industryCategoryId, referenceNow);

  // 이전 기간 비용 분해 + 6개월 추이 (ReportDonut prop)
  const prevCostBreakdown = useMemo(() => {
    if (!costHistory || costHistory.length === 0) return undefined;
    if (period === "month") {
      // 한 달 전 snapshot
      const prev = costHistory[costHistory.length - 2];
      return prev ? { ingredients: prev.ingredients, labor: prev.labor, rent: prev.rent, utilities: prev.utilities, other: prev.other } : undefined;
    }
    if (period === "quarter") {
      // 3개월 전 snapshot
      const prev = costHistory[costHistory.length - 4];
      return prev ? { ingredients: prev.ingredients, labor: prev.labor, rent: prev.rent, utilities: prev.utilities, other: prev.other } : undefined;
    }
    return undefined;
  }, [costHistory, period]);

  const costTrend = useMemo(() => {
    if (!costHistory || costHistory.length === 0) return undefined;
    const last6 = costHistory.slice(-6);
    return {
      ingredients: last6.map((h) => h.ingredients),
      labor: last6.map((h) => h.labor),
      rent: last6.map((h) => h.rent),
      utilities: last6.map((h) => h.utilities),
      other: last6.map((h) => h.other),
    };
  }, [costHistory]);

  // 현재 상황에 맞는 실제 기업 사례 매칭 (클라이언트 사이드, 추가 API 호출 없음).
  //   ⚠️ 훅(useMemo)은 아래 빈-상태 early return 보다 위에 있어야 함(rules-of-hooks).
  const benchmarkCase = useMemo<{ study: CaseStudy; situation: BusinessSituation } | null>(() => {
    if (!d.industryCategoryId) return null;
    const weeklyChange = brain.weeklyChangePct ?? snap.revenueChangePct ?? 0;
    const situation = detectBusinessSituation({
      runway: snap.marginKrw >= 0 ? -1 : 1,
      monthlySales: snap.revenueKrw,
      weeklyChange,
      primeRate: snap.primeRatePct ?? 0,
      daysSinceLaunch: brain.daysSinceLaunch ?? 0,
      categoryId: d.industryCategoryId,
      // 이번 기간 변화율이 ±5% 이내면 4주 정체로 간주 → marketing-stagnant 감지
      consecutiveFlatWeeks:
        snap.revenueChangePct != null && Math.abs(snap.revenueChangePct) <= 5 ? 4 : undefined,
    });
    if (!situation) return null;
    const cases = matchCaseStudies(situation, d.industryCategoryId);
    if (cases.length === 0) return null;
    // period 기반 안정적 픽 (같은 기간 = 같은 회사, 매 조회마다 바뀌지 않음)
    const now = new Date();
    const seed =
      period === "day" ? now.getDate() :
      period === "week" ? Math.floor(now.getDate() / 7) :
      period === "month" ? now.getMonth() :
      Math.floor(now.getMonth() / 3);
    return { study: cases[seed % cases.length], situation };
  }, [snap, brain, d.industryCategoryId, period]);

  // ── Empty / business-open 분기 ──
  // 영업 중이면 어제 영업일 보고서를 보여줌. 어제 데이터도 없을 때만 빈 안내.
  if (period === "day" && !isDayClosed && snap.insufficientData) {
    return (
      <ReportEmptyState
        ko={ko}
        kind="business-open"
        activeAt={dailyReportActiveTimeLabel({ categoryId: d.industryCategoryId, closeTime: businessCloseTime })}
      />
    );
  }
  if (snap.insufficientData) {
    return (
      <ReportEmptyState
        ko={ko}
        kind="insufficient"
        period={period}
        entriesCount={snap.daysWithSales}
        requiredCount={period === "week" ? 7 : period === "month" ? 14 : period === "quarter" ? 30 : 1}
      />
    );
  }

  // ── Hero metric: 일·주·월=매출, 분기=마진 ──
  const heroMetric: { label: { ko: string; en: string }; value: number; valueColor?: string } =
    period === "quarter"
      ? { label: { ko: "마진", en: "Margin" }, value: snap.marginKrw, valueColor: snap.marginKrw >= 0 ? "#0f172a" : RED }
      : { label: { ko: "매출", en: "Revenue" }, value: snap.revenueKrw };

  const wisdom = pickReportWisdom(period, ko);
  const topNudge = nudges[0];
  const isQuarter = period === "quarter";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ── 1. Hero ── */}
      <div style={heroCardStyle} className="bento-card">
        <div style={heroEyebrow}>
          {period === "day" && !isDayClosed && (
            <span style={yesterdayBadge}>{ko ? "어제 영업일" : "Yesterday"}</span>
          )}
          {snap.label} · {ko ? heroMetric.label.ko : heroMetric.label.en}
        </div>
        <div style={{ ...heroValue, color: heroMetric.valueColor ?? MIDNIGHT_DEEP }}>
          {fmtKrw(heroMetric.value)}
        </div>
        {snap.revenueChangePct != null && (
          <div style={heroTrendRow}>
            <TrendIcon change={snap.revenueChangePct} />
            <span style={{ fontWeight: 700, color: trendColor(snap.revenueChangePct), fontSize: 14 }}>
              {snap.revenueChangePct >= 0 ? "+" : ""}{snap.revenueChangePct}%
            </span>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>
              {ko ? "이전 기간 대비" : "vs previous"}
            </span>
          </div>
        )}
        <div style={heroHeadlineSub}>{snap.headline}</div>
      </div>

      {/* ── 2. 보조 KPI 3 ── */}
      <div style={kpiGridStyle}>
        {period === "quarter" ? (
          <>
            <KPI label={ko ? "매출" : "Revenue"} value={fmtKrw(snap.revenueKrw)} sub={ko ? `일평균 ${fmtKrw(snap.avgDailyRevenue)}` : `Avg/day ${fmtKrw(snap.avgDailyRevenue)}`} />
            <KPI label={ko ? "비용" : "Costs"} value={fmtKrw(snap.costsKrw)} sub={snap.marginPct != null ? `${ko ? "마진율" : "Margin"} ${snap.marginPct}%` : undefined} />
            <KPI
              label={ko ? "프라임코스트" : "Prime cost"}
              value={fmtPct(snap.primeRatePct)}
              valueColor={snap.primeRatePct != null && snap.primeRatePct > 65 ? RED : "#0f172a"}
              sub={ko ? "재료 + 인건" : "Ingred. + labor"}
            />
          </>
        ) : (
          <>
            <KPI label={ko ? "비용" : "Costs"} value={fmtKrw(snap.costsKrw)} sub={ko ? `일수 ${snap.daysWithSales}` : `Days ${snap.daysWithSales}`} />
            <KPI
              label={ko ? "마진" : "Margin"}
              value={fmtKrw(snap.marginKrw)}
              valueColor={snap.marginKrw >= 0 ? GREEN : RED}
              sub={snap.marginPct != null ? `${snap.marginPct}%` : undefined}
            />
            <KPI
              label={ko ? "프라임코스트" : "Prime cost"}
              value={fmtPct(snap.primeRatePct)}
              valueColor={snap.primeRatePct != null && snap.primeRatePct > 65 ? RED : "#0f172a"}
              sub={ko ? "재료 + 인건" : "Ingred. + labor"}
            />
          </>
        )}
      </div>

      {/* ── 3. Chart ── */}
      <ReportChart ko={ko} period={period} series={snap.chartSeries} />

      {/* ── 4. ReportDonut (도넛 + bar + sparkline + delta) ── */}
      {snap.costsKrw > 0 && (
        <ReportDonut
          ko={ko}
          current={snap.costBreakdown}
          prev={prevCostBreakdown}
          trend={costTrend}
          label={snap.label}
        />
      )}

      {/* ── 5. 이상 신호 ── */}
      {brain.topAnomaly && (
        <div style={anomalyCardStyle} className="bento-card">
          <div style={anomalyHeader}>
            <AlertTriangle size={14} strokeWidth={1.5} style={{ color: RED }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: RED, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {ko ? "이상 신호" : "Anomaly"}
            </span>
            {brain.anomalyContext && (
              <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto" }}>
                {brain.anomalyContext.label}
              </span>
            )}
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "#7f1d1d", letterSpacing: "-0.005em", marginTop: 4 }}>
            {brain.topAnomaly.headline}
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(127,29,29,0.85)", lineHeight: 1.55, marginTop: 4 }}>
            {brain.topAnomaly.analysis}
          </div>
        </div>
      )}

      {/* ── 6. AI 인사이트 ── */}
      {(aiInsight.loading || aiInsight.insight) && (
        <div style={aiInsightCardStyle} className="bento-card">
          <div style={aiInsightHeader}>
            <Sparkles size={12} strokeWidth={1.5} style={{ color: MIDNIGHT }} />
            <span style={cardEyebrow}>{ko ? "AI 인사이트" : "AI Insight"}</span>
          </div>
          {aiInsight.loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <div style={skeletonLine} />
              <div style={{ ...skeletonLine, width: "75%" }} />
            </div>
          ) : (
            <div style={aiInsightText}>{aiInsight.insight}</div>
          )}
        </div>
      )}

      {/* ── 7. 비슷한 상황의 기업 사례 ── */}
      {benchmarkCase && (
        <BenchmarkCaseCard
          study={benchmarkCase.study}
          situation={benchmarkCase.situation}
          ko={ko}
        />
      )}

      {/* ── 8. 다음 액션 + 거장 인용 + nudge ── */}
      <div style={actionCardStyle} className="bento-card">
        <div style={cardEyebrow}>{ko ? "다음 액션" : "Next action"}</div>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: "#0f172a", lineHeight: 1.6 }}>
          {snap.nextAction}
        </div>

        {/* 거장 인용 — 모든 period (분기는 더 큰 quarterly 카드가 아래 또 있음) */}
        {!isQuarter && (
          <div style={wisdomInline}>
            <Quote size={13} strokeWidth={1.5} style={{ color: MIDNIGHT, opacity: 0.6, flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 12.5, color: "rgba(15,23,42,0.7)", fontStyle: "italic", lineHeight: 1.55 }}>
              {wisdom}
            </span>
          </div>
        )}

        {topNudge && (
          <div style={nudgeBox}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>
              {ko ? "함께 켜두면 좋은 기능" : "Try this too"}
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.7)", lineHeight: 1.5 }}>
              {ko ? topNudge.subKo : topNudge.subEn}
            </div>
          </div>
        )}
      </div>

      {/* ── 9. 분기 회고 카드 (단일) ── */}
      {isQuarter && <QuarterlyReflection ko={ko} categoryId={d.industryCategoryId} wisdom={wisdom} />}

      {/* ── 10. Export placeholder ── */}
      <button type="button" disabled style={exportPlaceholder}>
        <FileDown size={13} strokeWidth={1.5} />
        {ko ? "보고서 PDF · CSV 내보내기 (준비 중)" : "Export PDF · CSV (coming soon)"}
      </button>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function KPI({ label, value, valueColor, sub }: { label: string; value: string; valueColor?: string; sub?: string }) {
  return (
    <div style={kpiCardStyle} className="bento-card">
      <div style={kpiLabel}>{label}</div>
      <div style={{ ...kpiValue, color: valueColor ?? "#0f172a" }}>{value}</div>
      {sub && <div style={kpiSub}>{sub}</div>}
    </div>
  );
}

function TrendIcon({ change }: { change: number }) {
  if (change >= 5) return <TrendingUp size={14} strokeWidth={1.6} style={{ color: GREEN }} />;
  if (change <= -5) return <TrendingDown size={14} strokeWidth={1.6} style={{ color: RED }} />;
  return <Minus size={14} strokeWidth={1.6} style={{ color: "var(--muted)" }} />;
}

function trendColor(change: number): string {
  if (change >= 5) return GREEN;
  if (change <= -5) return RED;
  return "rgba(15,23,42,0.6)";
}

const SITUATION_LABEL: Record<BusinessSituation, { ko: string; en: string }> = {
  "funding-crisis":       { ko: "자금 위기",   en: "Funding crisis" },
  "pmf-not-found":        { ko: "PMF 미검증",  en: "PMF not found" },
  "revenue-decline":      { ko: "매출 하락",   en: "Revenue decline" },
  "competitor-pressure":  { ko: "경쟁 심화",   en: "Competition" },
  "cost-crisis":          { ko: "비용 위기",   en: "Cost crisis" },
  "scaling-decision":     { ko: "확장 고민",   en: "Scaling" },
  "small-biz-turnaround": { ko: "반전 필요",   en: "Turnaround" },
  "talent-acquisition":   { ko: "인재 부족",   en: "Talent gap" },
  "marketing-stagnant":   { ko: "성장 정체",   en: "Growth stall" },
  "menu-fatigue":         { ko: "메뉴 피로",   en: "Menu fatigue" },
  "delivery-dependency":  { ko: "배달 의존",   en: "Delivery dependency" },
  "seasonal-slump":       { ko: "계절 비수기", en: "Seasonal slump" },
  "expansion-ready":      { ko: "확장 준비",   en: "Expansion ready" },
  "staff-crisis":         { ko: "인력 위기",   en: "Staff crisis" },
  "rent-crisis":          { ko: "임대료 위기", en: "Rent crisis" },
};

function BenchmarkCaseCard({
  study,
  situation,
  ko,
}: {
  study: CaseStudy;
  situation: BusinessSituation;
  ko: boolean;
}) {
  const sLabel = SITUATION_LABEL[situation];
  return (
    <div style={benchmarkCardStyle} className="bento-card">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <BookOpen size={12} strokeWidth={1.5} style={{ color: MIDNIGHT }} />
        <span style={cardEyebrow}>{ko ? "비슷한 상황의 기업들은?" : "How others handled this"}</span>
        <span style={benchmarkBadge}>{ko ? sLabel.ko : sLabel.en}</span>
      </div>

      {/* Company name */}
      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
        {study.company}
      </div>

      {/* Narrative */}
      <div style={{ fontSize: 13.5, color: "rgba(15,23,42,0.78)", lineHeight: 1.65 }}>
        {study.oneLiner}
      </div>

      {/* Lesson pill */}
      <div style={benchmarkLesson}>
        <span style={{ fontSize: 13 }}>💡</span>
        <span style={{ fontSize: 12.5, color: MIDNIGHT, fontWeight: 600, lineHeight: 1.5 }}>
          {study.lesson}
        </span>
      </div>
    </div>
  );
}

function QuarterlyReflection({ ko, categoryId, wisdom }: { ko: boolean; categoryId?: string; wisdom: string }) {
  const kHitCase = useMemo(() => {
    if (!categoryId) return null;
    const cases = getKHitCasesForCategory(categoryId);
    if (cases.length === 0) return null;
    const now = new Date();
    const seed = now.getFullYear() * 4 + Math.floor(now.getMonth() / 3);
    return cases[seed % cases.length];
  }, [categoryId]);

  return (
    <div style={quarterlyCardStyle} className="bento-card">
      <div style={cardEyebrow}>
        <Sparkles size={12} strokeWidth={1.5} style={{ display: "inline-block", verticalAlign: -1, marginRight: 4, color: MIDNIGHT }} />
        {ko ? "분기 회고" : "Quarterly reflection"}
      </div>

      {/* 1. 거장 인용 */}
      <div style={quarterlySection}>
        <div style={quarterlySectionLabel}>{ko ? "한 줄로 시작" : "Start with one line"}</div>
        <div style={quarterlyQuote}>
          <Quote size={14} strokeWidth={1.5} style={{ color: MIDNIGHT, opacity: 0.6, flexShrink: 0, marginTop: 3 }} />
          <span style={{ fontSize: 14.5, color: "#0f172a", fontStyle: "italic", lineHeight: 1.6, fontWeight: 500 }}>
            {wisdom}
          </span>
        </div>
      </div>

      {/* 2. K-히트 사례 */}
      {kHitCase && (
        <div style={quarterlySection}>
          <div style={quarterlySectionLabel}>{ko ? "이 업종에서 배울 점" : "What this industry teaches"}</div>
          <div style={kHitName}>{ko ? kHitCase.name.ko : kHitCase.name.en}</div>
          <div style={kHitOneLiner}>{ko ? kHitCase.oneLiner.ko : kHitCase.oneLiner.en}</div>
          <div style={kHitLessonBox}>
            <strong style={{ color: MIDNIGHT, marginRight: 6, fontSize: 11.5 }}>{ko ? "교훈" : "Lesson"}</strong>
            <span style={{ fontSize: 12.5, color: "#0f172a", lineHeight: 1.55 }}>{ko ? kHitCase.lesson.ko : kHitCase.lesson.en}</span>
          </div>
        </div>
      )}

      {/* 3. 다음 분기 한 가지 */}
      <div style={quarterlySection}>
        <div style={quarterlySectionLabel}>{ko ? "다음 분기 한 가지 우선순위" : "Next quarter — one priority"}</div>
        <div style={{ fontSize: 13.5, color: "rgba(15,23,42,0.75)", lineHeight: 1.65 }}>
          {ko
            ? "지난 분기에 잘 된 한 가지를 강화할지, 새 실험을 시작할지 — 1주일 안에 정해 보세요. 매일 아침 그 한 가지를 위해 1시간을 비워두면, 90일 뒤에 다른 결과가 보입니다."
            : "Either amplify what worked, or start one new experiment — decide within a week. Reserve 1 hour every morning for that one thing; the result will look different in 90 days."}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────

const heroCardStyle: React.CSSProperties = {
  background: "white",
  border: `1px solid ${MIDNIGHT_BORDER}`,
  borderRadius: 22,
  padding: "26px 28px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const heroEyebrow: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: MIDNIGHT,
  opacity: 0.65,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  marginBottom: 8,
};

const heroValue: React.CSSProperties = {
  fontSize: 40,
  fontWeight: 750,
  letterSpacing: "-0.035em",
  lineHeight: 1.05,
};

const heroTrendRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginTop: 8,
};

const heroHeadlineSub: React.CSSProperties = {
  fontSize: 13.5,
  color: "rgba(15,23,42,0.65)",
  lineHeight: 1.6,
  marginTop: 12,
  paddingTop: 12,
  borderTop: "1px solid rgba(15,23,42,0.06)",
};

const kpiGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 10,
};

const kpiCardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid rgba(15,23,42,0.07)",
  borderRadius: 14,
  padding: "14px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const kpiLabel: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  color: "var(--muted)",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
};

const kpiValue: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 750,
  letterSpacing: "-0.02em",
  marginTop: 2,
};

const kpiSub: React.CSSProperties = {
  fontSize: 11.5,
  color: "var(--muted)",
  fontFamily: "ui-monospace, monospace",
};

const anomalyCardStyle: React.CSSProperties = {
  background: "rgba(182,76,76,0.03)",
  border: "1px solid rgba(182,76,76,0.18)",
  borderRadius: 16,
  padding: "16px 18px",
};

const anomalyHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const actionCardStyle: React.CSSProperties = {
  background: MIDNIGHT_SOFT,
  border: `1px solid ${MIDNIGHT_BORDER}`,
  borderRadius: 18,
  padding: "18px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const cardEyebrow: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--muted)",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
};

const wisdomInline: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 6,
  paddingTop: 6,
  borderTop: "1px solid rgba(25,25,112,0.10)",
  marginTop: 4,
};

const nudgeBox: React.CSSProperties = {
  marginTop: 4,
  padding: "10px 12px",
  borderRadius: 10,
  background: "white",
  border: "1px solid rgba(25,25,112,0.10)",
};

const quarterlyCardStyle: React.CSSProperties = {
  background: "linear-gradient(140deg, rgba(25,25,112,0.04) 0%, rgba(25,25,112,0.01) 100%)",
  border: `1px solid ${MIDNIGHT_BORDER}`,
  borderRadius: 22,
  padding: "24px 26px",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const quarterlySection: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const quarterlySectionLabel: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  color: MIDNIGHT,
  opacity: 0.7,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
};

const quarterlyQuote: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
};

const kHitName: React.CSSProperties = {
  fontSize: 14.5,
  fontWeight: 700,
  color: "#0f172a",
  letterSpacing: "-0.01em",
};

const kHitOneLiner: React.CSSProperties = {
  fontSize: 12.5,
  color: "rgba(15,23,42,0.65)",
  lineHeight: 1.6,
  marginTop: 2,
};

const kHitLessonBox: React.CSSProperties = {
  marginTop: 6,
  padding: "9px 12px",
  borderRadius: 10,
  background: "rgba(25,25,112,0.05)",
};

const yesterdayBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 999,
  background: "rgba(25,25,112,0.10)",
  color: MIDNIGHT,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.04em",
  marginRight: 8,
  verticalAlign: "1px",
};

const benchmarkCardStyle: React.CSSProperties = {
  background: "white",
  border: `1px solid ${MIDNIGHT_BORDER}`,
  borderRadius: 16,
  padding: "16px 18px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const benchmarkBadge: React.CSSProperties = {
  marginLeft: "auto",
  fontSize: 10,
  fontWeight: 700,
  padding: "2px 8px",
  borderRadius: 9999,
  background: "rgba(25,25,112,0.07)",
  color: MIDNIGHT,
  letterSpacing: "0.03em",
};

const benchmarkLesson: React.CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "flex-start",
  padding: "8px 10px",
  borderRadius: 10,
  background: "rgba(25,25,112,0.04)",
  border: "1px solid rgba(25,25,112,0.08)",
  marginTop: 2,
};

const aiInsightCardStyle: React.CSSProperties = {
  background: MIDNIGHT_SOFT,
  border: `1px solid ${MIDNIGHT_BORDER}`,
  borderRadius: 16,
  padding: "16px 18px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const aiInsightHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const aiInsightText: React.CSSProperties = {
  fontSize: 13.5,
  color: "rgba(15,23,42,0.8)",
  lineHeight: 1.65,
};

const skeletonLine: React.CSSProperties = {
  height: 13,
  borderRadius: 6,
  background: "rgba(25,25,112,0.08)",
  width: "100%",
  animation: "pulse 1.5s ease-in-out infinite",
};

const exportPlaceholder: React.CSSProperties = {
  alignSelf: "flex-end",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px dashed rgba(15,23,42,0.15)",
  background: "transparent",
  color: "var(--muted)",
  fontSize: 12,
  fontWeight: 600,
  cursor: "not-allowed",
  marginTop: 4,
};
