-- ─────────────────────────────────────────────────────────────────
--  신규 가입자가 "사장/직원" 역할 선택 화면을 보도록 user_role 기본값 제거
--
--  문제: bootstrapAccountWorkspace → ensureBusinessProfile 이 가입 시
--    business_profiles 에 {user_id} 만 insert 하는데, 컬럼 기본값이 'owner' 라
--    신규 사용자가 자동으로 owner 로 확정됨 → connectAndLoad 가 항상 'owner' 를 읽어
--    역할 선택 화면(RoleSelectionScreen)이 절대 뜨지 않던 결함.
--
--  해결: 기본값 제거(→ NULL). 신규 행은 user_role = NULL 로 생성되고,
--    connectAndLoad 가 NULL 을 "역할 미선택"으로 보고 선택 화면을 띄운다.
--    선택 시 onSelect 가 upsert 로 'owner'/'staff' 를 기록.
--    CHECK (user_role IN ('owner','staff','manager')) 는 NULL 을 허용하므로 안전.
--    기존 행의 'owner'/'staff'/'manager' 값은 그대로 유지 → 기존 사용자 무영향.
--
--  ⚠️ 원격(prod) DB 적용 필요.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.business_profiles ALTER COLUMN user_role DROP DEFAULT;
