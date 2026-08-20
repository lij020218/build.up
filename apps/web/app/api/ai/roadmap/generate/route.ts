import { NextResponse, after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireApiUser } from "../../../_lib/auth";
import { getAnthropicApiKey } from "../../../_lib/env";
import { checkRoadmapGenerationQuota } from "../../../_lib/rate-limit";
import { runAiFeature } from "../../../_lib/ai-guard";
import {
  wantsAsyncJob, createAiJob, markAiJobRunning, setAiJobProgress, markAiJobSucceeded, markAiJobFailed,
} from "../../../_lib/ai-jobs";
import { llmCallContext } from "@foundone/ai/utils/client";
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
// 세부업종 특화 인테리어 실명 SSOT — 시공 단계 UI 와 동일 출처 (데이터 파일, 클라이언트 의존 없음)
import { SUB_INDUSTRY_INTERIOR_2026 } from "../../../../lib/components/stages/offline/sub-industry-interior-2026";
// 지역 실명 데이터 (2026-08-04) — 국토부 등록 시공업체 + Kakao 지역 공급처
import { fetchInteriorFirms, extractSigungu, extractSido, normalizeFirmName } from "../../../_lib/interior-firms";
import { searchKakaoPlaces, geocodeRegion } from "../../../_lib/kakao-local";
import { sbizInteriorFirmsNear } from "../../../_lib/sbiz-store";
import { getEnvVar } from "../../../_lib/env";
import { getSupplyBrands } from "../../../_lib/supply-brands";

// Vercel 함수 타임아웃: 300초 (2026-08-19 — prod 에서 Pass1+Pass2 합산 120s 초과로 504 발생).
//   Pro 플랜은 300s 를 지원(Fluid Compute 기본 800s 까지 확장 가능): https://vercel.com/docs/functions/limitations
//   Pass 1 LLM 호출은 packages/ai createAiClient (30s × SDK 재시도 3회) + 라우트 재시도 2회 = 최악 ~180s < 300s
//   → 플랫폼 504 대신 아래 catch 에서 JSON 503 으로 응답한다.
export const maxDuration = 300;

