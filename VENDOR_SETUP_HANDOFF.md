# vendor-setup SSOT 전환 핸드오프 (오프라인 코어 4/7)

> 작성 2026-06-26. 다음 세션이 vendor-setup을 **즉시·완벽하게** 시작하기 위한 자립형 문서.
> 상위 맥락: 메모리 `project_offline_core_ssot_cluster`, `feedback_web_mobile_sync`, `feedback_web_to_swift_codegen`.

---

## 0. 한 줄 목표
로드맵 단계 **vendor-setup**(공급처·장비·POS 선택 + 초기 발주 + 월 원가)을 **web(Next/TSX)과 iOS(SwiftUI)가 한 데이터에서 동일하게 렌더**하도록 SSOT 전환. 사장님 절대 원칙: **"웹과 iOS가 보여주는 게 똑같아야 한다"** — 교육 콘텐츠뿐 아니라 **계산기·plan card·AI 등 인터랙티브 기능도 한쪽만 두지 말 것**(없으면 이식, 드롭 X).

---

## 1. 지금까지 (이번 클러스터 진행)
오프라인 코어 7단계 중 **3개 완료**(모두 web=iOS 동일 + 빌드·실렌더 검증 + 디코드 회귀 테스트):
- permit-check (커밋 `ead0338`)
- contract-review (`c744199` 정적통일 + `0e88b86` AI 양쪽이식)
- hiring-setup (`b8dac23` 증분A + `c5e0c2e` 증분B = MyHiringPlanCard·계산기·재무연동)

**다음 = vendor-setup (4/7).** 이후: operations(5) · construction(6) · insurance-tax(7).

---

## 2. 확립된 SSOT 아키텍처 (그대로 따라가면 됨)
- **스키마**: `packages/shared/src/stages/schema.ts` — Section discriminated union. **사용 가능한 프리미티브**(이미 구현·렌더됨 양쪽):
  `stageOverview` · `workStep`(인라인 tasks/watchouts + showFavorable→cat.favorable) · `gateChecklist`(정적 게이팅 체크리스트) · `noteList`(정적 콜아웃) · `linkCards`(공식사이트 링크) · `whyList`·`stepList`·`permit`·`pitfalls`·`pathCards`·`checklist`·`infoCard`·`pageKeyAction`·`scheduleList`·`iconCardList`·`calloutWarning`·`comparisonCards`·`cpaCriteria`·`wrapup` · `interactive{ref, platforms?, config?}`.
  - KeyAction 히어로: `keyAction.pillars`(3 기둥) → 웹 `KeyActionHero`, iOS `BUStageShell` 자동. `miniCards`도 가능.
  - byCategory[catId]: `label`(필수) + 단계별 optional 필드(`favorable`·`workSteps`·`permit`·`taxChecklist` 등).
- **콘텐츠**: `packages/shared/src/stages/content/<stage>.ts` → `index.ts`의 `STAGE_CONTENT_REGISTRY`에 등록 + export.
- **코드젠**: `npx tsx scripts/gen-stage-content-json.mts` → `packages/shared/src/stages/stage-content.json`(iOS Resources 심링크). **content 수정 후 반드시 재실행.**
- **웹 렌더러**: `apps/web/app/lib/components/stages/shared/StageContentRenderer.tsx`(renderSection switch + interactive switch). 디스패치는 `apps/web/app/lib/components/surfaces/CurrentStageView.tsx`.
- **iOS 렌더러**: `apps/ios/Sources/FoundOneCore/StageContentRegistry.swift`(Codable, 새 섹션 kind 추가 시 디코드 case·struct 추가) + `apps/ios/Sources/FoundOneFeatures/Roadmap/Stages/BUStageContentRenderer.swift`(sectionView·interactiveSection·게이팅). 디스패치 `WizardStageDispatcher.swift`.
- **stage 뷰 = 얇은 래퍼**: `<Stage>View.swift`/`<Stage>Stage.tsx`는 `StageContentRegistry.content(for:)` → `BUStageContentRenderer` / `<StageContentRenderer content={...}/>` 한 줄.

