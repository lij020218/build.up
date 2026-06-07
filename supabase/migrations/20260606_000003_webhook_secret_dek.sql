-- 20260606_000003_webhook_secret_dek.sql
-- 🚨 P0 수정: stripe_connections / toss_connections 의 webhook secret 복호화가 항상 실패하던 버그.
--
-- 배경: connect 라우트가 webhookSecret 을 envelopeEncrypt 로 암호화하면 apiSecret 과는
--   다른 새 DEK 가 매번 생성된다(randomBytes). 그러나 그 webhook DEK 를 DB 에 저장하지 않고,
--   webhook 핸들러는 apiSecret 용 DEK(encrypted_dek)로 webhook secret 을 복호화하려 했다.
--   → AES-256-GCM auth tag 불일치 → 복호화 항상 실패 → webhook 500 → 모든 결제 이벤트 누락.
--
-- 해결: webhook secret 전용 DEK 봉투 컬럼을 추가하고, connect 가 이를 저장, 핸들러가 이를 읽도록 한다.
--   (apiSecret 경로는 무변경 → 기존 연결 호환. webhook secret 은 사장님 재연결 시 정상화.)
--
-- idempotent (IF NOT EXISTS).

ALTER TABLE public.stripe_connections
  ADD COLUMN IF NOT EXISTS webhook_secret_dek_enc text,
  ADD COLUMN IF NOT EXISTS webhook_secret_dek_iv text,
  ADD COLUMN IF NOT EXISTS webhook_secret_dek_auth_tag text;

ALTER TABLE public.toss_connections
  ADD COLUMN IF NOT EXISTS webhook_secret_dek_enc text,
  ADD COLUMN IF NOT EXISTS webhook_secret_dek_iv text,
  ADD COLUMN IF NOT EXISTS webhook_secret_dek_auth_tag text;
