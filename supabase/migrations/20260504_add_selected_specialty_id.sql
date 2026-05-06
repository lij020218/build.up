-- 사용자가 IndustrySelectionStage 에서 고른 specialty(세부업종) 를 영구 저장하기 위한 컬럼.
--
-- 배경 (2026-05-04):
--   기존엔 selectedSpecialtyId 가 profile-store(localStorage) 에만 저장되어
--   다른 디바이스/세션 에선 사라졌음. business_profiles 에 컬럼을 추가해
--   industry-selection 결정과 함께 Supabase 에 영구화한다.
--
-- 매핑 (apps/web/app/lib/components/stages/selection/specialty-data.ts):
--   sub_industry_id (industry option) → selected_specialty_id (specialty option)
--   예: "korean-casual" → "korean-gukbap"
--
-- nullable: 일부 industry 는 specialty 분기가 없음 (specialty-data.ts 미정의 industry).

ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS selected_specialty_id TEXT;

COMMENT ON COLUMN public.business_profiles.selected_specialty_id IS
  '세부업종(specialty) ID — apps/web/.../specialty-data.ts SPECIALTY_BY_INDUSTRY 의 옵션 id. sub_industry_id 하위 분기.';
