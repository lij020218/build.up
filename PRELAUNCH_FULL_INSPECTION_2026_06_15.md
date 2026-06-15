# 출시 전 전수 점검 계획 — Found.One (web + iOS)

> 작성: 2026-06-15 세션 종료 시. **다음 세션 = 이 문서대로 출시 전 전수 점검을 처음부터 수행.**
> 절대 원칙: 웹·모바일 내용 동기화(SSOT) / 무가짜숫자(계산불가=—·예시) / Apple 미니멀 / 신호등 컬러 금지 / 무료 채널 우선.
> git: 브랜치 `feat/backend-audit-and-sync-2026-06-07` = main (fast-forward 동기), HEAD `1808cf0`.

---

## 0. 어떻게 진행할지 (점검 방법론)

- **순서**: Phase 0(게이트) → 1(이번 세션 산출물 실렌더 검증) → 2~9(도메인별). **P0(출시 차단) 먼저, 그다음 P1, P2.**
- **병렬화**: Phase 2~7은 도메인이 독립적 → Explore/general-purpose 에이전트로 병렬 점검 후 결과 취합 권장(이전 감사 패턴).
- **각 항목**: `[ ]` 미점검 / `[~]` 부분 / `[x]` 통과. 발견 이슈는 P0/P1/P2 분류해 이 문서 하단 "발견 이슈 로그"에 누적.
- **중복 금지**: 기존 문서 먼저 읽고 *재확인만* — `LAUNCH_CHECKLIST.md`(사람이 할 ops), `LAUNCH_AUDIT_2026_06_10.md`(코드 P0×7/P1×21 상태), `PRELAUNCH_INSPECTION.md`(2026-06-01 1차), `WEB_IOS_STAGE_PARITY_MATRIX.md`, `MARKET_RECOMMEND_AUDIT_2026_06_11.md`.

---

## Phase 0 — 베이스라인 게이트 (5분, 전부 green 확인 후 시작)

```bash
cd "/Users/lij020218/New project"
(cd packages/shared && npx tsc --noEmit)          # 0 errors
(cd apps/web && npx tsc --noEmit && npx next build) # 0 errors + Compiled successfully
npx vitest run                                      # 직전 262/262
(cd apps/ios && xcodebuild build -project FoundOne.xcodeproj -scheme FoundOneFeatures -destination 'generic/platform=iOS Simulator')  # BUILD SUCCEEDED
(cd apps/ios && xcodebuild build -project FoundOne.xcodeproj -scheme FoundOne -destination 'generic/platform=iOS Simulator')          # 앱 스킴도
```
- [ ] 5개 게이트 모두 통과 (2026-06-15 커밋 시점 통과 확인됨 — 회귀만 점검)

---

## Phase 1 — 🔴 이번 세션 산출물 "실제 렌더" 검증 (가장 큰 미검증 구멍)

> 2026-06-15 세션은 빌드/타입/데이터검증까지만 했고 **실제 화면을 띄워 본 적이 없음.** 출시 전 반드시 눈으로 확인.
> 4개 기능(커밋 cea7912·3a3305e·2a17088·1808cf0):

**웹 (preview_* 툴 — dev 서버 띄우고 해당 stage 진입):**
- [ ] `construction-setup` → "2026 트렌드·추천 가구·특화 업체" 섹션 렌더 (세부업종 선택 상태에서)
- [ ] `vendor-setup` → 공급사에 가성비/표준/프리미엄 칩 노출
- [ ] 스타트업 stage(예: `mvp-build`/`hardware-prototype`) → "추천 도구·AI" / "추천 공급사·도구" 섹션
- [ ] `launch-gtm` → 추천 기술 스택 카드 / `go-live` → "📖 앱 출시 상세 가이드" 동작 확인
- 진입 어려우면: 온보딩에서 업종(예: ai-application / hardware-iot / 음식점 세부업종) 선택 → 해당 stage까지 이동. 상태 세팅이 관건.

**iOS (시뮬레이터):**
- [ ] 위와 동일 stage 5종 — `BUStartupToolingSection`(BUStageShell 주입) · `BUMobileLaunchGuideSheet` 팝업(🍎11/🤖9/🇰🇷 3탭) 실제 렌더
- [ ] 시뮬레이터 띄우는 법: `xcodebuild ... -scheme FoundOne` 빌드 후 `xcrun simctl` 또는 Xcode로 실행. 스크린샷으로 증빙.
- 확인 포인트: 데이터 없는 일반 stage엔 섹션 **미렌더**(EmptyView) 여야 함.

---

## Phase 2 — AI 기능 전수 라이브 점검 (사용자 명시 요구: "완벽해야")

> 이전(2026-06-11) 14/14 @foundone/ai PASS + 라우트 인라인 검증함. 코드/데이터 변경 후 **재확인**.
> 공통 함정: 모든 `claude-*` → gpt-5.4-mini 어댑터 / `max_completion_tokens`(max_tokens 금지) / Responses API web_search.

- [ ] 로드맵 생성 `/api/ai/roadmap/generate`
- [ ] 계약서 분석 · 피드백 분석 · 피드백 질문 생성
- [ ] 상권 추천 `/api/data/market-recommend` (큐레이션 우선 + 미커버 지역 AI 폴백 + 카카오 districtKeyFromPlace)
- [ ] 사업계획서 `/api/ai/business-plan/generate` (502 회귀 — max_completion_tokens 유지 확인)
- [ ] 지식 Q&A `/api/knowledge/qa` (getAnthropicApiKey)
- [ ] 마케팅 사례 엔진 `/api/ai/marketing/cases` (2단계 OpenAI + TAVILY) · 모닝 브리핑
- 합격: 500 throw 없음(빈 결과 graceful) · LLM JSON 3단계 fallback 동작 · 응답 본문 prod 로깅 마스킹.

