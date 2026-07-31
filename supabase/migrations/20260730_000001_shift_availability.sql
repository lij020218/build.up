-- ═══════════════════════════════════════════════════════════════════
--  희망 근무 신청 (월별 근무표 조정) — 2026-07-30 사장님 요청
--
--   "카페 같은 곳들 보면 매달 알바생들에게 스케줄을 물어봐서 조정한다더라.
--    5월 마지막 주면 6월에 언제 어떤 시간에 출근 가능한지 캘린더에 기록해서 보내면
--    사장도 그게 보이게. 다른 직원들도 이미 신청한 시간을 보면서 조정하는 거지."
--
--  기존 구조와의 관계
--    · staff_schedule_rules  = 사장이 정한 고정 요일 근무 (확정)
--    · staff_schedules       = 사장이 정한 날짜별 근무/휴무 (확정)
--    · shift_availability    = **직원이 낸 희망** (미확정) ← 이 마이그레이션
--      사장이 희망을 보고 확정하면 staff_schedules 로 옮겨간다(앱이 upsert).
--      희망과 확정을 같은 테이블에 섞으면 "근무표"가 신뢰를 잃는다 → 분리.
--
--  공개 범위 (의도된 설계)
--    직원은 **동료의 희망 시간과 이름**을 볼 수 있다 — 사장님 요청의 핵심
--    ("난 이때 신청해야겠네"). 단 RLS 로 테이블을 직접 열어주지 않고
--    SECURITY DEFINER RPC 로 **근무 관련 필드만** 내려준다(시급·연락처 비노출).
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. 희망 근무 (1일 1구간) ──
CREATE TABLE IF NOT EXISTS public.shift_availability (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_date      date NOT NULL,
  -- 희망 시간대. 종일 가능/시간 무관이면 NULL (억지로 시간을 만들지 않는다).
  start_time     time,
  end_time       time,
  note           text,
  -- ⚠️ 기간(YYYY-MM) 을 GENERATED 컬럼으로 두지 않는다: to_char 의 immutable 판정에 따라
  --    "generation expression is not immutable" 로 **마이그레이션 자체가 실패**할 수 있고,
  --    로컬 Postgres 없이는 그걸 미리 확인할 수 없다. 조회는 날짜 범위로 한다(인덱스도 그게 낫다).
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_user_id, work_date),
  -- 시간을 넣을 거면 둘 다 (한쪽만 있으면 화면이 해석 못 함)
  CONSTRAINT shift_avail_time_pair CHECK (
    (start_time IS NULL AND end_time IS NULL) OR (start_time IS NOT NULL AND end_time IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS shift_avail_owner_date_idx ON public.shift_availability (owner_user_id, work_date);
CREATE INDEX IF NOT EXISTS shift_avail_member_date_idx ON public.shift_availability (member_user_id, work_date);

-- ── 2. 제출 상태 (누가 아직 안 냈는지) ──
--   희망 0건과 "아직 안 냄"은 완전히 다르다. 행 유무로 구분할 수 없어 별도 테이블.
CREATE TABLE IF NOT EXISTS public.shift_availability_submissions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period         text NOT NULL CHECK (period ~ '^[0-9]{4}-[0-9]{2}$'),
  submitted_at   timestamptz NOT NULL DEFAULT now(),
  note           text,
  UNIQUE (member_user_id, period)
);
CREATE INDEX IF NOT EXISTS shift_avail_sub_owner_idx ON public.shift_availability_submissions (owner_user_id, period);

-- ── 3. 마감일 설정 (사장) ──
--   전월 며칠까지 받을지. 기본 31 = **말일**(6월분을 5/25까지 받으면 너무 빡빡하다 —
--   사장님 지적 2026-07-30). 31일이 없는 달은 앱이 말일로 보정한다(payday_day 와 같은 관례).
--   근무표를 미리 짜야 하는 사장은 화면에서 앞당길 수 있다.
ALTER TABLE public.payroll_settings
  ADD COLUMN IF NOT EXISTS shift_request_deadline_day int NOT NULL DEFAULT 31
    CHECK (shift_request_deadline_day BETWEEN 1 AND 31);
COMMENT ON COLUMN public.payroll_settings.shift_request_deadline_day IS
  '희망 근무 신청 마감일(전월 N일, 31=말일). 다음 달 근무표를 이 날까지 받는다.';

-- ── 3-b. 근무 시간대 (사장이 정의) ──
--   "시간을 사장이 정해서 저장하게 하자. 업장마다 운영 시간이 다 다르잖아" (사장님 2026-07-30)
--   [{label,start,end}, ...] 최대 6개. 순서가 화면 버튼 순서라 배열(jsonb)로 둔다.
--   직원은 payroll_settings 를 직접 못 읽으므로 get_shift_availability RPC 가 함께 내려준다.
--   ⚠️ 형식 검증은 앱(normalizeShiftSlots)이 한다 — DB CHECK 로 jsonb 구조를 강제하면
--      필드를 늘릴 때마다 마이그레이션이 필요해지고, 깨진 항목은 화면이 조용히 버리는 게 안전하다.
ALTER TABLE public.payroll_settings
  ADD COLUMN IF NOT EXISTS shift_slots jsonb NOT NULL DEFAULT '[]'::jsonb;
COMMENT ON COLUMN public.payroll_settings.shift_slots IS
  '사장이 정한 근무 시간대 [{label,start,end}] (최대 6). 빈 배열 = 미설정 → 앱이 일반 예시로 폴백.';

-- ── 4. RLS ──
ALTER TABLE public.shift_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_availability_submissions ENABLE ROW LEVEL SECURITY;

-- 직원: 본인 행 전체 권한 (단 소속 가게에만). 사장: 내 가게 행 전체 권한.
DROP POLICY IF EXISTS shift_avail_member ON public.shift_availability;
DROP POLICY IF EXISTS shift_avail_owner  ON public.shift_availability;
CREATE POLICY shift_avail_member ON public.shift_availability FOR ALL TO authenticated
  USING (member_user_id = auth.uid())
  WITH CHECK (
    member_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.store_members m
      WHERE m.owner_user_id = shift_availability.owner_user_id
        AND m.member_user_id = auth.uid()
        AND m.settled_at IS NULL
    )
  );
