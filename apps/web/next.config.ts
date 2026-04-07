import type { NextConfig } from "next";
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
  reactStrictMode: false,
  transpilePackages: ["@build-up/shared", "@build-up/ai"],
  webpack: (config, { dev }) => {
    if (dev) {
      // dev에서 filesystem 캐시 완전 비활성화 — vendor-chunks ENOENT 방지
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
