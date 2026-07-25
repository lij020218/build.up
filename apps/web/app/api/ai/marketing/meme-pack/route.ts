import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import {
  getMemeWeekKey,
  MEME_FIT_CATEGORIES,
  type MemeItem,
  type MemeSource,
} from "../../../_lib/marketing-memes";
import { MEME_SEED_PACK } from "../../../_lib/marketing-meme-seed";

/**
 * 주간 밈·챌린지 팩 서빙 (2026-07-24 신설).
 *
 * GET /api/ai/marketing/meme-pack?categoryId=food
 *
 * 폴백 체인 (정직성 — 모닝브리핑 stale 교훈: 없는 걸 있는 척하지 않고, 오래된 건 오래됐다고 표시):
 *   1) 이번 주 팩 (marketing_meme_packs, cron 이 주 1회 생성)
 *   2) 지난 주 팩 → stale: true
 *   3) 코드 내 시드 팩 (2026-W30 큐레이션) → stale: 주차 다르면 true
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

function orderForCategory(items: MemeItem[], categoryId: string | null): MemeItem[] {
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
    const pick =
      rows.find((r) => r.week_key === thisWeek && Array.isArray(r.items) && r.items.length > 0)
      ?? rows.find((r) => r.week_key === lastWeek && Array.isArray(r.items) && r.items.length > 0);
    if (pick) {
      return NextResponse.json({
        weekKey: pick.week_key,
        stale: pick.week_key !== thisWeek,
        items: orderForCategory(pick.items, categoryId),
        sources: pick.sources ?? [],
        generatedAt: pick.generated_at,
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
