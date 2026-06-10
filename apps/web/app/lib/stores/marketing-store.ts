import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MapPin, Camera, Bike, Search, Carrot, PenLine, MessageCircle, Globe, Smartphone, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MARKETING_CHANNELS, RECOMMENDED_CHANNELS, type MarketingChannelKey } from "@foundone/shared";

// ─── Types ───

// 채널 메타·업종별 추천은 @foundone/shared(marketing-channels.ts) SSOT. 웹은 lucide 아이콘만 덧붙임.
export type MarketingChannel = MarketingChannelKey;
export { RECOMMENDED_CHANNELS };

export type CampaignRecord = {
  id: string;
  channel: MarketingChannel;
  month: string;        // "2026-04"
  spend: number;        // 원
  attributedRevenue?: number;
  note?: string;
};

export type TrendToolRecommendation = {
  name: string;                            // "CapCut", "Midjourney"
  purpose: string;                         // "영상 편집 / 템플릿 적용"
  tier: "free" | "paid" | "freemium";
  url?: string;
};

export type TrendItem = {
  title: string;
  reason: string;
  contentIdea: string;
  format: "reel" | "story" | "short" | "post" | "blog" | "campaign" | "ad";
  hashtags: string[];
  referenceUrl?: string | null;
  /** 실행 플레이북 — 3~5 스텝 구체 액션 (오늘 당장 따라할 수 있게) */
  howToExecute?: string[];
  /** 브랜드 성공 사례 — "애플은 티저로 기대감 빌드업", "스타벅스 시즌 메뉴 공식" 식 */
  strategyExample?: string;
  /** 효과 — "신제품 관심도 상승", "재방문율 20%+" 같은 기대 효과 */
  effectiveness?: string;
  /** 추천 도구 — CapCut, Midjourney, Gemini 등 */
  tools?: TrendToolRecommendation[];
  // ── 2026-05-12 캠페인 사례 모드 추가 (쇼츠 밈 베끼기 → 마케팅 캠페인 학습) ──
  /** 캠페인·광고 운영 브랜드 (예: "Google", "Manus", "도브") */
  brandName?: string;
  /** 캠페인 공식·통용 이름 (예: "Hey Mom", "Manus Launch Demo") */
  campaignName?: string;
  /** 검증된 조회수 — UI 가 신뢰성 신호로 표시 */
  viewCount?: number;
  /**
   * 이 캠페인에서 사장님이 *배워올 점*.
   * "어떻게 따라할지" 가 아니라 "왜 이 사례가 이 업종에 의미 있는지" 강조.
   */
  lesson?: string;
};

export type TrendCache = {
  date: string;
  businessType: string;
  trends: TrendItem[];
};

// ─── Marketing Coaching (가게 맞춤, 하루 1회 생성) ───

export type CoachTool = {
  name: string;
  purpose: string;
  tier: "free" | "paid" | "freemium";
  url?: string;
};

export type CoachAction = {
  priority: "now" | "this-week" | "this-month";
  title: string;
  why: string;
  howToExecute: string[];
  expectedImpact: string;
  tools: CoachTool[];
};

export type CoachCache = {
  /**
   * ISO 주차 키 (예: "2026-W19") — 사용자 요청: 코칭은 *주 1회* 재생성.
   *  과거 일 단위 캐시 (`date: YYYY-MM-DD`) 에서 2026-05-11 전환.
   *  하위호환: 옛 필드 `date` 가 있어도 무시 (다음 주차 시작 시 재생성).
   */
  weekKey: string;
  /** 하위호환 — 옛 캐시 마이그레이션 용도. 새 캐시엔 비워둠. */
  date?: string;
  contextKey: string;    // storeName|subIndustryId|language — 이 조합이 바뀌면 재생성
  actions: CoachAction[];
};

// ─── Marketing Plays (사례·트렌드 → 내 사업 적용, 주 1회 생성) ───

