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

export const metadata: Metadata = {
  title: "build.up — 창업 로드맵 멘토링",
  description: "단계별 창업 로드맵, 세무·자금·입지 분석, 지원사업 매칭까지. 예비 창업자를 위한 올인원 멘토링 서비스.",
  openGraph: {
    title: "build.up — 창업 로드맵 멘토링",
    description: "단계별 창업 로드맵, 세무·자금·입지 분석, 지원사업 매칭까지.",
    type: "website",
    locale: "ko_KR",
  },
  other: {
    "theme-color": "#1d3557",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
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
