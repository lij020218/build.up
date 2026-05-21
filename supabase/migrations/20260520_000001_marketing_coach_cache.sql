-- ─────────────────────────────────────────────────────────────
--  marketing_coach_cache
--
--  AI 마케팅 코칭 액션을 Supabase 에 캐시 — 웹/모바일 동기화 보장.
--  웹의 zustand localStorage 캐시를 서버 캐시로 승격.
--
--  이전: 각 플랫폼이 /api/ai/marketing/coach 를 독립 호출 → 같은 사장님이
--        웹과 모바일에서 다른 액션 보게 됨.
--  이후: 서버가 (user_id, week_key, context_key) 캐시 → 두 플랫폼 모두 동일 결과.
--
--  키 정책:
--    • week_key       : ISO 주차 "YYYY-Www" (예: "2026-W19") — 매주 월요일 갱신
--    • context_key    : "storeName|subIndustryId|language" — 컨텍스트 변경 시 갱신
--    • 같은 user_id 라도 컨텍스트가 다르면 다른 row 로 보존 (잦은 토글 시 재호출 회피)
--
--  TTL: 같은 사용자가 일주일 이상 미사용 시 자동 정리 (cleanup job — Phase 2 에서 추가).
-- ─────────────────────────────────────────────────────────────

create table if not exists public.marketing_coach_cache (
  user_id      uuid not null references auth.users(id) on delete cascade,
  week_key     text not null,                           -- "2026-W19"
  context_key  text not null,                           -- "storeName|subIndustryId|language"
  actions      jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (user_id, week_key, context_key)
);

create index if not exists idx_marketing_coach_cache_user
  on public.marketing_coach_cache (user_id, week_key desc);

-- RLS: 본인 row 만 read/write
alter table public.marketing_coach_cache enable row level security;

drop policy if exists "marketing_coach_cache_select_own" on public.marketing_coach_cache;
create policy "marketing_coach_cache_select_own"
  on public.marketing_coach_cache
  for select
  using (auth.uid() = user_id);

drop policy if exists "marketing_coach_cache_insert_own" on public.marketing_coach_cache;
create policy "marketing_coach_cache_insert_own"
  on public.marketing_coach_cache
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "marketing_coach_cache_update_own" on public.marketing_coach_cache;
create policy "marketing_coach_cache_update_own"
  on public.marketing_coach_cache
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "marketing_coach_cache_delete_own" on public.marketing_coach_cache;
create policy "marketing_coach_cache_delete_own"
  on public.marketing_coach_cache
  for delete
  using (auth.uid() = user_id);

comment on table public.marketing_coach_cache is
  'AI 마케팅 코칭 액션 캐시 — 웹/모바일이 같은 결과를 보도록 서버 측에 저장. ISO 주차 + 컨텍스트키 기반 캐시 무효화.';
comment on column public.marketing_coach_cache.week_key is
  'ISO 주차 (예: 2026-W19) — 매주 월요일 시작. 주가 바뀌면 cache miss 처리.';
comment on column public.marketing_coach_cache.context_key is
  'storeName|subIndustryId|language — 컨텍스트가 바뀌면 cache miss 처리.';
