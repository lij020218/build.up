"use client";

/**
 * ReportDonut — 비용 분해를 4종 시각화로 한 번에 보여주는 카드.
 *
 * 사용자 요청 (2026-05-04): "여러 그래프 (막대·스파크·도넛) 넣어 이해가 착착 되게"
 *
 * 한 카드 안에 4종:
 *   1. 도넛 (좌) — 5개 항목 비율
 *   2. 우측 5라벨 — 색점 + 항목명 + 금액 + horizontal bar(% 강조)
 *   3. 각 라벨 끝 mini sparkline (6개월 추이, costHistory 기반)
 *   4. 변화율 화살표 (이전 기간 대비)
 *
 * Apple 미니멀 — 사이드 컬러 strip 사용 X, 1px outline + midnight 단색.
 */

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const MIDNIGHT = "#191970";
const GREEN = "#059669";
const RED = "#dc2626";

// 도넛 5개 색상 — midnight 그라디언트 (단색의 명도 변형, 무지개 X)
const SLICE_COLORS = [
  "#191970",        // ingredients — 가장 진함
  "#3b3b96",        // labor
  "#6b6bb8",        // rent
  "#9b9bd4",        // utilities
  "#cbcbe8",        // other
];

type CostBreakdown = { ingredients: number; labor: number; rent: number; utilities: number; other: number };

// 6개월 추이 시리즈 (costHistory 변환 결과)
type CostTrendSeries = {
  ingredients: number[];
  labor: number[];
  rent: number[];
  utilities: number[];
  other: number[];
};

type Props = {
  ko: boolean;
  current: CostBreakdown;
  /** 이전 기간 비용 분해 — 변화율 계산용 (없으면 화살표 미표시) */
  prev?: CostBreakdown;
  /** 항목별 6개월 추이 — sparkline 용 (값 부족 시 자동 미표시) */
  trend?: CostTrendSeries;
  /** 카드 제목 — period 라벨 */
  label: string;
};

