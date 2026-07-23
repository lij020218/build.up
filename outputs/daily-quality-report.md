# build.up — 코드 품질 감사 리포트

**날짜:** 2026-07-23
**대상:** build.up 모노레포 (`apps/web`, `apps/mobile`, `apps/ios`, `packages/*`)
**분석 범위:** 844개 TS/TSX 파일 (node_modules · .next · `.claude/worktrees` 제외)
**직전 리포트:** 2026-07-22 (등급 C+)

---

## 종합 등급: **C+** (직전과 동일)

코드 위생(console.log·`any`·TODO·`@ts-ignore`)은 여전히 **A급**이고, 어제 등급을 끌어내렸던 **결정적 코드 결함(`dev-dense-preview` Suspense 프리렌더 오류)은 제거됐다** — 명백한 개선이다. 그럼에도 등급을 올리지 못한 이유는 단 하나: **이번 세션에서 클린 프로덕션 빌드를 3회 시도해 3회 모두 실패**했기 때문이다. 다만 실패의 성격이 어제와 완전히 다르다 — 앱 코드는 매번 정상 컴파일되고(3/3 `✓ Compiled successfully`), 3회차에는 139개 정적 페이지가 전부 생성됐다. 실패 지점은 컴파일 이후 후처리 단계에서 발생한 **Next.js 내부 파일 관련 파일시스템 ENOENT 3종**으로, 매 실행마다 다른 에러다. 이는 앱 코드 결함이 아니라 **툴체인/FS 경합**의 징후다.

| 항목 | 결과 | 평가 | 직전 대비 |
|------|------|------|-----------|
| 빌드 상태 | 🔴 **미완료** (컴파일 OK·139페이지 생성 OK, 후처리 FS ENOENT로 exit 1 × 3/3) | 🔴 D+ | → (성격 개선, 결과 동일) |
| 파일 크기 (>500줄) | 114개 (>1000줄 34개, 최대 6,056줄) | ⚠️ C+ | → |
| console.log (프로덕션) | 26건 — 대부분 서버 API, 클라이언트 컴포넌트 ~0건 | ✅ A | ↑ (29→26) |
| TODO/FIXME/HACK | 2건 (둘 다 실부채 아님 — 아래 §3) | ✅ A+ | → |
| 타입 안전성 (`any`) | 3건 · `@ts-ignore`/`@ts-nocheck` **0건** | ✅ A+ | → |
| 번들 크기 (First Load JS) | **미검증** — 빌드가 라우트 표까지 도달 못 함 | ⚪ N/A | ↓ (측정 불가) |
| Lint 경고 | 41건 (`exhaustive-deps` 39 + `no-img-element` 1 + 기타 1) | ⚠️ B− | → |

---

## 0. 빌드 상태 — 🔴 클린 빌드 미완료 (성격은 어제와 다름)

`rm -rf .next && npx next build`를 **3회 클린 실행**했다. 결과:

| 회차 | 컴파일 | 정적 생성 | 실패 지점 (Next 내부 파일) |
|------|--------|-----------|----------------------------|
| 1 | ✓ (47s) | 도달 못 함 | `PageNotFoundError: /_document` + `pages-manifest.json` ENOENT (Collecting page data) |
| 2 | ✓ (53s) | 도달 못 함 | `rename .next/export/500.html → .next/server/pages/500.html` ENOENT |
| 3 | ✓ (32s) | **✓ 139/139 생성 완료** | `_not-found/page.js.nft.json` ENOENT (trace collection) |

**핵심:** 세 번 모두 **앱 코드는 정상 컴파일**됐고, 3회차는 **139개 페이지 정적 생성까지 성공**한 뒤 파일 추적(nft.json) 단계에서 터졌다. 실패한 파일은 전부 **Next.js가 스스로 생성·이동하는 내부 산출물**(`_document`, `pages-manifest.json`, `500.html`, `_not-found/*.nft.json`)이며, **매 실행마다 실패 파일이 다르다.** 이 비결정성이 결정적 단서다 — 특정 소스 파일의 결함이라면 매번 같은 곳에서 같은 에러가 나야 한다.

