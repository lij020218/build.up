"use client";

/**
 * InviteOfferModal — 받은 채용 초대장 자동 표시 (2026-07-12, 사장님 지정 UX).
 *
 * 동작: 로그인 사용자에게 이메일 지정 초대(my_pending_invites)가 있으면
 *   어떤 화면에 있든 초대장 모달이 자동으로 뜬다:
 *     "「가게명」 업장에 직원으로 채용되셨습니다. 본인이 맞다면 수락 버튼을 눌러주세요."
 *   [수락] → accept_store_invite → user_role=staff 전환 → 새로고침 → 직원 대시보드.
 *   [나중에] → 이 세션 동안 그 초대는 다시 안 띄움(sessionStorage) — 내 정보 > 가게 연결에서 언제든 수락 가능.
 *
 * 마운트: starter-stage-demo 전역 (사장/온보딩 화면 위). 직원(staff) 화면에선 미마운트.
 * 백엔드: 마이그레이션 20260712_000001 (my_pending_invites) — 미적용 환경에선 조용히 아무것도 안 함.
 */

import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const MIDNIGHT = "#191970";

type PendingInvite = {
  invite_code: string;
  role: "staff" | "manager";
  store_name: string;
  expires_at: string | null;
};

const dismissKey = (code: string) => `fo_invite_dismissed_${code}`;

export function InviteOfferModal({ ko }: { ko: boolean }) {
  const [invite, setInvite] = useState<PendingInvite | null>(null);
  const [status, setStatus] = useState<"idle" | "accepting" | "done" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) return;
        const { data, error } = await supabase.rpc("my_pending_invites" as never);
        if (error || cancelled) return; // RPC 미배포 환경 — 조용히 skip
        const res = data as unknown as { ok?: boolean; invites?: PendingInvite[] };
        const first = (res?.invites ?? []).find(
          (i) => typeof window !== "undefined" && !window.sessionStorage.getItem(dismissKey(i.invite_code)),
        );
        if (first) setInvite(first);
      } catch {
        /* noop */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!invite) return null;

  const accept = async () => {
    setStatus("accepting");
    try {
      const { data, error } = await supabase.rpc("accept_store_invite" as never, { p_code: invite.invite_code } as never);
      const res = data as unknown as { ok?: boolean };
      if (error || !res?.ok) { setStatus("error"); return; }
      setStatus("done");
      // 역할이 staff 로 전환됨 — 게이트 재평가로 직원 대시보드 진입.
      setTimeout(() => window.location.reload(), 1400);
    } catch {
      setStatus("error");
    }
  };

  const dismiss = () => {
    window.sessionStorage.setItem(dismissKey(invite.invite_code), "1");
    setInvite(null);
  };

  const roleLabel = invite.role === "manager" ? (ko ? "매니저" : "manager") : (ko ? "직원" : "staff");

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 420, background: "white", borderRadius: 22,
          padding: "28px 26px", boxShadow: "0 24px 80px rgba(25,25,112,0.25)",
          border: "1px solid rgba(25,25,112,0.08)",
        }}
      >
        <div
          style={{
            width: 52, height: 52, borderRadius: 16, margin: "0 auto 14px",
            background: "rgba(25,25,112,0.06)", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <BadgeCheck size={26} strokeWidth={1.8} style={{ color: MIDNIGHT }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center", marginBottom: 6 }}>
          {ko ? "채용 초대장" : "Job invitation"}
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", textAlign: "center", margin: "0 0 10px", letterSpacing: "-0.01em", lineHeight: 1.4 }}>
          {ko
            ? <>「{invite.store_name}」 업장에<br />{roleLabel}으로 채용되셨습니다</>
            : <>You&apos;ve been hired as {roleLabel} at &quot;{invite.store_name}&quot;</>}
        </h2>
        <p style={{ fontSize: 13.5, color: "rgba(15,23,42,0.6)", textAlign: "center", lineHeight: 1.6, margin: "0 0 20px" }}>
          {ko
            ? "본인이 맞다면 수락 버튼을 눌러주세요. 수락하면 이 계정은 직원 모드로 전환되고 근무표·출퇴근·연차 화면이 열립니다."
            : "If this is you, press Accept. Your account switches to staff mode with schedule, attendance and time-off."}
        </p>

        {status === "done" ? (
          <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: MIDNIGHT, padding: "12px 0" }}>
            {ko ? "수락 완료! 직원 화면으로 이동합니다…" : "Accepted! Switching to your staff view…"}
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={accept}
              disabled={status === "accepting"}
              style={{
                width: "100%", padding: "13px 16px", borderRadius: 12, border: "none",
                background: MIDNIGHT, color: "white", fontSize: 14.5, fontWeight: 800,
                cursor: status === "accepting" ? "default" : "pointer",
                opacity: status === "accepting" ? 0.6 : 1,
              }}
            >
              {status === "accepting" ? (ko ? "수락 중…" : "Accepting…") : ko ? "본인이 맞아요 — 수락하기" : "That's me — Accept"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              style={{
                width: "100%", marginTop: 8, padding: "11px 16px", borderRadius: 12,
                border: "1px solid rgba(25,25,112,0.14)", background: "white",
                color: "rgba(15,23,42,0.6)", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              {ko ? "나중에 (내 정보 › 가게 연결에서 수락 가능)" : "Later (accept anytime in Profile)"}
            </button>
            {status === "error" && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#b64c4c", textAlign: "center", lineHeight: 1.5 }}>
                {ko ? "수락에 실패했어요. 잠시 후 다시 시도하거나, 내 정보 › 가게 연결에서 수락해 주세요." : "Failed — please retry or accept from Profile."}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
