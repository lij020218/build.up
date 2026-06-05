import { timingSafeEqual } from "node:crypto";

/**
 * 상수시간(constant-time) 문자열 비교 — timing 공격 방지.
 * cron secret·토큰 검증처럼 비밀값을 단순 `===` 로 비교하면 일치 길이에 따라 응답시간이
 * 미세하게 달라져 이론적으로 한 글자씩 추측당할 수 있다. 길이 불일치도 안전하게 처리한다.
 * 둘 중 하나라도 비어있으면 false.
 */
export function timingSafeEqualStr(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    // 길이 노출 방지용 더미 비교 후 false (early-return 으로 길이를 누설하지 않음)
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}
