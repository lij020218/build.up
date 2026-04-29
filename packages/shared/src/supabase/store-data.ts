import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ensureAccountUser } from "./persistence";

type Client = SupabaseClient;

/**
 * In-memory representation of all user operational/analytics data.
 * Field names match the camelCase keys used in localStorage and React state.
 */
export type UserStoreData = {
  storeName: string;
  businessLaunched: boolean;
  businessLaunchedDate: string | null;
  cpaDecision: string | null;
  taxSettings: { vatType: string; hasEmployees: boolean };
  monthlyCosts: { ingredients: number; labor: number; rent: number; utilities: number; sga: number; marketing: number; other: number; interest: number };
  dailyEntries: unknown[];
  inventoryItems: unknown[];
  employees: unknown[];
  fixedExpenses: unknown[];
  deliveryPlatforms: unknown[];
  monthlyDeliverySales: Record<string, number>;
  products: unknown[];
  unifiedProducts: unknown[];
  serviceMenuItems: unknown[];
  members: unknown[];
  vendorSelections: Record<string, string>;
  vendorCustomInputs: Record<string, string>;
  opsSelections: Record<string, boolean>;
  opsPosChecks: Record<string, boolean>;
  softOpenChecks: Record<string, boolean>;
  softOpenPricing: string;
  softOpenSkips: Record<string, boolean>;
  taxChecks: Record<string, boolean>;
  loanChecks: Record<string, boolean>;
  onlinePlatformSales: Record<string, string>;
  onlineSelectedPlatforms: string[];
  onlineSelectedCourier: string;
  onlineMonthlyParcels: string;
  costHistory: unknown[];
  // AI 생성 결과 (localStorage 소실 방지)
  guideSelections: Record<string, string>;
  aiRoadmapResult: unknown | null;
  selectedInteriorConcept: string | null;
  savedBusinessPlan: unknown | null;
  savedInterviewScript: unknown | null;
  savedInterviewAnalysis: unknown | null;
  // 구독 관리
  usesSubscriptions: boolean;
  subscriptionPlans: unknown[];
  subscribers: unknown[];
  // 마케팅
  marketingCampaigns: unknown[];
  marketingMonthlyBudget: number;
  // 고객 인터뷰 (Mom Test 노트 + AI 패턴 분석) — 사장님이 직접 입력한 데이터, 손실 시 큰 손실
  customerInterviews: unknown[];
  interviewPatternAnalysis: unknown | null;
  // 시간 로그 (Drucker "시간이 어디로 가는지 알라" — 매일 저녁 5분 체크인) — 사장님 직접 입력
  timeLogEntries: unknown[];
  timeLogEnabled: boolean;
  // 현금흐름 설정 (Cash-flow Crunch Tracker) — 사장님 직접 입력, 손실 시 큰 손실
  //   { currentBalance, currentBalanceUpdatedAt, salesChannels[], crisisThresholdDays,
  //     notifyOnCrisis, dailyMorningBriefing, vatReserveEnabled, setupCompletedAt }
  cashflowSettings: Record<string, unknown> | null;
};

// camelCase → snake_case mapping for DB columns
const FIELD_TO_COLUMN: Record<keyof UserStoreData, string> = {
  storeName: "store_name",
  businessLaunched: "business_launched",
  businessLaunchedDate: "business_launched_date",
  cpaDecision: "cpa_decision",
  taxSettings: "tax_settings",
  monthlyCosts: "monthly_costs",
  dailyEntries: "daily_entries",
  inventoryItems: "inventory_items",
  employees: "employees",
  fixedExpenses: "fixed_expenses",
  deliveryPlatforms: "delivery_platforms",
  monthlyDeliverySales: "monthly_delivery_sales",
  products: "products",
  unifiedProducts: "unified_products",
  serviceMenuItems: "service_menu_items",
  members: "members",
  vendorSelections: "vendor_selections",
  vendorCustomInputs: "vendor_custom_inputs",
  opsSelections: "ops_selections",
  opsPosChecks: "ops_pos_checks",
  softOpenChecks: "soft_open_checks",
  softOpenPricing: "soft_open_pricing",
  softOpenSkips: "soft_open_skips",
  taxChecks: "tax_checks",
  loanChecks: "loan_checks",
  onlinePlatformSales: "online_platform_sales",
  onlineSelectedPlatforms: "online_selected_platforms",
  onlineSelectedCourier: "online_selected_courier",
  onlineMonthlyParcels: "online_monthly_parcels",
  costHistory: "cost_history",
  guideSelections: "guide_selections",
  aiRoadmapResult: "ai_roadmap_result",
  selectedInteriorConcept: "selected_interior_concept",
  savedBusinessPlan: "saved_business_plan",
  savedInterviewScript: "saved_interview_script",
  savedInterviewAnalysis: "saved_interview_analysis",
  usesSubscriptions: "uses_subscriptions",
  subscriptionPlans: "subscription_plans",
  subscribers: "subscribers",
  marketingCampaigns: "marketing_campaigns",
  marketingMonthlyBudget: "marketing_monthly_budget",
  customerInterviews: "customer_interviews",
  interviewPatternAnalysis: "interview_pattern_analysis",
  timeLogEntries: "time_log_entries",
  timeLogEnabled: "time_log_enabled",
  cashflowSettings: "cashflow_settings",
};

// snake_case → camelCase reverse mapping
const COLUMN_TO_FIELD: Record<string, keyof UserStoreData> = Object.fromEntries(
  Object.entries(FIELD_TO_COLUMN).map(([k, v]) => [v, k as keyof UserStoreData])
) as Record<string, keyof UserStoreData>;

function toSnakeCase(data: Partial<UserStoreData>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const col = FIELD_TO_COLUMN[key as keyof UserStoreData];
    if (col && value !== undefined) {
      result[col] = value;
    }
  }
  return result;
}

function toCamelCase(row: Record<string, unknown>): UserStoreData {
  const result: Record<string, unknown> = {};
  for (const [col, value] of Object.entries(row)) {
    const field = COLUMN_TO_FIELD[col];
    if (field) {
      result[field] = value;
    }
  }
  return result as UserStoreData;
}

/**
 * Upsert user store data to Supabase.
 * Only sends fields present in the partial — supports granular updates.
 */
export async function saveStoreData(
  client: Client,
  data: Partial<UserStoreData>,
  userOverride?: User
): Promise<void> {
  const user = userOverride ?? (await ensureAccountUser(client));
  const snakeCaseData = toSnakeCase(data);

  const { error } = await client.from("user_store_data").upsert(
    {
      user_id: user.id,
      ...snakeCaseData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw error;
  }
}

/**
 * Load all user store data from Supabase.
 * Returns null if no row exists for this user.
 */
export async function loadStoreData(
  client: Client,
  userOverride?: User
): Promise<UserStoreData | null> {
  const user = userOverride ?? (await ensureAccountUser(client));

  const { data, error } = await client
    .from("user_store_data")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return toCamelCase(data as Record<string, unknown>);
}
