"use client";

/**
 * BeautyBookingNoshowCard — 뷰티 예약·노쇼·디자이너별 매출 (Phase 2e).
 *
 *  ── 왜 만들었나 (2026-05-13) ──────────────────────────────────────────
 *  Agent B 11 자료 (Zenoti·Meevo·Mindbody·공비서·카카오헤어샵·Handsub·KB)
 *  합의: 뷰티 사장님 daily KPI #1 = 예약·노쇼·디자이너별 매출.
 *  카카오헤어샵 노쇼 0.09% 사례 (기존 20% → 99.5% 감소) — 한국 뷰티 대표 성공 사례.
 *  Meevo: 업계 평균 rebook 75%, 목표 85%.
 *
 *  build.up 데이터 (ARCHITECTURE 체크리스트):
 *    · useBookingStore.bookings — 예약·노쇼·취소 (신규 store, Phase 2e)
 *    · useBookingStore.providers — 디자이너·트레이너 매트릭스
 *    · 데이터 없으면 *seedDemo* 버튼으로 사장님이 카드 이해 가능
 *
 *  ── 카드 구조 ───────────────────────────────────────────────────────
 *  ① 상황: 오늘·내일 예약 수 + 어제 노쇼·취소
 *  ② 대비: 디자이너별 점유율 + 매출 + 노쇼율
 *  ③ 행동: top 1 (노쇼 5%+ critical / 빈 슬롯 많을 시 마케팅)
 *
 *  ── 출처 (3개) ──────────────────────────────────────────────────────
 *  · Zenoti Service Provider Utilization Rate + no-show KPI
 *  · Meevo: 업계 평균 rebook 75%, 목표 85%
 *  · 카카오헤어샵 노쇼 20% → 0.09% (서울경제 2024 보도)
 *  ────────────────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import { Calendar, AlertTriangle, UserX, Users, Sparkles } from "lucide-react";
import { useBookingStore } from "../../stores";
// 2026-05-13 — SSOT (booking-analytics + cohort-retention)
//   noshowRate, providerStats — 카카오헤어샵 0.09% / Zenoti·Meevo 표준.
import {
  noshowRate as ssotNoshowRate,
  providerStats as ssotProviderStats,
} from "@build-up/shared";

const MIDNIGHT = "#191970";

type Props = { ko: boolean; industryCategoryId?: string };

export function BeautyBookingNoshowCard({ ko, industryCategoryId }: Props) {
  const bookings = useBookingStore((s) => s.bookings);
  const providers = useBookingStore((s) => s.providers);
  const seedDemo = useBookingStore((s) => s.seedDemo);

  if (industryCategoryId !== "beauty") return null;

  if (bookings.length === 0) {
    return (
      <article style={cardStyle}>
        <header style={headerRow}>
          <span style={iconBadge}><Calendar size={14} strokeWidth={2.2} /></span>
          <div style={labelStyle}>{ko ? "예약·노쇼·디자이너 · 뷰티" : "Booking · Beauty"}</div>
        </header>
        <div style={{ padding: "16px 0", textAlign: "center" as const }}>
          <div style={{ fontSize: 13, color: "rgba(15,23,42,0.65)", marginBottom: 12 }}>
            {ko
              ? "예약 데이터를 입력하면 노쇼율·디자이너별 매출·rebook 분석이 시작됩니다"
              : "Enter booking data to unlock no-show / provider analytics"}
          </div>
          <button
            type="button"
            onClick={() => seedDemo()}
            style={{
              padding: "8px 14px", borderRadius: 8,
              background: `${MIDNIGHT}15`, color: MIDNIGHT,
              border: `1px solid ${MIDNIGHT}30`,
              fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            {ko ? "예시 데이터로 카드 보기" : "Load demo data"}
          </button>
        </div>
      </article>
    );
  }

  const analysis = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
    const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

    const todayBookings = bookings.filter((b) => b.date === todayStr);
    const tomorrowBookings = bookings.filter((b) => b.date === tomorrowStr);
    const yesterdayBookings = bookings.filter((b) => b.date === yesterdayStr);
    const yesterdayNoshow = yesterdayBookings.filter((b) => b.status === "noshow").length;
    const yesterdayCancelled = yesterdayBookings.filter((b) => b.status === "cancelled").length;

    // 2026-05-13 — SSOT 사용 (booking-analytics.ts)
    //   noshowRate: completed+noshow 분모, 취소·confirmed 제외 (카카오헤어샵 0.09% 표준)
    //   providerStats: 디자이너별 매출·노쇼·가동률 (Zenoti·Meevo)
    const noshow30d = ssotNoshowRate(bookings, 30, now);
    const last30NoshowRate = noshow30d.rate;
    const providerStats = ssotProviderStats(bookings, providers, 30, 4, now);

    // top action
    let topAction: { kind: "critical" | "warning" | "good"; headline: string; action: string } | null = null;

    if (last30NoshowRate > 10) {
      topAction = {
        kind: "critical",
        headline: ko
          ? `30일 노쇼율 ${last30NoshowRate}% — 한국 평균 5% 초과`
          : `30d no-show ${last30NoshowRate}% — exceeds 5% standard`,
        action: ko
          ? "이번 주: ① 예약 D-1 자동 카톡 알림 ② 노쇼 시 다음 예약 보증금 정책 ③ 카카오헤어샵 통합 (자동 알림 + SMS)"
          : "This week: ① auto reminder ② deposit policy ③ KakaoHair integration",
      };
    } else if (yesterdayNoshow >= 2) {
      topAction = {
        kind: "critical",
        headline: ko
          ? `어제 노쇼 ${yesterdayNoshow}건 — 매출 손실 발생`
          : `${yesterdayNoshow} no-shows yesterday`,
        action: ko
          ? "오늘: 노쇼 고객 카톡 발송 (재예약 할인 10%·다음 예약 보증금)"
          : "Today: message no-show clients (10% off + deposit)",
      };
    } else if (todayBookings.length < providers.filter((p) => p.isActive).length * 3) {
      // 디자이너당 일평균 3건 미만 → 빈 슬롯 많음
      topAction = {
        kind: "warning",
        headline: ko
          ? `오늘 예약 ${todayBookings.length}건 — 디자이너 ${providers.filter((p) => p.isActive).length}명 대비 슬롯 여유`
          : `${todayBookings.length} bookings today — open slots`,
        action: ko
          ? "오늘: ① 단골 5명 카톡 (당일 할인) ② 네이버 플레이스 광고 점검 ③ 카카오헤어샵 노출 순위 확인"
          : "Today: ① regular customer msgs ② Naver ads ③ KakaoHair ranking",
      };
    } else if (last30NoshowRate <= 2) {
      topAction = {
        kind: "good",
        headline: ko
          ? `30일 노쇼율 ${last30NoshowRate}% — 카카오헤어샵 0.09% 수준 접근`
          : `30d no-show ${last30NoshowRate}% — top tier`,
        action: ko ? "이번 분기: rebook 캠페인 (시술 후 다음 예약 즉시 안내, Meevo 표준 85%)" : "This Q: rebook campaign (Meevo 85%)",
      };
    }

    return {
      todayBookings, tomorrowBookings,
      yesterdayNoshow, yesterdayCancelled,
      last30NoshowRate, last30Total: noshow30d.total,
      providerStats, topAction,
    };
  }, [bookings, providers, ko]);

  return (
    <article style={cardStyle}>
      <header style={headerRow}>
        <span style={iconBadge}><Calendar size={14} strokeWidth={2.2} /></span>
        <div style={labelStyle}>{ko ? "예약·노쇼·디자이너 · 뷰티" : "Booking · Beauty"}</div>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.6 }}>
          {ko ? `30일 노쇼 ${analysis.last30NoshowRate}%` : `30d no-show ${analysis.last30NoshowRate}%`}
        </span>
      </header>

      {/* ① 상황 (4-col stats) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        <StatBox label={ko ? "오늘" : "Today"} value={`${analysis.todayBookings.length}건`} tone="notable" icon={<Calendar size={12} strokeWidth={2.2} />} />
        <StatBox label={ko ? "내일" : "Tomorrow"} value={`${analysis.tomorrowBookings.length}건`} tone="notable" icon={<Calendar size={12} strokeWidth={2.2} />} />
        <StatBox
          label={ko ? "어제 노쇼" : "Y'day no-show"}
          value={`${analysis.yesterdayNoshow}건`}
          tone={analysis.yesterdayNoshow >= 2 ? "critical" : analysis.yesterdayNoshow >= 1 ? "warning" : "good"}
          icon={<UserX size={12} strokeWidth={2.2} />}
        />
        <StatBox
          label={ko ? "30일 노쇼율" : "30d no-show"}
          value={`${analysis.last30NoshowRate}%`}
          tone={analysis.last30NoshowRate > 10 ? "critical" : analysis.last30NoshowRate > 5 ? "warning" : "good"}
          icon={<AlertTriangle size={12} strokeWidth={2.2} />}
        />
      </div>

      {/* ② 대비 — 디자이너별 매출·점유율·노쇼 */}
      {analysis.providerStats.length > 0 && (
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "rgba(15,23,42,0.55)", letterSpacing: "0.06em",
            textTransform: "uppercase" as const, marginBottom: 8,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Users size={11} strokeWidth={2.2} />
            {ko ? "디자이너별 30일 매출·완료·노쇼율" : "Provider 30d revenue"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
            {analysis.providerStats.map((p) => {
              const noshowColor = p.noshowRate > 10 ? "#b91c1c" : p.noshowRate > 5 ? "#b45309" : "#059669";
              return (
                <div key={p.id} style={{
                  display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 10, alignItems: "center",
                  padding: "8px 10px", borderRadius: 8,
                  background: "rgba(15,23,42,0.02)", border: "1px solid rgba(25,25,112,0.06)",
                }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.6)", fontVariantNumeric: "tabular-nums" }}>
                    {p.completedCount}건
                  </div>
                  <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.7)", fontVariantNumeric: "tabular-nums", fontWeight: 600, minWidth: 60, textAlign: "right" as const }}>
                    {Math.round(p.revenue / 10000).toLocaleString()}만
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: noshowColor, fontVariantNumeric: "tabular-nums", minWidth: 40, textAlign: "right" as const }}>
                    {p.noshowRate}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ③ 행동 */}
      {analysis.topAction && (
        <div style={{
          padding: "12px 14px", borderRadius: 12,
          background: actionColors[analysis.topAction.kind].bg,
          border: `1px solid ${actionColors[analysis.topAction.kind].border}`,
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: actionColors[analysis.topAction.kind].text, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 4 }}>
            {ko ? "오늘 가장 중요한 행동" : "Today's #1 action"}
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", marginBottom: 6, lineHeight: 1.4 }}>
            {analysis.topAction.headline}
          </div>
          <div style={{ fontSize: 12, color: "rgba(15,23,42,0.7)", lineHeight: 1.55 }}>
            {analysis.topAction.action}
          </div>
        </div>
      )}

      <div style={footerStyle}>
        <Sparkles size={11} strokeWidth={1.8} style={{ color: MIDNIGHT, opacity: 0.5, marginRight: 6 }} />
        {ko
          ? "Zenoti·Meevo·Mindbody·카카오헤어샵 표준 — 노쇼 5% 한국 평균 / 0.09% top tier"
          : "Zenoti/Meevo/Mindbody/KakaoHair standards"}
      </div>
    </article>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────

function StatBox({ label, value, tone, icon }: { label: string; value: string; tone: "critical" | "warning" | "good" | "notable"; icon: React.ReactNode }) {
  const c = {
    critical: { bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.20)", text: "#b91c1c" },
    warning: { bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.20)", text: "#b45309" },
    good: { bg: "rgba(5,150,105,0.05)", border: "rgba(5,150,105,0.18)", text: "#059669" },
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
  critical: { bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.20)", text: "#b91c1c" },
  warning: { bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.20)", text: "#b45309" },
  good: { bg: "rgba(5,150,105,0.05)", border: "rgba(5,150,105,0.18)", text: "#059669" },
} as const;

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
  fontSize: 11, color: "rgba(15,23,42,0.55)", lineHeight: 1.5,
  padding: "8px 12px", borderRadius: 9,
  background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.06)",
};
