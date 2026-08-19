-- ═══════════════════════════════════════════════════════════════════════
-- 계정 삭제 컴플라이언스 (2026-08-19)
--
-- 왜: 계정 삭제 검토 결과 3가지 법·심사 공백.
--   ① 근로기록(근태·근무표·연차·수당·급여확인·급여문의·근로자명부)이 auth.users
--      ON DELETE CASCADE 로 통째 소멸 → 근로기준법 §42 3년 보존 의무(사장의 의무)를
--      우리가 깨뜨림. 직원 1명이 탈퇴해도 사장의 그 직원 임금대장이 사라짐.
--      → 삭제 직전 **분리 보관 아카이브**(auth FK 없음, 직원은 해시+이름 스냅샷)로 복사,
--        retain_until(+3년) 지나면 자동 파기 (개인정보 보호법 §21 표준지침 분리 보관 방식).
--   ② Sign in with Apple 사용자는 삭제 시 Apple REST API revoke 필수(App Store 5.1.1(v)).
--      revoke 에는 가입 시 authorizationCode 를 교환한 refresh_token 이 필요 → 저장 테이블.
--   ③ (코드) Storage 버킷 파일 삭제 — SQL 아님, /api/account/delete 에서 처리.
-- ═══════════════════════════════════════════════════════════════════════

-- ── ① 근로기록 분리 보관 아카이브 ────────────────────────────────────────
create table if not exists public.labor_records_archive (
  id             uuid primary key default gen_random_uuid(),
  -- 사장이 살아 있으면(직원만 탈퇴) 본인 아카이브를 볼 수 있게 owner uuid 는 유지 (FK 없음 — 사장 탈퇴 후에도 행 보존)
  owner_user_id  uuid,
  owner_ref      text not null,                 -- sha256(owner uuid) — 사장 탈퇴 후 식별용
  member_ref     text,                          -- sha256(member uuid) — 직원 가명 식별자
  member_name    text,                          -- 근로자명부 요건: 성명 스냅샷 (user_profiles)
  source_table   text not null,                 -- attendance_records | staff_schedules | leave_requests | allowance_requests | payroll_confirmations | payroll_inquiries | store_members
  record_date    date,                          -- work_date / start_date / period 시작
  payload        jsonb not null,                -- 원본 행 (user id 컬럼 제거)
  archived_at    timestamptz not null default now(),
  archived_reason text not null,                -- owner-deleted | member-deleted
  retain_until   timestamptz not null           -- 근로기준법 §42: 3년
);
create index if not exists labor_records_archive_owner_idx on public.labor_records_archive(owner_user_id);
create index if not exists labor_records_archive_retain_idx on public.labor_records_archive(retain_until);

alter table public.labor_records_archive enable row level security;
-- 사장 본인 아카이브만 열람 (쓰기는 service role 전용)
drop policy if exists labor_archive_owner_select on public.labor_records_archive;
create policy labor_archive_owner_select on public.labor_records_archive
  for select using (owner_user_id = auth.uid());

-- 삭제 직전 호출: p_user 가 사장이거나 직원인 모든 근로기록을 아카이브. 반환 = 복사 행 수.
create or replace function public.archive_labor_records(p_user uuid, p_reason text)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_count integer := 0;
  v_retain timestamptz := now() + interval '3 years';
