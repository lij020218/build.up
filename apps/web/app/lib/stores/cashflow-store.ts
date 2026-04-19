import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Cash-flow Crunch Tracker store.
 * 한국 자영업자의 "흑자부도"를 방지하기 위한 14일 현금흐름 예측 데이터.
 *
 * 핵심 모델:
 * - SalesChannel: 채널별 매출 비율 + 정산주기 + 수수료
 * - FixedExpenseSchedule: 월별 고정비 캘린더 (월세, 급여, 대출)
 * - currentBalance: 사용자 수동 입력 현재 통장 잔고
 */

// ─── Channel presets (Korean market) ───

export type SalesChannelId =
  | "cash"           // 현금/계좌이체 — 즉시
  | "card"           // 카드 (PG) — D+2, 수수료 3.3~3.5%
  | "baemin"         // 배민 — D+7, 수수료 6.8%
  | "coupangeats"    // 쿠팡이츠 — D+14, 수수료 9.8%
  | "yogiyo"         // 요기요 — D+7, 수수료 12.5%
  | "naverpay"       // 네이버페이 — D+8, 수수료 3%
  | "kakaopay"       // 카카오페이 — D+2, 수수료 2.9%
  | "naverbooking"   // 네이버 주문 — D+8, 수수료 3.3%
  | "smartstore"     // 네이버 스마트스토어 — D+14, 수수료 5~10%
  | "coupangwing"    // 쿠팡 마켓플레이스 — D+7~14, 수수료 4~10.8%
  | "other";

export type SalesChannel = {
  id: SalesChannelId;
  label: { ko: string; en: string };
  salesRatio: number;          // 0~100 (%) — 전체 매출 중 이 채널 비율
  settlementDays: number;       // 매출 발생부터 정산까지 일수
  commissionRate: number;       // 수수료율 (%) — 플랫폼 수수료
  paymentFeeRate: number;       // 결제 수수료 (%) — PG 수수료
  isActive: boolean;
};

export const CHANNEL_PRESETS: Record<SalesChannelId, Omit<SalesChannel, "salesRatio" | "isActive">> = {
  cash:          { id: "cash",          label: { ko: "현금·계좌이체",      en: "Cash / Transfer" },     settlementDays: 0,  commissionRate: 0,    paymentFeeRate: 0 },
  card:          { id: "card",          label: { ko: "카드 (PG)",          en: "Card (PG)" },           settlementDays: 2,  commissionRate: 0,    paymentFeeRate: 3.3 },
  baemin:        { id: "baemin",        label: { ko: "배민",               en: "Baemin" },              settlementDays: 7,  commissionRate: 6.8,  paymentFeeRate: 3.3 },
  coupangeats:   { id: "coupangeats",   label: { ko: "쿠팡이츠",            en: "Coupang Eats" },        settlementDays: 14, commissionRate: 9.8,  paymentFeeRate: 3.3 },
  yogiyo:        { id: "yogiyo",        label: { ko: "요기요",              en: "Yogiyo" },              settlementDays: 7,  commissionRate: 12.5, paymentFeeRate: 3.3 },
  naverpay:      { id: "naverpay",      label: { ko: "네이버페이",          en: "Naver Pay" },           settlementDays: 8,  commissionRate: 3,    paymentFeeRate: 0 },
  kakaopay:      { id: "kakaopay",      label: { ko: "카카오페이",          en: "Kakao Pay" },           settlementDays: 2,  commissionRate: 2.9,  paymentFeeRate: 0 },
  naverbooking:  { id: "naverbooking",  label: { ko: "네이버 주문·예약",    en: "Naver Booking" },       settlementDays: 8,  commissionRate: 3.3,  paymentFeeRate: 0 },
  smartstore:    { id: "smartstore",    label: { ko: "스마트스토어",        en: "Naver SmartStore" },    settlementDays: 14, commissionRate: 5,    paymentFeeRate: 0 },
  coupangwing:   { id: "coupangwing",   label: { ko: "쿠팡 마켓플레이스",   en: "Coupang Marketplace" }, settlementDays: 10, commissionRate: 7,    paymentFeeRate: 0 },
  other:         { id: "other",         label: { ko: "기타",                en: "Other" },               settlementDays: 3,  commissionRate: 0,    paymentFeeRate: 0 },
};

// ─── Fixed expenses ───

export type FixedExpenseCategory = "rent" | "payroll" | "loan" | "utilities" | "supplies" | "insurance" | "subscription" | "other";

export type FixedExpenseSchedule = {
  id: string;
  label: string;                // "월세", "직원 A 급여" etc.
  amount: number;                // 원
  dayOfMonth: number;            // 1~31
  category: FixedExpenseCategory;
  isActive: boolean;
  notes?: string;
};

// ─── Store ───

