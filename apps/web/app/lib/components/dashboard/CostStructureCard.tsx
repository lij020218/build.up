"use client";

import { useMemo } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { COST_RATIOS } from "@build-up/shared";
import { PieChart } from "lucide-react";

/* ─── Types ─── */

type HealthLevel = "good" | "caution" | "danger";

type CostRow = {
  label: string;
  ratio: number;
  thresholds: { good: number; caution: number }; // green < good, yellow < caution, red >= caution
  isPrime?: boolean;
  benchmarkNote?: string;
};

/* ─── Helpers ─── */

const getHealth = (val: number, good: number, caution: number): HealthLevel =>
  val < good ? "good" : val < caution ? "caution" : "danger";

const healthColor = (h: HealthLevel): string =>
  h === "good" ? "#34C759" : h === "caution" ? "#FF9F0A" : "#FF3B30";

// healthDot removed — replaced with CSS dot in JSX

/* ─── Resolve industry-specific thresholds ─── */

function resolveThresholds(industryCategoryId: string | undefined): {
  ingredients: { good: number; caution: number; label: string };
  labor: { good: number; caution: number };
  rent: { good: number; caution: number };
  prime: { good: number; caution: number; benchmarkLabel: string };
} {
  // Map category ID to COST_RATIOS key
  const categoryMap: Record<string, keyof typeof COST_RATIOS> = {
    food: "food",
    "cafe-dessert": "cafe-dessert",
    retail: "retail",
    beauty: "beauty",
    fitness: "fitness",
    education: "education",
    pet: "pet",
    "living-service": "living-service",
    space: "space",
    "online-digital": "online-digital",
    "startup-tech": "startup-tech",
  };

  const key = industryCategoryId ? categoryMap[industryCategoryId] : undefined;
  const ratios = key ? COST_RATIOS[key] : COST_RATIOS.food;

  // Resolve ingredients-like field
  const ingredientRange = "ingredients" in ratios
    ? ratios.ingredients
    : "cogs" in ratios
      ? (ratios as { cogs: readonly [number, number] }).cogs
      : "supplies" in ratios
        ? (ratios as { supplies: readonly [number, number] }).supplies
        : [30, 35] as const;

  const ingredientLabel = "ingredients" in ratios
    ? "재료비"
    : "cogs" in ratios
      ? "매입원가"
      : "supplies" in ratios
        ? "소모품비"
        : "재료비";

  const laborRange = ratios.labor;
  const rentRange = "rent" in ratios ? ratios.rent : [8, 15] as const;
  const primeMax = ratios.primeCostMax;

  return {
    ingredients: {
      good: ingredientRange[1],
      caution: ingredientRange[1] + 5,
      label: ingredientLabel,
    },
    labor: {
      good: laborRange[1],
      caution: laborRange[1] + 5,
    },
    rent: {
      good: rentRange[1],
      caution: rentRange[1] + 5,
    },
    prime: {
      good: primeMax - 5,
      caution: primeMax,
      benchmarkLabel: `업종 기준 ${primeMax}% 이하`,
    },
  };
}

/* ─── Component ─── */

