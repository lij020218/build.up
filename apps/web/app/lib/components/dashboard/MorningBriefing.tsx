"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import {
  calculateSalesBreakdown,
  calculateMoM,
  calculateMonthlyPnL,
} from "@build-up/shared";
import type { DailyEntry, MonthlyCosts } from "../../useDashboard";
import { BarChart3, Target, AlertTriangle, Package, Ticket, Camera, Star, Sparkles, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRoadmapStore } from "../../stores/roadmap-store";
// SubscriptionPlanEntry 는 ActivitySnapshotCard 안에 통합되어 직접 import 불필요
import { useCashflowStore } from "../../stores/cashflow-store";
import { useAgentsStore, agentUrgencyScore, type AgentProposal, type AgentKind } from "../../stores/agents-store";
import { useProfileStore } from "../../stores/profile-store";
import { useMarketingStore, type PromoCode } from "../../stores/marketing-store";
import { useUsageStore } from "../../stores/usage-store";
// QuickQueryBar 카드 형식은 FloatingAIPartner (오른쪽 하단 챗봇)로 이전됨 — starter-stage-demo 에서 전역 마운트
import { useOperationsStore } from "../../stores/operations-store";
import { projectCashflow, detectCrisis, type CrisisDetection } from "../../services/cashflow-projection";
import { detectProactiveInsights, type ProactiveInsight } from "../../services/profit-anomaly-detector";
import { updateAnomalyHistory, getAnomalyContext } from "../../services/anomaly-history";
import { useIndustryInsight, type IndustryInsight } from "../../hooks/useIndustryInsight";
import { useTimeLogStore, shouldPromptToday } from "../../stores/time-log-store";
import { TimeLogCheckIn } from "./TimeLogCheckIn";
import { honestDailyAverage } from "../../utils/daily-windows";
import { calculateUnifiedHealthScore, HEALTH_COLORS, calculateCostRatios } from "@build-up/shared";
import { HealthDot, type HealthGrade } from "./HealthSignal";

// ─── Constants ──────────────────────────────────────────────────────────────

const FONT_STACK = "inherit";
const PRIMARY = "#191970";
const GREEN = "#34C759";
const YELLOW = "#FF9F0A";
const RED = "#FF3B30";
const LABEL_COLOR = "rgba(15,23,42,0.4)";
const CARD_RATIO = 0.85; // rough card-payment ratio for deposit estimate

// ─── Helpers ────────────────────────────────────────────────────────────────

// unified.domains[*].components[*] → 값 표기 (한국어 톤)
function formatComponentValue(name: string, value: number, ko: boolean): string {
  if (!Number.isFinite(value)) return "—";
  if (name.includes("런웨이") || name.toLowerCase().includes("runway"))
    return ko ? `${value.toFixed(1)}개월` : `${value.toFixed(1)}mo`;
  if (name.includes("이자보상") || name.includes("배율"))
    return `×${value.toFixed(1)}`;
  if (name.includes("성장률") || name.includes("growth"))
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  // 그 외 비율·점수성 지표
  return `${value.toFixed(1)}%`;
}

function formatWon(v: number, ko: boolean): string {
  if (ko) {
    if (Math.abs(v) >= 100_000_000)
      return `${(v / 100_000_000).toFixed(1)}억`;
    if (Math.abs(v) >= 10_000) return `${Math.round(v / 10_000)}만`;
    return `${v.toLocaleString("ko-KR")}원`;
  }
  if (Math.abs(v) >= 1_000_000)
    return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString("en-US");
}

function trafficLight(
  value: number,
  greenMax: number,
  yellowMax: number,
): string {
  if (value < greenMax) return GREEN;
  if (value <= yellowMax) return YELLOW;
  return RED;
}

function changeArrow(pct: number): string {
  if (pct > 0) return `+${pct.toFixed(1)}%`;
  if (pct < 0) return `${pct.toFixed(1)}%`;
  return "0%";
}

function changeColor(pct: number): string {
  if (pct > 0) return GREEN;
  if (pct < 0) return RED;
  return LABEL_COLOR;
}

function getYesterday(entries: DailyEntry[]): DailyEntry | null {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  return sorted[0];
}

function getSameWeekdayLastWeek(
  entries: DailyEntry[],
  referenceDate: string,
): DailyEntry | null {
  const ref = new Date(referenceDate);
  const target = new Date(ref);
  target.setDate(target.getDate() - 7);
  const targetStr = target.toISOString().slice(0, 10);
  return entries.find((e) => e.date === targetStr) ?? null;
}

function generateFallbackInsight(
  breakdown: ReturnType<typeof calculateSalesBreakdown>,
  yesterdaySales: number,
  sameWeekdayChange: number | null,
  ko: boolean,
): string {
  if (!breakdown) {
    return ko
      ? "매출 데이터가 쌓이면 매일 아침 경영 브리핑을 드리겠습니다."
      : "Once you log sales, you'll receive a daily business briefing here.";
  }

  const salesStr = formatWon(yesterdaySales, ko);
  const weekStr = sameWeekdayChange !== null ? `${sameWeekdayChange > 0 ? "+" : ""}${sameWeekdayChange.toFixed(0)}%` : null;

  // 매출 변화의 주된 원인을 문장으로 설명
  if (breakdown.primaryDriver === "ticket" && Math.abs(breakdown.avgTicketChange) > 3) {
    const dir = breakdown.avgTicketChange > 0;
    return ko
      ? `어제 매출 ${salesStr}${weekStr ? ` (전주 대비 ${weekStr})` : ""}. ${dir ? "객단가가 올랐습니다. 세트메뉴나 추가 주문이 늘고 있는지 확인해보세요." : "객단가가 떨어졌습니다. 메뉴 구성이나 가격 전략을 점검하세요."}`
      : `Yesterday's sales were ${salesStr}${weekStr ? ` (${weekStr} vs last week)` : ""}. ${dir ? "Average ticket is up — check if upselling is working." : "Average ticket dropped — review menu mix and pricing."}`;
  }

  if (breakdown.primaryDriver === "customers" && Math.abs(breakdown.customersChange) > 3) {
    const dir = breakdown.customersChange > 0;
    return ko
      ? `어제 매출 ${salesStr}${weekStr ? ` (전주 대비 ${weekStr})` : ""}. ${dir ? "방문 고객이 늘고 있습니다. 이 추세를 유지할 마케팅을 준비하세요." : "고객수가 줄고 있습니다. 단골 이탈이 없는지 점검이 필요합니다."}`
      : `Yesterday's sales were ${salesStr}${weekStr ? ` (${weekStr} vs last week)` : ""}. ${dir ? "Foot traffic is growing — prepare marketing to sustain this." : "Customer count is dropping — check if regulars are churning."}`;
  }

  if (breakdown.primaryDriver === "both") {
    return ko
      ? `어제 매출 ${salesStr}${weekStr ? ` (전주 대비 ${weekStr})` : ""}. 고객수와 객단가 모두 변동이 있습니다. 주간 추세를 좀 더 지켜보세요.`
      : `Yesterday's sales were ${salesStr}${weekStr ? ` (${weekStr} vs last week)` : ""}. Both traffic and ticket size shifted — monitor the weekly trend.`;
  }

  if (weekStr) {
    return ko
      ? `어제 매출 ${salesStr}, 전주 동요일 대비 ${weekStr}입니다. 안정적인 흐름이니 현재 운영을 유지하세요.`
      : `Yesterday's sales were ${salesStr}, ${weekStr} vs the same day last week. Steady operations — maintain your current approach.`;
  }

  return ko
    ? "전주 대비 변동폭이 크지 않습니다. 안정 구간이니 현재 페이스를 유지하세요."
    : "Week-over-week variation is minimal. You're in a stable zone — maintain your current pace.";
}

// ─── Hero resolver (분석 + 행동 1개) ────────────────────────────────────────

export type HeroSource = "stale-sales" | "crisis" | "anomaly" | "industry-rule" | "reorder-urgent" | "ai-action" | "agent" | "industry" | "drucker";
export type HeroTone = "crisis" | "warning" | "neutral";
/**
 * CTA 클릭 시 어디로 안내할지 명시.
 *
 *  ⚠️ 라우팅 SSOT — 인사이트 *내용* 과 실제 카드를 1:1 매칭. "전부 매출 카드" 패턴 차단.
 *  사용자 지침 (2026-05-11): "메뉴 관련이면 재고 관리 카드, 비용 관련이면 비용 관리 카드 —
 *   이런 식으로 작동해야지." → 내용 ↔ 카드 직접 매칭.
 *
 * - "sales":      매출 입력 (ActivitySnapshotCard, [data-sales-input])
 * - "users":      고객 변화 (UserActivityCard, [data-user-activity]) — 단골/재방문/객단가/리텐션
 * - "cashflow":   현금흐름 레이더 ([data-cashflow-hero])
 * - "costs":      비용 관리 카드 ([data-cost-management]) — 임대료·인건비·공과금·판관비 *입력·점검*
 * - "inventory":  재고 관리 카드 ([data-inventory-card]) — 메뉴·재료·원자재·재주문·품절
 * - "team":       팀/인력 카드 ([data-team-card]) — 직원·노무·4대보험·퇴직금
 * - "primeCost":  프라임코스트 카드 ([data-prime-cost-card]) — 식재료+인건비 합계 점검
 * - "marketing":  마케팅 surface (별도 페이지) — 'bup:navigate-feature'
 * - "operations": 운영 리추얼 ([data-ops-rituals]) — 측정·병목·서비스 시간
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

/**
 * 인사이트 카테고리 + 본문/액션 키워드 → CTA 라우팅 타깃.
 *
 * SSOT — CEOMorningHero·MorningBriefing 모두 이 함수 한 군데를 통해 라우팅 일관 유지.
 * 변경 의도:
 *   "전부 매출 기록 버튼" 으로 끝나던 종래 라우팅을 코칭 *내용* 에 맞춰 분기.
 *   - operations + 측정·시간·병목·서비스 동선 → 오늘의 운영 리추얼 (DailyOpsRitualCard)
 *   - growth → 사용자 변화 카드 (단골/리텐션)
 *   - marketing → 별도 마케팅 surface
 *   - revenue 라도 측정·속도 키워드면 ops 로 (매출 기록만 종착점이 아님)
 */
export function resolveInsightCtaTarget(
  category: string,
  body: string,
  action: string,
  isDigital: boolean,
  /**
   * AI 가 직접 지정한 도착 카드 (2026-05-11 추가).
   *  ── 라우팅 우선순위 ───────────────────────────────────────
   *   1. targetCard (AI 가 카드 카탈로그 보고 직접 선택) — **최우선**
   *   2. 키워드 매칭 (inferActionCtaTarget) — 백워드 컴팻
   *   3. category 폴백
   *  ──────────────────────────────────────────────────────
   *  종전 문제: 키워드 매칭이 fragile. 예: "주문-조리-서빙 병목 측정" 의 "조리" 가
   *   inventory 로 잘못 잡힘. AI 프롬프트에 카드 카탈로그를 명시해 직접 선택 받음.
   */
  targetCard?: HeroCtaTarget,
): HeroCtaTarget {
  const VALID_TARGETS: ReadonlyArray<HeroCtaTarget> = [
    "sales", "users", "cashflow", "costs", "inventory", "team", "primeCost", "marketing", "operations",
  ];
  // 0단계 — AI 가 명시한 targetCard 가 유효하면 그대로 사용 (가장 신뢰).
  if (targetCard && VALID_TARGETS.includes(targetCard)) return targetCard;

  // 1단계 — 텍스트(action + body) 키워드로 *구체적* 카드 매칭 (재고/팀/프라임 등).
  //   카테고리 단순 매칭보다 우선 — "재료 단가 협상" 인사이트가 category="cost" 라도 *재고 카드* 가 맞음.
  const fromKeywords = inferActionCtaTarget(action, body);
  if (fromKeywords !== "sales") return fromKeywords;

  // 2단계 — 키워드로 안 잡힌 경우 category 로 폴백.
  const text = `${action} ${body}`.toLowerCase();
  if (isDigital) {
    if (category === "cost") return "costs";
    if (category === "revenue") return "sales";
    if (category === "operations") return "operations";
    return "users"; // marketing/growth → 사용자 카드 (디지털은 분리된 마케팅 페이지가 약함)
  }
  // ─── 오프라인 ───
  if (category === "cost") return "costs";
  if (category === "marketing") return "marketing";
  if (category === "growth") return "users";
  if (category === "operations") return "operations";
  if (category === "revenue" && /측정|시간|속도|회전|병목|응대|제공|준비|발주|폐기|동선|조리/.test(text)) {
    return "operations";
  }
  return "sales";
}

