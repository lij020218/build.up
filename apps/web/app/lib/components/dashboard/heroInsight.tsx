"use client";

/**
 * heroInsight.tsx — CEOMorningHero 가 의존하는 유틸 + InsightStack 컴포넌트.
 *
 * 2026-05-13 이전: 이 코드는 MorningBriefing.tsx (2,927줄 / 데드 컴포넌트) 안에 갇혀 있었음.
 * MorningBriefing 본체는 더 이상 mount 되지 않지만, 그 안의 유틸 5개 (resolveHero,
 * resolveInsightCtaTarget, inferActionCtaTarget, defaultCtaLabel, PRIORITY_META) 와
 * InsightStack 컴포넌트만 CEOMorningHero 가 import 해서 사용 중.
 *
 * 본 파일은 그 5+1 만 분리해 ~200줄로 압축. 죽은 본체 ~2,700줄 제거 가능.
 *
 * ── 라우팅 SSOT ─────────────────────────────────────────────────
 *  사용자 지침 (2026-05-11): "메뉴 관련이면 재고 관리 카드, 비용 관련이면 비용 관리 카드 —
 *  이런 식으로 작동해야지." → 내용 ↔ 카드 직접 매칭. "전부 매출 카드" 패턴 차단.
 * ─────────────────────────────────────────────────────────────
 */

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { CrisisDetection } from "../../services/cashflow-projection";
import type { ProactiveInsight } from "../../services/profit-anomaly-detector";
import type { AgentProposal } from "../../stores/agents-store";
import type { IndustryInsight } from "../../hooks/useIndustryInsight";

// ─── 타입 ────────────────────────────────────────────────────────────────

export type HeroSource =
  | "stale-sales"
  | "crisis"
  | "anomaly"
  | "industry-rule"
  | "reorder-urgent"
  | "ai-action"
  | "agent"
  | "industry"
  | "drucker";

export type HeroTone = "crisis" | "warning" | "neutral";

/**
 * CTA 클릭 시 어디로 안내할지 명시.
 *
 *  ⚠️ 라우팅 SSOT — 인사이트 *내용* 과 실제 카드를 1:1 매칭.
 *
 * - "sales":      매출 입력 ([data-sales-input])
 * - "users":      고객 변화 ([data-user-activity]) — 단골/재방문/객단가/리텐션
 * - "cashflow":   현금흐름 레이더 ([data-cashflow-hero])
 * - "costs":      비용 관리 카드 ([data-cost-management])
 * - "inventory":  재고 관리 카드 ([data-inventory-card])
 * - "team":       팀/인력 카드 ([data-team-card])
 * - "primeCost":  프라임코스트 카드 ([data-prime-cost-card])
 * - "marketing":  마케팅 surface — 'bup:navigate-feature'
 * - "operations": 운영 리추얼 ([data-ops-rituals])
 */
export type HeroCtaTarget =
  | "sales"
  | "users"
  | "cashflow"
  | "costs"
  | "inventory"
  | "team"
  | "primeCost"
  | "marketing"
  | "operations";

export type Hero = {
  source: HeroSource;
  tone: HeroTone;
  tagKo: string;
  tagEn: string;
  analysisKo: string;
  analysisEn: string;
  actionKo: string;
  actionEn: string;
  ctaKo: string;
  ctaEn: string;
  ctaTarget: HeroCtaTarget;
  agentProposalId?: string;
  /** AI 가 K-히트 사례를 인용했을 때 — UI 에 [사례:성심당] 배지 */
  referencedCase?: { id: string; name: string };
  /** 인사이트 출처 — Perplexity·Glean 패턴 */
  sourceLabel?: string;
  /** 우선순위 (industry 인사이트만) — 1순위 / 2순위 / 3순위 */
  priority?: "high" | "medium" | "low";
  /** 카드 스택 — primary 아래에 펼쳐 보여줄 추가 인사이트 */
  relatedSpecs?: Omit<Hero, "relatedSpecs">[];
};

