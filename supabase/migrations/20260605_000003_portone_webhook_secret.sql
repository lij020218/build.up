-- ════════════════════════════════════════════════════════════════════════
--  PortOne 웹훅 시크릿 사장님별 분리 (2026-06-05 보안 감사 P2)
--
--  배경: 종전 webhook 검증이 글로벌 env PORTONE_WEBHOOK_SECRET 하나를 전 사장님 공유.
--    이 시크릿이 유출되면 uid(=user_id)만 알면 다른 사장님으로 위조 결제 이벤트 주입 가능.
--    → 사장님별 PortOne 웹훅 시크릿을 봉투 암호화해 저장, webhook 검증 시 그 값 우선 사용.
--
--  조치: portone_connections 에 webhook_secret_enc jsonb 추가(EnvelopedSecret 보관).
--    없으면 글로벌 env 로 fallback(기존 연결 하위호환). connect 라우트에서 선택 입력.
--
--  멱등: 재실행 안전.
-- ════════════════════════════════════════════════════════════════════════

alter table public.portone_connections
  add column if not exists webhook_secret_enc jsonb;

comment on column public.portone_connections.webhook_secret_enc is
  '봉투암호화된 사장님별 PortOne 웹훅 시크릿(envelope-crypto EnvelopedSecret). 없으면 글로벌 PORTONE_WEBHOOK_SECRET fallback. 서버에서만 복호화.';
