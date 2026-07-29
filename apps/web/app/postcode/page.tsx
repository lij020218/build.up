"use client";

/**
 * /postcode — 다음(카카오) 우편번호 검색 임베드 (iOS WKWebView 전용 도구 페이지).
 *   선택 결과(도로명 주소)를 window.webkit.messageHandlers.postcode 로 전달.
 *   인증 불필요한 정적 도구 페이지 — 개인 데이터 없음.
 *   웹 자체는 DaumPostcodeModal 을 쓰므로 이 페이지는 iOS 브리지 전용.
 */

import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

type PostcodeData = { roadAddress?: string; address?: string };
type WebkitBridge = { messageHandlers?: { postcode?: { postMessage: (msg: string) => void } } };

export default function PostcodePage() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => {
      const daum = (window as unknown as { daum?: { Postcode?: new (o: object) => { embed: (el: HTMLElement) => void } } }).daum;
      if (!daum?.Postcode || !ref.current) return;
      new daum.Postcode({
        oncomplete: (data: PostcodeData) => {
          const addr = data.roadAddress || data.address || "";
          const webkit = (window as unknown as { webkit?: WebkitBridge }).webkit;
          webkit?.messageHandlers?.postcode?.postMessage(addr);
        },
        width: "100%",
        height: "100%",
      }).embed(ref.current);
    };
    document.head.appendChild(s);
  }, []);

  return <div ref={ref} style={{ position: "fixed", inset: 0 }} />;
}
