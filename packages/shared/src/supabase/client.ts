import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type BuildUpDatabase = {
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
        Insert: Partial<BuildUpDatabase["public"]["Tables"]["business_profiles"]["Row"]>;
        Update: Partial<BuildUpDatabase["public"]["Tables"]["business_profiles"]["Row"]>;
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
        Insert: Partial<BuildUpDatabase["public"]["Tables"]["roadmaps"]["Row"]>;
        Update: Partial<BuildUpDatabase["public"]["Tables"]["roadmaps"]["Row"]>;
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
        Insert: Partial<BuildUpDatabase["public"]["Tables"]["stage_decisions"]["Row"]>;
        Update: Partial<BuildUpDatabase["public"]["Tables"]["stage_decisions"]["Row"]>;
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
        Insert: Partial<BuildUpDatabase["public"]["Tables"]["stage_tasks"]["Row"]>;
        Update: Partial<BuildUpDatabase["public"]["Tables"]["stage_tasks"]["Row"]>;
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
        Insert: Partial<BuildUpDatabase["public"]["Tables"]["knowledge_items"]["Row"]>;
        Update: Partial<BuildUpDatabase["public"]["Tables"]["knowledge_items"]["Row"]>;
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
        Insert: Partial<BuildUpDatabase["public"]["Tables"]["knowledge_item_sources"]["Row"]>;
        Update: Partial<BuildUpDatabase["public"]["Tables"]["knowledge_item_sources"]["Row"]>;
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
        Insert: Partial<BuildUpDatabase["public"]["Tables"]["knowledge_refresh_reviews"]["Row"]>;
        Update: Partial<BuildUpDatabase["public"]["Tables"]["knowledge_refresh_reviews"]["Row"]>;
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
        Insert: Partial<BuildUpDatabase["public"]["Tables"]["market_location_signals"]["Row"]>;
        Update: Partial<BuildUpDatabase["public"]["Tables"]["market_location_signals"]["Row"]>;
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
        Insert: Partial<BuildUpDatabase["public"]["Tables"]["financial_benchmarks"]["Row"]>;
        Update: Partial<BuildUpDatabase["public"]["Tables"]["financial_benchmarks"]["Row"]>;
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
        Insert: Partial<BuildUpDatabase["public"]["Tables"]["vendor_recommendations"]["Row"]>;
        Update: Partial<BuildUpDatabase["public"]["Tables"]["vendor_recommendations"]["Row"]>;
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
        Insert: Partial<BuildUpDatabase["public"]["Tables"]["stage_guide_content"]["Row"]>;
        Update: Partial<BuildUpDatabase["public"]["Tables"]["stage_guide_content"]["Row"]>;
      };
    };
  };
};

export function createBuildUpSupabaseClient(
  url: string,
  anonKey: string
): SupabaseClient<BuildUpDatabase> {
  return createClient<BuildUpDatabase>(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  });
}
