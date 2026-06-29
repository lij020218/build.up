-- ─────────────────────────────────────────────────────────────
--  ai_daily_usage — 아이디(uid)·기능별 일일 AI 사용량 카운터 (2026-06-29)
--
--  배경: checkDailyRateLimit 은 Upstash Redis 슬라이딩 윈도우를 쓰지만 UPSTASH_*
--    env 미설정 시 in-memory 폴백 → 서버리스(Vercel) 인스턴스 간 공유 불가 = 일일
--    한도 사실상 무력화. 이 테이블 + 원자적 RPC 로 Redis 없이도 prod 에서 확실히
--    enforce (메모리 "Rate Limit Redis/Supabase" 잔여 과제 해소).
--
--  키: (user_id, feature, usage_date[KST]). 자정(Asia/Seoul) 기준 일일 리셋.
--  쓰기는 service_role(RPC consume_ai_daily_quota)만. RLS 켜고 공개 정책 없음.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.ai_daily_usage (
  user_id    uuid not null,
  feature    text not null,
  usage_date date not null default (now() at time zone 'Asia/Seoul')::date,
  count      int  not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, feature, usage_date)
);

alter table public.ai_daily_usage enable row level security;
-- 공개 정책 없음 — service_role(RPC) 전용. 명시적 GRANT (20260610 스냅샷 GRANT 누락 교훈).
grant select, insert, update, delete on table public.ai_daily_usage to service_role;

-- 오래된 행 정리용 인덱스(선택적 배치 삭제)
create index if not exists ai_daily_usage_date_idx on public.ai_daily_usage (usage_date);

-- ── 원자적 소비 RPC ──────────────────────────────────────────
--  한도 미만이면 count+1 하고 allowed=true, 초과면 증가 없이 allowed=false.
--  SELECT ... FOR UPDATE 로 동시 호출 레이스 차단. KST 자정 리셋.
create or replace function public.consume_ai_daily_quota(
  p_user_id uuid,
  p_feature text,
  p_limit   int
)
returns table(allowed boolean, used int, limit_val int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date  date := (now() at time zone 'Asia/Seoul')::date;
  v_count int;
begin
  insert into public.ai_daily_usage (user_id, feature, usage_date, count)
  values (p_user_id, p_feature, v_date, 0)
  on conflict (user_id, feature, usage_date) do nothing;

  select count into v_count
    from public.ai_daily_usage
   where user_id = p_user_id and feature = p_feature and usage_date = v_date
   for update;

  if v_count >= p_limit then
    return query select false, v_count, p_limit;
  else
    update public.ai_daily_usage
       set count = count + 1, updated_at = now()
     where user_id = p_user_id and feature = p_feature and usage_date = v_date;
    return query select true, v_count + 1, p_limit;
  end if;
end;
$$;

grant execute on function public.consume_ai_daily_quota(uuid, text, int) to service_role;

comment on function public.consume_ai_daily_quota(uuid, text, int) is
  '아이디·기능별 일일 AI 사용량 원자적 소비. 한도 미만이면 증가+allowed=true, 초과면 allowed=false. KST 자정 리셋.';
