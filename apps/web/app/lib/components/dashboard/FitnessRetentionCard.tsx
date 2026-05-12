"use client";

/**
 * FitnessRetentionCard — 피트니스 회원 retention + 만료 임박 카드 (Phase 2b).
 *
 *  ── 왜 만들었나 (2026-05-13) ──────────────────────────────────────────
 *  Agent C (105 자료 검증) + Mindbody·MarianaTek·Glofox·WellnessLiving·FIA
 *  Retention Report 합의: 피트니스 사장님 daily KPI #1 = *회원 retention*.
 *  FIA: 신규 회원 50% 가 *90일 내 이탈*. 한국 "바디프로필 열풍" 후 1회성 가입
 *  비중 더 큼 — 90일 잔존이 살아남는 헬스장의 결정적 지표.
 *
 *  build.up 기존 데이터:
 *    · operations-store.members — { id, name, plan, fee, startDate, endDate }
 *    · 회원권 만료일 (endDate) → D-7 만료 임박 자동 검출
 *    · startDate → 30/60/90일 cohort 잔존율 계산
 *    · 출석 데이터 없음 (v2 추가 예정 — 신규 데이터 모델 필요)
 *
 *  ── 카드 구조 (사장님 원칙: 상황 → 대비 → 행동) ─────────────────────
 *  ① 상황: 활성 회원 수 + 회원권 만료 D-7 임박 카운트 (red 강조)
 *  ② 대비: 30/60/90일 cohort 잔존율 (FIA 50% threshold)
 *  ③ 행동: 가장 critical 1개 (예: "D-7 만료 5명 → 오늘 갱신 캠페인 발송")
 *
 *  ── 출처 (3개) ──────────────────────────────────────────────────────
 *  · Mindbody KPI Check-in — Visit Trends·retention 표준
 *  · MarianaTek Financial KPIs Guide — 잔존율 leading indicator
 *  · FIA Retention Report — 90일 50% 이탈 통계
 *  ────────────────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import { Users, AlertTriangle, Calendar, TrendingDown, Sparkles } from "lucide-react";
import { useOperationsStore } from "../../stores";

const MIDNIGHT = "#191970";

type Props = { ko: boolean; industryCategoryId?: string };

export function FitnessRetentionCard({ ko, industryCategoryId }: Props) {
  const members = useOperationsStore((s) => s.members);

  // 내부 가드 — 피트니스 외 업종은 자체 null 반환 (라우터 매트릭스 외에 안전망)
  if (industryCategoryId !== "fitness") return null;
  if (!members || members.length === 0) {
    return (
      <article style={cardStyle}>
        <header style={headerRow}>
          <span style={iconBadge}><Users size={14} strokeWidth={2.2} /></span>
          <div style={labelStyle}>{ko ? "회원 Retention · 피트니스" : "Member Retention · Fitness"}</div>
        </header>
        <div style={{ padding: "20px 0", textAlign: "center" as const, color: "rgba(15,23,42,0.5)", fontSize: 13 }}>
          {ko ? "회원 데이터를 입력하면 만료 임박 + cohort 잔존율 분석이 시작됩니다 (내 가게 > 회원 관리)" : "Enter member data to unlock retention analysis"}
        </div>
      </article>
    );
  }

  const analysis = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const todayMs = today.getTime();

    // 활성 회원: endDate >= today
    const active = members.filter((m) => m.endDate && m.endDate >= todayStr);

    // D-7 만료 임박: 오늘 ~ +7일
    const sevenDaysLater = new Date(todayMs + 7 * 86400000).toISOString().slice(0, 10);
    const expiringD7 = active.filter((m) => m.endDate >= todayStr && m.endDate <= sevenDaysLater);

    // D-30 만료 (D-7 제외): 8일 ~ 30일
    const thirtyDaysLater = new Date(todayMs + 30 * 86400000).toISOString().slice(0, 10);
    const expiringD30 = active.filter(
      (m) => m.endDate > sevenDaysLater && m.endDate <= thirtyDaysLater,
    );

    // 30/60/90일 cohort 잔존율 — 지난 N일 *전에* 가입한 회원 중 현재까지 active 비율.
    // 한국 헬스장 1년 회원권 흔함 — startDate 기준 cohort 정의.
    function cohortRetention(daysAgo: number): { total: number; stillActive: number; rate: number } {
      const cutoffStart = new Date(todayMs - (daysAgo + 7) * 86400000).toISOString().slice(0, 10);
      const cutoffEnd = new Date(todayMs - (daysAgo - 7) * 86400000).toISOString().slice(0, 10);
      // 7일 윈도우 — daysAgo ± 7일 사이 가입자
      const cohort = members.filter((m) => m.startDate >= cutoffStart && m.startDate <= cutoffEnd);
      const stillActive = cohort.filter((m) => m.endDate >= todayStr).length;
      const rate = cohort.length > 0 ? Math.round((stillActive / cohort.length) * 100) : 0;
      return { total: cohort.length, stillActive, rate };
    }

    const retention30 = cohortRetention(30);
    const retention60 = cohortRetention(60);
    const retention90 = cohortRetention(90);

    // 신규 등록 (지난 30일)
    const last30Start = new Date(todayMs - 30 * 86400000).toISOString().slice(0, 10);
    const newLast30 = members.filter((m) => m.startDate >= last30Start).length;

    // 가장 critical 신호 결정 (사장님 원칙: 행동 1개)
    let topAction: { kind: "critical" | "warning" | "good"; headline: string; action: string } | null = null;

    if (expiringD7.length >= 5) {
      topAction = {
        kind: "critical",
        headline: ko
          ? `회원권 D-7 임박 ${expiringD7.length}명 — 갱신 캠페인 필수`
          : `${expiringD7.length} memberships expiring in 7 days`,
        action: ko
          ? "오늘: ① 만료 임박 회원 명단 확인 ② 갱신 할인 (15-20% off) 카톡/문자 발송 ③ 트레이너 1:1 컨택"
          : "Today: ① review list ② send renewal discount ③ trainer 1:1 outreach",
      };
    } else if (retention90.total >= 3 && retention90.rate < 50) {
      topAction = {
        kind: "critical",
        headline: ko
          ? `90일 잔존율 ${retention90.rate}% — FIA 기준 50% 미달`
          : `90-day retention ${retention90.rate}% — below FIA 50% benchmark`,
        action: ko
          ? "이번 주: ① 90일 이탈자 5명 인터뷰 (이탈 사유) ② 30·60·90일 체크인 자동화 도입"
          : "This week: ① interview 5 churned members ② automate 30/60/90 check-ins",
      };
    } else if (expiringD7.length >= 1) {
      topAction = {
        kind: "warning",
        headline: ko ? `회원권 D-7 임박 ${expiringD7.length}명` : `${expiringD7.length} expiring D-7`,
        action: ko ? "오늘: 만료 임박 회원에게 갱신 안내 발송" : "Today: send renewal reminders",
      };
    } else if (retention30.rate >= 70 && retention30.total >= 5) {
      topAction = {
        kind: "good",
        headline: ko
          ? `30일 잔존율 ${retention30.rate}% — Mindbody 표준 상위`
          : `30-day retention ${retention30.rate}% — top quartile`,
        action: ko ? "이번 분기: 단골 추천 캠페인 (referral 인센티브)" : "This Q: regular-referral campaign",
      };
    }

    return {
      active,
      expiringD7,
      expiringD30,
      retention30,
      retention60,
      retention90,
      newLast30,
      topAction,
    };
  }, [members, ko]);

  return (
    <article style={cardStyle}>
      <header style={headerRow}>
        <span style={iconBadge}><Users size={14} strokeWidth={2.2} /></span>
        <div style={labelStyle}>
          {ko ? "회원 Retention · 피트니스" : "Member Retention · Fitness"}
        </div>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.6 }}>
          {ko ? `활성 ${analysis.active.length}명` : `${analysis.active.length} active`}
        </span>
      </header>

      {/* ① 상황 — D-7 만료 임박 강조 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatBox
          label={ko ? "D-7 만료 임박" : "D-7 expiring"}
          value={`${analysis.expiringD7.length}명`}
          tone={analysis.expiringD7.length >= 5 ? "critical" : analysis.expiringD7.length >= 1 ? "warning" : "good"}
          icon={<AlertTriangle size={13} strokeWidth={2.2} />}
        />
        <StatBox
          label={ko ? "D-30 만료 예정" : "D-30 expiring"}
          value={`${analysis.expiringD30.length}명`}
          tone="notable"
          icon={<Calendar size={13} strokeWidth={2.2} />}
        />
      </div>

      {/* ② 대비 — 30/60/90일 cohort 잔존율 */}
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "rgba(15,23,42,0.55)", letterSpacing: "0.06em",
          textTransform: "uppercase" as const, marginBottom: 8,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <TrendingDown size={11} strokeWidth={2.2} />
          {ko ? "Cohort 잔존율 (FIA 기준 90일 50%)" : "Cohort retention (FIA 90d=50%)"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <CohortBox days={30} cohort={analysis.retention30} ko={ko} />
          <CohortBox days={60} cohort={analysis.retention60} ko={ko} />
          <CohortBox days={90} cohort={analysis.retention90} ko={ko} />
        </div>
      </div>

      {/* ③ 행동 — top 1 critical */}
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

      {/* footer */}
      <div style={footerStyle}>
        <Sparkles size={11} strokeWidth={1.8} style={{ color: MIDNIGHT, opacity: 0.5, marginRight: 6 }} />
        {ko
          ? `지난 30일 신규 ${analysis.newLast30}명 · Mindbody·MarianaTek·FIA Retention 표준 적용`
          : `New last 30d: ${analysis.newLast30} · Mindbody/MarianaTek/FIA standards`}
      </div>
    </article>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────

function StatBox({
  label, value, tone, icon,
}: {
  label: string; value: string;
  tone: "critical" | "warning" | "good" | "notable";
  icon: React.ReactNode;
}) {
  const c = {
    critical: { bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.20)", text: "#b91c1c" },
    warning: { bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.20)", text: "#b45309" },
    good: { bg: "rgba(5,150,105,0.05)", border: "rgba(5,150,105,0.18)", text: "#059669" },
    notable: { bg: `${MIDNIGHT}08`, border: `${MIDNIGHT}22`, text: MIDNIGHT },
  }[tone];
  return (
    <div style={{
      padding: "12px 14px", borderRadius: 12,
      background: c.bg, border: `1px solid ${c.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
        <span style={{ color: c.text }}>{icon}</span>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: c.text, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
          {label}
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.text, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  );
}

function CohortBox({ days, cohort, ko }: { days: number; cohort: { total: number; stillActive: number; rate: number }; ko: boolean }) {
  // FIA 90일 50% 기준 (Mindbody·MarianaTek 인용)
  const tone = cohort.total < 3
    ? "notable"  // 데이터 부족
    : cohort.rate >= 70 ? "good"
      : cohort.rate >= 50 ? "warning"
        : "critical";
  const c = {
    critical: "#b91c1c",
    warning: "#b45309",
    good: "#059669",
    notable: "rgba(15,23,42,0.5)",
  }[tone];
  return (
    <div style={{
      padding: "10px 12px", borderRadius: 10,
      background: "rgba(15,23,42,0.02)", border: "1px solid rgba(25,25,112,0.08)",
      textAlign: "center" as const,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(15,23,42,0.55)", letterSpacing: "0.04em", marginBottom: 4 }}>
        {ko ? `${days}일` : `${days}d`}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: c, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
        {cohort.total >= 3 ? `${cohort.rate}%` : "—"}
      </div>
      <div style={{ fontSize: 10, color: "rgba(15,23,42,0.5)", marginTop: 2 }}>
        {cohort.total > 0 ? `${cohort.stillActive}/${cohort.total}` : (ko ? "데이터 부족" : "No data")}
      </div>
    </div>
  );
}

const actionColors = {
  critical: { bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.20)", text: "#b91c1c" },
  warning: { bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.20)", text: "#b45309" },
  good: { bg: "rgba(5,150,105,0.05)", border: "rgba(5,150,105,0.18)", text: "#059669" },
} as const;

// ─── styles ──────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 20,
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
  padding: "22px 24px",
  display: "flex", flexDirection: "column" as const, gap: 14,
};

const headerRow: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10,
};

const iconBadge: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8,
  background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.85) 100%)`,
  color: "white",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 4px 12px rgba(25,25,112,0.25)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: MIDNIGHT,
  opacity: 0.75,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};

const footerStyle: React.CSSProperties = {
  display: "flex", alignItems: "center",
  fontSize: 11, color: "rgba(15,23,42,0.55)", lineHeight: 1.5,
  padding: "8px 12px", borderRadius: 9,
  background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.06)",
};
