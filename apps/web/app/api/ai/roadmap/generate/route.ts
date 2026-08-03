import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireApiUser } from "../../../_lib/auth";
import { getAnthropicApiKey } from "../../../_lib/env";
import { checkSimpleRateLimit, checkRoadmapGenerationQuota, refundRoadmapGenerationUse } from "../../../_lib/rate-limit";
import { generateRoadmap, selectFromPool } from "@foundone/ai";
import type {
  RoadmapGenerationInput,
  RoadmapGenerationResult,
  PoolVendor,
  PoolMaterial,
  PoolConcept,
  PoolChannel,
} from "@foundone/ai";
import {
  loadVendorRecommendations,
  getVendorTypeLabel,
  getPlatformsForCategory,
  getLogisticsTypeLabel,
  findMarketRentDistricts,
  formatRentLine,
  MARKET_RENT_QUARTER_LABEL,
  getMatchedProgramsV2,
} from "@foundone/shared";
import {
  getUniversalVendorFallback,
  getUniversalMaterialFallback,
  getUniversalConceptFallback,
} from "./universal-fallback";

// Vercel serverless 함수 타임아웃: 120초 (Pro 플랜 필요)
export const maxDuration = 120;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Pass 1 의 sub-industry 결정을 받아 서비스 DB 에 등록된 검증된 풀을 fetch.
 * vendor_recommendations + interior_design_guides + 운영 채널 레지스트리.
 */
