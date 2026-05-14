# iOS 로드맵 Phase 2 — 다음 세션 인수인계

작성: 2026-05-14
이전 세션 마지막 커밋: `feat(ios/onboarding): 3-카드 시작 화면 + 업종 선택 + 기존 가게 등록`

---

## 목표 (Phase 2)

웹의 로드맵 stage 콘텐츠들을 모바일 viewport 에 맞게 iOS 네이티브로 미러.
**기준 path**: 외식업(사랑의 도시락) 17 stage. 우선순위 = 사장님 본인 사례.

업종(외식) path 17 stage 중 1번(industry-selection) 은 Phase 1 완료.
**남은 16 stage**:

| # | stageId | 웹 SSOT 파일 | 우선 |
|---|---|---|---|
| 2 | startup-type | (선택 1개) | P1 |
| 3 | business-model | (선택 1개) | P1 |
| 4 | target-customer-definition | `shared/TargetCustomerStage.tsx` | **P0** |
| 5 | budget-setup | (입력 폼) | P1 |
| 6 | permit-check | `offline/PermitCheckPanels.tsx` | P2 |
| 7 | location-candidates | (지도+추천) | P2 |
| 8 | contract-review | (체크리스트) | P2 |
| 9 | registration-setup | `offline/RegistrationSetupStage.tsx` | P2 |
| 10 | biz-registration | `offline/BizRegistrationPanel.tsx` | P2 |
| 11 | tax-guide | `shared-tail/TaxGuideStage.tsx` | P3 |
| 12 | loan-guide | `shared-tail/LoanGuideStage.tsx` | P3 |
| 13 | construction-setup | `offline/ConstructionSetupStage.tsx` | P2 |
| 14 | **menu-design** | `shared/MenuDesignStage.tsx` | **P0** |
| 15 | vendor-setup | `offline/VendorSetupStage.tsx` + `InitialOrderPlanCard.tsx` | **P0** |
| 16 | hiring-setup | `offline/HiringSetupStage.tsx` | P2 |
| 17 | insurance-tax-setup | `offline/InsuranceTaxSetupStage.tsx` | P2 |
| 18 | operations-setup | `offline/OperationsSetupStage.tsx` | P2 |
| 19 | pre-launch | `offline/PreLaunchStage.tsx` | P2 |

**P0 우선** (사장님이 직접 추가 요청 + 재고 카드 자동 연동 핵심):
- target-customer-definition (신규 stage, 사장님 명시)
- menu-design (신규 stage, 사장님 명시)
- vendor-setup + InitialOrderPlanCard (사장님 명시 — 공급처→재고 자동)

---

## 기반 (Phase 1 완료된 것)

### 데이터 모델
- `apps/ios/Sources/BuildUpFeatures/Roadmap/RoadmapStage.swift`:
  - 17 stage 외식 path 데이터 (RoadmapSampleData.stages)
  - stageId 기반 식별 (웹과 1:1)
- `apps/ios/Sources/BuildUpData/Stores/DashboardStore.swift`:
  - @Observable `category`, `storeName`, `businessLaunched` 등 보유
  - `setProfile(...)` 로 업데이트

### 화면 (이미 작동)
- `Onboarding/OnboardingChoiceView.swift` — 3 카드 (manual/ai/existing)
- `Onboarding/IndustrySelectionView.swift` — 12 카테고리 grid
- `Onboarding/ExistingStoreRegistrationView.swift` — 빠른 가게 등록
- `Roadmap/RoadmapView.swift` — 17 stage timeline (이미 존재, 카드 tap 시 detail sheet)

### 라우팅 (AppRoot.swift)
```
인증 + store 로드
  ↓
needsOnboarding?
  YES → OnboardingFlow (path .manual/.ai/.existing)
        └─ .manual → IndustrySelectionView → selectedTab=.roadmap
  NO  → MainTabs (운영 대시보드)
```

**현재 빈 부분**: IndustrySelectionView 에서 카테고리 선택 → MainTabs.roadmap 으로 가지만 RoadmapView 는 그냥 timeline 만 보여줌. **각 stage 를 탭하면 그 stage 의 입력 화면(StageDetailSheet 또는 NavigationStack push)이 떠야 함** — 이게 Phase 2 의 핵심.

---

## 작업 패턴 (Phase 2 한 stage 만드는 방법)

### 1. 웹 SSOT 분석
```bash
# 해당 stage 의 웹 컴포넌트 전체 읽기
apps/web/app/lib/components/stages/{offline|shared|startup}/{Stage}.tsx
```

