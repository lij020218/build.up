-- ─────────────────────────────────────────────────────────────────
--  추가 수당 신청 (2026-07-13)
--
--  사용자 명령: "추가 수당을 줘야 하는 사항이 생기면 사장에게 알리고
--    직원에게도 '추가 수당 신청' UI 가 생기게" — 몰랐다가 얼굴 붉히는 상황 방지.
--
--  흐름(leave_requests 패턴 미러): 직원이 연장·야간·휴일 근로분을 신청(pending)
--    → 사장에게 즉시 push → 사장이 승인/반려. RLS 로 본인/가게 범위 강제.
--
--  ⚠️ 금액은 저장하지 않는다 — 가산수당 50%(근기법 §56)는 "상시 5인 이상"
--     사업장만 의무(§11). 앱은 상시 근로자 수를 확정할 수 없으므로 시간(분)·유형만
--     기록하고, 가산 여부·금액 판단은 사장 몫으로 남긴다(Slice A 퇴직금과 동일 원칙).
--
--  ⚠️ 원격(prod) DB 적용 필요. 20260712_000002(push_infra) 이후 적용.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.allowance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  allowance_type text NOT NULL DEFAULT 'overtime'
    CHECK (allowance_type IN ('overtime','night','holiday','other')),
  minutes integer NOT NULL DEFAULT 0 CHECK (minutes >= 0),
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);

ALTER TABLE public.allowance_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.allowance_requests TO authenticated;

-- ── RLS: 직원은 신청(pending)·조회·취소만, 승인/반려는 사장만 (leave_requests 미러) ──
DROP POLICY IF EXISTS allow_member_read   ON public.allowance_requests;
DROP POLICY IF EXISTS allow_member_insert ON public.allowance_requests;
DROP POLICY IF EXISTS allow_member_cancel ON public.allowance_requests;
DROP POLICY IF EXISTS allow_owner_read    ON public.allowance_requests;
DROP POLICY IF EXISTS allow_owner_update  ON public.allowance_requests;

CREATE POLICY allow_member_read ON public.allowance_requests FOR SELECT TO authenticated
  USING (member_user_id = auth.uid());
CREATE POLICY allow_member_insert ON public.allowance_requests FOR INSERT TO authenticated
  WITH CHECK (
    member_user_id = auth.uid()
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.store_members m
      WHERE m.owner_user_id = allowance_requests.owner_user_id
        AND m.member_user_id = auth.uid()
    )
  );
CREATE POLICY allow_member_cancel ON public.allowance_requests FOR DELETE TO authenticated
  USING (member_user_id = auth.uid() AND status = 'pending');
CREATE POLICY allow_owner_read ON public.allowance_requests FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());
CREATE POLICY allow_owner_update ON public.allowance_requests FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

-- ── 신청 시 사장에게 push (notify_clock_in 패턴 미러, best-effort) ──
CREATE OR REPLACE FUNCTION public.notify_allowance_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_name text;
  v_type text;
BEGIN
  SELECT COALESCE(NULLIF(trim(concat_ws('', p.last_name, p.first_name)), ''), '직원')
  INTO v_name FROM public.user_profiles p WHERE p.user_id = NEW.member_user_id LIMIT 1;

  v_type := CASE NEW.allowance_type
    WHEN 'overtime' THEN '연장근로'
    WHEN 'night'    THEN '야간근로'
    WHEN 'holiday'  THEN '휴일근로'
    ELSE '추가근로'
  END;

  PERFORM public.push_dispatch(
    NEW.owner_user_id,
    '추가 수당 신청',
    COALESCE(v_name, '직원') || '님이 ' ||
      to_char(NEW.work_date, 'MM/DD') || ' ' || v_type || ' ' ||
      (NEW.minutes / 60) || '시간 ' || (NEW.minutes % 60) || '분 추가 수당을 신청했어요.',
    '/team'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_allowance_request ON public.allowance_requests;
CREATE TRIGGER trg_notify_allowance_request
  AFTER INSERT ON public.allowance_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_allowance_request();

-- ── realtime (사장↔직원 즉시 반영) ──
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  EXECUTE 'ALTER TABLE public.allowance_requests REPLICA IDENTITY FULL';
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'allowance_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.allowance_requests;
  END IF;
END $$;
