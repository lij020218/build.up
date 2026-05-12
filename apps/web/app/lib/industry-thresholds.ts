/**
 * 11 업종 비용·BEP 임계값 매트릭스 SSOT.
 *
 *  ── 왜 SSOT 로 분리 (2026-05-12) ──────────────────────────────────────
 *  기존: OfflineFounderBrief.tsx 안에만 정의 → CEOMorningHero 의 resolveHero
 *       (Tier 1 hero) 가 같은 룰엔진을 *못 사용* → 두 hero 카드가 *비슷한 신호*
 *       를 사장님께 제공 (안티패턴, Toast IQ·Amplitude 통합 패턴 위배).
 *
 *  현재: SSOT 분리 → useMorningBriefingBrain · OfflineFounderBrief · 기타
 *       카드 모두 같은 임계값 사용. 룰엔진 1개, hero 표시 1개.
 *
 *  ── 출처 (다중 검증) ─────────────────────────────────────────────────
 *  · 통계청 「자영업자 폐업률 2025」
 *  · 한국외식업중앙회 / 뷰티산업협회 / 한국체육시설업중앙회 / 한국학원연합회
 *  · Toast / NetSuite / Sage / R365 글로벌 외식 표준
 *  · a16z · SaaStr SMB 벤치마크
 *  · Reforge "Don't Let Your NSM Deceive You" (재방문률·leading vs lagging)
 *
 *  ── 원칙 ──────────────────────────────────────────────────────────
 *  임계값은 "이 업종 사장님 본업 구조" 를 반영. 외식 25%→뷰티 45%→교육 55%
 *  인건비가 *정상* 일 수 있음. 일률적 30% 적용은 잘못된 경보.
 *  ────────────────────────────────────────────────────────────────
 */

export type IndustryThresholds = {
  label: string;
  labelEn: string;
  /** 인건비 점검선 (%) */
  laborWarn: number;
  /** 인건비 위험선 (%) */
  laborCritical: number;
  laborAvg: string;
  /** 임대료 점검선 (%) */
  rentWarn: number;
  /** 임대료 위험선 (%) */
  rentCritical: number;
  rentAvg: string;
  /** 재료비 / 매입원가 임계값 — 해당 업종만 (online-digital·startup-tech 등은 없음) */
  materialWarn?: number;
  materialCritical?: number;
  materialAvg?: string;
  materialKind?: string; // "재료비" / "매입원가" / "재료·자재비"
  /** unit 표현 — "메뉴" / "상품" / "서비스" / "수업" / "시술" / "예약" */
  unitWord?: string;
  /** prime cost 우수 기준 (food/cafe 만 의미) */
  primeCostHealthy?: number;
  /** 업종별 객단가(원) 평균 — 2026 한국 기준. null = 객단가 의미 적은 업종 */
  avgTicketTypical?: number;
  avgTicketLabel?: string;
  /** 폐업률 통계 ("외식업 15.8%" 등) */
  closureStat: string;
};

