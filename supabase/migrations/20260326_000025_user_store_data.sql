-- user_store_data: 사용자 운영/분석 데이터 영속 저장
-- 기존에 localStorage에만 저장되던 데이터를 Supabase에 동기화

create table if not exists public.user_store_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- 가게 기본 정보
  store_name text,
  business_launched boolean default false,
  business_launched_date date,
  cpa_decision text,

  -- 세금 설정
  tax_settings jsonb default '{"vatType":"general","hasEmployees":false}'::jsonb,

  -- 월별 비용
  monthly_costs jsonb default '{"ingredients":0,"labor":0,"rent":0,"utilities":0,"other":0}'::jsonb,

  -- 매출 데이터
  daily_entries jsonb default '[]'::jsonb,

  -- 재고
  inventory_items jsonb default '[]'::jsonb,

  -- 직원
  employees jsonb default '[]'::jsonb,

  -- 고정 지출
  fixed_expenses jsonb default '[]'::jsonb,

  -- 배달/판매 플랫폼
  delivery_platforms jsonb default '[]'::jsonb,
  monthly_delivery_sales jsonb default '{}'::jsonb,

  -- 상품/서비스
  products jsonb default '[]'::jsonb,
  unified_products jsonb default '[]'::jsonb,
  service_menu_items jsonb default '[]'::jsonb,

  -- 멤버 (구독/회원권)
  members jsonb default '[]'::jsonb,

  -- 단계별 체크리스트
  vendor_selections jsonb default '{}'::jsonb,
  vendor_custom_inputs jsonb default '{}'::jsonb,
  ops_selections jsonb default '{}'::jsonb,
  ops_pos_checks jsonb default '{}'::jsonb,
  soft_open_checks jsonb default '{}'::jsonb,
  soft_open_pricing text default '',
  soft_open_skips jsonb default '{}'::jsonb,
  tax_checks jsonb default '{}'::jsonb,
  loan_checks jsonb default '{}'::jsonb,

  -- 온라인 판매
  online_platform_sales jsonb default '{}'::jsonb,
  online_selected_platforms jsonb default '[]'::jsonb,
  online_selected_courier text default '',
  online_monthly_parcels text default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id)
);

create index if not exists idx_user_store_data_user_id
  on public.user_store_data(user_id);

alter table public.user_store_data enable row level security;

create policy "user_store_data_select_own"
  on public.user_store_data for select
  using (auth.uid() = user_id);

create policy "user_store_data_insert_own"
  on public.user_store_data for insert
  with check (auth.uid() = user_id);

create policy "user_store_data_update_own"
  on public.user_store_data for update
  using (auth.uid() = user_id);

create policy "user_store_data_delete_own"
  on public.user_store_data for delete
  using (auth.uid() = user_id);
