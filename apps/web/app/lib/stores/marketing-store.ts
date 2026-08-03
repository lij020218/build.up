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

// ─── Marketing Plays (사례·트렌드 → 내 사업 적용, 주 1회 생성) ───

export type PlayTool = { name: string; purpose: string; tier: "free" | "paid" | "freemium"; url?: string };

/** 복사해 바로 쓰는 실행물 (2026-07-24 v2) — 서버 cases/route.ts PlayDeliverable 와 동일. */
export type PlayDeliverable = {
  kind: "copy" | "guide";
  label: string;
  content: string;
};

export type MarketingPlay = {
  /** 검증된 성공사례 기반(case) vs 현재 트렌드 기반(trend) — AI 가 더 유용한 쪽 선택 */
  kind: "case" | "trend";
  title: string;
  /** v2: 미션 한 문장(명령형) — 첫 화면의 주인공. 구캐시엔 없음(하위호환 optional). */
  mission?: string;
  /** v2: 소요 시간 배지 — "5분 컷" */
  timeLabel?: string;
  /** v2: 복사/저장 버튼이 되는 실행물 */
  deliverables?: PlayDeliverable[];
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

// ─── 주간 밈·챌린지 팩 (전역 주 1회 수집, /api/ai/marketing/meme-pack) ───

/** 서버 MemeItem(api/_lib/marketing-memes.ts)과 동일 형태 — 원본 설명+링크만, 개사 없음. */
export type MemeItem = {
  kind: "meme" | "challenge" | "format";
  title: string;
  originDesc: string;
  originExample?: string;
  originUrl: string;
  sourceName: string;
  publishedAt?: string;
  industryFit: string[];
  effortLabel?: string;
  applyHint: string;
  /** 일간 top-up 으로 추가된 날짜 (YYYY-MM-DD) — 48시간 내면 "NEW" 배지 */
  addedAt?: string;
};

export type MemePackCache = {
  weekKey: string;
  /** 이번 주 팩이 아닐 때 true — UI 는 "지난주 소재" 배지로 정직하게 표시 */
  stale: boolean;
  /** 서버가 이 categoryId 기준으로 fit-우선 정렬해 준 결과 — 업종 바뀌면 재조회 */
  categoryId: string;
  items: MemeItem[];
  generatedAt: string;
  /** 클라이언트 조회 시각 — 일간 top-up 반영 위해 6시간 지나면 재조회 (없는 구캐시는 즉시 재조회) */
  fetchedAt?: string;
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
  casesCache: CasesCache | null;
  memePackCache: MemePackCache | null;
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
  setCasesCache: (v: CasesCache | null) => void;
  setMemePackCache: (v: MemePackCache | null) => void;
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
  casesCache: null,
  memePackCache: null,
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
      setCasesCache: (v) => set({ casesCache: v }),
      setMemePackCache: (v) => set({ memePackCache: v }),
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
      skipHydration: true,
      // v1 (2026-08-03): trendCache·coachCache 제거 — /api/ai/marketing/trends·coach
      // 라우트가 UI 호출자 0 으로 삭제됨. migrate 가 구버전 localStorage 의 잔존 키를 털어낸다.
      version: 1,
      migrate: (persisted) => {
        if (persisted && typeof persisted === "object") {
          const p = persisted as Record<string, unknown>;
          delete p.trendCache;
          delete p.coachCache;
        }
        return persisted as MarketingState & MarketingActions;
      },
      partialize: (state) => ({
        campaigns: state.campaigns,
        monthlyBudget: state.monthlyBudget,
        playbookChecklist: state.playbookChecklist,
        promoCodes: state.promoCodes,
        currentCustomerCount: state.currentCustomerCount,
        // AI 응답 캐시 — 비용 절감을 위해 반드시 persist
        casesCache: state.casesCache,
        memePackCache: state.memePackCache,
      }),
    },
  ),
);
