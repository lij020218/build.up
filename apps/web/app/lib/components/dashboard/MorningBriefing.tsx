"use client";

import { useMemo, useState } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import {
  calculateSalesBreakdown,
  calculateMoM,
  calculateMonthlyPnL,
} from "@build-up/shared";
import type { DailyEntry, MonthlyCosts } from "../../useDashboard";
import { BarChart3, PenLine, Target, AlertTriangle, Package, Ticket, Camera, Star, Sparkles, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRoadmapStore } from "../../stores/roadmap-store";
import { SubscriptionPlanEntry } from "./SubscriptionPlanEntry";
import { useCashflowStore } from "../../stores/cashflow-store";
import { useAgentsStore, agentUrgencyScore, type AgentProposal, type AgentKind } from "../../stores/agents-store";
import { useProfileStore } from "../../stores/profile-store";
import { useMarketingStore, type PromoCode } from "../../stores/marketing-store";
import { useOperationsStore } from "../../stores/operations-store";
import { projectCashflow, detectCrisis, type CrisisDetection } from "../../services/cashflow-projection";
import { useIndustryInsight, type IndustryInsight } from "../../hooks/useIndustryInsight";
import { useTimeLogStore, shouldPromptToday } from "../../stores/time-log-store";
import { TimeLogCheckIn } from "./TimeLogCheckIn";

// ─── Constants ──────────────────────────────────────────────────────────────

const FONT_STACK = "inherit";
const PRIMARY = "#1d3557";
const GREEN = "#34C759";
const YELLOW = "#FF9F0A";
const RED = "#FF3B30";
const LABEL_COLOR = "rgba(15,23,42,0.4)";
const CARD_RATIO = 0.85; // rough card-payment ratio for deposit estimate

// ─── Helpers ────────────────────────────────────────────────────────────────

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

type HeroSource = "crisis" | "reorder-urgent" | "ai-action" | "agent" | "industry" | "drucker";
type HeroTone = "crisis" | "warning" | "neutral";

