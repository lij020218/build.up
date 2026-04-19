/**
 * Agent 트리거 감지 엔진 (순수 함수).
 *
 * 설계 원칙:
 * - No side effects (스토어 직접 접근 X, 파라미터로 모든 데이터 주입)
 * - No API calls (감지는 로컬만, AI는 제안 생성 후 별도 호출)
 * - 쿨다운 로직은 caller(useAgentOrchestration)에서 처리
 * - 데이터 부족 시 null 반환 (조용히 스킵)
 */

import type { DailyEntry } from "../stores/finance-store";
import type { InventoryItem } from "../stores/operations-store";
import type { AgentKind, AgentProposal } from "../stores/agents-store";
import { isKindOnCooldown } from "../stores/agents-store";

export type TriggerInput = {
  industryCategoryId: string;
  dailyEntries: DailyEntry[];
  inventory: InventoryItem[];
  existingProposals: AgentProposal[];
  businessLaunched: boolean;
  now?: Date;
};

export type TriggerCandidate = {
  kind: AgentKind;
  trigger: AgentProposal["trigger"];
  /** AI 호출 필요 여부 (true면 제안 추가 후 백그라운드 fetch) */
  requiresAi: boolean;
  /** 로컬 템플릿 기반 prefilled data (AI가 덮어쓸 수 있음) */
  prefilledContent: Partial<
    Pick<AgentProposal["content"], "kind">
  > &
    Record<string, unknown>;
  expectedImpact?: AgentProposal["expectedImpact"];
};

// ─── Helpers ───

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function averageSales(entries: DailyEntry[], windowDays: number): number {
  if (entries.length === 0) return 0;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-windowDays);
  if (recent.length === 0) return 0;
  return recent.reduce((s, e) => s + e.sales, 0) / recent.length;
}

// ─── 1. Coupon Agent ───

/**
 * 쿠폰 발급 기회 감지.
 *
 * 트리거 조건 (OR):
 * - A: 최근 7일 평균 매출이 직전 7일 평균 대비 15% 이상 하락
 * - B: 최근 7일 고객 수가 직전 7일 대비 20% 이상 하락
 *
 * 필수 조건:
 * - dailyEntries >= 14일
 * - businessLaunched = true
 * - 24h 내 동일 kind pending 없음 (쿨다운)
 */
export function detectCouponOpportunity(input: TriggerInput): TriggerCandidate | null {
  const { dailyEntries, existingProposals, businessLaunched, now = new Date() } = input;

  if (!businessLaunched) return null;
  if (dailyEntries.length < 14) return null;
  if (isKindOnCooldown(existingProposals, "coupon", now)) return null;

  const sorted = [...dailyEntries].sort((a, b) => a.date.localeCompare(b.date));
  const last7 = sorted.slice(-7);
  const prev7 = sorted.slice(-14, -7);
  if (last7.length < 5 || prev7.length < 5) return null;

  const recentAvg = last7.reduce((s, e) => s + e.sales, 0) / last7.length;
  const previousAvg = prev7.reduce((s, e) => s + e.sales, 0) / prev7.length;
  if (previousAvg <= 0) return null;

  const salesDropPct = ((previousAvg - recentAvg) / previousAvg) * 100;

  const recentCustomers = last7.reduce((s, e) => s + e.customers, 0) / last7.length;
  const previousCustomers = prev7.reduce((s, e) => s + e.customers, 0) / prev7.length;
  const customerDropPct = previousCustomers > 0 ? ((previousCustomers - recentCustomers) / previousCustomers) * 100 : 0;

  if (salesDropPct < 15 && customerDropPct < 20) return null;

  // 하락 원인에 따라 문구 다르게
  const primaryCause = salesDropPct >= 15 ? "sales" : "customers";
  const dropValue = primaryCause === "sales" ? salesDropPct : customerDropPct;

  return {
    kind: "coupon",
    requiresAi: true,                    // 카피 생성 AI
    trigger: {
      type: primaryCause === "sales" ? "sales-drop" : "customer-drop",
      reasonKo:
        primaryCause === "sales"
          ? `지난 주 매출이 이전 주 대비 ${Math.round(dropValue)}% 줄었어요.`
          : `지난 주 고객 수가 이전 주 대비 ${Math.round(dropValue)}% 줄었어요.`,
      reasonEn:
        primaryCause === "sales"
          ? `Sales dropped ${Math.round(dropValue)}% vs previous week.`
          : `Customer count dropped ${Math.round(dropValue)}% vs previous week.`,
      metric: {
        salesDropPct: Math.round(salesDropPct * 10) / 10,
        customerDropPct: Math.round(customerDropPct * 10) / 10,
        recentAvgSales: Math.round(recentAvg),
        previousAvgSales: Math.round(previousAvg),
      },
    },
    prefilledContent: {
      kind: "coupon",
      couponCode: `SAVE${Math.floor(Math.random() * 90 + 10)}`,   // SAVE10~SAVE99
      discountType: "percent" as const,
      discountValue: 20,
      suggestedUsageLimit: 100,
      validDays: 7,
    },
    expectedImpact: {
      metric: "sales",
      valueKo: `매출 +${Math.round(recentAvg * 7 * 0.15 / 10000)}~${Math.round(recentAvg * 7 * 0.3 / 10000)}만원 회복 예상`,
      valueEn: `Expect +₩${Math.round(recentAvg * 7 * 0.15 / 10000) * 10000}~${Math.round(recentAvg * 7 * 0.3 / 10000) * 10000} recovery`,
    },
  };
}

