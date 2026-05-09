-- ════════════════════════════════════════════════════════════
-- Build.UP 누락 마이그레이션 묶음 (2026-05-01 ~ 2026-05-05)
-- Supabase Studio → SQL Editor 에 전체 붙여넣기 → Run
-- 모든 ALTER 는 IF NOT EXISTS / IF EXISTS 안전 가드 포함
-- ════════════════════════════════════════════════════════════

-- ━━━ 20260501_add_business_hours.sql ━━━
-- 2026-05-01: 영업 시간(open/close) 컬럼 추가
-- 사장님 일자 컷오프 계산 (Asia/Seoul)에 사용:
--   · 카페 22:00 마감 → 22:30 까지는 "오늘"의 영업일
--   · 바 01:00 마감 → 01:30 까지는 "어제"의 영업일
-- 온라인·스타트업은 NULL (자정 KST 기준 기본 동작)

ALTER TABLE user_store_data
  ADD COLUMN IF NOT EXISTS business_open_time text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS business_close_time text DEFAULT NULL;

COMMENT ON COLUMN user_store_data.business_open_time IS '영업 시작 시각 HH:MM 24h KST (오프라인 전용)';
COMMENT ON COLUMN user_store_data.business_close_time IS '영업 종료 시각 HH:MM 24h KST. 일자 컷오프 계산용 (closeTime + 30분 = 다음 영업일)';

-- ━━━ 20260501_add_store_info.sql ━━━
-- 2026-05-01: "내 가게" 페이지 — 회계·정적 정보 컬럼 추가
-- 모든 80개 세부업종 cover. AI 호출 0 — 사용자 입력 + 룰 기반 산수만.
-- jsonb 위주로 유연하게 — 세부업종별 추가 필드는 industry_specifics 안에.

ALTER TABLE user_store_data
  -- Identity & Location (Hero용)
  ADD COLUMN IF NOT EXISTS short_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS long_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS address_road text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS address_detail text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS region_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS latitude double precision DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitude double precision DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS phone text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS owner_phone text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS website_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS instagram_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS naver_place_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS kakao_place_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS weekly_holidays jsonb DEFAULT '[]'::jsonb,    -- ["mon","tue"]
  ADD COLUMN IF NOT EXISTS break_time text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS store_photos jsonb DEFAULT '[]'::jsonb,        -- [{url, caption}]

  -- Financial Snapshot (수동 입력 잔고 + 운영 시작일은 별도 컬럼 이미 있음)
  ADD COLUMN IF NOT EXISTS current_balance_manual_krw bigint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_balance_updated_at timestamptz DEFAULT NULL,

  -- Legal & Compliance (단일 필드 + permits 배열)
  ADD COLUMN IF NOT EXISTS biz_registration_number text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS biz_registration_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS biz_registration_type text DEFAULT NULL,    -- simplified|standard|vat-exempt|corporation
  ADD COLUMN IF NOT EXISTS industry_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS telecom_sales_number text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS four_insurance_established text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS permits jsonb DEFAULT '[]'::jsonb,           -- [{name, kind, issuedAt, expiresAt, ...}]

  -- Money Infrastructure
  ADD COLUMN IF NOT EXISTS biz_bank_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS biz_bank_account_masked text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS biz_card_issued text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pos_terminal text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tax_handling text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cpa_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cpa_phone text DEFAULT NULL,

  -- People & Vendors (배열) — 기존 employees/vendors 와 별개의 통합 명부
  ADD COLUMN IF NOT EXISTS people_directory jsonb DEFAULT '[]'::jsonb,

  -- Insurance (배열)
  ADD COLUMN IF NOT EXISTS insurance_policies jsonb DEFAULT '[]'::jsonb,

  -- Footprint (오프라인=tenancy, 온라인=digital, 출장형=mobile)
  ADD COLUMN IF NOT EXISTS tenancy jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS digital_footprint jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS vehicles jsonb DEFAULT '[]'::jsonb,

  -- Industry-specific (카테고리별 배열·필드 모두 여기에)
  -- 키 구조: { "menu-ingredients": [...], "kitchen-assets": [...], ... }
  ADD COLUMN IF NOT EXISTS industry_specifics jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN user_store_data.industry_specifics IS '카테고리별 동적 섹션 데이터 — { sectionId: array_or_object }';
COMMENT ON COLUMN user_store_data.permits IS '인허가 배열 — 만료일 D-day 추적';
COMMENT ON COLUMN user_store_data.insurance_policies IS '보험 배열 — 갱신일 D-day 추적';

