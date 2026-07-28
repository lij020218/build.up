# 운영 대시보드 카드 → 파일 매핑

**사용법**: 사용자가 "X단계 카드" 또는 "Y 카드" 라고 하면 이 표 보고 즉시 정확한 파일로.

## 📁 폴더 구조

```
dashboard/
├── OperationalDashboard.tsx       # Orchestrator ~300줄 (모든 tier 호출 + 비용미입력 안내 + 모달)
├── sections/
│   ├── DASHBOARD_MAP.md           # 이 문서
│   ├── Tier0Header.tsx            # 상호명 + LIVE 배지 + 리추얼 배너
│   ├── TodaySummarySection.tsx    # 오늘의 요약: AI 코칭 요약 카드 + 매출/고객 차트 2장
│   ├── TodayManagementSection.tsx # 오늘의 관리: 재고 통합카드(자세히→/offerings)·고객·팀
│   ├── Tier1Hero.tsx              # 긴급 AlertStrip 만
│   ├── Tier1DailyHub.tsx          # 손익(PLHero) + 현금흐름(CashflowHero) 2-col
│   ├── Tier1_5Coaching.tsx        # 리추얼·정책자금 쌍 + 위생 + 업종별 카드 masonry
│   ├── Tier2WeeklyPulse.tsx       # 코칭일지·재무탭 링크·비용도넛·벤치마크·매출분해
│   ├── Tier3Operations.tsx        # 구독(SaaS지표·플랜·Webhook)·고객·인기상품·최근활동
│   ├── Tier4GrowthTools.tsx       # 시간·마일스톤·인터뷰·4대보험·주간리포트
│   └── Tier5ForecastTools.tsx     # 플레이북·내보내기
├── CustomerSummaryCard.tsx        # 고객/회원 관리 (오늘의 관리 · Tier 3 에서 사용)
├── SubscriptionPlanManager.tsx    # 구독 플랜 (Tier 3 에서 사용)
└── (그 외 60+ 카드 컴포넌트들)

hooks/
└── useDashboardComputed.tsx       # 모든 계산값 단일 소스 (totalSales, runwayMonths 등)
```

**orchestrator 실제 렌더 순서** (2026-07-27 확인): Tier0 → 오늘의 요약 → 오늘의 관리
→ Tier1(Alert) → Tier1DailyHub → FeatureNudge → Tier1.5 → Tier2 → **Tier4** → 비용미입력
안내 → **Tier3** → Tier5 → 세부 관리(DetailTabs). ⚠️ Tier 4 가 Tier 3 보다 먼저 렌더됨
(번호 ≠ 화면 순서).

**대시보드 밖으로 이관된 카드** (파일은 dashboard/ 에 남아 있으나 렌더는 다른 surface):
- `InventoryOpsCard`(+MenuProfitabilityModal) → 대시보드(통합 카드, section="all") **및** `surfaces/OfferingsSurface.tsx`(/offerings — 메뉴/재고 분리 카드, section prop) 양쪽 렌더 (2026-07-27 d2fb90c3·f61f46f0)
- `WhatIfSimulator`·`ForecastCard`·`SurvivalBoardCard`·`Cashflow13WeekForecastCard` → **`surfaces/FinanceSurface.tsx`** (재무 탭, 2026-07-24)
- **어디서도 미사용 (죽은 파일)**: `PrimeCostCard`·`DailyKpiStrip`·`DailyImprovementCard`·`AvgTicketUpsellCard`·`MonthlyProgressCard` (2026-07-13 lean 재설계로 렌더 제거, 파일만 보존)

## Tier 0 — 헤더·인트로

| 위치 | 카드 / 영역 | 파일 | 분기 |
|---|---|---|---|
| 헤더 | 상호명 + LIVE 배지 | `Tier0Header.tsx` | 모두 |
| 헤더 직후 | 가게 세팅 미션 (진행률+보상 체크리스트) | `StoreSetupMissionsCard.tsx` | **기존 가게 등록자만** (setup-missions.ts 마커+휴리스틱 — 로드맵·AI 위저드 유저 미노출) && !isStaff && 미완료 항목 존재 && !dismissed |
| 0단계 | 경영 리추얼 배너 (주간/월간) | `Tier0Header.tsx` | !isStaff && !hide("ritual-banner") |

