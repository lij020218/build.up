"use client";

/**
 * Tier 1.5 — 오늘의 코칭 (작업이 1줄로 직결되는 구체적 카드들).
 *
 * 카드 목록 (위→아래):
 *   (a)   DailyOpsRitualCard       — 오늘의 운영 리추얼 (모든 업종)
 *   (a-1) InventoryOpsCard + TeamCard — 재고·직원 (좌·우 2-up, 사장님 요청 2026-05-07)
 *   (a-2) FoodSafetyComplianceCard — 식약처 위생점검 (food/cafe-dessert 만)
 *   (a-3) PrimeCostCard            — Prime Cost(식자재+인건비) (food/cafe-dessert 만)
 *   (b)   DailyImprovementCard     — Bezos Day-1 nudge (모든 업종)
 *   (b-2) AvgTicketUpsellCard      — 객단가 업셀 (food/cafe/beauty/retail/fitness/education)
 *   (c-1) PolicyFundMatchCard      — 정책자금 매칭 (런웨이 <6개월 위기 시 elevation)
 *   (c)   StartupHealthSection     — 스타트업 핵심 지표 (startup-tech 만)
 *
 * 자세한 분기 표 → `DASHBOARD_MAP.md`
 */

import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
import { DailyOpsRitualCard } from "../DailyOpsRitualCard";
import { FoodSafetyComplianceCard } from "../FoodSafetyComplianceCard";
import { DailyImprovementCard } from "../DailyImprovementCard";
import { AvgTicketUpsellCard } from "../AvgTicketUpsellCard";
import { PolicyFundMatchCard } from "../PolicyFundMatchCard";
import { StartupHealthSection } from "../StartupHealthSection";
import { StartupFounderBrief } from "../StartupFounderBrief";
// 2026-05-12: OfflineFounderBrief 통합 — Tier 1 CEOMorningHero 가 11 업종 룰엔진 흡수.
//   Toast IQ "For you feed" / Amplitude Dashboard Agent / Mercury Insights 등
//   2026 산업 표준 (AI 통합 hero) 정합. 22 자료 검증 완료.
//   파일 자체는 다음 PR 에서 deprecate (코칭 히스토리 자동 기록은 CEOMorningHero 가 흡수).
// import { OfflineFounderBrief } from "../OfflineFounderBrief";
import { IntegrationHubCard } from "../IntegrationHubCard";
import { CoachingHistoryCard } from "../CoachingHistoryCard";
import { InventoryOpsCard } from "../InventoryOpsCard";
import { TeamCard } from "../TeamCard";
import { PrimeCostCard } from "../PrimeCostCard";
import { SaaSKeyMetricsCard, SubscriptionEnableNudge } from "./Tier3Operations";
import { useProfileStore } from "../../../stores/profile-store";

type Props = {
  d: DashboardHook;
  c: DashboardComputed;
  ko: boolean;
  fmt: (n: number) => string;
  nextStaggerStyle: () => React.CSSProperties;
};

