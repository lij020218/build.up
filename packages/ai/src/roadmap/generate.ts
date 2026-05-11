import { createAiClient } from "../utils/client";
import { AiParseError } from "../types/ai";
import type { AiCallOptions } from "../types/ai";
import { systemWithCache } from "../utils/client";
import {
  ROADMAP_GENERATION_SYSTEM_PROMPT,
  buildRoadmapGenerationPrompt,
} from "./prompt";
import type { RoadmapGenerationInput, RoadmapGenerationResult } from "./prompt";

const DEFAULT_MODEL = "claude-sonnet-4-6";
// 스키마 확장 (identity + team + legal.permitsDetailed + insurance + moneyInfra
// + fundingPrograms + industrySpecific + recommendations.suppliers/interior 등)
// 으로 응답이 길어졌으므로 최소 16384 필요. 8192 에서도 stop_reason="max_tokens" 잘림 발생.
const DEFAULT_MAX_TOKENS = 16384;

/**
 * Tool Use 스키마 — 99.8% schema 준수율 (vs JSON parsing의 95% 수준).
 * 응답을 이 tool 호출로 강제하여 환각·필드 누락·잘못된 enum 거의 0.
 */
const ROADMAP_TOOL: { name: string; description?: string; input_schema?: unknown } = {
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
          subIndustryId: { type: "string", description: "정확히 71개 sub-industry 중 하나" },
          industryLabel: { type: "string" },
          startupType: { type: "string", enum: ["independent", "franchise"] },
          businessModelId: { type: "string" },
          preferredRegion: { type: "string" },
          matchingReason: { type: "string", description: "이 sub-industry 로 매칭한 이유 1줄" },
          matchingConfidence: { type: "number", minimum: 0, maximum: 100, description: "매칭 신뢰도 0-100" },
          alternativeSubIndustries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                reason: { type: "string" },
              },
              required: ["id", "reason"],
            },
            description: "차선책 sub-industry 2-3개 (사용자가 수정 가능하도록)",
          },
        },
        required: ["industryCategoryId", "subIndustryId", "industryLabel", "startupType", "businessModelId", "preferredRegion", "matchingReason", "matchingConfidence", "alternativeSubIndustries"],
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
      identity: {
        type: "object",
        properties: {
          suggestedStoreName: { type: "string" },
          mission: { type: "string" },
          targetCustomer: { type: "string" },
          businessOpenTime: { type: "string", description: "HH:MM 24h, 온라인·24h 영업이면 빈 문자열" },
          businessCloseTime: { type: "string", description: "HH:MM 24h" },
        },
        required: ["suggestedStoreName", "mission", "targetCustomer", "businessOpenTime", "businessCloseTime"],
      },
      team: {
        type: "object",
        properties: {
          initialSize: { type: "number", minimum: 1 },
          roles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                role: { type: "string" },
                timing: { type: "string", enum: ["now", "later"] },
                reason: { type: "string" },
              },
              required: ["role", "timing", "reason"],
            },
          },
        },
        required: ["initialSize", "roles"],
      },
      legal: {
        type: "object",
        properties: {
          taxType: { type: "string", enum: ["simplified", "standard", "corporation"] },
          taxTypeReason: { type: "string" },
          industryCode: { type: "string" },
          fourInsuranceRequired: { type: "boolean" },
          permitsDetailed: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                kind: { type: "string", enum: ["신고", "허가", "등록", "면허"] },
                where: { type: "string" },
                cost: { type: "string" },
                duration: { type: "string" },
                required: { type: "boolean" },
              },
              required: ["name", "kind", "where", "cost", "duration", "required"],
            },
          },
        },
        required: ["taxType", "taxTypeReason", "industryCode", "fourInsuranceRequired", "permitsDetailed"],
      },
      insurance: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string", enum: ["fire", "general-liability", "workers-comp", "product-liability", "auto", "property", "professional", "cyber", "other"] },
            required: { type: "boolean" },
            annualPremiumEstimate: { type: "number" },
            reason: { type: "string" },
          },
          required: ["name", "type", "required", "annualPremiumEstimate", "reason"],
        },
      },
      moneyInfra: {
        type: "object",
        properties: {
          recommendedBank: { type: "string", enum: ["ibk", "kakaobank", "woori", "shinhan", "kb", "hana", "nh", "kbank", "toss", "other"] },
          recommendedBankReason: { type: "string" },
          recommendedPos: { type: "string", enum: ["tossplace", "kis", "nice", "smartro", "kcp", "inicis", "kakaopay", "naverpay", "stripe", "other"] },
          recommendedPosReason: { type: "string" },
          cpaDecision: { type: "string", enum: ["self", "cpa", "hybrid"] },
          cpaReason: { type: "string" },
        },
        required: ["recommendedBank", "recommendedBankReason", "recommendedPos", "recommendedPosReason", "cpaDecision", "cpaReason"],
      },
      fundingPrograms: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            kind: { type: "string", enum: ["preliminary-startup", "youth-startup", "venture-cert", "innobiz", "mainbiz", "rnd", "tips", "other"] },
            eligibility: { type: "string" },
            amount: { type: "string" },
            deadline: { type: "string" },
            fitScore: { type: "number", minimum: 0, maximum: 100 },
          },
          required: ["name", "kind", "eligibility", "amount", "fitScore"],
        },
      },
      industrySpecific: {
        type: "object",
        properties: {
          menu: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "number" },
                reason: { type: "string" },
              },
              required: ["name", "price", "reason"],
            },
          },
          services: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                durationMin: { type: "number" },
                price: { type: "number" },
              },
              required: ["name", "durationMin", "price"],
            },
          },
          memberships: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                durationMonths: { type: "number" },
                price: { type: "number" },
              },
              required: ["name", "durationMonths", "price"],
            },
          },
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                targetMargin: { type: "number" },
                reason: { type: "string" },
              },
              required: ["name", "targetMargin", "reason"],
            },
          },
          coreAssets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                estimatedCost: { type: "number" },
                priority: { type: "string", enum: ["must", "nice"] },
              },
              required: ["name", "estimatedCost", "priority"],
            },
          },
        },
      },
    },
    required: ["conceptSummary", "parsed", "identity", "team", "legal", "insurance", "moneyInfra", "fundingPrograms", "marketAnalysis", "budgetAllocation", "monthlyCosts", "recommendations", "timeline", "risks", "missingFields"],
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

  // 유효한 세부 업종 ID 검증 — 71개 sub-industry 전부 등록 (starter-data.ts 와 1:1 일치)
  // ⚠️ starter-data 의 모든 세부업종이 여기에 있어야 함. 누락 시 AI 응답이 fallback 으로 잘못 매핑됨.
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
    "startup-tech": [
      "ai-application", "developer-tools", "b2b-saas",
      "fintech-startup", "healthtech-startup", "security-startup",
      "hardware-iot", "robotics-physical-ai",
      "semiconductor", "biotech-medtech", "climate-energy",
    ],
  };
  const allValid = Object.values(validSubIndustries).flat();
  const rawSubId = String(p.subIndustryId ?? "");
  const catId = String(p.industryCategoryId);
  if (!allValid.includes(rawSubId)) {
    // fallback: 해당 카테고리의 첫 번째 ID — 동시에 매칭 신뢰도 0으로 강제 (사용자 확인 필요)
    p.subIndustryId = validSubIndustries[catId]?.[0] ?? "korean-casual";
    p.matchingConfidence = 0;
    p.matchingReason = `AI 가 추천한 "${rawSubId}" 가 등록된 sub-industry 가 아니라 ${p.subIndustryId} 로 fallback 되었습니다. 직접 선택해주세요.`;
  } else if (validSubIndustries[catId] && !validSubIndustries[catId].includes(rawSubId)) {
    // sub-industry 가 카테고리와 안 맞는 경우 (예: industryCategoryId="food" 인데 subIndustryId="hair-salon")
    // → category 를 수정해야 하지만 정상 sub-industry 이므로 그대로 두고 _needsCategoryConfirm 플래그
    p._needsCategoryConfirm = true;
    p.matchingConfidence = Math.min(Number(p.matchingConfidence) || 0, 40);
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
      matchingReason: String(p.matchingReason ?? ""),
      matchingConfidence: Math.max(0, Math.min(100, Number(p.matchingConfidence) || 50)),
      alternativeSubIndustries: Array.isArray(p.alternativeSubIndustries)
        ? (p.alternativeSubIndustries as Array<Record<string, unknown>>)
            .map(a => ({ id: String(a.id ?? ""), reason: String(a.reason ?? "") }))
            .filter(a => allValid.includes(a.id))
            .slice(0, 3)
        : [],
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

    // ── 신규 확장 필드 (안전 fallback) ──
    identity: (() => {
      const id = (obj.identity as Record<string, unknown> | undefined) ?? {};
      return {
        suggestedStoreName: String(id.suggestedStoreName ?? ""),
        mission: String(id.mission ?? ""),
        targetCustomer: String(id.targetCustomer ?? ""),
        businessOpenTime: String(id.businessOpenTime ?? ""),
        businessCloseTime: String(id.businessCloseTime ?? ""),
      };
    })(),
    team: (() => {
      const t = (obj.team as Record<string, unknown> | undefined) ?? {};
      const rolesRaw = Array.isArray(t.roles) ? (t.roles as Array<Record<string, unknown>>) : [];
      return {
        initialSize: Math.max(1, Number(t.initialSize) || 1),
        roles: rolesRaw.map(r => ({
          role: String(r.role ?? ""),
          timing: r.timing === "later" ? "later" as const : "now" as const,
          reason: String(r.reason ?? ""),
        })),
      };
    })(),
    legal: (() => {
      const l = (obj.legal as Record<string, unknown> | undefined) ?? {};
      const validTaxTypes = ["simplified", "standard", "corporation"];
      const rawTaxType = String(l.taxType ?? "simplified");
      const permitsRaw = Array.isArray(l.permitsDetailed) ? (l.permitsDetailed as Array<Record<string, unknown>>) : [];
      const validKinds = ["신고", "허가", "등록", "면허"];
      return {
        taxType: (validTaxTypes.includes(rawTaxType) ? rawTaxType : "simplified") as "simplified" | "standard" | "corporation",
        taxTypeReason: String(l.taxTypeReason ?? ""),
        industryCode: String(l.industryCode ?? ""),
        fourInsuranceRequired: Boolean(l.fourInsuranceRequired),
        permitsDetailed: permitsRaw.map(p => ({
          name: String(p.name ?? ""),
          kind: validKinds.includes(String(p.kind)) ? String(p.kind) : "신고",
          where: String(p.where ?? ""),
          cost: String(p.cost ?? ""),
          duration: String(p.duration ?? ""),
          required: Boolean(p.required),
        })),
      };
    })(),
    insurance: Array.isArray(obj.insurance)
      ? (obj.insurance as Array<Record<string, unknown>>).map(ins => {
          const validTypes = ["fire", "general-liability", "workers-comp", "product-liability", "auto", "property", "professional", "cyber", "other"];
          const rawType = String(ins.type ?? "other");
          return {
            name: String(ins.name ?? ""),
            type: validTypes.includes(rawType) ? rawType : "other",
            required: Boolean(ins.required),
            annualPremiumEstimate: Number(ins.annualPremiumEstimate) || 0,
            reason: String(ins.reason ?? ""),
          };
        })
      : [],
    moneyInfra: (() => {
      const mi = (obj.moneyInfra as Record<string, unknown> | undefined) ?? {};
      const validBanks = ["ibk", "kakaobank", "woori", "shinhan", "kb", "hana", "nh", "kbank", "toss", "other"];
      const validPos = ["tossplace", "kis", "nice", "smartro", "kcp", "inicis", "kakaopay", "naverpay", "stripe", "other"];
      const validCpa = ["self", "cpa", "hybrid"];
      const rawBank = String(mi.recommendedBank ?? "ibk");
      const rawPos = String(mi.recommendedPos ?? "tossplace");
      const rawCpa = String(mi.cpaDecision ?? "self");
      return {
        recommendedBank: validBanks.includes(rawBank) ? rawBank : "ibk",
        recommendedBankReason: String(mi.recommendedBankReason ?? ""),
        recommendedPos: validPos.includes(rawPos) ? rawPos : "tossplace",
        recommendedPosReason: String(mi.recommendedPosReason ?? ""),
        cpaDecision: (validCpa.includes(rawCpa) ? rawCpa : "self") as "self" | "cpa" | "hybrid",
        cpaReason: String(mi.cpaReason ?? ""),
      };
    })(),
    fundingPrograms: Array.isArray(obj.fundingPrograms)
      ? (obj.fundingPrograms as Array<Record<string, unknown>>).map(fp => {
          const validKinds = ["preliminary-startup", "youth-startup", "venture-cert", "innobiz", "mainbiz", "rnd", "tips", "other"];
          const rawKind = String(fp.kind ?? "other");
          return {
            name: String(fp.name ?? ""),
            kind: (validKinds.includes(rawKind) ? rawKind : "other") as "preliminary-startup" | "youth-startup" | "venture-cert" | "innobiz" | "mainbiz" | "rnd" | "tips" | "other",
            eligibility: String(fp.eligibility ?? ""),
            amount: String(fp.amount ?? ""),
            deadline: fp.deadline ? String(fp.deadline) : undefined,
            fitScore: Math.max(0, Math.min(100, Number(fp.fitScore) || 0)),
          };
        })
      : [],
    industrySpecific: (() => {
      const isRaw = obj.industrySpecific as Record<string, unknown> | undefined;
      if (!isRaw) return undefined;
      const result: NonNullable<RoadmapGenerationResult["industrySpecific"]> = {};
      if (Array.isArray(isRaw.menu)) {
        result.menu = (isRaw.menu as Array<Record<string, unknown>>).map(m => ({
          name: String(m.name ?? ""), price: Number(m.price) || 0, reason: String(m.reason ?? ""),
        }));
      }
      if (Array.isArray(isRaw.services)) {
        result.services = (isRaw.services as Array<Record<string, unknown>>).map(s => ({
          name: String(s.name ?? ""), durationMin: Number(s.durationMin) || 0, price: Number(s.price) || 0,
        }));
      }
      if (Array.isArray(isRaw.memberships)) {
        result.memberships = (isRaw.memberships as Array<Record<string, unknown>>).map(m => ({
          name: String(m.name ?? ""), durationMonths: Number(m.durationMonths) || 0, price: Number(m.price) || 0,
        }));
      }
      if (Array.isArray(isRaw.products)) {
        result.products = (isRaw.products as Array<Record<string, unknown>>).map(p => ({
          name: String(p.name ?? ""), targetMargin: Number(p.targetMargin) || 0, reason: String(p.reason ?? ""),
        }));
      }
      if (Array.isArray(isRaw.coreAssets)) {
        result.coreAssets = (isRaw.coreAssets as Array<Record<string, unknown>>).map(a => ({
          name: String(a.name ?? ""),
          estimatedCost: Number(a.estimatedCost) || 0,
          priority: a.priority === "nice" ? "nice" as const : "must" as const,
        }));
      }
      return result;
    })(),
  };

  return result;
}