## 오늘의 요약 (2026-07-21 밀도 재설계 신설)

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| 요약 | **AI 경영 코칭 요약 카드** — CEOMorningHero 와 동일 brain(useMorningBriefingBrain→resolveHero) 요약 표시 | `TodaySummarySection.tsx` | !isStaff |
| 요약 | **[자세히 보기] 펼침 → CEOMorningHero 전체 브리핑** | `TodaySummarySection.tsx` (내부에서 `CEOMorningHero.tsx` mount) | briefingExpanded 토글 (orchestrator state) |
| 요약 | 매출 흐름 7일 (ActivitySnapshot) | `TodaySummarySection.tsx` | 모두 (essential — 숨김 불가) |
| 요약 | 고객 변화 7일 (UserActivity) | `TodaySummarySection.tsx` | !hide("user-activity") |

## 오늘의 관리 (2026-07-21 신설 — 종전 Tier 1.5 (a-1) 이동분)

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| 관리 | **오퍼링 요약 카드 (OfferingsSummaryCard)** — 재고·메뉴 신호(부족 N건·품목 수)만 + [관리하기 →/offerings]. 실 CRUD 는 `OfferingsSurface.tsx` 의 InventoryOpsCard (2026-07-25 오퍼링 분리) | `TodayManagementSection.tsx` (인라인 정의) | !usesSubscriptions && businessCtx.showInventoryCard && showByMatrix("inventory-ops"). offering kind="hidden" 업종은 null |
| 관리 | 고객 요약 (CustomerSummary) | `TodayManagementSection.tsx` | 재고 카드 안 뜨는 업종만 (showCustomer && !showInventory — fitness/education/space 등) |
| 관리 | 팀 현황 (TeamCard) | `TodayManagementSection.tsx` | showByMatrix("team-card"). wide=2-up |

## Tier 1 — 긴급 알림

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| 1 | 긴급 Alert Strip (AlertStripBanner) | `Tier1Hero.tsx` | alert 있을 때만 (카드 내부 가드) |
| ~~1~~ | ~~CEO Morning Hero~~ → **오늘의 요약 [자세히 보기] 펼침으로 이동** (2026-07-21) |  |  |
| ~~1~~ | ~~FeatureNudge~~ → **데일리 허브 아래로 이동, orchestrator 가 직접 렌더** (`FeatureNudgeCard.tsx` 의 FeatureNudgeSection, 2026-07-21 데이터 먼저 원칙) |  |  |

## Tier 1.1–1.2 — 데일리 허브

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| ~~1.1~~ | ~~매출 흐름 (ActivitySnapshot)~~ → **오늘의 요약 이동** (2026-07-21) |  |  |
| ~~1.1~~ | ~~사용자 변화 (UserActivity)~~ → **오늘의 요약 이동** (2026-07-21) |  |  |
| 1.2 | 손익 (PLHero) — 좌 | `Tier1DailyHub.tsx` | !hide("pl-hero"). 숨기면 현금 full-width |
| 1.2 | 현금흐름 + 런웨이 (CashflowHero) — 우 | `Tier1DailyHub.tsx` | 모두 (essential) |
| ~~1.2~~ | ~~업종별 5칸 KPI Strip (DailyKpi)~~ → **제거** (2026-07-13 재설계: 죽은 셀 7개 + 히어로·손익·현금 중복) |  |  |

## Tier 1.5 — 코칭 (오늘 무엇을 하나)

