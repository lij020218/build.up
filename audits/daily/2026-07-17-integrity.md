# Found.One 데일리 정합성 감사 — 2026-07-17

> 코드 수정·커밋 없음 (리포트 전용). 정적 분석 기반이며 런타임 미검증 항목은 "정적확인"으로 표기.
> 참고: 스케줄은 07-16에 발화했으나 세션 중 날짜가 07-17로 넘어갔고 `2026-07-16-integrity.md`가 이미 존재 → 오늘=07-17, day=17 시드로 진행.

## 4줄 요약
- **A (업종 정합):** 오늘 표본 3종(shared-office·practice-room·smart-store) 웹 기준 누출 0 — 공간 2종은 offline-space로 정상, smart-store는 online-digital 실물로 디지털 subtype set에서 올바르게 제외. **단 iOS에서 smart-store pre-launch 액션 라벨이 음식 base로 떨어짐(→ D 참조).**
- **B (대시보드 등록/렌더):** P0 없음. typecheck 0 에러 · vitest 449/449 통과. 매트릭스/MAP에 선언됐으나 렌더 안 되는 카드 3종 등 SSOT·문서 드리프트 4건(P2, 1건은 agent가 P1로 평가).
- **C (숫자 위조):** 강등 카드 부활 0(예약·노쇼·단골·캠페인·funnel WoW·채널ROI·costSparkline 모두 정상 게이팅/제거). **P1 1건: 인건비 계산기 근로자 4대보험 공제율이 옛 2025 요율로 하드코딩돼 SSOT와 어긋난 값을 표시.** 인슐린성 요율 SSOT 외 중복정의 4건 추가.
- **D (subtype-set 오염):** `isDigitalFulfillment`/`isDigitalOnlineSubtype` 호출부 25줄/22파일 전부 클러스터·카테고리 가드 보유. `localizeTaskTitle` 스타트업/디지털/실물 3분기 트레이스 통과(회귀 없음). **단 iOS는 category override가 전역적으로 도달 불가(P1) — 웹↔iOS 드리프트.**

---

## 커버리지 (침묵=전수착시 방지)
- **표본 업종 (day=17, N=70, 인덱스 51/52/53%70):** `shared-office`(space), `practice-room`(space), `smart-store`(online-digital). 표본에 online-digital 존재 → 강제 교체 불필요. 보너스로 `digital-products`(무배송) 온라인 트랙도 교차 확인.
- **읽은 핵심 파일:** starter-data.ts(카테고리/서브업종/pre-launch task), i18n.ts(taskTitleCopy·localizeTaskTitle·라벨), digital-subtypes.ts, roadmap/clusters.ts, DigitalFulfillmentNotice.tsx(+iOS View), StageTaskRegistry.swift, BUStageShell.swift, BUStageTaskList.swift, PreLaunchFinalStageView.swift/.tsx, GenericTaskStageSection.tsx, generic-task-checklist-state.ts, hiring-cost.ts, HiringCostCalculator.tsx, industry-card-matrix.ts, DASHBOARD_MAP.md.
- **실행 명령:** `pnpm -C apps/web typecheck` → exit 0(에러 0). `pnpm exec vitest run` → 61 파일 449 테스트 전부 통과.
- **D grep 호출부:** `isDigitalFulfillment(`/`isDigitalOnlineSubtype(` = **25 call-site 줄 / 22 파일** (웹+iOS+shared) 전수 확인. 각 호출의 online-전용/공용-지점 여부·가드 존재 검증.
- **하위 에이전트:** B(대시보드)·C(가짜숫자) 병렬 Explore 2개 + 본 세션 교차검증.

---

## A. 로드맵 업종 정합 — 누출 0 (웹), iOS 라벨 드리프트는 D로 이관

오늘 표본에 대해 선택→후반 체인(online-registration·sourcing·store·online-marketing·tax-guide·loan-guide·pre-launch-final) 정적 점검:

| 표본 | 클러스터 | 판정 |
|---|---|---|
| shared-office | offline-space | ✅ 정상. i18n 라벨 "공유오피스/소형 워크스페이스"(공간/숙박), 테크·온라인 어휘 누출 없음 |
| practice-room | offline-space | ✅ 정상. "연습실/레슨룸"(공간/숙박), 누출 없음 |
| smart-store | online-digital(실물) | ✅ `isDigitalOnlineSubtype("smart-store")=false` → 실물 이커머스 트랙(소싱·택배·포장) 수신이 올바름. digital subtype set(digital-products·creator-service·newsletter-membership·ai-application)에 미포함 확인 |
| (보너스) digital-products | online-digital(무배송) | ✅ sourcing/store가 `DigitalFulfillmentNotice`로 대체("디지털 상품은 '택배·포장'이 없습니다") — 물리 어휘 누출 없음. 웹·iOS 문구 일치 |

