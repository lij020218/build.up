/**
 * tossplace-client.ts — TOSS Place Open API 클라이언트
 *
 * 한국 POS 중 유일하게 깨끗한 Open API + Webhook + Access Key/Secret 모델 (2026-04 기준).
 * 신규 가맹점 모집 25%+ (단말기 20만 돌파, 2025-10).
 *
 * ★ READ-ONLY 강제 ★
 *  - Order/Payment 모두 GET 만 사용 (POST/PUT/DELETE 없음)
 *  - 사장님이 자기 매장 대시보드에서 "앱 사용 활성화" 토글로 명시 동의
 *
 * Base URL: https://api.tossplace.com
 * 인증: Authorization: Bearer {Access Token} — Access Key + Secret 으로 발급
 *
 * 출처: https://docs.tossplace.com/reference/open-api/intro.html
 */

const BASE_URL = "https://api.tossplace.com";
const DEFAULT_TIMEOUT_MS = 60_000;

// ─── 타입 ──────────────────────────────────────────────────────────────

export type TossOrderStatus = "REQUESTED" | "OPENED" | "COMPLETED" | "CANCELLED";
export type TossPaymentMethod = "CARD" | "CASH" | "EASY_PAY" | "TRANSFER" | "GIFT_CARD" | "CRYPTO";

export type TossPlaceOrder = {
  orderId: string;
  merchantId: string;
  status: TossOrderStatus;
  channel?: string;            // OFFLINE | DELIVERY | TAKE_OUT | PICKUP
  totalAmount: number;
  taxFreeAmount?: number;
  vat?: number;
  serviceCharge?: number;
  discount?: number;
  requestedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  lineItems?: Array<{
    productId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    options?: Array<{ name: string; value: string; price?: number }>;
  }>;
  payments?: TossPlacePayment[];
};

export type TossPlacePayment = {
  paymentId: string;
  orderId: string;
  merchantId: string;
  amount: number;
  vat?: number;
  serviceCharge?: number;
  approvedAt?: string;
  cancelledAt?: string;
  approvalNumber?: string;
  method: TossPaymentMethod;
  card?: {
    type?: string;             // CREDIT | DEBIT | PREPAID | OVERSEAS
    brand?: string;            // VISA | MASTER | AMEX | JCB | LOCAL
    issuerName?: string;
    acquirerName?: string;
    maskedNumber?: string;
    installmentMonths?: number;
  };
  easyPay?: { provider?: string };
  cashReceipt?: { type?: string; identifier?: string };
};

export type GetOrdersResponse = {
  items: TossPlaceOrder[];
  page: { number: number; size: number; totalCount?: number };
  hasMore?: boolean;
  nextCursor?: string;
};

// ─── 오류 ──────────────────────────────────────────────────────────────

export class TossPlaceApiError extends Error {
  status: number;
  errorCode: string;
  raw?: unknown;
  constructor(status: number, code: string, message: string, raw?: unknown) {
    super(message);
    this.name = "TossPlaceApiError";
    this.status = status;
    this.errorCode = code;
    this.raw = raw;
  }
}

// ─── 클라이언트 ────────────────────────────────────────────────────────

export type TossPlaceClientOptions = {
  /** Access Key (개발자센터에서 앱 등록 시 발급) */
  accessKey: string;
  /** Access Secret — 발급 시 1회만 노출. 봉투 암호화 후 저장 권장 */
  accessSecret: string;
  /** 가맹점 ID — 사장님이 입력 (자기 매장 ID) */
  merchantId: string;
  timeoutMs?: number;
};

export class TossPlaceClient {
  private readonly accessKey: string;
  private readonly accessSecret: string;
  private readonly merchantId: string;
  private readonly timeoutMs: number;
  private cachedToken: { token: string; expiresAt: number } | null = null;

  constructor(opts: TossPlaceClientOptions) {
    if (!opts.accessKey || !opts.accessSecret || !opts.merchantId) {
      throw new Error("[TossPlaceClient] accessKey, accessSecret, merchantId 모두 필요합니다.");
    }
    this.accessKey = opts.accessKey;
    this.accessSecret = opts.accessSecret;
    this.merchantId = opts.merchantId;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Access Token 발급/갱신.
   * Access Key + Secret 을 Basic Auth 로 보내고 Bearer Token 받음.
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt - 30_000 > now) {
      return this.cachedToken.token;
    }

