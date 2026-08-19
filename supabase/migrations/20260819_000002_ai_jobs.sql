-- ═══════════════════════════════════════════════════════════════════════
-- ai_jobs — 장시간 AI 생성의 비동기 작업 원장 (2026-08-19)
--
-- 왜: 로드맵 생성(Pass1+Pass2)이 prod 에서 120s 를 넘겨 클라이언트 타임아웃/504 가 났다.
--   사장님 규칙 — "타임아웃은 정말 심각한 버그". 응답을 즉시(202 {jobId}) 돌려주고 실제 생성은
--   같은 인보케이션의 after() 에서 이어 가며, 클라이언트(웹·iOS)는 GET /api/ai/jobs/[id] 로 폴링한다.
--
-- 성격: **사용자 데이터** (user_id 스코프). 계정 초기화/삭제 시 삭제 (USER_TABLES 등재).
--   · 쓰기: 서버(service role)만 — insert(queued) → running → succeeded|failed
--   · 읽기: 본인 것만 (RLS select). GET /api/ai/jobs/[id] 도 service role 로 읽되 user_id 필터.
--   · feature: 'roadmap-generate' (지금) / 'business-plan-generate' · 'contract-analyze' (후속 채택)
--   · expires_at: 생성 후 1일. 만료 행은 purge_expired_ai_jobs() 로 정리(크론 선택).
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.ai_jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  feature     text not null,
  status      text not null default 'queued'
              check (status in ('queued', 'running', 'succeeded', 'failed')),
  input       jsonb,
  result      jsonb,
  error       text,
  progress    text,
  created_at  timestamptz not null default now(),
  started_at  timestamptz,
  finished_at timestamptz,
  expires_at  timestamptz not null default (now() + interval '1 day')
);

create index if not exists idx_ai_jobs_user_created
  on public.ai_jobs(user_id, created_at desc);

create index if not exists idx_ai_jobs_expires
  on public.ai_jobs(expires_at);

alter table public.ai_jobs enable row level security;

create policy "ai_jobs_self_select"
  on public.ai_jobs for select to authenticated
  using (auth.uid() = user_id);

-- insert/update/delete 는 서버(service role)만 — 클라이언트 정책 미부여.
grant select, insert, update, delete on table public.ai_jobs to service_role;

-- 만료 행 정리 (크론에서 호출 가능). SECURITY DEFINER → PUBLIC 실행 금지(2026-07-15 보안 감사 규칙).
create or replace function public.purge_expired_ai_jobs()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.ai_jobs where expires_at < now();
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.purge_expired_ai_jobs() from public;
grant execute on function public.purge_expired_ai_jobs() to service_role;

comment on table public.ai_jobs is
  '비동기 AI 작업 원장 — 202 {jobId} 즉시 응답 + after() 생성 + GET /api/ai/jobs/[id] 폴링. 서버 쓰기, 본인 select.';
