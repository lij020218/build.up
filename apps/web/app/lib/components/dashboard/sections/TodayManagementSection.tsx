"use client";

/**
 * 오늘의 관리 — 사장님 목업(2026-07-21)의 하단 지표 타일 줄.
 *
 *   [재고 부족 알림 N건] [직원 N명] [오늘 예약 N건] …
 *
 * 원칙(가짜 숫자 금지): 데이터 모델이 있는 타일만 노출 —
 *  · 재고 부족: inventory lowStockItems (재고 카드 쓰는 업종만)
 *  · 직원:     등록된 직원 수 (팀 페이지로 이동)
 *  · 예약:     booking-store 오늘 예약 (예약 업종 + 기록 있을 때만)
 *  · 리뷰 신규: 데이터 소스 없음 → 미노출 (목업엔 있으나 위조 금지 — 리뷰 연동 생기면 추가)
 * 표시할 타일이 없으면 섹션 자체를 렌더하지 않는다.
 */

import { Package, Users, CalendarCheck } from "lucide-react";
import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
import { useBookingStore } from "../../../stores/booking-store";

const MIDNIGHT = "#191970";
const DANGER = "#b64c4c";

function ManagementTile({ label, value, unit, icon, accent, onClick }: {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  /** 위험(재고 부족 有 등)만 벽돌 강조 — 그 외 네이비 (신호등 금지) */
  accent?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      style={{
        background: "#ffffff",
        borderRadius: 14,
        border: "1px solid rgba(25,25,112,0.10)",
        boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 0,
        width: "100%",
        textAlign: "left" as const,
        cursor: onClick ? "pointer" : "default",
        fontFamily: "inherit",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(25,25,112,0.6)", marginBottom: 3 }}>{label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span style={{ fontSize: 24, fontWeight: 750, letterSpacing: "-0.02em", color: accent ? DANGER : "#10104a", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(16,16,74,0.7)" }}>{unit}</span>
        </div>
      </div>
      <span style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: accent ? "rgba(182,76,76,0.08)" : "rgba(25,25,112,0.06)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</span>
    </Tag>
  );
}

type Props = {
  d: DashboardHook;
  c: DashboardComputed;
  ko: boolean;
};

export function TodayManagementSection({ d, c, ko }: Props) {
  const bookings = useBookingStore((s) => s.bookings);
  const todayBookings = bookings.filter((b) => b.date === c.todayStr).length;

  const showInventoryTile = !c.usesSubscriptions && d.businessCtx.showInventoryCard;
  const lowStock = c.lowStockItems.length;
  const employeeCount = c.employees.length;
  const showBookingTile = bookings.length > 0; // 예약 기록을 쓰는 업종·계정만 (모델 없으면 미노출)

  const tiles: React.ReactNode[] = [];
  if (showInventoryTile) {
    tiles.push(
      <ManagementTile
        key="lowstock"
        label={ko ? "재고 부족 알림" : "Low stock"}
        value={String(lowStock)}
        unit={ko ? "건" : ""}
        accent={lowStock > 0}
        icon={<Package size={16} strokeWidth={1.7} color={lowStock > 0 ? DANGER : MIDNIGHT} />}
      />,
    );
  }
  tiles.push(
    <ManagementTile
      key="team"
      label={ko ? "직원" : "Team"}
      value={String(employeeCount)}
      unit={ko ? "명" : ""}
      icon={<Users size={16} strokeWidth={1.7} color={MIDNIGHT} />}
      onClick={() => d.navigateToSurface("team")}
    />,
  );
  if (showBookingTile) {
    tiles.push(
      <ManagementTile
        key="bookings"
        label={ko ? "오늘 예약" : "Bookings today"}
        value={String(todayBookings)}
        unit={ko ? "건" : ""}
        icon={<CalendarCheck size={16} strokeWidth={1.7} color={MIDNIGHT} />}
      />,
    );
  }
  // 리뷰 신규: 리뷰 데이터 연동이 없어 미노출 — 연동(플레이스·앱리뷰) 생기면 여기에 타일 추가.

  if (tiles.length === 0) return null;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 750, color: "rgba(15,23,42,0.55)", letterSpacing: "0.01em", padding: "2px 2px 0" }}>
        {ko ? "오늘의 관리" : "Today's operations"}
      </div>
      <div className="dash-mgmt-grid">{tiles}</div>
    </div>
  );
}
