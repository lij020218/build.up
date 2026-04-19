-- 구독 관리 + 마케팅 캠페인 + 비용 구조 확장 컬럼 추가
-- user_store_data 테이블에 신규 JSONB 컬럼 추가

-- 구독 관리
ALTER TABLE user_store_data
  ADD COLUMN IF NOT EXISTS uses_subscriptions boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_plans jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS subscribers jsonb DEFAULT '[]'::jsonb;

-- 마케팅
ALTER TABLE user_store_data
  ADD COLUMN IF NOT EXISTS marketing_campaigns jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS marketing_monthly_budget integer DEFAULT 0;

-- 비용 구조는 이미 monthly_costs JSONB 안에 포함 (sga, marketing, interest 필드)
-- 별도 컬럼 불필요 — JSONB가 자동으로 새 필드를 수용
