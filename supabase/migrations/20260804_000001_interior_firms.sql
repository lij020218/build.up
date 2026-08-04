-- ─────────────────────────────────────────────────────────────
--  interior_firms — 국토부 전국인테리어업체표준데이터 적재 테이블 (2026-08-04)
--
--  배경: AI 로드맵 인테리어 카드에 "내 지역 등록 시공업체 실명"을 붙이기 위한 데이터.
--    포털이 이 데이터셋을 CSV 파일로만 제공(오픈API·odcloud 미등록 — 2026-08-04 확인)
--    → scripts/ingest-interior-firms.mts 가 CSV 를 파싱해 여기 적재한다.
--    원본 갱신 주기 연 1회(지자체 월 병합) — 분기 1회 재적재 권장.
--
--  성격: 공공 공개 데이터 (user_id 없음, 계정 데이터 아님 — 초기화·삭제와 무관).
--  읽기: 서버 라우트(anon/authenticated) 허용. 쓰기: service_role(적재 스크립트)만.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.interior_firms (
  reg_no     text primary key,          -- 등록번호 (표준데이터 고유키)
  name       text not null,             -- 업체명
  sido       text not null default '',  -- 시도명
  sigungu    text not null default '',  -- 시군구명
  road_addr  text not null default '',  -- 소재지도로명주소
  jibun_addr text not null default '',  -- 소재지지번주소
  phone      text,                      -- 전화번호
  rep_name   text,                      -- 대표자명
  staff_cnt  int,                       -- 총직원수
  reg_ymd    date,                      -- 등록일자
  ingested_at timestamptz not null default now()
);

create index if not exists interior_firms_sigungu_idx on public.interior_firms (sigungu);

alter table public.interior_firms enable row level security;

-- 공개 데이터 — 읽기 전면 허용 (개인정보: 대표자명은 표준데이터가 공개하는 범위 그대로)
drop policy if exists interior_firms_read on public.interior_firms;
create policy interior_firms_read on public.interior_firms
  for select using (true);

grant select on table public.interior_firms to anon, authenticated;
grant select, insert, update, delete on table public.interior_firms to service_role;

comment on table public.interior_firms is
  '국토부 전국인테리어업체표준데이터 (CSV 배치 적재 — scripts/ingest-interior-firms.mts). 공개 데이터, 계정 무관.';
