// ─── Pass 2: AI 가 서비스 DB 풀에서 사용자 상황에 맞게 선택 ────────────────
//
// Pass 1 (generate.ts) 가 sub-industry 와 예산·상권 등 컨텍스트를 결정한 후,
// 서버는 그 sub-industry 의 vendor_recommendations + interior_design_guides 를 fetch.
// Pass 2 는 그 풀을 AI 에 통째로 보여주고 사용자 상황(예산·지역·팀 규모·아이디어)에 맞게
// **풀 안에서만** 골라달라고 요청한다. → 가상 회사명 환각 0%, 한국 한정 검증된 추천.

import Anthropic from "@anthropic-ai/sdk";
import type { AiCallOptions } from "../types/ai";
import { systemWithCache } from "../utils/client";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 2048;

export type PoolVendor = {
  id: string;
  vendorType: string;
  vendorTypeLabel: string;
  title: string;
  description: string;
  checkItems: string[];
  franchiseNote?: string;
  priority: number;
};

export type PoolMaterial = {
  id: string;
  nameKo: string;
  descriptionKo: string;
  costRangeKo?: string;
  tags: string[];
  trendSource?: string;
  priority: number;
};

export type PoolConcept = {
  id: string;
  nameKo: string;
  descriptionKo: string;
  costRangeKo?: string;
  pros: string[];
  cons: string[];
  tags: string[];
  priority: number;
};

export type PoolChannel = {
  id: string;
  nameKo: string;
  type: string;             // delivery | online-marketplace | social-commerce | reservation | pos-payment | courier | delivery-agency
  typeLabelKo: string;
  commissionRate: number;   // %
  features: string;
  pros: string[];
  cons: string[];
};

export type SelectFromPoolInput = {
  ideaText: string;
  budget?: number;
  region?: string;
  teamSize?: number;
  industryLabel: string;
  subIndustryId: string;
  startupType: "independent" | "franchise";
  language: "ko" | "en";
  pool: {
    vendors: PoolVendor[];
    materials: PoolMaterial[];
    concepts: PoolConcept[];
    channels: PoolChannel[];
  };
};

export type SelectFromPoolResult = {
  /** 선택된 vendor 의 id + 사용자 상황에 맞춘 reasoning */
  pickedVendors: Array<{ id: string; reason: string }>;
  /** 선택된 자재의 id + reasoning */
  pickedMaterials: Array<{ id: string; reason: string }>;
  /** 선택된 컨셉 1개 + reasoning */
  pickedConcept?: { id: string; reason: string };
  /** 선택된 운영 채널 + 우선순위 (1=주력, 2=보조) + reasoning */
  pickedChannels: Array<{ id: string; priority: 1 | 2; reason: string }>;
};

const SELECT_TOOL: Anthropic.Tool = {
  name: "submit_selections",
  description: "제공된 풀(vendors/materials/concepts/channels) 안에서 사용자 상황에 맞게 골라 제출합니다. 풀에 없는 ID는 절대 사용 금지.",
  input_schema: {
    type: "object",
    properties: {
      pickedVendors: {
        type: "array",
        description: "공급업체 풀에서 사용자 예산·상권·업종에 맞는 5-9개 선택. ⚠️ 최소 5개 필수, vendor_type 카테고리별 1개 이상.",
        minItems: 5,
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "풀의 vendor.id 정확히 일치" },
            reason: { type: "string", description: "왜 이 사용자에게 적합한지 1-2 문장" },
          },
          required: ["id", "reason"],
        },
      },
      pickedMaterials: {
        type: "array",
        description: "인테리어 자재 풀에서 컨셉·예산에 맞는 4-6개 선택",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            reason: { type: "string" },
          },
          required: ["id", "reason"],
        },
      },
      pickedConcept: {
        type: "object",
        description: "디자인 컨셉 풀에서 가장 적합한 1개. 풀이 비어있으면 omit.",
        properties: {
          id: { type: "string" },
          reason: { type: "string" },
        },
        required: ["id", "reason"],
      },
      pickedChannels: {
        type: "array",
        description: "운영 채널 풀에서 사용자 업종·예산에 맞는 3-6개. priority 1 은 주력 (반드시 등록), 2 는 보조.",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            priority: { type: "number", enum: [1, 2] },
            reason: { type: "string" },
          },
          required: ["id", "priority", "reason"],
        },
      },
    },
    required: ["pickedVendors", "pickedMaterials", "pickedChannels"],
  },
};

