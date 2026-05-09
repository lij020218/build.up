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

| 위치 | 카드 | 파일 | 분기 |
|---|---|---|---|
| 1.5 (a) | 오늘의 운영 리추얼 (DailyOpsRitual) | `Tier1_5Coaching.tsx` | 모두 |
| 1.5 (a-1) | **재고 운영 + 팀 현황** (InventoryOps + Team) | `Tier1_5Coaching.tsx` | wide=2-up · narrow=stacked. 재고는 showInventoryCard·!subs |
| 1.5 (a-2) | **식약처 위생점검 대비** (FoodSafety) | `Tier1_5Coaching.tsx` | food / cafe-dessert 만 |
| 1.5 (b) | 오늘의 작은 개선 (DailyImprovement) | `Tier1_5Coaching.tsx` | 모두 |
| 1.5 (b-2) | **객단가 업셀 제안** (AvgTicketUpsell) | `Tier1_5Coaching.tsx` | food/cafe/beauty/retail/fitness/education |
| 1.5 (c-1) | **정책자금 자동 매칭 (위기 elevation)** | `Tier1_5Coaching.tsx` | 런웨이 <6개월일 때만 |
| 1.5 (c) | 스타트업 전용 핵심 지표 (StartupHealth) | `Tier1_5Coaching.tsx` | startup-tech 만 |

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
| 3 | 구독제 활성화 안내 | `Tier3Operations.tsx` | startup + 구독 미사용 |
| 3 | SaaS 핵심 지표 (MRR/신규/전환/이탈) | `Tier3Operations.tsx` | usesSubscriptions |
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
| 4 | **정책자금 매칭 (평상시)** | `Tier4GrowthTools.tsx` | 런웨이 ≥6개월일 때만 |
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
