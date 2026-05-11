import { createAiClient } from "../utils/client";
import { AiParseError } from "../types/ai";
import type { AiCallOptions } from "../types/ai";
import { systemWithCache } from "../utils/client";
import {
  PROGRAM_MATCHING_SYSTEM_PROMPT,
  buildProgramMatchingUserPrompt,
} from "./prompt";
import type {
  ProgramMatchingContext,
  ProgramMatchingResult,
  ProgramRecommendation,
} from "./prompt";

// ─── 상수 ────────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 2048;

// ─── 결정론적 적격성 필터 ────────────────────────────────────────────────────
// AI 호출 전에 명확히 부적격인 프로그램을 제거합니다.

type EligibilityInput = {
  id: string;
  name: { ko: string; en: string };
  category: string;
  organizer: { ko: string; en: string };
  target: { ko: string; en: string };
  benefit: { ko: string; en: string };
  amount?: string;
  applicationStatus?: string;
  maxAge?: number;
  businessYearRange?: [number, number];
  industries?: string[];
  regions?: string[];
  forSmallBiz: boolean;
  forFranchise: boolean;
};

type UserProfile = ProgramMatchingContext["userProfile"];

export type EligibilityResult = {
  program: EligibilityInput;
  eligible: boolean;
  reasons: string[];
  ineligibleReasons: string[];
};

export function checkEligibility(
  program: EligibilityInput,
  profile: UserProfile
): EligibilityResult {
  const reasons: string[] = [];
  const ineligibleReasons: string[] = [];

  // Age check
  if (program.maxAge != null && profile.age != null) {
    if (profile.age > program.maxAge) {
      ineligibleReasons.push(`나이 제한 초과 (만 ${program.maxAge}세 이하)`);
    } else {
      reasons.push("나이 조건 충족");
    }
  }

  // Business year check
  if (program.businessYearRange && profile.businessYears != null) {
    const [min, max] = program.businessYearRange;
    if (profile.businessYears < min || profile.businessYears > max) {
      ineligibleReasons.push(`사업 연차 범위 불일치 (${min}~${max}년 요구)`);
    } else {
      reasons.push("사업 연차 조건 충족");
    }
  }

  // Region check
  if (program.regions && program.regions.length > 0 && profile.region) {
    if (!program.regions.some((r) => profile.region!.includes(r))) {
      ineligibleReasons.push(`지역 제한 (${program.regions.join(", ")} 한정)`);
    } else {
      reasons.push("지역 조건 충족");
    }
  }

  // Industry check
  if (program.industries && program.industries.length > 0 && profile.industryId) {
    if (program.industries.includes(profile.industryId)) {
      reasons.push("업종 조건 충족");
    }
  }

  // SmallBiz / franchise relevance
  if (program.forSmallBiz) reasons.push("소상공인 대상");
  if (program.forFranchise && profile.startupType === "franchise") {
    reasons.push("프랜차이즈 창업 해당");
  }

  return {
    program,
    eligible: ineligibleReasons.length === 0,
    reasons,
    ineligibleReasons,
  };
}

// ─── 응답 파싱 ──────────────────────────────────────────────────────────────

function parseMatchingResponse(raw: string): ProgramMatchingResult {
  const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AiParseError("프로그램 매칭 응답이 유효한 JSON이 아닙니다.", raw);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AiParseError("프로그램 매칭 응답이 객체 형태가 아닙니다.", raw);
  }

  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj.recommendations)) {
    throw new AiParseError("recommendations 필드가 배열이 아닙니다.", raw);
  }

  const recommendations: ProgramRecommendation[] = (obj.recommendations as unknown[]).map(
    (item, i) => {
      if (typeof item !== "object" || item === null) {
        throw new AiParseError(`recommendations[${i}]가 객체가 아닙니다.`, raw);
      }
      const rec = item as Record<string, unknown>;
      const validPriorities = ["must_apply", "recommended", "consider"];
      return {
        programId: String(rec.programId ?? ""),
        fitScore: Math.max(0, Math.min(100, Number(rec.fitScore) || 0)),
        fitReason: String(rec.fitReason ?? ""),
        applicationTip: String(rec.applicationTip ?? ""),
        priority: validPriorities.includes(String(rec.priority))
          ? (rec.priority as ProgramRecommendation["priority"])
          : "consider",
      };
    }
  );

  return {
    recommendations,
    strategy: String(obj.strategy ?? ""),
    timeline: String(obj.timeline ?? ""),
  };
}

// ─── 메인 함수 ──────────────────────────────────────────────────────────────
// 1. 결정론적 적격성 필터 → 2. AI 순위·설명 생성

export async function matchPrograms(
  programs: EligibilityInput[],
  userProfile: UserProfile,
  options: AiCallOptions
): Promise<{ eligibility: EligibilityResult[]; aiResult: ProgramMatchingResult }> {
  // Step 1: deterministic eligibility
  const eligibility = programs.map((p) => checkEligibility(p, userProfile));
  const eligiblePrograms = eligibility
    .filter((e) => e.eligible)
    .map((e) => e.program);

  if (eligiblePrograms.length === 0) {
    return {
      eligibility,
      aiResult: {
        recommendations: [],
        strategy: "현재 프로필에 적합한 프로그램이 없습니다. 프로필 정보를 다시 확인해 주세요.",
        timeline: "",
      },
    };
  }

  // Step 2: AI ranking (top 20 eligible programs only to avoid prompt bloat)
  const topEligible = eligiblePrograms.slice(0, 20);
  const context: ProgramMatchingContext = {
    userProfile,
    eligiblePrograms: topEligible.map((p) => ({
      id: p.id,
      name: p.name.ko,
      category: p.category,
      organizer: p.organizer.ko,
      target: p.target.ko,
      benefit: p.benefit.ko,
      amount: p.amount,
      applicationStatus: p.applicationStatus,
    })),
  };

  const client = createAiClient(options.apiKey);
  const userMessage = buildProgramMatchingUserPrompt(context);

  const message = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    // ✦ Prompt Caching — program 매칭 system prompt 안정 재사용
    system: systemWithCache(PROGRAM_MATCHING_SYSTEM_PROMPT),
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AiParseError(
      "AI 응답에 텍스트 블록이 없습니다.",
      JSON.stringify(message.content)
    );
  }

  const aiResult = parseMatchingResponse(textBlock.text);
  return { eligibility, aiResult };
}
