"use client";

/**
 * MenuDesignStage.tsx — 메뉴/서비스 라인업 확정 단계 (cluster-aware dispatcher)
 *
 * stageId: "menu-design"
 *
 * 사장님 신고 (2026-05-14): "메뉴 결정 과정이 어디에도 없어. 미리 결정하면
 * 재고 관리 카드에 들어가게 해서 수고를 덜 수 있어."
 *
 * 위치: offline path, construction-setup → menu-design → vendor-setup.
 *
 * Cluster 분기 (iOS MenuDesignStageView 의 MenuCluster 와 1:1 패리티):
 *   • food / cafe-dessert → 메뉴 (이름·판매가·원가·주재료)        · 원가율 33%
 *   • beauty/fitness/pet/education/living/space → 서비스          · 원가율 25%
 *   • retail / online-digital → 상품 (SKU·매입가·판매가)          · 마진 40~50%
 *   • startup-tech → 구독 티어 (Free/Starter/Pro/Enterprise)       · 인프라 30%↓
 *
 *   이전엔 food/cafe 만 구조화 폼이고 나머지는 "임시 입력(전용 패널 출시 전)"
 *   원시 JSON 스텁이었음 — 2026-06-30 전 cluster 구조화 폼으로 통일(웹↔iOS 패리티).
 *
 * 데이터 흐름:
 *   1. 사용자가 cluster-aware 폼에서 lineup 항목 입력
 *   2. decisions["menu-design"].inputs.menuItemsJson 에 JSON 직렬화 저장 (iOS 패리티 키)
 *   3. inventory[] 에 product 로 자동 반영 → 재고 카드 자동 표시
 *
 * 검증 출처:
 *   · 한국외식산업연구원 2024 — Prime Cost 65% 황금률 (식자재 30-35% + 인건비 28-32%)
 *   · 소상공인진흥공단/중기청/네이버쇼핑/OpenView 2024 — 업종별 원가·마진 표준
 */

import { ChefHat, Plus, Trash2, AlertTriangle, Sparkles } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import type { InventoryItem } from "../../../stores/operations-store";
import {
  MIDNIGHT,
  MIDNIGHT_BORDER,
  StartupKeyActionHero,
  StartupPageNav,
  StartupReferenceLabel,
} from "../startup/StartupStageShell";
import { StageWrapup } from "./StageWrapup";

const STAGE_ID = "menu-design";

// ── 단일 lineup item 통합 schema (cluster-aware) ───────────────────────
export type LineupItem = {
  id: string;
  name: string;
  category: string;        // food: 메뉴 카테고리 / saas: tier name
  price: number;           // 판매가 (or 월 구독료)
  cost: number;            // 원가 (or 한계비용 추정)
  /** food/cafe: 주재료, service: 소요시간·도구, retail: 옵션·재고, saas: 핵심 feature */
  notes: string;
};

// ── Cluster 그룹 분류 (iOS MenuCluster.from 미러) ──────────────────────
type Cluster = "food" | "cafe" | "service" | "retail" | "online" | "saas";
function classifyCluster(categoryId: string | undefined): Cluster {
  switch (categoryId) {
    case "food": return "food";
    case "cafe-dessert": return "cafe";
    case "beauty":
    case "fitness":
    case "pet":
    case "education":
    case "living-service":
    case "space-stay":
    case "space":
      return "service";
    case "retail": return "retail";
    case "online-digital": return "online";
    case "startup-tech": return "saas";
    default: return "food";
  }
}

// ── Cluster 별 copy (iOS MenuCluster 카피와 1:1 미러) ──────────────────
type Bench = { value: string; label: string; detail: string };
type ClusterCopy = {
  noun: string;
  categories: string[];
  namePlaceholder: string;
  costPlaceholder: string;
  notesPlaceholder: string;
  ratioLabel: string;          // COST 페이지 평균 비율 라벨
  goldenMax: number;           // 원가율 경보 임계 (%)
  heroTitle: string;
  heroSubtitle: string;
  whyEyebrow: string;
  whyHeadline: string;
  whyDetail: string;
  benchEyebrow: string;
  bench: [Bench, Bench, Bench];
  nextStageLabel: string;
};

