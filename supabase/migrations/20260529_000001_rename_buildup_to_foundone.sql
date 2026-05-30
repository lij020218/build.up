-- ════════════════════════════════════════════════════════════
-- 20260529_000001_rename_buildup_to_foundone.sql
-- Found.One 리브랜딩 — 미사용 테이블 RENAME
-- ════════════════════════════════════════════════════════════
--
-- 배경:
--   build.up → Found.One 리브랜딩 일관성. buildup_subscriptions /
--   buildup_payments 는 정의만 됐고 코드 참조 0 (베타 전, 데이터 없음).
--
-- 안전성:
--   ✓ IF EXISTS 가드 (미적용 환경에서도 안전)
--   ✓ 코드 참조 0 → RENAME 후 즉시 영향 없음
--   ✓ 인덱스·RLS 정책은 PostgreSQL 이 자동 따라감 (테이블 RENAME 시)
--
-- 미반영 (출시 후 cleanup 백로그):
--   - 인덱스 자동생성명 prefix 'buildup_subscriptions_user_id_key' 등
--   - 트리거명 'trg_buildup_subscriptions_updated_at'
--   → cosmetic, 작동 무영향
--
-- 사용자 액션:
--   Supabase Studio → SQL Editor → 새 query → 아래 전체 붙여넣기 → Run

ALTER TABLE IF EXISTS buildup_subscriptions RENAME TO foundone_subscriptions;
ALTER TABLE IF EXISTS buildup_payments      RENAME TO foundone_payments;

COMMENT ON TABLE foundone_subscriptions IS 'Found.One 서비스 구독 (Free/Premium 플랜)';
COMMENT ON TABLE foundone_payments      IS 'Found.One 결제 이력';
