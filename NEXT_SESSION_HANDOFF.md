# NEXT SESSION HANDOFF — 2026-06-02

> 이 세션에서 한 일 + 다음 세션이 바로 이어갈 작업 명세. 빌드/검증 명령·파리티 기준값·디자인 원칙 포함.
> (이전 2026-05-25 핸드오프는 모두 완료되어 대체함.)

## 0. 절대 원칙 (메모리에도 있음 — feedback_web_mobile_sync.md)
- **웹·모바일 내용 동일(SSOT).** 새 입력 추가 시 반드시 정식 `user_store_data`/`business_profiles` 컬럼에 upsert까지 묶을 것. inputs JSON만으론 웹과 sync 안 됨.
- iOS는 화면별 수동 저장이라 **누락이 기본값** → 추가 시 `persist*` 헬퍼 호출 잊지 말 것.
- UI: **Apple 스타일·여백·모바일에 욱여넣지 않기·시뮬레이터 시각 검증.** lavender-mist 배경 + 미드나잇 네이비 액센트, 신호등 컬러 금지.
- 코드 작업 전 WebSearch로 최신 자료 조사 (글로벌 규칙).

## 1. 이번 세션 완료 (모두 main 푸시됨)
- 비밀번호 재설정: 웹 콜백 in-page + iOS 앱 네이티브 딥링크(`foundone://auth/reset`).
- 데이터 동기화(write-gap 근절): store_name / business_open·close_time / cpa_decision / tax_settings.vatType(+과세 선택 UI 신설) / ops_selections·ops_pos_checks / industry_category_id·sub_industry_id·startup_type(business_profiles) / business_launched(_date).
- 운영 채널 공유 SSOT: `packages/shared/src/operations-channels.json`(+ts) — 웹·iOS cluster-aware. (iOS `OperationsChannelRegistry`)
- **로드맵 5→11 단계 점프 버그 수정**: iOS `BUStageShell`이 `EnvironmentValues.roadmapStageOrder`(AppRoot 주입 = `roadmapStore.pathStageIds`)로 단계 번호 중앙 계산. 웹은 이미 `pathStepNumber`(traverseUserPath)로 정상이었음.
- 캐시플로 P1·P2·P4a (아래 2번).

## 2. 캐시플로 이식 — 진행 상황
재무 민감. 웹 SSOT: `apps/web/app/lib/services/cashflow-projection.ts`, `apps/web/app/lib/stores/cashflow-store.ts`, `apps/web/app/lib/components/dashboard/Cashflow*.tsx`.
Supabase: `user_store_data.cashflow_settings` (jsonb, **내부 키 camelCase**: currentBalance·currentBalanceUpdatedAt·salesChannels·fixedExpenses·crisisThresholdDays·notifyOnCrisis·dailyMorningBriefing·vatReserveEnabled·setupCompletedAt).

### ✅ 완료 (커밋)
- **P1** `packages/shared/src/cashflow-presets.json(+.ts)` — 채널 프리셋(수수료·정산주기) + 업종 기본 믹스. 웹 cashflow-store가 import. iOS `CashflowPresetsRegistry`(FoundOneCore, Resources 심볼릭 링크).
- **P2** `apps/ios/Sources/FoundOneData/Cashflow/CashflowModels.swift` (CashflowSettings/SalesChannel/FixedExpense, 빈 `{}` 안전 디코딩) + `CashflowRepository.swift` (actor: `load(defaultCategoryKey:)` / `save(_:)` → cashflow_settings).
- **P4a** `apps/ios/Sources/FoundOneData/Cashflow/CashflowProjection.swift` — `project(...)` / `detectCrisis(...)`. 웹 1:1 포팅, node 파리티 검증 통과.
  - **파리티 기준값(회귀 검증용)**: 잔고 1,000,000 · 일매출 300,000(최근3일) · 현금100% 채널 · 월세 5,000,000@dayOfMonth5 · today=2026-06-01 → 6/5 endBalance **−2,500,000**; detectCrisis(thr=3): willCrisis=false, daysUntilCrisis=4, shortfall=2,500,000, safeDays=4, lowestDay=2026-06-05.
  - ⚠️ 웹 `computeDayInflow`는 settlementDays로 입금일을 **시프트하지 않음**(영업일마다 그날 평균매출 정산). **임의 개선 금지** — 웹과 동일 유지.