/**
 * AI top action 문자열 → ctaTarget 추론.
 *
 *  ⚠️ CRITICAL (2026-05-11): "오늘의 집중 → 항상 매출 카드" 버그의 SSOT 교체.
 *  사용자 지침: "메뉴 관련이면 재고 관리 카드, 비용 관련이면 비용 관리 카드 — 이런 식으로 작동해야지."
 *
 *  분류 우선순위 — *구체적 → 일반적* 순서 (정확한 매칭이 broad fallback 보다 먼저 hit):
 *   1. inventory:  메뉴·재료·원자재·재고·재주문·품절   (broad "costs" 보다 먼저)
 *   2. team:       직원·노무·4대보험·퇴직금·시급
 *   3. primeCost:  프라임코스트·식재료비+인건비 합계 점검 전용
 *   4. cashflow:   현금·런웨이·잔고·수금·지급·긴급자금
 *   5. marketing:  광고·마케팅·콘텐츠·캠페인·SNS·리뷰 요청
 *   6. users:      고객·단골·재방문·리텐션·객단가
 *   7. operations: 측정·시간·속도·회전·병목·동선·조리
 *   8. costs:      나머지 비용 (임대료·공과금·판관비·이익률·마진 등)
 *   9. fallback:   sales
 */
export function inferActionCtaTarget(title: string, reason: string): HeroCtaTarget {
  const text = `${title} ${reason}`.toLowerCase();

  // 1. inventory — 메뉴/재료/원자재/식자재/재고/품절/재주문/발주/공급처/단가
  //    ⚠ "비용" 검사보다 먼저! "재료비 점검" 같은 문구가 "비용" 키워드에 먼저 잡혀서
  //       비용 카드로 가는 문제 차단. 재료·식재료 단가는 *재고 관리* 카드의 책임.
  if (/메뉴|레시피|재료|식재료|식자재|원자재|재고|품절|재주문|발주|공급처|단가|sku|inventory|stockout|reorder/i.test(text)) return "inventory";

  // 2. team — 직원/노무/4대보험/퇴직금/시급/근로계약
  if (/직원|노무|4대보험|퇴직금|시급|최저임금|근로계약|payroll|staffing|hire|employee/i.test(text)) return "team";

  // 3. primeCost — *합계* 단어와 함께 등장하는 경우만 (단독 식재료/인건비는 위 inventory/team 으로)
  if (/프라임코스트|prime.?cost/i.test(text)) return "primeCost";

  // 4. cashflow — 현금/런웨이/잔고/수금/지급/긴급자금/대출/상환
  if (/현금|런웨이|runway|잔고|수금|지급|긴급자금|대출|상환|매입.?지급|cash.?flow|burn/i.test(text)) return "cashflow";

  // 5. marketing — 광고/마케팅/캠페인/인스타/페이스북/네이버 플레이스/SNS/유튜브/숏폼/콘텐츠/리뷰 요청
  if (/광고|마케팅|캠페인|인스타|페이스북|네이버.?플레이스|유튜브|틱톡|숏폼|sns|콘텐츠|리뷰.?요청|배너|쿠폰.?발송|메시지.?캠페인|campaign|ads?\b/i.test(text)) return "marketing";

  // 6. users — 고객/단골/재방문/리텐션/객단가/구매자/회원
  if (/고객|단골|재방문|리텐션|retention|이탈|구매자|회원|membership|customer|dau|wau|mau|onboarding|온보딩|새로운.?고객|first.?customer/i.test(text)) return "users";

  // 7. operations — 측정/시간/속도/회전/병목/동선/조리/응대
  if (/측정|시간|속도|회전|병목|동선|조리|폐기|준비|응대|throughput|cycle.?time|workflow|ops/i.test(text)) return "operations";

  // 8. costs — 일반 비용 (임대료/공과금/판관비/이익률/마진) — broad fallback
  if (/임대료|공과금|관리비|판관비|이익률|마진|cogs|gross.?margin|fixed.?cost|overhead|비용.?구조/i.test(text)) return "costs";

  // 9. fallback — 매출/판매 or 분류 불가
  return "sales";
}

/** ctaTarget → 한국어/영어 CTA 라벨 (LLM action 이 비어있을 때 fallback) */
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

export type Hero = {
  source: HeroSource;
  tone: HeroTone;
  tagKo: string;                     // "오늘의 집중" | "긴급 대응" 등
  tagEn: string;
  analysisKo: string;                 // 분석 — 왜 이게 지금 중요한가
  analysisEn: string;
  actionKo: string;                   // 행동 — 무엇을 하면 되는가
  actionEn: string;
  ctaKo: string;                      // CTA 라벨
  ctaEn: string;
  ctaTarget: HeroCtaTarget;          // 클릭 시 어디로 안내할지 — 거짓 기능 방지
  agentProposalId?: string;           // hero가 agent 출처일 때 id
  /** AI 가 K-히트 사례를 인용했을 때 — UI 에 [사례:성심당] 배지로 노출 */
  referencedCase?: { id: string; name: string };
  /** 인사이트 출처 — Perplexity·Glean 패턴 (small badge) */
  sourceLabel?: string;
  /** 우선순위 (industry 인사이트만 채움) — 1순위 / 2순위 / 3순위 배지 */
  priority?: "high" | "medium" | "low";
  /**
   * 카드 스택 — primary 아래에 펼쳐 보여줄 추가 인사이트 (industry 출처만).
   * 사장님 펼치기 클릭 시 priority 배지 함께 렌더링.
   */
  relatedSpecs?: Omit<Hero, "relatedSpecs">[];
};

type OtherItem = {
  id: string;
  Icon: LucideIcon;
  iconColor: string;
  label: string;
  hint?: string;
  priority: "high" | "medium";
  onClick: () => void;
};

const AGENT_ICON: Record<AgentKind, { Icon: LucideIcon; color: string }> = {
  coupon:  { Icon: Ticket,  color: "#191970" },
  reorder: { Icon: Package, color: "#b45309" },
  content: { Icon: Camera,  color: "#a855f7" },
  review:  { Icon: Star,    color: "#059669" },
};

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
  /** 룰 기반 이상 감지 (이익률 하락·매출 하락·비용 급증·프라임코스트 돌파) — critical/warning 우선 활용 */
  topAnomaly: ProactiveInsight | null;
  /** 2026-05-12 추가 — 11 업종 임계값 기반 룰 신호 (재료비·인건비·임대료·BEP·객단가).
   *  종전 OfflineFounderBrief 가 별도 hero 카드로 노출했던 신호 — Tier 1 hero 로 흡수.
   *  anomaly 보다 후순위 (1.6) — anomaly 가 trend·LLM 기반 더 미묘한 신호 잡으므로 우선. */
  industryRule: { hero: { kind: "critical" | "important" | "notable" | "good"; headline: string; why: string; action: string } | null; industryLabel: string } | null;
  /** anomaly history 컨텍스트 — "오늘 새로 발생", "어제부터 2일째", "5일째 지속" 등 */
  anomalyContext: { isNew: boolean; consecutiveDays: number; label: string } | null;
  topProposal: AgentProposal | null;
  aiTopAction: { title: string; reason: string; priority: "high" | "medium"; referencedCase?: { id: string; name: string } } | undefined;
  industryInsight: IndustryInsight | null;
  businessLaunched: boolean;
  daysSinceLastSalesEntry: number | null;
  totalEntries: number;
  /** 월 비용 합계 — 매출 공백 시 누적 손실 추정용 */
  monthlyBurn: number;
  /** 업종 카테고리 — industry insight CTA 타깃 라우팅 보정용 (LLM 분류 신뢰도 낮음) */
  categoryId?: string;
}): Hero {
  const { ko, cashflowCrisis, topAnomaly, industryRule, anomalyContext, topProposal, aiTopAction, industryInsight, businessLaunched, daysSinceLastSalesEntry, totalEntries, monthlyBurn, categoryId } = input;

  // 0. 매출 미기록 3일 이상 (AI 코칭 정확도 보호 — 오래된 데이터로 코칭 생성 차단)
  //    - 운영 중(businessLaunched)이고
  //    - 과거 매출 기록이 하나라도 있어야 함 (첫 기록 전에는 Drucker fallback이 담당)
  //    - 마지막 기록이 3일 이상 지남 (이전 2일 → 3일: 어제·하루 빠진 정도는 정상으로 간주)
  //
  // ⚠ 사용자 보고 (2026-05-06): 오늘 매출 입력했는데도 "공백" 메시지 노출되는 케이스 있음.
  //    daysSinceLastSalesEntry 가 0 이거나 stale 상태에서도 안전하게 동작하도록 ≥3 으로 상향
  //    + days === 0 명시적 가드 (혹시 modulo / 음수 edge case).
  if (
    businessLaunched &&
    totalEntries > 0 &&
    daysSinceLastSalesEntry !== null &&
    daysSinceLastSalesEntry >= 3
  ) {
    const days = daysSinceLastSalesEntry;
    // ⚡ 능동 진단 — 비용 데이터 있으면 누적 손실 추정 (사용자 피드백: AI가 빈 상태에서도 일하는 느낌이어야)
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

  // 1.5. 룰 기반 이상 감지 (이익률 -3%p+ 하락, 매출 -10%+ 하락, 비용 +20%+ 급증, 프라임코스트 65%+)
  //      AI 코칭이 데이터 분석으로 못 잡는 추세 변화를 룰 기반으로 사전에 짚어준다.
  //      LLM 호출 없이 즉시 응답 → MorningBriefing 의 hero 로 직접 노출.
  if (topAnomaly && (topAnomaly.severity === "critical" || topAnomaly.severity === "warning")) {
    const tone: HeroTone = topAnomaly.severity === "critical" ? "crisis" : "warning";
    const baseTag = topAnomaly.severity === "critical" ? "이상 신호" : "주의 신호";
    // History label 통합 — "주의 신호 · 어제부터 2일째" 또는 "주의 신호 · 5일째 지속"
    const tagKo = anomalyContext ? `${baseTag} · ${anomalyContext.label}` : baseTag;
    // 만성화된 anomaly (3일+) 는 분석 톤 강화
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
      // anomaly 종류에 따라 타깃 분기 — 비용 이상은 비용 카드, 고객 이상은 사용자 카드, 그 외 매출
      ctaTarget:
        topAnomaly.kind === "cost-spike" || topAnomaly.kind === "prime-cost-breach" || topAnomaly.kind === "labor-ratio-high"
          ? "costs"
          : topAnomaly.kind === "customer-decline" || topAnomaly.kind === "new-customer-low"
            ? "users"
            : "sales",
    };
  }

  // 1.6. Industry-rule (2026-05-12 추가) — 11 업종 임계값 기반 룰 신호.
  //   종전 OfflineFounderBrief 별도 hero 카드 → Tier 1 hero 로 통합 흡수.
  //   Toast IQ "For you feed" · Amplitude Dashboard Agent · Mercury Insights 등
  //   2026 산업 표준 (AI 통합 hero) 정합.
  //   critical/important 만 hero 로. notable/good 은 후순위 hero (Drucker 보다 위) 에서 처리.
  if (industryRule?.hero && (industryRule.hero.kind === "critical" || industryRule.hero.kind === "important")) {
    const ir = industryRule.hero;
    const tone: HeroTone = ir.kind === "critical" ? "crisis" : "warning";
    const tagKo = ir.kind === "critical"
      ? `${industryRule.industryLabel} · 위험 신호`
      : `${industryRule.industryLabel} · 점검 신호`;
    const tagEn = ir.kind === "critical" ? "Industry Critical" : "Industry Watch";
    // industry-rule 의 headline 에 따라 타깃 분기
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

  // 2. 긴급 Agent (reorder, daysUntilStockout ≤ 2)
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
      ctaTarget: "costs", // 재주문은 비용·재고 영역 — 비용 카드로 안내 (재고 카드가 있으면 향후 ctaTarget 확장)
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
      // 행동 텍스트(title + reason) 기반으로 ctaTarget 추론 — "오늘의 집중 → 항상 매출 카드" 버그 차단.
      // 예: title="재료비 비율 점검", reason="..."  → ctaTarget: "costs"
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
      // 종류별: coupon/content/review = 마케팅 영역(사용자 변화 카드로 효과 검증), reorder = costs
      ctaTarget: kind === "reorder" ? "costs" : "users",
    };
  }

  // 5. Industry Insight (3개 인사이트 묶음 — 카드 스택 UI 로 노출)
  if (industryInsight && Array.isArray(industryInsight.insights) && industryInsight.insights.length > 0) {
    const isDigital = categoryId === "startup-tech" || categoryId === "online-digital";

    // resolveInsightCtaTarget(SSOT) — AI 가 targetCard 명시했으면 최우선, 아니면 키워드/카테고리 폴백.
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
      // 보조 인사이트 (priority medium / low) — 사장님이 카드 펼치면 노출
      relatedSpecs: allSpecs.slice(1),
    };
  }

  // 6. Drucker fallback
  return {
    source: "drucker",
    tone: "neutral",
    tagKo: "오늘의 질문",
    tagEn: "Today's question",
    analysisKo: "매일 5초, 매출 한 건을 기록하면 build.up이 매일 달라지는 경영 인사이트를 드립니다.",
    analysisEn: "Log one sale daily — build.up will deliver fresh business insights each day.",
    actionKo: "오늘 가장 중요한 한 가지는 무엇인가요?",
    actionEn: "What's the one important thing today?",
    ctaKo: "매출 기록하기",
    ctaEn: "Log sales",
    ctaTarget: "sales",
  };
}

