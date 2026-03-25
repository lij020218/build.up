-- stage_decisions 와 stage_tasks 에 DELETE RLS policy 추가
-- saveRoadmapState 가 delete-before-insert 패턴을 사용하므로 필요합니다.

create policy "stage_decisions_delete_own"
on public.stage_decisions
for delete
using (
  exists (
    select 1
    from public.roadmaps
    where public.roadmaps.id = stage_decisions.roadmap_id
      and public.roadmaps.user_id = auth.uid()
  )
);

create policy "stage_tasks_delete_own"
on public.stage_tasks
for delete
using (
  exists (
    select 1
    from public.roadmaps
    where public.roadmaps.id = stage_tasks.roadmap_id
      and public.roadmaps.user_id = auth.uid()
  )
);