const SYSTEM_PROMPT = `<role>
당신은 한국 창업 큐레이터입니다.
사용자의 사업 컨텍스트를 받아, build.up 서비스에 등록된 검증된 공급업체·인테리어 자재·디자인 컨셉·운영 채널 풀에서
사용자 예산·상권·팀 규모·사업 아이디어에 가장 적합한 항목들을 골라줍니다.

⚠️ 절대 금지:
- 풀에 없는 ID 만들기 (환각)
- 풀에 없는 회사명·자재명 추가
- 풀의 항목을 무시하고 일반 지식으로 추천

반드시 \`submit_selections\` tool 을 호출하여 풀의 ID 만 사용해 결과를 제출하세요.
</role>

<selection_principles>
1. **vendors (공급업체)** — ⚠️ 분류별로 골고루 + 인테리어 시공 업체 별도 필수:
   - **반드시 모든 vendor_type 카테고리에서 1개 이상 선택**:
     · 식재료/소싱/소모품 (ingredient/sourcing/supplies) — 1-2개
     · 포장/안전 (packaging/safety) — 1개 이상
     · 장비/POS/진열 (equipment/pos/display) — 1-2개
     · **인테리어 시공 (interior)** — 풀에 있으면 **반드시 1개 이상 포함** ⚠️
     · 예약/운영툴 (booking/management/tools) — 해당 시 1개
     · 물류/플랫폼 (logistics/platform) — 해당 시
   - 사용자 예산이 작으면 priority 가 낮은 가성비 옵션 우선.
   - 프랜차이즈면 franchise_supplier_check 류는 반드시 포함.
   - 총 5-9개 선택. **vendor_type 한 카테고리 몰빵 절대 금지** (예: ingredient 만 5개 선택 X).

2. **materials (자재)**:
   - 컨셉과 일관성 있는 자재 4-6개 선택.
   - 가격대(cost_range_ko)가 사용자 예산과 맞는지 확인. 평당 200만원 자재를 5천만원 예산 가게에 추천 금지.

3. **concept (디자인 컨셉)**:
   - 가장 적합한 1개만. 사용자 아이디어·타겟 고객·예산을 모두 고려.
   - pros/cons 를 보고 사용자 상황의 cons 가 치명적이지 않은 컨셉 선택.

4. **channels (운영 채널)**:
   - 업종에 맞는 채널만. food/cafe → 배달앱+SNS, retail → 마켓플레이스+SNS, beauty/fitness → 예약 플랫폼+SNS.
   - priority 1: 반드시 등록해야 할 주력 채널 (1-3개).
   - priority 2: 성장 후 추가할 보조 채널 (1-3개).
   - 수수료(commissionRate)·점유율 데이터 보고 합리적 선택.

5. **reason 작성 (각 선택마다 필수)**:
   - "왜 이 사용자에게 적합한지" 사용자의 예산·아이디어·상권을 직접 인용해 1-2 문장.
   - 예: "예산 5천만원 + 강남역 입지에서 임대료 부담 큼 → 이 식재료 업체는 소량 주문(1박스부터) 가능해 초기 재고 부담 최소화"
   - 일반론 ("좋은 업체입니다") 금지. 사용자 상황과 직접 연결.
</selection_principles>

<rules>
- 한국어로 응답.
- 풀에 없는 ID 사용 금지 — schema 검증으로 거부됨.
- pickedConcept 는 concepts 풀이 비어있으면 omit (필수 아님).
- 사용자 컨텍스트가 빈약해도 풀 데이터를 기반으로 합리적 추론.
</rules>`;

