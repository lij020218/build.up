"use client";

import { useRef, useState } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import {
  formatBudgetPresetLabel,
  formatFranchiseCost,
  formatOpenDatePresetLabel,
  getFranchiseBrandById,
  starterBudgetPresets,
  starterOpenDatePresets,
} from "@foundone/shared";
import { StageWrapup } from "../shared/StageWrapup";
import { KeyActionHero } from "../shared/StageActionHero";
import { BudgetInsightCard } from "./BudgetInsightCard";
import { BudgetFundingMatchCard } from "./BudgetFundingMatchCard";

export function BudgetSetupStage() {
  const d = useDashboardCtx();
  const {
    language,
    copy,
    industryCategoryId,
    selectedIndustryId,
    startupType,
    selectedFranchiseBrandId,
    selectedBudget, setSelectedBudget,
    budgetInputText, setBudgetInputText,
    initialOperatingCapital, setInitialOperatingCapital,
    operatingCapitalInputText, setOperatingCapitalInputText,
    startupOperatingMode, setStartupOperatingMode,
    sliderBudgetValue,
    activeBudgetLabel,
    selectedOpenDate, setSelectedOpenDate,
    activeOpenDatePreset,
    canCompleteBudgetStep, handleBudgetContinue,
    prevTraversedStage, setViewingStageId,
    resetDemo,
  } = d;

  const budgetRef = useRef<HTMLDivElement>(null);
  const [shakeWarning, setShakeWarning] = useState(false);
  // ── 스타트업 운영 모드 ──
  //  profile-store 에 영속됨 — 다른 단계 (FundraisingReadiness 등) 에서 동일 모드 활용.
  //  default: bootstrap (대부분의 초기 창업자가 여기에 해당)
  const startupMode = startupOperatingMode;
  const setStartupMode = setStartupOperatingMode;

  return (
    <>
      <KeyActionHero
        ko={language === "ko"}
        action={{
          title: language === "ko"
            ? "총 초기 자본의 30%는 운영 예비비로 — 1·2층 망함률을 가르는 한 줄"
            : "Reserve 30% of total capital as operating buffer — the line that decides survival",
          detail: language === "ko"
            ? "보증금·인테리어·집기·인허가 외에 6개월 운영비를 따로 떼어 놓아야 첫 매출까지 버틴다. 운영비 없이 시작한 가게의 1년 폐업률이 3배."
            : "Beyond deposit, interior, equipment, and permits, set aside 6 months of operating costs to survive until first revenue. Stores starting without it close at 3x the 1-year rate.",
        }}
      />
      <div style={styles.helper}>
        {copy.home.budgetHelp}
      </div>

      {/* ── Franchise cost guide panel ── */}
      {startupType === "franchise" && selectedFranchiseBrandId && (() => {
        const fb = getFranchiseBrandById(selectedFranchiseBrandId);
        if (!fb) return null;
        const ko = language === "ko";
        const totalCost = fb.startupCostWon;
        const hasBreakdown = fb.costVerified && fb.costBreakdown && fb.costBreakdown.length > 0;

        return (
          <div style={{
            marginBottom: "18px",
            borderRadius: "28px",
            border: "1px solid rgba(255,255,255,0.78)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)",
            boxShadow: "0 12px 28px rgba(17,17,17,0.04)",
            overflow: "hidden"
          }}>
            {/* header */}
            <div style={{ padding: "22px 24px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: "linear-gradient(135deg, var(--primary), rgba(117,163,255,0.9))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: "14px", fontWeight: 700
                }}>
                  ₩
                </div>
                <div>
                  <div style={{ fontSize: "17px", fontWeight: 680, letterSpacing: "-0.02em" }}>
                    {fb.name[language]}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                    {ko ? "예상 창업 비용 안내" : "Estimated Startup Cost Guide"}
                  </div>
                </div>
              </div>
            </div>

            {/* total highlight */}
            <div style={{
              margin: "0 24px",
              padding: "16px 20px",
              borderRadius: "18px",
              background: "rgba(29,53,87,0.04)",
              border: "1px solid rgba(29,53,87,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "2px" }}>
                  {ko ? "예상 총 비용" : "Estimated Total"}
                  {fb.basePyeong ? ` (${fb.basePyeong}${ko ? "평 기준" : "py"})` : ""}
                </div>
                <div style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--primary)" }}>
                  {formatFranchiseCost(totalCost)}<span style={{ fontSize: "16px", fontWeight: 500 }}>원</span>
                </div>
              </div>
              {fb.monthlyRoyalty > 0 && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>{ko ? "월 로열티" : "Monthly Royalty"}</div>
                  <div style={{ fontSize: "16px", fontWeight: 650, color: "var(--primary)" }}>{fb.monthlyRoyalty}<span style={{ fontSize: "12px" }}>만/월</span></div>
                </div>
              )}
            </div>

            {/* breakdown or unverified notice */}
            {hasBreakdown ? (
              <div style={{ padding: "16px 24px" }}>
                <div style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: "10px" }}>
                  {ko ? "비용 항목" : "Cost Breakdown"}
                </div>
                {fb.costBreakdown!.map((item, idx) => (
                  <div key={idx} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderTop: idx === 0 ? "none" : "1px solid rgba(17,17,17,0.05)"
                  }}>
                    <span style={{ fontSize: "14px", color: "var(--muted)" }}>{item.label[language]}</span>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>{formatFranchiseCost(item.amountWon)}원</span>
                  </div>
                ))}
                <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: "#1d3557", display: "inline-block" }} />
                  {ko ? `출처: ${fb.costSource} · VAT 별도 · 점포 구입비 별도` : `Source: ${fb.costSource} · Excl. VAT · Excl. property`}
                </div>
              </div>
            ) : (
              <div style={{ padding: "16px 24px" }}>
                <div style={{
                  padding: "14px 16px",
                  borderRadius: "14px",
                  background: "rgba(25,25,112,0.06)",
                  border: "1px solid rgba(25,25,112,0.12)"
                }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#191970", marginBottom: "4px" }}>
                    {ko ? "상세 비용 미확인" : "Detailed Costs Unverified"}
                  </div>
                  <div style={{ fontSize: "12px", lineHeight: 1.55, color: "var(--muted)" }}>
                    {ko
                      ? "이 브랜드의 항목별 비용은 아직 검증되지 않았습니다. 정확한 가맹비·교육비·인테리어비는 본사에 직접 확인해주세요."
                      : "Itemized costs for this brand are not yet verified. Please contact HQ directly for exact franchise fee, training, and interior costs."}
                  </div>
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{ padding: "0 24px 20px" }}>
              <button
                type="button"
                onClick={() => {
                  const totalWon = totalCost * 10000;
                  setSelectedBudget(totalWon);
                  setBudgetInputText(String(totalCost));
                }}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "999px",
                  border: "none",
                  background: "var(--primary)",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {ko
                  ? `${formatFranchiseCost(totalCost)}원을 자본금으로 설정`
                  : `Set ${formatFranchiseCost(totalCost)} as capital`}
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── 예산 인사이트 + 매칭 지원 프로그램 ── */}
      <BudgetInsightCard />

      {/* ── 정부 지원·정책자금 동적 매칭 (2026-05-25 신규, iOS SSOT 동기화) ──
            BudgetInsightCard 는 핵심 7개 hardcoded 안내, 이 카드는 79개 풀에서
            업종·자본금 기준 상위 4개 (자격 충족 우선) 동적 매칭. */}
      <BudgetFundingMatchCard />

      <div ref={budgetRef} style={{ ...styles.budgetPanel, ...(shakeWarning ? { outline: "2px solid #b64c4c", outlineOffset: "4px", borderRadius: "16px", transition: "outline 0.3s ease" } : {}) }}>
        <div style={styles.budgetHeader}>
          <div style={styles.budgetLabel}>
            {language === "ko" ? "시작 자본금" : "Starting capital"}
          </div>
          <div style={styles.budgetValue}>{activeBudgetLabel}</div>
          <div style={styles.helper}>
            {language === "ko"
              ? "슬라이더로 예산 감을 먼저 잡고, 필요하면 아래 빠른 선택으로 조정하세요."
              : "Use the slider to set a rough budget, then fine-tune with the quick picks below."}
          </div>
        </div>
        <input
          type="range"
          min={1000000}
          max={300000000}
          step={10000}
          value={sliderBudgetValue}
          onChange={(event) => {
            const nextValue = Number(event.target.value);
            setSelectedBudget(nextValue);
            setBudgetInputText(String(Math.round(nextValue / 10000)));
          }}
          style={styles.budgetRange}
        />
        <div style={styles.budgetRangeMeta}>
          <span>{formatBudgetPresetLabel(1000000, language)}</span>
          <span>
            {formatBudgetPresetLabel(300000000, language)}
          </span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          value={budgetInputText}
          onChange={(event) => {
            const digitsOnly = event.target.value.replace(/[^0-9]/g, "");
            setBudgetInputText(digitsOnly);

            if (!digitsOnly) {
              setSelectedBudget(undefined);
              return;
            }

            const nextValue = Number(digitsOnly);
            const nextBudget = nextValue * 10000;
            setSelectedBudget(Math.min(300000000, Math.max(1000000, nextBudget)));
          }}
          placeholder={
            language === "ko"
              ? "예: 450"
              : "Example: 4510000"
          }
          style={styles.budgetInput}
        />
        <div style={styles.helper}>
          {language === "ko"
            ? "직접 입력은 만원 단위입니다. 450을 입력하면 450만원으로 저장됩니다."
            : "Direct input uses ten-thousand KRW units. Enter 450 to save KRW 4,500,000."}
        </div>
        <div style={styles.compactChoiceGrid}>
          {starterBudgetPresets.map((budget) => (
            <button
              key={budget.id}
              type="button"
              style={{
                ...styles.compactChoiceCard,
                ...(selectedBudget === budget.value
                  ? styles.compactChoiceCardSelected
                  : {})
              }}
              onClick={() => {
                setSelectedBudget(budget.value);
                setBudgetInputText(String(Math.round(budget.value / 10000)));
              }}
            >
              <div style={styles.compactChoiceTitle}>
                {formatBudgetPresetLabel(budget.value, language)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 초기 운영자본금 / 런웨이 자본 (업종 + 세부업종 + 운영 모드 분기) ── */}
      {(() => {
        const ko = language === "ko";
        const capitalWon = initialOperatingCapital ?? 0;
        const capitalManwon = Math.round(capitalWon / 10000);
        const sliderValue = initialOperatingCapital ?? 0;
        const isStartup = industryCategoryId === "startup-tech";

        // ── 월 번레이트 매트릭스 (모드 × 세부 업종) ──
        //  검증 출처:
        //   • Indie hacker tool stack 2026: $19-50/mo (≈ 5만원), 1년 총 $15-30K (월 200-350만)
        //     - SaaSRanger·We Are Founders·Lovable·EntrepreneurLoop 분석
        //   • Pre-seed gross burn: $33K/mo (≈ 4500만원)
        //     - Zeni / WinSavvy / HSBC Innovation Banking 2026 burn rate benchmarks
        //   • Seed-stage burn: $45-50K/mo (≈ 6000-6700만원), 12-18개월 런웨이
        //   • Payroll dominates 50-70% of bootstrapped budget
        //   • 한국 시리즈A: SaaS 30-100억 / 반도체·하드웨어 100-900억대 (디노티시아 900억·BOS 870억)
        //
        //  단위: 원/월. 한국 표준 인건비 기준 (서울).
        //  4단계 모드:
        //   • indie  : 1인, 인건비 X, 도구·서버만
        //   • bootstrap : 1-3명, 낮은 자기 인건비 (200-300만/명)
        //   • seed   : 3-5명, 표준 인건비 (400-500만/명) + 시드 자금
        //   • seriesA : 5-10명, 정규 인건비 + 마케팅·세일즈
        const STARTUP_MATRIX: Record<string, Record<string, number>> = {
          // 소프트웨어 — 도구는 거의 무료, 인건비가 핵심 변수
          "ai-application":     { indie:    300_000, bootstrap:  8_000_000, seed: 30_000_000, seriesA:   70_000_000 },
          "developer-tools":    { indie:    300_000, bootstrap:  7_000_000, seed: 28_000_000, seriesA:   65_000_000 },
          "b2b-saas":           { indie:    400_000, bootstrap:  8_000_000, seed: 30_000_000, seriesA:   70_000_000 },
          "fintech-startup":    { indie:    500_000, bootstrap: 12_000_000, seed: 40_000_000, seriesA:  100_000_000 }, // 컴플라이언스
          "healthtech-startup": { indie:    400_000, bootstrap: 10_000_000, seed: 35_000_000, seriesA:   80_000_000 },
          "security-startup":   { indie:    400_000, bootstrap:  9_000_000, seed: 32_000_000, seriesA:   75_000_000 },
          // 하드웨어 — 부품·금형·인증 비용 추가
          "hardware-iot":       { indie:  1_000_000, bootstrap: 20_000_000, seed: 50_000_000, seriesA:  150_000_000 },
          // 로보틱스·딥테크 — 인디 거의 불가능
          "robotics-physical-ai": { indie: 2_000_000, bootstrap: 50_000_000, seed: 150_000_000, seriesA: 350_000_000 },
          // 반도체 — 인디 사실상 불가능 (EDA 라이선스만 수억원)
          "semiconductor":      { indie:  5_000_000, bootstrap: 100_000_000, seed: 300_000_000, seriesA: 800_000_000 },
          // 바이오·의료기기
          "biotech-medtech":    { indie:  3_000_000, bootstrap: 50_000_000, seed: 150_000_000, seriesA: 350_000_000 },
          // 클린테크 — 소프트웨어 vs 인프라 양극단
          "climate-energy":     { indie:  1_000_000, bootstrap: 30_000_000, seed: 100_000_000, seriesA: 300_000_000 },
        };
        const offlineMonthlyByCategory: Record<string, number> = {
          "food": 8_000_000,
          "cafe-dessert": 6_000_000,
          "retail": 5_000_000,
          "beauty": 4_500_000,
          "fitness": 7_000_000,
          "education": 4_000_000,
          "online-digital": 2_500_000,
        };
        const subMatrix = STARTUP_MATRIX[selectedIndustryId ?? ""] ?? STARTUP_MATRIX["ai-application"];
        const estimatedMonthly = isStartup
          ? (subMatrix[startupMode] ?? subMatrix.bootstrap)
          : (offlineMonthlyByCategory[industryCategoryId] ?? 5_000_000);

        // ── 권장 범위 ──
        //  스타트업: 12~24개월 런웨이 (시리즈A 평균 21개월 — ZUZU 분석)
        //  인디 모드는 현실적으로 1년치 생활비 + 도구
        //  오프라인: 3~6개월 비상금
        const recommendedMin = isStartup ? estimatedMonthly * 12 : estimatedMonthly * 3;
        const recommendedMax = isStartup ? estimatedMonthly * 24 : estimatedMonthly * 6;
        const ratio = estimatedMonthly > 0 ? capitalWon / estimatedMonthly : 0;

        // ── 건강 신호 ──
        let ratioLabel: string;
        let ratioColor: string;
        if (capitalWon === 0) {
          ratioLabel = ko ? "아직 입력하지 않음" : "Not set yet";
          ratioColor = "rgba(15,23,42,0.35)";
        } else if (isStartup) {
          if (ratio >= 24) { ratioLabel = ko ? "넉넉 (24개월+ 런웨이)" : "Strong (24+ mo runway)"; ratioColor = "#1d3557"; }
          else if (ratio >= 18) { ratioLabel = ko ? "적정 (18~24개월)" : "Adequate (18-24 mo)"; ratioColor = "#1d3557"; }
          else if (ratio >= 12) { ratioLabel = ko ? "타이트 (12~18개월)" : "Tight (12-18 mo)"; ratioColor = "#191970"; }
          else if (ratio >= 6) { ratioLabel = ko ? "부족 (6~12개월)" : "Short (6-12 mo)"; ratioColor = "#191970"; }
          else { ratioLabel = ko ? "심각 — 시리즈A 전 소진 위험" : "Critical — risk of running out before Series A"; ratioColor = "#b64c4c"; }
        } else {
          if (ratio >= 6) { ratioLabel = ko ? "매우 여유 (6개월+)" : "Very safe (6+ months)"; ratioColor = "#1d3557"; }
          else if (ratio >= 3) { ratioLabel = ko ? "적정 (3~6개월)" : "Adequate (3-6 months)"; ratioColor = "#1d3557"; }
          else if (ratio >= 1) { ratioLabel = ko ? "부족 (3개월 미만)" : "Tight (<3 months)"; ratioColor = "#191970"; }
          else { ratioLabel = ko ? "매우 부족 (1개월 미만)" : "Critical (<1 month)"; ratioColor = "#b64c4c"; }
        }

        // ── 슬라이더 상한 (모드 × 세부 업종 기반) ──
        //  추정 월 번레이트의 36개월치 정도면 충분 — 그 이상은 거의 시리즈B 영역
        const sliderMax = isStartup
          ? Math.max(estimatedMonthly * 36, 100_000_000)
          : 200_000_000;
        const sliderStep = sliderMax >= 1_000_000_000 ? 10_000_000
          : sliderMax >= 100_000_000 ? 1_000_000
          : 500_000;
        const maxLabel = sliderMax >= 100_000_000
          ? `${(sliderMax / 100_000_000).toFixed(sliderMax % 100_000_000 === 0 ? 0 : 1)}억원`
          : `${Math.round(sliderMax / 10_000).toLocaleString()}만원`;

        const fmt = (won: number) => {
          if (won >= 100_000_000) return `${(won / 100_000_000).toFixed(won % 100_000_000 === 0 ? 0 : 1)}억원`;
          if (won >= 10_000) return `${Math.round(won / 10_000).toLocaleString()}만원`;
          return `${won.toLocaleString()}원`;
        };

        // ── 라벨·헬퍼 텍스트 (스타트업: "런웨이 자본" / 그 외: "운영 자본금") ──
        const titleLabel = isStartup
          ? (ko ? "런웨이 자본 (자본금과 별도)" : "Runway capital (separate)")
          : (ko ? "초기 운영자본금 (자본금과 별도)" : "Initial operating capital (separate)");
        const helperText = isStartup
          ? (ko
              ? "월 번레이트 × 운영 가능 개월 수입니다. 시리즈A 평균 21개월 런웨이가 표준이며, 매출이 비용을 못 덮는 동안 버틸 자금이에요."
              : "Monthly burn × runway months. Series A teams target 21 mo runway. This is the cash to survive until revenue covers costs.")
          : (ko
              ? "오픈 직후 몇 달간 월세·인건비·공과금·재료비로 쓸 현금입니다. 매출이 적자를 덮기 전까지 버티는 연료예요."
              : "Cash for rent, wages, utilities, and materials during the first months before revenue covers costs.");

        // ── 스타트업 운영 모드 옵션 ──
        const MODE_OPTIONS: Array<{
          id: "indie" | "bootstrap" | "seed" | "seriesA";
          label: string;
          desc: string;
        }> = [
          {
            id: "indie",
            label: ko ? "1인 인디" : "Solo indie",
            desc: ko ? "혼자, 인건비 X, 도구·서버만" : "Solo, no salary, tools only",
          },
          {
            id: "bootstrap",
            label: ko ? "부트스트랩" : "Bootstrapped",
            desc: ko ? "1-3명, 자비 또는 낮은 인건비" : "1-3 people, low salary",
          },
          {
            id: "seed",
            label: ko ? "시드 단계" : "Seed-funded",
            desc: ko ? "3-5명, 표준 인건비 + 시드 자금" : "3-5 people, market salary",
          },
          {
            id: "seriesA",
            label: ko ? "시리즈A 이상" : "Series A+",
            desc: ko ? "5-10명, 정규 인건비 + 마케팅" : "5-10 people, full team",
          },
        ];

        return (
          <div style={styles.budgetPanel}>
            {/* ── 운영 모드 선택 (스타트업 전용) ── */}
            {isStartup && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(15,23,42,0.55)", letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                  {ko ? "운영 모드 — 비용 추정용" : "Operating mode — for cost estimate"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  {MODE_OPTIONS.map((mode) => {
                    const isActive = startupMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setStartupMode(mode.id)}
                        style={{
                          textAlign: "left" as const,
                          padding: "10px 12px",
                          borderRadius: "12px",
                          border: isActive ? "1.5px solid #191970" : "1px solid rgba(15,23,42,0.1)",
                          background: isActive ? "rgba(25,25,112,0.05)" : "white",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{
                          fontSize: "13px", fontWeight: 700,
                          color: isActive ? "#191970" : "var(--text)",
                          letterSpacing: "-0.01em", marginBottom: "2px",
                        }}>
                          {mode.label}
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>
                          {mode.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={styles.budgetHeader}>
              <div style={styles.budgetLabel}>{titleLabel}</div>
              <div style={styles.budgetValue}>
                {capitalWon > 0 ? fmt(capitalWon) : (ko ? "미입력" : "Not set")}
              </div>
              <div style={styles.helper}>{helperText}</div>
              <div style={{
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "12px",
                background: `${ratioColor}12`,
                border: `1px solid ${ratioColor}22`,
              }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: ratioColor }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: 660, color: ratioColor }}>{ratioLabel}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                    {isStartup
                      ? (ko
                          ? `권장 범위: ${fmt(recommendedMin)} ~ ${fmt(recommendedMax)} (월 번레이트 ${fmt(estimatedMonthly)} × 12-24개월)`
                          : `Recommended: ${fmt(recommendedMin)} - ${fmt(recommendedMax)} (monthly burn ${fmt(estimatedMonthly)} × 12-24 mo)`)
                      : (ko
                          ? `권장 범위: ${fmt(recommendedMin)} ~ ${fmt(recommendedMax)} (월 예상 비용 ${fmt(estimatedMonthly)} × 3-6개월)`
                          : `Recommended: ${fmt(recommendedMin)} - ${fmt(recommendedMax)} (monthly cost ${fmt(estimatedMonthly)} × 3-6 mo)`)}
                  </div>
                </div>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={sliderMax}
              step={sliderStep}
              value={Math.min(sliderValue, sliderMax)}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                setInitialOperatingCapital(nextValue > 0 ? nextValue : undefined);
                setOperatingCapitalInputText(String(Math.round(nextValue / 10000)));
              }}
              style={styles.budgetRange}
            />
            <div style={styles.budgetRangeMeta}>
              <span>{ko ? "0원" : "0"}</span>
              <span>{maxLabel}</span>
            </div>

            <input
              type="text"
              inputMode="numeric"
              value={operatingCapitalInputText}
              onChange={(event) => {
                const digitsOnly = event.target.value.replace(/[^0-9]/g, "");
                setOperatingCapitalInputText(digitsOnly);
                if (!digitsOnly) {
                  setInitialOperatingCapital(undefined);
                  return;
                }
                const nextValue = Number(digitsOnly);
                const nextCapital = nextValue * 10000;
                setInitialOperatingCapital(Math.min(sliderMax, Math.max(0, nextCapital)));
              }}
              placeholder={ko ? "예: 1500 (만원 단위)" : "Example: 1500 (ten-thousand KRW)"}
              style={styles.budgetInput}
            />

            <div style={styles.compactChoiceGrid}>
              {(isStartup ? [
                { label: ko ? "12개월분 (최소)" : "12 mo (min)", value: estimatedMonthly * 12 },
                { label: ko ? "18개월분" : "18 mo", value: estimatedMonthly * 18 },
                { label: ko ? "24개월분 (시리즈A 표준)" : "24 mo (Series A)", value: estimatedMonthly * 24 },
              ] : [
                { label: ko ? "3개월분" : "3 months", value: recommendedMin },
                { label: ko ? "6개월분" : "6 months", value: recommendedMax },
                { label: ko ? "1년분" : "1 year", value: estimatedMonthly * 12 },
              ]).map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  style={{
                    ...styles.compactChoiceCard,
                    ...(Math.abs(capitalWon - preset.value) < 500_000
                      ? styles.compactChoiceCardSelected
                      : {}),
                  }}
                  onClick={() => {
                    setInitialOperatingCapital(preset.value);
                    setOperatingCapitalInputText(String(Math.round(preset.value / 10000)));
                  }}
                >
                  <div style={styles.compactChoiceTitle}>
                    {preset.label} · {fmt(preset.value)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      <div style={styles.budgetPanel}>
        <div style={styles.budgetHeader}>
          <div style={styles.budgetLabel}>
            {language === "ko" ? "목표 오픈 시점" : "Target opening window"}
          </div>
          <div style={styles.compactChoiceTitle}>
            {activeOpenDatePreset
              ? formatOpenDatePresetLabel(
                  activeOpenDatePreset.id,
                  activeOpenDatePreset.label,
                  language
                )
              : language === "ko"
                ? "아직 선택하지 않음"
                : "Not selected yet"}
          </div>
        </div>
        <div style={styles.compactChoiceGrid}>
          {starterOpenDatePresets.map((date) => (
            <button
              key={date.id}
              type="button"
              style={{
                ...styles.compactChoiceCard,
                ...(selectedOpenDate === date.value
                  ? styles.compactChoiceCardSelected
                  : {})
              }}
              onClick={() => setSelectedOpenDate(date.value)}
            >
              <div style={styles.compactChoiceTitle}>
                {formatOpenDatePresetLabel(date.id, date.label, language)}
              </div>
              <div style={styles.compactChoiceCaption}>
                {language === "ko"
                  ? "로드맵 마감과 실행 속도를 이 일정에 맞춥니다."
                  : "Roadmap timing will align to this opening window."}
              </div>
            </button>
          ))}
        </div>
      </div>

      <StageWrapup
        ko={language === "ko"}
        nextStageLabelKo="상권 후보 비교"
        doneItemsKo={[
          { label: "1. 자본 규모 설정", detail: "보유 자본 + 대출 가용액 + 운영자본 6개월 분리 — 3구간 프리셋 비교" },
          { label: "2. 오픈 일정 설정", detail: "오픈 희망일 시점에서 역산해 핵심 마일스톤 자동 배치" },
          { label: "3. 인테리어·집기 비중 결정", detail: "총 자본 중 시설투자 vs 운영자본 60:40 권장 — 업종 맞춤 조정" },
          { label: "4. 자본 vs 매출 시뮬레이션", detail: "월 운영비 추정 + 손익분기 도달 시점 시뮬" },
        ]}
        verifyItemsKo={[
          "운영자본 6개월치 별도 확보 — 매출 0원 가정해도 월세·인건비·재료비 견딜 수 있어야 (흑자부도 1순위 원인)",
          "정부지원금·소상공인 대출 가능 여부 — 신청 시점부터 입금까지 평균 4~8주, 일정에 반영",
          "예비비 10~15% 별도 — 인테리어 추가공사·집기 누락·임대 보증금 추가 요구 빈번",
          "오픈 일정 — 임대 계약일부터 영업신고·인테리어·집기 입고·시운전까지 최소 60일 필요",
          "프랜차이즈 가맹비·교육비·인테리어 강제 비용 모두 합산 — 광고비·로열티 매월 별도 발생",
          "업종별 손익분기점 매출 추정 — 통상 매출 대비 인건비 25%, 재료비 30%, 임대료 10% 한계선",
        ]}
        nextSummaryKo="자본·일정·예비비 확정 → 상권 후보 비교 단계로 진입"
      />

      <div style={styles.stageFooter}>
        {prevTraversedStage ? (
          <button type="button" style={styles.button} onClick={() => setViewingStageId(prevTraversedStage.stageId)}>
            {language === "ko" ? "← 이전 단계" : "← Back"}
          </button>
        ) : null}
        <button
          type="button"
          style={{
            ...styles.primaryButton,
            opacity: canCompleteBudgetStep ? 1 : 0.45
          }}
          onClick={() => {
            if (!canCompleteBudgetStep) {
              setShakeWarning(true);
              budgetRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => setShakeWarning(false), 2000);
              return;
            }
            handleBudgetContinue();
          }}
        >
          {canCompleteBudgetStep
            ? (industryCategoryId === "startup-tech"
                ? (language === "ko" ? "예산 저장하고 스타트업 로드맵 시작" : "Save budget and start startup roadmap")
                : language === "ko"
                  ? "예산 저장하고 상권 보기"
                  : "Save budget and open markets")
            : (language === "ko" ? "↑ 예산을 설정하세요" : "↑ Set your budget")}
        </button>
        <button type="button" style={styles.button} onClick={resetDemo}>
          {copy.common.resetDemo}
        </button>
      </div>
    </>
  );
}
