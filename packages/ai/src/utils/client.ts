/**
 * LLM Adapter — Anthropic SDK 호환 shape 으로 OpenAI 호출.
 *
 *  ── 배경 (2026-05-11) ────────────────────────────────────────
 *  Anthropic 결제 잔액 부족으로 모든 호출 실패. OpenAI gpt-5.4-mini 로 전면 마이그레이션.
 *  · 가격 4× 저렴 ($0.75/$4.50 vs $3.00/$15.00 per 1M)
 *  · 성능 89-93% (충분), web_search 는 외부 grounding(Tavily) 으로 대체
 *  · 기존 호출 패턴 (client.messages.create) 그대로 유지 → 파일별 변경 최소화
 *  ────────────────────────────────────────────────────────────
 */

import OpenAI from "openai";

const DEFAULT_TIMEOUT_MS = 30_000;
const LONG_TIMEOUT_MS = 60_000;

// 기존 코드의 model 이름을 OpenAI 로 매핑.
// 새 호출처는 직접 "gpt-5.4-mini" 등을 써도 됨.
const MODEL_MAP: Record<string, string> = {
  "claude-sonnet-4-6":            "gpt-5.4-mini",
  "claude-sonnet-4-5-20250929":   "gpt-5.4-mini",
  "claude-haiku-4-5-20251001":    "gpt-5.4-mini",
  "claude-opus-4-7":              "gpt-5.4-mini",   // 비용 절감 — opus 도 mini 로
};

/**
 * Web search 활성 모델 — `tools: [{type: "web_search...."}]` 요청 시 자동 라우팅.
 *  gpt-5.4-mini + Responses API + 내장 web_search tool 사용.
 *  · 일반 호출과 동일 모델 → 출력 톤·품질 일관성
 *  · Responses API 가 자동으로 검색 + citation 첨부
 *  · 가격: 토큰 $0.75/$4.50 + search tool 호출당 별도 (OpenAI pricing 참조)
 */
const WEB_SEARCH_MODEL = "gpt-5.4-mini";

/** tools 배열에 web_search 관련 도구가 있는지 휴리스틱 감지 */
function hasWebSearchTool(tools: unknown[] | undefined): boolean {
  if (!Array.isArray(tools)) return false;
  for (const t of tools) {
    if (!t || typeof t !== "object") continue;
    const obj = t as Record<string, unknown>;
    const type = typeof obj.type === "string" ? obj.type.toLowerCase() : "";
    const name = typeof obj.name === "string" ? obj.name.toLowerCase() : "";
    if (type.includes("web_search") || name.includes("web_search")) return true;
  }
  return false;
}

// ── Anthropic SDK 호환 타입 (사용 부분만 최소) ────────────────────
type ATextBlock = { type: "text"; text: string };
type AToolUseBlock = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };
type AContentBlock = ATextBlock | AToolUseBlock;
type AMessage = {
  role: "user" | "assistant";
  content: string | AContentBlock[];
};
type ASystemBlock = {
  type: "text";
  text: string;
  cache_control?: unknown;
};
type AToolChoice =
  | { type: "auto" }
  | { type: "any" }
  | { type: "tool"; name: string };
type AMessagesCreateRequest = {
  model: string;
  max_tokens: number;
  system?: string | ASystemBlock[];
  messages: AMessage[];
  // Anthropic web_search/tools — OpenAI Chat Completions 미지원이므로 조용히 무시.
  tools?: unknown[];
  tool_choice?: AToolChoice;
  temperature?: number;
  top_p?: number;
  metadata?: unknown;
};
type AMessagesCreateResponse = {
  content: AContentBlock[];
  stop_reason: string | null;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    // Anthropic prompt caching 메트릭 — OpenAI 는 노출 안 함 → 항상 undefined.
    //  호출처 호환을 위해 옵셔널 필드 유지.
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
};

/**
 * Anthropic tools/tool_choice → OpenAI Chat Completions function calling 변환.
 *  Anthropic: `{name, description, input_schema}` + `tool_choice: {type:"tool", name}`
 *  OpenAI:    `{type:"function", function:{name, description, parameters}}` + `tool_choice: {type:"function", function:{name}}`
 *
 * web_search 형 tool 은 별도 분기에서 처리하므로 여기서는 일반 function tool 만.
 */
