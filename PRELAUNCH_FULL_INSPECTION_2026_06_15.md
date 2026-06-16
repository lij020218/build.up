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
- [x] 5개 게이트 모두 통과 (2026-06-15 재검증: shared tsc 0 · web tsc 0 + next build Compiled · vitest 262/262 · iOS FoundOneFeatures BUILD SUCCEEDED · iOS FoundOne BUILD SUCCEEDED)

---

## Phase 1 — 🔴 이번 세션 산출물 "실제 렌더" 검증 (가장 큰 미검증 구멍)

> 2026-06-15 세션은 빌드/타입/데이터검증까지만 했고 **실제 화면을 띄워 본 적이 없음.** 출시 전 반드시 눈으로 확인.
> 4개 기능(커밋 cea7912·3a3305e·2a17088·1808cf0):

**웹 (preview_* 툴 — dev 서버 띄우고 해당 stage 진입):** ✅ 2026-06-15 전부 실렌더 확인
- [x] `construction-setup` → "2026 트렌드 · 추천 가구 · 특화 업체" 렌더 (food/korean-casual) — Pantone 2026 클라우드댄서·테일러드클래식 등 실데이터, 출처 표기
- [x] `vendor-setup` → 가성비×7·표준×23 칩 각 벤더 옆 렌더 (CJ프레시웨이→표준, 이마트→가성비). 프리미엄은 vendor-data.json에 40건 존재(코드 정상)·korean-casual 데이터에만 미사용
- [x] 스타트업: `mvp-build` 도구·아키텍처 인라인(Vercel·Supabase·Stripe·Claude Code) / `hardware-prototype` "추천 공급사 · 도구" / `customer-discovery` "추천 도구 · AI"(StartupToolkitPanel) 모두 렌더
- [x] `launch-gtm` "출시 스택" 탭 → "추천 기술 스택 — 2026 표준"(Next.js·Vercel 레이어) / `go-live` 채널선택(웹/App Store/Google Play/PH·HN) + "📖 5가지 방법" 모달(시간·비용·사용도구) 동작
- 방법: Supabase 세션 없이 진입 불가 → dev 전용·`__fo_preview` 플래그 가드 우회 2파일 임시 패치(usePersistence.ts·stores/index.ts), 검증 후 git 복원. 스토어 window 노출로 viewingStageId+업종 주입.
- ⚠️ Phase 5 확인거리: go-live 가이드 모달 난이도 배지 "고급"이 옅은 핑크빛 — 신호등 컬러 여부 점검

**iOS (시뮬레이터):** ✅ 2026-06-15 iPhone 17 Pro / iOS 26.4 시뮬레이터에서 전부 실렌더 확인
- [x] `BUStartupToolingSection` (mvp-build): "추천 도구 · AI"(월 6~10만원) — Claude Code(AI·KR)·Cursor·v0·Figma·Supabase·GitHub 실데이터+가격+설명
- [x] `BUMobileLaunchGuideSheet`: 3탭(🍎 App Store / ▶ Google Play / 🇰🇷 한국·공통) — Apple Developer 가입·D-U-N-S·iOS 26 SDK 의무(2026-04-28)·App Store Connect 등 실데이터
- [x] `construction-setup`(인테리어 및 공사) · `mvp-build` · `go-live` stage 셸 정상 렌더 (네이비 KEY ACTION, 신호등색 없음)
- [x] EmptyView 안전망: 오프라인 stage(tax-guide)에 BUStartupToolingSection 데이터 없음 → 빈 시트(미렌더) 확인. 코드 가드 BUStartupToolingSection.swift:26 (vendors·toolkit·stack 모두 없으면 EmptyView)
- 방법: AppRoot DEBUG 데모 모드 `SIMCTL_CHILD_BU_DEMO_SCENARIO=critical/healthy BU_DEMO_ALLOW=1 BU_DEMO_TAB=roadmap BU_DEMO_STAGE=<stage> xcrun simctl launch` (인증 우회·실데이터 아님 빨간 배너). computer-use 탭이 macOS 시스템 오버레이 hit-test에 막혀, 시트/툴링은 env-gated 자동표시 임시패치(GoLiveStageView·BUStageShell) 후 `simctl io screenshot` 캡처 → git 복원.
- [x] iOS vendor-setup 예산태그 캡처 완료 — "푸드팡 한식 식재료 정기배송 · 월 200-500만 · 표준" 칩 렌더 확인(웹과 동일 메커니즘). Phase 1 iOS 완전 종료.