- **오프라인→online/tech 어휘 누출:** 없음 (표본 공간 2종은 offline 클러스터라 오프라인 어휘가 적합).
- **실물 이커머스 어휘→무배송 디지털 누출:** 없음 (`__digital` 오버라이드가 다운로드/자동전달로 대체).
- **웹↔iOS 하드코딩 문구 드리프트:** DigitalFulfillmentNotice·launch-date-locked 계열 라벨 문자열은 웹·iOS 동일. **단 iOS는 오버라이드 자체가 적용되지 않는 경로 결함 존재 → 아래 D-1.**

---

## B. 운영 대시보드 카드 등록/렌더

빌드: `pnpm -C apps/web typecheck` **exit 0**, `pnpm exec vitest run` **449/449 통과**. **P0 없음.**

**B-1 — P2 (agent 평가 P1) — `apps/web/app/lib/industry-card-matrix.ts:116,121,130,135,149,150,159` (+ `DASHBOARD_MAP.md:67-68,168-178`)**
`prime-cost`·`daily-improvement`·`avg-ticket-upsell` 3종이 매트릭스 SSOT에서 여러 업종에 "필수"로 선언돼 `shouldShowCardByIndustry()=true`가 되지만, 2026-07-13 lean 재설계에서 렌더 제거됨(`Tier1_5Coaching.tsx:13` 주석 "제거: …PrimeCostCard(손익 중복)…"). 컴포넌트 파일은 존재하나 어디서도 import/렌더 안 됨. MAP 168~178의 "매일 노출 카드 수"가 이들을 포함해 과대 집계. → *사용자 오출력은 아니어서 P2로 판정하되, 내부 SSOT/문서가 실제 렌더와 불일치.*
*수정:* 3종을 `INDUSTRY_CARDS`+`CARD_META`+MAP에서 제거하고 카운트 갱신(또는 의도된 카드면 재배선).

**B-2 — P2 — `DASHBOARD_MAP.md:62,63,71`**
MAP이 삭제/이동/흡수된 카드를 여전히 live Tier1.5로 표기: `integration-hub`(컴포넌트 삭제), `StartupFounderBrief`(CEOMorningHero로 흡수, `Tier1_5Coaching.tsx:303`), `coaching-history`(Tier2WeeklyPulse로 이동).
*수정:* 세 행의 상태(삭제/이동/흡수)를 MAP에 반영.

**B-3 — P2 — `apps/web/app/lib/components/dashboard/sections/Tier1_5Coaching.tsx:168` (MAP 누락)**
`MenuProfitabilityCard`(`menu-profitability`, food/cafe/service)가 렌더되지만 DASHBOARD_MAP.md에 행 없음(MAP에 "메뉴/menu" 0건). "새 카드 = MAP 한 줄" 규율(MAP:203) 위반.
*수정:* Tier1.5에 MenuProfitability 행 추가.

**B-4 — P2 — `apps/web/app/lib/hooks/usePersistence.ts:624-627` (+ apply 388-393)**
`useEcommerceStore`(`__ecommerce` nest)가 collect/apply 라운드트립엔 배선됐으나 소비 컴포넌트 0개(`ecommerce-conversion`은 `ConversionFunnelCard`가 Supabase 뷰를 직접 읽도록 대체됨). 즉 "조건 참인데 미배선"의 역방향 — **배선됐으나 死(dead) nest**. 데이터가 저장되지만 아무 데도 안 보임.
*수정:* `ecommerce-store`+`__ecommerce` 블록 제거하거나 커머스 funnel 카드를 스토어로 연결.

**업종 조건부 카드 배선(재고·메뉴수익성·예약 등):** 정적 트레이스 결과 "조건 참인데 store 미연결" 파손 **없음**. booking 계열(beauty-booking-noshow·pet-booking·space-occupancy·living-service-dispatch)은 `__bookings`, operations 계열은 전용 컬럼(inventoryItems/products/members)으로 정상 라운드트립.

---

## C. 숫자 위조 (가짜 숫자)

**강등 카드 부활 여부 — 전부 정상 (부활 0):**

| 카드 | 상태 |
|---|---|
| 예약·노쇼 | (b) 정상 게이팅 — 빈상태+`예시 데이터` 배지, 수치는 booking-analytics SSOT. "0.09%"는 카카오헤어샵 **벤치마크 표준**으로 라벨링(자기데이터 위조 아님) |
| 단골 비율 | (a) 정직 — iOS `GrowthCards.swift:793-797` 옛 하드코딩 "38/24/38" 제거, 안내문만 |
| 캠페인 아이디어 | (b) `예시 가이드` 라벨(`GrowthCards.swift:895`), 옛 가짜 per-store 수치 제거 |
| funnel WoW | (b) `ConversionFunnelCard.tsx:81` `!isEmpty` 하드게이트 — 샘플엔 WoW 미표시 |
| 채널 ROI | (a) 삭제 — `MarketingChannelROIBlock` 제거(전부 허구 상수였음) |
| costSparkline | (a) `ReportsCalculator.swift:357` `[]` 반환, 웹 `MiniSpark`는 `series<2`면 placeholder |

