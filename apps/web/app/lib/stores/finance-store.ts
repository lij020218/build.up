import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FinancialSimulationResult } from "@build-up/shared";
import type { AiStructuredResponse } from "@build-up/ai";

// ─── Types ───

export type DailyEntry = { date: string; sales: number; customers: number };
export type MonthlyCosts = { ingredients: number; labor: number; rent: number; utilities: number; other: number };
export type CostSnapshot = MonthlyCosts & { month: string };

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
  costIngredientsText: string;
  costLaborText: string;
  costRentText: string;
  costUtilitiesText: string;
  costOtherText: string;
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
  setCostIngredientsText: (v: string) => void;
  setCostLaborText: (v: string) => void;
  setCostRentText: (v: string) => void;
  setCostUtilitiesText: (v: string) => void;
  setCostOtherText: (v: string) => void;
  resetAll: () => void;
};

const EMPTY_COSTS: MonthlyCosts = { ingredients: 0, labor: 0, rent: 0, utilities: 0, other: 0 };

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
  dailyDateInput: new Date().toISOString().slice(0, 10),
  dailySalesInput: "",
  dailyCustomersInput: "",
  monthlyCosts: EMPTY_COSTS,
  costHistory: [],
  costIngredientsText: "",
  costLaborText: "",
  costRentText: "",
  costUtilitiesText: "",
  costOtherText: "",
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
      setCostIngredientsText: (v) => set({ costIngredientsText: v }),
      setCostLaborText: (v) => set({ costLaborText: v }),
      setCostRentText: (v) => set({ costRentText: v }),
      setCostUtilitiesText: (v) => set({ costUtilitiesText: v }),
      setCostOtherText: (v) => set({ costOtherText: v }),
      resetAll: () => set(initialState),
    }),
    {
      name: "buildup-finance",
      partialize: (state) => ({
        dailyEntries: state.dailyEntries,
        monthlyCosts: state.monthlyCosts,
        costHistory: state.costHistory,
        costIngredientsText: state.costIngredientsText,
        costLaborText: state.costLaborText,
        costRentText: state.costRentText,
        costUtilitiesText: state.costUtilitiesText,
        costOtherText: state.costOtherText,
      }),
    },
  ),
);
