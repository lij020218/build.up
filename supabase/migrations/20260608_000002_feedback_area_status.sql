-- 피드백 분류 확장: 기능 영역(area) + 처리 상태(status).
--   area: 보내기 화면에서 자동태깅(screen→area)되며 사용자가 수정 가능. NULL 허용(구 데이터·미지정).
--   status: 관리자 처리 워크플로 (new→reviewing→resolved→wontfix). 기본 new.
--   둘 다 멱등(IF NOT EXISTS). RLS 변경 없음 — 상태 변경은 service_role(관리자 API)만 수행.

alter table public.user_feedback
  add column if not exists area text;

alter table public.user_feedback
  add column if not exists status text not null default 'new';

-- 관리자 인박스 정렬·필터 가속(최신순 + 상태/영역).
create index if not exists user_feedback_status_created_idx
  on public.user_feedback (status, created_at desc);

create index if not exists user_feedback_area_idx
  on public.user_feedback (area);

-- status 값 가드(앱 화이트리스트와 동일). 잘못된 값 차단.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_feedback_status_check'
  ) then
    alter table public.user_feedback
      add constraint user_feedback_status_check
      check (status in ('new', 'reviewing', 'resolved', 'wontfix'));
  end if;
end $$;
