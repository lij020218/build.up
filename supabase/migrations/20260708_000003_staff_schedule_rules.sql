-- ─────────────────────────────────────────────────────────────────
--  근무표 = 주간 반복 규칙 + 날짜별 예외(override)
--
--  staff_schedule_rules : "매주 월화목금 17:00–23:00" 같은 반복 규칙 (사장 배정)
--  staff_schedules      : 특정 날짜의 예외 — 다른 시간으로 override 하거나 is_off 로 휴무
--
--  직원 화면의 오늘/캘린더 근무는 다음으로 해석:
--    해당 날짜 예외행 있으면 → is_off=true 면 휴무, 아니면 예외 시간
--    없으면 → 그 요일의 활성 규칙 시간
--    둘 다 없으면 → 근무 없음
--
--  ⚠️ 원격(prod) DB 에 적용되어야 효과. (20260708_000002 선행)
-- ─────────────────────────────────────────────────────────────────

-- 1) 주간 반복 규칙
CREATE TABLE IF NOT EXISTS public.staff_schedule_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),  -- 0=일 … 6=토
  start_time time NOT NULL,
  end_time time NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, member_user_id, weekday)
);

ALTER TABLE public.staff_schedule_rules ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_schedule_rules TO authenticated;

DROP POLICY IF EXISTS srule_owner       ON public.staff_schedule_rules;
DROP POLICY IF EXISTS srule_member_read ON public.staff_schedule_rules;
CREATE POLICY srule_owner ON public.staff_schedule_rules FOR ALL TO authenticated
  USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY srule_member_read ON public.staff_schedule_rules FOR SELECT TO authenticated
  USING (member_user_id = auth.uid());

-- 2) 날짜별 예외(override) — staff_schedules 재활용.
--    is_off=true → 그 날 휴무(규칙 무시). is_off=false + 시간 → 그 날만 다른 시간.
--    휴무행은 시간이 없을 수 있으므로 NOT NULL 완화.
ALTER TABLE public.staff_schedules ADD COLUMN IF NOT EXISTS is_off boolean NOT NULL DEFAULT false;
ALTER TABLE public.staff_schedules ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE public.staff_schedules ALTER COLUMN end_time DROP NOT NULL;

-- 3) 사장이 자기 가게 직원 명부(이름 포함)를 조회 — user_profiles 는 본인전용 RLS라 RPC 로 우회.
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
      'name', COALESCE(NULLIF(trim(concat_ws('', p.last_name, p.first_name)), ''), '직원')
    ) ORDER BY m.joined_at
  ), '[]'::jsonb)
  INTO v_result
  FROM public.store_members m
  LEFT JOIN public.user_profiles p ON p.user_id = m.member_user_id
  WHERE m.owner_user_id = v_uid;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_store_members() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_members() TO authenticated;
