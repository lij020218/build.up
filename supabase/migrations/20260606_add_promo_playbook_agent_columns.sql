-- 20260606_add_promo_playbook_agent_columns.sql
-- 웹·앱 동기화 갭 해소 (Phase B): 그동안 localStorage 전용이던 사용자 입력 3종을
--   user_store_data 에 동기화 → 기기 변경·캐시 삭제에도 보존, 웹↔앱 일치.
--   · promo_codes        : 프로모션 코드 (마케팅) — 사장님이 생성한 할인 코드
--   · playbook_checklist : "첫 100명 고객" 플레이북 진행 체크리스트
--   · agent_settings     : 에이전트 on/off 설정 (Record<AgentKind, boolean>)
-- 모두 idempotent (IF NOT EXISTS). 기존 행은 기본값으로 채워짐.

ALTER TABLE public.user_store_data
  ADD COLUMN IF NOT EXISTS promo_codes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS playbook_checklist jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS agent_settings jsonb DEFAULT '{"coupon":true,"reorder":true,"content":true,"review":true}'::jsonb;
