import { matchPrograms, AiParseError } from "@foundone/ai";
import type { ProgramMatchingResult } from "@foundone/ai";
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getAnthropicApiKey } from "../../../_lib/env";
import { getRequestId, logApiError, logApiEvent } from "../../../_lib/observability";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";
import {
  startupPrograms,
  getMatchedProgramsV2,
} from "@foundone/shared";
import type { MatchCriteria } from "@foundone/shared";

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
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    logApiEvent("warn", {
      area: "ai",
      route,
      requestId,
      event: "auth_failed",
      status: auth.status,
      detail: auth.error,
    });
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimit = await checkSimpleRateLimit({
    key: `programs:${auth.userId}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    logApiEvent("warn", {
      area: "ai",
      route,
      requestId,
      event: "rate_limited",
      userId: auth.userId,
      status: rateLimit.status,
      detail: rateLimit.error,
    });
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
  const dailyLimit = await checkDailyRateLimit({
    userId: auth.userId,
    feature: "programs-match",
    limit: 3,
    message: "오늘 사용량을 초과했습니다. 내일 다시 시도해 주세요.",
  });
  if (!dailyLimit.ok) {
    logApiEvent("warn", {
      area: "ai",
      route,
      requestId,
      event: "rate_limited",
      userId: auth.userId,
      status: dailyLimit.status,
      detail: dailyLimit.error,
    });
    return NextResponse.json({ error: dailyLimit.error }, { status: dailyLimit.status });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI 서비스를 일시적으로 사용할 수 없습니다. 서버를 재시작하거나 관리자에게 문의하세요." },
      { status: 503 }
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
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

  try {
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

    const result = await matchPrograms(programInputs, userProfile, { apiKey });

    return NextResponse.json(result, {
      headers: { "x-request-id": requestId },
    });
  } catch (error) {
    if (error instanceof AiParseError) {
      logApiError(route, "parse_failed", error, {
        requestId,
        userId: auth.userId,
        status: 502,
      });
      return NextResponse.json(
        { error: "AI 응답 파싱 실패.", detail: error.message },
        { status: 502, headers: { "x-request-id": requestId } }
      );
    }

    logApiError(route, "request_failed", error, {
      requestId,
      userId: auth.userId,
      status: 500,
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "프로그램 매칭 중 오류가 발생했습니다.",
      },
      { status: 500, headers: { "x-request-id": requestId } }
    );
  }
}
