# Found.One 데일리 정합성 감사 — 2026-07-16

> **코드 수정 없음 — 리포트 전용.** 직전 감사 = `2026-07-13-integrity.md` (그 이후 커밋 50개). 선행 감사 항목은 "재발견"이 아니라 **carry-over(미수정) 여부를 재검증**해 표기했다.

## 4줄 요약
- **A (업종 정합/하드코딩 누출):** 🔴 **P1 5건(신규 3 + carry-over 2) + P2 4건** — 최악은 ① `PreLaunchFinalStage` **traps가 `isStartup` 2-way 분기뿐**이라 **온라인 셀러(스마트스토어·디지털)에게 "냉장 0-10℃·냉동 -18℃ 위생점검"·"배민·쿠팡이츠 광고"** 경고가 그대로 노출(가드 자체가 부재 — 서브에이전트 보고보다 범위가 넓어 본인 직접 재확인). ② `LocationCandidatesStage`가 **space 키 부재 → `?? compareFavorable.food` 폴백**(웹·iOS 동일)으로 파티룸·렌탈스튜디오 사장님이 "음식점·회전율·객단가 8천~1.2만" 입지 전략 수신. ③ pre-launch-final 30일 플레이북·액션플랜·마무리가 offlineKind 미분기로 space에 외식 카피.
- **B (대시보드 카드 등록/렌더):** 🔴 **P1 2건 + P2 9건** — 🔴 **phantom 업종 ID `"ecommerce"`**: categoryId SSOT(11종)에 존재하지 않는 값이라 ① `ecommerce-conversion` 카드는 **어떤 사장님에게도 렌더 불가(dead feature)**, ② `inventory-ops.industries`에서 `"online-digital"` 자리를 phantom이 차지해 **온라인 셀러가 재고 카드를 못 봄**(businessCtx는 true인데 matrix가 false → AND 게이트 차단). 7/13 지적 4건은 **전부 미수정**. `typecheck` exit 0 / `vitest` **60파일 444테스트 통과**.
- **C (숫자 위조):** 🔴 **P1 1건(carry-over) + P2 2건** — `HiringCostCalculator.tsx:154-156`의 **근로자 4대보험 stale 2025 요율(4.5%/3.545%/12.81%)** 이 7/13 지적 후에도 **미수정**(같은 표 사업주 컬럼은 2026 SSOT값 → 한 카드 내 불일치). 신규: `prime-cost.ts:34` 주석이 **고용안정 0.25% 누락된 옛 합계(≈10.4%)** 를 재생산. 위조 부활 **0건**, 런웨이 99 위조는 **수정 확인**(burn=0 → `-1` → "비용 입력 필요"). 세부업종 예산 벤치마크 웹↔iOS **59/59 키·295/295 수치 드리프트 0**.
- **D (Cross-category subtype 오염):** ✅ **이상 없음** — `isDigitalFulfillment`/`isDigitalOnlineSubtype` **실호출 20곳 전수** 가드 확인. 공용 분기점(pre-launch-final, `localizeTaskTitle`, `StageTaskRegistry`) 모두 카테고리/클러스터 가드 보유. **런타임 검증 통과**: `localizeTaskTitle("launch-date-locked","ko","startup-tech","ai-application")` → 스타트업 라벨(디지털 "자동 전달" 아님), digital-products → 디지털, smart-store → 실물(3/3). 라우팅상 ai-application은 online 전용 스테이지 **미도달** 재확인(`starter-data.ts:1330-1343`).

---

## 커버리지 (침묵=전수확인 착시 방지)

- **표본 업종 (day=16 → 인덱스 48·49·50 / 전체 70):**
  - 48 = `rental-studio` (space, 오프라인) — **NOT CLEAN**
  - 49 = `party-room` (space, 오프라인) — **NOT CLEAN**
  - 50 = `study-cafe-space` → **규칙에 따라 `ai-application`(startup-tech)으로 교체** (표본에 온라인/스타트업 부재). — **CLEAN**
