"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  ShieldCheck, AlertTriangle, TrendingDown, TrendingUp,
  Wallet, MessageSquare, Star, BarChart3, ClipboardList,
  Lightbulb, Calendar, MapPin, Building2,
} from "lucide-react";
import { COST_RATIOS, HEALTH_THRESHOLDS } from "@build-up/shared";
import { StageWrapup } from "../shared/StageWrapup";

const MIDNIGHT = "#191970";

/**
 * 개업/론칭 후 첫 달 점검 단계.
 *
 * 핵심: 사용자가 이전 단계에서 입력한 데이터를 100% 활용
 *   - monthlyCosts (8필드: ingredients, labor, rent, utilities, sga, marketing, other, interest)
 *   - selectedBudget, businessLaunched, businessLaunchedDate
 *   - industryCategoryId, profile.subIndustryId, startupType
 *   - storeName, preferredRegionInput
 *
 * Supabase 영속화 (확인됨):
 *   - user_store_data.monthly_costs (JSONB) — 800ms debounce + 5s 인터벌 자동저장
 *   - business_profiles.preferred_regions, sub_industry_id
 *
 * 검증 출처:
 *   - 한국은행 폐업률 분석 / 자영업자 2026 전망 / 통계청
 *   - HEALTH_THRESHOLDS 상수 (packages/shared/src/constants/benchmarks.ts)
 *   - 2026년 영세 소상공인 25만원 바우처 (전기·4대보험·연료비)
 *   - 스타트업 런웨이: 시리즈A 21개월 / D7 retention 20%+
 */
