/* ─────────────────────────────────────────────
 *  중앙 관리 벤치마크 상수
 *  AI 프롬프트, 재무 시뮬레이션, 대시보드에서 공통 참조
 *  법정 수치 변경 시 이 파일만 수정하면 전체 반영됨
 * ───────────────────────────────────────────── */

// ── 법정 수치 (연도별 갱신 필요) ──
export const LEGAL = {
  /** 2026년 최저시급 (원) — 출처: 최저임금위원회 2025-08 고시 */
  MINIMUM_WAGE_HOURLY: 10_320,
  /** 간이과세 기준 연매출 (원) — 출처: 국세청 부가가치세법 시행령 */
  SIMPLIFIED_TAX_THRESHOLD: 104_000_000,
  /** 일반과세 전환 기준 (원) */
  GENERAL_TAX_THRESHOLD: 80_000_000,
  /** 4대보험 사업자 부담률 (%) — 2026 기준
   *   국민연금 4.75 + 건강보험 3.595 + 장기요양 ~0.4724 (=3.595×0.1314) + 고용보험 0.9 + 산재 ~0.7
   *   출처: 국민연금공단/건보공단/근로복지공단 2026 고시 */
  EMPLOYER_INSURANCE_RATE: 10.42,
  /** 데이터 기준 연도 */
  DATA_YEAR: "2026",
} as const;

// ── 업종별 비용 비율 기준 (%) ──
export const COST_RATIOS = {
  food: { ingredients: [30, 35], labor: [25, 30], rent: [8, 15], primeCostMax: 65 },
  "cafe-dessert": { ingredients: [25, 35], labor: [20, 28], rent: [10, 18], primeCostMax: 65 },
  retail: { cogs: [50, 65], labor: [8, 15], rent: [8, 15], primeCostMax: 75 },
  beauty: { supplies: [8, 15], labor: [40, 50], rent: [10, 15], primeCostMax: 65 },
  fitness: { supplies: [0, 5], labor: [20, 30], rent: [15, 25], primeCostMax: 55 },
  education: { materials: [10, 18], labor: [30, 40], rent: [12, 18], primeCostMax: 60 },
  pet: { supplies: [15, 25], labor: [25, 35], rent: [10, 15], primeCostMax: 60 },
  "living-service": { supplies: [10, 20], labor: [20, 35], rent: [8, 15], primeCostMax: 60 },
  space: { supplies: [3, 8], labor: [10, 20], rent: [20, 30], primeCostMax: 55 },
  "online-digital": { cogs: [20, 40], labor: [5, 15], platform: [10, 20], primeCostMax: 60 },
  "startup-tech": { infra: [5, 15], labor: [50, 70], rent: [5, 10], primeCostMax: 80 },
} as const;

// ── 건강 점수 기준 ──
export const HEALTH_THRESHOLDS = {
  /** 프라임코스트 경고 기준 (%) */
  PRIME_COST_WARNING: 65,
  /** 프라임코스트 위험 기준 (%) */
  PRIME_COST_CRITICAL: 75,
  /** 현금 런웨이 경고 (개월) */
  RUNWAY_WARNING_MONTHS: 3,
  /** 현금 런웨이 위험 (개월) */
  RUNWAY_CRITICAL_MONTHS: 1,
  /** 매출 하락 경고 (연속 주) */
  DECLINE_WARNING_WEEKS: 3,
} as const;

// ── 창업 비용 범위 (만원) ──
export const STARTUP_COSTS = {
  food: { min: 8000, avg: 15000, max: 25000 },
  "cafe-dessert": { min: 5000, avg: 11700, max: 20000 },
  retail: { min: 3000, avg: 8000, max: 15000 },
  beauty: { min: 3000, avg: 7000, max: 15000 },
  fitness: { min: 5000, avg: 12000, max: 25000 },
  education: { min: 2000, avg: 5000, max: 12000 },
  pet: { min: 3000, avg: 7000, max: 15000 },
  "living-service": { min: 2000, avg: 5000, max: 10000 },
  space: { min: 5000, avg: 10000, max: 20000 },
  "online-digital": { min: 500, avg: 2000, max: 5000 },
  "startup-tech": { min: 1000, avg: 5000, max: 20000 },
} as const;
