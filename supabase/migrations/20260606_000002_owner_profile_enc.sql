-- 20260606_000002_owner_profile_enc.sql
-- 사장님 프로필 PII(출생연도·NCB·폐업검토·장애) 봉투암호화 동기화.
-- 웹 localStorage / iOS UserDefaults 에만 있던 값을 서버 저장소로 이전 →
-- 기기 변경·재설치에도 유지, 웹↔iOS 완전 동기화.
-- 암호화: PORTONE_KEK 인프라(AES-256-GCM 봉투암호화) 재사용.
-- idempotent (IF NOT EXISTS).

ALTER TABLE public.user_store_data
  ADD COLUMN IF NOT EXISTS owner_profile_enc jsonb DEFAULT NULL;
