-- ─────────────────────────────────────────────────────────────
--  marketing_play_progress
--
--  사장님이 "이번 주 마케팅 플레이"를 실제로 했는지 체크("했어요") 기록.
--  목적: 실행→측정 피드백 루프 — 다음 주 cases 엔진이 "지난주 한 것"을 보고
--        중복 없이 다음 단계를 추천. 웹/iOS 체크 상태 동기화.
--
--  키: (user_id, week_key, play_title)
--    • week_key   : ISO 주차 "YYYY-Www" — 플레이가 생성된 주차
--    • play_title : 플레이 제목(주차 내 안정 식별자). 플레이는 ID 가 없으므로 제목으로 키.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.marketing_play_progress (
  user_id     uuid not null references auth.users(id) on delete cascade,
  week_key    text not null,
  play_title  text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, week_key, play_title)
);

create index if not exists idx_marketing_play_progress_user_week
  on public.marketing_play_progress (user_id, week_key);

alter table public.marketing_play_progress enable row level security;

drop policy if exists "marketing_play_progress_select_own" on public.marketing_play_progress;
create policy "marketing_play_progress_select_own"
  on public.marketing_play_progress for select using (auth.uid() = user_id);

drop policy if exists "marketing_play_progress_insert_own" on public.marketing_play_progress;
create policy "marketing_play_progress_insert_own"
  on public.marketing_play_progress for insert with check (auth.uid() = user_id);

-- upsert(ON CONFLICT DO UPDATE) 충돌 경로용 — 이미 체크된 플레이 재-POST(더블클릭/refetch
-- 레이스) 시 update 정책이 없으면 42501 → 500. (2026-06-10 감사 P1-3)
drop policy if exists "marketing_play_progress_update_own" on public.marketing_play_progress;
create policy "marketing_play_progress_update_own"
  on public.marketing_play_progress for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "marketing_play_progress_delete_own" on public.marketing_play_progress;
create policy "marketing_play_progress_delete_own"
  on public.marketing_play_progress for delete using (auth.uid() = user_id);

-- GRANT 명시 — 이 DB 는 default privilege 부재로 42501 이력 3회(20260429/20260503/20260517).
-- play-progress 라우트는 user-scoped(authenticated) 클라이언트로 직접 읽고 씀.
grant select, insert, update, delete on table public.marketing_play_progress to authenticated;
grant select, insert, update, delete on table public.marketing_play_progress to service_role;

comment on table public.marketing_play_progress is
  '마케팅 플레이 실행 체크("했어요"). 실행→측정 피드백 루프 + 웹/iOS 동기화. (user_id, week_key, play_title).';
