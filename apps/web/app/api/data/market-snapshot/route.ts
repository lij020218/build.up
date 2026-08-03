/**
 * POST /api/data/market-snapshot — 지역 실측 스냅샷 (LLM 무관, 2026-08-03)
 *
 * 사장님 결정: "검색 패널 2종은 사용자가 상권을 입력할 때 같이 보여주는 방향이면 제거 —
 *  이건 API 활용인데 AI가 필요한지" → 필요 없다. 지역 입력(디바운스)만으로
 *  소진공 경쟁·프랜차이즈 실측·행안부 배후인구·부동산원 임대료/공실·자체 추이를 자동 표시.
 *
 * 정직성: 축별 null = "실측 없음" — 폴백 위조 금지. 경쟁만 카카오 [지도] 폴백 허용 (라벨 구분).
 * 부수효과: 스냅샷 검색도 recordAreaSnapshot 원장에 기록 → 추이 축적 가속.
 * 비용: LLM 0원. 소진공 ≤5콜 + 카카오 ≤2콜. 10분 인메모리 캐시.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../_lib/rate-limit";
import { getEnvVar } from "../../_lib/env";
import { kakao, geocodeRegion, competitionKeyword } from "../../_lib/market-geo";
import {
  sbizCountsInRadius, areaKeyFor, upjongSigFor, recordAreaSnapshot, findAreaTrend,
  franchisePresenceInRadius,
} from "../../_lib/sbiz-store";
import { findDongPopulation, formatDongPopulationLine } from "../../_lib/dong-population";
import { measuredRentFor } from "../../_lib/market-rent-lookup";
import { buildFranchiseCtx } from "../../_lib/franchise-context";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { MARKET_RENT_QUARTER_LABEL } from "@foundone/shared";

export const runtime = "nodejs";
export const maxDuration = 30;

export type MarketSnapshot = {
  region: string;
  center: { lat: number; lng: number };
  /** 각 축: 표시용 한 줄 (출처 라벨 포함) — null = 실측 없음 (클라이언트는 표시 생략) */
  axes: {
    competition: string | null;        // 소진공 공식 (우선)
    competitionMap: string | null;     // 카카오 [지도] 폴백 (공식 없을 때만 채움)
    franchise: string | null;          // 프랜차이즈 선택자만
    population: string | null;
    rent: string | null;
    trend: string | null;
    brandRegional: string | null;      // 시도 분포 (신형 가족)
  };
};

// ── 10분 인메모리 캐시 (서버리스 인스턴스 생존 동안 — 히트 못 해도 무해) ──
const CACHE_TTL_MS = 10 * 60_000;
const CACHE_MAX = 200;
const cache = new Map<string, { at: number; data: MarketSnapshot }>();

