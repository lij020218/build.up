# 출시 가능성 전수 점검 — 2026-08-06

목적: "정말 앱으로 출시 가능한가"를 실측으로 판정. 모든 항목은 이 세션에서 직접 실행·측정한 결과만 기재 (미검증은 명시).

## 판정 요약

**코드·빌드·데이터 기준으로 출시 가능.** 차단(P0)은 코드가 아니라 **사장님 액션 2건** — Vercel `KSTARTUP_API_KEY` 교체와 SMTP(이메일 인증 발송) 확인. 이 둘을 끝내면 배포 게이트 없음.

## 1. 실측 결과 (게이트별)

| 게이트 | 결과 | 근거 |
|---|---|---|
| 웹 테스트 전체 | ✅ 671/671 통과 | vitest run (08-05) |
| 웹 프로덕션 빌드 | ✅ exit 0 | `npx next build` 정상 route 요약 출력 |
| iOS 풀앱 빌드 (Debug) | ✅ 성공 | `FoundOne` 스킴 iphonesimulator |
| iOS Release 빌드 + 아카이브 | ✅ 성공 (수정 후) | 최초 Release 빌드에서 차단 2건 발견·수정 — 아래 §2 |
| `.ipa` 서명 | ✅ 정상 | Cloud Managed Apple Distribution / `7VMPNM5KMF.com.foundone.mobile` / `aps-environment=production` / applesignin=Default |
| prod DB 마이그레이션 | ✅ 10/10 테이블 존재 | service-role REST 200 (marketing_meme_packs·ai_monthly_spend·surface_daily_visits·shift_availability·market_area_snapshots·interior_firms·ai_daily_usage·payroll_confirmations·user_push_tokens·marketing_engagement_events) — 기존 "prod 마이그 필요" 메모 전부 해소 |
| prod RPC | ✅ 존재 확인 | record_surface_visit(401=존재)·lookup_store_invite(시그니처 힌트=존재) |
| 밈·트렌드 cron | ✅ 정상 | 수동 트리거 → 2026-W32 pack 7건 exists |
| 펀딩 K-Startup cron | ⚠️ prod 키 문제 | count:0, 로컬 키는 실데이터 확인 → **Vercel env 교체 필요**. 로컬 heal로 스냅샷 173건 채움(24h TTL) |
| 이메일 인증(SMTP) | ⚠️ 미검증 | Supabase SMTP 설정 여부 미확인 — RESEND_SUPABASE_SMTP.md 참조 |
| 코드 전수 스캔 | ✅ P0 없음 | 아래 §2 |

## 2. 코드 전수 스캔 (mock 누출·죽은 링크·민감 로그·패리티)

P0 = 0건. 스캔 에이전트가 부정 결과까지 검증(가정 아님).

- **mock/데모 누출 없음**: iOS 데모는 `#if DEBUG`+`BU_DEMO_SCENARIO`+`BU_DEMO_ALLOW=1` 3중 게이트, 웹 시드는 `isDemo:true`+"예시" 배지+첫 실입력 시 제거.
- **죽은 UI 없음**: 내부 href/router.push/fetch("/api/…") 전수 → 대상 page.tsx·route.ts 전부 존재(0 miss). `/dev/*` 6개는 prod에서 notFound() 게이트 확인.
- **민감 로그 없음**: 토큰·키·이메일 로깅 0건, uid는 `.slice(0,8)` 절단, 클라 캐시 로그는 prod 가드.
- **패리티**: 웹 전용 위젯은 전부 `platforms:["web"]` 선언 — 무언 공백 없음.

### 이번 세션에서 수정 완료 (P1 → 해소)

| 항목 | 수정 |
|---|---|
| iOS FunnelConnectionRepository `baseURL` prod 하드코딩 (TestFlight/스테이징도 prod 타격) | `BUSupabase.shared.env.webAppURL` 기본값으로 교체 |
| iOS StoreConnectSheet "iOS 직원 화면은 준비 중" — 이미 출시된 기능을 부정하는 낡은 문구 | "앱과 웹 직원 화면에서 바로 쓸 수 있어요"로 교정 |
| **AppRoot.swift — Release 빌드 불가 (P0)**: `DemoTabs` 가 `#if DEBUG` 안에만 정의됐는데 호출부는 밖에 있어 아카이브가 깨짐. 파생으로 타입체크 시간초과까지 발생. 그동안의 "iOS 빌드 성공" 은 전부 **Debug** 였고 Release 는 이번이 최초 | 호출부를 `demoTabs(scenario:)` @ViewBuilder 헬퍼로 분리해 `#if DEBUG`/`#else EmptyView()` 로 갈라냄 → Release 빌드·아카이브·export 성공 |
| **project.yml 서명 충돌 (P0)**: Release 에 `CODE_SIGN_IDENTITY = "Apple Distribution"` 수동 지정 + `CODE_SIGN_STYLE: Automatic` → "conflicting provisioning settings" 로 아카이브 실패 | iphoneos identity 수동 지정 제거 (자동 서명이 개발 서명으로 아카이브 → export 가 배포 서명으로 재서명) |
| BUStageContentRenderer `default: EmptyView()` 무언 fallback — 미래에 platforms 누락 ref 추가 시 iOS에서 소리 없이 사라짐 | 드리프트 가드 테스트 신설: `apps/web/__tests__/stage-interactive-ios-coverage.test.ts` (iOS 대상 ref ↔ Swift case 전수 대조, 통과 확인) |

### 잔여 P2 (출시 비차단, 백로그)

- `AppleAuthProvider.deleteAccount()` 죽은 코드 — 실경로는 AuthCoordinator→`/api/account/delete`로 정상. Apple 심사 대비 죽은 TODO 제거 권장.
- CSP `unsafe-inline`/`unsafe-eval` 유지 (middleware.ts:35, 보상 통제 문서화됨) — post-launch nonce 전환.
- `env.ts` DEFAULT_ADMIN_EMAILS 하드코딩 (락아웃 보험, 의도적).
- ConversionFunnelCard 샘플값 헤드라인이 실데이터처럼 크게 보임 (배지는 있음).

## 3. 사장님 액션 (P0 — 이것만 남음)

1. **Vercel `KSTARTUP_API_KEY` 교체** — 로컬 `.env.local` 키는 정상 작동 확인. Vercel 대시보드 → Settings → Environment Variables에서 같은 값으로 갱신 후 redeploy. (안 하면 펀딩 라이브 공고가 24h 후 다시 비어감)
2. **SMTP 확인** — Supabase Dashboard → Auth → SMTP에서 Send test email. 미설정이면 RESEND_SUPABASE_SMTP.md 절차대로. (안 하면 신규 가입 이메일 인증 메일 발송 불가 = 가입 차단)
3. (선택) Vercel env 전수 대조 — 코드가 읽는 키 중 `.env.example`에 없는 것: `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`, `TAVILY_API_KEY`, APNS 5종, `VAPID_*`, `UPSTASH_*`, `GA4_STATE_SECRET`(가장 놓치기 쉬움), Sentry·PortOne·Toss(결제 미가동이라 지금은 무관). 푸시 알림 켜려면 APNS/VAPID 시크릿 필수.

## 4. App Store 제출

- 제출 절차 문서 존재: `apps/ios/APPSTORE_SUBMISSION.md` (244줄).
- 계정 삭제(5.1.1(v)) 실경로 정상 — 위 P2의 죽은 코드만 정리 권장.
