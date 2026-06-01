# 최종 출시 점검 핸드오프 — Found.One (web + iOS)

> 작성: 2026-06-01 세션 종료 시. 다음 세션 = **출시 전 서비스 전수 점검**.
> 원칙: 웹·모바일 내용 절대 동기화 / Apple 미니멀 / 신호등 컬러 금지 / 무료 채널 우선.
> 현재 main HEAD: `6c228bf` (로드맵 47단계 가이드형 패리티 완성)

점검은 **P0(출시 차단) → P1(출시 후 1주 내) → P2(개선)** 순으로 진행. 각 항목에 [상태]·[확인법] 명시.

---

## ✅ 점검 1차 처리 결과 (2026-06-01 세션)

| 항목 | 상태 |
|------|------|
| 웹 프로덕션 빌드 (googleapis 미설치 + /auth/callback Suspense) | ✅ 수정·빌드 통과 (`d62fe40`) |
| 보건증 비용 12,000→3,000원 (웹·iOS 동기화) | ✅ (`906df21`) |
| 결제 웹훅 fail-closed (PortOne·Toss) | ✅ (`774cdc6`) — ⚠️ 프로덕션 시크릿 등록 필요 |
| billing/verify 결제-사용자 바인딩 + 중복 차단 + UNIQUE 마이그레이션 | ✅ (`774cdc6`) |
| 계정 삭제 기능 (web API + 웹·iOS UI) | ✅ 구현 — 빌드 검증 후 커밋 |
| DNS foundone.dev + HTTPS 200 | ✅ 확인 |
| 법적 페이지(개인정보·약관) 본문 | ✅ Found.One 정확 |

