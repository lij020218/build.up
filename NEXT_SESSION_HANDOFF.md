# NEXT SESSION HANDOFF — 2026-06-04

> 이전 2026-06-02 핸드오프 대체. 이번 세션에서 한 일 + 다음 세션이 바로 이어갈 백로그 명세.

---
## 🚀 다음 세션 즉시 시작 (2026-06-07 카드누락 복원 후 갱신 — 여기부터 읽기)

**git**: `feat/backend-audit-and-sync-2026-06-07` 브랜치(main 아님). **미커밋 변경 있음(아래 Phase 1 완료분)**. 푸시 안 함.
최근 커밋: e9faeaa(동기화) · 8f33070(백엔드 P0/P1) · 3a2c78d·6c7eb58·f3d7c45(신호등 박멸).

**⚠️ prod 미적용 마이그레이션** (이전 세션 신규):
- `20260606_000003_webhook_secret_dek.sql` (stripe·toss webhook DEK 컬럼 — 적용 후 기존 연결은 env fallback, 재연결 시 정상화)
- (`20260606_000002_owner_profile_enc.sql` 는 사용자가 적용 완료)

**✅ 이번 세션(2026-06-07) 완료**:
1. 동기화 C·D: iOS 단계입력 19뷰→stage_decisions / 사장님 PII 봉투암호화(owner-profile API·repo).
2. 백엔드 감사(37-agent): P0 1 + P1 11 + billing JWT + Toss per-user webhook 수정.
3. 프론트 감사(34-agent) → **신호등 컬러 박멸 100%**.
4. **Phase 1 카드 누락 복원 완료 — 웹·iOS 패리티**:
   - **데이터 모델**: `BUInventoryItem`에 `monthlySold: Double = 0` 추가 + custom `init(from: any Decoder)` (decodeIfPresent — 기존 JSON 하위호환). `monthlySold==0 && dailyUsage>0`이면 `×26 추정 + "추정" 배지`.
   - **FoundOneCore** 헬퍼 2종: `SellThroughCalculator.swift`(웹 sell-through.ts 1:1 포팅) · `CohortRetentionCalculator.swift`(웹 cohort-retention.ts 1:1 포팅, 자체 CohortMember 타입).
   - **DailyHub 카드 3종** (웹 SSOT 1:1 포팅): `RetailSellThroughCard.swift` · `FitnessRetentionCard.swift` · `EducationEnrollmentCard.swift`.
   - **IndustryFocusCard** 분기 업데이트: `.retail`→RetailSellThrough / `.fitness`→FitnessRetention / `.education`→EducationEnrollment (기존 `.beauty/.pet/.livingService/.space`→BookingFocusCard 유지).
   - **TodayView** 호출 업데이트: `IndustryFocusCard(mock:members:inventory:)`.
   - **빌드 검증**: iOS BUILD SUCCEEDED ✓ · web/shared tsc 0 오류 ✓.

**⏳ 다음 작업 = Phase 2 (예약 인프라 신규, 거대)**:
- **Phase 2 (예약 인프라 신규, 거대)**: iOS·웹 둘 다 bookings 동기화 없음(웹 booking-store 로컬전용). 
  - store-data.ts `bookings` 필드+FIELD_TO_COLUMN, 마이그레이션 `user_store_data.bookings jsonb`, 웹 usePersistence collect/apply 배선, iOS `BUBooking` 모델+입력UI+동기화.
  - 웹 SSOT 카드: `BeautyBookingNoshowCard·SpaceOccupancyCard·PetBookingCard·LivingServiceDispatchCard`(booking-store + `booking-analytics.ts`). 빈상태 처리 패턴 동일.
  - **원칙**: 현 iOS BookingFocusCard 통합은 데이터 부재 시 정직한 설계였음(가짜숫자 금지). 예약 모델 생기면 4종 실카드 분리.

**프론트 P2 백로그**(감사 confirmed, 미착수): 텍스트 대비 AA 미달 166곳(rgba(15,23,42,0.3) 캡션→var(--muted)) · 브레이크포인트 6종 산재→breakpoints.ts SSOT · iOS SectionEditSheet 저장상태 표시 · iOS accessibilityLabel 7/120 · 웹 진행초기화 native confirm→토큰 모달 · 햄버거 34px→44px 터치타깃 · MarketingTrends/RoadmapView 무지개 hue→네이비농담.

**백엔드 P2 백로그**: billing/verify 트랜잭션 원자성·setMonth overflow · tossplace 부분취소 · God hook 분리(usePersistence/useDataLoading) · 매직넘버 상수화.

**검증 명령**: `cd packages/shared && npx tsc --noEmit` · `cd apps/web && npx tsc --noEmit` · `cd apps/ios && xcodebuild -scheme FoundOne -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build` · `npx vitest run packages/shared/src/__tests__/startup-programs-score.test.ts`

---
## (이전) 🚀 다음 세션 즉시 시작 (2026-06-06 갱신)

**git**: `main` 브랜치, **41파일 미커밋**(이번 세션 누적). 신규 파일: `OwnerProfileChips`(웹/iOS), `FranchiseBenchmarkRegistry.swift`, `FranchiseBenchmarkCard.swift`, `morning-action-log.ts`, `scripts/gen-franchise-benchmark-swift.mts`, `scripts/gen-startup-programs-json.mts`, SQL `20260606_add_promo_playbook_agent_columns.sql`.
→ **먼저 커밋 권장**(아직 안 했으면). 검증 완료 상태라 안전.

**검증 상태(이번 세션 끝 기준)**: web tsc ✓ · shared tsc ✓ · iOS BUILD SUCCEEDED ✓ · 점수 테스트 5/5 ✓.

**⚠️ prod 실행 필요한 마이그레이션**:
- `supabase/migrations/20260606_add_promo_playbook_agent_columns.sql` (promo_codes·playbook_checklist·agent_settings)
- (그 외 이번 세션 이전 신규: 20260604/20260605 보안·암호화 계열 — 적용 여부 확인)

**다음 작업 = 웹↔앱 전체 동기화 (§4.16) 우선순위**:
1. **A. iOS realtime 구독** (최우선·체감 큼): iOS가 `user_store_data`·`business_profiles`·`roadmaps` realtime 구독 → 웹 입력이 앱에 즉시. 시작점: iOS `DashboardStore`/데이터 로드 경로 + Supabase RealtimeClient(Swift), 5초 throttle. (웹←iOS는 이미 동작.)
2. **C. iOS 단계입력 ~70 @AppStorage → `stage_decisions.inputs`**: 로드맵 진행 웹↔iOS 일치. 대(1~2일).
3. **D. PII 봉투암호화 동기화**(사용자 결정): owner.birthYear/ncbScore/consideringClosure/isDisabledOwner → 봉투암호화(PORTONE_KEK 인프라) 컬럼 동기화. 웹 `profile-store`(localStorage) + iOS UserDefaults(`owner.*`).
- 설계 메모: "같은 숫자 100% 보장"의 정석 = **신호 계산을 서버(packages/ai/route)로 이동**, 클라는 raw만 전송(§4.16 하단).

**또 다른 진행중 트랙 — AI 모닝 히어로(§4.15)**: 웹 1~3단계 완료(temp 0.3·정량ROI·미래신호·배선·배지). iOS 4a(배지)+4b부분(운영신호5) 완료. 남음: iOS 미래신호 6종(또는 위 "서버 계산" 리팩터로 흡수).

**검증 명령**:
```
cd packages/shared && npx tsc --noEmit
cd apps/web && npx tsc --noEmit
cd "$ROOT" && npx vitest run packages/shared/src/__tests__/startup-programs-score.test.ts
cd apps/ios && xcodebuild -scheme FoundOne -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
codegen 재생성: npx tsx scripts/gen-franchise-benchmark-swift.mts && npx tsx scripts/gen-startup-programs-json.mts
```
세부 작업 로그는 아래 §4.7~4.16 참조.

---

브랜치: `feat/dashboard-honesty-parity-2026-06-04` (main 아님 — 머지/FF는 사용자 판단)

이번 세션 주제: **웹↔iOS 통일 + 운영 대시보드 "데이터 정직성" + 카드 종류 패리티**.

