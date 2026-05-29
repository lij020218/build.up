/**
 * codef-client.ts — CODEF API 클라이언트 (PoC).
 *
 * CODEF = 한국 마이데이터·금융데이터 통합 중계 플랫폼.
 * 카카오페이·뱅크샐러드·페이코·캐시노트가 사용.
 *
 * Found.One 가치: 마이데이터 사업자 인가 없이도 사장님 위임 받아
 *               여신금융협회 매통조 (10개 카드사 매출) 자동 fetch.
 *
 * 인증: OAuth 2.0 client_credentials (CODEF Client ID/Secret 환경변수)
 *      → Access Token (24h)
 *
 * 사용자 위임 (connectedId):
 *   사장님이 사업자번호 + 대표자생년월일 + 카드사 입금계좌 입력 →
 *   POST /v1/account/create → connectedId 발급
 *   → 이후 모든 조회 호출에 connectedId 사용
 *
 * Read-only 강제: 조회 API (member-store, purchase, deposit, approval) 만 사용.
 *
 * 출처: https://developer.codef.io/
 */

import { getEnvVar } from "./env";

export type CodefEnv = "sandbox" | "production";
const BASE_URLS: Record<CodefEnv, string> = {
  sandbox: "https://development.codef.io",
  production: "https://api.codef.io",
};
const OAUTH_URL = "https://oauth.codef.io/oauth/token";

export class CodefApiError extends Error {
  resultCode: string;
  resultMessage: string;
  raw?: unknown;
  constructor(code: string, message: string, raw?: unknown) {
    super(message);
    this.name = "CodefApiError";
    this.resultCode = code;
    this.resultMessage = message;
    this.raw = raw;
  }
}

export type CodefAccountResult = {
  connectedId: string;
};

export type CodefCardSale = {
  cardCompany: string;
  approvalNumber: string;
  approvedAt: string; // ISO
  amount: number;
  vat?: number;
  serviceCharge?: number;
  cardBrand?: string;
  installmentMonths?: number;
  status: "approved" | "cancelled";
  raw?: Record<string, unknown>;
};

/** CODEF 기업 수시입출 거래내역 단건 raw (resTrHistoryList 원본). */
export type CodefBankTxRaw = {
  resAccountTrDate?: string;       // YYYYMMDD
  resAccountTrTime?: string;       // HHMMSS
  resAccountIn?: string;           // 입금액 (string)
  resAccountOut?: string;          // 출금액 (string)
  resAfterTranBalance?: string;    // 잔액
  resAccountDesc1?: string;
  resAccountDesc2?: string;
  resAccountDesc3?: string;
  resAccountDesc4?: string;
  [k: string]: unknown;
};

// ─── 클라이언트 ────────────────────────────────────────────────────────

export class CodefClient {
  private cachedToken: { token: string; expiresAt: number } | null = null;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly env: CodefEnv;

  constructor(opts?: { env?: CodefEnv }) {
    this.env = opts?.env ?? (getEnvVar("CODEF_ENV") as CodefEnv) ?? "sandbox";
    const id = getEnvVar(this.env === "production" ? "CODEF_PROD_CLIENT_ID" : "CODEF_CLIENT_ID");
    const secret = getEnvVar(this.env === "production" ? "CODEF_PROD_CLIENT_SECRET" : "CODEF_CLIENT_SECRET");
    if (!id || !secret) {
      throw new CodefApiError(
        "CODEF_NOT_CONFIGURED",
        `CODEF Client ID/Secret 미설정 (env: ${this.env}). developer.codef.io 가입 후 환경변수 채워 주세요.`
      );
    }
    this.clientId = id;
    this.clientSecret = secret;
  }

