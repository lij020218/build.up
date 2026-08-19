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
import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_TIMEOUT_MS = 30_000;
const LONG_TIMEOUT_MS = 60_000;

// 기존 코드의 model 이름을 OpenAI 로 매핑.
// 2026-08-03: 모든 호출처가 실제 모델명을 쓰도록 정직화 완료 — 이 맵은 놓친 호출·구버전 안전망으로만 유지.
const MODEL_MAP: Record<string, string> = {
  "claude-sonnet-4-6":            "gpt-5.4-mini",
  "claude-sonnet-4-5-20250929":   "gpt-5.4-mini",
  "claude-haiku-4-5-20251001":    "gpt-5.4-mini",
  "claude-opus-4-7":              "gpt-5.4-mini",   // 비용 절감 — opus 도 mini 로
};

/**
 * ── 신뢰성 계층 (2026-08-19 사장님 지시: "AI 실패 확률 0 으로 수렴") ──────────
 *  1) OpenAI SDK 자체 재시도(429/5xx/네트워크, maxRetries=3, 지수 백오프)
 *  2) 그래도 실패하면 **모델 폴백 체인**으로 1회 더 — 상위 모델 장애·용량 부족 시 하위 모델이 받쳐줌.
 *     응답 품질은 낮아질 수 있으나 "실패" 대신 "결과" 를 준다. 폴백 사용은 usage 로그에 남긴다.
 *  3) 폴백 대상이 없는 모델(이미 mini)은 같은 모델로 1회 재호출.
 *  ⚠️ 폴백은 4xx 입력 오류(400 invalid_request 등)에는 적용하지 않는다 — 같은 입력이면 같은 400.
 */
