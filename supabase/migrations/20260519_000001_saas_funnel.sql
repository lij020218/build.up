-- ────────────────────────────────────────────────────────────────────────────
--  20260519_000001_saas_funnel.sql
--  전환율 funnel 데이터 — 기존 saas_metrics_* (engagement DAU/MAU) 와 별개.
--
--  배경:
--   • 기존 saas_metrics_connections + saas_metrics_daily 는 "활성 사용자" 엔게이지먼트용
--     (active_users, weekly_active_users, monthly_active_users, signups, churns).
--   • 사장님이 추가로 원하는 "전환율 funnel" (방문 → 가입 → 활성화 → 유료
--     또는 방문 → 장바구니 → 결제 → 구매) 은 본질적으로 다른 형태 (4-step + WoW).
--   • 그래서 별도 saas_funnel_* namespace 로 추가, 통합 view 도 별도.
--
--  채널 (source):
--   • 'manual'       — 사장님 수동 주간 입력 (즉시 가치)
--   • 'pull'         — 사장님 자체 서버 GET endpoint (custom)
--   • 'ga4'          — 기존 saas_metrics_connections.source='ga4' 재사용
--   • 'webhook'      — 기존 saas_metrics_connections.source='webhook' 재사용
--   • 'cafe24/stripe/...' — 추후 추가
--
--  연결 자격증명은 기존 saas_metrics_connections 를 확장 (custom_pull 추가).
-- ────────────────────────────────────────────────────────────────────────────

------------------------------------------------------------
-- 1. saas_metrics_connections — custom_pull / cafe24 등 추가
------------------------------------------------------------
ALTER TABLE public.saas_metrics_connections
    DROP CONSTRAINT IF EXISTS saas_metrics_connections_source_check;

ALTER TABLE public.saas_metrics_connections
    ADD CONSTRAINT saas_metrics_connections_source_check
    CHECK (source IN (
        -- 기존 (20260505_saas_metrics.sql)
        'ga4', 'webhook', 'manual',
        'amplitude', 'mixpanel', 'posthog',
        -- 신규 — 사장님 자체 endpoint (어디든 가능)
        'custom_pull',
        -- 한국 자체몰 솔루션 (점유율 검증 — 2026-05-19 WebSearch)
        'cafe24',           -- 70% — 자체몰 1위
        'imweb',            -- 신흥 — 초보 셀러
        -- 한국 마켓플레이스
        'coupang',          -- 23% — 마켓 1위
        'naver_store',      -- 20.7% — 마켓 2위
        -- 한국 PG 빅4 (65-70% 점유)
        'kg_inicis',        -- 최대 가맹점 (19만)
        'nhn_kcp',
        'toss_payments',    -- 스타트업/소규모 인기
        'nice_payments',
        -- 한국 간편결제
        'kakao_pay',
        'naver_pay',
        -- 사장님 자체 백엔드 (BaaS)
        'supabase',         -- BaaS 양강
        'firebase',         -- BaaS 양강
        -- 글로벌 (한국 점유율 작음, 글로벌 SaaS만)
        'stripe'
    ));

-- Pull mode / 자체 서비스 URL — 사장님이 GET 호출 받을 endpoint
ALTER TABLE public.saas_metrics_connections
    ADD COLUMN IF NOT EXISTS endpoint_url text;

-- 모드 — funnel 카드가 commerce/saas 어느 쪽에서 쓸지
ALTER TABLE public.saas_metrics_connections
    ADD COLUMN IF NOT EXISTS funnel_mode text
    CHECK (funnel_mode IS NULL OR funnel_mode IN ('commerce','saas'));

-- 사장님 식별 라벨 (예: "내 Shopify 스토어")
ALTER TABLE public.saas_metrics_connections
    ADD COLUMN IF NOT EXISTS connection_label text;

COMMENT ON COLUMN public.saas_metrics_connections.endpoint_url IS
    'custom_pull: 사장님이 GET 호출 받을 endpoint. supabase: PostgREST URL. cafe24: shop_no.';
COMMENT ON COLUMN public.saas_metrics_connections.funnel_mode IS
    'funnel 컨텍스트 — commerce (방문→장바구니→결제→구매) | saas (방문→가입→활성화→유료).';