// ── 비동기 작업 모드 (2026-08-19, "타임아웃은 정말 심각한 버그") ──
//   · 헤더 `x-ai-async: 1` 이 있으면: 모든 게이트(검증·쿼터·ai-guard) 통과 후 ai_jobs 행(queued)을 만들고
//     **202 {jobId, status:"queued"}** 를 즉시 돌려준다. 실제 생성은 같은 인보케이션의 `after()`(next/server,
//     Next 15.1+ 안정 — https://nextjs.org/docs/app/api-reference/functions/after) 에서 계속되며
//     maxDuration(300s) 만큼 살아 있다(Vercel waitUntil). 클라이언트는 GET /api/ai/jobs/[id] 로 폴링.
//   · 헤더가 없으면(출시된 iOS 1.0.0(5) 등 구 클라이언트) **동기** — 종전처럼 전체 결과 JSON 을 반환.
//     `x-ai-sync: 1` 또는 `?sync=1` 은 async 헤더가 있어도 동기를 강제(디버그·한 릴리스 레거시).
//   · 환불: 202 가 이미 나갔으므로 ai-guard 의 자동 환불(5xx 판정)은 동작하지 않는다 → after 안의 실패 분기에서
//     ctx.refund() 를 **명시적으로 1회** 호출(503 NextResponse 반환·throw 모두). 성공 시 환불 없음.

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
        // 실제 업체명(하림·마니커 등)은 title 이 아니라 description 에 산다 —
        // 종전엔 여기서 버려져 카드가 "…업체를 선정합니다" 만 보였다 (2026-08-03 사장님 리포트).
        description: v.description,
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
          description: v.description,
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
  // ── 입력 검증은 어떤 차감보다 먼저 — 잘못된 요청은 절대 차감되지 않는다 (2026-08-19 ai-guard 이관)
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
  // 확정 업종 (2026-08-03 분류 분리) — id 형식 검증만 (실제 강제는 generateRoadmap 내부)
  const ID_RE = /^[a-z0-9-]{2,40}$/;
  // 사용자 확정 예산 항목 (2026-08-20 예산 이원화) — 만원 단위. 키·값·개수 제한으로 프롬프트 주입·비용 방어.
  const sanitizeBudgetBreakdown = (raw: unknown): RoadmapGenerationInput["budgetBreakdown"] => {
    if (!raw || typeof raw !== "object") return undefined;
    const src = raw as { items?: unknown; workingCapital?: unknown; monthly?: unknown };
    const num = (v: unknown): number | undefined => {
      const n = Number(v);
      // 만원 단위 상한 100억(1,000,000만원) — parseResponse 의 원 단위 오염 기준과 동일
      return Number.isFinite(n) && n > 0 && n < 1_000_000 ? Math.round(n) : undefined;
    };
    const items: Record<string, number> = {};
    if (src.items && typeof src.items === "object") {
      for (const [k, v] of Object.entries(src.items as Record<string, unknown>).slice(0, 16)) {
        const n = num(v);
        if (n !== undefined && /^[a-zA-Z]{1,30}$/.test(k)) items[k] = n;
      }
    }
    const monthly: Record<string, number> = {};
    if (src.monthly && typeof src.monthly === "object") {
      for (const k of ["ingredients", "labor", "rent", "utilities", "other"]) {
        const n = num((src.monthly as Record<string, unknown>)[k]);
        if (n !== undefined) monthly[k] = n;
      }
    }
    const workingCapital = num(src.workingCapital);
    if (Object.keys(items).length === 0 && Object.keys(monthly).length === 0 && workingCapital === undefined) return undefined;
    return {
      ...(Object.keys(items).length > 0 ? { items } : {}),
      ...(workingCapital !== undefined ? { workingCapital } : {}),
      ...(Object.keys(monthly).length > 0 ? { monthly } : {}),
    };
  };

  body = {
    ...body,
    ...(body.confirmedSubIndustryId && !ID_RE.test(body.confirmedSubIndustryId) ? { confirmedSubIndustryId: undefined } : {}),
    ...(body.confirmedCategoryId && !ID_RE.test(body.confirmedCategoryId) ? { confirmedCategoryId: undefined } : {}),
    ideaText: body.ideaText.trim().slice(0, MAX_IDEA_TEXT),
    ...(body.storeName !== undefined && { storeName: body.storeName.trim().slice(0, MAX_STORE_NAME) }),
    ...(body.region !== undefined && { region: body.region.trim().slice(0, MAX_REGION) }),
    budgetBreakdown: sanitizeBudgetBreakdown(body.budgetBreakdown),
  };

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    console.error("[roadmap/generate] ANTHROPIC_API_KEY missing. env value length:", process.env.ANTHROPIC_API_KEY?.length ?? 0);
    return NextResponse.json({ error: "AI 서비스를 일시적으로 사용할 수 없습니다. 서버를 재시작하거나 관리자에게 문의하세요." }, { status: 503 });
  }

  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // 생성 쿼터 (2026-08-03 사장님 정책): 무료 = 계정당 총 3회 / 프로 = 주 3회. — 비쿼터 업무 게이트라 ai-guard 앞에 둔다
  //   (쿼터 거부 사용자는 일일 카운터가 차감되지 않게). 서버 게이트라 웹·iOS 동시 적용.
  //   실패 경로는 refundRoadmapGenerationUse 로 차감 환불.
  const quota = await checkRoadmapGenerationQuota(auth.userId);
  if (!quota.ok) {
    return NextResponse.json({ error: quota.error }, { status: quota.status });
  }

  // ── ai-guard: 분당·일(3)·주(6)·월 ₩6,000 한도 + 실패 시 전액 환불 (2026-08-19) ──
  //   핸들러가 503 을 돌려주거나 throw 하면 가드가 일·주·월 카운터를 환불한다(ctx.refund 중복 호출 금지 — 이중 환불).
  const FAIL_MESSAGE = "로드맵 생성에 실패했습니다. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요.";
  const asyncMode = wantsAsyncJob(request);
  const res = await runAiFeature(
    {
      request,
      feature: "roadmap-generate",
      limits: { daily: 3, weekly: 6 },
      // Pass1 은 핸들러 안에서 이미 1회 재시도(타임아웃) — 가드 재시도까지 겹치면 한 요청이 4회 LLM 호출·수 분 지연
      retryOnce: false,
      failMessage: FAIL_MESSAGE,
    },
    async (ctx) => {
      if (!asyncMode) return runRoadmapGeneration(body, apiKey);

      // ── 비동기 모드: ai_jobs 행 → 202 즉시 → after() 에서 생성 ──
      const jobId = await createAiJob({
        userId: ctx.userId,
        feature: "roadmap-generate",
        // 입력은 재현·디버그용 최소만(아이디어 전문은 2,000자 제한 적용 후)
        input: { ideaText: body.ideaText, region: body.region ?? null, budget: body.budget ?? null, confirmedSubIndustryId: body.confirmedSubIndustryId ?? null },
      });
      if (!jobId) {
        // 작업 원장을 못 만들면(DB 미설정 등) 동기로 폴백 — 거짓 실패 금지
        console.warn("[roadmap/generate] ai_jobs insert unavailable → sync fallback");
        return runRoadmapGeneration(body, apiKey);
      }

      const limits = ctx.limits;
      after(async () => {
        await markAiJobRunning(jobId, "업종 분석 중…");
        try {
          // after 콜백은 가드의 llmCallContext(AsyncLocalStorage) 밖에서 실행될 수 있어 명시적으로 다시 감싼다
          const out = await llmCallContext.run(
            { feature: "roadmap-generate", timeoutMs: limits.timeoutMs, maxRetries: limits.maxRetries },
            () => runRoadmapGeneration(body, apiKey, (p) => { void setAiJobProgress(jobId, p); }),
          );
          const payload = await out.json().catch(() => null) as Record<string, unknown> | null;
          if (out.status >= 200 && out.status < 300 && payload) {
            await markAiJobSucceeded(jobId, payload);
          } else {
            // 503(Pass1 실패 등) — 202 가 이미 나가 가드 자동 환불이 없으므로 여기서 1회 환불
            await ctx.refund();
            await markAiJobFailed(jobId, String(payload?.error ?? FAIL_MESSAGE));
            console.warn(`[roadmap/generate async] job ${jobId.slice(0, 8)} failed status=${out.status} (refunded)`);
          }
        } catch (e) {
          await ctx.refund();
          await markAiJobFailed(jobId, FAIL_MESSAGE);
          console.error(`[roadmap/generate async] job ${jobId.slice(0, 8)} threw (refunded):`, e instanceof Error ? e.message : String(e));
        }
      });
      return NextResponse.json({ jobId, status: "queued" }, { status: 202 });
    },
  );
  // 원장 기록·환불은 가드가 단 한 번 수행 (2026-08-19: 종전 이중 기록/이중 환불 제거). 평생 3회 판정은 같은 원장을 읽는다.
  return res;
}