function clusterCopy(cl: Cluster, ko: boolean): ClusterCopy {
  const C: Record<Cluster, ClusterCopy> = {
    food: {
      noun: ko ? "메뉴" : "Menu",
      categories: ko ? ["메인", "사이드", "주류/음료", "디저트", "세트"] : ["Main", "Side", "Drinks", "Dessert", "Set"],
      namePlaceholder: ko ? "메뉴 이름 (예: 김치찌개 정식)" : "Item name (e.g., Kimchi stew set)",
      costPlaceholder: ko ? "1인분 원가 (원)" : "Unit cost (₩)",
      notesPlaceholder: ko ? "주재료 (예: 김치 100g, 돼지고기 60g) — 선택" : "Main ingredients (optional)",
      ratioLabel: ko ? "메뉴 평균 식자재 원가율" : "Avg ingredient cost ratio",
      goldenMax: 33,
      heroTitle: ko ? "시그니처 3-5개 + 사이드로 메뉴 락" : "3-5 signatures + sides — lock the menu",
      heroSubtitle: ko
        ? "Prime Cost 황금률: 식자재 30-35% + 인건비 28-32% = 65% 이하. 원가율 33% 초과 메뉴는 영업이익 마이너스 — 한국외식산업연구원 2024."
        : "Prime Cost golden ratio: ingredients 30-35% + labor 28-32% ≤ 65%. Menus over 33% material cost lose money.",
      whyEyebrow: ko ? "왜 공급처 셋업 전인가" : "Why before vendor setup",
      whyHeadline: ko ? "메뉴 없이 공급처·식자재 협상 불가능합니다." : "Can't negotiate suppliers without a menu.",
      whyDetail: ko
        ? "공급처는 '월 사용량 + 단가 + 결제 조건' 으로 계약합니다. 메뉴 미확정 = 사용량 추정 불가 = 단가 협상 불리. 락 후 공급처 미팅 = 협상 우위."
        : "Suppliers contract on volume × unit price × terms. No menu = no volume estimate = weak negotiation.",
      benchEyebrow: ko ? "한국 외식 표준 (KFRI 2024)" : "Korea F&B benchmarks (KFRI 2024)",
      bench: [
        { value: "5-8", label: ko ? "총 메뉴 수" : "Total items", detail: ko ? "소형 매장" : "small store" },
        { value: "30-35%", label: ko ? "식자재 원가율" : "Ingredient cost", detail: ko ? "황금률 상한" : "golden ceiling" },
        { value: "× 3", label: ko ? "단가 배수" : "Multiplier", detail: ko ? "원가 → 판매가" : "cost → price" },
      ],
      nextStageLabel: ko ? "공급처·식자재 셋업" : "Vendor setup",
    },
    cafe: {
      noun: ko ? "음료" : "Drink",
      categories: ko ? ["커피", "논커피", "디저트", "원두", "MD"] : ["Coffee", "Non-coffee", "Dessert", "Beans", "MD"],
      namePlaceholder: ko ? "음료 이름 (예: 아이스 아메리카노)" : "Drink name (e.g., Iced Americano)",
      costPlaceholder: ko ? "1잔 원가 (원)" : "Unit cost (₩)",
      notesPlaceholder: ko ? "주재료 (예: 원두 18g, 우유 200ml) — 선택" : "Main ingredients (optional)",
      ratioLabel: ko ? "음료 평균 원가율" : "Avg drink cost ratio",
      goldenMax: 33,
      heroTitle: ko ? "음료 라인업 + 원가 황금률" : "Drink lineup + cost golden ratio",
      heroSubtitle: ko
        ? "Prime Cost 황금률: 식자재 30-35% + 인건비 28-32% = 65% 이하. 원가율 33% 초과 음료는 영업이익 마이너스 — 한국외식산업연구원 2024."
        : "Prime Cost golden ratio: ingredients 30-35% + labor 28-32% ≤ 65%. Drinks over 33% lose money.",
      whyEyebrow: ko ? "왜 공급처 셋업 전인가" : "Why before vendor setup",
      whyHeadline: ko ? "음료 없이 원두·부자재 협상 불가능합니다." : "Can't negotiate beans/supplies without a drink lineup.",
      whyDetail: ko
        ? "공급처는 '월 사용량 + 단가 + 결제 조건' 으로 계약합니다. 음료 미확정 = 사용량 추정 불가 = 단가 협상 불리. 락 후 공급처 미팅 = 협상 우위."
        : "Suppliers contract on volume × unit price × terms. No lineup = weak negotiation.",
      benchEyebrow: ko ? "한국 외식 표준 (KFRI 2024)" : "Korea F&B benchmarks (KFRI 2024)",
      bench: [
        { value: "8-12", label: ko ? "음료 SKU" : "Drink SKUs", detail: ko ? "테이크아웃" : "takeout" },
        { value: "30-35%", label: ko ? "원가율" : "Cost ratio", detail: ko ? "황금률 상한" : "golden ceiling" },
        { value: "× 3", label: ko ? "단가 배수" : "Multiplier", detail: ko ? "원가 → 판매가" : "cost → price" },
      ],
      nextStageLabel: ko ? "공급처·부자재 셋업" : "Vendor setup",
    },
    service: {
      noun: ko ? "서비스" : "Service",
      categories: ko ? ["시그니처 시술", "사이드 시술", "패키지", "멤버십"] : ["Signature", "Add-on", "Package", "Membership"],
      namePlaceholder: ko ? "서비스명 (예: 시그니처 페디큐어)" : "Service name (e.g., Signature pedicure)",
      costPlaceholder: ko ? "재료·세션 원가 (원)" : "Material/session cost (₩)",
      notesPlaceholder: ko ? "소요시간·사용도구 (예: 소요 40분) — 선택" : "Duration / tools (optional)",
      ratioLabel: ko ? "평균 재료·세션 원가율" : "Avg material/session ratio",
      goldenMax: 25,
      heroTitle: ko ? "시그니처 시술 3-5개 + 패키지 락" : "3-5 signature treatments + packages",
      heroSubtitle: ko
        ? "서비스 객단가 = 시간 × 시급 × 2~3 (원가율 25% 목표). 패키지·멤버십이 재방문 LTV 의 80%."
        : "Service price = time × wage × 2-3 (cost ratio ≤25% target). Packages/memberships = 80% of repeat LTV.",
      whyEyebrow: ko ? "왜 가격 결정 전인가" : "Why before pricing",
      whyHeadline: ko ? "서비스 항목·가격 락 없이는 채용·예약 시스템 결정 불가." : "No staffing/booking decisions without locked service prices.",
      whyDetail: ko
        ? "서비스명·소요시간·가격 → 시급·재료비·예약 슬롯 모두 계산 가능. 시그니처 시술 락 = 가격 신뢰도 + 단골 LTV 기반."
        : "Service name + duration + price → wage, material, booking slots all computable. Locked menu = pricing trust + repeat LTV.",
      benchEyebrow: ko ? "서비스업 표준 (소상공인진흥공단 2024)" : "Service benchmarks (KOSME 2024)",
      bench: [
        { value: "3-5", label: ko ? "시그니처" : "Signature", detail: ko ? "10평 매장" : "small store" },
        { value: "≤25%", label: ko ? "재료·세션 원가" : "Material cost", detail: ko ? "객단가 대비" : "of price" },
        { value: "× 2-3", label: ko ? "단가 배수" : "Multiplier", detail: ko ? "시급×시간×k" : "wage×time×k" },
      ],
      nextStageLabel: ko ? "예약·인력 셋업" : "Booking/staffing setup",
    },
    retail: {
      noun: ko ? "상품" : "Product",
      categories: ko ? ["시그니처 SKU", "번들", "한정", "체험"] : ["Signature SKU", "Bundle", "Limited", "Trial"],
      namePlaceholder: ko ? "상품명 (예: 아크릴 키링 12종)" : "Product name (e.g., Acrylic keyring set)",
      costPlaceholder: ko ? "매입가 (원)" : "Purchase cost (₩)",
      notesPlaceholder: ko ? "옵션·초기 재고 (예: 초기 재고 30) — 선택" : "Options / initial stock (optional)",
      ratioLabel: ko ? "평균 원가율 (매입/판매)" : "Avg cost ratio (cost/price)",
      goldenMax: 60,
      heroTitle: ko ? "시그니처 SKU 5-10개 + 번들로 카탈로그 락" : "5-10 signature SKUs + bundles",
      heroSubtitle: ko
        ? "매입가 대비 판매가 1.7배 (마진 40%+) 목표. 시그니처 SKU 5-10개로 시작, 번들로 객단가 올리기."
        : "Price = cost × 1.7 (margin 40%+). Start with 5-10 signature SKUs, raise basket size with bundles.",
      whyEyebrow: ko ? "왜 소싱 전인가" : "Why before sourcing",
      whyHeadline: ko ? "상품 카탈로그 락 없이는 매입·진열·재고 추정 불가." : "No sourcing/display/inventory estimates without a locked catalog.",
      whyDetail: ko
        ? "시그니처 SKU 5-10개 락 → 매입가 협상 + 진열 동선 + 재고 회전 모두 추정. 번들·한정으로 객단가 30%+ 상승."
        : "Locking 5-10 SKUs → purchase negotiation + display + turnover all estimable. Bundles raise basket 30%+.",
      benchEyebrow: ko ? "오프라인 리테일 표준 (중기청 2024)" : "Retail benchmarks (2024)",
      bench: [
        { value: "5-10", label: ko ? "시그니처 SKU" : "Signature SKU", detail: ko ? "10평 매장" : "small store" },
        { value: "≥40%", label: ko ? "마진율" : "Margin", detail: ko ? "매입가 ×1.7" : "cost ×1.7" },
        { value: "× 1.7+", label: ko ? "단가 배수" : "Multiplier", detail: ko ? "매입→판매" : "cost→price" },
      ],
      nextStageLabel: ko ? "매입처·진열 셋업" : "Sourcing setup",
    },
    online: {
      noun: ko ? "상품" : "Product",
      categories: ko ? ["메인", "번들", "체험", "리필"] : ["Main", "Bundle", "Trial", "Refill"],
      namePlaceholder: ko ? "상품명 (예: 시그니처 디톡스 키트)" : "Product name (e.g., Detox kit)",
      costPlaceholder: ko ? "매입·제조 원가 (원)" : "Cost (₩)",
      notesPlaceholder: ko ? "옵션·배송비 (예: 옵션 3종, 배송 3000) — 선택" : "Options / shipping (optional)",
      ratioLabel: ko ? "평균 원가율 (원가/판매)" : "Avg cost ratio (cost/price)",
      goldenMax: 50,
      heroTitle: ko ? "메인 3-5개 + 번들·체험으로 상품 락" : "3-5 mains + bundles/trials",
      heroSubtitle: ko
        ? "온라인은 마진 50%+ 목표 (배송·플랫폼 수수료 15-20% 흡수). 메인·번들·체험·리필 4축으로 LTV 설계."
        : "Online targets 50%+ margin (absorb 15-20% platform/shipping fees). Design LTV with main/bundle/trial/refill.",
      whyEyebrow: ko ? "왜 소싱 전인가" : "Why before sourcing",
      whyHeadline: ko ? "상품 락 없이는 사진·상세페이지·광고 카피 모두 작업 불가." : "No photos/detail pages/ad copy without locked products.",
      whyDetail: ko
        ? "상품 락 → 사진·상세페이지·SEO 키워드·광고 카피·CS 템플릿 일괄 작업. 메인·번들·체험·리필 4축으로 LTV 설계."
        : "Locked products → photos, detail pages, SEO, ad copy, CS templates all at once. 4-axis LTV design.",
      benchEyebrow: ko ? "온라인 커머스 표준 (네이버 쇼핑 2024)" : "E-commerce benchmarks (2024)",
      bench: [
        { value: "3-7", label: ko ? "메인 상품" : "Main products", detail: ko ? "스마트스토어" : "smart store" },
        { value: "≥50%", label: ko ? "마진율" : "Margin", detail: ko ? "수수료·배송 흡수" : "fees absorbed" },
        { value: "× 2-3", label: ko ? "단가 배수" : "Multiplier", detail: ko ? "수수료 포함" : "incl. fees" },
      ],
      nextStageLabel: ko ? "상세페이지·광고 셋업" : "Detail page / ads setup",
    },
    saas: {
      noun: ko ? "구독 티어" : "Tier",
      categories: ["Free", "Starter", "Pro", "Enterprise"],
      namePlaceholder: ko ? "티어명 (예: Pro)" : "Tier name (e.g., Pro)",
      costPlaceholder: ko ? "월 인프라 비용 (원)" : "Monthly infra cost (₩)",
      notesPlaceholder: ko ? "핵심 feature·한도 (예: AI 무제한 + 1000 calls) — 선택" : "Key features / limits (optional)",
      ratioLabel: ko ? "평균 인프라 비중 (인프라/매출)" : "Avg infra ratio (cost/price)",
      goldenMax: 30,
      heroTitle: ko ? "Free → Starter → Pro → Enterprise 4티어 락" : "Lock Free → Starter → Pro → Enterprise",
      heroSubtitle: ko
        ? "Free→Starter→Pro→Enterprise 4-티어 표준. CAC < 12개월 LTV / 월 인프라 매출의 30%↓ 유지."
        : "Free→Starter→Pro→Enterprise standard. CAC < 12-month LTV / keep infra ≤30% of revenue.",
      whyEyebrow: ko ? "왜 가격 결정·GTM 전인가" : "Why before pricing/GTM",
      whyHeadline: ko ? "티어·가격 락 없이는 결제·랜딩페이지·GTM 모두 시작 불가." : "No billing/landing/GTM without locked tiers.",
      whyDetail: ko
        ? "Free → Paid 전환 funnel 의 출발점. Free 한도·Starter 가격·Pro feature·Enterprise 영업가격 4단 락 = 결제 페이지·랜딩·CAC 모델 모두 작성 가능."
        : "Start of the Free→Paid funnel. Locking Free limits, Starter price, Pro features, Enterprise pricing enables billing, landing, and CAC modeling.",
      benchEyebrow: ko ? "SaaS 표준 (OpenView 2024)" : "SaaS benchmarks (OpenView 2024)",
      bench: [
        { value: "3-4", label: ko ? "가격 티어" : "Price tiers", detail: ko ? "Free→Ent" : "Free→Ent" },
        { value: "≤30%", label: ko ? "인프라 비중" : "Infra ratio", detail: ko ? "Gross 70%+" : "Gross 70%+" },
        { value: "< 12mo", label: ko ? "CAC 회수" : "CAC payback", detail: ko ? "LTV 표준" : "LTV standard" },
      ],
      nextStageLabel: ko ? "결제·랜딩·GTM" : "Billing/landing/GTM",
    },
  };
  return C[cl];
}

