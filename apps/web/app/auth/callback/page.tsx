"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { updateCurrentUserPassword, validatePassword } from "@foundone/shared";

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

    // 2026-05-27 보안 (P0-4): 토큰을 URL 에서 즉시 제거.
    //   Supabase 이메일 링크는 ?token_hash=... 형식이라 query 가 불가피하지만,
    //   read 후 즉시 history.replaceState 로 정리하면:
    //     - 브라우저 히스토리에 토큰 잔존 안 함
    //     - 외부 링크 클릭 시 Referer 헤더에 토큰 미포함
    //     - Sentry/analytics 가 URL 캡처 시 토큰 미포함
    //   (token 자체는 1회용 + 단시간 만료지만 defense-in-depth)
    if (typeof window !== "undefined" && (token_hash || type)) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("token_hash");
      cleanUrl.searchParams.delete("type");
      window.history.replaceState({}, "", cleanUrl.toString());
    }

    if (!token_hash || !type) {
      setStatus("error");
      setErrorMsg("유효하지 않은 인증 링크입니다.");
      return;
    }

    supabase.auth
      .verifyOtp({ token_hash, type: type === "signup" ? "email" : type })
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          setErrorMsg(
            error.message === "Token has expired or is invalid"
              ? "링크가 만료됐습니다. 다시 가입하거나 이메일 재발송을 요청해 주세요."
              : error.message
          );
          return;
        }
        // 비밀번호 재설정(recovery): 임시 세션이 생성됨 → 새 비밀번호 입력 화면으로.
        if (type === "recovery") {
          setStatus("recovery-form");
          return;
        }
        setStatus("success");
        // 세션이 localStorage에 저장됨 → hard reload로 홈 진입
        setTimeout(() => {
          window.location.assign("/");
        }, 1200);
      });
    // searchParams 의존성 제거 — URL 정리 후 재실행 방지 (mount 시 한 번만)
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
