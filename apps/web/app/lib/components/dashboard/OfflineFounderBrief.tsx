"use client";

/**
 * OfflineFounderBrief — AI 운영 코치 데일리 브리프 (offline 사장님 킬러 기능).
 *
 *  ── 왜 만들었나 (2026-05-12) ────────────────────────────────────────
 *  StartupFounderBrief 가 startup-tech 사장님께 "해석 레이어" 를 줬듯이,
 *  offline 사장님 (외식·카페·뷰티·소매·이커머스·피트니스·교육·펫·생활서비스·
 *  공간임대·온라인디지털) 90%+ 의 실제 build.up 사용자에게도 같은 깊이의 해석을 제공.
 *
 *  ── v1.0 (오전) vs v1.1 (오후) ───────────────────────────────────
 *  v1.0: 외식·카페 한정 임계값을 *모든* 업종에 적용 → 뷰티(인건비 40-50% 정상)·
 *        피트니스(30-45%)·교육(50%+) 사장님께 *잘못된 경보* 가능성.
 *  v1.1: 11개 업종별 임계값 매트릭스 — 사장님 본업에 맞는 정확한 진단.
 *
 *  ── 동작 (rule-based, AI 호출 0) ──────────────────────────────
 *  1. useDashboardComputed 의 비율 데이터 + 업종 정보 읽음
 *  2. 업종별 임계값 매트릭스 적용 (외식·뷰티·피트니스·교육·공간임대 각기 다른 표준):
 *     ① Critical: 임계값 초과 (외식 인건비 30%·뷰티 55%·교육 65%·공간임대 임대료 55%)
 *     ② Important: 점검선 진입
 *     ③ Good: BEP 100%+ / WoW +10%+ / 인건비·임대료 정상
 *     ④ Data not ready (<7 entries 또는 비용 미입력) → 자동 연동 채널 안내
 *  3. priority sort → 가장 중요한 1개 hero + 보조 2개
 *  4. 각 신호: Headline + Why (한국 통계 + 업종 평균 인용) + Today's Action
 *
 *  ── 향후 확장 ──────────────────────────────────────────────────
 *  v2: 업종별 고유 신호 (뷰티: 재방문률 / 피트니스: 회원권 갱신 / 소매: 재고회전)
 *  v3: AI 호출 + 자동 데이터 수집 (네이버 커머스/예약 OAuth · 카드사·POS)
 *      → IntegrationHubCard 와 연동
 *  ────────────────────────────────────────────────────────────────
 */

import { useEffect, useMemo } from "react";
import { AlertTriangle, TrendingDown, Sparkles, Trophy, Target, ArrowRight, Lightbulb } from "lucide-react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { recordSignal } from "../../coaching-history";

const MIDNIGHT = "#191970";

type Signal = {
  kind: "critical" | "important" | "notable" | "good";
  headline: string;
  why: string;
  action: string;
};

type Props = { ko: boolean };

// ─── 업종별 임계값 매트릭스 (한국 SMB 통계 + 글로벌 표준 종합) ────────────
//   출처: 통계청 「자영업자 폐업률 2025」 / 한국외식업중앙회 / 뷰티산업협회 /
//        한국체육시설업중앙회 / 한국학원연합회 / Toast·NetSuite·Sage·R365
//        외식 표준 + a16z·SaaStr SMB 벤치마크.
//   원칙: 임계값은 "이 업종 사장님 본업 구조" 를 반영. 외식 25%→뷰티 45%→교육 55%
//        인건비가 *정상* 일 수 있음. 일률적 30% 적용은 잘못된 경보.
type IndustryThresholds = {
  label: string;
  labelEn: string;
  laborWarn: number;
  laborCritical: number;
  laborAvg: string;
  rentWarn: number;
  rentCritical: number;
  rentAvg: string;
  materialWarn?: number;
  materialCritical?: number;
  materialAvg?: string;
  materialKind?: string; // "재료비" / "매입원가" / "재료·자재비"
  unitWord?: string;     // "메뉴" / "상품" / "서비스" / "수업"
  primeCostHealthy?: number;
  /** 업종별 객단가(원) 평균 — 2026 한국 기준. null = 객단가 의미 적은 업종 (구독·도매 등) */
  avgTicketTypical?: number;
  avgTicketLabel?: string; // "객단가" / "회원권 단가" / "월 수강료" / "예약 단가"
  closureStat: string;
};

