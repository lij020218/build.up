import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Action Agents Store.
 *
 * 역할: Agent 제안(Proposal)의 라이프사이클 관리.
 * - 생성: agent-triggers.ts에서 감지 → 여기에 저장
 * - 표시: useAgentOrchestration → AgentProposalsSection
 * - 소멸: 수락/스킵/만료
 *
 * 다른 스토어와의 관계:
 * - 읽기: profile/finance/operations/cashflow에서 입력 데이터 조회
 * - 쓰기: 기존 스토어(marketing-store.addPromoCode 등)의 액션 호출
 *         → 이 스토어는 쓰기 주체 X, "제안 상태"만 보유.
 */

export type AgentKind = "coupon" | "reorder" | "content" | "review";

export type AgentProposalStatus = "pending" | "accepted" | "skipped" | "expired";

/** 쿠폰 Agent 전용 콘텐츠 */
export type CouponContent = {
  couponCode: string;                    // "SAVE20"
  discountType: "percent" | "amount";
  discountValue: number;
  copyKo: string;                         // 카카오 채널 메시지 (한글)
  copyEn?: string;
  suggestedUsageLimit: number;
  validDays: number;                      // 유효기간 (일)
};

/** 재주문 Agent 전용 콘텐츠 */
export type ReorderContent = {
  itemId: string;
  itemName: string;
  currentQuantity: number;
  recommendedQuantity: number;
  daysUntilStockout: number;
  supplierName: string;
  supplierUrl?: string;
  messageKo: string;                      // 공급처 카톡 초안
  messageEn?: string;
};

/** 콘텐츠 Agent 전용 */
export type ContentContent = {
  occasion: string;                       // "new-record", "weekend-boost", "anniversary"
  postDraftKo: string;
  postDraftEn?: string;
  hashtags: string[];
  format: "post" | "reel" | "story";
};

/** 리뷰 Agent 전용 */
export type ReviewContent = {
  estimatedCardVisitors: number;          // 어제 카드 결제 건수
  reviewPlatform: "naver-place" | "kakao-map" | "google";
  placeholderUrl: string;                  // 사용자가 설정에서 덮어쓰기 가능
  messageKo: string;                      // 고객에게 보낼 메시지
  messageEn?: string;
};

export type AgentProposalContent =
  | ({ kind: "coupon" } & CouponContent)
  | ({ kind: "reorder" } & ReorderContent)
  | ({ kind: "content" } & ContentContent)
  | ({ kind: "review" } & ReviewContent);

export type AgentProposal = {
  id: string;
  kind: AgentKind;
  createdAt: string;
  expiresAt: string;                      // 48h 후
  status: AgentProposalStatus;
  acceptedAt?: string;
  skippedAt?: string;

  /** 트리거 정보 (감지 시점 스냅샷) */
  trigger: {
    type: string;                         // "sales-drop-15", "stock-low-eggs"
    reasonKo: string;
    reasonEn: string;
    metric?: Record<string, number>;
  };

  /** 제안 내용 */
  content: AgentProposalContent;

  /** 예상 임팩트 (KPI 추적용) */
  expectedImpact?: {
    metric: "sales" | "stock" | "awareness" | "reviews";
    valueKo: string;                      // "+₩30~50만원 매출 예상"
    valueEn: string;
  };

  /** AI 생성 여부 (로컬 fallback도 추적) */
  generatedBy: "ai" | "template";
};

type AgentsState = {
  proposals: AgentProposal[];             // 30일 유지 (자동 정리)
  enabledAgents: Record<AgentKind, boolean>;
  lastTriggerCheckAt: string | null;

  // KPI 카운터
  acceptedCount: Record<AgentKind, number>;
  skippedCount: Record<AgentKind, number>;

  // Phase 2 자동실행 설정 (UI만, 지금은 항상 false)
  autoApproveEnabled: Record<AgentKind, boolean>;
  autoApproveLimits: {
    coupon: { maxDiscountPercent: number; maxMonthlyTotal: number; maxValidDays: number };
    reorder: { maxAmountPerOrder: number; maxMonthlyTotal: number };
  };
};

type AgentsActions = {
  addProposal: (p: AgentProposal) => void;
  updateProposalContent: (id: string, content: AgentProposalContent) => void;
  acceptProposal: (id: string) => AgentProposal | null;
  skipProposal: (id: string) => void;
  undoAcceptance: (id: string) => void;
  cleanupExpired: () => void;
  setAgentEnabled: (kind: AgentKind, enabled: boolean) => void;
  /** Supabase 복원용 bulk setter (applyStoreData) — 웹·앱 동기화 */
  setEnabledAgents: (v: Record<AgentKind, boolean>) => void;
  setLastTriggerCheckAt: (iso: string) => void;
  setAutoApproveEnabled: (kind: AgentKind, enabled: boolean) => void;
  resetAll: () => void;
};

const initialKpi: Record<AgentKind, number> = {
  coupon: 0,
  reorder: 0,
  content: 0,
  review: 0,
};

const initialState: AgentsState = {
  proposals: [],
  enabledAgents: {
    coupon: true,
    reorder: true,
    content: true,
    review: true,
  },
  lastTriggerCheckAt: null,
  acceptedCount: { ...initialKpi },
  skippedCount: { ...initialKpi },
  autoApproveEnabled: {
    coupon: false,
    reorder: false,
    content: false,
    review: false,
  },
  autoApproveLimits: {
    coupon: { maxDiscountPercent: 30, maxMonthlyTotal: 300000, maxValidDays: 7 },
    reorder: { maxAmountPerOrder: 200000, maxMonthlyTotal: 1000000 },
  },
};