- **실행 명령 (증거):**
  - `pnpm -C apps/web typecheck` → **exit 0**
  - `pnpm exec vitest run` → **60 files / 444 tests passed, 0 failed** (7/13 대비 +2파일 +8테스트)
  - D 런타임 검증: 임시 스펙으로 `localizeTaskTitle` 4케이스 실행 → **4/4 통과** (실행 후 스펙 삭제)
  - C 수치 검증: python으로 `SPECIALTY_BUDGET_BENCHMARKS`(웹) ↔ `specialtyBenchmarks`(iOS) **59키 × 5필드 전수 diff → 드리프트 0**
- **D grep 호출부 수:** `isDigitalFulfillment(`/`isDigitalOnlineSubtype(` = **22 grep 히트 → 실호출 20곳**(2건은 재수출 위임) 개별 가드 확인.
- **검사 파일:** 웹 `PreLaunchFinalStage.tsx`(41-250, 688-1010, 1190-1215, 1330-1360, 1700-1839), `LocationCandidatesStage.tsx`(78-220), `TargetCustomerStage.tsx`(55-172), `PlatformSetupStage.tsx`, `OnlineRegistrationStage.tsx`, `BudgetSetupStage.tsx`, 선택 4단계, `DigitalFulfillmentNotice.tsx`; iOS `PreLaunchFinalStageView.swift`(113-560, 620-734), `LocationCandidatesStageView.swift`(40-560), `TargetCustomerStageView.swift`, `StageTaskRegistry.swift`(11-50, 294-345), `BudgetInsightCard.swift`(1-520), `TeamLaborCost.swift`, `InsuranceSimulator.swift`; shared `i18n.ts`(860-935), `digital-subtypes.ts`, `starter-data.ts`(1219-1345), `cluster-budget-benchmarks.ts`, `finance/hiring-cost.ts`(1-40), `finance/prime-cost.ts`(25-50), `constants/benchmarks.ts`, `business-context.ts`(82-131); 대시보드 `sections/`(8 tier 전체 + `DASHBOARD_MAP.md` 1-214), `industry-card-matrix.ts`(전체), `dashboard-cards-meta.ts`(전체), `usePersistence.ts`(360-439, 600-648), `useComputedDashboard.ts`(150-174); 신규 payroll 경로(`api/cron/payroll-check/route.ts`, `StaffDetailModal.tsx`), `api/ai/insights/industry-daily/route.ts`(189-232).
- **미확인:**
  - **실렌더 미검증** — 모든 판정은 정적 코드 경로 추적 기반. 특히 A-1(온라인 셀러 위생 경고)·A-2(space→food 폴백)는 웹 `__fo_preview` / iOS simctl 실렌더로 재확인 권장.
  - B-3(`space` 재고)·B-4(`beauty`/`living-service` 재고)의 **의도**는 코드·MAP·주석이 서로 달라 사장님 확인 필요.
  - 각 결함의 신규/기존 여부는 `git blame` 미실행 → 미확인(불변식 위반은 신규/기존 불문 유효).
  - `menu-design` 단계의 space 정합성, 영문(en) 카피 전수 대조 — 범위 밖.

---

## 결함 상세

### 🔴 P1 — [A] pre-launch-final traps에 클러스터 가드가 없어 **온라인 셀러에게 냉장고·배달앱 경고** (NEW)
- **파일:** `apps/web/app/lib/components/stages/shared-tail/PreLaunchFinalStage.tsx:124`(선언), `:226-227`(냉장·전기가스), `:241-242`(배민·쿠팡이츠), `:1197-1199`(TrapsCard), `:1347`(pg 0 렌더 — 게이트 없음)
- **무엇이 틀렸나:** `const traps = isStartup ? {…} : {…}` — **2-way 분기뿐**이고 `isOnline`·`offlineKind` 가드가 **아예 없다**. `TrapsCard`는 `{pg === 0 && (<>…<TrapsCard /></>)}` 식으로 **클러스터 게이트 없이** 4개 페이지(`:1347,1477,1641,1716`)에 렌더된다. 같은 파일이 제목·본문은 `isOnline ? …`로 분기(`:1358,:1488`)하므로, **온라인 셀러가 "오픈 전 최종 점검" 페이지에서 "위생 점검 적발 시 시정명령 — 냉장 0-10℃ / 냉동 -18℃ 이하 확인 + 온도계 부착"** 을, 마지막 페이지에서 **"배민·쿠팡이츠 광고는 D+7 이후"** 를 받는다. 무점포 디지털 판매자에게 냉장고·배달앱은 성립 자체가 불가. space(파티룸·렌탈스튜디오)도 동일 피해.
- **수정 제안:** `traps`를 `isStartup ? … : isOnline ? …(온라인 트랩) : offlineKind별 …`로 3-way 이상 분기 — 이미 `checklist`(`:250`)·`roles`(`:458`)가 쓰는 분기 패턴을 그대로 적용.

