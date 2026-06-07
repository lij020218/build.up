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
    nearbyFranchiseStores, setNearbyFranchiseStores,
    nearbyFranchiseLoading, setNearbyFranchiseLoading,
    // Location
    locationOptions,
    selectedLocationId, setSelectedLocationId,
    canCompleteLocationStep, handleLocationContinue,
    preferredRegionInput, setPreferredRegionInput,
    locationMode, setLocationMode,
    setRecommendedMarkets,
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
    locationMapReady, setLocationMapReady,
    selectedBudget,
    // Competitor search
    competitorResults, setCompetitorResults,
    competitorLoading, setCompetitorLoading,
    // Live market insights
    liveMarketInsights, setLiveMarketInsights,
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
      setLocationMode("recommended");
      setLocationMapReady(true);
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
    ? ["개요", "1. 지역·AI", "2. 답사 후보", "3. 점수 비교", "4. 매물 체크", "후보 비교·결정"]
    : ["Overview", "1. Region·AI", "2. Visit", "3. Score", "4. Property", "Decide"];

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
            ? "상권은 1~2년 묶이는 의사결정. 잘못 고르면 마케팅·메뉴·인테리어를 다 잘해도 매출이 임대료를 못 따라잡습니다. AI 라이브 데이터 + 직접 답사 후보 + 4지표 점수화로 후회 없는 결정."
            : "Market locks 1-2 years. Wrong pick caps everything else — sales can't catch rent no matter how well you market. AI live data + your visits + 4-metric scoring = no regret."}
          stat={{
            value: ko ? "47%" : "47%",
            label: ko ? "초기 폐점 = 상권 후회" : "early closures cite market",
          }}
          workOutline={[
            { stepLabel: ko ? "1. 지역·AI" : "1. Region·AI", title: ko ? "구체적 지역 입력 → AI 라이브 추천" : "Specific region → AI live scout", time: ko ? "5분" : "5m" },
            { stepLabel: ko ? "2. 답사 후보" : "2. Visit", title: ko ? "직접 답사한 매물 1-2곳 추가 (정성 요소)" : "Add 1-2 properties you visited", time: ko ? "10분" : "10m" },
            { stepLabel: ko ? "3. 점수 비교" : "3. Score", title: ko ? "4지표 (유동·임대료·경쟁·타겟) 점수 + 직관 검증" : "4 metrics + gut check", time: ko ? "10분" : "10m" },
            { stepLabel: ko ? "4. 매물 체크" : "4. Property", title: ko ? "현장 5가지 필수 확인 — 계약 전 최종 관문" : "5 in-person checks — last gate before signing", time: ko ? "15분" : "15m" },
            { stepLabel: ko ? "결정" : "Decide", title: ko ? "최종 1곳 선택 → 계약 검토 단계로" : "Pick one → Contract Review" },
          ]}
          outcome={ko
            ? "최종 상권 1곳이 Found.One 에 저장됩니다. 그 상권의 임대료·유동·경쟁·타겟 정보를 다음 단계 (계약 전 검토) 가 자동으로 받아서 맞춤 체크리스트를 생성."
            : "Your final market is saved. Next stage (Contract Review) auto-receives rent/traffic/competition/target data for tailored checklists."}
          nextStage={ko ? "계약 전 검토 (contract-review)" : "Contract review"}
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
            { title: ko ? "AI 라이브 추천 받기" : "AI scout", detail: ko ? "AI 가 그 지역의 평균 임대료·공실률·경쟁 밀도·유동인구·타겟 적합도 즉시 분석. 후보 3~5곳 점수와 함께." : "AI returns 3-5 candidates with rent / vacancy / competition / traffic / target-fit scores." },
            { title: ko ? "무료 공공 도구로 교차 검증" : "Cross-check with free public tools", detail: ko ? "소상공인마당(sg.sbiz.or.kr) 업종별 상권 리포트 · 카카오맵 반경 500m 동업종 검색 · 네이버 위성·로드뷰로 가시성 · 행정안전부 생활인구(data.mois.go.kr) 시간대별 유동인구. AI 추천을 직접 도구로 재확인하면 신뢰도 ↑." : "소상공인마당 (sg.sbiz.or.kr) industry reports · Kakao Map 500m competitor scan · Naver satellite/roadview · MOIS living-population (data.mois.go.kr). Cross-checking AI picks with these free tools raises confidence." },
          ]}
        />
      )}

      {/* ── 페이지 1: 답사 후보 추가 (사장님이 직접 본 매물) ── */}
      {pageIdx === 2 && (
        <WorkStep
          ko={ko}
          stepLabel={ko ? "2. 답사 후보 추가" : "2. Visit candidates"}
          time={ko ? "10분" : "10m"}
          headline={ko ? "AI 추천만 ≠ 결정. 직접 답사한 매물 1-2곳 추가해야 함" : "AI scout alone ≠ decision. Add 1-2 properties you visited"}
          why={ko
            ? "AI 는 정량 데이터 (임대료·유동) 만 봄. 사장님이 직접 본 「분위기·동선·소음」 같은 정성 요소는 직접 답사 매물에서만 확인 가능."
            : "AI only sees quantitative data. Qualitative factors (vibe, flow, noise) must come from your in-person visits."}
          how={[
            { title: ko ? "직접 답사한 매물 입력" : "Add visited properties", detail: ko ? "주소·평수·임대료·메모. AI 추천 매물과 동일한 점수 기준으로 비교됨." : "Address, area, rent, notes. Scored on same rubric as AI suggestions." },
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
          headline={ko ? "유동인구·임대료·경쟁 밀도·타겟 적합도 — 4지표로 동일 채점" : "Traffic / rent / competition / target fit — 4 metrics"}
          why={ko
            ? "주관적 「느낌」 만으로 결정하면 후회 1순위. 객관 4지표로 채점한 후 본인 직관과 교차 검증해야 후회 없음."
            : "'Gut feeling' alone is the #1 regret. Score on 4 objective metrics, then cross-check intuition."}
          how={[
            { title: ko ? "4지표 점수 확인" : "Review 4-metric scores", detail: ko ? "유동(일평균 통행) · 임대료(평당 월세) · 경쟁(반경 500m 동종 수) · 타겟(연령·소득). 각 25점, 총 100." : "Traffic (daily) · rent (per sqm) · competition (within 500m) · target (age/income). 25 each, 100 total." },
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
                ? "주차 불가 매물은 객단가 1만원+ 고객 방문이 줄어듦. 테이크아웃 전용 모델이라면 무관."
                : "No parking = fewer high-ticket customers. Not relevant for take-away-only models.",
            },
            {
              title: ko ? "대중교통 — 도보 5분 이내" : "Transit — within 5-min walk",
              detail: ko
                ? "지하철·버스 정류장 5분 내. 6분+ 면 신규 유입 30% 감소(공공 데이터 기준). 배달 전용이라면 무관."
                : "Subway/bus within 5 min. 6+ min = ~30% fewer new walk-ins per public data.",
            },
            {
              title: ko ? "실내 면적 — 업종별 최소 기준" : "Floor area — minimum by category",
              detail: ko
                ? "15평 이하 = 배달·테이크아웃 전용. 15~25평 = 테이블 6~10개. 25~40평 = 홀 직원 1~2명 필요. 40평+ = 인건비 비중 급증."
                : "<15 pyeong: delivery/take-away only. 15-25: 6-10 tables. 25-40: 1-2 floor staff. 40+: labour cost spikes.",
            },
            {
              title: ko ? "환기·덕트 설치 가능 여부" : "Ventilation duct installation feasible?",
              detail: ko
                ? "음식점·카페는 외부 환기 덕트 필수. 건물 구조상 설치 불가하면 영업 허가 자체가 불가. 임대인에게 반드시 사전 확인."
                : "Food/café require exterior duct. Structurally impossible = no operating permit. Confirm with landlord upfront.",
            },
          ]}
          watchouts={ko ? [
            {
              label: "건축물대장 용도 확인",
              text: "근린생활시설이어야 음식점·카페 영업 가능. 용도가 다를 경우 용도 변경 허가 비용 + 수개월 추가 소요.",
            },
            {
              label: "전 업주 폐업 이유 반드시 확인",
              text: "낮은 임대료가 함정인 경우 있음. 전 임차인이 왜 폐업했는지 임대인 또는 인근 상인에게 직접 물어보세요.",
            },
            {
              label: "관리비·원상복구 범위 사전 명문화",
              text: "월 관리비가 계약 후 30~50만원 추가되면 수지 계산이 무너짐. 원상복구 면제 항목도 계약서에 구체적으로 기재.",
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
      <div style={styles.helper}>{locationHelpText}</div>

      {/* ── Franchise nearby store search ── */}
      {startupType === "franchise" && selectedFranchiseBrandId && (() => {
        const fb = getFranchiseBrandById(selectedFranchiseBrandId);
        if (!fb) return null;
        const ko = language === "ko";
        const density = fb.storeCount > 2000 ? "high" : fb.storeCount > 500 ? "medium" : "low";
        const densityColor = density === "high" ? "#b64c4c" : density === "medium" ? "#191970" : "#1d3557";
        const densityLabel = density === "high"
          ? (ko ? "매우 높음" : "Very High")
          : density === "medium"
            ? (ko ? "보통" : "Medium")
            : (ko ? "낮음" : "Low");

        const searchNearby = () => {
          if (!preferredRegionInput.trim()) return;
          const w = window as unknown as Record<string, unknown>;
          type KPlace = { place_name: string; road_address_name: string; address_name: string; phone: string; place_url: string };
          type KPagination = { totalCount: number };
          const kakao = w.kakao as { maps?: { load?: (cb: () => void) => void; services?: { Places: new () => { keywordSearch: (q: string, cb: (d: KPlace[], s: string, p: KPagination) => void) => void }; Status: { OK: string; ZERO_RESULT: string; ERROR: string } } } } | undefined;
          if (!kakao?.maps) return;
          setNearbyFranchiseLoading(true);
          setNearbyFranchiseStores(null);
          const run = () => {
            const svc = kakao!.maps!.services;
            if (!svc) return;
            const ps = new svc.Places();
            const query = `${fb.name.ko} ${preferredRegionInput.trim()}`;
            ps.keywordSearch(query, (data: KPlace[], status: string, pagination: KPagination) => {
              if (status === svc.Status.OK) {
                setNearbyFranchiseStores({
                  totalCount: pagination.totalCount,
                  places: data.map((d) => ({
                    name: d.place_name,
                    address: d.road_address_name || d.address_name,
                    phone: d.phone,
                    url: d.place_url
                  }))
                });
              } else {
                setNearbyFranchiseStores({ totalCount: 0, places: [] });
              }
              setNearbyFranchiseLoading(false);
            });
          };
          if (kakao.maps.load) {
            kakao.maps.load(run);
          } else {
            run();
          }
        };

        return (
          <div style={{
            marginBottom: "16px",
            borderRadius: "20px",
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.82)",
            overflow: "hidden"
          }}>
            {/* header */}
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
                <div style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em" }}>
                  {ko ? `${fb.name.ko} 주변 매장 검색` : `${fb.name.en} Nearby Store Search`}
                </div>
                <div style={{
                  fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "8px",
                  background: `${densityColor}12`, color: densityColor
                }}>
                  {ko ? `전국 ${fb.storeCount.toLocaleString()}개` : `${fb.storeCount.toLocaleString()} nationwide`} · {densityLabel}
                </div>
              </div>
              <div style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--muted)" }}>
                {ko
                  ? "희망 지역 근처에 같은 브랜드 매장이 있는지 확인하세요. 반경 내 동일 브랜드가 많으면 매출이 분산됩니다."
                  : "Check if the same brand already exists near your target area. Too many nearby stores will split revenue."}
              </div>
            </div>

            {/* search action */}
            <div style={{ padding: "14px 20px", display: "flex", gap: "8px", alignItems: "center", borderBottom: nearbyFranchiseStores ? "1px solid var(--border)" : "none" }}>
              <button
                type="button"
                onClick={searchNearby}
                disabled={!preferredRegionInput.trim() || nearbyFranchiseLoading}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  border: "none",
                  background: preferredRegionInput.trim() ? "var(--primary)" : "rgba(0,0,0,0.06)",
                  color: preferredRegionInput.trim() ? "#fff" : "var(--muted)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: preferredRegionInput.trim() ? "pointer" : "default",
                  opacity: nearbyFranchiseLoading ? 0.6 : 1
                }}
              >
                {nearbyFranchiseLoading
                  ? (ko ? "검색 중..." : "Searching...")
                  : preferredRegionInput.trim()
                    ? (ko ? `"${preferredRegionInput.trim()}" 근처 ${fb.name.ko} 검색` : `Search ${fb.name.en} near "${preferredRegionInput.trim()}"`)
                    : (ko ? "아래에서 희망 지역을 먼저 입력하세요" : "Enter your preferred region below first")}
              </button>
            </div>

            {/* results */}
            {nearbyFranchiseStores && (
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 16,
                    background: nearbyFranchiseStores.totalCount === 0 ? "#1d355718" : nearbyFranchiseStores.totalCount <= 3 ? "#19197018" : "#b64c4c18",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px", fontWeight: 700,
                    color: nearbyFranchiseStores.totalCount === 0 ? "#1d3557" : nearbyFranchiseStores.totalCount <= 3 ? "#191970" : "#b64c4c"
                  }}>
                    {nearbyFranchiseStores.totalCount}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>
                      {nearbyFranchiseStores.totalCount === 0
                        ? (ko ? "주변에 동일 브랜드가 없습니다" : "No same-brand stores nearby")
                        : (ko ? `주변에 ${fb.name.ko} ${nearbyFranchiseStores.totalCount}개 발견` : `${nearbyFranchiseStores.totalCount} ${fb.name.en} stores found nearby`)}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                      {nearbyFranchiseStores.totalCount === 0
                        ? (ko ? "해당 지역은 출점 가능성이 높습니다" : "This area has good potential for a new store")
                        : nearbyFranchiseStores.totalCount <= 3
                          ? (ko ? "경쟁이 있지만 진입 가능합니다" : "Some competition but entry is viable")
                          : (ko ? "이미 포화 상태입니다. 다른 지역을 고려하세요" : "Already saturated. Consider a different area")}
                    </div>
                  </div>
                </div>

                {nearbyFranchiseStores.places.length > 0 && (
                  <div style={{ display: "grid", gap: "6px" }}>
                    {nearbyFranchiseStores.places.slice(0, 8).map((place, pi) => (
                      <a
                        key={pi}
                        href={place.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 12px",
                          borderRadius: "12px",
                          background: "rgba(0,0,0,0.02)",
                          border: "1px solid var(--border)",
                          textDecoration: "none",
                          color: "inherit",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{
                          width: 24, height: 24, borderRadius: 8,
                          background: "var(--primary)",
                          color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "11px", fontWeight: 700, flexShrink: 0
                        }}>
                          {pi + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.address}</div>
                        </div>
                        {place.phone && <div style={{ fontSize: "11px", color: "var(--muted)", flexShrink: 0 }}>{place.phone}</div>}
                        <span style={{ fontSize: "12px", color: "var(--primary)", flexShrink: 0 }}>↗</span>
                      </a>
                    ))}
                  </div>
                )}

                {nearbyFranchiseStores.totalCount > 8 && (
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--muted)", textAlign: "center" }}>
                    {ko ? `외 ${nearbyFranchiseStores.totalCount - 8}개 매장 더 있음` : `${nearbyFranchiseStores.totalCount - 8} more stores`}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── 독립 창업자 동종업체 검색 ── */}
      {startupType !== "franchise" && (() => {
        const ko = language === "ko";
        const categoryKeywords: Record<string, string> = {
          "cafe-dessert": "카페",
          "food": industryCategoryId === "food" ? (selectedIndustryId === "chicken-burger" ? "치킨" : selectedIndustryId === "ramen-noodle" ? "국밥 면류" : selectedIndustryId === "korean-casual" ? "한식" : "음식점") : "음식점",
          "retail": "편의점 소매점",
          "beauty": selectedIndustryId === "hair-salon" ? "미용실" : selectedIndustryId === "nail-studio" ? "네일" : "뷰티",
          "fitness": "헬스장 피트니스",
          "education": "학원",
          "pet": "펫샵 애견",
          "living-service": "세탁소",
          "space": "스터디카페",
        };
        const keyword = categoryKeywords[industryCategoryId] ?? "가게";
        // competitorResults / competitorLoading — hoisted to component top

        const searchCompetitors = () => {
          if (!preferredRegionInput.trim()) return;
          // 2026-05-13: kakao-maps.d.ts 글로벌 타입 — any 캐스트 제거
          const kakao = typeof window !== "undefined" ? window.kakao : undefined;
          const maps = kakao?.maps;
          if (!maps?.services) return;
          setCompetitorLoading(true);
          setCompetitorResults(null);
          const run = () => {
            const ps = new maps.services.Places();
            const query = `${keyword} ${preferredRegionInput.trim()}`;
            ps.keywordSearch(query, (data, status, pagination) => {
              if (status === "OK") {
                setCompetitorResults({
                  totalCount: pagination?.totalCount ?? 0,
                  places: data.map((d) => ({
                    name: d.place_name,
                    address: d.road_address_name || d.address_name,
                    phone: d.phone || "",
                    url: (d as { place_url?: string }).place_url ?? "",
                  }))
                });
              } else {
                setCompetitorResults({ totalCount: 0, places: [] });
              }
              setCompetitorLoading(false);
            }, { size: 10 });
          };
          if (maps.load) { maps.load(run); } else { run(); }
        };

        return (
          <div style={{
            marginBottom: "16px", borderRadius: "20px",
            border: "1px solid var(--border)", background: "rgba(255,255,255,0.82)", overflow: "hidden"
          }}>
            <div style={{ padding: "18px 20px", borderBottom: competitorResults ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em", marginBottom: "4px" }}>
                {ko ? "주변 경쟁 업체 분석" : "Nearby Competition Analysis"}
              </div>
              <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5, marginBottom: "12px" }}>
                {ko ? "희망 지역에 같은 업종이 얼마나 있는지 확인하세요. 경쟁이 과하면 차별화 전략이 필요합니다." : "Check how many competitors exist in your target area."}
              </div>
              <button
                type="button"
                onClick={searchCompetitors}
                disabled={!preferredRegionInput.trim() || competitorLoading}
                style={{
                  padding: "10px 18px", borderRadius: "12px", border: "none",
                  background: preferredRegionInput.trim() ? "var(--primary)" : "rgba(0,0,0,0.06)",
                  color: preferredRegionInput.trim() ? "#fff" : "var(--muted)",
                  fontSize: "13px", fontWeight: 600, cursor: preferredRegionInput.trim() ? "pointer" : "default",
                  opacity: competitorLoading ? 0.6 : 1
                }}
              >
                {competitorLoading
                  ? (ko ? "검색 중..." : "Searching...")
                  : preferredRegionInput.trim()
                    ? (ko ? `"${preferredRegionInput.trim()}" 주변 ${keyword} 검색` : `Search ${keyword} near "${preferredRegionInput.trim()}"`)
                    : (ko ? "아래에서 지역을 먼저 입력하세요" : "Enter region below first")}
              </button>
            </div>

            {competitorResults && (
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 16,
                    background: competitorResults.totalCount <= 5 ? "#1d355718" : competitorResults.totalCount <= 15 ? "#19197018" : "#b64c4c18",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px", fontWeight: 700,
                    color: competitorResults.totalCount <= 5 ? "#1d3557" : competitorResults.totalCount <= 15 ? "#191970" : "#b64c4c"
                  }}>
                    {competitorResults.totalCount}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>
                      {competitorResults.totalCount === 0
                        ? (ko ? "주변에 동종 업체가 없습니다" : "No competitors nearby")
                        : (ko ? `주변에 ${keyword} ${competitorResults.totalCount}곳 발견` : `${competitorResults.totalCount} ${keyword} found nearby`)}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                      {competitorResults.totalCount === 0
                        ? (ko ? "블루오션 지역입니다" : "Blue ocean area")
                        : competitorResults.totalCount <= 5
                          ? (ko ? "경쟁이 적어 진입하기 좋습니다" : "Low competition, good entry")
                          : competitorResults.totalCount <= 15
                            ? (ko ? "보통 수준의 경쟁입니다. 차별화 전략이 필요합니다" : "Medium competition. Differentiation needed")
                            : (ko ? "경쟁이 매우 치열합니다. 강력한 차별점이 필요합니다" : "Very competitive. Strong differentiation required")}
                    </div>
                  </div>
                </div>

                {competitorResults.places.length > 0 && (
                  <div style={{ display: "grid", gap: "6px" }}>
                    {competitorResults.places.slice(0, 5).map((place, pi) => (
                      <a key={pi} href={place.url} target="_blank" rel="noopener noreferrer" style={{
                        display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                        borderRadius: "12px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)",
                        textDecoration: "none", color: "inherit"
                      }}>
                        <div style={{ width: 24, height: 24, borderRadius: 8, background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{pi + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.address}</div>
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--primary)", flexShrink: 0 }}>↗</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── 라이브 상권 인사이트 패널 ── */}
      {preferredRegionInput.trim() && (() => {
        const ko = language === "ko";

        const loadMarketInsights = async () => {
          if (liveMarketInsights && !liveMarketInsights.loading) return;
          setLiveMarketInsights({ loading: true });
          try {
            const session = await supabase.auth.getSession();
            const tk = session.data.session?.access_token;
            const parts = preferredRegionInput.trim().replace(/\s+/g, " ").split(" ");
            let sido = parts[0] ?? "";
            if (sido === "서울") sido = "서울특별시";
            else if (sido === "부산") sido = "부산광역시";
            else if (sido === "경기") sido = "경기도";
            else if (sido === "인천") sido = "인천광역시";
            else if (sido === "대구") sido = "대구광역시";
            else if (sido === "대전") sido = "대전광역시";
            const sigungu = parts[1] ?? "";

            const popRes = sido
              ? await fetch(`/api/data/population?sido=${encodeURIComponent(sido)}&sigungu=${encodeURIComponent(sigungu)}`, { headers: tk ? { Authorization: `Bearer ${tk}` } : {} }).then(r => r.json()).catch(() => null)
              : null;

            const result: typeof liveMarketInsights = { loading: false };
            if (popRes?.data?.length) {
              const popArr = popRes.data as Array<{ totalPopulation: number; householdCount: number; malePopulation: number; femalePopulation: number }>;
              result.population = {
                total: popArr.reduce((s, p) => s + p.totalPopulation, 0),
                households: popArr.reduce((s, p) => s + p.householdCount, 0),
                male: popArr.reduce((s, p) => s + p.malePopulation, 0),
                female: popArr.reduce((s, p) => s + p.femalePopulation, 0),
              };
            }
            setLiveMarketInsights(result);
          } catch {
            setLiveMarketInsights({ loading: false });
          }
        };

        // ⚠️ render 중 setState 금지. Promise.resolve() 로 마이크로태스크 큐에 넣어
        //  현재 render commit 이후에 setLiveMarketInsights 가 호출되도록 한다.
        if (!liveMarketInsights) void Promise.resolve().then(loadMarketInsights);

        if (!liveMarketInsights || liveMarketInsights.loading) {
          return (
            <div style={{ marginBottom: "16px", padding: "18px 20px", borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(219,234,254,0.12) 0%, rgba(255,255,255,0.9) 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb", animation: "bentoPulse 1.5s infinite" }} />
                <span style={{ fontSize: "14px", fontWeight: 600 }}>{ko ? "상권 데이터 조회 중..." : "Loading market data..."}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "12px" }}>
                {[0, 1, 2].map(i => <div key={i} style={{ height: "52px", borderRadius: "12px", background: "rgba(0,0,0,0.03)" }} />)}
              </div>
            </div>
          );
        }

        if (!liveMarketInsights.population) return null;
        const pop = liveMarketInsights.population;
        const femaleRatio = pop.total > 0 ? Math.round((pop.female / pop.total) * 100) : 50;

        return (
          <div style={{ marginBottom: "16px", borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(219,234,254,0.12) 0%, rgba(255,255,255,0.92) 100%)", overflow: "hidden" }} className="bento-fade-in">
            <div style={{ padding: "18px 20px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb" }} />
                <span style={{ fontSize: "15px", fontWeight: 650, letterSpacing: "-0.02em" }}>{ko ? "상권 인구 데이터" : "Market Demographics"}</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "행정안전부 인구통계 API" : "MOIS Population API"}</div>
            </div>
            <div style={{ padding: "0 20px 18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(37,99,235,0.04)" }}>
                <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "총 인구" : "Population"}</div>
                <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#0f172a" }}>{pop.total.toLocaleString()}</div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{ko ? "명" : "people"}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(37,99,235,0.04)" }}>
                <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "세대 수" : "Households"}</div>
                <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#0f172a" }}>{pop.households.toLocaleString()}</div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{ko ? "세대" : "units"}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(37,99,235,0.04)" }}>
                <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "여성 비율" : "Female %"}</div>
                <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#0f172a" }}>{femaleRatio}%</div>
                <div style={{ display: "flex", gap: "2px", marginTop: "6px" }}>
                  <div style={{ flex: femaleRatio, height: "4px", borderRadius: "2px", background: "#ec4899" }} />
                  <div style={{ flex: 100 - femaleRatio, height: "4px", borderRadius: "2px", background: "#3b82f6" }} />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
          onChange={(event) => { setPreferredRegionInput(event.target.value); setLocationMapReady(false); }}
          placeholder={locationInputPlaceholder}
          style={styles.textInput}
        />
        <div style={styles.segmentedRow}>
          <button
            type="button"
            disabled={!preferredRegionInput.trim()}
            style={{
              ...styles.button,
              ...(locationMapReady && locationMode === "recommended"
                ? styles.buttonSelected
                : preferredRegionInput.trim()
                  ? { background: "var(--primary)", color: "#fff", border: "1px solid var(--primary)", fontWeight: 600 }
                  : { opacity: 0.45 })
            }}
            onClick={() => {
              setLocationMode("recommended");
              setLocationMapReady(true);
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
              ...(locationMode === "direct" && !locationMapReady ? styles.buttonSelected : {})
            }}
            onClick={() => {
              setLocationMode("direct");
              setLocationMapReady(false);
              setSelectedLocationId(undefined);
            }}
          >
            {locationDirectLabel}
          </button>
        </div>

        {/* ── AI + Kakao 라이브 추천 CTA ────────────────────────────
            서버 내장 데이터로는 모든 지역(특히 비-서울)을 커버 못 함 →
            "AI로 실시간 추천" 버튼으로 Kakao Local 라이브 검색 + Claude 점수화. */}
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
                ? `Kakao Local + Claude 가 입력하신 "${preferredRegionInput.trim() || "지역"}" 주변을 분석해 3~5개 후보를 점수와 함께 추천합니다.`
                : `Kakao Local + Claude analyse around "${preferredRegionInput.trim() || "region"}" and score 3–5 candidates.`}
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
      </div>

      {locationMapReady && locationMode === "recommended" ? (
        <>
        {/* ── Kakao Map + Location Cards (Apple-style) ── */}
        {locationMapReady && (
          <LocationMapPanel
            candidates={activeLocationCandidates}
            selectedId={selectedLocationId}
            onSelect={(id) => setSelectedLocationId(id)}
            language={language}
            region={preferredRegionInput}
          />
        )}
        <div ref={locationRef} style={{ display: "grid", gap: "10px", ...(shakeWarning ? { outline: "2px solid #b64c4c", outlineOffset: "4px", borderRadius: "16px", transition: "outline 0.3s ease" } : {}) }}>
          {activeLocationCandidates.map((item) => {
            const selected = selectedLocationId === item.id;
            const freshness = getFreshnessPresentation(item.freshness);
            const scoreColor = (item.score ?? 0) >= 85 ? "#1d3557" : (item.score ?? 0) >= 70 ? "#007aff" : "#191970";
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

      <StageWrapup
        ko={language === "ko"}
        nextStageLabelKo="계약서 검토"
        doneItemsKo={[
          { label: "1. 113개 상권 데이터 검토", detail: "유동인구·평균임대료·동종업종 밀도 비교 — 점수화된 상권 추천" },
          { label: "2. 상위 후보 3곳 선정", detail: "AI 점수 + 본인 자본 + 업종 적합도로 1차 압축" },
          { label: "3. 직접 상권 평가", detail: "지도에서 직접 입력한 위치도 분석 — 동일 점수 모델 적용" },
          { label: "4. 최종 1곳 확정", detail: "현장 답사·임대료 견적·매물 확인 후 1곳 결정" },
        ]}
        verifyItemsKo={[
          "임대 매물 상태 직접 확인 — 누수·결로·소방·주차·하수도·전기용량 5개 항목 사진 기록",
          "상권 유동인구 — 평일·주말·야간 3시간대 직접 카운트 검증 (행정 데이터는 평균값에 불과)",
          "동종업종 반경 200m 안 5개 이상이면 → 차별화 메뉴·시간·가격 1개 이상 확보 필수",
          "임대인 신원·등기부등본 직접 열람 — 가압류·근저당 있으면 보증금 보호 못 받을 위험",
          "용도지역(주거·상업·일반·전용) 확인 — 음식점은 일반·근린상업 가능, 주거지역은 면적 제한",
          "건물주의 「다음 임차인」 정책 — 5년 이내 강제 갱신·인테리어 잔존가치 분쟁 사전 점검",
        ]}
        nextSummaryKo="입지 1곳 확정 → 임대 계약서 검토 단계로 진입"
      />

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
              setShakeWarning(true);
              locationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => setShakeWarning(false), 2000);
              return;
            }
            handleLocationContinue();
          }}
        >
          {!canCompleteLocationStep
            ? (language === "ko" ? "↑ 상권을 선택하세요" : "↑ Select a market")
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
