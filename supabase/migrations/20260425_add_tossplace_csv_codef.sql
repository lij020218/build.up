-- TOSS Place + CSV upload + CODEF 통합 (PortOne 어댑터 다음 단계).
--
-- 같은 봉투 암호화 패턴 + RLS + service_role write 패턴.
--
-- ─────────────────────────────────────────────────────────────────
-- 1. TOSS Place 연결 (Access Key + Secret 봉투 암호화)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.tossplace_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant_id text not null,                       -- 사장님 매장 ID
  -- Access Key (마스킹된 전체값) + Secret (봉투 암호화)
  access_key text not null,
  encrypted_secret text not null,
  secret_iv text not null,
  secret_auth_tag text not null,
  encrypted_dek text not null,
  dek_iv text not null,
  dek_auth_tag text not null,
  kek_version int not null default 1,
  status text not null default 'active' check (status in ('active', 'invalid', 'revoked')),
  last_validated_at timestamptz,
  last_sync_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);
create index if not exists idx_tossplace_conn_user on public.tossplace_connections(user_id);
create index if not exists idx_tossplace_conn_status on public.tossplace_connections(status) where status = 'active';

-- TOSS Place 결제 이력 (정규화)
create table if not exists public.tossplace_payments (
  id text primary key,                              -- TOSS payment.paymentId
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id text not null,
  merchant_id text not null,
  amount bigint not null,
  vat bigint default 0,
  service_charge bigint default 0,
  approved_at timestamptz,
  cancelled_at timestamptz,
  approval_number text,
  method text not null,                             -- CARD|CASH|EASY_PAY|...
  card_brand text,
  card_type text,
  raw jsonb not null,
  synced_at timestamptz not null default now(),
  unique (user_id, id)
);
create index if not exists idx_tossplace_payments_user_approved on public.tossplace_payments(user_id, approved_at desc);

-- TOSS Place 주문 이력 (line items + 채널 분석용)
create table if not exists public.tossplace_orders (
  id text primary key,                              -- TOSS order.orderId
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant_id text not null,
  status text not null,                             -- REQUESTED|OPENED|COMPLETED|CANCELLED
  channel text,                                     -- OFFLINE|DELIVERY|TAKE_OUT|PICKUP
  total_amount bigint not null,
  tax_free_amount bigint default 0,
  vat bigint default 0,
  service_charge bigint default 0,
  discount bigint default 0,
  requested_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  raw jsonb not null,
  synced_at timestamptz not null default now()
);
create index if not exists idx_tossplace_orders_user_completed on public.tossplace_orders(user_id, completed_at desc);
create index if not exists idx_tossplace_orders_user_channel on public.tossplace_orders(user_id, channel);

-- ─────────────────────────────────────────────────────────────────
-- 2. CSV 업로드 매출 (모든 사장님 fallback)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.csv_revenue_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  source_label text,                                -- 사장님이 입력한 출처 ("스마트스토어 매출", "엑셀 정리" 등)
  row_count int not null default 0,
  total_amount bigint not null default 0,
  uploaded_at timestamptz not null default now()
);
create index if not exists idx_csv_uploads_user on public.csv_revenue_uploads(user_id, uploaded_at desc);

create table if not exists public.csv_revenue_entries (
  id bigserial primary key,
  upload_id uuid not null references public.csv_revenue_uploads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,                               -- KST
  amount bigint not null,
  customer_count int default 0,
  description text,
  raw jsonb,
  unique (user_id, upload_id, date)                 -- 같은 업로드 내 같은 날짜 중복 방지
);
create index if not exists idx_csv_entries_user_date on public.csv_revenue_entries(user_id, date desc);

