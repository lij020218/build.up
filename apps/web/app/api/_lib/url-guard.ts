/**
 * url-guard.ts — SSRF 방어 공유 유틸.
 *
 * 사용처: 사장님이 입력한 URL 을 서버가 fetch 하는 모든 라우트.
 *   - /api/integrations/saas-metrics/pull/connect  (write-time)
 *   - /api/integrations/saas-metrics/pull/test     (write-time)
 *   - /api/cron/funnel-pull                        (fetch-time, defense-in-depth)
 *
 * 검증 항목:
 *   1. https:// 강제 (http 평문 차단)
 *   2. 사설 IP·loopback·링크-로컬 차단 (AWS 메타데이터 169.254.169.254 포함)
 *   3. ULA·multicast 차단
 *
 * 한계: hostname 이 도메인이면 DNS 재바인딩 공격 가능 (DNS resolve 후 IP 재검증해야 완전).
 *       Vercel Edge runtime 한계로 hostname 기반 1차 방어까지만.
 *       프로덕션에선 outbound network ACL 로 추가 차단 권장.
 */

export function isPrivateOrLoopback(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  // 로컬·내부 호스트명
  if (lower === "localhost" || lower === "ip6-localhost" || lower === "ip6-loopback") return true;
  if (lower.endsWith(".localhost") || lower.endsWith(".local") || lower.endsWith(".internal")) return true;
  // IPv4 패턴
  const ipv4 = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [, a, b] = ipv4.map(Number) as [number, number, number, number, number];
    if (a === 10) return true;                          // 10.0.0.0/8
    if (a === 127) return true;                         // 127.0.0.0/8 loopback
    if (a === 0) return true;                           // 0.0.0.0/8
    if (a === 169 && b === 254) return true;            // 169.254.0.0/16 link-local (AWS/GCP metadata)
    if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12
    if (a === 192 && b === 168) return true;            // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true;  // 100.64.0.0/10 CGNAT
    if (a >= 224) return true;                          // multicast / reserved
  }
  // IPv6 — 단순 차단 (loopback, link-local, ULA)
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
  return false;
}

export function isValidHttpsUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || !u.hostname) return false;
    if (isPrivateOrLoopback(u.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}
