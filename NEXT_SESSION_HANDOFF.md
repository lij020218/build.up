# 다음 세션 인계 — 2026-05-25 audit 잔여 작업 (2차 세션 후)

## 현재 상태 (이번 세션에서 완료)

**총 6 Task 완료 + TypeScript 0 errors ✓**

### 완료 항목

#### Task 1: Webhook HMAC 검증 (보안 critical) ✅
- **PortOne** (`apps/web/app/api/webhooks/portone/[uid]/route.ts`): `loadWebhookSecret` → `process.env.PORTONE_WEBHOOK_SECRET ?? null`
- **Toss** (`apps/web/app/api/webhooks/toss/[uid]/route.ts`): `verifyTossWebhook` 함수 추가
  - Header: `tosspayments-webhook-signature`
  - Signed: `{rawBody}:{tosspayments-webhook-transmission-time}`
  - `TOSS_WEBHOOK_SECRET` 환경변수 미설정 시 skip (backward compatible)
- **환경변수 추가 필요**: `PORTONE_WEBHOOK_SECRET`, `TOSS_WEBHOOK_SECRET` (Vercel 대시보드)

#### TypeScript 오류 수정 (이전 세션 부작용) ✅
- `BeautyBookingNoshowCard`, `LivingServiceDispatchCard`, `SpaceOccupancyCard` — `@build-up/shared` import 블록 안에 `getKstDate` import 잘못 삽입 → 분리
- `BudgetFundingMatchCard` — `program.amount`는 `string` (not `{ko,en}`), `topReason.text` → `pick(topReason)`
- `useFunnelMetrics` — `saas_funnel_manual_weekly` 미등록 테이블 → `(supabase as any)` cast

#### Task 4: healthScoreNumeric 노출 ✅
- `Tier2WeeklyPulse.tsx` → `SurvivalBoardCard`에 `healthScoreNumeric={c.healthScore}` 전달
- `SurvivalBoardCard.tsx` — 가짜 등급 매핑(70/50/20) 제거 → `healthScoreNumeric ?? 0` 실 점수 사용

#### Task 5: 추가 audit Major 4건 ✅
- TIPS: "5억" → "총 8억 (R&D 5억 + 사업화 3억)" — FundraisingReadinessStage 3곳
- FinancialReview: 쿠팡 10.9% → 10.8%, 네이버 EN "5.74%" → "3.63%"
- InsuranceTax 본문: "2026.1 인상 요율: 국민연금 9.5% (각 4.75%)·건강보험 7.19% (각 3.595%)..." 동기화
- KIPRIS: "startup 70% 우선심사 할인" → "스타트업 (사업개시 3년 이내) 우선심사 신청료 70% 감면 (연 10건 한정)"

#### Task 6: dead code + 로그인/로그아웃 통일 ✅
- `useSelectionHandlers.ts` — 로그아웃 `router.push("/auth")` → `window.location.assign("/auth")` (로그인과 동일 hard reload 패턴)

#### Task 3: 나머지 UTC toISOString 교체 ✅
- client-side 38개 파일, 77곳 `toISOString().slice(0,10)` → `getKstDate()` 교체 완료
- API 라우트 (26곳) — 의도적 UTC 유지 (DB/외부 서비스 통신)
- 결과: **클라이언트 사이드 UTC 패턴 0건**

---

## 🟠 다음 세션 진행 (1 Task 잔여)

### Task 2: Rate Limit Redis/Supabase 이전 (보안)

**문제**: `apps/web/app/api/_lib/rate-limit.ts` 의 `checkSimpleRateLimit` 은 in-memory `Map`. Vercel 람다 인스턴스마다 분리됨 → 우회 가능.

**선택지:**
- **Upstash Redis** (권장): `@upstash/redis` + `Ratelimit.slidingWindow(10, "60 s")`. 빠른 setup, 무료 tier 있음.
- **Supabase** (추가 비용 0): `rate_limit_buckets` 테이블 + 트랜잭션. ~10ms latency 추가.

