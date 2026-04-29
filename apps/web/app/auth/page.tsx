"use client";

import {
  bootstrapAccountWorkspace,
  getAuthErrorMessage,
  getUiCopy,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  updateCurrentUserPassword,
  type Language
} from "@build-up/shared";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../language-provider";

/* ─── types ─── */
type AuthMode = "signup" | "login" | "password";

/* ─── Apple-inspired landing + auth page ─── */
export default function AuthPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = getUiCopy(language);

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [message, setMessage] = useState<string>(copy.auth.initialMessage);
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

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
    return () => observerRef.current?.disconnect();
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

  /**
   * Bootstrap 단계에서 발생한 raw DB/Postgres 오류를 사용자가 이해할 수 있는 메시지로 변환.
   * 원본 에러는 console 에 남겨 디버깅 유지.
   */
  const formatBootstrapError = (error: unknown, fallback: string): string => {
    const ko = language === "ko";
    if (error instanceof Error) console.error("[auth] bootstrap failed:", error);

    const raw = error instanceof Error ? error.message : String(error ?? "");
    if (raw.includes("AUTH_REQUIRED") || raw.includes("Authentication") || raw.includes("session")) {
      return ko
        ? "세션 만료 — 다시 로그인해 주세요"
        : "Session expired — please sign in again";
    }
    if (raw.toLowerCase().includes("network") || raw.toLowerCase().includes("fetch")) {
      return ko
        ? "네트워크 연결을 확인해 주세요"
        : "Check your network connection";
    }
    // RLS · permission · duplicate key 등 모든 DB 오류는 일반화된 메시지로
    if (raw.includes("violates") || raw.includes("permission") || raw.includes("policy") || raw.includes("duplicate")) {
      return ko
        ? "계정 데이터 초기화 중 문제가 발생했어요. 잠시 후 다시 시도하거나 지원팀에 문의해 주세요."
        : "There was a problem setting up your account data. Please try again shortly or contact support.";
    }
    return fallback;
  };

  const handleSignup = () =>
    run(async () => {
      // 1) Supabase auth.users 생성 (이메일·비밀번호·이름)
      await signUpWithEmail(supabase, { name, email, password });
      // 2) business_profiles + roadmaps 행 생성. 실패 시 친절한 메시지 + 홈으로 진입.
      //    auth 는 이미 성공했으므로 다음 마운트의 connectAndLoad 가 자동 재시도 (idempotent).
      try {
        const result = await bootstrapAccountWorkspace(supabase);
        setMessage(result.isNew ? copy.auth.accountCreatedNew : copy.auth.accountCreatedExisting);
      } catch (error) {
        setMessage(formatBootstrapError(
          error,
          language === "ko"
            ? "가입은 완료됐지만 초기 설정 중 오류가 발생했어요. 홈으로 이동합니다."
            : "Account created, but initial setup failed. Continuing to home.",
        ));
      }
      router.push("/");
    });

  const handleLogin = () =>
    run(async () => {
      await signInWithEmail(supabase, { email, password });
      try {
        const result = await bootstrapAccountWorkspace(supabase);
        setMessage(result.isNew ? copy.auth.loggedInNew : copy.auth.loggedIn);
      } catch (error) {
        setMessage(formatBootstrapError(
          error,
          language === "ko"
            ? "로그인은 됐지만 데이터 로딩 중 오류가 발생했어요. 홈으로 이동합니다."
            : "Logged in, but data loading failed. Continuing to home.",
        ));
      }
      router.push("/");
    });

  const handlePasswordChange = () =>
    run(async () => {
      await updateCurrentUserPassword(supabase, nextPassword);
      setMessage(copy.auth.passwordUpdated);
      setNextPassword("");
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
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>build.up</span>
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
                  background: "linear-gradient(135deg, #5B8CFF 0%, #1D3557 100%)",
                  margin: "0 auto 12px"
                }}
              />
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>build.up</div>
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
                <AuthInput
                  label={copy.auth.name}
                  value={name}
                  onChange={setName}
                />
              )}
              {mode !== "password" && (
                <>
                  <AuthInput
                    label={copy.auth.email}
                    value={email}
                    onChange={setEmail}
                    type="email"
                  />
                  <AuthInput
                    label={copy.auth.passwordLabel}
                    value={password}
                    onChange={setPassword}
                    type="password"
                  />
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
                      : handlePasswordChange
                }
                style={{
                  marginTop: 4,
                  width: "100%",
                  padding: "13px 0",
                  borderRadius: 10,
                  border: "none",
                  background: "#0071e3",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  transition: "opacity 0.2s"
                }}
              >
                {mode === "signup"
                  ? copy.auth.createAccount
                  : mode === "login"
                    ? copy.auth.logIn
                    : copy.auth.updatePassword}
              </button>

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

      {/* ━━━ Hero keyframe styles ━━━ */}
      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes heroMockupRise {
          from { opacity: 0; transform: translateY(80px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .hero-eyebrow { animation: heroFadeUp 0.8s cubic-bezier(0.25,0.46,0.45,0.94) 0.1s both; }
        .hero-title { animation: heroFadeUp 0.9s cubic-bezier(0.25,0.46,0.45,0.94) 0.25s both; }
        .hero-sub { animation: heroFadeUp 0.8s cubic-bezier(0.25,0.46,0.45,0.94) 0.45s both; }
        .hero-cta { animation: heroFadeUp 0.7s cubic-bezier(0.25,0.46,0.45,0.94) 0.6s both; }
        .hero-mockup { animation: heroMockupRise 1.1s cubic-bezier(0.25,0.46,0.45,0.94) 0.8s both; }
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
              background: "#0071e3",
              color: "#fff",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer"
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
              background: "#0071e3",
              color: "#fff",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer"
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
        © 2026 build.up. All rights reserved.
      </footer>
    </div>
  );
}

/* ─── Mockup router ─── */
function MockupByIndex({ index, isLight, lang }: { index: number; isLight: boolean; lang: Language }) {
  const card = {
    borderRadius: 16,
    background: isLight ? "#fff" : "rgba(255,255,255,0.06)",
    border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
    overflow: "hidden" as const
  };
  const muted = isLight ? "#86868b" : "rgba(255,255,255,0.4)";
  const subtle = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)";
  const accent = "#007aff";

  const p = { card, muted, subtle, accent, isLight, lang };
  if (index === 0) return <MockupOnboarding {...p} />;
  if (index === 1) return <MockupRoadmap {...p} />;
  if (index === 2) return <MockupGuides {...p} />;
  if (index === 3) return <MockupAnalysis {...p} />;
  if (index === 4) return <MockupMarket {...p} />;
  if (index === 5) return <MockupMentoring {...p} />;
  return <MockupOperations {...p} />;
}

type MockupProps = {
  card: React.CSSProperties;
  muted: string;
  subtle: string;
  accent: string;
  isLight: boolean;
  lang: Language;
};

/* ── Mockup 1: Roadmap stage flow ── */
function MockupRoadmap({ card, muted, subtle, accent, isLight, lang }: MockupProps) {
  const ko = lang === "ko";
  const stages = ko
    ? [
        { n: "1", title: "업종 선택", status: "done" },
        { n: "2", title: "사업자 등록", status: "done" },
        { n: "3", title: "인허가 확인", status: "current" },
        { n: "4", title: "입지 분석", status: "locked" },
        { n: "5", title: "공급업체 선정", status: "locked" }
      ]
    : [
        { n: "1", title: "Choose Industry", status: "done" },
        { n: "2", title: "Register Business", status: "done" },
        { n: "3", title: "Verify Permits", status: "current" },
        { n: "4", title: "Location Analysis", status: "locked" },
        { n: "5", title: "Select Suppliers", status: "locked" }
      ];

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      {/* phone frame */}
      <div style={{ ...card, padding: 0, borderRadius: 24, position: "relative" }}>
        {/* top bar */}
        <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: muted }}>{ko ? "내 로드맵" : "My Roadmap"}</span>
          <span style={{ fontSize: 12, color: accent, fontWeight: 500 }}>40%</span>
        </div>
        {/* progress bar */}
        <div style={{ margin: "0 20px 16px", height: 4, borderRadius: 2, background: subtle }}>
          <div style={{ width: "40%", height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #34c759, #30d158)" }} />
        </div>
        {/* stage list */}
        <div style={{ padding: "0 20px 20px", display: "grid", gap: 8 }}>
          {stages.map((s) => {
            const done = s.status === "done";
            const current = s.status === "current";
            const locked = s.status === "locked";
            return (
              <div
                key={s.n}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: current
                    ? (isLight ? "rgba(0,122,255,0.06)" : "rgba(0,122,255,0.12)")
                    : subtle,
                  border: current ? `1px solid ${isLight ? "rgba(0,122,255,0.2)" : "rgba(0,122,255,0.3)"}` : "1px solid transparent",
                  opacity: locked ? 0.4 : 1
                }}
              >
                {/* circle */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0,
                    background: done ? "#34c759" : current ? accent : (isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)"),
                    color: done || current ? "#fff" : muted
                  }}
                >
                  {done ? "✓" : s.n}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: current ? 600 : 500, color: locked ? muted : undefined }}>
                    {s.title}
                  </div>
                </div>
                {current && (
                  <div style={{ fontSize: 11, fontWeight: 500, color: accent, whiteSpace: "nowrap" }}>
                    {ko ? "진행 중" : "In progress"}
                  </div>
                )}
                {done && (
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#34c759" }}>
                    {ko ? "완료" : "Done"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Mockup 2: Guide cards with freshness ── */
function MockupGuides({ card, muted, subtle, accent, isLight, lang }: MockupProps) {
  const ko = lang === "ko";
  const guides = ko
    ? [
        { domain: "인허가", color: "#ff9f0a", title: "음식점 영업 신고 절차", source: "식품의약품안전처", date: "2026-02-15", fresh: true },
        { domain: "세무", color: "#5B8CFF", title: "간이과세자 부가세 신고 가이드", source: "국세청 홈택스", date: "2026-01-20", fresh: true },
        { domain: "대출", color: "#34c759", title: "소상공인 정책자금 신청 방법", source: "소상공인시장진흥공단", date: "2025-08-10", fresh: false }
      ]
    : [
        { domain: "Permits", color: "#ff9f0a", title: "Restaurant Business License Process", source: "MFDS", date: "2026-02-15", fresh: true },
        { domain: "Tax", color: "#5B8CFF", title: "Simplified Tax Filing Guide", source: "NTS HomeTax", date: "2026-01-20", fresh: true },
        { domain: "Loans", color: "#34c759", title: "SME Policy Loan Application", source: "SEMAS", date: "2025-08-10", fresh: false }
      ];

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", display: "grid", gap: 12 }}>
      {guides.map((g) => (
        <div key={g.title} style={{ ...card, padding: "18px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
          {/* color bar */}
          <div style={{ width: 4, height: 48, borderRadius: 2, background: g.color, flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: g.color }}>{g.domain}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  padding: "2px 7px",
                  borderRadius: 6,
                  background: g.fresh ? (isLight ? "rgba(52,199,89,0.1)" : "rgba(52,199,89,0.15)") : (isLight ? "rgba(255,59,48,0.08)" : "rgba(255,59,48,0.15)"),
                  color: g.fresh ? "#34c759" : "#ff3b30"
                }}
              >
                {g.fresh ? (ko ? "최신" : "Fresh") : (ko ? "재검토 필요" : "Review needed")}
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{g.title}</div>
            <div style={{ fontSize: 12, color: muted }}>
              {ko ? "출처" : "Source"}: {g.source} · {g.date}
            </div>
          </div>
          <span style={{ fontSize: 13, color: accent, fontWeight: 500, flexShrink: 0, marginTop: 14 }}>{ko ? "읽기 →" : "Read →"}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Mockup 3: Finance simulation + contract ── */
function MockupAnalysis({ card, muted, subtle, accent, isLight, lang }: MockupProps) {
  const ko = lang === "ko";
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* finance card */}
      <div style={{ ...card, padding: 20, gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{ko ? "재무 시뮬레이션" : "Financial Simulation"}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 8,
              background: isLight ? "rgba(255,159,10,0.1)" : "rgba(255,159,10,0.15)",
              color: "#ff9f0a"
            }}
          >
            {ko ? "중간 위험" : "Medium Risk"}
          </span>
        </div>
        {/* metric grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: ko ? "생존 가능" : "Runway", value: "8.2" + (ko ? "개월" : "mo") },
            { label: ko ? "손익분기" : "Break-even", value: ko ? "5개월차" : "Month 5" },
            { label: ko ? "BEP 매출" : "BEP Revenue", value: "1,850" + (ko ? "만" : "K") }
          ].map((m) => (
            <div key={m.label} style={{ padding: "12px 10px", borderRadius: 10, background: subtle, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 2 }}>{m.value}</div>
              <div style={{ fontSize: 11, color: muted }}>{m.label}</div>
            </div>
          ))}
        </div>
        {/* mini chart */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48, padding: "0 4px" }}>
          {[30, 45, 38, 52, 64, 58, 72, 80, 76, 88, 95, 100].map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h}%`,
                borderRadius: 3,
                background: i < 5
                  ? (isLight ? "rgba(255,59,48,0.25)" : "rgba(255,59,48,0.35)")
                  : (isLight ? "rgba(52,199,89,0.3)" : "rgba(52,199,89,0.4)")
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: muted }}>
          <span>{ko ? "개업" : "Start"}</span>
          <span>{ko ? "12개월" : "12 months"}</span>
        </div>
      </div>

      {/* AI interpretation card */}
      <div style={{ ...card, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: accent, letterSpacing: "0.04em", marginBottom: 8 }}>AI {ko ? "해석" : "Interpretation"}</div>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 10 }}>
          {ko ? "초기 자금 여유가 낮아\n신중한 지출이 필요합니다" : "Low initial buffer\nrequires careful spending"}
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {(ko
            ? ["월세 비중 줄일 수 있는 입지 검토", "6개월 내 BEP 도달 목표 설정"]
            : ["Review locations with lower rent ratio", "Target break-even within 6 months"]
          ).map((t) => (
            <div key={t} style={{ fontSize: 12, color: muted, display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span style={{ color: "#34c759", flexShrink: 0 }}>→</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* contract card */}
      <div style={{ ...card, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#ff3b30", letterSpacing: "0.04em", marginBottom: 8 }}>{ko ? "계약서 분석" : "Contract Scan"}</div>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 10 }}>
          {ko ? "2개 위험 조항 감지" : "2 risk clauses detected"}
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {(ko
            ? ["권리금 회수 조항 누락", "중도 해지 시 위약금 과다"]
            : ["Missing goodwill recovery clause", "Excessive early termination penalty"]
          ).map((t) => (
            <div key={t} style={{ fontSize: 12, color: muted, display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span style={{ color: "#ff3b30", flexShrink: 0 }}>!</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Mockup 4: Stage mentoring guide ── */
function MockupMentoring({ card, muted, subtle, accent, isLight, lang }: MockupProps) {
  const ko = lang === "ko";
  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ ...card, padding: 0, borderRadius: 24 }}>
        {/* header */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #5B8CFF, #1D3557)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 14 }}>3</span>
            </div>
            <div>
              <div style={{ fontSize: 11, color: muted, fontWeight: 500 }}>{ko ? "3단계" : "Stage 3"}</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{ko ? "인허가 확인" : "Verify Permits"}</div>
            </div>
          </div>
        </div>

        {/* action items */}
        <div style={{ padding: "0 20px 8px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: muted, letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: 10 }}>
            {ko ? "실행 항목" : "Action Items"}
          </div>
          {(ko
            ? [
                { icon: "📋", text: "영업 신고서 작성 및 제출", done: true },
                { icon: "🏥", text: "보건증 발급 (보건소 방문)", done: true },
                { icon: "🔥", text: "소방 시설 점검 신청", done: false },
                { icon: "📐", text: "시설 기준 자가 체크리스트", done: false }
              ]
            : [
                { icon: "📋", text: "File business registration form", done: true },
                { icon: "🏥", text: "Get health certificate", done: true },
                { icon: "🔥", text: "Request fire safety inspection", done: false },
                { icon: "📐", text: "Facility standards checklist", done: false }
              ]
          ).map((item) => (
            <div
              key={item.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderTop: `1px solid ${isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)"}`
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: item.done ? "#34c759" : subtle,
                  border: item.done ? "none" : `1px solid ${isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}`,
                  fontSize: 11,
                  color: item.done ? "#fff" : "transparent",
                  flexShrink: 0
                }}
              >
                ✓
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, opacity: item.done ? 0.5 : 1, textDecoration: item.done ? "line-through" : "none" }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* warning card */}
        <div style={{ margin: "4px 20px 16px", padding: "12px 14px", borderRadius: 12, background: isLight ? "rgba(255,59,48,0.05)" : "rgba(255,59,48,0.1)", border: `1px solid ${isLight ? "rgba(255,59,48,0.1)" : "rgba(255,59,48,0.15)"}` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#ff3b30", marginBottom: 4 }}>{ko ? "주의" : "Warning"}</div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: muted }}>
            {ko ? "영업 신고 전 소방 점검이 완료되어야 합니다. 순서를 확인하세요." : "Fire inspection must be completed before filing. Check the order."}
          </div>
        </div>

        {/* expert referral */}
        <div style={{ margin: "0 20px 20px", padding: "12px 14px", borderRadius: 12, background: subtle }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: accent, marginBottom: 4 }}>{ko ? "전문가 연결" : "Expert Referral"}</div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: muted }}>
            {ko ? "관할 구청 위생과에 사전 상담을 신청하면 누락 서류를 미리 확인할 수 있습니다." : "Pre-consult with your district hygiene office to check for missing documents."}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Hero: mini dashboard preview ── */
function HeroDashboardPreview({ lang }: { lang: Language }) {
  const ko = lang === "ko";
  return (
    <div
      style={{
        position: "relative",
        marginTop: 56,
        width: "100%",
        maxWidth: 900,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(4px)",
        padding: 20,
        overflow: "hidden"
      }}
    >
      {/* glow */}
      <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 400, height: 200, background: "radial-gradient(circle, rgba(91,140,255,0.2), transparent 70%)", pointerEvents: "none" }} />

      {/* top nav mockup */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(ko ? ["홈", "현재 단계", "로드맵", "펀딩", "분석"] : ["Home", "Current", "Roadmap", "Funding", "Analytics"]).map((tab, i) => (
          <div key={tab} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, background: i === 0 ? "rgba(0,122,255,0.15)" : "rgba(255,255,255,0.05)", color: i === 0 ? "#5B8CFF" : "rgba(255,255,255,0.4)" }}>
            {tab}
          </div>
        ))}
      </div>

      {/* two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14 }}>
        {/* left: main card */}
        <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", padding: 18 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 8 }}>
            {ko ? "로드맵 중심 창업 OS" : "Roadmap-first startup OS"}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>
            {ko ? "카페 창업 로드맵" : "Cafe Startup Roadmap"}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 14 }}>
            {ko ? "5단계 중 3단계 진행 중" : "Stage 3 of 5 in progress"}
          </div>
          {/* progress */}
          <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", marginBottom: 14 }}>
            <div style={{ width: "60%", height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #5B8CFF, #34c759)" }} />
          </div>
          {/* now / next */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(0,122,255,0.08)", border: "1px solid rgba(0,122,255,0.15)" }}>
              <div style={{ fontSize: 10, color: "#5B8CFF", fontWeight: 600, marginBottom: 4 }}>NOW</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{ko ? "인허가 확인" : "Verify Permits"}</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600, marginBottom: 4 }}>NEXT</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>{ko ? "입지 분석" : "Location Analysis"}</div>
            </div>
          </div>
        </div>

        {/* right: stats stack */}
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", padding: 14 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 8 }}>{ko ? "진행 현황" : "Progress"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { v: "60%", l: ko ? "진행률" : "Progress" },
                { v: "3/5", l: ko ? "완료" : "Done" },
                { v: ko ? "카페" : "Cafe", l: ko ? "업종" : "Industry" },
                { v: "5,000" + (ko ? "만" : "K"), l: ko ? "자본금" : "Capital" }
              ].map((m) => (
                <div key={m.l} style={{ textAlign: "center", padding: "8px 4px" }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{m.v}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{m.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", padding: 14 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 8 }}>{ko ? "최근 알림" : "Recent Alert"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: "#ff9f0a", flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{ko ? "보건증 유효기간 확인 필요" : "Health certificate expiry check needed"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mockup 5: Smart Onboarding flow ── */
function MockupOnboarding({ card, muted, subtle, accent, isLight, lang }: MockupProps) {
  const ko = lang === "ko";
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ ...card, padding: 0, borderRadius: 24 }}>
        {/* step indicator */}
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", gap: 8 }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 600,
                background: n < 3 ? "#34c759" : n === 3 ? accent : subtle,
                color: n <= 3 ? "#fff" : muted,
                border: n > 3 ? `1px solid ${isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}` : "none"
              }}>
                {n < 3 ? "✓" : n}
              </div>
              {n < 4 && <div style={{ width: 24, height: 2, borderRadius: 1, background: n < 3 ? "#34c759" : subtle }} />}
            </div>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12, color: muted }}>{ko ? "3 / 4" : "3 of 4"}</span>
        </div>

        {/* question area */}
        <div style={{ padding: "24px 24px 8px" }}>
          <div style={{ fontSize: 11, color: accent, fontWeight: 600, letterSpacing: "0.04em", marginBottom: 8 }}>
            {ko ? "맞춤 설정" : "PERSONALIZATION"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>
            {ko ? "예상 자본금은 얼마인가요?" : "What's your estimated capital?"}
          </div>
          <div style={{ fontSize: 13, color: muted, lineHeight: 1.5, marginBottom: 20 }}>
            {ko ? "선택에 따라 재무 시뮬레이션과 단계별 권장 사항이 달라집니다." : "This affects your financial simulation and stage-specific recommendations."}
          </div>
        </div>

        {/* option buttons */}
        <div style={{ padding: "0 24px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {(ko
            ? [{ v: "3,000만 이하", sub: "소규모 시작" }, { v: "3,000~5,000만", sub: "일반적 규모" }, { v: "5,000만~1억", sub: "중간 투자" }, { v: "1억 이상", sub: "대규모 투자" }]
            : [{ v: "Under 30M", sub: "Small start" }, { v: "30M~50M", sub: "Standard" }, { v: "50M~100M", sub: "Medium" }, { v: "Over 100M", sub: "Large" }]
          ).map((opt, i) => (
            <div key={opt.v} style={{
              padding: "14px 14px",
              borderRadius: 12,
              background: i === 1 ? (isLight ? "rgba(0,122,255,0.06)" : "rgba(0,122,255,0.12)") : subtle,
              border: i === 1 ? `1.5px solid ${accent}` : `1px solid ${isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"}`,
              cursor: "pointer"
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{opt.v}</div>
              <div style={{ fontSize: 11, color: muted }}>{opt.sub}</div>
            </div>
          ))}
        </div>

        {/* bottom bar */}
        <div style={{ padding: "12px 24px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: muted }}>{ko ? "이전" : "Back"}</span>
          <div style={{ padding: "10px 24px", borderRadius: 10, background: accent, color: "#fff", fontSize: 13, fontWeight: 600 }}>
            {ko ? "다음" : "Next"}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mockup 6: Market & Location Intelligence ── */
function MockupMarket({ card, muted, subtle, accent, isLight, lang }: MockupProps) {
  const ko = lang === "ko";
  const areas = ko
    ? [
        { name: "강남역 12번 출구", score: 92, pop: "유동인구 多", rent: "높음", grade: "A+" },
        { name: "합정역 3번 출구", score: 78, pop: "중간", rent: "중간", grade: "B+" },
        { name: "성수동 카페거리", score: 85, pop: "유동인구 多", rent: "중상", grade: "A" }
      ]
    : [
        { name: "Gangnam Stn. Exit 12", score: 92, pop: "High traffic", rent: "High", grade: "A+" },
        { name: "Hapjeong Stn. Exit 3", score: 78, pop: "Medium", rent: "Medium", grade: "B+" },
        { name: "Seongsu Cafe Street", score: 85, pop: "High traffic", rent: "Mid-high", grade: "A" }
      ];

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ ...card, padding: 0, borderRadius: 24, overflow: "hidden" }}>
        {/* map placeholder */}
        <div style={{
          height: 160, position: "relative",
          background: isLight
            ? "linear-gradient(135deg, #e8f0fe 0%, #d4e4fc 50%, #c3d8f7 100%)"
            : "linear-gradient(135deg, #0a1628 0%, #0f2040 50%, #142a52 100%)"
        }}>
          {/* pins */}
          {[{ left: "28%", top: "35%" }, { left: "55%", top: "55%" }, { left: "72%", top: "30%" }].map((pos, i) => (
            <div key={i} style={{ position: "absolute", ...pos, transform: "translate(-50%, -100%)" }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, background: i === 0 ? "#34c759" : accent, border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }} />
            </div>
          ))}
          <div style={{ position: "absolute", bottom: 12, left: 16, fontSize: 11, fontWeight: 600, color: isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.4)", background: isLight ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.4)", padding: "4px 10px", borderRadius: 6, backdropFilter: "blur(4px)" }}>
            {ko ? "상권 분석 지도" : "Market Analysis Map"}
          </div>
        </div>

        {/* location list */}
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: muted, letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: 12 }}>
            {ko ? "추천 입지" : "Recommended Locations"}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {areas.map((a, i) => (
              <div key={a.name} style={{
                display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center",
                padding: "12px 14px", borderRadius: 12,
                background: i === 0 ? (isLight ? "rgba(52,199,89,0.05)" : "rgba(52,199,89,0.08)") : subtle,
                border: i === 0 ? `1px solid ${isLight ? "rgba(52,199,89,0.15)" : "rgba(52,199,89,0.2)"}` : `1px solid ${isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)"}`
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)", color: a.score >= 90 ? "#34c759" : a.score >= 80 ? accent : muted }}>
                  {a.score}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: muted }}>{a.pop} · {ko ? "월세" : "Rent"}: {a.rent}</div>
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                  background: a.grade.startsWith("A") ? (isLight ? "rgba(52,199,89,0.1)" : "rgba(52,199,89,0.15)") : (isLight ? "rgba(0,122,255,0.08)" : "rgba(0,122,255,0.12)"),
                  color: a.grade.startsWith("A") ? "#34c759" : accent
                }}>
                  {a.grade}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mockup 7: Operations Dashboard (post-launch) ── */
