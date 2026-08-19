import { createAiClient } from "../utils/client";
import { isValidFeatureId } from "@foundone/shared";
import { AiParseError } from "../types/ai";
import type { AiCallOptions } from "../types/ai";
import { systemWithCache } from "../utils/client";
import { DASHBOARD_ACTION_SYSTEM_PROMPT, buildDashboardActionPrompt } from "./prompt";
import type { DashboardContext } from "./prompt";
import { parseLlmJson } from "../utils/parse-json";
import type { ResponseSchema } from "../utils/structured-output";

const DEFAULT_MODEL = "gpt-5.4-mini";   // 실제 실행 모델 (2026-08-03 이름 정직화 — 종전 claude-* 표기는 MODEL_MAP 거쳐 동일 모델)
// 1024 → 1536 → 2048: insight 4단계 서사 + 액션별 정량 ROI(estimatedImpactWon) +
//   전일 제안 후속(previousAction follow-up) 으로 출력이 늘어 토큰 여유 확대.
const DEFAULT_MAX_TOKENS = 2048;
// ✦ 낮은 분산(temperature 0.3): 매일 아침 같은 데이터 → 일관된 코칭.
//   GPT 인사이트 라우트는 이미 0.4. claude-sonnet-4-6 은 temperature 지원(Opus 4.7+ 만 제거됨).
//   0.3 미만은 장문(>2000토큰)에서 반복 위험이라 0.3 채택. 강건 JSON 파서는 그대로 유지.
const DEFAULT_TEMPERATURE = 0.3;

/**
 * AI 가 K-히트 사례를 인용했을 때 함께 넘기는 메타데이터.
 * UI 에서 [사례:성심당] 같은 배지로 노출되어, 사장님이 "이 조언이 어디서 왔는지" 즉시 확인 가능.
 */
export type ReferencedCase = {
  /** k-hit-cases.ts 의 KHitCase.id (예: "sungsimdang") */
  id: string;
  /** 표시용 이름 (예: "성심당") — UI 배지 라벨 */
  name: string;
};

/**
 * AI 의 판단 근거 — 사장님이 "왜 이렇게 추천했지?" 펼쳐볼 때 노출되는 데이터 포인트.
 * 각 항목은 짧은 한 문장 (50자 내외) 으로 "어떤 숫자/패턴을 봤는지" 설명.
 * 예) "이번 주 매출 ${formatWon(salesThisWeek)} (지난 주 대비 -18%)"
 *     "재료비 비율 42% — 동일 업종 평균 32% 초과"
 *     "월말까지 13일, 누적 적자 280만원 추세"
 * AI 환각 방지용: prompt 에서 "ctx 에 실제로 존재하는 숫자만 인용" 강제.
 */
export type ActionEvidence = {
  /** 짧은 한 문장 — 데이터 포인트 (숫자·기간·비교 포함) */
  text: string;
};

export type DashboardAction = {
  title: string;
  reason: string;
  priority: "high" | "medium";
  /** AI 가 이 액션의 reason 에서 K-히트 사례를 인용했을 때 함께 넘김 */
  referencedCase?: ReferencedCase;
  /**
   * AI 가 이 액션을 실행하기 위해 사장님께 추천하는 Found.One 기능 ID.
   * features-catalog.ts 의 ID 와 일치해야 함 (parseResponse 에서 검증).
   * UI 에서 "→ [기능 이름] 보러 가기" CTA 배지로 노출 → 클릭 시 해당 surface 로 navigate.
   */
  feature?: string;
  /**
   * AI 가 이 액션을 추천한 근거 — 데이터 포인트 1~3 개.
   * UI 에서 "왜 이렇게 판단?" 펼침으로 노출 → 신뢰도 표시.
   */
  evidence?: ActionEvidence[];
  /**
   * 이 액션의 예상 효과 (원). 정량화 가능할 때만 — 컨텍스트 숫자로 계산되는 경우.
   *   예) "객단가 +1,200원 × 일 80명 × 26일 ≈ +250만원/월" → 2_500_000.
   * UI 에서 "예상 +250만원" 배지로 노출. 데이터 없으면 생략(거짓 추정 금지).
   */
  estimatedImpactWon?: number;
};

export type CrisisAction = {
  title: string;
  impact: string;
  difficulty: "easy" | "medium" | "hard";
  referencedCase?: ReferencedCase;
  /** todayActions 와 동일 — 위기 상황에서 사장님이 즉시 사용할 수 있는 Found.One 기능. */
  feature?: string;
  /** 위기 판단 근거 — 데이터 포인트 1~3 개. */
  evidence?: ActionEvidence[];
};

