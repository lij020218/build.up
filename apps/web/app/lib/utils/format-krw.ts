/**
 * formatKrw — 정확한 원화 표시 (반올림 없이 절삭, 만/억 단위 압축).
 *
 * 사용처: 대시보드 카드·내 설정·구독 매니저 등 사장님에게 매출 금액을 보여줄 때.
 * 음수 지원, NaN/Infinity → "—".
 *
 *   formatKrw(0)           → "0원"
 *   formatKrw(9_990)       → "9,990원"
 *   formatKrw(15_000)      → "1만 5,000원"
 *   formatKrw(2_500_000)   → "250만원"
 *   formatKrw(105_000_000) → "1억 500만원"
 *   formatKrw(-50_000)     → "-5만원"
 *
 * (OperationalDashboard.tsx 와 ProfileView.tsx 의 동일한 `fmt` 를 SSOT 화)
 */
export function formatKrw(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n));
  if (abs >= 100_000_000) {
    const eok = Math.floor(abs / 100_000_000);
    const remain = abs % 100_000_000;
    const man = Math.floor(remain / 10_000);
    return man > 0 ? `${sign}${eok}억 ${man.toLocaleString()}만원` : `${sign}${eok}억원`;
  }
  if (abs >= 10_000) {
    const man = Math.floor(abs / 10_000);
    const remain = abs % 10_000;
    return remain > 0
      ? `${sign}${man.toLocaleString()}만 ${remain.toLocaleString()}원`
      : `${sign}${man.toLocaleString()}만원`;
  }
  return `${sign}${abs.toLocaleString()}원`;
}
