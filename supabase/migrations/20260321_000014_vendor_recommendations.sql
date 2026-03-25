-- vendor_recommendations 테이블
-- 업종별 오픈 준비 단계 벤더/파트너 추천 데이터
-- startup_type: 'all' | 'franchise' | 'independent'
-- vendor_type: 'ingredient' | 'equipment' | 'interior' | 'pos' | 'packaging' |
--              'supplies' | 'sourcing' | 'booking' | 'management' | 'logistics' |
--              'photography' | 'platform' | 'tools' | 'display' | 'safety' |
--              'franchise_supplier_check'

create table public.vendor_recommendations (
  id               uuid        primary key default gen_random_uuid(),
  category_id      text        not null,
  sub_industry_id  text,
  startup_type     text        not null default 'all',
  vendor_type      text        not null,
  title            text        not null,
  description      text        not null,
  check_items      text[]      not null default '{}',
  franchise_note   text,
  priority         int         not null default 0,
  is_active        boolean     not null default true,
  created_at       timestamptz not null default now()
);

-- RLS
alter table public.vendor_recommendations enable row level security;

create policy "vendor_recommendations_select_all"
on public.vendor_recommendations
for select
using (is_active = true);

-- 조회 인덱스
create index vendor_recommendations_category_idx
  on public.vendor_recommendations (category_id, startup_type, vendor_type);
