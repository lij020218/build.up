# 출시 체크리스트 (2026-06-08)

> 코드 검증 완료: `next build` 성공 · `tsc` 0 에러(web/shared/ai) · `vitest` 192/192 통과 · 출시 블로커 0.
> 아래는 **배포 환경에서 사람이 해야 하는 것들**(코드로 못 하는 것). prod DB 상태는 직접 확인 필요.

## 1. Supabase 마이그레이션 적용 (멱등 — 전체 날짜순 재적용 안전)
- 격차 확인: `\dt`로 `foundone_payments`, `ga4_oauth_nonces`, `coaching_history`, `user_feedback` 존재 + `user_store_data`에 `owner_profile_enc` 컬럼 확인.
- **이번 세션 신규(거의 확실히 미적용 — 최우선):**
  - `20260607_000001_ga4_oauth_nonces.sql` (GA4 OAuth replay 방어)
  - `20260607_000002_coaching_history_realtime.sql` (코칭 realtime)
  - `20260607_000003_drop_dead_sales_tables.sql` (평문 자격증명 죽은 테이블 드롭)
  - `20260608_000001_user_feedback.sql` (인앱 피드백)
- **최근(적용 확인):** `20260529_rename_buildup_to_foundone`(이거 미적용이면 결제 전부 실패) → `20260601_payment_id_unique` → `20260603_realtime_publication` → `20260604_roadmaps_unique_user` → `20260605_security_hardening/encrypt_payment_pii/portone_webhook_secret` → `20260606_owner_profile_enc/webhook_secret_dek/promo_playbook_agent`.

## 2. Supabase 대시보드 수동 작업 (마이그레이션만으론 안 됨)
- **Database → Replication → Realtime 토글 ON**: `user_store_data`, `business_profiles`, `stage_decisions`, `roadmaps`, `coaching_history` (안 켜면 웹↔iOS 실시간 동기화·매출 자동반영 안 됨)
- **Storage 버킷**: `store-photos`(public), `business-documents`(**private 필수 — PII**) 상태 육안 확인.
- (선택) `cleanup_ga4_oauth_nonces()` 주기 호출(미등록 시 만료 nonce 누적, 기능 영향 없음).

## 3. 필수 환경변수 (Vercel — 없으면 출시 블로커)
**🔴 핵심:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`(=메인 LLM, getAnthropicApiKey도 이걸 반환), `PORTONE_KEK_BASE64`(봉투암호화 KEK — 없으면 결제·통합·PII 복호화 전부 실패), `CRON_SECRET`(없으면 cron 4개 401).
**🔴 결제 출시 시:** `PORTONE_MERCHANT_API_SECRET`, `NEXT_PUBLIC_PORTONE_STORE_ID`, `NEXT_PUBLIC_PORTONE_BILLING_CHANNEL_KEY`, `PORTONE_WEBHOOK_SECRET`, `TOSS_WEBHOOK_SECRET`, `NEXT_PUBLIC_PREMIUM_PRICE_KRW`(실판매가와 일치 — 불일치 시 결제 reject).
**🟡 기능별:** `NEXT_PUBLIC_BASE_URL`(=https://foundone.dev), `KAKAO_REST_API_KEY`+`NEXT_PUBLIC_KAKAO_JS_KEY`(상권추천·지도), `UPSTASH_REDIS_REST_URL/_TOKEN`(rate limit), GA4 4종, 팝빌 3종, NAVER/TAVILY/YOUTUBE, 공공데이터 키들, Sentry 3종.

## 4. 배포 설정
- **Vercel Pro 필요** (cron 4개 `maxDuration=300` — Hobby면 10초로 강등). cron: portone-sync(매시), tossplace-sync(매시 15분), marketing-trends(23시), funnel-pull(19시).
- **main HEAD 재배포** (prod가 옛 build.up 빌드 서빙 중일 수 있음 — 핸드오프 P0).
- **카카오 개발자 콘솔**: Web 플랫폼 도메인에 `https://foundone.dev`·`https://www.foundone.dev` 추가(현재 localhost만 → prod 401).

## 5. 점검 토글
- **`CODEF_ENV`** 기본 `sandbox` — CODEF 실매출 쓰려면 `production` 명시(메모리상 유료모드는 사용자 100명+ 후 정책이라 출시 시 sandbox 유지 가능).
- **`POPBILL_IS_TEST`** — 실 세금계산서 수집 시 운영값 확인.
- PortOne 채널키가 운영 채널인지 확인.

