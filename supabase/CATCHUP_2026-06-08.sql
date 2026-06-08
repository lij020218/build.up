-- ════════════════════════════════════════════════════════════════════
-- Found.One — 스키마 catch-up (2026-06-08)
--
-- 목적: prod DB 가 마이그레이션을 일부만 적용해 컬럼/테이블이 빠진 상태에서
--   나는 400/500 (user_role · business_documents · coaching_history ·
--   foundone_subscriptions · user_feedback · ga4_oauth_nonces) 을 한 번에 해소.
--
-- 안전: 전부 멱등(IF NOT EXISTS / DROP POLICY IF EXISTS / CREATE OR REPLACE /
--   ALTER ... IF EXISTS). 이미 적용된 환경에서 재실행해도 에러 없음.
--   ⚠️ 시드(seed) 데이터는 포함 안 함 — 스키마(테이블·컬럼·정책)만.
--
-- 사용: Supabase Studio → SQL Editor → 새 query → 전체 붙여넣기 → Run.
--   (CLI 가 link 돼 있으면 `supabase db push` 가 더 정석 — 적용 추적됨)
-- ════════════════════════════════════════════════════════════════════

-- ── 공용 updated_at 트리거 함수 ─────────────────────────────────────
create or replace function public.portone_set_updated_at()
returns trigger language plpgsql as $func$
begin new.updated_at := now(); return new; end;
$func$;

-- ════════ A. business_profiles.user_role + 직원 테이블 (20260329_000029) ════════
alter table public.business_profiles
  add column if not exists user_role text default 'owner'
  check (user_role in ('owner', 'staff', 'manager'));
update public.business_profiles set user_role = 'owner' where user_role is null;

create table if not exists public.store_invites (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique,
  role text not null default 'staff' check (role in ('staff', 'manager')),
  used_by uuid references auth.users(id),
  used_at timestamptz,
  expires_at timestamptz default (now() + interval '7 days'),
  created_at timestamptz default now()
);
create table if not exists public.store_members (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  member_user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('staff', 'manager')),
  joined_at timestamptz default now(),
  unique (owner_user_id, member_user_id)
);
alter table public.store_invites enable row level security;
alter table public.store_members enable row level security;
drop policy if exists "Users can manage own invites" on public.store_invites;
create policy "Users can manage own invites" on public.store_invites
  for all using (owner_user_id = auth.uid() or used_by = auth.uid());
drop policy if exists "Members can view own memberships" on public.store_members;
create policy "Members can view own memberships" on public.store_members
  for select using (owner_user_id = auth.uid() or member_user_id = auth.uid());
drop policy if exists "Owners can manage members" on public.store_members;
create policy "Owners can manage members" on public.store_members
  for all using (owner_user_id = auth.uid());

-- ════════ B. user_store_data.business_documents (20260512) ════════
alter table public.user_store_data
  add column if not exists business_documents jsonb default '[]'::jsonb;

-- ════════ C. coaching_history + 통계 뷰 (20260512) ════════
create table if not exists public.coaching_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  brief text not null check (brief in ('offline', 'startup')),
  signal_kind text not null check (signal_kind in ('critical','important','notable','good')),
  signal_headline text not null,
  signal_action text not null,
  response_taken boolean,
  response_note text,
  response_taken_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date, brief)
);
create index if not exists idx_coaching_history_user_date
  on public.coaching_history(user_id, date desc);
create index if not exists idx_coaching_history_kind
  on public.coaching_history(user_id, signal_kind, date desc) where signal_kind = 'critical';
drop trigger if exists trg_coaching_history_updated_at on public.coaching_history;
create trigger trg_coaching_history_updated_at
  before update on public.coaching_history
  for each row execute function public.portone_set_updated_at();
alter table public.coaching_history enable row level security;
drop policy if exists "coaching_history_self_select" on public.coaching_history;
create policy "coaching_history_self_select" on public.coaching_history
  for select using (auth.uid() = user_id);
drop policy if exists "coaching_history_self_insert" on public.coaching_history;
create policy "coaching_history_self_insert" on public.coaching_history
  for insert with check (auth.uid() = user_id);
drop policy if exists "coaching_history_self_update" on public.coaching_history;
create policy "coaching_history_self_update" on public.coaching_history
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace view public.v_coaching_stats_14d as
  select user_id,
    count(*) as total_days,
    count(*) filter (where response_taken = true) as actions_taken,
    count(*) filter (where signal_kind = 'critical') as critical_signals,
    count(*) filter (where signal_kind = 'important') as important_signals,
    count(*) filter (where signal_kind = 'good') as good_signals,
    case when count(*) > 0 then round(100.0 * count(*) filter (where response_taken = true) / count(*)) else 0 end as taken_rate_pct
  from public.coaching_history
  where date >= (current_date - interval '14 days')
  group by user_id;

