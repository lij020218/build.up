"use client";

/**
 * OnboardingAccountMenu — 온보딩 중 "내 정보" (로그아웃 · 계정 삭제)
 *
 *  2026-08-19 사장님 지시: 가입 직후 온보딩(선택 화면·AI 위저드·기존 가게 등록)을 끝내지 않아도
 *  로그아웃·계정 삭제가 가능해야 한다. iOS OnboardingAccountSheet 와 동일 동작.
 *  삭제 로직은 ProfileView 와 같은 /api/account/delete (Bearer) → signOut → /auth.
 *
 *  화면 우상단 고정(fixed). 어떤 온보딩 화면 위에도 그대로 얹는다.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { ConfirmModal } from "../ConfirmModal";

export function OnboardingAccountMenu({ ko = true }: { ko?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setEmail(data.session?.user?.email ?? "");
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const signOut = async () => {
    setBusy(true);
    try {
      await supabase.auth.signOut();
      router.push("/auth");
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    setConfirmOpen(false);
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { alert(ko ? "로그인이 필요합니다." : "Sign in required."); return; }
      const res = await fetch("/api/account/delete", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? (ko ? "계정 삭제에 실패했습니다. 계정과 데이터는 그대로 남아 있습니다." : "Failed to delete account."));
        return;
      }
      await supabase.auth.signOut();
      router.push("/auth");
    } catch (e) {
      console.error("[onboarding deleteAccount]", e);
      alert(ko ? "오류가 발생했습니다. 잠시 후 다시 시도해 주세요." : "An error occurred. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div ref={wrapRef} style={{ position: "fixed", top: 14, right: 16, zIndex: 60 }}>
        <button
          type="button"
          aria-label={ko ? "내 정보" : "My account"}
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          style={{
            width: 40, height: 40, borderRadius: 999, border: "1px solid rgba(20,24,52,0.10)",
            background: "rgba(255,255,255,0.72)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
            display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 4px 14px rgba(20,24,52,0.08)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1c2450" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="8" r="3.6" />
            <path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4" />
          </svg>
        </button>
        {open && (
          <div
            role="menu"
            style={{
              position: "absolute", right: 0, top: 48, width: 264, padding: 10, borderRadius: 16,
              background: "rgba(255,255,255,0.96)", border: "1px solid rgba(20,24,52,0.10)",
              boxShadow: "0 16px 40px rgba(20,24,52,0.14)",
            }}
          >
            <div style={{ padding: "6px 8px 10px", borderBottom: "1px solid rgba(20,24,52,0.08)", marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1c2450", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {email || (ko ? "로그인 계정" : "Signed in")}
              </div>
              <div style={{ fontSize: 11.5, color: "#6b7194", marginTop: 2 }}>
                {ko ? "온보딩 진행 중 — 언제든 로그아웃·삭제할 수 있어요" : "Onboarding in progress — you can sign out or delete anytime"}
              </div>
            </div>
            <button type="button" role="menuitem" disabled={busy} onClick={signOut} style={itemStyle()}>
              {ko ? "로그아웃" : "Sign out"}
            </button>
            <button type="button" role="menuitem" disabled={busy} onClick={() => { setOpen(false); setConfirmOpen(true); }} style={itemStyle(true)}>
              {ko ? "계정 삭제" : "Delete account"}
            </button>
          </div>
        )}
      </div>
      <ConfirmModal
        open={confirmOpen}
        title={ko ? "계정을 삭제하시겠어요?" : "Delete your account?"}
        message={ko
          ? "되돌릴 수 없어요. 로그인 정보와 지금까지 입력한 내용이 모두 즉시·영구 삭제됩니다. (직원 근로 기록이 있다면 법정 보존을 위해 계정과 분리해 3년 보관 후 자동 파기)"
          : "This cannot be undone. Your login and everything entered so far are permanently deleted."}
        confirmLabel={ko ? "삭제" : "Delete"}
        cancelLabel={ko ? "취소" : "Cancel"}
        danger
        onConfirm={deleteAccount}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

function itemStyle(danger = false): React.CSSProperties {
  return {
    display: "block", width: "100%", textAlign: "left", padding: "10px 10px", borderRadius: 10,
    border: "none", background: "transparent", cursor: "pointer", fontSize: 13.5, fontWeight: 600,
    color: danger ? "#b42318" : "#1c2450",
  };
}
