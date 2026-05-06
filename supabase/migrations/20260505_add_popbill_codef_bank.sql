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

create policy "popbill_conn_select_own" on public.popbill_connections
  for select to authenticated using (auth.uid() = user_id);
create policy "popbill_jobs_select_own" on public.popbill_jobs
  for select to authenticated using (auth.uid() = user_id);
create policy "popbill_tax_select_own" on public.popbill_tax_invoices
  for select to authenticated using (auth.uid() = user_id);
create policy "popbill_cash_select_own" on public.popbill_cashbills
  for select to authenticated using (auth.uid() = user_id);
create policy "codef_bank_acc_select_own" on public.codef_bank_accounts
  for select to authenticated using (auth.uid() = user_id);
create policy "codef_bank_tx_select_own" on public.codef_bank_transactions
  for select to authenticated using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- 4. updated_at 트리거 (포트원에서 정의된 함수 재사용)
-- ─────────────────────────────────────────────────────────────────
drop trigger if exists trg_popbill_conn_updated_at on public.popbill_connections;
create trigger trg_popbill_conn_updated_at
  before update on public.popbill_connections
  for each row execute function public.portone_set_updated_at();

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
