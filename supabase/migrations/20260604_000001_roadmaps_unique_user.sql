-- ════════════════════════════════════════════════════════════════════════
--  roadmaps: 유저당 1 row 보장 (웹↔앱 데이터 연동 정합성)
--
--  배경: roadmaps 에 unique(user_id) 제약이 없어, 웹·앱을 *동시에 최초 사용* 하는
--    레이스에서 한 유저에게 roadmap row 가 2개 생길 수 있었음. 이 경우 stage_decisions
--    (FK roadmap_id) 가 두 row 에 나뉘어, 웹·앱이 각각 "most-recent roadmap" 만 읽으면
--    진행도가 분할 표시됨 (둘 다 부분만 보임).
--
--  조치:
--    1. 유저별 canonical roadmap = 가장 최근 (updated_at desc, created_at desc, id desc).
--    2. 비-canonical roadmap 의 stage_decisions / stage_tasks 를 canonical 로 병합.
--       - (user, stage_code) [+ task_code] 충돌 시 최신 1건만 보존(completed_at·updated_at 우선), 나머지 삭제.
--       - 생존 row 를 canonical roadmap_id 로 re-parent (unique(roadmap_id, …) 위반 없음).
--    3. 비-canonical roadmap row 삭제.
--    4. unique(user_id) 제약 추가 → 이후 중복 생성 차단.
--
--  멱등: 재실행 안전. 중복이 없으면 1~3 은 no-op, 4 는 이미 있으면 skip.
-- ════════════════════════════════════════════════════════════════════════

drop table if exists _canon_roadmap;
drop table if exists _roadmap_map;

-- 1. 유저별 canonical roadmap
create temporary table _canon_roadmap as
select distinct on (user_id) user_id, id as roadmap_id
from public.roadmaps
order by user_id, updated_at desc nulls last, created_at desc nulls last, id desc;

-- 2. 모든 roadmap → 해당 유저의 canonical 매핑
create temporary table _roadmap_map as
select r.id as roadmap_id, r.user_id, c.roadmap_id as canon_id
from public.roadmaps r
join _canon_roadmap c on c.user_id = r.user_id;

-- 3a. stage_decisions: (user, stage_code) 당 최신 1건만 보존, 나머지 삭제
delete from public.stage_decisions d
using (
  select id from (
    select d.id,
      row_number() over (
        partition by m.user_id, d.stage_code
        order by d.completed_at desc nulls last, d.updated_at desc nulls last, d.id desc
      ) as rn
    from public.stage_decisions d
    join _roadmap_map m on m.roadmap_id = d.roadmap_id
  ) ranked
  where ranked.rn > 1
) loser
where d.id = loser.id;

-- 3b. 생존 decisions 를 canonical 로 re-parent
update public.stage_decisions d
set roadmap_id = m.canon_id
from _roadmap_map m
where d.roadmap_id = m.roadmap_id
  and d.roadmap_id <> m.canon_id;

-- 4a. stage_tasks: (user, stage_code, task_code) 당 최신 1건만 보존
delete from public.stage_tasks t
using (
  select id from (
    select t.id,
      row_number() over (
        partition by m.user_id, t.stage_code, t.task_code
        order by t.updated_at desc nulls last, t.id desc
      ) as rn
    from public.stage_tasks t
    join _roadmap_map m on m.roadmap_id = t.roadmap_id
  ) ranked
  where ranked.rn > 1
) loser
where t.id = loser.id;

-- 4b. 생존 tasks 를 canonical 로 re-parent
update public.stage_tasks t
set roadmap_id = m.canon_id
from _roadmap_map m
where t.roadmap_id = m.roadmap_id
  and t.roadmap_id <> m.canon_id;

-- 5. 비-canonical roadmap row 삭제 (decisions/tasks 는 이미 이동 완료)
delete from public.roadmaps r
using _canon_roadmap c
where r.user_id = c.user_id
  and r.id <> c.roadmap_id;

drop table if exists _canon_roadmap;
drop table if exists _roadmap_map;

-- 6. unique(user_id) 제약 추가 (멱등)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'roadmaps_user_id_unique'
  ) then
    alter table public.roadmaps
      add constraint roadmaps_user_id_unique unique (user_id);
  end if;
end $$;
