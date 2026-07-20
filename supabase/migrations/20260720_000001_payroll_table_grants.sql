-- ════════════════════════════════════════════════════════════
-- 2026-07-20: payroll 테이블 3종 GRANT 누락 수정 (출시 전 감사 발견 P1)
--
-- 20260715_000002 가 RLS+policy 만 만들고 table-level GRANT 를 빠뜨림.
-- 이 DB 는 default privilege 부재 이력 (20260429_000001 참조) —
-- GRANT 없으면 RLS 도달 전에 42501 → 급여일 설정·지급 확인(웹 TeamSurface
-- 직접 select/upsert)과 cron payroll-check(service_role select)가 전부 무동작.
--
-- ⚠️ 원격(prod) DB 적용 필요 (20260715 2종과 함께).
-- ════════════════════════════════════════════════════════════

-- 사장 급여일 설정: policy FOR ALL(owner) 과 대칭. cron 이 매일 읽음.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_settings TO authenticated;
GRANT SELECT ON public.payroll_settings TO service_role;

-- 지급 확인: policy FOR ALL(owner) 과 대칭. cron 이 재알림 판단에 읽음.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_confirmations TO authenticated;
GRANT SELECT ON public.payroll_confirmations TO service_role;

-- 미지급 문의: SELECT policy 만 존재 (INSERT 는 report_payroll_unpaid DEFINER 전용,
-- 분쟁 증거라 수정·삭제 정책 없음) → SELECT 만 부여.
GRANT SELECT ON public.payroll_inquiries TO authenticated;
