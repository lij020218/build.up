"use client";

/**
 * Tier 1.5 — 오늘의 코칭 (작업이 1줄로 직결되는 구체적 카드들).
 *
 * 카드 목록 (위→아래) — 2026-07-13 lean 재설계 반영:
 *   (a-1) InventoryOpsCard + TeamCard — 재고·직원 (재무 코어 직하로 승격, 2-up)
 *   (a)   DailyOpsRitualCard       — 오늘의 운영 리추얼 (모든 업종, 홈 유지)
 *   (a-1.5) MenuProfitabilityCard  — 메뉴 원가·마진 (food/cafe·서비스, 홈 유지)
 *   (a-2) FoodSafetyComplianceCard — 식약처 위생점검 (food/cafe-dessert, 홈 유지)
 *   (c-1) PolicyFundMatchCard      — 정책자금 매칭 (self-hide; 매칭 시=곧 받을 돈, 홈 유지)
 *   (c)   StartupHealthSection     — 스타트업 핵심 지표 (startup-tech 만)
 *   ※ 제거: DailyKpiStrip·CoachingHistory(→이번주점검)·PrimeCostCard(손익 중복)·
 *          DailyImprovement/AvgTicketUpsell(히어로·리추얼 중복)
 *
 * 자세한 분기 표 → `DASHBOARD_MAP.md`
 */

