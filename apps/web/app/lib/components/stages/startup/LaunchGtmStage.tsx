"use client";

/**
 * LaunchGtmStage — 출시 스택 + GTM 전략 (Stage 9)
 *
 * 2026-04 전면 재설계:
 *   • 4페이지 페이지네이션 — 각 페이지가 명확한 책임
 *   • Page 0: 왜·로드맵 (ModePathCard 포함)
 *   • Page 1: 출시 스택 (분석·결제·에러·피드백 4가지)
 *   • Page 2: 첫 100명 사용자 확보 (Airbnb·Stripe·Marc Lou 패턴)
 *   • Page 3: 마케팅 채널 + 콘텐츠 전략 (Build in Public·SEO·광고)
 *
 * 검증 출처 (이중·삼중):
 *   • Paul Graham "Do things that don't scale" (Y Combinator)
 *   • Airbnb 30일 뉴욕 air mattress, Stripe 7-line code
 *   • Marc Lou 트위터 매출 분석 — 콘텐츠 70%+ 매출 기여
 *   • Pieter Levels — Product Hunt + Hacker News 단일 launch 패턴
 *   • Sean Ellis Test 40%+ — PMF 측정 표준
 *   • build.up 사례 — 한국 SaaS 표준 채널 (네이버 블로그·당근·디스콰이엇)
 */

import { useState } from "react";
import {
  BarChart3, CreditCard, MessageSquare, AlertTriangle,
  Target, Users, Megaphone, Sparkles, ExternalLink, Lightbulb, Rocket,
  ShieldCheck, ChevronDown,
  // 추천 기술 스택 아이콘 (role 매핑)
  Palette, Code2, Cloud, Database, Brain, Layers, Search, Terminal, LineChart, Bug, Zap,
  type LucideIcon,
} from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { getRecommendedStack } from "@build-up/shared";
import { ModePathCard } from "./ModePathCard";
import { SecurityChecklist } from "../../knowledge/SecurityChecklist";
import { BuildMethodDialog, BuildMethodTrigger } from "./BuildMethodDialog";
import {
  MIDNIGHT,
  MIDNIGHT_SOFT,
  MIDNIGHT_BORDER,
  StartupKeyActionHero,
  StartupPageNav,
} from "./StartupStageShell";
import { StageWrapup } from "../shared/StageWrapup";

