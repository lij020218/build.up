-- 매일 08:00 KST cron으로 생성되는 업종별 마케팅 트렌드 캐시.
-- 구조: row per (date, sub_industry_id). 20 트렌드 그룹에서 생성된 결과를 fan-out 저장.
-- 읽기: 사용자의 sub_industry_id로 오늘자 단일 조회 → 즉시 응답.

CREATE TABLE IF NOT EXISTS marketing_trend_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 조회 키
  date date NOT NULL,                    -- KST 기준 날짜 (YYYY-MM-DD)
  sub_industry_id text NOT NULL,         -- starterIndustryOptions.id (66개 중 하나)
  language text NOT NULL DEFAULT 'ko',   -- 'ko' | 'en'

  -- 생성 그룹 추적 (디버깅/코스트 분석용)
  group_key text NOT NULL,               -- 예: 'food-delivery', 'beauty-care' (20개 중 하나)
  category_id text NOT NULL,             -- 11 대분류 중 하나 (food, cafe-dessert, ...)

  -- 실제 페이로드 (API 응답 그대로)
  trends jsonb NOT NULL DEFAULT '[]'::jsonb,    -- TrendItem[] (title/reason/contentIdea/format/hashtags/referenceUrl)
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,   -- {name,url,publishedDate?}[]
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,      -- {usedDataLab,usedNaverBlog,usedTavily,webSearches}

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- 하루 1업종 1언어 = 최대 1 row
  UNIQUE (date, sub_industry_id, language)
);

-- 주 조회 쿼리: WHERE date = today AND sub_industry_id = ? AND language = ?
CREATE INDEX IF NOT EXISTS idx_marketing_trend_cache_lookup
  ON marketing_trend_cache (date DESC, sub_industry_id, language);

-- 오래된 캐시 정리 / 그룹별 비용 분석용
CREATE INDEX IF NOT EXISTS idx_marketing_trend_cache_group
  ON marketing_trend_cache (group_key, date DESC);

-- 자동 updated_at 갱신
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_marketing_trend_cache_updated_at ON marketing_trend_cache;
CREATE TRIGGER trg_marketing_trend_cache_updated_at
  BEFORE UPDATE ON marketing_trend_cache
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: 전체 공개 읽기 (트렌드는 공개 데이터), 쓰기는 service_role만
ALTER TABLE marketing_trend_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_trend_cache_public_read" ON marketing_trend_cache;
CREATE POLICY "marketing_trend_cache_public_read"
  ON marketing_trend_cache FOR SELECT
  USING (true);

-- INSERT/UPDATE는 service_role 전용 (cron job이 SUPABASE_SERVICE_ROLE_KEY로 접근)
DROP POLICY IF EXISTS "marketing_trend_cache_service_write" ON marketing_trend_cache;
CREATE POLICY "marketing_trend_cache_service_write"
  ON marketing_trend_cache FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE marketing_trend_cache IS '매일 08:00 KST pre-generated marketing trends per sub-industry (fan-out from 20 trend clusters).';
COMMENT ON COLUMN marketing_trend_cache.group_key IS 'Cluster key used to generate this row (multiple sub_industry_ids share one generation).';
