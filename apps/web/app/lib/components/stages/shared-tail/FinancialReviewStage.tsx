"use client";

/**
 * FinancialReviewStage — "월 운영비" 로드맵 단계.
 *
 * b+c 하이브리드 UI:
 *   - 카테고리 pill 탭 (고정비 · 변동비 · 기타) 3개
 *   - 각 탭 내부는 항목 스텝 (확인 체크)
 *   - 하단 재무 시뮬 결과 카드 (자동 계산)
 *
 * Apple × 우리 서비스 톤:
 *   - var(--surface-strong) 백 + var(--border) 1px 보더 + radius 24px
 *   - 큰 숫자 weight 600, -0.04em, tabular-nums
 *   - 단일 액센트 #191970 (iOS 블루) — primary는 우리 서비스 네이비 #1d3557로 저장 버튼
 *   - 여백 넉넉 (padding 32px shell)
 *
 * 자동 집계: monthly-cost-estimator.ts의 estimateMonthlyCosts() 재사용.
 */

import { useMemo, useState, useEffect } from "react";
import { Check, TrendingUp, TrendingDown, Info, Sparkles, ShieldCheck, Building2, AlertTriangle } from "lucide-react";
import {
  estimateMonthlyCosts,
  buildFinancialSimulation,
  type MonthlyCostFields,
  type CostSource,
  type StageInputs,
  type UserOverrides,
  type StaffPlan,
  seoulMarketDistricts,
  starterIndustryOptions,
  localizeRecommendationItem,
  franchiseBrands,
} from "@foundone/shared";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { StageWrapup } from "../shared/StageWrapup";

type FieldKey = keyof MonthlyCostFields;
type CategoryKey = "fixed" | "variable" | "other";

const CATEGORY_FIELDS: Record<CategoryKey, FieldKey[]> = {
  fixed:    ["rent", "labor", "utilities"],
  variable: ["ingredients", "sga"],
  other:    ["marketing", "interest", "other"],
};

const FIELD_LABELS: Record<FieldKey, { ko: string; en: string; hint: { ko: string; en: string } }> = {
  rent:        { ko: "임대료",       en: "Rent",        hint: { ko: "월세 + 관리비", en: "Rent + fee" } },
  labor:       { ko: "인건비",       en: "Labor",       hint: { ko: "월급 + 4대보험", en: "Wage + insurance" } },
  utilities:   { ko: "공과금",       en: "Utilities",   hint: { ko: "전기·가스·수도·통신", en: "Elec/Gas/Water" } },
  ingredients: { ko: "식자재 원가",  en: "COGS",        hint: { ko: "매출 대비 재료비", en: "Cost of goods" } },
  sga:         { ko: "운영 수수료",  en: "Ops fees",    hint: { ko: "배달·POS·카드", en: "Delivery/POS/Card" } },
  marketing:   { ko: "마케팅",       en: "Marketing",   hint: { ko: "광고·프로모션", en: "Ads & promo" } },
  interest:    { ko: "대출 이자",    en: "Interest",    hint: { ko: "월 이자 상환", en: "Monthly interest" } },
  other:       { ko: "기타",         en: "Other",       hint: { ko: "소모품·수리 등", en: "Supplies/etc" } },
};

const SOURCE_LABEL: Record<CostSource, { ko: string; en: string; tone: "accent" | "muted" | "warn" }> = {
  "user-input":        { ko: "직접 입력",     en: "You edited",   tone: "accent" },
  "stage-derived":     { ko: "이전 단계 기반", en: "From stages",  tone: "accent" },
  "industry-average":  { ko: "업종 평균",     en: "Industry avg", tone: "muted" },
  "insufficient-data": { ko: "데이터 부족",   en: "Needs input",  tone: "warn" },
};