import { Children } from "react";
import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
import { DailyOpsRitualCard } from "../DailyOpsRitualCard";
import { FoodSafetyComplianceCard } from "../FoodSafetyComplianceCard";
import { PolicyFundMatchCard } from "../PolicyFundMatchCard";
import { StartupHealthSection } from "../StartupHealthSection";
import { CashZeroDateCard } from "../CashZeroDateCard";
import { FitnessRetentionCard } from "../FitnessRetentionCard";
import { EducationEnrollmentCard } from "../EducationEnrollmentCard";
import { RetailSellThroughCard } from "../RetailSellThroughCard";
import { BeautyBookingNoshowCard } from "../BeautyBookingNoshowCard";
// 2026-05-19 — EcommerceConversionCard / StartupMetricsCard 통합 → ConversionFunnelCard.
//   iOS ConversionFunnelFocusCard 와 동일 패턴 (mode prop 분기, "전환율" 헤더).
//   두 구 카드는 파일 보존 (@deprecated) — 다음 정리 PR 에서 삭제.
import { ConversionFunnelCard } from "../ConversionFunnelCard";
import { PetBookingCard } from "../PetBookingCard";
import { SpaceOccupancyCard } from "../SpaceOccupancyCard";
import { LivingServiceDispatchCard } from "../LivingServiceDispatchCard";
// 2026-05-12 Phase 1a/1c 완료: OfflineFounderBrief 통합 + 파일 삭제.
//   Toast IQ "For you feed" / Amplitude Dashboard Agent / Mercury Insights 등 2026 산업
//   표준 (AI 통합 hero) 정합. 11 업종 임계값 룰엔진은 useIndustryRuleSignal hook 으로 추출 →
//   useMorningBriefingBrain 이 흡수 → resolveHero 우선순위 1.6 으로 CEOMorningHero 에서 자동 노출.
//   22 자료 검증 통과 (NN/G·Carbon·M3·Toast·Amplitude·Square·Mercury·Reforge 등).
// 2026-05-13 Phase 2: IntegrationHubCard 마이페이지 이동(2026-07-12 컴포넌트 삭제) — profile/
//   폴더에 개별 OAuth 카드 모두 존재. 대시보드 hero 영역 셋업 카드 차지 X.
import { MenuProfitabilityCard } from "../MenuProfitabilityCard";
import { SaaSKeyMetricsCard, SubscriptionEnableNudge } from "./Tier3Operations";
import { useProfileStore } from "../../../stores/profile-store";
import { shouldShowCardByIndustry } from "../../../industry-card-matrix";

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

  // 2026-05-12 Phase 2a — 업종 라우터 (industry-card-matrix.ts SSOT).
  //   200+ 자료 (Agent A 37 + B 60 + C 105) 교차 검증 결과를 기반으로 11 업종 ×
  //   카드 매트릭스 적용. 사장님 본업과 무관한 카드는 default 숨김 → 인지 부하 5-9 임계 내.
  //   사장님이 hide() 토글로 명시적으로 *추가* 보고 싶으면 hiddenCards 에 없으면 노출.
  //   → "default 숨김" + "explicit 토글 추가" 합쳐서 결정 (hide 와 industry 양쪽 통과).
  const showByMatrix = (cardId: import("../../../industry-card-matrix").CardId): boolean => {
    if (hide(cardId)) return false;
    return shouldShowCardByIndustry(cardId, d.industryCategoryId as import("../../../industry-card-matrix").IndustryId | undefined);
  };

  // 재고·고객·직원 카드 행 → '오늘의 관리'(TodayManagementSection)로 이동 (2026-07-21
  //   사장님 지시: 요약 타일과 실카드 중복 제거, 실카드를 오늘의 요약 바로 아래로 승격).

  return (
    <>
      {/* 2026-05-12 후속 정리 — OfflineFounderBrief 통합 마이그레이션 완료.
          11 업종 임계값 룰엔진은 useIndustryRuleSignal 로 추출 → useMorningBriefingBrain
          이 흡수 → resolveHero 의 우선순위 1.6 (anomaly 다음) 으로 사용.
          이제 *단일 hero* (CEOMorningHero) 에서 generic anomaly + industry-specific 룰
          + AI top action 모두 처리. Toast IQ·Amplitude·Mercury 2026 산업 표준 정합.
          22 자료 검증 (NN/G·Carbon·M3·Toast·Amplitude·Square·Mercury 등) 통과. */}

      {/* 2026-05-13 Phase 2 결정 — IntegrationHubCard 마이페이지 이동.
          profile/ 폴더에 이미 PortOne·CODEF·TossPlace·Popbill·CSV·SaaS metrics·
          Subscription webhook 개별 OAuth 카드 모두 존재 → 대시보드 hero 영역에서
          *셋업 카드* 차지 필요 X. 사장님 default 숨김 (hide("integration-hub")=true
          가 dashboard-cards-meta 의 default).
          매트릭스 카드 수 -1 → 인지 부하 해소.
          향후 IntegrationHubCard.tsx 자체는 profile 폴더로 이동 또는 삭제 (별도 PR). */}

      {/* ── 리추얼 + 정책자금 — 같은 규격(높이 스트레치) 2열 쌍 (2026-07-21 사장님 지시).
            정책자금이 self-hide(null)면 auto-fit 이 리추얼을 전체 폭으로. ── */}
      <div className="dash-pair">
        {/* 오늘의 운영 리추얼 — 매일 점검 습관 엔진 (사장님: 홈 유지) */}
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
        {/* 정책자금 매칭 — self-hide(매칭 없으면 미노출)라 "떠 있으면 곧 받을 돈" → 홈 유지 */}
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
                // ⚠️ 2026-05-18: salesDeclinePct 는 정책자금 매칭 기준으로 통상 *월간* 감소율.
                //   종전엔 weeklySalesChange (주간) 를 전달해서 한 주만 -20% 이어도 정책자금 위기
                //   분기 통과 → over-match. monthOnMonth (전월 대비) 로 교체.
                salesDeclinePct: (() => {
                  const prev = c.prevMonthSales ?? 0;
                  return prev > 0 && c.totalSales < prev
                    ? Math.round(((prev - c.totalSales) / prev) * 100)
                    : 0;
                })(),
                runwayMonths: c.runwayMonths,
                weeklySalesChangePct: c.weeklySalesChange,
                // ⚠️ businessStage dead branch fix (2026-05-18): 종전엔 < 30 과 < 365 둘 다 "early"
                //   를 반환해서 30~365일 구간이 통째로 early 로 swallow → growth 분기 도달 불가 →
                //   정책자금 매칭 후보가 잘못 좁혀졌음. < 90 early / < 365 growth / < 365*3 established
                //   로 정정.
                businessStage: c.daysSinceLaunch < 90
                  ? "early"
                  : c.daysSinceLaunch < 365
                    ? "growth"
                    : c.daysSinceLaunch < 365 * 3
                      ? "established"
                      : "established",
              }}
            />
          </div>
        )}
      </div>

      {/* 위생점검 대비 — 전체 폭 한 줄 (2026-07-21 사장님 지시). 외식·카페만 내부 가드 */}
      {showByMatrix("food-safety") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <FoodSafetyComplianceCard ko={ko} industryCategoryId={d.industryCategoryId} />
        </div>
      )}

      {/* ── 나머지 코칭 카드 벽돌쌓기 (2026-07-21) — 데스크톱 2열, 높이 제각각인 카드가
            행 정렬로 빈 공간을 만들지 않게 React 가 두 열로 직접 분배(TwoColMasonry).
            CSS multicol 은 Safari 가 전부 첫 열에 몰던 버그로 폐기. 조건부 렌더·stagger
            유지, 내부 null 카드는 .dash-stagger-item:empty 로 제거됨. ── */}
      <TwoColMasonry>

      {/* 코칭 누적 일지 → '이번 주 점검'(Tier2, 접힘)으로 이동 (2026-07-13):
          매일 필수 아닌 회고성이라 팝업 성격의 접힘 섹션으로. lock-in moat 유지. */}

      {/* 1.5 (a-1.5) — 메뉴·서비스 라인업 수익성 (음식·카페·서비스).
          로드맵 menu-design 입력(판매가·원가)을 per-item 원가율·마진으로 표시. 재고(식자재)와
          분리해 "메뉴는 메뉴 카드에" — itemType==="product" 만 읽음. 메뉴 입력 전이면 null 반환. */}
      {showByMatrix("menu-profitability") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <MenuProfitabilityCard ko={ko} industryCategoryId={d.industryCategoryId} />
        </div>
      )}

      {/* 위생점검(food-safety)은 위 전체 폭 줄로 이동 (2026-07-21) */}

      {/* 2026-05-13 Phase 2b — FitnessRetentionCard (피트니스 전용).
          105 자료 (Mindbody·MarianaTek·Glofox·WellnessLiving·FIA Retention) 검증.
          D-7 만료 임박 + 30/60/90일 cohort 잔존율 + 오늘의 행동 1개. */}
      {showByMatrix("fitness-retention") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <FitnessRetentionCard ko={ko} industryCategoryId={d.industryCategoryId} />
        </div>
      )}

      {/* 2026-05-13 Phase 2c — EducationEnrollmentCard (교육 전용).
          17 자료 (학원조아·공선학관·Spider Strategies·Brightwheel) 검증. */}
      {showByMatrix("education-enrollment") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <EducationEnrollmentCard ko={ko} industryCategoryId={d.industryCategoryId} />
        </div>
      )}

      {/* 2026-05-13 Phase 2d — RetailSellThroughCard (소매 전용).
          12 자료 (Lightspeed·Shopify·Square·TruRating·i-boss) 검증. */}
      {showByMatrix("retail-sell-through") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <RetailSellThroughCard ko={ko} industryCategoryId={d.industryCategoryId} />
        </div>
      )}

      {/* 2026-05-13 Phase 2e — BeautyBookingNoshowCard (뷰티 전용). */}
      {showByMatrix("beauty-booking-noshow") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <BeautyBookingNoshowCard ko={ko} industryCategoryId={d.industryCategoryId} />
        </div>
      )}

      {/* 2026-05-19 — 통합 전환율 카드 (이커머스).
          iOS ConversionFunnelFocusCard 와 동일: 헤더 "전환율" + 4단계 funnel + WoW 대비 +
          인라인 수동 입력 (saas_metrics_manual_weekly upsert) + v_saas_metrics_unified read. */}
      {showByMatrix("ecommerce-conversion") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <ConversionFunnelCard mode="commerce" ko={ko} industryCategoryId={d.industryCategoryId} />
        </div>
      )}

      {/* 2026-05-19 — 통합 전환율 카드 (SaaS / startup-tech).
          가입 → 활성화 → 유료 funnel. StartupHealthSection (raw 수치) 와 별도 — 이 카드는
          전환률 본질 지표만 담당. */}
      {c.isStartupCompany && !hide("saas-funnel-conversion") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <ConversionFunnelCard mode="saas" ko={ko} industryCategoryId={d.industryCategoryId} />
        </div>
      )}

      {/* 2026-05-13 Phase 2g — PetBookingCard (펫 전용, booking-store 재사용).
          14 자료 (Gingr·VetPort·DaySmart·Petfolk·플러스벳·펫프렌즈·KPMG) 검증. */}
      {showByMatrix("pet-booking") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <PetBookingCard ko={ko} industryCategoryId={d.industryCategoryId} />
        </div>
      )}

      {/* 2026-05-13 Phase 2h — SpaceOccupancyCard (공간임대 전용, booking-store 재사용).
          15 자료 (OfficeRnD·스페이스클라우드·쏘플·무인연구소·작심·세컨드샐러리) 검증. */}
      {showByMatrix("space-occupancy") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <SpaceOccupancyCard ko={ko} industryCategoryId={d.industryCategoryId} />
        </div>
      )}

      {/* 2026-05-13 Phase 2i — LivingServiceDispatchCard (생활서비스 전용, booking-store 재사용).
          13 자료 (ServiceTitan·Housecall Pro·IBM FTFR·청소연구소·세탁특공대·런드리고) 검증. */}
      {showByMatrix("living-service-dispatch") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <LivingServiceDispatchCard ko={ko} industryCategoryId={d.industryCategoryId} />
        </div>
      )}

      {/* 프라임코스트·개선/업셀 카드 제거 (2026-07-13 lean 재설계):
          · 프라임코스트 = 손익 카드가 이미 식재료·인건비 비율 표시 → 완전 중복.
          · 개선/업셀 = 히어로 "오늘의 한 수" + 리추얼 체크리스트와 "오늘 할 일" 3중 중복.
          "오늘 무엇을" 니즈는 히어로+리추얼이 담당. 원가 상세는 손익 카드로. */}

      {/* 정책자금 매칭은 위 리추얼 쌍(.dash-pair)으로 이동 (2026-07-21) */}

      {/* 2026-06-04: AI 공동창업자 데일리 브리프(StartupFounderBrief) → CEOMorningHero 로 흡수.
          런웨이·burn·default-dead·CMGR·Rule of 40 신호를 computeStartupRule 이 산출해
          brain.industryRule 슬롯으로 주입 → 단일 히어로가 표시(오프라인 OfflineFounderBrief 흡수와 동일 패턴).
          별도 카드 제거 = 중복 신호·coaching history 이중 기록 해소. */}

      {/* 2026-05-12 Phase 2 startup-tech 보강 — CashZeroDate (절대 날짜 + 채용 시뮬).
          30+ 실리콘밸리 2025-2026 자료 (Mercury·Puzzle·Bessemer·ICONIQ·a16z) 합의:
          "런웨이 월수" 추상 → "2027-08-15에 자본 0원" 절대 날짜 = 2026 SV daily KPI #1.
          채용 시뮬레이터로 사장님 채용 의사결정 객관화. */}
      {c.isStartupCompany && showByMatrix("cash-zero-date") && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <CashZeroDateCard ko={ko} />
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
      </TwoColMasonry>
    </>
  );
}

/**
 * 높이 제각각 카드용 2열 벽돌쌓기 — React 가 자식을 두 열 스택에 번갈아 분배.
 * (CSS multicol 은 Safari 가 break-inside 카드를 전부 첫 열에 몰아넣는 버그 → 폐기.)
 * Children.toArray 가 조건부 false/null 자식을 자동 제거. 좁은 화면(dash-2col 1열)에선
 * 왼쪽 스택→오른쪽 스택 순서로 세로 나열된다.
 */
function TwoColMasonry({ children }: { children: React.ReactNode }) {
  const items = Children.toArray(children);
  if (items.length <= 1) return <>{items}</>;
  return (
    <div className="dash-2col" style={{ alignItems: "start" }}>
      <div className="dash-col-stack">{items.filter((_, i) => i % 2 === 0)}</div>
      <div className="dash-col-stack">{items.filter((_, i) => i % 2 === 1)}</div>
    </div>
  );
}