// Hero 톤별 색상 팔레트 (저채도, 스트레스 최소화)
const HERO_TONE_STYLES: Record<HeroTone, {
  cardBorder: string;
  tagColor: string;
  ctaBg: string;
  ctaHoverBg: string;
}> = {
  crisis: {
    cardBorder: "rgba(220,38,38,0.14)",
    tagColor: "#b91c1c",
    ctaBg: "#b91c1c",
    ctaHoverBg: "#991b1b",
  },
  warning: {
    cardBorder: "rgba(217,119,6,0.15)",
    tagColor: "#b45309",
    ctaBg: "#b45309",
    ctaHoverBg: "#92400e",
  },
  neutral: {
    cardBorder: "rgba(0,0,0,0.06)",
    tagColor: "#191970",
    ctaBg: "#191970",
    ctaHoverBg: "#162b45",
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

type MorningBriefingProps = {
  /** true 면 4 KPI grid 숨김. DailyKpiStrip 이 외부에 별도 마운트되는 경우 중복 방지. */
  hideKpis?: boolean;
};

export function MorningBriefing({ hideKpis = false }: MorningBriefingProps = {}) {
  const d = useDashboardCtx();

  const ko = d.language === "ko";
  const entries = (d.dailyEntries ?? []) as DailyEntry[];
  const costs = (d.monthlyCosts ?? {
    ingredients: 0,
    labor: 0,
    rent: 0,
    utilities: 0,
    sga: 0,
    marketing: 0,
    other: 0,
    interest: 0,
  }) as MonthlyCosts;

  // ─── 사업 건강도 (SSOT) ───
  // unified-health.calculateUnifiedHealthScore 가 4영역 가중합 + 데이터 충분성 게이트 모두 처리.
  // → 같은 점수가 다른 카드/AI 프롬프트와 항상 일치
  const unified = useMemo(
    () => calculateUnifiedHealthScore({
      dailyEntries: entries,
      monthlyCosts: costs,
      industry: "general", // TODO: dashboard ctx 의 industryCategoryId → mapIndustryToGroup 으로 정밀화
      stage: "growth",
    }),
    [entries, costs]
  );
  const healthSignalReady = unified.ready;
  const healthGrade: HealthGrade = (unified.grade === "unknown" ? "warning" : unified.grade) as HealthGrade;
  const healthGradeLabelKo: Record<HealthGrade, string> = {
    healthy: "건강", caution: "주의", warning: "위험", critical: "긴급",
  };
  const healthGradeLabelEn: Record<HealthGrade, string> = {
    healthy: "Healthy", caution: "Caution", warning: "Warning", critical: "Critical",
  };
  const healthGradeColor: Record<HealthGrade, string> = {
    healthy: HEALTH_COLORS.healthy.text,
    caution: HEALTH_COLORS.caution.text,
    warning: HEALTH_COLORS.warning.text,
    critical: HEALTH_COLORS.critical.text,
  };

  // ─── 위험 신호 도출 (AI 코칭 카드 내부 큰 박스에 표시) ───
  // 데이터 충분: unified.domains 중 critical/warning 영역의 가장 안 좋은 컴포넌트
  // 데이터 부족: 명백한 사실 (매출 vs 비용 큰 gap, 매출 0원 등) 만 회색 톤으로
  type RiskSignal = { grade: HealthGrade; title: string; message: string };
  const riskSignals = useMemo<RiskSignal[]>(() => {
    const signals: RiskSignal[] = [];
    const totalCostsAll =
      costs.ingredients + costs.labor + costs.rent + costs.utilities +
      costs.sga + costs.marketing + costs.other + (costs.interest ?? 0);
    const totalRev = entries.reduce((s, e) => s + e.sales, 0);

    // ⚠️ 일 평균 — entry 개수 아닌 *경과 캘린더 일수* 분모 (2026-05-11 fix).
    //  entries.length 로 나누면 입력 안 한 날 무시되어 월 추정이 폭주.
    //  honestDailyAverage 가 sparse 자동 탐지 + MAX(entry, 경과일) 분모 보장.
    const honestAvg = honestDailyAverage(entries, (e) => e.sales);
    const days = honestAvg.denominator;

    // ① 데이터 부족이라도 명백한 신호: 매출 vs 비용 극단 gap
    if (!healthSignalReady && days > 0 && totalCostsAll > 0 && totalRev > 0) {
      const avgDaily = honestAvg.avg;
      const monthEst = avgDaily * 26; // 월 26영업일 가정
      const ratio = monthEst / totalCostsAll;
      if (ratio < 0.3 && totalCostsAll > 100000) {
        signals.push({
          grade: "critical",
          title: ko ? "매출이 비용 대비 너무 적어요" : "Revenue much lower than costs",
          message: ko
            ? `이 페이스라면 월 매출 추정 ${formatWon(Math.round(monthEst), ko)}, 월 비용 ${formatWon(totalCostsAll, ko)} — 비용의 ${Math.round(ratio * 100)}% 수준이에요. 매출 확보가 가장 시급합니다.`
            : `Projected monthly revenue ${formatWon(Math.round(monthEst), ko)} vs costs ${formatWon(totalCostsAll, ko)} — only ${Math.round(ratio * 100)}% of costs. Revenue is the priority.`,
        });
      } else if (ratio >= 0.3 && ratio < 0.7) {
        signals.push({
          grade: "warning",
          title: ko ? "매출이 비용을 못 따라가요" : "Revenue lagging costs",
          message: ko
            ? `현재 페이스로 월 비용의 ${Math.round(ratio * 100)}%만 매출. 이 추세가 한 달 이어지면 적자가 ${formatWon(Math.round(totalCostsAll - monthEst), ko)} 쌓여요.`
            : `On track for ${Math.round(ratio * 100)}% of costs. A month at this pace = ${formatWon(Math.round(totalCostsAll - monthEst), ko)} loss.`,
        });
      }
    }

    // ② 데이터 충분: unified.domains 의 critical/warning 영역
    if (healthSignalReady) {
      const order: Array<keyof typeof unified.domains> = ["cash", "profit", "efficiency", "growth"];
      const titleByDomain: Record<string, { ko: string; en: string }> = {
        cash:       { ko: "현금 흐름 위험",   en: "Cash flow risk" },
        profit:     { ko: "수익성 위험",       en: "Profitability risk" },
        efficiency: { ko: "비용 효율 위험",   en: "Cost efficiency risk" },
        growth:     { ko: "성장 둔화",         en: "Growth slowdown" },
      };
      for (const key of order) {
        const dm = unified.domains[key];
        if (dm.grade !== "critical" && dm.grade !== "warning") continue;
        // 가장 점수 낮은 컴포넌트 1개를 메시지화
        const worst = dm.components
          .filter((c) => Number.isFinite(c.score))
          .sort((a, b) => a.score - b.score)[0];
        if (!worst) continue;
        const headline = titleByDomain[key as string][ko ? "ko" : "en"];
        const valueText = formatComponentValue(worst.name, worst.value, ko);
        signals.push({
          grade: dm.grade,
          title: headline,
          message: ko
            ? `${worst.name} ${valueText} — 영역 점수 ${Math.round(dm.score)}점`
            : `${worst.name} ${valueText} — domain score ${Math.round(dm.score)}`,
        });
        if (signals.length >= 3) break;
      }
    }

    return signals.slice(0, 3);
  }, [entries, costs, unified, healthSignalReady, ko]);

  // ── Yesterday's data
  const yesterday = getYesterday(entries);
  const yesterdaySales = yesterday?.sales ?? 0;
  const yesterdayCustomers = yesterday?.customers ?? 0;

  // ── Same weekday last week comparison
  const sameWeekday = yesterday
    ? getSameWeekdayLastWeek(entries, yesterday.date)
    : null;
  const weekdayChange =
    sameWeekday && sameWeekday.sales > 0
      ? ((yesterdaySales - sameWeekday.sales) / sameWeekday.sales) * 100
      : null;

  // ── Monthly P&L for operating margin and prime cost
  const pnl = calculateMonthlyPnL(entries, costs);
  const operatingMargin = pnl.operatingMargin;
  const totalSales = pnl.totalRevenue;
  // primeCost — cost-ratios.ts SSOT (월간 비용 ÷ 월 환산 매출, 부분월 보정)
  const primeCostPct = calculateCostRatios({
    costs: {
      ingredients: costs.ingredients ?? 0, labor: costs.labor ?? 0, rent: costs.rent ?? 0,
      utilities: costs.utilities ?? 0,
      sga: (costs as { sga?: number }).sga ?? 0,
      marketing: (costs as { marketing?: number }).marketing ?? 0,
      other: costs.other ?? 0,
    },
    totalRevenue: totalSales,
    days: entries.length,
  }).primeCostRatio;

  // ── Estimated deposit (card settlement, ~D+2)
  const estDeposit = Math.round(yesterdaySales * CARD_RATIO);

  // ── AI Insight
  const breakdown = calculateSalesBreakdown(entries, "week");
  const aiInsight = d.aiActions?.insight;
  const insightText =
    aiInsight ||
    generateFallbackInsight(
      breakdown,
      yesterdaySales,
      weekdayChange !== null ? Math.round(weekdayChange * 10) / 10 : null,
      ko,
    );

  // ── Has any data to show?
  const hasData = entries.length > 0;
  const hasCosts =
    costs.ingredients + costs.labor + costs.rent + costs.utilities + (costs.sga ?? 0) + (costs.marketing ?? 0) + costs.other + (costs.interest ?? 0) >
    0;

  // ═══════════════════════════════════════════════════════════════════════
  // Hero Focus — 분석+행동 통합 허브 (스트레스 최소화 UI)
  // ═══════════════════════════════════════════════════════════════════════
  const [moreOpen, setMoreOpen] = useState(false);

  // Cashflow 위기 감지
  const cashflowState = useCashflowStore();
  const cashflowCrisis = useMemo<CrisisDetection | null>(() => {
    if (!cashflowState.setupCompletedAt) return null;
    const projections = projectCashflow({
      currentBalance: cashflowState.currentBalance,
      recentDailyEntries: entries,
      salesChannels: cashflowState.salesChannels,
      fixedExpenses: cashflowState.fixedExpenses,
      vatReserveEnabled: cashflowState.vatReserveEnabled,
    });
    const crisis = detectCrisis(projections, cashflowState.crisisThresholdDays);
    return crisis.willCrisis ? crisis : null;
  }, [
    cashflowState.setupCompletedAt,
    cashflowState.currentBalance,
    cashflowState.salesChannels,
    cashflowState.fixedExpenses,
    cashflowState.vatReserveEnabled,
    cashflowState.crisisThresholdDays,
    entries,
  ]);

  // Agent proposals 우선순위 정렬
  const proposals = useAgentsStore((s) => s.proposals);
  const acceptProposalStore = useAgentsStore((s) => s.acceptProposal);
  const skipProposalStore = useAgentsStore((s) => s.skipProposal);
  const addPromoCode = useMarketingStore((s) => s.addPromoCode);
  const inventory = useOperationsStore((s) => s.inventory);
  const setInventory = useOperationsStore((s) => s.setInventory);

  // ── Adaptive Interface — 마운트 시 view tracking + 세션 시작 ──
  const trackView = useUsageStore((s) => s.trackView);
  const startSession = useUsageStore((s) => s.startSession);
  useEffect(() => {
    startSession();
    trackView("morning-briefing");
  }, [startSession, trackView]);

  const activeProposals = useMemo(() => {
    return proposals
      .filter((p) => p.status === "pending" && new Date(p.expiresAt) > new Date())
      .sort((a, b) => agentUrgencyScore(a) - agentUrgencyScore(b));
  }, [proposals]);

  const topProposal: AgentProposal | null = activeProposals[0] ?? null;

  // ─── Industry Insight 컨텍스트 — AI 가 *고유* 패턴 찾도록 신호 풍부히 주입 ───
  const insightCtx = useMemo(() => {
    if (entries.length === 0) {
      return {
        avgDailySales: 0,
        weeklySalesChangePct: 0,
        avgTicketSize: 0,
        weakestDayPct: 100,
      };
    }
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const last7 = sorted.slice(-7);
    const prev7 = sorted.slice(-14, -7);
    // ⚠️ 분모는 *캘린더 일수* (1~7) — entry 수로 나누면 1일 입력이 7일 평균으로 잘못 표시.
    const todayMs = Date.now();
    const dayDiff = (date: string) => Math.max(1, Math.floor((todayMs - new Date(date).getTime()) / 86400000) + 1);
    const last7Days = last7.length > 0 ? Math.min(7, dayDiff(last7[0].date)) : 0;
    const prev7Days = prev7.length > 0 ? Math.min(7, dayDiff(prev7[0].date) - 7) : 0;
    const avgDaily = last7Days > 0
      ? last7.reduce((s, e) => s + e.sales, 0) / last7Days
      : 0;
    const prevAvg = prev7Days > 0
      ? prev7.reduce((s, e) => s + e.sales, 0) / prev7Days
      : 0;
    const weeklyChange = prevAvg > 0
      ? Math.round(((avgDaily - prevAvg) / prevAvg) * 1000) / 10
      : 0;
    // 객단가 — last 14d 합계 기준 (안정성)
    const last14 = sorted.slice(-14);
    const totalRev14 = last14.reduce((s, e) => s + e.sales, 0);
    const totalCust14 = last14.reduce((s, e) => s + (e.customers ?? 0), 0);
    const ticket = totalCust14 > 0 ? totalRev14 / totalCust14 : 0;
    // 요일 패턴 — 가장 약한 요일 매출 / 일평균
    const byDow: number[][] = [[], [], [], [], [], [], []];
    last14.forEach((e) => {
      const dow = new Date(e.date).getDay();
      byDow[dow].push(e.sales);
    });
    const dowAvgs = byDow
      .map((arr) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0))
      .filter((v) => v > 0);
    const overallAvg = dowAvgs.length > 0 ? dowAvgs.reduce((a, b) => a + b, 0) / dowAvgs.length : 0;
    const weakest = dowAvgs.length > 0 ? Math.min(...dowAvgs) : 0;
    const weakestPct = overallAvg > 0 ? (weakest / overallAvg) * 100 : 100;
    return {
      avgDailySales: avgDaily,
      weeklySalesChangePct: weeklyChange,
      avgTicketSize: ticket,
      weakestDayPct: Math.round(weakestPct),
    };
  }, [entries]);

  // 비용 비율 (월 환산 매출 기준) — 이미 SSOT 헬퍼 사용
  const costRatiosForInsight = useMemo(() => {
    const ratios = calculateCostRatios({
      costs: {
        ingredients: costs.ingredients ?? 0, labor: costs.labor ?? 0, rent: costs.rent ?? 0,
        utilities: costs.utilities ?? 0,
        sga: (costs as { sga?: number }).sga ?? 0,
        marketing: (costs as { marketing?: number }).marketing ?? 0,
        other: costs.other ?? 0,
      },
      totalRevenue: pnl.totalRevenue,
      days: entries.length,
    });
    return {
      ingredient: ratios.ingredientRatio,
      labor: ratios.laborRatio,
      rent: ratios.rentRatio,
      prime: ratios.primeCostRatio,
    };
  }, [costs, pnl.totalRevenue, entries.length]);

  // 부족 재고 수
  const lowStockCount = useMemo(() => {
    const inv = (d.inventory as Array<{ quantity: number; minThreshold?: number }> | undefined) ?? [];
    return inv.filter((i) => i.quantity <= (i.minThreshold ?? 0)).length;
  }, [d.inventory]);

  // 직원 수
  const employeesCount = ((d.employees as unknown[] | undefined) ?? []).length;

  // 런웨이 (cash / monthlyBurn) — 가능할 때만
  const runwayMonthsForInsight = useMemo<number | undefined>(() => {
    const cash = (d as { totalCapital?: number; remainingCash?: number }).remainingCash
      ?? (d as { totalCapital?: number }).totalCapital;
    if (typeof cash !== "number" || cash <= 0) return undefined;
    const totalC = (costs.ingredients ?? 0) + (costs.labor ?? 0) + (costs.rent ?? 0) +
      (costs.utilities ?? 0) + (costs.other ?? 0) +
      ((costs as { sga?: number }).sga ?? 0) +
      ((costs as { marketing?: number }).marketing ?? 0) +
      ((costs as { interest?: number }).interest ?? 0);
    const burn = totalC - pnl.totalRevenue;
    if (burn <= 0) return 99; // 흑자
    return Math.round((cash / burn) * 10) / 10;
  }, [d, costs, pnl.totalRevenue]);

  const businessLaunchedDate = useProfileStore((s) => s.businessLaunchedDate);
  const daysSinceLaunch = useMemo(() => {
    if (!d.businessLaunched || !businessLaunchedDate) return undefined;
    return Math.max(0, Math.floor((Date.now() - new Date(businessLaunchedDate).getTime()) / 86400000));
  }, [d.businessLaunched, businessLaunchedDate]);

  const { insight: industryInsight } = useIndustryInsight({
    categoryId: d.industryCategoryId,
    hasUserSales: entries.length > 0,
    avgDailySales: insightCtx.avgDailySales > 0 ? insightCtx.avgDailySales : undefined,
    daysSinceLaunch,
    weeklySalesChangePct: insightCtx.weeklySalesChangePct !== 0 ? insightCtx.weeklySalesChangePct : undefined,
    avgTicketSize: insightCtx.avgTicketSize > 0 ? insightCtx.avgTicketSize : undefined,
    costRatios: pnl.totalRevenue > 0 ? costRatiosForInsight : undefined,
    weakestDayPct: insightCtx.weakestDayPct < 100 ? insightCtx.weakestDayPct : undefined,
    lowStockCount: lowStockCount > 0 ? lowStockCount : undefined,
    employeesCount: employeesCount > 0 ? employeesCount : undefined,
    runwayMonths: runwayMonthsForInsight,
    enabled: hasData || !!d.industryCategoryId,
  });

  // ─── Industry insights → Hero spec 변환 (모든 hero source 에서 stack 노출용) ───
  const allInsightSpecs = useMemo<Omit<Hero, "relatedSpecs">[]>(() => {
    if (!industryInsight || !Array.isArray(industryInsight.insights) || industryInsight.insights.length === 0) return [];
    const cat = d.industryCategoryId;
    const isDigital = cat === "startup-tech" || cat === "online-digital";
    return industryInsight.insights.map((it) => {
      const target = resolveInsightCtaTarget(it.category, it.body, it.action, isDigital, it.targetCard);
      const { ko: ctaKo, en: ctaEn } = defaultCtaLabel(target);
      return {
        source: "industry" as const,
        tone: "neutral" as const,
        tagKo: "오늘의 인사이트",
        tagEn: "Today's insight",
        analysisKo: it.headline ? `${it.headline}. ${it.body}` : it.body,
        analysisEn: it.headline ? `${it.headline}. ${it.body}` : it.body,
        actionKo: it.action,
        actionEn: it.action,
        ctaKo,
        ctaEn,
        ctaTarget: target,
        sourceLabel: it.sourceLabel,
        priority: it.priority,
      };
    });
  }, [industryInsight, d.industryCategoryId]);

  // 매출 미기록 일수 계산 (기록이 있을 때만 의미 — 없으면 null)
  // ⚠ 정확한 컷오프 위해서는 useMorningBriefingBrain 의 todayBusinessDay 기준 사용 권장.
  //   여기는 폴백 로직으로 단순화. 사용자 보고 케이스 방지를 위해 today/future 안전망 추가.
  const daysSinceLastSalesEntry = useMemo<number | null>(() => {
    if (entries.length === 0) return null;
    const latest = entries.reduce((acc, e) => (e.date > acc ? e.date : acc), entries[0].date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // 안전망: latest 가 오늘 이후면 0 (timezone / DST 회피)
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (latest >= todayIso) return 0;
    const last = new Date(latest);
    last.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((today.getTime() - last.getTime()) / 86400000));
  }, [entries]);

  // ── 룰 기반 이상 감지 (이익률 하락·매출 하락·비용 급증·프라임코스트) ──
  // LLM 호출 없이 이번 달 vs 지난 달 + 최근 7일 vs 직전 7일 데이터 분해.
  const topAnomaly = useMemo<ProactiveInsight | null>(() => {
    if (entries.length < 5) return null;  // 최소 5건 데이터 필요
    const curMonth = new Date().toISOString().slice(0, 7);
    const prevMonthDate = new Date(); prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonthKey = prevMonthDate.toISOString().slice(0, 7);
    const thisMonthEntries = entries.filter((e) => e.date.startsWith(curMonth));
    const prevMonthEntries = entries.filter((e) => e.date.startsWith(prevMonthKey));
    const costHistory = (d.costHistory ?? []) as Array<{ month: string; ingredients: number; labor: number; rent: number; utilities: number; other: number }>;
    const prevSnap = costHistory.find((h) => h.month === prevMonthKey);
    // 재고·마케팅·신규고객 데이터 (소스에 없으면 undefined → 해당 anomaly skip)
    const inventory = (d.inventory as Array<{ name: string; quantity: number; minThreshold?: number; dailyUsage?: number; lastOrderedAt?: string }> | undefined) ?? undefined;
    let marketingCampaigns: Array<{ channel: string; spend: number; attributedRevenue?: number; month: string }> | undefined;
    try {
      const { useMarketingStore: mktStore } = require("../../stores/marketing-store");
      marketingCampaigns = mktStore.getState().campaigns ?? undefined;
    } catch { /* marketing store 없으면 skip */ }

    const insights = detectProactiveInsights({
      thisMonthEntries,
      prevMonthEntries,
      monthlyCosts: costs as Parameters<typeof detectProactiveInsights>[0]["monthlyCosts"],
      prevMonthCosts: prevSnap,
      inventory,
      marketingCampaigns,
    });
    // ── History 갱신 (오늘 감지된 kind들 추적) ──
    if (insights.length > 0) {
      updateAnomalyHistory(insights.map((i) => i.kind));
    }
    return insights[0] ?? null;
  }, [entries, costs, d.costHistory, d.inventory]);

  // 현재 hero anomaly 의 history 컨텍스트 (오늘 새로 / N일째 지속)
  const anomalyContext = useMemo(() => {
    if (!topAnomaly) return null;
    return getAnomalyContext(topAnomaly.kind);
  }, [topAnomaly]);

  // 월 비용 합계 — Hero 의 stale-sales 진단 (누적 손실 추정) 에서 사용.
  // 아래쪽 startup-specific 블록에서도 동일 식이 한 번 더 쓰이므로 여기서 계산.
  const monthlyBurnForHero = costs.ingredients + costs.labor + costs.rent + costs.utilities + (costs.sga ?? 0) + (costs.marketing ?? 0) + costs.other + (costs.interest ?? 0);

  // Hero 선택: 우선순위별 "오늘의 1가지" 결정
  //   2026-05-12: industryRule = null 전달 (MorningBriefing 본체는 brain hook 미사용 — 별도 path).
  //   industry-rule 우선순위는 CEOMorningHero 의 brain 경로에서만 활성화.
  const hero = useMemo(() => resolveHero({
    ko,
    cashflowCrisis,
    topAnomaly,
    industryRule: null,
    anomalyContext,
    topProposal,
    aiTopAction: d.aiActions?.todayActions?.[0],
    industryInsight,
    businessLaunched: !!d.businessLaunched,
    daysSinceLastSalesEntry,
    totalEntries: entries.length,
    monthlyBurn: monthlyBurnForHero,
    categoryId: d.industryCategoryId,
  }), [ko, cashflowCrisis, topAnomaly, anomalyContext, topProposal, d.aiActions, industryInsight, d.businessLaunched, daysSinceLastSalesEntry, entries.length, monthlyBurnForHero, d.industryCategoryId]);

  // "다른 제안들" = AI 액션 나머지 + Hero에 쓰이지 않은 agent proposals
  const otherItems = useMemo(() => {
    const items: OtherItem[] = [];
    const aiRest = (d.aiActions?.todayActions ?? []).slice(hero.source === "ai-action" ? 1 : 0, 3);
    aiRest.forEach((a) => {
      items.push({
        id: `ai-${a.title}`,
        Icon: Sparkles,
        iconColor: "#6366f1",
        label: a.title,
        hint: a.reason,
        priority: a.priority,
        onClick: () => d.navigateToSurface("current"),
      });
    });
    const agentRest = activeProposals.filter((p) => !hero.agentProposalId || p.id !== hero.agentProposalId).slice(0, 3);
    agentRest.forEach((p) => {
      const agentMeta = AGENT_ICON[p.kind];
      items.push({
        id: `agent-${p.id}`,
        Icon: agentMeta.Icon,
        iconColor: agentMeta.color,
        label: ko ? p.trigger.reasonKo : p.trigger.reasonEn,
        hint: p.expectedImpact ? (ko ? p.expectedImpact.valueKo : p.expectedImpact.valueEn) : undefined,
        priority: "medium",
        onClick: () => {
          // 수락 처리 (원버튼)
          const accepted = acceptProposalStore(p.id);
          if (!accepted) return;
          if (accepted.kind === "coupon" && accepted.content.kind === "coupon") {
            const c = accepted.content;
            const code: PromoCode = {
              id: `agent-${accepted.id}`,
              code: c.couponCode,
              kind: "coupon",
              discountType: c.discountType,
              discountValue: c.discountValue,
              description: ko ? `AI 제안 — ${accepted.trigger.reasonKo}` : `AI — ${accepted.trigger.reasonEn}`,
              usageLimit: c.suggestedUsageLimit,
              usageCount: 0,
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + c.validDays * 86400000).toISOString(),
              isActive: true,
            };
            addPromoCode(code);
          } else if (accepted.kind === "reorder" && accepted.content.kind === "reorder") {
            const c = accepted.content;
            const updated = inventory.map((item) =>
              item.id === c.itemId ? { ...item, lastOrderedAt: new Date().toISOString().slice(0, 10) } : item
            );
            setInventory(updated);
          }
        },
      });
    });
    return items.slice(0, 4); // 최대 4개로 제한 (스트레스 방지)
  }, [d.aiActions, activeProposals, hero, ko, acceptProposalStore, addPromoCode, inventory, setInventory, d]);

  // Hero CTA 실행 핸들러
  const handleHeroCta = () => {
    if (hero.source === "stale-sales") {
      const el = document.querySelector("[data-sales-input]");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (hero.source === "crisis") {
      const el = document.querySelector("[data-cashflow-hero]");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (hero.source === "agent" && hero.agentProposalId) {
      const p = activeProposals.find((x) => x.id === hero.agentProposalId);
      if (!p) return;
      const accepted = acceptProposalStore(p.id);
      if (!accepted) return;
      if (accepted.kind === "coupon" && accepted.content.kind === "coupon") {
        const c = accepted.content;
        const code: PromoCode = {
          id: `agent-${accepted.id}`,
          code: c.couponCode,
          kind: "coupon",
          discountType: c.discountType,
          discountValue: c.discountValue,
          description: ko ? `AI 제안 — ${accepted.trigger.reasonKo}` : `AI — ${accepted.trigger.reasonEn}`,
          usageLimit: c.suggestedUsageLimit,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + c.validDays * 86400000).toISOString(),
          isActive: true,
        };
        addPromoCode(code);
      } else if (accepted.kind === "reorder" && accepted.content.kind === "reorder") {
        const c = accepted.content;
        const updated = inventory.map((item) =>
          item.id === c.itemId ? { ...item, lastOrderedAt: new Date().toISOString().slice(0, 10) } : item
        );
        setInventory(updated);
      }
    } else if (hero.source === "ai-action") {
      d.navigateToSurface("current");
    } else {
      // industry / drucker
      d.navigateToSurface("analytics");
    }
  };

  // ── Startup detection
  const isStartup = d.industryCategoryId === "startup-tech" || (d.businessCtx as Record<string, unknown>)?.categoryId === "startup-tech";
  const hasSubs = !!(d.usesSubscriptions);

  // ── Time Log 체크인 프롬프트 조건
  const timeLogEntries = useTimeLogStore((s) => s.entries);
  const timeLogDismissed = useTimeLogStore((s) => s.lastPromptDismissedAt);
  const timeLogEnabled = useTimeLogStore((s) => s.enabled);
  const showTimeLogPrompt = shouldPromptToday(timeLogEntries, timeLogDismissed, timeLogEnabled);

  // ── Startup-specific calculations
  // (resolveHero 호출 위에서 monthlyBurnForHero 로 이미 동일 계산 — 별칭으로 재사용)
  const monthlyBurn = monthlyBurnForHero;
  const selectedBudget = (d.selectedBudget ?? 0) as number;
  const runway = monthlyBurn > 0 ? Math.round(selectedBudget / monthlyBurn * 10) / 10 : 0;
  const userChange = sameWeekday && sameWeekday.customers > 0
    ? ((yesterdayCustomers - sameWeekday.customers) / sameWeekday.customers) * 100
    : null;

  // ── 14일 시계열 데이터 (스파크라인용 실제 데이터) ──
  const last14 = (() => {
    const map = new Map(entries.map((e) => [e.date, e]));
    const out: { sales: number; customers: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0, 10);
      const entry = map.get(key);
      out.push({ sales: entry?.sales ?? 0, customers: entry?.customers ?? 0 });
    }
    return out;
  })();
  const revenueSeries = last14.map((e) => e.sales);
  const customerSeries = last14.map((e) => e.customers);
  const hasRevenueSeries = revenueSeries.filter((v) => v > 0).length >= 2;
  const hasCustomerSeries = customerSeries.filter((v) => v > 0).length >= 2;

  // ── KPI cards config
  type KpiCard = {
    label: string;
    /** Apple 톤: 숫자 본체 (예: "2,450,000") */
    value: string;
    /** Apple 톤: 작은 단위/맥락 라벨 (예: "원 · 월간", "개월 남음"). 없으면 value에서 자동 분리 */
    unit?: string;
    change: number | null;
    changeLabel: string;
    color?: string;
    hint?: string;
    /** Mercury 톤: hero 카드 차트 위 보조 정보 라인 (예: "잔고 4,850만원 · 월 340만 소진") */
    extraInfo?: string;
    /** 인라인 미니 차트 — 실제 데이터 있을 때만 표시 */
    chart?:
      | { kind: "line"; series: number[]; color: string }
      | { kind: "gauge"; currentPct: number; color: string }
      | { kind: "targetBar"; currentPct: number; targetPct: number; color: string };
  };

  const revColor = weekdayChange !== null && weekdayChange < 0 ? "#ff3b30" : "#34c759";
  const userColor = userChange !== null && userChange < 0 ? "#ff3b30" : "#34c759";

  const kpis: KpiCard[] = isStartup ? [
    {
      label: ko ? (hasSubs ? "매출 / MRR" : "매출") : (hasSubs ? "REVENUE / MRR" : "REVENUE"),
      value: hasData ? formatWon(yesterdaySales, ko) : "--",
      change: weekdayChange !== null ? Math.round(weekdayChange * 10) / 10 : null,
      changeLabel: ko ? "전주 동요일" : "vs last wk",
      hint: !hasData ? (ko ? "매출을 입력하세요" : "Enter revenue") : undefined,
      chart: hasRevenueSeries ? { kind: "line", series: revenueSeries, color: revColor } : undefined,
    },
    {
      label: ko ? "사용자" : "USERS",
      value: hasData ? yesterdayCustomers.toLocaleString(ko ? "ko-KR" : "en-US") : "--",
      change: userChange !== null ? Math.round(userChange * 10) / 10 : null,
      changeLabel: ko ? "전주 동요일" : "vs last wk",
      hint: !hasData ? (ko ? "사용자 수를 입력하세요" : "Enter users") : undefined,
      chart: hasCustomerSeries ? { kind: "line", series: customerSeries, color: userColor } : undefined,
    },
    {
      label: ko ? "번레이트" : "BURN RATE",
      value: hasCosts ? formatWon(monthlyBurn, ko) + (ko ? "/월" : "/mo") : "--",
      change: null,
      changeLabel: ko ? "월 총 비용" : "monthly total",
      hint: !hasCosts ? (ko ? "월 비용을 입력하세요" : "Enter costs") : undefined,
      // 번레이트 대비 가용 자본 사용량 — 월 소진율 게이지
      chart: hasCosts && selectedBudget > 0
        ? { kind: "gauge", currentPct: Math.min(100, (monthlyBurn / selectedBudget) * 100), color: "#ff9f0a" }
        : undefined,
    },
    {
      label: ko ? "런웨이" : "RUNWAY",
      value: hasCosts && selectedBudget > 0 ? `${runway}${ko ? "개월" : "mo"}` : "--",
      change: null,
      changeLabel: ko ? "예산 ÷ 번레이트" : "budget ÷ burn",
      color: hasCosts && selectedBudget > 0
        ? runway <= 3 ? RED : runway <= 6 ? YELLOW : GREEN
        : undefined,
      hint: !hasCosts || selectedBudget <= 0 ? (ko ? "예산과 비용을 입력하세요" : "Enter budget & costs") : undefined,
      // Mercury 톤: 잔고 + 월 소진 페이스 (런웨이의 분자·분모를 명시)
      extraInfo: hasCosts && selectedBudget > 0
        ? (ko
            ? `잔고 ${formatWon(selectedBudget, true)} · 월 ${formatWon(monthlyBurn, true)} 소진`
            : `Cash ${formatWon(selectedBudget, false)} · ${formatWon(monthlyBurn, false)}/mo burn`)
        : undefined,
      // 12개월 기준 런웨이 게이지
      chart: hasCosts && selectedBudget > 0
        ? {
            kind: "gauge",
            currentPct: Math.min(100, (runway / 12) * 100),
            color: runway <= 3 ? "#ff3b30" : runway <= 6 ? "#ff9f0a" : "#34c759",
          }
        : undefined,
    },
  ] : [
    {
      label: ko ? "어제 매출" : "YESTERDAY",
      value: hasData ? formatWon(yesterdaySales, ko) : "--",
      change: weekdayChange !== null ? Math.round(weekdayChange * 10) / 10 : null,
      changeLabel: ko ? "전주 동요일" : "vs last wk",
      hint: !hasData ? (ko ? "매출을 입력하세요" : "Enter sales") : undefined,
      chart: hasRevenueSeries ? { kind: "line", series: revenueSeries, color: revColor } : undefined,
    },
    {
      label: ko ? "영업이익률" : "OP. MARGIN",
      value: hasCosts ? `${operatingMargin.toFixed(1)}%` : "--",
      change: null,
      changeLabel: "",
      color: hasCosts
        ? trafficLight(100 - operatingMargin, 85, 95)
        : undefined,
      hint: !hasCosts ? (ko ? "월 비용을 입력하세요" : "Enter costs") : undefined,
      // 목표 10% 대비 현재 OP 마진 target 바
      chart: hasCosts
        ? {
            kind: "targetBar",
            currentPct: Math.max(0, Math.min(100, operatingMargin * 5)), // 20%=100%
            targetPct: 50, // 10%=50%
            color: operatingMargin >= 10 ? "#34c759" : operatingMargin >= 5 ? "#ff9f0a" : "#ff3b30",
          }
        : undefined,
    },
    {
      label: ko ? "원가율" : "PRIME COST",
      value: hasCosts ? `${primeCostPct.toFixed(1)}%` : "--",
      change: null,
      changeLabel: "",
      color: hasCosts ? trafficLight(primeCostPct, 60, 65) : undefined,
      hint: !hasCosts ? (ko ? "월 비용을 입력하세요" : "Enter costs") : undefined,
      // 목표 60% 대비 원가율 (낮을수록 좋음)
      chart: hasCosts
        ? {
            kind: "targetBar",
            currentPct: Math.max(0, Math.min(100, primeCostPct)),
            targetPct: 60,
            color: primeCostPct <= 60 ? "#34c759" : primeCostPct <= 65 ? "#ff9f0a" : "#ff3b30",
          }
        : undefined,
    },
    {
      label: ko ? "카드 정산 예정" : "EST. DEPOSIT",
      value: hasData ? formatWon(estDeposit, ko) : "--",
      change: null,
      changeLabel: ko ? "D+2 예상" : "D+2 est.",
      hint: !hasData ? (ko ? "매출을 입력하세요" : "Enter sales") : undefined,
      chart: hasRevenueSeries ? { kind: "line", series: revenueSeries.slice(-7), color: "#191970" } : undefined,
    },
  ];

  // ── 4 균등 KPI: 라벨 + 상태 dot + 숫자(+단위) + sparkline + 변화 chip (참조 디자인)
  // 스타트업: 매출/MRR · 사용자 · 번레이트 · 런웨이
  // 오프라인: 어제 매출 · 영업이익률 · 원가율 · 카드 정산

  // ── 오늘 매출 미입력 여부 확인
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find(e => e.date === todayStr);
  // needsInput 변수는 헤더 chip 제거로 미사용 → 제거됨

  // ── Empty state → Apple-grade 온보딩 카드
  if (!hasData) {
    const inputFieldStyle: React.CSSProperties = {
      width: "100%", padding: "15px 16px 15px 56px", borderRadius: "14px",
      border: "1.5px solid rgba(0,0,0,0.06)", background: "rgba(25,25,112,0.025)",
      fontSize: "17px", fontWeight: 700, fontFamily: FONT_STACK,
      outline: "none", color: "#0f172a",
      transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
    };
    const inputLabelStyle: React.CSSProperties = {
      position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
      fontSize: "11px", fontWeight: 650, color: "rgba(15,23,42,0.3)",
      letterSpacing: "0.04em", textTransform: "uppercase" as const,
      pointerEvents: "none" as const,
    };
    const focusIn = (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = PRIMARY;
      e.currentTarget.style.background = "white";
      e.currentTarget.style.boxShadow = "0 0 0 4px rgba(25,25,112,0.08)";
    };
    const focusOut = (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)";
      e.currentTarget.style.background = "rgba(0,0,0,0.02)";
      e.currentTarget.style.boxShadow = "none";
    };
    return (
      <section style={sectionStyle}>
        <div style={{
          borderRadius: "28px", padding: "48px 32px 40px",
          background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)",
          border: "1px solid rgba(25,25,112,0.06)",
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 8px 32px rgba(0,0,0,0.04)",
          textAlign: "center" as const,
        }}>
          <div style={{
            width: "60px", height: "60px", borderRadius: "18px",
            background: `linear-gradient(135deg, ${PRIMARY} 0%, #457b9d 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 8px 24px rgba(25,25,112,0.25), 0 0 0 1px rgba(255,255,255,0.1) inset",
          }}>
            <BarChart3 size={28} color="#fff" strokeWidth={1.6} />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.03em", marginBottom: "8px", fontFamily: FONT_STACK }}>
            {ko ? "오늘의 첫 기록" : "Your first entry"}
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(15,23,42,0.4)", lineHeight: 1.6, maxWidth: "280px", margin: "0 auto 28px", fontFamily: FONT_STACK }}>
            {ko
              ? (isStartup ? "매출과 사용자 수를 입력하면\nAI 경영 브리핑이 시작됩니다." : "매출과 고객 수를 입력하면\nAI 경영 브리핑이 시작됩니다.")
              : (isStartup ? "Enter revenue and users\nto unlock AI briefings." : "Enter sales and customers\nto unlock AI briefings.")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "320px", margin: "0 auto" }}>
            <div style={{ position: "relative" }}>
              <div style={inputLabelStyle}>{ko ? (isStartup ? "매출" : "매출") : "Sales"}</div>
              <input type="text" inputMode="numeric" placeholder={ko ? "만원" : "만원"} value={d.dailySalesInput} onChange={(e) => d.setDailySalesInput(e.target.value)} style={inputFieldStyle} onFocus={focusIn} onBlur={focusOut} />
            </div>
            <div style={{ position: "relative" }}>
              <div style={inputLabelStyle}>{ko ? (isStartup ? "사용자" : "고객") : (isStartup ? "Users" : "Cust.")}</div>
              <input type="text" inputMode="numeric" placeholder={ko ? "명" : "count"} value={d.dailyCustomersInput} onChange={(e) => d.setDailyCustomersInput(e.target.value)} style={{ ...inputFieldStyle, paddingLeft: "60px" }} onFocus={focusIn} onBlur={focusOut} />
            </div>
            <button type="button" onClick={() => d.handleAddDailyEntry()} disabled={!d.dailySalesInput} style={{
              width: "100%", padding: "16px", borderRadius: "14px", border: "none",
              background: d.dailySalesInput ? `linear-gradient(135deg, ${PRIMARY} 0%, #457b9d 100%)` : "rgba(0,0,0,0.04)",
              color: d.dailySalesInput ? "#fff" : "rgba(15,23,42,0.25)",
              fontSize: "16px", fontWeight: 700, cursor: d.dailySalesInput ? "pointer" : "default",
              fontFamily: FONT_STACK, letterSpacing: "-0.01em",
              boxShadow: d.dailySalesInput ? "0 4px 16px rgba(25,25,112,0.2)" : "none",
              transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
            }}>
              {ko ? "기록 시작하기" : "Start Recording"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={sectionStyle}>
      {/* 매출 입력 chip 제거됨 — 입력은 ActivitySnapshotCard 의 인라인 폼에서만 처리 */}

      {/* ── AI 경영 코칭 — Apple Liquid Glass 스타일 ── */}
      <div style={{
        borderRadius: "20px", overflow: "hidden",
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        border: "0.5px solid rgba(255,255,255,0.5)",
        boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02), 0 12px 40px rgba(0,0,0,0.06)",
      }}>
        {/* 헤더 — 미니멀 */}
        <div style={{
          padding: "18px 22px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" as const }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: `linear-gradient(135deg, ${PRIMARY} 0%, #457b9d 60%, #a8dadc 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(25,25,112,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#fff", fontFamily: FONT_STACK, letterSpacing: "-0.02em" }}>AI</span>
            </div>
            <span style={{
              fontSize: "15px", fontWeight: 700, color: "#0f172a",
              letterSpacing: "-0.025em", fontFamily: FONT_STACK,
            }}>
              {ko ? "AI 경영 코칭" : "AI Coaching"}
            </span>
            {/* 인라인 건강 신호 — 데이터 충분(7일 + 비용)일 때만 등급/점수 노출.
                미달 시 회색 "준비 중" 으로 부드럽게 표시 (오해 방지). */}
            {entries.length > 0 && (
              healthSignalReady ? (
                <span
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    padding: "3px 9px", borderRadius: "999px",
                    background: "rgba(25,25,112,0.04)",
                    border: "0.5px solid rgba(15,23,42,0.06)",
                    fontFamily: FONT_STACK,
                  }}
                  title={ko ? `사업 건강도 ${Math.round(unified.score)}점` : `Business health ${Math.round(unified.score)}/100`}
                >
                  <HealthDot grade={healthGrade} size={6} />
                  <span style={{
                    fontSize: "10.5px", fontWeight: 700,
                    color: healthGradeColor[healthGrade],
                    letterSpacing: "-0.005em",
                  }}>
                    {ko ? healthGradeLabelKo[healthGrade] : healthGradeLabelEn[healthGrade]}
                  </span>
                  <span style={{
                    fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.45)",
                    fontVariantNumeric: "tabular-nums" as const,
                  }}>
                    {Math.round(unified.score)}점
                  </span>
                </span>
              ) : (
                <span
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    padding: "3px 9px", borderRadius: "999px",
                    background: "rgba(25,25,112,0.035)",
                    border: "0.5px solid rgba(15,23,42,0.05)",
                    fontFamily: FONT_STACK,
                  }}
                  title={ko
                    ? `정확한 건강도는 7일 이상 매출 + 월 비용이 모이면 보여드릴게요. (${entries.length}일 / 7일)`
                    : `Need 7+ days of sales and monthly costs to show health. (${entries.length} / 7 days)`}
                >
                  <span style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: "rgba(15,23,42,0.2)",
                    boxShadow: "0 0 4px rgba(15,23,42,0.15)",
                  }} />
                  <span style={{
                    fontSize: "10.5px", fontWeight: 600,
                    color: "rgba(15,23,42,0.5)",
                    letterSpacing: "-0.005em",
                  }}>
                    {ko ? "분석 준비 중" : "Analyzing"}
                  </span>
                  <span style={{
                    fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.35)",
                    fontVariantNumeric: "tabular-nums" as const,
                  }}>
                    {entries.length}/7일
                  </span>
                </span>
              )
            )}
          </div>
          <div style={{
            fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.3)",
            letterSpacing: "0.02em",
          }}>
            {new Date().toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "short", day: "numeric", weekday: "short" })}
          </div>
        </div>

        {/* ── 위험 신호 영역 — AI 코칭 카드 안에 시각적으로 강하게 통합 ──
            기존 별도 HealthBadge 대신 본 카드 내부에서 큰 컬러 박스로 노출.
            데이터 충분 + warning/critical 영역 OR 데이터 부족 + 명백한 사실 신호. */}
        {riskSignals.length > 0 && (
          <div style={{ padding: "0 22px 14px", display: "grid", gap: "8px" }}>
            {riskSignals.map((s, i) => {
              const c = HEALTH_COLORS[s.grade];
              return (
                <div key={i} style={{
                  position: "relative",
                  borderRadius: "14px",
                  padding: "13px 15px 13px 16px",
                  background: c.bg,
                  border: `0.5px solid ${c.border}`,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "11px",
                  fontFamily: FONT_STACK,
                }}>
                  {/* 좌측 dot — glow 펄스 */}
                  <span style={{
                    width: "9px", height: "9px", borderRadius: "50%",
                    background: c.dot,
                    boxShadow: `0 0 8px ${c.glow}, inset 0 0.5px 0 rgba(255,255,255,0.4)`,
                    flexShrink: 0,
                    marginTop: "5px",
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: "flex", alignItems: "baseline", gap: "8px",
                      marginBottom: "3px",
                    }}>
                      <span style={{
                        fontSize: "13px", fontWeight: 700,
                        color: c.text,
                        letterSpacing: "-0.012em",
                      }}>
                        {s.title}
                      </span>
                      <span style={{
                        fontSize: "10px", fontWeight: 700,
                        color: c.text,
                        opacity: 0.7,
                        letterSpacing: "0.02em",
                        textTransform: "uppercase" as const,
                      }}>
                        {ko ? healthGradeLabelKo[s.grade] : healthGradeLabelEn[s.grade]}
                      </span>
                    </div>
                    <div style={{
                      fontSize: "12.5px", fontWeight: 500,
                      color: "rgba(15,23,42,0.7)",
                      lineHeight: 1.5,
                      letterSpacing: "-0.005em",
                    }}>
                      {s.message}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* AI 브리핑 메시지 */}
        <div style={{ padding: "0 22px 16px" }}>
          <p style={{
            margin: 0, fontSize: "14.5px", fontWeight: 500,
            lineHeight: 1.65, color: "rgba(15,23,42,0.75)",
            fontFamily: FONT_STACK, letterSpacing: "-0.01em",
          }}>{insightText}</p>
          {/* AI insight 가 K-히트 사례를 인용했을 때 — [사례:XX] 배지 노출 */}
          {d.aiActions?.insightReferencedCase && (
            <div style={{ marginTop: "8px" }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 9px",
                borderRadius: "999px",
                background: "rgba(99,102,241,0.07)",
                border: "0.5px solid rgba(99,102,241,0.16)",
                fontSize: "10.5px",
                fontWeight: 650,
                color: "#4f46e5",
                fontFamily: FONT_STACK,
                letterSpacing: "-0.01em",
              }}>
                <span style={{ opacity: 0.7, fontSize: "10px" }}>{ko ? "사례" : "Case"}</span>
                <span>·</span>
                <span>{d.aiActions.insightReferencedCase.name}</span>
              </span>
            </div>
          )}
        </div>

        {/* AI 코칭 로드 실패/skip 시 — 이유에 따라 다른 메시지 */}
        {!d.aiActions && !d.aiActionsLoading && (() => {
          const reason = d.aiActionsSkipReason;
          // 매출 미기록 2일 이상 — Hero가 이미 "매출 기록" 안내 중이므로 여기선 숨김 (중복 방지)
          if (reason === "stale-data") return null;
          // 미런칭 — 정상 상태, 메시지 불필요
          if (reason === "not-launched") return null;
          // 세션 없음 — 로그인 필요
          if (reason === "no-session") {
            return (
              <div style={{ padding: "0 22px 12px" }}>
                <div style={{
                  padding: "10px 14px", borderRadius: "12px",
                  background: "rgba(245,158,11,0.04)",
                  border: "0.5px solid rgba(245,158,11,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)" }}>
                    {ko ? "로그인 상태를 확인해주세요" : "Please sign in to enable AI coaching"}
                  </span>
                </div>
              </div>
            );
          }
          // error 또는 reason=null (아직 시도 전) — 에러 메시지 + 재시도 버튼
          const errMsg = d.aiActionsError;
          return (
            <div style={{ padding: "0 22px 12px" }}>
              <div style={{
                padding: "10px 14px", borderRadius: "12px",
                background: "rgba(245,158,11,0.04)",
                border: "0.5px solid rgba(245,158,11,0.08)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: "8px",
              }}>
                <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                  {errMsg
                    ? (ko ? `AI 코칭 불러오기 실패 — ${errMsg}` : `AI coaching failed — ${errMsg}`)
                    : (ko ? "AI 코칭을 불러오지 못했습니다" : "AI coaching unavailable")}
                </span>
                <button type="button" onClick={() => { void d.fetchAiActions(true); }} style={{
                  fontSize: "11px", fontWeight: 620, color: "#191970",
                  background: "none", border: "none", cursor: "pointer",
                  flexShrink: 0,
                }}>
                  {ko ? "다시 시도" : "Retry"}
                </button>
              </div>
            </div>
          );
        })()}

        {/* 긴급 경고 (있을 때만) */}
        {(() => {
          const crisis = d.aiActions?.crisisActions;
          if (!crisis || crisis.length === 0) return null;
          return (
            <div style={{ padding: "0 22px 12px" }}>
              <div style={{
                borderRadius: "14px", padding: "12px 16px",
                background: "rgba(255,59,48,0.05)",
                border: "0.5px solid rgba(255,59,48,0.12)",
              }}>
                {crisis.slice(0, 2).map((c, i) => (
                  <div key={i} style={{
                    display: "flex", gap: "10px", alignItems: "flex-start",
                    padding: i > 0 ? "8px 0 0" : "0",
                    borderTop: i > 0 ? "0.5px solid rgba(255,59,48,0.08)" : "none",
                  }}>
                    <div style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: RED, flexShrink: 0, marginTop: "6px",
                    }} />
                    <div>
                      <span style={{ fontSize: "13.5px", fontWeight: 650, color: "#0f172a", letterSpacing: "-0.01em" }}>{c.title}</span>
                      <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", marginLeft: "6px" }}>{c.impact}</span>
                      {c.referencedCase && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "3px",
                          marginLeft: "8px",
                          padding: "1px 7px", borderRadius: "999px",
                          background: "rgba(255,59,48,0.06)",
                          border: "0.5px solid rgba(255,59,48,0.16)",
                          fontSize: "10px", fontWeight: 650, color: "#b91c1c",
                          letterSpacing: "-0.01em",
                          verticalAlign: "middle",
                        }}>
                          <span style={{ opacity: 0.7 }}>{ko ? "사례" : "Case"}</span>
                          <span>·</span>
                          <span>{c.referencedCase.name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ═══════════════ Hero: 오늘의 1가지 (분석 + 행동) ═══════════════ */}
        {(() => {
          const toneStyles = HERO_TONE_STYLES[hero.tone];
          const analysis = ko ? hero.analysisKo : hero.analysisEn;
          const action = ko ? hero.actionKo : hero.actionEn;
          const ctaLabel = ko ? hero.ctaKo : hero.ctaEn;
          const tag = ko ? hero.tagKo : hero.tagEn;

          // LinkedIn 특수 케이스 (기존 동작 유지)
          const titleLower = (action || "").toLowerCase();
          const isCofounderAction = hero.source === "ai-action" && (
            titleLower.includes("공동창업") || titleLower.includes("co-founder") || titleLower.includes("cofounder") || titleLower.includes("팀원") || titleLower.includes("recruit")
          );

          return (
            <div style={{ padding: "0 22px 20px" }}>
              <div style={{
                padding: "18px 20px",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.5)",
                border: `1px solid ${toneStyles.cardBorder}`,
              }}>
                {/* Tag — 미니멀 캡션 + (industry 출처) 우선순위 배지 */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <div style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase" as const,
                    color: toneStyles.tagColor,
                  }}>
                    {tag}
                  </div>
                  {hero.priority && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: PRIORITY_META[hero.priority].bg,
                        color: PRIORITY_META[hero.priority].color,
                        fontSize: "10.5px",
                        fontWeight: 700,
                        letterSpacing: "-0.005em",
                      }}
                    >
                      {PRIORITY_META[hero.priority].label}
                    </span>
                  )}
                </div>

                {/* Analysis (왜) — 큰 텍스트 */}
                <div style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#0f172a",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.4,
                  marginBottom: "8px",
                  fontFamily: FONT_STACK,
                }}>
                  {analysis}
                </div>

                {/* [사례] 배지 — AI 가 K-히트 사례를 인용했을 때만 노출 */}
                {hero.referencedCase && (
                  <div style={{ marginBottom: "10px" }}>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      background: "rgba(99,102,241,0.08)",
                      border: "0.5px solid rgba(99,102,241,0.18)",
                      fontSize: "11px",
                      fontWeight: 650,
                      color: "#4f46e5",
                      fontFamily: FONT_STACK,
                      letterSpacing: "-0.01em",
                    }}>
                      <span style={{ opacity: 0.7, fontSize: "10px" }}>{ko ? "사례" : "Case"}</span>
                      <span>·</span>
                      <span>{hero.referencedCase.name}</span>
                    </span>
                  </div>
                )}

                {/* Action (무엇) — 보조 텍스트 */}
                {action && (
                  <div style={{
                    fontSize: "13.5px",
                    fontWeight: 500,
                    color: "rgba(15,23,42,0.6)",
                    lineHeight: 1.55,
                    marginBottom: "14px",
                    fontFamily: FONT_STACK,
                  }}>
                    {action}
                  </div>
                )}

                {/* Source 배지 — Perplexity·Glean 패턴, 인사이트 출처 투명성 */}
                {hero.sourceLabel && (
                  <div style={{
                    fontSize: "10.5px",
                    fontWeight: 500,
                    color: "rgba(15,23,42,0.4)",
                    marginBottom: "12px",
                    letterSpacing: "-0.005em",
                    fontFamily: FONT_STACK,
                  }}>
                    근거 · {hero.sourceLabel}
                  </div>
                )}

                {/* CTA — 단일 버튼 */}
                {isCofounderAction ? (
                  <a
                    href="https://www.linkedin.com/search/results/people/?keywords=cofounder%20startup%20korea"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "10px 18px",
                      borderRadius: "10px",
                      border: "none",
                      background: "#0a66c2",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 650,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      textDecoration: "none",
                      fontFamily: FONT_STACK,
                    }}
                  >
                    {ko ? "LinkedIn에서 공동창업자 찾기" : "Find co-founders on LinkedIn"}
                    <ArrowRight size={14} strokeWidth={1.5} />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handleHeroCta}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "10px",
                      border: "none",
                      background: toneStyles.ctaBg,
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 650,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontFamily: FONT_STACK,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = toneStyles.ctaHoverBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = toneStyles.ctaBg)}
                  >
                    {ctaLabel}
                    <ArrowRight size={14} strokeWidth={1.5} />
                  </button>
                )}
              </div>

              {/* ═══════════════ 카드 스택 — 모든 hero source 에서 항상 노출 ═══════════════
                  - hero.source === "industry": primary 가 이미 industry 라 첫 항목 제외 (2개)
                  - 그 외 (stale-sales/crisis/anomaly/...): industry 인사이트 3개 모두 노출 */}
              {(() => {
                const stackList = hero.source === "industry"
                  ? allInsightSpecs.slice(1) // primary 가 hero 라 1번 인덱스부터
                  : allInsightSpecs;          // hero 가 다른 source → 3개 모두
                if (stackList.length === 0) return null;
                return <InsightStack related={stackList} ko={ko} />;
              })()}

              {/* 오늘 시간 체크인 (저녁 17시+ & 오늘 미입력 시만) */}
              {showTimeLogPrompt && <TimeLogCheckIn ko={ko} />}

              {/* 다른 제안들 — 접힘형 (기본 닫힘, 스트레스 최소화) */}
              {otherItems.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setMoreOpen(!moreOpen)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "none",
                      background: "transparent",
                      color: "rgba(15,23,42,0.5)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      fontFamily: FONT_STACK,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(15,23,42,0.75)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(15,23,42,0.5)")}
                  >
                    {moreOpen
                      ? (ko ? `다른 제안 ${otherItems.length}개 접기` : `Collapse ${otherItems.length} more`)
                      : (ko ? `다른 제안 ${otherItems.length}개 보기` : `Show ${otherItems.length} more`)}
                    {moreOpen ? <ChevronUp size={12} strokeWidth={1.5} /> : <ChevronDown size={12} strokeWidth={1.5} />}
                  </button>
                  {moreOpen && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "6px" }}>
                      {otherItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={item.onClick}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            background: "rgba(0,0,0,0.015)",
                            border: "0.5px solid rgba(0,0,0,0.04)",
                            cursor: "pointer",
                            textAlign: "left" as const,
                            fontFamily: FONT_STACK,
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(25,25,112,0.03)";
                            e.currentTarget.style.borderColor = "rgba(25,25,112,0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(0,0,0,0.015)";
                            e.currentTarget.style.borderColor = "rgba(0,0,0,0.04)";
                          }}
                        >
                          <div style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "8px",
                            background: `${item.iconColor}12`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            <item.Icon size={14} strokeWidth={1.5} color={item.iconColor} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: "12.5px",
                              fontWeight: 600,
                              color: "rgba(15,23,42,0.75)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap" as const,
                            }}>
                              {item.label}
                            </div>
                            {item.hint && (
                              <div style={{
                                fontSize: "11px",
                                fontWeight: 500,
                                color: "rgba(15,23,42,0.4)",
                                marginTop: "1px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap" as const,
                              }}>
                                {item.hint}
                              </div>
                            )}
                          </div>
                          <ArrowRight size={11} strokeWidth={1.8} color="rgba(15,23,42,0.3)" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── 4 균등 컴팩트 KPI (참조 디자인: 라벨 + dot + 숫자+단위 + 가로 sparkline + 변화 chip) ── */}
      {/* hideKpis=true 면 외부 DailyKpiStrip 이 KPI 노출 담당 → 여기서는 숨김 (런웨이 등 중복 방지) */}
      {!hideKpis && (
      <div className="morning-kpi-grid" style={kpiCompactGridStyle}>
        {kpis.map((kpi) => {
          const dotColor =
            kpi.color === RED ? "#ff3b30"
            : kpi.color === YELLOW ? "#ff9f0a"
            : kpi.color === GREEN ? "#34c759"
            : null;
          const { numPart, unitPart } = splitValueAndUnit(kpi.value, kpi.unit);
          const changeC = kpi.change !== null ? changeColor(kpi.change) : null;
          const sparklineColor = dotColor ?? (changeC === RED ? "#ff3b30" : changeC === GREEN ? "#34c759" : "#191970");
          return (
            <div key={kpi.label} style={kpiCompactCardStyle}>
              {/* 1행: 라벨 + 우상단 상태 dot */}
              <div style={kpiCompactHeaderStyle}>
                <span style={kpiCompactLabelStyle}>{kpi.label}</span>
                {dotColor && (
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: dotColor,
                    boxShadow: `0 0 0 3px ${dotColor}1a`,
                    flexShrink: 0,
                  }} />
                )}
              </div>

              {/* 2행: 숫자+단위 (좌측) · sparkline (우측) 가로 배치 */}
              <div style={kpiCompactValueRowStyle}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px", minWidth: 0 }}>
                  <span className="num-animate" style={kpiCompactValueStyle}>{numPart}</span>
                  {unitPart && <span style={kpiCompactUnitStyle}>{unitPart}</span>}
                </div>
                {kpi.chart && kpi.chart.kind === "line" && (
                  <div style={kpiCompactSparklineSlotStyle}>
                    <CompactSparkline series={kpi.chart.series} color={sparklineColor} />
                  </div>
                )}
              </div>

              {/* 3행: 변화 chip 또는 보조 정보 */}
              {kpi.change !== null ? (
                <div style={{ ...kpiCompactChangeStyle, color: changeC ?? LABEL_COLOR }}>
                  {changeArrow(kpi.change)} {Math.abs(kpi.change).toFixed(1)}% <span style={kpiCompactChangeLabelStyle}>{kpi.changeLabel}</span>
                </div>
              ) : kpi.extraInfo ? (
                <div style={kpiCompactExtraInfoStyle}>{kpi.extraInfo}</div>
              ) : kpi.hint ? (
                <div style={kpiCompactHintStyle}>{kpi.hint}</div>
              ) : kpi.changeLabel ? (
                <div style={kpiCompactChangeLabelStyle}>{kpi.changeLabel}</div>
              ) : null}
            </div>
          );
        })}
      </div>
      )}

      {/* ── AI 파트너 챗봇은 starter-stage-demo 의 FloatingAIPartner 로 전역 마운트됨 (오른쪽 하단 FAB) ── */}

      {/* ── 북극성 지표 카드 ── */}
      {(() => {
        const rdDecisions = useRoadmapStore.getState().decisions;
        const geInputs = (rdDecisions["growth-engine"] as Record<string, unknown> | undefined)?.inputs as Record<string, unknown> | undefined;
        const nsType = (geInputs?.northStarType as string) ?? "";
        const nsName = (geInputs?.northStarMetricName as string) ?? "";
        if (!nsType && !nsName) return null;
        const typeLabel: Record<string, { ko: string; en: string }> = {
          saas: { ko: "SaaS", en: "SaaS" },
          marketplace: { ko: "마켓플레이스", en: "Marketplace" },
          content: { ko: "콘텐츠", en: "Content" },
          commerce: { ko: "커머스", en: "Commerce" },
        };
        const tl = typeLabel[nsType];
        return (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "12px 16px", borderRadius: "14px",
            background: "linear-gradient(135deg, rgba(5,150,105,0.04) 0%, rgba(5,150,105,0.01) 100%)",
            border: "1px solid rgba(5,150,105,0.1)",
          }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "9px",
              background: "rgba(5,150,105,0.08)", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Target size={16} color="#059669" strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "#059669", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
                {ko ? "북극성 지표" : "NORTH STAR"}{tl ? ` · ${ko ? tl.ko : tl.en}` : ""}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 680, color: "#0f172a", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                {nsName || (ko ? "지표명을 입력하세요" : "Set your metric name")}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 7일 매출 미니 차트는 ActivitySnapshotCard (Tier 1.1 매출 흐름 카드) 와 중복이므로 제거됨 */}

      {/* ── Keyframes + responsive grid ── */}
      <style>{`
        @keyframes numberSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .num-animate {
          animation: numberSlideUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        @media (max-width: 640px) {
          .morning-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  fontFamily: FONT_STACK,
};

const briefingCardStyle: React.CSSProperties = {
  borderRadius: "20px",
  padding: "18px 20px",
  background:
    "linear-gradient(135deg, rgba(219,234,254,0.28) 0%, rgba(209,250,229,0.18) 100%)",
  border: "1px solid rgba(25,25,112,0.06)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
};

const aiBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "22px",
  height: "16px",
  borderRadius: "4px",
  background: "linear-gradient(135deg, #191970, #457b9d)",
  color: "#fff",
  fontSize: "8px",
  fontWeight: 720,
  letterSpacing: "0.06em",
  lineHeight: 1,
};

const aiBadgeLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 640,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: LABEL_COLOR,
};

const insightTextStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: 1.55,
  color: "rgba(15,23,42,0.7)",
  margin: 0,
  fontFamily: FONT_STACK,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "10px",
};

// ─── 노스스타화: 듀얼 Hero + Chip Strip 스타일 (Apple 톤) ────────────────────

/** Apple 패턴: "8.8개월" → { numPart: "8.8", unitPart: "개월" }
 *  "₩2,450,000" 또는 "10만원" 처럼 통화는 그대로 두고 unit 비움
 *  unit prop이 명시되어 있으면 그대로 사용 */
function splitValueAndUnit(value: string, explicitUnit?: string): { numPart: string; unitPart: string | null } {
  if (explicitUnit) return { numPart: value, unitPart: explicitUnit };
  // "8.8개월", "8.8mo" 같은 패턴
  const m = value.match(/^([0-9.,+\-−]+)\s*(개월|mo|%|시간|h|일|d|명|건|건수)$/);
  if (m) return { numPart: m[1], unitPart: m[2] };
  // 통화·기타는 분리하지 않음
  return { numPart: value, unitPart: null };
}

const dualHeroGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
  alignItems: "start",  /* 좌우 카드 height 자연 적응 — 빈 공간 제거 */
};

