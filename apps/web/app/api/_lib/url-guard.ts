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
 *   4. (nodejs runtime) DNS resolve 후 실제 IP 재검증 — DNS 재바인딩 방어 (assertSafeHttpsUrl)
 *
 * 사용 가이드:
 *   - isValidHttpsUrl: 동기 1차 방어 (protocol·hostname 문자열 검증). write-time 입력 검증용.
 *   - assertSafeHttpsUrl: fetch 직전 호출 (async). hostname 을 IP 로 resolve 해 사설망 재검증.
 *     반드시 fetch 직전에 호출해야 TOCTOU(write-time→fetch-time DNS 재바인딩) 창을 최소화.
 */

import { lookup } from "dns/promises";

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
  // IPv4-mapped IPv6 (::ffff:127.0.0.1, 0:0:0:0:0:ffff:10.0.0.1 등)
  if (lower.startsWith("::ffff:")) return isPrivateOrLoopback(lower.slice(7));
  if (lower.startsWith("0:0:0:0:0:ffff:")) return isPrivateOrLoopback(lower.slice(15));
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

/**
 * fetch 직전 SSRF 재검증 (nodejs runtime 전용, async).
 *  1차 동기 검증(isValidHttpsUrl) 통과 후, hostname 을 실제 IP 로 resolve 하여
 *  모든 resolve 된 주소가 사설/loopback/링크-로컬이 아닌지 재확인한다.
 *  → write-time 엔 공개 IP 였다가 fetch-time 에 사설 IP 로 바뀌는 DNS 재바인딩 공격 차단.
 *
 *  반환: { ok: true } | { ok: false, reason }. 호출부는 ok=false 면 fetch 를 중단해야 한다.
 */
export async function assertSafeHttpsUrl(raw: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  let hostname: string;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || !u.hostname) return { ok: false, reason: "https URL 아님" };
    hostname = u.hostname;
  } catch {
    return { ok: false, reason: "URL 파싱 실패" };
  }

  // hostname 문자열 자체가 사설 IP/내부 호스트명이면 즉시 차단.
  if (isPrivateOrLoopback(hostname)) return { ok: false, reason: "사설/내부 호스트" };

  // 대괄호 IPv6 리터럴([::1])은 URL.hostname 이 대괄호 제거해 주므로 그대로 검증됨.
  // hostname 이 IP 리터럴이면 DNS resolve 불필요 — 이미 위에서 검증됨.
  const isIpLiteral = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(":");
  if (isIpLiteral) return { ok: true };

  // 도메인 → 모든 A/AAAA 레코드 resolve 후 각 IP 재검증.
  try {
    const addrs = await lookup(hostname, { all: true });
    if (addrs.length === 0) return { ok: false, reason: "DNS resolve 실패" };
    for (const a of addrs) {
      if (isPrivateOrLoopback(a.address)) {
        return { ok: false, reason: `resolve 된 IP 가 사설망: ${a.address}` };
      }
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "DNS lookup 오류" };
  }
}
