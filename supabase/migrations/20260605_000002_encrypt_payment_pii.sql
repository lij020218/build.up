-- ════════════════════════════════════════════════════════════════════════
--  결제 고객 PII 봉투 암호화 (2026-06-05 보안 감사 P1)
--
--  배경: portone_payments.customer_email 이 평문 저장 + raw jsonb 에도 고객 PII 포함.
--    RLS 로 본인 결제건만 접근되지만(횡적 안전), DB 백업/덤프 유출·토큰 탈취 시 평문 노출.
--    현재 customer_email 은 어디서도 읽지/표시하지 않음(write-only). 향후 단골 win-back
--    기능에서 서버가 복호화해 사용할 수 있도록 봉투 암호화로 전환.
--
--  조치:
--    1. customer_email_enc jsonb 컬럼 추가 (envelope-crypto EnvelopedSecret 보관).
--    2. 쓰기 경로(portone sync/webhook/cron)는 평문 customer_email=null + enc 저장 +
--       raw 의 고객 PII 레닥션 (코드 변경, 같은 커밋).
--    3. 기존 평문 customer_email 은 즉시 노출 축소를 위해 null 처리.
--       (SQL 에선 KEK 접근 불가라 암호화 불가 → 다음 동기화 때 enc 로 재적재됨. upsert 키
--        (user_id, payment_id) 라 재동기화가 자동 교체. 현재 미사용 데이터라 기능 영향 없음.)
--
--  멱등: 재실행 안전.
-- ════════════════════════════════════════════════════════════════════════

alter table public.portone_payments
  add column if not exists customer_email_enc jsonb;

comment on column public.portone_payments.customer_email_enc is
  '봉투암호화된 고객 이메일(envelope-crypto EnvelopedSecret). 평문 customer_email 대체. 서버에서만 복호화.';

-- 기존 평문 PII 제거 (재동기화 시 암호화 형태로 복원).
update public.portone_payments
  set customer_email = null
  where customer_email is not null;
