# 코드 점검 — 4대 화면 (로드맵 단계 · 운영 대시보드 · 내 정보 · 내 가게)

> 2026-06-16 · 웹·iOS 양쪽 읽기전용 코드 점검. 화면별 병렬 에이전트 + 핵심 주장 직접 검증.
> 등급: P0(출시차단) / P1(출시 전 권장) / P2(마감). **진짜 P0(앱 깨짐·출시차단) = 0.** My Store 패리티는 의도된 Phase-B 부분구현이라 P1(높음)로 조정.

---

## 0. 종합 — 횡단 테마 (여러 화면 반복)

| 테마 | 영향 화면 | 등급 | 요지 |
|---|---|---|---|
| **A. 신호등/팔레트외 색 (토큰 우회)** | 로드맵·대시보드·내정보 | P1~P2 | BUColor/PALETTE 토큰 대신 raw hex(#34C759·#059669·#007aff·#7c3aed). 토큰 레벨은 이미 네이비 리매핑됨 → 리터럴만 일괄 교체하면 해결 |
| **B. iOS 입력→정식컬럼 write-gap / SSOT 단절** | 로드맵·내가게 | P1 | iOS가 입력을 로컬/집계로만 남기고 정식 컬럼·웹 SSOT에 미도달. StageInputProjector projectedKeys 누락 + StoreInfoSchema Phase-B 부분구현 |
| **C. 보험요율·인건비 SSOT (웹)** | 대시보드 | P1 | 웹 Team 카드만 옛 10.41%·주휴+보험 누락 → iOS(정답 11.56%·monthlyBurden)와 ~20% 차이 |

---

## 1. 로드맵 단계

| # | 등급 | 차원 | 위치 | 내용 |
|---|---|---|---|---|
| R1 | P1 | 저장경로 | iOS `FinancialReviewStageView.swift:41-55,114-128` | 8개 비용필드(rent·labor·ingredients…) @AppStorage 로컬 + 집계 3개만 inputs 저장 → `cashflow_settings.fixedExpenses` 정식컬럼 미도달. 웹은 8필드 전부 영속. iOS 입력이 웹 대시보드에 안 뜨는 단절 |
| R2 | P1 | 저장경로 | iOS `IndustrySelectionStageView.swift:73-76` + `StageInputProjector.swift:39-42` | `categoryId`/`subIndustryId`가 projectedKeys에 없어 `business_profiles.industry_category_id` 미투영. 업종은 전 상황맞춤 분기의 뿌리값 — 파급 큼. projector 한 곳 수정으로 해결 |
| R3 | P1 | 토큰+패리티 | iOS `LocationCandidatesStageView.swift:668-672` | scoreColor가 순 신호등(#34C759·#007AFF·#FF9F0A)을 점수 pill·지도핀에 노출. 웹은 네이비톤(#1d3557/#191970) → 같은 점수가 두 플랫폼 다른 색 |
| R4 | P1 | 상황맞춤+정직 | iOS `FinancialReviewStageView.swift:297,137-143` | Prime Cost 목표 "55~65%" 하드코딩(옆 registry 값과 모순), verifyItems 음식점 기준 고정 → burn-basis 스타트업에 부적절 |
| R5 | P2 | 토큰 | 웹 `FranchiseApplicationStage.tsx:176`·`BudgetSetupStage.tsx:89` | sky-blue 그라디언트 rgba(117,163,255) — 팔레트 외 |
| R6 | P2 | dead code | 웹 `StageActionHero.tsx:879-945`(DotList)·`FirstMonthCheckStage.tsx` | 미사용 컴포넌트·deprecated stage |
| — | PASS | — | — | 디스패처 47 stage 1:1 매핑·EmptyView 폴백 0 / 웹 FinancialReview SOURCE_LABEL 정직 / XSS·null 안전 / realtime echo 안전 / 과거 P0 키계약 유지 |

## 2. 운영 대시보드

| # | 등급 | 차원 | 위치 | 내용 |
|---|---|---|---|---|
| D1 | P1 | SSOT+정직 | 웹 `analytics/StaffLaborCard.tsx:31,178` | `monthlyWage*0.1041` 하드코딩 — 옛 거짓값(고용안정 0.25% 누락). 정답 ~11.56%. 같은 웹 InsuranceSimulator는 SSOT 사용하는데 Team 카드만 매직넘버 |
| D2 | P1 | 정직+패리티 | 웹 `useDashboardComputed.tsx:263-266`→`TeamCard.tsx:113` | "예상 급여"=hourlyWage×weeklyHours×4.34 — 주휴수당·4대보험 누락. iOS는 monthlyBurden(임금+주휴+보험) → 웹이 ~20%+ 과소표시 |
| D3 | P2 | 토큰 | `Tier3Operations.tsx:600`·iOS `TodayView.swift:574-584`·`CustomerInterviewCard.tsx:812` | 신호등 녹색 rgba(101,197,101)·#059669·#34d399 리터럴 (토큰 우회) |
| — | PASS | — | — | 과거 강등카드 재위조 0 / RunwayGauge -1 흑자 sentinel 정상처리 / showByMatrix 11업종 분기 / empty·loading·error·CSV 검증 / realtime 메시 배선 / DASHBOARD_MAP 일치·카드 막추가 0 |

## 3. 내 정보

| # | 등급 | 차원 | 위치 | 내용 |
|---|---|---|---|---|
| P1 | P1 | 정직+패리티 | 웹 `CodefConnectCard.tsx:74-173`·`PopbillConnectCard.tsx:91-193` vs iOS `DataConnectionSheet.swift:360-383` | Codef·Popbill 게이팅 정반대: 웹은 blur+Lock 완전차단, iOS는 "사용 가능 채널"로 열어두고 PII 입력 *후* 503. 정책(유료모드 후 활성)은 동일하나 UX 1:1 아님 + iOS는 헛걸음 PII 입력 |
| P2 | P1 | 토큰 | 웹 `ProfileView.tsx:144,211,277,346`·`SubscriptionWebhookConnectCard.tsx`·iOS `ProfileView.swift:244,856,889` | 애플블루 #007aff·보라 #7c3aed·raw RGB 블루 — 토큰 우회 |
| P3 | P2 | 패리티 | iOS `ProfileView.swift:440-468,504-535` vs 웹 | 항목 불일치(iOS만 알림4토글·supportCard / 웹만 DashboardLayout·구독관리). 헤더 "1:1 미러" 주석 stale |
| P4 | P2 | 버그 | 웹 `PortOneConnectCard.tsx:473` | step2 버튼 stale closure — error 검증 실패해도 항상 step2 복귀 |
| — | PASS | **보안** | — | **secret 화면노출 0**(type=password+maskedSecret) / console secret 0 / 토큰 1회표시 / GA4 OAuth URL 정리 / **service_role 클라 부재** / 상황맞춤 분기 정상 |

## 4. 내 가게

| # | 등급 | 차원 | 위치 | 내용 |
|---|---|---|---|---|
| S1 | P1(높음) | 패리티 | iOS `StoreInfoSchema.swift:554-565` vs 웹 `store-info-schema.ts` | **검증됨**: iOS categorySections가 카테고리당 1개만(food→menuIngredients·startup-tech→ip…). 웹은 카테고리당 2~12섹션. 주석 "Phase B 구현" — 의도된 부분구현이나 SSOT 1:1 미달. 공통 섹션은 공유 |
| S2 | P1 | 패리티 | iOS `MyStoreView.swift:95-102` vs 웹 `MyStoreView.tsx:62-143` | footprintMode가 subIndustry modifier 무시(categoryId만, "Phase C" 주석) → 출장형(메이크업·청소·펫산책)이 차량 대신 임대차 섹션 |
| S3 | P1 | 상태처리 | 웹 `MyStoreView.tsx:339-413` | Array 섹션(보험·인허가·직원·메뉴)은 읽기전용 default+수정버튼 패턴 없음 — 펼치면 즉시 편집·저장. Object 모드만 패턴 적용 |
| S4 | P1 | 버그(UTC) | 웹 `MyStoreView.tsx:75-78`·`FinancialSnapshotSection.tsx:61-64` | daysOperating가 `new Date("YYYY-MM-DD")` UTC 파싱 → KST에서 D-day pill(로컬파싱)과 1일 어긋남. 런웨이 분모 영향. UTC 부채 잔재 |
| S5 | P1 | 상태처리 | 웹 `useStoreInfoSaver.tsx`+`SectionRenderer.tsx:88-103` | 미저장 이탈 경고(beforeunload) 없음 — 수정 후 debounce 전 이탈 시 유실 가능 |
| S6 | P2 | 정합성 | 웹 `MyStoreView.tsx:296` | businessModelLabel에 raw id 전달(라벨 미해석). category/subIndustry는 해석함 |
| — | PASS | **보안** | — | 업로드 타입·10MB·**private 버킷**+signed URL 1h·RLS 본인폴더 / secret 0 / 계산불가 "—" / Object모드 수정저장 4상태 / 동시저장 직렬화·circuit breaker |

---

## 우선순위 제안 (실행 시)
1. **테마 B (iOS write-gap)** R1·R2·S1·S2 — SSOT 단절이 사장님 입력 유실로 이어짐. 가장 가치 큼
2. **테마 C (보험요율)** D1·D2 — 숫자 정직성, 웹 한 곳씩 SSOT 교체로 해결
3. **테마 A (신호등 색)** R3·R5·D3·내정보P2 — 일괄 토큰 교체 스윕
4. 상태처리 S3·S5, UTC S4, 게이팅 내정보P1

발견: 진짜 P0 0 / P1 ~13 / P2 ~8 / 다수 PASS(보안·데이터정직성·디스패처·realtime).

---

## 수정 완료 (2026-06-16 세션) — 빌드·tsc·vitest 262/262 회귀 0

| 항목 | 파일 | 내용 |
|---|---|---|
| **R2** 업종 투영 | `StageInputProjector.swift` | projectedKeys에 categoryId·subIndustryId 추가 + project()가 `OnboardingProfileSync.persistIndustry`로 `business_profiles.industry_category_id/sub_industry_id` 투영 |
| **R1** 비용 투영 | `StageInputProjector.swift`·`MonthlyCostsRepository.swift`·`FinancialReviewStageView.swift` | FinancialReview 8비용필드(만원) emit → projector가 ×10000(원) 변환 후 `MonthlyCostsRepository.persistForCurrentUser`로 `user_store_data.monthly_costs` 투영. 전부 0이면 서버값 보호 위해 생략 |
| **D1** 보험요율 SSOT | `StaffLaborCard.tsx` | `0.1041` 2곳 → `TOTAL_EMPLOYER_RATE_PCT/100`. **정정: SSOT 실값 = 10.6674%**(앞서 11.57%로 오기). 옛 0.1041=10.41%는 고용안정 0.25%만 누락 → 차이 0.26%p(보험 자체 영향은 작음). 회귀 테스트 `employer-insurance-rate.test.ts` 3/3 잠금 |
| **D2** 인건비 풀버든 | `useDashboardComputed.tsx`·`TeamCard.tsx` | estimatedMonthlyPayroll = 임금+주휴+4대보험(SSOT 요율·4.345). 라벨 "예상 급여"→"예상 인건비" |
| **R3** 신호등 점수색 | `LocationCandidatesStageView.swift` | scoreColor 신호등(#34C759·#FF9F0A) → 미드나잇 농담(midnightDeep/midnight/inkMuted) |
| **D3** 신호등 그린·보라 | `TodayView.swift`·`Tier3Operations.tsx`·`CustomerInterviewCard.tsx` | LivePill #059669→success, 평균이상 rgba(101,197,101)→네이비, 복사버튼 #34d399/#7c3aed→네이비 |

## 남은 백로그 (미수정)
- **테마 B 대형**: S1(iOS StoreInfoSchema Phase-B — 카테고리별 2~12섹션 포팅) · S2(footprint subIndustry modifier 포팅) — 분량 큼, 별도 작업
- **테마 A 블루**: ProfileView #007aff(×4)·TossPlace #0064ff·SubscriptionWebhook #7c3aed·Franchise/Budget sky-blue·iOS ProfileView raw 블루 — 팔레트외(신호등 아님), 일괄 배치
- **기타 P1/P2**: R4(prime cost 하드코딩)·S3(Array 읽기전용 패턴)·S4(daysOperating UTC)·S5(beforeunload)·내정보P1(Codef/Popbill 게이팅)·P4(PortOne stale closure)·R6 dead code
