"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, X, MessageSquare } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

/**
 * FloatingAIPartner — 사장님이 언제든 말 거는 AI 경영 파트너 (오른쪽 하단 떠있는 챗봇)
 *
 * Closed: 56px 원형 FAB (오른쪽 하단 24px 여백)
 * Open: 380×580 글래스모피즘 채팅 패널
 * Animation: Apple iOS spring (cubic-bezier(0.16, 1, 0.3, 1))
 *
 * 디자인 레퍼런스:
 * - Intercom/Zendesk: bottom-right FAB 표준
 * - Apple iOS: glassmorphism + 스프링 이징
 * - Linear: 미니멀 + backdrop blur
 *
 * Backend: /api/ai/quick-query (rate-limit 분당 10회, 한 번 호출 = 한 메시지)
 */

/**
 * AI 파트너에게 전달할 사장님 가게 종합 컨텍스트.
 * 필드는 모두 optional — useDashboard 에서 실시간으로 모아 주입.
 *
 * 서버는 이 컨텍스트를 그대로 quick-query API 로 보내고, AI 가 모든 데이터를
 * 함께 보면서 정밀한 답변을 생성한다.
 */
export type AIPartnerContext = {
  // 가게 기본
  storeName?: string;
  industryCategoryId?: string;
  industryLabel?: string;
  industrySubIndustryId?: string;
  startupType?: string;
  businessLaunched?: boolean;
  daysSinceLaunch?: number;
  /** 운영 단계 — pre-launch/early(0-30d)/growth(30-90d)/mature(90d+) — AI 코칭 톤 결정 */
  operatingPhase?: "pre-launch" | "early" | "growth" | "mature";
  region?: string;
  selectedBudget?: number;
  // 매출/비용
  monthlySales?: number;
  monthlyCosts?: number;
  marginPct?: number;
  monthlyCostBreakdown?: Record<string, number>;
  yesterdaySales?: number;
  weeklyChange?: number;
  weekdayChange?: number;
  /** 매출 트렌드 방향 — improving/declining/stable/insufficient */
  salesTrendDirection?: "improving" | "declining" | "stable" | "insufficient";
  /** 비용 구조 추세 — 이번달 prime cost rate vs 지난달 (% 차) */
  primeRateDeltaPct?: number;
  /** 지난달 prime cost rate (현재월 비교 기준) */
  prevPrimeRate?: number;
  primeRate?: number;
  runway?: number;
  businessHealthScore?: "healthy" | "caution" | "danger" | "unknown";
  // 운영
  employeeCount?: number;
  lowStockItems?: string[];
  upcomingFixedExpenses?: string[];
  pendingTaxEvents?: string[];
  /** 사장님이 아직 안 써본 Found.One 기능들 (priority 정렬) — AI 가 자연스럽게 안내 가능 */
  unusedFeatures?: string[];
  // 마케팅
  totalMarketingSpend?: number;
  activeChannels?: string[];
  marketingRoas?: number;
  unansweredReviews?: number;
  daysSinceLastSnsPost?: number;
  // 이상 신호
  activeAnomalies?: Array<{ kind: string; severity: "critical" | "warning" | "info"; headline: string }>;
  // 프랜차이즈
  franchiseBrandId?: string;
  franchiseBrandName?: string;
  franchiseAvgMonthlyRevenue?: number;
  franchiseTopMonthlyRevenue?: number;
  // 로드맵
  currentRoadmapStage?: string;
  completedRoadmapCount?: number;
  isPreLaunch?: boolean;
  // 활동
  customerInterviewCount?: number;
  yesterdayTimeAllocation?: { customerPct: number; operationsPct: number; marketingPct: number };
};

type Props = {
  ko: boolean;
  context: AIPartnerContext;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  nextAction?: string;
  confidence?: "high" | "medium" | "low";
  referencedCase?: { id: string; name: string };
  timestamp: number;
};

const DAILY_LIMIT = 10;

const SUGGESTIONS_KO = [
  "이번 달 이익이 왜 줄었어?",
  "할인 행사 해야 할까?",
  "직원 한 명 더 뽑을 여유 있어?",
  "지금 광고 늘려도 될까?",
];

const SUGGESTIONS_EN = [
  "Why did profit drop this month?",
  "Should I run a discount?",
  "Can I afford one more hire?",
  "Should I increase ad spend?",
];

