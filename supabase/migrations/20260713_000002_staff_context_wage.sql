-- ─────────────────────────────────────────────────────────────────
-- 직원 컨텍스트에 시급 노출 (2026-07-13)
--
--   직원이 자기 근로 권리(주휴수당·퇴직금 자격)를 확인하려면 본인 시급이 필요.
--   get_staff_store_context 는 SECURITY DEFINER 라 store_members.hourly_wage 를
--   본인 것만 안전하게 반환한다 (동료 시급은 여전히 비노출 — 본인 행만 조회).
--
-- ⚠️ 20260713_000001(hourly_wage 컬럼) 이후 적용.
-- ─────────────────────────────────────────────────────────────────

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
  v_store_name text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('connected', false);
  END IF;

  SELECT owner_user_id, role, joined_at, hire_date, hourly_wage
    INTO v_owner, v_role, v_joined, v_hire, v_wage
  FROM public.store_members
  WHERE member_user_id = v_uid
  ORDER BY joined_at DESC
  LIMIT 1;

  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('connected', false);
  END IF;

  SELECT store_name INTO v_store_name
  FROM public.user_store_data
  WHERE user_id = v_owner
  LIMIT 1;

  RETURN jsonb_build_object(
    'connected', true,
    'owner_user_id', v_owner,
    'role', v_role,
    'joined_at', v_joined,
    'hire_date', v_hire,
    'hourly_wage', v_wage,
    'store_name', COALESCE(NULLIF(trim(v_store_name), ''), '가게')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_staff_store_context() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_staff_store_context() TO authenticated;
