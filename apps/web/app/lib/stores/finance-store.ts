import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FinancialSimulationResult } from "@foundone/shared";
import type { AiStructuredResponse } from "@foundone/ai";
import { getKstDate } from "../utils/business-day";

// ─── Types ───

export type DailyEntry = {
  date: string;
  sales: number;
  customers: number;
  productSales?: Record<string, number>;      // productId → 판매 수량
  planSignups?: Record<string, number>;       // planId → 신규 가입 수
  planChurns?: Record<string, number>;        // planId → 이탈 수
};

export type MonthlyCosts = {
  ingredients: number;    // 매출원가 (= cogs alias. 업종별: 재료비/매입비/서버비)
  labor: number;          // 인건비 (급여·4대보험)
  rent: number;           // 임대료 (월세·관리비)
  utilities: number;      // 공과금 (전기·수도·가스)
  sga: number;            // 운영비 (배달수수료·카드수수료 등)
  marketing: number;      // 마케팅·광고비
  other: number;          // 기타 비용
  interest: number;       // 대출이자 (영업외비용)
};

export type CostSnapshot = MonthlyCosts & { month: string };

/** localStorage에서 읽은 기존 5칸 데이터를 7칸으로 변환 */
function migrateCosts(raw: Record<string, number>): MonthlyCosts {
  // 이미 sga 필드가 있으면 새 7칸 형식
  if ("sga" in raw) {
    return {
      ingredients: raw.ingredients ?? 0,
      labor: raw.labor ?? 0,
      rent: raw.rent ?? 0,
      utilities: raw.utilities ?? 0,
      sga: raw.sga ?? 0,
      marketing: raw.marketing ?? 0,
      other: raw.other ?? 0,
      interest: raw.interest ?? 0,
    };
  }
  // 기존 5칸: other → sga로 매핑 (기존 "기타"는 대부분 운영비)
  return {
    ingredients: raw.ingredients ?? 0,
    labor: raw.labor ?? 0,
    rent: raw.rent ?? 0,
    utilities: raw.utilities ?? 0,
    sga: raw.other ?? 0,
    marketing: 0,
    other: 0,
    interest: 0,
  };
}

// ─── Store ───

type FinanceState = {
  // 재무 시뮬레이션 패널
  showFinancePanel: boolean;
  financeCapitalText: string;
  financeMonthlyRentText: string;
  financeLaborText: string;
  financeRevenueText: string;
  financeMarketStyle: string;
  financeRentBand: string;
  financeStatus: "idle" | "loading" | "error";
  financeError: string;
  financeResult: FinancialSimulationResult | null;
  financeInterpretation: AiStructuredResponse | null;
  // 매출 입력
  dailyEntries: DailyEntry[];
  dailyDateInput: string;
  dailySalesInput: string;
  dailyCustomersInput: string;
  // 월간 비용
  monthlyCosts: MonthlyCosts;
  costHistory: CostSnapshot[];
  costCogsText: string;
  costLaborText: string;
  costRentText: string;
  costUtilitiesText: string;
  costSgaText: string;
  costMarketingText: string;
  costOtherText: string;
  costInterestText: string;
  /** @deprecated 하위 호환용 */
  costIngredientsText?: string;
};

type FinanceActions = {
  setShowFinancePanel: (v: boolean | ((prev: boolean) => boolean)) => void;
  setFinanceCapitalText: (v: string) => void;
  setFinanceMonthlyRentText: (v: string) => void;
  setFinanceLaborText: (v: string) => void;
  setFinanceRevenueText: (v: string) => void;
  setFinanceMarketStyle: (v: string) => void;
  setFinanceRentBand: (v: string) => void;
  setFinanceStatus: (v: "idle" | "loading" | "error") => void;
  setFinanceError: (v: string) => void;
  setFinanceResult: (v: FinancialSimulationResult | null) => void;
  setFinanceInterpretation: (v: AiStructuredResponse | null) => void;
  setDailyEntries: (v: DailyEntry[] | ((prev: DailyEntry[]) => DailyEntry[])) => void;
  setDailyDateInput: (v: string) => void;
  setDailySalesInput: (v: string) => void;
  setDailyCustomersInput: (v: string) => void;
  setMonthlyCosts: (v: MonthlyCosts | ((prev: MonthlyCosts) => MonthlyCosts)) => void;
  setCostHistory: (v: CostSnapshot[] | ((prev: CostSnapshot[]) => CostSnapshot[])) => void;
  setCostCogsText: (v: string) => void;
  setCostLaborText: (v: string) => void;
  setCostRentText: (v: string) => void;
  setCostUtilitiesText: (v: string) => void;
  setCostSgaText: (v: string) => void;
  setCostMarketingText: (v: string) => void;
  setCostOtherText: (v: string) => void;
  setCostInterestText: (v: string) => void;
  /** @deprecated */
  setCostIngredientsText: (v: string) => void;
  resetAll: () => void;
};

const EMPTY_COSTS: MonthlyCosts = { ingredients: 0, labor: 0, rent: 0, utilities: 0, sga: 0, marketing: 0, other: 0, interest: 0 };

