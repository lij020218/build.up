import { createAiClient } from "@foundone/ai/utils/client";
import { NextResponse } from "next/server";
import { parseLlmJson } from "@foundone/ai/utils/parse-json";
import { getAnthropicApiKey } from "../../../_lib/env";
import { runAiFeature } from "../../../_lib/ai-guard";

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
  // 입력 검증은 게이트(차감) 전에 — 잘못된 요청은 절대 차감되지 않는다 (2026-08-19 ai-guard 이관)
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
    return NextResponse.json({ error: "Data too large (max 50KB)" }, { status: 413 });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    console.error("[members/parse] ANTHROPIC_API_KEY not found");
    return NextResponse.json(
      { error: "AI 서비스를 일시적으로 사용할 수 없습니다. 서버를 재시작하거나 관리자에게 문의하세요." },
      { status: 503 }
    );
  }

  const ko = body.language !== "en";

  // 한도(분·일·주·월)·실패 환불 = ai-guard(AI_FEATURE_LIMITS "members-parse"). 모델·파싱 실패는 throw → 재시도 1회 후 환불+503.
  return runAiFeature(
    { request, feature: "members-parse", failMessage: "회원 데이터 파싱에 실패했어요. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요." },
    async () => {
    const client = createAiClient(apiKey);
    const response = await client.messages.create({
      model: "gpt-5.6-luna", // 2026-07-27 luna — 파싱 전용, 중앙 가드가 effort none 처리
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
      throw new Error("Unexpected AI response (no text block)");
    }

    // robust 4단계 파서(strict → loose → damage fix → truncated repair). 실패는 throw → 가드 재시도·환불.
    let members = parseLlmJson<unknown>(content.text);
    if (!Array.isArray(members)) {
      // 객체로 감싸 온 경우({members:[...]}) 관용
      const inner = members && typeof members === "object" ? Object.values(members as Record<string, unknown>).find(Array.isArray) : undefined;
      if (!inner) throw new Error("AI 응답 파싱 실패: 배열이 아닙니다");
      members = inner;
    }
    const parsed: ParsedMember[] = (members as Array<Record<string, unknown>>)
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

    return NextResponse.json({ members: parsed });
    },
  );
}
