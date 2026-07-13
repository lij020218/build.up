# Found.One 데일리 정합성 감사 — 2026-07-13

> ⚠️ 이 파일은 오늘 **두 번째 실행**(스케줄 중복 기동)의 통합본이다. 오늘 01:54의 1차 리포트를 덮어쓰되, 1차 발견을 독립 재검증해 보존하고 + 2차에서 새로 찾은 항목(digital-products PlatformSetup 누출, HiringCostCalculator 임금 보험료율 stale)을 추가했다. **코드 수정 없음 — 리포트 전용.**

## 4줄 요약
- **A (업종 정합/하드코딩 누출):** 🔴 **P1 2건 + P2 2건** — ① iOS `PreLaunchFinalStageView` whyPage/dayPage/prPage가 cluster 무시하고 **오프라인 외식 문구 하드코딩**(스타트업·온라인 셀러에게 "음식점 폐업/식자재 발주/네이버 플레이스" 노출, 웹은 4페이지 전부 분기 → 웹↔iOS 드리프트). ② **digital-products(무배송)** 가 `PlatformSetupStage`에서 "쿠팡 로켓그로스 풀필먼트·G마켓 묶음배송·배송/CS" 물리배송 문구를 **가드 없이** 받음(웹·iOS 동시). 표본 pet-cafe·pet-training-school은 CLEAN.
- **B (대시보드 카드 등록/렌더):** 🟡 **P2 4건**(전부 문서 드리프트/저위험) — MenuProfitability는 렌더되나 MAP에 없음 / IntegrationHub·StartupFounderBrief는 삭제·흡수됐는데 MAP에 active로 잔존 / ecommerce-store는 collect·hydrate되나 **UI 리더 0건(고아 라운드트립)**. 조건부 카드 게이팅·booking store 연결·데모 격리 모두 정상. `typecheck` exit 0, `vitest` 58파일/436테스트 통과.
- **C (숫자 위조):** 🔴 **P1 1건 + P2 1건** — 🔴 웹 `HiringCostCalculator.tsx:154-156` 이 4대보험 **근로자 부담 요율을 stale 2025 리터럴(국민연금 4.5%·건강 3.545%·장기요양 12.81%)로 하드코딩** → 같은 표 사업주 컬럼(SSOT 2026값)과 불일치 + 2026 법정요율(4.75/3.595/13.14%) 위반. 🟡 iOS `TeamLaborCost.swift`·`BUHiringCalculator.swift` 는 사업주 요율을 SSOT 밖에 중복(값은 현재 일치). 노쇼·단골비율·캠페인·funnel WoW·채널ROI·costSparkline **부활 0건**.
- **D (Cross-category subtype 오염):** ✅ 이상 없음 — `isDigitalFulfillment`/`isDigitalOnlineSubtype` 호출부 **웹 10·iOS 10·shared 1 = 21곳 전수** 가드 확인. 전 클러스터 공용 분기점(pre-launch-final, `localizeTaskTitle`, `StageTaskRegistry`)에 카테고리/클러스터 가드 존재. **vitest 런타임 실행으로 검증**: `localizeTaskTitle("launch-date-locked","ko","startup-tech","ai-application")` → 스타트업 라벨("PT/베타"), digital-products → "자동 전달", smart-store → "재고 동기화" (3/3 통과).

---

## 커버리지 (침묵=전수확인 착시 방지)
- **표본 업종 (day=13, 인덱스 39·40·41 / 전체 70):**
  - 39 = `pet-cafe` (pet, 오프라인) — **CLEAN**
  - 40 = `pet-training-school` (pet, 오프라인) — **CLEAN**
  - 41 = `laundry-service` (living-service) → **규칙에 따라 `digital-products`(online-digital 무배송)로 교체** (표본에 온라인/디지털 부재 → 누출 다발 지역 편입). ※ startup-tech 계열(`ai-application`)은 D 섹션 검증 스니펫으로 별도 실행.
- **실행 명령 (증거):**
  - `pnpm -C apps/web typecheck` → **exit 0** (tsc 오류 0)
  - `pnpm exec vitest run` → **58 files / 436 tests passed, 0 failed** (1.97s)
  - D 검증: `pnpm exec vitest run` 임시 스펙으로 `localizeTaskTitle` 3케이스 런타임 실행 → 3/3 통과 (실행 후 스펙 삭제)