function convertToolsToOpenAI(tools: unknown[] | undefined): unknown[] | undefined {
  if (!Array.isArray(tools) || tools.length === 0) return undefined;
  const out: unknown[] = [];
  for (const t of tools) {
    if (!t || typeof t !== "object") continue;
    const obj = t as Record<string, unknown>;
    const type = typeof obj.type === "string" ? obj.type.toLowerCase() : "";
    if (type.includes("web_search")) continue;          // 별도 분기
    if (type === "function" && obj.function) {           // 이미 OpenAI 형식
      out.push(obj);
      continue;
    }
    const name = typeof obj.name === "string" ? obj.name : "";
    if (!name) continue;
    out.push({
      type: "function",
      function: {
        name,
        description: typeof obj.description === "string" ? obj.description : undefined,
        parameters: (obj.input_schema as Record<string, unknown> | undefined) ?? { type: "object", properties: {} },
      },
    });
  }
  return out.length ? out : undefined;
}

function convertToolChoiceToOpenAI(tc: AToolChoice | undefined): unknown {
  if (!tc) return undefined;
  if (tc.type === "auto") return "auto";
  if (tc.type === "any")  return "required";
  if (tc.type === "tool") return { type: "function", function: { name: tc.name } };
  return undefined;
}

function flattenContent(content: string | AContentBlock[]): string {
  if (typeof content === "string") return content;
  return content
    .map((c) => (c.type === "text" ? c.text : `[tool_use:${c.name}]`))
    .join("\n");
}

function flattenSystem(system?: string | ASystemBlock[]): string {
  if (!system) return "";
  if (typeof system === "string") return system;
  return system.map((s) => s.text).join("\n\n");
}

/**
 * Anthropic SDK 호환 client. 내부는 OpenAI Chat Completions.
 *  - `client.messages.create({...})` 시그니처 유지.
 *  - `model: "claude-*"` 자동 매핑.
 *  - `tools: [web_search]` 등은 무시 (외부 grounding 사용).
 *  - `system` 이 cache_control 배열이어도 flatten.
 */
class LlmClient {
  private readonly openai: OpenAI;
  constructor(apiKey: string, options: { timeout?: number } = {}) {
    this.openai = new OpenAI({
      apiKey,
      timeout: options.timeout ?? DEFAULT_TIMEOUT_MS,
    });
  }

  /**
   * Anthropic-shape streaming wrapper.
   *  사용자: `for await (const event of client.messages.stream({...}))` 패턴 그대로.
   *  각 chunk 가 `{ type: "content_block_delta", delta: { type: "text_delta", text: "..." } }` 형태.
   */
  private async *streamAsAnthropicEvents(
    req: AMessagesCreateRequest,
  ): AsyncGenerator<{ type: string; delta?: { type: string; text: string } }> {
    const mappedModel = MODEL_MAP[req.model] ?? req.model;
    const oaiMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
    const systemText = flattenSystem(req.system);
    if (systemText) oaiMessages.push({ role: "system", content: systemText });
    for (const m of req.messages) {
      oaiMessages.push({ role: m.role, content: flattenContent(m.content) });
    }
    const stream = await this.openai.chat.completions.create({
      model: mappedModel,
      max_completion_tokens: req.max_tokens,
      messages: oaiMessages,
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta.length > 0) {
        yield { type: "content_block_delta", delta: { type: "text_delta", text: delta } };
      }
    }
  }

