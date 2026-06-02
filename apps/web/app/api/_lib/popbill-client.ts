/**
 * popbill-client.ts — 팝빌 (Popbill) SDK 래퍼.
 *
 * 팝빌 = 한국 전자세금계산서·홈택스 연동 API 중계 사업자 (LinkHub).
 *
 * Found.One 가치:
 *   - 사장님 사업자번호 → 홈택스 인증서 등록 →
 *     전자세금계산서(매출/매입) 자동 수집 + 현금영수증 자동 수집.
 *   - 부가세 신고 자료, 매출 raw data 가 자동으로 우리 DB 에.
 *
 * 인증:
 *   회원사 LinkID + SecretKey (환경변수, 봉투 암호화 不要 — 우리 자산).
 *   사장님 위임은 사업자번호 + 홈택스 공인인증서 등록 (별도 절차).
 *
 * 패턴:
 *   비동기 Job — RequestJob → GetJobState 폴링 → Search.
 *   jobID 는 1시간 유효.
 *
 * 주의:
 *   popbill SDK 는 callback (success, error) 기반 → promisify.
 *   런타임은 Node.js 만 (CommonJS 동적 require).
 */

import { getEnvVar } from "./env";

export type PopbillTaxinvoiceType = "SELL" | "BUY" | "TRUSTEE";
/** W=작성일자 | I=발행일자 | S=전송일자 */
export type PopbillDateType = "W" | "I" | "S";

export type PopbillJobStateRaw = {
  jobID: string;
  jobState: number;     // 1=대기, 2=진행, 3=완료
  collectStartDate: string;
  collectEndDate: string;
  startDate: string;
  endDate: string;
  errorCode: number;
  errorReason?: string;
  jobStartDT?: string;
  jobEndDT?: string;
  collectTotal: number;
  collectCount: number;
};

export type PopbillTaxinvoiceSummary = {
  ntsConfirmNum?: string;
  writeDate?: string;
  issueDT?: string;
  sendDT?: string;
  invoicerCorpNum?: string;
  invoicerCorpName?: string;
  invoiceeCorpNum?: string;
  invoiceeCorpName?: string;
  taxType?: string;
  purposeType?: string;
  modifyCode?: number;
  supplyCostTotal?: string;
  taxTotal?: string;
  totalAmount?: string;
  [k: string]: unknown;
};

export type PopbillCashbillSummary = {
  confirmNum?: string;
  tradeDate?: string;
  issueDT?: string;
  tradeType?: string;
  tradeUsage?: string;
  supplyCost?: string;
  tax?: string;
  serviceFee?: string;
  totalAmount?: string;
  identityNum?: string;
  [k: string]: unknown;
};

export class PopbillApiError extends Error {
  code: number | string;
  constructor(code: number | string, message: string) {
    super(message);
    this.name = "PopbillApiError";
    this.code = code;
  }
}

// ─── SDK 동적 로드 ──────────────────────────────────────────────────
//
// popbill 패키지는 ESM import 시 type 정의 X + side-effect 로 config 호출 → require 사용.

type PopbillSDK = {
  config(opts: {
    LinkID: string;
    SecretKey: string;
    IsTest: boolean;
    defaultErrorHandler?: (e: unknown) => void;
  }): void;
  HTTaxinvoiceService(): unknown;
  HTCashbillService(): unknown;
  MgtKeyType: { SELL: string; BUY: string; TRUSTEE: string };
};

let _sdk: PopbillSDK | null = null;
let _configured = false;

function loadSdk(): PopbillSDK {
  if (_sdk) return _sdk;
  try {
    _sdk = require("popbill") as PopbillSDK;
    return _sdk;
  } catch (e) {
    throw new PopbillApiError(
      "POPBILL_SDK_NOT_INSTALLED",
      `popbill 패키지 미설치. \`pnpm add popbill\` 후 다시 시도해 주세요. (${(e as Error).message})`
    );
  }
}

