/**
 * biz-number.ts — 사업자등록번호 형식 검증 SSOT (2026-08-03)
 *
 * 한국 국세청 표준 체크섬 (가중치 [1,3,7,1,3,7,1,3,5]).
 *  원본: iOS StoreInfoValidators.isValidBusinessNumber — 웹·서버가 못 쓰던 것을 shared 승격.
 *  용도: 국세청 API 호출 전 오입력 조기 차단 (형식 오류를 "미등록"으로 오판하는 사고 방지).
 */

export function normalizeBizNumber(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidBizNumber(raw: string): boolean {
  const digits = normalizeBizNumber(raw).split("").map(Number);
  if (digits.length !== 10) return false;
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i]! * weights[i]!;
  sum += Math.floor((digits[8]! * 5) / 10);
  const check = (10 - (sum % 10)) % 10;
  return check === digits[9];
}

/** 표시용 하이픈 포맷 (000-00-00000) — 10자리가 아닐 땐 원문 유지 */
export function formatBizNumber(raw: string): string {
  const d = normalizeBizNumber(raw);
  if (d.length !== 10) return raw;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}
