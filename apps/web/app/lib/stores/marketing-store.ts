import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MapPin, Camera, Bike, Search, Carrot, PenLine, MessageCircle, Globe, Smartphone, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Types ───

export type MarketingChannel =
  | "naver-place" | "instagram" | "delivery-ads" | "naver-keyword"
  | "daangn" | "blog-review" | "kakao" | "google-ads" | "meta-ads" | "offline";

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

export const CHANNEL_LIST: ChannelMeta[] = [
  { key: "naver-place", label: { ko: "네이버 플레이스", en: "Naver Place" }, Icon: MapPin, iconColor: "#059669" },
  { key: "instagram", label: { ko: "인스타그램", en: "Instagram" }, Icon: Camera, iconColor: "#e1306c" },
  { key: "delivery-ads", label: { ko: "배달앱 광고", en: "Delivery Ads" }, Icon: Bike, iconColor: "#2ac1bc" },
  { key: "naver-keyword", label: { ko: "네이버 키워드", en: "Naver Keyword" }, Icon: Search, iconColor: "#03c75a" },
  { key: "daangn", label: { ko: "당근마켓", en: "Daangn" }, Icon: Carrot, iconColor: "#ff7e36" },
  { key: "blog-review", label: { ko: "블로그·체험단", en: "Blog Review" }, Icon: PenLine, iconColor: "#2563eb" },
  { key: "kakao", label: { ko: "카카오톡 채널", en: "KakaoTalk" }, Icon: MessageCircle, iconColor: "#fee500" },
  { key: "google-ads", label: { ko: "구글 애즈", en: "Google Ads" }, Icon: Globe, iconColor: "#4285f4" },
  { key: "meta-ads", label: { ko: "Meta 광고", en: "Meta Ads" }, Icon: Smartphone, iconColor: "#1877f2" },
  { key: "offline", label: { ko: "오프라인 (전단지 등)", en: "Offline" }, Icon: FileText, iconColor: "#64748b" },
];

/** 업종별 추천 채널 (우선순위 순) */
export const RECOMMENDED_CHANNELS: Record<string, MarketingChannel[]> = {
  "food": ["naver-place", "delivery-ads", "instagram", "daangn", "blog-review"],
  "cafe-dessert": ["instagram", "blog-review", "naver-place", "daangn"],
  "retail": ["daangn", "naver-keyword", "instagram"],
  "beauty": ["naver-place", "blog-review", "kakao", "instagram"],
  "pet": ["naver-place", "blog-review", "kakao", "instagram"],
  "fitness": ["daangn", "instagram", "naver-place", "kakao"],
  "education": ["daangn", "instagram", "naver-place", "kakao"],
  "space": ["naver-place", "instagram", "daangn"],
  "online-digital": ["naver-keyword", "meta-ads", "instagram", "google-ads"],
  "startup-tech": ["meta-ads", "google-ads", "instagram", "blog-review"],
  "living-service": ["daangn", "naver-place", "kakao"],
};

// ─── Store ───

type MarketingState = {
  campaigns: CampaignRecord[];
  monthlyBudget: number;
  trendCache: TrendCache | null;
  trendLoading: boolean;
  coachCache: CoachCache | null;
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
      }),
    },
  ),
);
