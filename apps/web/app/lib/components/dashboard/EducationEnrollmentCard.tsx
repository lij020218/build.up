"use client";

/**
 * EducationEnrollmentCard — 학원·교습소 재등록 + cohort 잔존율 카드 (Phase 2c).
 *
 *  ── 왜 만들었나 (2026-05-13) ──────────────────────────────────────────
 *  Agent C (17 교육 자료 검증) + 학원조아·공선학관·클래스업·에듀OK·Spider
 *  Strategies·Brightwheel 합의: 한국 학원 핵심 KPI = *재등록 + 학생 잔존*.
 *  한국 학원은 월 단위 갱신 — 매월 25-30일 재등록 알람 필수. 미수금 5-10%
 *  ARS 의무 (교육청 현금출납부 점검) — v1 은 재등록 + 잔존 우선.
 *
 *  Found.One 기존 데이터 (ARCHITECTURE 체크리스트):
 *    · operations-store.members — { id, name, plan, fee, startDate, endDate }
 *      → 학원·학생은 동일 모델 활용 (plan=반·과목, endDate=수강 마감)
 *    · 출석·미수금 데이터 없음 (v2 — 신규 데이터 모델)
 *    · FitnessRetentionCard 와 동일 패턴 (재사용)
 *
 *  ── 한국 학원 특수성 ────────────────────────────────────────────────
 *  · D-14 강조 (vs 피트니스 D-7) — 학부모 결정 시간 필요 (재등록·환불 협의)
 *  · 월 단위 cycle — startDate 잔존율 30/60/90일 + 1년 (long retention)
 *  · 잔존율 임계: 30일 80%·60일 70%·90일 60%·1년 50% (Spider Strategies)
 *
 *  ── 카드 구조 (사장님 원칙: 상황 → 대비 → 행동) ─────────────────────
 *  ① 상황: 활성 학생 수 + 재등록 D-14 임박 + 신규 등록 (지난 30일)
 *  ② 대비: 30/60/90/365일 cohort 잔존율 + 임계 신호등
 *  ③ 행동: top 1 critical (D-14 임박 다수 / 90일 잔존 <60% 등)
 *
 *  ── 출처 (3개) ──────────────────────────────────────────────────────
 *  · 학원조아 CRM (한국 학원 재등록 표준 — 월말 D-14 알림)
 *  · Spider Strategies Education KPI (반별·잔존 KPI)
 *  · Brightwheel Childcare Financial Metrics (월 수강료·미수금)
 *  ────────────────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import { GraduationCap, AlertTriangle, Calendar, TrendingDown, Sparkles } from "lucide-react";
import { useOperationsStore } from "../../stores";
// 2026-05-13 — SSOT (cohort-retention.ts, 15 unit tests 검증)
import {
  memberCohortRetention,
  expiringMembers,
  newMemberCount,
} from "@foundone/shared";
import { getKstDate } from "../../utils/business-day";

const MIDNIGHT = "#191970";

type Props = { ko: boolean; industryCategoryId?: string };

export function EducationEnrollmentCard({ ko, industryCategoryId }: Props) {
  // ⚠️ 2026-05-25 audit fix: Rules of Hooks 위반 수정 — hook을 early return 앞으로 이동.
  const members = useOperationsStore((s) => s.members);

  const analysis = useMemo(() => {
    const now = new Date();
    // 2026-05-13 — SSOT 사용 (cohort-retention.ts).
    //   학원 cohort 윈도우 = ±14일 (학부모 결정 시간 표준).
    //   1년 cohort 는 long retention 강조 — Spider Strategies·Brightwheel.
    const todayStr = getKstDate(now);
    const active = members.filter((m) => m.endDate && m.endDate >= todayStr);

    // D-14 재등록 임박 (한국 학원 월 단위 cycle)
    const d14 = expiringMembers(members, 14, now);
    const expiringIds = new Set(d14.members.map((m) => m.id ?? `${m.startDate}|${m.endDate}`));
    // D-30 재등록 *준비* (D-14 제외)
    const d30all = expiringMembers(members, 30, now);
    const reEnrollD30 = d30all.members.filter(
      (m) => !expiringIds.has(m.id ?? `${m.startDate}|${m.endDate}`),
    );
    const reEnrollD14 = d14.members;

    // cohort 잔존율 — 한국 학원 표준 (학부모 결정 시간 14일 윈도우)
    const retention30 = memberCohortRetention(members, 30, 14, now);
    const retention60 = memberCohortRetention(members, 60, 14, now);
    const retention90 = memberCohortRetention(members, 90, 14, now);
    const retention365 = memberCohortRetention(members, 365, 14, now);

    // 신규 등록 + 월 수강료 합산
    const newLast30 = newMemberCount(members, 30, now);
    const monthlyFeesKrw = active.reduce((sum, m) => sum + (m.fee ?? 0), 0);

    // top action — 한국 학원 임계값
    let topAction: { kind: "critical" | "warning" | "good"; headline: string; action: string } | null = null;

    if (reEnrollD14.length >= 5) {
      topAction = {
        kind: "critical",
        headline: ko
          ? `재등록 D-14 임박 ${reEnrollD14.length}명 — 학부모 컨택 필수`
          : `${reEnrollD14.length} students up for re-enrollment in 14 days`,
        action: ko
          ? "이번 주: ① 재등록 임박 학부모 전체 카톡/문자 발송 ② 1:1 면담 (장기 등록 할인·다과목 묶음) ③ 형제·자매 등록 인센티브"
          : "This week: ① mass message ② 1:1 meetings ③ sibling incentive",
      };
    } else if (retention90.total >= 3 && retention90.rate < 60) {
      topAction = {
        kind: "critical",
        headline: ko
          ? `90일 잔존율 ${retention90.rate}% — 한국 학원 표준 60% 미달`
          : `90-day retention ${retention90.rate}% — below KR 60% standard`,
        action: ko
          ? "이번 주: ① 이탈 학생 학부모 5명 인터뷰 (사유 파악) ② 성적 향상 보고서 자동화 ③ 학원장 직접 상담 introduce"
          : "This week: ① parent interviews ② grade report automation ③ director consultations",
      };
    } else if (reEnrollD14.length >= 1) {
      topAction = {
        kind: "warning",
        headline: ko ? `재등록 D-14 임박 ${reEnrollD14.length}명` : `${reEnrollD14.length} re-enrollment D-14`,
        action: ko ? "이번 주: 학부모 카톡 발송 + 1:1 상담 가능 시간 안내" : "This week: parent message + consultation slot",
      };
    } else if (retention365.total >= 5 && retention365.rate >= 60) {
      topAction = {
        kind: "good",
        headline: ko
          ? `1년 잔존율 ${retention365.rate}% — 한국 학원 상위 30%`
          : `1-year retention ${retention365.rate}% — top 30%`,
        action: ko ? "이번 분기: 입소문 referral 캠페인 (형제·자매·친구 등록 시 1개월 무료)" : "This Q: word-of-mouth campaign",
      };
    } else if (newLast30 < 2 && active.length > 5) {
      topAction = {
        kind: "warning",
        headline: ko ? `지난 30일 신규 ${newLast30}명 — 신규 유입 부족` : `Only ${newLast30} new students last 30d`,
        action: ko ? "이번 달: ① 네이버 플레이스 리뷰 5개+ 확보 ② 시범 수업 1주 무료 캠페인" : "This month: ① 5+ Naver reviews ② free trial week",
      };
    }

    return {
      active,
      reEnrollD14,
      reEnrollD30,
      retention30,
      retention60,
      retention90,
      retention365,
      newLast30,
      monthlyFeesKrw,
      topAction,
    };
  }, [members, ko]);

  // hook 호출 끝 — 조건부 렌더 안전.
  if (industryCategoryId !== "education") return null;
  if (!members || members.length === 0) {
    return (
      <article style={cardStyle}>
        <header style={headerRow}>
          <span style={iconBadge}><GraduationCap size={14} strokeWidth={2.2} /></span>
          <div style={labelStyle}>{ko ? "재등록 + 학생 잔존 · 교육" : "Re-enrollment · Education"}</div>
        </header>
        <div style={{ padding: "20px 0", textAlign: "center" as const, color: "rgba(15,23,42,0.5)", fontSize: 13 }}>
          {ko ? "학생 데이터를 입력하면 재등록 D-14 + cohort 잔존율 분석이 시작됩니다 (내 가게 > 회원 관리)" : "Enter student data to unlock re-enrollment analysis"}
        </div>
      </article>
    );
  }

  const feesManwon = Math.round(analysis.monthlyFeesKrw / 10000);

  return (
    <article style={cardStyle}>
      <header style={headerRow}>
        <span style={iconBadge}><GraduationCap size={14} strokeWidth={2.2} /></span>
        <div style={labelStyle}>
          {ko ? "재등록 + 학생 잔존 · 교육" : "Re-enrollment · Education"}
        </div>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.6 }}>
          {ko
            ? `${analysis.active.length}명 · ${feesManwon.toLocaleString()}만원/월`
            : `${analysis.active.length} · ₩${feesManwon}만/mo`}
        </span>
      </header>

      {/* ① 상황 — D-14 / D-30 / 신규 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <StatBox
          label={ko ? "D-14 임박" : "D-14"}
          value={`${analysis.reEnrollD14.length}명`}
          tone={analysis.reEnrollD14.length >= 5 ? "critical" : analysis.reEnrollD14.length >= 1 ? "warning" : "good"}
          icon={<AlertTriangle size={12} strokeWidth={2.2} />}
        />
        <StatBox
          label={ko ? "D-30 예정" : "D-30"}
          value={`${analysis.reEnrollD30.length}명`}
          tone="notable"
          icon={<Calendar size={12} strokeWidth={2.2} />}
        />
        <StatBox
          label={ko ? "30일 신규" : "30d new"}
          value={`${analysis.newLast30}명`}
          tone={analysis.newLast30 >= 3 ? "good" : analysis.newLast30 >= 1 ? "notable" : "warning"}
          icon={<TrendingDown size={12} strokeWidth={2.2} style={{ transform: "rotate(180deg)" }} />}
        />
      </div>

      {/* ② 대비 — cohort 4-칸 (한국 학원 long retention 강조) */}
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "rgba(15,23,42,0.55)", letterSpacing: "0.06em",
          textTransform: "uppercase" as const, marginBottom: 8,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <TrendingDown size={11} strokeWidth={2.2} />
          {ko ? "Cohort 잔존율 (한국 학원 90d=60% / 1y=50%)" : "Cohort retention (KR 90d=60% / 1y=50%)"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          <CohortBox days={30} cohort={analysis.retention30} threshold={80} ko={ko} />
          <CohortBox days={60} cohort={analysis.retention60} threshold={70} ko={ko} />
          <CohortBox days={90} cohort={analysis.retention90} threshold={60} ko={ko} />
          <CohortBox days={365} cohort={analysis.retention365} threshold={50} ko={ko} label={ko ? "1년" : "1y"} />
        </div>
      </div>

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
          ? "학원조아·공선학관·Spider Strategies Education KPI 표준 + 한국 학원 D-14 월단위 cycle"
          : "학원조아 CRM · Spider Strategies · Brightwheel standards"}
      </div>
    </article>
  );
}

