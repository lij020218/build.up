-- ─────────────────────────────────────────────────────────────
--  payroll_settings.leave_basis — 연차 부여 기준 (2026-07-28 사장님 요청)
--
--  실무에서 두 방식이 모두 쓰인다:
--    · hire_date   = 입사일 기준 (법 원칙, 직원마다 발생일 다름)
--    · fiscal_year = 회계연도 기준 (매년 1/1 일괄, 관리 편의)
--  사장이 화면에서 버튼으로 고른다. 기본값은 법 원칙인 입사일 기준.
--
--  연차 일수 자체는 근로기준법 제60조로 정해져 있어 저장하지 않고 계산한다
--  (packages/shared/team/annual-leave.ts SSOT). 저장하면 법 개정 시 낡은 값이 남는다.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.payroll_settings
  ADD COLUMN IF NOT EXISTS leave_basis text NOT NULL DEFAULT 'hire_date'
    CHECK (leave_basis IN ('hire_date', 'fiscal_year'));

COMMENT ON COLUMN public.payroll_settings.leave_basis IS
  '연차 부여 기준: hire_date(입사일) | fiscal_year(회계연도 1/1). 일수는 근로기준법 제60조로 계산 — 저장 안 함.';

-- payday_day 가 NOT NULL 이라 연차 기준만 먼저 정하는 사장님이 행을 못 만드는 문제 방지.
--   급여일 미정 상태(=25일 관례)로 기본값을 두고, 급여일 카드에서 언제든 변경 가능.
ALTER TABLE public.payroll_settings
  ALTER COLUMN payday_day SET DEFAULT 25;

-- ── 직원 화면용 — 연차 계산에 필요한 사장 설정을 컨텍스트에 실어준다 ──
--   직원은 leave_basis(사장 선택)와 상시 인원(5인 기준선)을 알 수 없으면 자기 연차를 못 본다.
--   ⚠️ 기존 필드를 **전부 포함한 superset** 으로 재정의한다 — 2026-07-13 hire_date 누락으로
--      RPC 가 붕괴해 "연결된 업장 없음" 사고가 났던 전례(feedback_rpc_column_dependency).
CREATE OR REPLACE FUNCTION public.get_staff_store_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_role text;
  v_joined timestamptz;
  v_hire date;
  v_wage integer;
  v_emp text;
  v_duties jsonb;
  v_left timestamptz;
  v_store_name text;
  v_payday int;
  v_leave_basis text;
  v_headcount int;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('connected', false);
  END IF;

  SELECT owner_user_id, role, joined_at, hire_date, hourly_wage, employment_type,
         COALESCE(job_duties, '[]'::jsonb), left_at
    INTO v_owner, v_role, v_joined, v_hire, v_wage, v_emp, v_duties, v_left
  FROM public.store_members
  WHERE member_user_id = v_uid
    AND settled_at IS NULL
  ORDER BY joined_at DESC
  LIMIT 1;

  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('connected', false);
  END IF;

  SELECT store_name INTO v_store_name FROM public.user_store_data WHERE user_id = v_owner LIMIT 1;
  SELECT payday_day, leave_basis INTO v_payday, v_leave_basis
    FROM public.payroll_settings WHERE owner_user_id = v_owner;

  -- 연차 5인 기준선용 재직 인원 (퇴사자 제외) — 사장 화면의 activeMembers 와 같은 모집단
  SELECT count(*) INTO v_headcount
  FROM public.store_members
  WHERE owner_user_id = v_owner AND left_at IS NULL;

  RETURN jsonb_build_object(
    'connected', true,
    'owner_user_id', v_owner,
    'role', v_role,
    'joined_at', v_joined,
    'hire_date', v_hire,
    'hourly_wage', v_wage,
    'employment_type', v_emp,
    'job_duties', v_duties,
    'left_at', v_left,
    'payday_day', v_payday,
    'leave_basis', COALESCE(v_leave_basis, 'hire_date'),
    'staff_headcount', COALESCE(v_headcount, 0),
    'store_name', COALESCE(NULLIF(trim(v_store_name), ''), '가게')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_staff_store_context() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_staff_store_context() TO authenticated;
