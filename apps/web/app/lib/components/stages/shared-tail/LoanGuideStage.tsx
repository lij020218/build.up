"use client";

import {
  getMatchedPrograms,
  getProgramCategoryColor,
  getProgramCategoryLabel,
  type ProgramCategory,
} from "@build-up/shared";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { fetchLiveSupportPrograms } from "../../../services/live-data";
import { supabase } from "../../../../../lib/supabase";

export function LoanGuideStage() {
  const d = useDashboardCtx();
  const {
    language,
    industryCategoryId,
    startupType,
    selectedIndustryId,
    selectedFranchiseBrandId,
    selectedBusinessModelId,
    selectedBudget,
    decisions,
    guideSelections,
    savedFinanceSnapshot,
    progFilter, setProgFilter,
    liveProgramsData, setLiveProgramsData,
    liveProgramsLoading, setLiveProgramsLoading,
    bpLoading, setBpLoading,
    bpSections, setBpSections,
    bpSummary, setBpSummary,
    bpError, setBpError,
    bpExpandedIdx, setBpExpandedIdx,
  } = d;

  const ko = language === "ko";

  /* ── Startup Support Programs ── */
  const matched = getMatchedPrograms(startupType);
  const filtered = progFilter === "all" ? matched : matched.filter(p => p.category === progFilter);
  const categories: Array<{ id: ProgramCategory | "all"; label: string }> = [
    { id: "all", label: ko ? "전체" : "All" },
    { id: "government", label: ko ? "정부" : "Gov" },
    { id: "private", label: ko ? "민간·재단" : "Private" },
    { id: "local", label: ko ? "지자체" : "Local" },
  ];

  /* ── K-Startup live programs ── */
  const loadLivePrograms = async () => {
    if (liveProgramsData.length > 0 || liveProgramsLoading) return;
    setLiveProgramsLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const keyword = industryCategoryId === "startup-tech" ? "창업" : "소상공인";
      const res = await fetchLiveSupportPrograms({ keyword, numOfRows: 15 }, token);
      setLiveProgramsData(res.data.map(p => ({
        id: p.id,
        programName: p.programName,
        organizerName: p.organizerName,
        supportCategory: p.supportCategory,
        isOpen: p.isOpen,
        url: p.url,
      })));
    } catch { /* silent */ }
    setLiveProgramsLoading(false);
  };

  // 자동 로드 트리거
  if (liveProgramsData.length === 0 && !liveProgramsLoading) {
    void loadLivePrograms();
  }

  /* ── Business Plan Generator ── */
  const generatePlan = async () => {
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
        franchiseBrand: selectedFranchiseBrandId ? (await import("@build-up/shared")).getFranchiseBrandById(selectedFranchiseBrandId)?.name.ko : undefined,
        businessModel: selectedBusinessModelId ?? "",
        capital: selectedBudget ?? 0,
        targetOpenDate: decisions["budget-setup"]?.inputs?.targetOpenDate ?? "",
        location: loc?.selectedPrimaryOptionId ?? "",
        locationScore: loc?.inputs?.score as number | undefined,
        bepRevenue: savedFinanceSnapshot?.breakEvenRevenue,
        runway: savedFinanceSnapshot?.survivabilityMonths,
        riskLevel: savedFinanceSnapshot?.riskLevel,
        language,
        // 로드맵 데이터
        problemStatement: sfInputs?.problemStatement as string | undefined,
        teamStructure: sfInputs?.teamStructure as string | undefined,
        northStarType: geInputs?.northStarType as string | undefined,
        northStarMetricName: geInputs?.northStarMetricName as string | undefined,
        targetCustomer: guideSelections["interview-target"] || undefined,
        interviewInsights: guideSelections["analysis-result"] ? "고객 인터뷰 분석 완료" : undefined,
      };
      const res = await fetch("/api/ai/business-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBpSections(data.sections);
      setBpSummary(data.summary);
    } catch (err) {
      setBpError(err instanceof Error ? err.message : "Failed");
    }
    setBpLoading(false);
  };

  return (
    <>
      {/* ── Startup Support Programs ── */}
      <div style={{
        marginBottom: "18px",
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.78)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)",
        boxShadow: "0 8px 20px rgba(17,17,17,0.03)",
        overflow: "hidden"
      }}>
        <div style={{ padding: "18px 22px 14px" }}>
          <div style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em", marginBottom: "4px" }}>
            {ko ? "창업 지원 프로그램" : "Startup Support Programs"}
          </div>
          <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
            {ko ? "대출, 지원금, 멘토링, 사무공간 등 다양한 프로그램이 있습니다." : "Loans, grants, mentoring, office space and more."}
          </div>
          {/* Category filter */}
          <div style={{ display: "flex", gap: "4px", marginTop: "10px" }}>
            {categories.map(cat => {
              const active = progFilter === cat.id;
              return (
                <button key={cat.id} type="button" onClick={() => setProgFilter(cat.id)}
                  style={{ padding: "5px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: active ? 600 : 500, border: active ? "1.5px solid var(--primary)" : "1px solid var(--border)", background: active ? "rgba(29,53,87,0.06)" : "transparent", color: active ? "var(--primary)" : "var(--muted)", cursor: "pointer" }}>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ padding: "0 22px 16px", display: "grid", gap: "8px", maxHeight: "400px", overflowY: "auto" }}>
          {filtered.map(prog => {
            const catColor = getProgramCategoryColor(prog.category);
            return (
              <a key={prog.id} href={prog.url} target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", borderRadius: "14px",
                border: "1px solid var(--border)", background: "rgba(255,255,255,0.6)", textDecoration: "none", color: "inherit"
              }}>
                <div style={{ padding: "3px 8px", borderRadius: "6px", background: `${catColor}12`, color: catColor, fontSize: "10px", fontWeight: 600, flexShrink: 0, marginTop: "2px", whiteSpace: "nowrap" }}>
                  {getProgramCategoryLabel(prog.category, language)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "2px" }}>{prog.name[language]}</div>
                  <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--muted)" }}>{prog.target[language]}</div>
                  {prog.amount && <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", marginTop: "2px" }}>{prog.amount}</div>}
                </div>
                <span style={{ fontSize: "13px", color: "var(--primary)", flexShrink: 0, marginTop: "2px" }}>↗</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* ── K-Startup Live Programs ── */}
      {(liveProgramsData.length > 0 || liveProgramsLoading) && (
        <div style={{
          marginBottom: "18px",
          borderRadius: "24px",
          border: "1px solid rgba(5,150,105,0.12)",
          background: "linear-gradient(180deg, rgba(209,250,229,0.15) 0%, rgba(255,255,255,0.9) 100%)",
          boxShadow: "0 8px 20px rgba(17,17,17,0.03)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "18px 22px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#059669", animation: liveProgramsLoading ? "bentoPulse 1.5s infinite" : "none" }} />
              <span style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em" }}>
                {ko ? "실시간 정부 지원사업" : "Live Government Programs"}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
              {ko ? "K-Startup API에서 가져온 현재 공모 중인 프로그램입니다." : "Currently open programs from K-Startup API."}
            </div>
          </div>

          {liveProgramsLoading ? (
            <div style={{ padding: "0 22px 16px", display: "grid", gap: "8px" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ padding: "14px", borderRadius: "14px", background: "rgba(0,0,0,0.02)", display: "flex", gap: "12px" }}>
                  <div style={{ width: "60px", height: "14px", borderRadius: "6px", background: "rgba(0,0,0,0.05)" }} />
                  <div style={{ flex: 1, display: "grid", gap: "6px" }}>
                    <div style={{ height: "14px", width: "70%", borderRadius: "6px", background: "rgba(0,0,0,0.05)" }} />
                    <div style={{ height: "12px", width: "50%", borderRadius: "6px", background: "rgba(0,0,0,0.03)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "0 22px 16px", display: "grid", gap: "8px", maxHeight: "360px", overflowY: "auto" }}>
              {liveProgramsData.map(prog => (
                <a key={prog.id} href={prog.url ?? "#"} target="_blank" rel="noopener noreferrer" style={{
                  display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", borderRadius: "14px",
                  border: "1px solid rgba(5,150,105,0.08)", background: "rgba(255,255,255,0.7)", textDecoration: "none", color: "inherit",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}>
                  <div style={{
                    padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 600, flexShrink: 0, marginTop: "2px", whiteSpace: "nowrap" as const,
                    background: prog.isOpen ? "rgba(5,150,105,0.08)" : "rgba(0,0,0,0.04)",
                    color: prog.isOpen ? "#059669" : "var(--muted)",
                  }}>
                    {prog.isOpen ? (ko ? "공모중" : "Open") : (ko ? "마감" : "Closed")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "2px" }}>{prog.programName}</div>
                    <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--muted)" }}>{prog.organizerName} · {prog.supportCategory}</div>
                  </div>
                  <span style={{ fontSize: "13px", color: "#059669", flexShrink: 0, marginTop: "2px" }}>↗</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Business Plan Generator ── */}
      <div style={{
        marginBottom: "18px",
        borderRadius: "24px",
        border: "1px solid rgba(29,53,87,0.12)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(29,53,87,0.03) 100%)",
        boxShadow: "0 8px 20px rgba(17,17,17,0.04)",
        overflow: "hidden"
      }}>
        <div style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, var(--primary), rgba(117,163,255,0.9))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px" }}>
              📄
            </div>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                {ko ? "사업계획서 자동 생성" : "Auto Business Plan"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                {ko ? "Claude Sonnet 4.6 기반 · 입력한 데이터를 활용합니다" : "Powered by Claude Sonnet 4.6 · Uses your roadmap data"}
              </div>
            </div>
          </div>

          {!bpSections && !bpLoading && (
            <>
              <div style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--muted)", marginBottom: "14px" }}>
                {ko
                  ? "지금까지 입력한 업종, 상권, 재무 시뮬레이션 데이터를 기반으로 소진공 정책자금 신청에 적합한 사업계획서를 자동 생성합니다."
                  : "Auto-generates a business plan suitable for SME policy fund applications using your roadmap data."}
              </div>
              <button
                type="button"
                onClick={generatePlan}
                style={{
                  width: "100%", padding: "14px", borderRadius: "999px",
                  border: "none", background: "var(--primary)", color: "#fff",
                  fontSize: "15px", fontWeight: 600, cursor: "pointer"
                }}
              >
                {ko ? "사업계획서 생성하기" : "Generate Business Plan"}
              </button>
            </>
          )}

          {bpLoading && (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)", fontSize: "14px" }}>
              {ko ? "AI가 사업계획서를 작성 중입니다... (30초~1분)" : "AI is writing your business plan... (30s-1min)"}
            </div>
          )}

          {bpError && (
            <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.12)", marginTop: "10px" }}>
              <div style={{ fontSize: "13px", color: "#ff3b30", fontWeight: 600, marginBottom: "4px" }}>
                {ko ? "생성 실패" : "Generation Failed"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>{bpError}</div>
              <button type="button" onClick={generatePlan} style={{ marginTop: "8px", padding: "8px 16px", borderRadius: "999px", border: "1px solid var(--border)", background: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                {ko ? "다시 시도" : "Retry"}
              </button>
            </div>
          )}

          {bpSections && (
            <div style={{ marginTop: "10px" }}>
              {bpSummary && (
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--primary)", marginBottom: "12px", lineHeight: 1.5 }}>{bpSummary}</div>
              )}
              <div style={{ display: "grid", gap: "6px" }}>
                {bpSections.map((sec: { title: string; content: string }, idx: number) => {
                  const expanded = bpExpandedIdx === idx;
                  return (
                    <div key={idx} style={{ borderRadius: "14px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.7)", overflow: "hidden" }}>
                      <button
                        type="button"
                        onClick={() => setBpExpandedIdx(expanded ? null : idx)}
                        style={{
                          width: "100%", padding: "12px 16px", border: "none", background: "transparent",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          cursor: "pointer", textAlign: "left"
                        }}
                      >
                        <span style={{ fontSize: "14px", fontWeight: 600 }}>{sec.title}</span>
                        <span style={{ fontSize: "12px", color: "var(--muted)", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
                      </button>
                      {expanded && (
                        <div style={{ padding: "0 16px 14px", fontSize: "13px", lineHeight: 1.7, color: "var(--muted)", whiteSpace: "pre-line" }}>
                          {sec.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  const full = bpSections.map((s: { title: string; content: string }) => `${s.title}\n\n${s.content}`).join("\n\n---\n\n");
                  navigator.clipboard.writeText(full).catch(() => {});
                }}
                style={{
                  marginTop: "12px", width: "100%", padding: "12px",
                  borderRadius: "999px", border: "1px solid var(--primary)",
                  background: "rgba(29,53,87,0.04)", color: "var(--primary)",
                  fontSize: "14px", fontWeight: 600, cursor: "pointer"
                }}
              >
                {ko ? "전체 텍스트 복사하기" : "Copy Full Text"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
