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
} from "@build-up/shared";
import { supabase } from "../../../../../lib/supabase";

export function BudgetSetupStage() {
  const d = useDashboardCtx();
  const {
    language,
    copy,
    industryCategoryId,
    startupType,
    selectedFranchiseBrandId,
    selectedBudget, setSelectedBudget,
    budgetInputText, setBudgetInputText,
    initialOperatingCapital, setInitialOperatingCapital,
    operatingCapitalInputText, setOperatingCapitalInputText,
    sliderBudgetValue,
    activeBudgetLabel,
    selectedOpenDate, setSelectedOpenDate,
    activeOpenDatePreset,
    canCompleteBudgetStep, handleBudgetContinue,
    prevTraversedStage, setViewingStageId,
    resetDemo,
    liveBudgetBenchmark, setLiveBudgetBenchmark,
  } = d;

  const budgetRef = useRef<HTMLDivElement>(null);
  const [shakeWarning, setShakeWarning] = useState(false);

  return (
    <>
      <div style={styles.helper}>
        {copy.home.budgetHelp}
      </div>

      {/* ── 라이브 업종별 창업비용 벤치마크 ── */}
      {(() => {
        const ko = language === "ko";

        const loadBenchmark = async () => {
          if (liveBudgetBenchmark && !liveBudgetBenchmark.loading) return;
          setLiveBudgetBenchmark({ loading: true });
          try {
            const session = await supabase.auth.getSession();
            const tk = session.data.session?.access_token;
            const indsCode = ({ "food": "Q", "cafe-dessert": "Q", "retail": "D", "beauty": "F", "fitness": "R", "education": "P" } as Record<string, string>)[industryCategoryId] ?? "Q";
            const res = await fetch(`/api/data/franchise/industry-costs?industryCode=${indsCode}`, { headers: tk ? { Authorization: `Bearer ${tk}` } : {} }).then(r => r.json()).catch(() => null);
            if (res?.data?.length) {
              const latest = res.data[0] as { avgTotalStartupCost: number; avgFranchiseFee: number; avgDeposit: number; avgEducationFee: number; avgOtherCost: number; industryName: string };
              setLiveBudgetBenchmark({ loading: false, data: latest });
            } else {
              setLiveBudgetBenchmark({ loading: false });
            }
          } catch { setLiveBudgetBenchmark({ loading: false }); }
        };

        if (!liveBudgetBenchmark) void loadBenchmark();

        if (!liveBudgetBenchmark || liveBudgetBenchmark.loading || !liveBudgetBenchmark.data) return null;
        const b = liveBudgetBenchmark.data;
        const userBudget = selectedBudget ?? 0;
        const diff = userBudget > 0 ? Math.round(((userBudget - b.avgTotalStartupCost * 10000) / (b.avgTotalStartupCost * 10000)) * 100) : 0;
        const diffLabel = diff > 10 ? (ko ? "업종 평균보다 여유" : "Above average") : diff < -10 ? (ko ? "업종 평균보다 부족" : "Below average") : (ko ? "업종 평균 수준" : "Near average");
        const diffColor = diff > 10 ? "#059669" : diff < -10 ? "#dc2626" : "#d97706";

        return (
          <div style={{ marginBottom: "18px", borderRadius: "20px", border: `1px solid ${diffColor}15`, background: `linear-gradient(180deg, ${diffColor}06 0%, rgba(255,255,255,0.92) 100%)`, overflow: "hidden" }} className="bento-fade-in">
            <div style={{ padding: "18px 20px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: diffColor }} />
                <span style={{ fontSize: "15px", fontWeight: 650, letterSpacing: "-0.02em" }}>{ko ? "업종 창업비용 벤치마크" : "Industry Startup Cost Benchmark"}</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "공정거래위원회 가맹사업 통계 기반" : "Based on KFTC Franchise Statistics"}</div>
            </div>
            <div style={{ padding: "0 20px 18px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "12px" }}>
                <span style={{ fontSize: "24px", fontWeight: 760, letterSpacing: "-0.04em", color: "#0f172a" }}>{b.avgTotalStartupCost.toLocaleString()}<span style={{ fontSize: "14px", fontWeight: 500 }}>{ko ? "만원" : "만KRW"}</span></span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: diffColor }}>{diffLabel} ({diff > 0 ? "+" : ""}{diff}%)</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                {[
                  { label: ko ? "가맹비" : "Franchise", value: b.avgFranchiseFee },
                  { label: ko ? "교육비" : "Education", value: b.avgEducationFee },
                  { label: ko ? "보증금" : "Deposit", value: b.avgDeposit },
                  { label: ko ? "기타" : "Other", value: b.avgOtherCost },
                ].filter(x => x.value > 0).map(x => (
                  <div key={x.label} style={{ padding: "10px", borderRadius: "12px", background: `${diffColor}06` }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(0,0,0,0.4)", marginBottom: "2px" }}>{x.label}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{x.value.toLocaleString()}<span style={{ fontSize: "10px", color: "var(--muted)" }}>{ko ? "만" : "M"}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

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
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: "#34c759", display: "inline-block" }} />
                  {ko ? `출처: ${fb.costSource} · VAT 별도 · 점포 구입비 별도` : `Source: ${fb.costSource} · Excl. VAT · Excl. property`}
                </div>
              </div>
            ) : (
              <div style={{ padding: "16px 24px" }}>
                <div style={{
                  padding: "14px 16px",
                  borderRadius: "14px",
                  background: "rgba(255,159,10,0.06)",
                  border: "1px solid rgba(255,159,10,0.12)"
                }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#ff9f0a", marginBottom: "4px" }}>
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

      <div ref={budgetRef} style={{ ...styles.budgetPanel, ...(shakeWarning ? { outline: "2px solid #dc2626", outlineOffset: "4px", borderRadius: "16px", transition: "outline 0.3s ease" } : {}) }}>
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

      {/* ── 초기 운영자본금 (창업비용과 별도) ── */}
      {(() => {
        const ko = language === "ko";
        const capitalWon = initialOperatingCapital ?? 0;
        const capitalManwon = Math.round(capitalWon / 10000);
        const sliderValue = initialOperatingCapital ?? 0;

        // 권장 운영자본금 — 업종별 월 예상 비용의 3~6배
        const monthlyCostEstimate: Record<string, number> = {
          "food": 8_000_000,
          "cafe-dessert": 6_000_000,
          "retail": 5_000_000,
          "beauty": 4_500_000,
          "fitness": 7_000_000,
          "education": 4_000_000,
          "online-digital": 2_500_000,
          "startup-tech": 10_000_000,
        };
        const estimatedMonthly = monthlyCostEstimate[industryCategoryId] ?? 5_000_000;
        const recommendedMin = estimatedMonthly * 3;
        const recommendedMax = estimatedMonthly * 6;
        const ratio = estimatedMonthly > 0 ? capitalWon / estimatedMonthly : 0;
        const ratioLabel = ratio >= 6
          ? (ko ? "매우 여유 (6개월+)" : "Very safe (6+ months)")
          : ratio >= 3
            ? (ko ? "적정 (3~6개월)" : "Adequate (3-6 months)")
            : ratio >= 1
              ? (ko ? "부족 (3개월 미만)" : "Tight (<3 months)")
              : capitalWon > 0
                ? (ko ? "매우 부족 (1개월 미만)" : "Critical (<1 month)")
                : (ko ? "아직 입력하지 않음" : "Not set yet");
        const ratioColor = ratio >= 3 ? "#059669" : ratio >= 1 ? "#d97706" : capitalWon > 0 ? "#dc2626" : "rgba(15,23,42,0.35)";

        const fmt = (won: number) => {
          if (won >= 10000) return `${Math.round(won / 10000).toLocaleString()}만원`;
          return `${won.toLocaleString()}원`;
        };

        return (
          <div style={styles.budgetPanel}>
            <div style={styles.budgetHeader}>
              <div style={styles.budgetLabel}>
                {ko ? "초기 운영자본금 (자본금과 별도)" : "Initial operating capital (separate)"}
              </div>
              <div style={styles.budgetValue}>
                {capitalWon > 0 ? fmt(capitalWon) : (ko ? "미입력" : "Not set")}
              </div>
              <div style={styles.helper}>
                {ko
                  ? "오픈 직후 몇 달간 월세·인건비·공과금·재료비로 쓸 현금입니다. 매출이 적자를 덮기 전까지 버티는 연료예요."
                  : "Cash for rent, wages, utilities, and materials during the first months before revenue covers costs."}
              </div>
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
                    {ko
                      ? `권장 범위: ${fmt(recommendedMin)} ~ ${fmt(recommendedMax)} (월 예상 비용의 3~6배)`
                      : `Recommended: ${fmt(recommendedMin)} - ${fmt(recommendedMax)} (3-6 months of expenses)`}
                  </div>
                </div>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={200_000_000}
              step={500_000}
              value={sliderValue}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                setInitialOperatingCapital(nextValue > 0 ? nextValue : undefined);
                setOperatingCapitalInputText(String(Math.round(nextValue / 10000)));
              }}
              style={styles.budgetRange}
            />
            <div style={styles.budgetRangeMeta}>
              <span>{ko ? "0원" : "0"}</span>
              <span>{ko ? "2억원" : "200M KRW"}</span>
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
                setInitialOperatingCapital(Math.min(200_000_000, Math.max(0, nextCapital)));
              }}
              placeholder={ko ? "예: 1500 (만원 단위)" : "Example: 1500 (ten-thousand KRW)"}
              style={styles.budgetInput}
            />

            <div style={styles.compactChoiceGrid}>
              {[
                { label: ko ? "3개월분" : "3 months", value: recommendedMin },
                { label: ko ? "6개월분" : "6 months", value: recommendedMax },
                { label: ko ? "1년분" : "1 year", value: estimatedMonthly * 12 },
              ].map((preset) => (
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
