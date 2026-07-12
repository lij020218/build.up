# 로드맵 모닝 브리핑 — 구현 스펙

> 상태: **작성 중 (Checkpoint 1 완료, Checkpoint 2~ 진행 예정)**
> 작성 시작: 2026-07-03
> 원칙: 모든 필드·단위·숫자는 실제 코드로 검증한 것만 기재. 미검증 항목은 `⚠️ TO-VERIFY`로 명시.

---

## 0. 목적과 correctness 계약

### 0.1 목적
개업 전(로드맵 단계) 사용자가 앱을 열면, **오늘의 단 하나의 다음 걸음**을 정확히 짚어주는 아침 브리핑. 로드맵 홈 최상단에 얹히는 "정문(front door)". 운영 대시보드의 모닝 히어로를 로드맵 데이터 소스로 이식.

### 0.2 비목적 (이번 범위 아님)
- 개업 후(운영) 브리핑 — 기존 `CEOMorningHero`가 담당. 건드리지 않음.
- 지원사업 마감(D-day) 카드 — 데이터가 정적(2026-03)이라 **이번엔 끔**. §4.5 참조.
- 새 결제/페이월 — 무관.

### 0.3 correctness 계약 (이 문서의 심장)
> **"항상 맞다"가 아니라 "절대 자신 있게 틀리지 않는다".**

- 화면에 뜨는 모든 숫자는 **실제 사용자 입력 필드**로 역추적된다 (§4 출처표).
- 데이터가 없거나 검증식을 통과 못 하면 → **지어내지 않고 사다리 아래로 내려간다** (§2, §5).
- 최종 폴백은 항상 **현재 단계의 KEY ACTION**(항상 존재, 지어낼 필요 없음).
- 이 계약은 fixture 테스트로 강제한다 (§8): "출력의 모든 숫자가 입력 fixture에 존재하는가"를 검사.

---

## 1. 아키텍처 — 재사용 맵

| 부품 | 재사용 여부 | 실제 위치 (검증됨) |
|---|---|---|
| `Hero` 타입 (출력 계약) | ✅ 그대로 | `apps/web/app/lib/components/dashboard/heroInsight.tsx:69` |
| `resolveHero` 사다리 패턴 | ✅ 패턴 복제 | 같은 파일 `:205` |
| 정직성 가드 (데이터 부족 처리) | ✅ 그대로 이식 | `useMorningBriefingBrain.ts` |
| Hero 렌더 UI (Tier1Hero) | ✅ 그대로 | `dashboard/sections/Tier1Hero.tsx` |
| iOS `HeroResolver` | ✅ 미러 존재 | `apps/ios/Sources/FoundOneCore/HeroResolver.swift` |
| iOS 개업 전 홈 | ✅ 자리 존재 | `apps/ios/Sources/FoundOneFeatures/Today/PreLaunchHomeView.swift` |
| iOS 매일 09:00 알림 | ✅ 스케줄러 존재 | `apps/ios/Sources/FoundOneNotifications/NotificationScheduler.swift` |
| **로드맵용 resolver** | 🔨 신규 | `resolveRoadmapHero` (신규, §2) |
| **로드맵 소스 어댑터** | 🔨 신규 | `RoadmapBriefInput` (신규, §4) |

### 1.1 검증된 `Hero` 출력 계약
`heroInsight.tsx:69`~ 기준. 로드맵 브리핑도 **동일 타입**을 반환한다 (렌더 UI 재사용 위해).

```
Hero = {
  source: HeroSource      // 신규 소스값 추가: "roadmap-money" | "roadmap-bottleneck" | "roadmap-decision" | "roadmap-next-step"
  tone: "crisis" | "warning" | "neutral"   // 로드맵은 crisis 안 씀 (§7 톤 규칙)
  tagKo / tagEn: string    // 배지 문구
  analysisKo / analysisEn: string   // 본문
  actionKo / actionEn: string       // 할 일
  ctaKo / ctaEn: string             // 버튼 라벨
  ctaTarget: ...           // ⚠️ TO-VERIFY: 로드맵은 stageId 딥링크 필요 → ctaTarget 확장 or 신규 필드
  (optional) referencedCase, agentProposalId, sourceLabel, priority, relatedSpecs
}
```

