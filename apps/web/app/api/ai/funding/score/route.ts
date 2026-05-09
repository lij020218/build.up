import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getOpenAIApiKey } from "../../../_lib/env";
import { requireApiUser } from "../../../_lib/auth";
import { checkDailyRateLimit, checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { ANTI_HALLUCINATION_DIRECTIVE } from "@build-up/ai";
import {
  formatKRW,
  detectRubric,
  PASS_SIGNALS,
  FAIL_SIGNALS,
  type Rubric,
} from "@build-up/shared";

/**
 * Funding AI Score — 사장님 데이터 vs 지원 프로그램 요건 정밀 매칭 평가.
 *
 * 사용처: GuidesView.ProgramCard 의 "AI 점수 보기" 버튼.
 *
 * 평가 기준은 packages/shared/src/knowledge/funding-evaluation-criteria.ts 의
 * 5개 Rubric (PSST·TIPS·정책자금·재도전·긴급경영) — 한국 정부지원사업 실심사 기준
 * 기반 (출처: 창업진흥원·중진공·소진공 운영지침 + 합격사업계획서 100개 분석).
 *
 * detectRubric() 으로 프로그램 이름→Rubric 자동 매칭, AI 는 *그 항목별 배점*
 * 그대로 따라 점수 산출. 환각·일반론 금지.
 *
 * 응답: FundingScore { score, level, headline, breakdown, strengths, weaknesses,
 *                     improvements, verdict }
 *
 * 비용: 일일 20회 / 분당 5회. gpt-5.4-mini, max_completion_tokens 900.
 */

type RequestBody = {
  program: {
    name: string;
    organizer: string;
    category: string;
    target: string;
    benefit: string;
    amount?: string;
    season?: string;
    requiredDocs?: string[];
    eligibility?: string[];
  };
  user: {
    startupType?: string;
    industryCategoryId?: string;
    businessYears?: number;
    region?: string;
    capital?: number;
    runwayMonths?: number;
    weeklySalesChangePct?: number;
    employeesCount?: number;
    avgDailySales?: number;
    daysSinceLaunch?: number;
    age?: number;
    matchScore?: number;
    eligible?: boolean;
  };
};

type FundingScore = {
  score: number;
  level: "high" | "medium" | "low";
  framework: string;
  passingScore: number;
  headline: string;
  breakdown: { item: string; weight: number; itemScore: number; reason: string }[];
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  verdict: string;
  bonusEligible: string[];
  disqualified: string[];
};

function buildSystemPrompt(rubric: Rubric): string {
  const itemsLines = rubric.items.map((it) =>
    `- ${it.label} (${it.weight}점): ${it.description}\n  ✅ 증거: ${it.evidence.join(" / ")}\n  ❌ 약점: ${it.redFlags.join(" / ")}`,
  ).join("\n");
  const bonusLines = rubric.bonusFactors.map((b) => `- ${b.label} (+${b.points}점)`).join("\n");
  const disqLines = rubric.disqualifyingFactors.map((d) => `- ${d}`).join("\n");

  return `당신은 한국 정부지원사업 ${rubric.programs[0]} 심사 컨설턴트입니다.
사장님 데이터 vs 프로그램 요건을 *공식 평가표* 기준으로 비교해 합격 가능성·약점·개선방향을 제시합니다.

═══════════════════════════════════════════════════════════════════
  📋 적용 평가 프레임워크: ${rubric.framework.toUpperCase()}
  대상 프로그램군: ${rubric.programs.join(", ")}
  총점: ${rubric.totalPoints}점 / 추정 합격선: ${rubric.passingScore}점
═══════════════════════════════════════════════════════════════════

[평가 항목 — 항목별 배점 그대로 따라 점수 산출]
${itemsLines}

[가점 항목 — 사장님 데이터에 있으면 +N점]
${bonusLines}

[자격 미충족 — 1개라도 해당하면 점수 < 40, 즉시 거리 멀다]
${disqLines}

[합격 신호 — 사장님 데이터에서 발견되면 가산]
${PASS_SIGNALS.map((s) => `- ${s}`).join("\n")}

[탈락 신호 — 사장님 데이터·진술에서 발견되면 감산]
${FAIL_SIGNALS.map((s) => `- ${s}`).join("\n")}

🟢 좋은 평가의 조건:
1. *항목별 배점* 으로 점수 분해 (breakdown) — 합쳐 총점 = score
2. 사장님 *실제 수치 1-3개* 인용 + 프로그램 *요구 조건 1-2개* 비교
3. 약점 = 구체적 미충족 항목 (예: "런웨이 2.1개월 → 안정 운영 6개월+ 요구")
4. 개선 = 측정 가능한 액션 (예: "현금성 자산 +1,500만 확보 시 +12점")
5. 자격 미충족 항목 발견 시 즉시 disqualified 배열에 명시 + 점수 < 40
6. 거리 멀면 솔직히 — 헛된 희망 X. 부풀린 70점 X.

🔴 절대 금지:
- 사장님 데이터에 *없는 수치* 인용 (환각)
- "준비를 잘 하면 합격할 수 있어요" (일반론)
- 위 평가 항목 외 임의 기준 추가
- breakdown 배점 합 ≠ score (수학 오류)

${ANTI_HALLUCINATION_DIRECTIVE}

📤 출력 — JSON only:
{
  "score": 0-100 정수 (breakdown 합과 일치),
  "level": "high"(${rubric.passingScore}+) | "medium" | "low"(<50),
  "headline": "한 줄 평가 — 사장님 고유 패턴 인용",
  "breakdown": [
    { "item": "항목명", "weight": 배점, "itemScore": 획득점수, "reason": "근거 한 줄" }
  ],
  "strengths": ["부합 점 2-3개"],
  "weaknesses": ["미충족 2-3개 — 구체적"],
  "improvements": ["합격률 올릴 구체 액션 2-3개"],
  "verdict": "1-2문장 — '거리가 멀다 / 노력하면 가능 / 지금 신청 권장' 톤",
  "bonusEligible": ["사장님이 받을 가점 항목 라벨"],
  "disqualified": ["미충족 자격 — 있으면, 없으면 빈 배열"]
}`;
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const daily = checkDailyRateLimit({
    userId: auth.userId,
    feature: "funding-score",
    limit: 20,
    message: "오늘의 AI 평가 횟수(20회)를 모두 사용하셨습니다. 내일 다시 시도해 주세요.",
  });
  if (!daily.ok) return NextResponse.json({ error: daily.error }, { status: 429 });

  const burst = checkSimpleRateLimit({
    key: `funding-score-burst:${auth.userId}`,
    limit: 5,
    windowMs: 60_000,
    message: "잠깐 너무 빠릅니다. 1분만 기다려 주세요.",
  });
  if (!burst.ok) return NextResponse.json({ error: burst.error }, { status: 429 });

  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured (OPENAI_API_KEY missing)" }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.program?.name || !body.program?.target) {
    return NextResponse.json({ error: "program.name + program.target 필수" }, { status: 400 });
  }

  // ─── 프로그램 → Rubric 자동 매칭 ───
  const rubric = detectRubric(body.program.name, body.program.category);

  // ─── 사용자 컨텍스트 라인 ───
  const u = body.user ?? {};
  const ctx: string[] = [];
  if (u.businessYears !== undefined) ctx.push(`- 운영 ${u.businessYears}년차 (${u.daysSinceLaunch ?? 0}일)`);
  if (u.industryCategoryId) ctx.push(`- 업종: ${u.industryCategoryId}`);
  if (u.region) ctx.push(`- 지역: ${u.region}`);
  if (u.startupType) ctx.push(`- 형태: ${u.startupType}`);
  if (u.capital !== undefined) ctx.push(`- 초기 자본: ${formatKRW(u.capital)}`);
  if (u.runwayMonths !== undefined)
    ctx.push(`- 현금 런웨이: ${u.runwayMonths}개월${u.runwayMonths < 3 ? " ⚠️ 위기" : u.runwayMonths < 6 ? " ⚠️ 주의" : ""}`);
  if (u.weeklySalesChangePct !== undefined)
    ctx.push(`- 매출 추세 (주간): ${u.weeklySalesChangePct > 0 ? "+" : ""}${u.weeklySalesChangePct}%`);
  if (u.avgDailySales !== undefined && u.avgDailySales > 0) ctx.push(`- 일평균 매출: ${formatKRW(u.avgDailySales)}`);
  if (u.employeesCount !== undefined) ctx.push(`- 직원 수: ${u.employeesCount}명`);
  if (u.age !== undefined) ctx.push(`- 사장님 나이: ${u.age}`);
  if (u.matchScore !== undefined) ctx.push(`- 시스템 사전 매칭: ${u.matchScore}/100 (deterministic, 참고)`);
  if (u.eligible !== undefined) ctx.push(`- 시스템 자격 판정: ${u.eligible ? "충족" : "미충족"}`);

  const userContext = ctx.length > 0
    ? `[사장님 현황 — 검증된 서버 데이터, 이 블록 수치만 인용]\n${ctx.join("\n")}`
    : "[사장님 데이터 부족 — 점수 50 이하 권장]";

  const programBlock = [
    `[지원 프로그램]`,
    `- 이름: ${body.program.name}`,
    `- 주관: ${body.program.organizer}`,
    `- 카테고리: ${body.program.category}`,
    `- 대상: ${body.program.target}`,
    `- 지원 내용: ${body.program.benefit}`,
    body.program.amount ? `- 지원 금액: ${body.program.amount}` : null,
    body.program.season ? `- 신청 시기: ${body.program.season}` : null,
    body.program.requiredDocs?.length ? `- 필요 서류: ${body.program.requiredDocs.join(", ")}` : null,
    body.program.eligibility?.length ? `- 자격 조건: ${body.program.eligibility.join(" / ")}` : null,
    `- 추정 합격선: ${rubric.passingScore}점 / ${rubric.totalPoints}점`,
    `- 단계 가이드: ${rubric.stageGuide}`,
  ].filter(Boolean).join("\n");

  const userPrompt = `${programBlock}

${userContext}

🎯 위 평가표 기준으로 사장님의 합격 가능성을 점수화하세요. JSON only.`;

  try {
    const client = new OpenAI({ apiKey, timeout: 30_000 });
    const r = await client.chat.completions.create({
      model: "gpt-5.4-mini",
      max_completion_tokens: 900,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(rubric) },
        { role: "user", content: userPrompt },
      ],
    });

    const text = r.choices[0]?.message?.content ?? "{}";
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) {
      return NextResponse.json({ error: "AI 응답 형식 오류" }, { status: 500 });
    }

    const parsed = JSON.parse(m[0]) as Partial<FundingScore>;

    const score = typeof parsed.score === "number" && Number.isFinite(parsed.score)
      ? Math.max(0, Math.min(100, Math.round(parsed.score)))
      : 50;
    const level: FundingScore["level"] =
      score >= rubric.passingScore ? "high" : score >= 50 ? "medium" : "low";

    const result: FundingScore = {
      score,
      level: ["high", "medium", "low"].includes(parsed.level as string) ? (parsed.level as FundingScore["level"]) : level,
      framework: rubric.framework,
      passingScore: rubric.passingScore,
      headline: typeof parsed.headline === "string" ? parsed.headline.trim() : "평가 진행됨",
      breakdown: Array.isArray(parsed.breakdown)
        ? (parsed.breakdown as FundingScore["breakdown"])
            .filter((b) => b && typeof b.item === "string")
            .slice(0, rubric.items.length)
        : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((s) => typeof s === "string").slice(0, 3) : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.filter((s) => typeof s === "string").slice(0, 3) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.filter((s) => typeof s === "string").slice(0, 3) : [],
      verdict: typeof parsed.verdict === "string" ? parsed.verdict.trim() : "",
      bonusEligible: Array.isArray(parsed.bonusEligible) ? parsed.bonusEligible.filter((s) => typeof s === "string").slice(0, 5) : [],
      disqualified: Array.isArray(parsed.disqualified) ? parsed.disqualified.filter((s) => typeof s === "string").slice(0, 3) : [],
    };

    return NextResponse.json({ ok: true, result, remaining: daily.remaining });
  } catch (err) {
    console.error("[funding/score] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI 평가 실패" },
      { status: 500 },
    );
  }
}
