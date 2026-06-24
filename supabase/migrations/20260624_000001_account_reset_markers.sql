-- 초기화 표식(tombstone) — 다른 기기 부활(cross-device resurrection) 차단의 권위적 신호.
--
-- 문제: 초기화는 USER_TABLES 전체를 삭제하지만, *아직 옛 데이터를 들고 있는 다른 기기*가
--   다음 동기화에서 stale 로컬을 서버로 flush 해 삭제된 행을 되살린다("초기화 후 데이터 복구").
--   realtime DELETE 는 RLS 테이블에서 PK(=id)만 실려 user_id 필터에 안 잡혀(20260622 주석 참고)
--   신뢰할 수 없다.
--
-- 해법: 초기화로 *지워지지 않는* 작은 표에 reset_at 을 기록. 각 기기는 마지막으로 본 reset_at 을
--   로컬에 저장하고, 로드 시 비교한다. 서버 reset_at 이 더 최신이면 = 다른 기기에서 초기화됨
--   → 로컬을 flush 하지 말고 *따라서* 비운다. 타이밍·기기·realtime 전달 여부와 무관하게 권위적.
--
-- ⚠️ account-wipe.ts 의 USER_TABLES 에 이 표를 넣지 말 것 — 초기화가 이 표식을 지우면 안 된다.
-- ⚠️ 운영(prod) 적용: 본 마이그레이션 실행. (realtime publication 불필요 — 로드 시 폴링으로 비교.)

create table if not exists public.account_reset_markers (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  reset_at   timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_reset_markers enable row level security;

-- 본인 행만 읽기/쓰기. (service_role 은 RLS 우회 — 초기화 API 가 admin 으로 upsert.)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='account_reset_markers' and policyname='account_reset_markers_select_own') then
    create policy "account_reset_markers_select_own" on public.account_reset_markers
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='account_reset_markers' and policyname='account_reset_markers_insert_own') then
    create policy "account_reset_markers_insert_own" on public.account_reset_markers
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='account_reset_markers' and policyname='account_reset_markers_update_own') then
    create policy "account_reset_markers_update_own" on public.account_reset_markers
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
