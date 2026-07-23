# build.up — 코드 품질 감사 리포트

**날짜:** 2026-07-10
**대상:** build.up 모노레포 (`apps/web`, `apps/mobile`, `apps/ios`, `packages/*`)
**분석 범위:** 892개 TS/TSX 파일 (node_modules · .next · worktree 제외)

---

## 종합 등급: **B**

코드 위생(console.log·`any`·TODO)은 **A급으로 탁월**하다. 반면 **번들 크기**와 **초대형 파일**이라는 두 가지 구조적 부채가 등급을 끌어내렸다. 출시 전 반드시 손봐야 할 항목은 번들뿐이며, 나머지는 점진적 개선으로 충분하다.

| 항목 | 결과 | 평가 |
|------|------|------|
| 파일 크기 (>500줄) | 115개 파일 (>1000줄 34개, 최대 6,056줄) | ⚠️ C+ |
| console.log (프로덕션) | 30건 — **클라이언트 컴포넌트 0건**, 전부 서버/스크립트 | ✅ A |
| TODO/FIXME/HACK | 실질 1건 (나머지 2건은 placeholder 오탐) | ✅ A+ |
| 타입 안전성 (`any`) | 실사용 3건 (kakao-maps 외부 SDK + supabase 캐스팅 1건) | ✅ A |
| 번들 크기 (First Load JS) | 핵심 라우트 **2.28 MB** | 🔴 C− |
| 빌드 상태 | 성공 · `exhaustive-deps` 경고 39건 | ⚠️ B− |

---

## 1. 파일 크기 감사

500줄 초과 **115개**, 1,000줄 초과 **34개**. 상당수는 정적 데이터 파일(로드맵·프랜차이즈·업종 데이터)로 로직 복잡도는 낮으나, **로직을 담은 대형 컴포넌트**가 리팩토링 우선순위다.

**데이터 파일 (분리 우선순위 낮음 — 순수 상수):**
| 파일 | 줄 수 |
|------|------|
| `packages/shared/src/starter-data.ts` | 3,043 |
| `apps/web/.../offline/franchise-interior-data.ts` | 2,963 |
| `apps/web/.../offline/vendor-setup-data.ts` | 2,719 |
| `packages/shared/src/startup-programs.ts` | 2,508 |
| `apps/web/app/lib/data/store-info-schema.ts` | 2,088 |

**로직 컴포넌트 (리팩토링 우선순위 높음):**
| 파일 | 줄 수 |
|------|------|
| `apps/mobile/app/dashboard-screen.tsx` | **6,056** 🔴 |
| `apps/web/.../offline/OperationsSetupStage.tsx` | 1,840 |
| `apps/web/.../surfaces/GuidesView.tsx` | 1,718 |
| `apps/web/.../shared-tail/PreLaunchFinalStage.tsx` | 1,694 |
| `apps/web/.../dashboard/CEOMorningHero.tsx` | 1,496 |
| `apps/web/.../dashboard/CashflowSetupSheet.tsx` | 1,453 |
| `apps/web/.../components/AIRoadmapWizard.tsx` | 1,347 |

> `apps/mobile/app/dashboard-screen.tsx` (6,056줄)는 단일 파일로 가장 큰 위험 지점. 단, mobile 앱이 현재 활성 개발 대상이 아니라면 우선순위는 낮출 수 있다.

## 2. console.log 감사 — ✅ 우수

프로덕션 코드 전체에서 30건. **`apps/web/app/lib` 클라이언트 컴포넌트에는 단 한 건도 없다.**
- API 라우트(서버 로깅): 6개 파일 — 의도된 서버사이드 로그로 허용 범위
- `scripts/`, `apps/web/scripts/`: 8건 — CLI 시딩 스크립트, 허용
- `packages/ai/src/roadmap/*`: 3건 — AI 파싱 fallback 진단 로그

클라이언트 번들에 로그가 새지 않는 것은 위생 관리가 잘 되어 있다는 강한 신호다. 별도 조치 불필요.

## 3. TODO / FIXME / HACK 스캔 — ✅ 우수

전체 3건 중 **2건은 오탐**(placeholder 문자열 `02-XXXX-XXXX`, UI 라벨 `XXX`). 실질 TODO는 1건:
- `apps/web/middleware.ts:36` — `TODO (post-launch P1): nonce 기반 CSP 마이그레이션` (계획된 후속 작업, 정상)

기술 부채 주석이 사실상 없다는 것은 미완성 코드를 방치하지 않았다는 뜻이다.

## 4. 타입 안전성 — ✅ 우수