async function fetchPool(
  result: RoadmapGenerationResult,
): Promise<{
  vendors: PoolVendor[];
  materials: PoolMaterial[];
  concepts: PoolConcept[];
  channels: PoolChannel[];
}> {
  const categoryId = result.parsed.industryCategoryId;
  const subIndustryId = result.parsed.subIndustryId;
  const startupType: "franchise" | "independent" =
    result.parsed.startupType === "franchise" ? "franchise" : "independent";

  let vendors: PoolVendor[] = [];
  let materials: PoolMaterial[] = [];
  let concepts: PoolConcept[] = [];

  if (SUPABASE_URL && SUPABASE_ANON) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    try {
      // 디버깅: 각 쿼리를 별도로 실행하여 어디서 0이 나는지 정확히 파악
      const vendorRowsPromise = loadVendorRecommendations(supabase, { categoryId, subIndustryId, startupType })
        .then(async rows => {
          console.log(`[roadmap/fetchPool] vendor query OK rows=${rows.length} (cat=${categoryId} sub=${subIndustryId} startup=${startupType})`);
          // 0행이면 sanity check: 테이블 자체가 비어있는지, 아니면 query 필터가 too strict 한지 진단
          if (rows.length === 0) {
            const { count: totalCount, error: countErr } = await supabase
              .from("vendor_recommendations")
              .select("*", { count: "exact", head: true });
            const { count: catCount } = await supabase
              .from("vendor_recommendations")
              .select("*", { count: "exact", head: true })
              .eq("category_id", categoryId);
            const { count: subCount } = await supabase
              .from("vendor_recommendations")
              .select("*", { count: "exact", head: true })
              .eq("category_id", categoryId)
              .eq("sub_industry_id", subIndustryId);
            console.warn(
              `[roadmap/fetchPool] vendor SANITY: total=${totalCount ?? "?"} cat=${categoryId}→${catCount ?? "?"} sub=${subIndustryId}→${subCount ?? "?"}` +
              (countErr ? ` countErr=${countErr.message}` : ""),
            );
            if ((totalCount ?? 0) === 0) {
              console.warn(`[roadmap/fetchPool] ⚠️ vendor_recommendations 테이블이 완전히 비어있음. 마이그레이션 seed 미적용 또는 RLS 차단 가능성.`);
            } else if ((catCount ?? 0) === 0) {
              console.warn(`[roadmap/fetchPool] ⚠️ category="${categoryId}" 데이터 없음. AI 가 매칭한 카테고리가 seed 에 없을 수 있음.`);
            }
          }
          return rows;
        })
        .catch(err => {
          console.error(`[roadmap/fetchPool] vendor query FAILED:`, err instanceof Error ? err.message : String(err), `(cat=${categoryId} sub=${subIndustryId})`);
          return [];
        });

      const materialsPromise = supabase
        .from("interior_design_guides")
        .select("*")
        .eq("category_id", categoryId)
        .eq("sub_industry_id", subIndustryId)
        .eq("guide_type", "material")
        .eq("is_active", true)
        .order("priority", { ascending: true });

      const conceptsPromise = supabase
        .from("interior_design_guides")
        .select("*")
        .eq("category_id", categoryId)
        .eq("sub_industry_id", subIndustryId)
        .eq("guide_type", "concept")
        .eq("is_active", true)
        .order("priority", { ascending: true });

      const [vendorRows, materialsResp, conceptsResp] = await Promise.all([
        vendorRowsPromise,
        materialsPromise,
        conceptsPromise,
      ]);

      if (materialsResp.error) {
        console.error(`[roadmap/fetchPool] interior_design_guides material query FAILED:`, materialsResp.error.message, `code=${materialsResp.error.code} (cat=${categoryId} sub=${subIndustryId})`);
      } else {
        console.log(`[roadmap/fetchPool] interior material query OK rows=${(materialsResp.data ?? []).length} (cat=${categoryId} sub=${subIndustryId})`);
      }
      if (conceptsResp.error) {
        console.error(`[roadmap/fetchPool] interior_design_guides concept query FAILED:`, conceptsResp.error.message, `code=${conceptsResp.error.code}`);
      } else {
        console.log(`[roadmap/fetchPool] interior concept query OK rows=${(conceptsResp.data ?? []).length}`);
      }

      // ⚠️ 만약 sub-industry 매칭이 0이면 카테고리 단위로 fallback 시도
      let conceptRows = (conceptsResp.data ?? []) as Array<Record<string, unknown>>;
      let materialRows = (materialsResp.data ?? []) as Array<Record<string, unknown>>;

      if (materialRows.length === 0) {
        const { data: catMatData, error: catMatErr } = await supabase
          .from("interior_design_guides")
          .select("*")
          .eq("category_id", categoryId)
          .eq("guide_type", "material")
          .eq("is_active", true)
          .order("priority", { ascending: true })
          .limit(8);
        if (!catMatErr && catMatData) {
          materialRows = catMatData;
          console.log(`[roadmap/fetchPool] material fallback to category-only rows=${materialRows.length}`);
        }
      }
      if (conceptRows.length === 0) {
        const { data: catConData } = await supabase
          .from("interior_design_guides")
          .select("*")
          .eq("category_id", categoryId)
          .eq("guide_type", "concept")
          .eq("is_active", true)
          .order("priority", { ascending: true })
          .limit(5);
        if (catConData) {
          conceptRows = catConData;
          console.log(`[roadmap/fetchPool] concept fallback to category-only rows=${conceptRows.length}`);
        }
      }

      vendors = vendorRows.map(v => ({
        id: v.id,
        vendorType: v.vendorType,
        vendorTypeLabel: getVendorTypeLabel(v.vendorType),
        title: v.title,
        description: v.description,
        checkItems: v.checkItems,
        franchiseNote: v.franchiseNote,
        priority: v.priority,
      }));

      materials = materialRows.map(m => ({
        id: String(m.id ?? ""),
        nameKo: String(m.name_ko ?? ""),
        descriptionKo: String(m.description_ko ?? ""),
        costRangeKo: m.cost_range_ko ? String(m.cost_range_ko) : undefined,
        tags: Array.isArray(m.tags) ? (m.tags as string[]) : [],
        trendSource: m.trend_source ? String(m.trend_source) : undefined,
        priority: Number(m.priority) || 0,
      }));

      concepts = conceptRows.map(c => ({
        id: String(c.id ?? ""),
        nameKo: String(c.name_ko ?? ""),
        descriptionKo: String(c.description_ko ?? ""),
        costRangeKo: c.cost_range_ko ? String(c.cost_range_ko) : undefined,
        pros: Array.isArray(c.pros) ? (c.pros as string[]) : [],
        cons: Array.isArray(c.cons) ? (c.cons as string[]) : [],
        tags: Array.isArray(c.tags) ? (c.tags as string[]) : [],
        priority: Number(c.priority) || 0,
      }));
    } catch (e) {
      console.error("[roadmap/fetchPool] DB fetch failed:", e instanceof Error ? e.message : String(e));
    }
  }

  // 운영 채널 — 정적 레지스트리 (logistics-platforms.ts) 에서 카테고리 매칭
  const platforms = getPlatformsForCategory(categoryId);
  const channels: PoolChannel[] = platforms.map(p => ({
    id: p.id,
    nameKo: p.name.ko,
    type: p.type,
    typeLabelKo: getLogisticsTypeLabel(p.type, "ko"),
    commissionRate: p.commissionRate,
    features: p.features.ko,
    pros: p.pros.ko,
    cons: p.cons.ko,
  }));

  console.log(
    `[roadmap/fetchPool] sub=${subIndustryId} vendors=${vendors.length} materials=${materials.length} concepts=${concepts.length} channels=${channels.length}`,
  );

  return { vendors, materials, concepts, channels };
}

