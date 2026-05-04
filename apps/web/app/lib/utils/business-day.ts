/**
 * Business Day Cutoff — KST 기준 "오늘"을 사장님의 영업 흐름에 맞춰 계산.
 *
 * 규칙:
 *   1) 온라인·디지털·스타트업 (closeTime 없음) → KST 자정 기준 일반 캘린더 일자
 *   2) 오프라인 영업장 (closeTime 있음) → 영업 종료 시각 + 30분 버퍼가 일자 분기점
 *      예) 카페 22:00 마감 → 22:30 까지는 "오늘", 22:31 부터 "내일"의 영업일
 *      예) 바 01:00 마감 → 01:30 까지는 "어제(달력)"의 영업일, 01:31 부터 새 영업일
 *
 * 30분 버퍼는 마감 정산·청소·매출 입력 시간 확보용 (한국 SMB 실무 관행).
 *
 * 모든 결과는 KST(Asia/Seoul) 기준 YYYY-MM-DD 문자열.
 */

const BUFFER_MINUTES = 30;

/**
 * 시각 문자열 ("HH:MM" 24h) → 분 단위. 잘못된 입력은 null.
 */
function parseHmm(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  if (h < 0 || h > 24 || min < 0 || min > 59) return null;
  // 24:00 == 다음날 00:00 — 24시간 영업 의미로 사용 시 cutoff 없음 처리
  if (h === 24) return null;
  return h * 60 + min;
}

/**
 * Date 를 KST(UTC+9) 기준 components 로 분해.
 * Intl.DateTimeFormat 으로 안정적으로 추출 (서버·브라우저 동일).
 */
function toKstParts(d: Date): { year: number; month: number; day: number; hour: number; minute: number } {
  // ko-KR locale + Asia/Seoul TZ — 한국 표준시 강제
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  // en-CA 는 YYYY-MM-DD 포맷 — parts 추출이 안정적
  const parts = fmt.formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24, // "24" 가 나올 일 없지만 안전망
    minute: get("minute"),
  };
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatKstDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * KST 기준 (year,month,day) 에 +/- 일수를 더한 결과를 YYYY-MM-DD 로 반환.
 * 월말·연말 경계도 안전 (Date 객체로 정규화).
 */
function shiftKstDay(year: number, month: number, day: number, deltaDays: number): string {
  // KST 12:00 (낮) 시점으로 잡으면 timezone 변환에서도 같은 날짜 유지됨
  const utc = Date.UTC(year, month - 1, day, 12, 0, 0); // month: 0-index
  const shifted = new Date(utc + deltaDays * 86400000);
  // shifted 의 KST 일자를 다시 추출
  const p = toKstParts(shifted);
  return formatKstDate(p.year, p.month, p.day);
}

export type BusinessDayCtx = {
  /** 업종 카테고리 — online-digital / startup-tech 면 closeTime 무시하고 자정 기준 */
  categoryId?: string | null | undefined;
  /** 영업 종료 시각 "HH:MM" (24h). 없으면 자정 기준. */
  closeTime?: string | null | undefined;
};

/**
 * 사장님의 "오늘 영업일"을 KST 기준 YYYY-MM-DD 로 반환.
 *
 * @param now 현재 시각 (테스트용 주입 가능, 기본은 new Date())
 * @param ctx categoryId + closeTime
 */
export function getBusinessDay(now: Date = new Date(), ctx: BusinessDayCtx = {}): string {
  const isOnlineKind = ctx.categoryId === "online-digital" || ctx.categoryId === "startup-tech";
  const closeMin = isOnlineKind ? null : parseHmm(ctx.closeTime);

  const k = toKstParts(now);
  const todayStr = formatKstDate(k.year, k.month, k.day);

  // 온라인·스타트업 또는 closeTime 미설정 → KST 자정 기준 표준 일자
  if (closeMin === null) return todayStr;

  const cutoffMin = (closeMin + BUFFER_MINUTES) % (24 * 60); // 24:00 wrap
  const nowMin = k.hour * 60 + k.minute;

  // 늦은-새벽 마감 (예: 01:00 → cutoff 01:30) — 자정 넘겨 영업
  // closeMin < 12:00(720) 이면 늦은-새벽 마감으로 간주.
  if (closeMin < 12 * 60) {
    // 자정 ~ cutoff 사이는 어제(달력) 영업일에 속함
    if (nowMin < cutoffMin) {
      return shiftKstDay(k.year, k.month, k.day, -1);
    }
    return todayStr;
  }

  // 일반 (오후·저녁) 마감 (예: 22:00 → cutoff 22:30)
  // cutoff 지나면 다음 영업일(다음 달력일)로 롤오버
  if (nowMin >= cutoffMin) {
    return shiftKstDay(k.year, k.month, k.day, +1);
  }
  return todayStr;
}

/**
 * 단순 KST 캘린더 일자 (YYYY-MM-DD). closeTime 무관.
 * 마감 시각과 무관한 기록 (예: 회계연도 기준)에서 사용.
 */
export function getKstDate(now: Date = new Date()): string {
  const k = toKstParts(now);
  return formatKstDate(k.year, k.month, k.day);
}

/**
 * 분 단위 차이 (양수: 미래) — 디버그·테스트용.
 */
export function _kstDebug(now: Date = new Date()) {
  return toKstParts(now);
}
