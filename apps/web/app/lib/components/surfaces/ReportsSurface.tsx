"use client";

/**
 * ReportsSurface — 일/주/월/분기 보고서 탭 surface.
 *
 * 디자인 철학 (build.up):
 *   - Apple 미니멀, Midnight 단색 + 1px outline
 *   - 사이드 컬러 strip 절대 금지
 *   - 도착 시퀀스 (영업 종료 직후 첫 진입 시 1회 alert chip + auto fade)
 *   - period 탭 전환은 framer-motion fade (Apple 스프링 이징)
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Calendar, CalendarRange, CalendarDays, CalendarCheck, ShieldCheck, Eye, Heart } from "lucide-react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { ReportView } from "../reports/ReportView";
import type { ReportPeriod } from "../../hooks/useReportSnapshot";
import { isBusinessDayClosed, dailyReportActiveTimeLabel } from "../../utils/business-day";
import { useProfileStore } from "../../stores/profile-store";

const MIDNIGHT = "#191970";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.18)";

const PERIOD_LABELS: Record<ReportPeriod, { ko: string; en: string }> = {
  day: { ko: "일일", en: "Daily" },
  week: { ko: "주간", en: "Weekly" },
  month: { ko: "월간", en: "Monthly" },
  quarter: { ko: "분기", en: "Quarterly" },
};

const ARRIVED_KEY = "buildup-daily-report-arrived-day";

export function ReportsSurface() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const [period, setPeriod] = useState<ReportPeriod>("day");
  const businessCloseTime = useProfileStore((s) => s.businessCloseTime);

  // 도착 시퀀스 — 영업 종료 직후 첫 진입 시 1회 chip 노출
  const closed = useMemo(
    () => isBusinessDayClosed(new Date(), { categoryId: d.industryCategoryId, closeTime: businessCloseTime }),
    [d.industryCategoryId, businessCloseTime],
  );
  const activeAt = dailyReportActiveTimeLabel({ categoryId: d.industryCategoryId, closeTime: businessCloseTime });
  const [arrivedVisible, setArrivedVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!closed) return;
    const today = new Date().toISOString().slice(0, 10);
    const last = window.localStorage.getItem(ARRIVED_KEY);
    if (last === today) return;
    window.localStorage.setItem(ARRIVED_KEY, today);
    setArrivedVisible(true);
    const t = window.setTimeout(() => setArrivedVisible(false), 4500);
    return () => window.clearTimeout(t);
  }, [closed]);

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div style={eyebrowStyle}>{ko ? "REPORTS" : "REPORTS"}</div>
        <h1 style={titleStyle}>{ko ? "내 가게 보고서" : "Store Reports"}</h1>
        <p style={subtitleStyle}>
          {ko
            ? "매일 · 매주 · 매달 · 매분기 흐름을 정리해 보여드려요. 모든 수치는 사장님 입력 데이터 기반."
            : "Day · Week · Month · Quarter — grounded in your inputs only."}
        </p>
      </header>

      {/* 도착 시퀀스 alert chip — 영업 종료 직후 첫 진입 1회 */}
      <AnimatePresence>
        {arrivedVisible && (
          <motion.div
            key="arrived-chip"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            style={arrivedChipStyle}
          >
            <Sparkles size={12} strokeWidth={1.5} style={{ color: "white" }} />
            <span>{ko ? `오늘 보고서가 도착했어요 · ${activeAt} 기준` : `Today's report has arrived · ${activeAt}`}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Period tabs */}
      <div style={tabsRow}>
        {(["day", "week", "month", "quarter"] as ReportPeriod[]).map((p) => {
          const sel = period === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              style={{
                ...tabStyle,
                borderColor: sel ? MIDNIGHT : "rgba(15,23,42,0.08)",
                background: sel ? MIDNIGHT : "white",
                color: sel ? "white" : "#0f172a",
                fontWeight: sel ? 700 : 600,
              }}
            >
              {ko ? PERIOD_LABELS[p].ko : PERIOD_LABELS[p].en}
            </button>
          );
        })}
      </div>

      {/* Period 별 본문 — Apple 스프링 fade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
        >
          <ReportView period={period} />
        </motion.div>
      </AnimatePresence>

      {/* ── 보고서 정보 footer — 왜 중요한가 / 무엇이 담기는가 ── */}
      <ReportsAboutSection ko={ko} />
    </main>
  );
}

/**
 * 보고서가 왜 필요한지·각 period가 어떤 의미인지·어떤 데이터가 담기는지 설명.
 * 사장님이 처음 진입했을 때 "이게 뭐지?" 궁금증을 1번에 해소.
 */
