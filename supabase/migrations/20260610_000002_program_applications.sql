-- 지원사업 신청 — 파운드원이 직접 운영하는 지원사업(예: 1차 창업지원금)의 앱 내부 신청 접수.
--   외부 폼 없이 사장님이 앱에서 "신청하기" → 현 사업체 스냅샷이 여기에 적재됨.
--   관리자는 /admin/applications 에서 열람(service_role 은 RLS 우회).
--
--   program_id : startup-programs.ts 의 프로그램 id (예: "foundone-startup-grant-1")
--   pitch      : 신청 시 작성한 사업 아이디어·열정 한두 줄 (선택)
--   snapshot   : 신청 시점 사업체 스냅샷 jsonb
--                { storeName, industryCategoryId, businessLaunched, businessLaunchedDate,
--                  monthlyAvgRevenue, hasUserSales, weeklySalesChangePct,
--                  recentCustomers, customerChangePct, employeesCount, ... }
--   status     : submitted | reviewing | shortlisted | rejected | selected

create table if not exists public.program_applications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  program_id  text not null,
  status      text not null default 'submitted',
  pitch       text,
  snapshot    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- 프로그램당 1명 1신청 — 재신청 시 upsert 로 갱신.
  unique (user_id, program_id)
);

create index if not exists idx_program_applications_program
  on public.program_applications(program_id, created_at desc);
create index if not exists idx_program_applications_user
  on public.program_applications(user_id);

alter table public.program_applications enable row level security;

-- 본인 신청만 작성/수정/조회 (service_role 은 RLS 우회 → 관리자가 전체 열람).
create policy "program_applications_self_insert"
  on public.program_applications for insert to authenticated
  with check (auth.uid() = user_id);

create policy "program_applications_self_update"
  on public.program_applications for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "program_applications_self_select"
  on public.program_applications for select to authenticated
  using (auth.uid() = user_id);