-- ─────────────────────────────────────────────────────────────────
-- 3. CODEF (여신금융협회 매통조 위임 자동화 중계)
-- ─────────────────────────────────────────────────────────────────
-- 사장님이 사업자번호 + 대표자생년월일 + 카드사 입금계좌 입력 →
-- CODEF 가 사장님 명의로 여신협회 통합조회 회원가입 자동 + 매출 fetch
create table if not exists public.codef_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 사장님 위임 정보 (마스킹 보관)
  business_number_mask text not null,               -- 사업자번호 마스킹 ("123-**-**678")
  business_name text,
  -- CODEF connectedId — 사장님별 CODEF 인증 토큰 (봉투 암호화)
  encrypted_connected_id text not null,
  cid_iv text not null,
  cid_auth_tag text not null,
  encrypted_dek text not null,
  dek_iv text not null,
  dek_auth_tag text not null,
  kek_version int not null default 1,
  status text not null default 'pending' check (status in ('pending', 'active', 'invalid', 'revoked')),
  last_sync_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);
create index if not exists idx_codef_conn_user on public.codef_connections(user_id);

-- 카드사별 매출 (CODEF 매입/입금/승인 통합)
create table if not exists public.codef_card_sales (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  card_company text not null,                       -- KB|신한|삼성|현대|롯데|BC|NH|하나|우리|시티
  -- 거래 단건
  approval_number text,
  approved_at timestamptz,
  amount bigint not null,
  vat bigint default 0,
  service_charge bigint default 0,
  card_brand text,
  installment_months int default 0,
  status text default 'approved',                   -- approved|cancelled
  raw jsonb,
  synced_at timestamptz not null default now(),
  unique (user_id, card_company, approval_number)
);
create index if not exists idx_codef_sales_user_approved on public.codef_card_sales(user_id, approved_at desc);
create index if not exists idx_codef_sales_user_company on public.codef_card_sales(user_id, card_company);

-- ─────────────────────────────────────────────────────────────────
-- 4. RLS — 사장님 본인만 select, service_role 만 write
-- ─────────────────────────────────────────────────────────────────
alter table public.tossplace_connections enable row level security;
alter table public.tossplace_payments enable row level security;
alter table public.tossplace_orders enable row level security;
alter table public.csv_revenue_uploads enable row level security;
alter table public.csv_revenue_entries enable row level security;
alter table public.codef_connections enable row level security;
alter table public.codef_card_sales enable row level security;

create policy "tossplace_conn_select_own" on public.tossplace_connections for select to authenticated using (auth.uid() = user_id);
create policy "tossplace_pay_select_own" on public.tossplace_payments for select to authenticated using (auth.uid() = user_id);
create policy "tossplace_order_select_own" on public.tossplace_orders for select to authenticated using (auth.uid() = user_id);
create policy "csv_uploads_select_own" on public.csv_revenue_uploads for select to authenticated using (auth.uid() = user_id);
create policy "csv_entries_select_own" on public.csv_revenue_entries for select to authenticated using (auth.uid() = user_id);
create policy "codef_conn_select_own" on public.codef_connections for select to authenticated using (auth.uid() = user_id);
create policy "codef_sales_select_own" on public.codef_card_sales for select to authenticated using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- 5. updated_at 트리거 (재사용)
-- ─────────────────────────────────────────────────────────────────
drop trigger if exists trg_tossplace_conn_updated_at on public.tossplace_connections;
create trigger trg_tossplace_conn_updated_at
  before update on public.tossplace_connections
  for each row execute function public.portone_set_updated_at();

drop trigger if exists trg_codef_conn_updated_at on public.codef_connections;
create trigger trg_codef_conn_updated_at
  before update on public.codef_connections
  for each row execute function public.portone_set_updated_at();

-- 코멘트
comment on table public.tossplace_connections is
  'TOSS Place Open API 연결 (사장님 매장 Access Key + Secret 봉투 암호화).';
comment on table public.csv_revenue_entries is
  'CSV 업로드 매출 (모든 사장님 fallback — PG/POS 없는 경우).';
comment on table public.codef_connections is
  'CODEF 위임 인증 (여신금융협회 매통조 자동화). 봉투 암호화.';
comment on table public.codef_card_sales is
  'CODEF 통해 가져온 카드사별 매출 (10개 카드사 통합).';
