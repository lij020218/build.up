import Anthropic from "@anthropic-ai/sdk";
import { AiParseError } from "../types/ai";
import type { AiCallOptions } from "../types/ai";
import { DASHBOARD_ACTION_SYSTEM_PROMPT, buildDashboardActionPrompt } from "./prompt";
import type { DashboardContext } from "./prompt";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 1024;

export type DashboardAction = {
  title: string;
  reason: string;
  priority: "high" | "medium";
};

export type CrisisAction = {
  title: string;
  impact: string;
  difficulty: "easy" | "medium" | "hard";
};

export type DashboardActionsResponse = {
  todayActions: DashboardAction[];
  crisisActions: CrisisAction[];
  insight: string;
};

function parseResponse(raw: string): DashboardActionsResponse {
  const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        throw new AiParseError("AI 응답이 유효한 JSON이 아닙니다.", raw);
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

  const todayActions = (obj.todayActions as Record<string, unknown>[])
    .filter(a => typeof a.title === "string" && typeof a.reason === "string")
    .slice(0, 3)
    .map(a => ({
      title: (a.title as string).trim(),
      reason: (a.reason as string).trim(),
      priority: (a.priority === "high" ? "high" : "medium") as "high" | "medium",
    }));

  const crisisActions = Array.isArray(obj.crisisActions)
    ? (obj.crisisActions as Record<string, unknown>[])
        .filter(a => typeof a.title === "string" && typeof a.impact === "string")
        .slice(0, 3)
        .map(a => ({
          title: (a.title as string).trim(),
          impact: (a.impact as string).trim(),
          difficulty: (["easy", "medium", "hard"].includes(a.difficulty as string) ? a.difficulty : "medium") as "easy" | "medium" | "hard",
        }))
    : [];

  return {
    todayActions,
    crisisActions,
    insight: typeof obj.insight === "string" ? obj.insight.trim() : "",
  };
}

export async function generateDashboardActions(
  ctx: DashboardContext,
  options: AiCallOptions
): Promise<DashboardActionsResponse> {
  const client = new Anthropic({ apiKey: options.apiKey, timeout: 30_000 });

  const response = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    system: DASHBOARD_ACTION_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: buildDashboardActionPrompt(ctx) },
    ],
  });

  const content = response.content[0];
  if (!content || content.type !== "text") {
    throw new AiParseError("AI 응답에 텍스트가 없습니다.", JSON.stringify(response.content));
  }

  return parseResponse(content.text);
}