### ⚠️ 사장님 직접 처리 필요 (출시 전)
1. **Vercel 환경변수 등록**: `PORTONE_WEBHOOK_SECRET`, `TOSS_WEBHOOK_SECRET` (없으면 웹훅 503), `NEXT_PUBLIC_BASE_URL`(=https://foundone.dev, 없으면 OAuth redirect 깨짐), `UPSTASH_REDIS_*`(rate limit)
2. **Supabase 마이그레이션 적용**: `20260529...rename` + `20260601...payment_id_unique`
3. **Vercel 재배포**: 빌드 차단이 풀렸으니 main HEAD로 재배포
4. **사업자 식별정보**: 사업자등록·통신판매업 신고 후 상호·등록번호·신고번호·주소·연락처를 푸터/약관에 표기 (전자상거래법). 현재 등록 전 → 등록 즉시 추가.

### 🟡 출시 후 정리 (P2)
- API 라우트 LLM 응답 본문 프로덕션 로깅 마스킹 / `/help` 데드링크 / iOS 앱 버전 표시 / GA4_STATE_SECRET KEK 재사용 분리 / 웹 푸터 신설

---

## P0 — 출시 차단 요소 (반드시 먼저)

### P0-1. 배포 인프라 동기화
- [ ] **Vercel 재배포** — 프로덕션이 옛 build.up 빌드를 서빙 중일 수 있음. main HEAD(`6c228bf`)로 Redeploy 후 foundone 브랜딩·로드맵 변경 반영 확인.
- [ ] **Supabase 마이그레이션 적용** — `supabase/migrations/20260529_000001_rename_buildup_to_foundone.sql` 적용 여부 확인. (이전 세션에 수동 적용했다면 skip — `\dt` 로 테이블명 확인)
- [ ] **DNS — foundone.dev** — Vercel 도메인 연결 + SSL 발급 확인. `dig foundone.dev` / 브라우저 https 접속.
- [ ] **iOS 빌드** — Bundle ID `com.foundone.mobile`, Found.One 워드마크 확인됨(이번 세션). App Store Connect 업로드 / TestFlight 배포 준비. 인증서·프로비저닝·아이콘·스크린샷 점검.

### P0-2. 보안 (출시 전 필수)
- [ ] **Rate Limit 영속화** (이전 audit 잔여) — `apps/web/app/api/_lib/rate-limit.ts` 의 `checkSimpleRateLimit` 은 in-memory Map → Vercel 람다 인스턴스별 분리되어 우회 가능. **Upstash Redis**(권장, 무료 tier) 또는 Supabase `rate_limit_buckets` 테이블로 이전.
- [ ] **환경변수 점검** — Vercel에 `PORTONE_WEBHOOK_SECRET`, `TOSS_WEBHOOK_SECRET`, Supabase 키, Sentry DSN, AI(OpenAI/Anthropic) 키 모두 등록 + `.env` 가 git에 커밋 안 됐는지 재확인.
- [ ] **Supabase RLS** — 모든 사용자 데이터 테이블에 Row Level Security 정책 적용 확인 (특히 `saas_metrics_*`, `store_data`, 구독/결제 테이블). 익명 접근 차단.
- [ ] **Webhook HMAC** — PortOne·Toss 검증 코드는 적용됨(이전 세션). 시크릿 미설정 시 skip 되므로 **프로덕션 시크릿 실제 등록** 확인.
- [ ] **Sentry 활성화** — DSN 등록됨. 프로덕션에서 에러 실제 수집되는지 테스트 이벤트로 확인. `instrumentation-client.ts` onRouterTransitionStart 경고 처리(선택).

### P0-3. 브랜딩 일관성 — 잔존 buildup 식별자 33개
이번 스캔 결과 (분류):
- [ ] **localStorage 키 prefix `buildup*`** (`usePersistence.ts`, `useSelectionHandlers.ts`) — 사용자 로컬 데이터 네임스페이스. **결정 필요**: 출시 전 사용자 거의 없으면 `foundone*` 로 rename + 기존 키 마이그레이션. 그대로 두면 내부적으로만 buildup (사용자 비노출이라 낮은 우선순위).
- [ ] **`store-info-schema.ts` → "buildup.io"** — placeholder 도메인/이메일. foundone.dev 로 교체.
- [ ] **console.log 접두사 `[buildup persistence]`** 등 — 미관(사용자 비노출). 일괄 치환 권장.
- [ ] **오탐 제외**: `LaunchGtmStage.tsx`/`CompanySetupStage.tsx` 의 "buildup" 은 영어 단어(audience buildup) — 브랜드 아님. 변경 금지.
- 확인법: `grep -rin "buildup" apps/web/app apps/ios/Sources | grep -vi "foundone\|건축물\|audience"`

---

## P1 — 출시 후 1주 내

### P1-1. 데이터 정합성 / 웹·모바일 SSOT
- [ ] **인허가 보건증 비용 버그** — `packages/shared/src/permits/permit-matrix.ts` 의 `healthCertificate.costWon = 12000` 인데 웹 본문·iOS는 3,000원. **실제 보건소 약 3,000원이 정답** → matrix 값 정정(12000→3000, costNote 통일).
- [ ] **permit-matrix iOS 미러 부재** — 웹 체크리스트는 `permit-matrix.ts`(기관·비용·서류·절차·URL 카드)를 쓰는데 iOS는 미러 없음. 이번 세션에 iOS 인허가는 가이드형으로 재구성했으나 **풍부한 permit 카드(신청 URL 등)는 아직 웹 전용**. JSON export → iOS Resources 동봉 검토(franchise-brands 선례).
- [ ] **SSOT 일치 재확인** — franchise-brands.json(215개, symlink 동기화됨 ✓), specialty-by-industry, 로드맵 47단계 패리티(이번 세션 완성 ✓). 세무·4대보험 요율 등 수치 최신성 재확인.

### P1-2. 핵심 플로우 스모크 테스트 (웹 + iOS 양쪽)
- [ ] 회원가입 → 온보딩(업종·창업형태 선택) → 로드맵 진입
- [ ] AI 로드맵 생성 (OpenAI 마이그레이션 후 정상? — 이전에 깨졌다 복구 이력 있음)
- [ ] 로드맵 단계 진행/완료/수정 저장 (idle/saving/saved/error)
- [ ] 운영 대시보드 — 매출/고객 입력 → 카드 갱신, AI 모닝 브리핑
- [ ] 결제·통합 연결 시트 (PortOne, TossPlace) 동작
- [ ] 로그인/로그아웃 hard-reload 패턴

### P1-3. 법적 / 규정
- [ ] 개인정보처리방침 · 이용약관 페이지 존재 + 최신 + Found.One 명의
- [ ] 사업자 정보(상호·대표·사업자번호·주소) 푸터 표기
- [ ] 결제 시 환불·청약철회 고지 (전자상거래법)

---

## P2 — 개선 (출시 후)

- [ ] **TODO/FIXME 82건 triage** — 출시 차단/단순 메모 분류. (`grep -rin "TODO\|FIXME" apps/`)
- [ ] 빌드 경고 정리 (Sentry deprecation, FoundOneDataTests 경로 경고 등)
- [ ] 딥테크 외 단계 콘텐츠 최신성 2차 점검
- [ ] 접근성(Dynamic Type 이번 세션 적용 ✓, 색 대비·VoiceOver 추가 점검)
- [ ] 성능 — 초기 로드, 이미지 최적화, 번들 크기

---

## 참고 — 이번 세션(2026-06-01) 완료분
- 프랜차이즈 specialty 전 업종 매핑 + 신규 26개 (215 브랜드, web/iOS symlink SSOT)
- 객단가 단위 한국식 통일 / 예산 인사이트 막대 겹침 수정
- 로드맵 47단계 가이드형 패리티 완성 (인허가 6탭 + BUWorkStep 신규, 사업자등록 3탭, 딥테크 11개 wrapup)
- 모든 변경 main push 완료, 시뮬레이터 빌드 통과

## 점검 환경
- 웹 로컬: `cd apps/web && pnpm dev` → http://localhost:3000
- iOS 빌드: `cd apps/ios && xcodebuild -project FoundOne.xcodeproj -scheme FoundOne -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -derivedDataPath /tmp/foundone-dd build`
- iOS 설치: `xcrun simctl install booted <앱경로> && xcrun simctl launch booted com.foundone.mobile`
- ⚠️ `swift build` CLI 는 Supabase macOS 플랫폼 충돌로 막힘 — iOS 검증은 xcodebuild(시뮬레이터)로만.
