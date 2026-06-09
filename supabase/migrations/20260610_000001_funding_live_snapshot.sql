-- ─────────────────────────────────────────────────────────────
--  funding_live_snapshot
--
--  K-Startup 라이브 공고(getAnnouncementInformation01, 현재 "공고 중"만)의 정규화 스냅샷.
--  단일 global row — cron(/api/cron/funding-live)이 service_role 로 6시간마다 갱신.
--
--  목적(2026-06-10 "클릭 즉시 342개" 요청):
--    이전엔 /api/funding/live 가 람다 인스턴스마다 따로인 메모리 캐시라, cold instance 가
--    매 방문 data.go.kr 를 인라인 호출(~10초) → 92개(큐레이션)만 보이다 뒤늦게 342개 점프.
--    이제 cron 이 사용자 경로 밖에서 미리 페치해 이 테이블에 저장 → 라우트는 단일 PK row 만
--    읽어(수십 ms) 즉시 응답. 큐레이션(startupPrograms 정적)과는 *읽기 시점*에 병합하므로
--    큐레이션 코드 변경도 즉시 반영된다.
--
--  민감정보 아님(공개 정부 지원사업) → 공개 SELECT 허용. 쓰기는 service_role 전용(정책 없음).
-- ─────────────────────────────────────────────────────────────

create table if not exists public.funding_live_snapshot (
  id            text primary key default 'global',
  live_programs jsonb not null default '[]'::jsonb,   -- 정규화된 StartupProgram[] (라이브만)
  live          boolean not null default false,        -- 라이브 데이터가 실제로 채워졌는지
  total         int not null default 0,                -- live_programs 개수(관측용)
  fetched_at    timestamptz not null default now(),    -- K-Startup 페치 시각
  updated_at    timestamptz not null default now()
);

alter table public.funding_live_snapshot enable row level security;

-- 공개 읽기(인증 사용자 경로에서 anon 키로 조회). 쓰기 정책 없음 → service_role 만 갱신 가능.
drop policy if exists "funding_live_snapshot_public_read" on public.funding_live_snapshot;
create policy "funding_live_snapshot_public_read"
  on public.funding_live_snapshot
  for select
  using (true);

comment on table public.funding_live_snapshot is
  'K-Startup 라이브 공고 스냅샷(단일 global row). cron(/api/cron/funding-live)이 service_role 로 갱신, 사용자 경로는 읽기만. 큐레이션과는 읽기 시점에 병합.';