  /**
   * Access Token 발급 (Basic Auth → Bearer Token).
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt - 60_000 > now) {
      return this.cachedToken.token;
    }
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const res = await fetch(OAUTH_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&scope=read",
      cache: "no-store",
    });
    const text = await res.text();
    const json = text ? safeJson(text) as { access_token?: string; expires_in?: number; error?: string } : null;
    if (!res.ok || !json?.access_token) {
      throw new CodefApiError("AUTH_FAILED", json?.error ?? `토큰 발급 실패 (HTTP ${res.status})`, json);
    }
    this.cachedToken = {
      token: json.access_token,
      expiresAt: now + (json.expires_in ?? 86_400) * 1000,
    };
    return json.access_token;
  }

  /**
   * 공통 호출 — CODEF 응답은 URL-encoded JSON 으로 옴.
   */
  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const token = await this.getAccessToken();
    const url = `${BASE_URLS[this.env]}${path}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    // CODEF 의 특수성: 응답 본문이 URL-encoded
    const text = await res.text();
    let decoded = text;
    try {
      decoded = decodeURIComponent(text);
    } catch { /* leave as-is */ }
    const json = decoded ? safeJson(decoded) : null;
    if (!res.ok || !json) {
      throw new CodefApiError(`HTTP_${res.status}`, `CODEF API 오류 (HTTP ${res.status})`, json);
    }
    const result = json as { result?: { code?: string; message?: string }; data?: T };
    if (result.result && result.result.code !== "CF-00000") {
      throw new CodefApiError(result.result.code ?? "UNKNOWN", result.result.message ?? "CODEF 오류", json);
    }
    return (result.data as T) ?? ({} as T);
  }

  /**
   * 사업자 계정 등록 → connectedId 발급.
   * 사장님이 입력한 정보 (사업자번호 + 대표자 생년월일 + 카드사 입금계좌) 전달.
   */
  async createBusinessAccount(input: {
    businessNumber: string;
    representativeBirthday: string; // YYYYMMDD
    cardCompany: string;
    bankAccountNumber: string;
  }): Promise<CodefAccountResult> {
    return this.post<CodefAccountResult>("/v1/account/create", {
      accountList: [
        {
          countryCode: "KR",
          businessType: "BS", // 사업자
          clientType: "P",
          organization: input.cardCompany,
          loginType: "1",
          id: input.businessNumber,
          password: input.representativeBirthday, // 임시 비밀번호 자리
          ext1: input.bankAccountNumber,
        },
      ],
    });
  }

  /**
   * 여신금융협회 매통조 — 매입내역 (가맹점 카드매출).
   * GET 처럼 동작하지만 CODEF 는 POST + body 패턴.
   */
  async getMemberStorePurchase(input: {
    connectedId: string;
    startDate: string; // YYYYMMDD
    endDate: string;
    organization?: string; // 카드사 코드 — 미입력 시 통합조회
  }): Promise<{ resList: CodefCardSale[] }> {
    return this.post<{ resList: CodefCardSale[] }>(
      "/v1/kr/card/each/c/purchase",
      {
        connectedId: input.connectedId,
        organization: input.organization ?? "0301",
        startDate: input.startDate,
        endDate: input.endDate,
      }
    );
  }

  /**
   * 기업 은행 보유계좌 조회 (사장님 사업자 계좌 목록).
   * developer.codef.io/products/bank/common/b/account
   */
  async getBusinessBankAccountList(input: {
    connectedId: string;
    organization: string;          // 은행 코드 (예: 0004=KB)
  }): Promise<{
    resAccountList: Array<{
      resAccount?: string;
      resAccountName?: string;
      resAccountDisplay?: string;
      resAccountStartDate?: string;
      resAccountBalance?: string;
      [k: string]: unknown;
    }>;
  }> {
    return this.post("/v1/kr/bank/b/account/account-list", {
      connectedId: input.connectedId,
      organization: input.organization,
    });
  }

  /**
   * 기업 수시입출 거래내역 조회.
   * developer.codef.io/products/bank/common/b/transaction
   *
   * orderBy: "0"(최신순) | "1"(과거순)
   * inquiryType: "1"(전체) | "2"(입금) | "3"(출금)
   */
  async getBusinessBankTransactions(input: {
    connectedId: string;
    organization: string;
    account: string;              // hyphen 제거
    startDate: string;            // YYYYMMDD
    endDate: string;
    orderBy?: "0" | "1";
    inquiryType?: "1" | "2" | "3";
    accountPassword?: string;     // 일부 은행 필수 — RSA 암호화 전제
  }): Promise<{
    resTrHistoryList?: CodefBankTxRaw[];
    resAccountBalance?: string;
    resLastTranDate?: string;
    [k: string]: unknown;
  }> {
    return this.post("/v1/kr/bank/b/account/transaction-list", {
      connectedId: input.connectedId,
      organization: input.organization,
      account: input.account,
      startDate: input.startDate,
      endDate: input.endDate,
      orderBy: input.orderBy ?? "1",
      inquiryType: input.inquiryType ?? "1",
      accountPassword: input.accountPassword ?? "",
    });
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
