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

type LineupExample = {
  name: { ko: string; en: string };
  notes: { ko: string; en: string };
  categories?: { ko: string[]; en: string[] };
  costLabel?: { ko: string; en: string };
};

const LINEUP_EXAMPLES_BY_ID: Record<string, LineupExample> = {
  // Food
  "korean-casual": ex("제육 백반 정식", "Jeyuk baekban set", "제육 120g, 국, 반찬 4종", "pork 120g, soup, 4 banchan", ["백반", "찌개", "덮밥", "고기", "사이드"], ["Baekban", "Stew", "Rice bowl", "Grill", "Side"]),
  "korean-gukbap": ex("돼지국밥 보통", "Pork gukbap regular", "육수 350ml, 수육 90g, 다대기", "broth 350ml, pork 90g, sauce"),
  "korean-hanjeongsik": ex("점심 한상 코스", "Lunch hanjeongsik course", "전채, 메인, 반찬 8종, 후식", "starter, main, 8 banchan, dessert", ["점심 코스", "저녁 코스", "단품", "주류", "추가"], ["Lunch course", "Dinner course", "A la carte", "Drinks", "Add-on"]),
  "korean-baekban": ex("오늘의 집밥 백반", "Daily home-style baekban", "메인 1종, 국, 반찬 5종", "one main, soup, 5 banchan"),
  "korean-bunsik": ex("떡볶이 + 김밥 세트", "Tteokbokki + gimbap set", "떡 180g, 어묵, 김밥 1줄", "rice cake 180g, fish cake, gimbap roll", ["분식", "김밥", "면", "튀김", "세트"], ["Snack", "Gimbap", "Noodle", "Fried", "Set"]),
  "korean-bibimbap": ex("소고기 비빔밥", "Beef bibimbap", "밥 200g, 나물 5종, 소고기 60g", "rice 200g, 5 vegetables, beef 60g"),
  "korean-pork-belly": ex("숙성 삼겹살 150g", "Aged pork belly 150g", "삼겹살 150g, 쌈채소, 소스", "pork belly 150g, greens, sauce", ["구이", "식사", "추가", "주류", "세트"], ["Grill", "Meal", "Add-on", "Drinks", "Set"]),
  "delivery-meals": ex("직장인 한식 도시락", "Office Korean lunch box", "밥, 메인 1종, 반찬 4종, 포장재", "rice, one main, 4 sides, packaging"),
  "delivery-diet-meal": ex("닭가슴살 밸런스 도시락", "Chicken breast balance box", "닭가슴살 120g, 현미, 채소", "chicken 120g, brown rice, greens"),
  "delivery-bulk-catering": ex("회의 도시락 30인 세트", "30-person meeting lunch set", "개별 포장, 생수, 수저 포함", "individual pack, water, cutlery"),
  "salad-healthy": ex("훈제연어 포케볼", "Smoked salmon poke bowl", "연어 80g, 현미, 채소, 소스", "salmon 80g, brown rice, greens, sauce"),
  "salad-bowl": ex("닭가슴살 시그니처 샐러드", "Signature chicken salad", "닭가슴살 100g, 채소 150g, 드레싱", "chicken 100g, greens 150g, dressing"),
  "salad-poke-grain": ex("참치 아보카도 포케", "Tuna avocado poke", "참치 90g, 아보카도, 현미", "tuna 90g, avocado, brown rice"),
  "salad-vegan": ex("비건 템페 그레인볼", "Vegan tempeh grain bowl", "템페, 병아리콩, 구운 채소", "tempeh, chickpeas, roasted vegetables"),
  "salad-juice-cleanse": ex("1일 클렌즈 주스 3종", "One-day cleanse 3-pack", "그린, 비트, 시트러스 보틀", "green, beet, citrus bottles"),
  "ramen-noodle": ex("돈코츠 라멘", "Tonkotsu ramen", "육수 400ml, 생면, 차슈 2장", "broth 400ml, fresh noodle, 2 chashu"),
  "noodle-kalguksu": ex("바지락 칼국수", "Clam kalguksu", "생면 180g, 바지락, 육수", "noodle 180g, clams, broth"),
  "noodle-pho": ex("양지 쌀국수", "Brisket pho", "쌀국수 180g, 양지 70g, 허브", "rice noodle 180g, brisket 70g, herbs"),
  "noodle-jjajang": ex("짜장면 + 탕수육 세트", "Jjajangmyeon + tangsuyuk set", "면, 춘장 소스, 탕수육 120g", "noodle, black bean sauce, pork 120g"),
  "chicken-burger": ex("시그니처 치킨버거", "Signature chicken burger", "치킨 패티, 번, 소스, 포장재", "chicken patty, bun, sauce, packaging"),
  "fb-chicken": ex("반반 치킨 한 마리", "Half-and-half fried chicken", "닭 1마리, 튀김가루, 소스 2종", "whole chicken, batter, 2 sauces"),
  "fb-pizza": ex("페퍼로니 라지 피자", "Large pepperoni pizza", "도우, 치즈 180g, 페퍼로니", "dough, cheese 180g, pepperoni"),
  "fb-burger": ex("더블 치즈버거", "Double cheeseburger", "패티 2장, 치즈, 번, 소스", "2 patties, cheese, bun, sauce"),
  "western-pasta-brunch": ex("쉬림프 로제 파스타", "Shrimp rose pasta", "생면, 새우 6미, 로제 소스", "fresh pasta, 6 shrimp, rose sauce"),
  "fb-brunch": ex("아보카도 에그 브런치", "Avocado egg brunch", "사워도우, 아보카도, 계란 2개", "sourdough, avocado, 2 eggs", ["브런치", "샐러드", "커피", "디저트", "세트"], ["Brunch", "Salad", "Coffee", "Dessert", "Set"]),

  // Cafe & dessert
  "takeout-coffee": ex("아이스 아메리카노", "Iced Americano", "원두 18g, 얼음, 컵·뚜껑", "beans 18g, ice, cup/lid"),
  "coffee-low-price": ex("대용량 아이스 아메리카노", "Large iced Americano", "원두 18g, 24oz 컵, 얼음", "beans 18g, 24oz cup, ice"),
  "coffee-roastery": ex("싱글오리진 핸드드립", "Single-origin hand drip", "원두 20g, 필터, 추출 3분", "beans 20g, filter, 3-min brew"),
  "coffee-coldbrew": ex("콜드브루 보틀 500ml", "Cold brew bottle 500ml", "콜드브루 원액, 보틀, 라벨", "cold brew concentrate, bottle, label"),
  "coffee-omakase": ex("커피 테이스팅 코스", "Coffee tasting course", "싱글오리진 3종, 디저트 페어링", "3 single origins, dessert pairing", ["코스", "필터", "에스프레소", "원두", "디저트"], ["Course", "Filter", "Espresso", "Beans", "Dessert"]),
  "dessert-cafe": ex("딸기 생크림 조각케이크", "Strawberry cream cake slice", "시트, 생크림, 딸기, 박스", "sponge, cream, strawberries, box"),
  "dessert-macaron": ex("솔티카라멜 마카롱", "Salted caramel macaron", "꼬끄 2장, 필링, 개별 포장", "2 shells, filling, wrap"),
  "dessert-traditional": ex("흑임자 약과 세트", "Black sesame yakgwa set", "약과, 흑임자 크림, 패키지", "yakgwa, sesame cream, package"),
  "bakery-studio": ex("소금빵", "Salt bread roll", "강력분, 버터 18g, 소금", "bread flour, butter 18g, salt"),
  "bakery-pastry": ex("버터 크루아상", "Butter croissant", "프랑스 버터, 반죽, 포장지", "French butter, dough, wrapper"),
  "icecream-bingsu": ex("인절미 빙수", "Injeolmi bingsu", "우유얼음, 인절미, 팥, 콩가루", "milk ice, rice cake, red bean, soybean powder"),
  "ice-icecream": ex("피스타치오 젤라또", "Pistachio gelato", "젤라또 베이스, 피스타치오 페이스트", "gelato base, pistachio paste"),
  "self-serve-cafe": ex("무인 아메리카노", "Self-serve Americano", "머신 원두, 컵, 키오스크 메뉴", "machine beans, cup, kiosk item"),
  "cafe-book-cafe": ex("책방 라떼 세트", "Book cafe latte set", "라떼, 쿠키, 좌석 2시간", "latte, cookie, 2-hour seat"),

  // Services
  "hair-salon": ex("여성 컷 + 드라이", "Women's cut + blow dry", "소요 45분, 샴푸·드라이 포함", "45 min, shampoo/blow dry included", ["컷", "펌", "염색", "클리닉", "패키지"], ["Cut", "Perm", "Color", "Treatment", "Package"], "시술 재료·소요 원가 (원)", "Material/time cost (₩)"),
  "hair-color-perm": ex("뿌리염색 + 클리닉", "Root color + treatment", "소요 90분, 염모제·클리닉제", "90 min, dye and treatment"),
  "nail-studio": ex("시그니처 젤 네일", "Signature gel nail", "소요 70분, 젤 컬러 2종", "70 min, 2 gel colors", ["젤", "아트", "페디", "연장", "케어"], ["Gel", "Art", "Pedi", "Extension", "Care"]),
  "nail-pedicure": ex("발각질 케어 + 젤 페디", "Callus care + gel pedi", "소요 80분, 풋파일·젤", "80 min, foot file and gel"),
  "skin-care-room": ex("수분 진정 관리 60분", "Hydration calming facial 60m", "앰플, 모델링팩, 관리 60분", "ampoule, mask, 60 min"),
  "skin-acne-clinic": ex("트러블 압출 + 진정관리", "Acne extraction + calming care", "소요 70분, 소독·진정 앰플", "70 min, sanitizing and calming ampoule"),
  "waxing-studio": ex("브라질리언 왁싱", "Brazilian waxing", "소요 40분, 왁스·진정젤", "40 min, wax and soothing gel"),
  "eyelash-brow": ex("속눈썹 펌", "Lash lift", "소요 50분, 펌제·케라틴", "50 min, perm solution and keratin"),
  "makeup-bridal": ex("본식 신부 메이크업", "Wedding day bridal makeup", "소요 120분, 속눈썹·수정 포함", "120 min, lashes and touch-up included"),
  "pilates-studio": ex("1:1 리포머 필라테스", "1:1 reformer pilates", "50분, 리포머·체어 사용", "50 min, reformer/chair", ["1:1", "그룹", "패키지", "체험", "멤버십"], ["1:1", "Group", "Package", "Trial", "Membership"], "회당 세션 원가 (원)", "Session cost (₩)"),
  "pt-gym": ex("1:1 PT 10회권", "10-pack 1:1 PT", "회당 50분, 체성분 측정 포함", "50 min/session, body scan included"),
  "yoga-studio": ex("빈야사 그룹 클래스", "Vinyasa group class", "60분, 매트·블록 사용", "60 min, mat and blocks"),
  "crossfit-box": ex("그룹 WOD 월 멤버십", "Monthly group WOD membership", "주 3회, 코칭·기록 포함", "3x/week, coaching and tracking"),
  "language-academy": ex("성인 영어회화 8회반", "8-session adult English class", "주 2회, 교재·레벨테스트 포함", "2x/week, materials and level test", ["그룹", "1:1", "시험대비", "패키지", "온라인"], ["Group", "1:1", "Test prep", "Package", "Online"], "회차별 강사·교재 원가 (원)", "Teacher/material cost (₩)"),
  "coding-class": ex("파이썬 기초 4주반", "4-week Python basics", "주 2회, 실습 과제·코드리뷰", "2x/week, assignments and code review"),
  "small-study-room": ex("중등 수학 1:1 월반", "Monthly 1:1 middle-school math", "주 2회, 교재·진도관리 포함", "2x/week, materials and progress tracking"),
  "study-room": ex("4인 회의실 2시간권", "2-hour 4-person room", "화이트보드, 모니터, 냉난방 포함", "whiteboard, monitor, HVAC included"),
  "study-cafe-space": ex("4주 자유석 이용권", "4-week open seat pass", "QR 출입, 음료존, 사물함 옵션", "QR entry, drink bar, locker option"),
  "pet-grooming": ex("소형견 전체 미용", "Small dog full grooming", "소요 90분, 샴푸·위생컷 포함", "90 min, shampoo and sanitary trim", ["미용", "스파", "위생", "패키지", "용품"], ["Grooming", "Spa", "Sanitary", "Package", "Goods"], "재료·세션 원가 (원)", "Material/session cost (₩)"),
  "pet-hotel": ex("소형견 1박 호텔", "Small dog overnight stay", "1박, 산책 2회, 사진 리포트", "overnight, 2 walks, photo report"),
  "pet-training": ex("퍼피 사회화 4회권", "4-pack puppy socialization", "회당 60분, 보호자 코칭 포함", "60 min/session, owner coaching included"),
  "pet-walking-care": ex("30분 산책 케어", "30-minute walking care", "산책, 급수, 사진 리포트", "walk, water, photo report"),

  // Retail / online / spaces / startup
  "convenience-small": ex("삼각김밥 + 컵라면 번들", "Gimbap + cup noodle bundle", "초도 30개, 폐기 리스크 관리", "initial 30 units, waste-risk managed", ["즉석", "음료", "생활", "프로모션", "시즌"], ["Ready-to-eat", "Drinks", "Daily goods", "Promo", "Seasonal"]),
  "lifestyle-goods": ex("세라믹 머그 3종", "Ceramic mug 3-type set", "초도 24개, 색상 3종", "initial 24 units, 3 colors"),
  "beauty-retail": ex("비건 립밤 3종", "Vegan lip balm 3-type set", "초도 50개, 컬러 3종", "initial 50 units, 3 colors"),
  "fashion-accessory": ex("실버 미니 이어링", "Silver mini earrings", "초도 30개, 무니켈 옵션", "initial 30 units, nickel-free option"),
  "health-food": ex("프로틴 쉐이크 1박스", "Protein shake box", "12입, 맛 2종, 유통기한 확인", "12-pack, 2 flavors, expiry checked"),
  "unmanned-retail": ex("무인 밀키트 베스트 3종", "Top 3 unmanned meal kits", "초도 각 20개, 냉동 재고", "20 each, frozen stock"),
  "ec-smart-store": ex("시그니처 홈웨어 세트", "Signature homewear set", "옵션 3종, 택배비 3,000원", "3 options, shipping ₩3,000", ["메인", "옵션", "번들", "리필", "기획전"], ["Main", "Option", "Bundle", "Refill", "Promo"]),
  "digital-product": ex("노션 템플릿 프로팩", "Notion template pro pack", "다운로드 파일, 업데이트 1년", "download files, 1-year updates"),
  "creator-commerce": ex("위탁 패션 베스트 SKU", "Dropship fashion bestseller", "공급가, 옵션, 배송 리드타임", "supplier cost, options, lead time"),
  "newsletter-media": ex("프리미엄 뉴스레터 월 구독", "Premium newsletter monthly", "주 2회 발송, 아카이브 포함", "2x/week, archive included"),
  "global-buying": ex("일본 직구 뷰티 세트", "Japan buying-agent beauty set", "관부가세·배송 리드타임 체크", "tax and shipping lead time checked"),
  "space-photo-studio": ex("2시간 자연광 스튜디오", "2-hour natural light studio", "배경지 3종, 조명 2개 포함", "3 backdrops, 2 lights included", ["시간권", "패키지", "장비", "정기", "옵션"], ["Hourly", "Package", "Equipment", "Recurring", "Option"]),
  "space-party-room": ex("주말 4시간 파티룸", "Weekend 4-hour party room", "최대 8인, 청소비 별도", "up to 8 people, cleaning fee separate"),
  "space-coworking": ex("1인 지정석 월 멤버십", "Monthly dedicated desk", "우편함, 회의실 2시간 포함", "mailbox, 2h meeting room included"),
  "su-ai-chatbot": ex("Pro 상담 자동화 플랜", "Pro support automation plan", "월 5,000건, 상담 요약·FAQ 학습", "5k chats/month, summaries, FAQ training", ["Free", "Starter", "Pro", "Enterprise"], ["Free", "Starter", "Pro", "Enterprise"], "월 인프라·API 비용 (원)", "Monthly infra/API cost (₩)"),
  "su-fintech-payment": ex("Starter 결제 API 플랜", "Starter payment API plan", "월 1만 건, 정산 리포트 포함", "10k tx/month, payout report included"),
  "su-health-app": ex("Pro 운동 코칭 구독", "Pro fitness coaching subscription", "AI 루틴, 리포트, 웨어러블 연동", "AI routines, reports, wearable sync"),
  "su-dev-devops": ex("Team CI/CD 플랜", "Team CI/CD plan", "빌드 5,000분, 배포 슬롯 10개", "5k build minutes, 10 deploy slots"),
  "su-saas-crm": ex("Sales Pro 좌석 플랜", "Sales Pro seat plan", "좌석 10개, 파이프라인 자동화", "10 seats, pipeline automation"),
};

