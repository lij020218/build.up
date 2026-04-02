-- ─── 지원 프로그램 테이블 ─────────────────────────────────────────────────────
-- 정부·대기업·민간·지자체·대회 등 모든 창업 지원 프로그램을 통합 관리합니다.

create table if not exists public.support_programs (
  id uuid primary key default gen_random_uuid(),
  program_key text not null unique,
  category text not null,  -- government | private | local | corporate | competition
  name_ko text not null,
  name_en text not null,
  organizer_ko text not null,
  organizer_en text not null,
  target_ko text not null,
  target_en text not null,
  benefit_ko text not null,
  benefit_en text not null,
  amount text,
  season_ko text,
  season_en text,
  url text,
  for_small_biz boolean not null default false,
  for_franchise boolean not null default false,
  highlight boolean not null default false,
  max_age integer,
  business_year_min integer,
  business_year_max integer,
  industries text[],
  regions text[],
  application_status text not null default 'upcoming',  -- open | upcoming | closed
  application_deadline timestamptz,
  application_open_date timestamptz,
  required_docs jsonb default '[]'::jsonb,
  eligibility_criteria jsonb default '{}'::jsonb,
  freshness_status text not null default 'review_soon',
  last_checked_at timestamptz,
  next_review_at timestamptz,
  data_year text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_support_programs_category on public.support_programs(category);
create index idx_support_programs_status on public.support_programs(application_status);
create index idx_support_programs_deadline on public.support_programs(application_deadline);
create index idx_support_programs_active on public.support_programs(is_active) where is_active = true;

-- RLS: 지원 프로그램은 모든 인증 사용자에게 읽기 허용 (공개 정보)
alter table public.support_programs enable row level security;

create policy "support_programs_select_all"
  on public.support_programs for select
  using (is_active = true);

-- updated_at 자동 갱신 트리거
create or replace function update_support_programs_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_support_programs_updated_at
  before update on public.support_programs
  for each row execute function update_support_programs_updated_at();