### 디코드 회귀 테스트 (필수)
`apps/ios/Tests/FoundOneCoreTests/StageContentRegistryTests.swift`의 `decodesKnownStages` 배열에 `"vendor-setup"` 추가 + 신규 섹션 unsupported 안 떨어지는지 검사. (⚠️ iOS 스킴 test 액션 미설정이라 `xcodebuild test`로는 못 돌림 — Xcode/CI용. 실렌더가 사실상 디코드 검증.)

### 증분 원칙 (검증됨)
무거운 단계는 **각 커밋이 web=iOS 동일 상태**를 유지하도록 증분 분할. 한쪽만 있는 기능은 증분에서 **양쪽 다 제외**(동일) → 다음 증분에서 **양쪽 다 추가**. (contract-review·hiring-setup이 이렇게 함.)

---

## 3. vendor-setup 인벤토리 (양쪽 전체 읽음, 2026-06-26)

### 파일
| | web | iOS |
|---|---|---|
| 스테이지 | `offline/VendorSetupStage.tsx` (577) | `Stages/VendorSetupStageView.swift` (998) |
| 벤더 데이터 | `offline/vendor-setup-data.ts` (**2948**, getVendorData 3-tier) | `FoundOneCore/VendorDataRegistry.swift` (76) |
| 부가 카드 | `offline/InitialOrderPlanCard.tsx`, `offline/MyIngredientsPlanCard.tsx` | (initialOrderSection은 view 내장) |
| 프랜차이즈 | `franchise/FranchiseSupplyPanel.tsx` (193) | **없음(갭)** |
| 디스패치 | `CurrentStageView.tsx:811-819` | `WizardStageDispatcher.swift:28` |

### ✅ 벤더 카탈로그 데이터는 이미 공유 (드리프트 위험 아님)
- SSOT: `packages/shared/src/vendor-data.json`(categories 10 + subIndustries 60). iOS는 **심링크** `apps/ios/Sources/FoundOneCore/Resources/vendor-data.json` → 공유 JSON. `VendorDataRegistry.bundle(forSubIndustry:categoryId:)`로 3-tier 해석(specialty→sub→category→food fallback).
- 웹 `vendor-setup-data.ts`의 `getVendorData(sub, cat, specialty)`가 런타임 3-tier 머지(같은 결과). **벤더 아이템**: `{name, desc, priceRange?, priority?(primary/recommended/optional), url?, budgetTier?(value/standard/premium)}`. 번들: `{suppliers[], equipment[], pos[], channels?}`.
- ⚠️ codegen 스크립트는 임시(`/tmp/gen-vendor.ts`로 추정, VendorDataRegistry 주석). **vendor-data.json 정식 gen 스크립트가 `scripts/`에 있는지 먼저 확인**; 없으면 stage-content와 별개로 둠(데이터는 안 건드릴 예정이라 무방).

### 페이지 구조 — ⚠️ **단일 페이지**(worksteps 패턴 아님!)
permit/contract/hiring은 6-page workstep이었지만 **vendor-setup은 탭 없는 단일 스크롤**. 양쪽 거의 동일 순서:
1. **KEY ACTION 히어로**(미드나잇 그라디언트 + 3 미니팁). iOS=`goldenWindowCard`(개업 4~6주 전 + 3팁). → `keyAction.pillars` 또는 stageOverview로.
2. **공급처(suppliers)** 선택 섹션 — vendor-data suppliers 렌더 + 다중선택 토글.
3. **장비(equipment)** 선택 섹션.
4. **POS·결제(pos)** 선택 섹션.
5. **리다이렉트 안내**(배달앱·SNS 등록은 stage 14 operations로 / 계약서·허가증 안내). → `noteList` 또는 `infoCard`.
6. **체크리스트 팁**(web only? line 527-545) — `noteList`/`checklist`.
7. **InitialOrderPlanCard**(선택 공급처별 원자재 입력 → 재고 자동연동 `init-mat-*`). 인터랙티브.
8. **MyIngredientsPlanCard**(월 원가 계획) — **웹 전용 가능성**(또 다른 plan card, 재무 연동).
9. **wrapup**(doneItems 5 + verifyItems 6, **양쪽 word-for-word 동일**, nextStage=사업자등록·인허가).

iOS는 cluster-aware 섹션 제목/부제(VendorCluster enum, food/cafe/beauty/…). 웹은 per-category 분기 없이 getVendorData가 카테고리별 데이터 공급.

