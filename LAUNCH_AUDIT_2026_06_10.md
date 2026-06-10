# 출시 전 전수 감사 — 2026-06-10 (출시 D-5)

> 6개 영역 병렬 심층 감사(백엔드 API 134라우트 / 로드맵 / 운영 대시보드 / iOS / DB·마이그레이션 / 프론트엔드 UX).
> 기계 검증 전부 통과: shared·web tsc 0오류 ✓ · vitest 239/239 ✓ · iOS BUILD SUCCEEDED ✓ · next build 성공 ✓ (미커밋 마케팅 변경 포함).

## 결론 한 줄

**코드 품질·보안 핵심 경로는 출시 수준이나, P0 7건(보안 2 + 데이터 계약 3 + 가짜 숫자 1 + 무료정책 위반 1)을 먼저 닫아야 함.** 전부 범위가 좁고 수정 경로가 명확 — 1~2일 작업량.

---

## ✅ 수정 완료 (2026-06-10 같은 세션)

**P0 전 7건 수정 완료** + P1 다수. 검증: shared/web tsc 0 · vitest 255+ · iOS BUILD SUCCEEDED · next build 성공. 커밋은 사용자 판단(미커밋).

- **P0-1·P0-2 (보안)**: `supabase/migrations/20260610_000005_security_followup.sql` 신설 — v_revenue_daily_unified `security_invoker=true` + foundone_subscriptions billing_key 재차단(올바른 테이블명). ⚠️ **prod 적용 필수**.
- **P0-3·P0-4·P0-5 (로드맵 계약, iOS)**: AnyJSONDict→supabase-swift `AnyJSON` 타입보존 + read-merge-write(원형 무손실), budget-setup `capital`/`targetOpenDate` 병행 기록 + business_profiles 투영, industry-selection `categoryId`/`subIndustryId` + `selected_primary_option_id` 컬럼. 하위호환 유지.
- **P0-6 (가짜 숫자)**: 예약 데모 `isDemo` 플래그 + 업종별 시드 분기 + "예시 데이터" 배지 + 예시 지우기 + 옛 데이터 마이그레이션 마킹.
- **P0-7 (무료 정책)**: `NEXT_PUBLIC_BILLING_ENABLED` 게이트(기본 닫힘) — /pricing·/billing redirect + sitemap 제거 + 가격 env 단일화 + 약관·환불 링크. 9월 전환은 env 하나.
- **P1 완료**: 원천세 가산세 웹 2곳 정정(법적), account-wipe 마케팅 테이블 2종, play_progress UPDATE 정책+GRANT, cases_cache GRANT, pull/test rate limit, connect 라우트 4개 에러 마스킹, 전월키 util(월말 롤오버)+UTC→KST 월키, 현금흐름 위기감지 분모, KPI Strip SSOT 게이트, MRR 허수 2건, 퍼널 realtime 메시, 초대 returnTo+open redirect 방어. LAUNCH_CHECKLIST 갱신(마이그레이션·cron·env).

**미수정 잔여 P1**(출시 후 1주 내 OK): 신호등 컬러 잔존(웹 guide·DailyKpiStrip·iOS MarketingView 등), iOS 마케팅 미커밋 마무리 4건, 웹 orphan-delete 레이스, iOS franchise hydrate·pushUpsert 재시도·단계번호 하드코딩 7곳, AI 위저드 prefill 불일치, 업종 매트릭스. + 운영설정(Upstash·TAVILY·GRANT 확인).

---

## 🔴 P0 — 출시 차단 (7건)

### 보안 (DB)
1. **`v_revenue_daily_unified` 뷰 RLS 우회 — 전 사용자 매출 노출 가능**
   - `supabase/migrations/20260505_add_popbill_codef_bank.sql:212`. 20260605 보안 하드닝이 뷰 3종을 고치면서 이 뷰만 누락. 코드 참조 0건이지만 PostgREST로 노출.
   - 수정: `ALTER VIEW public.v_revenue_daily_unified SET (security_invoker = true);` (미사용이므로 DROP도 가능)
2. **billing_key 컬럼 차단이 silent no-op — 재과금 토큰 평문 조회 가능**
   - `20260605_000001_security_hardening.sql:66-77`의 IF EXISTS 가드가 옛 테이블명 `buildup_subscriptions`를 체크 → 20260529 rename(`foundone_subscriptions`) 이후 적용 시 블록 전체 skip.
   - 수정: 동일 REVOKE/GRANT를 `foundone_subscriptions` 대상으로 신규 마이그레이션 추가. (코드는 빌링키 컬럼을 안 읽어 재적용 안전)

