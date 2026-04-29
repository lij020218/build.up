/**
 * Daily KPI Strip Config — 운영 대시보드 Tier 1 의 5칸 horizontal KPI strip 설정.
 *
 * 사장님이 출근 직후 30초 안에 "가게가 정상인가" 즉시 판단할 5개 핵심 숫자.
 * 업종(categoryId)별로 무엇을 봐야 하는지가 다름 → 분기.
 *
 * 디자인 원칙:
 *  - 5칸 fixed (Stephen Few 8-12 metric rule + 인지 한계)
 *  - 각 칸은 숫자 + 트렌드(±%) + 임계값 색
 *  - 임계값 색: green(good) / amber(warning) / red(bad) / neutral(데이터부족)
 *  - 마지막 5번째 칸은 "leading indicator" (재방문율 등 — 결과가 아닌 선행 신호)
 */

export type KpiValueType =
  | "currency"  // 원화 숫자
  | "percent"   // %
  | "number"    // 정수
  | "months"    // 개월 (런웨이)
  | "days"      // 일수 (회전일수)
  | "ratio";    // 비율 (예: 0.5 = 50%)

export type KpiThresholds = {
  /** higher-is-better: ≥good 녹색, ≥warning 노랑, <warning 빨강. lower-is-better: 반대 */
  direction: "higher-is-better" | "lower-is-better";
  good: number;
  warning: number;
  /** bad 미정 시 warning 너머 = 빨강 */
  bad?: number;
};

export type KpiCellConfig = {
  /** 안정 ID — resolver 매칭 키 */
  id: string;
  labelKo: string;
  labelEn: string;
  type: KpiValueType;
  thresholds?: KpiThresholds;
  /** UI tooltip — "이 숫자가 무엇을 의미하는가" */
  hintKo?: string;
  hintEn?: string;
};

export type DailyKpiConfig = {
  /** categoryId 와 매칭 (food/retail/beauty/space/fitness/subscription/startup-tech 등) */
  industryId: string;
  /** 정확히 5칸 */
  cells: KpiCellConfig[];
};

/**
 * 업종별 KPI 카탈로그.
 * 5번째 칸은 leading indicator (선행 지표) — 결과가 아닌 행동 변화 신호.
 */
