"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  fetchLiveCompetitorStores,
  fetchLivePermits,
  fetchLivePopulation,
  fetchLiveTransactions,
  fetchLiveIndustryCosts,
  fetchLiveRegionalSales,
  fetchLiveSupportPrograms,
  fetchLiveStoreChanges,
} from "../services/live-data";
import type {
  SemasStoreData,
  LocaldataPermitData,
  PopulationData,
  CommercialTransactionData,
  IndustryStartupCostData,
  RegionalSalesData,
  GovernmentSupportProgram,
  StoreChangeData,
} from "@build-up/shared";

// ── 카테고리 → API 업종코드 매핑 ──
const CATEGORY_TO_INDUSTRY_CODE: Record<string, string> = {
  "food": "Q",       // 음식
  "cafe-dessert": "Q",
  "retail": "D",      // 소매
  "beauty": "F",      // 서비스 (미용)
  "fitness": "R",     // 스포츠/여가
  "education": "P",   // 교육
  "pet": "D",
  "living-service": "F",
  "online-digital": "D",
  "startup-tech": "L",
  "space": "R",
};

// ── 지역명 → 시도/시군구 파싱 ──
function parseRegion(region: string): { sido: string; sigungu: string } {
  // "서울 강남구" → { sido: "서울특별시", sigungu: "강남구" }
  const parts = region.replace(/\s+/g, " ").trim().split(" ");
  let sido = parts[0] ?? "";
  const sigungu = parts[1] ?? "";

  // 약식 → 정식 변환
  if (sido === "서울") sido = "서울특별시";
  else if (sido === "부산") sido = "부산광역시";
  else if (sido === "대구") sido = "대구광역시";
  else if (sido === "인천") sido = "인천광역시";
  else if (sido === "광주") sido = "광주광역시";
  else if (sido === "대전") sido = "대전광역시";
  else if (sido === "울산") sido = "울산광역시";
  else if (sido === "세종") sido = "세종특별자치시";
  else if (sido === "경기") sido = "경기도";
  else if (sido === "제주") sido = "제주특별자치도";

  return { sido, sigungu };
}

export type LiveStageData = {
  // 상권 분석
  competitorStores?: SemasStoreData[];
  competitorCount?: number;
  permits?: LocaldataPermitData[];
  permitSummary?: { operating: number; closed: number; closureRate: number };
  population?: PopulationData[];
  totalPopulation?: number;
  // 부동산
  transactions?: CommercialTransactionData[];
  avgPricePerSqm?: number;
  // 업종 통계
  industryCosts?: IndustryStartupCostData[];
  regionalSales?: RegionalSalesData[];
  storeChanges?: StoreChangeData[];
  // 지원사업
  supportPrograms?: GovernmentSupportProgram[];
};

type UseLiveStageDataParams = {
  stageId: string;
  industryCategoryId: string;
  region?: string;
  capital?: number;
  token?: string;
};

export function useLiveStageData(params: UseLiveStageDataParams) {
  const { stageId, industryCategoryId, region, token } = params;
  const [data, setData] = useState<LiveStageData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fetchedRef = useRef<string>("");

  const fetchData = useCallback(async () => {
    const cacheKey = `${stageId}:${industryCategoryId}:${region ?? ""}`;
    if (fetchedRef.current === cacheKey) return; // 중복 방지
    fetchedRef.current = cacheKey;

    setIsLoading(true);
    setErrors([]);
    const result: LiveStageData = {};
    const errs: string[] = [];

    const indsCode = CATEGORY_TO_INDUSTRY_CODE[industryCategoryId] ?? "Q";
    const { sido, sigungu } = parseRegion(region ?? "");

    try {
      // 스테이지별로 필요한 데이터만 fetch
      if (stageId === "location-candidates" || stageId === "permit-check") {
        // 경쟁 업체
        const [storesRes, popRes] = await Promise.allSettled([
          fetchLiveCompetitorStores({ indsLclsCd: indsCode, numOfRows: 100 }, token),
          sido ? fetchLivePopulation({ sido, sigungu }, token) : Promise.resolve(null),
        ]);

        if (storesRes.status === "fulfilled") {
          result.competitorStores = storesRes.value.data;
          result.competitorCount = storesRes.value.totalCount ?? storesRes.value.data.length;
        } else {
          errs.push("상가 데이터 조회 실패");
        }

        if (popRes.status === "fulfilled" && popRes.value) {
          const popData = "data" in popRes.value ? popRes.value.data : [];
          result.population = popData;
          result.totalPopulation = popData.reduce((s: number, p: PopulationData) => s + p.totalPopulation, 0);
        }
      }

      if (stageId === "permit-check") {
        try {
          const permitRes = await fetchLivePermits({ pageSize: 200 }, token);
          result.permits = permitRes.data;
          const operating = permitRes.data.filter(p => p.status === "operating").length;
          const closed = permitRes.data.filter(p => p.status === "closed").length;
          const total = operating + closed;
          result.permitSummary = {
            operating,
            closed,
            closureRate: total > 0 ? Math.round((closed / total) * 100) : 0,
          };
        } catch {
          errs.push("인허가 데이터 조회 실패");
        }
      }

      if (stageId === "budget-setup") {
        const [costsRes, salesRes] = await Promise.allSettled([
          fetchLiveIndustryCosts({ industryCode: indsCode }, token),
          fetchLiveRegionalSales({ industryCode: indsCode }, token),
        ]);

        if (costsRes.status === "fulfilled") result.industryCosts = costsRes.value.data;
        else errs.push("업종별 창업비용 조회 실패");

        if (salesRes.status === "fulfilled") result.regionalSales = salesRes.value.data;
        else errs.push("지역별 매출 조회 실패");
      }

      if (stageId === "location-candidates" && region) {
        try {
          const dealYm = new Date().toISOString().slice(0, 7).replace("-", "");
          const txRes = await fetchLiveTransactions({ lawdCd: "11680", dealYm }, token);
          result.transactions = txRes.data;
          if (txRes.data.length > 0) {
            result.avgPricePerSqm = Math.round(
              txRes.data.reduce((s, t) => s + t.pricePerSqm, 0) / txRes.data.length
            );
          }
        } catch {
          errs.push("부동산 실거래가 조회 실패");
        }
      }

      if (stageId === "funding-support") {
        const [progsRes, changesRes] = await Promise.allSettled([
          fetchLiveSupportPrograms({ keyword: industryCategoryId === "startup-tech" ? "창업" : "소상공인", numOfRows: 20 }, token),
          fetchLiveStoreChanges({ industryCode: indsCode }, token),
        ]);

        if (progsRes.status === "fulfilled") result.supportPrograms = progsRes.value.data;
        else errs.push("지원사업 조회 실패");

        if (changesRes.status === "fulfilled") result.storeChanges = changesRes.value.data;
      }
    } catch (e) {
      errs.push(e instanceof Error ? e.message : "데이터 조회 실패");
    }

    setData(result);
    setErrors(errs);
    setIsLoading(false);
  }, [stageId, industryCategoryId, region, token]);

  useEffect(() => {
    if (stageId) fetchData();
  }, [stageId, fetchData]);

  return { data, isLoading, errors, refetch: fetchData };
}
