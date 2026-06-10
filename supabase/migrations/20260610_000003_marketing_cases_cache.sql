-- ─────────────────────────────────────────────────────────────
--  marketing_cases_cache
--
--  업종별 "최신 한국 마케팅 성공사례 → 내 사업 적용" 플레이(plays) 캐시.
--  /api/ai/marketing/cases 가 OpenAI web_search 로 사례·트렌드를 조사한 뒤
--  사용자 사업에 맞춘 적용안까지 구조화해 저장. 웹·iOS 동일 결과 보장.
--
--  marketing_coach_cache 와 동일한 키 정책:
--    • week_key     : ISO 주차 "YYYY-Www" — 매주 월요일 갱신
--    • context_key  : "storeName|subIndustryId|language" — 컨텍스트 변경 시 갱신
--    • plays        : MarketingPlay[] (kind: case|trend, source, application, tools)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.marketing_cases_cache (
  user_id      uuid not null references auth.users(id) on delete cascade,
  week_key     text not null,
  context_key  text not null,
  plays        jsonb not null default '[]'::jsonb,
  sources      jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (user_id, week_key, context_key)
);

create index if not exists idx_marketing_cases_cache_user
  on public.marketing_cases_cache (user_id, week_key desc);

alter table public.marketing_cases_cache enable row level security;

drop policy if exists "marketing_cases_cache_select_own" on public.marketing_cases_cache;
create policy "marketing_cases_cache_select_own"
  on public.marketing_cases_cache for select
  using (auth.uid() = user_id);

drop policy if exists "marketing_cases_cache_insert_own" on public.marketing_cases_cache;
create policy "marketing_cases_cache_insert_own"
  on public.marketing_cases_cache for insert
  with check (auth.uid() = user_id);

drop policy if exists "marketing_cases_cache_update_own" on public.marketing_cases_cache;
create policy "marketing_cases_cache_update_own"
  on public.marketing_cases_cache for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "marketing_cases_cache_delete_own" on public.marketing_cases_cache;
create policy "marketing_cases_cache_delete_own"
  on public.marketing_cases_cache for delete
  using (auth.uid() = user_id);

-- GRANT 명시 — 이 DB 는 default privilege 부재로 42501 이력 3회(20260429/20260503/20260517).
-- cases 라우트는 service_role 로 읽고 쓰지만, default privilege 가 없는 환경에선
-- service_role 도 명시 GRANT 가 필요할 수 있어 둘 다 부여.
grant select, insert, update, delete on table public.marketing_cases_cache to authenticated;
grant select, insert, update, delete on table public.marketing_cases_cache to service_role;

comment on table public.marketing_cases_cache is
  '업종별 최신 마케팅 성공사례→내 사업 적용 plays 캐시. 웹/iOS 동일 결과. ISO 주차 + 컨텍스트키 무효화.';
