"use client";

/**
 * /dev/labor-preview — 분업 선언 섹션 실렌더 검증 (dev 전용, prod 404).
 *  AI 생성 없이 대표 픽스처 2종(외식 프랜차이즈 / 온라인)으로 레이아웃 확인.
 */
import { notFound } from "next/navigation";
import type { RoadmapGenerationResult } from "@foundone/ai";
import { DivisionOfLabor } from "../../lib/components/AIRoadmapWizard";

const base = {
  conceptSummary: "",
  identity: { suggestedStoreName: "", mission: "", targetCustomer: "", businessOpenTime: "", businessCloseTime: "" },
  team: { initialSize: 1, roles: [] },
  insurance: [{ name: "화재배상책임보험", type: "fire", required: true, annualPremiumEstimate: 150000, reason: "" }],
  moneyInfra: { recommendedBank: "toss", recommendedBankReason: "", recommendedPos: "tossplace", recommendedPosReason: "", cpaDecision: "hybrid" as const, cpaReason: "" },
  fundingPrograms: [],
  budgetAllocation: { total: 80_000_000, deposit: 30_000_000, interior: 30_000_000, equipment: 10_000_000, workingCapital: 10_000_000 },
  monthlyCosts: { ingredients: 3_000_000, labor: 2_000_000, rent: 1_500_000, utilities: 300_000, other: 200_000 },
  timeline: { targetOpenDate: "2026-11-01", totalWeeks: 12, phases: [] },
  risks: [],
  marketAnalysis: { score: 0, grade: "C", footTraffic: "", competition: "", rentLevel: "", targetFit: "", summary: "" },
};

const cafeFranchise = {
  ...base,
  parsed: {
    industryCategoryId: "cafe-dessert", subIndustryId: "takeout-coffee", industryLabel: "테이크아웃 커피",
    startupType: "franchise" as const, businessModelId: "hall-focused", preferredRegion: "대전 둔산동",
    matchingReason: "", matchingConfidence: 90, alternativeSubIndustries: [],
  },
  legal: {
    taxType: "simplified" as const, taxTypeReason: "", industryCode: "552303", fourInsuranceRequired: false,
    permitsDetailed: [
      { name: "위생교육 수료", kind: "교육", where: "휴게음식업중앙회", cost: "3만원", duration: "1일", required: true },
      { name: "휴게음식점 영업신고", kind: "신고", where: "관할 구청 위생과", cost: "약 4만원", duration: "즉시~3일", required: true },
      { name: "사업자등록", kind: "등록", where: "홈택스 또는 세무서", cost: "무료", duration: "즉시~2일", required: true },
    ],
  },
  recommendations: {
    deliveryPlatforms: [], snsChannels: [], permits: [],
    suppliers: [{ name: "A원두", category: "식자재", reason: "", priceRange: "" }],
    interiorVendors: [{ id: "v1", title: "시공사", description: "", checkItems: [], reason: "" }],
    operationalChannels: [
      { id: "naver-place", nameKo: "네이버 플레이스", type: "social-commerce", typeLabelKo: "", commissionRate: 0, priority: 1 as const, reason: "" },
      { id: "baemin", nameKo: "배민", type: "delivery", typeLabelKo: "", commissionRate: 6.8, priority: 2 as const, reason: "" },
    ],
  },
  industrySpecific: { menu: [{ name: "아메리카노", price: 3000, reason: "" }] },
} as unknown as RoadmapGenerationResult;

const online = {
  ...base,
  parsed: {
    industryCategoryId: "online-digital", subIndustryId: "smart-store", industryLabel: "스마트스토어 커머스",
    startupType: "independent" as const, businessModelId: "marketplace", preferredRegion: "",
    matchingReason: "", matchingConfidence: 88, alternativeSubIndustries: [],
  },
  legal: {
    taxType: "simplified" as const, taxTypeReason: "", industryCode: "525101", fourInsuranceRequired: false,
    permitsDetailed: [
      { name: "사업자등록", kind: "등록", where: "홈택스", cost: "무료", duration: "즉시~2일", required: true },
      { name: "통신판매업 신고", kind: "신고", where: "정부24", cost: "등록면허세 연 4만원 내외", duration: "1~3일", required: true },
    ],
  },
  recommendations: { deliveryPlatforms: [], snsChannels: [], permits: [], suppliers: [], operationalChannels: [] },
} as unknown as RoadmapGenerationResult;

export default function LaborPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px" }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>외식 · 프랜차이즈</h2>
      <DivisionOfLabor result={cafeFranchise} ko />
      <h2 style={{ fontSize: 14, fontWeight: 700, margin: "28px 0 12px" }}>온라인 · 독립</h2>
      <DivisionOfLabor result={online} ko />
    </div>
  );
}
