"use client";

/**
 * useInAppNotifications — DB 기반 인앱 알림함 (2026-07-14).
 *
 * public.notifications 를 수신자(=본인) 기준으로 읽어 벨에 표시.
 * push_dispatch 가 푸시와 동시에 남기는 행이라, 출근·초대·연차·추가수당 등
 * 모든 이벤트가 여기로 흘러든다. 실시간 구독으로 새 알림 즉시 반영.
 *
 * 기존 notification-context(클라 계산 경보)와 별개 — 벨은 둘을 함께 렌더.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

export type InAppNotif = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  is_read: boolean;
  created_at: string;
};

export function useInAppNotifications() {
  const [items, setItems] = useState<InAppNotif[]>([]);
  const [uid, setUid] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUid(null); setItems([]); return; }
    setUid(user.id);
    const { data, error } = await supabase
      .from("notifications" as never)
      .select("id, title, body, url, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    // 에러≠부재 (2026-07-13 hire_date 사고 규율): 테이블 미적용(42P01, 마이그레이션 전)만
    // 조용히 빈 목록으로 soft-fail. 그 외 에러(RLS·GRANT·네트워크)는 기존 목록을 유지해
    // 일시 장애가 "알림 0건"으로 위장하지 않게 한다 — realtime/다음 load 가 재시도.
    if (error) {
      if ((error as { code?: string }).code === "42P01") setItems([]);
      else console.warn("[notifications] load failed — 기존 목록 유지", error.message);
      return;
    }
    setItems(((data ?? []) as InAppNotif[]));
  }, []);

  useEffect(() => { void load(); }, [load]);

  // 실시간 — 새 알림/읽음 변경 즉시 반영
  const reloadRef = useRef<() => void>(() => {});
  reloadRef.current = () => { void load(); };
  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel(`notif-rt-${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_user_id=eq.${uid}` },
        () => reloadRef.current(),
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [uid]);

  const markRead = useCallback(async (id: string) => {
    setItems((p) => p.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from("notifications" as never).update({ is_read: true } as never).eq("id", id);
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = items.filter((n) => !n.is_read).map((n) => n.id);
    if (!unread.length) return;
    setItems((p) => p.map((n) => ({ ...n, is_read: true })));
    await supabase.from("notifications" as never).update({ is_read: true } as never).in("id", unread);
  }, [items]);

  const unreadCount = items.filter((n) => !n.is_read).length;
  return { items, unreadCount, markRead, markAllRead, refresh: load };
}
