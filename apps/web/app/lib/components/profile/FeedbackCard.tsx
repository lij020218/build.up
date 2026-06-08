"use client";

/**
 * FeedbackCard — 인앱 피드백 (내 정보 페이지). POST /api/feedback → user_feedback.
 *   출시 초기 사장님 의견 수집용. 카테고리 + 자유 텍스트 + 진단 맥락(screen).
 */
import { useState } from "react";
import { MessageSquareHeart, Send } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

const MIDNIGHT = "#191970";

type Category = "bug" | "idea" | "ux" | "other";
type Status = "idle" | "sending" | "sent" | "error";

export function FeedbackCard({ ko }: { ko: boolean }) {
  const [category, setCategory] = useState<Category>("idea");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const cats: { key: Category; label: string }[] = [
    { key: "bug", label: ko ? "버그·오류" : "Bug" },
    { key: "idea", label: ko ? "기능 제안" : "Idea" },
    { key: "ux", label: ko ? "사용성" : "UX" },
    { key: "other", label: ko ? "기타" : "Other" },
  ];

  const send = async () => {
    const msg = message.trim();
    if (!msg || status === "sending") return;
    setStatus("sending");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) { setStatus("error"); return; }
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category,
          message: msg,
          context: {
            platform: "web",
            screen: typeof window !== "undefined" ? window.location.pathname : "",
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : "",
          },
        }),
      });
      if (!res.ok) { setStatus("error"); return; }
      setMessage("");
      setStatus("sent");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
    }
  };

  return (
    <article style={cardStyle}>
      <div style={sectionLabel}>{ko ? "의견 보내기" : "Send feedback"}</div>

      <div style={{ padding: "14px 18px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
          <span style={iconBadge}>
            <MessageSquareHeart size={17} strokeWidth={2} color="#fff" />
          </span>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.01em", color: "#16181d" }}>
              {ko ? "사장님 의견을 들려주세요" : "Tell us what you think"}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {ko ? "불편한 점·제안 무엇이든 — 빠르게 반영하겠습니다" : "Bugs or ideas — we read every one"}
            </div>
          </div>
        </div>

        {/* 카테고리 칩 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {cats.map((c) => {
            const on = category === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                style={{
                  padding: "5px 11px", borderRadius: 999, cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                  border: on ? `1px solid ${MIDNIGHT}` : "1px solid rgba(0,0,0,0.12)",
                  background: on ? "rgba(25,25,112,0.06)" : "#fff",
                  color: on ? MIDNIGHT : "#5b616e",
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
          placeholder={ko ? "예: 매출 입력 후 그래프가 바로 안 바뀌어요 / 주간 리포트가 있으면 좋겠어요" : "What can we improve?"}
          rows={3}
          style={{
            width: "100%", boxSizing: "border-box", resize: "vertical",
            padding: "10px 12px", borderRadius: 10, fontSize: 13, lineHeight: 1.5,
            border: "1px solid rgba(0,0,0,0.12)", fontFamily: "inherit", color: "#16181d",
            outline: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 10 }}>
          <span style={{ fontSize: 11.5, color: status === "error" ? "#b64c4c" : "var(--muted)" }}>
            {status === "sent" ? (ko ? "보냈어요 · 감사합니다 ✓" : "Sent · thank you ✓")
              : status === "error" ? (ko ? "전송 실패 — 다시 시도해 주세요" : "Failed — try again")
              : `${message.trim().length}/2000`}
          </span>
          <button
            type="button"
            onClick={send}
            disabled={!message.trim() || status === "sending"}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 10, border: "none",
              background: !message.trim() ? "rgba(0,0,0,0.12)" : "linear-gradient(135deg,#1d3557,#2c4f80)",
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: !message.trim() || status === "sending" ? "default" : "pointer",
            }}
          >
            <Send size={13} strokeWidth={2.2} />
            {status === "sending" ? (ko ? "보내는 중…" : "Sending…") : (ko ? "보내기" : "Send")}
          </button>
        </div>
      </div>
    </article>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.06)",
  marginTop: 12,
  fontFamily: "Pretendard, -apple-system, sans-serif",
  overflow: "hidden",
};
const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
  color: "var(--muted)", padding: "12px 18px 0",
};
const iconBadge: React.CSSProperties = {
  flexShrink: 0, width: 36, height: 36, borderRadius: 11,
  background: "linear-gradient(135deg,#1d3557,#2c4f80)",
  display: "flex", alignItems: "center", justifyContent: "center",
};