// ─── 2. Reorder Agent ───

/**
 * 재주문 긴급도 감지.
 *
 * 트리거 조건 (각 재고 항목별):
 * - 현재 수량 / 일 사용량 <= 리드타임 + 1일 (버퍼)
 * - OR 수량 <= minThreshold * 1.1
 *
 * 여러 아이템이 동시 감지되면 가장 급한 것 1개만 제안.
 */
export function detectReorderUrgency(input: TriggerInput): TriggerCandidate | null {
  const { inventory, existingProposals, now = new Date() } = input;

  if (inventory.length === 0) return null;
  if (isKindOnCooldown(existingProposals, "reorder", now)) return null;

  type UrgencyItem = { item: InventoryItem; daysLeft: number; urgencyScore: number };

  const urgent: UrgencyItem[] = [];
  for (const item of inventory) {
    if (item.dailyUsage <= 0 || item.leadTimeDays <= 0) continue;

    const daysLeft = item.quantity / item.dailyUsage;
    const threshold = item.leadTimeDays + 1;

    const isLowByFormula = daysLeft <= threshold;
    const isLowByMin = item.minThreshold > 0 && item.quantity <= item.minThreshold * 1.1;

    if (!isLowByFormula && !isLowByMin) continue;

    // 이미 이 아이템으로 제안된 것 중복 방지
    const existingForItem = existingProposals.find(
      (p) =>
        p.kind === "reorder" &&
        p.status === "pending" &&
        p.content.kind === "reorder" &&
        p.content.itemId === item.id &&
        new Date(p.expiresAt) > now
    );
    if (existingForItem) continue;

    // 급한 정도 (작을수록 급함)
    urgent.push({ item, daysLeft, urgencyScore: daysLeft });
  }

  if (urgent.length === 0) return null;

  // 가장 급한 것
  urgent.sort((a, b) => a.urgencyScore - b.urgencyScore);
  const { item, daysLeft } = urgent[0];

  // 추천 수량 = 2주치 소비량 (최소 minThreshold 기준)
  const recommendedQty = Math.max(
    Math.ceil(item.dailyUsage * 14),
    Math.ceil((item.minThreshold || item.dailyUsage * 7) * 2)
  );

  return {
    kind: "reorder",
    requiresAi: false,                   // 로컬 템플릿 사용
    trigger: {
      type: "stock-low",
      reasonKo: `${item.name} 재고가 ${Math.floor(daysLeft)}일 후 소진 예상이에요.`,
      reasonEn: `${item.name} stock will run out in ${Math.floor(daysLeft)} days.`,
      metric: {
        daysLeft: Math.floor(daysLeft),
        currentQuantity: item.quantity,
        dailyUsage: item.dailyUsage,
        leadTimeDays: item.leadTimeDays,
      },
    },
    prefilledContent: {
      kind: "reorder",
      itemId: item.id,
      itemName: item.name,
      currentQuantity: item.quantity,
      recommendedQuantity: recommendedQty,
      daysUntilStockout: Math.floor(daysLeft),
      supplierName: item.supplierName || "",
      supplierUrl: item.supplierUrl || undefined,
    },
    expectedImpact: {
      metric: "stock",
      valueKo: `결품 방지, 매출 손실 예방`,
      valueEn: `Prevent stockout & lost sales`,
    },
  };
}

// ─── 3. Content Agent ───

/**
 * 콘텐츠 기회 감지.
 *
 * 트리거 조건 (OR, 우선순위 순):
 * - A: 어제 매출이 지난 14일 최고 기록 갱신 (신기록)
 * - B: 지난 주말 (금+토+일) 매출이 이전 주말 대비 30%+ 증가
 * - C: 오픈 N주년 (businessLaunchedDate 기준, 7일 이내) — caller가 별도 감지
 */