**가장 유력한 원인 (반박 검토 포함):**
- `next.config.ts`가 `withSentryConfig(...)`로 감싸져 있다. Sentry Next 플러그인은 빌드 후처리 단계에서 `.next` 산출물을 소스맵 업로드·파일추적 목적으로 조작한다 — 이것이 Next 자체의 출력과 경합하면 정확히 이런 후처리 ENOENT 패턴이 난다.
- 같은 `next.config.ts`에 이미 *"dev에서 filesystem 캐시 완전 비활성화 — vendor-chunks ENOENT 방지"* 주석이 있다. **이 환경은 과거에도 FS ENOENT 경합과 싸운 이력**이 있다는 뜻이다.
- 반박: 이게 정말 앱 코드 문제일 가능성? — 낮다. 코드 결함이라면 컴파일 또는 특정 페이지 생성에서 결정적으로 실패해야 하는데, 139/139 생성을 통과했고 실패 파일이 매번 바뀐다.

**배포 위험도:** 이 실패는 **로컬 환경 특정 가능성이 높다.** Vercel 같은 클린 리눅스 컨테이너 + `CI=true`(Sentry 동작이 달라짐) 환경에서는 재현 안 될 수 있다. 다만 **이번 세션에서 그것을 검증하지는 못했다** — Vercel 최근 배포 로그 확인이 다음 조치다.

> 검증(이번 실행): 상단 3회 빌드는 실제 실행 결과다. 어제 빌드를 깨뜨린 `dev-dense-preview/`는 **삭제 확인**(GONE)했다. 오늘 새로 발견된 임시 페이지 `dev-invops-preview/`(§6)를 임시 제외하고도 빌드는 동일하게 실패 — **이 디렉터리는 오늘 빌드 실패의 원인이 아니다.**

---

## 1. 파일 크기 감사 — ⚠️ C+

500줄 초과 **114개**, 1,000줄 초과 **34개**. 직전과 사실상 동일 — 리팩토링 진전 없음.

**데이터 파일 (순수 상수 — 분리 우선순위 낮음):**
| 파일 | 줄 수 |
|------|------|
| [packages/shared/src/starter-data.ts](packages/shared/src/starter-data.ts) | 3,043 |
| [franchise-interior-data.ts](apps/web/app/lib/components/stages/offline/franchise-interior-data.ts) | 2,963 |
| [vendor-setup-data.ts](apps/web/app/lib/components/stages/offline/vendor-setup-data.ts) | 2,719 |
| [packages/shared/src/startup-programs.ts](packages/shared/src/startup-programs.ts) | 2,530 |
| [k-hit-cases.ts](packages/shared/src/knowledge/k-hit-cases.ts) | 2,187 |
| [store-info-schema.ts](apps/web/app/lib/data/store-info-schema.ts) | 2,088 |

**로직 파일 (리팩토링 우선순위 높음):**
| 파일 | 줄 수 |
|------|------|
| [apps/mobile/app/dashboard-screen.tsx](apps/mobile/app/dashboard-screen.tsx) | **6,056** 🔴 |
| [OperationsSetupStage.tsx](apps/web/app/lib/components/stages/offline/OperationsSetupStage.tsx) | 1,847 |
| [PreLaunchFinalStage.tsx](apps/web/app/lib/components/stages/shared-tail/PreLaunchFinalStage.tsx) | 1,842 |
| [GuidesView.tsx](apps/web/app/lib/components/surfaces/GuidesView.tsx) | 1,718 |
| [usePersistence.ts](apps/web/app/lib/hooks/usePersistence.ts) | 1,628 |
| [CEOMorningHero.tsx](apps/web/app/lib/components/dashboard/CEOMorningHero.tsx) | 1,522 |
| [CashflowSetupSheet.tsx](apps/web/app/lib/components/dashboard/CashflowSetupSheet.tsx) | 1,453 |
| [AIRoadmapWizard.tsx](apps/web/app/lib/components/AIRoadmapWizard.tsx) | 1,347 |

