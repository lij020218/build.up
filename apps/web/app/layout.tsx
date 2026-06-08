import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import { LanguageProvider } from "./language-provider";
import { NotificationProvider } from "./notification-context";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 2026-05-19: maximumScale 제거 — 시력 약한 사장님 핀치 줌 허용 (WCAG 1.4.4 접근성 준수).
  // 카카오맵 등은 자체 줌 처리, 본문 텍스트·표 확대 가능해야 함.
  viewportFit: "cover",
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://foundone.dev";

export const metadata: Metadata = {
  title: "Found.One — 창업 로드맵 멘토링",
  description: "단계별 창업 로드맵, 세무·자금·입지 분석, 지원사업 매칭까지. 예비 창업자를 위한 올인원 멘토링 서비스.",
  metadataBase: new URL(BASE_URL),
  // icon/opengraph-image 는 app/icon.tsx · app/opengraph-image.tsx (next/og 로 PNG 생성)가
  //   파일 컨벤션으로 자동 주입 — SVG(크롤러 미렌더) 대신 PNG. 명시 지정 제거.
  openGraph: {
    title: "Found.One — 창업 로드맵 멘토링",
    description: "단계별 창업 로드맵, 세무·자금·입지 분석, 지원사업 매칭까지. 예비 창업자를 위한 올인원 멘토링 서비스.",
    type: "website",
    locale: "ko_KR",
    url: BASE_URL,
    siteName: "Found.One",
  },
  twitter: {
    card: "summary_large_image",
    title: "Found.One — 창업 로드맵 멘토링",
    description: "단계별 창업 로드맵, 세무·자금·입지 분석, 지원사업 매칭까지.",
  },
  other: {
    "theme-color": "#191970",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Found.One",
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_KAKAO_JS_KEY && (
          <script
            type="text/javascript"
            src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&libraries=services&autoload=false`}
            async
          />
        )}
      </head>
      <body>
        <NotificationProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
