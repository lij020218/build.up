-- ─────────────────────────────────────────────────────────────────
--  CRITICAL FIX: 2026-03-19 이후 만들어진 테이블의 GRANT 누락
--
--  증상: SELECT/INSERT/UPDATE/DELETE 시 PostgreSQL 42501 에러
--    "permission denied for table user_store_data"
--
--  원인: RLS 정책은 있지만 (auth.uid() = user_id), table-level GRANT 가 빠짐.
--    PostgreSQL 은 먼저 role-level GRANT 를 확인하고 그 다음 RLS 정책을 적용.
--    GRANT 가 없으면 RLS 까지 도달하지 못하고 42501 발생.
--
--  영향: 데모 초기화 후 user_store_data 가 다시 채워지지 않음 (load 도 save 도 실패),
--    autosave 가 silent fail, 결제·매출 통합 데이터 저장 불가 등.
--
--  해결: 모든 user-facing 테이블에 authenticated role GRANT 를 일괄 추가.
--    실제 존재하는 테이블에만 동작 (information_schema 체크) — 환경별 마이그레이션 차이 안전.
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  -- authenticated role 이 read/write 모두 가능해야 하는 테이블
  rw_tables text[] := ARRAY[
    'user_store_data',
    'store_invites',
    'store_members',
    'customers',
    'customer_visits',
    'collected_sales',
    'sales_collection_config',
    'sales_sync_log',
    'portone_connections',
    'portone_payments',
    'portone_webhook_log',
    'stripe_connections',
    'stripe_webhook_log',
    'toss_connections',
    'toss_webhook_log',
    'tossplace_connections',
    'tossplace_payments',
    'tossplace_orders',
    'codef_connections',
    'codef_card_sales',
    'custom_connections',
    'subscription_events',
    'csv_revenue_uploads',
    'csv_revenue_entries'
  ];
  -- authenticated + anon 모두 SELECT 만 가능 (공개 참조 데이터)
  ro_tables text[] := ARRAY[
    'support_programs',
    'contractor_cache',
    'knowledge_chunks'
  ];
  t text;
  granted_count int := 0;
  skipped_count int := 0;
BEGIN
  -- read/write 권한
  FOREACH t IN ARRAY rw_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format(
        'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated',
        t
      );
      granted_count := granted_count + 1;
      RAISE NOTICE '[grant] rw  ✓ public.% ', t;
    ELSE
      skipped_count := skipped_count + 1;
      RAISE NOTICE '[grant] rw  - public.% (does not exist, skipped)', t;
    END IF;
  END LOOP;

  -- 읽기 전용 권한
  FOREACH t IN ARRAY ro_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', t);
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon', t);
      granted_count := granted_count + 1;
      RAISE NOTICE '[grant] ro  ✓ public.% ', t;
    ELSE
      skipped_count := skipped_count + 1;
      RAISE NOTICE '[grant] ro  - public.% (does not exist, skipped)', t;
    END IF;
  END LOOP;

  RAISE NOTICE '[grant] done — granted=% skipped=%', granted_count, skipped_count;
END $$;