## 6. 법적·개인정보 (한국 PIPA·전자상거래법) — 🔴 출시 전 필수

### 코드로 처리 완료 (이번 작업)
- ✅ 가입 시 **[필수] 약관·개인정보 동의 체크박스** 추가(미동의 시 가입 차단) — 간주동의 → 명시동의.
- ✅ 개인정보처리방침 보강: 출생연도·사업자등록번호 수집 항목 추가, Sentry 위탁 + 국외이전 고지 추가.
- ✅ Sentry **세션 리플레이 비활성**(동의 없는 PII 화면녹화 제거. 에러캡처는 유지).

### 사장님이 직접 해야 함 (코드로 못 함)
- 🔴 **전자상거래법 사업자정보 표시** — footer/별도 페이지에 상호·대표자·**사업자등록번호·통신판매업 신고번호**·주소·전화·호스팅사. **통신판매업 신고 선행 필요**(유료 구독 판매 시 법적 의무). 현재 전무 → 정보 주시면 footer 컴포넌트 만들어 드림.
- 🟡 개인정보 보호책임자 **실명** 기입(현재 비실명 + 개인 Gmail). 처리방침 `legal/privacy/page.tsx`.
- 🟡 결제 페이지에서 환불·약관 링크 노출(전상법 청약철회 고지).
- 🟡 처리방침/약관 **법무 검토** 권장.

## 7. 인증 — 카카오 가입

- ✅ **iOS 카카오 버튼 숨김** — 깨진 버튼(누르면 개발자 에러) 제거. 이메일·Apple 로그인 정상.
- ✅ **웹 카카오 로그인 코드 구현** — `signInWithOAuth({provider:'kakao'})` 버튼(login·signup) + `auth/callback` 에 OAuth PKCE 세션 수립 분기 추가 + 동의 고지. **단, `NEXT_PUBLIC_KAKAO_LOGIN_ENABLED=true` 일 때만 버튼 노출**(미설정 시 깨진 버튼 방지).
- 🟡 **웹 카카오 활성화 절차**(코드는 됨, 아래만 하면 동작):
  1. Supabase 대시보드 Auth → Providers → **Kakao 활성**(REST API Key/Client Secret 입력)
  2. 카카오 개발자 콘솔: **Redirect URI `https://<project>.supabase.co/auth/v1/callback`** 등록, 동의항목 **이메일**(선택→권장)
  3. Vercel env에 **`NEXT_PUBLIC_KAKAO_LOGIN_ENABLED=true`** 설정 → 버튼 노출
- 🔴 **iOS 카카오**(아직 미연동): `Package.swift` Kakao SDK 주석 해제 + `KakaoSDK.initSDK` + Info.plist URL 스킴/`LSApplicationQueriesSchemes` + `KakaoAuthProvider.signIn` 구현 + `isAvailable:true`. → 출시 후 작업 가능(이메일+Apple로 출시).
- 🟡 **Supabase Auth 대시보드 확인**: Confirm email ON, Site URL=`https://foundone.dev`, Redirect URLs에 `https://foundone.dev/auth/callback`, SMTP(Resend) 연결. (레포에 config.toml 없음 → 대시보드 수동)

## 8. 출시 표면 (소셜/SEO)
- ✅ **OG·favicon PNG 코드 생성** — `app/opengraph-image.tsx`·`app/icon.tsx`(next/og ImageResponse)로 PNG 자동 생성 → 카톡/페북 공유 미리보기 정상. (한글 폰트 미임베드라 OG 텍스트는 Latin 워드마크 — 추후 폰트 추가 시 한글 가능)
- ✅ **robots.ts·sitemap.ts·manifest.ts 추가**.
- ✅ `buildup.example.com`/`buildup.io` 플레이스홀더 도메인 → `foundone.dev` 교체.

## 9. iOS (Xcode 빌드 검증 필요 — 이 환경에서 못 함)
이번 세션 iOS 변경 파일: DailyEntryRepository, UnifiedRevenueService(신규), CashflowModels, DashboardStore, AppRoot, ActivitySnapshotCard, TodayView, RevenueBasisSheet(신규), FeedbackRepository(신규), FeedbackSheet(신규), ProfileView, AccountResetRepository, OnboardingProfileSync, StageInputProjector, LocationCandidatesStageView, CashflowStore, RealtimeSyncManager, OwnerProfileSyncRepository, AIDashboardActionsRepository. → **Xcode 빌드 + 스모크 테스트 필수.**
