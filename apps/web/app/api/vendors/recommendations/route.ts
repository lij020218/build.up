import { NextResponse } from "next/server";
import {
  loadVendorRecommendations,
  groupVendorsByType,
  type VendorRecommendationGroup
} from "@foundone/shared";
import { requireApiUser } from "../../_lib/auth";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";

const VALID_STARTUP_TYPES = ["franchise", "independent", "undecided"] as const;
type StartupType = (typeof VALID_STARTUP_TYPES)[number];

function isValidStartupType(value: string): value is StartupType {
  return VALID_STARTUP_TYPES.includes(value as StartupType);
}

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({
    key: `vendor-rec:${auth.userId}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  const url = new URL(request.url);
  const categoryId = url.searchParams.get("categoryId")?.trim();
  const startupTypeParam = url.searchParams.get("startupType")?.trim() ?? "undecided";

  if (!categoryId) {
    return NextResponse.json({ error: "categoryId is required." }, { status: 400 });
  }

  if (!isValidStartupType(startupTypeParam)) {
    return NextResponse.json(
      { error: "startupType must be one of: franchise, independent, undecided." },
      { status: 400 }
    );
  }

  const client = getSupabaseAdmin();
  if (!client) return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });

  try {
    const vendors = await loadVendorRecommendations(client as Parameters<typeof loadVendorRecommendations>[0], {
      categoryId,
      startupType: startupTypeParam
    });

    const groups: VendorRecommendationGroup[] = groupVendorsByType(vendors);

    return NextResponse.json({ categoryId, startupType: startupTypeParam, groups });
  } catch {
    return NextResponse.json({ error: "추천 공급처 조회에 실패했습니다." }, { status: 500 });
  }
}
