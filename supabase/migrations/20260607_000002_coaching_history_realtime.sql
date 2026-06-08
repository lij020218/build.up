-- coaching_history 실시간 동기화 — 웹·iOS 코칭 일지 양방향 즉시 반영.
-- 기존 publication(20260603_000001_realtime_sync_publication.sql)에 coaching_history 추가.
--
-- ⚠️ coaching_history 테이블은 20260512_coaching_history.sql 가 생성한다.
--    그 마이그레이션이 먼저 적용돼야 한다(날짜순). prod 가 backlog 를 건너뛰어 테이블이 없으면
--    하드 에러(relation does not exist) 대신 graceful skip — 전체 마이그레이션 run 이 멈추지 않도록.
--    (테이블 생성 후 본 SQL 의 1~2단계를 재실행하면 realtime 이 설정됨.)
--
-- 운영 주의: Supabase 대시보드 → Database → Replication 에서 coaching_history Realtime 토글도 켜야 한다.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'coaching_history'
  ) THEN
    RAISE NOTICE 'coaching_history 테이블이 없어 realtime 설정을 건너뜁니다. 20260512_coaching_history.sql 적용 후 본 마이그레이션을 재실행하세요.';
    RETURN;
  END IF;

  -- 1) UPDATE/DELETE 시 구(舊) 레코드를 WAL 에 실어 user_id 필터링 가능하게
  ALTER TABLE public.coaching_history REPLICA IDENTITY FULL;

  -- 2) supabase_realtime publication 에 추가 (이미 있으면 skip)
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'coaching_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coaching_history;
  END IF;
END $$;
