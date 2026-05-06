/**
 * Adapter Pattern — 외부 API 마다 다른 호출 시그니처를 통일된 인터페이스로.
 *
 * 클라이언트 구현(_lib/codef-client.ts, popbill-client.ts) 은
 * 이 인터페이스 중 자기가 지원하는 부분만 implement.
 *
 * 화면/라우트 코드는 이 인터페이스만 의존 → 향후 어댑터 교체 자유.
 */

import type {
  IntegrationProvider,
  NormalizedBankTransaction,
  NormalizedCardSale,
  NormalizedTaxInvoice,
  NormalizedCashbill,
  PopbillJobKind,
  PopbillJobRecord,
} from "./types";

// ─────────────────────────────────────────────────────────────────
//  공통 결과 타입
// ─────────────────────────────────────────────────────────────────

export type AdapterError = {
  code: string;
  message: string;
  retryable: boolean;
};

export type AdapterResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AdapterError };

export type DateRange = {
  /** YYYY-MM-DD or YYYYMMDD — adapter 가 알아서 변환 */
  start: string;
  end: string;
};

// ─────────────────────────────────────────────────────────────────
//  은행 거래내역 어댑터 (CODEF Bank)
// ─────────────────────────────────────────────────────────────────

export interface BankAdapter {
  readonly provider: Extract<IntegrationProvider, "codef-bank">;

  /** 등록된 사장님 통장 거래내역 조회 (정규화 후 반환). */
  fetchTransactions(input: {
    /** 어댑터 별 식별자 (CODEF 의 경우 connectedId) */
    connectionToken: string;
    organization: string;        // 은행 코드
    accountNumber: string;
    range: DateRange;
  }): Promise<AdapterResult<{
    transactions: NormalizedBankTransaction[];
    /** 다음 페이지가 있으면 cursor */
    nextCursor?: string | null;
  }>>;
}

// ─────────────────────────────────────────────────────────────────
//  카드 매출 어댑터 (CODEF Card / 여신금융협회 매통조)
// ─────────────────────────────────────────────────────────────────

export interface CardSalesAdapter {
  readonly provider: Extract<IntegrationProvider, "codef-card">;

  fetchCardSales(input: {
    connectionToken: string;
    /** 미입력 시 전체 카드사 통합 */
    cardCompany?: string;
    range: DateRange;
  }): Promise<AdapterResult<{
    sales: NormalizedCardSale[];
  }>>;
}

// ─────────────────────────────────────────────────────────────────
//  팝빌 홈택스 어댑터 (비동기 Job 패턴)
// ─────────────────────────────────────────────────────────────────

export interface HometaxAdapter {
  readonly provider: Extract<
    IntegrationProvider,
    "popbill-taxinvoice" | "popbill-cashbill"
  >;

  /**
   * 비동기 수집 요청 → jobId 발급 (1시간 유효).
   * dateType: 'W'(작성일) | 'I'(발행일) | 'S'(전송일)
   */
  requestCollect(input: {
    businessNumber: string;
    kind: PopbillJobKind;
    dateType: "W" | "I" | "S";
    range: DateRange;
  }): Promise<AdapterResult<{ jobId: string }>>;

  /** Job 상태 폴링 */
  getJobState(input: {
    businessNumber: string;
    jobId: string;
  }): Promise<AdapterResult<PopbillJobRecord>>;

  /** Job 완료 후 수집 결과 조회 (페이지네이션) */
  searchTaxInvoices?(input: {
    businessNumber: string;
    jobId: string;
    page: number;
    perPage: number;
  }): Promise<AdapterResult<{
    invoices: NormalizedTaxInvoice[];
    total: number;
    hasMore: boolean;
  }>>;

  searchCashbills?(input: {
    businessNumber: string;
    jobId: string;
    page: number;
    perPage: number;
  }): Promise<AdapterResult<{
    cashbills: NormalizedCashbill[];
    total: number;
    hasMore: boolean;
  }>>;
}
