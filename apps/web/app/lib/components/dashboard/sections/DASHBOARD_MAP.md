# 운영 대시보드 카드 → 파일 매핑

**사용법**: 사용자가 "X단계 카드" 또는 "Y 카드" 라고 하면 이 표 보고 즉시 정확한 파일로.

## 📁 폴더 구조

```
dashboard/
├── OperationalDashboard.tsx       # Orchestrator ~302줄 (모든 tier 호출 + 모달만)
├── sections/
│   ├── DASHBOARD_MAP.md           # 이 문서
│   ├── Tier0Header.tsx            # 상호명 + 리추얼 배너
│   ├── Tier1Hero.tsx              # CEOMorning + Nudge + Alert
│   ├── Tier1DailyHub.tsx          # 매출/사용자/현금/손익/KPI Strip
│   ├── Tier1_5Coaching.tsx        # 6 카드: 운영리추얼·위생·개선·업셀·정책자금·StartupHealth
│   ├── Tier2WeeklyPulse.tsx       # 13주 forecast + 생존지표·비용도넛·벤치마크 등
│   ├── Tier3Operations.tsx        # 구독·재고·고객·팀·인기상품·최근활동
│   ├── Tier4GrowthTools.tsx       # WhatIf·시간·마일스톤·인터뷰·4대보험·정책자금
│   └── Tier5ForecastTools.tsx     # 예측·플레이북·내보내기
├── CustomerSummaryCard.tsx        # 고객/회원 관리 (Tier 3 에서 사용)
├── SubscriptionPlanManager.tsx    # 구독 플랜 (Tier 3 에서 사용)
└── (그 외 60+ 카드 컴포넌트들)

hooks/
└── useDashboardComputed.tsx       # 모든 계산값 단일 소스 (totalSales, runwayMonths 등)
```

✅ 모든 tier 분리 완료. OperationalDashboard.tsx 는 thin orchestrator (302줄).

## Tier 0 — 헤더·인트로

| 위치 | 카드 / 영역 | 파일 |
|---|---|---|
| 헤더 | 상호명 + 운영 상태 + 부팅 인트로 | `Tier0Header.tsx` |
| 0단계 | 경영 리추얼 배너 (주간/월간) | `Tier0Header.tsx` |

## Tier 1 — Hero (즉시 노출)

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| Hero | CEO Morning Hero (거장 리서치) | `Tier1Hero.tsx` | 모두 |
| Hero | 미사용 기능 안내 (FeatureNudge) | `Tier1Hero.tsx` | 모두 |
| Hero | 긴급 Alert Strip | `Tier1Hero.tsx` | alert 있을 때만 |

## Tier 1.1–1.2 — 데일리 허브

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| 1.1 | 매출 흐름 (ActivitySnapshot) | `Tier1DailyHub.tsx` | 모두 |
| 1.1 | 사용자 변화 (UserActivity) | `Tier1DailyHub.tsx` | 모두 |
| 1.2 | 현금흐름 + 런웨이 (CashflowHero) | `Tier1DailyHub.tsx` | 모두 |
| 1.2 | 손익 (PLHero) | `Tier1DailyHub.tsx` | 모두 |
| 1.2 | 업종별 5칸 KPI Strip (DailyKpi) | `Tier1DailyHub.tsx` | 모두 (cell 자동 분기) |

## Tier 1.5 — 코칭 (오늘 무엇을 하나)