  messages = {
    create: async (req: AMessagesCreateRequest): Promise<AMessagesCreateResponse> => {
      // tools 에 web_search 가 있으면 Responses API 경로로 분기 (2026-05-11)
      const wantSearch = hasWebSearchTool(req.tools);
      const systemText = flattenSystem(req.system);

      // ─── 분기 1: Responses API + web_search ─────────────────────
      if (wantSearch) {
        // system + messages 를 단일 input 으로 합침 (Responses API 호환 형식).
        //  system 은 검색·생성 가이드라인 prefix 로, messages 는 대화 history.
        const parts: string[] = [];
        if (systemText) parts.push(`[SYSTEM]\n${systemText}`);
        for (const m of req.messages) {
          const tag = m.role === "user" ? "USER" : "ASSISTANT";
          parts.push(`[${tag}]\n${flattenContent(m.content)}`);
        }
        const inputText = parts.join("\n\n");

        const r = await (this.openai as unknown as {
          responses: {
            create: (p: Record<string, unknown>) => Promise<{
              status?: string;
              output_text?: string;
              usage?: { input_tokens?: number; output_tokens?: number };
            }>;
          };
        }).responses.create({
          model: WEB_SEARCH_MODEL,
          tools: [{ type: "web_search" }],
          input: inputText,
          max_output_tokens: req.max_tokens,
        });

        return {
          content: [{ type: "text", text: r.output_text ?? "" }],
          stop_reason: r.status === "completed" ? "end_turn" : (r.status ?? null),
          model: WEB_SEARCH_MODEL,
          usage: {
            input_tokens: r.usage?.input_tokens ?? 0,
            output_tokens: r.usage?.output_tokens ?? 0,
          },
        };
      }

      // ─── 분기 2: 일반 Chat Completions ────────────────────────
      const mappedModel = MODEL_MAP[req.model] ?? req.model;
      const oaiMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
      if (systemText) oaiMessages.push({ role: "system", content: systemText });
      for (const m of req.messages) {
        oaiMessages.push({ role: m.role, content: flattenContent(m.content) });
      }

      const baseParams: Record<string, unknown> = {
        model: mappedModel,
        max_completion_tokens: req.max_tokens,
        messages: oaiMessages,
      };
      if (req.temperature !== undefined) baseParams.temperature = req.temperature;
      if (req.top_p !== undefined) baseParams.top_p = req.top_p;

      // Anthropic tools / tool_choice → OpenAI function calling 변환.
      //  로드맵 생성처럼 schema-strict 출력을 강제하는 호출처는 이 경로를 거쳐
      //  tool_use 블록을 반환받음. 호출처는 기존 Anthropic 패턴 그대로.
      const oaiTools = convertToolsToOpenAI(req.tools);
      const oaiToolChoice = convertToolChoiceToOpenAI(req.tool_choice);
      if (oaiTools) baseParams.tools = oaiTools;
      if (oaiToolChoice !== undefined) baseParams.tool_choice = oaiToolChoice;

      const response = await this.openai.chat.completions.create(baseParams as never);
      const choice = response.choices[0];
      const finish = choice?.finish_reason ?? null;

      // tool_calls 우선 처리 — schema-강제 호출 시 모델이 function arguments 를 반환
      const toolCalls = (choice?.message as { tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }> } | undefined)?.tool_calls;
      const contentBlocks: AContentBlock[] = [];
      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        for (const tc of toolCalls) {
          if (tc.type !== "function") continue;
          let input: Record<string, unknown> = {};
          try {
            input = JSON.parse(tc.function.arguments);
          } catch {
            input = { __raw: tc.function.arguments };
          }
          contentBlocks.push({ type: "tool_use", id: tc.id, name: tc.function.name, input });
        }
      }
      const text = choice?.message?.content ?? "";
      if (text) contentBlocks.push({ type: "text", text });

      // OpenAI finish_reason → Anthropic stop_reason 근사 매핑
      const stop_reason =
        contentBlocks.some((b) => b.type === "tool_use") ? "tool_use"
        : finish === "stop" ? "end_turn"
        : finish === "length" ? "max_tokens"
        : finish === "content_filter" ? "stop_sequence"
        : finish;

      return {
        content: contentBlocks.length ? contentBlocks : [{ type: "text", text: "" }],
        stop_reason,
        model: mappedModel,
        usage: {
          input_tokens: response.usage?.prompt_tokens ?? 0,
          output_tokens: response.usage?.completion_tokens ?? 0,
        },
      };
    },
    stream: (req: AMessagesCreateRequest) => this.streamAsAnthropicEvents(req),
  };
}

export function createAiClient(apiKey: string): LlmClient {
  return new LlmClient(apiKey, { timeout: DEFAULT_TIMEOUT_MS });
}

export function createLongAiClient(apiKey: string): LlmClient {
  return new LlmClient(apiKey, { timeout: LONG_TIMEOUT_MS });
}

/**
 * 호환용 — Anthropic 의 systemWithCache 와 같은 시그니처.
 *  OpenAI 는 자동 prompt caching 이라 cache_control 메타 무시. text 만 보존.
 *  기존 호출처가 `system: systemWithCache(LONG_PROMPT)` 형태인 케이스 호환.
 */
export function systemWithCache(
  text: string,
  _ttl: "5m" | "1h" = "5m",
): Array<{ type: "text"; text: string }> {
  return [{ type: "text", text }];
}

export { DEFAULT_TIMEOUT_MS, LONG_TIMEOUT_MS };
export type { LlmClient };
