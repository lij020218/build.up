/**
 * computeStartupRule — 스타트업(startup-tech) 신호 룰엔진 (순수 함수).
 *
 *  ── 왜 (2026-06-04) ──────────────────────────────────────────────
 *  종전: StartupFounderBrief 카드가 Tier 1.5 에 따로 존재 → CEOMorningHero(Tier 1)
 *       와 둘 다 "오늘의 신호 + 행동" 을 제시하는 중복(coaching history 이중 기록 포함).
 *       이는 오프라인에서 이미 고친 안티패턴(OfflineFounderBrief → 모닝 히어로 흡수)과 동일.
 *  현재: 브리프의 신호 로직을 순수 함수로 분리 → useMorningBriefingBrain 이 스타트업일 때
 *       이 결과를 *같은 industryRule 슬롯* 에 넣어 resolveHero(우선순위 1.6)가 그대로 사용.
 *       단일 히어로로 통합. 별도 카드 제거.
 *
 *  오프라인 computeIndustryRule 과 동일한 IndustryRuleResult 형태를 반환한다.
 */

import type { StartupMetrics } from "@foundone/shared";
import type { IndustryRuleResult, IndustryRuleSignal } from "./useIndustryRuleSignal";

export function computeStartupRule(
  m: StartupMetrics,
  ko: boolean,
  dataReady: boolean,
): IndustryRuleResult {
  const signals: IndustryRuleSignal[] = [];

  // ── ① Critical (런웨이·burn·default-dead) ──
  if (m.runwayMonths != null && m.runwayMonths < 6) {
    signals.push({
      kind: "critical",
      headline: ko
        ? `런웨이 ${m.runwayMonths.toFixed(1)}개월 — 6개월 미만`
        : `Runway ${m.runwayMonths.toFixed(1)}mo — under 6 months`,
      why: ko
        ? "한국 VC 표준(18-24개월)의 1/3 이하. 시드 라운드 4-12주 리드타임 고려 시 지금 펀딩 준비 시작 필요."
        : "Under 1/3 of Korean VC standard 18-24mo. Seed round takes 4-12 weeks — start fundraising NOW.",
      action: ko
        ? "오늘: 캡테이블 점검 + 시드 데크 작성 시작 + 비지분 자금(TIPS·예비창업 1억) 동시 신청"
        : "Today: review cap table + draft seed deck + apply non-dilutive funds (TIPS, K-Startup) in parallel",
    });
  } else if (m.runwayMonths != null && m.runwayMonths < 12) {
    signals.push({
      kind: "important",
      headline: ko
        ? `런웨이 ${m.runwayMonths.toFixed(1)}개월 — 12개월 미만`
        : `Runway ${m.runwayMonths.toFixed(1)}mo — under 12 months`,
      why: ko
        ? "안전선(18-24개월)까지 6-12개월. 시드 라운드 리드타임 고려 시 3-6개월 안에 준비 시작 권장."
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

  // ── ② Burn multiple / WoW ──
  if (m.burnMultiple != null && m.burnMultiple > 3) {
    signals.push({
      kind: "critical",
      headline: ko ? `Burn Multiple ${m.burnMultiple.toFixed(1)}x — 매우 높음` : `Burn Multiple ${m.burnMultiple.toFixed(1)}x — too high`,
      why: ko
        ? "$1 신규 ARR 만들기 위해 $3 이상 태움. Bessemer 시드 기준 <2x. 시리즈 A 펀딩 어려워짐."
        : "Spending $3+ for every $1 new ARR. Bessemer seed standard <2x. Series A becomes harder.",
      action: ko
        ? "이번 주: 마케팅 ROAS 채널별 점검 — 비효율 채널 즉시 중단. 무료 채널(오가닉·콘텐츠) 비중 ↑"
        : "This week: audit marketing ROAS by channel. Kill inefficient channels. Increase organic/content.",
    });
  } else if (m.burnMultiple != null && m.burnMultiple > 2) {
    signals.push({
      kind: "important",
      headline: ko ? `Burn Multiple ${m.burnMultiple.toFixed(1)}x — 점검 필요` : `Burn Multiple ${m.burnMultiple.toFixed(1)}x — review`,
      why: ko ? "시드 기준 <2x 권장. 채널별 ROAS 점검 시점." : "Seed standard <2x. Time to audit channel ROAS.",
      action: ko ? "이번 주: 마케팅 채널별 ROAS 분석" : "This week: channel ROAS audit",
    });
  }

  if (m.wowGrowth != null && m.wowGrowth < -10) {
    signals.push({
      kind: "critical",
      headline: ko ? `매출 WoW ${m.wowGrowth.toFixed(0)}% — 10%+ 하락` : `Revenue WoW ${m.wowGrowth.toFixed(0)}%`,
      why: ko
        ? "연속 하락은 PMF 약화 신호. 단발성(캠페인 종료·시즌성)인지 확인 필요."
        : "Sustained drop = PMF erosion signal. Verify if one-off (campaign end/seasonal) or trend.",
      action: ko
        ? "오늘: 이탈 고객 5명에게 직접 메일(\"왜 안 쓰셨어요?\") — 30%+ 응답률"
        : "Today: email 5 churned users (\"why did you leave?\") — 30% response rate",
    });
  } else if (m.wowGrowth != null && m.wowGrowth > 15) {
    signals.push({
      kind: "good",
      headline: ko ? `매출 WoW +${m.wowGrowth.toFixed(0)}% 성장` : `Revenue WoW +${m.wowGrowth.toFixed(0)}%`,
      why: ko
        ? "Y Combinator 표준(5-7% WoW)의 2배 이상. 강한 PMF 신호 — 이 성장의 원인 파악·복제 필요."
        : "2x+ Y Combinator standard (5-7%). Strong PMF signal — identify the driver and double down.",
      action: ko
        ? "이번 주: 최근 가입자 10명 인터뷰 — \"어디서 알게 됐는가\" 출처 1개 식별"
        : "This week: interview 10 recent signups — identify source channel",
    });
  }

  // ── ③ CMGR / Rule of 40 ──
  if (m.cmgr != null && m.cmgr > 15) {
    signals.push({
      kind: "good",
      headline: ko ? `CMGR ${m.cmgr.toFixed(1)}% — 시리즈 A 진입 신호` : `CMGR ${m.cmgr.toFixed(1)}%`,
      why: ko
        ? "월 15%+ 복리 성장. 한국 시드→시리즈 A 평균(월 10%) 초과. 펀딩 환경 우호적."
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

  // ── ④ 신호 없음 → 데이터 부족 안내 또는 안정 ──
  if (signals.length === 0) {
    if (!dataReady) {
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
          ? "런웨이·burn·성장률 모두 정상 범위. 이번 분기는 제품 개선에 집중할 수 있는 환경."
          : "Runway, burn, growth all in healthy range. Good window to focus on product improvement.",
        action: ko ? "이번 주: PMF 측정 (Sean Ellis 40% test)" : "This week: PMF measurement (Sean Ellis 40% test)",
      });
    }
  }

  // 가장 critical 1개 hero, 나머지 secondary 2개 (오프라인 룰과 동일 정렬)
  const sortOrder = { critical: 0, important: 1, notable: 2, good: 3 } as const;
  signals.sort((a, b) => sortOrder[a.kind] - sortOrder[b.kind]);

  return {
    hero: signals[0] ?? null,
    secondary: signals.slice(1, 3),
    industryLabel: ko ? "스타트업" : "Startup",
  };
}
