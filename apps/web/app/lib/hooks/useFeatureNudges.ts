"use client";

/**
 * useFeatureNudges — 사장님이 아직 안 써본 핵심 기능을 우선순위로 감지.
 *
 * 사용자 의도 (2026-05-04): "재고를 등록해라 메뉴를 등록해라 — 우리 기능을 계속 쓰게 해야 한다."
 *
 * 설계 원칙:
 *   - 모두 데이터 기반 (zustand store + dailyEntries 등). 추측 X.
 *   - 운영 단계(phase) 에 따라 우선순위 다름 — 개업 전엔 인터뷰·로드맵 / 초기엔 매출입력·재고 / 성장엔 마케팅·인터뷰 재방문.
 *   - 강요 톤 X — "이런 기능도 있어요" / "AI 가 더 정확해집니다".
 *   - 1번 클릭하면 surface 전환 + 카드 scrollIntoView + halo 강조 (이미 있는 bup:navigate-feature 이벤트 활용).
 *
 * 소비처:
 *   - FeatureNudgeCard (운영 대시보드)
 *   - AIPartnerContext.emptyFeatures — AI 가 자연스럽게 "재고 등록 안 하셨네요" 멘션 가능
 */

import { useMemo } from "react";
import type { DashboardHook } from "../useDashboard";
import { useCashflowStore } from "../stores/cashflow-store";
import { useProfileStore } from "../stores/profile-store";
import { useInterviewStore } from "../stores/interview-store";

export type FeatureNudge = {
  key: string;
  /** 미사용 기능 이름 (AI 컨텍스트에 그대로 전달) */
  feature: string;
  titleKo: string;
  titleEn: string;
  subKo: string;
  subEn: string;
  ctaKo: string;
  ctaEn: string;
  /** 0~100, 클수록 우선 */
  priority: number;
  /** 클릭 시 surface + scrollTargetId(있으면 element.id) */
  navigate: { surface: "home" | "analytics" | "marketing" | "current"; scrollTargetId?: string; selector?: string };
};

type Phase = "pre-launch" | "early" | "growth" | "mature";