-- ━━━ 20260501_add_store_mission.sql ━━━
-- 2026-05-01: 가게 미션 (Why) 컬럼 추가
-- 사장이 사업 의사결정·채용·브랜드의 북극성으로 사용할 mission statement.
-- 회사마다 본인의 mission 정의 (Apple "computers for the rest of us", Stripe "increase the GDP of the internet" 등).

ALTER TABLE user_store_data
  ADD COLUMN IF NOT EXISTS mission text DEFAULT NULL;

COMMENT ON COLUMN user_store_data.mission IS '가게/회사의 미션 — 존재 이유. 1~2문장. 장기 의사결정의 북극성.';

-- ━━━ 20260501_add_store_photos_bucket.sql ━━━
-- 2026-05-01: 매장 사진 업로드용 Supabase Storage 버킷 + RLS 정책
-- "내 가게" Hero/Identity 섹션 사진 갤러리에 사용.
-- 경로 규칙: {user_id}/{uuid}.{ext}
-- 정책: 누구나 읽기 가능 (URL 알면 OK), 본인만 업로드/삭제

-- 1) Bucket 생성 (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-photos',
  'store-photos',
  true,
  10485760,                                                               -- 10 MB 제한
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2) RLS 정책 — 본인 폴더(user_id 첫 segment) 안에서만 INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "store_photos_select" ON storage.objects;
drop policy if exists "store_photos_select" on storage.objects;
CREATE POLICY "store_photos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-photos');

DROP POLICY IF EXISTS "store_photos_insert" ON storage.objects;
drop policy if exists "store_photos_insert" on storage.objects;
CREATE POLICY "store_photos_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'store-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "store_photos_update" ON storage.objects;
drop policy if exists "store_photos_update" on storage.objects;
CREATE POLICY "store_photos_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'store-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "store_photos_delete" ON storage.objects;
drop policy if exists "store_photos_delete" on storage.objects;
CREATE POLICY "store_photos_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'store-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ━━━ 20260503_000001_fix_interior_guides_grants.sql ━━━
-- ─────────────────────────────────────────────────────────────────
--  FIX: interior_design_guides 403 (사용자 보고 2026-05-03)
--
--  증상: 브라우저 콘솔에 `interior_design_guides` 에 대한 403 에러 다수.
--    construction-setup 단계에서 인테리어 자재·컨셉 데이터를 못 불러옴 →
--    하드코딩 폴백으로 동작 (UX 영향 X 이지만 콘솔 노이즈 + DB 풀 비활성).
--
--  원인: 20260403_000031 에서 RLS 정책 (`Anyone can read interior guides USING (true)`)
--    + `Anonymous can read vendor_recommendations` 만 만들고 GRANT 누락.
--    PostgreSQL 은 role-level GRANT 를 먼저 확인하고 그 다음 RLS 정책 적용.
--    GRANT 가 없으면 RLS 까지 도달하지 못하고 42501 (= 403) 발생.
--
--  해결: anon + authenticated 둘 다 SELECT GRANT.
--    20260429_000001 의 grants 마이그레이션에서 ro_tables 배열에 빠져 있었음.
-- ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  ro_tables text[] := ARRAY[
    'interior_design_guides',
    'vendor_recommendations',  -- 같은 패턴 — Pass 2 AI 가 풀에서 셀렉
    'permit_knowledge',
    'tax_knowledge',
    'loan_knowledge',
    'market_signals',
    'logistics_platforms',
    'pos_systems',
    'delivery_platforms',
    'sns_channels',
    'sub_industry_pricing',
    'sub_industry_market_signal'
  ];
  t text;
  granted_count int := 0;
  skipped_count int := 0;
BEGIN
  FOREACH t IN ARRAY ro_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', t);
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon', t);
      granted_count := granted_count + 1;
      RAISE NOTICE '[grant-2nd-pass] ro  ✓ public.%', t;
    ELSE
      skipped_count := skipped_count + 1;
      RAISE NOTICE '[grant-2nd-pass] ro  - public.% (does not exist, skipped)', t;
    END IF;
  END LOOP;

  RAISE NOTICE '[grant-2nd-pass] done — granted=% skipped=%', granted_count, skipped_count;
END $$;

