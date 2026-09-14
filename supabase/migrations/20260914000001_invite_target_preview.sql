-- ─────────────────────────────────────────────────────────────────
--  초대 대상 미리보기 (preview_invite_target) — 2026-09-14
--
--  배경: 지정 초대(2026-07-12)는 이메일만 받고 **아무것도 보여주지 않았다**.
--    계정 열거(account enumeration) 방지가 이유였다. 그런데 사장 입장에선
--    오타 하나로 엉뚱한 사람에게 채용 초대장이 가고, 직원은 오지 않는데
--    사장은 "보냈다"고 믿는다 — 실제로 초대가 왜 안 갔는지 알 방법이 없었다.
--
--  절충: 존재 여부와 **가린 이름**만 돌려준다.
--    · 이름은 "김*수" 로 가린다 — 오타 확인에는 충분하고, 명단 수집에는 모자라다.
--    · 이메일도 "ab***@gmail.com" 으로 가려 되돌려준다(입력 확인용).
--    · 존재 여부 자체는 노출된다. 이를 감수하는 대신 **시간당 상한**을 두고
--      조회를 남긴다(아래 invite_lookup_log). 상한을 넘기면 결과를 주지 않는다.
--    · 가게가 있는 사장만 호출할 수 있다(직원 계정은 조회 불가).
--
--  ⚠️ 여전히 하지 않는 것: 전체 이름·이메일 원문·프로필 사진·가입일 노출.
--     직원의 실명은 **본인이 초대를 수락한 뒤에만** 사장에게 보인다(종전과 동일).
--
--  ⚠️ 이 마이그레이션은 원격(prod) DB 에 적용되어야 효과가 있습니다.
-- ─────────────────────────────────────────────────────────────────

-- 1) 조회 기록 — 속도 제한 + 사후 추적용. 개인정보 최소화를 위해 이메일 원문은 남기지 않는다.
CREATE TABLE IF NOT EXISTS public.invite_lookup_log (
  id             bigserial PRIMARY KEY,
  owner_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 어떤 이메일을 조회했는지는 해시로만 남긴다(같은 대상 반복 조회 판별용).
  email_hash     text NOT NULL,
  found          boolean NOT NULL,
  looked_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invite_lookup_log_owner_time
  ON public.invite_lookup_log (owner_user_id, looked_at DESC);

ALTER TABLE public.invite_lookup_log ENABLE ROW LEVEL SECURITY;

-- 본인 조회 기록만 읽을 수 있다. 쓰기는 아래 SECURITY DEFINER 함수만.
DROP POLICY IF EXISTS invite_lookup_log_own ON public.invite_lookup_log;
CREATE POLICY invite_lookup_log_own ON public.invite_lookup_log FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

GRANT SELECT ON public.invite_lookup_log TO authenticated;

-- 2) 이름 가리기 — "김수현" → "김*현", "김수" → "김*", "A" → "*"
CREATE OR REPLACE FUNCTION public.mask_person_name(p_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v text := trim(COALESCE(p_name, ''));
  v_len int;
BEGIN
  IF v = '' THEN RETURN ''; END IF;
  v_len := char_length(v);
  IF v_len = 1 THEN RETURN '*'; END IF;
  IF v_len = 2 THEN RETURN left(v, 1) || '*'; END IF;
  RETURN left(v, 1) || repeat('*', v_len - 2) || right(v, 1);
END;
$$;

-- 3) 이메일 가리기 — "abcdef@gmail.com" → "ab***@gmail.com"
CREATE OR REPLACE FUNCTION public.mask_email(p_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v text := lower(trim(COALESCE(p_email, '')));
  v_local text;
  v_domain text;
BEGIN
  IF position('@' in v) = 0 THEN RETURN ''; END IF;
  v_local  := split_part(v, '@', 1);
  v_domain := split_part(v, '@', 2);
  IF char_length(v_local) <= 2 THEN
    RETURN left(v_local, 1) || '***@' || v_domain;
  END IF;
  RETURN left(v_local, 2) || '***@' || v_domain;
END;
$$;

-- 4) 초대 대상 미리보기
CREATE OR REPLACE FUNCTION public.preview_invite_target(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_email      text := lower(trim(COALESCE(p_email, '')));
  v_hash       text;
  v_recent     int;
  v_has_store  boolean;
  v_target     uuid;
  v_name       text;
  v_is_member  boolean := false;
  v_pending    boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not-authenticated');
  END IF;

  -- 형식이 아니면 조회 자체를 하지 않는다(상한을 낭비시키지 않기 위해).
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid-email');
  END IF;

  -- 자기 자신은 초대 대상이 아니다.
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_uid AND lower(email) = v_email) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'self');
  END IF;

  -- 가게를 가진 사장만 — 직원 계정이 남의 가입 여부를 캐는 경로를 막는다.
  SELECT EXISTS (SELECT 1 FROM public.user_store_data WHERE user_id = v_uid) INTO v_has_store;
  IF NOT v_has_store THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not-owner');
  END IF;

  -- 시간당 상한 20회. 넘기면 결과를 주지 않는다(열거 속도 제한).
  SELECT count(*) INTO v_recent
  FROM public.invite_lookup_log
  WHERE owner_user_id = v_uid AND looked_at > now() - interval '1 hour';

  IF v_recent >= 20 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'rate-limited');
  END IF;

  -- 내장 sha256(bytea) 사용 — pgcrypto 의 digest() 는 extensions 스키마라
  -- 이 함수의 search_path(public, pg_temp)에서 보이지 않는다.
  v_hash := encode(sha256(convert_to(v_email, 'UTF8')), 'hex');

  SELECT id INTO v_target FROM auth.users WHERE lower(email) = v_email LIMIT 1;

  INSERT INTO public.invite_lookup_log (owner_user_id, email_hash, found)
  VALUES (v_uid, v_hash, v_target IS NOT NULL);

  -- 이미 내 가게 직원인지 / 보낸 초대가 아직 살아 있는지 — 둘 다 **내 가게 범위**라 열거와 무관.
  IF v_target IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.store_members
      WHERE owner_user_id = v_uid AND member_user_id = v_target AND left_at IS NULL
    ) INTO v_is_member;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.store_invites
    WHERE owner_user_id = v_uid
      AND lower(invited_email) = v_email
      AND used_by IS NULL
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_pending;

  IF v_target IS NULL THEN
    -- 미가입 이메일이어도 초대는 유효하다(나중에 그 이메일로 가입하면 「받은 초대」에 뜬다).
    RETURN jsonb_build_object(
      'ok', true,
      'exists', false,
      'masked_email', public.mask_email(v_email),
      'already_member', false,
      'pending_invite', v_pending
    );
  END IF;

  SELECT COALESCE(NULLIF(trim(concat_ws('', p.last_name, p.first_name)), ''), '')
  INTO v_name
  FROM public.user_profiles p
  WHERE p.user_id = v_target;

  RETURN jsonb_build_object(
    'ok', true,
    'exists', true,
    'masked_name', public.mask_person_name(v_name),
    'masked_email', public.mask_email(v_email),
    'already_member', v_is_member,
    'pending_invite', v_pending
  );
END;
$$;

REVOKE ALL ON FUNCTION public.preview_invite_target(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_invite_target(text) TO authenticated;

COMMENT ON FUNCTION public.preview_invite_target(text) IS
  '초대 대상 확인 — 존재 여부 + 가린 이름만. 사장 전용, 시간당 20회 상한, 조회는 invite_lookup_log 에 남는다.';
