"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { updateCurrentUserPassword, validatePassword } from "@foundone/shared";

/**
 * 인증 완료 후 복귀 경로 결정 — auth 페이지가 sessionStorage 에 남긴 returnTo 를 소비.
 *   open redirect 방지: `/` 로 시작하는 내부 경로만 허용(`//`·`/\`·scheme 거부). 실패 시 `/`.
 *   1회용이므로 읽은 뒤 즉시 제거.
 */
function consumeReturnTo(): string {
  if (typeof window === "undefined") return "/";
  const raw = window.sessionStorage.getItem("buildup:auth-return-to");
  window.sessionStorage.removeItem("buildup:auth-return-to");
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw)) return "/";
  return raw;
}

// Next.js 15: useSearchParams() 는 Suspense 경계 안에서만 빌드 가능 (정적 생성 bailout).
// OAuth 콜백은 본질적으로 동적이므로 내부 컴포넌트를 Suspense 로 감싼다.
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell><Spinner /></CallbackShell>}>
      <AuthCallbackInner />
    </Suspense>
  );
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error" | "recovery-form">("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const [newPw, setNewPw] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSetNewPassword = async () => {
    const pwdErr = validatePassword(newPw);
    if (pwdErr) { setErrorMsg(pwdErr); return; }
    setSubmitting(true); setErrorMsg("");
    try {
      await updateCurrentUserPassword(supabase, newPw);
      setStatus("success");
      setTimeout(() => { window.location.assign("/"); }, 1200);
    } catch (e) {
      setErrorMsg((e as Error).message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as "signup" | "email" | "recovery" | null;

    // 기본 비밀번호 재설정 링크({{ .ConfirmationURL }})는 Supabase verify 후 세션을
    // URL 해시(#access_token=...)로 우리 콜백에 전달 → supabase-js 가 자동 파싱하며
    // PASSWORD_RECOVERY 이벤트 발생. 이걸 잡아 새 비밀번호 화면으로 전환.
    const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("recovery-form");
    });

    // 보안: 쿼리의 token 흔적 제거 (해시는 supabase-js 가 파싱 후 정리).
    if (typeof window !== "undefined" && (token_hash || type)) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("token_hash");
      cleanUrl.searchParams.delete("type");
      window.history.replaceState({}, "", cleanUrl.toString());
    }

    // (OAuth) 소셜 로그인(카카오 등) PKCE 콜백 — `?code=` 또는 `?error=`.
    //   supabase 클라이언트가 detectSessionInUrl(pkce)로 code 를 자동 교환하므로(수동 교환 시 이중소비),
    //   여기서는 세션이 잡히는지 폴링으로 확인 후 홈으로 보낸다.
    const oauthCode = searchParams.get("code");
    const oauthError = searchParams.get("error") || searchParams.get("error_description");
    if (oauthError) {
      setStatus("error");
      setErrorMsg("로그인이 취소되었거나 실패했습니다. 다시 시도해 주세요.");
      return () => authSub.subscription.unsubscribe();
    }
    if (oauthCode) {
      void (async () => {
        for (let i = 0; i < 10; i++) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            setStatus("success");
            const dest = consumeReturnTo();
            setTimeout(() => { window.location.assign(dest); }, 600);
            return;
          }
          await new Promise((r) => setTimeout(r, 400));
        }
        setStatus("error");
        setErrorMsg("로그인 처리에 실패했습니다. 다시 시도해 주세요.");
      })();
      return () => authSub.subscription.unsubscribe();
    }

    // (A) token_hash 방식 — 가입 확인 메일, 또는 token_hash 템플릿 링크.
    if (token_hash && type) {
      supabase.auth
        .verifyOtp({ token_hash, type: type === "signup" ? "email" : type })
        .then(({ error }) => {
          if (error) {
            setStatus("error");
            setErrorMsg(
              error.message === "Token has expired or is invalid"
                ? "링크가 만료됐습니다. 다시 시도하거나 이메일 재발송을 요청해 주세요."
                : error.message
            );
            return;
          }
          if (type === "recovery") { setStatus("recovery-form"); return; }
          setStatus("success");
          const dest = consumeReturnTo();
          setTimeout(() => { window.location.assign(dest); }, 1200);
        });
      return () => authSub.subscription.unsubscribe();
    }

    // (B) 해시 기반 recovery (기본 ConfirmationURL) — supabase-js 가 이미 세션을 만들었는지 확인.
    //     PASSWORD_RECOVERY 이벤트를 놓쳤을 수 있으므로 getSession 으로도 확인 + 대기 후 에러.
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) { setStatus("recovery-form"); return; }
      setTimeout(async () => {
        const { data: d2 } = await supabase.auth.getSession();
        if (d2.session) setStatus("recovery-form");
        else {
          setStatus("error");
          setErrorMsg("유효하지 않거나 만료된 링크입니다. 비밀번호 재설정을 다시 요청해 주세요.");
        }
      }, 2500);
    })();

    return () => authSub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
      color: "#fff",
      padding: "24px",
      textAlign: "center",
    }}>
      {status === "verifying" && (
        <div>
          <Spinner />
          <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "20px" }}>이메일 인증 중...</p>
        </div>
      )}

      {status === "recovery-form" && (
        <div style={{ width: "100%", maxWidth: "340px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>새 비밀번호 설정</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginBottom: "20px", lineHeight: 1.6 }}>
            8자 이상, 숫자를 포함한 새 비밀번호를 입력해 주세요.
          </p>
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="새 비밀번호"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter" && !submitting) void handleSetNewPassword(); }}
            style={{
              width: "100%", padding: "13px 14px", borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)",
              color: "#fff", fontSize: "15px", marginBottom: "12px", boxSizing: "border-box",
            }}
          />
          {errorMsg && (
            <p style={{ color: "#ff6b6b", fontSize: "13px", marginBottom: "12px" }}>{errorMsg}</p>
          )}
          <button
            type="button"
            disabled={submitting}
            onClick={() => { void handleSetNewPassword(); }}
            style={{
              width: "100%", padding: "13px 0", borderRadius: "10px", border: "none",
              background: "linear-gradient(135deg, #1E2A55 0%, #2C4F80 100%)",
              color: "#fff", fontSize: "15px", fontWeight: 600,
              cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.6 : 1,
            }}
          >
            비밀번호 변경
          </button>
        </div>
      )}

      {status === "success" && (
        <div>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "rgba(52,199,89,0.15)", margin: "0 auto 20px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#34c759" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>이메일 인증 완료!</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>잠시 후 서비스로 이동합니다...</p>
        </div>
      )}

      {status === "error" && (
        <div>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "rgba(255,59,48,0.15)", margin: "0 auto 20px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v5M12 16.5v.5" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="12" r="9" stroke="#ff3b30" strokeWidth="1.6" />
            </svg>
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>인증 실패</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "24px" }}>{errorMsg}</p>
          <button
            type="button"
            onClick={() => router.push("/auth")}
            style={{
              padding: "12px 28px", borderRadius: "980px",
              background: "rgba(255,255,255,0.1)", border: "none",
              color: "#fff", fontSize: "15px", cursor: "pointer",
            }}
          >
            로그인 페이지로
          </button>
        </div>
      )}
    </div>
  );
}

function CallbackShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
      color: "#fff",
      padding: "24px",
      textAlign: "center",
    }}>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: "48px", height: "48px", margin: "0 auto",
      border: "3px solid rgba(255,255,255,0.1)",
      borderTopColor: "rgba(255,255,255,0.7)",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