---

## 0. 절대 원칙 (매 작업 적용)

1. **가짜 숫자 금지 (최우선)**: 사장님 화면 모든 수치는 실데이터(입력/연동/계산). 계산 불가하면 `"—"`/빈상태/"예시" 배지. 데모 더미를 진짜처럼 표시 = 출시 차단급 버그.
2. **웹 = SSOT**: 내용 기준은 웹, iOS는 미러. **카드 "종류"가 달라지면 안 됨** — 단 모바일은 "펼쳐보기(팝업)"로 접는 것 허용. **"접힘 OK, 누락 NG"**.
3. **카드 막 추가 금지**: 지표 과잉=인사이트 0. 새 기능은 가능하면 기존 카드(특히 AI 모닝 히어로 신호 엔진)에 흡수. 카드는 그릇, 가치는 그 뒤 엔진.
4. **최신 자료 조사 후 코딩** (글로벌 룰): 지표 기준은 WebSearch로 최신 확인 후 반영.
5. 커밋·푸시는 사용자가 명시 요청할 때만.

---

## 1. 이번 세션 완료 (전부 빌드 검증 ✅ — web tsc/build 0, iOS BUILD SUCCEEDED)

### 웹
- **네비게이션 통일**: 출시 전/후 모두 데스크탑=좌측 사이드바, 모바일(≤1080px)=햄버거→좌측 드로어. (`starter-stage-demo.tsx` — `showAppShell`, 모바일 스크롤탭 제거→드로어, `isHomeOperational` 은퇴)
- **브랜드 "Build.UP"→"Found.One"**: 사이드바 로고 + placeholder 3곳(`CompanySetupStage`,`store-info-schema`,`build-method-data`) + GTM 타이틀. (내부 식별자 `buildup:` 키·이벤트·예시URL은 의도적 보존)
- **AI 코파운더 브리프 → 모닝 히어로 흡수**: `computeStartupRule.ts` 신설(브리프 신호 순수함수) → `useMorningBriefingBrain` 이 스타트업이면 같은 `industryRule` 슬롯 주입 → `resolveHero` 무수정. `StartupFounderBrief.tsx` 삭제 + 카드메타/매트릭스 고아 정리(coaching history 이중기록도 해소).

### iOS (FoundOne 스킴)
- **경고 39→0**: `@MainActor`(WizardStageDispatcher·AIRoadmap 버튼3), `any Decoder/Encoder/Error`, `any LocalizedError`, var→let, 미사용제거, realtime `subscribe()`→`subscribeWithError()`.
- **거짓말 버그 픽스**: ① `UserActivityCard` 하드코딩 `신규32/재방문42` → 실데이터(`이번달 고객수`/`일평균`; 재방문률은 집계로 계산불가라 제거). ② `ConversionFunnelFocusCard` 라벨없는 샘플 → "예시 데이터" 배지. ③ `GrowthForecastView` 마일스톤 `재방문42%/단골67명` 하드코딩 → 실데이터.
- **스타트업 신호 포팅**: 웹 computeStartupRule 미러 → `HeroResolver` 우선순위 1.6 분기(런웨이<6/Default Dead/런웨이<12). 전부 실데이터. **Burn Multiple·CMGR·Rule of 40 은 iOS가 실데이터 계산 못 해 의도적 제외**. `AppRoot.swift` mockData 에서 runway·weeklyChange·categoryId 주입.
- **모바일 홈 재구성**: 홈 = 공통 6장(①모닝히어로 ②매출흐름 ③현금흐름 ④**손익 PLHero 신규** ⑤재고/고객 ⑥직원) + 업종 핵심. 강등 3장(KPI스트립·고객·운영의식)은 "더 알아보기 > **오늘 상세**" 팝업(`DailyDetailView`, 누락0).
- **신규 카드(실데이터·정직)**:
  - `StartupHealthCard.swift` (스타트업 홈) — 리서치 기반(초기단계 Rule of 40 부적합 → 런웨이·순burn·MoM·ARR/직원·매출총이익률·Burn Multiple). 계산불가는 "—".
  - `FoodSafetyCard.swift` (외식·카페 홈, 원가율과 나란히) — 식약처 23항목(`packages/shared/.../food-safety-checklist.ts`) + 빈도 만료추적 + UserDefaults.
  - `CustomerInterviewCard`+`FirstCustomersCard` (GrowthCards.swift, 성장 팝업) — Mom Test 질문지(정적)/첫100명 진행률(실데이터)+정적 전술.

---

## 2. 남은 백로그 — 카드 종류 패리티 (MED/LOW) ← 다음 세션 핵심

웹엔 있는데 iOS에서 (펼쳐도) 도달 불가한 카드들. **HIGH는 이번 세션 다 닫음.** 각각 "정직성" 걸림돌이 있어 개별 작업 필요.

| 카드 | 걸림돌 | 권장 접근 | iOS 배치 |
|---|---|---|---|
| ~~**동종업 벤치마크**~~ ✅ 2026-06-04 완료 | 공정위 매출 백분위 데이터 iOS 미존재 | **FoundOneCore `IndustryBenchmarkRegistry.swift` 신설** = 웹 `INDUSTRY_BENCHMARKS` 11업종 1:1 포팅 + 백분위(3점 선형보간) + `IndustryCategory→categoryId` 매핑. 카드 `IndustryBenchmarkCard`(WeeklyPulse). 가드: 기록<3일·스타트업(매출기준0) 비표시 | 주간점검 `WeeklyPulseView` |
| ~~**4대보험 시뮬**~~ ✅ 2026-06-04 완료 | ⚠️ 요율 정확도(옛 요율 버그 이력) | **FoundOneCore `InsuranceSimulator.swift` 신설** = 웹 SSOT `simulateInsurance` 1:1 포팅. 요율 단일 정의(`InsuranceRates2026`). `InsuranceTaxSetupStageView`도 이 상수 참조하도록 매직넘버 제거 → 중복정의 근절 | 성장 `GrowthCards`(`labor>0` 게이팅, `CustomerInterviewCard` 뒤) |
| ~~**코칭 14일 일지**~~ ✅ 2026-06-04 완료 | iOS가 일별 신호 저장 안 함 → **웹과 동일 Supabase `coaching_history` 테이블 직접 연결**(별도 인프라 불필요) | `CoachingHistoryRepository`+`CoachingHistoryStore`(FoundOneData, Supabase Swift SDK) + `CoachingHistoryCard`(Today). 매일 히어로 신호 1건 자동 upsert(중복 가드), "했음" 토글. 30일 AI 메타뷰는 후속 | 오늘 상세 팝업(`DailyDetailView`) |
| ~~**SaaS 핵심지표**~~ ✅ 2026-06-04 완료 | GA4/webhook 연동 데이터 필요 | **웹과 동일 Supabase `saas_metrics_daily` 직접 읽기**(RLS select-own, view 대신 하부테이블+클라 dedup). 연동(웹 GA4/웹훅)되면 실데이터, 아니면 정직한 "연동 필요" 빈상태(가짜 0 금지). `SaasMetricsRepository`+`SaasMetricsStore`(FoundOneData) + `SaasMetricsCard`(WeeklyPulse, 스타트업만) | 주간점검 `WeeklyPulseView` |
| ~~**구독 플랜 관리**~~ ✅ 2026-06-04 완료 | CRUD+webhook 무거움 | **웹은 이미 완비**(구독 수익모델→`usesSubscriptions`→Tier3 `SubscriptionPlanManager` 게이팅). iOS 신규: `revenueModel`→`uses_subscriptions` 투영(StageInputProjector) + `loadSubscriptionState`(StoreProfileRepository) + `SubscriptionStore` + `SubscriptionManagementCard`(읽기전용, 웹과 동일 Supabase). 게이팅 `usesSubscriptions` | 주간점검 `WeeklyPulseView` |
| LOW(미사용안내·인기상품·최근활동·주간시간·내보내기) | 보조 | 후순위 | — |