function ensureConfigured(): PopbillSDK {
  const sdk = loadSdk();
  if (_configured) return sdk;
  const linkId = getEnvVar("POPBILL_LINK_ID");
  const secretKey = getEnvVar("POPBILL_SECRET_KEY");
  const isTest = getEnvVar("POPBILL_IS_TEST") !== "false"; // 기본 sandbox
  if (!linkId || !secretKey) {
    throw new PopbillApiError(
      "POPBILL_NOT_CONFIGURED",
      "POPBILL_LINK_ID / POPBILL_SECRET_KEY 환경변수 미설정. www.popbill.com 가입 후 발급."
    );
  }
  sdk.config({
    LinkID: linkId,
    SecretKey: secretKey,
    IsTest: isTest,
    defaultErrorHandler: (err: unknown) => {
      // 개별 호출에서 error callback 으로 잡힘 — 여기는 fallback.
      console.warn("[popbill default error handler]", err);
    },
  });
  _configured = true;
  return sdk;
}

// ─── promisify 헬퍼 ────────────────────────────────────────────────
//
// popbill SDK 는 success/error 콜백 분리. ES Promise 로 변환.

function callPromise<T>(
  call: (success: (r: T) => void, error: (e: { code: number; message: string }) => void) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    call(
      (r) => resolve(r),
      (e) => reject(new PopbillApiError(e?.code ?? "POPBILL_ERROR", e?.message ?? "팝빌 API 오류"))
    );
  });
}

// ─── 클라이언트 ─────────────────────────────────────────────────────

export class PopbillClient {
  private htTax(): {
    requestJob(
      corpNum: string,
      type: string,
      dType: string,
      sDate: string,
      eDate: string,
      success: (r: string) => void,
      error: (e: { code: number; message: string }) => void
    ): void;
    getJobState(
      corpNum: string,
      jobId: string,
      success: (r: PopbillJobStateRaw) => void,
      error: (e: { code: number; message: string }) => void
    ): void;
    search(
      corpNum: string,
      jobId: string,
      type: string[],
      taxType: string[],
      purposeType: string[],
      taxRegIDType: string,
      taxRegIDYN: string,
      taxRegID: string,
      page: number,
      perPage: number,
      order: string,
      userID: string,
      searchString: string,
      success: (r: { list?: PopbillTaxinvoiceSummary[]; total?: number; page?: number; perPage?: number }) => void,
      error: (e: { code: number; message: string }) => void
    ): void;
    checkIsMember(
      corpNum: string,
      success: (r: { code: number; message: string }) => void,
      error: (e: { code: number; message: string }) => void
    ): void;
  } {
    const sdk = ensureConfigured();
    return sdk.HTTaxinvoiceService() as ReturnType<PopbillClient["htTax"]>;
  }

  private htCash(): {
    requestJob(
      corpNum: string,
      dType: string,
      sDate: string,
      eDate: string,
      success: (r: string) => void,
      error: (e: { code: number; message: string }) => void
    ): void;
    getJobState(
      corpNum: string,
      jobId: string,
      success: (r: PopbillJobStateRaw) => void,
      error: (e: { code: number; message: string }) => void
    ): void;
    search(
      corpNum: string,
      jobId: string,
      tradeType: string[],
      tradeUsage: string[],
      taxationType: string[],
      page: number,
      perPage: number,
      order: string,
      userID: string,
      searchString: string,
      success: (r: { list?: PopbillCashbillSummary[]; total?: number; page?: number; perPage?: number }) => void,
      error: (e: { code: number; message: string }) => void
    ): void;
  } {
    const sdk = ensureConfigured();
    return sdk.HTCashbillService() as ReturnType<PopbillClient["htCash"]>;
  }

  /** 팝빌 회원사 가입 여부 (사업자번호 기준). */
  async isMember(corpNum: string): Promise<boolean> {
    const svc = this.htTax();
    try {
      const r = await callPromise<{ code: number }>((s, e) =>
        svc.checkIsMember(corpNum, s, e)
      );
      return r?.code === 1;
    } catch {
      return false;
    }
  }

  /** 세금계산서 비동기 수집 요청 → jobID 반환. */
  async requestTaxinvoiceJob(input: {
    corpNum: string;
    type: PopbillTaxinvoiceType;
    dateType: PopbillDateType;
    startDate: string;     // YYYYMMDD
    endDate: string;       // YYYYMMDD
  }): Promise<string> {
    const svc = this.htTax();
    return callPromise<string>((s, e) =>
      svc.requestJob(input.corpNum, input.type, input.dateType, input.startDate, input.endDate, s, e)
    );
  }

