import { NextResponse } from "next/server";

export type ContractorResult = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  description: string;
  mapUrl: string | null;
};

type OpenAIResponseOutput = {
  type: string;
  content?: { type: string; text: string }[];
};
type OpenAIResponse = {
  output: OpenAIResponseOutput[];
};

async function searchContractorsViaOpenAI(
  region: string,
  keyword: string,
  apiKey: string
): Promise<ContractorResult[]> {
  const prompt =
    `"${region} ${keyword}" 로 웹을 검색해서, ` +
    `평점과 리뷰 수 기준 종합 점수가 높은 실제 업체 3곳을 찾아줘. ` +
    `평점·리뷰 정보가 없으면 검색 결과에서 가장 언급이 많은 업체를 골라줘.`;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5.4-nano-2026-03-17",
      instructions:
        "You are a business research assistant. Always respond with ONLY a valid JSON array — no explanation, no disclaimer, no markdown, no extra text whatsoever. " +
        "In the description field, write only the business characteristics you found (specialty, known strengths, notable info). Never mention missing data or inability to find ratings. " +
        'Format: [{"name":"...","address":"...","phone":"... or null","description":"...","mapUrl":"... or null"}]',
      tools: [
        {
          type: "web_search_preview",
          user_location: { type: "approximate", country: "KR" },
        },
      ],
      temperature: 1,
      input: prompt,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as OpenAIResponse;

  const text = data.output
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text)
    .join("");

  const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .slice(0, 3)
    .map((item, i) => ({
      id: `ai-${i}`,
      name: String(item.name ?? ""),
      address: String(item.address ?? ""),
      phone: item.phone && item.phone !== "null" ? String(item.phone) : null,
      description: String(item.description ?? ""),
      mapUrl: item.mapUrl && item.mapUrl !== "null" ? String(item.mapUrl) : null,
    }))
    .filter((c) => c.name.length > 0);
}

// GET /api/contractors/local?region=홍대&categoryId=cafe-dessert&keyword=카페+인테리어+전문
export async function GET(request: Request) {
  const url = new URL(request.url);
  const region = url.searchParams.get("region")?.trim();
  const categoryId = url.searchParams.get("categoryId")?.trim();
  const keyword = url.searchParams.get("keyword")?.trim();

  if (!region || !categoryId || !keyword) {
    return NextResponse.json(
      { error: "region, categoryId, keyword are required." },
      { status: 400 }
    );
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json({ results: [], source: "no_api_key" });
  }

  // 결과가 나올 때까지 최대 3회 재시도
  let results: ContractorResult[] = [];
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      results = await searchContractorsViaOpenAI(region, keyword, openaiKey);
      if (results.length > 0) break;
    } catch (err) {
      console.error(`[contractors/local] attempt ${attempt} failed:`, err);
      if (attempt === 3) {
        return NextResponse.json({ error: "Web search failed." }, { status: 502 });
      }
    }
  }

  return NextResponse.json({ results, source: "openai" });
}