// ─── 유틸 1: inferActionCtaTarget ────────────────────────────────────────
/**
 * AI top action 문자열 → ctaTarget 추론.
 *
 *  ⚠️ CRITICAL (2026-05-11): "오늘의 집중 → 항상 매출 카드" 버그의 SSOT.
 *  분류 우선순위 — *구체적 → 일반적* 순서.
 */
export function inferActionCtaTarget(title: string, reason: string): HeroCtaTarget {
  const text = `${title} ${reason}`.toLowerCase();

  // 1. inventory — 메뉴/재료/원자재/식자재/재고/품절/재주문/발주/공급처/단가
  if (/메뉴|레시피|재료|식재료|식자재|원자재|재고|품절|재주문|발주|공급처|단가|sku|inventory|stockout|reorder/i.test(text)) return "inventory";

  // 2. team — 직원/노무/4대보험/퇴직금/시급/근로계약
  if (/직원|노무|4대보험|퇴직금|시급|최저임금|근로계약|payroll|staffing|hire|employee/i.test(text)) return "team";

  // 3. primeCost — 합계 점검 전용
  if (/프라임코스트|prime.?cost/i.test(text)) return "primeCost";

  // 4. cashflow — 현금/런웨이/잔고/수금/지급/긴급자금
  if (/현금|런웨이|runway|잔고|수금|지급|긴급자금|대출|상환|매입.?지급|cash.?flow|burn/i.test(text)) return "cashflow";

  // 5. marketing — 광고/캠페인/콘텐츠/SNS/리뷰 요청
  if (/광고|마케팅|캠페인|인스타|페이스북|네이버.?플레이스|유튜브|틱톡|숏폼|sns|콘텐츠|리뷰.?요청|배너|쿠폰.?발송|메시지.?캠페인|campaign|ads?\b/i.test(text)) return "marketing";

  // 6. users — 고객/단골/재방문/리텐션
  if (/고객|단골|재방문|리텐션|retention|이탈|구매자|회원|membership|customer|dau|wau|mau|onboarding|온보딩|새로운.?고객|first.?customer/i.test(text)) return "users";

  // 7. operations — 측정/속도/회전/병목/동선
  if (/측정|시간|속도|회전|병목|동선|조리|폐기|준비|응대|throughput|cycle.?time|workflow|ops/i.test(text)) return "operations";

  // 8. costs — 일반 비용 (broad fallback)
  if (/임대료|공과금|관리비|판관비|이익률|마진|cogs|gross.?margin|fixed.?cost|overhead|비용.?구조/i.test(text)) return "costs";

  // 9. fallback
  return "sales";
}

// ─── 유틸 2: resolveInsightCtaTarget ─────────────────────────────────────
/**
 * 인사이트 카테고리 + 본문/액션 키워드 → CTA 라우팅 타깃.
 *
 * SSOT — CEOMorningHero·InsightStack 모두 이 함수 한 군데를 통해 라우팅 일관 유지.
 *  우선순위: AI 가 명시한 targetCard > 키워드 매칭 > category 폴백
 */
export function resolveInsightCtaTarget(
  category: string,
  body: string,
  action: string,
  isDigital: boolean,
  /** AI 가 카드 카탈로그 보고 직접 선택한 도착 카드 — 가장 신뢰 */
  targetCard?: HeroCtaTarget,
): HeroCtaTarget {
  const VALID_TARGETS: ReadonlyArray<HeroCtaTarget> = [
    "sales", "users", "cashflow", "costs", "inventory", "team", "primeCost", "marketing", "operations",
  ];
  if (targetCard && VALID_TARGETS.includes(targetCard)) return targetCard;

  const fromKeywords = inferActionCtaTarget(action, body);
  if (fromKeywords !== "sales") return fromKeywords;

  const text = `${action} ${body}`.toLowerCase();
  if (isDigital) {
    if (category === "cost") return "costs";
    if (category === "revenue") return "sales";
    if (category === "operations") return "operations";
    return "users";
  }
  if (category === "cost") return "costs";
  if (category === "marketing") return "marketing";
  if (category === "growth") return "users";
  if (category === "operations") return "operations";
  if (category === "revenue" && /측정|시간|속도|회전|병목|응대|제공|준비|발주|폐기|동선|조리/.test(text)) {
    return "operations";
  }
  return "sales";
}