begin
  -- 근로자명부 (store_members + 성명)
  insert into labor_records_archive (owner_user_id, owner_ref, member_ref, member_name, source_table, record_date, payload, archived_reason, retain_until)
  select m.owner_user_id, encode(digest(m.owner_user_id::text, 'sha256'), 'hex'),
         encode(digest(m.member_user_id::text, 'sha256'), 'hex'),
         nullif(trim(concat_ws('', p.last_name, p.first_name)), ''),
         'store_members', coalesce(m.hire_date, m.joined_at::date),
         to_jsonb(m) - 'owner_user_id' - 'member_user_id', p_reason, v_retain
  from store_members m left join user_profiles p on p.user_id = m.member_user_id
  where m.owner_user_id = p_user or m.member_user_id = p_user;
  get diagnostics v_count = row_count;

  insert into labor_records_archive (owner_user_id, owner_ref, member_ref, member_name, source_table, record_date, payload, archived_reason, retain_until)
  select r.owner_user_id, encode(digest(r.owner_user_id::text, 'sha256'), 'hex'),
         encode(digest(r.member_user_id::text, 'sha256'), 'hex'),
         nullif(trim(concat_ws('', p.last_name, p.first_name)), ''),
         'attendance_records', r.work_date, to_jsonb(r) - 'owner_user_id' - 'member_user_id', p_reason, v_retain
  from attendance_records r left join user_profiles p on p.user_id = r.member_user_id
  where r.owner_user_id = p_user or r.member_user_id = p_user;
  v_count := v_count + (select count(*) from attendance_records where owner_user_id = p_user or member_user_id = p_user);

  insert into labor_records_archive (owner_user_id, owner_ref, member_ref, member_name, source_table, record_date, payload, archived_reason, retain_until)
  select r.owner_user_id, encode(digest(r.owner_user_id::text, 'sha256'), 'hex'),
         encode(digest(r.member_user_id::text, 'sha256'), 'hex'),
         nullif(trim(concat_ws('', p.last_name, p.first_name)), ''),
         'staff_schedules', r.work_date, to_jsonb(r) - 'owner_user_id' - 'member_user_id', p_reason, v_retain
  from staff_schedules r left join user_profiles p on p.user_id = r.member_user_id
  where r.owner_user_id = p_user or r.member_user_id = p_user;
  v_count := v_count + (select count(*) from staff_schedules where owner_user_id = p_user or member_user_id = p_user);

  insert into labor_records_archive (owner_user_id, owner_ref, member_ref, member_name, source_table, record_date, payload, archived_reason, retain_until)
  select r.owner_user_id, encode(digest(r.owner_user_id::text, 'sha256'), 'hex'),
         encode(digest(r.member_user_id::text, 'sha256'), 'hex'),
         nullif(trim(concat_ws('', p.last_name, p.first_name)), ''),
         'leave_requests', r.start_date, to_jsonb(r) - 'owner_user_id' - 'member_user_id', p_reason, v_retain
  from leave_requests r left join user_profiles p on p.user_id = r.member_user_id
  where r.owner_user_id = p_user or r.member_user_id = p_user;
  v_count := v_count + (select count(*) from leave_requests where owner_user_id = p_user or member_user_id = p_user);

  insert into labor_records_archive (owner_user_id, owner_ref, member_ref, member_name, source_table, record_date, payload, archived_reason, retain_until)
  select r.owner_user_id, encode(digest(r.owner_user_id::text, 'sha256'), 'hex'),
         encode(digest(r.member_user_id::text, 'sha256'), 'hex'),
         nullif(trim(concat_ws('', p.last_name, p.first_name)), ''),
         'allowance_requests', r.work_date, to_jsonb(r) - 'owner_user_id' - 'member_user_id', p_reason, v_retain
  from allowance_requests r left join user_profiles p on p.user_id = r.member_user_id
  where r.owner_user_id = p_user or r.member_user_id = p_user;
  v_count := v_count + (select count(*) from allowance_requests where owner_user_id = p_user or member_user_id = p_user);

  -- payroll_confirmations 는 사장 단위(직원 컬럼 없음) — 사장 삭제 시에만 아카이브
  insert into labor_records_archive (owner_user_id, owner_ref, member_ref, member_name, source_table, record_date, payload, archived_reason, retain_until)
  select r.owner_user_id, encode(digest(r.owner_user_id::text, 'sha256'), 'hex'),
         null, null,
         'payroll_confirmations', to_date(r.period || '-01', 'YYYY-MM-DD'), to_jsonb(r) - 'owner_user_id', p_reason, v_retain
  from payroll_confirmations r
  where r.owner_user_id = p_user;
  v_count := v_count + (select count(*) from payroll_confirmations where owner_user_id = p_user);

  insert into labor_records_archive (owner_user_id, owner_ref, member_ref, member_name, source_table, record_date, payload, archived_reason, retain_until)
  select r.owner_user_id, encode(digest(r.owner_user_id::text, 'sha256'), 'hex'),
         encode(digest(r.member_user_id::text, 'sha256'), 'hex'),
         nullif(trim(concat_ws('', p.last_name, p.first_name)), ''),
         'payroll_inquiries', to_date(r.period || '-01', 'YYYY-MM-DD'), to_jsonb(r) - 'owner_user_id' - 'member_user_id', p_reason, v_retain
  from payroll_inquiries r left join user_profiles p on p.user_id = r.member_user_id
  where r.owner_user_id = p_user or r.member_user_id = p_user;
  v_count := v_count + (select count(*) from payroll_inquiries where owner_user_id = p_user or member_user_id = p_user);

  return v_count;
end;
$$;
revoke all on function public.archive_labor_records(uuid, text) from public;
revoke all on function public.archive_labor_records(uuid, text) from anon, authenticated;
grant execute on function public.archive_labor_records(uuid, text) to service_role;

-- 보존기간 만료분 자동 파기 (개인정보 보호법 §21 — 지체 없이). pg_cron 이 있으면 매일 04:00 KST(19:00 UTC).
create or replace function public.purge_expired_labor_archive()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_count integer;
begin
  delete from labor_records_archive where retain_until < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.purge_expired_labor_archive() from public;
revoke all on function public.purge_expired_labor_archive() from anon, authenticated;
grant execute on function public.purge_expired_labor_archive() to service_role;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('purge-expired-labor-archive', '0 19 * * *', $c$select public.purge_expired_labor_archive()$c$);
  end if;
exception when others then
  raise notice 'pg_cron schedule skipped: %', sqlerrm;
end $$;

-- ── ② Sign in with Apple refresh token (revoke 용) ──────────────────────
-- service role 전용 (RLS on, 정책 없음). refresh_token 은 envelope 암호화(JSON) 저장.
create table if not exists public.apple_auth_tokens (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  refresh_token_enc  jsonb not null,
  apple_sub          text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
alter table public.apple_auth_tokens enable row level security;
revoke all on table public.apple_auth_tokens from anon, authenticated;