> **분기 표준 (Phase 2a)**: `industry-card-matrix.ts` SSOT — `showByMatrix(cardId)`
> 가 hide() + shouldShowCardByIndustry() 합쳐 결정. 200+ 자료 검증.
>
> **레이아웃 (2026-07-21)**: 리추얼+정책자금 = `.dash-pair` 2열 쌍 → 위생 전체 폭 1줄
> → 나머지는 `TwoColMasonry`(React 직접 2열 분배 — Safari multicol 버그로 CSS multicol 폐기).

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| 1.5 (a) | 오늘의 운영 리추얼 (DailyOpsRitual) | `Tier1_5Coaching.tsx` | !hide("daily-ops-ritual"). 정책자금과 .dash-pair 쌍 |
| 1.5 (c-1) | **정책자금 자동 매칭** (PolicyFundMatch) | `Tier1_5Coaching.tsx` | !hide("policy-fund-match"). self-hide(매칭 없으면 null) — "떠 있으면 곧 받을 돈". 위기 시 isCrisis 톤 |
| 1.5 (a-2) | **식약처 위생점검 대비** (FoodSafety) | `Tier1_5Coaching.tsx` | food / cafe-dessert 만 (showByMatrix). 전체 폭 1줄 |
| 1.5 (f-1) | **회원 Retention · 피트니스** (FitnessRetention) | `Tier1_5Coaching.tsx` | fitness 만. D-7 만료 + 30/60/90일 cohort |
| 1.5 (e-1) | **재등록 + 학생 잔존 · 교육** (EducationEnrollment) | `Tier1_5Coaching.tsx` | education 만. D-14 재등록 + cohort |
| 1.5 (r-1) | **Sell-Through · 소매** (RetailSellThrough) | `Tier1_5Coaching.tsx` | retail 만. Best Seller + Dead Stock + 품절 임박 |
| 1.5 (b-1) | **예약·노쇼·디자이너 · 뷰티** (BeautyBookingNoshow) | `Tier1_5Coaching.tsx` | beauty 만. booking-store |
| 1.5 (ec-1) | **전환율 funnel · 이커머스** (ConversionFunnelCard mode="commerce") | `Tier1_5Coaching.tsx` | ecommerce 만 (showByMatrix("ecommerce-conversion")) |
| 1.5 (s-2) | **전환율 funnel · SaaS** (ConversionFunnelCard mode="saas") — 가입→활성화→유료 | `Tier1_5Coaching.tsx` | isStartupCompany && !hide("saas-funnel-conversion") (2026-05-19 통합 카드, 맵 누락분 2026-07-27 기재) |
| 1.5 (p-1) | **예약·서비스 mix · 펫** (PetBooking) | `Tier1_5Coaching.tsx` | pet 만. booking-store 재사용 |
| 1.5 (sp-1) | **POR·시간대 · 공간임대** (SpaceOccupancy) | `Tier1_5Coaching.tsx` | space 만. booking-store 재사용 |
| 1.5 (l-1) | **의뢰·기사·FTFR · 생활서비스** (LivingServiceDispatch) | `Tier1_5Coaching.tsx` | living-service 만. booking-store 재사용 |
| 1.5 (s-1) | **Cash Zero Date + 채용 시뮬레이터** | `Tier1_5Coaching.tsx` | isStartupCompany && showByMatrix("cash-zero-date") |
| 1.5 (c-2) | 스타트업 전용 핵심 지표 (StartupHealthSection) | `Tier1_5Coaching.tsx` | !hide("startup-health") + 카드 내부 startup-tech 가드 |
| 1.5 (c-3) | **SaaS 핵심 지표 / 구독제 활성화** (SaaSKeyMetricsCard / SubscriptionEnableNudge — Tier3 에서 import) | `Tier1_5Coaching.tsx` | isStartupCompany 한정. usesSubscriptions ? 지표 : 활성화 nudge |
| ~~1.5 (a-1)~~ | ~~재고 운영 + 팀 현황 (InventoryOps + Team)~~ → **오늘의 관리 (TodayManagementSection) 이동** (2026-07-21). 재고 실카드는 다시 **/offerings 분리 + OfferingsSummaryCard 로 교체** (2026-07-25) |  |  |
| ~~1.5 (a-1.5)~~ | ~~메뉴 수익성 (MenuProfitability)~~ → **InventoryOpsCard '메뉴' 섹션으로 흡수** (2026-07-22) → 현재 /offerings 페이지 |  |  |
| ~~1.5 (a-3)~~ | ~~Prime Cost~~ → **제거** (2026-07-13: 손익 카드가 식재료·인건비 비율 이미 표시 — 완전 중복) |  |  |
| ~~1.5 (b/b-2)~~ | ~~DailyImprovement vs AvgTicketUpsell~~ → **제거** (2026-07-13: 히어로 "오늘의 한 수" + 리추얼과 3중 중복) |  |  |
| ~~1.5 (c)~~ | ~~AI 공동창업자 데일리 브리프 (StartupFounderBrief)~~ → **CEOMorningHero 흡수** (2026-06-04: computeStartupRule → brain.industryRule 슬롯) |  |  |
| ~~1.5~~ | ~~OfflineFounderBrief~~ → **CEOMorningHero 통합** (2026-05-12 Phase 1a) |  |  |
| ~~1.5~~ | ~~IntegrationHub~~ → **profile/ 폴더 이동** (2026-05-13 Phase 2, 컴포넌트 자체는 2026-07-12 삭제) |  |  |