**C-1 — P1 — `apps/web/app/lib/components/knowledge/HiringCostCalculator.tsx:154-156` ✅정적확인**
근로자 공제(ee) 열이 **옛 2025 요율을 하드코딩**해 SSOT(`hiring-cost.ts INSURANCE_RATES_2026`)와 어긋난 **틀린 법정 요율을 사용자에게 표시**:
- 국민연금 ee `*0.045` → SSOT employee `0.0475`(9.5%) — STALE
- 건강보험 ee `*0.03545` → SSOT `0.03595`(7.19%) — STALE
- 장기요양 ee `result.health*0.1281` → SSOT rateOfHealth `0.1314` — STALE
- (고용보험 ee `*0.009`는 SSOT와 일치)
사용자(employer) 열은 `result.pension` 등 SSOT 계산을 쓰는데 **근로자 열만 자체 리터럴이 옛 값으로 굳음**. 이건 위조(C1 성격)이자 요율 SSOT 이원화 금지 규칙 위반. `hiring-cost.ts`는 이미 `empPension/empHealth/empLongTerm`(99-101줄)을 계산해 두므로 노출만 안 됨.
*수정:* ee 리터럴 삭제, `INSURANCE_RATES_2026.*.employee`(또는 result의 emp* 값)에서 파생.

**C-2 — P2 — `apps/ios/Sources/FoundOneCore/TeamLaborCost.swift:45-49`**
`enum HiringCost2026`이 `pensionEmployer 0.0475`·`healthEmployer 0.03595`·`ltcRateOfHealth 0.1314`·`employmentEmployer 0.009+0.0025`·`accidentEmployer 0.007`을 SSOT(`InsuranceRates2026`) 밖에서 전부 재정의. **현재 값은 일치**하나 `InsuranceSimulator.swift:7-9`가 명시적으로 금지한 이원화 패턴 → 드리프트 잠재.
*수정:* 로컬 상수를 `InsuranceRates2026.*` 참조로 교체.

**C-3 — P2 — `apps/ios/Sources/FoundOneFeatures/Roadmap/Stages/BUHiringCalculator.swift:38`**
`let totalRate = 0.0475 + 0.03595 + 0.004724 + accidentDec + 0.009 + 0.0025` — SSOT 요율의 인라인 리터럴 합.
*수정:* `InsuranceRates2026` 멤버로 계산.

**C-4 — P2 — `apps/ios/Sources/FoundOneFeatures/Roadmap/Stages/BudgetInsightCard.swift:56-94`**
예산 벤치마크(`avgWan/medianWan/p25Wan/p75Wan`)를 `cluster-budget-benchmarks.ts` SSOT의 iOS 미러로 하드코딩. 클러스터 집합이 **이미 분기**(iOS엔 robotics-physical-ai·biotech-medtech·semiconductor 추가, 웹 SSOT엔 없음) → 드리프트 확인됨. 웹 소비자는 SSOT import.
*수정:* TS SSOT→Swift 코드젠 또는 패리티 테스트 추가.

**C-5 — P2 (낮은 확신) — `packages/shared/src/finance/prime-cost.ts:44`**
`LABOR_EMPLOYER_BURDEN_MULTIPLIER = 1.185`가 4대보험 사용자 요율을 단일 리터럴로 롤업(`TOTAL_EMPLOYER_RATE_PCT`가 이미 export됨에도).
*수정:* `TOTAL_EMPLOYER_RATE_PCT`+퇴직충당에서 파생.

**C-1 외 대시보드 카드 표시 위조:** 신규 발견 없음(빈상태/`—`/`예시` 일관 사용). 미전수: `stages/` 하위 ~40개 stage-summary의 `|| 0`류 표시 fallback은 스팟체크만 수행.

---

## D. Cross-category subtype-set 오염 (분기 가드)

**가드 검증 — 전부 통과.** `isDigitalFulfillment(`/`isDigitalOnlineSubtype(` 25 호출줄/22파일 전수:
- **online 전용 스테이지**(sourcing/store/online-marketing/online-registration — ai-application 미도달): 가드 없이 호출해도 안전. ✅
- **공용/선택 지점**(TargetCustomer·BusinessModel·IndustrySelection·StartupType·PreLaunchFinal, 웹·iOS): 전부 `cluster==online`/`categoryId=="online-digital"` 가드 보유. ✅
- **`localizeTaskTitle`(i18n.ts:915-930)**: `industryCategoryId==="online-digital" && isDigitalOnlineSubtype()` 가드 + 주석 명시. 검증 스니펫 정적 트레이스:
  - `("launch-date-locked","ko","startup-tech","ai-application")` → step1 skip(≠online-digital) → `__startup-tech` 오버라이드 = **"D-Day…PT 확정…베타"** ✅ 스타트업 라벨
  - `(…,"online-digital","digital-products")` → `__digital` = **"자동 전달 시뮬"** ✅ 디지털 라벨
  - `(…,"online-digital","smart-store")` → isDigital=false → `__online-digital` = **"재고 동기화"** ✅ 실물 라벨
