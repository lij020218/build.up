"use client";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps {
  children?: ReactNode;
  showRadialGradient?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const auroraCSS = `
@keyframes auroraMove {
  from { background-position: 50% 50%, 50% 50%; }
  to   { background-position: 350% 50%, 350% 50%; }
}
`;

export const AuroraBackground = ({
  children,
  showRadialGradient = true,
  className,
  style,
}: AuroraBackgroundProps) => {
  const bgGradient = "repeating-linear-gradient(100deg, #f7f6f3 0%, #f7f6f3 7%, transparent 10%, transparent 12%, #f7f6f3 16%)";
  const auroraGradient = "repeating-linear-gradient(100deg, #1d3557 10%, #457b9d 15%, #a8dadc 20%, #e0f0ff 25%, #1d3557 30%)";

  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #f7f6f3)",
        color: "var(--text, #111)",
        overflow: "hidden",
        ...style,
      }}
    >
      <style>{auroraCSS}</style>
      {/* Aurora layer */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: "-10px",
            backgroundImage: `${bgGradient}, ${auroraGradient}`,
            backgroundSize: "300% 100%, 200% 100%",
            backgroundPosition: "50% 50%, 50% 50%",
            filter: "blur(10px)",
            opacity: 0.35,
            pointerEvents: "none",
            willChange: "transform",
            animation: "auroraMove 60s linear infinite",
            ...(showRadialGradient
              ? { maskImage: "radial-gradient(ellipse at 100% 0%, black 10%, transparent 70%)" }
              : {}),
          }}
        />
        {/* After pseudo-element equivalent */}
        <div
          style={{
            position: "absolute",
            inset: "-10px",
            backgroundImage: `${bgGradient}, ${auroraGradient}`,
            backgroundSize: "200% 100%, 100% 100%",
            backgroundAttachment: "fixed",
            mixBlendMode: "difference",
            opacity: 0.3,
            pointerEvents: "none",
            animation: "auroraMove 60s linear infinite",
            ...(showRadialGradient
              ? { maskImage: "radial-gradient(ellipse at 100% 0%, black 10%, transparent 70%)" }
              : {}),
          }}
        />
      </div>
      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, width: "100%" }}>{children}</div>
    </div>
  );
};
