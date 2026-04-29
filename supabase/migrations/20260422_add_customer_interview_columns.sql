-- 고객 인터뷰 (Mom Test 기반) Supabase 동기화 컬럼 추가
-- user_store_data 테이블에 신규 JSONB 컬럼 추가
--
-- 배경: 사장님이 직접 시간 들여 입력한 고객 인터뷰 노트 + AI 패턴 분석 결과는
-- 손실 시 큰 손실 (다른 기기 접속·기기 교체 시 사라짐 위험).
-- localStorage(buildup-customer-interviews) → Supabase 영구 저장으로 보강.
--
-- 데이터 모델:
--   customer_interviews: Array<{
--     id: string;
--     date: string;          // ISO 날짜
--     type: "regular"|"lapsed"|"new"|"potential";
--     customerName?: string;
--     notes: string;
--     aiInsight?: string;
--     aiInsightAt?: string;
--   }>
--
--   interview_pattern_analysis: {
--     generatedAt: string;
--     interviewCount: number;
--     topPainPoints: string[];
--     topMotivations: string[];
--     segments: string[];
--     recommendations: string[];
--   } | null

ALTER TABLE user_store_data
  ADD COLUMN IF NOT EXISTS customer_interviews jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS interview_pattern_analysis jsonb DEFAULT NULL;

-- 고객 인터뷰 검색을 위한 GIN 인덱스 (선택 — 향후 텍스트 검색 활성화 시)
-- CREATE INDEX IF NOT EXISTS idx_user_store_data_interviews
--   ON user_store_data USING GIN (customer_interviews);