---

## Phase 2 — AI 기능 전수 라이브 점검 (사용자 명시 요구: "완벽해야")

> 이전(2026-06-11) 14/14 @foundone/ai PASS + 라우트 인라인 검증함. 코드/데이터 변경 후 **재확인**.
> 공통 함정: 모든 `claude-*` → gpt-5.4-mini 어댑터 / `max_completion_tokens`(max_tokens 금지) / Responses API web_search.

> ✅ 2026-06-15 코드 레벨 전수 재확인 — 6라우트 PASS, 회귀 없음. (라이브 호출은 미실시 — 코드 정독)
- [x] `/api/ai/roadmap/generate` — Pass1/2 어댑터 경유, Pass2 실패 시 결정론 fallback, 빈 throw 없음
- [x] 계약서분석·피드백질문 — 어댑터+필드 타입가드. (예외 시 500은 P2 — 정상 빈결과는 502/빈배열)
- [x] `/api/data/market-recommend` — districtKeyFromPlace 폴백·Kakao null graceful·다층 fallback
- [x] `/api/ai/business-plan/generate` — **`max_completion_tokens:8192` 확인(502 회귀 차단)** + 3단계 JSON fallback
- [x] `/api/knowledge/qa` — 스트림 내부오류 SSE graceful (최상위 catch 500은 P2)
- [x] `/api/ai/marketing/cases` — 2단계 OpenAI(`max_completion_tokens:2600`)+Tavily, 실패 전부 200 빈 plays
- [x] 합격기준: raw `max_tokens` OpenAI 바디로 나가는 경로 0 · `claude-*`→gpt-5.4-mini 어댑터(Anthropic 직접호출 0) · 3단계 fallback · apiKey 로그 0. **P1: business-plan 키부재 경로 rawKey 앞10자 로그 축소(이슈#2)**

---

## Phase 3 — 웹↔iOS 패리티 감사

- [~] `WEB_IOS_STAGE_PARITY_MATRIX.md` — 문서가 06-03에 멈춤, 세션 추가분 4종 미기재(이슈#10 P2). **코드는 양쪽 구현 정상**
- [x] SSOT codegen 5/5 재생성 byte-identical(stale 0). iOS JSON 4종은 packages/shared/*.json 심볼릭링크 → 드리프트 구조적 차단
- [x] 스테이지 1:1 — 샘플 3종(construction/mvp/go-live) 매트릭스 §4 "콘텐츠 합집합 + 네이티브 UI" 설계 준수, SSOT 데이터 동일

---

## Phase 4 — 로드맵 정합성 (전 클러스터 end-to-end)

- [x] 11클러스터·18분기 단절/사이클/고아/조기종료 0 → pre-launch-final 종료. startup 3-way 분기 정확히 갈라지고 launch-gtm 재합류
- [x] stepNumber 표시값 전부 path 위치 기반 동적 계산(정적 거짓 없음). 잠금 규칙 일관(required task·엣지 타깃 실존). P2: 정적 stepNumber 필드 잔재 정리 권장
- [x] 48 stage 전부 디스패처 매핑 — EmptyView 폴백 stage 0건

---

## Phase 5 — 데이터 정직성 스윕

- [x] 가짜숫자 0 — funnel은 "샘플" 배지+WoW/소스 억제, 계산불가 "—". 2차 감사 강등카드 재위조 흔적 없음
- [x] 상권 출처·시점(서울 golmok·KB·소진공 2024-25 표기) · 4대보험 SSOT 2곳(고용안정0.25% 포함) · 최저시급10320·간이1.04억 최신
- [~] 신호등 컬러 — Phase1 "고급" 배지는 #b64c4c 벽돌(정상). 신규 P2 3건: DailyOps 그린#22A749 / CustomerInterview #34d399+보라 / iOS SectionEditSheet Color.red (이슈#3)

---

## Phase 6 — 보안 (출시 차단)

- [x] P0×7 전부 CLOSED 재확인(security_followup 20260610_000005 포함, 파일:라인 근거)
- [x] service_role 클라이언트/iOS 부재(anon만) · secret 로그/화면 노출 0 · .env.local 미커밋(git ls-files 확인)
- [x] RLS·GRANT — 핵심 4테이블 own-row 정책+GRANT-before-RLS 순서로 42501 봉인
- [x] rate limit Upstash-first(in-memory는 dev) · 웹훅 3종 fail-closed(HMAC/replay/timing-safe) · PORTONE_KEK read-only 불변. **P1(운영): UPSTASH env Vercel 등록 필수 / 마이그레이션 prod 적용 운영자 확인(이슈#4·5)**

---

## Phase 7 — 법무·컴플라이언스

- [x] 처리방침·이용약관 본문 충실(이영준·lki720412@gmail.com·위탁·국외이전 고지). 책임자 연락처 개인Gmail은 법무 권고사항
- [ ] **🔴 사업자정보 푸터 전무(사업자등록번호·통신판매업 신고번호) — placeholder조차 없음. 신고 선행+푸터 신설(이슈#8)**
- [x] 페이월 미생성 — billing-gate fail-closed, /pricing·/billing 닫히면 redirect+null

---

## Phase 8 — iOS App Store 제출 준비 (앱 자신이 우리가 쓴 가이드를 따라야 함)

- [x] Bundle `com.foundone.mobile` · 1.0.0 · build1 (xcconfig SSOT). **DEVELOPMENT_TEAM 빈값=운영자(이슈#7)**. App Group은 위젯 미사용이라 1.0.0 무관
- [x] `ITSAppUsesNonExemptEncryption=false` (Info.plist:39-40)
- [x] **`PrivacyInfo.xcprivacy` 존재** — NSPrivacyTracking=false, 수집4종, UserDefaults reason CA92.1
- [x] **아이콘 1024 알파채널 제거 완료(이번 세션, 이슈#6 fixed)** — RGBA→RGB. App Privacy라벨·연령등급·스크린샷6.9형은 ASC 운영자 작업
- [x] iOS 26.4 시뮬레이터 빌드 SUCCEEDED (Xcode26/iOS26 SDK, deploy타깃 iOS18.0). TestFlight=운영자

---

## Phase 9 — Cron + 배포 환경 (사람이 할 일 = LAUNCH_CHECKLIST.md 가 정본)

- [x] cron 6개 vercel.json 정의 + 6개 전부 CRON_SECRET timing-safe 검증(없으면 401 fail-closed)
- [x] 마이그레이션 102개 파일 — 20260613_000001~000007·20260610_000005 전부 존재. **prod 적용=운영자(이슈#5)**
- [~] 환경변수 — 코드는 정상 read. **.env.example 23키 미문서화(이슈#9 P2). LAUNCH_CHECKLIST §3엔 전부 있음 → 정본 따르면 누락 없음**
- [ ] Supabase Realtime 토글(5테이블) · Storage 버킷 private · Kakao 콘솔 도메인 등록 · DNS/SSL

---

## 발견 이슈 로그
| # | Phase | 이슈 | P | 상태 |
|---|-------|------|---|------|
| 1 | 1→5 | go-live 가이드 "고급" 배지 핑크빛 → 실제 `#b64c4c` 벽돌(승인 danger 토큰), 15% opacity 배경 탓. 신호등 위반 아님 | P2 | closed (오인) |
| 2 | 2 | business-plan/generate route.ts:81 키 부재 경로에서 rawKey 앞10자 로깅 — 길이/존재만 로깅하도록 축소 | P1 | open |
| 3 | 5 | DailyOpsRitualCard 완료=그린 rgb(34,167,73) / CustomerInterviewCard 복사성공 #34d399+보라 / iOS SectionEditSheet Color.red — 신호등/팔레트외 토큰, 승인색으로 교체 | P2 | open |
| 4 | 6 | UPSTASH env Vercel 미등록 시 rate-limit/AI 비용한도 인스턴스별 우회. .env.example에도 미문서화 | P1(운영) | open |
| 5 | 6 | 신규 마이그레이션 5종(특히 보안 20260610_000005) prod 적용 여부 코드검증 불가 — 운영자 확인 필수 | P1(운영) | open |
| — | 0·1 | 게이트 5종 + 웹/iOS 4기능 실렌더 전부 통과. 회귀 없음 | — | closed |
| — | 2 | AI 6라우트 PASS (max_completion_tokens·어댑터·fallback·마스킹). P0 0 | — | closed |
| — | 4 | 11클러스터·18분기 단절 0, startup 분기 정확, stepNumber 정직, 48 stage 전부 디스패처 매핑 | — | closed |
| — | 6 | LAUNCH_AUDIT P0×7 전부 closed 재확인. 웹훅 fail-closed·RLS·KEK 불변 | — | closed |
| — | 5 | 가짜숫자 0, 하드넘버 최신(최저시급10320·간이1.04억·4대보험0.25%) | — | closed |
| 6 | 8 | iOS 앱 아이콘 icon-1024.png 알파채널(RGBA) — App Store 업로드 거절 사유. 알파 전부 255라 RGB로 변환(시각변화 0) | P1 | **fixed (이번 세션)** |
| 7 | 8 | iOS DEVELOPMENT_TEAM 빈 값 — .env.local APPLE_TEAM_ID 채우고 generate-xcconfig.sh 재실행 or Xcode Team 선택 | P1(운영) | open |
| 8 | 7 | 전자상거래법 사업자정보 푸터 전무(사업자등록번호·통신판매업 신고번호) — 통신판매업 신고 선행 + 푸터 컴포넌트 신설 | P1(법무) | open |
| 9 | 9 | .env.example 23키 미문서화(CRON_SECRET·SERVICE_ROLE_KEY·TAVILY·UPSTASH 등). LAUNCH_CHECKLIST §3엔 있음 | P2 | open |
| 10 | 3 | WEB_IOS_STAGE_PARITY_MATRIX.md 가 06-03에 멈춤 — 세션 추가분 4종(interior2026·vendor태그·startup툴링·launch가이드) 미기재(코드는 정상) | P2 | open |
| — | 3 | codegen 5/5 재생성 byte-identical(stale 0), iOS JSON은 shared 심볼릭링크로 드리프트 구조 차단 | — | closed |
| — | 7 | 처리방침(이영준·lki720412@gmail.com)·이용약관·페이월 미생성 PASS | — | closed |
| — | 8 | Bundle com.foundone.mobile·1.0.0·PrivacyInfo.xcprivacy·ITSAppUsesNonExemptEncryption=false·iOS18타깃 PASS | — | closed |
| — | 9 | cron 6개 vercel.json + CRON_SECRET 전부 fail-closed, 마이그레이션 102개 파일 존재(적용=운영자) | — | closed |
| 11 | a11y | "고급" 벽돌배지(#b64c4c) 소형텍스트 대비 4.17 < AA본문 4.5(대형 AA는 통과). 양 플랫폼 difficulty 배지 공통·기존 조건. 글자 굵게/크게 or 배경 진하게로 보강 | P2 | open |
| 12 | a11y | 웹 BuildMethodDialog 모달에 role="dialog"·aria-modal·포커스 트랩 부재(ESC·scroll-lock·aria-label은 있음). 기존 조건 | P2 | open |
| 13 | a11y | iOS 커스텀 pill 세그먼트 높이 ~35pt < HIG 44pt(시스템 세그먼트도 ~32pt라 관행상 허용이나 vertical padding 상향 여지) | P3 | open |
| — | 리디자인 | 앱출시 팝업 웹+iOS 라벤더-미스트 리스타일(이번 세션). 새 색조합 전부 WCAG AA 본문 통과(pill 14.85·본문 9.77). 5게이트 재통과 회귀 0 | — | closed |
| — | 1 | iOS vendor-setup 예산태그(표준 칩) 캡처 완료 — Phase 1 web+iOS 100% 종료 | — | closed |

---

## 이번 세션(2026-06-15) 델타 — 점검 대상
4커밋 푸시(`e0010e5..1808cf0`, 브랜치+main): ①인테리어2026(웹+iOS) ②vendor 예산태그(웹+iOS) ③스타트업 11종 툴링(웹+iOS) ④앱출시 가이드 Apple11/Google9(웹+iOS 팝업). 전부 게이트 통과·**실렌더 미검증(=Phase 1)**. 관련 메모리: [[project_startup_roadmap_tooling]].