### ✅ 완료 (커밋 대기 — 아직 push 안 함)
- **P3 — 설정 시트 UI**:
  - `apps/ios/Sources/FoundOneData/Cashflow/CashflowStore.swift` — `@MainActor ObservableObject`, CashflowRepository 래핑. `@Published settings/isLoaded/saveStatus`, `load()`/`save(_:)`. repository=nil → 데모/프리뷰 메모리 전용. P3·P4b 공유 SSOT.
  - `apps/ios/Sources/FoundOneFeatures/DailyHub/CashflowSetupSheet.swift` — 웹 4섹션+audit 미러. 잔고(만원→원)·12채널 토글/비율/정산·수수료칩/rateNote ⓘ·합계배지(99~101%), 고정비 CRUD, 위기감지 슬라이더(1~14), VAT·알림 토글. working copy 스냅샷 → "설정 완료/저장" 버튼에서 setupCompletedAt/currentBalanceUpdatedAt 스탬프 후 `store.save`. `.interactiveDismissDisabled(hasChanges)`, keyboard "완료" 툴바.
  - **와이어링**: AppRoot `loadDashboardIfNeeded`에서 `CashflowStore(repository:CashflowRepository, defaultCategoryKey: webCategoryId(from: store.category))` 생성·load → MainTabs `cashflow:` → `TodayView(cashflowStore:)`. 데모도 `demoCashflowStore`(repo nil) 주입.
  - **게이팅**: `TodayView` 카드 5번이 `CashflowSection`(@ObservedObject store) 으로 분기 — `settings.isConfigured` true면 `CashflowHeroCard`, 아니면 `CashflowSetupPrompt`(설정 프롬프트) → 시트 present. store 관찰이라 저장 직후 자동 전환.
  - 빌드 BUILD SUCCEEDED, 시뮬레이터에서 설정 시트(food 업종 기본 믹스 자동 채움) 시각 검증 통과.

- **P4b — 위기 RadarCard + 14일 타임라인 + 상세 시트** (커밋 대기):
  - `apps/ios/Sources/FoundOneFeatures/DailyHub/CashflowRadarCard.swift` — `CashflowRadarCard`(헤더+설정톱니, 3타일 오늘/7일/14일 endBalance@0/6/13, 14일 미니 타임라인[정상 `.midnight`·위기<0 `.negative`, 신호등 컬러 금지], 다음 입금/지출 `EventTile`, 위기경고[D-day·crisisDay·shortfall], stale 경고[currentBalanceUpdatedAt 3일+ → 수정], "14일 상세 보기") + `CashflowDetailSheet`(요약 입금/지출/순변화 3타일, VAT 노트, 채널별 14일 입금, 고정비 14일 출금, 일별 흐름 타임라인) + 공용 `formatMoney`.
  - `TodayView.CashflowSection`: configured 분기를 `CashflowProjection.project(store.settings + recentDailyEntries + fallbackMonthlyCostsTotal + vatRate)` → `detectCrisis` → RadarCard/DetailSheet 로 교체. recentDailyEntries=`mock.entries.map{CashflowDailyEntry(date:sales:)}`, fallbackMonthlyCostsTotal=`mock.costs.total`.
  - ⚠️ **vatRate=0.10 고정 (TODO)**: iOS 에 `tax_settings.vatType` **읽기 접근자 부재**(StoreProfileRepository 는 `persistVatTypeForCurrentUser` 쓰기 전용). 간이과세 0.03 반영하려면 read 경로 필요 — 아래 ② 중앙 영속화 레이어와 함께 처리 권장. vatReserveEnabled 기본 false 라 대부분 영향 없음.
  - ⚠️ `CashflowCrisis` 동명 타입 2개(FoundOneCore.HeroResolver / FoundOneData.CashflowProjection) → RadarCard 에서 `FoundOneData.CashflowCrisis` 모듈 한정.
  - 빌드 BUILD SUCCEEDED. 시뮬레이터 검증: balance 200만+오늘입금77만=오늘 277만 / 공급처6M@6-3 → 위기 D-1·부족 246만 / DetailSheet 요약 입금775·지출1100·순-324만 모두 엔진과 일관 확인.

### ⏳ 남음 (캐시플로)
- 없음 (P1·P2·P3·P4a·P4b 완료). 잔여 개선: 위 **vatRate TODO**, 크리시스 행동 상세(웹 `CashflowCrisisActions` 7개 remedy)는 카드/시트에 미이식(현재 경고문 1줄 + 행동 힌트만).
- 웹 ref: `CashflowHeroCard.tsx`(14일 미니바·위기경고·다음입금/출금), `CashflowDetailSheet.tsx`(14일 상세), `CashflowCrisisActions.tsx`(위기 행동).
- 입력 조립: settings=`CashflowRepository.load`, recentDailyEntries=DashboardStore.entries→`CashflowDailyEntry(date,sales)`, fallbackMonthlyCostsTotal=`store.costs.total`, vatRate= tax_settings.vatType=="simplified" ? 0.03 : 0.10.
- `CashflowProjection.project(...)` → `detectCrisis(...)`. 표시: 현재잔고·14일후 잔고·위기경고(crisisDay/D-day/shortfall)·14일 미니 타임라인·다음 입금/출금·"14일 상세".
- **게이팅**: `settings.isConfigured`(setupCompletedAt != nil)일 때만 HeroCard. 아니면 "현금흐름 설정하기" 프롬프트 → P3 시트.
- 배치: TodayView(영업개시 후) 상단. 위치/스타일은 시뮬레이터로 확인.

