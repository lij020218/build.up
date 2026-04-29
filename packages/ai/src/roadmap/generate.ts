import Anthropic from "@anthropic-ai/sdk";
import { AiParseError } from "../types/ai";
import type { AiCallOptions } from "../types/ai";
import { systemWithCache } from "../utils/client";
import {
  ROADMAP_GENERATION_SYSTEM_PROMPT,
  buildRoadmapGenerationPrompt,
} from "./prompt";
import type { RoadmapGenerationInput, RoadmapGenerationResult } from "./prompt";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 4096; // Sonnet 4.6은 더 긴 응답 생성 가능 — 잘림 방지

/**
 * Tool Use 스키마 — 99.8% schema 준수율 (vs JSON parsing의 95% 수준).
 * 응답을 이 tool 호출로 강제하여 환각·필드 누락·잘못된 enum 거의 0.
 */
const ROADMAP_TOOL: Anthropic.Tool = {
  name: "submit_roadmap",
  description: "사용자 사업 아이디어를 분석한 결과를 구조화된 로드맵으로 제출합니다.",
  input_schema: {
    type: "object",
    properties: {
      conceptSummary: { type: "string", description: "사업 컨셉 2-3줄 요약" },
      parsed: {
        type: "object",
        properties: {
          industryCategoryId: {
            type: "string",
            enum: ["food", "cafe-dessert", "retail", "online-digital", "beauty", "fitness", "education", "pet", "living-service", "startup-tech", "space"],
          },
          subIndustryId: { type: "string" },
          industryLabel: { type: "string" },
          startupType: { type: "string", enum: ["independent", "franchise"] },
          businessModelId: { type: "string" },
          preferredRegion: { type: "string" },
        },
        required: ["industryCategoryId", "subIndustryId", "industryLabel", "startupType", "businessModelId", "preferredRegion"],
      },
      marketAnalysis: {
        type: "object",
        properties: {
          score: { type: "number", minimum: 0, maximum: 100 },
          grade: { type: "string", enum: ["S", "A", "B", "C", "D"] },
          footTraffic: { type: "string" },
          competition: { type: "string" },
          rentLevel: { type: "string" },
          targetFit: { type: "string" },
          summary: { type: "string" },
        },
        required: ["score", "grade", "footTraffic", "competition", "rentLevel", "targetFit", "summary"],
      },
      budgetAllocation: {
        type: "object",
        properties: {
          deposit: { type: "number" },
          interior: { type: "number" },
          equipment: { type: "number" },
          workingCapital: { type: "number" },
          total: { type: "number" },
        },
        required: ["deposit", "interior", "equipment", "workingCapital", "total"],
      },
      monthlyCosts: {
        type: "object",
        properties: {
          ingredients: { type: "number" },
          labor: { type: "number" },
          rent: { type: "number" },
          utilities: { type: "number" },
          other: { type: "number" },
        },
        required: ["ingredients", "labor", "rent", "utilities", "other"],
      },
      recommendations: {
        type: "object",
        properties: {
          suppliers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                reason: { type: "string" },
                priceRange: { type: "string" },
              },
              required: ["name", "category", "reason", "priceRange"],
            },
          },
          deliveryPlatforms: { type: "array", items: { type: "string" } },
          snsChannels: { type: "array", items: { type: "string" } },
          permits: { type: "array", items: { type: "string" } },
          taxAdvice: { type: "string" },
          interior: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                vendor: { type: "string" },
                estimatedCost: { type: "string" },
              },
              required: ["item", "vendor", "estimatedCost"],
            },
          },
        },
        required: ["suppliers", "deliveryPlatforms", "snsChannels", "permits", "taxAdvice", "interior"],
      },
      timeline: {
        type: "object",
        properties: {
          targetOpenDate: { type: "string" },
          totalWeeks: { type: "number" },
          phases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                weeks: { type: "number" },
              },
              required: ["name", "weeks"],
            },
          },
        },
        required: ["targetOpenDate", "totalWeeks", "phases"],
      },
      risks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            level: { type: "string", enum: ["high", "medium", "low"] },
            description: { type: "string" },
            mitigation: { type: "string" },
          },
          required: ["level", "description", "mitigation"],
        },
      },
      missingFields: {
        type: "array",
        items: { type: "string", enum: ["budget", "region", "teamSize"] },
      },
    },
    required: ["conceptSummary", "parsed", "marketAnalysis", "budgetAllocation", "monthlyCosts", "recommendations", "timeline", "risks", "missingFields"],
  },
};

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
  } catch (e) {
    const parseMsg = e instanceof Error ? e.message : String(e);
    console.error("[roadmap/parse] JSON parse error:", parseMsg);
    console.error("[roadmap/parse] Cleaned length:", cleaned.length, "Last 200:", cleaned.substring(cleaned.length - 200));
    console.error("[roadmap/parse] First 300:", cleaned.substring(0, 300));
    throw new AiParseError(`AI 응답 파싱 실패: ${parseMsg}`, raw);
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
    conceptSummary: String(obj.conceptSummary ?? "").trim(),
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
  const client = new Anthropic({ apiKey: options.apiKey, timeout: 120_000 }); // 120초 — 프롬프트 축소 후에도 여유 확보

  // SDK 0.39 가 thinking 파라미터를 타입에 명시하지 않아 input cast 필요.
  // 응답은 단일 Message 타입으로 cast 하여 후속 .content/.usage 사용.
  const rawResponse = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    // ✦ Prompt Caching (1h TTL) — system prompt 1700+ tokens 가 시간대별 안정 재사용
    system: systemWithCache(ROADMAP_GENERATION_SYSTEM_PROMPT, "1h"),
    // ✦ Tool Use — 99.8% schema 준수율 (vs JSON parsing의 환각·필드 누락 risk)
    tools: [ROADMAP_TOOL],
    tool_choice: { type: "tool", name: "submit_roadmap" },
    // ✦ Adaptive Thinking — 다단계 추론 (업종 추론 → 시장 분석 → 예산 배분 → 인테리어 → 리스크) 품질 향상
    thinking: { type: "enabled", budget_tokens: 4096 },
    messages: [
      { role: "user", content: buildRoadmapGenerationPrompt(input) },
    ],
  } as Parameters<typeof client.messages.create>[0]);
  const response = rawResponse as Anthropic.Messages.Message;

  console.log(
    "[roadmap/generate] stop_reason:", response.stop_reason,
    "content types:", response.content.map(c => c.type).join(", "),
    "cache_read:", response.usage?.cache_read_input_tokens ?? 0,
    "cache_create:", response.usage?.cache_creation_input_tokens ?? 0,
  );

  // Tool Use 응답 우선 처리 (강제됐으니 항상 존재)
  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (toolUse && toolUse.type === "tool_use") {
    // tool input은 schema 강제됐지만 parseResponse 의 안전장치 (subIndustryId fallback 등) 재사용
    return parseResponse(JSON.stringify(toolUse.input));
  }

  // Fallback: 구버전 호환 — text 블록 파싱
  const textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AiParseError(
      "AI 응답에 tool_use 또는 text 블록이 없습니다. Types: " + response.content.map(c => c.type).join(", "),
      JSON.stringify(response.content),
    );
  }
  console.log("[roadmap/generate] Fallback to text block, length:", textBlock.text.length);
  return parseResponse(textBlock.text);
}
