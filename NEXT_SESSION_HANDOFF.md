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
| **동종업 벤치마크** | 공정위 매출 백분위 데이터 iOS 미존재(웹: `@foundone/shared` `getIndustryBenchmark()`) | shared franchise-benchmarks → iOS 레지스트리 codegen 포팅(웹TS→Swift 패턴) 후 백분위 계산 | 주간점검 `WeeklyPulseView` |
| **4대보험 시뮬** | ⚠️ 요율 정확도(옛 요율 버그 이력) | iOS `InsuranceTaxSetupStageView.swift` 요율/계산 **재사용**(중복정의 금지) | 성장 `GrowthCards` |
| **코칭 14일 일지** | iOS가 일별 신호 **저장 안 함**(웹: Supabase coaching_history) | iOS 영속 레이어부터 — HeroResolver 결과 매일 1건 저장→14일 표시 | 오늘상세/홈 히어로 아래 |
| **SaaS 핵심지표** | GA4/webhook **연동 데이터** 필요 | 미연동 시 정직한 "연동 필요" 빈상태만(가짜 금지). 웹 `useUnifiedSaasMetrics` 참고 | 주간점검/내가게 |
| **구독 플랜 관리** | CRUD+webhook 무거움·저가치 | 후순위(읽기전용부터) | 내가게 |
| LOW(미사용안내·인기상품·최근활동·주간시간·내보내기) | 보조 | 후순위 | — |

**권장 순서**: (1) 4대보험(재사용=안전) → (2) 동종업 벤치마크(데이터 포팅) → (3) 코칭일지(영속 인프라) → (4) SaaS 빈상태 → (5) 나머지.

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

## 5. 선택적 정리(backlog, 가짜 아님)
- iOS `MockData` → `DashboardSnapshot` 리네이밍 + `AppRoot.swift:776` stale 주석 정리.
- iOS 히어로 Row2 NSM을 스타트업이면 런웨이로(웹과 완전 일치).
