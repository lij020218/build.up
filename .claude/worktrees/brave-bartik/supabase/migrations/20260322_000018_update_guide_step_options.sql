-- Add options to guide steps that require user selection
-- cafe-dessert permit-check: step 1 업종 유형 결정

UPDATE public.stage_guide_content
SET steps = (
  SELECT jsonb_agg(
    CASE
      WHEN (step_obj->>'step')::int = 1
      THEN step_obj || $opt${"options": ["휴게음식점", "제과점"]}$opt$::jsonb
      ELSE step_obj
    END
  )
  FROM jsonb_array_elements(steps) AS step_obj
)
WHERE stage_code = 'permit-check'
  AND category_id = 'cafe-dessert'
  AND locale = 'ko';