실사용 `any` 3건뿐 (주석/worktree 제외):
- `apps/web/app/lib/types/kakao-maps.d.ts` — 외부 Kakao Maps SDK 타입 부재로 인한 불가피한 케이스 (주석에 부채 명시됨)
- `apps/web/app/lib/hooks/useFunnelMetrics.ts:110` — `(supabase as any)` 캐스팅 1건. 생성된 DB 타입으로 교체 가능.

892개 파일 규모에서 `any` 3건은 매우 엄격한 타입 규율이다.

## 5. 번들 크기 — 🔴 최우선 개선 대상

프로덕션 빌드 성공. 그러나 **핵심 앱 라우트 대부분이 First Load JS 2.28 MB**:

| 라우트 | Page | First Load JS |
|--------|------|---------------|
| `/`, `/current`, `/roadmap`, `/reports` | 323 B | **2.28 MB** |
| `/profile`, `/marketing`, `/franchise` | 323 B | **2.28 MB** |
| `/guides`, `/team`, `/analytics` | 323 B | **2.28 MB** |
| `/auth` | 21.2 kB | 1.16 MB |
| `/admin/*` | ~2 kB | 1.14 MB |
| 공유 청크 (모든 라우트) | — | 180 kB |

**진단:** 페이지 고유 청크는 323 B에 불과한데 First Load가 2.28 MB라는 것은, 거대한 클라이언트 컴포넌트 트리가 **여러 라우트에 공통으로 즉시 로드**되고 있다는 뜻이다. 코드 스플리팅/lazy import가 되지 않아, 사용자가 어느 페이지를 열든 전체 앱 번들을 내려받는다. 권장 예산(모바일 초기 로드 ~300 kB gzip)의 수 배 수준으로, 저사양/저속망 환경 초기 진입 이탈의 직접 원인이 될 수 있다.

**빌드 경고:** `react-hooks/exhaustive-deps` 39건 (렌더마다 재계산·불필요 리렌더 유발 가능), Sentry deprecation 2건(`disableLogger`, `sentry.client.config.ts` → `instrumentation-client.ts` 이관 권고).

---

## Top 5 실행 권고 (우선순위순)

### 1. 🔴 번들 코드 스플리팅 — 2.28 MB → 목표 <600 kB
핵심 라우트가 공유하는 대형 컴포넌트(대시보드 서페이스, 스테이지 렌더러 등)를 `next/dynamic` lazy import로 분리하라. `@next/bundle-analyzer`로 2.28 MB 청크의 실제 구성부터 파악 → 차트/에디터/맵 등 무거운 의존성을 라우트별 지연 로드로 전환. **출시 전 필수.**

### 2. 🔴 `apps/mobile/app/dashboard-screen.tsx` (6,056줄) 분해
단일 파일 최대 위험 지점. 섹션/카드 단위 하위 컴포넌트로 분리. (단, mobile이 비활성 트랙이면 웹 우선 처리 후 후순위)

### 3. ⚠️ 1,000줄 초과 로직 컴포넌트 6종 리팩토링
`OperationsSetupStage`(1,840), `GuidesView`(1,718), `PreLaunchFinalStage`(1,694), `CEOMorningHero`(1,496), `CashflowSetupSheet`(1,453), `AIRoadmapWizard`(1,347). 하위 컴포넌트·커스텀 훅 추출로 500줄 이하 목표. #1 코드 스플리팅과 병행하면 번들 효과도 동반.

### 4. ⚠️ `exhaustive-deps` 경고 39건 정리
`useMemo`/`useEffect` 의존성 누락·불필요 의존성은 미묘한 스테일 상태 버그와 불필요 리렌더의 원인. `entries`·`costs`·`dailyEntries` 같은 논리식을 useMemo 콜백 안으로 이동. ESLint 경고를 CI에서 에러로 승격해 재발 방지.

### 5. ✅ 저비용 정리 — 남은 `any` 1건 + Sentry deprecation 2건
`useFunnelMetrics.ts:110`의 `(supabase as any)`를 생성 DB 타입으로 교체. Sentry `disableLogger` → `webpack.treeshake.removeDebugLogging`, `sentry.client.config.ts` → `instrumentation-client.ts` 이관. 각 10분 내 처리 가능.

---

## 총평

**"작은 위생"은 최상위권이다** — 클라이언트 로그 0건, `any` 3건, 실질 TODO 1건. 892파일 규모에서 이 정도 규율은 드물다. 등급을 B로 묶은 것은 오직 두 가지 **구조적 부채**다: (1) 라우트 전반의 2.28 MB 번들, (2) 초대형 파일. 둘은 서로 연결되어 있어 — 대형 컴포넌트를 lazy import로 쪼개면 번들과 파일 크기가 동시에 개선된다. **#1 코드 스플리팅 하나가 등급을 A로 끌어올릴 지렛대**다.

*자동 생성 — daily-quality-report 스케줄 태스크*
