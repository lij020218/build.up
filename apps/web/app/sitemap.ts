import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://foundone.dev";

// 공개(비인증) 페이지만 — 대시보드 등 로그인 게이트 라우트는 SEO 대상 아님.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    // /pricing 은 결제 게이트(NEXT_PUBLIC_BILLING_ENABLED) 닫힘 + 출시 초기 SEO 불필요 → 미등재.
    { url: `${BASE_URL}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