CREATE POLICY shift_avail_owner ON public.shift_availability FOR ALL TO authenticated
  USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS shift_avail_sub_member ON public.shift_availability_submissions;
DROP POLICY IF EXISTS shift_avail_sub_owner  ON public.shift_availability_submissions;
CREATE POLICY shift_avail_sub_member ON public.shift_availability_submissions FOR ALL TO authenticated
  USING (member_user_id = auth.uid())
  WITH CHECK (
    member_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.store_members m
      WHERE m.owner_user_id = shift_availability_submissions.owner_user_id
        AND m.member_user_id = auth.uid()
        AND m.settled_at IS NULL
    )
  );
CREATE POLICY shift_avail_sub_owner ON public.shift_availability_submissions FOR ALL TO authenticated
  USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

-- ── 5. 취합 조회 RPC — 동료 희망을 이름과 함께 (근무 필드만) ──
--   호출자는 해당 가게의 사장이거나 재직 중인 직원이어야 한다.
--   ⚠️ 노출 필드를 늘릴 때는 시급·연락처·주소가 섞이지 않는지 확인할 것.
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
  v_to date;    -- 배타 상한 (다음 달 1일)
BEGIN
  IF v_uid IS NULL OR p_owner IS NULL OR p_period IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_request');
  END IF;
  IF p_period !~ '^[0-9]{4}-[0-9]{2}$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_period');
  END IF;

  v_from := (p_period || '-01')::date;
  v_to := (v_from + interval '1 month')::date;   -- 명시 캐스팅 (date + interval = timestamp)

  v_is_owner := (p_owner = v_uid);
  SELECT EXISTS (
    SELECT 1 FROM public.store_members m
    WHERE m.owner_user_id = p_owner AND m.member_user_id = v_uid AND m.settled_at IS NULL
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
             'note', a.note,
             'mine', (a.member_user_id = v_uid)
           ) AS x
    FROM public.shift_availability a
    JOIN public.store_members m
      ON m.owner_user_id = a.owner_user_id AND m.member_user_id = a.member_user_id
    -- 퇴사자 제외 — 사장 화면의 activeMembers(!hasLeft)와 **같은 모집단**이어야 한다.
    --   left_at 을 안 걸면 퇴사한 사람이 다음 달 희망 명단에 남아 인원 수를 부풀린다.
    WHERE a.owner_user_id = p_owner
      AND a.work_date >= v_from AND a.work_date < v_to
      AND m.settled_at IS NULL AND m.left_at IS NULL
  ) s;

  -- 제출 현황 — 재직 직원 전원 기준이어야 "아직 안 낸 사람"이 보인다.
  --   🔴 단 이건 **사장 관리 정보**다. 직원에게는 본인 행만 내려간다
  --      (직원 화면은 "제출 완료" 배지에만 쓰고, 동료 미제출 명단은 볼 이유가 없다).
  --      화면에서 안 그리는 것만으론 안 된다 — 응답에 실리면 개발자도구에서 읽힌다.
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
    -- 사장이 정한 근무 시간대 — 직원 신청 버튼이 이걸로 그려진다
    'slots', COALESCE(v_slots, '[]'::jsonb),
    'rows', v_rows,
    'submissions', v_subs
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_shift_availability(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shift_availability(uuid, text) TO authenticated;

-- ── 6. realtime ──
--   ⚠️ 이건 **사장 화면에만** 효과가 있다. realtime 은 RLS 를 그대로 따르므로
--      직원은 동료 행을 스트리밍으로 받지 못한다(자기 행만 보이는 정책).
--      직원 화면의 동료 현황은 재조회(화면 복귀·새로고침·본인 저장 후)로 갱신한다.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['shift_availability', 'shift_availability_submissions'];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ── 7. service_role 권한 (2026-07-28 42501 재발 방지 — 새 테이블은 항상 함께) ──
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shift_availability TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shift_availability_submissions TO service_role;
