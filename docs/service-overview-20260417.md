# Found.One — 전체 서비스 명세서 (A to Z)

**작성일**: 2026-04-17
**버전**: 0.1.0 (MVP 완성도 ~95/100)
**목적**: 모든 파일·데이터·기능·통합을 한 문서에 담는 단일 참조본

---

## 0. 한 줄 요약

> 한국 창업자를 위한 **로드맵-first 경영 OS** — 예비 창업자의 단계별 의사결정부터, 오픈 후 매일 의존하는 AI 동료·위기 감지·원버튼 실행까지 담은 웹/모바일 플랫폼.

**지금 특별한 것**: 한국 배달·결제 생태계의 수수료·정산 DB를 녹여낸 **흑자부도 예방 엔진** + **실행하는 AI 에이전트 4종** — 이 조합은 국내 SaaS 어디에도 없음.

---

## 1. 기술 스택 & 아키텍처

### 1-1. Monorepo 구조 (pnpm + Turbo)

```
/Users/lij020218/New project/
├── apps/
│   ├── web/                 # Next.js 15.2 (54,893줄, 19MB)
│   └── mobile/              # Expo 52 (초기 구현 중)
├── packages/
│   ├── shared/              # 도메인 타입 + 한국 공공 API 어댑터 (19,226줄)
│   ├── ai/                  # Claude 프롬프트 엔진 (3,243줄)
│   └── config/              # 공유 설정 (스텁)
├── supabase/migrations/     # 40개 SQL 마이그레이션 + RLS
├── docs/                    # 6개 설계 문서 (1,968줄)
└── outputs/                 # 22개 분석 리포트
```

**코드 총량**: TypeScript **82,534줄** / 387 파일 / 26개 주요 디렉토리
**빌드**: Turbo DAG, 의존성 하향 빌드 (shared→ai→web/mobile)
**테스트**: vitest + happy-dom

### 1-2. 주요 라이브러리

| 역할 | 라이브러리 | 버전 |
|---|---|---|
| Web 프레임워크 | Next.js | 15.2 (App Router) |
| 모바일 | Expo + RN | 52 / 0.76 |
| 상태관리 | Zustand | 5.0 |
| DB/Auth | Supabase | 2.49 |
| AI | @anthropic-ai/sdk | 0.39 |
| 스타일 | Tailwind 4 + CSS-in-JS | - |
| 아이콘 | lucide-react | 0.577 |
| 차트/그래픽 | SVG 직접 구현 | - |
| Export | jspdf + xlsx | 4.2 / 0.18 |
| 애니메이션 | framer-motion | 12.38 |
| 에러 추적 | Sentry | 10.47 |

