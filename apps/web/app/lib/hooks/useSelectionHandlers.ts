"use client";

import { useState } from "react";
import type { MutableRefObject } from "react";
import {
  buildRoadmapState,
  getIndustryCategoryIdByOptionId,
  getStarterLocationOptions,
  starterRoadmap,
  upsertStageDecision,
  getFranchiseBrandsForSubIndustry,
  getFranchiseBrandsForCategory,
  saveStoreData,
  type RecommendationItem,
  type WorkflowDecisionMap,
} from "@foundone/shared";
import {
  useFinanceStore,
  useAiStore,
  useProfileStore,
  useRoadmapStore,
  useOnboardingStore,
} from "../stores";
import { supabase } from "../../../lib/supabase";
import type { DashboardDeps } from "../types";
import { advanceStageWithChainBackfill, buildTransitionNotice, cloneStarterTaskMap, baseRoadmap } from "../helpers";
import {
  clearLocalUserData,
  resetLocalState,
  applyStoreData,
  collectStoreData,
  hardWipeBuildupStorage,
} from "./usePersistence";

// Re-export pure helpers so callers have a single import point
export { clearLocalUserData, resetLocalState, applyStoreData, collectStoreData, hardWipeBuildupStorage };

// ── Types ──────────────────────────────────────────────────────────────────────

