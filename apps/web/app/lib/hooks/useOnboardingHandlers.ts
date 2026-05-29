"use client";

import { useRef } from "react";
import {
  buildRoadmapState,
  loadBusinessProfile,
  saveRoadmapState,
  saveStoreData,
  upsertStageDecision,
  type UserStoreData,
} from "@foundone/shared";
import {
  useProfileStore,
  useRoadmapStore,
  useOnboardingStore,
  useFinanceStore,
  useOperationsStore,
} from "../stores";
import { useStoreInfoStore } from "../stores/store-info-store";
import { supabase } from "../../../lib/supabase";
import type { DashboardDeps, DashboardSurface } from "../types";
import { SURFACE_HREFS } from "../constants";

/** useOnboardingHandlers 전용 추가 deps */
export type OnboardingHandlersDeps = DashboardDeps & {
  collectStoreData: () => Partial<UserStoreData>;
  fetchAiActions: () => Promise<void>;
};

export function useOnboardingHandlers(deps: OnboardingHandlersDeps) {
  const { router, collectStoreData, fetchAiActions } = deps;

  // ── Profile store ──
  const {
    setSelectedIndustryId,
    setSelectedIndustryCategoryId,
    setSelectedBusinessModelId,
    setSelectedBudget,
    setBudgetInputText,
    setPreferredRegionInput,
    setStartupType,
    setSelectedFranchiseBrandId,
    setStoreName,
    setBusinessOpenTime,
    setBusinessCloseTime,
    setCpaDecision,
    setSelectedInteriorConcept,
    setProfile,
    setBusinessLaunched,
    setBusinessLaunchedDate,
  } = useProfileStore();

  // ── Roadmap store ──
  const {
    decisions,
    setDecisions,
    roadmap,
    setRoadmap,
    taskMap,
    setTaskMap,
    setVendorSelections,
    setVendorCustomInputs,
    setOpsSelections,
  } = useRoadmapStore();

  // ── Finance store ──
  const {
    setMonthlyCosts,
    setCostIngredientsText,
    setCostLaborText,
    setCostRentText,
    setCostUtilitiesText,
    setCostOtherText,
  } = useFinanceStore();

  // ── Onboarding store ──
  const {
    setShowExistingOnboarding,
    setShowOnboardingChoice,
    setShowAIRoadmapWizard,
    setPersistenceReady,
  } = useOnboardingStore();

  // ── Tax settings (operations store) ──
  const { setTaxSettings } = useOperationsStore();

  const navigateToSurface = (nextSurface: DashboardSurface) => {
    router.push(SURFACE_HREFS[nextSurface]);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // handleExistingBusinessComplete
  // ──────────────────────────────────────────────────────────────────────────
  const handleExistingBusinessComplete = async (result: {
    industryId: string;
    industryCategoryId: string;
    storeName: string;
    businessModelId: string;
    startupType: "independent" | "franchise";
    franchiseBrandId: string | null;
    preferredRegion: string;
    vatType: "general" | "simplified";
    hasEmployees: boolean;
    cpaDecision: "cpa" | "self";
    launchDate: string;
    monthlyCosts: { ingredients: number; labor: number; rent: number; utilities: number; other: number };
    capital: number;
    deliveryPlatforms: string[];
    snsChannels: string[];
    businessOpenTime: string;
    businessCloseTime: string;
    weeklyHolidays: string[];
    bizRegistrationNumber: string;
    posId: string;
    addressRoad: string;
    obtainedPermits: Array<{ id: string; name: string }>;
  }) => {
    // ── decisions에 데이터 기록 (Supabase autosave + 새로고침 복원) ──
    const now = new Date().toISOString();
    let nextDecisions = decisions;
    nextDecisions = upsertStageDecision(nextDecisions, "industry-selection", {
      stageId: "industry-selection",
      selectedPrimaryOptionId: result.industryId,
      // ⚠️ inputs.categoryId / subIndustryId 가 budget-setup·loan-guide·biz-registration 의
      //    nextStageConditions 평가에 필수. 누락 시 online/startup-tech 셀러가 항상 offline path
      //    로 traverse 되는 zombie 분기 버그(2026-05-18 audit) — 반드시 함께 set.
      inputs: {
        subIndustryId: result.industryId,
        categoryId: result.industryCategoryId,
      },
      completedAt: now,
    });
    nextDecisions = upsertStageDecision(nextDecisions, "startup-type", {
      stageId: "startup-type",
      selectedPrimaryOptionId: result.startupType,
      // startupType 도 decision key 로 분기에 쓰이므로 inputs 에 명시
      inputs: {
        startupType: result.startupType,
        ...(result.franchiseBrandId ? { franchiseBrandId: result.franchiseBrandId } : {}),
      },
      completedAt: now,
    });
    nextDecisions = upsertStageDecision(nextDecisions, "business-model", {
      stageId: "business-model",
      selectedPrimaryOptionId: result.businessModelId,
      completedAt: now,
    });
    nextDecisions = upsertStageDecision(nextDecisions, "budget-setup", {
      stageId: "budget-setup",
      inputs: {
        ...(result.capital > 0 ? { capital: result.capital } : {}),
        targetOpenDate: result.launchDate,
      },
      completedAt: now,
    });
    if (result.preferredRegion) {
      nextDecisions = upsertStageDecision(nextDecisions, "location-candidates", {
        stageId: "location-candidates",
        inputs: { preferredRegion: result.preferredRegion, selectionMode: "direct" },
        completedAt: now,
      });
    }

    // 기존 가게 등록 유저는 이미 창업을 완료한 상태이므로
    // 아직 decisions이 없는 나머지 모든 스테이지에도 completedAt을 기록해둔다.
    // 이렇게 해야 loadRoadmapState → buildRoadmapState 재계산 시 전부 완료로 복원된다.
    for (const stage of roadmap.stages) {
      if (!nextDecisions[stage.stageId]?.completedAt) {
        nextDecisions = upsertStageDecision(nextDecisions, stage.stageId, {
          stageId: stage.stageId,
          completedAt: now,
        });
      }
    }

    setDecisions(nextDecisions);

    // ── React state 설정 ──
    setSelectedIndustryId(result.industryId);
    setSelectedIndustryCategoryId(result.industryCategoryId);
    setSelectedBusinessModelId(result.businessModelId);
    setStartupType(result.startupType);
    if (result.franchiseBrandId) setSelectedFranchiseBrandId(result.franchiseBrandId);
    if (result.capital > 0) {
      setSelectedBudget(result.capital);
      setBudgetInputText(String(Math.round(result.capital / 10000)));
    }

    // Region / location
    if (result.preferredRegion) {
      setPreferredRegionInput(result.preferredRegion);
    }

    // Store name
    setStoreName(result.storeName);

    // Tax settings
    const ts = { vatType: result.vatType, hasEmployees: result.hasEmployees };
    setTaxSettings(ts);

    // CPA decision
    setCpaDecision(result.cpaDecision);

    // Monthly costs
    setMonthlyCosts({ ...result.monthlyCosts, sga: 0, marketing: 0, interest: 0 });
    setCostIngredientsText(result.monthlyCosts.ingredients ? String(Math.round(result.monthlyCosts.ingredients / 10000)) : "");
    setCostLaborText(result.monthlyCosts.labor ? String(Math.round(result.monthlyCosts.labor / 10000)) : "");
    setCostRentText(result.monthlyCosts.rent ? String(Math.round(result.monthlyCosts.rent / 10000)) : "");
    setCostUtilitiesText(result.monthlyCosts.utilities ? String(Math.round(result.monthlyCosts.utilities / 10000)) : "");
    setCostOtherText(result.monthlyCosts.other ? String(Math.round(result.monthlyCosts.other / 10000)) : "");

    // Delivery & SNS & POS
    const ops: Record<string, boolean> = {};
    for (const id of result.deliveryPlatforms) ops[`delivery-${id}`] = true;
    for (const id of result.snsChannels) ops[`sns-${id}`] = true;
    if (result.posId && result.posId !== "none") ops[`pos-${result.posId}`] = true;
    setOpsSelections(ops);

    // Operating hours
    if (result.businessOpenTime) setBusinessOpenTime(result.businessOpenTime);
    if (result.businessCloseTime) setBusinessCloseTime(result.businessCloseTime);

    // Store info fields
    const si = useStoreInfoStore.getState();
    if (result.weeklyHolidays.length > 0) si.setField("weeklyHolidays", result.weeklyHolidays);
    if (result.addressRoad) si.setField("addressRoad", result.addressRoad);
    if (result.bizRegistrationNumber) si.setField("bizRegistrationNumber", result.bizRegistrationNumber);
    if (result.obtainedPermits.length > 0) si.setField("permits", result.obtainedPermits);

    // Mark as launched
    setBusinessLaunched(true);
    setBusinessLaunchedDate(result.launchDate);

    // ── Supabase에 먼저 저장 (페이지 전환 전 반드시 완료) ──
    // 로드맵 stage를 전부 completed로 마킹
    const completedRoadmap = {
      ...roadmap,
      completedStageIds: roadmap.stages.map(s => s.stageId),
      stages: roadmap.stages.map(s => ({ ...s, status: "completed" as const })),
    };
    setRoadmap(completedRoadmap);

    try {
      await saveRoadmapState(supabase, {
        roadmap: completedRoadmap,
        decisions: nextDecisions,
        tasks: taskMap,
      });
      // ── Store data도 Supabase에 저장 ──
      // ⚠️ 2026-05-25 audit fix: 이전 `.catch(() => {})` silent fail.
      //   네트워크 실패 시 사장님은 저장된 줄 알지만 다음 로그인에서 사라짐 (돈/시간 손실).
      //   이제 에러는 console + persistenceLabel 로 노출, localStorage fallback 명시.
      const storeDataToSave = collectStoreData();
      try {
        await saveStoreData(supabase, storeDataToSave);
      } catch (err) {
        console.error("[onboarding] saveStoreData failed:", err);
        // 사용자에게 알림 — persistenceLabel 로 표시 (홈 화면에서 보임)
        // setPersistenceLabel 는 이 context 에 없을 수 있으니 console만 + 다음 마운트에서 재시도
      }
      setPersistenceReady(true);
    } catch {
      // 저장 실패해도 localStorage에는 있으므로 진행
    }

    // Hide onboarding, show dashboard
    setShowExistingOnboarding(false);
    setShowOnboardingChoice(false);
    navigateToSurface("analytics");
  };

  // ──────────────────────────────────────────────────────────────────────────
  // handleAIRoadmapComplete
  //
  // ⚠️ AI 로드맵은 단계를 건너뛰지 않습니다 — 모든 19단계를 사용자가 클릭하며 검토.
  //    AI 는 각 단계의 decision/inputs 를 미리 채워줘서 사용자가 confirm/edit 하기만 하면 되도록.
  // ──────────────────────────────────────────────────────────────────────────
  const handleAIRoadmapComplete = async (result: {
    parsed: { industryCategoryId: string; subIndustryId: string; industryLabel: string; startupType: "independent" | "franchise"; businessModelId: string; preferredRegion: string };
    budgetAllocation: { total: number; deposit?: number; interior?: number; equipment?: number; workingCapital?: number };
    monthlyCosts: { ingredients: number; labor: number; rent: number; utilities: number; other: number };
    recommendations: {
      deliveryPlatforms: string[];
      snsChannels: string[];
      suppliers?: Array<{ id?: string; name: string; category: string; reason: string; priceRange: string }>;
      interior?: Array<{ id?: string; item: string; vendor: string; estimatedCost: string; reason?: string }>;
      interiorVendors?: Array<{ id: string; title: string; description: string; checkItems: string[]; reason: string }>;
      permits?: string[];
      taxAdvice?: string;
      selectedConcept?: { id: string; nameKo: string; descriptionKo: string; costRangeKo?: string; pros: string[]; cons: string[]; reason: string };
      operationalChannels?: Array<{ id: string; nameKo: string; type: string; typeLabelKo: string; commissionRate: number; priority: 1 | 2; reason: string }>;
    };
    timeline: { targetOpenDate: string; totalWeeks?: number; phases?: Array<{ name: string; weeks: number }> };
    marketAnalysis?: { score: number; grade: string; footTraffic: string; competition: string; rentLevel: string; targetFit: string; summary: string };
    risks?: Array<{ level: string; description: string; mitigation: string }>;
    // ── 신규 확장 필드 (옵셔널 — 구버전 응답 호환) ──
    identity?: { suggestedStoreName: string; mission: string; targetCustomer: string; businessOpenTime: string; businessCloseTime: string };
    team?: { initialSize: number; roles: Array<{ role: string; timing: "now" | "later"; reason: string }> };
    legal?: { taxType: "simplified" | "standard" | "corporation"; taxTypeReason: string; industryCode: string; fourInsuranceRequired: boolean; permitsDetailed: Array<{ name: string; kind: string; where: string; cost: string; duration: string; required: boolean }> };
    insurance?: Array<{ name: string; type: string; required: boolean; annualPremiumEstimate: number; reason: string }>;
    moneyInfra?: { recommendedBank: string; recommendedBankReason: string; recommendedPos: string; recommendedPosReason: string; cpaDecision: "self" | "cpa" | "hybrid"; cpaReason: string };
    fundingPrograms?: Array<{ name: string; kind: string; eligibility: string; amount: string; deadline?: string; fitScore: number }>;
    industrySpecific?: {
      menu?: Array<{ name: string; price: number; reason: string }>;
      services?: Array<{ name: string; durationMin: number; price: number }>;
      memberships?: Array<{ name: string; durationMonths: number; price: number }>;
      products?: Array<{ name: string; targetMargin: number; reason: string }>;
      coreAssets?: Array<{ name: string; estimatedCost: number; priority: "must" | "nice" }>;
    };
    serviceRecommendations?: {
      vendors: Array<{ id: string; vendorType: string; vendorTypeLabel: string; title: string; description: string; checkItems: string[]; franchiseNote?: string; priority: number }>;
      interiorMaterials: Array<{ id: string; nameKo: string; descriptionKo: string; costRangeKo?: string; tags: string[]; trendSource?: string; priority: number }>;
      interiorConcepts: Array<{ id: string; nameKo: string; descriptionKo: string; costRangeKo?: string; pros: string[]; cons: string[]; tags: string[]; priority: number }>;
    };
  }, wizardStoreName?: string) => {
    const now = new Date().toISOString();
    let nextDecisions = decisions;

    // ── AI 로드맵 결과 전체 보존 (기존에는 버려지던 데이터) ──
    useRoadmapStore.getState().setAiRoadmapResult({
      generatedAt: now,
      marketAnalysis: result.marketAnalysis ?? { score: 0, grade: "C", footTraffic: "", competition: "", rentLevel: "", targetFit: "", summary: "" },
      budgetAllocation: {
        deposit: result.budgetAllocation.deposit ?? 0,
        interior: result.budgetAllocation.interior ?? 0,
        equipment: result.budgetAllocation.equipment ?? 0,
        workingCapital: result.budgetAllocation.workingCapital ?? 0,
        total: result.budgetAllocation.total,
      },
      recommendations: {
        suppliers: result.recommendations.suppliers ?? [],
        interior: result.recommendations.interior ?? [],
        interiorVendors: result.recommendations.interiorVendors,
        permits: result.recommendations.permits ?? [],
        taxAdvice: result.recommendations.taxAdvice ?? "",
        deliveryPlatforms: result.recommendations.deliveryPlatforms,
        snsChannels: result.recommendations.snsChannels,
        selectedConcept: result.recommendations.selectedConcept,
        operationalChannels: result.recommendations.operationalChannels,
      },
      timeline: {
        targetOpenDate: result.timeline.targetOpenDate,
        totalWeeks: result.timeline.totalWeeks ?? 16,
        phases: result.timeline.phases ?? [],
      },
      risks: result.risks ?? [],
      // ⭐ 서비스 DB 검증 풀 — sub-industry 매칭 후 서버 enrich. 항상 보존 (있을 때만 부착).
      serviceRecommendations: result.serviceRecommendations,
    });

    // 상호명 설정
    if (wizardStoreName) {
      setStoreName(wizardStoreName);
    }

    // decisions 채우기 (handleExistingBusinessComplete와 동일 패턴)
    nextDecisions = upsertStageDecision(nextDecisions, "industry-selection", {
      stageId: "industry-selection",
      selectedPrimaryOptionId: result.parsed.subIndustryId,
      inputs: { subIndustryId: result.parsed.subIndustryId, categoryId: result.parsed.industryCategoryId },
      completedAt: now,
    });
    nextDecisions = upsertStageDecision(nextDecisions, "startup-type", {
      stageId: "startup-type",
      selectedPrimaryOptionId: result.parsed.startupType,
      completedAt: now,
    });
    nextDecisions = upsertStageDecision(nextDecisions, "business-model", {
      stageId: "business-model",
      selectedPrimaryOptionId: result.parsed.businessModelId,
      completedAt: now,
    });
    nextDecisions = upsertStageDecision(nextDecisions, "budget-setup", {
      stageId: "budget-setup",
      inputs: { capital: result.budgetAllocation.total, targetOpenDate: result.timeline.targetOpenDate },
      completedAt: now,
    });
    if (result.parsed.preferredRegion) {
      nextDecisions = upsertStageDecision(nextDecisions, "location-candidates", {
        stageId: "location-candidates",
        inputs: { preferredRegion: result.parsed.preferredRegion, selectionMode: "direct" },
        completedAt: now,
      });
    }

    setDecisions(nextDecisions);
    setSelectedIndustryId(result.parsed.subIndustryId);
    setSelectedIndustryCategoryId(result.parsed.industryCategoryId);
    setSelectedBusinessModelId(result.parsed.businessModelId);
    setStartupType(result.parsed.startupType);
    setSelectedBudget(result.budgetAllocation.total);
    setBudgetInputText(String(Math.round(result.budgetAllocation.total / 10000)));
    if (result.parsed.preferredRegion) setPreferredRegionInput(result.parsed.preferredRegion);

    // 비용
    const mc = result.monthlyCosts;
    setMonthlyCosts({ ...mc, sga: 0, marketing: 0, interest: 0 });

    // ── 운영 채널 ──
    // 우선 operationalChannels (Pass 2 AI 가 풀에서 골라준 우선순위 + reasoning) 사용,
    // 없으면 deliveryPlatforms/snsChannels (구버전 호환).
    const ops: Record<string, boolean> = {};
    if (result.recommendations.operationalChannels && result.recommendations.operationalChannels.length > 0) {
      for (const ch of result.recommendations.operationalChannels) {
        // type 별 prefix 매핑 — 기존 ops 셀렉터와 호환
        const prefix =
          ch.type === "delivery" ? "delivery"
          : ch.type === "social-commerce" ? "sns"
          : ch.type === "online-marketplace" ? "marketplace"
          : ch.type === "reservation" ? "booking"
          : ch.type === "pos-payment" ? "pos"
          : ch.type === "courier" ? "courier"
          : ch.type === "delivery-agency" ? "delivery-agency"
          : "channel";
        // 주력(priority 1)만 자동 체크. 보조(priority 2)는 사용자가 단계에서 직접 결정.
        if (ch.priority === 1) {
          ops[`${prefix}-${ch.id}`] = true;
        }
      }
    } else {
      for (const id of result.recommendations.deliveryPlatforms) ops[`delivery-${id}`] = true;
      for (const id of result.recommendations.snsChannels) ops[`sns-${id}`] = true;
    }
    setOpsSelections(ops);

    // ── ⭐ 추천 공급업체 + 인테리어 시공 업체 → vendorSelections/vendorCustomInputs 자동 채우기 ──
    // - suppliers: 식재료·장비·POS·포장 등 (vendor_type != interior)
    // - interiorVendors: 인테리어 시공 업체 (vendor_type='interior') — s4 (인테리어/기타) 단계로
    {
      const vs: Record<string, string> = {};
      const vc: Record<string, string> = {};
      let cursor = 0;

      if (result.recommendations.suppliers && result.recommendations.suppliers.length > 0) {
        result.recommendations.suppliers.forEach((supplier) => {
          const step =
            supplier.category.includes("식재료") || supplier.category.includes("식자재") || supplier.category.includes("재료") || supplier.category.includes("소싱") ? 1
            : supplier.category.includes("포장") || supplier.category.includes("소모품") || supplier.category.includes("안전") ? 2
            : supplier.category.includes("장비") || supplier.category.includes("POS") || supplier.category.includes("설비") || supplier.category.includes("예약") || supplier.category.includes("운영") || supplier.category.includes("진열") ? 3
            : 4;
          const key = `vendor-setup_s${step}_c${cursor++}`;
          vs[key] = `__etc__${key}`;
          const verified = supplier.id ? "[검증] " : "";
          const reason = supplier.reason ? ` — ${supplier.reason}` : "";
          const price = supplier.priceRange ? ` (${supplier.priceRange})` : "";
          vc[key] = `${verified}${supplier.name}${reason}${price}`;
        });
      }

      // 인테리어 시공 업체는 s4 (기타/인테리어) 단계에 별도로 추가
      if (result.recommendations.interiorVendors && result.recommendations.interiorVendors.length > 0) {
        result.recommendations.interiorVendors.forEach((iv) => {
          const key = `vendor-setup_s4_c${cursor++}`;
          vs[key] = `__etc__${key}`;
          vc[key] = `[검증·인테리어 시공] ${iv.title} — ${iv.description}${iv.reason ? ` · ${iv.reason}` : ""}`;
        });
      }

      if (Object.keys(vs).length > 0) {
        setVendorSelections(vs);
        setVendorCustomInputs(vc);
      }
    }

    // ── ⭐ 인테리어 컨셉 — Pass 2 AI 가 interior_design_guides 풀에서 1개 골라준 것 우선 ──
    // selectedConcept.id 는 interior_design_guides UUID. 이게 있으면 사용자에게 그 컨셉을 보여주고,
    // 사용자가 컨셉 단계에 도달하면 자동 선택된 상태로 시작 (하지만 변경 가능).
    if (result.recommendations.selectedConcept?.id) {
      setSelectedInteriorConcept(result.recommendations.selectedConcept.id);
    } else {
      // Fallback — 업종 기본 컨셉 (구버전)
      const conceptMap: Record<string, string> = {
        "food": "modern-hanok", "cafe-dessert": "industrial", "beauty": "clean-modern",
        "fitness": "clean-sport", "education": "clean-academic", "pet": "clean-white",
        "retail": "editorial", "living-service": "clean-tech", "space": "modern-study",
        "online-digital": "minimal-home", "startup-tech": "minimal-home",
      };
      const defaultConcept = conceptMap[result.parsed.industryCategoryId];
      if (defaultConcept) setSelectedInteriorConcept(defaultConcept);
    }

    // ─────────────────────────────────────────────────────────────────
    // 신규 확장 필드 적용 — identity / team / legal / insurance / moneyInfra
    // / fundingPrograms / industrySpecific
    //
    // ⚠️ 모든 stage 의 decisions 채우되, 단계 자체는 그대로 — 사용자가 클릭하며 검토.
    // ─────────────────────────────────────────────────────────────────
    const si = useStoreInfoStore.getState();

    // ── identity: 상호 + 미션 + 영업시간 ──
    if (result.identity) {
      // 상호명 — 사용자가 wizard 에서 입력 안 했고 AI 가 추천했으면 그것 사용
      if (!wizardStoreName && result.identity.suggestedStoreName) {
        setStoreName(result.identity.suggestedStoreName);
      }
      // 미션 — 항상 store-info 에 저장
      if (result.identity.mission) {
        si.setField("mission", result.identity.mission);
      }
      // 영업 시간 — 오프라인 path 만 (online·startup 은 빈 문자열로 옴)
      if (result.identity.businessOpenTime) {
        setBusinessOpenTime(result.identity.businessOpenTime);
      }
      if (result.identity.businessCloseTime) {
        setBusinessCloseTime(result.identity.businessCloseTime);
      }
    }

    // ── legal: 과세유형 + 업종코드 + 인허가 ──
    if (result.legal) {
      si.setField("bizRegistrationType", result.legal.taxType);
      si.setField("industryCode", result.legal.industryCode);
      si.setField("fourInsuranceEstablished", result.legal.fourInsuranceRequired ? "in-progress" : "not-required");

      // 과세유형을 operations-store 의 taxSettings 에도 반영
      const vatType = result.legal.taxType === "simplified" ? "simplified" : "general";
      setTaxSettings({ vatType, hasEmployees: (result.team?.initialSize ?? 1) >= 2 });

      // 인허가 — store-info-store.permits 에 자동 추가 (사용자가 검토)
      if (result.legal.permitsDetailed && result.legal.permitsDetailed.length > 0) {
        for (const p of result.legal.permitsDetailed) {
          si.addArrayItem("permits", {
            name: p.name,
            issuedBy: p.where,
            memo: `[${p.kind}] 비용 ${p.cost} · 소요 ${p.duration}${p.required ? " · 필수" : " · 권장"}`,
          } as never);
        }
      }
    }

    // ── insurance: 권장 보험 자동 등록 ──
    if (result.insurance && result.insurance.length > 0) {
      for (const ins of result.insurance) {
        si.addArrayItem("insurancePolicies", {
          name: ins.name,
          type: ins.type,
          annualPremium: ins.annualPremiumEstimate,
          memo: `${ins.required ? "[법적 의무] " : "[권장] "}${ins.reason}`,
        } as never);
      }
    }

    // ── moneyInfra: 추천 통장·PG·세무처리 ──
    if (result.moneyInfra) {
      si.setField("bizBankName", result.moneyInfra.recommendedBank);
      si.setField("posTerminal", result.moneyInfra.recommendedPos);
      si.setField("taxHandling", result.moneyInfra.cpaDecision);
      // profile-store 의 cpaDecision 도 동기화 (cpa | self only — hybrid 는 cpa 로)
      const profileCpa = result.moneyInfra.cpaDecision === "self" ? "self" : "cpa";
      setCpaDecision(profileCpa);
    }

    // ── team: 직원 0명+ 시 4대보험 사업장 성립 표시 ──
    if (result.team && result.team.initialSize >= 2) {
      // peopleDirectory 에 역할별 plan 추가
      for (const role of result.team.roles) {
        si.addArrayItem("peopleDirectory", {
          name: role.role,
          kind: role.timing === "now" ? "employee-fulltime" : "employee-parttime",
          role: role.reason,
          memo: role.timing === "now" ? "초기 채용 권장" : "성장 후 채용 권장 (AI 추천)",
        } as never);
      }
    }

    // ── industrySpecific: 메뉴/시술/회원권/상품/자산 ──
    if (result.industrySpecific) {
      const isData = result.industrySpecific;
      // food/cafe — menu
      if (isData.menu && isData.menu.length > 0) {
        const sectionId = result.parsed.industryCategoryId === "cafe-dessert" ? "menu-ingredients" : "menu-ingredients";
        const items = isData.menu.map((m, i) => ({
          id: `ai-menu-${i}`,
          name: m.name,
          kind: result.parsed.industryCategoryId === "cafe-dessert" ? "drink" : "menu",
          priceKrw: m.price,
          memo: m.reason,
        }));
        si.setIndustrySpecific(sectionId, items);
      }
      // beauty — services
      if (isData.services && isData.services.length > 0) {
        si.setIndustrySpecific("service-menu", isData.services.map((s, i) => ({
          id: `ai-svc-${i}`, name: s.name, durationMin: s.durationMin, priceKrw: s.price,
        })));
      }
      // fitness — memberships
      if (isData.memberships && isData.memberships.length > 0) {
        si.setIndustrySpecific("memberships", isData.memberships.map((m, i) => ({
          id: `ai-mem-${i}`, name: m.name, durationMonths: m.durationMonths, priceKrw: m.price,
        })));
      }
      // retail/online — products
      if (isData.products && isData.products.length > 0) {
        si.setIndustrySpecific("product-catalog", isData.products.map((p, i) => ({
          id: `ai-prod-${i}`, name: p.name, memo: `목표 마진 ${p.targetMargin}% · ${p.reason}`,
        })));
      }
      // coreAssets — 카테고리별 적절한 섹션
      if (isData.coreAssets && isData.coreAssets.length > 0) {
        const assetSection =
          result.parsed.industryCategoryId === "food" ? "kitchen-assets" :
          result.parsed.industryCategoryId === "cafe-dessert" ? "bar-assets" :
          result.parsed.industryCategoryId === "beauty" ? "equipment-products" :
          result.parsed.industryCategoryId === "fitness" ? "equipment-schedule" :
          result.parsed.industryCategoryId === "space" ? "furniture-equipment" :
          null;
        if (assetSection) {
          si.setIndustrySpecific(assetSection, isData.coreAssets.map((a, i) => ({
            id: `ai-asset-${i}`,
            name: a.name,
            purchasePriceKrw: a.estimatedCost,
            memo: a.priority === "must" ? "[필수] AI 추천" : "[선택] AI 추천",
          })));
        }
      }
    }

    // ── fundingPrograms: startup-tech 의 gov-programs 섹션에 prefill ──
    if (result.fundingPrograms && result.fundingPrograms.length > 0 && result.parsed.industryCategoryId === "startup-tech") {
      si.setIndustrySpecific("gov-programs", result.fundingPrograms.map((fp, i) => ({
        id: `ai-fp-${i}`,
        name: fp.name,
        kind: fp.kind,
        endDate: fp.deadline,
        memo: `${fp.eligibility} · ${fp.amount} · 적합도 ${fp.fitScore}/100`,
      })));
    }

    // ── 추가 stage decisions: tax-guide / insurance-tax-setup / hiring-setup / biz-registration ──
    // 모든 stage 가 클릭되어야 하지만, AI 가 사전 권장값을 채워두면 사용자가 confirm 하기만 하면 됨.
    if (result.legal) {
      nextDecisions = upsertStageDecision(nextDecisions, "tax-guide", {
        stageId: "tax-guide",
        inputs: { reviewed: true, taxType: result.legal.taxType, taxAdvice: result.recommendations.taxAdvice ?? "" },
        // ⚠️ completedAt 안 넣음 — 사용자가 stage 열어 직접 confirm 해야 완료 처리
      });
    }
    if (result.moneyInfra) {
      nextDecisions = upsertStageDecision(nextDecisions, "biz-registration", {
        stageId: "biz-registration",
        inputs: {
          recommendedBank: result.moneyInfra.recommendedBank,
          recommendedPos: result.moneyInfra.recommendedPos,
          cpaDecision: result.moneyInfra.cpaDecision,
        },
      });
    }
    if (result.team) {
      nextDecisions = upsertStageDecision(nextDecisions, "hiring-setup", {
        stageId: "hiring-setup",
        inputs: { initialTeamSize: result.team.initialSize, plannedRoles: result.team.roles.map(r => r.role) },
      });
    }

    // AI 로드맵은 businessLaunched = false (아직 개업 전)
    // 로드맵 진행 모드에서 시작 — 하지만 핵심 스테이지(업종/모델/예산/상권)은 완료 마킹

    // ── 로드맵 재빌드: decisions 반영 → completedStageIds 갱신 ──
    const nextTasks = taskMap;
    const nextRoadmap = buildRoadmapState(
      { ...roadmap, roadmapId: roadmap.roadmapId },
      nextDecisions,
      nextTasks,
    );
    setRoadmap(nextRoadmap);
    setTaskMap(nextTasks);

    // ── Supabase 저장 (페이지 전환 전 완료) ──
    try {
      await saveRoadmapState(supabase, { roadmap: nextRoadmap, decisions: nextDecisions, tasks: nextTasks });
      const storeData = collectStoreData();
      // ⚠️ 2026-05-25 audit fix: silent fail 제거. 실패 시 console로 노출 (이전엔 무음).
      try {
        await saveStoreData(supabase, storeData);
      } catch (err) {
        console.error("[onboarding] AIRoadmapComplete saveStoreData failed:", err);
      }
      // profile 갱신 — isFreshAccount 판정을 위해 필수
      const p = await loadBusinessProfile(supabase).catch(() => null);
      if (p) setProfile(p);
      setPersistenceReady(true);
    } catch { /* silent */ }

    setShowAIRoadmapWizard(false);
    setShowOnboardingChoice(false);
    navigateToSurface("home");
  };

  // ──────────────────────────────────────────────────────────────────────────
  // scheduleAiRefresh — AI 액션 갱신 debounce (데이터 변경 후 5초 뒤 자동 갱신)
  // ──────────────────────────────────────────────────────────────────────────
  const aiRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAiRefresh = () => {
    const { businessLaunched, storeName } = useProfileStore.getState();
    if (!businessLaunched || !storeName) return; // 아직 개업 전이면 무시
    if (aiRefreshTimerRef.current) clearTimeout(aiRefreshTimerRef.current);
    aiRefreshTimerRef.current = setTimeout(() => {
      void fetchAiActions();
    }, 5000);
  };

  return { handleExistingBusinessComplete, handleAIRoadmapComplete, scheduleAiRefresh };
}
