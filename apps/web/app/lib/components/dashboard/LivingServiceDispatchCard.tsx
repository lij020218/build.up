"use client";

/**
 * LivingServiceDispatchCard — 생활서비스 의뢰·FTFR·기사 가동률 (Phase 2i).
 *
 *  ── 자료 (Agent C 13 자료) ───────────────────────────────────────────
 *  ServiceTitan·Housecall Pro·NetSuite·Praxedo·IBM FTFR·Simpro·KCA 청소대행·
 *  청소연구소 (88% 재구매)·세탁특공대·런드리고
 *  → 생활서비스 daily KPI: 의뢰·FTFR (First-Time Fix Rate)·기사 가동률·재의뢰
 *
 *  build.up 데이터: booking-store 재사용 (provider = 기사, service = 청소·수리·배달).
 *
 *  ── 카드 구조 ───────────────────────────────────────────────────────
 *  ① 상황: 오늘 의뢰 + 미배정 + 어제 완료/취소
 *  ② 대비: 기사별 가동률 + 30일 재의뢰률 (IBM FTFR 80% / 청소연구소 88%)
 *  ③ 행동: top 1 (미배정·재의뢰 부족·기사 유휴 등)
 *  ────────────────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import { Truck, Calendar, AlertTriangle, Sparkles, RotateCw } from "lucide-react";
import { useBookingStore } from "../../stores";

const MIDNIGHT = "#191970";

type Props = { ko: boolean; industryCategoryId?: string };

export function LivingServiceDispatchCard({ ko, industryCategoryId }: Props) {
  const bookings = useBookingStore((s) => s.bookings);
  const providers = useBookingStore((s) => s.providers);
  const seedDemo = useBookingStore((s) => s.seedDemo);

  if (industryCategoryId !== "living-service") return null;

  if (bookings.length === 0) {
    return (
      <article style={cardStyle}>
        <header style={headerRow}>
          <span style={iconBadge}><Truck size={14} strokeWidth={2.2} /></span>
          <div style={labelStyle}>{ko ? "의뢰·기사·FTFR · 생활서비스" : "Dispatch · Service"}</div>
        </header>
        <div style={{ padding: "16px 0", textAlign: "center" as const }}>
          <div style={{ fontSize: 13, color: "rgba(15,23,42,0.65)", marginBottom: 12 }}>
            {ko ? "의뢰·기사 데이터 입력 시 FTFR·재의뢰·기사 가동률 분석" : "Enter dispatch data"}
          </div>
          <button type="button" onClick={() => seedDemo()} style={demoBtnStyle}>
            {ko ? "예시 데이터로 카드 보기" : "Load demo data"}
          </button>
        </div>
      </article>
    );
  }

  const analysis = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);
    const last30Start = new Date(today.getTime() - 30 * 86400000).toISOString().slice(0, 10);

    const todayBookings = bookings.filter((b) => b.date === todayStr);
    const todayUnassigned = todayBookings.filter((b) => !b.providerId).length;
    const yesterdayBookings = bookings.filter((b) => b.date === yesterdayStr);
    const yesterdayCompleted = yesterdayBookings.filter((b) => b.status === "completed").length;
    const yesterdayCancelled = yesterdayBookings.filter((b) => b.status === "cancelled").length;

    // 활성 기사
    const activeDrivers = providers.filter((p) => p.isActive);

    // 기사별 30일 가동률
    const last30 = bookings.filter((b) => b.date >= last30Start && b.date <= todayStr);
    const driverStats = activeDrivers.map((p) => {
      const myBookings = last30.filter((b) => b.providerId === p.id);
      const completed = myBookings.filter((b) => b.status === "completed");
      // 가정: 한 기사 일평균 4건 가능 → 30일 = 120건 풀가동
      const utilization = Math.min(100, Math.round((completed.length / 120) * 100));
      const revenue = completed.reduce((s, b) => s + (b.price ?? 0), 0);
      return { id: p.id, name: p.name, count: completed.length, utilization, revenue };
    }).sort((a, b) => b.utilization - a.utilization);

    // 재의뢰률 — 30일 안에 같은 customerName 가 2회+ 의뢰
    const customerCounts = new Map<string, number>();
    for (const b of last30) {
      if (b.status === "cancelled") continue;
      const key = b.customerId || b.customerName;
      customerCounts.set(key, (customerCounts.get(key) ?? 0) + 1);
    }
    const uniqueCustomers = customerCounts.size;
    const repeatCustomers = Array.from(customerCounts.values()).filter((v) => v >= 2).length;
    const repeatRate = uniqueCustomers > 0 ? Math.round((repeatCustomers / uniqueCustomers) * 100) : 0;

    // top action
    let topAction: { kind: "critical" | "warning" | "good"; headline: string; action: string } | null = null;

    if (todayUnassigned >= 3) {
      topAction = {
        kind: "critical",
        headline: ko ? `미배정 의뢰 ${todayUnassigned}건 — 즉시 dispatch 필요` : `${todayUnassigned} unassigned`,
        action: ko ? "오늘: ① 기사별 가능 시간 즉시 확인 ② 외부 파트너 dispatch (서울 외곽 등) ③ 의뢰자에게 정확한 시간 약속" : "Today: assign now",
      };
    } else if (repeatRate < 30 && uniqueCustomers >= 10) {
      topAction = {
        kind: "critical",
        headline: ko
          ? `30일 재의뢰률 ${repeatRate}% — 청소연구소 88% 미달`
          : `30d repeat ${repeatRate}% — below 88%`,
        action: ko
          ? "이번 주: ① 첫 의뢰 후 7일 follow-up 카톡 ② 정기 서비스 (주1·월1) 제안 ③ FTFR 점검 (IBM 80%+ 기준, 재방문 무료 정책)"
          : "This week: ① 7d follow-up ② recurring service ③ FTFR check",
      };
    } else if (driverStats.some((d) => d.utilization < 40 && d.count >= 5)) {
      const low = driverStats.find((d) => d.utilization < 40 && d.count >= 5);
      if (low) {
        topAction = {
          kind: "warning",
          headline: ko ? `${low.name} 가동률 ${low.utilization}% — 유휴 시간 多` : `${low.name} ${low.utilization}%`,
          action: ko ? "이번 주: ① 기사 가능 시간대 분석 ② 숨고·당근알바·네이버 노출 강화 ③ 다른 지역 의뢰 분담" : "This week: increase ad exposure",
        };
      }
    } else if (repeatRate >= 70 && uniqueCustomers >= 10) {
      topAction = {
        kind: "good",
        headline: ko ? `30일 재의뢰률 ${repeatRate}% — 청소연구소 표준 접근` : `30d repeat ${repeatRate}% — top tier`,
        action: ko ? "이번 분기: 정기 패키지 (월 4회·연 12회) + 추천 인센티브 (3천원 적립)" : "This Q: recurring packages + referral",
      };
    } else if (yesterdayCancelled >= 2) {
      topAction = {
        kind: "warning",
        headline: ko ? `어제 취소 ${yesterdayCancelled}건` : `${yesterdayCancelled} cancellations yesterday`,
        action: ko ? "오늘: 취소 사유 카톡 발송 + 정확한 도착 시간 통보 (지연 시 사전 알림 자동화)" : "Today: cancellation reason + ETA",
      };
    }

    return {
      todayBookings, todayUnassigned, yesterdayCompleted, yesterdayCancelled,
      activeDrivers: activeDrivers.length,
      driverStats, uniqueCustomers, repeatCustomers, repeatRate,
      topAction,
    };
  }, [bookings, providers, ko]);

  return (
    <article style={cardStyle}>
      <header style={headerRow}>
        <span style={iconBadge}><Truck size={14} strokeWidth={2.2} /></span>
        <div style={labelStyle}>{ko ? "의뢰·기사·FTFR · 생활서비스" : "Dispatch · Service"}</div>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.6 }}>
          {ko ? `재의뢰 ${analysis.repeatRate}%` : `Repeat ${analysis.repeatRate}%`}
        </span>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        <StatBox label={ko ? "오늘 의뢰" : "Today"} value={`${analysis.todayBookings.length}건`} tone="notable" icon={<Calendar size={12} strokeWidth={2.2} />} />
        <StatBox label={ko ? "미배정" : "Unassigned"} value={`${analysis.todayUnassigned}건`} tone={analysis.todayUnassigned >= 3 ? "critical" : analysis.todayUnassigned >= 1 ? "warning" : "good"} icon={<AlertTriangle size={12} strokeWidth={2.2} />} />
        <StatBox label={ko ? "어제 완료" : "Y'day done"} value={`${analysis.yesterdayCompleted}건`} tone="good" icon={<Calendar size={12} strokeWidth={2.2} />} />
        <StatBox label={ko ? "활성 기사" : "Drivers"} value={`${analysis.activeDrivers}명`} tone="notable" icon={<Truck size={12} strokeWidth={2.2} />} />
      </div>

      {analysis.driverStats.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(15,23,42,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8 }}>
            {ko ? "기사별 30일 가동률·매출 (ServiceTitan dispatch)" : "Driver 30d utilization"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
            {analysis.driverStats.map((d) => {
              const c = d.utilization >= 70 ? "#059669" : d.utilization >= 40 ? "#b45309" : "#b91c1c";
              return (
                <div key={d.id} style={{
                  display: "grid", gridTemplateColumns: "80px 1fr auto auto", gap: 10, alignItems: "center",
                  padding: "8px 10px", borderRadius: 8,
                  background: "rgba(15,23,42,0.02)", border: "1px solid rgba(25,25,112,0.06)",
                }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{d.name}</div>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(15,23,42,0.06)", overflow: "hidden" }}>
                    <div style={{ width: `${d.utilization}%`, height: "100%", background: c, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.6)", fontVariantNumeric: "tabular-nums" }}>
                    {Math.round(d.revenue / 10000)}만
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c, fontVariantNumeric: "tabular-nums", minWidth: 40, textAlign: "right" as const }}>{d.utilization}%</div>
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
        <RotateCw size={11} strokeWidth={1.8} style={{ color: MIDNIGHT, opacity: 0.5, marginRight: 6 }} />
        {ko ? "ServiceTitan·Housecall Pro·IBM FTFR (80%+)·청소연구소 (재구매 88%) 표준" : "ServiceTitan/Housecall/IBM standards"}
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
