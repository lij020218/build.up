-- Found.One: user_store_data에 AI 생성 결과 컬럼 추가
-- 2026-04-11: guideSelections, aiRoadmapResult, interiorConcept, businessPlan, interview 결과

ALTER TABLE user_store_data
  ADD COLUMN IF NOT EXISTS guide_selections jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_roadmap_result jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS selected_interior_concept text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS saved_business_plan jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS saved_interview_script jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS saved_interview_analysis jsonb DEFAULT NULL;
