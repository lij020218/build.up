/**
 * 노동법·세법 무지 보호 — 위반/경계 자동 탐지 SSOT.
 *
 *  ── 사용자 명령 (2026-05-09) ──────────────────────────────
 *  "사용자들이 무지에 의한 피해를 보지 않게" — 주휴수당·연차수당·5인 임계·
 *  간이→일반 전환 등을 데이터 기반 *선제* 알림으로 막는다.
 *  ────────────────────────────────────────────────
 *
 *  ⚠️ 모든 결과는 "참고용 운영 보조" — 법률 자문 아님.
 *      복잡한 분쟁·정확한 계산은 노무사·세무사 영역.
 *      알림 텍스트에 면책 문구 필수.
 */

// ═══════════════════════════════════════════════════════════════
//   1. 주 15시간 임계 — 주휴수당 발생 사전 경고
// ═══════════════════════════════════════════════════════════════
//
//  근로기준법 제55조: 주 15시간 이상 근로 + 1주 개근 → 주휴수당 의무.
//  무지로 14h~15h 사이 근로한 알바님께 미지급하면 임금체불 (3년 시효, 형사처벌).

export type WeeklyHoursCheck = {
  employeeId: string;
  employeeName: string;
  weeklyHours: number;
  /** 임계까지 남은 시간 (음수 = 이미 초과) */
  hoursToThreshold: number;
  /** 위험 단계 — 알림 색상 분기 */
  level: "safe" | "approaching" | "exceeded";
  /** 행동 제안 */
  suggestion: string;
};

export function checkWeeklyHoursThreshold(
  employees: Array<{ id: string; name: string; weeklyHours: number }>,
): WeeklyHoursCheck[] {
  return employees
    .filter((e) => e.weeklyHours > 0)
    .map((e) => {
      const hoursToThreshold = 15 - e.weeklyHours;
      const level: WeeklyHoursCheck["level"] =
        e.weeklyHours >= 15 ? "exceeded"
        : e.weeklyHours >= 13.5 ? "approaching"
        : "safe";
      const suggestion =
        level === "exceeded"
          ? `주 ${e.weeklyHours}시간 — 주휴수당 대상. 이번 주 개근 시 1일분 추가 지급 의무.`
          : level === "approaching"
            ? `주 ${e.weeklyHours}시간 — 1.5시간 추가 시 주휴수당 발생. 다음 주 분배 검토.`
            : `주 ${e.weeklyHours}시간 — 주휴수당 미발생 구간.`;
      return {
        employeeId: e.id,
        employeeName: e.name,
        weeklyHours: e.weeklyHours,
        hoursToThreshold,
        level,
        suggestion,
      };
    });
}

// ═══════════════════════════════════════════════════════════════
//   2. 연차유급휴가 1년 도래 — 미부여 시 수당 의무
// ═══════════════════════════════════════════════════════════════
//
//  근로기준법 제60조: 1년 이상 근속 → 15일 연차유급휴가.
//  미사용 연차는 수당으로 환산 (1일 = 통상임금). 미부여·미지급 시 임금체불.

export type AnnualLeaveCheck = {
  employeeId: string;
  employeeName: string;
  hireDate: string;
  /** 입사 후 경과 일수 */
  daysSinceHire: number;
  /** 1년 도래까지 남은 일수 */
  daysUntilYearMark: number;
  level: "safe" | "approaching" | "due" | "overdue";
  suggestion: string;
};

export function checkAnnualLeaveAccrual(
  employees: Array<{ id: string; name: string; hireDate?: string }>,
): AnnualLeaveCheck[] {
  const today = new Date();
  return employees
    .filter((e) => !!e.hireDate)
    .map((e) => {
      const hireDate = new Date(e.hireDate!);
      const daysSinceHire = Math.floor((today.getTime() - hireDate.getTime()) / 86_400_000);
      const daysUntilYearMark = 365 - daysSinceHire;
      const level: AnnualLeaveCheck["level"] =
        daysSinceHire >= 730 ? "overdue"  // 2년 이상 — 추가 연차 누적
        : daysSinceHire >= 365 ? "due"     // 1년 도래
        : daysUntilYearMark <= 14 ? "approaching" // D-14 이내
        : "safe";
      const suggestion =
        level === "overdue"
          ? `${e.name}님 ${Math.floor(daysSinceHire / 365)}년차 — 연차 누적 점검 필요. 미사용 시 수당 의무.`
          : level === "due"
            ? `${e.name}님 입사 1년 도래 — 연차 15일 발생. 미부여 시 수당 환산 필요.`
            : level === "approaching"
              ? `${e.name}님 입사 1년 D-${daysUntilYearMark} — 연차 발생 임박, 부여 또는 수당 준비.`
              : `${e.name}님 입사 ${Math.floor(daysSinceHire / 30)}개월차 — 연차 도래 ${daysUntilYearMark}일 남음.`;
      return {
        employeeId: e.id,
        employeeName: e.name,
        hireDate: e.hireDate!,
        daysSinceHire,
        daysUntilYearMark,
        level,
        suggestion,
      };
    });
}