/* ─── 참조 디자인: 4 균등 컴팩트 KPI 카드 (가로 layout + 인라인 sparkline) ─── */
const kpiCompactGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "8px",
};

const kpiCompactCardStyle: React.CSSProperties = {
  borderRadius: "14px",
  padding: "12px 14px 12px",
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(15,23,42,0.05)",
  boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 4px 10px rgba(0,0,0,0.025)",
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  gap: "6px",
};

const kpiCompactHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "6px",
  minWidth: 0,
};

const kpiCompactLabelStyle: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 650,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: LABEL_COLOR,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const kpiCompactValueRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
};

const kpiCompactValueStyle: React.CSSProperties = {
  fontSize: "clamp(20px, 2.2vw, 26px)",
  fontWeight: 750,
  letterSpacing: "-0.03em",
  lineHeight: 1.05,
  fontVariantNumeric: "tabular-nums",
  fontFamily: FONT_STACK,
  color: PRIMARY,
  whiteSpace: "nowrap",
};

const kpiCompactUnitStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: LABEL_COLOR,
  letterSpacing: "-0.005em",
  whiteSpace: "nowrap",
};

const kpiCompactSparklineSlotStyle: React.CSSProperties = {
  width: "42%",
  maxWidth: "80px",
  height: "28px",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
};

const kpiCompactChangeStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 650,
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "-0.005em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  overflow: "hidden",
};

const kpiCompactChangeLabelStyle: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 500,
  color: LABEL_COLOR,
  letterSpacing: "-0.005em",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const kpiCompactExtraInfoStyle: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 500,
  color: LABEL_COLOR,
  letterSpacing: "-0.005em",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const kpiCompactHintStyle: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 600,
  color: "#FF9F0A",
  letterSpacing: "-0.005em",
};

const heroKpiCardStyle: React.CSSProperties = {
  borderRadius: "14px",
  padding: "12px 14px 14px",
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(15,23,42,0.05)",
  boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.025)",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  minWidth: 0,
  transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease",
};

const heroKpiHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  marginBottom: "6px",
};

const heroKpiLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 650,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: LABEL_COLOR,
  lineHeight: 1,
};

const heroKpiTrendChipStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 650,
  padding: "3px 9px",
  borderRadius: "999px",
  letterSpacing: "-0.005em",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
};

const heroKpiStatusPillStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 650,
  padding: "3px 10px 3px 8px",
  borderRadius: "999px",
  letterSpacing: "-0.005em",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  whiteSpace: "nowrap",
};

const heroKpiValueRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "8px",
  flexWrap: "wrap",
};

