-- 결제 도용/중복 방지: portone_payment_id 는 전역 UNIQUE 여야 함.
-- billing/verify 의 사전 중복조회(select)는 TOCTOU race 가 있으므로 DB 제약으로 못박는다.
-- 동일 PAID 결제 ID 를 두 계정이 동시에 검증 시 두 번째 insert 가 실패하도록.

-- 기존 중복 데이터가 있으면 제약 추가가 실패하므로, 중복 정리 후 추가.
-- (출시 전이라 실데이터 거의 없음 — 안전)
DELETE FROM foundone_payments a
USING foundone_payments b
WHERE a.ctid < b.ctid
  AND a.portone_payment_id = b.portone_payment_id;

ALTER TABLE foundone_payments
  ADD CONSTRAINT foundone_payments_portone_payment_id_key UNIQUE (portone_payment_id);
