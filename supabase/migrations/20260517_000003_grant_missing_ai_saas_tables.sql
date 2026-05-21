-- ════════════════════════════════════════════════════════════════════════
--  CRITICAL FIX (2026-05-17): GRANT 누락 테이블 일괄 권한 부여
--
--  대상: 2026-04-29 이후 추가된 테이블 중 RLS 정책만 있고 GRANT 가 빠진 곳.
--    - ai_report_insights      (20260505_ai_report_insights.sql)
--    - saas_metrics_connections (20260505_saas_metrics.sql)
--    - saas_metrics_daily       (20260505_saas_metrics.sql)
--    - v_saas_metrics_unified   (view — SELECT only)
--
--  원인: PostgreSQL 은 GRANT 를 먼저 확인하고 RLS 정책을 적용.
--    GRANT 없으면 42501 ("permission denied") 가 RLS 평가 전에 던져짐.
--    → AI 응답 캐시 hit 0%, saas_metrics read silent fail, Claude 재호출 비용 ↑.
--
--  IF EXISTS 가드로 테이블이 아직 prod 에 없는 경우에도 안전.
-- ════════════════════════════════════════════════════════════════════════

do $$
declare
  rw_tables text[] := array[
    'ai_report_insights',
    'saas_metrics_connections',
    'saas_metrics_daily'
  ];
  t text;
begin
  foreach t in array rw_tables loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      execute format(
        'grant select, insert, update, delete on table public.%I to authenticated',
        t
      );
      raise notice '[grant] public.% to authenticated OK', t;
    else
      raise notice '[grant] SKIP public.% (table not found in prod)', t;
    end if;
  end loop;

  -- view 는 SELECT 만 (집계 view 라 write 불가)
  if exists (
    select 1 from information_schema.views
    where table_schema = 'public' and table_name = 'v_saas_metrics_unified'
  ) then
    execute 'grant select on public.v_saas_metrics_unified to authenticated';
    raise notice '[grant] view v_saas_metrics_unified SELECT to authenticated OK';
  end if;
end $$;
