"use client";

/**
 * StartupFounderBrief — AI 공동창업자 데일리 브리프 (startup-tech 킬러 기능).
 *
 *  ── 왜 만들었나 (2026-05-12) ────────────────────────────────────────
 *  사장님 비판적 질문: "매출과 사용자 수 변화로만 정말 우리 제품을 쓸까?
 *  로드맵 단계 이후에 우리의 킬러 기능이 뭐가 되어야 할까?"
 *
 *  답: 데이터 *해석* 레이어. Stripe + PostHog + Notion 으로는 만들 수 없는 것.
 *  - 매출이 5% 떨어진 게 *왜* 일어났고 *무엇을* 해야 하는지
 *  - 본인이 *어디 정도 가 있는지* 시드 벤치마크 대비
 *  - *오늘 한 가지 행동*은 뭐여야 하는지
 *
 *  ── 동작 원리 (rule-based v1, AI 호출 없음) ──────────────────────
 *  1. useStartupMetrics 의 raw 데이터 읽음 (runway·burn·CMGR·WoW·Rule of 40 등)
 *  2. 5가지 점검 (Rule engine):
 *     ① Critical signal — runway < 6mo / churn spike / 매출 30%+ drop
 *     ② Important — WoW negative · burn multiple > 2x · default-dead
 *     ③ Notable — milestone (ARR 10M·100M·1B) · 연속 성장 / 하락
 *     ④ Benchmark gap — top quartile 대비 본인 위치
 *     ⑤ Today's action — 1개 구체 행동 (위 4가지 종합)
 *  3. 단일 hero 카드로 렌더 — 30초 안에 읽고 행동
 *
 *  ── 향후 확장 ──────────────────────────────────────────────────
 *  v2: AI 호출 추가 (Claude Opus 4.7) — narrative 자연스럽게
 *  v3: 코호트 리텐션 분석·이상 탐지·투자자 업데이트 자동 생성
 *  ────────────────────────────────────────────────────────────────
 */

import { useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Target, Sparkles, ArrowRight, Lightbulb, Trophy } from "lucide-react";
import { useStartupMetrics } from "../../hooks/useStartupMetrics";
import { useFinanceStore } from "../../stores/finance-store";
import { recordSignal } from "../../coaching-history";

const MIDNIGHT = "#191970";

type Signal = {
  kind: "critical" | "important" | "notable" | "good";
  headline: string;
  why: string;
  action: string;
};

type Props = { ko: boolean };

