-- ─────────────────────────────────────────────────────────────────
-- 직원 시급 + 출퇴근 푸시 알림 (2026-07-13)
--
--   ① store_members.hourly_wage — 사장이 설정하는 직원 시급 (원).
--      개인정보 격리: 기존 RLS 가 이미 정확 —
--        · 직원은 "본인 행만" SELECT (Members can view own memberships:
--          member_user_id = auth.uid()) → 동료 시급 조회 불가
--        · 수정은 사장만 (Owners can manage members: owner_user_id = auth.uid())
--   ② get_store_members() 확장 — hourly_wage 반환 (사장 팀 화면 조회용)
--   ③ 출근/퇴근 트리거 — attendance_records INSERT(출근)·clock_out UPDATE(퇴근)
--      → push_dispatch(사장) "김알바님이 17:02에 출근했어요"
--      (push_dispatch 는 20260712_000002 — best-effort, 원 트랜잭션 무영향)
--
-- ⚠️ 원격(prod) DB 적용 필요. 20260712_000002 이후 적용할 것.
-- ─────────────────────────────────────────────────────────────────

-- 1) 시급 컬럼
ALTER TABLE public.store_members
  ADD COLUMN IF NOT EXISTS hourly_wage integer;

-- 2) get_store_members 확장 (20260708_000005 superset — hourly_wage 추가)
CREATE OR REPLACE FUNCTION public.get_store_members()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF v_uid IS NULL THEN RETURN '[]'::jsonb; END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'member_user_id', m.member_user_id,
      'role', m.role,
      'name', COALESCE(NULLIF(trim(concat_ws('', p.last_name, p.first_name)), ''), '직원'),
      'joined_at', m.joined_at,
      'hire_date', m.hire_date,
      'hourly_wage', m.hourly_wage
    ) ORDER BY m.joined_at
  ), '[]'::jsonb)
  INTO v_result
  FROM public.store_members m
  LEFT JOIN public.user_profiles p ON p.user_id = m.member_user_id
  WHERE m.owner_user_id = v_uid;

  RETURN v_result;
END;
$$;

-- 3-1) 출근 → 사장에게 푸시
CREATE OR REPLACE FUNCTION public.notify_clock_in()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_name text;
BEGIN
  SELECT COALESCE(NULLIF(trim(concat_ws('', p.last_name, p.first_name)), ''), '직원')
  INTO v_name FROM public.user_profiles p WHERE p.user_id = NEW.member_user_id LIMIT 1;

  PERFORM public.push_dispatch(
    NEW.owner_user_id,
    '직원 출근',
    COALESCE(v_name, '직원') || '님이 ' ||
      to_char(COALESCE(NEW.clock_in_at, now()) AT TIME ZONE 'Asia/Seoul', 'HH24:MI') ||
      '에 출근했어요.',
    '/team'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_clock_in ON public.attendance_records;
CREATE TRIGGER trg_notify_clock_in
  AFTER INSERT ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.notify_clock_in();

-- 3-2) 퇴근 → 사장에게 푸시 (총 근무시간 포함 — 야근 파악)
CREATE OR REPLACE FUNCTION public.notify_clock_out()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_name text;
  v_min integer;
BEGIN
  IF NEW.clock_out_at IS NULL OR OLD.clock_out_at IS NOT NULL THEN RETURN NEW; END IF;

  SELECT COALESCE(NULLIF(trim(concat_ws('', p.last_name, p.first_name)), ''), '직원')
  INTO v_name FROM public.user_profiles p WHERE p.user_id = NEW.member_user_id LIMIT 1;

  v_min := GREATEST(0, floor(extract(epoch FROM (NEW.clock_out_at - NEW.clock_in_at)) / 60))::integer;

  PERFORM public.push_dispatch(
    NEW.owner_user_id,
    '직원 퇴근',
    COALESCE(v_name, '직원') || '님이 ' ||
      to_char(NEW.clock_out_at AT TIME ZONE 'Asia/Seoul', 'HH24:MI') ||
      '에 퇴근했어요 · 총 ' || (v_min / 60) || '시간 ' || (v_min % 60) || '분 근무.',
    '/team'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_clock_out ON public.attendance_records;
CREATE TRIGGER trg_notify_clock_out
  AFTER UPDATE OF clock_out_at ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.notify_clock_out();
