-- ─────────────────────────────────────────────────────────────
--  marketing_engagement_events
--
--  마케팅 페이지 실행 신호 계측 (2026-07-25) — append-only 이벤트 로그.
--  v2 개편("읽는 보고서 → 쓸 재료")의 성패 판단 지표:
--    · copy_click        — 실행물 [복사] 클릭 = "쓸 재료였는가"의 직접 증거
--    · meme_origin_click — 밈 레인 [원본 보기] 클릭 = 트렌드 레인 유용성
--  집계는 쿼리로 (주간: user_id·week_key group by). 이벤트당 1행, 저볼륨.
--
--  account-wipe: user_id 보유 → account-wipe.ts USER_TABLES 에 등록됨(가드 테스트 강제).
-- ─────────────────────────────────────────────────────────────

create table if not exists public.marketing_engagement_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  week_key   text not null,
  event      text not null check (event in ('copy_click', 'meme_origin_click')),
  created_at timestamptz not null default now()
);

create index if not exists idx_marketing_engagement_user_week
  on public.marketing_engagement_events (user_id, week_key);

alter table public.marketing_engagement_events enable row level security;

-- 쓰기는 서버 라우트(service_role)만. 클라이언트 직접 접근 정책 없음.
-- (조회도 운영 집계용 — service_role 쿼리로만.)

-- GRANT 명시 — 이 DB 는 default privilege 부재로 42501 이력 3회(20260429/20260503/20260517).
grant select, insert, delete on table public.marketing_engagement_events to service_role;

comment on table public.marketing_engagement_events is
  '마케팅 v2 실행 신호(복사 클릭·밈 원본 클릭) append-only 로그. 주간 집계용, service_role 전용.';