export function LaunchGtmStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const pg = d.guideStepIndex;
  const totalPg = 4;
  const pgLabels = ko
    ? ["왜·로드맵", "출시 스택", "첫 100명", "콘텐츠·채널"]
    : ["Why & Roadmap", "Launch Stack", "First 100", "Content & Channels"];

  const [securityOpen, setSecurityOpen] = useState(false);
  const { softOpenChecks, setSoftOpenChecks } = d;

  return (
    <div className="bento-fade-in" style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* ═══════════════════════════════════════════════════════════
          KEY ACTION HERO
          ═════════════════════════════════════════════════════════ */}
      <StartupKeyActionHero
        eyebrow="KEY ACTION"
        title={ko ? "출시 = 끝이 아니라 시작. 측정·첫 사용자·채널을 깔아야 합니다" : "Launch is the start, not the end"}
        subtitle={
          ko ? (
            <>
              MVP 만들었다고 끝이 아닙니다. <strong style={{ fontWeight: 700 }}>출시 스택 (계측·결제·에러·피드백)</strong> + <strong style={{ fontWeight: 700 }}>첫 100명 직접 영업</strong> + <strong style={{ fontWeight: 700 }}>마케팅 채널 1-2개</strong> 셋팅이 핵심.
            </>
          ) : (
            <>
              MVP done ≠ done. Need <strong>launch stack (analytics·billing·error·feedback)</strong> + <strong>first 100 hands-on</strong> + <strong>1-2 marketing channels</strong>.
            </>
          )
        }
        miniCards={[
          { icon: BarChart3, label: ko ? "출시 스택" : "Stack", detail: ko ? "4가지 도구" : "4 tools" },
          { icon: Users, label: ko ? "첫 100명" : "First 100", detail: ko ? "직접 영업" : "Hand-deliver" },
          { icon: Megaphone, label: ko ? "마케팅 채널" : "Channels", detail: ko ? "1-2개 집중" : "1-2 only" },
        ]}
      />

      {/* ═══════════════════════════════════════════════════════════
          PAGE NAV
          ═════════════════════════════════════════════════════════ */}
      <StartupPageNav
        page={pg}
        totalPages={totalPg}
        labels={pgLabels}
        onChange={(p) => d.setGuideStepIndex(p)}
        ko={ko}
      />

      {/* ═══════════════════════════════════════════════════════════
          PAGE 0 — 왜·로드맵 (ModePathCard 포함)
          ═════════════════════════════════════════════════════════ */}
      {pg === 0 && (
        <>
          <ModePathCard stageId="launch-gtm" />

          {/* WHY 카드 */}
          <Section icon={Lightbulb} title={ko ? "왜 이 단계가 중요한가" : "Why this matters"}>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                {(ko ? [
                  { accent: "#dc2626", title: "출시 후 첫 30일이 PMF 검증의 골든타임", body: "이 30일 동안 사용자 피드백·전환율·리텐션이 명확하지 않으면, 다음 30일도 같습니다. 계측 없이 성장 마케팅 = 소음을 신호로 착각." },
                  { accent: MIDNIGHT, title: "첫 100명은 자동으로 안 옴 — 직접 영업이 표준", body: "Airbnb 가 NYC 에 매주 비행기 타고 갔고, Stripe 는 \"노트북 줘봐\" 직접 설치. Paul Graham 의 \"Do things that don't scale\" 은 옵션이 아니라 필수." },
                  { accent: "#0561fc", title: "마케팅 채널 1-2개에 집중 (10개 X)", body: "Marc Lou 매출 70%+ = 트위터 + 블로그. Pieter Levels = Product Hunt + Hacker News. 채널 분산하면 어디도 깊이 있는 도달 X." },
                ] : [
                  { accent: "#dc2626", title: "First 30 days = PMF validation goldenrun", body: "Without clear feedback/conversion/retention in 30 days, next 30 won't differ. Growth without instrumentation = mistaking noise for signal." },
                  { accent: MIDNIGHT, title: "First 100 won't come automatically — direct sales", body: "Airbnb flew to NYC weekly. Stripe \"give me your laptop\" install. Paul Graham's \"Do things that don't scale\" is mandatory." },
                  { accent: "#0561fc", title: "Focus on 1-2 channels (not 10)", body: "Marc Lou 70%+ revenue = Twitter+blog. Pieter Levels = PH+HN. Diluted channels = no deep reach." },
                ]).map((item, idx, arr) => (
                  <div key={idx}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "100px", background: item.accent, marginTop: "8px", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", lineHeight: 1.4, marginBottom: "4px" }}>{item.title}</div>
                        <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6 }}>{item.body}</div>
                      </div>
                    </div>
                    {idx < arr.length - 1 && <div style={{ height: "1px", background: "rgba(0,0,0,0.05)", marginLeft: "18px", marginTop: "10px" }} />}
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* 4-스텝 로드맵 (페이지 클릭으로 점프) */}
          <Section icon={Rocket} title={ko ? "이 단계 4-스텝 로드맵" : "4-step roadmap"}>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: "8px" }}>
              {(ko ? [
                { num: 1, title: "출시 스택 (분석·결제·에러·피드백)", desc: "다음 페이지에서 자세히 — 4가지 도구 한 번에 셋업.", target: 1 },
                { num: 2, title: "첫 100명 사용자 직접 확보", desc: "DM·콜드 메일·커뮤니티 침투 — Airbnb·Stripe 패턴.", target: 2 },
                { num: 3, title: "마케팅 채널 1-2개 + 콘텐츠 시스템", desc: "Build in Public, SEO 시드, 광고 (옵션).", target: 3 },
                { num: 4, title: "30일 KPI 측정 + Sean Ellis Test 40%+", desc: "북극성 지표 1개 + AARRR — PMF 정량 검증.", target: -1 },
              ] : [
                { num: 1, title: "Launch stack (analytics·billing·error·feedback)", desc: "Next page — 4 tools at once.", target: 1 },
                { num: 2, title: "First 100 users hand-delivered", desc: "DM·cold email·community — Airbnb·Stripe pattern.", target: 2 },
                { num: 3, title: "1-2 marketing channels + content system", desc: "Build in Public, SEO seeds, ads (optional).", target: 3 },
                { num: 4, title: "30-day KPI + Sean Ellis 40%+", desc: "1 north star + AARRR — PMF quantified.", target: -1 },
              ]).map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => s.target >= 0 && d.setGuideStepIndex(s.target)}
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "white",
                    border: `1px solid ${MIDNIGHT_BORDER}`,
                    cursor: s.target >= 0 ? "pointer" : "default",
                    textAlign: "left" as const,
                    width: "100%",
                  }}
                >
                  <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>{s.title}</div>
                    <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                  {s.target >= 0 && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M5 3l4 4-4 4" stroke={MIDNIGHT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* 완료 기준 */}
          <Section icon={Sparkles} title={ko ? "이 단계 완료 기준" : "Completion criteria"}>
            <div style={{ padding: "14px 18px" }}>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.7 }}>
                {(ko ? [
                  "분석 대시보드 라이브 — 가입·핵심액션·이탈 보임",
                  "결제 흐름 작동 (테스트 결제 성공)",
                  "Sentry 에러 알림 Slack 연동",
                  "사용자 피드백 채널 1개 + 첫 피드백 수집",
                  "첫 100명 사용자 + 그중 10명과 1:1 대화",
                  "마케팅 채널 1개에서 매주 콘텐츠 1개+",
                ] : [
                  "Live analytics dashboard",
                  "Payment flow working",
                  "Sentry+Slack errors",
                  "Feedback channel + first feedback",
                  "100 users + 10 deep convos",
                  "1+ post/week on 1 channel",
                ]).map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          </Section>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PAGE 1 — 출시 스택 (4가지 도구 한 번에)
          ═════════════════════════════════════════════════════════ */}
      {pg === 1 && (
        <>
          <Section icon={BarChart3} title={ko ? "출시 직후 깔아야 할 4가지" : "4 must-haves at launch"}>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: "10px" }}>
              {(ko ? [
                {
                  num: 1,
                  Icon: BarChart3,
                  title: "분석 (Analytics)",
                  why: "어디서 오고, 뭘 클릭하고, 어디서 떠나는지. 가입 전환율·핵심 기능 사용률·이탈 지점 3가지를 1주 안에 봐야 함.",
                  todo: ["PostHog 또는 Mixpanel 연결", "핵심 이벤트 5개 정의 (가입·핵심액션·결제·재방문·이탈)", "퍼널 1개 + 주간 대시보드"],
                  tools: [
                    { name: "PostHog", url: "https://posthog.com", price: "무료 1M 이벤트/월" },
                    { name: "Mixpanel", url: "https://mixpanel.com", price: "무료 20M/월" },
                  ],
                },
                {
                  num: 2,
                  Icon: CreditCard,
                  title: "결제·전환 (Billing)",
                  why: "\"사람들이 돈을 낼 것인가?\" 가장 중요한 질문에 답. 결제 안 붙으면 PMF 측정 불가. Stripe = 7줄 코드.",
                  todo: ["가격 결정 (무료 / Free+Pro / 사용량)", "Stripe 연동 + 웹훅", "무료→유료 트리거 (기능·사용량·시간 제한)", "전환 추적 이벤트"],
                  tools: [
                    { name: "Stripe", url: "https://stripe.com", price: "거래당 2.9%+0.3$" },
                    { name: "Lemon Squeezy", url: "https://lemonsqueezy.com", price: "거래당 5%+0.5$" },
                  ],
                },
                {
                  num: 3,
                  Icon: AlertTriangle,
                  title: "에러 모니터링",
                  why: "사용자는 에러 만나면 말 없이 떠남. \"안 쓴다\" 라고 생각한 게 사실은 \"못 쓴 것\" 인 경우 많음. Sentry 10분 셋업.",
                  todo: ["Sentry SDK 설치 (Next.js 공식)", "Slack 알림 연동", "주요 API 응답시간 모니터링", "매일 대시보드 확인 습관"],
                  tools: [
                    { name: "Sentry", url: "https://sentry.io", price: "무료 5K 이벤트/월" },
                    { name: "Vercel Analytics", url: "https://vercel.com/analytics", price: "무료 (Hobby)" },
                  ],
                },
                {
                  num: 4,
                  Icon: MessageSquare,
                  title: "피드백 루프",
                  why: "불만 고객은 말 없이 떠남. 채널이 없으면 왜 떠났는지 영원히 모름. 24시간 환영 메일이 핵심.",
                  todo: ["인앱 피드백 버튼 (1-클릭)", "Discord 또는 카카오 오픈채팅", "가입 24시간 내 환영 + \"뭐가 불편?\"", "주간 정리 + AI 패턴 분석"],
                  tools: [
                    { name: "Intercom", url: "https://intercom.com", price: "스타트업 플랜" },
                    { name: "Discord", url: "https://discord.com", price: "무료" },
                    { name: "Cal.com", url: "https://cal.com", price: "무료 (1:1 미팅)" },
                  ],
                },
              ] : [
                { num: 1, Icon: BarChart3, title: "Analytics", why: "Track origin, clicks, drop-offs.", todo: ["Connect PostHog or Mixpanel", "5 core events", "1 funnel + weekly dashboard"], tools: [{ name: "PostHog", url: "https://posthog.com", price: "Free 1M/mo" }, { name: "Mixpanel", url: "https://mixpanel.com", price: "Free 20M/mo" }] },
                { num: 2, Icon: CreditCard, title: "Billing", why: "Will they pay? Stripe = 7 lines.", todo: ["Pricing decision", "Stripe + webhooks", "Free→paid trigger", "Conversion events"], tools: [{ name: "Stripe", url: "https://stripe.com", price: "2.9%+$0.3" }, { name: "Lemon Squeezy", url: "https://lemonsqueezy.com", price: "5%+$0.5" }] },
                { num: 3, Icon: AlertTriangle, title: "Error Monitoring", why: "Silent churn from errors.", todo: ["Sentry SDK", "Slack alerts", "API timing", "Daily check"], tools: [{ name: "Sentry", url: "https://sentry.io", price: "Free 5K/mo" }, { name: "Vercel Analytics", url: "https://vercel.com/analytics", price: "Free Hobby" }] },
                { num: 4, Icon: MessageSquare, title: "Feedback Loop", why: "Open channel = know why.", todo: ["1-click feedback", "Discord", "24h welcome email", "Weekly digest"], tools: [{ name: "Intercom", url: "https://intercom.com", price: "Startup plan" }, { name: "Discord", url: "https://discord.com", price: "Free" }, { name: "Cal.com", url: "https://cal.com", price: "Free 1:1" }] },
              ]).map((s) => (
                <ToolStepCard key={s.num} num={s.num} Icon={s.Icon} title={s.title} why={s.why} todo={s.todo} tools={s.tools} />
              ))}
            </div>
          </Section>

          {/* 추천 기술 스택 (sub-industry-aware) — Page 1 안에 한 번만 */}
          {(() => {
            const stack = getRecommendedStack(d.selectedIndustryId ?? "ai-application");
            if (!stack) return null;
            return (
              <Section icon={Sparkles} title={ko ? "추천 기술 스택 — 2026 표준" : "Recommended Tech Stack — 2026"}>
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                  {stack.layers.map((l) => (
                    <a
                      key={l.role}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        background: "white",
                        border: `1px solid ${MIDNIGHT_BORDER}`,
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: MIDNIGHT_SOFT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {(() => {
                          const Icon = stackRoleIcon(l.role, l.roleEn);
                          return <Icon size={16} strokeWidth={2.2} color={MIDNIGHT} />;
                        })()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "10.5px", fontWeight: 700, color: MIDNIGHT, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
                          {ko ? l.role : l.roleEn}
                        </div>
                        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a" }}>{l.tool}</div>
                        <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.55)", lineHeight: 1.5 }}>{ko ? l.why.ko : l.why.en}</div>
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, padding: "3px 8px", borderRadius: "6px", background: MIDNIGHT_SOFT, whiteSpace: "nowrap" as const }}>{l.pricing}</div>
                      <ExternalLink size={12} strokeWidth={2.2} color="rgba(15,23,42,0.4)" />
                    </a>
                  ))}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
                    <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.025)" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(0,0,0,0.45)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>{ko ? "총 월 비용" : "Monthly"}</div>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>{stack.totalMonthlyCost}</div>
                    </div>
                    <div style={{ padding: "10px 12px", borderRadius: "10px", background: MIDNIGHT_SOFT }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>{ko ? "스타트업 크레딧" : "Startup Credits"}</div>
                      <div style={{ fontSize: "11.5px", fontWeight: 600, color: MIDNIGHT, marginTop: "2px", lineHeight: 1.5 }}>{ko ? stack.startupCredits.ko : stack.startupCredits.en}</div>
                    </div>
                  </div>
                </div>
              </Section>
            );
          })()}

          {/* ── Collapsible 보안 체크리스트 (47개) — 기본 닫힘, 클릭 시 펼침 ── */}
          <div>
            <button
              type="button"
              onClick={() => setSecurityOpen((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "white",
                border: `1px solid ${MIDNIGHT_BORDER}`,
                cursor: "pointer",
                width: "100%",
                textAlign: "left" as const,
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(25,25,112,0.025)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "white"; }}
            >
              <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: MIDNIGHT_SOFT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ShieldCheck size={16} strokeWidth={2.2} color={MIDNIGHT} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em" }}>
                  {ko ? "보안 체크리스트 (선택)" : "Security Checklist (Optional)"}
                </div>
                <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.55)", marginTop: "1px", lineHeight: 1.4 }}>
                  {ko ? "47개 항목 · AI 프롬프트·SOC2·개인정보·DDoS — 출시 전 검토 권장 (생략 가능)" : "47 items · AI/SOC2/Privacy/DDoS — review before launch (optional)"}
                </div>
              </div>
              <ChevronDown
                size={16}
                strokeWidth={2.4}
                color={MIDNIGHT}
                style={{
                  transform: securityOpen ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.2s ease",
                  flexShrink: 0,
                }}
              />
            </button>
            {securityOpen && (
              <div style={{ marginTop: "10px" }}>
                <SecurityChecklist
                  ko={ko}
                  checks={(softOpenChecks ?? {}) as Record<string, boolean>}
                  onToggle={(id) => {
                    const prev = (softOpenChecks ?? {}) as Record<string, boolean>;
                    const next = { ...prev, [id]: !prev[id] };
                    setSoftOpenChecks(next as never);
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PAGE 2 — 첫 100명 사용자 (GTM 핵심)
          ═════════════════════════════════════════════════════════ */}
      {pg === 2 && (
        <>
          <Section icon={Users} title={ko ? "첫 100명은 자동으로 안 옴 — 직접 가져옵니다" : "First 100 don't come automatically"}>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontSize: "13.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.7, marginBottom: "12px" }}>
                {ko
                  ? "Paul Graham: \"Do things that don't scale.\" 첫 사용자 100명은 1:1 영업이 표준. Airbnb 가 NYC 에 매주 비행기, Stripe \"노트북 줘봐\" 직접 설치. 이 단계를 건너뛰면 1년 후에도 PMF 못 찾습니다."
                  : "Paul Graham: \"Do things that don't scale.\" First 100 = 1:1 sales. Airbnb flew to NYC weekly, Stripe \"give me your laptop\" install. Skip this = no PMF in 1 year."}
              </div>
            </div>
          </Section>

          <Section icon={Target} title={ko ? "5가지 첫 100명 확보 채널" : "5 first-100 channels"}>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: "10px" }}>
              {(ko ? [
                { num: 1, title: "DM 콜드 메일·LinkedIn (B2B 표준)", detail: "타깃 직군 100명에게 1:1 메시지. 응답률 20-30%. \"안녕하세요, [문제] 겪고 계시면 [해결] 도와드릴 수 있어요\". 자동화 X — 직접 작성." },
                { num: 2, title: "기존 네트워크 — 친구·동료·과거 직장", detail: "본인 LinkedIn·카톡·전화번호부에서 50명 추리고 1:1 연락. \"제가 만든 거 한번 봐주실 수 있어요?\" 직접적 부탁이 표준." },
                { num: 3, title: "관련 커뮤니티 침투", detail: "Indie Hackers·Disquiet·디시인사이드·맘카페·관련 카카오 오픈채팅. 가치 제공 후 (질문 답·자료 공유) 부드럽게 자기 제품 언급." },
                { num: 4, title: "Product Hunt 론칭 (글로벌 1순위)", detail: "Product Hunt 화요일·수요일 0시 PT 론칭. 헌터 섭외 사전 필수. Top 5 들면 1주에 5K-10K 방문." },
                { num: 5, title: "Hacker News \"Show HN\" (개발자·B2B SaaS)", detail: "news.ycombinator.com/show. 솔직한 한 문장 제목 + 직접 제작 스토리. Top 30 들면 100K+ 방문 가능." },
              ] : [
                { num: 1, title: "Cold DM/LinkedIn (B2B)", detail: "100 1:1 messages. 20-30% response. No automation." },
                { num: 2, title: "Existing network", detail: "50 from your contacts. Direct ask." },
                { num: 3, title: "Community infiltration", detail: "IndieHackers·Reddit·Discord. Provide value first." },
                { num: 4, title: "Product Hunt launch", detail: "Tue/Wed 12am PT. Top 5 = 5-10K visits/week." },
                { num: 5, title: "HN Show HN", detail: "Top 30 = 100K+ visits." },
              ]).map((s) => (
                <div key={s.num} style={{ display: "flex", gap: "12px", padding: "12px 14px", borderRadius: "12px", background: "white", border: `1px solid ${MIDNIGHT_BORDER}` }}>
                  <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginBottom: "3px" }}>{s.title}</div>
                    <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55 }}>{s.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 검증된 사례 박스 */}
          <Section icon={Lightbulb} title={ko ? "검증된 사례 — Airbnb·Stripe·Marc Lou" : "Verified cases"}>
            <div style={{ padding: "14px 18px", fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.7 }}>
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                <li><strong>Airbnb 2008</strong> — NYC 에 매주 비행기 타고 호스트 1:1 만남. 시리얼 상자 팔아 $30K 만들어 YC 들어감.</li>
                <li><strong>Stripe 2010</strong> — \"노트북 줘봐\" 라며 첫 고객 매장 가서 직접 설치. 7줄 코드의 시작.</li>
                <li><strong>Marc Lou 2022~</strong> — 트위터에 매주 빌드 인 퍼블릭, $0 마케팅으로 $70K MRR. 매출 70%+ 가 트위터·블로그.</li>
                <li><strong>Pieter Levels 2014~</strong> — Photo AI $1M ARR 솔로. Product Hunt + 트위터 + 빌드 로그가 채널 전부.</li>
              </ul>
            </div>
          </Section>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PAGE 3 — 마케팅 채널 + 콘텐츠 시스템
          ═════════════════════════════════════════════════════════ */}
      {pg === 3 && (
        <>
          <Section icon={Megaphone} title={ko ? "1-2개 채널에 집중하세요 (10개 X)" : "Focus on 1-2 channels (not 10)"}>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontSize: "13.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.7 }}>
                {ko
                  ? "10개 채널에 1만큼씩 = 어디도 깊이 없음. 1-2개에 10만큼 = 그 채널의 알고리즘이 본인을 푸시. Marc Lou 매출 70%+ = 트위터+블로그. Pieter Levels = Product Hunt+트위터. 분산은 적."
                  : "10 channels with 1 effort each = no depth. 1-2 with 10 effort = the algo pushes you. Marc Lou: 70% from twitter+blog only."}
              </div>
            </div>
          </Section>

          {/* 채널별 상세 */}
          <Section icon={Sparkles} title={ko ? "검증된 채널 5가지 — 본인 1-2개 선택" : "5 channels — pick 1-2"}>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: "10px" }}>
              {(ko ? [
                {
                  Icon: Sparkles,
                  title: "Build in Public — 트위터/X (Marc Lou·Pieter Levels)",
                  bestFor: "B2B SaaS · 글로벌 · 영어 OK",
                  cadence: "주 5-7회 트윗 + 주 1회 매출 공개",
                  why: "트위터 알고리즘이 \"투명성 + 진정성\" 콘텐츠를 푸시. 매출·실패·교훈 공유. 고객 + 동료 + 투자자 한 번에.",
                  example: "Marc Lou: 매주 매출 그래프 공개 → 0 → $70K/월. \"솔로 + 0 직원\" 공개 자체가 컨텐츠."
                },
                {
                  Icon: BarChart3,
                  title: "SEO 시드 + 블로그 (Long-term, 6개월+)",
                  bestFor: "B2B · 정보형 · 검색 의도 명확",
                  cadence: "주 1-2회 깊은 글 (1500-3000자)",
                  why: "Google 검색 = 의도 100%. \"카페 매출 분석 도구\" 검색 사용자 = 즉시 잠재 고객. 6개월 누적 시 매월 수천 방문.",
                  example: "Help-me 블로그 — 법률 키워드 SEO 1위 다수. 매일 자연 트래픽 5K+. 6개월 차이 후 폭발."
                },
                {
                  Icon: Users,
                  title: "한국 커뮤니티 — 디스콰이엇·당근·맘카페",
                  bestFor: "한국 시장 · 1인 인디 · B2C",
                  cadence: "주 1-2회 가치 제공 + 부드러운 자기 제품 언급",
                  why: "디스콰이엇 = 한국 인디 해커 모임 #1 (스타트업 2K+). 당근 비즈니스 = 동네 매장. 맘카페 = 키즈·유아 SaaS.",
                  example: "build.up — 디스콰이엇 빌드 로그로 첫 100명 확보. 당근 비즈니스 = 동네 카페·미용실 마케팅 표준."
                },
                {
                  Icon: Megaphone,
                  title: "Product Hunt + Hacker News 단일 론칭",
                  bestFor: "글로벌 · B2B SaaS · 화제성",
                  cadence: "1회성 론칭 (월간·분기간)",
                  why: "Product Hunt Top 5 = 5K-10K 방문/주. HN Top 30 = 100K+ 가능. 단일 론칭 효과 큼 — 사전 헌터·커뮤니티 준비 필수.",
                  example: "Cursor — HN 론칭 후 24시간에 신규 가입 50K+. Lovable 도 PH 1위 후 폭발."
                },
                {
                  Icon: CreditCard,
                  title: "유료 광고 — Google Ads / Meta (옵션)",
                  bestFor: "PMF 입증 후 + 단가 큰 B2B",
                  cadence: "월 $300-1000 시작 → ROAS 보고 확장",
                  why: "PMF 전 광고 = 돈 태우기. 유료 전환률 5%+ + LTV $300+ 일 때만 시작. 첫 100명은 무료 채널로.",
                  example: "Notion — 시리즈A 후 본격 광고. 인디 인디 단계는 절대 X (자기 자본 소진)."
                },
              ] : [
                { Icon: Sparkles, title: "Build in Public — Twitter/X", bestFor: "B2B SaaS, global", cadence: "5-7/wk + weekly revenue", why: "Algo pushes transparency.", example: "Marc Lou: 0→$70K/mo public." },
                { Icon: BarChart3, title: "SEO + Blog", bestFor: "B2B info-seeking", cadence: "1-2 deep posts/wk", why: "Search intent = 100%.", example: "Compounds at 6mo." },
                { Icon: Users, title: "Korean communities", bestFor: "KR market", cadence: "1-2/wk value-add", why: "Disquiet, Karrot.", example: "build.up first 100." },
                { Icon: Megaphone, title: "PH + HN single launch", bestFor: "Global B2B", cadence: "Once/qtr", why: "Top 5 PH = 5-10K visits.", example: "Cursor HN explosion." },
                { Icon: CreditCard, title: "Paid ads (optional)", bestFor: "Post-PMF, big LTV", cadence: "$300-1K/mo start", why: "Don't burn before PMF.", example: "Notion post-Series A only." },
              ]).map((c, i) => (
                <div key={i} style={{ padding: "14px 16px", borderRadius: "12px", background: "white", border: `1px solid ${MIDNIGHT_BORDER}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: MIDNIGHT_SOFT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <c.Icon size={14} strokeWidth={2.4} color={MIDNIGHT} />
                    </div>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em" }}>{c.title}</div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, marginBottom: "8px" }}>
                    <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "2px 8px", borderRadius: "5px", background: MIDNIGHT_SOFT, color: MIDNIGHT }}>적합: {c.bestFor}</span>
                    <span style={{ fontSize: "10.5px", fontWeight: 600, padding: "2px 8px", borderRadius: "5px", background: "rgba(0,0,0,0.05)", color: "rgba(15,23,42,0.6)" }}>주기: {c.cadence}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, marginBottom: "6px" }}>{c.why}</div>
                  <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.55)", lineHeight: 1.55, fontStyle: "italic" as const, paddingLeft: "10px", borderLeft: `2px solid ${MIDNIGHT_BORDER}` }}>
                    {ko ? "사례: " : "Ex: "}{c.example}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 콘텐츠 시스템 */}
          <Section icon={Lightbulb} title={ko ? "콘텐츠 시스템 — 매주 작동하는 루틴" : "Content system"}>
            <div style={{ padding: "14px 18px" }}>
              <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.7 }}>
                {(ko ? [
                  "월요일: 1주 KPI 정리 (가입·매출·이탈) → 트위터 매출 그래프 공개",
                  "화-목: 빌드·고객 인사이트·실패 공유 (3-5개 트윗)",
                  "금: 깊은 블로그 글 1개 (1500자+) — 검색 키워드 1개에 답",
                  "토-일: 휴식 또는 다음 주 콘텐츠 사전 작성",
                  "AI 활용: Claude/ChatGPT 로 초안 작성 후 본인 톤으로 수정",
                ] : [
                  "Mon: Weekly KPI → Twitter graph",
                  "Tue-Thu: Build/insight/failure (3-5 tweets)",
                  "Fri: 1 deep blog post (1500+ words)",
                  "Sat-Sun: Rest or pre-write",
                  "AI: Claude/ChatGPT for drafts, adjust to your voice",
                ]).map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          </Section>
        </>
      )}

      {/* PAGE 4 (실제 출시) 는 별도 stage `go-live` 로 분리됨. */}
      {false && (
        <>
          <Section icon={Rocket} title={ko ? "출시는 어렵습니다 — 5가지 방법 각각 다른 절차" : "Launching is hard"}>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontSize: "13.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.7, marginBottom: "12px" }}>
                {ko ? "별도 stage 로 분리됨" : "Moved to go-live stage"}
              </div>
            </div>
          </Section>

          {/* 5가지 출시 방법 미리보기 */}
          <Section icon={Sparkles} title={ko ? "5가지 출시 채널 — 본인 제품 매칭" : "5 launch channels"}>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: "10px" }}>
              {(ko ? [
                { num: 1, Icon: Cloud, title: "웹 출시 (도메인·SSL·SEO)", time: "1-3시간", cost: "도메인 1-2만/년", desc: "Vercel·Cloudflare 1-클릭 배포 + SEO 메타 + Search Console. 모든 SaaS 의 시작." },
                { num: 2, Icon: Sparkles, title: "Apple App Store (iOS)", time: "3-7일", cost: "$99/년", desc: "Xcode 26 + iOS 26 SDK 의무 (2026.4.28부터, Apple Developer 공식). TestFlight + App Store Connect. 평균 24h 리뷰지만 최근 7-30일 지연." },
                { num: 3, Icon: Sparkles, title: "Google Play (Android)", time: "2-3주", cost: "$25 일회성", desc: "12명 테스터 14일 폐쇄 테스트 의무 (개인 계정). User Engagement Time 측정 — 가짜 테스터 X." },
                { num: 4, Icon: Megaphone, title: "Product Hunt 론칭", time: "준비 2주 + 24h", cost: "무료", desc: "화·수 0시 PT 론칭. 헌터 사전 섭외 필수. Top 5 = 5K-10K 방문, Top 1 = 50K+ 가능." },
                { num: 5, Icon: Megaphone, title: "Hacker News \"Show HN\"", time: "준비 1일 + 8h 모니터링", cost: "무료", desc: "솔직한 한 문장 + 직접 제작 스토리. Top 30 = 100K+ 방문. 1주 후에도 SEO 효과." },
              ] : [
                { num: 1, Icon: Cloud, title: "Web Launch", time: "1-3hr", cost: "$10-20/yr", desc: "Vercel/CF deploy + SEO + Search Console." },
                { num: 2, Icon: Sparkles, title: "Apple App Store", time: "3-7d", cost: "$99/yr", desc: "Xcode 26 + iOS 26 SDK mandatory (eff. 2026-04-28). 7-30 day delays in 2026.3." },
                { num: 3, Icon: Sparkles, title: "Google Play", time: "2-3wk", cost: "$25 one-time", desc: "12 testers x 14-day closed testing required." },
                { num: 4, Icon: Megaphone, title: "Product Hunt", time: "2wk + 24h", cost: "Free", desc: "Tue/Wed 12am PT. Top 5 = 5-10K visits/wk." },
                { num: 5, Icon: Megaphone, title: "HN Show HN", time: "1d + 8h", cost: "Free", desc: "Top 30 = 100K+ visits." },
              ]).map((c) => (
                <div key={c.num} style={{ display: "flex", gap: "12px", padding: "12px 14px", borderRadius: "12px", background: "white", border: `1px solid ${MIDNIGHT_BORDER}` }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: MIDNIGHT_SOFT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <c.Icon size={16} strokeWidth={2.2} color={MIDNIGHT} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, padding: "2px 7px", borderRadius: "5px", background: MIDNIGHT_SOFT, flexShrink: 0 }}>{c.num}</span>
                      <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em" }}>{c.title}</span>
                      <span style={{ fontSize: "10.5px", fontWeight: 600, color: "rgba(15,23,42,0.55)", padding: "1px 6px", borderRadius: "4px", background: "rgba(0,0,0,0.04)" }}>{c.time}</span>
                      <span style={{ fontSize: "10.5px", fontWeight: 600, color: "rgba(15,23,42,0.55)", padding: "1px 6px", borderRadius: "4px", background: "rgba(0,0,0,0.04)" }}>{c.cost}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55 }}>{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 권장 시나리오 */}
          <Section icon={Lightbulb} title={ko ? "본인 제품에 맞는 채널 추천" : "Recommended by product type"}>
            <div style={{ padding: "14px 18px", fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.75 }}>
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                <li><strong>웹 SaaS (대다수)</strong> → ① 웹 + ④ Product Hunt + ⑤ HN. 모바일 앱은 안 만들어도 됨.</li>
                <li><strong>모바일 앱 (B2C)</strong> → ① 웹 (랜딩) + ② Apple + ③ Google + ④ Product Hunt. iOS·Android 동시 권장.</li>
                <li><strong>개발자 도구</strong> → ① 웹 + ⑤ HN (1순위) + ④ Product Hunt. HN 이 가장 큰 화제성.</li>
                <li><strong>한국 시장 위주</strong> → ① 웹 + 디스콰이엇 빌드 로그 (Page 3 참고). PH·HN 효과 작음.</li>
                <li><strong>1인 인디</strong> → 무리하지 말고 ① 웹 + ⑤ HN 또는 ④ PH 1개만. 둘 다 풀 가동 어려움.</li>
              </ul>
            </div>
          </Section>
        </>
      )}

      <StageWrapup
        ko={ko}
        nextStageLabelKo="런타임 운영"
        doneItemsKo={[
          { label: "1. 출시 스택 4종 셋업", detail: "분석(Mixpanel·Amplitude)·결제(Stripe)·에러(Sentry)·피드백(Canny)" },
          { label: "2. 첫 100명 확보 전략", detail: "Airbnb·Stripe·Marc Lou 패턴 — Do things that don't scale" },
          { label: "3. 런칭 채널 결정", detail: "웹·PH·HN·디스콰이엇·SEO 5축 비교 후 1~2개 집중" },
          { label: "4. 콘텐츠·Build in Public", detail: "트위터·블로그·뉴스레터 — 매출 70%+ 콘텐츠 기여 패턴" },
        ]}
        verifyItemsKo={[
          "보안 — Product Hunt·HN 출시 시 트래픽 폭증, OWASP Top 10·DDoS·Rate limit 사전 대비",
          "법적 — GDPR·개인정보보호법 사전 준수, 글로벌 출시 시 EU·미국 사용자 데이터 처리",
          "약관·환불 — 7일 이내 청약철회·환불 명시, SaaS 정기 결제도 cancel 룰 명확",
          "지재권 — 도메인·상표 사전 확보, 출시 후 squat 위험",
          "Product Hunt — 「런칭 1회」 룰, 두 번 시도 시 어카운트 정지 위험",
          "데이터 백업 — 출시 직후 데이터 손실 시 신뢰 회복 불가, 다중 백업 + 복구 시뮬",
        ]}
        nextSummaryKo="출시 스택·첫 100명·콘텐츠 셋업 완료 → 런타임 운영 단계로 진입"
      />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────
 * stackRoleIcon — 추천 기술 스택 role → Lucide 아이콘 (Apple-style)
 * ───────────────────────────────────────────────────────────────── */
function stackRoleIcon(role: string, roleEn: string): LucideIcon {
  const key = `${role} ${roleEn}`.toLowerCase();
  if (key.includes("디자인") || key.includes("design")) return Palette;
  if (key.includes("프론트") || key.includes("frontend") || key.includes("ui")) return Code2;
  if (key.includes("배포") || key.includes("deploy") || key.includes("hosting")) return Cloud;
  if (key.includes("백엔드") || key.includes("db") || key.includes("backend") || key.includes("database")) return Database;
  if (key.includes("ai 엔진") || key.includes("ai engine") || key.includes("llm")) return Brain;
  if (key.includes("ai 프레임워크") || key.includes("framework") || key.includes("sdk")) return Layers;
  if (key.includes("벡터") || key.includes("rag") || key.includes("search") || key.includes("검색")) return Search;
  if (key.includes("코딩") || key.includes("ide") || key.includes("editor")) return Terminal;
  if (key.includes("분석") || key.includes("analytics") || key.includes("metric")) return LineChart;
  if (key.includes("에러") || key.includes("error") || key.includes("monitoring")) return Bug;
  if (key.includes("결제") || key.includes("billing") || key.includes("payment")) return CreditCard;
  if (key.includes("피드백") || key.includes("feedback") || key.includes("chat")) return MessageSquare;
  if (key.includes("보안") || key.includes("security")) return ShieldCheck;
  if (key.includes("이메일") || key.includes("email") || key.includes("mail")) return MessageSquare;
  return Zap; // fallback
}

/* ───────────────────────────────────────────────────────────────────
 * Local primitives
 * ───────────────────────────────────────────────────────────────── */
function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", padding: "0 4px" }}>
        <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: MIDNIGHT_SOFT, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} strokeWidth={2.2} color={MIDNIGHT} />
        </div>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>{title}</div>
      </div>
      <div style={{ background: "white", borderRadius: "14px", border: `1px solid ${MIDNIGHT_BORDER}`, overflow: "hidden", boxShadow: "0 1px 3px rgba(25,25,112,0.04)" }}>
        {children}
      </div>
    </div>
  );
}

function ToolStepCard({
  num,
  Icon,
  title,
  why,
  todo,
  tools,
}: {
  num: number;
  Icon: LucideIcon;
  title: string;
  why: string;
  todo: string[];
  tools: { name: string; url: string; price: string }[];
}) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: "12px", background: "white", border: `1px solid ${MIDNIGHT_BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{num}</div>
        <Icon size={16} strokeWidth={2.2} color={MIDNIGHT} />
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em" }}>{title}</div>
      </div>
      <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, marginBottom: "10px", paddingLeft: "36px" }}>{why}</div>
      <div style={{ paddingLeft: "36px", marginBottom: "8px" }}>
        <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.65 }}>
          {todo.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </div>
      <div style={{ paddingLeft: "36px", display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
        {tools.map((t) => (
          <a
            key={t.name}
            href={t.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 10px",
              borderRadius: "8px",
              background: MIDNIGHT_SOFT,
              border: `1px solid ${MIDNIGHT_BORDER}`,
              fontSize: "11.5px",
              fontWeight: 600,
              color: MIDNIGHT,
              textDecoration: "none",
            }}
          >
            <strong style={{ fontWeight: 700 }}>{t.name}</strong>
            <span style={{ color: "rgba(15,23,42,0.55)" }}>· {t.price}</span>
            <ExternalLink size={11} strokeWidth={2.2} />
          </a>
        ))}
      </div>
    </div>
  );
}