function ReportsAboutSection({ ko }: { ko: boolean }) {
  return (
    <section style={aboutSectionStyle}>
      {/* 왜 중요한가 */}
      <div style={aboutCardStyle} className="bento-card">
        <div style={aboutHeader}>
          <div style={aboutIconWrap}>
            <Heart size={14} strokeWidth={1.5} style={{ color: MIDNIGHT }} />
          </div>
          <div style={aboutEyebrow}>{ko ? "보고서가 왜 중요한가" : "Why reports matter"}</div>
        </div>
        <div style={aboutBody}>
          {ko
            ? "사장님은 매일 너무 많은 일에 둘러싸여 있어요. 한 발 떨어져서 「이번 주는 어땠지」 「이번 달은 잘 됐나」 보는 시간이 없으면 흐름이 보이지 않습니다. 보고서는 사장님 대신 숫자를 정리해 두는 자리예요. 매일 1분, 매주 5분, 매분기 한 번 — 그것이 다음 분기를 결정합니다."
            : "Owners are buried in daily work. Without stepping back to see weekly/monthly patterns, the flow stays invisible. Reports keep the numbers tidy for you — 1 min daily, 5 min weekly, once per quarter. That's what shapes the next 90 days."}
        </div>
      </div>

      {/* 4개 period 의미 */}
      <div style={aboutCardStyle} className="bento-card">
        <div style={aboutHeader}>
          <div style={aboutIconWrap}>
            <CalendarRange size={14} strokeWidth={1.5} style={{ color: MIDNIGHT }} />
          </div>
          <div style={aboutEyebrow}>{ko ? "각 보고서가 답하는 질문" : "What each report answers"}</div>
        </div>
        <ul style={periodListStyle}>
          <li style={periodItemStyle}>
            <Calendar size={13} strokeWidth={1.5} style={{ color: MIDNIGHT, flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={periodNameStyle}>{ko ? "일일" : "Daily"}</strong>
              <span style={periodDescStyle}>
                {ko ? " — 오늘 매출이 어제·7일 평균과 비교해 어땠나? 영업 종료 후 정리." : " — How did today compare to yesterday/7-day avg? Available after business hours close."}
              </span>
            </div>
          </li>
          <li style={periodItemStyle}>
            <CalendarDays size={13} strokeWidth={1.5} style={{ color: MIDNIGHT, flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={periodNameStyle}>{ko ? "주간" : "Weekly"}</strong>
              <span style={periodDescStyle}>
                {ko ? " — 이번 주 vs 지난 주, 요일 패턴이 보이기 시작합니다." : " — This week vs last week. Day-of-week patterns emerge."}
              </span>
            </div>
          </li>
          <li style={periodItemStyle}>
            <CalendarRange size={13} strokeWidth={1.5} style={{ color: MIDNIGHT, flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={periodNameStyle}>{ko ? "월간" : "Monthly"}</strong>
              <span style={periodDescStyle}>
                {ko ? " — 이번 달 매출·비용 구조의 결산. 프라임코스트가 위험선(65%)을 넘었는지." : " — Monthly settlement of revenue & costs. Did prime cost cross the 65% line?"}
              </span>
            </div>
          </li>
          <li style={periodItemStyle}>
            <CalendarCheck size={13} strokeWidth={1.5} style={{ color: MIDNIGHT, flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={periodNameStyle}>{ko ? "분기" : "Quarterly"}</strong>
              <span style={periodDescStyle}>
                {ko ? " — 90일을 한 호흡으로. 거장 한 줄 + 업종 K-히트 사례 + 다음 분기 1가지 우선순위." : " — 90 days in one breath. A wisdom line + industry K-hit case + one priority for next quarter."}
              </span>
            </div>
          </li>
        </ul>
      </div>

      {/* 어떤 데이터로 만들어지나 */}
      <div style={aboutCardStyle} className="bento-card">
        <div style={aboutHeader}>
          <div style={aboutIconWrap}>
            <Eye size={14} strokeWidth={1.5} style={{ color: MIDNIGHT }} />
          </div>
          <div style={aboutEyebrow}>{ko ? "보고서에 담기는 정보" : "What's inside each report"}</div>
        </div>
        <ul style={contentListStyle}>
          <li style={contentItemStyle}>{ko ? "기간별 매출 합계 + 이전 기간 대비 변화율" : "Period revenue total + change vs previous period"}</li>
          <li style={contentItemStyle}>{ko ? "비용 분해 — 도넛 + 항목별 막대 + 6개월 추이 sparkline + 변화 화살표" : "Cost breakdown — donut + per-item bar + 6-month sparkline + delta arrows"}</li>
          <li style={contentItemStyle}>{ko ? "마진·프라임코스트 (재료비 + 인건비) 비율" : "Margin & prime cost (ingredients + labor) ratio"}</li>
          <li style={contentItemStyle}>{ko ? "이상 신호 자동 감지 — 매출 하락·비용 급등·재고 부족·리뷰 무응답 등" : "Auto anomaly detection — sales drops, cost spikes, low stock, unanswered reviews"}</li>
          <li style={contentItemStyle}>{ko ? "다음 액션 한 가지 (룰 기반, 사장님 데이터에 정확히 맞춤)" : "One next action (rule-based, fitted to your data)"}</li>
          <li style={contentItemStyle}>{ko ? "거장 인용 1줄 (Bezos·Graham·Munger·Buffett 등, period별 다른 톤)" : "One line of wisdom (Bezos/Graham/Munger/Buffett — varies by period)"}</li>
        </ul>
      </div>

      {/* 보장 */}
      <div style={aboutGuaranteeStyle}>
        <ShieldCheck size={14} strokeWidth={1.5} style={{ color: MIDNIGHT, flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.65)", lineHeight: 1.6 }}>
          <strong style={{ color: MIDNIGHT, fontWeight: 700, marginRight: 4 }}>
            {ko ? "100% 사장님 데이터 기반" : "Built only from your data"}
          </strong>
          {ko
            ? "— AI 추측·외부 평균치 대체 0건. 매출·비용·재고 등 입력하신 숫자만 모아서 정리합니다. 외부 발송·이메일·공유 없음."
            : "— Zero AI guesses or external averages. Only the numbers you've entered. No external sending or sharing."}
        </div>
      </div>
    </section>
  );
}

const pageStyle: React.CSSProperties = {
  width: "min(960px, calc(100vw - 32px))",
  margin: "0 auto",
  padding: "24px 0 80px",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 4,
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: MIDNIGHT,
  opacity: 0.65,
  letterSpacing: "0.12em",
};

const titleStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 750,
  letterSpacing: "-0.025em",
  color: "#0f172a",
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: "rgba(15,23,42,0.55)",
  lineHeight: 1.55,
  margin: 0,
  maxWidth: 580,
};

const arrivedChipStyle: React.CSSProperties = {
  alignSelf: "flex-start",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 999,
  background: MIDNIGHT,
  color: "white",
  fontSize: 12,
  fontWeight: 700,
  boxShadow: "0 4px 16px rgba(25,25,112,0.22)",
};

const tabsRow: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  marginBottom: 6,
};

const tabStyle: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 12,
  border: `1.5px solid ${MIDNIGHT_BORDER}`,
  fontSize: 13.5,
  cursor: "pointer",
  transition: "all 0.18s cubic-bezier(0.22, 1, 0.36, 1)",
};

// ── About section styles ────────────────────────────────

const aboutSectionStyle: React.CSSProperties = {
  marginTop: 32,
  paddingTop: 28,
  borderTop: "1px solid rgba(15,23,42,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const aboutCardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid rgba(15,23,42,0.07)",
  borderRadius: 18,
  padding: "20px 22px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const aboutHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const aboutIconWrap: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 8,
  background: "rgba(25,25,112,0.06)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const aboutEyebrow: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: MIDNIGHT,
  opacity: 0.75,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
};

const aboutBody: React.CSSProperties = {
  fontSize: 13.5,
  color: "rgba(15,23,42,0.7)",
  lineHeight: 1.7,
};

const periodListStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: "none",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const periodItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  fontSize: 13,
  color: "rgba(15,23,42,0.7)",
  lineHeight: 1.6,
};

const periodNameStyle: React.CSSProperties = {
  color: "#0f172a",
  fontWeight: 700,
  letterSpacing: "-0.005em",
};

const periodDescStyle: React.CSSProperties = {
  color: "rgba(15,23,42,0.65)",
};

const contentListStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: "none",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const contentItemStyle: React.CSSProperties = {
  position: "relative" as const,
  paddingLeft: 14,
  fontSize: 12.5,
  color: "rgba(15,23,42,0.7)",
  lineHeight: 1.65,
};

const aboutGuaranteeStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "14px 16px",
  borderRadius: 14,
  background: "rgba(25,25,112,0.04)",
  border: "1px solid rgba(25,25,112,0.10)",
};
