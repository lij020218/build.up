-- ─────────────────────────────────────────────────────────────────
--  직원 근속(勤續) 표시 — 입사일 + 근속일수
--
--  용어: '근속' = 한 직장에서 계속 근무한 기간(근속일수/근속연수).
--    (cf. 재직=현직 상태 / 근무일수=실제 일한 날수). 오늘 = 입사 후 N일차.
--
--  기준일: store_members.hire_date(사장이 정확히 지정) → 없으면 joined_at(가게 연결일).
--  RPC 두 개가 joined_at·hire_date 를 반환하도록 확장.
--
--  ⚠️ 원격(prod) 적용 필요.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.store_members ADD COLUMN IF NOT EXISTS hire_date date;

-- 사장용 명부 — 근속 계산에 필요한 joined_at·hire_date 추가
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
      'hire_date', m.hire_date
    ) ORDER BY m.joined_at
  ), '[]'::jsonb)
  INTO v_result
  FROM public.store_members m
  LEFT JOIN public.user_profiles p ON p.user_id = m.member_user_id
  WHERE m.owner_user_id = v_uid;

  RETURN v_result;
END;
$$;

-- 직원용 컨텍스트 — 본인 근속 표시를 위해 joined_at·hire_date 추가
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
  v_store_name text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('connected', false);
  END IF;

  SELECT owner_user_id, role, joined_at, hire_date
    INTO v_owner, v_role, v_joined, v_hire
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
    'store_name', COALESCE(NULLIF(trim(v_store_name), ''), '가게')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_store_members() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_staff_store_context() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_staff_store_context() TO authenticated;
