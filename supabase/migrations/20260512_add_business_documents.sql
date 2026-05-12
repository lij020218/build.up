-- 2026-05-12 P1 #13: business_documents JSONB column
--
-- 사장님이 발급받은 사업 서류 (사업자등록증·영업신고증·통신판매신고증·상표등록증 등)
-- 를 한 곳에서 보관해 재발급 시간 절약. PDF 실체는 Supabase Storage 의
-- `business-documents` 버킷에 저장하고, 이 컬럼엔 메타데이터 + 그 URL 만 보관.
--
-- 종전: bizRegistrationNumber 문자열만 user_store_data 에 있어 파일 분실 시 사장님이
-- 직접 재발급(세무서·구청 방문) 필요. 시간 손실 + 영업 신고 갱신 시 누락 위험.
--
-- 새 schema (각 item):
--   {
--     "id": "uuid-v4",
--     "kind": "biz-registration" | "biz-report-food" | "trademark" | ...,
--     "filename": "사업자등록증.pdf",
--     "url": "https://...supabase.../storage/v1/object/sign/business-documents/...",
--     "sizeBytes": 123456,
--     "uploadedAt": "2026-05-12T00:00:00Z",
--     "expiresAt": "2027-05-12T00:00:00Z",  // 위생교육·보건증 만료 추적
--     "issuedAt": "2026-05-01T00:00:00Z",
--     "registrationNumber": "123-45-67890",
--     "notes": "본점 영업신고"
--   }
--
-- TypeScript SSOT: packages/shared/src/supabase/store-data.ts UserStoreData.businessDocuments
--                  + apps/web/app/lib/stores/store-info-store.ts BusinessDocument type

ALTER TABLE user_store_data
  ADD COLUMN IF NOT EXISTS business_documents jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN user_store_data.business_documents IS
  '2026-05-12 추가. 사업 서류 PDF 메타데이터 + Storage URL 배열. 실제 파일은 business-documents 버킷.';

-- ── Storage bucket 생성 (별도 RPC / Supabase UI 에서 실행 권장) ──
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'business-documents',
--   'business-documents',
--   false,  -- private — signed URL 로만 접근
--   10485760,  -- 10MB 상한
--   ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[]
-- ) ON CONFLICT (id) DO NOTHING;
--
-- ── RLS Policy (사장님 본인 서류만 read/write) ──
-- CREATE POLICY "business_documents_own_user"
--   ON storage.objects FOR ALL
--   USING (bucket_id = 'business-documents' AND (auth.uid())::text = (storage.foldername(name))[1])
--   WITH CHECK (bucket_id = 'business-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);
