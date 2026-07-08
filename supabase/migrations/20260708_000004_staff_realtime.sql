-- ─────────────────────────────────────────────────────────────────
--  직원 근무/연차 테이블 realtime 동기화 — 사장↔직원 즉시 반영
--
--  근무표(사장 편집)·출퇴근(직원)·연차(양쪽)를 supabase_realtime publication 에
--  추가해, 상대 기기 변경이 재로드 없이 바로 보이게 한다.
--  패턴: REPLICA IDENTITY FULL(비-PK 필터링) + ALTER PUBLICATION ADD TABLE (멱등).
--
--  ⚠️ 운영(prod): 본 SQL 실행 + Supabase 대시보드 → Database → Replication 에서
--     각 테이블 Realtime 토글 ON. RLS 로 본인/가게 행만 수신(안전).
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'staff_schedules',
    'staff_schedule_rules',
    'attendance_records',
    'leave_requests'
  ];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      RAISE NOTICE '% 테이블이 없어 realtime 설정을 건너뜁니다. 생성 마이그레이션(20260708_000002/_000003) 적용 후 재실행하세요.', t;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      RAISE NOTICE '% → supabase_realtime 추가 완료', t;
    END IF;
  END LOOP;
END $$;
