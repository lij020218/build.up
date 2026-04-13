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
    guideSelections, setGuideSelections,
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
  const isStartup = industryCategoryId === "startup-tech";

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
          {isStartup
            ? (ko ? "지분을 지키면서 성장 자금을 확보하세요." : "Secure growth capital while protecting your equity.")
            : (ko ? "적절한 자금 조달은 사업의 생존과 성장 속도를 결정합니다." : "The right funding determines your survival and growth speed.")}
        </div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.65 }}>
          {isStartup
            ? (ko
              ? "초기 밸류에이션이 낮을 때 지분을 내어주면 나중에 수십억의 가치를 잃습니다. 대신 정부 R&D 과제(TIPS 최대 8억), 예비창업패키지(최대 1억), AI 바우처 등 비지분 자금으로 마일스톤을 달성한 뒤 기업가치를 높이세요. 이 단계에서는 우리 스타트업에 맞는 프로그램을 매칭하고, AI 사업계획서로 신청까지 도와드립니다."
              : "Giving up equity at a low valuation costs billions later. Instead, hit milestones with non-dilutive funds — TIPS (up to ₩800M), Pre-Startup Package (₩100M), AI Voucher — then raise at a higher valuation. This stage matches programs to your startup and helps you apply with an AI-generated business plan.")
            : (ko
              ? "한국에는 소상공인을 위한 정책자금이 매년 수조원 규모로 집행됩니다. 시중 은행 대출보다 금리가 낮고 (1~3%), 상환 유예 기간도 있습니다. 하지만 대부분의 사장님이 \"존재 자체를 모르거나\" \"서류가 복잡해서\" 포기합니다. 이 단계에서는 내 업종에 맞는 프로그램을 찾고, 신청 방법을 단계별로 안내합니다."
              : "Korea allocates trillions of won annually for SME policy funding. Lower rates than banks (1-3%) with repayment grace periods. Most business owners miss these because they don't know they exist or give up on paperwork. This stage matches you with programs and guides you through applications.")}
        </div>
      </div>

      {/* ── 나의 자금 조달 경로 선택 ── */}
      {(() => {
        const fundingPath = (guideSelections["funding-path"] as string | undefined) ?? null;
        const selectPath = (path: string) => {
          setGuideSelections((prev: Record<string, string>) => ({ ...prev, "funding-path": path }));
        };
        return (
      <div style={{ marginBottom: "14px", borderRadius: "20px", border: "1px solid rgba(217,119,6,0.08)", background: "linear-gradient(180deg, rgba(217,119,6,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
          {ko ? "나의 자금 조달 경로를 선택하세요" : "Choose your funding path"}
        </div>
        <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", marginBottom: "12px" }}>
          {ko ? "선택하면 자동 저장됩니다. 나중에 변경할 수 있어요." : "Auto-saved. You can change later."}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {(isStartup ? (ko ? [
            { id: "govt-rd", label: "R&D · 지원사업", desc: "TIPS/창업패키지/바우처", color: "#2563eb" },
            { id: "policy-loan", label: "정책 대출 · 보증", desc: "기보/신보/중진공", color: "#059669" },
          ] : [
            { id: "govt-rd", label: "R&D & Programs", desc: "TIPS/Packages/Vouchers", color: "#2563eb" },
            { id: "policy-loan", label: "Policy Loans", desc: "KIBO/KODIT Guarantees", color: "#059669" },
          ]) : (ko ? [
            { id: "policy-fund", label: "정부 정책자금", desc: "소진공/중진공 저금리", color: "#2563eb" },
            { id: "guarantee-loan", label: "보증 대출", desc: "신보/기보 무담보", color: "#059669" },
          ] : [
            { id: "policy-fund", label: "Policy Funds", desc: "SEMAS/KOSMES low-rate", color: "#2563eb" },
            { id: "guarantee-loan", label: "Guarantee Loans", desc: "KODIT/KIBO unsecured", color: "#059669" },
          ])).map(opt => {
            const selected = fundingPath === opt.id;
            return (
            <button key={opt.id} type="button" onClick={() => selectPath(opt.id)} style={{
              padding: "14px 12px", borderRadius: "14px", cursor: "pointer",
              border: selected ? `2px solid ${opt.color}` : "1px solid rgba(0,0,0,0.08)",
              background: selected ? `${opt.color}08` : "rgba(0,0,0,0.01)",
              textAlign: "center" as const, transition: "all 0.2s ease",
            }}>
              <div style={{
                width: "18px", height: "18px", borderRadius: "50%", margin: "0 auto 8px",
                border: selected ? `5px solid ${opt.color}` : "2px solid rgba(0,0,0,0.15)",
                transition: "all 0.2s ease",
              }} />
              <div style={{ fontSize: "13px", fontWeight: 680, color: selected ? opt.color : "#0f172a" }}>{opt.label}</div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", marginTop: "2px" }}>{opt.desc}</div>
            </button>
            );
          })}
        </div>
        {fundingPath && (
          <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "10px", background: "rgba(217,119,6,0.04)", border: "1px solid rgba(217,119,6,0.1)" }}>
            <div style={{ fontSize: "12px", fontWeight: 640, color: "#d97706" }}>
              ✓ {fundingPath === "govt-rd"
                ? (ko ? "R&D · 지원사업 선택됨 — 아래에서 맞춤 프로그램을 확인하고 사업계획서를 준비하세요" : "R&D & Programs selected — check matching programs below and prepare your plan")
                : fundingPath === "policy-loan"
                  ? (ko ? "정책 대출 · 보증 선택됨 — 기보/신보 보증서 발급 후 저금리 대출을 활용하세요" : "Policy loan selected — get KIBO/KODIT guarantee for low-rate loans")
                  : fundingPath === "policy-fund"
                    ? (ko ? "정책자금 선택됨 — 소진공/중진공 자금 신청 절차를 아래에서 확인하세요" : "Policy fund selected — check SEMAS/KOSMES application steps below")
                    : fundingPath === "guarantee-loan"
                      ? (ko ? "보증 대출 선택됨 — 신보/기보 보증서로 무담보 저금리 대출을 받으세요" : "Guarantee loan selected — use KODIT/KIBO letters for unsecured low-rate loans")
                      : ""}
            </div>
          </div>
        )}
      </div>
        );
      })()}

      {/* ── 자금 경로 상세 (업종별 분기) ── */}
      <div style={{ marginBottom: "14px", display: "grid", gap: "10px" }}>
        {(isStartup ? (ko ? [
          { num: "1", title: "무상 지원사업 (R&D · 사업화)", desc: "갚을 필요 없음. TIPS 최대 8억, 예비창업패키지 최대 1억, AI바우처 최대 3억", color: "#2563eb", steps: [
            "K-Startup(k-startup.go.kr)에서 모집 공고 확인",
            "TIPS: 149개 운영사 중 우리 분야 운영사 찾기 → 운영사가 선투자 → 정부 매칭",
            "예비창업패키지: 사업자등록 전 예비 창업자 대상. ~11/30까지 수시 접수",
            "사업계획서(PSST) + 발표 자료 준비 → 온라인 접수 → 서류/발표 심사 → 선정",
            "tip: 벤처인증(12단계)이 있으면 가산점. 여러 프로그램에 동시 지원 가능",
          ], links: [
            { label: "TIPS 운영사 목록", url: "https://www.jointips.or.kr" },
            { label: "K-Startup 지원사업", url: "https://www.k-startup.go.kr" },
            { label: "AI 바우처", url: "https://www.nipa.kr" },
          ]},
          { num: "2", title: "기술보증 기반 정책 대출", desc: "기보/중진공 보증으로 저금리 대출. 벤처인증 시 우대", color: "#059669", steps: [
            "기술보증기금(kibo.or.kr)에서 기술평가 → 보증서 발급",
            "보증서 지참하여 시중은행 방문 → 무담보 저금리 대출",
            "중진공 청년전용창업자금: 만 39세 이하, 업력 3년 미만, 고정금리 2.5%",
            "tip: 기보 벤처캠프 프로그램 활용 시 보증료 추가 할인",
          ], links: [
            { label: "기술보증기금", url: "https://www.kibo.or.kr" },
            { label: "중진공 청년전용", url: "https://www.kosmes.or.kr" },
          ]},
          { num: "3", title: "바우처 · 인프라 지원", desc: "AI/데이터/클라우드 도입 비용 70~90% 정부 부담", color: "#7c3aed", steps: [
            "AI 바우처(nipa.kr): AI 솔루션 도입 비용 최대 3억 지원",
            "데이터바우처(kdata.or.kr): 데이터 구매·가공 최대 5천만원",
            "클라우드 바우처: AWS/GCP/Azure 크레딧 지원",
            "tip: 바우처는 사업계획서가 간소. 견적서 + 도입 계획만으로 신청 가능",
          ], links: [
            { label: "AI 바우처", url: "https://www.nipa.kr" },
            { label: "데이터바우처", url: "https://www.kdata.or.kr" },
          ]},
        ] : [
          { num: "1", title: "R&D Grants (No Repayment)", desc: "TIPS up to ₩800M, Pre-Startup ₩100M, AI Voucher ₩300M", color: "#2563eb", steps: [
            "Check K-Startup (k-startup.go.kr) for open calls",
            "TIPS: Find matching operator → they invest first → gov matches",
            "Pre-Startup Package: Pre-entrepreneurs, rolling until Nov 30",
            "Prepare PSST business plan → apply online → review → selection",
            "tip: Venture cert (Stage 12) gives bonus points. Apply to multiple",
          ], links: [
            { label: "TIPS Operators", url: "https://www.jointips.or.kr" },
            { label: "K-Startup", url: "https://www.k-startup.go.kr" },
          ]},
          { num: "2", title: "Tech Guarantee Loans", desc: "KIBO/KOSMES guarantees for low-rate loans. Venture cert preferred", color: "#059669", steps: [
            "KIBO (kibo.or.kr): tech assessment → guarantee letter",
            "Bring guarantee to bank → unsecured low-rate loan",
            "KOSMES Youth Fund: under 39, <3yr old, fixed 2.5%",
            "tip: KIBO VentureCamp gives additional guarantee fee discount",
          ], links: [
            { label: "KIBO", url: "https://www.kibo.or.kr" },
            { label: "KOSMES Youth", url: "https://www.kosmes.or.kr" },
          ]},
          { num: "3", title: "Vouchers & Infrastructure", desc: "AI/Data/Cloud adoption 70-90% gov covered", color: "#7c3aed", steps: [
            "AI Voucher (nipa.kr): up to ₩300M for AI adoption",
            "Data Voucher (kdata.or.kr): up to ₩50M for data",
            "Cloud Voucher: AWS/GCP/Azure credits",
            "tip: Vouchers need simpler plans — quotes + adoption plan only",
          ], links: [
            { label: "AI Voucher", url: "https://www.nipa.kr" },
            { label: "Data Voucher", url: "https://www.kdata.or.kr" },
          ]},
        ]) : (ko ? [
          { num: "1", title: "정부 정책자금 (추천)", desc: "소진공, 중진공, 지자체 정책자금. 금리 1~3%, 상환유예 1~2년", color: "#2563eb", steps: [
            "소상공인시장진흥공단(소진공) 홈페이지에서 자격 확인",
            "신청 서류 준비: 사업자등록증, 사업계획서, 재무제표(없으면 추정)",
            "온라인 접수 → 현장 실사(1~2주) → 승인 → 자금 집행",
            "tip: 3~4월이 가장 예산이 많음. 하반기는 소진될 수 있음",
          ], links: [
            { label: "소진공 정책자금", url: "https://www.semas.or.kr" },
            { label: "중진공 정책자금", url: "https://www.kosmes.or.kr" },
          ]},
          { num: "2", title: "시중은행 보증 대출", desc: "신용보증기금, 기술보증기금 보증서로 금리 인하. 무담보 최대 2억", color: "#059669", steps: [
            "신용보증기금(kodit.co.kr) 또는 기보(kibo.or.kr)에서 보증서 발급",
            "보증서 지참하여 시중은행(국민, 신한, 하나 등) 방문",
            "보증서가 있으면 담보 없이 최대 2억까지 가능",
            "tip: 기보 보증이 금리가 더 낮고, 기술기업에 유리",
          ], links: [
            { label: "신용보증기금", url: "https://www.kodit.co.kr" },
            { label: "기술보증기금", url: "https://www.kibo.or.kr" },
          ]},
          { num: "3", title: "무상 지원금 · 바우처", desc: "갚을 필요 없음. 스마트화 지원, 디지털 바우처 등", color: "#7c3aed", steps: [
            "K-Startup(k-startup.go.kr)에서 내 업종 맞춤 공모 확인",
            "소상공인 스마트화 지원, 디지털 전환 바우처 등",
            "사업계획서 + 견적서 준비 → 온라인 접수 → 평가 → 선정",
            "tip: 선정률 10~30%. 여러 프로그램에 동시 지원하세요",
          ], links: [
            { label: "K-Startup 지원사업", url: "https://www.k-startup.go.kr" },
            { label: "소상공인 스마트화", url: "https://www.semas.or.kr" },
          ]},
        ] : [
          { num: "1", title: "Government Policy Funds", desc: "SEMAS, KOSMES. Low rates 1-3%, 1-2yr grace", color: "#2563eb", steps: [
            "Check eligibility at SEMAS (semas.or.kr)",
            "Prepare: registration, plan, financials (estimates OK)",
            "Apply online → site visit (1-2wk) → approval → disbursement",
            "tip: March-April has most budget. H2 may be depleted",
          ], links: [
            { label: "SEMAS", url: "https://www.semas.or.kr" },
            { label: "KOSMES", url: "https://www.kosmes.or.kr" },
          ]},
          { num: "2", title: "Bank Loans with Guarantees", desc: "KODIT/KIBO guarantees for lower rates. Up to ₩200M unsecured", color: "#059669", steps: [
            "Get guarantee from KODIT or KIBO",
            "Bring guarantee to commercial bank",
            "Up to ₩200M without collateral",
            "tip: KIBO has lower rates, better for tech businesses",
          ], links: [
            { label: "KODIT", url: "https://www.kodit.co.kr" },
            { label: "KIBO", url: "https://www.kibo.or.kr" },
          ]},
          { num: "3", title: "Free Grants & Vouchers", desc: "No repayment. Smart SME, digital vouchers", color: "#7c3aed", steps: [
            "Check K-Startup for matching programs",
            "Smart SME, digital transformation vouchers",
            "Plan + quotes → apply online → evaluation → selection",
            "tip: 10-30% selection. Apply to multiple simultaneously",
          ], links: [
            { label: "K-Startup", url: "https://www.k-startup.go.kr" },
            { label: "Smart SME", url: "https://www.semas.or.kr" },
          ]},
        ])).map(path => (
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