export function Tier1_5Coaching({ d, c, ko, fmt, nextStaggerStyle }: Props) {
  // 사장님 카드 표시 설정 — 마이페이지 > 대시보드 카드 표시 에서 토글.
  //  hiddenCards 카탈로그 → `app/lib/dashboard-cards-meta.ts` SSOT.
  const hiddenCards = useProfileStore((s) => s.hiddenCards);
  const hide = (id: string) => hiddenCards.includes(id);

  // 재고·직원 카드 동적 행 — 표시 대상 카드 갯수에 따라 1-up 또는 2-up.
  // (구독 사용 시엔 재고가 SubscriptionPlanManager 로 대체되므로 Tier 3 에서 처리, 여기엔 Team 만 노출 가능)
  const showInventory = !c.usesSubscriptions && d.businessCtx.showInventoryCard && !hide("inventory-ops");
  const showTeam = !hide("team-card");
  const opsCards: React.ReactNode[] = [];
  if (showInventory) {
    opsCards.push(
      <InventoryOpsCard key="inv" ko={ko} inventory={c.inventory} lowStockItems={c.lowStockItems} d={d} />,
    );
  }
  if (showTeam) {
    opsCards.push(<TeamCard key="team" d={d} c={c} ko={ko} fmt={fmt} />);
  }
  // wide 화면에서 2개일 때만 2-up. 그 외엔 단일 컬럼 (Tier 1.5 의 기본 리듬 유지).
  const opsCols = c.isWide && opsCards.length === 2 ? 2 : 1;

  return (
    <>
      {/* 2026-05-12 후속 정리 — OfflineFounderBrief 통합 마이그레이션 완료.
          11 업종 임계값 룰엔진은 useIndustryRuleSignal 로 추출 → useMorningBriefingBrain
          이 흡수 → resolveHero 의 우선순위 1.6 (anomaly 다음) 으로 사용.
          이제 *단일 hero* (CEOMorningHero) 에서 generic anomaly + industry-specific 룰
          + AI top action 모두 처리. Toast IQ·Amplitude·Mercury 2026 산업 표준 정합.
          22 자료 검증 (NN/G·Carbon·M3·Toast·Amplitude·Square·Mercury 등) 통과. */}

      {/* 2026-05-12 데이터 입력 마찰 0 — 자동 연동 허브
          사장님 수기 입력 의존도가 가장 큰 약점 (캐시노트 카드사 자동연동 우위).
          업종별 (네이버 커머스/예약, GA4, Stripe, 카드사, POS) 채널 카탈로그 노출 →
          1-click 연동 (v1 placeholder, v2 OAuth). FounderBrief 의 "data not ready"
          신호가 켜졌을 때 바로 다음 카드에서 *해결 경로* 를 보여줌. */}
      {!hide("integration-hub") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <IntegrationHubCard ko={ko} />
        </div>
      )}

      {/* 2026-05-12 사장님 lock-in moat — 코칭 누적 일지 (14일).
          매일 FounderBrief 가 노출될 때 hero signal 이 자동 기록됨 (useEffect →
          recordSignal). 사장님이 떠나면 1년치 코칭 일지 잃음 → 전환비용 발생.
          캐시노트가 같은 기능 출시해도 누적된 history 는 못 따라옴.
          v1: localStorage / v2: Supabase `coaching_history` 테이블 + RLS. */}
      {!hide("coaching-history") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <CoachingHistoryCard ko={ko} />
        </div>
      )}

      {/* 1.5 (a) — 오늘의 운영 리추얼 (시기·신호 기반 조건부 항목 포함) */}
      {!hide("daily-ops-ritual") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <DailyOpsRitualCard
            ko={ko}
            industryCategoryId={d.industryCategoryId}
            selectedIndustryId={d.selectedIndustryId}
            startupType={d.startupType}
            condition={{
              daysSinceLaunch: c.daysSinceLaunch,
              weeklySalesChangePct: c.weeklySalesChange,
              isStartup: d.industryCategoryId === "startup-tech",
            }}
          />
        </div>
      )}

      {/* 1.5 (a-1) — 재고 + 직원 운영 카드 (사장님 요청으로 상단 이동) */}
      {opsCards.length > 0 && (
        <div
          className="dash-stagger-item"
          style={{
            ...nextStaggerStyle(),
            display: "grid",
            gridTemplateColumns: `repeat(${opsCols}, minmax(0, 1fr))`,
            gap: "14px",
            alignItems: "stretch",
          }}
        >
          {opsCards}
        </div>
      )}

      {/* 1.5 (a-2) — 식약처 위생점검 (외식·카페만 내부 가드) */}
      {!hide("food-safety") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <FoodSafetyComplianceCard ko={ko} industryCategoryId={d.industryCategoryId} />
        </div>
      )}

      {/* 1.5 (a-3) — Prime Cost (외식·카페만 내부 가드, 2026-05-11 추가)
          글로벌 베스트 프랙티스(Sage·NetSuite·Toast·ChowNow) — 외식 1순위 KPI */}
      {!hide("prime-cost") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <PrimeCostCard
            ko={ko}
            industryCategoryId={d.industryCategoryId}
            subIndustryId={(d.businessCtx as Record<string, unknown>)?.subIndustryId as string | undefined}
            ingredientPurchases={c.monthlyCosts.ingredients ?? 0}
            laborBaseWages={c.monthlyCosts.labor ?? 0}
            hasEmployees={c.employees.length > 0}
            totalRevenue={c.totalSales}
            days={c.workingDays}
          />
        </div>
      )}

      {/* 1.5 (b) — 오늘의 작은 개선 */}
      {!hide("daily-improvement") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <DailyImprovementCard ko={ko} industryCategoryId={d.industryCategoryId} />
        </div>
      )}

      {/* 1.5 (b-2) — 객단가 업셀 제안 */}
      {!hide("avg-ticket-upsell") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <AvgTicketUpsellCard
            ko={ko}
            industryCategoryId={d.industryCategoryId}
            currentAvgTicket={c.totalCustomers > 0 ? c.totalSales / c.totalCustomers : null}
            menuItems={normalizeMenuItems(d)}
          />
        </div>
      )}

      {/* 1.5 (c-1) — 정책자금 매칭 (평상시·위기 통합 노출. 2026-05 Tier 4 → 1.5 승격) */}
      {!hide("policy-fund-match") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <PolicyFundMatchCard
            ko={ko}
            isCrisis={c.cashflowCriticalElevation}
            currentMonthlyInterest={c.monthlyCosts.interest}
            // MatchCriteria SSOT 사용 — 펀딩 페이지(GuidesView) 와 *동일* 입력 shape.
            // 같은 사용자에게 두 카드가 동일 매칭 결과 보장.
            input={{
              industryCategoryId: d.industryCategoryId,
              businessYears: Math.floor(c.daysSinceLaunch / 365.25),
              startupType: (d as { startupType?: string }).startupType,
              monthlyAvgRevenue: c.totalSales > 0 ? Math.round(c.totalSales) : undefined,
              hasUserSales: c.allEntries.length > 0,
              employeesCount: c.employees.length,
              salesDeclinePct: c.weeklySalesChange < 0 ? Math.abs(c.weeklySalesChange) : 0,
              runwayMonths: c.runwayMonths,
              weeklySalesChangePct: c.weeklySalesChange,
              businessStage: c.daysSinceLaunch < 30
                ? "early"
                : c.daysSinceLaunch < 365
                  ? "early"
                  : c.daysSinceLaunch < 365 * 3
                    ? "growth"
                    : "established",
            }}
          />
        </div>
      )}

      {/* 2026-05-12 킬러 기능 — AI 공동창업자 데일리 브리프 (startup-tech 만)
          사장님 비판적 질문 "매출+사용자 수만으로 우리 제품 쓸까?" → 해석 레이어 신설.
          런웨이·burn·CMGR·Rule of 40 자동 분석 → 5 신호 룰엔진 → 가장 중요한 1개 + 행동.
          StartupHealthSection 의 raw 숫자 *위에* 위치 — 사장님이 먼저 *무엇이 중요한지* 봄. */}
      {c.isStartupCompany && !hide("startup-founder-brief") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <StartupFounderBrief ko={ko} />
        </div>
      )}

      {/* 1.5 (c) — 스타트업 전용 핵심 지표 (startup-tech 만 내부 가드) */}
      {!hide("startup-health") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <StartupHealthSection ko={ko} />
        </div>
      )}

      {/* 1.5 (c-3) — SaaS 핵심 지표 / 구독제 활성화 안내 (2026-05 Tier 3 → 1.5 승격, startup-tech 한정)
          CBInsights 스타트업 실패 #2 원인이 PMF 부족(43%). MRR·이탈률·전환은 PMF 건강도의 데일리 시그널 — Tier 3 접힘에 묻혀선 안 됨 */}
      {c.isStartupCompany && c.usesSubscriptions && !hide("saas-key-metrics") && (
        <SaaSKeyMetricsCard d={d} c={c} ko={ko} fmt={fmt} nextStaggerStyle={nextStaggerStyle} />
      )}
      {c.isStartupCompany && !c.usesSubscriptions && !hide("saas-key-metrics") && (
        <SubscriptionEnableNudge ko={ko} onEnable={() => d.setUsesSubscriptions(true)} nextStaggerStyle={nextStaggerStyle} />
      )}
    </>
  );
}

// ─── helpers ───────────────────────────────────────────────────────

type LooseItem = {
  id: string;
  name: string;
  price?: number;
  cost?: number;
  monthlySold?: number;
  category?: string;
};

function normalizeMenuItems(d: DashboardHook) {
  const products = (d.products as LooseItem[] | undefined) ?? [];
  const unified = (d.unifiedProducts as LooseItem[] | undefined) ?? [];
  const services =
    (d as { serviceMenuItems?: LooseItem[] }).serviceMenuItems ?? [];
  return ([...products, ...unified, ...services] as LooseItem[])
    .filter((m): m is LooseItem & { price: number } => !!m && m.price != null && m.price > 0)
    .map((m) => ({
      id: m.id,
      name: m.name,
      price: m.price,
      cost: m.cost,
      monthlySold: m.monthlySold,
      category: m.category,
    }));
}
