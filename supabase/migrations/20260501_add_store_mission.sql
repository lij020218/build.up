-- 2026-05-01: 가게 미션 (Why) 컬럼 추가
-- 사장이 사업 의사결정·채용·브랜드의 북극성으로 사용할 mission statement.
-- 회사마다 본인의 mission 정의 (Apple "computers for the rest of us", Stripe "increase the GDP of the internet" 등).

ALTER TABLE user_store_data
  ADD COLUMN IF NOT EXISTS mission text DEFAULT NULL;

COMMENT ON COLUMN user_store_data.mission IS '가게/회사의 미션 — 존재 이유. 1~2문장. 장기 의사결정의 북극성.';
