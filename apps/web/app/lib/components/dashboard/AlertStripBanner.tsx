"use client";

/**
 * AlertStripBanner — 대시보드 최상단 긴급 알림 배너.
 *
 * Stripe / 네이버 스마트플레이스 / 배민 사장님 패턴:
 *   - 카드가 아닌 "배너" 형태 (높이 낮음, 가로 꽉 참)
 *   - 4종 긴급 이슈: 현금 14일 경고 · 악성 리뷰 · 재고 바닥 · 미수금
 *   - 가장 시급한 1개만 노출 (복수면 우선순위 최상위만)
 *   - 원색 빨강 금지 — iOS amber #ff9f0a 또는 red #ff3b30을 subtle 틴트로
 *   - Dismissible (세션 동안만 숨김, localStorage는 매일 자정 초기화)
 *
 * 데이터 소스: DashboardContext의 기존 계산값 재활용
 */

import { useMemo, useState } from "react";
import { AlertTriangle, MessageSquareWarning, PackageX, Wallet } from "lucide-react";
import { useDashboardCtx } from "../../contexts/DashboardContext";

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
    bg: "rgba(255,59,48,0.04)",
    border: "rgba(255,59,48,0.18)",
    accent: "#ff3b30",
    icon: "rgba(255,59,48,0.9)",
  },
  warning: {
    bg: "rgba(255,159,10,0.05)",
    border: "rgba(255,159,10,0.2)",
    accent: "#ff9f0a",
    icon: "rgba(255,159,10,0.95)",
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
    if (d.businessLaunched && totalMonthlyCosts > 0) {
      const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
      const last14 = sorted.slice(-14);
      const avgDaily14 = last14.length > 0
        ? last14.reduce((s, e) => s + (e.sales ?? 0), 0) / last14.length
        : 0;
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

    // ── 2. 재고 바닥 (최근 매출 데이터 < 1주, 재고 없음 시) ──
    // Note: 실제 inventory store 미연동 — 추후 inventory-store 연결 시 강화
    // 지금은 운영 중인데 7일 이상 매출 0 → 무활동 경고
    if (d.businessLaunched) {
      const recent7 = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
      const noSalesDays = recent7.filter((e) => (e.sales ?? 0) === 0).length;
      if (recent7.length >= 5 && noSalesDays >= 5) {
        list.push({
          kind: "inventory",
          severity: "warning",
          title: ko ? "최근 7일 중 5일 이상 매출 없음" : "5+ days without sales this week",
          detail: ko
            ? "재고·예약·마케팅 상태를 확인해주세요."
            : "Check inventory, bookings, and marketing.",
          cta: { label: ko ? "대시보드 확인" : "Check dashboard", surface: "analytics" },
        });
      }
    }

    // ── 3. 마케팅 ROAS 경고 ──
    // marketing-store 연동은 Phase 2에서 — 지금은 skip

    // 우선순위: critical 먼저, 같은 severity 안에서는 cash > inventory > review > unpaid
    const priority: AlertKind[] = ["cash", "inventory", "review", "unpaid"];
    return list.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
      return priority.indexOf(a.kind) - priority.indexOf(b.kind);
    });
  }, [d.dailyEntries, d.monthlyCosts, d.businessLaunched, d.selectedBudget, d.initialOperatingCapital, ko]);

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