### 2. 디자인 패턴 (CustomerDiscoveryStage 표준)
```
[KEY ACTION hero] — 미드나이트 그라데이션 + eyebrow + title + 3 mini-cards
  ↓
[StartupReferenceLabel] — 보조 라벨
  ↓
[StartupPageNav] — 4페이지 탭 (Why / Step1 / Step2 / Step3)
  ↓
[페이지별 콘텐츠] — 카드 + 입력 + AI 도구
  ↓
[StageWrapup] — done 4 + verify 5 + next 1
```

### 3. iOS 미러 컴포넌트 (모바일 최적화)
- 위치: `apps/ios/Sources/BuildUpFeatures/Roadmap/Stages/{StageName}View.swift`
- 디자인 토큰:
  - `BUColor.midnight` (#191970), `.midnightDeep`, `.midnight08`, `.midnightInk`
  - `BUSpacing.heroOuterPadding` (14), `.heroGap` (12), `.opsGap` (14)
  - `BURadius.heroOuter` (24), `.outerCard` (20), `.nestedCard` (18)
  - `BUFont.*` (헬퍼 modifier — `.buHeroEyebrowStyle()`, `.buNsmValueStyle()` 등)
- 모바일 변형:
  - 웹 4페이지 탭 → 모바일 vertical scroll (페이지 분할 X) 또는 swipe-able TabView
  - 웹 grid `repeat(auto-fit, minmax(280px, 1fr))` → 모바일 1-col 또는 2-col
  - 웹 hero 22px padding → 모바일 14-16px
  - 텍스트 폰트: 웹 13-14px → iOS 12-13.5px

### 4. 데이터 연결
사용자 입력은 `DashboardStore` 또는 새 stage-decisions store 에 저장:
- 옵션 A: DashboardStore 에 `decisions: [String: StageDecision]` 추가
  ```swift
  public struct StageDecision: Sendable, Hashable {
      public let stageId: String
      public var inputs: [String: String]  // JSON 직렬화로 복잡 값 처리
  }
  ```
- 옵션 B: 별도 `RoadmapDecisionsStore` (iOS) 만들고 Supabase `roadmaps` 테이블 동기화

웹은 `decisions[stageId].inputs.{key}` 패턴. iOS도 동일.

### 5. 라우팅 통합
`RoadmapView.swift` 의 `StageCard` 탭 시 `StageDetailSheet` 가 뜸. 이걸 stage-specific view 로 분기:
```swift
.sheet(isPresented: $showDetail) {
    switch stage.id {
    case "target-customer-definition": TargetCustomerStageView(...)
    case "menu-design": MenuDesignStageView(...)
    case "vendor-setup": VendorSetupStageView(...)
    default: GenericStageDetailSheet(stage: stage)  // 현재 컴포넌트
    }
}
```

---

## 검증 방법

1. **DEBUG 강제 진입**:
   ```bash
   SIMCTL_CHILD_BU_DEMO_ONBOARDING=1 \
     xcrun simctl launch <SIM_ID> com.buildup.mobile
   ```
2. **빌드**:
   ```bash
   cd "/Users/lij020218/New project/apps/ios" && \
     xcodebuild -scheme BuildUp \
       -destination 'platform=iOS Simulator,id=9281950D-976F-4882-8CC1-F8C95828C8B7' \
       -derivedDataPath ./build/DerivedData build
   ```
3. **스크린샷**: `xcrun simctl io <SIM_ID> screenshot ./out.png`

---

## 새 세션 시작 prompt 예시

다음 세션에서 이렇게 시작하면 컨텍스트 빠르게 복원:

```
이전 세션에서 iOS 로드맵 onboarding (3 카드 + 업종 선택) 까지 끝났어.
이번 세션은 Phase 2 — 업종 선택 후 각 stage 의 입력 화면을 iOS 에
네이티브로 미러하는 작업.

docs/ios-roadmap-phase2-handoff.md 읽고 시작해.

우선순위: target-customer-definition stage 먼저.
웹 SSOT: apps/web/app/lib/components/stages/shared/TargetCustomerStage.tsx
모바일 위치: apps/ios/Sources/BuildUpFeatures/Roadmap/Stages/TargetCustomerStageView.swift
RoadmapView.swift 의 StageDetailSheet 분기에 등록까지.
```

---

## 사장님 작업 우선순위 메모

사장님이 직접 명시한 P0 — 두 새 stage + 자동 연동:

1. **target-customer-definition** (Phase 1.4) — "타깃 고객 정의가 어디에도 없어"
2. **menu-design** (Phase 3.14) — "메뉴 결정 + 재고 자동 등록"
3. **vendor-setup + InitialOrderPlanCard** (Phase 3.15) — "공급처 선택 + 원자재 발주 → 재고 자동"

→ 이 3 개 stage 의 iOS 화면 먼저 완성하면 사장님이 가장 큰 차이 체감.

나머지 stage 들은 점진적으로 (P1 → P2 → P3 순).
