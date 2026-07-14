import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const h = response.headers;

  // Clickjacking / MIME sniffing / referer leakage
  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-Frame-Options", "DENY");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 2026-05-27 보안 (P1-1): HSTS — foundone.dev 의 HTTPS 다운그레이드/MITM 방어.
  //   max-age 1년 + includeSubDomains + preload (Chrome HSTS preload list 신청 가능).
  //   ※ HTTP 응답에선 무시되므로 안전 (HTTPS 환경에서만 효과).
  //   ※ 한 번 설정 후엔 max-age 만료까지 클라이언트가 HTTP 접속 자체 차단 — preload 등록 신중히.
  h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // Disable microphone/camera/geolocation by default
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

  // Content-Security-Policy
  //
  // ⚠️ 2026-05-27 보안 (P1-4): 'unsafe-inline' + 'unsafe-eval' 잔존 — XSS 방어가 약함.
  //   필요 이유:
  //     1. Next.js 가 hydration 시 inline <script> 삽입 (__NEXT_DATA__ 등)
  //     2. PortOne SDK 가 결제 위젯 띄울 때 inline 코드 평가
  //   완전 제거하려면:
  //     A) Next.js: middleware 에서 nonce 발급 → server component 가 그 nonce 를 모든 inline 에 부여.
  //        next.config 의 `experimental.cspNonce` + getInitialProps 변환 필요. 큰 작업.
  //     B) PortOne SDK 를 iframe (sandbox) 안으로 격리 — UX 영향 확인 필요.
  //   현재 완화책:
  //     - object-src 'none' / frame-ancestors 'none' / base-uri 'self' 로 다른 벡터 차단
  //     - script-src 화이트리스트 (cdn.portone.io 만 외부 허용)
  //     - DOMPurify 등 입력 sanitize 책임은 컴포넌트 레이어 (LocationMapPanel 등)
  //   TODO (post-launch P1): nonce 기반 CSP 마이그레이션.
  //
  // frame-ancestors replaces X-Frame-Options in modern browsers.
  // base-uri + form-action prevent injection attacks.
  h.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      // 카카오 지도 SDK: dapi.kakao.com(sdk.js) → 내부적으로 t1.daumcdn.net 의 지도 엔진 스크립트 로드.
      //   (지도 타일 이미지·API 연결은 아래 img-src/connect-src 의 https: 가 커버)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.portone.io https://pay.portone.io https://dapi.kakao.com https://t1.daumcdn.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      // 2026-07-15 보안: connect-src 를 'https:' 와일드카드 → 명시 allowlist 로 축소.
      //   목적: XSS 가 생기더라도 탈취 토큰을 임의 호스트로 exfil(fetch/beacon/ws) 하지 못하게 봉쇄.
      //   실제 브라우저 연결처만 허용 — 클라이언트는 외부로 직접 fetch 하지 않고 전부 /api(self)
      //   경유. 나머지는 SDK: Supabase(REST+realtime wss)·Sentry(telemetry)·PortOne(결제)·Kakao(지도).
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.portone.io https://dapi.kakao.com https://*.daumcdn.net https://t1.daumcdn.net",
      "media-src 'self'",
      "object-src 'none'",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  return response;
}

export const config = {
  // Skip Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)"],
};
