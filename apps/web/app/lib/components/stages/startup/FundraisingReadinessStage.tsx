"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { supabase } from "../../../../../lib/supabase";

export function FundraisingReadinessStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";

  const {
    decisions, industryCategoryId, selectedIndustryId, startupType,
    selectedBusinessModelId, selectedBudget, savedFinanceSnapshot,
    guideSelections, setGuideSelections,
    bpLoading, setBpLoading, bpSections, setBpSections, bpSummary, setBpSummary,
    bpError, setBpError, bpExpandedIdx, setBpExpandedIdx,
  } = d;

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
        {/* WHY — 이 단계의 핵심 */}
        <div style={{ borderRadius: "20px", border: "1px solid rgba(29,53,87,0.1)", background: "linear-gradient(180deg, rgba(29,53,87,0.03) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "이 단계의 핵심" : "Core Question"}</div>
          <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(29,53,87,0.04)", border: "1px solid rgba(29,53,87,0.08)" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
              {ko ? "투자가 정말 필요한가? 아니면 고객 매출로 충분한가?" : "Do you actually need investment? Or can customer revenue sustain you?"}
            </div>
            <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>
              {ko ? "모든 스타트업이 투자를 받아야 하는 건 아닙니다. 토스의 이승건은 8번 실패 후 개인 자금이 2만원까지 떨어졌지만, 많은 성공적인 SaaS/AI 제품은 첫 달부터 매출로 운영됩니다. 2026년 솔로 파운더의 52%가 외부 투자 없이 엑싯에 성공했습니다. 투자는 \"성장 속도를 높이는 도구\"이지 \"생존을 위한 필수\"가 아닐 수 있습니다." : "Not every startup needs investment. Many successful SaaS/AI products run on revenue from month 1. In 2026, 52% of solo founders exited without external funding. Investment accelerates growth — it's not always survival."}
            </div>
          </div>
        </div>

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
            <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(5,150,105,0.04)", border: "1px solid rgba(5,150,105,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 640, color: "#059669" }}>{ko ? "정부 보조금 · 정책자금 상세" : "Government grants & policy funds"}</div>
                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", marginTop: "2px" }}>{ko ? "소진공, TIPS, 바우처 등 비지분 자금은 \"자금 조달 & 정책자금\" 단계에서 안내합니다" : "Non-dilutive funding details are in the \"Funding & Policy\" stage"}</div>
              </div>
              <button type="button" onClick={() => d.navigateToSurface("current")} style={{ padding: "6px 14px", borderRadius: "8px", background: "#059669", color: "#fff", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", whiteSpace: "nowrap" as const }}>{ko ? "15단계로 →" : "Stage 15 →"}</button>
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
            <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 640, color: "#2563eb" }}>{ko ? "TIPS · 정부 R&D · 정책자금 상세" : "TIPS, Gov R&D & Policy Funds"}</div>
                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", marginTop: "2px" }}>{ko ? "비지분 자금 경로 상세는 15단계에서 안내합니다" : "Non-dilutive funding details in Stage 15"}</div>
              </div>
              <button type="button" onClick={() => d.navigateToSurface("current")} style={{ padding: "6px 14px", borderRadius: "8px", background: "#2563eb", color: "#fff", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", whiteSpace: "nowrap" as const }}>{ko ? "15단계로 →" : "Stage 15 →"}</button>
            </div>
          </div>
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

        {/* ── 자금 조달 경로 선택 (저장됨) ── */}
        {(() => {
          const fundingPath = (guideSelections["funding-path"] as string | undefined) ?? null;
          const selectPath = (path: string) => {
            setGuideSelections((prev: Record<string, string>) => ({ ...prev, "funding-path": path }));
          };
          return (
        <div style={{ borderRadius: "20px", border: "1px solid rgba(217,119,6,0.08)", background: "linear-gradient(180deg, rgba(217,119,6,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
            {ko ? "나의 자금 조달 경로를 선택하세요" : "Choose your funding path"}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", marginBottom: "12px" }}>
            {ko ? "선택하면 자동 저장됩니다. 나중에 변경할 수 있어요." : "Auto-saved. You can change later."}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {(ko ? [
              { id: "bootstrap", label: "부트스트랩", desc: "고객 매출로 성장", color: "#059669" },
              { id: "govt-grant", label: "정부 지원금", desc: "TIPS/창업패키지", color: "#2563eb" },
              { id: "vc-investment", label: "VC 투자 유치", desc: "시리즈 A 목표", color: "#7c3aed" },
            ] : [
              { id: "bootstrap", label: "Bootstrap", desc: "Grow with revenue", color: "#059669" },
              { id: "govt-grant", label: "Gov Grant", desc: "TIPS/Packages", color: "#2563eb" },
              { id: "vc-investment", label: "VC Funding", desc: "Target Series A", color: "#7c3aed" },
            ]).map(opt => {
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
                ✓ {fundingPath === "bootstrap"
                  ? (ko ? "부트스트랩 선택됨 — 첫 유료 고객 확보에 집중하세요" : "Bootstrap selected — focus on first paying customers")
                  : fundingPath === "govt-grant"
                    ? (ko ? "정부 지원금 선택됨 — 아래 사업계획서로 TIPS/창업패키지에 신청하세요" : "Gov grant selected — apply to TIPS/packages with the plan below")
                    : (ko ? "VC 투자 선택됨 — 피치덱과 재무 모델 준비가 핵심입니다" : "VC funding selected — pitch deck and financial model are key")}
              </div>
            </div>
          )}
        </div>
          );
        })()}
      </div>

      {/* ── AI 사업계획서는 15단계(자금 조달 & 정책자금)로 이동 ── */}
      <div style={{
        marginBottom: "18px", borderRadius: "20px",
        border: "1px solid rgba(29,53,87,0.08)",
        background: "rgba(29,53,87,0.02)",
        padding: "18px 22px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{ko ? "AI 사업계획서 생성" : "AI Business Plan"}</span>
          </div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5 }}>
            {ko ? "PSST 사업계획서 생성은 \"자금 조달 & 정책자금\" 단계에서 이용할 수 있습니다" : "PSST business plan generation is available in the \"Funding & Policy\" stage"}
          </div>
        </div>
        <button type="button" onClick={() => d.navigateToSurface("current")} style={{ padding: "8px 16px", borderRadius: "10px", background: "var(--primary)", color: "#fff", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", whiteSpace: "nowrap" as const }}>{ko ? "15단계로 →" : "Stage 15 →"}</button>
      </div>
    </>
  );
}
