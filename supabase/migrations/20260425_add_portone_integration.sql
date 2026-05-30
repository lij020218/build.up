-- 포트원(PortOne) 매출 자동 동기화 통합
-- 사장님이 자기 PG (포트원 V2) Secret 을 Found.One 에 read-only 로 연결 → 매출 자동 가져오기.
--
-- 보안 원칙:
--   1. PG Secret 은 봉투 암호화(AES-256-GCM + per-user DEK + KEK from env) 로만 저장.
--      → 평문 컬럼 일체 없음.
--   2. RLS 로 사장님 본인 데이터만 select.
--   3. service_role 만 insert/update/delete.

-- ─── 1. 연결 정보 (사장님이 등록한 PG Secret 봉투) ───
create table if not exists public.portone_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id text,                                  -- 포트원 storeId (멀티스토어인 경우)
  -- 봉투 암호화: encrypted_secret (DEK 로 암호화) + encrypted_dek (KEK 로 암호화)
  encrypted_secret text not null,
  secret_iv text not null,
  secret_auth_tag text not null,
  encrypted_dek text not null,
  dek_iv text not null,
  dek_auth_tag text not null,
  kek_version int not null default 1,
  -- 마스킹된 Secret 미리보기 (UI 표시용, 평문 X)
  secret_mask text,
  -- 상태
  status text not null default 'active' check (status in ('active', 'invalid', 'revoked')),
  last_validated_at timestamptz,
  last_sync_at timestamptz,
  last_sync_error text,
  -- 메타
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 한 사장님 = 한 활성 연결 (PoC 단계)
  unique (user_id)
);

create index if not exists idx_portone_connections_user on public.portone_connections(user_id);
create index if not exists idx_portone_connections_status on public.portone_connections(status) where status = 'active';

-- ─── 2. 동기화된 결제 이력 ───
create table if not exists public.portone_payments (
  -- 포트원 발급 ID (전역 고유)
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_id text not null,                       -- 가맹점 주문번호 (사장님 시스템 기준)
  transaction_id text,
  status text not null,                           -- READY|PAID|CANCELLED|...
  amount_total bigint not null,                   -- 원 단위 정수
  amount_tax_free bigint default 0,
  amount_vat bigint default 0,
  currency text not null default 'KRW',
  customer_id text,
  customer_email text,
  paid_at timestamptz,
  cancelled_at timestamptz,
  pg_provider text,                               -- 카카오페이·토스·이니시스 등
  method_type text,                               -- card|easypay|virtualaccount|transfer
  -- 원본 응답 전체 보관 — 포트원 스키마 변경 대비
  raw jsonb not null,
  synced_at timestamptz not null default now(),
  -- 한 사장님 안에서 paymentId 는 unique 가정 (가맹점 주문번호)
  unique (user_id, payment_id)
);

create index if not exists idx_portone_payments_user_paid on public.portone_payments(user_id, paid_at desc);
create index if not exists idx_portone_payments_user_status on public.portone_payments(user_id, status);

-- ─── 3. Webhook 멱등성 로그 ───
create table if not exists public.portone_webhook_log (
  webhook_id text primary key,                    -- 포트원 webhook-id 헤더 (Standard Webhooks)
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,                       -- Transaction.Paid 등
  payment_id text,                                -- data.paymentId
  received_at timestamptz not null default now()
);

create index if not exists idx_portone_webhook_log_user on public.portone_webhook_log(user_id, received_at desc);

-- ─── 4. RLS ───
alter table public.portone_connections enable row level security;
alter table public.portone_payments enable row level security;
alter table public.portone_webhook_log enable row level security;

-- 사장님 본인 데이터만 select
create policy "portone_connections_select_own"
  on public.portone_connections for select
  to authenticated
  using (auth.uid() = user_id);

create policy "portone_payments_select_own"
  on public.portone_payments for select
  to authenticated
  using (auth.uid() = user_id);

create policy "portone_webhook_log_select_own"
  on public.portone_webhook_log for select
  to authenticated
  using (auth.uid() = user_id);

-- insert/update/delete 는 service_role 만 (API 서버에서 처리)
-- (별도 policy 안 만들면 RLS 가 기본 차단)

-- ─── 5. 자동 updated_at 트리거 ───
create or replace function public.portone_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_portone_connections_updated_at on public.portone_connections;
create trigger trg_portone_connections_updated_at
  before update on public.portone_connections
  for each row execute function public.portone_set_updated_at();

-- ─── 6. 코멘트 (감사·문서화) ───
comment on table public.portone_connections is
  '포트원 V2 API Secret (봉투 암호화 보관). 사장님 1인당 1건 활성. 평문 Secret 없음.';
comment on column public.portone_connections.encrypted_secret is
  'AES-256-GCM(DEK, plaintext_secret). DEK 자체는 encrypted_dek 컬럼에 KEK 로 암호화 저장.';
comment on column public.portone_connections.kek_version is
  'KEK 회전 추적. 환경변수 PORTONE_KEK_BASE64 (v1) / PORTONE_KEK_BASE64_V2 형식.';
comment on table public.portone_payments is
  '포트원에서 동기화된 결제 이력. raw 컬럼에 원본 보관.';
comment on table public.portone_webhook_log is
  'Webhook 멱등성 — 같은 webhook-id 재수신 시 중복 처리 방지.';
