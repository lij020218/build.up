"use client";

/**
 * 직원 초대 링크 발송 섹션 (공용).
 *
 * 2026-07-12 — MyHiringPlanCard 내부 구현을 추출. 사용처:
 *   1) 채용 스테이지 MyHiringPlanCard (로드맵 hiring-setup)
 *   2) 직원 서피스 TeamSurface (운영 단계 — 종전엔 초대 UI 진입로가 로드맵에만 있어
 *      운영 중 사장님이 직원을 추가할 방법이 없었음)
 *
 * 데이터 흐름:
 *   1) 사장이 「초대 링크 생성」 클릭 → store_invites insert (Supabase, RLS by owner_user_id)
 *   2) 생성된 코드로 https://<host>/invite/<code> 링크 만들기
 *   3) 사장이 카톡·문자로 직원에게 링크 전송
 *   4) 직원 클릭 → /invite/[code] 페이지에서 환영 + 가게 일치 확인 → 가입/연결
 *
 * 모든 정보는 Supabase 에 저장 — 모바일·웹 디바이스 간 동일하게 보임.
 */

import { useState } from "react";
import { Link2, Copy, Check as CheckIcon } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const MIDNIGHT = "#191970";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.18)";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";

export function InviteLinkSection({ ko }: { ko: boolean }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errHint, setErrHint] = useState<string | null>(null);
  // 이메일 지정 초대 (2026-07-12) — 입력 시 그 이메일 계정만 수락 가능 + 직원 로그인 시 「받은 초대」 표시.
  //   빈 값이면 종전과 동일한 비지정(누구나 코드로) 초대. 가입 여부는 조회하지 않음(계정 열거 방지).
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [directedEmail, setDirectedEmail] = useState<string | null>(null);

  const inviteUrl = code && typeof window !== "undefined" ? `${window.location.origin}/invite/${code}` : "";

  const generate = async () => {
    setStatus("loading");
    setErrHint(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrHint("login");
        setStatus("error");
        return;
      }
      const trimmedEmail = email.trim().toLowerCase();
      const newCode = Math.random().toString(36).slice(2, 10).toUpperCase();
      const { error } = await supabase.from("store_invites" as never).insert({
        owner_user_id: user.id,
        invite_code: newCode,
        role: "staff",
        ...(trimmedEmail && trimmedEmail.includes("@") ? { invited_email: trimmedEmail } : {}),
      } as never);
      if (error) {
        console.error("[invite] insert failed:", error);
        // 42P01=테이블 없음, 42501=권한 없음 → DB 미프로비저닝(마이그레이션 미적용) 신호
        const code = (error as { code?: string }).code;
        setErrHint(code === "42P01" || code === "42501" ? "setup" : "unknown");
        setStatus("error");
        return;
      }
      setCode(newCode);
      setDirectedEmail(trimmedEmail && trimmedEmail.includes("@") ? trimmedEmail : null);
      setStatus("ready");
    } catch (err) {
      console.error("[invite] generate failed:", err);
      setErrHint("unknown");
      setStatus("error");
    }
  };

  const copy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  return (
    <div
      style={{
        marginTop: 4,
        padding: "14px 16px",
        background: MIDNIGHT_SOFT,
        border: `1px solid ${MIDNIGHT_BORDER}`,
        borderRadius: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <Link2 size={14} strokeWidth={1.6} style={{ color: MIDNIGHT, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {ko ? "직원 초대 링크" : "Invite link"}
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.65)", marginTop: 2, lineHeight: 1.5 }}>
            {ko
              ? "직원이 링크를 클릭하면 가게 정보와 함께 「맞아요/아니에요」를 확인합니다. Supabase 에 저장돼 모바일·웹 동일."
              : "Employee opens the link, confirms the store, and is connected — synced across devices."}
          </div>
        </div>
      </div>

      {status !== "ready" && (
        <>
          {showEmail ? (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={ko ? "직원 이메일 (그 계정만 수락 가능)" : "Employee email (only that account can accept)"}
              style={{
                width: "100%", boxSizing: "border-box", marginBottom: 8,
                padding: "10px 12px", borderRadius: 10,
                border: "1px solid rgba(25,25,112,0.18)", fontSize: 13, outline: "none",
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowEmail(true)}
              style={{ marginBottom: 8, fontSize: 11.5, fontWeight: 600, color: MIDNIGHT, background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              {ko ? "+ 이메일로 지정 초대 (이미 가입한 직원에게 추천)" : "+ Invite by email (best for existing members)"}
            </button>
          )}
          <button
            type="button"
            onClick={generate}
            disabled={status === "loading"}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              background: MIDNIGHT,
              color: "white",
              fontSize: 13,
              fontWeight: 700,
              cursor: status === "loading" ? "default" : "pointer",
              opacity: status === "loading" ? 0.5 : 1,
            }}
          >
            {status === "loading" ? (ko ? "생성 중…" : "Creating…") : ko ? "+ 새 초대 생성" : "+ Generate invite"}
          </button>
        </>
      )}

      {status === "error" && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#b64c4c", lineHeight: 1.5 }}>
          {errHint === "login"
            ? (ko ? "로그인이 필요합니다. 다시 로그인 후 시도해 주세요." : "Sign-in required. Please sign in and retry.")
            : errHint === "setup"
              ? (ko
                  ? "초대 기능이 아직 서버에 설정되지 않았습니다(초대 테이블 미생성). 관리자에게 문의해 주세요."
                  : "Invite feature isn't set up on the server yet (missing table). Please contact the admin.")
              : (ko ? "초대 링크 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." : "Failed to create invite. Please try again.")}
        </div>
      )}

      {status === "ready" && code && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 10,
              background: "white",
              border: "1px solid rgba(25,25,112,0.16)",
            }}
          >
            <span style={{ flex: 1, fontSize: 12.5, fontFamily: "ui-monospace, monospace", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {inviteUrl}
            </span>
            <button
              type="button"
              onClick={copy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid rgba(25,25,112,0.18)",
                background: copied ? MIDNIGHT : "white",
                color: copied ? "white" : MIDNIGHT,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {copied ? <CheckIcon size={12} strokeWidth={2.4} /> : <Copy size={12} strokeWidth={2} />}
              {copied ? (ko ? "복사됨" : "Copied") : ko ? "복사" : "Copy"}
            </button>
          </div>
          {/* 초대 코드 — 링크 없이 코드만 불러줘도 연결 가능 (기가입 회원 경로) */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: "rgba(25,25,112,0.04)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.04em" }}>{ko ? "초대 코드" : "Code"}</span>
            <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "ui-monospace, monospace", letterSpacing: "0.14em", color: "#0f172a" }}>{code}</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
            {directedEmail
              ? (ko
                  ? `${directedEmail} 계정만 수락할 수 있어요. 해당 직원이 로그인하면 내 정보의 「받은 초대」에도 자동 표시됩니다. 7일간 유효.`
                  : `Only ${directedEmail} can accept. It also appears under their pending invites. Valid 7 days.`)
              : (ko
                  ? "링크를 카톡·문자로 보내거나, 이미 Found.One 회원인 직원에겐 코드만 알려주세요 — 「내 정보 › 가게 연결」에서 코드 입력으로 바로 연결됩니다. 7일간 유효, 1회 사용."
                  : "Send the link, or just tell the code — existing members can join via Profile › Join a store. Valid 7 days, one-time use.")}
          </div>
          <button
            type="button"
            onClick={() => { setCode(null); setStatus("idle"); setCopied(false); setDirectedEmail(null); setEmail(""); setShowEmail(false); }}
            style={{ alignSelf: "flex-start", fontSize: 11.5, fontWeight: 600, color: MIDNIGHT, background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            {ko ? "다른 직원용 새 초대 생성" : "Create another"}
          </button>
        </div>
      )}
    </div>
  );
}
