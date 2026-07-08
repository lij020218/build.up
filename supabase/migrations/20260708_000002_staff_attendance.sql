  -- ─────────────────────────────────────────────────────────────────
  --  직원 대시보드 데이터 모델 — 근무 일정 · 출퇴근 기록 · 연차/휴가
  --
  --  직원(store_members 로 사장 가게에 연결된 사용자)이 자기 데이터를
  --  직접 읽고 쓰되(member_user_id = auth.uid()), 반드시 자신이 소속된
  --  가게(store_members 존재)의 범위 안에서만 쓰도록 RLS 로 강제.
  --  사장은 자기 가게(owner_user_id = auth.uid()) 데이터를 관리.
  --
  --  가짜 데이터 없음 — 출퇴근은 직원이 버튼으로 생성, 일정은 사장이 배정,
  --  연차는 직원이 신청. 데이터 없으면 UI 는 정직한 빈 상태 표시.
  --
  --  ⚠️ 원격(prod) DB 에 적용되어야 효과.
  -- ─────────────────────────────────────────────────────────────────

  -- 1) 근무 일정 (사장이 배정 → 직원이 조회)
  CREATE TABLE IF NOT EXISTS public.staff_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    member_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    work_date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (owner_user_id, member_user_id, work_date)
  );

  -- 2) 출퇴근 기록 (직원이 출근/퇴근 버튼으로 생성)
  CREATE TABLE IF NOT EXISTS public.attendance_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    member_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    work_date date NOT NULL,
    clock_in_at timestamptz NOT NULL DEFAULT now(),
    clock_out_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (member_user_id, work_date)
  );

  -- 3) 연차·휴가 신청 (직원이 신청 → 사장이 승인/반려)
  CREATE TABLE IF NOT EXISTS public.leave_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    member_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    leave_type text NOT NULL DEFAULT 'annual' CHECK (leave_type IN ('annual','half','sick','other')),
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    created_at timestamptz NOT NULL DEFAULT now(),
    decided_at timestamptz
  );

  ALTER TABLE public.staff_schedules   ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.leave_requests     ENABLE ROW LEVEL SECURITY;

  GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_schedules   TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests     TO authenticated;

  -- ── RLS: 근무 일정 ──
  DROP POLICY IF EXISTS sched_owner       ON public.staff_schedules;
  DROP POLICY IF EXISTS sched_member_read ON public.staff_schedules;
  CREATE POLICY sched_owner ON public.staff_schedules FOR ALL TO authenticated
    USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
  CREATE POLICY sched_member_read ON public.staff_schedules FOR SELECT TO authenticated
    USING (member_user_id = auth.uid());

  -- ── RLS: 출퇴근 ── 직원은 소속 가게 범위에서 본인 것만 read/write, 사장은 조회
  DROP POLICY IF EXISTS att_member     ON public.attendance_records;
  DROP POLICY IF EXISTS att_owner_read ON public.attendance_records;
  CREATE POLICY att_member ON public.attendance_records FOR ALL TO authenticated
    USING (member_user_id = auth.uid())
    WITH CHECK (
      member_user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.store_members m
        WHERE m.owner_user_id = attendance_records.owner_user_id
          AND m.member_user_id = auth.uid()
      )
    );
  CREATE POLICY att_owner_read ON public.attendance_records FOR SELECT TO authenticated
    USING (owner_user_id = auth.uid());

  -- ── RLS: 연차 ── 직원은 신청(pending)·조회·취소만, 승인/반려는 사장만
  DROP POLICY IF EXISTS leave_member_read   ON public.leave_requests;
  DROP POLICY IF EXISTS leave_member_insert ON public.leave_requests;
  DROP POLICY IF EXISTS leave_member_cancel ON public.leave_requests;
  DROP POLICY IF EXISTS leave_owner_read    ON public.leave_requests;
  DROP POLICY IF EXISTS leave_owner_update  ON public.leave_requests;
  CREATE POLICY leave_member_read ON public.leave_requests FOR SELECT TO authenticated
    USING (member_user_id = auth.uid());
  CREATE POLICY leave_member_insert ON public.leave_requests FOR INSERT TO authenticated
    WITH CHECK (
      member_user_id = auth.uid()
      AND status = 'pending'
      AND EXISTS (
        SELECT 1 FROM public.store_members m
        WHERE m.owner_user_id = leave_requests.owner_user_id
          AND m.member_user_id = auth.uid()
      )
    );
  CREATE POLICY leave_member_cancel ON public.leave_requests FOR DELETE TO authenticated
    USING (member_user_id = auth.uid() AND status = 'pending');
  CREATE POLICY leave_owner_read ON public.leave_requests FOR SELECT TO authenticated
    USING (owner_user_id = auth.uid());
  CREATE POLICY leave_owner_update ON public.leave_requests FOR UPDATE TO authenticated
    USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

  -- 4) 직원 가게 컨텍스트 — user_store_data RLS(본인 전용)를 우회해 가게명만 안전 노출
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
    v_store_name text;
  BEGIN
    IF v_uid IS NULL THEN
      RETURN jsonb_build_object('connected', false);
    END IF;

    SELECT owner_user_id, role INTO v_owner, v_role
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
      'store_name', COALESCE(NULLIF(trim(v_store_name), ''), '가게')
    );
  END;
  $$;

  REVOKE ALL ON FUNCTION public.get_staff_store_context() FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.get_staff_store_context() TO authenticated;
