# build.up 세션 핸드오프 — 2026-04-08

## 프로젝트 요약
build.up은 한국 소상공인/예비 창업자를 위한 AI 경영 파트너 플랫폼이다.
Next.js 15 + TypeScript + Supabase + Claude AI 기반 모노레포. 12개 업종 지원.

## 마스터 플랜 위치
`/outputs/master-design-v2.md` — Phase 0~7 전체 설계
`.claude/plans/curious-meandering-tide.md` — 상세 플랜 파일

## 완료된 작업

### Phase 0: 안전망 ✅
- `.github/workflows/ci.yml` — PR마다 lint/typecheck/build/test 자동 실행
- `turbo.json` — ANTHROPIC_API_KEY/OPENAI_API_KEY를 globalEnv에서 제거
- `apps/web/app/api/_lib/env.ts` — readFileSync 보안 취약점 제거, process.env만 사용
- Sentry: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`, `instrumentation-client.ts` 생성. `error.tsx`와 `observability.ts`에 Sentry 연동
- `next.config.ts`에 `withSentryConfig` 래핑
- `vitest.config.ts` + `packages/shared/src/__tests__/currency.test.ts` 첫 테스트

### Phase 2: 데이터 무결성 ✅
- `packages/shared/src/knowledge/franchise-benchmarks.ts` — beauty/fitness/education/pet/living-service/space 13개 브랜드 추가 (기존 food/cafe만 → 전 카테고리)
- `packages/shared/src/knowledge/success-case-studies.ts` — applicableTo에서 `"all"` 13건 전부 제거 → 구체적 카테고리로 교체
- `packages/shared/src/constants/benchmarks.ts` 신규 — LEGAL(최저임금, 세율), COST_RATIOS, HEALTH_THRESHOLDS, STARTUP_COSTS 중앙 상수

### Phase 3: AI 품질 ✅
- AI 타임아웃: 9개 모듈 전부 적용 (`timeout: 30_000`, roadmap만 `60_000`)
  - `packages/ai/src/` 내 dashboard/actions, market/interpret, finance/interpret, stage/brief, contract/analyze, health/diagnose, guide/interpret, programs/match, roadmap/generate
- 프롬프트 인젝션 방어: 사용자 입력을 `<user_input>` 태그로 격리
  - `roadmap/prompt.ts`: ideaText, storeName, region
  - `contract/prompt.ts`: contractText
  - `guide/prompt.ts`: question
  - `products/parse/route.ts`: text
- `packages/ai/src/dashboard/prompt.ts` — todayActions/crisisActions에 confidence 필드 추가
- `packages/ai/src/utils/parse-json.ts` 신규 — `parseAiJsonResponse<T>(raw, zodSchema)` 공통 유틸
- `apps/web/app/lib/components/AiDisclaimer.tsx` 신규 — 면책 고지 컴포넌트

### Phase 4: 버그 수정 ✅
- `apps/web/app/lib/helpers.ts` — `parseKoreanCurrency` 신규 ("1억", "5천만" 등 정확 파싱). 기존 `parseManwonInput`은 deprecated alias
- `apps/web/app/lib/components/ExistingBusinessOnboarding.tsx` (84행) — 인라인 parseManwon도 수정
- `apps/web/app/lib/components/AIRoadmapWizard.tsx` (305행) — `||` → `??` (totalBudget=0 버그)
- `apps/web/app/lib/components/AIRoadmapWizard.tsx` (79-83행) — 에러 시 `setGenProgress(0)` + 입력 보존
- `packages/ai/src/roadmap/generate.ts` — silent fallback("food") 제거 → `_needsCategoryConfirm` 플래그

### Phase 6: 인프라 (부분) ✅
- `apps/web/app/api/ai/products/parse/route.ts` — 인증 필수화 + console.log 사용자 데이터 노출 제거
- `apps/web/next.config.ts` — `reactStrictMode: true` 활성화
- Rate Limiter → Upstash Redis는 **스킵** (출시 전 불필요 판단)

### Phase 1: 아키텍처 (진행 중) 🔶
6개 Zustand 스토어 파일 작성 완료:
- `apps/web/app/lib/stores/operations-store.ts` — 45 states (재고/직원/고정비/배달/상품/회원)
- `apps/web/app/lib/stores/finance-store.ts` — 22 states (매출/비용/시뮬레이션)
- `apps/web/app/lib/stores/ai-store.ts` — 20 states (계약서/가이드QA/AI코치)
- `apps/web/app/lib/stores/profile-store.ts` — 17 states (업종/예산/지역/프로필)
- `apps/web/app/lib/stores/roadmap-store.ts` — 25 states (단계/결정/태스크/벤더)
- `apps/web/app/lib/stores/onboarding-store.ts` — 17 states (온보딩/인증/UI)
- `apps/web/app/lib/stores/index.ts` — 통합 export
- `apps/web/app/lib/stores/ARCHITECTURE.md` — 설계 문서

## 다음에 해야 할 작업 (순서대로)

### 1. Phase 1-1g: useDashboard.ts에서 Zustand 스토어 연결
**이것이 가장 중요하고 가장 위험한 작업이다.**

현재 상태:
- `apps/web/app/lib/useDashboard.ts` (3,226줄, useState 158개)가 모든 상태를 관리
- 6개 Zustand 스토어 파일은 작성되었지만, useDashboard.ts와 아직 연결되지 않음
- `apps/web/app/starter-stage-demo.tsx` (11,866줄)가 useDashboard를 호출하고 `d` 객체로 모든 값을 받음

해야 할 일:
- useDashboard.ts에서 useState 호출을 Zustand 스토어 호출로 교체
- 기존 localStorage 직접 읽기를 Zustand persist로 대체
- useDashboard가 반환하는 객체의 시그니처는 변경하지 않아야 함 (하위 호환)
- starter-stage-demo.tsx와 모든 하위 컴포넌트가 깨지지 않아야 함

주의사항:
- useDashboard.ts 내 useEffect들이 상태를 읽고 쓰는 패턴을 반드시 파악한 후 교체
- flushStoreData() (428행)의 stale closure 문제 — Zustand subscribe로 대체
- connectAndLoad() 함수가 Supabase에서 데이터를 로드해 여러 state를 세팅하는 로직

### 2. Phase 1-2: starter-stage-demo.tsx 분해 (11,866줄 → 8개 View)
Phase 1-1g 이후에 진행. View별 분리:
- HomeView, CurrentStageView, RoadmapView, GuidesView
- FranchiseView, ProfileView, AnalyticsView, OnboardingFlow

### 3. Phase 1-3: 에러 바운더리 3단계
- App Root (기존) + Surface별 error.tsx + AI 카드별 ErrorBoundary

### 4. Phase 5: UX 폴리시
- 스켈레톤/로딩 통일, 반응형, 접근성

### 5. Phase 7: 테스트 작성
- 핵심 단위 테스트, AI 파싱 테스트, 12카테고리 통합, E2E

## 핵심 파일 참조

| 파일 | 역할 | 줄 수 |
|------|------|-------|
| `apps/web/app/lib/useDashboard.ts` | 전체 상태 관리 (리팩토링 대상) | 3,226 |
| `apps/web/app/starter-stage-demo.tsx` | 메인 UI (분해 대상) | 11,866 |
| `apps/web/app/lib/stores/` | 새 Zustand 스토어 6개 | ~1,200 |
| `apps/web/app/lib/contexts/DashboardContext.tsx` | Context Provider | ~50 |
| `apps/web/app/lib/types.ts` | 공유 타입 | ~60 |
| `apps/web/app/lib/helpers.ts` | 유틸 함수 | ~760 |
| `apps/web/app/lib/constants.ts` | 상수/라우트 | ~120 |
| `packages/ai/src/` | AI 모듈 9개 | ~2,000 |
| `packages/shared/src/` | 공유 로직/데이터 | ~15,000 |

## git 참고
- git lock 문제가 자주 발생함 — `rm -f ".git/index.lock"` 후 재시도
- 커밋 스타일: 한국어 본문 + `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`
