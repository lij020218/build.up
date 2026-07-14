-- 2026-07-15 보안 (P0) — SECURITY DEFINER 함수의 PUBLIC EXECUTE 취소
--
-- 배경: PostgREST 는 public 스키마의 함수를 anon/authenticated 역할에 /rest/v1/rpc/<fn>
--   로 노출한다. Postgres 는 새 함수를 기본적으로 PUBLIC 에 EXECUTE 부여하므로, 정의 시
--   `REVOKE ... FROM PUBLIC` 을 빠뜨린 SECURITY DEFINER 함수는 클라이언트(익명 포함)가 직접
--   호출할 수 있었다. (이 코드베이스는 초대/멤버십 RPC 에는 이미 REVOKE 를 걸어둔 반면 아래
--   3개는 누락 — 전수 보안 감사 2026-07-15 에서 확인.)
--
-- 안전성: 내부 호출자는 전부 SECURITY DEFINER 트리거(소유자=postgres) 또는 service_role 이라,
--   PUBLIC 을 취소해도 정상 동작한다.
--     · push_dispatch          ← notify_clock_in/out · notify_leave_requested/decided ·
--                                 notify_directed_invite · notify_allowance_request (모두 DEFINER, 소유자 postgres)
--     · consume_ai_daily_quota ← 서버 rate-limit.ts (service_role; 아래에서 service_role grant 유지)
--     · cleanup_ga4_oauth_nonces ← cron/서버 (service_role)
--   트리거가 함수를 실행할 때 EXECUTE 권한 검사는 트리거 소유자(postgres) 기준이므로 영향 없음.

-- ── push_dispatch: 타 사용자 알림함 위조 INSERT + 공격자 제어 OS 푸시(피싱) 차단 ──
--   (SELECT/UPDATE/DELETE 는 notifications RLS 로 recipient=auth.uid() 제한, INSERT 는 이 DEFINER 전용)
REVOKE ALL ON FUNCTION public.push_dispatch(uuid, text, text, text) FROM PUBLIC, anon, authenticated;

-- ── consume_ai_daily_quota: p_limit 조작(예: 999999)으로 AI 일일캡 우회 +
--    타 사용자 p_user_id 로 카운터 인플레(그리핑/락아웃) 차단 ──
REVOKE ALL ON FUNCTION public.consume_ai_daily_quota(uuid, text, int) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.consume_ai_daily_quota(uuid, text, int) TO service_role;  -- 서버 경로 유지(멱등)

-- ── cleanup_ga4_oauth_nonces: 만료 nonce 삭제만 하므로 영향은 경미하나 원칙 통일(위생) ──
REVOKE ALL ON FUNCTION public.cleanup_ga4_oauth_nonces() FROM PUBLIC, anon, authenticated;