export type SelectionHandlersDeps = DashboardDeps & {
  /** Computed: active industry category id (derived from decisions / profile / store) */
  industryCategoryId: string;
  /** Computed: resolved final selected market object (may be null) */
  finalSelectedMarket: RecommendationItem | null;
  /** Current location selection mode */
  locationMode: "recommended" | "direct";
  /** Ref that tracks the ongoing autosave timer (needed to cancel during resetDemo) */
  autosaveTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  /**
   * usePersistence 가 노출하는 autosave 차단 헬퍼.
   *  ⚠️ usePersistence 내부의 timer ref 는 별도 인스턴스라 위 autosaveTimerRef 로는
   *  못 잡음 → resetDemo 시 반드시 이 함수로 차단해야 race 가 사라진다.
   */
  cancelAllAutosaves: () => void;
  /**
   * Reset 중 동기 차단 플래그. setTimeout 콜백이 fire 할 때도 즉시 차단하기 위해
   *  (cancelAllAutosaves 는 future timer 만 막고, 이미 fire 된 콜백은 못 막음).
   */
  setResetting: (value: boolean) => void;
};

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useSelectionHandlers(deps: SelectionHandlersDeps) {
  const { language, copy, router, industryCategoryId, finalSelectedMarket, autosaveTimerRef, cancelAllAutosaves, setResetting } = deps;

  // ── Profile store ──────────────────────────────────────────────────────────
  const {
    selectedIndustryId,
    selectedSpecialtyId,
    selectedFranchiseBrandId,
    startupType, setStartupType,
    showFranchisePicker, setShowFranchisePicker,
    selectedBusinessModelId,
    selectedBudget,
    selectedOpenDate,
    selectedLocationId,
    preferredRegionInput,
    setSelectedIndustryId,
    setSelectedIndustryCategoryId,
    setSelectedSpecialtyId,
    setSelectedFranchiseBrandId,
    setSelectedBusinessModelId,
    setSelectedBudget,
    setBudgetInputText,
    setSelectedOpenDate,
    setSelectedLocationId,
    setPreferredRegionInput,
    setLocationMode,
    setProfile,
    setBusinessLaunched,
    setBusinessLaunchedDate,
  } = useProfileStore();

  // ── Roadmap store ──────────────────────────────────────────────────────────
  const {
    decisions, setDecisions,
    roadmap, setRoadmap,
    taskMap, setTaskMap,
    setViewingStageId,
    customMarketName,
    customMarketReason,
    setRecommendedMarkets,
    setCustomMarketName,
    setCustomMarketReason,
    setManualMarketEvaluation,
    setManualAlternative,
    setSoftOpenStep,
    setLocationOptions,
    setLocationSourceLabel,
  } = useRoadmapStore();

  // ── Finance store ──────────────────────────────────────────────────────────
  const {
    setShowFinancePanel,
    setFinanceCapitalText,
    setFinanceMonthlyRentText,
    setFinanceLaborText,
    setFinanceRevenueText,
    setFinanceMarketStyle,
    setFinanceRentBand,
    setFinanceStatus,
    setFinanceError,
    setFinanceResult,
    setFinanceInterpretation,
  } = useFinanceStore();

  // ── Onboarding store ───────────────────────────────────────────────────────
  const {
    setIsResetting,
    setResetProgress,
    setPersistenceLabel,
    setPersistenceReady,
    setLastUnlocked,
    setTransitionNotice,
    setShowOnboardingChoice,
  } = useOnboardingStore();

  // ── AI store ───────────────────────────────────────────────────────────────
  // (needed for resetDemo: reset selected guide / contract fields stored in ai-store)
  // We use getState() in resetDemo to avoid reactive subscription overhead

  // ── 진행 초기화 확인 모달 상태 ────────────────────────────────────────────
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleIndustryContinue = () => {
    if (!selectedIndustryId) return;
    const result = advanceStageWithChainBackfill("industry-selection", decisions, roadmap, taskMap, {
      selectedPrimaryOptionId: selectedIndustryId,
      inputs: {
        subIndustryId: selectedIndustryId,
        categoryId: getIndustryCategoryIdByOptionId(selectedIndustryId) ?? "",
        // specialty(세부업종): SPECIALTY_BY_INDUSTRY 분기가 있는 industry 만 값이 채워짐.
        //   stage_decisions.inputs 와 business_profiles.selected_specialty_id 양쪽 모두에 영구화.
        ...(selectedSpecialtyId ? { specialtyId: selectedSpecialtyId } : {}),
      },
    });
    setDecisions(result.decisions);
    setRoadmap(result.roadmap);
    setLastUnlocked(result.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(result.roadmap, language));
  };

  const handleBusinessModelContinue = () => {
    if (!selectedBusinessModelId) return;
    const result = advanceStageWithChainBackfill("business-model", decisions, roadmap, taskMap, {
      selectedPrimaryOptionId: selectedBusinessModelId,
      selectedOptionIds: [selectedBusinessModelId],
    });
    setDecisions(result.decisions);
    setRoadmap(result.roadmap);
    setLastUnlocked(result.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(result.roadmap, language));
  };

  const handleStartupTypeContinue = () => {
    if (!startupType) return;

    // If franchise selected but brand picker not shown yet → show it
    if (startupType === "franchise" && !showFranchisePicker) {
      // ⚠️ 2026-06-27: 세부업종 선택 시 *그 세부업종 매칭만* — categoryId 폴백 금지.
      //   종전엔 매칭 0개면 카테고리 전체로 폴백해 무관 브랜드 오염(스터디카페→눈높이·구몬).
      //   세부업종 자체가 없을 때(selectedIndustryId 없음)만 카테고리 폴백.
      const brands = selectedIndustryId
        ? getFranchiseBrandsForSubIndustry(selectedIndustryId, selectedSpecialtyId)
        : getFranchiseBrandsForCategory(industryCategoryId);
      if (brands.length > 0) {
        setShowFranchisePicker(true);
        return;
      }
    }

    const result = advanceStageWithChainBackfill("startup-type", decisions, roadmap, taskMap, {
      selectedPrimaryOptionId: startupType,
      selectedOptionIds: [startupType],
      inputs: {
        startupType,
        ...(startupType === "franchise" && selectedFranchiseBrandId
          ? { franchiseBrandId: selectedFranchiseBrandId }
          : {}),
      },
    });
    setDecisions(result.decisions);
    setRoadmap(result.roadmap);
    setLastUnlocked(result.newlyUnlockedStageIds);
    setViewingStageId(null);
    setShowFranchisePicker(false);
    setTransitionNotice(buildTransitionNotice(result.roadmap, language));
  };

  const handleBudgetContinue = () => {
    if (!selectedBudget || !selectedOpenDate) return;
    const result = advanceStageWithChainBackfill("budget-setup", decisions, roadmap, taskMap, {
      inputs: {
        capital: selectedBudget,
        targetOpenDate: selectedOpenDate,
      },
    });
    setDecisions(result.decisions);
    setRoadmap(result.roadmap);
    setLastUnlocked(result.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(result.roadmap, language));
  };

  const handleLocationContinue = () => {
    if (!selectedLocationId) return;
    const result = advanceStageWithChainBackfill("location-candidates", decisions, roadmap, taskMap, {
      selectedPrimaryOptionId: selectedLocationId,
      selectedOptionIds: [selectedLocationId],
      inputs: {
        preferredRegion: preferredRegionInput,
        customMarketName,
        customMarketReason,
        selectionMode: deps.locationMode,
        finalMarketTitle: finalSelectedMarket?.title ?? "",
      },
    });
    setDecisions(result.decisions);
    setRoadmap(result.roadmap);
    setLastUnlocked(result.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(result.roadmap, language));
  };

  const handleSignOut = async () => {
    // ⚠️ 2026-05-18: signOut 전 (a) pending autosave 차단 → (b) 마지막 snapshot 즉시 flush →
    //   (c) localStorage cleanup → (d) supabase signOut 순서로 race 방지.
    //   종전엔 clearLocalUserData() 가 먼저 와서 stale data 만 남기고 사장님 입력 손실 위험.
    cancelAllAutosaves();
    try {
      const snapshot = collectStoreData();
      if (snapshot && Object.keys(snapshot).length > 0) {
        await saveStoreData(supabase, snapshot);
      }
    } catch (err) {
      console.warn("[signOut] final flush failed (non-fatal):", err);
    }
    clearLocalUserData();
    resetLocalState();
    await supabase.auth.signOut();
    window.location.assign("/auth"); // hard reload — login도 동일 패턴 (auth/page.tsx:112)
  };

  /** 진행 초기화 버튼 클릭 → 확인 모달 표시 */
  const resetDemo = () => setResetConfirmOpen(true);

  /** 모달 '확인' 클릭 시 실제 초기화 실행 */
  const executeResetDemo = async () => {
    setResetConfirmOpen(false);

    // ── ⓿ Reset race-condition 차단 (가장 먼저, 동기적) ────────────────────
    //  setTimeout 콜백이 fire 할 때 isResettingRef.current 를 검사해 saveRoadmapState
    //  실행을 즉시 막는다. 이게 없으면 reset 도중 자동저장이 fire 되어 saveRoadmapState
    //  → ensureBusinessProfile + roadmaps UPSERT 가 row 를 재생성 → 검증 실패.
    setResetting(true);

    // 초기화 오버레이 표시
    setIsResetting(true);
    setResetProgress(0);

    // ── ① autosave 차단 (timer 클리어) ─────────────────────────────────────
    //  미래 timer 차단. setResetting(true) 가 이미 fire 된 콜백까지 차단.
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    cancelAllAutosaves();
    setPersistenceReady(false);

    // ── ② 서버 풀-와이프 + 검증 ────────────────────────────────────────────
    //  실제로 row 가 지워졌는지 SELECT count 로 확인. 검증 실패 시 사용자에게 명확히 알림.
    setResetProgress(20);
    type WipeReport = {
      apiOk: boolean;
      apiDeleted: number;
      apiFailures: Array<{ table: string; error: string }>;
      clientWipeErrors: Array<{ table: string; error: string }>;
      verifyFailures: Array<{ table: string; remaining: number }>;
      fatalError: string | null;
    };
    const report: WipeReport = {
      apiOk: false,
      apiDeleted: 0,
      apiFailures: [],
      clientWipeErrors: [],
      verifyFailures: [],
      fatalError: null,
    };

    let userId: string | undefined;
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      userId = session.data.session?.user?.id;

      if (!token || !userId) {
        report.fatalError = language === "ko"
          ? "세션이 없어 초기화할 수 없습니다. 다시 로그인 후 시도해 주세요."
          : "No session — please sign in again.";
        throw new Error("NO_SESSION");
      }

      // ── 1차: API 풀-와이프 (service role) ──
      setResetProgress(30);
      const apiStarted = Date.now();
      const res = await fetch("/api/account/reset", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const apiElapsed = Date.now() - apiStarted;
      const data = await res.json().catch(() => ({}));
      report.apiOk = !!data?.ok;
      report.apiDeleted = data?.totalDeleted ?? 0;
      report.apiFailures = data?.failures ?? [];
      // 초기화 표식(tombstone) — API 가 기록한 reset_at 을 *이 기기*가 본 값으로 저장.
      //   이게 없으면 reload 후 connectAndLoad 의 마커 체크가 "다른 기기 초기화"로 오인해 루프.
      if (typeof data?.resetAt === "string") {
        try { localStorage.setItem("__foundone_reset_seen", data.resetAt); } catch { /* */ }
      }

      // ── 2차: client-side 직접 삭제 (RLS 사용) ──
      //  API 가 부분 실패해도 자기 권한으로 핵심 테이블만 다시 시도.
      //  stage_decisions / stage_tasks 는 user_id 가 없고 roadmaps FK cascade 가 처리.
      setResetProgress(50);
      const CORE_TABLES_USERID = [
        "user_store_data",
        "business_profiles",
        "roadmaps",
      ] as const;
      const wipeResults = await Promise.all(
        CORE_TABLES_USERID.map(async (t) => {
          try {
            const { error } = await (supabase as unknown as {
              from: (n: string) => {
                delete: () => {
                  eq: (k: string, v: string) => Promise<{ error: unknown }>;
                };
              };
            })
              .from(t)
              .delete()
              .eq("user_id", userId!);
            return { table: t, error: error ? String((error as { message?: string }).message ?? error) : null };
          } catch (e) {
            return { table: t, error: e instanceof Error ? e.message : String(e) };
          }
        }),
      );
      for (const r of wipeResults) {
        if (r.error) {
          console.warn(`[reset] client wipe failed: ${r.table}`, r.error);
          report.clientWipeErrors.push({ table: r.table, error: r.error });
        }
      }

      // ── 3차: 검증 (SELECT count) ──
      //  진짜 지워졌는지 확인. 0 row 이면 OK, > 0 이면 reset 실패로 간주.
      //  단, RLS GRANT 가 없는 테이블은 SELECT 자체가 42501 → "검증 불가" 로 분류 (실패 아님).
      setResetProgress(70);
      const verifyTables = ["business_profiles", "roadmaps", "user_store_data"] as const;
      const verifyResults = await Promise.all(
        verifyTables.map(async (t) => {
          try {
            const { count, error } = await (supabase as unknown as {
              from: (n: string) => {
                select: (cols: string, opts: { count: "exact"; head: true }) => {
                  eq: (k: string, v: string) => Promise<{ count: number | null; error: unknown }>;
                };
              };
            })
              .from(t)
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId!);
            return { table: t, count: count ?? 0, error };
          } catch (e) {
            return { table: t, count: 0, error: e };
          }
        }),
      );
      for (const r of verifyResults) {
        if (r.error) {
          // 42501 (permission denied) 은 GRANT 누락 — 검증 불가 (실제 wipe 는 service role 로 됐을 수도)
          const code = (r.error as { code?: string })?.code;
          console.warn(`[reset] verify ${r.table}: error code=${code}`, r.error);
          continue;
        }
        if (r.count > 0) {
          report.verifyFailures.push({ table: r.table, remaining: r.count });
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "NO_SESSION") {
        report.fatalError = error.message;
      }
      console.error("[reset] phase ② error", error);
    }

    // ── 검증 실패 시 reload 차단 ───────────────────────────────────────────
    //  fatalError 또는 verifyFailures 가 있으면 사용자에게 명확히 알리고 reload 안 함.
    //  "진짜 지워졌는지 확인 못함" 상태로 사용자가 다시 로그인 화면 보는 것 방지.
    if (report.fatalError) {
      console.error("[reset] FATAL", report);
      setIsResetting(false);
      setResetProgress(0);
      window.alert(
        language === "ko"
          ? `초기화 실패: ${report.fatalError}\n\n다시 시도해 주세요.`
          : `Reset failed: ${report.fatalError}\n\nPlease retry.`,
      );
      return;
    }
    if (report.verifyFailures.length > 0) {
      console.error("[reset] VERIFY FAILED", report);
      setIsResetting(false);
      setResetProgress(0);
      const failed = report.verifyFailures.map((f) => `${f.table} (${f.remaining}건 남음)`).join(", ");
      window.alert(
        language === "ko"
          ? `초기화 검증 실패 — 일부 데이터가 남아있습니다: ${failed}\n\n` +
            `Supabase RLS GRANT 설정을 확인해 주세요. (브라우저 console 에 상세 로그 있음)`
          : `Reset verification failed — data remains: ${failed}\n\n` +
            `Check Supabase RLS GRANT setup. (See browser console.)`,
      );
      return;
    }
    if (report.apiFailures.length > 0 || report.clientWipeErrors.length > 0) {
      // API/client wipe 일부 실패했지만 verify 통과 = 부분적으로 다른 경로로 정리됨
      console.warn("[reset] partial errors but verified empty", report);
    }

    setPersistenceLabel(
      language === "ko"
        ? `초기화 완료 — 서버 ${report.apiDeleted}건 삭제`
        : `Reset complete — ${report.apiDeleted} rows deleted on server`,
    );

    // ── ③ 클라이언트 상태 reset ─────────────────────────────────────────────
    setResetProgress(80);
    const nextDecisions: WorkflowDecisionMap = {};
    const nextTasks = cloneStarterTaskMap();
    const nextRoadmap = buildRoadmapState(
      {
        ...baseRoadmap,
        roadmapId:
          roadmap.roadmapId && roadmap.roadmapId !== starterRoadmap.roadmapId
            ? roadmap.roadmapId
            : baseRoadmap.roadmapId,
      },
      nextDecisions,
      nextTasks,
    );

    clearLocalUserData();
    resetLocalState();

    setDecisions(nextDecisions);
    setTaskMap(nextTasks);
    setRoadmap(nextRoadmap);
    setViewingStageId(null);
    setSoftOpenStep(0);
    setSelectedIndustryId(undefined);
    setSelectedIndustryCategoryId("food");
    setSelectedSpecialtyId(undefined);
    setSelectedFranchiseBrandId(null);
    setStartupType(undefined);
    setShowFranchisePicker(false);
    setSelectedBusinessModelId(undefined);
    setSelectedBudget(undefined);
    setBudgetInputText("");
    setSelectedOpenDate(undefined);
    setSelectedLocationId(undefined);
    setPreferredRegionInput("");
    setLocationMode("recommended");
    setRecommendedMarkets([]);
    setCustomMarketName("");
    setCustomMarketReason("");
    setManualMarketEvaluation(null);
    setManualAlternative(null);

    // AI store fields reset via getState() (same pattern as useDashboard)
    const ai = useAiStore.getState();
    ai.setSelectedContractTaskId(undefined);
    ai.setContractText("");
    ai.setContractAnalysisStatus("idle");
    ai.setContractAnalysisError("");
    ai.setContractAnalysis(null);
    ai.setSelectedGuideSectionKey(undefined);
    ai.setGuideQuestion("");
    ai.setGuideQaStatus("idle");
    ai.setGuideQaError("");
    ai.setGuideAnswer(null);

    setShowFinancePanel(false);
    setFinanceCapitalText("");
    setFinanceMonthlyRentText("");
    setFinanceLaborText("");
    setFinanceRevenueText("");
    setFinanceMarketStyle("balanced");
    setFinanceRentBand("mid");
    setFinanceStatus("idle");
    setFinanceError("");
    setFinanceResult(null);
    setFinanceInterpretation(null);
    setLocationOptions(getStarterLocationOptions("food"));
    setLocationSourceLabel(copy.common.starterFallback);

    // Onboarding flags
    useOnboardingStore.getState().setShowProfileDetails(false);
    setStartupType(undefined);
    setLastUnlocked([]);
    setTransitionNotice(null);
    setProfile(null);
    setBusinessLaunched(false);
    setBusinessLaunchedDate(null);
    useOnboardingStore.getState().setShowExistingOnboarding(false);
    useOnboardingStore.getState().setShowAIRoadmapWizard(false);
    setShowOnboardingChoice(true);

    // ── ④ 마지막 hard wipe — Zustand persist 가 위 setter 들로 다시 써넣은 것까지
    //     모두 제거. 다음 마운트에서 store 들은 initialState 로 시작.
    setResetProgress(90);
    try {
      localStorage.removeItem("foundone_onboarding_dismissed");
      localStorage.removeItem("__foundone_uid");
      localStorage.removeItem("__foundone_last_snapshot");
      localStorage.removeItem("__foundone_last_snapshot_at");
    } catch { /* ignore */ }
    hardWipeBuildupStorage();

    // ── ⑤ Force-onboarding 신호 ───────────────────────────────────────────
    //  hardWipe 가 buildup* / __buildup* 키만 지우므로 이름이 다르면 살아남음.
    //  next mount 에서 starter-stage-demo 가 이 키를 즉시 감지 → 무조건 onboarding 첫 화면.
    //  data load·hasIndustry 체크·persist hydration 어떤 것도 우회 가능 — 사용자 의도 명확.
    try {
      localStorage.setItem("pending_force_onboarding", String(Date.now()));
    } catch { /* localStorage disabled — URL 파라미터가 backup */ }

    // ── ⑥ 하드 리로드 → onboarding 화면 강제 노출 ───────────────────────────
    setResetProgress(100);
    setIsResetting(false);
    setResetProgress(0);
    if (typeof window !== "undefined") {
      // location.replace 보다 location.assign 이 더 일관됨 (history stack 의 corner case 회피)
      window.location.assign(`/?reset=${Date.now()}`);
    }
  };

  return {
    handleIndustryContinue,
    handleBusinessModelContinue,
    handleStartupTypeContinue,
    handleBudgetContinue,
    handleLocationContinue,
    handleSignOut,
    resetDemo,
    resetConfirmOpen,
    onResetConfirm: executeResetDemo,
    onResetCancel: () => setResetConfirmOpen(false),
  };
}
