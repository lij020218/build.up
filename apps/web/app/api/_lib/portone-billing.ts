/**
 * portone-billing.ts — 포트원 V2 빌링키 *결제(POST)* 헬퍼.
 *
 * ★ portone-client.ts 와 분리한 이유 ★
 *   portone-client.ts 는 READ-ONLY(GET 전용) 안전 불변식을 가진다(시크릿 유출 시에도 결제·환불 불가).
 *   정기결제는 본질적으로 "돈을 청구"하는 POST 라 그 불변식을 깰 수 없다 → 별도 파일로 격리하고,
 *   호출처를 구독 활성화/갱신 cron 두 곳으로 한정한다.
 *
 * 엔드포인트: POST /payments/{paymentId}/billing-key
 *   docs: https://developers.portone.io/api/rest-v2/payment (PayWithBillingKey)
 */

import { PortOneApiError, type PortOnePayment } from "./portone-client";

const BASE_URL = "https://api.portone.io";
const DEFAULT_TIMEOUT_MS = 30_000;

export type PayWithBillingKeyInput = {
  apiSecret: string;
  storeId?: string;
  channelKey?: string;
  /** 가맹점 고유 결제 식별자 — 멱등 키. 호출처에서 생성. */
  paymentId: string;
  billingKey: string;
  orderName: string;
  amount: number; // 원 (KRW)
  currency?: string;
  /** 결제-사용자 바인딩 — userId 를 customer.id 로 항상 전달. */
  customerId: string;
  timeoutMs?: number;
};

/**
 * 빌링키로 즉시 청구. 성공 시 status==="PAID" 인 PortOnePayment 반환.
 * 실패는 PortOneApiError throw (호출처에서 dunning 처리).
 */
export async function payWithBillingKey(input: PayWithBillingKeyInput): Promise<PortOnePayment> {
  const {
    apiSecret, storeId, channelKey, paymentId, billingKey,
    orderName, amount, currency = "KRW", customerId,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = input;

  if (!apiSecret || apiSecret.length < 10) {
    throw new PortOneApiError(0, "CONFIG", "PortOne apiSecret 누락");
  }

  const url = `${BASE_URL}/payments/${encodeURIComponent(paymentId)}/billing-key`;
  const body = {
    billingKey,
    ...(storeId ? { storeId } : {}),
    ...(channelKey ? { channelKey } : {}),
    orderName,
    amount: { total: amount },
    currency,
    customer: { id: customerId },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `PortOne ${apiSecret}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await res.text();
    let json: unknown = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }

    if (!res.ok) {
      const err = (json as { type?: string; message?: string } | null) ?? {};
      throw new PortOneApiError(
        res.status,
        err.type ?? `HTTP_${res.status}`,
        err.message ?? `빌링키 결제 실패 (${res.status})`,
        json,
      );
    }

    // 응답은 { payment: {...} } 또는 결제 객체 직접 — 양쪽 모두 수용.
    const payment = ((json as { payment?: PortOnePayment } | null)?.payment ?? json) as PortOnePayment;
    if (!payment || !payment.status) {
      throw new PortOneApiError(0, "BAD_RESPONSE", "빌링키 결제 응답 형식 오류", json);
    }
    return payment;
  } catch (e) {
    if (e instanceof PortOneApiError) throw e;
    if ((e as Error).name === "AbortError") {
      throw new PortOneApiError(0, "TIMEOUT", `빌링키 결제 timeout ${timeoutMs}ms`);
    }
    throw new PortOneApiError(0, "NETWORK_ERROR", (e as Error).message ?? "네트워크 오류");
  } finally {
    clearTimeout(timeoutId);
  }
}

/** 카드 결제수단 라벨 추출 — "신한카드" 등. 실패 시 null. */
export function billingMethodLabelFrom(payment: PortOnePayment): string | null {
  const m = payment.method as unknown as { card?: { name?: string; publisher?: string; issuer?: string } } | undefined;
  return m?.card?.name ?? m?.card?.publisher ?? m?.card?.issuer ?? null;
}
