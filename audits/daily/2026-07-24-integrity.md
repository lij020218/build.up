# 데일리 정합성 감사 — 2026-07-24

> 코드 수정·커밋 없음(리포트 전용). 미검증 항목은 "미확인"으로 명시.

## 4줄 요약
- **A (업종 정합/하드코딩 누출)**: KEY ACTION·컴포넌트 본문 레이어는 3개 표본 전부 정상. 단 **stage-copy(`localizeStage.goal`) 레이어**가 서브타입 미분기 → digital-products 최종단계 부제에 "소싱·배송" 물리 문구 노출(P2). 그 외 dead-code 잠복 트랩 2건.
- **B (대시보드 카드 등록/렌더)**: **menu-profitability가 beauty/fitness/education/living-service에 게이팅 참인데 렌더 호스트 없음(P1)**. ecommerce-store는 read/write 소비처 0 → 死코드+MAP 허위기재(P2). DASHBOARD_MAP 4카드 drift(P2). typecheck·vitest(491) 통과.
- **C (숫자 위조)**: 과거 강등 카드(예약·노쇼, 단골비율, costSparkline, 채널ROI, CEO런웨이99) **재위조 없음** — 전부 정직한 빈상태/삭제 확인. 단 HiringCostCalculator 근로자부담 4대보험 요율이 SSOT 밖 하드코딩+2025 구요율(P2).
- **D (subtype-set 오염/가드 누락)**: `isDigitalFulfillment`/`isDigitalOnlineSubtype` 호출부 웹·iOS·shared 전부 검사 → **오분기 없음**. `localizeTaskTitle` 검증 스니펫 실행값 정답(ai-application→스타트업 라벨, digital-products→디지털, smart-store→실물).

---

## 커버리지 (침묵≠전수확인 방지)

- **표본 시드**: day-of-month=24 → 인덱스 (72,73,74) % 70 = **(2,3,4)** → `salad-healthy`, `ramen-noodle`, `chicken-burger`(전부 food). 규칙에 따라 디지털 계열 부재 → `chicken-burger` → **`digital-products`**(online-digital, 무배송 디지털) 교체. D절은 추가로 `ai-application`(startup-tech) 명시 검증.
- **전체 세부업종 수**: 70 (starter-data.ts `starterIndustryOptions`).
- **실행 명령**: `pnpm -C apps/web typecheck` → **exit 0**. 루트 `vitest run` → **65 files / 491 tests 전부 통과**. D 검증 스니펫 → vitest로 `localizeTaskTitle` 4케이스 실측(아래 D절).
- **D grep 호출부 수**: `isDigitalFulfillment(`/`isDigitalOnlineSubtype(` 호출부 = 웹 8 + shared(localizeTaskTitle) 1 + iOS 8 + iOS StageTaskRegistry 1 ≈ **18곳** 전수 확인. 가드 판정: 명시적 cluster/category 가드 or `ONLINE_ONLY` 스테이지(startup 미도달) 둘 중 하나로 전부 안전.
- **읽은 핵심 파일**: `digital-subtypes.ts`, `i18n.ts`(localizeTaskTitle·getStageCopyForCategory), `path-filter.ts`, 웹 selection/online/shared/shared-tail 스테이지 12종, iOS 동명 StageView 9종, `industry-card-matrix.ts`, `usePersistence.ts`, `ConversionFunnelCard.tsx`, `InventoryOpsCard.tsx`, `MenuProfitabilityModal.tsx`, `ecommerce-store.ts`, `HiringCostCalculator.tsx`, `hiring-cost.ts`, `prime-cost.ts`, `CEOMorningHero.tsx`, iOS `GrowthCards.swift`·`ReportsCalculator.swift`, `DASHBOARD_MAP.md` + 10 section 파일.
- **표본별 트레이스**: 3개 표본 각각 selection → pre-launch-final → specialty registry 를 웹·iOS 양쪽 추적(A). 검증 소스: 병렬 Explore 에이전트 2종 + 자체 grep/실행.

---

## 발견 (심각도순)

### P1

**[B-1] `menu-profitability` 카드 — 4개 업종에 게이팅 참이나 렌더 호스트 부재**
- `apps/web/app/lib/industry-card-matrix.ts:356` — `menu-profitability.industries = [food, cafe-dessert, beauty, fitness, education, pet, living-service, space]`
- `apps/web/app/lib/industry-card-matrix.ts:342` — `inventory-ops.industries = [food, cafe-dessert, retail, ecommerce, pet, space]`
- **무엇이 틀렸나**: `MenuProfitabilityModal`의 유일한 진입점은 `InventoryOpsCard.tsx:1252`이고, `InventoryOpsCard`는 `showByMatrix("inventory-ops")`가 참일 때만 렌더(`TodayManagementSection.tsx:37`). 두 집합의 차집합 **{beauty, fitness, education, living-service}** 에서는 menu-profitability 게이팅이 참인데(“시술·패키지 / 수업·PT / 수업·과정 / 출장·정기 서비스 라인업 수익성” 주석대로) 메뉴·서비스 수익성 UI가 도달 불가. matrix가 광고하는 카드가 4개 서비스업에서 조용히 사라짐.
- **수정 1줄**: `TodayManagementSection`에 `showByMatrix("menu-profitability")` 독립 렌더 블록 추가(InventoryOpsCard 의존 제거), 또는 4개 업종을 `menu-profitability.industries`에서 제거.