**진행 방법:**
1. `_lib/rate-limit.ts` 의 `checkSimpleRateLimit(userId, limit, windowSec)` 시그니처 유지
2. 내부만 교체 → 모든 호출자 무변경
3. Upstash 선택 시: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` env var 필요

---

## ✅ 유지해야 할 결정·컨벤션

### 코드 패턴
1. **모든 날짜 계산은 `getKstDate(date)` 사용** — `apps/web/app/lib/utils/business-day.ts`
2. **API 라우트는 `requireApiUser` 또는 `requireApiUserAllowAnon` + `checkSimpleRateLimit` 필수**
3. **AI 라우트는 `maxDuration` 명시** (30~120s)
4. **Webhook 라우트는 HMAC 검증 필수** (Task 1 완료 — 환경변수 설정 필요)
5. **`silent .catch(() => {})` 금지** — 최소 `console.error(err)` 로깅
6. **React Hooks는 컴포넌트 상단에 모두 호출** — early return은 hook 뒤
7. **외부 URL fetch 시 `isPrivateOrLoopback()` 차단**
8. **로그인/로그아웃 모두 `window.location.assign()` hard reload** (useSelectionHandlers + auth/page.tsx)

### 2026년 법령 수치 (변경 금지 — 모두 검증 완료)
- 최저시급: 10,320원
- 국민연금: 9.5% (각 4.75%)
- 건강보험: 7.19% (각 3.595%)
- 장기요양: 임금의 0.9448% (각 0.4724%)
- 고용보험 실업급여: 1.8% (각 0.9%) + 사업주 추가 0.25%
- 산재보험 (음식점): 0.8%
- 법인세: 10·20·22·25% (2026.1 인상)
- 간이과세 기준: 1억 400만원
- 폐업률 2024: 자영업 10.8% (음식 19.4%, 소매 20.8%)
- 청약철회: 전자상거래법 §17 7일
- 현금영수증 미발급: 거래액 20% 가산세 (소득세법 §162의3)
- 영업신고 미신고: 식품위생법 §97 3년↓ 징역/3천만원↓ 벌금
- TIPS: 총 8억 (R&D 5억 + 사업화 3억)
- 스마트스토어: 1.98~3.63% (2025.10 인하)
- 쿠팡 마켓플레이스: 4~10.8% (카테고리별)

### Vercel 배포 URL (변경 시 통일)
- 현재: `https://build-up-gamma.vercel.app`
- 향후: `https://buildup.kr` (DNS A 레코드 연결 후)
- iOS `Config/Build.xcconfig` 의 `WEB_APP_URL` + `MarketingRepository`/`FundingRepository` default baseURL 동기 변경

### 환경변수 추가 필요 (미설정)
- `PORTONE_WEBHOOK_SECRET` — PortOne 대시보드 Webhook 설정에서 복사
- `TOSS_WEBHOOK_SECRET` — Toss Payments 대시보드에서 복사

---

## 🚀 빠른 시작 (다음 세션 첫 명령)

```bash
# 현재 상태 확인
cd "/Users/lij020218/New project"
git status

# Web typecheck (현재 0 errors)
cd apps/web && npx tsc --noEmit -p tsconfig.json

# 남은 UTC 카운트 확인 (0이어야 함)
grep -rn "toISOString().slice(0, 10)\|toISOString().slice(0,10)" \
  apps/web/app/lib --include="*.ts" --include="*.tsx" | grep -v node_modules | wc -l
```

---

## 📞 핵심 컨택 (사용자 정보)

- 도메인: buildup.kr (등록인 본인, DNS 미연결)
- Vercel 프로젝트: build-up-gamma.vercel.app
- Supabase: gwnwgzeweofsxxftwjcl.supabase.co
- 이메일: lki720412@gmail.com