## 2. console.log 감사 — ✅ A

프로덕션 코드(worktree·테스트·`scripts/` 제외) **26건**. 분포:
- [api/ai/roadmap/generate/route.ts](apps/web/app/api/ai/roadmap/generate/route.ts) — **14건** (풀 조회·fallback 진단, 서버사이드)
- `packages/ai/src/roadmap/*` — 3건 (파싱 fallback, 서버)
- API 라우트 5개 각 1건 · [usePersistence.ts](apps/web/app/lib/hooks/usePersistence.ts) 1건은 **주석 문자열**(오탐)

**`apps/web/app/lib` 클라이언트 컴포넌트 실제 호출 ~0건.** 브라우저 번들에 로그가 새지 않는다. 조치 불필요.

## 3. TODO / FIXME / HACK — ✅ A+

전체 코드베이스에서 **2건, 둘 다 실제 부채 아님**:
- [apps/web/middleware.ts:36](apps/web/middleware.ts#L36) — `TODO (post-launch P1): nonce 기반 CSP 마이그레이션` (의도적 post-launch 항목)
- [api/ai/business-plan/generate/route.ts:159](apps/web/app/api/ai/business-plan/generate/route.ts#L159) — AI 프롬프트 **문자열 내부**의 `"[TODO: verify via Statistics Korea]"` — 통계 조작 방지용 지침 텍스트. 코드 TODO 아님(오탐).

FIXME · HACK · XXX 0건. 844개 파일 규모에서 이례적으로 깨끗하다.

## 4. 타입 안전성 — ✅ A+

명시적 `any` **3건**:
- [kakao-maps.d.ts](apps/web/app/lib/types/kakao-maps.d.ts) — 2건 (외부 Kakao Maps SDK 타입 부재, 불가피)
- [useFunnelMetrics.ts](apps/web/app/lib/hooks/useFunnelMetrics.ts) — 1건 (`as any` 캐스팅)

`@ts-ignore` · `@ts-expect-error` · `@ts-nocheck` **0건**. 타입 우회 전무.

## 5. 번들 크기 — ⚪ 미검증

빌드가 라우트 표(First Load JS 출력) 단계까지 도달하지 못해 **이번 사이클은 측정 불가**. 직전 리포트의 2.31 MB 수치는 재확인되지 않았다. §0 빌드 후처리 문제가 해소되면 다음 사이클에서 재측정.

## 6. 🟠 신규 발견 — 임시 미리보기 페이지 재발 (프로세스 스멜)

어제 빌드를 깨뜨린 `dev-dense-preview/`는 삭제됐지만, **똑같은 안티패턴이 다시 나타났다**:
- [apps/web/app/dev-invops-preview/page.tsx](apps/web/app/dev-invops-preview/page.tsx) — git 미추적, 파일 헤더에 *"메뉴 추가 흐름 검증 … 검증 후 삭제"* 명시.

오늘은 이 파일이 빌드 실패의 원인은 **아니다**(제외해도 동일 실패). 하지만 `app/` 라우트 트리에 임시 검증 페이지를 만드는 패턴이 **이틀 연속 반복**됐다 — 어제는 이런 파일이 실제로 빌드를 깼다. 함께 미추적으로 남은 변경: `InventoryOpsCard.tsx`, `useOperationsHandlers.ts` 수정.

---

## Top 5 실행 권고

### 1. 🔴 프로덕션 빌드 후처리 실패 규명 — Sentry 플러그인 격리 (최우선)
로컬 `next build`가 3/3 실패(컴파일·페이지생성은 성공, 후처리 FS ENOENT). **먼저 Vercel 최근 배포 로그를 확인**해 원격 빌드가 정상인지부터 판정할 것 — 정상이면 로컬 한정 문제로 강등. 그다음 로컬 재현: `SENTRY_ORG`/`SENTRY_PROJECT` 환경변수를 비운 채(=Sentry 업로드 비활성) `next build`를 돌려 성공하면 원인이 `withSentryConfig` 후처리로 확정된다. 확정 시 `sentryWebpackPluginOptions`에 로컬 빌드 시 소스맵 업로드/파일추적 비활성 조건을 추가. **번들 수치 재측정이 여기에 막혀 있음.**

### 2. 🟠 `app/` 트리에 임시 검증 페이지 만드는 습관 차단 — CI/훅 가드
이틀 연속 `dev-*-preview/` 임시 페이지가 등장했고, 어제는 그것이 빌드를 깼다. 검증용 페이지는 (a) `app/` 밖 Storybook/독립 스크립트로 빼거나, (b) `app/**/dev-*` 경로를 `.gitignore`에 등록하고 `git add` 시 pre-commit 훅으로 경고. `dev-invops-preview/` 검증 끝났으면 오늘 삭제.

### 3. 🟠 `useMorningBriefingBrain.ts` exhaustive-deps 14건 정리
39개 `exhaustive-deps` 경고 중 **최대 클러스터**. `entries`(9건)·`costs`(5건)가 매 렌더 새 참조가 되어 아래 `useMemo` 다수가 전부 무효화된다. 아침 브리핑은 매일 첫 화면이라 체감 성능 직결 — 두 값을 각각 `useMemo`로 감싸면 대부분 해소. 다음 대상: `GuidesView.tsx`(dailyEntries 4건), `SalesBreakdownCard.tsx`.

### 4. 🟠 상수 데이터 파일 클라이언트 번들 분리 (번들 재측정 후 착수)
`starter-data.ts`(3,043)·`startup-programs.ts`(2,530)·`k-hit-cases.ts`(2,187)·`success-case-studies.ts`(1,784)·`logistics-platforms.ts`(1,674) — 합계 1.1만 줄 정적 상수. `next/dynamic` 코드 스플릿 또는 `public/*.json` 지연 fetch로 이관. **단, §0·권고1로 번들 실측이 복구된 뒤** `@next/bundle-analyzer`로 실제 기여도부터 확인하고 착수.

### 5. 🟡 `apps/mobile/app/dashboard-screen.tsx` (6,056줄) 상태 명시
웹 우선 출시 전략상 mobile이 동결이라면 README에 **명시적 동결 표기**, 활성이라면 웹 `dashboard/` 분리 패턴 적용. 애매한 방치가 최악.

---

## 검증 노트

- 파일 수 · `any` · TODO · console.log 수치는 이 세션에서 직접 실행한 `find`/`grep` 결과다.
- 빌드 3회는 모두 `rm -rf .next && npx next build`로 실제 실행했고, 컴파일 성공·후처리 ENOENT 실패·매회 다른 실패 파일을 로그로 확인했다. 근본 원인(Sentry 후처리 경합)은 **정황 근거 기반 유력 가설이며 격리 실험으로 확정하지 않았다** — 권고 1이 그 확정 절차다.
- **번들 크기는 이번 사이클 미측정** — 빌드가 라우트 표에 도달하지 못했다.
- 어제 빌드를 깬 `dev-dense-preview/` 삭제, 신규 `dev-invops-preview/` 등장을 git status로 확인.
- `apps/ios`(Swift) · `apps/mobile`(Expo) 빌드는 이번 감사에서 실행하지 않음 — **미검증**.
- 빌드 로그에 `[resolveNextStageIds] … nextStageConditions 매칭 실패` 경고(`budget-setup`, `biz-registration`)가 반복 출력 — 빌드 자체는 진행되나 stage 라우팅 SSOT 잠재 이슈로 별도 조사 대상(직전 리포트에서도 지적).
