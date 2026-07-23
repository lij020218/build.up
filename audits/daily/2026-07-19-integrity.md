# Found.One 데일리 정합성 감사 — 2026-07-19

> **모드**: 리포트 전용 (코드 수정·커밋 없음). 미확인 항목은 "미확인"으로 표기.
> **오늘 표본 (day=19, 인덱스 57·58·59 / 70종)**: `newsletter-membership`(online-digital·디지털 무배송), `global-buying`(online-digital·실물 크로스보더), `ai-application`(**startup-tech**·디지털 set의 D-트랩 대상). 온라인+스타트업 모두 포함 → 표본 교체 불요.

## 4줄 요약
- **A (업종 정합)**: 이상 없음. 3개 표본 모두 선택·후반 스테이지에서 올바르게 분기(디지털 무배송/실물/스타트업), 웹↔iOS StartupType 미러 드리프트 없음.
- **B (대시보드 등록/렌더)**: 기능 결함 0. typecheck EXIT=0·vitest 449/449 통과. **DASHBOARD_MAP.md 문서 드리프트 3건(P2)** — MenuProfitability 누락·CoachingHistory 위치 오기·IntegrationHub 자기모순.
- **C (숫자 위조)**: 부활한 가짜 숫자 0(강등 카드는 실 store 데이터로 정상 계산). 4대보험 요율은 SSOT와 **일치**하나 표시용 프로즈/표에 하드코딩 중복(P2 드리프트 리스크).
- **D (subtype-set 오염)**: 이상 없음. `isDigitalOnlineSubtype`/`isDigitalFulfillment` 호출부 **21개(웹 11·iOS 9·shared 1) 전수 확인**, 공용 도달점(pre-launch-final·task label)은 모두 카테고리/클러스터 가드 존재. 검증 스니펫 3케이스 실측 통과.

---

## A. 로드맵 업종 정합 (하드코딩 누출)

**결과: 이상 없음 (P0/P1/P2 발견 0)**

표본별 검증:
- **newsletter-membership** (online-digital, 디지털 무배송): sourcing/store 스테이지가 `isDigitalFulfillment`→`DigitalFulfillmentNotice`로 재분기. 노티스 본문(`DigitalFulfillmentNotice.tsx:29,45`)은 택배·포장·소싱·KC인증을 "물리 상품 이야기"로 **대비**시켜 명시 — 누출이 아니라 올바른 배제. StartupType 온라인-디지털 항목(`StartupTypeSelectionStage.tsx:55-62`)은 "재고·인테리어·권리금 없음" 명문.
- **global-buying** (online-digital, 실물 크로스보더): `isDigitalContent=false` → 위탁·사입·MOQ·해외구매대행 실물 트랙 정상 수신(`StartupTypeSelectionStage.tsx:34-39`, next-summary:51). 실물 어휘가 올바른 대상에 노출.
- **ai-application** (startup-tech): `startupTypeCluster="tech"` → 런웨이·MVP·베스팅 항목(`:40-47`) 수신. 오프라인·커머스 어휘 누출 없음.
- **웹↔iOS 드리프트**: `StartupTypeStageView.swift:65-122`가 웹 SSOT를 1:1 미러(클러스터 로직·online-digital 항목·franchiseAvailable 가드 동일). 한쪽만 수정된 문구 없음.
- 오프라인 어휘(권리금·상권·인테리어·입지·메뉴판) grep → `apps/web/.../stages/online/` 0건. startup 계열 히트는 `StartupTypeSelectionStage.tsx`뿐이며 전부 offline-cluster 키 내부(가드됨).

## B. 운영대시보드 카드 등록/렌더

**실행**: `pnpm -C apps/web typecheck` → **EXIT=0** · `vitest run`(repo 루트) → **61 files / 449 tests 전부 통과**.

