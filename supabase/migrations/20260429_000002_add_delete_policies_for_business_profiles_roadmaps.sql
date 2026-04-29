-- business_profiles 와 roadmaps 에 DELETE RLS policy 추가
--
--  ── 발견 경위 ─────────────────────────────────────────────────────
--  데모 초기화 (resetDemo) 가 실행되어도 business_profiles · roadmaps row 가
--  삭제되지 않음. 검증 SELECT count → 1 row 남음 → 초기화 실패.
--
--  RLS 가 활성화된 상태에서 DELETE policy 가 없으면 어떤 row 도 삭제 안 됨
--  (silent fail — 에러 없이 0 row 삭제). GRANT DELETE 권한이 있어도 RLS 가
--  row 단위로 막음.
--
--  ── 원인 ──────────────────────────────────────────────────────────
--  • 2026-03-19 초기 스키마: business_profiles, roadmaps, stage_decisions,
--    stage_tasks 모두 RLS 활성화
--  • SELECT/INSERT/UPDATE policy 만 추가됨 (DELETE 누락)
--  • 2026-03-21 보강 마이그레이션이 stage_decisions/stage_tasks 에만
--    DELETE policy 추가 — 그 때 business_profiles/roadmaps 는 빠뜨림
--  • 결과: 사용자 본인이 자기 데이터 삭제 시도해도 RLS 가 차단
--
--  ── 영향 ──────────────────────────────────────────────────────────
--  • resetDemo 실패 (verifyFailures 발생)
--  • 사용자가 자기 계정 데이터 영구 삭제 불가능 (GDPR-style 삭제 요청 처리 X)
--  • API 가 service role 사용해도 client-side 직접 wipe 는 막힘 → 이중 방어 깨짐
-- ──────────────────────────────────────────────────────────────────

CREATE POLICY "business_profiles_delete_own"
ON public.business_profiles
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "roadmaps_delete_own"
ON public.roadmaps
FOR DELETE
USING (auth.uid() = user_id);