### 🔴 P1 — [A] 입지 전략이 space 키 부재로 **음식점 카피 폴백** (웹·iOS 동일) (NEW)
- **파일:** `apps/web/.../selection/LocationCandidatesStage.tsx:189-215`(`compareFavorable` 맵에 `space`·`living-service` 키 없음), `:217`(`?? compareFavorable.food`) / `apps/ios/.../LocationCandidatesStageView.swift:557-558`(`default: return favorableTip(categoryId: "food", tier: tier)`)
- **무엇이 틀렸나:** `compareFavorable`은 food·cafe-dessert·retail·beauty·fitness·education·pet·online-digital **8키만** 보유. space는 오프라인 경로라 이 단계를 반드시 통과하는데 키가 없어 **묵시적으로 음식점 전략**을 받는다 → 파티룸 사장님이 `"예산 8천만원 이하 + 음식점"`, `"메인 상권 + 코너·1층 가시성 — 회전율 모델"`, `"객단가 8천~1.2만 모델 BEP"` 를 자기 전략으로 안내받음. 시간제 예약·가동률 모델에 회전율·객단가는 비성립. **폴백이 중립이 아니라 특정 업종**이라 침묵 오염(에러 없이 그럴듯하게 틀림).
- **수정 제안:** `space`(가동률·야간 출입·방음·주차)·`living-service` 키 추가 + 폴백을 `food`가 아닌 업종 중립 카피로 교체(웹·iOS 동시).

### 🔴 P1 — [A] pre-launch-final의 30일 플레이북·액션플랜·마무리가 offlineKind 미분기 → space에 외식 카피 (NEW)
- **파일:** `apps/web/.../PreLaunchFinalStage.tsx:1723`(게이트가 `!isStartup && !isOnline` 뿐), `:1732`("한국 외식업 폐업률 15.8%"), `:1743`·`:1751-1755`("메뉴 매출 추적(POS)"·"낭비 메뉴 단종"·"식재료비"), `:1768`("배달앱 광고 ON (음식점만)"), `:1803`("메뉴·서비스·입지 재점검 / 한국 음식업 데이터") · 액션플랜 `:850`(선언), `:984-999`("식자재 첫 발주"·"냉장 0~10℃"·"메뉴 2") · 마무리 `:1813-1814`("메뉴판"·"시그니처 메뉴 시연"), `:1832`("음식점 — 식약처 위생 등급제")
- **무엇이 틀렸나:** 같은 파일의 `offlineKind` 7버킷(`:44-52`)이 `checklist`·`roles`에는 적용되나 이 3개 블록은 **offline 전체를 외식으로 간주**. 표본 2종(space)이 그대로 피해.
- **수정 제안:** 세 블록을 `offlineKind`로 분기(최소 food / 그 외 중립).