export function useFeatureNudges(d: DashboardHook, phase: Phase): FeatureNudge[] {
  const cashflowState = useCashflowStore();
  const businessLaunched = useProfileStore((s) => s.businessLaunched);
  const businessLaunchedDate = useProfileStore((s) => s.businessLaunchedDate);
  const interviews = useInterviewStore((s) => s.customerInterviews);

  return useMemo(() => {
    const list: FeatureNudge[] = [];
    const entries = (d.dailyEntries as Array<{ date: string; sales: number }> | undefined) ?? [];
    const inventory = (d.inventory as Array<unknown> | undefined) ?? [];
    const employees = (d.employees as Array<unknown> | undefined) ?? [];
    const fixedExpenses = (d.fixedExpenses as Array<unknown> | undefined) ?? [];
    const products = (d.products as Array<unknown> | undefined) ?? [];

    // ── 1. 운영 시작 미선언 (운영 중인데 launched flag 안 켠 케이스) ──
    if (entries.length >= 3 && !businessLaunched) {
      list.push({
        key: "declare-launch",
        feature: "businessLaunched",
        titleKo: "운영 시작일을 알려주세요",
        titleEn: "Tell us your launch date",
        subKo: "AI 코칭이 「운영 N일째」 맥락을 알면 답변이 훨씬 정확해집니다.",
        subEn: "Coaching gets sharper when AI knows your operating day count.",
        ctaKo: "운영 시작일 등록",
        ctaEn: "Set launch date",
        priority: 95,
        navigate: { surface: "home", selector: "[data-sales-input]" },
      });
    }

    // ── 2. Cashflow 설정 미완료 (가장 critical — 현금 추적 안 됨) ──
    if (!cashflowState.setupCompletedAt) {
      list.push({
        key: "cashflow-setup",
        feature: "cashflowSetup",
        titleKo: "현금흐름 추적 셋업 (3분)",
        titleEn: "Set up cashflow tracking (3min)",
        subKo: "정산 채널·고정비를 한 번 등록하면 14일 위기 알림이 켜집니다. 흑자부도 방어선.",
        subEn: "Lock channels + fixed costs once → 14-day crunch alert turns on.",
        ctaKo: "현금흐름 설정",
        ctaEn: "Set up",
        priority: phase === "pre-launch" ? 60 : 90,
        navigate: { surface: "home", selector: "[data-cashflow-hero]" },
      });
    }

    // ── 3. 매출 미입력 (1회도 없음) ──
    if (entries.length === 0 && (phase === "early" || phase === "growth" || phase === "mature")) {
      list.push({
        key: "sales-empty",
        feature: "dailySales",
        titleKo: "오늘 매출을 기록해 보세요",
        titleEn: "Log today's sales",
        subKo: "매출 데이터가 모이면 AI 가 매출 트렌드·요일 패턴·이상 신호를 자동 감지합니다.",
        subEn: "AI auto-detects trends/weekly patterns once data exists.",
        ctaKo: "매출 입력",
        ctaEn: "Log sales",
        priority: 88,
        navigate: { surface: "home", selector: "[data-sales-input]" },
      });
    }

    // ── 4. 매출 7일 이상 미입력 ──
    if (entries.length > 0 && businessLaunched) {
      const latest = entries.reduce((acc, e) => (e.date > acc ? e.date : acc), entries[0].date);
      const daysSince = Math.round((Date.now() - new Date(`${latest}T00:00:00`).getTime()) / 86400000);
      if (daysSince >= 7) {
        list.push({
          key: "sales-stale",
          feature: "dailySalesStale",
          titleKo: `매출 ${daysSince}일째 미입력`,
          titleEn: `Sales unlogged for ${daysSince} days`,
          subKo: "데이터 공백이 길어지면 트렌드·이상 감지가 멈춥니다. 1분이면 됩니다.",
          subEn: "Trend/anomaly detection pauses while data is missing.",
          ctaKo: "지금 입력",
          ctaEn: "Log now",
          priority: 86,
          navigate: { surface: "home", selector: "[data-sales-input]" },
        });
      }
    }

    // ── 5. 고정비 미등록 ──
    if (fixedExpenses.length === 0) {
      list.push({
        key: "fixed-expenses-empty",
        feature: "fixedExpenses",
        titleKo: "고정비를 등록해 두세요",
        titleEn: "Register fixed expenses",
        subKo: "월세·공과금·구독료를 한 번 적으면 매월 자동 계산되고 「이번달 빠질 돈」 미리 보입니다.",
        subEn: "Rent/utilities/subscriptions auto-recur once entered.",
        ctaKo: "고정비 등록",
        ctaEn: "Add expenses",
        priority: 75,
        navigate: { surface: "home", selector: "[data-cashflow-hero]" },
      });
    }

    // ── 6. 재고 미등록 (재고 회전 있는 업종만) ──
    const cat = d.industryCategoryId;
    const hasInventory = ["food", "cafe-dessert", "retail", "beauty", "pet"].includes(cat ?? "");
    if (hasInventory && inventory.length === 0) {
      list.push({
        key: "inventory-empty",
        feature: "inventory",
        titleKo: "재고를 등록해 보세요",
        titleEn: "Register inventory",
        subKo: "재고 부족 알림·발주 타이밍을 자동으로 잡아드립니다. 핵심 5개부터 시작해도 충분.",
        subEn: "Low-stock alerts + reorder timing kick in. Start with 5 SKUs.",
        ctaKo: "재고 등록",
        ctaEn: "Add inventory",
        priority: 72,
        navigate: { surface: "analytics" },
      });
    }

    // ── 7. 메뉴·상품 미등록 ──
    const hasProducts = ["food", "cafe-dessert", "retail", "online-digital"].includes(cat ?? "");
    if (hasProducts && products.length === 0) {
      list.push({
        key: "products-empty",
        feature: "products",
        titleKo: cat === "online-digital" ? "상품을 등록해 보세요" : "메뉴를 등록해 보세요",
        titleEn: "Register your menu/products",
        subKo: "메뉴별 매출 분석·재고 연동·인기 시간대 추적이 가능해집니다.",
        subEn: "Per-item revenue, inventory link, peak-hour tracking unlock.",
        ctaKo: cat === "online-digital" ? "상품 등록" : "메뉴 등록",
        ctaEn: "Add items",
        priority: 70,
        navigate: { surface: "analytics" },
      });
    }

    // ── 8. 직원 미등록 (성장 단계 이상) ──
    if ((phase === "growth" || phase === "mature") && employees.length === 0) {
      list.push({
        key: "employees-empty",
        feature: "employees",
        titleKo: "직원을 등록해 보세요",
        titleEn: "Add employees",
        subKo: "근태·급여·4대보험 추적과 직원 초대 링크가 켜집니다.",
        subEn: "Time/payroll/insurance tracking + invite links unlock.",
        ctaKo: "직원 등록",
        ctaEn: "Add staff",
        priority: 60,
        navigate: { surface: "analytics" },
      });
    }

    // ── 9. 고객 인터뷰 미진행 (개업 전·초기엔 우선순위 높음) ──
    if (interviews.length === 0 && (phase === "pre-launch" || phase === "early")) {
      list.push({
        key: "customer-interview-empty",
        feature: "customerInterviews",
        titleKo: "첫 고객 인터뷰 5건 만들기",
        titleEn: "First 5 customer interviews",
        subKo: "PMF 검증의 시작. 5건만 쌓아도 「우리 고객은 누구이고 왜 사는가」 구조가 잡힙니다.",
        subEn: "PMF foundation — 5 interviews surface 'who buys & why'.",
        ctaKo: "인터뷰 시작",
        ctaEn: "Start interviews",
        priority: phase === "pre-launch" ? 92 : 65,
        navigate: { surface: "current" },
      });
    }

    // ── 10. AI 파트너 미사용 (qq history 비어있는 케이스) ──
    //   data가 충분한데 한 번도 AI 에 안 물어봤으면 살짝 안내
    //   (chat history 직접 확인은 비용 — 단순히 dailyEntries 가 있는데 phase 가 growth 이상이면 추천)
    if (entries.length >= 14 && (phase === "growth" || phase === "mature")) {
      list.push({
        key: "ai-partner-try",
        feature: "aiPartner",
        titleKo: "AI 경영 파트너에게 물어보세요",
        titleEn: "Ask the AI partner",
        subKo: "오른쪽 하단 챗 버튼. 사장님 가게 데이터 전체를 보고 정확히 답합니다.",
        subEn: "Bottom-right chat. Sees your full store data for precise answers.",
        ctaKo: "AI 열기",
        ctaEn: "Open AI",
        priority: 40,
        navigate: { surface: "analytics" },
      });
    }

    // 우선순위 내림차순
    return list.sort((a, b) => b.priority - a.priority);
  }, [
    d.dailyEntries,
    d.inventory,
    d.employees,
    d.fixedExpenses,
    d.products,
    interviews,
    d.industryCategoryId,
    cashflowState.setupCompletedAt,
    businessLaunched,
    businessLaunchedDate,
    phase,
  ]);
}
