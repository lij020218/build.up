/**
 * marketing-research.ts — 마케팅 사례·트렌드 "조사" 단계 (2단계 파이프라인의 1단계).
 *
 *  목적: 업종 라벨을 받아 **최신 한국 마케팅 성공사례 + 현재 트렌드**를 자유 텍스트로 수집.
 *    구조화(JSON)는 호출처가 별도 LLM 호출로 수행 — 검색 응답(인용·산문)과 JSON 생성을
 *    분리해야 파싱 실패("사례 0건")를 막을 수 있다.
 *
 *  1순위: OpenAI Responses web_search (createAiClient 가 web_search tool 을 자동 라우팅).
 *  2순위(폴백): Tavily 검색 결과 합치기 — web_search 가 비거나 실패해도 사례 확보.
 */
import { createAiClient } from "@foundone/ai/utils/client";
import { tavilySearch } from "./tavily";

export type ResearchSource = { name: string; url: string };
export type MarketingResearch = { text: string; sources: ResearchSource[] };

/** 텍스트에서 URL 추출 → 출처 목록(중복 제거, 최대 8). */
function harvestSources(text: string): ResearchSource[] {
  const urls = text.match(/https?:\/\/[^\s)\]"'<>]+/g) ?? [];
  const seen = new Set<string>();
  const out: ResearchSource[] = [];
  for (const raw of urls) {
    const url = raw.replace(/[.,)]+$/, "");
    let host = url;
    try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* keep raw */ }
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ name: host, url });
    if (out.length >= 8) break;
  }
  return out;
}

/**
 * 업종별 최신 마케팅 사례·트렌드 조사.
 * @returns 자유 텍스트(text) + 출처(sources). 모두 비면 빈 text.
 */
export async function researchMarketingCases(opts: {
  apiKey: string;
  tavilyKey?: string;
  label: string;            // 업종 라벨 (예: "한식·백반·가정식")
  language: "ko" | "en";
}): Promise<MarketingResearch> {
  const { apiKey, tavilyKey, label, language } = opts;
  const ko = language === "ko";

  // ── 주력: Tavily ──
  //  ⚠️ 검증(2026-06-10): OpenAI web_search 는 네이버·카카오·인스타가 robots.txt 로 차단돼
  //   한국 소상공인 사례를 "확인된 사례 없음"으로 비워옴. Tavily 는 같은 콘텐츠(네이버 블로그·인스타·
  //   창업매체·아이보스 등)에 잘 닿음 → Tavily 를 주력으로, OpenAI web_search 는 보조.
  const sources: ResearchSource[] = [];
  const seen = new Set<string>();
  let tavilyText = "";
  if (tavilyKey) {
    const queries = ko
      ? [
          `${label} 인스타그램 마케팅 성공 사례`,
          `${label} 네이버 플레이스 리뷰 늘리는 법 2026`,
          `${label} 소상공인 바이럴 마케팅 사례`,
        ]
      : [`${label} marketing success case Korea 2026`, `${label} small business viral marketing Korea`];
    const blocks: string[] = [];
    for (const q of queries) {
      const r = await tavilySearch(tavilyKey, q, { maxResults: 4, searchDepth: "advanced", includeAnswer: true, days: 730 });
      if (!r) continue;
      if (r.answer) blocks.push(`[검색: ${q}]\n${r.answer}`);
      for (const item of r.results ?? []) {
        blocks.push(`- ${item.title}: ${item.content} (출처: ${item.url})`);
        if (!seen.has(item.url)) {
          seen.add(item.url);
          let host = item.url;
          try { host = new URL(item.url).hostname.replace(/^www\./, ""); } catch { /* keep */ }
          sources.push({ name: host, url: item.url });
        }
      }
    }
    tavilyText = blocks.join("\n");
  }

  // Tavily 가 충분하면 그것만으로 충분 (한국 사례 도달률 높음).
  if (tavilyText.trim().length > 300) {
    return { text: tavilyText, sources: sources.slice(0, 8) };
  }

  // ── 보조: OpenAI web_search (Tavily 키 없거나 빈약할 때) ──
  const prompt = ko
    ? `당신은 한국 마케팅 리서처입니다. web_search 툴로 **2025~2026년 대한민국 "${label}" 업종**의
실제 마케팅 성공 사례와 현재 뜨는 마케팅 트렌드를 찾아주세요.
- 사례·트렌드: (브랜드/가게명, 무엇을 했는지, 결과·반응, 가능하면 수치, 출처 URL).
- 검증된 것만. 못 찾으면 지어내지 말 것.
읽기 쉬운 한국어 텍스트로(표·JSON 아님).`
    : `Use web_search to find real marketing cases & trends for the South Korean "${label}" industry (2025-2026). Verified only. Readable text.`;
  let oaiText = "";
  try {
    const client = createAiClient(apiKey);
    const res = await client.messages.create({
      model: "gpt-5.4-mini",
      max_tokens: 2200,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 } as unknown],
      messages: [{ role: "user", content: prompt }],
    });
    oaiText = res.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("\n")
      .trim();
  } catch (err) {
    console.warn("[marketing-research] web_search failed:", err instanceof Error ? err.message : err);
  }

  const merged = [tavilyText, oaiText].filter((s) => s && s.trim().length > 0).join("\n\n");
  const mergedSources = sources.length > 0 ? sources.slice(0, 8) : harvestSources(oaiText);
  return { text: merged, sources: mergedSources };
}