### 🔴 P1 — [A] iOS PreLaunchFinal whyPage/dayPage/prPage 외식 하드코딩 — **STILL PRESENT (7/13 carry-over)**
- **파일:** `apps/ios/.../PreLaunchFinalStageView.swift:503`("음식점 폐업의 주요 원인"), `:512`("최종 식자재 발주"), `:514`("홀·주방 대청소"), `:537`("식자재 냉장 온도 기록"), `:609-610`("홀 테이블·주방 기기·냉장고"·"오늘 메뉴"), `:659`("음료 서비스"), `:678`("인기 메뉴 정리")
- **무엇이 틀렸나:** cluster(`:21-72`)·offlineKind(`:122-134`)가 존재하고 `preChecks`/`dayChecks`는 분기됐으나 **페이지 본문 3개만 미분기**. 웹은 4페이지 전 배열이 분기 → **웹↔iOS 드리프트 지속**. 표본 2종(cluster=.offline, offlineKind=.space)에도 외식 카피.
- **수정 제안:** whyPage/dayPage/prPage의 hero·타임라인·warning을 cluster+offlineKind로 분기해 웹과 1:1 미러.

### 🔴 P1 — [A] digital-products(무배송)가 PlatformSetup에서 물리배송 문구 수신 — **STILL PRESENT (7/13 carry-over)**
- **파일:** 웹 `.../online/PlatformSetupStage.tsx:15`(쿠팡 로켓그로스 풀필먼트), `:18`(G마켓 묶음배송), `:141` / iOS `PlatformSetupStageView.swift:94`
- **무엇이 틀렸나:** 파일 전체 grep 결과 `isDigitalFulfillment` **부재**(가드 없음). online-digital → platform-setup 라우팅이라 digital-products가 도달 → 뒤따르는 `DigitalFulfillmentNotice`("택배·포장이 없습니다")와 정면 모순. Sourcing/Store/OnlineMarketing은 정상 가드 — platform-setup만 누락. ※ ai-application은 라우팅상 미도달이라 무관.
- **수정 제안:** `isDigitalFulfillment` 게이팅으로 무배송 서브타입엔 크몽·클래스101·스티비 등 디지털 채널 카드 노출.

### 🔴 P1 — [B] phantom 업종 ID `"ecommerce"` — `ecommerce-conversion` 카드 **렌더 불가(dead feature)** (NEW)
- **파일:** `apps/web/app/lib/industry-card-matrix.ts:42`(`IndustryId` union), `:477-478`(`industries: ["ecommerce"]`), 게이트 `sections/Tier1_5Coaching.tsx:216`, 이중 게이트 `ConversionFunnelCard.tsx:51`
- **무엇이 틀렸나:** categoryId SSOT(`starter-data.ts` `meta.categoryId`)가 산출하는 값은 **11종뿐** — `beauty, cafe-dessert, education, fitness, food, living-service, online-digital, pet, retail, space, startup-tech`. **`"ecommerce"`는 없다**(python 전수 추출로 확인). 이커머스는 `marketing-trend-clusters.ts:123-124`에서 smart-store·consignment-commerce → cluster `"ecommerce"` → categoryId `"online-digital"`로 매핑되는 **세부업종 클러스터이지 카테고리가 아님**. 따라서 `industryCategoryId === "ecommerce"`는 정상 플로우에서 성립 불가 → 카드가 영구 미노출. 같은 phantom 분기가 `CashflowSetupSheet.tsx:667,802`에도 존재(dead branch 방증).
- **수정 제안:** `"ecommerce"` → `"online-digital"` 로 교체(matrix union·CARD_META·`ConversionFunnelCard.tsx:51`).

### 🔴 P1 — [B] 온라인 셀러가 재고 카드를 못 봄 (phantom이 자리 차지) (NEW)
- **파일:** `apps/web/app/lib/industry-card-matrix.ts:342`(`inventory-ops.industries: ["food","cafe-dessert","retail","ecommerce","pet","space"]`), 게이트 `sections/Tier1_5Coaching.tsx:84`
- **무엇이 틀렸나:** `business-context.ts:86-110`은 `online-digital` → `inventoryMode:"unified"` → `showInventoryCard=true`("내 제품" 라벨까지 준비). 그러나 matrix 목록에 `"online-digital"`이 없고 **성립 불가한 `"ecommerce"`가 그 자리**에 있다. 게이트는 `businessCtx.showInventoryCard && showByMatrix("inventory-ops")` **AND**라 → **조건이 참인데 카드 미등록**. `DASHBOARD_MAP.md:65`가 약속한 "재고=…이커머스…"는 실제로 아무에게도 안 간다.
- **수정 제안:** `:342`의 `"ecommerce"` → `"online-digital"`.

