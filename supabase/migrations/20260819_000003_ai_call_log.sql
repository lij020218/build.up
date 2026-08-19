-- ═══════════════════════════════════════════════════════════════════════
-- ai_call_log — LLM 호출 관측 원장 (2026-08-19)
--
-- 왜: ai-guard 3원칙(한도·재시도·환불) 이후 "실제로 얼마나 실패·폴백·지연되는가"를
--     운영자가 볼 수 있는 곳이 없었다. packages/ai utils/client.ts 의 LlmCallEvent 를
--     호출 1건 = 1행으로 적재하고, /admin/usage 에서 기능별 성공률·p50/p95·폴백률을 본다.
--   · service role 전용 (RLS on, 정책 없음). user_id 는 nullable(익명·컨텍스트 없음).
--   · 운영 로그 — 30일 지나면 purge_ai_call_log 가 자동 파기 (pg_cron 있을 때 매일 19:30 UTC).
--   · 초기화(reset)·계정 삭제 대상 아님 (account-wipe-coverage INTENTIONALLY_RETAINED 선언).
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.ai_call_log (
  id              bigserial primary key,
  created_at      timestamptz not null default now(),
  user_id         uuid,                       -- FK 없음: 계정 삭제 후에도 통계 보존, 30일 파기
  feature         text,
  requested_model text,
  used_model      text,
  ms              int,
  ok              boolean,
  fallback        boolean,
  circuit_skipped boolean,
  input_tokens    int,
  output_tokens   int,
  error_name      text,
  error_message   text
);
create index if not exists ai_call_log_created_idx on public.ai_call_log (created_at desc);
create index if not exists ai_call_log_feature_created_idx on public.ai_call_log (feature, created_at desc);

alter table public.ai_call_log enable row level security;
revoke all on table public.ai_call_log from anon, authenticated;
grant select, insert, update, delete on table public.ai_call_log to service_role;
grant usage, select on sequence public.ai_call_log_id_seq to service_role;

-- ── 기능별 집계 (원시 행을 앱으로 끌어오지 않기 위한 SQL 집계) ───────────────
--   p_since 이후 행을 feature 별로: 호출수·성공·폴백·서킷스킵·p50/p95 ms·토큰 합.
create or replace function public.ai_call_stats(p_since timestamptz)
returns table (
  feature          text,
  calls            bigint,
  ok_calls         bigint,
  fallback_calls   bigint,
  circuit_skipped  bigint,
  p50_ms           int,
  p95_ms           int,
  input_tokens     bigint,
  output_tokens    bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(l.feature, '(unknown)')                                              as feature,
    count(*)                                                                      as calls,
    count(*) filter (where l.ok)                                                  as ok_calls,
    count(*) filter (where l.fallback)                                            as fallback_calls,
    count(*) filter (where l.circuit_skipped)                                     as circuit_skipped,
    (percentile_cont(0.5)  within group (order by l.ms))::int                     as p50_ms,
    (percentile_cont(0.95) within group (order by l.ms))::int                     as p95_ms,
    coalesce(sum(l.input_tokens), 0)::bigint                                      as input_tokens,
    coalesce(sum(l.output_tokens), 0)::bigint                                     as output_tokens
  from public.ai_call_log l
  where l.created_at >= p_since
  group by coalesce(l.feature, '(unknown)')
  order by calls desc;
$$;
revoke all on function public.ai_call_stats(timestamptz) from public;
revoke all on function public.ai_call_stats(timestamptz) from anon, authenticated;
grant execute on function public.ai_call_stats(timestamptz) to service_role;

-- ── 30일 보존 — 만료분 자동 파기 ────────────────────────────────────────
create or replace function public.purge_ai_call_log()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  delete from public.ai_call_log where created_at < now() - interval '30 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.purge_ai_call_log() from public;
revoke all on function public.purge_ai_call_log() from anon, authenticated;
grant execute on function public.purge_ai_call_log() to service_role;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('purge-ai-call-log', '30 19 * * *', $c$select public.purge_ai_call_log()$c$);
  end if;
exception when others then
  raise notice 'pg_cron schedule skipped: %', sqlerrm;
end $$;