---

## Phase 3 — 웹↔iOS 패리티 감사

- [ ] `WEB_IOS_STAGE_PARITY_MATRIX.md` 최신화 — 이번 세션 추가분(인테리어2026·vendor태그·startup툴링·launch가이드) 반영됐는지
- [ ] SSOT codegen 산출물 최신 확인: 변경 후 재생성 했는지 — `scripts/gen-*.mts` (vendor-data.json·cluster-stage-vendors.json·startup-tools.json·mobile-launch-guide.json·interior-2026 swift). prod 빌드에 stale 없게.
- [ ] 스테이지 텍스트·카드 구성 1:1 (KEY ACTION·페이지탭·카드내용까지) — [[feedback_stage_unify_full_structure]]

---

## Phase 4 — 로드맵 정합성 (전 클러스터 end-to-end)

- [ ] 11클러스터 경로가 빈 단계 없이 끝까지 진행(offline 9·online 1·tech 4). startup 분기(hardware→NPI4 / deeptech-lab / extreme-deeptech)가 mvp-build 직후 정확히 갈라지고 launch-gtm 합류
- [ ] stepNumber/totalSteps 정직(하드코딩 거짓 없음 — 과거 audit 이슈) · 단계 잠금/해제 규칙
- [ ] WizardStageDispatcher 의 모든 stageId가 실제 뷰 매핑(EmptyView 폴백 stage 없는지)

---

## Phase 5 — 데이터 정직성 스윕

- [ ] 가짜 숫자 0 (계산 불가 → —/예시/추정 배지). 과거 2차 감사 재위조 없는지 — [[project_fake_data_audit_2026_06_05]]
- [ ] 상권 데이터 출처·시점 (광역시 116 + 서울) · 4대보험 요율 SSOT · 최저시급 등 하드넘버 최신
- [ ] 신호등 컬러 0 (네이비 농담/벽돌만) — [[feedback_buildup_design_tokens]]

---

## Phase 6 — 보안 (출시 차단)

- [ ] `LAUNCH_AUDIT_2026_06_10.md` P0×7 전부 closed 확인 (security_followup 마이그레이션 포함)
- [ ] SUPABASE_SERVICE_ROLE_KEY iOS 클라이언트 부재(anon만) · secret 값 로그/화면 노출 0 · `.env` 미커밋
- [ ] RLS·GRANT (이 DB는 42501 이력 3회 — authenticated insert 권한 확인)
- [ ] rate limit Upstash 영속화(인스턴스별 in-memory 우회 차단) · 결제 웹훅 fail-closed · PORTONE_KEK 불변

---

## Phase 7 — 법무·컴플라이언스

- [ ] 개인정보처리방침·이용약관 본문(Found.One·이영준 보호책임자 lki720412@gmail.com)
- [ ] 사업자등록·통신판매업 신고번호 푸터/약관 표기(전자상거래법 — 등록 후 즉시)
- [ ] 결제 고지(9월 유료 전환 전 페이월 미생성 원칙 — [[project_no_paid_billing_yet]])

---

## Phase 8 — iOS App Store 제출 준비 (앱 자신이 우리가 쓴 가이드를 따라야 함)

- [ ] Bundle ID `com.foundone.mobile` · version 1.0.0 · DEVELOPMENT_TEAM(Apple Team ID) · group.com.foundone.shared
- [ ] Info.plist `ITSAppUsesNonExemptEncryption=false`
- [ ] **Privacy Manifest `PrivacyInfo.xcprivacy` 존재 여부** (없으면 업로드 거절 — 우리 가이드 5단계 그대로 자가점검)
- [ ] App Privacy 라벨 · 연령등급(2026 신규, AI 챗봇 고지) · 스크린샷 6.9형 · 아이콘 1024
- [ ] Xcode 26 / iOS 26 SDK 빌드(2026-04-28 의무) · TestFlight

---

## Phase 9 — Cron + 배포 환경 (사람이 할 일 = LAUNCH_CHECKLIST.md 가 정본)

- [ ] cron 6개 동작: marketing-trends · funding-live · portone-sync · tossplace-sync · funnel-pull · billing-renew (vercel.json) + `CRON_SECRET` 등록(없으면 401)
- [ ] **마이그레이션**: `LAUNCH_CHECKLIST.md` 목록 + 이 세션 이후 신규 **`20260613_000001~000007`(광역시 상권 시딩)**·`20260610_000005`(보안) 적용 여부. (인테리어2026/스타트업툴링/launch가이드는 코드·JSON뿐 — DB 마이그레이션 없음)
- [ ] 환경변수(LAUNCH_CHECKLIST §3): SUPABASE·OPENAI·PORTONE_KEK·CRON_SECRET·UPSTASH·TAVILY·NEXT_PUBLIC_BASE_URL·KAKAO + NEXT_PUBLIC_APP_URL
- [ ] Supabase Realtime 토글(5테이블) · Storage 버킷 private · Kakao 콘솔 도메인 등록 · DNS/SSL

---

## 발견 이슈 로그 (다음 세션이 채움)
| # | Phase | 이슈 | P | 상태 |
|---|-------|------|---|------|
| | | | | |

---

## 이번 세션(2026-06-15) 델타 — 점검 대상
4커밋 푸시(`e0010e5..1808cf0`, 브랜치+main): ①인테리어2026(웹+iOS) ②vendor 예산태그(웹+iOS) ③스타트업 11종 툴링(웹+iOS) ④앱출시 가이드 Apple11/Google9(웹+iOS 팝업). 전부 게이트 통과·**실렌더 미검증(=Phase 1)**. 관련 메모리: [[project_startup_roadmap_tooling]].
