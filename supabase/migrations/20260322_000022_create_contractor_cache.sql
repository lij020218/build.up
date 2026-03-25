-- Contractor search result cache
-- Keyed by (region_label, category_id), refreshed every 30 days
-- Source: Kakao Local Search API

create table if not exists public.contractor_cache (
  id            uuid primary key default gen_random_uuid(),
  region_label  text not null,
  category_id   text not null,
  keyword       text not null,
  results       jsonb not null default '[]',
  fetched_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '30 days'),

  unique (region_label, category_id)
);

comment on table public.contractor_cache is
  '상권별·업종별 인테리어 업체 검색 결과 캐시 (OpenAI web search, TTL 30일)';
comment on column public.contractor_cache.region_label is
  '사용자가 입력한 상권 이름 (예: 홍대, 강남, 이태원)';
comment on column public.contractor_cache.category_id is
  '업종 ID (예: cafe-dessert, food, beauty)';
comment on column public.contractor_cache.keyword is
  '실제 검색에 사용된 키워드 (예: 카페 인테리어 전문 홍대)';
comment on column public.contractor_cache.results is
  '검색 결과 배열: [{name, category, address, phone, placeUrl}]';

-- Service role full access; anon read only
alter table public.contractor_cache enable row level security;

create policy "anon can read contractor cache"
  on public.contractor_cache for select
  using (true);

create policy "service role full access contractor cache"
  on public.contractor_cache for all
  using (auth.role() = 'service_role');
