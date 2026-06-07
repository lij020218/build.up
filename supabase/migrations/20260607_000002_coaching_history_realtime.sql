-- coaching_history 실시간 동기화 — 웹·iOS 코칭 일지 양방향 즉시 반영.
-- 기존 publication(20260603_000001_realtime_sync_publication.sql)에 coaching_history 추가.
--
-- 운영 주의: Supabase 대시보드 → Database → Replication 에서
--   coaching_history 테이블의 Realtime 토글도 켜야 한다.

-- 1) UPDATE/DELETE 시 구(舊) 레코드를 WAL 에 실어 user_id 필터링 가능하게
ALTER TABLE public.coaching_history REPLICA IDENTITY FULL;

-- 2) supabase_realtime publication 에 추가 (이미 있으면 skip)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'coaching_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coaching_history;
  END IF;
END $$;
