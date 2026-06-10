-- ════════════════════════════════════════════════════════════════════════
--  보안 후속 하드닝 (2026-06-10 출시 전 감사 P0-1·P0-2)
--
--  1. v_revenue_daily_unified → security_invoker=true
--     20260605_000001 하드닝이 뷰 3종을 고치면서 이 뷰(20260505 신설)만 누락.
--     소유자 권한 실행으로 기저 테이블(tossplace_payments·codef_card_sales·
--     popbill_cashbills·popbill_tax_invoices) RLS 를 우회 → PostgREST 로
--     전 사용자 매출 덤프 가능했음. 코드 참조 0건이지만 노출면 자체를 차단.
--
--  2. foundone_subscriptions.billing_key 컬럼 차단 재적용
--     20260605_000001 §3 의 IF EXISTS 가드가 옛 이름 buildup_subscriptions 를
--     체크하는데, 20260529 rename 이후라 날짜순 적용 시 블록 전체가 skip 됨
--     → 빌링키(재과금 토큰)가 본인 SELECT 로 평문 노출되던 상태.
--     billing/status·cancel 은 명시 컬럼만 select(user-scoped), billing_key 는
--     service_role cron(billing-renew)만 읽으므로 차단해도 깨질 곳 없음.
--
--  멱등(idempotent): 재실행 안전.
-- ════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  col_list text;
BEGIN
  -- ── 1) 매출 통합 뷰 RLS 우회 차단 ──────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='v_revenue_daily_unified') THEN
    EXECUTE 'ALTER VIEW public.v_revenue_daily_unified SET (security_invoker = true)';
  END IF;

  -- ── 2) billing_key 컬럼 차단 (본인도 평문 조회 불가, service_role 만) ────
  --   컬럼 목록을 하드코딩하지 않고 billing_key 만 제외한 전 컬럼을 동적 구성 →
  --   renewal_failure_count 등 옵션 컬럼(20260609) 적용 순서/존재 여부와 무관하게 안전.
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='foundone_subscriptions') THEN
    SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
      INTO col_list
      FROM information_schema.columns
     WHERE table_schema='public' AND table_name='foundone_subscriptions'
       AND column_name <> 'billing_key';

    REVOKE SELECT ON public.foundone_subscriptions FROM authenticated;
    EXECUTE 'GRANT SELECT (' || col_list || ') ON public.foundone_subscriptions TO authenticated';
  END IF;
END $$;