**권장 순서**: ~~(1) 4대보험~~ ✅ → ~~(2) 동종업 벤치마크~~ ✅ → ~~(3) 코칭일지~~ ✅ → ~~(4) SaaS 빈상태~~ ✅ → ~~(5) 구독 플랜 관리~~ ✅. **카드 패리티 HIGH/MED/구독 전부 완료.** 남은 LOW(미사용안내·인기상품·최근활동·주간시간·내보내기)는 보조 — 필요 시.

> **구독제 메모(2026-06-04)**: 웹·앱 모두 "정기 구독" 수익모델 옵션은 startup-tech·online-digital 에 이미 존재. 웹은 게이팅·관리카드까지 완비돼 있었고, iOS만 (a) `revenueModel`→`uses_subscriptions` Supabase 투영 (b) 구독관리 카드(읽기전용)를 신규 추가. 플랜 CRUD·MRR(구독자 집계)은 후속 — 현재 iOS는 웹에서 만든 플랜을 읽어 표시. iOS BUILD SUCCEEDED, 웹 무변경.

> **SaaS 지표 메모(2026-06-04)**: iOS는 `saas_metrics_daily`(authenticated select-own + grant)를 직접 read. view `v_saas_metrics_unified`는 security_invoker 아님→RLS 우회 위험이라 하부 테이블 + 클라이언트 소스우선순위 dedup 으로 미러. 연동(GA4 OAuth·웹훅)은 웹 전용 — iOS는 읽기만. 스타트업 외 업종은 fetch 안 함. iOS BUILD SUCCEEDED.

> **코칭일지 메모(2026-06-04)**: 핸드오프 원안은 "iOS 영속 인프라부터"였으나, 실제로는 웹이 쓰는 `coaching_history` 테이블이 이미 있어 iOS Supabase 리포지토리만 붙이면 됐음(같은 SSOT = 웹·앱 자동 동기화). 기록 시점: 홈 진입 시 `.task`로 그날 hero 신호 1건 upsert(tone→kind 매핑은 웹 CEOMorningHero 1:1). v1은 14일 타임라인+통계+토글. 30일 AI 메타 인사이트(웹 `v_coaching_meta_30d` 뷰)는 iOS 미연동 — 후속. iOS BUILD SUCCEEDED.

> **동종업 벤치마크 메모(2026-06-04)**: 웹 `SocialBenchmarkCard`의 주간 4주 라인차트는 iOS에서 단일 바(내 매장 + 평균/상위10% 기준선)로 단순화 — 핵심(위치·갭·메시지) 동일. 4주 트렌드 라인은 후속 가능. projectedMonthly = 일평균×26(웹과 동일 가정). iOS BUILD SUCCEEDED.
> **발견(별도 처리)**: `WeeklyPulseView.MonthlyPnLCompareBlock` 의 "지난 달 = 이번 달 ×0.92" 샘플값이 사장님께 실데이터처럼 표시됨 → 가짜 숫자. 정리 작업 칩으로 분리.

> **4대보험 검증 메모(2026-06-04)**: 요율 WebSearch 재확인 — 국민연금 9.5%·건강 7.19%·고용보험 사업주 1.15%(실업급여 0.9% + **고용안정·직업능력개발 0.25%**, 150인 미만 사업주 전액)·장기요양 건보료×13.14%·산재 0.7%(일반서비스업).
> **요율 SSOT 단일화 완료(2026-06-04)**: 4대보험 사업주 요율을 4곳에서 단일 SSOT로 통일 — 웹 `packages/shared/.../hiring-cost.ts`(`INSURANCE_RATES_2026`/`simulateInsurance`/`TOTAL_EMPLOYER_RATE_PCT`=10.67%) + iOS `FoundOneCore/InsuranceSimulator.swift`(`InsuranceRates2026`) 미러. **고용안정 0.25% 포함이 법적 정답**(사장님 결정). 두루누리 감면은 실업급여분에만 적용(고용안정 비대상). iOS 중복정의 3건 제거: 스테이지뷰 매직넘버·`BUEmployee.employerInsurance`(옛 `×0.1041` 하드코딩→`simulateInsurance`)·시뮬카드. 직원 수는 실데이터(`user_store_data.employees`→`storeInfo.state.employees.count`) 주입. 웹 tsc·iOS BUILD 모두 통과.

---

## 3. 핵심 파일 지도

**웹**: `apps/web/app/lib/components/dashboard/`(+`sections/Tier0~5*.tsx`,`DASHBOARD_MAP.md`).
- 모닝히어로 두뇌: `hooks/useMorningBriefingBrain.ts` → `useIndustryRuleSignal.ts`(오프라인) + `computeStartupRule.ts`(스타트업) → `heroInsight.tsx` resolveHero.
- 가시성: `dashboard-cards-meta.ts`(essential) + `industry-card-matrix.ts`(업종별).

**iOS**: `apps/ios/Sources/FoundOneFeatures/Today/TodayView.swift`(홈 + `DailyDetailView`/`MoreInsightsStrip` 팝업: 오늘상세·주간점검·성장·내가게·로드맵).
- 히어로 신호: `FoundOneCore/HeroResolver.swift`(`resolve()` 우선순위, 스타트업 1.6).
- 카드: `DailyHub/*.swift`, 성장 `Growth/GrowthCards.swift`, 주간 `WeeklyPulse/WeeklyPulseView.swift`.
- 데이터 주입: `AppRoot.swift` `mockData`(이름은 mock이나 **실데이터 컨테이너** — DashboardStore. 리네이밍 backlog).

**공유**: `packages/shared/src/`(starter-data·i18n·finance/startup-metrics·dashboard/food-safety-checklist·franchise-benchmarks).

---

## 4. 검증 명령
- 웹: `cd apps/web && npx tsc --noEmit && npx next lint && npx next build`
- iOS: `cd apps/ios && xcodebuild -scheme FoundOne -destination "generic/platform=iOS Simulator" -derivedDataPath /tmp/fo build`
- 시뮬: iPhone 17 Pro `BCE8302D-EC64-4D2E-906E-51B316A21C8C`, `SIMCTL_CHILD_BU_DEMO_STAGE`.

---

## 4.5 로드맵 Supabase 로드 검증·수정 (2026-06-04)
**검증 요청**: iOS가 로드맵 저장 데이터를 Supabase에서 올바르게 가져오는가?
- ✅ `stage_decisions` 자체는 정상 로드 — `RoadmapDecisionsRepository.fetchAll()`(roadmap_id FK) → `RoadmapStore.syncFromRemote()` key-merge.
- 🐞 **발견·수정**: 로드맵 `cluster`(=경로 선택자)가 **로그인 세션 hydration에서 원격 업종으로 세팅 안 됨**(온보딩·AI위저드 경로에만 `setCluster` 존재). 웹에서 업종 선택한 사용자가 iOS 로그인 시 cluster가 기본값(offline-food)에 머물러, 받아온 `stage_decisions`가 경로에 매핑 안 돼 진행도가 틀어짐.
- **수정**: `UserDashboardRepository` 가 `business_profiles.sub_industry_id`+`industry_category_id` 도 노출 → `AppRoot.hydrateRoadmapIndustry()` 가 `StarterIndustryData.cluster(for:)`(딥테크 포함 정밀 매핑)로 `roadmap.cluster`/`roadmap.selectedIndustryId` UserDefaults + `roadmapStore.setCluster()` hydrate. `loadDashboardIfNeeded`(syncFromRemote 직전) + `refreshAllFromRemote` 양쪽 적용. iOS BUILD SUCCEEDED.
- **잔여 점검 완료 (2026-06-04)**:
  - ✅ **stage code 1:1 일치**: iOS 경로 stage id(RoadmapStage.swift offline/online/startup/hardware/lab/semi paths) 48개 == 웹 `starterStageFlow`(starter-data.ts) 48개. 양방향 diff 0. 매핑 불일치 없음(franchise-application 포함).
  - ✅ **roadmaps row 해석 일치**: 웹 `getLatestRoadmapRow` == iOS `resolveRoadmapId` 둘 다 `(user_id, updated_at desc, limit 1)`. 정상 사용 시 동일 row 수렴.
  - ✅ **하드닝 완료 (2026-06-04)**: `supabase/migrations/20260604_000001_roadmaps_unique_user.sql` 신설 — 유저별 canonical roadmap(최신)으로 stage_decisions/stage_tasks 병합(충돌 시 최신 보존) → 비-canonical roadmap 삭제 → **`roadmaps.unique(user_id)` 추가**. 멱등(재실행 안전). iOS `RoadmapDecisionsRepository.resolveRoadmapId` 도 insert 충돌 시 재조회하도록 하드닝(중복 대신 공유). **⚠️ 미적용**: prod 에 마이그레이션 실행 필요(로컬 DB 없어 SQL 실행검증은 못 함 — 문법 리뷰만). 웹 `saveRoadmapState` 의 no-id insert 도 동일 레이스 시 unique 위반 가능 — 후속 guard 권장(현재는 find-first 로 대부분 회피).

