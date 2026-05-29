"use client";

import { useState, useMemo, useCallback } from "react";
import type { DashboardHook } from "../../useDashboard";
import { buildTaxCalendar } from "@foundone/shared";

type DailyEntry = { date: string; sales: number; customers: number };
type InventoryEntry = { id: string; name: string; quantity: number; minThreshold?: number };

type Notification = {
  id: string;
  type: "tax" | "inventory" | "cost" | "sales" | "ai";
  title: string;
  body: string;
  urgency: "critical" | "warning" | "info";
};

type Props = {
  d: DashboardHook;
  ko: boolean;
};

/* ── Apple-style SF Symbol SVG icons ── */

function TaxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="4" width="12" height="11" rx="2.5" stroke="rgba(15,23,42,0.5)" strokeWidth="1.2" fill="none" />
      <path d="M3 7.5h12" stroke="rgba(15,23,42,0.5)" strokeWidth="1.2" />
      <path d="M6.5 2v3M11.5 2v3" stroke="rgba(15,23,42,0.5)" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="6.5" cy="10.5" r="0.7" fill="rgba(15,23,42,0.4)" />
      <circle cx="9" cy="10.5" r="0.7" fill="rgba(15,23,42,0.4)" />
      <circle cx="11.5" cy="10.5" r="0.7" fill="rgba(15,23,42,0.4)" />
    </svg>
  );
}

function InventoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 5.5l6-3 6 3v8l-6 3-6-3z" stroke="rgba(15,23,42,0.5)" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
      <path d="M3 5.5l6 3 6-3" stroke="rgba(15,23,42,0.5)" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M9 8.5v8" stroke="rgba(15,23,42,0.5)" strokeWidth="1.2" />
    </svg>
  );
}

function CostIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="rgba(15,23,42,0.5)" strokeWidth="1.2" fill="none" />
      <path d="M9 5.5v7M7 7.2c0-.8.9-1.2 2-1.2s2 .4 2 1.2-.9 1.3-2 1.3-2 .4-2 1.3.9 1.2 2 1.2 2-.4 2-1.2" stroke="rgba(15,23,42,0.5)" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function SalesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 13l3.5-4 3 2.5L14 5" stroke="rgba(15,23,42,0.5)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M11 5h3v3" stroke="rgba(15,23,42,0.5)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function AIIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2l1.5 4.5H15l-3.75 2.7L12.75 14 9 11.1 5.25 14l1.5-4.8L3 6.5h4.5z" stroke="rgba(15,23,42,0.5)" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

const TYPE_ICON: Record<string, () => React.JSX.Element> = {
  tax: TaxIcon,
  inventory: InventoryIcon,
  cost: CostIcon,
  sales: SalesIcon,
  ai: AIIcon,
};

