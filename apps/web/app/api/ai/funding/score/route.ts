import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getOpenAIApiKey } from "../../../_lib/env";
import { normalizeBreakdown, toInt } from "../../../_lib/ios-contract";
import { runAiFeature } from "../../../_lib/ai-guard";
import { isTransientLlmError, EmptyLlmResponseError } from "@foundone/ai/utils/client";
import { parseLlmJson } from "@foundone/ai/utils/parse-json";
import { ANTI_HALLUCINATION_DIRECTIVE } from "@foundone/ai";
import {
  formatKRW,
  detectRubric,
  PASS_SIGNALS,
  FAIL_SIGNALS,
  type Rubric,
} from "@foundone/shared";

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
    // ─── identity ───
    storeName?: string;
    mission?: string;
    shortDescription?: string;
    industryCategoryId?: string;
    subIndustryId?: string;
    selectedSpecialtyId?: string;
    startupType?: string;

    // ─── location ───
    region?: string;
    addressRoad?: string;

    // ─── demographics ───
    age?: number;

    // ─── stage ───
    businessYears?: number;
    daysSinceLaunch?: number;
    bizRegistrationDate?: string;
    hasBizRegistration?: boolean;

    // ─── financial ───
    capital?: number;
    currentBalanceKrw?: number | null;
    runwayMonths?: number;

    // ─── sales ───
    avgDailySales?: number;
    weeklySalesChangePct?: number;
    monthlyAvgRevenue?: number;
    hasUserSales?: boolean;

    // ─── P&L (월 환산) ───
    monthlyCosts?: {
      ingredients?: number;
      labor?: number;
      rent?: number;
      utilities?: number;
      sga?: number;
      marketing?: number;
      other?: number;
      interest?: number;
    };
    totalMonthlyCost?: number;
    monthlyProfit?: number;
    primeRatePct?: number;

    // ─── employees ───
    employeesCount?: number;
    fourInsuranceEstablished?: boolean;

    // ─── validation evidence (PSST critical) ───
    customerInterviewCount?: number;
    productsCount?: number;
    hasMVP?: boolean;

    // ─── marketing ───
    marketingCampaignsCount?: number;
    marketingMonthlyBudget?: number;

    // ─── tax / regulatory ───
    taxType?: "general" | "simplified" | "exempt";
    hasNorangusan?: boolean;

    // ─── system pre-match ───
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
1. *항목별 배점* 으로 점수 분해 (breakdown) — itemScore 합 = score (수학 정확히 일치)
2. 사장님 데이터 블록의 *구체 수치 인용* — 예: "런웨이 2.1개월", "월 적자 -180만", "고객 인터뷰 0건", "MVP 운영 중", "프라임코스트 72%"
3. 각 breakdown.reason 에 *근거 한 줄* (어느 데이터를 봤고 왜 그 점수인지)
4. 약점 = 구체 미충족 (예: "고객 인터뷰 0건 → 문제인식 18/25점 그쳐")
5. 개선 = 측정 가능한 액션 + *예상 점수 변화* (예: "고객 인터뷰 10건 진행 시 +5~7점")
6. 자격 미충족 발견 시 disqualified 배열 명시 + score < 40
7. 거리 멀면 솔직히 — verdict 에 명확히. 부풀린 70+ 금지.

📊 데이터 활용 가이드:
- 매출 입력 0 + MVP 0 → 솔루션·성장전략 큰 폭 감산 (PoC 부재)
- 고객 인터뷰 0건 → 문제인식 절반 이하
- 런웨이 < 6개월 → 정책자금 운영 안정성 결격 가능
- 매출 -10% 이상 하락 → *긴급경영안정자금* 트랙이 더 적합 (현재 평가 외)
- 운영 12개월 미만 → 정책자금 일반경영안정 자격 미충족
- 청년 가점·비수도권·인증 → bonusEligible 에 명시
- 프라임코스트 65%+ → 정책자금 평가 시 -감산 (수익 구조 위기)

🔴 절대 금지:
- 사장님 데이터 블록에 *없는 수치* 인용 (환각)
- "준비를 잘 하면 합격할 수 있어요" (일반론)
- 위 평가 항목 외 임의 기준 추가
- breakdown.itemScore 합계가 score 와 다른 경우 (수학 오류)
- 데이터 부족인데 점수 70+ (정보 없으면 50 이하)

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

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

/**
 * OpenAI 직접 호출(response_format json_object 필요)용 로컬 폴백 — 일시 오류·빈 응답이면 gpt-5.4-mini 로 1회 재시도.
 *  (LlmClient 는 response_format 미지원이라 이 라우트는 OpenAI 를 유지. 2026-08-19)
 */
