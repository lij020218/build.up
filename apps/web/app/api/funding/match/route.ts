import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { getMergedFundingPrograms } from "../../_lib/funding-live";
import {
  getMatchedProgramsV2,
  getRecommendedPrograms,
  getProgramBonusFactors,
  isFundableProgram,
  type MatchCriteria,
  type ProgramMatch,
  type ApplicationStatus,
  type ProgramCategory,
} from "@foundone/shared";

/**
 * Funding Match API — iOS 클라이언트가 사용. 웹은 packages/shared 를 직접 import 하므로 불필요.
 *
 * 단일 엔드포인트로:
 *   1. mode='all'       → 전체 매칭 (마감된 것 제외) — 기본 목록
 *   2. mode='recommend' → 개인화 점수 top-N (자격 충족 + personalFit≥25)
 *
 * 응답은 language(ko|en) 미리 resolve 해서 iOS DTO 가 string 만 다루도록 단순화.
 * 다국어 원본이 필요하면 packages/shared 를 직접 import (웹·서버용).
 *
 * 인증: Supabase Bearer. 매칭 알고리즘은 결정론적이라 LLM 비용 없음 → 일반 한도 충분.
 *
 * 출처:
 *   - apps/web/app/lib/components/surfaces/GuidesView.tsx (113–146): criteria 빌딩
 *   - packages/shared/src/startup-programs.ts (1594–1867): 매칭/추천 알고리즘
 */

type Lang = "ko" | "en";

type RequestBody = {
  criteria: MatchCriteria;
  language?: Lang;
  mode?: "all" | "recommend";
  limit?: number;
};

type ResolvedRequiredDoc = string;

type ResolvedMatchReason = {
  kind: string;
  text: string;
  weight: number;
};

type ResolvedProgram = {
  id: string;
  category: ProgramCategory;
  name: string;
  organizer: string;
  target: string;
  benefit: string;
  amount: string | null;
  season: string;
  url: string;
  forSmallBiz: boolean;
  forFranchise: boolean;
  highlight: boolean;
  dataYear: string;
  applicationStatus: ApplicationStatus;
  applicationDeadline: string | null;
  requiredDocs: ResolvedRequiredDoc[];
  fundingType: string | null;
  loanDetails: {
    limitWon: number | null;
    interestRatePctMin: number | null;
    interestRatePctMax: number | null;
    termMonths: number | null;
  } | null;
  policyFundSubCategory: string | null;
  // ── 차원(필터·배지) 필드 — 웹 카드와 동일 ──
  regions: string[] | null;
  industries: string[] | null;
  maxAge: number | null;
  /** 유리한 점 — 가점 요소 라벨(비수도권·청년·특허·벤처인증 등) */
  bonusFactors: string[];
  // ── match fields ──
  matchScore: number;
  personalFitScore: number;
  eligible: boolean;
  daysUntilDeadline: number | null;
  matchReasons: ResolvedMatchReason[];
};

type ResponseBody = {
  ok: true;
  language: Lang;
  mode: "all" | "recommend";
  programs: ResolvedProgram[];
  stats: {
    total: number;
    eligible: number;
    open: number;
    upcoming: number;
  };
  generatedAt: string;
};

function resolveProgram(p: ProgramMatch, lang: Lang): ResolvedProgram {
  return {
    id: p.id,
    category: p.category,
    name: p.name[lang],
    organizer: p.organizer[lang],
    target: p.target[lang],
    benefit: p.benefit[lang],
    amount: p.amount ?? null,
    season: p.season[lang],
    url: p.url,
    forSmallBiz: p.forSmallBiz,
    forFranchise: p.forFranchise,
    highlight: p.highlight === true,
    dataYear: p.dataYear,
    applicationStatus: p.applicationStatus ?? "upcoming",
    applicationDeadline: p.applicationDeadline ?? null,
    requiredDocs: (p.requiredDocs ?? []).map((d) => d[lang]),
    fundingType: p.fundingType ?? null,
    loanDetails: p.loanDetails
      ? {
          limitWon: p.loanDetails.limitWon ?? null,
          interestRatePctMin: p.loanDetails.interestRatePctMin ?? null,
          interestRatePctMax: p.loanDetails.interestRatePctMax ?? null,
          termMonths: p.loanDetails.termMonths ?? null,
        }
      : null,
    policyFundSubCategory: p.policyFundSubCategory ?? null,
    regions: p.regions ?? null,
    industries: p.industries ?? null,
    maxAge: p.maxAge ?? null,
    bonusFactors: isFundableProgram(p.name.ko, p.category)
      ? getProgramBonusFactors(p.name.ko, p.category).slice(0, 5).map((b) => b.label)
      : [],
    matchScore: p.matchScore,
    personalFitScore: p.personalFitScore,
    eligible: p.eligible,
    daysUntilDeadline: p.daysUntilDeadline ?? null,
    matchReasons: p.matchReasons.map((r) => ({
      kind: r.kind,
      text: r[lang],
      weight: r.weight,
    })),
  };
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const lang: Lang = body.language === "en" ? "en" : "ko";
  const mode: "all" | "recommend" = body.mode === "recommend" ? "recommend" : "all";
  const limit = typeof body.limit === "number" && body.limit > 0 ? Math.min(50, Math.floor(body.limit)) : 6;
  const criteria: MatchCriteria = body.criteria ?? {};

  // 라이브(기업마당+K-Startup) + 큐레이션 병합 — 웹 GuidesView 와 동일 데이터(파리티). 폴백 안전.
  const { programs: pool } = await getMergedFundingPrograms();

  let matched: ProgramMatch[];
  if (mode === "recommend") {
    matched = getRecommendedPrograms(criteria, limit, 25, pool);
  } else {
    // 마감된 프로그램은 숨김 (웹 GuidesView 와 동일)
    matched = getMatchedProgramsV2(criteria, pool).filter((p) => p.applicationStatus !== "closed");
  }

  const programs = matched.map((p) => resolveProgram(p, lang));

  const stats = {
    total: programs.length,
    eligible: programs.filter((p) => p.eligible).length,
    open: programs.filter((p) => p.applicationStatus === "open").length,
    upcoming: programs.filter((p) => p.applicationStatus === "upcoming").length,
  };

  const responseBody: ResponseBody = {
    ok: true,
    language: lang,
    mode,
    programs,
    stats,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(responseBody, {
    headers: {
      // 5 분 짧은 캐시 — criteria 가 비슷하면 재계산 회피 (vercel edge cache 만 사용)
      "Cache-Control": "private, max-age=60",
    },
  });
}