export type PlayTool = { name: string; purpose: string; tier: "free" | "paid" | "freemium"; url?: string };

export type MarketingPlay = {
  /** 검증된 성공사례 기반(case) vs 현재 트렌드 기반(trend) — AI 가 더 유용한 쪽 선택 */
  kind: "case" | "trend";
  title: string;
  source: {
    brand?: string;
    whatHappened: string;
    whyItWorked: string;
    metric?: string;
    url?: string;
  };
  application: {
    steps: string[];
    expectedEffect: string;
    effortLevel: "low" | "medium" | "high";
  };
  tools: PlayTool[];
};

export type CasesSource = { name: string; url: string };

export type CasesCache = {
  weekKey: string;
  contextKey: string;    // storeName|subIndustryId|language
  plays: MarketingPlay[];
  sources: CasesSource[];
};

// ─── First 100 Customers Playbook ───

export type PlaybookTacticId = string;

export type PlaybookChecklistItem = {
  id: PlaybookTacticId;
  done: boolean;
  completedAt?: string;
};

export type PromoCode = {
  id: string;
  code: string;                       // "LAUNCH50"
  kind: "coupon" | "invite";          // coupon=할인, invite=초대
  discountType: "percent" | "amount" | "free";
  discountValue: number;              // percent=0~100, amount=원, free=0
  description: string;
  usageLimit: number;                 // 0 = 무제한
  usageCount: number;
  createdAt: string;                  // ISO
  expiresAt?: string;                 // ISO, optional
  isActive: boolean;
};

// ─── Channel metadata ───

export type ChannelMeta = {
  key: MarketingChannel;
  label: { ko: string; en: string };
  Icon: LucideIcon;
  iconColor: string;
};

// 키 → lucide 아이콘 (아이콘은 React 컴포넌트라 SSOT(shared)에 못 둠 — 웹에서만 매핑)
const CHANNEL_ICONS: Record<MarketingChannel, LucideIcon> = {
  "naver-place": MapPin,
  "instagram": Camera,
  "delivery-ads": Bike,
  "naver-keyword": Search,
  "daangn": Carrot,
  "blog-review": PenLine,
  "kakao": MessageCircle,
  "google-ads": Globe,
  "meta-ads": Smartphone,
  "offline": FileText,
};

// CHANNEL_LIST = SSOT 메타 + lucide 아이콘. 라벨·컬러·순서는 shared 가 결정.
export const CHANNEL_LIST: ChannelMeta[] = MARKETING_CHANNELS.map((c) => ({
  key: c.key,
  label: { ko: c.labelKo, en: c.labelEn },
  Icon: CHANNEL_ICONS[c.key],
  iconColor: c.color,
}));

// ─── Store ───

type MarketingState = {
  campaigns: CampaignRecord[];
  monthlyBudget: number;
  trendCache: TrendCache | null;
  trendLoading: boolean;
  coachCache: CoachCache | null;
  casesCache: CasesCache | null;
  // 캠페인 폼
  campFormOpen: boolean;
  campChannel: MarketingChannel;
  campSpend: string;
  campRevenue: string;
  campNote: string;
  // First 100 customers playbook
  playbookChecklist: PlaybookChecklistItem[];
  promoCodes: PromoCode[];
  currentCustomerCount: number;       // 사용자 수동 입력 (첫 100명 트래커용)
};