### 로드맵 데이터 계약 (웹↔iOS — 한 묶음 수정)
3. **iOS inputs JSONB 왕복이 웹 타입 파괴**
   - `RoadmapDecisionsRepository.swift:266-289` AnyJSONDict: number→String, bool→"true", string[]→콤마 join, **nested 객체/null은 통째 skip**. upsert가 이 변환본으로 inputs 전체를 덮어씀 → 웹에서 입력한 `capital: 50000000`이 iOS 수정 한 번에 `"50000000"`으로, hiring-setup의 객체 입력은 삭제.
   - 수정: read-merge-write(변경 키만 patch) 또는 타입 보존 AnyJSON.
4. **budget-setup 키 불일치** — iOS는 `startupWon/operatingWon/openDateId`, 웹 SSOT는 `capital`(number)·`targetOpenDate`. `OnboardingProfileSync.capitalKrw` 호출자 0곳 → iOS 예산이 웹·business_profiles에 영영 미도달. (`BudgetSetupStageView.swift:187-205`)
5. **industry-selection 키 불일치** — iOS는 `industryId/cluster/specialtyId`, 웹 분기는 `inputs.categoryId`·`selectedPrimaryOptionId` 의존 → iOS 온보딩 online/startup 유저가 웹 접속 시 경로 분기 실패(오프라인 default로 산출, current_stage_code 오기록). (`IndustrySelectionStageView.swift:65-69`)

### 가짜 숫자 (웹 대시보드)
6. **예약 데모 데이터가 실데이터로 둔갑**
   - `booking-store.ts:113-137` + BeautyBookingNoshow/Pet/SpaceOccupancy/LivingServiceDispatch 카드. "예시 데이터로 카드 보기" 클릭 시 헤어샵 더미 6건이 isDemo 플래그 없이 localStorage 영구 저장 → 이후 "30일 노쇼율 X%"가 예시 배지 없이 표시. 펫숍 사장님이 "컷+염색 95,000원" 예약을 봄.
   - 수정: `isDemo: true` 플래그 + 상시 "예시 데이터" 배지 + 예시 지우기(실입력 시 자동 제거).

### 무료 정책 위반 (웹)
7. **/pricing 실과금 페이월 공개 노출**
   - "6~8월 전 기능 무료" 정책인데 ① /pricing이 sitemap 등재, ② 월 ₩19,900 실과금 동작, ③ "무료 플랜 제한"(AI 하루 3회, 7일 보관) 문구는 코드에 미구현 → 지금 결제하면 무료와 동일 기능에 과금되는 허위 안내.
   - 수정: 무료 기간 동안 /pricing·/billing redirect 처리 + sitemap 제거(결제 백엔드 보존).

---

## 🟠 P1 — 출시 전 처리 강력 권장 (법적·데이터 정합)

