"use client";

import { useRef, useState } from "react";
import { MapPin, BarChart3, Users } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import {
  buildMarketScoreNarrative,
  buildRecommendedMarkets,
  evaluateDirectMarket,
  formatMarketMetaValue,
  getFranchiseBrandById,
  getFreshnessPresentation,
  loadBestMarketSignal,
  localizeRecommendationItem,
} from "@foundone/shared";
import { LocationMapPanel } from "../../LocationMapPanel";
import MarketSnapshotPanel from "./MarketSnapshotPanel";
import { supabase } from "../../../../../lib/supabase";
import {
  KeyActionHero,
  StageTabNav,
  StageOverview,
  WorkStep,
} from "../shared/StageActionHero";
import { StageWrapup } from "../shared/StageWrapup";

export function LocationCandidatesStage() {
  const d = useDashboardCtx();
  const {
    language,
    copy,
    // Industry
    industryCategoryId,
    selectedIndustryId,
    isDigitalCategory,
    // Startup type / franchise
    startupType,
    selectedFranchiseBrandId,
    // Location
    locationOptions,
    selectedLocationId, setSelectedLocationId,
    canCompleteLocationStep, handleLocationContinue,
    preferredRegionInput, setPreferredRegionInput,
    locationMode, setLocationMode,
    setRecommendedMarkets, hasCuratedMarket,
    customMarketName, setCustomMarketName,
    customMarketReason, setCustomMarketReason,
    manualMarketEvaluation, setManualMarketEvaluation,
    manualAlternative, setManualAlternative,
    activeLocationCandidates, finalSelectedMarket,
    locationRegionLabel, locationHelpText,
    locationRecommendedLabel, locationDirectLabel,
    locationInputPlaceholder,
    customLocationLabel,
    customLocationPlaceholder, customLocationReasonPlaceholder,
    scoreLocationLabel, selectedLocationDetailLabel,
    selectedBudget,
    aiMarketRegion, setAiMarketRegion,
    // AI + Kakao 라이브 상권 추천
    aiMarketLoading, setAiMarketLoading, aiMarketError, setAiMarketError,
    // Navigation
    prevTraversedStage, setViewingStageId,
    // Reset
    resetDemo,
    // Edit
    handleStageEdit,
    decisions,
    editSaveStatus,
    isViewingPastStage,
  } = d;

  // ─── 업종군 분기 (2026-07-02 업종 정합 감사) ───────────────────────────
  //   매물 체크(면적·필수설비)·마무리가 외식 전용(테이블 수·환기 덕트·메뉴)이던 문제 → offlineKind 로 분기.
  const offlineKind: "food" | "retail" | "beauty" | "fitness" | "pet" | "space" | "service" =
    industryCategoryId === "food" || industryCategoryId === "cafe-dessert" ? "food"
    : industryCategoryId === "retail" ? "retail"
    : industryCategoryId === "beauty" ? "beauty"
    : industryCategoryId === "fitness" ? "fitness"
    : industryCategoryId === "pet" ? "pet"
    : industryCategoryId === "education" || industryCategoryId === "space" ? "space"
    : "service";
  // 면적 — 업종별 최소 기준 (매물 체크 how)
  const areaDetail: Record<typeof offlineKind, { ko: string; en: string }> = {
    food: { ko: "15평 이하 = 배달·테이크아웃 전용. 15~25평 = 테이블 6~10개. 25~40평 = 홀 직원 1~2명 필요. 40평+ = 인건비 비중 급증.", en: "<15 pyeong: delivery/take-away only. 15-25: 6-10 tables. 25-40: 1-2 floor staff. 40+: labour cost spikes." },
    retail: { ko: "매장 면적 = 진열 SKU 수 직결. 10평 이하 = 소품·편의 위주. 10~25평 = 카테고리 2~3개. 입고·창고·하역 동선 별도 확보.", en: "Area drives SKU count. <10: convenience only. 10-25: 2-3 categories. Reserve stockroom/loading path." },
    beauty: { ko: "미용 1석당 약 3~4평(대기·샴푸 포함). 10평 = 2~3석, 20평 = 5~6석. 네일·속눈썹은 좌석 밀도 높게 가능.", en: "~3-4 pyeong per chair (incl. wait/wash). 10=2-3 chairs, 20=5-6. Nail/lash can pack denser." },
    fitness: { ko: "종목별 상이 — PT 스튜디오 15평~, 필라테스 기구 1대당 3~4평, 헬스장 30평+ 권장. 층고 2.7m+ 확인.", en: "Varies — PT studio 15+, pilates ~3-4 per reformer, gym 30+. Check ceiling ≥2.7m." },
    pet: { ko: "미용·호텔·병원 등 동선 분리 필요. 소음·냄새 민감 — 환기·방음 확보. 대형견 취급 시 여유 공간.", en: "Separate grooming/hotel/clinic zones. Ventilation & soundproofing; extra room for large dogs." },
    space: { ko: "좌석/룸 단위 수익 — 스터디카페 20평 ≈ 30~40석, 파티룸·연습실은 룸 수 기준으로 면적 산정.", en: "Revenue per seat/room — study-café 20 pyeong ≈ 30-40 seats; party/practice rooms sized by room count." },
    service: { ko: "업종별 상이 — 대면형은 상담·작업 공간, 출장형은 창고·주차 위주. 최소 기준을 업종 인허가로 먼저 확인.", en: "Varies — in-person needs consult/work space; mobile needs storage/parking. Check permit minimums." },
  };
  // 매물 필수 설비 (덕트 대체 — 업종별)
  const infraCheck: Record<typeof offlineKind, { titleKo: string; titleEn: string; detailKo: string; detailEn: string }> = {
    food: { titleKo: "환기·덕트 설치 가능 여부", titleEn: "Ventilation duct feasible?", detailKo: "음식점·카페는 외부 환기 덕트 필수. 건물 구조상 설치 불가하면 영업 허가 자체가 불가. 임대인에게 반드시 사전 확인.", detailEn: "Food/café require exterior duct. Structurally impossible = no operating permit. Confirm with landlord upfront." },
    retail: { titleKo: "하역·재고 동선 + 간판 전기", titleEn: "Loading path + signage power", detailKo: "택배·입고 동선과 창고 공간, 간판·조명 전기 용량 확인. 냉장·냉동 취급 시 전용 회로 필요.", detailEn: "Check loading/stock path, signage/lighting power. Refrigerated goods need dedicated circuits." },
    beauty: { titleKo: "급배수·전기 용량·환기", titleEn: "Plumbing / power / ventilation", detailKo: "샴푸대·기기 급배수 + 드라이어·펌기 동시 사용 전기 용량 확인. 약품 냄새 환기도 점검. 임대인에게 사전 확인.", detailEn: "Shampoo/equipment plumbing + power for dryers/perm machines; chemical-odor ventilation. Confirm upfront." },
    fitness: { titleKo: "층고·바닥 하중·방음", titleEn: "Ceiling / floor load / soundproof", detailKo: "기구·점프 하중과 층고(2.7m+), 아래층 방음(고무매트·이중바닥) 사전 확인. 샤워실 급배수도 점검.", detailEn: "Equipment/jump load, ceiling ≥2.7m, downstairs soundproofing, shower plumbing." },
    pet: { titleKo: "급배수·방음·환기", titleEn: "Plumbing / soundproof / ventilation", detailKo: "미용·목욕 급배수, 짖음 방음, 냄새 환기 필수. 위생·소독 설비 공간도 확보. 임대인에게 사전 확인.", detailEn: "Grooming/bath plumbing, bark soundproofing, odor ventilation, sanitation space." },
    space: { titleKo: "방음·전기 용량·보안", titleEn: "Soundproof / power / security", detailKo: "연습실·파티룸은 방음, 스터디카페·무인은 전기 용량(콘센트 밀도)·CCTV·출입통제 사전 확인.", detailEn: "Practice/party rooms need soundproofing; study-café/unmanned need power density, CCTV, access control." },
    service: { titleKo: "업종별 필수 설비 확인", titleEn: "Required facilities by trade", detailKo: "업종 인허가 기준의 필수 설비(급배수·전기·환기 등)를 사전 확인. 임대인에게 설치 가능 여부 확인.", detailEn: "Confirm permit-required facilities (plumbing/power/ventilation) and landlord approval upfront." },
  };

  // ⚠️ 2026-05-18: && isViewingPastStage 추가 — 첫 진입 화면에는 노출 안 되고 사용자가 명시적으로
  //   완료된 stage 로 돌아왔을 때만 "수정 저장" 표시 (메모 feedback_edit_save_pattern 패턴).
  const isStageCompleted = !!decisions["location-candidates"]?.completedAt && isViewingPastStage;
  // 수정 저장 진행 상태 → 버튼 라벨/색 동기화
  const _editStatus = editSaveStatus?.stageId === "location-candidates" ? editSaveStatus.status : null;
  const _editLabel = _editStatus === "saving"
    ? (language === "ko" ? "저장 중..." : "Saving...")
    : _editStatus === "saved"
      ? (language === "ko" ? "✓ 수정 완료" : "✓ Saved")
      : _editStatus === "error"
        ? (language === "ko" ? "⚠ 다시 시도" : "⚠ Retry")
        : (language === "ko" ? "✓ 수정 저장" : "✓ Save edits");
  const _editBg = _editStatus === "saved" ? "#1d3557" : _editStatus === "error" ? "#b64c4c" : "#1d3557";

  const locationRef = useRef<HTMLDivElement>(null);
  const [shakeWarning, setShakeWarning] = useState(false);
  // ⚠️ 페이지네이션 — 한 화면 = 한 흐름. 사용자 피드백으로 스크롤 분량 줄임.
  const [pageIdx, setPageIdx] = useState(0);

  // 브랜드 시도 분포 노트 (프랜차이즈 선택자 전용, 응답 최상위 필드)
  const [franchiseRegionalNote, setFranchiseRegionalNote] = useState<string | null>(null);

  // ── AI 라이브 추천 핸들러 ────────────────────────────────────────
  //  사용자가 입력한 희망 지역 → 카카오 Local 라이브 검색 → Claude 점수화 → recommendedMarkets 갱신.
  //  결과는 LocationMapPanel 이 meta.lat/lng 를 직접 사용해 즉시 핀 표시.
  const requestAiMarketRecommend = async () => {
    const region = preferredRegionInput.trim();
    if (!region) return;
    setAiMarketLoading(true);
    setAiMarketError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        setAiMarketError(language === "ko" ? "로그인이 필요합니다." : "Sign-in required");
        setAiMarketLoading(false);
        return;
      }
      const res = await fetch("/api/data/market-recommend", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          region,
          categoryId: industryCategoryId,
          subIndustryId: selectedIndustryId,
          capital: selectedBudget,
          language,
          // 프랜차이즈 선택자 — 같은 브랜드·동종 브랜드 반경 실측 활성화 (2026-08-03)
          franchiseBrandId: startupType === "franchise" ? selectedFranchiseBrandId : undefined,
        }),
      });
      const data = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok || !data?.ok) {
        setAiMarketError(
          typeof data?.error === "string"
            ? data.error
            : (language === "ko" ? "AI 추천에 실패했습니다." : "AI recommendation failed"),
        );
        setAiMarketLoading(false);
        return;
      }
      // 점수 높은 순으로 정렬해 selectedLocation 자동 첫 번째 (사용자 클릭 우선)
      const items = (data.items as Array<{ score?: number }>).slice().sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      setRecommendedMarkets(items as never);
      // 브랜드 시도 분포 (공정위 신형 가족 단일 출처 — 구형 수치와 병기 금지 원칙)
      setFranchiseRegionalNote(typeof data.franchiseRegional === "string" ? data.franchiseRegional : null);
      setLocationMode("recommended");
      // AI 결과 보존 — useDataLoading 큐레이션 effect 가 이 지역에선 덮어쓰지 않게 (2026-08-03)
      setAiMarketRegion(region);
      setManualMarketEvaluation(null);
      setManualAlternative(null);
    } catch (e) {
      setAiMarketError(e instanceof Error ? e.message : (language === "ko" ? "네트워크 오류" : "Network error"));
    } finally {
      setAiMarketLoading(false);
    }
  };

  // ─── 4단 흐름: 왜 중요 → 뭘 해야 → 뭘 주의 → 사장님 상황에 유리한 길 ───
  const ko = language === "ko";
  // ★ 페이지 0 = 개요. 그 후 작업 흐름.
  const pageLabels = ko
    ? ["개요", "1. 지역·AI", "2. 답사 후보", "3. 점수 비교", "4. 매물 체크", "후보 비교·결정", "마무리"]
    : ["Overview", "1. Region·AI", "2. Visit", "3. Score", "4. Property", "Decide", "Wrap-up"];

  // 카테고리·예산 별 사장님 상황 권장 — 페이지 2 (점수 비교) 의 inline favorable
  const budgetTier = (selectedBudget ?? 0) >= 200_000_000 ? "high" : (selectedBudget ?? 0) >= 80_000_000 ? "mid" : "low";
  const compareFavorable: Record<string, { context: string; recommendation: string; rationale: string }> = {
    food: {
      context: budgetTier === "low" ? "예산 8천만원 이하 + 음식점" : budgetTier === "mid" ? "예산 8천~2억 + 음식점" : "예산 2억+ + 음식점",
      recommendation: budgetTier === "low" ? "메인 1블록 안쪽 이면 골목 — 임대료 30~40% 절감 + 단골 모델"
        : budgetTier === "mid" ? "준메인 + 점심·저녁 직장인 수요 가시권"
        : "메인 상권 + 코너·1층 가시성 — 회전율 모델",
      rationale: budgetTier === "low" ? "유동 1/3 손실 vs 임대료 1/2 절감 = 단골 60%+ 흑자 가능. 인스타·네이버 플레이스로 메인 효과 일부 회복."
        : budgetTier === "mid" ? "메인은 임대료 회수 4~5년. 준메인은 회전 + 단골 모두 노려 수지 균형 좋음."
        : "메인은 회전율 = 매출. 임대료 부담 크지만 매출 천장 높아 객단가 8천~1.2만 모델 BEP 빠름.",
    },
    "cafe-dessert": {
      context: "카페 / 디저트",
      recommendation: budgetTier === "low" ? "주거지 인접 + 산책 동선 — 단골 모델" : "메인 + 인스타 가능한 외관 — SNS 바이럴",
      rationale: budgetTier === "low" ? "동네 카페는 단골 70%+ 가 매출 결정. 일관 동선 + 친절이 더 효율." : "메인 + 사진 잘 나오는 외관 = 인스타 자동 마케팅, 광고비 0.",
    },
    retail: { context: "리테일 / 셀렉트샵", recommendation: "메인 1블록 안쪽 골목 셀렉트샵 — 인스타로 발견되는 모델",
      rationale: "메인 1층 임대료 부담 ↑. 골목 + 컨셉 외관 + SNS 마케팅으로 「발견하는 가게」 포지셔닝." },
    beauty: { context: "미용·뷰티", recommendation: "지하철 도보 5분 + 1~2층 (3층+ 회피)",
      rationale: "예약 모델은 접근성이 매출 직결. 3층+ 신규 유입 50% 감소." },
    fitness: { context: "필라테스·요가·PT", recommendation: "주거 밀집 + 도보 10분 + 지하·1층 (2층+ 회피)",
      rationale: "회원제는 집 근처가 재계약률 2배. 기구 운반 위해 1층 또는 엘리베이터 필수." },
    education: { context: "학원 / 교육", recommendation: "초·중등 학원은 학교 도보 10분 + 1층 + 주차 가능",
      rationale: "픽업 시 주차 못하면 다른 학원으로. 학교 가까울수록 신규 등록 ↑." },
    pet: { context: "펫", recommendation: "주거 단독 입지 + 1층 + 분리 동선 (다른 매장 X)",
      rationale: "짖음·털 알레르기 민원이 시간 제한 1순위. 상가 단독 또는 펫 클러스터 선호." },
    "online-digital": { context: "온라인·디지털", recommendation: "물리 매장 X — 작업·창고만 필요. 주거 겸용 사무실로 시작",
      rationale: "고객 방문 0. 임대료 절감이 마진 직결. 매출 안정화 후 별도 사무실·창고로 분리." },
  };
  const myCompareTip = compareFavorable[industryCategoryId] ?? compareFavorable.food;

  return (
    <>
      <KeyActionHero
        ko={ko}
        action={{
          title: ko ? "최종 1곳을 정하기 전 — 후보 3곳 이상 동일 기준 점수화" : "Score 3+ candidates on the same rubric before final pick",
          detail: ko
            ? "상권 선택은 1~2년 묶이는 의사결정. 임대료·유동인구·경쟁 밀도·타겟 적합도를 동일 기준으로 비교해야 후회 없음."
            : "Market choice locks 1-2 years. Compare rent / traffic / competition / target fit on unified rubric.",
        }}
        pillars={[
          { icon: <MapPin size={12} strokeWidth={1.5} />, label: ko ? "유동인구" : "Traffic", meta: ko ? "일평균 통행량" : "Daily count" },
          { icon: <BarChart3 size={12} strokeWidth={1.5} />, label: ko ? "임대료" : "Rent", meta: ko ? "평당 월세" : "Per sqm/mo" },
          { icon: <Users size={12} strokeWidth={1.5} />, label: ko ? "타겟 적합도" : "Target Fit", meta: ko ? "연령·소득" : "Age · Income" },
        ]}
      />

      <StageTabNav
        ko={ko}
        pageIndex={pageIdx}
        pageLabels={pageLabels}
        onPrev={() => setPageIdx(p => Math.max(0, p - 1))}
        onNext={() => setPageIdx(p => Math.min(pageLabels.length - 1, p + 1))}
        onJump={setPageIdx}
      />

      {/* ── 페이지 0: 단계 개요 ── */}
      {pageIdx === 0 && (
        <StageOverview
          ko={ko}
          headline={ko
            ? "상권 = 매출 천장. 후회 없는 1곳을 정하기 위한 25분"
            : "Market = revenue ceiling. 25 min to pick the right one"}
          why={ko
            ? "상권은 1~2년 묶이는 의사결정. 잘못 고르면 마케팅·메뉴·인테리어를 다 잘해도 매출이 임대료를 못 따라잡습니다. 공공 실측 데이터 점수 + 직접 답사 검증으로 후회 없는 결정."
            : "Market locks 1-2 years. Wrong pick caps everything else — sales can't catch rent no matter how well you market. AI live data + your visits + 4-metric scoring = no regret."}
          stat={{
            value: ko ? "47%" : "47%",
            label: ko ? "초기 폐점 = 상권 후회" : "early closures cite market",
          }}
          workOutline={[
            { stepLabel: ko ? "1. 지역·AI" : "1. Region·AI", title: ko ? "구체적 지역 입력 → AI 라이브 추천" : "Specific region → AI live scout", time: ko ? "5분" : "5m" },
            { stepLabel: ko ? "2. 답사 후보" : "2. Visit", title: ko ? "후보 2~3곳 직접 답사 (현장 검증)" : "Visit 2-3 candidates in person", time: ko ? "10분" : "10m" },
            { stepLabel: ko ? "3. 점수 비교" : "3. Score", title: ko ? "실측 지표 (경쟁·유동·임대·인구) 점수 + 직관 검증" : "Measured metrics + gut check", time: ko ? "10분" : "10m" },
            { stepLabel: ko ? "4. 매물 체크" : "4. Property", title: ko ? "현장 5가지 필수 확인 — 계약 전 최종 관문" : "5 in-person checks — last gate before signing", time: ko ? "15분" : "15m" },
            { stepLabel: ko ? "결정" : "Decide", title: ko ? "최종 1곳 선택 → 계약 검토 단계로" : "Pick one → Contract Review" },
          ]}
          outcome={ko
            ? "최종 상권 1곳이 Found.One 에 저장됩니다. 그 상권의 임대료·유동·경쟁·타겟 정보를 다음 단계 (계약 전 검토) 가 자동으로 받아서 맞춤 체크리스트를 생성."
            : "Your final market is saved. Next stage (Contract Review) auto-receives rent/traffic/competition/target data for tailored checklists."}
          nextStage={ko ? "계약 전 검토" : "Contract review"}
        />
      )}

      {/* ── 페이지 1: 희망 지역 입력 + AI 라이브 추천 ── */}
      {pageIdx === 1 && (
        <WorkStep
          ko={ko}
          stepLabel={ko ? "1. 지역·AI 추천" : "1. Region · AI"}
          time={ko ? "5분" : "5m"}
          headline={ko ? "구체적 지역 입력 → AI 가 라이브 데이터로 후보 추천" : "Specific region → AI scouts via live data"}
          why={ko
            ? "「강남구」 같이 넓은 입력은 추천 정확도 ↓. 「강남역 도보 10분」, 「홍대 메인」 처럼 좁힐수록 평균 임대료·공실률·경쟁 밀도 정확."
            : "Wide input like 'Gangnam-gu' = poor recommendations. Narrow like '10-min walk Gangnam' = accurate rent/vacancy/density."}
          how={[
            { title: ko ? "희망 지역 입력 (구체적으로)" : "Enter region (specific)", detail: ko ? "지하철역·핫스폿 + 도보 시간 또는 「~동·구 메인」. 카카오 Local 라이브 + 공공데이터 조회." : "Subway + walking distance or 'main street of ~dong'. Pulls Kakao Local + public data." },
            { title: ko ? "AI 라이브 추천 받기" : "AI scout", detail: ko ? "후보 3~5곳을 실측 기반으로 점수화 — 경쟁 밀도·유동 신호(카페 밀도 기준)·접근성은 카카오 실측, 임대료·공실률은 한국부동산원 조사상권(전국 372곳) 매칭 시 실측값으로. 조사상권 밖이면 임대료는 표시하지 않습니다." : "3-5 candidates scored on measured data — competition/traffic-signal/access from Kakao, rent/vacancy from REB survey districts (372 nationwide) when matched." },
            { title: ko ? "무료 공공 도구로 교차 검증" : "Cross-check with free public tools", detail: ko ? "소상공인365(bigdata.sbiz.or.kr) 업종별 상권 리포트 · 카카오맵 반경 500m 동업종 검색 · 네이버 위성·로드뷰로 가시성 · 행정안전부 생활인구(data.mois.go.kr) 시간대별 유동인구. AI 추천을 직접 도구로 재확인하면 신뢰도 ↑." : "소상공인365 (bigdata.sbiz.or.kr) industry reports · Kakao Map 500m competitor scan · Naver satellite/roadview · MOIS living-population (data.mois.go.kr). Cross-checking AI picks with these free tools raises confidence." },
          ]}
        />
      )}

      {/* ── 페이지 1: 답사 후보 추가 (사장님이 직접 본 매물) ── */}
      {pageIdx === 2 && (
        <WorkStep
          ko={ko}
          stepLabel={ko ? "2. 답사 후보 추가" : "2. Visit candidates"}
          time={ko ? "10분" : "10m"}
          headline={ko ? "추천만 ≠ 결정. 후보 상권을 직접 답사해 현장 검증해야 함" : "Scores alone ≠ decision. Visit candidates in person"}
          why={ko
            ? "AI 는 정량 데이터 (임대료·유동) 만 봄. 사장님이 직접 본 「분위기·동선·소음」 같은 정성 요소는 직접 답사 매물에서만 확인 가능."
            : "AI only sees quantitative data. Qualitative factors (vibe, flow, noise) must come from your in-person visits."}
          how={[
            { title: ko ? "아는 상권 직접 평가" : "Evaluate a market you know", detail: ko ? "후보 비교 페이지 「직접 입력하기」에 상권 이름을 넣으면 추천과 같은 점수 모델로 평가됩니다." : "Type a market name under Direct input — scored on the same model as recommendations." },
            { title: ko ? "최소 3곳 이상 비교 필수" : "Minimum 3 candidates", detail: ko ? "1곳만 보면 「이게 좋아 보인다」 가 끝. 3곳 이상 동일 기준으로 보면 차이가 명확." : "Single candidate = no comparison. 3+ on same rubric reveals real differences." },
          ]}
          watchouts={ko ? [
            { label: "권리금 매물 — 매출 추정 없이 지불 = 묻힘", text: "매도자가 부르는 권리금은 매출 6~12개월치. 양수 후 본인 매출이 70%+ 유지돼야 회수 가능. 매출 떨어지는 이유 (사장 변경·메뉴 변경) 사전 검증." },
          ] : [
            { label: "Goodwill (key money) trap", text: "Asking goodwill = 6-12 months revenue. Need 70%+ retention post-acquisition. Pre-verify revenue drop reasons." },
          ]}
        />
      )}

      {/* ── 페이지 2: 4지표 점수 비교 ── */}
      {pageIdx === 3 && (
        <WorkStep
          ko={ko}
          stepLabel={ko ? "3. 점수 비교" : "3. Score comparison"}
          time={ko ? "10분" : "10m"}
          headline={ko ? "경쟁·유동·임대·인구 — 실측 지표로 동일 채점" : "Competition / traffic / rent / population — measured metrics"}
          why={ko
            ? "주관적 「느낌」 만으로 결정하면 후회 1순위. 공공 실측 지표로 채점한 후 본인 직관과 교차 검증해야 후회 없음."
            : "'Gut feeling' alone is the #1 regret. Score on 4 objective metrics, then cross-check intuition."}
          how={[
            { title: ko ? "실측 점수 확인" : "Review measured scores", detail: ko ? "경쟁(소진공 공식, 500m) · 유동(카페 밀도) · 임대·공실(부동산원) · 인구(주민등록). 기준 60점에 실측 가감 — 카드 「점수 근거」에서 축별 확인." : "Competition (official, 500m) · traffic proxy · rent/vacancy · population. Base 60 with measured deltas — see per-card breakdown." },
            { title: ko ? "점수 1위 + 본인 직관 교차 검증" : "Top score × intuition", detail: ko ? "1위가 직관과 맞으면 결정. 다르면 그 이유를 메모 — 보통 직관이 놓친 요소가 보임." : "Match = decide. Mismatch = note why; reveals overlooked factor." },
          ]}
          watchouts={ko ? [
            { label: "「임대료 싸 보임」 함정", text: "월세 100만원 싸도 매출 잠재력이 200만원 적으면 손해. 평당 임대료 / 평당 매출 잠재력 비율로 판단." },
          ] : [
            { label: "Cheap rent trap", text: "₩1M lower rent but ₩30M lower revenue = ₩8M monthly loss. Use rent/revenue ratio per sqm." },
          ]}
          favorable={{ context: myCompareTip.context, recommendation: myCompareTip.recommendation, rationale: myCompareTip.rationale }}
        />
      )}

      {/* ── 페이지 4: 매물 체크 ── */}
      {pageIdx === 4 && (
        <WorkStep
          ko={ko}
          stepLabel={ko ? "4. 매물 체크" : "4. Property Check"}
          time={ko ? "15분" : "15m"}
          headline={ko ? "임대 매물 현장 — 5가지 필수 확인 후 계약 진행" : "5 must-checks before signing any lease"}
          why={ko
            ? "계약서에 서명하면 취소 불가. 현장에서 직접 눈으로 확인하지 않으면 권리금·인테리어 손실로 이어집니다."
            : "Once signed, no going back. In-person checks prevent key-money and fit-out losses."}
          how={[
            {
              title: ko ? "간판 가시성 — 3방향 이상 노출" : "Sign visibility — 3+ directions",
              detail: ko
                ? "대로변·코너 매물은 3방향 노출 가능. 골목 매물은 메인 진입로에서 보이는지 로드뷰로 먼저 예비 확인 후 현장 확인."
                : "Corner units need 3-direction exposure. Alley units: pre-check visibility on roadview before visiting.",
            },
            {
              title: ko ? "주차 — 인근 공영주차장 도보 3분" : "Parking — public lot within 3-min walk",
              detail: ko
                ? "주차 불가 매물은 방문 고객이 줄어듦. 방문 의존이 낮은 모델(배달·예약·출장·온라인 병행)이면 영향이 작습니다."
                : "No parking = fewer visiting customers. Low impact for visit-light models (delivery/booking/mobile/online).",
            },
            {
              title: ko ? "대중교통 — 도보 5분 이내" : "Transit — within 5-min walk",
              detail: ko
                ? "지하철·버스 정류장 5분 내. 6분+ 면 신규 유입 30% 감소(공공 데이터 기준). 방문 의존이 낮은 모델(배달·출장·온라인)이면 영향이 작습니다."
                : "Subway/bus within 5 min. 6+ min = ~30% fewer new walk-ins. Low impact for visit-light models.",
            },
            {
              title: ko ? "실내 면적 — 업종별 최소 기준" : "Floor area — minimum by category",
              detail: ko ? areaDetail[offlineKind].ko : areaDetail[offlineKind].en,
            },
            {
              title: ko ? infraCheck[offlineKind].titleKo : infraCheck[offlineKind].titleEn,
              detail: ko ? infraCheck[offlineKind].detailKo : infraCheck[offlineKind].detailEn,
            },
          ]}
          watchouts={ko ? [
            {
              label: "건축물대장 용도 확인",
              text: offlineKind === "food"
                ? "근린생활시설이어야 음식점·카페 영업 가능. 용도가 다르면 건축법상 용도변경 유형(허가·신고·대장 기재변경, 동일 시설군 내 변경은 대개 기재변경·생략)에 따라 절차·비용·기간이 달라짐 — 사전 확인."
                : "업종에 맞는 용도여야 영업 가능(대부분 근린생활시설). 용도가 다르면 건축법상 용도변경 유형(허가·신고·대장 기재변경)에 따라 절차·비용·기간이 달라짐 — 계약 전 확인.",
            },
            {
              label: "전 업주 폐업 이유 반드시 확인",
              text: "낮은 임대료가 함정인 경우 있음. 전 임차인이 왜 폐업했는지 임대인 또는 인근 상인에게 직접 물어보세요.",
            },
            {
              label: "관리비·원상복구 범위 사전 명문화",
              text: "월 관리비가 계약 후 30~50만원 추가되면 수지 계산이 무너짐. 임차 종료 시 원상회복 범위는 모호한 '원상복구 면제'가 아니라 '원상회복 의무 제외(시설물 인수·현 상태 인도)'처럼 구체 문구로 계약서에 명시(분쟁 예방).",
            },
          ] : [
            {
              label: "Building use permit",
              text: "Must be 'neighborhood commercial' use. Different use = permit change cost + months of delay.",
            },
            {
              label: "Why previous tenant closed",
              text: "Low rent is often a red flag. Ask landlord or neighboring merchants directly.",
            },
            {
              label: "Mgmt fee & restoration scope",
              text: "Surprise ₩300-500k/mo mgmt fees break the unit economics. Specify restoration exemptions in writing.",
            },
          ]}
        />
      )}

      {/* ── 페이지 5 (후보 비교·결정) — 실제 후보 입력·점수화·선택 패널 ── */}
      {pageIdx === 5 && (
        <>
      <div style={styles.inlinePanel}>
        <div style={styles.inlinePanelHeader}>
          <div style={styles.budgetLabel}>
            {locationRegionLabel}
          </div>
          <div style={styles.helper}>
            {locationHelpText}
          </div>
        </div>
        <input
          type="text"
          value={preferredRegionInput}
          onChange={(event) => setPreferredRegionInput(event.target.value)}
          placeholder={locationInputPlaceholder}
          style={styles.textInput}
        />
        {/* 지역 입력만으로 실측 자동 표시 (LLM 무관) — 구 검색 패널 3종 흡수 */}
        <MarketSnapshotPanel
          region={preferredRegionInput}
          categoryId={industryCategoryId}
          subIndustryId={selectedIndustryId || undefined}
          franchiseBrandId={startupType === "franchise" ? selectedFranchiseBrandId || undefined : undefined}
          language={language}
        />
        <div style={styles.segmentedRow}>
          <button
            type="button"
            disabled={!preferredRegionInput.trim()}
            style={{
              ...styles.button,
              ...(locationMode === "recommended"
                ? styles.buttonSelected
                : preferredRegionInput.trim()
                  ? { background: "var(--primary)", color: "#fff", border: "1px solid var(--primary)", fontWeight: 600 }
                  : { opacity: 0.45 })
            }}
            onClick={() => {
              setLocationMode("recommended");
              setAiMarketRegion(null);   // 명시적 큐레이션 복귀 — AI 결과 보존 가드 해제
              setManualMarketEvaluation(null);
              setManualAlternative(null);
            }}
          >
            {locationRecommendedLabel}
          </button>
          <button
            type="button"
            style={{
              ...styles.button,
              ...(locationMode === "direct" ? styles.buttonSelected : {})
            }}
            onClick={() => {
              setLocationMode("direct");
              setSelectedLocationId(undefined);
            }}
          >
            {locationDirectLabel}
          </button>
        </div>
        <div style={styles.helper}>
          {language === "ko"
            ? "내장 상권 데이터는 서울 118곳 기준 — 그 외 지역은 아래 AI 실시간 분석을 이용하세요."
            : "Built-in market data covers 118 Seoul districts — use AI live analysis elsewhere."}
        </div>

        {/* ── AI 실시간 분석 CTA — 큐레이션과 병행 상시 노출 (2026-08-03 택1 폐지)
            점수는 실측 결정론(서버), AI 는 해설만. 결과 보존은 aiMarketRegion 가드. */}
        {(
        <div style={{
          marginTop: "12px",
          padding: "14px 16px",
          borderRadius: "14px",
          background: "linear-gradient(180deg, rgba(25,25,112,0.04) 0%, rgba(255,255,255,0.96) 100%)",
          border: "1px solid rgba(25,25,112,0.14)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap" as const,
        }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <div style={{ fontSize: "13px", fontWeight: 650, color: "#191970", letterSpacing: "-0.01em", marginBottom: "2px" }}>
              {language === "ko" ? "AI로 실시간 상권 추천" : "AI live market scout"}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.55)", lineHeight: 1.5 }}>
              {language === "ko"
                ? `"${preferredRegionInput.trim() || "지역"}" 주변 3~5개 후보를 공공 실측 데이터로 점수화하고 AI가 해설합니다.${hasCuratedMarket ? " (아래 조사 상권과 별도 — 실행 시 교체)" : ""}`
                : `Scores 3–5 candidates around "${preferredRegionInput.trim() || "region"}" from public data, with AI narration.`}
            </div>
            {aiMarketError ? (
              <div style={{ marginTop: "6px", fontSize: "12px", color: "#b64c4c", lineHeight: 1.5 }}>
                {aiMarketError}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={requestAiMarketRecommend}
            disabled={!preferredRegionInput.trim() || aiMarketLoading}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              border: "none",
              background: preferredRegionInput.trim() && !aiMarketLoading
                ? "linear-gradient(180deg, #1d2b7a 0%, #0d0d4d 100%)"
                : "rgba(0,0,0,0.06)",
              color: preferredRegionInput.trim() && !aiMarketLoading ? "#fff" : "rgba(0,0,0,0.45)",
              fontSize: "13px",
              fontWeight: 650,
              letterSpacing: "-0.01em",
              cursor: preferredRegionInput.trim() && !aiMarketLoading ? "pointer" : "default",
              boxShadow: preferredRegionInput.trim() && !aiMarketLoading
                ? "0 4px 14px rgba(25,25,112,0.24), 0 1px 0 rgba(255,255,255,0.1) inset"
                : "none",
              flexShrink: 0,
              transition: "all 0.15s ease",
            }}
          >
            {aiMarketLoading
              ? (language === "ko" ? "분석 중…" : "Analysing…")
              : (language === "ko" ? "AI 추천 받기" : "Get AI picks")}
          </button>
        </div>
        )}
      </div>

      {locationMode === "recommended" && activeLocationCandidates.length > 0 ? (
        <>
        {/* ── Kakao Map + Location Cards (Apple-style) ── */}
        {(
          <LocationMapPanel
            candidates={activeLocationCandidates}
            selectedId={selectedLocationId}
            onSelect={(id) => setSelectedLocationId(id)}
            language={language}
            region={preferredRegionInput}
          />
        )}
        {/* 브랜드 시도 분포 — 신형 가족 단일 출처, 후보 카드 위 1회만 (카드마다 중복 금지) */}
        {franchiseRegionalNote && (
          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", padding: "8px 12px", borderRadius: "10px", background: "rgba(29,53,87,0.05)" }}>
            🏢 {franchiseRegionalNote}
          </p>
        )}
        <div ref={locationRef} style={{ display: "grid", gap: "10px", ...(shakeWarning ? { outline: "2px solid #b64c4c", outlineOffset: "4px", borderRadius: "16px", transition: "outline 0.3s ease" } : {}) }}>
          {activeLocationCandidates.map((item) => {
            const selected = selectedLocationId === item.id;
            const freshness = getFreshnessPresentation(item.freshness);
            const scoreColor = (item.score ?? 0) >= 85 ? "#1d3557" : (item.score ?? 0) >= 70 ? "#3b5c8c" : "#191970";
            return (
              <button
                key={item.id}
                type="button"
                style={{
                  display: "grid",
                  gap: "8px",
                  padding: "16px 18px",
                  borderRadius: "16px",
                  border: selected ? "2px solid var(--primary)" : "1px solid var(--border)",
                  background: selected ? "rgba(29,53,87,0.04)" : "rgba(255,255,255,0.82)",
                  boxShadow: selected ? "0 0 0 4px rgba(29,53,87,0.06)" : "0 1px 4px rgba(0,0,0,0.03)",
                  cursor: freshness.isSelectable ? "pointer" : "default",
                  textAlign: "left" as const,
                  opacity: freshness.isSelectable ? 1 : 0.5,
                  transition: "all 0.2s ease"
                }}
                onClick={() => { if (freshness.isSelectable) setSelectedLocationId(item.id); }}
                disabled={!freshness.isSelectable}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em" }}>{item.title}</div>
                    {item.meta?.districtName && (
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{String(item.meta.districtName)}</div>
                    )}
                  </div>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: `${scoreColor}14`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: scoreColor }}>{item.score ?? "-"}</span>
                  </div>
                </div>
                <div style={{ fontSize: "13px", lineHeight: 1.55, color: "var(--muted)" }}>{item.summary}</div>
                {/* 실측 임대료 — 부동산원 조사상권 매칭 시에만 서버가 meta 로 내려줌 (LLM 미경유·결정론) */}
                {item.meta?.measuredRent && (
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", lineHeight: 1.5, padding: "8px 10px", borderRadius: "10px", background: "rgba(29,53,87,0.05)", border: "1px solid rgba(29,53,87,0.10)" }}>
                    📐 {String(item.meta.measuredRent)}
                    {typeof item.meta.vacancyPct === "number" && <> · {language === "ko" ? `공실률 ${item.meta.vacancyPct}%` : `Vacancy ${item.meta.vacancyPct}%`}</>}
                  </div>
                )}
                {/* 동종업종 공식 카운트 — 소진공(국세청 원천), 실패 시 미표시 */}
                {item.meta?.officialCompetition && (
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", lineHeight: 1.5, padding: "8px 10px", borderRadius: "10px", background: "rgba(29,53,87,0.05)", border: "1px solid rgba(29,53,87,0.10)" }}>
                    🏪 {String(item.meta.officialCompetition)}
                  </div>
                )}
                {/* 프랜차이즈 실측 — 같은 브랜드(영업지역 보호 신호)·동종 브랜드 */}
                {item.meta?.franchisePresence && (
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", lineHeight: 1.5, padding: "8px 10px", borderRadius: "10px", background: "rgba(29,53,87,0.05)", border: "1px solid rgba(29,53,87,0.10)" }}>
                    🏢 {String(item.meta.franchisePresence)}
                  </div>
                )}
                {/* 개폐업 추이 — 자체 스냅샷 실측 (관측 이력 생기면 자동 등장) */}
                {item.meta?.areaTrend && (
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", lineHeight: 1.5, padding: "8px 10px", borderRadius: "10px", background: "rgba(29,53,87,0.05)", border: "1px solid rgba(29,53,87,0.10)" }}>
                    📈 {String(item.meta.areaTrend)}
                  </div>
                )}
                {/* 배후 주거인구 — 행안부 주민등록 실측 (거주 라벨 강제 — 유동인구인 척 금지) */}
                {item.meta?.backPopulation && (
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", lineHeight: 1.5, padding: "8px 10px", borderRadius: "10px", background: "rgba(29,53,87,0.05)", border: "1px solid rgba(29,53,87,0.10)" }}>
                    🏠 {String(item.meta.backPopulation)}
                  </div>
                )}
                {/* 점수 근거 — 결정론 축별 가감 (measured-v1). 접힘식: 궁금한 사람만 연다 */}
                {item.meta?.scoreBreakdown && (
                  <details style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                      {language === "ko" ? "점수 근거 보기" : "Score breakdown"}
                    </summary>
                    <div style={{ marginTop: "4px", lineHeight: 1.6 }}>{String(item.meta.scoreBreakdown)}</div>
                  </details>
                )}
                {/* 추정매출 격차의 정직한 브리지 — 우리가 못 주는 값은 공공 도구로 바로 보냄 */}
                <a
                  href="https://bigdata.sbiz.or.kr/"
                  target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--muted)", textDecoration: "none" }}
                >
                  {language === "ko" ? "이 동네 추정매출·유동인구는 소상공인365에서 확인 ↗" : "Check estimated revenue on 소상공인365 ↗"}
                </a>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                  {[
                    { label: language === "ko" ? "임대료" : "Rent", value: formatMarketMetaValue("rentBand", item.meta?.rentBand, language) },
                    { label: language === "ko" ? "경쟁도" : "Competition", value: formatMarketMetaValue("competitionLevel", item.meta?.competitionLevel, language) },
                    { label: language === "ko" ? "적합도" : "Fit", value: formatMarketMetaValue("customerFit", item.meta?.customerFit, language) }
                  ].map((chip) => (
                    <span key={chip.label} style={{
                      fontSize: "11px", fontWeight: 500,
                      padding: "4px 10px", borderRadius: "8px",
                      background: selected ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.03)",
                      border: "1px solid var(--border)",
                      color: "var(--muted)"
                    }}>
                      {chip.label} {chip.value}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        </>
      ) : (
        <>
          <div style={styles.inlinePanel}>
            <div style={styles.inlinePanelHeader}>
              <div style={styles.budgetLabel}>
                {customLocationLabel}
              </div>
            </div>
            <input
              type="text"
              value={customMarketName}
              onChange={(event) => setCustomMarketName(event.target.value)}
              placeholder={customLocationPlaceholder}
              style={styles.textInput}
            />
            <textarea
              value={customMarketReason}
              onChange={(event) => setCustomMarketReason(event.target.value)}
              placeholder={customLocationReasonPlaceholder}
              style={styles.textarea}
            />
            <div style={styles.stageInlineActions}>
              <button
                type="button"
                style={{
                  ...styles.button,
                  opacity: customMarketName.trim() ? 1 : 0.45
                }}
                disabled={!customMarketName.trim()}
                onClick={async () => {
                  const signal = await loadBestMarketSignal(supabase, {
                    regionQuery: preferredRegionInput,
                    marketQuery: customMarketName,
                    categoryId: industryCategoryId
                  }).catch(() => null);
                  const result = evaluateDirectMarket({
                    region: preferredRegionInput,
                    marketName: customMarketName,
                    categoryId: industryCategoryId,
                    capital: selectedBudget,
                    candidates: locationOptions,
                    signal
                  });
                  const evaluation = localizeRecommendationItem(result.evaluation, language);
                  const alternative = result.alternative
                    ? localizeRecommendationItem(result.alternative, language)
                    : null;
                  setManualMarketEvaluation(evaluation);
                  setManualAlternative(alternative);
                  setSelectedLocationId(undefined);
                }}
              >
                {scoreLocationLabel}
              </button>
            </div>
          </div>

          {manualMarketEvaluation ? (
            <div style={styles.inlinePanel}>
              <div style={styles.budgetLabel}>
                {language === "ko" ? "평가 결과" : "Evaluation"}
              </div>
              <div style={styles.recommendationTop}>
                <div style={styles.optionTitle}>{manualMarketEvaluation.title}</div>
                <div style={styles.scoreBadge}>
                  {language === "ko" ? `점수 ${manualMarketEvaluation.score ?? "-"}` : `Score ${manualMarketEvaluation.score ?? "-"}`}
                </div>
              </div>
              {manualMarketEvaluation.meta?.districtName ? (
                <div style={styles.freshnessText}>
                  {String(manualMarketEvaluation.meta.districtName)}
                </div>
              ) : null}
              <div style={styles.optionSummary}>{manualMarketEvaluation.summary}</div>
              <div style={styles.helper}>
                {language === "ko"
                  ? "이 상권으로 진행할지, Found.One이 한 번 더 제안하는 대안을 볼지 선택하세요."
                  : "Choose whether to keep this market or review one suggested alternative."}
              </div>
              <div style={styles.stageInlineActions}>
                <button
                  type="button"
                  style={styles.primaryButton}
                  onClick={() => setSelectedLocationId(manualMarketEvaluation.id)}
                >
                  {language === "ko" ? "내가 고른 상권 유지" : "Keep my market"}
                </button>
                {manualAlternative ? (
                  <button
                    type="button"
                    style={styles.button}
                    onClick={() => {
                      setLocationMode("recommended");
                      setRecommendedMarkets(
                        buildRecommendedMarkets({
                          region: preferredRegionInput || customMarketName,
                          categoryId: industryCategoryId,
                          capital: selectedBudget,
                          candidates: locationOptions
                        }).map((item) => localizeRecommendationItem(item, language))
                      );
                      setSelectedLocationId(manualAlternative.id);
                    }}
                  >
                    {language === "ko" ? "추천 대안 보기" : "View suggested alternative"}
                  </button>
                ) : null}
              </div>
              {manualAlternative ? (
                <div style={styles.inlinePanel}>
                  <div style={styles.budgetLabel}>
                    {language === "ko" ? "이런 곳은 어떠세요?" : "How about this instead?"}
                  </div>
                  <div style={styles.recommendationTop}>
                    <div style={styles.optionTitle}>{manualAlternative.title}</div>
                    <div style={styles.scoreBadge}>
                      {language === "ko" ? `점수 ${manualAlternative.score ?? "-"}` : `Score ${manualAlternative.score ?? "-"}`}
                    </div>
                  </div>
                  <div style={styles.optionSummary}>{manualAlternative.summary}</div>
                  <div style={styles.helper}>
                    {language === "ko"
                      ? "원래 고른 상권도 계속 유지할 수 있습니다."
                      : "You can still keep your original market choice."}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      {finalSelectedMarket ? (
        <div style={styles.inlinePanel}>
          <div style={styles.inlinePanelHeader}>
            <div style={styles.budgetLabel}>
              {selectedLocationDetailLabel}
            </div>
          </div>
          <div style={styles.recommendationTop}>
            <div style={styles.optionTitle}>{finalSelectedMarket.title}</div>
            <div style={styles.scoreBadge}>
              {language === "ko" ? `점수 ${finalSelectedMarket.score ?? "-"}` : `Score ${finalSelectedMarket.score ?? "-"}`}
            </div>
          </div>
          {finalSelectedMarket.meta?.districtName ? (
            <div style={styles.freshnessText}>
              {String(finalSelectedMarket.meta.districtName)}
            </div>
          ) : null}
          <div style={styles.optionSummary}>{finalSelectedMarket.summary}</div>
          <div style={styles.helper}>
            {buildMarketScoreNarrative(finalSelectedMarket, language)}
          </div>
          <div style={styles.budgetLabel}>
            {language === "ko" ? "왜 괜찮은가" : "Why this works"}
          </div>
          {finalSelectedMarket.reasons?.slice(0, 2).map((reason) => (
            <div key={reason} style={styles.helper}>
              {reason}
            </div>
          ))}
          <div style={styles.budgetLabel}>
            {language === "ko" ? "주의할 점" : "Watch-outs"}
          </div>
          {finalSelectedMarket.warnings?.slice(0, 1).map((warning) => (
            <div key={warning} style={styles.warningText}>
              {warning}
            </div>
          ))}
        </div>
      ) : null}
        </>
      )}

      {pageIdx === 6 && (
      <StageWrapup
        ko={language === "ko"}
        nextStageLabelKo="계약서 검토"
        doneItemsKo={[
          { label: "1. 118개 상권 데이터 검토", detail: "유동인구·평균임대료·동종업종 밀도 비교 — 점수화된 상권 추천" },
          { label: "2. 상위 후보 3곳 선정", detail: "AI 점수 + 본인 자본 + 업종 적합도로 1차 압축" },
          { label: "3. 직접 상권 평가", detail: "아는 상권 이름을 입력해도 동일 점수 모델로 평가" },
          { label: "4. 최종 1곳 확정", detail: "현장 답사·임대료 견적·매물 확인 후 1곳 결정" },
        ]}
        verifyItemsKo={[
          "임대 매물 상태 직접 확인 — 누수·결로·소방·주차·하수도·전기용량 5개 항목 사진 기록",
          "상권 유동인구 — 평일·주말·야간 3시간대 직접 카운트 검증 (행정 데이터는 평균값에 불과)",
          offlineKind === "food"
            ? "동종업종 반경 200m 안 5개 이상이면 → 차별화 메뉴·시간·가격 1개 이상 확보 필수"
            : "동종업종 반경 200m 안 5개 이상이면 → 차별화 상품·서비스·가격 1개 이상 확보 필수",
          "임대인 신원·등기부등본 직접 열람 — 선순위 채권(근저당 채권최고액·가압류) 규모를 건물 시세·경락 예상가와 견줘 보증금 회수 가능성 확인 (근저당 있어도 건물가 여유면 보호, 선순위 과다·후순위 가압류·체납 국세면 위험). 인도+사업자등록+확정일자로 대항력·우선변제권 확보 필수",
          "용도지역(주거·상업·일반·전용) 확인 — 대부분 업종은 일반·근린상업 가능, 주거지역은 업종·면적 제한",
          "건물주의 임대 정책 — 상가임대차법 10년 법정 계약갱신요구권 보장 여부 + 퇴거 시 원상복구 범위 분쟁 사전 점검",
        ]}
        nextSummaryKo="입지 1곳 확정 → 임대 계약서 검토 단계로 진입"
      />
      )}

      <div style={styles.stageFooter}>
        {/* ⚠️ 항상 노출 — prevTraversedStage 가 null 이어도 (사용자가 미완료 단계를 viewing 중) 로드맵으로 돌아가는 fallback */}
        <button
          type="button"
          style={styles.button}
          onClick={() => {
            if (prevTraversedStage) setViewingStageId(prevTraversedStage.stageId);
            else setViewingStageId(null);
          }}
        >
          {language === "ko" ? "← 이전 단계" : "← Back"}
        </button>
        {/* "수정 저장" — 이미 완료된 단계일 때만 노출. editSaveStatus 따라 라벨/색 변경. */}
        {isStageCompleted && (
          <button
            type="button"
            style={{
              ...styles.primaryButton,
              opacity: canCompleteLocationStep && _editStatus !== "saving" ? 1 : 0.5,
              background: _editBg,
              cursor: _editStatus === "saving" ? "wait" : "pointer",
            }}
            disabled={_editStatus === "saving"}
            onClick={() => {
              if (!canCompleteLocationStep) return;
              void handleStageEdit("location-candidates");
            }}
          >
            {_editLabel}
          </button>
        )}
        <button
          type="button"
          style={{
            ...styles.primaryButton,
            opacity: canCompleteLocationStep ? 1 : 0.45,
          }}
          onClick={() => {
            if (!canCompleteLocationStep) {
              if (pageIdx !== 5) {                    // 선택 UI 는 pg5 — 무반응 대신 이동
                setPageIdx(5);
                return;
              }
              setShakeWarning(true);
              locationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => setShakeWarning(false), 2000);
              return;
            }
            handleLocationContinue();
          }}
        >
          {!canCompleteLocationStep
            ? (pageIdx !== 5
              ? (language === "ko" ? "상권 선택으로 이동 →" : "Go to market selection →")
              : (language === "ko" ? "↑ 상권을 선택하세요" : "↑ Select a market"))
            : (isDigitalCategory
              ? language === "ko"
                ? "이 거점으로 운영 준비 시작"
                : "Use this base and continue"
              : copy.home.selectMarketAndContinue)}
        </button>
        <button type="button" style={styles.button} onClick={resetDemo}>
          {copy.common.resetDemo}
        </button>
      </div>
    </>
  );
}