> **분기 표준 (Phase 2a 추가)**: `industry-card-matrix.ts` SSOT — `showByMatrix(cardId)`
> 가 hide() + shouldShowCardByIndustry() 합쳐 결정. 200+ 자료 검증.

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| 1.5 (top) | **자동 데이터 연동 허브** (IntegrationHub) | `Tier1_5Coaching.tsx` | universal — 사장님 hide 가능 (2026-05-12 추가). 향후 마이페이지로 이동 검토 |
| 1.5 (top) | **코칭 누적 일지 14일** (CoachingHistory) | `Tier1_5Coaching.tsx` | universal — Supabase mirror + 30일 메타 인사이트 (Phase 1a) |
| 1.5 (a) | 오늘의 운영 리추얼 (DailyOpsRitual) | `Tier1_5Coaching.tsx` | universal |
| 1.5 (a-1) | **재고 운영 + 팀 현황** (InventoryOps + Team) | `Tier1_5Coaching.tsx` | 업종 matrix: 재고=식당·카페·소매·이커머스·펫·공간 / 팀=대부분 업종. wide=2-up · narrow=stacked |
| 1.5 (a-2) | **식약처 위생점검 대비** (FoodSafety) | `Tier1_5Coaching.tsx` | food / cafe-dessert 만 (showByMatrix) |
| 1.5 (a-3) | **Prime Cost (식자재+인건비)** | `Tier1_5Coaching.tsx` | food / cafe-dessert 만 (showByMatrix). 외식 글로벌 1순위 KPI (Sage·NetSuite·Toast) |
| 1.5 (b/b-2) | **DailyImprovement vs AvgTicketUpsell** (매출 추세 분기) | `Tier1_5Coaching.tsx` | 동시 노출 X. WoW -5%~+5% (정체) → AvgTicketUpsell. 그 외 → DailyImprovement. (2026-05-12 추가) |
| 1.5 (c-1) | **정책자금 자동 매칭** | `Tier1_5Coaching.tsx` | universal. 위기 시 isCrisis=true 톤 변경 |
| 1.5 (s-1) | **Cash Zero Date + 채용 시뮬레이터 ⭐** | `Tier1_5Coaching.tsx` | startup-tech 만. 실리콘밸리 2026 daily KPI #1 (Mercury·Puzzle·Bessemer) |
| 1.5 (c) | **AI 공동창업자 데일리 브리프 ⭐** (StartupFounderBrief) | `Tier1_5Coaching.tsx` | startup-tech 만. 런웨이·burn·CMGR·Rule of 40 5-신호 룰엔진 |
| 1.5 (c-2) | 스타트업 전용 핵심 지표 (StartupHealth + ARR/FTE 셀) | `Tier1_5Coaching.tsx` | startup-tech 만. 2026-05-12 ARR/FTE (SaaStr "$500K=새 $200K") 6번째 셀 흡수 |
| 1.5 (c-3) | **SaaS 핵심 지표 / 구독제 활성화** | `Tier1_5Coaching.tsx` | startup-tech 한정. CBInsights PMF 43% 갭 |
| ~~1.5~~ | ~~OfflineFounderBrief~~ → **CEOMorningHero 통합** (2026-05-12 Phase 1a, Toast IQ·Amplitude·Mercury 통합 패턴) |  |  |

## Tier 2 — 이번 주 점검 (DeepDive)

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| 2 | **13주 자금 흐름 예측 (Cashflow13Week)** | `Tier2WeeklyPulse.tsx` | 모두 (미설정 시 nudge) |
| 2 | 생존 보드 (SurvivalBoard) | `Tier2WeeklyPulse.tsx` | 모두 |
| 2 | 비용 도넛 (CostCompositionDonut) | `Tier2WeeklyPulse.tsx` | 모두 |
| 2 | 동종업 벤치마크 (SocialBenchmark) | `Tier2WeeklyPulse.tsx` | 모두 |
| 2 | 매출 분해 (SalesBreakdown) | `Tier2WeeklyPulse.tsx` | entries ≥ 2 |
| 2 | 월간 진행 (MonthlyProgress) | `Tier2WeeklyPulse.tsx` | entries ≥ 2 |
| 2 | 비용 구조 (CostStructure) | `Tier2WeeklyPulse.tsx` | startup·online 외 |
| 2 | 벤치마크 (BenchmarkCard) | `Tier2WeeklyPulse.tsx` | entries ≥ 1 |

## Tier 3 — 운영 관리 (DeepDive, 월/주 단위)

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| ~~3~~ | ~~구독제 활성화 안내~~ → **Tier 1.5 (c-3)** 로 승격 (2026-05-11, startup-tech 한정) |  |  |
| 3 | SaaS 핵심 지표 (MRR/신규/전환/이탈) | `Tier3Operations.tsx` | **비-startup** 구독 사용자 (뷰티 멤버십 등) 만. startup-tech 는 Tier 1.5 (c-3) |
| 3 | 구독 플랜 매니저 + Webhook | `Tier3Operations.tsx` | usesSubscriptions |
| 3 | 고객 요약 (CustomerSummary) | `Tier3Operations.tsx` | businessCtx.showCustomerCard |
| 3 | 인기 상품 / 최근 활동 | `Tier3Operations.tsx` | inventoryMode != minimal |
| ~~3~~ | ~~재고 운영 (InventoryOps)~~ → **Tier 1.5 (a-1)** 로 이동 (2026-05-07) |  |  |
| ~~3~~ | ~~팀 현황 (Team)~~ → **Tier 1.5 (a-1)** 로 이동 (2026-05-07) |  |  |

## Tier 4 — 성장 도구 (DeepDive, 접이식)

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| 4 | What-If 시뮬레이터 | `Tier4GrowthTools.tsx` | 매출/비용 있을 때 |
| 4 | 주간 시간 리포트 (WeeklyTime) | `Tier4GrowthTools.tsx` | 모두 |
| 4 | 마일스톤 진행 (ProgressMilestones) | `Tier4GrowthTools.tsx` | 모두 |
| 4 | 고객 인터뷰 (CustomerInterview) | `Tier4GrowthTools.tsx` | 모두 |
| 4 | **4대보험 시뮬레이터 (Insurance)** | `Tier4GrowthTools.tsx` | 직원 ≥1 또는 인건비 입력 |
| ~~4~~ | ~~정책자금 매칭 (평상시)~~ → **Tier 1.5 (c-1)** 로 승격 (2026-05-11, Tier 4 접힘으로 발견율 낮음) |  |  |
| 4 | 주간 리포트 (Weekly) | `Tier4GrowthTools.tsx` | streak ≥7 |