export type DashboardActionsResponse = {
  todayActions: DashboardAction[];
  crisisActions: CrisisAction[];
  insight: string;
  /** insight 에서 인용한 사례 — 있으면 insight 옆에 [사례:XX] 배지 노출 */
  insightReferencedCase?: ReferencedCase;
};

// ── Structured Outputs 스키마 — DashboardActionsResponse 1:1 (선택 필드 = null 유니온, 파서가 undefined 로 정규화) ──
const REFERENCED_CASE_SCHEMA = {
  type: ["object", "null"],
  additionalProperties: false,
  required: ["id", "name"],
  properties: { id: { type: "string" }, name: { type: "string" } },
};
const EVIDENCE_SCHEMA = { type: ["array", "null"], items: { type: "string" } };
export const DASHBOARD_ACTIONS_RESPONSE_SCHEMA: ResponseSchema = {
  name: "dashboard_actions",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["todayActions", "crisisActions", "insight", "insightReferencedCase"],
    properties: {
      todayActions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "reason", "priority", "confidence", "referencedCase", "feature", "evidence", "estimatedImpactWon"],
          properties: {
            title: { type: "string" },
            reason: { type: "string" },
            priority: { type: "string", enum: ["high", "medium"] },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            referencedCase: REFERENCED_CASE_SCHEMA,
            feature: { type: ["string", "null"] },
            evidence: EVIDENCE_SCHEMA,
            estimatedImpactWon: { type: ["number", "null"] },
          },
        },
      },
      crisisActions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "impact", "difficulty", "confidence", "referencedCase", "feature", "evidence"],
          properties: {
            title: { type: "string" },
            impact: { type: "string" },
            difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            referencedCase: REFERENCED_CASE_SCHEMA,
            feature: { type: ["string", "null"] },
            evidence: EVIDENCE_SCHEMA,
          },
        },
      },
      insight: { type: "string" },
      insightReferencedCase: REFERENCED_CASE_SCHEMA,
    },
  },
};

/**
 * 잘린 JSON 복구 — Claude max_tokens 도달로 응답이 끊긴 경우 닫히지 않은 {[" 추적해 보충.
 * 100% 안전한 복구는 아니지만 todayActions 같은 부분 데이터는 살릴 수 있음.
 */
function repairTruncatedJson(s: string): string | null {
  // 마지막 valid 위치까지 최대한 자르고 닫힘 보충
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let lastValidEnd = -1;
  const stack: Array<"object" | "array"> = [];

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === "\\") { escapeNext = true; continue; }
    if (ch === '"' && !escapeNext) inString = !inString;
    if (inString) continue;
    if (ch === "{") { stack.push("object"); depth++; }
    else if (ch === "[") { stack.push("array"); depth++; }
    else if (ch === "}" || ch === "]") { stack.pop(); depth--; if (depth === 0) lastValidEnd = i; }
  }

  // 이미 균형 잡혀있으면 원본 반환 (이론상 caller 가 이미 시도했을 것)
  if (depth === 0) return s;

  // 잘린 케이스: 마지막 valid array/object 까지 잘라낸 뒤 stack 닫기
  let truncated = lastValidEnd >= 0 ? s.slice(0, lastValidEnd + 1) : s;

  // 만약 valid end가 없다면 string 안일 수도 있음 → 마지막 따옴표 위치 찾기
  if (lastValidEnd < 0) {
    // string 닫기 + 모든 stack 닫기
    if (inString) truncated += '"';
    while (stack.length > 0) {
      truncated += stack.pop() === "object" ? "}" : "]";
    }
    return truncated;
  }
  return truncated;
}