const fmtWon = (n: number): string => {
  if (!isFinite(n) || isNaN(n) || n === 0) return "—";
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만원`;
  return `${n.toLocaleString()}원`;
};

const MIDNIGHT = "#191970";

// ─── Sub-industry 월 운영비 벤치마크 (매출액 대비 %, 2026 기준) ──────────────
// 출처: 한국외식산업연구원·한국농어민신문·CMN·DailyVet·블랙워터이슈·ESG경제 등 (2024~2026)
type CostBenchmark = {
  ingredients: [number, number];  // 원재료/식자재 (또는 인프라/SaaS·재고)
  labor: [number, number];        // 인건비
  rent: [number, number];         // 임대료 (또는 코워킹)
  utilities: [number, number];    // 공과금 (또는 통신·기기)
  sga: [number, number];          // 운영 수수료 (배달·POS·카드, 또는 결제·회계·법무)
  marketing: [number, number];    // 마케팅
  other: [number, number];        // 기타
  margin: [number, number];       // 영업이익률 (burn 기준일 때는 목표 gross margin)
  notes?: string;                 // 핵심 특징 (1줄)
  basis?: "revenue" | "burn";     // 백분율 기준: 매출액 대비 (default) / 월 번레이트 대비
  typicalMonthlyKrw?: [number, number]; // 초기 단계 월 운영비 절대 KRW 범위
};

const SUB_INDUSTRY_BENCHMARKS: Record<string, CostBenchmark> = {
  // ── 카페·디저트 ──
  "icecream-bingsu":   { ingredients: [35, 40], labor: [18, 24], rent: [10, 15], utilities: [4, 6], sga: [3, 5],   marketing: [3, 5], other: [4, 6], margin: [10, 18], notes: "여름 피크·겨울 비수기 — 시즌성 현금흐름 관리 핵심" },
  "takeout-coffee":    { ingredients: [25, 30], labor: [25, 30], rent: [12, 18], utilities: [3, 5], sga: [2, 4],   marketing: [2, 4], other: [3, 5], margin: [15, 25], notes: "회전율 매출 — 컵·우유·원두 단가 관리가 마진" },
  "specialty-coffee":  { ingredients: [30, 35], labor: [25, 30], rent: [12, 18], utilities: [4, 6], sga: [2, 4],   marketing: [3, 5], other: [3, 5], margin: [15, 22], notes: "프리미엄 원두 비중 高 — 객단가 높이는 메뉴 설계 필수" },
  "dessert-cafe":      { ingredients: [35, 45], labor: [22, 28], rent: [10, 15], utilities: [4, 6], sga: [3, 5],   marketing: [4, 7], other: [3, 5], margin: [10, 18], notes: "재료 폐기율 ↑ — 당일 제조·SNS 마케팅이 핵심" },
  "bakery-studio":     { ingredients: [30, 38], labor: [30, 38], rent: [10, 15], utilities: [5, 8], sga: [2, 4],   marketing: [3, 5], other: [3, 5], margin: [10, 18], notes: "제빵 기술 인건비 비중 高 — 새벽 작업·발효기 가스비 ↑" },
  "self-serve-cafe":   { ingredients: [25, 30], labor: [5, 12],  rent: [12, 18], utilities: [4, 6], sga: [3, 5],   marketing: [3, 5], other: [5, 8], margin: [20, 30], notes: "무인 — 인건비 최소, 기기 유지보수·청소 외주비 별도" },

  // ── 외식·식당 ──
  "ramen-noodle":      { ingredients: [35, 42], labor: [20, 25], rent: [8, 12],  utilities: [4, 6], sga: [3, 5],   marketing: [2, 4], other: [3, 5], margin: [12, 20], notes: "사골 육수 원재료 + 회전율 — 점심 1.5회전 이상 필요" },
  "korean-casual":     { ingredients: [40, 48], labor: [22, 30], rent: [8, 12],  utilities: [4, 6], sga: [3, 5],   marketing: [2, 4], other: [3, 5], margin: [8, 15],  notes: "반찬 多 → 식자재·폐기율 ↑ / 백반 가격 경직성 ↑" },
  "chicken-burger":    { ingredients: [35, 42], labor: [18, 24], rent: [8, 12],  utilities: [4, 6], sga: [10, 15], marketing: [3, 5], other: [3, 5], margin: [8, 15],  notes: "★ 배달 수수료 10~15% 별도 — 매출의 25~30%가 플랫폼" },
  "delivery-meals":    { ingredients: [32, 38], labor: [12, 18], rent: [5, 8],   utilities: [3, 5], sga: [15, 22], marketing: [3, 5], other: [3, 5], margin: [10, 18], notes: "★ 배달 수수료 비중 최고 — 좌석 X 작은 매장이 정석" },
  "salad-healthy":     { ingredients: [38, 45], labor: [20, 25], rent: [10, 15], utilities: [3, 5], sga: [4, 7],   marketing: [4, 7], other: [3, 5], margin: [8, 15],  notes: "신선 채소 폐기율 ↑ — 당일 입고·매진 운영" },
  "western-pasta-brunch": { ingredients: [32, 38], labor: [25, 32], rent: [10, 15], utilities: [4, 6], sga: [3, 5], marketing: [4, 6], other: [3, 5], margin: [10, 18], notes: "객단가 高 — 와인 마진·테이블 회전율이 수익 결정" },

  // ── 뷰티 ──
  "hair-salon":        { ingredients: [5, 10],  labor: [50, 60], rent: [12, 18], utilities: [3, 5], sga: [2, 4],   marketing: [3, 5], other: [4, 6], margin: [10, 18], notes: "★ 디자이너 수익 분배 50%+ — 인건비 비중 가장 높음" },
  "nail-studio":       { ingredients: [8, 12],  labor: [50, 60], rent: [10, 15], utilities: [2, 4], sga: [2, 4],   marketing: [4, 6], other: [4, 6], margin: [10, 18], notes: "1:1 시술 — 노쇼·예약 효율이 마진 결정" },
  "skin-care-room":    { ingredients: [12, 18], labor: [40, 50], rent: [12, 18], utilities: [3, 5], sga: [2, 4],   marketing: [5, 8], other: [3, 5], margin: [12, 22], notes: "기기·화장품 단가 ↑ / 멤버십 모델로 안정화 가능" },
  "waxing-studio":     { ingredients: [8, 12],  labor: [45, 55], rent: [10, 15], utilities: [2, 4], sga: [2, 4],   marketing: [5, 8], other: [4, 6], margin: [12, 20], notes: "재료 단가 낮음·기술 인건비 높음 — 단골 회전이 핵심" },
  "eyelash-brow":      { ingredients: [10, 15], labor: [50, 60], rent: [10, 15], utilities: [2, 4], sga: [2, 4],   marketing: [5, 8], other: [3, 5], margin: [10, 18], notes: "글루·핀셋 등 소모품 + 1인 시술자 비중 高" },
  "makeup-bridal":     { ingredients: [10, 15], labor: [40, 50], rent: [8, 12],  utilities: [2, 4], sga: [2, 4],   marketing: [8, 12], other: [3, 5], margin: [15, 25], notes: "출장형이면 임대료 낮음 — 시즌(결혼식 5/10월) 매출 집중" },

  // ── 피트니스 ──
  "pilates-studio":    { ingredients: [3, 6],   labor: [50, 60], rent: [18, 25], utilities: [3, 5], sga: [3, 5],   marketing: [4, 7], other: [4, 6], margin: [8, 18],  notes: "리포머 등 기구 감가상각 + 강사 수익 분배 50%+" },
  "pt-gym":            { ingredients: [3, 6],   labor: [50, 60], rent: [15, 25], utilities: [4, 7], sga: [3, 5],   marketing: [4, 7], other: [3, 5], margin: [10, 20], notes: "PT 트레이너 수익 분배 + 회원권 정기 매출" },
  "yoga-studio":       { ingredients: [2, 5],   labor: [40, 50], rent: [20, 28], utilities: [3, 5], sga: [3, 5],   marketing: [4, 7], other: [4, 6], margin: [10, 20], notes: "강사 외부 → 인건비 변동, 임대료 고정 부담 큼" },
  "crossfit-box":      { ingredients: [3, 6],   labor: [40, 50], rent: [18, 25], utilities: [4, 7], sga: [3, 5],   marketing: [4, 7], other: [5, 8], margin: [10, 20], notes: "그룹 클래스 — 1코치당 회원수 최대화가 마진 핵심" },
  "golf-studio":       { ingredients: [2, 5],   labor: [25, 35], rent: [15, 22], utilities: [5, 8], sga: [3, 5],   marketing: [4, 7], other: [8, 12], margin: [15, 28], notes: "장비 감가상각 高·시간당 단가 모델 — 가동률 60%+ 필요" },
  "unmanned-fitness":  { ingredients: [2, 5],   labor: [5, 12],  rent: [18, 25], utilities: [4, 7], sga: [4, 7],   marketing: [5, 8], other: [8, 12], margin: [25, 35], notes: "무인 — 인건비 최소, CCTV·출입통제 시스템 비용 별도" },

  // ── 펫 ──
  "pet-grooming":      { ingredients: [8, 12],  labor: [40, 50], rent: [12, 18], utilities: [3, 5], sga: [3, 5],   marketing: [4, 7], other: [5, 8], margin: [12, 20], notes: "그루머 인건비 + 도구 소모 — 1인당 일 4~6마리 한계" },
  "pet-supplies":      { ingredients: [55, 65], labor: [15, 22], rent: [12, 18], utilities: [3, 5], sga: [3, 5],   marketing: [4, 7], other: [3, 5], margin: [5, 12],  notes: "★ 사료·용품 매입원가 비중 최고 — 마진 8~12% 박리다매" },
  "pet-hotel":         { ingredients: [8, 12],  labor: [35, 45], rent: [15, 22], utilities: [4, 7], sga: [3, 5],   marketing: [4, 7], other: [5, 8], margin: [15, 25], notes: "공휴일·휴가철 매출 집중 — 평일 가동률 관리" },
  "pet-cafe":          { ingredients: [25, 32], labor: [25, 32], rent: [15, 22], utilities: [4, 7], sga: [3, 5],   marketing: [4, 7], other: [6, 10], margin: [10, 18], notes: "거주 동물 사료·의료비 고정 — 입장료 + 음료 결합" },
  "pet-training-school": { ingredients: [3, 6], labor: [50, 60], rent: [15, 22], utilities: [3, 5], sga: [2, 4],   marketing: [5, 8], other: [4, 6], margin: [12, 20], notes: "트레이너 인건비 + 공간 임대료 — 회당 단가 모델" },
  "pet-walking-visit": { ingredients: [2, 5],   labor: [55, 65], rent: [0, 5],   utilities: [1, 3], sga: [3, 5],   marketing: [5, 8], other: [10, 15], margin: [15, 25], notes: "방문형 — 임대료 거의 X, 인건비·이동비가 거의 전부" },

  // ── 교육 ──
  "kids-academy":      { ingredients: [3, 8],   labor: [45, 55], rent: [15, 22], utilities: [3, 5], sga: [2, 4],   marketing: [5, 8], other: [4, 6], margin: [12, 22], notes: "강사 인건비 + 교재비 — 학부모 모집·재등록률이 핵심" },
  "study-cafe-space":  { ingredients: [2, 5],   labor: [5, 12],  rent: [25, 35], utilities: [5, 8], sga: [3, 5],   marketing: [4, 7], other: [10, 15], margin: [20, 30], notes: "무인 — 좌석 가동률 70%+ 임대료 부담 회수 가능" },
  "study-room":        { ingredients: [2, 5],   labor: [10, 18], rent: [25, 35], utilities: [5, 8], sga: [3, 5],   marketing: [5, 8], other: [8, 12], margin: [15, 25], notes: "시간 단위 단가 — 예약 충돌·재청소 비용" },
  "adult-class":       { ingredients: [10, 18], labor: [35, 45], rent: [12, 18], utilities: [3, 5], sga: [2, 4],   marketing: [8, 12], other: [4, 6], margin: [15, 25], notes: "취미·소수정예 — 마케팅 비중 ↑, 강사 수익 분배" },
  "language-academy":  { ingredients: [5, 10],  labor: [45, 55], rent: [15, 22], utilities: [3, 5], sga: [2, 4],   marketing: [6, 10], other: [3, 5], margin: [12, 22], notes: "원어민 강사 단가 高 — 상시반·단기반 mix 필요" },
  "coding-class":      { ingredients: [5, 10],  labor: [45, 55], rent: [12, 18], utilities: [4, 6], sga: [3, 5],   marketing: [5, 8], other: [4, 6], margin: [15, 25], notes: "PC·소프트웨어 라이센스 + 강사 단가" },
  "small-study-room":  { ingredients: [3, 8],   labor: [40, 50], rent: [10, 15], utilities: [2, 4], sga: [2, 4],   marketing: [4, 7], other: [3, 5], margin: [20, 30], notes: "1:1·소수 — 작은 공간 + 사장님 직강 시 마진 高" },

  // ── 소매·생활 ──
  "convenience-small": { ingredients: [70, 78], labor: [10, 15], rent: [5, 8],   utilities: [3, 5], sga: [2, 4],   marketing: [1, 3], other: [2, 4], margin: [3, 8],   notes: "★ 매입원가 70%+ — 박리다매·24시 운영" },
  "lifestyle-goods":   { ingredients: [45, 55], labor: [15, 22], rent: [12, 18], utilities: [2, 4], sga: [3, 5],   marketing: [5, 8], other: [3, 5], margin: [10, 18], notes: "재고 회전 + 큐레이션 — 트렌드 추종 시 폐기율 ↑" },
  "beauty-supplies":   { ingredients: [50, 60], labor: [15, 22], rent: [12, 18], utilities: [2, 4], sga: [3, 5],   marketing: [5, 8], other: [3, 5], margin: [8, 15],  notes: "유효기간 관리 + 테스터 위생 비용" },
  "fashion-accessories": { ingredients: [40, 50], labor: [15, 22], rent: [12, 18], utilities: [2, 4], sga: [3, 5], marketing: [8, 12], other: [3, 5], margin: [10, 18], notes: "트렌드 빠름 → 시즌 폐기 + 인스타 마케팅 비중 ↑" },
  "health-food-store": { ingredients: [55, 65], labor: [15, 22], rent: [10, 15], utilities: [2, 4], sga: [3, 5],   marketing: [5, 8], other: [3, 5], margin: [8, 15],  notes: "건강기능식품 인증·마진 박함 — 상담 매출 추가 필요" },
  "unmanned-retail":   { ingredients: [55, 65], labor: [3, 8],   rent: [12, 18], utilities: [3, 5], sga: [3, 5],   marketing: [3, 5], other: [10, 15], margin: [8, 15],  notes: "무인 — 도난·CCTV 비용 + 1일 1회 보충 인건비" },

  // ── 생활서비스 ──
  "self-laundry":      { ingredients: [3, 6],   labor: [3, 8],   rent: [25, 35], utilities: [15, 22], sga: [3, 5], marketing: [3, 5], other: [10, 15], margin: [15, 25], notes: "★ 무인 — 임대료·전기·수도가 비용 구조 핵심" },
  "laundry-service":   { ingredients: [10, 15], labor: [35, 45], rent: [12, 18], utilities: [10, 15], sga: [3, 5], marketing: [4, 7], other: [5, 8], margin: [10, 18], notes: "세제·전기·수도 고정 — 의류 분실 보험 별도" },
  "cleaning-service":  { ingredients: [5, 10],  labor: [55, 65], rent: [3, 8],   utilities: [2, 4], sga: [3, 5],   marketing: [5, 8], other: [10, 15], margin: [10, 20], notes: "방문형 — 인건비 절대 비중·이동비 + 도구 소모" },
  "repair-service":    { ingredients: [25, 35], labor: [35, 45], rent: [8, 12],  utilities: [2, 4], sga: [3, 5],   marketing: [5, 8], other: [3, 5], margin: [10, 20], notes: "부품 매입 + 기술 인건비 — 보증·재방문 처리 비용" },
  "device-repair":     { ingredients: [40, 50], labor: [25, 35], rent: [8, 12],  utilities: [2, 4], sga: [3, 5],   marketing: [4, 7], other: [3, 5], margin: [10, 20], notes: "iPhone·갤럭시 부품 매입 비중 高" },
  "print-copy":        { ingredients: [25, 35], labor: [15, 22], rent: [10, 15], utilities: [10, 15], sga: [3, 5], marketing: [3, 5], other: [10, 15], margin: [10, 18], notes: "토너·잉크·용지 매입 + 전기료" },

  // ── 공간 ──
  "rental-studio":     { ingredients: [3, 6],   labor: [10, 18], rent: [30, 40], utilities: [5, 8], sga: [4, 7],   marketing: [5, 8], other: [10, 15], margin: [15, 25], notes: "임대료가 비용 절반 — 시간 단위 가동률이 마진 결정" },
  "party-room":        { ingredients: [5, 10],  labor: [15, 22], rent: [25, 35], utilities: [5, 8], sga: [4, 7],   marketing: [5, 8], other: [10, 15], margin: [15, 25], notes: "주말·야간 집중 매출 — 청소·민원 대응 비용" },
  "shared-office":     { ingredients: [3, 6],   labor: [10, 18], rent: [35, 45], utilities: [5, 8], sga: [4, 7],   marketing: [5, 8], other: [8, 12], margin: [15, 25], notes: "임대료 비중 최대 — 멤버십 정기 매출 안정성 핵심" },
  "practice-room":     { ingredients: [3, 6],   labor: [5, 12],  rent: [30, 40], utilities: [8, 12], sga: [3, 5],  marketing: [5, 8], other: [10, 15], margin: [15, 25], notes: "방음·악기 유지보수 비용 + 시간당 단가" },
  "guesthouse":        { ingredients: [8, 15],  labor: [15, 30], rent: [25, 40], utilities: [8, 15], sga: [5, 10], marketing: [15, 22], other: [3, 7], margin: [10, 25], typicalMonthlyKrw: [5_000_000, 25_000_000], notes: "OTA 14~16% + 청소·세탁·임대료가 고정비 핵심" },

  // ── 온라인·디지털 ── (basis="revenue", 매출 발생 후)
  "smart-store":       { ingredients: [40, 55], labor: [10, 20], rent: [3, 8],   utilities: [2, 5], sga: [8, 12],  marketing: [15, 25], other: [2, 5], margin: [15, 30], typicalMonthlyKrw: [3_000_000, 50_000_000], notes: "결제 3.74% + 매출연동 2% + CPC 광고 누적 부담" },
  "digital-products":  { ingredients: [3, 8],   labor: [30, 50], rent: [0, 5],   utilities: [3, 7], sga: [10, 15], marketing: [20, 35], other: [2, 5], margin: [70, 90], typicalMonthlyKrw: [1_000_000, 15_000_000], notes: "크몽·인프런 15~20%·노션 마켓 5%, 광고 ROI 핵심" },
  "creator-service":   { ingredients: [10, 20], labor: [25, 45], rent: [3, 10],  utilities: [5, 10], sga: [5, 10], marketing: [10, 20], other: [3, 8], margin: [40, 65], typicalMonthlyKrw: [2_000_000, 20_000_000], notes: "편집 외주·장비 감가·썸네일이 가변비 핵심" },
  "consignment-commerce": { ingredients: [55, 70], labor: [10, 20], rent: [2, 6], utilities: [2, 5], sga: [8, 12], marketing: [10, 18], other: [2, 5], margin: [10, 20], typicalMonthlyKrw: [2_000_000, 30_000_000], notes: "마진 얇음 — 반품·CS·환율 리스크가 손익 좌우" },
  "newsletter-membership": { ingredients: [5, 12], labor: [30, 50], rent: [0, 5], utilities: [3, 8], sga: [12, 18], marketing: [15, 25], other: [3, 7], margin: [55, 80], typicalMonthlyKrw: [1_000_000, 15_000_000], notes: "Stibee·Patreon 10% + Stripe 3.4% + 콘텐츠 외주" },
  "global-buying":     { ingredients: [50, 65], labor: [10, 18], rent: [2, 6],   utilities: [3, 7], sga: [10, 15], marketing: [10, 18], other: [3, 7], margin: [10, 22], typicalMonthlyKrw: [3_000_000, 40_000_000], notes: "환율·해외배송·관세가 마진 잠식, 박리다매 구조" },

  // ── 스타트업·기술 ── (basis="burn", 매출 전 단계)
  "ai-application":    { ingredients: [15, 30], labor: [40, 55], rent: [5, 12], utilities: [2, 5], sga: [5, 10],  marketing: [3, 10], other: [2, 5], margin: [70, 85], basis: "burn", typicalMonthlyKrw: [12_000_000, 35_000_000], notes: "Claude·Cursor·OpenAI API가 매월 가장 빠르게 늘어남" },
  "developer-tools":   { ingredients: [8, 15],  labor: [50, 65], rent: [5, 12], utilities: [2, 5], sga: [5, 10],  marketing: [5, 12], other: [2, 5], margin: [75, 90], basis: "burn", typicalMonthlyKrw: [8_000_000, 25_000_000], notes: "GitHub·CI/CD 비용 + 오픈소스 GTM 광고가 핵심" },
  "b2b-saas":          { ingredients: [10, 18], labor: [45, 60], rent: [5, 12], utilities: [2, 5], sga: [8, 12],  marketing: [10, 18], other: [2, 5], margin: [75, 85], basis: "burn", typicalMonthlyKrw: [15_000_000, 40_000_000], notes: "엔터프라이즈 영업·SOC2·보안인증 비용 큼" },
  "fintech-startup":   { ingredients: [12, 20], labor: [40, 55], rent: [5, 10], utilities: [2, 5], sga: [12, 20], marketing: [5, 12], other: [5, 10], margin: [60, 75], basis: "burn", typicalMonthlyKrw: [25_000_000, 80_000_000], notes: "KYC·AML·금융위 컴플라이언스·법무가 압도적" },
  "healthtech-startup": { ingredients: [10, 18], labor: [40, 55], rent: [5, 12], utilities: [3, 8], sga: [10, 15], marketing: [3, 8], other: [5, 15], margin: [50, 70], basis: "burn", typicalMonthlyKrw: [30_000_000, 100_000_000], notes: "임상·식약처 인증·의료기기 GMP 비용 변동성 큼" },
  "security-startup":  { ingredients: [12, 20], labor: [50, 65], rent: [5, 10], utilities: [2, 5], sga: [8, 12],  marketing: [5, 10], other: [3, 7], margin: [70, 85], basis: "burn", typicalMonthlyKrw: [15_000_000, 45_000_000], notes: "테스트랩·CC인증·보안 컴플라이언스 비용 발생" },
  "hardware-iot":      { ingredients: [25, 40], labor: [35, 50], rent: [5, 10], utilities: [3, 7], sga: [5, 10],  marketing: [3, 8], other: [3, 8], margin: [40, 60], basis: "burn", typicalMonthlyKrw: [20_000_000, 60_000_000], notes: "BOM·금형·시제품 30%+ — 양산 전환이 분수령" },
  "robotics-physical-ai": { ingredients: [25, 40], labor: [40, 55], rent: [5, 10], utilities: [3, 8], sga: [5, 10], marketing: [2, 6], other: [3, 8], margin: [35, 55], basis: "burn", typicalMonthlyKrw: [40_000_000, 120_000_000], notes: "센서·액추에이터 부품과 시뮬레이션 GPU 비용" },
  "semiconductor":     { ingredients: [40, 60], labor: [25, 40], rent: [3, 8],  utilities: [3, 7], sga: [5, 10],  marketing: [1, 4], other: [3, 8], margin: [40, 60], basis: "burn", typicalMonthlyKrw: [50_000_000, 200_000_000], notes: "MPW 1회당 수억 — 모두의 챌린지 등 정부 매칭 의존" },
  "biotech-medtech":   { ingredients: [20, 35], labor: [35, 50], rent: [5, 12], utilities: [3, 7], sga: [10, 15], marketing: [2, 6], other: [5, 12], margin: [40, 65], basis: "burn", typicalMonthlyKrw: [40_000_000, 150_000_000], notes: "전임상·임상 단계별 자금 필요, IP·라이선스 큼" },
  "climate-energy":    { ingredients: [20, 35], labor: [35, 50], rent: [5, 12], utilities: [3, 7], sga: [8, 12],  marketing: [3, 8], other: [5, 10], margin: [45, 65], basis: "burn", typicalMonthlyKrw: [25_000_000, 80_000_000], notes: "측정 장비·인증·실증사업 비용, 정부 R&D 매칭" },
};

// 카테고리 폴백
const CATEGORY_FALLBACK_BENCHMARKS: Record<string, CostBenchmark> = {
  food:           { ingredients: [38, 45], labor: [22, 28], rent: [8, 12],  utilities: [4, 6], sga: [4, 8],  marketing: [2, 5], other: [3, 5], margin: [10, 18] },
  "cafe-dessert": { ingredients: [30, 38], labor: [22, 28], rent: [10, 15], utilities: [4, 6], sga: [3, 5],  marketing: [3, 5], other: [3, 5], margin: [12, 22] },
  beauty:         { ingredients: [8, 12],  labor: [45, 55], rent: [12, 18], utilities: [3, 5], sga: [2, 4],  marketing: [4, 7], other: [4, 6], margin: [12, 22] },
  fitness:        { ingredients: [3, 6],   labor: [40, 55], rent: [18, 25], utilities: [4, 7], sga: [3, 5],  marketing: [4, 7], other: [4, 6], margin: [10, 22] },
  pet:            { ingredients: [20, 35], labor: [30, 45], rent: [12, 20], utilities: [3, 6], sga: [3, 5],  marketing: [4, 7], other: [4, 8], margin: [10, 20] },
  education:      { ingredients: [5, 10],  labor: [40, 55], rent: [15, 22], utilities: [3, 5], sga: [2, 4],  marketing: [5, 8], other: [4, 6], margin: [12, 22] },
  retail:         { ingredients: [45, 60], labor: [15, 22], rent: [10, 18], utilities: [2, 4], sga: [3, 5],  marketing: [4, 7], other: [3, 5], margin: [8, 15] },
  "living-service": { ingredients: [15, 30], labor: [25, 45], rent: [10, 20], utilities: [5, 12], sga: [3, 5], marketing: [4, 7], other: [5, 10], margin: [10, 20] },
  space:          { ingredients: [3, 6],   labor: [10, 18], rent: [28, 40], utilities: [5, 10], sga: [4, 7], marketing: [5, 8], other: [10, 15], margin: [15, 25] },
  "online-digital": { ingredients: [25, 50], labor: [15, 35], rent: [0, 8],  utilities: [3, 8], sga: [8, 15], marketing: [12, 25], other: [3, 8], margin: [20, 50], typicalMonthlyKrw: [2_000_000, 25_000_000] },
  "startup-tech":  { ingredients: [15, 30], labor: [40, 55], rent: [5, 12], utilities: [2, 7], sga: [8, 15], marketing: [3, 12], other: [3, 10], margin: [60, 80], basis: "burn", typicalMonthlyKrw: [15_000_000, 60_000_000] },
};

// ─── Sub-industry 본문 비용 항목 라벨/기본값 (8 필드 재해석) ───────────────
// 스타트업·온라인·기타 비전통 업종은 "식자재 원가" 같은 일반 라벨이 안 맞으므로
// sub-industry별로 의미를 재정의. 매출 기반 추정도 어색하므로 typicalMonthlyKrw
// 분포에서 도출한 절대 KRW 기본값을 함께 제공 (사용자가 입력 안 했을 때 표시).
type SubFieldOverride = {
  ko: string;
  en: string;
  hint: { ko: string; en: string };
};
type SubIndustryFieldsConfig = {
  labels?: Partial<Record<FieldKey, SubFieldOverride>>;
  defaults?: Partial<MonthlyCostFields>; // 사용자 미입력 시 보일 KRW 절대값 (초기 단계 평균)
};

const SUB_INDUSTRY_FIELDS: Record<string, SubIndustryFieldsConfig> = {
  // ─── 스타트업·테크 (basis=burn) ───
  "ai-application": {
    labels: {
      ingredients: { ko: "AI API 사용량",     en: "AI API usage",     hint: { ko: "Claude·OpenAI·Gemini 토큰 사용량",   en: "Claude/OpenAI/Gemini tokens" } },
      sga:         { ko: "결제·플랫폼 수수료", en: "Payment fees",     hint: { ko: "Toss·Stripe 2.9% + 앱스토어 15~30%", en: "Toss/Stripe + app store cut" } },
      utilities:   { ko: "SaaS·인프라 구독",  en: "SaaS / Infra",     hint: { ko: "Vercel·Supabase·Cursor·Linear·GitHub", en: "Vercel/Supabase/Cursor/Linear" } },
      rent:        { ko: "사무실·코워킹",     en: "Office / Cowork",  hint: { ko: "FastFive·Sparkplus·재택은 0",         en: "FastFive/Sparkplus/0 if remote" } },
      other:       { ko: "법무·회계·IP",      en: "Legal / Accounting", hint: { ko: "변호사·세무사·특허 출원·인증",       en: "Lawyer/CPA/IP filings" } },
      marketing:   { ko: "광고·마케팅",       en: "Marketing",        hint: { ko: "PH·Twitter·검색·콘텐츠 광고",        en: "PH/Twitter/search/content" } },
    },
    defaults: { ingredients: 3_000_000, rent: 500_000, utilities: 1_500_000, sga: 300_000, marketing: 2_000_000, other: 800_000 },
  },
  "developer-tools": {
    labels: {
      ingredients: { ko: "인프라·CI/CD",       en: "Infra / CI/CD",     hint: { ko: "GitHub Actions·CDN·빌드 사용량",     en: "GitHub Actions/CDN/build" } },
      sga:         { ko: "결제·배포 수수료",   en: "Payment fees",      hint: { ko: "Stripe 2.9% + 마켓플레이스 수수료",  en: "Stripe + marketplace fees" } },
      utilities:   { ko: "SaaS·도구 구독",     en: "SaaS / Dev tools",  hint: { ko: "JetBrains·Linear·Notion·Sentry",     en: "JetBrains/Linear/Sentry" } },
      rent:        { ko: "사무실·코워킹",      en: "Office / Cowork",   hint: { ko: "FastFive·재택은 0",                   en: "FastFive/0 if remote" } },
      other:       { ko: "법무·회계·IP",       en: "Legal / Accounting", hint: { ko: "변호사·세무사·오픈소스 라이선스",   en: "Lawyer/CPA/OSS license" } },
      marketing:   { ko: "GTM·콘텐츠",         en: "GTM / Content",     hint: { ko: "오픈소스 GTM·DevRel·블로그",          en: "OSS GTM/DevRel/blog" } },
    },
    defaults: { ingredients: 800_000, rent: 500_000, utilities: 1_000_000, sga: 200_000, marketing: 1_500_000, other: 600_000 },
  },
  "b2b-saas": {
    labels: {
      ingredients: { ko: "인프라·SOC2",        en: "Infra / SOC2",      hint: { ko: "AWS·Vanta·SOC2 모니터링",            en: "AWS/Vanta/SOC2" } },
      sga:         { ko: "영업·CRM 수수료",    en: "Sales / CRM",       hint: { ko: "HubSpot·Salesforce·Stripe 2.9%",     en: "HubSpot/Salesforce/Stripe" } },
      utilities:   { ko: "SaaS·도구 구독",     en: "SaaS / Tools",      hint: { ko: "Linear·Notion·Slack·Figma·Sentry",   en: "Linear/Notion/Slack/Figma" } },
      rent:        { ko: "사무실·코워킹",      en: "Office / Cowork",   hint: { ko: "엔터프라이즈 신뢰 위해 사무실 권장",  en: "Office recommended" } },
      other:       { ko: "보안인증·법무",      en: "Cert / Legal",      hint: { ko: "ISO27001·SOC2 인증·변호사·세무",     en: "ISO27001/SOC2/legal" } },
      marketing:   { ko: "B2B 마케팅",         en: "B2B Marketing",     hint: { ko: "검색·LinkedIn·웹세미나·전시회",       en: "Search/LinkedIn/events" } },
    },
    defaults: { ingredients: 2_000_000, rent: 1_500_000, utilities: 2_000_000, sga: 1_500_000, marketing: 4_000_000, other: 1_500_000 },
  },
  "fintech-startup": {
    labels: {
      ingredients: { ko: "금융 API·KYC",       en: "Fin API / KYC",     hint: { ko: "Plaid·KYC/AML 솔루션·신원확인",      en: "Plaid/KYC/AML" } },
      sga:         { ko: "컴플라이언스·법무",  en: "Compliance / Legal",hint: { ko: "금융위 신고비·변호사·자문 retainer",  en: "FSC/lawyer retainer" } },
      utilities:   { ko: "SaaS·인프라 구독",   en: "SaaS / Infra",      hint: { ko: "AWS·Datadog·관측·인증 도구",          en: "AWS/Datadog/monitoring" } },
      rent:        { ko: "사무실·코워킹",      en: "Office / Cowork",   hint: { ko: "금융위 등록 시 실물 사무실 필수",     en: "Office required if FSC-registered" } },
      other:       { ko: "보안인증·감사",      en: "Cert / Audit",      hint: { ko: "ISMS-P·정보보호인증·외부 감사",       en: "ISMS-P/security audit" } },
      marketing:   { ko: "마케팅·신뢰 콘텐츠",  en: "Marketing / Trust", hint: { ko: "검색·신뢰 콘텐츠·언론 PR",            en: "Search/trust/PR" } },
    },
    defaults: { ingredients: 4_000_000, rent: 2_000_000, utilities: 2_500_000, sga: 5_000_000, marketing: 3_000_000, other: 3_000_000 },
  },
  "healthtech-startup": {
    labels: {
      ingredients: { ko: "임상·연구 비용",     en: "Clinical / R&D",    hint: { ko: "CRO·임상시험·연구 외주",              en: "CRO/clinical/R&D outsource" } },
      sga:         { ko: "식약처 인증·법무",   en: "MFDS / Legal",      hint: { ko: "의료기기 GMP·식약처 신고·법무",       en: "MFDS/GMP/legal" } },
      utilities:   { ko: "SaaS·연구 장비",     en: "SaaS / Lab",        hint: { ko: "AWS·연구 데이터·실험 장비 유지",       en: "AWS/lab equipment" } },
      rent:        { ko: "연구실·사무실",      en: "Lab / Office",      hint: { ko: "GMP 시설 또는 코워킹",                 en: "GMP facility or cowork" } },
      other:       { ko: "특허·라이선스",      en: "IP / License",      hint: { ko: "특허 출원·라이선스 in/out·자문",      en: "Patents/license" } },
      marketing:   { ko: "학회·임상 PR",       en: "Conference / PR",   hint: { ko: "학회 발표·임상 결과 발표·PR",          en: "Conference/clinical PR" } },
    },
    defaults: { ingredients: 8_000_000, rent: 3_000_000, utilities: 3_000_000, sga: 6_000_000, marketing: 2_000_000, other: 5_000_000 },
  },
  "security-startup": {
    labels: {
      ingredients: { ko: "인프라·테스트랩",    en: "Infra / Test lab",  hint: { ko: "AWS·테스트 환경·취약점 스캐너",        en: "AWS/test lab/scanner" } },
      sga:         { ko: "CC인증·컴플라이언스",en: "CC / Compliance",   hint: { ko: "CC인증·ISMS·KISA 신고",               en: "CC/ISMS/KISA cert" } },
      utilities:   { ko: "SaaS·도구 구독",     en: "SaaS / Tools",      hint: { ko: "Linear·Notion·Datadog·Sentry",        en: "Linear/Notion/Datadog" } },
      rent:        { ko: "사무실·코워킹",      en: "Office / Cowork",   hint: { ko: "보안 등급 사무실 권장",               en: "Secure office recommended" } },
      other:       { ko: "법무·인증·기타",     en: "Legal / Cert",      hint: { ko: "변호사·세무사·정부 인증",             en: "Lawyer/CPA/govt cert" } },
      marketing:   { ko: "B2B 마케팅·전시",    en: "B2B / Events",      hint: { ko: "보안 컨퍼런스·LinkedIn·검색",          en: "Security events/LinkedIn" } },
    },
    defaults: { ingredients: 2_500_000, rent: 1_500_000, utilities: 1_500_000, sga: 2_500_000, marketing: 2_000_000, other: 1_500_000 },
  },
  "hardware-iot": {
    labels: {
      ingredients: { ko: "BOM·부품 매입",      en: "BOM / Parts",       hint: { ko: "PCB·센서·금형·시제품 부품",            en: "PCB/sensor/mold/parts" } },
      sga:         { ko: "EMS·시제품 외주",    en: "EMS / Prototype",   hint: { ko: "EMS 위탁·시제품 제작 외주",            en: "EMS/prototyping" } },
      utilities:   { ko: "SaaS·CAD 도구",      en: "SaaS / CAD",        hint: { ko: "AutoCAD·SolidWorks·Altium",           en: "AutoCAD/SolidWorks/Altium" } },
      rent:        { ko: "사무실·랩 공간",     en: "Office / Lab",      hint: { ko: "조립 공간·시험 공간 필요",             en: "Assembly/test space" } },
      other:       { ko: "인증·법무·기타",     en: "Cert / Legal",      hint: { ko: "KC·CE·FCC·전파인증·특허",              en: "KC/CE/FCC/patents" } },
      marketing:   { ko: "마케팅·전시",        en: "Marketing / Expo",  hint: { ko: "CES·MWC·전시회·B2B 영업",              en: "CES/MWC/B2B sales" } },
    },
    defaults: { ingredients: 12_000_000, rent: 2_000_000, utilities: 1_500_000, sga: 4_000_000, marketing: 2_000_000, other: 2_500_000 },
  },
  "robotics-physical-ai": {
    labels: {
      ingredients: { ko: "부품·센서·액추에이터",en: "Parts / Sensors",   hint: { ko: "라이다·모터·로봇 팔·컴퓨터",           en: "LiDAR/motors/arm/PC" } },
      sga:         { ko: "GPU·시뮬레이션",     en: "GPU / Simulation",  hint: { ko: "Isaac·Unity·GPU 클러스터 사용량",      en: "Isaac/Unity/GPU cluster" } },
      utilities:   { ko: "SaaS·연구 장비",     en: "SaaS / Equipment",  hint: { ko: "ROS·SolidWorks·MoCap·실험 장비",       en: "ROS/SolidWorks/MoCap" } },
      rent:        { ko: "랩·시험 공간",       en: "Lab / Test space",  hint: { ko: "로봇 시험 공간·천정 높이 필요",         en: "Lab with ceiling height" } },
      other:       { ko: "안전 인증·법무",     en: "Safety / Legal",    hint: { ko: "기능 안전·KC·특허·변호사",             en: "Functional safety/KC/IP" } },
      marketing:   { ko: "데모·전시",          en: "Demo / Expo",       hint: { ko: "AI Expo·로보월드·데모 영상",            en: "AI Expo/RoboWorld" } },
    },
    defaults: { ingredients: 25_000_000, rent: 3_500_000, utilities: 4_000_000, sga: 6_000_000, marketing: 2_000_000, other: 4_000_000 },
  },
  "semiconductor": {
    labels: {
      ingredients: { ko: "MPW·테이프아웃",     en: "MPW / Tape-out",    hint: { ko: "팹 MPW 1회당 수억 — 정부 매칭 권장",    en: "MPW per run + govt match" } },
      sga:         { ko: "EDA 라이센스",       en: "EDA License",       hint: { ko: "Cadence·Synopsys·Mentor 연간 라이센스", en: "Cadence/Synopsys/Mentor" } },
      utilities:   { ko: "SaaS·시뮬 장비",     en: "SaaS / Sim Tools",  hint: { ko: "EDA 시뮬·검증 도구·서버",              en: "Sim/verification servers" } },
      rent:        { ko: "사무실·검증 공간",   en: "Office / Verify",   hint: { ko: "검증 보드·계측기 공간 필요",            en: "Verification space" } },
      other:       { ko: "특허·법무·인증",     en: "IP / Legal",        hint: { ko: "특허 출원 연간 수십~수억 필수",         en: "Annual patent filings" } },
      marketing:   { ko: "고객사 영업",        en: "Customer Sales",    hint: { ko: "Tier1 OEM 영업·전시·논문",              en: "Tier1 OEM sales" } },
    },
    defaults: { ingredients: 50_000_000, rent: 4_000_000, utilities: 6_000_000, sga: 8_000_000, marketing: 2_000_000, other: 5_000_000 },
  },
  "biotech-medtech": {
    labels: {
      ingredients: { ko: "임상·전임상 비용",   en: "Clinical / Pre-clin",hint: { ko: "CRO·동물시험·전임상 외주",            en: "CRO/preclinical/animal" } },
      sga:         { ko: "IP·라이선스",        en: "IP / License",      hint: { ko: "특허 출원·in/out 라이선스·기술이전",    en: "Patents/license/transfer" } },
      utilities:   { ko: "연구 장비·시약",     en: "Lab / Reagent",     hint: { ko: "분석기·세포·시약·소모품 매월",          en: "Analyzers/cells/reagents" } },
      rent:        { ko: "GMP 연구실·사무실",  en: "GMP Lab / Office",  hint: { ko: "BSL·GMP 등급 시설 임대료",             en: "BSL/GMP-grade rent" } },
      other:       { ko: "식약처·인증·기타",   en: "MFDS / Cert",       hint: { ko: "식약처 신고·KGCP·외부 감사",            en: "MFDS/KGCP/audit" } },
      marketing:   { ko: "학회·임상 PR",       en: "Conference / PR",   hint: { ko: "학회 발표·논문·임상 결과 PR",           en: "Conference/papers" } },
    },
    defaults: { ingredients: 15_000_000, rent: 5_000_000, utilities: 8_000_000, sga: 8_000_000, marketing: 2_000_000, other: 6_000_000 },
  },
  "climate-energy": {
    labels: {
      ingredients: { ko: "측정 장비·시제품",   en: "Sensors / Prototype",hint: { ko: "탄소 측정·배터리·실증 장비",           en: "Carbon meters/batteries" } },
      sga:         { ko: "인증·실증사업",      en: "Cert / Pilot",      hint: { ko: "환경 인증·실증사업 매칭 자금",          en: "Env cert/pilot matching" } },
      utilities:   { ko: "SaaS·인프라",        en: "SaaS / Infra",      hint: { ko: "AWS·데이터 분석·SaaS 도구",            en: "AWS/data/SaaS" } },
      rent:        { ko: "사무실·랩",          en: "Office / Lab",      hint: { ko: "실증 공간·창고 임대",                  en: "Pilot space/warehouse" } },
      other:       { ko: "법무·R&D 매칭",      en: "Legal / R&D Match", hint: { ko: "정부 R&D 매칭 자기부담·법무",          en: "R&D self-match/legal" } },
      marketing:   { ko: "B2B 영업·정부 PR",   en: "B2B / Govt PR",     hint: { ko: "산업통상부·환경부 사업 PR",            en: "MOTIE/MoE PR" } },
    },
    defaults: { ingredients: 8_000_000, rent: 2_500_000, utilities: 2_500_000, sga: 5_000_000, marketing: 2_000_000, other: 4_000_000 },
  },

  // ─── 온라인·디지털 (basis=revenue) ───
  "smart-store": {
    labels: {
      ingredients: { ko: "매입 원가",          en: "Cost of goods",     hint: { ko: "상품 사입·도매 매입가",                en: "Wholesale buy-in" } },
      sga:         { ko: "결제·플랫폼 수수료", en: "Payment / Platform",hint: { ko: "네이버 3.63%+매출연동 2%·쿠팡 4~10.8%", en: "Naver 3.63%/Coupang 4-10.8%" } },
      utilities:   { ko: "포장·배송 자재",     en: "Packaging / Ship",  hint: { ko: "박스·완충재·송장·택배비",              en: "Box/cushion/shipping" } },
      rent:        { ko: "창고·풀필먼트",      en: "Warehouse / FBA",   hint: { ko: "재택 운영 시 0 — 풀필먼트는 입출고비",  en: "0 if home/FBA per pick" } },
      other:       { ko: "반품·CS·기타",       en: "Returns / CS",      hint: { ko: "반품 회수·CS 인건·소모품",             en: "Returns/CS/supplies" } },
      marketing:   { ko: "광고 (CPC·CPM)",     en: "Ads (CPC/CPM)",     hint: { ko: "네이버 검색광고·쿠팡 광고",            en: "Naver SA / Coupang ads" } },
    },
    defaults: { ingredients: 6_000_000, rent: 0, utilities: 800_000, sga: 1_200_000, marketing: 3_000_000, other: 600_000 },
  },
  "digital-products": {
    labels: {
      ingredients: { ko: "콘텐츠 제작비",      en: "Content production",hint: { ko: "외주 디자인·편집·전문가 검수",         en: "Design/edit/review" } },
      sga:         { ko: "플랫폼 수수료",      en: "Platform fees",     hint: { ko: "크몽 15~20%·인프런·노션 마켓 5%",       en: "Kmong/Inflearn/Notion mkt" } },
      utilities:   { ko: "호스팅·SaaS",        en: "Hosting / SaaS",    hint: { ko: "Webflow·Notion·Gumroad·Stripe",       en: "Webflow/Notion/Gumroad" } },
      rent:        { ko: "사무실·코워킹",      en: "Office / Cowork",   hint: { ko: "재택·카페 운영 시 0",                  en: "0 if home" } },
      other:       { ko: "결제 수수료·기타",   en: "Payment / Other",   hint: { ko: "Toss·Stripe 2.9% + 세무",              en: "Toss/Stripe + CPA" } },
      marketing:   { ko: "광고·인플루언서",    en: "Ads / Influencer",  hint: { ko: "Meta·검색·인플루언서 협업",            en: "Meta/search/influencer" } },
    },
    defaults: { ingredients: 500_000, rent: 0, utilities: 250_000, sga: 800_000, marketing: 1_500_000, other: 200_000 },
  },
  "creator-service": {
    labels: {
      ingredients: { ko: "장비 감가·소품",     en: "Equipment / Props", hint: { ko: "카메라·조명·마이크·소품 감가",          en: "Camera/lighting/props" } },
      sga:         { ko: "편집 외주·플랫폼",   en: "Editing / Platform",hint: { ko: "편집자 외주 + YouTube/Patreon 수수료", en: "Editor + YT/Patreon fee" } },
      utilities:   { ko: "호스팅·SaaS",        en: "Hosting / SaaS",    hint: { ko: "Adobe·Final Cut·Notion·OBS",          en: "Adobe/FCP/Notion" } },
      rent:        { ko: "스튜디오·공간",      en: "Studio / Space",    hint: { ko: "스튜디오 임대 또는 자택",              en: "Studio rent or home" } },
      other:       { ko: "저작권·기타",        en: "Rights / Other",    hint: { ko: "음원·폰트·이미지 라이선스",            en: "Music/font/image license" } },
      marketing:   { ko: "광고·콜라보",        en: "Ads / Collab",      hint: { ko: "썸네일 광고·크리에이터 콜라보",         en: "Thumb ads/collabs" } },
    },
    defaults: { ingredients: 700_000, rent: 0, utilities: 400_000, sga: 1_000_000, marketing: 1_000_000, other: 300_000 },
  },
  "consignment-commerce": {
    labels: {
      ingredients: { ko: "위탁 매입가",        en: "Consigned cost",    hint: { ko: "위탁 사입가·드롭쉽 단가",              en: "Wholesale/drop-ship cost" } },
      sga:         { ko: "결제·반품·CS",       en: "Payment / Returns", hint: { ko: "반품 회수비·CS·결제 수수료",            en: "Returns/CS/payment" } },
      utilities:   { ko: "포장·배송 자재",     en: "Packaging / Ship",  hint: { ko: "택배·국제배송·송장",                   en: "Shipping/intl/labels" } },
      rent:        { ko: "창고·물류",          en: "Warehouse",         hint: { ko: "재택은 0 — 자체 창고 시 입력",          en: "0 if home/own if storage" } },
      other:       { ko: "환율·관세·기타",     en: "FX / Tariff",       hint: { ko: "환차손·관세·통관·보관료",              en: "FX loss/tariff/storage" } },
      marketing:   { ko: "광고·플랫폼 수수료", en: "Ads / Platform",    hint: { ko: "검색광고·플랫폼 입점 수수료",           en: "SA/platform commission" } },
    },
    defaults: { ingredients: 8_000_000, rent: 200_000, utilities: 600_000, sga: 1_500_000, marketing: 2_000_000, other: 800_000 },
  },
  "newsletter-membership": {
    labels: {
      ingredients: { ko: "콘텐츠 제작비",      en: "Content production",hint: { ko: "리서치·기고·인터뷰·제작 외주",         en: "Research/contributor" } },
      sga:         { ko: "플랫폼·결제 수수료", en: "Platform / Payment",hint: { ko: "Stibee·Patreon 10% + Stripe 2.9%",     en: "Stibee/Patreon + Stripe" } },
      utilities:   { ko: "SaaS·호스팅",        en: "SaaS / Hosting",    hint: { ko: "Notion·Webflow·Beehiiv 정기",          en: "Notion/Webflow/Beehiiv" } },
      rent:        { ko: "사무실·코워킹",      en: "Office / Cowork",   hint: { ko: "재택·카페 운영 시 0",                  en: "0 if home" } },
      other:       { ko: "법무·기타",          en: "Legal / Other",     hint: { ko: "저작권·세무·기타",                     en: "Copyright/CPA" } },
      marketing:   { ko: "구독자 획득 광고",   en: "Subscriber Ads",    hint: { ko: "Meta·X·검색·뉴스레터 추천",            en: "Meta/X/search/refer" } },
    },
    defaults: { ingredients: 800_000, rent: 0, utilities: 300_000, sga: 700_000, marketing: 1_500_000, other: 200_000 },
  },
  "global-buying": {
    labels: {
      ingredients: { ko: "해외 매입가",        en: "Overseas buy-in",   hint: { ko: "해외 도매가 + 환율 변동",              en: "Overseas wholesale + FX" } },
      sga:         { ko: "해외 배송·관세",     en: "Intl Ship / Tariff",hint: { ko: "특송·관세·통관·환전 수수료",            en: "Express/tariff/FX fee" } },
      utilities:   { ko: "포장·통신",          en: "Packaging / Comm",  hint: { ko: "박스·송장·인터넷·전화",                en: "Box/labels/internet" } },
      rent:        { ko: "창고·물류",          en: "Warehouse",         hint: { ko: "재택·소형 창고",                       en: "Home/small storage" } },
      other:       { ko: "보험·기타",          en: "Insurance / Other", hint: { ko: "운송 보험·통관 사고·기타",              en: "Shipping insurance" } },
      marketing:   { ko: "광고·플랫폼 수수료", en: "Ads / Platform",    hint: { ko: "검색광고·플랫폼 등록 수수료",           en: "SA/platform fees" } },
    },
    defaults: { ingredients: 7_000_000, rent: 200_000, utilities: 600_000, sga: 2_500_000, marketing: 1_500_000, other: 600_000 },
  },

  // ─── 공간 (basis=revenue) ───
  "guesthouse": {
    labels: {
      ingredients: { ko: "어메니티·소모품",    en: "Amenity / Supplies",hint: { ko: "수건·세제·생수·티슈·일회용품",          en: "Towels/detergent/water" } },
      sga:         { ko: "OTA·청소 외주",      en: "OTA / Cleaning",    hint: { ko: "부킹닷컴 15%·에어비앤비 14% + 청소 외주",en: "Booking 15%/Airbnb 14%" } },
      utilities:   { ko: "전기·가스·수도·인터넷",en: "Utilities",         hint: { ko: "객실 전기·온수 가스·물·Wi-Fi",         en: "Elec/gas/water/Wi-Fi" } },
      other:       { ko: "보험·교체·기타",     en: "Insurance / Repair",hint: { ko: "화재 보험·침구·가전 교체",              en: "Fire ins/linen/appliance" } },
      marketing:   { ko: "광고·SNS",           en: "Ads / SNS",         hint: { ko: "OTA 노출 광고·인스타·블로그",           en: "OTA ads/Insta/blog" } },
    },
  },
};

export function FinancialReviewStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";

  // ── 1. StageInputs 구성: 이전 단계 결정값을 읽어서 모음 ──────────
  const stageInputs = useMemo<StageInputs>(() => {
    const categoryId = d.industryCategoryId || "food";

    // location-candidates → selectedDistrictId
    const locationDecision = (d.decisions as Record<string, { inputs?: { selectedPrimaryOptionId?: string; customPyeong?: number } }>)?.["location-candidates"];
    const selectedDistrictId = locationDecision?.inputs?.selectedPrimaryOptionId ?? null;
    const customPyeong = locationDecision?.inputs?.customPyeong;

    // franchise → royalty
    const franchiseId = d.selectedFranchiseBrandId as string | undefined;
    const franchise = franchiseId ? franchiseBrands.find((b) => b.id === franchiseId) : null;

    // loan → amount & rate
    const loanDecision = (d.decisions as Record<string, { inputs?: { loanAmountKrw?: number; annualRatePercent?: number } }>)?.["loan-guide"];

    // operations → delivery / POS
    const opsDecision = (d.decisions as Record<string, { inputs?: { deliveryPlatformIds?: string[]; posProviderId?: string } }>)?.["operations-setup"];

    // hiring plan — 사장이 HiringSetupStage 에서 직접 입력한 staffPlan 만 사용.
    //   미입력 시 undefined 전달 → monthly-cost-estimator 가 카테고리 평균치 + "industry-average" 라벨로 표시.
    //   (이전엔 항상 getDefaultStaffPlan 으로 채워서 "이전 단계 기반" 으로 잘못 표기되던 문제 수정)
    const hiringDecision = (d.decisions as Record<string, { inputs?: { staffPlan?: StaffPlan; hiringStatus?: string } }>)?.["hiring-setup"];
    const userStaffPlan: StaffPlan | undefined = (() => {
      const sp = hiringDecision?.inputs?.staffPlan;
      if (!sp) return undefined;
      // 채용 안 함 / 채용 계획 미수립 — 0명도 명시적 입력으로 인정
      const ft = Math.max(0, sp.fullTimeCount ?? 0);
      const pt = Math.max(0, sp.partTimeCount ?? 0);
      if (ft === 0 && pt === 0) {
        return { fullTimeCount: 0, partTimeCount: 0 };
      }
      return sp;
    })();

    // ingredients (식자재·매입 원가) — 사장이 vendor-setup 에서 직접 입력한 값.
    //   미입력 시 estimator 가 자동으로 "업종 평균" 라벨로 폴백 (이전엔 카테고리 default 매출 ×
    //   평균 원가율을 "이전 단계 기반" 으로 위장 — 2026-05-04 사용자 피드백 반영).
    const vendorDecision = (d.decisions as Record<
      string,
      { inputs?: { ingredientsMonthlyKrw?: number; ingredientsCogsRate?: number; ingredientsExpectedRevenueKrw?: number; ingredientsMode?: string } }
    >)?.["vendor-setup"];
    const ingMode = vendorDecision?.inputs?.ingredientsMode;
    const ingMonthly = ingMode === "monthly" ? vendorDecision?.inputs?.ingredientsMonthlyKrw : undefined;
    const ingCogsRate = ingMode === "rate" ? vendorDecision?.inputs?.ingredientsCogsRate : undefined;
    const ingExpectedRev = ingMode === "rate" ? vendorDecision?.inputs?.ingredientsExpectedRevenueKrw : undefined;

    return {
      categoryId,
      selectedDistrictId,
      customPyeong,
      // rate 모드는 사장 입력 매출 × 입력 원가율 → expectedMonthlyRevenueKrw 도 함께 전달
      expectedMonthlyRevenueKrw: ingExpectedRev != null && ingExpectedRev > 0 ? ingExpectedRev : undefined,
      ingredientsMonthlyKrw: ingMonthly != null && ingMonthly > 0 ? ingMonthly : undefined,
      ingredientsCogsRate: ingCogsRate != null && ingCogsRate > 0 ? ingCogsRate : undefined,
      staffPlan: userStaffPlan,
      operations: opsDecision?.inputs
        ? { deliveryPlatformIds: opsDecision.inputs.deliveryPlatformIds, posProviderId: opsDecision.inputs.posProviderId }
        : undefined,
      loan: loanDecision?.inputs?.loanAmountKrw
        ? { amountKrw: loanDecision.inputs.loanAmountKrw, annualRatePercent: loanDecision.inputs.annualRatePercent ?? 3.5 }
        : undefined,
      franchise: franchise?.monthlyRoyalty ? { monthlyRoyaltyKrw: franchise.monthlyRoyalty * 10_000 } : undefined,
    };
  }, [d.industryCategoryId, d.decisions, d.selectedFranchiseBrandId]);

  // ── 2. UserOverrides state (사용자 수정값) ──────────
  const [overrides, setOverrides] = useState<UserOverrides>({});
  const [confirmed, setConfirmed] = useState<Record<FieldKey, boolean>>({
    rent: false, labor: false, utilities: false,
    ingredients: false, sga: false,
    marketing: false, interest: false, other: false,
  });
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("fixed");

  // ── 3. 추정 실행 ──────────
  const estimate = useMemo(() => estimateMonthlyCosts(stageInputs, overrides), [stageInputs, overrides]);

  // ── 3b. Sub-industry 본문 라벨/기본값 (스타트업·온라인·기타 비전통 업종) ──
  const subId = d.selectedIndustryId;
  const subFieldsConfig = subId ? SUB_INDUSTRY_FIELDS[subId] : null;
  const fieldLabels = useMemo<typeof FIELD_LABELS>(() => {
    if (!subFieldsConfig?.labels) return FIELD_LABELS;
    return { ...FIELD_LABELS, ...subFieldsConfig.labels } as typeof FIELD_LABELS;
  }, [subFieldsConfig]);

  // Sub-industry default 적용: 사용자 미입력이고 stage-derived가 의미 없는 필드는
  // sub-industry 기본값으로 대체 (예: AI 앱의 "ingredients"는 AI API 사용량으로 재해석)
  const adjustedFields: MonthlyCostFields = useMemo(() => {
    if (!subFieldsConfig?.defaults) return estimate.fields;
    const out: MonthlyCostFields = { ...estimate.fields };
    for (const [k, v] of Object.entries(subFieldsConfig.defaults) as [FieldKey, number][]) {
      // 사용자가 직접 입력한 필드는 절대 건드리지 않음
      if (overrides[k] != null) continue;
      // labor는 staffPlan 기반이 더 정확하므로 sub default 미적용
      if (k === "labor") continue;
      out[k] = v;
    }
    return out;
  }, [estimate.fields, subFieldsConfig, overrides]);
  const adjustedSources: Record<FieldKey, CostSource> = useMemo(() => {
    if (!subFieldsConfig?.defaults) return estimate.sources;
    const out = { ...estimate.sources };
    for (const k of Object.keys(subFieldsConfig.defaults) as FieldKey[]) {
      if (overrides[k] != null) continue;
      if (k === "labor") continue;
      out[k] = "industry-average";
    }
    return out;
  }, [estimate.sources, subFieldsConfig, overrides]);

  // ── 4. 기존 결정값 복원 (재진입 시) ──────────
  useEffect(() => {
    const saved = (d.decisions as Record<string, { inputs?: { overrides?: UserOverrides; confirmed?: Record<FieldKey, boolean> } }>)?.["financial-review"];
    if (saved?.inputs?.overrides) setOverrides(saved.inputs.overrides);
    if (saved?.inputs?.confirmed) setConfirmed(saved.inputs.confirmed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 5. 재무 시뮬 실행 (모든 필드 확인 후) ──────────
  const allConfirmed = Object.values(confirmed).every(Boolean);
  const totalFixed = adjustedFields.rent + adjustedFields.labor + adjustedFields.utilities;
  const totalVariable = adjustedFields.ingredients + adjustedFields.sga;
  const totalOther = adjustedFields.marketing + adjustedFields.interest + adjustedFields.other;
  const totalMonthly = totalFixed + totalVariable + totalOther;

  // Capital from previous stage
  const capitalKrw = ((d.selectedBudget as number | undefined) ?? 0) + ((d.initialOperatingCapital as number | undefined) ?? 0);

  const simulation = useMemo(() => {
    if (!allConfirmed || capitalKrw <= 0) return null;
    try {
      return buildFinancialSimulation(
        {
          capital: capitalKrw,
          categoryId: stageInputs.categoryId,
          marketStyle: "balanced",
          rentBand: estimate.details.rent?.rentBand ?? "mid",
          monthlyRent: adjustedFields.rent,
          monthlyLaborCost: adjustedFields.labor,
          monthlyOtherFixed: adjustedFields.utilities + adjustedFields.marketing + adjustedFields.interest + adjustedFields.other,
          expectedMonthlyRevenue: stageInputs.expectedMonthlyRevenueKrw ?? 20_000_000,
        },
        null,
      );
    } catch { return null; }
  }, [allConfirmed, capitalKrw, estimate, stageInputs, adjustedFields]);

  // ── 6. 저장 + 다음 단계 ──────────
  const handleConfirm = () => {
    // financeStore monthlyCosts 동기화
    d.setMonthlyCosts?.({
      ingredients: adjustedFields.ingredients,
      labor: adjustedFields.labor,
      rent: adjustedFields.rent,
      utilities: adjustedFields.utilities,
      sga: adjustedFields.sga,
      marketing: adjustedFields.marketing,
      other: adjustedFields.other,
      interest: adjustedFields.interest,
    });
    d.handleVerificationContinue?.("financial-review", { overrides, confirmed });
  };

  // ── 7. 카테고리 진행률 ──────────
  const confirmedCount = Object.values(confirmed).filter(Boolean).length;
  const totalFields = Object.keys(confirmed).length;
  const progressPct = Math.round((confirmedCount / totalFields) * 100);

  const categoryProgress = (cat: CategoryKey) => {
    const fields = CATEGORY_FIELDS[cat];
    const done = fields.filter((f) => confirmed[f]).length;
    return { done, total: fields.length };
  };

  // ── RENDER ──
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "4px 0 28px" }}>

      {/* ── KEY ACTION 히어로 — 2026-05-19 compact ── */}
      <div style={{
        display: "flex", gap: "12px", alignItems: "flex-start",
        padding: "12px 14px", borderRadius: "14px",
        background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.92) 100%)`,
        color: "#fff",
        boxShadow: "0 4px 14px rgba(25,25,112,0.22)",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <ShieldCheck size={16} strokeWidth={2.2} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, opacity: 0.7, marginBottom: "2px" }}>
            {ko ? "이 단계에서 할 일" : "Do this"}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.015em", lineHeight: 1.35, marginBottom: "3px" }}>
            {ko ? "8개 비용 항목 확인 → Day 1부터 운영 대시보드 정확 가동" : "Confirm 8 cost fields → ops dashboard accurate from Day 1"}
          </div>
          <div style={{ fontSize: "12px", lineHeight: 1.45, opacity: 0.85 }}>
            {ko
              ? "이전 단계 임대료·인건비·수수료 자동 집계. 업종 평균과 비교해 검증."
              : "Rent, labor, fees auto-aggregated. Verify against benchmarks."}
          </div>
        </div>
      </div>

      {/* ⚠️ 2026-05-19 (사장님 신고: UI 가 큼직해서 스크롤 많음):
          Hero Header (h1 + 긴 body) 는 위 KEY ACTION 카드와 메시지 중복 → 제거.
          *Progress 만 inline 으로 컴팩트하게 유지*. */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "10px", padding: "10px 14px", borderRadius: "12px",
        background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.08)",
      }}>
        <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
          {ko ? "진행" : "Progress"}
        </span>
        <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "rgba(17,17,17,0.06)", overflow: "hidden", maxWidth: "200px" }}>
          <div style={{
            width: `${progressPct}%`, height: "100%",
            background: "#191970", transition: "width 0.35s cubic-bezier(0.22,1,0.36,1)",
          }} />
        </div>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
          {confirmedCount}/{totalFields}
        </span>
      </div>

      {/* Category Pills */}
      <div role="tablist" style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
        {(["fixed", "variable", "other"] as CategoryKey[]).map((cat) => {
          const { done, total } = categoryProgress(cat);
          const active = cat === activeCategory;
          const label = cat === "fixed" ? (ko ? "고정비" : "Fixed") : cat === "variable" ? (ko ? "변동비" : "Variable") : (ko ? "기타" : "Other");
          const catDone = done === total;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveCategory(cat)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "7px 14px", borderRadius: "999px",
                fontSize: "12.5px", fontWeight: 600, letterSpacing: "-0.005em",
                border: active ? "1px solid rgba(25,25,112,0.3)" : "1px solid var(--border)",
                background: active ? "rgba(25,25,112,0.05)" : "var(--surface)",
                color: active ? "#191970" : "var(--muted)",
                cursor: "pointer",
                transition: "background 0.18s ease, border-color 0.18s ease, color 0.18s ease",
                fontFamily: "inherit",
              }}
            >
              <span>{label}</span>
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                minWidth: "20px", height: "18px", padding: "0 6px",
                borderRadius: "10px",
                fontSize: "10.5px", fontWeight: 700, fontVariantNumeric: "tabular-nums",
                background: catDone ? "rgba(25,25,112,0.18)" : active ? "rgba(25,25,112,0.12)" : "rgba(17,17,17,0.06)",
                color: catDone ? "#fff" : active ? "#191970" : "var(--muted)",
              }}>
                {done}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Field Cards — 2026-05-19 compact: padding/fontSize/gap 모두 축소.
          한 줄 레이아웃 (라벨·금액·입력·확인) 으로 스크롤 감소. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {CATEGORY_FIELDS[activeCategory].map((fieldKey) => {
          const value = adjustedFields[fieldKey];
          const source = adjustedSources[fieldKey];
          const isConfirmed = confirmed[fieldKey];
          const fieldLabel = fieldLabels[fieldKey];
          const sourceMeta = SOURCE_LABEL[source];

          return (
            <article
              key={fieldKey}
              style={{
                padding: "12px 14px",
                borderRadius: "14px",
                background: "var(--surface-strong)",
                border: isConfirmed ? `1px solid rgba(25,25,112,0.35)` : "1px solid var(--border)",
                boxShadow: isConfirmed ? "0 1px 0 rgba(25,25,112,0.06) inset" : "0 1px 2px rgba(17,17,17,0.02)",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                display: "flex",
                flexDirection: "column" as const,
                gap: "8px",
              }}
            >
              {/* Row 1: 라벨 + hint + 확인 버튼 */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: "14px", fontWeight: 650, color: "var(--text)", letterSpacing: "-0.01em" }}>
                    {ko ? fieldLabel.ko : fieldLabel.en}
                  </span>
                  <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>
                    {ko ? fieldLabel.hint.ko : fieldLabel.hint.en}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmed((p) => ({ ...p, [fieldKey]: !p[fieldKey] }))}
                  aria-label={isConfirmed ? "unconfirm" : "confirm"}
                  style={{
                    flexShrink: 0,
                    width: "26px", height: "26px",
                    borderRadius: "50%",
                    border: isConfirmed ? "none" : "1px solid var(--border)",
                    background: isConfirmed ? MIDNIGHT : "transparent",
                    cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.18s ease, border-color 0.18s ease",
                  }}
                >
                  <Check size={14} strokeWidth={2.6} color={isConfirmed ? "#fff" : "rgba(17,17,17,0.25)"} />
                </button>
              </div>

              {/* Row 2: 금액 + 입력 (한 줄) */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "22px", fontWeight: 600, letterSpacing: "-0.025em", color: "var(--text)", fontVariantNumeric: "tabular-nums", lineHeight: 1.05, minWidth: "110px" }}>
                  {fmtWon(value)}
                </span>
                <div style={{ position: "relative", flex: 1, maxWidth: "180px" }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={ko ? "예: 30" : "e.g., 30"}
                    value={overrides[fieldKey] != null ? (overrides[fieldKey]! / 10_000).toString() : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9.]/g, "");
                      const manwon = raw ? Number(raw) : NaN;
                      setOverrides((p) => ({
                        ...p,
                        [fieldKey]: isNaN(manwon) ? undefined : Math.round(manwon * 10_000),
                      }));
                      setConfirmed((p) => ({ ...p, [fieldKey]: false }));
                    }}
                    style={{
                      width: "100%",
                      padding: "7px 40px 7px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      fontSize: "13px", fontWeight: 500, fontVariantNumeric: "tabular-nums",
                      color: "var(--text)",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                  <span style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    color: "var(--muted)",
                    pointerEvents: "none",
                  }}>
                    {ko ? "만원" : "K"}
                  </span>
                </div>
              </div>

              {/* Row 3: 출처 배지 (작게) */}
              <SourceBadge source={source} sourceMeta={sourceMeta} ko={ko} field={fieldKey} details={estimate.details} />
            </article>
          );
        })}
      </div>

      {/* Category Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
        <button
          type="button"
          onClick={() => {
            const order: CategoryKey[] = ["fixed", "variable", "other"];
            const idx = order.indexOf(activeCategory);
            if (idx > 0) setActiveCategory(order[idx - 1]);
          }}
          disabled={activeCategory === "fixed"}
          style={{
            padding: "8px 14px", borderRadius: "10px",
            border: "1px solid var(--border)", background: "var(--surface)",
            fontSize: "12.5px", fontWeight: 600, color: "var(--muted)",
            cursor: activeCategory === "fixed" ? "not-allowed" : "pointer",
            opacity: activeCategory === "fixed" ? 0.4 : 1,
            transition: "opacity 0.15s ease",
            fontFamily: "inherit",
          }}
        >
          ← {ko ? "이전" : "Previous"}
        </button>
        <button
          type="button"
          onClick={() => {
            const order: CategoryKey[] = ["fixed", "variable", "other"];
            const idx = order.indexOf(activeCategory);
            if (idx < order.length - 1) setActiveCategory(order[idx + 1]);
          }}
          disabled={activeCategory === "other"}
          style={{
            padding: "8px 14px", borderRadius: "10px",
            border: "1px solid rgba(25,25,112,0.25)",
            background: activeCategory === "other" ? "var(--surface)" : "rgba(25,25,112,0.05)",
            fontSize: "12.5px", fontWeight: 650,
            color: activeCategory === "other" ? "var(--muted)" : "#191970",
            cursor: activeCategory === "other" ? "not-allowed" : "pointer",
            opacity: activeCategory === "other" ? 0.4 : 1,
            fontFamily: "inherit",
          }}
        >
          {ko
            ? (activeCategory === "fixed" ? "변동비" : "기타")
            : (activeCategory === "fixed" ? "Variable" : "Other")}
          {" "}→
        </button>
      </div>

      {/* ─── Sub-industry 월 운영비 벤치마크 ─── */}
      {(() => {
        const subId = d.selectedIndustryId;
        const catId = d.industryCategoryId || "food";
        const benchmark: CostBenchmark = (subId && SUB_INDUSTRY_BENCHMARKS[subId]) || CATEGORY_FALLBACK_BENCHMARKS[catId] || CATEGORY_FALLBACK_BENCHMARKS["food"];
        const isSubLevel = !!(subId && SUB_INDUSTRY_BENCHMARKS[subId]);
        const isBurnBasis = benchmark.basis === "burn";
        const expectedRevenue = stageInputs.expectedMonthlyRevenueKrw ?? 20_000_000;
        // burn 모드: typicalMonthlyKrw 중간값을 기준점으로 사용 (매출 대신 월 번레이트)
        const typicalKrwMid = benchmark.typicalMonthlyKrw
          ? (benchmark.typicalMonthlyKrw[0] + benchmark.typicalMonthlyKrw[1]) / 2
          : 0;
        const referenceAmt = isBurnBasis && typicalKrwMid > 0 ? typicalKrwMid : expectedRevenue;
        const isFranchise = d.startupType === "franchise";
        const franchiseId = d.selectedFranchiseBrandId as string | undefined;
        const franchise = franchiseId ? franchiseBrands.find((b) => b.id === franchiseId) : null;

        // 업종에 맞는 라벨 가져오기 (영문)
        const subOption = subId ? starterIndustryOptions.find((o) => o.id === subId) : null;
        const subTitleEn = subOption?.title || subId || "";

        type BenchKey = keyof Omit<CostBenchmark, "notes" | "margin" | "basis" | "typicalMonthlyKrw">;
        // 카테고리 라벨: 일반 업종(매출 기준) vs 스타트업·테크(번레이트 기준)
        const rows: { key: BenchKey; label: { ko: string; en: string }; range: [number, number] }[] = isBurnBasis ? [
          { key: "ingredients", label: { ko: "인프라·SaaS·API",  en: "Infra/SaaS" }, range: benchmark.ingredients },
          { key: "labor",       label: { ko: "인건비",            en: "Labor" },      range: benchmark.labor },
          { key: "rent",        label: { ko: "사무실·코워킹",     en: "Office/Cowork"}, range: benchmark.rent },
          { key: "utilities",   label: { ko: "통신·기기",         en: "Telecom/Devices" }, range: benchmark.utilities },
          { key: "sga",         label: { ko: "결제·회계·법무",    en: "Payments/Legal" }, range: benchmark.sga },
          { key: "marketing",   label: { ko: "마케팅·광고",        en: "Marketing" },  range: benchmark.marketing },
          { key: "other",       label: { ko: "기타 (IP·인증)",     en: "Other (IP/cert)" }, range: benchmark.other },
        ] : [
          { key: "ingredients", label: { ko: "원재료·식자재",   en: "Materials" }, range: benchmark.ingredients },
          { key: "labor",       label: { ko: "인건비",          en: "Labor" },     range: benchmark.labor },
          { key: "rent",        label: { ko: "임대료",          en: "Rent" },      range: benchmark.rent },
          { key: "utilities",   label: { ko: "공과금",          en: "Utilities" }, range: benchmark.utilities },
          { key: "sga",         label: { ko: "운영 수수료",     en: "Ops fees" },  range: benchmark.sga },
          { key: "marketing",   label: { ko: "마케팅",          en: "Marketing" }, range: benchmark.marketing },
          { key: "other",       label: { ko: "기타",            en: "Other" },     range: benchmark.other },
        ];
        const totalLow  = rows.reduce((a, r) => a + r.range[0], 0);
        const totalHigh = rows.reduce((a, r) => a + r.range[1], 0);

        return (
          <article style={{
            padding: "22px 24px",
            borderRadius: "20px",
            background: "var(--surface-strong)",
            border: `1px solid rgba(25,25,112,0.12)`,
            boxShadow: "0 1px 2px rgba(17,17,17,0.02)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" as const }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "rgba(25,25,112,0.1)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                <TrendingUp size={16} strokeWidth={2} color={MIDNIGHT} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: MIDNIGHT, opacity: 0.8 }}>
                  {ko ? "내 업종 월 비용 벤치마크" : "Industry Cost Benchmark"}
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)", marginTop: "2px" }}>
                  {isSubLevel
                    ? (ko ? `${subTitleEn} 평균` : `${subTitleEn} avg`)
                    : (ko ? `${catId} 카테고리 평균` : `${catId} category avg`)}
                </div>
                {benchmark.typicalMonthlyKrw && (
                  <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.5)", marginTop: "3px", letterSpacing: "-0.01em" }}>
                    {ko
                      ? `초기 단계 월 ${isBurnBasis ? "번레이트" : "운영비"} 약 ${fmtWon(benchmark.typicalMonthlyKrw[0])} ~ ${fmtWon(benchmark.typicalMonthlyKrw[1])}`
                      : `Typical ${isBurnBasis ? "burn" : "opex"} ${fmtWon(benchmark.typicalMonthlyKrw[0])} – ${fmtWon(benchmark.typicalMonthlyKrw[1])}/mo`}
                  </div>
                )}
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", background: MIDNIGHT, padding: "3px 10px", borderRadius: "999px", boxShadow: "0 1px 3px rgba(25,25,112,0.25)" }}>
                {ko
                  ? `${isBurnBasis ? "월 번레이트" : "매출액"} 대비 ${totalLow}~${totalHigh}%`
                  : `${totalLow}-${totalHigh}% of ${isBurnBasis ? "burn" : "revenue"}`}
              </span>
            </div>

            {benchmark.notes && (
              <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.6)", lineHeight: 1.55, marginBottom: "14px" }}>
                {benchmark.notes}
              </div>
            )}

            {/* 벤치마크 테이블 */}
            <div style={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", background: "white" }}>
              {rows.map((row, i) => {
                const expectedAmt = (referenceAmt * (row.range[0] + row.range[1]) / 2) / 100;
                const userAmt = adjustedFields[row.key];
                const userPct = referenceAmt > 0 ? (userAmt / referenceAmt) * 100 : 0;
                const inRange = userPct >= row.range[0] && userPct <= row.range[1];
                const above = userPct > row.range[1];
                const below = userPct < row.range[0];
                return (
                  <div key={row.key} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "11px 14px",
                    borderTop: i > 0 ? "0.5px solid rgba(0,0,0,0.06)" : "none",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
                        {ko ? row.label.ko : row.label.en}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.5)", marginTop: "1px" }}>
                        {row.range[0]}~{row.range[1]}% · ≈ {fmtWon(expectedAmt)}
                      </div>
                    </div>
                    {userAmt > 0 && (
                      <span style={{
                        fontSize: "11px", fontWeight: 700,
                        padding: "3px 9px", borderRadius: "999px",
                        background: inRange ? "rgba(34,167,73,0.1)" : above ? "rgba(220,38,38,0.1)" : "rgba(255,159,10,0.12)",
                        color: inRange ? "rgb(34,167,73)" : above ? "#dc2626" : "rgb(184,100,0)",
                        whiteSpace: "nowrap" as const,
                      }}>
                        {ko
                          ? (inRange ? `✓ 적정 (${userPct.toFixed(1)}%)` : above ? `↑ 초과 (${userPct.toFixed(1)}%)` : `↓ 낮음 (${userPct.toFixed(1)}%)`)
                          : (inRange ? `✓ ${userPct.toFixed(1)}%` : above ? `↑ ${userPct.toFixed(1)}%` : `↓ ${userPct.toFixed(1)}%`)}
                      </span>
                    )}
                  </div>
                );
              })}
              {/* 영업이익률 */}
              <div style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "11px 14px",
                borderTop: "0.5px solid rgba(0,0,0,0.06)",
                background: "rgba(25,25,112,0.04)",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "-0.01em" }}>
                    {ko
                      ? (isBurnBasis ? "목표 Gross margin (PMF 후)" : "영업이익률 (참고)")
                      : (isBurnBasis ? "Target gross margin (post-PMF)" : "Operating margin (ref)")}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.5)", marginTop: "1px" }}>
                    {benchmark.margin[0]}~{benchmark.margin[1]}% · {ko
                      ? (isBurnBasis ? "매출 발생 후 도달 목표 — 그 전까진 런웨이로 평가" : "이 범위 안 들면 비용 구조 재점검")
                      : (isBurnBasis ? "post-revenue target — judge by runway until then" : "outside = review structure")}
                  </div>
                </div>
              </div>
            </div>

            {/* 프랜차이즈 추가 비용 */}
            {isFranchise && franchise && (
              <div style={{
                marginTop: "12px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "rgba(25,25,112,0.06)",
                border: "1px solid rgba(25,25,112,0.14)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "6px" }}>
                  <Building2 size={13} strokeWidth={2.2} />
                  {ko ? `${franchise.name.ko} 프랜차이즈 추가 비용` : `${franchise.name.en} franchise extras`}
                </div>
                <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {franchise.monthlyRoyalty && (
                    <li style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.65)", lineHeight: 1.55 }}>
                      {ko
                        ? `본사 로열티: 월 ${franchise.monthlyRoyalty}만원 (정액) — 매출 ${expectedRevenue > 0 ? ((franchise.monthlyRoyalty * 10_000 / expectedRevenue) * 100).toFixed(1) : "?"}%`
                        : `HQ royalty: ${franchise.monthlyRoyalty}M KRW/mo (fixed)`}
                    </li>
                  )}
                  <li style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.65)", lineHeight: 1.55 }}>
                    {ko
                      ? "광고 분담금: 매출의 1~3% (본사 정책별 상이) — 정보공개서 확인"
                      : "Ad cost-share: 1-3% of sales (varies)"}
                  </li>
                  <li style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.65)", lineHeight: 1.55 }}>
                    {ko
                      ? "본사 식자재 의무 매입 (차액가맹금): 시중 도매가 대비 마진 포함 — 사장님 부담 ↑"
                      : "Mandatory HQ supply (markup) included in food cost"}
                  </li>
                  <li style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.65)", lineHeight: 1.55 }}>
                    {ko
                      ? "본사 표준 컵·박스·유니폼 의무 매입 (브랜드 자산)"
                      : "HQ-supplied cups/boxes/uniforms (brand assets)"}
                  </li>
                </ul>
              </div>
            )}
          </article>
        );
      })()}

      {/* Summary Card */}
      <article style={summaryCard}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "10px",
            background: "rgba(25,25,112,0.1)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={16} strokeWidth={2} color="#191970" />
          </div>
          <div>
            <div style={{ fontSize: "10.5px", fontWeight: 650, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
              {ko ? "월 운영비 총합" : "Total Monthly Cost"}
            </div>
            <div style={{ fontSize: "clamp(36px, 5vw, 48px)", fontWeight: 600, letterSpacing: "-0.04em", color: "var(--text)", fontVariantNumeric: "tabular-nums", lineHeight: 1.05, marginTop: "2px" }}>
              {fmtWon(totalMonthly)}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "20px" }}>
          <SummaryItem label={ko ? "고정비" : "Fixed"} value={fmtWon(totalFixed)} />
          <SummaryItem label={ko ? "변동비" : "Variable"} value={fmtWon(totalVariable)} />
          <SummaryItem label={ko ? "기타" : "Other"} value={fmtWon(totalOther)} />
        </div>

        {simulation && (
          <div style={{
            marginTop: "22px", padding: "18px 20px",
            borderRadius: "16px",
            background: "rgba(25,25,112,0.04)",
            border: "1px solid rgba(25,25,112,0.12)",
          }}>
            <div style={{ fontSize: "10.5px", fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#191970", marginBottom: "12px" }}>
              {ko ? "자동 재무 시뮬" : "Financial Simulation"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <div style={{ fontSize: "11.5px", color: "var(--muted)", marginBottom: "4px" }}>
                  {ko ? "버틸 수 있는 기간" : "Survival period"}
                </div>
                <div style={{ fontSize: "22px", fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.025em" }}>
                  {typeof simulation.survivabilityMonths === "number"
                    ? `${simulation.survivabilityMonths.toFixed(1)}${ko ? "개월" : "mo"}`
                    : "—"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11.5px", color: "var(--muted)", marginBottom: "4px" }}>
                  {ko ? "손익분기 시점" : "Break-even"}
                </div>
                <div style={{ fontSize: "22px", fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.025em" }}>
                  {typeof simulation.breakEven?.estimatedBreakEvenMonth === "number"
                    ? `${simulation.breakEven.estimatedBreakEvenMonth.toFixed(1)}${ko ? "개월" : "mo"}`
                    : (ko ? "미달" : "N/A")}
                </div>
              </div>
            </div>
          </div>
        )}

        {!allConfirmed && (
          <div style={{
            marginTop: "18px", padding: "12px 14px",
            borderRadius: "12px",
            background: "rgba(255,159,10,0.06)",
            border: "1px solid rgba(255,159,10,0.18)",
            display: "flex", gap: "8px", alignItems: "flex-start",
          }}>
            <Info size={14} strokeWidth={2} color="#ff9f0a" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "12.5px", color: "var(--text)", lineHeight: 1.5 }}>
              {ko
                ? `남은 ${totalFields - confirmedCount}개 항목을 확인하면 재무 시뮬이 자동 실행됩니다.`
                : `Confirm ${totalFields - confirmedCount} more fields to run the full simulation.`}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!allConfirmed}
          style={{
            marginTop: "20px", width: "100%",
            padding: "14px",
            borderRadius: "14px", border: "none",
            background: allConfirmed ? "#1d3557" : "rgba(17,17,17,0.08)",
            color: allConfirmed ? "#fff" : "var(--muted)",
            fontSize: "14px", fontWeight: 650, letterSpacing: "-0.005em",
            cursor: allConfirmed ? "pointer" : "not-allowed",
            transition: "background 0.15s ease",
          }}
        >
          {allConfirmed
            ? (ko ? "저장하고 다음 단계로 →" : "Save and continue →")
            : (ko ? `${totalFields - confirmedCount}개 항목을 더 확인하세요` : `Confirm ${totalFields - confirmedCount} more items`)}
        </button>
      </article>

      {/* ⚠️ 2026-05-18 (사장님 신고: "월 운영비 단계에 왜 운영 진단 콘텐츠가 있냐"):
          이 자리에 있던 *2026 한국 SMB 운영 벤치마크 표* + *매출 부진 회복 플레이북*
          (4 시나리오 × 4 액션, 정부 지원 4종 안내) 은 *오픈 후 운영 중* 사장님 콘텐츠.
          financial-review 는 *오픈 전 월 운영비 검토* 단계라 부적합 → 제거.
          ㄴ 동일 콘텐츠는 FirstMonthCheckStage / OperationalDashboard / BenchmarkCard
            가 이미 cover (오픈 후 적절한 시점). 중복 제거 효과도. */}

      {/* 벤치마크 표 (제거됨) */}
      {false && (
        // 코드는 git history 보존용으로 false 가드. 향후 첫달 점검에서 재사용 가능.
        <article style={{ display: "none" }} />
      )}
      {/* 매출 부진 회복 플레이북 (제거됨) — FirstMonthCheckStage / OperationalDashboard 참조 */}

      <StageWrapup
        ko={ko}
        nextStageLabelKo="개업·론칭"
        doneItemsKo={[
          { label: "1. 고정비 점검", detail: "임대료·인건비·공과금 3축 — 매출 대비 비율로 업종 평균 비교" },
          { label: "2. 변동비 점검", detail: "재료비·일반관리비 2축 — 매출 30% 이내 유지 룰 점검" },
          { label: "3. 기타비 점검", detail: "마케팅·이자·기타 3축 — 광고 ROAS·대출 이자 한계점 검토" },
          { label: "4. 손익분기·런웨이", detail: "월별 BEP 시뮬 + 보유 자본 잔여 개월 자동 계산" },
        ]}
        verifyItemsKo={[
          "고정비 합계 — 매출 70% 미만 유지, 초과 시 변동비 압박으로 흑자 도달 어려움",
          "재료비 — 매출 30% 한계, 35% 초과 시 메뉴·공급처 즉시 재검토 (1순위 적자 원인)",
          "인건비 — 25% 한계, 5인 이상 사업장은 연장수당·연차수당 별도 누적, 누락 시 차액·가산금",
          "운영자본 6개월 — 매출 0원 가정해도 견딜 자본 별도 유지 (흑자부도 1순위 원인)",
          "이자 부담 — 정책자금·일반대출 이자 합산 매출 5% 이내, 초과 시 신규 대출 자제",
          "마케팅 ROAS — 200% 미만이면 즉시 중단·재구성, 「쓸수록 손해」 패턴 인식",
        ]}
        nextSummaryKo="고정·변동·기타 비용 시뮬 + BEP 확인 → 개업·론칭 단계로 진입"
      />
    </section>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function SourceBadge({
  source, sourceMeta, ko, field, details,
}: {
  source: CostSource;
  sourceMeta: (typeof SOURCE_LABEL)[CostSource];
  ko: boolean;
  field: FieldKey;
  details: ReturnType<typeof estimateMonthlyCosts>["details"];
}) {
  const color = sourceMeta.tone === "accent" ? "#191970" : sourceMeta.tone === "warn" ? "#ff9f0a" : "var(--muted)";
  const bg = sourceMeta.tone === "accent" ? "rgba(25,25,112,0.08)" : sourceMeta.tone === "warn" ? "rgba(255,159,10,0.08)" : "rgba(17,17,17,0.05)";

  // 상세 hint 제공
  let detailHint: string | null = null;
  if (field === "rent" && details.rent) {
    detailHint = ko
      ? `${details.rent.districtLabel} · ${details.rent.pyeong}평 × ${fmtWon(details.rent.ratePerPyeongKrw)}/평`
      : `${details.rent.districtLabel} · ${details.rent.pyeong}py × ${fmtWon(details.rent.ratePerPyeongKrw)}/py`;
  } else if (field === "labor" && details.labor.total > 0) {
    detailHint = ko
      ? `정직원 ${fmtWon(details.labor.fullTimeCost)} + 알바 ${fmtWon(details.labor.partTimeCost)}`
      : `FT ${fmtWon(details.labor.fullTimeCost)} + PT ${fmtWon(details.labor.partTimeCost)}`;
  } else if (field === "sga" && details.sga.breakdown.length > 0) {
    detailHint = details.sga.breakdown.map((b) => `${b.label} ${fmtWon(b.amount)}`).slice(0, 2).join(" · ");
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" as const, marginTop: "2px" }}>
      <span style={{
        fontSize: "10.5px", fontWeight: 650, letterSpacing: "0.04em",
        padding: "3px 9px", borderRadius: "999px",
        background: bg, color,
      }}>
        {ko ? sourceMeta.ko : sourceMeta.en}
      </span>
      {detailHint && (
        <span style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.45 }}>
          {detailHint}
        </span>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: "12px", background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: "10.5px", fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
        {label}
      </div>
      <div style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text)", fontVariantNumeric: "tabular-nums", marginTop: "4px" }}>
        {value}
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────

const eyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 650,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: "10px",
};

const heroTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 3.5vw, 34px)",
  fontWeight: 700,
  letterSpacing: "-0.035em",
  lineHeight: 1.15,
  color: "var(--text)",
};

const heroBody: React.CSSProperties = {
  margin: "10px 0 0",
  maxWidth: "64ch",
  fontSize: "14.5px",
  lineHeight: 1.6,
  color: "var(--muted)",
  letterSpacing: "-0.005em",
};

const summaryCard: React.CSSProperties = {
  borderRadius: "24px",
  padding: "28px",
  background: "var(--surface-strong)",
  border: "1px solid var(--border)",
  boxShadow: "0 1px 2px rgba(17,17,17,0.02), 0 4px 16px rgba(17,17,17,0.03)",
};

// lucide 아이콘 미사용 타입 경고 해소 (TrendingUp/Down은 향후 delta 표기에 사용 예정)
void TrendingUp; void TrendingDown;
// 2026-05-19 compact 리디자인 후 unused 가 된 상수들 — 향후 hero 재사용 시 보존
void eyebrow; void heroTitle; void heroBody;
