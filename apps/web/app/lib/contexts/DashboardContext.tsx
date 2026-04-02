"use client";

import { createContext, useContext } from "react";
import type { DashboardHook } from "../useDashboard";
import type { ProgramCategory } from "@build-up/shared";

/**
 * 로컬 상태 — starter-stage-demo.tsx에서 hoisted된 useState들.
 * 하위 컴포넌트가 props 없이 접근할 수 있도록 Context에 포함.
 */
export type LocalStageState = {
  // 프랜차이즈 필터
  filterCat: string;
  setFilterCat: (v: string) => void;
  expandedId: string | null;
  setExpandedId: (v: string | null) => void;

  // 경쟁업체 검색
  competitorResults: { totalCount: number; places: Array<{ name: string; address: string; phone: string; url: string }> } | null;
  setCompetitorResults: (v: { totalCount: number; places: Array<{ name: string; address: string; phone: string; url: string }> } | null) => void;
  competitorLoading: boolean;
  setCompetitorLoading: (v: boolean) => void;

  // 사업계획서
  bpLoading: boolean;
  setBpLoading: (v: boolean) => void;
  bpSections: Array<{ title: string; content: string }> | null;
  setBpSections: (v: Array<{ title: string; content: string }> | null) => void;
  bpSummary: string | null;
  setBpSummary: (v: string | null) => void;
  bpError: string | null;
  setBpError: (v: string | null) => void;
  bpExpandedIdx: number | null;
  setBpExpandedIdx: (v: number | null) => void;

  // 온보딩
  onboardingDismissed: boolean;
  setOnboardingDismissed: (v: boolean) => void;

  // 지원사업 필터
  progFilter: ProgramCategory | "all";
  setProgFilter: (v: ProgramCategory | "all") => void;

  // 라이브 데이터
  liveProgramsData: Array<{ id: string; programName: string; organizerName: string; supportCategory: string; isOpen: boolean; url?: string }>;
  setLiveProgramsData: (v: Array<{ id: string; programName: string; organizerName: string; supportCategory: string; isOpen: boolean; url?: string }>) => void;
  liveProgramsLoading: boolean;
  setLiveProgramsLoading: (v: boolean) => void;

  liveMarketInsights: { loading: boolean; population?: { total: number; households: number; male: number; female: number } } | null;
  setLiveMarketInsights: (v: { loading: boolean; population?: { total: number; households: number; male: number; female: number } } | null) => void;

  regPage: number;
  setRegPage: (v: number) => void;

  livePermitInsights: { loading: boolean; data?: { total: number; operating: number; closed: number; survivalRate: number } } | null;
  setLivePermitInsights: (v: { loading: boolean; data?: { total: number; operating: number; closed: number; survivalRate: number } } | null) => void;

  liveBudgetBenchmark: { loading: boolean; data?: { avgTotalStartupCost: number; avgFranchiseFee: number; avgDeposit: number; avgEducationFee: number; avgOtherCost: number; industryName: string } } | null;
  setLiveBudgetBenchmark: (v: { loading: boolean; data?: { avgTotalStartupCost: number; avgFranchiseFee: number; avgDeposit: number; avgEducationFee: number; avgOtherCost: number; industryName: string } } | null) => void;

  // 마운트 상태
  mounted: boolean;
};

export type DashboardContextValue = DashboardHook & LocalStageState;

// 초기값은 null — Provider 없이 사용 시 에러
const DashboardCtx = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  value,
  children,
}: {
  value: DashboardContextValue;
  children: React.ReactNode;
}) {
  return <DashboardCtx.Provider value={value}>{children}</DashboardCtx.Provider>;
}

/**
 * 하위 컴포넌트에서 사용:
 * ```
 * const d = useDashboardCtx();
 * d.selectedIndustryId, d.setSelectedIndustryId, d.language, ...
 * ```
 */
export function useDashboardCtx(): DashboardContextValue {
  const ctx = useContext(DashboardCtx);
  if (!ctx) throw new Error("useDashboardCtx must be used within DashboardProvider");
  return ctx;
}
