-- ─────────────────────────────────────────────────────────────────
--  store_members.hire_date 컬럼 보장 (2026-07-13) — 긴급 수정
--
--  증상: 직원 대시보드 "연결된 업장이 없어요" + 사장 팀 화면 "직원 없음"
--    — 그런데 store_members 에는 연결 행이 멀쩡히 존재.
--
--  원인: get_store_members / get_staff_store_context (20260713_000001·000002 에서
--    재정의)가 m.hire_date 를 참조하는데, 그 컬럼을 추가하는 20260708_000005 가
--    prod 에 적용되지 않아 두 RPC 가 런타임에 42703("column hire_date does not
--    exist")로 실패 → 클라이언트가 이를 "연결 없음"으로 처리.
--
--  수정: 컬럼만 멱등 추가한다. (20260708_000005 를 통째로 재실행하지 말 것 —
--    그 안의 RPC 정의는 hourly_wage 이전 버전이라 Slice A 시급 기능을 되돌린다.)
--
--  ⚠️ 원격(prod) DB 에 적용해야 효과. 적용 즉시 두 화면 복구.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.store_members
  ADD COLUMN IF NOT EXISTS hire_date date;