// ═══════════════════════════════════════════════════════════════
//   3. 5인 미만 → 5인 이상 임계 시뮬레이션
// ═══════════════════════════════════════════════════════════════
//
//  근로기준법: 5인 이상 사업장 적용 변화
//   - 연차유급휴가 의무 (5인 미만 무관)
//   - 연장·야간·휴일근로 가산수당 50% 의무
//   - 부당해고 제한 (해고 사유 정당 + 노동위원회 구제 신청 가능)
//   - 직장 내 괴롭힘 / 휴업수당 등

export type FivePersonThresholdInfo = {
  currentCount: number;
  isApproaching: boolean; // 4명 (1명 추가 시 변경)
  isAboveThreshold: boolean; // 5명+
  /** 1명 추가 시 발생할 추가 의무 — 텍스트 리스트 */
  newObligations: string[];
};

export function checkFivePersonThreshold(currentCount: number): FivePersonThresholdInfo {
  const isApproaching = currentCount === 4;
  const isAboveThreshold = currentCount >= 5;
  const newObligations = [
    "연차유급휴가 의무 부여 (1년 이상 근속자 15일)",
    "연장·야간·휴일근로 50% 가산수당",
    "부당해고 제한 (정당 사유 + 노동위원회 구제)",
    "직장 내 괴롭힘 금지법 적용",
    "휴업수당 의무 (사용자 귀책 휴업 시 70%)",
  ];
  return { currentCount, isApproaching, isAboveThreshold, newObligations };
}

// ═══════════════════════════════════════════════════════════════
//   4. 간이과세 → 일반과세 전환 임박 (연 1억 400만원)
// ═══════════════════════════════════════════════════════════════
//
//  부가가치세법 시행령 제109조: 직전 연도 매출 1억 400만원 이상 → 일반과세자 전환.
//  무지로 매출 신고 누락 / 환급 시점 오해 시 가산세 발생.

export const SIMPLIFIED_TAX_THRESHOLD_KRW = 104_000_000;

export type SimplifiedTaxCheck = {
  yearlySales: number;
  threshold: number;
  /** % 진입률 (0~120) */
  progressPct: number;
  level: "safe" | "approaching" | "near" | "exceeded";
  suggestion: string;
};

export function checkSimplifiedTaxTransition(yearlySales: number): SimplifiedTaxCheck {
  const progressPct = Math.round((yearlySales / SIMPLIFIED_TAX_THRESHOLD_KRW) * 1000) / 10;
  const level: SimplifiedTaxCheck["level"] =
    progressPct >= 100 ? "exceeded"
    : progressPct >= 80 ? "near"
    : progressPct >= 60 ? "approaching"
    : "safe";
  const suggestion =
    level === "exceeded"
      ? `직전 연도 매출 1억 400만 초과 — 다음 해 7월부터 일반과세자 전환. 매입세액 공제 활용 가능.`
      : level === "near"
        ? `매출 ${progressPct}% 진입 — 일반과세 전환 임박. 세금계산서 발행 준비 검토.`
        : level === "approaching"
          ? `매출 ${progressPct}% 진입 — 추세 유지 시 연말 1억 도달. 적격증빙 수취 습관 시작.`
          : `간이과세 안전 구간 (${progressPct}%).`;
  return {
    yearlySales,
    threshold: SIMPLIFIED_TAX_THRESHOLD_KRW,
    progressPct,
    level,
    suggestion,
  };
}

// ═══════════════════════════════════════════════════════════════
//   5. 현금영수증 의무발행 업종 (참고용 메타)
// ═══════════════════════════════════════════════════════════════
//  소득세법 시행령 제210조의2: 의무발행 업종에서 10만원 이상 거래 시 현금영수증 의무.
//  미발행 시 발행의무 위반금 (거래대금 20%) 부과.

export const CASH_RECEIPT_MANDATORY_CATEGORIES = new Set([
  "food",          // 일반 음식점·휴게음식점
  "cafe-dessert",  // 제과점업
  "education",     // 학원
  "beauty",        // 미용·이용·피부관리·네일·왁싱
  "fitness",       // 헬스장
  "pet",           // 동물병원·미용
]);

export function isCashReceiptMandatoryCategory(categoryId: string): boolean {
  return CASH_RECEIPT_MANDATORY_CATEGORIES.has(categoryId);
}

// ═══════════════════════════════════════════════════════════════
//   공통 — 면책 문구
// ═══════════════════════════════════════════════════════════════

export const LEGAL_DISCLAIMER_KO = "참고용 운영 보조 안내 — 법률 자문이 아닙니다. 분쟁·정확한 계산은 노무사·세무사 상담 권장.";
export const LEGAL_DISCLAIMER_EN = "Operational guidance — not legal advice. Consult a labor attorney/CPA for disputes.";