create or replace view public.v_coaching_meta_30d as
  select user_id,
    count(*) as days_30,
    case when count(*) filter (where signal_kind = 'critical') > 0
      then round(100.0 * count(*) filter (where signal_kind = 'critical' and response_taken = true) / count(*) filter (where signal_kind = 'critical'))
      else null end as critical_taken_rate,
    count(*) filter (where extract(dow from date) in (0, 6)) as weekend_days,
    count(*) filter (where extract(dow from date) in (0, 6) and response_taken = true) as weekend_actions,
    mode() within group (order by signal_kind) as most_common_kind,
    count(*) filter (where signal_kind = 'critical' and date >= (current_date - interval '7 days')) as recent_critical_7d
  from public.coaching_history
  where date >= (current_date - interval '30 days')
  group by user_id having count(*) >= 14;

grant select, insert, update on public.coaching_history to authenticated;
grant select on public.v_coaching_stats_14d to authenticated;
grant select on public.v_coaching_meta_30d to authenticated;

-- ════════ D. 구독·결제 (20260526 생성 + 20260529 rename) ════════
-- 구버전 이름이 있으면 rename, 둘 다 없으면 아래 CREATE 가 새로 생성.
alter table if exists public.buildup_subscriptions rename to foundone_subscriptions;
alter table if exists public.buildup_payments      rename to foundone_payments;

create table if not exists public.foundone_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  plan text not null default 'free' check (plan in ('free','premium')),
  status text not null default 'active' check (status in ('active','canceled','past_due')),
  billing_key text,
  billing_method_label text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists foundone_subscriptions_user_id_key on public.foundone_subscriptions(user_id);
alter table public.foundone_subscriptions enable row level security;
drop policy if exists "foundone_subscriptions_self_select" on public.foundone_subscriptions;
create policy "foundone_subscriptions_self_select" on public.foundone_subscriptions
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "foundone_subscriptions_service_all" on public.foundone_subscriptions;
create policy "foundone_subscriptions_service_all" on public.foundone_subscriptions
  for all to service_role using (true) with check (true);
drop trigger if exists trg_foundone_subscriptions_updated_at on public.foundone_subscriptions;
create trigger trg_foundone_subscriptions_updated_at
  before update on public.foundone_subscriptions
  for each row execute function public.portone_set_updated_at();

create table if not exists public.foundone_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  portone_payment_id text unique not null,
  amount integer not null check (amount > 0),
  currency text not null default 'KRW',
  status text not null,
  plan text not null default 'premium',
  paid_at timestamptz,
  created_at timestamptz default now()
);
alter table public.foundone_payments enable row level security;
drop policy if exists "foundone_payments_self_select" on public.foundone_payments;
create policy "foundone_payments_self_select" on public.foundone_payments
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "foundone_payments_service_all" on public.foundone_payments;
create policy "foundone_payments_service_all" on public.foundone_payments
  for all to service_role using (true) with check (true);

-- ════════ E. user_feedback + area/status (20260608_000001 + 000002) ════════
create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'other',
  message text not null,
  context jsonb default '{}'::jsonb,
  area text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
-- 이미 테이블이 있던 환경에는 area/status 컬럼만 보강
alter table public.user_feedback add column if not exists area text;
alter table public.user_feedback add column if not exists status text not null default 'new';
create index if not exists user_feedback_status_created_idx on public.user_feedback (status, created_at desc);
create index if not exists user_feedback_area_idx on public.user_feedback (area);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'user_feedback_status_check') then
    alter table public.user_feedback add constraint user_feedback_status_check
      check (status in ('new','reviewing','resolved','wontfix'));
  end if;
end $$;
alter table public.user_feedback enable row level security;
drop policy if exists "user_feedback_self_insert" on public.user_feedback;
create policy "user_feedback_self_insert" on public.user_feedback
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "user_feedback_self_select" on public.user_feedback;
create policy "user_feedback_self_select" on public.user_feedback
  for select to authenticated using (auth.uid() = user_id);

-- ════════ F. ga4_oauth_nonces (20260607_000001) ════════
create table if not exists public.ga4_oauth_nonces (
  nonce text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour'),
  consumed_at timestamptz
);
create index if not exists ga4_oauth_nonces_user_id_idx on public.ga4_oauth_nonces(user_id);
create index if not exists ga4_oauth_nonces_expires_at_idx on public.ga4_oauth_nonces(expires_at);
alter table public.ga4_oauth_nonces enable row level security;

-- ════════ 적용 확인 (선택) ════════
-- select
--   (select count(*) from information_schema.columns where table_name='business_profiles' and column_name='user_role') as user_role,
--   (select count(*) from information_schema.columns where table_name='user_store_data' and column_name='business_documents') as business_documents,
--   to_regclass('public.coaching_history') as coaching_history,
--   to_regclass('public.foundone_subscriptions') as foundone_subscriptions,
--   to_regclass('public.user_feedback') as user_feedback,
--   (select count(*) from information_schema.columns where table_name='user_feedback' and column_name='area') as feedback_area;