### 🔴 P1 — [C] HiringCostCalculator 근로자 4대보험 stale 2025 요율 — **STILL PRESENT (7/13 carry-over)**
- **파일:** `apps/web/app/lib/components/knowledge/HiringCostCalculator.tsx:154-156`
- **무엇이 틀렸나:** SSOT `packages/shared/src/finance/hiring-cost.ts:11-13`은 2026 요율(국민연금 `0.0475`·건강 `0.03595`·장기요양 `0.1314`). 그런데 근로자 컬럼은 `monthlySalary * 0.045`(4.5%), `* 0.03545`(3.545%), `result.health * 0.1281`(12.81%)로 **2025 옛 요율 하드코딩**. 같은 표 사업주 컬럼은 SSOT 2026값 → **한 카드 안에서 사업주 4.75% / 근로자 4.5%** 불일치 + 2026 법정요율 위반. 7/13 지적 후 **3일간 미수정**.
- **수정 제안:** `INSURANCE_RATES_2026`를 import해 `ee = totalGross × rates.*.employee`로 계산(리터럴 3개 → SSOT 참조).

### 🟡 P2 — [A] pre-launch-final **task 라벨 base가 외식** (space 오버라이드 부재)
- **파일:** `packages/shared/src/i18n.ts:872-873` / iOS 미러 `StageTaskRegistry.swift:296-297`(문자열 동일 — drift 없음)
- **무엇이 틀렸나:** `"launch-date-locked"` base = "…(위생교육·단말기·**식자재 입고** 후 평일)", `"production-deployed"` base = "단말기·POS·Wi-Fi·**간판·메뉴판** 4중 점검". `__startup-tech`·`__online-digital`·`__digital` 오버라이드는 있으나 **space/offline 세부 계층이 없어** base(외식)가 그대로 노출.
- **수정 제안:** `{taskId}__space` 계층 추가 또는 base를 업종 중립으로 재작성.

### 🟡 P2 — [A] pre-launch-final offline 사례 카드가 카페·식당 예시 고정
- **파일:** `apps/web/.../PreLaunchFinalStage.tsx:688`(`cases` 선언, offlineKind 미분기), `:707-708`("카페 X"·"식당 Y")
- **수정 제안:** space용 사례(예약·가동률) 추가 또는 업종 중립 사례.

### 🟡 P2 — [A] OnlineRegistrationStage가 digital-products에도 "스마트스토어·쿠팡" 고정 — **STILL PRESENT (carry-over)**
- **파일:** `apps/web/.../online/OnlineRegistrationStage.tsx:44,54`
- **수정 제안:** 본문 카피를 `isDigitalFulfillment` 분기 또는 "판매 채널"로 일반화.

### 🟡 P2 — [A] PlatformSetup 웹↔iOS 수수료 문자열 드리프트 — **STILL PRESENT (carry-over)**
- **파일:** 웹 `PlatformSetupStage.tsx:141`("…55,000원 (그 이하 청구 X) + 로켓그로스…") vs iOS `PlatformSetupStageView.swift:94`("…55,000원 (VAT 포함) + 로켓그로스 입점 시 별도 수수료. 매출 미달 시 정액 청구 X")
- **수정 제안:** 플랫폼·수수료 문자열을 shared SSOT로 승격해 1:1 미러.

### 🟡 P2 — [B] `space`: 재고 필수 선언인데 렌더 영구 차단
- **파일:** `industry-card-matrix.ts:342`·`INDUSTRY_CARDS.space:225-231`(inventory-ops 선언) vs `business-context.ts:89,110`(space=`minimal` → `showInventoryCard=false`)
- **무엇이 틀렸나:** AND 게이트에서 영구 차단. `DASHBOARD_MAP.md:65`의 "공간" 포함 주장도 거짓. **의도 미확인**.
- **수정 제안:** matrix에서 `"space"` 제거하거나 `business-context.ts:110`에 `|| id === "space"` 추가 — 의도 확정 후 택1.

