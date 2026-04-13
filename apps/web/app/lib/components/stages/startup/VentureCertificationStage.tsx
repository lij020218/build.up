"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";

export function VentureCertificationStage() {
  const d = useDashboardCtx();
  const language = d.language;
  const ko = language === "ko";
  const { guideStepIndex, setGuideStepIndex, guideSelections, setGuideSelections } = d;
  const pg = guideStepIndex;
  const selectedVentureType = (guideSelections["venture-cert-type"] as string | undefined) ?? null;
  const selectVentureType = (type: string) => {
    setGuideSelections((prev: Record<string, string>) => ({ ...prev, "venture-cert-type": type }));
  };
  const totalPg = 4;
  const pgLabels = ko
    ? ["왜 중요한가", "1. 인증 유형", "2. 혜택 상세", "3. 정부 지원사업"]
    : ["Why", "1. Cert Types", "2. Benefits", "3. Gov Programs"];

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* 페이지 네비 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button type="button" disabled={pg === 0} onClick={() => setGuideStepIndex((p: number) => p - 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
          background: pg === 0 ? "rgba(0,0,0,0.02)" : "white", color: pg === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: pg === 0 ? "default" : "pointer",
        }}>{ko ? "← 이전" : "← Prev"}</button>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "center" }}>
          {pgLabels.map((l, i) => (
            <button key={i} type="button" onClick={() => setGuideStepIndex(i)} style={{
              padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: i === pg ? 700 : 500,
              background: i === pg ? "#1d3557" : "transparent", color: i === pg ? "#fff" : "rgba(15,23,42,0.4)",
              border: "none", cursor: "pointer",
            }}>{l}</button>
          ))}
        </div>
        <button type="button" disabled={pg === totalPg - 1} onClick={() => setGuideStepIndex((p: number) => p + 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
          background: pg === totalPg - 1 ? "rgba(0,0,0,0.02)" : "white", color: pg === totalPg - 1 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: pg === totalPg - 1 ? "default" : "pointer",
        }}>{ko ? "다음 →" : "Next →"}</button>
      </div>

      {/* PAGE 0 — WHY */}
      {pg === 0 && (
      <>
      <div style={{ borderRadius: "20px", border: "1px solid rgba(220,38,38,0.08)", background: "linear-gradient(180deg, rgba(220,38,38,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{ko ? "왜 이 단계가 중요한가" : "Why this matters"}</span>
        </div>
        <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
          {ko ? "벤처인증 하나로 수천만원의 세금과 기회를 절약합니다." : "One certification saves millions in tax and unlocks opportunities."}
        </div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.65 }}>
          {ko ? "벤처기업 인증을 받으면 법인세/소득세 50% 감면(5년), 취득세 75% 감면, 스톡옵션 비과세(연 2억), 정부 지원사업 우선 선발 등 핵심 혜택을 받습니다. 인증 없이 같은 비용을 직접 부담하면 초기 자본이 빠르게 소진됩니다. 정부 지원사업은 마감이 정해져 있어, 놓치면 1년을 기다려야 합니다." : "Venture certification gives you 50% tax reduction (5yr), 75% acquisition tax cut, tax-free stock options (₩200M/yr), and priority for government programs. Missing deadlines means waiting a full year."}
        </div>
      </div>
      <div style={{ display: "grid", gap: "6px" }}>
        {(ko ? [
          { num: 1, title: "인증 유형 확인", desc: "벤처투자 / 연구개발 / 혁신성장 — 우리 회사에 맞는 유형 선택", color: "#2563eb" },
          { num: 2, title: "혜택 상세", desc: "세금 감면, 스톡옵션, 투자자 소득공제 등 구체적 금액", color: "#059669" },
          { num: 3, title: "정부 지원사업 매칭", desc: "TIPS, 예비창업패키지, 초기창업패키지 등 신청 일정", color: "#7c3aed" },
        ] : [
          { num: 1, title: "Check Certification Type", desc: "Investment / R&D / Innovation Growth — find your fit", color: "#2563eb" },
          { num: 2, title: "Detailed Benefits", desc: "Tax cuts, stock options, investor deductions", color: "#059669" },
          { num: 3, title: "Government Program Match", desc: "TIPS, Pre-startup, Early-stage package deadlines", color: "#7c3aed" },
        ]).map(s => (
          <div key={s.num} onClick={() => setGuideStepIndex(s.num)} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px 14px", borderRadius: "12px", background: `${s.color}04`, border: `1px solid ${s.color}10`, cursor: "pointer" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: s.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 640, color: "#0f172a" }}>{s.title}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{s.desc}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><path d="M5 3l4 4-4 4" stroke="rgba(0,0,0,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        ))}
      </div>
      </>
      )}

      {/* PAGE 1 — 인증 유형 선택 */}
      {pg === 1 && (() => {
        const types = ko ? [
          { id: "investment", type: "벤처투자유형", who: "VC · 액셀러레이터 등 적격 투자기관에서 투자받은 기업", reqs: ["적격 투자기관에서 5,000만원 이상 투자 실적", "자본금 대비 투자 금액 10% 이상"], fast: "가장 빠름 — 투자 실적만 증명하면 됨", color: "#2563eb", timing: "처리: 약 20일", cost: "수수료 없음" },
          { id: "rnd", type: "연구개발유형", who: "기술 R&D에 집중하는 기업 (기업부설연구소 보유)", reqs: ["기업부설연구소 또는 연구개발전담부서 보유", "직전 4분기 R&D비 5,000만원 이상 + 매출의 5~10%", "사업성 평가 우수 판정"], fast: "연구소 필수 — 설립에 2~4주 소요", color: "#7c3aed", timing: "처리: 약 30~45일", cost: "연구소 설립비 50~100만원" },
          { id: "innovation", type: "혁신성장유형", who: "기술성 + 사업성 모두 우수한 고성장 기업", reqs: ["기술성 평가 우수 (기술보증기금 등)", "사업성 평가 우수"], fast: "가장 범용적 — 연구소 없어도 가능", color: "#059669", timing: "처리: 약 30~45일", cost: "수수료 없음" },
        ] : [
          { id: "investment", type: "Investment Type", who: "Companies funded by qualified investors (VC, accelerator)", reqs: ["₩50M+ investment from qualified institutions", "Investment ≥ 10% of capital"], fast: "Fastest — just prove investment", color: "#2563eb", timing: "~20 days", cost: "Free" },
          { id: "rnd", type: "R&D Type", who: "Tech companies with R&D labs", reqs: ["Own R&D lab or department", "Last 4Q R&D spend ₩50M+ and 5-10% of revenue", "Business viability assessment pass"], fast: "Lab required — 2-4wk to set up", color: "#7c3aed", timing: "~30-45 days", cost: "Lab setup ₩500K-1M" },
          { id: "innovation", type: "Innovation Growth", who: "High-growth companies with tech + business excellence", reqs: ["Technology assessment pass (KIBO etc.)", "Business viability assessment pass"], fast: "Most versatile — no lab needed", color: "#059669", timing: "~30-45 days", cost: "Free" },
        ];
        return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", marginBottom: "2px" }}>
          {ko ? "우리 회사에 맞는 인증 유형을 선택하세요. 선택 결과는 자동 저장됩니다." : "Choose the certification type that fits your company. Selection is auto-saved."}
        </div>
        {types.map(t => {
          const selected = selectedVentureType === t.id;
          return (
          <button key={t.id} type="button" onClick={() => selectVentureType(t.id)} style={{
            borderRadius: "16px",
            border: selected ? `2px solid ${t.color}` : `1px solid ${t.color}15`,
            background: selected ? `${t.color}08` : `${t.color}02`,
            overflow: "hidden", cursor: "pointer", textAlign: "left" as const,
            transition: "all 0.2s ease",
          }}>
            <div style={{ padding: "16px 18px 10px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                border: selected ? `6px solid ${t.color}` : "2px solid rgba(0,0,0,0.15)",
                transition: "all 0.2s ease",
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: selected ? t.color : "#0f172a", marginBottom: "4px" }}>{t.type}</div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5 }}>{t.who}</div>
              </div>
            </div>
            <div style={{ padding: "0 18px 12px", display: "grid", gap: "3px" }}>
              {t.reqs.map(r => (
                <div key={r} style={{ display: "flex", gap: "6px", alignItems: "flex-start", fontSize: "12px", color: "rgba(15,23,42,0.65)", lineHeight: 1.45 }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: t.color, flexShrink: 0, marginTop: "5px" }} />
                  <span>{r}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "8px 18px 14px", background: `${t.color}05`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: t.color }}>{t.fast}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: `${t.color}10`, color: t.color }}>{t.timing}</span>
                <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: "rgba(0,0,0,0.04)", color: "rgba(15,23,42,0.5)" }}>{t.cost}</span>
              </div>
            </div>
          </button>
          );
        })}

        {selectedVentureType && (
        <div style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(5,150,105,0.04)", border: "1px solid rgba(5,150,105,0.1)" }}>
          <div style={{ fontSize: "12px", fontWeight: 640, color: "#059669" }}>
            ✓ {ko
              ? `${types.find(t => t.id === selectedVentureType)?.type} 선택됨 — 아래 링크에서 신청하세요`
              : `${types.find(t => t.id === selectedVentureType)?.type} selected — apply via the link below`}
          </div>
        </div>
        )}

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
          <a href="https://smes.go.kr/venturein" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 14px", borderRadius: "8px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.1)", fontSize: "12px", fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>
            {ko ? "벤처확인 신청 바로가기" : "Apply for Venture Cert"} ↗
          </a>
          <a href="https://www.kibo.or.kr" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 14px", borderRadius: "8px", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)", fontSize: "12px", fontWeight: 600, color: "rgba(15,23,42,0.5)", textDecoration: "none" }}>
            {ko ? "기술보증기금" : "KIBO"} ↗
          </a>
        </div>

        <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(15,23,42,0.02)", fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5 }}>
          {ko ? "유효기간: 3년 (재인증 필요). 인증 후 세금 감면은 최초 소득 발생 과세연도부터 5년간 적용됩니다." : "Valid: 3 years (renewal required). Tax benefits apply for 5 years from first taxable income."}
        </div>
      </div>
        );
      })()}

      {/* PAGE 2 — 혜택 상세 */}
      {pg === 2 && (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {(ko ? [
          { title: "법인세 · 소득세 50% 감면", detail: "벤처 인증 후 최초 소득 발생 과세연도부터 5년간 50% 감면. 창업 3년 이내 인증 시 적용.", tag: "5년간", color: "#2563eb" },
          { title: "취득세 75% 감면", detail: "인증일로부터 4년 이내 사업용 부동산 취득 시 적용. 청년 창업 벤처는 5년.", tag: "부동산", color: "#059669" },
          { title: "재산세 면제 → 50% 경감", detail: "사업용 부동산: 인증 후 3년간 면제, 이후 2년간 50% 경감.", tag: "5년간", color: "#059669" },
          { title: "스톡옵션 비과세 연 2억원", detail: "2023년 이후 행사분: 연 2억원, 기업당 누적 5억원까지 비과세. 행사이익 5년 분할 납부 또는 양도 시 일괄 납부 선택 가능.", tag: "핵심", color: "#dc2626" },
          { title: "개인투자자 소득공제", detail: "벤처 직접 투자 시: 3,000만원 이하 100%, 3,000~5,000만원 70%, 5,000만원 초과 30% 소득공제. 투자 유치에 강력한 인센티브.", tag: "투자 유치", color: "#7c3aed" },
          { title: "병역특례 · 정책자금 우대", detail: "병역 지정업체 신청 자격, 정책자금 우대 금리, 기술신용보증 우대.", tag: "추가", color: "#d97706" },
        ] : [
          { title: "50% Corporate/Income Tax Cut", detail: "5 years from first taxable income after certification. Must certify within 3yr of founding.", tag: "5 years", color: "#2563eb" },
          { title: "75% Acquisition Tax Cut", detail: "Business real estate acquired within 4yr of certification. 5yr for youth founders.", tag: "Real estate", color: "#059669" },
          { title: "Property Tax Exemption → 50%", detail: "Business property: 3yr exempt, then 2yr at 50% reduction.", tag: "5 years", color: "#059669" },
          { title: "Stock Option Tax-Free ₩200M/yr", detail: "Post-2023: ₩200M/yr, ₩500M cumulative per company. 5yr installment or defer to disposal.", tag: "Key", color: "#dc2626" },
          { title: "Investor Tax Deduction", detail: "Direct investment: 100% for ≤₩30M, 70% for ₩30-50M, 30% for >₩50M income deduction.", tag: "Fundraising", color: "#7c3aed" },
          { title: "Military Exemption + Policy Funds", detail: "Military service designation eligibility, preferred rates on policy funds.", tag: "Extra", color: "#d97706" },
        ]).map(b => (
          <div key={b.title} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "12px 14px", borderRadius: "12px", border: `1px solid ${b.color}10`, background: `${b.color}02` }}>
            <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: `${b.color}10`, color: b.color, whiteSpace: "nowrap" as const, flexShrink: 0, marginTop: "2px" }}>{b.tag}</span>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a", marginBottom: "2px" }}>{b.title}</div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.45 }}>{b.detail}</div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* PAGE 3 — 정부 지원사업 */}
      {pg === 3 && (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{ko ? "R&D 지원 (TIPS)" : "R&D Support (TIPS)"}</div>
        <div style={{ display: "grid", gap: "6px" }}>
          {(ko ? [
            { name: "TIPS 일반트랙", amount: "최대 8억원", detail: "R&D 24개월. 149개 운영사가 1~2억 선투자 → 정부 매칭. 2026 접수: 1/26~12/31 상시", color: "#059669", url: "https://www.jointips.or.kr" },
            { name: "TIPS 딥테크트랙", amount: "최대 15억원", detail: "딥테크 36개월. 12대 신산업분야. 운영사 3억+ 선투자. 2026 접수: 1/26~12/31 상시", color: "#2563eb", url: "https://www.jointips.or.kr" },
            { name: "TIPS 비R&D 연계", amount: "최대 3억원", detail: "사업화 1.5억 + 해외마케팅 1.5억. TIPS 선정 기업 대상. 총 650억원 규모", color: "#7c3aed", url: "https://www.jointips.or.kr" },
          ] : [
            { name: "TIPS General", amount: "Up to ₩800M", detail: "R&D 24mo. 149 operators invest ₩100-200M first → gov match. 2026: Jan 26–Dec 31 rolling", color: "#059669", url: "https://www.jointips.or.kr" },
            { name: "TIPS Deep Tech", amount: "Up to ₩1.5B", detail: "Deep tech 36mo. 12 industries. Operator invests ₩300M+. 2026: Jan 26–Dec 31 rolling", color: "#2563eb", url: "https://www.jointips.or.kr" },
            { name: "TIPS Non-R&D", amount: "Up to ₩300M", detail: "Commercialization ₩150M + global marketing ₩150M. For TIPS alumni. ₩65B total", color: "#7c3aed", url: "https://www.jointips.or.kr" },
          ]).map(p => progCard(p))}
        </div>

        <div style={{ fontSize: "12px", fontWeight: 700, color: "#d97706", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginTop: "4px" }}>{ko ? "사업화 지원 패키지" : "Commercialization Packages"}</div>
        <div style={{ display: "grid", gap: "6px" }}>
          {(ko ? [
            { name: "예비창업패키지 2차", amount: "최대 1억원", detail: "사업자등록 전 예비 창업자. 사업화 자금+멘토링. 접수: ~11/30까지 수시", color: "#2563eb", url: "https://www.k-startup.go.kr" },
            { name: "AI 바우처", amount: "최대 3억원", detail: "AI 솔루션 도입 비용 70~90% 정부 지원. 2026 수시 모집 (nipa.kr 확인)", color: "#d97706", url: "https://www.nipa.kr" },
            { name: "데이터바우처", amount: "최대 5천만원", detail: "데이터 구매·가공 비용 지원. 수요기업 수시 모집 (kdata.or.kr)", color: "#7c3aed", url: "https://www.kdata.or.kr" },
            { name: "창업중심대학", amount: "최대 1억원", detail: "대학 소속 (예비)창업자. 사업화 자금+공간+멘토링. 대학별 수시 모집", color: "#059669", url: "https://www.k-startup.go.kr" },
          ] : [
            { name: "Pre-Startup 2nd Round", amount: "Up to ₩100M", detail: "Pre-entrepreneurs. Rolling until Nov 30", color: "#2563eb", url: "https://www.k-startup.go.kr" },
            { name: "AI Voucher", amount: "Up to ₩300M", detail: "70-90% AI cost covered. 2026 rolling (nipa.kr)", color: "#d97706", url: "https://www.nipa.kr" },
            { name: "Data Voucher", amount: "Up to ₩50M", detail: "Data purchase/processing. Rolling recruitment", color: "#7c3aed", url: "https://www.kdata.or.kr" },
            { name: "Startup University", amount: "Up to ₩100M", detail: "University-based founders. Rolling by university", color: "#059669", url: "https://www.k-startup.go.kr" },
          ]).map(p => progCard(p))}
        </div>

        <div style={{ fontSize: "12px", fontWeight: 700, color: "#dc2626", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginTop: "4px" }}>{ko ? "창업 경진대회" : "Startup Competitions"}</div>
        <div style={{ display: "grid", gap: "6px" }}>
          {(ko ? [
            { name: "도전! K-스타트업 2026", amount: "최대 1억원", detail: "국내 최대 규모 경진대회. 예선→본선→왕중왕전. 하반기 접수 예정 (challengek.org)", color: "#2563eb", url: "https://www.challengek.org" },
            { name: "K-Startup 그랜드챌린지", amount: "상금+비자", detail: "글로벌 스타트업 대상. 한국 시장 진출 지원. 하반기 모집 (연 1회)", color: "#dc2626", url: "https://www.k-startup.go.kr" },
            { name: "소셜벤처 경연대회", amount: "최대 5천만원", detail: "사회적 가치+비즈니스 모델. 2026 하반기 예정 (sv-hub.co.kr)", color: "#059669", url: "https://www.sv-hub.co.kr" },
          ] : [
            { name: "Challenge! K-Startup 2026", amount: "Up to ₩100M", detail: "Korea's largest competition. Applications open H2 (challengek.org)", color: "#2563eb", url: "https://www.challengek.org" },
            { name: "K-Startup Grand Challenge", amount: "Prize+visa", detail: "Global startups. Korea entry. H2 recruitment (yearly)", color: "#dc2626", url: "https://www.k-startup.go.kr" },
            { name: "Social Venture Contest", amount: "Up to ₩50M", detail: "Social impact. H2 2026 expected (sv-hub.co.kr)", color: "#059669", url: "https://www.sv-hub.co.kr" },
          ]).map(p => progCard(p))}
        </div>
      </div>
      )}
    </div>
  );
}
