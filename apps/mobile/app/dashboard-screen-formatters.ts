/**
 * dashboard-screen-formatters.ts
 *
 * 2026-05-27 Phase 2 — 모바일 dashboard-screen.tsx 모듈화 (2단계).
 *
 * 순수 formatter / parser 함수만 모음. closure 의존성 0.
 *
 * 포함:
 *   - parseManwonInput: "150" → 1,500,000 (만원 단위 입력 → 원 단위)
 *   - formatWonCompact: 1,500,000 → "150만원" / "KRW 1,500,000"
 *   - formatBreakEvenMonth: number → "5개월 차" / "Month 5"
 *
 * 향후 dashboard-screen-data.ts 로 합칠지 검토 (둘 다 순수 데이터 레이어).
 */

/**
 * 만원 단위 입력 → 원 단위 정수 변환.
 * - "150" → 1,500,000
 * - 빈 문자열·0·음수 → undefined (저장 안 함)
 */
export function parseManwonInput(raw: string): number | undefined {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) {
    return undefined;
  }

  const parsed = Number(digits);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed * 10000;
}

/**
 * 원 단위 → 압축 표기.
 * - 한국어: 1,500,000 → "150만원"
 * - 영어: 1,500,000 → "KRW 1,500,000"
 */
export function formatWonCompact(value: number, language: "ko" | "en"): string {
  if (!Number.isFinite(value) || value <= 0) {
    return language === "ko" ? "0원" : "KRW 0";
  }

  if (value >= 10000) {
    return language === "ko"
      ? `${Math.round(value / 10000).toLocaleString()}만원`
      : `KRW ${Math.round(value).toLocaleString()}`;
  }

  return language === "ko"
    ? `${Math.round(value).toLocaleString()}원`
    : `KRW ${Math.round(value).toLocaleString()}`;
}

/**
 * 손익분기 도달 월 → 라벨.
 * - null → "손익분기 미도달"
 * - 양수 N → "N개월"
 */
export function formatBreakEvenMonth(month: number | null | undefined, language: "ko" | "en"): string {
  if (month == null) {
    return language === "ko" ? "손익분기 미도달" : "Break-even not reached";
  }
  return language === "ko" ? `${month}개월` : `${month} months`;
}