### 🟡 P2 — [B] `beauty`/`living-service`: businessCtx는 소모품 재고 on, matrix는 off (+ 주석이 정반대)
- **파일:** `business-context.ts:88`(service 모드 → `showInventoryCard=true`) vs `industry-card-matrix.ts:342`(미포함) / 주석 `sections/Tier1_5Coaching.tsx:82-83`("두 플래그 모두 true (beauty/pet 등) → 재고 + 고객 둘 다")
- **무엇이 틀렸나:** 미용실 사장님의 소모품 재고 카드가 미렌더인데 **주석은 렌더된다고 서술** → 코드·주석 불일치가 다음 작업자를 오도. **의도 미확인**.
- **수정 제안:** 의도대로 matrix에 `beauty`·`living-service` 추가하거나 주석 정정.

### 🟡 P2 — [B] `INDUSTRY_CARDS` + `getDefaultCardsForIndustry` = 소비자 0인 dead code
- **파일:** `industry-card-matrix.ts:112-256`, `:540-547` / MAP `:164-179`("업종 라우터" 표)
- **무엇이 틀렸나:** 전 repo grep 결과 호출처 0. 실제 게이트는 `CARD_META.industries` 기반 `shouldShowCardByIndustry`(`:550-556`)뿐이며 **둘의 내용이 이미 불일치**(`INDUSTRY_CARDS.food`는 `prime-cost`·`daily-improvement`를 필수 선언하나 두 카드는 렌더 삭제됨). MAP 표는 이 dead 배열을 문서화 → 표 전체가 실동작과 무관.
- **수정 제안:** dead 배열·함수 삭제하고 `CARD_META` 단일 SSOT 명시.

### 🟡 P2 — [B] 죽은 토글 4개 (마이페이지에 뜨지만 무효)
- **파일:** `dashboard-cards-meta.ts:85`(daily-kpi-strip), `:138`(prime-cost), `:147`(daily-improvement), `:155`(avg-ticket-upsell)
- **무엇이 틀렸나:** 네 컴포넌트 파일은 존재하나 **importer 0건**(직접 확인). 사장님이 토글해도 아무 일도 안 일어남.
- **수정 제안:** meta 엔트리 + orphan 컴포넌트 파일 삭제.

### 🟡 P2 — [B] `coaching-history` 토글이 무시됨 / `menu-profitability` 토글 부재
- **파일:** `sections/Tier2WeeklyPulse.tsx:53`(`<CoachingHistoryCard ko={ko} />` — `hide()` 가드 없이 무조건 렌더, meta `:173`에 토글은 존재) / `dashboard-cards-meta.ts`(menu-profitability 엔트리 없음 — `Tier1_5Coaching.tsx:71`이 `hide("menu-profitability")`를 부르지만 카탈로그 부재라 항상 노출)
- **수정 제안:** `{!hide("coaching-history") && <CoachingHistoryCard ko={ko}/>}` + meta에 `menu-profitability` 엔트리 1줄 추가.

### 🟡 P2 — [B] 토글 카탈로그와 대시보드가 **다른 업종 소스**를 씀
- **파일:** `profile/DashboardLayoutCard.tsx:41`(`profile-store.selectedIndustryCategoryId`) vs `hooks/useComputedDashboard.ts:157-167`(roadmap decisions 우선, 없으면 `"food"` 폴백)
- **무엇이 틀렸나:** 두 값이 갈리면 **토글 목록과 실제 렌더가 불일치**.
- **수정 제안:** 파생 `industryCategoryId`를 단일 소스로 통일.

### 🟡 P2 — [B] matrix 미등록 ID는 fallback true → 오노출
- **파일:** `industry-card-matrix.ts:552`(`if (!meta) return true`) / 미등록: `customer-summary`, `saas-funnel-conversion`, `ritual-banner`
- **무엇이 틀렸나:** "기술 스타트업만"이라고 적힌 `saas-funnel-conversion` 토글이 음식점 사장님에게도 노출.
- **수정 제안:** 세 ID를 `CardId`+`CARD_META`에 등록(또는 fallback을 false로).