const LINEUP_EXAMPLE_PREFIXES: Array<[string, LineupExample]> = [
  ["delivery-", LINEUP_EXAMPLES_BY_ID["delivery-meals"]],
  ["salad-", LINEUP_EXAMPLES_BY_ID["salad-healthy"]],
  ["ramen-", LINEUP_EXAMPLES_BY_ID["ramen-noodle"]],
  ["noodle-", LINEUP_EXAMPLES_BY_ID["ramen-noodle"]],
  ["fb-", LINEUP_EXAMPLES_BY_ID["chicken-burger"]],
  ["coffee-", LINEUP_EXAMPLES_BY_ID["specialty-coffee"]],
  ["dessert-", LINEUP_EXAMPLES_BY_ID["dessert-cafe"]],
  ["bakery-", LINEUP_EXAMPLES_BY_ID["bakery-studio"]],
  ["ice-", LINEUP_EXAMPLES_BY_ID["icecream-bingsu"]],
  ["cafe-", LINEUP_EXAMPLES_BY_ID["self-serve-cafe"]],
  ["hair-", LINEUP_EXAMPLES_BY_ID["hair-salon"]],
  ["nail-", LINEUP_EXAMPLES_BY_ID["nail-studio"]],
  ["skin-", LINEUP_EXAMPLES_BY_ID["skin-care-room"]],
  ["waxing-", LINEUP_EXAMPLES_BY_ID["waxing-studio"]],
  ["lash-", LINEUP_EXAMPLES_BY_ID["eyelash-brow"]],
  ["brow-", LINEUP_EXAMPLES_BY_ID["eyelash-brow"]],
  ["makeup-", LINEUP_EXAMPLES_BY_ID["makeup-bridal"]],
  ["pilates-", LINEUP_EXAMPLES_BY_ID["pilates-studio"]],
  ["pt-", LINEUP_EXAMPLES_BY_ID["pt-gym"]],
  ["yoga-", LINEUP_EXAMPLES_BY_ID["yoga-studio"]],
  ["crossfit-", LINEUP_EXAMPLES_BY_ID["crossfit-box"]],
  ["fitness-", LINEUP_EXAMPLES_BY_ID["crossfit-box"]],
  ["edu-coding-", LINEUP_EXAMPLES_BY_ID["coding-class"]],
  ["edu-study-", LINEUP_EXAMPLES_BY_ID["study-cafe-space"]],
  ["edu-", LINEUP_EXAMPLES_BY_ID["language-academy"]],
  ["ka-", ex("초등 피아노 주 2회반", "Kids piano twice-weekly", "주 2회, 교재·발표회 준비", "2x/week, materials and recital prep", ["정규", "1:1", "그룹", "체험", "특강"], ["Regular", "1:1", "Group", "Trial", "Workshop"])],
  ["ac-", ex("원데이 도예 클래스", "One-day pottery class", "재료·소성비 포함, 2시간", "materials and firing included, 2h")],
  ["pet-grooming-", LINEUP_EXAMPLES_BY_ID["pet-grooming"]],
  ["pet-training-", LINEUP_EXAMPLES_BY_ID["pet-training"]],
  ["pet-", LINEUP_EXAMPLES_BY_ID["pet-hotel"]],
  ["retail-unmanned-", LINEUP_EXAMPLES_BY_ID["unmanned-retail"]],
  ["retail-cosmetics", LINEUP_EXAMPLES_BY_ID["beauty-retail"]],
  ["retail-fashion", LINEUP_EXAMPLES_BY_ID["fashion-accessory"]],
  ["retail-", LINEUP_EXAMPLES_BY_ID["lifestyle-goods"]],
  ["ls-self-laundry", ex("운동화 세탁 기본", "Sneaker wash basic", "세제, 건조, 포장 포함", "detergent, drying, packaging", ["기본", "프리미엄", "수거", "정기", "옵션"], ["Basic", "Premium", "Pickup", "Recurring", "Option"])],
  ["ls-laundry", ex("셔츠 세탁 5장 묶음", "5-shirt laundry bundle", "수거·다림질·포장 포함", "pickup, ironing, packaging")],
  ["ls-home-cleaning", ex("입주 청소 20평형", "Move-in cleaning 20-pyeong", "2인 4시간, 장비·세제 포함", "2 staff 4h, equipment/supplies included")],
  ["ls-", ex("기본 방문 서비스", "Basic visit service", "소요 60분, 출장비 별도", "60 min, travel fee separate")],
  ["space-", LINEUP_EXAMPLES_BY_ID["space-photo-studio"]],
  ["ec-", LINEUP_EXAMPLES_BY_ID["ec-smart-store"]],
  ["dp-", LINEUP_EXAMPLES_BY_ID["digital-product"]],
  ["cc-", LINEUP_EXAMPLES_BY_ID["creator-commerce"]],
  ["nm-", LINEUP_EXAMPLES_BY_ID["newsletter-media"]],
  ["gb-", LINEUP_EXAMPLES_BY_ID["global-buying"]],
  ["pc-", ex("강아지 동반 2시간권", "2-hour dog cafe pass", "입장, 음료 1잔, 위생패드", "entry, one drink, pad", ["입장권", "음료", "간식", "패키지", "용품"], ["Entry", "Drink", "Treat", "Package", "Goods"])],
  ["ps-", ex("수제 닭가슴살 간식", "Handmade chicken treat", "초도 30팩, 원재료·유통기한", "initial 30 packs, ingredients/expiry")],
  ["gh-", ex("2인 도미토리 1박", "One-night 2-bed dorm", "침구, 조식 옵션, 청소비", "bedding, breakfast option, cleaning")],
  ["gs-", ex("스크린 골프 60분권", "60-minute screen golf", "룸 1개, 장비 대여 옵션", "one room, equipment rental option")],
  ["uf-", ex("24시 헬스 월 이용권", "24h gym monthly pass", "QR 출입, 락커 옵션", "QR entry, locker option")],
  ["su-ai-", LINEUP_EXAMPLES_BY_ID["su-ai-chatbot"]],
  ["su-fintech-", LINEUP_EXAMPLES_BY_ID["su-fintech-payment"]],
  ["su-health-", LINEUP_EXAMPLES_BY_ID["su-health-app"]],
  ["su-dev-", LINEUP_EXAMPLES_BY_ID["su-dev-devops"]],
  ["su-saas-", LINEUP_EXAMPLES_BY_ID["su-saas-crm"]],
  ["su-", LINEUP_EXAMPLES_BY_ID["su-ai-chatbot"]],
];

