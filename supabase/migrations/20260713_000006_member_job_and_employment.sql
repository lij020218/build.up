-- ─────────────────────────────────────────────────────────────────
--  직원 고용형태 + 업무 직무 (2026-07-13)
--
--  사장이 직원에게 ① 고용형태(part_time 단기알바 / full_time 정직원 / contract 계약직)
--  ② 업무 직무(홀서빙·경리·마케팅 등, 복수) 를 부여·저장 → 사장·직원 양쪽에 표시.
--
--  두 RPC(get_store_members·get_staff_store_context)를 **기존 필드 전부 포함한
--  superset** 으로 재정의(hire_date·hourly_wage 유지 — 2026-07-13 hire_date 누락으로
--  RPC 붕괴했던 사고 재발 방지)하며 employment_type·job_duties 추가.
--
--  SSOT: packages/shared/src/team/job-duties.ts (직무 key·라벨·업종분기). DB 는 key 만 저장.
--
--  ⚠️ 원격(prod) DB 적용 필요.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.store_members
  ADD COLUMN IF NOT EXISTS employment_type text
    CHECK (employment_type IS NULL OR employment_type IN ('part_time','full_time','contract')),
  ADD COLUMN IF NOT EXISTS job_duties jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ── 사장용 명부 (superset: joined_at·hire_date·hourly_wage + employment_type·job_duties) ──
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
      'hourly_wage', m.hourly_wage,
      'employment_type', m.employment_type,
      'job_duties', COALESCE(m.job_duties, '[]'::jsonb)
    ) ORDER BY m.joined_at
  ), '[]'::jsonb)
  INTO v_result
  FROM public.store_members m
  LEFT JOIN public.user_profiles p ON p.user_id = m.member_user_id
  WHERE m.owner_user_id = v_uid;

  RETURN v_result;
END;
$$;

-- ── 직원용 컨텍스트 (superset + employment_type·job_duties) ──
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
  v_store_name text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('connected', false);
  END IF;

  SELECT owner_user_id, role, joined_at, hire_date, hourly_wage, employment_type, COALESCE(job_duties, '[]'::jsonb)
    INTO v_owner, v_role, v_joined, v_hire, v_wage, v_emp, v_duties
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
    'employment_type', v_emp,
    'job_duties', v_duties,
    'store_name', COALESCE(NULLIF(trim(v_store_name), ''), '가게')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_store_members() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_members() TO authenticated;
REVOKE ALL ON FUNCTION public.get_staff_store_context() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_staff_store_context() TO authenticated;
