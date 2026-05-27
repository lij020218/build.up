-- build.up 서비스 구독 테이블
-- 사장님이 build.up 프리미엄 플랜을 구독하는 상태를 관리

CREATE TABLE buildup_subscriptions (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  plan                  text        NOT NULL DEFAULT 'free'
                          CHECK (plan IN ('free', 'premium')),
  status                text        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'canceled', 'past_due')),
  -- PortOne 빌링키 (정기결제용). 서비스롤에서만 접근.
  billing_key           text,
  -- 결제 수단 표시용 (마스킹)
  billing_method_label  text,       -- 예: "신한카드 ****1234"
  -- 현재 구독 기간
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  -- 기간 만료 시 자동 갱신 여부 (false = 갱신 안 함 = 취소 예정)
  cancel_at_period_end  boolean     NOT NULL DEFAULT false,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- 유저당 구독 레코드 1개 보장
CREATE UNIQUE INDEX ON buildup_subscriptions (user_id);

ALTER TABLE buildup_subscriptions ENABLE ROW LEVEL SECURITY;

-- 본인 구독 정보 읽기 (billing_key 컬럼 제외)
CREATE POLICY "사용자는 자신의 구독 정보를 읽을 수 있음"
  ON buildup_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE는 service_role만 (API 라우트에서 처리)
CREATE POLICY "서비스롤 전체 접근"
  ON buildup_subscriptions FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- build.up 결제 이력
CREATE TABLE buildup_payments (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  portone_payment_id  text        UNIQUE NOT NULL,
  amount              integer     NOT NULL CHECK (amount > 0),
  currency            text        NOT NULL DEFAULT 'KRW',
  status              text        NOT NULL,   -- PAID | CANCELLED | FAILED
  plan                text        NOT NULL DEFAULT 'premium',
  paid_at             timestamptz,
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE buildup_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 결제 이력을 읽을 수 있음"
  ON buildup_payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "서비스롤 전체 접근"
  ON buildup_payments FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_buildup_subscriptions_updated_at
  BEFORE UPDATE ON buildup_subscriptions
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();