function ex(
  koName: string,
  enName: string,
  koNotes: string,
  enNotes: string,
  koCategories?: string[],
  enCategories?: string[],
  koCostLabel?: string,
  enCostLabel?: string,
): LineupExample {
  return {
    name: { ko: koName, en: enName },
    notes: { ko: koNotes, en: enNotes },
    categories: koCategories && enCategories ? { ko: koCategories, en: enCategories } : undefined,
    costLabel: koCostLabel && enCostLabel ? { ko: koCostLabel, en: enCostLabel } : undefined,
  };
}

function specializeLineupCopy(
  base: ClusterCopy,
  ko: boolean,
  specialtyId?: string,
  subIndustryId?: string,
): ClusterCopy {
  const example = resolveLineupExample(specialtyId) ?? resolveLineupExample(subIndustryId);
  if (!example) return base;

  return {
    ...base,
    categories: (ko ? example.categories?.ko : example.categories?.en) ?? base.categories,
    namePlaceholder: ko
      ? `${base.noun} 이름 (예: ${example.name.ko})`
      : `${base.noun} name (e.g., ${example.name.en})`,
    costPlaceholder: (ko ? example.costLabel?.ko : example.costLabel?.en) ?? base.costPlaceholder,
    notesPlaceholder: ko
      ? `메모 (예: ${example.notes.ko}) — 선택`
      : `Notes (e.g., ${example.notes.en}) — optional`,
  };
}

