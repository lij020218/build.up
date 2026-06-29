-- ─────────────────────────────────────────────────────────────
--  funding_live_snapshot — 누락된 테이블 GRANT 보강 (2026-06-29)
--
--  버그: 20260610_000001 이 RLS 정책(public read)은 만들었으나 테이블 GRANT 를
--    부여하지 않았다. Postgres 에서 RLS 정책이 있어도 테이블 GRANT 가 없으면
--    anon·authenticated·service_role 모두 "permission denied for table" 로 막힌다.
--    → 크론(service_role)이 스냅샷을 쓰지 못해 행이 영영 생기지 않고,
--      /api/funding/live(anon)도 읽지 못해 매번 큐레이션 폴백(92개)만 노출됐다.
--    (관측: 라이브 K-Startup 공고 ~300+ 개가 안 보이고 정적 큐레이션만 보임)
--
--  수정: 다른 테이블(marketing_cases_cache 등)과 동일하게 명시적 GRANT 부여.
--    읽기는 anon/authenticated, 쓰기는 service_role(크론) 전용.
--    RLS 는 그대로 유지(공개 read 정책 + 쓰기 정책 없음 → service_role 만 갱신).
-- ─────────────────────────────────────────────────────────────

grant select on table public.funding_live_snapshot to anon;
grant select on table public.funding_live_snapshot to authenticated;
grant select, insert, update, delete on table public.funding_live_snapshot to service_role;