/** Pass1(로드맵 본문) → Pass2(풀 선택) → 결정론 보강. 실패는 503 JSON(가드가 카운터 환불) 또는 throw.
 *  onProgress: 비동기 작업 모드에서 Pass 경계마다 진행 문구(ai_jobs.progress)를 갱신. 동기 모드는 미전달. */
async function runRoadmapGeneration(
  body: RoadmapGenerationInput,
  apiKey: string,
  onProgress?: (progress: string) => void,
): Promise<NextResponse> {
  // ── Pass 1: sub-industry 결정 + 전체 컨텍스트 ──
  let result: RoadmapGenerationResult | null = null;
  // 재시도 1층 원칙(2026-08-19): Pass1 재시도·폴백은 LlmClient(SDK 재시도 1회 + 모델 폴백 + 서킷 브레이커)가 담당.
  //   라우트에서 또 돌리면 최악 110s×4 = 440s > maxDuration 300. 여기선 1회만.
  {
    try {
      result = await generateRoadmap(body, { apiKey });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isTimeout = message.toLowerCase().includes("timeout") || message.toLowerCase().includes("timed out");
      console.error(`[roadmap/generate Pass 1] error:`, message);

      // 503 → ai-guard 가 일·주·월 환불
      return NextResponse.json(
        { error: isTimeout
          ? "AI 분석에 시간이 오래 걸리고 있습니다. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요."
          : `로드맵 생성 중 오류: ${message}`, refunded: true },
        { status: 503 }
      );
    }
  }
  if (!result) {
    // 503 → ai-guard 환불(+ POST 에서 쿼터 환불)
    return NextResponse.json({ error: "로드맵 생성에 실패했습니다. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요.", refunded: true }, { status: 503 });
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

  onProgress?.("공급처 매칭 중…");
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

  // ── 인테리어 시공 업체 실명 보강 (2026-08-03 사장님 리포트) ──
  //   vendor_recommendations 의 interior 시드는 순수 가이드 텍스트(업체명 0)라 카드가
  //   "업체를 추천해줄 것처럼 해놓고 인테리어 해야 한다는 내용만" 이 됐다.
  //   세부업종 SSOT(sub-industry-interior-2026)의 실명 업체·플랫폼을 description 에 덧붙인다.
  onProgress?.("지역 업체·지원사업 보강 중…");
  enrichInteriorVendorNames(enriched, result.parsed.subIndustryId);

  // ── 지역 실명 부착 (2026-08-04) — LLM 산출이 아니라 서버가 실데이터를 붙인다 ──
  //   ① 국토부 전국인테리어업체표준데이터: 내 시군구 등록 시공업체 (면허 등록 확인)
  //   ② Kakao Local: 내 지역 공급처 (식자재마트 등 업종별 검색어)
  //   지역이 없거나 API 실패면 필드 자체를 비운다 — 거짓 실패 화면 금지, 블록 비표시가 정직.
  await attachRegionalRealNames(enriched, result.parsed.preferredRegion, result.parsed.industryCategoryId, result.parsed.subIndustryId);

  // ── 대표 공급 브랜드 (SSOT — 점유율·인증 근거, 2026-08-04) ──
  //   프랜차이즈는 본사 물류가 강제라 부착하지 않는다. 근거 없는 업종은 빈 결과(정직).
  if (result.parsed.startupType !== "franchise") {
    const groups = getSupplyBrands(result.parsed.subIndustryId);
    if (groups.length > 0) enriched.recommendations.supplyBrands = groups;
  }

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

/**
 * 인테리어 시공 업체 카드에 실명 업체·플랫폼 한 줄 보강.
 *  1순위: 세부업종 특화 SSOT(sub-industry-interior-2026)의 specialistFirms (예: 큐플레이스·집닥).
 *  폴백: 전 업종 공통 비교견적·매칭 플랫폼 (universal-fallback 의 실명군과 동일 — 서버 표시 전용).
 *  광고가 아닌 참고용 — 복수 견적·계약서 검증 안내는 시공 단계 UI 에 이미 존재.
 */
function enrichInteriorVendorNames(r: RoadmapGenerationResult, subIndustryId: string | null | undefined): void {
  const vendors = r.recommendations.interiorVendors;
  if (!vendors || vendors.length === 0) return;
  const spec = subIndustryId ? SUB_INDUSTRY_INTERIOR_2026[subIndustryId] : undefined;
  const firms = (spec?.specialistFirms ?? []).map((f) => `${f.nameKo} (${f.typeKo})`);
  const line = firms.length > 0
    ? `업체·플랫폼 예: ${firms.join(", ")}`
    : "업체·플랫폼 예: 큐플레이스 (상업공간 비교견적), 집닥 (시공 매칭), 오늘의집 시공, 한샘 리하우스";
  for (const v of vendors) {
    if (v.description.includes("업체·플랫폼 예:")) continue; // 중복 보강 방지
    v.description = v.description ? `${v.description} ${line}.` : `${line}.`;
  }
}

// ── 지역 공급처 검색어 — 업종별 (서버 표시 전용, 억지 매칭보다 비움 우선) ──
const REGIONAL_SUPPLIER_KEYWORDS: Record<string, string[]> = {
  food: ["식자재마트", "업소용 주방"],
  "cafe-dessert": ["커피 원두 도매", "업소용 주방"],
  retail: ["도매 상가"],
  beauty: ["미용 재료 도매"],
};

// ── 업종별 인테리어 검색어 — "[지역] [업종] 인테리어" 카카오 검색 (업종 특화 신호) ──
const INTERIOR_INDUSTRY_KEYWORDS: Record<string, string> = {
  food: "음식점 인테리어",
  "cafe-dessert": "카페 인테리어",
  beauty: "미용실 인테리어",
  retail: "매장 인테리어",
  fitness: "헬스장 인테리어",
  education: "학원 인테리어",
  pet: "펫샵 인테리어",
  space: "상가 인테리어",
};

// 세부업종 정밀 검색어 (2026-08-04) — 실제로 통용되는 검색어만 등재, 없으면 업종 폴백.
//  키 = starterIndustryOptions/sub-industry-interior-2026 의 subIndustryId.
const INTERIOR_SUBINDUSTRY_KEYWORDS: Record<string, string> = {
  // 외식
  "korean-casual": "식당 인테리어",
  "chicken-burger": "치킨집 인테리어",
  "western-pasta-brunch": "레스토랑 인테리어",
  // 카페·디저트
  "bakery-studio": "베이커리 인테리어",
  // 뷰티
  "hair-salon": "미용실 인테리어",
  "nail-studio": "네일샵 인테리어",
  "skin-care-room": "피부관리실 인테리어",
  "makeup-bridal": "메이크업샵 인테리어",
  // 피트니스
  "pilates-studio": "필라테스 인테리어",
  "yoga-studio": "요가원 인테리어",
  "golf-studio": "골프연습장 인테리어",
};

/**
 * 지역 실명 부착 — 국토부 등록 시공업체(표준데이터) + Kakao 지역 공급처.
 *  두 소스는 독립 실패 (한쪽이 죽어도 다른 쪽은 붙는다). 지역 없으면 no-op.
 */
async function attachRegionalRealNames(
  r: RoadmapGenerationResult,
  preferredRegion: string | null | undefined,
  categoryId: string,
  subIndustryId?: string | null,
): Promise<void> {
  const region = (preferredRegion ?? "").trim();
  if (!region) return;

  // ① 인테리어 업체 — 3개 실데이터 소스 이름 교차 검증 (2026-08-04 사장님 지시).
  //    · CSV 등록 대장(국토부, interior_firms): 면허 등록 = licensed. 전화·등록일 보유.
  //    · 소진공 상가 API(국세청 원천): 상권 좌표 반경 내 실재 영업 = operating.
  //    · 카카오 "[지역] [업종] 인테리어" 검색: 업종 특화 = industryMatch. 전화·지도링크 보유.
  //    필드는 있는 소스에서 병합(전화 = CSV → 카카오, 주소 = CSV → 카카오 → 소진공).
  //    랭킹 = 확인된 신호 수 내림차순 (3중 > 2중 > 단일), 동점은 CSV 규모·업력 순.
  //    평점 데이터가 없으므로 "최고" 위조 금지 — 신호 기준을 UI 가 그대로 말한다. 소스별 독립 실패.
  const firmsPromise = (async () => {
    try {
      if (!r.recommendations.interiorVendors?.length) return;
      const sigungu = extractSigungu(region);
      const kakaoKey = getEnvVar("KAKAO_REST_API_KEY");
      const sbizKey = process.env.MOIS_API_KEY;
      // 세부업종 정밀 검색어 우선 (네일샵·베이커리 등) → 업종 → 범용 폴백
      const interiorKeyword =
        (subIndustryId ? INTERIOR_SUBINDUSTRY_KEYWORDS[subIndustryId] : undefined)
        ?? INTERIOR_INDUSTRY_KEYWORDS[categoryId]
        ?? "상가 인테리어";

      // 중심 좌표 먼저 — 카카오(거리순 정렬·distance)·소진공(반경) 둘 다 이 좌표를 쓴다
      const center = kakaoKey ? await geocodeRegion(region, kakaoKey).catch(() => null) : null;

      const [firms, places, sbizFirms] = await Promise.all([
        // sido 동반 필터 — 동명 시군구(서울/부산 강서구 등) 충돌 방지 (2026-08-04 실측 버그)
        sigungu ? fetchInteriorFirms({ sigungu, sido: extractSido(region), limit: 12 }) : Promise.resolve([]),
        kakaoKey
          ? searchKakaoPlaces(region, interiorKeyword, kakaoKey, { size: 8, center: center ?? undefined }).catch(() => [])
          : Promise.resolve([]),
        center && sbizKey
          ? sbizInteriorFirmsNear(center.lng, center.lat, 2000, sbizKey).catch(() => [])
          : Promise.resolve([]),
      ]);

      type RegionalFirm = NonNullable<RoadmapGenerationResult["recommendations"]["regionalInteriorFirms"]>[number];
      // 이름(정규화) 키로 3소스 병합 — csvRank 는 규모·업력 정렬 순서 보존용
      const merged = new Map<string, RegionalFirm & { csvRank: number }>();
      const upsert = (name: string, patch: Partial<RegionalFirm>, csvRank = 999) => {
        const norm = normalizeFirmName(name);
        if (!norm) return;
        const cur = merged.get(norm) ?? {
          name, address: "", phone: null, registeredAt: null,
          licensed: false, operating: false, industryMatch: false, distanceM: null, mapUrl: null, csvRank: 999,
        };
        merged.set(norm, {
          ...cur,
          // 필드 병합 — 이미 있는 값(우선순위 높은 소스가 먼저 넣음)을 지키고 빈 곳만 채움
          address: cur.address || (patch.address ?? ""),
          phone: cur.phone ?? patch.phone ?? null,
          registeredAt: cur.registeredAt ?? patch.registeredAt ?? null,
          mapUrl: cur.mapUrl ?? patch.mapUrl ?? null,
          licensed: cur.licensed || !!patch.licensed,
          operating: cur.operating || !!patch.operating,
          industryMatch: cur.industryMatch || !!patch.industryMatch,
          // 거리 = 좌표 있는 소스 중 최솟값 (같은 업체가 두 소스에 있으면 더 정확한 쪽)
          distanceM: cur.distanceM != null && patch.distanceM != null
            ? Math.min(cur.distanceM, patch.distanceM)
            : cur.distanceM ?? patch.distanceM ?? null,
          csvRank: Math.min(cur.csvRank, csvRank),
        });
      };
      // 소스 투입 순서 = 필드 우선순위 (CSV 전화·주소 우선 → 카카오 → 소진공)
      firms.forEach((f, i) => upsert(f.name, {
        address: f.address, phone: f.phone, registeredAt: f.registeredAt, licensed: true,
      }, i));
      for (const p of places) upsert(p.name, {
        address: p.address, phone: p.phone, mapUrl: p.mapUrl, industryMatch: true, distanceM: p.distanceM,
      });
      for (const s of sbizFirms) upsert(s.name, { address: s.address, operating: true, distanceM: s.distanceM });

      const signalCount = (f: RegionalFirm) =>
        Number(f.licensed) + Number(f.operating) + Number(f.industryMatch);
      // 랭킹 (2026-08-04 사장님 지시: "거리·업종 특화로 승부") —
      //   ① 업종 특화 우선 ② 가까운 거리 (좌표 없는 CSV-only 는 후순위) ③ 교차 신호 수 ④ CSV 규모·업력
      const ranked = [...merged.values()]
        // 단일 신호가 소진공뿐인 항목은 제외 — 반경 내 사업자일 뿐 추천 근거로는 약함
        .filter((f) => !(signalCount(f) === 1 && f.operating))
        .sort((a, b) =>
          Number(b.industryMatch) - Number(a.industryMatch)
          || (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity)
          || signalCount(b) - signalCount(a)
          || a.csvRank - b.csvRank)
        .slice(0, 5)
        .map(({ csvRank: _unused, ...f }) => f);
      if (ranked.length > 0) r.recommendations.regionalInteriorFirms = ranked;
    } catch { /* 독립 실패 — 비표시 */ }
  })();

  // ② 지역 공급처 — 업종 검색어별 top 2
  const suppliersPromise = (async () => {
    try {
      const keywords = REGIONAL_SUPPLIER_KEYWORDS[categoryId];
      const kakaoKey = getEnvVar("KAKAO_REST_API_KEY");
      if (!keywords || !kakaoKey) return;
      const found: NonNullable<RoadmapGenerationResult["recommendations"]["regionalSupplierPlaces"]> = [];
      for (const keyword of keywords) {
        const places = await searchKakaoPlaces(region, keyword, kakaoKey, { size: 3 });
        for (const p of places.slice(0, 2)) {
          found.push({ keyword, name: p.name, address: p.address, phone: p.phone, mapUrl: p.mapUrl });
        }
      }
      if (found.length > 0) r.recommendations.regionalSupplierPlaces = found;
    } catch { /* 독립 실패 — 비표시 */ }
  })();

  await Promise.all([firmsPromise, suppliersPromise]);
}
