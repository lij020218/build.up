/**
 * 통합 정규화 타입 — 모든 외부 API 응답이 최종적으로 변환되는 공통 모델.
 *
 * 화면(useDashboard, finance store) 은 이 정규화된 타입만 알면 됨.
 * 어댑터별 raw 타입은 각 클라이언트 파일에서 정의.
 */

// ─────────────────────────────────────────────────────────────────
//  공통
// ─────────────────────────────────────────────────────────────────

export type IntegrationProvider =
  | "codef-bank"            // CODEF 사업자 통장 거래내역
  | "codef-card"            // CODEF 여신금융협회 카드매출
  | "popbill-taxinvoice"    // 팝빌 홈택스 세금계산서
  | "popbill-cashbill"      // 팝빌 홈택스 현금영수증
  | "tossplace"             // TOSS Place POS
  | "portone";              // 포트원 PG

export type IntegrationStatus =
  | "not_connected"
  | "pending"               // 연결 진행 중 (예: 인증서 등록 대기)
  | "active"
  | "invalid"               // 자격증명 만료
  | "revoked";              // 사용자가 끊음

export type IntegrationConnection = {
  provider: IntegrationProvider;
  status: IntegrationStatus;
  connectedAt?: string;     // ISO
  lastSyncAt?: string;      // ISO
  lastSyncError?: string | null;
  /** 식별용 마스킹된 표시값 (사업자번호 마스킹·계좌 끝 4자리 등) */
  identifierMask?: string;
};

// ─────────────────────────────────────────────────────────────────
//  사업자 통장 거래내역 (CODEF Bank)
// ─────────────────────────────────────────────────────────────────

export type BankTransactionCategory =
  | "card_settlement"   // 카드사 입금 (매출 정산)
  | "rent"              // 임대료
  | "utility"           // 공과금
  | "salary"            // 인건비
  | "tax"               // 세금 납부
  | "loan"              // 대출 상환
  | "purchase"          // 거래처 매입
  | "sales_cash"        // 현금 매출 입금
  | "transfer_in"       // 일반 입금
  | "transfer_out"      // 일반 출금
  | "other";

export type NormalizedBankTransaction = {
  /** 외부 ID 가 없으므로 (시간+금액+잔액) 합성키 사용 — DB 의 unique 제약과 동일 */
  fingerprint: string;
  accountId: string;
  transactionAt: string;        // ISO
  amountIn: number;             // 입금 (>= 0)
  amountOut: number;            // 출금 (>= 0)
  balanceAfter: number | null;
  description: string;          // desc1~4 합쳐서 trim
  counterparty?: string | null; // 추출된 거래처
  category?: BankTransactionCategory;
  raw?: Record<string, unknown>;
};

export type BankAccountMeta = {
  organization: string;         // CODEF 은행코드 (예: 0004)
  bankName: string;             // 표시명 ("KB국민")
  accountNumber: string;        // hyphen 제거
  accountNumberMask: string;
  accountHolder?: string;
  accountAlias?: string;
  isPrimary: boolean;
};

// ─────────────────────────────────────────────────────────────────
//  카드 매출 (CODEF Card / 여신금융협회)
// ─────────────────────────────────────────────────────────────────

export type NormalizedCardSale = {
  cardCompany: string;
  approvalNumber: string;
  approvedAt: string;           // ISO
  amount: number;
  vat: number;
  serviceCharge: number;
  cardBrand?: string;
  installmentMonths: number;
  status: "approved" | "cancelled";
  raw?: Record<string, unknown>;
};

// ─────────────────────────────────────────────────────────────────
//  세금계산서 (팝빌 홈택스 연동)
// ─────────────────────────────────────────────────────────────────

export type TaxInvoiceDirection = "sell" | "buy";

export type NormalizedTaxInvoice = {
  ntsConfirmNum: string;        // 국세청 승인번호 — dedup 키
  direction: TaxInvoiceDirection;
  writeDate?: string;           // YYYY-MM-DD
  issueDate?: string;           // ISO
  sendDate?: string;            // ISO
  supplyCostTotal: number;      // 공급가액
  taxTotal: number;             // 세액
  totalAmount: number;          // 합계
  /** T(과세) | N(영세) | Z(면세) */
  taxType?: "T" | "N" | "Z";
  /** R(영수) | C(청구) | N(없음) */
  purposeType?: "R" | "C" | "N";
  modifyCode?: number;
  /** 상대방 (매출이면 구매자 / 매입이면 공급자) */
  counterparty: {
    corpNum?: string;
    corpName?: string;
  };
  self: {
    corpNum?: string;
    corpName?: string;
  };
  raw?: Record<string, unknown>;
};

// ─────────────────────────────────────────────────────────────────
//  현금영수증 (팝빌 홈택스)
// ─────────────────────────────────────────────────────────────────

export type NormalizedCashbill = {
  confirmNum: string;
  tradeDate?: string;            // YYYY-MM-DD
  issueDate?: string;            // ISO
  /** N(소득공제) | C(지출증빙) */
  tradeType?: "N" | "C";
  /** P(개인) | C(법인) */
  tradeUsage?: "P" | "C";
  supplyCost: number;
  tax: number;
  serviceFee: number;
  totalAmount: number;
  identityNumMask?: string;
  raw?: Record<string, unknown>;
};

// ─────────────────────────────────────────────────────────────────
//  통합 매출 일별 합산 (대시보드 dailyEntries 보강용)
// ─────────────────────────────────────────────────────────────────

export type DailyRevenueRow = {
  date: string;                  // YYYY-MM-DD (KST)
  source: IntegrationProvider | "tossplace" | "portone";
  amount: number;
  txCount: number;
};

// ─────────────────────────────────────────────────────────────────
//  팝빌 비동기 작업
// ─────────────────────────────────────────────────────────────────

export type PopbillJobKind = "taxinvoice_sell" | "taxinvoice_buy" | "cashbill";

export type PopbillJobState =
  | "requested"
  | "wait"
  | "working"
  | "success"
  | "failed"
  | "cancelled";

export type PopbillJobRecord = {
  jobId: string;
  jobKind: PopbillJobKind;
  state: PopbillJobState;
  startDate: string;            // YYYY-MM-DD
  endDate: string;              // YYYY-MM-DD
  collectTotal: number;
  collectCount: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  requestedAt: string;          // ISO
  finishedAt?: string | null;   // ISO
};
