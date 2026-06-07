-- 죽은 매출수집 레거시 테이블 3종 드롭 (2026-06-07 데이터 저장 점검).
--
-- 배경: 20260406_000035_sales_collection.sql 로 만든 초기 매출 자동수집 설계.
--   이후 portone/tossplace/codef/popbill 통합 채널로 대체되어 현재:
--     • 앱(웹·iOS) 어디에서도 read/write 하지 않음 (account-wipe 삭제목록에만 잔존했음 — 본 점검에서 제거)
--     • v_revenue_daily_unified 뷰도 이들을 참조하지 않음
--     • 다른 테이블의 FK 참조 없음
--   특히 sales_collection_config.{crefia,hometax,delivery}_credentials 는 "암호화 저장" 주석과 달리
--   봉투암호화 컬럼 없이 평문 jsonb — 데이터 유입 경로는 없으나 잔존 자체가 보안 부채.
--
-- 안전성: 읽기/쓰기 경로 0, 뷰·FK 참조 0 확인 후 드롭. IF EXISTS 로 멱등.

DROP TABLE IF EXISTS public.collected_sales CASCADE;
DROP TABLE IF EXISTS public.sales_sync_log CASCADE;
DROP TABLE IF EXISTS public.sales_collection_config CASCADE;
