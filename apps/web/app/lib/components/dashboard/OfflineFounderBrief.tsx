"use client";

/**
 * OfflineFounderBrief — AI 공동창업자 데일리 브리프 (offline 사장님 킬러 기능).
 *
 *  ── 왜 만들었나 (2026-05-12) ────────────────────────────────────────
 *  StartupFounderBrief 가 startup-tech 사장님께 "해석 레이어" 를 줬듯이,
 *  offline 사장님 (음식·카페·뷰티·소매·피트니스·교육·펫·생활서비스) 90%+ 의
 *  실제 build.up 사용자에게도 같은 깊이의 해석을 제공.
 *
 *  종전: CEOMorningHero 가 매출 narrative 일부 제공했지만 — 비용 비율·
 *       프라임코스트·BEP 진행률 등 *해석된 인사이트* 부족.
 *
 *  ── 동작 (rule-based v1, AI 호출 0) ──────────────────────────────
 *  1. useDashboardComputed 의 비율 데이터 읽음 (재료비·인건비·임대료·primecost)
 *     + WoW · BEP 진행률 · 영업이익 등
 *  2. 외식 표준 임계값 적용 (CB Insights 2026 + 한국 외식업 폐업률 15.8% 데이터):
 *     ① Critical: 재료비 40%+ / 인건비 30%+ / 임대료 20%+ / BEP <60% / WoW <-15%
 *     ② Important: 재료비 35-40% / 인건비 25-30% / BEP 60-80% / WoW -5~-15%
 *     ③ Good: BEP 100%+ / 프라임 <60% / WoW +10%+
 *     ④ Data not ready (<7 entries)
 *  3. priority sort → 가장 중요한 1개 hero + 보조 2개
 *  4. 각 신호: Headline · Why (한국 통계 인용) · Today's Action
 *
 *  ── 향후 확장 ──────────────────────────────────────────────────
 *  v2: 업종별 fine-tuning (카페 = 재방문 우선 / 피트니스 = 회원권 갱신)
 *  v3: AI 호출 + 정부 지원사업 자동 매칭 ("자금 부담 시 → 재도전특별자금")
 *  ────────────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import { AlertTriangle, TrendingDown, Sparkles, Trophy, Target, ArrowRight, Lightbulb } from "lucide-react";
import { useDashboardCtx } from "../../contexts/DashboardContext";

const MIDNIGHT = "#191970";

type Signal = {
  kind: "critical" | "important" | "notable" | "good";
  headline: string;
  why: string;
  action: string;
};

type Props = { ko: boolean };

export function OfflineFounderBrief({ ko }: Props) {
  const d = useDashboardCtx();
  // useDashboardCtx 가 useDashboardComputed 값들을 spread 함 (useDashboard.ts 참조).
  // ratiosReady 가 false 면 비율 신호 제외하고 진행.
  const ingredientRatio = (d as unknown as { ingredientRatio: number }).ingredientRatio ?? 0;
  const laborRatio = (d as unknown as { laborRatio: number }).laborRatio ?? 0;
  const rentRatio = (d as unknown as { rentRatio: number }).rentRatio ?? 0;
  const primeCost = (d as unknown as { primeCost: number }).primeCost ?? 0;
  const ratiosReady = (d as unknown as { ratiosReady: boolean }).ratiosReady ?? false;
  const bepProgress = (d as unknown as { bepProgress: number }).bepProgress ?? 0;
  const weeklySalesChange = (d as unknown as { weeklySalesChange: number }).weeklySalesChange ?? 0;
  const last14Total = (d as unknown as { last14Total: number }).last14Total ?? 0;
  const dailyEntries = (d.dailyEntries as Array<{ date: string; sales: number }>) ?? [];
  const industryCategoryId = d.industryCategoryId ?? "";

  const brief = useMemo(() => {
    const signals: Signal[] = [];
    const isFood = industryCategoryId === "food";
    const isCafe = industryCategoryId === "cafe-dessert";
    const isFoodLike = isFood || isCafe;

    // ── ① Critical signals — 폐업 위험 신호 ──

    // 매출 급락 (가장 critical)
    if (weeklySalesChange < -15) {
      signals.push({
        kind: "critical",
        headline: ko
          ? `매출 WoW ${weeklySalesChange.toFixed(0)}% — 15%+ 급락`
          : `Revenue WoW ${weeklySalesChange.toFixed(0)}% — 15%+ drop`,
        why: ko
          ? "2026 한국 외식업 폐업률 15.8% (소매 16.7%). 2주 연속 -15% 하락은 폐업 위험 신호. 단발성인지 트렌드인지 확인 필수."
          : "2026 KR F&B closure rate 15.8% (retail 16.7%). 2-week consecutive -15% = closure risk. Identify if one-off or trend.",
        action: ko
          ? "오늘: 지난 2주 사이 변경 (메뉴·가격·운영시간·인력) 1개 점검. 단골 5명에게 직접 \"요즘 어떠셔요\" 전화"
          : "Today: review one change in past 2 weeks (menu·price·hours·staff). Call 5 regulars",
      });
    }

    // 재료비율 (외식·카페 한정)
    if (isFoodLike && ratiosReady && ingredientRatio > 40) {
      signals.push({
        kind: "critical",
        headline: ko
          ? `재료비 ${ingredientRatio.toFixed(0)}% — 외식 위험선 40% 초과`
          : `Material cost ${ingredientRatio.toFixed(0)}% — exceeds 40% danger threshold`,
        why: ko
          ? "한국 외식 평균 36.3% → 40.7% (5년) 급등. 40%+ 는 메뉴 마진 붕괴 신호 — 가격 인상 못 하면 적자 고착. 즉시 메뉴 엔지니어링 필요."
          : "KR F&B avg 36.3→40.7% (5yr). 40%+ = margin collapse signal. Menu engineering required NOW.",
        action: ko
          ? "이번 주: ① 매출 상위 5 메뉴 원가율 재계산 ② 공급처 3곳 견적 비교 ③ 낭비 메뉴 (저마진+저인기) 단종"
          : "This week: ① recompute COGS for top 5 menus ② quote from 3 suppliers ③ kill low-margin+low-volume menus",
      });
    } else if (isFoodLike && ratiosReady && ingredientRatio > 35) {
      signals.push({
        kind: "important",
        headline: ko ? `재료비 ${ingredientRatio.toFixed(0)}% — 점검선` : `Material ${ingredientRatio.toFixed(0)}% — review`,
        why: ko
          ? "한국 외식 평균 36% 근접. 40% 임계 진입 전 메뉴·공급처 점검 시점."
          : "Near KR F&B avg 36%. Review menus & suppliers before crossing 40%.",
        action: ko ? "이번 주: 매출 상위 5 메뉴 원가율 재계산" : "This week: recompute COGS for top 5 menus",
      });
    }

    // 인건비율
    if (ratiosReady && laborRatio > 30) {
      signals.push({
        kind: "critical",
        headline: ko
          ? `인건비 ${laborRatio.toFixed(0)}% — 30% 초과`
          : `Labor ${laborRatio.toFixed(0)}% — exceeds 30%`,
        why: ko
          ? "외식 표준 25%·뷰티 40-50% 권장. 30%+ 는 매출 회전 부족 또는 과잉 인력 신호. 시간대별 가동률 점검 필요."
          : "F&B std 25% · beauty 40-50%. 30%+ = low turnover OR overstaff. Audit time-slot utilization.",
        action: ko
          ? "이번 주: ① POS 시간대별 매출 분석 (피크 vs 비피크) ② 비피크 인력 파트타임 전환 검토"
          : "This week: ① POS time-slot revenue analysis ② shift off-peak to part-time",
      });
    }

    // 임대료율
    if (ratiosReady && rentRatio > 20) {
      signals.push({
        kind: "critical",
        headline: ko
          ? `임대료 ${rentRatio.toFixed(0)}% — 20% 초과 위험선`
          : `Rent ${rentRatio.toFixed(0)}% — exceeds 20% danger`,
        why: ko
          ? "한국 외식 표준 8-15%. 20%+ 는 고정비 구조상 흑자 도달 거의 불가. 매출 증가 또는 임대료 인하 협상 필수."
          : "KR F&B std 8-15%. 20%+ = nearly impossible to reach profit. Negotiate down OR grow revenue fast.",
        action: ko
          ? "이번 달: ① 임대인과 인하 협상 (이웃 시세·공실 데이터 근거) ② 매출 25%+ 증가 plan B ③ 사업 모델 전환 (배달 전문화·무인화) 검토"
          : "This month: ① rent negotiation ② +25% revenue plan B ③ pivot delivery/unmanned",
      });
    } else if (ratiosReady && rentRatio > 15) {
      signals.push({
        kind: "important",
        headline: ko ? `임대료 ${rentRatio.toFixed(0)}% — 점검선` : `Rent ${rentRatio.toFixed(0)}% — review`,
        why: ko ? "외식 표준 상한 15% 근접. 흑자 도달 부담." : "Near 15% F&B ceiling.",
        action: ko ? "이번 분기: 임대료 인하 협상 준비 (시세 데이터 수집)" : "This Q: prep rent negotiation (gather data)",
      });
    }

    // BEP 진행률 (월 환산 매출 vs 월 비용)
    if (ratiosReady && bepProgress > 0 && bepProgress < 60) {
      signals.push({
        kind: "critical",
        headline: ko
          ? `BEP 진행률 ${bepProgress.toFixed(0)}% — 손익분기 60% 미만`
          : `BEP progress ${bepProgress.toFixed(0)}% — below 60%`,
        why: ko
          ? "월 매출이 월 비용의 60% 미만 = 자본 빠르게 소진. 3개월 연속 시 폐업 위험 진입."
          : "Monthly rev < 60% of cost = burning capital. 3 consecutive months = closure risk.",
        action: ko
          ? "이번 주: ① 현재 자본 잔액·런웨이 계산 (월 적자 × N개월) ② 재도전특별자금 신청 검토 (soldissay sbiz.or.kr)"
          : "This week: ① compute runway ② consider 재도전특별자금 application",
      });
    } else if (ratiosReady && bepProgress >= 60 && bepProgress < 80) {
      signals.push({
        kind: "important",
        headline: ko ? `BEP 진행률 ${bepProgress.toFixed(0)}% — 80% 미만` : `BEP ${bepProgress.toFixed(0)}% — below 80%`,
        why: ko ? "흑자 도달까지 매출 +20% 또는 비용 -20% 필요." : "Need +20% rev or -20% cost to break even.",
        action: ko ? "이번 달: ① 객단가 5% 인상 시도 ② 재료비 시뮬 -10%" : "This month: ① +5% ticket price ② -10% COGS sim",
      });
    }

    // ── ③ Good signals ──
    if (ratiosReady && bepProgress >= 100) {
      signals.push({
        kind: "good",
        headline: ko ? `BEP 진행률 ${bepProgress.toFixed(0)}% — 흑자 운영` : `BEP ${bepProgress.toFixed(0)}% — profitable`,
        why: ko
          ? "월 매출 > 월 비용. 한국 외식 평균 영업이익률 8.7% 초과. 안정적 운영 단계."
          : "Revenue > cost. Above KR F&B avg op margin 8.7%. Stable operation.",
        action: ko ? "이번 분기: 성장 투자 시점 — 인접 매장·온라인 확장·메뉴 다각화 검토" : "This Q: growth investment time",
      });
    }

    if (weeklySalesChange > 10) {
      signals.push({
        kind: "good",
        headline: ko ? `매출 WoW +${weeklySalesChange.toFixed(0)}% 성장` : `Revenue WoW +${weeklySalesChange.toFixed(0)}%`,
        why: ko
          ? "10%+ WoW 성장은 한국 SMB 상위 10% 신호. 성장의 원인 (메뉴·마케팅·계절) 파악·복제 필요."
          : "10%+ WoW = top 10% KR SMB. Identify and double down on the driver.",
        action: ko
          ? "이번 주: 지난 2주 어떤 변화가 매출 증가 만들었는지 분석 (POS·SNS·리뷰)"
          : "This week: analyze what changed in past 2 wks (POS·SNS·reviews)",
      });
    }

    if (isFoodLike && ratiosReady && primeCost > 0 && primeCost < 60) {
      signals.push({
        kind: "good",
        headline: ko ? `프라임코스트 ${primeCost.toFixed(0)}% — 외식 표준 우수` : `Prime cost ${primeCost.toFixed(0)}% — strong`,
        why: ko
          ? "외식 표준 65% 미만 권장 (재료+인건). 60% 미만 = Toast·NetSuite·Sage 글로벌 상위 quartile."
          : "F&B std <65% (material+labor). <60% = top quartile globally.",
        action: ko ? "유지 — 매분기 재점검" : "Maintain — recheck quarterly",
      });
    }

    // ── ④ Data not ready ──
    if (signals.length === 0) {
      if (dailyEntries.length < 7) {
        signals.push({
          kind: "important",
          headline: ko ? "데이터 부족 — 7일 이상 매출 입력 필요" : "Not enough data — 7+ days needed",
          why: ko
            ? "WoW·BEP·비용비율 계산 위해 최소 7일 매출 데이터 필요. 매일 1분 입력이면 충분."
            : "Need 7+ days for WoW/BEP/cost ratios. 1 min/day is enough.",
          action: ko
            ? "오늘: 어제 매출·고객 수 입력 (1분). 매일 입력하면 다음 주부터 AI 진단 시작."
            : "Today: enter yesterday's revenue·customers (1 min). Daily entries → AI diagnosis next week.",
        });
      } else if (!ratiosReady) {
        signals.push({
          kind: "important",
          headline: ko ? "비용 데이터 부족 — 월 비용 입력 필요" : "Cost data missing",
          why: ko
            ? "재료비·인건비·임대료 등 월 비용을 「내 가게 > 비용 관리」 에 입력해야 비율 분석 가능."
            : "Need monthly costs in My Store > Cost Management for ratio analysis.",
          action: ko ? "오늘: 내 가게 > 비용 관리 → 월 비용 입력 (5분)" : "Today: enter monthly costs (5 min)",
        });
      } else {
        signals.push({
          kind: "good",
          headline: ko ? "모든 지표 안정 — 임계 신호 없음" : "All metrics stable",
          why: ko
            ? "재료비·인건비·임대료·BEP·WoW 모두 정상 범위. 이번 분기는 *고객 경험 개선* 에 집중할 수 있는 환경."
            : "All ratios healthy. Good window for customer-experience improvement.",
          action: ko
            ? "이번 주: ① 단골 5명 인터뷰 (\"오늘 만족도 + 다시 올지\") ② 재방문률 첫 측정 (POS 충성고객)"
            : "This week: ① 5 regular interviews ② first repeat-visit measurement",
        });
      }
    }

    // 가장 critical 한 1개 hero + 보조 2개
    const sortOrder = { critical: 0, important: 1, notable: 2, good: 3 };
    signals.sort((a, b) => sortOrder[a.kind] - sortOrder[b.kind]);
    const hero = signals[0];
    const secondary = signals.slice(1, 3);

    return { hero, secondary };
  }, [ingredientRatio, laborRatio, rentRatio, primeCost, ratiosReady, bepProgress, weeklySalesChange, dailyEntries.length, industryCategoryId, ko]);

  void last14Total; // 향후 v2 에서 사용

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
            {ko ? "AI 운영 코치 데일리 브리프" : "AI Operations Coach Daily Brief"}
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.35 }}>
          {ko ? "오늘 가장 중요한 한 가지" : "The one thing that matters today"}
        </div>
      </header>

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

      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 12px", borderRadius: 10,
        background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.06)",
        fontSize: 11, color: "rgba(15,23,42,0.55)", lineHeight: 1.45,
      }}>
        <Lightbulb size={12} strokeWidth={1.8} style={{ flexShrink: 0, color: MIDNIGHT, opacity: 0.6 }} />
        <span style={{ flex: 1 }}>
          {ko
            ? "재료비·인건비·임대료·BEP·WoW 자동 분석 → 한국 외식업 폐업률 15.8% 통계 + Toast·NetSuite·Sage 글로벌 표준 임계값 적용 → 가장 중요한 1개 + 행동."
            : "Auto material/labor/rent/BEP/WoW analysis → KR closure 15.8% + Toast/NetSuite/Sage thresholds → top signal + action."}
        </span>
        <ArrowRight size={12} strokeWidth={1.8} style={{ flexShrink: 0, color: MIDNIGHT, opacity: 0.5 }} />
      </div>
    </article>
  );
}
