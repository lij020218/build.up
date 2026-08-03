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
  getMatchedProgramsV2,
  checkWeeklyHoursThreshold,
  checkAnnualLeaveAccrual,
  checkFivePersonThreshold,
  checkSimplifiedTaxTransition,
} from "@foundone/shared";
import { supabase } from "../../../lib/supabase";
import { useRoadmapStore, useAiStore, useProfileStore, useFinanceStore, useOperationsStore, useOnboardingStore } from "../stores";
import { isBusinessDayClosed } from "../utils/business-day";
import { makeIsPathStage } from "../utils/path-filter";
import { useCashflowStore } from "../stores/cashflow-store";
import { useNotifications, type NotifNavigate } from "../../notification-context";
import type { InventoryItem, FixedExpense } from "../stores/operations-store";
import { getKstDate } from "../utils/business-day";

export interface DataLoadingResult {
  contractors: { id: string; name: string; address: string; phone: string | null; description: string; mapUrl: string | null }[];
  contractorsLoading: boolean;
  contractorsRetryKey: number;
  setContractorsRetryKey: React.Dispatch<React.SetStateAction<number>>;
  /** AI 라이브 추천이 결과를 만든 지역 — 그 지역이 유지되는 동안 큐레이션 effect 가 덮어쓰지 않는다 (2026-08-03) */
  aiMarketRegion: string | null;
  setAiMarketRegion: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * 2026-05-13 — copy / businessCtx 타입 명시 (any → 구조화).
 *  copy: i18n 메시지 catalog (common.liveKnowledgeLayer 등)
 *  businessCtx: 업종별 boolean 플래그 모음 (hasPhysicalInventory·isRecurringRevenue 등)
 */
type CopyCatalog = {
  common: {
    liveKnowledgeLayer: string;
    starterFallback: string;
  } & Record<string, string>;
} & Record<string, unknown>;

type BusinessCtx = {
  hasPhysicalInventory?: boolean;
  isRecurringRevenue?: boolean;
} & Record<string, unknown>;

export function useDataLoading(
  language: "ko" | "en",
  copy: CopyCatalog,
  industryCategoryId: string | undefined,
  currentStageCode: string | undefined,
  businessCtx: BusinessCtx,
): DataLoadingResult {
  // ── Local state ──
  const [aiMarketRegion, setAiMarketRegion] = useState<string | null>(null);
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
    selectedIndustryId,
    selectedBudget,
    startupType,
    locationMode,
    preferredRegionInput,
    businessLaunched,
    businessLaunchedDate,
    businessCloseTime,
    payDay,
    initialOperatingCapital,
  } = useProfileStore();

  const {
    locationOptions,
    setLocationOptions,
    setLocationSourceLabel,
    setRecommendedMarkets,
    setHasCuratedMarket,
    setStageGuideContent,
    setGuideStepIndex,
    roadmap,
    decisions,
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
    dailyEntries,
    monthlyCosts,
  } = useFinanceStore();

  // Cashflow 셋업 / 고정비 등록 상태 — 알림용
  const cashflowSetupCompletedAt = useCashflowStore((s) => s.setupCompletedAt);
  const cashflowFixedExpenses = useCashflowStore((s) => s.fixedExpenses);

  // Derived values needed for effects
  // ⚠ profile?.preferredRegions 만으로는 부족하다:
  //   ① 첫 마운트 시 profile 이 아직 hydrate 되지 않아 undefined
  //   ② DB에 빈 문자열 [""] 이 저장된 레거시 케이스
  //   ③ AI Roadmap Wizard 에서 region 입력을 안 한 경우 — locationDecision 에만 존재
  //   → 모든 가용 소스를 fallback chain 으로 묶어 contractor 검색이 silent fail 되지 않도록.
  const locationDecision = decisions["location-candidates"];
  const profileRegion = profile?.preferredRegions?.[0]?.trim();
  const inputRegion =
    typeof locationDecision?.inputs?.preferredRegion === "string"
      ? locationDecision.inputs.preferredRegion.trim()
      : "";
  const customRegion =
    typeof locationDecision?.inputs?.customMarketName === "string"
      ? locationDecision.inputs.customMarketName.trim()
      : "";
  const finalTitleRegion =
    typeof locationDecision?.inputs?.finalMarketTitle === "string"
      ? locationDecision.inputs.finalMarketTitle.trim()
      : "";
  const inputRegionFromStore = preferredRegionInput?.trim() ?? "";
  const preferredRegion =
    (profileRegion && profileRegion.length > 0 ? profileRegion : null)
    ?? (inputRegion.length > 0 ? inputRegion : null)
    ?? (customRegion.length > 0 ? customRegion : null)
    ?? (finalTitleRegion.length > 0 ? finalTitleRegion : null)
    ?? (inputRegionFromStore.length > 0 ? inputRegionFromStore : null)
    ?? locationDecision?.selectedPrimaryOptionId
    ?? undefined;

