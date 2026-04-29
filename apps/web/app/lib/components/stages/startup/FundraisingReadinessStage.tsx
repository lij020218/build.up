"use client";

import { Lightbulb, ExternalLink, HelpCircle, DollarSign, Trophy } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { supabase } from "../../../../../lib/supabase";
import {
  getProgramsForMode,
  RECOMMENDED_PROGRAM_COUNT_BY_MODE,
  type FundingProgram,
  type OperatingMode,
} from "@build-up/shared";
import { StartupKeyActionHero } from "./StartupStageShell";

const MIDNIGHT = "#191970";

export function FundraisingReadinessStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";

  const {
    decisions, industryCategoryId, selectedIndustryId, startupType,
    selectedBusinessModelId, selectedBudget, savedFinanceSnapshot,
    guideSelections, setGuideSelections,
    bpLoading, setBpLoading, bpSections, setBpSections, bpSummary, setBpSummary,
    bpError, setBpError, bpExpandedIdx, setBpExpandedIdx,
    startupOperatingMode, setStartupOperatingMode,
  } = d;

  // ── 운영 모드 + 클러스터 → 검증된 자금 프로그램 추천 ──
  const isDeeptechSub = ["robotics-physical-ai", "biotech-medtech", "semiconductor", "climate-energy", "hardware-iot"]
    .includes(selectedIndustryId ?? "");
  const recommendedPrograms: FundingProgram[] = getProgramsForMode(startupOperatingMode, {
    isDeeptech: isDeeptechSub,
    limit: RECOMMENDED_PROGRAM_COUNT_BY_MODE[startupOperatingMode],
  });

  const modeLabels: Record<OperatingMode, { ko: string; en: string; desc: { ko: string; en: string } }> = {
    indie: { ko: "1인 인디", en: "Solo indie", desc: { ko: "혼자, 인건비 X, 도구·서버만", en: "Solo, no salary, tools only" } },
    bootstrap: { ko: "부트스트랩", en: "Bootstrapped", desc: { ko: "1-3명, 자비 또는 낮은 인건비", en: "1-3 people, low salary" } },
    seed: { ko: "시드 단계", en: "Seed-funded", desc: { ko: "3-5명, 표준 인건비 + 시드 자금", en: "3-5 people, market salary" } },
    seriesA: { ko: "시리즈A 이상", en: "Series A+", desc: { ko: "5-10명, 정규 인건비 + 마케팅", en: "5-10 people, full team" } },
  };

  const categoryColors: Record<string, string> = {
    "government-grant": "#059669",
    "policy-loan": "#0891b2",
    "matching-fund": "#7c3aed",
    "vc-investment": "#2563eb",
    "accelerator": "#ec4899",
    "crowdfunding": "#f59e0b",
    "competition": "#dc2626",
    "facility-support": "#64748b",
    "deeptech": MIDNIGHT,
  };

  const categoryLabels: Record<string, { ko: string; en: string }> = {
    "government-grant": { ko: "정부 보조금", en: "Govt Grant" },
    "policy-loan": { ko: "정책 융자", en: "Policy Loan" },
    "matching-fund": { ko: "매칭 펀드", en: "Matching" },
    "vc-investment": { ko: "VC 투자", en: "VC" },
    "accelerator": { ko: "액셀러레이터", en: "Accelerator" },
    "crowdfunding": { ko: "크라우드펀딩", en: "Crowdfunding" },
    "competition": { ko: "공모전·대회", en: "Competition" },
    "facility-support": { ko: "공간·컨설팅", en: "Facility" },
    "deeptech": { ko: "딥테크 특화", en: "Deeptech" },
  };

  /* ── TIPS/정부지원 안내 ── */
  const progCard = (p: { name: string; amount: string; detail: string; color: string; url: string }) => (
    <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" style={{
      display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 14px", borderRadius: "12px",
      border: `1px solid ${p.color}12`, background: `${p.color}03`, textDecoration: "none", color: "inherit",
    }}>
      <div style={{ padding: "3px 8px", borderRadius: "6px", background: `${p.color}0a`, fontSize: "11px", fontWeight: 700, color: p.color, whiteSpace: "nowrap" as const, flexShrink: 0 }}>{p.amount}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a", marginBottom: "1px" }}>{p.name}</div>
        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{p.detail}</div>
      </div>
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}><path d="M3 11L11 3M11 3H6M11 3V8" stroke="rgba(15,23,42,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </a>
  );

  /* ── 사업계획서: decisions에서 복원 ── */
  const savedBp = (decisions["fundraising-readiness"] as Record<string, unknown>)?.inputs as Record<string, unknown> | undefined;
  const hasSavedBp = !!(savedBp?.bpSections);
  if (hasSavedBp && !bpSections && !bpLoading) {
    setBpSections(savedBp.bpSections as Array<{ title: string; content: string }>);
    setBpSummary((savedBp.bpSummary as string) ?? null);
  }

  /* ── 사업계획서 생성 ── */
  const generatePlanFR = async () => {
    setBpLoading(true);
    setBpError(null);
    try {
      const loc = decisions["location-candidates"];
      const sfInputs = (decisions["startup-foundation"] as Record<string, unknown>)?.inputs as Record<string, unknown> | undefined;
      const geInputs = (decisions["growth-engine"] as Record<string, unknown>)?.inputs as Record<string, unknown> | undefined;
      const body = {
        industry: industryCategoryId,
        subIndustry: selectedIndustryId ?? "",
        startupType: startupType ?? "independent",
        businessModel: selectedBusinessModelId ?? "",
        capital: selectedBudget ?? 0,
        targetOpenDate: decisions["budget-setup"]?.inputs?.targetOpenDate ?? "",
        location: loc?.selectedPrimaryOptionId ?? "",
        bepRevenue: savedFinanceSnapshot?.breakEvenRevenue,
        runway: savedFinanceSnapshot?.survivabilityMonths,
        riskLevel: savedFinanceSnapshot?.riskLevel,
        language: d.language,
        purpose: "govt-support" as const,
        problemStatement: sfInputs?.problemStatement as string | undefined,
        teamStructure: sfInputs?.teamStructure as string | undefined,
        northStarType: geInputs?.northStarType as string | undefined,
        northStarMetricName: geInputs?.northStarMetricName as string | undefined,
        targetCustomer: guideSelections["interview-target"] || undefined,
      };
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error(ko ? "로그인이 필요합니다" : "Login required");
      const res = await fetch("/api/ai/business-plan/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBpSections(data.sections);
      setBpSummary(data.summary);
      // decisions에 저장 → autosave → Supabase
      const prev = decisions["fundraising-readiness"] ?? { stageId: "fundraising-readiness" };
      const prevInputs = (prev as Record<string, unknown>).inputs as Record<string, unknown> ?? {};
      d.setDecisions({
        ...decisions,
        "fundraising-readiness": {
          ...prev,
          stageId: "fundraising-readiness",
          inputs: { ...prevInputs, bpSections: data.sections, bpSummary: data.summary, bpSavedAt: new Date().toISOString() },
        } as typeof prev,
      });
    } catch (err) {
      setBpError(err instanceof Error ? err.message : "Failed");
    }
    setBpLoading(false);
  };

  return (
    <>
      {/* ── Block 1: TIPS/정부지원 안내 ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
        {/* KEY ACTION 미드나이트 hero */}
        <StartupKeyActionHero
          eyebrow="KEY ACTION"
          title={ko ? "투자가 정말 필요한가? 아니면 매출로 충분한가?" : "Do you really need investment, or is revenue enough?"}
          subtitle={
            ko
              ? "2026년 솔로 파운더의 52%가 외부 투자 없이 엑싯했습니다. 투자는 성장 가속 도구이지 생존 필수가 아닐 수 있습니다. 두 갈래(부트스트랩 / 투자) 모두 검증하고 결정하세요."
              : "52% of solo founders exited without external funding in 2026. Investment accelerates growth — it's not always survival. Evaluate both paths (bootstrap / fundraise) before deciding."
          }
          miniCards={[
            { icon: HelpCircle, label: ko ? "PATH A" : "PATH A", detail: ko ? "부트스트랩" : "Bootstrap" },
            { icon: DollarSign, label: ko ? "PATH B" : "PATH B", detail: ko ? "정부지원/VC" : "Grant/VC" },
            { icon: Trophy, label: ko ? "70+ 프로그램" : "70+ progs", detail: ko ? "맞춤 추천" : "Tailored" },
          ]}
        />

        {/* PATH A — 투자 없이 시작하기 */}
        <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
          <div style={{ padding: "20px 22px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ padding: "4px 10px", borderRadius: "8px", background: "rgba(5,150,105,0.08)", fontSize: "11px", fontWeight: 700, color: "#059669" }}>PATH A</div>
              <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "투자 없이 시작하기" : "Bootstrap — No Investment"}</span>
            </div>
            <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7, marginTop: "6px" }}>
              {ko ? "고객이 돈을 내는 순간부터 당신은 자유입니다. 지분 희석 없이, 이사회 승인 없이, 당신의 속도로 성장할 수 있습니다." : "From the moment customers pay, you're free. No dilution, no board approval, grow at your own pace."}
            </div>
          </div>
          <div style={{ padding: "0 22px 14px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "이 단계에서 할 일" : "What to do"}</div>
            <div style={{ display: "grid", gap: "4px", marginBottom: "12px" }}>
              {(ko ? [
                "런웨이 계산: 현재 현금 ÷ 월 비용 = 남은 개월 수",
                "월 매출 목표 설정: 최소 월 비용을 커버하는 매출 수준",
                "정부 보조금 · 공모전으로 초기 자금 확보 (아래 참조)",
                "첫 유료 고객 10명을 목표로 집중 — 이게 가장 강력한 증거",
              ] : [
                "Calculate runway: current cash ÷ monthly costs = months left",
                "Set monthly revenue target: minimum to cover costs",
                "Secure initial funds via government grants/competitions (below)",
                "Focus on first 10 paying customers — strongest proof",
              ]).map(t => (
                <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#059669", flexShrink: 0, marginTop: "7px" }} />
                  <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "0 22px 16px" }}>
            <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(5,150,105,0.04)", fontSize: "12px", color: "#059669", lineHeight: 1.5, fontWeight: 500, display: "flex", alignItems: "flex-start", gap: "6px" }}>
              <Lightbulb size={13} strokeWidth={1.5} color="#f59e0b" style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>{ko ? "이 단계를 완료하면, 다음 단계에서 정부 지원사업(TIPS/창업패키지/바우처)과 정책 대출을 구체적으로 매칭하고 신청합니다." : "After this stage, the next steps will match you with government programs (TIPS/packages/vouchers) and policy loans."}</span>
            </div>
          </div>
        </div>

        {/* PATH B — 투자 유치 */}
        <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
          <div style={{ padding: "20px 22px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ padding: "4px 10px", borderRadius: "8px", background: "rgba(37,99,235,0.08)", fontSize: "11px", fontWeight: 700, color: "#2563eb" }}>PATH B</div>
              <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "투자 유치하기" : "Raise Investment"}</span>
            </div>
            <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7, marginTop: "6px" }}>
              {ko ? "투자는 시장을 빠르게 선점해야 할 때 필요합니다. \"승자독식\" 시장이거나, 네트워크 효과가 핵심이거나, 기술 개발에 큰 초기 비용이 드는 경우. Peter Thiel: \"CEO 연봉이 15만 달러를 넘으면 정치인이 되기 시작한다.\"" : "Investment is needed when you must capture a market fast — winner-takes-all, network effects, or high R&D costs. Peter Thiel: \"A CEO earning over $150K starts becoming a politician.\""}
            </div>
          </div>
          <div style={{ padding: "0 22px 14px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "투자 유치 전 준비할 것" : "Before fundraising"}</div>
            <div style={{ display: "grid", gap: "4px", marginBottom: "12px" }}>
              {(ko ? [
                "런웨이 모델링: 현재 현금으로 몇 개월 버틸 수 있는지 정확히 계산",
                "다음 마일스톤 정의: 투자금으로 달성할 구체적 목표 (유저 수, MRR, PMF)",
                "투자 필요성 판단: 이 돈이 없으면 정말 못 하는 건지? 느려질 뿐인지?",
                "투자자 스토리라인: 문제 → 솔루션 → 시장 → 견인력 → 팀 → 필요 금액",
                "법인 설립 완료 (투자자는 법인만 투자합니다)",
              ] : [
                "Runway modeling: exactly how many months with current cash",
                "Define next milestone: specific goal for the funds (users, MRR, PMF)",
                "Justify need: can't do it at all without money? Or just slower?",
                "Investor storyline: problem → solution → market → traction → team → ask",
                "Incorporate (investors only invest in corporations)",
              ]).map(t => (
                <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2563eb", flexShrink: 0, marginTop: "7px" }} />
                  <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.08)", marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.04em", marginBottom: "6px" }}>{ko ? "AI 활용법 — 피치덱 작성" : "AI — Pitch deck"}</div>
              <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, fontStyle: "italic" }}>
                {ko ? "\"우리 스타트업 데이터: [제품, 유저 수, MRR, 성장률, 시장 크기, 팀]. 한국 VC가 좋아하는 형식의 10장짜리 피치덱 구조를 만들어줘. 각 슬라이드에 들어갈 핵심 메시지와 데이터 포인트를 제안해줘.\"" : "\"Our data: [product, users, MRR, growth, market, team]. Create a 10-slide pitch deck structure that Korean VCs prefer. Suggest key message and data points for each slide.\""}
              </div>
            </div>
          </div>
          <div style={{ padding: "0 22px 16px" }}>
            <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(37,99,235,0.04)", fontSize: "12px", color: "#2563eb", lineHeight: 1.5, fontWeight: 500, display: "flex", alignItems: "flex-start", gap: "6px" }}>
              <Lightbulb size={13} strokeWidth={1.5} color="#f59e0b" style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>{ko ? "VC 투자 결정 후, 다음 단계에서 비지분 자금(TIPS/R&D/바우처)을 병행 신청하면 런웨이를 더 확보할 수 있습니다." : "After deciding on VC, applying for non-dilutive funds (TIPS/R&D/vouchers) in parallel extends your runway."}</span>
            </div>
          </div>
        </div>

        {/* ══════════ 운영 모드별 자금 프로그램 추천 ══════════ */}
        <div style={{
          borderRadius: "20px",
          border: `1px solid ${MIDNIGHT}1A`,
          background: `linear-gradient(180deg, ${MIDNIGHT}05 0%, rgba(255,255,255,0.98) 100%)`,
          padding: "20px 22px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap" as const, gap: "12px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "11px", fontWeight: 700, color: MIDNIGHT,
                letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px",
              }}>
                {ko ? "내 운영 모드에 맞는 자금" : "Funding for your mode"}
              </div>
              <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
                {ko
                  ? `${modeLabels[startupOperatingMode].ko} 단계 — 검증된 ${recommendedPrograms.length}개 프로그램`
                  : `${modeLabels[startupOperatingMode].en} stage — ${recommendedPrograms.length} verified programs`}
              </div>
              <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.55)", marginTop: "4px", lineHeight: 1.5 }}>
                {ko
                  ? "1인 인디든 시리즈A 팀이든 모두 자금이 필요합니다. 다만 적합한 자금원이 다를 뿐 — 아래는 당신의 단계에 맞는 검증된 프로그램입니다."
                  : "Every founder needs funding — just different sources by stage. Programs below are verified and matched to your mode."}
              </div>
            </div>
          </div>

          {/* 모드 전환 칩 */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, marginBottom: "14px" }}>
            {(["indie", "bootstrap", "seed", "seriesA"] as OperatingMode[]).map((m) => {
              const active = startupOperatingMode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setStartupOperatingMode(m)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: active ? 700 : 600,
                    background: active ? MIDNIGHT : "transparent",
                    color: active ? "#fff" : "rgba(15,23,42,0.55)",
                    border: active ? "none" : "1px solid rgba(25,25,112,0.12)",
                    cursor: "pointer",
                    boxShadow: active ? "0 2px 6px rgba(25,25,112,0.22)" : "none",
                  }}
                >
                  {modeLabels[m].ko}
                </button>
              );
            })}
          </div>

          {/* 프로그램 카드 그리드 */}
          <div style={{ display: "grid", gap: "10px" }}>
            {recommendedPrograms.map((p) => {
              const cColor = categoryColors[p.category] ?? MIDNIGHT;
              const cLabel = categoryLabels[p.category]?.ko ?? p.category;
              return (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    background: "white",
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "6px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: `${cColor}12`,
                        color: cColor,
                        fontSize: "10.5px",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase" as const,
                        marginBottom: "5px",
                      }}>
                        {cLabel}
                      </div>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.45)", marginTop: "2px" }}>
                        {p.organizer}
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 10px",
                      borderRadius: "8px",
                      background: `${MIDNIGHT}10`,
                      color: MIDNIGHT,
                      fontSize: "11.5px",
                      fontWeight: 700,
                      whiteSpace: "nowrap" as const,
                      flexShrink: 0,
                    }}>
                      {p.amount}
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.65)", lineHeight: 1.55, marginTop: "4px" }}>
                    {p.summary}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)", lineHeight: 1.5, marginTop: "6px" }}>
                    {p.description}
                  </div>
                  {p.eligibility && (
                    <div style={{
                      marginTop: "8px",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      background: "rgba(0,0,0,0.03)",
                      fontSize: "11.5px",
                      color: "rgba(0,0,0,0.6)",
                    }}>
                      <span style={{ fontWeight: 700 }}>{ko ? "자격: " : "Eligibility: "}</span>
                      {p.eligibility}
                    </div>
                  )}
                  {p.deadlineNote && (
                    <div style={{ marginTop: "6px", fontSize: "11.5px", color: "#dc2626", fontWeight: 600 }}>
                      ⏰ {p.deadlineNote}
                    </div>
                  )}
                  <div style={{
                    marginTop: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "11.5px",
                    color: MIDNIGHT,
                    fontWeight: 700,
                  }}>
                    <span>{ko ? "공식 페이지로" : "Visit official page"}</span>
                    <ExternalLink size={12} />
                  </div>
                </a>
              );
            })}
          </div>

          {recommendedPrograms.length === 0 && (
            <div style={{ padding: "16px", textAlign: "center" as const, fontSize: "13px", color: "rgba(0,0,0,0.5)" }}>
              {ko ? "이 모드에 매칭된 프로그램이 없습니다 — 다른 모드를 시도해 주세요." : "No programs matched — try another mode."}
            </div>
          )}
        </div>

        {/* 런웨이 계산 도우미 */}
        <div style={{ borderRadius: "20px", border: "1px solid rgba(15,23,42,0.06)", background: "rgba(255,255,255,0.95)", padding: "20px 22px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "10px" }}>{ko ? "런웨이 자가 진단" : "Runway Self-Check"}</div>
          <div style={{ display: "grid", gap: "6px" }}>
            {(ko ? [
              { q: "현재 통장 잔고는?", hint: "정확한 숫자를 알아야 합니다", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
              { q: "월 고정비용은? (서버+도구+생활비)", hint: "빠짐없이 계산. 생활비 포함", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" },
              { q: "남은 개월 수 = 잔고 ÷ 월 비용", hint: "6개월 미만이면 즉시 행동 필요", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            ] : [
              { q: "Current bank balance?", hint: "Know the exact number", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
              { q: "Monthly costs? (server+tools+living)", hint: "Include everything. Living costs too", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" },
              { q: "Months left = balance ÷ monthly costs", hint: "Under 6 months = act now", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            ]).map(item => (
              <div key={item.q} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.02)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.3)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}><path d={item.icon}/></svg>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 620, color: "#0f172a", lineHeight: 1.4 }}>{item.q}</div>
                  <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", lineHeight: 1.4 }}>{item.hint}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 투자자에게 접근하는 실전 가이드 ── */}
        <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)", background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
          <div style={{ padding: "20px 22px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ padding: "4px 10px", borderRadius: "8px", background: "rgba(124,58,237,0.08)", fontSize: "11px", fontWeight: 700, color: "#7c3aed" }}>{ko ? "실전" : "HOW-TO"}</div>
              <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "투자자를 만나는 현실적인 방법" : "How to Actually Meet Investors"}</span>
            </div>
            <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.6, marginTop: "6px" }}>
              {ko ? "콜드 이메일은 답변율 2% 미만입니다. 아래 방법이 훨씬 효과적입니다." : "Cold emails have <2% response rate. These methods work much better."}
            </div>
          </div>
          <div style={{ padding: "0 22px 16px", display: "grid", gap: "8px" }}>
            {(ko ? [
              { step: "1", title: "TIPS 운영사를 먼저 공략하세요", detail: "TIPS 149개 운영사가 직접 투자합니다. jointips.or.kr에서 우리 분야 운영사를 찾고, 포트폴리오를 확인하세요. 운영사가 선투자 → 정부가 최대 5억 매칭. 이게 가장 현실적인 첫 투자입니다.", color: "#7c3aed" },
              { step: "2", title: "액셀러레이터 데모데이에 지원하세요", detail: "SparkLabs, 프라이머, 블루포인트, 매쉬업엔젤스 등. 3~6개월 프로그램 후 데모데이에서 VC 앞에 피칭합니다. 투자 확률이 콜드 접근 대비 10배 높습니다. 선발율 3~5%이니 여러 곳 동시 지원하세요.", color: "#2563eb" },
              { step: "3", title: "스타트업 행사에서 직접 만나세요", detail: "넥스트라이즈, 비론치, 스타트업위크엔드, 코리아핀테크위크 등. 투자자는 행사에서 발굴합니다. 30초 엘리베이터 피치를 준비하고, 명함 대신 1페이지 요약을 건네세요.", color: "#059669" },
              { step: "4", title: "따뜻한 소개를 만드세요", detail: "LinkedIn에서 타겟 VC의 기존 투자 대표를 찾고, 공통 지인을 통해 소개받으세요. \"OOO 대표님 소개로 연락드립니다\"가 콜드 이메일보다 10배 효과적입니다. 이전 단계의 멘토/액셀러레이터가 소개해줄 수 있습니다.", color: "#d97706" },
              { step: "5", title: "피칭 전 이것만 준비하세요", detail: "① 10장 피치덱 (문제→솔루션→시장→견인력→팀→자금) ② 재무 모델 (3년 추정, 번레이트, 런웨이) ③ 제품 데모 (실제 동작하는 MVP) ④ 고객 증거 (유저 수, 매출, 후기). 이 4개가 없으면 미팅이 잡혀도 의미가 없습니다.", color: "#dc2626" },
            ] : [
              { step: "1", title: "Target TIPS operators first", detail: "149 TIPS operators invest directly. Find ones in your field at jointips.or.kr. They invest first → gov matches up to ₩500M. Most realistic first investment.", color: "#7c3aed" },
              { step: "2", title: "Apply to accelerator demo days", detail: "SparkLabs, Primer, Bluepoint, MashupAngels. 3-6 month programs ending in demo day with VCs. 10x higher investment chance vs cold outreach. Apply to multiple (3-5% acceptance rate).", color: "#2563eb" },
              { step: "3", title: "Meet investors at events", detail: "NextRise, beLAUNCH, Startup Weekend, Korea Fintech Week. Prepare a 30-second elevator pitch. Bring a 1-pager instead of business cards.", color: "#059669" },
              { step: "4", title: "Get warm introductions", detail: "Find target VC's portfolio founders on LinkedIn. Ask mutual connections for intros. \"Introduced by [name]\" is 10x more effective than cold email.", color: "#d97706" },
              { step: "5", title: "Prepare these before any meeting", detail: "① 10-slide deck ② Financial model (3yr, burn, runway) ③ Product demo (working MVP) ④ Customer evidence (users, revenue, testimonials). Without these 4, even booked meetings are wasted.", color: "#dc2626" },
            ]).map(s => (
              <div key={s.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px 14px", borderRadius: "14px", background: `${s.color}03`, border: `1px solid ${s.color}08` }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: s.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a", marginBottom: "3px" }}>{s.title}</div>
                  <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.6 }}>{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "0 22px 16px", display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
            <a href="https://www.jointips.or.kr" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 14px", borderRadius: "8px", background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.1)", fontSize: "12px", fontWeight: 600, color: "#7c3aed", textDecoration: "none" }}>TIPS 운영사 목록 ↗</a>
            <a href="https://www.k-startup.go.kr" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 14px", borderRadius: "8px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.1)", fontSize: "12px", fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>K-Startup ↗</a>
            <a href="https://www.thevc.kr" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 14px", borderRadius: "8px", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)", fontSize: "12px", fontWeight: 600, color: "rgba(15,23,42,0.5)", textDecoration: "none" }}>THE VC (투자 DB) ↗</a>
          </div>
        </div>

      </div>

    </>
  );
}