⚠️ TO-VERIFY (Checkpoint 3): `ctaTarget` enum이 운영 카드용(`sales|users|cashflow|costs|...`)이라, 로드맵 단계로의 딥링크를 표현할 필드가 없음. `ctaStageId?: string` 추가 필요 여부 확인.

---

## 2. Resolver 사다리 (로드맵 버전)

운영 `resolveHero`의 사다리를 그대로 본떠, 위→아래로 **첫 번째로 게이트를 통과한 신호**를 히어로로 채택. 아래로 갈수록 데이터 요구가 적고, **맨 바닥은 항상 통과**.

| 우선순위 | source | 게이트 조건 (통과해야 표시) | 데이터 준비도 |
|---|---|---|---|
| 1 | (마감) | **이번엔 비활성** — §4.5 | Lv3, off |
| 2 | `roadmap-money` | 예산 입력됨 **AND** 벤치마크 존재 **AND** 총자본 < 평균 | 90% |
| 3 | `roadmap-bottleneck` | 현재 단계에 미완료 체크리스트 존재 | 60% |
| 4 | `roadmap-decision` | 미정 갈림길 존재 | 50% |
| 5 (바닥) | `roadmap-next-step` | **항상 통과** — 현재 단계 KEY ACTION | 100% (이미 존재) |

보조 카드(히어로 아래): 히어로로 채택 안 된 통과 신호들을 **작은 카드**로 노출 (목업의 자금 점검·다음 결정 카드). 단, 각 카드도 자기 게이트를 통과해야만 렌더.

> 핵심: 운영 사다리도 이미 6번 `drucker`에서 "항상 뭐라도 반환"하는 구조(`heroInsight.tsx:437`). 로드맵은 그 바닥을 **더 강한 것**(현재 단계 액션)으로 교체할 뿐. 새 위험을 도입하지 않음.

---

## 3. 상태 머신 (전수)

사용자 상태를 빠짐없이 정의. "코드가 어쩌다 그렇게 되는" 상태를 남기지 않는다.

| 상태 | 감지 조건 (검증된 필드) | 히어로 | 보조 카드 |
|---|---|---|---|
| **S_launched** | `businessLaunched === true` | — (운영 브리핑으로 넘김, 범위 밖) | — |
| **S0 · 입력 전** | `businessLaunched===false` AND `selectedBudget===undefined` AND `completedCount===0` | `roadmap-next-step` (현재 단계 액션) | "정보가 쌓이면 열려요" 예고(정적) |
| **S1 · 예산 있음** | S0 조건 중 `selectedBudget!==undefined` | money 게이트 통과 시 `roadmap-money`, 아니면 next-step | 자금 점검(게이트 통과 시) |
| **S2 · 진행 중** | `completedCount>0` | bottleneck > money > next-step 순 | 자금 점검, 다음 결정 (각 게이트 통과 시) |

경계/에지 케이스 (반드시 fixture로 테스트 — §8):
- E1: `businessLaunched===false` 인데 로드맵 자체가 아직 없음(업종도 안 정함) → 현재 단계 = 첫 단계(업종 선택). KEY ACTION 존재 확인 필요. ⚠️ TO-VERIFY.
- E2: `selectedBudget` 있으나 벤치마크 클러스터 매칭 실패 → money 게이트 **불통과**(비교 대상 없음). next-step으로. 절대 "평균 대비 —" 같은 빈 비교 표시 안 함.
- E3: `selectedBudget` 있고 총자본 ≥ 평균 → shortfall 없음. money 히어로 대신 "평균 수준" 톤 or 생략(§4.1 결정).
- E4: `businessLaunched===true` 로 잘못 흘러들어옴 → 로드맵 히어로 **반환 안 함**(계약 위반 방지).

---

## 4. 데이터 출처표 (provenance)

### 4.1 자금 (`roadmap-money`) — ✅ 완전 검증됨

