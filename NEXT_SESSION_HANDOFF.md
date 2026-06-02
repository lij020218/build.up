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

### ⏳ 남음
**P3 — 설정 시트 UI** (iOS, 웹 `CashflowSetupSheet.tsx` 대응):
- 입력: currentBalance(원), salesChannels 비율 슬라이더(합 ~100%, isActive 토글, rateNote ⓘ), fixedExpenses 추가/편집(label·amount·dayOfMonth 1~31·category), crisisThresholdDays(기본3), vatReserveEnabled.
- 진입 시 미설정이면 `CashflowRepository.defaultChannels(forCategoryKey:)`로 업종 기본 믹스 채우기.
- 저장: `CashflowRepository.save(settings)` + **setupCompletedAt = now ISO**. 잔고 변경 시 currentBalanceUpdatedAt 갱신.
- 디자인: 섹션 카드(BUCard), Apple 스타일, 슬라이더 합 100% 보정 UX.

**P4b — 위기 HeroCard + 14일 타임라인** (iOS `TodayView`):
- 웹 ref: `CashflowHeroCard.tsx`(14일 미니바·위기경고·다음입금/출금), `CashflowDetailSheet.tsx`(14일 상세), `CashflowCrisisActions.tsx`(위기 행동).
- 입력 조립: settings=`CashflowRepository.load`, recentDailyEntries=DashboardStore.entries→`CashflowDailyEntry(date,sales)`, fallbackMonthlyCostsTotal=`store.costs.total`, vatRate= tax_settings.vatType=="simplified" ? 0.03 : 0.10.
- `CashflowProjection.project(...)` → `detectCrisis(...)`. 표시: 현재잔고·14일후 잔고·위기경고(crisisDay/D-day/shortfall)·14일 미니 타임라인·다음 입금/출금·"14일 상세".
- **게이팅**: `settings.isConfigured`(setupCompletedAt != nil)일 때만 HeroCard. 아니면 "현금흐름 설정하기" 프롬프트 → P3 시트.
- 배치: TodayView(영업개시 후) 상단. 위치/스타일은 시뮬레이터로 확인.

## 3. 그 다음 — ② iOS 중앙 영속화 레이어 (재발 방지)
- 목표: 필드 추가 시 저장 누락 구조적 불가.
- 방안: `RoadmapStore.advanceToNext(inputs:)`에 **stage 입력 키 → user_store_data 컬럼 투영 맵**(알려진 키 자동 upsert) + `@foundone/shared`에 `COLUMN_PERSISTENCE_MAP` SSOT + 앱 시작 시 미저장 컬럼 경고.
- 현재는 `StoreProfileRepository.persist*ForCurrentUser` / `OnboardingProfileSync`로 개별 저장 중.
- 남은 웹 전용 미이식 입력(참고): inventory_items, employees, products/service_menu_items, vendor_selections, soft_open/tax/loan_checks, monthly_delivery_sales, online_*; iOS 읽기전용(편집 불가): industry_specifics(메뉴·상품·시술), peopleDirectory 급여·4대보험, 월비용 카드.

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
