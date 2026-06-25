# 단계 내용 SSOT — 다음 턴 실행 핸드오프

> 작성 2026-06-26. 브랜치 `feat/stage-content-ssot-pilot-2026-06-25`.
> 목적: 로드맵 단계 콘텐츠를 `packages/shared` 한 곳에 데이터로 정의 → 웹(React)·iOS(SwiftUI)가
> 같은 데이터를 렌더 → web↔iOS 무드리프트(제목·내용 차이) 구조적 불가.

## 0. 현재 상태 (모두 커밋·푸시됨)

| 단계 | 상태 | 커밋 |
|---|---|---|
| registration-setup | ✅ 완전 전환(웹+iOS 렌더, 실렌더 검증) | 4e10d0e |
| tax-guide | ✅ 완전 전환 | 7e94f24 |
| permit-check | 🟡 **그라운드워크만**(스키마+콘텐츠, 미배선=행동변화0) | 5ca0f0d |
| contract-review·hiring-setup·insurance-tax-setup·operations-setup·vendor-setup·construction-setup | ⬜ 미착수 | — |

검증 상태: shared·web typecheck + iOS xcodebuild(FoundOneFeatures) + iOS 런타임 디코드 전부 통과.

## 1. 아키텍처 핵심 (이미 작동)

- **스키마**: `packages/shared/src/stages/schema.ts` — `StageContent`{stageId, shell, keyAction?, pages[], byCategory, wrapup, wrapupMode?}. 섹션은 `kind` discriminated union. 아이콘=문자열 `IconKey`, 색=`Accent`, 업종분기=`byCategory[catId]`(키=CategoryId.rawValue=웹 industryCategoryId, 11종).
- **콘텐츠**: `packages/shared/src/stages/content/*.ts` → `index.ts`의 `STAGE_CONTENT_REGISTRY` 등록.
- **코드젠**: `npx tsx scripts/gen-stage-content-json.mts` → `packages/shared/src/stages/stage-content.json`(iOS Resources 심링크). **콘텐츠 수정 후 반드시 재실행.**
- **웹 렌더러**: `apps/web/app/lib/components/stages/shared/StageContentRenderer.tsx` — `<StageContentRenderer content={X_CONTENT} />`. useDashboardCtx로 industryCategoryId·language·인터랙티브 바인딩.
- **iOS**: `apps/ios/Sources/FoundOneCore/StageContentRegistry.swift`(Codable, Section은 kind 커스텀 디코드, 미지원 kind→`.unsupported`) + `apps/ios/Sources/FoundOneFeatures/Roadmap/Stages/BUStageContentRenderer.swift`(SwiftUI) + 각 `XStageView.swift`가 `BUStageContentRenderer(content:)` 호출.
- **인터랙티브 위젯**(계산기·폼·토글)은 유일 비공유점: 섹션 `kind:"interactive"` + `ref` + `platforms?:["web"|"ios"]`. 플랫폼별 ref→네이티브 위젯 매핑. 미구현 플랫폼은 graceful 생략.

## 2. 디스패치 경로 = footer 수술 필요 여부 (중요)

`apps/web/.../surfaces/CurrentStageView.tsx` 에서 단계가 렌더되는 위치가 두 갈래:
- **generic footer 경로**(line ~686 `{currentStage.code === "X" && <XComponent/>}`): CurrentStageView가 공용 footer(line ~1013)를 그림. **footer 수술 불필요.** registration-setup·permit-check가 여기.
- **self-footer 경로**(line ~1127 `code === "tax_guide" ? <TaxGuideStage/> : ...`): 단계 컴포넌트가 자체 footer 렌더. 교체 시 footer 게이팅을 CurrentStageView에 옮겨야 함. tax-guide·loan-guide가 여기. (tax-guide는 이미 처리 완료 — 참고 패턴.)

→ 새 단계 전환 전 `grep -n "code === \"<stage>\"" CurrentStageView.tsx`로 어느 경로인지 먼저 확인.

## 3. permit-check 배선 (2부) — 다음 작업

그라운드워크(스키마 프리미티브 + `content/permit-check.ts` + index 등록 + JSON)는 **완료**. 남은 건 렌더러 배선.

### 3-1. 웹 — StageContentRenderer 신규 섹션 렌더 (기존 컴포넌트 재사용!)

