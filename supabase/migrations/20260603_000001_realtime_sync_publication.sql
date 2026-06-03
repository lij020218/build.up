-- 웹·iOS 실시간 동기화(2단계) — postgres_changes 가 발화하려면 해당 테이블이
-- supabase_realtime publication 에 포함돼야 한다. 기본 publication 에는 없으므로 추가.
--
-- 또한 user_id / roadmap_id 같은 비-PK 컬럼으로 realtime filter 를 걸려면 UPDATE/DELETE 시
-- 구(舊) 레코드가 WAL 에 실려야 하므로 REPLICA IDENTITY FULL 로 설정한다.
--
-- 멱등(idempotent): 이미 추가된 경우 에러 없이 통과(DO 블록 + 예외 무시).

-- 1) REPLICA IDENTITY FULL — 필터링 가능하게
ALTER TABLE public.user_store_data   REPLICA IDENTITY FULL;
ALTER TABLE public.business_profiles  REPLICA IDENTITY FULL;
ALTER TABLE public.stage_decisions    REPLICA IDENTITY FULL;
ALTER TABLE public.roadmaps           REPLICA IDENTITY FULL;

-- 2) supabase_realtime publication 에 테이블 추가 (이미 있으면 skip)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['user_store_data', 'business_profiles', 'stage_decisions', 'roadmaps'];
BEGIN
  -- publication 이 없으면(셀프호스트 등) 생성
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- 주의(운영): Supabase 호스티드의 경우 위 publication 변경 외에 대시보드
--   Database → Replication 에서 해당 테이블의 Realtime 토글이 켜져 있어야 한다.
--   RLS 가 켜진 테이블은 realtime 도 RLS 를 따르므로 본인 user_id 행 변경만 수신된다(안전).