-- ━━━ 20260504_add_selected_specialty_id.sql ━━━
-- 사용자가 IndustrySelectionStage 에서 고른 specialty(세부업종) 를 영구 저장하기 위한 컬럼.
--
-- 배경 (2026-05-04):
--   기존엔 selectedSpecialtyId 가 profile-store(localStorage) 에만 저장되어
--   다른 디바이스/세션 에선 사라졌음. business_profiles 에 컬럼을 추가해
--   industry-selection 결정과 함께 Supabase 에 영구화한다.
--
-- 매핑 (apps/web/app/lib/components/stages/selection/specialty-data.ts):
--   sub_industry_id (industry option) → selected_specialty_id (specialty option)
--   예: "korean-casual" → "korean-gukbap"
--
-- nullable: 일부 industry 는 specialty 분기가 없음 (specialty-data.ts 미정의 industry).

ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS selected_specialty_id TEXT;

COMMENT ON COLUMN public.business_profiles.selected_specialty_id IS
  '세부업종(specialty) ID — apps/web/.../specialty-data.ts SPECIALTY_BY_INDUSTRY 의 옵션 id. sub_industry_id 하위 분기.';

-- ━━━ 20260505_add_popbill_codef_bank.sql ━━━
-- 팝빌 (홈택스 세금계산서/현금영수증) + CODEF 사업자 통장 거래내역.
--
-- 기존 portone/tossplace/codef_card_sales 패턴 그대로:
--   * 봉투 암호화 (encrypted_secret + DEK + KEK 회전)
--   * RLS: 본인 select 만, write 는 service_role
--   * updated_at 트리거: portone_set_updated_at() 재사용
--
-- 가치:
--   1) 사장님 → 사업자 통장 거래내역 자동 (현금 매출 + 사업 지출 분리)
--   2) 사장님 → 홈택스 세금계산서 자동 (B2B 매출/매입 자동 캐치)
--   3) 사장님 → 현금영수증 자동 (현금영수증 발행 매출 자동 캐치)

-- ─────────────────────────────────────────────────────────────────
-- 1. 팝빌 연결 (LinkID 는 plain, SecretKey 는 envelope encryption)
--    팝빌 자체는 환경변수에 LinkID/SecretKey 보관하지만,
--    "회원 인증서" 등록 후 사장님 사업자번호별로 작업 위임이 가능하므로
--    여기서는 사장님 사업자번호 + 권한 등록 상태를 보관.
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.popbill_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_number text not null,                  -- 사장님 사업자번호 (10자, hyphen 제거)
  business_number_mask text not null,             -- 마스킹 표시용
  business_name text,
  -- 팝빌은 회원사 LinkID/SecretKey 가 환경변수라 봉투 암호화 불필요.
  -- 단, 사장님이 홈택스 인증서 위임을 했는지 상태만 추적.
  hometax_cert_registered boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'invalid', 'revoked')),
  last_sync_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);
create index if not exists idx_popbill_conn_user on public.popbill_connections(user_id);
create index if not exists idx_popbill_conn_status on public.popbill_connections(status) where status = 'active';

-- 팝빌 비동기 작업(Job) 추적 — RequestJob 호출 → jobID → GetJobState 폴링 → Search 로 수집
create table if not exists public.popbill_jobs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id text not null,                           -- 팝빌 jobID (18자)
  job_kind text not null check (job_kind in ('taxinvoice_sell', 'taxinvoice_buy', 'cashbill')),
  date_type text not null,                        -- 'W'(작성일) | 'I'(발행일) | 'S'(전송일)
  start_date date not null,
  end_date date not null,
  state text not null default 'requested'
    check (state in ('requested', 'wait', 'working', 'success', 'failed', 'cancelled')),
  collect_total int default 0,
  collect_count int default 0,
  error_code text,
  error_message text,
  requested_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (user_id, job_id)
);
create index if not exists idx_popbill_jobs_user_state on public.popbill_jobs(user_id, state);
create index if not exists idx_popbill_jobs_user_kind on public.popbill_jobs(user_id, job_kind, requested_at desc);

