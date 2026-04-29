"use client";

import { useState } from "react";
import { BarChart3, CreditCard, MessageSquare } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { getRecommendedStack } from "@build-up/shared";
import { ModePathCard } from "./ModePathCard";
import { StartupKeyActionHero, StartupPageNav, StartupReferenceLabel } from "./StartupStageShell";

export function LaunchGtmStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const pg = d.guideStepIndex;
  const totalPg = 5;
  const pgLabels = ko
    ? ["왜 중요한가", "1. 분석 연결", "2. 결제·전환", "3. 에러 모니터링", "4. 피드백 루프"]
    : ["Why", "1. Analytics", "2. Billing", "3. Errors", "4. Feedback"];

  const [mvpToolsOpen, setMvpToolsOpen] = useState(false);

  const stepBullets = (items: string[], color: string) => (
    <div style={{ display: "grid", gap: "4px", marginBottom: "12px" }}>
      {items.map(t => (
        <div key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "8px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0, marginTop: "7px" }} />
          <span style={{ fontSize: "14px", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>{t}</span>
        </div>
      ))}
    </div>
  );

  const toolLink = (t: { name: string; desc: string; url: string; color: string }) => (
    <a key={t.name} href={t.url} target="_blank" rel="noreferrer" style={{ display: "flex", gap: "8px", padding: "10px 12px", borderRadius: "10px", background: `${t.color}04`, border: `1px solid ${t.color}10`, textDecoration: "none", color: "inherit" }}>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{t.name}</div>
        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{t.desc}</div>
      </div>
    </a>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* ── 모드별 경로 카드 (최상단) ── */}
      <ModePathCard stageId="launch-gtm" />

      {/* KEY ACTION 미드나이트 hero */}
      <StartupKeyActionHero
        eyebrow="KEY ACTION"
        title={ko ? "계측 없이 성장을 밀지 마세요" : "Don't push growth without instrumentation"}
        subtitle={
          ko
            ? "MVP 출시 후 4가지를 깔아야 의미 있는 의사결정이 가능합니다: 분석, 결제, 에러 모니터링, 피드백 루프."
            : "After MVP launch, install 4 things to enable real decisions: analytics, billing, error monitoring, and feedback loop."
        }
        miniCards={[
          { icon: BarChart3, label: ko ? "분석" : "Analytics", detail: ko ? "행동 추적" : "Track behavior" },
          { icon: CreditCard, label: ko ? "결제" : "Billing", detail: ko ? "지불 의사 검증" : "WTP test" },
          { icon: MessageSquare, label: ko ? "피드백" : "Feedback", detail: ko ? "이탈 이유" : "Why leave" },
        ]}
      />

      <StartupReferenceLabel>
        {ko ? "↓ 심화 참고 — 출시 스택·분석·결제·모니터링 표준 도구" : "↓ Reference — launch stack, analytics, billing, monitoring"}
      </StartupReferenceLabel>

      {/* 페이지 네비 */}
      <StartupPageNav
        page={pg}
        totalPages={totalPg}
        labels={pgLabels}
        onChange={(p) => d.setGuideStepIndex(p)}
        ko={ko}
      />

      {/* PAGE 0 — WHY */}
      {pg === 0 && (
      <>
      <div style={{ borderRadius: "20px", border: "1px solid rgba(220,38,38,0.08)", background: "linear-gradient(180deg, rgba(220,38,38,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{ko ? "왜 이 단계가 중요한가" : "Why this matters"}</span>
        </div>
        <div style={{ padding: "16px 18px", borderRadius: "16px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.08)" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
            {ko ? "계측 없이 성장을 밀면, 소음을 신호로 착각합니다." : "Pushing growth without instrumentation means mistaking noise for signal."}
          </div>
          <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>
            {ko ? "MVP를 출시했다면, 이제 4가지를 깔아야 합니다: 분석, 결제, 에러 모니터링, 피드백 루프. 이 4가지가 있어야 의미 있는 의사결정이 가능합니다." : "After launching MVP, you need 4 things: analytics, billing, error monitoring, and feedback loop. These 4 enable meaningful decisions."}
          </div>
        </div>
      </div>
      {/* 4단계 로드맵 미리보기 */}
      <div style={{ display: "grid", gap: "6px" }}>
        {(ko ? [
          { num: 1, title: "분석(Analytics) 연결", desc: "사용자 행동 추적 — 어디서 오고, 뭘 하고, 어디서 떠나는지", color: "#2563eb" },
          { num: 2, title: "결제 · 전환 흐름 세팅", desc: "\"사람들이 돈을 낼 것인가?\" 이 질문에 답하기", color: "#059669" },
          { num: 3, title: "에러 모니터링 연결", desc: "사용자가 겪는 에러를 실시간으로 파악", color: "#d97706" },
          { num: 4, title: "고객 피드백 루프 구축", desc: "불만 고객은 말 없이 떠남 — 채널을 열어야 이유를 앎", color: "#7c3aed" },
        ] : [
          { num: 1, title: "Connect Analytics", desc: "Track user behavior — where they come, what they do, where they leave", color: "#2563eb" },
          { num: 2, title: "Set up Billing", desc: "Answer: \"Will people pay?\"", color: "#059669" },
          { num: 3, title: "Error Monitoring", desc: "Know what breaks, in real time", color: "#d97706" },
          { num: 4, title: "Feedback Loop", desc: "Unhappy users leave silently — open a channel", color: "#7c3aed" },
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
      {/* 완료 기준 */}
      <div style={{ borderRadius: "16px", border: "1px solid rgba(15,23,42,0.06)", background: "rgba(255,255,255,0.95)", padding: "16px 18px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "이 단계 완료 기준" : "Completion criteria"}</div>
        <div style={{ display: "grid", gap: "4px" }}>
          {(ko ? [
            "분석 대시보드에서 주간 지표 확인 가능",
            "결제 또는 전환 흐름이 작동 (테스트 결제 성공)",
            "에러 발생 시 Slack 알림 수신",
            "사용자 피드백 채널이 열려있고 첫 피드백 수집 완료",
          ] : [
            "Weekly metrics visible in analytics dashboard",
            "Payment/conversion flow working (test payment success)",
            "Slack alert on errors",
            "Feedback channel open with first feedback collected",
          ]).map(dd => (
            <div key={dd} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "3px" }}><circle cx="7" cy="7" r="6" stroke="#059669" strokeWidth="1.4"/><path d="M4.5 7l1.8 1.8 3.2-3.6" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>{dd}</span>
            </div>
          ))}
        </div>
      </div>
      </>
      )}

      {/* PAGE 1 — 분석 (Analytics) */}
      {pg === 1 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>1</div>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "분석(Analytics) 연결" : "Connect Analytics"}</div>
          </div>
        </div>
        <div style={{ padding: "0 22px 14px" }}>
          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(37,99,235,0.04)", marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>
              {ko ? "사용자가 어디서 오고, 뭘 클릭하고, 어디서 떠나는지 추적하세요. 가입 전환율, 핵심 기능 사용률, 이탈 지점 — 이 3가지를 첫 주에 볼 수 있어야 합니다. 감이 아닌 데이터로 판단해야 합니다." : "Track where users come from, what they click, where they leave. Signup conversion, core feature usage, drop-off points — see these in week 1."}
            </div>
          </div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "이 단계에서 할 일" : "What to do"}</div>
          {stepBullets(ko ? [
            "Mixpanel 또는 PostHog 연결 (이벤트 기반 분석)",
            "핵심 이벤트 5개 정의: 가입, 핵심액션, 결제, 재방문, 이탈",
            "퍼널(Funnel) 1개 세팅: 가입 → 핵심 액션 → 재방문",
            "주간 대시보드 만들기 — 매주 월요일 확인",
          ] : [
            "Connect Mixpanel or PostHog (event-based analytics)",
            "Define 5 core events: signup, core action, payment, return, churn",
            "Set up 1 funnel: signup → core action → return",
            "Build weekly dashboard — check every Monday",
          ], "#2563eb")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {toolLink({ name: "Mixpanel", desc: ko ? "이벤트 기반 분석. 무료 20M 이벤트/월" : "Event analytics. Free 20M events/mo", url: "https://mixpanel.com", color: "#7c3aed" })}
            {toolLink({ name: "PostHog", desc: ko ? "오픈소스. 분석+세션 리플레이+A/B 테스트" : "Open source. Analytics+session replay+A/B", url: "https://posthog.com", color: "#2563eb" })}
          </div>
        </div>
      </div>
      )}

      {/* PAGE 2 — 결제 (Billing) */}
      {pg === 2 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>2</div>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "결제 · 전환 흐름 세팅" : "Set up billing & conversion"}</div>
          </div>
        </div>
        <div style={{ padding: "0 22px 14px" }}>
          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(5,150,105,0.04)", marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>
              {ko ? "무료 사용자가 유료로 전환하는 지점을 설계하세요. 결제가 안 붙어있으면 가장 중요한 질문에 답할 수 없습니다. Stripe는 7줄 코드로 결제를 연동할 수 있습니다." : "Design the point where free users convert to paid. Without billing, you can't answer: \"Will people pay?\" Stripe connects in 7 lines of code."}
            </div>
          </div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "이 단계에서 할 일" : "What to do"}</div>
          {stepBullets(ko ? [
            "가격 정책 결정: 무료 / 프리미엄(Free+Pro) / 사용량 기반",
            "Stripe 연동 — 결제 페이지, 구독 관리, 웹훅 설정",
            "무료→유료 전환 트리거 설계 (기능 제한 / 사용량 제한 / 시간 제한)",
            "결제 전환율 추적 이벤트 추가 (가격 페이지 방문 → 결제 시작 → 완료)",
          ] : [
            "Decide pricing: free / freemium / usage-based",
            "Integrate Stripe — checkout, subscription, webhooks",
            "Design free→paid trigger (feature/usage/time limit)",
            "Add conversion tracking events",
          ], "#059669")}
          {toolLink({ name: "Stripe", desc: ko ? "글로벌 결제 표준. 한국 원화 지원. 7줄 코드로 연동" : "Global payment standard. KRW supported. 7 lines to integrate", url: "https://stripe.com", color: "#635bff" })}
        </div>
      </div>
      )}

      {/* PAGE 3 — 에러 모니터링 */}
      {pg === 3 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(217,119,6,0.08)", background: "linear-gradient(180deg, rgba(217,119,6,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#d97706", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>3</div>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "에러 모니터링 연결" : "Connect error monitoring"}</div>
          </div>
        </div>
        <div style={{ padding: "0 22px 14px" }}>
          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(217,119,6,0.04)", marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>
              {ko ? "사용자가 에러를 겪으면 말 없이 떠납니다. Sentry를 연결하면 어떤 에러가 어디서 몇 번 발생하는지 실시간으로 알 수 있습니다. 초기 스타트업에서 \"사용자가 안 쓴다\"고 생각한 것이 사실은 \"에러 때문에 못 쓴 것\"인 경우가 매우 많습니다." : "Users leave silently when they hit errors. Sentry shows what errors happen, where, how often."}
            </div>
          </div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "이 단계에서 할 일" : "What to do"}</div>
          {stepBullets(ko ? [
            "Sentry 연결 — Next.js SDK 설치 (10분이면 끝)",
            "Slack 알림 연동 — 에러 발생 시 즉시 알림",
            "주요 API 응답 시간 모니터링 (Vercel Analytics 무료)",
            "매일 에러 대시보드 확인 습관 만들기",
          ] : [
            "Connect Sentry — Next.js SDK install (10 min)",
            "Slack alert integration — instant error notifications",
            "Monitor key API response times (Vercel Analytics free)",
            "Build daily error dashboard check habit",
          ], "#d97706")}
          {toolLink({ name: "Sentry", desc: ko ? "에러 모니터링 표준. 무료 5K 이벤트/월. Next.js 공식 지원" : "Error monitoring standard. Free 5K events/mo. Next.js support", url: "https://sentry.io", color: "#d97706" })}
        </div>
      </div>
      )}

      {/* PAGE 4 — 고객 피드백 루프 */}
      {pg === 4 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)", background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>4</div>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "고객 피드백 루프 구축" : "Build customer feedback loop"}</div>
          </div>
        </div>
        <div style={{ padding: "0 22px 14px" }}>
          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(124,58,237,0.04)", marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", color: "rgba(15,23,42,0.65)", lineHeight: 1.7 }}>
              {ko ? "사용자가 불편을 말할 수 있는 채널이 항상 열려 있어야 합니다. 불만 고객은 말하지 않고 떠납니다 — 채널이 없으면 왜 떠났는지 영원히 모릅니다." : "Users must always have a channel to report issues. Unhappy users leave silently — without a channel, you'll never know why."}
            </div>
          </div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>{ko ? "이 단계에서 할 일" : "What to do"}</div>
          {stepBullets(ko ? [
            "앱 내 피드백 버튼 추가 (\"의견 보내기\" — 클릭 한 번으로)",
            "Discord 또는 카카오 오픈채팅방 개설 — 초기 사용자 커뮤니티",
            "가입 후 24시간 내 환영 이메일 + \"뭐가 불편했나요?\" 질문",
            "주간 피드백 정리 — AI로 패턴 분석 후 우선순위 결정",
          ] : [
            "Add in-app feedback button (one click to send)",
            "Create Discord or community channel for early users",
            "Welcome email within 24h + \"What was frustrating?\"",
            "Weekly feedback digest — AI pattern analysis + prioritize",
          ], "#7c3aed")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {toolLink({ name: "Intercom", desc: ko ? "인앱 채팅 + 이메일 자동화. 스타트업 무료 플랜" : "In-app chat + email. Startup free plan", url: "https://intercom.com", color: "#2563eb" })}
            {toolLink({ name: "Discord", desc: ko ? "커뮤니티 무료 구축. 초기 사용자와 직접 대화" : "Free community. Talk directly with early users", url: "https://discord.com", color: "#5865F2" })}
          </div>
        </div>
      </div>
      )}

      {/* 추천 기술 스택 — 3개 미리보기 + 더보기 */}
      {(() => {
        const stack = getRecommendedStack(d.selectedIndustryId ?? "ai-application");
        if (!stack) return null;
        const layerCard = (layer: typeof stack.layers[0], i: number) => (
          <a key={layer.role} href={layer.url} target="_blank" rel="noopener noreferrer" style={{
            display: "flex", alignItems: "center", gap: "10px", padding: "8px 0",
            borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.04)" : "none",
            textDecoration: "none", color: "inherit",
          }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: `${layer.color}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>{layer.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: layer.color, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{ko ? layer.role : layer.roleEn}</div>
              <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{layer.tool}</div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", lineHeight: 1.4 }}>{ko ? layer.why.ko : layer.why.en}</div>
            </div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(15,23,42,0.4)", whiteSpace: "nowrap" as const, flexShrink: 0 }}>{layer.pricing}</div>
          </a>
        );
        const previewLayers = stack.layers.slice(0, 3);
        const restLayers = stack.layers.slice(3);
        return (
          <div style={{ marginTop: "4px", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.05)", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.35)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>
                <span style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.4)", letterSpacing: "0.04em" }}>{ko ? "추천 기술 스택" : "Tech Stack"}</span>
                <span style={{ fontSize: "10px", fontWeight: 650, padding: "1px 5px", borderRadius: "4px", background: "rgba(124,58,237,0.06)", color: "#7c3aed" }}>2026</span>
              </div>
              <div>{previewLayers.map((l, i) => layerCard(l, i))}</div>
            </div>
            {restLayers.length > 0 && (
              <div style={{ padding: "8px 14px 12px" }}>
                <button type="button" onClick={() => setMvpToolsOpen(!mvpToolsOpen)} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", width: "100%",
                  padding: "7px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.06)",
                  background: "transparent", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "rgba(0,0,0,0.4)",
                }}>
                  {mvpToolsOpen ? (ko ? "접기" : "Less") : (ko ? `+${restLayers.length}개 더보기 · 총 월 ${stack.totalMonthlyCost}` : `+${restLayers.length} more · ${stack.totalMonthlyCost}/mo`)}
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ transform: mvpToolsOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}>
                    <path d="M3 5l4 4 4-4" stroke="rgba(15,23,42,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {mvpToolsOpen && (
                  <div style={{ marginTop: "6px", animation: "bentoFadeIn 0.2s ease" }}>
                    {restLayers.map((l, i) => layerCard(l, i))}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "8px" }}>
                      <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(15,23,42,0.02)" }}>
                        <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, marginBottom: "2px" }}>{ko ? "총 월 비용" : "Monthly"}</div>
                        <div style={{ fontSize: "15px", fontWeight: 740, color: "#0f172a" }}>{stack.totalMonthlyCost}</div>
                      </div>
                      <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(5,150,105,0.03)" }}>
                        <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, marginBottom: "2px" }}>{ko ? "크레딧" : "Credits"}</div>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "#059669", lineHeight: 1.4 }}>{ko ? stack.startupCredits.ko : stack.startupCredits.en}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {restLayers.length === 0 && <div style={{ height: "12px" }} />}
          </div>
        );
      })()}
    </div>
  );
}
