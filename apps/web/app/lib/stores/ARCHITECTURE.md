# build.up 데이터 아키텍처 SSOT

> **원칙 (2026-05-12 사장님 명문화)**: 코드 작성 전 *현재 데이터 구조 파악* 필수.
> "아 매출은 이렇게 서버에 저장하는구나 — 그럼 이렇게 활용해야겠다" 식 사고.

## 🎯 작업 전 체크리스트 (필수)

새 카드 / hook / API 작성 전:
1. **매출 데이터 어디서 가져오나?** → `useUnifiedRevenue` (자동 6 출처 통합) vs `useFinanceStore.dailyEntries` (수동만) 확인
2. **고객 수 데이터?** → 수동 entries 의 `customers` 필드 vs 자동 수집 (`useUnifiedSaasMetrics`)
3. **비용 데이터?** → `useFinanceStore.monthlyCosts` (단일 source)
4. **이미 같은 계산 hook 존재?** → `useStartupMetrics`·`useDashboardComputed`·`useMorningBriefingBrain` 활용
5. **Supabase 저장 필요?** → 어느 migration 에 정의되어 있나
6. **persist 패턴?** → Zustand persist (localStorage) + 서버 sync 패턴 (코칭 히스토리 v2 처럼)

## 📊 데이터 출처 매트릭스

### 매출 데이터 (Revenue)

| 출처 | 자동/수동 | Hook | 데이터 위치 | 사용 카드 |
|---|---|---|---|---|
| **수동 입력** | manual | `useFinanceStore.dailyEntries` | localStorage `buildup-finance.dailyEntries` | 대부분 카드 (CashflowHero·PLHero·Benchmark·StartupHealth 등) |
| **PortOne** (실시간 결제) | 자동 | `usePortOneRevenue` | Supabase `portone_*` 테이블 | (ActivitySnapshot 만) |
| **TOSS Place** (POS) | 자동 | `useUnifiedRevenue` 내부 | Supabase | (ActivitySnapshot 만) |
| **CODEF Card** (10 카드사) | 자동 | `useUnifiedRevenue` 내부 | Supabase | (ActivitySnapshot 만) |
| **CODEF Bank** (사업자 통장) | 자동 | `useUnifiedRevenue` 내부 | Supabase | (ActivitySnapshot 만) |
| **팝빌 세금계산서** | 자동 | `useUnifiedRevenue` 내부 | Supabase | (ActivitySnapshot 만) |
| **CSV 업로드** | 반자동 | `useUnifiedRevenue` 내부 | Supabase | (ActivitySnapshot 만) |
| **통합 (모든 출처)** | — | **`useUnifiedRevenue(30)`** | 우선순위 머지 | `ActivitySnapshotCard` |

**우선순위 (같은 날 충돌 시)**: PortOne > TOSS Place > CODEF Card > 팝빌 > CODEF Bank > CSV > Manual.

#### ⚠️ 시스템 부채 (2026-05-12 발견)
**ActivitySnapshotCard 만** `useUnifiedRevenue` 사용. **다른 모든 카드** (CashflowHero·PLHero·Benchmark·StartupHealth·useStartupMetrics·useMorningBriefingBrain·OfflineFounderBrief → industry-rule) 은 *수동 입력만* (`useFinanceStore.dailyEntries`).

→ 사장님이 PortOne·TOSS·CODEF 자동 연동 사용 시 *분석 카드들이 자동 매출 누락*. 사장님 ARR/FTE·BEP·prime cost 모두 *과소 평가* 가능.

해결 옵션:
- **A. `useFinanceStore.dailyEntries` 가 통합 결과 보유** — 모든 자동 수집이 store 에 sync. (현재 패턴 추정, 검증 필요)
- **B. 분석 hook 모두 `useUnifiedRevenue` 로 마이그레이션** — 큰 작업, 단 일관성
- **C. 새 통합 hook `useEffectiveRevenue()`** — 모든 분석 카드 사용. 한 곳에서 정책 통제

### 고객 수 데이터 (Customers)

| 출처 | Hook | 데이터 |
|---|---|---|
| 수동 입력 | `useFinanceStore.dailyEntries.customers` | 사장님 직접 입력 |
| 자동 (SaaS) | `useUnifiedSaasMetrics` | DAU/WAU/MAU/signup/churn (GA4·webhook 등 자동) |

### 비용 데이터 (Costs)

| 출처 | Hook | 데이터 위치 |
|---|---|---|
| 월 고정비 | `useFinanceStore.monthlyCosts` | `{ ingredients, labor, rent, utilities, sga, marketing, other, interest }` |
| 비용 history | `useFinanceStore.costHistory` | 월별 스냅샷 array |

### 운영 데이터 (Operations)