## 4.6 양방향 실시간 동기화 점검·수정 (2026-06-04)
**점검**: 앱 입력이 웹에 즉시 반영되는가(반대도)?
- ✅ **운영 대시보드(user_store_data: 재고·직원·비용·구독플랜·매출·일별)**: 양방향 즉시 — 웹·iOS 둘 다 `user_store_data`+`business_profiles` realtime 구독.
- 🐞 **발견**: 로드맵(stage_decisions/roadmaps)은 양쪽 다 미구독 → 즉시 동기화 안 됨(투영 필드 우연 의존 + 포그라운드 재조회만). publication·REPLICA IDENTITY FULL 은 4테이블 다 포함돼 있었음(DB는 준비됨, 클라이언트만 누락).
- **수정**: 웹·iOS 둘 다 `roadmaps`(user_id 필터) realtime 구독 추가. `stage_decisions` 는 user_id 컬럼이 없어 직접 필터 구독 불가 → 양쪽이 저장 시 부모 `roadmaps.updated_at` 을 bump(웹 saveRoadmapState 는 기존부터, iOS `RoadmapDecisionsRepository.upsert/delete` 에 `touchRoadmap` 추가)하여 roadmaps 구독 하나로 안전하게(항상 user_id 필터 유지) 커버. 수신 시 iOS=refreshAllFromRemote(syncFromRemote 포함)/웹=flush+connectAndLoad. 웹 tsc·iOS BUILD 통과.
- 전제(운영): Supabase 대시보드 Database→Replication 에서 `roadmaps` Realtime 토글 ON 필요(publication 추가는 마이그레이션에 있음).

## 4.7 출시 전 5대 감사 + P0/P1 수정 (2026-06-05)
5개 영역 병렬 심층 감사 후 수정. 빌드: 웹 tsc·shared·ai·iOS BUILD 전부 통과.

### 수정 완료 (이번 세션)
- **보안** `supabase/migrations/20260605_000001_security_hardening.sql` 신설:
  - ① 뷰 3종(`v_saas_metrics_unified`/`v_coaching_stats_14d`/`v_coaching_meta_30d`) `security_invoker=true` — **전 사용자 데이터 덤프 가능했던 RLS 우회 차단(최우선 P0)**.
  - ② `business-documents` 버킷 private 강제 + 본인폴더 RLS 4종(사업자등록증 유출 방지).
  - ③ `buildup_subscriptions.billing_key` 컬럼 SELECT 차단(본인도 평문 조회 불가).
  - Stripe 웹훅 fail-closed 전환(`api/webhooks/stripe/[uid]`) — 위조 결제 이벤트 주입 차단.
- **회원가입**:
  - 웹 `saveRoadmapState` `unique(user_id)` 충돌(23505) 재조회 폴백 — **내 20260604 마이그레이션 회귀 수정**.
  - 웹 `SIGNED_OUT` 시 로컬 캐시 wipe(공용 PC 이전 계정 정보 노출 방지).
  - iOS Apple/카카오 로그인에 `bootstrapAccountWorkspace` 추가(이메일 경로와 정합).
- **로드맵 내용**:
  - iOS 현금영수증 의무발행 `1만원→10만원`(웹은 이미 정확).
  - iOS 산재요율 웹 SSOT 전면 정합(food/retail/beauty/fitness/space/living 어긋나 있던 것 → 도소매·음식·숙박 0.8 / 전문·보건·교육·여가 0.6 / 기타·전자상거래 0.7).
  - iOS 원천세 가산세 `10%↑`→`미납세액 3% + 일 0.022%`(4곳).
- **AI**: dashboard 프롬프트 사례인용 그라운딩(주입 블록 외 기업·수치 인용 금지) + roadmap 프롬프트 정책수치 그라운딩(인허가비용·지원금·세율 주입데이터/범위 외 임의생성 금지).
- **대시보드 카드**: 감사 결과 **P0 없음(전부 실데이터/예시배지) — 합격**.

### ⚠️ 적용·결정 필요 (미적용)
- **마이그레이션 prod 적용**: `20260604_000001`(roadmaps unique, 단 웹 onConflict 수정 먼저 배포 후) + `20260605_000001`(보안). `supabase db push`.
- **business-documents**: 마이그레이션이 버킷/RLS를 정식화하나, 운영 DB에서 Studio→Replication/Storage 실제 상태 확인 권장.
- **AI 비용 결정**: 백엔드가 실제 OpenAI gpt-5.4-mini(Anthropic 잔액부족 2026-05 전환). 로드맵 등 고난도까지 mini → 모델 등급 상향은 비용 결정. temperature 전 호출 고정·industry-daily 서버캐시·웹↔iOS 히어로 코칭 통일은 미적용(구조 변경 큼).
- **보안·인증 P1 일괄 수정 완료(2026-06-05)**:
  - ✅ 비밀번호 정책 강화: `validatePassword`(shared) 영문+숫자 필수(전부숫자 "12345678" 차단) + 흔한비번 블랙리스트. iOS `PasswordPolicy.swift` 신설로 웹·앱 동일 규칙(SignInView·ResetPasswordView 미러).
  - ✅ `getCurrentUser` 60초 만료 버퍼(만료임박 토큰 통과→첫 쓰기 401 race 방지).
  - ✅ cron 4종(portone-sync/tossplace-sync/marketing-trends/funnel-pull) secret 비교 `===`→`timingSafeEqualStr`(신규 `_lib/timing-safe.ts`).
  - 웹 tsc·iOS BUILD 통과.
- **고객 PII 봉투 암호화 완료(2026-06-05)**: 조사 결과 감사가 지목한 `customers` 테이블은 **휴면(코드 0건)** 이었고, 실제 라이브 PII 는 `portone_payments.customer_email`(write-only, 미표시) + `raw` jsonb 고객블록. → **봉투 암호화 전환**(사장님 결정: win-back 대비):
  - 마이그레이션 `20260605_000002`: `portone_payments.customer_email_enc jsonb` 추가 + 기존 평문 customer_email null 처리.
  - `_lib/payment-pii.ts` 신설: `sealEmail`(envelopeEncrypt, KEK 없으면 null·평문 fallback 금지) / `openEmail`(서버 win-back 복호화용) / `redactPaymentRaw`(raw 의 customer email·name·phone 제거, id·나머지 보존).
  - portone sync/webhook/cron 3곳: 평문 `customer_email=null` + `customer_email_enc` 저장 + `raw` 레닥션. 웹 tsc 통과.
  - ⚠️ 적용: 마이그레이션 prod 실행 + **PORTONE_KEK_BASE64 env 설정 필수**(없으면 sealEmail=null 로 이메일 미저장). tossplace/codef raw 의 PII 는 후속 점검 권장.
- **portone 사장님별 웹훅시크릿 완료(2026-06-05)**: 글로벌 `PORTONE_WEBHOOK_SECRET` 공유 → 사장님별 봉투암호화로 전환(유출 시 위조 blast radius 축소).
  - 마이그레이션 `20260605_000003`: `portone_connections.webhook_secret_enc jsonb` 추가.
  - connect 라우트: 선택적 `webhookSecret` 받아 봉투암호화 저장(미입력 시 기존값 보존). `loadWebhookSecret`(webhook 라우트): 사장님별 enc 우선 복호화 → 없으면 글로벌 env fallback(하위호환). UI `PortOneConnectCard` 에 "웹훅 시크릿(권장)" 선택 입력 추가. 웹 tsc 통과.
  - ⚠️ 적용: 마이그레이션 prod 실행. 기존 연결은 글로벌 fallback 유지, 사장님이 재연결 시 웹훅시크릿 입력하면 전용 키 적용.