-- 세금계산서 (매출 SELL + 매입 BUY)
create table if not exists public.popbill_tax_invoices (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check (direction in ('sell', 'buy')),
  -- 식별자
  nts_confirm_num text,                           -- 국세청 승인번호 (24자) — 동일 키
  document_id text,                               -- 팝빌 내부 문서 식별자
  -- 거래 일자
  write_date date,                                -- 작성일자
  issue_date timestamptz,                         -- 발행일시
  send_date timestamptz,                          -- 국세청 전송일시
  -- 금액
  supply_cost_total bigint not null default 0,
  tax_total bigint not null default 0,
  total_amount bigint not null default 0,
  -- 분류
  tax_type text,                                  -- T(과세) | N(영세) | Z(면세)
  purpose_type text,                              -- R(영수) | C(청구) | N(없음)
  modify_code int,                                -- 수정사유 코드
  -- 상대방 정보 (매출이면 invoicee=구매자, 매입이면 invoicer=공급자)
  counterparty_corp_num text,                     -- 거래상대 사업자번호
  counterparty_corp_name text,                    -- 거래상대 사업자명
  -- 자기 정보
  self_corp_num text,
  self_corp_name text,
  raw jsonb,
  synced_at timestamptz not null default now(),
  unique (user_id, direction, nts_confirm_num)
);
create index if not exists idx_popbill_tax_user_issue on public.popbill_tax_invoices(user_id, issue_date desc);
create index if not exists idx_popbill_tax_user_dir on public.popbill_tax_invoices(user_id, direction, write_date desc);

-- 현금영수증 (매출만 — 사장님이 발행한 것)
create table if not exists public.popbill_cashbills (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  confirm_num text,                               -- 국세청 승인번호
  trade_date date,                                -- 거래일자
  issue_date timestamptz,                         -- 발행일시
  trade_type text,                                -- 'N'(소득공제) | 'C'(지출증빙)
  trade_usage text,                               -- 'P'(개인) | 'C'(법인)
  supply_cost bigint not null default 0,
  tax bigint not null default 0,
  service_fee bigint not null default 0,
  total_amount bigint not null default 0,
  identity_num_mask text,                         -- 가입자 식별번호 마스킹
  raw jsonb,
  synced_at timestamptz not null default now(),
  unique (user_id, confirm_num)
);
create index if not exists idx_popbill_cash_user_issue on public.popbill_cashbills(user_id, issue_date desc);

-- ─────────────────────────────────────────────────────────────────
-- 2. CODEF 사업자 통장 거래내역
--    codef_connections 는 이미 존재 — 한 user 가 카드매출 + 통장 둘 다 위임.
--    별도 connection 분리하면 사장님이 정보 두 번 입력해야 하므로
--    같은 codef_connections 에서 status 만 공유하고
--    여기 codef_bank_accounts 에 등록한 계좌 메타만 추가.
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.codef_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization text not null,                     -- 은행코드 (CODEF 표준, 예: 0004=KB)
  bank_name text,                                 -- 표시용 ("KB국민", "신한" 등)
  account_number text not null,                   -- 사장님 입력 그대로 (hyphen 제거)
  account_number_mask text not null,              -- 마스킹 ("123-***-456789")
  account_holder text,                            -- 예금주
  account_alias text,                             -- 사장님이 정한 별칭 ("운영통장", "정산통장")
  is_primary boolean not null default false,      -- 메인 사업자 통장 (대시보드 디폴트)
  status text not null default 'active'
    check (status in ('active', 'invalid', 'revoked')),
  last_sync_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, organization, account_number)
);
create index if not exists idx_codef_bank_acc_user on public.codef_bank_accounts(user_id);
create index if not exists idx_codef_bank_acc_primary on public.codef_bank_accounts(user_id, is_primary)
  where is_primary = true;

-- 사업자 통장 거래내역 (입금/출금 통합)
create table if not exists public.codef_bank_transactions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.codef_bank_accounts(id) on delete cascade,
  -- 거래 단건
  transaction_at timestamptz not null,            -- resAccountTrDate + resAccountTrTime 합성
  amount_in bigint not null default 0,            -- resAccountIn (입금)
  amount_out bigint not null default 0,           -- resAccountOut (출금)
  balance_after bigint,                           -- resAfterTranBalance
  -- 거래 설명 (CODEF 는 desc1~4 4 칸으로 분리됨)
  description1 text,
  description2 text,
  description3 text,
  description4 text,
  -- 분류 (정산 자동분류용)
  category text,                                  -- 'card_settlement'|'rent'|'utility'|'salary'|'tax'|'sales_cash'|'transfer_in'|'transfer_out'|'other'
  counterparty text,                              -- 정규화된 거래처명 (description 에서 추출)
  raw jsonb,
  -- 동일 거래 중복 방지: 같은 시점 + 같은 금액 + 같은 잔액 = 동일 거래
  unique (user_id, account_id, transaction_at, amount_in, amount_out, balance_after)
);
create index if not exists idx_codef_bank_tx_user_at on public.codef_bank_transactions(user_id, transaction_at desc);
create index if not exists idx_codef_bank_tx_account on public.codef_bank_transactions(account_id, transaction_at desc);
create index if not exists idx_codef_bank_tx_user_cat on public.codef_bank_transactions(user_id, category)
  where category is not null;