const fmtKrw = (n: number): string => {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`;
  return `${Math.round(n).toLocaleString()}`;
};

export function ReportDonut({ ko, current, prev, trend, label }: Props) {
  const total = current.ingredients + current.labor + current.rent + current.utilities + current.other;

  const items = useMemo(() => {
    const order: (keyof CostBreakdown)[] = ["ingredients", "labor", "rent", "utilities", "other"];
    const labelMap: Record<keyof CostBreakdown, { ko: string; en: string }> = {
      ingredients: { ko: "재료비", en: "Ingredients" },
      labor:       { ko: "인건비", en: "Labor" },
      rent:        { ko: "임대료", en: "Rent" },
      utilities:   { ko: "공과금", en: "Utilities" },
      other:       { ko: "기타",   en: "Other" },
    };
    return order.map((key, i) => {
      const value = current[key];
      const pct = total > 0 ? (value / total) * 100 : 0;
      const prevValue = prev?.[key];
      const deltaPct = prevValue && prevValue > 0
        ? ((value - prevValue) / prevValue) * 100
        : null;
      const series = trend?.[key]?.slice(-6) ?? [];
      return {
        key,
        labelKo: labelMap[key].ko,
        labelEn: labelMap[key].en,
        value,
        pct,
        color: SLICE_COLORS[i],
        deltaPct,
        series,
      };
    });
  }, [current, prev, trend, total]);

  if (total === 0) {
    return (
      <div style={cardStyle} className="bento-card">
        <div style={cardEyebrow}>{ko ? "비용 분해" : "Cost breakdown"} · {label}</div>
        <div style={emptyStyle}>
          {ko ? "비용 데이터가 모이면 도넛·막대·추이 차트로 보여드려요." : "Donut/bar/trend charts appear once cost data exists."}
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle} className="bento-card">
      <div style={headerRow}>
        <div style={cardEyebrow}>{ko ? "비용 분해" : "Cost breakdown"} · {label}</div>
        <div style={totalCount}>{ko ? "총" : "total"} <strong style={{ color: MIDNIGHT, marginLeft: 4 }}>{fmtKrw(total)}원</strong></div>
      </div>

      <div style={bodyRow}>
        {/* 좌측: 도넛 */}
        <Donut items={items} size={120} />

        {/* 우측: 5라벨 + bar + sparkline + delta */}
        <div style={labelsCol}>
          {items.map((item) => (
            <CostRow key={item.key} item={item} ko={ko} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Donut({ items, size }: { items: Array<{ key: string; pct: number; color: string }>; size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const innerR = r * 0.62;

  let cumulative = 0;
  const arcs = items
    .filter((it) => it.pct > 0)
    .map((it) => {
      const startAngle = (cumulative / 100) * 360 - 90;
      const endAngle = ((cumulative + it.pct) / 100) * 360 - 90;
      cumulative += it.pct;
      return { ...it, startAngle, endAngle };
    });

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleDeg: number) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    return { x: centerX + radius * Math.cos(angleRad), y: centerY + radius * Math.sin(angleRad) };
  };

  const arcPath = (startAngle: number, endAngle: number, outerR: number, innerR: number): string => {
    const start = polarToCartesian(cx, cy, outerR, endAngle);
    const end = polarToCartesian(cx, cy, outerR, startAngle);
    const startInner = polarToCartesian(cx, cy, innerR, endAngle);
    const endInner = polarToCartesian(cx, cy, innerR, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", outerR, outerR, 0, largeArc, 0, end.x, end.y,
      "L", endInner.x, endInner.y,
      "A", innerR, innerR, 0, largeArc, 1, startInner.x, startInner.y,
      "Z",
    ].join(" ");
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {arcs.map((arc) => (
        <path
          key={arc.key}
          d={arcPath(arc.startAngle, arc.endAngle, r, innerR)}
          fill={arc.color}
        />
      ))}
    </svg>
  );
}

function CostRow({ item, ko }: { item: { labelKo: string; labelEn: string; value: number; pct: number; color: string; deltaPct: number | null; series: number[] }; ko: boolean }) {
  return (
    <div style={rowStyle}>
      {/* 색점 + 라벨 */}
      <div style={rowFirst}>
        <span style={{ ...colorDot, background: item.color }} />
        <span style={rowLabel}>{ko ? item.labelKo : item.labelEn}</span>
      </div>
      {/* horizontal bar (%) */}
      <div style={barTrack}>
        <div style={{ ...barFill, width: `${Math.min(100, item.pct)}%`, background: item.color }} />
      </div>
      <span style={rowPct}>{Math.round(item.pct)}%</span>
      <span style={rowAmount}>{fmtKrw(item.value)}원</span>
      {/* mini sparkline (6 pt) */}
      <MiniSpark series={item.series} color={item.color} />
      {/* delta arrow */}
      <DeltaBadge delta={item.deltaPct} />
    </div>
  );
}

function MiniSpark({ series, color }: { series: number[]; color: string }) {
  if (series.length < 2) {
    return <div style={miniSparkPlaceholder} />;
  }
  const max = Math.max(...series, 1);
  const W = 36;
  const H = 14;
  const points = series.map((v, i) => {
    const x = (i / (series.length - 1)) * W;
    const y = H - (v / max) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ flexShrink: 0 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta == null) return <span style={deltaPlaceholder} />;
  const rounded = Math.round(delta * 10) / 10;
  const color = rounded >= 2 ? RED : rounded <= -2 ? GREEN : "rgba(15,23,42,0.45)"; // 비용은 줄어드는 게 좋음
  const Icon = rounded >= 2 ? TrendingUp : rounded <= -2 ? TrendingDown : Minus;
  return (
    <span style={{ ...deltaWrap, color }}>
      <Icon size={11} strokeWidth={1.8} />
      <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5 }}>
        {rounded >= 0 ? "+" : ""}{rounded}%
      </span>
    </span>
  );
}

// ─── styles ───────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid rgba(15,23,42,0.08)",
  borderRadius: 18,
  padding: "20px 22px",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const cardEyebrow: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "rgba(15,23,42,0.55)",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
};

const totalCount: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(15,23,42,0.55)",
};

const bodyRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap" as const,
};

const labelsCol: React.CSSProperties = {
  flex: 1,
  minWidth: 280,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "76px 1fr 32px 64px 38px 56px",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
};

const rowFirst: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const colorDot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  flexShrink: 0,
};

const rowLabel: React.CSSProperties = {
  fontSize: 12.5,
  color: "rgba(15,23,42,0.75)",
  fontWeight: 600,
  whiteSpace: "nowrap" as const,
};

const barTrack: React.CSSProperties = {
  height: 6,
  background: "rgba(15,23,42,0.05)",
  borderRadius: 999,
  overflow: "hidden",
};

const barFill: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  transition: "width 0.4s ease",
};

const rowPct: React.CSSProperties = {
  fontSize: 11.5,
  color: "rgba(15,23,42,0.55)",
  fontFamily: "ui-monospace, monospace",
  textAlign: "right" as const,
};

const rowAmount: React.CSSProperties = {
  fontSize: 11.5,
  color: "#0f172a",
  fontFamily: "ui-monospace, monospace",
  textAlign: "right" as const,
};

const miniSparkPlaceholder: React.CSSProperties = {
  width: 36,
  height: 14,
};

const deltaWrap: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 2,
  fontSize: 10.5,
  fontWeight: 700,
  justifyContent: "flex-end" as const,
};

const deltaPlaceholder: React.CSSProperties = {
  width: 56,
  height: 14,
};

const emptyStyle: React.CSSProperties = {
  background: "rgba(15,23,42,0.02)",
  border: "1px dashed rgba(15,23,42,0.12)",
  borderRadius: 12,
  padding: "20px 16px",
  textAlign: "center" as const,
  fontSize: 12.5,
  color: "rgba(15,23,42,0.5)",
};