------------------------------------------------------------
-- 2. saas_funnel_manual_weekly — 사장님 수동 주간 입력
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saas_funnel_manual_weekly (
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start  date NOT NULL,                            -- ISO Monday
    mode        text NOT NULL CHECK (mode IN ('commerce','saas')),
    step_1      integer NOT NULL DEFAULT 0 CHECK (step_1 >= 0),  -- 방문
    step_2      integer NOT NULL DEFAULT 0 CHECK (step_2 >= 0),  -- 장바구니 | 가입
    step_3      integer NOT NULL DEFAULT 0 CHECK (step_3 >= 0),  -- 결제시작 | 활성화
    step_4      integer NOT NULL DEFAULT 0 CHECK (step_4 >= 0),  -- 구매 | 유료
    note        text,
    updated_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, week_start, mode)
);

CREATE INDEX IF NOT EXISTS saas_funnel_manual_weekly_user_idx
    ON public.saas_funnel_manual_weekly (user_id, week_start DESC);

ALTER TABLE public.saas_funnel_manual_weekly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_funnel_manual_weekly_own_all"
    ON public.saas_funnel_manual_weekly FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


------------------------------------------------------------
-- 3. saas_funnel_source_daily — 자동 채널 (pull/ga4/webhook/cafe24/...) 일별 적재
--    하나의 통합 테이블 — source 컬럼으로 채널 구분 (테이블 폭발 방지)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saas_funnel_source_daily (
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date        date NOT NULL,
    mode        text NOT NULL CHECK (mode IN ('commerce','saas')),
    source      text NOT NULL CHECK (source IN (
                    -- 사장님 자체
                    'pull', 'webhook', 'supabase', 'firebase',
                    -- 한국 이커머스 플랫폼
                    'cafe24', 'imweb', 'coupang', 'naver_store',
                    -- 한국 PG 빅4
                    'kg_inicis', 'nhn_kcp', 'toss_payments', 'nice_payments',
                    -- 간편결제
                    'kakao_pay', 'naver_pay',
                    -- 분석
                    'ga4', 'mixpanel', 'amplitude', 'posthog',
                    -- 글로벌
                    'stripe'
                )),
    step_1      integer NOT NULL DEFAULT 0,
    step_2      integer NOT NULL DEFAULT 0,
    step_3      integer NOT NULL DEFAULT 0,
    step_4      integer NOT NULL DEFAULT 0,
    raw         jsonb,                                     -- 원본 응답 (감사·디버그용)
    fetched_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, date, mode, source)
);

CREATE INDEX IF NOT EXISTS saas_funnel_source_daily_user_idx
    ON public.saas_funnel_source_daily (user_id, date DESC, mode);

ALTER TABLE public.saas_funnel_source_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_funnel_source_daily_own_select"
    ON public.saas_funnel_source_daily FOR SELECT
    USING (auth.uid() = user_id);
-- INSERT/UPDATE 는 service role 만 (Edge function cron).