**기능 결함 0** — 조건부 카드 렌더 경로 정상:
- 재고(`Tier1_5Coaching.tsx:84` `showInventory = !usesSubscriptions && businessCtx.showInventoryCard && showByMatrix("inventory-ops")`)·메뉴 수익성(`:168` `showByMatrix("menu-profitability")`) 조건 모두 매트릭스(`industry-card-matrix.ts:117~227`, food/cafe/beauty/edu/pet/space 등)에서 참이 됨 — 정적 검증 OK.
- 신규 Zustand store(booking-store·ecommerce-store)는 `industry_specifics` nest에 정상 연결: apply(`usePersistence.ts:381,388` 오브젝트 가드 + hydrate), collect(`:618-628` isDemo 필터, `if(includeEmpties)` 가드 `:572` 하에서만) — 라운드트립 완결·서버 wipe 방지 확인.

**문서 드리프트 (P2×3)** — `DASHBOARD_MAP.md` 인덱스가 실제 등록과 어긋남(정합성 자체엔 무해하나 "5초 안에 찾기" 규율 위반):
1. **P2** · `sections/Tier1_5Coaching.tsx:170` (등록됨) ↔ `DASHBOARD_MAP.md`(누락) — **MenuProfitabilityCard가 맵에 없음**. 2026-06-23 신설 후 맵 미기재. → 맵 Tier 1.5 표에 "(a-1.5) 메뉴 수익성" 한 줄 추가.
2. **P2** · `DASHBOARD_MAP.md:63` — CoachingHistory를 `Tier1_5Coaching.tsx`로 기재하나 실제 렌더는 `Tier2WeeklyPulse.tsx:53`(Tier1_5엔 "제거됨" 주석만, `:13`). → 맵 위치를 Tier 2로 정정.
3. **P2** · `DASHBOARD_MAP.md:62` ↔ `:83` — IntegrationHub를 62행은 "Tier1_5Coaching 상단 카드"로, 83행은 "profile/로 이동"으로 **자기모순** 기재(실제 Tier1_5 미렌더). → 62행 삭제.
   - (부수: 맵 ec-1행은 "EcommerceConversion"이나 실제 컴포넌트명은 `ConversionFunnelCard` — 라벨/컴포넌트 명명 드리프트, 카드는 존재.)

## C. 숫자 위조 (가짜 숫자)

**부활한 가짜 숫자 0.**
- 강등 이력 카드(예약·노쇼, 단골/재의뢰율, 캠페인 아이디어, funnel WoW, 채널 ROI, costSparkline) grep → 하드코딩 상수 부활 없음. `LivingServiceDispatchCard.tsx:69` `repeatRate`는 실 bookings에서 `bookingRepeatRate(...)`로 계산 + `uniqueCustomers>=10` 게이트. `costSparkline`(iOS `ReportsCalculator.swift:190`)은 실 6개월 비용 합산.
- "runway 99" 등 하드코딩 런웨이 leftover → `apps/web/.../dashboard` 0건(과거 CEO히어로 잔재 미확인 → 이번 grep에선 미검출).

**매직넘버 중복 (P2 — 드리프트 리스크, 현재 값 일치)**:
- **P2** · `apps/web/.../stages/offline/InsuranceTaxSetupStage.tsx:308,412` + iOS `InsuranceTaxSetupStageView.swift:166-169` — 4대보험 요율(국민연금 9.5%·건강보험 7.19%·고용 1.8%)을 **표시용 프로즈/표에 문자열 하드코딩**. 값은 SSOT(`finance/hiring-cost.ts:11-17` `INSURANCE_RATES_2026`, iOS `InsuranceSimulator.swift:23-38` `InsuranceRates2026`)와 **일치**하므로 현재 오류 아님. 단 SSOT 요율 변경 시 이 표시 문자열은 자동 갱신 안 됨(2027 국민연금 10% 등 예정) → 계산 SSOT 상수를 표시 문자열에도 주입 권장. (iOS `InsuranceSimulator.swift:8` 주석은 "StageView가 상수를 참조한다"고 하나 실제 StageView는 문자열 하드코딩 — 주석·구현 불일치.)