| 데이터 | Store | 키 |
|---|---|---|
| 재고 | `useOperationsStore.inventory` | `inventoryItems` (legacy) → `buildup-operations.inventory` |
| 직원 | `useOperationsStore.employees` | `employees` |
| 고정비 (별도) | `useOperationsStore.fixedExpenses` | `fixedExpenses` |
| 배달 플랫폼 | `useOperationsStore.deliveryPlatforms` | `deliveryPlatforms` |
| 상품 | `useOperationsStore.products` | `products` |
| 통합 상품 | `useOperationsStore.unifiedProducts` | `unifiedProducts` |
| 서비스 메뉴 | `useOperationsStore.serviceMenuItems` | `serviceMenuItems` |
| 회원 | `useOperationsStore.members` | `members` |
| 온라인 플랫폼 매출 | `useOperationsStore.onlinePlatformSales` | `onlinePlatformSales` |

### Cashflow 데이터

| 데이터 | Hook / Store |
|---|---|
| 현재 잔고 | `useCashflowStore.currentBalance` |
| 매출 채널 (정산 주기) | `useCashflowStore.salesChannels` |
| 고정 지출 | `useCashflowStore.fixedExpenses` |
| 13주 forecast | `projectCashflow` (`services/cashflow-projection.ts`) |
| 위기 감지 | `detectCrisis` |

### AI / 분석 데이터

| 데이터 | Hook |
|---|---|
| 모닝 브리핑 두뇌 | `useMorningBriefingBrain(d)` — cashflow 위기 + 룰 anomaly + AI top action + industry rule |
| 스타트업 메트릭 | `useStartupMetrics()` — CMGR·burn·runway·rule of 40·magic number·default alive |
| 11 업종 룰엔진 | `useIndustryRuleSignal` (compute pure 함수 외부 노출) |
| 업종 인사이트 (LLM) | `useIndustryInsight` |
| 코칭 히스토리 | `coaching-history.ts` (localStorage v1 + Supabase v2 mirror) |
| 매출 anomaly | `services/profit-anomaly-detector.ts` |

### 카드 표시 / 사장님 설정

| 데이터 | Store |
|---|---|
| 숨김 카드 ID 목록 | `useProfileStore.hiddenCards: string[]` |
| 업종 ID | `useProfileStore.selectedIndustryCategoryId` |
| 사업장 정보 | `useStoreInfoStore` |
| 카드 메타 (SSOT) | `dashboard-cards-meta.ts` |
| 업종 카드 매트릭스 (SSOT) | `industry-card-matrix.ts` (Phase 2a 추가) |
| 업종 임계값 (SSOT) | `industry-thresholds.ts` (Phase 1a 추가) |
| 통합 채널 카탈로그 (SSOT) | `integrations-catalog.ts` |

## 🗂️ Supabase 테이블

활성 테이블 (2026-05-12 기준):
- `auth.users` (Supabase 기본)
- `profiles` (사장님 프로필)
- `portone_connections`, `portone_transactions` (PortOne envelope encryption 패턴)
- `saas_metrics_connections`, `saas_metrics_daily` (Phase 1a GA4 OAuth)
- `coaching_history` (Phase 2 v2 — Supabase mirror)
- `v_saas_metrics_unified` (소스 우선순위 머지 view)
- `v_coaching_stats_14d`, `v_coaching_meta_30d` (30일 메타 인사이트 view)

RLS 패턴: 본인 select/insert/update, delete = service_role only (lock-in moat 강화).

## 📁 Zustand 스토어 (10개)

| Store | 역할 | persist |
|---|---|---|
| **onboarding-store** | 인증·온보딩 흐름 | X (Supabase) |
| **profile-store** | 업종·자본·사장님 정보·hiddenCards·northStarMetric | ✅ |
| **roadmap-store** | 로드맵 단계·결정·tasks | ✅ |
| **finance-store** | dailyEntries·monthlyCosts·costHistory | ✅ |
| **operations-store** | 재고·직원·고정비·배달·상품·회원·배송·세금 | ✅ |
| **ai-store** | 계약서·가이드·AI 액션 | X (서버) |
| **cashflow-store** | 잔고·정산 주기·forecast | ✅ |
| **agents-store** | 에이전트 proposals (재주문·쿠폰·콘텐츠·리뷰) | ✅ |
| **interview-store** | 고객 인터뷰 데이터 | ✅ |
| **marketing-store** | 마케팅 캠페인 데이터 | ✅ |
| **store-info-store** | 사업장명·주소·연락처 | ✅ |
| **time-log-store** | 시간 로그 (사장님 작업 시간) | ✅ |
| **usage-store** | feature 사용 통계 | ✅ |