export function CostStructureCard() {
  const d = useDashboardCtx();
  const mc = d.monthlyCosts as {
    ingredients: number;
    labor: number;
    rent: number;
    utilities: number;
    other: number;
  } | undefined;
  const entries = (d.dailyEntries ?? []) as Array<{ date: string; sales: number; customers: number }>;
  const industryCategoryId = d.selectedIndustryId as string | undefined;

  const { totalSales, rows, hasCosts } = useMemo(() => {
    if (!mc || !entries.length) {
      return { totalSales: 0, rows: [] as CostRow[], hasCosts: false };
    }

    // Current month total sales
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const monthEntries = entries.filter(e => e.date.startsWith(currentMonth));
    const sales = monthEntries.reduce((s, e) => s + e.sales, 0);

    if (sales <= 0) {
      return { totalSales: 0, rows: [] as CostRow[], hasCosts: false };
    }

    const t = resolveThresholds(industryCategoryId);

    const ingredientRatio = (mc.ingredients / sales) * 100;
    const laborRatio = (mc.labor / sales) * 100;
    const rentRatio = (mc.rent / sales) * 100;
    const primeRatio = ((mc.ingredients + mc.labor) / sales) * 100;

    const costRows: CostRow[] = [
      {
        label: t.ingredients.label,
        ratio: Math.round(ingredientRatio * 10) / 10,
        thresholds: { good: t.ingredients.good, caution: t.ingredients.caution },
      },
      {
        label: "인건비",
        ratio: Math.round(laborRatio * 10) / 10,
        thresholds: { good: t.labor.good, caution: t.labor.caution },
      },
      {
        label: "임대료",
        ratio: Math.round(rentRatio * 10) / 10,
        thresholds: { good: t.rent.good, caution: t.rent.caution },
      },
      {
        label: "프라임",
        ratio: Math.round(primeRatio * 10) / 10,
        thresholds: { good: t.prime.good, caution: t.prime.caution },
        isPrime: true,
        benchmarkNote: t.prime.benchmarkLabel,
      },
    ];

    return { totalSales: sales, rows: costRows, hasCosts: mc.ingredients + mc.labor + mc.rent > 0 };
  }, [mc, entries, industryCategoryId]);

  if (!hasCosts || rows.length === 0) {
    return (
      <div style={card}>
        <div style={headerRow}>
          <PieChart size={14} strokeWidth={2} style={{ color: "rgba(15,23,42,0.35)", marginRight: "6px" }} /><span style={cardTitle}>비용 구조</span>
        </div>
        <div style={emptyState}>
          월 비용을 입력하면 비용 구조 진단이 표시됩니다
        </div>
      </div>
    );
  }

  return (
    <div style={card}>
      {/* Header */}
      <div style={headerRow}>
        <PieChart size={14} strokeWidth={2} style={{ color: "rgba(15,23,42,0.35)", marginRight: "6px" }} /><span style={cardTitle}>비용 구조</span>
      </div>

      {/* Cost Rows */}
      <div style={rowsContainer}>
        {rows.map((row, idx) => {
          const h = getHealth(row.ratio, row.thresholds.good, row.thresholds.caution);
          const color = healthColor(h);
          const barWidth = Math.min(row.ratio, 100);

          return (
            <div key={row.label}>
              {/* Separator before prime row */}
              {row.isPrime && <div style={primeSeparator} />}

              <div style={costRowStyle}>
                {/* Label + Value */}
                <div style={rowLabelCol}>
                  <span style={{
                    fontSize: "13px",
                    fontWeight: row.isPrime ? 700 : 600,
                    color: row.isPrime ? "#0f172a" : "rgba(15,23,42,0.7)",
                  }}>
                    {row.label}
                  </span>
                </div>

                <div style={rowValueCol}>
                  <span style={{
                    fontSize: "14px",
                    fontWeight: 720,
                    color: color,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.02em",
                  }}>
                    {row.ratio.toFixed(row.ratio % 1 === 0 ? 0 : 1)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={barContainer}>
                  <div style={barTrack}>
                    <div style={{
                      height: "100%",
                      borderRadius: "3px",
                      width: `${barWidth}%`,
                      background: `linear-gradient(90deg, ${color}88, ${color})`,
                      transition: "width 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
                    }} />
                  </div>
                </div>

                {/* Traffic Light — CSS dot */}
                <div style={dotCol}>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: color,
                    boxShadow: `0 0 6px ${color}40`,
                  }} />
                </div>
              </div>

              {/* Benchmark note for prime */}
              {row.isPrime && row.benchmarkNote && (
                <div style={benchmarkNote}>
                  {row.benchmarkNote}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Styles ─── */

const card: React.CSSProperties = {
  borderRadius: "20px",
  padding: "22px",
  background: "rgba(255,255,255,0.82)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(0,0,0,0.05)",
  boxShadow: "0 4px 24px rgba(15,23,42,0.03), 0 1px 2px rgba(15,23,42,0.02)",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const cardTitle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#0f172a",
  letterSpacing: "-0.01em",
};

const rowsContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const costRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "60px 48px 1fr 28px",
  alignItems: "center",
  gap: "8px",
};

const rowLabelCol: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const rowValueCol: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
};

const barContainer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  minWidth: 0,
};

const barTrack: React.CSSProperties = {
  width: "100%",
  height: "6px",
  borderRadius: "3px",
  background: "rgba(15,23,42,0.06)",
  overflow: "hidden",
};

const dotCol: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const primeSeparator: React.CSSProperties = {
  height: "1px",
  background: "rgba(15,23,42,0.08)",
  margin: "4px 0 6px 0",
};

const benchmarkNote: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "rgba(15,23,42,0.35)",
  marginTop: "4px",
  paddingLeft: "60px",
  letterSpacing: "0.01em",
};

const emptyState: React.CSSProperties = {
  padding: "28px 0",
  textAlign: "center",
  fontSize: "13px",
  color: "rgba(15,23,42,0.35)",
  lineHeight: 1.5,
};