## Tier 2 — 이번 주 점검 (DeepDive)

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| 2 | **코칭 누적 일지 14일** (CoachingHistory) | `Tier2WeeklyPulse.tsx` | universal — 2026-07-13 홈에서 이동 (회고성 lock-in) |
| 2 | **재무 탭 링크 배너** — "손익분기 · 13주 자금흐름 · 12개월 시뮬레이션 → /finance" | `Tier2WeeklyPulse.tsx` (인라인 `<a>`) | 모두 (이관 안내 겸 진입점) |
| ~~2~~ | ~~13주 자금 흐름 예측~~ → **재무 탭 (FinanceSurface)** 이관 (2026-07-24) |  |  |
| ~~2~~ | ~~생존 보드~~ → **재무 탭** 이관 (2026-07-24) |  |  |
| 2 | 비용 도넛 (CostCompositionDonut) | `Tier2WeeklyPulse.tsx` | 모두 |
| 2 | 동종업 벤치마크 (SocialBenchmark) | `Tier2WeeklyPulse.tsx` | 모두 |
| 2 | 매출 분해 (SalesBreakdown) | `Tier2WeeklyPulse.tsx` | entries ≥ 2 |
| ~~2~~ | ~~월간 진행~~ → **재무 탭 손익분기 트래커로 흡수** (2026-07-24) |  |  |
| 2 | 비용 구조 (CostStructure) | `Tier2WeeklyPulse.tsx` | entries ≥ 1 && startup·online 외 |
| 2 | 벤치마크 (BenchmarkCard) | `Tier2WeeklyPulse.tsx` | entries ≥ 1 |

## Tier 3 — 운영 관리 (DeepDive, 월/주 단위)

> 표시할 카드가 하나도 없으면 섹션 전체 null (빈 껍데기 방지, 2026-07-12).

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| 3 | SaaS 핵심 지표 (MRR/신규/전환/이탈) | `Tier3Operations.tsx` | usesSubscriptions && **!isStartupCompany** (뷰티 멤버십 등). startup-tech 는 Tier 1.5 (c-3) |
| 3 | 구독 플랜 매니저 + Webhook 연결 | `Tier3Operations.tsx` | usesSubscriptions |
| 3 | 고객 요약 (CustomerSummary) | `Tier3Operations.tsx` | showCustomerCard && !usesSubscriptions && !hide("customer-summary") && **재고 카드가 오늘의 관리에 뜨는 업종만** (이중 렌더 배타 — 재고 없는 업종은 오늘의 관리가 담당, 2026-07-12) |
| 3 | 인기 상품 / 최근 활동 | `Tier3Operations.tsx` | inventoryMode != minimal && !(startup && subs) |
| ~~3~~ | ~~구독제 활성화 안내~~ → **Tier 1.5 (c-3)** 로 승격 (2026-05-11, startup-tech 한정) |  |  |
| ~~3~~ | ~~재고 운영 (InventoryOps)~~ → Tier 1.5 (2026-05-07) → **오늘의 관리** (2026-07-21) → **/offerings** (2026-07-25) |  |  |
| ~~3~~ | ~~팀 현황 (Team)~~ → Tier 1.5 (2026-05-07) → **오늘의 관리 (TodayManagementSection)** (2026-07-21) |  |  |

