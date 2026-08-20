/**
 * classify.ts — 업종 분류 전용 경량 호출 (2026-08-03).
 *
 * 왜 분리했나 (사장님 설계 결정): 종전엔 Pass 1 이 분류를 "출력"했다 — 오분류가
 *  인허가·예산·벤더까지 전부 틀어진 채 나오고, 수정 경로가 재생성(쿼터 소모)뿐.
 *  이제 흐름 = 아이디어 → **이 호출로 후보 3개** → 사용자가 탭으로 확정(직접 로드맵의
 *  업종 선택과 같은 행위) → Pass 1 은 확정 업종을 "입력"으로 받는다.
 *  LLM 은 추천만 하고, 확정은 사람이 한다.
 *
 * 모델: gpt-5.6-luna — 71개 중 3개 고르기(선택형). 회당 ~₩2, 재분류 부담 없음.
 * 택소노미는 Pass 1 과 동일 SSOT (SUB_INDUSTRY_TAXONOMY_BLOCK) — 이중 관리 금지.
 */
import { createAiClient, systemWithCache } from "../utils/client";
import { parseLlmJson } from "../utils/parse-json";
import { AiParseError } from "../types/ai";
import type { AiCallOptions } from "../types/ai";
import { SUB_INDUSTRY_TAXONOMY_BLOCK } from "./prompt";
import type { ResponseSchema } from "../utils/structured-output";

const DEFAULT_MODEL = "gpt-5.6-luna";
const DEFAULT_MAX_TOKENS = 800;

export type IndustryCandidate = {
  subIndustryId: string;
  categoryId: string;
  /** 한국어 라벨 (예: "테이크아웃 커피") */
  label: string;
  /** 왜 이 업종인가 — 사용자가 보고 판단할 한 줄 */
  reason: string;
};

export type IndustryClassification = {
  candidates: IndustryCandidate[];   // 적합도 순 1~3개
  /** 아이디어 텍스트에서 함께 뽑은 힌트 — 위저드 뒷단계 프리필용 (2026-08-20: 지역을 또 묻던 UX 수정) */
  extracted: {
    region: string | null;      // 예: "서울 마포구 망원동" — 언급 없으면 null
    budgetWon: number | null;   // 원 단위 (예: 5천만 원 → 50000000) — 언급 없으면 null
    storeName: string | null;   // 가게 이름을 지었으면 — 없으면 null
  };
};

/** Structured Outputs 스키마 — 루트 배열은 strict 불가라 {candidates:[...]} 로 감싼다 */
export const INDUSTRY_CLASSIFY_RESPONSE_SCHEMA: ResponseSchema = {
  name: "industry_classification",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["candidates", "extracted"],
    properties: {
      extracted: {
        type: "object",
        additionalProperties: false,
        required: ["region", "budgetWon", "storeName"],
        properties: {
          region: { type: ["string", "null"] },
          budgetWon: { type: ["number", "null"] },
          storeName: { type: ["string", "null"] },
        },
      },
      candidates: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["subIndustryId", "categoryId", "label", "reason"],
          properties: {
            subIndustryId: { type: "string" },
            categoryId: { type: "string" },
            label: { type: "string" },
            reason: { type: "string" },
          },
        },
      },
    },
  },
};

const SYSTEM_PROMPT = `당신은 한국 창업 아이디어를 업종 택소노미로 분류하는 전문가입니다.

${SUB_INDUSTRY_TAXONOMY_BLOCK}

## 출력
사용자의 아이디어에 가장 맞는 세부 업종 **후보 1~3개**를 적합도 순으로. JSON 만 출력:
{"candidates":[{"subIndustryId":"...","categoryId":"...","label":"한국어 업종명","reason":"이 업종으로 본 근거 한 줄 (사용자 표현 인용)"}],
 "extracted":{"region":"아이디어에 언급된 지역·상권 원문 그대로 (없으면 null)","budgetWon":"언급된 예산을 원 단위 숫자로 (없으면 null)","storeName":"지어둔 가게 이름 (없으면 null)"}}

규칙:
- subIndustryId·categoryId 는 위 목록의 값만. 임의 ID 절대 금지.
- 확신이 높으면 1개만, 갈림길이면 2~3개 — 사용자가 최종 선택한다.
- reason 은 사용자가 후보를 가르는 데 도움이 되게 (차이점 중심).
- extracted 는 **아이디어 텍스트에 실제로 적힌 것만** — 추측·창작 금지. 지역은 쓴 표현 그대로("홍대", "마포구 망원동").`;

export async function classifyIndustry(
  ideaText: string,
  options: AiCallOptions,
): Promise<IndustryClassification> {
  const client = createAiClient(options.apiKey);
  const response = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    system: systemWithCache(SYSTEM_PROMPT, "1h"),
    messages: [{ role: "user", content: `창업 아이디어: "${ideaText.slice(0, 2000)}"` }],
    response_schema: INDUSTRY_CLASSIFY_RESPONSE_SCHEMA,
  });

  const text = response.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("\n");

  let parsed: unknown;
  try {
    parsed = parseLlmJson(text);
  } catch {
    throw new AiParseError("업종 분류 응답이 유효한 JSON이 아닙니다.", text);
  }
  const parsedRoot: unknown = parsed;   // extracted 는 루트 객체에 있다 (배열 flatten 전에 보관)
  // {candidates:[...]} (Structured Outputs) 와 구형 루트 배열 모두 관용
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Array.isArray((parsed as { candidates?: unknown }).candidates)) {
    parsed = (parsed as { candidates: unknown[] }).candidates;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new AiParseError("업종 분류 후보가 비어 있습니다.", text);
  }

  const candidates: IndustryCandidate[] = (parsed as Array<Record<string, unknown>>)
    .slice(0, 3)
    .map((c) => ({
      subIndustryId: String(c.subIndustryId ?? ""),
      categoryId: String(c.categoryId ?? ""),
      label: String(c.label ?? ""),
      reason: String(c.reason ?? ""),
    }))
    .filter((c) => c.subIndustryId.length > 0 && c.categoryId.length > 0);

  const rawExtracted = (parsedRoot && typeof parsedRoot === "object" && !Array.isArray(parsedRoot))
    ? (parsedRoot as { extracted?: { region?: unknown; budgetWon?: unknown; storeName?: unknown } }).extracted
    : undefined;
  const extracted = {
    region: typeof rawExtracted?.region === "string" && rawExtracted.region.trim() ? rawExtracted.region.trim().slice(0, 100) : null,
    budgetWon: typeof rawExtracted?.budgetWon === "number" && rawExtracted.budgetWon > 0 ? Math.round(rawExtracted.budgetWon) : null,
    storeName: typeof rawExtracted?.storeName === "string" && rawExtracted.storeName.trim() ? rawExtracted.storeName.trim().slice(0, 100) : null,
  };

  if (candidates.length === 0) {
    throw new AiParseError("업종 분류 후보 필드가 올바르지 않습니다.", text);
  }
  return { candidates, extracted };
}
