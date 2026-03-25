create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  item_key text not null unique,
  item_type text not null,
  domain text not null,
  title text not null,
  summary text,
  payload jsonb not null default '{}'::jsonb,
  freshness_status text not null default 'review_soon',
  last_checked_at timestamptz,
  next_review_at timestamptz,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_item_sources (
  id uuid primary key default gen_random_uuid(),
  knowledge_item_id uuid not null references public.knowledge_items(id) on delete cascade,
  source_name text not null,
  source_url text not null,
  verified_at timestamptz not null,
  expires_at timestamptz,
  confidence text not null default 'medium',
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_refresh_reviews (
  id uuid primary key default gen_random_uuid(),
  knowledge_item_id uuid not null references public.knowledge_items(id) on delete cascade,
  review_status text not null,
  review_method text not null default 'manual',
  summary text,
  reviewed_at timestamptz not null default now(),
  reviewer_user_id uuid references auth.users(id) on delete set null,
  snapshot jsonb not null default '{}'::jsonb
);

create index if not exists idx_knowledge_items_domain on public.knowledge_items(domain);
create index if not exists idx_knowledge_items_status on public.knowledge_items(freshness_status);
create index if not exists idx_knowledge_items_next_review on public.knowledge_items(next_review_at);
create index if not exists idx_knowledge_item_sources_item_id on public.knowledge_item_sources(knowledge_item_id);
create index if not exists idx_knowledge_refresh_reviews_item_id on public.knowledge_refresh_reviews(knowledge_item_id);

alter table public.knowledge_items enable row level security;
alter table public.knowledge_item_sources enable row level security;
alter table public.knowledge_refresh_reviews enable row level security;

create policy "knowledge_items_select_public"
on public.knowledge_items
for select
using (is_active = true);

create policy "knowledge_item_sources_select_public"
on public.knowledge_item_sources
for select
using (
  exists (
    select 1
    from public.knowledge_items
    where public.knowledge_items.id = knowledge_item_sources.knowledge_item_id
      and public.knowledge_items.is_active = true
  )
);

create policy "knowledge_refresh_reviews_select_authenticated"
on public.knowledge_refresh_reviews
for select
using (auth.role() = 'authenticated');