/**
 * Pass 2 결과를 RoadmapGenerationResult.recommendations 에 머지.
 * - suppliers: 풀에서 고른 vendor 로 교체 (id + reason 포함)
 * - interior: 풀의 자재 + 풀의 인테리어 vendor 로 교체
 * - selectedConcept: 풀의 컨셉 1개
 * - operationalChannels: 풀의 채널 + 우선순위 + reasoning
 * - deliveryPlatforms / snsChannels: operationalChannels 기반으로 재구성 (하위호환)
 */
function mergePoolSelections(
  result: RoadmapGenerationResult,
  pool: {
    vendors: PoolVendor[];
    materials: PoolMaterial[];
    concepts: PoolConcept[];
    channels: PoolChannel[];
  },
  picks: Awaited<ReturnType<typeof selectFromPool>>,
): RoadmapGenerationResult {
  const vendorById = new Map(pool.vendors.map(v => [v.id, v]));
  const materialById = new Map(pool.materials.map(m => [m.id, m]));
  const conceptById = new Map(pool.concepts.map(c => [c.id, c]));
  const channelById = new Map(pool.channels.map(c => [c.id, c]));

  // ── suppliers vs interiorVendors 분리 — 사용자에게 별도 카드로 노출 ──
  const pickedSupplierItems: RoadmapGenerationResult["recommendations"]["suppliers"] = [];
  const pickedInteriorVendors: NonNullable<RoadmapGenerationResult["recommendations"]["interiorVendors"]> = [];

  for (const pick of picks.pickedVendors) {
    const v = vendorById.get(pick.id);
    if (!v) continue;
    if (v.vendorType === "interior") {
      pickedInteriorVendors.push({
        id: v.id,
        title: v.title,
        description: v.description,
        checkItems: v.checkItems,
        reason: pick.reason,
      });
    } else {
      pickedSupplierItems.push({
        id: v.id,
        name: v.title,
        category: v.vendorTypeLabel,
        reason: pick.reason,
        priceRange: "",
      });
    }
  }

  // ── interior 자재: 풀에서 고른 자재만 (시공 업체와 별개) ──
  const pickedMaterialItems: RoadmapGenerationResult["recommendations"]["interior"] = picks.pickedMaterials
    .map(pick => {
      const m = materialById.get(pick.id);
      if (!m) return null;
      return {
        id: m.id,
        item: m.nameKo,
        vendor: m.descriptionKo,
        estimatedCost: m.costRangeKo ?? "",
        reason: pick.reason,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // ── 컨셉 ──
  let selectedConcept: RoadmapGenerationResult["recommendations"]["selectedConcept"] | undefined;
  if (picks.pickedConcept) {
    const c = conceptById.get(picks.pickedConcept.id);
    if (c) {
      selectedConcept = {
        id: c.id,
        nameKo: c.nameKo,
        descriptionKo: c.descriptionKo,
        costRangeKo: c.costRangeKo,
        pros: c.pros,
        cons: c.cons,
        reason: picks.pickedConcept.reason,
      };
    }
  }

  // ── 운영 채널 ──
  const operationalChannels: NonNullable<RoadmapGenerationResult["recommendations"]["operationalChannels"]> = [];
  for (const pick of picks.pickedChannels) {
    const ch = channelById.get(pick.id);
    if (!ch) continue;
    operationalChannels.push({
      id: ch.id,
      nameKo: ch.nameKo,
      type: ch.type,
      typeLabelKo: ch.typeLabelKo,
      commissionRate: ch.commissionRate,
      priority: pick.priority,
      reason: pick.reason,
    });
  }
  // priority asc, then commission asc
  operationalChannels.sort((a, b) => a.priority - b.priority || a.commissionRate - b.commissionRate);

  // ── 하위호환: deliveryPlatforms / snsChannels 도 재구성 ──
  const deliveryPlatforms = operationalChannels.filter(ch => ch.type === "delivery").map(ch => ch.id);
  const snsChannels = operationalChannels.filter(ch => ch.type === "social-commerce").map(ch => ch.id);

  // ── 인테리어 시공 업체 fallback — AI 가 안 골랐어도 풀에 있으면 priority 순 top 2 자동 선정 ──
  let finalInteriorVendors = pickedInteriorVendors;
  if (finalInteriorVendors.length === 0) {
    const interiorPool = pool.vendors.filter(v => v.vendorType === "interior").sort((a, b) => a.priority - b.priority);
    if (interiorPool.length > 0) {
      finalInteriorVendors = interiorPool.slice(0, Math.min(2, interiorPool.length)).map(v => ({
        id: v.id,
        title: v.title,
        description: v.description,
        checkItems: v.checkItems,
        reason: "검증 풀 우선순위 기준 자동 추천 (AI 가 별도 reasoning 미생성)",
      }));
      console.log(`[mergePool] interiorVendors fallback to top ${finalInteriorVendors.length} from pool`);
    }
  }

  // ── 자재 fallback — AI 가 안 골랐어도 풀에 있으면 priority 순 top 4 자동 ──
  let finalInterior = pickedMaterialItems;
  if (finalInterior.length === 0 && pool.materials.length > 0) {
    finalInterior = pool.materials.sort((a, b) => a.priority - b.priority).slice(0, Math.min(4, pool.materials.length)).map(m => ({
      id: m.id,
      item: m.nameKo,
      vendor: m.descriptionKo,
      estimatedCost: m.costRangeKo ?? "",
      reason: "검증 풀 우선순위 기준 자동 추천",
    }));
    console.log(`[mergePool] interior materials fallback to top ${finalInterior.length} from pool`);
  } else if (finalInterior.length === 0) {
    finalInterior = result.recommendations.interior;
  }

  // ── 공급업체 fallback — 풀에 vendor 있는데 AI 가 안 골랐으면 카테고리별 top 1씩 ──
  let finalSuppliers = pickedSupplierItems;
  if (finalSuppliers.length === 0) {
    const nonInterior = pool.vendors.filter(v => v.vendorType !== "interior");
    if (nonInterior.length > 0) {
      // vendor_type 별 1개씩 골라서 다양하게
      const seenTypes = new Set<string>();
      const picked: typeof finalSuppliers = [];
      for (const v of nonInterior.sort((a, b) => a.priority - b.priority)) {
        if (seenTypes.has(v.vendorType)) continue;
        seenTypes.add(v.vendorType);
        picked.push({
          id: v.id,
          name: v.title,
          category: v.vendorTypeLabel,
          reason: "검증 풀 우선순위 기준 자동 추천",
          priceRange: "",
        });
        if (picked.length >= 6) break;
      }
      finalSuppliers = picked;
      console.log(`[mergePool] suppliers fallback to top ${finalSuppliers.length} from pool`);
    } else {
      finalSuppliers = result.recommendations.suppliers;
    }
  }

  const finalDelivery = operationalChannels.length > 0 ? deliveryPlatforms : result.recommendations.deliveryPlatforms;
  const finalSns = operationalChannels.length > 0 ? snsChannels : result.recommendations.snsChannels;

  return {
    ...result,
    recommendations: {
      ...result.recommendations,
      suppliers: finalSuppliers,
      interior: finalInterior,
      interiorVendors: finalInteriorVendors.length > 0 ? finalInteriorVendors : undefined,
      deliveryPlatforms: finalDelivery,
      snsChannels: finalSns,
      selectedConcept,
      operationalChannels: operationalChannels.length > 0 ? operationalChannels : undefined,
    },
  };
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const rl = await checkSimpleRateLimit({
    key: `ai-roadmap-generate:${auth.userId}`,
    limit: 12,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
  // 생성 쿼터 (2026-08-03 사장님 정책): 무료 = 계정당 총 3회 / 프로 = 주 3회.
  //   서버 게이트라 웹·iOS 동시 적용. 실패 경로는 refundRoadmapGenerationUse 로 차감 환불.
  const quota = await checkRoadmapGenerationQuota(auth.userId);
  if (!quota.ok) {
    return NextResponse.json({ error: quota.error }, { status: quota.status });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    console.error("[roadmap/generate] ANTHROPIC_API_KEY missing. env value length:", process.env.ANTHROPIC_API_KEY?.length ?? 0);
    return NextResponse.json({ error: "AI 서비스를 일시적으로 사용할 수 없습니다. 서버를 재시작하거나 관리자에게 문의하세요." }, { status: 503 });
  }

  let body: RoadmapGenerationInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.ideaText?.trim()) {
    return NextResponse.json({ error: "사업 아이디어를 입력해주세요." }, { status: 400 });
  }

  // 길이 제한 — 비용 폭탄 + 프롬프트 주입 방어
  const MAX_IDEA_TEXT = 2_000;
  const MAX_STORE_NAME = 100;
  const MAX_REGION = 100;
  body = {
    ...body,
    ideaText: body.ideaText.trim().slice(0, MAX_IDEA_TEXT),
    ...(body.storeName !== undefined && { storeName: body.storeName.trim().slice(0, MAX_STORE_NAME) }),
    ...(body.region !== undefined && { region: body.region.trim().slice(0, MAX_REGION) }),
  };

  // ── Pass 1: sub-industry 결정 + 전체 컨텍스트 ──
  let result: RoadmapGenerationResult | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      result = await generateRoadmap(body, { apiKey });
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isTimeout = message.toLowerCase().includes("timeout") || message.toLowerCase().includes("timed out");
      console.error(`[roadmap/generate Pass 1] Attempt ${attempt + 1} error:`, message);

      if (isTimeout && attempt === 0) {
        console.log("[roadmap/generate] Retrying Pass 1 after timeout...");
        continue;
      }

      await refundRoadmapGenerationUse(auth.userId);   // 서버 오류가 크레딧을 먹지 않게
      return NextResponse.json(
        { error: isTimeout
          ? "AI 분석에 시간이 오래 걸리고 있습니다. 잠시 후 다시 시도해 주세요."
          : `로드맵 생성 중 오류: ${message}` },
        { status: 503 }
      );
    }
  }
  if (!result) {
    await refundRoadmapGenerationUse(auth.userId);   // 서버 오류가 크레딧을 먹지 않게
    return NextResponse.json({ error: "로드맵 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 503 });
  }

  // ── Pass 2 + Pool Enrichment ─────────────────────────────────────────────
  // 핵심 원칙: 공급업체는 비용의 대부분 + 사업 핵심이라 절대 빈 결과로 두지 않음.
  // 다층 안전망:
  //   ① fetchPool → DB 풀 (sub-industry → 카테고리 fallback)
  //   ② DB 풀 비면 universalFallback (코드 hardcoded 카테고리별 검증 데이터)
  //   ③ Pass 2 AI 호출 (풀에서 ID 골라서 사장님 상황별 reasoning 부여)
  //   ④ Pass 2 실패해도 mergePoolSelections 의 결정론적 fallback 으로 풀에서 직접 채움
  //
  // 어느 단계가 실패해도 사장님은 추천을 봄.

  let pool = await fetchPool(result);

  // ① 풀이 비어있으면 universalFallback 으로 보강
  if (pool.vendors.length === 0) {
    const fb = getUniversalVendorFallback(result.parsed.industryCategoryId, result.parsed.startupType);
    if (fb.length > 0) {
      pool = { ...pool, vendors: fb };
      console.log(`[roadmap/generate] universalFallback vendors=${fb.length} (cat=${result.parsed.industryCategoryId})`);
    }
  }
  if (pool.materials.length === 0) {
    const fb = getUniversalMaterialFallback(result.parsed.industryCategoryId);
    if (fb.length > 0) {
      pool = { ...pool, materials: fb };
      console.log(`[roadmap/generate] universalFallback materials=${fb.length}`);
    }
  }
  if (pool.concepts.length === 0) {
    const fb = getUniversalConceptFallback(result.parsed.industryCategoryId);
    if (fb.length > 0) {
      pool = { ...pool, concepts: fb };
      console.log(`[roadmap/generate] universalFallback concepts=${fb.length}`);
    }
  }

  let picks: Awaited<ReturnType<typeof selectFromPool>> = {
    pickedVendors: [],
    pickedMaterials: [],
    pickedChannels: [],
  };

  try {
    picks = await selectFromPool({
      ideaText: body.ideaText,
      budget: body.budget,
      region: body.region,
      teamSize: body.teamSize,
      industryLabel: result.parsed.industryLabel,
      subIndustryId: result.parsed.subIndustryId,
      startupType: result.parsed.startupType,
      language: body.language,
      pool,
    }, { apiKey });
  } catch (e) {
    console.error("[roadmap/generate Pass 2] AI selection failed, will use deterministic pool fallback:", e instanceof Error ? e.message : String(e));
    // picks 는 빈 채로 — mergePoolSelections 의 fallback 이 풀에서 priority 순으로 자동 채움
  }

  // ⭐ mergePoolSelections — picks 가 빈 경우에도 풀에서 결정론적으로 채움 (이미 구현)
  const enriched = mergePoolSelections(result, pool, picks);

  // ── 지원사업 — LLM 산출을 버리고 SSOT 매칭으로 결정론 대체 (2026-08-03 감사 P2) ──
  //   종전엔 프롬프트에 7개 프로그램이 하드코딩("2026 기준" — 해 지나면 낡음)돼 있었고
  //   fitScore 를 LLM 이 지어냈다. 이제 startup-programs SSOT + getMatchedProgramsV2
  //   (대상자 게이트·세부업종 화이트리스트 포함)가 유일한 출처다.
  {
    const matched = getMatchedProgramsV2({
      startupType: result.parsed.startupType,
      industryCategoryId: result.parsed.industryCategoryId,
      subIndustryId: result.parsed.subIndustryId,
      region: result.parsed.preferredRegion || undefined,
      capital: body.budget,
      businessStage: "pre-startup",          // AI 로드맵 = 예비 창업자 경로
    });
    enriched.fundingPrograms = matched
      .filter((m) => m.eligible)
      .slice(0, 5)
      .map((m) => ({
        name: m.name.ko,
        kind: "other" as const,              // kind 세분류는 SSOT category 가 대체 (표시엔 미사용)
        eligibility: m.target.ko,
        amount: m.amount ?? m.benefit.ko,
        ...(m.daysUntilDeadline != null ? { deadline: `D-${m.daysUntilDeadline}` } : {}),
        fitScore: Math.max(0, Math.min(100, m.personalFitScore)),   // 결정론 — 매칭 규칙 점수
      }));
  }

  // ── 상권 분석 — LLM 산출을 버리고 실측으로 결정론 대체 (2026-08-03 정직성 감사 P0) ──
  //   종전엔 프롬프트가 서울 8개 상권 하드코딩을 근거로 전국 점수·유동인구를 지어내게 했다.
  //   지금 실측 가능한 축은 임대료(한국부동산원 372개 조사상권)뿐 → 그것만 말하고,
  //   점수·등급·유동인구·경쟁밀도는 데이터가 생길 때까지 **표시하지 않는다** (N/A).
  {
    const region = result.parsed.preferredRegion ?? "";
    const matches = region ? findMarketRentDistricts(region, 1) : [];
    const top = matches[0];
    const rentLine = top ? formatRentLine(top.entry) : null;
    enriched.marketAnalysis = {
      score: 0,
      grade: "N/A",                                     // 점수 체계는 실측 3축(경쟁·활성도·임대료) 완성 후
      footTraffic: "",                                  // 전국 무료 공공 데이터 부재 — 위조 대신 미표시
      competition: "",                                  // 상가정보 API 연동 후 실측 예정
      rentLevel: rentLine ?? "",
      targetFit: "",
      summary: top && rentLine
        ? `임대료는 ${MARKET_RENT_QUARTER_LABEL} 실측 기준입니다. 유동인구·경쟁 밀도는 공공 실측 데이터가 확보되는 대로 제공할 예정이며, 그 전까지는 소상공인 상권정보시스템(sbiz.or.kr)에서 직접 확인하시길 권합니다.`
        : region
          ? `"${region}"은(는) 한국부동산원 조사 상권(전국 372개) 밖이라 실측 임대료가 없습니다. 상권 분석은 소상공인 상권정보시스템(sbiz.or.kr)에서 확인하세요 — 추정치를 지어내지 않습니다.`
          : "지역이 정해지면 실측 상권 데이터를 보여드립니다.",
    };
  }

  // 풀 데이터 자체도 보존 (UI 가 "어떤 풀에서 골랐는지" 표시 가능)
  enriched.serviceRecommendations = {
    vendors: pool.vendors.slice(0, 12),
    interiorMaterials: pool.materials.slice(0, 8),
    interiorConcepts: pool.concepts.slice(0, 5),
  };

  console.log(
    `[roadmap/generate] FINAL suppliers=${enriched.recommendations.suppliers.length}` +
    ` interiorVendors=${enriched.recommendations.interiorVendors?.length ?? 0}` +
    ` interior=${enriched.recommendations.interior.length}` +
    ` channels=${enriched.recommendations.operationalChannels?.length ?? 0}` +
    ` concept=${enriched.recommendations.selectedConcept ? "1" : "0"}`,
  );

  return NextResponse.json(enriched);
}
