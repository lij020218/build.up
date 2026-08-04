/**
 * GET /api/marketing/influencer-collab?categoryId=food
 *
 *  협찬 탭 데이터 — 큐레이션 디렉토리 + 협업 플레이 + 시세표 (전부 shared SSOT, LLM 0%).
 *  iOS 가 웹과 동일 데이터를 쓰기 위한 서빙 라우트 (웹은 shared 를 직접 import).
 *  DM 템플릿·검색 쿼리는 원문({가게명}·{지역}·{region} 플레이스홀더)으로 내려주고
 *  치환은 클라이언트가 한다 (fillDmTemplate/fillQuery 미러 — 단순 치환 2종).
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import {
  INFLUENCER_DIRECTORY_CHECKED_AT,
  influencersForCategory,
  influencerProfileUrl,
  INFLUENCER_FEE_RANGES,
  INFLUENCER_NOT_FIT,
  FEE_SOURCES_KO,
  playsForIndustry,
} from "@foundone/shared";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `influencer-collab:${auth.userId}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  const url = new URL(request.url);
  const categoryId = (url.searchParams.get("categoryId") ?? "").trim() || null;

  const curated = influencersForCategory(categoryId).map((i) => ({
    ...i,
    profileUrl: influencerProfileUrl(i),
  }));
  const plays = categoryId ? playsForIndustry(categoryId) : [];
  const notFit = categoryId ? INFLUENCER_NOT_FIT[categoryId] ?? null : null;

  return NextResponse.json(
    {
      checkedAt: INFLUENCER_DIRECTORY_CHECKED_AT,
      curated,
      plays: plays.map((p) => ({
        id: p.id,
        titleKo: p.titleKo,
        targetKo: p.targetKo,
        practiceKo: p.practiceKo,
        collabType: p.collabType,
        instagramQueries: p.instagramQueries,
        dmTemplateKo: p.dmTemplateKo,
      })),
      notFit,
      feeRanges: INFLUENCER_FEE_RANGES,
      feeSources: FEE_SOURCES_KO,
    },
    { headers: { "Cache-Control": "private, max-age=3600" } },
  );
}
