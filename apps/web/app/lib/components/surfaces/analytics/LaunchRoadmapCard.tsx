"use client";

import React from "react";
import { TrendingUp, Scissors, AlertOctagon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import { hydrateSavedFinanceSnapshot } from "../../../helpers";
import { SURFACE_HREFS } from "../../../constants";
import {
  localizeRecommendationItem,
  formatBudgetPresetLabel,
  formatStartupType,
} from "@foundone/shared";

export function LaunchRoadmapCard() {
  const d = useDashboardCtx();
  const {
    language,
    dailyEntries,
    monthlyCosts,
    decisions,
    setDecisions,
    profile,
    persistenceReady,
    businessLaunched,
    storeName,
    setStoreName,
    flushStoreData,
    router,
    opsSelections,
    setOpsSelections,
    cpaDecision,
    setCpaDecision,
    softOpenPricing,
    setSoftOpenPricing,
    savedFinanceSnapshot,
    roadmap,
    pathTotalStages,
    selectedBudget,
  } = d;

  const fmt = (n: number) =>
    n >= 10000
      ? `${Math.round(n / 10000).toLocaleString()}만원`
      : `${Math.round(n).toLocaleString()}원`;

  const ko = language === "ko";
  const notSet = ko ? "미입력" : "—";
  const divider = <div style={{ height: "1px", background: "rgba(0,0,0,0.06)" }} />;

  // ── 공통 스타일 헬퍼 ──
  const tileStyle: React.CSSProperties = { background: "rgba(0,0,0,0.03)", borderRadius: "12px", padding: "12px 13px" };
  const tileLabelStyle: React.CSSProperties = { fontSize: "11px", color: "var(--muted)", marginBottom: "5px", letterSpacing: "0.02em" };
  const tileValueStyle = (empty: boolean): React.CSSProperties => ({ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.2px", color: empty ? "var(--muted)" : "inherit" });
  const sectionLabel = (text: string, editHint?: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
        {text}
      </div>
      {editHint && <div style={{ fontSize: "11px", color: "var(--muted)", fontStyle: "italic" }}>{editHint}</div>}
    </div>
  );
  const chip = (text: string, active = true) => (
    <span key={text} style={{ display: "inline-block", fontSize: "11px", fontWeight: 500, color: active ? "#007aff" : "var(--muted)", background: active ? "rgba(0,122,255,0.08)" : "rgba(0,0,0,0.05)", borderRadius: "6px", padding: "3px 8px" }}>
      {text}
    </span>
  );

  // 해당 로드맵 단계로 이동 (?editStage= 쿼리 파라미터로 전달)
  const goToStage = (stageId: string) => {
    router.push(`${SURFACE_HREFS.current}?editStage=${stageId}`);
  };

  // ── 데이터 추출 ──
  const industryId = decisions["industry-selection"]?.selectedPrimaryOptionId ?? profile?.subIndustryId;
  const industryLabel = industryId ? localizeRecommendationItem({ id: industryId, title: industryId }, language).title : notSet;
  const startupTypeVal = decisions["startup-type"]?.selectedPrimaryOptionId ?? profile?.startupType;
  const startupTypeLabel = startupTypeVal ? formatStartupType(String(startupTypeVal), language) : notSet;
  const bizModelId = decisions["business-model"]?.selectedPrimaryOptionId ?? profile?.businessModelId;
  const bizModelLabel = bizModelId ? localizeRecommendationItem({ id: String(bizModelId), title: String(bizModelId) }, language).title : notSet;
  const capitalVal = decisions["budget-setup"]?.inputs?.capital ?? profile?.capital;
  const capitalLabel = capitalVal != null ? formatBudgetPresetLabel(Number(capitalVal), language) : notSet;
  const openDateVal = decisions["budget-setup"]?.inputs?.targetOpenDate
    ?? (typeof window !== "undefined" ? localStorage.getItem("businessLaunchedDate") : null);
  const openDateLabel = openDateVal ? String(openDateVal) : notSet;
  const locationId = decisions["location-candidates"]?.selectedPrimaryOptionId;
  const regionInput = decisions["location-candidates"]?.inputs?.preferredRegion;
  const locationLabel = locationId
    ? localizeRecommendationItem({ id: String(locationId), title: String(locationId) }, language).title
    : regionInput ? String(regionInput) : notSet;

  // 재무 시뮬레이션
  const finSnap = hydrateSavedFinanceSnapshot(decisions["financial-simulation"]);
  const contractRiskRaw = decisions["contract-analysis"]?.inputs?.riskLevel;
  const contractRisk = typeof contractRiskRaw === "string" ? contractRiskRaw : undefined;

  // 운영 채널
  const deliveryPlatforms = [
    { id: "baemin",       label: "배민" },
    { id: "coupangeats",  label: "쿠팡이츠" },
    { id: "yogiyo",       label: "요기요" },
    { id: "naver-order",  label: "네이버주문" },
  ].filter(p => (opsSelections as Record<string, boolean>)[`delivery-${p.id}`]);
  const snsPlatforms = [
    { id: "instagram",       label: "인스타그램" },
    { id: "naver-place",     label: "네이버플레이스" },
    { id: "kakao-channel",   label: "카카오채널" },
    { id: "google-business", label: "구글비즈니스" },
  ].filter(p => (opsSelections as Record<string, boolean>)[`sns-${p.id}`]);
  const softOpenPricingLabel =
    softOpenPricing === "free"     ? (ko ? "무료 제공" : "Free") :
    softOpenPricing === "discount" ? (ko ? "30–50% 할인" : "30–50% off") :
    softOpenPricing === "full"     ? (ko ? "정가 운영" : "Full price") : null;

  // 로드맵 진행
  const totalStages = pathTotalStages;
  const completedCount = roadmap.completedStageIds.length;
  const progressPct = Math.min(100, Math.round((completedCount / totalStages) * 100));

  // 위험도 색상
  const riskColor = (r: string | undefined) =>
    r === "low" ? "#1d3557" : r === "medium" ? "#191970" : r === "high" || r === "critical" ? "#b64c4c" : "var(--muted)";
  const riskLabel = (r: string | undefined) =>
    !r ? notSet :
    ko ? (r === "low" ? "낮음" : r === "medium" ? "보통" : r === "high" ? "높음" : "위험") :
         (r === "low" ? "Low" : r === "medium" ? "Medium" : r === "high" ? "High" : "Critical");

  if (!persistenceReady) {
    return (
      <article style={{ ...styles.card, gap: "12px" }}>
        <div style={{ fontSize: "13px", color: "var(--muted)" }}>
          {ko ? "데이터 불러오는 중…" : "Loading data…"}
        </div>
      </article>
    );
  }

  return (
    <>
      {/* 생존 진단 카드는 대시보드 홈 KPI로 이동됨 */}
      {false && (() => {
        const launchDateStr = typeof window !== "undefined" ? localStorage.getItem("businessLaunchedDate") : null;
        if (!launchDateStr) return null;
        const launchDate = new Date(launchDateStr!);
        const today = new Date();
        const daysSinceLaunch = Math.floor((today.getTime() - launchDate.getTime()) / 86400000);
        if (daysSinceLaunch < 0) return null;

        // 현재 달 매출 데이터
        type DE = { date: string; sales: number; customers: number };
        const allEntries = dailyEntries as DE[];
        const totalRevenue = allEntries.reduce((s, e) => s + e.sales, 0);
        const totalDays = allEntries.length;
        const avgDaily = totalDays > 0 ? totalRevenue / totalDays : 0;
        const monthlyProjected = avgDaily * 30;

        // BEP 비교
        const bepRevenue = savedFinanceSnapshot?.breakEvenRevenue ?? 0;
        const bepAchievement = bepRevenue > 0 ? Math.max(0, Math.round((monthlyProjected / bepRevenue) * 100)) : 0;

        // 원가율
        const mc = monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; other: number };
        const totalCost = mc.ingredients + mc.labor + mc.rent + mc.utilities + mc.other;
        const primeRate = monthlyProjected > 0 ? ((mc.ingredients + mc.labor) / monthlyProjected) * 100 : 0;

        // 런웨이
        const monthlyNet = monthlyProjected - totalCost;
        const capitalLeft = Math.max(0, (selectedBudget ?? 0) - totalCost * (daysSinceLaunch / 30));
        const runway = totalCost > 0 && monthlyNet < 0 ? Math.max(0, Math.round(capitalLeft / Math.abs(monthlyNet))) : -1; // -1 = 흑자(무한)

        // 진단 단계 결정
        const checkpoint = daysSinceLaunch >= 90 ? 90 : daysSinceLaunch >= 60 ? 60 : daysSinceLaunch >= 30 ? 30 : 0;
        const phaseLabel = checkpoint === 0 ? (ko ? "적응기" : "Settling in")
          : checkpoint === 30 ? (ko ? "30일 진단" : "30-Day Check")
          : checkpoint === 60 ? (ko ? "60일 진단" : "60-Day Check")
          : (ko ? "90일 진단" : "90-Day Check");

        // 전체 건강 점수
        const bepScore = bepAchievement >= 100 ? 3 : bepAchievement >= 70 ? 2 : bepAchievement >= 40 ? 1 : 0;
        const primeScore = primeRate <= 60 ? 3 : primeRate <= 65 ? 2 : primeRate <= 70 ? 1 : 0;
        const runwayScore = runway >= 6 ? 3 : runway >= 3 ? 2 : runway >= 1 ? 1 : 0;
        const totalScore = bepScore + primeScore + runwayScore;
        const overallHealth = totalScore >= 7 ? "good" : totalScore >= 4 ? "caution" : "danger";
        const healthColor = overallHealth === "good" ? "#1d3557" : overallHealth === "caution" ? "#191970" : "#b64c4c";
        const healthMsg = overallHealth === "good"
          ? (ko ? "양호한 흐름입니다. 현재 방향을 유지하세요." : "On track. Maintain current direction.")
          : overallHealth === "caution"
            ? (ko ? "주의가 필요합니다. 비용 구조를 점검하세요." : "Needs attention. Review your cost structure.")
            : (ko ? "위험 신호입니다. 즉시 비용 절감과 매출 개선이 필요합니다." : "Warning. Immediate cost reduction and revenue improvement needed.");

        return (
          <article style={{
            ...styles.card,
            border: `1px solid ${healthColor}20`,
            background: `linear-gradient(180deg, rgba(255,255,255,0.92) 0%, ${healthColor}04 100%)`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: healthColor, marginBottom: "4px" }}>
                  {phaseLabel} · D+{daysSinceLaunch}
                </div>
                <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                  {ko ? "생존 진단" : "Survival Check"}
                </div>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: 22,
                background: `${healthColor}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px"
              }}>
                {overallHealth === "good" ? "✓" : overallHealth === "caution" ? "!" : "⚠"}
              </div>
            </div>

            {/* 핵심 지표 3개 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.7)", textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: bepAchievement >= 100 ? "#1d3557" : bepAchievement >= 70 ? "#191970" : "#b64c4c" }}>
                  {totalDays > 0 ? `${bepAchievement}%` : "—"}
                </div>
                <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>{ko ? "BEP 달성률" : "BEP Rate"}</div>
              </div>
              <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.7)", textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: primeRate <= 60 ? "#1d3557" : primeRate <= 65 ? "#191970" : "#b64c4c" }}>
                  {totalDays > 0 ? `${primeRate.toFixed(0)}%` : "—"}
                </div>
                <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>{ko ? "프라임코스트" : "Prime Cost"}</div>
              </div>
              <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.7)", textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: runway < 0 ? "#1d3557" : runway >= 6 ? "#1d3557" : runway >= 3 ? "#191970" : "#b64c4c" }}>
                  {totalCost > 0 ? (runway < 0 ? (ko ? "흑자" : "Surplus") : `${runway}${ko ? "개월" : "mo"}`) : "—"}
                </div>
                <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>{ko ? "현금 런웨이" : "Runway"}</div>
              </div>
            </div>

            {/* 진단 메시지 */}
            <div style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--muted)" }}>
              {healthMsg}
            </div>

            {/* 위기 대응 가이드 (문제 감지 시) */}
            {overallHealth !== "good" && totalDays > 0 && (() => {
              type CrisisAction = { Icon: LucideIcon; iconColor: string; title: string; actions: string[] };
              const crisisGuides: CrisisAction[] = [];
              if (bepAchievement < 70) {
                crisisGuides.push({
                  Icon: TrendingUp, iconColor: "#1d3557", title: ko ? "매출 증가 전략" : "Revenue Growth",
                  actions: ko
                    ? ["네이버 플레이스 리뷰 관리 — 별점 4.5 이상 유지가 신규 유입 핵심", "배달앱 상위노출 광고 (첫 주 집중)", "오프닝 프로모션 연장 또는 재이벤트", "주변 오피스/주거 타겟 전단지 + 쿠폰"]
                    : ["Maintain 4.5+ Naver Place rating", "Delivery app top-exposure ads (focus first week)", "Extend/repeat opening promotions", "Flyers + coupons targeting nearby offices/residents"]
                });
              }
              if (primeRate > 65) {
                crisisGuides.push({
                  Icon: Scissors, iconColor: "#0891b2", title: ko ? "비용 절감 전략" : "Cost Reduction",
                  actions: ko
                    ? ["공급업체 2곳 이상 비교 견적 받기", "저마진 메뉴 제거 또는 가격 조정", "피크/비피크 시간대 인력 재배치", "식재료 로스 줄이기 — 일별 사용량 기록 시작"]
                    : ["Get quotes from 2+ suppliers", "Remove low-margin items or adjust pricing", "Redistribute staff between peak/off-peak", "Reduce food waste — start daily usage tracking"]
                });
              }
              if (runway < 3) {
                crisisGuides.push({
                  Icon: AlertOctagon, iconColor: "#b64c4c", title: ko ? "긴급 자금 확보" : "Emergency Funding",
                  actions: ko
                    ? ["소상공인 긴급경영안정자금 신청 (소진공 1357)", "불필요한 고정비 즉시 해지 (미사용 구독, 과잉 보험)", "매출 집중 — 배달 전용 메뉴 추가로 매출원 다변화", "세무사 상담 — 비용 처리 최적화로 현금흐름 개선"]
                    : ["Apply for emergency SME stabilization fund (SEMAS 1357)", "Cancel unnecessary fixed costs (unused subscriptions, excess insurance)", "Diversify revenue — add delivery-only menu", "Tax advisor — optimize expense treatment for cash flow"]
                });
              }
              if (crisisGuides.length === 0) return null;
              return (
                <div style={{ display: "grid", gap: "8px" }}>
                  {crisisGuides.map((guide, gi) => (
                    <div key={gi} style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.7)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <guide.Icon size={14} strokeWidth={1.5} color={guide.iconColor} /> {guide.title}
                      </div>
                      {guide.actions.map((action, ai) => (
                        <div key={ai} style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--muted)", display: "flex", gap: "6px", marginBottom: "3px" }}>
                          <span style={{ color: "var(--primary)", flexShrink: 0 }}>•</span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* 체크포인트별 추가 안내 */}
            {checkpoint >= 30 && totalDays > 0 && (
              <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--muted)", padding: "10px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)" }}>
                {checkpoint === 30 && (ko
                  ? `개업 30일 경과. 월 예상 매출 ${fmt(monthlyProjected)}으로 BEP(${fmt(bepRevenue)}) 대비 ${bepAchievement}% 달성 중입니다.${bepAchievement < 70 ? " 마케팅 강화와 메뉴 점검을 권장합니다." : ""}`
                  : `30 days since opening. Projected monthly ${fmt(monthlyProjected)} = ${bepAchievement}% of BEP (${fmt(bepRevenue)}).`)}
                {checkpoint === 60 && (ko
                  ? `개업 60일 경과. 프라임코스트 ${primeRate.toFixed(1)}%${primeRate > 65 ? " — 식재료비 또는 인건비 재검토가 필요합니다." : "로 안정적입니다."} 고정비 구조를 점검하세요.`
                  : `60 days. Prime cost ${primeRate.toFixed(1)}%.${primeRate > 65 ? " Review ingredient or labor costs." : " Stable."} Check fixed cost structure.`)}
                {checkpoint === 90 && (ko
                  ? `개업 90일 경과. ${monthlyNet >= 0 ? "흑자 구조입니다. 안정적 성장 단계로 진입했습니다." : "적자 구조입니다. 메뉴 가격, 원가, 고정비 중 하나를 반드시 조정해야 합니다."}`
                  : `90 days. ${monthlyNet >= 0 ? "Profitable. Entering stable growth phase." : "Loss structure. Must adjust menu pricing, costs, or fixed expenses."}`)}
              </div>
            )}
          </article>
        );
      })()}

      {/* ── 카드 1: 사업 기본 정보 ── */}
      <article style={{ ...styles.card, gap: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {sectionLabel(ko ? "사업 기본 정보" : "Business Info")}
          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "10px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: businessLaunched ? "#1d3557" : "#191970" }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: businessLaunched ? "#1d3557" : "#191970" }}>
              {businessLaunched ? (ko ? "개업 운영 중" : "Open") : (ko ? "준비 중" : "Preparing")}
            </span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {/* 상호명 — 직접 편집 */}
          <div style={tileStyle}>
            <div style={tileLabelStyle}>{ko ? "상호명" : "Store name"}</div>
            <input
              type="text"
              value={storeName ?? ""}
              placeholder={ko ? "상호명 입력" : "Enter name"}
              onChange={(e) => { setStoreName(e.target.value); flushStoreData(); }}
              style={{
                width: "100%", border: "none", background: "transparent", outline: "none",
                fontSize: "15px", fontWeight: 640, color: "#0f172a", padding: 0,
                fontFamily: "inherit",
              }}
            />
          </div>
          {/* 초기 자본금 — 직접 편집 */}
          <div style={tileStyle}>
            <div style={tileLabelStyle}>{ko ? "초기 자본금" : "Capital"}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <input
                type="text" inputMode="numeric"
                value={capitalVal != null ? String(Math.round(Number(capitalVal) / 10000)) : ""}
                placeholder="0"
                onChange={(e) => {
                  const val = Number(e.target.value.replace(/[^0-9]/g, "")) * 10000;
                  setDecisions((prev: Record<string, unknown>) => ({
                    ...prev,
                    "budget-setup": { ...(prev["budget-setup"] as Record<string, unknown> ?? {}), stageId: "budget-setup", inputs: { ...((prev["budget-setup"] as Record<string, unknown>)?.inputs as Record<string, unknown> ?? {}), capital: val } }
                  }));
                  flushStoreData();
                }}
                style={{
                  width: "80px", border: "none", background: "transparent", outline: "none",
                  fontSize: "15px", fontWeight: 640, color: "#0f172a", padding: 0,
                  fontFamily: "inherit",
                }}
              />
              <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.4)" }}>{ko ? "만원" : "만₩"}</span>
            </div>
          </div>
          {/* 개업 목표일 — 직접 편집 */}
          <div style={tileStyle}>
            <div style={tileLabelStyle}>{ko ? "개업 목표일" : "Target date"}</div>
            <input
              type="date"
              value={openDateVal ? String(openDateVal) : ""}
              onChange={(e) => {
                setDecisions((prev: Record<string, unknown>) => ({
                  ...prev,
                  "budget-setup": { ...(prev["budget-setup"] as Record<string, unknown> ?? {}), stageId: "budget-setup", inputs: { ...((prev["budget-setup"] as Record<string, unknown>)?.inputs as Record<string, unknown> ?? {}), targetOpenDate: e.target.value } }
                }));
                flushStoreData();
              }}
              style={{
                width: "100%", border: "none", background: "transparent", outline: "none",
                fontSize: "14px", fontWeight: 600, color: "#0f172a", padding: 0,
                fontFamily: "inherit",
              }}
            />
          </div>
          {/* 상권·입지 — 직접 편집 */}
          <div style={tileStyle}>
            <div style={tileLabelStyle}>{ko ? "상권·입지" : "Location"}</div>
            <input
              type="text"
              value={regionInput ? String(regionInput) : ""}
              placeholder={ko ? "지역 입력 (예: 강남역)" : "Location"}
              onChange={(e) => {
                setDecisions((prev: Record<string, unknown>) => ({
                  ...prev,
                  "location-candidates": { ...(prev["location-candidates"] as Record<string, unknown> ?? {}), stageId: "location-candidates", inputs: { ...((prev["location-candidates"] as Record<string, unknown>)?.inputs as Record<string, unknown> ?? {}), preferredRegion: e.target.value } }
                }));
                flushStoreData();
              }}
              style={{
                width: "100%", border: "none", background: "transparent", outline: "none",
                fontSize: "14px", fontWeight: 600, color: "#0f172a", padding: 0,
                fontFamily: "inherit",
              }}
            />
          </div>
          {/* 업종 / 창업 형태 / 운영 방식 — 표시만 (변경 시 로드맵 전체 영향) */}
          {[
            { label: ko ? "업종" : "Industry",           value: industryLabel,    stageId: "industry-selection" },
            { label: ko ? "창업 형태" : "Startup type",  value: startupTypeLabel, stageId: "startup-type" },
            { label: ko ? "운영 방식" : "Model",         value: bizModelLabel,    stageId: "business-model" },
          ].map(({ label, value, stageId }) => (
            <button
              key={label}
              onClick={() => goToStage(stageId)}
              style={{ ...tileStyle, border: "none", cursor: "pointer", textAlign: "left" as const, display: "block", width: "100%", position: "relative" as const, transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,122,255,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.03)")}
            >
              <div style={tileLabelStyle}>{label}</div>
              <div style={tileValueStyle(value === notSet)}>{value}</div>
              <div style={{ position: "absolute" as const, top: "9px", right: "9px", fontSize: "10px", fontWeight: 600, color: "rgba(0,122,255,0.6)" }}>
                {ko ? "수정 →" : "Edit →"}
              </div>
            </button>
          ))}
        </div>
      </article>

      {/* ── 카드 2: 재무 진단 ── */}
      {finSnap && (
        <article style={{ ...styles.card, gap: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
              {ko ? "재무 시뮬레이션 결과" : "Financial Forecast"}
            </div>
            <button
              onClick={() => router.push(`/guides?panel=finance`)}
              style={{ fontSize: "11px", color: "#007aff", fontWeight: 600, background: "rgba(0,122,255,0.08)", border: "none", borderRadius: "8px", padding: "4px 10px", cursor: "pointer" }}
            >
              {ko ? "다시 계산" : "Recalculate"}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={tileStyle}>
              <div style={tileLabelStyle}>{ko ? "손익분기 월매출" : "Break-even revenue"}</div>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>{fmt(finSnap.breakEvenRevenue)}</div>
            </div>
            <div style={tileStyle}>
              <div style={tileLabelStyle}>{ko ? "자본 생존 가능 기간" : "Runway"}</div>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>
                {finSnap.survivabilityMonths > 0 ? `${finSnap.survivabilityMonths}${ko ? "개월" : "mo"}` : notSet}
              </div>
            </div>
            <div style={tileStyle}>
              <div style={tileLabelStyle}>{ko ? "재무 위험 등급" : "Risk level"}</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: riskColor(finSnap.riskLevel) }}>
                {riskLabel(finSnap.riskLevel)}
              </div>
            </div>
            <div style={tileStyle}>
              <div style={tileLabelStyle}>{ko ? "인테리어 후 잔여 자본" : "Capital after setup"}</div>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>
                {finSnap.capitalAfterSetupLow > 0
                  ? `${fmt(finSnap.capitalAfterSetupLow)} ~ ${fmt(finSnap.capitalAfterSetupHigh)}`
                  : notSet}
              </div>
            </div>
            {finSnap.breakEvenMonth != null && (
              <div style={tileStyle}>
                <div style={tileLabelStyle}>{ko ? "손익분기 예상 시점" : "BEP month"}</div>
                <div style={{ fontSize: "15px", fontWeight: 700 }}>
                  {ko ? `개업 후 ${finSnap.breakEvenMonth}개월차` : `Month ${finSnap.breakEvenMonth}`}
                </div>
              </div>
            )}
            {contractRisk && (
              <div style={tileStyle}>
                <div style={tileLabelStyle}>{ko ? "임대차 계약 위험도" : "Contract risk"}</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: riskColor(String(contractRisk)) }}>
                  {riskLabel(String(contractRisk))}
                </div>
              </div>
            )}
          </div>
        </article>
      )}

      {/* ── 카드 3: 운영 채널 & 세팅 ── */}
      {(() => {
        const allDelivery = [
          { id: "baemin",       label: "배민" },
          { id: "coupangeats",  label: "쿠팡이츠" },
          { id: "yogiyo",       label: "요기요" },
          { id: "naver-order",  label: "네이버주문" },
        ];
        const allSns = [
          { id: "instagram",       label: "인스타그램" },
          { id: "naver-place",     label: "네이버플레이스" },
          { id: "kakao-channel",   label: "카카오채널" },
          { id: "google-business", label: "구글비즈니스" },
        ];
        const toggleChip = (key: string, label: string, active: boolean, onToggle: () => void) => (
          <button
            key={key}
            onClick={onToggle}
            style={{
              display: "inline-block", fontSize: "11px", fontWeight: 600, border: "none", cursor: "pointer",
              color: active ? "#007aff" : "var(--muted)",
              background: active ? "rgba(0,122,255,0.1)" : "rgba(0,0,0,0.05)",
              borderRadius: "7px", padding: "5px 10px",
              outline: active ? "1.5px solid rgba(0,122,255,0.3)" : "none",
              transition: "all 0.15s"
            }}
          >
            {active ? "✓ " : ""}{label}
          </button>
        );
        const pricingOptions = [
          { id: "free",     label: ko ? "무료 제공" : "Free" },
          { id: "discount", label: ko ? "30–50% 할인" : "Discount" },
          { id: "full",     label: ko ? "정가 운영" : "Full price" },
        ];
        return (
          <article style={{ ...styles.card, gap: "14px" }}>
            {sectionLabel(ko ? "운영 채널 & 세팅" : "Operations", ko ? "직접 수정 가능" : "Edit inline")}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>
              {/* 배달 플랫폼 */}
              <div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "7px" }}>{ko ? "배달 플랫폼" : "Delivery platforms"}</div>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
                  {allDelivery.map(p => {
                    const k = `delivery-${p.id}`;
                    const active = !!(opsSelections as Record<string, boolean>)[k];
                    return toggleChip(k, p.label, active, () => setOpsSelections(prev => ({ ...prev, [k]: !prev[k] })));
                  })}
                </div>
              </div>
              {divider}
              {/* SNS 채널 */}
              <div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "7px" }}>{ko ? "SNS 채널" : "SNS channels"}</div>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
                  {allSns.map(p => {
                    const k = `sns-${p.id}`;
                    const active = !!(opsSelections as Record<string, boolean>)[k];
                    return toggleChip(k, p.label, active, () => setOpsSelections(prev => ({ ...prev, [k]: !prev[k] })));
                  })}
                </div>
              </div>
              {divider}
              {/* 세무 처리 */}
              <div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "7px" }}>{ko ? "세무 처리 방식" : "Tax filing"}</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {toggleChip("cpa", ko ? "세무사 선임" : "CPA hired", cpaDecision === "cpa", () => setCpaDecision(cpaDecision === "cpa" ? null : "cpa"))}
                  {toggleChip("self", ko ? "직접 신고" : "Self-filing", cpaDecision === "self", () => setCpaDecision(cpaDecision === "self" ? null : "self"))}
                </div>
              </div>
              {divider}
              {/* 소프트오픈 가격 전략 */}
              <div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "7px" }}>{ko ? "소프트오픈 가격 전략" : "Soft open pricing"}</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {pricingOptions.map(opt =>
                    toggleChip(opt.id, opt.label, softOpenPricing === opt.id, () => setSoftOpenPricing(softOpenPricing === opt.id ? "" : opt.id))
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })()}

      {/* 월 비용 구조 → 오른쪽 비용 카드에 통합됨 */}

      {/* ── 카드 5: 로드맵 진행 ── */}
      <article style={{ ...styles.card, gap: "14px" }}>
        {sectionLabel(ko ? "로드맵 진행" : "Roadmap Progress")}
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "2px" }}>
          <span style={{ fontSize: "36px", fontWeight: 700, letterSpacing: "-1px" }}>{completedCount}</span>
          <span style={{ fontSize: "15px", color: "var(--muted)", fontWeight: 500 }}>/ {totalStages}{ko ? "단계 완료" : " stages"}</span>
        </div>
        <div style={{ height: "6px", borderRadius: "4px", background: "rgba(0,0,0,0.08)", overflow: "hidden" as const }}>
          <div style={{ height: "100%", borderRadius: "4px", background: completedCount >= totalStages ? "#1d3557" : "#007aff", width: `${progressPct}%`, transition: "width 0.4s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "창업 준비 시작" : "Start"}</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: completedCount >= totalStages ? "#1d3557" : "#007aff" }}>{progressPct}%</span>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "개업 완료" : "Open"}</span>
        </div>
      </article>
    </>
  );
}
