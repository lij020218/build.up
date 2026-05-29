import { createAiClient } from "@foundone/ai/utils/client";
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getAnthropicApiKey } from "../../../_lib/env";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";

type ParsedProduct = {
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
};

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

export async function POST(request: Request) {
  const auth = await requireApiUser(request).catch(() => null);
  if (!auth || !auth.ok) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const rl = await checkSimpleRateLimit({
    key: `ai-products-parse:${auth.userId}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
  const dailyLimit = await checkDailyRateLimit({
    userId: auth.userId,
    feature: "products-parse",
    limit: 30,
    message: "오늘 사용량을 초과했습니다. 내일 다시 시도해 주세요.",
  });
  if (!dailyLimit.ok) {
    return NextResponse.json({ error: dailyLimit.error }, { status: dailyLimit.status });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    console.error("[products/parse] ANTHROPIC_API_KEY not found");
    return NextResponse.json({ error: "AI 서비스를 일시적으로 사용할 수 없습니다. 서버를 재시작하거나 관리자에게 문의하세요." }, { status: 503 });
  }

  let body: { text: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text || text.length < 5) {
    return NextResponse.json({ error: "No data provided" }, { status: 400 });
  }

  if (text.length > 50_000) {
    return NextResponse.json({ error: "Data too large (max 50KB)" }, { status: 400 });
  }

  const ko = body.language === "ko";

  // 사용자 입력을 로그에 노출하지 않음 (보안)

  try {
    const client = createAiClient(apiKey);
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      system: ko
        ? `엑셀/CSV/텍스트에서 추출한 제품 데이터를 JSON 배열로 정리하는 파서입니다.
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

[
  { "name": "제품명", "category": "카테고리", "price": 판매가(원), "cost": 원가(원), "stock": 재고수, "unit": "단위" }
]

규칙:
- 제공된 데이터에 있는 제품만 추출하세요. 절대로 데이터에 없는 제품을 만들어내지 마세요.
- 데이터를 파싱할 수 없거나 제품 정보가 없으면 빈 배열 []을 반환하세요.
- price, cost는 원 단위 정수. "5,000원" → 5000. 없으면 0.
- stock은 정수. 없으면 0.
- unit은 "개", "잔", "인분", "팩", "켤레", "장" 등. 데이터에서 추론. 없으면 "개".
- category는 데이터에서 추론. 없으면 "기타".
- 헤더 행은 무시하고 데이터만 추출.
- 빈 행이나 합계 행은 무시.
- 데이터가 카페/음식 제품이 아니어도 그대로 추출하세요 (양말, 의류, 전자제품 등 모든 종류).`
        : `Parse product data from Excel/CSV/text into a JSON array. Respond ONLY with JSON.

[
  { "name": "Product name", "category": "Category", "price": sellingPrice, "cost": costPrice, "stock": stockQty, "unit": "unit" }
]

Rules:
- ONLY extract products that exist in the provided data. NEVER fabricate products.
- If data cannot be parsed or contains no products, return empty array [].
- price/cost in integer won. stock as integer.
- unit from data context. Defaults to "개".
- Skip header/total rows. Extract ALL product types (clothing, electronics, food, etc).`,
      messages: [{ role: "user", content: `<user_input>${text}</user_input>` }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected AI response" }, { status: 502 });
    }

    let products: ParsedProduct[];
    try {
      // AI 응답 정리: 마크다운 블록 제거 + 배열 추출 + 잘린 JSON 복구
      let cleaned = content.text
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim();

      // [ 부터 ] 까지 추출
      const start = cleaned.indexOf("[");
      let end = cleaned.lastIndexOf("]");
      if (start !== -1) {
        if (end !== -1 && end > start) {
          cleaned = cleaned.slice(start, end + 1);
        } else {
          // ] 가 없음 = 잘린 응답 → 마지막 완전한 객체까지만 사용
          cleaned = cleaned.slice(start);
          // 마지막 완전한 } 찾기
          const lastBrace = cleaned.lastIndexOf("}");
          if (lastBrace > 0) {
            cleaned = cleaned.slice(0, lastBrace + 1) + "]";
          }
        }
      }

      console.log("[products/parse] Cleaned (first 300):", cleaned.slice(0, 300));
      products = JSON.parse(cleaned);
      if (!Array.isArray(products)) throw new Error("Not an array");
      products = products.filter(
        (p) => p && typeof p.name === "string" && p.name.trim().length > 0
      ).map((p) => ({
        name: String(p.name).trim(),
        category: String(p.category || "기타").trim(),
        price: Math.max(0, Math.round(Number(p.price) || 0)),
        cost: Math.max(0, Math.round(Number(p.cost) || 0)),
        stock: Math.max(0, Math.round(Number(p.stock) || 0)),
        unit: String(p.unit || "개").trim(),
      }));
    } catch (parseErr) {
      console.error("[products/parse] Parse error:", parseErr instanceof Error ? parseErr.message : parseErr);
      console.error("[products/parse] Raw AI text:", content.text.slice(0, 1000));
      return NextResponse.json({ error: `AI 응답 파싱 실패: ${content.text.slice(0, 100)}` }, { status: 502 });
    }

    return NextResponse.json({ products });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[products/parse] Error:", message);
    return NextResponse.json({ error: `제품 데이터 파싱 중 오류: ${message}` }, { status: 500 });
  }
}
