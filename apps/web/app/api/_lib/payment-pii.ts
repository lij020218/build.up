/**
 * payment-pii.ts — 결제 동기화로 들어오는 고객 PII(이메일 등) 보호.
 *
 * 정책 (2026-06-05 보안 감사):
 *   - 고객 이메일은 평문으로 DB 에 저장하지 않는다. 봉투 암호화(envelope-crypto)된
 *     jsonb 로만 저장하고, win-back 등 *서버* 기능에서만 복호화한다.
 *   - 결제 raw 응답(스키마 변경 대비용)에서도 고객 PII(email/name/phone)는 제거 후 보관.
 *   - KEK 미설정 등으로 암호화 불가 시 **평문 fallback 절대 금지** → null 저장.
 */
import { envelopeEncrypt, envelopeDecrypt, type EnvelopedSecret } from "./envelope-crypto";

/** 이메일을 봉투 암호화 → DB jsonb 저장용. 없거나 암호화 불가 시 null. */
export function sealEmail(email: string | null | undefined): EnvelopedSecret | null {
  const v = (email ?? "").trim();
  if (!v) return null;
  try {
    return envelopeEncrypt(v);
  } catch {
    // KEK 없음 등 — 평문 저장 대신 포기(null). PII 평문 유출 방지가 우선.
    return null;
  }
}

/** 저장된 봉투에서 이메일 복호화 (win-back 등 서버 전용). 실패 시 null. 결과를 로그에 남기지 말 것. */
export function openEmail(enc: EnvelopedSecret | null | undefined): string | null {
  if (!enc) return null;
  try {
    return envelopeDecrypt(enc);
  } catch {
    return null;
  }
}

/**
 * 결제 raw 응답에서 고객 PII 제거. PortOne 응답은 PII 가 `customer` 블록에 모여 있으므로
 * customer.id(식별자, 비-PII)는 보존하고 email/name/phone 만 제거한다. 나머지 raw 는 그대로
 * 보관(스키마 변경 대비 목적 유지).
 */
export function redactPaymentRaw<T>(raw: T): T {
  if (!raw || typeof raw !== "object") return raw;
  const root = raw as Record<string, unknown>;
  const cust = root.customer;
  if (!cust || typeof cust !== "object") return raw;
  return {
    ...root,
    customer: {
      ...(cust as Record<string, unknown>),
      email: null,
      name: null,
      phoneNumber: null,
      phone: null,
    },
  } as T;
}
