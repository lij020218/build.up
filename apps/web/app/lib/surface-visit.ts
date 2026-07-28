/**
 * 화면 방문 계측 — surface 진입 시 record_surface_visit RPC 로 일 단위 카운터 기록.
 *
 *  · 로그인 세션이 있을 때만 (미로그인·데모 렌더는 기록 안 함)
 *  · 같은 화면은 KST 하루 1회만 전송 (localStorage 데둡 — 지표 = 방문일 기준)
 *  · 계측 실패는 조용히 무시 — 앱 동작에 절대 영향 없음
 *  · 서버 RPC 가 화이트리스트·본인(auth.uid()) 검증을 다시 하므로 클라이언트는 best-effort
 *
 *  iOS 미러: SurfaceVisitRecorder.swift (동일 RPC·동일 슬러그·동일 일 데둡)
 */
import { supabase } from "../../lib/supabase";
import type { DashboardSurface } from "./types";

const DEDUPE_PREFIX = "fo_sv:";

function kstDateString(): string {
  return new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);
}

/** 오늘이 아닌 데둡 키 정리 (하루 최대 13개라 비용 미미) */
function evictStaleKeys(today: string) {
  try {
    const stale: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DEDUPE_PREFIX) && !key.endsWith(today)) stale.push(key);
    }
    stale.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* storage 접근 실패 무시 */
  }
}

export async function recordSurfaceVisit(surface: DashboardSurface): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id;
    if (!uid) return;

    const today = kstDateString();
    const key = `${DEDUPE_PREFIX}${uid}:${surface}:${today}`;
    if (localStorage.getItem(key)) return;
    evictStaleKeys(today);
    localStorage.setItem(key, "1");

    await supabase.rpc("record_surface_visit", { p_surface: surface });
  } catch {
    /* 계측은 best-effort */
  }
}
