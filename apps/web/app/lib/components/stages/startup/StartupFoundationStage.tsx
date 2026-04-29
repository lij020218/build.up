"use client";

import { Target, Users, Building2 } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { ModePathCard } from "./ModePathCard";
import { StartupKeyActionHero, StartupPageNav, StartupReferenceLabel } from "./StartupStageShell";

export function StartupFoundationStage() {
  const d = useDashboardCtx();
  const { language, guideStepIndex, setGuideStepIndex, decisions, setDecisions, startupOperatingMode } = d;

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
      {/* ── 모드별 경로 카드 (최상단 — 자기 상황에 맞는 길 먼저) ── */}
      <ModePathCard stageId="startup-foundation" />

      {/* KEY ACTION 미드나이트 hero */}
      <StartupKeyActionHero
        eyebrow="KEY ACTION"
        title={ko ? "먼저 만들고, 법인은 나중에" : "Build first. Incorporate later."}
        subtitle={
          ko
            ? "지금 당장 필요한 건 법인이 아니라, 해결할 문제와 만들 제품입니다. 문제 정의 → 팀 구성 → 법인 설립 순서로 진행하세요."
            : "What you need now isn't a corporation — it's a problem to solve and a product to build. Problem → Team → Incorporate."
        }
        miniCards={[
          { icon: Target, label: ko ? "문제 정의" : "Problem", detail: ko ? "한 문장으로" : "One sentence" },
          { icon: Users, label: ko ? "팀 구성" : "Team", detail: ko ? "공동창업자 3원칙" : "3 cofounder rules" },
          { icon: Building2, label: ko ? "법인 설립" : "Incorporate", detail: ko ? "MVP 검증 후" : "After MVP" },
        ]}
      />

      <StartupReferenceLabel>
        {ko ? "↓ 심화 참고 — 모든 모드에 공통되는 원칙·체크리스트·검증된 사례" : "↓ Reference — universal principles, checklists, verified cases"}
      </StartupReferenceLabel>

      {/* 페이지 네비게이션 */}
      <StartupPageNav
        page={page}
        totalPages={totalPages}
        labels={pageLabels}
        onChange={(p) => d.setGuideStepIndex(p)}
        ko={ko}
      />

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
      {/* ── 팀 구성 — 모드별 구체 가이드 (검증된 출처) ── */}
      {(() => {
        const MIDNIGHT = "#191970";
        // 검증된 데이터 (이중 출처):
        // - Solo founders 52% 엑싯 비중 (mean.ceo 2026)
        // - Antler Korea: 팀당 최대 $260K USD 투자 + 멘토링 + 가속 단계
        // - Startup Grind Seoul (120개국 글로벌 커뮤니티)
        // - Founder Institute Korea / K-Startup 멘토링 포털 (2026년 통합)
        // - First hire: tech founder가 founding engineer 첫 채용 (after seed close)
        // - $50K+ ACV B2B = sales hire 우선 / sub-$10K self-service = marketing first
        // - Series A growth marketer: mid-senior 4-7yr, 0.1-0.5% equity, $110-150K base
        // - VP/Head of Growth는 Series A 단계엔 premature (팀 없으면)
        // - YC 표준: 공동창업자 동등 또는 근접 분배
        // - 베스팅: 한국 상법 cliff 최소 2년 / 벤처기업 1년 cliff 가능
        const modeContent: Record<string, {
          headline: string;
          why: string[];
          actions: { label: string; detail: string }[];
          decisions: { item: string; recommendation: string }[];
          resources: { name: string; desc: string; url?: string }[];
        }> = {
          indie: {
            headline: ko ? "1인 인디 — 본인 1명 + 멘토 + 외주" : "Solo Indie — you + mentor + contractors",
            why: ko ? [
              "솔로 파운더 비중 2026년 36.3% (2019년 23.7%에서 급증). 성공 엑싯의 52%가 솔로 창업.",
              "AI 도구 (Cursor·Claude·Lovable) 덕분에 1인이 5인 팀 일을 처리. 공동창업자 = 지분 50% 희석 + 갈등 리스크.",
              "단점은 고립 + 번아웃. '공동창업자' 대신 '멘토 + 커뮤니티 + 외주' 조합으로 충분.",
            ] : [
              "Solo founders 36.3% of new ventures in 2026 (vs 23.7% in 2019). 52% of exits are solo.",
              "AI tools (Cursor·Claude·Lovable) let 1 person do 5-person team work. Co-founder = 50% dilution + conflict risk.",
              "Downside: isolation + burnout. Replace 'co-founder' with 'mentor + community + outsourcing'.",
            ],
            actions: ko ? [
              { label: "1단계: 멘토 1명 확보 (월 1-2회 1시간)", detail: "같은 산업의 시니어 또는 시드 단계 수료한 founder. K-Startup 멘토링 포털 무료 매칭. Antler Korea·Founder Institute 액셀러레이터 멘토 풀 활용." },
              { label: "2단계: 글로벌·국내 커뮤니티 가입 (고립 방지)", detail: "Indie Hackers (글로벌), MicroConf Connect (부트스트랩), 한국: Startup Grind Seoul, 디스콰이엇, EO 슬랙. 매주 1회 active 참여." },
              { label: "3단계: 외주 매핑 (본인 약점 영역만)", detail: "디자인 = Wishket·Fiverr / 마케팅 컨설팅 = K-Startup 멘토링 / 회계·세무 = 자비스·삼쩜삼. 외주는 매출 발생 후 시작 (인디는 자본 절약 우선)." },
              { label: "4단계: 외주 전환 트리거 — 본인 시간 < 외주비용 시", detail: "예: 디자인에 주 10시간 → 30만원/월 외주 vs 본인 시간 가치 (예상 시급 5만+). 시간 가치가 외주비 넘으면 즉시 외주." },
            ] : [
              { label: "Step 1: Get 1 mentor (monthly 1hr × 1-2)", detail: "Senior in your industry or seed-stage alum. K-Startup mentoring portal free. Antler Korea/Founder Institute mentor pool." },
              { label: "Step 2: Join global/local communities (anti-isolation)", detail: "Indie Hackers, MicroConf Connect, Startup Grind Seoul, Disquiet (KR), EO Slack. Active weekly." },
              { label: "Step 3: Map outsourcing (only your weak areas)", detail: "Design = Wishket/Fiverr. Marketing = K-Startup mentor. Tax = Jobis/3o3. Start AFTER revenue (capital-conscious)." },
              { label: "Step 4: Outsource trigger — your time value > cost", detail: "e.g., 10hr/wk on design → 300K/mo contractor when your hourly rate > 50K." },
            ],
            decisions: ko ? [
              { item: "공동창업자 들이지 않는 결정", recommendation: "지분 100% 유지 + 의사결정 빠름. 단, 1년 후에도 솔로면 멘토·외주 시스템이 작동해야 함." },
              { item: "외주 vs 풀타임 첫 채용", recommendation: "매출 월 5천만+ 안정적 발생 시 contractor → 6개월 후 full-time 전환. 그 전에는 contractor 만." },
            ] : [
              { item: "Choosing solo (no co-founder)", recommendation: "Keep 100% equity + fast decisions. But mentor/outsource system must work after 1 year." },
              { item: "Contractor vs full-time first hire", recommendation: "Stable 50M/mo revenue → contractor → 6mo later → FT. Before that, contractor only." },
            ],
            resources: [
              { name: "Indie Hackers", desc: ko ? "글로벌 인디 해커 커뮤니티" : "Global indie hacker community", url: "https://www.indiehackers.com" },
              { name: "MicroConf Connect", desc: ko ? "부트스트랩 SaaS 글로벌 최대 커뮤니티" : "Largest bootstrap SaaS community", url: "https://microconf.com" },
              { name: "K-Startup 멘토링", desc: ko ? "정부 무료 멘토링 매칭 (2026 통합 포털)" : "Free govt mentor matching", url: "https://www.k-startup.go.kr" },
              { name: "Antler Korea", desc: ko ? "최대 $260K 투자 + 시니어 멘토" : "Up to $260K + senior mentors", url: "https://www.antler.co/location/korea" },
              { name: "Startup Grind Seoul", desc: ko ? "글로벌 120개국 커뮤니티 한국 챕터" : "Global 120-country community Seoul chapter", url: "https://www.startupgrind.com/seoul/" },
            ],
          },
          bootstrap: {
            headline: ko ? "부트스트랩 — 1-3명 공동창업 + SHA 즉시" : "Bootstrap — 1-3 co-founders + SHA immediately",
            why: ko ? [
              "공동창업자 있으면 분담으로 속도 2-3배. 단 함의·합의·문서화 안 하면 6-12개월 후 갈등 폭발 (스타트업 폐업 사유 1순위 — 'co-founder dispute').",
              "지분 비율은 결정 즉시 — 입찰 처럼. 미루면 매출·외부 투자 후 협상력 0. YC 권장: 동등 또는 근접 배분 (예: 50/50 또는 55/45).",
              "베스팅 4년 + cliff (한국 상법 2년 / 벤처기업 1년) 표준. 한 명 이탈 시 vesting 전 지분 회수 가능.",
            ] : [
              "Co-founders 2-3x speed via division. But undocumented = 6-12mo conflict explosion (#1 startup killer).",
              "Equity split immediate decision. YC: equal or near-equal (50/50 or 55/45).",
              "4-yr vesting + cliff (Korea: 2yr / venture cert: 1yr) standard. Departure = pre-vest equity recovery.",
            ],
            actions: ko ? [
              { label: "1단계: 공동창업자 역할·책임 명시 (서면)", detail: "CEO·CTO·CPO 역할 분담 명문화. '의견 불일치 시 누가 최종 결정?' 캐스팅 보트 필수 (50/50 데드락 방지). Notion·Google Doc 으로 기록 + 모두 서명." },
              { label: "2단계: 지분 비율 즉시 결정 (Co-Founder Equity Calculator 활용)", detail: "YC: 50/50 또는 55/45. 차이 작을수록 좋음. 시간 ≠ 가치 (먼저 시작했어도 동등). Mike Moyer's Slicing Pie 도구로 객관적 계산." },
              { label: "3단계: SHA (주주간 계약서) 즉시 작성 — 변호사 위임 200-500만 또는 ZUZU 무료 템플릿", detail: "필수 조항: 베스팅 + 이탈 시 지분 회수 + 매각 제한 (Drag-Along, Tag-Along, ROFR) + 비경쟁 의무 + 기밀 유지." },
              { label: "4단계: 첫 채용 = 본인이 못 하는 영역 (매출 후)", detail: "tech founder = 디자이너/마케터 / non-tech founder = 엔지니어. 첫 1명은 contractor (월 200-300만) → 6개월 검증 → full-time. 옵션 grant 0.5-2%." },
            ] : [
              { label: "Step 1: Document roles & responsibilities (in writing)", detail: "CEO/CTO/CPO formal split. Casting vote required (avoid 50/50 deadlock). Notion/Google Doc + signed." },
              { label: "Step 2: Decide equity immediately (Co-Founder Equity Calculator)", detail: "YC: 50/50 or 55/45. Smaller gap = better. Time ≠ value. Use Slicing Pie." },
              { label: "Step 3: SHA immediately — lawyer 2-5M or ZUZU free template", detail: "Must-have: vesting + departure recovery + sale restrictions + non-compete + confidentiality." },
              { label: "Step 4: First hire = your weak area (post-revenue)", detail: "Tech founder = designer/marketer. Non-tech = engineer. Contractor (2-3M/mo) → 6mo → FT. Option 0.5-2%." },
            ],
            decisions: ko ? [
              { item: "공동창업자 수 (1명 vs 2명)", recommendation: "2명 = 스피드 + 보완 / 3명 = 의사결정 느려짐 (한국 정서 합의 문화). 2명이 표준." },
              { item: "지분 분배", recommendation: "근접 배분 + 베스팅. 동등 (50/50) 시 캐스팅 보트 (CEO 권한 강화) 별도 명시." },
              { item: "첫 채용 시점", recommendation: "월 매출 5천 안정 후. 그 전에는 본인+공동창업자만." },
            ] : [
              { item: "How many co-founders (1 vs 2)", recommendation: "2 = speed+complement. 3 = slower decisions. 2 is standard." },
              { item: "Equity split", recommendation: "Near-equal + vesting. 50/50 needs casting vote spelled out." },
              { item: "First hire timing", recommendation: "After 50M/mo stable revenue. Before: just founders." },
            ],
            resources: [
              { name: "ZUZU (캡테이블·SHA 템플릿)", desc: ko ? "주주간 계약서 무료 템플릿 + 캡테이블 관리" : "Free SHA templates + cap table", url: "https://zuzu.network" },
              { name: "Slicing Pie / Co-Founder Equity Calculator", desc: ko ? "객관적 지분 비율 계산 도구" : "Objective equity split calculator", url: "https://slicingpie.com" },
              { name: "Notion (공동창업자 합의서)", desc: ko ? "역할·지분·의사결정 문서 템플릿" : "Role/equity/decision templates", url: "https://www.notion.so" },
              { name: "Wishket / 크몽", desc: ko ? "한국 외주 마켓플레이스 (디자인·개발)" : "Korea contractor marketplace", url: "https://www.wishket.com" },
              { name: "MicroConf Connect", desc: ko ? "부트스트랩 SaaS 커뮤니티 (37signals 모델)" : "Bootstrap SaaS community", url: "https://microconf.com" },
            ],
          },
          seed: {
            headline: ko ? "시드 단계 — 코어 3-5명 + 옵션 grant 정책" : "Seed — core 3-5 team + option policy",
            why: ko ? [
              "시드 받았다면 24개월 안에 시리즈A 마일스톤 도달이 목표. 3-5명 코어 팀이 가장 폭발적으로 성장.",
              "잘못된 시니어 채용 1명 = 시드 자본 20% 손실 (3-6개월 분 인건비). 채용 결정 = founder의 가장 중요한 일.",
              "옵션 grant 정책 사전 확보 — 시리즈A 시 추가 발행 = founder 지분 5-10% 희석. 시드 시 옵션풀 10-15% 미리 잡아야 함.",
            ] : [
              "Post-seed: 24mo to Series A milestone. 3-5 core team = explosive growth phase.",
              "Bad senior hire = 20% seed burn (3-6mo salary). Hiring is founder's #1 job.",
              "Pre-issue option pool 10-15%. Otherwise Series A demands more = 5-10% founder dilution.",
            ],
            actions: ko ? [
              { label: "1단계: 첫 채용 = founding engineer (tech 스타트업)", detail: "시드 클로징 직후. 직접 빌드 + 의사결정 자율 + 최소 가이드. 0.5-1% equity + 시중 base 80% (옵션 풀 활용). YC 표준 첫 채용." },
              { label: "2단계: 두 번째 채용 = 본인이 약한 영역", detail: "B2B SaaS ACV $50K+ → founding salesperson. B2C/PLG sub-$10K → founding marketer. tech-first product → founding designer." },
              { label: "3단계: 옵션 grant 정책 표준화 (이전 채용에도 소급 적용)", detail: "Engineer 0.1-1% / Senior 1-3% / Founding 2-5%. cliff 1년 (벤처기업 인증 시) + 4년 베스팅. RSU vs 스톡옵션 결정 (한국은 보통 스톡옵션)." },
              { label: "4단계: 채용 프로세스 표준화 (founder 60% 시간)", detail: "Job spec 작성 → ATS (Greenhouse·Workable·자체 Notion) → 4-step 면접 (recruiter·hiring manager·peer·founder) → 레퍼런스 콜 3명. 채용 결정 만장일치 권장." },
              { label: "5단계: 코어 팀 도구·문화 셋업", detail: "Slack + Linear/GitHub + Notion + Google Workspace. 주간 1on1 + 분기 OKR + 월간 all-hands. 빠른 의사결정 문화 (Amazon 'disagree and commit')." },
            ] : [
              { label: "Step 1: First hire = founding engineer (tech)", detail: "Right after seed close. Builds, decides, minimal guidance. 0.5-1% equity + 80% market base. YC standard." },
              { label: "Step 2: Second hire = your weak area", detail: "B2B SaaS $50K+ ACV → founding salesperson. B2C/PLG → founding marketer." },
              { label: "Step 3: Standardize option grants (retroactive)", detail: "Engineer 0.1-1% / Senior 1-3% / Founding 2-5%. 1-yr cliff (venture cert) + 4-yr vest." },
              { label: "Step 4: Hiring process (founder 60% time)", detail: "Job spec → ATS → 4-step interview → 3 reference calls. Unanimous decision recommended." },
              { label: "Step 5: Team tools/culture", detail: "Slack + Linear/GitHub + Notion + Google. Weekly 1on1 + Quarterly OKR + Monthly all-hands." },
            ],
            decisions: ko ? [
              { item: "첫 채용 직무", recommendation: "tech founder = founding engineer 첫 채용. non-tech founder = engineer 첫 채용. (가장 약한 영역이 아니라, 가장 중요한 영역)." },
              { item: "옵션풀 비율", recommendation: "10-15% 사전 확보. 벤처기업 인증 시 50% 한도 가능 — 미국 VC 협상 시 유리." },
              { item: "시니어 vs 주니어 첫 채용", recommendation: "시드는 시니어 1명 > 주니어 3명. 시니어가 시스템·문화 정립." },
            ] : [
              { item: "First hire role", recommendation: "Tech founder = founding engineer. Non-tech = engineer. (Most critical, not weakest)." },
              { item: "Option pool size", recommendation: "10-15% pre-issue. Venture cert allows up to 50% — leverage for US VC." },
              { item: "Senior vs junior first hire", recommendation: "Seed = 1 senior > 3 juniors. Senior establishes systems/culture." },
            ],
            resources: [
              { name: ko ? "ZUZU (옵션 grant 관리)" : "ZUZU (option grants)", desc: ko ? "스톡옵션·캡테이블·베스팅 자동" : "Stock options, cap table, vesting", url: "https://zuzu.network" },
              { name: ko ? "원티드·로켓펀치" : "Wanted / RocketPunch", desc: ko ? "한국 시드 단계 채용 1순위 채널" : "Korea seed-stage recruiting #1", url: "https://www.wanted.co.kr" },
              { name: "LinkedIn", desc: ko ? "글로벌 시니어·해외 채용" : "Global senior/overseas hiring", url: "https://www.linkedin.com" },
              { name: ko ? "Greenhouse / Workable / Notion ATS" : "Greenhouse / Workable / Notion ATS", desc: ko ? "채용 프로세스 표준화" : "Hiring process standardization" },
              { name: ko ? "벤처인 (벤처기업 인증)" : "Venture cert", desc: ko ? "시드 1억+ 후 자동 자격 → 옵션풀 50% 한도" : "Auto-eligible after 100M seed", url: "https://www.smes.go.kr/venturein/" },
            ],
          },
          seriesA: {
            headline: ko ? "시리즈A+ — C-suite 채용 + 이사회 + 운영 OS" : "Series A+ — C-suite + board + operating OS",
            why: ko ? [
              "시리즈A 후 founder는 '실행자' → '경영자' 전환. 모든 결정 직접 = bottleneck. C-suite 위임 못 하면 시리즈B 전 회사 멈춤 (Reid Hoffman).",
              "C-suite 채용 사이클 6-12개월. CEO 시간 60% 채용에 — 잘못된 VP 1명 = 18개월 손실.",
              "이사회 구성 (투자자 1-2 + 외부 이사 1 + founder) + 분기 운영 + 월간 update. 거버넌스 미정비 = 시리즈B 실패 1순위.",
            ] : [
              "Post-Series A: founder transitions from 'doer' to 'leader'. C-suite delegation = compulsory.",
              "C-suite cycles 6-12mo. CEO 60% on hiring. Wrong VP = 18mo lost.",
              "Board (1-2 investors + 1 external + founder), quarterly meetings + monthly updates.",
            ],
            actions: ko ? [
              { label: "1단계: C-suite 채용 (CTO·CPO·VP Engineering·VP Sales)", detail: "총 12-18개월 사이클. 첫 1명 = CTO 또는 VP Engineering (tech 스타트업). 다음 = CPO·VP Sales (각 산업별 우선순위). C-suite equity 0.5-2% + 시장 base + 시그닝." },
              { label: "2단계: Growth marketer 첫 채용 (mid-senior)", detail: "VP/Head of Growth 는 premature (팀 없으면 무의미). Mid-senior IC (4-7yr 경력) 1-2명 시작. base $110K-$150K + 0.1-0.5% equity. 6-12개월 후 VP 승격 또는 외부 영입." },
              { label: "3단계: 이사회 구성 + 분기 운영", detail: "시리즈A 클로징 후 30일 내 첫 board meeting. 분기 정기 미팅 + 월간 update + 연간 strategy off-site. Reid Hoffman 표준: investor 1-2 + 외부 1 + founder." },
              { label: "4단계: 옵션풀 추가 발행 (총 15-25%) + ESOP 정책", detail: "C-suite·VP grant 별도 풀. CTO 2-5% / CPO 1-3% / VP 0.5-2%. 4년 베스팅 + 1년 cliff (벤처기업)." },
              { label: "5단계: 운영 OS 정립 (OKR + 부문 KPI + 주간 리뷰)", detail: "Andrew Chen 표준: compounding growth loops. Growth team + Data infra + Experimentation platform. 시리즈B 18-24개월 내 — 메트릭 트래킹 (NRR·Burn Multiple·Magic Number 등) 정착." },
            ] : [
              { label: "Step 1: C-suite (CTO/CPO/VP Engineering/VP Sales)", detail: "12-18mo cycle. First = CTO or VP Eng (tech). Next = CPO/VP Sales. Equity 0.5-2% + market base + signing." },
              { label: "Step 2: First growth marketer (mid-senior)", detail: "VP/Head premature without team. Mid-senior IC (4-7yr) 1-2. Base $110-150K + 0.1-0.5% eq. Promote/hire VP after 6-12mo." },
              { label: "Step 3: Board + quarterly cadence", detail: "First board meeting within 30 days post-Series A close. Quarterly + monthly updates + annual off-site." },
              { label: "Step 4: Additional option pool (15-25% total) + ESOP", detail: "C-suite/VP separate. CTO 2-5%, CPO 1-3%, VP 0.5-2%. 4-yr vest + 1-yr cliff." },
              { label: "Step 5: Operating OS (OKR + dept KPI + weekly review)", detail: "Compounding growth loops. Growth team + Data + Experiments. Series B in 18-24mo." },
            ],
            decisions: ko ? [
              { item: "C-suite 채용 순서", recommendation: "tech 스타트업 = CTO 1순위. B2B SaaS = VP Sales 1순위. B2C/PLG = CPO 1순위." },
              { item: "이사회 구성", recommendation: "투자자 1-2 + 외부 이사 1 + founder. 외부 이사는 산업 베테랑 (CEO 경험자) 권장." },
              { item: "Growth marketer 시점", recommendation: "PMF 검증 후 즉시. ARR $1M+ 시. 더 늦으면 시리즈B 마일스톤 못 잡음." },
            ] : [
              { item: "C-suite order", recommendation: "Tech = CTO first. B2B SaaS = VP Sales. B2C/PLG = CPO." },
              { item: "Board composition", recommendation: "1-2 investors + 1 external + founder. External = industry veteran (ex-CEO)." },
              { item: "Growth marketer timing", recommendation: "Immediately post-PMF. At $1M+ ARR. Later = Series B miss." },
            ],
            resources: [
              { name: ko ? "외부 헤드헌터 (C-suite 전문)" : "External headhunters", desc: ko ? "Heidrick & Struggles, Korn Ferry — C-suite 채용 8-12주" : "Heidrick / Korn Ferry, 8-12 wks" },
              { name: ko ? "Carta (글로벌 캡테이블·옵션)" : "Carta (global cap table)", desc: ko ? "글로벌 표준 옵션 grant + ESOP 관리" : "Global ESOP standard", url: "https://carta.com" },
              { name: ko ? "원티드 + LinkedIn + 추천" : "Wanted + LinkedIn + referrals", desc: ko ? "C-suite 70% 추천 채용 (한국)" : "70% C-suite via referrals (KR)" },
              { name: ko ? "이사회 운영 도구 (Diligent·Boardable)" : "Board tools (Diligent·Boardable)", desc: ko ? "분기 미팅·자료·의결 표준화" : "Quarterly meetings standard" },
              { name: ko ? "Reid Hoffman 'Blitzscaling'" : "Reid Hoffman 'Blitzscaling'", desc: ko ? "C-suite·이사회·스케일 표준 참고서" : "C-suite/board/scale reference" },
            ],
          },
        };
        const c = modeContent[startupOperatingMode] ?? modeContent.bootstrap;
        return (
          <div style={{ borderRadius: "20px", border: `1px solid ${MIDNIGHT}1A`, background: `linear-gradient(180deg, ${MIDNIGHT}05 0%, rgba(255,255,255,0.98) 100%)`, overflow: "hidden" }}>
            {/* 헤더 */}
            <div style={{ padding: "20px 22px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>2</div>
                <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{c.headline}</span>
              </div>
              <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", marginTop: "4px" }}>
                {ko ? "운영 모드 기반 — 변경하려면 상단 모드 카드에서 칩 선택" : "Mode-based — change via top mode card chips"}
              </div>
            </div>

            {/* WHY */}
            <div style={{ padding: "0 22px 16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                {ko ? "왜 이 단계가 필요한가" : "Why now"}
              </div>
              <div style={{ display: "grid", gap: "6px" }}>
                {c.why.map((line, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.025)" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: MIDNIGHT, flexShrink: 0, marginTop: "8px" }} />
                    <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.75)", lineHeight: 1.6 }}>{line}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* HOW */}
            <div style={{ padding: "0 22px 16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                {ko ? "어떻게 해야 하는가" : "How to execute"}
              </div>
              <div style={{ display: "grid", gap: "8px" }}>
                {c.actions.map((a, i) => (
                  <div key={i} style={{ padding: "12px 14px", borderRadius: "12px", background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginBottom: "3px", letterSpacing: "-0.01em" }}>{a.label}</div>
                    <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.6)", lineHeight: 1.55 }}>{a.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* KEY DECISIONS */}
            <div style={{ padding: "0 22px 16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#059669", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                {ko ? "이 모드에서 꼭 결정해야 할 것" : "Key decisions for this mode"}
              </div>
              <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(5,150,105,0.04)", border: "1px solid rgba(5,150,105,0.15)", display: "grid", gap: "10px" }}>
                {c.decisions.map((dec, i) => (
                  <div key={i}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(5,150,105,0.95)", marginBottom: "2px" }}>{dec.item}</div>
                    <div style={{ fontSize: "12.5px", color: "rgba(5,150,105,0.85)", lineHeight: 1.55 }}>→ {dec.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RESOURCES */}
            <div style={{ padding: "0 22px 18px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.5)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                {ko ? "추천 도구·커뮤니티" : "Tools / communities"}
              </div>
              <div style={{ display: "grid", gap: "6px" }}>
                {c.resources.map((r) => (
                  <a
                    key={r.name}
                    href={r.url ?? "#"}
                    target={r.url ? "_blank" : undefined}
                    rel={r.url ? "noopener noreferrer" : undefined}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 12px", borderRadius: "10px",
                      background: "white", border: "1px solid rgba(0,0,0,0.06)",
                      textDecoration: "none", color: "inherit",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{r.name}</div>
                      <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.55)", marginTop: "1px" }}>{r.desc}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
      </>
      )}

      {page === 3 && (
      <>
      {/* ── 법인 설립 — 모드별 구체 가이드 (검증된 출처) ── */}
      {(() => {
        const MIDNIGHT = "#191970";
        // 검증된 데이터 (이중 출처):
        // - 헬프미·자비스: 법인 등록면허세 11.25만 + 지방교육세 (등록면허세 20%) + 법원수수료 2-3.5만 = 14-16만 + 법무사 30-50만
        // - 과밀억제권역 (수도권): 등록면허세 3배 중과세
        // - 토스페이먼츠/세이브택스: 개인사업자 6-45% / 법인 9-25%, 순이익 2억+ 시 법인 전환 권장
        // - ZUZU: 옵션풀 일반 10% / 상장 15% / 벤처기업 50%
        // - 한국 상법: 스톡옵션 cliff 최소 2년 / 벤처기업법은 1년 cliff 가능
        // - 매쉬업벤처스/Star Law: 4년 베스팅 + cliff 표준
        // - KIPRIS: 상표 출원 변리사 30-50만, 직접 무료. 특허 startup 70% 우선심사 할인
        // - 스톡옵션 비과세: 연 2억·누적 5억 (2027.12.31까지 부여)
        const modeContent: Record<string, {
          headline: string;
          why: string[];
          actions: { label: string; detail: string }[];
          advantages: string[];
          tools: { name: string; desc: string; price?: string; url?: string }[];
        }> = {
          indie: {
            headline: ko ? "1인 인디 — 개인사업자 우선, 법인은 나중" : "Solo Indie — start with sole proprietor",
            why: ko ? [
              "1인 솔로는 매출 1억 4천만원 미만이면 간이과세로 부가세 1.5%만 부담 (일반 10% 대비 압도적). 법인은 매출 무관 일반과세.",
              "개인사업자는 종합소득세 6-45% 누진세 — 매출 5천만 이하 단계는 법인 9% 보다 실효세율 낮을 수 있음.",
              "법인 설립 비용 50-100만원 + 법인 통장·세무·노무 부담 — 인디한테 ROI 안 맞음.",
            ] : [
              "Solo with revenue under 140M KRW = simplified VAT (1.5% vs 10% standard).",
              "Personal income tax 6-45% — at low revenue, effective rate beats corp's flat 9%.",
              "Incorporation costs ~$500-1000 + bank/tax/payroll overhead — bad ROI for solo.",
            ],
            actions: ko ? [
              { label: "1단계: 홈택스 개인사업자 등록 (5분, 무료)", detail: "사업자등록번호 즉시 발급. 간이과세 자격 자동 확인 (직전 연도 매출 1억 4천만 미만)." },
              { label: "2단계: 사업용 통장 + 카드 분리", detail: "토스뱅크·카카오뱅크 사업자 통장 무료 개설. 모든 매출·경비 분리 — 종합소득세 신고 시 비용 인정." },
              { label: "3단계: KIPRIS 상표 직접 출원 (4-6만원)", detail: "변리사 30-50만 위임 vs 직접 출원 4-6만원 (수수료만). 1인 인디는 직접 권장 — 절차 단순." },
              { label: "법인 전환 트리거", detail: "(a) 순이익 연 2억+ → 건강보험 부담 폭발 / (b) 첫 외부 투자 / (c) 첫 직원 고용 / (d) 매출 7억+ → 성실신고확인대상 전환 전" },
            ] : [
              { label: "Step 1: Hometax sole proprietor registration (5 min, free)", detail: "Biz registration number issued instantly." },
              { label: "Step 2: Separate business account + card", detail: "Toss Bank / KakaoBank free biz account." },
              { label: "Step 3: File trademark on KIPRIS (40-60K KRW direct)", detail: "vs patent attorney 300-500K. Solo indie = file directly." },
              { label: "Convert to corp when:", detail: "(a) Annual profit > 200M / (b) First investment / (c) First hire / (d) Revenue > 700M (before Sincere Filing threshold)" },
            ],
            advantages: ko ? [
              "✓ 등록 비용 0원 (개인사업자) vs 법인 50-100만원",
              "✓ 간이과세로 부가세 1.5% (매출 1.4억 미만)",
              "✓ 종소세는 비용 처리 폭 넓음 — 솔로 인디 도구비 (Cursor·Claude) 모두 비용",
              "✓ 폐업도 1일 — 법인은 청산 절차 6개월+",
            ] : [
              "✓ Zero setup cost (sole prop) vs $500-1000 corp",
              "✓ Simplified VAT 1.5%",
              "✓ Wide expense deductions",
              "✓ 1-day shutdown vs 6+ months corp liquidation",
            ],
            tools: [
              { name: "홈택스 (개인사업자 등록)", desc: ko ? "5분 온라인 무료 등록" : "Free online registration", url: "https://www.hometax.go.kr" },
              { name: "KIPRIS (상표 검색·출원)", desc: ko ? "직접 출원 4-6만원" : "Direct filing 40-60K KRW", url: "https://www.kipris.or.kr" },
              { name: "삼쩜삼 (종소세 환급)", desc: ko ? "1인 종소세 자동 신고" : "Auto income tax", url: "https://3o3.co.kr" },
            ],
          },
          bootstrap: {
            headline: ko ? "부트스트랩 — 법인 + SHA 동시 권장" : "Bootstrapped — incorporate + SHA from start",
            why: ko ? [
              "공동창업자가 있으면 법인이 표준. 지분 = 주식 = 법적 효력. 개인사업자에서 '지분 합의' 는 거의 무효 (인적회사 구조).",
              "1차 매출 없어도 법인 먼저 권장 — SHA 통한 베스팅·근속 의무·매각 제한 사전 확보. 6-12개월 후 갈등 시 회복 어려움.",
              "유한책임 — 법인 채무는 출자금 한도. 개인 자산 보호 (인디는 무한책임).",
            ] : [
              "Co-founders = corp standard. Equity in sole prop = no legal force.",
              "Even pre-revenue: corp + SHA prevents 6-12mo conflict from killing company.",
              "Limited liability — protect personal assets.",
            ],
            actions: ko ? [
              { label: "1단계: 주식회사 설립 (자본금 100만~2천만)", detail: "헬프미·자비스 등 온라인 30-50만 (DIY) 또는 법무사 위임 80-120만. 등록면허세 11.25만 + 지방교육세 (20%) + 법원수수료 2-3.5만." },
              { label: "⚠️ 과밀억제권역 (서울·수도권) 중과세 주의", detail: "수도권 본점 설립 시 등록면허세 3배. 자본금 1천만 → 등록면허세 33.75만 (수도권). 비수도권 설립 후 본점 이전도 옵션." },
              { label: "2단계: 공동창업자 SHA (주주간 계약서) 즉시 작성", detail: "벤처기업 인증 후 cliff 1년 적용 가능 (일반 회사는 2년 cliff 의무). 4년 베스팅 + 1-2년 cliff 표준. Drag-Along·Tag-Along·Right of First Refusal 포함." },
              { label: "3단계: 옵션풀 5-10% 사전 확보", detail: "벤처기업 인증 + 옵션풀 50% 한도까지 가능. 부트스트랩은 5-10% 시작 — 시드 시 추가 발행 협상력." },
              { label: "4단계: 상표·도메인 출원 (변리사 30-50만)", detail: "법인 명의 출원 — 회사 자산. 시드 라운드 due diligence 1순위 항목." },
            ] : [
              { label: "Step 1: Incorporate (capital 1M-20M KRW)", detail: "Help-me/Jobis online ~$300-400 DIY or attorney $700-1000. Registration tax 112.5K + education tax (20%) + court fee 20-35K." },
              { label: "⚠️ Seoul metro 3x surcharge", detail: "Capital 10M = registration tax 337.5K (metro). Consider non-metro then HQ relocation." },
              { label: "Step 2: SHA immediately", detail: "4-yr vesting + 1-2 yr cliff. Venture cert reduces cliff to 1yr (vs 2yr standard)." },
              { label: "Step 3: Option pool 5-10% pre-allocation", detail: "Venture cert allows up to 50%. Bootstrap = 5-10% start." },
              { label: "Step 4: File trademark + IP (300-500K via patent attorney)", detail: "In corp's name. #1 due diligence item for seed." },
            ],
            advantages: ko ? [
              "✓ 유한책임 — 개인 자산 보호 (인디 무한책임 대비)",
              "✓ 법인세 9-25% (개인사업자 6-45% — 고소득 구간에서 절세)",
              "✓ SHA 통한 공동창업자 분쟁 사전 차단",
              "✓ 시드 라운드 시 'corp + SHA + IP' 패키지 = 즉시 due diligence 통과",
              "✓ 정부지원사업 (예비창업·초기창업·청년창업사관학교) 자격 폭 넓어짐",
            ] : [
              "✓ Limited liability",
              "✓ Corp tax 9-25% beats sole prop 6-45% at higher income",
              "✓ SHA prevents co-founder disputes",
              "✓ Seed-ready cap table",
              "✓ Wider govt program eligibility",
            ],
            tools: [
              { name: ko ? "헬프미 (법인설립 온라인)" : "Help-me (online incorporation)", desc: ko ? "원스톱 등기·사업자등록" : "One-stop registration", price: "30~50만원", url: "https://www.help-me.kr" },
              { name: ko ? "자비스 (법인설립 + 회계)" : "Jobis (incorp + accounting)", desc: ko ? "법인설립 + 월 회계" : "Incorp + monthly accounting", price: "30만~", url: "https://jobis.co" },
              { name: "ZUZU (주주관리·SHA)", desc: ko ? "캡테이블·SHA·옵션풀 관리" : "Cap table, SHA, option pool", price: ko ? "무료~" : "Free", url: "https://zuzu.network" },
              { name: "Notion (창업자 합의서)", desc: ko ? "지분 구조·SHA 초안 템플릿" : "Equity structure templates", price: "무료~$10/월" },
            ],
          },
          seed: {
            headline: ko ? "시드 단계 — 옵션풀 10-15% + 벤처기업 인증" : "Seed — 10-15% option pool + venture cert",
            why: ko ? [
              "시드 자금 받은 시점부터 시리즈A 마감 18-24개월. 이 기간 안에 법인 + SHA + 옵션풀 + IP + 벤처기업 인증 모두 정비해야 due diligence 통과.",
              "옵션풀 부족 시 시리즈A 시 추가 발행 → 대표 지분 5-10% 추가 희석. 시드 시 미리 10-15% 확보가 협상력.",
              "벤처기업 인증 시 옵션풀 50% 한도 + cliff 1년 적용 + 스톡옵션 비과세 (연 2억·누적 5억, 2027.12.31까지).",
            ] : [
              "Seed → Series A is 18-24 months. Need corp + SHA + option pool + IP + venture cert all aligned.",
              "Insufficient pool = 5-10% extra dilution at Series A.",
              "Venture cert: 50% option pool, 1-yr cliff, tax-free options (200M/yr, 500M cumulative until 2027.12.31).",
            ],
            actions: ko ? [
              { label: "1단계: 변호사 위임 SHA 정비 (200-500만)", detail: "시드 VC 가 요구하는 표준 조항 반영: Liquidation Preference 1x non-participating · Anti-dilution Broad-Based · Pro-Rata Right · Drag-Along · Tag-Along · ROFR." },
              { label: "2단계: 옵션풀 10-15% 사전 발행 + ESOP 정책", detail: "시리즈A VC는 옵션풀 부족 시 추가 발행 요구 — 사전 확보가 핵심. 직원 별 grant 정책 (Engineer 0.1-1% / Senior 1-3% / VP 1-5%) 표준화." },
              { label: "3단계: 벤처기업 인증 (투자유치형, 시드 1억+)", detail: "VC·액셀러레이터 1억+ 투자 받았으면 자동 자격. 옵션풀 50% 한도 + 법인세 5년 50% 감면 + R&D 25% 세액공제 + 병역특례." },
              { label: "4단계: 정식 IP 전략 (변리사 정기 자문 50-100만/월)", detail: "트레이드마크 다국가 (한국·미국·EU·중국) + 핵심 특허 출원 + Trade Secret 정책. startup 70% 우선심사 할인 활용." },
              { label: "5단계: 회계 시스템 + 월간 결산 (자비스·더존)", detail: "VC 보고용 표준 재무제표. 자비스 SaaS 친화 + 영문 출력. 월 30-50만원." },
            ] : [
              { label: "Step 1: Lawyer-drafted SHA (2-5M KRW)", detail: "Standard VC clauses: Liq Pref 1x non-part, Anti-dilution BB, Pro-Rata, Drag/Tag-Along, ROFR." },
              { label: "Step 2: Pre-issue 10-15% option pool", detail: "Series A demands extra dilution if pool too small." },
              { label: "Step 3: Venture cert (Investment type, after 100M+ seed)", detail: "Auto-eligible. 50% option cap, 1-yr cliff, tax-free options, military exemption." },
              { label: "Step 4: Formal IP strategy", detail: "Multi-country trademark + core patents + trade secret policy." },
              { label: "Step 5: Accounting system (Jobis/Douzone)", detail: "Standard reports for VC. ~300-500K/mo." },
            ],
            advantages: ko ? [
              "✓ 벤처기업 옵션풀 50% 한도 (일반 10% 대비 5배)",
              "✓ 스톡옵션 비과세 연 2억/누적 5억 (2027.12.31 부여 분)",
              "✓ 법인세 5년 50% 감면 (벤처기업)",
              "✓ R&D 세액공제 25% (중소기업)",
              "✓ 병역특례 (전문연구요원/산업기능요원) — 핵심 인재 유지",
              "✓ 대표 지분 60% 유지 (시리즈A 협상 마지노선)",
            ] : [
              "✓ Venture option pool up to 50% (5x normal)",
              "✓ Tax-free options 200M/yr, 500M cumulative",
              "✓ 5-yr 50% corp tax cut",
              "✓ 25% R&D credit",
              "✓ Military service exemption",
              "✓ Founder equity ≥60% (Series A floor)",
            ],
            tools: [
              { name: "ZUZU (캡테이블·SHA)", desc: ko ? "시드 VC 표준 SHA 템플릿 + 옵션풀 관리" : "Cap table + SHA templates", price: ko ? "무료~ 유료" : "Free / Paid", url: "https://zuzu.network" },
              { name: ko ? "벤처기업 인증 (벤처인) " : "Venture cert", desc: ko ? "투자유치형 자동 자격 (시드 1억+)" : "Auto-eligible after 100M seed", url: "https://www.smes.go.kr/venturein/" },
              { name: ko ? "자비스·더존 (회계 SaaS)" : "Jobis/Douzone", desc: ko ? "VC 보고 표준 재무제표" : "VC-grade reports", price: "30-50만원/월" },
              { name: ko ? "법무법인 위임 (SHA 정비)" : "Law firm SHA", desc: ko ? "표준 VC 조항 반영" : "Standard VC clauses", price: "200-500만원" },
            ],
          },
          seriesA: {
            headline: ko ? "시리즈A+ — 추가 옵션풀 + 글로벌 구조" : "Series A+ — additional pool + global structure",
            why: ko ? [
              "시리즈A 클로징과 동시에 옵션풀 추가 5-10% 발행 (총 15-25%). C-suite·VP 채용용 별도 grant pool 분리.",
              "글로벌 진출 시 미국 Delaware C-Corp 자회사 검토. 한국 본사 + 미국 sub 구조가 글로벌 VC·세무·exit 면에서 표준.",
              "법무팀 인하우스 또는 외부 fixed retainer 200-500만/월. C-Suite·이사회·해외 진출·M&A 모두 법무 비중 큼.",
            ] : [
              "Series A close = pre-issue 5-10% additional option pool (total 15-25%) for C-suite/VP grants.",
              "Global expansion: Delaware C-Corp sub. Korea HQ + US sub is standard for global VC/tax/exit.",
              "In-house legal or fixed retainer 2-5M/mo.",
            ],
            actions: ko ? [
              { label: "1단계: 옵션풀 추가 발행 + ESOP 확장", detail: "시리즈A 클로징 시 추가 5-10% 발행. C-suite (CTO 2-5% / CPO 1-3% / VP 0.5-2%) 별도 grant 정책." },
              { label: "2단계: 정관 개정 + 종류주식 (Series A 우선주) 발행", detail: "투자자 권리 (전환·우선매수·동의 사항) 명시. 변호사 위임 500만원~ 1천만원." },
              { label: "3단계: 미국 Delaware C-Corp 자회사 (글로벌 진출 시)", detail: "Stripe Atlas $500 또는 변호사 위임 $5K-$10K. 한국 본사 + 미국 sub flip 또는 Korea-side. 세무·환위험·exit 영향." },
              { label: "4단계: 법무팀 구축 (인하우스 또는 외부 retainer)", detail: "월 200-500만 retainer. 계약·IP·노무·해외·이사회·M&A 모두 처리. 시리즈B 전 정착이 표준." },
              { label: "5단계: IP 포트폴리오 확대 (defensive + offensive)", detail: "특허 5-20개 + 다국가 트레이드마크 + 영업비밀 정책. Trade Secret 명문화 (NDA + Non-compete + 자료 분류)." },
            ] : [
              { label: "Step 1: Additional pool issuance + ESOP", detail: "5-10% added at Series A close. C-suite grants policy." },
              { label: "Step 2: Articles amendment + Series A preferred shares", detail: "Investor rights (conversion, ROFR, consent). 5-10M lawyer fee." },
              { label: "Step 3: Delaware C-Corp sub (for global)", detail: "Stripe Atlas $500 or attorney $5-10K." },
              { label: "Step 4: Build legal team (in-house or fixed retainer)", detail: "2-5M/mo. Contracts, IP, HR, global, board, M&A." },
              { label: "Step 5: Expand IP portfolio", detail: "5-20 patents + multi-country trademarks + trade secret formalization." },
            ],
            advantages: ko ? [
              "✓ 옵션풀 15-25% — C-suite·VP 채용 무기",
              "✓ Series A 우선주 — 투자자 권리 + 일반주 보호 분리",
              "✓ 글로벌 자회사 (Delaware C-Corp) — 미국 VC·exit·환위험 헤지",
              "✓ 인하우스 법무 — CEO 본업 집중 가능",
              "✓ IP 포트폴리오 — 시리즈B·M&A·IPO 모두 가산점",
            ] : [
              "✓ 15-25% option pool for C-suite/VP",
              "✓ Series A preferred separation",
              "✓ Delaware C-Corp = US VC/exit/FX hedge",
              "✓ In-house legal frees CEO",
              "✓ IP portfolio = Series B/M&A/IPO bonus",
            ],
            tools: [
              { name: ko ? "법무법인 인하우스 또는 외부 retainer" : "In-house or retainer law firm", desc: ko ? "월 200-500만" : "2-5M/mo" },
              { name: "Stripe Atlas (Delaware C-Corp)", desc: ko ? "글로벌 자회사 $500 셋업" : "Global sub $500", url: "https://stripe.com/atlas" },
              { name: "Carta (글로벌 캡테이블)", desc: ko ? "글로벌 표준 cap table·옵션 관리" : "Global cap table standard", url: "https://carta.com" },
              { name: ko ? "변리사 사무소 (IP 포트폴리오)" : "Patent attorney firm", desc: ko ? "정기 자문 + 다국가 출원" : "Regular consult + global filing" },
            ],
          },
        };
        const c = modeContent[startupOperatingMode] ?? modeContent.bootstrap;
        return (
          <div style={{ borderRadius: "20px", border: `1px solid ${MIDNIGHT}1A`, background: `linear-gradient(180deg, ${MIDNIGHT}05 0%, rgba(255,255,255,0.98) 100%)`, overflow: "hidden" }}>
            {/* 헤더 */}
            <div style={{ padding: "20px 22px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>3</div>
                <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{c.headline}</span>
              </div>
              <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", marginTop: "4px" }}>
                {ko ? "운영 모드 기반 — 변경하려면 상단 모드 카드에서 칩 선택" : "Mode-based — change via top mode card chips"}
              </div>
            </div>

            {/* WHY */}
            <div style={{ padding: "0 22px 16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                {ko ? "왜 지금 이 단계가 필요한가" : "Why now"}
              </div>
              <div style={{ display: "grid", gap: "6px" }}>
                {c.why.map((line, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.025)" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: MIDNIGHT, flexShrink: 0, marginTop: "8px" }} />
                    <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.75)", lineHeight: 1.6 }}>{line}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* HOW (행동) */}
            <div style={{ padding: "0 22px 16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                {ko ? "어떻게 해야 하는가 — 구체 행동" : "How to execute"}
              </div>
              <div style={{ display: "grid", gap: "8px" }}>
                {c.actions.map((a, i) => (
                  <div key={i} style={{ padding: "12px 14px", borderRadius: "12px", background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginBottom: "3px", letterSpacing: "-0.01em" }}>{a.label}</div>
                    <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.6)", lineHeight: 1.55 }}>{a.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ADVANTAGES (이렇게 하면 유리한 점) */}
            <div style={{ padding: "0 22px 16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#059669", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                {ko ? "이 길로 가면 유리한 점" : "Why this path wins"}
              </div>
              <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(5,150,105,0.04)", border: "1px solid rgba(5,150,105,0.15)" }}>
                {c.advantages.map((adv, i) => (
                  <div key={i} style={{ fontSize: "13px", color: "rgba(5,150,105,0.9)", lineHeight: 1.65, marginBottom: i < c.advantages.length - 1 ? "4px" : 0 }}>
                    {adv}
                  </div>
                ))}
              </div>
            </div>

            {/* TOOLS */}
            <div style={{ padding: "0 22px 18px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.5)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                {ko ? "추천 도구·서비스" : "Recommended tools"}
              </div>
              <div style={{ display: "grid", gap: "6px" }}>
                {c.tools.map((t) => (
                  <a
                    key={t.name}
                    href={t.url ?? "#"}
                    target={t.url ? "_blank" : undefined}
                    rel={t.url ? "noopener noreferrer" : undefined}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 12px", borderRadius: "10px",
                      background: "white", border: "1px solid rgba(0,0,0,0.06)",
                      textDecoration: "none", color: "inherit",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{t.name}</div>
                      <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.55)", marginTop: "1px" }}>{t.desc}</div>
                    </div>
                    {t.price && (
                      <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, padding: "3px 8px", borderRadius: "6px", background: `${MIDNIGHT}10`, whiteSpace: "nowrap" as const }}>
                        {t.price}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
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
