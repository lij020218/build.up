-- ═══════════════════════════════════════════════════════════════════════
-- business_plan_drafts — 사용자가 생성한 사업계획서 초안 원장 (2026-08-14)
--
-- 왜: 공고 맞춤 사업계획서(주 2회, Claude Sonnet 5)를 생성해도 기기 로컬 캐시에만 남아
--   다른 기기·앱에서 볼 수 없었다. 사장님 지시 — "저장이 되어야 해. 펀딩 페이지
--   '사업계획서 보기'에서 목록 → 터치 → 열람".
--
-- 성격: **사용자 데이터** (user_id 스코프). 계정 초기화/삭제 시 삭제 (USER_TABLES 등재).
--   · 쓰기: /api/ai/business-plan/generate 가 생성 성공 직후 service role 로 insert
--   · 읽기: 클라이언트(웹·iOS)가 anon+JWT 로 본인 것만 select (RLS)
--   · 삭제: 본인 것만 (RLS)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.business_plan_drafts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  -- 공고 맞춤이면 program_id/program_name, 일반 생성(단계 임베드)이면 null
  program_id   text,
  program_name text,
  purpose      text not null default 'govt-support',   -- govt-support | loan | investor
  summary      text,
  sections     jsonb not null default '[]'::jsonb,     -- [{title, content}]
  missing_info jsonb not null default '[]'::jsonb,     -- string[] (채우면 완성 체크리스트)
  model        text,                                   -- 생성 모델 (품질 추적용)
  created_at   timestamptz not null default now()
);

create index if not exists idx_business_plan_drafts_user_created
  on public.business_plan_drafts(user_id, created_at desc);

alter table public.business_plan_drafts enable row level security;

create policy "business_plan_drafts_self_select"
  on public.business_plan_drafts for select to authenticated
  using (auth.uid() = user_id);

create policy "business_plan_drafts_self_delete"
  on public.business_plan_drafts for delete to authenticated
  using (auth.uid() = user_id);

-- insert 는 서버(service role)만 — 클라이언트가 임의 초안을 꽂아 넣지 못하게 정책 미부여.

comment on table public.business_plan_drafts is
  '사용자 생성 사업계획서 초안 원장 — 공고 맞춤/일반. 서버 insert, 본인 select/delete.';
