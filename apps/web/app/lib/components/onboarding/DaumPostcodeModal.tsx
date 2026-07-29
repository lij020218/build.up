"use client";

/**
 * DaumPostcodeModal — 다음(카카오) 우편번호 검색 모달 (무료·키 불요).
 *   온보딩 ② 주소 필드용 — 오타 주소는 상권·지역 맞춤을 망가뜨리므로 검색으로 입력.
 *   스크립트: t1.daumcdn.net (CSP script-src 에 기허용 — 카카오 지도용으로 이미 등재).
 *   iOS 는 /postcode 임베드 페이지 + WKWebView 로 동일 서비스 사용.
 */

import { useEffect, useRef } from "react";

type DaumPostcodeData = { roadAddress?: string; address?: string; zonecode?: string };
type DaumPostcodeCtor = new (opts: {
  oncomplete: (data: DaumPostcodeData) => void;
  width: string;
  height: string;
}) => { embed: (el: HTMLElement) => void };

declare global {
  interface Window {
    daum?: { Postcode?: DaumPostcodeCtor };
  }
}

const SCRIPT_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

function loadPostcodeScript(): Promise<DaumPostcodeCtor> {
  return new Promise((resolve, reject) => {
    const existing = window.daum?.Postcode;
    if (existing) { resolve(existing); return; }
    const prev = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    const onReady = () => {
      const ctor = window.daum?.Postcode;
      if (ctor) resolve(ctor);
      else reject(new Error("daum.Postcode unavailable"));
    };
    if (prev) { prev.addEventListener("load", onReady); return; }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = onReady;
    s.onerror = () => reject(new Error("postcode script load failed"));
    document.head.appendChild(s);
  });
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** 도로명 주소(없으면 지번) 선택 시 */
  onSelect: (address: string) => void;
};

export function DaumPostcodeModal({ open, onClose, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void loadPostcodeScript()
      .then((Postcode) => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = "";
        new Postcode({
          oncomplete: (data) => {
            const addr = data.roadAddress || data.address || "";
            if (addr) onSelect(addr);
            onClose();
          },
          width: "100%",
          height: "100%",
        }).embed(containerRef.current);
      })
      .catch(() => {
        // 스크립트 실패 시 모달 닫기 — 입력 필드 직접 타이핑 폴백은 항상 열려 있음
        if (!cancelled) onClose();
      });
    return () => { cancelled = true; };
  }, [open, onClose, onSelect]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 250,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: "480px", height: "min(560px, 80vh)",
        background: "#fff", borderRadius: "20px", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 60px rgba(17,17,17,0.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid rgba(17,17,17,0.06)" }}>
          <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>주소 검색</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{ background: "rgba(0,0,0,0.05)", border: "none", borderRadius: "999px", width: "30px", height: "30px", cursor: "pointer", fontSize: "14px", color: "var(--muted)" }}
          >
            ✕
          </button>
        </div>
        <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />
      </div>
    </div>
  );
}
