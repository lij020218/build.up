-- Insight RAG: vector-based knowledge base for high-quality business insight articles.
-- Separate from `knowledge_chunks` (tax/loan FTS) — this is for long-form business strategy
-- content (PE/VC playbooks, AI strategy, fundraising, operations, etc.)
--
-- Stack: pgvector + OpenAI text-embedding-3-small (1536 dim) + HNSW index + cosine distance.

create extension if not exists vector;

-- ── insight_documents: original article metadata ─────────────────────────
create table if not exists public.insight_documents (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  source_url    text,
  source_name   text,                                 -- 'bzcf', 'techcrunch', 'a16z', ...
  category      text not null,                        -- 'ai_strategy', 'fundraising', 'operations', 'marketing', ...
  tags          text[] not null default '{}',
  language      text not null default 'ko',
  published_at  date,
  content_hash  text unique,                          -- sha256 of body — prevents duplicate ingestion
  chunk_count   integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists insight_documents_category_idx on public.insight_documents (category);
create index if not exists insight_documents_tags_gin     on public.insight_documents using gin (tags);

-- ── insight_chunks: per-chunk content + embedding ────────────────────────
create table if not exists public.insight_chunks (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.insight_documents(id) on delete cascade,
  chunk_index  integer not null,
  content      text not null,
  token_estimate integer,                              -- approx tokens (chars / 3 for ko, /4 for en)
  embedding    vector(1536),                           -- OpenAI text-embedding-3-small
  metadata     jsonb not null default '{}'::jsonb,     -- {summary, keywords, section, ...}
  created_at   timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists insight_chunks_document_idx on public.insight_chunks (document_id);

-- HNSW index for cosine similarity. HNSW > IVFFlat for our scale (<100k rows expected).
-- Build params: m=16, ef_construction=64 (pgvector defaults — proven balance).
create index if not exists insight_chunks_embedding_hnsw
  on public.insight_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- ── triggers ─────────────────────────────────────────────────────────────
create or replace function insight_documents_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger insight_documents_set_updated
  before update on public.insight_documents
  for each row execute function insight_documents_touch_updated_at();

-- Maintain chunk_count on insight_documents when chunks are added/removed.
create or replace function insight_chunks_sync_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.insight_documents
       set chunk_count = chunk_count + 1
     where id = new.document_id;
  elsif (tg_op = 'DELETE') then
    update public.insight_documents
       set chunk_count = greatest(chunk_count - 1, 0)
     where id = old.document_id;
  end if;
  return null;
end;
$$;

create trigger insight_chunks_count_sync
  after insert or delete on public.insight_chunks
  for each row execute function insight_chunks_sync_count();

-- ── RPC: vector similarity search ────────────────────────────────────────
-- Cosine similarity (1 - cosine distance). Optional filters on category/tags.
-- IMPORTANT: When filtering by category/tags, we widen the candidate pool first
-- (HNSW + WHERE filter can return fewer than `match_count` rows otherwise).
create or replace function public.match_insight_chunks(
  query_embedding vector(1536),
  match_count     int default 6,
  min_similarity  float default 0.5,
  filter_category text default null,
  filter_tags     text[] default null
)
returns table (
  chunk_id    uuid,
  document_id uuid,
  chunk_index integer,
  content     text,
  similarity  float,
  doc_title   text,
  doc_source_name text,
  doc_source_url  text,
  doc_category    text,
  doc_tags        text[]
)
language sql stable as $$
  select
    c.id            as chunk_id,
    c.document_id,
    c.chunk_index,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity,
    d.title         as doc_title,
    d.source_name   as doc_source_name,
    d.source_url    as doc_source_url,
    d.category      as doc_category,
    d.tags          as doc_tags
  from public.insight_chunks c
  join public.insight_documents d on d.id = c.document_id
  where c.embedding is not null
    and (filter_category is null or d.category = filter_category)
    and (filter_tags is null or d.tags && filter_tags)
    and (1 - (c.embedding <=> query_embedding)) >= min_similarity
  order by c.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

-- ── comments ─────────────────────────────────────────────────────────────
comment on table public.insight_documents is
  'RAG insight knowledge base: 고품질 비즈니스 아티클/인사이트 메타데이터. 청크는 insight_chunks.';
comment on table public.insight_chunks is
  '비즈니스 인사이트 청크 + 1536-d OpenAI 임베딩. HNSW 인덱스로 코사인 유사도 검색.';
comment on column public.insight_chunks.embedding is 'OpenAI text-embedding-3-small (1536 dimensions, cosine)';
comment on function public.match_insight_chunks is
  '쿼리 임베딩으로 인사이트 청크 검색. 카테고리·태그 필터 지원. similarity = 1 - cosine_distance.';

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.insight_documents enable row level security;
alter table public.insight_chunks    enable row level security;

create policy "anyone authenticated reads insight_documents"
  on public.insight_documents for select
  using (auth.role() in ('authenticated', 'service_role'));

create policy "anyone authenticated reads insight_chunks"
  on public.insight_chunks for select
  using (auth.role() in ('authenticated', 'service_role'));

create policy "service role writes insight_documents"
  on public.insight_documents for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service role writes insight_chunks"
  on public.insight_chunks for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Grants — match the pattern used by other migrations in this project.
grant select on public.insight_documents to authenticated, anon;
grant select on public.insight_chunks    to authenticated, anon;
grant execute on function public.match_insight_chunks to authenticated, anon, service_role;