## 🔧 핵심 Hook (24개+)

분석·계산 hook:
- `useDashboard` — 메인 hook (모든 store 통합)
- `useDashboardComputed` — 단일 계산 source (모든 비율·trend·anomaly)
- `useStartupMetrics` — 스타트업 전용 (CMGR·burn·runway 등)
- `useMorningBriefingBrain` — AI 모닝 브리핑 두뇌 (cashflow·anomaly·industry-rule)
- `useIndustryRuleSignal` — 11 업종 임계값 룰엔진
- `useIndustryInsight` — LLM 업종 인사이트

매출 데이터 hook:
- `useUnifiedRevenue(days)` — **6 출처 통합 매출** (ActivitySnapshot 만 사용)
- `usePortOneRevenue(days)` — PortOne 만
- `useBankBalance` — 은행 잔고

자동 수집 hook:
- `useUnifiedSaasMetrics` — GA4/webhook SaaS metrics

행동·이벤트 hook:
- `useAgentOrchestration` — 에이전트 정렬·우선순위
- `useTaskHandlers`, `useOperationsHandlers`, `useOnboardingHandlers`, `useSelectionHandlers`
- `useFeatureNudges` — 미사용 기능 안내
- `useReportAIInsight`, `useReportSnapshot`
- `useSubscriptionEvents`
- `useTaskAutoCompletion`
- `useLiveStageData`
- `usePersistence`, `useDataLoading`

## 📐 카드 작성 표준 패턴

```tsx
// 1. 사장님 원칙: 상황 파악 → 대비 → 행동
// 2. 데이터 source 결정 (위 매트릭스 참고)
import { useUnifiedRevenue } from "../../hooks/useUnifiedRevenue";  // 매출 분석 시
// 또는
import { useFinanceStore } from "../../stores";                      // 수동 입력만

// 3. 업종 가드 (필요 시)
import { shouldShowCardByIndustry } from "../../industry-card-matrix";

// 4. 임계값 (필요 시)
import { getIndustryThresholds } from "../../industry-thresholds";

// 5. 사장님 hide 토글 호환
import { useProfileStore } from "../../stores/profile-store";

// 6. 코칭 히스토리 자동 기록 (행동 신호 카드면)
import { recordSignal } from "../../coaching-history";
```

체크리스트:
- [ ] 매출 source 의도 명확? (수동 only vs 통합)
- [ ] 비용 source? (monthlyCosts)
- [ ] 업종 분기? (industry-card-matrix)
- [ ] 임계값 사용? (industry-thresholds SSOT)
- [ ] 사장님 hide 호환? (dashboard-cards-meta entry + 토글)
- [ ] 자료 인용? (글로벌 + 한국 + 학술)
- [ ] 코칭 히스토리 기록? (lock-in moat)

## 🚧 미해결 부채 (2026-05-12)

1. **분석 카드들 unified 매출 미사용** — CashflowHero·PLHero·Benchmark·StartupHealth·useStartupMetrics 등. ActivitySnapshot 만 통합 매출. **결정 필요**: A) finance-store 가 unified sync 가정 / B) 분석 hook 마이그레이션 / C) `useEffectiveRevenue` 통합 hook 신설.
2. **DASHBOARD_MAP.md outdated** — sections/DASHBOARD_MAP.md 가 Phase 1/2 추가 카드 미반영.
3. **IntegrationHubCard 위치 미정** — Tier 1.5 에 셋업 카드. Phase 2 권고: 마이페이지 > 데이터 연결로 이동.
4. **카드 수 임계 초과** — startup-tech 15 카드, 다른 업종 9-12 카드. Miller-Cowan 5-9 의 1.5-3배.
5. **신규 카드 매핑** — industry-card-matrix 안 10 신규 카드 (status: "planned") 미구현. AICostMargin·TTFV·NRRByUseCase·BeautyBookingNoshow·EcommerceConversion 등.

## 🔗 SSOT 파일 인덱스

| 파일 | 역할 |
|---|---|
| `industry-thresholds.ts` | 11 업종 임계값 매트릭스 (인건비·임대료·재료비·BEP·객단가) |
| `industry-card-matrix.ts` | 11 업종 × 카드 매핑 + CARD_META |
| `dashboard-cards-meta.ts` | 카드 ID·라벨·hint·essential 플래그 |
| `integrations-catalog.ts` | 23 통합 채널 (OAuth·API·CSV) |
| `coaching-history.ts` | 30일 코칭 누적 + Supabase mirror |
| `industries-catalog.ts` (있다면) | 업종 ID·label·서브업종 |
| `components/dashboard/sections/DASHBOARD_MAP.md` | 카드 → 파일 매핑 (outdated, 업데이트 필요) |