function buildUserPrompt(input: SelectFromPoolInput): string {
  const lines: string[] = [];
  lines.push(`## 사용자 사업 컨텍스트`);
  lines.push(`- 업종: ${input.industryLabel} (${input.subIndustryId})`);
  lines.push(`- 시작 유형: ${input.startupType === "franchise" ? "프랜차이즈" : "독립 창업"}`);
  if (input.budget) lines.push(`- 예산: ${Math.round(input.budget / 10000).toLocaleString()}만원`);
  if (input.region) lines.push(`- 희망 지역: ${input.region}`);
  if (input.teamSize) lines.push(`- 팀 규모: ${input.teamSize}명`);
  lines.push(`- 사업 아이디어: <user_input>${input.ideaText}</user_input>`);
  lines.push("");

  // vendor_type 별로 그룹핑해서 AI 가 카테고리 누락 안 하도록
  const vendorsByType = new Map<string, PoolVendor[]>();
  for (const v of input.pool.vendors) {
    if (!vendorsByType.has(v.vendorType)) vendorsByType.set(v.vendorType, []);
    vendorsByType.get(v.vendorType)!.push(v);
  }
  // 우선순위 표시: 인테리어 시공·핵심 공급업체 우선 노출
  const typeOrder = ["interior", "ingredient", "sourcing", "supplies", "equipment", "pos", "packaging", "safety", "display", "booking", "management", "tools", "logistics", "platform", "photography", "franchise_supplier_check"];
  const sortedTypes = [...vendorsByType.keys()].sort((a, b) => {
    const ai = typeOrder.indexOf(a); const bi = typeOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  lines.push(`## 공급업체 풀 (${input.pool.vendors.length}개) — 이 안에서만 선택. ⚠️ 각 카테고리에서 최소 1개 이상 골라야 함.`);
  for (const t of sortedTypes) {
    const items = vendorsByType.get(t)!;
    const tLabel = items[0]?.vendorTypeLabel ?? t;
    const required = t === "interior" ? " ⚠️ 인테리어 시공은 반드시 포함" : "";
    lines.push(`### [${tLabel}] (${items.length}개)${required}`);
    for (const v of items) {
      const checks = v.checkItems.length > 0 ? ` | 체크: ${v.checkItems.slice(0, 3).join(", ")}` : "";
      const fr = v.franchiseNote ? ` | 프랜차이즈: ${v.franchiseNote}` : "";
      lines.push(`- id="${v.id}" ${v.title} — ${v.description}${checks}${fr}`);
    }
  }
  lines.push("");

  lines.push(`## 인테리어 자재 풀 (${input.pool.materials.length}개) — 이 안에서만 선택`);
  for (const m of input.pool.materials) {
    const cost = m.costRangeKo ? ` | ${m.costRangeKo}` : "";
    const tags = m.tags.length > 0 ? ` [${m.tags.join(",")}]` : "";
    lines.push(`- id="${m.id}" ${m.nameKo}${tags} — ${m.descriptionKo}${cost}`);
  }
  lines.push("");

  lines.push(`## 디자인 컨셉 풀 (${input.pool.concepts.length}개) — 가장 적합한 1개 선택 (또는 omit)`);
  for (const c of input.pool.concepts) {
    const cost = c.costRangeKo ? ` | ${c.costRangeKo}` : "";
    const pros = c.pros.length > 0 ? ` | 장점: ${c.pros.slice(0, 2).join(", ")}` : "";
    const cons = c.cons.length > 0 ? ` | 단점: ${c.cons.slice(0, 2).join(", ")}` : "";
    lines.push(`- id="${c.id}" ${c.nameKo} — ${c.descriptionKo}${cost}${pros}${cons}`);
  }
  lines.push("");

  lines.push(`## 운영 채널 풀 (${input.pool.channels.length}개) — 이 안에서만 선택`);
  for (const ch of input.pool.channels) {
    const fee = ch.commissionRate > 0 ? ` | 수수료 ${ch.commissionRate}%` : "";
    const pros = ch.pros.length > 0 ? ` | 장점: ${ch.pros.slice(0, 2).join(", ")}` : "";
    lines.push(`- id="${ch.id}" [${ch.typeLabelKo}] ${ch.nameKo} — ${ch.features}${fee}${pros}`);
  }
  lines.push("");

  lines.push(`위 풀에서만 골라 \`submit_selections\` 를 호출하세요. 사용자 예산·아이디어·지역에 맞춰 reason 작성.`);
  return lines.join("\n");
}

export async function selectFromPool(
  input: SelectFromPoolInput,
  options: AiCallOptions,
): Promise<SelectFromPoolResult> {
  // 풀이 모두 비어있으면 AI 호출 자체를 skip
  if (
    input.pool.vendors.length === 0 &&
    input.pool.materials.length === 0 &&
    input.pool.concepts.length === 0 &&
    input.pool.channels.length === 0
  ) {
    return { pickedVendors: [], pickedMaterials: [], pickedChannels: [] };
  }

  const client = new Anthropic({ apiKey: options.apiKey, timeout: 60_000 });

  const rawResponse = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    system: systemWithCache(SYSTEM_PROMPT, "1h"),
    tools: [SELECT_TOOL],
    tool_choice: { type: "tool", name: "submit_selections" },
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  } as Parameters<typeof client.messages.create>[0]);

  const response = rawResponse as Anthropic.Messages.Message;
  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    console.error("[selectFromPool] no tool_use in response");
    return { pickedVendors: [], pickedMaterials: [], pickedChannels: [] };
  }

  const raw = toolUse.input as {
    pickedVendors?: Array<{ id: string; reason: string }>;
    pickedMaterials?: Array<{ id: string; reason: string }>;
    pickedConcept?: { id: string; reason: string };
    pickedChannels?: Array<{ id: string; priority: number; reason: string }>;
  };

  // ID 검증 — 풀 안의 ID 만 통과
  const vendorIds = new Set(input.pool.vendors.map(v => v.id));
  const materialIds = new Set(input.pool.materials.map(m => m.id));
  const conceptIds = new Set(input.pool.concepts.map(c => c.id));
  const channelIds = new Set(input.pool.channels.map(ch => ch.id));

  const pickedVendors = (raw.pickedVendors ?? [])
    .filter(p => vendorIds.has(p.id))
    .map(p => ({ id: p.id, reason: String(p.reason ?? "") }));
  const pickedMaterials = (raw.pickedMaterials ?? [])
    .filter(p => materialIds.has(p.id))
    .map(p => ({ id: p.id, reason: String(p.reason ?? "") }));
  const pickedConcept = raw.pickedConcept && conceptIds.has(raw.pickedConcept.id)
    ? { id: raw.pickedConcept.id, reason: String(raw.pickedConcept.reason ?? "") }
    : undefined;
  const pickedChannels = (raw.pickedChannels ?? [])
    .filter(p => channelIds.has(p.id))
    .map(p => ({
      id: p.id,
      priority: (p.priority === 2 ? 2 : 1) as 1 | 2,
      reason: String(p.reason ?? ""),
    }));

  console.log(
    `[selectFromPool] picked vendors=${pickedVendors.length}/${input.pool.vendors.length}`,
    `materials=${pickedMaterials.length}/${input.pool.materials.length}`,
    `concept=${pickedConcept ? "1" : "0"}/${input.pool.concepts.length}`,
    `channels=${pickedChannels.length}/${input.pool.channels.length}`,
  );

  return { pickedVendors, pickedMaterials, pickedConcept, pickedChannels };
}