- **남은 보안 항목(아키텍처 변경 큼 — 별도 진행 권장, 출시 차단 아님)**:
  - 웹 토큰 localStorage → `@supabase/ssr` 쿠키 기반(XSS 노출면 축소). 미들웨어 가드 동반. **blast radius 큼 — 명시 요청 시 신중히.**
  - 운영: Supabase Auth 측 password policy(최소길이/HIBP) ON 권장(클라 검증 보강용).

## 4.8 로드맵 정책자금 2026 수치 검증·정정 (2026-06-05)
WebSearch 로 감사 "확인필요" 정책자금 검증 후 정정 (웹 `startup-programs.ts`/`funding/programs.ts` + iOS `startup-programs.json` 동기화):
- ✅ **TIPS 2026 대개편 반영**: 노후값(R&D 9억/5억, 총 14억) → **일반트랙 R&D 최대 8억 + 운영사 선투자 2억(비수도권 1억) = 총 10억, 졸업 후속 R&D 3년 15억, 글로벌TIPS 최대 50억**. 두 데이터 파일 불일치도 해소.
- ✅ **예비창업패키지**: "최대 8,000만원"(오류) → **일반 최대 7,000만, 딥테크 최대 1억**.
- ✅ 초기창업패키지(일반 1억/딥테크 1.5억) — 검증 결과 정확, 변경 없음.
- iOS BUILD·shared tsc 통과.
- **전수 검증 완료(2026-06-05, 5개 병렬 에이전트 WebSearch)** — 확정 불일치 정정:
  - **정책/프로그램(`startup-programs.ts`+iOS json 동기화)**: ① 소상공인 정책자금 "운전 5억/시설 10억"(특화자금 시설한도 혼동) → 운전 1억/시설 5억(특화 시설 10억). ② 매쉬업엔젤스 → **매쉬업벤처스**(2024-02 사명변경, url mashupventures.co, 포트폴리오 200+). ③ 정주영 총상금 4억 → 약 3.7억. ④ YC 연 2회 배치 → 연 4회. ⑤ GMEP amount 추가(해외진출자금 2,500만~4,000만, 접수 2/27~3/31 closed).
  - **프랜차이즈(`franchise-benchmarks.ts`, 웹 전용·iOS 미러 없음)**: 네네치킨 월 2917→1826, 호식이 2500→1946, 파파존스 3333→4725, 메가커피 2383→2908(top 6000→9747). 각 정보공개서 연평균÷12 기준. (top은 multiplier×avg 재계산, 메가는 검증값)
  - **검증결과 정확(변경 없음)**: 교촌·bhc·bbq·굽네·맘스터치·한솥·본죽·도미노·투썸·빽다방·컴포즈·이디야·파리바게뜨·뚜레쥬르·GS25·CU·준오헤어 / 초기창업패키지·청년창업사관학교·청년전용창업자금·창업도약·재도전성공·삼성C-Lab·스파크랩·D2SF·프라이머·블루포인트·아산두어스.
  - **불확실(공개정보 부족·미정정)**: 롯데리아(최신 정보공개서 미확인), 비외식 12개 브랜드(이가자·블루클럽·애니타임·커브스·눈높이·구몬·펫박스·도그메이트·클린바스켓·워시엔조이·토즈·프렌즈스크린골프 — 정보공개서 매출 비공개), 혁신소상공인창업지원(2026 강한소상공인/도약사업 개편 가능성). franchise.ftc.go.kr 직접조회 필요.
  - **별도 권장**: `policy-funds/catalog-2026.ts`(@deprecated·미사용이나 index 재export 됨)에 노후값(청년고용연계 1억→7천만, 재도전특별 범위, 성장기반 2억→5억, 대환금리 4.5% 고정) — 삭제 또는 정정 권장.

## 4.9 프랜차이즈 데이터 전수 검증 2차 (2026-06-05, 5개 에이전트)
catalog-2026.ts 삭제(미사용·노후) + 프랜차이즈/공급처/배달앱/창업비용 2026-06 전수 WebSearch 검증.
- **배달앱(`logistics-platforms.ts`)**: 🔴 **쿠팡이츠 포장 수수료 0%→6.8%(2026.4.14~, 영세·전통시장 2027.3까지 무료)** 정정 — 가장 시급(모든 F&B 사장님 노출). 배민/요기요/땡겨요/네이버 수수료는 정확 확인.
- **공급처(`vendor-data.json`, iOS 심볼릭)**: 🔴 **헤이뷰티(2019 폐업) → 네이버 예약** 7곳 교체. 나머지 식자재·POS(토스플레이스·페이히어·오케이포스 등) 전부 실존 확인.
- **가맹비/창업비용(`franchise-brands.json`, iOS 심볼릭)**: BHC 가맹비 500→1100, 도미노 가맹비 1500→3300·로열티 0→408(6% 정률 근사)·창업비 25250→25495, 컴포즈 가맹비 300→550, 투썸 가맹비 500→2000·창업비 15000→27510, 맘스터치 창업비 11000→16045, 배스킨 가맹비 1500→880, 파리바게뜨 창업비 45000→31380·가맹비 1430. (정보공개서 기준)
- **창업비용(`cluster-budget-benchmarks.ts`)**: 11개 클러스터 ±25% 오류 없음 — 2026-05 검증 유효.
- **⚠️ 미해결/판단필요**:
  - **롯데리아 매출 4458**: 과거(2016) 공시 대비 낮을 가능성(6000~7000?)이나 최신 정보공개서 미확인 → 보류. 공공데이터포털 API(data.go.kr 15143710) 직접조회 필요.
  - **눈높이·구몬·펫박스·도그메이트**: 가맹 프랜차이즈가 아님(방문학습지·구독커머스·펫시터 플랫폼) → `franchise-benchmarks.ts`에서 "가맹점 평균매출"로 다루는 것 자체가 데이터모델 부정확(가짜숫자 원칙 충돌). 제거/재분류 검토 권장.
  - 비외식 12개 브랜드 매출: 정보공개서 비공개/봇차단(403)으로 검증 불가 — 공공데이터 오픈API로만 가능.
  - 배달앱 MAU(배민 2249만·쿠팡이츠 1249만·요기요 397만 하락) 시점 갱신은 minor라 보류.
  - 로열티 필드가 만원 정액이라 정률(도미노 6%·써브웨이 8%·투썸 3% 등) 표현 한계 — 정률/정액 메타필드 추가 검토.