const SDK_MAX_RETRIES = 3;
const FALLBACK_MODEL: Record<string, string> = {
  "gpt-5.6-sol":   "gpt-5.6-terra",
  "gpt-5.6-terra": "gpt-5.6-luna",
  "gpt-5.6-luna":  "gpt-5.4-mini",
  "gpt-5.4":       "gpt-5.4-mini",
  "gpt-5.4-mini":  "gpt-5.4-mini",
  "claude-sonnet-5": "gpt-5.4-mini",
  "claude-opus-5":   "gpt-5.4-mini",
  "claude-haiku-4-5-20251001": "gpt-5.4-mini",
};
function fallbackFor(model: string): string | null {
  const fb = FALLBACK_MODEL[model];
  return fb ?? "gpt-5.4-mini";
}
/** 재시도/폴백 가치가 있는 오류인지 — 입력 오류(400/401/403/404/422)는 제외 */
export function isTransientLlmError(err: unknown): boolean {
  const e = err as { status?: number; code?: string; name?: string; message?: string } | undefined;
  const status = typeof e?.status === "number" ? e.status : undefined;
  if (status !== undefined) {
    if (status === 408 || status === 409 || status === 429 || status >= 500) return true;
    if (status >= 400 && status < 500) return false;
  }
  const name = String(e?.name ?? "");
  const code = String(e?.code ?? "");
  const msg = String(e?.message ?? "").toLowerCase();
  return name.includes("Timeout") || name.includes("APIConnection") || code === "ECONNRESET" || code === "ETIMEDOUT"
    || msg.includes("timeout") || msg.includes("timed out") || msg.includes("network") || msg.includes("socket");
}
/** 서버 과부하 등으로 콘텐츠가 비어 온 응답도 "실패" 로 간주해 폴백 대상으로 삼는다 */
export class EmptyLlmResponseError extends Error {
  constructor(model: string) { super(`empty response from ${model}`); this.name = "EmptyLlmResponseError"; }
}

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
  /** GPT-5.6 계열 추론 강도 — 5.6 모델일 때만 사용(기본 "none"). 판단형 라우트는 "low"+ 명시. */
  reasoning_effort?: "none" | "low" | "medium" | "high";
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
      maxRetries: SDK_MAX_RETRIES,
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
        //  [SYSTEM]/[USER]/[ASSISTANT] 태그를 사용하므로, 사용자 입력에 포함된 같은 패턴이
        //  시스템 명령으로 오해될 수 있다 (프롬프트 주입). 유저 콘텐츠의 태그를 zero-width space 로 이스케이프.
        const escapeRoleTags = (text: string): string =>
          text.replace(/\[(SYSTEM|USER|ASSISTANT)\]/gi, (m) => m.slice(0, 1) + "​" + m.slice(1));

        const parts: string[] = [];
        if (systemText) parts.push(`[SYSTEM]\n${systemText}`); // system 은 신뢰 소스 — 이스케이프 불필요
        for (const m of req.messages) {
          const tag = m.role === "user" ? "USER" : "ASSISTANT";
          const safeContent = m.role === "user"
            ? escapeRoleTags(flattenContent(m.content))
            : flattenContent(m.content);
          parts.push(`[${tag}]\n${safeContent}`);
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
      // ── GPT-5.6 계열 중앙 가드 (2026-07-27) ──
      //  5.6(Sol/Terra/Luna)은 reasoning 모델: temperature/top_p 전달 시 400 (기본값 1만 허용, 실측).
      //  라우트별로 하나씩 고치다 놓치는 사고를 막기 위해 여기서 일괄 드롭.
      //  reasoning_effort 는 호출처가 명시하면 그 값, 아니면 "none"(파서·짧은 생성 경유가 다수 — 속도 우선).
      //  판단형 라우트(사업계획서·재무해석 등)를 5.6으로 올릴 땐 req.reasoning_effort 를 명시할 것.
      const isGpt56 = mappedModel.startsWith("gpt-5.6");
      if (isGpt56) {
        // ⚠️ 실측 제약 (2026-08-03, terra 로 대조): chat/completions 에서 function tools 와
        //   reasoning_effort 는 "none" 만 공존 가능 — low/medium/high 는 물론 **필드 생략도 400**
        //   ("Function tools with reasoning_effort are not supported ... use /v1/responses").
        //   tools 호출인데 상위 effort 가 필요하면 Responses API 마이그레이션이 선행 조건.
        //   여기서 강제하지 않으면 호출처 하나가 effort 를 명시하는 순간 그 기능이 전멸한다.
        const wantsTools = Array.isArray(req.tools) && req.tools.length > 0;
        if (wantsTools && req.reasoning_effort && req.reasoning_effort !== "none") {
          console.warn(
            `[LlmClient] ${mappedModel}: tools+reasoning_effort=${req.reasoning_effort} 는 API 가 거부 — "none" 으로 강제`,
          );
        }
        baseParams.reasoning_effort = wantsTools ? "none" : (req.reasoning_effort ?? "none");
      } else {
        if (req.temperature !== undefined) baseParams.temperature = req.temperature;
        if (req.top_p !== undefined) baseParams.top_p = req.top_p;
      }

      // Anthropic tools / tool_choice → OpenAI function calling 변환.
      //  로드맵 생성처럼 schema-strict 출력을 강제하는 호출처는 이 경로를 거쳐
      //  tool_use 블록을 반환받음. 호출처는 기존 Anthropic 패턴 그대로.
      const oaiTools = convertToolsToOpenAI(req.tools);
      const oaiToolChoice = convertToolChoiceToOpenAI(req.tool_choice);
      if (oaiTools) baseParams.tools = oaiTools;
      if (oaiToolChoice !== undefined) baseParams.tool_choice = oaiToolChoice;

      // ── 호출 + 폴백 (SDK 재시도는 내부에서 이미 3회) ──
      type ChatResp = { choices: Array<{ finish_reason?: string | null; message?: { content?: string | null; tool_calls?: unknown[] } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
      let response: ChatResp;
      let usedModel = mappedModel;
      const callOnce = async (model: string) => {
        const params = { ...baseParams, model };
        // 폴백 모델이 5.6 계열이 아니면 reasoning_effort 를 빼고, temperature 는 원래 요청대로
        if (!model.startsWith("gpt-5.6")) {
          delete (params as Record<string, unknown>).reasoning_effort;
          if (req.temperature !== undefined) (params as Record<string, unknown>).temperature = req.temperature;
          if (req.top_p !== undefined) (params as Record<string, unknown>).top_p = req.top_p;
        } else if (!("reasoning_effort" in params)) {
          (params as Record<string, unknown>).reasoning_effort = "none";
          delete (params as Record<string, unknown>).temperature;
          delete (params as Record<string, unknown>).top_p;
        }
        const r = (await this.openai.chat.completions.create(params as never)) as unknown as ChatResp;
        const c = r.choices?.[0];
        const hasTool = Array.isArray((c?.message as { tool_calls?: unknown[] } | undefined)?.tool_calls)
          && ((c?.message as { tool_calls?: unknown[] }).tool_calls?.length ?? 0) > 0;
        const hasText = typeof c?.message?.content === "string" && c.message.content.trim().length > 0;
        if (!hasTool && !hasText && c?.finish_reason !== "length") throw new EmptyLlmResponseError(model);
        return r;
      };
      try {
        response = await callOnce(mappedModel);
      } catch (firstErr) {
        const fb = fallbackFor(mappedModel);
        if (!fb || !isTransientLlmError(firstErr) && !(firstErr instanceof EmptyLlmResponseError)) throw firstErr;
        console.warn(`[LlmClient] ${mappedModel} 실패(${(firstErr as Error)?.name ?? "err"}: ${String((firstErr as Error)?.message ?? "").slice(0, 120)}) → 폴백 ${fb}`);
        response = await callOnce(fb);
        usedModel = fb;
      }
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
        model: usedModel,
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
 * 진짜 Anthropic(Claude) 클라이언트 — 위 LlmClient(OpenAI 셔임)와 달리 실제 Claude API 호출.
 *  고위험·고가치 기능(계약서 분석 등)만 선택적으로 진짜 Opus 로 올릴 때 사용.
 *  apiKey 는 ANTHROPIC_API_KEY(getRealAnthropicApiKey) 여야 함. messages.create 시그니처는
 *  LlmClient 와 동일(Anthropic shape)이라 호출처 파싱 코드 재사용 가능.
 */
export function createRealAnthropicClient(apiKey: string, timeoutMs: number = LONG_TIMEOUT_MS): Anthropic {
  return new Anthropic({ apiKey, timeout: timeoutMs });
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
