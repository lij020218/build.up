-- ─── 고객 관리 테이블 ──────────────────────────────────────────────────────
-- 업종별 고객관리 모델(membership/appointment/repeat/pipeline/ecommerce)에
-- 공통으로 사용할 수 있는 유연한 고객 테이블.
-- 각 모델별 특화 필드는 JSONB meta 컬럼에 저장합니다.

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ── 기본 정보 ──
  name text NOT NULL,
  phone text,
  email text,
  notes text,                          -- 메모 (시술 선호, 알레르기, 특이사항 등)
  tags text[] DEFAULT '{}',            -- 태그 (VIP, 신규, 이탈위험 등)

  -- ── 업종별 모델 구분 ──
  customer_mode text NOT NULL DEFAULT 'repeat',  -- membership | appointment | repeat | pipeline | ecommerce

  -- ── 방문/구매 이력 요약 ──
  total_visits int DEFAULT 0,          -- 총 방문/구매 횟수
  total_spent bigint DEFAULT 0,        -- 총 지출 금액 (원)
  last_visit_at timestamptz,           -- 마지막 방문/구매일
  first_visit_at timestamptz,          -- 첫 방문/구매일

  -- ── membership 전용 (피트니스, 교육, 공간) ──
  -- meta.membership_type: "monthly" | "package" | "annual"
  -- meta.membership_start: ISO date
  -- meta.membership_end: ISO date
  -- meta.remaining_sessions: number
  -- meta.auto_renew: boolean

  -- ── appointment 전용 (뷰티, 펫) ──
  -- meta.preferred_staff: string
  -- meta.last_service: string (마지막 시술 내용)
  -- meta.preferences: string[] (선호 사항)
  -- meta.allergy: string (알레르기/주의사항)

  -- ── pipeline 전용 (스타트업) ──
  -- meta.stage: "lead" | "contacted" | "meeting" | "proposal" | "negotiation" | "closed_won" | "closed_lost"
  -- meta.deal_value: number
  -- meta.source: string (유입 경로)
  -- meta.assigned_to: string

  -- ── ecommerce 전용 (소매, 온라인) ──
  -- meta.address: string
  -- meta.order_count: number
  -- meta.avg_order_value: number
  -- meta.last_review: string

  -- ── repeat 전용 (음식점, 카페) ──
  -- meta.stamp_count: number (적립 횟수)
  -- meta.favorite_menu: string[]
  -- meta.birthday: string (MM-DD)

  meta jsonb DEFAULT '{}',             -- 업종별 특화 데이터

  -- ── 시스템 ──
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_customers_mode ON customers(user_id, customer_mode) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON customers(user_id, last_visit_at DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_customers_tags ON customers USING gin(tags) WHERE is_active = true;

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own customers" ON customers
  FOR ALL USING (auth.uid() = user_id);

-- ─── 고객 방문/거래 기록 테이블 ──────────────────────────────────────────────
-- 각 방문, 예약, 구매, 미팅 등을 개별 기록합니다.

CREATE TABLE IF NOT EXISTS public.customer_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  visit_type text NOT NULL DEFAULT 'visit',  -- visit | appointment | purchase | meeting | class
  visit_date timestamptz NOT NULL DEFAULT now(),
  amount bigint DEFAULT 0,                   -- 결제 금액 (원)
  service_name text,                         -- 시술명, 메뉴명, 상품명, 미팅 제목
  staff_name text,                           -- 담당 직원/강사
  notes text,                                -- 메모
  meta jsonb DEFAULT '{}',                   -- 추가 데이터

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_visits_customer ON customer_visits(customer_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_customer_visits_user ON customer_visits(user_id, visit_date DESC);

ALTER TABLE customer_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own customer visits" ON customer_visits
  FOR ALL USING (auth.uid() = user_id);