/** Hero number — 압축 후 22-28px clamp, 항상 PRIMARY 톤 */
const heroKpiValueStyle: React.CSSProperties = {
  fontSize: "clamp(22px, 2.6vw, 28px)",
  fontWeight: 720,
  letterSpacing: "-0.03em",
  lineHeight: 1.05,
  fontVariantNumeric: "tabular-nums",
  fontFamily: FONT_STACK,
  color: PRIMARY,
};

/** Unit label — hero 옆 baseline 정렬 */
const heroKpiUnitStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: LABEL_COLOR,
  letterSpacing: "-0.005em",
};

const heroKpiHintStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#FF9F0A",
  marginTop: "5px",
  letterSpacing: "-0.005em",
};

/** Mercury 톤: hero 숫자 바로 아래 잔고/소진 페이스 같은 분자·분모 정보 */
const heroKpiExtraInfoStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: LABEL_COLOR,
  marginTop: "5px",
  letterSpacing: "-0.005em",
  fontVariantNumeric: "tabular-nums",
};

const heroKpiCaptionStyle: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 500,
  color: LABEL_COLOR,
  marginTop: "5px",
  letterSpacing: "-0.005em",
};

const chipStripStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  marginTop: "6px",
};

const chipKpiStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px 12px",
  borderRadius: "999px",
  background: "rgba(15,23,42,0.035)",
  border: "1px solid rgba(15,23,42,0.04)",
  flex: "1 1 200px",
  minWidth: 0,
};

const chipKpiLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 650,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: LABEL_COLOR,
  flexShrink: 0,
};

const chipKpiValueStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#0f172a",
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "-0.015em",
  marginLeft: "auto",
};

const chipKpiChangeStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 650,
  fontVariantNumeric: "tabular-nums",
};

const chipKpiHintStyle: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 600,
  color: "#FF9F0A",
  marginLeft: "auto",
  letterSpacing: "-0.005em",
};

// Responsive: we use a CSS media query via <style> for 2-col mobile,
// but also set a min-width to ensure graceful degradation.
// For inline-style only approach, the grid will naturally wrap via
// the container query below.

const kpiCardStyle: React.CSSProperties = {
  borderRadius: "20px",
  padding: "18px 16px",
  background: "rgba(255,255,255,0.82)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(25,25,112,0.08)",
  boxShadow:
    "0 1px 3px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.025)",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  minWidth: 0,
};

/* ─── 컴팩트 sparkline (KPI 카드 우측 인라인) — 참조 디자인 톤
 *  - Catmull-Rom spline → cubic bezier 변환으로 부드러운 곡선
 *  - 두꺼운 stroke (2.0) + 그라디언트 fill + 끝점 강조 dot (흰 테두리) */
function CompactSparkline({ series, color }: { series: number[]; color: string }) {
  const nonZero = series.filter((v) => v > 0);
  if (nonZero.length < 2) {
    // 데이터 부족 시 일정한 placeholder — 카드 정렬 유지
    return (
      <svg width="100%" height="28" viewBox="0 0 80 28" preserveAspectRatio="none" style={{ display: "block" }}>
        <line x1="2" y1="24" x2="78" y2="24" stroke="rgba(15,23,42,0.08)" strokeWidth="1" strokeDasharray="2 3" />
      </svg>
    );
  }
  const max = Math.max(...series, 1);
  const min = Math.min(...series, 0);
  const range = max - min || 1;
  const w = 80, h = 28, pad = 4;
  const iw = w - pad * 2, ih = h - pad * 2;
  const step = iw / (series.length - 1);
  const pts = series.map((v, i) => ({
    x: pad + i * step,
    y: pad + ih - ((v - min) / range) * ih,
  }));

  // Catmull-Rom → Bezier 변환 (부드러운 곡선, overshoot 최소)
  const smooth = (() => {
    if (pts.length < 2) return "";
    let p = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      // tension 0.2 — 참조 디자인처럼 완만
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      p += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return p;
  })();

  const endPt = pts[pts.length - 1];
  const fillPath = `${smooth} L ${endPt.x.toFixed(2)} ${(pad + ih).toFixed(2)} L ${pts[0].x.toFixed(2)} ${(pad + ih).toFixed(2)} Z`;
  const gradId = `cspark-${color.replace("#", "")}-${pts.length}`;
  return (
    <svg width="100%" height="28" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`} />
      <path d={smooth} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* 끝점 강조 — 흰 테두리 후광 + 메인 dot */}
      <circle cx={endPt.x} cy={endPt.y} r="3.5" fill="#fff" />
      <circle cx={endPt.x} cy={endPt.y} r="2.6" fill={color} />
    </svg>
  );
}

// ─── KPI 인라인 미니 차트 ───────────────────────────────────────────
type KpiChart =
  | { kind: "line"; series: number[]; color: string }
  | { kind: "gauge"; currentPct: number; color: string }
  | { kind: "targetBar"; currentPct: number; targetPct: number; color: string };

function KpiMiniChart({ chart }: { chart: KpiChart }) {
  if (chart.kind === "line") {
    const nonZero = chart.series.filter((v) => v > 0);
    if (nonZero.length < 2) return null;
    const max = Math.max(...chart.series, 1);
    const min = Math.min(...chart.series, 0);
    const range = max - min || 1;
    const w = 100;
    const h = 26;
    const pad = 2;
    const iw = w - pad * 2;
    const ih = h - pad * 2;
    const step = iw / (chart.series.length - 1);
    const points = chart.series.map((v, i) => ({
      x: pad + i * step,
      y: pad + ih - ((v - min) / range) * ih,
    }));
    const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
    const fillPath = `${path} L ${points[points.length - 1].x.toFixed(2)} ${(pad + ih).toFixed(2)} L ${points[0].x.toFixed(2)} ${(pad + ih).toFixed(2)} Z`;
    const gradId = `kpi-spark-${Math.random().toString(36).slice(2, 8)}`;
    const endPoint = points[points.length - 1];
    return (
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ display: "block", marginTop: 10 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chart.color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={chart.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill={`url(#${gradId})`} />
        <path d={path} fill="none" stroke={chart.color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={endPoint.x} cy={endPoint.y} r={1.9} fill={chart.color} />
      </svg>
    );
  }

  if (chart.kind === "gauge") {
    return (
      <div style={{ marginTop: 12, height: 6, borderRadius: 3, background: "rgba(17,17,17,0.06)", overflow: "hidden" }}>
        <div style={{
          width: `${Math.max(4, chart.currentPct)}%`,
          height: "100%",
          background: chart.color,
          borderRadius: 3,
          transition: "width 0.5s cubic-bezier(0.22,1,0.36,1)",
        }} />
      </div>
    );
  }

  // targetBar — 현재값 바 + 목표 위치 마커
  return (
    <div style={{ marginTop: 12, height: 6, borderRadius: 3, background: "rgba(17,17,17,0.06)", position: "relative" as const, overflow: "hidden" }}>
      <div style={{
        width: `${Math.max(4, chart.currentPct)}%`,
        height: "100%",
        background: chart.color,
        borderRadius: 3,
        transition: "width 0.5s cubic-bezier(0.22,1,0.36,1)",
      }} />
      <div style={{
        position: "absolute" as const,
        left: `${chart.targetPct}%`,
        top: -2, bottom: -2,
        width: "2px",
        background: "rgba(17,17,17,0.35)",
        borderRadius: 1,
      }} />
    </div>
  );
}

const kpiLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 620,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: LABEL_COLOR,
  marginBottom: "8px",
  lineHeight: 1,
};

