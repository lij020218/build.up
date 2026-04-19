"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";

export function StartupFoundationStage() {
  const d = useDashboardCtx();
  const { language, guideStepIndex, setGuideStepIndex, decisions, setDecisions } = d;

  const ko = language === "ko";
  const iconSvg = (path: string, color: string) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={path} />
    </svg>
  );
  // 페이지네이션: 0=핵심원칙, 1=Step1, 2=Step2, 3=Step3, 4=사례
  const totalPages = 5;
  const pageLabels = ko
    ? ["핵심 원칙", "1. 문제 정의", "2. 팀 구성", "3. 법인 설립", "사례"]
    : ["Principle", "1. Problem", "2. Team", "3. Incorporate", "Cases"];
  const page = guideStepIndex;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* 페이지 네비게이션 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
        <button type="button" disabled={page === 0} onClick={() => d.setGuideStepIndex((p: number) => p - 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
          background: page === 0 ? "rgba(0,0,0,0.02)" : "white", color: page === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: page === 0 ? "default" : "pointer",
        }}>
          {ko ? "← 이전" : "← Prev"}
        </button>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {pageLabels.map((label, i) => (
            <button key={i} type="button" onClick={() => d.setGuideStepIndex(i)} style={{
              padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: i === page ? 700 : 500,
              background: i === page ? "#1d3557" : "transparent", color: i === page ? "#fff" : "rgba(15,23,42,0.4)",
              border: "none", cursor: "pointer", transition: "all 0.2s ease",
            }}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" disabled={page === totalPages - 1} onClick={() => d.setGuideStepIndex((p: number) => p + 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
          background: page === totalPages - 1 ? "rgba(0,0,0,0.02)" : "white", color: page === totalPages - 1 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: page === totalPages - 1 ? "default" : "pointer",
        }}>
          {ko ? "다음 →" : "Next →"}
        </button>
      </div>

      {/* 페이지별 콘텐츠 — 현재 페이지만 표시 */}
      {page === 0 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(29,53,87,0.1)", background: "linear-gradient(180deg, rgba(29,53,87,0.03) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "핵심 원칙" : "Core Principle"}</div>
        <div style={{ fontSize: "17px", fontWeight: 720, color: "#0f172a", lineHeight: 1.4, marginBottom: "10px" }}>
          {ko ? "먼저 만들고, 법인은 나중에." : "Build first. Incorporate later."}
        </div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.7, marginBottom: "12px" }}>
          {ko
            ? "Facebook은 하버드 기숙사에서 런칭한 후 6개월 뒤에 법인을 세웠습니다. 배달의민족은 앱 출시 5개월 후에야 회사를 설립했습니다. Stripe는 \"노트북 줘봐\"라며 직접 설치해주는 것부터 시작했습니다. 지금 당장 필요한 건 법인이 아니라, 해결할 문제와 만들 제품입니다."
            : "Facebook launched 6 months before incorporating. Baemin released their app 5 months before founding the company. Stripe started by saying \"give me your laptop\" and installing for users manually. What you need now isn't a corporation — it's a problem to solve and a product to build."}
        </div>
        <div style={{ display: "grid", gap: "6px" }}>
          {(ko ? [
            { quote: "\"스타트업 아이디어를 얻는 방법은 스타트업 아이디어를 생각하는 게 아니라, 문제를 찾는 것이다. 가능하면 당신 자신의 문제를.\"", author: "Paul Graham, Y Combinator" },
            { quote: "\"가장 위험한 것은 시장이 원하지 않는 것을 만드는 것이다. 실패한 스타트업의 42%가 이것 때문이다.\"", author: "CB Insights, 스타트업 실패 분석" },
          ] : [
            { quote: "\"The way to get startup ideas is not to try to think of startup ideas. It's to look for problems, preferably problems you have yourself.\"", author: "Paul Graham, Y Combinator" },
            { quote: "\"The #1 reason startups fail is building something nobody wants. 42% fail for this exact reason.\"", author: "CB Insights, Startup Failure Analysis" },
          ]).map(q => (
            <div key={q.author} style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(29,53,87,0.03)", borderLeft: "3px solid rgba(29,53,87,0.15)" }}>
              <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.55, fontStyle: "italic" }}>{q.quote}</div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)", marginTop: "4px", fontWeight: 600 }}>— {q.author}</div>
            </div>
          ))}
        </div>
      </div>

      )}

      {page === 1 && (
      <>
      {/* STEP 1 — 핵심 문제 정의 (First Principles) */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>1</div>
            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "해결할 문제를 한 문장으로 정의하세요" : "Define the problem in one sentence"}</span>
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "6px" }}>
            {ko ? "Elon Musk는 로켓 비용이 비싼 이유를 원자재 가격까지 분해했습니다 (재료비 = 가격의 2%). Peter Thiel은 \"대부분의 사람들이 동의하지 않는, 당신이 아는 중요한 진실은 무엇인가?\"라고 묻습니다. 이 질문에 답하세요." : "Musk broke down why rockets are expensive to raw materials (2% of price). Thiel asks: \"What important truth do few people agree with you on?\" Answer this question."}
          </div>
        </div>
        <div style={{ padding: "0 22px 16px" }}>
          <div style={{ display: "grid", gap: "6px", marginBottom: "12px" }}>
            {(ko ? [
              { icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", title: "나 자신의 문제에서 시작하세요", desc: "YC가 선호하는 아이디어는 창업자가 직접 겪는 문제입니다. 상상이 아닌 경험에서 출발하세요" },
              { icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", title: "\"지금 이걸 누가 원하는가?\" 답할 수 있어야 합니다", desc: "많은 사람이 조금 원하는 것보다, 적은 사람이 절실하게 원하는 것을 선택하세요" },
              { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "기존 솔루션의 비용을 분해하세요", desc: "Musk 방식: 재료비·인건비·유통비를 분리하면 10배 싸게 만들 수 있는 지점이 보입니다" },
            ] : [
              { icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", title: "Start from your own problem", desc: "YC prefers ideas from founders' own experience, not imagination" },
              { icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", title: "Can you answer: \"Who wants this right now?\"", desc: "Choose something few people want desperately over many wanting slightly" },
              { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "Break down existing solution costs", desc: "Musk method: separate materials/labor/distribution to find the 10x opportunity" },
            ]).map(s => (
              <div key={s.title} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderRadius: "12px", background: "rgba(37,99,235,0.03)" }}>
                {iconSvg(s.icon, "#2563eb")}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{s.title}</div>
                  <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.08)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.04em", marginBottom: "6px" }}>{ko ? "AI 활용법" : "How to use AI"}</div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, padding: "8px 12px", borderRadius: "8px", background: "rgba(37,99,235,0.03)", fontStyle: "italic" }}>
              {ko ? "\"나는 [분야]에서 [타깃]의 [고통]을 해결하려 해. 1) 이 문제가 충분히 구체적인지, 2) 현재 사람들이 어떻게 해결하고 있는지, 3) 기존 솔루션의 비용 구조를 원자재 수준까지 분해해줘. 4) Peter Thiel의 '비밀' 프레임워크로 이 기회를 평가해줘.\"" : "\"I want to solve [pain] for [target] in [field]. 1) Is this specific enough? 2) How do people currently solve it? 3) Break down existing solution costs to raw materials. 4) Evaluate this opportunity using Thiel's 'secret' framework.\""}
            </div>
          </div>
        </div>
      </div>

      {/* 문제 정의 입력 + 저장 */}
      <div style={{
        borderRadius: "16px", padding: "18px 20px",
        background: "rgba(255,255,255,0.95)", border: "1.5px solid rgba(37,99,235,0.12)",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
          {ko ? "나의 문제 정의" : "MY PROBLEM STATEMENT"}
        </div>
        <textarea
          placeholder={ko
            ? "예: \"소상공인은 매일 경영 데이터를 분석할 시간이 없다. 기존 솔루션(세무사, 엑셀)은 월 1회 사후 분석만 가능하고, 비용이 월 30만원 이상이다.\""
            : "e.g., \"Small business owners don't have time to analyze daily data. Current solutions (accountants, Excel) only offer monthly reviews and cost $300+/mo.\""}
          value={(decisions["startup-foundation"]?.inputs?.problemStatement as string) ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            d.setDecisions((prev: Record<string, unknown>) => ({
              ...prev,
              "startup-foundation": {
                ...(prev["startup-foundation"] as Record<string, unknown> ?? {}),
                stageId: "startup-foundation",
                inputs: { ...((prev["startup-foundation"] as Record<string, unknown>)?.inputs as Record<string, unknown> ?? {}), problemStatement: val },
              }
            }));
          }}
          style={{
            width: "100%", minHeight: "80px", padding: "12px 14px", borderRadius: "12px",
            border: "1px solid rgba(37,99,235,0.1)", background: "rgba(248,250,252,0.8)",
            fontSize: "14px", lineHeight: 1.6, resize: "vertical",
            fontFamily: "inherit",
            outline: "none", color: "#0f172a",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#2563eb"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.1)"; }}
        />
        {(() => {
          const val = (decisions["startup-foundation"]?.inputs?.problemStatement as string) ?? "";
          const confirmed = !!val.trim() && val.trim().length >= 10;
          return (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
            <button type="button" onClick={() => {
              if (!confirmed) return;
              // 확인 시 자동 저장 + 체크리스트 연동은 useTaskAutoCompletion에서 처리
              d.setDecisions((prev: Record<string, unknown>) => ({
                ...prev,
                "startup-foundation": {
                  ...(prev["startup-foundation"] as Record<string, unknown> ?? {}),
                  stageId: "startup-foundation",
                  inputs: { ...((prev["startup-foundation"] as Record<string, unknown>)?.inputs as Record<string, unknown> ?? {}), problemConfirmed: true },
                }
              }));
            }} style={{
              padding: "8px 20px", borderRadius: "10px", border: "none",
              background: confirmed ? "#2563eb" : "rgba(0,0,0,0.06)",
              color: confirmed ? "#fff" : "rgba(0,0,0,0.25)",
              fontSize: "13px", fontWeight: 600, cursor: confirmed ? "pointer" : "default",
              transition: "all 0.2s ease",
            }}>
              {(decisions["startup-foundation"]?.inputs as Record<string, unknown>)?.problemConfirmed
                ? (ko ? "✓ 확인됨" : "✓ Confirmed")
                : (ko ? "확인" : "Confirm")}
            </button>
            <span style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)" }}>
              {ko ? "10자 이상 입력 후 확인을 누르면 체크리스트에 자동 반영됩니다" : "Type 10+ characters and confirm to auto-check the task"}
            </span>
          </div>
          );
        })()}
      </div>

      </>
      )}

      {page === 2 && (
      <>
      {/* STEP 2 — 팀 구성 (또는 솔로 파운더) */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)", background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>2</div>
            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "팀 구성 방향을 정하세요" : "Decide your team structure"}</span>
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "6px" }}>
            {ko ? "2026년, AI 도구 덕분에 1인 창업자도 이전의 5인 팀만큼 할 수 있습니다. 공동창업자가 반드시 필요하지는 않습니다." : "In 2026, AI tools let solo founders do what 5-person teams used to. Co-founders aren't always necessary."}
          </div>
        </div>
        <div style={{ padding: "0 22px 16px" }}>
          {/* 솔로 vs 공동 — 선택형 버튼 */}
          {(() => {
            const teamChoice = (decisions["startup-foundation"]?.inputs?.teamStructure as string) ?? "";
            const choose = (val: string) => {
              d.setDecisions((prev: Record<string, unknown>) => ({
                ...prev,
                "startup-foundation": {
                  ...(prev["startup-foundation"] as Record<string, unknown> ?? {}),
                  stageId: "startup-foundation",
                  inputs: { ...((prev["startup-foundation"] as Record<string, unknown>)?.inputs as Record<string, unknown> ?? {}), teamStructure: val },
                }
              }));
            };
            const isSolo = teamChoice === "solo";
            const isCo = teamChoice === "co-founder";
            return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                <button type="button" onClick={() => choose("solo")} style={{
                  padding: "14px", borderRadius: "14px", textAlign: "left" as const, cursor: "pointer",
                  background: isSolo ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.02)",
                  border: isSolo ? "2px solid #7c3aed" : "1px solid rgba(124,58,237,0.06)",
                  boxShadow: isSolo ? "0 0 0 3px rgba(124,58,237,0.08)" : "none",
                  transition: "all 0.2s ease",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    {iconSvg("M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", "#7c3aed")}
                    <span style={{ fontSize: "14px", fontWeight: 680, color: "#7c3aed" }}>{ko ? "솔로 파운더" : "Solo Founder"}</span>
                    {isSolo && <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", background: "#7c3aed", padding: "2px 6px", borderRadius: "4px", marginLeft: "auto" }}>✓</span>}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.5 }}>
                    {ko ? "성공 엑싯의 52%가 솔로 창업. Cursor + Claude로 MVP를 2~6주에 출시. 의사결정 빠름." : "52% of exits by solo founders. Ship MVP in 2-6wk with AI. Fast decisions."}
                  </div>
                </button>
                <button type="button" onClick={() => choose("co-founder")} style={{
                  padding: "14px", borderRadius: "14px", textAlign: "left" as const, cursor: "pointer",
                  background: isCo ? "rgba(37,99,235,0.08)" : "rgba(37,99,235,0.02)",
                  border: isCo ? "2px solid #2563eb" : "1px solid rgba(37,99,235,0.06)",
                  boxShadow: isCo ? "0 0 0 3px rgba(37,99,235,0.08)" : "none",
                  transition: "all 0.2s ease",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    {iconSvg("M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75", "#2563eb")}
                    <span style={{ fontSize: "14px", fontWeight: 680, color: "#2563eb" }}>{ko ? "공동 창업" : "Co-founders"}</span>
                    {isCo && <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", background: "#2563eb", padding: "2px 6px", borderRadius: "4px", marginLeft: "auto" }}>✓</span>}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.5 }}>
                    {ko ? "역할 분담으로 속도 UP. 하지만 합의사항 정리 필수. 아래 체크리스트를 확인하세요." : "Faster with role split. But must agree on terms below."}
                  </div>
                </button>
              </div>
            );
          })()}

          {/* 공동창업 시 합의사항 — 접이식 */}
          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.06)" }}>
            <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.4)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>{ko ? "공동창업 시 반드시 합의할 것" : "Must-agree items for co-founders"}</div>
            <div style={{ display: "grid", gap: "4px" }}>
              {(ko ? [
                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "각자의 역할과 책임 범위 (서면으로)", color: "#059669" },
                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "의사결정 방식 — 의견 불일치 시 누가 최종 결정?", color: "#059669" },
                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "지분 비율 (YC 추천: 동등 또는 근접 배분)", color: "#059669" },
                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "베스팅 조건 (4년/1년 클리프가 표준)", color: "#059669" },
                { icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", text: "퇴사/이탈 시 지분 회수 조건 — 이걸 안 정하면 나중에 전쟁", color: "#d97706" },
              ] : [
                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "Each person's role and responsibility scope (in writing)", color: "#059669" },
                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "Decision-making — who has final say on disagreements?", color: "#059669" },
                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "Equity split (YC recommends near-equal)", color: "#059669" },
                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "Vesting (4yr / 1yr cliff standard)", color: "#059669" },
                { icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", text: "Buyback terms on departure — skipping this means war later", color: "#d97706" },
              ]).map(s => (
                <div key={s.text} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>
                  {iconSvg(s.icon, s.color)}
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      </>
      )}

      {page === 3 && (
      <>
      {/* STEP 3 — 법인은 언제? (트리거 기반) */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>3</div>
            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "법인 설립 — 이때 하면 됩니다" : "Incorporate — when these triggers hit"}</span>
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, marginTop: "6px" }}>
            {ko ? "MVP를 만들고, 유저를 모으고, 아래 상황이 발생하면 그때 법인을 세우세요. 그 전에는 불필요합니다." : "Build MVP, get users, then incorporate when these triggers happen. Before that, it's unnecessary."}
          </div>
        </div>
        <div style={{ padding: "0 22px 14px", display: "grid", gap: "6px" }}>
          {(ko ? [
            { trigger: "첫 고객 결제를 받을 때", why: "개인 계좌로 사업 수익 수령 시 세무·책임 문제", color: "#dc2626", level: "필수" },
            { trigger: "투자금을 받을 때", why: "모든 투자자가 법인을 요구합니다", color: "#dc2626", level: "필수" },
            { trigger: "첫 직원을 고용할 때", why: "IP 소유권, 4대보험, 스톡옵션 부여에 법인 필요", color: "#dc2626", level: "필수" },
            { trigger: "공동창업자와 지분을 나눌 때", why: "서면 합의서 + 베스팅을 법인 구조로 정리", color: "#d97706", level: "권장" },
            { trigger: "정부 지원사업에 신청할 때", why: "대부분 법인 또는 사업자등록 필요", color: "#d97706", level: "권장" },
          ] : [
            { trigger: "First customer payment", why: "Personal account for business revenue = tax/liability issues", color: "#dc2626", level: "Must" },
            { trigger: "Accepting investment", why: "All investors require a legal entity", color: "#dc2626", level: "Must" },
            { trigger: "First hire", why: "IP ownership, insurance, stock options need a corp", color: "#dc2626", level: "Must" },
            { trigger: "Splitting equity with co-founders", why: "Formalize with vesting in corporate structure", color: "#d97706", level: "Rec" },
            { trigger: "Government program application", why: "Most require business registration", color: "#d97706", level: "Rec" },
          ]).map(t => (
            <div key={t.trigger} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderRadius: "12px", background: `${t.color}03`, border: `1px solid ${t.color}10` }}>
              <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: `${t.color}10`, color: t.color, whiteSpace: "nowrap" as const, flexShrink: 0, marginTop: "2px" }}>{t.level}</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{t.trigger}</div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{t.why}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ margin: "0 22px 16px", padding: "12px 14px", borderRadius: "12px", background: "rgba(5,150,105,0.04)", borderLeft: "3px solid rgba(5,150,105,0.3)" }}>
          <div style={{ fontSize: "13px", color: "rgba(5,150,105,0.8)", lineHeight: 1.55 }}>
            {ko ? "구체적인 설립 절차, 비용, 스톡옵션 설계는 다음 단계(법인 운영·세무·보안 기본기)에서 상세히 안내합니다." : "Detailed procedures, costs, and stock option setup are covered in the next stage (Corp operations & tax basics)."}
          </div>
        </div>
      </div>

      </>
      )}

      {page === 4 && (
      <>
      {/* 실제 사례 — 영감 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(15,23,42,0.06)", background: "rgba(255,255,255,0.95)", padding: "20px 22px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.35)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "10px" }}>{ko ? "그들도 이렇게 시작했습니다" : "They all started this way"}</div>
        <div style={{ display: "grid", gap: "6px" }}>
          {(ko ? [
            { name: "배달의민족", story: "바닥에 떨어진 전단지를 스캔해서 앱을 만듦. 회사 설립은 앱 출시 5개월 후", year: "2010" },
            { name: "토스", story: "8번 실패 후 통장 잔고 2만원. \"또 다른 멍청한 아이디어\"가 7조원 기업이 됨", year: "2015" },
            { name: "Airbnb", story: "에어 매트리스 3개로 시작. 시리얼 상자를 팔아 3천만원을 벌고 YC에 들어감", year: "2008" },
            { name: "Stripe", story: "\"노트북 줘봐\" — 직접 설치해주는 것으로 첫 고객 확보. 7줄의 코드가 시작", year: "2010" },
          ] : [
            { name: "Baemin", story: "Scanned restaurant flyers off the ground. Company founded 5mo after app launch", year: "2010" },
            { name: "Toss", story: "8 failures, ₩20K in bank. \"Another stupid idea\" became a $7B company", year: "2015" },
            { name: "Airbnb", story: "3 air mattresses. Sold cereal boxes for $30K to fund YC application", year: "2008" },
            { name: "Stripe", story: "\"Give me your laptop\" — manual installation for first customers. 7 lines of code", year: "2010" },
          ]).map(s => (
            <div key={s.name} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: s.name !== "Stripe" ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.25)", width: "36px", flexShrink: 0, textAlign: "right" as const, marginTop: "2px" }}>{s.year}</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{s.name}</div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{s.story}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