const M: Record<string, IndustryThresholds> = {
  food: {
    label: "외식업", labelEn: "F&B",
    laborWarn: 25, laborCritical: 30, laborAvg: "25-30%",
    rentWarn: 15, rentCritical: 20, rentAvg: "8-15%",
    materialWarn: 35, materialCritical: 40, materialAvg: "36% (한국 평균)", materialKind: "재료비",
    unitWord: "메뉴",
    primeCostHealthy: 60,
    avgTicketTypical: 14310, avgTicketLabel: "객단가",
    closureStat: "한국 외식업 폐업률 15.8% (2025)",
  },
  "cafe-dessert": {
    label: "카페·디저트", labelEn: "Cafe",
    laborWarn: 25, laborCritical: 30, laborAvg: "25-30%",
    rentWarn: 18, rentCritical: 22, rentAvg: "10-18%",
    materialWarn: 35, materialCritical: 40, materialAvg: "30-38%", materialKind: "재료비",
    unitWord: "메뉴",
    primeCostHealthy: 60,
    avgTicketTypical: 7500, avgTicketLabel: "객단가",
    closureStat: "한국 카페 폐업률 약 11-12%",
  },
  beauty: {
    label: "뷰티(헤어·네일·피부)", labelEn: "Beauty",
    laborWarn: 45, laborCritical: 55, laborAvg: "40-50% (디자이너 인센티브 포함)",
    rentWarn: 18, rentCritical: 25, rentAvg: "12-20%",
    materialWarn: 15, materialCritical: 22, materialAvg: "10-18%", materialKind: "재료·자재비",
    unitWord: "시술",
    avgTicketTypical: 50000, avgTicketLabel: "시술 객단가",
    closureStat: "이미용업 폐업률 11.2%",
  },
  retail: {
    label: "소매", labelEn: "Retail",
    laborWarn: 18, laborCritical: 25, laborAvg: "12-20%",
    rentWarn: 12, rentCritical: 18, rentAvg: "8-15%",
    materialWarn: 70, materialCritical: 78, materialAvg: "65-72% (매입원가)", materialKind: "매입원가",
    unitWord: "상품",
    avgTicketTypical: 18000, avgTicketLabel: "객단가",
    closureStat: "소매업 폐업률 16.7%",
  },
  ecommerce: {
    label: "전자상거래", labelEn: "E-commerce",
    laborWarn: 15, laborCritical: 22, laborAvg: "10-18%",
    rentWarn: 6, rentCritical: 12, rentAvg: "0-8% (창고)",
    materialWarn: 70, materialCritical: 78, materialAvg: "65-75% (매입원가)", materialKind: "매입원가",
    unitWord: "상품",
    avgTicketTypical: 25000, avgTicketLabel: "주문 객단가",
    closureStat: "온라인 셀러 폐업률 약 14%",
  },
  fitness: {
    label: "피트니스·요가·필라테스", labelEn: "Fitness",
    laborWarn: 40, laborCritical: 50, laborAvg: "30-45% (강사·트레이너 비중)",
    rentWarn: 25, rentCritical: 35, rentAvg: "15-25% (넓은 공간)",
    unitWord: "수업",
    avgTicketTypical: 90000, avgTicketLabel: "월 회원권 단가",
    closureStat: "체육시설업 폐업률 9.3%",
  },
  education: {
    label: "학원·교습소", labelEn: "Education",
    laborWarn: 55, laborCritical: 65, laborAvg: "50-65% (강사 인건비)",
    rentWarn: 16, rentCritical: 22, rentAvg: "10-20%",
    unitWord: "수업",
    avgTicketTypical: 250000, avgTicketLabel: "월 수강료",
    closureStat: "학원 폐업률 8.4%",
  },
  pet: {
    label: "펫(펫숍·동물병원·미용)", labelEn: "Pet",
    laborWarn: 35, laborCritical: 45, laborAvg: "30-40%",
    rentWarn: 15, rentCritical: 22, rentAvg: "10-18%",
    materialWarn: 22, materialCritical: 30, materialAvg: "15-25%", materialKind: "재료·사료비",
    unitWord: "서비스",
    avgTicketTypical: 35000, avgTicketLabel: "서비스 객단가",
    closureStat: "펫업종 폐업률 약 10%",
  },
  "living-service": {
    label: "생활서비스(세탁·청소·수리)", labelEn: "Living Service",
    laborWarn: 35, laborCritical: 45, laborAvg: "30-40%",
    rentWarn: 10, rentCritical: 18, rentAvg: "5-12%",
    unitWord: "서비스",
    avgTicketTypical: 25000, avgTicketLabel: "서비스 객단가",
    closureStat: "생활서비스업 폐업률 약 11%",
  },
  space: {
    label: "공간임대(스터디카페·파티룸)", labelEn: "Space Rental",
    laborWarn: 18, laborCritical: 25, laborAvg: "10-18% (관리 인력만)",
    rentWarn: 40, rentCritical: 55, rentAvg: "30-50% (사업 본질 — 정상 범위)",
    unitWord: "예약",
    avgTicketTypical: 15000, avgTicketLabel: "예약 단가 (시간당)",
    closureStat: "공간임대업 폐업률 약 12%",
  },
  "online-digital": {
    label: "온라인 디지털", labelEn: "Online Digital",
    laborWarn: 40, laborCritical: 55, laborAvg: "30-50%",
    rentWarn: 6, rentCritical: 12, rentAvg: "0-8%",
    unitWord: "상품",
    avgTicketTypical: 30000, avgTicketLabel: "주문 객단가",
    closureStat: "온라인 사업 폐업률 약 14%",
  },
};

const FALLBACK: IndustryThresholds = {
  label: "사업장", labelEn: "Business",
  laborWarn: 30, laborCritical: 40, laborAvg: "25-35%",
  rentWarn: 15, rentCritical: 22, rentAvg: "8-15%",
  unitWord: "상품",
  closureStat: "한국 자영업 폐업률 약 12%",
};

export function getIndustryThresholds(industryCategoryId: string | undefined): IndustryThresholds {
  if (!industryCategoryId) return FALLBACK;
  return M[industryCategoryId] ?? FALLBACK;
}

export const INDUSTRY_THRESHOLDS = M;