-- ─────────────────────────────────────────────────────────────────
-- 3. RLS — 본인 select 만, write 는 service_role
-- ─────────────────────────────────────────────────────────────────
alter table public.popbill_connections enable row level security;
alter table public.popbill_jobs enable row level security;
alter table public.popbill_tax_invoices enable row level security;
alter table public.popbill_cashbills enable row level security;
alter table public.codef_bank_accounts enable row level security;
alter table public.codef_bank_transactions enable row level security;

drop policy if exists "popbill_conn_select_own" on public.popbill_connections;

create policy "popbill_conn_select_own" on public.popbill_connections
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "popbill_jobs_select_own" on public.popbill_jobs;
create policy "popbill_jobs_select_own" on public.popbill_jobs
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "popbill_tax_select_own" on public.popbill_tax_invoices;
create policy "popbill_tax_select_own" on public.popbill_tax_invoices
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "popbill_cash_select_own" on public.popbill_cashbills;
create policy "popbill_cash_select_own" on public.popbill_cashbills
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "codef_bank_acc_select_own" on public.codef_bank_accounts;
create policy "codef_bank_acc_select_own" on public.codef_bank_accounts
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "codef_bank_tx_select_own" on public.codef_bank_transactions;
create policy "codef_bank_tx_select_own" on public.codef_bank_transactions
  for select to authenticated using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- 4. updated_at 트리거 (포트원에서 정의된 함수 재사용)
-- ─────────────────────────────────────────────────────────────────
drop trigger if exists trg_popbill_conn_updated_at on public.popbill_connections;
drop trigger if exists trg_popbill_conn_updated_at on public.popbill_connections;
create trigger trg_popbill_conn_updated_at
  before update on public.popbill_connections
  for each row execute function public.portone_set_updated_at();

drop trigger if exists trg_codef_bank_acc_updated_at on public.codef_bank_accounts;
drop trigger if exists trg_codef_bank_acc_updated_at on public.codef_bank_accounts;
create trigger trg_codef_bank_acc_updated_at
  before update on public.codef_bank_accounts
  for each row execute function public.portone_set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- 5. 통합 일별 매출 뷰 (대시보드용)
--    포트원 + 토스플레이스 + CODEF 카드매출 + 통장 입금 + 현금영수증 + 세금계산서 매출
--    → 한 user_id, date 기준 합계 쉽게 가져갈 수 있는 view.
--    개별 채널 중복 가능 → 화면에서 source 별 필터 적용.
-- ─────────────────────────────────────────────────────────────────
create or replace view public.v_revenue_daily_unified as
  select
    user_id,
    (approved_at at time zone 'Asia/Seoul')::date as date,
    'tossplace' as source,
    sum(amount)::bigint as amount,
    count(*) as tx_count
  from public.tossplace_payments
  where approved_at is not null
  group by user_id, (approved_at at time zone 'Asia/Seoul')::date

  union all

  select
    user_id,
    (approved_at at time zone 'Asia/Seoul')::date as date,
    'codef_card' as source,
    sum(amount)::bigint as amount,
    count(*) as tx_count
  from public.codef_card_sales
  where approved_at is not null and status = 'approved'
  group by user_id, (approved_at at time zone 'Asia/Seoul')::date

  union all

  select
    user_id,
    (issue_date at time zone 'Asia/Seoul')::date as date,
    'popbill_cashbill' as source,
    sum(total_amount)::bigint as amount,
    count(*) as tx_count
  from public.popbill_cashbills
  where issue_date is not null
  group by user_id, (issue_date at time zone 'Asia/Seoul')::date

  union all

  select
    user_id,
    (issue_date at time zone 'Asia/Seoul')::date as date,
    'popbill_taxinvoice_sell' as source,
    sum(total_amount)::bigint as amount,
    count(*) as tx_count
  from public.popbill_tax_invoices
  where direction = 'sell' and issue_date is not null
  group by user_id, (issue_date at time zone 'Asia/Seoul')::date;

comment on view public.v_revenue_daily_unified is
  '모든 통합 채널의 일별 매출 합산 (소스별 분리). useDashboard 의 dailyEntries 보강용.';

-- 코멘트
comment on table public.popbill_connections is
  '팝빌 회원사 연결 — 사장님 사업자번호 + 홈택스 인증서 위임 상태.';
