"use client";

/**
 * useAdminFetch — 세션 access_token 을 Bearer 로 붙여 /api/admin/* 을 호출하는 훅.
 *   401/403 은 권한 문제로 구분해 반환(AdminGuard 가 처리). path 변경 시 자동 재조회.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

export type AdminFetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  status: number | null;
  reload: () => void;
};

/** 관리자 변경 요청 — 세션 토큰을 Bearer 로 붙여 POST. {ok,status} 반환. */
export async function adminPost(path: string, body: unknown): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return { ok: false, status: 401, error: "로그인이 필요합니다." };
    const res = await fetch(path, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, error: json?.error };
  } catch {
    return { ok: false, status: 0, error: "네트워크 오류" };
  }
}

export function useAdminFetch<T = unknown>(path: string | null): AdminFetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) {
          if (!cancelled) { setStatus(401); setError("로그인이 필요합니다."); setLoading(false); }
          return;
        }
        const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        setStatus(res.status);
        if (!res.ok) {
          setError(json?.error ?? "요청 실패");
          setData(null);
        } else {
          setData(json as T);
        }
      } catch {
        if (!cancelled) { setError("네트워크 오류"); setStatus(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [path, nonce]);

  return { data, loading, error, status, reload };
}