------------------------------------------------------------
-- 4. saas_funnel_events_raw — Webhook 모드 raw 적재 (옵션)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saas_funnel_events_raw (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_key    text NOT NULL,
    occurred_at  timestamptz NOT NULL,
    mode         text CHECK (mode IS NULL OR mode IN ('commerce','saas')),
    properties   jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saas_funnel_events_raw_user_time_idx
    ON public.saas_funnel_events_raw (user_id, occurred_at DESC);

ALTER TABLE public.saas_funnel_events_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saas_funnel_events_raw_own_select"
    ON public.saas_funnel_events_raw FOR SELECT
    USING (auth.uid() = user_id);


------------------------------------------------------------
-- 5. v_saas_funnel_unified — manual + 자동 채널 통합 (주간)
--
--  우선순위: manual > pull > supabase > cafe24 > stripe > ga4 > webhook > 그 외
--  (사장님 직접 입력이 최우선, 그 다음 자체 서버 pull,
--   그 다음 사장님 본인 DB read, 그 다음 플랫폼 API, 마지막 분석 도구)
------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_saas_funnel_unified
WITH (security_invoker = true) AS
WITH source_weekly AS (
    SELECT
        user_id,
        date_trunc('week', date)::date AS week_start,
        mode,
        source,
        SUM(step_1) AS step_1,
        SUM(step_2) AS step_2,
        SUM(step_3) AS step_3,
        SUM(step_4) AS step_4
    FROM public.saas_funnel_source_daily
    GROUP BY user_id, date_trunc('week', date)::date, mode, source
),
keys AS (
    SELECT user_id, week_start, mode FROM public.saas_funnel_manual_weekly
    UNION
    SELECT user_id, week_start, mode FROM source_weekly
),
priority_rank AS (
    -- 우선순위 — 한국 시장 점유율 + 데이터 정확도 기반 (2026-05-19 검증).
    -- 1. 사장님 자체 데이터 (pull/supabase/firebase) 가 가장 정확
    -- 2. 한국 이커머스 플랫폼 (Cafe24 70%, 쿠팡 23%, 네이버 20.7%, 아임웹 신흥)
    -- 3. 한국 PG 빅4 (65-70% 점유)
    -- 4. 간편결제 / 분석 도구 / 글로벌
    SELECT
        s.user_id, s.week_start, s.mode, s.source,
        s.step_1, s.step_2, s.step_3, s.step_4,
        CASE s.source
            -- 사장님 자체 (가장 정확)
            WHEN 'pull'            THEN 1
            WHEN 'supabase'        THEN 2
            WHEN 'firebase'        THEN 3
            -- 한국 이커머스 (점유율 순)
            WHEN 'cafe24'          THEN 10   -- 자체몰 70%
            WHEN 'coupang'         THEN 11   -- 마켓 23%
            WHEN 'naver_store'     THEN 12   -- 마켓 20.7%
            WHEN 'imweb'           THEN 13
            -- 한국 PG 빅4 (결제 source-of-truth)
            WHEN 'kg_inicis'       THEN 20   -- 최대 가맹점
            WHEN 'nhn_kcp'         THEN 21
            WHEN 'toss_payments'   THEN 22
            WHEN 'nice_payments'   THEN 23
            -- 간편결제
            WHEN 'kakao_pay'       THEN 30
            WHEN 'naver_pay'       THEN 31
            -- 분석 도구 (이벤트 단위, 정확도 ↓)
            WHEN 'ga4'             THEN 40
            WHEN 'mixpanel'        THEN 41
            WHEN 'amplitude'       THEN 42
            WHEN 'posthog'         THEN 43
            -- 글로벌
            WHEN 'stripe'          THEN 50
            -- 웹훅은 사장님 보고에 의존 — 최후순위
            WHEN 'webhook'         THEN 90
            ELSE 99
        END AS rank
    FROM source_weekly s
),
best_auto AS (
    SELECT DISTINCT ON (user_id, week_start, mode)
        user_id, week_start, mode, source,
        step_1, step_2, step_3, step_4
    FROM priority_rank
    ORDER BY user_id, week_start, mode, rank
)
SELECT
    k.user_id,
    k.week_start,
    k.mode,
    COALESCE(m.step_1, b.step_1, 0) AS step_1,
    COALESCE(m.step_2, b.step_2, 0) AS step_2,
    COALESCE(m.step_3, b.step_3, 0) AS step_3,
    COALESCE(m.step_4, b.step_4, 0) AS step_4,
    CASE
        WHEN m.user_id IS NOT NULL THEN 'manual'
        WHEN b.user_id IS NOT NULL THEN b.source
        ELSE 'none'
    END AS source
FROM keys k
LEFT JOIN public.saas_funnel_manual_weekly m
    ON m.user_id = k.user_id AND m.week_start = k.week_start AND m.mode = k.mode
LEFT JOIN best_auto b
    ON b.user_id = k.user_id AND b.week_start = k.week_start AND b.mode = k.mode;

COMMENT ON VIEW public.v_saas_funnel_unified IS
    'funnel 데이터 통합 view (주간). manual > pull > supabase > cafe24 > stripe > toss > naver > ga4 > webhook 우선순위.';


------------------------------------------------------------
-- 6. GRANTs
------------------------------------------------------------
GRANT SELECT ON public.v_saas_funnel_unified TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saas_funnel_manual_weekly TO authenticated;
GRANT SELECT ON public.saas_funnel_source_daily TO authenticated;
GRANT SELECT ON public.saas_funnel_events_raw TO authenticated;


------------------------------------------------------------
-- 7. updated_at trigger (manual_weekly) — 기존 portone_set_updated_at 재사용
------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_saas_funnel_manual_weekly_updated_at
    ON public.saas_funnel_manual_weekly;

CREATE TRIGGER trg_saas_funnel_manual_weekly_updated_at
    BEFORE UPDATE ON public.saas_funnel_manual_weekly
    FOR EACH ROW EXECUTE FUNCTION public.portone_set_updated_at();


------------------------------------------------------------
-- 8. Comments
------------------------------------------------------------
COMMENT ON TABLE public.saas_funnel_manual_weekly IS
    'funnel 사장님 수동 주간 입력 — Phase 1.';

COMMENT ON TABLE public.saas_funnel_source_daily IS
    'funnel 자동 채널 (pull/ga4/webhook/cafe24/stripe/...) 일별 raw — source 컬럼으로 구분.';

COMMENT ON TABLE public.saas_funnel_events_raw IS
    'Webhook 모드의 raw event 적재 — source_daily 의 원본.';
