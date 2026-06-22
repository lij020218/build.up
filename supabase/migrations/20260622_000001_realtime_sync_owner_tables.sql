-- 실시간 동기화 메시 확장 — owner 편집 테이블 5종을 supabase_realtime publication 에 추가.
-- (기존: 20260603_000001 = user_store_data·business_profiles·stage_decisions·roadmaps,
--        20260607_000002 = coaching_history)
--
-- 대상(기기 A 변경 → 기기 B 즉시 반영이 필요한 owner 편집 데이터):
--   • marketing_play_progress    (주간 마케팅 플레이 체크)          — HIGH
--   • csv_revenue_uploads/entries (수동 매출 CSV)                    — MED
--   • store_members / store_invites (팀 멤버십·초대)                 — MED
--   • saas_funnel_manual_weekly  (수동 퍼널 입력)                    — HIGH
--   • program_applications       (지원사업 신청)                     — MED
--
-- 패턴: REPLICA IDENTITY FULL + ALTER PUBLICATION ADD TABLE (멱등).
--
-- ⚠️ DELETE 이벤트의 필터 한계(중요):
--   RLS 가 켜진 테이블에 REPLICA IDENTITY FULL 을 걸면 DELETE 의 old 레코드는 **PK 컬럼만** 실린다.
--   따라서 클라이언트 필터(user_id / owner_user_id eq) 는 그 컬럼이 PK 에 포함된 경우에만 DELETE 를 수신한다.
--     - user_id ∈ PK  → marketing_play_progress, saas_funnel_manual_weekly : INSERT/UPDATE/DELETE 모두 OK
--     - user_id ∉ PK  → csv_revenue_uploads/entries, program_applications,
--                       store_members/store_invites(owner_user_id)         : INSERT/UPDATE OK, DELETE 는 필터 미스 가능
--   이 앱들의 주 동기화 방향은 INSERT/UPDATE(체크 추가·CSV 업로드·신청·멤버 추가)라 실용상 충분.
--   삭제 반영은 다음 포커스 복귀 재조회(1단계)가 보완한다. (기존 business_profiles 도 동일 특성.)
--
-- ⚠️ 운영(prod) 적용 필요: 본 마이그레이션 실행 + Supabase 대시보드 → Database → Replication 에서
--   각 테이블 Realtime 토글 ON. RLS 가 켜져 있어 본인 행 변경만 수신(안전).
--
-- prod 가 backlog 를 건너뛰어 일부 테이블이 아직 없을 수 있으므로(예: 팀 기능 미적용 환경),
-- 테이블별로 존재 여부를 확인 후 graceful skip — 한 테이블 부재가 전체 run 을 멈추지 않게 한다.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'marketing_play_progress',
    'csv_revenue_uploads',
    'csv_revenue_entries',
    'store_members',
    'store_invites',
    'saas_funnel_manual_weekly',
    'program_applications'
  ];
BEGIN
  -- publication 이 없으면(셀프호스트 등) 생성
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH t IN ARRAY tables LOOP
    -- 테이블이 아직 없으면 skip (날짜순 backlog 미적용 환경 보호)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      RAISE NOTICE '% 테이블이 없어 realtime 설정을 건너뜁니다. 생성 마이그레이션 적용 후 본 SQL 을 재실행하세요.', t;
      CONTINUE;
    END IF;

    -- 1) UPDATE/DELETE 시 구(舊) 레코드를 WAL 에 실어 비-PK 컬럼 필터링 가능하게
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);

    -- 2) supabase_realtime publication 에 추가 (이미 있으면 skip)
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
