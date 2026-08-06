"use client";

/**
 * /dev/vendor-stage-preview — vendor-setup 단계 "AI 추천" 행 실렌더 검증 (dev 전용, prod 404).
 *
 * 2026-08-05 감사 후속: AI 위저드 공급처 추천(`__etc__` 커스텀)이 VendorSetupStage 에서
 * 안 보이던 문제 수정 — 카탈로그 일치 프리체크 + "AI 추천" 커스텀 행 + s4 인테리어·기타 섹션.
 * 픽스처는 프로덕션 경로(buildAiVendorHandoff)를 그대로 통과시켜 만든다 (검증 왜곡 방지).
 */
import { useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { DashboardProvider, type DashboardContextValue } from "../../lib/contexts/DashboardContext";
import { VendorSetupStage } from "../../lib/components/stages/offline/VendorSetupStage";
import { buildAiVendorHandoff, getVendorData } from "../../lib/components/stages/offline/vendor-setup-data";
import { useRoadmapStore } from "../../lib/stores";

// AI 위저드 추천 픽스처 — 카탈로그 일치 1건 + 커스텀(공급처·장비·POS) + 인테리어 시공.
const FIXTURE_SUPPLIERS = [
  { id: "db-1", name: "", category: "식자재", reason: "", priceRange: "" }, // name 은 카탈로그에서 주입
  { id: "db-2", name: "동네착한도매", category: "식자재 도매", reason: "우리 동네 30년 도매상 — 새벽 배송 가능", priceRange: "월 40~60만원" },
  { name: "중고주방나라", category: "주방 장비", reason: "중고 장비 A/S 1년 보증", priceRange: "신품 대비 55%" },
  { name: "간편예약페이", category: "결제·예약 통합", reason: "예약금 결제 수수료 1.9%", priceRange: "월 3.3만원" },
];
const FIXTURE_INTERIOR = [
  { id: "iv-1", title: "우리동네인테리어", description: "소형 외식 전문", checkItems: [], reason: "10평 이하 시공 실적 다수" },
];

export default function VendorStagePreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const catalog = useMemo(() => getVendorData("korean-casual", "food"), []);
  const suppliers = useMemo(
    () => FIXTURE_SUPPLIERS.map((s, i) => (i === 0 ? { ...s, name: catalog.suppliers[0].name } : s)),
    [catalog],
  );
  const handoff = useMemo(
    () => buildAiVendorHandoff(suppliers, FIXTURE_INTERIOR, catalog),
    [suppliers, catalog],
  );

  const [vendorSelections, setVendorSelections] = useState<Record<string, string>>(handoff.vendorSelections);
  const [guideSelections, setGuideSelections] = useState<Record<string, string>>({});
  const [decisions, setDecisions] = useState<Record<string, unknown>>({});
  const [inventory, setInventory] = useState<unknown[]>([]);

  // 스테이지가 이유·가격·검증 여부를 enrich 하는 소스 — 위저드가 저장하는 것과 동일 shape 만 주입.
  useEffect(() => {
    useRoadmapStore.getState().setAiRoadmapResult({
      generatedAt: "2026-08-05T00:00:00.000Z",
      marketAnalysis: { score: 0, grade: "C", footTraffic: "", competition: "", rentLevel: "", targetFit: "", summary: "" },
      budgetAllocation: { deposit: 0, interior: 0, equipment: 0, workingCapital: 0, total: 0 },
      recommendations: {
        suppliers,
        interior: [],
        interiorVendors: FIXTURE_INTERIOR,
        permits: [],
        taxAdvice: "",
        deliveryPlatforms: [],
        snsChannels: [],
      },
      timeline: { targetOpenDate: "", totalWeeks: 16, phases: [] },
      risks: [],
    });
    return () => useRoadmapStore.getState().setAiRoadmapResult(null);
  }, [suppliers]);

  const ctx = {
    language: "ko",
    selectedIndustryId: "korean-casual",
    industryCategoryId: "food",
    selectedSpecialtyId: null,
    vendorSelections,
    setVendorSelections,
    vendorCustomInputs: handoff.vendorCustomInputs,
    setVendorCustomInputs: () => {},
    guideSelections,
    setGuideSelections,
    decisions,
    setDecisions,
    inventory,
    setInventory,
    ingredientsMonthlyKrw: 0,
    ingredientsCogsRate: null,
    ingredientsExpectedRevenueKrw: 0,
  } as unknown as DashboardContextValue;

  return (
    <div style={{ minHeight: "100vh", padding: "24px 16px", maxWidth: 760, margin: "0 auto" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#191970", letterSpacing: "0.12em", marginBottom: 10 }}>
        DEV 프리뷰 — AI 위저드 추천 → vendor-setup 핸드오프 (카탈로그 일치 1 + 커스텀 3 + 인테리어 1)
      </div>
      <DashboardProvider value={ctx}>
        <VendorSetupStage />
      </DashboardProvider>
    </div>
  );
}