type Hero = {
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
  agentProposalId?: string;           // hero가 agent 출처일 때 id
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
  coupon:  { Icon: Ticket,  color: "#2563eb" },
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

function resolveHero(input: {
  ko: boolean;
  cashflowCrisis: CrisisDetection | null;
  topProposal: AgentProposal | null;
  aiTopAction: { title: string; reason: string; priority: "high" | "medium" } | undefined;
  industryInsight: IndustryInsight | null;
}): Hero {
  const { ko, cashflowCrisis, topProposal, aiTopAction, industryInsight } = input;

  // 1. Cashflow 위기
  if (cashflowCrisis) {
    const days = cashflowCrisis.daysUntilCrisis ?? 0;
    const short = cashflowCrisis.shortfallAmount;
    return {
      source: "crisis",
      tone: "crisis",
      tagKo: "긴급 대응",
      tagEn: "Urgent",
      analysisKo: `${days}일 후 통장 잔고가 ${fmtWon(-short, true)}로 떨어질 수 있어요. 최근 매출 정산 일정과 월 고정비를 합산한 결과입니다.`,
      analysisEn: `In ${days} days your balance may drop to ${fmtWon(-short, false)}. Based on recent settlement schedules and fixed costs.`,
      actionKo: "아래 현금흐름 레이더에서 광고비 감액·공급처 연기·긴급자금 등 7가지 해결책을 고르세요.",
      actionEn: "Pick from 7 one-tap solutions in the Cash-flow Radar below.",
      ctaKo: "해결책 보기",
      ctaEn: "See solutions",
    };
  }

  // 2. 긴급 Agent (reorder, daysUntilStockout ≤ 2)
  if (topProposal && topProposal.kind === "reorder" && topProposal.content.kind === "reorder" && topProposal.content.daysUntilStockout <= 2) {
    const c = topProposal.content;
    return {
      source: "reorder-urgent",
      tone: "warning",
      tagKo: "긴급 재주문",
      tagEn: "Urgent reorder",
      analysisKo: `${c.itemName} 재고가 ${c.currentQuantity}개 남았어요. 현재 소비 속도로 ${c.daysUntilStockout}일 후 소진 예상입니다.`,
      analysisEn: `${c.itemName} has only ${c.currentQuantity} left — estimated to run out in ${c.daysUntilStockout} days at current pace.`,
      actionKo: `${c.recommendedQuantity}개 주문 권장. 공급처 카톡 초안이 준비돼 있어 한 번에 전송할 수 있어요.`,
      actionEn: `${c.recommendedQuantity} units recommended. Supplier KakaoTalk draft ready — one-tap send.`,
      ctaKo: "주문 메시지 복사",
      ctaEn: "Copy order message",
      agentProposalId: topProposal.id,
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
    };
  }

  // 5. Industry Insight
  if (industryInsight) {
    return {
      source: "industry",
      tone: "neutral",
      tagKo: "오늘의 인사이트",
      tagEn: "Today's insight",
      analysisKo: industryInsight.headline ? `${industryInsight.headline}. ${industryInsight.body}` : industryInsight.body,
      analysisEn: industryInsight.headline ? `${industryInsight.headline}. ${industryInsight.body}` : industryInsight.body,
      actionKo: industryInsight.action,
      actionEn: industryInsight.action,
      ctaKo: "오늘 체크인",
      ctaEn: "Check in",
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
    ctaKo: "오늘 체크인",
    ctaEn: "Check in",
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
    tagColor: "#1d3557",
    ctaBg: "#1d3557",
    ctaHoverBg: "#162b45",
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

export function MorningBriefing() {
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
  const primeCostPct =
    totalSales > 0
      ? ((costs.ingredients + costs.labor) / totalSales) * 100
      : 0;

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

  const activeProposals = useMemo(() => {
    return proposals
      .filter((p) => p.status === "pending" && new Date(p.expiresAt) > new Date())
      .sort((a, b) => agentUrgencyScore(a) - agentUrgencyScore(b));
  }, [proposals]);

  const topProposal: AgentProposal | null = activeProposals[0] ?? null;

  // Industry Insight
  const avgDailySales7 = useMemo(() => {
    if (entries.length === 0) return 0;
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const last7 = sorted.slice(-7);
    if (last7.length === 0) return 0;
    return last7.reduce((s, e) => s + e.sales, 0) / last7.length;
  }, [entries]);

  const businessLaunchedDate = useProfileStore((s) => s.businessLaunchedDate);
  const daysSinceLaunch = useMemo(() => {
    if (!d.businessLaunched || !businessLaunchedDate) return undefined;
    return Math.max(0, Math.floor((Date.now() - new Date(businessLaunchedDate).getTime()) / 86400000));
  }, [d.businessLaunched, businessLaunchedDate]);

  const { insight: industryInsight } = useIndustryInsight({
    categoryId: d.industryCategoryId,
    hasUserSales: entries.length > 0,
    avgDailySales: avgDailySales7 > 0 ? avgDailySales7 : undefined,
    daysSinceLaunch,
    enabled: hasData || !!d.industryCategoryId,
  });

  // Hero 선택: 우선순위별 "오늘의 1가지" 결정
  const hero = useMemo(() => resolveHero({
    ko,
    cashflowCrisis,
    topProposal,
    aiTopAction: d.aiActions?.todayActions?.[0],
    industryInsight,
  }), [ko, cashflowCrisis, topProposal, d.aiActions, industryInsight]);

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
    if (hero.source === "crisis") {
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
  const monthlyBurn = costs.ingredients + costs.labor + costs.rent + costs.utilities + (costs.sga ?? 0) + (costs.marketing ?? 0) + costs.other + (costs.interest ?? 0);
  const selectedBudget = (d.selectedBudget ?? 0) as number;
  const runway = monthlyBurn > 0 ? Math.round(selectedBudget / monthlyBurn * 10) / 10 : 0;
  const userChange = sameWeekday && sameWeekday.customers > 0
    ? ((yesterdayCustomers - sameWeekday.customers) / sameWeekday.customers) * 100
    : null;

  // ── KPI cards config
  type KpiCard = {
    label: string;
    value: string;
    change: number | null;
    changeLabel: string;
    color?: string;
    hint?: string;
  };

  const kpis: KpiCard[] = isStartup ? [
    {
      label: ko ? (hasSubs ? "매출 / MRR" : "매출") : (hasSubs ? "REVENUE / MRR" : "REVENUE"),
      value: hasData ? formatWon(yesterdaySales, ko) : "--",
      change: weekdayChange !== null ? Math.round(weekdayChange * 10) / 10 : null,
      changeLabel: ko ? "전주 동요일" : "vs last wk",
      hint: !hasData ? (ko ? "매출을 입력하세요" : "Enter revenue") : undefined,
    },
    {
      label: ko ? "사용자" : "USERS",
      value: hasData ? yesterdayCustomers.toLocaleString(ko ? "ko-KR" : "en-US") : "--",
      change: userChange !== null ? Math.round(userChange * 10) / 10 : null,
      changeLabel: ko ? "전주 동요일" : "vs last wk",
      hint: !hasData ? (ko ? "사용자 수를 입력하세요" : "Enter users") : undefined,
    },
    {
      label: ko ? "번레이트" : "BURN RATE",
      value: hasCosts ? formatWon(monthlyBurn, ko) + (ko ? "/월" : "/mo") : "--",
      change: null,
      changeLabel: ko ? "월 총 비용" : "monthly total",
      hint: !hasCosts ? (ko ? "월 비용을 입력하세요" : "Enter costs") : undefined,
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
    },
  ] : [
    {
      label: ko ? "어제 매출" : "YESTERDAY",
      value: hasData ? formatWon(yesterdaySales, ko) : "--",
      change: weekdayChange !== null ? Math.round(weekdayChange * 10) / 10 : null,
      changeLabel: ko ? "전주 동요일" : "vs last wk",
      hint: !hasData ? (ko ? "매출을 입력하세요" : "Enter sales") : undefined,
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
    },
    {
      label: ko ? "원가율" : "PRIME COST",
      value: hasCosts ? `${primeCostPct.toFixed(1)}%` : "--",
      change: null,
      changeLabel: "",
      color: hasCosts ? trafficLight(primeCostPct, 60, 65) : undefined,
      hint: !hasCosts ? (ko ? "월 비용을 입력하세요" : "Enter costs") : undefined,
    },
    {
      label: ko ? "카드 정산 예정" : "EST. DEPOSIT",
      value: hasData ? formatWon(estDeposit, ko) : "--",
      change: null,
      changeLabel: ko ? "D+2 예상" : "D+2 est.",
      hint: !hasData ? (ko ? "매출을 입력하세요" : "Enter sales") : undefined,
    },
  ];

  // ── 오늘 매출 미입력 여부 확인
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find(e => e.date === todayStr);
  const needsInput = !todayEntry;

  // ── Empty state → Apple-grade 온보딩 카드
  if (!hasData) {
    const inputFieldStyle: React.CSSProperties = {
      width: "100%", padding: "15px 16px 15px 56px", borderRadius: "14px",
      border: "1.5px solid rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.02)",
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
      e.currentTarget.style.boxShadow = "0 0 0 4px rgba(29,53,87,0.08)";
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
          border: "1px solid rgba(0,0,0,0.04)",
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 8px 32px rgba(0,0,0,0.04)",
          textAlign: "center" as const,
        }}>
          <div style={{
            width: "60px", height: "60px", borderRadius: "18px",
            background: `linear-gradient(135deg, ${PRIMARY} 0%, #457b9d 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 8px 24px rgba(29,53,87,0.25), 0 0 0 1px rgba(255,255,255,0.1) inset",
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
              boxShadow: d.dailySalesInput ? "0 4px 16px rgba(29,53,87,0.2)" : "none",
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
      {/* ── 오늘 매출 미입력 시 — Apple-style pill input ── */}
      {needsInput && (
        <div style={{
          borderRadius: "16px", padding: "10px 12px",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "8px",
            background: `linear-gradient(135deg, ${PRIMARY} 0%, #457b9d 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <PenLine size={13} color="#fff" strokeWidth={2.2} />
          </div>
          <input
            type="text" inputMode="numeric"
            placeholder={ko ? (hasSubs ? "매출/MRR" : isStartup ? "매출" : "매출 (만원)") : (hasSubs ? "MRR" : isStartup ? "Revenue" : "Sales")}
            value={d.dailySalesInput}
            onChange={(e) => d.setDailySalesInput(e.target.value)}
            style={{
              flex: "1 1 90px", padding: "8px 12px", borderRadius: "10px",
              border: "1.5px solid rgba(0,0,0,0.05)", background: "rgba(0,0,0,0.02)",
              fontSize: "14px", fontWeight: 650, fontFamily: FONT_STACK,
              outline: "none", color: "#0f172a",
              transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = PRIMARY; e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(29,53,87,0.06)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.05)"; e.currentTarget.style.background = "rgba(0,0,0,0.02)"; e.currentTarget.style.boxShadow = "none"; }}
          />
          <input
            type="text" inputMode="numeric"
            placeholder={ko ? (isStartup ? "사용자" : "고객") : (isStartup ? "Users" : "Cust.")}
            value={d.dailyCustomersInput}
            onChange={(e) => d.setDailyCustomersInput(e.target.value)}
            style={{
              flex: "0 1 68px", padding: "8px 12px", borderRadius: "10px",
              border: "1.5px solid rgba(0,0,0,0.05)", background: "rgba(0,0,0,0.02)",
              fontSize: "14px", fontWeight: 650, fontFamily: FONT_STACK,
              outline: "none", color: "#0f172a",
              transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = PRIMARY; e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(29,53,87,0.06)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.05)"; e.currentTarget.style.background = "rgba(0,0,0,0.02)"; e.currentTarget.style.boxShadow = "none"; }}
          />
          <button
            type="button"
            onClick={() => d.handleAddDailyEntry()}
            disabled={!d.dailySalesInput}
            style={{
              padding: "8px 18px", borderRadius: "10px",
              border: "none",
              background: d.dailySalesInput ? `linear-gradient(135deg, ${PRIMARY} 0%, #457b9d 100%)` : "rgba(0,0,0,0.04)",
              color: d.dailySalesInput ? "#fff" : "rgba(15,23,42,0.2)",
              fontSize: "13px", fontWeight: 700, cursor: d.dailySalesInput ? "pointer" : "default",
              fontFamily: FONT_STACK, whiteSpace: "nowrap" as const,
              boxShadow: d.dailySalesInput ? "0 2px 8px rgba(29,53,87,0.18)" : "none",
              transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {ko ? "기록" : "Save"}
          </button>
        </div>
      )}

      {/* ── 구독제: 플랜별 가입 기록 (사용자가 구독제 활성화 시만) ── */}
      {d.usesSubscriptions && (
        <SubscriptionPlanEntry
          d={d}
          ko={ko}
          fmt={(n: number) => formatWon(n, ko)}
        />
      )}

      {/* ── AI 경영 코칭 — Apple Liquid Glass 스타일 ── */}
      <div style={{
        borderRadius: "24px", overflow: "hidden",
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: `linear-gradient(135deg, ${PRIMARY} 0%, #457b9d 60%, #a8dadc 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(29,53,87,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#fff", fontFamily: FONT_STACK, letterSpacing: "-0.02em" }}>AI</span>
            </div>
            <span style={{
              fontSize: "15px", fontWeight: 700, color: "#0f172a",
              letterSpacing: "-0.025em", fontFamily: FONT_STACK,
            }}>
              {ko ? "AI 경영 코칭" : "AI Coaching"}
            </span>
          </div>
          <div style={{
            fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.3)",
            letterSpacing: "0.02em",
          }}>
            {new Date().toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "short", day: "numeric", weekday: "short" })}
          </div>
        </div>

        {/* AI 브리핑 메시지 */}
        <div style={{ padding: "0 22px 16px" }}>
          <p style={{
            margin: 0, fontSize: "14.5px", fontWeight: 500,
            lineHeight: 1.65, color: "rgba(15,23,42,0.75)",
            fontFamily: FONT_STACK, letterSpacing: "-0.01em",
          }}>{insightText}</p>
        </div>

        {/* AI 코칭 로드 실패 시 간단한 안내 */}
        {!d.aiActions && !d.aiActionsLoading && (
          <div style={{ padding: "0 22px 12px" }}>
            <div style={{
              padding: "10px 14px", borderRadius: "12px",
              background: "rgba(245,158,11,0.04)",
              border: "0.5px solid rgba(245,158,11,0.08)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)" }}>
                {ko ? "AI 코칭을 불러오지 못했습니다" : "AI coaching unavailable"}
              </span>
              <button type="button" onClick={d.fetchAiActions} style={{
                fontSize: "11px", fontWeight: 620, color: "#007aff",
                background: "none", border: "none", cursor: "pointer",
              }}>
                {ko ? "다시 시도" : "Retry"}
              </button>
            </div>
          </div>
        )}

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
                {/* Tag — 미니멀 캡션 */}
                <div style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  color: toneStyles.tagColor,
                  marginBottom: "10px",
                }}>
                  {tag}
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
                    <ArrowRight size={14} strokeWidth={2} />
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
                    <ArrowRight size={14} strokeWidth={2} />
                  </button>
                )}
              </div>

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
                    {moreOpen ? <ChevronUp size={12} strokeWidth={2} /> : <ChevronDown size={12} strokeWidth={2} />}
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
                            e.currentTarget.style.background = "rgba(29,53,87,0.03)";
                            e.currentTarget.style.borderColor = "rgba(29,53,87,0.08)";
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

      {/* ── 4 Hero KPI Cards ── */}
      <div className="morning-kpi-grid" style={gridStyle}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={kpiCardStyle}>
            <div style={kpiLabelStyle}>{kpi.label}</div>
            <div
              className="num-animate"
              style={{
                ...kpiValueStyle,
                color: kpi.color ?? PRIMARY,
              }}
            >
              {kpi.value}
            </div>
            {kpi.change !== null && (
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: changeColor(kpi.change),
                  marginTop: "4px",
                  fontFamily: FONT_STACK,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {changeArrow(kpi.change)}{" "}
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    color: LABEL_COLOR,
                  }}
                >
                  {kpi.changeLabel}
                </span>
              </div>
            )}
            {kpi.change === null && kpi.changeLabel && !kpi.hint && (
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 500,
                  color: LABEL_COLOR,
                  marginTop: "6px",
                  letterSpacing: "0.02em",
                }}
              >
                {kpi.changeLabel}
              </div>
            )}
            {kpi.hint && (
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#FF9F0A",
                  marginTop: "6px",
                  letterSpacing: "0.01em",
                }}
              >
                {kpi.hint}
              </div>
            )}
          </div>
        ))}
      </div>

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
              <Target size={16} color="#059669" strokeWidth={2} />
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

      {/* ── 7일 매출 미니 차트 ── */}
      {(() => {
        const sorted = [...entries]
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-7);
        if (sorted.length < 2) return null;

        const maxSales = Math.max(...sorted.map(e => e.sales), 1);
        const avgSales = sorted.reduce((s, e) => s + e.sales, 0) / sorted.length;
        const dayLabels = ko
          ? ["일", "월", "화", "수", "목", "금", "토"]
          : ["S", "M", "T", "W", "T", "F", "S"];

        return (
          <div style={{
            borderRadius: "20px",
            padding: "18px 20px",
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0,0,0,0.05)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.025)",
          }}>
            {/* 헤더 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase" as const, color: LABEL_COLOR,
              }}>
                {ko ? "최근 7일 매출" : "LAST 7 DAYS"}
              </div>
              <div style={{
                fontSize: "11px", fontWeight: 600, color: "rgba(15,23,42,0.5)",
              }}>
                {ko ? `일평균 ${formatWon(avgSales, ko)}` : `Avg ${formatWon(avgSales, ko)}/day`}
              </div>
            </div>

            {/* 바 차트 */}
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${sorted.length}, 1fr)`,
              gap: "6px",
              alignItems: "end",
              height: "160px",
              position: "relative" as const,
            }}>
              {/* 평균선 */}
              <div style={{
                position: "absolute" as const,
                left: 0, right: 0,
                bottom: `${(avgSales / maxSales) * 100}%`,
                height: "1px",
                background: "rgba(15,23,42,0.08)",
                borderTop: "1px dashed rgba(15,23,42,0.12)",
                zIndex: 1,
              }} />

              {sorted.map((entry, i) => {
                const height = maxSales > 0 ? (entry.sales / maxSales) * 100 : 0;
                const isToday = entry.date === new Date().toISOString().slice(0, 10);
                const isYesterday = i === sorted.length - 1 && !isToday;
                const dayOfWeek = new Date(entry.date).getDay();
                const barColor = isToday
                  ? PRIMARY
                  : entry.sales >= avgSales
                    ? "rgba(52,199,89,0.65)"
                    : "rgba(15,23,42,0.12)";

                return (
                  <div key={entry.date} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    {/* 매출 라벨 (호버 없이 항상 표시 — 마지막 2개만) */}
                    {(isToday || isYesterday) && (
                      <div style={{
                        fontSize: "10px", fontWeight: 600,
                        color: isToday ? PRIMARY : "rgba(15,23,42,0.5)",
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap" as const,
                      }}>
                        {formatWon(entry.sales, ko)}
                      </div>
                    )}

                    {/* 바 */}
                    <div style={{
                      width: "100%",
                      maxWidth: "32px",
                      height: `${Math.max(height, 3)}%`,
                      borderRadius: "6px 6px 4px 4px",
                      background: barColor,
                      transition: "height 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                      position: "relative" as const,
                      ...(isToday ? { boxShadow: `0 2px 8px ${PRIMARY}30` } : {}),
                    }} />

                    {/* 요일 라벨 */}
                    <div style={{
                      fontSize: "10px",
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? PRIMARY : "rgba(15,23,42,0.35)",
                      lineHeight: 1,
                    }}>
                      {dayLabels[dayOfWeek]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

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
  border: "1px solid rgba(0,0,0,0.04)",
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
  background: "linear-gradient(135deg, #1d3557, #457b9d)",
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
  border: "1px solid rgba(0,0,0,0.05)",
  boxShadow:
    "0 1px 3px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.025)",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  minWidth: 0,
};

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
