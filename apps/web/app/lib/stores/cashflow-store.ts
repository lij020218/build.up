import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CASHFLOW_CHANNEL_PRESETS, cashflowDefaultMixForIndustry } from "@foundone/shared";

/**
 * Cash-flow Crunch Tracker store.
 * 한국 자영업자의 "흑자부도"를 방지하기 위한 14일 현금흐름 예측 데이터.
 *
 * 핵심 모델:
 * - SalesChannel: 채널별 매출 비율 + 정산주기 + 수수료
 * - FixedExpenseSchedule: 월별 고정비 캘린더 (월세, 급여, 대출)
 * - currentBalance: 사용자 수동 입력 현재 통장 잔고
 */

// ─── Channel presets (Korean market — 2025-Q1 update) ───
// 출처:
//  - 배민·쿠팡이츠: 2025.04 차등수수료 (2.0~7.8%, 매출 구간별) — 중간 35~80% 구간 6.8% 기본값
//  - 요기요: 4.7~9.7% (배달 중개) — 중간값 7.7% 적용
//  - 카드 PG: 일반 자영업 수수료 2.5~3.5% — 평균 2.9%
//  - 네이버페이/카카오페이: 1.4~3.3% — 일반 가맹점 평균
//  - 정산주기: 기준 영업일, 토·일·공휴일 포함 시 +1~3일 가능

export type SalesChannelId =
  | "cash"           // 현금·계좌이체 — 즉시
  | "card"           // 카드 PG — D+2, 평균 2.9%
  | "baemin"         // 배민 — D+1 (매일정산), 차등 수수료 (기본 6.8%)
  | "coupangeats"    // 쿠팡이츠 — D+1, 차등 수수료 (기본 6.8%) + 익월 환급
  | "yogiyo"         // 요기요 — D+5, 7.7% (페이백 별도)
  | "ttanggyeoyo"    // 땡겨요 (신한) — D+1, 2.0% 저수수료
  | "naverpay"       // 네이버페이 — D+2, 평균 2.5%
  | "kakaopay"       // 카카오페이 — D+2, 평균 2.5%
  | "naverbooking"   // 네이버 주문·예약 — D+2, 3.3%
  | "smartstore"     // 네이버 스마트스토어 — 구매확정+1영업일, 평균 5.85%
  | "coupangwing"    // 쿠팡 (오픈마켓) — 월 2회 정산, 평균 10.8%
  | "other";

export type SalesChannel = {
  id: SalesChannelId;
  label: { ko: string; en: string };
  salesRatio: number;          // 0~100 (%)
  settlementDays: number;       // 매출 발생부터 정산까지 평균 영업일
  commissionRate: number;       // 플랫폼 수수료 (%)
  paymentFeeRate: number;       // 결제 수수료 (%)
  isActive: boolean;
  /** 차등 수수료 안내 — UI 가 ⓘ 툴팁으로 노출 (선택) */
  rateNote?: { ko: string; en: string };
};

export const CHANNEL_PRESETS: Record<SalesChannelId, Omit<SalesChannel, "salesRatio" | "isActive">> =
  CASHFLOW_CHANNEL_PRESETS as Record<SalesChannelId, Omit<SalesChannel, "salesRatio" | "isActive">>;

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

// ─── 매출 집계 기준 (자동수집 채널 중복 방지) ───
//
//  같은 카드매출이 여러 채널에 잡힐 수 있어(PortOne/TossPlace ↔ CODEF 슈퍼셋),
//  사장님이 "어느 경로로 집계할지" 선택한다. 시스템은 선택 경로만 합산해 이중계상을 막는다.
//   - card "individual": PortOne(온라인) + TossPlace(매장) 각각 실시간 합산
//   - card "codef":      여신협회(CODEF) 통합 — 모든 카드 한 번에 (배달앱·타사단말 포함, 하루 지연)
//   - countCashReceipt:  팝빌 현금영수증을 현금매출로 합산할지 (카드결제에도 현금영수증 끊으면 OFF=중복방지)
//  null = 미설정 → 엔진이 연결 채널 기준 스마트 기본값 사용.
export type RevenueBasis = {
  card: "individual" | "codef";
  countCashReceipt: boolean;
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
  revenueBasis: RevenueBasis | null;          // 매출 집계 기준 (null=미설정→스마트 기본)
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
  setRevenueBasis: (v: RevenueBasis) => void;
  markSetupCompleted: () => void;
  /** 업종별 *기본* 채널 믹스로 한 번에 갈아끼우기 — 시트 초기 진입 시 추천 적용. */
  applyIndustryDefaults: (categoryId: string) => void;
  resetAll: () => void;
};

/**
 * 업종별 *기본* 판매 채널 믹스 — 사장님이 설정 시트 처음 열 때 자동 적용.
 *
 *  출처 (2026-05-11 한국시장 평균):
 *   - 외식·카페: 배민·쿠팡이츠 도합 35~50%, 카드 30~50%, 현금 5~15% (소상공인연합·요기요 파트너 리포트)
 *   - 소매·뷰티·펫: 카드 75~85%, 네이버페이/카카오페이 5~10%, 현금 5~10%
 *   - 온라인·이커머스: 스마트스토어·쿠팡 마켓이 매출의 50~70%, 카드 PG 15~25%
 *   - 스타트업·SaaS: 카드 PG (정기결제) 70~85%, 네이버페이·카카오페이 10~15%, 계좌이체 5~10%
 *
 *  ⚠️ 사장님은 언제든 시트에서 비율·채널을 *오버라이드* 가능. 이건 "초기값" 일 뿐.
 */
export function defaultChannelsForIndustry(categoryId?: string): SalesChannel[] {
  // 공유 SSOT(cashflow-presets) 에서 업종 기본 믹스 로드 — iOS 와 숫자 일치.
  return cashflowDefaultMixForIndustry(categoryId) as SalesChannel[];
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
  revenueBasis: null,
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
      setRevenueBasis: (v) => set({ revenueBasis: v }),
      markSetupCompleted: () => set({ setupCompletedAt: new Date().toISOString() }),
      applyIndustryDefaults: (categoryId) =>
        set({ salesChannels: defaultChannelsForIndustry(categoryId) }),
      resetAll: () => set(initialState),
    }),
    {
      name: "foundone-cashflow",
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
        revenueBasis: state.revenueBasis,
      }),
    },
  ),
);