// ─── 유틸 3: defaultCtaLabel ─────────────────────────────────────────────
/** ctaTarget → 한국어/영어 CTA 라벨 (LLM action 비어있을 때 fallback) */
export function defaultCtaLabel(target: HeroCtaTarget): { ko: string; en: string } {
  switch (target) {
    case "users":      return { ko: "고객 변화 보기", en: "See customer activity" };
    case "costs":      return { ko: "비용 관리 열기", en: "Open cost management" };
    case "inventory":  return { ko: "재고 관리 열기", en: "Open inventory" };
    case "team":       return { ko: "팀 관리 열기", en: "Open team" };
    case "primeCost":  return { ko: "프라임코스트 보기", en: "View prime cost" };
    case "cashflow":   return { ko: "현금흐름 보기", en: "View cashflow" };
    case "marketing":  return { ko: "마케팅으로 가기", en: "Go to marketing" };
    case "operations": return { ko: "운영 리추얼 열기", en: "Open ops ritual" };
    default:           return { ko: "매출 기록하기", en: "Log sales" };
  }
}

// ─── 유틸 4: resolveHero (메인 라우터) ────────────────────────────────────

function fmtWon(n: number, ko: boolean): string {
  const abs = Math.abs(Math.round(n));
  const sign = n < 0 ? "−" : "";
  if (ko) {
    if (abs >= 10000) return `${sign}${Math.round(n / 10000).toLocaleString()}만원`;
    return `${sign}${abs.toLocaleString()}원`;
  }
  return `${sign}₩${abs.toLocaleString()}`;
}