### P2

**[A-1] pre-launch-final 스테이지 goal 이 서브타입 미분기 → digital-products에 물리 커머스 문구 노출**
- `packages/shared/src/i18n.ts:659` — online-digital 오버라이드 `pre_launch_final.goal = "초도 상품 소싱을 완료하고 주문·배송·CS 플로우를 점검한 뒤 오픈 알림을 게시합니다."`
- 렌더 경로: `apps/web/app/lib/components/surfaces/RoadmapSurface.tsx:137` 및 `HomeView.tsx:154` (`localizeStage(stage, language, industryCategoryId).goal`).
- **무엇이 틀렸나**: `localizeStage`/`getStageCopyForCategory`는 `categoryId`만 받고 `subIndustryId`를 받지 않아(`i18n.ts:670-678`) online-digital 안의 **무배송 디지털 서브타입(digital-products·creator-service·newsletter-membership)** 을 분기 못 함. 그 결과 전자책/템플릿 판매자도 로드맵 리스트·홈 다음단계 부제에서 "소싱·배송" 문구를 봄. (스테이지 **본문 KEY ACTION**은 `isDigitalFulfillment`로 정상 분기됨 — 잘못된 건 부제/요약 한 줄뿐이라 P2.) A-에이전트가 컴포넌트 본문만 추적해 놓친 별개 렌더 경로.
- **수정 1줄**: `localizeStage`/`getStageCopyForCategory`에 `subIndustryId` 인자 추가 → online-digital & `isDigitalOnlineSubtype`이면 무배송용 goal 변형 사용, 또는 online-digital `pre_launch_final.goal`을 소싱·배송 어휘 없는 중립 문구로 교체.

**[A-2] `LocationCandidatesStage` online-digital 분기 = dead code(잠복 트랩)**
- `apps/web/app/lib/components/stages/selection/LocationCandidatesStage.tsx:214-215`(`compareFavorable["online-digital"]`) + `offlineKind` "service" 폴백(`:88`).
- **무엇이 틀렸나**: `location-candidates`는 `path-filter.ts:34`의 `OFFLINE_ONLY`라 online-digital 미도달 → 현재는 죽은 코드지만, path-filter가 향후 online을 허용하면 상권/입지/권리금/건축물대장 페이지 전체가 digital-products에 누출. 라우터에만 의존하고 컴포넌트에 의도가 강제돼 있지 않음. (동일 성격: `i18n.ts:648,654`의 online-digital `location_candidates`·`contract_review` 오버라이드도 OFFLINE_ONLY라 dead copy.)
- **수정 1줄**: dead `online-digital` 분기 제거 또는 컴포넌트 상단에 `isDigital` early-return 가드 추가.

**[B-2] `useEcommerceStore` — read/write 소비처 0 (死코드 + MAP 허위기재)**
- `apps/web/app/lib/stores/ecommerce-store.ts`(정의) — `adSpends`(채널별 광고비/ROAS), `returns`(반품).
- **무엇이 틀렸나**: `industry_specifics.__ecommerce`로 collect/apply 배선은 있으나(`usePersistence.ts:404-410,633`) **어떤 카드도 이 store를 읽지 않고, 어떤 UI도 `addAdSpend`/`addReturn`로 쓰지 않음**(전수 grep: 소비처가 store/index·정의·usePersistence 뿐). 실제 ecommerce 카드 `ConversionFunnelCard`는 Supabase view(`useFunnelMetrics`→`v_saas_funnel_unified`)에서 데이터를 가져옴. `DASHBOARD_MAP.md:77`의 "ConversionFunnelCard … ecommerce-store(신규) + 채널별 ROAS·CVR·반품"은 **허위**. (입력 경로도 없어 데이터 유실은 아님 → 死코드 등급.)
- **수정 1줄**: `ecommerce-store`를 `ConversionFunnelCard` commerce 모드에 실제 연결하거나, 고아 store + collect/apply 배선 제거 후 `DASHBOARD_MAP.md:77` 정정.

**[B-3] DASHBOARD_MAP ↔ 렌더 drift (선언 vs 실렌더 불변식 깨짐)**
- MAP에 있으나 미렌더: `DailyKpiStrip`(`DASHBOARD_MAP.md:53`, 실 렌더 사이트 0 — `Tier1DailyHub.tsx:104` 제거), `PrimeCostCard`(`:66`, `Tier1_5Coaching.tsx:252` 제거), `DailyImprovementCard`·`AvgTicketUpsell`(`:67`, 제거). 3카드는 여전히 `industry-card-matrix.ts`에 잔존.
- 렌더되나 MAP 부재: `TodaySummarySection`·`TodayManagementSection`(`OperationalDashboard.tsx:137,149`, MAP 등재 0), `ConversionFunnelCard mode="saas"`(`Tier1_5Coaching.tsx:222`, MAP는 ecommerce 모드만 기재).
- **수정 1줄**: MAP에서 죽은 4행 삭제 + matrix에서 `daily-kpi-strip`/`prime-cost`/`daily-improvement`/`avg-ticket-upsell` 정리, `TodaySummarySection`·`TodayManagementSection`을 MAP 폴더트리/Tier1 표에 1급 행으로 추가.