### 인터랙티브 위젯 = 신규 ref 필요
- **벤더 선택**(suppliers/equipment/pos 각 다중선택). 새 interactive ref 예: `vendorSelect`(config로 section 지정) 또는 섹션 kind `vendorSelection{section}`. **벤더 데이터는 VendorDataRegistry/getVendorData 재사용**(카탈로그 포팅 0).
- **InitialOrderPlanCard** ref: `initialOrder`(웹 컴포넌트 재사용 / iOS initialOrderSection 추출).
- **MyIngredientsPlanCard** ref: `ingredientsPlan`(웹 전용이면 hiring의 hiringPlan처럼 iOS 신규 이식 필요 — 재무연동 확인).

### 🔴 해결해야 할 분기/divergence (vendor-setup의 진짜 난점)
1. **벤더 선택 영속이 web↔iOS 동기화 안 됨.**
   - 웹: `user_store_data.vendor_selections` 컬럼(Record<string,string>, 키 `vendor-setup_s{step}_c{cursor}`, s1=suppliers s2=equipment s3=pos). `useDashboardCtx().vendorSelections`/`setVendorSelections`(Zustand+Supabase 자동).
   - iOS: **로컬 @AppStorage** `stage.vendor.suppliersJson/equipmentJson/posJson/materialsJson`(JSON 배열). **vendor_selections 컬럼 안 씀** → 기기간·웹간 동기화 0.
   - **해법(hiring 증분B 패턴 재사용)**: iOS가 `vendor_selections` 컬럼을 web 호환으로 읽고/쓰도록 — `StoreProfileRepository`에 전용 메서드(또는 RoadmapDecisions처럼 AnyJSON read-merge). `vendor_selections`는 user_store_data 컬럼이므로 `StoreProfileRepository.persist*ForCurrentUser` 패턴이 적합. 키 스킴 통일(웹 cursor-slot ↔ iOS 배열) 결정 필요 — **배열 기반으로 통일 권장**(웹도 배열로 마이그레이션 or 양쪽 호환 read).
2. **MyIngredientsPlanCard(월 원가)** — 웹 전용이면 iOS 신규 이식(hiringPlan처럼). 재무검토 연동 여부 확인(staffPlan처럼 stage_decisions.inputs 또는 별도). **계산 로직은 @foundone/shared로 SSOT화** 후 Swift 1:1 포팅(hiring `TeamLaborCost.swift` 선례) + 회귀 테스트로 숫자 고정.
3. **프랜차이즈 분기** — 웹은 `startupType==="franchise" && selectedFranchiseBrandId` → `FranchiseSupplyPanel`(HQ 공급구조). **iOS는 분기 없음**(프랜차이즈도 일반 벤더 선택 노출 = 갭). 완전 동일하려면 iOS에 `FranchiseSupplyPanel` 등가 뷰 + 디스패치 분기 신설. **FranchiseSupplyPanel.tsx(193) 내용 먼저 인벤토리**해 SSOT/이식 범위 판단.
4. **게이팅**: 웹=generic taskMap(supplier-identified/equipment-planned/pos-selected, 각 ≥1 자동완료) / iOS=명시적 `canCompleteStage = !suppliers.isEmpty && !equipment.isEmpty && !pos.isEmpty`. permit-check식(웹 taskMap 유지 + iOS 선택상태 게이팅 일반화)으로 통일.

---

## 4. 권장 증분 계획
- **증분A**: 히어로 + 벤더 선택 3섹션(suppliers/equipment/pos, vendor-data 재사용) + 리다이렉트 noteList + 체크리스트 + wrapup. 벤더 선택 영속을 **양쪽 동일(vendor_selections 컬럼)으로 통일**(iOS 신규 write 경로). 게이팅 일반화. InitialOrder·Ingredients·프랜차이즈 제외(양쪽 동일 상태 유지하려면 InitialOrder는 양쪽 다 있으니 포함 가능). → 빌드·실렌더·커밋.
- **증분B**: MyIngredientsPlanCard(월 원가) 양쪽(웹 유지 + iOS 신규, 계산 SSOT+회귀테스트) + 재무연동.
- **증분C**: 프랜차이즈 분기 — FranchiseSupplyPanel 인벤토리 후 iOS 이식 + 양쪽 디스패치.
(InitialOrderPlanCard는 양쪽에 이미 있으니 증분A에 포함하거나 A 직후. syncMaterialsToInventory 로직은 양쪽 이미 동일.)