  // ⚠️ 2026-05-18 fix (사장님 신고: 알림에 "로드맵 33/35 완료" 표시 — path 가 cluster 별 다른데
  //   모든 cluster stage 를 합산하니 35로 inflate). 단일 SSOT(lib/utils/path-filter.ts) 사용.
  const isPathStage = makeIsPathStage({
    industryCategoryId: industryCategoryId ?? "",
    selectedIndustryId,
    startupType,
  });
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
      setHasCuratedMarket(false);
      return;
    }
    // AI 라이브 결과 보존 — 같은 지역에 AI 결과가 살아있으면 큐레이션/내장으로 덮어쓰지 않는다.
    //  (종전 결함: deps 의 locationMode 가 direct→recommended 전환 시 effect 재실행 → AI 결과 즉시 소실)
    if (aiMarketRegion && aiMarketRegion === preferredRegionInput.trim()) {
      return;
    }

    void loadMarketSignalRecommendations(supabase, {
      regionQuery: preferredRegionInput,
      categoryId: industryCategoryId
    })
      .then((signalItems) => {
        // ⚠️ 2026-05-18 fix (사장님 신고: "봉은사 검색했는데 창동·노원이 나옴"):
        //   종전엔 signal 매칭이 부족하면 buildRecommendedMarkets 의 *정적 내장 추천*
        //   (창동·가산·공릉 등 점수 높은 무관한 지역) 을 fallback 으로 병합 → 검색어와
        //   완전 무관한 결과가 표시되는 거짓말 같은 UX. 신호 매칭 결과가 1개 이상이면
        //   그것만 표시하고, 0개일 때만 "검색 결과 없음" 으로 명확히 안내.
        if (signalItems.length > 0) {
          setRecommendedMarkets(signalItems.map((item) => localizeRecommendationItem(item, language)));
          setLocationSourceLabel(language === "ko" ? "상권 신호 데이터" : "Market signal data");
          setHasCuratedMarket(true);  // 우리 조사 데이터 매칭 → 라이브 AI 버튼 숨김(덮어쓰기 방지)
          return;
        }
        // 큐레이션 0건 → 큐레이션 없는 지역. 수동 "AI로 분석" 버튼 노출(빈 곳만 AI).
        setHasCuratedMarket(false);

        // 신호 매칭 0건 → 카테고리·예산 기반 fallback (검색어 무시) 만 표시. 단 라벨에서
        //   "입력한 지역과 매칭된 상권을 찾지 못함" 을 명시해야 함.
        const builtInMarkets = buildRecommendedMarkets({
          region: preferredRegionInput,
          categoryId: industryCategoryId,
          capital: selectedBudget,
          candidates: locationOptions
        });
        setRecommendedMarkets(
          builtInMarkets.map((item) => localizeRecommendationItem(item, language))
        );
        setLocationSourceLabel(
          language === "ko"
            ? `"${preferredRegionInput}" 매칭 0건 — 카테고리 기반 추천`
            : `No match for "${preferredRegionInput}" — category-based fallback`,
        );
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
        setHasCuratedMarket(false);  // 신호 로드 실패 → 큐레이션 없음 취급, AI 버튼 노출
      });
  }, [preferredRegionInput, industryCategoryId, selectedBudget, locationOptions, language, locationMode, aiMarketRegion]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── 4. Contractor search (Kakao REST via server + client-side SDK fallback) ──
  // ⚠ 클라이언트 Kakao JS SDK는 도메인 화이트리스트가 필요해 dev 환경에서 silent fail 발생.
  //    안정적인 server REST API (KAKAO_REST_API_KEY + KA header) 를 primary 로 사용.
  useEffect(() => {
    if (!preferredRegion || !industryCategoryId) {
      // 진단용 로그 — 검색이 안 될 때 어떤 입력이 비어있는지 즉시 확인 가능.
      if (process.env.NODE_ENV !== "production") {
        console.debug("[contractors] skip — preferredRegion or industryCategoryId missing", {
          preferredRegion,
          industryCategoryId,
          profileRegion: profile?.preferredRegions?.[0],
          locationDecisionInputs: locationDecision?.inputs,
        });
      }
      return;
    }

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

    let cancelled = false;
    setContractorsLoading(true);

    // 2026-05-13: kakao-maps.d.ts 글로벌 타입 적용 — any 캐스트 제거
    const kakao = typeof window !== "undefined" ? window.kakao : undefined;

    // ── Primary: Server REST API (auth Bearer token 필요) ──
    // 키워드를 두 번 시도: ① 업종별 정밀 키워드 → ② "인테리어" 만으로 광범위 검색.
    //   "강남구 논현동 카페 인테리어" 같이 너무 구체적이면 결과 0인 케이스가 있어 폴백 필요.
    const searchViaServer = async (): Promise<boolean> => {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        console.warn("[contractors] no auth token — falling back to SDK");
        return false;
      }
      const tryFetch = async (kw: string): Promise<boolean> => {
        try {
          const params = new URLSearchParams({ region: preferredRegion, categoryId: industryCategoryId, keyword: kw });
          const res = await fetch(`/api/contractors/local?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            console.warn(`[contractors] server returned ${res.status} for keyword "${kw}"`);
            return false;
          }
          const json = await res.json() as { results?: Array<{ id: string; name: string; address: string; phone: string | null; description: string; mapUrl: string | null }>; source?: string };
          if (cancelled) return true;
          if (json.results && json.results.length > 0) {
            setContractors(json.results);
            return true;
          }
          console.debug(`[contractors] 0 results for keyword "${kw}" (source=${json.source})`);
          return false;
        } catch (err) {
          console.warn(`[contractors] server API threw for keyword "${kw}":`, err);
          return false;
        }
      };
      // ① 정밀 키워드 (e.g. "카페 인테리어")
      if (await tryFetch(keyword)) return true;
      if (cancelled) return true;
      // ② 광범위 키워드 ("인테리어")
      if (keyword !== "인테리어" && (await tryFetch("인테리어"))) return true;
      return false;
    };

    // ── Fallback: Client-side Kakao JS SDK (domain whitelist 필요) ──
    const searchViaKakaoSDK = () => {
      const maps = kakao?.maps;
      if (!maps?.services) return false;
      const runSearch = () => {
        const ps = new maps.services.Places();
        ps.keywordSearch(query, (data, status) => {
          if (cancelled) return;
          if (status === "OK" && data.length > 0) {
            setContractors(data.slice(0, 5).map((d, i) => ({
              id: `kakao-${i}`,
              name: String(d.place_name ?? ""),
              address: String(d.road_address_name || d.address_name || ""),
              phone: d.phone ? String(d.phone) : null,
              description: String(d.category_name ?? ""),
              // place_url 은 Kakao SDK 응답에 포함되지만 부분 타입 정의 외 — 안전 cast
              mapUrl: (d as { place_url?: string }).place_url ?? null,
            })));
          } else {
            setContractors([]);
          }
          setContractorsLoading(false);
        }, { size: 5 });
      };
      if (maps.load) { maps.load(runSearch); } else { runSearch(); }
      return true;
    };

    (async () => {
      const ok = await searchViaServer();
      if (cancelled) return;
      if (ok) {
        setContractorsLoading(false);
        return;
      }
      // 서버 실패 → SDK 시도
      if (!searchViaKakaoSDK()) {
        setContractors([]);
        setContractorsLoading(false);
      }
      // SDK 가 잡히면 콜백 안에서 setContractorsLoading(false)
    })();

    return () => { cancelled = true; };
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
    type Notif = { id: string; severity: "urgent" | "warning"; title: string; detail: string; navigate?: NotifNavigate };
    const ko = language === "ko";
    const nowN = new Date();
    const todayMsN = new Date(nowN.getFullYear(), nowN.getMonth(), nowN.getDate()).getTime();
    const diffD = (d: Date) => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - todayMsN) / 86400000);
    const yN = nowN.getFullYear();
    const mN = nowN.getMonth();
    const domN = nowN.getDate();
    const todayStrN = getKstDate(nowN);
    const in7daysN = getKstDate(new Date(Date.now() + 7 * 86400000));
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

    // 3. 직원 월급 알림 — D-7 / D-2 / D-day (사장님 설정 payDay 사용, 미설정 시 비활성)
    //    사용자 요청 (2026-05-09): 임금체불 방지 — 월급날 미지급 시 형사처벌 가능 (3년 시효).
    if ((employees as { id: string }[]).length > 0 && businessLaunched && payDay) {
      // 이번 달 또는 다음 달 지급일 — 이번 달이 31일 미만이면 마지막 날로 클램프
      const lastDayThisMonth = new Date(yN, mN + 1, 0).getDate();
      const lastDayNextMonth = new Date(yN, mN + 2, 0).getDate();
      const adjustedThis = Math.min(payDay, lastDayThisMonth);
      const adjustedNext = Math.min(payDay, lastDayNextMonth);
      const payDate = domN <= adjustedThis
        ? new Date(yN, mN, adjustedThis)
        : new Date(yN, mN + 1, adjustedNext);
      const pd = diffD(payDate);
      if (pd >= 0 && pd <= 7) {
        const totalPay = (employees as { hourlyWage: number; weeklyHours: number }[]).reduce((s, e) => {
          const weekly = e.weeklyHours >= 15 ? (e.weeklyHours / 5) * e.hourlyWage : 0;
          return s + Math.round((e.hourlyWage * e.weeklyHours + weekly) * 4.345);
        }, 0);
        const staffCount = (employees as { id: string }[]).length;
        const titleKo = pd === 0
          ? "오늘이 직원 월급날입니다 ⚠️"
          : `직원 월급 지급일 D-${pd}`;
        const titleEn = pd === 0 ? "Today is payday ⚠️" : `Payroll in ${pd} days`;
        const detailKo = pd === 0
          ? `${staffCount}명 · 약 ${Math.round(totalPay / 10000)}만원 — 미지급 시 임금체불(형사처벌, 3년 시효).`
          : `${staffCount}명 · 예상 ${Math.round(totalPay / 10000)}만원`;
        const detailEn = pd === 0
          ? `${staffCount} staff · ~₩${Math.round(totalPay / 10000)}K — non-payment = wage theft (criminal liability).`
          : `${staffCount} staff · est. ₩${Math.round(totalPay / 10000)}K`;
        items.push({
          id: "payroll",
          severity: pd <= 2 ? "urgent" : "warning",
          title: ko ? titleKo : titleEn,
          detail: ko ? detailKo : detailEn,
          navigate: { surface: "analytics", selector: "[data-team-card]" },
        });
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
        items.push({
          id: "cost-trend",
          severity: "warning",
          title: ko ? "비용 급증 경고" : "Cost surge alert",
          detail: ko ? `전월 대비 ${Math.round((latestTotal - prevTotal) / prevTotal * 100)}% 증가` : `${Math.round((latestTotal - prevTotal) / prevTotal * 100)}% increase vs last month`,
          navigate: { surface: "analytics", selector: "[data-cost-management]" },
        });
      }
    }

    // 8. 매출 2일 연속 미입력 (운영 중에만)
    if (businessLaunched) {
      const sortedDates = (dailyEntries as Array<{ date: string; sales: number }>).map((e) => e.date).sort();
      const latestEntry = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;
      const yesterdayStr = getKstDate(new Date(Date.now() - 86400000));
      const dayBeforeStr = getKstDate(new Date(Date.now() - 2 * 86400000));
      const missingYesterday = !sortedDates.includes(yesterdayStr);
      const missingDayBefore = !sortedDates.includes(dayBeforeStr);
      if (missingYesterday && missingDayBefore) {
        // 운영 시작 직후 2일 미만 운영한 사장님은 false-positive 방지
        const daysSinceLatest = latestEntry
          ? Math.round((Date.now() - new Date(`${latestEntry}T00:00:00`).getTime()) / 86400000)
          : 999;
        const detailText = latestEntry
          ? (ko ? `마지막 입력 ${daysSinceLatest}일 전 — 트렌드·이상 감지가 멈춥니다` : `Last entry ${daysSinceLatest}d ago — trend detection paused`)
          : (ko ? "아직 입력 기록이 없어요" : "No sales logged yet");
        items.push({
          id: "sales-2day-gap",
          severity: "urgent",
          title: ko ? "매출 2일 연속 미입력" : "Sales unlogged 2 days in a row",
          detail: detailText,
          navigate: { surface: "home", selector: "[data-sales-input]", focusInput: true },
        });
      }
    }

    // 9. 현금흐름 셋업 미완료 (⚠️ 2026-05-18: businessLaunched 조건 추가)
    //    종전엔 businessLaunched 검사 없어서 *오픈 전 로드맵 진행 중* 사장님에게도 알림.
    //    현금흐름 추적은 *오픈 후* 운영 중 사장님에게 의미 있음. 오픈 전엔 노출 차단.
    if (businessLaunched && !cashflowSetupCompletedAt) {
      items.push({
        id: "cashflow-setup-missing",
        severity: "warning",
        title: ko ? "현금흐름 추적이 꺼져 있어요" : "Cash-flow tracking is off",
        detail: ko ? "3분 셋업으로 14일 잔고 예측·위기 알림이 켜집니다" : "3-min setup unlocks 14-day forecast & crisis alerts",
        navigate: { surface: "home", selector: "[data-cashflow-hero]", openCashflowSetup: {} },
      });
    }

    // 10. 비용 구조 미등록 — monthlyCosts 모두 0 (운영 중일 때만)
    if (businessLaunched && monthlyCosts) {
      const mc = monthlyCosts as Record<string, number>;
      const totalMonthly =
        (mc.ingredients ?? 0) + (mc.labor ?? 0) + (mc.rent ?? 0) + (mc.utilities ?? 0) +
        (mc.sga ?? 0) + (mc.marketing ?? 0) + (mc.other ?? 0) + (mc.interest ?? 0);
      if (totalMonthly === 0) {
        items.push({
          id: "monthly-costs-empty",
          severity: "warning",
          title: ko ? "월 비용 구조 미등록" : "Monthly cost structure missing",
          detail: ko ? "재료비·인건비·임대료를 등록하면 손익 분석이 시작됩니다" : "Add materials/labor/rent to enable P&L diagnosis",
          navigate: { surface: "analytics", selector: "[data-cost-management]" },
        });
      }
    }

    // 11. 고정 지출 D-day 미등록 (cashflow setup 완료된 사장님 한정 — 셋업 자체가 안 된 사장님은 항목 9 가 우선)
    if (cashflowSetupCompletedAt && cashflowFixedExpenses.length === 0) {
      items.push({
        id: "fixed-expenses-missing",
        severity: "warning",
        title: ko ? "고정 지출 D-day 미등록" : "Fixed schedule missing",
        detail: ko ? "월세·급여·이자 등록 시 14일 잔고 예측이 정확해집니다" : "Add rent/payroll/loan to sharpen 14-day forecast",
        navigate: { surface: "analytics", selector: "[data-cost-management]" },
      });
    }

    // 13. 지원금 마감 임박 (사용자 매칭 + 자격 충족 + D-7 이내) — 최대 3건
    //  ⚠️ 사용자 상황 *전부* 주입 — 이전 버그: businessYears=0 hardcoded → 운영 중 사장님께
    //     예비창업 프로그램 (businessYearRange [0,0]) 이 잘못 매칭되던 문제 (2026-05-09 fix).
    if (businessLaunched) {
      // 정확한 businessYears 계산
      const bizYears = businessLaunchedDate
        ? Math.max(0, Math.floor((Date.now() - new Date(businessLaunchedDate).getTime()) / (365 * 86_400_000)))
        : 0;

      // 위기 신호 — 런웨이 + 매출 추세 (정확하지 않아도 위기 부스트 트리거 OK)
      const dailyEntriesArr = (dailyEntries as { date: string; sales: number }[] | undefined) ?? [];
      const sortedEntries = [...dailyEntriesArr].sort((a, b) => a.date.localeCompare(b.date));
      const last7 = sortedEntries.slice(-7);
      const prev7 = sortedEntries.slice(-14, -7);
      const avg7 = last7.length > 0 ? last7.reduce((s, e) => s + e.sales, 0) / last7.length : 0;
      const avgPrev = prev7.length > 0 ? prev7.reduce((s, e) => s + e.sales, 0) / prev7.length : 0;
      const weeklyChangePct = avgPrev > 0 ? Math.round(((avg7 - avgPrev) / avgPrev) * 1000) / 10 : undefined;

      const totalCost = monthlyCosts ? Object.values(monthlyCosts as Record<string, unknown>).reduce(
        (s: number, v) => s + (typeof v === "number" ? v : 0), 0,
      ) : 0;
      const cash = initialOperatingCapital ?? 0;
      const monthlyRev = avg7 * 26;
      const burn = Math.max(0, totalCost - monthlyRev);
      const runwayMonths = (cash > 0 && burn > 0) ? Math.round((cash / burn) * 10) / 10 : undefined;

      const matchedPrograms = getMatchedProgramsV2({
        startupType,
        industryCategoryId,
        businessYears: bizYears,
        region: preferredRegionInput || undefined,
        capital: selectedBudget ?? undefined,
        businessStage: bizYears >= 3 ? "growth" : "early",
        runwayMonths,
        weeklySalesChangePct: weeklyChangePct,
        employeesCount: (employees as { id: string }[]).length,
      });
      const urgent = matchedPrograms
        .filter((p) => p.eligible && p.daysUntilDeadline != null && p.daysUntilDeadline >= 0 && p.daysUntilDeadline <= 7)
        .slice(0, 3);
      urgent.forEach((p) => {
        const days = p.daysUntilDeadline!;
        items.push({
          id: `funding-deadline-${p.id}`,
          severity: days <= 2 ? "urgent" : "warning",
          title: ko
            ? (days === 0 ? `${p.name.ko} 오늘 마감` : `${p.name.ko} D-${days}`)
            : (days === 0 ? `${p.name.en} due today` : `${p.name.en} in ${days}d`),
          detail: ko
            ? `${p.organizer.ko} · ${p.amount ?? p.benefit.ko.slice(0, 30)}`
            : `${p.organizer.en} · ${p.amount ?? p.benefit.en.slice(0, 30)}`,
          navigate: { surface: "guides" },
        });
      });
    }

    // ── 노동법·세법 무지 보호 알림 (사용자 명령 2026-05-09) ────────────────────────
    //
    //   ⚠️ 모든 메시지는 *참고용 운영 보조* — 법률 자문 아님.
    //      복잡 분쟁 / 정확한 계산은 노무사·세무사 상담 권장.

    // 14. 주 15h 임계 — 주휴수당 발생 임박 직원 알림
    //  근로기준법 55조: 주 15h+ 근로 + 1주 개근 → 주휴수당 의무.
    //  무지로 14h~15h 사이 미지급 시 임금체불 (3년 시효, 형사처벌).
    if ((employees as { id: string }[]).length > 0) {
      const checks = checkWeeklyHoursThreshold(
        employees as { id: string; name: string; weeklyHours: number }[],
      );
      const approaching = checks.filter((c) => c.level === "approaching");
      const exceeded = checks.filter((c) => c.level === "exceeded");
      // approaching 만 알림 (exceeded 는 이미 발생 — TeamCard 의 표시로 처리)
      approaching.slice(0, 2).forEach((c) => {
        items.push({
          id: `weekly-hours-${c.employeeId}`,
          severity: "warning",
          title: ko ? `${c.employeeName}님 주휴수당 임박` : `${c.employeeName} approaching weekly bonus`,
          detail: ko ? c.suggestion : `${c.weeklyHours}h/week — ${c.hoursToThreshold}h to threshold`,
          navigate: { surface: "home", selector: "[data-team-card]" },
        });
      });
      // exceeded 직원이 있으면 합산 알림 1건 (개별 X)
      if (exceeded.length > 0) {
        items.push({
          id: "weekly-hours-exceeded",
          severity: "urgent",
          title: ko
            ? `주휴수당 대상 직원 ${exceeded.length}명`
            : `${exceeded.length} eligible for weekly bonus`,
          detail: ko
            ? "주 15h 이상 근로 + 1주 개근 시 주휴수당 의무. 미지급 = 임금체불 (3년 시효, 형사처벌)."
            : "Weekly bonus required. Non-payment = wage theft.",
          navigate: { surface: "home", selector: "[data-team-card]" },
        });
      }
    }

    // 15. 연차 1년 도래 — 입사일 기반 자동 추적
    //  근로기준법 60조: 1년 이상 근속 → 15일 연차. 미부여 시 수당 환산.
    if ((employees as { id: string }[]).length > 0) {
      const checks = checkAnnualLeaveAccrual(
        employees as { id: string; name: string; hireDate?: string }[],
      );
      checks
        .filter((c) => c.level === "approaching" || c.level === "due")
        .slice(0, 2)
        .forEach((c) => {
          items.push({
            id: `annual-leave-${c.employeeId}`,
            severity: c.level === "due" ? "urgent" : "warning",
            title: c.level === "due"
              ? (ko ? `${c.employeeName}님 입사 1년 — 연차 발생` : `${c.employeeName} 1yr anniversary`)
              : (ko ? `${c.employeeName}님 1년 D-${c.daysUntilYearMark}` : `${c.employeeName} D-${c.daysUntilYearMark}`),
            detail: ko ? c.suggestion : `${c.daysSinceHire}d since hire`,
            navigate: { surface: "home", selector: "[data-team-card]" },
          });
        });
    }

    // 16. 5인 미만 → 5인 이상 임계 시뮬레이션 (4명 직원일 때 1회 안내)
    //  추가 의무: 연차·가산수당·부당해고 제한·괴롭힘 금지법·휴업수당
    if ((employees as { id: string }[]).length === 4) {
      items.push({
        id: "five-person-threshold",
        severity: "warning",
        title: ko ? "5인 이상 사업장 임계 직전 (4명)" : "Approaching 5-person threshold",
        detail: ko
          ? "1명 추가 시 연차 의무·가산수당 50%·부당해고 제한·괴롭힘 금지법·휴업수당 모두 적용. 인건비 계산 사전 점검 필요."
          : "Adding 1 more triggers full Labor Standards Act — annual leave, overtime 50%, unfair dismissal, etc.",
        navigate: { surface: "home", selector: "[data-team-card]" },
      });
    }

    // 17. 간이과세 → 일반과세 전환 임박 (직전 연도 매출 1억 400만원)
    //  부가가치세법 시행령 109조: 매출 1억 400만 초과 → 다음 해 7월부터 일반과세 전환.
    if (businessLaunched && taxSettings.vatType === "simplified") {
      // 올해 누적 매출 (월~오늘)
      const currentYear = new Date().getFullYear();
      const yearStartMs = new Date(currentYear, 0, 1).getTime();
      const yearlySales = (dailyEntries as { date: string; sales: number }[]).reduce(
        (s, e) => new Date(e.date).getTime() >= yearStartMs ? s + e.sales : s, 0,
      );
      const check = checkSimplifiedTaxTransition(yearlySales);
      // approaching 이상일 때만 알림 (60% 이상)
      if (check.level === "approaching" || check.level === "near" || check.level === "exceeded") {
        items.push({
          id: "simplified-tax-transition",
          severity: check.level === "exceeded" ? "urgent" : check.level === "near" ? "warning" : "warning",
          title: ko
            ? `간이과세 한도 ${check.progressPct}% 진입`
            : `Simplified tax: ${check.progressPct}%`,
          detail: ko ? check.suggestion : `${check.progressPct}% of 104M threshold`,
          navigate: { surface: "analytics", selector: "[data-cost-management]" },
        });
      }
    }

    // 18. 현금영수증 의무 안내 — 1회성 (이미 알면 dismiss)
    //  ⚠️ 구분: ① 가맹점 의무(소비자상대업종, 직전기 수입 2,400만+) = 요청 시 발급, 미발급 5% 가산세.
    //          ② 의무발행업종(소득세법 시행령 별표3의3: 학원·병원·전문직·숙박·골프장·네일 등) = 10만원+
    //             현금 시 요청 없어도 무조건 발급, 미발급 20% 가산세.
    //  ⚠️ 일반 음식점·카페·헤어미용은 의무발행업종 아님(요청 시 발급). 학원(education)만 별표3의3 의무발행.
    if (businessLaunched && (employees as { id: string }[]).length > 0
        && ["food", "cafe-dessert", "education", "beauty", "fitness", "pet"].includes(industryCategoryId ?? "")) {
      const mustIssue = industryCategoryId === "education"; // 학원 = 의무발행업종(별표3의3)
      items.push({
        id: "cash-receipt-mandatory",
        severity: "warning",
        title: ko ? (mustIssue ? "현금영수증 의무발행 업종" : "현금영수증 가맹점 의무") : "Cash receipt obligation",
        detail: ko
          ? (mustIssue
              ? "학원 등 의무발행업종 — 10만원 이상 현금 거래 시 요청 없어도 의무 발행. 미발행 = 거래대금 20% 가산세."
              : "소비자상대업종은 현금영수증 가맹점 가입 의무 — 손님 요청 시 발급(미발급 5% 가산세). ※일반 음식점·카페·미용은 요청 없으면 발급 의무 없음(의무발행업종 아님).")
          : (mustIssue
              ? "Mandatory-issue업종: ≥100K KRW cash → must issue even without request. Non-issue = 20% penalty."
              : "Consumer-facing: must join cash-receipt program + issue on request (5% penalty if refused)."),
        navigate: { surface: "analytics", selector: "[data-cost-management]" },
      });
    }

    // 12. 오늘의 일일 보고서 도착 — 영업 종료 시각 + 30분 (또는 21:00 KST 디지털) 이후 자동 알림
    //  사용자 요청 (2026-05-08): "보고서가 오는 시간에 알림 드랍다운에 알림으로 보내라"
    //  중복 방지 — 같은 KST 날짜에 사장님이 한번 dismiss 하면 (UI 쪽 처리) 또는 자정 지나면 자동 갱신.
    if (businessLaunched) {
      const closed = isBusinessDayClosed(new Date(), {
        categoryId: industryCategoryId,
        closeTime: businessCloseTime,
      });
      if (closed) {
        const todayKst = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
        items.push({
          id: `daily-report-${todayKst}`, // 날짜 포함 → 자정 지나면 새 ID = 새 알림
          severity: "warning",
          title: ko ? "오늘의 보고서가 도착했어요" : "Today's report is ready",
          detail: ko
            ? "오늘 매출·비용·인사이트가 정리됐어요. 1분이면 핵심을 훑어볼 수 있어요."
            : "Today's sales, costs, and insights are ready. 1-minute summary.",
          navigate: { surface: "reports" },
        });
      }
    }

    setNotifications(items);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, inventory, employees, fixedExpenses, members, taxSettings, businessLaunched, businessLaunchedDate, businessCtx.hasPhysicalInventory, businessCtx.isRecurringRevenue, completedCount, pathTotalStages, costHistory, dailyEntries, monthlyCosts, cashflowSetupCompletedAt, cashflowFixedExpenses, businessCloseTime, industryCategoryId, payDay, startupType, preferredRegionInput, selectedBudget, initialOperatingCapital]);

  return {
    contractors,
    contractorsLoading,
    contractorsRetryKey,
    setContractorsRetryKey,
    aiMarketRegion,
    setAiMarketRegion,
  };
}
