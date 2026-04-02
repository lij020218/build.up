create table if not exists public.market_location_signals (
  id uuid primary key default gen_random_uuid(),
  region_key text not null unique,
  region_name text not null,
  district_name text,
  category_id text,
  search_keywords text[] not null default '{}'::text[],
  market_style text not null,
  rent_band text not null,
  competition_level text not null,
  demand_level text not null,
  access_level text not null,
  category_fit_level text not null,
  base_score integer not null,
  summary text,
  evidence jsonb not null default '{}'::jsonb,
  freshness_status text not null default 'review_soon',
  last_checked_at timestamptz,
  next_review_at timestamptz,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_market_location_signals_category_id
  on public.market_location_signals(category_id);

create index if not exists idx_market_location_signals_region_name
  on public.market_location_signals(region_name);

alter table public.market_location_signals enable row level security;

create policy "market_location_signals_select_public"
on public.market_location_signals
for select
using (is_active = true);

grant select on public.market_location_signals to anon, authenticated;
