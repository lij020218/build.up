"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type NotifSeverity = "urgent" | "warning";

export type NotifItem = {
  id: string;
  severity: NotifSeverity;
  title: string;
  detail: string;
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
