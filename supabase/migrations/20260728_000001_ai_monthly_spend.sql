-- ─────────────────────────────────────────────────────────────
--  ai_monthly_spend — 1인당 월간 AI 비용 예산(₩6,000) 미터 (2026-07-28)
--
--  배경: 일일 쿼터(ai_daily_usage)만으로는 월 비용 상한 보장이 안 됨 — 쿼터 풀소진 시
--    단일 기능만으로도 월 수만원 가능(파서 10회/일 × 상한 ₩130 = ₩39,000 등).
--    각 호출의 "회당 상한 원가"(apps/web/app/api/_lib/ai-cost.ts SSOT)를 승인 시점에
--    선차감하고, 월 누계가 예산을 넘으면 차단. 차감액 ≥ 실비용 → 실지출 ≤ 예산 보장.
--
--  키: (user_id, month_key[KST "YYYY-MM"]). 쓰기는 service_role(RPC)만.
--  Upstash 설정 시엔 Redis 카운터가 우선이고 이 RPC는 폴백 (rate-limit.ts 참조).
-- ─────────────────────────────────────────────────────────────

create table if not exists public.ai_monthly_spend (
  user_id    uuid not null,
  month_key  text not null,
  spent_won  numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, month_key)
);

alter table public.ai_monthly_spend enable row level security;
-- 공개 정책 없음 — service_role(RPC) 전용. 명시적 GRANT (20260610 스냅샷 GRANT 누락 교훈).
grant select, insert, update, delete on table public.ai_monthly_spend to service_role;

create index if not exists ai_monthly_spend_month_idx on public.ai_monthly_spend (month_key);

-- ── 원자적 예산 소비 RPC ────────────────────────────────────
--  spent+cost ≤ budget 이면 차감하고 allowed=true, 초과면 차감 없이 allowed=false.
--  SELECT ... FOR UPDATE 로 동시 호출 레이스 차단.
create or replace function public.consume_ai_monthly_budget(
  p_user_id    uuid,
  p_month      text,
  p_cost_won   numeric,
  p_budget_won numeric
)
returns table(allowed boolean, spent numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_spent numeric;
begin
  insert into public.ai_monthly_spend (user_id, month_key, spent_won)
  values (p_user_id, p_month, 0)
  on conflict (user_id, month_key) do nothing;

  select spent_won into v_spent
    from public.ai_monthly_spend
   where user_id = p_user_id and month_key = p_month
   for update;

  if v_spent + p_cost_won > p_budget_won then
    return query select false, v_spent;
  else
    update public.ai_monthly_spend
       set spent_won = spent_won + p_cost_won, updated_at = now()
     where user_id = p_user_id and month_key = p_month;
    return query select true, v_spent + p_cost_won;
  end if;
end;
$$;

-- 보안 규칙(2026-07-15 감사): 새 SECURITY DEFINER 함수는 REVOKE FROM PUBLIC 필수.
revoke execute on function public.consume_ai_monthly_budget(uuid, text, numeric, numeric) from public, anon, authenticated;
grant execute on function public.consume_ai_monthly_budget(uuid, text, numeric, numeric) to service_role;

comment on function public.consume_ai_monthly_budget(uuid, text, numeric, numeric) is
  '1인당 월간 AI 비용 예산 원자적 소비. spent+cost ≤ budget 이면 차감+allowed=true, 초과면 allowed=false. month_key = KST YYYY-MM.';
