"use client";

import { useEffect, useMemo, useState } from "react";
import { formatKrw } from "../../utils/format-krw";
import { AlertTriangle, Settings, ArrowDownRight, ArrowUpRight, Wallet, ChevronRight } from "lucide-react";
import { useCashflowStore } from "../../stores/cashflow-store";
import { useOperationsStore } from "../../stores/operations-store";
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
import { AnimatedBar } from "./animations";

type Props = {
  ko: boolean;
  dailyEntries: DailyEntry[];
  /**
   * 사용자가 대시보드에 입력한 월 비용 총액 (totalCosts).
   * cashflow-store 의 fixedExpenses 가 비어있을 때 fallback 으로 사용됨 →
   * 가짜 예측 곡선 방지. 미전달 시 (또는 0) 단순 매출 정산만 반영.
   */
  fallbackMonthlyCostsTotal?: number;
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
export function CashflowHeroCard({ ko, dailyEntries, fallbackMonthlyCostsTotal }: Props) {
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
  // FeatureNudgeCard 등에서 setup sheet 열기 + 특정 섹션 (예: 고정비) 으로 자동 스크롤
  const [setupTargetSection, setSetupTargetSection] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { section?: string } | undefined;
      setSetupTargetSection(detail?.section);
      setShowSetup(true);
    };
    window.addEventListener("bup:open-cashflow-setup", handler);
    return () => window.removeEventListener("bup:open-cashflow-setup", handler);
  }, []);

  // 과세 유형 → VAT 적립률 결정 (일반 10% / 간이 3% 평균)
  const vatType = useOperationsStore((s) => s.taxSettings.vatType);
  const vatRate = vatType === "simplified" ? 0.03 : 0.10;

  const projections: DayProjection[] = useMemo(
    () =>
      projectCashflow({
        currentBalance,
        recentDailyEntries: dailyEntries,
        salesChannels,
        fixedExpenses,
        vatReserveEnabled,
        vatRate,
        fallbackMonthlyCostsTotal,
      }),
    [currentBalance, dailyEntries, salesChannels, fixedExpenses, vatReserveEnabled, vatRate, fallbackMonthlyCostsTotal]
  );

  const crisis = useMemo(() => detectCrisis(projections, crisisThresholdDays), [projections, crisisThresholdDays]);
  const upcoming = useMemo(() => findUpcomingEvents(projections, 5), [projections]);

  // ── 미설정 상태 — 미드나이트 + 정보가 풍부한 onboarding 카드 ──
  if (!setupCompletedAt) {
    return (
      <>
        <section
          style={{
            borderRadius: "20px",
            padding: "22px",
            background: "linear-gradient(180deg, #ffffff 0%, #f7f8fe 100%)",
            border: "1px solid rgba(25,25,112,0.10)",
            boxShadow: "0 1px 3px rgba(25,25,112,0.04), 0 12px 24px -12px rgba(25,25,112,0.10)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
          className="bento-card"
          data-cashflow-hero
        >
          {/* 헤더 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "rgba(25,25,112,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Wallet size={20} color="#191970" strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...eyebrow, color: "#191970", opacity: 0.7 }}>
                {ko ? "현금흐름 레이더" : "Cash-flow Radar"}
              </div>
              <div style={{ ...title, fontSize: "18px", color: "#0f0f4a", marginTop: "2px" }}>
                {ko ? "오늘 통장에 얼마, 내일 얼마?" : "Today's & tomorrow's cash?"}
              </div>
            </div>
          </div>

          {/* 핵심 가치 — 3 bullets (P&L 카드의 정보량과 균형 맞춤) */}
          <div style={{
            display: "grid",
            gap: "10px",
            padding: "14px 16px",
            borderRadius: "14px",
            background: "rgba(25,25,112,0.03)",
            border: "1px solid rgba(25,25,112,0.06)",
          }}>
            {[
              { ko: "배민·쿠팡이츠·카드 PG 정산 주기 자동 추적", en: "Auto-track Baemin·Coupang·card settlement cycles" },
              { ko: "이번 주 입금 예정·14일 앞 잔고 미리 보기", en: "This week's deposits + 14-day balance forecast" },
              { ko: "잔고 위험 시 7가지 원버튼 해결책 제안", en: "7 one-tap solutions when balance dips" },
            ].map((item) => (
              <div key={item.ko} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  borderRadius: "999px",
                  background: "#191970",
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M2 4.5L4 6.5L7 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span style={{ fontSize: "13px", color: "rgba(15,23,42,0.75)", lineHeight: 1.5, fontWeight: 500 }}>
                  {ko ? item.ko : item.en}
                </span>
              </div>
            ))}
          </div>

          {/* 인사이트 한 줄 — 왜 지금 설정해야 하는지 */}
          <div style={{
            fontSize: "12.5px",
            color: "var(--muted)",
            lineHeight: 1.55,
            padding: "0 2px",
          }}>
            {ko
              ? <>장부는 <strong style={{ color: "#191970" }}>흑자</strong>여도 통장은 <strong style={{ color: "#191970" }}>바닥</strong>일 수 있어요. 2분 설정으로 흑자 부도를 미리 막으세요.</>
              : <>Your P&L may show <strong style={{ color: "#191970" }}>profit</strong>, but bank could be <strong style={{ color: "#191970" }}>empty</strong>. 2-min setup prevents profitable bankruptcy.</>}
          </div>

          {/* CTA — SSOT 그라데이션 (PRIMARY_BUTTON_GRADIENT) */}
          <button
            type="button"
            onClick={() => setShowSetup(true)}
            style={{
              alignSelf: "stretch",
              padding: "12px 18px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #1E2A55 0%, #2C4F80 100%)",
              color: "#fff",
              border: "none",
              fontSize: "13.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontFamily: "inherit",
              boxShadow: "0 2px 8px rgba(30,42,85,0.18)",
              letterSpacing: "-0.01em",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(30,42,85,0.28)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(25,25,112,0.22)";
            }}
          >
            {ko ? "2분 설정 시작" : "Start 2-min setup"}
            <ChevronRight size={15} strokeWidth={2.4} />
          </button>
        </section>
        {showSetup && (
          <CashflowSetupSheet
            ko={ko}
            targetSection={setupTargetSection}
            onClose={() => { setShowSetup(false); setSetupTargetSection(undefined); }}
          />
        )}
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
          <div style={{ fontSize: "11px", fontWeight: 650, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
            {ko ? "14일 예측" : "14-day forecast"}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "52px" }}>
            {projections.map((p, idx) => {
              const isToday = idx === 0;
              const isNegative = p.endBalance < 0;
              const heightPct = Math.max(6, (Math.abs(p.endBalance) / maxAbs) * 100);
              // 잔액 막대: 음수=위험(벽돌), 30%미만=주의(짙은 네이비), 충분=양호(옅은 네이비).
              const color = isNegative
                ? "#b64c4c"
                : p.endBalance < currentBalance * 0.3
                  ? "rgba(25,25,112,0.80)"
                  : "rgba(25,25,112,0.45)";

              return (
                <div
                  key={p.date}
                  title={`${p.date.slice(5)}: ${formatWon(p.endBalance)}`}
                  style={{
                    flex: 1,
                    height: "100%",
                    display: "flex",
                    alignItems: "flex-end",
                    minWidth: 0,
                  }}
                >
                  <AnimatedBar
                    heightPct={heightPct}
                    delay={0.3 + idx * 0.035}
                    duration={0.65}
                    style={{
                      width: "100%",
                      minHeight: "4px",
                      background: color,
                      opacity: isToday ? 1 : 0.65,
                      borderRadius: "2px 2px 0 0",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>
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
                icon={<ArrowDownRight size={14} strokeWidth={1.8} color="#1d3557" />}
                label={ko ? "다음 입금" : "Next inflow"}
                detail={`${upcoming.nextInflow.date.slice(5)} · ${upcoming.nextInflow.label[ko ? "ko" : "en"]}`}
                amount={`+${formatWon(upcoming.nextInflow.amount)}`}
                amountColor="#1d3557"
              />
            )}
            {upcoming.nextOutflow && (
              <EventRow
                icon={<ArrowUpRight size={14} strokeWidth={1.8} color="#475569" />}
                label={ko ? "다음 지출" : "Next outflow"}
                detail={`${upcoming.nextOutflow.date.slice(5)} · ${upcoming.nextOutflow.label[ko ? "ko" : "en"]}`}
                amount={`−${formatWon(upcoming.nextOutflow.amount)}`}
                amountColor="#475569"
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
            background: "rgba(25,25,112,0.06)",
            border: "1px solid rgba(25,25,112,0.12)",
            fontSize: "11px",
            color: "#191970",
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
                background: "#191970",
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
            <ChevronRight size={14} strokeWidth={1.5} />
          </button>
        </div>
      </section>

      {showSetup && (
          <CashflowSetupSheet
            ko={ko}
            targetSection={setupTargetSection}
            onClose={() => { setShowSetup(false); setSetupTargetSection(undefined); }}
          />
        )}
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
  const color = tone === "negative" ? "#b64c4c" : "#0f172a";
  return (
    <div style={{
      padding: "12px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.6)",
      border: "1px solid rgba(15,23,42,0.04)",
    }}>
      <div style={{ fontSize: "10px", fontWeight: 650, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "17px", fontWeight: 720, letterSpacing: "-0.03em", color, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {typeof trend === "number" && trend !== 0 && (
        <div style={{ fontSize: "10px", fontWeight: 650, color: trend > 0 ? "#1d3557" : "#b64c4c", marginTop: "2px" }}>
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
        <div style={{ fontSize: "10px", fontWeight: 650, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
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
  // 1억 이상은 "15,000만원" 이 아니라 "1억 5,000만원" 이라 읽는다. 억 표기는 SSOT(formatKrw)에 위임 —
  //   여기서 억 로직을 또 구현하면 같은 계산이 파일마다 복제된다. (2026-07 사장님 지적)
  if (abs >= 100_000_000) return `${sign}${formatKrw(abs)}`;
  if (abs >= 10000) return `${sign}${Math.round(n / 10000).toLocaleString()}만원`;
  return `${sign}${abs.toLocaleString()}원`;
}

// ─── Styles ───

// 톤: safe/warning 은 네이비 농담(옅음→짙음), crisis 만 벽돌 danger. 라벨·아이콘 동반.
const toneColors = {
  safe: {
    bg: "linear-gradient(180deg, rgba(255,255,255,0.988), rgba(246,247,251,0.92))",
    border: "rgba(25,25,112,0.10)",
    iconBg: "rgba(25,25,112,0.06)",
    primary: "#1d3557",
  },
  warning: {
    bg: "linear-gradient(180deg, rgba(255,255,255,0.988), rgba(244,245,250,0.92))",
    border: "rgba(25,25,112,0.16)",
    iconBg: "rgba(25,25,112,0.10)",
    primary: "#191970",
  },
  crisis: {
    bg: "linear-gradient(180deg, rgba(255,250,250,0.988), rgba(252,244,244,0.92))",
    border: "rgba(182,76,76,0.18)",
    iconBg: "rgba(182,76,76,0.08)",
    primary: "#b64c4c",
  },
} as const;

const cardBase: React.CSSProperties = {
  borderRadius: "20px",
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
  color: "var(--muted)",
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
  background: "linear-gradient(135deg, #1E2A55 0%, #2C4F80 100%)",
  color: "#fff",
  border: "none",
  fontSize: "13px",
  fontWeight: 650,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontFamily: "inherit",
  boxShadow: "0 2px 8px rgba(30,42,85,0.18)",
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
