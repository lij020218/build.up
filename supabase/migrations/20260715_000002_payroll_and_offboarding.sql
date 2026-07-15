-- ─────────────────────────────────────────────────────────────────
--  급여일 알림 + 퇴사·정산 (2026-07-15)
--
--  사장님 요구:
--   1) 퇴사자는 삭제하지 않고 [퇴사] 배지로 남긴다. **정산 완료를 표시해야** 목록에서 사라진다.
--      (종전 안이던 "월급일 지나면 자동 소멸"은 폐기 — 미지급 채무가 화면에서 증발해
--       근로기준법 §36 위반을 앱이 가려버리는 문제.)
--   2) 월급일을 설정하고, 그날 사장·직원 모두에게 알림.
--   3) 사장이 "월급 보내셨습니까?" 에 '예' 를 안 누르면 월급일 다음날부터 **3일 간격** 재알림.
--   4) 직원은 "월급이 안 들어왔어요" 를 사장에게 보낼 수 있다.
--
--  법적 근거 (근로기준법):
--   · §36 금품청산 — 퇴직 시 **지급사유 발생일부터 14일 이내** 임금·퇴직금 등 일체 지급.
--     특별한 사정 시 당사자 합의로 연장 가능.
--   · §37 미지급 시 14일 다음날부터 **연 20% 지연이자**. §36 위반은 3년 이하 징역 / 3천만원 이하 벌금.
--   → 그래서 퇴사자 정산 D-day 는 '월급일' 이 아니라 **left_at + 14일** 기준.
--
--  ⚠️ 원격(prod) DB 적용 필요.
-- ─────────────────────────────────────────────────────────────────

-- ── 1. 퇴사·정산 상태 (하드 삭제 대신 상태로) ──
--   근로기록(근태·연차·수당)은 법정 보존이라 member row 를 지우면 고아가 된다 → 상태로 남긴다.
ALTER TABLE public.store_members
  ADD COLUMN IF NOT EXISTS left_at          timestamptz,   -- 퇴사일(=금품청산 기산일)
  ADD COLUMN IF NOT EXISTS settled_at       timestamptz,   -- 정산 완료 표시 → 목록에서 숨김
  ADD COLUMN IF NOT EXISTS severance_amount integer;       -- 퇴직금/최종 지급액(원). 명시 시 기록.

COMMENT ON COLUMN public.store_members.left_at IS '퇴사일. NULL=재직. 금품청산 14일(근로기준법 §36) 기산일.';
COMMENT ON COLUMN public.store_members.settled_at IS '정산 완료 표시 시각. 이 값이 있어야 사장 명부에서 숨김.';

-- ── 2. 급여일 설정 (사장 1인 1행) ──
--   cron 이 매일 읽어야 하므로 jsonb nest 가 아니라 정식 컬럼.
CREATE TABLE IF NOT EXISTS public.payroll_settings (
  owner_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  payday_day    int NOT NULL CHECK (payday_day BETWEEN 1 AND 31),  -- 31=말일 의도. 실제 발화일은
                                                                    -- cron 이 LEAST(payday_day, 그달말일) 로 보정.
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payroll_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payroll_settings' AND policyname='payroll_settings_owner') THEN
    CREATE POLICY payroll_settings_owner ON public.payroll_settings FOR ALL TO authenticated
      USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
  END IF;
END $$;

-- 직원도 자기 가게 급여일을 알아야 함 → get_staff_store_context RPC 로만 노출(직접 SELECT 불가).

-- ── 3. 급여 지급 확인 ("월급 보내셨습니까?" 응답) ──
--   period='YYYY-MM'. paid=true 면 그 달 재알림 중단.
CREATE TABLE IF NOT EXISTS public.payroll_confirmations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period        text NOT NULL CHECK (period ~ '^\d{4}-\d{2}$'),
  paid          boolean NOT NULL,     -- true=보냈다(재알림 중단) / false=아직(재알림 계속)
  confirmed_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, period)
  -- 재알림 주기는 상태 없이 날짜 산술로 결정(월급일+1, +4, +7…) — cron 이 하루 1회라 별도
  -- last_nagged_at 컬럼이 필요 없다. 무응답은 '행 없음' 으로 자연 표현된다.
);
ALTER TABLE public.payroll_confirmations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payroll_confirmations' AND policyname='payroll_conf_owner') THEN
    CREATE POLICY payroll_conf_owner ON public.payroll_confirmations FOR ALL TO authenticated
      USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
  END IF;
END $$;

