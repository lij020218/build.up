"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";

export function FundraisingReadinessStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";

  const {
    decisions, industryCategoryId, selectedIndustryId, startupType,
    selectedBusinessModelId, selectedBudget, savedFinanceSnapshot,
    guideSelections,
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
      const res = await fetch("/api/ai/business-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#059669", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "정부 보조금 · 무상 지원 (주요 프로그램)" : "Government Grants (Key Programs)"}</div>
            <div style={{ display: "grid", gap: "6px" }}>
              {(ko ? [
                { name: "예비창업패키지 2차", amount: "최대 1억원", detail: "사업자등록 전 예비 창업자 대상. 접수: ~11/30 수시", color: "#2563eb", url: "https://www.k-startup.go.kr" },
                { name: "TIPS 일반트랙", amount: "최대 8억원", detail: "운영사 선투자 → 정부 매칭. 접수: ~12/31 상시", color: "#7c3aed", url: "https://www.jointips.or.kr" },
              ] : [
                { name: "Pre-Startup 2nd Round", amount: "Up to ₩100M", detail: "Pre-entrepreneurs. Rolling until Nov 30", color: "#2563eb", url: "https://www.k-startup.go.kr" },
                { name: "TIPS General", amount: "Up to ₩800M", detail: "Operator invest first → gov match. Rolling until Dec 31", color: "#7c3aed", url: "https://www.jointips.or.kr" },
              ]).map(p => progCard(p))}
            </div>
            <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(15,23,42,0.02)", marginTop: "8px", fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5 }}>
              {ko ? "AI 바우처, 청년창업사관학교, 각종 경진대회 등 전체 지원사업 목록은 \"벤처인증 · 정부 지원사업\" 단계에서 상세히 안내합니다." : "Full list of programs (AI Voucher, Youth Academy, competitions) is covered in the Venture Certification stage."}
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
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "정부 투자 프로그램 (지분 희석 없음)" : "Government Investment (No Dilution)"}</div>
            <div style={{ display: "grid", gap: "6px" }}>
              {(ko ? [
                { name: "TIPS", amount: "최대 5억원", detail: "R&D 3억 + 운영 2억. 50+ 운영사가 먼저 선발 후 정부 매칭. 기술 스타트업 필수", color: "#059669", url: "https://www.k-startup.go.kr" },
                { name: "TIPS-R (후속 지원)", amount: "최대 8억원", detail: "TIPS 졸업 기업 대상 후속 지원. 스케일업 단계 R&D 자금", color: "#059669", url: "https://www.k-startup.go.kr" },
              ] : [
                { name: "TIPS", amount: "Up to ₩500M", detail: "R&D 300M + Ops 200M. 50+ operators select first, gov matches. Must for tech startups", color: "#059669", url: "https://www.k-startup.go.kr" },
                { name: "TIPS-R (Follow-up)", amount: "Up to ₩800M", detail: "For TIPS graduates. Scale-up R&D funding", color: "#059669", url: "https://www.k-startup.go.kr" },
              ]).map(p => progCard(p))}
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
      </div>

      {/* ── Block 2: 사업계획서 생성 ── */}
      <div style={{
        marginBottom: "18px", borderRadius: "24px",
        border: "1px solid rgba(29,53,87,0.12)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(29,53,87,0.03) 100%)",
        boxShadow: "0 8px 20px rgba(17,17,17,0.04)", overflow: "hidden",
      }}>
        <div style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, var(--primary), rgba(117,163,255,0.9))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                {ko ? "AI 사업계획서 생성" : "AI Business Plan"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                {ko ? "PSST 프레임워크 · 정부 지원사업 신청용" : "PSST Framework · For government program applications"}
              </div>
            </div>
          </div>

          {!bpSections && !bpLoading && !bpError && (
            <>
              <div style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--muted)", marginBottom: "14px" }}>
                {ko
                  ? "지금까지 입력한 문제 정의, 팀 구성, 재무 데이터를 기반으로 예비창업패키지·초기창업패키지·TIPS 평가 기준에 맞는 사업계획서를 자동 생성합니다."
                  : "Auto-generates a PSST business plan using your roadmap data, optimized for K-Startup program evaluation criteria."}
              </div>
              <button type="button" onClick={generatePlanFR} style={{
                width: "100%", padding: "14px", borderRadius: "999px",
                border: "none", background: "var(--primary)", color: "#fff",
                fontSize: "15px", fontWeight: 600, cursor: "pointer",
              }}>
                {ko ? "사업계획서 생성하기" : "Generate Business Plan"}
              </button>
            </>
          )}

          {bpLoading && (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)", fontSize: "14px" }}>
              {ko ? "AI가 PSST 사업계획서를 작성 중입니다... (30초~1분)" : "AI is writing your PSST plan... (30s-1min)"}
            </div>
          )}

          {bpError && (
            <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.12)", marginTop: "10px" }}>
              <div style={{ fontSize: "13px", color: "#ff3b30", fontWeight: 600, marginBottom: "4px" }}>{ko ? "생성 실패" : "Failed"}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>{bpError}</div>
              <button type="button" onClick={generatePlanFR} style={{ marginTop: "8px", padding: "8px 16px", borderRadius: "999px", border: "1px solid var(--border)", background: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                {ko ? "다시 시도" : "Retry"}
              </button>
            </div>
          )}

          {bpSections && (
            <div style={{ marginTop: "10px" }}>
              {bpSummary && <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--primary)", marginBottom: "12px", lineHeight: 1.5 }}>{bpSummary}</div>}
              <div style={{ display: "grid", gap: "6px" }}>
                {bpSections.map((sec, idx) => {
                  const expanded = bpExpandedIdx === idx;
                  return (
                    <div key={idx} style={{ borderRadius: "14px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.7)", overflow: "hidden" }}>
                      <button type="button" onClick={() => setBpExpandedIdx(expanded ? null : idx)} style={{ width: "100%", padding: "12px 16px", border: "none", background: "transparent", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600 }}>{sec.title}</span>
                        <span style={{ fontSize: "12px", color: "var(--muted)", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
                      </button>
                      {expanded && <div style={{ padding: "0 16px 14px", fontSize: "13px", lineHeight: 1.7, color: "var(--muted)", whiteSpace: "pre-line" }}>{sec.content}</div>}
                    </div>
                  );
                })}
              </div>
              <button type="button" onClick={() => { const full = bpSections.map(s => `${s.title}\n\n${s.content}`).join("\n\n---\n\n"); navigator.clipboard.writeText(full).catch(() => {}); }} style={{ marginTop: "12px", width: "100%", padding: "12px", borderRadius: "999px", border: "1px solid var(--primary)", background: "rgba(29,53,87,0.04)", color: "var(--primary)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                {ko ? "전체 텍스트 복사하기" : "Copy Full Text"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
