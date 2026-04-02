// ─── 금융 데이터 연동 인프라 ─────────────────────────────────────────────────
// Open Banking API, 카드사 매출 API 등 금융 데이터를 연동하는 공통 모듈입니다.
// 현재는 타입 정의 + 어댑터 인터페이스만 구축하고,
// 실제 연동은 API 키 발급 후 점진적으로 활성화합니다.
//
// 이 모듈 위에 장부 자동화, 매출 대시보드, 예측, 건강 진단이 올라갑니다.

import type { DataAdapterConfig, AdapterResult } from "./types";

// ─── 공통 타입 ──────────────────────────────────────────────────────────────

export type FinancialProvider =
  | "open_banking"      // 오픈뱅킹 (계좌 조회, 입출금 내역)
  | "card_sales"        // 카드매출 (여신금융협회 / VAN)
  | "cash_receipt"      // 현금영수증 (국세청)
  | "tax_invoice";      // 세금계산서 (국세청 홈택스)

export type TransactionType = "income" | "expense" | "transfer";

/** 정규화된 금융 거래 레코드 */
export type NormalizedTransaction = {
  id: string;
  provider: FinancialProvider;
  transactionDate: string;    // YYYY-MM-DD
  transactionTime?: string;   // HH:mm
  type: TransactionType;
  amount: number;             // 양수 (입금/출금 구분은 type으로)
  balance?: number;           // 거래 후 잔액
  counterparty?: string;      // 상대방 (입금자/출금처)
  description?: string;       // 적요
  category?: string;          // 자동 분류 카테고리
  raw?: Record<string, unknown>; // 원본 데이터 보존
};

/** 일별 매출 집계 (카드+현금+배달) */
export type DailySalesSummary = {
  date: string;
  cardSales: number;
  cashSales: number;
  deliverySales: number;
  totalSales: number;
  transactionCount: number;
  avgTicketSize: number;
};

/** 자동 분류된 비용 카테고리 */
export type ExpenseCategory =
  | "ingredients"      // 재료비 (식자재, 원부자재)
  | "labor"            // 인건비
  | "rent"             // 임대료
  | "utilities"        // 공과금 (전기, 수도, 가스)
  | "marketing"        // 마케팅·광고비
  | "delivery_fee"     // 배달 수수료
  | "card_fee"         // 카드 수수료
  | "insurance"        // 보험료
  | "tax"              // 세금
  | "equipment"        // 설비·장비
  | "supplies"         // 소모품
  | "other";           // 기타

// ─── 어댑터 인터페이스 ──────────────────────────────────────────────────────

export type FinancialAdapterConfig = DataAdapterConfig & {
  provider: FinancialProvider;
  /** 사용자 인증 토큰 (Open Banking access token 등) */
  accessToken?: string;
  /** 연동 계좌/카드 식별자 */
  accountId?: string;
};

export type FinancialQueryParams = {
  startDate: string;   // YYYY-MM-DD
  endDate: string;
  type?: TransactionType;
  minAmount?: number;
  maxAmount?: number;
  pageNo?: number;
  pageSize?: number;
};

/** 금융 어댑터가 구현해야 할 인터페이스 */
export type FinancialAdapter = {
  provider: FinancialProvider;
  /** 거래 내역 조회 */
  fetchTransactions(
    config: FinancialAdapterConfig,
    params: FinancialQueryParams
  ): Promise<AdapterResult<NormalizedTransaction>>;
  /** 일별 매출 집계 */
  fetchDailySummary?(
    config: FinancialAdapterConfig,
    params: { startDate: string; endDate: string }
  ): Promise<AdapterResult<DailySalesSummary>>;
};

// ─── 거래 자동 분류 ─────────────────────────────────────────────────────────
// 적요(description)와 상대방(counterparty) 기반 규칙 매칭

type ClassificationRule = {
  keywords: string[];
  category: ExpenseCategory;
};

const EXPENSE_CLASSIFICATION_RULES: ClassificationRule[] = [
  { keywords: ["식자재", "농산", "수산", "축산", "식품", "CJ프레시", "쿠팡비즈", "마켓컬리"], category: "ingredients" },
  { keywords: ["급여", "인건비", "알바", "월급", "4대보험"], category: "labor" },
  { keywords: ["임대", "월세", "관리비", "건물"], category: "rent" },
  { keywords: ["전기", "수도", "가스", "한전", "한국전력", "도시가스"], category: "utilities" },
  { keywords: ["광고", "마케팅", "네이버광고", "카카오모먼트", "인스타"], category: "marketing" },
  { keywords: ["배달의민족", "쿠팡이츠", "요기요", "배달비", "배달수수료"], category: "delivery_fee" },
  { keywords: ["카드수수료", "VAN", "PG수수료"], category: "card_fee" },
  { keywords: ["보험", "화재보험", "상해보험", "배상책임"], category: "insurance" },
  { keywords: ["세금", "국세", "지방세", "부가세", "종소세"], category: "tax" },
  { keywords: ["장비", "설비", "냉장고", "에어컨", "인테리어"], category: "equipment" },
  { keywords: ["소모품", "포장재", "위생", "청소", "세제"], category: "supplies" },
];

/** 거래 적요를 기반으로 비용 카테고리를 추정합니다 */
export function classifyExpense(transaction: NormalizedTransaction): ExpenseCategory {
  const searchText = [
    transaction.description ?? "",
    transaction.counterparty ?? "",
  ].join(" ").toLowerCase();

  for (const rule of EXPENSE_CLASSIFICATION_RULES) {
    if (rule.keywords.some((kw) => searchText.includes(kw.toLowerCase()))) {
      return rule.category;
    }
  }

  return "other";
}

/** 거래 목록에서 일별 매출을 집계합니다 */
export function aggregateDailySales(
  transactions: NormalizedTransaction[]
): DailySalesSummary[] {
  const byDate = new Map<string, NormalizedTransaction[]>();

  for (const tx of transactions) {
    if (tx.type !== "income") continue;
    const existing = byDate.get(tx.transactionDate) ?? [];
    existing.push(tx);
    byDate.set(tx.transactionDate, existing);
  }

  return Array.from(byDate.entries())
    .map(([date, txs]) => {
      const totalSales = txs.reduce((sum, tx) => sum + tx.amount, 0);
      const count = txs.length;
      return {
        date,
        cardSales: txs.filter((tx) => tx.provider === "card_sales").reduce((s, tx) => s + tx.amount, 0),
        cashSales: txs.filter((tx) => tx.provider === "cash_receipt").reduce((s, tx) => s + tx.amount, 0),
        deliverySales: 0, // 배달 매출은 별도 소스에서 집계
        totalSales,
        transactionCount: count,
        avgTicketSize: count > 0 ? Math.round(totalSales / count) : 0,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** 거래 목록에서 카테고리별 비용을 집계합니다 */
export function aggregateExpensesByCategory(
  transactions: NormalizedTransaction[]
): Record<ExpenseCategory, number> {
  const result: Record<ExpenseCategory, number> = {
    ingredients: 0, labor: 0, rent: 0, utilities: 0,
    marketing: 0, delivery_fee: 0, card_fee: 0, insurance: 0,
    tax: 0, equipment: 0, supplies: 0, other: 0,
  };

  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    const category = tx.category as ExpenseCategory ?? classifyExpense(tx);
    result[category] += tx.amount;
  }

  return result;
}