  /** Job 상태 조회 (세금계산서 / 현금영수증 공통 호환 — 둘 다 같은 shape). */
  async getTaxinvoiceJobState(input: { corpNum: string; jobId: string }): Promise<PopbillJobStateRaw> {
    const svc = this.htTax();
    return callPromise<PopbillJobStateRaw>((s, e) => svc.getJobState(input.corpNum, input.jobId, s, e));
  }

  /** 세금계산서 수집 결과 조회 (페이지네이션). */
  async searchTaxinvoice(input: {
    corpNum: string;
    jobId: string;
    /** ['N','M'] = 일반/수정 */
    docType?: string[];
    /** ['T','N','Z'] = 과세/영세/면세 */
    taxType?: string[];
    /** ['R','C','N'] = 영수/청구/없음 */
    purposeType?: string[];
    page?: number;
    perPage?: number;
  }): Promise<{ list: PopbillTaxinvoiceSummary[]; total: number; page: number; perPage: number }> {
    const svc = this.htTax();
    const r = await callPromise<{ list?: PopbillTaxinvoiceSummary[]; total?: number; page?: number; perPage?: number }>(
      (s, e) =>
        svc.search(
          input.corpNum,
          input.jobId,
          input.docType ?? ["N", "M"],
          input.taxType ?? ["T", "N", "Z"],
          input.purposeType ?? ["R", "C", "N"],
          "",   // taxRegIDType
          "",   // taxRegIDYN
          "",   // taxRegID
          input.page ?? 1,
          input.perPage ?? 100,
          "D",  // order desc
          "",   // userID
          "",   // searchString
          s,
          e
        )
    );
    return {
      list: r.list ?? [],
      total: r.total ?? 0,
      page: r.page ?? input.page ?? 1,
      perPage: r.perPage ?? input.perPage ?? 100,
    };
  }

  /** 현금영수증 비동기 수집 요청. */
  async requestCashbillJob(input: {
    corpNum: string;
    dateType: PopbillDateType;
    startDate: string;
    endDate: string;
  }): Promise<string> {
    const svc = this.htCash();
    return callPromise<string>((s, e) =>
      svc.requestJob(input.corpNum, input.dateType, input.startDate, input.endDate, s, e)
    );
  }

  async getCashbillJobState(input: { corpNum: string; jobId: string }): Promise<PopbillJobStateRaw> {
    const svc = this.htCash();
    return callPromise<PopbillJobStateRaw>((s, e) => svc.getJobState(input.corpNum, input.jobId, s, e));
  }

  async searchCashbill(input: {
    corpNum: string;
    jobId: string;
    /** ['N','C'] = 소득공제/지출증빙 */
    tradeType?: string[];
    /** ['P','C'] = 개인/법인 */
    tradeUsage?: string[];
    /** 과세형태 */
    taxationType?: string[];
    page?: number;
    perPage?: number;
  }): Promise<{ list: PopbillCashbillSummary[]; total: number; page: number; perPage: number }> {
    const svc = this.htCash();
    const r = await callPromise<{ list?: PopbillCashbillSummary[]; total?: number; page?: number; perPage?: number }>(
      (s, e) =>
        svc.search(
          input.corpNum,
          input.jobId,
          input.tradeType ?? ["N", "C"],
          input.tradeUsage ?? ["P", "C"],
          input.taxationType ?? ["과세", "비과세"],
          input.page ?? 1,
          input.perPage ?? 100,
          "D",
          "",
          "",
          s,
          e
        )
    );
    return {
      list: r.list ?? [],
      total: r.total ?? 0,
      page: r.page ?? input.page ?? 1,
      perPage: r.perPage ?? input.perPage ?? 100,
    };
  }
}

// ─── jobState 코드 → 의미 변환 ─────────────────────────────────────

export function popbillJobStateLabel(state: number): "wait" | "working" | "success" | "failed" {
  if (state === 1) return "wait";
  if (state === 2) return "working";
  if (state === 3) return "success";
  return "failed";
}