function getIndustryThresholds(industryCategoryId: string): IndustryThresholds {
  const M: Record<string, IndustryThresholds> = {
    food: {
      label: "외식업", labelEn: "F&B",
      laborWarn: 25, laborCritical: 30, laborAvg: "25-30%",
      rentWarn: 15, rentCritical: 20, rentAvg: "8-15%",
      materialWarn: 35, materialCritical: 40, materialAvg: "36% (한국 평균)", materialKind: "재료비",
      unitWord: "메뉴",
      primeCostHealthy: 60,
      avgTicketTypical: 14310, avgTicketLabel: "객단가",
      closureStat: "한국 외식업 폐업률 15.8% (2025)",
    },
    "cafe-dessert": {
      label: "카페·디저트", labelEn: "Cafe",
      laborWarn: 25, laborCritical: 30, laborAvg: "25-30%",
      rentWarn: 18, rentCritical: 22, rentAvg: "10-18%",
      materialWarn: 35, materialCritical: 40, materialAvg: "30-38%", materialKind: "재료비",
      unitWord: "메뉴",
      primeCostHealthy: 60,
      avgTicketTypical: 7500, avgTicketLabel: "객단가",
      closureStat: "한국 카페 폐업률 약 11-12%",
    },
    beauty: {
      label: "뷰티(헤어·네일·피부)", labelEn: "Beauty",
      laborWarn: 45, laborCritical: 55, laborAvg: "40-50% (디자이너 인센티브 포함)",
      rentWarn: 18, rentCritical: 25, rentAvg: "12-20%",
      materialWarn: 15, materialCritical: 22, materialAvg: "10-18%", materialKind: "재료·자재비",
      unitWord: "시술",
      avgTicketTypical: 50000, avgTicketLabel: "시술 객단가",
      closureStat: "이미용업 폐업률 11.2%",
    },
    retail: {
      label: "소매", labelEn: "Retail",
      laborWarn: 18, laborCritical: 25, laborAvg: "12-20%",
      rentWarn: 12, rentCritical: 18, rentAvg: "8-15%",
      materialWarn: 70, materialCritical: 78, materialAvg: "65-72% (매입원가)", materialKind: "매입원가",
      unitWord: "상품",
      avgTicketTypical: 18000, avgTicketLabel: "객단가",
      closureStat: "소매업 폐업률 16.7%",
    },
    ecommerce: {
      label: "전자상거래", labelEn: "E-commerce",
      laborWarn: 15, laborCritical: 22, laborAvg: "10-18%",
      rentWarn: 6, rentCritical: 12, rentAvg: "0-8% (창고)",
      materialWarn: 70, materialCritical: 78, materialAvg: "65-75% (매입원가)", materialKind: "매입원가",
      unitWord: "상품",
      avgTicketTypical: 25000, avgTicketLabel: "주문 객단가",
      closureStat: "온라인 셀러 폐업률 약 14%",
    },
    fitness: {
      label: "피트니스·요가·필라테스", labelEn: "Fitness",
      laborWarn: 40, laborCritical: 50, laborAvg: "30-45% (강사·트레이너 비중)",
      rentWarn: 25, rentCritical: 35, rentAvg: "15-25% (넓은 공간)",
      unitWord: "수업",
      avgTicketTypical: 90000, avgTicketLabel: "월 회원권 단가",
      closureStat: "체육시설업 폐업률 9.3%",
    },
    education: {
      label: "학원·교습소", labelEn: "Education",
      laborWarn: 55, laborCritical: 65, laborAvg: "50-65% (강사 인건비)",
      rentWarn: 16, rentCritical: 22, rentAvg: "10-20%",
      unitWord: "수업",
      avgTicketTypical: 250000, avgTicketLabel: "월 수강료",
      closureStat: "학원 폐업률 8.4%",
    },
    pet: {
      label: "펫(펫숍·동물병원·미용)", labelEn: "Pet",
      laborWarn: 35, laborCritical: 45, laborAvg: "30-40%",
      rentWarn: 15, rentCritical: 22, rentAvg: "10-18%",
      materialWarn: 22, materialCritical: 30, materialAvg: "15-25%", materialKind: "재료·사료비",
      unitWord: "서비스",
      avgTicketTypical: 35000, avgTicketLabel: "서비스 객단가",
      closureStat: "펫업종 폐업률 약 10%",
    },
    "living-service": {
      label: "생활서비스(세탁·청소·수리)", labelEn: "Living Service",
      laborWarn: 35, laborCritical: 45, laborAvg: "30-40%",
      rentWarn: 10, rentCritical: 18, rentAvg: "5-12%",
      unitWord: "서비스",
      avgTicketTypical: 25000, avgTicketLabel: "서비스 객단가",
      closureStat: "생활서비스업 폐업률 약 11%",
    },
    space: {
      label: "공간임대(스터디카페·파티룸)", labelEn: "Space Rental",
      laborWarn: 18, laborCritical: 25, laborAvg: "10-18% (관리 인력만)",
      // 공간임대는 임대료가 사업의 본질 — 30-50% 정상.
      rentWarn: 40, rentCritical: 55, rentAvg: "30-50% (사업 본질 — 정상 범위)",
      unitWord: "예약",
      avgTicketTypical: 15000, avgTicketLabel: "예약 단가 (시간당)",
      closureStat: "공간임대업 폐업률 약 12%",
    },
    "online-digital": {
      label: "온라인 디지털", labelEn: "Online Digital",
      laborWarn: 40, laborCritical: 55, laborAvg: "30-50%",
      rentWarn: 6, rentCritical: 12, rentAvg: "0-8%",
      unitWord: "상품",
      avgTicketTypical: 30000, avgTicketLabel: "주문 객단가",
      closureStat: "온라인 사업 폐업률 약 14%",
    },
  };
  return M[industryCategoryId] ?? {
    label: "사업장", labelEn: "Business",
    laborWarn: 30, laborCritical: 40, laborAvg: "25-35%",
    rentWarn: 15, rentCritical: 22, rentAvg: "8-15%",
    unitWord: "상품",
    closureStat: "한국 자영업 폐업률 약 12%",
  };
}