export const DAILY_KPI_BY_INDUSTRY: Record<string, KpiCellConfig[]> = {
  // ─── 음식점 / 카페 ────────────────────────────────────────────────
  food: [
    { id: "yesterday-sales", labelKo: "어제 매출", labelEn: "Sales", type: "currency",
      hintKo: "전주 동요일 대비 변화율로 패턴 진단" },
    { id: "yesterday-customers", labelKo: "어제 객수", labelEn: "Customers", type: "number",
      hintKo: "객수 × 객단가 = 매출. 객수 감소가 매출 하락의 원인일 때 즉시 보임" },
    { id: "prime-cost", labelKo: "프라임코스트", labelEn: "Prime Cost", type: "percent",
      thresholds: { direction: "lower-is-better", good: 60, warning: 65, bad: 70 },
      hintKo: "(식재료비+인건비) ÷ 매출. 65% 초과 시 수익 구조 위험" },
    { id: "cash-runway", labelKo: "런웨이", labelEn: "Runway", type: "months",
      thresholds: { direction: "higher-is-better", good: 12, warning: 6, bad: 3 },
      hintKo: "현금잔여 ÷ 월 비용. 3개월 미만이면 즉시 현금 방어 모드" },
    { id: "avg-ticket", labelKo: "객단가", labelEn: "Avg Ticket", type: "currency",
      hintKo: "매출 ÷ 객수. 업종 평균 대비 위치 비교" },
  ],

  // 카페·디저트 (cafe-dessert) — 음식점과 동일
  "cafe-dessert": [
    { id: "yesterday-sales", labelKo: "어제 매출", labelEn: "Sales", type: "currency" },
    { id: "yesterday-customers", labelKo: "어제 객수", labelEn: "Customers", type: "number" },
    { id: "prime-cost", labelKo: "프라임코스트", labelEn: "Prime Cost", type: "percent",
      thresholds: { direction: "lower-is-better", good: 58, warning: 63, bad: 68 } },
    { id: "cash-runway", labelKo: "런웨이", labelEn: "Runway", type: "months",
      thresholds: { direction: "higher-is-better", good: 12, warning: 6, bad: 3 } },
    { id: "avg-ticket", labelKo: "객단가", labelEn: "Avg Ticket", type: "currency" },
  ],

  // ─── 소매 / 리테일 ───────────────────────────────────────────────
  retail: [
    { id: "yesterday-sales", labelKo: "어제 매출", labelEn: "Sales", type: "currency" },
    { id: "inventory-days", labelKo: "재고 회전일수", labelEn: "Inventory Days", type: "days",
      thresholds: { direction: "lower-is-better", good: 20, warning: 30, bad: 45 },
      hintKo: "재고가 매출로 회전되는 평균 일수. 30일 초과 = 재고 묶임 위험" },
    { id: "cogs-ratio", labelKo: "매입원가율", labelEn: "COGS %", type: "percent",
      thresholds: { direction: "lower-is-better", good: 55, warning: 65, bad: 75 } },
    { id: "cash-runway", labelKo: "런웨이", labelEn: "Runway", type: "months",
      thresholds: { direction: "higher-is-better", good: 12, warning: 6, bad: 3 } },
    { id: "avg-ticket", labelKo: "객단가", labelEn: "Avg Ticket", type: "currency" },
  ],

  // ─── 미용 / 뷰티 ──────────────────────────────────────────────────
  beauty: [
    { id: "booking-utilization", labelKo: "예약 가동률", labelEn: "Booking Util.", type: "percent",
      thresholds: { direction: "higher-is-better", good: 70, warning: 50, bad: 35 },
      hintKo: "예약 슬롯 ÷ 가용 슬롯. 50% 미만이면 마케팅·시간대 조정 필요" },
    { id: "avg-ticket", labelKo: "객단가", labelEn: "Avg Ticket", type: "currency" },
    { id: "labor-ratio", labelKo: "인건비율", labelEn: "Labor %", type: "percent",
      thresholds: { direction: "lower-is-better", good: 40, warning: 50, bad: 60 },
      hintKo: "인건비 ÷ 매출. 미용업 평균 40-50%, 50% 초과 시 스케줄 최적화" },
    { id: "cash-runway", labelKo: "런웨이", labelEn: "Runway", type: "months",
      thresholds: { direction: "higher-is-better", good: 12, warning: 6, bad: 3 } },
    { id: "yesterday-customers", labelKo: "어제 손님", labelEn: "Customers", type: "number" },
  ],

  // ─── 공간 / 스터디카페 / 피트니스 ───────────────────────────────
  space: [
    { id: "seat-utilization", labelKo: "좌석 가동률", labelEn: "Seat Util.", type: "percent",
      thresholds: { direction: "higher-is-better", good: 60, warning: 40, bad: 25 },
      hintKo: "좌석 시간 사용률. 시간대별 분포는 Tier 2 히트맵 참조" },
    { id: "arpu", labelKo: "회원 ARPU", labelEn: "ARPU", type: "currency",
      hintKo: "월 매출 ÷ 회원 수. 회원 가치 측정" },
    { id: "rent-ratio", labelKo: "임대료 비율", labelEn: "Rent %", type: "percent",
      thresholds: { direction: "lower-is-better", good: 25, warning: 30, bad: 40 } },
    { id: "cash-runway", labelKo: "런웨이", labelEn: "Runway", type: "months",
      thresholds: { direction: "higher-is-better", good: 12, warning: 6, bad: 3 } },
    { id: "active-members", labelKo: "활성 회원", labelEn: "Active Members", type: "number" },
  ],

  fitness: [
    { id: "seat-utilization", labelKo: "장소 가동률", labelEn: "Facility Util.", type: "percent",
      thresholds: { direction: "higher-is-better", good: 60, warning: 40, bad: 25 } },
    { id: "arpu", labelKo: "회원 ARPU", labelEn: "ARPU", type: "currency" },
    { id: "rent-ratio", labelKo: "임대료 비율", labelEn: "Rent %", type: "percent",
      thresholds: { direction: "lower-is-better", good: 25, warning: 30, bad: 40 } },
    { id: "cash-runway", labelKo: "런웨이", labelEn: "Runway", type: "months",
      thresholds: { direction: "higher-is-better", good: 12, warning: 6, bad: 3 } },
    { id: "active-members", labelKo: "활성 회원", labelEn: "Active Members", type: "number" },
  ],

  // ─── SaaS / 구독 (subscription 또는 online-digital) ───────────────
  "online-digital": [
    { id: "mrr", labelKo: "MRR", labelEn: "MRR", type: "currency",
      hintKo: "월 반복 매출. 전월 대비 ±% 트렌드 핵심" },
    { id: "net-new", labelKo: "순증감 (가입-이탈)", labelEn: "Net New", type: "number",
      hintKo: "신규 - 이탈. 양수 유지가 성장의 시작" },
    { id: "cash-runway", labelKo: "런웨이", labelEn: "Runway", type: "months",
      thresholds: { direction: "higher-is-better", good: 18, warning: 12, bad: 6 } },
    { id: "nrr", labelKo: "NRR", labelEn: "NRR", type: "percent",
      thresholds: { direction: "higher-is-better", good: 110, warning: 100, bad: 90 },
      hintKo: "Net Revenue Retention. 100% 이상 = 기존 고객 매출 성장" },
    { id: "active-users", labelKo: "활성 사용자", labelEn: "Active Users", type: "number" },
  ],

  // ─── Pre-PMF 스타트업 (런칭 전 ~ 3개월) ──────────────────────────
  "startup-tech": [
    { id: "cumulative-users", labelKo: "누적 사용자", labelEn: "Total Users", type: "number",
      thresholds: { direction: "higher-is-better", good: 50, warning: 20, bad: 5 },
      hintKo: "Sam Altman 룰 — 50명을 사랑하게 만드는 게 첫 목표" },
    { id: "wau", labelKo: "주간 활성", labelEn: "WAU", type: "number",
      hintKo: "지난 7일 활성 사용자. 누적 대비 비율로 retention 추정" },
    { id: "repeat-rate", labelKo: "재방문율", labelEn: "Repeat Rate", type: "percent",
      thresholds: { direction: "higher-is-better", good: 40, warning: 25, bad: 10 } },
    { id: "cash-runway", labelKo: "런웨이", labelEn: "Runway", type: "months",
      thresholds: { direction: "higher-is-better", good: 18, warning: 12, bad: 6 } },
    { id: "pmf-score", labelKo: "PMF 점수", labelEn: "PMF Score", type: "percent",
      thresholds: { direction: "higher-is-better", good: 40, warning: 25, bad: 10 },
      hintKo: "Sean Ellis 40% Test — '없으면 매우 아쉬워요' 응답 비율" },
  ],

  // ─── 그 외 (living-service, education, pet) — 일반 자영업 기본값 ─
  "living-service": [
    { id: "yesterday-sales", labelKo: "어제 매출", labelEn: "Sales", type: "currency" },
    { id: "yesterday-customers", labelKo: "어제 손님", labelEn: "Customers", type: "number" },
    { id: "labor-ratio", labelKo: "인건비율", labelEn: "Labor %", type: "percent",
      thresholds: { direction: "lower-is-better", good: 35, warning: 45, bad: 55 } },
    { id: "cash-runway", labelKo: "런웨이", labelEn: "Runway", type: "months",
      thresholds: { direction: "higher-is-better", good: 12, warning: 6, bad: 3 } },
    { id: "avg-ticket", labelKo: "객단가", labelEn: "Avg Ticket", type: "currency" },
  ],

  education: [
    { id: "active-members", labelKo: "활성 학생", labelEn: "Active Students", type: "number" },
    { id: "arpu", labelKo: "학생 ARPU", labelEn: "Student ARPU", type: "currency" },
    { id: "labor-ratio", labelKo: "인건비율", labelEn: "Labor %", type: "percent",
      thresholds: { direction: "lower-is-better", good: 45, warning: 55, bad: 65 } },
    { id: "cash-runway", labelKo: "런웨이", labelEn: "Runway", type: "months",
      thresholds: { direction: "higher-is-better", good: 12, warning: 6, bad: 3 } },
    { id: "renewal-rate", labelKo: "재등록율", labelEn: "Renewal Rate", type: "percent",
      thresholds: { direction: "higher-is-better", good: 70, warning: 50, bad: 30 } },
  ],

  pet: [
    { id: "yesterday-sales", labelKo: "어제 매출", labelEn: "Sales", type: "currency" },
    { id: "yesterday-customers", labelKo: "어제 방문", labelEn: "Visits", type: "number" },
    { id: "cogs-ratio", labelKo: "매입원가율", labelEn: "COGS %", type: "percent",
      thresholds: { direction: "lower-is-better", good: 55, warning: 65, bad: 75 } },
    { id: "cash-runway", labelKo: "런웨이", labelEn: "Runway", type: "months",
      thresholds: { direction: "higher-is-better", good: 12, warning: 6, bad: 3 } },
    { id: "avg-ticket", labelKo: "객단가", labelEn: "Avg Ticket", type: "currency" },
  ],
};

/** 매칭되는 카테고리 없으면 사용할 fallback (일반 자영업) */
export const DEFAULT_DAILY_KPIS: KpiCellConfig[] = DAILY_KPI_BY_INDUSTRY.food;

/** categoryId 받아서 5칸 config 반환 (없으면 fallback) */
export function getDailyKpiCells(industryId: string | undefined | null): KpiCellConfig[] {
  if (!industryId) return DEFAULT_DAILY_KPIS;
  return DAILY_KPI_BY_INDUSTRY[industryId] ?? DEFAULT_DAILY_KPIS;
}
