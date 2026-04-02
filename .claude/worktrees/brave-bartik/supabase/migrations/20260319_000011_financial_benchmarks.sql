-- 업종별·상권 유형별 재무 벤치마크 테이블
-- 손익분기점 계산과 현금흐름 시뮬레이션의 기준 데이터로 사용됨
create table if not exists public.financial_benchmarks (
  id uuid primary key default gen_random_uuid(),

  -- 분류 키 (업종 + 상권 스타일 + 임대료 밴드 조합으로 유일)
  category_id text not null,
  market_style text not null,   -- destination | office | residential | balanced
  rent_band    text not null,   -- high | mid-high | mid | mid-low | low

  -- 월 매출 범위 (원, 1인 운영 기준 현실적 범위)
  monthly_revenue_low  integer not null,  -- 보수적 하한 (하위 25%)
  monthly_revenue_high integer not null,  -- 낙관적 상한 (상위 25%)

  -- 비용 구조 (정수 %, 소수점 불필요)
  avg_cogs_rate        integer not null,  -- 원가율 (재료비 / 매출)
  avg_labor_rate       integer not null,  -- 인건비율 (사장 외 직원 없는 경우 0)
  avg_other_fixed_rate integer not null,  -- 기타 고정비율 (관리비·보험·카드수수료 등)

  -- 월 임대료 범위 (원, 해당 rent_band 기준 실제 시세)
  monthly_rent_low  integer not null,
  monthly_rent_high integer not null,

  -- 초기 투자비 범위 (원, 인테리어 + 보증금 + 집기·설비 합산)
  setup_cost_low  integer not null,
  setup_cost_high integer not null,

  -- 참고 지표
  avg_break_even_months    integer not null,  -- 평균 손익분기 도달 개월 수
  avg_daily_customers_low  integer,            -- 일 평균 방문객 하한
  avg_daily_customers_high integer,            -- 일 평균 방문객 상한
  avg_ticket_size          integer,            -- 객단가 (원)

  notes text,

  freshness_status text not null default 'fresh'
    check (freshness_status in ('fresh', 'review_soon', 'stale', 'blocked')),
  last_checked_at timestamptz not null default now(),
  next_review_at  timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 동일 조합 중복 방지
  unique (category_id, market_style, rent_band)
);

-- 업종별 조회 인덱스
create index if not exists idx_financial_benchmarks_category_id
  on public.financial_benchmarks (category_id);

-- 업종 + 상권 스타일 복합 인덱스 (가장 빈번한 쿼리 패턴)
create index if not exists idx_financial_benchmarks_category_style
  on public.financial_benchmarks (category_id, market_style);

-- 공개 읽기 허용 (로그인 없이도 조회 가능)
alter table public.financial_benchmarks enable row level security;

create policy "financial_benchmarks_select_public"
  on public.financial_benchmarks
  for select
  using (true);

grant select on public.financial_benchmarks to anon, authenticated;