## Tier 5 — 예측·플레이북·내보내기 (DeepDive)

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| 5 | 매출 예측 (Forecast) | `Tier5ForecastTools.tsx` | entries ≥ 3 |
| 5 | 첫 100명 플레이북 (FirstCustomers) | `Tier5ForecastTools.tsx` | 개업 ≤90일 또는 미개업 |
| 5 | 데이터 내보내기 (ExportPanel) | `Tier5ForecastTools.tsx` | 매출/재고/직원 있을 때 |

## Admin / 모달

| 위치 | 영역 | 파일 |
|---|---|---|
| 하단 | 세부 관리 (DetailTabs — 비용·재고·직원·배달·메뉴·회원·세금) | `DashboardAdminTabs.tsx` |
| 모달 | Milestone Toast | `OperationalDashboard.tsx` (orchestrator) |
| 모달 | Calendar Modal | `OperationalDashboard.tsx` (orchestrator) |

---

## 운영 대시보드 목적 (2026-05-12 사장님 명문화)

> **단순 보여주기 X — 사장님이 *현 상황 파악 → 대비 → 다음 행동 개시* 가능**

3-step 매핑:
- **상황 파악**: CEOMorningHero (AI 해석 hero) + ActivitySnapshot (매출 raw) — 2 hero 패턴
- **대비**: CashflowHero (런웨이) + PLHero (손익) — supporting + Cashflow13Week (Tier 2)
- **행동**: CEOMorningHero 내부 단일 우선순위 + DailyOpsRitual + DailyImprovement/AvgTicketUpsell (분기)

## 업종 라우터 (Phase 2a, 200+ 자료 검증)

SSOT: `industry-card-matrix.ts` — 11 업종 × 30 카드 매핑.

| 업종 | 매일 노출 카드 수 (universal 8 + 업종 추가) |
|---|---|
| food (외식) | 12 (food-safety·prime-cost·inventory·team·daily-improvement·policy-fund) |
| cafe-dessert | 12 (food-safety·prime-cost·cafe-hourly*·team·upsell·policy-fund) |
| beauty | 11 (beauty-booking*·team·upsell·saas·improvement·policy-fund) |
| retail | 11 (retail-sell-through*·inventory·upsell·team·improvement·policy-fund) |
| ecommerce | 10 (ecommerce-conversion*·inventory·upsell·improvement·policy-fund) |
| fitness | 11 (fitness-retention*·team·saas·upsell·improvement·policy-fund) |
| education | 10 (education-enrollment*·team·saas·improvement·policy-fund) |
| pet | 12 (pet-booking*·inventory·team·upsell·improvement·policy-fund) |
| living-service | 9 (living-dispatch*·team·improvement·policy-fund) |
| space | 9 (space-occupancy*·inventory·improvement·policy-fund) |
| online-digital | 9 (online-metrics*·saas·improvement·policy-fund) |
| startup-tech | 13 (cash-zero-date·startup-founder-brief·startup-health·saas·policy-fund) |

*: 신규 카드 status="planned" — Phase 2b-l 작성 예정 (matrix 슬롯만 예약).

## 사장님 카드 표시 설정 (2026-05-11 추가)

- SSOT: `app/lib/dashboard-cards-meta.ts` — 카드 ID·라벨·카테고리·essential 플래그
- 저장: `profile-store.hiddenCards: string[]` (persist + supabase)
- 토글 UI: `components/profile/DashboardLayoutCard.tsx` — 마이페이지 > 설정 아래
- 가드: Tier 0/1/1.5 sections에서 `useProfileStore((s) => s.hiddenCards)` → `hide(id)` 패턴
- essential 카드(NSM hero, cashflow, activity-snapshot)는 hidableCards 카탈로그에서 제외 → 사장님이 실수로 못 끔
- 2-col 레이아웃: 한쪽이 숨겨지면 자동으로 1-col로 우아하게 폴백 (gridTemplateColumns 분기)

## 새 카드 추가 절차

1. 어느 tier 인가? (위 표 참고)
2. 해당 `TierN_*.tsx` 파일에 `<NewCard />` 추가
3. 분기 조건은 카드 내부 또는 부모 wrapper 에서
4. 이 표에 한 줄 추가 (필수 — 다음 작업자가 5초 안에 찾을 수 있도록)

## 데이터 소스

모든 tier 섹션은 동일한 props 받음:
- `d: DashboardHook` — useDashboard 결과 (raw)
- `c: DashboardComputed` — useDashboardComputed 결과 (계산값 캐시)
- `ko: boolean` — 언어
- `nextStaggerStyle: () => CSSProperties` — 카드 stagger 애니메이션

새 계산값 필요 시: `useDashboardComputed.tsx` 에 추가 → 모든 tier 섹션이 자동으로 사용 가능.
