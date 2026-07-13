  -- ─────────────────────────────────────────────────────────────────
  -- 지정 초대 (directed invite) — 사장이 직원 "아이디(이메일)"로 초대 (2026-07-12)
  --
  -- 배경: 종전 초대는 링크/코드 전달뿐이라, 사장이 직원의 가입 이메일을 아는
  --   경우(이미 Found.One 회원인 직원 포함)에도 링크를 따로 보내야 했다.
  --   이제 사장이 이메일을 지정해 초대를 만들면, 그 직원이 로그인했을 때
  --   「받은 초대」로 표시되고 앱 안에서 바로 수락할 수 있다.
  --
  -- 설계 원칙:
  --   1) 이메일 존재 여부 비노출 — 초대 생성 시 해당 이메일의 가입 여부를
  --      조회·표시하지 않는다(계정 열거 방지). 미가입 이메일이어도 초대는
  --      유효하며, 나중에 그 이메일로 가입하면 「받은 초대」에 나타난다.
  --   2) 동의 기반 — 사장이 이메일을 안다고 직원이 자동 연결되지 않는다.
  --      직원 본인이 로그인 상태에서 수락해야 store_members 에 등록된다.
  --   3) 지정 초대는 지정된 이메일 계정만 수락 가능 — 코드가 유출돼도
  --      다른 계정이 가로챌 수 없다 (accept_store_invite 에 검증 추가).
  --      비지정(링크/코드) 초대는 종전대로 코드를 아는 로그인 사용자 누구나.
  --
  -- ⚠️ 이 마이그레이션은 원격(prod) DB 에 적용되어야 효과가 있습니다.
  -- ─────────────────────────────────────────────────────────────────

  -- 1) invited_email 컬럼 — NULL 이면 종전과 동일한 비지정(링크/코드) 초대
  ALTER TABLE public.store_invites
    ADD COLUMN IF NOT EXISTS invited_email text;

  -- 미사용 지정 초대의 이메일 조회용 (my_pending_invites)
  CREATE INDEX IF NOT EXISTS idx_store_invites_invited_email_pending
    ON public.store_invites (lower(invited_email))
    WHERE invited_email IS NOT NULL AND used_by IS NULL;

  -- 2) my_pending_invites — 현재 로그인 사용자의 이메일로 온 미수락 초대 목록
  --    이메일은 클라이언트 입력이 아니라 auth.users 에서 서버가 직접 읽는다(위조 불가).
  CREATE OR REPLACE FUNCTION public.my_pending_invites()
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
  DECLARE
    v_uid uuid := auth.uid();
    v_email text;
    v_result jsonb;
  BEGIN
    IF v_uid IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'not-authenticated');
    END IF;

    SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_uid;
    IF v_email IS NULL THEN
      RETURN jsonb_build_object('ok', true, 'invites', '[]'::jsonb);
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'invite_code', i.invite_code,
        'role', i.role,
        'store_name', COALESCE(NULLIF(trim(s.store_name), ''), '가게'),
        'created_at', i.created_at,
        'expires_at', i.expires_at
      ) ORDER BY i.created_at DESC), '[]'::jsonb)
    INTO v_result
    FROM public.store_invites i
    LEFT JOIN public.user_store_data s ON s.user_id = i.owner_user_id
    WHERE lower(i.invited_email) = v_email
      AND i.used_by IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND i.owner_user_id <> v_uid;

    RETURN jsonb_build_object('ok', true, 'invites', v_result);
  END;
  $$;

  REVOKE ALL ON FUNCTION public.my_pending_invites() FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.my_pending_invites() TO authenticated;

  -- 3) accept_store_invite 갱신 — 지정 초대는 지정 이메일 계정만 수락 가능.
  --    (그 외 로직은 20260708_000001 원본과 동일한 superset.)
  CREATE OR REPLACE FUNCTION public.accept_store_invite(p_code text)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
  DECLARE
    v_invite public.store_invites%ROWTYPE;
    v_uid uuid := auth.uid();
    v_email text;
  BEGIN
    IF v_uid IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'not-authenticated');
    END IF;

    SELECT * INTO v_invite
    FROM public.store_invites
    WHERE invite_code = upper(trim(p_code))
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'not-found');
    END IF;

    IF v_invite.used_by IS NOT NULL THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'used');
    END IF;

    IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'expired');
    END IF;

    IF v_uid = v_invite.owner_user_id THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'self');
    END IF;

    -- 지정 초대 검증 — 지정된 이메일의 계정만 수락 가능
    IF v_invite.invited_email IS NOT NULL THEN
      SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_uid;
      IF v_email IS NULL OR v_email <> lower(v_invite.invited_email) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'wrong-account');
      END IF;
    END IF;

    INSERT INTO public.store_members (owner_user_id, member_user_id, role)
    VALUES (v_invite.owner_user_id, v_uid, v_invite.role)
    ON CONFLICT (owner_user_id, member_user_id)
    DO UPDATE SET role = EXCLUDED.role;

    UPDATE public.store_invites
    SET used_by = v_uid, used_at = now()
    WHERE id = v_invite.id;

    INSERT INTO public.business_profiles (user_id, user_role)
    VALUES (v_uid, v_invite.role)
    ON CONFLICT (user_id) DO UPDATE SET user_role = EXCLUDED.user_role;

    RETURN jsonb_build_object('ok', true, 'reason', 'accepted');
  END;
  $$;