export function resolveHero(input: {
  ko: boolean;
  cashflowCrisis: CrisisDetection | null;
  topAnomaly: ProactiveInsight | null;
  industryRule: { hero: { kind: "critical" | "important" | "notable" | "good"; headline: string; why: string; action: string } | null; industryLabel: string } | null;
  anomalyContext: { isNew: boolean; consecutiveDays: number; label: string } | null;
  topProposal: AgentProposal | null;
  aiTopAction: { title: string; reason: string; priority: "high" | "medium"; referencedCase?: { id: string; name: string } } | undefined;
  industryInsight: IndustryInsight | null;
  businessLaunched: boolean;
  daysSinceLastSalesEntry: number | null;
  totalEntries: number;
  monthlyBurn: number;
  categoryId?: string;
}): Hero {
  const { ko, cashflowCrisis, topAnomaly, industryRule, anomalyContext, topProposal, aiTopAction, industryInsight, businessLaunched, daysSinceLastSalesEntry, totalEntries, monthlyBurn, categoryId } = input;

  // 0. 매출 미기록 3일 이상 — AI 코칭 정확도 보호 (오래된 데이터로 코칭 생성 차단)
  if (
    businessLaunched &&
    totalEntries > 0 &&
    daysSinceLastSalesEntry !== null &&
    daysSinceLastSalesEntry >= 3
  ) {
    const days = daysSinceLastSalesEntry;
    const accumLossWon = monthlyBurn > 0 ? Math.round((monthlyBurn / 30) * days) : 0;
    const accumLossManwon = Math.round(accumLossWon / 10000);
    const hasBurn = monthlyBurn > 0;
    return {
      source: "stale-sales",
      tone: "warning",
      tagKo: "AI 진단 — 데이터는 부족하지만 가능한 추정",
      tagEn: "AI Diagnosis — best estimate from available data",
      analysisKo: hasBurn
        ? `최근 ${days}일간 새 매출 기록이 없네요. 월 비용 ${fmtWon(monthlyBurn, true)}이 계속 나가고 있어 누적 손실은 약 ${accumLossManwon.toLocaleString()}만원으로 추정합니다. 오늘 매출 한 번만 입력하시면 진단 정확도가 70%+ 로 올라갑니다.`
        : `최근 ${days}일간 새 매출 기록이 없네요. 비용 데이터가 없어 손실 추정도 어렵습니다. 오늘 매출 + 월 비용 입력하시면 정확한 손익 진단이 가능합니다.`,
      analysisEn: hasBurn
        ? `${days} days without new sales entries. Monthly burn of ${fmtWon(monthlyBurn, false)} continues — estimated accumulated loss ~${fmtWon(accumLossWon, false)}. Just one sales entry will boost diagnostic accuracy to 70%+.`
        : `${days} days without new sales entries. No cost data either — can't estimate loss. Add today's sales + monthly costs for accurate P&L diagnosis.`,
      actionKo: "5초면 됩니다. 아래 '매출 흐름' 카드 상단 입력 바에서 어제·오늘 매출만 기록해 주세요.",
      actionEn: "Takes 5 seconds. Just log yesterday's and today's sales in the 'Revenue flow' input bar.",
      ctaKo: "매출 기록하러 가기",
      ctaEn: "Log sales",
      ctaTarget: "sales",
    };
  }

  // 1. Cashflow 위기
  if (cashflowCrisis) {
    const days = cashflowCrisis.daysUntilCrisis ?? 0;
    const short = cashflowCrisis.shortfallAmount;
    return {
      source: "crisis",
      tone: "crisis",
      tagKo: "사장님, 솔직히 말씀드릴게요",
      tagEn: "Let's be honest",
      analysisKo: `${days}일 후 통장 잔고가 ${fmtWon(-short, true)} 부족할 수 있어요. 지금이 가장 중요한 순간입니다 — 최근 매출 정산 일정과 월 고정비를 함께 봤습니다.`,
      analysisEn: `In ${days} days your balance may fall short by ${fmtWon(-short, false)}. This is the moment that matters — based on recent settlements and fixed costs.`,
      actionKo: "아래 현금흐름 레이더에 광고비 감액·공급처 연기·긴급자금 등 7가지 해결책 준비해뒀어요. 같이 골라봐요.",
      actionEn: "I've prepped 7 one-tap solutions in the Cash-flow Radar below — let's pick together.",
      ctaKo: "해결책 같이 보기",
      ctaEn: "Solve together",
      ctaTarget: "cashflow",
    };
  }

  // 1.5. 룰 기반 이상 감지
  if (topAnomaly && (topAnomaly.severity === "critical" || topAnomaly.severity === "warning")) {
    const tone: HeroTone = topAnomaly.severity === "critical" ? "crisis" : "warning";
    const baseTag = topAnomaly.severity === "critical" ? "이상 신호" : "주의 신호";
    const tagKo = anomalyContext ? `${baseTag} · ${anomalyContext.label}` : baseTag;
    const chronicNote = anomalyContext && anomalyContext.consecutiveDays >= 3
      ? ` ${anomalyContext.consecutiveDays}일째 같은 신호가 지속되고 있어요 — 즉시 조치가 필요합니다.`
      : "";
    return {
      source: "anomaly",
      tone,
      tagKo,
      tagEn: topAnomaly.severity === "critical" ? "Critical Signal" : "Watch Signal",
      analysisKo: `${topAnomaly.headline}. ${topAnomaly.analysis}${chronicNote}`,
      analysisEn: `${topAnomaly.headline}. ${topAnomaly.analysis}`,
      actionKo: topAnomaly.action,
      actionEn: topAnomaly.action,
      ctaKo: "상세 보기",
      ctaEn: "See details",
      ctaTarget:
        topAnomaly.kind === "cost-spike" || topAnomaly.kind === "prime-cost-breach" || topAnomaly.kind === "labor-ratio-high"
          ? "costs"
          : topAnomaly.kind === "customer-decline" || topAnomaly.kind === "new-customer-low"
            ? "users"
            : "sales",
    };
  }

  // 1.6. Industry-rule (11 업종 임계값 룰 신호)
  if (industryRule?.hero && (industryRule.hero.kind === "critical" || industryRule.hero.kind === "important")) {
    const ir = industryRule.hero;
    const tone: HeroTone = ir.kind === "critical" ? "crisis" : "warning";
    const tagKo = ir.kind === "critical"
      ? `${industryRule.industryLabel} · 위험 신호`
      : `${industryRule.industryLabel} · 점검 신호`;
    const tagEn = ir.kind === "critical" ? "Industry Critical" : "Industry Watch";
    const head = ir.headline.toLowerCase();
    const ctaTarget: "sales" | "users" | "costs" | "cashflow" =
      head.includes("재료") || head.includes("매입") || head.includes("인건") || head.includes("임대") || head.includes("프라임")
        ? "costs"
        : head.includes("객단가") || head.includes("매출")
          ? "sales"
          : "sales";
    return {
      source: "industry-rule",
      tone,
      tagKo,
      tagEn,
      analysisKo: `${ir.headline}. ${ir.why}`,
      analysisEn: `${ir.headline}. ${ir.why}`,
      actionKo: ir.action,
      actionEn: ir.action,
      ctaKo: "상세 보기",
      ctaEn: "See details",
      ctaTarget,
    };
  }

  // 2. 긴급 Agent (reorder)
  if (topProposal && topProposal.kind === "reorder" && topProposal.content.kind === "reorder" && topProposal.content.daysUntilStockout <= 2) {
    const c = topProposal.content;
    return {
      source: "reorder-urgent",
      tone: "warning",
      tagKo: "재주문 시점이에요",
      tagEn: "Time to reorder",
      analysisKo: `${c.itemName} 재고가 ${c.currentQuantity}개 남았어요. 지금 속도면 ${c.daysUntilStockout}일 후 다 떨어져요. 같이 발주 정리해볼까요?`,
      analysisEn: `${c.itemName} is down to ${c.currentQuantity} units — about ${c.daysUntilStockout} days left. Let's prep the order.`,
      actionKo: `${c.recommendedQuantity}개 주문 추천드려요. 공급처에 보낼 카톡 초안 준비해뒀어요 — 한 번에 보낼 수 있어요.`,
      actionEn: `Suggested ${c.recommendedQuantity} units. KakaoTalk draft ready — one-tap to send.`,
      ctaKo: "주문 메시지 복사",
      ctaEn: "Copy order message",
      agentProposalId: topProposal.id,
      ctaTarget: "costs",
    };
  }

  // 3. AI 액션 (dashboard/actions)
  if (aiTopAction) {
    return {
      source: "ai-action",
      tone: aiTopAction.priority === "high" ? "warning" : "neutral",
      tagKo: "오늘의 집중",
      tagEn: "Today's focus",
      analysisKo: aiTopAction.reason,
      analysisEn: aiTopAction.reason,
      actionKo: aiTopAction.title,
      actionEn: aiTopAction.title,
      ctaKo: "확인하기",
      ctaEn: "Take action",
      referencedCase: aiTopAction.referencedCase,
      ctaTarget: inferActionCtaTarget(aiTopAction.title, aiTopAction.reason),
    };
  }

  // 4. 일반 Agent
  if (topProposal) {
    const kind = topProposal.kind;
    let actionKo = "";
    let actionEn = "";
    if (kind === "coupon" && topProposal.content.kind === "coupon") {
      const c = topProposal.content;
      const disc = c.discountType === "percent" ? `${c.discountValue}% 할인` : `${c.discountValue.toLocaleString()}원 할인`;
      actionKo = `${disc} 쿠폰 코드 '${c.couponCode}' ${c.validDays}일 유효. 카카오 채널 메시지 초안까지 준비됐어요.`;
      actionEn = `${c.discountType === "percent" ? c.discountValue + "% off" : c.discountValue + " KRW off"} coupon '${c.couponCode}' valid ${c.validDays} days.`;
    } else if (kind === "content" && topProposal.content.kind === "content") {
      actionKo = "인스타 포스트 초안과 해시태그를 바로 복사해서 올리면 됩니다.";
      actionEn = "Instagram post draft + hashtags ready to copy.";
    } else if (kind === "review" && topProposal.content.kind === "review") {
      actionKo = "네이버 플레이스 리뷰 링크와 고객 요청 메시지가 준비돼 있어요.";
      actionEn = "Naver Place review link + customer message ready.";
    } else if (kind === "reorder" && topProposal.content.kind === "reorder") {
      const c = topProposal.content;
      actionKo = `${c.itemName} ${c.recommendedQuantity}개 주문 권장.`;
      actionEn = `${c.itemName} ${c.recommendedQuantity} units recommended.`;
    }
    return {
      source: "agent",
      tone: "neutral",
      tagKo: "오늘의 기회",
      tagEn: "Opportunity",
      analysisKo: topProposal.trigger.reasonKo,
      analysisEn: topProposal.trigger.reasonEn,
      actionKo,
      actionEn,
      ctaKo: "적용하기",
      ctaEn: "Apply",
      agentProposalId: topProposal.id,
      ctaTarget: kind === "reorder" ? "costs" : "users",
    };
  }

  // 5. Industry Insight (3개 인사이트 묶음 — 카드 스택 UI)
  if (industryInsight && Array.isArray(industryInsight.insights) && industryInsight.insights.length > 0) {
    const isDigital = categoryId === "startup-tech" || categoryId === "online-digital";

    const buildSpec = (it: typeof industryInsight.insights[number]): Hero => {
      const target = resolveInsightCtaTarget(it.category, it.body, it.action, isDigital, it.targetCard);
      const label = defaultCtaLabel(target);
      return {
        source: "industry",
        tone: "neutral",
        tagKo: "오늘의 인사이트",
        tagEn: "Today's insight",
        analysisKo: it.headline ? `${it.headline}. ${it.body}` : it.body,
        analysisEn: it.headline ? `${it.headline}. ${it.body}` : it.body,
        actionKo: it.action,
        actionEn: it.action,
        ctaKo: label.ko,
        ctaEn: label.en,
        ctaTarget: target,
        sourceLabel: it.sourceLabel,
        priority: it.priority,
      };
    };

    const allSpecs = industryInsight.insights.map(buildSpec);
    const primary = allSpecs[0];
    return {
      ...primary,
      relatedSpecs: allSpecs.slice(1),
    };
  }

  // 6. Drucker fallback
  return {
    source: "drucker",
    tone: "neutral",
    tagKo: "오늘의 질문",
    tagEn: "Today's question",
    analysisKo: "매일 5초, 매출 한 건을 기록하면 Found.One이 매일 달라지는 경영 인사이트를 드립니다.",
    analysisEn: "Log one sale daily — Found.One will deliver fresh business insights each day.",
    actionKo: "오늘 가장 중요한 한 가지는 무엇인가요?",
    actionEn: "What's the one important thing today?",
    ctaKo: "매출 기록하기",
    ctaEn: "Log sales",
    ctaTarget: "sales",
  };
}