    const auth = Buffer.from(`${this.accessKey}:${this.accessSecret}`).toString("base64");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${BASE_URL}/api-public/openapi/v1/auth/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
        signal: controller.signal,
        cache: "no-store",
      });
      const text = await res.text();
      const json = text ? safeJson(text) as { accessToken?: string; expiresIn?: number; error?: string; message?: string } : null;
      if (!res.ok || !json?.accessToken) {
        throw new TossPlaceApiError(
          res.status,
          json?.error ?? "AUTH_FAILED",
          json?.message ?? `토큰 발급 실패 (HTTP ${res.status})`,
          json
        );
      }
      const expiresIn = json.expiresIn ?? 3600; // 초
      this.cachedToken = {
        token: json.accessToken,
        expiresAt: now + expiresIn * 1000,
      };
      return json.accessToken;
    } catch (e) {
      if (e instanceof TossPlaceApiError) throw e;
      if ((e as Error).name === "AbortError") {
        throw new TossPlaceApiError(0, "TIMEOUT", "TOSS Place 토큰 발급 timeout");
      }
      throw new TossPlaceApiError(0, "NETWORK_ERROR", (e as Error).message ?? "Network error");
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * READ-ONLY 강제 — GET 만 가능.
   */
  private async fetchJson<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
    const token = await this.getAccessToken();
    const url = new URL(`${BASE_URL}${path}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url.toString(), {
        method: "GET", // ← 절대 변경 금지
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      });
      const text = await res.text();
      const json = text ? safeJson(text) : null;
      if (!res.ok) {
        const err = (json as { code?: string; message?: string } | null) ?? {};
        throw new TossPlaceApiError(
          res.status,
          err.code ?? `HTTP_${res.status}`,
          err.message ?? `TOSS Place API error ${res.status}`,
          json
        );
      }
      return (json as T) ?? ({} as T);
    } catch (e) {
      if (e instanceof TossPlaceApiError) throw e;
      if ((e as Error).name === "AbortError") {
        throw new TossPlaceApiError(0, "TIMEOUT", `TOSS Place API timeout`);
      }
      throw new TossPlaceApiError(0, "NETWORK_ERROR", (e as Error).message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ─── 공개 API: GET 만 ─────────────────────────────────────────────

  /**
   * 단건 주문 조회.
   */
  async getOrder(orderId: string): Promise<TossPlaceOrder> {
    return this.fetchJson<TossPlaceOrder>(
      `/api-public/openapi/v1/merchants/${encodeURIComponent(this.merchantId)}/order/orders/${encodeURIComponent(orderId)}`
    );
  }

  /**
   * 다건 주문 조회 (시간 범위 + 필터).
   */
  async getOrders(params: {
    /** RFC 3339 — 예 "2026-04-01T00:00:00+09:00" */
    from: string;
    until: string;
    status?: TossOrderStatus[];
    pageSize?: number;
    cursor?: string;
  }): Promise<GetOrdersResponse> {
    return this.fetchJson<GetOrdersResponse>(
      `/api-public/openapi/v1/merchants/${encodeURIComponent(this.merchantId)}/order/orders`,
      {
        from: params.from,
        until: params.until,
        ...(params.status && params.status.length > 0 ? { status: params.status.join(",") } : {}),
        size: params.pageSize ?? 100,
        ...(params.cursor ? { cursor: params.cursor } : {}),
      }
    );
  }

  /**
   * 단건 결제 조회.
   */
  async getPayment(paymentId: string): Promise<TossPlacePayment> {
    return this.fetchJson<TossPlacePayment>(
      `/api-public/openapi/v1/merchants/${encodeURIComponent(this.merchantId)}/payment/payments/${encodeURIComponent(paymentId)}`
    );
  }

  /**
   * 검증용 — 가벼운 호출 1회. 어제~오늘 주문 1건 요청.
   */
  async validate(): Promise<{ ok: boolean; testCallStatus: number; sampleCount: number }> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    try {
      const result = await this.getOrders({
        from: yesterday.toISOString(),
        until: now.toISOString(),
        pageSize: 1,
      });
      return { ok: true, testCallStatus: 200, sampleCount: result.items.length };
    } catch (e) {
      if (e instanceof TossPlaceApiError) {
        return { ok: false, testCallStatus: e.status, sampleCount: 0 };
      }
      throw e;
    }
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