`apps/web/.../shared/StageActionHero.tsx`의 기존 컴포넌트를 import해 SSOT→props 매핑만 하면 됨(시각 복제 X):
- `KeyActionHero({ ko, action:{title,detail}, pillars:[{icon?:ReactNode, label, meta}] })` — 메인 히어로의 pillars 분기. **현재 StageContentRenderer 메인은 `content.keyAction.miniCards`면 StartupKeyActionHero, `pillars`면 KeyActionHero** 로 분기 추가. pillars icon은 IconKey→lucide 매핑(ICONS[p.icon] 렌더).
- `StageOverview({ ko, headline, why, stat:{value,label}, workOutline:[{stepLabel,title,time?}], outcome, nextStage? })` — `stageOverview` 섹션. 매핑: why=section.intro, workOutline 항목 {stepLabel: item.title, title: item.detail, time}. (section.outlineEyebrow/outcomeTitle은 StageOverview가 자체 라벨 생성 → 무시 OK.)
- `WorkStep({ ko, stepLabel, time?, headline, why?, how?:[{title,detail?}], watchouts?:[{label,text}], favorable?:{context,recommendation,rationale?} })` — `workStep` 섹션. 매핑: axis로 `cat.workSteps[section.axis]` 조회 → why=ws.why(또는 section.why inline 우선), how=ws.tasks.map(t=>({title:t.title, detail:t.detail})), watchouts=ws.watchouts. favorable: section.showFavorable면 cat.favorable.

신규 섹션 `axisChecklist`: 3축(building/person/facility) 토글 체크리스트. 웹은 **게이팅 안 함**(taskMap이 함) — 표시만(또는 self-check). cat.workSteps[axis].tasks를 토글 행으로. 상태는 로컬 useState 또는 DashboardContext(없으면 로컬). 원본 PermitCheckPanels는 토글 없었으니 웹은 신규 획득 — 로컬 state로 충분.

인터랙티브 ref(둘 다 `platforms:["web"]`):
- `liveData`: 생존율 패널. DashboardContext `livePermitInsights`{loading, data?:{total,operating,closed,survivalRate}} + `setLivePermitInsights`. 로드: `/api/data/permits?pageSize=500`(Bearer 토큰) → operating/closed 집계 → survivalRate. **원본 PermitCheckPanels.tsx의 loadPermitInsights + Panel 1 JSX 그대로 추출**해 작은 컴포넌트로.
- `permitCards`: `getPermitsForCategory(industryCategoryId)` + `getTotalPermitCost(...)`(from @foundone/shared). PermitItem{id, name:{ko,en}, priority, agency:{ko,en}, costWon, costNote?, duration:{ko,en}, applyUrl?, documents:[{ko,en}], steps:[{ko,en}], warnings?:[{ko,en}]}. **원본 Panel 2 JSX(확장 카드) 그대로 추출.**

CurrentStageView: line ~686 `{currentStage.code === "permit_check" && <PermitCheckPanels />}` → `<StageContentRenderer content={PERMIT_CHECK_CONTENT} />`(import 추가). generic footer 경로라 footer 수술 X. import한 PermitCheckPanels 제거 + 구 파일 삭제.

### 3-2. iOS — Codable 디코드 case + SwiftUI 섹션

`StageContentRegistry.swift` Section enum에 디코드 case 추가(현재 `.unsupported`로 떨어짐):
- `stageOverview(headline, intro, stat, outlineEyebrow, workOutline, outcomeTitle, outcome)` — 구조체 Stat{value,label}, OutlineItem{title,detail,time?} 추가.
- `workStep(axis, stepLabel, time?, headline, why?, tasks?, watchouts?, showFavorable?)` — WorkStepTask{id,title,detail} 추가.
- `axisChecklist(eyebrow, subtitle?, axes:[{axis,icon,title}])`.
- CategoryContent에 `workSteps:[String:WorkStepData]?`{why,tasks,watchouts}·`favorable:Favorable?` 추가(이미 JSON엔 있고 현재 무시 중).