export async function generateRoadmap(
  input: RoadmapGenerationInput,
  options: AiCallOptions
): Promise<RoadmapGenerationResult> {
  const client = createAiClient(options.apiKey); // 120초 — 프롬프트 축소 후에도 여유 확보

  // SDK 0.39 가 thinking 파라미터를 타입에 명시하지 않아 input cast 필요.
  // 응답은 단일 Message 타입으로 cast 하여 후속 .content/.usage 사용.
  // ⚠️ Anthropic 제약: extended thinking + forced tool_choice 동시 사용 불가
  //    → schema 강제(forced tool_choice)를 우선 (응답 형식 안정성이 추론 품질보다 중요).
  //    추론은 system prompt 의 명확한 가이드라인 + 풍부한 예시로 보강.
  const rawResponse = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    // ✦ Prompt Caching (1h TTL) — system prompt 1700+ tokens 가 시간대별 안정 재사용
    system: systemWithCache(ROADMAP_GENERATION_SYSTEM_PROMPT, "1h"),
    // ✦ Tool Use — 99.8% schema 준수율 (vs JSON parsing의 환각·필드 누락 risk)
    tools: [ROADMAP_TOOL],
    tool_choice: { type: "tool", name: "submit_roadmap" },
    messages: [
      { role: "user", content: buildRoadmapGenerationPrompt(input) },
    ],
  } as Parameters<typeof client.messages.create>[0]);
  const response = rawResponse as {
    content: Array<{ type: string; text?: string; input?: Record<string, unknown>; [k: string]: unknown }>;
    stop_reason: string | null;
    usage: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number };
  };

  const usage = response.usage;
  console.log(
    "[roadmap/generate] stop_reason:", response.stop_reason,
    "content types:", response.content.map(c => c.type).join(", "),
    "cache_read:", usage?.cache_read_input_tokens ?? 0,
    "cache_create:", usage?.cache_creation_input_tokens ?? 0,
    "input:", usage?.input_tokens ?? 0,
    "output:", usage?.output_tokens ?? 0,
  );

  if (response.stop_reason === "max_tokens") {
    // tool_use input 의 후반 필드 (suppliers, interior, fundingPrograms 등) 가 잘렸을 가능성 큼.
    // schema 강제로 인해 일부 required 필드도 누락될 수 있음.
    console.warn(
      "[roadmap/generate] ⚠️ max_tokens 도달 — 응답 잘림. " +
      `output_tokens=${usage?.output_tokens ?? 0}. DEFAULT_MAX_TOKENS 추가 인상 필요할 수 있음.`,
    );
  }

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
  const tx = textBlock.text ?? "";
  console.log("[roadmap/generate] Fallback to text block, length:", tx.length);
  return parseResponse(tx);
}
