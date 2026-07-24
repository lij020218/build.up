# build.up — 코드 품질 감사 리포트

**날짜:** 2026-07-24
**대상:** build.up 모노레포 (`apps/web`, `apps/mobile`, `apps/ios`, `packages/*`)
**분석 범위:** 845개 TS/TSX 파일 (node_modules · .next · `.claude/worktrees` 제외)
**직전 리포트:** 2026-07-23 (등급 C+)

---

## 종합 등급: **B-** (직전 C+ → 상승)

이번 사이클의 핵심 사건은 하나다: **3사이클 연속 실패하던 클린 프로덕션 빌드가 완주했다.** `rm -rf .next && npx next build`가 컴파일(9.6s)·정적 생성·빌드 트레이스·라우트 표 출력까지 전부 통과하고 `BUILD_ID`(`wCcSqqW83duOkra3Dslgp`)를 남겼다. 직전 3사이클 등급을 C+에 묶어 둔 단일 원인(후처리 FS ENOENT)이 이번엔 재현되지 않았다 — 명백한 진전이다.

그런데 빌드가 완주하면서 그동안 "측정 불가(N/A)"였던 항목이 처음으로 드러났다: **번들 크기다. 결과가 좋지 않다.** 사용자가 매일 쓰는 9개 핵심 화면(`/current`·`/roadmap`·`/tax`·`/team`·`/profile`·`/reports`·`/guides`·`/franchise`·`/marketing`)이 **전부 First Load JS 2.32 MB**로 나온다. 권장 예산(~250 kB)의 약 **9~10배**다. 이건 어제 대비 악화가 아니라 **처음으로 계측된 기존 부채**다 — 하지만 실사용자 LCP/TTI에 직접 영향을 주므로 등급 상한을 눌렀다.

코드 위생(console.log·`any`·TODO·타입 suppression)은 이번에도 **A급**을 유지했다. 종합하면: 빌드 회복이 C+ → B로 끌어올렸고, 새로 계측된 2.32 MB 번들이 B+ 이상을 막았다 → **B-**.

| 항목 | 결과 | 평가 | 직전 대비 |
|------|------|------|-----------|
| 빌드 상태 | 🟢 **완주** (컴파일 9.6s · 라우트 표 생성 · `BUILD_ID` 존재) | 🟢 A | ↑↑ (D+ → A) |
| 번들 크기 (First Load JS) | 🔴 핵심 9개 화면 **2.32 MB** (권장 ~250 kB의 9~10배) | 🔴 D | ↓ (측정 가능해짐 → 문제 노출) |
| 파일 크기 (>500줄) | 115개 (>1000줄 34개, 최대 6,056줄) | ⚠️ C+ | → |
| console.log (프로덕션) | 29건 — 대부분 서버 API, 클라이언트 컴포넌트 ~0건 | ✅ A | → (26→29) |
| TODO/FIXME/HACK | 1건 (실부채 아님 — §5) | ✅ A+ | ↑ (2→1) |
| 타입 안전성 (`any`) | 소스 ~3건 · `@ts-ignore`/`@ts-nocheck`/`@ts-expect-error` **0건** | ✅ A+ | → |
| Lint 경고 | 43건 (`exhaustive-deps` 39 + `no-img-element` 1 + Sentry deprecation 2) | ⚠️ B− | → |

---

## 0. 빌드 상태 — 🟢 클린 빌드 완주 (3사이클 만의 회복)

```
✓ Compiled successfully in 9.6s
  Linting and checking validity of types ...
  Collecting page data / Generating static pages / Collecting build traces  → 통과
  Route (app) 표 전체 출력 완료 · BUILD_ID = wCcSqqW83duOkra3Dslgp
```

직전 3사이클을 깨뜨렸던 후처리 FS ENOENT(`_document`·`pages-manifest.json`·`500.html`·`*.nft.json`)는 이번 실행에서 **재현되지 않았다.** 직전 리포트가 예측한 대로 그 실패는 앱 코드 결함이 아니라 로컬 툴체인/FS 경합이었고, 이번엔 경합이 발생하지 않은 것으로 보인다.

> **반박 검토:** "빌드가 한 번 통과했다고 안정적이라 단정할 수 있나?" — 못 한다. 실패가 비결정적이었던 만큼 성공도 비결정적일 수 있다. 다만 이번 실행에서 **컴파일·정적 생성·트레이스 수집·라우트 표까지 실제로 완주한 것은 검증된 사실**이다. 안정성 확증에는 CI(리눅스 컨테이너 + `CI=true`)에서의 반복 성공 확인이 필요하다.

⚠️ 부수 경고 2건 (Sentry, 기능 영향 없음 · 마감 전 정리 권장):
- `disableLogger` deprecated → `webpack.treeshake.removeDebugLogging`로 이관 권장
- `sentry.client.config.ts` → `instrumentation-client.ts`로 이관 권장 (Turbopack 대비)

---

## 1. 번들 크기 — 🔴 핵심 화면 2.32 MB (이번 사이클 최대 이슈)

