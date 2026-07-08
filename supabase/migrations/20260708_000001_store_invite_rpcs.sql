-- ─────────────────────────────────────────────────────────────────
--  직원 초대 링크 기능 정상화 — 코드 기반 조회·수락 RPC
--
--  증상: 「새 초대 링크 생성」 후 직원이 링크(/invite/<code>)를 열면
--    항상 "유효하지 않은 초대 링크" 로 뜨고 연결이 안 됨.
--
--  근본 원인: store_invites RLS 가
--      USING (owner_user_id = auth.uid() OR used_by = auth.uid())
--    뿐이라, 초대를 "받는" 직원(사장 아님 · used_by 아직 NULL)은
--    - SELECT: 코드로 조회해도 RLS 가 걸러 0건 → not-found
--    - UPDATE: used_by 마킹 시도해도 old row 가 안 보여 0건 갱신
--    - store_members INSERT: "Owners can manage members" 정책상 사장만 가능
--    → 초대를 받는 쪽이 초대를 읽지도, 소비하지도 못해 기능 전체가 무용.
--
--  해결: 코드를 아는 사람만 접근하는 SECURITY DEFINER 함수 2종으로
--    조회·수락을 서버에서 원자적으로 처리. RLS 를 넓히지 않아 노출 최소.
--    (초대 생성은 사장 본인 insert 라 기존 RLS 로 정상 → 변경 없음.)
--
--  ⚠️ 이 마이그레이션은 원격(prod) DB 에 적용되어야 효과가 있습니다.
-- ─────────────────────────────────────────────────────────────────

-- 0) 테이블·GRANT 자가치유 (환경별 마이그레이션 차이 방어 — 이미 있으면 no-op)
CREATE TABLE IF NOT EXISTS public.store_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'manager')),
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'manager')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_user_id, member_user_id)
);

ALTER TABLE public.store_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.store_invites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.store_members TO authenticated;

-- 사장 본인 초대 관리 정책 (없을 때만 생성)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'store_invites'
      AND policyname = 'Users can manage own invites'
  ) THEN
    CREATE POLICY "Users can manage own invites" ON public.store_invites
      FOR ALL USING (owner_user_id = auth.uid() OR used_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'store_members'
      AND policyname = 'Members can view own memberships'
  ) THEN
    CREATE POLICY "Members can view own memberships" ON public.store_members
      FOR SELECT USING (owner_user_id = auth.uid() OR member_user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'store_members'
      AND policyname = 'Owners can manage members'
  ) THEN
    CREATE POLICY "Owners can manage members" ON public.store_members
      FOR ALL USING (owner_user_id = auth.uid());
  END IF;
END $$;

-- 1) lookup_store_invite — 코드로 초대 유효성·가게명 조회 (받는 사람이 로그인 전에도 확인)
--    SECURITY DEFINER 로 RLS 우회하되, 함수가 반환 필드를 통제하고
--    반드시 정확한 8자리 코드(.eq)를 알아야만 조회되므로 노출 최소.
CREATE OR REPLACE FUNCTION public.lookup_store_invite(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invite public.store_invites%ROWTYPE;
  v_store_name text;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not-found');
  END IF;

  SELECT * INTO v_invite
  FROM public.store_invites
  WHERE invite_code = upper(trim(p_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not-found');
  END IF;

  IF v_invite.used_by IS NOT NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'used');
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;

  -- 사장 본인이 자기 초대를 여는 경우 방어
  IF auth.uid() IS NOT NULL AND auth.uid() = v_invite.owner_user_id THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'self');
  END IF;

  SELECT store_name INTO v_store_name
  FROM public.user_store_data
  WHERE user_id = v_invite.owner_user_id
  LIMIT 1;

  RETURN jsonb_build_object(
    'valid', true,
    'role', v_invite.role,
    'store_name', COALESCE(NULLIF(trim(v_store_name), ''), '가게')
  );
END;
$$;

-- 2) accept_store_invite — 현재 로그인 사용자가 초대를 원자적으로 소비
--    store_members 등록 + 초대 used 마킹 + business_profiles.user_role 갱신을 한 번에.
CREATE OR REPLACE FUNCTION public.accept_store_invite(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invite public.store_invites%ROWTYPE;
  v_uid uuid := auth.uid();
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

  INSERT INTO public.store_members (owner_user_id, member_user_id, role)
  VALUES (v_invite.owner_user_id, v_uid, v_invite.role)
  ON CONFLICT (owner_user_id, member_user_id)
  DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.store_invites
  SET used_by = v_uid, used_at = now()
  WHERE id = v_invite.id;

  -- 신규 가입 직원은 business_profiles 행이 아직 없을 수 있음(가입 트리거는 user_profiles 만 생성).
  --   UPDATE 만 하면 0행 no-op 라 user_role 이 안 박힘 → upsert 로 반드시 staff 로 설정.
  INSERT INTO public.business_profiles (user_id, user_role)
  VALUES (v_uid, v_invite.role)
  ON CONFLICT (user_id) DO UPDATE SET user_role = EXCLUDED.user_role;

  RETURN jsonb_build_object('ok', true, 'reason', 'accepted');
END;
$$;

-- 3) EXECUTE 권한 — 조회는 로그인 전(anon)에도, 수락은 로그인 사용자만
REVOKE ALL ON FUNCTION public.lookup_store_invite(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_store_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_store_invite(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_store_invite(text) TO authenticated;
