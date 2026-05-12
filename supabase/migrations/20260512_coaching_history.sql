-- Coaching history: FounderBrief 가 매일 노출하는 hero signal + 사장님 대응 누적 일지.
--
-- 목적: 사장님 lock-in moat. localStorage v1 의 한계 (단일 디바이스 / 브라우저 캐시
--       청소 시 손실) 보완. 30일+ 누적되면 메타 인사이트 (대응 패턴·요일 효과·
--       반복 신호) AI 분석 기반.
--
-- 패턴: saas_metrics_connections / portone_connections 와 동일 RLS 정책.
--       (본인 select·insert·update 만, delete 는 service_role)
--
-- ── 데이터 모델 ────────────────────────────────────────────────────────
-- signal_kind: critical / important / notable / good
-- brief:       offline (외식·카페·뷰티 등 11개 업종) / startup (startup-tech)
-- response_taken: 사장님이 "오늘 했음" 마크 했나
-- response_note: 사장님 메모 (옵션)
--
-- ── 윈도우 ───────────────────────────────────────────────────────────
-- 90일 보관. 그 이전은 archive (또는 monthly summary 만 보관) — v2.

-- ─────────────────────────────────────────────────────────────────
-- 1. 코칭 히스토리 테이블
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.coaching_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- 그날 노출된 신호 (한 날·한 brief 당 row 1개 — unique 제약)
  date date not null,                               -- KST YYYY-MM-DD
  brief text not null check (brief in ('offline', 'startup')),

  -- 신호 (FounderBrief 가 자동 기록)
  signal_kind text not null
    check (signal_kind in ('critical', 'important', 'notable', 'good')),
  signal_headline text not null,
  signal_action text not null,

  -- 사장님 대응 (CoachingHistoryCard 에서 입력)
  response_taken boolean,                           -- true=했음 / false=안함 / null=미응답
  response_note text,
  response_taken_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, date, brief)
);

create index if not exists idx_coaching_history_user_date
  on public.coaching_history(user_id, date desc);
create index if not exists idx_coaching_history_kind
  on public.coaching_history(user_id, signal_kind, date desc)
  where signal_kind = 'critical';

-- ─────────────────────────────────────────────────────────────────
-- 2. updated_at 자동 갱신 트리거 (기존 portone_set_updated_at 재사용)
-- ─────────────────────────────────────────────────────────────────
do $$
begin
  -- portone_set_updated_at 함수가 이미 정의되어 있다는 가정 (portone_connections 마이그레이션에서 생성).
  -- 없으면 생성.
  if not exists (
    select 1 from pg_proc where proname = 'portone_set_updated_at'
  ) then
    create or replace function public.portone_set_updated_at()
    returns trigger
    language plpgsql
    as $func$
    begin
      new.updated_at := now();
      return new;
    end;
    $func$;
  end if;
end $$;

drop trigger if exists trg_coaching_history_updated_at on public.coaching_history;
create trigger trg_coaching_history_updated_at
  before update on public.coaching_history
  for each row execute function public.portone_set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- 3. RLS — 본인 select/insert/update, delete 는 service_role 만
-- ─────────────────────────────────────────────────────────────────
alter table public.coaching_history enable row level security;

drop policy if exists "coaching_history_self_select" on public.coaching_history;
create policy "coaching_history_self_select"
  on public.coaching_history
  for select
  using (auth.uid() = user_id);

drop policy if exists "coaching_history_self_insert" on public.coaching_history;
create policy "coaching_history_self_insert"
  on public.coaching_history
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "coaching_history_self_update" on public.coaching_history;
create policy "coaching_history_self_update"
  on public.coaching_history
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- delete 는 명시 정책 없음 — service_role 만 (사장님이 실수로 삭제 못 함, lock-in moat 강화)

-- ─────────────────────────────────────────────────────────────────
-- 4. 통계 view — CoachingHistoryCard 의 헤더 통계 (액션 비율·critical 수)
-- ─────────────────────────────────────────────────────────────────
create or replace view public.v_coaching_stats_14d as
  select
    user_id,
    count(*) as total_days,
    count(*) filter (where response_taken = true) as actions_taken,
    count(*) filter (where signal_kind = 'critical') as critical_signals,
    count(*) filter (where signal_kind = 'important') as important_signals,
    count(*) filter (where signal_kind = 'good') as good_signals,
    case when count(*) > 0
      then round(100.0 * count(*) filter (where response_taken = true) / count(*))
      else 0
    end as taken_rate_pct
  from public.coaching_history
  where date >= (current_date - interval '14 days')
  group by user_id;

comment on view public.v_coaching_stats_14d is
  '최근 14일 코칭 히스토리 통계 — 일자 수·액션 완료·신호 종류별 분포.';

-- ─────────────────────────────────────────────────────────────────
-- 5. 메타 인사이트 view (30일 패턴 분석) — v1 rule-based
--    "사장님은 critical 신호 X% 대응" / "주말 미응답 비율" 등
-- ─────────────────────────────────────────────────────────────────
create or replace view public.v_coaching_meta_30d as
  select
    user_id,
    count(*) as days_30,
    -- 신호 종류별 대응률
    case when count(*) filter (where signal_kind = 'critical') > 0
      then round(100.0 *
        count(*) filter (where signal_kind = 'critical' and response_taken = true) /
        count(*) filter (where signal_kind = 'critical'))
      else null
    end as critical_taken_rate,
    -- 평일 vs 주말 (extract dow: 0=일, 1=월, ..., 6=토)
    count(*) filter (where extract(dow from date) in (0, 6)) as weekend_days,
    count(*) filter (where extract(dow from date) in (0, 6) and response_taken = true) as weekend_actions,
    -- 가장 자주 등장한 신호 헤드라인 prefix (간단 분석)
    mode() within group (order by signal_kind) as most_common_kind,
    -- 연속 critical 일수 (최근 7일)
    count(*) filter (
      where signal_kind = 'critical'
        and date >= (current_date - interval '7 days')
    ) as recent_critical_7d
  from public.coaching_history
  where date >= (current_date - interval '30 days')
  group by user_id
  having count(*) >= 14;  -- 14일+ 데이터 있을 때만 의미

comment on view public.v_coaching_meta_30d is
  '30일+ 누적 시 메타 인사이트 (critical 대응률·주말 패턴·연속 critical). 14일 미만 사장님은 row 없음.';

-- ─────────────────────────────────────────────────────────────────
-- 6. Grants
-- ─────────────────────────────────────────────────────────────────
grant select, insert, update on public.coaching_history to authenticated;
grant select on public.v_coaching_stats_14d to authenticated;
grant select on public.v_coaching_meta_30d to authenticated;