## 4.10 벤치마크 정직성(출처·추정 라벨) 보강 (2026-06-05)
공공데이터 API 발급 난이도로 자동검증은 보류하고, **"거짓 숫자로 신뢰 잃지 않기"** 원칙에 따라 사용자에게 보이는 매출/비용 숫자에 **출처·기준연도·추정 여부**를 명시. 핵심 리스크는 "상위 매장 매출"이 실측처럼 보이지만 실제는 `평균×배수` 모델 추정이라는 점.
- **데이터 레이어 `franchise-benchmarks.ts`**: `FRANCHISE_BENCHMARK_PROVENANCE` 상수 신설(source·disclosureYear=2023·modeledNoteKo·estimateNoteKo). 타입에 `yearReported?`/`isEstimate?` 추가 + topStore가 모델 추정임을 주석 명시. 공개 정보공개서 매출이 없는 **비외식 9개 브랜드(준오·이가자·블루클럽·애니타임·커브스·클린바스켓·워시엔조이·토즈·프렌즈스크린골프)에 `isEstimate: true`** 플래그.
- **웹 `AiCoachCard.tsx`**: "상위 매장" → **"상위 추정"** 라벨 변경 + 비교바 하단에 출처·기준연도·캐비엇 푸트노트 추가(프랜차이즈=상위매장 모델추정/브랜드추정, 업종=상·하위 분포추정 — 경로별 정확 분기).
- **iOS `IndustryBenchmarkRegistry.swift`**: `IndustryBenchmarkProvenance`(source·disclosureYear·distributionNoteKo) 신설. `WeeklyPulseView` 출처 라벨에 기준연도+분포추정 캡션 추가.
- **iOS `FranchiseView.swift`**: `FranchiseBrandView`에 costVerified/costSource/dataYear/confidence 추가 + 상세시트 `initialCostBlock`에 **정직성 푸터(검증/추정 칩·기준연도·출처·신뢰도)** 신설 — 웹 FranchiseDetailModal 1:1 패리티.
- **이미 잘 되어있던 곳(추가 작업 불필요)**: `franchise-brands.json`(costVerified/costSource/dataYear/sources/confidence 풀 보유) + 웹 FranchiseDetailModal 풀 라벨 렌더. `cluster-budget-benchmarks.ts` + 웹 BudgetInsightCard(출처·추정치칩·연도 렌더). 웹 SocialBenchmarkCard·iOS WeeklyPulse 출처 라벨.
- **웹·앱 동일화 추가(2026-06-05, "웹과 앱은 똑같아야" 원칙)**:
  - **창업유형 단계**: 웹 `StartupTypeSelectionStage`는 데이터연도만, iOS `StartupTypeStageView`는 출처만 표시하던 비대칭 → 양방향으로 **둘 다 {출처 + 데이터 기준연도}** 표시하도록 맞춤(iOS에 `데이터 기준 {dataYear}년` 추가, 웹에 `출처: {costSource}` 추가).
  - **업종 벤치마크**: 웹 `SocialBenchmarkCard`(출처만) → iOS `WeeklyPulse`와 동일하게 **기준연도 + "상·하위10% 분포 추정" 캡션** 추가.
