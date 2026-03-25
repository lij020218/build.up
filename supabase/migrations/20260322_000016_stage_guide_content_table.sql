create table if not exists public.stage_guide_content (
  id uuid primary key default gen_random_uuid(),
  stage_code text not null,
  category_id text,
  locale text not null default 'ko',
  summary text not null,
  why_now text,
  steps jsonb not null default '[]'::jsonb,
  cost_range text,
  time_estimate text,
  warnings jsonb not null default '[]'::jsonb,
  ai_tools jsonb not null default '[]'::jsonb,
  expert_when text,
  expert_type text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- category_id IS NULL means applies to all categories (general)
create unique index if not exists idx_stage_guide_content_general_unique
  on public.stage_guide_content(stage_code, locale)
  where category_id is null;

create unique index if not exists idx_stage_guide_content_category_unique
  on public.stage_guide_content(stage_code, category_id, locale)
  where category_id is not null;

create index if not exists idx_stage_guide_content_stage_code
  on public.stage_guide_content(stage_code);

create index if not exists idx_stage_guide_content_category_id
  on public.stage_guide_content(category_id);

alter table public.stage_guide_content enable row level security;

create policy "stage_guide_content_select_public"
  on public.stage_guide_content
  for select
  using (is_active = true);

grant select on table public.stage_guide_content to anon;
grant select on table public.stage_guide_content to authenticated;