## 3. ② iOS 중앙 영속화 레이어 (재발 방지) — ✅ 완료 (커밋 대기)
- **결정**: 핸드오프 원안(@foundone/shared COLUMN_PERSISTENCE_MAP)과 달리 **iOS-only Swift projector** 채택. 이유: 변환이 이질적(직접/"HH:00"/다른 테이블/JSONB 머지)이라 기존 persist 헬퍼에 이미 인코딩됨 → 공유 JSON은 split-brain. 웹 `FIELD_TO_COLUMN`은 웹 SSOT로 그대로 유지.
- **신규** `apps/ios/Sources/FoundOneData/Repositories/StageInputProjector.swift` — `project(_ inputs:)`가 stage 입력을 정식 컬럼으로 자동 투영(기존 헬퍼 위임, idempotent). 투영 키: storeName→store_name / openHour+closeHour→business_*_time / startupType→business_profiles.startup_type / vatType·taxTypeChoice→tax_settings.vatType / cpaDecision→cpa_decision. **신규 투영 필드는 여기 `project`+`projectedKeys` 한 곳만 수정.** `#if DEBUG audit(mergedInputs:)`(컬럼 누락 경고).
- **호출 지점**: `RoadmapStore.advanceToNext`/`saveStageEdit` **에서만** `StageInputProjector.project(inputs)`. ⚠️ completeStage/setInput/syncFromRemote 엔 절대 넣지 말 것(원격 hydration echo 방지).
- **확인된 버그 자동 수정**: StartupTypeStageView 가 startupType 을 inputs 로만 넘기고 컬럼 투영 안 하던 것 → projector 가 자동 투영(business_profiles.startup_type).
- **수동 persist 제거**: BizRegistration/BusinessModel/RegistrationSetup/InsuranceTax 의 advance·editSave 경로 수동 호출 제거(단일 경로화). **유지**: in-place 컨트롤(BizReg storeNameFinal 토글, RegSetup taxTypeChip onChange), OperationsSetupStageView(ops/pos는 [String:Bool] 별도), AppRoot 온보딩 경로.
- **vatType 읽기 접근자 추가**(P4b TODO 해소): `StoreProfileRepository.loadVatType()` + `static vatTypeForCurrentUser()`. TodayView `CashflowSection`이 `.task`로 읽어 vatRate= simplified?0.03:0.10 (실패 0.10 fallback).
- **AppRoot**: `syncFromRemote()` 직후 `#if DEBUG auditProjectionCoverage()` 호출.
- 빌드 BUILD SUCCEEDED, 데모 런치 크래시·회귀 없음(audit/projector는 무인증 시 no-op). ⚠️ audit 로그 실검증은 인증 세션 필요 → 헤드리스 미검증.
- 남은 웹 전용 미이식 입력(참고, 후속): inventory_items, employees, products/service_menu_items, vendor_selections, soft_open/tax/loan_checks, monthly_delivery_sales, online_*; iOS 읽기전용: industry_specifics, peopleDirectory 급여·4대보험, 월비용 카드. `franchiseBrandId` 정식 컬럼 부재 → 투영 제외(후속 검토).

## 4. 빌드·검증 명령
```bash
# iOS 빌드 (성공 판정: XCODE_EXIT + grep BUILD SUCCEEDED)
cd "apps/ios" && xcodegen generate && xcodebuild -project FoundOne.xcodeproj -scheme FoundOne \
  -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -derivedDataPath /tmp/foundone-dd build
# 새 파일/리소스 추가 시 xcodegen generate 먼저. 새 JSON은 packages/shared/src 에 두고 Resources에 심볼릭 링크.
# shared/web typecheck
pnpm --filter @foundone/shared build && (cd apps/web && npx tsc --project tsconfig.json)
# 캐시플로 엔진 파리티 재검증: apps/web 에서 .mts 스크립트로 projectCashflow import 후 node --experimental-strip-types 실행
```
- 시뮬레이터 시각 검증: `xcrun simctl install booted <앱경로>` + `xcrun simctl io booted screenshot /tmp/x.png` → Read.

## 5. 사용자 액션 (코드는 끝, 사용자/대시보드 작업 미완)
- Supabase Redirect URLs에 `foundone://auth/reset` 추가 (앱 비번 재설정 동작 조건). URL Config: https://supabase.com/dashboard/project/gwnwgzeweofsxxftwjcl/auth/url-configuration
- **Vercel 재배포**: foundone.dev가 옛 빌드 서빙 중 → 이번 세션 웹 작업(비번찾기·운영채널 cluster-aware 등) 반영하려면 재배포 필요. 자동배포 연결 여부도 점검.
- Supabase 커스텀 SMTP(Resend) — 사용자 "다 했어".

## 핵심 정보
- Supabase: gwnwgzeweofsxxftwjcl.supabase.co · 프로덕션 도메인: foundone.dev · 이메일: lki720412@gmail.com
- iOS bundle: com.foundone.mobile · 빌드 dest: iPhone 17 Pro
