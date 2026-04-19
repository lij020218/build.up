"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";

export function GrowthEngineStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const pg = d.guideStepIndex;
  const totalPg = 4;
  const decisions = d.decisions;
  const pgLabels = ko
    ? ["왜 중요한가", "1. 북극성 지표", "2. 주간 리뷰", "3. 리텐션"]
    : ["Why", "1. North Star", "2. Weekly Review", "3. Retention"];

  // 북극성 지표 state
  const nsDec = (decisions["growth-engine"] as Record<string, unknown> | undefined);
  const nsInputs = (nsDec?.inputs as Record<string, unknown>) ?? {};
  const nsType = (nsInputs.northStarType as string) ?? "";
  const nsName = (nsInputs.northStarMetricName as string) ?? "";
  const chooseNs = (val: string) => {
    d.setDecisions((prev: Record<string, unknown>) => ({
      ...prev,
      "growth-engine": {
        ...(prev["growth-engine"] as Record<string, unknown> ?? {}),
        stageId: "growth-engine",
        inputs: { ...((prev["growth-engine"] as Record<string, unknown>)?.inputs as Record<string, unknown> ?? {}), northStarType: val },
      }
    }));
  };
  const setNsName = (val: string) => {
    d.setDecisions((prev: Record<string, unknown>) => ({
      ...prev,
      "growth-engine": {
        ...(prev["growth-engine"] as Record<string, unknown> ?? {}),
        stageId: "growth-engine",
        inputs: { ...((prev["growth-engine"] as Record<string, unknown>)?.inputs as Record<string, unknown> ?? {}), northStarMetricName: val },
      }
    }));
  };
  const nsOptions = ko ? [
    { id: "saas", type: "SaaS", metric: "주간 활성 사용자(WAU) 또는 MRR", ex: "Slack: 주간 메시지 발송 팀 수" },
    { id: "marketplace", type: "마켓플레이스", metric: "주간 거래 완료 수(GMV)", ex: "당근: 주간 거래 성사 건수" },
    { id: "content", type: "콘텐츠", metric: "주간 소비 시간 또는 DAU", ex: "YouTube: 주간 시청 시간" },
    { id: "commerce", type: "커머스", metric: "월간 반복 구매 고객 수", ex: "마켓컬리: 월 2회 이상 주문 고객" },
  ] : [
    { id: "saas", type: "SaaS", metric: "WAU or MRR", ex: "Slack: weekly messaging teams" },
    { id: "marketplace", type: "Marketplace", metric: "Weekly completed transactions", ex: "Karrot: weekly deals" },
    { id: "content", type: "Content", metric: "Weekly consumption time or DAU", ex: "YouTube: watch time" },
    { id: "commerce", type: "Commerce", metric: "Monthly repeat buyers", ex: "Kurly: 2+ orders/month" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* 페이지 네비 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button type="button" disabled={pg === 0} onClick={() => d.setGuideStepIndex((p: number) => p - 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
          background: pg === 0 ? "rgba(0,0,0,0.02)" : "white", color: pg === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: pg === 0 ? "default" : "pointer",
        }}>{ko ? "← 이전" : "← Prev"}</button>
        <div style={{ display: "flex", gap: "4px" }}>
          {pgLabels.map((l, i) => (
            <button key={i} type="button" onClick={() => d.setGuideStepIndex(i)} style={{
              padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: i === pg ? 700 : 500,
              background: i === pg ? "#1d3557" : "transparent", color: i === pg ? "#fff" : "rgba(15,23,42,0.4)",
              border: "none", cursor: "pointer",
            }}>{l}</button>
          ))}
        </div>
        <button type="button" disabled={pg === totalPg - 1} onClick={() => d.setGuideStepIndex((p: number) => p + 1)} style={{
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
          {ko ? "리텐션 없는 성장은 밑 빠진 독에 물 붓기입니다." : "Growth without retention is filling a leaky bucket."}
        </div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.65 }}>
          {ko ? "MVP를 출시했고 초기 사용자가 생겼다면, 이제 \"이 사람들이 돌아오는가?\"를 증명해야 합니다. 주간 성장률을 체계적으로 추적하고, 가장 큰 레버를 매주 실험해야 합니다." : "If you've launched an MVP and have initial users, now prove they come back. Track weekly growth systematically and experiment on the biggest lever each week."}
        </div>
      </div>
      <div style={{ display: "grid", gap: "6px" }}>
        {(ko ? [
          { num: 1, title: "북극성 지표 선택", desc: "회사 전체가 추적하는 하나의 핵심 숫자 확정", color: "#059669" },
          { num: 2, title: "주간 성장 리뷰", desc: "매주 월요일 30분, 지표 확인 + 실험 1개 선택", color: "#2563eb" },
          { num: 3, title: "리텐션 체크", desc: "사용자가 돌아오는지 먼저 확인 → 그 다음 성장", color: "#7c3aed" },
        ] : [
          { num: 1, title: "Choose North Star Metric", desc: "The single number the whole company tracks", color: "#059669" },
          { num: 2, title: "Weekly Growth Review", desc: "30 min every Monday: metrics + 1 experiment", color: "#2563eb" },
          { num: 3, title: "Retention Check", desc: "Prove users come back before pushing growth", color: "#7c3aed" },
        ]).map(s => (
          <div key={s.num} onClick={() => d.setGuideStepIndex(s.num)} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px 14px", borderRadius: "12px", background: `${s.color}04`, border: `1px solid ${s.color}10`, cursor: "pointer" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: s.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 640, color: "#0f172a" }}>{s.title}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{s.desc}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><path d="M5 3l4 4-4 4" stroke="rgba(0,0,0,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        ))}
      </div>
      {/* 이 단계의 경영 기법 */}
      <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.06)" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "이 단계에서 적용되는 경영 기법" : "Frameworks applied"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {(ko ? [
            { name: "PMF 테스트", desc: "\"이 제품을 못 쓰면?\" — 40%+가 '매우 실망'이면 PMF 달성. 미달이면 최고 만족 세그먼트에 집중.", color: "#dc2626" },
            { name: "AARRR", desc: "Acquisition→Activation→Retention→Revenue→Referral. 가장 나쁜 단계를 먼저 고쳐라.", color: "#2563eb" },
            { name: "Unit Economics", desc: "CAC(획득비) vs LTV(생애가치). 비율 3:1 이상, 회수 12개월 이하가 건강한 사업.", color: "#059669" },
            { name: "OKR", desc: "분기 목표 3개 + 측정 가능한 핵심 결과. 숫자 없는 목표는 목표가 아님.", color: "#7c3aed" },
          ] : [
            { name: "PMF Test", desc: "\"How'd you feel if you couldn't use this?\" — 40%+ 'very disappointed' = PMF.", color: "#dc2626" },
            { name: "AARRR", desc: "Acquisition→Activation→Retention→Revenue→Referral. Fix the worst stage first.", color: "#2563eb" },
            { name: "Unit Economics", desc: "CAC vs LTV. Ratio 3:1+, payback under 12 months = healthy business.", color: "#059669" },
            { name: "OKR", desc: "3 quarterly objectives + measurable key results. No numbers = no goal.", color: "#7c3aed" },
          ]).map(f => (
            <div key={f.name} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: `${f.color}10`, color: f.color, whiteSpace: "nowrap" as const, flexShrink: 0, marginTop: "1px" }}>{f.name}</span>
              <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.45 }}>{f.desc}</span>
            </div>
          ))}
        </div>
      </div>
      </>
      )}

      {/* PAGE 1 — 북극성 지표 선택 */}
      {pg === 1 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>1</div>
            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "북극성 지표를 하나 선택하세요" : "Choose one North Star Metric"}</span>
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "6px" }}>
            {ko ? "회사 전체가 추적하는 하나의 핵심 숫자. 이 숫자가 올라가면 사업이 건강한 것입니다." : "The single number the whole company tracks. If it goes up, the business is healthy."}
          </div>
        </div>
        <div style={{ padding: "0 22px 16px", display: "grid", gap: "6px" }}>
          {nsOptions.map(s => {
            const sel = nsType === s.id;
            return (
            <button key={s.id} type="button" onClick={() => chooseNs(s.id)} style={{
              display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px 14px", borderRadius: "12px",
              background: sel ? "rgba(5,150,105,0.08)" : "rgba(5,150,105,0.02)",
              border: sel ? "2px solid #059669" : "1px solid rgba(5,150,105,0.06)",
              boxShadow: sel ? "0 0 0 3px rgba(5,150,105,0.08)" : "none",
              cursor: "pointer", textAlign: "left" as const, transition: "all 0.2s ease", width: "100%",
            }}>
              <span style={{ fontSize: "11px", fontWeight: 650, padding: "2px 8px", borderRadius: "6px", background: sel ? "rgba(5,150,105,0.15)" : "rgba(5,150,105,0.08)", color: "#059669", whiteSpace: "nowrap" as const, flexShrink: 0 }}>{s.type}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{s.metric}</div>
                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)" }}>{s.ex}</div>
              </div>
              {sel && <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", background: "#059669", padding: "2px 6px", borderRadius: "4px", flexShrink: 0, marginTop: "2px" }}>✓</span>}
            </button>
            );
          })}
        </div>
        <div style={{ padding: "0 22px 18px" }}>
          <div style={{ padding: "16px 18px", borderRadius: "14px", background: "rgba(255,255,255,0.95)", border: "1.5px solid rgba(5,150,105,0.12)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#059669", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
              {ko ? "나의 북극성 지표" : "MY NORTH STAR METRIC"}
            </div>
            <input
              type="text"
              placeholder={ko
                ? (nsType === "saas" ? "예: 주간 활성 사용자(WAU)" : nsType === "marketplace" ? "예: 주간 거래 완료 수" : nsType === "content" ? "예: 주간 시청 시간" : nsType === "commerce" ? "예: 월 2회 이상 구매 고객 수" : "위에서 유형을 먼저 선택하세요")
                : (nsType ? `e.g., ${nsOptions.find(o => o.id === nsType)?.metric ?? "Your metric"}` : "Select a type above first")}
              value={nsName}
              onChange={(e) => setNsName(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: "10px",
                border: "1px solid rgba(5,150,105,0.12)", background: "rgba(248,250,252,0.8)",
                fontSize: "14px", outline: "none", color: "#0f172a",
                fontFamily: "inherit",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#059669"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(5,150,105,0.12)"; }}
            />
            <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)", marginTop: "6px" }}>
              {ko ? "자동 저장됩니다. 이 지표가 운영 대시보드에 표시됩니다." : "Auto-saved. This metric will appear on your dashboard."}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* PAGE 2 — 주간 성장 리뷰 */}
      {pg === 2 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>2</div>
            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "매주 월요일, 30분 성장 리뷰를 하세요" : "Run a 30-min growth review every Monday"}</span>
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "4px" }}>
            {ko ? "YC가 가장 강조하는 습관입니다. 주간 5-7% 성장이 목표." : "The habit YC emphasizes most. Target: 5-7% weekly growth."}
          </div>
        </div>
        <div style={{ padding: "0 22px 14px" }}>
          {(ko ? [
            { step: "1", title: "지난주 핵심 지표 확인", detail: "북극성 지표 + 매출 + 신규 가입 + 이탈률" },
            { step: "2", title: "WoW 성장률 계산", detail: "3주 연속 0% = 위험 신호. 즉시 원인 진단" },
            { step: "3", title: "이번 주 가장 큰 레버 1개 선택", detail: "성장에 가장 영향을 줄 수 있는 실험 1개만 집중" },
            { step: "4", title: "실험 결과 기록", detail: "가설 → 실행 → 결과 → 배운 점. 기록 없으면 반복 불가" },
          ] : [
            { step: "1", title: "Check last week's metrics", detail: "NSM + revenue + signups + churn" },
            { step: "2", title: "Calculate WoW growth", detail: "3 weeks at 0% = danger. Diagnose immediately" },
            { step: "3", title: "Pick ONE biggest lever", detail: "Focus on one experiment that most impacts growth" },
            { step: "4", title: "Record experiment results", detail: "Hypothesis → Action → Result → Learning" },
          ]).map(s => (
            <div key={s.step} style={{ display: "flex", gap: "10px", padding: "8px 0", borderBottom: s.step !== "4" ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{s.title}</div>
                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)" }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ margin: "0 22px 16px", padding: "14px 16px", borderRadius: "14px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.08)" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.04em", marginBottom: "6px" }}>{ko ? "AI 활용법 — 주간 리뷰 분석" : "AI — Weekly review analysis"}</div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, padding: "8px 12px", borderRadius: "8px", background: "rgba(37,99,235,0.03)", fontStyle: "italic" }}>
            {ko ? "\"이번 주 지표: WAU 1,200(+3%), 신규가입 180(+8%), D7 리텐션 18%, 이탈률 12%. 지난 4주 데이터: [붙여넣기]. 1) 가장 우려되는 지표와 원인 가설 3개, 2) 이번 주 집중할 실험 우선순위 3개를 추천해줘.\"" : "\"This week: WAU 1,200(+3%), signups 180(+8%), D7 retention 18%, churn 12%. Last 4 weeks: [paste]. 1) Most concerning metric + 3 hypotheses, 2) Top 3 experiment priorities for this week.\""}
          </div>
        </div>
      </div>
      )}

      {/* PAGE 3 — 리텐션 벤치마크 */}
      {pg === 3 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)", background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>3</div>
            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "리텐션이 먼저입니다" : "Retention comes first"}</span>
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "4px" }}>
            {ko ? "리텐션 없이 광고비를 쓰면 돈만 태웁니다. 먼저 사용자가 돌아오는지 확인하세요." : "Spending on ads without retention burns money. First prove users come back."}
          </div>
        </div>
        <div style={{ padding: "0 22px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
          {(ko ? [
            { period: "D1", good: "40%+", desc: "첫날 재방문" },
            { period: "D7", good: "20%+", desc: "첫주 유지" },
            { period: "D30", good: "10%+", desc: "첫달 유지" },
          ] : [
            { period: "D1", good: "40%+", desc: "Day 1 return" },
            { period: "D7", good: "20%+", desc: "Week 1" },
            { period: "D30", good: "10%+", desc: "Month 1" },
          ]).map(r => (
            <div key={r.period} style={{ padding: "12px", borderRadius: "12px", background: "rgba(124,58,237,0.03)", textAlign: "center" as const }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const }}>{r.period}</div>
              <div style={{ fontSize: "18px", fontWeight: 740, color: "#7c3aed" }}>{r.good}</div>
              <div style={{ fontSize: "10px", color: "rgba(0,0,0,0.35)" }}>{r.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "0 22px 16px", fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.55 }}>
          {ko ? "B2B SaaS는 D30 40%+, B2C 앱은 D30 15%+가 양호. 이 기준에 못 미치면 성장보다 제품 개선에 집중하세요." : "B2B SaaS needs D30 40%+, B2C app D30 15%+. Below this, focus on product improvement, not growth."}
        </div>
      </div>
      )}
    </div>
  );
}
