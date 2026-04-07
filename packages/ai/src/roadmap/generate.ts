import Anthropic from "@anthropic-ai/sdk";
import { AiParseError } from "../types/ai";
import type { AiCallOptions } from "../types/ai";
import {
  ROADMAP_GENERATION_SYSTEM_PROMPT,
  buildRoadmapGenerationPrompt,
} from "./prompt";
import type { RoadmapGenerationInput, RoadmapGenerationResult } from "./prompt";

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const DEFAULT_MAX_TOKENS = 4096;

function parseResponse(raw: string): RoadmapGenerationResult {
  // 마크다운 블록 제거
  let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

  // JSON 객체 추출
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AiParseError("AI 응답이 유효한 JSON이 아닙니다.", raw);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AiParseError("AI 응답이 객체 형태가 아닙니다.", raw);
  }

  const obj = parsed as Record<string, unknown>;

  // 필수 필드 검증
  if (!obj.parsed || typeof obj.parsed !== "object") {
    throw new AiParseError("parsed 필드가 없습니다.", raw);
  }

  const p = obj.parsed as Record<string, unknown>;

  // 유효한 카테고리 ID 검증
  const validCategories = ["food", "cafe-dessert", "retail", "online-digital", "beauty", "fitness", "education", "pet", "living-service", "startup-tech", "space"];
  if (!validCategories.includes(String(p.industryCategoryId))) {
    // silent fallback 제거 — 클라이언트에서 사용자에게 업종 선택 UI를 표시하도록
    // _needsCategoryConfirm 플래그를 결과에 포함
    p.industryCategoryId = String(p.industryCategoryId ?? "");
    p._needsCategoryConfirm = true;
  }

  // 유효한 세부 업종 ID 검증
  const validSubIndustries: Record<string, string[]> = {
    "food": ["korean-casual", "delivery-meals", "salad-healthy", "ramen-noodle", "chicken-burger", "western-pasta-brunch"],
    "cafe-dessert": ["takeout-coffee", "specialty-coffee", "dessert-cafe", "bakery-studio", "icecream-bingsu", "self-serve-cafe"],
    "retail": ["convenience-small", "lifestyle-goods", "beauty-supplies", "fashion-accessories", "health-food-store", "unmanned-retail"],
    "beauty": ["hair-salon", "nail-studio", "skin-care-room", "waxing-studio", "eyelash-brow", "makeup-bridal"],
    "fitness": ["pilates-studio", "pt-gym", "yoga-studio", "crossfit-box", "golf-studio", "unmanned-fitness"],
    "education": ["study-room", "kids-academy", "adult-class", "language-academy", "coding-class", "small-study-room"],
    "pet": ["pet-grooming", "pet-supplies", "pet-hotel", "pet-cafe", "pet-training-school", "pet-walking-visit"],
    "living-service": ["laundry-service", "cleaning-service", "repair-service", "self-laundry", "print-copy", "device-repair"],
    "space": ["guesthouse", "rental-studio", "party-room", "study-cafe-space", "shared-office", "practice-room"],
    "online-digital": ["smart-store", "digital-products", "creator-service", "consignment-commerce", "newsletter-membership", "global-buying"],
    "startup-tech": ["ai-application", "developer-tools", "b2b-saas", "fintech-startup"],
  };
  const allValid = Object.values(validSubIndustries).flat();
  const rawSubId = String(p.subIndustryId ?? "");
  if (!allValid.includes(rawSubId)) {
    // fallback: 해당 카테고리의 첫 번째 ID
    const catId = String(p.industryCategoryId);
    p.subIndustryId = validSubIndustries[catId]?.[0] ?? "korean-casual";
  }

  // marketAnalysis 파싱
  const ma = (obj.marketAnalysis ?? {}) as Record<string, unknown>;
  const validGrades = ["S", "A", "B", "C", "D"];
  const rawGrade = String(ma.grade ?? "B").toUpperCase();

  // 기본값 채우기
  const result: RoadmapGenerationResult = {
    parsed: {
      industryCategoryId: String(p.industryCategoryId || "food"),
      _needsCategoryConfirm: Boolean(p._needsCategoryConfirm),
      subIndustryId: String(p.subIndustryId ?? "general"),
      industryLabel: String(p.industryLabel ?? ""),
      startupType: p.startupType === "franchise" ? "franchise" : "independent",
      businessModelId: String(p.businessModelId ?? "dine-in"),
      preferredRegion: String(p.preferredRegion ?? ""),
    },
    marketAnalysis: {
      score: Math.min(100, Math.max(0, Number(ma.score) || 65)),
      grade: (validGrades.includes(rawGrade) ? rawGrade : "B") as "S" | "A" | "B" | "C" | "D",
      footTraffic: String(ma.footTraffic ?? ""),
      competition: String(ma.competition ?? ""),
      rentLevel: String(ma.rentLevel ?? ""),
      targetFit: String(ma.targetFit ?? ""),
      summary: String(ma.summary ?? ""),
    },
    budgetAllocation: {
      deposit: Number((obj.budgetAllocation as Record<string, unknown>)?.deposit) || 0,
      interior: Number((obj.budgetAllocation as Record<string, unknown>)?.interior) || 0,
      equipment: Number((obj.budgetAllocation as Record<string, unknown>)?.equipment) || 0,
      workingCapital: Number((obj.budgetAllocation as Record<string, unknown>)?.workingCapital) || 0,
      total: Number((obj.budgetAllocation as Record<string, unknown>)?.total) || 0,
    },
    monthlyCosts: {
      ingredients: Number((obj.monthlyCosts as Record<string, unknown>)?.ingredients) || 0,
      labor: Number((obj.monthlyCosts as Record<string, unknown>)?.labor) || 0,
      rent: Number((obj.monthlyCosts as Record<string, unknown>)?.rent) || 0,
      utilities: Number((obj.monthlyCosts as Record<string, unknown>)?.utilities) || 0,
      other: Number((obj.monthlyCosts as Record<string, unknown>)?.other) || 0,
    },
    recommendations: {
      suppliers: Array.isArray((obj.recommendations as Record<string, unknown>)?.suppliers)
        ? ((obj.recommendations as Record<string, unknown>).suppliers as Array<Record<string, unknown>>).map(s => {
            // 하위호환: string[]도 처리
            if (typeof s === "string") return { name: s, category: "", reason: "", priceRange: "" };
            return {
              name: String(s.name ?? ""),
              category: String(s.category ?? ""),
              reason: String(s.reason ?? ""),
              priceRange: String(s.priceRange ?? ""),
            };
          })
        : [],
      deliveryPlatforms: Array.isArray((obj.recommendations as Record<string, unknown>)?.deliveryPlatforms)
        ? ((obj.recommendations as Record<string, unknown>).deliveryPlatforms as string[])
        : [],
      snsChannels: Array.isArray((obj.recommendations as Record<string, unknown>)?.snsChannels)
        ? ((obj.recommendations as Record<string, unknown>).snsChannels as string[])
        : [],
      permits: Array.isArray((obj.recommendations as Record<string, unknown>)?.permits)
        ? ((obj.recommendations as Record<string, unknown>).permits as string[])
        : [],
      taxAdvice: String((obj.recommendations as Record<string, unknown>)?.taxAdvice ?? ""),
      interior: Array.isArray((obj.recommendations as Record<string, unknown>)?.interior)
        ? ((obj.recommendations as Record<string, unknown>).interior as Array<{ item: string; vendor: string; estimatedCost: string }>).map(i => ({
            item: String(i.item ?? ""),
            vendor: String(i.vendor ?? ""),
            estimatedCost: String(i.estimatedCost ?? ""),
          }))
        : [],
    },
    timeline: {
      targetOpenDate: String((obj.timeline as Record<string, unknown>)?.targetOpenDate ?? new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10)),
      totalWeeks: Number((obj.timeline as Record<string, unknown>)?.totalWeeks) || 16,
      phases: Array.isArray((obj.timeline as Record<string, unknown>)?.phases)
        ? ((obj.timeline as Record<string, unknown>).phases as Array<{ name: string; weeks: number }>)
        : [],
    },
    risks: Array.isArray(obj.risks)
      ? (obj.risks as Array<{ level: string; description: string; mitigation: string }>).map(r => ({
          level: (["high", "medium", "low"].includes(r.level) ? r.level : "medium") as "high" | "medium" | "low",
          description: String(r.description ?? ""),
          mitigation: String(r.mitigation ?? ""),
        }))
      : [],
    missingFields: Array.isArray(obj.missingFields)
      ? (obj.missingFields as string[]).filter(f => ["budget", "region", "teamSize"].includes(f)) as Array<"budget" | "region" | "teamSize">
      : [],
  };

  return result;
}

export async function generateRoadmap(
  input: RoadmapGenerationInput,
  options: AiCallOptions
): Promise<RoadmapGenerationResult> {
  const client = new Anthropic({ apiKey: options.apiKey });

  const response = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    system: ROADMAP_GENERATION_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: buildRoadmapGenerationPrompt(input) },
    ],
  });

  const content = response.content[0];
  if (!content || content.type !== "text") {
    throw new AiParseError("AI 응답에 텍스트가 없습니다.", JSON.stringify(response.content));
  }

  return parseResponse(content.text);
}
