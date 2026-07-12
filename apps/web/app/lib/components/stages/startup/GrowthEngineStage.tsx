"use client";

import { Star, TrendingUp, RotateCcw, AlertTriangle } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { ModePathCard } from "./ModePathCard";
import {
  MIDNIGHT,
  MIDNIGHT_SOFT,
  MIDNIGHT_BORDER,
  StartupKeyActionHero,
  StartupPageNav,
  StartupReferenceLabel,
} from "./StartupStageShell";
import { StageWrapup } from "../shared/StageWrapup";

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
      {/* KEY ACTION 미드나이트 hero (최상단) */}
      <StartupKeyActionHero
        eyebrow="KEY ACTION"
        title={ko ? "리텐션 없는 성장은 밑 빠진 독" : "Growth without retention is a leaky bucket"}
        subtitle={
          ko
            ? "초기 사용자가 \"돌아오는가?\"를 먼저 증명하세요. 북극성 지표 → 주간 리뷰 → 리텐션 코호트 순서로 성장 엔진을 만드세요."
            : "Prove your users come back first. North Star → Weekly review → Retention cohort — build the growth engine."
        }
        miniCards={[
          { icon: Star, label: ko ? "북극성" : "North Star", detail: ko ? "단 1개 지표" : "One metric" },
          { icon: TrendingUp, label: ko ? "주간 리뷰" : "Weekly", detail: ko ? "월요일 30분" : "Mon 30min" },
          { icon: RotateCcw, label: ko ? "리텐션" : "Retention", detail: ko ? "코호트 추적" : "Cohort track" },
        ]}
      />

      <StartupReferenceLabel>
        {ko ? "↓ 심화 참고 — North Star · 코호트 · 실험 표준" : "↓ Reference — North Star, cohort, experiment frameworks"}
      </StartupReferenceLabel>

      {/* 페이지 네비 */}
      <StartupPageNav
        page={pg}
        totalPages={totalPg}
        labels={pgLabels}
        onChange={(p) => d.setGuideStepIndex(p)}
        ko={ko}
      />

      {/* PAGE 0 — WHY + 모드별 경로 카드 */}
      {pg === 0 && (
      <>
      <ModePathCard stageId="growth-engine" />
      <div style={{ borderRadius: "20px", border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", padding: "20px 22px", boxShadow: "0 1px 3px rgba(25,25,112,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <AlertTriangle size={14} strokeWidth={2.2} color={MIDNIGHT} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{ko ? "왜 이 단계가 중요한가" : "Why this matters"}</span>
        </div>
        <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
          {ko ? "리텐션 없는 성장은 밑 빠진 독에 물 붓기입니다." : "Growth without retention is filling a leaky bucket."}
        </div>
        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>
          {ko ? "MVP를 출시했고 초기 사용자가 생겼다면, 이제 \"이 사람들이 돌아오는가?\"를 증명해야 합니다. 주간 성장률을 체계적으로 추적하고, 가장 큰 레버를 매주 실험해야 합니다." : "If you've launched an MVP and have initial users, now prove they come back. Track weekly growth systematically and experiment on the biggest lever each week."}
        </div>
      </div>
      <div style={{ display: "grid", gap: "6px" }}>
        {(ko ? [
          { num: 1, title: "북극성 지표 선택", desc: "회사 전체가 추적하는 하나의 핵심 숫자 확정" },
          { num: 2, title: "주간 성장 리뷰", desc: "매주 월요일 30분, 지표 확인 + 실험 1개 선택" },
          { num: 3, title: "리텐션 체크", desc: "사용자가 돌아오는지 먼저 확인 → 그 다음 성장" },
        ] : [
          { num: 1, title: "Choose North Star Metric", desc: "The single number the whole company tracks" },
          { num: 2, title: "Weekly Growth Review", desc: "30 min every Monday: metrics + 1 experiment" },
          { num: 3, title: "Retention Check", desc: "Prove users come back before pushing growth" },
        ]).map(s => (
          <div key={s.num} onClick={() => d.setGuideStepIndex(s.num)} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px 14px", borderRadius: "12px", background: "white", border: `1px solid ${MIDNIGHT_BORDER}`, cursor: "pointer" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 640, color: "#0f172a" }}>{s.title}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>{s.desc}</div>
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
            { name: "PMF 테스트", desc: "\"이 제품을 못 쓰면?\" — 40%+가 '매우 실망'이면 PMF 달성. 미달이면 최고 만족 세그먼트에 집중." },
            { name: "AARRR", desc: "Acquisition→Activation→Retention→Revenue→Referral. 가장 나쁜 단계를 먼저 고쳐라." },
            { name: "Unit Economics", desc: "LTV:CAC 비율 — 고객 생애가치(LTV)가 획득비용(CAC)의 3배 이상(LTV/CAC ≥ 3:1)이고 CAC 회수 12개월 이하가 건강한 사업." },
            { name: "OKR", desc: "분기 목표 3개 + 측정 가능한 핵심 결과. 숫자 없는 목표는 목표가 아님." },
          ] : [
            { name: "PMF Test", desc: "\"How'd you feel if you couldn't use this?\" — 40%+ 'very disappointed' = PMF." },
            { name: "AARRR", desc: "Acquisition→Activation→Retention→Revenue→Referral. Fix the worst stage first." },
            { name: "Unit Economics", desc: "LTV:CAC ratio — LTV ≥ 3× CAC (LTV/CAC ≥ 3:1), CAC payback under 12 months = healthy business." },
            { name: "OKR", desc: "3 quarterly objectives + measurable key results. No numbers = no goal." },
          ]).map(f => (
            <div key={f.name} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: MIDNIGHT_SOFT, color: MIDNIGHT, whiteSpace: "nowrap" as const, flexShrink: 0, marginTop: "1px" }}>{f.name}</span>
              <span style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.45 }}>{f.desc}</span>
            </div>
          ))}
        </div>
      </div>
      </>
      )}

      {/* PAGE 1 — 북극성 지표 선택 */}
      {pg === 1 && (
      <div style={{ borderRadius: "20px", border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", overflow: "hidden", boxShadow: "0 1px 3px rgba(25,25,112,0.04)" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>1</div>
            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "북극성 지표를 하나 선택하세요" : "Choose one North Star Metric"}</span>
          </div>
          <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginTop: "6px" }}>
            {ko ? "회사 전체가 추적하는 하나의 핵심 숫자. 이 숫자가 올라가면 사업이 건강한 것입니다." : "The single number the whole company tracks. If it goes up, the business is healthy."}
          </div>
        </div>
        <div style={{ padding: "0 22px 16px", display: "grid", gap: "6px" }}>
          {nsOptions.map(s => {
            const sel = nsType === s.id;
            return (
            <button key={s.id} type="button" onClick={() => chooseNs(s.id)} style={{
              display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px 14px", borderRadius: "12px",
              background: sel ? MIDNIGHT_SOFT : "white",
              border: sel ? `2px solid ${MIDNIGHT}` : `1px solid ${MIDNIGHT_BORDER}`,
              boxShadow: sel ? "0 0 0 3px rgba(25,25,112,0.08)" : "none",
              cursor: "pointer", textAlign: "left" as const, transition: "all 0.2s ease", width: "100%",
            }}>
              <span style={{ fontSize: "11px", fontWeight: 650, padding: "2px 8px", borderRadius: "6px", background: MIDNIGHT_SOFT, color: MIDNIGHT, whiteSpace: "nowrap" as const, flexShrink: 0 }}>{s.type}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{s.metric}</div>
                <div style={{ fontSize: "11px", color: "var(--muted)" }}>{s.ex}</div>
              </div>
              {sel && <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", background: MIDNIGHT, padding: "2px 6px", borderRadius: "4px", flexShrink: 0, marginTop: "2px" }}>✓</span>}
            </button>
            );
          })}
        </div>
        <div style={{ padding: "0 22px 18px" }}>
          <div style={{ padding: "16px 18px", borderRadius: "14px", background: "rgba(248,250,252,0.6)", border: `1.5px solid ${MIDNIGHT_BORDER}` }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
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
                border: `1px solid ${MIDNIGHT_BORDER}`, background: "white",
                fontSize: "14px", outline: "none", color: "#0f172a",
                fontFamily: "inherit",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = MIDNIGHT; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = MIDNIGHT_BORDER; }}
            />
            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px" }}>
              {ko ? "자동 저장됩니다. 이 지표가 운영 대시보드에 표시됩니다." : "Auto-saved. This metric will appear on your dashboard."}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* PAGE 2 — 주간 성장 리뷰 */}
      {pg === 2 && (
      <div style={{ borderRadius: "20px", border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", overflow: "hidden", boxShadow: "0 1px 3px rgba(25,25,112,0.04)" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>2</div>
            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "매주 월요일, 30분 성장 리뷰를 하세요" : "Run a 30-min growth review every Monday"}</span>
          </div>
          <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginTop: "4px" }}>
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
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{s.title}</div>
                <div style={{ fontSize: "11px", color: "var(--muted)" }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ margin: "0 22px 16px", padding: "14px 16px", borderRadius: "14px", background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT_BORDER}` }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.04em", marginBottom: "6px" }}>{ko ? "AI 활용법 — 주간 리뷰 분석" : "AI — Weekly review analysis"}</div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, padding: "8px 12px", borderRadius: "8px", background: "white", fontStyle: "italic" }}>
            {ko ? "\"이번 주 지표: WAU 1,200(+3%), 신규가입 180(+8%), D7 리텐션 18%, 이탈률 12%. 지난 4주 데이터: [붙여넣기]. 1) 가장 우려되는 지표와 원인 가설 3개, 2) 이번 주 집중할 실험 우선순위 3개를 추천해줘.\"" : "\"This week: WAU 1,200(+3%), signups 180(+8%), D7 retention 18%, churn 12%. Last 4 weeks: [paste]. 1) Most concerning metric + 3 hypotheses, 2) Top 3 experiment priorities for this week.\""}
          </div>
        </div>
      </div>
      )}

      {/* PAGE 3 — 리텐션 벤치마크 */}
      {pg === 3 && (
      <div style={{ borderRadius: "20px", border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", overflow: "hidden", boxShadow: "0 1px 3px rgba(25,25,112,0.04)" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>3</div>
            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "리텐션이 먼저입니다" : "Retention comes first"}</span>
          </div>
          <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginTop: "4px" }}>
            {ko ? "리텐션 없이 광고비를 쓰면 돈만 태웁니다. 먼저 사용자가 돌아오는지 확인하세요. (아래 D1/D7/D30은 소비자 앱 참고 곡선 — B2B SaaS는 구독형이라 D30 40%+로 훨씬 높음)" : "Spending on ads without retention burns money. First prove users come back. (D1/D7/D30 below = consumer-app reference curve; B2B SaaS is much higher, ~D30 40%+)"}
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
            <div key={r.period} style={{ padding: "12px", borderRadius: "12px", background: MIDNIGHT_SOFT, textAlign: "center" as const }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const }}>{r.period}</div>
              <div style={{ fontSize: "18px", fontWeight: 740, color: MIDNIGHT }}>{r.good}</div>
              <div style={{ fontSize: "10px", color: "rgba(0,0,0,0.35)" }}>{r.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "0 22px 16px", fontSize: "12px", color: "var(--muted)", lineHeight: 1.55 }}>
          {ko ? "B2B SaaS는 D30 40%+, B2C 앱은 D30 15%+가 양호. 이 기준에 못 미치면 성장보다 제품 개선에 집중하세요." : "B2B SaaS needs D30 40%+, B2C app D30 15%+. Below this, focus on product improvement, not growth."}
        </div>
      </div>
      )}

      {/* ── 2026-05-12: PMF 측정 프레임워크 (Sean Ellis 40% 테스트 + 리텐션 커브) ── */}
      <div style={{ marginTop: 14, padding: "18px 20px", borderRadius: 16, background: "white", border: "1px solid rgba(25,25,112,0.10)", boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.75, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>
          🎯 PMF 측정 — 진짜 PMF 됐는지 확인하는 2가지 방법
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", marginBottom: 10 }}>
          {ko ? '"우리 제품이 PMF 됐을까?" — 감이 아니라 *데이터*로 답하세요' : "Is your product PMF — answer with data, not feel"}
        </div>

        {/* Sean Ellis 40% 테스트 */}
        <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.10)" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: MIDNIGHT, marginBottom: 6 }}>
            ① Sean Ellis 40% 테스트 (정성 — survey 1개 질문)
          </div>
          <div style={{ fontSize: 13, color: "rgba(15,23,42,0.7)", lineHeight: 1.6, marginBottom: 8 }}>
            {ko
              ? '활성 사용자 30+명에게 *단 1개* 질문: **"이 제품을 더 이상 쓸 수 없다면 어떻게 느끼실까요?"** ① 매우 실망 / ② 다소 실망 / ③ 실망 안 함. **40%+ 가 ①번 = PMF 달성**. 수백 스타트업 데이터로 검증된 임계값.'
              : 'Ask 30+ active users *one* question: "How would you feel if you could no longer use [product]?" ① Very disappointed / ② Somewhat / ③ Not. **40%+ ① = PMF achieved**. Validated across hundreds of startups.'}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.55 }}>
            <strong>2026 적용</strong>: ① 분기마다 재측정 (시장 변함) ② 세그먼트 분리 (전체 평균은 거짓말) ③ ICP만 골라 측정 (전체 사용자가 아닌 핵심 ICP의 40%)
          </div>
          <div style={{ marginTop: 8 }}>
            <a href="https://pmfsurvey.com/" target="_blank" rel="noreferrer" style={{ fontSize: 11.5, fontWeight: 600, color: MIDNIGHT, textDecoration: "underline" }}>
              pmfsurvey.com — Sean Ellis 공식 무료 도구
            </a>
          </div>
        </div>

        {/* 리텐션 커브 */}
        <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.10)" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: MIDNIGHT, marginBottom: 6 }}>
            ② 리텐션 커브 (정량 — cohort 차트가 평평해지는가?)
          </div>
          <div style={{ fontSize: 13, color: "rgba(15,23,42,0.7)", lineHeight: 1.6 }}>
            {ko
              ? "월별 cohort 의 활성 사용자 비율 차트를 그렸을 때 — **시간이 지나도 20-50% 선에서 평평해지는지** 확인. 0으로 떨어지면 PMF X. PostHog/Mixpanel/Amplitude 모두 cohort retention 표준 차트 제공."
              : "Plot active users by cohort over time. **Flat-line at 20-50% = PMF**. Drops to 0 = no PMF. PostHog/Mixpanel/Amplitude all have standard cohort retention charts."}
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.6)", padding: "10px 12px", borderRadius: 10, background: "rgba(25,25,112,0.06)", border: "1px solid rgba(25,25,112,0.18)", lineHeight: 1.55 }}>
          ⚠ <strong>임계 미만이면 절대 성장 마케팅 X</strong> — 깨진 양동이에 물 붓는 격. 제품 개선·새 ICP 탐색에 집중. Marc Andreessen: "The only thing that matters is getting to product/market fit. Before, nothing else matters. After, almost nothing else matters."
        </div>
      </div>

      {/* ── 2026-05-12: 2026 B2B SaaS 벤치마크 (사장님 자기 진단용 — Recurly·OpenView·Bessemer 검증) ── */}
      <div style={{ marginTop: 14, padding: "18px 20px", borderRadius: 16, background: "white", border: "1px solid rgba(25,25,112,0.10)", boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.75, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>
          📊 2026 B2B SaaS 벤치마크 — 내가 잘 가고 있는지
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", marginBottom: 12 }}>
          {ko ? "본인 지표를 이 표와 비교 — 시드 단계 기준" : "Compare your metrics — seed-stage benchmarks"}
        </div>
        <div style={{ overflow: "auto" as const }}>
          <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
            <thead>
              <tr style={{ background: "rgba(25,25,112,0.06)" }}>
                <th style={{ padding: "8px 10px", textAlign: "left" as const, fontWeight: 700, color: MIDNIGHT, fontSize: 11.5 }}>지표</th>
                <th style={{ padding: "8px 10px", textAlign: "left" as const, fontWeight: 700, color: MIDNIGHT, fontSize: 11.5 }}>중앙값</th>
                <th style={{ padding: "8px 10px", textAlign: "left" as const, fontWeight: 700, color: "#1d3557", fontSize: 11.5 }}>Top quartile</th>
                <th style={{ padding: "8px 10px", textAlign: "left" as const, fontWeight: 700, color: "var(--muted)", fontSize: 11.5 }}>주의</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric: "LTV:CAC 비율", median: "3:1", top: "4-6:1", note: "2:1 미만 = 적자 구조" },
                { metric: "NRR (순수 매출 유지)", median: "106%", top: "130%+", note: "100% 미만 = 매출 새는 중" },
                { metric: "CAC 회수기간", median: "8.6개월", top: "<6개월", note: "12개월+ = 재정 부담" },
                { metric: "월 churn (B2B)", median: "3.5%", top: "<2%", note: "voluntary 2.6% + involuntary 0.8%" },
                { metric: "D30 리텐션 (B2B)", median: "40%+", top: "60%+", note: "10% 미만 = PMF 미달" },
                { metric: "Burn multiple", median: "<2x", top: "<1x", note: "Net new ARR 대비 burn" },
                { metric: "Early ARR (<$2M) LTV:CAC", median: "2.5:1", top: "3:1", note: "120일 payback" },
                { metric: "Growth ($2-10M) LTV:CAC", median: "3-4:1", top: "5:1", note: "90일 payback" },
              ].map((b, i) => (
                <tr key={b.metric} style={{ borderTop: i === 0 ? "none" : "1px solid rgba(25,25,112,0.06)" }}>
                  <td style={{ padding: "8px 10px", color: "#0f172a", fontWeight: 600 }}>{b.metric}</td>
                  <td style={{ padding: "8px 10px", color: MIDNIGHT, fontWeight: 700, fontVariantNumeric: "tabular-nums" as const }}>{b.median}</td>
                  <td style={{ padding: "8px 10px", color: "#1d3557", fontWeight: 700, fontVariantNumeric: "tabular-nums" as const }}>{b.top}</td>
                  <td style={{ padding: "8px 10px", color: "var(--muted)", fontSize: 11 }}>{b.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>
          출처: Recurly 2025·OpenView 2026·Bessemer State of the Cloud 2026·Pepper Effect 2026
        </div>
      </div>

      {/* ── 2026-05-12: 실패 회복 플레이북 — "막혔어, 어떻게?" 4 시나리오 ── */}
      <div style={{ marginTop: 14, padding: "18px 20px", borderRadius: 16, background: "white", border: "1px solid rgba(182,76,76,0.18)", boxShadow: "0 1px 3px rgba(182,76,76,0.04)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#b64c4c", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>
          🆘 막혔을 때 — 실패 회복 플레이북
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", marginBottom: 4 }}>
          {ko ? "스타트업이 죽는 이유 톱 3 — CB Insights 2026" : "Top 3 reasons startups die — CB Insights 2026"}
        </div>
        <div style={{ fontSize: 12, color: "rgba(15,23,42,0.6)", marginBottom: 12, lineHeight: 1.55 }}>
          {ko
            ? "431개 폐업 분석: ① PMF 못 찾음 (43%) ② 타이밍 (29%) ③ 단위 경제 (19%) ④ 자본 소진 (70%, 단 대부분 위 셋의 결과). 중앙값 22개월 만에 사망. 80%+ 가 \"실패 후 다시 창업\"."
            : "431 deaths analyzed: ① No PMF (43%) ② Bad timing (29%) ③ Unit economics (19%) ④ Out of capital (70%, usually downstream). Median 22 mo to death. 80%+ try again."}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
          {[
            {
              icon: "👻",
              scenario: "MVP 만들었는데 아무도 안 써",
              cause: "ICP 잘못·문제 잘못·시간 잘못",
              actions: [
                "ICP 다시 — 너무 broad? 1개 페르소나로 좁히기",
                "고객 인터뷰 10명 (구매 의향 + 현재 어떻게 해결하는지)",
                "Sean Ellis 40% 테스트 — 임계 미달이면 제품 피벗",
                "Pivot 또는 Kill — 3-6개월 안에 결정",
              ],
            },
            {
              icon: "💸",
              scenario: "투자 거절 — 시드 못 받음",
              cause: "유사 회사 이미 있음·traction 부족·deck 약함",
              actions: [
                "왜 거절했는지 직접 물어보기 (3명 이상 같은 이유 = 진짜 문제)",
                "비지분 자금 우선: 예비창업 1억·청년창업사관학교·TIPS",
                "친구·가족·엔젤 라운드 (1-3명 × 5천만~1억)",
                "$10K MRR 도달 후 재시도 (그때는 거절이 거의 없음)",
              ],
            },
            {
              icon: "👥",
              scenario: "공동창업자랑 갈등",
              cause: "역할 불명·지분 불공평·비전 불일치",
              actions: [
                "1-on-1 정직 대화 (3rd party mediator 권장)",
                "역할·책임·캐스팅보트 서면화 (Notion/Google Doc)",
                "지분 재분배 + vesting 가속 가능성 검토",
                "최악: clean break — vested 지분 회수 + 빠른 이탈",
              ],
            },
            {
              icon: "📉",
              scenario: "Product Hunt 실패·런칭 후 데드 사일런스",
              cause: "분배 빌드 부족·메시지 약함·타이밍 나쁨",
              actions: [
                "1주 후 ConvertKit / Substack 으로 베타 유저 50명 직접 메일",
                "콘텐츠 분배 6주 캘린더 다시 — 트위터·LinkedIn 1일 1포스트",
                "디스콰이엇·Show HN·Reddit (관련 sub) 단계 launch",
                "직접 영업 50건 — 1-on-1 demo 콜드",
              ],
            },
          ].map((s) => (
            <div key={s.scenario} style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(182,76,76,0.03)", border: "1px solid rgba(182,76,76,0.12)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#b64c4c", marginBottom: 2 }}>
                {s.icon} {s.scenario}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6, fontStyle: "italic" as const }}>
                원인: {s.cause}
              </div>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: "rgba(15,23,42,0.7)", lineHeight: 1.55 }}>
                {s.actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55, padding: "8px 10px", borderRadius: 8, background: "rgba(15,23,42,0.03)" }}>
          💡 <strong>핵심 진실</strong>: 죽음의 평균 시점은 마지막 펀딩 후 22개월 — 자금 소진 직전 3-6개월에 위 4가지 중 하나가 일어남. 통계상 80%+ 의 사장님이 실패 후에도 다시 창업. 막혔다고 끝이 아닙니다.
        </div>
      </div>

      {pg === totalPg - 1 && (
      <StageWrapup
        ko={ko}
        nextStageLabelKo="펀드레이징 준비"
        doneItemsKo={[
          { label: "1. 북극성 지표 정의", detail: "사업 본질 반영 1개 지표 + 측정 방법·임계 정의" },
          { label: "2. 주간 리뷰 시스템", detail: "매주 핵심 지표 변화 + 가설·실험 + 학습 로그 공유" },
          { label: "3. 리텐션 측정", detail: "D7·D30·D90 코호트 + B2B SaaS D30 40%+·B2C D30 15%+ 기준" },
          { label: "4. 성장 가설·실험", detail: "Acquisition·Activation·Revenue·Retention·Referral 5축 실험 우선순위" },
        ]}
        verifyItemsKo={[
          "리텐션 미달 — 성장보다 제품 개선 우선, 「깨진 양동이에 물 붓기」 패턴 회피",
          "허영 지표 — DAU·페이지뷰 등 수익·만족 무관 지표 추적 시 잘못된 결정 1순위",
          "유료 광고 — ROAS 200% 미만 시 즉시 중단, 「쓸수록 손해」 패턴 인식",
          "CAC vs LTV — LTV/CAC 3배 미만이면 성장 자제, 단위경제 흑자 보장 후 가속",
          "추적 도구 — Mixpanel·Amplitude 등 셋업, raw 데이터·코호트·funnel 추적 시스템",
          "개인정보 — 행동 트래킹은 적격 동의 별도 수집. 안전조치 위반 시 개인정보보호법 과징금은 '위반 관련 매출'이 아니라 '전체 매출액의 3% 이하'(2023 개정) — 위반 무관 매출은 기업이 입증해야 제외",
        ]}
        nextSummaryKo="북극성·주간 리뷰·리텐션·성장 가설 셋업 완료 → 펀드레이징 준비 단계로 진입"
      />
      )}
    </div>
  );
}
