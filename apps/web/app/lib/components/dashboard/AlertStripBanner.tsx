"use client";

/**
 * AlertStripBanner — 대시보드 최상단 긴급 알림 배너.
 *
 * Stripe / 네이버 스마트플레이스 / 배민 사장님 패턴:
 *   - 카드가 아닌 "배너" 형태 (높이 낮음, 가로 꽉 참)
 *   - 4종 긴급 이슈: 현금 14일 경고 · 악성 리뷰 · 재고 바닥 · 미수금
 *   - 가장 시급한 1개만 노출 (복수면 우선순위 최상위만)
 *   - 원색 빨강 금지 — iOS amber #191970 또는 red #b64c4c을 subtle 틴트로
 *   - Dismissible (세션 동안만 숨김, localStorage는 매일 자정 초기화)
 *
 * 데이터 소스: DashboardContext의 기존 계산값 재활용
 */

import { useMemo, useState } from "react";
import { AlertTriangle, MessageSquareWarning, PackageX, Wallet } from "lucide-react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { entriesInLastDays, honestDailyAverage } from "../../utils/daily-windows";

type AlertKind = "cash" | "review" | "inventory" | "unpaid";

type AlertItem = {
  kind: AlertKind;
  severity: "critical" | "warning";      // critical=red subtle, warning=amber
  title: string;
  detail: string;
  cta?: { label: string; surface: "analytics" | "marketing" };
};

const SEVERITY_STYLES: Record<"critical" | "warning", {
  bg: string; border: string; accent: string; icon: string;
}> = {
  critical: {
    bg: "rgba(182,76,76,0.04)",
    border: "rgba(182,76,76,0.18)",
    accent: "#b64c4c",
    icon: "rgba(182,76,76,0.9)",
  },
  warning: {
    bg: "rgba(25,25,112,0.05)",
    border: "rgba(25,25,112,0.2)",
    accent: "#191970",
    icon: "rgba(25,25,112,0.95)",
  },
};

const KIND_ICON = {
  cash: Wallet,
  review: MessageSquareWarning,
  inventory: PackageX,
  unpaid: AlertTriangle,
} as const;