## Tier 4 — 성장 도구 (DeepDive, 접이식) ⚠️ 렌더는 Tier 3 보다 먼저

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| ~~4~~ | ~~What-If 시뮬레이터~~ → **재무 탭 12개월 시뮬레이션으로 이관·확장** (2026-07-24) |  |  |
| 4 | 주간 시간 리포트 (WeeklyTime) | `Tier4GrowthTools.tsx` | 모두 |
| 4 | 마일스톤 진행 (ProgressMilestones) | `Tier4GrowthTools.tsx` | 모두 |
| 4 | 고객 인터뷰 (CustomerInterview) | `Tier4GrowthTools.tsx` | 모두 |
| 4 | **4대보험 시뮬레이터 (Insurance)** | `Tier4GrowthTools.tsx` | 직원 ≥1 또는 인건비 입력 |
| ~~4~~ | ~~정책자금 매칭 (평상시)~~ → **Tier 1.5 (c-1)** 로 승격 (2026-05-11) |  |  |
| 4 | 주간 리포트 (Weekly) | `Tier4GrowthTools.tsx` | streak ≥7 |

## Tier 5 — 플레이북·내보내기 (DeepDive)

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| ~~5~~ | ~~매출 예측 (ForecastCard)~~ → **재무 탭** 이관 (2026-07-24) |  |  |
| 5 | 첫 100명 플레이북 (FirstCustomers) | `Tier5ForecastTools.tsx` | 개업 ≤90일 또는 미개업 |
| 5 | 데이터 내보내기 (ExportPanel) | `Tier5ForecastTools.tsx` | 매출/재고/직원 있을 때 |

## Orchestrator 직접 렌더 (섹션 파일 밖)

| 위치 | 영역 | 파일 | 분기 |
|---|---|---|---|
| 데일리 허브 아래 | 미사용 기능 안내 (FeatureNudgeSection) | `FeatureNudgeCard.tsx` | !isStaff |
| Tier 4 아래 | 비용 미입력 안내 배너 (→ analytics) | `OperationalDashboard.tsx` (인라인) | entries ≥1 && totalCosts === 0 |

## Admin / 모달

| 위치 | 영역 | 파일 |
|---|---|---|
| 하단 | 세부 관리 (DetailTabs — 비용·재고*·직원·배달*·메뉴*·회원*·세금. *=업종 조건부) | `DetailTabs.tsx` |
| 모달 | Milestone Toast | `OperationalDashboard.tsx` (orchestrator) |
| 모달 | Calendar Modal | `OperationalDashboard.tsx` (orchestrator) |

---

## 로드맵 → 운영 대시보드 자연 전환 (2026-05-13 추가)

**파일**: `components/stages/shared/RoadmapToDashboardTransition.tsx`

위치: 로드맵 path 마지막 단계 `FirstMonthCheckStage` 끝에 mount. 사장님이 46 단계
풀 사이클 로드맵 끝낸 후 → *운영 대시보드 매일 사용* 으로 자연 유도하는 funnel
마지막 카드. `d.navigateToSurface("home")` 호출 → OperationalDashboard 표시.

UX:
- 축하 (사장님이 완주 인지)
- 가치 4가지 명시 (매일 5분·AI 코치·업종 KPI·30일 학습)
- 큰 CTA → 운영 대시보드 진입

## 운영 대시보드 목적 (2026-05-12 사장님 명문화)

> **단순 보여주기 X — 사장님이 *현 상황 파악 → 대비 → 다음 행동 개시* 가능**

3-step 매핑 (2026-07-21 밀도 재설계 이후):
- **상황 파악**: 오늘의 요약 — AI 코칭 요약 카드(brain) + ActivitySnapshot·UserActivity 차트
- **대비**: PLHero (손익) + CashflowHero (런웨이) — Tier1DailyHub. 심층은 재무 탭(/finance)
- **행동**: AI 코칭 카드 단일 우선순위 + DailyOpsRitual + 오늘의 관리(오퍼링·팀)

## 업종 라우터 (Phase 2a, 200+ 자료 검증)

SSOT: `industry-card-matrix.ts` — 11 업종 × 30 카드 매핑.

⚠️ 아래 표의 "매일 노출 카드 수" 는 matrix *선언* 기준 (Phase 2a 당시). 이후
2026-07-13 lean 재설계로 daily-improvement·upsell·prime-cost 등이 렌더에서 제거되어
실 노출 수는 더 적다. 실 렌더 여부는 위 tier 표가 정본.