async function withLlmFallback<T>(primaryModel: string, run: (model: string) => Promise<T>): Promise<T> {
  try {
    return await run(primaryModel);
  } catch (e) {
    if (!isTransientLlmError(e) && !(e instanceof EmptyLlmResponseError)) throw e;
    console.warn(`[funding/score] ${primaryModel} transient failure → fallback gpt-5.4-mini:`, e instanceof Error ? e.message : String(e));
    return run("gpt-5.4-mini");
  }
}

export async function POST(request: Request) {
  // 입력 검증은 게이트(차감) 전에 — 잘못된 입력은 절대 차감하지 않는다.
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body?.program?.name || !body.program?.target) {
    return NextResponse.json({ error: "program.name + program.target 필수" }, { status: 400 });
  }

  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured (OPENAI_API_KEY missing)" }, { status: 500 });
  }

  // 2026-08-19 ai-guard: 분·일·주·월 한도(분당→일→주→월 순, 차감 후 burst 검사 버그 제거) + 실패 시 전액 환불.
  return runAiFeature(
    { request, feature: "funding-score", failMessage: "AI 평가에 실패했습니다. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요." },
    async ({ limits, usage }) => scoreFunding(body, apiKey, Math.max(0, limits.daily - usage.dayUsed)),
  );
}

