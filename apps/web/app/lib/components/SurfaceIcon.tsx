import type { DashboardSurface } from "../types";

export function SurfaceIcon(props: { surface: DashboardSurface }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };

  if (props.surface === "home") {
    return (
      <svg {...common}>
        <path d="M2.5 7.2 8 2.8l5.5 4.4" />
        <path d="M4.2 6.7V13h7.6V6.7" />
      </svg>
    );
  }

  if (props.surface === "current") {
    return (
      <svg {...common}>
        <rect x="3" y="2.8" width="10" height="10.4" rx="2.2" />
        <path d="M5.2 5.6h5.6M5.2 8h3.8" />
      </svg>
    );
  }

  if (props.surface === "roadmap") {
    return (
      <svg {...common}>
        <path d="M4 4.5h8" />
        <path d="M4 8h8" />
        <path d="M4 11.5h5.5" />
        <circle cx="2.8" cy="4.5" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="2.8" cy="8" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="2.8" cy="11.5" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (props.surface === "guides") {
    return (
      <svg {...common}>
        <path d="M4.2 3.2h7.6a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H4.2a1 1 0 0 1-1-1V4.2a1 1 0 0 1 1-1Z" />
        <path d="M5.5 5.7h5M5.5 8h5M5.5 10.3h3.2" />
      </svg>
    );
  }

  if (props.surface === "franchise") {
    return (
      <svg {...common}>
        <path d="M3 13V5.5L8 3l5 2.5V13" />
        <path d="M6 13V9h4v4" />
        <path d="M3 5.5h10" />
      </svg>
    );
  }

  if (props.surface === "analytics") {
    return (
      <svg {...common}>
        <rect x="2.5" y="9" width="2.5" height="4" rx="0.6" />
        <rect x="6.75" y="5.5" width="2.5" height="7.5" rx="0.6" />
        <rect x="11" y="2.5" width="2.5" height="10.5" rx="0.6" />
      </svg>
    );
  }

  if (props.surface === "reports") {
    // 문서 + 우상단 접힘 + 안에 mini bar chart — 보고서·요약 시각화
    return (
      <svg {...common}>
        <path d="M3.8 2.5h6.4l2.4 2.4V12.5a1 1 0 0 1-1 1H3.8a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
        <path d="M10 2.5v2.4h2.6" />
        <rect x="5.2" y="9.4" width="1.2" height="2.2" rx="0.3" fill="currentColor" stroke="none" />
        <rect x="7.4" y="7.8" width="1.2" height="3.8" rx="0.3" fill="currentColor" stroke="none" />
        <rect x="9.6" y="6.6" width="1.2" height="5" rx="0.3" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="8" cy="5.3" r="2.2" />
      <path d="M3.8 12.5c1.1-1.8 2.6-2.7 4.2-2.7s3.1.9 4.2 2.7" />
    </svg>
  );
}
