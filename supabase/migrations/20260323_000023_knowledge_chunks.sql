-- Knowledge chunks table for RAG-based Q&A
-- Stores discrete, searchable knowledge units for tax and loan domains
-- Searched at query time: relevant chunks are injected into Claude context

create table if not exists public.knowledge_chunks (
  id            uuid primary key default gen_random_uuid(),
  domain        text not null check (domain in ('tax', 'loan')),
  category      text not null,
  title         text not null,
  content       text not null,
  tags          text[] not null default '{}',
  industry_ids  text[] default null,  -- null = applies to all industries
  source_name   text,
  source_url    text,
  verified_at   date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  search_vector tsvector
);

-- GIN index for fast full-text search
create index if not exists knowledge_chunks_search_idx on public.knowledge_chunks using gin(search_vector);
-- Index for domain filtering
create index if not exists knowledge_chunks_domain_idx on public.knowledge_chunks (domain);
-- Index for category filtering
create index if not exists knowledge_chunks_category_idx on public.knowledge_chunks (category);

-- Trigger: maintain search_vector + updated_at on insert/update
create or replace function knowledge_chunks_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector := to_tsvector(
    'simple'::regconfig,
    coalesce(new.title, '') || ' ' ||
    coalesce(new.content, '') || ' ' ||
    coalesce(array_to_string(new.tags, ' '), '')
  );
  new.updated_at := now();
  return new;
end;
$$;

create trigger knowledge_chunks_upsert
  before insert or update on public.knowledge_chunks
  for each row execute function knowledge_chunks_search_vector_update();

comment on table public.knowledge_chunks is
  'RAG knowledge base: 세무·대출 도메인별 지식 청크. Claude Q&A 컨텍스트로 주입됨.';
comment on column public.knowledge_chunks.domain is '''tax'' | ''loan''';
comment on column public.knowledge_chunks.industry_ids is 'null이면 전 업종 적용. 업종 특화 내용이면 해당 industry_category_id 배열';
comment on column public.knowledge_chunks.search_vector is 'tsvector (trigger 유지): 제목+내용+태그 합산. GIN 인덱스로 전문검색';

-- RLS
alter table public.knowledge_chunks enable row level security;

create policy "anon can read knowledge chunks"
  on public.knowledge_chunks for select
  using (true);

create policy "service role full access knowledge chunks"
  on public.knowledge_chunks for all
  using (auth.role() = 'service_role');