| 표시 요소 | 소스 필드 | 파일:줄 | 단위 | null/부재 조건 | 검증식 |
|---|---|---|---|---|---|
| 시설·창업비용 (①) | `selectedBudget` | `profile-store.ts:11`, 세팅 `BudgetSetupStage.tsx:201,277` | **원** (100만~3억 clamp) | `undefined` | 정의됨 |
| 운영예비자금 (②) | `initialOperatingCapital` | `profile-store.ts:13` | **원** | `undefined` | 선택적 |
| 총자본 | `totalCapital = (selectedBudget ?? 0) + (initialOperatingCapital ?? 0)` | `useDashboard.ts:443` | **원** | 둘 다 undefined면 0 | ①이 undefined면 게이트 불통과 |
| 업종 평균 | `benchmark.avgWan` | `cluster-budget-benchmarks.ts:19,41` | **만원** | 클러스터 매칭 실패 시 없음 | 존재해야 통과 |
| 부족분 | `avgWan - (totalCapital / 10000)` | 신규 계산 | **만원** | — | > 0 일 때만 표시 |

> 🔴 **단위 규칙 (버그 벡터 #1)**: `selectedBudget`/`initialOperatingCapital`/`totalCapital`은 **원**, 벤치마크 `*Wan`은 **만원**. 비교·차감 전 반드시 `원 / 10000 → 만원` 변환. 이 변환 누락이 과거 "예산 vs 평균" 10,000배 오차의 원인. 표시 숫자는 `Math.round(만원)` 후 `toLocaleString()`.

⚠️ TO-VERIFY (Checkpoint 2 마무리):
- (a) 벤치마크 조회 키: `benchmark[???]` — `selectedIndustryCategoryId`(profile-store:7)로 바로 조회되나, 아니면 cluster 매핑 필요한가? `cluster-budget-benchmarks.ts`의 키 구조 확인.
- (b) 정책자금 추천: 목업의 "청년창업자금 추천"은 반드시 `getMatchedProgramsV2` + 대상자 게이트(`feedback_program_matching_audience`)를 거친 **매칭된 프로그램만**. 임의 추천 금지. 매칭 0건이면 추천 문구 생략.
- (c) E3(총자본 ≥ 평균) 시 톤: "충분/평균 수준" 표기 vs money 카드 생략 — 결정 필요.

### 4.2 병목 (`roadmap-bottleneck`) — ⚠️ Checkpoint 3에서 검증 예정
소스 후보: `evaluateStageCompletion()` (`packages/shared/src/roadmap/workflow.ts:105`) → `CompletionCheck { isComplete, missingKeys, missingTaskIds }`.
검증할 것: 반환 필드 정확한 형태, `missingTaskIds`를 사람이 읽는 라벨로 매핑하는 소스, "N개 중 M개 완료" 계산.

### 4.3 다음 결정 (`roadmap-decision`) — ⚠️ Checkpoint 3
소스 후보: `stage_decisions` + `NextStageCondition` (`types/roadmap.ts:83`). 미정 갈림길 감지에 **메타데이터 설계 필요**(어떤 필드가 undefined면 "미정"인지 명시적 목록).

### 4.4 바닥: 현재 단계 액션 (`roadmap-next-step`) — ⚠️ Checkpoint 3
소스: `currentStageId` (roadmap-store) + KEY ACTION 레지스트리(`BUStageKeyActionRegistry` / `stage-key-actions`). 검증: stageId→KEY ACTION 조회 함수, 모든 단계에 값 존재하는지(특히 첫 단계).

### 4.5 마감 (`roadmap-deadline`) — 비활성 (설계만 기록)
`startup-programs.ts`의 `applicationDeadline` + `daysUntilDeadline` 있으나 **데이터 정적(2026-03, 79개)**. 지금 켜면 "이미 지난 마감을 D-7로 표시"할 위험 = 계약 위반. **K-Startup 라이브 연동(`/api/data/support-programs`) 완료 전까지 렌더하지 않음.** 사다리 1번 자리는 비워둠.

---

## 5. 표시 게이트 & 안전 바닥 (구현 규칙)

```
resolveRoadmapHero(input):
  if input.businessLaunched: return null            // E4 계약 방지
  signals = []
  // 각 build 함수는 게이트 불통과 시 null 반환
  if (m = buildMoney(input))       signals.push(m)   // 게이트: §4.1
  if (b = buildBottleneck(input))  signals.push(b)
  if (d = buildDecision(input))    signals.push(d)
  hero = signals[0] ?? buildNextStep(input)          // 바닥은 항상 성공
  return { hero, cards: signals.slice(hero===signals[0] ? 1 : 0) }
```

- **모든 build 함수는 순수 함수**: 입력 → Hero | null. 부작용·네트워크 없음(테스트 가능).
- **정책자금 추천 등 매칭 결과가 필요한 것**만 비동기 주입(운영의 `aiTopAction`처럼 나중에 끼워넣기).
- 숫자 표시는 전부 `Math.round` + `toLocaleString`. 부동소수점 노출 금지.

---

## 6. 웹·iOS 단일 계약

- 운영 `resolveHero`는 `apps/web`에만 있고 iOS `HeroResolver.swift`로 **수작업 미러**됨 → 드리프트 위험 이력.
- 로드맵 resolver는 **순수 결정 로직을 `packages/shared`에 TS SSOT로** 두고, 양쪽이 동일 fixture 스위트를 통과하게 한다. ⚠️ 아키텍처 결정 확인 필요(Checkpoint 4): shared 배치 vs 수작업 미러+공유 fixture JSON.
- KEY ACTION·벤치마크는 이미 codegen 파이프라인 존재(`scripts/gen-stage-*.mts`) → 재사용.

---

## 7. 카피/톤 규칙 & empty-state (⚠️ Checkpoint 5)
- 로드맵은 `tone: "crisis"` 사용 안 함(개업 전엔 현금위기 없음). `neutral` 기본, 마감·자금부족만 `warning`.
- 신호등 컬러 금지(브랜드 토큰: lavender-mist + 미드나잇 네이비).
- 불안 자극 문구 수위 — 알림 문구 톤은 사용자 확인 대기(이전 대화 Q2).
- empty-state 매트릭스: S0/E1/E2별 정확한 문구표 — Checkpoint 5.

---

## 8. 검증 계획
- **fixture 단위 테스트** (`resolveRoadmapHero`): S0 / S1(예산만) / S1(예산≥평균, E3) / S2(병목) / E1(로드맵 없음) / E2(벤치마크 없음) / E4(launched=true→null) / 단위경계(총자본 == 평균).
- **golden 계약 테스트**: 출력의 모든 숫자 토큰이 입력 fixture 값에서 유도되는지 검사(지어낸 숫자 탐지).
- **실렌더 검증**: 웹 `__fo_preview` 플래그 / iOS `SIMCTL_CHILD_BU_DEMO_*` env로 각 상태 눈 확인 (`feedback_live_render_verification`).
- 테스트 통과 + 상태별 실화면 확인 **전에는 출시 플래그 off**.

---

## 9. 파일 변경 목록 (⚠️ Checkpoint 4에서 확정)
웹: 신규 `resolveRoadmapHero` + 소스 어댑터, 로드맵 홈(`RoadmapSurface` 상단) 마운트 지점, `__fo_preview` 훅.
iOS: `PreLaunchHomeView` heroPanel 교체, `HeroResolver`(or shared) 로드맵 분기, `NotificationScheduler` 로드맵 문구 채널.
공유: `packages/shared` resolver + fixture, codegen 반영.

---

## 10. 체크포인트 로그
- **CP1 (완료, 2026-07-03)**: 토대 — 아키텍처/사다리/상태머신/자금 출처표. 검증: Hero 타입, resolveHero 사다리, 예산 단위(원)·벤치마크 단위(만원)·10000 변환 규칙.
- **CP2 (다음)**: 자금 TO-VERIFY 3건 마감 (벤치마크 조회 키, 정책자금 매칭 게이트, E3 톤) → 자금 재료 **구현 가능** 상태로.
- **CP3**: 병목·다음결정·바닥(KEY ACTION) 출처표 완전 검증 + ctaStageId 딥링크.
- **CP4**: 웹·iOS 계약 배치 결정 + 파일 변경 목록 확정.
- **CP5**: 카피/톤/empty-state 매트릭스 + 검증 fixture 목록 확정 → 구현 착수.