async function scoreFunding(body: RequestBody, apiKey: string, remaining: number): Promise<NextResponse> {
  // ─── 프로그램 → Rubric 자동 매칭 ───
  const rubric = detectRubric(body.program.name, body.program.category);

  // ─── 사용자 컨텍스트 — 풍부한 가게 데이터 ───
  const u = body.user ?? {};
  const sections: string[] = [];

  // 가게 정체성
  const idLines: string[] = [];
  if (u.storeName) idLines.push(`- 가게 이름: ${u.storeName}`);
  if (u.mission) idLines.push(`- 미션 / 사업 목적: "${u.mission.slice(0, 200)}"`);
  if (u.shortDescription) idLines.push(`- 한줄 설명: "${u.shortDescription.slice(0, 200)}"`);
  if (u.industryCategoryId) idLines.push(`- 업종 카테고리: ${u.industryCategoryId}`);
  if (u.subIndustryId) idLines.push(`- 세부업종: ${u.subIndustryId}`);
  if (u.selectedSpecialtyId) idLines.push(`- 정확한 특화: ${u.selectedSpecialtyId}`);
  if (u.startupType) idLines.push(`- 운영 형태: ${u.startupType} ${u.startupType === "franchise" ? "(가맹)" : u.startupType === "independent" ? "(독립)" : ""}`);
  if (u.region) idLines.push(`- 거주·운영 지역: ${u.region}`);
  if (u.addressRoad) idLines.push(`- 사업장 주소: ${u.addressRoad}`);
  if (u.age !== undefined) idLines.push(`- 사장님 나이: 만 ${u.age}세${u.age <= 39 ? " (청년 가점 가능)" : ""}`);
  if (idLines.length > 0) sections.push(`[가게 정체성]\n${idLines.join("\n")}`);

  // 사업 단계
  const stageLines: string[] = [];
  if (u.businessYears !== undefined) stageLines.push(`- 운영 ${u.businessYears}년차${u.businessYears === 0 ? " (창업 0년차)" : ""}`);
  if (u.daysSinceLaunch !== undefined) stageLines.push(`- 오픈 후 ${u.daysSinceLaunch}일 경과`);
  if (u.hasBizRegistration !== undefined) stageLines.push(`- 사업자 등록: ${u.hasBizRegistration ? "완료" : "미등록 (예비창업 자격)"}`);
  if (u.bizRegistrationDate) stageLines.push(`- 사업자 등록일: ${u.bizRegistrationDate}`);
  if (u.taxType) stageLines.push(`- 과세 유형: ${u.taxType === "general" ? "일반과세" : u.taxType === "simplified" ? "간이과세" : "면세"}`);
  if (stageLines.length > 0) sections.push(`[사업 단계]\n${stageLines.join("\n")}`);

  // 재무 — 자금·런웨이·매출·손익
  const finLines: string[] = [];
  if (u.capital !== undefined) finLines.push(`- 초기 자본: ${formatKRW(u.capital)}`);
  if (u.currentBalanceKrw !== undefined && u.currentBalanceKrw !== null) finLines.push(`- 현재 잔고: ${formatKRW(u.currentBalanceKrw)}`);
  if (u.runwayMonths !== undefined) {
    const flag = u.runwayMonths < 3 ? " ⚠️ 위기 (3개월 미만)" : u.runwayMonths < 6 ? " ⚠️ 주의 (6개월 미만 — 안정 운영 자격 미충족 가능)" : "";
    finLines.push(`- 현금 런웨이: ${u.runwayMonths}개월${flag}`);
  }
  if (u.hasUserSales) finLines.push(`- 매출 입력 여부: 있음 (가장 강력한 합격 신호)`);
  else if (u.hasUserSales === false) finLines.push(`- 매출 입력 여부: 없음 (PoC·매출 준비도 부재)`);
  if (u.avgDailySales !== undefined && u.avgDailySales > 0) finLines.push(`- 일평균 매출: ${formatKRW(u.avgDailySales)}`);
  if (u.monthlyAvgRevenue !== undefined && u.monthlyAvgRevenue > 0) finLines.push(`- 월 환산 매출: ${formatKRW(u.monthlyAvgRevenue)} (26영업일 기준)`);
  if (u.weeklySalesChangePct !== undefined) {
    const trend = u.weeklySalesChangePct > 5 ? " 📈 상승" : u.weeklySalesChangePct < -5 ? " 📉 하락" : "";
    finLines.push(`- 매출 추세 (주간): ${u.weeklySalesChangePct > 0 ? "+" : ""}${u.weeklySalesChangePct}%${trend}${u.weeklySalesChangePct <= -10 ? " (긴급경영안정자금 자격 가능)" : ""}`);
  }
  if (u.totalMonthlyCost !== undefined && u.totalMonthlyCost > 0) finLines.push(`- 월 총 비용: ${formatKRW(u.totalMonthlyCost)}`);
  if (u.monthlyProfit !== undefined) {
    const fmt = u.monthlyProfit >= 0 ? `+${formatKRW(u.monthlyProfit)}` : `${formatKRW(u.monthlyProfit)}`;
    finLines.push(`- 월 손익: ${fmt}${u.monthlyProfit < 0 ? " (적자 운영)" : ""}`);
  }
  if (u.primeRatePct !== undefined && u.primeRatePct > 0) finLines.push(`- 프라임코스트(식재료+인건비): ${u.primeRatePct.toFixed(1)}%${u.primeRatePct >= 65 ? " ⚠️ 비용 위기 (안정선 65% 이하)" : ""}`);
  if (u.monthlyCosts) {
    const c = u.monthlyCosts;
    const parts: string[] = [];
    if (c.ingredients) parts.push(`식재료 ${formatKRW(c.ingredients)}`);
    if (c.labor) parts.push(`인건비 ${formatKRW(c.labor)}`);
    if (c.rent) parts.push(`임대료 ${formatKRW(c.rent)}`);
    if (c.utilities) parts.push(`공과금 ${formatKRW(c.utilities)}`);
    if (c.marketing) parts.push(`마케팅 ${formatKRW(c.marketing)}`);
    if (c.sga) parts.push(`SGA ${formatKRW(c.sga)}`);
    if (parts.length > 0) finLines.push(`- 월 비용 내역: ${parts.join(" / ")}`);
  }
  if (finLines.length > 0) sections.push(`[재무 — 자금·매출·손익]\n${finLines.join("\n")}`);

  // 검증 증거 — PSST 핵심 신호
  const valLines: string[] = [];
  if (u.customerInterviewCount !== undefined) {
    const flag = u.customerInterviewCount === 0 ? " ⚠️ PSST '문제인식' 결격" : u.customerInterviewCount >= 10 ? " 🎯 강력 신호" : "";
    valLines.push(`- 고객 인터뷰 누적: ${u.customerInterviewCount}건${flag}`);
  }
  if (u.productsCount !== undefined) {
    const flag = u.productsCount === 0 ? " ⚠️ MVP 부재 — 솔루션 점수 약화" : u.productsCount >= 3 ? " 🎯 메뉴·제품 다양화" : "";
    valLines.push(`- 등록 제품/메뉴 수: ${u.productsCount}개${flag}`);
  }
  if (u.hasMVP !== undefined) valLines.push(`- 운영 중인 MVP/시제품: ${u.hasMVP ? "있음 (가장 강력한 합격 신호)" : "없음"}`);
  if (valLines.length > 0) sections.push(`[검증 증거 — PSST 핵심 신호]\n${valLines.join("\n")}`);

  // 인력·고용
  const empLines: string[] = [];
  if (u.employeesCount !== undefined) {
    const flag = u.employeesCount >= 5 ? " (5인 임계 — 노동법 적용 + 가점 가능)" : u.employeesCount === 0 ? " (1인 사업)" : "";
    empLines.push(`- 직원 수: ${u.employeesCount}명${flag}`);
  }
  if (u.fourInsuranceEstablished !== undefined) empLines.push(`- 4대보험 가입: ${u.fourInsuranceEstablished ? "완료" : "미가입"}`);
  if (empLines.length > 0) sections.push(`[인력·고용]\n${empLines.join("\n")}`);

  // 마케팅
  const mktLines: string[] = [];
  if (u.marketingCampaignsCount !== undefined) mktLines.push(`- 마케팅 캠페인 누적: ${u.marketingCampaignsCount}건`);
  if (u.marketingMonthlyBudget !== undefined && u.marketingMonthlyBudget > 0) mktLines.push(`- 월 마케팅 예산: ${formatKRW(u.marketingMonthlyBudget)}`);
  if (mktLines.length > 0) sections.push(`[마케팅 활동]\n${mktLines.join("\n")}`);

  // 인증·가점 후보
  const certLines: string[] = [];
  if (u.hasNorangusan) certLines.push(`- 노란우산공제 가입: 있음 (정책자금 가점)`);
  if (certLines.length > 0) sections.push(`[인증·가점 후보]\n${certLines.join("\n")}`);

  // 시스템 사전 매칭
  const sysLines: string[] = [];
  if (u.matchScore !== undefined) sysLines.push(`- 시스템 사전 매칭 점수: ${u.matchScore}/100 (deterministic, 참고용)`);
  if (u.eligible !== undefined) sysLines.push(`- 시스템 자격 판정: ${u.eligible ? "충족" : "미충족"}`);
  if (sysLines.length > 0) sections.push(`[시스템 사전 매칭]\n${sysLines.join("\n")}`);

  const userContext = sections.length > 0
    ? `📊 사장님 현황 — 검증된 서버 데이터, *이 블록 수치만 인용 가능*. 추가 추측 금지.\n\n${sections.join("\n\n")}`
    : "📊 사장님 데이터 거의 없음 — 점수 40 이하 권장 (정보 부족 = 평가 곤란)";

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

  // 실패는 throw → 게이트가 1회 재시도 후 환불 + 503(failMessage)
  const client = new OpenAI({ apiKey, timeout: 30_000, maxRetries: 3 });
  const text = await withLlmFallback("gpt-5.4-mini", async (model) => {
    const r = await client.chat.completions.create({
      model,
      max_completion_tokens: 900,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(rubric) },
        { role: "user", content: userPrompt },
      ],
    });
    const out = r.choices[0]?.message?.content ?? "";
    if (!out.trim()) throw new EmptyLlmResponseError(model);
    return out;
  });

  const parsed = parseLlmJson<Partial<FundingScore>>(text);

  const score = typeof parsed.score === "number" && Number.isFinite(parsed.score)
    ? Math.max(0, Math.min(100, Math.round(parsed.score)))
    : 50;
  const level: FundingScore["level"] =
    score >= rubric.passingScore ? "high" : score >= 50 ? "medium" : "low";

  const result: FundingScore = {
    score,
    level: ["high", "medium", "low"].includes(parsed.level as string) ? (parsed.level as FundingScore["level"]) : level,
    framework: rubric.framework,
    passingScore: toInt(rubric.passingScore),
    headline: typeof parsed.headline === "string" ? parsed.headline.trim() : "평가 진행됨",
    // iOS 계약(2026-08-19): weight/itemScore 정수·reason 문자열 보장 (LLM 이 문자열/누락으로 줄 수 있음)
    breakdown: normalizeBreakdown(parsed.breakdown, rubric.items.length),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((s) => typeof s === "string").slice(0, 3) : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.filter((s) => typeof s === "string").slice(0, 3) : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements.filter((s) => typeof s === "string").slice(0, 3) : [],
    verdict: typeof parsed.verdict === "string" ? parsed.verdict.trim() : "",
    bonusEligible: Array.isArray(parsed.bonusEligible) ? parsed.bonusEligible.filter((s) => typeof s === "string").slice(0, 5) : [],
    disqualified: Array.isArray(parsed.disqualified) ? parsed.disqualified.filter((s) => typeof s === "string").slice(0, 3) : [],
  };

  return NextResponse.json({ ok: true, result, remaining });
}