export function FirstMonthCheckStage() {
  const d = useDashboardCtx();
  const {
    language,
    industryCategoryId,
    monthlyCosts,
    selectedBudget,
    businessLaunched,
    storeName,
    preferredRegionInput,
    startupType,
    profile,
    guideStepIndex,
    setGuideStepIndex,
  } = d;

  const ko = language === "ko";
  const isStartup = industryCategoryId === "startup-tech";
  const isOnline = industryCategoryId === "online-digital";
  const pg = guideStepIndex;
  const totalPg = 4;

  // ─── 사용자 입력 데이터 정규화 ───
  const mc = monthlyCosts as {
    ingredients: number; labor: number; rent: number; utilities: number;
    sga: number; marketing: number; other: number; interest: number;
  };
  const fixedCosts = (mc?.rent ?? 0) + (mc?.labor ?? 0) + (mc?.utilities ?? 0) + (mc?.interest ?? 0);
  const totalCosts = fixedCosts + (mc?.ingredients ?? 0) + (mc?.sga ?? 0) + (mc?.marketing ?? 0) + (mc?.other ?? 0);
  const hasAnyCost = totalCosts > 0;
  const emergencyTarget6mo = fixedCosts > 0 ? fixedCosts * 6 : 0;
  const emergencyTarget3mo = fixedCosts > 0 ? fixedCosts * 3 : 0;
  const runwayMonths = fixedCosts > 0 && (selectedBudget ?? 0) > 0
    ? Math.floor((selectedBudget as number) / fixedCosts)
    : null;

  // ─── 업종별 벤치마크 ───
  const industryRatios = (industryCategoryId
    ? (COST_RATIOS as unknown as Record<string, Record<string, readonly [number, number] | number>>)[industryCategoryId]
    : null) as Record<string, readonly [number, number] | number> | null;
  const primeCostMax = (industryRatios?.primeCostMax as number) ?? HEALTH_THRESHOLDS.PRIME_COST_WARNING;

  // ─── 비율 계산 (실제 입력 기반) ───
  const ratios = (() => {
    if (!hasAnyCost) return null;
    const ingredientsR = ((mc.ingredients ?? 0) / totalCosts) * 100;
    const laborR = ((mc.labor ?? 0) / totalCosts) * 100;
    const rentR = ((mc.rent ?? 0) / totalCosts) * 100;
    const primeCost = ingredientsR + laborR;
    return {
      ingredients: Math.round(ingredientsR),
      labor: Math.round(laborR),
      rent: Math.round(rentR),
      primeCost: Math.round(primeCost),
      primeCostStatus: primeCost > HEALTH_THRESHOLDS.PRIME_COST_CRITICAL
        ? "critical" as const
        : primeCost > primeCostMax
          ? "warning" as const
          : "ok" as const,
    };
  })();

  // ─── 영업 일수 (기개업) — profile에서 가져오기 ───
  const businessLaunchedDate = (profile as { businessLaunchedDate?: string | null } | null)?.businessLaunchedDate ?? null;
  const daysSinceLaunch = (() => {
    if (!businessLaunched || !businessLaunchedDate) return null;
    const launch = new Date(businessLaunchedDate).getTime();
    if (Number.isNaN(launch)) return null;
    return Math.floor((Date.now() - launch) / (1000 * 60 * 60 * 24));
  })();

  const fmtKrw = (won: number) => {
    if (!Number.isFinite(won)) return "-";
    if (won >= 100_000_000) return `${(won / 100_000_000).toFixed(won % 100_000_000 === 0 ? 0 : 1)}억원`;
    if (won >= 10_000) return `${Math.round(won / 10_000).toLocaleString()}만원`;
    return `${won.toLocaleString()}원`;
  };

  const pgLabels = isStartup
    ? (ko ? ["왜 중요한가", "런웨이 점검", "첫 달 KPI", "주간 루틴"] : ["Why", "Runway", "KPIs", "Routine"])
    : (ko ? ["왜 중요한가", "비상금·런웨이", "첫 달 지표", "주간 루틴"] : ["Why", "Reserve", "Metrics", "Routine"]);

  // ─── KEY ACTION (페이지별 — 사용자 데이터 반영) ───
  const keyActions: Record<number, { title: string; detail: string }> = isStartup
    ? {
        0: ko
          ? {
              title: runwayMonths !== null
                ? `현재 런웨이 ${runwayMonths}개월 — ${runwayMonths < 6 ? "6개월 미만은 즉시 행동 필요" : runwayMonths < 12 ? "12개월 미만은 시리즈A 준비 시작" : "안정권, PMF 검증에 집중"}`
                : "운영 대시보드에서 월 비용을 입력하면 런웨이를 즉시 계산합니다",
              detail: runwayMonths !== null
                ? `초기 자본 ${fmtKrw(selectedBudget ?? 0)} / 월 고정비 ${fmtKrw(fixedCosts)}. 시리즈A는 통상 21개월 런웨이 필요. 첫 달은 매출 < 비용이 정상이지만 매주 개선되어야 합니다.`
                : "월 고정비 (서버·인건비·도구) 입력 후 비교. 한국 스타트업 폐업률 2024년 85.2% — 런웨이 추적이 생존의 1순위.",
            }
          : {
              title: runwayMonths !== null
                ? `Runway: ${runwayMonths} months — ${runwayMonths < 6 ? "act now" : runwayMonths < 12 ? "start Series A prep" : "focus on PMF"}`
                : "Enter monthly costs to compute runway",
              detail: runwayMonths !== null
                ? `Capital ${fmtKrw(selectedBudget ?? 0)} / fixed monthly ${fmtKrw(fixedCosts)}. Series A typically needs 21mo runway.`
                : "Enter monthly fixed costs.",
            },
        1: ko
          ? {
              title: emergencyTarget6mo > 0
                ? `최소 비상금 ${fmtKrw(emergencyTarget6mo)} 확보 — 월 고정비 × 6개월`
                : "월 고정비 입력 시 비상금 목표를 즉시 계산",
              detail: "스타트업은 매출 변동이 크므로 6개월 분 별도 보유 권장. 시리즈A 라운드는 21개월, 시리즈B/C는 23개월 런웨이가 정석.",
            }
          : {
              title: emergencyTarget6mo > 0 ? `Reserve target: ${fmtKrw(emergencyTarget6mo)} (fixed × 6mo)` : "Enter monthly costs",
              detail: "6mo separate reserve recommended. Series A: 21mo runway baseline.",
            },
        2: ko
          ? {
              title: "북극성 지표를 1개로 축소 — 매일 동일 시간에 확인",
              detail: "PMF 핵심: D7 retention ≥ 20% / 핵심 액션 완료율 / 자발 추천. PH·HN 첫 주 트래픽이 빠지는 D+8~D+30이 진짜 시험. 첫 달은 신규 유입보다 retention에 집중.",
            }
          : {
              title: "Pick ONE North Star metric — check same time daily",
              detail: "D7 retention ≥ 20%, core-action completion, organic referrals. Real test: D+8 to D+30 after PH/HN traffic drops.",
            },
        3: ko
          ? {
              title: "주간 1실험 + 사용자 10명 직접 인터뷰 — 첫 달은 학습 모드",
              detail: "월·금 30분 사용자 인터뷰 / 화·수·목 실험 빌드 + 출시. 정량 (지표) + 정성 (인터뷰)이 같은 방향이어야 PMF.",
            }
          : {
              title: "1 experiment/week + 10 user interviews",
              detail: "Mon/Fri 30min interviews, Tue-Thu build/ship experiments. Quant + qual must agree.",
            },
      }
    : {
        0: ko
          ? {
              title: businessLaunched
                ? daysSinceLaunch !== null
                  ? `개업 ${daysSinceLaunch}일째 — ${storeName ? `${storeName}, ` : ""}매일 매출·비용 기록이 가장 중요`
                  : "개업했어요 — 매일 매출·비용 기록이 가장 중요"
                : "개업 직후 첫 달이 가장 위험한 시기 — 데이터 기록부터 시작",
              detail: hasAnyCost
                ? `현재 입력된 월 고정비 ${fmtKrw(fixedCosts)} 기준 — 한국 자영업자 2024 폐업률 85.2%. 첫달 적자는 정상이지만 '매주 숫자가 개선'되어야 정상 신호. 영업실적 악화(28.2%)·자금사정(18.1%)·임차료(11.9%)가 폐업 1-3순위.`
                : "월 비용을 입력하면 비상금 목표·런웨이·업종 평균 비교를 즉시 보여드립니다. 한국 자영업자 폐업률 2024 85.2% — 데이터 없는 운영이 1번 위험.",
            }
          : {
              title: businessLaunched
                ? `Launched ${daysSinceLaunch ?? "?"} days ago — daily logging is #1 priority`
                : "Month 1 is the most fragile — start with daily records",
              detail: hasAnyCost
                ? `Monthly fixed: ${fmtKrw(fixedCosts)}. Korean SMB closure rate hit 85.2% in 2024. Loss in month 1 is normal IF numbers improve weekly.`
                : "Enter costs to see your reserve target, runway, and industry comparison.",
            },
        1: ko
          ? {
              title: emergencyTarget6mo > 0
                ? `비상금 목표 ${fmtKrw(emergencyTarget6mo)} (월 고정비 × 6개월)`
                : "월 고정비를 입력하면 비상금 목표를 즉시 계산합니다",
              detail: emergencyTarget6mo > 0
                ? `최소 ${fmtKrw(emergencyTarget3mo)} (3개월) → 권장 ${fmtKrw(emergencyTarget6mo)} (6개월). 임대료(${fmtKrw(mc.rent ?? 0)}) + 인건비(${fmtKrw(mc.labor ?? 0)}) + 공과금(${fmtKrw(mc.utilities ?? 0)}) + 이자(${fmtKrw(mc.interest ?? 0)}). 2026 영세 소상공인 25만원 경영안정 바우처 (전기·4대보험·연료비) 신청 권장.`
                : "임대료·인건비·공과금·이자를 모두 입력해야 정확한 목표가 계산됩니다.",
            }
          : {
              title: emergencyTarget6mo > 0 ? `Reserve target: ${fmtKrw(emergencyTarget6mo)} (fixed × 6mo)` : "Enter monthly fixed costs",
              detail: emergencyTarget6mo > 0
                ? `Min ${fmtKrw(emergencyTarget3mo)} (3mo) → recommended ${fmtKrw(emergencyTarget6mo)} (6mo).`
                : "Rent + labor + utilities + interest required.",
            },
        2: ko
          ? {
              title: ratios
                ? ratios.primeCostStatus === "critical"
                  ? `프라임코스트 ${ratios.primeCost}% — 위험 ${HEALTH_THRESHOLDS.PRIME_COST_CRITICAL}% 초과, 즉시 조정 필요`
                  : ratios.primeCostStatus === "warning"
                    ? `프라임코스트 ${ratios.primeCost}% — 경고 ${primeCostMax}% 초과 (업종 평균 ${primeCostMax}% 이내)`
                    : `프라임코스트 ${ratios.primeCost}% — 정상 (업종 평균 ${primeCostMax}% 이내)`
                : "비용 입력 시 프라임코스트(원재료+인건비) 비율을 업종 평균과 비교",
              detail: ratios
                ? `재료비 ${ratios.ingredients}% + 인건비 ${ratios.labor}% = 프라임코스트 ${ratios.primeCost}%. 임대료 ${ratios.rent}%. 첫 달은 변동 크니 주 단위 추적 → 4주차에 안정 추세 확인.`
                : "재료비·인건비·임대료를 입력하면 즉시 비교됩니다.",
            }
          : {
              title: ratios ? `Prime cost ${ratios.primeCost}% (target ≤${primeCostMax}%)` : "Enter costs to compare",
              detail: ratios
                ? `Ingredients ${ratios.ingredients}% + Labor ${ratios.labor}% = Prime ${ratios.primeCost}%. Rent ${ratios.rent}%.`
                : "Enter ingredients/labor/rent to compare.",
            },
        3: ko
          ? {
              title: "주간 리뷰: 매주 같은 요일 30분 — 매출·원가·리뷰·재고 4가지만",
              detail: "통계청: 세부 계획 없는 창업은 첫해 폐업률 1.7배. 일별 기록 → 주간 리뷰 → 월말 결산. 네이버 플레이스 리뷰 10개 이전엔 광고 X (콘텐츠·진성 리뷰가 우선).",
            }
          : {
              title: "Weekly review: same day, 30 min — sales/cost/reviews/stock",
              detail: "Daily logs → weekly review → month-end. Hold ads until 10+ Place reviews.",
            },
      };

  // ─── 트랩 (페이지별 빨강 경고) ───
  const traps: Record<number, { label: string; text: string }[]> = isStartup
    ? {
        0: ko ? [
          { label: "런웨이 6개월 미만 → '매출 < 비용' 상태에서 1주만 방치해도 위험", text: "런웨이 < 6개월이면 (1) 비용 즉시 절감 (2) 매출 파이낸싱 / RBF 검토 (3) 시리즈A 미리 시작. 한 번에 못 잡으면 6개월 후 강제 청산." },
          { label: "PMF 없이 마케팅 비용 = 그냥 태우는 돈", text: "D7 retention < 20%면 신규 유입 늘려도 누수만 커짐. PMF 검증 후 광고. 첫 달은 사용자 인터뷰가 광고보다 가치 100배." },
        ] : [
          { label: "<6mo runway = 1 idle week is dangerous", text: "Cut costs / revenue financing / start Series A. Otherwise forced wind-down." },
          { label: "Marketing without PMF = burn", text: "D7 <20% means leaks, not growth. Interviews > ads in month 1." },
        ],
        1: ko ? [
          { label: "통장 잔고만 보는 건 위험 — 미수금·매출·번레이트 함께 봐야", text: "VC 자금 입금 직후 잔고만 보면 안전 같지만, 번레이트 무시하면 1분기 만에 사라짐. 매주 같은 시간에 [잔고 / 매출 / 번레이트 / 런웨이] 4개를 한 화면으로." },
          { label: "비용 카테고리 미분류 = 절감 포인트 못 찾음", text: "AWS·Vercel·Slack·Notion·광고 별 분류. 가장 큰 1개부터 분기마다 협상. 인건비 외 단일 항목이 매출의 10% 넘으면 즉시 검토." },
        ] : [
          { label: "Bank balance alone is misleading", text: "Look at [cash / revenue / burn / runway] same time weekly." },
          { label: "Uncategorized costs hide savings", text: "Tag by tool/vendor. Renegotiate top 1 each quarter." },
        ],
        2: ko ? [
          { label: "지표 5개 이상 보면 결국 0개 봄", text: "북극성 1개로 압축. SaaS면 활성 사용자, 마켓플레이스면 GMV, 콘텐츠면 retention. '주요 지표가 5개'는 우선순위 없다는 뜻." },
          { label: "런칭 직후 트래픽 = PMF 신호 X", text: "PH·HN 트래픽은 D+7부터 빠짐. D+8~D+30 retention이 진짜 시험. 이 시점에 D7 < 20%면 제품 재정의." },
        ] : [
          { label: "5+ metrics = watching zero", text: "Compress to one North Star (DAU/GMV/retention)." },
          { label: "Launch traffic ≠ PMF", text: "Real test is D+8 to D+30 retention." },
        ],
        3: ko ? [
          { label: "사용자 인터뷰를 '시간 낭비'로 보면 데이터로만 의사결정 — 가장 큰 함정", text: "정량 데이터는 'what'만 알려줌. 'why'는 인터뷰만이 답. 첫 달 10명 인터뷰가 다음 6개월 방향을 잡음." },
          { label: "주간 리뷰 안 하면 매주 동일 실수 반복", text: "월·금 30분만 따로. (1) 이번 주 가장 놀란 데이터 (2) 다음 주 1실험 (3) 인터뷰 인사이트 1줄. 누락은 5주차에 확연히 드러남." },
        ] : [
          { label: "Skipping interviews = data-only decisions", text: "Numbers say 'what'. Interviews say 'why'. 10 in month 1 set next 6 months." },
          { label: "No weekly review = repeated mistakes", text: "30 min Mon/Fri: surprise data / next experiment / interview insight." },
        ],
      }
    : {
        0: ko ? [
          { label: "감으로만 운영 — 1순위 폐업 사유", text: "한국은행 분석: 영업실적 악화(28.2%) > 경기 불투명(18.1%) > 자금난(18.1%). 매일 기록 없이는 어디서 새는지 모름. 첫 달부터 매일 5분만 기록." },
          { label: "첫 달 적자에 놀라 가격 인상 / 메뉴 축소 → 손님 이탈", text: "첫 달 적자는 정상. 단, 매주 숫자가 개선되어야 함. 4주차에 추세 확인 후 결정. 충동 결정은 회복 못 함." },
        ] : [
          { label: "Gut-only ops = #1 closure reason", text: "BoK: revenue decline 28.2%, outlook 18.1%, cash 18.1%. Daily 5-min log required." },
          { label: "Panic price hike in month 1 = lost customers", text: "Loss is normal. Verify weekly improvement. Decide at week 4." },
        ],
        1: ko ? [
          { label: "비상금이 임대료 1-2개월치만 있으면 작은 사고에 즉시 폐업", text: "냉장고 고장·식약처 점검·간판 사고 등 첫 해는 사고가 잦음. 최소 3개월 → 권장 6개월. 통장에 분리 보관 (영업통장 X)." },
          { label: "2026 25만원 바우처·정책자금 미신청 — 무료인데 안 쓰면 손해", text: "경영안정 바우처 (전기·가스·수도·4대보험) + 소진공 정책자금 2.96% 융자 + 지자체 임차료 지원. 2025.12.31 이전 개업한 영업 중 소상공인 대상." },
        ] : [
          { label: "Reserve = 1-2 mo rent? One small incident kills", text: "Fridge fail / inspection / signage repair common. Min 3mo, ideal 6mo, separate account." },
          { label: "Skipping 2026 250K KRW voucher = leaving money", text: "Stability voucher + 2.96% policy loan + local rent aid." },
        ],
        2: ko ? [
          { label: "프라임코스트 (재료+인건비) 65% 초과 시 적자 거의 확정", text: "외식업 평균 65% 이내. 75% 넘으면 메뉴 단가·원가율 즉시 재설계. 재료 도난·낭비도 첫 달이 가장 큼." },
          { label: "고정비만 줄이려다 매출까지 깎임", text: "직원 줄여 인건비 -10%지만 매출 -25%면 손해. 줄여도 되는 비용 vs 수익 직결 비용 구분. 한국 외식업 46.5%가 인력 감축한 시기 — 따라하지 말고 '내 가게 데이터'로 판단." },
        ] : [
          { label: "Prime cost >65% = near-certain loss", text: ">75% needs immediate menu/cost redesign." },
          { label: "Cutting fixed cuts revenue too", text: "Staff -10% but revenue -25% = net loss." },
        ],
        3: ko ? [
          { label: "리뷰 10개 이전에 광고 시작 = ROAS 음수", text: "네이버 플레이스 리뷰 10개 이전엔 광고 효율 50% 미만. 진성 리뷰 누적 (영수증 이벤트) 후 배민·인스타 광고 시작." },
          { label: "매일 기록 빠뜨리면 데이터 끊김 — 추세 분석 불가", text: "하루 5분, 같은 시간 (마감 직후 권장). 캐시노트·build.up 자동 집계 활용. 1주만 빼먹어도 첫 달 추세 파악 불가." },
        ] : [
          { label: "Ads before 10 reviews = negative ROAS", text: "Build genuine reviews first (receipt event)." },
          { label: "Skipped days break trend analysis", text: "5 min daily after closing. One missed week breaks month-1 view." },
        ],
      };

  // ─── 페이지 3: 주간 루틴 ───
  const weeklyRoutine = isStartup
    ? (ko ? [
        { day: "월", what: "[잔고 / 매출 / 번레이트 / 런웨이] 4개 한 화면 + 사용자 인터뷰 30분", icon: BarChart3 },
        { day: "화", what: "이번 주 1실험 빌드 시작 — 가설·측정 지표 명확히", icon: Lightbulb },
        { day: "수", what: "실험 출시 + 신규 사용자 첫 메시지 발송", icon: Star },
        { day: "목", what: "지표 중간 확인 → 미달 시 조기 종료, 다음 실험 준비", icon: TrendingUp },
        { day: "금", what: "사용자 인터뷰 30분 + 주간 리뷰 (놀란 데이터·인사이트·다음 가설)", icon: MessageSquare },
      ] : [
        { day: "Mon", what: "[cash / revenue / burn / runway] in one view + 30-min user interview", icon: BarChart3 },
        { day: "Tue", what: "Build week's experiment — hypothesis + metric defined", icon: Lightbulb },
        { day: "Wed", what: "Ship experiment + DM new users", icon: Star },
        { day: "Thu", what: "Mid-check → kill or extend", icon: TrendingUp },
        { day: "Fri", what: "30-min interview + weekly review", icon: MessageSquare },
      ])
    : (ko ? [
        { day: "월", what: "지난 주 매출·원가율·리뷰 정리 + 이번 주 메뉴/이벤트 결정", icon: BarChart3 },
        { day: "화", what: "재고·발주 점검 — 식자재 낭비 vs 부족 균형", icon: ClipboardList },
        { day: "수", what: "고객 응대 점검 + 신규 리뷰 답글 (24시간 내)", icon: MessageSquare },
        { day: "목", what: "SNS 1콘텐츠 (릴스·스토리) + 영수증 리뷰 이벤트 안내", icon: Star },
        { day: "금", what: "주말 운영 준비 + 직원 시프트·재고 최종 확인", icon: ShieldCheck },
      ] : [
        { day: "Mon", what: "Last week's sales/COGS/reviews + this week's menu/event", icon: BarChart3 },
        { day: "Tue", what: "Stock check — waste vs shortage balance", icon: ClipboardList },
        { day: "Wed", what: "Service review + reply to new reviews (<24h)", icon: MessageSquare },
        { day: "Thu", what: "1 SNS post + receipt review event", icon: Star },
        { day: "Fri", what: "Weekend prep — shifts + final stock", icon: ShieldCheck },
      ]);

  // ─── 도구 추천 (사용자 컨텍스트 기반) ───
  const tools = isStartup
    ? (ko ? [
        { name: "build.up 운영 대시보드", desc: "이 앱에서 바로 — 일별 매출·KPI 자동 분석 + AI 모닝 브리핑", badge: "지금 바로", primary: true },
        { name: "Mixpanel / PostHog", desc: "이벤트 기반 사용자 행동 분석 — 퍼널·리텐션·코호트 무료 시작", badge: "필수" },
        { name: "Notion / Linear", desc: "주간 리뷰 + 실험 로그 + OKR 관리. 인터뷰 노트 템플릿화", badge: "주간" },
      ] : [
        { name: "build.up Dashboard", desc: "In-app — daily KPIs + AI morning briefing", badge: "Now", primary: true },
        { name: "Mixpanel / PostHog", desc: "Event analytics, funnel, retention — free start", badge: "Essential" },
        { name: "Notion / Linear", desc: "Weekly review + experiments + OKR + interview templates", badge: "Weekly" },
      ])
    : (ko ? [
        { name: "build.up 내 가게 현황", desc: "이 앱에서 바로 — 일별 매출 + 비용 구조 + 업종 평균 비교 자동", badge: "지금 바로", primary: true },
        { name: "캐시노트 (CashNote)", desc: "카드사·POS 연동 자동 집계 — 일별 매출 무료 확인 (소상공인 1위 앱)", badge: "쉬움" },
        { name: "엑셀·구글 스프레드시트", desc: "자유도 최고 — 직접 수식 관리, 별도 학습 필요", badge: "고급" },
      ] : [
        { name: "build.up My Store", desc: "In-app daily sales + cost structure + industry comparison", badge: "Now", primary: true },
        { name: "CashNote", desc: "Auto-sync POS — free daily view, #1 SMB app", badge: "Easy" },
        { name: "Excel / Sheets", desc: "Max flexibility — DIY formulas", badge: "Power" },
      ]);

  // ─── 디자인 토큰 ───
  const sectionLabel: React.CSSProperties = {
    fontSize: "12.5px", fontWeight: 600, color: "rgba(0,0,0,0.45)",
    textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "10px",
  };

  // ─── KEY ACTION 히어로 ───
  const KeyActionCard = () => {
    const ka = keyActions[pg];
    if (!ka) return null;
    return (
      <div style={{
        display: "flex", gap: "14px", alignItems: "flex-start",
        padding: "16px 18px", borderRadius: "16px",
        background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.92) 100%)`,
        color: "#fff", marginBottom: "18px",
        boxShadow: "0 6px 20px rgba(25,25,112,0.28)",
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, backdropFilter: "blur(8px)",
        }}>
          <ShieldCheck size={20} strokeWidth={2.2} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, opacity: 0.7, marginBottom: "4px" }}>
            {ko ? "이 단계에서 꼭 할 일" : "Do this in this stage"}
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.4, marginBottom: "5px" }}>
            {ka.title}
          </div>
          <div style={{ fontSize: "13.5px", lineHeight: 1.55, opacity: 0.92 }}>
            {ka.detail}
          </div>
        </div>
      </div>
    );
  };

  // ─── 트랩 카드 ───
  const TrapsCard = () => {
    const ts = traps[pg] ?? [];
    if (ts.length === 0) return null;
    return (
      <div style={{ display: "grid", gap: "8px", marginTop: "16px" }}>
        {ts.map((trap) => (
          <div key={trap.label} style={{
            display: "flex", gap: "10px", alignItems: "flex-start",
            padding: "13px 15px", borderRadius: "14px",
            background: "rgba(220,60,30,0.06)", border: "1px solid rgba(200,60,30,0.16)",
          }}>
            <AlertTriangle size={18} strokeWidth={2} style={{ color: "#b83020", flexShrink: 0, marginTop: "1px" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#b83020", marginBottom: "3px", letterSpacing: "-0.01em" }}>{trap.label}</div>
              <div style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(184,48,32,0.85)" }}>{trap.text}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ─── 사용자 컨텍스트 카드 (입력 데이터 요약) ───
  const ContextCard = () => {
    const items = [
      storeName ? { icon: Building2, label: ko ? "가게 이름" : "Store", value: storeName } : null,
      industryCategoryId ? {
        icon: ClipboardList,
        label: ko ? "업종" : "Industry",
        value: `${industryCategoryId}${(profile as { subIndustryId?: string } | null)?.subIndustryId ? ` · ${(profile as { subIndustryId: string }).subIndustryId}` : ""}${startupType && startupType !== "undecided" ? ` · ${startupType === "franchise" ? (ko ? "프랜차이즈" : "franchise") : (ko ? "독립" : "independent")}` : ""}`,
      } : null,
      preferredRegionInput ? { icon: MapPin, label: ko ? "지역" : "Region", value: preferredRegionInput } : null,
      (selectedBudget ?? 0) > 0 ? { icon: Wallet, label: ko ? "초기 자본" : "Capital", value: fmtKrw(selectedBudget as number) } : null,
      businessLaunched && businessLaunchedDate
        ? { icon: Calendar, label: ko ? "개업일" : "Launched", value: `${new Date(businessLaunchedDate as string).toLocaleDateString(ko ? "ko-KR" : "en-US")}${daysSinceLaunch !== null ? ` (${daysSinceLaunch}${ko ? "일째" : "d"})` : ""}` }
        : null,
    ].filter((x): x is { icon: typeof Building2; label: string; value: string } => x !== null);

    if (items.length === 0) return null;

    return (
      <div style={{
        background: "rgba(25,25,112,0.04)",
        border: "1px solid rgba(25,25,112,0.12)",
        borderRadius: "14px",
        padding: "12px 14px",
        marginBottom: "16px",
      }}>
        <div style={{
          fontSize: "11px", fontWeight: 700,
          color: MIDNIGHT, letterSpacing: "0.08em",
          textTransform: "uppercase" as const, marginBottom: "8px",
        }}>
          {ko ? "내 입력 정보로 분석" : "Personalized from your inputs"}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}>
                <Icon size={13} strokeWidth={2} style={{ color: MIDNIGHT, flexShrink: 0 }} />
                <span style={{ color: "rgba(0,0,0,0.55)" }}>{it.label}:</span>
                <span style={{ fontWeight: 700, color: MIDNIGHT, letterSpacing: "-0.01em" }}>{it.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* ── 페이지 네비 — 미드나이트 ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "8px" }}>
        <button type="button" disabled={pg === 0} onClick={() => setGuideStepIndex((p: number) => p - 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(25,25,112,0.1)",
          background: pg === 0 ? "rgba(0,0,0,0.02)" : "white", color: pg === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: pg === 0 ? "default" : "pointer",
        }}>← {ko ? "이전" : "Prev"}</button>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" as const, justifyContent: "center" }}>
          {pgLabels.map((l, i) => (
            <button key={i} type="button" onClick={() => setGuideStepIndex(i)} style={{
              padding: "5px 12px", borderRadius: "999px", fontSize: "11.5px", fontWeight: i === pg ? 700 : 500,
              background: i === pg ? MIDNIGHT : "transparent", color: i === pg ? "#fff" : "rgba(15,23,42,0.45)",
              border: i === pg ? "none" : "1px solid rgba(25,25,112,0.1)", cursor: "pointer",
              letterSpacing: "-0.01em",
              boxShadow: i === pg ? "0 2px 6px rgba(25,25,112,0.22)" : "none",
              transition: "all 0.15s",
            }}>{l}</button>
          ))}
        </div>
        <button type="button" disabled={pg === totalPg - 1} onClick={() => setGuideStepIndex((p: number) => p + 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "none",
          background: pg === totalPg - 1 ? "rgba(0,0,0,0.02)" : MIDNIGHT,
          color: pg === totalPg - 1 ? "rgba(0,0,0,0.2)" : "#fff",
          fontSize: "13px", fontWeight: 600, cursor: pg === totalPg - 1 ? "default" : "pointer",
          boxShadow: pg === totalPg - 1 ? "none" : "0 4px 14px rgba(25,25,112,0.25)",
        }}>{ko ? "다음" : "Next"} →</button>
      </div>

      {/* ── 페이지 헤더 ── */}
      <div>
        <div style={{ fontSize: "11.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>
          {ko ? `${pg + 1}단계 / ${totalPg}` : `Step ${pg + 1} / ${totalPg}`}
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.3 }}>
          {pgLabels[pg]}
        </div>
      </div>

      {/* ── 사용자 입력 컨텍스트 (모든 페이지) ── */}
      <ContextCard />

      {/* ── KEY ACTION 히어로 (모든 페이지) ── */}
      <KeyActionCard />

      {/* ── Page 0: 왜 ── */}
      {pg === 0 && (
        <>
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", padding: "16px 18px" }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "10px" }}>
              {isStartup
                ? (ko ? "첫 달 = 학습 기간. 매출보다 'PMF 신호'를 추적합니다" : "Month 1 = learning period. Track PMF signals over revenue")
                : (ko ? "첫 달 = 폐업률 가장 높은 시기. 데이터 기록이 생존 1순위" : "Month 1 has the highest closure rate — daily data is survival #1")}
            </div>
            <div style={{ fontSize: "13.5px", color: "rgba(0,0,0,0.6)", lineHeight: 1.65 }}>
              {isStartup
                ? (ko ? "★ 한국 스타트업 폐업률 2024년 85.2%. 첫 달은 매출 < 비용이 정상이지만 (1) D7 retention ≥20% (2) 사용자 10명 인터뷰 (3) 매주 1실험이 안 되면 6개월 후 위험. PH·HN 트래픽이 빠지는 D+8~D+30이 진짜 시험." : "★ Korean SMB closure rate 2024: 85.2%. Month 1 = loss is normal IF (1) D7 ≥20% (2) 10 user interviews (3) weekly experiments. Real test: D+8 to D+30 after launch traffic.")
                : (ko ? "★ 한국 자영업 2024 폐업률 85.2% — 폐업 사유: 영업실적 악화(28.2%) > 경기 불투명(18.1%) > 자금난(18.1%) > 임차료(11.9%). 통계청: 세부 계획 없는 창업은 첫해 폐업률 1.7배. 매일 5분 기록 + 주간 리뷰가 가장 강한 무기." : "★ Korea SMB 2024 closure 85.2%. Reasons: revenue decline 28.2% > outlook 18.1% > cash 18.1% > rent 11.9%. Daily 5-min log + weekly review = strongest defense.")}
            </div>
          </div>

          <TrapsCard />
        </>
      )}

      {/* ── Page 1: 비상금 / 런웨이 ── */}
      {pg === 1 && (
        <>
          {/* 사용자 입력 기반 카드 */}
          <div>
            <div style={sectionLabel}>
              {isStartup ? (ko ? "현금 런웨이 (사용자 입력 기준)" : "Cash Runway (from your inputs)")
                : (ko ? "비상금 목표 (사용자 입력 기준)" : "Reserve Target (from your inputs)")}
            </div>
            {fixedCosts > 0 ? (
              <div style={{
                background: "white", borderRadius: "16px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                overflow: "hidden",
              }}>
                {/* 큰 숫자 */}
                <div style={{
                  padding: "20px 18px",
                  background: `linear-gradient(180deg, rgba(25,25,112,0.04) 0%, rgba(25,25,112,0) 100%)`,
                  borderBottom: "0.5px solid rgba(0,0,0,0.07)",
                }}>
                  <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)", marginBottom: "4px", letterSpacing: "-0.01em" }}>
                    {isStartup
                      ? (ko ? "현재 런웨이" : "Current runway")
                      : (ko ? "권장 비상금 (월 고정비 × 6개월)" : "Recommended reserve (fixed × 6mo)")}
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: MIDNIGHT, letterSpacing: "-0.02em" }}>
                    {isStartup
                      ? (runwayMonths !== null ? `${runwayMonths}${ko ? "개월" : " mo"}` : "-")
                      : fmtKrw(emergencyTarget6mo)}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.55)", marginTop: "4px", lineHeight: 1.5 }}>
                    {isStartup
                      ? (ko
                          ? `초기 자본 ${fmtKrw(selectedBudget ?? 0)} ÷ 월 고정비 ${fmtKrw(fixedCosts)}`
                          : `Capital ${fmtKrw(selectedBudget ?? 0)} ÷ fixed ${fmtKrw(fixedCosts)}`)
                      : (ko
                          ? `최소 ${fmtKrw(emergencyTarget3mo)} (3개월) → 권장 ${fmtKrw(emergencyTarget6mo)} (6개월)`
                          : `Min ${fmtKrw(emergencyTarget3mo)} (3mo) → recommended ${fmtKrw(emergencyTarget6mo)} (6mo)`)}
                  </div>
                </div>

                {/* 비용 분해 (입력값 그대로 표시) */}
                <div style={{ padding: "10px 0" }}>
                  {[
                    { label: ko ? "임대료" : "Rent", val: mc.rent ?? 0 },
                    { label: ko ? "인건비" : "Labor", val: mc.labor ?? 0 },
                    { label: ko ? "공과금" : "Utilities", val: mc.utilities ?? 0 },
                    { label: ko ? "대출이자" : "Interest", val: mc.interest ?? 0 },
                  ].filter(x => x.val > 0).map((row, i, arr) => (
                    <div key={row.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 18px" }}>
                        <span style={{ fontSize: "13px", color: "rgba(0,0,0,0.6)" }}>{row.label}</span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{fmtKrw(row.val)}</span>
                      </div>
                      {i < arr.length - 1 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "18px" }} />}
                    </div>
                  ))}
                  <div style={{ height: "0.5px", background: "rgba(0,0,0,0.12)", margin: "6px 18px" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 18px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{ko ? "월 고정비 합계" : "Fixed total"}</span>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: MIDNIGHT, letterSpacing: "-0.01em" }}>{fmtKrw(fixedCosts)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                background: "white", borderRadius: "16px", border: "1px dashed rgba(25,25,112,0.2)",
                padding: "20px 18px", textAlign: "center",
              }}>
                <Wallet size={28} strokeWidth={1.5} style={{ color: MIDNIGHT, marginBottom: "8px", opacity: 0.6 }} />
                <div style={{ fontSize: "13.5px", color: "rgba(0,0,0,0.65)", lineHeight: 1.55 }}>
                  {ko ? "운영 대시보드 → 내 가게 현황에서 월 고정비 (임대료·인건비·공과금·이자)를 입력하면 비상금 목표가 자동 계산됩니다." : "Enter monthly fixed costs in My Store to auto-compute reserve."}
                </div>
              </div>
            )}
          </div>

          <TrapsCard />
        </>
      )}

      {/* ── Page 2: 첫 달 KPI / 비용 비율 ── */}
      {pg === 2 && (
        <>
          {!isStartup && ratios && (
            <div>
              <div style={sectionLabel}>{ko ? "내 비용 구조 vs 업종 평균" : "Your costs vs industry"}</div>
              <div style={{
                background: "white", borderRadius: "16px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                overflow: "hidden",
              }}>
                {/* 프라임코스트 강조 */}
                <div style={{
                  padding: "16px 18px",
                  background: ratios.primeCostStatus === "critical"
                    ? "rgba(220,60,30,0.06)"
                    : ratios.primeCostStatus === "warning"
                      ? "rgba(245,158,11,0.06)"
                      : "rgba(34,167,73,0.04)",
                  borderBottom: "0.5px solid rgba(0,0,0,0.07)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    {ratios.primeCostStatus === "critical" ? <TrendingDown size={16} color="#b83020" />
                      : ratios.primeCostStatus === "warning" ? <AlertTriangle size={16} color="#d97706" />
                      : <TrendingUp size={16} color="rgb(34,167,73)" />}
                    <span style={{
                      fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em",
                      color: ratios.primeCostStatus === "critical" ? "#b83020"
                        : ratios.primeCostStatus === "warning" ? "#d97706"
                        : "rgb(34,167,73)",
                    }}>
                      {ko ? "프라임코스트 (재료비 + 인건비)" : "Prime Cost (Ingredients + Labor)"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                    <span style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em", color: MIDNIGHT }}>{ratios.primeCost}%</span>
                    <span style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.55)" }}>
                      {ko ? `업종 평균 ≤ ${primeCostMax}%` : `Industry ≤ ${primeCostMax}%`}
                    </span>
                  </div>
                </div>

                {/* 항목별 비율 */}
                <div style={{ padding: "10px 0" }}>
                  {[
                    { label: ko ? "재료비" : "Ingredients", val: ratios.ingredients, target: industryRatios?.ingredients as readonly [number, number] | undefined },
                    { label: ko ? "인건비" : "Labor", val: ratios.labor, target: industryRatios?.labor as readonly [number, number] | undefined },
                    { label: ko ? "임대료" : "Rent", val: ratios.rent, target: industryRatios?.rent as readonly [number, number] | undefined },
                  ].map((row, i) => {
                    const inRange = row.target ? (row.val >= row.target[0] && row.val <= row.target[1]) : null;
                    return (
                      <div key={row.label}>
                        <div style={{ display: "flex", alignItems: "center", padding: "10px 18px", gap: "10px" }}>
                          <span style={{ flex: 1, fontSize: "13px", color: "rgba(0,0,0,0.7)" }}>{row.label}</span>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "-0.01em" }}>{row.val}%</span>
                          {row.target && (
                            <span style={{
                              fontSize: "11px", fontWeight: 600,
                              padding: "2px 8px", borderRadius: 999,
                              background: inRange ? "rgba(34,167,73,0.1)" : "rgba(245,158,11,0.1)",
                              color: inRange ? "rgb(34,167,73)" : "#d97706",
                            }}>
                              {ko ? `평균 ${row.target[0]}~${row.target[1]}%` : `${row.target[0]}-${row.target[1]}%`}
                            </span>
                          )}
                        </div>
                        {i < 2 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "18px" }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 첫 달 핵심 원칙 */}
          <div>
            <div style={sectionLabel}>
              {isStartup ? (ko ? "첫 달 — 생존 원칙 5" : "Month 1 Survival Rules")
                : (ko ? "첫 달 — 가장 중요한 5가지" : "Month 1 — Top 5")}
            </div>
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              {(isStartup ? (ko ? [
                { title: "북극성 지표 1개 매일 동일 시간 확인", desc: "DAU·핵심 액션 완료율·자발 추천 중 하나만. 5개 보면 결국 0개 봄." },
                { title: "사용자 10명 첫 2주 내 직접 인터뷰", desc: "왜 가입했는지·뭐가 불편한지·계속 쓸 건지. PMF의 단서는 정성에서만." },
                { title: "D7 retention ≥ 20% 확인", desc: "PH·HN 트래픽 빠진 D+8~D+30이 진짜 시험. <20%면 제품 재정의." },
                { title: "주간 1실험 반드시 출시", desc: "가설 → 빌드 → 측정 → 학습. 매주 하나가 성장 엔진." },
                { title: "번레이트 매주 체크", desc: "잔고만 보면 위험. [잔고 / 매출 / 번레이트 / 런웨이] 한 화면." },
              ] : [
                { title: "1 North Star daily, same time", desc: "Compress to one (DAU/GMV/retention)." },
                { title: "10 user interviews in 2 weeks", desc: "Qual signal cannot come from numbers alone." },
                { title: "D7 retention ≥ 20%", desc: "Real test: D+8 to D+30 after launch traffic." },
                { title: "Ship 1 experiment per week", desc: "Hypothesis → build → measure → learn." },
                { title: "Burn rate weekly", desc: "[cash / revenue / burn / runway] in one view." },
              ]) : (ko ? [
                { title: "매일 매출·비용 5분 기록", desc: "감이 아닌 숫자로 판단. 1주 빠지면 추세 분석 불가." },
                { title: "프라임코스트 65% 이내 유지", desc: "재료비 + 인건비 합계. 75% 넘으면 메뉴·원가 즉시 재설계." },
                { title: "고객 피드백 첫 2주 내 적극 수집", desc: "불만 고객은 말하지 않고 떠남. 영수증 리뷰 이벤트 + 직접 질문." },
                { title: "네이버 플레이스 리뷰 10개 확보 후 광고", desc: "리뷰 < 10이면 광고 ROAS 음수. 진성 리뷰 누적 우선." },
                { title: "적자여도 3개월 — 단, 매주 개선", desc: "초기 적자는 정상. 4주차에 추세 확인 후 결정. 충동 결정 금물." },
              ] : [
                { title: "Daily 5-min log", desc: "Numbers over gut. Missing a week breaks trend." },
                { title: "Prime cost ≤ 65%", desc: ">75% requires immediate redesign." },
                { title: "Collect feedback in 2 weeks", desc: "Receipt review event + direct questions." },
                { title: "Hold ads until 10+ reviews", desc: "ROAS negative below 10 reviews." },
              ])).map((item, i, arr) => (
                <div key={item.title}>
                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "rgba(25,25,112,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, color: MIDNIGHT,
                      fontSize: "13px", fontWeight: 800,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "3px" }}>{item.title}</div>
                      <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55 }}>{item.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <TrapsCard />
        </>
      )}

      {/* ── Page 3: 주간 루틴 + 도구 ── */}
      {pg === 3 && (
        <>
          {/* 주간 루틴 */}
          <div>
            <div style={sectionLabel}>{ko ? "주간 루틴 — 같은 요일·같은 시간" : "Weekly Routine — Same Day, Same Time"}</div>
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              {weeklyRoutine.map((row, i) => {
                const Icon = row.icon;
                return (
                  <div key={row.day}>
                    {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "rgba(25,25,112,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, color: MIDNIGHT,
                        fontSize: "13px", fontWeight: 800,
                      }}>
                        {row.day}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, paddingTop: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                          <Icon size={13} strokeWidth={2} style={{ color: MIDNIGHT }} />
                        </div>
                        <div style={{ fontSize: "13.5px", color: "var(--text)", letterSpacing: "-0.01em", lineHeight: 1.5 }}>{row.what}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 도구 */}
          <div style={{ marginTop: "16px" }}>
            <div style={sectionLabel}>{ko ? "기록 도구" : "Tracking Tools"}</div>
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              {tools.map((t, i) => (
                <div key={t.name}>
                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "16px" }} />}
                  <div style={{ display: "flex", alignItems: "center", padding: "13px 16px", gap: "12px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>{t.name}</div>
                      <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.55)", lineHeight: 1.5, marginTop: "2px" }}>{t.desc}</div>
                    </div>
                    <span style={{
                      fontSize: "11px", fontWeight: 700,
                      padding: "3px 10px", borderRadius: 999,
                      background: t.primary ? MIDNIGHT : "rgba(25,25,112,0.08)",
                      color: t.primary ? "#fff" : MIDNIGHT,
                      flexShrink: 0,
                      boxShadow: t.primary ? "0 2px 6px rgba(25,25,112,0.22)" : "none",
                    }}>
                      {t.badge}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <TrapsCard />
        </>
      )}

      <StageWrapup
        ko={ko}
        nextStageLabelKo="대출·정부지원금 검토"
        doneItemsKo={[
          { label: "1. 매출·비용 4축 점검", detail: "재료비·인건비·임대료·기타 4축 vs 업종 평균 비교" },
          { label: "2. 손익분기·런웨이 산출", detail: "월별 BEP 도달 시점 + 보유 자본 잔여 개월 자동 계산" },
          { label: "3. 첫 달 KPI 리뷰", detail: "객단가·회전수·재방문률·CSAT 4지표 vs 사업계획 비교" },
          { label: "4. 다음 달 액션 도출", detail: "원가율 초과·고정비 부담·매출 미달 — 카테고리별 대응책 1개씩" },
        ]}
        verifyItemsKo={[
          "재료비 30% 초과 — 메뉴 리뉴얼·공급처 재계약 즉시 검토 (지속 시 흑자부도 위험)",
          "인건비 25% 초과 — 근무시간·시급·근태 관리 시스템 점검, 5인 이상은 연장수당 정확 계산",
          "임대료 15% 초과 — 1년차에 매출 회복 안 되면 재계약 시 재협상 또는 이전 검토",
          "재방문률 30% 미만 — 메뉴·서비스·매장 청결 등 만족도 직접 인터뷰 (신호 무시 시 폐업 1순위)",
          "현금흐름 — 매출 vs 결제 정산일 차이로 흑자 보이지만 실현금 부족, 14일 예측 셋업 필수",
          "세금 미수령 매출 — 현금 매출은 「현금영수증 의무발급」 위반 시 거래액 20% 과태료, 월 누락 0원 룰",
        ]}
        nextSummaryKo="첫 달 손익·KPI 점검 완료 → 대출·정부지원금 검토 단계로 진입 (필요 시)"
      />
    </div>
  );
}