/** "내일 오전 10시에" / "in 4h 23min" 같은 부드러운 리셋 안내 */
function formatResetTime(resetAt: number | null, ko: boolean): string {
  if (!resetAt) return ko ? "내일" : "Tomorrow";
  const now = Date.now();
  const diff = resetAt - now;
  if (diff <= 0) return ko ? "지금" : "Now";

  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  if (ko) {
    if (hours >= 1) return `${hours}시간 ${minutes > 0 ? minutes + "분" : ""} 후`;
    return `${minutes}분 후`;
  }
  if (hours >= 1) return `in ${hours}h ${minutes > 0 ? minutes + "min" : ""}`;
  return `in ${minutes}min`;
}

export function FloatingAIPartner({ ko, context }: Props) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [resetAt, setResetAt] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = ko ? SUGGESTIONS_KO : SUGGESTIONS_EN;
  const limitReached = remaining !== null && remaining <= 0;

  // 자동 스크롤 — 새 메시지 추가될 때마다 맨 아래로
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  // 패널 열렸을 때 input 자동 포커스
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 320);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // 패널 열렸을 때 남은 회수 조회 (GET /api/ai/quick-query)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch("/api/ai/quick-query", {
          method: "GET",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { remaining: number; limit: number; resetAt: number };
        if (cancelled) return;
        setRemaining(data.remaining);
        setResetAt(data.resetAt);
      } catch {
        // silent — UI 는 remaining null 일 때 회수 표시 숨김
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  const handleAsk = async (q?: string) => {
    const finalQ = (q ?? question).trim();
    if (!finalQ || loading || limitReached) return;

    // 사용자 메시지 즉시 추가
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: finalQ,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);
    setError(null);
    setHasSeenIntro(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError(ko ? "로그인이 필요합니다" : "Sign in required");
        return;
      }
      const res = await fetch("/api/ai/quick-query", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          question: finalQ,
          ...context,
          language: ko ? "ko" : "en",
        }),
      });
      const data = await res.json().catch(() => ({}));

      // 429 — 한도 초과 (일일 또는 분당)
      if (res.status === 429) {
        const remainingFromHeader = res.headers.get("X-RateLimit-Remaining");
        const resetFromHeader = res.headers.get("X-RateLimit-Reset");
        if (remainingFromHeader !== null) setRemaining(Number(remainingFromHeader));
        if (resetFromHeader !== null) setResetAt(Number(resetFromHeader) * 1000);
        setError(data?.error ?? (ko ? "한도를 초과했습니다" : "Rate limit reached"));
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }

      // remaining/resetAt 업데이트 (서버가 같이 보냄)
      if (typeof data.remaining === "number") setRemaining(data.remaining);
      if (typeof data.resetAt === "number") setResetAt(data.resetAt);

      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: data.answer ?? "",
        nextAction: data.nextAction,
        confidence: data.confidence,
        referencedCase: data.referencedCase,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("[FloatingAIPartner]", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* ───────── Closed state: FAB (Floating Action Button) ───────── */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={ko ? "AI 파트너에게 묻기" : "Ask AI Partner"}
          className="fap-fab"
        >
          {/* 펄스 글로우 (배경 ring) */}
          <span className="fap-fab-pulse" aria-hidden />
          {/* 메인 원 — 미드나이트 블루 그라데이션 위 스타일리시 B */}
          <span className="fap-fab-inner">
            <span className="fap-b-mark" aria-hidden>B</span>
          </span>
          {/* 호버 시 라벨 */}
          <span className="fap-fab-tooltip">
            {ko ? "AI 파트너" : "AI Partner"}
          </span>
        </button>
      )}

      {/* ───────── Open state: Chat panel ───────── */}
      {open && (
        <div className="fap-panel" role="dialog" aria-modal="false" aria-label={ko ? "AI 파트너 채팅" : "AI Partner Chat"}>
          {/* Header */}
          <header className="fap-header">
            <div className="fap-header-left">
              <div className="fap-header-icon">
                <span className="fap-b-mark-sm" aria-hidden>B</span>
              </div>
              <div>
                <div className="fap-header-title">
                  {ko ? "AI 경영 파트너" : "AI Partner"}
                </div>
                <div className="fap-header-sub">
                  <span className="fap-online-dot" />
                  {ko ? "데이터 기반으로 답변" : "Data-aware"}
                  {remaining !== null && (
                    <span className={`fap-remaining ${limitReached ? "fap-remaining-empty" : ""}`}>
                      · {ko ? `오늘 ${remaining}/${DAILY_LIMIT}회` : `${remaining}/${DAILY_LIMIT} today`}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="fap-close"
              aria-label={ko ? "닫기" : "Close"}
            >
              <X size={15} strokeWidth={2.2} />
            </button>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="fap-messages">
            {/* Empty / Intro state */}
            {messages.length === 0 && !loading && (
              <div className="fap-intro">
                <div className="fap-intro-icon">
                  <MessageSquare size={20} color="#191970" strokeWidth={1.8} />
                </div>
                <div className="fap-intro-title">
                  {ko ? "무엇이든 편하게 물어보세요" : "Ask me anything"}
                </div>
                <div className="fap-intro-sub">
                  {ko
                    ? "사장님 가게 데이터를 함께 보고 즉시 답변드립니다."
                    : "I'll answer using your store's actual numbers."}
                </div>
              </div>
            )}

            {/* Conversation */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={msg.role === "user" ? "fap-msg fap-msg-user" : "fap-msg fap-msg-ai"}
              >
                <div className={msg.role === "user" ? "fap-bubble fap-bubble-user" : "fap-bubble fap-bubble-ai"}>
                  <div className="fap-bubble-text">{msg.text}</div>
                  {msg.nextAction && msg.role === "assistant" && (
                    <div className="fap-next-action">
                      <span className="fap-next-action-label">{ko ? "다음 행동" : "Next"}</span>
                      <span className="fap-next-action-text">{msg.nextAction}</span>
                    </div>
                  )}
                  {msg.confidence === "low" && msg.role === "assistant" && (
                    <div className="fap-confidence-low">
                      {ko ? "ⓘ 데이터가 부족해 추측 포함된 답변입니다" : "ⓘ Limited data — answer includes assumptions"}
                    </div>
                  )}
                  {msg.referencedCase && msg.role === "assistant" && (
                    <div className="fap-case-badge-wrap">
                      <span className="fap-case-badge">
                        <span className="fap-case-badge-label">{ko ? "사례" : "Case"}</span>
                        <span className="fap-case-badge-dot">·</span>
                        <span>{msg.referencedCase.name}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="fap-msg fap-msg-ai">
                <div className="fap-bubble fap-bubble-ai fap-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="fap-error">
                <span>⚠ {error}</span>
                <button type="button" onClick={() => setError(null)}>
                  <X size={11} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>

          {/* Suggestions (only when empty) */}
          {messages.length === 0 && !hasSeenIntro && !loading && (
            <div className="fap-suggestions">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAsk(s)}
                  className="fap-suggestion-chip"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* 한도 도달 안내 (input 위에 띠 형태) */}
          {limitReached && (
            <div className="fap-limit-banner">
              <div className="fap-limit-banner-title">
                {ko ? "오늘의 AI 채팅을 모두 사용하셨습니다" : "Daily AI chat limit reached"}
              </div>
              <div className="fap-limit-banner-sub">
                {ko
                  ? `하루 ${DAILY_LIMIT}회 한도를 두어 AI 의존도를 균형 있게 유지합니다. ${formatResetTime(resetAt, ko)} 다시 만나요.`
                  : `Limited to ${DAILY_LIMIT}/day to keep AI use balanced. ${formatResetTime(resetAt, ko)}.`}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="fap-input-area">
            <div className={`fap-input-wrap ${limitReached ? "fap-input-wrap-disabled" : ""}`}>
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
                placeholder={
                  limitReached
                    ? (ko ? "내일 다시 만나요" : "See you tomorrow")
                    : (ko ? "메시지 보내기..." : "Send a message...")
                }
                maxLength={500}
                disabled={loading || limitReached}
                className="fap-input"
              />
              <button
                type="button"
                onClick={() => handleAsk()}
                disabled={!question.trim() || loading || limitReached}
                className={`fap-send ${question.trim() && !loading && !limitReached ? "fap-send-active" : ""}`}
                aria-label={ko ? "보내기" : "Send"}
              >
                {loading ? <Loader2 size={14} className="fap-spin" /> : <Send size={14} strokeWidth={2.2} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Keyframes & all CSS (scoped via class names) ─────────────────────
//   Color palette: Midnight Blue luxury gradient
//   - #0a1929 (deep midnight)
//   - #102a43 (Tailwind slate-blue)
//   - #191970 (brand primary midnight)
//   - #2c4a7a (lighter midnight)
//   - #3b5c8c (steel blue accent)
const KEYFRAMES = `
@keyframes fapFadeIn {
  from { opacity: 0; transform: translateY(8px) scale(.96); filter: blur(4px); }
  to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
@keyframes fapPanelIn {
  from { opacity: 0; transform: translateY(20px) scale(.94); transform-origin: bottom right; filter: blur(8px); }
  to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
@keyframes fapPulse {
  0% { transform: scale(1); opacity: 0.45; }
  100% { transform: scale(1.6); opacity: 0; }
}
@keyframes fapTypingDot {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}
@keyframes fapMsgIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fapSpin {
  to { transform: rotate(360deg); }
}

/* ===== B 레터 마크 — 멋있는 스타일리시 B (Pretendard Black 900 + italic lean) ===== */
.fap-b-mark {
  font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif;
  font-size: 28px;
  font-weight: 900;
  font-style: italic;
  letter-spacing: -0.08em;
  color: #fff;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0,0,0,0.18);
  display: inline-block;
  transform: translateY(-1px) translateX(-1px);
}
.fap-b-mark-sm {
  font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif;
  font-size: 16px;
  font-weight: 900;
  font-style: italic;
  letter-spacing: -0.08em;
  color: #fff;
  line-height: 1;
  text-shadow: 0 0.5px 1px rgba(0,0,0,0.15);
  display: inline-block;
  transform: translateY(-0.5px) translateX(-0.5px);
}

/* ===== FAB (closed state) ===== */
.fap-fab {
  position: fixed;
  right: 24px; bottom: 24px;
  width: 56px; height: 56px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
  animation: fapFadeIn .42s cubic-bezier(0.16, 1, 0.3, 1);
}
.fap-fab-pulse {
  position: absolute; inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(25,25,112,0.65) 0%, rgba(25,25,112,0) 70%);
  animation: fapPulse 2.6s ease-out infinite;
  pointer-events: none;
}
.fap-fab-inner {
  position: relative;
  width: 56px; height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0a1929 0%, #191970 55%, #3b5c8c 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 14px rgba(10,25,41,0.45),
              0 12px 32px rgba(25,25,112,0.3),
              inset 0 1px 0 rgba(255,255,255,0.18),
              inset 0 -1px 0 rgba(0,0,0,0.15);
  transition: transform .22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow .22s ease;
}
.fap-fab:hover .fap-fab-inner {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(10,25,41,0.55),
              0 16px 40px rgba(25,25,112,0.38),
              inset 0 1px 0 rgba(255,255,255,0.24),
              inset 0 -1px 0 rgba(0,0,0,0.18);
}
.fap-fab:active .fap-fab-inner {
  transform: scale(0.96);
}
.fap-fab-tooltip {
  position: absolute;
  right: calc(100% + 12px); top: 50%;
  transform: translateY(-50%) translateX(8px);
  padding: 6px 12px; border-radius: 8px;
  background: rgba(15,23,42,0.92);
  color: #fff;
  font-size: 12px; font-weight: 600;
  white-space: nowrap;
  letter-spacing: -0.01em;
  opacity: 0; pointer-events: none;
  transition: opacity .18s ease, transform .18s ease;
  backdrop-filter: blur(8px);
}
.fap-fab:hover .fap-fab-tooltip {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

/* ===== Chat panel (open state) ===== */
.fap-panel {
  position: fixed;
  right: 24px; bottom: 24px;
  width: 380px; height: 580px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 48px);
  border-radius: 24px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.6);
  box-shadow: 0 1px 0 rgba(255,255,255,0.4) inset,
              0 20px 60px rgba(15,23,42,0.18),
              0 4px 14px rgba(15,23,42,0.06);
  display: flex; flex-direction: column;
  overflow: hidden;
  z-index: 9999;
  font-family: var(--font-pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  animation: fapPanelIn .36s cubic-bezier(0.16, 1, 0.3, 1);
}
@media (max-width: 480px) {
  .fap-panel {
    right: 12px; left: 12px; bottom: 12px;
    width: auto;
    height: 78vh;
  }
}

/* ===== Header ===== */
.fap-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 0.5px solid rgba(15,23,42,0.06);
  background: rgba(255,255,255,0.5);
  backdrop-filter: blur(12px);
}
.fap-header-left {
  display: flex; align-items: center; gap: 10px;
}
.fap-header-icon {
  width: 30px; height: 30px; border-radius: 10px;
  background: linear-gradient(135deg, #0a1929 0%, #191970 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 6px rgba(10,25,41,0.35),
              inset 0 0.5px 0 rgba(255,255,255,0.22),
              inset 0 -0.5px 0 rgba(0,0,0,0.12);
}
.fap-header-title {
  font-size: 13.5px; font-weight: 700; color: #0f172a;
  letter-spacing: -0.01em; line-height: 1.2;
}
.fap-header-sub {
  display: flex; align-items: center; gap: 5px;
  font-size: 10.5px; color: rgba(15,23,42,0.5); font-weight: 550;
  margin-top: 2px; letter-spacing: -0.01em;
}
.fap-online-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 2px rgba(34,197,94,0.18);
}
.fap-remaining {
  margin-left: 4px;
  font-size: 10.5px; font-weight: 600;
  color: rgba(15,23,42,0.5);
  letter-spacing: -0.005em;
  font-variant-numeric: tabular-nums;
}
.fap-remaining-empty {
  color: #b91c1c;
}
.fap-close {
  width: 28px; height: 28px; border-radius: 8px;
  border: none; background: transparent;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgba(15,23,42,0.5);
  transition: background .15s ease, color .15s ease;
}
.fap-close:hover {
  background: rgba(15,23,42,0.06);
  color: #0f172a;
}

/* ===== Messages area ===== */
.fap-messages {
  flex: 1;
  overflow-y: auto;
  padding: 18px 16px 8px;
  display: flex; flex-direction: column; gap: 10px;
  scroll-behavior: smooth;
}
.fap-messages::-webkit-scrollbar { width: 0; }
.fap-messages { scrollbar-width: none; }

.fap-intro {
  display: flex; flex-direction: column; align-items: center;
  text-align: center;
  padding: 32px 16px 20px;
  gap: 8px;
}
.fap-intro-icon {
  width: 48px; height: 48px; border-radius: 14px;
  background: linear-gradient(135deg, rgba(25,25,112,0.1), rgba(44,74,122,0.06));
  border: 0.5px solid rgba(25,25,112,0.18);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.fap-intro-title {
  font-size: 14.5px; font-weight: 700; color: #0f172a;
  letter-spacing: -0.02em;
}
.fap-intro-sub {
  font-size: 12px; color: rgba(15,23,42,0.55);
  line-height: 1.5; max-width: 240px;
  letter-spacing: -0.01em;
}

/* ===== Message bubbles ===== */
.fap-msg {
  display: flex;
  animation: fapMsgIn .32s cubic-bezier(0.16, 1, 0.3, 1);
}
.fap-msg-user { justify-content: flex-end; }
.fap-msg-ai { justify-content: flex-start; }

.fap-bubble {
  max-width: 86%;
  padding: 10px 13px;
  border-radius: 16px;
  font-size: 13.5px; line-height: 1.5;
  letter-spacing: -0.01em;
  word-wrap: break-word;
}
.fap-bubble-user {
  background: linear-gradient(135deg, #191970 0%, #2c4a7a 100%);
  color: #fff;
  border-bottom-right-radius: 6px;
  box-shadow: 0 2px 8px rgba(25,25,112,0.3),
              inset 0 0.5px 0 rgba(255,255,255,0.12);
  font-weight: 500;
}
.fap-bubble-ai {
  background: rgba(15,23,42,0.04);
  color: #0f172a;
  border-bottom-left-radius: 6px;
  border: 0.5px solid rgba(15,23,42,0.04);
  font-weight: 500;
}
.fap-bubble-text {
  margin: 0;
}

.fap-next-action {
  margin-top: 8px; padding: 8px 10px; border-radius: 10px;
  background: rgba(255,255,255,0.6);
  border: 0.5px solid rgba(25,25,112,0.15);
  display: flex; align-items: center; gap: 8px;
  font-size: 11.5px;
}
.fap-next-action-label {
  font-size: 9.5px; font-weight: 700; color: #191970;
  letter-spacing: 0.06em; text-transform: uppercase;
  flex-shrink: 0;
}
.fap-next-action-text {
  color: #0f172a; font-weight: 600; line-height: 1.4;
}
.fap-confidence-low {
  margin-top: 6px;
  font-size: 10.5px; color: rgba(15,23,42,0.45);
  font-style: italic;
}

/* ===== K-히트 사례 배지 (AI 답변에 인용했을 때) ===== */
.fap-case-badge-wrap {
  margin-top: 8px;
}
.fap-case-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 999px;
  background: rgba(25,25,112,0.07);
  border: 0.5px solid rgba(25,25,112,0.18);
  font-size: 10.5px; font-weight: 650; color: #191970;
  letter-spacing: -0.01em;
}
.fap-case-badge-label {
  opacity: 0.65; font-size: 10px;
}
.fap-case-badge-dot {
  opacity: 0.4;
}

/* ===== 한도 도달 안내 띠 ===== */
.fap-limit-banner {
  margin: 0 16px 8px;
  padding: 12px 14px; border-radius: 12px;
  background: linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(220,38,38,0.03) 100%);
  border: 0.5px solid rgba(220,38,38,0.18);
}
.fap-limit-banner-title {
  font-size: 12.5px; font-weight: 700; color: #b91c1c;
  letter-spacing: -0.01em;
  margin-bottom: 3px;
}
.fap-limit-banner-sub {
  font-size: 11px; color: rgba(127,29,29,0.7);
  line-height: 1.45; letter-spacing: -0.005em;
}

/* Disabled input wrap */
.fap-input-wrap-disabled {
  background: rgba(15,23,42,0.03) !important;
  border-color: rgba(15,23,42,0.08) !important;
}

/* Typing indicator */
.fap-typing {
  display: flex; gap: 4px; padding: 12px 14px;
  align-items: center;
}
.fap-typing span {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(25,25,112,0.55);
  animation: fapTypingDot 1.2s ease-in-out infinite;
}
.fap-typing span:nth-child(2) { animation-delay: 0.15s; }
.fap-typing span:nth-child(3) { animation-delay: 0.3s; }

/* Error toast */
.fap-error {
  display: flex; justify-content: space-between; align-items: center;
  margin: 4px 0;
  padding: 8px 12px; border-radius: 10px;
  background: rgba(220,38,38,0.06);
  color: #dc2626;
  font-size: 11.5px; font-weight: 600;
}
.fap-error button {
  background: none; border: none; cursor: pointer; color: #dc2626;
  display: flex; align-items: center;
}

/* ===== Suggestions ===== */
.fap-suggestions {
  display: flex; flex-wrap: wrap; gap: 5px;
  padding: 0 16px 12px;
}
.fap-suggestion-chip {
  font-size: 11.5px; font-weight: 600;
  padding: 6px 11px; border-radius: 999px;
  background: rgba(25,25,112,0.06);
  color: #191970;
  border: 0.5px solid rgba(25,25,112,0.15);
  cursor: pointer; white-space: nowrap;
  transition: background .15s ease, transform .12s ease;
  letter-spacing: -0.01em;
  font-family: inherit;
}
.fap-suggestion-chip:hover {
  background: rgba(25,25,112,0.12);
  transform: translateY(-1px);
}
.fap-suggestion-chip:active {
  transform: translateY(0);
}

/* ===== Input area ===== */
.fap-input-area {
  padding: 12px 16px 16px;
  border-top: 0.5px solid rgba(15,23,42,0.06);
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(12px);
}
.fap-input-wrap {
  display: flex; gap: 8px; align-items: center;
  padding: 6px 6px 6px 14px;
  border-radius: 22px;
  background: rgba(255,255,255,0.95);
  border: 0.5px solid rgba(15,23,42,0.1);
  transition: border-color .15s ease, box-shadow .15s ease;
}
.fap-input-wrap:focus-within {
  border-color: rgba(25,25,112,0.45);
  box-shadow: 0 0 0 3px rgba(25,25,112,0.08);
}
.fap-input {
  flex: 1;
  padding: 6px 0;
  border: none; background: transparent;
  font-size: 13.5px; font-weight: 500; color: #0f172a;
  outline: none;
  font-family: inherit;
  letter-spacing: -0.01em;
}
.fap-input::placeholder {
  color: rgba(15,23,42,0.35);
}
.fap-input:disabled {
  color: rgba(15,23,42,0.4);
}
.fap-send {
  width: 32px; height: 32px; border-radius: 50%;
  border: none;
  background: rgba(15,23,42,0.05);
  color: rgba(15,23,42,0.3);
  cursor: not-allowed;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all .18s cubic-bezier(0.16, 1, 0.3, 1);
}
.fap-send-active {
  background: linear-gradient(135deg, #191970 0%, #2c4a7a 100%) !important;
  color: #fff !important;
  cursor: pointer !important;
  box-shadow: 0 2px 8px rgba(25,25,112,0.4),
              inset 0 0.5px 0 rgba(255,255,255,0.18);
}
.fap-send-active:hover {
  transform: scale(1.06);
  box-shadow: 0 4px 12px rgba(25,25,112,0.5),
              inset 0 0.5px 0 rgba(255,255,255,0.22);
}
.fap-send-active:active {
  transform: scale(0.95);
}
.fap-spin {
  animation: fapSpin 0.8s linear infinite;
}
`;
