-- ─────────────────────────────────────────────────────────────────
--  accept_store_invite — 이미 채용된 직원 안내 (2026-07-13)
--
--  사용자 지침: "이미 본인 가게에 채용된 직원이 초대장을 누르면 '이미 채용된
--    직원입니다'가 뜨게" — 종전엔 ON CONFLICT DO UPDATE 로 조용히 재수락돼
--    피드백이 없었다. 이제 이미 그 가게 소속이면 재수락 대신 사유를 돌려준다.
--
--  나머지 로직은 20260712_000001 과 동일(superset) — not-found/used/expired/self/
--  wrong-account 검증 그대로. already-member 는 wrong-account 뒤, INSERT 앞에 추가.
--  이미 멤버면 초대는 소비(used) 처리해 다시 안 뜨게 한다.
--
--  ⚠️ 원격(prod) DB 에 적용해야 효과.
-- ─────────────────────────────────────────────────────────────────

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

  -- 이미 이 가게 소속이면 재수락 대신 안내 (초대는 소비 처리해 다시 안 뜨게).
  IF EXISTS (
    SELECT 1 FROM public.store_members
    WHERE owner_user_id = v_invite.owner_user_id
      AND member_user_id = v_uid
  ) THEN
    UPDATE public.store_invites
    SET used_by = v_uid, used_at = now()
    WHERE id = v_invite.id;
    RETURN jsonb_build_object('ok', false, 'reason', 'already-member');
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