// ─── PRIORITY_META + InsightStack ────────────────────────────────────────

export const PRIORITY_META: Record<"high" | "medium" | "low", { label: string; rank: string; color: string; bg: string }> = {
  high:   { label: "1순위", rank: "1", color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
  medium: { label: "2순위", rank: "2", color: "#d97706", bg: "rgba(217,119,6,0.08)" },
  low:    { label: "3순위", rank: "3", color: "#059669", bg: "rgba(5,150,105,0.08)" },
};

/**
 * 펼침형 인사이트 스택 — Hero primary 아래에 표시.
 *  • 기본: 접힘 — primary 카드 아래 두 줄 peek 으로 "더 있다" 힌트
 *  • 클릭: 세로로 펼쳐지며 priority 배지 (1순위/2순위/3순위) 노출
 *  • 디자인 보호: 작은 회색 텍스트 + 얇은 카드만 사용
 */
export function InsightStack({ related, ko }: { related: Omit<Hero, "relatedSpecs">[]; ko: boolean }) {
  const [open, setOpen] = useState(false);
  if (related.length === 0) return null;

  return (
    <div style={{ marginTop: "10px" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: "10px",
          border: "1px solid rgba(15,23,42,0.06)",
          background: open ? "rgba(15,23,42,0.02)" : "rgba(15,23,42,0.01)",
          color: "rgba(15,23,42,0.55)",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "6px",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(15,23,42,0.04)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = open ? "rgba(15,23,42,0.02)" : "rgba(15,23,42,0.01)")}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          {related.map((r, idx) => (
            <span
              key={idx}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: PRIORITY_META[r.priority ?? "medium"].color,
                opacity: 0.85,
              }}
            />
          ))}
          <span style={{ marginLeft: "4px" }}>
            {open
              ? (ko ? `추천 ${related.length}개 접기` : `Collapse ${related.length} more`)
              : (ko ? `다른 추천 ${related.length}개 더 보기` : `${related.length} more recommendations`)}
          </span>
        </span>
        <span style={{ fontSize: "10px", opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {related.map((spec, idx) => {
            const meta = PRIORITY_META[spec.priority ?? "medium"];
            const analysis = ko ? spec.analysisKo : spec.analysisEn;
            const action = ko ? spec.actionKo : spec.actionEn;
            const ctaLabel = ko ? spec.ctaKo : spec.ctaEn;
            return (
              <article
                key={idx}
                style={{
                  padding: "14px 16px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(15,23,42,0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: meta.bg,
                    color: meta.color,
                    fontSize: "10.5px",
                    fontWeight: 700,
                    letterSpacing: "-0.005em",
                  }}>
                    {meta.label}
                  </span>
                  {spec.sourceLabel && (
                    <span style={{ fontSize: "10px", color: "rgba(15,23,42,0.4)" }}>
                      · {spec.sourceLabel}
                    </span>
                  )}
                </div>

                <div style={{
                  fontSize: "14px",
                  fontWeight: 650,
                  color: "#0f172a",
                  letterSpacing: "-0.015em",
                  lineHeight: 1.45,
                  marginBottom: "4px",
                }}>
                  {analysis}
                </div>

                {action && (
                  <div style={{
                    fontSize: "12.5px",
                    fontWeight: 500,
                    color: "rgba(15,23,42,0.55)",
                    lineHeight: 1.5,
                    marginBottom: "10px",
                  }}>
                    {action}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (spec.ctaTarget === "marketing") {
                      window.dispatchEvent(new CustomEvent("bup:navigate-feature", {
                        detail: { surface: "marketing" },
                      }));
                      return;
                    }
                    const selectors: string[] =
                      spec.ctaTarget === "sales" ? ["[data-sales-input]"]
                      : spec.ctaTarget === "cashflow" ? ["[data-cashflow-hero]"]
                      : spec.ctaTarget === "costs" ? ["[data-cost-management]", "[data-cost-structure]", "[data-pl-hero]"]
                      : spec.ctaTarget === "inventory" ? ["[data-inventory-card]"]
                      : spec.ctaTarget === "team" ? ["[data-team-card]"]
                      : spec.ctaTarget === "primeCost" ? ["[data-prime-cost-card]", "[data-cost-management]"]
                      : spec.ctaTarget === "users" ? ["[data-user-activity]", "[data-first-customers-card]"]
                      : spec.ctaTarget === "operations" ? ["[data-ops-rituals]"]
                      : [];
                    for (const sel of selectors) {
                      const el = document.querySelector<HTMLElement>(sel);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        return;
                      }
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(15,23,42,0.1)",
                    background: "white",
                    color: "#0f172a",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(15,23,42,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                  }}
                >
                  {ctaLabel}
                  <ArrowRight size={11} strokeWidth={1.5} />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