comment on table public.popbill_jobs is
  '팝빌 비동기 수집 작업 (RequestJob → GetJobState → Search). 1시간 내 jobID 유효.';
comment on table public.popbill_tax_invoices is
  '홈택스 전자세금계산서 (매출 sell + 매입 buy). nts_confirm_num 으로 dedup.';
comment on table public.popbill_cashbills is
  '홈택스 현금영수증 (사장님이 발행한 매출 건).';
comment on table public.codef_bank_accounts is
  'CODEF 통해 등록한 사업자 통장 메타. 거래내역은 codef_bank_transactions 참조.';
comment on table public.codef_bank_transactions is
  'CODEF 기업 수시입출 거래내역 — 입출금 + 잔액 + 자동 카테고리.';

-- ━━━ 20260505_ai_report_insights.sql ━━━
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

drop policy if exists "users see own report insights" on ai_report_insights;

CREATE POLICY "users see own report insights"
  ON ai_report_insights FOR ALL
  USING (auth.uid() = user_id);

-- 만료된 row 자동 정리용 인덱스
CREATE INDEX ai_report_insights_expires_at ON ai_report_insights (expires_at);

-- ━━━ 20260505_insight_rag.sql ━━━
-- Insight RAG: vector-based knowledge base for high-quality business insight articles.
-- Separate from `knowledge_chunks` (tax/loan FTS) — this is for long-form business strategy
-- content (PE/VC playbooks, AI strategy, fundraising, operations, etc.)
--
-- Stack: pgvector + OpenAI text-embedding-3-small (1536 dim) + HNSW index + cosine distance.

create extension if not exists vector;