| # | 항목 | 위치 | 요지 |
|---|---|---|---|
| 1 | **원천세 가산세 웹 수치 오류(법적)** | `InsuranceTaxSetupStage.tsx:522,799` | 웹 "무신고 20%"/"가산세 10%" → 정답(iOS와 동일) "미납세액 3% + 일 0.022%(한도 10%)"로 정정 |
| 2 | **account-wipe 누락 테이블 3종** | `_lib/account-wipe.ts:15-56` | marketing_cases_cache·marketing_play_progress·marketing_trend_cache 누락 → 계정 초기화 후 데이터 부활 |
| 3 | **marketing_play_progress UPDATE 정책 부재** | `20260610_000004:26-36` | upsert 충돌(재체크) 시 42501→500. update_own 정책 추가 |
| 4 | **iOS 마케팅 미커밋 작업 마무리 4건** | MarketingView.swift 외 | ① 풀-투-리프레시 무조건 LLM 재생성(비용 게이팅 누락) ② 히어로+"더 보기" 미구현(웹 불일치) ③ activeChannels 전체기간 vs 이번달 ④ 삭제된 코칭·트렌드 설명 카피 잔존 |
| 5 | **월 키 버그 2계열** | useMorningBriefingBrain.ts:191-193 외 7곳 | `setMonth(-1)` 월말 롤오버(29~31일에 지난달=이번달) + UTC `toISOString().slice(0,7)` 잔존(KST 1일 00~09시 오류). 전월키 util 1개로 통일 |
| 6 | **현금흐름 위기 감지 분모 오류** | `cashflow-projection.ts:91-98` | 일평균을 entry 수로 나눔 → 희소 입력 시 유입 과대 → 위기 누락. 경과 일수 분모로 교체 |
| 7 | **KPI Strip 비율 SSOT 우회** | `Tier1DailyHub.tsx:180-199` | 월비용÷MTD매출 생나눗셈 → 월초 200%+ 오표시. `ratiosReady`+SSOT 값 사용 |
| 8 | **MRR 허수 2건** | Tier1DailyHub.tsx:202-222, CEOMorningHero.tsx:341-345 | GA4 active_users×플랜가를 MRR로 표시 / 14일 매출 외삽을 "MRR"로 무표기 |
| 9 | **웹 orphan-delete 레이스** | `persistence.ts:449-489` | iOS 직후 완료 단계를 웹 autosave가 5초 창에서 삭제 가능. updated_at 가드 |
| 10 | **iOS franchise 단계 누락** | `RoadmapStage.swift:398` | 웹 온보딩 franchise 유저가 iOS에서 franchise-application 미노출(UserDefaults만 판정). 원격 hydrate 필요 |
| 11 | **iOS pushUpsert 재시도 부재** | `RoadmapStore.swift:290-299` | fire-and-forget → 실패 시 영영 미전송. PendingSyncQueue 적용 |
| 12 | **신호등 컬러 잔존** | useDashboardComputed.tsx:298-305, DailyKpiStrip.tsx, MarketingSurface.tsx, guide/[guideId]/page.tsx:52-56, iOS MarketingView.swift:152-157 | 초록/빨강/주황 직접 사용 → 네이비 농담+벽돌 SSOT로 교체 |
| 13 | **직원 초대 returnTo 증발** | `invite/[code]/page.tsx:117` vs `auth/page.tsx:124` | auth가 returnTo 미처리 → 초대 플로우 끊김 |
| 14 | **웹훅 글로벌 secret fallback** | webhooks/portone·toss/[uid]/route.ts | enc 미설정 사장님 대상 위조 가능 — 전 연결 enc 마이그레이션 후 fallback 제거 |
| 15 | **SSRF 테스트 라우트 rate limit 누락** | `saas-metrics/pull/test/route.ts:64-110` | checkSimpleRateLimit 추가 |
| 16 | **connect 라우트 raw DB 에러 노출** | toss·custom·stripe connect 외 | `error.message` → 고정 문자열 + console.error |
| 17 | **realtime 메시 누락 — 퍼널 카드** | `useFunnelMetrics.ts` | `buildup:remote-data-changed` 리스너 추가 |
| 18 | **업종 매트릭스 vs 렌더 불일치** | industry-card-matrix.ts:219-224 vs Tier1_5Coaching.tsx | online-digital 필수 카드 2개 부재. 게이팅 통일 |
| 19 | **AI 위저드 결과 처리 불일치** | useOnboardingHandlers.ts:357-388 vs AppRoot.swift:657-705 | 웹은 decision 5개 prefill, iOS는 0건 |
| 20 | **iOS 단계번호 하드코딩 7곳** | ConstructionSetup·Registration·BizRegistration·TaxGuide·LoanGuide·GoLive·LaunchGtm StageView | 리스트와 상세가 다른 번호. 경로 인덱스 동적 표기 |
| 21 | **결제화면 약관·환불 고지 부재 + 가격 하드코딩** | pricing/page.tsx:239, billing/page.tsx:99,107 | P0-7 처리 시 함께 |

### 운영 설정 확인 (코드 아님 — 출시 전 사람이 확인)
- **Upstash env**(`UPSTASH_REDIS_REST_URL/_TOKEN`) Vercel 등록 — 미설정 시 rate limit이 인스턴스별 분리로 무력화 (AI 비용 한도 우회 가능)
- **LAUNCH_CHECKLIST.md 갱신 필요**: 20260609_000001 + 20260610_000001~000004 마이그레이션 5개 누락 / cron은 4개 아닌 **6개**(funding-live, billing-renew 추가)
- **GRANT 확인**: prod에서 `select has_table_privilege('authenticated','public.marketing_play_progress','insert');` — false면 42501→500
- TAVILY_API_KEY를 체크리스트 🔴로 승격(신규 마케팅 사례 엔진의 주력 검색 — 없으면 "사례 0건" 재발)
- 체크리스트 env 누락: INSIGHT_INGEST_TOKEN, GOOGLE_API_KEY, APP_BASE_URL/NEXT_PUBLIC_APP_URL