function MockupOperations({ card, muted, subtle, accent, isLight, lang }: MockupProps) {
  const ko = lang === "ko";
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ ...card, padding: 20, borderRadius: 24 }}>
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: "#34c759" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#34c759" }}>{ko ? "운영 중" : "Open & Running"}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>{ko ? "모링가 카페 성수" : "Moringa Cafe Seongsu"}</div>
          </div>
          <div style={{ fontSize: 11, color: muted }}>{ko ? "2026년 3월" : "March 2026"}</div>
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { v: "2,340" + (ko ? "만" : "K"), l: ko ? "이번 달 매출" : "Monthly Sales", c: "#34c759" },
            { v: "78" + (ko ? "만" : "K"), l: ko ? "일평균 매출" : "Daily Average", c: accent },
            { v: "1.2" + (ko ? "만" : "K"), l: ko ? "객단가" : "Avg. Ticket", c: "#ff9f0a" }
          ].map((m) => (
            <div key={m.l} style={{ padding: "14px 10px", borderRadius: 12, background: subtle, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{m.l}</div>
            </div>
          ))}
        </div>

        {/* health bars */}
        <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
          {[
            { label: ko ? "프라임 코스트" : "Prime Cost", value: 62, target: 65, color: "#34c759" },
            { label: ko ? "식재료 비율" : "Food Cost Ratio", value: 34, target: 35, color: "#ff9f0a" },
            { label: ko ? "인건비 비율" : "Labor Cost", value: 28, target: 30, color: "#5B8CFF" }
          ].map((bar) => (
            <div key={bar.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{bar.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: bar.value <= bar.target ? "#34c759" : "#ff3b30" }}>{bar.value}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: subtle, position: "relative" }}>
                <div style={{ width: `${bar.value}%`, height: "100%", borderRadius: 3, background: bar.color }} />
                <div style={{ position: "absolute", left: `${bar.target}%`, top: -2, width: 2, height: 10, borderRadius: 1, background: isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" }} />
              </div>
            </div>
          ))}
        </div>

        {/* daily sales mini chart */}
        <div style={{ borderRadius: 14, background: subtle, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{ko ? "최근 7일 매출" : "Last 7 Days"}</span>
            <span style={{ fontSize: 11, color: "#34c759", fontWeight: 600 }}>+12.4%</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 56 }}>
            {[65, 72, 58, 80, 75, 88, 92].map((h, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: "100%", height: `${h}%`, borderRadius: 4,
                  background: i === 6 ? accent : (isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)")
                }} />
                <span style={{ fontSize: 9, color: muted }}>
                  {(ko ? ["월", "화", "수", "목", "금", "토", "일"] : ["M", "T", "W", "T", "F", "S", "S"])[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* bottom action */}
        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <div style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: accent, color: "#fff", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
            {ko ? "오늘 매출 기록하기" : "Log today's sales"}
          </div>
          <div style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: subtle, border: `1px solid ${isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"}`, fontSize: 13, fontWeight: 500, textAlign: "center", color: muted }}>
            {ko ? "상세 대시보드" : "Full dashboard"}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Feature grid icon ─── */
function FeatureIcon({ color, d }: { color: string; d: string }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: 10
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </div>
  );
}

