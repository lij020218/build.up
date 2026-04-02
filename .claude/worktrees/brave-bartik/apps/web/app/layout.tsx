import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { LanguageProvider } from "./language-provider";
import { NotificationProvider } from "./notification-context";

export const metadata: Metadata = {
  title: "build.up",
  description: "Roadmap-first startup companion"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
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