-- ── insight_documents: original article metadata ─────────────────────────
create table if not exists public.insight_documents (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  source_url    text,
  source_name   text,                                 -- 'bzcf', 'techcrunch', 'a16z', ...
  category      text not null,                        -- 'ai_strategy', 'fundraising', 'operations', 'marketing', ...
  tags          text[] not null default '{}',
  language      text not null default 'ko',
  published_at  date,
  content_hash  text unique,                          -- sha256 of body — prevents duplicate ingestion
  chunk_count   integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists insight_documents_category_idx on public.insight_documents (category);
create index if not exists insight_documents_tags_gin     on public.insight_documents using gin (tags);

-- ── insight_chunks: per-chunk content + embedding ────────────────────────
create table if not exists public.insight_chunks (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.insight_documents(id) on delete cascade,
  chunk_index  integer not null,
  content      text not null,
  token_estimate integer,                              -- approx tokens (chars / 3 for ko, /4 for en)
  embedding    vector(1536),                           -- OpenAI text-embedding-3-small
  metadata     jsonb not null default '{}'::jsonb,     -- {summary, keywords, section, ...}
  created_at   timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists insight_chunks_document_idx on public.insight_chunks (document_id);

-- HNSW index for cosine similarity. HNSW > IVFFlat for our scale (<100k rows expected).
-- Build params: m=16, ef_construction=64 (pgvector defaults — proven balance).
create index if not exists insight_chunks_embedding_hnsw
  on public.insight_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- ── triggers ─────────────────────────────────────────────────────────────
create or replace function insight_documents_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists insight_documents_set_updated on public.insight_documents;

create trigger insight_documents_set_updated
  before update on public.insight_documents
  for each row execute function insight_documents_touch_updated_at();

-- Maintain chunk_count on insight_documents when chunks are added/removed.
create or replace function insight_chunks_sync_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.insight_documents
       set chunk_count = chunk_count + 1
     where id = new.document_id;
  elsif (tg_op = 'DELETE') then
    update public.insight_documents
       set chunk_count = greatest(chunk_count - 1, 0)
     where id = old.document_id;
  end if;
  return null;
end;
$$;

drop trigger if exists insight_chunks_count_sync on public.insight_chunks;

create trigger insight_chunks_count_sync
  after insert or delete on public.insight_chunks
  for each row execute function insight_chunks_sync_count();

-- ── RPC: vector similarity search ────────────────────────────────────────
-- Cosine similarity (1 - cosine distance). Optional filters on category/tags.
-- IMPORTANT: When filtering by category/tags, we widen the candidate pool first
-- (HNSW + WHERE filter can return fewer than `match_count` rows otherwise).
create or replace function public.match_insight_chunks(
  query_embedding vector(1536),
  match_count     int default 6,
  min_similarity  float default 0.5,
  filter_category text default null,
  filter_tags     text[] default null
)
returns table (
  chunk_id    uuid,
  document_id uuid,
  chunk_index integer,
  content     text,
  similarity  float,
  doc_title   text,
  doc_source_name text,
  doc_source_url  text,
  doc_category    text,
  doc_tags        text[]
)
language sql stable as $$
  select
    c.id            as chunk_id,
    c.document_id,
    c.chunk_index,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity,
    d.title         as doc_title,
    d.source_name   as doc_source_name,
    d.source_url    as doc_source_url,
    d.category      as doc_category,
    d.tags          as doc_tags
  from public.insight_chunks c
  join public.insight_documents d on d.id = c.document_id
  where c.embedding is not null
    and (filter_category is null or d.category = filter_category)
    and (filter_tags is null or d.tags && filter_tags)
    and (1 - (c.embedding <=> query_embedding)) >= min_similarity
  order by c.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

-- ── comments ─────────────────────────────────────────────────────────────
comment on table public.insight_documents is
  'RAG insight knowledge base: 고품질 비즈니스 아티클/인사이트 메타데이터. 청크는 insight_chunks.';
comment on table public.insight_chunks is
  '비즈니스 인사이트 청크 + 1536-d OpenAI 임베딩. HNSW 인덱스로 코사인 유사도 검색.';
comment on column public.insight_chunks.embedding is 'OpenAI text-embedding-3-small (1536 dimensions, cosine)';
comment on function public.match_insight_chunks is
  '쿼리 임베딩으로 인사이트 청크 검색. 카테고리·태그 필터 지원. similarity = 1 - cosine_distance.';

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.insight_documents enable row level security;
alter table public.insight_chunks    enable row level security;

drop policy if exists "anyone authenticated reads insight_documents" on public.insight_documents;

create policy "anyone authenticated reads insight_documents"
  on public.insight_documents for select
  using (auth.role() in ('authenticated', 'service_role'));

drop policy if exists "anyone authenticated reads insight_chunks" on public.insight_chunks;

create policy "anyone authenticated reads insight_chunks"
  on public.insight_chunks for select
  using (auth.role() in ('authenticated', 'service_role'));

drop policy if exists "service role writes insight_documents" on public.insight_documents;

create policy "service role writes insight_documents"
  on public.insight_documents for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service role writes insight_chunks" on public.insight_chunks;

create policy "service role writes insight_chunks"
  on public.insight_chunks for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Grants — match the pattern used by other migrations in this project.
grant select on public.insight_documents to authenticated, anon;
grant select on public.insight_chunks    to authenticated, anon;
grant execute on function public.match_insight_chunks to authenticated, anon, service_role;

-- ━━━ 20260505_saas_metrics.sql ━━━
-- SaaS metrics: GA4 + Custom Webhook 으로 자동 수집한 스타트업 사용자 지표.
--
-- 목적: 스타트업 업종 사장님이 자기 제품의 DAU/WAU/MAU/signup/churn 을
--       build.up 대시보드에서 자동으로 보게 함.
--
-- 패턴: portone_connections (envelope encryption) 미러.
--   * encrypted_secret + DEK + KEK 회전 가능
--   * RLS: 본인 select 만, write 는 service_role
--   * updated_at 트리거: portone_set_updated_at() 재사용
--
-- 채널 (source):
--   - 'ga4'      : Google Analytics 4 Data API (OAuth)
--   - 'webhook'  : 사장님 백엔드가 직접 POST (custom integration)
--   - 'amplitude': (Phase 2) Amplitude Dashboard REST API
--   - 'mixpanel' : (Phase 2) Mixpanel Query API
--   - 'posthog'  : (Phase 2) PostHog Project API
--   - 'manual'   : 사장님 직접 입력 (안전망)

-- ─────────────────────────────────────────────────────────────────
-- 1. SaaS metrics 연결 (소스별)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.saas_metrics_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('ga4', 'webhook', 'amplitude', 'mixpanel', 'posthog', 'manual')),

  -- GA4 OAuth: refresh token 봉투 암호화. webhook/manual 은 null.
  encrypted_secret text,
  secret_iv text,
  secret_auth_tag text,
  encrypted_dek text,
  dek_iv text,
  dek_auth_tag text,
  kek_version int,

  -- GA4: 사장님이 선택한 GA4 property id ("properties/123456789")
  property_id text,
  property_label text,                              -- 사용자 표시용 ("My Startup — example.com")

  -- webhook: 검증용 비밀 토큰 (해시) — 사장님이 X-Webhook-Token 헤더로 보냄
  webhook_token_hash text,

  -- 공통
  status text not null default 'active'
    check (status in ('active', 'invalid', 'revoked')),
  last_sync_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, source)
);
create index if not exists idx_saas_metrics_conn_user on public.saas_metrics_connections(user_id);
create index if not exists idx_saas_metrics_conn_status on public.saas_metrics_connections(user_id, status)
  where status = 'active';