### 1-3. 환경 변수 (주요)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_KAKAO_JS_KEY      # 카카오 맵 클라이언트
ANTHROPIC_API_KEY             # Claude API
NTS_API_KEY                   # 국세청
KSTARTUP_API_KEY              # 정부 지원사업
LOCALDATA_API_KEY             # 건축 인허가
SEMAS_API_KEY                 # 상가 통계
KAKAO_REST_API_KEY            # 카카오 맵 서버
```

---

## 2. 데이터 계층 — Supabase + 9개 Zustand 스토어

### 2-1. Supabase (40개 마이그레이션, 2026-03 ~ 2026-04)

**핵심 테이블 (RLS 정책 포함)**

| 테이블 | RLS 범위 | 용도 |
|---|---|---|
| `business_profiles` | user_id | 업종·예산·위치·프랜차이즈 여부 |
| `roadmaps` | user_id | 사용자별 로드맵 + 진도 |
| `stage_decisions` | roadmap_id | 각 단계 선택/입력 |
| `stage_tasks` | roadmap_id | 단계별 필수/선택 태스크 |
| `customers` | user_id | 고객 관리 |
| `sales_collections` | user_id | 매출 수집 |
| `market_signals` | 공개 | 상권 신호 (인구·임차료·경쟁) |
| `location_signals` | 공개 | 서울 자치구 데이터 |
| `support_programs` | 공개 | 정부 지원사업 DB |
| `stage_guide_content` | 공개 | 단계별 가이드 콘텐츠 |
| `financial_benchmarks` | 공개 | 업종 재무 벤치마크 |
| `vendor_recommendations` | 공개 | 공급처 추천 카탈로그 |

**Extensions**: pgcrypto (gen_random_uuid)
**RLS 정책 예시**: `USING (auth.uid() = user_id)` — 소유자 격리

### 2-2. Zustand 스토어 9개 (클라이언트 상태)

#### A. 세션 전용 (persist 없음)
1. **`useOnboardingStore`** — 온보딩 모달 토글, userRole(owner/staff/manager), `authResolved`
2. **`useAiStore`** — AI 응답 캐시 (계약 분석, 가이드 Q&A, 지식 Q&A, 대시보드 액션)

#### B. 영구 저장 (localStorage persist)
3. **`useProfileStore`** — `selectedIndustryId`, `selectedBudget`, `initialOperatingCapital`, `businessLaunched` 등 20개 필드
4. **`useRoadmapStore`** — `decisions`, `taskMap`, `aiRoadmapResult`(AiRoadmapSnapshot), 상권 후보, 벤더 선택
5. **`useFinanceStore`** — `dailyEntries`, `monthlyCosts`(8칸), `costHistory`, migrate 함수 (5칸→8칸)
6. **`useOperationsStore`** — 가장 큰 스토어 (80+ 필드): `inventory`, `employees`, `fixedExpenses`, `products`, `unifiedProducts`, `serviceMenu`, `deliveryPlatforms`, `subscriptionPlans`, `subscribers`
7. **`useMarketingStore`** — 10개 마케팅 채널, `campaigns`, `trendCache`, `playbookChecklist`, `promoCodes`, `currentCustomerCount`
8. **`useCashflowStore`** ⭐NEW(4/17)⭐ — `currentBalance`, 11개 한국 채널 프리셋, `fixedExpenses`(다시 정의), `crisisThresholdDays`, VAT 적립
9. **`useAgentsStore`** ⭐NEW(4/17)⭐ — `proposals`(30일 유지), 4개 AgentKind별 enabled, KPI 카운터, Phase 2 auto-approve 스켈레톤

### 2-3. 스토어 간 데이터 흐름

```
[Onboarding] → [Profile] → [Roadmap]
                  ↓              ↓
          [Finance] ← [Operations] → [Marketing]
                  ↓                      ↓
               [Cashflow]            [Agents]
                   ↓                      ↓
           14일 예측 + 위기         4개 제안 생성
                   ↓                      ↓
              위기 액션 패널       원버튼 수락 → 기존 스토어 쓰기
