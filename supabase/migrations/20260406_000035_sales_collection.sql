-- ═══════════════════════════════════════════════════════
--  매출 자동수집 기반 테이블
--  카드매출(여신금융협회) + 현금영수증(홈택스) + 배달앱
-- ═══════════════════════════════════════════════════════

-- 1. 사용자별 연동 설정
CREATE TABLE IF NOT EXISTS public.sales_collection_config (
  user_id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  crefia_linked boolean DEFAULT false,
  hometax_linked boolean DEFAULT false,
  delivery_linked boolean DEFAULT false,
  -- 연동 자격증명 (암호화 저장)
  crefia_credentials jsonb DEFAULT '{}',
  hometax_credentials jsonb DEFAULT '{}',
  delivery_credentials jsonb DEFAULT '{}',
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.sales_collection_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sales config"
  ON public.sales_collection_config
  FOR ALL USING (auth.uid() = user_id);

-- 2. 수집된 매출 데이터
CREATE TABLE IF NOT EXISTS public.collected_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  sale_date date NOT NULL,
  source text NOT NULL CHECK (source IN ('manual', 'card-crefia', 'cash-receipt', 'delivery-app', 'tax-invoice')),
  amount integer NOT NULL,       -- 원 단위
  fee integer DEFAULT 0,         -- 수수료 (원)
  net_amount integer,            -- 실수령액 (원)
  card_company text,             -- "신한", "삼성" 등
  delivery_app text,             -- "배달의민족", "쿠팡이츠"
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  -- 동일 날짜+소스+카드사 중복 방지
  UNIQUE(user_id, sale_date, source, card_company)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_collected_sales_user_date
  ON public.collected_sales(user_id, sale_date DESC);

CREATE INDEX IF NOT EXISTS idx_collected_sales_source
  ON public.collected_sales(user_id, source);

-- RLS
ALTER TABLE public.collected_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own collected sales"
  ON public.collected_sales
  FOR ALL USING (auth.uid() = user_id);

-- 3. 수집 로그 (디버깅/감사용)
CREATE TABLE IF NOT EXISTS public.sales_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  source text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  records_fetched integer DEFAULT 0,
  records_saved integer DEFAULT 0,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sales_sync_log_user
  ON public.sales_sync_log(user_id, started_at DESC);

ALTER TABLE public.sales_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own sync logs"
  ON public.sales_sync_log
  FOR SELECT USING (auth.uid() = user_id);