-- ─────────────────────────────────────────────────────────────────
-- 2. 일별 SaaS 지표 (소스별 row)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.saas_metrics_daily (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('ga4', 'webhook', 'amplitude', 'mixpanel', 'posthog', 'manual')),
  date date not null,                               -- KST 기준 YYYY-MM-DD

  -- 핵심 지표 (모두 nullable — 소스가 제공하는 것만 채움)
  active_users int,                                 -- DAU (그날의 활성 사용자)
  weekly_active_users int,                          -- WAU
  monthly_active_users int,                         -- MAU
  new_users int,                                    -- 그날의 신규 가입자
  signups int,                                      -- 그날의 결제전환/유료가입 (별도 추적 시)
  churns int,                                       -- 그날의 이탈
  cumulative_users int,                             -- 누적 사용자 수 (스냅샷)

  -- 추가 메타 (GA4 raw, webhook payload 등)
  raw jsonb,
  synced_at timestamptz not null default now(),

  unique (user_id, source, date)
);
create index if not exists idx_saas_metrics_daily_user_date on public.saas_metrics_daily(user_id, date desc);
create index if not exists idx_saas_metrics_daily_source on public.saas_metrics_daily(user_id, source, date desc);

-- ─────────────────────────────────────────────────────────────────
-- 3. 통합 일별 지표 view — 소스 우선순위 머지
--    우선순위: ga4 > amplitude > mixpanel > posthog > webhook > manual
--    (실데이터 소스 우선, 자기보고는 fallback)
-- ─────────────────────────────────────────────────────────────────
create or replace view public.v_saas_metrics_unified as
  select distinct on (user_id, date)
    user_id,
    date,
    source,
    active_users,
    weekly_active_users,
    monthly_active_users,
    new_users,
    signups,
    churns,
    cumulative_users
  from public.saas_metrics_daily
  order by
    user_id,
    date,
    case source
      when 'ga4' then 1
      when 'amplitude' then 2
      when 'mixpanel' then 3
      when 'posthog' then 4
      when 'webhook' then 5
      when 'manual' then 6
      else 99
    end;

comment on view public.v_saas_metrics_unified is
  '여러 채널의 일별 SaaS 지표를 user_id+date 단위로 1줄로 머지. 소스 우선순위 적용.';

-- ─────────────────────────────────────────────────────────────────
-- 4. RLS — 본인만 select, write 는 service_role 만
-- ─────────────────────────────────────────────────────────────────
alter table public.saas_metrics_connections enable row level security;
alter table public.saas_metrics_daily enable row level security;

drop policy if exists "saas_metrics_conn_select_own" on public.saas_metrics_connections;

create policy "saas_metrics_conn_select_own" on public.saas_metrics_connections
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "saas_metrics_daily_select_own" on public.saas_metrics_daily;
create policy "saas_metrics_daily_select_own" on public.saas_metrics_daily
  for select to authenticated using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- 5. updated_at 트리거 (포트원에서 정의된 함수 재사용)
-- ─────────────────────────────────────────────────────────────────
drop trigger if exists trg_saas_metrics_conn_updated_at on public.saas_metrics_connections;
drop trigger if exists trg_saas_metrics_conn_updated_at on public.saas_metrics_connections;
create trigger trg_saas_metrics_conn_updated_at
  before update on public.saas_metrics_connections
  for each row execute function public.portone_set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- 6. Comments
-- ─────────────────────────────────────────────────────────────────
comment on table public.saas_metrics_connections is
  '스타트업 업종 사장님의 SaaS 사용자 지표 채널 연결 (GA4 OAuth, Webhook, Amplitude 등).';
comment on table public.saas_metrics_daily is
  '일별 SaaS 사용자 지표 — 소스별 raw row. v_saas_metrics_unified 가 우선순위 머지.';
comment on column public.saas_metrics_connections.encrypted_secret is
  'GA4 OAuth refresh token (봉투 암호화). webhook/manual 은 null.';
comment on column public.saas_metrics_connections.webhook_token_hash is
  'webhook 채널: 사장님이 X-Webhook-Token 헤더로 보낸 값 검증용 SHA-256 해시.';
