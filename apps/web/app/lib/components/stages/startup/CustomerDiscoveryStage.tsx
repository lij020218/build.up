"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { supabase } from "../../../../../lib/supabase";

export function CustomerDiscoveryStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const pg = d.guideStepIndex;
  const totalPg = 4;
  const guideSelections = d.guideSelections;
  const decisions = d.decisions;
  const setGuideStepIndex = d.setGuideStepIndex;

  const pgLabels = ko
    ? ["왜 중요한가", "1. 인터뷰 준비", "2. 인터뷰 실행", "3. AI 분석"]
    : ["Why", "1. Prepare", "2. Execute", "3. Analyze"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* 페이지 네비 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button type="button" disabled={pg === 0} onClick={() => setGuideStepIndex(p => p - 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
          background: pg === 0 ? "rgba(0,0,0,0.02)" : "white", color: pg === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: pg === 0 ? "default" : "pointer",
        }}>{ko ? "← 이전" : "← Prev"}</button>
        <div style={{ display: "flex", gap: "4px" }}>
          {pgLabels.map((l, i) => (
            <button key={i} type="button" onClick={() => setGuideStepIndex(i)} style={{
              padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: i === pg ? 700 : 500,
              background: i === pg ? "#1d3557" : "transparent", color: i === pg ? "#fff" : "rgba(15,23,42,0.4)",
              border: "none", cursor: "pointer",
            }}>{l}</button>
          ))}
        </div>
        <button type="button" disabled={pg === totalPg - 1} onClick={() => setGuideStepIndex(p => p + 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
          background: pg === totalPg - 1 ? "rgba(0,0,0,0.02)" : "white", color: pg === totalPg - 1 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: pg === totalPg - 1 ? "default" : "pointer",
        }}>{ko ? "다음 →" : "Next →"}</button>
      </div>

      {pg === 0 && (
      <>
      {/* WHY — 왜 이 단계가 중요한가 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(220,38,38,0.08)", background: "linear-gradient(180deg, rgba(220,38,38,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{ko ? "왜 이게 첫 번째인가" : "Why this comes first"}</span>
        </div>
        <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
          {ko ? "스타트업의 42%는 \"시장이 필요로 하지 않는 제품\"을 만들어 실패합니다." : "42% of startups fail by building a product nobody needs."}
        </div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.65 }}>
          {ko ? "코드를 한 줄도 쓰기 전에, 실제 사람과 대화해서 \"이 문제가 정말 돈이나 시간을 쓸 만큼 고통스러운지\" 확인해야 합니다. 이 과정을 건너뛰면 6개월 후 아무도 쓰지 않는 제품이 됩니다." : "Before writing a single line of code, talk to real people to confirm the pain is real enough to pay for. Skip this and you'll have a product nobody uses in 6 months."}
        </div>
      </div>
      {/* 이 단계의 경영 기법 — customer_discovery는 스타트업 전용 단계이므로 항상 표시 */}
      <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.06)" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "이 단계에서 적용되는 경영 기법" : "Frameworks applied"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {(ko ? [
            { name: "Mom Test", desc: "의견이 아닌 과거 행동을 물어라. \"좋아요\"는 데이터가 아니다. 커밋먼트(시간·돈·소개)를 요청하라.", color: "#2563eb" },
            { name: "JTBD", desc: "고객이 제품을 '고용'하는 이유를 찾아라. 기능이 아니라 해결하려는 '일(Job)'에 집중.", color: "#7c3aed" },
            { name: "Lean Startup", desc: "가설 → 최소 실험 → 측정 → 학습. 2주 이내 사이클. 감이 아닌 데이터로 결정.", color: "#059669" },
          ] : [
            { name: "Mom Test", desc: "Ask about past behavior, not opinions. Request commitments (time/money/intro).", color: "#2563eb" },
            { name: "JTBD", desc: "Find the 'job' customers hire your product for. Focus on the job, not features.", color: "#7c3aed" },
            { name: "Lean Startup", desc: "Hypothesis → smallest experiment → measure → learn. 2-week cycles.", color: "#059669" },
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

      {pg === 1 && (
      <>
      {/* STEP 1 — AI로 인터뷰 스크립트 준비 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>1</div>
            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "AI로 인터뷰 스크립트 만들기" : "Create interview script with AI"}</span>
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "6px" }}>
            {ko ? "The Mom Test 원칙: 솔루션을 말하지 말고, 문제만 물어보세요. 아래 질문을 기반으로 AI가 업종에 맞는 스크립트를 만들어줍니다." : "The Mom Test: Don't pitch your solution — only ask about problems. AI will create an industry-specific script based on these questions."}
          </div>
        </div>
        <div style={{ padding: "0 22px 14px", display: "grid", gap: "6px" }}>
          {(ko ? [
            { q: "이 문제를 지금 어떻게 해결하고 있나요?", why: "현재 대안 파악 → 10배 나은지 판단 가능", color: "#059669" },
            { q: "가장 최근에 이 문제를 겪은 게 언제예요?", why: "빈도와 심각도 확인. 기억도 못 하면 중요한 문제가 아님", color: "#2563eb" },
            { q: "이 문제 때문에 돈이나 시간을 얼마나 쓰나요?", why: "지불 의사 간접 확인. 0원이면 무료 도구도 안 쓸 것", color: "#7c3aed" },
            { q: "이상적으로 어떻게 되면 좋겠어요?", why: "고객 언어로 가치 정의 → 마케팅 카피에 직접 활용", color: "#d97706" },
          ] : [
            { q: "How do you currently solve this problem?", why: "Understand current alternatives → judge if 10x better", color: "#059669" },
            { q: "When was the last time you faced this?", why: "Measure frequency. Can't remember = not important", color: "#2563eb" },
            { q: "How much time/money do you spend on this?", why: "Indirect WTP check. Zero = won't use even if free", color: "#7c3aed" },
            { q: "What would ideal look like?", why: "Define value in customer's words → use in marketing", color: "#d97706" },
          ]).map(item => (
            <div key={item.q} style={{ padding: "12px 14px", borderRadius: "12px", border: `1px solid ${item.color}12`, background: `${item.color}03` }}>
              <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a", marginBottom: "3px" }}>"{item.q}"</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{item.why}</div>
            </div>
          ))}
        </div>
        {/* ── AI 인터뷰지 생성기 ── */}
        <div style={{ margin: "0 22px 16px", padding: "16px 18px", borderRadius: "14px", background: "linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(124,58,237,0.03) 100%)", border: "1px solid rgba(37,99,235,0.1)" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "10px" }}>
            {ko ? "AI 인터뷰지 생성기" : "AI INTERVIEW GENERATOR"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
            <input
              type="text"
              placeholder={ko ? "해결하려는 문제 (예: 소상공인의 경영 데이터 분석 시간 부족)" : "Problem to solve"}
              value={(guideSelections["interview-problem"] ?? (decisions["startup-foundation"]?.inputs?.problemStatement as string) ?? "")}
              onChange={e => d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "interview-problem": e.target.value }))}
              style={{
                padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(37,99,235,0.12)",
                background: "rgba(255,255,255,0.9)", fontSize: "13px", outline: "none",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "#2563eb"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.12)"; }}
            />
            <input
              type="text"
              placeholder={ko ? "타겟 고객 (예: 월매출 3천만원 이하 음식점 사장님)" : "Target customer"}
              value={guideSelections["interview-target"] ?? ""}
              onChange={e => d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "interview-target": e.target.value }))}
              style={{
                padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(37,99,235,0.12)",
                background: "rgba(255,255,255,0.9)", fontSize: "13px", outline: "none",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "#2563eb"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.12)"; }}
            />
          </div>
          <button
            type="button"
            disabled={!guideSelections["interview-problem"]?.trim() || !guideSelections["interview-target"]?.trim() || guideSelections["interview-loading"] === "true"}
            onClick={async () => {
              d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "interview-loading": "true", "interview-error": "" }));
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) throw new Error("로그인 필요");
                const res = await fetch("/api/ai/interview", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
                  body: JSON.stringify({
                    industryCategoryId: d.industryCategoryId,
                    problemStatement: guideSelections["interview-problem"],
                    targetCustomer: guideSelections["interview-target"],
                    language: d.language,
                  }),
                });
                if (!res.ok) throw new Error((await res.json()).error ?? "생성 실패");
                const script = await res.json();
                d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "interview-loading": "false", "interview-result": JSON.stringify(script) }));
              } catch (err) {
                d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "interview-loading": "false", "interview-error": err instanceof Error ? err.message : String(err) }));
              }
            }}
            style={{
              width: "100%", padding: "10px", borderRadius: "10px", border: "none",
              background: (guideSelections["interview-problem"]?.trim() && guideSelections["interview-target"]?.trim() && guideSelections["interview-loading"] !== "true") ? "#2563eb" : "rgba(37,99,235,0.1)",
              color: (guideSelections["interview-problem"]?.trim() && guideSelections["interview-target"]?.trim()) ? "#fff" : "rgba(37,99,235,0.3)",
              fontSize: "13px", fontWeight: 700, cursor: "pointer",
              boxShadow: (guideSelections["interview-problem"]?.trim() && guideSelections["interview-target"]?.trim()) ? "0 2px 8px rgba(37,99,235,0.2)" : "none",
            }}
          >
            {guideSelections["interview-loading"] === "true"
              ? (ko ? "생성 중..." : "Generating...")
              : (ko ? "Mom Test 인터뷰지 생성" : "Generate Mom Test Script")}
          </button>
          {guideSelections["interview-error"] && (
            <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "6px" }}>{guideSelections["interview-error"]}</div>
          )}
        </div>

        {/* ── 생성된 인터뷰지 결과 + PDF 다운로드 ── */}
        {guideSelections["interview-result"] && (() => {
          const script = JSON.parse(guideSelections["interview-result"]);
          const downloadPdf = () => {
            // 간단한 텍스트 기반 PDF — HTML to print
            const printContent = `
              <html><head><meta charset="utf-8"><title>${script.title}</title>
              <style>body{font-family:-apple-system,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#111}
              h1{font-size:22px;margin-bottom:4px}h2{font-size:16px;color:#2563eb;margin-top:24px}
              .q{margin:12px 0;padding:12px 16px;background:#f8fafc;border-radius:8px;border-left:3px solid #2563eb}
              .q-text{font-size:14px;font-weight:600}.q-purpose{font-size:12px;color:#666;margin-top:4px}
              .pill{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;color:#2563eb;background:#eff6ff;margin-bottom:4px}
              .donot{color:#dc2626;font-size:13px;margin:4px 0}
              </style></head><body>
              <h1>${script.title}</h1>
              <p style="color:#666">${script.duration} · Mom Test 기반</p>
              <h2>핵심 원칙</h2>
              ${script.principles?.map((p: string) => `<p>• ${p}</p>`).join("") ?? ""}
              <h2>아이스브레이커</h2><p>${script.icebreaker}</p>
              <h2>질문</h2>
              ${script.questions?.map((q: {phase:string;question:string;purpose:string;followUp?:string}, i: number) =>
                `<div class="q"><span class="pill">${q.phase}</span><div class="q-text">${i+1}. ${q.question}</div><div class="q-purpose">${q.purpose}</div>${q.followUp ? `<div class="q-purpose">${q.followUp}</div>` : ""}</div>`
              ).join("") ?? ""}
              <h2>마무리</h2><p>${script.closing}</p>
              <h2>하지 말 것</h2>
              ${script.doNots?.map((dn: string) => `<p class="donot">${dn}</p>`).join("") ?? ""}
              <p style="margin-top:40px;font-size:11px;color:#999">Generated by build.up AI · Mom Test Interview Script</p>
              </body></html>`;
            const w = window.open("", "_blank");
            if (w) { w.document.write(printContent); w.document.close(); w.print(); }
          };
          return (
            <div style={{ margin: "0 22px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{script.title}</span>
                <button type="button" onClick={downloadPdf} style={{
                  padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(37,99,235,0.15)",
                  background: "white", color: "#2563eb", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                }}>
                  {ko ? "PDF 저장" : "Save PDF"}
                </button>
              </div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", marginBottom: "10px" }}>{script.duration}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(guideSelections["interview-expanded"] === "true" ? script.questions : script.questions?.slice(0, 5))?.map((q: {phase:string;question:string;purpose:string;followUp?:string}, i: number) => (
                  <div key={i} style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(37,99,235,0.03)", borderLeft: "3px solid rgba(37,99,235,0.15)" }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "3px" }}>{q.phase}</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", lineHeight: 1.4 }}>{i + 1}. {q.question}</div>
                    <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", marginTop: "3px" }}>{q.purpose}</div>
                    {q.followUp && <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)", marginTop: "2px" }}>{q.followUp}</div>}
                  </div>
                ))}
                {(script.questions?.length ?? 0) > 5 && (
                  <button type="button" onClick={() => d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "interview-expanded": prev["interview-expanded"] === "true" ? "false" : "true" }))} style={{
                    fontSize: "13px", fontWeight: 600, color: "#2563eb", background: "none", border: "1px solid rgba(37,99,235,0.12)",
                    borderRadius: "10px", padding: "8px", cursor: "pointer", textAlign: "center" as const, width: "100%",
                  }}>
                    {guideSelections["interview-expanded"] === "true"
                      ? (ko ? "접기" : "Collapse")
                      : (ko ? `전체 ${script.questions?.length ?? 0}개 질문 보기` : `Show all ${script.questions?.length ?? 0} questions`)}
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      </>
      )}

      {pg === 2 && (
      <>
      {/* STEP 2 — 인터뷰 대상 찾기 + 실행 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>2</div>
            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "10명 이상 인터뷰를 실행하세요" : "Run 10+ interviews"}</span>
          </div>
        </div>
        <div style={{ padding: "0 22px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "10px" }}>
            {(ko ? [
              { ch: "링크드인 DM", tip: "타깃 직군에 직접 메시지. 20통 중 4~5통 응답", url: "https://linkedin.com" },
              { ch: "디스콰이엇", tip: "한국 스타트업 커뮤니티. 초기 유저 모집에 최적", url: "https://disquiet.io" },
              { ch: "블라인드", tip: "직장인 익명 커뮤니티. B2B 타깃에 효과적", url: "https://www.teamblind.com" },
              { ch: "지인 2차 소개", tip: "\"이 분야 아는 사람 소개해줄 수 있어?\"가 가장 효과적" },
            ] : [
              { ch: "LinkedIn DM", tip: "Direct message targets. ~20% response rate", url: "https://linkedin.com" },
              { ch: "Disquiet", tip: "Korean startup community. Best for early users", url: "https://disquiet.io" },
              { ch: "Blind", tip: "Anonymous work community. Effective for B2B", url: "https://www.teamblind.com" },
              { ch: "2nd-degree referrals", tip: "\"Know anyone in this space?\" — most effective" },
            ]).map(c => (
              <div key={c.ch} style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(5,150,105,0.03)" }}>
                <div style={{ fontSize: "12px", fontWeight: 640, color: "#0f172a" }}>{c.ch}</div>
                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", lineHeight: 1.4 }}>{c.tip}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
            {(ko ? [
              { num: "10+명", label: "최소 인터뷰 수", detail: "5명=패턴 감지, 10명=확신" },
              { num: "30분", label: "인터뷰 시간", detail: "15분은 짧고 1시간은 부담" },
              { num: "24h내", label: "기록 마감", detail: "기억은 빠르게 왜곡됨" },
            ] : [
              { num: "10+", label: "Min interviews", detail: "5=pattern, 10=confidence" },
              { num: "30m", label: "Length", detail: "15min short, 1hr too long" },
              { num: "24h", label: "Note deadline", detail: "Memory distorts fast" },
            ]).map(s => (
              <div key={s.num} style={{ padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", textAlign: "center" as const }}>
                <div style={{ fontSize: "18px", fontWeight: 780, color: "#059669" }}>{s.num}</div>
                <div style={{ fontSize: "11px", fontWeight: 640, color: "#0f172a" }}>{s.label}</div>
                <div style={{ fontSize: "10px", color: "rgba(15,23,42,0.4)" }}>{s.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      </>
      )}

      {pg === 3 && (
      <>
      {/* STEP 3 — AI로 인사이트 정리 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)", background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>3</div>
            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "AI로 인터뷰 결과를 분석하세요" : "Analyze results with AI"}</span>
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "6px" }}>
            {ko ? "인터뷰 노트를 AI에게 넘기면 반복 패턴, 핵심 고통, 초기 타깃 세그먼트를 자동 정리해줍니다." : "Pass your interview notes to AI — it auto-extracts repeated patterns, core pains, and initial target segments."}
          </div>
        </div>
        <div style={{ padding: "0 22px 16px" }}>
          {/* ── AI 인터뷰 분석기 ── */}
          <div style={{ padding: "16px 18px", borderRadius: "14px", background: "linear-gradient(135deg, rgba(124,58,237,0.04) 0%, rgba(37,99,235,0.03) 100%)", border: "1px solid rgba(124,58,237,0.1)", marginBottom: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "10px" }}>
              {ko ? "AI 인터뷰 결과 분석기" : "AI INTERVIEW ANALYZER"}
            </div>
            <textarea
              placeholder={ko
                ? "인터뷰 노트를 여기에 붙여넣으세요.\n\n예시:\n인터뷰 #1 (카페 사장님, 망원동, 3년차)\n- 매출 기록은 엑셀로 하는데 매일 30분씩 걸림\n- 세무사에게 월 30만원 내는데 사후 분석만 해줌\n- 재고 파악이 안 돼서 폐기가 월 50만원...\n\n인터뷰 #2 ..."
                : "Paste your interview notes here.\n\nExample:\nInterview #1 (Cafe owner, 3 years)\n- Tracks sales in Excel, takes 30min daily\n- Pays accountant $300/mo but only gets monthly reports\n- Can't track inventory, wastes $500/mo..."}
              value={guideSelections["analysis-notes"] ?? ""}
              onChange={e => d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "analysis-notes": e.target.value }))}
              style={{
                width: "100%", minHeight: "120px", padding: "12px 14px", borderRadius: "12px",
                border: "1px solid rgba(124,58,237,0.12)", background: "rgba(255,255,255,0.9)",
                fontSize: "13px", lineHeight: 1.6, resize: "vertical", outline: "none",
                fontFamily: "inherit",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "#7c3aed"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.12)"; }}
            />
            <button
              type="button"
              disabled={!guideSelections["analysis-notes"]?.trim() || guideSelections["analysis-loading"] === "true"}
              onClick={async () => {
                d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "analysis-loading": "true", "analysis-error": "" }));
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session?.access_token) throw new Error("로그인 필요");
                  const res = await fetch("/api/ai/interview/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
                    body: JSON.stringify({
                      interviewNotes: guideSelections["analysis-notes"],
                      industryCategoryId: d.industryCategoryId,
                      language: d.language,
                    }),
                  });
                  if (!res.ok) throw new Error((await res.json()).error ?? "분석 실패");
                  const result = await res.json();
                  d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "analysis-loading": "false", "analysis-result": JSON.stringify(result) }));
                } catch (err) {
                  d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "analysis-loading": "false", "analysis-error": err instanceof Error ? err.message : String(err) }));
                }
              }}
              style={{
                width: "100%", padding: "10px", borderRadius: "10px", border: "none", marginTop: "10px",
                background: (guideSelections["analysis-notes"]?.trim() && guideSelections["analysis-loading"] !== "true") ? "#7c3aed" : "rgba(124,58,237,0.1)",
                color: guideSelections["analysis-notes"]?.trim() ? "#fff" : "rgba(124,58,237,0.3)",
                fontSize: "13px", fontWeight: 700, cursor: "pointer",
              }}
            >
              {guideSelections["analysis-loading"] === "true" ? (ko ? "분석 중..." : "Analyzing...") : (ko ? "인터뷰 결과 분석하기" : "Analyze Interview Results")}
            </button>
            {guideSelections["analysis-error"] && (
              <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "6px" }}>{guideSelections["analysis-error"]}</div>
            )}
          </div>

          {/* ── 분석 결과 표시 ── */}
          {guideSelections["analysis-result"] && (() => {
            const r = JSON.parse(guideSelections["analysis-result"]);
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "10px" }}>
                {/* 핵심 문제 */}
                <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(124,58,237,0.06)", border: "1.5px solid rgba(124,58,237,0.12)" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#7c3aed", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "6px" }}>
                    {ko ? "우리가 해결할 문제" : "THE ONE PROBLEM"}
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5 }}>{r.oneProblemStatement}</div>
                </div>

                {/* 타겟 세그먼트 */}
                <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.08)" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em", marginBottom: "4px" }}>{ko ? "초기 타겟" : "TARGET"}</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{r.targetSegment}</div>
                </div>

                {/* 패턴 */}
                {r.patterns?.map((p: { pattern: string; frequency: string; quotes: string[] }, i: number) => (
                  <div key={i} style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(248,250,252,0.8)", border: "1px solid rgba(15,23,42,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{p.pattern}</span>
                      <span style={{ fontSize: "10px", fontWeight: 600, color: "#7c3aed", background: "rgba(124,58,237,0.06)", padding: "2px 8px", borderRadius: "4px" }}>{p.frequency}</span>
                    </div>
                    {p.quotes?.map((q: string, qi: number) => (
                      <div key={qi} style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", fontStyle: "italic", lineHeight: 1.4, marginTop: "3px" }}>"{q}"</div>
                    ))}
                  </div>
                ))}

                {/* 다음 단계 */}
                <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(5,150,105,0.04)", border: "1px solid rgba(5,150,105,0.08)" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#059669", letterSpacing: "0.06em", marginBottom: "6px" }}>{ko ? "다음 행동" : "NEXT STEPS"}</div>
                  {r.nextSteps?.map((s: string, i: number) => (
                    <div key={i} style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5, display: "flex", gap: "6px", marginBottom: "3px" }}>
                      <span style={{ color: "#059669", fontWeight: 700 }}>{i + 1}.</span> {s}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "6px" }}>{ko ? "이 단계의 결과물" : "Deliverables from this stage"}</div>
          <div style={{ display: "grid", gap: "4px" }}>
            {(ko ? [
              "핵심 고통 패턴 1~2개 (3명 이상 공통)",
              "초기 타깃 세그먼트 정의 (누구의, 어떤 상황에서)",
              "현재 대안 목록과 각 대안의 불만족 이유",
              "\"우리가 해결할 한 가지 문제\" 문장",
            ] : [
              "1-2 core pain patterns (3+ people in common)",
              "Initial target segment (who, in what context)",
              "Current alternatives and dissatisfaction reasons",
              "\"The one problem we solve\" statement",
            ]).map(item => (
              <div key={item} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "3px" }}><circle cx="7" cy="7" r="6" stroke="#7c3aed" strokeWidth="1.4"/><path d="M4.5 7l1.8 1.8 3.2-3.6" stroke="#7c3aed" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
