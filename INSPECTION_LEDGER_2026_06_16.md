# 정밀 점검 원장 (앱 전체 · 수동 심층 · 런타임 왕복 증명)

> 2026-06-16 시작. 방식 확정: **수동 심층(워크플로우 X) · 앱 전체 · 런타임 왕복 증명 포함.**
> 이 문서 = "빠짐없이 봤다"의 근거 + 턴 넘어 이어지는 상태. 화면별로 계약 C1~C9 전수 대조 → 발견은 적대적 자기검증(반증 시도) 통과분만 확정 → sync/계산 건은 런타임 증명.

---

## 계약 불변식 (Contract — 직감 아닌 이 목록으로 점검)

| ID | 불변식 | 합격 기준 |
|----|--------|-----------|
| **C1** 데이터 정직성 | 가짜/하드코딩 숫자 0 | 계산불가 → —/예시/추정 배지. 데이터모델 없으면 비표시·강등(재위조 금지) |
| **C2** SSOT 왕복 | 정식 컬럼 있는 입력은 양방향 동기 | Supabase에 써지고 웹↔iOS 왕복. 정식 컬럼 있는데 @AppStorage/localStorage-only 금지. **[런타임 증명]** |
| **C3** 패리티 | 웹↔iOS 1:1 | 같은 surface 카드 구성·내용·계산식 동일 |
| **C4** 계산 정확성 | 식·단위·시간대 정확 | 보험/BEP/런웨이/프라임코스트/세금 = SSOT, 원·만원 단위, UTC/KST 정확. **[런타임 증명]** |
| **C5** 디자인 토큰 | 라벤더+미드나잇, 신호등 0 | 팔레트외 raw hex 0, 토큰 경유 |
| **C6** 상태 처리 | empty/loading/error + 저장패턴 | 사장님 데이터: 읽기전용default→수정→저장(idle/saving/saved/error)+flush, 미저장 이탈 보호, 동시저장 race 차단 |
| **C7** 상황 맞춤 | 업종·매출단계·startupType별 맞게 | 비표시 아닌 맞게 표시 |
| **C8** 보안 | secret 0 노출 | service_role 클라 부재, 업로드 검증·private 버킷, 입력 검증 |
| **C9** 정합성/생명주기 | 안전·연결 | null 안전, dead code, 로그아웃/삭제/리셋, realtime 메시, echo 방지 |

## 런타임 왕복 증명 — 방법과 한계 (정직)
- **렌더 증명**: `SIMCTL_CHILD_BU_DEMO_*`(iOS) / 웹 `__fo_preview` 우회 → 화면 실렌더 (Phase 1에서 확립).
- **로직 증명(결정론)**: 투영/계산 로직은 **단위 테스트**로 입력→출력 검증(예: R1 ×10000, D1 11.57%). 네트워크 없이 정확성 증명.
- **진짜 네트워크 왕복(한 기기 입력→Supabase→다른 기기 읽기)**: 양쪽 **인증 세션 필요** → 비밀번호 입력 불가로 내가 직접 못 함. **테스트 계정 제공 or 사용자가 양 기기 로그인** 시 구동. 그 전까지는 로직+렌더 증명으로 대체하고 이 한계를 각 건에 명시.

## 화면별 방법론 (매 surface 반복)
1. 해당 surface **전 파일 정독**(스킴 금지) — 파일 목록을 원장에 기록(커버리지 증거)
2. C1~C9 전수 대조 — 각 계약별 PASS/발견
3. 발견마다 **적대적 자기검증**: "의도된 설계? 가드가 처리? 다른 경로로 커버?" 반증 못 하면 확정
4. C2·C4 건 → 런타임 증명(로직 테스트 or 렌더), 네트워크 한계 명시
5. PASS도 근거 1줄 명시(안 본 게 아니라 봤고 통과)
6. 완전성 비평: 이 surface에서 **안 본 모달·미검증 주장·런타임 미증명** 잔여 기록

---

## Surface 인벤토리 & 상태

> 상태: ⬜ 미점검 / 🔶 1차(대략) 완료·정밀 재점검 필요 / ✅ 정밀 완료

