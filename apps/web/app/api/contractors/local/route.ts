import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { getEnvVar } from "../../_lib/env";
import { searchKakaoPlaces } from "../../_lib/kakao-local";

export type ContractorResult = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  description: string;
  mapUrl: string | null;
};

// Kakao 검색 구현은 _lib/kakao-local.ts 로 SSOT 화 (2026-08-04) —
// 로드맵 생성의 지역 공급처 실명 부착과 같은 코드를 쓴다.
async function searchContractorsViaKakao(
  region: string,
  keyword: string,
  apiKey: string
): Promise<ContractorResult[]> {
  const places = await searchKakaoPlaces(region, keyword, apiKey, { size: 5 });
  return places.slice(0, 3).map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    phone: p.phone,
    description: p.category,
    mapUrl: p.mapUrl,
  }));
}

// GET /api/contractors/local?region=홍대&categoryId=cafe-dessert&keyword=카페+인테리어+전문
export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimit = await checkSimpleRateLimit({
    key: `contractors:${auth.userId}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  const url = new URL(request.url);
  const region = url.searchParams.get("region")?.trim();
  const categoryId = url.searchParams.get("categoryId")?.trim();
  const keyword = url.searchParams.get("keyword")?.trim();

  if (!region || !categoryId || !keyword) {
    return NextResponse.json(
      { error: "region, categoryId, keyword are required." },
      { status: 400 }
    );
  }

  // ⚠ Claude Code 가 process.env.KAKAO_REST_API_KEY="" 로 덮어쓰는 케이스 대비 — _lib/env 사용.
  const kakaoKey = getEnvVar("KAKAO_REST_API_KEY");
  if (!kakaoKey) {
    return NextResponse.json({ results: [], source: "no_api_key" });
  }

  try {
    const results = await searchContractorsViaKakao(region, keyword, kakaoKey);
    console.log(`[contractors/local] OK region="${region}" keyword="${keyword}" → ${results.length} results`);
    return NextResponse.json(
      { results, source: "kakao" },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  } catch (err) {
    console.error(`[contractors/local] Kakao search FAILED region="${region}" keyword="${keyword}":`, err);
    return NextResponse.json({ error: "업체 검색 실패", results: [], source: "error" }, { status: 502 });
  }
}
