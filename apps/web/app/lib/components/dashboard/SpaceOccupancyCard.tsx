"use client";

/**
 * SpaceOccupancyCard — 공간임대 POR·시간대 매출·예약 (Phase 2h).
 *
 *  ── 자료 (Agent C 15 자료) ───────────────────────────────────────────
 *  OfficeRnD·스페이스클라우드·스페이스마켓·무인연구소·쏘플·작심스터디카페·
 *  플랜트스터디카페·세컨드샐러리 — 공간임대 daily KPI = POR (Percent Occupied
 *  Rate) + RevPAD (Revenue per Available Day). 한국 무인 스터디카페 BEP = 60-70% POR.
 *
 *  build.up 데이터: booking-store 재사용.
 *    · providerName = 룸 ID (룸A·룸B·테이블1 등)
 *    · service = "2시간 4명" 등 자유 입력
 *
 *  카드 구조:
 *    ① 상황: 오늘 POR (BEP 60% 선) + 내일 예약 + 어제 매출
 *    ② 대비: 룸별 점유율 + 시간대 분포 (평일 19-22시 / 주말 오전 양봉)
 *    ③ 행동: top 1 (POR <60% → 빈 슬롯 마케팅 / 청소 시급 등)
 *  ────────────────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import { LayoutGrid, Calendar, AlertTriangle, Sparkles, Clock } from "lucide-react";
import { useBookingStore } from "../../stores";
// 2026-05-13 — SSOT (booking-analytics.ts)
//   calculatePOR · timeDistribution · peakBucket — OfficeRnD POR + 무인 스터디 BEP 60-70%.
import {
  calculatePOR,
  timeDistribution,
  peakBucket as ssotPeakBucket,
} from "@build-up/shared";

const MIDNIGHT = "#191970";

type Props = { ko: boolean; industryCategoryId?: string };

export function SpaceOccupancyCard({ ko, industryCategoryId }: Props) {
  const bookings = useBookingStore((s) => s.bookings);
  const providers = useBookingStore((s) => s.providers); // 룸 = provider 모델 재사용
  const seedDemo = useBookingStore((s) => s.seedDemo);

  if (industryCategoryId !== "space") return null;

  if (bookings.length === 0) {
    return (
      <article style={cardStyle}>
        <header style={headerRow}>
          <span style={iconBadge}><LayoutGrid size={14} strokeWidth={2.2} /></span>
          <div style={labelStyle}>{ko ? "POR·시간대 · 공간임대" : "POR · Space"}</div>
        </header>
        <div style={{ padding: "16px 0", textAlign: "center" as const }}>
          <div style={{ fontSize: 13, color: "rgba(15,23,42,0.65)", marginBottom: 12 }}>
            {ko ? "예약·룸 데이터 입력 시 POR (점유율) + 시간대 분석" : "Enter bookings + rooms for POR"}
          </div>
          <button type="button" onClick={() => seedDemo()} style={demoBtnStyle}>
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
    const last7Start = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);

    const todayBookings = bookings.filter((b) => b.date === todayStr);
    const tomorrowBookings = bookings.filter((b) => b.date === tomorrowStr);
    const yesterdayBookings = bookings.filter((b) => b.date === yesterdayStr && b.status === "completed");
    const yesterdayRevenue = yesterdayBookings.reduce((s, b) => s + (b.price ?? 0), 0);

    // 활성 룸 + 운영 시간 (10-22시 가정)
    const activeRooms = providers.filter((p) => p.isActive);
    const OPERATING_HOURS = 12;
    const totalSlotsToday = activeRooms.length * OPERATING_HOURS;

    // 2026-05-13 — SSOT (calculatePOR, OfficeRnD POR 표준).
    //   POR = 점유 슬롯 / 가능 슬롯. 무인 스터디카페 BEP 60-70%.
    const todayPor = calculatePOR(todayBookings.length, totalSlotsToday);

    // 7일 평균 POR
    const last7 = bookings.filter((b) => b.date >= last7Start && b.date <= todayStr);
    const avgPor7 = calculatePOR(last7.length, totalSlotsToday * 7);

    // 룸별 7일 점유율 — calculatePOR 재사용 (룸 1개 × 7일 × 12시간 = 84 슬롯)
    const roomStats = activeRooms.map((p) => {
      const myBookings = last7.filter((b) => b.providerId === p.id && b.status !== "cancelled");
      const rate = calculatePOR(myBookings.length, OPERATING_HOURS * 7);
      return { id: p.id, name: p.name, count: myBookings.length, rate };
    }).sort((a, b) => b.rate - a.rate);

    // 시간대 분포 — SSOT (timeDistribution + peakBucket)
    //   bucketTime: <12 morning · <17 afternoon · <22 evening · 22+ night
    const timeBuckets = timeDistribution(bookings, 7, now);
    const totalBucket = Object.values(timeBuckets).reduce((s, v) => s + v, 0);
    const peakResult = ssotPeakBucket(timeBuckets);
    // 기존 호환 위해 [bucket, count] 튜플 형식 유지
    const peakBucket: [keyof typeof timeBuckets, number] | null =
      peakResult ? [peakResult.bucket, peakResult.count] : null;

    // top action
    let topAction: { kind: "critical" | "warning" | "good"; headline: string; action: string } | null = null;

    if (avgPor7 < 50) {
      topAction = {
        kind: "critical",
        headline: ko
          ? `7일 평균 POR ${avgPor7}% — 무인 스터디카페 BEP 60-70% 미달`
          : `7d POR ${avgPor7}% — below BEP`,
        action: ko
          ? "이번 주: ① 평일 점심·새벽 시간대 50%+ 할인 ② 스페이스클라우드 노출 점검 ③ 단골 추천 (referral 1시간 무료)"
          : "This week: ① off-peak discount ② Spacecloud ranking ③ referral",
      };
    } else if (todayPor < 30 && todayBookings.length < 5) {
      topAction = {
        kind: "warning",
        headline: ko ? `오늘 POR ${todayPor}% — 빈 슬롯 多` : `Today POR ${todayPor}% — many slots open`,
        action: ko ? "오늘: 당일 50% 할인 카톡 + 인스타 스토리 (마지막 슬롯 알림)" : "Today: same-day discount + IG story",
      };
    } else if (avgPor7 >= 75) {
      topAction = {
        kind: "good",
        headline: ko ? `7일 평균 POR ${avgPor7}% — OfficeRnD 상위 quartile` : `7d POR ${avgPor7}% — top quartile`,
        action: ko ? "이번 분기: ① 가격 5-10% 인상 검토 ② 인접 호실 추가 임대 ROI 계산" : "This Q: ① +5-10% pricing ② expand rooms",
      };
    } else if (peakBucket && peakBucket[1] / totalBucket > 0.5) {
      const peakLabel = { morning: "오전", afternoon: "오후", evening: "저녁", night: "심야" }[peakBucket[0]];
      topAction = {
        kind: "warning",
        headline: ko
          ? `${peakLabel} 시간대 ${Math.round((peakBucket[1] / totalBucket) * 100)}% 집중 — 비피크 활용 여지`
          : `${peakLabel} ${Math.round((peakBucket[1] / totalBucket) * 100)}% concentration`,
        action: ko ? "이번 분기: 비피크 시간대 (오전·심야) 특화 패키지 (스터디·녹음·1인 회의)" : "This Q: off-peak packages",
      };
    }

    return {
      todayBookings, tomorrowBookings, yesterdayRevenue,
      activeRoomsCount: activeRooms.length,
      todayPor, avgPor7,
      roomStats, timeBuckets, peakBucket,
      topAction,
    };
  }, [bookings, providers, ko]);

  return (
    <article style={cardStyle}>
      <header style={headerRow}>
        <span style={iconBadge}><LayoutGrid size={14} strokeWidth={2.2} /></span>
        <div style={labelStyle}>{ko ? "POR·시간대 · 공간임대" : "POR · Space"}</div>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.6 }}>
          {ko ? `7일 평균 ${analysis.avgPor7}%` : `7d ${analysis.avgPor7}%`}
        </span>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        <StatBox label={ko ? "오늘 POR" : "Today POR"} value={`${analysis.todayPor}%`} tone={analysis.todayPor >= 60 ? "good" : analysis.todayPor >= 40 ? "warning" : "critical"} icon={<LayoutGrid size={12} strokeWidth={2.2} />} />
        <StatBox label={ko ? "내일 예약" : "Tomorrow"} value={`${analysis.tomorrowBookings.length}건`} tone="notable" icon={<Calendar size={12} strokeWidth={2.2} />} />
        <StatBox label={ko ? "어제 매출" : "Y'day rev"} value={`${Math.round(analysis.yesterdayRevenue / 10000)}만`} tone="notable" icon={<Sparkles size={12} strokeWidth={2.2} />} />
        <StatBox label={ko ? "활성 룸" : "Active rooms"} value={`${analysis.activeRoomsCount}개`} tone="notable" icon={<LayoutGrid size={12} strokeWidth={2.2} />} />
      </div>

      {analysis.roomStats.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(15,23,42,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8 }}>
            {ko ? "룸별 7일 점유율 (BEP 60% 선)" : "Room 7d occupancy"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
            {analysis.roomStats.map((r) => {
              const c = r.rate >= 60 ? "#059669" : r.rate >= 40 ? "#b45309" : "#b91c1c";
              return (
                <div key={r.id} style={{
                  display: "grid", gridTemplateColumns: "80px 1fr auto auto", gap: 10, alignItems: "center",
                  padding: "8px 10px", borderRadius: 8,
                  background: "rgba(15,23,42,0.02)", border: "1px solid rgba(25,25,112,0.06)",
                }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{r.name}</div>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(15,23,42,0.06)", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(r.rate, 100)}%`, height: "100%", background: c, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.6)", fontVariantNumeric: "tabular-nums" }}>{r.count}건</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c, fontVariantNumeric: "tabular-nums", minWidth: 40, textAlign: "right" as const }}>{r.rate}%</div>
                </div>
              );
            })}
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
        <Clock size={11} strokeWidth={1.8} style={{ color: MIDNIGHT, opacity: 0.5, marginRight: 6 }} />
        {ko ? "OfficeRnD POR·RevPAD + 한국 무인 스터디카페 BEP 60-70% (쏘플·작심)" : "OfficeRnD/Spacecloud standards"}
      </div>
    </article>
  );
}

// ─── helpers (재사용) ─────────────────────────────────────────────────

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
        <div style={{ fontSize: 9.5, fontWeight: 700, color: c.text, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{label}</div>
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
  fontSize: 11, color: "rgba(15,23,42,0.55)", lineHeight: 1.5,
  padding: "8px 12px", borderRadius: 9,
  background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.06)",
};
