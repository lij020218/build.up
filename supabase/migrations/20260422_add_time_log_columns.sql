-- 시간 로그 (Drucker "시간이 어디로 가는지 알라") Supabase 동기화 컬럼 추가
-- user_store_data 테이블에 신규 컬럼 추가
--
-- 배경: 매일 저녁 5분 체크인 (customer/operations/marketing 비율) 데이터는
-- 사장님이 직접 시간 들여 입력. 90일 누적 시 시간 사용 패턴 인사이트의 핵심.
-- localStorage(buildup-time-log) → Supabase 영구 저장으로 보강.
--
-- 데이터 모델:
--   time_log_entries: Array<{
--     date: string;           // ISO "2026-04-22"
--     customerPct: number;    // 0-100
--     operationsPct: number;  // 0-100
--     marketingPct: number;   // 0-100
--     note?: string;
--     createdAt: string;
--   }>
--   time_log_enabled: boolean (사용자가 기능 끌 수 있음, 기본 true)

ALTER TABLE user_store_data
  ADD COLUMN IF NOT EXISTS time_log_entries jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS time_log_enabled boolean DEFAULT true;
