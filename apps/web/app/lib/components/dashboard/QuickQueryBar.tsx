"use client";

import { useState } from "react";
import { Sparkles, Send, Loader2, X } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

/**
 * QuickQueryBar — 사장님이 자연어로 묻는 즉시 답변창.
 *
 * MorningBriefing 하단에 위치.
 *
 * "이번 달 마진이 왜 떨어졌어?" "할인 행사 해야 할까?" "직원 한 명 더 뽑을 여유 있나?"
 * 같은 자연 질문에 데이터 기반 + 거장 지혜 인용으로 짧고 명확하게 답변.
 *
 * Backend: /api/ai/quick-query (rate-limit 분당 10회)
 */

type Props = {
  ko: boolean;
  context: {
    storeName?: string;
    industryLabel?: string;
    monthlySales?: number;
    monthlyCosts?: number;
    marginPct?: number;
    runway?: number;
    weeklyChange?: number;
    activeAnomalies?: Array<{ kind: string; headline: string }>;
  };
};

type AnswerState = {
  answer: string;
  nextAction?: string;
  confidence: "high" | "medium" | "low";
};

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

export function QuickQueryBar({ ko, context }: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<AnswerState | null>(null);

  const suggestions = ko ? SUGGESTIONS_KO : SUGGESTIONS_EN;

  const handleAsk = async (q?: string) => {
    const finalQ = (q ?? question).trim();
    if (!finalQ || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as AnswerState;
      setAnswer(data);
      if (q) setQuestion(finalQ);  // 추천 질문 클릭 시 입력창에도 표시
    } catch (err) {
      console.error("[quick-query]", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={card}>
      <div style={headerRow}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={iconWrap}>
            <Sparkles size={14} color="#fff" strokeWidth={1.5} />
          </div>
          <div>
            <div style={eyebrow}>{ko ? "AI 파트너에게 묻기" : "Ask AI Partner"}</div>
            <div style={subtitle}>{ko ? "자연어로 물어보세요. 데이터 기반으로 답변드립니다." : "Ask in natural language."}</div>
          </div>
        </div>
      </div>

      {/* 입력창 */}
      <div style={inputRow}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
          placeholder={ko ? "예: 이번 달 마진이 왜 떨어졌어?" : "e.g., Why did margin drop this month?"}
          maxLength={500}
          disabled={loading}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={() => handleAsk()}
          disabled={!question.trim() || loading}
          style={{
            ...sendBtn,
            background: question.trim() && !loading ? "linear-gradient(135deg, #191970 0%, #457b9d 100%)" : "rgba(25,25,112,0.05)",
            color: question.trim() && !loading ? "#fff" : "rgba(15,23,42,0.3)",
            cursor: question.trim() && !loading ? "pointer" : "default",
          }}
        >
          {loading ? <Loader2 size={14} className="spin" /> : <Send size={14} strokeWidth={1.5} />}
        </button>
      </div>

      {/* 추천 질문 chips (답변 없을 때만) */}
      {!answer && !loading && (
        <div style={chipRow}>
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => handleAsk(s)} style={suggestionChip}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div style={errorBox}>
          <span>⚠ {error}</span>
          <button type="button" onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#b64c4c" }}>
            <X size={12} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* 답변 */}
      {answer && (
        <div style={answerBox}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <div style={answerIconWrap}>
              <Sparkles size={11} color="#7c3aed" strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={answerText}>{answer.answer}</p>
              {answer.nextAction && (
                <div style={nextActionBox}>
                  <div style={nextActionLabel}>{ko ? "다음 행동" : "Next"}</div>
                  <div style={nextActionText}>{answer.nextAction}</div>
                </div>
              )}
              {answer.confidence === "low" && (
                <div style={confidenceLow}>
                  {ko ? "ⓘ 데이터가 부족해 추측 포함된 답변입니다" : "ⓘ Limited data — answer includes assumptions"}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setAnswer(null); setQuestion(""); }}
              style={{ ...closeBtn }}
              title={ko ? "닫기" : "Close"}
            >
              <X size={12} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────

const card: React.CSSProperties = {
  borderRadius: "16px",
  padding: "14px 16px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.92) 100%)",
  border: "1px solid rgba(15,23,42,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.025)",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const iconWrap: React.CSSProperties = {
  width: "26px", height: "26px", borderRadius: "8px",
  background: "linear-gradient(135deg, #191970 0%, #457b9d 100%)",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 2px 6px rgba(25,25,112,0.18)",
};

const eyebrow: React.CSSProperties = {
  fontSize: "10.5px", fontWeight: 700, color: "#191970",
  letterSpacing: "0.06em", textTransform: "uppercase" as const,
};

const subtitle: React.CSSProperties = {
  fontSize: "11.5px", color: "rgba(15,23,42,0.45)", marginTop: "1px",
};

const inputRow: React.CSSProperties = {
  display: "flex", gap: "6px",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 14px", borderRadius: "10px",
  border: "1px solid rgba(15,23,42,0.08)",
  background: "#fff",
  fontSize: "13.5px", fontWeight: 500,
  outline: "none", color: "#0f172a",
  fontFamily: "inherit",
};

const sendBtn: React.CSSProperties = {
  width: "38px", height: "38px",
  borderRadius: "10px", border: "none",
  display: "flex", alignItems: "center", justifyContent: "center",
  flexShrink: 0,
  transition: "all 0.15s ease",
};

const chipRow: React.CSSProperties = {
  display: "flex", flexWrap: "wrap", gap: "5px",
};

const suggestionChip: React.CSSProperties = {
  fontSize: "11.5px", fontWeight: 600,
  padding: "5px 11px", borderRadius: "999px",
  background: "rgba(25,25,112,0.04)", color: "#191970",
  border: "1px solid rgba(25,25,112,0.08)",
  cursor: "pointer", whiteSpace: "nowrap" as const,
  transition: "background 0.15s ease",
};

const errorBox: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "8px 12px", borderRadius: "8px",
  background: "rgba(182,76,76,0.05)",
  fontSize: "11.5px", color: "#b64c4c", fontWeight: 600,
};

const answerBox: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "12px",
  background: "linear-gradient(180deg, rgba(124,58,237,0.04) 0%, rgba(168,85,247,0.02) 100%)",
  border: "1px solid rgba(124,58,237,0.08)",
};

const answerIconWrap: React.CSSProperties = {
  width: "22px", height: "22px", borderRadius: "7px",
  background: "rgba(124,58,237,0.08)",
  display: "flex", alignItems: "center", justifyContent: "center",
  flexShrink: 0, marginTop: "1px",
};

const answerText: React.CSSProperties = {
  margin: 0,
  fontSize: "13.5px", fontWeight: 550, color: "#0f172a",
  lineHeight: 1.55, letterSpacing: "-0.01em",
};

const nextActionBox: React.CSSProperties = {
  marginTop: "8px", padding: "8px 10px", borderRadius: "8px",
  background: "rgba(255,255,255,0.7)",
  border: "0.5px solid rgba(124,58,237,0.1)",
  display: "flex", alignItems: "center", gap: "8px",
};

const nextActionLabel: React.CSSProperties = {
  fontSize: "10px", fontWeight: 700, color: "#7c3aed",
  letterSpacing: "0.05em", textTransform: "uppercase" as const,
  flexShrink: 0,
};

const nextActionText: React.CSSProperties = {
  fontSize: "12px", color: "#0f172a", lineHeight: 1.4, fontWeight: 600,
};

const confidenceLow: React.CSSProperties = {
  marginTop: "6px",
  fontSize: "10.5px", color: "rgba(15,23,42,0.45)", fontStyle: "italic" as const,
};

const closeBtn: React.CSSProperties = {
  width: "22px", height: "22px", borderRadius: "6px", border: "none",
  background: "transparent", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "rgba(15,23,42,0.35)", flexShrink: 0,
};