export function detectContentOpportunity(input: TriggerInput): TriggerCandidate | null {
  const { dailyEntries, existingProposals, businessLaunched, now = new Date() } = input;

  if (!businessLaunched) return null;
  if (dailyEntries.length < 14) return null;
  if (isKindOnCooldown(existingProposals, "content", now)) return null;

  const sorted = [...dailyEntries].sort((a, b) => a.date.localeCompare(b.date));
  const yesterday = sorted[sorted.length - 1];
  const last14 = sorted.slice(-14);

  // A: 신기록
  const maxBefore = Math.max(...last14.slice(0, -1).map((e) => e.sales));
  if (yesterday.sales > maxBefore && yesterday.sales > 0) {
    return {
      kind: "content",
      requiresAi: true,
      trigger: {
        type: "sales-record",
        reasonKo: `어제 일매출 신기록 달성! (${Math.round(yesterday.sales / 10000).toLocaleString()}만원)`,
        reasonEn: `Yesterday hit a sales record! (₩${Math.round(yesterday.sales / 10000).toLocaleString()}×10k)`,
        metric: {
          yesterdaySales: yesterday.sales,
          previousMax: maxBefore,
        },
      },
      prefilledContent: {
        kind: "content",
        occasion: "sales-record",
        format: "post" as const,
      },
      expectedImpact: {
        metric: "awareness",
        valueKo: "팔로워 참여 +20~40%, 신규 방문 유도",
        valueEn: "Engagement +20-40%, drive new visits",
      },
    };
  }

  // B: 주말 호황 감지 (오늘이 월요일이고, 이전 주말이 지난 주말 대비 30%+)
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 1) {
    const lastWeekendDates = [
      toIso(new Date(now.getTime() - 1 * 86400000)), // Sun
      toIso(new Date(now.getTime() - 2 * 86400000)), // Sat
      toIso(new Date(now.getTime() - 3 * 86400000)), // Fri
    ];
    const prevWeekendDates = lastWeekendDates.map((_, i) =>
      toIso(new Date(now.getTime() - (i + 1 + 7) * 86400000))
    );

    const lastWeekendSales = lastWeekendDates
      .map((d) => dailyEntries.find((e) => e.date === d)?.sales ?? 0)
      .reduce((s, v) => s + v, 0);
    const prevWeekendSales = prevWeekendDates
      .map((d) => dailyEntries.find((e) => e.date === d)?.sales ?? 0)
      .reduce((s, v) => s + v, 0);

    if (prevWeekendSales > 0) {
      const growth = ((lastWeekendSales - prevWeekendSales) / prevWeekendSales) * 100;
      if (growth >= 30) {
        return {
          kind: "content",
          requiresAi: true,
          trigger: {
            type: "weekend-boost",
            reasonKo: `지난 주말 매출 +${Math.round(growth)}% 호황!`,
            reasonEn: `Last weekend sales up ${Math.round(growth)}%!`,
            metric: { growthPct: Math.round(growth), lastWeekendSales, prevWeekendSales },
          },
          prefilledContent: {
            kind: "content",
            occasion: "weekend-boost",
            format: "post" as const,
          },
          expectedImpact: {
            metric: "awareness",
            valueKo: "다음 주말 방문 +10~20%",
            valueEn: "Next weekend visits +10-20%",
          },
        };
      }
    }
  }

  return null;
}

// ─── 4. Review Agent ───

/**
 * 리뷰 요청 기회 감지.
 *
 * 트리거 조건:
 * - 어제 매출이 있었고 (customers >= 3명)
 * - 평균 객단가가 >=10,000원 (의미 있는 거래만)
 * - 주 1회 이하 (쿨다운 168h = 7일)
 */
export function detectReviewOpportunity(input: TriggerInput): TriggerCandidate | null {
  const { dailyEntries, existingProposals, businessLaunched, now = new Date() } = input;

  if (!businessLaunched) return null;
  if (isKindOnCooldown(existingProposals, "review", now)) return null;

  const sorted = [...dailyEntries].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return null;
  const yesterday = sorted[sorted.length - 1];
  if (!yesterday || yesterday.customers < 3) return null;

  const avgTicket = yesterday.sales / yesterday.customers;
  if (avgTicket < 10000) return null;

  return {
    kind: "review",
    requiresAi: false,
    trigger: {
      type: "review-timing",
      reasonKo: `어제 고객 ${yesterday.customers}명 방문. 리뷰 요청 타이밍이에요.`,
      reasonEn: `Yesterday had ${yesterday.customers} visits. Perfect time for review requests.`,
      metric: {
        customers: yesterday.customers,
        avgTicket: Math.round(avgTicket),
      },
    },
    prefilledContent: {
      kind: "review",
      estimatedCardVisitors: yesterday.customers,
      reviewPlatform: "naver-place" as const,
    },
    expectedImpact: {
      metric: "reviews",
      valueKo: "리뷰 1~2건 확보, 노출 +5~15%",
      valueEn: "Get 1-2 reviews, +5-15% visibility",
    },
  };
}

// ─── Orchestrator ───

/**
 * 모든 트리거 감지를 한 번에 실행.
 * 우선순위: Reorder (시급) > Coupon > Review > Content
 */
export function detectAllTriggers(input: TriggerInput): TriggerCandidate[] {
  const candidates: TriggerCandidate[] = [];

  const reorder = detectReorderUrgency(input);
  if (reorder) candidates.push(reorder);

  const coupon = detectCouponOpportunity(input);
  if (coupon) candidates.push(coupon);

  const review = detectReviewOpportunity(input);
  if (review) candidates.push(review);

  const content = detectContentOpportunity(input);
  if (content) candidates.push(content);

  return candidates;
}