const initialState: FinanceState = {
  showFinancePanel: false,
  financeCapitalText: "",
  financeMonthlyRentText: "",
  financeLaborText: "",
  financeRevenueText: "",
  financeMarketStyle: "balanced",
  financeRentBand: "mid",
  financeStatus: "idle",
  financeError: "",
  financeResult: null,
  financeInterpretation: null,
  dailyEntries: [],
  // KST 기준 캘린더 일자 (영업일 컷오프와 별개 — 매출 입력은 기본 오늘 캘린더 일자로 시작)
  // 정확한 영업일 컷오프는 입력 시점에 OperationalDashboard 가 todayStr 로 덮어씀.
  dailyDateInput: (() => {
    try {
      const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" });
      return fmt.format(new Date());
    } catch {
      return getKstDate();
    }
  })(),
  dailySalesInput: "",
  dailyCustomersInput: "",
  monthlyCosts: EMPTY_COSTS,
  costHistory: [],
  costCogsText: "",
  costLaborText: "",
  costRentText: "",
  costUtilitiesText: "",
  costSgaText: "",
  costMarketingText: "",
  costOtherText: "",
  costInterestText: "",
};

export const useFinanceStore = create<FinanceState & FinanceActions>()(
  persist(
    (set) => ({
      ...initialState,

      setShowFinancePanel: (v) => set((s) => ({ showFinancePanel: typeof v === "function" ? v(s.showFinancePanel) : v })),
      setFinanceCapitalText: (v) => set({ financeCapitalText: v }),
      setFinanceMonthlyRentText: (v) => set({ financeMonthlyRentText: v }),
      setFinanceLaborText: (v) => set({ financeLaborText: v }),
      setFinanceRevenueText: (v) => set({ financeRevenueText: v }),
      setFinanceMarketStyle: (v) => set({ financeMarketStyle: v }),
      setFinanceRentBand: (v) => set({ financeRentBand: v }),
      setFinanceStatus: (v) => set({ financeStatus: v }),
      setFinanceError: (v) => set({ financeError: v }),
      setFinanceResult: (v) => set({ financeResult: v }),
      setFinanceInterpretation: (v) => set({ financeInterpretation: v }),
      setDailyEntries: (v) =>
        set((s) => ({ dailyEntries: typeof v === "function" ? v(s.dailyEntries) : v })),
      setDailyDateInput: (v) => set({ dailyDateInput: v }),
      setDailySalesInput: (v) => set({ dailySalesInput: v }),
      setDailyCustomersInput: (v) => set({ dailyCustomersInput: v }),
      setMonthlyCosts: (v) =>
        set((s) => ({ monthlyCosts: typeof v === "function" ? v(s.monthlyCosts) : v })),
      setCostHistory: (v) =>
        set((s) => ({ costHistory: typeof v === "function" ? v(s.costHistory) : v })),
      setCostCogsText: (v) => set({ costCogsText: v }),
      setCostLaborText: (v) => set({ costLaborText: v }),
      setCostRentText: (v) => set({ costRentText: v }),
      setCostUtilitiesText: (v) => set({ costUtilitiesText: v }),
      setCostSgaText: (v) => set({ costSgaText: v }),
      setCostMarketingText: (v) => set({ costMarketingText: v }),
      setCostOtherText: (v) => set({ costOtherText: v }),
      setCostInterestText: (v) => set({ costInterestText: v }),
      setCostIngredientsText: (v) => set({ costCogsText: v }), // alias
      resetAll: () => set(initialState),
    }),
    {
      name: "foundone-finance",
      partialize: (state) => ({
        dailyEntries: state.dailyEntries,
        monthlyCosts: state.monthlyCosts,
        costHistory: state.costHistory,
        costCogsText: state.costCogsText,
        costLaborText: state.costLaborText,
        costRentText: state.costRentText,
        costUtilitiesText: state.costUtilitiesText,
        costSgaText: state.costSgaText,
        costMarketingText: state.costMarketingText,
        costOtherText: state.costOtherText,
        costInterestText: state.costInterestText,
      }),
      // 기존 localStorage 데이터 마이그레이션
      merge: (persistedState, currentState) => {
        const ps = persistedState as Record<string, unknown>;
        const mc = ps.monthlyCosts as Record<string, number> | undefined;
        const migrated = mc ? migrateCosts(mc) : EMPTY_COSTS;

        // costHistory도 마이그레이션
        const rawHistory = (ps.costHistory ?? []) as Array<Record<string, number> & { month: string }>;
        const migratedHistory = rawHistory.map((h) => ({
          ...migrateCosts(h),
          month: h.month,
        }));

        // costIngredientsText → costCogsText 마이그레이션
        const cogsText = (ps.costCogsText as string) || (ps.costIngredientsText as string) || "";

        return {
          ...currentState,
          ...ps,
          monthlyCosts: migrated,
          costHistory: migratedHistory,
          costCogsText: cogsText,
        };
      },
    },
  ),
);
