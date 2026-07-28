-- ─────────────────────────────────────────────────────────────
--  surface_daily_visits — 화면(탭) 방문 일 단위 카운터 (2026-07-28)
--
--  배경: /admin/usage 의 기능 사용량은 AI 호출·저장 흔적만 커버 — 조회형 화면(세금·재무
--    열람 등)은 측정 불가. 외부 애널리틱스 없이 자체 계측: 유저×화면×일(KST) 1행.
--    이벤트 낱개 적재가 아니라 일 카운터로 접어 볼륨 폭발 방지 (ai_daily_usage 패턴).
--
--  쓰기: record_surface_visit RPC(auth.uid() 본인 행만, 화면 화이트리스트) — 웹·iOS 공용.
--  읽기: service_role(/admin/usage 집계) 전용. 클라이언트 조회 정책 없음.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.surface_daily_visits (
  user_id    uuid not null references auth.users(id) on delete cascade,
  surface    text not null,
  visit_date date not null default (now() at time zone 'Asia/Seoul')::date,
  count      int  not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, surface, visit_date)
);

alter table public.surface_daily_visits enable row level security;
-- 공개 정책 없음 — 쓰기는 RPC, 읽기는 service_role. 명시적 GRANT (default privilege 부재 이력).
grant select, insert, update, delete on table public.surface_daily_visits to service_role;

create index if not exists surface_daily_visits_date_idx on public.surface_daily_visits (visit_date);

-- ── 방문 기록 RPC — 호출자 본인(auth.uid()) 행만, 화이트리스트 밖 문자열은 무시 ──
create or replace function public.record_surface_visit(p_surface text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_date date := (now() at time zone 'Asia/Seoul')::date;
begin
  if v_user is null then
    return; -- 미로그인 호출 무시
  end if;
  -- 화이트리스트 = 웹 DashboardSurface 13종 (apps/web/app/lib/types.ts 와 동기)
  if p_surface not in (
    'home','current','roadmap','guides','franchise','profile','analytics',
    'marketing','reports','finance','team','tax','offerings'
  ) then
    return; -- 미지의 화면명 무시 (오염 방지)
  end if;

  insert into public.surface_daily_visits (user_id, surface, visit_date, count)
  values (v_user, p_surface, v_date, 1)
  on conflict (user_id, surface, visit_date)
  do update set count = least(public.surface_daily_visits.count + 1, 1000), -- 스팸 상한
                updated_at = now();
end;
$$;

-- 보안 규칙(2026-07-15 감사): SECURITY DEFINER 는 REVOKE FROM PUBLIC 필수.
--   authenticated 에만 허용 — 본인 행만 쓰므로 안전(파라미터로 타 유저 지정 불가).
revoke execute on function public.record_surface_visit(text) from public, anon;
grant execute on function public.record_surface_visit(text) to authenticated, service_role;

comment on function public.record_surface_visit(text) is
  '화면 방문 일 카운터 기록. auth.uid() 본인 행만, 화이트리스트 밖 화면명은 무시. KST 일 단위.';