**[C-1] `HiringCostCalculator` 근로자부담 4대보험 요율 = SSOT 밖 하드코딩 + 2025 구요율**
- `apps/web/app/lib/components/knowledge/HiringCostCalculator.tsx:154-156` — 근로자(ee) 컬럼을 인라인 재계산: `monthlySalary*0.045`(국민연금), `monthlySalary*0.03545`(건강), `result.health*0.1281`(장기요양).
- **무엇이 틀렸나**: SSOT `packages/shared/src/finance/hiring-cost.ts:11-13`의 **2026 요율은 0.0475 / 0.03595 / 0.1314**. 컴포넌트는 **2025 구요율(0.045/0.03545/0.1281)** 을 하드코딩해 근로자 공제액을 실제보다 낮게 표시 + 메모리 규칙(“요율은 hiring-cost.ts 한 곳”) 위반. SSOT는 이미 `totalInsuranceEmployee` 및 계산부(`hiring-cost.ts:98-102`)에서 근로자부담을 산출하므로 재계산 불필요. (고용보험 0.009는 SSOT 일치.)
- **수정 1줄**: ee 컬럼을 `INSURANCE_RATES_2026.*.employee`(또는 SSOT가 반환하는 per-item 근로자 값)로 교체, 인라인 리터럴 제거.

### P3

**[A-3] iOS OnlineMarketingStageView 광고 옵션 개수 웹과 불일치(파리티 부기)**
- `apps/ios/.../OnlineMarketingStageView.swift:45,51` — 디지털/비디지털 양 분기에 4번째 옵션 "광고 없이 시작" 존재. 웹 `OnlineMarketingStage.tsx:72-84`는 3개(외부 링크형).
- **무엇이 틀렸나**: 업종-정합 누출이나 공유 문자열 drift는 아님 — 플랫폼 UI 관례 차이. 파리티 장부 목적 기록.
- **수정 1줄**: 의도적이면 유지, 아니면 웹/ iOS 옵션 세트 통일.

---

## 이상 없음으로 확인한 항목(재위조/오분기 부재 증거)

- **C 재위조 없음**: `BeautyBookingNoshowCard`(useBookingStore 실데이터+빈상태 가드), iOS `LoyaltyDonutBlock`(가짜 38/24/38 → 정직 안내문), iOS `buildCostSparkline`(`ReportsCalculator.swift:357` → `[]` 반환, 가짜 추세 금지 주석), iOS `CampaignIdeasBlock`("예시 가이드" 라벨), iOS `MarketingChannelROIBlock`(삭제 확인 `GrowthCards.swift:787`), 웹 CEO런웨이(`CEOMorningHero.tsx:172` → burn=0 시 `-1`, "비용 입력 필요" 표시 — 종전 99 위조 수정됨).
- **C 매직넘버 SSOT**: 4대보험 요율 정본 = `hiring-cost.ts`(웹)/`InsuranceSimulator.swift`(iOS). `prime-cost.ts:44`의 `1.185`는 인건비 burden 근사 배수(별도 목적, 2026 요율과 정합, 재정의 아님) — 위반 아님.
- **D 오분기 없음**: 18개 호출부 전부 (a) 명시 cluster/category 가드 또는 (b) `ONLINE_ONLY` 스테이지(startup-tech 미도달). `localizeTaskTitle`·iOS `StageTaskRegistry`는 `categoryId=="online-digital" && isDigitalOnlineSubtype` 가드 보유.
- **D 검증 스니펫 실측값**(vitest 실행):
  - `launch-date-locked / startup-tech / ai-application` → "D-Day 화·수 12:01 PT 확정 … 베타 사용자" ✅ 스타트업 라벨
  - `launch-date-locked / online-digital / digital-products` → "… 자기 주문 → 자동 전달 시뮬 …" ✅ 디지털 라벨
  - `launch-date-locked / online-digital / smart-store` → "… 자기 주문 시뮬·재고 동기화 …" ✅ 실물 라벨
  - `production-deployed / startup-tech / ai-application` → "프로덕션 배포 + 도메인·SSL + Sentry/Slack …" ✅ 스타트업 라벨
- **A 3표본 정상**: digital-products = 무배송 분기(재고·사입·택배 없음, 크몽·클래스101, 업종코드 221100+525101) 전 스테이지 일관. salad-healthy·ramen-noodle = food/offline(콜드체인·즉석판매제조가공업 / 육수 온도·원산지표시판). 웹↔iOS 하드코딩 미러 문자열 drift 미발견(specialty registry는 codegen JSON, 최신).