function parseResponse(raw: string): DashboardActionsResponse {
  const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  let parsed: unknown;
  try {
    // Structured Outputs 로 문법은 보장 — parseLlmJson(4단계 복구) 은 안전망, 아래 로컬 복구는 최후 수단
    parsed = parseLlmJson(cleaned);
  } catch {
    // 1단계 fallback: greedy 매칭으로 첫 {부터 마지막 } 까지 추출
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        // 2단계 fallback: 잘린 JSON 복구 시도
        //   max_tokens 도달로 끊긴 응답 → 닫히지 않은 { [ " 보충하면 일부라도 살릴 수 있음
        const repaired = repairTruncatedJson(match[0]);
        if (repaired) {
          try {
            parsed = JSON.parse(repaired);
          } catch {
            throw new AiParseError("AI 응답이 유효한 JSON이 아닙니다.", raw);
          }
        } else {
          throw new AiParseError("AI 응답이 유효한 JSON이 아닙니다.", raw);
        }
      }
    } else {
      throw new AiParseError("AI 응답이 유효한 JSON이 아닙니다.", raw);
    }
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AiParseError("AI 응답이 객체 형태가 아닙니다.", raw);
  }

  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj.todayActions)) {
    throw new AiParseError("todayActions 필드가 배열이 아닙니다.", raw);
  }

  // referencedCase 추출 헬퍼 — { id, name } 두 필드 모두 string 일 때만 통과
  const parseRefCase = (v: unknown): ReferencedCase | undefined => {
    if (!v || typeof v !== "object") return undefined;
    const o = v as Record<string, unknown>;
    if (typeof o.id !== "string" || typeof o.name !== "string") return undefined;
    const id = o.id.trim();
    const name = o.name.trim();
    if (!id || !name) return undefined;
    return { id, name };
  };

  // feature ID 검증 헬퍼 — 카탈로그에 등록된 ID 만 통과 (가짜 ID 자동 제거)
  const parseFeature = (v: unknown): string | undefined =>
    isValidFeatureId(v) ? v : undefined;

  // evidence 추출 — 배열의 string 또는 { text } 객체를 ActionEvidence[] 로 정규화.
  // 각 항목 5~80자 길이 가드 + 최대 3개 제한 (UI 과부하 방지).
  const parseEvidence = (v: unknown): ActionEvidence[] | undefined => {
    if (!Array.isArray(v)) return undefined;
    const items: ActionEvidence[] = v
      .map((raw): ActionEvidence | null => {
        if (typeof raw === "string") {
          const t = raw.trim();
          return t.length >= 5 && t.length <= 120 ? { text: t } : null;
        }
        if (raw && typeof raw === "object") {
          const t = (raw as Record<string, unknown>).text;
          if (typeof t === "string") {
            const trimmed = t.trim();
            return trimmed.length >= 5 && trimmed.length <= 120 ? { text: trimmed } : null;
          }
        }
        return null;
      })
      .filter((x): x is ActionEvidence => x !== null)
      .slice(0, 3);
    return items.length > 0 ? items : undefined;
  };

  const todayActions = (obj.todayActions as Record<string, unknown>[])
    .filter(a => typeof a.title === "string" && typeof a.reason === "string")
    .slice(0, 3)
    .map(a => ({
      title: (a.title as string).trim(),
      reason: (a.reason as string).trim(),
      priority: (a.priority === "high" ? "high" : "medium") as "high" | "medium",
      referencedCase: parseRefCase(a.referencedCase),
      feature: parseFeature(a.feature),
      evidence: parseEvidence(a.evidence),
      estimatedImpactWon: typeof a.estimatedImpactWon === "number" && a.estimatedImpactWon > 0
        ? Math.round(a.estimatedImpactWon)
        : undefined,
    }));

  const crisisActions = Array.isArray(obj.crisisActions)
    ? (obj.crisisActions as Record<string, unknown>[])
        .filter(a => typeof a.title === "string" && typeof a.impact === "string")
        .slice(0, 3)
        .map(a => ({
          title: (a.title as string).trim(),
          impact: (a.impact as string).trim(),
          difficulty: (["easy", "medium", "hard"].includes(a.difficulty as string) ? a.difficulty : "medium") as "easy" | "medium" | "hard",
          referencedCase: parseRefCase(a.referencedCase),
          feature: parseFeature(a.feature),
          evidence: parseEvidence(a.evidence),
        }))
    : [];

  return {
    todayActions,
    crisisActions,
    insight: typeof obj.insight === "string" ? obj.insight.trim() : "",
    insightReferencedCase: parseRefCase(obj.insightReferencedCase),
  };
}

export async function generateDashboardActions(
  ctx: DashboardContext,
  options: AiCallOptions
): Promise<DashboardActionsResponse> {
  const client = createAiClient(options.apiKey);

  const response = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: DEFAULT_TEMPERATURE,
    // ✦ Prompt Caching (5m TTL) — 같은 사용자가 짧은 시간 내 여러 번 요청 (대시보드 진입·refresh)
    system: systemWithCache(DASHBOARD_ACTION_SYSTEM_PROMPT),
    messages: [
      // 자가개선: 최근 "안 맞아요" 블록을 user prompt 끝에 붙여 비슷한 코칭 회피.
      { role: "user", content: buildDashboardActionPrompt(ctx) + (options.negativeFeedbackBlock ?? "") + (options.behaviorBlock ?? "") },
    ],
    response_schema: DASHBOARD_ACTIONS_RESPONSE_SCHEMA,
  });

  const content = response.content.find((c) => c.type === "text") ?? response.content[0];
  if (!content || content.type !== "text") {
    throw new AiParseError("AI 응답에 텍스트가 없습니다.", JSON.stringify(response.content));
  }

  return parseResponse(content.text);
}
