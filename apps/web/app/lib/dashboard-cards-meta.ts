/**
 * 대시보드 카드 메타데이터 SSOT — 사장님이 카드 표시/숨김을 통제하기 위한 카탈로그.
 *
 *  ── 설계 원칙 ──────────────────────────────────────────────
 *  · `essential: true` 카드는 사용자가 숨길 수 없음 (NSM hero, cashflow, 매출 흐름).
 *  · 그 외는 사장님이 마이페이지 > 대시보드 카드 표시 에서 끄고 켤 수 있음.
 *  · 카드별 자동 분기 (외식만 / 구독만 등) 는 별개 — 여기 메타는 *사용자 선택권* 영역.
 *  · industryHint: 어느 업종에서 의미 있는지 표시 (사장님이 본인 카드 인지 도움).
 *  ────────────────────────────────────────────────────────
 */

export type DashboardCardCategory = "hero" | "daily" | "coaching" | "deepdive";

export type DashboardCardMeta = {
  id: string;
  labelKo: string;
  labelEn: string;
  hintKo: string;
  hintEn: string;
  category: DashboardCardCategory;
  /** true = 사용자가 숨길 수 없는 핵심 카드 */
  essential?: boolean;
  /** 어느 업종에 의미 있는지 — 사장님이 본인과 무관한 카드 안 보게 자동 분기. UI 표시용 힌트도 겸함. */
  industryHint?: "food" | "cafe-dessert" | "startup-tech" | "all" | "subscription";
};

