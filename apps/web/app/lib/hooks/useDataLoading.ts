"use client";

import React, { useState, useEffect } from "react";
import {
  getStarterLocationOptions,
  loadKnowledgeRecommendations,
  loadPermitKnowledge,
  loadTaxKnowledge,
  loadLoanKnowledge,
  localizeGuideRecord,
  loadStageGuideContent,
  loadMarketSignalRecommendations,
  buildRecommendedMarkets,
  localizeRecommendationItem,
} from "@build-up/shared";
import { supabase } from "../../../lib/supabase";
import { useRoadmapStore, useAiStore, useProfileStore, useFinanceStore, useOperationsStore, useOnboardingStore } from "../stores";
import { useNotifications } from "../../notification-context";
import type { InventoryItem, FixedExpense } from "../stores/operations-store";

export interface DataLoadingResult {
  contractors: { id: string; name: string; address: string; phone: string | null; description: string; mapUrl: string | null }[];
  contractorsLoading: boolean;
  contractorsRetryKey: number;
  setContractorsRetryKey: React.Dispatch<React.SetStateAction<number>>;
  nearbyFranchiseStores: { totalCount: number; places: Array<{ name: string; address: string; phone: string; url: string }> } | null;
  nearbyFranchiseLoading: boolean;
  setNearbyFranchiseStores: React.Dispatch<React.SetStateAction<{ totalCount: number; places: Array<{ name: string; address: string; phone: string; url: string }> } | null>>;
  setNearbyFranchiseLoading: React.Dispatch<React.SetStateAction<boolean>>;
  locationMapReady: boolean;
  setLocationMapReady: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useDataLoading(
  language: "ko" | "en",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  copy: any,
  industryCategoryId: string | undefined,
  currentStageCode: string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  businessCtx: any,
): DataLoadingResult {
  // ── Local state ──
  const [nearbyFranchiseStores, setNearbyFranchiseStores] = useState<{
    totalCount: number;
    places: Array<{ name: string; address: string; phone: string; url: string }>;
  } | null>(null);
  const [nearbyFranchiseLoading, setNearbyFranchiseLoading] = useState(false);
  const [locationMapReady, setLocationMapReady] = useState(false);
  const [contractors, setContractors] = useState<{
    id: string;
    name: string;
    address: string;
    phone: string | null;
    description: string;
    mapUrl: string | null;
  }[]>([]);
  const [contractorsLoading, setContractorsLoading] = useState(false);
  const [contractorsRetryKey, setContractorsRetryKey] = useState(0);

  const { setNotifications } = useNotifications();

  // ── Store values ──
  const {
    requiresAuth,
  } = useOnboardingStore();

  const {
    profile,
    selectedBudget,
    startupType,
    locationMode,
    preferredRegionInput,
    businessLaunched,
  } = useProfileStore();

  const {
    locationOptions,
    setLocationOptions,
    setLocationSourceLabel,
    setRecommendedMarkets,
    setStageGuideContent,
    setGuideStepIndex,
    roadmap,
  } = useRoadmapStore();

  const {
    setPermitGuides,
    setTaxGuides,
    setLoanGuides,
  } = useAiStore();

  const {
    inventory,
    employees,
    fixedExpenses,
    members,
    taxSettings,
  } = useOperationsStore();

  const {
    costHistory,
  } = useFinanceStore();

  // Derived values needed for effects
  const preferredRegion = profile?.preferredRegions?.[0];

  const isDigitalCategory = industryCategoryId === "online-digital" || industryCategoryId === "startup-tech";
  const isStartupCategory = industryCategoryId === "startup-tech";
  const onlineOnlyIds = new Set(["platform-setup", "online-registration", "sourcing-setup", "store-setup", "online-marketing"]);
  const startupOnlyIds = new Set(["startup-foundation", "customer-discovery", "mvp-build", "launch-gtm", "growth-engine", "company-setup", "fundraising-readiness", "venture-certification"]);
  const offlineOnlyIds = new Set(["permit-check", "location-candidates", "contract-review", "construction-setup", "vendor-setup", "registration-setup", "insurance-tax-setup", "hiring-setup", "operations-setup", "pre-launch"]);
  const franchiseOnlyIds = new Set(["franchise-application"]);
  const isPathStage = (stageId: string): boolean => {
    if (isStartupCategory) {
      if (onlineOnlyIds.has(stageId) || offlineOnlyIds.has(stageId) || franchiseOnlyIds.has(stageId)) return false;
      return true;
    }
    if (isDigitalCategory) {
      if (offlineOnlyIds.has(stageId) || startupOnlyIds.has(stageId)) return false;
      if (franchiseOnlyIds.has(stageId) && startupType !== "franchise") return false;
      return true;
    }
    if (onlineOnlyIds.has(stageId) || startupOnlyIds.has(stageId)) return false;
    if (franchiseOnlyIds.has(stageId) && startupType !== "franchise") return false;
    return true;
  };
  const pathStageIds = new Set(roadmap.stages.filter(s => isPathStage(s.stageId)).map(s => s.stageId));
  const pathTotalStages = pathStageIds.size;
  const completedCount = roadmap.completedStageIds.filter(id => pathStageIds.has(id)).length;

  // ── 1. Location options loading ──
  useEffect(() => {
    if (requiresAuth) {
      return;
    }

    void loadKnowledgeRecommendations(supabase, {
      domain: "market-recommendation",
      itemType: "location_candidate",
      categoryId: industryCategoryId
    })
      .then((items) => {
        setLocationSourceLabel(
          items.length > 0 ? copy.common.liveKnowledgeLayer : copy.common.starterFallback
        );
        setLocationOptions(
          (items.length > 0 ? items : getStarterLocationOptions(industryCategoryId)).map((item) =>
            localizeRecommendationItem(item, language)
          )
        );
      })
      .catch(() => {
        setLocationSourceLabel(copy.common.starterFallback);
        setLocationOptions(getStarterLocationOptions(industryCategoryId).map((item) => localizeRecommendationItem(item, language)));
      });
  }, [industryCategoryId, requiresAuth, language]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 2. Market signal recommendations ──
  useEffect(() => {
    if (locationMode !== "recommended") {
      return;
    }

    if (!preferredRegionInput.trim()) {
      setRecommendedMarkets([]);
      return;
    }

    void loadMarketSignalRecommendations(supabase, {
      regionQuery: preferredRegionInput,
      categoryId: industryCategoryId
    })
      .then((signalItems) => {
        const builtInMarkets = buildRecommendedMarkets({
          region: preferredRegionInput,
          categoryId: industryCategoryId,
          capital: selectedBudget,
          candidates: locationOptions
        });

        if (signalItems.length >= 3) {
          setRecommendedMarkets(signalItems.map((item) => localizeRecommendationItem(item, language)));
          setLocationSourceLabel(language === "ko" ? "상권 신호 데이터" : "Market signal data");
          return;
        }

        if (signalItems.length > 0 && builtInMarkets.length > 0) {
          const signalIds = new Set(signalItems.map((s) => s.id));
          const merged = [
            ...signalItems.map((item) => localizeRecommendationItem(item, language)),
            ...builtInMarkets
              .filter((b) => !signalIds.has(b.id))
              .map((item) => localizeRecommendationItem(item, language)),
          ].slice(0, 5);
          setRecommendedMarkets(merged);
          setLocationSourceLabel(language === "ko" ? "상권 신호 + 내장 데이터" : "Signal + built-in data");
          return;
        }

        setRecommendedMarkets(
          builtInMarkets.map((item) => localizeRecommendationItem(item, language))
        );
        setLocationSourceLabel(copy.common.liveKnowledgeLayer);
      })
      .catch(() => {
        setRecommendedMarkets(
          buildRecommendedMarkets({
            region: preferredRegionInput,
            categoryId: industryCategoryId,
            capital: selectedBudget,
            candidates: locationOptions
          }).map((item) => localizeRecommendationItem(item, language))
        );
        setLocationSourceLabel(copy.common.starterFallback);
      });
  }, [preferredRegionInput, industryCategoryId, selectedBudget, locationOptions, language, locationMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 3. Guide knowledge loading ──
  useEffect(() => {
    void Promise.all([
      loadPermitKnowledge(supabase, industryCategoryId),
      loadTaxKnowledge(supabase, industryCategoryId),
      loadLoanKnowledge(supabase, industryCategoryId)
    ])
      .then(([permits, taxes, loans]) => {
        setPermitGuides(permits.map((guide) => localizeGuideRecord(guide, language)));
        setTaxGuides(taxes.map((guide) => localizeGuideRecord(guide, language)));
        setLoanGuides(loans.map((guide) => localizeGuideRecord(guide, language)));
      })
      .catch(() => {
        setPermitGuides([]);
        setTaxGuides([]);
        setLoanGuides([]);
      });
  }, [industryCategoryId, language]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 4. Contractor search (Kakao Maps + fallback) ──
  useEffect(() => {
    if (!preferredRegion || !industryCategoryId) return;

    const contractorKeywords: Record<string, string> = {
      "cafe-dessert": "카페 인테리어",
      "food": "음식점 인테리어",
      "beauty": "미용실 인테리어",
      "fitness": "피트니스 인테리어",
      "education": "학원 인테리어",
      "pet": "펫샵 인테리어",
      "retail": "매장 인테리어",
      "living-service": "상가 인테리어",
      "space": "스터디카페 인테리어",
    };
    const keyword = contractorKeywords[industryCategoryId] ?? "인테리어 업체";
    const query = `${preferredRegion} ${keyword}`;

    // Try Kakao Places API first (client-side)
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const w = window as any;
    const kakao = w.kakao;

    const searchViaKakao = () => {
      if (!kakao?.maps?.services) return false;
      setContractorsLoading(true);
      const runSearch = () => {
        const ps = new kakao.maps.services.Places();
        ps.keywordSearch(query, (data: any[], status: string) => {
          if (status === kakao.maps.services.Status.OK && data.length > 0) {
            setContractors(data.slice(0, 5).map((d: any, i: number) => ({
              id: `kakao-${i}`,
              name: String(d.place_name ?? ""),
              address: String(d.road_address_name || d.address_name || ""),
              phone: d.phone ? String(d.phone) : null,
              description: String(d.category_name ?? ""),
              mapUrl: d.place_url ? String(d.place_url) : null,
            })));
          } else {
            setContractors([]);
          }
          setContractorsLoading(false);
        }, { size: 5 });
      };
      if (kakao.maps.load) { kakao.maps.load(runSearch); } else { runSearch(); }
      return true;
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (!searchViaKakao()) {
      // Fallback: server API (OpenAI web search)
      setContractorsLoading(true);
      const params = new URLSearchParams({ region: preferredRegion, categoryId: industryCategoryId, keyword });
      fetch(`/api/contractors/local?${params.toString()}`)
        .then((r) => r.json() as Promise<{ results: { id: string; name: string; address: string; phone: string | null; description: string; mapUrl: string | null }[] }>)
        .then(({ results }) => { setContractors(results ?? []); })
        .catch(() => { setContractors([]); })
        .finally(() => { setContractorsLoading(false); });
    }
  }, [preferredRegion, industryCategoryId, contractorsRetryKey]);

  // ── 5. Stage guide content ──
  useEffect(() => {
    if (!currentStageCode) return;
    setStageGuideContent(null);
    setGuideStepIndex(0);
    void loadStageGuideContent(supabase, currentStageCode, industryCategoryId, language)
      .then((content) => {
        setStageGuideContent(content);
        setGuideStepIndex(0);
      })
      .catch(() => {
        setStageGuideContent(null);
      });
  }, [currentStageCode, industryCategoryId, language]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 6. Notification computation ──
  useEffect(() => {
    type Notif = { id: string; severity: "urgent" | "warning"; title: string; detail: string };
    const ko = language === "ko";
    const nowN = new Date();
    const todayMsN = new Date(nowN.getFullYear(), nowN.getMonth(), nowN.getDate()).getTime();
    const diffD = (d: Date) => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - todayMsN) / 86400000);
    const yN = nowN.getFullYear();
    const mN = nowN.getMonth();
    const domN = nowN.getDate();
    const todayStrN = nowN.toISOString().slice(0, 10);
    const in7daysN = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const daysInMonthN = new Date(yN, mN + 1, 0).getDate();
    const items: Notif[] = [];

    // 1. 재고 부족
    if (businessCtx.hasPhysicalInventory) {
      (inventory as InventoryItem[]).forEach(item => {
        if (item.quantity <= 0) {
          items.push({ id: `inv-${item.id}`, severity: "urgent", title: ko ? `재고 소진: ${item.name}` : `Out of stock: ${item.name}`, detail: ko ? "즉시 주문이 필요합니다" : "Needs immediate reorder" });
        } else if (item.dailyUsage > 0) {
          const daysLeft = Math.floor(item.quantity / item.dailyUsage);
          if (daysLeft <= item.leadTimeDays + 2) {
            items.push({ id: `inv-${item.id}`, severity: daysLeft <= 1 ? "urgent" : "warning", title: ko ? `재고 부족: ${item.name}` : `Low stock: ${item.name}`, detail: ko ? `${daysLeft}일치 남음 · 리드타임 ${item.leadTimeDays}일` : `${daysLeft}d left · ${item.leadTimeDays}d lead time` });
          }
        } else if (item.minThreshold > 0 && item.quantity <= item.minThreshold) {
          items.push({ id: `inv-${item.id}`, severity: "warning", title: ko ? `재고 부족: ${item.name}` : `Low stock: ${item.name}`, detail: ko ? `현재 ${item.quantity}${item.unit} (최소 기준 ${item.minThreshold}${item.unit})` : `${item.quantity}${item.unit} (min: ${item.minThreshold}${item.unit})` });
        }
      });
    }

    // 2. 세금 D-14
    if (businessLaunched) {
      const { vatType, hasEmployees: hasFmEmp } = taxSettings;
      const whtM = domN >= 10 ? mN + 1 : mN;
      const withholdingDate = new Date(whtM > 11 ? yN + 1 : yN, whtM % 12, 10);
      const insuranceDate = new Date(yN, mN + 1, 0);
      const vatDates = vatType === "simplified" ? [new Date(yN, 0, 25), new Date(yN + 1, 0, 25)] : [new Date(yN, 0, 25), new Date(yN, 6, 25), new Date(yN + 1, 0, 25)];
      const vatDate = vatDates.find(d => diffD(d) >= 0) ?? vatDates[vatDates.length - 1];
      const incomeTaxDate = [new Date(yN, 4, 31), new Date(yN + 1, 4, 31)].find(d => diffD(d) >= 0) ?? new Date(yN + 1, 4, 31);
      const taxEv: { label: string; date: Date }[] = [
        ...(hasFmEmp ? [
          { label: ko ? "원천세 신고·납부" : "Withholding tax", date: withholdingDate },
          { label: ko ? "4대보험료" : "Social insurance", date: insuranceDate },
        ] : []),
        { label: ko ? "부가세 신고" : "VAT filing", date: vatDate },
        { label: ko ? "종합소득세 신고" : "Income tax", date: incomeTaxDate },
      ];
      taxEv.forEach(e => {
        const d = diffD(e.date);
        if (d >= 0 && d <= 14) {
          items.push({ id: `tax-${e.label}`, severity: d <= 3 ? "urgent" : "warning", title: e.label, detail: ko ? (d === 0 ? "오늘 마감" : `D-${d} · ${e.date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}`) : (d === 0 ? "Due today" : `D-${d} · ${e.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`) });
        }
      });
    }

    // 3. 직원 월급 D-7
    if ((employees as { id: string }[]).length > 0 && businessLaunched) {
      const payDay = 25;
      const payDate = domN <= payDay ? new Date(yN, mN, payDay) : new Date(yN, mN + 1, payDay);
      const pd = diffD(payDate);
      if (pd >= 0 && pd <= 7) {
        const totalPay = (employees as { hourlyWage: number; weeklyHours: number }[]).reduce((s, e) => {
          const weekly = e.weeklyHours >= 15 ? (e.weeklyHours / 5) * e.hourlyWage : 0;
          return s + Math.round((e.hourlyWage * e.weeklyHours + weekly) * 4.345);
        }, 0);
        items.push({ id: "payroll", severity: pd <= 2 ? "urgent" : "warning", title: ko ? `직원 월급 지급일 D-${pd}` : `Payroll in ${pd} days`, detail: ko ? `${(employees as { id: string }[]).length}명 · 예상 ${Math.round(totalPay / 10000)}만원` : `${(employees as { id: string }[]).length} staff · est. ₩${Math.round(totalPay / 10000)}K` });
      }
    }

    // 4. 고정비 D-7
    if (businessLaunched) {
      (fixedExpenses as FixedExpense[]).forEach(fe => {
        const effectiveDay = Math.min(fe.dueDay, daysInMonthN);
        const fDate = effectiveDay >= domN ? new Date(yN, mN, effectiveDay) : new Date(yN, mN + 1, Math.min(fe.dueDay, new Date(yN, mN + 2, 0).getDate()));
        const fd = diffD(fDate);
        if (fd >= 0 && fd <= 7) {
          items.push({ id: `fexp-${fe.id}`, severity: fd <= 2 ? "urgent" : "warning", title: ko ? `고정비 납부: ${fe.name}` : `Expense due: ${fe.name}`, detail: ko ? `${Math.round(fe.amount / 10000)}만원 · D-${fd}` : `₩${Math.round(fe.amount / 10000)}K · D-${fd}` });
        }
      });
    }

    // 5. 회원 만료 D-7
    if (businessCtx.isRecurringRevenue) {
      members.forEach(mm => {
        if (mm.endDate >= todayStrN && mm.endDate <= in7daysN) {
          const d = Math.ceil((new Date(mm.endDate).getTime() - Date.now()) / 86400000);
          items.push({ id: `mem-${mm.id}`, severity: d <= 2 ? "urgent" : "warning", title: ko ? `회원 만료 임박: ${mm.name}` : `Member expiring: ${mm.name}`, detail: ko ? `${mm.plan} · D-${d}` : `${mm.plan} · ${d}d left` });
        }
      });
    }

    // 6. 로드맵 미완료 리마인더
    if (!businessLaunched && completedCount > 0 && completedCount < pathTotalStages) {
      items.push({ id: "roadmap-reminder", severity: "warning", title: ko ? `로드맵 ${completedCount}/${pathTotalStages} 완료` : `Roadmap ${completedCount}/${pathTotalStages} done`, detail: ko ? "다음 단계를 진행하세요" : "Continue to the next stage" });
    }

    // 7. 원가율 경고 (비용 2개월 이상 이력)
    if (costHistory.length >= 2 && businessLaunched) {
      const sorted = [...costHistory].sort((a, b) => b.month.localeCompare(a.month));
      const latest = sorted[0];
      const prev = sorted[1];
      const latestTotal = latest.ingredients + latest.labor + latest.rent + latest.utilities + latest.other;
      const prevTotal = prev.ingredients + prev.labor + prev.rent + prev.utilities + prev.other;
      if (prevTotal > 0 && latestTotal > prevTotal && (latestTotal - prevTotal) / prevTotal > 0.1) {
        items.push({ id: "cost-trend", severity: "warning", title: ko ? "비용 급증 경고" : "Cost surge alert", detail: ko ? `전월 대비 ${Math.round((latestTotal - prevTotal) / prevTotal * 100)}% 증가` : `${Math.round((latestTotal - prevTotal) / prevTotal * 100)}% increase vs last month` });
      }
    }

    setNotifications(items);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, inventory, employees, fixedExpenses, members, taxSettings, businessLaunched, businessCtx.hasPhysicalInventory, businessCtx.isRecurringRevenue, completedCount, pathTotalStages, costHistory]);

  return {
    contractors,
    contractorsLoading,
    contractorsRetryKey,
    setContractorsRetryKey,
    nearbyFranchiseStores,
    setNearbyFranchiseStores,
    nearbyFranchiseLoading,
    setNearbyFranchiseLoading,
    locationMapReady,
    setLocationMapReady,
  };
}
