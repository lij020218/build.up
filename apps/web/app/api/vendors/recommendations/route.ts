import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  loadVendorRecommendations,
  groupVendorsByType,
  type VendorRecommendationGroup
} from "@foundone/shared";

const VALID_STARTUP_TYPES = ["franchise", "independent", "undecided"] as const;
type StartupType = (typeof VALID_STARTUP_TYPES)[number];

function isValidStartupType(value: string): value is StartupType {
  return VALID_STARTUP_TYPES.includes(value as StartupType);
}

export async function GET(request: Request) {
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const client = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const vendors = await loadVendorRecommendations(client, {
      categoryId,
      startupType: startupTypeParam
    });

    const groups: VendorRecommendationGroup[] = groupVendorsByType(vendors);

    return NextResponse.json({ categoryId, startupType: startupTypeParam, groups });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load vendor recommendations." },
      { status: 500 }
    );
  }
}
