"use client";

import {
  // ⚠️ 2026-05-25: bootstrapAccountWorkspace 호출 제거 — home page 의 connectAndLoad 에 위임.
  //   auth page 와 home page 양쪽에서 호출하면 race condition 으로 "로그인 2번" 버그.
  getAuthErrorMessage,
  getUiCopy,
  ALREADY_REGISTERED_MESSAGE,
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
import { FoundOneLogo } from "../lib/components/ui/FoundOneLogo";
import { FeatureIcon, getSummaryFeatures, txt, getFeatures } from "./landing-copy";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";  // 랜딩 nav "서비스" 버튼만 사용 (login 은 hard reload).
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../language-provider";

/* ─── types ─── */
type AuthMode = "signup" | "login" | "password" | "reset";

/**
 * returnTo 안전 검증 — open redirect 방지.
 *   허용: `/` 로 시작하는 *내부* 절대경로만 (예: /invite/ABCD1234).
 *   거부: `//evil.com`(scheme-relative), `/\evil.com`, `http(s)://...`, 빈 값 등.
 *   검증 실패 시 null 반환 → 호출부에서 `/` 폴백.
 */
function sanitizeReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return null;
  }
  // 내부 경로는 단일 `/` 로 시작해야 함. `//` 또는 `/\` 는 scheme-relative 외부 URL.
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  // http: / https: / javascript: 등 어떤 scheme 도 거부 (이미 `/` 시작이라 이론상 불가하나 방어).
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)) return null;
  return value;
}

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
  // 가입 동의 — [필수] 이용약관 + 개인정보 수집·이용 (명시적 동의, 정보통신망법/개인정보보호법)
  const [agreedRequired, setAgreedRequired] = useState(false);
  const [message, setMessage] = useState<string>(copy.auth.initialMessage);
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  // 가입 완료(자동 인증 모드) — 명시적 완료 화면을 보여준 뒤 홈으로 이동 (2026-07-28 사장님 지시)
  const [signupComplete, setSignupComplete] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  // 인증메일 재발송 쿨다운(초) — Supabase 가 ~60초 throttle 하므로 스팸·throttle 에러 방지.
  const [resendCooldown, setResendCooldown] = useState(0);
  // 초대 등에서 넘어온 복귀 경로(returnTo). open redirect 방지를 위해 검증된 내부 경로만 보관.
  //   (이 페이지는 전부 client-side 라 useSearchParams 대신 window.location 을 effect 에서 읽어
  //    Suspense bailout 없이 처리 — 콜백 페이지와 달리 거대 컴포넌트라 Suspense 래핑을 피한다.)
  const [returnTo, setReturnTo] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("returnTo");
    setReturnTo(sanitizeReturnTo(raw));
  }, []);

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
  //   복귀 경로(returnTo, 예: /invite/ABCD1234)가 검증을 통과했으면 그쪽으로, 아니면 홈으로.
  //   hard reload 라 invite 페이지가 깨끗한 상태로 마운트되어 로그인된 user 로 초대 수락을 이어간다.
  const navigateToHomeHard = () => {
    if (typeof window !== "undefined") {
      window.location.assign(returnTo ?? "/");
    }
  };

  /** 이메일 도메인 → 메일함 바로가기 (인증 대기 화면의 1차 행동. 미지 도메인은 버튼 미노출) */
  const mailboxShortcut = (addr: string): { label: string; url: string } | null => {
    const domain = addr.split("@")[1]?.toLowerCase() ?? "";
    if (domain === "naver.com") return { label: "네이버 메일 열기", url: "https://mail.naver.com" };
    if (domain === "gmail.com") return { label: "Gmail 열기", url: "https://mail.google.com" };
    if (domain === "daum.net" || domain === "hanmail.net") return { label: "다음 메일 열기", url: "https://mail.daum.net" };
    if (domain === "kakao.com") return { label: "카카오 메일 열기", url: "https://mail.kakao.com" };
    if (domain === "nate.com") return { label: "네이트 메일 열기", url: "https://mail.nate.com" };
    return null;
  };

  const handleSignup = () =>
    run(async () => {
      if (!agreedRequired) {
        setMessage("이용약관과 개인정보 수집·이용에 동의해 주세요.");
        return;
      }
      const pwdErr = validatePassword(password);
      if (pwdErr) { setMessage(pwdErr); return; }
      const byInt = parseInt(birthYear, 10);
      // 상한 2010 — user_profiles CHECK·트리거·owner-profile API 와 동일 SSOT.
      //   (불일치 시 폼은 통과하나 트리거가 birth_year 를 NULL 로 저장 → 입력 유실.)
      if (!birthYear || Number.isNaN(byInt) || byInt < 1900 || byInt > 2010) {
        setMessage("올바른 출생연도를 입력해 주세요. (예: 1990)");
        return;
      }
      const result = await signUpWithEmail(supabase, { firstName, lastName, birthYear: byInt, email, password });
      if (result.needsConfirmation) {
        setPendingEmail(result.email);
        setShowConfirmation(true);
        // 이메일 확인 플로우는 /auth/callback 으로 돌아오므로(emailRedirectTo 고정),
        //   returnTo 를 sessionStorage 로 넘겨 콜백이 인증 완료 후 복귀하게 한다.
        if (typeof window !== "undefined" && returnTo) {
          window.sessionStorage.setItem("buildup:auth-return-to", returnTo);
        }
        return;
      }
      // 자동 인증 모드 — 하단 텍스트만으론 완료 여부가 안 보인다는 피드백(2026-07-28):
      //   명시적 완료 화면을 띄우고 잠시 후 홈으로.
      setSignupComplete(true);
      if (typeof window !== "undefined") {
        window.setTimeout(navigateToHomeHard, 1800);
      }
    });

  // 쿨다운 1초 틱다운
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResendEmail = () => {
    if (resendCooldown > 0 || loading) return;
    run(async () => {
      try {
        await resendConfirmationEmail(supabase, pendingEmail);
        setMessage("인증 이메일을 다시 발송했습니다.");
        setResendCooldown(60);
      } catch (err) {
        // Supabase throttle("you can only request this after N seconds") 등 → 한국어로.
        const raw = err instanceof Error ? err.message : String(err);
        const m = raw.match(/after (\d+) seconds?/i);
        if (m) {
          setResendCooldown(Number(m[1]));
          setMessage(`잠시 후 다시 시도해 주세요 (${m[1]}초 후 재발송 가능).`);
        } else {
          setMessage("재발송에 실패했어요. 잠시 후 다시 시도해 주세요.");
          setResendCooldown(30);
        }
      }
    });
  };

  const handleLogin = () =>
    run(async () => {
      try {
        await signInWithEmail(supabase, { email, password });
      } catch (err) {
        // 미인증 계정 로그인 → 하단 텍스트가 아니라 인증 대기 전체 화면(재발송·메일함 바로가기)으로.
        //   (2026-07-28 사장님 피드백: "텍스트 한 줄로는 인증하라는 건지 알 수가 없다")
        const raw = err instanceof Error
          ? err.message
          : String((err as { message?: unknown })?.message ?? "");
        if (raw.toLowerCase().includes("not confirmed")) {
          setPendingEmail(email);
          setShowConfirmation(true);
          setMessage("");
          return;
        }
        throw err;
      }
      setMessage(copy.auth.loggedIn);
      navigateToHomeHard();
    });

  // 카카오 OAuth (login·signup 공용). 카카오로 "계속"하는 행위가 약관·개인정보 동의 의사표시
  //   (버튼 위 고지 문구). 성공 시 카카오로 redirect → /auth/callback 가 세션 수립.
  const handleKakao = () =>
    run(async () => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: `${origin}/auth/callback` },
      });
      if (error) setMessage("카카오 로그인을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.");
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

  // 가입 제출 게이트 — [필수] 약관 동의 전에는 제출 불가. disabled·커서·불투명도가 같은 근거를
  //   쓰도록 한 곳에서 파생 (종전엔 disabled 만 걸리고 스타일은 그대로라 "눌리는 것처럼" 보였음).
  const signupBlocked = mode === "signup" && !agreedRequired;
  const submitDisabled = loading || signupBlocked;

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
        <FoundOneLogo height={20} markColor="#8A8AF0" />
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

      {/* ━━━ 이메일 인증 대기 화면 ━━━
          ⚠️ zIndex 230 필수 — 로그인 모달(200)이 DOM 순서상 나중이라 200으로는 항상 가려져
             이 화면이 "존재하는데 영원히 안 보이는" 버그가 있었음 (2026-07-28 실렌더로 발견). */}
      {showConfirmation && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 230,
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
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: "0 0 8px" }}>
              인증 링크를 발송했습니다. 링크를 클릭하면 바로 서비스를 이용할 수 있습니다.
            </p>
            <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: "0 0 24px" }}>
              메일이 안 보이면 스팸함도 확인해 주세요.
            </p>
            {(() => {
              const shortcut = mailboxShortcut(pendingEmail);
              return shortcut ? (
                <a
                  href={shortcut.url}
                  target="_blank"
                  rel="noopener"
                  style={{
                    display: "block", width: "100%", padding: "13px 0", borderRadius: "12px",
                    border: "none", background: "#3b5c8c", color: "#fff",
                    fontSize: "14px", fontWeight: 600, cursor: "pointer",
                    textDecoration: "none", textAlign: "center", boxSizing: "border-box",
                    marginBottom: "10px",
                  }}
                >
                  {shortcut.label} →
                </a>
              ) : null;
            })()}
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={loading || resendCooldown > 0}
              style={{
                width: "100%", padding: "13px 0", borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent",
                color: resendCooldown > 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.7)",
                fontSize: "14px",
                cursor: loading ? "wait" : resendCooldown > 0 ? "not-allowed" : "pointer",
                marginBottom: "12px",
              }}
            >
              {loading ? "발송 중..." : resendCooldown > 0 ? `${resendCooldown}초 후 재발송` : "이메일 재발송"}
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

      {/* ━━━ 가입 완료 화면 (자동 인증 모드) ━━━ (zIndex 230 — 로그인 모달 200 위) */}
      {signupComplete && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 230,
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
              background: "rgba(104,211,145,0.15)", margin: "0 auto 20px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#68d391" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: "0 0 10px" }}>
              가입이 완료되었습니다
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: "0 0 28px" }}>
              환영합니다! 잠시 후 홈으로 이동합니다.
            </p>
            <button
              type="button"
              onClick={navigateToHomeHard}
              style={{
                width: "100%", padding: "13px 0", borderRadius: "12px",
                border: "none", background: "#3b5c8c", color: "#fff",
                fontSize: "14px", fontWeight: 600, cursor: "pointer",
              }}
            >
              바로 시작하기 →
            </button>
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
              <FoundOneLogo
                height={46}
                direction="column"
                markColor="#8A8AF0"
                style={{ margin: "0 auto" }}
              />
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
                      color: password.length >= 8 && /\d/.test(password) ? "#1d3557" : "rgba(255,120,120,0.9)",
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

              {/* [필수] 동의 — 제출 버튼 "위". 동의가 제출의 전제이므로 버튼보다 먼저 읽혀야 하고,
                  체크해야 아래 버튼이 활성화되는 인과가 눈에 보인다. (종전엔 버튼 아래에 있어
                  왜 버튼이 안 눌리는지 알 수 없었음.) */}
              {mode === "signup" && (
                <label style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  fontSize: 12.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.55,
                  margin: "10px 2px 2px", cursor: "pointer",
                }}>
                  <input
                    type="checkbox"
                    checked={agreedRequired}
                    onChange={(e) => setAgreedRequired(e.target.checked)}
                    style={{ marginTop: 2, width: 16, height: 16, accentColor: "#5b7cfa", flexShrink: 0, cursor: "pointer" }}
                  />
                  <span>
                    <span style={{ color: "#9db4ff", fontWeight: 700 }}>[필수]</span>{" "}
                    <a href="/legal/terms" target="_blank" rel="noopener" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "underline" }}>이용약관</a>
                    {" "}및{" "}
                    <a href="/legal/privacy" target="_blank" rel="noopener" style={{ color: "rgba(255,255,255,0.9)", textDecoration: "underline" }}>개인정보 수집·이용</a>
                    에 동의합니다.
                  </span>
                </label>
              )}

              {/* 무료 앵커 관리 — "영구 무료"로 앵커되면 유료화 시점에 신뢰가 깨진다(Toast $0.99 선례).
                  가입 순간부터 "한시 프로모션"으로 기대를 설정한다. 가격 미정이라 금액은 쓰지 않는다. */}
              {mode === "signup" && (
                <p style={{
                  fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6,
                  margin: "8px 2px 2px",
                }}>
                  지금은 전 기능 무료 프로모션 기간입니다. 정식 운영 후 일부 프리미엄 기능은
                  유료로 전환될 수 있어요. 입력하신 데이터는 그대로 유지됩니다.
                </p>
              )}

              <button
                type="button"
                disabled={submitDisabled}
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
                  boxShadow: submitDisabled ? "none" : "0 2px 10px rgba(30,42,85,0.32)",
                  cursor: loading ? "wait" : signupBlocked ? "not-allowed" : "pointer",
                  opacity: submitDisabled ? 0.45 : 1,
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

              {/* 카카오 로그인 — Supabase Kakao provider 설정 완료 후 NEXT_PUBLIC_KAKAO_LOGIN_ENABLED=true 로 노출. */}
              {(mode === "login" || mode === "signup") && process.env.NEXT_PUBLIC_KAKAO_LOGIN_ENABLED === "true" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 12px" }}>
                    <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.12)" }} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>또는</span>
                    <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.12)" }} />
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleKakao}
                    style={{
                      width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
                      background: "#FEE500", color: "#000000", fontSize: 15, fontWeight: 700,
                      cursor: loading ? "wait" : "pointer", opacity: loading ? 0.6 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {/* 카카오 공식 심볼 (브랜드 가이드 — 옐로우 버튼 + 검정 심볼). 이모지 대체. */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000" aria-hidden style={{ flexShrink: 0 }}>
                      <path d="M12 3C6.477 3 2 6.463 2 10.694c0 2.74 1.84 5.144 4.6 6.49-.15.5-.97 3.32-1 3.54 0 0-.02.17.09.24.11.06.24.01.24.01.32-.05 3.66-2.39 4.24-2.79.58.08 1.18.13 1.83.13 5.523 0 10-3.463 10-7.694S17.523 3 12 3z" />
                    </svg>
                    카카오로 계속하기
                  </button>
                  <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", textAlign: "center", margin: "8px 0 0", lineHeight: 1.5 }}>
                    카카오로 계속하면{" "}
                    <a href="/legal/terms" target="_blank" rel="noopener" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}>이용약관</a>
                    {" "}및{" "}
                    <a href="/legal/privacy" target="_blank" rel="noopener" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}>개인정보처리방침</a>
                    에 동의하게 됩니다.
                  </p>
                </>
              )}

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
                {/* 이미 가입된 이메일 → 다음 행동을 버튼으로 (탭 전환, 입력한 이메일 유지) */}
                {message === ALREADY_REGISTERED_MESSAGE && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => { setMode("login"); setMessage(""); }}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 9, border: "none",
                        background: "#3b5c8c", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      이 이메일로 로그인
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode("reset"); setMessage(""); }}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 9,
                        border: "1px solid rgba(255,255,255,0.15)", background: "transparent",
                        color: "rgba(255,255,255,0.75)", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      비밀번호 재설정
                    </button>
                  </div>
                )}
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
            position: "relative",
            /* 카피의 \n(…까지,\n한 흐름으로.) 존중 — 없으면 '한'이 윗줄에 남아 어색 (2026-07-24 사장님 지적) */
            whiteSpace: "pre-line"
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