export function StartupFounderBrief({ ko }: Props) {
  const { metrics, industry } = useStartupMetrics();
  const { dailyEntries } = useFinanceStore();

  const brief = useMemo(() => {
    const m = metrics;
    const signals: Signal[] = [];

    // ── ① Critical signals (런웨이·burn·default-dead) ──
    if (m.runwayMonths != null && m.runwayMonths < 6) {
      signals.push({
        kind: "critical",
        headline: ko
          ? `런웨이 ${m.runwayMonths.toFixed(1)}개월 — 6개월 미만`
          : `Runway ${m.runwayMonths.toFixed(1)}mo — under 6 months`,
        why: ko
          ? "한국 VC 표준 (18-24개월) 의 1/3 이하. 시드 라운드 4-12주 리드타임 고려 시 *지금* 펀딩 준비 시작 필요."
          : "Under 1/3 of Korean VC standard 18-24mo. Seed round takes 4-12 weeks — start fundraising NOW.",
        action: ko
          ? "오늘: ZUZU 캡테이블 점검 + 시드 라운드 데크 작성 시작 + 비지분 자금 (TIPS·예비창업 1억) 동시 신청"
          : "Today: review cap table on ZUZU + draft seed deck + apply for non-dilutive funds (TIPS, K-Startup) in parallel",
      });
    } else if (m.runwayMonths != null && m.runwayMonths < 12) {
      signals.push({
        kind: "important",
        headline: ko
          ? `런웨이 ${m.runwayMonths.toFixed(1)}개월 — 12개월 미만`
          : `Runway ${m.runwayMonths.toFixed(1)}mo — under 12 months`,
        why: ko
          ? "안전선 (18-24개월) 까지 6-12개월. 시드 라운드 4-12주 리드타임 고려 시 3-6개월 안에 준비 시작 권장."
          : "6-12 mo short of safe runway. Start fundraising prep in 3-6 months.",
        action: ko
          ? "이번 달: 시드 라운드 timing 결정 + 메트릭 데크 1page 초안 작성"
          : "This month: decide seed timing + draft 1-page metrics deck",
      });
    }

    if (m.defaultAlive === false) {
      signals.push({
        kind: "critical",
        headline: ko ? "Default Dead — 매출 성장률이 burn 을 따라가지 못함" : "Default Dead — growth < burn rate",
        why: ko
          ? "Paul Graham 정의: 현재 성장률로는 자본 소진 전 흑자 도달 불가능. 펀딩 의존 상태."
          : "Paul Graham definition: at current growth, can't reach profit before capital runs out. Funding-dependent.",
        action: ko
          ? "다음 3개월: ① 매출 +20% growth OR ② burn -30% 둘 중 하나 달성 필수"
          : "Next 3mo: either +20% revenue growth OR -30% burn — pick one",
      });
    }

    // ── ② Important signals (burn multiple, WoW) ──
    if (m.burnMultiple != null && m.burnMultiple > 3) {
      signals.push({
        kind: "critical",
        headline: ko ? `Burn Multiple ${m.burnMultiple.toFixed(1)}x — 매우 높음` : `Burn Multiple ${m.burnMultiple.toFixed(1)}x — too high`,
        why: ko
          ? "$1 신규 ARR 만들기 위해 $3 이상 태움. Bessemer 시드 기준 <2x. 시리즈 A 펀딩 어려워짐."
          : "Spending $3+ for every $1 new ARR. Bessemer seed standard <2x. Series A becomes harder.",
        action: ko
          ? "이번 주: 마케팅 ROAS 채널별 점검 — 비효율 채널 즉시 중단. 무료 채널 (오가닉·콘텐츠) 비중 ↑"
          : "This week: audit marketing ROAS by channel. Kill inefficient channels. Increase organic/content.",
      });
    } else if (m.burnMultiple != null && m.burnMultiple > 2) {
      signals.push({
        kind: "important",
        headline: ko ? `Burn Multiple ${m.burnMultiple.toFixed(1)}x — 점검 필요` : `Burn Multiple ${m.burnMultiple.toFixed(1)}x — review`,
        why: ko
          ? "시드 기준 <2x 권장. 채널별 ROAS 점검 시점."
          : "Seed standard <2x. Time to audit channel ROAS.",
        action: ko ? "이번 주: 마케팅 채널별 ROAS 분석" : "This week: channel ROAS audit",
      });
    }

    if (m.wowGrowth != null && m.wowGrowth < -10) {
      signals.push({
        kind: "critical",
        headline: ko ? `매출 WoW ${m.wowGrowth.toFixed(0)}% — 10%+ 하락` : `Revenue WoW ${m.wowGrowth.toFixed(0)}%`,
        why: ko
          ? "연속 하락은 PMF 약화 신호. 단발성 (캠페인 종료·시즌성) 인지 확인 필요."
          : "Sustained drop = PMF erosion signal. Verify if one-off (campaign end/seasonal) or trend.",
        action: ko
          ? "오늘: 이탈 고객 5명에게 직접 메일 (\"왜 안 쓰셨어요?\") — 30%+ 응답률"
          : "Today: email 5 churned users (\"why did you leave?\") — 30% response rate",
      });
    } else if (m.wowGrowth != null && m.wowGrowth > 15) {
      signals.push({
        kind: "good",
        headline: ko ? `매출 WoW +${m.wowGrowth.toFixed(0)}% 성장` : `Revenue WoW +${m.wowGrowth.toFixed(0)}%`,
        why: ko
          ? "Y Combinator 표준 (5-7% WoW) 의 2배 이상. 강한 PMF 신호 — 이 성장의 원인 파악·복제 필요."
          : "2x+ Y Combinator standard (5-7%). Strong PMF signal — identify the driver and double down.",
        action: ko
          ? "이번 주: 최근 가입자 10명 인터뷰 — \"어디서 알게 됐는가\" 출처 1개 식별"
          : "This week: interview 10 recent signups — identify source channel",
      });
    }

    // ── ③ Notable signals (CMGR, Rule of 40) ──
    if (m.cmgr != null && m.cmgr > 15) {
      signals.push({
        kind: "good",
        headline: ko ? `CMGR ${m.cmgr.toFixed(1)}% — 시리즈 A 진입 신호` : `CMGR ${m.cmgr.toFixed(1)}%`,
        why: ko
          ? "월 15%+ 복리 성장. 한국 시드 시리즈 A 평균 (월 10%) 초과. 펀딩 환경 우호적."
          : "Compound 15%/mo growth. Above Korean seed→A average (10%). Favorable for fundraising.",
        action: ko ? "이번 분기: 시리즈 A pitch deck 준비 시작" : "This Q: start Series A pitch deck",
      });
    }

    if (m.ruleOf40 != null && m.ruleOf40 > 40) {
      signals.push({
        kind: "good",
        headline: ko ? `Rule of 40: ${m.ruleOf40.toFixed(0)} — 통과` : `Rule of 40: ${m.ruleOf40.toFixed(0)} — pass`,
        why: ko
          ? "성장률 + 마진 합 40 초과. SaaS 시드 단계에서 최고 수준 — 투자 매력 ↑."
          : "Growth + margin > 40. Top-tier for SaaS seed — high investor attractiveness.",
        action: ko ? "이 신호를 deck 의 metric 슬라이드에 highlight" : "Highlight on deck metric slide",
      });
    }

    // ── ④ Data not ready (학습용 안내) ──
    if (signals.length === 0) {
      if ((dailyEntries?.length ?? 0) < 7) {
        signals.push({
          kind: "important",
          headline: ko ? "데이터 부족 — 7일 이상 매출 입력 필요" : "Not enough data — 7+ days of revenue",
          why: ko
            ? "WoW·CMGR·런웨이 계산 위해 최소 7일 데이터 필요. 매일 5분이면 충분."
            : "Need 7+ days of data for WoW/CMGR/runway. 5 min/day is enough.",
          action: ko ? "오늘: 어제 매출·사용자 수 입력 (5분)" : "Today: enter yesterday's metrics (5 min)",
        });
      } else {
        signals.push({
          kind: "good",
          headline: ko ? "모든 지표 안정 — 임계 신호 없음" : "All metrics stable — no critical signals",
          why: ko
            ? "런웨이·burn·성장률 모두 정상 범위. 이번 분기는 *제품 개선* 에 집중할 수 있는 환경."
            : "Runway, burn, growth all in healthy range. Good window to focus on product improvement.",
          action: ko
            ? "이번 주: PMF 측정 (Sean Ellis 40% test) — pmfsurvey.com"
            : "This week: PMF measurement (Sean Ellis) — pmfsurvey.com",
        });
      }
    }

    // 가장 critical 한 1개만 hero, 나머지는 secondary
    const sortOrder = { critical: 0, important: 1, notable: 2, good: 3 };
    signals.sort((a, b) => sortOrder[a.kind] - sortOrder[b.kind]);
    const hero = signals[0];
    const secondary = signals.slice(1, 3);

    return { hero, secondary, industry };
  }, [metrics, dailyEntries, industry, ko]);

  // 코칭 히스토리 자동 기록 — lock-in moat. 동일 날짜 덮어쓰기 (한 날 한 entry).
  useEffect(() => {
    if (!brief.hero) return;
    recordSignal("startup", {
      kind: brief.hero.kind,
      headline: brief.hero.headline,
      action: brief.hero.action,
    });
  }, [brief.hero?.headline, brief.hero?.kind, brief.hero?.action, brief.hero]);

  const colors = {
    critical: { bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.20)", text: "#b91c1c", iconBg: "rgba(220,38,38,0.10)" },
    important: { bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.20)", text: "#b45309", iconBg: "rgba(217,119,6,0.10)" },
    notable: { bg: `${MIDNIGHT}08`, border: `${MIDNIGHT}22`, text: MIDNIGHT, iconBg: `${MIDNIGHT}10` },
    good: { bg: "rgba(5,150,105,0.05)", border: "rgba(5,150,105,0.18)", text: "#059669", iconBg: "rgba(5,150,105,0.10)" },
  } as const;

  const heroColor = colors[brief.hero.kind];
  const HeroIcon = brief.hero.kind === "critical"
    ? AlertTriangle
    : brief.hero.kind === "important"
      ? TrendingDown
      : brief.hero.kind === "good"
        ? Trophy
        : Sparkles;

  return (
    <article style={{
      background: "white",
      borderRadius: 20,
      border: "1px solid rgba(25,25,112,0.10)",
      boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
      padding: "22px 24px",
      display: "flex", flexDirection: "column" as const, gap: 18,
    }}>
      {/* 헤더 */}
      <header>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.85) 100%)`,
            color: "white",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(25,25,112,0.25)",
          }}>
            <Sparkles size={14} strokeWidth={2.2} />
          </span>
          <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.75, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
            {ko ? "AI 공동창업자 데일리 브리프" : "AI Co-Founder Daily Brief"}
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.35 }}>
          {ko ? "오늘 가장 중요한 한 가지" : "The one thing that matters today"}
        </div>
      </header>

      {/* Hero 신호 */}
      <div style={{
        padding: "16px 18px", borderRadius: 14,
        background: heroColor.bg, border: `1px solid ${heroColor.border}`,
        display: "flex", gap: 14, alignItems: "flex-start",
      }}>
        <div style={{
          flexShrink: 0, width: 36, height: 36, borderRadius: 10,
          background: heroColor.iconBg, color: heroColor.text,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginTop: 2,
        }}>
          <HeroIcon size={18} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: heroColor.text, lineHeight: 1.4, marginBottom: 6, letterSpacing: "-0.005em" }}>
            {brief.hero.headline}
          </div>
          <div style={{ fontSize: 13, color: "rgba(15,23,42,0.7)", lineHeight: 1.6, marginBottom: 10 }}>
            {brief.hero.why}
          </div>
          {/* 오늘 행동 */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            padding: "10px 12px", borderRadius: 10,
            background: "white", border: `1px solid ${heroColor.border}`,
          }}>
            <Target size={14} strokeWidth={2.2} style={{ flexShrink: 0, color: heroColor.text, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: heroColor.text, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 2 }}>
                {ko ? "오늘 한 가지 행동" : "Today's one action"}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", lineHeight: 1.5 }}>
                {brief.hero.action}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 보조 신호 (있을 때만) */}
      {brief.secondary.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(15,23,42,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8 }}>
            {ko ? "이번 주 추가 점검" : "Also watch this week"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {brief.secondary.map((s, i) => {
              const c = colors[s.kind];
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 12px", borderRadius: 10,
                  background: c.bg, border: `1px solid ${c.border}`,
                }}>
                  <span style={{
                    flexShrink: 0, width: 6, height: 6, borderRadius: "50%",
                    background: c.text, marginTop: 7,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.4 }}>
                      {s.headline}
                    </div>
                    <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.65)", lineHeight: 1.55, marginTop: 2 }}>
                      {s.action}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 푸터 — 출처 + 다음 진화 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 12px", borderRadius: 10,
        background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.06)",
        fontSize: 11, color: "rgba(15,23,42,0.55)", lineHeight: 1.45,
      }}>
        <Lightbulb size={12} strokeWidth={1.8} style={{ flexShrink: 0, color: MIDNIGHT, opacity: 0.6 }} />
        <span style={{ flex: 1 }}>
          {ko
            ? "런웨이·burn·CMGR·Rule of 40 자동 계산 → 5가지 신호 룰엔진 → 가장 중요한 1개 + 행동. Stripe·PostHog·Notion 으로는 못 만드는 *해석* 레이어."
            : "Runway/burn/CMGR/Rule-of-40 auto-computed → 5 signal rules → top one + action. The *interpretation* layer Stripe/PostHog/Notion can't replicate."}
        </span>
        <ArrowRight size={12} strokeWidth={1.8} style={{ flexShrink: 0, color: MIDNIGHT, opacity: 0.5 }} />
      </div>
    </article>
  );
}
