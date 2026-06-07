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
    // self-comparison(ab,ab) 은 ab.length 를 timing 으로 노출 — max-pad 방식으로 수정.
    // 더 짧은 버퍼를 max(len_a, len_b) 로 0-패딩 후 비교 → 길이 정보 타이밍 유출 차단.
    const maxLen = Math.max(ab.length, bb.length);
    const padA = Buffer.concat([ab, Buffer.alloc(maxLen - ab.length)]);
    const padB = Buffer.concat([bb, Buffer.alloc(maxLen - bb.length)]);
    timingSafeEqual(padA, padB); // 항상 false (길이 불일치); 그래도 상수시간으로 실행
    return false;
  }
  return timingSafeEqual(ab, bb);
}
