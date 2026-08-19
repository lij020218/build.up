import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { rmSync, existsSync } from "fs";
import { join } from "path";

// dev 시작 시 .next 전체 삭제 — stale 서버+클라이언트 청크 방지
if (process.env.NODE_ENV !== "production") {
  const nextDir = join(process.cwd(), ".next");
  if (existsSync(nextDir)) {
    try { rmSync(nextDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 2026-07-15 보안: 프레임워크 핑거프린팅 방지 — `X-Powered-By: Next.js` 헤더 제거.
  poweredByHeader: false,
  transpilePackages: ["@foundone/shared", "@foundone/ai"],
  // 2026-08-19: Vercel(8GB) 빌드가 "Linting and checking validity of types" 에서 30분+ 멈춤(로컬은 60초 완주).
  //   GitHub Actions CI(.github/workflows/ci.yml: lint·typecheck·test·**next build 풀 타입체크**)는 같은 커밋을
  //   6분에 통과 → 코드 문제가 아니라 Vercel 환경 문제. 게이트는 CI + scripts/githooks/pre-push(푸시 전 tsc) 두 겹.
  //   Vercel 은 배포만 담당. 원인 해소되면 되돌릴 것.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async redirects() {
    return [
      { source: "/privacy", destination: "/legal/privacy", permanent: true },
      { source: "/terms", destination: "/legal/terms", permanent: true },
      // /analysis 는 고아 라우트 — 실제 분석 화면은 /analytics. 통합.
      { source: "/analysis", destination: "/analytics", permanent: false },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // dev에서 filesystem 캐시 완전 비활성화 — vendor-chunks ENOENT 방지
      config.cache = false;
    }
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
});