export function AlertStripBanner() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const [dismissed, setDismissed] = useState<Record<AlertKind, boolean>>({
    cash: false, review: false, inventory: false, unpaid: false,
  });

  const alerts = useMemo<AlertItem[]>(() => {
    const list: AlertItem[] = [];
    const entries = (d.dailyEntries ?? []) as Array<{ date: string; sales: number }>;
    const costs = (d.monthlyCosts ?? {}) as Record<string, number>;
    const totalMonthlyCosts =
      (costs.ingredients ?? 0) + (costs.labor ?? 0) + (costs.rent ?? 0) +
      (costs.utilities ?? 0) + (costs.sga ?? 0) + (costs.marketing ?? 0) +
      (costs.other ?? 0) + (costs.interest ?? 0);

    // ── 1. Cash 14-day warning (현금 소진 위험) ──
    //  ⚠️ 2026-05-11 fix: entry-count slice → 날짜 기반 윈도우 + 경과일 분모
    //  sparse 입력 시 일평균 과대 추정 → netDailyLoss 음수 → 위기 누락 가능했음
    if (d.businessLaunched && totalMonthlyCosts > 0) {
      const last14 = entriesInLastDays(entries, 14);
      const avgInfo = honestDailyAverage(last14, (e) => e.sales);
      const avgDaily14 = avgInfo.avg;
      const dailyBurn = totalMonthlyCosts / 30;
      const netDailyLoss = dailyBurn - avgDaily14;
      if (netDailyLoss > 0) {
        const capital = ((d.selectedBudget as number) ?? 0) + ((d.initialOperatingCapital as number) ?? 0);
        if (capital > 0) {
          const daysLeft = Math.floor(capital / netDailyLoss);
          if (daysLeft <= 14 && daysLeft > 0) {
            list.push({
              kind: "cash",
              severity: "critical",
              title: ko ? `현금 ${daysLeft}일 남음` : `Cash runway: ${daysLeft} days`,
              detail: ko
                ? "매일 지출이 매출보다 많습니다. 비용 구조 점검이 시급합니다."
                : "Daily burn exceeds revenue. Review your cost structure now.",
              cta: { label: ko ? "비용 점검" : "Review costs", surface: "analytics" },
            });
          }
        }
      }
    }

    // ── 2. 재고 발주 필요 (low-stock alert, 2026-05-11 실제 inventory 연동) ──
    //  threshold > 0 이면서 quantity ≤ threshold 인 품목 = 발주 필요.
    //  quantity ≤ 0 이면 즉시 (critical), 그 외엔 경고 (warning).
    //  ⚠️ 메뉴(itemType==="product")는 재고가 아니라 판매 품목 — "발주" 대상이 아니다.
    //    재고 카드(InventoryOpsCard)와 동일하게 재료(material)만 집계 (2026-07-13 감사: 메뉴가
    //    qty 0 로 "즉시 발주 3개" 오표시되던 버그. 재고 카드는 0개인데 배너만 3개였음).
    const inventory = (d.inventory ?? []) as Array<{ id: string; name: string; quantity: number; minThreshold?: number; itemType?: string }>;
    const lowStockItems = inventory.filter(
      (i) => i.itemType !== "product" && (i.minThreshold ?? 0) > 0 && i.quantity <= (i.minThreshold ?? 0),
    );
    if (lowStockItems.length > 0) {
      const criticalItems = lowStockItems.filter((i) => i.quantity <= 0);
      const isCritical = criticalItems.length > 0;
      const sample = lowStockItems.slice(0, 3).map((i) => i.name).join(", ");
      const moreCount = lowStockItems.length - 3;
      list.push({
        kind: "inventory",
        severity: isCritical ? "critical" : "warning",
        title: ko
          ? `${lowStockItems.length}개 품목 발주 필요${isCritical ? ` (${criticalItems.length}개 즉시)` : ""}`
          : `${lowStockItems.length} items need reorder${isCritical ? ` (${criticalItems.length} urgent)` : ""}`,
        detail: ko
          ? `${sample}${moreCount > 0 ? ` 외 ${moreCount}개` : ""}`
          : `${sample}${moreCount > 0 ? ` +${moreCount} more` : ""}`,
      });
    }

    // ── 3. 마케팅 ROAS 경고 ──
    // marketing-store 연동은 Phase 2에서 — 지금은 skip

    // 우선순위: critical 먼저, 같은 severity 안에서는 cash > inventory > review > unpaid
    const priority: AlertKind[] = ["cash", "inventory", "review", "unpaid"];
    return list.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
      return priority.indexOf(a.kind) - priority.indexOf(b.kind);
    });
  }, [d.dailyEntries, d.monthlyCosts, d.businessLaunched, d.selectedBudget, d.initialOperatingCapital, d.inventory, ko]);

  const top = alerts.find((a) => !dismissed[a.kind]);
  if (!top) return null;

  const style = SEVERITY_STYLES[top.severity];
  const Icon = KIND_ICON[top.kind];

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 18px",
        borderRadius: "14px",
        background: style.bg,
        border: `1px solid ${style.border}`,
        transition: "opacity 0.25s ease",
      }}
    >
      <Icon size={18} strokeWidth={1.8} color={style.icon} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "13.5px",
          fontWeight: 650,
          color: "var(--text)",
          letterSpacing: "-0.01em",
          lineHeight: 1.35,
        }}>
          {top.title}
        </div>
        <div style={{
          fontSize: "12.5px",
          color: "var(--muted)",
          lineHeight: 1.45,
          marginTop: "2px",
        }}>
          {top.detail}
        </div>
      </div>
      {top.cta && (
        <button
          type="button"
          onClick={() => d.navigateToSurface?.(top.cta!.surface)}
          style={{
            fontSize: "12px",
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: "8px",
            background: "var(--surface-strong)",
            border: `1px solid ${style.border}`,
            color: style.accent,
            cursor: "pointer",
            flexShrink: 0,
            transition: "background 0.15s ease",
          }}
        >
          {top.cta.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => setDismissed((prev) => ({ ...prev, [top.kind]: true }))}
        aria-label={ko ? "닫기" : "Dismiss"}
        style={{
          width: "24px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "6px",
          border: "none",
          background: "transparent",
          color: "var(--muted)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