- **검증**: shared tsc ✓ / web tsc ✓ / iOS xcodebuild(iPhone 17 Pro) BUILD SUCCEEDED ✓ (전 변경 후 재빌드 통과).
- **브랜드별 프랜차이즈 벤치마크 카드 iOS 포팅 완료(2026-06-05)**: 웹 `AiCoachCard`의 브랜드 비교바를 iOS에 1:1 포팅.
  - **Codegen**: `scripts/gen-franchise-benchmark-swift.mts`(tsx) — 웹 `franchise-benchmarks.ts`를 import해 `FoundOneCore/FranchiseBenchmarkRegistry.swift`(34개 브랜드 + `FranchiseBenchmarkProvenance`) 자동 생성. 전사 오류 0. **수정은 웹 SSOT 후 재생성**(직접 편집 금지). costStructure·regionalVariance는 iOS 미렌더라 생성 제외.
  - **카드**: `FoundOneFeatures/WeeklyPulse/FranchiseBenchmarkCard.swift` 신설 — 내 매장(예상 월매출=일평균×26) vs 같은 브랜드 평균/**상위 추정** + 상위매장 비결 + 출처·기준연도·추정 푸트노트. `WeeklyPulseView`에 IndustryBenchmarkCard 다음 배치(`@AppStorage("stage.franchise.selectedBrandId")` + 벤치마크 존재 + 기록 3일+ 가드).
  - 🔴 **부수 버그 수정(웹+iOS 동시)**: `franchise-benchmarks.ts`의 brandId 13개가 `franchise-brands.json` canonical id와 불일치 → **웹 `getFranchiseBenchmark(selectedBrandId)`도 그 브랜드들에서 카드 미표시**였음(잠재 버그). 10개 id 정렬(goobne-chicken→goobne, hosik-two-chicken→hosik-chicken, hansot→hansot-lunchbox, gimgane→kimgane, paik-dabang→paiks-dabang, ediya→ediya-coffee, dominos-pizza→dominos, leekaja-hairbis→leekajahair, wash-enjoy→washnjoy, friends-screen-golf→friends-screen). 매칭 21→31/34.
  - **orphan 3 전부 해결(2026-06-05, WebSearch 실태조사 후)** → 매칭 31→**33/33(orphan 0)**:
    - **파파존스**: 실제 가맹사업 확정(가맹개시 2004.12, 가맹226/직영13=94% 가맹, 다점포율 45%, 공식 가맹모집 페이지, 로열티 매출 5%). **`franchise-brands.json`에 신규 추가**(id papa-johns, 창업 2.3억·가맹비 1100·평균매출 5.9억·로열티 246만(5% 환산)·정보공개서 2022·costVerified·sources 5건·confidence medium). 벤치마크 월평균 4725→4917, top 11340→11801 정합.
    - **클린바스켓**: 가맹 아님(세탁 O2O=직영 플랫폼, 유일 세탁가맹은 크린토피아). **벤치마크 제거**(가짜 데이터 모델, kumon/petbox와 동일 원칙).
    - **toc-study-cafe**: 작심(`zaksim-study`, 이미 카탈로그)이 스터디카페 1위 가맹. **벤치마크를 zaksim-study로 매핑 + 월 5,000만(과대)→867만(정보공개서 연 1.04억) 정정**, isEstimate 제거, 작심 실제 차별점(픽코 무인시스템)으로 operationalInsights 갱신.
  - 검증: web/shared tsc ✓ · iOS BUILD SUCCEEDED ✓ · brandId 매칭 33/33.
  - **작심 매출 불일치 보정(2026-06-05)**: 카탈로그 `zaksim-study.avgAnnualRevenueWon` 10400(월867)이 자체 roadmapNote "월 1,000~1,500만/연 1.2~1.5억"과 불일치 → **13500(연 1.35억=월 1,125, 정보공개서 범위 중간값)으로 보정**. 벤치마크도 zaksim avg 867→1125·top 2080→2700 정합. 카탈로그↔벤치마크↔설명문 3자 일치.
  - 검증: web/shared tsc ✓ · iOS BUILD SUCCEEDED ✓.
  - **계산 차이(의도적)**: iOS는 옆 IndustryBenchmarkCard와 일관성 위해 projectedMonthly(일평균×26) 사용. 웹 AiCoachCard는 당월 raw 합계. 동일 화면 내 일관성 우선.
- **남은 minor**: iOS `FranchiseBrandCard` 그리드(목록)는 라벨 없음(웹도 목록은 요약, 상세에 풀라벨이라 패리티 일치).

## 4.11 지원사업(정책자금) 정확성·점수·발굴 (2026-06-05)
3개 에이전트 WebSearch 검증 후 `startup-programs.ts`(SSOT) 정정·보강. 79→**92개**. iOS json codegen 신설로 동기화.
- **① 정확성 정정(WebSearch 검증)**:
  - 🔴 **대환대출**: "금리 3.5-4.5%/7년" → **연 4.5% 고정/최대 10년**(loanDetails termMonths 84→120).
  - 🔴 **TIPS**: 글로벌TIPS "50억" → **4년 최대 60억**(+스케일업 30억 신설 반영). 일반 R&D 8억은 유지.
  - 🔴 **재도전특별자금**: "최대 1억" → **유형별 7천만~2억**(기준금리 연동, limitWon 1억→2억).
  - **청년농업인 영농정착**: status upcoming → **open**(2026 2차 6/1~7/10).
  - **사회적기업가 육성**: "최대 5천만" → **평균 5천만/초기창업형 최대 8천만**.
  - (참고: SEMAS 자금 다수가 분기 변동금리인데 고정범위로 표기됨 — 큰 오류는 아니나 추후 "기준금리 연동" 라벨 권장.)
- **② 점수 일관성**: 매칭 부스트 중 addReason 누락 4건(isUrgentCrisis+20, medium private/corp+6, large grant+6, redemption+25)에 사유 추가 — 웹+**iOS match() 동시 미러링**(손수 포팅 복제본이므로). 점수 0~100 클램프·2종(matchScore/personalFitScore) 구조는 일관. **age 이중가산(maxAge+15 & youth+20), smallBiz 이중(+10 & 사이즈+12)은 "프로그램속성 vs 사용자속성" 별개 신호라 의도적 레이어링으로 판단(버그 아님)**.
- **③ 신규 발굴 13개 추가**(WebSearch 검증, web+iOS): 소상공인 온라인판로·스마트상점·**도약(舊 로컬크리에이터+강한소상공인 통합)**·신사업창업사관학교, **지역신용보증재단 보증(상시 open)**, **KAIST OverEdge(오엣 — AI에이전트 1인창업, 6/15 마감, 사용자가 본 광고)**, 혁신소상공인 AI 활용지원, 창업중심대학, 생애최초 청년창업, 여성창업경진대회, IP나래·디딤돌, 재창업자금(중진공), 관광벤처.
- **iOS 동기화 복구**: `scripts/gen-startup-programs-json.mts`(tsx) 신설 — `startup-programs.ts` → `startup-programs.json` 자동 추출(기존 수동 추출 대체). 92개 확인.
- **검증**: shared tsc ✓ · 점수 테스트 5/5 ✓ · web tsc ✓ · iOS BUILD SUCCEEDED ✓.
- **남은 발굴 후보(미추가, 원하면 추가)**: 청년상인·청년몰, 수출바우처/내수기업화, 스마트공장, 기술보증기금 보증, 소셜벤처 투자역량, 지자체(부산 busanstartup·대구 w-startup), GRAVITY(4대 과기원)·SNU BIG·고려대 GMEP, NIPA AI 통합바우처(소상공인 트랙), AI인재 실증형 창업패키지.
- **남은 동기화 부채**: DB seed `supabase/migrations/20260327_000028_seed_support_programs.sql`은 79개 시드(정적 배열이 런타임 SSOT라 표시엔 무영향). Supabase 복사본 쓰는 경로 있으면 재시드 필요.

## 4.12 지원사업 2차 — 대량 발굴 + 추천 로직 감사·수정 (2026-06-05)
- **대량 추가 29개 (92→121)**: 지자체 12(부산·대구여성·인천·대전·광주·울산·경기·강원·충남·전북·경남·제주 — `regions` 태깅), 분야별(스마트공장·수출바우처·기보/신보 보증·콘텐츠코리아랩·중소환경(기후)·K-바이오랩허브·외식인큐베이팅·식품스마트공장), AI(NIPA AI바우처 소상공인·초격차1000+·딥테크챌린지), 소상공인(백년소상공인·전통시장·자영업 고용보험·두루누리), 학생창업유망팀. **업종전용은 우리 enum(food/retail 등)에 맞을 때만 industries 설정**(manufacturing/content 토큰은 hard-filter 전멸 방지 위해 미설정).
- **추천 로직 감사(2 에이전트, web+iOS)** — 엔진(getMatchedProgramsV2/getRecommendedPrograms)은 정교하나 **호출부가 criteria를 빈약하게 채워 추천이 generic** 했음:
  - 🔴 **[P0 수정완료] capital 무효 버그**: `criteria.capital`이 매처에서 *전혀 안 읽혀* 로드맵 예산단계 추천이 예산과 무관했음. → 자본(원) 적을수록 정부 정책자금(현금·보증·보조금) 우대하는 보정 추가(<3천만 +15 / <1억 +8). **웹 matcher + iOS Swift match() 동시 미러링**. 점수 테스트 5/5 유지.
  - 🟡 **[P0 제품갭] age 미수집**: `sajangAge`가 스토어/입력 UI에 아예 없어 `age`는 항상 undefined → 청년 우대(+20)·maxAge 자격 **죽어있음**. 코드 스레딩이 아니라 **나이 입력 필드(온보딩/프로필) 신설 필요** — 가짜 연결 안 함. 별도 기능.
  - 🟡 **[P1] iOS 신용/폐업/장애 입력 부재**: 웹 PolicyFundMatchCard엔 ncbScore/consideringClosure/isDisabledOwner 칩이 있으나 iOS엔 없음 → 해당 부스트가 iOS에서 전부 죽음(웹↔iOS 패리티 갭). 펀딩페이지(GuidesView)도 위기/신용 칩 없음 → low-credit/closure/operation 부스트 미발화.
- **검증**: shared tsc ✓ · 점수 테스트 5/5 ✓ · web tsc ✓ · iOS BUILD SUCCEEDED ✓ · json 121개 동기화.
- **다음 권장(추천 로직 완성)**: ① 나이 입력 필드 신설(youth 매칭 활성화) ② iOS에 신용/폐업 입력(PolicyFundMatchCard iOS 포팅) ③ 펀딩페이지에 위기·신용 칩 노출.

## 4.13 추천 로직 완성 — 나이·신용·폐업·장애 입력 (2026-06-05)
§4.12 감사에서 죽어있던 age/credit/closure 신호를 **실제 입력·영속·매칭 반영**으로 살림. **민감 PII(나이·신용점수)는 서버 미전송 — 로컬 전용**(웹 localStorage / iOS UserDefaults). 매칭이 클라이언트에서 돌아 로컬값으로 충분 + 프라이버시 안전.
- **웹**:
  - `profile-store.ts`에 `ownerAge`/`ownerNcbScore`/`ownerConsideringClosure`/`ownerIsDisabledOwner` 4필드 + 세터 + partialize(localStorage 영속).
  - **공유 컴포넌트 `OwnerProfileChips.tsx` 신설**(나이·폐업·장애·NCB 칩, profile-store 직결). PolicyFundMatchCard(인라인 칩 → 컴포넌트 교체) + **펀딩페이지 GuidesView(신규 노출)** 양쪽 사용 — SSOT.
  - GuidesView·PolicyFundMatchCard·**BudgetFundingMatchCard(로드맵 예산단계)** 3곳 criteria에 4필드 주입(primitive selector = #185 루프 회피).
- **iOS**:
  - `FundingProfileRepository.makeCriteria`: age/ncb/closure/disabled를 **UserDefaults("owner.*")에서 읽음**(종전 nil 하드코딩 → 실값). FundingMatchCriteria→StartupProgramMatchCriteria 매핑이 필드 보존 확인.
  - **`OwnerProfileChips.swift` 신설**(@AppStorage "owner.*" 동일 키, 나이/NCB 입력 alert + 폐업/장애 토글, 변경 시 loadPrograms 재매칭). iOS GuidesView body에 노출.
  - **BudgetSetupStageView**(iOS 예산단계)도 UserDefaults에서 owner 값 읽어 criteria 주입(웹 패리티).
- **검증**: shared tsc ✓ · 점수 테스트 5/5 ✓ · web tsc ✓ · iOS BUILD SUCCEEDED ✓.
- **효과**: 이제 나이 입력 시 **청년 정책자금(+20)**, NCB 입력 시 **신용취약(+30)/대환(+25)**, 폐업 토글 시 **희망리턴·재도전(+35/+25)**, 장애 토글 시 **장애인자금(+30)** 부스트가 웹·iOS 양쪽에서 실제 발화. capital(예산) 보정과 합쳐 예산단계·펀딩페이지 추천이 사용자 맞춤으로 작동.
- **남은 minor**: `salesDeclinePct`(operation 자금 +20)는 매출 데이터에서 산출하는 신호라 미연결(입력 아님). iOS도 매출 기반 계산 추가 시 활성화 가능 — 별도.

## 4.14 나이 수집 — 출생연도 + 넛지 + 프로필 필드 (2026-06-05)
"회원가입에 나이 물어볼까?" → **회원가입엔 안 넣음**(마찰·PII·로컬전용 정책 충돌). 대신 **점진적 수집**: 프로필 필드 + 펀딩 넛지. 사용자 선택: "프로필 선택 필드 + 넛지(추천)".
- **나이→출생연도(birthYear)로 표준화**: 정수 나이는 해 바뀌면 stale → `birthYear` 저장 + 매칭 시 `현재연도-birthYear`로 나이 계산. 웹 `profile-store.ownerAge`→`ownerBirthYear`, iOS UserDefaults `owner.age`→`owner.birthYear`. 헬퍼 `ageFromBirthYear()`(웹 export) / `computedAge`(iOS).
- **펀딩 넛지**: 출생연도 미입력 시 "💡 출생연도 알려주시면 청년(≤39)·시니어(40+) 전용 지원 더 정확히" 배너. 웹 GuidesView(조건부) + iOS OwnerProfileChips(`showNudge` prop, 펀딩만 true).
- **프로필 필드**: 웹 `surfaces/ProfileView.tsx`에 "사장님 정보(지원사업 매칭)" 카드 + iOS `ProfileView.swift` `ownerProfileCard` — 둘 다 OwnerProfileChips 재사용. 가입 마찰 없이 설정에서 입력 가능.
- 3 criteria 지점(GuidesView·PolicyFundMatchCard·BudgetFundingMatchCard) + iOS(makeCriteria·BudgetSetupStageView) 모두 birthYear→나이 계산으로 갱신.
- **검증**: shared tsc ✓ · web tsc ✓ · 점수 테스트 5/5 ✓ · iOS BUILD SUCCEEDED ✓ · 잔여 ownerAge 참조 0.

## 4.15 AI 모닝 히어로 강화 (P0+P1) — 진행 중 (2026-06-05)
사용자 목표: "진짜 사업에 도움되는 제안". 감사 결과 AI가 **미래를 못 봄**(이번 달 손익만 보고, 13주 위기·월급/세금 타이밍·매칭 정책자금·단골 지표는 앱이 계산해도 AI에 미전달). claude-api 스킬 가이드 적용.
- **✅ 1단계 AI 코어 (완료·검증: ai tsc ✓ web tsc ✓)** — `packages/ai/src/dashboard/`:
  - `actions.ts`: **temperature 0.3**(분산↓, sonnet-4-6은 temp 지원) + max_tokens 1536→**2048** + 출력 타입에 **`estimatedImpactWon`(정량 ROI)** 추가·파싱. 강건 JSON 파서 유지.
  - `prompt.ts`: DashboardContext에 **미래 신호 필드**(`cashflowCrisis`·`upcomingObligations`·`matchedPrograms`·`northStarMetric`·`dayOfWeek`·`previousAction`) 추가 + 렌더링 + 지침(정량 ROI·미래지향 우선순위·전일제안 후속). 출력 계약에 estimatedImpactWon 추가.
- **✅ 2단계 웹 배선 (완료·검증: web tsc ✓)** — `useDashboard.ts` payload에 6개 미래신호 주입:
  - dayOfWeek, northStarMetric(profile-store, 한국어 라벨), cashflowCrisis(`useCashflowStore.getState()` + `projectCashflow`/`detectCrisis` 재사용=DRY), upcomingObligations(고정비 dueDay + payDay, 14일내), matchedPrograms(getRecommendedPrograms 상위 2, 마감 제외), previousAction(액션→결과 루프).
  - **액션→결과 루프**: `services/morning-action-log.ts`(localStorage, 사용자별) 신설 — 응답 후 `recordTodayAction`(오늘 최우선 기록), 다음날 `getPreviousActionForPrompt`(전일 것만) → 프롬프트 후속.
  - 전달 경로 확인: route가 body 전체 통과 → `enrichDashboardContext`가 `{...base}` 보존 → 프롬프트 렌더. **AI가 실제로 미래신호 수신.**
- **✅ 3단계 웹 UI (완료·검증: web tsc ✓)** — AiCoachCard todayActions에 **"예상 +X만" ROI 배지**(estimatedImpactWon) 추가. 청록 배지로 "줄이세요"가 아니라 정량 효과 노출.
  - (보류) "했어요 ✓" done 버튼: AiCoachCard에 userId가 없어 supabase 경로 리스크 → 후속. **루프는 pending 상태로 이미 작동**(다음날 "다시 권하거나 대안"). done 버튼은 "결과를 묻고 다음 단계" 경로 추가용 enhancement.
- **✅ 4단계 iOS — 4a + 4b부분 (완료·검증: iOS BUILD SUCCEEDED)**:
  - **4a**: 응답 DTO `AIDashboardAction.estimatedImpactWon` + `AiAction.estimatedImpactWon`(+매핑) 추가 → TodayView actionCard에 **"예상 +X만" ROI 배지**(웹과 동일).
  - **4b부분**: TodayView가 보내던 ~7필드 → **운영 신호 5종 추가**(primeRate·weeklyChange·runway·operatingPhase·salesTrendDirection, mock 데이터로 계산). 백엔드 동일(route+packages/ai) + 입력 파리티 대폭 개선.
- **⏳ 남은 4b (미래 신호 struct 추가 필요)**: `AIDashboardContext`에 cashflowCrisis·upcomingObligations·matchedPrograms·northStarMetric·dayOfWeek·previousAction 필드(중첩 Encodable) 추가 + 배선 — cashflowCrisis(CashflowProjection+store sync), upcomingObligations(cashflowStore.settings.fixedExpenses), matchedPrograms(StartupProgramRegistry.recommend, async FundingProfileRepository), northStarMetric(@AppStorage "ge.northStar"=UserDefaults), dayOfWeek(Calendar), previousAction(iOS action-log UserDefaults 신설=web morning-action-log 미러). proactiveInsights/productCount는 iOS 데이터 없음(서버 추정).
- 핵심: **웹 완전 활성화 + iOS 배지·운영신호 파리티 완료.** iOS 미래신호 6종이 마지막 파리티 항목.

## 4.16 웹↔앱 전체 데이터 동기화 워크스트림 (2026-06-06)
원칙: **모든 사용자 데이터는 웹·앱 동기화**(어떤 서비스도 "웹 입력이 앱에 안 보임"은 없음). 감사 결과 **이미 ~87% 동기화**(user_store_data·business_profiles·roadmaps + 웹 realtime). 진짜 갭:
- **✅ Phase B 완료·검증 (web/shared tsc ✓)**: 웹 로컬 전용 3종을 Supabase 동기화.
  - SQL `supabase/migrations/20260606_add_promo_playbook_agent_columns.sql`(promo_codes·playbook_checklist·agent_settings jsonb, idempotent) — **⚠️ prod 실행 필요**.
  - `store-data.ts` 타입+FIELD_TO_COLUMN, marketing-store(`setPromoCodes`/`setPlaybookChecklist`)·agents-store(`setEnabledAgents`) bulk setter, collectStoreData(write)+applyStoreData(restore) 배선. → 프로모코드·플레이북·에이전트설정 기기간 보존.
- **⏳ 남은 갭 (큰 임팩트 순)**:
  - **A. iOS realtime 구독 (최우선)**: iOS가 user_store_data·business_profiles·roadmaps를 realtime 구독 안 함 → **웹 변경이 앱에 즉시 안 보임**(재실행해야). 이게 사장님 체감 "안 보임"의 진짜 원인. Supabase RealtimeClient(Swift) + 5초 throttle refetch. (웹←iOS는 이미 동작.)
  - **C. iOS 단계입력 ~70 @AppStorage → stage_decisions.inputs**: 스테이지 입력이 로컬이라 웹↔iOS 로드맵 진행 어긋남. 대(1~2일).
  - **D. PII 봉투암호화 동기화** (사용자 결정: 암호화 동기화): owner.birthYear/ncbScore/consideringClosure/isDisabledOwner(웹 profile-store localStorage·iOS UserDefaults) → 봉투암호화(PORTONE_KEK 인프라 재사용) 컬럼으로 동기화. "모든 데이터 동기화" 원칙 + 프라이버시 양립.
  - (proactiveInsights·productCount·agent proposals는 iOS 데이터 없음/ephemeral — 서버 추정·동기화 제외 정당.)
- **설계 메모(사용자 논의)**: "같은 숫자" 보장의 정석은 **신호 계산을 서버(packages/ai/route)로 이동** → 클라는 raw만 전송 → 웹·iOS 100% 동일 + iOS Swift 글루 최소화. AI 미래신호(§4.15)도 이 방향으로 리팩터 시 iOS 글루 거의 불필요. 단, 잔고·NSM 등 일부 로컬값은 raw 전송 필요(또는 Supabase 승격).

## 5. 선택적 정리(backlog, 가짜 아님)
- iOS `MockData` → `DashboardSnapshot` 리네이밍 + `AppRoot.swift:776` stale 주석 정리.
- iOS 히어로 Row2 NSM을 스타트업이면 런웨이로(웹과 완전 일치).
