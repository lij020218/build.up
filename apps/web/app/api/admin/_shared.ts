/**
 * /api/admin/* 공용 헬퍼 — KST 시간 경계, 이메일 맵, 레이트리밋.
 *
 * 주의(스케일): buildEmailMap·활성집계는 현재 소규모 사용자 기준(단일 listUsers 페이지 / jsonb JS 집계).
 *   사용자가 수천 명 단위로 커지면 RPC/뷰로 이관 필요(LAUNCH 후 P2). 현재는 정확·단순 우선.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { checkSimpleRateLimit, type RateLimitResult } from "../_lib/rate-limit";
import { getAdminEmails } from "../_lib/env";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 현재 KST 자정을 실제 UTC 순간으로 환산한 ISO (created_at >= 오늘 가입 필터용) */
export function kstMidnightUtcIso(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth();
  const d = kst.getUTCDate();
  // KST 자정(=UTC 기준 전날 15:00)
  return new Date(Date.UTC(y, m, d, 0, 0, 0) - KST_OFFSET_MS).toISOString();
}

/** daysAgo 일 전 ~ 오늘까지의 KST 날짜 문자열 집합 (daily_entries.date 매칭용, YYYY-MM-DD) */
export function kstRecentDateStrings(days: number, now: Date = new Date()): Set<string> {
  const out = new Set<string>();
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() - i));
    out.add(d.toISOString().slice(0, 10));
  }
  return out;
}

/**
 * userId → email 맵. 단일 listUsers 호출(perPage cap)로 인덱싱.
 * cap 초과 사용자는 맵에 없음(이메일 "—"로 표시) — 스케일 시 RPC 이관.
 */
export async function buildEmailMap(admin: SupabaseClient, cap = 1000): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: cap });
    if (error || !data) return map;
    for (const u of data.users) {
      if (u.email) map.set(u.id, u.email);
    }
  } catch {
    /* 실패 시 빈 맵 — 이메일은 "—" 로 표시되고 나머지 데이터는 살림 */
  }
  return map;
}

/** 관리자 API 레이트리밋(관리자당 분당). 단일 관리자라 넉넉히. */
export async function adminRateLimit(userId: string): Promise<RateLimitResult> {
  return checkSimpleRateLimit({ key: `admin:${userId}`, limit: 120, windowMs: 60_000 });
}

/**
 * 운영자 계정 userId 집합 (2026-08-01 사장님 지시: "운영자로 등록된 계정은 합산 안되게").
 *
 *  운영자는 테스트로 화면을 열고 AI 를 돌린다 — 그게 실사용자 통계에 섞이면
 *  사용자 수·사용량·비용이 전부 부풀려져 판단을 그르친다.
 *  판정 기준은 인증과 동일한 SSOT(getAdminEmails) — 인증되는 계정이 곧 제외 대상.
 *
 *  ⚠️ 조용히 빼지 말 것. 호출처는 제외한 인원 수를 응답에 실어 화면이 명시하게 한다
 *     (숫자가 안 맞을 때 "왜 적지?" 를 만들지 않기 위해).
 */
export async function buildAdminUserIdSet(admin: SupabaseClient, cap = 1000): Promise<Set<string>> {
  const set = new Set<string>();
  const adminEmails = new Set(getAdminEmails().map((e) => e.toLowerCase()));
  if (adminEmails.size === 0) return set;
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: cap });
    if (error || !data) return set;
    for (const u of data.users) {
      if (u.email && adminEmails.has(u.email.toLowerCase())) set.add(u.id);
    }
  } catch {
    /* 실패 시 빈 집합 — 제외를 못 했다는 뜻이므로 호출처가 excludedAdmins=0 으로 보고한다 */
  }
  return set;
}
