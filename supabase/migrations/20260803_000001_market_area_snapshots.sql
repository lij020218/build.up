-- ═══════════════════════════════════════════════════════════════════════
-- market_area_snapshots — 상권 개폐업 추이의 원장 (2026-08-03)
--
-- 왜: 소진공 상가 API 에는 개업일 필드가 없고 폐업 업소는 목록에서 사라진다
--   → "이 동네 동종이 늘고 있나 줄고 있나"는 어떤 공공 API 로도 라이브 계산 불가.
--   유일한 정직한 길 = 조회 시점 카운트를 우리가 축적해 시점 간 델타를 실측.
--
-- 성격: **전역 통계** (user_id 없음 — 특정 사장님 데이터 아님).
--   · 쓰기: market-recommend 라우트가 후보 조회 때 fire-and-forget upsert (service role)
--   · 읽기: 같은 area_key+업종의 60일+ 이전 스냅샷 → 델타 표시. 없으면 미표시 (콜드스타트 정직)
--   · 계정 초기화/삭제와 무관 (account-wipe-coverage 에 보존 선언)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.market_area_snapshots (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- "lon3,lat3,r500" — 좌표 소수 3자리(≈110m) 반올림 + 반경. 같은 동네 재조회가 같은 키로 모임
  area_key text NOT NULL,
  -- 업종 코드 시그니처 (예: "scls:I21201" / "mcls:I201+I210") — 같은 기준끼리만 델타 비교
  upjong_sig text NOT NULL,
  snapshot_date date NOT NULL,
  same_count integer NOT NULL CHECK (same_count >= 0),
  total_count integer CHECK (total_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- 하루 1스냅샷 (같은 날 재조회는 덮어쓰지 않고 무시 — 첫 관측 보존)
  UNIQUE (area_key, upjong_sig, snapshot_date)
);

COMMENT ON TABLE public.market_area_snapshots IS
  '상권 개폐업 추이 원장 — 전역 통계(사용자 데이터 아님). 소진공 카운트의 시점 스냅샷.';

-- RLS: 서비스 롤 전용 (클라이언트 직접 접근 불필요 — 라우트가 읽고 쓴다)
ALTER TABLE public.market_area_snapshots ENABLE ROW LEVEL SECURITY;
-- 정책 없음 = anon/authenticated 전부 차단, service_role 은 RLS 우회.

CREATE INDEX IF NOT EXISTS market_area_snapshots_lookup_idx
  ON public.market_area_snapshots (area_key, upjong_sig, snapshot_date DESC);
