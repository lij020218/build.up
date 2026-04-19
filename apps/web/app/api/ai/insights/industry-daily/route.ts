import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicApiKey } from "../../../_lib/env";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getIndustryBenchmark } from "@build-up/shared";

/**
 * Industry Daily Insight — 신규/운영 사용자 모두에게 매일 1개 업종·경영 인사이트 제공.
 *
 * "빈 화면 지옥" 해결:
 * - 매출 데이터 없어도 업종 평균·상위 10% 벤치마크 기반 조언 가능
 * - Claude Haiku 4.5 + prompt caching (업종별 시스템 프롬프트 캐시)
 * - 하루 1회 캐시 (클라이언트 sessionStorage)
 *
 * 마케팅 트렌드(/api/ai/marketing/trends)와 차이:
 * - 마케팅 트렌드 = SNS 콘텐츠·트렌드
 * - Industry Insight = 경영·매출·비용·운영 인사이트 (Peter Drucker 성향)
 */

const SYSTEM_PROMPT = `당신은 한국 자영업·창업 경영 컨설턴트입니다.
매일 사장님에게 **경영에 도움되는 1개의 날카로운 인사이트**를 전달합니다.

원칙:
1. 오늘 바로 쓸 수 있는 실용적 인사이트 (이론 X, 실행 가능한 힌트 O)
2. 구체적 숫자 활용 (평균 매출, 상위 10% 등)
3. 친근하되 전문적인 톤 (과하게 격려하지 않음)
4. 한국 자영업 현실 반영 (배달·임대료·인건비·계절성)
5. 2-3 문장 핵심 + 1개 오늘의 액션 제안

응답 형식 (JSON만):
{
  "headline": "핵심 한 줄 (15자 이내)",
  "body": "구체적 인사이트 2-3문장",
  "action": "오늘 할 수 있는 1가지 (1문장)",
  "category": "revenue" | "cost" | "marketing" | "operations" | "growth"
}`;

const CATEGORY_LABELS: Record<string, string> = {
  food: "외식업 (음식점)",
  "cafe-dessert": "카페·디저트",
  retail: "소매업",
  beauty: "뷰티·미용실",
  pet: "반려동물",
  fitness: "피트니스·PT",
  education: "교육·학원",
  space: "공간임대",
  "online-digital": "온라인·쇼핑몰",
  "startup-tech": "테크 스타트업",
  "living-service": "생활서비스",
};

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // 일일 한도: 사용자당 10회 (캐시 활용하면 실제로는 1회면 충분)
  const rateLimit = checkSimpleRateLimit({
    key: `industry-insight:${auth.userId}`,
    limit: 10,
    windowMs: 86_400_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });
  }

  let body: {
    categoryId?: string;
    hasUserSales?: boolean;
    avgDailySales?: number;
    daysSinceLaunch?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const categoryId = body.categoryId ?? "food";
  const label = CATEGORY_LABELS[categoryId] ?? categoryId;
  const benchmark = getIndustryBenchmark(categoryId);
  const avgMonthly = benchmark ? Math.round(benchmark.avgAnnualRevenue / 12) : null;
  const top10Monthly = benchmark ? Math.round(benchmark.top10PctRevenue / 12) : null;
  const bottom10Monthly = benchmark ? Math.round(benchmark.bottom10PctRevenue / 12) : null;

  // 사용자 맥락 (있으면 비교 생성)
  const userContext = (body.hasUserSales && body.avgDailySales && avgMonthly)
    ? (() => {
        const userMonthly = Math.round(body.avgDailySales! * 26); // 월 영업일 추정 26
        const ratio = avgMonthly > 0 ? (userMonthly / avgMonthly) * 100 : 0;
        return `
[사장님 현황]
- 최근 일 평균 매출: ${body.avgDailySales!.toLocaleString()}원
- 월 환산: 약 ${userMonthly.toLocaleString()}원
- 업종 평균 대비: ${ratio.toFixed(0)}%`;
      })()
    : "[사장님은 매출 기록 시작 전입니다]";

  const launchContext = body.daysSinceLaunch !== undefined && body.daysSinceLaunch >= 0
    ? `[오픈 ${body.daysSinceLaunch}일차]`
    : "[오픈 전 또는 미입력]";

  const today = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });

  const userPrompt = `오늘 ${today}.
[업종] ${label}
${launchContext}

[업종 벤치마크 (소상공인실태조사 기준)]
${avgMonthly ? `- 월 평균 매출: ${(avgMonthly / 10000).toFixed(0)}만원` : ""}
${top10Monthly ? `- 상위 10% 월 매출: ${(top10Monthly / 10000).toFixed(0)}만원+` : ""}
${bottom10Monthly ? `- 하위 10% 월 매출: ${(bottom10Monthly / 10000).toFixed(0)}만원` : ""}
${benchmark?.keyDifferentiators ? `- 상위 10% 차별화: ${benchmark.keyDifferentiators.slice(0, 2).join(", ")}` : ""}

${userContext}

위 정보를 바탕으로 **오늘 이 사장님이 가장 눈여겨봐야 할 1가지 경영 인사이트**를 JSON으로 반환하세요. 다른 설명 없이 JSON만.`;

  try {
    const client = new Anthropic({ apiKey, timeout: 30_000 });
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }, // 90% 입력 토큰 절감
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = res.content.find((c) => c.type === "text")?.text ?? "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI response malformed" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      headline?: string;
      body?: string;
      action?: string;
      category?: string;
    };

    return NextResponse.json({
      headline: parsed.headline?.trim() ?? "",
      body: parsed.body?.trim() ?? "",
      action: parsed.action?.trim() ?? "",
      category: parsed.category ?? "operations",
      generatedAt: new Date().toISOString(),
      benchmark: benchmark
        ? {
            avgMonthly,
            top10Monthly,
            bottom10Monthly,
          }
        : null,
      cache: {
        created: res.usage?.cache_creation_input_tokens ?? 0,
        read: res.usage?.cache_read_input_tokens ?? 0,
      },
    });
  } catch (err) {
    console.error("[Industry insight]", err);
    return NextResponse.json({ error: "Failed to generate insight" }, { status: 500 });
  }
}
