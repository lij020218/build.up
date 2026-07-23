"use client";

/**
 * OverlayModal — 공용 모달 셸 (2026-07-22, 냉정 리뷰로 신설).
 *
 *  전체 재고 모달(InventoryOpsCard showAllInventory)의 확립된 관례를 SSOT 로 추출:
 *  ① createPortal(document.body) — 대시보드 카드는 .dash-stagger-item(will-change:
 *     transform) 래퍼 안이라 position:fixed 의 containing block 이 카드가 됨 → portal 필수.
 *  ② 중앙 다이얼로그(min(maxWidth, 92vw)·radius 24·blur 배경·z 9999) — 데스크톱 관례.
 *  ③ ESC 닫기 + 배경 스크롤 잠금(scrollY 보존).
 */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
  label: string;
  onClose: () => void;
  maxWidth?: number;
  children: React.ReactNode;
};

export function OverlayModal({ label, onClose, maxWidth = 560, children }: Props) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(e) => { if (e.target === e.currentTarget) onCloseRef.current(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(15,23,42,0.40)", backdropFilter: "blur(6px)", padding: 16,
      }}
    >
      <div style={{
        width: `min(${maxWidth}px, 92vw)`, maxHeight: "85vh", overflowY: "auto",
        background: "#fff", borderRadius: 24, padding: "20px 20px 24px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
      }}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