function resolveLineupExample(id: string | undefined): LineupExample | undefined {
  if (!id) return undefined;
  return LINEUP_EXAMPLES_BY_ID[id] ?? LINEUP_EXAMPLE_PREFIXES.find(([prefix]) => id.startsWith(prefix))?.[1];
}

// ── 메인 dispatcher ────────────────────────────────────────────────────
export function MenuDesignStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const cluster = classifyCluster(d.industryCategoryId ?? undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      <LineupPanel cluster={cluster} ko={ko} specialtyId={d.selectedSpecialtyId} subIndustryId={d.selectedIndustryId} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  LineupPanel — 전 cluster 공통 구조화 폼 (iOS MenuDesignStageView 패리티)
// ─────────────────────────────────────────────────────────────────────────
function LineupPanel({
  cluster,
  ko,
  specialtyId,
  subIndustryId,
}: {
  cluster: Cluster;
  ko: boolean;
  specialtyId?: string;
  subIndustryId?: string;
}) {
  const d = useDashboardCtx();
  const pg = d.guideStepIndex;
  const totalPg = 4;
  const setGuideStepIndex = d.setGuideStepIndex;
  const decisions = d.decisions;
  const setDecisions = d.setDecisions;
  const inventory = d.inventory;
  const setInventory = d.setInventory;

  const copy = specializeLineupCopy(clusterCopy(cluster, ko), ko, specialtyId, subIndustryId);

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
