-- 2026-05-01: "내 가게" 페이지 — 회계·정적 정보 컬럼 추가
-- 모든 80개 세부업종 cover. AI 호출 0 — 사용자 입력 + 룰 기반 산수만.
-- jsonb 위주로 유연하게 — 세부업종별 추가 필드는 industry_specifics 안에.

ALTER TABLE user_store_data
  -- Identity & Location (Hero용)
  ADD COLUMN IF NOT EXISTS short_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS long_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS address_road text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS address_detail text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS region_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS latitude double precision DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitude double precision DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS phone text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS owner_phone text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS website_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS instagram_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS naver_place_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS kakao_place_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS weekly_holidays jsonb DEFAULT '[]'::jsonb,    -- ["mon","tue"]
  ADD COLUMN IF NOT EXISTS break_time text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS store_photos jsonb DEFAULT '[]'::jsonb,        -- [{url, caption}]

  -- Financial Snapshot (수동 입력 잔고 + 운영 시작일은 별도 컬럼 이미 있음)
  ADD COLUMN IF NOT EXISTS current_balance_manual_krw bigint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_balance_updated_at timestamptz DEFAULT NULL,

  -- Legal & Compliance (단일 필드 + permits 배열)
  ADD COLUMN IF NOT EXISTS biz_registration_number text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS biz_registration_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS biz_registration_type text DEFAULT NULL,    -- simplified|standard|vat-exempt|corporation
  ADD COLUMN IF NOT EXISTS industry_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS telecom_sales_number text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS four_insurance_established text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS permits jsonb DEFAULT '[]'::jsonb,           -- [{name, kind, issuedAt, expiresAt, ...}]

  -- Money Infrastructure
  ADD COLUMN IF NOT EXISTS biz_bank_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS biz_bank_account_masked text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS biz_card_issued text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pos_terminal text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tax_handling text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cpa_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cpa_phone text DEFAULT NULL,

  -- People & Vendors (배열) — 기존 employees/vendors 와 별개의 통합 명부
  ADD COLUMN IF NOT EXISTS people_directory jsonb DEFAULT '[]'::jsonb,

  -- Insurance (배열)
  ADD COLUMN IF NOT EXISTS insurance_policies jsonb DEFAULT '[]'::jsonb,

  -- Footprint (오프라인=tenancy, 온라인=digital, 출장형=mobile)
  ADD COLUMN IF NOT EXISTS tenancy jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS digital_footprint jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS vehicles jsonb DEFAULT '[]'::jsonb,

  -- Industry-specific (카테고리별 배열·필드 모두 여기에)
  -- 키 구조: { "menu-ingredients": [...], "kitchen-assets": [...], ... }
  ADD COLUMN IF NOT EXISTS industry_specifics jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN user_store_data.industry_specifics IS '카테고리별 동적 섹션 데이터 — { sectionId: array_or_object }';
COMMENT ON COLUMN user_store_data.permits IS '인허가 배열 — 만료일 D-day 추적';
COMMENT ON COLUMN user_store_data.insurance_policies IS '보험 배열 — 갱신일 D-day 추적';
