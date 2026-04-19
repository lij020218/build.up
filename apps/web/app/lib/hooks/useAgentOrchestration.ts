"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAgentsStore, getActiveProposals, type AgentProposal } from "../stores/agents-store";
import { useProfileStore } from "../stores/profile-store";
import { useFinanceStore } from "../stores/finance-store";
import { useOperationsStore } from "../stores/operations-store";
import { detectAllTriggers, type TriggerCandidate } from "../services/agent-triggers";
import { fillLocalTemplate } from "../services/agent-content-templates";
import { supabase } from "../../../lib/supabase";

/**
 * Agent 오케스트레이션 훅.
 *
 * 역할:
 * 1. 스토어 데이터 변경 시 트리거 재감지 (debounced, 최소 10분 간격)
 * 2. 로컬 fillable 트리거 → 즉시 proposal 생성
 * 3. AI 필요한 트리거 → pending proposal 생성 후 백그라운드 AI 호출
 * 4. 만료 cleanup (매 mount)
 *
 * 성능:
 * - 트리거 감지는 순수 함수 (저렴)
 * - AI 호출은 백그라운드, UI 블록 안 함
 * - 동일 proposal 중복 방지는 store.addProposal에서 처리
 */

const MIN_CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10분

export function useAgentOrchestration() {
  const industryCategoryId = useProfileStore((s) => s.selectedIndustryCategoryId);
  const businessLaunched = useProfileStore((s) => s.businessLaunched);
  const storeName = useProfileStore((s) => s.storeName);

  const dailyEntries = useFinanceStore((s) => s.dailyEntries);
  const inventory = useOperationsStore((s) => s.inventory);

  const {
    proposals,
    enabledAgents,
    lastTriggerCheckAt,
    addProposal,
    updateProposalContent,
    acceptProposal,
    skipProposal,
    undoAcceptance,
    cleanupExpired,
    setLastTriggerCheckAt,
  } = useAgentsStore();

  const isCheckingRef = useRef(false);

  // 만료 정리 (mount 시 1회)
  useEffect(() => {
    cleanupExpired();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 트리거 감지 (데이터 변경 시 또는 10분 이상 경과 시)
  useEffect(() => {
    if (isCheckingRef.current) return;

    const now = new Date();
    if (lastTriggerCheckAt) {
      const elapsed = now.getTime() - new Date(lastTriggerCheckAt).getTime();
      if (elapsed < MIN_CHECK_INTERVAL_MS) return;
    }

    // 데이터 부족 시 스킵
    if (!industryCategoryId) return;
    if (!businessLaunched && dailyEntries.length === 0) return;

    isCheckingRef.current = true;

    const candidates = detectAllTriggers({
      industryCategoryId,
      dailyEntries,
      inventory,
      existingProposals: proposals,
      businessLaunched,
      now,
    });

    // 비활성화된 agent는 스킵
    const enabledCandidates = candidates.filter((c) => enabledAgents[c.kind]);

    enabledCandidates.forEach((c) => {
      processCandidate(c, {
        industryCategoryId,
        storeName,
        addProposal,
        updateProposalContent,
      });
    });

    setLastTriggerCheckAt(now.toISOString());
    isCheckingRef.current = false;
  }, [
    industryCategoryId,
    businessLaunched,
    storeName,
    dailyEntries,
    inventory,
    enabledAgents,
    // proposals, lastTriggerCheckAt 의존성에서 제외 — 새 proposal이 또 check를 트리거하면 루프
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  const active = useMemo(() => getActiveProposals(proposals, 3), [proposals]);
  const hasMoreBehindTheFold = useMemo(() => {
    const all = proposals.filter((p) => p.status === "pending" && new Date(p.expiresAt) > new Date());
    return all.length > 3 ? all.length - 3 : 0;
  }, [proposals]);

  return {
    active,
    hasMoreBehindTheFold,
    acceptProposal,
    skipProposal,
    undoAcceptance,
  };
}

// ─── Candidate processing ───

async function processCandidate(
  candidate: TriggerCandidate,
  context: {
    industryCategoryId: string;
    storeName: string;
    addProposal: (p: AgentProposal) => void;
    updateProposalContent: (id: string, content: AgentProposal["content"]) => void;
  }
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 48 * 3600_000); // 48h

  // 로컬 템플릿으로 먼저 채움 (AI 실패 시 fallback으로도 사용 가능)
  const localContent = fillLocalTemplate(candidate.kind, candidate.prefilledContent, {
    industryCategoryId: context.industryCategoryId,
  });

  const proposal: AgentProposal = {
    id: `${candidate.kind}-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: candidate.kind,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: "pending",
    trigger: candidate.trigger,
    content: localContent,
    expectedImpact: candidate.expectedImpact,
    generatedBy: candidate.requiresAi ? "ai" : "template",
  };

  // 먼저 proposal을 추가 (즉시 UI 표시)
  context.addProposal(proposal);

  // AI 필요한 것은 백그라운드에서 업그레이드
  if (candidate.requiresAi) {
    void enrichProposalWithAi(proposal, context);
  }
}

async function enrichProposalWithAi(
  proposal: AgentProposal,
  context: {
    industryCategoryId: string;
    storeName: string;
    updateProposalContent: (id: string, content: AgentProposal["content"]) => void;
  }
): Promise<void> {
  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) {
      // 인증 없으면 로컬 fallback 유지 (이미 로컬 템플릿 적용됨)
      return;
    }

    if (proposal.kind === "coupon" && proposal.content.kind === "coupon") {
      const res = await fetch("/api/ai/agents/coupon-copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          industryCategoryId: context.industryCategoryId,
          discountValue: proposal.content.discountValue,
          discountType: proposal.content.discountType,
          validDays: proposal.content.validDays,
          couponCode: proposal.content.couponCode,
          triggerReason: proposal.trigger.reasonKo,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.copyKo || data.copyEn) {
        context.updateProposalContent(proposal.id, {
          ...proposal.content,
          copyKo: data.copyKo || proposal.content.copyKo,
          copyEn: data.copyEn || proposal.content.copyEn,
        });
      }
    } else if (proposal.kind === "content" && proposal.content.kind === "content") {
      const res = await fetch("/api/ai/agents/content-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          industryCategoryId: context.industryCategoryId,
          occasion: proposal.content.occasion,
          storeName: context.storeName,
          contextData: proposal.trigger.metric,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.postDraftKo || data.postDraftEn) {
        context.updateProposalContent(proposal.id, {
          ...proposal.content,
          postDraftKo: data.postDraftKo || proposal.content.postDraftKo,
          postDraftEn: data.postDraftEn || proposal.content.postDraftEn,
          hashtags: data.hashtags?.length ? data.hashtags : proposal.content.hashtags,
        });
      }
    }
  } catch (err) {
    console.error("[Agent AI enrich]", proposal.kind, err);
    // 실패해도 로컬 fallback 유지
  }
}