---

## 🟡 P2 — 출시 후 개선 (요약)

- **마이그레이션 멱등성**: 20260526/20260505/20260601/20260608/20260610_000002 bare CREATE — "전체 재적용 안전" 주장과 불일치
- **Suspense fallback 빈 화면 8곳**(roadmap·analytics·profile·marketing 등) → DashboardSkeleton 일괄 적용
- **데드 코드 정리**: iOS fetchCoaching/fetchTrends/TodayDashboardView, 웹 marketing/coach·trends 라우트, coachCache/trendCache, support_programs 시드(런타임 미사용), contractor_cache
- **franchise 벤치마크 orphan 1건**: brandId `friends-screen` → brands.json 부재 (32/33)
- 프로덕션 console.info 잔존(useIndustryInsight.ts), LLM 원문 서버 로그 2곳, brand 잔존 2건(com.buildup.app 예시, buildup/funnel placeholder)
- 페이지별 metadata 부재, /pricing 모바일 2열 고정, 로그인 상태 /auth 재노출
- iOS: 에러 휴머나이징, 빈상태 카피 통일, 캠페인 저장 실패 무음, LoyaltyDonut·CampaignIdeas 웹 부재(동기화 원칙), setPlayDone 디코드 타입, ATS localhost 예외, http maps URL
- 대시보드: "어제 매출"=마지막 entry, cash-runway=계획예산 기준, codef 혼합 fallback, 마케팅 주차키 KST/UTC 불일치, heroInsight dead branch, hide() 고아 키 3개
- ga4/callback nonce 미발견 시 replay 허용(하위호환) → strict 전환, CODEF connect env 하드코딩, insights/ingest 죽은 변수

---

## ✅ 합격 확인 영역

- **인증/인가**: 134라우트 전수 — IDOR 0건, admin 7개 전부 requireAdmin, cron 6개 전부 timing-safe secret
- **결제 정합**: 빌링키 소유권 검증·금액 검증·멱등 처리·웹훅 HMAC fail-closed + replay 윈도우
- **로드맵 경로 구조**: 6개 클러스터 웹=iOS 1:1 (offline 21/online 15/startup 19/hw·lab·semi 23), codegen 재생성 diff 0
- **법적 수치**: 4대보험 요율 완전 일치, 최저시급 10,320, 간이과세 1.04억, 현금영수증 10만원 (예외: P1-1 원천세 웹 2곳)
- **매출 구간별 합산 엔진**: 이중계상 방지 로직 정확, revenueBasis 영속화 체인 정상
- **가짜 숫자 이력 패턴**: ×0.92류 재발 0건 (예외: P0-6 예약 데모)
- **동기화 규율**: StageInputProjector 호출 규칙 준수, realtime publication=구독 정합, 23505 레이스 복구 양쪽 구현
- **신규 마케팅 백엔드**: 인증·rate limit·sanitize·RLS·graceful empty 모두 양호
- 브랜딩(Found.One), 데드링크 0, /help 잔존 0, SSRF 가드, CSV 인젝션 방어, PII 봉투암호화 fail-closed

---

## 권장 일정 (D-5 → 월요일 출시)

| 일자 | 작업 |
|---|---|
| **수~목 (6/10~11)** | P0 7건 수정: 보안 마이그레이션 2개(30분) → 로드맵 키/타입 계약 3건(iOS, 가장 큼) → 예약 데모 배지 → pricing 폐쇄 |
| **금 (6/12)** | P1 출시 전 필수: 원천세 수치(법적), iOS 마케팅 4건 마무리+커밋, account-wipe, update 정책, 월키 util, 위기감지 분모 |
| **토~일 (6/13~14)** | prod 마이그레이션 전체 적용(신규 5개 포함) + env 전수 등록(Upstash·TAVILY 포함) + Realtime 토글 + 카카오 콘솔 + 웹·iOS 스모크 테스트 |
| **월 (6/15)** | 출시. 나머지 P1(신호등 컬러, 메시, 매트릭스 등)은 출시 후 1주 내 |
