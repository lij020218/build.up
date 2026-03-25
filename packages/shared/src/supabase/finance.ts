import type { SupabaseClient } from "@supabase/supabase-js";
import type { BuildUpDatabase } from "./client";
import type { FinancialBenchmark } from "../types/finance";
import { buildFinancialSimulation } from "../finance/simulation";
import type {
  FinancialSimulationInput,
  FinancialSimulationResult
} from "../types/finance";

type Client = SupabaseClient<BuildUpDatabase>;
type BenchmarkRow =
  BuildUpDatabase["public"]["Tables"]["financial_benchmarks"]["Row"];

// ─── 행 → 타입 변환 ──────────────────────────────────────────────────────────

function rowToBenchmark(row: BenchmarkRow): FinancialBenchmark {
  return {
    id: row.id,
    categoryId: row.category_id,
    marketStyle: row.market_style,
    rentBand: row.rent_band,
    monthlyRevenueLow: row.monthly_revenue_low,
    monthlyRevenueHigh: row.monthly_revenue_high,
    avgCogsRate: row.avg_cogs_rate,
    avgLaborRate: row.avg_labor_rate,
    avgOtherFixedRate: row.avg_other_fixed_rate,
    monthlyRentLow: row.monthly_rent_low,
    monthlyRentHigh: row.monthly_rent_high,
    setupCostLow: row.setup_cost_low,
    setupCostHigh: row.setup_cost_high,
    avgBreakEvenMonths: row.avg_break_even_months,
    avgDailyCustomersLow: row.avg_daily_customers_low ?? undefined,
    avgDailyCustomersHigh: row.avg_daily_customers_high ?? undefined,
    avgTicketSize: row.avg_ticket_size ?? undefined,
    notes: row.notes ?? undefined,
    freshnessStatus: row.freshness_status,
    lastCheckedAt: row.last_checked_at,
    nextReviewAt: row.next_review_at ?? undefined
  };
}

// ─── 단일 벤치마크 조회 ───────────────────────────────────────────────────────
//
// category_id + market_style + rent_band 조합으로 정확히 매칭.
// 없으면 같은 category_id 내에서 market_style만 맞는 것을 fallback으로 반환.

export async function loadFinancialBenchmark(
  client: Client,
  params: {
    categoryId: string;
    marketStyle: string;
    rentBand: string;
  }
): Promise<FinancialBenchmark | null> {
  // 정확한 3-key 매칭 시도
  const { data: exact, error: exactError } = await client
    .from("financial_benchmarks")
    .select("*")
    .eq("category_id", params.categoryId)
    .eq("market_style", params.marketStyle)
    .eq("rent_band", params.rentBand)
    .maybeSingle();

  if (exactError) throw exactError;
  if (exact) return rowToBenchmark(exact as BenchmarkRow);

  // Fallback: category_id + market_style 매칭 후 임대료 밴드 가장 유사한 것 선택
  const { data: fallback, error: fallbackError } = await client
    .from("financial_benchmarks")
    .select("*")
    .eq("category_id", params.categoryId)
    .eq("market_style", params.marketStyle)
    .order("avg_break_even_months", { ascending: true });

  if (fallbackError) throw fallbackError;

  if (fallback && fallback.length > 0) {
    const sorted = (fallback as BenchmarkRow[]).sort(
      (a, b) =>
        rentBandDistance(a.rent_band, params.rentBand) -
        rentBandDistance(b.rent_band, params.rentBand)
    );
    return rowToBenchmark(sorted[0]);
  }

  // 최후 Fallback: category_id만 매칭
  const { data: categoryOnly, error: categoryError } = await client
    .from("financial_benchmarks")
    .select("*")
    .eq("category_id", params.categoryId)
    .order("avg_break_even_months", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (categoryError) throw categoryError;
  return categoryOnly ? rowToBenchmark(categoryOnly as BenchmarkRow) : null;
}

// rent_band 간 거리 계산 (fallback 정렬용)
function rentBandDistance(a: string, b: string): number {
  const order: Record<string, number> = {
    high: 4,
    "mid-high": 3,
    mid: 2,
    "mid-low": 1,
    low: 0
  };
  return Math.abs((order[a] ?? 2) - (order[b] ?? 2));
}

// ─── 업종별 전체 벤치마크 조회 ────────────────────────────────────────────────
// 카테고리의 모든 상권 유형·임대료 조합 반환 (비교 UI, 범위 표시 등에 활용)

export async function loadBenchmarksByCategory(
  client: Client,
  categoryId: string
): Promise<FinancialBenchmark[]> {
  const { data, error } = await client
    .from("financial_benchmarks")
    .select("*")
    .eq("category_id", categoryId)
    .order("market_style")
    .order("rent_band");

  if (error) throw error;
  return ((data ?? []) as BenchmarkRow[]).map(rowToBenchmark);
}

// ─── 시뮬레이션 실행 (DB 조회 + 계산 통합) ───────────────────────────────────
// 외부에서 가장 자주 사용하게 될 통합 함수

export async function runFinancialSimulation(
  client: Client,
  input: FinancialSimulationInput
): Promise<FinancialSimulationResult> {
  const benchmark = await loadFinancialBenchmark(client, {
    categoryId: input.categoryId,
    marketStyle: input.marketStyle,
    rentBand: input.rentBand
  });

  return buildFinancialSimulation(input, benchmark);
}