### 🟡 P2 — [B] ecommerce-store 고아 라운드트립 — **STILL PRESENT (carry-over)**
- **파일:** `apps/web/app/lib/stores/ecommerce-store.ts` / `usePersistence.ts:388-394`(hydrate)·`:616-628`(collect) / MAP `:78`
- **무엇이 틀렸나:** 라운드트립은 살아있으나 `useEcommerceStore`의 **UI 리더 0건**. `adSpends`/`returns`를 읽던 `EcommerceConversionCard`가 `ConversionFunnelCard`로 통합되며 데이터 소스가 `saas_metrics`로 갈아탐. 위조는 아니나 죽은 왕복. (참고: `booking-store`는 hydrate·collect·wipe·UI 리더 5개 모두 정상.)
- **수정 제안:** 커머스 카드에서 `adSpends`/`returns`를 노출하거나 persistence 배선 + MAP 주장 제거.

### 🟡 P2 — [B] DASHBOARD_MAP 전면 stale (7/13 lean 재설계 미반영)
- **파일:** `sections/DASHBOARD_MAP.md`
- **MAP에 있는데 미등록:** `:15`(Tier1.5 "6 카드" 구성 — 개선·업셀 삭제됨), `:53`(DailyKpiStrip — `Tier1DailyHub.tsx:134-135`에서 제거), `:62`(IntegrationHub — 삭제됨. **MAP `:83`에 삭제 행이 별도로 있어 한 문서 안에서 자기모순**), `:63`(CoachingHistory 위치 — Tier2로 이동), `:67`(PrimeCost — 렌더 삭제), `:68`(DailyImprovement/AvgTicketUpsell — 렌더 삭제), `:71`(StartupFounderBrief — CEOMorningHero 흡수), `:78`(EcommerceConversion — 위 P1로 렌더 불가)
- **MAP에 없는데 렌더됨:** `MenuProfitabilityCard`(`Tier1_5Coaching.tsx:168-172`), `ConversionFunnelCard mode="saas"`(`:225-229`), `CustomerSummaryCard` in Tier1.5(`:99-105`), `CoachingHistoryCard` in Tier2(`Tier2WeeklyPulse.tsx:53`)
- **수정 제안:** lean 재설계 결과로 MAP 전면 갱신 + 자기모순 행(`:62` vs `:83`) 정리.

### 🟡 P2 — [C] prime-cost 주석이 **고용안정 0.25% 누락된 옛 합계**를 재생산 (NEW)
- **파일:** `packages/shared/src/finance/prime-cost.ts:34`, 상수 `:44`(`LABOR_EMPLOYER_BURDEN_MULTIPLIER = 1.185`)
- **무엇이 틀렸나:** 주석이 "국민연금 4.75% · 건강 3.595% · 장기요양 0.4724% · **고용보험 0.9%** · 산재 0.7% ─ 합 ≈ **10.4%**"로 **고용안정·직업능력개발 0.25%를 누락**. 이는 SSOT `constants/benchmarks.ts:9-15`가 "종전 10.42는 0.25% 누락(**거짓값**), 0.25% 포함이 법적 정답"이라며 명시적으로 정정한 바로 그 값(SSOT 합계 = 10.6674%). 승수 1.185도 이 stale 산식에서 유도돼 SSOT 밖에 재정의됨(승수는 근사 목적이라 값 자체는 허용 범위이나, **정정된 거짓값이 주석으로 부활**해 다음 작업자를 오도).
- **수정 제안:** 주석 산식을 `LEGAL.EMPLOYER_INSURANCE_RATE` 참조로 바꾸고 승수를 SSOT에서 유도.

### 🟡 P2 — [C] iOS 사업주 4대보험 요율 SSOT 밖 중복 — **STILL PRESENT (carry-over, 값은 일치)**
- **파일:** `apps/ios/Sources/FoundOneCore/TeamLaborCost.swift:45-47`, `.../Stages/BUHiringCalculator.swift:38`
- **무엇이 틀렸나:** 요율을 SSOT(`InsuranceSimulator.swift:25-31`) 밖에 리터럴 중복. 현재 값은 일치(오류 아님)하나 "매직넘버 재정의 금지" 위반 → 요율 변경 시 드리프트 리스크.
- **수정 제안:** iOS 요율 SSOT 단일화 후 두 파일이 참조.