export const DASHBOARD_CARDS: DashboardCardMeta[] = [
  // ─── Hero (사용자 시선 최상단) ────────────────────────────────
  {
    id: "ceo-morning-hero",
    labelKo: "CEO 모닝 (NSM·매출·런웨이)",
    labelEn: "CEO Morning (NSM/sales/runway)",
    hintKo: "사장님이 고른 북극성 1개 숫자 + 14일 sparkline + 우선순위 액션",
    hintEn: "Your North Star + 14d sparkline + priority action",
    category: "hero",
    essential: true,
  },
  {
    id: "ritual-banner",
    labelKo: "경영 리추얼 배너 (주간/월간)",
    labelEn: "Management Ritual Banner",
    hintKo: "월요일 오전 주간 점검 / 월초 월간 리뷰 알림 — 자동 표시",
    hintEn: "Weekly review on Mondays / monthly on early-month — auto",
    category: "hero",
  },
  // ⚠️ business-health-score 카드는 CEOMorningHero 헤더로 통합 흡수됨 (2026-05-11
  //    AI 의회 결정). 별도 토글 X — 모닝 브리핑이 켜져있으면 함께 노출.

  // ─── Daily Hub (매일 의미 있는 상태 카드) ────────────────────
  {
    id: "activity-snapshot",
    labelKo: "매출 흐름 (Activity Snapshot)",
    labelEn: "Activity Snapshot (sales pulse)",
    hintKo: "오늘·이번 주·이번 달 매출 추세를 한눈에",
    hintEn: "Today/week/month sales at a glance",
    category: "daily",
    essential: true,
  },
  {
    id: "user-activity",
    labelKo: "사용자 변화 (User Activity)",
    labelEn: "User Activity",
    hintKo: "신규/재방문 손님 추이. 외식·카페·서비스에 의미 있음",
    hintEn: "New vs returning customers — food/cafe/service",
    category: "daily",
  },
  {
    id: "cashflow-hero",
    labelKo: "현금흐름 + 런웨이 (Cashflow Hero)",
    labelEn: "Cashflow + Runway",
    hintKo: "현재 잔고 / 월 burn / 며칠 남았나",
    hintEn: "Balance / monthly burn / days left",
    category: "daily",
    essential: true,
  },
  {
    id: "pl-hero",
    labelKo: "손익 (P&L Hero)",
    labelEn: "P&L Hero",
    hintKo: "이번 달 매출 - 비용 = 순익",
    hintEn: "This month revenue − cost = profit",
    category: "daily",
  },
  {
    id: "daily-kpi-strip",
    labelKo: "업종별 5칸 KPI Strip",
    labelEn: "Industry-specific 5-cell KPI",
    hintKo: "업종에 맞는 5개 핵심 지표 (외식: 객수·객단가·테이블턴 등)",
    hintEn: "5 industry-tailored KPIs",
    category: "daily",
  },

  // ─── Coaching (오늘 무엇을 할까) ──────────────────────────────
  {
    id: "daily-ops-ritual",
    labelKo: "오늘의 운영 리추얼",
    labelEn: "Today's Operational Ritual",
    hintKo: "업종별 일일 5분 체크리스트 (개시·정산·발주 등)",
    hintEn: "Daily 5-min checklist by industry",
    category: "coaching",
  },
  {
    id: "inventory-ops",
    labelKo: "재고 운영",
    labelEn: "Inventory Ops",
    hintKo: "발주 필요 / 정상 재고 + 공급처 자동 제안. 재고 운영 업종만",
    hintEn: "Reorder needs + supplier auto-suggest",
    category: "coaching",
  },
  {
    id: "team-card",
    labelKo: "팀 / 직원 현황",
    labelEn: "Team / Staff",
    hintKo: "직원 인건비 + 퇴직금 의무 알림 + 보험 가입 상태",
    hintEn: "Payroll + severance alerts + insurance status",
    category: "coaching",
  },
  {
    id: "food-safety",
    labelKo: "식약처 위생점검 대비",
    labelEn: "Food Safety Compliance",
    hintKo: "식약처 위생등급제 22개 항목 빈도별 점검. 외식·카페만",
    hintEn: "22 KFDA hygiene items — food/cafe only",
    category: "coaching",
    industryHint: "food",
  },
  {
    id: "prime-cost",
    labelKo: "Prime Cost (식자재+인건비)",
    labelEn: "Prime Cost (food + labor)",
    hintKo: "외식 1순위 KPI — 매출 대비 55-65% 적정. 외식·카페만",
    hintEn: "#1 restaurant KPI — 55-65% of sales healthy",
    category: "coaching",
    industryHint: "food",
  },
  {
    id: "daily-improvement",
    labelKo: "오늘의 작은 개선 (Bezos Day-1)",
    labelEn: "Today's Small Improvement",
    hintKo: "AI 추천 — 오늘 5분 안에 할 수 있는 1개 개선",
    hintEn: "AI suggested 5-min improvement",
    category: "coaching",
  },
  {
    id: "avg-ticket-upsell",
    labelKo: "객단가 업셀 제안",
    labelEn: "Avg Ticket Upsell",
    hintKo: "메뉴/가격 기반 업셀 제안 (음료 권유·세트 구성 등)",
    hintEn: "Menu-based upsell suggestions",
    category: "coaching",
  },
  {
    id: "policy-fund-match",
    labelKo: "정책자금 자동 매칭",
    labelEn: "Policy Fund Auto-Match",
    hintKo: "사장님 프로필에 맞는 2026 정책자금 + 부채 있으면 대환 시뮬",
    hintEn: "Policy fund auto-match + refinance sim if debt",
    category: "coaching",
  },
  {
    // 2026-05-12 킬러 기능: AI 공동창업자 데일리 브리프 — *해석* 레이어
    id: "startup-founder-brief",
    labelKo: "AI 공동창업자 데일리 브리프 ⭐",
    labelEn: "AI Co-Founder Daily Brief ⭐",
    hintKo: "런웨이·burn·CMGR·Rule of 40 자동 분석 → 가장 중요한 1개 + 오늘 행동",
    hintEn: "Auto runway/burn/CMGR/RoF40 → top signal + today's action",
    category: "coaching",
    industryHint: "startup-tech",
  },
  {
    id: "startup-health",
    labelKo: "스타트업 핵심 지표 (Burn Multiple·Rule of 40)",
    labelEn: "Startup Health (Burn Multiple/Rule of 40)",
    hintKo: "YC식 재무 지표. 기술 스타트업만",
    hintEn: "YC-style metrics — startup-tech only",
    category: "coaching",
    industryHint: "startup-tech",
  },
  {
    id: "saas-key-metrics",
    labelKo: "SaaS 핵심 지표 (MRR/이탈/전환)",
    labelEn: "SaaS Key Metrics",
    hintKo: "구독제 운영 시. 매일 MRR·이탈률·전환률",
    hintEn: "MRR/churn/conversion for subscription business",
    category: "coaching",
    industryHint: "subscription",
  },
];

/** id 로 빠른 조회용 맵 */
export const DASHBOARD_CARDS_BY_ID: Record<string, DashboardCardMeta> = Object.fromEntries(
  DASHBOARD_CARDS.map((c) => [c.id, c]),
);

/** 사장님이 현재 숨김 토글 가능한 카드만 (essential 제외) */
export function getHidableCards(): DashboardCardMeta[] {
  return DASHBOARD_CARDS.filter((c) => !c.essential);
}
