create extension if not exists "pgcrypto";

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  industry_category_id text,
  sub_industry_id text,
  startup_type text,
  business_model_id text,
  capital bigint,
  loan_intent text,
  monthly_fixed_cost_limit bigint,
  target_open_date date,
  preferred_regions text[] default '{}',
  target_customer_types text[] default '{}',
  location_priorities text[] default '{}',
  has_store boolean,
  employee_plan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id text not null,
  current_stage_code text not null,
  progress_percent integer not null default 0,
  status text not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stage_decisions (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  stage_code text not null,
  selected_primary_option_id text,
  selected_option_ids text[] default '{}',
  inputs jsonb default '{}'::jsonb,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (roadmap_id, stage_code)
);

create table if not exists public.stage_tasks (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  stage_code text not null,
  task_code text not null,
  title text not null,
  status text not null default 'todo',
  required boolean not null default true,
  estimated_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (roadmap_id, task_code)
);

create index if not exists idx_roadmaps_user_id on public.roadmaps(user_id);
create index if not exists idx_stage_decisions_roadmap_id on public.stage_decisions(roadmap_id);
create index if not exists idx_stage_tasks_roadmap_id on public.stage_tasks(roadmap_id);

alter table public.business_profiles enable row level security;
alter table public.roadmaps enable row level security;
alter table public.stage_decisions enable row level security;
alter table public.stage_tasks enable row level security;

create policy "business_profiles_select_own"
on public.business_profiles
for select
using (auth.uid() = user_id);

create policy "business_profiles_insert_own"
on public.business_profiles
for insert
with check (auth.uid() = user_id);

create policy "business_profiles_update_own"
on public.business_profiles
for update
using (auth.uid() = user_id);

create policy "roadmaps_select_own"
on public.roadmaps
for select
using (auth.uid() = user_id);

create policy "roadmaps_insert_own"
on public.roadmaps
for insert
with check (auth.uid() = user_id);

create policy "roadmaps_update_own"
on public.roadmaps
for update
using (auth.uid() = user_id);

create policy "stage_decisions_select_own"
on public.stage_decisions
for select
using (
  exists (
    select 1
    from public.roadmaps
    where public.roadmaps.id = stage_decisions.roadmap_id
      and public.roadmaps.user_id = auth.uid()
  )
);

create policy "stage_decisions_insert_own"
on public.stage_decisions
for insert
with check (
  exists (
    select 1
    from public.roadmaps
    where public.roadmaps.id = stage_decisions.roadmap_id
      and public.roadmaps.user_id = auth.uid()
  )
);

create policy "stage_decisions_update_own"
on public.stage_decisions
for update
using (
  exists (
    select 1
    from public.roadmaps
    where public.roadmaps.id = stage_decisions.roadmap_id
      and public.roadmaps.user_id = auth.uid()
  )
);

create policy "stage_tasks_select_own"
on public.stage_tasks
for select
using (
  exists (
    select 1
    from public.roadmaps
    where public.roadmaps.id = stage_tasks.roadmap_id
      and public.roadmaps.user_id = auth.uid()
  )
);

create policy "stage_tasks_insert_own"
on public.stage_tasks
for insert
with check (
  exists (
    select 1
    from public.roadmaps
    where public.roadmaps.id = stage_tasks.roadmap_id
      and public.roadmaps.user_id = auth.uid()
  )
);

create policy "stage_tasks_update_own"
on public.stage_tasks
for update
using (
  exists (
    select 1
    from public.roadmaps
    where public.roadmaps.id = stage_tasks.roadmap_id
      and public.roadmaps.user_id = auth.uid()
  )
);
