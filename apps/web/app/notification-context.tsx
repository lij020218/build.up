"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type NotifSeverity = "urgent" | "warning";

export type NotifNavigate = {
  /** 클릭 시 이동할 surface (DashboardSurface) */
  surface?: "home" | "current" | "roadmap" | "guides" | "franchise" | "profile" | "analytics" | "marketing" | "reports";
  /** 스크롤 anchor — element id 우선 */
  scrollTargetId?: string;
  /** scrollTargetId가 없을 때 querySelector */
  selector?: string;
  /** 도착 후 input 자동 focus */
  focusInput?: boolean;
  /** Cashflow 셋업 sheet 자동 오픈 (+ 옵션 섹션) */
  openCashflowSetup?: { section?: string };
};

export type NotifItem = {
  id: string;
  severity: NotifSeverity;
  title: string;
  detail: string;
  /** 알림 클릭 시 이동할 위치 (없으면 클릭 비활성) */
  navigate?: NotifNavigate;
};

type NotificationContextValue = {
  notifications: NotifItem[];
  setNotifications: (items: NotifItem[]) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const value = useMemo(() => ({ notifications, setNotifications }), [notifications]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
