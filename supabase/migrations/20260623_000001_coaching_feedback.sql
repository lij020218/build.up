-- Coaching feedback: AI 경영 코칭에 대한 사장님 피드백(도움됨/안맞음 + 이유) 누적.
--
-- 목적: AI 자가개선. 사장님이 "안 맞아요"(+이유)를 남기면, 다음 코칭 생성 시 그 사장님의
--       최근 부정 피드백을 prompt 에 주입해 비슷한 코칭·지표를 회피한다(사장님별 학습).
--       cross-user 집계는 SPECIALTY_KPI_PROFILE 수동 개선의 신호로도 사용(향후).
--
-- 패턴: coaching_history 와 동일 RLS (본인 select/insert/update, delete 는 service_role).
--
-- ── 데이터 모델 ────────────────────────────────────────────────────────
-- source:   'industry-daily'(웹 코칭) | 'dashboard-actions'(iOS 코칭)
-- verdict:  'up'(도움됨) | 'down'(안맞음)
-- reason:   down 일 때 이유칩 — 'industry-mismatch' | 'already-know' | 'inaccurate' | 'hard-to-act' | null
-- insight_key: 클라이언트가 만든 안정 키(헤드라인 기반) — 같은 코칭 재토글 시 upsert.

create table if not exists public.coaching_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  source text not null check (source in ('industry-daily', 'dashboard-actions')),
  insight_key text not null,                        -- 헤드라인 기반 안정 키 (재토글 upsert)
  headline text not null,
  category text,                                    -- revenue/cost/marketing/operations/growth
  target_card text,
  industry_category_id text,                        -- 큰 분류
  specialty_id text,                                -- 세부 업종

  verdict text not null check (verdict in ('up', 'down')),
  reason text check (reason in ('industry-mismatch', 'already-know', 'inaccurate', 'hard-to-act')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, insight_key)
);

create index if not exists idx_coaching_feedback_user_created
  on public.coaching_feedback(user_id, created_at desc);
-- 자가개선 루프: 최근 '안맞음' 빠른 조회.
create index if not exists idx_coaching_feedback_user_down
  on public.coaching_feedback(user_id, created_at desc)
  where verdict = 'down';

-- updated_at 자동 갱신 (coaching_history 와 동일 함수 재사용)
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'portone_set_updated_at') then
    create or replace function public.portone_set_updated_at()
    returns trigger language plpgsql as $func$
    begin new.updated_at := now(); return new; end;
    $func$;
  end if;
end $$;

drop trigger if exists trg_coaching_feedback_updated_at on public.coaching_feedback;
create trigger trg_coaching_feedback_updated_at
  before update on public.coaching_feedback
  for each row execute function public.portone_set_updated_at();

-- ── RLS — 본인 select/insert/update, delete 는 service_role ──
alter table public.coaching_feedback enable row level security;

drop policy if exists "coaching_feedback_self_select" on public.coaching_feedback;
create policy "coaching_feedback_self_select"
  on public.coaching_feedback for select
  using (auth.uid() = user_id);

drop policy if exists "coaching_feedback_self_insert" on public.coaching_feedback;
create policy "coaching_feedback_self_insert"
  on public.coaching_feedback for insert
  with check (auth.uid() = user_id);

drop policy if exists "coaching_feedback_self_update" on public.coaching_feedback;
create policy "coaching_feedback_self_update"
  on public.coaching_feedback for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.coaching_feedback is
  'AI 코칭 피드백(도움됨/안맞음+이유). 자가개선 루프가 최근 안맞음을 다음 코칭 prompt 에 주입.';