`BUStageContentRenderer.swift`:
- stageOverview → 원본 PermitCheckStageView.overviewPage 패턴(BUCard 헤더+stat블록 + 작업목차 + 결과박스).
- workStep → **`BUWorkStep` 재사용**: `BUWorkStep(stepLabel:, time:, headline:, why:, tasks:[BUWorkStepTask(title:,detail:)], watchouts:[BUWorkStepWatchout(label:,text:)], favorable: BUWorkStepFavorable(context:,recommendation:,rationale:)?)`. axis로 cat.workSteps[axis] 조회.
- axisChecklist → 3축 토글(원본 permitCheckRow/axisSection 패턴). 토글 id = task.id. 상태는 selections/checklist dict 확장 또는 `[String:Bool]`. **게이팅**: 모든 building/person/facility task id 체크 시 canComplete(원본 allPassed 미러). advanceInputs에 토글 상태 포함.
- liveData/permitCards: `platforms:["web"]`라 iOS는 자동 생략(현재 interactiveSection default EmptyView). iOS 후속.
- 히어로: **iOS는 추가 작업 불필요.** `StageKeyActionRegistry.swift:76`에 `"permit-check"` 이미 등록 → BUStageContentRenderer가 stageId="permit-check" 넘기고 keyActionOverride=nil이면 BUStageShell이 자동 노출(registration 패턴과 동일). keyAction.pillars는 **웹 전용**.

`PermitCheckStageView.swift` → registration/tax 패턴대로 `BUStageContentRenderer(content:)` 호출로 교체.

### 3-3. 검증 (필수 순서)
```
npx tsx scripts/gen-stage-content-json.mts                    # 콘텐츠/스키마 변경 후
pnpm --filter @foundone/shared typecheck
pnpm --filter web typecheck
cd apps/ios && xcodebuild -scheme FoundOneFeatures -destination 'generic/platform=iOS Simulator' build
# 실렌더(데모 env, 비파괴):
xcodebuild -scheme FoundOne -destination 'platform=iOS Simulator,id=BCE8302D-EC64-4D2E-906E-51B316A21C8C' -derivedDataPath build/DD-demo build
APP=$(find build/DD-demo/Build/Products -name FoundOne.app -maxdepth 3|head -1)
xcrun simctl install booted "$APP"
SIMCTL_CHILD_BU_DEMO_ALLOW=1 SIMCTL_CHILD_BU_DEMO_SCENARIO=healthy SIMCTL_CHILD_BU_DEMO_TAB=roadmap SIMCTL_CHILD_BU_DEMO_STAGE=permit-check xcrun simctl launch booted com.foundone.mobile
xcrun simctl io booted screenshot /tmp/p.png       # 페이지 넘김은 computer-use 탭 필요(승인 시)
```
웹 실렌더: 테스트 계정 100%완료라 완료단계 재표시 경로 없음 → simctl/iOS로 시각 검증, 웹은 typecheck+빌드로.

## 4. 나머지 6단계 — 8스텝 체크리스트(클러스터 순차)

각 단계 반복:
1. 웹+iOS 원본 전체 읽기 → 합집합 인벤토리(둘 다 살리기, 발산 항목 명시).
2. 부족한 섹션 kind만 schema에 additive 추가(+ iOS Codable 디코드 case + 구조체).
3. `content/<stage>.ts` 작성(byCategory per-cat 데이터, label만 필수).
4. `index.ts` STAGE_CONTENT_REGISTRY 등록 + 코드젠 재실행.
5. 웹 StageContentRenderer 섹션 렌더(기존 StageActionHero 컴포넌트 재사용 우선) + CurrentStageView 디스패치 교체(경로 확인) + 구 파일 삭제.
6. iOS BUStageContentRenderer 섹션 + interactiveRef + StageView 교체.
7. shared·web typecheck + iOS 빌드 + 데모 실렌더.
8. 커밋·푸시.

**드리프트 방지 원칙**: SSOT는 현재 양쪽 표시의 합집합으로 작성 → 웹·iOS를 **같은 커밋에서** 교체(한쪽만 교체 시 전환 중 드리프트). 단, 그라운드워크(미배선 schema+content)는 additive라 단독 선커밋 OK.

남은 단계 메모: hiring(4대보험 계산기)·insurance-tax(부담 시뮬)·operations(POS 테스트)는 **계산기 interactiveRef** 비중 큼. construction은 이미 `ConstructionSubIndustryInterior2026Registry` 코드젠 있음(재활용). 상세는 메모리 [[project_offline_core_ssot_cluster]] · [[project_stage_content_ssot_plan]].
```