// ── 메인 dispatcher ────────────────────────────────────────────────────
export function MenuDesignStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const cluster = classifyCluster(d.industryCategoryId ?? undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      <LineupPanel cluster={cluster} ko={ko} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  LineupPanel — 전 cluster 공통 구조화 폼 (iOS MenuDesignStageView 패리티)
// ─────────────────────────────────────────────────────────────────────────
function LineupPanel({ cluster, ko }: { cluster: Cluster; ko: boolean }) {
  const d = useDashboardCtx();
  const pg = d.guideStepIndex;
  const totalPg = 4;
  const setGuideStepIndex = d.setGuideStepIndex;
  const decisions = d.decisions;
  const setDecisions = d.setDecisions;
  const inventory = d.inventory;
  const setInventory = d.setInventory;

  const copy = clusterCopy(cluster, ko);

  // decisions.inputs.menuItemsJson 에서 lineup 복원
  const inputs = (decisions[STAGE_ID]?.inputs as { menuItemsJson?: string } | undefined) ?? {};
  const items: LineupItem[] = parseLineup(inputs.menuItemsJson);

  const persistLineup = (next: LineupItem[]) => {
    setDecisions((prev) => ({
      ...prev,
      [STAGE_ID]: {
        ...(prev[STAGE_ID] ?? { stageId: STAGE_ID }),
        stageId: STAGE_ID,
        inputs: {
          ...(prev[STAGE_ID]?.inputs ?? {}),
          menuItemsJson: JSON.stringify(next),
        },
      },
    }));
    // 동시에 inventory 에도 product 로 반영 (재고 카드 자동 표시)
    syncMenuToInventory(next, inventory, setInventory);
  };

  const totalRevenue = items.reduce((s, i) => s + i.price, 0);
  const totalCost = items.reduce((s, i) => s + i.cost, 0);
  const avgRatioPct = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;
  const gm = copy.goldenMax;
  const overItems = items.filter((i) => i.price > 0 && (i.cost / i.price) * 100 > gm);

  const pgLabels = ko
    ? ["왜 중요한가", `1. ${copy.noun} 추가`, "2. 원가 점검", "3. 마무리"]
    : ["Why", "1. Add", "2. Cost check", "3. Wrap"];

  return (
    <>
      <StartupKeyActionHero
        eyebrow="KEY ACTION"
        title={copy.heroTitle}
        subtitle={copy.heroSubtitle}
        miniCards={copy.bench.map((b, i) => ({
          icon: i === 0 ? ChefHat : i === 1 ? Sparkles : AlertTriangle,
          label: b.label,
          detail: `${b.value} · ${b.detail}`,
        }))}
      />

      <StartupReferenceLabel>
        {ko ? `↓ ${copy.noun} 입력 시 재고 관리 카드에 자동 등록됩니다.` : "↓ Items here auto-populate the inventory card."}
      </StartupReferenceLabel>

      <StartupPageNav page={pg} totalPages={totalPg} labels={pgLabels} onChange={setGuideStepIndex} ko={ko} />

      {/* ── pg 0 WHY ── */}
      {pg === 0 && (
        <>
          <div style={cardStyle}>
            <div style={eyebrowStyle}>{copy.whyEyebrow}</div>
            <div style={bodyTitleStyle}>{copy.whyHeadline}</div>
            <div style={bodyTextStyle}>{copy.whyDetail}</div>
          </div>

          <div style={cardStyle}>
            <div style={eyebrowStyle}>{copy.benchEyebrow}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "10px" }}>
              {copy.bench.map((s) => (
                <div key={s.label} style={{ padding: "12px 10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", textAlign: "center" as const }}>
                  <div style={{ fontSize: "18px", fontWeight: 780, color: MIDNIGHT }}>{s.value}</div>
                  <div style={{ fontSize: "11.5px", fontWeight: 640, color: "#0f172a", marginTop: "2px" }}>{s.label}</div>
                  <div style={{ fontSize: "10px", color: "var(--muted)" }}>{s.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── pg 1 ADD ── */}
      {pg === 1 && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <ChefHat size={16} strokeWidth={2.2} color={MIDNIGHT} />
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
              {ko ? `${copy.noun} 항목 추가` : "Add items"}
            </span>
          </div>

          <LineupItemForm
            ko={ko}
            copy={copy}
            onAdd={(item) => persistLineup([...items, { ...item, id: Date.now().toString() }])}
          />

          {items.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                {ko ? `등록된 ${copy.noun} ${items.length}개` : `${items.length} item${items.length === 1 ? "" : "s"}`}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {items.map((it) => {
                  const ratio = it.price > 0 ? (it.cost / it.price) * 100 : 0;
                  const ratioWarn = ratio > gm;
                  return (
                    <div key={it.id} style={{ padding: "10px 12px", borderRadius: "10px", border: `1px solid ${ratioWarn ? "rgba(182,76,76,0.20)" : MIDNIGHT_BORDER}`, background: ratioWarn ? "rgba(182,76,76,0.03)" : "rgba(25,25,112,0.02)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{it.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                            {it.category && <>{it.category} · </>}
                            ₩{it.price.toLocaleString()} {ko ? "판매" : "sell"} · ₩{it.cost.toLocaleString()} {ko ? "원가" : "cost"} · {ratio.toFixed(0)}%
                            {ratioWarn && <span style={{ color: "#b64c4c", fontWeight: 700 }}> ⚠ {ko ? "원가율 높음" : "high cost"}</span>}
                          </div>
                          {it.notes && (
                            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{it.notes}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => persistLineup(items.filter((x) => x.id !== it.id))}
                          style={{ padding: "6px", background: "transparent", border: "none", color: "rgba(182,76,76,0.7)", cursor: "pointer" }}
                          aria-label="delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── pg 2 COST CHECK ── */}
      {pg === 2 && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Sparkles size={16} strokeWidth={2.2} color={MIDNIGHT} />
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
              {ko ? "원가율 점검" : "Cost ratio check"}
            </span>
          </div>

          {items.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center" as const, color: "var(--muted)", fontSize: "13px" }}>
              {ko ? `${copy.noun}를 먼저 등록하세요 (1. ${copy.noun} 추가 페이지)` : "Add items first (1. Add page)"}
            </div>
          ) : (
            <>
              <div style={{
                padding: "14px 16px",
                borderRadius: "12px",
                background: avgRatioPct > gm ? "rgba(182,76,76,0.06)" : "rgba(25,25,112,0.06)",
                border: `1.5px solid ${avgRatioPct > gm ? "rgba(182,76,76,0.20)" : "rgba(25,25,112,0.20)"}`,
                marginBottom: "12px",
              }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>
                  {copy.ratioLabel}
                </div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
                  {avgRatioPct.toFixed(1)}%
                </div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5, marginTop: "4px" }}>
                  {avgRatioPct > gm
                    ? (ko ? `⚠ 목표 ${gm}% 초과. 단가 인상 또는 원가 절감으로 마진을 확보하세요.` : `Above ${gm}% target. Raise price or cut cost to protect margin.`)
                    : (ko ? `✓ 목표 ${gm}% 이하. 마진 안정 범위입니다.` : `≤${gm}% target. Margin is in a healthy range.`)}
                </div>
              </div>

              {overItems.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#b64c4c", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                    {ko ? `원가율 ${gm}% 초과 ${copy.noun}` : `Items above ${gm}%`}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {overItems.map((it) => (
                      <div key={it.id} style={{ padding: "9px 12px", borderRadius: "10px", background: "rgba(182,76,76,0.04)", border: "1px solid rgba(182,76,76,0.16)" }}>
                        <div style={{ fontSize: "12.5px", fontWeight: 640, color: "#7f1d1d" }}>
                          {it.name} — {((it.cost / it.price) * 100).toFixed(0)}%
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(127,29,29,0.7)", marginTop: "2px" }}>
                          {ko
                            ? `판매가 ₩${(Math.ceil((it.cost / (gm / 100)) / 100) * 100).toLocaleString()} 로 인상 또는 원가 ₩${Math.floor(it.price * (gm / 100)).toLocaleString()} 로 절감 필요`
                            : `Raise to ₩${(Math.ceil((it.cost / (gm / 100)) / 100) * 100).toLocaleString()} or cut cost to ₩${Math.floor(it.price * (gm / 100)).toLocaleString()}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── pg 3 WRAPUP ── */}
      {pg === 3 && (
        <StageWrapup
          ko={ko}
          nextStageLabelKo={copy.nextStageLabel}
          doneItemsKo={[
            { label: `1. ${copy.noun} 라인업 확정`, detail: ko ? `${items.length}개 입력 완료 (시그니처 3-5개 권장)` : `${items.length} items entered` },
            { label: "2. 원가율 점검", detail: ko ? `평균 ${avgRatioPct.toFixed(1)}% (목표 ${gm}% 이하)` : `Avg ${avgRatioPct.toFixed(1)}% (≤${gm}% target)` },
            { label: "3. 재고 카드 자동 연동", detail: ko ? `${copy.noun} → 재고 product 로 자동 등록 완료` : "Auto-registered as inventory products" },
          ]}
          verifyItemsKo={[
            `${copy.noun} 3개 이상 등록했는가 (시그니처 3-5개 표준)`,
            `각 항목 원가율 ${gm}% 이하인가 (초과 시 마진 압박)`,
            `각 항목 ${ko ? "메모(주재료·옵션·feature)" : "notes"} 명시 — 다음 단계 비교 근거가 되는가`,
            "객단가가 타깃 페르소나 가격 민감도와 일치하는가 (target-customer-definition 참조)",
          ]}
          nextSummaryKo={ko ? `${copy.noun} 락 + 재고 등록 → ${copy.nextStageLabel}` : "Lineup locked + inventory seeded"}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  LineupItemForm — 전 cluster 공통 입력 폼 (cluster-aware 라벨/카테고리)
// ─────────────────────────────────────────────────────────────────────────
function LineupItemForm({ ko, copy, onAdd }: { ko: boolean; copy: ClusterCopy; onAdd: (item: Omit<LineupItem, "id">) => void }) {
  const d = useDashboardCtx();
  const sel = d.guideSelections;
  const setSel = d.setGuideSelections;

  const k = (suffix: string) => `menu-form-${suffix}`;
  const name = sel[k("name")] ?? "";
  const category = sel[k("category")] ?? "";
  const priceText = sel[k("price")] ?? "";
  const costText = sel[k("cost")] ?? "";
  const notes = sel[k("notes")] ?? "";

  const canAdd = name.trim() && priceText && costText;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <input
        type="text"
        placeholder={copy.namePlaceholder}
        value={name}
        onChange={(e) => setSel((prev: Record<string, string>) => ({ ...prev, [k("name")]: e.target.value }))}
        style={inputStyle}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder={ko ? "판매가 (원)" : "Price (₩)"}
          value={priceText}
          onChange={(e) => setSel((prev: Record<string, string>) => ({ ...prev, [k("price")]: e.target.value.replace(/[^0-9]/g, "") }))}
          style={inputStyle}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder={copy.costPlaceholder}
          value={costText}
          onChange={(e) => setSel((prev: Record<string, string>) => ({ ...prev, [k("cost")]: e.target.value.replace(/[^0-9]/g, "") }))}
          style={inputStyle}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {copy.categories.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setSel((prev: Record<string, string>) => ({ ...prev, [k("category")]: opt }))}
            style={{
              padding: "5px 11px",
              borderRadius: "8px",
              border: category === opt ? `1.5px solid ${MIDNIGHT}` : "1px solid rgba(25,25,112,0.10)",
              background: category === opt ? `${MIDNIGHT}08` : "white",
              color: category === opt ? MIDNIGHT : "rgba(15,23,42,0.6)",
              fontSize: "11.5px",
              fontWeight: category === opt ? 700 : 500,
              cursor: "pointer",
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder={copy.notesPlaceholder}
        value={notes}
        onChange={(e) => setSel((prev: Record<string, string>) => ({ ...prev, [k("notes")]: e.target.value }))}
        style={{ ...inputStyle, background: "rgba(15,23,42,0.02)" }}
      />

      <button
        type="button"
        disabled={!canAdd}
        onClick={() => {
          if (!canAdd) return;
          onAdd({
            name: name.trim(),
            category,
            price: Number(priceText) || 0,
            cost: Number(costText) || 0,
            notes: notes.trim(),
          });
          setSel((prev: Record<string, string>) => ({
            ...prev,
            [k("name")]: "",
            [k("category")]: "",
            [k("price")]: "",
            [k("cost")]: "",
            [k("notes")]: "",
          }));
        }}
        style={{
          padding: "10px",
          borderRadius: "10px",
          border: "none",
          background: canAdd ? MIDNIGHT : "rgba(25,25,112,0.1)",
          color: canAdd ? "white" : "rgba(25,25,112,0.3)",
          fontSize: "13px",
          fontWeight: 700,
          cursor: canAdd ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
      >
        <Plus size={14} strokeWidth={2.4} />
        {ko ? `${copy.noun} 추가 + 재고 자동 등록` : "Add + inventory"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────
function parseLineup(json: string | undefined): LineupItem[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is LineupItem =>
      typeof x?.id === "string" && typeof x?.name === "string" && typeof x?.price === "number"
    );
  } catch {
    return [];
  }
}

/**
 * 메뉴 라인업 → inventory (재고 카드) 자동 동기화.
 *   · 사장님 신고: "미리 메뉴를 결정하면 재고 관리 카드에 들어가게 해서 수고를 덜 수 있어."
 *   · 메뉴 = inventory item (itemType="product", sellingPrice + unitCost 채움).
 *   · 같은 이름의 메뉴는 1:1 매칭 (재추가 시 가격·원가만 업데이트, quantity 보존).
 */
function syncMenuToInventory(
  menuItems: LineupItem[],
  currentInventory: InventoryItem[],
  setInventory: (items: InventoryItem[]) => void,
) {
  const byName = new Map(currentInventory.map((i) => [i.name.toLowerCase().trim(), i]));
  const stamp = Date.now();

  // 1. 메뉴 → product type 아이템으로 변환 (기존이 있으면 가격·원가만 갱신)
  const synced: InventoryItem[] = menuItems.map((m, idx) => {
    const existing = byName.get(m.name.toLowerCase().trim());
    if (existing && existing.itemType === "product") {
      return {
        ...existing,
        sellingPrice: m.price,
        unitCost: m.cost,
        category: mapCategoryToInventory(m.category),
      };
    }
    return {
      id: `menu-${stamp}-${idx}`,
      name: m.name,
      quantity: 0,
      unit: "개",
      minThreshold: 5,
      unitCost: m.cost,
      category: mapCategoryToInventory(m.category),
      itemType: "product" as const,
      sellingPrice: m.price,
      expiryDate: "",
      supplierName: "",
      supplierUrl: "",
      leadTimeDays: 1,
      dailyUsage: 0,
      lastOrderedAt: "",
      wasteLog: [],
    };
  });

  // 2. 기존 inventory 중 product 가 아닌 (material) 아이템은 보존
  const preservedMaterials = currentInventory.filter((i) => i.itemType !== "product");

  // 3. 기존 product 중 menu-design 으로 만들지 않은 것도 보존
  //    (예: 사장님이 직접 추가한 product). name 매칭으로 판단.
  const syncedNames = new Set(menuItems.map((m) => m.name.toLowerCase().trim()));
  const preservedProducts = currentInventory.filter(
    (i) => i.itemType === "product" && !syncedNames.has(i.name.toLowerCase().trim()),
  );

  setInventory([...preservedMaterials, ...preservedProducts, ...synced]);
}

function mapCategoryToInventory(cat: string): InventoryItem["category"] {
  const c = cat.toLowerCase();
  if (c.includes("음료") || c.includes("커피") || c.includes("라떼") || c.includes("drink") || c.includes("beverage") || c.includes("coffee")) return "beverage";
  if (c.includes("디저트") || c.includes("dessert")) return "dry";
  if (c.includes("사이드") || c.includes("side") || c.includes("세트") || c.includes("set")) return "fresh";
  return "fresh";
}

// ── 스타일 토큰 ─────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  borderRadius: "20px",
  border: `1px solid ${MIDNIGHT_BORDER}`,
  background: "white",
  padding: "20px 22px",
  boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: MIDNIGHT,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  marginBottom: "8px",
};

const bodyTitleStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 680,
  color: "#0f172a",
  lineHeight: 1.5,
  marginBottom: "8px",
};

const bodyTextStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "var(--muted)",
  lineHeight: 1.65,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(25,25,112,0.12)",
  background: "rgba(255,255,255,0.95)",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};
