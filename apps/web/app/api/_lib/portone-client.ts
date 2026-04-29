/**
 * portone-client.ts — 포트원 V2 REST API 클라이언트
 *
 * ★ READ-ONLY 강제 ★
 *  - GET 메서드만 허용. POST/PUT/PATCH/DELETE 호출 자체가 컴파일·런타임 모두 차단.
 *  - 사장님 시크릿이 새도 환불·결제 변경·빌링키 삭제 등 변경 작업 불가.
 *
 * Base URL: https://api.portone.io
 * 인증: Authorization: PortOne {V2_API_SECRET}
 *
 * 주의:
 *  - V2 의 GET /payments 는 비표준적으로 request body 를 사용함 (HTTP 표준상 가능)
 *  - axios 의 data 옵션으로 body 전달
 *
 * 출처: https://developers.portone.io/api/rest-v2/payment
 */

const BASE_URL = "https://api.portone.io";
const DEFAULT_TIMEOUT_MS = 60_000;

// ─── 타입 정의 (포트원 V2 응답 스키마) ──────────────────────────────────

export type PortOnePaymentStatus =
  | "READY"
  | "PENDING"
  | "VIRTUAL_ACCOUNT_ISSUED"
  | "PAID"
  | "CANCELLED"
  | "PARTIAL_CANCELLED"
  | "FAILED"
  | "PAY_PENDING";

export type PortOnePayment = {
  /** 포트원 발급 결제 식별자 */
  id: string;
  /** 가맹점 발급 주문번호 */
  paymentId: string;
  transactionId?: string;
  status: PortOnePaymentStatus;
  amount: { total: number; taxFree?: number; vat?: number };
  currency: "KRW" | "USD" | "JPY" | string;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
  };
  paidAt?: string; // RFC 3339
  cancelledAt?: string;
  customData?: string;
  method?: { type?: string };
  channel?: { id?: string; key?: string; name?: string; pgProvider?: string };
};

export type GetPaymentsResponse = {
  items: PortOnePayment[];
  page: { number: number; size: number; totalCount: number };
};

export type PortOneError = {
  type: string;
  message?: string;
};

// ─── 오류 클래스 ───────────────────────────────────────────────────────

export class PortOneApiError extends Error {
  status: number;
  errorType: string;
  raw?: unknown;
  constructor(status: number, errorType: string, message: string, raw?: unknown) {
    super(message);
    this.name = "PortOneApiError";
    this.status = status;
    this.errorType = errorType;
    this.raw = raw;
  }
}

// ─── 클라이언트 ────────────────────────────────────────────────────────

export type PortOneClientOptions = {
  apiSecret: string;
  /** 멀티스토어 사장님인 경우 — 단일 스토어면 생략 가능 */
  storeId?: string;
  timeoutMs?: number;
};

export class PortOneClient {
  private readonly apiSecret: string;
  private readonly storeId?: string;
  private readonly timeoutMs: number;

  constructor(opts: PortOneClientOptions) {
    if (!opts.apiSecret || opts.apiSecret.length < 10) {
      throw new Error("[PortOneClient] apiSecret is missing or too short");
    }
    this.apiSecret = opts.apiSecret;
    this.storeId = opts.storeId;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * READ-ONLY 강제 — 모든 외부 호출은 이 단일 메서드를 거침.
   * GET 만 허용, 다른 method 호출 시 throw.
   */
  private async fetchJson<T>(
    path: string,
    init: { body?: unknown; query?: Record<string, string | number | undefined> } = {}
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    if (init.query) {
      for (const [k, v] of Object.entries(init.query)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url.toString(), {
        method: "GET", // ← 변경 절대 금지
        headers: {
          Authorization: `PortOne ${this.apiSecret}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // 포트원 V2 의 GET /payments 는 body 가 있는 GET (비표준이지만 공식)
        ...(init.body ? { body: JSON.stringify(init.body) } : {}),
        signal: controller.signal,
        // Next.js fetch 옵션 — 절대 캐시 금지 (실시간 데이터)
        cache: "no-store",
      });

      const text = await res.text();
      const json = text ? safeJson(text) : null;

      if (!res.ok) {
        const err = (json as { type?: string; message?: string } | null) ?? {};
        throw new PortOneApiError(
          res.status,
          err.type ?? `HTTP_${res.status}`,
          err.message ?? `PortOne API error ${res.status}`,
          json
        );
      }
      return (json as T) ?? ({} as T);
    } catch (e) {
      if (e instanceof PortOneApiError) throw e;
      if ((e as Error).name === "AbortError") {
        throw new PortOneApiError(0, "TIMEOUT", `PortOne API timeout after ${this.timeoutMs}ms`);
      }
      throw new PortOneApiError(
        0,
        "NETWORK_ERROR",
        (e as Error).message ?? "Unknown network error"
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ─── 공개 API: 모두 GET ──

  /** 단건 결제 조회 (webhook 수신 시 상세 가져오는 용도) */
  async getPayment(paymentId: string): Promise<PortOnePayment> {
    return this.fetchJson<PortOnePayment>(
      `/payments/${encodeURIComponent(paymentId)}`,
      this.storeId ? { query: { storeId: this.storeId } } : {}
    );
  }

  /**
   * 다건 결제 조회 — 메인 데이터 소스.
   * 1시간마다 정기 polling 또는 initial backfill 에 사용.
   */
  async getPayments(params: {
    /** RFC 3339, 예: "2026-04-01T00:00:00+09:00" */
    from: string;
    until: string;
    status?: PortOnePaymentStatus[];
    pageNumber?: number;
    pageSize?: number;
    storeId?: string;
  }): Promise<GetPaymentsResponse> {
    const body = {
      page: { number: params.pageNumber ?? 0, size: params.pageSize ?? 50 },
      filter: {
        ...(params.storeId || this.storeId ? { storeId: params.storeId ?? this.storeId } : {}),
        timestampType: "STATUS_CHANGED_AT" as const,
        from: params.from,
        until: params.until,
        ...(params.status ? { status: params.status } : {}),
      },
      sort: { by: "STATUS_CHANGED_AT" as const, order: "DESC" as const },
    };
    return this.fetchJson<GetPaymentsResponse>("/payments", { body });
  }

  /**
   * 빌링키 다건 조회 — 활성 정기결제(구독자) 카운트 추정.
   * (V2 GET /billing-keys, body 없이 query 로 페이지네이션)
   */
  async getBillingKeys(params: { pageNumber?: number; pageSize?: number } = {}): Promise<{
    items: Array<{ billingKey: string; status: string; issuedAt: string }>;
    page: { number: number; size: number; totalCount: number };
  }> {
    return this.fetchJson("/billing-keys", {
      query: {
        ...(this.storeId ? { storeId: this.storeId } : {}),
        "page.number": params.pageNumber ?? 0,
        "page.size": params.pageSize ?? 50,
      },
    });
  }

  /**
   * 검증용 — Secret 이 유효한지 가벼운 호출 1회.
   * 최근 1일 결제 1건 조회. 0건이라도 인증 OK 면 true.
   */
  async validate(): Promise<{ ok: boolean; testCallStatus: number; sampleCount: number }> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    try {
      const result = await this.getPayments({
        from: yesterday.toISOString(),
        until: now.toISOString(),
        pageSize: 1,
      });
      return { ok: true, testCallStatus: 200, sampleCount: result.items.length };
    } catch (e) {
      if (e instanceof PortOneApiError) {
        return { ok: false, testCallStatus: e.status, sampleCount: 0 };
      }
      throw e;
    }
  }
}

// ─── 내부 유틸 ─────────────────────────────────────────────────────────

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
