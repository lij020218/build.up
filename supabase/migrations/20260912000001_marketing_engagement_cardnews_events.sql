-- ─────────────────────────────────────────────────────────────
--  marketing_engagement_events — 이벤트 종류 확장 (2026-09-12)
--
--  배경: 2026-09-12 프로드 점검에서 카드뉴스가 **실제로 쓰이는지 알 수 없다**는 게 드러났다.
--    · marketing_engagement_events: 2건(meme_origin_click), 마지막 2026-08-25
--    · ai_call_log: 카드뉴스 0건 (라우트가 OpenAI 를 직접 호출해 로깅 경로 밖)
--    · marketing_play_progress: 0건
--  "만들었는데 안 쓰는지 / 아예 안 만드는지"를 구분하지 못하면 다음 개선을 어디에 할지 정할 수 없다.
--
--  추가 이벤트:
--    · cardnews_generate — 카드뉴스 생성 성공 (기능에 도달했는가)
--    · cardnews_save     — PNG 저장/공유 (만든 걸 실제로 가져갔는가)
--    · play_done         — 주간 플레이 "했어요" 체크 (실행까지 갔는가)
--
--  개인정보 없음(user_id + week_key + event). append-only, service_role 쓰기.
-- ─────────────────────────────────────────────────────────────

alter table public.marketing_engagement_events
  drop constraint if exists marketing_engagement_events_event_check;

alter table public.marketing_engagement_events
  add constraint marketing_engagement_events_event_check
  check (event in ('copy_click', 'meme_origin_click', 'cardnews_generate', 'cardnews_save', 'play_done'));

comment on column public.marketing_engagement_events.event is
  'copy_click | meme_origin_click | cardnews_generate | cardnews_save | play_done — 마케팅 기능 실행 신호(2026-09-12 확장)';
