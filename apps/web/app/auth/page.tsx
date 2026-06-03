"use client";

import {
  // ⚠️ 2026-05-25: bootstrapAccountWorkspace 호출 제거 — home page 의 connectAndLoad 에 위임.
  //   auth page 와 home page 양쪽에서 호출하면 race condition 으로 "로그인 2번" 버그.
  getAuthErrorMessage,
  getUiCopy,
  resendConfirmationEmail,
  sendPasswordReset,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  updateCurrentUserPassword,
  validatePassword,
  type Language
} from "@foundone/shared";
import { MockupByIndex, HeroDashboardPreview } from "./mockups";
import { FoundOneSpiralLogo } from "../lib/components/ui/FoundOneSpiralLogo";
import { FeatureIcon, getSummaryFeatures, txt, getFeatures } from "./landing-copy";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";  // 랜딩 nav "서비스" 버튼만 사용 (login 은 hard reload).
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../language-provider";

/* ─── types ─── */
type AuthMode = "signup" | "login" | "password" | "reset";

/* ─── Apple-inspired landing + auth page ─── */
export default function AuthPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = getUiCopy(language);

  const [mode, setMode] = useState<AuthMode>("login");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [message, setMessage] = useState<string>(copy.auth.initialMessage);
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  /* scroll-reveal */
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = Number(e.target.getAttribute("data-i"));
          if (Number.isFinite(i)) setRevealed((s) => new Set(s).add(i));
        });
      },
      { threshold: 0.1 }
    );
    // ⚠️ 2026-05-11 안전망: IntersectionObserver 가 어떤 이유로 fire 안 해도
    //   (Vercel SSR + 일부 모바일 브라우저 + reduced-motion 조합 사례) 사장님이
    //   *영원히 검은 화면* 만 보는 사고 방지. 3초 후 모든 섹션 강제 reveal.
    const safetyTimer = window.setTimeout(() => {
      setRevealed((s) => {
        const next = new Set(s);
        for (let i = 0; i < 20; i++) next.add(i);
        return next;
      });
    }, 3000);
    return () => {
      observerRef.current?.disconnect();
      window.clearTimeout(safetyTimer);
    };
  }, []);

  const setSectionRef = (i: number) => (el: HTMLDivElement | null) => {
    sectionRefs.current[i] = el;
    if (el && observerRef.current) observerRef.current.observe(el);
  };

  /* ─── auth handlers ─── */
  const run = async (action: () => Promise<void>) => {
    try {
      setLoading(true);
      await action();
    } catch (error) {
      setMessage(getAuthErrorMessage(error) || copy.auth.genericError);
    } finally {
      setLoading(false);
    }
  };

  // ⚠️ formatBootstrapError 제거 (2026-05-25):
  //   auth page 가 더 이상 bootstrap 을 호출하지 않으므로 불필요. home page 의 connectAndLoad
  //   가 bootstrap 실패를 처리.

  // ⚠️ CRITICAL (2026-05-25 fix, 사장님 신고: "로그인을 2번 해야 됨" 재발):
  //
  //   종전 구조의 race condition:
  //     1) signInWithEmail → 세션 localStorage 저장
  //     2) bootstrapAccountWorkspace 호출 (auth page) — ensureAccountUser + ensureBusinessProfile
  //        + loadRoadmapState (이 안에서 ensureAccountUser 또 호출) ... 다단계 await
  //     3) router.push("/") — Next.js soft navigation, client state 유지
  //     4) home page mount → usePersistence Effect 1: bootstrapAccountWorkspace 또 호출
  //     5) usePersistence Effect 3: onAuthStateChange (INITIAL_SESSION) → connectAndLoad 또 호출
  //
  //   문제:
  //     • bootstrap 이 3번 호출됨 (auth page 1번 + home page 2번) → Postgres 동시 INSERT race
  //     • soft navigation 이라 auth page 의 zustand state (예: requiresAuth=true 옛 값) 가
  //       잠시 home 에 leak → "shouldShowAuth=true" → useEffect 가 /auth 로 즉시 redirect
  //     • 사용자: "로그인 됐는데 다시 /auth 로 튕김" → 한번 더 로그인 = 두번째엔 state 정리됨
  //
  //   수정:
  //     • auth page 의 bootstrap 호출 제거 — home page 의 connectAndLoad 가 *유일한 진입점*
  //     • router.push 대신 window.location.assign → hard reload → 모든 client state 초기화
  //       (localStorage 세션은 유지). 다음 페이지가 깨끗한 상태로 마운트.
  const navigateToHomeHard = () => {
    if (typeof window !== "undefined") {
      window.location.assign("/");
    }
  };

  const handleSignup = () =>
    run(async () => {
      const pwdErr = validatePassword(password);
      if (pwdErr) { setMessage(pwdErr); return; }
      const byInt = parseInt(birthYear, 10);
      if (!birthYear || Number.isNaN(byInt) || byInt < 1900 || byInt > new Date().getFullYear() - 14) {
        setMessage("올바른 출생연도를 입력해 주세요. (예: 1990)");
        return;
      }
      const result = await signUpWithEmail(supabase, { firstName, lastName, birthYear: byInt, email, password });
      if (result.needsConfirmation) {
        setPendingEmail(result.email);
        setShowConfirmation(true);
        return;
      }
      setMessage(copy.auth.accountCreatedNew);
      navigateToHomeHard();
    });

  const handleResendEmail = () =>
    run(async () => {
      await resendConfirmationEmail(supabase, pendingEmail);
      setMessage("인증 이메일을 다시 발송했습니다.");
    });

  const handleLogin = () =>
    run(async () => {
      await signInWithEmail(supabase, { email, password });
      setMessage(copy.auth.loggedIn);
      navigateToHomeHard();
    });

  const handlePasswordChange = () =>
    run(async () => {
      await updateCurrentUserPassword(supabase, nextPassword);
      setMessage(copy.auth.passwordUpdated);
      setNextPassword("");
    });

  const handleSendReset = () =>
    run(async () => {
      if (!email.trim()) { setMessage("이메일을 입력해 주세요."); return; }
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      await sendPasswordReset(supabase, email.trim(), `${origin}/auth/callback?type=recovery`);
      // 보안: 가입 여부와 무관하게 동일 안내 (계정 존재 노출 방지)
      setMessage("입력하신 이메일로 비밀번호 재설정 링크를 보냈습니다. 메일함을 확인해 주세요. (소셜 로그인 계정은 메일이 오지 않습니다)");
    });

  const handleSignOut = () =>
    run(async () => {
      await signOutUser(supabase);
      setMessage(copy.auth.signedOut);
    });

  const t = txt(language);
  const features = getFeatures(language);

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh" }}>
      {/* ━━━ Nav ━━━ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 clamp(20px, 4vw, 48px)",
          height: 52,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "saturate(180%) blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Found.One</span>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.8)",
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            {language === "ko" ? "서비스" : "App"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAuth(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: 980,
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              padding: "7px 16px",
              cursor: "pointer"
            }}
          >
            {language === "ko" ? "시작하기" : "Get Started"}
          </button>
        </div>
      </nav>

      {/* ━━━ 이메일 인증 대기 화면 ━━━ */}
      {showConfirmation && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
        }}>
          <div style={{
            background: "#1a1a1a", borderRadius: "24px", padding: "40px 32px",
            maxWidth: "400px", width: "100%", textAlign: "center",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              background: "rgba(99,179,237,0.15)", margin: "0 auto 20px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#63b3ed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: "0 0 10px" }}>
              이메일을 확인해 주세요
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: "0 0 8px" }}>
              <strong style={{ color: "rgba(255,255,255,0.8)" }}>{pendingEmail}</strong>로
            </p>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: "0 0 28px" }}>
              인증 링크를 발송했습니다. 링크를 클릭하면 바로 서비스를 이용할 수 있습니다.
            </p>
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={loading}
              style={{
                width: "100%", padding: "13px 0", borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent", color: "rgba(255,255,255,0.7)",
                fontSize: "14px", cursor: loading ? "wait" : "pointer",
                marginBottom: "12px",
              }}
            >
              {loading ? "발송 중..." : "이메일 재발송"}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              style={{
                background: "none", border: "none", color: "rgba(255,255,255,0.35)",
                fontSize: "13px", cursor: "pointer",
              }}
            >
              돌아가기
            </button>
            {message && message !== copy.auth.initialMessage && (
              <p style={{ fontSize: "13px", color: "#63b3ed", marginTop: "14px" }}>{message}</p>
            )}
          </div>
        </div>
      )}

      {/* ━━━ Auth overlay ━━━ */}
      {showAuth && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(24px)"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAuth(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 400,
              background: "#1d1d1f",
              borderRadius: 20,
              padding: "36px 32px 32px",
              position: "relative"
            }}
          >
            {/* close */}
            <button
              type="button"
              onClick={() => setShowAuth(false)}
              style={{
                position: "absolute",
                top: 14,
                right: 16,
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: 980,
                width: 28,
                height: 28,
                color: "rgba(255,255,255,0.6)",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ×
            </button>

            {/* brand */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 24
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.95)",
                  margin: "0 auto 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                }}
                aria-hidden="true"
              >
                <FoundOneSpiralLogo size={26} color="#3A3AC8" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>Found.One</div>
            </div>

            {/* mode tabs */}
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: 3,
                marginBottom: 20,
                gap: 2
              }}
            >
              {(["login", "signup", "password"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    background: mode === m ? "rgba(255,255,255,0.12)" : "transparent",
                    border: "none",
                    borderRadius: 8,
                    color: mode === m ? "#fff" : "rgba(255,255,255,0.45)",
                    fontSize: 13,
                    fontWeight: 500,
                    padding: "8px 0",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {modeLabel(m, language)}
                </button>
              ))}
            </div>

            {/* form */}
            <div style={{ display: "grid", gap: 12 }}>
              {mode === "signup" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <AuthInput label="성" value={lastName} onChange={setLastName} />
                    <AuthInput label="이름" value={firstName} onChange={setFirstName} />
                  </div>
                  <AuthInput
                    label="출생연도 (예: 1990)"
                    value={birthYear}
                    onChange={setBirthYear}
                    type="text"
                  />
                </>
              )}
              {mode === "reset" && (
                <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: "0 0 4px" }}>
                  가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
                </p>
              )}
              {mode !== "password" && (
                <AuthInput
                  label={copy.auth.email}
                  value={email}
                  onChange={setEmail}
                  type="email"
                />
              )}
              {(mode === "login" || mode === "signup") && (
                <>
                  <AuthInput
                    label={copy.auth.passwordLabel}
                    value={password}
                    onChange={setPassword}
                    type="password"
                  />
                  {mode === "signup" && password && (
                    <p style={{
                      fontSize: 11, margin: "-4px 0 0", paddingLeft: 4,
                      color: password.length >= 8 && /\d/.test(password) ? "#34c759" : "rgba(255,120,120,0.9)",
                    }}>
                      8자 이상, 숫자 포함{password.length >= 8 && /\d/.test(password) ? " ✓" : ""}
                    </p>
                  )}
                </>
              )}
              {mode === "password" && (
                <AuthInput
                  label={copy.auth.newPassword}
                  value={nextPassword}
                  onChange={setNextPassword}
                  type="password"
                />
              )}

              <button
                type="button"
                disabled={loading}
                onClick={
                  mode === "signup"
                    ? handleSignup
                    : mode === "login"
                      ? handleLogin
                      : mode === "reset"
                        ? handleSendReset
                        : handlePasswordChange
                }
                style={{
                  marginTop: 4,
                  width: "100%",
                  padding: "13px 0",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #1E2A55 0%, #2C4F80 100%)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: "-0.005em",
                  boxShadow: "0 2px 10px rgba(30,42,85,0.32)",
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  transition: "opacity 0.2s"
                }}
              >
                {mode === "signup"
                  ? copy.auth.createAccount
                  : mode === "login"
                    ? copy.auth.logIn
                    : mode === "reset"
                      ? "재설정 메일 받기"
                      : copy.auth.updatePassword}
              </button>

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => { setMode("reset"); setMessage(""); }}
                  style={{
                    background: "none", border: "none", color: "rgba(255,255,255,0.55)",
                    fontSize: 13, cursor: "pointer", textDecoration: "underline",
                    padding: "2px 0", margin: "2px auto 0", display: "block",
                  }}
                >
                  비밀번호를 잊으셨나요?
                </button>
              )}
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setMessage("FoundOne은 가입한 이메일이 곧 아이디입니다. 이메일이 기억나지 않으시면, 기억나는 이메일로 「비밀번호를 잊으셨나요?」를 눌러 재설정 메일을 보내보세요 — 메일이 도착하면 그 이메일이 가입된 아이디입니다.")}
                  style={{
                    background: "none", border: "none", color: "rgba(255,255,255,0.4)",
                    fontSize: 12.5, cursor: "pointer", textDecoration: "underline",
                    padding: "2px 0", margin: "0 auto", display: "block",
                  }}
                >
                  이메일(아이디)이 기억나지 않으세요?
                </button>
              )}
              {mode === "reset" && (
                <button
                  type="button"
                  onClick={() => { setMode("login"); setMessage(""); }}
                  style={{
                    background: "none", border: "none", color: "rgba(255,255,255,0.55)",
                    fontSize: 13, cursor: "pointer", textDecoration: "underline",
                    padding: "2px 0", margin: "2px auto 0", display: "block",
                  }}
                >
                  ← 로그인으로 돌아가기
                </button>
              )}

              {mode === "signup" && (
                <p style={{
                  fontSize: 12, color: "rgba(255,255,255,0.45)",
                  textAlign: "center", lineHeight: 1.6, margin: "4px 0 0",
                }}>
                  가입하면{" "}
                  <a href="/legal/terms" target="_blank" rel="noopener" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "underline" }}>이용약관</a>
                  {" "}및{" "}
                  <a href="/legal/privacy" target="_blank" rel="noopener" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "underline" }}>개인정보처리방침</a>
                  에 동의하는 것으로 간주합니다.
                </p>
              )}

              {mode === "login" && (
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "transparent",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 14,
                    cursor: "pointer"
                  }}
                >
                  {copy.auth.logOut}
                </button>
              )}
            </div>

            {/* status */}
            {message && (
              <div
                style={{
                  marginTop: 16,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.05)",
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "rgba(255,255,255,0.6)"
                }}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ━━━ Hero keyframe styles ━━━
          ⚠️ 2026-05-11 (사용자 신고: Vercel 배포에서 hero 가 *완전 검은 화면* 으로 보임):
            종전 패턴: animation-fill-mode: both + from { opacity: 0 }
            문제: CSS 가 어떤 이유로 늦게 파싱·차단되거나 reduced-motion 외 다른 간섭 시
                  elements 가 opacity 0 에 영원히 멈춤 → 사장님이 *까만 화면* 만 봄.
            수정: opacity 변화 제거. transform 만 slide-up 애니메이션. CSS·JS 무엇이 실패해도
                  텍스트는 항상 *visible* (opacity 기본 1). 시각 효과는 transform 으로 충분. */}
      <style>{`
        @keyframes heroSlideUp {
          from { transform: translateY(24px); }
          to { transform: translateY(0); }
        }
        @keyframes heroMockupRise {
          from { transform: translateY(40px) scale(0.97); }
          to { transform: translateY(0) scale(1); }
        }
        .hero-eyebrow { animation: heroSlideUp 0.6s cubic-bezier(0.25,0.46,0.45,0.94) 0.1s both; }
        .hero-title { animation: heroSlideUp 0.7s cubic-bezier(0.25,0.46,0.45,0.94) 0.2s both; }
        .hero-sub { animation: heroSlideUp 0.6s cubic-bezier(0.25,0.46,0.45,0.94) 0.3s both; }
        .hero-cta { animation: heroSlideUp 0.55s cubic-bezier(0.25,0.46,0.45,0.94) 0.4s both; }
        .hero-mockup { animation: heroMockupRise 0.9s cubic-bezier(0.25,0.46,0.45,0.94) 0.55s both; }
      `}</style>

      {/* ━━━ Section 1: Hero ━━━ */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "120px clamp(20px, 6vw, 80px) 80px",
          position: "relative"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(91,140,255,0.15) 0%, transparent 70%)",
            pointerEvents: "none"
          }}
        />
        <p
          className="hero-eyebrow"
          style={{
            fontSize: 17,
            fontWeight: 500,
            color: "#5B8CFF",
            letterSpacing: "0.02em",
            marginBottom: 16,
            position: "relative"
          }}
        >
          {t.heroEyebrow}
        </p>
        <h1
          className="hero-title"
          style={{
            fontSize: "clamp(44px, 8vw, 80px)",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            maxWidth: 800,
            margin: "0 auto 24px",
            position: "relative"
          }}
        >
          {t.heroTitle}
        </h1>
        <p
          className="hero-sub"
          style={{
            fontSize: "clamp(17px, 2.2vw, 21px)",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.7)",
            maxWidth: 600,
            margin: "0 auto 40px",
            position: "relative"
          }}
        >
          {t.heroSub}
        </p>
        <div className="hero-cta" style={{ display: "flex", gap: 12, position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowAuth(true)}
            style={{
              padding: "14px 28px",
              borderRadius: 980,
              border: "none",
              background: "linear-gradient(135deg, #1E2A55 0%, #2C4F80 100%)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.005em",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(30,42,85,0.32)",
              transition: "transform 0.15s ease, box-shadow 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(30,42,85,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 10px rgba(30,42,85,0.32)";
            }}
          >
            {t.heroCta}
          </button>
          <button
            type="button"
            onClick={() =>
              sectionRefs.current[0]?.scrollIntoView({ behavior: "smooth" })
            }
            style={{
              padding: "14px 28px",
              borderRadius: 980,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "#fff",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            {t.heroLearn}
          </button>
        </div>

        {/* ── Hero dashboard preview ── */}
        <div className="hero-mockup">
          <HeroDashboardPreview lang={language} />
        </div>
      </section>

      {/* ━━━ Feature sections with staggered Apple-style animations ━━━ */}
      {features.map((feat, i) => {
        const isLight = i % 2 === 1;
        const v = revealed.has(i);
        return (
          <section
            key={feat.title}
            ref={setSectionRef(i)}
            data-i={i}
            style={{
              background: isLight ? "#f5f5f7" : "#000",
              color: isLight ? "#1d1d1f" : "#fff",
              padding: "clamp(80px, 12vw, 120px) clamp(20px, 6vw, 80px)",
              overflow: "hidden"
            }}
          >
            <div style={{ maxWidth: 1080, margin: "0 auto" }}>
              {/* text block — staggered children */}
              <div style={{ textAlign: "center", marginBottom: "clamp(40px, 6vw, 64px)" }}>
                {/* label — appears first */}
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: isLight ? "#6e6e73" : "rgba(255,255,255,0.5)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 12,
                    opacity: v ? 1 : 0,
                    transform: v ? "translateY(0)" : "translateY(20px)",
                    transition: "opacity 0.7s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)",
                    transitionDelay: "0s"
                  }}
                >
                  {feat.label}
                </p>
                {/* title — appears second, with slight scale */}
                <h2
                  style={{
                    fontSize: "clamp(32px, 5vw, 56px)",
                    fontWeight: 700,
                    lineHeight: 1.08,
                    letterSpacing: "-0.03em",
                    marginBottom: 16,
                    whiteSpace: "pre-line",
                    opacity: v ? 1 : 0,
                    transform: v ? "translateY(0) scale(1)" : "translateY(30px) scale(0.97)",
                    transition: "opacity 0.8s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)",
                    transitionDelay: "0.12s"
                  }}
                >
                  {feat.title}
                </h2>
                {/* body — appears third */}
                <p
                  style={{
                    fontSize: "clamp(16px, 2vw, 19px)",
                    lineHeight: 1.65,
                    color: isLight ? "#6e6e73" : "rgba(255,255,255,0.6)",
                    maxWidth: 600,
                    margin: "0 auto",
                    opacity: v ? 1 : 0,
                    transform: v ? "translateY(0)" : "translateY(24px)",
                    transition: "opacity 0.8s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)",
                    transitionDelay: "0.24s"
                  }}
                >
                  {feat.body}
                </p>
              </div>

              {/* UI mockup — appears last, rises up with scale */}
              <div
                style={{
                  opacity: v ? 1 : 0,
                  transform: v ? "translateY(0) scale(1)" : "translateY(60px) scale(0.94)",
                  transition: "opacity 1s cubic-bezier(0.25,0.46,0.45,0.94), transform 1s cubic-bezier(0.25,0.46,0.45,0.94)",
                  transitionDelay: "0.4s"
                }}
              >
                <MockupByIndex index={i} isLight={isLight} lang={language} />
              </div>
            </div>
          </section>
        );
      })}

      {/* ━━━ Feature summary grid ━━━ */}
      <section
        ref={setSectionRef(features.length)}
        data-i={features.length}
        style={{
          background: "#f5f5f7",
          color: "#1d1d1f",
          padding: "clamp(80px, 12vw, 120px) clamp(20px, 6vw, 80px)",
          textAlign: "center"
        }}
      >
        {(() => { const gv = revealed.has(features.length); return (
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <p style={{
            fontSize: 14, fontWeight: 500, color: "#6e6e73", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12,
            opacity: gv ? 1 : 0, transform: gv ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.7s ease, transform 0.7s ease", transitionDelay: "0s"
          }}>
            {language === "ko" ? "전체 기능" : "Everything Included"}
          </p>
          <h2 style={{
            fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: 40, whiteSpace: "pre-line",
            opacity: gv ? 1 : 0, transform: gv ? "translateY(0) scale(1)" : "translateY(30px) scale(0.97)",
            transition: "opacity 0.8s ease, transform 0.8s ease", transitionDelay: "0.12s"
          }}>
            {language === "ko" ? "창업에 필요한 모든 것,\n한 곳에." : "Everything you need,\nin one place."}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, maxWidth: 960, margin: "0 auto" }}>
            {getSummaryFeatures(language).map((f, idx) => (
              <div key={f.title} style={{
                padding: "20px 16px",
                borderRadius: 16,
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.06)",
                textAlign: "left",
                opacity: gv ? 1 : 0,
                transform: gv ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
                transitionDelay: gv ? `${0.3 + idx * 0.05}s` : "0s"
              }}>
                <FeatureIcon color={f.color} d={f.d} />
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "#1d1d1f" }}>{f.title}</div>
                <div style={{ fontSize: 12, color: "#86868b", lineHeight: 1.4 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
        ); })()}
      </section>

      {/* ━━━ Final CTA ━━━ */}
      <section
        ref={setSectionRef(features.length + 1)}
        data-i={features.length + 1}
        style={{
          padding: "clamp(80px, 12vw, 140px) clamp(20px, 6vw, 80px)",
          textAlign: "center",
          background: "#000",
          borderTop: "1px solid rgba(255,255,255,0.06)"
        }}
      >
        {(() => { const cv = revealed.has(features.length + 1); return <>
        <h2
          style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            marginBottom: 16,
            whiteSpace: "pre-line",
            opacity: cv ? 1 : 0,
            transform: cv ? "translateY(0) scale(1)" : "translateY(30px) scale(0.97)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
            transitionDelay: "0.1s"
          }}
        >
          {t.ctaTitle}
        </h2>
        <p
          style={{
            fontSize: "clamp(16px, 2vw, 19px)",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.6)",
            maxWidth: 520,
            margin: "0 auto 32px",
            opacity: cv ? 1 : 0,
            transform: cv ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
            transitionDelay: "0.25s"
          }}
        >
          {t.ctaSub}
        </p>
        <div style={{
          opacity: cv ? 1 : 0,
          transform: cv ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
          transitionDelay: "0.4s"
        }}>
          <button
            type="button"
            onClick={() => setShowAuth(true)}
            style={{
              padding: "14px 32px",
              borderRadius: 980,
              border: "none",
              background: "linear-gradient(135deg, #1E2A55 0%, #2C4F80 100%)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.005em",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(30,42,85,0.32)",
              transition: "transform 0.15s ease, box-shadow 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(30,42,85,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 10px rgba(30,42,85,0.32)";
            }}
          >
            {t.heroCta}
          </button>
        </div>
        </>; })()}
      </section>

      {/* ━━━ Footer ━━━ */}
      <footer
        style={{
          padding: "20px clamp(20px, 6vw, 80px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: 12,
          color: "rgba(255,255,255,0.3)"
        }}
      >
        © 2026 Found.One. All rights reserved.
      </footer>
    </div>
  );
}

/* ─── AuthInput ─── */
function AuthInput(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 500,
          color: "rgba(255,255,255,0.5)",
          marginBottom: 6
        }}
      >
        {props.label}
      </label>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        type={props.type ?? "text"}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.06)",
          color: "#fff",
          fontSize: 15,
          outline: "none",
          boxSizing: "border-box"
        }}
      />
    </div>
  );
}

/* ─── mode label ─── */
function modeLabel(mode: AuthMode, lang: Language) {
  if (lang === "ko") {
    return mode === "login" ? "로그인" : mode === "signup" ? "회원가입" : "비밀번호";
  }
  return mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Password";
}
