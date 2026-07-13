/**
 * 웹 푸시 구독 (Phase A, 2026-07-12)
 *
 * 흐름: 권한 요청 → /sw.js 등록 → PushManager.subscribe(VAPID) →
 *   구독 JSON 을 user_push_tokens 에 upsert (RLS: 본인 행만).
 * 발송은 서버(pg_net 트리거 → /api/push/dispatch)가 담당.
 */

import { supabase } from "../../lib/supabase";

export type PushEnableResult = "enabled" | "denied" | "unsupported" | "signin-required" | "error";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function isWebPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function isWebPushGranted(): boolean {
  return isWebPushSupported() && Notification.permission === "granted";
}

export async function enableWebPush(): Promise<PushEnableResult> {
  if (!isWebPushSupported()) return "unsupported";
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapid) return "unsupported"; // 키 미배포 환경

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return "signin-required";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
    }));
    const { error } = await supabase.from("user_push_tokens" as never).upsert(
      {
        user_id: auth.user.id,
        platform: "web",
        token: JSON.stringify(sub.toJSON()),
      } as never,
      { onConflict: "user_id,platform,token" } as never,
    );
    if (error) return "error"; // 마이그레이션 미적용 환경
    return "enabled";
  } catch {
    return "error";
  }
}