type CashflowState = {
  currentBalance: number;                    // 수동 입력 현재 잔고
  currentBalanceUpdatedAt: string | null;    // 마지막 업데이트 시각 (ISO)
  salesChannels: SalesChannel[];
  fixedExpenses: FixedExpenseSchedule[];
  crisisThresholdDays: number;                // 몇 일 내 음수면 경고? 기본 3
  notifyOnCrisis: boolean;
  dailyMorningBriefing: boolean;
  vatReserveEnabled: boolean;                 // 부가세 10% 적립 여부
  setupCompletedAt: string | null;            // 최초 설정 완료 시각 (온보딩 게이팅용)
};

type CashflowActions = {
  setCurrentBalance: (v: number) => void;
  setSalesChannels: (v: SalesChannel[]) => void;
  updateChannelRatio: (id: SalesChannelId, ratio: number) => void;
  toggleChannel: (id: SalesChannelId) => void;
  addFixedExpense: (e: FixedExpenseSchedule) => void;
  updateFixedExpense: (id: string, patch: Partial<FixedExpenseSchedule>) => void;
  removeFixedExpense: (id: string) => void;
  setCrisisThresholdDays: (n: number) => void;
  setNotifyOnCrisis: (v: boolean) => void;
  setDailyMorningBriefing: (v: boolean) => void;
  setVatReserveEnabled: (v: boolean) => void;
  markSetupCompleted: () => void;
  resetAll: () => void;
};

function defaultChannelsForIndustry(): SalesChannel[] {
  // 디폴트는 "현금 10% + 카드 90%" (일반 오프라인 가정)
  return [
    { ...CHANNEL_PRESETS.cash,  salesRatio: 10, isActive: true },
    { ...CHANNEL_PRESETS.card,  salesRatio: 90, isActive: true },
  ];
}

const initialState: CashflowState = {
  currentBalance: 0,
  currentBalanceUpdatedAt: null,
  salesChannels: defaultChannelsForIndustry(),
  fixedExpenses: [],
  crisisThresholdDays: 3,
  notifyOnCrisis: true,
  dailyMorningBriefing: true,
  vatReserveEnabled: false,
  setupCompletedAt: null,
};

export const useCashflowStore = create<CashflowState & CashflowActions>()(
  persist(
    (set) => ({
      ...initialState,
      setCurrentBalance: (v) =>
        set({ currentBalance: Math.max(0, v), currentBalanceUpdatedAt: new Date().toISOString() }),
      setSalesChannels: (v) => set({ salesChannels: v }),
      updateChannelRatio: (id, ratio) =>
        set((s) => ({
          salesChannels: s.salesChannels.map((c) =>
            c.id === id ? { ...c, salesRatio: Math.max(0, Math.min(100, ratio)) } : c
          ),
        })),
      toggleChannel: (id) =>
        set((s) => {
          const existing = s.salesChannels.find((c) => c.id === id);
          if (existing) {
            return {
              salesChannels: s.salesChannels.map((c) =>
                c.id === id ? { ...c, isActive: !c.isActive } : c
              ),
            };
          }
          // 신규 채널 추가 (비활성 상태로)
          const preset = CHANNEL_PRESETS[id];
          return {
            salesChannels: [...s.salesChannels, { ...preset, salesRatio: 0, isActive: true }],
          };
        }),
      addFixedExpense: (e) => set((s) => ({ fixedExpenses: [...s.fixedExpenses, e] })),
      updateFixedExpense: (id, patch) =>
        set((s) => ({
          fixedExpenses: s.fixedExpenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      removeFixedExpense: (id) =>
        set((s) => ({ fixedExpenses: s.fixedExpenses.filter((e) => e.id !== id) })),
      setCrisisThresholdDays: (n) => set({ crisisThresholdDays: Math.max(1, Math.min(14, n)) }),
      setNotifyOnCrisis: (v) => set({ notifyOnCrisis: v }),
      setDailyMorningBriefing: (v) => set({ dailyMorningBriefing: v }),
      setVatReserveEnabled: (v) => set({ vatReserveEnabled: v }),
      markSetupCompleted: () => set({ setupCompletedAt: new Date().toISOString() }),
      resetAll: () => set(initialState),
    }),
    {
      name: "buildup-cashflow",
      partialize: (state) => ({
        currentBalance: state.currentBalance,
        currentBalanceUpdatedAt: state.currentBalanceUpdatedAt,
        salesChannels: state.salesChannels,
        fixedExpenses: state.fixedExpenses,
        crisisThresholdDays: state.crisisThresholdDays,
        notifyOnCrisis: state.notifyOnCrisis,
        dailyMorningBriefing: state.dailyMorningBriefing,
        vatReserveEnabled: state.vatReserveEnabled,
        setupCompletedAt: state.setupCompletedAt,
      }),
    },
  ),
);
