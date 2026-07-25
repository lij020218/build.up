-- ─────────────────────────────────────────────────────────────
--  marketing_meme_packs
--
--  주간 밈·챌린지 팩 — **전역 1행/주** (사용자·업종 무관, user_id 없음).
--  업자용 트렌드 소스(고구마팜·캐릿·소마코·위픽레터 등)에서 크론이 매주 수집해
--  "원본 설명 + 원본 링크 + 업종 fit 태그"로 구조화 저장. AI 가 가게 버전
--  대사를 지어내지 않는다(개사 금지) — 적용은 사장님 몫 (2026-07-24 사장님 원칙).
--
--  · week_key : ISO 주차 "YYYY-Www" (KST) — marketing_cases_cache 와 동일 규약
--  · items    : MemeItem[] (kind: meme|challenge|format, originDesc, originUrl,
--               sourceName, publishedAt, industryFit[], applyHint)
--  · 쓰기: cron(service_role)만. 읽기: 로그인 사용자 전체(전역 공용 데이터).
--  · account-wipe: user 컬럼 없음 → wipe 대상 아님(전역 공용, 가드 스캔 비대상).
-- ─────────────────────────────────────────────────────────────

create table if not exists public.marketing_meme_packs (
  week_key     text primary key,
  items        jsonb not null default '[]'::jsonb,
  sources      jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.marketing_meme_packs enable row level security;

-- 전역 읽기 전용 — 모든 로그인 사용자가 같은 팩을 본다.
drop policy if exists "marketing_meme_packs_select_authenticated" on public.marketing_meme_packs;
create policy "marketing_meme_packs_select_authenticated"
  on public.marketing_meme_packs for select
  to authenticated
  using (true);

-- 쓰기 정책 없음 — insert/update 는 RLS 를 우회하는 service_role(cron)만 가능.

-- GRANT 명시 — 이 DB 는 default privilege 부재로 42501 이력 3회(20260429/20260503/20260517).
grant select on table public.marketing_meme_packs to authenticated;
grant select, insert, update, delete on table public.marketing_meme_packs to service_role;

comment on table public.marketing_meme_packs is
  '주간 밈·챌린지 팩(전역 1행/주). 업자용 소스 화이트리스트에서 크론 수집. 원본 설명+링크만, AI 개사 금지.';
