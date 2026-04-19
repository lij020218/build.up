"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Settings, ArrowDownRight, ArrowUpRight, Wallet, ChevronRight } from "lucide-react";
import { useCashflowStore } from "../../stores/cashflow-store";
import {
  projectCashflow,
  detectCrisis,
  findUpcomingEvents,
  type DayProjection,
  type DailyEntry,
} from "../../services/cashflow-projection";
import { CashflowSetupSheet } from "./CashflowSetupSheet";
import { CashflowDetailSheet } from "./CashflowDetailSheet";
import { CashflowCrisisActions } from "./CashflowCrisisActions";

type Props = {
  ko: boolean;
  dailyEntries: DailyEntry[];
};

/**
 * Cash-flow Crunch Tracker — Hero Card.
 * 대시보드 최상단 고정 배치. 30초 사용성.
 *
 * 상태별 표시:
 * - 미설정: 온보딩 CTA
 * - 안전: 녹색 타임라인 + 다음 이벤트
 * - 위기 (3일 내 음수): 앰버/레드 경고 + 원버튼 액션
 */
export function CashflowHeroCard({ ko, dailyEntries }: Props) {
  const {
    currentBalance,
    currentBalanceUpdatedAt,
    salesChannels,
    fixedExpenses,
    crisisThresholdDays,
    vatReserveEnabled,
    setupCompletedAt,
  } = useCashflowStore();

  const [showSetup, setShowSetup] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const projections: DayProjection[] = useMemo(
    () =>
      projectCashflow({
        currentBalance,
        recentDailyEntries: dailyEntries,
        salesChannels,
        fixedExpenses,
        vatReserveEnabled,
      }),
    [currentBalance, dailyEntries, salesChannels, fixedExpenses, vatReserveEnabled]
  );

  const crisis = useMemo(() => detectCrisis(projections, crisisThresholdDays), [projections, crisisThresholdDays]);
  const upcoming = useMemo(() => findUpcomingEvents(projections, 5), [projections]);

  // ── 미설정 상태 ──
  if (!setupCompletedAt) {
    return (
      <>
        <section style={cardBase} className="bento-card">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(37,99,235,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Wallet size={24} color="#2563eb" strokeWidth={1.6} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={eyebrow}>{ko ? "현금흐름 레이더" : "Cash-flow Radar"}</div>
              <div style={title}>
                {ko ? "오늘 통장에 얼마, 내일 얼마 들어와요?" : "Do you know how much you'll have tomorrow?"}
              </div>
              <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.6)", marginTop: "6px", lineHeight: 1.55 }}>
                {ko
                  ? "배민·쿠팡이츠·카드 정산 주기는 제각각. 장부는 흑자여도 통장은 바닥일 수 있어요. 2분만 설정하면 14일 앞을 미리 봅니다."
                  : "Delivery apps, card PGs all settle on different schedules. Your P&L may be green while your bank is red. 2-minute setup shows 14 days ahead."}
              </div>
              <button
                type="button"
                onClick={() => setShowSetup(true)}
                style={primaryCTA}
              >
                {ko ? "2분 설정 시작" : "Start 2-min setup"}
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        </section>
        {showSetup && <CashflowSetupSheet ko={ko} onClose={() => setShowSetup(false)} />}
      </>
    );
  }

  // ── 설정 완료, 메인 표시 ──
  const isCrisis = crisis.willCrisis;
  const isWarning = !isCrisis && crisis.lowestBalance < currentBalance * 0.3; // 잔고 30% 이하로 떨어질 예정
  const tone = isCrisis ? "crisis" : isWarning ? "warning" : "safe";

  const todayEnd = projections[0]?.endBalance ?? currentBalance;
  const sevenDayEnd = projections[6]?.endBalance ?? currentBalance;
  const fourteenDayEnd = projections[13]?.endBalance ?? currentBalance;

  // 타임라인 시각화용 바 (14일)
  const maxAbs = Math.max(...projections.map((p) => Math.abs(p.endBalance)), currentBalance, 1);

  // 잔고 업데이트 경고 (3일 이상 지난 경우)
  const balanceStale = currentBalanceUpdatedAt
    ? (Date.now() - new Date(currentBalanceUpdatedAt).getTime()) / 86400000 > 3
    : true;

  return (
    <>
      <section
        style={{
          ...cardBase,
          background: toneColors[tone].bg,
          border: `1px solid ${toneColors[tone].border}`,
        }}
        className="bento-card bento-fade-in"
        data-cashflow-hero
      >
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: toneColors[tone].iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {isCrisis ? (
                <AlertTriangle size={18} color={toneColors[tone].primary} strokeWidth={1.8} />
              ) : (
                <Wallet size={18} color={toneColors[tone].primary} strokeWidth={1.8} />
              )}
            </div>
            <div>
              <div style={eyebrow}>{ko ? "현금흐름 레이더" : "Cash-flow Radar"}</div>
              <div style={{ ...title, fontSize: "18px" }}>
                {isCrisis
                  ? ko ? "주의가 필요해요" : "Attention needed"
                  : isWarning
                    ? ko ? "잔고가 얇아지고 있어요" : "Balance is thinning"
                    : ko ? "안정적이에요" : "All clear"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSetup(true)}
            style={iconBtn}
            aria-label={ko ? "설정" : "Settings"}
          >
            <Settings size={16} strokeWidth={1.6} color="rgba(15,23,42,0.5)" />
          </button>
        </div>

        {/* 핵심 3지표 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
          <MetricTile
            label={ko ? "오늘 잔고" : "Today"}
            value={formatWon(todayEnd)}
            tone={todayEnd >= 0 ? "positive" : "negative"}
            ko={ko}
          />
          <MetricTile
            label={ko ? "7일 후" : "In 7 days"}
            value={formatWon(sevenDayEnd)}
            tone={sevenDayEnd >= todayEnd ? "positive" : sevenDayEnd >= 0 ? "neutral" : "negative"}
            ko={ko}
            trend={sevenDayEnd - todayEnd}
          />
          <MetricTile
            label={ko ? "14일 후" : "In 14 days"}
            value={formatWon(fourteenDayEnd)}
            tone={fourteenDayEnd >= 0 ? "positive" : "negative"}
            ko={ko}
            trend={fourteenDayEnd - todayEnd}
          />
        </div>

        {/* 14일 타임라인 그래프 (작은 미니 바) */}
        <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.5)", borderRadius: "12px", marginBottom: "14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 650, color: "rgba(15,23,42,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
            {ko ? "14일 예측" : "14-day forecast"}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "52px" }}>
            {projections.map((p, idx) => {
              const isToday = idx === 0;
              const isNegative = p.endBalance < 0;
              const heightPct = Math.max(6, (Math.abs(p.endBalance) / maxAbs) * 100);
              const color = isNegative
                ? "#dc2626"
                : p.endBalance < currentBalance * 0.3
                  ? "#d97706"
                  : "#059669";

              return (
                <div
                  key={p.date}
                  title={`${p.date.slice(5)}: ${formatWon(p.endBalance)}`}
                  style={{
                    flex: 1,
                    height: `${heightPct}%`,
                    minHeight: "4px",
                    background: color,
                    opacity: isToday ? 1 : 0.65,
                    borderRadius: "2px 2px 0 0",
                    transition: "all 0.2s",
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "10px", color: "rgba(15,23,42,0.4)", fontWeight: 600 }}>
            <span>{ko ? "오늘" : "Today"}</span>
            <span>+7d</span>
            <span>+14d</span>
          </div>
        </div>

        {/* 다음 이벤트 요약 */}
        {(upcoming.nextInflow || upcoming.nextOutflow) && (
          <div style={{ display: "grid", gridTemplateColumns: upcoming.nextInflow && upcoming.nextOutflow ? "1fr 1fr" : "1fr", gap: "8px", marginBottom: isCrisis ? "14px" : "4px" }}>
            {upcoming.nextInflow && (
              <EventRow
                icon={<ArrowDownRight size={14} strokeWidth={1.8} color="#059669" />}
                label={ko ? "다음 입금" : "Next inflow"}
                detail={`${upcoming.nextInflow.date.slice(5)} · ${upcoming.nextInflow.label[ko ? "ko" : "en"]}`}
                amount={`+${formatWon(upcoming.nextInflow.amount)}`}
                amountColor="#059669"
              />
            )}
            {upcoming.nextOutflow && (
              <EventRow
                icon={<ArrowUpRight size={14} strokeWidth={1.8} color="#b91c1c" />}
                label={ko ? "다음 지출" : "Next outflow"}
                detail={`${upcoming.nextOutflow.date.slice(5)} · ${upcoming.nextOutflow.label[ko ? "ko" : "en"]}`}
                amount={`−${formatWon(upcoming.nextOutflow.amount)}`}
                amountColor="#b91c1c"
              />
            )}
          </div>
        )}

        {/* 크라이시스 액션 영역 */}
        {isCrisis && crisis.crisisDay && (
          <CashflowCrisisActions
            ko={ko}
            crisis={crisis}
            currentBalance={currentBalance}
          />
        )}

        {/* 잔고 오래된 경고 */}
        {balanceStale && (
          <div style={{
            marginTop: "10px",
            padding: "8px 12px",
            borderRadius: "10px",
            background: "rgba(217,119,6,0.06)",
            border: "1px solid rgba(217,119,6,0.12)",
            fontSize: "11px",
            color: "#b45309",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <AlertTriangle size={12} strokeWidth={1.8} />
            <span>
              {ko
                ? "통장 잔고가 3일 이상 업데이트되지 않았어요. 예측 정확도를 위해 갱신해주세요."
                : "Balance hasn't been updated for 3+ days. Please refresh for accurate forecast."}
            </span>
            <button
              type="button"
              onClick={() => setShowSetup(true)}
              style={{
                marginLeft: "auto",
                padding: "4px 10px",
                borderRadius: "6px",
                border: "none",
                background: "#d97706",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 650,
                cursor: "pointer",
              }}
            >
              {ko ? "갱신" : "Update"}
            </button>
          </div>
        )}

        {/* 하단 CTA */}
        <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
          <button type="button" onClick={() => setShowDetail(true)} style={secondaryCTA}>
            {ko ? "14일 상세 보기" : "14-day details"}
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      </section>

      {showSetup && <CashflowSetupSheet ko={ko} onClose={() => setShowSetup(false)} />}
      {showDetail && <CashflowDetailSheet ko={ko} projections={projections} onClose={() => setShowDetail(false)} />}
    </>
  );
}

// ─── Subcomponents ───

function MetricTile({
  label,
  value,
  tone,
  trend,
  ko,
}: {
  label: string;
  value: string;
  tone: "positive" | "neutral" | "negative";
  trend?: number;
  ko: boolean;
}) {
  const color = tone === "negative" ? "#b91c1c" : tone === "positive" ? "#0f172a" : "#0f172a";
  return (
    <div style={{
      padding: "12px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.6)",
      border: "1px solid rgba(15,23,42,0.04)",
    }}>
      <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(15,23,42,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "17px", fontWeight: 720, letterSpacing: "-0.03em", color, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {typeof trend === "number" && trend !== 0 && (
        <div style={{ fontSize: "10px", fontWeight: 650, color: trend > 0 ? "#059669" : "#b91c1c", marginTop: "2px" }}>
          {trend > 0 ? "▲" : "▼"} {formatWon(Math.abs(trend))}
        </div>
      )}
    </div>
  );
}

function EventRow({
  icon,
  label,
  detail,
  amount,
  amountColor,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  amount: string;
  amountColor: string;
}) {
  return (
    <div style={{
      padding: "10px 12px",
      borderRadius: "10px",
      background: "rgba(255,255,255,0.55)",
      border: "1px solid rgba(15,23,42,0.04)",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(15,23,42,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.7)", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{detail}</div>
      </div>
      <div style={{ fontSize: "13px", fontWeight: 700, color: amountColor, fontVariantNumeric: "tabular-nums" }}>{amount}</div>
    </div>
  );
}

// ─── Helpers ───

function formatWon(n: number): string {
  const abs = Math.abs(Math.round(n));
  const sign = n < 0 ? "−" : "";
  if (abs >= 10000) return `${sign}${Math.round(n / 10000).toLocaleString()}만원`;
  return `${sign}${abs.toLocaleString()}원`;
}

// ─── Styles ───

const toneColors = {
  safe: {
    bg: "linear-gradient(180deg, rgba(255,255,255,0.988), rgba(243,250,246,0.92))",
    border: "rgba(5,150,105,0.1)",
    iconBg: "rgba(5,150,105,0.08)",
    primary: "#059669",
  },
  warning: {
    bg: "linear-gradient(180deg, rgba(255,252,246,0.988), rgba(254,245,232,0.92))",
    border: "rgba(217,119,6,0.15)",
    iconBg: "rgba(217,119,6,0.08)",
    primary: "#b45309",
  },
  crisis: {
    bg: "linear-gradient(180deg, rgba(255,250,250,0.988), rgba(254,242,242,0.92))",
    border: "rgba(220,38,38,0.15)",
    iconBg: "rgba(220,38,38,0.08)",
    primary: "#b91c1c",
  },
} as const;

const cardBase: React.CSSProperties = {
  borderRadius: "24px",
  padding: "22px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.988), rgba(243,246,251,0.91))",
  border: "1px solid rgba(15, 23, 42, 0.048)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.84) inset, 0 18px 42px rgba(15, 23, 42, 0.038)",
};

const eyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 650,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.4)",
  marginBottom: "2px",
};

const title: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: "#0f172a",
  lineHeight: 1.1,
};

const primaryCTA: React.CSSProperties = {
  marginTop: "14px",
  padding: "10px 16px",
  borderRadius: "10px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  fontSize: "13px",
  fontWeight: 650,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontFamily: "inherit",
};

const secondaryCTA: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(15,23,42,0.08)",
  fontSize: "12px",
  fontWeight: 620,
  color: "rgba(15,23,42,0.7)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  fontFamily: "inherit",
};

const iconBtn: React.CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.6)",
  border: "1px solid rgba(15,23,42,0.06)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
