import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type FoundOneDatabase = {
  public: {
    Tables: {
      business_profiles: {
        Row: {
          id: string;
          user_id: string;
          industry_category_id: string | null;
          sub_industry_id: string | null;
          startup_type: string | null;
          business_model_id: string | null;
          capital: number | null;
          loan_intent: string | null;
          monthly_fixed_cost_limit: number | null;
          target_open_date: string | null;
          preferred_regions: string[] | null;
          target_customer_types: string[] | null;
          location_priorities: string[] | null;
          has_store: boolean | null;
          employee_plan: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<FoundOneDatabase["public"]["Tables"]["business_profiles"]["Row"]>;
        Update: Partial<FoundOneDatabase["public"]["Tables"]["business_profiles"]["Row"]>;
      };
      roadmaps: {
        Row: {
          id: string;
          user_id: string;
          template_id: string;
          current_stage_code: string;
          progress_percent: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<FoundOneDatabase["public"]["Tables"]["roadmaps"]["Row"]>;
        Update: Partial<FoundOneDatabase["public"]["Tables"]["roadmaps"]["Row"]>;
      };
      stage_decisions: {
        Row: {
          id: string;
          roadmap_id: string;
          stage_code: string;
          selected_primary_option_id: string | null;
          selected_option_ids: string[] | null;
          inputs: Record<string, string | number | boolean | string[] | null> | null;
          notes: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<FoundOneDatabase["public"]["Tables"]["stage_decisions"]["Row"]>;
        Update: Partial<FoundOneDatabase["public"]["Tables"]["stage_decisions"]["Row"]>;
      };
      stage_tasks: {
        Row: {
          id: string;
          roadmap_id: string;
          stage_code: string;
          task_code: string;
          title: string;
          status: string;
          required: boolean;
          estimated_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<FoundOneDatabase["public"]["Tables"]["stage_tasks"]["Row"]>;
        Update: Partial<FoundOneDatabase["public"]["Tables"]["stage_tasks"]["Row"]>;
      };
      knowledge_items: {
        Row: {
          id: string;
          item_key: string;
          item_type: string;
          domain: string;
          title: string;
          summary: string | null;
          payload: Record<string, unknown>;
          freshness_status: "fresh" | "review_soon" | "stale" | "blocked";
          last_checked_at: string | null;
          next_review_at: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<FoundOneDatabase["public"]["Tables"]["knowledge_items"]["Row"]>;
        Update: Partial<FoundOneDatabase["public"]["Tables"]["knowledge_items"]["Row"]>;
      };
      knowledge_item_sources: {
        Row: {
          id: string;
          knowledge_item_id: string;
          source_name: string;
          source_url: string;
          verified_at: string;
          expires_at: string | null;
          confidence: "high" | "medium" | "low";
          created_at: string;
        };
        Insert: Partial<FoundOneDatabase["public"]["Tables"]["knowledge_item_sources"]["Row"]>;
        Update: Partial<FoundOneDatabase["public"]["Tables"]["knowledge_item_sources"]["Row"]>;
      };
      knowledge_refresh_reviews: {
        Row: {
          id: string;
          knowledge_item_id: string;
          review_status: string;
          review_method: string;
          summary: string | null;
          reviewed_at: string;
          reviewer_user_id: string | null;
          snapshot: Record<string, unknown>;
        };
        Insert: Partial<FoundOneDatabase["public"]["Tables"]["knowledge_refresh_reviews"]["Row"]>;
        Update: Partial<FoundOneDatabase["public"]["Tables"]["knowledge_refresh_reviews"]["Row"]>;
      };
      market_location_signals: {
        Row: {
          id: string;
          region_key: string;
          region_name: string;
          district_name: string | null;
          category_id: string | null;
          search_keywords: string[];
          market_style: string;
          rent_band: string;
          competition_level: string;
          demand_level: string;
          access_level: string;
          category_fit_level: string;
          base_score: number;
          summary: string | null;
          evidence: Record<string, unknown>;
          freshness_status: "fresh" | "review_soon" | "stale" | "blocked";
          last_checked_at: string | null;
          next_review_at: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<FoundOneDatabase["public"]["Tables"]["market_location_signals"]["Row"]>;
        Update: Partial<FoundOneDatabase["public"]["Tables"]["market_location_signals"]["Row"]>;
      };
      financial_benchmarks: {
        Row: {
          id: string;
          category_id: string;
          market_style: string;
          rent_band: string;
          monthly_revenue_low: number;
          monthly_revenue_high: number;
          avg_cogs_rate: number;
          avg_labor_rate: number;
          avg_other_fixed_rate: number;
          monthly_rent_low: number;
          monthly_rent_high: number;
          setup_cost_low: number;
          setup_cost_high: number;
          avg_break_even_months: number;
          avg_daily_customers_low: number | null;
          avg_daily_customers_high: number | null;
          avg_ticket_size: number | null;
          notes: string | null;
          freshness_status: "fresh" | "review_soon" | "stale" | "blocked";
          last_checked_at: string;
          next_review_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<FoundOneDatabase["public"]["Tables"]["financial_benchmarks"]["Row"]>;
        Update: Partial<FoundOneDatabase["public"]["Tables"]["financial_benchmarks"]["Row"]>;
      };
      support_programs: {
        Row: {
          id: string;
          program_key: string;
          category: string;
          name_ko: string;
          name_en: string;
          organizer_ko: string;
          organizer_en: string;
          target_ko: string;
          target_en: string;
          benefit_ko: string;
          benefit_en: string;
          amount: string | null;
          season_ko: string | null;
          season_en: string | null;
          url: string | null;
          for_small_biz: boolean;
          for_franchise: boolean;
          highlight: boolean;
          max_age: number | null;
          business_year_min: number | null;
          business_year_max: number | null;
          industries: string[] | null;
          regions: string[] | null;
          application_status: string;
          application_deadline: string | null;
          application_open_date: string | null;
          required_docs: Record<string, unknown>[];
          eligibility_criteria: Record<string, unknown>;
          freshness_status: "fresh" | "review_soon" | "stale" | "blocked";
          last_checked_at: string | null;
          next_review_at: string | null;
          data_year: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<FoundOneDatabase["public"]["Tables"]["support_programs"]["Row"]>;
        Update: Partial<FoundOneDatabase["public"]["Tables"]["support_programs"]["Row"]>;
      };
      vendor_recommendations: {
        Row: {
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
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<FoundOneDatabase["public"]["Tables"]["vendor_recommendations"]["Row"]>;
        Update: Partial<FoundOneDatabase["public"]["Tables"]["vendor_recommendations"]["Row"]>;
      };
      stage_guide_content: {
        Row: {
          id: string;
          stage_code: string;
          category_id: string | null;
          locale: string;
          summary: string;
          why_now: string | null;
          steps: unknown[];
          cost_range: string | null;
          time_estimate: string | null;
          warnings: unknown[];
          ai_tools: unknown[];
          expert_when: string | null;
          expert_type: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<FoundOneDatabase["public"]["Tables"]["stage_guide_content"]["Row"]>;
        Update: Partial<FoundOneDatabase["public"]["Tables"]["stage_guide_content"]["Row"]>;
      };
      interior_design_guides: {
        Row: {
          id: string;
          category_id: string;
          sub_industry_id: string | null;
          guide_type: "material" | "concept";
          name_ko: string;
          name_en: string | null;
          description_ko: string;
          description_en: string | null;
          icon_name: string | null;
          tags: string[];
          pros: string[] | null;
          cons: string[] | null;
          cost_range_ko: string | null;
          cost_range_en: string | null;
          trend_source: string | null;
          priority: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<FoundOneDatabase["public"]["Tables"]["interior_design_guides"]["Row"]>;
        Update: Partial<FoundOneDatabase["public"]["Tables"]["interior_design_guides"]["Row"]>;
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          notes: string | null;
          tags: string[];
          customer_mode: string;
          total_visits: number;
          total_spent: number;
          last_visit_at: string | null;
          first_visit_at: string | null;
          meta: Record<string, unknown>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<FoundOneDatabase["public"]["Tables"]["customers"]["Row"]>;
        Update: Partial<FoundOneDatabase["public"]["Tables"]["customers"]["Row"]>;
      };
      customer_visits: {
        Row: {
          id: string;
          customer_id: string;
          user_id: string;
          visit_type: string;
          visit_date: string;
          amount: number;
          service_name: string | null;
          staff_name: string | null;
          notes: string | null;
          meta: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<FoundOneDatabase["public"]["Tables"]["customer_visits"]["Row"]>;
        Update: Partial<FoundOneDatabase["public"]["Tables"]["customer_visits"]["Row"]>;
      };
      user_store_data: {
        Row: {
          id: string;
          user_id: string;
          store_name: string | null;
          business_launched: boolean;
          business_launched_date: string | null;
          cpa_decision: string | null;
          tax_settings: Record<string, unknown>;
          monthly_costs: Record<string, unknown>;
          daily_entries: unknown[];
          inventory_items: unknown[];
          employees: unknown[];
          fixed_expenses: unknown[];
          delivery_platforms: unknown[];
          monthly_delivery_sales: Record<string, unknown>;
          products: unknown[];
          unified_products: unknown[];
          service_menu_items: unknown[];
          members: unknown[];
          vendor_selections: Record<string, unknown>;
          vendor_custom_inputs: Record<string, unknown>;
          ops_selections: Record<string, unknown>;
          ops_pos_checks: Record<string, unknown>;
          soft_open_checks: Record<string, unknown>;
          soft_open_pricing: string;
          soft_open_skips: Record<string, unknown>;
          tax_checks: Record<string, unknown>;
          loan_checks: Record<string, unknown>;
          online_platform_sales: Record<string, unknown>;
          online_selected_platforms: unknown[];
          online_selected_courier: string;
          online_monthly_parcels: string;
          cost_history: unknown[];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<FoundOneDatabase["public"]["Tables"]["user_store_data"]["Row"]>;
        Update: Partial<FoundOneDatabase["public"]["Tables"]["user_store_data"]["Row"]>;
      };
    };
  };
};

export function createFoundOneSupabaseClient(
  url: string,
  anonKey: string
): SupabaseClient<FoundOneDatabase> {
  return createClient<FoundOneDatabase>(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  });
}
