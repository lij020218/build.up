# lib/hooks — 훅 디렉토리 가이드

> **읽기 전에**: 각 파일 상단 JSDoc에 상세 설명이 있습니다. 이 README는 전체 훅 생태계를 한눈에 보기 위한 맵입니다.

---

## 구조 개요

```
useDashboard.ts          ← 진입점. 9개 sub-hook + 6개 store를 조합한 thin orchestrator
│
├── useComputedDashboard.ts      §1  activeSurface, currentStage, healthScore
├── useSelectionHandlers.ts      §2  업종·위치·역할 선택 핸들러
├── useTaskHandlers.ts           §3  로드맵 task 체크·완료·런칭 핸들러
├── useTaskAutoCompletion.ts     §4  task 자동 완료 사이드이펙트
├── useOnboardingHandlers.ts     §5  기존사업자·AI로드맵 온보딩 완료 핸들러
├── useOperationsHandlers.ts     §6  매출입력·재고·직원·배달 CRUD 핸들러
├── useAiAnalysisHandlers.ts     §7  계약서 분석·가이드 Q&A AI 핸들러
├── usePersistence.ts            §8  Supabase ↔ Zustand SSOT 동기화 (★ 핵심)
└── useDataLoading.ts            §9  지도·프랜차이즈·위치 데이터 로딩
```

---

## 핵심 훅 요약

### `usePersistence.ts` — SSOT 동기화 ★
- Supabase가 단일 진실 소스(SSOT). Zustand는 UI 캐시.
- `connectAndLoad` → Supabase에서 전체 데이터 로드 후 Zustand hydrate
- `flushStoreData` / `flushStoreDataImmediate` → Zustand → Supabase 저장
- 디바운스 3초 자동저장, 탭 닫기 전 beforeunload 플러시

### `useMorningBriefingBrain.ts` — AI 브리핑 두뇌
- MorningBriefing + CEOMorningHero 두 컴포넌트가 공유하는 연산 레이어
- cashflow 위기 감지 / 룰 기반 이상 / agent proposals 우선순위 / 업종 인사이트
- narrative 문자열은 만들지 않음 — 표현은 호출 측(resolveHero) 책임

### `useReportSnapshot.ts` — 보고서 메트릭 집계
- 일·주·월·분기별 매출·비용·마진·차트시리즈 계산 (LLM/네트워크 0)
- 비교 기간 대비 증감율, 차트 포인트 7~14개
- ReportAIInsight(`useReportAIInsight.ts`)와 함께 ReportView에서 소비

### `useComputedDashboard.ts` — 화면 분기 결정
- `activeSurface`, `currentStage`, `industryCategoryId`, `businessHealthScore` 계산
- 이 값으로 OperationalDashboard와 StarterStageDemo가 표시 로직 분기

---

## 네이밍 규칙

| 접두사 | 역할 | 예시 |
|--------|------|------|
| `use*Handlers` | UI 이벤트 → store mutation | `useOperationsHandlers` |
| `useComputed*` | 파생값 계산 (memoized) | `useComputedDashboard` |
| `use*Brain` | 여러 컴포넌트가 공유하는 연산 | `useMorningBriefingBrain` |
| `use*Snapshot` | 기간별 집계 슬라이스 | `useReportSnapshot` |
| `use*Loading` | 외부 데이터 fetch | `useDataLoading` |

---

## 새 훅 추가 시 체크리스트

1. **파일 상단 JSDoc 필수** — 역할 1줄, 의존 스토어, 반환값 타입 목록
2. `useDashboard.ts`에 sub-hook으로 연결하거나 직접 컴포넌트에서 소비
3. 네트워크 호출이 있으면 loading/error 상태 포함
4. `console.log` 금지 — 프로덕션 로그는 Sentry 또는 Vercel 서버 로그 사용
