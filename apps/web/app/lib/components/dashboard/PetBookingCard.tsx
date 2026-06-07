"use client";

/**
 * PetBookingCard — 펫 예약·서비스 mix·재방문 (Phase 2g).
 *
 *  ── 자료 (Agent C 14 자료) ───────────────────────────────────────────
 *  Gingr·VetPort·DaySmart·Petfolk·플러스벳·KPMG 반려동물 시장·펫프렌즈 재구매 85%
 *  → 펫 사장님 daily KPI: 예약·서비스 mix (미용/호텔/병원/판매)·재방문 cycle (60일).
 *
 *  Found.One 데이터: booking-store 재사용 (Beauty 와 동일 모델).
 *    · service 필드에 "미용·호텔·진료·미용+호텔" 등 자유 입력
 *    · providerName=미용사·수의사
 *
 *  카드 구조:
 *    ① 상황: 오늘/내일 예약 + 어제 노쇼
 *    ② 대비: 서비스 mix (미용/호텔/진료 매출 비중) + 재방문률
 *    ③ 행동: top 1 (재방문 60일 cycle 적기 / 노쇼 / 호텔 점유)
 *  ────────────────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import { PawPrint, Calendar, UserX, Sparkles, RotateCw } from "lucide-react";
import { useBookingStore } from "../../stores";
import { getKstDate } from "../../utils/business-day";

// 2026-05-13 — SSOT (booking-analytics + cohort-retention)
//   petServiceMix · bookingRepeatRate — Gingr·VetPort·펫프렌즈 (재구매 85%) 표준.
import {
  petServiceMix,
  bookingRepeatRate,
  type PetServiceCategory,
} from "@foundone/shared";

const MIDNIGHT = "#191970";

type Props = { ko: boolean; industryCategoryId?: string };

const SERVICE_LABEL: Record<PetServiceCategory, string> = {
  grooming: "미용",
  boarding: "호텔",
  medical: "진료",
  retail: "판매",
  other: "기타",
};

export function PetBookingCard({ ko, industryCategoryId }: Props) {
  // ⚠️ 2026-05-25 audit fix: Rules of Hooks 위반 수정 — hook을 early return 앞으로 이동.
  const bookings = useBookingStore((s) => s.bookings);
  const seedDemo = useBookingStore((s) => s.seedDemo);

  const analysis = useMemo(() => {
    const now = new Date();
    const todayStr = getKstDate(now);
    const tomorrowStr = getKstDate(new Date(now.getTime() + 86400000));
    const yesterdayStr = getKstDate(new Date(now.getTime() - 86400000));

    const todayBookings = bookings.filter((b) => b.date === todayStr);
    const tomorrowBookings = bookings.filter((b) => b.date === tomorrowStr);
    const yesterdayBookings = bookings.filter((b) => b.date === yesterdayStr);
    const yesterdayNoshow = yesterdayBookings.filter((b) => b.status === "noshow").length;

    // 2026-05-13 — SSOT 사용 (booking-analytics.ts + cohort-retention.ts).
    //   petServiceMix · bookingRepeatRate · classifyPetService — unit tests 검증.
    const mixArr = petServiceMix(bookings, 90, now).map((m) => ({
      ...m,
      label: SERVICE_LABEL[m.key],
    }));
    const totalRev = mixArr.reduce((s, m) => s + m.value, 0);

    // 재방문률 — SSOT (90일 windowed)
    const repeat = bookingRepeatRate(bookings, 90, now);
    const { uniqueCustomers, repeatCustomers, rate: repeatRate } = repeat;

    // top action
    let topAction: { kind: "critical" | "warning" | "good"; headline: string; action: string } | null = null;

    if (yesterdayNoshow >= 2) {
      topAction = {
        kind: "critical",
        headline: ko ? `어제 노쇼 ${yesterdayNoshow}건` : `${yesterdayNoshow} no-shows yesterday`,
        action: ko ? "오늘: 노쇼 보호자에게 카톡 + 다음 예약 보증금 정책 (펫프렌즈 8.5만원 평균)" : "Today: message no-show + deposit policy",
      };
    } else if (repeatRate < 50 && uniqueCustomers >= 10) {
      topAction = {
        kind: "warning",
        headline: ko
          ? `재방문률 ${repeatRate}% — 펫프렌즈 재구매 85% 미달`
          : `Repeat rate ${repeatRate}% — below 85%`,
        action: ko
          ? "이번 주: ① 60일 cycle 자동 미용 알림 카톡 ② 단골 무료 발톱 깎기·이빨 청소 ③ VIP 정기권 제안"
          : "This week: ① 60d auto reminder ② loyalty perks ③ VIP plan",
      };
    } else if (todayBookings.length < 3) {
      topAction = {
        kind: "warning",
        headline: ko ? `오늘 예약 ${todayBookings.length}건 — 슬롯 여유` : `Only ${todayBookings.length} bookings today`,
        action: ko ? "오늘: ① 단골 카톡 (당일 할인) ② 네이버 예약 노출 점검 ③ 사료·용품 판매 cross-sell" : "Today: regular outreach + cross-sell",
      };
    } else if (repeatRate >= 70) {
      topAction = {
        kind: "good",
        headline: ko ? `재방문률 ${repeatRate}% — 펫프렌즈 표준 상위` : `Repeat rate ${repeatRate}% — top tier`,
        action: ko ? "이번 분기: 친구·이웃 추천 캠페인 (referral 5천원 적립)" : "This Q: referral campaign",
      };
    } else if (mixArr.length >= 2 && mixArr[0].pct > 70) {
      topAction = {
        kind: "warning",
        headline: ko
          ? `${mixArr[0].label} 비중 ${mixArr[0].pct}% — 의존도 risk`
          : `${mixArr[0].label} ${mixArr[0].pct}% — concentration risk`,
        action: ko ? "이번 분기: 다른 서비스 (호텔·진료·판매) 교차 판매 패키지" : "This Q: cross-sell packages",
      };
    }

    return {
      todayBookings, tomorrowBookings, yesterdayNoshow,
      mixArr, totalRev,
      uniqueCustomers, repeatCustomers, repeatRate,
      topAction,
    };
  }, [bookings, ko]);

  // hook 호출 끝 — 조건부 렌더 안전.
  if (industryCategoryId !== "pet") return null;

  if (bookings.length === 0) {
    return (
      <article style={cardStyle}>
        <header style={headerRow}>
          <span style={iconBadge}><PawPrint size={14} strokeWidth={2.2} /></span>
          <div style={labelStyle}>{ko ? "예약·서비스 mix · 펫" : "Booking · Pet"}</div>
        </header>
        <div style={{ padding: "16px 0", textAlign: "center" as const }}>
          <div style={{ fontSize: 13, color: "rgba(15,23,42,0.65)", marginBottom: 12 }}>
            {ko ? "예약 데이터를 입력하면 서비스 mix·재방문 cycle·노쇼 분석" : "Enter booking data"}
          </div>
          <button type="button" onClick={() => seedDemo()} style={demoBtnStyle}>
            {ko ? "예시 데이터로 카드 보기" : "Load demo data"}
          </button>
        </div>
      </article>
    );
  }

  return (
    <article style={cardStyle}>
      <header style={headerRow}>
        <span style={iconBadge}><PawPrint size={14} strokeWidth={2.2} /></span>
        <div style={labelStyle}>{ko ? "예약·서비스 mix · 펫" : "Booking · Pet"}</div>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.6 }}>
          {ko ? `90일 보호자 ${analysis.uniqueCustomers}명` : `${analysis.uniqueCustomers} clients`}
        </span>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        <StatBox label={ko ? "오늘" : "Today"} value={`${analysis.todayBookings.length}건`} tone="notable" icon={<Calendar size={12} strokeWidth={2.2} />} />
        <StatBox label={ko ? "내일" : "Tomorrow"} value={`${analysis.tomorrowBookings.length}건`} tone="notable" icon={<Calendar size={12} strokeWidth={2.2} />} />
        <StatBox label={ko ? "어제 노쇼" : "Y'day no-show"} value={`${analysis.yesterdayNoshow}건`} tone={analysis.yesterdayNoshow >= 2 ? "critical" : analysis.yesterdayNoshow >= 1 ? "warning" : "good"} icon={<UserX size={12} strokeWidth={2.2} />} />
        <StatBox label={ko ? "재방문률 (90일)" : "Repeat (90d)"} value={`${analysis.repeatRate}%`} tone={analysis.repeatRate >= 70 ? "good" : analysis.repeatRate >= 50 ? "warning" : "critical"} icon={<RotateCw size={12} strokeWidth={2.2} />} />
      </div>

      {analysis.mixArr.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8 }}>
            {ko ? "90일 서비스 mix (Gingr boarding+grooming+medical+retail)" : "90d service mix"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
            {analysis.mixArr.map((m) => (
              <div key={m.key} style={{
                display: "grid", gridTemplateColumns: "60px 1fr auto auto", gap: 10, alignItems: "center",
                padding: "8px 10px", borderRadius: 8,
                background: "rgba(15,23,42,0.02)", border: "1px solid rgba(25,25,112,0.06)",
              }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{m.label}</div>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(15,23,42,0.06)", overflow: "hidden" }}>
                  <div style={{ width: `${m.pct}%`, height: "100%", background: MIDNIGHT, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.6)", fontVariantNumeric: "tabular-nums" }}>
                  {Math.round(m.value / 10000).toLocaleString()}만
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: MIDNIGHT, fontVariantNumeric: "tabular-nums", minWidth: 36, textAlign: "right" as const }}>
                  {m.pct}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.topAction && (
        <div style={{
          padding: "12px 14px", borderRadius: 12,
          background: actionColors[analysis.topAction.kind].bg,
          border: `1px solid ${actionColors[analysis.topAction.kind].border}`,
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: actionColors[analysis.topAction.kind].text, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 4 }}>
            {ko ? "오늘 가장 중요한 행동" : "Today's #1 action"}
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", marginBottom: 6, lineHeight: 1.4 }}>{analysis.topAction.headline}</div>
          <div style={{ fontSize: 12, color: "rgba(15,23,42,0.7)", lineHeight: 1.55 }}>{analysis.topAction.action}</div>
        </div>
      )}

      <div style={footerStyle}>
        <Sparkles size={11} strokeWidth={1.8} style={{ color: MIDNIGHT, opacity: 0.5, marginRight: 6 }} />
        {ko ? "Gingr·VetPort·DaySmart·펫프렌즈 (재구매 85%) 표준 + 한국 펫 60일 미용 cycle" : "Gingr/VetPort/DaySmart standards"}
      </div>
    </article>
  );
}

// ─── helpers (재사용) ─────────────────────────────────────────────────

function StatBox({ label, value, tone, icon }: { label: string; value: string; tone: "critical" | "warning" | "good" | "notable"; icon: React.ReactNode }) {
  const c = {
    critical: { bg: "rgba(182,76,76,0.06)", border: "rgba(182,76,76,0.20)", text: "#b64c4c" },
    warning: { bg: "rgba(25,25,112,0.06)", border: "rgba(25,25,112,0.20)", text: "#191970" },
    good: { bg: "rgba(25,25,112,0.05)", border: "rgba(25,25,112,0.18)", text: "#1d3557" },
    notable: { bg: `${MIDNIGHT}08`, border: `${MIDNIGHT}22`, text: MIDNIGHT },
  }[tone];
  return (
    <div style={{ padding: "10px 12px", borderRadius: 11, background: c.bg, border: `1px solid ${c.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
        <span style={{ color: c.text }}>{icon}</span>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: c.text, letterSpacing: "0.04em", textTransform: "uppercase" as const, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: c.text, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

const actionColors = {
  critical: { bg: "rgba(182,76,76,0.06)", border: "rgba(182,76,76,0.20)", text: "#b64c4c" },
  warning: { bg: "rgba(25,25,112,0.06)", border: "rgba(25,25,112,0.20)", text: "#191970" },
  good: { bg: "rgba(25,25,112,0.05)", border: "rgba(25,25,112,0.18)", text: "#1d3557" },
} as const;

const demoBtnStyle: React.CSSProperties = {
  padding: "8px 14px", borderRadius: 8,
  background: `${MIDNIGHT}15`, color: MIDNIGHT,
  border: `1px solid ${MIDNIGHT}30`,
  fontSize: 12, fontWeight: 700, cursor: "pointer",
};

const cardStyle: React.CSSProperties = {
  background: "white", borderRadius: 20,
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
  padding: "22px 24px",
  display: "flex", flexDirection: "column" as const, gap: 14,
};

const headerRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10 };

const iconBadge: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8,
  background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.85) 100%)`,
  color: "white",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 4px 12px rgba(25,25,112,0.25)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.75,
  letterSpacing: "0.08em", textTransform: "uppercase" as const,
};

const footerStyle: React.CSSProperties = {
  display: "flex", alignItems: "center",
  fontSize: 11, color: "var(--muted)", lineHeight: 1.5,
  padding: "8px 12px", borderRadius: 9,
  background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.06)",
};
