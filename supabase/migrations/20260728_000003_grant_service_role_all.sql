-- ─────────────────────────────────────────────────────────────
--  service_role 전 테이블 GRANT 일괄 복구 (2026-07-28)
--
--  배경: 이 DB 는 default privilege 부재로 42501(permission denied) 사고가 반복됨
--    (20260429/20260503/20260517 이력 + 오늘 /admin 콘솔 전면 빈화면).
--    명시적 GRANT 를 넣은 최근 마이그레이션의 테이블만 정상이고, 이전 테이블들은
--    service_role 이 SELECT 조차 불가 — user_profiles·user_store_data·roadmaps·
--    attendance_records 등에서 42501 실측 확인.
--
--  service_role 은 서버 전용 키(클라이언트 미노출)이며 Supabase 표준 자세는
--  전 테이블 접근 — RLS 우회 권한과 별개로 테이블 GRANT 가 있어야 한다.
--  아래 default privileges 로 "새 테이블마다 GRANT 누락" 재발도 차단.
-- ─────────────────────────────────────────────────────────────

grant usage on schema public to service_role;

grant all privileges on all tables    in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

-- 앞으로 만들어지는 객체에도 자동 적용 (SQL Editor 실행 주체 = postgres 기준)
alter default privileges in schema public grant all privileges on tables    to service_role;
alter default privileges in schema public grant all privileges on sequences to service_role;