빌드가 완주하며 라우트 표가 처음으로 나왔다. **페이지 고유 JS는 작지만(321~323 B) First Load JS가 2.32 MB** — 즉 공유/지연 청크 하나가 모든 핵심 화면에 통째로 딸려온다.

| 라우트 | Page JS | **First Load JS** |
|--------|---------|-------------------|
| `/current` | 321 B | 🔴 **2.32 MB** |
| `/roadmap` | 322 B | 🔴 **2.32 MB** |
| `/tax` | 322 B | 🔴 **2.32 MB** |
| `/team` | 321 B | 🔴 **2.32 MB** |
| `/profile` | 322 B | 🔴 **2.32 MB** |
| `/reports` | 323 B | 🔴 **2.32 MB** |
| `/guides` | 322 B | 🔴 **2.32 MB** |
| `/franchise` | 322 B | 🔴 **2.32 MB** |
| `/marketing` | 322 B | 🔴 **2.32 MB** |
| `/auth` | 24 kB | 🟠 1.17 MB |
| `/guide/[guideId]` | 6.08 kB | 🟠 1.16 MB |
| `+ First Load JS shared by all` | — | 🟢 **180 kB** (정상) |

공유 청크(180 kB)는 건강하다. 문제는 **정적 청크 디렉터리의 두 거대 파일**이다:

```
3.8 MB  .next/static/chunks/6135-dae7b06491ca6ea0.js
3.7 MB  .next/static/chunks/6691-d9bf34679b4a8995.js
```

이 7.5 MB(비압축)가 9개 화면의 2.32 MB First Load를 만든다. 원인은 **화면 컴포넌트가 모든 스테이지 데이터/뷰를 정적 import로 끌어오는 배럴 구조**로 강하게 의심된다 — §2의 초대형 데이터 파일들(`franchise-interior-data` 2,963줄, `vendor-setup-data` 2,719줄, `sub-industry-interior-data` 2,100줄 등)이 스테이지 전환과 무관하게 초기 번들에 전부 포함되는 경로. `next/dynamic` 지연 로딩과 데이터 파일 코드 스플리팅으로 해결 가능하다.

> **검증:** 위 라우트 표와 청크 크기는 이번 실행의 실제 빌드 산출물이다. "2.32 MB가 곧 사용자에게 전송되는 gzip 크기"는 아니다 — Next 표기는 비압축 parse 기준이며 gzip 후엔 대략 1/3~1/4일 수 있다. 그래도 gzip 기준 ~600 kB+는 여전히 권장 예산의 2~3배로, 저사양·모바일에서 체감 지연이 크다.

---

## 2. 파일 크기 감사 — ⚠️ C+ (변동 없음)

500줄 초과 **115개**, 1,000줄 초과 **34개**. 직전과 사실상 동일 — 리팩토링 진전 없음. §1 번들 문제와 직결되는 항목이다.

**데이터 파일 (순수 상수 — 코드 스플리팅 우선순위 ↑, 번들 원인):**
| 파일 | 줄 수 |
|------|------|
| [packages/shared/src/starter-data.ts](packages/shared/src/starter-data.ts) | 3,043 |
| [franchise-interior-data.ts](apps/web/app/lib/components/stages/offline/franchise-interior-data.ts) | 2,963 |
| [vendor-setup-data.ts](apps/web/app/lib/components/stages/offline/vendor-setup-data.ts) | 2,719 |
| [packages/shared/src/startup-programs.ts](packages/shared/src/startup-programs.ts) | 2,530 |
| [k-hit-cases.ts](packages/shared/src/knowledge/k-hit-cases.ts) | 2,187 |
| [sub-industry-interior-data.ts](apps/web/app/lib/components/stages/offline/sub-industry-interior-data.ts) | 2,100 |
| [store-info-schema.ts](apps/web/app/lib/data/store-info-schema.ts) | 2,088 |

**컴포넌트 파일 (분리 우선순위 ↑ — 로직 포함):**
| 파일 | 줄 수 |
|------|------|
| [apps/mobile/app/dashboard-screen.tsx](apps/mobile/app/dashboard-screen.tsx) | 6,056 |
| [OperationsSetupStage.tsx](apps/web/app/lib/components/stages/offline/OperationsSetupStage.tsx) | 1,847 |
| [PreLaunchFinalStage.tsx](apps/web/app/lib/components/stages/shared-tail/PreLaunchFinalStage.tsx) | 1,842 |
| [GuidesView.tsx](apps/web/app/lib/components/surfaces/GuidesView.tsx) | 1,718 |
| [usePersistence.ts](apps/web/app/lib/hooks/usePersistence.ts) | 1,628 |
| [CEOMorningHero.tsx](apps/web/app/lib/components/dashboard/CEOMorningHero.tsx) | 1,522 |
| [CashflowSetupSheet.tsx](apps/web/app/lib/components/dashboard/CashflowSetupSheet.tsx) | 1,453 |

---

