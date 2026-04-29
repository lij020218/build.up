-- 구독제 결제 시스템 자동 연동 (Stripe / Toss Payments / 자체 webhook)
-- portone 패턴 답습: 봉투 암호화, per-user 라우팅, 멱등 로그.
--
-- 추가되는 것:
--   1. stripe_connections / toss_connections — 사장님별 API key + webhook secret
--   2. subscription_events — 모든 결제사 정규화 이벤트 (subscription.created, payment.succeeded, ...)
--   3. stripe_webhook_log / toss_webhook_log — 멱등성 (webhook id dedup)

-- ─── 1. Stripe 연결 (Secret Key 봉투 암호화 + Webhook Secret 봉투 암호화) ───
create table if not exists public.stripe_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- API Secret Key 봉투
  encrypted_secret text not null,
  secret_iv text not null,
  secret_auth_tag text not null,
  encrypted_dek text not null,
  dek_iv text not null,
  dek_auth_tag text not null,
  kek_version int not null default 1,
  secret_mask text,
  -- Webhook Secret (whsec_...) 봉투 — 시그니처 검증용 (선택)
  encrypted_webhook_secret text,
  webhook_secret_iv text,
  webhook_secret_auth_tag text,
  -- 상태
  status text not null default 'active' check (status in ('active', 'invalid', 'revoked')),
  account_id text,                                -- Stripe account id (acct_...)
  last_validated_at timestamptz,
  last_sync_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);
create index if not exists idx_stripe_connections_user on public.stripe_connections(user_id);

-- ─── 2. Toss Payments 연결 ───
create table if not exists public.toss_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Secret Key 봉투
  encrypted_secret text not null,
  secret_iv text not null,
  secret_auth_tag text not null,
  encrypted_dek text not null,
  dek_iv text not null,
  dek_auth_tag text not null,
  kek_version int not null default 1,
  secret_mask text,
  -- Webhook secret 봉투 (선택)
  encrypted_webhook_secret text,
  webhook_secret_iv text,
  webhook_secret_auth_tag text,
  status text not null default 'active' check (status in ('active', 'invalid', 'revoked')),
  client_key text,                                -- 공개 가능한 client key (mask 용)
  last_validated_at timestamptz,
  last_sync_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);
create index if not exists idx_toss_connections_user on public.toss_connections(user_id);

-- ─── 3. 정규화된 구독 이벤트 (모든 결제사 공통 스키마) ───
-- 결제사별 raw event 는 raw 컬럼에 저장. 분석용 비정규화 컬럼 별도.
create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 결제사: stripe / toss / portone / custom
  provider text not null check (provider in ('stripe', 'toss', 'portone', 'custom')),
  -- 정규화된 이벤트 종류
  event_type text not null check (event_type in (
    'subscription.created',
    'subscription.updated',
    'subscription.canceled',
    'payment.succeeded',
    'payment.failed',
    'refund.created'
  )),
  -- 결제사별 원본 식별자 (멱등성용)
  external_event_id text not null,
  external_customer_id text,
  external_subscription_id text,
  external_plan_id text,
  -- 비정규화 (대시보드 집계용)
  plan_name text,
  amount bigint default 0,                        -- 최소 단위 (원)
  currency text default 'KRW',
  occurred_at timestamptz not null,
  -- 원본 페이로드
  raw jsonb,
  created_at timestamptz not null default now(),
  -- 동일 (provider, external_event_id) 한 번만
  unique (provider, external_event_id)
);
create index if not exists idx_sub_events_user_time on public.subscription_events(user_id, occurred_at desc);
create index if not exists idx_sub_events_user_type on public.subscription_events(user_id, event_type);

-- ─── 4. Webhook 멱등 로그 (각 provider 별) ───
create table if not exists public.stripe_webhook_log (
  webhook_id text primary key,
  user_id uuid not null,
  event_type text,
  received_at timestamptz not null default now()
);
create index if not exists idx_stripe_webhook_log_user on public.stripe_webhook_log(user_id);

create table if not exists public.toss_webhook_log (
  webhook_id text primary key,
  user_id uuid not null,
  event_type text,
  received_at timestamptz not null default now()
);
create index if not exists idx_toss_webhook_log_user on public.toss_webhook_log(user_id);

-- ─── 5. RLS ───
alter table public.stripe_connections enable row level security;
alter table public.toss_connections enable row level security;
alter table public.subscription_events enable row level security;

-- 본인 행만 select. service_role 은 RLS 우회 (insert/update 는 webhook 처리에서만).
do $$ begin
  create policy stripe_connections_self_select on public.stripe_connections
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy toss_connections_self_select on public.toss_connections
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy subscription_events_self_select on public.subscription_events
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- 멱등 로그는 service_role 만 접근.
alter table public.stripe_webhook_log enable row level security;
alter table public.toss_webhook_log enable row level security;

-- ─── 6. Custom webhook (B2B SaaS 고객사 자체 결제/회원 시스템) ───
-- 발급 토큰의 해시만 저장 (평문 X). 토큰 발급 시 1회 평문 반환 후 폐기.
create table if not exists public.custom_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null,                       -- SHA-256(plaintext_token) hex
  token_mask text,                                 -- "bup_xxx...yyy" (앞4 + 뒤4)
  description text,                                -- 사용처 메모 (e.g. "Production server")
  status text not null default 'active' check (status in ('active', 'revoked')),
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  rotated_at timestamptz,
  unique (user_id)
);
create index if not exists idx_custom_connections_user on public.custom_connections(user_id);

alter table public.custom_connections enable row level security;
do $$ begin
  create policy custom_connections_self_select on public.custom_connections
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