export function NotificationCenter({ d, ko }: Props) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("readNotifications");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const notifications = useMemo(() => {
    const items: Notification[] = [];

    /* Tax deadlines */
    try {
      const ts = d.taxSettings as { vatType?: string; hasEmployees?: boolean } | null;
      const calendar = buildTaxCalendar({
        isSimplified: ts?.vatType === "simplified",
        hasEmployees: ts?.hasEmployees ?? false,
      });
      if (calendar.next) {
        const daysLeft = calendar.next.daysUntil;
        if (daysLeft <= 7) {
          items.push({
            id: `tax-${calendar.next.event.id}`,
            type: "tax",
            title: ko ? `세금 마감 D-${Math.max(0, daysLeft)}` : `Tax deadline D-${Math.max(0, daysLeft)}`,
            body: calendar.next.summary,
            urgency: daysLeft <= 3 ? "critical" : "warning",
          });
        }
      }
    } catch { /* ignore */ }

    /* Low inventory */
    const inventory = d.inventory as unknown as InventoryEntry[];
    const lowItems = inventory.filter((it) => it.quantity <= (it.minThreshold ?? 0));
    if (lowItems.length > 0) {
      items.push({
        id: "inv-low",
        type: "inventory",
        title: ko ? `재고 부족 ${lowItems.length}건` : `${lowItems.length} low stock items`,
        body: lowItems.slice(0, 3).map((it) => it.name).join(", "),
        urgency: lowItems.some((it) => it.quantity <= 0) ? "critical" : "warning",
      });
    }

    /* Sales declining */
    const entries = d.dailyEntries as DailyEntry[];
    const recent3 = entries.slice(-3);
    if (recent3.length >= 3 && recent3.every((e, i) => i === 0 || e.sales < recent3[i - 1].sales)) {
      items.push({
        id: "sales-decline",
        type: "sales",
        title: ko ? "매출 3일 연속 하락" : "3-day sales decline",
        body: ko ? "최근 3일간 매출이 연속 감소하고 있습니다" : "Revenue has been declining for 3 consecutive days",
        urgency: "warning",
      });
    }

    /* Cost anomaly */
    const costHistory = d.costHistory as Array<{ month: string; ingredients: number; labor: number; rent: number; utilities: number; sga: number; marketing: number; other: number; interest: number }>;
    if (costHistory.length >= 2) {
      const sorted = [...costHistory].sort((a, b) => b.month.localeCompare(a.month));
      const cur = sorted[0];
      const prev = sorted[1];
      const curTotal = (cur.ingredients ?? 0) + (cur.labor ?? 0) + (cur.rent ?? 0) + (cur.utilities ?? 0) + (cur.sga ?? 0) + (cur.marketing ?? 0) + (cur.other ?? 0) + (cur.interest ?? 0);
      const prevTotal = (prev.ingredients ?? 0) + (prev.labor ?? 0) + (prev.rent ?? 0) + (prev.utilities ?? 0) + (prev.sga ?? 0) + (prev.marketing ?? 0) + (prev.other ?? 0) + (prev.interest ?? 0);
      if (prevTotal > 0 && ((curTotal - prevTotal) / prevTotal) > 0.2) {
        items.push({
          id: "cost-spike",
          type: "cost",
          title: ko ? "비용 20% 이상 증가" : "Cost spike >20%",
          body: ko ? `전월 대비 비용이 ${Math.round(((curTotal - prevTotal) / prevTotal) * 100)}% 증가했습니다` : `Costs increased ${Math.round(((curTotal - prevTotal) / prevTotal) * 100)}% vs last month`,
          urgency: "warning",
        });
      }
    }

    /* AI new insight */
    if (d.aiActions?.insight) {
      items.push({
        id: "ai-insight",
        type: "ai",
        title: ko ? "AI 새 인사이트" : "New AI insight",
        body: d.aiActions.insight,
        urgency: "info",
      });
    }

    return items;
  }, [d.taxSettings, d.inventory, d.dailyEntries, d.costHistory, d.aiActions, ko]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;
  const criticalUnread = notifications.filter((n) => n.urgency === "critical" && !readIds.has(n.id)).length;

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem("readNotifications", JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const n of notifications) next.add(n.id);
      try { localStorage.setItem("readNotifications", JSON.stringify([...next])); } catch {}
      return next;
    });
  }, [notifications]);

  const handleOpen = () => {
    setOpen(!open);
  };

  const urgencyColor = (u: Notification["urgency"]) =>
    u === "critical" ? "#b42318" : u === "warning" ? "#e85d04" : "#191970";

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={handleOpen}
        style={bellBtn}
        aria-label="Notifications"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2C5.8 2 4 3.8 4 6v3.5l-1.2 1.8c-.15.22.02.7.3.7h9.8c.28 0 .45-.48.3-.7L12 9.5V6c0-2.2-1.8-4-4-4z" stroke="rgba(15,23,42,0.5)" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
          <path d="M6.5 12c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5" stroke="rgba(15,23,42,0.5)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <circle cx="8" cy="2.5" r="0.5" fill="rgba(15,23,42,0.4)" />
        </svg>
        {unreadCount > 0 && (
          <span style={{ ...badge, background: criticalUnread > 0 ? "#b42318" : "#e85d04" }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div style={dropdown}>
            <div style={dropdownHeader}>
              <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.01em" }}>{ko ? "알림" : "Notifications"}</span>
              {unreadCount > 0 ? (
                <button type="button" onClick={markAllRead} style={markAllBtn}>
                  {ko ? "모두 읽음" : "Mark all read"}
                </button>
              ) : (
                <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.35)" }}>{ko ? "새 알림 없음" : "All read"}</span>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: "36px 24px", textAlign: "center" }}>
                <div style={{ marginBottom: "10px" }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M14 4C10.5 4 7.5 7 7.5 10.5v5.5L5.5 19c-.2.3 0 .8.4.8h16.2c.4 0 .6-.5.4-.8L20.5 16V10.5C20.5 7 17.5 4 14 4z" stroke="rgba(15,23,42,0.15)" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
                    <path d="M11 19.5c0 1.66 1.34 3 3 3s3-1.34 3-3" stroke="rgba(15,23,42,0.15)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
                <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.3)", fontWeight: 500 }}>
                  {ko ? "새 알림이 없습니다" : "No notifications"}
                </div>
              </div>
            ) : (
              <div style={notifList}>
                {notifications.map((n) => {
                  const isRead = readIds.has(n.id);
                  const IconComponent = TYPE_ICON[n.type] ?? AIIcon;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => markRead(n.id)}
                      style={{
                        ...notifItem,
                        background: isRead ? "transparent" : "rgba(25,25,112,0.025)",
                        opacity: isRead ? 0.55 : 1,
                      }}
                    >
                      {/* unread dot */}
                      <div style={{ width: "6px", flexShrink: 0, display: "flex", alignItems: "flex-start", paddingTop: "6px" }}>
                        {!isRead && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: urgencyColor(n.urgency) }} />}
                      </div>
                      {/* icon */}
                      <div style={iconWrap}>
                        <IconComponent />
                      </div>
                      {/* content */}
                      <div style={{ flex: 1, minWidth: 0, textAlign: "left" as const }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 650, color: "#0f172a", textDecoration: isRead ? "line-through" : "none" }}>{n.title}</span>
                          <span style={{
                            fontSize: "9px", fontWeight: 700, letterSpacing: "0.04em",
                            color: urgencyColor(n.urgency),
                            background: `${urgencyColor(n.urgency)}0D`,
                            borderRadius: "4px", padding: "1px 5px",
                          }}>
                            {n.urgency === "critical" ? (ko ? "긴급" : "URGENT") : n.urgency === "warning" ? (ko ? "주의" : "WARN") : "INFO"}
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", marginTop: "3px", lineHeight: 1.45, whiteSpace: "normal" }}>{n.body}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Styles ─── */

const bellBtn: React.CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "42px",
  height: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(15,23,42,0.065)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(247,249,252,0.78))",
  cursor: "pointer",
  backdropFilter: "blur(12px)",
  transition: "all 0.15s ease",
  boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
};

const badge: React.CSSProperties = {
  position: "absolute",
  top: "-2px",
  right: "-2px",
  fontSize: "10px",
  fontWeight: 700,
  color: "#fff",
  borderRadius: "999px",
  padding: "0 5px",
  minWidth: "16px",
  height: "16px",
  lineHeight: "16px",
  textAlign: "center",
};

const dropdown: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 10px)",
  right: 0,
  width: "380px",
  maxHeight: "440px",
  overflowY: "auto",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.98)",
  border: "1px solid rgba(15,23,42,0.06)",
  boxShadow: "0 24px 64px rgba(15,23,42,0.12), 0 0 0 0.5px rgba(15,23,42,0.03)",
  backdropFilter: "blur(32px)",
  WebkitBackdropFilter: "blur(32px)",
  zIndex: 100,
};

const dropdownHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 20px 14px",
  borderBottom: "1px solid rgba(15,23,42,0.05)",
};

const markAllBtn: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#191970",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "2px 0",
};

const notifList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const notifItem: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  padding: "14px 16px 14px 10px",
  borderBottom: "1px solid rgba(15,23,42,0.035)",
  border: "none",
  width: "100%",
  cursor: "pointer",
  transition: "background 0.15s ease, opacity 0.3s ease",
};

const iconWrap: React.CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  background: "rgba(25,25,112,0.04)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
