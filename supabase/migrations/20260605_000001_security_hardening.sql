-- ════════════════════════════════════════════════════════════════════════
--  출시 전 보안 하드닝 (2026-06-05 감사 결과)
--
--  1. SECURITY DEFINER 뷰 3종 → security_invoker=true (RLS 우회 차단)
--     감사 P0-1: 뷰가 소유자(postgres) 권한으로 실행돼 기저 테이블 RLS 를 우회 →
--     authenticated 가 PostgREST 로 직접 조회 시 전 사용자 데이터 덤프 가능했음.
--     security_invoker=true 면 조회자 권한으로 실행 → 기저 테이블 RLS(본인 행)가 적용됨.
--     (같은 레포 v_saas_funnel_unified 는 이미 적용돼 있던 패턴.)
--
--  2. business-documents 스토리지 버킷 private + 본인 폴더 RLS (감사 P0-2)
--     사업자등록증 등 PII 문서 버킷이 마이그레이션에서 주석 처리돼 보장 안 됐음 → 정식화.
--
--  3. buildup_subscriptions.billing_key 컬럼 차단 (감사 P1-1)
--     PortOne 빌링키(재과금 가능 토큰)가 본인 SELECT 로 평문 노출 → 컬럼 레벨 권한으로 차단.
--
--  멱등(idempotent): 재실행 안전.
-- ════════════════════════════════════════════════════════════════════════

-- ── 1) 뷰 security_invoker ──────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='v_saas_metrics_unified') THEN
    EXECUTE 'ALTER VIEW public.v_saas_metrics_unified SET (security_invoker = true)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='v_coaching_stats_14d') THEN
    EXECUTE 'ALTER VIEW public.v_coaching_stats_14d SET (security_invoker = true)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='v_coaching_meta_30d') THEN
    EXECUTE 'ALTER VIEW public.v_coaching_meta_30d SET (security_invoker = true)';
  END IF;
END $$;

-- ── 2) business-documents 버킷 + RLS ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-documents', 'business-documents', false, 10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
  SET public = false,                       -- 이미 있으면 private 강제(공개로 잘못 생성됐을 경우 교정)
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 경로 구조 `{user_id}/{kind}/{uuid}.{ext}` — 첫 segment 가 본인 user_id 일 때만 접근.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='business_documents_select_own') THEN
    CREATE POLICY "business_documents_select_own" ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'business-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='business_documents_insert_own') THEN
    CREATE POLICY "business_documents_insert_own" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'business-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='business_documents_update_own') THEN
    CREATE POLICY "business_documents_update_own" ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'business-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='business_documents_delete_own') THEN
    CREATE POLICY "business_documents_delete_own" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'business-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- ── 3) billing_key 컬럼 차단 (본인도 평문 조회 불가, service_role 만) ────────
-- 전체 SELECT 회수 후 billing_key 제외한 컬럼만 재부여.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='buildup_subscriptions') THEN
    REVOKE SELECT ON public.buildup_subscriptions FROM authenticated;
    GRANT SELECT (
      id, user_id, plan, status, billing_method_label,
      current_period_start, current_period_end, cancel_at_period_end,
      created_at, updated_at
    ) ON public.buildup_subscriptions TO authenticated;
  END IF;
END $$;
