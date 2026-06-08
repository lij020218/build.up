-- 인앱 피드백 — 출시 초기 사장님 의견 수집 (무료·자체 소유·맥락 포함).
--   외부 폼(구글폼/Tally) 의존 없이 Supabase 에 적재 → 대시보드에서 직접 열람.
--   category: bug(오류) | idea(제안) | ux(사용성) | other(기타)
--   context jsonb: { platform: "web"|"ios", screen, appVersion, userAgent } 등 진단 맥락.

create table if not exists public.user_feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category    text not null default 'other',
  message     text not null,
  context     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_user_feedback_created on public.user_feedback(created_at desc);
create index if not exists idx_user_feedback_user on public.user_feedback(user_id, created_at desc);

alter table public.user_feedback enable row level security;

-- 본인 피드백만 작성/조회 (service_role 은 RLS 우회 → 사장님이 대시보드에서 전체 열람).
create policy "user_feedback_self_insert"
  on public.user_feedback for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_feedback_self_select"
  on public.user_feedback for select to authenticated
  using (auth.uid() = user_id);