- **검사 파일 (읽은 라인 근거):** 웹 `PreLaunchFinalStage.tsx`(44-83 offlineKind·전 페이지 isStartup/isOnline 분기 확인), iOS `PreLaunchFinalStageView.swift`(123-540 offlineKind·preChecks·dayChecks·whyPage/dayPage/prPage), `PlatformSetupStage(.tsx/View.swift)`, `OnlineRegistrationStage(.tsx/View.swift)`, `SourcingSetupStage`·`StoreSetupStage`·`OnlineMarketingStage`·`TargetCustomerStage`(웹·iOS), `DigitalFulfillmentNotice(.tsx/View.swift)`, `i18n.ts`(860-930 taskTitleCopy·localizeTaskTitle), `digital-subtypes.ts`, `starter-data.ts`(세부업종 70종 추출·pet-cafe 509·라우팅 1320-1342), `stage-key-actions.ts`(537-560,705-720), `path-filter.ts`, 대시보드 `sections/`(8 tier + `DASHBOARD_MAP.md`), `industry-card-matrix.ts`, `usePersistence.ts`(376-628), `booking-store.ts`·`ecommerce-store.ts`, `hiring-cost.ts`(5-185)·`HiringCostCalculator.tsx`(140-165)·`InsuranceSimulator.swift`·`TeamLaborCost.swift`(45-49)·`BUHiringCalculator.swift`(7-38).
- **D grep 호출부 수:** `isDigitalFulfillment(` / `isDigitalOnlineSubtype(` = **21개 호출부** 개별 가드 확인.
- **미확인:** 각 결함의 신규/기존 여부는 `git blame` 미실행 → **미확인**(SSOT 불변식·가드 누락은 신규/기존 불문 유효).

---

## 결함 상세

### 🔴 P1 — [A] iOS PreLaunchFinal 3개 페이지가 cluster 무시하고 외식 문구 하드코딩 (웹↔iOS 드리프트)
- **파일:** `apps/ios/Sources/FoundOneFeatures/Roadmap/Stages/PreLaunchFinalStageView.swift:483-540`(whyPage), `:503,512-515,534-537`, dayPage/prPage(`:647-694`)
- **무엇이 틀렸나:** `switch page { case 0: whyPage … }`(:483)에 **cluster 가드 없음**. whyPage 히어로가 "음식점 폐업의 주요 원인…"(:503), D-3 "최종 식자재 발주"(:512), warningCard "식자재 냉장 온도 기록"(:537)을 리터럴로 박아, **startup·online-physical 클러스터에도 외식 문구**가 뜬다. 같은 파일에 cluster-aware `whyText`(:46)가 있으나 whyPage가 이를 무시. preChecks/dayChecks의 체크리스트는 `switch cluster`로 올바르게 분기되지만(:210,321), 페이지 본문(why/day/pr) hero·타임라인·warning은 미분기. 웹 `PreLaunchFinalStage.tsx`는 traps/checklist/roles/timeline/cases/schedule/header 전 배열이 `isStartup ? : isOnline ? :`로 4페이지 완전 분기(:63,124,250,458,589,748,1357…) → iOS만 결함.
- **수정 제안:** whyPage/dayPage/prPage의 hero·타임라인·warning을 `cluster`(또는 `whyText`처럼 cluster-aware computed)로 분기 — 웹의 3-way 분기를 1:1 미러.

### 🔴 P1 — [A] digital-products(무배송)가 PlatformSetup에서 물리배송 문구를 가드 없이 수신 (웹+iOS)
- **파일:** `apps/web/app/lib/components/stages/online/PlatformSetupStage.tsx:15,18,69,141` (import에 `isDigitalFulfillment` 없음) / iOS `PlatformSetupStageView.swift:94`
- **무엇이 틀렸나:** online-digital → `platform-setup` 라우팅(`starter-data.ts:1342`)으로 **digital-products가 이 스테이지에 먼저 도달**. 그러나 가드가 없어 "쿠팡 로켓그로스 풀필먼트"(:15), "G마켓 묶음배송"(:18), 상세 "로켓그로스 입점 별도 수수료"(:141)를 무배송 디지털 콘텐츠 판매자에게 노출 → 뒤이어 나오는 `DigitalFulfillmentNotice`("택배·포장이 없습니다")와 정면 모순. iOS도 동일 누출(패리티). ※ 참고로 SourcingSetup/StoreSetup/OnlineMarketing은 `isDigitalFulfillment` 가드로 정상 차단됨 — platform-setup만 누락.
- **수정 제안:** `PlatformSetupStage`를 `isDigitalFulfillment`로 게이팅해 무배송 서브타입엔 크몽·클래스101·스티비·서브스택 등 디지털 채널 카드를 노출(마켓플레이스·풀필먼트 카드 대신).

