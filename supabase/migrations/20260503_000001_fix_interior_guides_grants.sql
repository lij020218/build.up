-- ─────────────────────────────────────────────────────────────────
--  FIX: interior_design_guides 403 (사용자 보고 2026-05-03)
--
--  증상: 브라우저 콘솔에 `interior_design_guides` 에 대한 403 에러 다수.
--    construction-setup 단계에서 인테리어 자재·컨셉 데이터를 못 불러옴 →
--    하드코딩 폴백으로 동작 (UX 영향 X 이지만 콘솔 노이즈 + DB 풀 비활성).
--
--  원인: 20260403_000031 에서 RLS 정책 (`Anyone can read interior guides USING (true)`)
--    + `Anonymous can read vendor_recommendations` 만 만들고 GRANT 누락.
--    PostgreSQL 은 role-level GRANT 를 먼저 확인하고 그 다음 RLS 정책 적용.
--    GRANT 가 없으면 RLS 까지 도달하지 못하고 42501 (= 403) 발생.
--
--  해결: anon + authenticated 둘 다 SELECT GRANT.
--    20260429_000001 의 grants 마이그레이션에서 ro_tables 배열에 빠져 있었음.
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  ro_tables text[] := ARRAY[
    'interior_design_guides',
    'vendor_recommendations',  -- 같은 패턴 — Pass 2 AI 가 풀에서 셀렉
    'permit_knowledge',
    'tax_knowledge',
    'loan_knowledge',
    'market_signals',
    'logistics_platforms',
    'pos_systems',
    'delivery_platforms',
    'sns_channels',
    'sub_industry_pricing',
    'sub_industry_market_signal'
  ];
  t text;
  granted_count int := 0;
  skipped_count int := 0;
BEGIN
  FOREACH t IN ARRAY ro_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', t);
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon', t);
      granted_count := granted_count + 1;
      RAISE NOTICE '[grant-2nd-pass] ro  ✓ public.%', t;
    ELSE
      skipped_count := skipped_count + 1;
      RAISE NOTICE '[grant-2nd-pass] ro  - public.% (does not exist, skipped)', t;
    END IF;
  END LOOP;

  RAISE NOTICE '[grant-2nd-pass] done — granted=% skipped=%', granted_count, skipped_count;
END $$;
