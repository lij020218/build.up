-- ─────────────────────────────────────────────────────────────────
-- 인앱 알림함 (2026-07-14)
--
--   지금까지 알림 시스템은 push-only(OS 푸시)였고 영구 인앱 기록이 없었다.
--   이 마이그레이션은 범용 in-app 알림함을 신설하고, 기존 push_dispatch()
--   헬퍼가 푸시와 "동시에" 인앱 알림 행도 남기게 한다 → 초대·연차·추가수당·
--   출근/퇴근 등 push_dispatch 를 쓰는 *모든* 이벤트가 자동으로 인앱에도 뜬다.
--   (트리거 6종은 손대지 않음 — 헬퍼 한 곳만 확장.)
--
--   설계 원칙:
--     · 인앱 INSERT 와 OS 푸시는 각각 독립 best-effort — 둘 중 하나가 실패해도
--       나머지·원 트랜잭션(출근 등)을 절대 깨지 않는다.
--     · push_dispatch 는 SECURITY DEFINER(소유자=postgres) 라 RLS 우회 INSERT.
--       클라이언트에는 INSERT 권한을 주지 않는다(수신자 위조 차단).
--
-- ⚠️ 원격(prod) DB 적용 필요. 20260712_000002_push_infra 이후 적용할 것.
--    적용 후 Supabase 대시보드 → Database → Replication 에서 notifications
--    Realtime 토글 ON.
-- ─────────────────────────────────────────────────────────────────

-- 1) 인앱 알림함 테이블
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 이 DB 는 default privilege 부재 이력 — GRANT 명시 (LAUNCH_CHECKLIST §1, push_infra 와 동일).
--   클라이언트는 읽기·읽음처리(UPDATE)·삭제만. INSERT 는 SECURITY DEFINER 헬퍼 전용.
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;

DROP POLICY IF EXISTS notifications_own ON public.notifications;
CREATE POLICY notifications_own ON public.notifications
  FOR SELECT USING (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS notifications_own_update ON public.notifications;
CREATE POLICY notifications_own_update ON public.notifications
  FOR UPDATE USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS notifications_own_delete ON public.notifications;
CREATE POLICY notifications_own_delete ON public.notifications
  FOR DELETE USING (recipient_user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON public.notifications (recipient_user_id, created_at DESC);

-- 2) push_dispatch 확장 — 동일 4-arg 시그니처 유지, 인앱 INSERT + OS 푸시 (각각 독립 best-effort)
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
  IF p_recipient IS NULL THEN RETURN; END IF;

  -- ① 인앱 알림 영구 기록 (best-effort, 독립 — 실패해도 푸시·원 트랜잭션 무영향)
  BEGIN
    INSERT INTO public.notifications (recipient_user_id, title, body, url)
    VALUES (p_recipient, p_title, p_body, COALESCE(p_url, '/current'));
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- ② OS 푸시 (best-effort, 독립 — 실패해도 인앱 알림·원 트랜잭션 무영향)
  BEGIN
    SELECT value INTO v_endpoint FROM public.app_config WHERE key = 'push_dispatch_url';
    SELECT value INTO v_secret FROM public.app_config WHERE key = 'push_webhook_secret';
    IF v_endpoint IS NULL OR v_secret IS NULL THEN RETURN; END IF;

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
    NULL;
  END;
END;
$$;

-- 3) 실시간 — 사장/직원이 앱 열어둔 채로도 새 알림 즉시 수신
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  EXECUTE 'ALTER TABLE public.notifications REPLICA IDENTITY FULL';

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
