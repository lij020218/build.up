import { matchPrograms } from "@foundone/ai";
import { NextResponse } from "next/server";
import { getAnthropicApiKey } from "../../../_lib/env";
import { getRequestId, logApiError } from "../../../_lib/observability";
import { runAiFeature } from "../../../_lib/ai-guard";
import { startupPrograms } from "@foundone/shared";

type RequestBody = {
  age?: number;
  region?: string;
  capital?: number;
  industryId?: string;
  industryName?: string;
  businessYears?: number;
  startupType?: string;
  businessStage?: string;
};

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

export async function POST(request: Request) {
  const route = "/api/ai/programs/match";
  const requestId = getRequestId(request);

  // 입력 검증은 게이트(차감) 전에 (2026-08-19 ai-guard 이관 — 한도·환불은 AI_FEATURE_LIMITS "programs-match")
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI 서비스를 일시적으로 사용할 수 없습니다. 서버를 재시작하거나 관리자에게 문의하세요." },
      { status: 503 }
    );
  }

  const userProfile = {
    age: body.age,
    region: body.region,
    capital: body.capital,
    industryId: body.industryId,
    industryName: body.industryName,
    businessYears: body.businessYears,
    startupType: body.startupType,
    businessStage: body.businessStage,
  };

  return runAiFeature(
    { request, feature: "programs-match", failMessage: "프로그램 매칭 중 오류가 발생했습니다. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요." },
    async (ctx) => {
      // Use static programs as input (can be replaced with Supabase load when DB is seeded)
      const programInputs = startupPrograms.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        organizer: p.organizer,
        target: p.target,
        benefit: p.benefit,
        amount: p.amount,
        applicationStatus: p.applicationStatus,
        maxAge: p.maxAge,
        businessYearRange: p.businessYearRange as [number, number] | undefined,
        industries: p.industries,
        regions: p.regions,
        forSmallBiz: p.forSmallBiz,
        forFranchise: p.forFranchise,
      }));

      try {
        const result = await matchPrograms(programInputs, userProfile, { apiKey });
        return NextResponse.json(result, { headers: { "x-request-id": requestId } });
      } catch (error) {
        // 관측 로그만 남기고 다시 throw → 가드가 1회 재시도 후 전액 환불 + 503
        logApiError(route, "request_failed", error, { requestId, userId: ctx.userId, status: 503 });
        throw error;
      }
    },
  );
}
