"use client";

/**
 * CoachingFeedback — AI 코칭 한 건에 대한 피드백(도움됐어요 / 안 맞아요 + 이유칩).
 *
 *  POST /api/ai/coaching-feedback 로 저장 → 다음 코칭 생성 시 "안 맞아요"가 prompt 에 주입돼
 *  AI 가 비슷한 코칭을 회피(자가개선). 신호등 색 금지 — 미드나잇 한 톤.
 */

import { useState } from "react";
import { supabase } from "../../../../lib/supabase";

const NAVY = "#1d3557";
const NAVY_MUTED = "rgba(29,53,87,0.6)";

type Reason = "industry-mismatch" | "already-know" | "inaccurate" | "hard-to-act";
const REASONS: { id: Reason; ko: string }[] = [
  { id: "industry-mismatch", ko: "우리 업종과 안 맞아요" },
  { id: "already-know", ko: "이미 알아요" },
  { id: "inaccurate", ko: "부정확해요" },
  { id: "hard-to-act", ko: "실행 어려워요" },
];

export function CoachingFeedback(props: {
  source: "industry-daily" | "dashboard-actions";
  headline: string;
  category?: string | null;
  targetCard?: string | null;
  industryCategoryId?: string | null;
  specialtyId?: string | null;
  ko: boolean;
}) {
  const { headline, ko } = props;
  const [state, setState] = useState<"idle" | "down-reason" | "done">("idle");
  const [verdict, setVerdict] = useState<"up" | "down" | null>(null);

  const send = async (v: "up" | "down", reason?: Reason) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      void fetch("/api/ai/coaching-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          source: props.source,
          insightKey: headline.slice(0, 200),
          headline,
          category: props.category ?? null,
          targetCard: props.targetCard ?? null,
          industryCategoryId: props.industryCategoryId ?? null,
          specialtyId: props.specialtyId ?? null,
          verdict: v,
          reason: reason ?? null,
        }),
      }).catch(() => {});
    } catch { /* graceful — 피드백 실패해도 코칭은 정상 */ }
  };

  if (state === "done") {
    return (
      <div style={{ marginTop: 8, fontSize: 11, color: NAVY_MUTED }}>
        {verdict === "up"
          ? (ko ? "고맙습니다 — 비슷한 코칭을 더 보여드릴게요." : "Thanks — we'll show more like this.")
          : (ko ? "반영했어요 — 다음엔 이런 코칭을 줄일게요." : "Noted — we'll reduce coaching like this.")}
      </div>
    );
  }

  if (state === "down-reason") {
    return (
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 11, color: NAVY_MUTED }}>{ko ? "어떤 점이 안 맞았나요?" : "What was off?"}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => { void send("down", r.id); setVerdict("down"); setState("done"); }}
              style={{
                fontSize: 11, fontWeight: 600, color: NAVY,
                background: "rgba(29,53,87,0.06)", border: "1px solid rgba(29,53,87,0.12)",
                borderRadius: 999, padding: "4px 10px", cursor: "pointer",
              }}
            >
              {r.ko}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: NAVY_MUTED }}>{ko ? "이 코칭, 도움이 됐나요?" : "Was this helpful?"}</span>
      <button
        type="button"
        onClick={() => { void send("up"); setVerdict("up"); setState("done"); }}
        style={fbBtn}
      >
        {ko ? "도움됐어요" : "Helpful"}
      </button>
      <button
        type="button"
        onClick={() => setState("down-reason")}
        style={fbBtn}
      >
        {ko ? "안 맞아요" : "Not for me"}
      </button>
    </div>
  );
}

const fbBtn: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: NAVY,
  background: "rgba(29,53,87,0.05)",
  border: "1px solid rgba(29,53,87,0.10)",
  borderRadius: 999,
  padding: "3px 10px",
  cursor: "pointer",
};
