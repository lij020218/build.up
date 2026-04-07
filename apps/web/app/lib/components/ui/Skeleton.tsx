"use client";

import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: CSSProperties;
  className?: string;
}

/**
 * Apple 스타일 Skeleton shimmer 컴포넌트.
 * globals.css의 `.skeleton` 애니메이션(shimmer 1.5s)을 사용합니다.
 */
export function Skeleton({
  width = "100%",
  height = "16px",
  borderRadius = "8px",
  style,
  className,
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className ?? ""}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

/** 텍스트 줄 스켈레톤 — 여러 줄의 텍스트 로딩 */
export function SkeletonLines({ lines = 3, gap = "10px" }: { lines?: number; gap?: string }) {
  const widths = ["100%", "92%", "78%", "85%", "65%"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height="12px" width={widths[i % widths.length]} borderRadius="6px" />
      ))}
    </div>
  );
}

/** 카드 형태의 스켈레톤 */
export function CardSkeleton({ height = "180px" }: { height?: string }) {
  return (
    <div
      style={{
        borderRadius: "20px",
        padding: "24px",
        background: "rgba(255,255,255,0.6)",
        border: "1px solid rgba(0,0,0,0.04)",
      }}
    >
      <Skeleton width="40%" height="14px" borderRadius="6px" style={{ marginBottom: "16px" }} />
      <Skeleton width="70%" height="20px" borderRadius="8px" style={{ marginBottom: "20px" }} />
      <SkeletonLines lines={3} />
      <Skeleton
        width="120px"
        height="36px"
        borderRadius="10px"
        style={{ marginTop: "20px" }}
      />
    </div>
  );
}

/** 대시보드 전체 로딩용 — 앱 초기화 중 표시 */
export function DashboardSkeleton() {
  return (
    <div
      style={{
        maxWidth: "1080px",
        margin: "0 auto",
        padding: "48px 24px 72px",
      }}
    >
      {/* 히어로 영역 */}
      <div style={{ marginBottom: "32px" }}>
        <Skeleton width="80px" height="12px" borderRadius="6px" style={{ marginBottom: "12px" }} />
        <Skeleton width="60%" height="32px" borderRadius="10px" style={{ marginBottom: "10px" }} />
        <Skeleton width="45%" height="16px" borderRadius="8px" />
      </div>

      {/* 네비게이션 탭 */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
        {[80, 92, 72, 68, 100, 72, 76].map((w, i) => (
          <Skeleton key={i} width={`${w}px`} height="38px" borderRadius="999px" />
        ))}
      </div>

      {/* 카드 그리드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px",
        }}
      >
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton height="220px" />
      </div>
    </div>
  );
}