-- ── 4. 직원의 미지급 문의 ──
--   같은 달 1회만(스팸 방지 = UNIQUE). 사장은 읽기만(분쟁 증거라 수정·삭제 불가).
CREATE TABLE IF NOT EXISTS public.payroll_inquiries (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period         text NOT NULL CHECK (period ~ '^\d{4}-\d{2}$'),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, member_user_id, period)
);
ALTER TABLE public.payroll_inquiries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payroll_inquiries' AND policyname='payroll_inq_owner_read') THEN
    CREATE POLICY payroll_inq_owner_read ON public.payroll_inquiries FOR SELECT TO authenticated
      USING (owner_user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payroll_inquiries' AND policyname='payroll_inq_member_read') THEN
    CREATE POLICY payroll_inq_member_read ON public.payroll_inquiries FOR SELECT TO authenticated
      USING (member_user_id = auth.uid());
  END IF;
  -- INSERT 는 report_payroll_unpaid() DEFINER 전용 (직접 INSERT 정책 없음 = 위조 방지).
END $$;

CREATE INDEX IF NOT EXISTS idx_payroll_inq_owner ON public.payroll_inquiries(owner_user_id, period);

-- ── 5. 사장 명부 RPC — superset 재정의 (+ left_at·settled_at·severance_amount) ──
--   ⚠️ 기존 필드를 하나라도 빠뜨리면 클라이언트가 붕괴한다(2026-07-13 hire_date 사고).
--   정산 완료(settled_at IS NOT NULL)는 명부에서 제외 → "정산하면 사라진다".
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
      'job_duties', COALESCE(m.job_duties, '[]'::jsonb),
      'left_at', m.left_at,
      'severance_amount', m.severance_amount,
      -- 금품청산 기한(퇴사일+14일). 재직자는 null.
      'settle_due_at', CASE WHEN m.left_at IS NULL THEN NULL ELSE (m.left_at + interval '14 days') END
    ) ORDER BY (m.left_at IS NOT NULL), m.joined_at   -- 재직자 먼저, 그 다음 퇴사·미정산
  ), '[]'::jsonb)
  INTO v_result
  FROM public.store_members m
  LEFT JOIN public.user_profiles p ON p.user_id = m.member_user_id
  WHERE m.owner_user_id = v_uid
    AND m.settled_at IS NULL;   -- 정산 완료 = 명부에서 숨김(행은 보존 — 근로기록 유지)

  RETURN v_result;
END;
$$;

-- ── 6. 직원 컨텍스트 RPC — superset 재정의 (+ payday_day·left_at) ──
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
  SELECT payday_day INTO v_payday FROM public.payroll_settings WHERE owner_user_id = v_owner;

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
    'store_name', COALESCE(NULLIF(trim(v_store_name), ''), '가게')
  );
END;
$$;

-- ── 7. 직원 → 사장 "월급이 안 들어왔어요" ──
--   push_dispatch 는 PUBLIC 실행이 취소돼 있어(20260715_000001) DEFINER 경유만 가능.
CREATE OR REPLACE FUNCTION public.report_payroll_unpaid(p_period text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_name text;
  v_inserted boolean := false;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthorized'); END IF;
  IF p_period !~ '^\d{4}-\d{2}$' THEN RETURN jsonb_build_object('ok', false, 'error', 'bad_period'); END IF;

  SELECT owner_user_id INTO v_owner
  FROM public.store_members
  WHERE member_user_id = v_uid AND settled_at IS NULL
  ORDER BY joined_at DESC LIMIT 1;
  IF v_owner IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_member'); END IF;

  INSERT INTO public.payroll_inquiries(owner_user_id, member_user_id, period)
  VALUES (v_owner, v_uid, p_period)
  ON CONFLICT (owner_user_id, member_user_id, period) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF NOT v_inserted THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true);  -- 같은 달 재문의 = 조용히 성공(스팸 방지)
  END IF;

  SELECT COALESCE(NULLIF(trim(concat_ws('', last_name, first_name)), ''), '직원')
    INTO v_name FROM public.user_profiles WHERE user_id = v_uid;

  PERFORM public.push_dispatch(
    v_owner,
    '급여 미지급 문의',
    COALESCE(v_name, '직원') || ' 님이 ' || p_period || ' 급여가 입금되지 않았다고 알려왔습니다.',
    '/team'
  );
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ── push_dispatch 를 서버(cron)가 부를 수 있게 ──
--   20260715_000001 에서 push_dispatch 를 PUBLIC 에서 취소했는데, service_role 도 PUBLIC 의
--   일원이라 함께 실행권을 잃었다. 기존 호출자는 전부 DEFINER 트리거(소유자 postgres)라
--   무사했지만, /api/cron/payroll-check 는 service_role 로 직접 호출하므로 명시 부여가 필요하다.
--   (service_role 키는 서버 전용 — 클라이언트에 노출되지 않으므로 공개 실행과 무관.)
GRANT EXECUTE ON FUNCTION public.push_dispatch(uuid, text, text, text) TO service_role;

-- ── 권한 (새 DEFINER 함수는 PUBLIC 취소 필수 — security-definer-revoke 가드 규칙) ──
REVOKE ALL ON FUNCTION public.get_store_members() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_members() TO authenticated;
REVOKE ALL ON FUNCTION public.get_staff_store_context() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_staff_store_context() TO authenticated;
REVOKE ALL ON FUNCTION public.report_payroll_unpaid(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.report_payroll_unpaid(text) TO authenticated;