| 업종 | 매일 노출 카드 수 (universal 8 + 업종 추가) |
|---|---|
| food (외식) | 12 (food-safety·prime-cost·inventory·team·daily-improvement·policy-fund) |
| cafe-dessert | 13 (food-safety·prime-cost·inventory·team·upsell·policy-fund) |
| beauty | 13 (beauty-booking*·team·upsell·improvement·policy-fund) |
| retail | 11 (retail-sell-through*·inventory·upsell·team·improvement·policy-fund) |
| ecommerce | 10 (ecommerce-conversion*·inventory·upsell·improvement·policy-fund) |
| fitness | 13 (fitness-retention*·team·upsell·improvement·policy-fund) |
| education | 12 (education-enrollment*·team·improvement·policy-fund) |
| pet | 12 (pet-booking*·inventory·team·upsell·improvement·policy-fund) |
| living-service | 9 (living-dispatch*·team·improvement·policy-fund) |
| space | 9 (space-occupancy*·inventory·improvement·policy-fund) |
| online-digital | 11 (saas†·improvement·policy-fund) |
| startup-tech | 13 (cash-zero-date·startup-founder-brief·startup-health·saas·policy-fund) |

*: Phase 2b-i 로 전부 구현 완료 (위 Tier 1.5 표 참조).
†: saas-key-metrics 는 usesSubscriptions=true 일 때만 노출 (Tier 3). 비구독이면 빈 카드라 미노출.

2026-06-10 P1-8 audit: 선언 vs 렌더 불일치 정합. cafe-hourly-sales·online-digital-metrics
(planned, 컴포넌트 부재)와 beauty/fitness/education 의 무조건 saas-key-metrics 선언을 매트릭스에서
제거. 빈 카드·"필수인데 부재" 모순 해소. saas-key-metrics 는 구독-네이티브(startup-tech·
online-digital)만 industries 유지 + usesSubscriptions 게이팅.

## 사장님 카드 표시 설정 (2026-05-11 추가)

- SSOT: `app/lib/dashboard-cards-meta.ts` — 카드 ID·라벨·카테고리·essential 플래그
- 저장: `profile-store.hiddenCards: string[]` (persist + supabase)
- 토글 UI: `components/profile/DashboardLayoutCard.tsx` — 마이페이지 > 설정 아래
- 가드: 각 섹션에서 `useProfileStore((s) => s.hiddenCards)` → `hide(id)` / `showByMatrix(id)` 패턴
- essential 카드(activity-snapshot, cashflow-hero)는 hidableCards 카탈로그에서 제외 → 사장님이 실수로 못 끔
- 2-col 레이아웃: 한쪽이 숨겨지면 자동으로 1-col로 우아하게 폴백 (gridTemplateColumns 분기)

## 새 카드 추가 절차

1. 어느 tier/섹션인가? (위 표 참고 — 재무성이면 /finance, 재고·메뉴 CRUD 면 /offerings 가 맞는지 먼저 검토)
2. 해당 섹션 파일에 `<NewCard />` 추가
3. 분기 조건은 카드 내부 또는 부모 wrapper 에서 (업종 분기는 showByMatrix + industry-card-matrix.ts)
4. 이 표에 한 줄 추가 (필수 — 다음 작업자가 5초 안에 찾을 수 있도록)

## 데이터 소스

모든 tier 섹션은 동일한 props 받음:
- `d: DashboardHook` — useDashboard 결과 (raw)
- `c: DashboardComputed` — useDashboardComputed 결과 (계산값 캐시)
- `ko: boolean` — 언어
- `nextStaggerStyle: () => CSSProperties` — 카드 stagger 애니메이션 (Tier2·4·5 등 일부는 미수령)

예외: `TodaySummarySection` 은 추가로 `onOpenCalendar`·`briefingExpanded`·`onToggleBriefing`
(orchestrator 의 캘린더·브리핑 펼침 state) 을 받는다.

새 계산값 필요 시: `useDashboardComputed.tsx` 에 추가 → 모든 tier 섹션이 자동으로 사용 가능.
