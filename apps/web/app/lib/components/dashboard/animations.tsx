"use client";

import React, { useEffect, useRef, useState } from "react";

const EASE_OUT_SOFT = "cubic-bezier(0.22, 1, 0.36, 1)";

/* ─────────────────────────────────────────────────────────────────────────────
 * <CountUp /> — 숫자가 0 → target까지 부드럽게 카운트업.
 * RAF + ease-out-soft. framer-motion 의존성 없음.
 * ───────────────────────────────────────────────────────────────────────────── */
export function CountUp({
  to,
  duration = 0.9,
  format = (n) => Math.round(n).toLocaleString(),
  className,
  style,
}: {
  to: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const toRef = useRef(to);

  useEffect(() => {
    const start = performance.now();
    const from = fromRef.current;
    toRef.current = to;
    const durMs = Math.max(150, duration * 1000);
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durMs);
      // ease-out cubic (0.22, 1, 0.36, 1) approx
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = from + (to - from) * eased;
      setValue(cur);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  return (
    <span className={className} style={{ ...style, fontVariantNumeric: "tabular-nums" }}>
      {format(value)}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * <AnimatedBar /> — 세로 막대. CSS @keyframes dashBarGrow (scaleY origin bottom).
 * delay만 inline으로 주입.
 * ───────────────────────────────────────────────────────────────────────────── */
export function AnimatedBar({
  heightPct,
  delay = 0,
  duration = 0.7,
  style,
  children,
}: {
  heightPct: number;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="dash-bar-grow"
      style={{
        ...style,
        height: `${heightPct}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        animationTimingFunction: EASE_OUT_SOFT,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * <AnimatedProgressBar /> — 가로 진행률 바. CSS scaleX 애니메이션.
 * --target-scale CSS 변수로 최종 비율 전달.
 * ───────────────────────────────────────────────────────────────────────────── */
export function AnimatedProgressBar({
  pct,
  color,
  trackColor = "rgba(17,17,17,0.06)",
  height = 6,
  borderRadius = 3,
  delay = 0,
  duration = 0.95,
  style,
}: {
  pct: number;
  color: string;
  trackColor?: string;
  height?: number;
  borderRadius?: number;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
}) {
  const clamped = Math.max(0, Math.min(100, pct)) / 100;
  return (
    <div
      style={{
        ...style,
        height,
        borderRadius,
        background: trackColor,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        className="dash-progress-fill"
        style={{
          height: "100%",
          width: "100%",
          background: color,
          borderRadius,
          // CSS variable for keyframe
          ["--target-scale" as string]: clamped,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
        } as React.CSSProperties}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * <AnimatedPath /> — SVG path. stroke-dasharray + stroke-dashoffset 트릭.
 * useRef로 마운트 후 path.getTotalLength()로 정확한 길이 측정.
 * ───────────────────────────────────────────────────────────────────────────── */
export function AnimatedPath({
  d,
  stroke,
  strokeWidth = 1.4,
  fill = "none",
  delay = 0,
  duration = 1.1,
}: {
  d: string;
  stroke: string;
  strokeWidth?: number;
  fill?: string;
  delay?: number;
  duration?: number;
}) {
  const ref = useRef<SVGPathElement>(null);
  const [len, setLen] = useState<number | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      const total = ref.current.getTotalLength();
      setLen(total);
    } catch {
      setLen(200);
    }
  }, [d]);

  return (
    <path
      ref={ref}
      d={d}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="dash-path-draw"
      style={{
        ["--path-len" as string]: len ?? 1000,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      } as React.CSSProperties}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * <FadeInGroup /> — 카드 내부 작은 그룹용 fade+slide-up.
 * ───────────────────────────────────────────────────────────────────────────── */
export function FadeInGroup({
  delay = 0.15,
  duration = 0.45,
  children,
  style,
  className,
}: {
  delay?: number;
  duration?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`dash-stagger-item ${className ?? ""}`}
      style={{
        ...style,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    >
      {children}
    </div>
  );
}

export function useFirstMountFlag(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return ready;
}
