-- AI 보고서 인사이트 캐시 테이블
-- 동일 기간·동일 데이터에 대해 AI를 재호출하지 않도록 결과를 캐시합니다.
-- snapshot_hash가 바뀌면 (= 사용자가 새 데이터 입력) upsert로 자동 갱신됩니다.

CREATE TABLE ai_report_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period text NOT NULL,        -- "day" | "week" | "month" | "quarter"
  period_key text NOT NULL,    -- "2026-05-05", "2026-W19", "2026-05", "2026-Q2"
  snapshot_hash text NOT NULL, -- revenue+costs+primeCostPct 결합 해시 (데이터 변경 감지)
  insight text NOT NULL,       -- AI 생성 인사이트 텍스트 (200~350자)
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period, period_key)
);

ALTER TABLE ai_report_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own report insights"
  ON ai_report_insights FOR ALL
  USING (auth.uid() = user_id);

-- 만료된 row 자동 정리용 인덱스
CREATE INDEX ai_report_insights_expires_at ON ai_report_insights (expires_at);
