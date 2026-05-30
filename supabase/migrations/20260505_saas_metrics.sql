-- SaaS metrics: GA4 + Custom Webhook 으로 자동 수집한 스타트업 사용자 지표.
--
-- 목적: 스타트업 업종 사장님이 자기 제품의 DAU/WAU/MAU/signup/churn 을
--       Found.One 대시보드에서 자동으로 보게 함.
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

create policy "saas_metrics_conn_select_own" on public.saas_metrics_connections
  for select to authenticated using (auth.uid() = user_id);
create policy "saas_metrics_daily_select_own" on public.saas_metrics_daily
  for select to authenticated using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- 5. updated_at 트리거 (포트원에서 정의된 함수 재사용)
-- ─────────────────────────────────────────────────────────────────
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