---

## 5. 빌드·검증 커맨드 (검증된 것)
```bash
# shared / web typecheck
cd "/Users/lij020218/New project" && npm run typecheck --prefix packages/shared
cd apps/web && npx tsc --noEmit -p tsconfig.json   # "errs: 0" 기대

# 코드젠 (content 수정 후)
cd "/Users/lij020218/New project" && npx tsx scripts/gen-stage-content-json.mts

# iOS 빌드 (FoundOneFeatures 스킴, generic simulator)
cd apps/ios && xcodebuild build -scheme FoundOneFeatures -destination 'generic/platform=iOS Simulator' -derivedDataPath build/ddp 2>&1 | grep -E "error:|BUILD SUCCEEDED|BUILD FAILED"

# 실렌더 (앱 빌드 → 데모 env로 해당 stage 진입 → simctl 캡처)
cd apps/ios && xcodebuild build -scheme FoundOne -destination 'platform=iOS Simulator,name=iPhone 17 Pro Max' -derivedDataPath build/ddp 2>&1 | grep -E "BUILD SUCCEEDED|error:"
APP="build/ddp/Build/Products/Debug-iphonesimulator/FoundOne.app"; DEV="iPhone 17 Pro Max"
xcrun simctl install "$DEV" "$APP"; xcrun simctl terminate "$DEV" com.foundone.mobile 2>/dev/null
SIMCTL_CHILD_BU_DEMO_SCENARIO=healthy SIMCTL_CHILD_BU_DEMO_ALLOW=1 SIMCTL_CHILD_BU_DEMO_TAB=roadmap SIMCTL_CHILD_BU_DEMO_STAGE=vendor-setup xcrun simctl launch "$DEV" com.foundone.mobile
sleep 6; xcrun simctl io "$DEV" screenshot /tmp/vendor.png   # Read /tmp/vendor.png 로 확인
```
- ⚠️ iPhone 16 시뮬 없음 → **iPhone 17 Pro Max** 사용. simctl엔 tap 없음(페이지 네비 불가) — 단일 페이지라 vendor-setup은 스크롤 캡처로 충분(overview 캡처 = 디코드 증명, 전체파일 디코드 all-or-nothing이라 한 섹션 키 불일치면 폴백 화면).
- 커밋 시 `apps/ios/build/`·`artifacts/`·`apps/web/tsconfig.tsbuildinfo`는 **스테이징 제외**(gitignore 아님). 소스 파일만 `git add` 명시.
- 커밋 메시지 끝: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. 사용자가 커밋 요청 시에만(이번 클러스터는 각 단계 완료마다 커밋해 옴).

## 6. 함정·주의
- stage-content.json은 **전체파일 단위 디코드** — 한 섹션 키 불일치면 전 SSOT 단계가 폴백. CodingKeys/struct 키 정합이 빌드와 별개 리스크.
- iOS `StageDecision.inputs`는 `[String:String]` — **중첩 객체 불가**. 객체 영속은 `inputs` jsonb(AnyJSON 보존)에 **전용 repo 메서드**로(hiring `RoadmapDecisionsRepository.saveStaffPlan` 선례) 또는 user_store_data 컬럼(`StoreProfileRepository`). vendor_selections는 **user_store_data 컬럼**이므로 후자.
- 숫자 계산(월 원가 등)은 반드시 `@foundone/shared`에 SSOT화 → Swift 1:1 포팅 + 회귀 테스트(`TeamLaborCostTests` 선례)로 web/iOS 동일 보장. JS `Math.round`=Swift `.rounded()`(양수 동일).
- 글로벌 규칙: 코드 작업 전 WebSearch로 최신 자료 조사(요율·법령 등 사실 데이터 갱신 시).

---
*이 문서대로 §3 분기 4건을 먼저 설계 결정 → §4 증분 진행. FranchiseSupplyPanel.tsx와 MyIngredientsPlanCard.tsx는 착수 시 가장 먼저 전체 읽기.*
