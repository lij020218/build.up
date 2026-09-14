-- 가입 유입 출처(acquisition) 저장 — 2026-09-12
--
-- 왜: 메타 광고 2종을 집행했는데(직원관리 67,084원 / 매출관리 2,163원) 가입자가
--   어느 소재로 왔는지 확인할 수 없었다. 측정 가능한 지표가 "랜딩 조회"까지라
--   조회당 비용은 알아도 가입자 1명당 비용을 계산할 수 없다(광고 분석 PDF 결론과 동일).
--
-- 무엇을: 첫 방문의 utm_* / referrer 를 가입 시점에 한 번만 기록한다(first-touch).
--   개인정보가 아니라 캠페인 식별자만 담는다. 값은 클라이언트가 만들고 길이를 제한한다.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS acquisition jsonb;

COMMENT ON COLUMN public.user_profiles.acquisition IS
  '가입 유입 출처(first-touch). { source, medium, campaign, content, term, referrer, landedAt } — 캠페인 식별자만, 개인정보 없음.';

-- 신규 가입 트리거 — 이메일 가입은 signUp metadata 로 넘어온 값을 그대로 복사.
--  (OAuth 는 metadata 를 못 넘기므로 클라이언트가 세션 직후 비어 있을 때만 채운다.)
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_first  text;
  v_last   text;
  v_byear  smallint;
  v_acq    jsonb;
BEGIN
  v_first := COALESCE(trim(NEW.raw_user_meta_data->>'first_name'), '');
  v_last  := COALESCE(trim(NEW.raw_user_meta_data->>'last_name'),  '');
  v_byear := CASE
    WHEN NEW.raw_user_meta_data->>'birth_year' ~ '^\d{4}$'
     AND (NEW.raw_user_meta_data->>'birth_year')::integer BETWEEN 1900 AND 2010
    THEN (NEW.raw_user_meta_data->>'birth_year')::smallint
    ELSE NULL
  END;
  -- jsonb 가 아니거나 크면 버린다 — 트리거에서 가입 자체가 실패하면 안 된다.
  v_acq := CASE
    WHEN jsonb_typeof(NEW.raw_user_meta_data->'acquisition') = 'object'
     AND length(NEW.raw_user_meta_data->>'acquisition') <= 2000
    THEN NEW.raw_user_meta_data->'acquisition'
    ELSE NULL
  END;

  INSERT INTO public.user_profiles (user_id, first_name, last_name, birth_year, acquisition)
  VALUES (NEW.id, v_first, v_last, v_byear, v_acq)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
