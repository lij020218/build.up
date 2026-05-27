import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { getEnvVar } from "../../_lib/env";

export type ContractorResult = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  description: string;
  mapUrl: string | null;
};

type KakaoPlace = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  category_name: string;
  place_url: string;
};

type KakaoResponse = {
  documents: KakaoPlace[];
  meta: { total_count: number; pageable_count: number; is_end: boolean };
};

async function searchContractorsViaKakao(
  region: string,
  keyword: string,
  apiKey: string
): Promise<ContractorResult[]> {
  const query = `${region} ${keyword}`;
  const searchParams = new URLSearchParams({
    query,
    size: "5", // 5개 가져와서 상위 3개 선별
    sort: "accuracy",
  });

  // ⚠️ Kakao Local API 정책 (2025+): `KA` 헤더에 `os` + `origin` 필드 둘 다 필수.
  //    없으면 401 "KA Header is required but neither os nor origin field is given".
  const origin = getEnvVar("NEXT_PUBLIC_APP_URL")
    ?? getEnvVar("VERCEL_URL")?.replace(/^/, "https://")
    ?? "http://localhost:3000";
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
        KA: `sdk/1.0.0 os/javascript origin/${origin}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Kakao Local API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as KakaoResponse;

  return data.documents
    .slice(0, 3)
    .map((place) => ({
      id: `kakao-${place.id}`,
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      phone: place.phone || null,
      description: place.category_name.split(" > ").slice(-1)[0] || "",
      mapUrl: place.place_url || null,
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