type MarketingActions = {
  setCampaigns: (v: CampaignRecord[] | ((prev: CampaignRecord[]) => CampaignRecord[])) => void;
  setMonthlyBudget: (v: number) => void;
  setTrendCache: (v: TrendCache | null) => void;
  setTrendLoading: (v: boolean) => void;
  setCoachCache: (v: CoachCache | null) => void;
  setCasesCache: (v: CasesCache | null) => void;
  setCampFormOpen: (v: boolean) => void;
  setCampChannel: (v: MarketingChannel) => void;
  setCampSpend: (v: string) => void;
  setCampRevenue: (v: string) => void;
  setCampNote: (v: string) => void;
  togglePlaybookTactic: (id: PlaybookTacticId) => void;
  addPromoCode: (code: PromoCode) => void;
  removePromoCode: (id: string) => void;
  incrementPromoUsage: (id: string) => void;
  togglePromoActive: (id: string) => void;
  setCurrentCustomerCount: (n: number) => void;
  /** Supabase 복원용 bulk setter (applyStoreData) — 웹·앱 동기화 */
  setPromoCodes: (v: PromoCode[]) => void;
  setPlaybookChecklist: (v: PlaybookChecklistItem[]) => void;
  resetAll: () => void;
};

const initialState: MarketingState = {
  campaigns: [],
  monthlyBudget: 0,
  trendCache: null,
  trendLoading: false,
  coachCache: null,
  casesCache: null,
  campFormOpen: false,
  campChannel: "instagram",
  campSpend: "",
  campRevenue: "",
  campNote: "",
  playbookChecklist: [],
  promoCodes: [],
  currentCustomerCount: 0,
};

export const useMarketingStore = create<MarketingState & MarketingActions>()(
  persist(
    (set) => ({
      ...initialState,
      setCampaigns: (v) =>
        set((s) => ({ campaigns: typeof v === "function" ? v(s.campaigns) : v })),
      setMonthlyBudget: (v) => set({ monthlyBudget: v }),
      setTrendCache: (v) => set({ trendCache: v }),
      setTrendLoading: (v) => set({ trendLoading: v }),
      setCoachCache: (v) => set({ coachCache: v }),
      setCasesCache: (v) => set({ casesCache: v }),
      setCampFormOpen: (v) => set({ campFormOpen: v }),
      setCampChannel: (v) => set({ campChannel: v }),
      setCampSpend: (v) => set({ campSpend: v }),
      setCampRevenue: (v) => set({ campRevenue: v }),
      setCampNote: (v) => set({ campNote: v }),
      togglePlaybookTactic: (id) =>
        set((s) => {
          const existing = s.playbookChecklist.find((x) => x.id === id);
          if (existing) {
            return {
              playbookChecklist: s.playbookChecklist.map((x) =>
                x.id === id ? { ...x, done: !x.done, completedAt: !x.done ? new Date().toISOString() : undefined } : x
              ),
            };
          }
          return {
            playbookChecklist: [...s.playbookChecklist, { id, done: true, completedAt: new Date().toISOString() }],
          };
        }),
      setPromoCodes: (v) => set({ promoCodes: v }),
      setPlaybookChecklist: (v) => set({ playbookChecklist: v }),
      addPromoCode: (code) => set((s) => ({ promoCodes: [code, ...s.promoCodes] })),
      removePromoCode: (id) => set((s) => ({ promoCodes: s.promoCodes.filter((c) => c.id !== id) })),
      incrementPromoUsage: (id) =>
        set((s) => ({
          promoCodes: s.promoCodes.map((c) =>
            c.id === id ? { ...c, usageCount: c.usageCount + 1 } : c
          ),
        })),
      togglePromoActive: (id) =>
        set((s) => ({
          promoCodes: s.promoCodes.map((c) =>
            c.id === id ? { ...c, isActive: !c.isActive } : c
          ),
        })),
      setCurrentCustomerCount: (n) => set({ currentCustomerCount: Math.max(0, n) }),
      resetAll: () => set(initialState),
    }),
    {
      name: "foundone-marketing",
      partialize: (state) => ({
        campaigns: state.campaigns,
        monthlyBudget: state.monthlyBudget,
        playbookChecklist: state.playbookChecklist,
        promoCodes: state.promoCodes,
        currentCustomerCount: state.currentCustomerCount,
        // AI 응답 캐시 — 비용 절감을 위해 반드시 persist
        trendCache: state.trendCache,
        coachCache: state.coachCache,
        casesCache: state.casesCache,
      }),
    },
  ),
);
