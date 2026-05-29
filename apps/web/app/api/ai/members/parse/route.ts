import { createAiClient } from "@foundone/ai/utils/client";
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getAnthropicApiKey } from "../../../_lib/env";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";

type ParsedMember = {
  name: string;
  plan: string;
  fee: number;
  startDate: string;
  endDate: string;
};

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireApiUser(request).catch(() => null);
  if (!auth || !auth.ok) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const rl = await checkSimpleRateLimit({
    key: `ai-members-parse:${auth.userId}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  const dailyLimit = await checkDailyRateLimit({
    userId: auth.userId,
    feature: "members-parse",
    limit: 30,
    message: "오늘 사용량을 초과했습니다. 내일 다시 시도해 주세요.",
  });
  if (!dailyLimit.ok) {
    return NextResponse.json({ error: dailyLimit.error }, { status: dailyLimit.status });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    console.error("[members/parse] ANTHROPIC_API_KEY not found");
    return NextResponse.json(
      { error: "AI 서비스를 일시적으로 사용할 수 없습니다. 서버를 재시작하거나 관리자에게 문의하세요." },
      { status: 503 }
    );
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

  const ko = body.language !== "en";

  try {
    const client = createAiClient(apiKey);
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      system: ko
        ? `CSV/엑셀/텍스트에서 회원·고객 데이터를 추출해 JSON 배열로 반환하는 파서입니다.
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

[
  { "name": "이름", "plan": "이용권/등급", "fee": 금액(원 정수), "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }
]

규칙:
- 제공된 데이터에 있는 회원/고객만 추출. 절대로 없는 사람을 만들어내지 마세요.
- 데이터를 파싱할 수 없거나 회원/고객 정보가 없으면 빈 배열 []을 반환.
- fee는 원 단위 정수. "50,000원" → 50000. 없으면 0.
- 날짜는 YYYY-MM-DD 형식. 없으면 빈 문자열 "".
- plan은 이용권명, 등급, 코스명 등. 없으면 "일반".
- 헤더 행, 합계 행, 빈 행은 무시.
- 열 이름이 달라도 의미상 이름/금액/날짜에 해당하면 추출.`
        : `Parse member/customer data from CSV/text into a JSON array. Respond ONLY with JSON.

[
  { "name": "Name", "plan": "Plan/tier", "fee": amountInt, "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }
]

Rules:
- ONLY extract members that exist in the data. NEVER fabricate entries.
- If no member data found, return empty array [].
- fee as integer (currency units). Empty/missing → 0.
- Dates as YYYY-MM-DD or empty string "".
- plan: membership tier, course name, etc. Default "일반".
- Skip header/total/empty rows.`,
      messages: [{ role: "user", content: `<user_input>${text}</user_input>` }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected AI response" }, { status: 502 });
    }

    let members: ParsedMember[];
    try {
      let cleaned = content.text
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim();

      const start = cleaned.indexOf("[");
      let end = cleaned.lastIndexOf("]");
      if (start !== -1) {
        if (end !== -1 && end > start) {
          cleaned = cleaned.slice(start, end + 1);
        } else {
          cleaned = cleaned.slice(start);
          const lastBrace = cleaned.lastIndexOf("}");
          if (lastBrace > 0) {
            cleaned = cleaned.slice(0, lastBrace + 1) + "]";
          }
        }
      }

      console.log("[members/parse] Cleaned (first 300):", cleaned.slice(0, 300));
      members = JSON.parse(cleaned);
      if (!Array.isArray(members)) throw new Error("Not an array");
      members = members
        .filter((m) => m && typeof m.name === "string" && m.name.trim().length > 0)
        .map((m) => ({
          name: String(m.name).trim(),
          plan: String(m.plan || "일반").trim(),
          fee: Math.max(0, Math.round(Number(m.fee) || 0)),
          startDate:
            typeof m.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(m.startDate)
              ? m.startDate
              : "",
          endDate:
            typeof m.endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(m.endDate)
              ? m.endDate
              : "",
        }));
    } catch (parseErr) {
      console.error(
        "[members/parse] Parse error:",
        parseErr instanceof Error ? parseErr.message : parseErr
      );
      console.error("[members/parse] Raw AI text:", content.text.slice(0, 1000));
      return NextResponse.json(
        { error: `AI 응답 파싱 실패: ${content.text.slice(0, 100)}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ members });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[members/parse] Error:", message);
    return NextResponse.json({ error: `회원 데이터 파싱 중 오류: ${message}` }, { status: 500 });
  }
}