## D. Cross-category subtype-set 오염 (분기 가드)

**결과: 이상 없음.** `isDigitalFulfillment(` / `isDigitalOnlineSubtype(` 호출부 **21개 전수 확인** (웹 11 · iOS 9 · shared 1):
- **공용 도달점(전 클러스터) — 가드 필수, 전부 존재**:
  - shared `i18n.ts:920` `localizeTaskTitle`: `industryCategoryId === "online-digital" && isDigitalOnlineSubtype(...)` — 카테고리 가드 O (`:918-919`에 ai-application 트랩 경고 주석까지 존재).
  - iOS `StageTaskRegistry.swift:38`: `subCategory == "online-digital" && isDigitalOnlineSubtype(...)` — 가드 O.
  - 웹 `PreLaunchFinalStage.tsx:41`: `isOnline && ...`(`isOnline = categoryId==="online-digital"`, `:39`), startup은 별도 `isStartup` 분기 — 가드 O.
  - iOS `PreLaunchFinalStageView.swift:116`: `if case .online = cluster { ... }` — 가드 O.
- **online 전용 스테이지(ai-application 미도달) — 가드 불요, 안전**: `SourcingSetupStage.tsx:11`·`StoreSetupStage.tsx:11`·`OnlineMarketingStage.tsx:11` 및 iOS 동명(`SourcingSetupStageView:53`·`StoreSetupStageView:50`·`OnlineMarketingStageView:29`).
- **선택 스테이지 — `cluster==="online"` 가드 존재**: Target/IndustrySelection/StartupType/BusinessModel × (웹+iOS).

**검증 스니펫 실측** (임시 vitest, 실행 후 삭제):
- `localizeTaskTitle("launch-date-locked","ko","startup-tech","ai-application")` → `"D-Day 화·수 12:01 PT ... 베타 사용자 10명 ..."` ✅ 스타트업 라벨(베타/PT)
- `(...,"online-digital","digital-products")` → `"... 자동 전달 시뮬 ..."` ✅ 디지털 라벨
- `(...,"online-digital","smart-store")` → `"... 재고 동기화 후 ..."` ✅ 실물 라벨
→ 3/3 통과. **P0 회귀 없음.**

---

## 커버리지 기록 (침묵≠전수확인)
- **표본 업종 3**: newsletter-membership · global-buying · ai-application.
- **읽은/grep한 핵심 파일**: `starter-data.ts`, `digital-subtypes.ts`, `i18n.ts`(localizeTaskTitle·taskTitleCopy), `StartupTypeSelectionStage.tsx`(+iOS 미러), `DigitalFulfillmentNotice.tsx`, `PreLaunchFinalStage.tsx`(+iOS), `DASHBOARD_MAP.md`, 5개 Tier 섹션, `usePersistence.ts`(nest apply/collect), `booking-store.ts`/`ecommerce-store.ts`, `finance/hiring-cost.ts`·`mandatory-insurance.ts`, iOS `InsuranceSimulator.swift`·`InsuranceTaxSetupStageView.swift`·`StageTaskRegistry.swift`·`ReportsCalculator.swift`.
- **실행 명령**: `pnpm -C apps/web typecheck`(EXIT=0), `vitest run`(449/449), 임시 D-트랩 vitest(3/3, 삭제 완료).
- **D grep 호출부 수**: `isDigitalFulfillment(`/`isDigitalOnlineSubtype(` **21개** 전수 분류(공용 4·online전용 6·선택 10·정의 1).
- **미확인**: 과거 CEO히어로 runway 잔재(이번 grep 미검출, 별도 확인 안 함), online-marketing/tax-guide/loan-guide 스테이지의 표본별 세부 문구는 상위 grep 수준까지만 확인(라인별 정독 미실시).

**발견 요약**: P0/P1 = 0건, P2 = 4건(대시보드 맵 문서 드리프트 3 + 4대보험 표시 요율 하드코딩 중복 1).
