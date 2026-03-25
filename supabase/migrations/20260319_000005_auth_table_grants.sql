grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.business_profiles to authenticated;
grant select, insert, update, delete on table public.roadmaps to authenticated;
grant select, insert, update, delete on table public.stage_decisions to authenticated;
grant select, insert, update, delete on table public.stage_tasks to authenticated;

grant select on table public.knowledge_items to authenticated;
grant select on table public.knowledge_item_sources to authenticated;
grant select on table public.knowledge_refresh_reviews to authenticated;

grant select on table public.knowledge_items to anon;
grant select on table public.knowledge_item_sources to anon;
grant select on table public.knowledge_refresh_reviews to anon;
