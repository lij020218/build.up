-- user_store_data에 비용 이력 컬럼 추가
alter table public.user_store_data
  add column if not exists cost_history jsonb default '[]'::jsonb;
