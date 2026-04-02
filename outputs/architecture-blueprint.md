# build.up — 신기능 아키텍처 청사진

> 작성일: 2026-03-27
> 분석 대상: `/Users/lij020218/New project/` (pnpm monorepo, Next.js 15 + Expo + Supabase + Anthropic/OpenAI)
> 목적: 코드베이스 심층 분석 → Phase 1/2 기능의 최상위 품질 구현 방안

---

## 목차

1. [현재 코드베이스 심층 분석](#1-현재-코드베이스-심층-분석)
2. [패키지 구조 재설계 제안](#2-패키지-구조-재설계-제안)
3. [공통 인프라 모듈 설계](#3-공통-인프라-모듈-설계)
4. [Phase 1 — 기능별 구현 청사진](#4-phase-1--기능별-구현-청사진)
   - 4-1. 정부 지원금 매칭 엔진
   - 4-2. 실시간 손익 대시보드
   - 4-3. 세금 캘린더
   - 4-4. 업종별 운영 템플릿
   - 4-5. 생애주기 로드맵 확장
5. [Phase 2 — 설계 개요](#5-phase-2--설계-개요)
6. [구현 순서와 의존성 그래프](#6-구현-순서와-의존성-그래프)
7. [성능 및 확장성 고려사항](#7-성능-및-확장성-고려사항)

---

## 1. 현재 코드베이스 심층 분석

### 1-1. 아키텍처 전체 지도

```
/
├── apps/web/            Next.js 15, React 19
│   └── app/lib/useDashboard.ts   ← 메인 오케스트레이션 훅 (핵심 진입점)
├── apps/mobile/         Expo React Native
├── packages/shared/src/
│   ├── roadmap/workflow.ts       ← 워크플로 상태머신 (235줄)
│   ├── finance/simulation.ts    ← P&L 시뮬레이션 엔진 (392줄)
│   ├── market/scoring.ts        ← 상권 점수 계산 (200줄+)
│   ├── market/seoul-districts.ts ← 100+ 서울 상권 데이터
│   ├── business-context.ts      ← 업종 → 운영모드 매핑
│   ├── startup-programs.ts      ← 50+ 지원금 프로그램
│   ├── franchise-data.ts        ← 200+ 프랜차이즈 브랜드
│   ├── guide/qa.ts              ← 가이드 Q&A 신뢰도 로직
│   ├── starter-data.ts          ← 기본 로드맵/산업 데이터
│   ├── i18n.ts                  ← 한/영 200+ 복사본
│   └── supabase/                ← DB 접근 레이어
│       ├── auth.ts, persistence.ts, finance.ts
│       ├── knowledge.ts, market-signals.ts
│       └── store-data.ts, programs.ts, vendor.ts
├── packages/ai/src/
│   ├── finance/interpret.ts     ← OpenAI P&L 해석
│   ├── market/interpret.ts      ← Claude Haiku 상권 내러티브
│   ├── guide/interpret.ts       ← Claude Sonnet 가이드 Q&A
│   ├── stage/brief.ts           ← Claude Haiku 스테이지 브리핑
│   ├── dashboard/actions.ts     ← OpenAI 일일 액션 생성
│   ├── contract/analyze.ts      ← Claude Sonnet 계약서 분석
│   └── programs/match.ts        ← 지원금 적격 검사 + 매칭
└── supabase/migrations/         ← 28개 마이그레이션 파일
```

### 1-2. 강점 분석

| 강점 | 근거 (코드 참조) |
|------|-----------------|
| **결정론적 워크플로 상태머신** | `buildRoadmapState()`, `evaluateStageCompletion()` — AI 없이 순수 로직으로 단계 잠금/해제. 버그 재현 가능. |
| **신선도 메타데이터 시스템** | `FreshnessStatus` (fresh/review_soon/stale/blocked) + `SourceRecord` + `FreshnessMeta` — 모든 정보에 출처와 검증일 부착. |
| **AI 사용 원칙의 명확성** | "AI는 설명/비교에만" — `interpretFinancialSimulation()`, `interpretMarketScore()` 등이 숫자를 재인용하지 않고 맥락만 해석. |
| **계층화된 DB 접근** | `supabase/finance.ts`의 `loadFinancialBenchmark()`은 exact → partial → category-only 3단계 폴백. 견고한 데이터 로딩. |
| **업종별 운영 모드 분기** | `resolveBusinessContext()` — InventoryMode 4종(separate/unified/service/minimal)으로 UI 분기. 확장성 높음. |
| **완전한 타입 안전성** | `CompletionRule`, `NextStageCondition`, `RoadmapStageState` 등 모든 상태가 TypeScript strict 타입으로 명세. |
| **프랜차이즈·지원금 데이터 내장** | 200+ 브랜드, 50+ 프로그램 — 콜드 스타트 없이 즉시 가치 제공. |

### 1-3. 약점 및 개선 필요 영역

| 약점 | 위치 | 영향 |
|------|------|------|
| **로드맵이 창업 준비(10단계)에서 멈춤** | `starter-data.ts` 기본 로드맵 | 창업 이후 운영·성장 단계를 지원하지 못함 → 사용자 이탈 |
| **실제 매출 데이터와 시뮬레이션 분리** | `store_data` 테이블 ↔ `buildFinancialSimulation()` 단절 | 예측치와 실제치 비교 불가. `MonthlyProjection`은 예측 전용. |
| **정부 지원금이 정적 파일** | `startup-programs.ts` — 하드코딩된 50개 프로그램 | 만료/신규 프로그램 반영 불가. `FreshnessStatus` 시스템과 통합 안 됨. |
| **세금 일정이 지식 가이드에만 존재** | `loadTaxKnowledge()` — 텍스트 형식 | 워크플로 알림·캘린더와 연결 안 됨. |
| **`useDashboard.ts` 단일 훅 비대화 위험** | 현재 827줄 starter-stage-demo.tsx와 연동 | 기능 추가 시 훅이 비대해져 유지보수성 하락. |
| **외부 API 연동 레이어 부재** | POS, 카드사, 국세청 API 연동 코드 없음 | 실시간 데이터 획득 불가. |
| **업종별 템플릿 시스템 미구현** | `business-context.ts`의 InventoryMode에서 멈춤 | 운영 체크리스트, 표준 KPI가 업종별로 없음. |

### 1-4. 핵심 통합 포인트 (기능 추가 시 연결 위치)

```
[워크플로 엔진 확장 포인트]
workflow.ts::buildRoadmapState()
  → CompletionRule 에 "tax_schedule" | "subsidy_deadline" 추가 가능
  → NextStageCondition 에 lifecycle_phase 조건 추가 가능

[재무 엔진 확장 포인트]
simulation.ts::buildFinancialSimulation()
  → MonthlyProjection 에 actual_revenue, actual_cost 필드 추가 가능
  → risk assessment 에 subsidy_income 항목 추가 가능

[AI 레이어 확장 포인트]
packages/ai/src/ 에 /tax/, /operations/, /health/ 모듈 추가
  → 기존 AiStructuredResponse 타입 재사용

[신선도 시스템 확장 포인트]
types/freshness.ts::KnowledgeItemRecord
  → category에 "subsidy" | "tax_deadline" | "template" 추가
  → review_interval_days 로 자동 만료 관리

[Supabase 확장 포인트]
knowledge_items 테이블 → subsidy_programs 테이블 마이그레이션으로 분리
store_data 테이블 → daily_transactions 테이블로 세분화
```

---

## 2. 패키지 구조 재설계 제안

현재 구조는 기능이 단순할 때 적합하지만, Phase 1/2 기능이 추가되면 `packages/shared/src/`가 비대해질 위험이 있습니다. 아래와 같이 도메인별로 서브패키지를 분리하는 것을 권장합니다.

### 현재 → 목표 구조

```
packages/
├── shared/              (현재: 모든 도메인 로직 혼재)
│   └── src/
│       ├── roadmap/     ← 유지
│       ├── finance/     ← 유지
│       ├── market/      ← 유지
│       ├── types/       ← 유지 (공통 타입만)
│       └── supabase/    ← 유지
│
├── ai/                  (현재: 6개 모듈)
│   └── src/             ← 유지 + 신규 모듈 추가
│
│── operations/          ★ 신규 패키지
│   └── src/
│       ├── tax/          세금 캘린더 도메인 로직
│       ├── templates/    업종별 운영 템플릿
│       ├── scheduling/   직원 스케줄링 (Phase 2)
│       └── inventory/    재고 관리 로직
│
├── integrations/        ★ 신규 패키지 (외부 API 레이어)
│   └── src/
│       ├── pos/          POS 시스템 어댑터
│       ├── card/         카드사 API 어댑터
│       ├── tax-api/      국세청 API 어댑터
│       └── subsidy-api/  정부 지원금 API 어댑터
│
└── config/              (현재: 빌드 설정, 유지)
```

### `pnpm-workspace.yaml` 수정

```yaml
packages:
  - 'apps/*'
  - 'packages/*'   # 기존 glob — 신규 패키지 자동 포함
```

### `package.json` 신규 패키지 예시

```json
// packages/operations/package.json
{
  "name": "@build-up/operations",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "dependencies": {
    "@build-up/shared": "workspace:*"
  }
}

// packages/integrations/package.json
{
  "name": "@build-up/integrations",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "dependencies": {
    "@build-up/shared": "workspace:*"
  }
}
```

### `tsconfig.base.json` path aliases 추가

```json
{
  "compilerOptions": {
    "paths": {
      "@build-up/shared": ["./packages/shared/src/index.ts"],
      "@build-up/ai": ["./packages/ai/src/index.ts"],
      "@build-up/operations": ["./packages/operations/src/index.ts"],   // ★ 신규
      "@build-up/integrations": ["./packages/integrations/src/index.ts"] // ★ 신규
    }
  }
}
```

---

## 3. 공통 인프라 모듈 설계

Phase 1/2 기능이 공유하는 인프라를 먼저 구축합니다.

### 3-1. 외부 금융 데이터 연동 레이어 (Adapter Pattern)

**위치**: `packages/integrations/src/`

이 레이어의 핵심 설계 원칙:
- **어댑터 패턴** — POS사마다 다른 응답 형식을 단일 내부 타입으로 정규화
- **신선도 메타데이터 부착** — 기존 `FreshnessMeta` 타입 재사용
- **오류 격리** — 외부 API 실패가 내부 로직을 오염하지 않음

```typescript
// packages/integrations/src/types.ts

/** 정규화된 일별 거래 데이터 — 모든 POS/카드사 어댑터의 공통 출력 */
export interface NormalizedDailyTransaction {
  date: string;               // YYYY-MM-DD
  grossRevenue: number;       // 총 매출 (원)
  cardRevenue: number;        // 카드 매출
  cashRevenue: number;        // 현금 매출
  deliveryRevenue: number;    // 배달 매출
  transactionCount: number;   // 거래 건수
  avgTransactionAmount: number;
  source: 'pos' | 'card_company' | 'manual';
  sourceProvider: string;     // 'kiosk_self', 'nice_payments', 'kakao_pay', ...
  fetchedAt: string;          // ISO 8601
  isEstimated: boolean;       // 추정치 여부 (실제 API 연결 전 폴백)
}

/** 외부 API 어댑터 공통 인터페이스 */
export interface FinancialDataAdapter {
  name: string;
  fetchDailyTransactions(
    storeId: string,
    from: string,
    to: string
  ): Promise<NormalizedDailyTransaction[]>;
  testConnection(storeId: string): Promise<{ ok: boolean; error?: string }>;
}
```

```typescript
// packages/integrations/src/pos/manual-adapter.ts
// Phase 1 수동 입력 어댑터 — 실제 POS 연동 전 폴백

import type { FinancialDataAdapter, NormalizedDailyTransaction } from '../types';
import { loadStoreDailyEntries } from '@build-up/shared/supabase/store-data'; // 기존 함수

export const ManualInputAdapter: FinancialDataAdapter = {
  name: 'manual',
  async fetchDailyTransactions(storeId, from, to) {
    const raw = await loadStoreDailyEntries(storeId, from, to); // store_data 테이블
    return raw.map(entry => ({
      date: entry.date,
      grossRevenue: entry.daily_sales ?? 0,
      cardRevenue: entry.card_sales ?? 0,
      cashRevenue: entry.cash_sales ?? 0,
      deliveryRevenue: entry.delivery_sales ?? 0,
      transactionCount: entry.transaction_count ?? 0,
      avgTransactionAmount: entry.avg_transaction ?? 0,
      source: 'manual',
      sourceProvider: 'manual_input',
      fetchedAt: new Date().toISOString(),
      isEstimated: false,
    }));
  },
  async testConnection() { return { ok: true }; },
};
```

```typescript
// packages/integrations/src/pos/nice-payments-adapter.ts
// Phase 2 나이스페이먼츠 어댑터 (구조만 설계)

export const NicePaymentsAdapter: FinancialDataAdapter = {
  name: 'nice_payments',
  async fetchDailyTransactions(storeId, from, to) {
    // 1. Supabase에서 해당 store의 nice_payments 토큰 조회
    // 2. NICE API 호출: GET /v1/payments/summary?storeId=...&from=...&to=...
    // 3. 응답을 NormalizedDailyTransaction[]으로 변환
    throw new Error('not_implemented_yet');
  },
  async testConnection(storeId) {
    // OAuth 토큰 유효성 검사
    return { ok: false, error: 'not_implemented_yet' };
  },
};
```

### 3-2. 워크플로 엔진 확장 타입

기존 `packages/shared/src/types/roadmap.ts`의 `CompletionRule` 타입에 새 규칙을 추가합니다.

```typescript
// packages/shared/src/types/roadmap.ts (기존 파일 수정)

// 기존:
// export type CompletionRule =
//   | { type: 'select_one' }
//   | { type: 'select_and_save'; requiredInputKeys: string[] }
//   | { type: 'required_inputs'; keys: string[] }
//   | { type: 'required_tasks'; taskIds: string[] }
//   | { type: 'verification_checks'; checkIds: string[] };

// 수정 후 (기존 유지 + 추가):
export type CompletionRule =
  | { type: 'select_one' }
  | { type: 'select_and_save'; requiredInputKeys: string[] }
  | { type: 'required_inputs'; keys: string[] }
  | { type: 'required_tasks'; taskIds: string[] }
  | { type: 'verification_checks'; checkIds: string[] }
  | { type: 'tax_schedule_acknowledged'; scheduleIds: string[] }   // ★ 세금 캘린더용
  | { type: 'subsidy_applied'; minApplications: number }           // ★ 지원금 매칭용
  | { type: 'health_score_above'; threshold: number };             // ★ 사업 건강도용


/** 생애주기 단계 — Phase 1 로드맵 확장의 핵심 */
export type LifecyclePhase =
  | 'pre_launch'    // 창업 준비 (기존 10단계)
  | 'launch'        // 창업 초기 (개업 후 3개월)
  | 'operations'    // 안정 운영 (3개월~2년)
  | 'growth'        // 성장 (확장, 2호점 등)
  | 'crisis'        // 위기 관리
  | 'exit'          // 폐업 또는 재창업;

/** RoadmapStageState 에 lifecycle 정보 추가 */
export interface RoadmapStageState {
  // ... 기존 필드 유지 ...
  lifecyclePhase: LifecyclePhase;  // ★ 추가
  templateId?: string;              // ★ 업종별 템플릿 참조
}
```

### 3-3. 신선도 시스템 카테고리 확장

```typescript
// packages/shared/src/types/freshness.ts (기존 파일 수정)

// 기존 KnowledgeItemRecord.category에 새 값 추가
export type KnowledgeCategory =
  | 'permit'
  | 'tax'
  | 'loan'
  | 'subsidy'          // ★ 정부 지원금 (신규)
  | 'tax_deadline'     // ★ 세금 신고 마감일 (신규)
  | 'template'         // ★ 업종별 운영 템플릿 (신규)
  | 'operations';      // ★ 운영 가이드 (신규)
```

---

## 4. Phase 1 — 기능별 구현 청사진

### 4-1. 정부 지원금 매칭 엔진 (Government Subsidy Matching Engine)

#### 현재 상태 분석

- `packages/shared/src/startup-programs.ts`: 50+ 프로그램 하드코딩. 만료일, 신선도 없음.
- `packages/ai/src/programs/match.ts`: `checkEligibility()` (결정론적) + `matchPrograms()` (Claude AI 매칭). 잘 설계됨.
- 문제: 프로그램 데이터가 코드에 내장 → 업데이트 불가. 신청 마감일 기반 우선순위 없음.

#### 목표 아키텍처

```
[신규 Supabase 테이블: subsidy_programs]
         ↓ 24시간 주기로 관리자 업데이트 (혹은 공공데이터 API 연동)
[packages/shared/src/supabase/subsidies.ts]  ← 신규 파일
         ↓ loadSubsidyPrograms() with freshness filter
[packages/shared/src/subsidies/matcher.ts]  ← startup-programs.ts 리팩터링
         ↓ matchSubsidiesByProfile(businessProfile, lifecyclePhase)
[packages/ai/src/programs/match.ts]          ← 기존 파일 확장
         ↓ matchPrograms() — Claude가 우선순위 + 신청 팁 생성
[apps/web/app/lib/useSubsidies.ts]           ← 신규 훅
```

#### 데이터베이스 스키마

```sql
-- supabase/migrations/20260327_000029_subsidy_programs_v2.sql

CREATE TABLE subsidy_programs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 프로그램 기본 정보
  external_id           TEXT UNIQUE,            -- 공공데이터 포털 ID
  name                  TEXT NOT NULL,
  name_en               TEXT,
  category              TEXT NOT NULL CHECK (category IN ('government','private','local','corporate','competition')),
  organizer             TEXT NOT NULL,           -- 주관기관

  -- 지원 내용
  support_type          TEXT[] NOT NULL,         -- ['funding','loan','mentoring','space','equipment']
  max_amount_krw        BIGINT,                  -- 최대 지원금 (null = 비공개)
  description_ko        TEXT NOT NULL,
  apply_url             TEXT,

  -- 자격 조건 (기존 startup-programs.ts의 필터 필드와 매핑)
  eligible_age_min      INT,
  eligible_age_max      INT,
  eligible_business_years_max INT,              -- 업력 최대 (년)
  eligible_business_years_min INT,              -- 업력 최소
  eligible_regions      TEXT[],                 -- ['서울', '경기', '전국', ...]
  eligible_industries   TEXT[],                 -- industry_category_id 매칭
  required_conditions   TEXT[],                 -- 추가 자격조건 텍스트
  excluded_conditions   TEXT[],                 -- 제외 조건

  -- 일정
  application_open_date  DATE,
  application_close_date DATE,                  -- NULL = 상시모집
  announcement_date      DATE,
  is_recurring_annual    BOOLEAN DEFAULT FALSE,

  -- 상태 (FreshnessStatus 시스템과 연동)
  status                TEXT NOT NULL DEFAULT 'upcoming'
                        CHECK (status IN ('open','upcoming','closed','unknown')),
  last_verified_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_review_at        TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  verified_by           TEXT,                   -- 'admin' | 'crawl_bot' | 'user_report'

  -- 메타
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자별 지원금 지원 현황 추적
CREATE TABLE user_subsidy_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subsidy_id        UUID NOT NULL REFERENCES subsidy_programs(id),

  status            TEXT NOT NULL DEFAULT 'interested'
                    CHECK (status IN ('interested','in_progress','submitted','approved','rejected','withdrawn')),
  applied_at        DATE,
  result_at         DATE,
  approved_amount   BIGINT,
  notes             TEXT,                        -- 사용자 메모

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, subsidy_id)
);

-- 인덱스
CREATE INDEX idx_subsidy_status ON subsidy_programs(status);
CREATE INDEX idx_subsidy_close_date ON subsidy_programs(application_close_date)
  WHERE application_close_date IS NOT NULL;
CREATE INDEX idx_subsidy_regions ON subsidy_programs USING GIN(eligible_regions);
CREATE INDEX idx_subsidy_industries ON subsidy_programs USING GIN(eligible_industries);
CREATE INDEX idx_user_subsidy_user ON user_subsidy_applications(user_id);

-- RLS
ALTER TABLE subsidy_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subsidy_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read open/upcoming subsidies" ON subsidy_programs
  FOR SELECT USING (status IN ('open','upcoming'));

CREATE POLICY "Users manage own applications" ON user_subsidy_applications
  FOR ALL USING (auth.uid() = user_id);
```

#### 새 파일: `packages/shared/src/supabase/subsidies.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FreshnessStatus } from '../types/freshness';

export interface SubsidyProgram {
  id: string;
  externalId: string | null;
  name: string;
  category: 'government' | 'private' | 'local' | 'corporate' | 'competition';
  organizer: string;
  supportType: string[];
  maxAmountKrw: number | null;
  descriptionKo: string;
  applyUrl: string | null;
  eligibleAgeMin: number | null;
  eligibleAgeMax: number | null;
  eligibleBusinessYearsMax: number | null;
  eligibleBusinessYearsMin: number | null;
  eligibleRegions: string[];
  eligibleIndustries: string[];
  applicationOpenDate: string | null;
  applicationCloseDate: string | null;
  isRecurringAnnual: boolean;
  status: 'open' | 'upcoming' | 'closed' | 'unknown';
  lastVerifiedAt: string;
  nextReviewAt: string;
  freshnessStatus: FreshnessStatus;        // 기존 FreshnessStatus 재사용
  daysUntilClose: number | null;           // 마감 D-day (null = 상시)
}

/** 사용자 프로필 기반 적격 지원금 로드 (DB에서) */
export async function loadEligibleSubsidies(
  supabase: SupabaseClient,
  params: {
    age: number;
    businessYears: number;
    region: string;
    industryCategoryId: string;
  }
): Promise<SubsidyProgram[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('subsidy_programs')
    .select('*')
    .in('status', ['open', 'upcoming'])
    .or(`eligible_regions.cs.{"전국"},eligible_regions.cs.{"${params.region}"}`)
    .gte('application_close_date', today)  // 마감 안 된 것만
    .order('application_close_date', { ascending: true, nullsFirst: false });

  if (error || !data) return [];

  // 클라이언트 사이드에서 세부 자격 필터링 (DB 쿼리 단순화)
  return data
    .filter(p => checkBasicEligibility(p, params))
    .map(p => toSubsidyProgram(p));
}

function checkBasicEligibility(
  program: any,
  params: { age: number; businessYears: number; industryCategoryId: string }
): boolean {
  if (program.eligible_age_min && params.age < program.eligible_age_min) return false;
  if (program.eligible_age_max && params.age > program.eligible_age_max) return false;
  if (
    program.eligible_business_years_max !== null &&
    params.businessYears > program.eligible_business_years_max
  ) return false;
  if (
    program.eligible_industries.length > 0 &&
    !program.eligible_industries.includes(params.industryCategoryId) &&
    !program.eligible_industries.includes('all')
  ) return false;
  return true;
}

function toSubsidyProgram(raw: any): SubsidyProgram {
  const closeDate = raw.application_close_date;
  const daysUntilClose = closeDate
    ? Math.ceil((new Date(closeDate).getTime() - Date.now()) / 86400000)
    : null;

  // 기존 FreshnessStatus 로직 재사용 (freshness.ts의 규칙 적용)
  const daysSinceVerified = Math.floor(
    (Date.now() - new Date(raw.last_verified_at).getTime()) / 86400000
  );
  const freshnessStatus: FreshnessStatus =
    daysSinceVerified <= 7 ? 'fresh' :
    daysSinceVerified <= 14 ? 'review_soon' :
    daysSinceVerified <= 30 ? 'stale' : 'blocked';

  return {
    id: raw.id,
    externalId: raw.external_id,
    name: raw.name,
    category: raw.category,
    organizer: raw.organizer,
    supportType: raw.support_type ?? [],
    maxAmountKrw: raw.max_amount_krw,
    descriptionKo: raw.description_ko,
    applyUrl: raw.apply_url,
    eligibleAgeMin: raw.eligible_age_min,
    eligibleAgeMax: raw.eligible_age_max,
    eligibleBusinessYearsMax: raw.eligible_business_years_max,
    eligibleBusinessYearsMin: raw.eligible_business_years_min,
    eligibleRegions: raw.eligible_regions ?? [],
    eligibleIndustries: raw.eligible_industries ?? [],
    applicationOpenDate: raw.application_open_date,
    applicationCloseDate: closeDate,
    isRecurringAnnual: raw.is_recurring_annual ?? false,
    status: raw.status,
    lastVerifiedAt: raw.last_verified_at,
    nextReviewAt: raw.next_review_at,
    freshnessStatus,
    daysUntilClose,
  };
}
```

#### 기존 파일 수정: `packages/ai/src/programs/match.ts`

```typescript
// 기존 matchPrograms() 함수에 SubsidyProgram 타입 지원 추가
// 기존: StartupProgram[] (startup-programs.ts의 하드코딩 타입)
// 변경: SubsidyProgram[] (DB에서 로드된 타입)

import type { SubsidyProgram } from '@build-up/shared/supabase/subsidies';

// 기존 ProgramMatchingResult 타입 재사용 — 변경 불필요
export async function matchSubsidiesWithAI(
  programs: SubsidyProgram[],
  profile: {
    industryCategoryId: string;
    capital: number;
    lifecyclePhase: LifecyclePhase;  // ★ 신규 — 운영 중인지, 창업 준비인지
    region: string;
  }
): Promise<ProgramMatchingResult> {
  // 기존 matchPrograms() 로직과 동일한 패턴
  // Claude에게 SubsidyProgram[] + profile 전달하여 우선순위 + 팁 생성
  // daysUntilClose를 프롬프트에 포함하여 긴급도 반영
}
```

#### 새 훅: `apps/web/app/lib/useSubsidies.ts`

```typescript
// 기존 useDashboard.ts에서 지원금 관련 상태를 이 훅으로 분리
export function useSubsidies(businessProfile: BusinessProfile) {
  const [subsidies, setSubsidies] = useState<SubsidyProgram[]>([]);
  const [matched, setMatched] = useState<ProgramMatchingResult | null>(null);
  const [applications, setApplications] = useState<UserSubsidyApplication[]>([]);
  const [loading, setLoading] = useState(false);

  // 적격 지원금 로드 + AI 매칭
  const loadAndMatch = useCallback(async () => { ... }, [businessProfile]);

  // 신청 상태 업데이트
  const updateApplication = useCallback(async (
    subsidyId: string,
    status: UserSubsidyApplication['status']
  ) => { ... }, []);

  return { subsidies, matched, applications, loadAndMatch, updateApplication };
}
```

#### API 엔드포인트 (Next.js Route Handlers)

```typescript
// apps/web/app/api/subsidies/route.ts
// GET /api/subsidies?industryCategoryId=food&region=서울&age=35&businessYears=0
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  // loadEligibleSubsidies() 호출 후 반환
}

// apps/web/app/api/subsidies/match/route.ts
// POST /api/subsidies/match — AI 매칭 요청 (비용 절감을 위해 캐싱)
export async function POST(req: Request) {
  // matchSubsidiesWithAI() 호출
  // 결과를 24시간 캐시 (동일 프로필이면 AI 재호출 불필요)
}

// apps/web/app/api/subsidies/[id]/apply/route.ts
// POST /api/subsidies/:id/apply — 신청 의사 기록
// PATCH /api/subsidies/:id/apply — 상태 업데이트
```

---

### 4-2. 실시간 손익 대시보드 (Real-time P&L Dashboard)

#### 현재 상태 분석

- `packages/shared/src/finance/simulation.ts::buildFinancialSimulation()`: 예측 P&L (6개월). 실제 데이터와 분리.
- `packages/shared/src/types/finance.ts::MonthlyProjection`: `projectedRevenue`, `projectedCost` 필드만 있음.
- `packages/shared/src/supabase/store-data.ts`: `daily_sales`, `daily_costs` 등 실제 데이터 저장.
- 문제: 두 데이터가 연결되지 않아 "예측 vs 실제" 비교 불가.

#### 목표: 예측-실제 통합 P&L 뷰

```
buildFinancialSimulation() [예측]
           +
실제 거래 데이터 (store_data / NormalizedDailyTransaction)
           ↓
mergeProjectionWithActuals()   ← 신규 함수
           ↓
EnrichedMonthlyProjection[]    ← 신규 타입 (예측 + 실제 + 편차)
           ↓
generateDashboardActions()     ← 기존 AI 함수 입력으로 사용
```

#### 데이터베이스 스키마

```sql
-- supabase/migrations/20260327_000030_daily_transactions.sql

-- store_data 테이블을 더 세분화한 일별 거래 테이블
CREATE TABLE daily_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id        UUID,                          -- 멀티스토어 대비
  date            DATE NOT NULL,

  -- 매출 세분화
  gross_revenue   BIGINT NOT NULL DEFAULT 0,
  card_revenue    BIGINT NOT NULL DEFAULT 0,
  cash_revenue    BIGINT NOT NULL DEFAULT 0,
  delivery_revenue BIGINT NOT NULL DEFAULT 0,
  other_revenue   BIGINT NOT NULL DEFAULT 0,

  -- 비용 세분화 (기존 store_data 확장)
  cogs            BIGINT NOT NULL DEFAULT 0,     -- 원가
  labor_cost      BIGINT NOT NULL DEFAULT 0,     -- 인건비
  rent            BIGINT NOT NULL DEFAULT 0,     -- 임차료 (월 단위 분할)
  utilities       BIGINT NOT NULL DEFAULT 0,     -- 공과금
  marketing       BIGINT NOT NULL DEFAULT 0,     -- 마케팅비
  other_cost      BIGINT NOT NULL DEFAULT 0,     -- 기타비용

  -- 메타
  transaction_count INT,
  data_source     TEXT DEFAULT 'manual'
                  CHECK (data_source IN ('manual','pos_sync','card_api','estimate')),
  source_provider TEXT,                          -- 'nice_payments', 'kakao_pay', ...
  is_confirmed    BOOLEAN DEFAULT TRUE,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)  -- 하루에 하나의 합산 레코드
);

-- 월별 집계 뷰 (실시간 계산 대신 뷰 사용)
CREATE OR REPLACE VIEW monthly_actuals AS
SELECT
  user_id,
  DATE_TRUNC('month', date)::DATE AS month,
  SUM(gross_revenue)   AS actual_revenue,
  SUM(cogs + labor_cost + rent + utilities + marketing + other_cost) AS actual_total_cost,
  SUM(cogs)            AS actual_cogs,
  SUM(labor_cost)      AS actual_labor,
  SUM(rent)            AS actual_rent,
  COUNT(*)             AS operating_days,
  AVG(gross_revenue)   AS avg_daily_revenue
FROM daily_transactions
GROUP BY user_id, DATE_TRUNC('month', date);

-- POS 연동 설정 테이블
CREATE TABLE store_integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,                 -- 'nice_payments', 'kakao_pay', ...
  store_external_id TEXT,                        -- POS사의 가맹점 ID
  access_token    TEXT,                          -- 암호화 필요 (Vault 사용)
  refresh_token   TEXT,
  token_expires_at TIMESTAMPTZ,
  last_sync_at    TIMESTAMPTZ,
  sync_status     TEXT DEFAULT 'pending'
                  CHECK (sync_status IN ('pending','active','error','disconnected')),
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE daily_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own daily_transactions" ON daily_transactions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own store_integrations" ON store_integrations
  FOR ALL USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_daily_tx_user_date ON daily_transactions(user_id, date DESC);
CREATE INDEX idx_daily_tx_month ON daily_transactions(user_id, DATE_TRUNC('month', date));
```

#### 새 타입: `packages/shared/src/types/finance.ts` (기존 파일 확장)

```typescript
// 기존 MonthlyProjection 에 실제값 필드 추가
export interface EnrichedMonthlyProjection extends MonthlyProjection {
  // 기존 MonthlyProjection 필드 모두 유지
  // projectedRevenue, projectedCost, projectedProfit, ...

  // ★ 신규: 실제값
  actualRevenue: number | null;      // null = 아직 데이터 없음
  actualTotalCost: number | null;
  actualProfit: number | null;
  actualCogs: number | null;
  actualLaborCost: number | null;
  actualRent: number | null;
  operatingDays: number | null;
  avgDailyRevenue: number | null;

  // ★ 신규: 편차 분석
  revenueVariance: number | null;    // actual - projected (원)
  revenueVariancePct: number | null; // 편차율 (%)
  costVariance: number | null;
  isOnTrack: boolean | null;         // BEP 달성 궤도 여부
  dataSource: 'actual' | 'partial' | 'projection_only';
}

/** 실제 거래 데이터를 시뮬레이션 결과와 병합 */
export function mergeProjectionWithActuals(
  projections: MonthlyProjection[],          // buildFinancialSimulation() 결과
  actuals: MonthlyActual[]                   // DB monthly_actuals 뷰
): EnrichedMonthlyProjection[] {
  return projections.map((proj) => {
    const actual = actuals.find(a => a.month === proj.month);
    if (!actual) {
      return { ...proj, actualRevenue: null, /* ... */ dataSource: 'projection_only' };
    }
    const revenueVariance = actual.actualRevenue - proj.projectedRevenue;
    return {
      ...proj,
      actualRevenue: actual.actualRevenue,
      actualTotalCost: actual.actualTotalCost,
      actualProfit: actual.actualRevenue - actual.actualTotalCost,
      actualCogs: actual.actualCogs,
      actualLaborCost: actual.actualLabor,
      actualRent: actual.actualRent,
      operatingDays: actual.operatingDays,
      avgDailyRevenue: actual.avgDailyRevenue,
      revenueVariance,
      revenueVariancePct: proj.projectedRevenue > 0
        ? (revenueVariance / proj.projectedRevenue) * 100
        : null,
      costVariance: actual.actualTotalCost - proj.projectedCost,
      isOnTrack: actual.actualRevenue >= proj.breakEvenRevenue,
      dataSource: 'actual',
    };
  });
}
```

#### 기존 AI 함수 수정: `packages/ai/src/dashboard/actions.ts`

```typescript
// 기존 DashboardContext에 실제 데이터 필드 추가
export interface DashboardContext {
  // 기존 필드 유지
  industry: string;
  currentSales: number;
  currentCosts: number;
  runway: number;
  healthScore: number;

  // ★ 신규: 예측 vs 실제 비교 데이터
  revenueVariancePct: number | null;     // 이번 달 매출 편차율
  isOnTrack: boolean | null;             // BEP 궤도 여부
  monthlyTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  avgDailyRevenue: number | null;
  daysUntilMonthEnd: number;
}

// generateDashboardActions()는 이미 잘 설계되어 있으므로
// DashboardContext 확장만으로 더 정확한 위기 감지 가능
```

#### API 엔드포인트

```typescript
// apps/web/app/api/transactions/route.ts
// GET  /api/transactions?from=2026-03-01&to=2026-03-31
// POST /api/transactions — 수동 입력
// PUT  /api/transactions/[date] — 수정

// apps/web/app/api/analytics/monthly/route.ts
// GET  /api/analytics/monthly?months=6
// → monthly_actuals 뷰 + buildFinancialSimulation() 병합 결과 반환
// → mergeProjectionWithActuals() 호출

// apps/web/app/api/integrations/pos/route.ts
// POST /api/integrations/pos — POS 연동 초기화 (OAuth 시작)
// GET  /api/integrations/pos/status — 동기화 상태 확인
// POST /api/integrations/pos/sync — 수동 동기화 트리거
```

---

### 4-3. 세금 캘린더 (Tax Calendar)

#### 현재 상태 분석

- `packages/shared/src/supabase/knowledge.ts::loadTaxKnowledge()`: 텍스트 형식의 세금 가이드 반환.
- 문제: 세금 신고 마감일이 캘린더/알림과 연결되지 않음. 워크플로 노드로 존재하지 않음.

#### 목표 아키텍처

```
[packages/operations/src/tax/calendar.ts]  ← 신규
  generateTaxSchedule(businessProfile)
       ↓
  TaxEvent[]  (부가세/종합소득세/원천세/지방세 마감일 포함)
       ↓
[워크플로 엔진] CompletionRule: 'tax_schedule_acknowledged'
       ↓
[알림 시스템] D-30, D-7, D-1 리마인더
```

#### 새 파일: `packages/operations/src/tax/calendar.ts`

```typescript
/** 한국 사업자의 세금 이벤트 */
export interface TaxEvent {
  id: string;
  type: TaxEventType;
  name: string;
  dueDate: string;            // YYYY-MM-DD
  periodFrom: string;         // 신고 대상 기간 시작
  periodTo: string;           // 신고 대상 기간 종료
  estimatedAmount: number | null; // 예상 납부액 (null = 계산 불가)
  description: string;
  penaltyIfMissed: string;    // 미신고 시 가산세 설명
  howToFile: string;          // 신고 방법 (홈택스, 세무사 등)
  isRequired: boolean;        // 사업 형태에 따른 필수 여부
  lifecyclePhase: LifecyclePhase[];  // 해당 생애주기
  freshnessStatus: FreshnessStatus;  // 마감일 기준 신선도
  daysUntilDue: number;
}

export type TaxEventType =
  | 'vat_general'           // 부가가치세 (일반과세자)
  | 'vat_simplified'        // 부가가치세 (간이과세자)
  | 'income_tax'            // 종합소득세
  | 'withholding_tax'       // 원천세 (직원 있을 때)
  | 'local_income_tax'      // 지방소득세
  | 'business_registration' // 사업자등록 관련
  | 'employee_insurance';   // 4대보험

/** 사업자 유형과 업종에 맞는 세금 일정 생성 */
export function generateTaxSchedule(params: {
  businessType: 'sole_proprietor' | 'corporation';
  vatType: 'general' | 'simplified' | 'exempt';
  hasEmployees: boolean;
  openDate: string;
  year?: number;
}): TaxEvent[] {
  const year = params.year ?? new Date().getFullYear();
  const events: TaxEvent[] = [];

  // 부가가치세 (일반과세자: 연 2회, 간이과세자: 연 1회)
  if (params.vatType === 'general') {
    events.push(
      makeTaxEvent('vat_general', `${year}-01-25`, `${year - 1}-07-01`, `${year - 1}-12-31`, params),
      makeTaxEvent('vat_general', `${year}-07-25`, `${year}-01-01`, `${year}-06-30`, params),
    );
  } else if (params.vatType === 'simplified') {
    events.push(
      makeTaxEvent('vat_simplified', `${year}-01-25`, `${year - 1}-01-01`, `${year - 1}-12-31`, params),
    );
  }

  // 종합소득세 (5월)
  events.push(
    makeTaxEvent('income_tax', `${year}-05-31`, `${year - 1}-01-01`, `${year - 1}-12-31`, params),
  );

  // 원천세 (직원이 있는 경우: 매월 10일)
  if (params.hasEmployees) {
    for (let month = 1; month <= 12; month++) {
      const dueDate = `${year}-${String(month).padStart(2, '0')}-10`;
      events.push(makeTaxEvent('withholding_tax', dueDate, /* ... */ params));
    }
  }

  // 마감 D-day 계산 및 FreshnessStatus 적용
  return events
    .map(ev => ({
      ...ev,
      daysUntilDue: Math.ceil((new Date(ev.dueDate).getTime() - Date.now()) / 86400000),
      freshnessStatus: deriveTaxFreshness(ev.dueDate),
    }))
    .filter(ev => ev.daysUntilDue > -30)  // 30일 지난 것은 제외
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

function deriveTaxFreshness(dueDate: string): FreshnessStatus {
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (days > 30) return 'fresh';
  if (days > 7) return 'review_soon';
  if (days >= 0) return 'stale';    // 임박
  return 'blocked';                  // 마감 지남
}
```

#### 데이터베이스 스키마

```sql
-- supabase/migrations/20260327_000031_tax_calendar.sql

-- 사용자별 세금 이벤트 인지 및 완료 추적
CREATE TABLE user_tax_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_type        TEXT NOT NULL,
  tax_year        INT NOT NULL,
  tax_period      TEXT,               -- '2025-H1', '2025-Q4', '2025-05' 등
  due_date        DATE NOT NULL,

  -- 상태 추적
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','in_progress','filed','paid','overdue','exempt')),
  acknowledged_at TIMESTAMPTZ,        -- 사용자가 인지한 시각
  filed_at        DATE,
  paid_at         DATE,
  paid_amount     BIGINT,

  -- 알림
  reminder_30d_sent BOOLEAN DEFAULT FALSE,
  reminder_7d_sent  BOOLEAN DEFAULT FALSE,
  reminder_1d_sent  BOOLEAN DEFAULT FALSE,

  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, tax_type, tax_year, tax_period)
);

-- 알림 큐 (Supabase Edge Functions 또는 pg_cron으로 처리)
CREATE TABLE notification_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,    -- 'tax_reminder', 'subsidy_closing', 'health_alert'
  payload         JSONB NOT NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  sent_at         TIMESTAMPTZ,
  channel         TEXT DEFAULT 'push' CHECK (channel IN ('push','email','in_app')),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','cancelled')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_queue_pending ON notification_queue(scheduled_at)
  WHERE status = 'pending';
```

#### 워크플로 엔진 통합

```typescript
// packages/shared/src/roadmap/workflow.ts 수정
// evaluateStageCompletion() 함수에 새 CompletionRule 처리 추가

export function evaluateStageCompletion(
  stage: RoadmapStageState,
  decisions: DecisionMap,
  taskMap: TaskMap,
  taxEvents?: UserTaxEvent[]  // ★ 신규 파라미터 (optional)
): boolean {
  const { completionRule } = stage;

  // 기존 규칙들 유지 ...

  // ★ 신규: 세금 일정 인지 확인
  if (completionRule.type === 'tax_schedule_acknowledged') {
    if (!taxEvents) return false;
    return completionRule.scheduleIds.every(id =>
      taxEvents.some(ev => ev.id === id && ev.acknowledgedAt !== null)
    );
  }

  return false;
}
```

---

### 4-4. 업종별 운영 템플릿 (Industry-specific Operation Templates)

#### 현재 상태 분석

- `packages/shared/src/business-context.ts::resolveBusinessContext()`: 업종을 `InventoryMode` 4종으로 분류. 잘 설계됨.
- `packages/shared/src/starter-data.ts`: 기본 로드맵과 결정 맵 하드코딩.
- 문제: "식당 오픈 체크리스트", "카페 월간 KPI" 같은 실제 운영 템플릿이 없음.

#### 목표: 워크플로 엔진 위에 템플릿 레이어 추가

```typescript
// packages/operations/src/templates/types.ts

/** 업종별 운영 템플릿 정의 */
export interface OperationTemplate {
  id: string;
  name: string;
  industryCategoryId: string;           // food, cafe-dessert, retail, ...
  lifecyclePhase: LifecyclePhase;
  inventoryMode: InventoryMode;         // resolveBusinessContext()와 연동

  // 워크플로 단계별 기본 태스크 목록
  defaultTasks: TemplateTask[];

  // 업종별 핵심 KPI 목록
  kpiDefinitions: KpiDefinition[];

  // 월간 운영 체크리스트
  monthlyChecklist: ChecklistItem[];

  // 업종별 비용 구조 벤치마크
  costStructureBenchmark: CostStructureBenchmark;

  // 신선도 정보 (템플릿 자체가 outdated될 수 있음)
  lastUpdatedAt: string;
  reviewIntervalDays: number;
}

export interface KpiDefinition {
  id: string;
  name: string;
  unit: string;                   // '원', '%', '명', '회전'
  formula?: string;               // 계산식 설명
  targetMin: number | null;
  targetMax: number | null;
  benchmarkSource: string;        // 벤치마크 출처
  warningThreshold: number | null;
  criticalThreshold: number | null;
}

export interface CostStructureBenchmark {
  cogsRatePct: [number, number];    // [min, max] 예: [28, 35] for 식당
  laborRatePct: [number, number];
  rentRatePct: [number, number];
  marketingRatePct: [number, number];
  otherRatePct: [number, number];
}
```

#### 템플릿 데이터 (주요 업종 예시)

```typescript
// packages/operations/src/templates/data/food.ts

export const FOOD_OPERATIONS_TEMPLATE: OperationTemplate = {
  id: 'food-operations-v1',
  name: '음식점 운영 템플릿',
  industryCategoryId: 'food',
  lifecyclePhase: 'operations',
  inventoryMode: 'separate',   // resolveBusinessContext('food').inventoryMode

  defaultTasks: [
    { id: 'food-daily-inventory', name: '식재료 재고 확인', frequency: 'daily' },
    { id: 'food-daily-sales', name: '일매출 기록', frequency: 'daily' },
    { id: 'food-weekly-order', name: '식재료 주문', frequency: 'weekly' },
    { id: 'food-monthly-pl', name: '월간 손익 검토', frequency: 'monthly' },
    { id: 'food-monthly-menu', name: '메뉴 원가 재계산', frequency: 'monthly' },
    { id: 'food-quarterly-tax', name: '분기 부가세 확인', frequency: 'quarterly' },
  ],

  kpiDefinitions: [
    {
      id: 'food-kpi-cogs',
      name: '식재료비율 (Food Cost %)',
      unit: '%',
      formula: '월간 식재료비 / 월간 매출 × 100',
      targetMin: 28,
      targetMax: 35,
      benchmarkSource: '한국외식업중앙회 2025 외식업 경영실태조사',
      warningThreshold: 38,
      criticalThreshold: 42,
    },
    {
      id: 'food-kpi-table-turn',
      name: '테이블 회전율',
      unit: '회',
      formula: '일일 고객수 / 좌석수',
      targetMin: 2.5,
      targetMax: null,
      benchmarkSource: '소상공인시장진흥공단 2025',
      warningThreshold: 1.5,
      criticalThreshold: 1.0,
    },
    {
      id: 'food-kpi-avg-spend',
      name: '객단가 (Average Check)',
      unit: '원',
      formula: '월매출 / 월고객수',
      targetMin: null,
      targetMax: null,
      benchmarkSource: '업주 설정값',
      warningThreshold: null,
      criticalThreshold: null,
    },
  ],

  costStructureBenchmark: {
    cogsRatePct: [28, 35],
    laborRatePct: [25, 35],
    rentRatePct: [8, 15],
    marketingRatePct: [2, 5],
    otherRatePct: [5, 10],
  },

  lastUpdatedAt: '2026-01-01',
  reviewIntervalDays: 180,
};
```

#### Supabase 스키마

```sql
-- supabase/migrations/20260327_000032_operation_templates.sql

CREATE TABLE operation_templates (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  industry_category_id TEXT NOT NULL,
  lifecycle_phase     TEXT NOT NULL,
  inventory_mode      TEXT NOT NULL,
  kpi_definitions     JSONB NOT NULL DEFAULT '[]',
  monthly_checklist   JSONB NOT NULL DEFAULT '[]',
  cost_structure_benchmark JSONB NOT NULL DEFAULT '{}',
  last_updated_at     DATE NOT NULL,
  review_interval_days INT NOT NULL DEFAULT 180
);

-- 사용자가 템플릿을 커스터마이즈한 내용 저장
CREATE TABLE user_template_customizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id     TEXT NOT NULL REFERENCES operation_templates(id),
  custom_tasks    JSONB DEFAULT '[]',     -- 추가/제거한 태스크
  custom_kpis     JSONB DEFAULT '[]',     -- 커스텀 KPI 목표치
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

-- RLS
ALTER TABLE operation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_template_customizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All can read templates" ON operation_templates FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Users own customizations" ON user_template_customizations FOR ALL USING (auth.uid() = user_id);
```

#### `resolveBusinessContext()` 확장 통합

```typescript
// packages/shared/src/business-context.ts 수정
// 기존 resolveBusinessContext() 반환값에 templateId 추가

export interface BusinessContext {
  inventoryMode: InventoryMode;
  // ... 기존 필드 ...
  defaultTemplateId: string;   // ★ 신규 — 업종별 기본 운영 템플릿 ID
}

export function resolveBusinessContext(industryCategoryId: string): BusinessContext {
  // 기존 로직 유지 + defaultTemplateId 반환
  const templateId = `${industryCategoryId}-operations-v1`;
  return { ...existingResult, defaultTemplateId: templateId };
}
```

---

### 4-5. 생애주기 로드맵 확장 (Lifecycle Roadmap Extension)

#### 현재 상태 분석

- `packages/shared/src/starter-data.ts`: 10단계 창업 준비 로드맵만 존재.
- `packages/shared/src/roadmap/workflow.ts::buildRoadmapState()`: `template_id` 기반으로 로드맵 구성. 확장 가능.
- `packages/shared/src/types/roadmap.ts`: `NextStageCondition` — 조건부 분기 이미 지원. 생애주기 분기 추가 가능.

#### 전체 생애주기 아키텍처

```
[pre_launch]  창업 준비 (기존 10단계)
      ↓ (개업일 도달)
[launch]      창업 초기 (개업 후 0~3개월)
      ├── 생존 전략 수립
      ├── 첫 BEP 달성 추적
      └── 초기 고객 확보
      ↓ (3개월 후 / BEP 달성 후)
[operations]  안정 운영 (3개월~2년)
      ├── 월간 P&L 최적화
      ├── 직원 관리
      └── 재고 효율화
      ↓ (매출 성장 신호 감지)
[growth]      성장 단계
      ├── 2호점 확장 검토
      ├── 프랜차이즈 전환
      └── 온라인 채널 확장
      ↓ (위기 신호: 매출 30% 감소 등)
[crisis]      위기 관리
      ├── 긴급 비용 절감
      ├── 정부 지원금 매칭
      └── 채무 조정
      ↓
[exit]        폐업 또는 재창업
      ├── 폐업 절차 안내
      ├── 잔존 자산 정리
      └── 재창업 로드맵 연결
```

#### 새 로드맵 템플릿 데이터

```typescript
// packages/shared/src/lifecycle-roadmap.ts (신규 파일)

import type { RoadmapStageDefinition, CompletionRule, NextStageCondition } from './types/roadmap';
import type { LifecyclePhase } from './types/roadmap';

/** 창업 초기 단계 (launch phase) — 기존 pre_launch 로드맵에 연결 */
export const LAUNCH_PHASE_STAGES: RoadmapStageDefinition[] = [
  {
    code: 'launch_survival_plan',
    name: '생존 전략 수립',
    lifecyclePhase: 'launch',
    completionRule: { type: 'required_inputs', keys: ['daily_revenue_target', 'breakeven_date_target'] },
    nextStages: [{ code: 'launch_first_month_review' }],
    templateId: null,
  },
  {
    code: 'launch_first_month_review',
    name: '1개월 손익 리뷰',
    lifecyclePhase: 'launch',
    completionRule: { type: 'required_tasks', taskIds: ['review_actual_vs_projected', 'identify_top_cost'] },
    nextStages: [
      {
        condition: { key: 'on_track', value: 'true' } satisfies NextStageCondition,
        code: 'launch_customer_acquisition',
      },
      {
        condition: { key: 'on_track', value: 'false' } satisfies NextStageCondition,
        code: 'launch_early_crisis_response',
      },
    ],
  },
  // ... 추가 단계
];

/** 운영 단계 (operations phase) */
export const OPERATIONS_PHASE_STAGES: RoadmapStageDefinition[] = [
  {
    code: 'ops_monthly_pl_review',
    name: '월간 손익 검토',
    lifecyclePhase: 'operations',
    completionRule: { type: 'required_tasks', taskIds: ['enter_monthly_actuals', 'review_kpis'] },
    nextStages: [{ code: 'ops_cost_optimization' }],
    templateId: null,  // resolveBusinessContext()로 결정
  },
  {
    code: 'ops_tax_calendar',
    name: '세금 일정 확인',
    lifecyclePhase: 'operations',
    completionRule: { type: 'tax_schedule_acknowledged', scheduleIds: ['next_vat', 'next_income_tax'] },
    nextStages: [{ code: 'ops_subsidy_check' }],
    templateId: null,
  },
  {
    code: 'ops_subsidy_check',
    name: '지원금 점검',
    lifecyclePhase: 'operations',
    completionRule: { type: 'subsidy_applied', minApplications: 1 },
    nextStages: [{ code: 'ops_growth_signal' }],
    templateId: null,
  },
];

/** 위기 대응 단계 (crisis phase) */
export const CRISIS_PHASE_STAGES: RoadmapStageDefinition[] = [
  {
    code: 'crisis_diagnosis',
    name: '위기 진단',
    lifecyclePhase: 'crisis',
    completionRule: { type: 'required_inputs', keys: ['crisis_type', 'monthly_deficit'] },
    nextStages: [
      { condition: { key: 'crisis_type', value: 'revenue_decline' }, code: 'crisis_revenue_recovery' },
      { condition: { key: 'crisis_type', value: 'cost_surge' }, code: 'crisis_cost_reduction' },
      { condition: { key: 'crisis_type', value: 'debt_crisis' }, code: 'crisis_debt_management' },
    ],
  },
];

/** 폐업 단계 (exit phase) */
export const EXIT_PHASE_STAGES: RoadmapStageDefinition[] = [
  {
    code: 'exit_decision',
    name: '폐업/재창업 결정',
    lifecyclePhase: 'exit',
    completionRule: { type: 'select_one' },
    nextStages: [
      { condition: { key: 'exit_path', value: 'close' }, code: 'exit_closure_procedure' },
      { condition: { key: 'exit_path', value: 'restart' }, code: 'exit_restart_assessment' },
    ],
  },
  {
    code: 'exit_closure_procedure',
    name: '폐업 절차',
    lifecyclePhase: 'exit',
    completionRule: { type: 'required_tasks', taskIds: [
      'notify_employees', 'settle_lease', 'cancel_business_registration',
      'final_vat_filing', 'asset_liquidation'
    ]},
    nextStages: [],
  },
  {
    code: 'exit_restart_assessment',
    name: '재창업 역량 진단',
    lifecyclePhase: 'exit',
    completionRule: { type: 'required_inputs', keys: ['lessons_learned', 'new_capital', 'new_industry'] },
    nextStages: [{ code: 'industry_selection' }], // ← pre_launch 첫 단계로 루프백!
  },
];
```

#### 자동 생애주기 전환 로직

```typescript
// packages/shared/src/roadmap/lifecycle-transition.ts (신규 파일)

import type { LifecyclePhase } from '../types/roadmap';
import type { EnrichedMonthlyProjection } from '../types/finance';

export interface LifecycleTransitionSignal {
  currentPhase: LifecyclePhase;
  suggestedPhase: LifecyclePhase;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  triggeredBy: 'open_date' | 'revenue_signal' | 'health_score' | 'user_request';
}

/** 데이터 기반 생애주기 단계 전환 제안 */
export function detectLifecycleTransition(params: {
  currentPhase: LifecyclePhase;
  openDate: string | null;
  recentMonths: EnrichedMonthlyProjection[];    // mergeProjectionWithActuals() 결과
  healthScore: number | null;                    // Phase 2: 사업 건강도
}): LifecycleTransitionSignal | null {
  const { currentPhase, openDate, recentMonths } = params;

  // pre_launch → launch: 개업일 도달
  if (currentPhase === 'pre_launch' && openDate) {
    const daysOpen = Math.floor((Date.now() - new Date(openDate).getTime()) / 86400000);
    if (daysOpen >= 0) {
      return { currentPhase, suggestedPhase: 'launch', reason: '개업일이 지났습니다.', confidence: 'high', triggeredBy: 'open_date' };
    }
  }

  // launch → operations: 3개월 경과 + BEP 달성
  if (currentPhase === 'launch' && recentMonths.length >= 3) {
    const last3 = recentMonths.slice(-3);
    const allOnTrack = last3.every(m => m.isOnTrack === true);
    if (allOnTrack) {
      return { currentPhase, suggestedPhase: 'operations', reason: '3개월 연속 손익분기점을 달성했습니다.', confidence: 'high', triggeredBy: 'revenue_signal' };
    }
  }

  // operations → crisis: 매출 30% 급감 (2개월 연속)
  if (currentPhase === 'operations' && recentMonths.length >= 2) {
    const last2 = recentMonths.slice(-2);
    const severeDecline = last2.every(m =>
      m.revenueVariancePct !== null && m.revenueVariancePct < -30
    );
    if (severeDecline) {
      return { currentPhase, suggestedPhase: 'crisis', reason: '2개월 연속 매출이 목표 대비 30% 이상 하락했습니다.', confidence: 'medium', triggeredBy: 'revenue_signal' };
    }
  }

  return null;
}
```

#### `buildRoadmapState()` 확장

```typescript
// packages/shared/src/roadmap/workflow.ts 수정

// 기존 buildRoadmapState() 시그니처:
// buildRoadmapState(workspace: BootstrappedWorkspace): RoadmapState

// 수정 후:
export function buildRoadmapState(
  workspace: BootstrappedWorkspace,
  lifecyclePhase?: LifecyclePhase,  // ★ 신규 파라미터
): RoadmapState {
  // lifecyclePhase에 따라 다른 스테이지 세트 로드
  const stages = getStagesForPhase(lifecyclePhase ?? 'pre_launch');
  // ... 기존 로직 유지
}

function getStagesForPhase(phase: LifecyclePhase): RoadmapStageDefinition[] {
  switch (phase) {
    case 'pre_launch': return STARTER_STAGES;          // starter-data.ts 기존
    case 'launch':     return LAUNCH_PHASE_STAGES;
    case 'operations': return OPERATIONS_PHASE_STAGES;
    case 'growth':     return GROWTH_PHASE_STAGES;     // Phase 2
    case 'crisis':     return CRISIS_PHASE_STAGES;
    case 'exit':       return EXIT_PHASE_STAGES;
  }
}
```

---

## 5. Phase 2 — 설계 개요

Phase 2 기능은 Phase 1 인프라 위에 구축됩니다. 아키텍처 포인트만 정리합니다.

### 5-1. AI 자동 장부·회계 엔진 (6개월 후)

```
[daily_transactions 테이블] ← Phase 1에서 구축
            ↓
[packages/ai/src/accounting/classify.ts]  ← 신규
  classifyTransaction(description, amount) → { category, vatDeductible, notes }
  (Claude Haiku — 저비용 분류)
            ↓
[packages/operations/src/accounting/ledger.ts]  ← 신규
  generateMonthlyLedger(userId, month) → LedgerReport
  generateVatReport(userId, period) → VatDeclarationData
            ↓
홈택스 연동 검토 (공공API)
```

### 5-2. 직원 스케줄링

```typescript
// packages/operations/src/scheduling/types.ts
export interface ShiftSchedule {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;   // HH:MM
  endTime: string;
  breakMinutes: number;
  role: string;
  estimatedLaborCost: number;
}

// daily_transactions의 labor_cost와 자동 연동
// 근무 패턴 분석 → 최적 인원 배치 AI 제안
```

### 5-3. AI 마케팅 콘텐츠 생성

```typescript
// packages/ai/src/marketing/content.ts
// 기존 generateDashboardActions()와 동일한 패턴
// DashboardContext + 업종별 성수기/비수기 데이터 → 콘텐츠 아이디어
```

### 5-4. 사업 건강 진단 스코어

```typescript
// packages/operations/src/health/score.ts

export interface BusinessHealthScore {
  overall: number;           // 0~100
  financial: number;         // 재무 건강도 (P&L 기반)
  operational: number;       // 운영 효율 (KPI 달성률)
  compliance: number;        // 법무/세금 이행도
  growth: number;            // 성장 모멘텀

  alerts: HealthAlert[];
  recommendations: string[];
  trend: 'improving' | 'stable' | 'declining';
}

// 기존 generateDashboardActions()의 DashboardContext.healthScore를 이 타입으로 교체
```

### 5-5. 리뷰 통합 관리

```typescript
// packages/integrations/src/reviews/
// 네이버 플레이스, 카카오맵, 구글 리뷰 어댑터
// 통합 대시보드 + AI 답변 생성 (Claude)
```

---

## 6. 구현 순서와 의존성 그래프

### 의존성 그래프

```
[0] 공통 타입 확장 (LifecyclePhase, 확장된 CompletionRule, KnowledgeCategory)
         |
    ┌────┼────┬─────────────┐
    ↓    ↓    ↓             ↓
[1A] 생애주기  [1B] daily_   [1C] subsidy_  [1D] operation_
     로드맵    transactions  programs       templates
     확장      스키마        스키마          스키마
    ↓    ↓    ↓             ↓             ↓
[2A] 생애주기  [2B] 손익    [2C] 지원금    [2D] 업종별
     전환      통합 뷰      매칭 엔진      KPI 대시보드
     감지
         |         |             |
         └────┬────┘             ↓
              ↓            [3A] 세금 캘린더
         [3B] AI           통합
         대시보드
         업그레이드
              |
              ↓
         [4] Phase 2 기능들
```

### 스프린트별 구현 계획 (주 단위)

| 주차 | 작업 | 파일 / 마이그레이션 | 완료 기준 |
|------|------|-------------------|---------|
| W1 | 공통 타입 확장 | `types/roadmap.ts`, `types/freshness.ts` | TypeScript 컴파일 통과 |
| W1 | 생애주기 로드맵 데이터 | `lifecycle-roadmap.ts` (신규) | 6개 phase 정의 완료 |
| W2 | `buildRoadmapState()` 확장 | `roadmap/workflow.ts` | 기존 테스트 통과 + 신규 phase 테스트 |
| W2 | daily_transactions 마이그레이션 | `000030_daily_transactions.sql` | Supabase 적용 완료 |
| W3 | ManualInputAdapter 구현 | `integrations/pos/manual-adapter.ts` | 수동 입력 → NormalizedDailyTransaction 변환 |
| W3 | `mergeProjectionWithActuals()` 구현 | `types/finance.ts` | 단위 테스트 통과 |
| W4 | 손익 대시보드 훅 분리 | `usePnLDashboard.ts` (신규) | `useDashboard.ts`에서 분리 |
| W4 | subsidy_programs 마이그레이션 | `000029_subsidy_programs_v2.sql` | Supabase 적용 + RLS 확인 |
| W5 | `loadEligibleSubsidies()` 구현 | `supabase/subsidies.ts` (신규) | DB 연동 확인 |
| W5 | `useSubsidies.ts` 훅 구현 | `apps/web/app/lib/useSubsidies.ts` | UI 연결 가능 상태 |
| W6 | `generateTaxSchedule()` 구현 | `operations/tax/calendar.ts` (신규) | 4대 세금 일정 생성 정확성 확인 |
| W6 | user_tax_events 마이그레이션 | `000031_tax_calendar.sql` | Supabase 적용 완료 |
| W7 | 업종별 템플릿 데이터 (식당/카페/유통) | `operations/templates/data/*.ts` | 3개 업종 KPI 정의 완료 |
| W7 | operation_templates 마이그레이션 | `000032_operation_templates.sql` | Supabase 시드 완료 |
| W8 | 생애주기 전환 감지 로직 | `roadmap/lifecycle-transition.ts` (신규) | 4개 전환 조건 단위 테스트 |
| W8 | 통합 테스트 및 UI 연결 | `apps/web/` | E2E 테스트 통과 |

---

## 7. 성능 및 확장성 고려사항

### 7-1. 데이터베이스 성능

**현재 위험 포인트:**
- `monthly_actuals` 뷰는 daily_transactions를 실시간 집계 → 사용자 수 증가 시 느려짐
- 해결: PostgreSQL `MATERIALIZED VIEW` + `pg_cron` 으로 매일 자정 갱신

```sql
-- monthly_actuals를 구체화 뷰로 전환
CREATE MATERIALIZED VIEW monthly_actuals_mv AS
SELECT ... FROM daily_transactions GROUP BY ...;

-- pg_cron: 매일 오전 2시 갱신
SELECT cron.schedule('refresh-monthly-actuals', '0 2 * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_actuals_mv');
```

**인덱스 전략:**
- `daily_transactions(user_id, date DESC)` — 사용자별 최근 데이터 빠른 조회
- `subsidy_programs(status, application_close_date)` — 마감임박 지원금 정렬
- `user_tax_events(user_id, due_date)` — D-day 알림 처리

### 7-2. AI 비용 최적화

현재 `packages/ai/src/`의 AI 호출은 요청당 발생합니다. 기능이 늘어나면 비용이 폭증합니다.

**캐싱 전략:**
```typescript
// packages/ai/src/cache.ts (신규)
// 동일 입력에 대한 AI 결과를 24시간 캐시
// Supabase ai_response_cache 테이블 활용

export async function cachedAiCall<T>(
  cacheKey: string,
  ttlHours: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = await loadAiCache(cacheKey);
  if (cached && !isExpired(cached, ttlHours)) return cached.response as T;

  const result = await fn();
  await saveAiCache(cacheKey, result);
  return result;
}
```

**모델 선택 기준 (기존 패턴 유지):**
| 용도 | 모델 | 이유 |
|------|------|------|
| 세금/지원금 분류 | Claude Haiku | 저비용, 충분한 정확도 |
| 계약서 분석 | Claude Sonnet | 고정확도 필요 |
| 일일 액션 생성 | OpenAI GPT-mini | 속도 중심 |
| 생애주기 전환 조언 | Claude Sonnet | 중요 의사결정 |

### 7-3. `useDashboard.ts` 분리 전략

현재 `useDashboard.ts`가 비대해질 위험이 있습니다. Phase 1 기능 추가 전에 분리를 권장합니다.

```
useDashboard.ts (기존, 오케스트레이션 유지)
    ├── useRoadmap.ts         ← 로드맵 상태 + 단계 전환
    ├── usePnLDashboard.ts    ← 손익 데이터 (신규)
    ├── useSubsidies.ts       ← 지원금 매칭 (신규)
    ├── useTaxCalendar.ts     ← 세금 캘린더 (신규)
    └── useOperationTemplate.ts ← 업종별 템플릿 (신규)
```

### 7-4. 외부 API 연동 안정성

POS/카드사 API는 다운될 수 있습니다. `ManualInputAdapter` → `NicePaymentsAdapter` 계층 구조로 폴백을 보장합니다.

```typescript
// packages/integrations/src/pos/adapter-registry.ts
export function getAdapter(provider: string): FinancialDataAdapter {
  const adapters: Record<string, FinancialDataAdapter> = {
    manual: ManualInputAdapter,
    nice_payments: NicePaymentsAdapter,  // Phase 2
    kakao_pay: KakaoPayAdapter,          // Phase 2
  };
  return adapters[provider] ?? ManualInputAdapter; // 폴백: 수동 입력
}
```

### 7-5. 신선도 시스템 자동화

현재 `FreshnessStatus`는 수동 업데이트 의존. 지원금/세금 마감일은 자동화가 필요합니다.

```sql
-- Supabase Edge Function + pg_cron으로 자동 갱신
-- 매일 자정: 만료된 지원금 status → 'closed' 업데이트
CREATE OR REPLACE FUNCTION auto_close_expired_subsidies()
RETURNS void AS $$
  UPDATE subsidy_programs
  SET status = 'closed', updated_at = NOW()
  WHERE status IN ('open', 'upcoming')
    AND application_close_date < CURRENT_DATE;
$$ LANGUAGE sql;

SELECT cron.schedule('auto-close-subsidies', '0 0 * * *',
  'SELECT auto_close_expired_subsidies()');
```

---

## 부록: 파일 변경 요약

### 수정할 기존 파일

| 파일 | 변경 내용 |
|------|---------|
| `packages/shared/src/types/roadmap.ts` | `CompletionRule` 유니온 타입 확장, `LifecyclePhase` 추가, `RoadmapStageState.lifecyclePhase` 추가 |
| `packages/shared/src/types/freshness.ts` | `KnowledgeCategory` 타입 확장 |
| `packages/shared/src/types/finance.ts` | `EnrichedMonthlyProjection` 추가, `mergeProjectionWithActuals()` 추가 |
| `packages/shared/src/roadmap/workflow.ts` | `buildRoadmapState()` lifecyclePhase 파라미터, `evaluateStageCompletion()` 신규 규칙 처리 |
| `packages/shared/src/business-context.ts` | `BusinessContext.defaultTemplateId` 추가 |
| `packages/ai/src/programs/match.ts` | `SubsidyProgram` 타입 지원, `lifecyclePhase` 컨텍스트 추가 |
| `packages/ai/src/dashboard/actions.ts` | `DashboardContext` 확장 (revenueVariancePct, monthlyTrend 등) |
| `apps/web/app/lib/useDashboard.ts` | 서브 훅으로 분리 (useSubsidies, usePnLDashboard 등 추출) |

### 신규 추가 파일

| 파일 | 목적 |
|------|------|
| `packages/shared/src/lifecycle-roadmap.ts` | 생애주기별 스테이지 정의 |
| `packages/shared/src/roadmap/lifecycle-transition.ts` | 자동 전환 감지 로직 |
| `packages/shared/src/supabase/subsidies.ts` | 지원금 DB 접근 레이어 |
| `packages/operations/src/tax/calendar.ts` | 세금 캘린더 생성 |
| `packages/operations/src/templates/types.ts` | 운영 템플릿 타입 |
| `packages/operations/src/templates/data/*.ts` | 업종별 템플릿 데이터 |
| `packages/integrations/src/types.ts` | 어댑터 공통 타입 |
| `packages/integrations/src/pos/manual-adapter.ts` | 수동 입력 어댑터 |
| `apps/web/app/lib/useSubsidies.ts` | 지원금 매칭 훅 |
| `apps/web/app/lib/usePnLDashboard.ts` | 손익 대시보드 훅 |
| `apps/web/app/lib/useTaxCalendar.ts` | 세금 캘린더 훅 |
| `apps/web/app/lib/useOperationTemplate.ts` | 운영 템플릿 훅 |

### 신규 Supabase 마이그레이션

| 파일명 | 내용 |
|--------|------|
| `20260327_000029_subsidy_programs_v2.sql` | subsidy_programs + user_subsidy_applications |
| `20260327_000030_daily_transactions.sql` | daily_transactions + store_integrations |
| `20260327_000031_tax_calendar.sql` | user_tax_events + notification_queue |
| `20260327_000032_operation_templates.sql` | operation_templates + user_template_customizations |

---

*이 문서는 코드베이스 직접 분석 기반으로 작성되었으며, 구체적인 함수명·타입명·파일 경로는 현재 코드베이스의 실제 값을 참조합니다. 개발 착수 전 `workflow.ts`, `simulation.ts`, `useDashboard.ts`의 최신 코드와 교차 검증을 권장합니다.*
