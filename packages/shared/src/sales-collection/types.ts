/* ─────────────────────────────────────────────
 *  sales-collection/types.ts
 *  매출 자동수집 데이터 타입 (카드매출/현금영수증/배달앱)
 * ───────────────────────────────────────────── */

export type SalesDataSource =
  | "manual"         // 수기 입력
  | "card-crefia"    // 여신금융협회 카드매출
  | "cash-receipt"   // 홈택스 현금영수증
  | "delivery-app"   // 배달앱 (배민/쿠팡이츠/요기요)
  | "tax-invoice";   // 세금계산서

export type CollectedSale = {
  id?: string;
  userId?: string;
  date: string;              // YYYY-MM-DD
  source: SalesDataSource;
  amount: number;            // 원 단위
  fee?: number;              // 수수료 (원)
  netAmount?: number;        // 실수령액 (원)
  cardCompany?: string;      // "신한", "삼성", "현대" 등
  deliveryApp?: string;      // "배달의민족", "쿠팡이츠", "요기요"
  meta?: Record<string, unknown>;
};

export type SalesCollectionConfig = {
  userId: string;
  crefiaLinked: boolean;     // 여신금융협회 연동
  hometaxLinked: boolean;    // 홈택스 연동
  deliveryLinked: boolean;   // 배달앱 연동
  lastSyncAt?: string;       // ISO timestamp
};

export type CollectedDailySummary = {
  date: string;
  totalAmount: number;
  totalFee: number;
  netAmount: number;
  bySource: Record<SalesDataSource, number>;
  cardCount: number;
  cashReceiptCount: number;
  deliveryCount: number;
};
