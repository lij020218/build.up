-- ─────────────────────────────────────────────────────────────────
-- 푸시 알림 기반 + 이벤트 트리거 (Phase A+B, 2026-07-12)
--
-- 구조:
--   ① user_push_tokens — 기기 토큰 저장 (iOS APNs device token / 웹 push subscription JSON)
--   ② app_config       — 트리거가 읽는 발송 endpoint·secret (service 전용)
--   ③ pg_net 트리거 3종 — 이벤트 발생 시 웹 dispatch 라우트로 POST:
--        · store_invites INSERT(지정 초대)      → 초대받은 직원에게 "채용 초대장"
--        · leave_requests INSERT               → 사장에게 "연차 신청"
--        · leave_requests UPDATE(승인/반려)     → 직원에게 결과
--      제목·본문·수신자는 SQL(SECURITY DEFINER)에서 완성해 전달 —
--      dispatch 라우트는 토큰 조회+발송만 담당 (service role 테이블 GRANT 이슈 회피).
--
-- ⚠️ 적용 후 사장님 액션:
--   1) SELECT value FROM public.app_config WHERE key='push_webhook_secret';
--      → 값을 Vercel env `PUSH_WEBHOOK_SECRET` 에 등록 (dispatch 라우트 인증)
--   2) prod 도메인이 다르면: UPDATE public.app_config SET value='https://<도메인>/api/push/dispatch'
--      WHERE key='push_dispatch_url';
-- ─────────────────────────────────────────────────────────────────

-- 0) pg_net (Supabase 기본 제공 — 비동기 HTTP)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1) 기기 토큰
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('ios', 'web')),
  -- iOS: APNs device token(hex) / web: PushSubscription JSON 문자열
  token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, token)
);

ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;
-- 이 DB는 default privilege 부재 이력 — GRANT 명시 (LAUNCH_CHECKLIST §1)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_push_tokens TO authenticated;
GRANT SELECT, DELETE ON public.user_push_tokens TO service_role;

DROP POLICY IF EXISTS push_tokens_own ON public.user_push_tokens;
CREATE POLICY push_tokens_own ON public.user_push_tokens
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user ON public.user_push_tokens (user_id);

-- 2) 발송 설정 (트리거 전용 — 클라이언트 접근 차단)
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL
);
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.app_config TO service_role;
-- 정책 없음 = authenticated/anon 접근 불가. SECURITY DEFINER 함수만 읽음.

INSERT INTO public.app_config (key, value)
VALUES ('push_dispatch_url', 'https://foundone.dev/api/push/dispatch')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.app_config (key, value)
VALUES ('push_webhook_secret', encode(gen_random_bytes(24), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- 3) 공용 발송 헬퍼 — 수신자·제목·본문을 dispatch 라우트로 POST (비동기, 실패해도 원 트랜잭션 무영향)
CREATE OR REPLACE FUNCTION public.push_dispatch(p_recipient uuid, p_title text, p_body text, p_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_endpoint text;
  v_secret text;
BEGIN
  SELECT value INTO v_endpoint FROM public.app_config WHERE key = 'push_dispatch_url';
  SELECT value INTO v_secret FROM public.app_config WHERE key = 'push_webhook_secret';
  IF v_endpoint IS NULL OR v_secret IS NULL OR p_recipient IS NULL THEN RETURN; END IF;

  PERFORM net.http_post(
    url := v_endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', v_secret
    ),
    body := jsonb_build_object(
      'recipient_user_id', p_recipient,
      'title', p_title,
      'body', p_body,
      'url', COALESCE(p_url, '/current')
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- 푸시는 best-effort — 발송 실패가 초대/연차 트랜잭션을 깨면 안 됨
  NULL;
END;
$$;

-- 4-1) 지정 초대 → 초대받은 직원에게 "채용 초대장"
CREATE OR REPLACE FUNCTION public.notify_directed_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_recipient uuid;
  v_store text;
BEGIN
  IF NEW.invited_email IS NULL THEN RETURN NEW; END IF;

  SELECT id INTO v_recipient FROM auth.users WHERE lower(email) = lower(NEW.invited_email) LIMIT 1;
  IF v_recipient IS NULL THEN RETURN NEW; END IF;  -- 미가입 이메일 — 가입 후 「받은 초대」로 노출

  SELECT COALESCE(NULLIF(trim(store_name), ''), '가게') INTO v_store
  FROM public.user_store_data WHERE user_id = NEW.owner_user_id LIMIT 1;

  PERFORM public.push_dispatch(
    v_recipient,
    '채용 초대장',
    '「' || COALESCE(v_store, '가게') || '」 업장에 ' ||
      CASE WHEN NEW.role = 'manager' THEN '매니저' ELSE '직원' END ||
      '으로 채용되셨습니다. 본인이 맞다면 수락해 주세요.',
    '/current'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_directed_invite ON public.store_invites;
CREATE TRIGGER trg_notify_directed_invite
  AFTER INSERT ON public.store_invites
  FOR EACH ROW EXECUTE FUNCTION public.notify_directed_invite();

-- 4-2) 연차 신청 → 사장에게
CREATE OR REPLACE FUNCTION public.notify_leave_requested()
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

  v_type := CASE NEW.leave_type
    WHEN 'annual' THEN '연차' WHEN 'half' THEN '반차' WHEN 'sick' THEN '병가' ELSE '휴가' END;

  PERFORM public.push_dispatch(
    NEW.owner_user_id,
    v_type || ' 신청',
    COALESCE(v_name, '직원') || '님이 ' || v_type || '를 신청했어요 (' ||
      NEW.start_date || CASE WHEN NEW.end_date <> NEW.start_date THEN ' ~ ' || NEW.end_date ELSE '' END ||
      '). 직원 페이지에서 승인/반려해 주세요.',
    '/team'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_leave_requested ON public.leave_requests;
CREATE TRIGGER trg_notify_leave_requested
  AFTER INSERT ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_leave_requested();

-- 4-3) 연차 승인/반려 → 직원에게
CREATE OR REPLACE FUNCTION public.notify_leave_decided()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_type text;
BEGIN
  IF OLD.status <> 'pending' OR NEW.status NOT IN ('approved', 'rejected') THEN RETURN NEW; END IF;

  v_type := CASE NEW.leave_type
    WHEN 'annual' THEN '연차' WHEN 'half' THEN '반차' WHEN 'sick' THEN '병가' ELSE '휴가' END;

  PERFORM public.push_dispatch(
    NEW.member_user_id,
    v_type || CASE WHEN NEW.status = 'approved' THEN ' 승인' ELSE ' 반려' END,
    NEW.start_date || CASE WHEN NEW.end_date <> NEW.start_date THEN ' ~ ' || NEW.end_date ELSE '' END ||
      ' ' || v_type || ' 신청이 ' ||
      CASE WHEN NEW.status = 'approved' THEN '승인됐어요.' ELSE '반려됐어요. 사장님께 문의해 보세요.' END,
    '/current'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_leave_decided ON public.leave_requests;
CREATE TRIGGER trg_notify_leave_decided
  AFTER UPDATE OF status ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_leave_decided();
