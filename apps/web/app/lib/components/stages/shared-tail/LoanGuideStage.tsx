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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error(ko ? "로그인이 필요합니다" : "Login required");
      const res = await fetch("/api/ai/business-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
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
      {/* ── WHY — 이 단계가 중요한 이유 ── */}
      <div style={{ marginBottom: "14px", borderRadius: "20px", border: "1px solid rgba(220,38,38,0.08)", background: "linear-gradient(180deg, rgba(220,38,38,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{ko ? "왜 이 단계가 중요한가" : "Why this matters"}</span>
        </div>
        <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
          {ko ? "적절한 자금 조달은 사업의 생존과 성장 속도를 결정합니다." : "The right funding determines your survival and growth speed."}
        </div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.65 }}>
          {ko
            ? "한국에는 소상공인을 위한 정책자금이 매년 수조원 규모로 집행됩니다. 시중 은행 대출보다 금리가 낮고 (1~3%), 상환 유예 기간도 있습니다. 하지만 대부분의 사장님이 \"존재 자체를 모르거나\" \"서류가 복잡해서\" 포기합니다. 이 단계에서는 내 업종에 맞는 프로그램을 찾고, 신청 방법을 단계별로 안내합니다."
            : "Korea allocates trillions of won annually for SME policy funding. Lower rates than banks (1-3%) with repayment grace periods. Most business owners miss these because they don't know they exist or give up on paperwork. This stage matches you with the right programs and guides you through applications step by step."}
        </div>
      </div>

      {/* ── 자금 조달 3가지 경로 ── */}
      <div style={{ marginBottom: "14px", display: "grid", gap: "10px" }}>
        {(ko ? [
          { num: "1", title: "정부 정책자금 (추천)", desc: "소진공, 중진공, 지자체 정책자금. 금리 1~3%, 상환유예 1~2년. 사업계획서 필요", color: "#2563eb", steps: [
            "소상공인시장진흥공단(소진공) 홈페이지에서 자격 확인",
            "신청 서류 준비: 사업자등록증, 사업계획서, 재무제표(없으면 추정)",
            "온라인 접수 → 현장 실사(1~2주) → 승인 → 자금 집행",
            "tip: 3~4월이 가장 예산이 많음. 하반기는 소진될 수 있음",
          ], links: [
            { label: "소진공 정책자금", url: "https://www.semas.or.kr" },
            { label: "중진공 정책자금", url: "https://www.kosmes.or.kr" },
          ]},
          { num: "2", title: "시중은행 소상공인 대출", desc: "신용보증기금, 기술보증기금 보증서로 금리 인하. 보증료 0.5~2%", color: "#059669", steps: [
            "신용보증기금(kodit.co.kr) 또는 기보(kibo.or.kr)에서 보증서 발급",
            "보증서 지참하여 시중은행(국민, 신한, 하나 등) 방문",
            "보증서가 있으면 담보 없이 최대 2억까지 가능",
            "tip: 기보 보증이 금리가 더 낮고, 기술기업에 유리",
          ], links: [
            { label: "신용보증기금", url: "https://www.kodit.co.kr" },
            { label: "기술보증기금", url: "https://www.kibo.or.kr" },
          ]},
          { num: "3", title: "무상 지원금 · 바우처", desc: "갚을 필요 없는 지원금. 특정 사업비에만 사용 가능 (용도 제한)", color: "#7c3aed", steps: [
            "K-Startup(k-startup.go.kr)에서 내 업종 맞춤 공모 확인",
            "소상공인 스마트화 지원, AI 바우처, 데이터바우처 등",
            "사업계획서 + 견적서 준비 → 온라인 접수 → 평가 → 선정",
            "tip: 선정률 10~30%. 여러 프로그램에 동시 지원하세요",
          ], links: [
            { label: "K-Startup 지원사업", url: "https://www.k-startup.go.kr" },
            { label: "소상공인 스마트화", url: "https://www.semas.or.kr" },
          ]},
        ] : [
          { num: "1", title: "Government Policy Funds (Best)", desc: "SEMAS, KOSMES. Low rates 1-3%, 1-2yr grace. Requires business plan", color: "#2563eb", steps: [
            "Check eligibility at SEMAS (semas.or.kr)",
            "Prepare: business registration, plan, financials (estimates OK)",
            "Apply online → site visit (1-2wk) → approval → disbursement",
            "tip: March-April has the most budget. H2 may be depleted",
          ], links: [
            { label: "SEMAS Policy Funds", url: "https://www.semas.or.kr" },
            { label: "KOSMES Funds", url: "https://www.kosmes.or.kr" },
          ]},
          { num: "2", title: "Bank Loans with Guarantees", desc: "KODIT/KIBO guarantee letters for lower rates. 0.5-2% guarantee fee", color: "#059669", steps: [
            "Get guarantee from KODIT (kodit.co.kr) or KIBO (kibo.or.kr)",
            "Bring guarantee to commercial bank (KB, Shinhan, Hana)",
            "Up to ₩200M without collateral with guarantee letter",
            "tip: KIBO has lower rates, better for tech businesses",
          ], links: [
            { label: "KODIT", url: "https://www.kodit.co.kr" },
            { label: "KIBO", url: "https://www.kibo.or.kr" },
          ]},
          { num: "3", title: "Free Grants & Vouchers", desc: "No repayment. Restricted to specific business expenses", color: "#7c3aed", steps: [
            "Check K-Startup for matching programs (k-startup.go.kr)",
            "Smart SME, AI Voucher, Data Voucher, etc.",
            "Business plan + quotes → apply online → evaluation → selection",
            "tip: 10-30% selection rate. Apply to multiple simultaneously",
          ], links: [
            { label: "K-Startup Programs", url: "https://www.k-startup.go.kr" },
            { label: "Smart SME", url: "https://www.semas.or.kr" },
          ]},
        ]).map(path => (
          <div key={path.num} style={{ borderRadius: "20px", border: `1px solid ${path.color}12`, background: `linear-gradient(180deg, ${path.color}03 0%, rgba(255,255,255,0.98) 100%)`, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px 12px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: path.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>{path.num}</div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{path.title}</div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)" }}>{path.desc}</div>
              </div>
            </div>
            <div style={{ padding: "0 22px 12px", display: "grid", gap: "4px" }}>
              {path.steps.map((step, i) => {
                const isTip = step.startsWith("tip:");
                return (
                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "6px 10px", borderRadius: "8px", background: isTip ? `${path.color}06` : "transparent" }}>
                  {!isTip && <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: path.color, flexShrink: 0, marginTop: "7px" }} />}
                  <span style={{ fontSize: isTip ? "12px" : "13px", fontWeight: isTip ? 600 : 500, color: isTip ? path.color : "rgba(15,23,42,0.65)", lineHeight: 1.5 }}>
                    {isTip ? `💡 ${step.replace("tip: ", "")}` : step}
                  </span>
                </div>
                );
              })}
            </div>
            <div style={{ padding: "0 22px 16px", display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
              {path.links.map(link => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 12px",
                  borderRadius: "8px", background: `${path.color}06`, border: `1px solid ${path.color}10`,
                  fontSize: "12px", fontWeight: 600, color: path.color, textDecoration: "none",
                }}>{link.label} ↗</a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── 사업계획서 팁 ── */}
      <div style={{ marginBottom: "14px", borderRadius: "16px", border: "1px solid rgba(217,119,6,0.08)", background: "rgba(217,119,6,0.02)", padding: "16px 20px" }}>
        <div style={{ fontSize: "13px", fontWeight: 650, color: "#d97706", marginBottom: "6px" }}>{ko ? "💡 자금 조달 성공률을 높이는 핵심 팁" : "💡 Key Tips for Funding Success"}</div>
        <div style={{ display: "grid", gap: "4px" }}>
          {(ko ? [
            "사업계획서의 \"자금 사용 계획\"이 가장 중요합니다 — \"운전자금\"이 아닌 항목별 구체 금액을 적으세요",
            "재무 시뮬레이션을 먼저 돌리세요 (이전 단계) — 손익분기 매출과 런웨이가 사업계획서의 근거가 됩니다",
            "정책자금은 3~4월에 신청하세요 — 예산이 가장 많고, 하반기는 소진될 수 있습니다",
            "여러 프로그램에 동시 지원하세요 — 정책자금 + 바우처 + 지자체 중복 수혜 가능합니다",
          ] : [
            "\"Fund usage plan\" is the most important section — list specific amounts per category, not just \"working capital\"",
            "Run financial simulation first (previous stage) — BEP and runway become evidence in your plan",
            "Apply March-April — budget is fullest, may be depleted in H2",
            "Apply to multiple programs simultaneously — policy funds + vouchers + local gov can stack",
          ]).map(tip => (
            <div key={tip} style={{ display: "flex", gap: "6px", alignItems: "flex-start", fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>
              <span style={{ color: "#d97706", flexShrink: 0 }}>•</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

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
            {ko ? "내 업종 맞춤 지원 프로그램" : "Programs Matched to Your Business"}
          </div>
          <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
            {ko ? "선택한 업종과 창업 형태를 기반으로 매칭된 프로그램입니다. 클릭하면 신청 페이지로 이동합니다." : "Programs matched to your industry and business type. Click to visit the application page."}
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