## 3. console.log 감사 — ✅ A

프로덕션 코드 **29건**, 대부분 서버 사이드 API 라우트에 집중. 클라이언트 컴포넌트 노출은 사실상 0건.

| 파일 | 건수 |
|------|------|
| [api/ai/roadmap/generate/route.ts](apps/web/app/api/ai/roadmap/generate/route.ts) | 14 |
| [scripts/seed-insights/case-studies.ts](apps/web/scripts/seed-insights/case-studies.ts) | 4 (시드 스크립트) |
| 기타 API 라우트 (contractors·products·members·account 등) | 각 1 |

서버 라우트의 `console.log`는 관측성 목적이면 정상이나, 구조화 로거(`console.warn/error` 265건과 함께)로의 일원화를 권장. `api/ai/roadmap/generate`의 14건은 정리 우선순위가 가장 높다.

---

## 4. 타입 안전성 — ✅ A+

- 소스 코드 실제 `any` ~3건 (`useFunnelMetrics.ts`의 `supabase as any`, `persistence.ts`의 `Record<string, any>` 2건 — 모두 Supabase 동적 스키마 경계로 방어 가능)
- `@ts-ignore` / `@ts-nocheck` / `@ts-expect-error` **0건** (지속 유지 중 — 우수)
- 나머지 `any`는 `.d.ts`(kakao-maps 타입 선언)·`.next` 생성물로 소스 부채 아님

---

## 5. TODO/FIXME/HACK — ✅ A+

전체 **1건**, 실부채 아님:
- [apps/web/middleware.ts:36](apps/web/middleware.ts:36) — `TODO (post-launch P1): nonce 기반 CSP 마이그레이션` (출시 후 계획된 개선, 정상 마커)

FIXME·HACK·XXX 0건.

---

## 6. Lint — ⚠️ B−

총 **43건** 경고 (에러 0):
- `react-hooks/exhaustive-deps` **39건** — 대부분 `useMemo`/`useEffect` 의존성 배열에서 매 렌더 재생성되는 논리식(`entries`·`dailyEntries`·`costs`)을 콜백 내부 또는 자체 `useMemo`로 옮기라는 경고. 성능 미세 저하 + 잠재적 stale-closure 리스크.
- `@next/next/no-img-element` 1건 — `next/image` 미사용 (LCP·대역폭)
- Sentry deprecation 2건 (§0)

에러 없이 빌드를 통과하므로 배포 차단은 아니나, 39건의 exhaustive-deps는 §1 번들 문제와 별개로 렌더 성능에 누적 영향.

---

## Top 5 실행 권고

1. **🔴 [최우선] 핵심 9개 화면 2.32 MB First Load JS를 코드 스플리팅으로 절감.**
   `/current`·`/roadmap`·`/tax`·`/team` 등이 공유하는 두 거대 청크(3.8 MB + 3.7 MB)를 `next/dynamic`으로 지연 로딩하고, 스테이지 데이터 파일(`franchise-interior-data` 등)을 스테이지 진입 시점에만 로드되도록 동적 import로 전환. 목표: First Load JS < 500 kB. **사용자가 매일 쓰는 화면이므로 체감 개선 효과가 가장 크다.**

2. **🟢 [검증] 빌드 안정성을 CI에서 확증.**
   이번 로컬 완주는 고무적이나 과거 실패가 비결정적이었다. Vercel/CI(리눅스 + `CI=true`)에서 **연속 2~3회 성공**을 확인해 툴체인 경합이 재발하지 않음을 못박을 것. 성공 시 빌드 항목을 안정적 A로 확정.

3. **⚠️ [부채] 데이터 파일 코드 스플리팅 (권고 1과 시너지).**
   `starter-data.ts`(3,043줄)·`franchise-interior-data.ts`(2,963줄)·`vendor-setup-data.ts`(2,719줄) 등 순수 상수 파일을 산업/스테이지별 lazy chunk로 분리. 파일 크기(§2)와 번들 크기(§1)를 동시에 해소하는 단일 조치.

4. **⚠️ [위생] `api/ai/roadmap/generate/route.ts`의 console.log 14건 정리 + Sentry deprecation 2건 이관.**
   서버 로그를 구조화 로거로 일원화하고, `sentry.client.config.ts` → `instrumentation-client.ts`, `disableLogger` → `webpack.treeshake.removeDebugLogging`로 마이그레이션. 낮은 위험·짧은 작업.

5. **⚠️ [성능] exhaustive-deps 39건 중 논리식 재생성 패턴부터 수정.**
   `entries`·`dailyEntries`·`costs` 초기화를 각자의 `useMemo`로 감싸 매 렌더 의존성 변동을 제거. AnalyticsSurface·대시보드 카드 등 자주 렌더되는 컴포넌트 우선.

---

*자동 생성: daily-quality-report 스케줄 태스크 · 2026-07-24. 모든 수치는 이번 실행의 실제 빌드/grep 결과이며, 단정 못 하는 항목은 본문에 "반박 검토"로 명시함.*
