"use client";

/**
 * StoreConnectCard — 직원용 「가게 연결」 (내 정보 카드, 2026-07-12).
 *
 * 대상: 이미 Found.One 회원인 사용자가 사장의 가게에 직원으로 연결되는 경로.
 *   (신규 가입자는 가입 직후 RoleSelectionScreen 에서 처리 — 여기는 기가입자용.)
 *
 * 두 가지 연결 방법:
 *   1) 받은 초대 — 사장이 내 이메일로 지정 초대를 보낸 경우, my_pending_invites RPC 로
 *      자동 표시 → 수락 한 번으로 연결. (마이그레이션 20260712_000001 필요 — 미적용
 *      환경에선 RPC 오류를 조용히 무시하고 코드 입력만 노출.)
 *   2) 초대 코드 입력 — 사장이 불러준 8자리 코드를 직접 입력 (accept_store_invite,
 *      20260708_000001). 링크 없이 전화·구두로도 연결 가능.
 *
 * ⚠️ 수락하면 business_profiles.user_role 이 staff/manager 로 전환된다 (RPC 동작).
 *    사장 계정이 실수로 수락하지 않도록 전환 경고를 UI 에 명시한다.
 */

import { useCallback, useEffect, useState } from "react";
import { Store, KeyRound, Check } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

const MIDNIGHT = "#191970";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.16)";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.05)";

type PendingInvite = {
  invite_code: string;
  role: "staff" | "manager";
  store_name: string;
  created_at: string;
  expires_at: string | null;
};

const REASON_KO: Record<string, string> = {
  "not-found": "코드를 찾을 수 없어요. 코드를 다시 확인해 주세요.",
  used: "이미 사용된 초대예요. 사장님께 새 초대를 요청하세요.",
  expired: "만료된 초대예요 (7일 유효). 사장님께 새 초대를 요청하세요.",
  self: "본인 가게의 초대는 수락할 수 없어요.",
  "wrong-account": "이 초대는 다른 이메일 계정으로 지정됐어요. 해당 계정으로 로그인해 주세요.",
  "not-authenticated": "로그인이 필요해요.",
};

export function StoreConnectCard({ ko }: { ko: boolean }) {
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [codeInput, setCodeInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [connectedStore, setConnectedStore] = useState<string | null>(null);

  // 받은 초대 로드 — RPC 미배포(마이그레이션 미적용) 환경에선 조용히 빈 목록.
  const loadPending = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("my_pending_invites" as never);
      if (error) return;
      const res = data as unknown as { ok?: boolean; invites?: PendingInvite[] };
      if (res?.ok && Array.isArray(res.invites)) setPending(res.invites);
    } catch {
      /* noop — 기능 미배포 환경 */
    }
  }, []);

  useEffect(() => { void loadPending(); }, [loadPending]);

  const accept = async (code: string, storeName?: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setStatus("loading");
    setErrMsg(null);
    try {
      const { data, error } = await supabase.rpc("accept_store_invite" as never, { p_code: trimmed } as never);
      if (error) {
        setErrMsg(ko ? "연결에 실패했어요. 잠시 후 다시 시도해 주세요." : "Failed to connect. Please retry.");
        setStatus("error");
        return;
      }
      const res = data as unknown as { ok?: boolean; reason?: string };
      if (!res?.ok) {
        const reason = res?.reason ?? "unknown";
        setErrMsg(ko ? (REASON_KO[reason] ?? "연결에 실패했어요.") : `Failed: ${reason}`);
        setStatus("error");
        return;
      }
      setConnectedStore(storeName ?? null);
      setStatus("done");
      // 역할이 staff 로 전환됨 — 앱 게이트(사장/직원 라우팅)를 다시 태우기 위해 새로고침.
      setTimeout(() => window.location.reload(), 1600);
    } catch {
      setErrMsg(ko ? "연결에 실패했어요. 네트워크를 확인해 주세요." : "Failed — check your network.");
      setStatus("error");
    }
  };

  return (
    <article
      style={{
        background: "white",
        borderRadius: 20,
        padding: "20px 22px",
        border: `1px solid ${MIDNIGHT_BORDER}`,
        boxShadow: "0 6px 30px rgba(25,25,112,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Store size={15} strokeWidth={1.8} style={{ color: MIDNIGHT }} />
        <div style={{ fontSize: 13, fontWeight: 750, color: MIDNIGHT, letterSpacing: "0.02em" }}>
          {ko ? "가게 연결 (직원용)" : "Join a store (staff)"}
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.6, margin: "0 0 12px" }}>
        {ko
          ? "다른 가게에 직원으로 연결하면 근무표·출퇴근·연차를 이 계정으로 관리합니다. 연결 시 이 계정은 직원 모드로 전환돼요."
          : "Connect to a store as staff to see your schedule and clock in. Your account switches to staff mode."}
      </p>

      {status === "done" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderRadius: 12, background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT_BORDER}` }}>
          <Check size={15} strokeWidth={2.4} style={{ color: MIDNIGHT }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: MIDNIGHT }}>
            {ko
              ? `연결 완료${connectedStore ? ` — ${connectedStore}` : ""}! 직원 화면으로 이동합니다…`
              : "Connected! Switching to the staff view…"}
          </span>
        </div>
      ) : (
        <>
          {/* 받은 초대 (이메일 지정) */}
          {pending.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {ko ? "받은 초대" : "Pending invites"}
              </div>
              {pending.map((inv) => (
                <div key={inv.invite_code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT_BORDER}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{inv.store_name}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.55)" }}>
                      {inv.role === "manager" ? (ko ? "매니저" : "Manager") : (ko ? "직원" : "Staff")}
                      {inv.expires_at && ` · ${ko ? "유효기간" : "Expires"} ${inv.expires_at.slice(0, 10)}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={status === "loading"}
                    onClick={() => accept(inv.invite_code, inv.store_name)}
                    style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: MIDNIGHT, color: "white", fontSize: 12.5, fontWeight: 700, cursor: "pointer", opacity: status === "loading" ? 0.5 : 1 }}
                  >
                    {ko ? "수락" : "Accept"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 초대 코드 직접 입력 */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <KeyRound size={13} strokeWidth={1.8} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(15,23,42,0.35)" }} />
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder={ko ? "초대 코드 8자리 (예: A1B2C3D4)" : "8-char invite code"}
                maxLength={12}
                style={{ width: "100%", padding: "10px 12px 10px 30px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.12)", fontSize: 13, fontFamily: "ui-monospace, monospace", letterSpacing: "0.06em", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <button
              type="button"
              disabled={codeInput.trim().length < 6 || status === "loading"}
              onClick={() => accept(codeInput)}
              style={{
                padding: "10px 16px", borderRadius: 10, border: "none",
                background: codeInput.trim().length >= 6 ? MIDNIGHT : "rgba(15,23,42,0.12)",
                color: "white", fontSize: 13, fontWeight: 700,
                cursor: codeInput.trim().length >= 6 && status !== "loading" ? "pointer" : "default",
              }}
            >
              {status === "loading" ? (ko ? "연결 중…" : "…") : ko ? "연결" : "Join"}
            </button>
          </div>
          {errMsg && <div style={{ marginTop: 8, fontSize: 12, color: "#b64c4c", lineHeight: 1.5 }}>{errMsg}</div>}
        </>
      )}
    </article>
  );
}
