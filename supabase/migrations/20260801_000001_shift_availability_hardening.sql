-- ═══════════════════════════════════════════════════════════════════
--  희망 근무 보안 하드닝 (2026-08-01 출시 전 전수 감사)
--
--  20260730_000001 로 만든 테이블/정책의 결함 3건 수정.
--  기존 마이그레이션을 고치지 않고 새 파일로 — 이미 prod 적용됨.
-- ═══════════════════════════════════════════════════════════════════

-- ── P1. UNIQUE 에 owner_user_id 누락 → 크로스테넌트 쓰기 ──
--   기존: UNIQUE (member_user_id, work_date)
--   투잡 알바(A·B 가게 동시 소속)가 B 가게에서 같은 날짜를 저장하면
--   ON CONFLICT 가 A 가게의 행을 잡아 owner_user_id 를 B 로 갈아엎는다.
--   → A 사장 화면에서 그 희망이 흔적 없이 사라지고 "미제출"로 보인다.
--   RLS 는 뚫리지 않지만(둘 다 본인 행) 테넌트 경계를 가로지르는 쓰기다.
--   staff_schedules 는 이미 (owner, member, work_date) 3열 — 그 관례로 통일.

-- 중복 정리 먼저 (같은 member+date 가 서로 다른 owner 로 존재할 수 있음 — 신규 기능이라 보통 0건).
--   같은 (owner, member, date) 안의 중복만 최신 1건 남기고 제거.
DELETE FROM public.shift_availability a
USING public.shift_availability b
WHERE a.owner_user_id = b.owner_user_id
  AND a.member_user_id = b.member_user_id
  AND a.work_date = b.work_date
  AND a.ctid < b.ctid;

DELETE FROM public.shift_availability_submissions a
USING public.shift_availability_submissions b
WHERE a.owner_user_id = b.owner_user_id
  AND a.member_user_id = b.member_user_id
  AND a.period = b.period
  AND a.ctid < b.ctid;

ALTER TABLE public.shift_availability
  DROP CONSTRAINT IF EXISTS shift_availability_member_user_id_work_date_key;
ALTER TABLE public.shift_availability
  ADD CONSTRAINT shift_availability_owner_member_date_key
  UNIQUE (owner_user_id, member_user_id, work_date);

ALTER TABLE public.shift_availability_submissions
  DROP CONSTRAINT IF EXISTS shift_availability_submissions_member_user_id_period_key;
ALTER TABLE public.shift_availability_submissions
  ADD CONSTRAINT shift_availability_submissions_owner_member_period_key
  UNIQUE (owner_user_id, member_user_id, period);

-- ── P2-1. 인가는 settled_at 만 보는데 결과는 left_at 까지 거른다 (모집단 불일치) ──
--   퇴사(left_at) 했지만 정산(settled_at) 전인 사람이 동료들의 향후 근무 희망을
--   계속 조회할 수 있었다. 정산 버튼은 사장이 안 누르면 영영 안 눌린다.
-- ── P2-2. 사장 정책 WITH CHECK 에 소속 검증 없음 ──
--   사장이 임의 uuid 로 행을 만들 수 있었다(직원 정책과 비대칭).
DROP POLICY IF EXISTS shift_avail_owner ON public.shift_availability;
CREATE POLICY shift_avail_owner ON public.shift_availability FOR ALL TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (
    owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.store_members m
      WHERE m.owner_user_id = auth.uid()
        AND m.member_user_id = shift_availability.member_user_id
        AND m.settled_at IS NULL
    )
  );

DROP POLICY IF EXISTS shift_avail_sub_owner ON public.shift_availability_submissions;
CREATE POLICY shift_avail_sub_owner ON public.shift_availability_submissions FOR ALL TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (
    owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.store_members m
      WHERE m.owner_user_id = auth.uid()
        AND m.member_user_id = shift_availability_submissions.member_user_id
        AND m.settled_at IS NULL
    )
  );

-- 직원 정책 — 퇴사자 차단 추가 (settled_at 뿐이던 것에 left_at 병기)
DROP POLICY IF EXISTS shift_avail_member ON public.shift_availability;
CREATE POLICY shift_avail_member ON public.shift_availability FOR ALL TO authenticated
  USING (member_user_id = auth.uid())
  WITH CHECK (
    member_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.store_members m
      WHERE m.owner_user_id = shift_availability.owner_user_id
        AND m.member_user_id = auth.uid()
        AND m.settled_at IS NULL
        AND m.left_at IS NULL
    )
  );

