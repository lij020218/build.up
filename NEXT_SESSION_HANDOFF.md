# NEXT SESSION HANDOFF — 2026-06-04

> 이전 2026-06-02 핸드오프 대체. 이번 세션에서 한 일 + 다음 세션이 바로 이어갈 백로그 명세.

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

## 5. 선택적 정리(backlog, 가짜 아님)
- iOS `MockData` → `DashboardSnapshot` 리네이밍 + `AppRoot.swift:776` stale 주석 정리.
- iOS 히어로 Row2 NSM을 스타트업이면 런웨이로(웹과 완전 일치).