- **iOS `StageTaskRegistry.swift:38`**: `subCategory=="online-digital" && isDigitalOnlineSubtype()` 가드 보유 — ai-application이 startup-tech라 `isDigital=false`로 올바르게 디지털 분기 회피. ✅

**D-1 — P1 — iOS category override 전역 도달 불가 (웹↔iOS 드리프트) ✅정적확인**
`apps/ios/Sources/FoundOneCore/StageTaskRegistry.swift:31-52` + 모든 StageView.
- 레지스트리는 `subIndustryId`에서 `subCategory`를 도출하지만 **오직 `isDigital` 판정에만 사용**하고, category 오버라이드 조회는 여전히 `industryCategoryId` 파라미터에 의존(`if let categoryId = industryCategoryId … "\(task.id)__\(categoryId)"`).
- 그런데 **`BudgetSetupStageView`를 제외한 전 StageView가 `BUStageShell(...)`에 `industryCategoryId`를 넘기지 않음(nil)** — 42개 StageView 중 41개가 nil-category. 따라서 `industryCategoryId != nil` 브랜치가 iOS에서 **한 번도 발화하지 않음**.
- 결과: `titleOverrides`의 **`__startup-tech`(biz-registration 2건 + pre-launch-final 5건)·`__online-digital`(pre-launch-final 5건)** 오버라이드가 iOS에서 전부 도달 불가 → base(음식 flavored) 라벨로 폴백.
  - **오늘 표본 smart-store**(online-digital 실물): iOS pre-launch 액션 체크리스트가 `__online-digital`("자기 주문 시뮬·재고 동기화" / "박스·완충재·라벨지" / "송장·통신판매업")이 아니라 **음식 base**("위생교육·단말기·식자재 입고" / "메뉴판 점검" / "가스 명의 변경")를 표시.
  - **startup-tech**(ai-application 등): base 음식 라벨 표시(PT·베타·프로덕션 배포·Stripe·Product Hunt 대신).
- 웹은 `GenericTaskStageSection.tsx:93-94`가 실제 `industryCategoryId`를 `localizeTaskTitle`에 전달 → **웹은 정상, iOS만 오출력**. `__digital`(무배송) 서브타입은 `isDigital` 경로라 iOS에서도 정상 동작.
- *참고: pre-launch-final 본문(helperText·wrapup·preChecks)은 `cluster`로 분기해 정상. 결함은 하단 액션 체크리스트 라벨 한정.*
*수정(1줄 개념):* `BUStageTaskRegistry.tasks`에서 `let effectiveCategory = industryCategoryId ?? subCategory`를 만들어 가드와 오버라이드 조회 양쪽에 사용.

**D-2 — P2 (웹·iOS 공통, 드리프트 아님) — pre-launch-final base task 라벨의 음식 편향**
`launch-date-locked`/`production-deployed`/`payment-and-legal-ready` base(i18n.ts:872 / StageTaskRegistry.swift:294-298)가 "위생교육·식자재·메뉴판·가스"로 음식 특화인데, 오프라인 비(非)음식 카테고리(space·retail·beauty·fitness·pet·education·living-service)엔 별도 `__{category}` 오버라이드가 없어 이 음식 base가 폴백으로 노출됨. **오늘 표본 shared-office·practice-room도 해당** — 파티룸/공유오피스에 "위생교육·식자재·가스"는 부적합. 웹·iOS **양쪽 동일**(드리프트 아님)이라 P2.
*수정:* 오프라인 공통 중립 base 신설 또는 카테고리별 오버라이드 추가. (액션 체크리스트 라벨 한정 영향)

---

## 종합
- **P0:** 0건
- **P1:** 2건 — **C-1**(인건비 계산기 근로자 4대보험 공제율 옛 2025 요율 표시 = 틀린 법정 수치), **D-1**(iOS category override 전역 도달 불가 → 스타트업·온라인 실물 셀러 pre-launch 라벨이 음식 base로 오출력, 웹↔iOS 드리프트)
- **P2:** 8건 (B 4건, C 4건, D 1건 — 일부 중복 카운트 제외)
- 빌드/테스트: typecheck 0 에러, vitest 449/449 통과. 강등 카드 부활 0.