### 🔴 P1 — [C] HiringCostCalculator 근로자 4대보험 요율이 stale 리터럴(2025값) 하드코딩
- **파일:** `apps/web/app/lib/components/knowledge/HiringCostCalculator.tsx:154-156`
- **무엇이 틀렸나:** SSOT `packages/shared/src/finance/hiring-cost.ts:10-14`는 2026 요율(국민연금 4.75%=`0.0475`, 건강 3.595%=`0.03595`, 장기요양 13.14%=`0.1314`). 그런데 이 컴포넌트는 근로자 컬럼을 `monthlySalary * 0.045`(4.5%), `* 0.03545`(3.545%), `result.health * 0.1281`(12.81%)로 **직접 하드코딩** — 모두 **2025 옛 요율**. 같은 표의 사업주 컬럼(`result.pension` 등)은 SSOT 2026값을 쓰므로 **한 카드 안에서 사업주=4.75%·근로자=4.5% 로 불일치**하며, 근로자 표시치는 2026 법정요율 위반. `calculateHiringCost` 결과가 근로자 라인별 금액을 노출하지 않아(집계 `totalInsuranceEmployee`만) 작성자가 요율을 재유도하다 옛 값을 굳힌 것. (라이브 경로: `HiringInteractivePanels.tsx`에서 사용.)
- **수정 제안:** `INSURANCE_RATES_2026`를 import해 `ee = totalGross × rates.*.employee`로 계산(또는 `hiring-cost.ts`에서 라인별 근로자 금액 export 후 소비) — 리터럴 3개를 SSOT 참조로 교체.

### 🟡 P2 — [A] OnlineRegistrationStage가 digital-products에도 "스마트스토어·쿠팡" 스토어프론트 문구 고정
- **파일:** `apps/web/app/lib/components/stages/online/OnlineRegistrationStage.tsx:44,54`
- **무엇이 틀렸나:** 본문/헬퍼 문구가 마켓플레이스 스토어프론트("스마트스토어·쿠팡… 플랫폼 노출")를 전제 — 실제 채널이 크몽·클래스101인 digital-products에도 동일 노출. 업종코드 자체는 정상(서적출판 221100+525101)이라 생존 가능하나 카피 부정합. (통신판매업 신고 자체는 디지털도 의무라 페이지 존재는 정당.)
- **수정 제안:** 본문 카피를 `isDigitalFulfillment` 분기 또는 "판매 채널"로 일반화.

### 🟡 P2 — [A] PlatformSetup 웹↔iOS 수수료 문자열·카드셋 드리프트
- **파일:** 웹 `PlatformSetupStage.tsx:14` vs iOS `PlatformSetupStageView.swift:35,40`
- **무엇이 틀렸나:** 스마트스토어 수수료 문구가 한쪽만 편집됨 — 웹 "결제 1.98~3.63% + 판매수수료 2.73% (2025 개편·유입수수료 폐지)" vs iOS "네이버페이 결제 1.98~3.63% (등급별, 2025.10 인하) + 판매수수료 2.73%". 카드 구성도 상이(웹 11번가/G마켓 개별 카드 vs iOS "멀티채널" 카드).
- **수정 제안:** 플랫폼 목록·수수료 문자열을 shared SSOT로 승격해 1:1 미러.

### 🟡 P2 — [B] MenuProfitabilityCard 렌더되나 DASHBOARD_MAP에 부재
- **파일:** `apps/web/app/lib/components/dashboard/sections/Tier1_5Coaching.tsx:180-184` vs `sections/DASHBOARD_MAP.md`(Tier 1.5 표 60-83, menu-profitability 행 없음)
- **수정 제안:** MAP Tier 1.5 표에 `menu-profitability` 행 추가.

