-- user_profiles: 성명·출생연도 분리 저장 (auth.users.user_metadata 에도 미러)
-- RLS: 본인 행만 읽기/쓰기, service_role 전체

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  first_name  text NOT NULL DEFAULT '' CHECK (char_length(first_name) <= 50),
  last_name   text NOT NULL DEFAULT '' CHECK (char_length(last_name) <= 50),
  birth_year  smallint CHECK (birth_year IS NULL OR (birth_year >= 1900 AND birth_year <= 2010)),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_own"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_service_role"
  ON public.user_profiles
  USING (auth.role() = 'service_role');

-- updated_at 자동 갱신 (이미 다른 테이블에 동일 함수가 없으면 생성)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 신규 가입 시 auth.users INSERT → user_profiles 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_first  text;
  v_last   text;
  v_byear  smallint;
BEGIN
  v_first := COALESCE(trim(NEW.raw_user_meta_data->>'first_name'), '');
  v_last  := COALESCE(trim(NEW.raw_user_meta_data->>'last_name'),  '');
  v_byear := CASE
    WHEN NEW.raw_user_meta_data->>'birth_year' ~ '^\d{4}$'
     AND (NEW.raw_user_meta_data->>'birth_year')::integer BETWEEN 1900 AND 2010
    THEN (NEW.raw_user_meta_data->>'birth_year')::smallint
    ELSE NULL
  END;

  INSERT INTO public.user_profiles (user_id, first_name, last_name, birth_year)
  VALUES (NEW.id, v_first, v_last, v_byear)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- authenticated 역할에 접근 허용
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