// ─── helpers (FitnessRetentionCard 와 동일 패턴) ─────────────────────

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
      padding: "10px 12px", borderRadius: 11,
      background: c.bg, border: `1px solid ${c.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
        <span style={{ color: c.text }}>{icon}</span>
        <div style={{ fontSize: 10, fontWeight: 700, color: c.text, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
          {label}
        </div>
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, color: c.text, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  );
}

function CohortBox({ days, cohort, threshold, ko, label }: {
  days: number;
  cohort: { total: number; stillActive: number; rate: number };
  threshold: number;
  ko: boolean;
  label?: string;
}) {
  const tone = cohort.total < 3 ? "notable"
    : cohort.rate >= threshold ? "good"
      : cohort.rate >= threshold - 15 ? "warning"
        : "critical";
  const c = {
    critical: "#b91c1c",
    warning: "#b45309",
    good: "#059669",
    notable: "rgba(15,23,42,0.5)",
  }[tone];
  return (
    <div style={{
      padding: "9px 10px", borderRadius: 10,
      background: "rgba(15,23,42,0.02)", border: "1px solid rgba(25,25,112,0.08)",
      textAlign: "center" as const,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(15,23,42,0.55)", letterSpacing: "0.04em", marginBottom: 3 }}>
        {label ?? (ko ? `${days}일` : `${days}d`)}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: c, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
        {cohort.total >= 3 ? `${cohort.rate}%` : "—"}
      </div>
      <div style={{ fontSize: 9.5, color: "rgba(15,23,42,0.5)", marginTop: 1 }}>
        {cohort.total > 0 ? `${cohort.stillActive}/${cohort.total}` : (ko ? "—" : "—")}
      </div>
    </div>
  );
}

const actionColors = {
  critical: { bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.20)", text: "#b91c1c" },
  warning: { bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.20)", text: "#b45309" },
  good: { bg: "rgba(5,150,105,0.05)", border: "rgba(5,150,105,0.18)", text: "#059669" },
} as const;

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