```

**쓰기 권한 격리**:
- Agents → marketing(쿠폰 추가), operations(lastOrderedAt)
- 다른 스토어는 **읽기 전용** (도메인 주도 설계 준수)

---

## 3. AI 엔진 — 16개 엔드포인트 + Claude 4.x 시리즈

### 3-1. API 엔드포인트 전수 (16개)

| 경로 | 모델 | 캐싱 | 용도 |
|---|---|---|---|
| `/api/ai/dashboard/actions` | Sonnet 4.6 | ❌ | 대시보드 "오늘의 액션" |
| `/api/ai/marketing/trends` | Haiku 4.5 | ❌ | 업종별 실시간 트렌드 |
| `/api/ai/contract/analyze` | Sonnet 4.6 | ❌ | 임차 계약서 위험 조항 |
| `/api/ai/products/parse` | Sonnet 4.5 | ❌ | Excel/CSV → 제품 JSON |
| `/api/ai/roadmap/generate` | Sonnet 4.6 | ❌ | AI 로드맵 생성 (2분 타임아웃) |
| `/api/ai/programs/match` | Sonnet 4.6 | ❌ | 정부지원사업 매칭 |
| `/api/ai/health/diagnose` | Sonnet 4.6 | ❌ | 경영 건강도 5등급 |
| `/api/ai/market/narrative` | Sonnet 4.6 | ❌ | 상권 점수 서술형 |
| `/api/ai/finance/interpret` | Sonnet 4.6 | ❌ | 재무 시뮬 해석 |
| `/api/ai/interview` | Sonnet 4.6 | ❌ | 인터뷰 스크립트 |
| `/api/ai/interview/analyze` | Sonnet 4.6 | ❌ | 인터뷰 결과 분석 |
| `/api/ai/stage/brief` | Sonnet 4.6 | ❌ | 단계별 브리핑 |
| `/api/ai/guides/ask` | Sonnet 4.6 | ❌ | 가이드 Q&A |
| `/api/ai/business-plan/generate` | Sonnet 4.6 | ❌ | 사업계획서 생성 |
| `/api/ai/agents/coupon-copy` ⭐ | **Haiku 4.5** | **✅ ephemeral** | 쿠폰 카피 |
| `/api/ai/agents/content-draft` ⭐ | **Haiku 4.5** | **✅ ephemeral** | 인스타 포스트 초안 |
| `/api/knowledge/qa` | Sonnet 4.6 | ❌ | 지식베이스 RAG |

**⭐ 표시**: 2026-04-17 신규 추가, prompt caching 최초 도입.

### 3-2. AI 패키지 구조 (`packages/ai/src/`)

```
ai/src/
├── contract/        # Zod schema + 위험 조항 분석
├── dashboard/       # actions + context enrichment
├── finance/         # 시뮬 해석 (narrative)
├── guide/           # Q&A
├── health/          # 진단 (규칙 + AI 하이브리드)
├── interview/       # 스크립트 + 분석 (GPT-4 사용)
├── market/          # 내러티브
├── programs/        # 자격 필터 (결정론적) + AI 매칭
├── roadmap/         # 전체 로드맵 생성
├── stage/           # 단계별 요약
├── types/           # AiCallOptions, AiParseError
└── utils/           # createAiClient (timeout 30s/120s)
```

**OpenAI 통합**: 인터뷰 분석만 GPT-4 turbo (openai 6.32.0)

### 3-3. 인증 & Rate Limit

- `requireApiUser(request)` — Supabase Bearer token 필수
- `checkSimpleRateLimit()` — 메모리 버킷 (사용자별 키)
- 기본 5/min, agent 엔드포인트는 10/day

### 3-4. 월 비용 예상 (100 DAU 기준)

| 엔드포인트 | 월 호출 | Sonnet 비용 | caching 적용 시 |
|---|---|---|---|
| 로드맵 생성 | 150 | $0.36 | $0.08 (-77%) |
| 가이드 Q&A | 2,000 | $0.90 | $0.27 (-70%) |
| 대시보드 액션 | 500 | $0.15 | $0.045 (-70%) |
| 계약 분석 | 300 | $0.18 | $0.05 (-72%) |
| 쿠폰 카피 (이미 caching) | 600 | $0.009 (Haiku) | - |
| **합계** | **~4K** | **~$2.00** | **~$0.55** |

**절감 기회**: 나머지 14개 엔드포인트에 caching 확대 시 **월 73% 절감**

---

## 4. 외부 API 통합 — 한국 특화 데이터

### 4-1. 정부 공공 API (5개)

| API | 엔드포인트 | 인증키 | 캐시 |
|---|---|---|---|
| **국세청 (NTS)** | `/api/data/business/verify`, `/business/status`, `/tax-calendar` | `NTS_API_KEY` | 7일 (세금일정) |
| **K-Startup** | `/api/data/support-programs` | `KSTARTUP_API_KEY` | 12시간 |
| **LocalData** | `/api/data/permits` | `LOCALDATA_API_KEY` | - |
| **SEMAS (상가통계)** | `/api/data/stores` | `SEMAS_API_KEY` | 1시간 |
| **공정거래위원회** | `/api/data/franchise/*` | (공개 데이터) | - |

### 4-2. 상업 API

| 서비스 | 엔드포인트 | 인증키 |
|---|---|---|
| **Kakao Maps 로컬** | `/api/contractors/local` (지역 시공업체) | `KAKAO_REST_API_KEY` |
| **Kakao Maps JS** | 상권 분석 UI | `NEXT_PUBLIC_KAKAO_JS_KEY` |

### 4-3. `@foundone/shared/adapters/` — 18개 어댑터

국한국 공공 데이터를 소화하는 레이어:
- `nts-business`, `kftc-disclosure`, `kftc-franchise`
- `seoul-opendata`, `semas-market`, `semas-store`, `building-registry`
- `financial-integration`, `tax-calendar-api`, `commercial-rent`
- `cache.ts` — 메모리 기반 TTL 캐시

---

## 5. 로드맵 — 6경로 × 34단계

### 5-1. 경로별 단계

| 경로 | 단계 수 | 핵심 단계 |
|---|---|---|
| **selection (공통)** | 6 | 업종→창업형태→운영모델→예산→상권→계약 |
| **startup (스타트업)** | 9 | 문제정의→고객검증→MVP→법인→GTM→펀딩→성장→벤처인증 |
| **offline (오프라인)** | 8 | 사업자등록→시공→채용→보험/세무→운영→인허가→프리런칭 |
| **online (온라인)** | 5 | 셀러등록→플랫폼→스토어→소싱→마케팅 |
| **franchise (프랜차이즈)** | 2 | 가맹신청→공급망 |
| **shared-tail (공통 후속)** | 4 | 첫달점검→최종런칭→대출→세무 |
| **shared (유틸)** | 1 | StageGuideViewer |

**총 34개 스테이지 컴포넌트**, 스타트업 경로가 가장 두꺼움 (Customer Discovery, MVP Build 등).

### 5-2. 스테이지 메타데이터 타입

```typescript
type: "selection" | "comparison" | "execution" | "verification"
```

### 5-3. AiRoadmapSnapshot 구조 (AI 위저드)

생성 후 영구 저장되는 한 번의 결과물:
- `marketAnalysis`: 점수·경쟁·임대료·타깃 핏
- `budgetAllocation`: 보증금·인테리어·장비·운영자본
- `recommendations`: 공급처·인테리어·허가·세무·배달·SNS
- `timeline`: 목표 오픈일·총 주수·단계별
- `risks`: 등급·설명·완화책

---

## 6. 대시보드 — 35개 컴포넌트 (2026-04-17 기준)

### 6-1. `OperationalDashboard.tsx` 섹션 배치 (1,577줄, 75% 축소됨)

```
섹션 0: Store name + LIVE 뱃지
섹션 0.0: 💰 CashflowHeroCard       ⭐ 현금흐름 레이더 (흑자부도 방지)
섹션 0.5: 🤖 AgentProposalsSection   ⭐ Action Agents 4종
섹션 1:   MorningBriefing            AI 아침 코칭
섹션 2:   비용 미입력 안내 배너
섹션 3:   SurvivalBoard / StartupMetrics
섹션 4:   PLHeroCard                 손익 메인
섹션 5:   SalesBreakdown, MonthlyProgress, CostStructure
섹션 6:   BenchmarkCard              성공사례 매칭
섹션 7:   (기존) CashFlowForecastCard (7일)
섹션 8:   ForecastCard               14일 예측
섹션 9:   FirstCustomersCard         ⭐ 첫 100명 플레이북
섹션 10:  WhatIfSimulator            ⭐ 시나리오 시뮬
섹션 11:  Top Products + Recent Activity
섹션 12:  ExportPanel                ⭐ CSV/PDF 내보내기
섹션 13:  DetailTabs                 접힘형 상세 입력
섹션 14:  MilestoneToast             팝업
```

**⭐ 2026-04-17 신규 (P0 + P1-Zero + P1-B)**:
- CashflowHeroCard / CashflowDetailSheet / CashflowSetupSheet / CashflowCrisisActions (4개)
- FirstCustomersCard
- WhatIfSimulator
- ExportPanel
- AgentProposalsSection + AgentProposalCard + 4 Agent body (6개)
- **총 신규 12개 컴포넌트**

### 6-2. 카드 그룹

**진단·신호 그룹**
- PLHeroCard, SurvivalBoardCard, StartupMetricsCard, BenchmarkCard

**예측·시나리오 그룹**
- ForecastCard (14일), CashFlowForecastCard(7일), **CashflowHeroCard(흑자부도)**, **WhatIfSimulator**

**실행·행동 그룹** ⭐NEW⭐
- **AgentProposalsSection** (쿠폰·재주문·콘텐츠·리뷰 4종 원버튼)
- **FirstCustomersCard** (업종별 플레이북 + 쿠폰/초대 관리)
- MorningBriefing (일일 코칭)

**운영 그룹**
- InventoryOpsCard, StaffOpsCard, SalesBreakdownCard, MonthlyProgressCard, CostStructureCard

**내보내기·출력**
- **ExportPanel** (CSV/Excel/PDF)
- WeeklyReport, RevenueCalendar

### 6-3. Surfaces (8개 주요 화면)

| Surface | 역할 |
|---|---|
| HomeView | 로드맵 진행 + 추천 액션 |
| CurrentStageView | 현재 단계 상세 진행 |
| RoadmapSurface | 전체 로드맵 시각화 |
| AnalyticsSurface | 10개 분석 sub-card |
| MarketingSurface | 채널·캠페인·트렌드 |
| GuidesView | 가이드 라이브러리 |
| ProfileView | 프로필 설정 |
| FranchiseView | 가맹점 관리 |

---

## 7. 디자인 시스템

### 7-1. 컬러 팔레트 (Aurora)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--primary` | `#1d3557` | 주 강조 (딥 블루) |
| `--aurora-2` | `#457b9d` | 중간 블루 |
| `--aurora-3` | `#a8dadc` | 밝은 블루 |
| `--bg` | `#f7f6f3` | 베이지 배경 |
| `--surface` | `rgba(255,255,255,0.82)` | 반투명 표면 |
| `--success/warning/danger` | `#2d6a4f` / `#c58b2a` / `#b64c4c` | 상태 |

**Aurora 애니메이션**: body 의사요소 + 80~110초 라디얼 그래디언트 플로우

### 7-2. Typography (Pretendard CDN)

```css
.type-display   → clamp(32-40px), 760
.type-title     → clamp(20-24px), 720
.type-body      → 14px, 450
.type-caption   → 12px, 550, UPPERCASE
.type-micro     → 10px, 600
```

### 7-3. 스타일 시스템

- **Tailwind 4**: 기본, 최소 사용
- **CSS-in-JS** (`styles.ts`, 1,181줄): 메인 스타일 객체 집합
- **lucide-react**: 얇은 선 아이콘 (strokeWidth 1.6-1.8)
- **경고 톤**: 세련된 low-saturation (녹색 `#059669`, 앰버 `#b45309`, 딥레드 `#b91c1c`)

### 7-4. i18n (ko/en)

- `LanguageProvider` Context + `localStorage`
- `@foundone/shared/i18n.ts` (94KB) — `getUiCopy(language)`
- 모든 신규 UI는 ko/en 양어 필수
- 단순 번역 X → **문화 적응 (UX 카피 현지화)**
  - "Let's start your roadmap" → "당신의 앞날을 위한 첫단계"

---

## 8. 인증 & 온보딩

### 8-1. Supabase Auth (이메일/비번만, OAuth 없음)

- `/auth` 페이지 — signup/login/password
- `packages/shared/src/supabase/auth.ts` — 인증 헬퍼
- 이메일 확인 필수 설정 감지
- API: `requireApiUser` Bearer token 검증

### 8-2. 온보딩 플로우 (5단계)

1. 업종 선택 (`industryCategoryId`)
2. 창업 형태 (franchise/independent/undecided)
3. 운영 방식 (business model)
4. 예산 + 오픈 목표 (최근 **운영자본금** 추가)
5. 상권 선택 (추천/직접)

**신규 vs 기존 사용자 분기**:
- 신규 → `createStarterWorkspaceState()` 로드맵 생성
- 기존 → `roadmaps`, `stage_decisions` 테이블에서 복원

---

## 9. 최근 진화 (2026-04-17 대규모 업데이트)

### 9-1. P0 4개 (오전)
1. **운영자본금 시뮬레이터** — 예산 단계 + ForecastCard 런웨이
2. **첫 100명 고객 확보 플레이북** — 7개 업종 × 3단계 전술
3. **What-If 시뮬레이터** — 5개 슬라이더 실시간 재계산
4. **Export (CSV/Excel/PDF)** — 6개 내보내기 함수

### 9-2. P1-Zero 흑자부도 방지 (오후 전반)
- `cashflow-store.ts` — 11개 한국 채널 프리셋 (배민 6.8%/D+7, 쿠팡이츠 9.8%/D+14 등)
- `cashflow-projection.ts` — 14일 예측 + 위기 감지
- `CashflowHeroCard` — 최상단 고정 카드 (미설정/안전/경계/위기 4상태)
- `CashflowDetailSheet` — 채널별 수수료 + 14일 타임라인
- `CashflowSetupSheet` — 4단계 번호 UX (잔고/채널/고정비/알림)
- `CashflowCrisisActions` — 원버튼 7종 (배민 광고 감액, 공급처 연기 카톡 초안, 소진공 긴급대출 등)

### 9-3. P1-B Action Agents (오후 후반)
- `agents-store.ts` — 제안 라이프사이클 + 쿨다운 (24h/3d/7d)
- `agent-triggers.ts` — 4개 순수 감지 함수
- `agent-content-templates.ts` — 로컬 fallback
- `useAgentOrchestration.ts` — 트리거 체크 + AI enrich
- `/api/ai/agents/coupon-copy` + `/content-draft` — **prompt caching 최초 도입 (90% 절감)**
- `AgentProposalCard` + 4 body (Coupon/Reorder/Content/Review)
- `AgentProposalsSection` — 대시보드 통합 (최대 3개 동시)

### 9-4. 준비도 진화 (하루)

| 시간 | 기능 | 준비도 |
|---|---|---|
| 오전 시작 | P0 (Export, What-If 등) | 80 → 88 |
| 오후 중반 | P1-Zero Cash-flow | 88 → 92 |
| 오후 후반 | P1-B Action Agents | 92 → 95 |

---

## 10. 차별화 해자 (경쟁사 비교)

### 10-1. 한국 경쟁 제품

| 제품 | 특징 | Found.One 대비 |
|---|---|---|
| 삼다도 POS | 매출 집계 | AI 없음, 예측 없음 |
| 아임포스 | POS+통계 | 업종 분기 없음, 로드맵 없음 |
| 캐시노트 | 대출 중개 | 창업 전 단계 없음 |
| 배민 사장님 / 쿠팡이츠 매니저 | 단일 채널 | **통합 수수료/정산 없음** |
| 오더플레이스 | 배달 3사 통합 | 재무 예측 없음 |

### 10-2. 글로벌 경쟁

| 제품 | 제한 |
|---|---|
| Square Dashboard | 한국 채널 미대응 |
| Toast (US) | 한국 미진출 |
| QuickBooks | 실시간 cashflow 없음, 한글 약함 |

### 10-3. Found.One 고유 해자 (2년+ 대체 불가)

1. **11개 한국 채널 수수료/정산 DB** (배민·쿠팡이츠·네이버페이·카카오페이·11번가·토스)
2. **흑자부도 14일 예측 + 원버튼 액션** — 국내 SaaS 최초
3. **11개 업종 × 3 mode 자동 분기** (inventory/customer/expense)
4. **로드맵(창업전) + 대시보드(운영) 통합** — 끊김 없는 여정
5. **Claude API 한국어 콘텐츠 생성 + 실행 Agent** — 조언이 아닌 실행

---

## 11. 현재 공백 & 다음 로드맵

### 11-1. 즉시 개선 가능
- [ ] **Prompt caching 확대** — 14개 엔드포인트에 ephemeral 적용 시 월 73% 절감
- [ ] **기존 CashFlowForecastCard (7일, 섹션 7) → CashflowHeroCard(14일)로 완전 대체** — 중복 제거
- [ ] **Rate limit → Redis** (분산 환경 대비, 현재는 메모리 버킷)
- [ ] **Sentry 프로덕션 설정** (Sentry 설치됨, 활성화 검토)

### 11-2. Phase 2 (3개월 데이터 축적 후)
- [ ] **Agent 자동실행** — Coupon/Reorder 한도 내 자동, Content 항상 수동
- [ ] **POS API 연동** (토스/KIS/스마트로) — 카드 매출 자동 수집
- [ ] **카카오 비즈니스 API** — 쿠폰 자동 발송
- [ ] **Peer Circles** — 4인 피어 그룹 (500+ MAU 후)
- [ ] **벤치마크 데이터 확대** — 각 상황 × 업종 × 10개 사례

### 11-3. 전략적
- [ ] **수익 모델 구현** — Free / Pro(2.9만) / Business(9.9만) 플랜 게이팅
- [ ] **Supabase 마이그레이션 프로덕션 적용** (`supabase db push`)
- [ ] **재무 계산 테스트** (calculateMonthlyPnL, calculateHealthMetrics)
- [ ] **모바일 앱 UI 완성** (Expo 구조만 있음)
- [ ] **B2B 플랜** — 지자체 창업지원센터, 프랜차이즈 본사

---

## 12. 요약 통계

| 지표 | 값 |
|---|---|
| TypeScript 코드 | 82,534줄 / 387 파일 |
| Zustand 스토어 | 9개 (세션 2 + persist 7) |
| Supabase 테이블 | 12+ (40개 마이그레이션) |
| AI 엔드포인트 | 16개 (2개 caching 적용) |
| 외부 API | 5개 정부 + 2개 상업 |
| 한국 어댑터 | 18개 |
| 로드맵 단계 | 34개 (6경로) |
| 대시보드 컴포넌트 | 35개 (4/17 기준 12개 신규) |
| Surface | 8개 주요 |
| 언어 지원 | ko/en (94KB i18n) |
| 업종 분기 | 11개 × 3 mode |
| 한국 결제/배달 채널 DB | 11개 |
| Action Agent | 4종 (원버튼) |
| 문서 | docs/ 6개, outputs/ 22개 |

---

## 13. 정체성 선언

> **"조언하는 도구"에서 "실행하는 동료"로** — 2026-04-17 완성.
>
> Found.One은 이제 단순한 로드맵이 아니라, **매일 아침 통장을 확인하고, 위기를 감지하고, 한 탭으로 쿠폰을 발송하고, 공급처에 카톡 메시지를 보내고, 인스타 포스트 초안을 만드는** 한국 자영업자의 디지털 동료다.
>
> 이 조합을 2년 안에 복제할 수 있는 경쟁자는 없다.
