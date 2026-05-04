-- 2026-05-01: 영업 시간(open/close) 컬럼 추가
-- 사장님 일자 컷오프 계산 (Asia/Seoul)에 사용:
--   · 카페 22:00 마감 → 22:30 까지는 "오늘"의 영업일
--   · 바 01:00 마감 → 01:30 까지는 "어제"의 영업일
-- 온라인·스타트업은 NULL (자정 KST 기준 기본 동작)

ALTER TABLE user_store_data
  ADD COLUMN IF NOT EXISTS business_open_time text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS business_close_time text DEFAULT NULL;

COMMENT ON COLUMN user_store_data.business_open_time IS '영업 시작 시각 HH:MM 24h KST (오프라인 전용)';
COMMENT ON COLUMN user_store_data.business_close_time IS '영업 종료 시각 HH:MM 24h KST. 일자 컷오프 계산용 (closeTime + 30분 = 다음 영업일)';