DROP POLICY IF EXISTS shift_avail_sub_member ON public.shift_availability_submissions;
CREATE POLICY shift_avail_sub_member ON public.shift_availability_submissions FOR ALL TO authenticated
  USING (member_user_id = auth.uid())
  WITH CHECK (
    member_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.store_members m
      WHERE m.owner_user_id = shift_availability_submissions.owner_user_id
        AND m.member_user_id = auth.uid()
        AND m.settled_at IS NULL
        AND m.left_at IS NULL
    )
  );

-- RPC 인가도 동일하게 — 조회 권한과 결과 모집단을 일치시킨다
CREATE OR REPLACE FUNCTION public.get_shift_availability(p_owner uuid, p_period text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_owner boolean;
  v_is_member boolean;
  v_rows jsonb;
  v_subs jsonb;
  v_deadline int;
  v_slots jsonb;
  v_from date;
  v_to date;
BEGIN
  IF v_uid IS NULL OR p_owner IS NULL OR p_period IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_request');
  END IF;
  IF p_period !~ '^[0-9]{4}-[0-9]{2}$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_period');
  END IF;

  v_from := (p_period || '-01')::date;
  v_to := (v_from + interval '1 month')::date;

  v_is_owner := (p_owner = v_uid);
  -- 🔴 left_at 추가 (2026-08-01): 퇴사자가 동료의 향후 근무 희망을 계속 보던 구멍.
  --    인가 모집단 = 결과 모집단 (아래 rows/subs 의 필터와 동일해야 한다).
  SELECT EXISTS (
    SELECT 1 FROM public.store_members m
    WHERE m.owner_user_id = p_owner AND m.member_user_id = v_uid
      AND m.settled_at IS NULL AND m.left_at IS NULL
  ) INTO v_is_member;

  IF NOT (v_is_owner OR v_is_member) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'forbidden');
  END IF;

  SELECT COALESCE(jsonb_agg(x ORDER BY x->>'work_date', x->>'name'), '[]'::jsonb) INTO v_rows
  FROM (
    SELECT jsonb_build_object(
             'member_user_id', a.member_user_id,
             'name', COALESCE(NULLIF(trim(m.name), ''), '직원'),
             'work_date', a.work_date,
             'start_time', a.start_time,
             'end_time', a.end_time,
             -- note 는 내려주지 않는다 (2026-08-01): 사유 입력이 붙는 순간
             --   직원이 사장에게만 말한 내용이 전 동료에게 broadcast 된다.
             'mine', (a.member_user_id = v_uid)
           ) AS x
    FROM public.shift_availability a
    JOIN public.store_members m
      ON m.owner_user_id = a.owner_user_id AND m.member_user_id = a.member_user_id
    WHERE a.owner_user_id = p_owner
      AND a.work_date >= v_from AND a.work_date < v_to
      AND m.settled_at IS NULL AND m.left_at IS NULL
  ) s;

  SELECT COALESCE(jsonb_agg(y ORDER BY y->>'name'), '[]'::jsonb) INTO v_subs
  FROM (
    SELECT jsonb_build_object(
             'member_user_id', m.member_user_id,
             'name', COALESCE(NULLIF(trim(m.name), ''), '직원'),
             'submitted_at', s.submitted_at,
             'day_count', (
               SELECT count(*) FROM public.shift_availability a
               WHERE a.owner_user_id = p_owner AND a.member_user_id = m.member_user_id
                 AND a.work_date >= v_from AND a.work_date < v_to
             ),
             'mine', (m.member_user_id = v_uid)
           ) AS y
    FROM public.store_members m
    LEFT JOIN public.shift_availability_submissions s
      ON s.member_user_id = m.member_user_id AND s.period = p_period AND s.owner_user_id = p_owner
    WHERE m.owner_user_id = p_owner AND m.settled_at IS NULL AND m.left_at IS NULL
      AND (v_is_owner OR m.member_user_id = v_uid)   -- 직원은 본인 행만
  ) t;

  SELECT shift_request_deadline_day, COALESCE(shift_slots, '[]'::jsonb)
    INTO v_deadline, v_slots
  FROM public.payroll_settings WHERE owner_user_id = p_owner;

  RETURN jsonb_build_object(
    'ok', true,
    'period', p_period,
    'deadline_day', COALESCE(v_deadline, 31),
    'slots', COALESCE(v_slots, '[]'::jsonb),
    'rows', v_rows,
    'submissions', v_subs
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_shift_availability(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shift_availability(uuid, text) TO authenticated;

-- ── P2-5. DEFINER search_path 에 pg_temp 미명시 (저장소 관례 이탈) ──
--   pg_temp 를 명시하지 않으면 릴레이션 해석 시 임시 스키마가 암묵적으로 먼저 검색된다.
ALTER FUNCTION public.record_surface_visit(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.consume_ai_monthly_budget(uuid, text, numeric, numeric) SET search_path = public, pg_temp;