### 🟡 P2 — [B] IntegrationHub가 MAP에 active로 잔존하나 컴포넌트 삭제됨
- **파일:** `DASHBOARD_MAP.md:62` (active "1.5(top)") vs `Tier1_5Coaching.tsx:44,125-131`(profile/로 이전·삭제, import/render 없음)
- **수정 제안:** MAP 62행 active 항목 삭제/취소선.

### 🟡 P2 — [B] StartupFounderBrief가 MAP에 active로 잔존하나 CEOMorningHero로 흡수됨
- **파일:** `DASHBOARD_MAP.md:71` vs `Tier1_5Coaching.tsx:357-360`(흡수·별도 카드 제거 주석)
- **수정 제안:** MAP 71행 취소선(82행 OfflineFounderBrief처럼).

### 🟡 P2 — [B] ecommerce-store 고아 라운드트립 (collect/hydrate되나 UI 리더 0건)
- **파일:** `apps/web/app/lib/stores/ecommerce-store.ts`(persistence만 연결) / MAP 78행 "ecommerce-store … 채널별 ROAS·CVR·반품" 주장 stale. 실제 렌더 카드 `ConversionFunnelCard`(mode="commerce")는 Supabase `v_saas_funnel_unified`를 읽고 store의 `adSpends`/`returns`는 미사용.
- **무엇이 틀렸나:** jsonb에 수집되는 채널 ROAS/반품 데이터가 어디에도 표시되지 않음(무해하나 죽은 왕복). 위조는 아님.
- **수정 제안:** 커머스 카드에서 `adSpends`/`returns`를 노출하거나, ecommerce-store persistence 배선+MAP 주장 제거.

### 🟡 P2 — [C] iOS 사업주 4대보험 요율 SSOT 밖 중복 정의 (값은 현재 일치)
- **파일:** `apps/ios/Sources/FoundOneCore/TeamLaborCost.swift:45-49`, `apps/ios/Sources/FoundOneFeatures/Roadmap/Stages/BUHiringCalculator.swift:38`
- **무엇이 틀렸나:** 사업주 요율(0.0475/0.03595/0.1314/0.009+0.0025/0.007)을 SSOT(`InsuranceSimulator.swift`) 밖에 리터럴로 중복. 현재 값은 SSOT와 일치(오류 아님)하나 "매직넘버 재정의 금지" 위반 → 요율 변경 시 드리프트 리스크.
- **수정 제안:** iOS 요율 SSOT(`InsuranceSimulator`/공유 상수) 단일화 후 두 파일이 참조.

---

## 부록 — 이상 없음 확인 근거
- **D 가드 (21 호출부):** 공용 분기점 모두 가드 존재 — 웹 `PreLaunchFinalStage.tsx:41`(`isOnline &&`), `BusinessModelSelectionStage.tsx:171`·`IndustrySelectionStage.tsx:242`·`TargetCustomerStage.tsx:161`·`StartupTypeSelectionStage.tsx:94`(`cluster==="online" &&`), shared `i18n.ts:920`(`categoryId==="online-digital" &&`), iOS `StageTaskRegistry.swift:38`·`PreLaunchFinalStageView.swift:116`·`TargetCustomerStageView.swift:238` 등(`cluster==.online` / `subCategory=="online-digital"`). online 전용 스테이지(Sourcing/Store/OnlineMarketing)는 ai-application 미도달로 가드 불요.
- **위조 부활 0건:** 노쇼(BeautyBookingNoshow=실데이터+`isDemo` 배지, collect에서 `!isDemo` 필터), 단골비율(코호트 실계산만), 캠페인아이디어·채널ROI·costSparkline(repo 전무), funnel WoW(`isEmpty` 시 `wowDelta=null`) — 전부 정상.
- **표본 오프라인 2종:** pet-cafe·pet-training-school 모두 `categoryId==="pet"` → offlineKind "pet" 정확 매핑(웹 `PreLaunchFinalStage.tsx:48` / iOS `:128`), 미용·외식 오배정 없음. pet-training-school 키액션(`stage-key-actions.ts:549`)은 "미용실 신고가 아니라 동물위탁관리업 등록"으로 오히려 누출 방지.