function cacheGet(key: string): MarketSnapshot | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) { cache.delete(key); return null; }
  return hit.data;
}
function cacheSet(key: string, data: MarketSnapshot) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), data });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  // LLM 없어 recommend(분10)보다 관대 — 그래도 소진공 쿼터 보호
  const rl = await checkSimpleRateLimit({
    key: `market-snapshot:${auth.userId}`, limit: 20, windowMs: 60_000,
    message: "잠시 후 다시 시도해 주세요.",
  });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });
  const dl = await checkDailyRateLimit({
    userId: auth.userId, feature: "market-snapshot", limit: 200,
    message: "오늘의 상권 조회 한도를 모두 사용했습니다.",
  });
  if (!dl.ok) return NextResponse.json({ ok: false, error: dl.error }, { status: dl.status });

  let body: { region?: string; subIndustryId?: string; categoryId?: string; franchiseBrandId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const region = (body.region ?? "").trim();
  const categoryId = (body.categoryId ?? "food").trim();
  const subIndustryId = body.subIndustryId?.trim();
  const franchiseBrandId = typeof body.franchiseBrandId === "string" ? body.franchiseBrandId.trim() : "";
  if (region.length < 2) {
    return NextResponse.json({ ok: false, error: "region required (2자 이상)" }, { status: 400 });
  }

  const cacheKey = `${region.replace(/\s+/g, "")}|${subIndustryId ?? categoryId}|${franchiseBrandId}`;
  const cached = cacheGet(cacheKey);
  if (cached) return NextResponse.json({ ok: true, snapshot: cached, cached: true });

  const kakaoKey = getEnvVar("KAKAO_REST_API_KEY");
  if (!kakaoKey) return NextResponse.json({ ok: false, error: "Kakao API 키가 설정되지 않았습니다." }, { status: 500 });

  const center = await geocodeRegion(region, kakaoKey);
  if (!center) {
    return NextResponse.json({
      ok: false,
      error: `"${region}" 위치를 찾을 수 없습니다. 더 구체적으로 입력해 주세요 (예: "마포구 망원동").`,
    }, { status: 404 });
  }

  const axes: MarketSnapshot["axes"] = {
    competition: null, competitionMap: null, franchise: null,
    population: null, rent: null, trend: null, brandRegional: null,
  };

  const sbizKey = process.env.MOIS_API_KEY;
  const fCtx = franchiseBrandId ? buildFranchiseCtx(franchiseBrandId, region) : null;
  axes.brandRegional = fCtx?.regionalLine ?? null;

  // 동 이름 추정 — 지역 텍스트 마지막 토큰 (인구·임대료 매칭 게이트는 각 모듈이 보수적으로 처리)
  const lastToken = region.split(/\s+/).pop() ?? region;

  await Promise.all([
    // ① 소진공 공식 경쟁 (+추이 원장 기록)
    (async () => {
      if (!sbizKey) return;
      const counts = await sbizCountsInRadius(subIndustryId ?? "", center.lng, center.lat, 500, sbizKey);
      if (typeof counts.sameUpjong === "number") {
        axes.competition = `동종 ${counts.sameUpjong}곳${typeof counts.totalStores === "number" ? ` · 전체 업소 ${counts.totalStores.toLocaleString()}곳` : ""} — 소상공인시장진흥공단(국세청 원천), 500m`;
        const admin = getSupabaseAdmin();
        const sig = subIndustryId ? upjongSigFor(subIndustryId) : null;
        if (admin && sig) {
          const areaKey = areaKeyFor(center.lng, center.lat, 500);
          void recordAreaSnapshot(admin, { areaKey, upjongSig: sig, sameCount: counts.sameUpjong, totalCount: counts.totalStores });
          const trend = await findAreaTrend(admin, { areaKey, upjongSig: sig, currentSame: counts.sameUpjong, currentTotal: counts.totalStores });
          if (trend) {
            axes.trend = `${trend.daysAgo}일 전 대비 동종 ${trend.sameDelta >= 0 ? "+" : ""}${trend.sameDelta}곳${trend.totalDelta != null ? ` · 전체 ${trend.totalDelta >= 0 ? "+" : ""}${trend.totalDelta}곳` : ""} — 자체 관측 실측`;
          }
        }
      }
    })(),
    // ② 카카오 [지도] 폴백 카운트 (공식과 병기하지 않음 — 아래에서 공식 있으면 비움)
    (async () => {
      const kw = competitionKeyword(categoryId, subIndustryId);
      const res = await kakao("search/keyword.json", { query: kw, x: center.lng, y: center.lat, radius: 500, size: 15, sort: "accuracy" }, kakaoKey);
      const n = res?.meta?.pageable_count ?? res?.documents?.length;
      if (typeof n === "number") axes.competitionMap = `동종 ${n}곳 — 카카오 지도 노출 기준, 500m`;
    })(),
    // ③ 프랜차이즈 실측 (브랜드 확정자만)
    (async () => {
      if (!sbizKey || !fCtx || !subIndustryId) return;
      const f = await franchisePresenceInRadius(subIndustryId, fCtx.brand.name.ko, fCtx.peerNames, center.lng, center.lat, 500, sbizKey);
      if (f) {
        axes.franchise = `같은 브랜드 ${f.sameBrand}개${f.peers.length > 0 ? ` · 동종: ${f.peers.map((x) => `${x.name} ${x.count}`).join(", ")}` : " · 동종 주요 브랜드 미발견"} — 소진공 상호명 매칭, 500m${f.sampled ? " (동종 300개 표본)" : ""}`;
      }
    })(),
  ]);

  // 공식이 있으면 지도 폴백은 표시하지 않는다 (두 기준 병기 = 혼동)
  if (axes.competition) axes.competitionMap = null;

  // ④ 배후인구 (행안부, 동 매칭 게이트) — 동기 조회
  const pop = findDongPopulation(region, lastToken);
  if (pop) axes.population = formatDongPopulationLine(pop);

  // ⑤ 실측 임대료/공실 (부동산원 조사상권 high 매칭만)
  const rent = measuredRentFor(region, lastToken);
  if (rent) {
    axes.rent = `${rent.district} 상권 ${rent.bldgLabel} ㎡당 월 ${rent.manwonPerM2}만원${rent.vacancyPct != null ? ` · 공실률 ${rent.vacancyPct}%` : ""} — 한국부동산원 ${MARKET_RENT_QUARTER_LABEL}`;
  }

  const snapshot: MarketSnapshot = { region, center, axes };
  cacheSet(cacheKey, snapshot);
  return NextResponse.json({ ok: true, snapshot, cached: false });
}