/* ─── Summary features data ─── */
function getSummaryFeatures(lang: Language) {
  const ko = lang === "ko";
  return [
    { color: "#007aff", d: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", title: ko ? "맞춤 로드맵" : "Custom Roadmap", desc: ko ? "업종별 최적 경로" : "Industry-specific path" },
    { color: "#34c759", d: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11", title: ko ? "체크리스트" : "Checklists", desc: ko ? "단계별 실행 항목" : "Stage-by-stage actions" },
    { color: "#ff9f0a", d: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8", title: ko ? "인허가 가이드" : "Permit Guides", desc: ko ? "출처 명시, 최신 검증" : "Source-backed, verified" },
    { color: "#5856d6", d: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6", title: ko ? "세무 가이드" : "Tax Guides", desc: ko ? "간이/일반 신고 안내" : "Filing type assistance" },
    { color: "#30b0c7", d: "M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3", title: ko ? "대출 가이드" : "Loan Guides", desc: ko ? "정책자금 신청 방법" : "Policy loan applications" },
    { color: "#ff375f", d: "M18 20V10M12 20V4M6 20v-6", title: ko ? "재무 시뮬레이션" : "Finance Sim", desc: ko ? "BEP, 런웨이, 위험 분석" : "BEP, runway, risk analysis" },
    { color: "#ff6482", d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", title: ko ? "계약서 분석" : "Contract Scan", desc: ko ? "위험 조항 자동 감지" : "Auto risk clause detection" },
    { color: "#64d2ff", d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 7a3 3 0 100 6 3 3 0 000-6z", title: ko ? "상권 분석" : "Market Analysis", desc: ko ? "입지 점수 비교" : "Location scoring" },
    { color: "#ac8e68", d: "M16 16v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h2m8 0V3a1 1 0 00-1-1H9a1 1 0 00-1 1v2M20 8h-6a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2v-8a2 2 0 00-2-2z", title: ko ? "공급업체 연결" : "Vendor Connect", desc: ko ? "단계별 추천 업체" : "Stage-based suppliers" },
    { color: "#ff9f0a", d: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z", title: ko ? "재고 관리" : "Inventory", desc: ko ? "공급업체 기반 입력" : "Supplier-linked input" },
    { color: "#007aff", d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75", title: ko ? "직원 관리" : "Team Management", desc: ko ? "인건비 자동 반영" : "Auto labor cost sync" },
    { color: "#34c759", d: "M22 12h-4l-3 9L9 3l-3 9H2", title: ko ? "운영 대시보드" : "Ops Dashboard", desc: ko ? "매출, 원가율, KPI" : "Sales, cost, KPIs" },
    { color: "#af52de", d: "M12 2a4 4 0 014 4c0 2-2 3-2 3H10s-2-1-2-3a4 4 0 014-4zM10 9h4v4a2 2 0 01-4 0V9zM8.5 14l-4 6M15.5 14l4 6M12 13v9", title: ko ? "AI 해석" : "AI Interpretation", desc: ko ? "숫자를 행동으로 번역" : "Numbers to actions" },
    { color: "#ff375f", d: "M18 8A6 6 0 006 8c0 7-3 9-6 11 3-2 6-4 6-11zM13.73 21a2 2 0 01-3.46 0", title: ko ? "스마트 알림" : "Smart Alerts", desc: ko ? "놓치기 쉬운 항목 경고" : "Never miss a step" },
    { color: "#5856d6", d: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z", title: ko ? "한/영 지원" : "KO/EN Support", desc: ko ? "완전 이중 언어" : "Fully bilingual" },
    { color: "#64d2ff", d: "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z", title: ko ? "클라우드 동기화" : "Cloud Sync", desc: ko ? "어디서든 이어하기" : "Resume anywhere" }
  ];
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

/* ─── copy ─── */
function txt(lang: Language) {
  if (lang === "ko") {
    return {
      heroEyebrow: "창업의 모든 단계를 함께",
      heroTitle: "시작부터 운영까지,\n한 흐름으로.",
      heroSub:
        "build.up은 창업 로드맵을 단계별로 안내하고, 검증된 가이드와 분석 도구로 판단을 도와줍니다. 지금 시작하세요.",
      heroCta: "무료로 시작하기",
      heroLearn: "더 알아보기",
      ctaTitle: "지금 시작할 준비가\n되셨나요?",
      ctaSub:
        "계정을 만들고, 몇 가지 질문에 답하면 맞춤형 로드맵이 바로 생성됩니다."
    };
  }
  return {
    heroEyebrow: "Every stage of your business, guided",
    heroTitle: "From idea to\noperations, in one flow.",
    heroSub:
      "build.up walks you through a step-by-step startup roadmap with verified guides and analysis tools. Start free today.",
    heroCta: "Get started free",
    heroLearn: "Learn more",
    ctaTitle: "Ready to begin?",
    ctaSub:
      "Create an account, answer a few questions, and your personalized roadmap is ready."
  };
}

/* ─── features ─── */
function getFeatures(lang: Language) {
  if (lang === "ko") {
    return [
      {
        label: "스마트 온보딩",
        title: "몇 가지 질문만으로\n맞춤 로드맵 생성.",
        body: "업종, 자본금, 지역, 목표 오픈일 — 4단계 질문에 답하면 당신만을 위한 창업 로드맵이 자동으로 만들어집니다."
      },
      {
        label: "로드맵",
        title: "지금 해야 할 단계만\n정확하게.",
        body: "모든 할 일을 한꺼번에 보여주지 않습니다. 현재 단계에 집중하고, 완료하면 다음 단계가 자연스럽게 열립니다."
      },
      {
        label: "검증된 가이드",
        title: "출처와 최신성이\n보장된 정보.",
        body: "인허가, 세무, 대출 등 실무 가이드는 출처와 검증 시점을 함께 표시합니다. 오래된 정보에는 경고가 붙습니다."
      },
      {
        label: "분석 도구",
        title: "계약서와 재무를\n읽을 수 있는 언어로.",
        body: "계약서 위험 조항을 자동으로 감지하고, 재무 시뮬레이션 결과를 행동 가능한 해석으로 번역합니다."
      },
      {
        label: "상권 분석",
        title: "데이터 기반으로\n최적의 입지를 찾다.",
        body: "유동인구, 경쟁 밀도, 임대료 수준을 종합 분석해 입지별 점수와 등급을 한눈에 비교할 수 있습니다."
      },
      {
        label: "멘토링",
        title: "단계마다 구체적인\n행동 가이드.",
        body: "각 단계에서 무엇을 해야 하는지, 어떤 위험이 있는지, 누구에게 문의해야 하는지까지 안내합니다."
      },
      {
        label: "운영 대시보드",
        title: "오픈 후에도\n계속 함께.",
        body: "일 매출 기록, 원가율 추적, KPI 건강 지표까지 — 개업 이후의 가게 운영도 한 화면에서 관리합니다."
      }
    ];
  }
  return [
    {
      label: "Smart Onboarding",
      title: "A personalized roadmap\nfrom just a few answers.",
      body: "Industry, capital, location, target date — answer four steps and your custom startup roadmap is ready instantly."
    },
    {
      label: "Roadmap",
      title: "Only the step that\nmatters right now.",
      body: "No overwhelming dashboard. Focus on the current stage, and the next one opens naturally when you're done."
    },
    {
      label: "Verified Guides",
      title: "Information backed by\nsources and freshness.",
      body: "Permits, tax, and loan guides show their sources and verification dates. Outdated content is flagged automatically."
    },
    {
      label: "Analysis Tools",
      title: "Contracts and finance,\nin plain language.",
      body: "Auto-detect risky clauses in contracts and translate financial simulations into actionable interpretation."
    },
    {
      label: "Market Intelligence",
      title: "Find your best location\nwith data, not guesswork.",
      body: "Foot traffic, competition density, and rent levels combined into a score and grade for each potential location."
    },
    {
      label: "Mentoring",
      title: "Specific action guidance\nat every stage.",
      body: "Each stage tells you what to do, what to watch out for, and who to contact when you need help."
    },
    {
      label: "Operations Dashboard",
      title: "We stay with you\nafter opening day.",
      body: "Daily sales logging, cost ratio tracking, and KPI health indicators — manage your running business in one view."
    }
  ];
}