export const useAgentsStore = create<AgentsState & AgentsActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addProposal: (p) =>
        set((s) => {
          // 중복 방지: 같은 kind의 pending 있으면 스킵
          const duplicate = s.proposals.find(
            (x) => x.kind === p.kind && x.status === "pending" && new Date(x.expiresAt) > new Date()
          );
          if (duplicate) return s;
          return { proposals: [p, ...s.proposals] };
        }),

      updateProposalContent: (id, content) =>
        set((s) => ({
          proposals: s.proposals.map((p) => (p.id === id ? { ...p, content } : p)),
        })),

      acceptProposal: (id) => {
        const proposal = get().proposals.find((p) => p.id === id);
        if (!proposal) return null;
        set((s) => ({
          proposals: s.proposals.map((p) =>
            p.id === id ? { ...p, status: "accepted" as const, acceptedAt: new Date().toISOString() } : p
          ),
          acceptedCount: {
            ...s.acceptedCount,
            [proposal.kind]: s.acceptedCount[proposal.kind] + 1,
          },
        }));
        return proposal;
      },

      skipProposal: (id) =>
        set((s) => {
          const proposal = s.proposals.find((p) => p.id === id);
          if (!proposal) return s;
          return {
            proposals: s.proposals.map((p) =>
              p.id === id ? { ...p, status: "skipped" as const, skippedAt: new Date().toISOString() } : p
            ),
            skippedCount: {
              ...s.skippedCount,
              [proposal.kind]: s.skippedCount[proposal.kind] + 1,
            },
          };
        }),

      undoAcceptance: (id) =>
        set((s) => {
          const proposal = s.proposals.find((p) => p.id === id);
          if (!proposal) return s;
          return {
            proposals: s.proposals.map((p) =>
              p.id === id ? { ...p, status: "pending" as const, acceptedAt: undefined } : p
            ),
            acceptedCount: {
              ...s.acceptedCount,
              [proposal.kind]: Math.max(0, s.acceptedCount[proposal.kind] - 1),
            },
          };
        }),

      cleanupExpired: () =>
        set((s) => {
          const now = new Date();
          const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
          return {
            proposals: s.proposals
              .map((p) => {
                if (p.status === "pending" && new Date(p.expiresAt) < now) {
                  return { ...p, status: "expired" as const };
                }
                return p;
              })
              // 30일 넘은 완료/스킵된 제안은 삭제
              .filter((p) => {
                if (p.status === "pending") return true;
                const ts = new Date(p.acceptedAt ?? p.skippedAt ?? p.createdAt);
                return ts > thirtyDaysAgo;
              }),
          };
        }),

      setAgentEnabled: (kind, enabled) =>
        set((s) => ({
          enabledAgents: { ...s.enabledAgents, [kind]: enabled },
        })),

      setEnabledAgents: (v) => set({ enabledAgents: v }),

      setLastTriggerCheckAt: (iso) => set({ lastTriggerCheckAt: iso }),

      setAutoApproveEnabled: (kind, enabled) =>
        set((s) => ({
          autoApproveEnabled: { ...s.autoApproveEnabled, [kind]: enabled },
        })),

      resetAll: () => set(initialState),
    }),
    {
      name: "foundone-agents",
      partialize: (state) => ({
        proposals: state.proposals,
        enabledAgents: state.enabledAgents,
        lastTriggerCheckAt: state.lastTriggerCheckAt,
        acceptedCount: state.acceptedCount,
        skippedCount: state.skippedCount,
        autoApproveEnabled: state.autoApproveEnabled,
        autoApproveLimits: state.autoApproveLimits,
      }),
    },
  ),
);

// ─── Utility selectors ───

/** 현재 표시 가능한 제안 (pending + 만료 전) — 최신순, 최대 limit */
export function getActiveProposals(proposals: AgentProposal[], limit = 3): AgentProposal[] {
  const now = new Date();
  return proposals
    .filter((p) => p.status === "pending" && new Date(p.expiresAt) > now)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/**
 * Agent 제안 긴급도 점수 (낮을수록 급함).
 * TodaysFocusCard와 AgentProposalsSection에서 공통 사용.
 */
export function agentUrgencyScore(p: AgentProposal): number {
  if (p.kind === "reorder" && p.content.kind === "reorder") {
    return p.content.daysUntilStockout; // 0-7일
  }
  if (p.kind === "coupon") return 5;   // 매출 급락 대응
  if (p.kind === "content") return 10; // 기회성
  if (p.kind === "review") return 15;  // 낮음
  return 20;
}

/** 특정 kind의 쿨다운 확인 — 24h 내 pending, 3일 내 skipped, 7일 내 accepted 있으면 true */
export function isKindOnCooldown(proposals: AgentProposal[], kind: AgentKind, now: Date = new Date()): boolean {
  const cooldownHours = {
    pending: 24,
    skipped: 72,
    accepted: 168,
  };
  for (const p of proposals) {
    if (p.kind !== kind) continue;
    if (p.status === "pending" && new Date(p.expiresAt) > now) {
      const age = (now.getTime() - new Date(p.createdAt).getTime()) / 3600_000;
      if (age < cooldownHours.pending) return true;
    }
    if (p.status === "skipped" && p.skippedAt) {
      const age = (now.getTime() - new Date(p.skippedAt).getTime()) / 3600_000;
      if (age < cooldownHours.skipped) return true;
    }
    if (p.status === "accepted" && p.acceptedAt) {
      const age = (now.getTime() - new Date(p.acceptedAt).getTime()) / 3600_000;
      if (age < cooldownHours.accepted) return true;
    }
  }
  return false;
}
