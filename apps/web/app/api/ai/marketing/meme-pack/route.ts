import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import {
  getMemeWeekKey,
  isItemFresh,
  MEME_FIT_CATEGORIES,
  type MemeItem,
  type MemeSource,
} from "../../../_lib/marketing-memes";
import { MEME_SEED_PACK } from "../../../_lib/marketing-meme-seed";
import { ensureStringKeys, MEME_ITEM_REQUIRED_STRINGS } from "../../../_lib/ios-contract";

/**
 * 주간 밈·챌린지 팩 서빙 (2026-07-24 신설).
 *
 * GET /api/ai/marketing/meme-pack?categoryId=food
 *
 * 폴백 체인 (정직성 — 모닝브리핑 stale 교훈: 없는 걸 있는 척하지 않고, 오래된 건 오래됐다고 표시):
 *   1) 이번 주 팩 (marketing_meme_packs, cron 이 매일 갱신)
 *   2) 지난 주 팩 → stale: true
 *   3) 코드 내 시드 팩 (2026-W30 큐레이션) → stale: 주차 다르면 true
 *
 * 수명 게이트(2026-09-12): DB 팩에서 **발행일이 없거나 수명이 지난 항목은 서빙하지 않는다**
 *   (밈 45일·포맷 120일). 저장 시점 정리만으로는 cron 이 멈춘 주에 오래된 소재가 계속 노출된다.
 *   필터 후 남는 게 없으면 다음 폴백으로 넘어간다.
 *
 * 업종 필터: industryFit 에 categoryId 가 있는 항목을 앞으로 정렬(fit 우선),
 *   범용("all") 항목이 뒤를 채움. 최대 6개. 생성·수집이 아니라 DB 읽기라 저비용.
 * 웹·iOS 가 동일 응답 사용.
 */

export const runtime = "nodejs";

const MAX_SERVED = 6;

type PackRow = {
  week_key: string;
  items: MemeItem[];
  sources: MemeSource[];
  generated_at: string;
};

/** iOS 계약(2026-08-19): required string 키가 null/undefined 로 내려가지 않게 정규화 + industryFit 배열 보장. */
function sanitizeMemeItems(items: unknown): MemeItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((it): it is MemeItem => !!it && typeof it === "object")
    .map((it) => ({
      ...ensureStringKeys(it, MEME_ITEM_REQUIRED_STRINGS),
      industryFit: Array.isArray(it.industryFit) ? it.industryFit.map(String) : [],
    }));
}

/** 수명 지난 소재 제거 — DB 팩 전용(시드는 최종 폴백이라 stale 표기로 통과시킨다). */
function freshOnly(items: MemeItem[], now = new Date()): MemeItem[] {
  return items.filter((it) => isItemFresh(it, now));
}

function orderForCategory(rawItems: unknown, categoryId: string | null): MemeItem[] {
  const items = sanitizeMemeItems(rawItems);
  if (!categoryId) return items.slice(0, MAX_SERVED);
  const fit = items.filter((it) => it.industryFit.includes(categoryId));
  const generic = items.filter((it) => !it.industryFit.includes(categoryId) && it.industryFit.includes("all"));
  const rest = items.filter((it) => !fit.includes(it) && !generic.includes(it));
  return [...fit, ...generic, ...rest].slice(0, MAX_SERVED);
}

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const rawCategory = url.searchParams.get("categoryId");
  const categoryId =
    rawCategory && (MEME_FIT_CATEGORIES as readonly string[]).includes(rawCategory) ? rawCategory : null;

  const thisWeek = getMemeWeekKey();
  const lastWeek = getMemeWeekKey(new Date(Date.now() - 7 * 86_400_000));

  const supa = getSupabaseAdmin();
  if (supa) {
    // 이번 주 → 지난 주를 한 번에 조회
    const { data } = await supa
      .from("marketing_meme_packs")
      .select("week_key, items, sources, generated_at")
      .in("week_key", [thisWeek, lastWeek]);
    const rows = (data ?? []) as PackRow[];
    const usable = (weekKeyWanted: string) => {
      const row = rows.find((r) => r.week_key === weekKeyWanted && Array.isArray(r.items));
      if (!row) return null;
      const items = freshOnly(sanitizeMemeItems(row.items));
      return items.length > 0 ? { row, items } : null;
    };
    const pick = usable(thisWeek) ?? usable(lastWeek);
    if (pick) {
      return NextResponse.json({
        weekKey: pick.row.week_key,
        stale: pick.row.week_key !== thisWeek,
        items: orderForCategory(pick.items, categoryId),
        sources: (Array.isArray(pick.row.sources) ? pick.row.sources : []).map((src) => ensureStringKeys(src ?? {}, ["name", "url"] as const)),
        generatedAt: pick.row.generated_at,
      });
    }
  }

  // 최종 폴백 — 코드 내 시드 (콜드 스타트·수집 실패 주)
  return NextResponse.json({
    weekKey: MEME_SEED_PACK.weekKey,
    stale: MEME_SEED_PACK.weekKey !== thisWeek,
    items: orderForCategory(MEME_SEED_PACK.items, categoryId),
    sources: MEME_SEED_PACK.sources,
    generatedAt: MEME_SEED_PACK.generatedAt,
  });
}
