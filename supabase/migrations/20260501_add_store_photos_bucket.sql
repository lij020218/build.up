-- 2026-05-01: 매장 사진 업로드용 Supabase Storage 버킷 + RLS 정책
-- "내 가게" Hero/Identity 섹션 사진 갤러리에 사용.
-- 경로 규칙: {user_id}/{uuid}.{ext}
-- 정책: 누구나 읽기 가능 (URL 알면 OK), 본인만 업로드/삭제

-- 1) Bucket 생성 (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-photos',
  'store-photos',
  true,
  10485760,                                                               -- 10 MB 제한
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2) RLS 정책 — 본인 폴더(user_id 첫 segment) 안에서만 INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "store_photos_select" ON storage.objects;
CREATE POLICY "store_photos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-photos');

DROP POLICY IF EXISTS "store_photos_insert" ON storage.objects;
CREATE POLICY "store_photos_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'store-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "store_photos_update" ON storage.objects;
CREATE POLICY "store_photos_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'store-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "store_photos_delete" ON storage.objects;
CREATE POLICY "store_photos_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'store-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