export function OfflineFounderBrief({ ko }: Props) {
  const d = useDashboardCtx();
  // useDashboardCtx 가 useDashboardComputed 값들을 spread.
  const ingredientRatio = (d as unknown as { ingredientRatio: number }).ingredientRatio ?? 0;
  const laborRatio = (d as unknown as { laborRatio: number }).laborRatio ?? 0;
  const rentRatio = (d as unknown as { rentRatio: number }).rentRatio ?? 0;
  const primeCost = (d as unknown as { primeCost: number }).primeCost ?? 0;
  const ratiosReady = (d as unknown as { ratiosReady: boolean }).ratiosReady ?? false;
  const bepProgress = (d as unknown as { bepProgress: number }).bepProgress ?? 0;
  const weeklySalesChange = (d as unknown as { weeklySalesChange: number }).weeklySalesChange ?? 0;
  const last14Total = (d as unknown as { last14Total: number }).last14Total ?? 0;
  const totalCustomers = (d as unknown as { totalCustomers: number }).totalCustomers ?? 0;
  const totalSales = (d as unknown as { totalSales: number }).totalSales ?? 0;
  const dailyEntries = (d.dailyEntries as Array<{ date: string; sales: number }>) ?? [];
  const industryCategoryId = d.industryCategoryId ?? "";

  const brief = useMemo(() => {
    const signals: Signal[] = [];
    const t = getIndustryThresholds(industryCategoryId);
    const hasMaterial = t.materialWarn != null && t.materialCritical != null;
    const isFoodLike = industryCategoryId === "food" || industryCategoryId === "cafe-dessert";
    const unitWord = t.unitWord ?? "상품";

    // ── ① Critical signals ──

    // 매출 급락 (업종 무관)
    if (weeklySalesChange < -15) {
      signals.push({
        kind: "critical",
        headline: ko
          ? `매출 WoW ${weeklySalesChange.toFixed(0)}% — 15%+ 급락`
          : `Revenue WoW ${weeklySalesChange.toFixed(0)}% — 15%+ drop`,
        why: ko
          ? `${t.closureStat}. 2주 연속 -15% 하락은 폐업 위험 신호 — 단발성인지 트렌드인지 즉시 확인.`
          : `${t.closureStat}. 2-week consecutive -15% = closure risk.`,
        action: ko
          ? `오늘: 지난 2주 사이 변경 (${unitWord}·가격·운영시간·인력) 1개 점검 + 단골 5명에게 직접 "요즘 어떠셔요" 전화`
          : "Today: review one change in past 2 weeks. Call 5 regulars.",
      });
    }

    // 재료비/매입원가 (업종별; 데이터 있는 업종만)
    if (hasMaterial && ratiosReady && ingredientRatio > (t.materialCritical ?? 999)) {
      signals.push({
        kind: "critical",
        headline: ko
          ? `${t.materialKind} ${ingredientRatio.toFixed(0)}% — ${t.label} 위험선 ${t.materialCritical}% 초과`
          : `${t.materialKind} ${ingredientRatio.toFixed(0)}% — exceeds ${t.materialCritical}%`,
        why: ko
          ? `${t.label} 평균 ${t.materialAvg}. ${t.materialCritical}%+ 는 마진 붕괴 — 즉시 매입처/${unitWord} 재편 필요.`
          : `${t.labelEn} avg ${t.materialAvg}. ${t.materialCritical}%+ = margin collapse.`,
        action: ko
          ? `이번 주: ① 매출 상위 5 ${unitWord} 원가율 재계산 ② 공급처/매입처 3곳 견적 비교 ③ 저마진+저인기 ${unitWord} ${isFoodLike ? "단종" : "정리"}`
          : "This week: ① recompute COGS for top 5 ② quote 3 suppliers ③ kill low-margin items",
      });
    } else if (hasMaterial && ratiosReady && ingredientRatio > (t.materialWarn ?? 999)) {
      signals.push({
        kind: "important",
        headline: ko
          ? `${t.materialKind} ${ingredientRatio.toFixed(0)}% — 점검선`
          : `${t.materialKind} ${ingredientRatio.toFixed(0)}% — review`,
        why: ko
          ? `${t.label} 평균 ${t.materialAvg} 근접. 위험선 ${t.materialCritical}% 진입 전 점검 시점.`
          : `Near ${t.labelEn} avg. Review before ${t.materialCritical}% threshold.`,
        action: ko ? `이번 주: 매출 상위 5 ${unitWord} 원가율 재계산` : "This week: recompute COGS for top 5",
      });
    }

    // 인건비 (업종별 임계값)
    if (ratiosReady && laborRatio > t.laborCritical) {
      signals.push({
        kind: "critical",
        headline: ko
          ? `인건비 ${laborRatio.toFixed(0)}% — ${t.label} 위험선 ${t.laborCritical}% 초과`
          : `Labor ${laborRatio.toFixed(0)}% — exceeds ${t.laborCritical}%`,
        why: ko
          ? `${t.label} 표준 ${t.laborAvg}. ${t.laborCritical}%+ 는 매출 회전 부족 또는 과잉 인력 신호.`
          : `${t.labelEn} std ${t.laborAvg}. ${t.laborCritical}%+ = low turnover OR overstaff.`,
        action: ko
          ? "이번 주: ① 시간대별/요일별 매출 분석 (피크 vs 비피크) ② 비피크 인력 파트타임 전환 검토 ③ 인당 매출(매출/직원수) 추적"
          : "This week: ① time-slot analysis ② shift off-peak to part-time ③ track rev/employee",
      });
    } else if (ratiosReady && laborRatio > t.laborWarn) {
      signals.push({
        kind: "important",
        headline: ko ? `인건비 ${laborRatio.toFixed(0)}% — 점검선` : `Labor ${laborRatio.toFixed(0)}% — review`,
        why: ko ? `${t.label} 표준 상한 ${t.laborWarn}% 근접.` : `Near ${t.labelEn} ceiling.`,
        action: ko ? "이번 달: 시간대별 가동률·인당 매출 점검" : "This month: check time-slot utilization",
      });
    }

    // 임대료 (업종별; 공간임대는 30-50% 정상이라 임계값이 매우 높음)
    if (ratiosReady && rentRatio > t.rentCritical) {
      signals.push({
        kind: "critical",
        headline: ko
          ? `임대료 ${rentRatio.toFixed(0)}% — ${t.label} 위험선 ${t.rentCritical}% 초과`
          : `Rent ${rentRatio.toFixed(0)}% — exceeds ${t.rentCritical}%`,
        why: ko
          ? `${t.label} 표준 ${t.rentAvg}. ${t.rentCritical}%+ 는 고정비 구조상 흑자 도달 어려움.`
          : `${t.labelEn} std ${t.rentAvg}. ${t.rentCritical}%+ = hard to reach profit.`,
        action: ko
          ? "이번 달: ① 임대인과 인하 협상 (인근 시세·공실 데이터 근거) ② 매출 25%+ 증가 plan B ③ 사업 모델 전환 검토"
          : "This month: ① rent negotiation ② +25% revenue plan B ③ business model pivot",
      });
    } else if (ratiosReady && rentRatio > t.rentWarn) {
      signals.push({
        kind: "important",
        headline: ko ? `임대료 ${rentRatio.toFixed(0)}% — 점검선` : `Rent ${rentRatio.toFixed(0)}% — review`,
        why: ko
          ? `${t.label} 표준 상한 ${t.rentWarn}% 근접. 흑자 도달 부담.`
          : `Near ${t.labelEn} ${t.rentWarn}% ceiling.`,
        action: ko ? "이번 분기: 임대료 인하 협상 준비 (시세 데이터 수집)" : "This Q: prep rent negotiation",
      });
    }

    // BEP 진행률 (업종 무관)
    if (ratiosReady && bepProgress > 0 && bepProgress < 60) {
      signals.push({
        kind: "critical",
        headline: ko
          ? `BEP 진행률 ${bepProgress.toFixed(0)}% — 손익분기 60% 미만`
          : `BEP progress ${bepProgress.toFixed(0)}% — below 60%`,
        why: ko
          ? "월 매출이 월 비용의 60% 미만 = 자본 빠르게 소진. 3개월 연속 시 폐업 위험 진입."
          : "Monthly rev < 60% of cost = burning capital. 3 months = closure risk.",
        action: ko
          ? "이번 주: ① 현재 자본 잔액·런웨이 계산 (월 적자 × N개월) ② 재도전특별자금 신청 검토 (sbiz.or.kr)"
          : "This week: ① compute runway ② consider 재도전특별자금",
      });
    } else if (ratiosReady && bepProgress >= 60 && bepProgress < 80) {
      signals.push({
        kind: "important",
        headline: ko ? `BEP 진행률 ${bepProgress.toFixed(0)}% — 80% 미만` : `BEP ${bepProgress.toFixed(0)}% — below 80%`,
        why: ko ? "흑자 도달까지 매출 +20% 또는 비용 -20% 필요." : "Need +20% rev or -20% cost.",
        action: ko ? "이번 달: ① 객단가 5% 인상 시도 ② 변동비 -10% 시뮬" : "This month: ① +5% ticket ② -10% variable cost sim",
      });
    }

    // ── ③ Good signals ──
    if (ratiosReady && bepProgress >= 100) {
      signals.push({
        kind: "good",
        headline: ko ? `BEP 진행률 ${bepProgress.toFixed(0)}% — 흑자 운영` : `BEP ${bepProgress.toFixed(0)}% — profitable`,
        why: ko
          ? `월 매출 > 월 비용. ${t.label} 안정 운영 단계.`
          : `Revenue > cost. ${t.labelEn} stable operation.`,
        action: ko ? "이번 분기: 성장 투자 시점 — 인접 매장·온라인 확장·상품 다각화 검토" : "This Q: growth investment time",
      });
    }

    if (weeklySalesChange > 10) {
      signals.push({
        kind: "good",
        headline: ko ? `매출 WoW +${weeklySalesChange.toFixed(0)}% 성장` : `Revenue WoW +${weeklySalesChange.toFixed(0)}%`,
        why: ko
          ? `10%+ WoW 성장은 한국 SMB 상위 10% 신호. 성장 원인 (${unitWord}·마케팅·계절) 파악·복제 필요.`
          : "10%+ WoW = top 10% KR SMB. Identify and double down on the driver.",
        action: ko
          ? "이번 주: 지난 2주 어떤 변화가 매출 증가 만들었는지 분석 (POS·SNS·리뷰)"
          : "This week: analyze what changed in past 2 wks",
      });
    }

    // 객단가 (avg ticket) — 모든 업종 (typical 있을 때만)
    // 객수 데이터 있으면 actual 객단가 계산 → 업종 평균 대비 비교.
    const avgTicketActual = totalCustomers > 0 ? totalSales / totalCustomers : 0;
    if (t.avgTicketTypical && t.avgTicketTypical > 0 && avgTicketActual > 0) {
      const ratio = avgTicketActual / t.avgTicketTypical;
      const actualWon = Math.round(avgTicketActual).toLocaleString();
      const typicalWon = Math.round(t.avgTicketTypical).toLocaleString();
      const ticketLabel = t.avgTicketLabel ?? "객단가";

      if (ratio < 0.7) {
        signals.push({
          kind: "critical",
          headline: ko
            ? `${ticketLabel} ${actualWon}원 — ${t.label} 평균 ${typicalWon}원의 ${Math.round(ratio * 100)}%`
            : `${ticketLabel} ${actualWon} — ${Math.round(ratio * 100)}% of ${t.labelEn} avg ${typicalWon}`,
          why: ko
            ? `${t.label} 평균 ${typicalWon}원 대비 30%+ 낮음. 저가 ${unitWord} 비중 과다 또는 가격 책정 부족. 매출 회복 가장 큰 레버.`
            : `30%+ below ${t.labelEn} avg. Low-price mix overweight OR underpriced. Largest revenue lever.`,
          action: ko
            ? `이번 주: ① 매출 상위 5 ${unitWord} 객단가 vs 평균 비교 ② 업셀 옵션 (사이드·세트·옵션) 1개 추가 ③ 가격 인상 5-10% 시뮬`
            : `This week: ① top 5 unit price audit ② add 1 upsell option ③ simulate +5-10% pricing`,
        });
      } else if (ratio < 0.85) {
        signals.push({
          kind: "important",
          headline: ko
            ? `${ticketLabel} ${actualWon}원 — ${t.label} 평균보다 낮음`
            : `${ticketLabel} ${actualWon} — below ${t.labelEn} avg`,
          why: ko
            ? `${t.label} 평균 ${typicalWon}원. 15-30% 낮음 — 업셀·세트 구성으로 보완 여지.`
            : `${t.labelEn} avg ${typicalWon}. 15-30% lower — upsell opportunity.`,
          action: ko ? `이번 주: ${unitWord} 1개 업셀 옵션 추가 (사이드/세트/멤버십)` : `This week: add one upsell option`,
        });
      } else if (ratio > 1.15) {
        signals.push({
          kind: "good",
          headline: ko
            ? `${ticketLabel} ${actualWon}원 — ${t.label} 평균 +${Math.round((ratio - 1) * 100)}%`
            : `${ticketLabel} ${actualWon} — +${Math.round((ratio - 1) * 100)}% vs ${t.labelEn} avg`,
          why: ko
            ? `${t.label} 평균 ${typicalWon}원 초과. 프리미엄 포지셔닝 성공 — 객수 증가 마케팅이 다음 레버.`
            : `Premium positioning success — customer acquisition is next lever.`,
          action: ko ? "이번 분기: 단골 추천 캠페인·SNS 콘텐츠로 객수 확장" : "This Q: regular-referral + SNS for customer growth",
        });
      }
    }

    if (isFoodLike && ratiosReady && primeCost > 0 && primeCost < (t.primeCostHealthy ?? 60)) {
      signals.push({
        kind: "good",
        headline: ko ? `프라임코스트 ${primeCost.toFixed(0)}% — ${t.label} 표준 우수` : `Prime cost ${primeCost.toFixed(0)}% — strong`,
        why: ko
          ? `${t.label} 표준 65% 미만 권장 (재료+인건). 60% 미만 = Toast·NetSuite·Sage 글로벌 상위 quartile.`
          : `${t.labelEn} std <65% (material+labor). <60% = global top quartile.`,
        action: ko ? "유지 — 매분기 재점검" : "Maintain — recheck quarterly",
      });
    }

    // ── ④ Data not ready ──
    if (signals.length === 0) {
      if (dailyEntries.length < 7) {
        signals.push({
          kind: "important",
          headline: ko ? "데이터 부족 — 7일 이상 매출 입력 필요" : "Not enough data — 7+ days needed",
          why: ko
            ? "WoW·BEP·비용비율 계산 위해 최소 7일 매출 데이터 필요. 매일 1분 수기 입력 또는 자동 연동(네이버 커머스/예약·카드사·POS) 권장."
            : "Need 7+ days. Daily entry OR auto-sync (Naver Commerce/Booking, card issuer, POS).",
          action: ko
            ? "오늘: 어제 매출 입력 (1분). 자동 연동 가능한 채널은 「마이페이지 > 데이터 연결」 에서 확인."
            : "Today: enter yesterday's revenue. Check auto-sync in My Page > Data Connections.",
        });
      } else if (!ratiosReady) {
        signals.push({
          kind: "important",
          headline: ko ? "비용 데이터 부족 — 월 비용 입력 필요" : "Cost data missing",
          why: ko
            ? "재료비·인건비·임대료 등 월 비용을 「내 가게 > 비용 관리」 에 입력해야 비율 분석 가능."
            : "Need monthly costs in My Store > Cost Management.",
          action: ko ? "오늘: 내 가게 > 비용 관리 → 월 비용 입력 (5분)" : "Today: enter monthly costs (5 min)",
        });
      } else {
        signals.push({
          kind: "good",
          headline: ko ? "모든 지표 안정 — 임계 신호 없음" : "All metrics stable",
          why: ko
            ? `${t.label} 표준 임계값 (인건비 ${t.laborAvg} · 임대료 ${t.rentAvg}) 내. 고객 경험 개선·신규 채널 도전에 집중할 환경.`
            : `Within ${t.labelEn} standards. Time for CX or new channel.`,
          action: ko
            ? "이번 주: ① 단골 5명 인터뷰 (\"만족도 + 재방문 의향\") ② 재방문률 첫 측정"
            : "This week: ① 5 regular interviews ② first repeat-visit measurement",
        });
      }
    }

    const sortOrder = { critical: 0, important: 1, notable: 2, good: 3 };
    signals.sort((a, b) => sortOrder[a.kind] - sortOrder[b.kind]);
    const hero = signals[0];
    const secondary = signals.slice(1, 3);

    return { hero, secondary, industryLabel: t.label };
  }, [ingredientRatio, laborRatio, rentRatio, primeCost, ratiosReady, bepProgress, weeklySalesChange, dailyEntries.length, industryCategoryId, totalCustomers, totalSales, ko]);

  // 코칭 히스토리 자동 기록 — 사장님 lock-in moat.
  // 하루 한 번만 기록 (recordSignal 내부에서 동일 날짜·brief 덮어쓰기 처리).
  useEffect(() => {
    if (!brief.hero) return;
    recordSignal("offline", {
      kind: brief.hero.kind,
      headline: brief.hero.headline,
      action: brief.hero.action,
    });
  }, [brief.hero?.headline, brief.hero?.kind, brief.hero?.action, brief.hero]);

  void last14Total;

  const colors = {
    critical: { bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.20)", text: "#b91c1c", iconBg: "rgba(220,38,38,0.10)" },
    important: { bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.20)", text: "#b45309", iconBg: "rgba(217,119,6,0.10)" },
    notable: { bg: `${MIDNIGHT}08`, border: `${MIDNIGHT}22`, text: MIDNIGHT, iconBg: `${MIDNIGHT}10` },
    good: { bg: "rgba(5,150,105,0.05)", border: "rgba(5,150,105,0.18)", text: "#059669", iconBg: "rgba(5,150,105,0.10)" },
  } as const;

  const heroColor = colors[brief.hero.kind];
  const HeroIcon = brief.hero.kind === "critical"
    ? AlertTriangle
    : brief.hero.kind === "important"
      ? TrendingDown
      : brief.hero.kind === "good"
        ? Trophy
        : Sparkles;

  return (
    <article style={{
      background: "white",
      borderRadius: 20,
      border: "1px solid rgba(25,25,112,0.10)",
      boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
      padding: "22px 24px",
      display: "flex", flexDirection: "column" as const, gap: 18,
    }}>
      <header>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.85) 100%)`,
            color: "white",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(25,25,112,0.25)",
          }}>
            <Sparkles size={14} strokeWidth={2.2} />
          </span>
          <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.75, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
            {ko ? `AI 운영 코치 데일리 브리프 · ${brief.industryLabel}` : `AI Operations Coach · ${brief.industryLabel}`}
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.35 }}>
          {ko ? "오늘 가장 중요한 한 가지" : "The one thing that matters today"}
        </div>
      </header>

      <div style={{
        padding: "16px 18px", borderRadius: 14,
        background: heroColor.bg, border: `1px solid ${heroColor.border}`,
        display: "flex", gap: 14, alignItems: "flex-start",
      }}>
        <div style={{
          flexShrink: 0, width: 36, height: 36, borderRadius: 10,
          background: heroColor.iconBg, color: heroColor.text,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginTop: 2,
        }}>
          <HeroIcon size={18} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: heroColor.text, lineHeight: 1.4, marginBottom: 6, letterSpacing: "-0.005em" }}>
            {brief.hero.headline}
          </div>
          <div style={{ fontSize: 13, color: "rgba(15,23,42,0.7)", lineHeight: 1.6, marginBottom: 10 }}>
            {brief.hero.why}
          </div>
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            padding: "10px 12px", borderRadius: 10,
            background: "white", border: `1px solid ${heroColor.border}`,
          }}>
            <Target size={14} strokeWidth={2.2} style={{ flexShrink: 0, color: heroColor.text, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: heroColor.text, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 2 }}>
                {ko ? "오늘 한 가지 행동" : "Today's one action"}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", lineHeight: 1.5 }}>
                {brief.hero.action}
              </div>
            </div>
          </div>
        </div>
      </div>

      {brief.secondary.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(15,23,42,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8 }}>
            {ko ? "이번 주 추가 점검" : "Also watch this week"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {brief.secondary.map((s, i) => {
              const c = colors[s.kind];
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 12px", borderRadius: 10,
                  background: c.bg, border: `1px solid ${c.border}`,
                }}>
                  <span style={{
                    flexShrink: 0, width: 6, height: 6, borderRadius: "50%",
                    background: c.text, marginTop: 7,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.4 }}>
                      {s.headline}
                    </div>
                    <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.65)", lineHeight: 1.55, marginTop: 2 }}>
                      {s.action}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 12px", borderRadius: 10,
        background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.06)",
        fontSize: 11, color: "rgba(15,23,42,0.55)", lineHeight: 1.45,
      }}>
        <Lightbulb size={12} strokeWidth={1.8} style={{ flexShrink: 0, color: MIDNIGHT, opacity: 0.6 }} />
        <span style={{ flex: 1 }}>
          {ko
            ? `${brief.industryLabel} 업종별 임계값 기반 — 인건비·임대료·BEP·WoW (외식/카페·소매·이커머스·뷰티·펫은 재료비/매입원가 추가) 자동 분석 → 한국 11개 업종 평균 + 글로벌 표준 → 가장 중요한 1개 + 행동.`
            : `Industry-specific thresholds for ${brief.industryLabel} — labor/rent/BEP/WoW + material (for food/retail/beauty/pet) → 11 KR industry averages + global standards → top signal + action.`}
        </span>
        <ArrowRight size={12} strokeWidth={1.8} style={{ flexShrink: 0, color: MIDNIGHT, opacity: 0.5 }} />
      </div>
    </article>
  );
}