const kpiValueStyle: React.CSSProperties = {
  fontSize: "clamp(28px, 4vw, 36px)",
  fontWeight: 700,
  letterSpacing: "-0.04em",
  lineHeight: 1.1,
  fontVariantNumeric: "tabular-nums",
  fontFamily: FONT_STACK,
  color: PRIMARY,
};

// ═══════════════════════════════════════════════════════════════════════
//   InsightStack — 우선순위 배지 + 카드 스택 펼치기 (사장님 요청 2026-05-07)
//
//  • 기본: 접힘 — primary 카드 아래 두 줄 peek 으로 "더 있다" 힌트
//  • 클릭: 세로로 펼쳐지며 priority 배지 (1순위/2순위/3순위) 노출
//  • 디자인 보호: 작은 회색 텍스트 + 얇은 카드만 사용. 메인 인사이트 강조 훼손 X
// ═══════════════════════════════════════════════════════════════════════

export const PRIORITY_META: Record<"high" | "medium" | "low", { label: string; rank: string; color: string; bg: string }> = {
  high:   { label: "1순위", rank: "1", color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
  medium: { label: "2순위", rank: "2", color: "#d97706", bg: "rgba(217,119,6,0.08)" },
  low:    { label: "3순위", rank: "3", color: "#059669", bg: "rgba(5,150,105,0.08)" },
};

export function InsightStack({ related, ko }: { related: Omit<Hero, "relatedSpecs">[]; ko: boolean }) {
  const [open, setOpen] = useState(false);
  if (related.length === 0) return null;

  return (
    <div style={{ marginTop: "10px" }}>
      {/* Toggle — 펼치기 / 접기 */}
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
          fontFamily: FONT_STACK,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(15,23,42,0.04)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = open ? "rgba(15,23,42,0.02)" : "rgba(15,23,42,0.01)")}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          {/* 우선순위 미니 dot 들 */}
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

      {/* 펼친 카드 스택 — 우선순위 배지 + 미니 카드 */}
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
                {/* 우선순위 배지 */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span
                    style={{
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
                      fontFamily: FONT_STACK,
                    }}
                  >
                    {meta.label}
                  </span>
                  {spec.sourceLabel && (
                    <span style={{ fontSize: "10px", color: "rgba(15,23,42,0.4)", fontFamily: FONT_STACK }}>
                      · {spec.sourceLabel}
                    </span>
                  )}
                </div>

                {/* 분석 */}
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 650,
                    color: "#0f172a",
                    letterSpacing: "-0.015em",
                    lineHeight: 1.45,
                    marginBottom: "4px",
                    fontFamily: FONT_STACK,
                  }}
                >
                  {analysis}
                </div>

                {/* 행동 */}
                {action && (
                  <div
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 500,
                      color: "rgba(15,23,42,0.55)",
                      lineHeight: 1.5,
                      marginBottom: "10px",
                      fontFamily: FONT_STACK,
                    }}
                  >
                    {action}
                  </div>
                )}

                {/* 미니 CTA */}
                <button
                  type="button"
                  onClick={() => {
                    // marketing → 별도 마케팅 페이지로 surface 전환
                    if (spec.ctaTarget === "marketing") {
                      window.dispatchEvent(new CustomEvent("bup:navigate-feature", {
                        detail: { surface: "marketing" },
                      }));
                      return;
                    }
                    // 코칭 내용 ↔ 실제 카드 매칭 (CEOMorningHero.handleBriefingCta 와 동일 매핑).
                    //   ⚠ "전부 매출 기록" 종착 금지. 메뉴/재고는 재고 카드, 비용은 비용 관리 카드 등.
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
                    fontFamily: FONT_STACK,
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
