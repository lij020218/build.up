-- GA4 OAuth state nonce 관리 테이블 — replay attack 방어.
-- OAuth flow: start(nonce 발급+저장) → callback(nonce 소비 = consumed_at 설정).
-- consumed_at IS NOT NULL 인 nonce 재사용 시 거부.
-- expires_at 기준 1시간 이상 지난 row는 자동 정리(periodic cleanup 또는 cron).

create table if not exists ga4_oauth_nonces (
  nonce         text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '1 hour'),
  consumed_at   timestamptz          -- null = 미사용, NOT NULL = 소비됨
);

-- user_id 인덱스 — 특정 사용자의 모든 미만료 nonce 조회
create index if not exists ga4_oauth_nonces_user_id_idx on ga4_oauth_nonces(user_id);

-- 만료 행 자동 정리를 위한 인덱스
create index if not exists ga4_oauth_nonces_expires_at_idx on ga4_oauth_nonces(expires_at);

-- RLS: 행 직접 접근 불가 (service_role 전용)
alter table ga4_oauth_nonces enable row level security;

-- 만료 nonce 자동 제거 (Supabase pg_cron 또는 별도 cron job 에서 호출)
create or replace function cleanup_ga4_oauth_nonces() returns void
  language plpgsql security definer as $$
begin
  delete from ga4_oauth_nonces where expires_at < now() - interval '1 hour';
end;
$$;