---

## 부록 — 이상 없음 확인 근거 (침묵 아님)

- **D 가드 (실호출 20곳 전수):** 공용 분기점 모두 가드 존재 — 웹 `PreLaunchFinalStage.tsx:41`(`isOnline &&`), `TargetCustomerStage.tsx:161`·`BusinessModelSelectionStage.tsx:171`·`IndustrySelectionStage.tsx:242`·`StartupTypeSelectionStage.tsx:94`(`cluster==="online" &&`), shared `i18n.ts:920`(`categoryId==="online-digital" &&`), iOS `StageTaskRegistry.swift:38`(`subCategory=="online-digital" &&`)·`PreLaunchFinalStageView.swift:116`·`TargetCustomerStageView.swift:238`(`cluster==.online`). 가드 없는 6곳(`SourcingSetupStage:11`, `StoreSetupStage:11`, `OnlineMarketingStage:11` + iOS 3 미러)은 **online 전용 스테이지**라 안전 — `starter-data.ts:1330-1343`에서 startup-tech가 `startup-foundation`으로 분기해 **ai-application 미도달** 재확인.
- **다중-카테고리 set 추가 점검:** shared 전체에서 subtype set은 `DIGITAL_ONLINE_SUBTYPES` **1개뿐**(신규 set 없음). `offlineKind` 7버킷은 **카테고리 파생 맵**(subtype set 아님)이며 웹 4곳·iOS 3곳의 매핑을 전수 대조한 결과 **전부 일치**(space·education → space). 단, 동일 맵이 7곳에 복제돼 있어 SSOT 승격 후보(구조 부채, 현재 오류 없음).
- **위조 부활 0건:** 노쇼(`booking-store` 실데이터 + `isDemo` 배지·collect 필터), 단골비율(코호트 실계산만), 캠페인아이디어·costSparkline(repo 전무), funnel WoW(`isEmpty` 시 `wowDelta=null`), 채널ROI(`integrations-catalog.ts:175`는 연동 카탈로그 설명 문구일 뿐 카드 수치 아님) — 전부 정상.
- **런웨이 99 위조 수정 확인:** `CEOMorningHero.tsx:172` = `totalMonthlyBurn > 0 ? capitalKrw / totalMonthlyBurn : -1` → burn=0이면 `-1` → **"비용 입력 필요"** 로 정직 표시(커밋 `467352e5`). 잔존 `n >= 99 → "충분"` 분기(`:341,:379`)는 실제 cash/burn ≥ 99개월일 때만 도달하는 정당한 상한 표기.
- **예산 벤치마크 SSOT:** 표본 2종 `rental-studio`(avgWan 5000)·`party-room`(3500) 모두 `cluster-budget-benchmarks.ts:257-258`에 실존(출처·연도 표기). iOS 미러(`BudgetInsightCard.swift:215-511`)와 **59키·295수치 전수 일치**, specialty 우선·cluster 폴백 로직(`:515`) 정상.
- **신규 payroll 기능(7/15~16) 정직성 정상:** `StaffDetailModal.tsx:136`이 SSOT `checkSeveranceObligation` 재사용, `:352`가 "정확한 금액은 퇴직 전 3개월 평균임금 기준 — 노무사·고용노동부 계산기"로 **금액 단정 회피**, `:414`·`payroll-check/route.ts:129`가 근로기준법 §36 14일 기한을 정확히 인용. 위반 없음.
- **AI 코칭 업종 가드 정상:** `industry-daily/route.ts:191-201`에 `space` 포함 11 카테고리 KPI 가이드 존재 + `:229-230`에 표본 2종(`party-room`·`rental-studio`) specialty KPI 프로파일 실존("예약률·가동률" — 객단가 위조 방지).
