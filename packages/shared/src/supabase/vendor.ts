import type { SupabaseClient } from "@supabase/supabase-js";

type Client = SupabaseClient;

type VendorRow = {
  id: string;
  category_id: string;
  sub_industry_id: string | null;
  startup_type: string;
  vendor_type: string;
  title: string;
  description: string;
  check_items: string[];
  franchise_note: string | null;
  priority: number;
};

export type VendorRecommendation = {
  id: string;
  categoryId: string;
  subIndustryId?: string;
  startupType: "all" | "franchise" | "independent";
  vendorType: string;
  title: string;
  description: string;
  checkItems: string[];
  franchiseNote?: string;
  priority: number;
};

export type VendorRecommendationGroup = {
  vendorType: string;
  items: VendorRecommendation[];
};

// vendor_type 한국어 라벨
export const VENDOR_TYPE_LABELS: Record<string, string> = {
  ingredient: "식재료 공급",
  equipment: "장비 구매/임대",
  interior: "인테리어 업체",
  pos: "POS 시스템",
  packaging: "포장재 공급",
  supplies: "재료/소모품 공급",
  sourcing: "상품 소싱 채널",
  booking: "예약/고객 관리 시스템",
  management: "운영 관리 시스템",
  logistics: "물류/배송 파트너",
  photography: "상품 촬영",
  platform: "판매 플랫폼",
  tools: "운영 툴",
  display: "진열 집기",
  safety: "안전 장비",
  franchise_supplier_check: "프랜차이즈 지정 공급처 확인"
};

function rowToVendor(row: VendorRow): VendorRecommendation {
  return {
    id: row.id,
    categoryId: row.category_id,
    subIndustryId: row.sub_industry_id ?? undefined,
    startupType: row.startup_type as VendorRecommendation["startupType"],
    vendorType: row.vendor_type,
    title: row.title,
    description: row.description,
    checkItems: row.check_items,
    franchiseNote: row.franchise_note ?? undefined,
    priority: row.priority
  };
}

// ─── 업종별 벤더 추천 조회 ────────────────────────────────────────────────────
//
// startup_type: 'franchise' | 'independent' | 'undecided'
//   - franchise  → 'all' + 'franchise' 행 반환
//   - independent → 'all' + 'independent' 행 반환
//   - undecided  → 'all' 행만 반환

export async function loadVendorRecommendations(
  client: Client,
  params: {
    categoryId: string;
    startupType: "franchise" | "independent" | "undecided";
  }
): Promise<VendorRecommendation[]> {
  const startupTypes =
    params.startupType === "franchise"
      ? ["all", "franchise"]
      : params.startupType === "independent"
        ? ["all", "independent"]
        : ["all"];

  const { data, error } = await client
    .from("vendor_recommendations")
    .select("*")
    .eq("category_id", params.categoryId)
    .in("startup_type", startupTypes)
    .order("priority", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as VendorRow[]).map(rowToVendor);
}

// ─── vendor_type별 그룹화 ─────────────────────────────────────────────────────

export function groupVendorsByType(
  vendors: VendorRecommendation[]
): VendorRecommendationGroup[] {
  const grouped: Record<string, VendorRecommendation[]> = {};

  for (const vendor of vendors) {
    if (!grouped[vendor.vendorType]) {
      grouped[vendor.vendorType] = [];
    }
    grouped[vendor.vendorType].push(vendor);
  }

  return Object.entries(grouped).map(([vendorType, items]) => ({
    vendorType,
    items
  }));
}

// ─── vendor_type 라벨 반환 ────────────────────────────────────────────────────

export function getVendorTypeLabel(vendorType: string): string {
  return VENDOR_TYPE_LABELS[vendorType] ?? vendorType;
}
