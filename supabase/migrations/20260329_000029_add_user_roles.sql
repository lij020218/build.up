-- ─── 사용자 역할 추가 ──────────────────────────────────────────────────────
-- business_profiles에 user_role 컬럼 추가
-- 'owner' = 경영자(사장), 'staff' = 직원
-- 기존 사용자는 모두 owner로 기본 설정

ALTER TABLE public.business_profiles
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'owner'
CHECK (user_role IN ('owner', 'staff', 'manager'));

-- 기존 사용자 모두 owner로 설정
UPDATE public.business_profiles SET user_role = 'owner' WHERE user_role IS NULL;

-- 직원 초대 시 사용할 store_invites 테이블
CREATE TABLE IF NOT EXISTS public.store_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'manager')),
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 직원이 사장님 가게에 연결되는 테이블
CREATE TABLE IF NOT EXISTS public.store_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'manager')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_user_id, member_user_id)
);

-- RLS: 본인 데이터만 접근 (기존 정책 유지)
ALTER TABLE public.store_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invites" ON public.store_invites
  FOR ALL USING (owner_user_id = auth.uid() OR used_by = auth.uid());

CREATE POLICY "Members can view own memberships" ON public.store_members
  FOR SELECT USING (owner_user_id = auth.uid() OR member_user_id = auth.uid());

CREATE POLICY "Owners can manage members" ON public.store_members
  FOR ALL USING (owner_user_id = auth.uid());