| # | Surface | 웹 파일 | iOS 파일 | 상태 |
|---|---------|---------|----------|------|
| 1 | **home / Today** | HomeView.tsx + dashboard/sections/* | Today/(TodayView·PreLaunchHomeView) | ✅ 정밀완료 (P0×1 발견·수정 + P2×2 수정 + P3×2 노트, 전 계약 PASS) |
| 2 | **current / 로드맵 단계** | CurrentStageView + stages/(68) | Roadmap/Stages/(54) | 🔶 1차+R1·R2·R3 수정 |
| 3 | **roadmap / 로드맵 개요** | RoadmapSurface(187)·AiRoadmapSummary(499) | RoadmapView(575) | ✅ 정밀 (PASS — percent 가드·상태기반 잠금·신호등0·가짜0) |
| 4 | **analytics / 운영 대시보드** | AnalyticsSurface + OperationalDashboard + sections/ | Operations/(4) + DailyHub | ✅ 정밀(C2 입력배선 전수검증 클린 + D1·D2·D3 수정 + 1차 PASS) |
| 5 | **guides / 펀딩** | GuidesView(1708)·FundingScoreModal | Guides/(3·1547) | ✅ 정밀 (앰버 신호등 수정, 펀딩점수 AI표시 정직, C1/C2/C8 PASS) |
| 6 | **franchise** | FranchiseView(325)·DetailModal(532) | Franchise/(930) | ✅ 정밀 (PASS — C1 출처/추정 모범, C2 N/A, C5 신호등0) |
| 7 | **marketing** | MarketingSurface(828)+marketing-store | Marketing/(3·1200) | ✅ 정밀 (고위험 0 — C1/C2/C4/C8 PASS, C5 블루는 시스템 백로그) |
| 8 | **reports** | ReportsSurface·ReportView·useReportSnapshot | WeeklyPulse/ReportsView + Core/ReportsCalculator | ✅ 정밀 (P1 prime버그 수정 + P2/P3 패리티 노트, C5/C1/C9 PASS) |
| 9 | **profile / 내 정보** | ProfileView + profile/* | Profile/ProfileView | 🔶 1차 |
| 10 | **my-store / 내 가게** | MyStoreView + my-store/* | MyStore/ + StoreInfoEditSheet | 🔶 1차 |
| 11 | **onboarding** | ExistingBusinessOnboarding·AIRoadmapWizard·OnboardingChoice | Onboarding/(3·1640) | ✅ 정밀 (C2 루트데이터 영속 철저 검증 + dead code 1) |
| 12 | **weekly-pulse / growth** | Tier2/Tier4·GrowthEngine·WeeklyReport | WeeklyPulse/(8)·Growth/(976) | ✅ 정밀 (고위험 0 — C1/C2/C4/C5 전부 PASS) |
| 13 | **operations 시트** | (CustomerManagement 등 web?) | Operations/(Customer·Inventory·Team 시트) | 🔶 (일부) |
| 14 | **auth / legal / billing** | auth·legal·pricing·billing | Auth/ | ⬜ (Phase 6·7서 보안·법무는 봄) |

## 확정 발견 (정밀 — 적대적 검증 통과분만 누적)
| ID | Surface | 계약 | 등급 | 근거(file:line) | 런타임증명 | 상태 |
|----|---------|------|------|-----------------|-----------|------|
| D1 | analytics | C4 | P1 | StaffLaborCard 0.1041 → SSOT 10.6674% | ✅ `employer-insurance-rate.test.ts` 3/3 (회귀 잠금) | 수정+증명 완료 |
| D1-meta | — | — | — | 내 1차 보고가 11.57%로 오기 → 런타임 증명이 잡아냄(실값 10.67%). **이게 정밀 점검의 가치** | ✅ | 정정 완료 |
| **H1** | **home/Today** | **C2·C6·C3** | **P0** | **iOS `QuickInputSheet`(TodayView.swift:1255~)가 store 미참조 → "오늘 매출 기록" 입력이 dismiss 시 버려지는 no-op. `upsertEntry`(저장 API)의 유일 호출처는 위젯뿐. 웹은 handleAddDailyEntry로 Supabase 저장** | 빌드✓·코드검증✓ / end-to-end는 시뮬탭 환경제약+인증부재로 미증명(한계 명시) | **수정 완료** (dashboardStore 주입+upsertEntry+KST날짜+고객수보존) |
| H-C1 | home/Today | C1 | PASS | mockData(AppRoot:855)는 실 store 데이터 — 데모만 가짜(빨간배너+auth게이트). runway/weeklyChange 가드 정확 | 코드✓ | 단 타입명 `MockData`는 혼동위험(P3 네이밍) |
| H-C4 | home/Today | C4 | PASS(표본) | weeklyChange·runway·salesTrend·weakestDayPct·AI-context primeRate 전부 분모>0·count·옵셔널 가드 (TodayView:331~371). weakestDay UTC는 날짜요일이라 TZ무관(정상) | 코드✓ | NSM·ratios·projected14·startupHealth·dailyKpiCells 세부계산은 미독(완전성 참조) |
| H-C5 | home/Today | C5 | PASS | TodayView/PreLaunchHome/Coaching + 홈렌더 DailyHub카드 전부 raw-hex 0 | grep✓ | |
| H2 | home/Today | C5 | P2 | 웹 HomeView "전단계 완료" 축하카드 신호등 그린 rgba(52,199,89) (체크원은 네이비) | 코드✓ | **수정**(네이비 success) — iOS completionBanner와 패리티 일치 |
| H3 | home/Today | C1 | P2 | iOS `totalCustomers = max(1,…)` 0명일때 1 위조+객단가 부풀림 (TodayView:420) | 코드✓ | **수정**(floor 제거, avgTicket 가드 안전) |
| H4 | home/Today | C3·C1 | P3 | iOS dailyKpi 런웨이 흑자시 "99개월"(대시보드 흑자 sentinel과 불일치) | 코드✓ | open(경미) |
| H5 | home/Today | C9 | P3 | 프로덕션 데이터 타입명이 `MockData`(혼동위험, 데모와 동일 타입) | 코드✓ | open(네이밍) |
| H-C3 | home/Today | C3 | PASS | PreLaunchHome 텍스트·구조 웹 HomeView 1:1. founderSnapshot 키(startupWon/openDateId/startupType) 전부 stage 실기록과 일치(적대검증) | 코드✓ | budget-setup이 startupWon+capital 둘다 기록 확인 |
| H-C7 | home/Today | C7 | PASS | 업종분기(customer↔inventory·startupTech·food safety) 정상 | 코드✓ | |
| H-C8 | home/Today | C8 | PASS | 홈에 secret 0, QuickInput 이제 store 저장, 프로그램 링크 noopener | 코드✓ | |
| A-C2 | analytics | C2 | PASS | **입력배선 전수검증**(홈 P0 패턴 재발 여부): iOS Customer/Inventory/Team 시트 전부 `storeInfoStore.commit`→debounce→Supabase(CustomerSheet save()→onSave:127→commit 확인), Cashflow/RevenueBasis `store.save`. 웹 handleEmp/Inv/Save 전부 `flushImmediate()`(즉시 Supabase). **홈 QuickInput 같은 no-op 없음** | 코드✓ | 우선순위로 검증, 클린 |
| A1 | analytics | C4·C9 | P3 | iOS CustomerManagementSheet `isoToday()`가 ISO8601 UTC → 멤버 startDate 자정 근처 KST off-by-one (TodayView/위젯은 Asia/Seoul 쓰는데 여기만 UTC) | 코드✓ | open(경미) |
| RP1 | reports | C4·C3·C1 | **P1** | iOS `ReportsCalculator.primeRate = (재료+인건비)/**총비용**` — SSOT는 /매출(web cost-ratios.ts:230·health-score.ts:260·dashboard.ts:80, iOS CostRatios 동일). 자기 marginPct(매출기준)·웹과도 불일치 → 65% 위험선·이상신호 오작동 | 빌드✓+**SSOT 3중 교차참조**(회귀테스트는 날짜의존이라 후속권고) | **수정**(웹 공식 `(prime×factor)/매출`) |
| RP2 | reports | C3 | P2 | 일일 비용 factor 웹 1/30 vs iOS 1/26(영업일) → 같은 일일 리포트 마진 불일치. 26 vs 30 정본 결정 필요(앱 전역 bepDailySales도 /26 사용) | 코드✓ | open(정본 결정) |
| RP3 | reports | C3 | P3 | 분기 factor 웹 days/30(실일수) vs iOS 3.0(고정) | 코드✓ | open(경미) |
| R-rep | reports | C1·C4·C5·C9 | PASS | 웹 useReportSnapshot margin/prime 가드·null정직, 셸 "입력기반" 정직, MIDNIGHT 단색 신호등0, KST chip. iOS ReportsView가 ReportsCalculator.compute 단일소스 | 코드✓ | |
| M-mkt | marketing | C1·C2·C4·C8 | PASS | KPI(지출/ROAS/채널) 0이면 힌트·가짜0(과거 채널ROI강등 유지). ROI/ROAS 가드·null. iOS MarketingRepository(Supabase)·웹 marketingCampaigns 페이로드(usePersistence:443)→오토세이브 동기. cases엔진 auth Bearer | 코드✓ | C2 입력배선 클린(홈P0 패턴 없음) |
| M1 | marketing | C5 | P3 | 애플블루 #007aff (SPEND값 :354·+캠페인버튼 :399·kpiCard border :349) — profile과 동일 시스템 블루 | 코드✓ | **테마A 블루 일괄 스윕 백로그**(piecemeal 회피) |
| G1 | guides | C5 | P2 | 펀딩 medium 레벨 배경 + GuidesView 마감배지 배경이 앰버 rgba(180,83,9)(텍스트는 네이비) | 코드✓ | **수정**(active surface — 네이비 배경) |
| G-guide | guides | C1·C2·C4·C8 | PASS | 펀딩점수 AI(/api/ai/funding/score) 표시만·pct클램프, FundingScoreModal aria-modal(BuildMethodDialog보다 나음), GuidesView 가짜숫자0·입력저장없음(표시surface), RED=#b64c4c·AMBER상수=#191970 정상 | 코드✓ | |
| W-wk | weekly/growth | C1·C2·C4·C5 | PASS | 주말/주중·projectedMonthly·avgDaily·trendPct division 전부 `guard !isEmpty`/`max(1,…)` 가드(NaN 0), kstCalendar 요일, 신호등0, "예시 가이드"·"웹에서 추가" 정직 빈상태, SubscriptionMgmt 읽기전용 v1(고아입력 아님) | 코드✓ | 3 division 의심 전부 가드확인(반증) |
| O-onb | onboarding | C2·C1·C5 | PASS | **루트데이터 영속 검증**: iOS 기존가게 onComplete(AppRoot:601-630) `persistStoreNameForCurrentUser`+`persistIndustry`(category·sub·startupType·launchedDate)+`upsertCosts`+storeInfo flush. 신규=IndustrySelectionStageView→StageInputProjector(R2). 웹 handleExistingBusinessComplete setDecisions+setSelectedIndustry+setStartupType+setStoreName+setMonthlyCosts 전필드. setProfile은 로컬이나 명시 persist 동반 | 코드✓ | 홈P0 패턴 없음 |
| O1 | onboarding | C9 | P3 | iOS `Onboarding/IndustrySelectionView.swift`(295) dead code — manual 경로가 IndustrySelectionStageView 직행으로 단순화(2026-05-20)되며 미사용(자기 #Preview만 호출) | 코드✓ | open(제거 권장) |
| W1 | weekly/growth | C3 | P3 | iOS SubscriptionManagementCard 읽기전용(편집은 웹) — 의도된 v1 패리티 한계(문서화됨) | 코드✓ | open(v1 의도) |
| **C5-sys** | analytics·marketing·profile | C5 | P2 | **시스템 C5 백로그(일괄 스윕 권장)**: ① 앰버 배경 rgba(180,83,9) — InventoryOpsCard(72·73·106·185 alert)·CostCompositionDonutCard(588) ② 애플블루 #007aff — profile·marketing. alert는 구분유지 위해 브릭(#b64c4c)으로, 블루는 미드나잇으로. piecemeal 대신 한 배치로 | 코드✓ | open(시스템 스윕) |
| (1차 발견 R1·R2·D1·D2·D3은 CODE_INSPECTION_4SURFACES 참조 — D1은 employer-insurance-rate.test.ts로 런타임 잠금) | | | | | | |

## 완전성 비평 (안 본 것 / 미증명)
- **home/Today ✅정밀완료**: 전 계약 C1~C9 대조 완료. 웹 HomeView·iOS PreLaunchHome 전독, TodayView 계산 프로퍼티(ratios·startupHealth·dailyKpi·projected14·고객수) 전독, 홈렌더 카드 C5 일괄. 발견 H1(P0 수정)·H2·H3(P2 수정)·H4·H5(P3 노트). **잔여 미증명**: ① H1 end-to-end 네트워크 왕복(시뮬탭/인증 막힘 — 테스트계정 필요) ② HeroOuterCard/Row1_5RiskSignals/Row2NSM/MoreInsightsStrip 내부는 표시전용이라 C5 grep+계산프로퍼티로 커버(라인별 미독 — 위험 낮음).
- **공통 미증명**: 진짜 네트워크 왕복(웹↔iOS Supabase)은 양쪽 인증 세션 필요 → 테스트 계정/로그인 전까지 로직+빌드 증명으로 대체.
- **2026-06-16 앱 전체 14 surface 정밀 점검 완료.** 전 surface ✅. 게이트: iOS BUILD SUCCEEDED·web tsc 0·vitest 265/265.
- **남은 백로그(비차단)**: ① 시스템 C5 스윕(애플블루 #007aff·앰버 rgba(180,83,9)) ② S1/S2(MyStore iOS 스키마 Phase-B) ③ RP2 일일factor 26 vs 30 정본결정 ④ dead code 제거(onboarding IndustrySelectionView 등) ⑤ 네트워크 왕복 증명(테스트계정 필요) ⑥ ReportsCalculator prime 회귀 XCTest(날짜의존).
