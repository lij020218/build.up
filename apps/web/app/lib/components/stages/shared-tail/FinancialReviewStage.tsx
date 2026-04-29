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
  getDefaultStaffPlan,
  seoulMarketDistricts,
  starterIndustryOptions,
  localizeRecommendationItem,
  franchiseBrands,
} from "@build-up/shared";
import { useDashboardCtx } from "../../../contexts/DashboardContext";

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
  ingredients: [number, number];  // 원재료/식자재
  labor: [number, number];        // 인건비
  rent: [number, number];         // 임대료
  utilities: [number, number];    // 공과금
  sga: [number, number];          // 운영 수수료 (배달·POS·카드)
  marketing: [number, number];    // 마케팅
  other: [number, number];        // 기타
  margin: [number, number];       // 영업이익률
  notes?: string;                 // 핵심 특징
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

    // hiring plan (업종별 기본값, 추후 hiring-setup 단계에서 override 가능)
    const staffPlan = getDefaultStaffPlan(categoryId);

    return {
      categoryId,
      selectedDistrictId,
      customPyeong,
      expectedMonthlyRevenueKrw: undefined, // 사용자가 직접 입력 or 업종 평균
      staffPlan,
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

  // ── 4. 기존 결정값 복원 (재진입 시) ──────────
  useEffect(() => {
    const saved = (d.decisions as Record<string, { inputs?: { overrides?: UserOverrides; confirmed?: Record<FieldKey, boolean> } }>)?.["financial-review"];
    if (saved?.inputs?.overrides) setOverrides(saved.inputs.overrides);
    if (saved?.inputs?.confirmed) setConfirmed(saved.inputs.confirmed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 5. 재무 시뮬 실행 (모든 필드 확인 후) ──────────
  const allConfirmed = Object.values(confirmed).every(Boolean);
  const totalFixed = estimate.fields.rent + estimate.fields.labor + estimate.fields.utilities;
  const totalVariable = estimate.fields.ingredients + estimate.fields.sga;
  const totalOther = estimate.fields.marketing + estimate.fields.interest + estimate.fields.other;
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
          monthlyRent: estimate.fields.rent,
          monthlyLaborCost: estimate.fields.labor,
          monthlyOtherFixed: estimate.fields.utilities + estimate.fields.marketing + estimate.fields.interest + estimate.fields.other,
          expectedMonthlyRevenue: stageInputs.expectedMonthlyRevenueKrw ?? 20_000_000,
        },
        null,
      );
    } catch { return null; }
  }, [allConfirmed, capitalKrw, estimate, stageInputs]);

  // ── 6. 저장 + 다음 단계 ──────────
  const handleConfirm = () => {
    // financeStore monthlyCosts 동기화
    d.setMonthlyCosts?.({
      ingredients: estimate.fields.ingredients,
      labor: estimate.fields.labor,
      rent: estimate.fields.rent,
      utilities: estimate.fields.utilities,
      sga: estimate.fields.sga,
      marketing: estimate.fields.marketing,
      other: estimate.fields.other,
      interest: estimate.fields.interest,
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
    <section style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "4px 0 40px" }}>

      {/* ── KEY ACTION 히어로 카드 (다른 단계와 통일) ── */}
      <div style={{
        display: "flex", gap: "14px", alignItems: "flex-start",
        padding: "16px 18px", borderRadius: "16px",
        background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.92) 100%)`,
        color: "#fff",
        boxShadow: "0 6px 20px rgba(25,25,112,0.28)",
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <ShieldCheck size={20} strokeWidth={2.2} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, opacity: 0.7, marginBottom: "4px" }}>
            {ko ? "이 단계에서 꼭 할 일" : "Do this in this stage"}
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.4, marginBottom: "5px" }}>
            {ko ? "8개 비용 항목 확인·조정 → 운영 대시보드 Day 1 부터 정확 가동" : "Confirm 8 cost fields → ops dashboard works from Day 1"}
          </div>
          <div style={{ fontSize: "13.5px", lineHeight: 1.55, opacity: 0.92 }}>
            {ko
              ? "이전 단계의 임대료·인건비·수수료가 자동 집계됐어요. 업종 평균과 비교하면서 항목별로 검증하세요."
              : "Rent, labor, fees auto-aggregated from earlier stages. Verify each against industry benchmarks."}
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <header>
        <div style={eyebrow}>
          {ko ? "월 운영비" : "Monthly Operating Costs"}
        </div>
        <h1 style={heroTitle}>
          {ko ? "이전 단계 입력을 바탕으로 자동 집계했어요" : "Auto-aggregated from your earlier inputs"}
        </h1>
        <p style={heroBody}>
          {ko
            ? "임대료 · 인건비 · 수수료 · 이자 등 8개 항목을 확인·수정하세요. 오픈 Day 1부터 운영 대시보드가 정확한 비용 구조로 작동합니다."
            : "Review and adjust eight cost fields. Your operational dashboard will work with accurate numbers from Day 1."}
        </p>

        {/* Progress */}
        <div style={{ marginTop: "24px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
              {ko ? "진행" : "Progress"}
            </span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
              {confirmedCount}/{totalFields} <span style={{ color: "var(--muted)", fontWeight: 500 }}>· {progressPct}%</span>
            </span>
          </div>
          <div style={{ height: "4px", borderRadius: "2px", background: "rgba(17,17,17,0.06)", overflow: "hidden" }}>
            <div style={{
              width: `${progressPct}%`, height: "100%",
              background: "#191970", transition: "width 0.35s cubic-bezier(0.22,1,0.36,1)",
            }} />
          </div>
        </div>
      </header>

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
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "10px 18px", borderRadius: "999px",
                fontSize: "13px", fontWeight: 600, letterSpacing: "-0.005em",
                border: active ? "1px solid rgba(25,25,112,0.3)" : "1px solid var(--border)",
                background: active ? "rgba(25,25,112,0.05)" : "var(--surface)",
                color: active ? "#191970" : "var(--muted)",
                cursor: "pointer",
                transition: "background 0.18s ease, border-color 0.18s ease, color 0.18s ease",
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

      {/* Field Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {CATEGORY_FIELDS[activeCategory].map((fieldKey) => {
          const value = estimate.fields[fieldKey];
          const source = estimate.sources[fieldKey];
          const isConfirmed = confirmed[fieldKey];
          const fieldLabel = FIELD_LABELS[fieldKey];
          const sourceMeta = SOURCE_LABEL[source];

          return (
            <article
              key={fieldKey}
              style={{
                padding: "22px 24px",
                borderRadius: "20px",
                background: "var(--surface-strong)",
                border: isConfirmed ? `1px solid rgba(25,25,112,0.35)` : "1px solid var(--border)",
                boxShadow: isConfirmed ? "0 1px 0 rgba(25,25,112,0.06) inset" : "0 1px 2px rgba(17,17,17,0.02)",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 650, color: "var(--text)", letterSpacing: "-0.015em" }}>
                      {ko ? fieldLabel.ko : fieldLabel.en}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                      · {ko ? fieldLabel.hint.ko : fieldLabel.hint.en}
                    </span>
                  </div>
                  <SourceBadge source={source} sourceMeta={sourceMeta} ko={ko} field={fieldKey} details={estimate.details} />
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmed((p) => ({ ...p, [fieldKey]: !p[fieldKey] }))}
                  aria-label={isConfirmed ? "unconfirm" : "confirm"}
                  style={{
                    flexShrink: 0,
                    width: "36px", height: "36px",
                    borderRadius: "50%",
                    border: isConfirmed ? "none" : "1px solid var(--border)",
                    background: isConfirmed ? MIDNIGHT : "transparent",
                    cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.18s ease, border-color 0.18s ease",
                  }}
                >
                  <Check size={18} strokeWidth={2.5} color={isConfirmed ? "#fff" : "rgba(17,17,17,0.25)"} />
                </button>
              </div>

              {/* Amount input row */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginTop: "14px" }}>
                <span style={{ fontSize: "clamp(32px, 4.5vw, 40px)", fontWeight: 600, letterSpacing: "-0.04em", color: "var(--text)", fontVariantNumeric: "tabular-nums", lineHeight: 1.05 }}>
                  {fmtWon(value)}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={ko ? "수정 (원)" : "Edit (KRW)"}
                  value={overrides[fieldKey] ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setOverrides((p) => ({ ...p, [fieldKey]: raw ? Number(raw) : undefined }));
                    setConfirmed((p) => ({ ...p, [fieldKey]: false }));
                  }}
                  style={{
                    flex: 1, maxWidth: "200px",
                    padding: "9px 14px",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    fontSize: "14px", fontWeight: 500, fontVariantNumeric: "tabular-nums",
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
              </div>
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
            padding: "11px 20px", borderRadius: "12px",
            border: "1px solid var(--border)", background: "var(--surface)",
            fontSize: "13px", fontWeight: 600, color: "var(--muted)",
            cursor: activeCategory === "fixed" ? "not-allowed" : "pointer",
            opacity: activeCategory === "fixed" ? 0.4 : 1,
            transition: "opacity 0.15s ease",
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
            padding: "11px 20px", borderRadius: "12px",
            border: "1px solid rgba(25,25,112,0.25)",
            background: activeCategory === "other" ? "var(--surface)" : "rgba(25,25,112,0.05)",
            fontSize: "13px", fontWeight: 650,
            color: activeCategory === "other" ? "var(--muted)" : "#191970",
            cursor: activeCategory === "other" ? "not-allowed" : "pointer",
            opacity: activeCategory === "other" ? 0.4 : 1,
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
        const benchmark = (subId && SUB_INDUSTRY_BENCHMARKS[subId]) || CATEGORY_FALLBACK_BENCHMARKS[catId] || CATEGORY_FALLBACK_BENCHMARKS["food"];
        const isSubLevel = !!(subId && SUB_INDUSTRY_BENCHMARKS[subId]);
        const expectedRevenue = stageInputs.expectedMonthlyRevenueKrw ?? 20_000_000;
        const isFranchise = d.startupType === "franchise";
        const franchiseId = d.selectedFranchiseBrandId as string | undefined;
        const franchise = franchiseId ? franchiseBrands.find((b) => b.id === franchiseId) : null;

        type BenchKey = keyof Omit<CostBenchmark, "notes" | "margin">;
        const rows: { key: BenchKey; label: { ko: string; en: string }; range: [number, number] }[] = [
          { key: "ingredients", label: { ko: "원재료·식자재", en: "Materials" }, range: benchmark.ingredients },
          { key: "labor",       label: { ko: "인건비",        en: "Labor" },     range: benchmark.labor },
          { key: "rent",        label: { ko: "임대료",        en: "Rent" },      range: benchmark.rent },
          { key: "utilities",   label: { ko: "공과금",        en: "Utilities" }, range: benchmark.utilities },
          { key: "sga",         label: { ko: "운영 수수료",   en: "Ops fees" },  range: benchmark.sga },
          { key: "marketing",   label: { ko: "마케팅",        en: "Marketing" }, range: benchmark.marketing },
          { key: "other",       label: { ko: "기타",          en: "Other" },     range: benchmark.other },
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
                    ? (ko ? `${subId} 평균 (sub-industry 정밀)` : `${subId} avg (sub-industry)`)
                    : (ko ? `${catId} 카테고리 평균` : `${catId} category avg`)}
                </div>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", background: MIDNIGHT, padding: "3px 10px", borderRadius: "999px", boxShadow: "0 1px 3px rgba(25,25,112,0.25)" }}>
                {ko ? `매출액 대비 ${totalLow}~${totalHigh}%` : `${totalLow}-${totalHigh}% of revenue`}
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
                const expectedAmt = (expectedRevenue * (row.range[0] + row.range[1]) / 2) / 100;
                const userAmt = estimate.fields[row.key];
                const userPct = expectedRevenue > 0 ? (userAmt / expectedRevenue) * 100 : 0;
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
                        background: inRange ? "rgba(34,167,73,0.1)" : above ? "rgba(220,60,30,0.1)" : "rgba(255,159,10,0.12)",
                        color: inRange ? "rgb(34,167,73)" : above ? "#b83020" : "rgb(184,100,0)",
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
                    {ko ? "영업이익률 (참고)" : "Operating margin (ref)"}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.5)", marginTop: "1px" }}>
                    {benchmark.margin[0]}~{benchmark.margin[1]}% · {ko ? "이 범위 안 들면 비용 구조 재점검" : "outside = review structure"}
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
