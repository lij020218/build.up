-- 20260609_000001_subscription_renewal.sql
-- 정기결제(자동갱신) 지원 — dunning(재시도) 카운터 추가.
--   갱신 실패 시 past_due 로 두고 매일 재시도, 누적 실패가 임계에 도달하면 canceled→free.
-- 멱등: IF NOT EXISTS.

ALTER TABLE IF EXISTS foundone_subscriptions
  ADD COLUMN IF NOT EXISTS renewal_failure_count integer NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS foundone_subscriptions
  ADD COLUMN IF NOT EXISTS last_renewal_attempt_at timestamptz;

COMMENT ON COLUMN foundone_subscriptions.renewal_failure_count
  IS '연속 갱신 실패 횟수 — 임계(3) 도달 시 구독 해지. 성공 시 0 으로 리셋.';
COMMENT ON COLUMN foundone_subscriptions.last_renewal_attempt_at
  IS '마지막 갱신 시도 시각 — 같은 날 중복 청구 방지(멱등 보조).';

-- 갱신 대상 조회 가속 — 만료 임박/지난 활성·연체 구독.
CREATE INDEX IF NOT EXISTS idx_foundone_subscriptions_renewal
  ON foundone_subscriptions (current_period_end)
  WHERE plan = 'premium' AND status IN ('active', 'past_due');
