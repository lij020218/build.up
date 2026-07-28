import type { SupabaseClient } from "@supabase/supabase-js";

export type FoundOneAuthClient = SupabaseClient;

export type SignUpWithEmailParams = {
  firstName: string;
  lastName: string;
  birthYear?: number;
  email: string;
  password: string;
};

/** 너무 흔해 사전공격 1순위인 비밀번호 (소문자 비교). */
const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890",
  "qwerty123", "qwertyui", "11111111", "00000000", "abcd1234", "asdf1234",
  "iloveyou", "admin123", "welcome1", "letmein1", "1q2w3e4r", "zxcvbnm1",
]);

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
  // ⚠️ 2026-06-05 보안: 영문+숫자 모두 요구 → "12345678" 같은 전부 숫자 약한 비번 차단.
  if (!/[a-zA-Z]/.test(password)) return "비밀번호에 영문자를 1개 이상 포함해야 합니다.";
  if (!/\d/.test(password)) return "비밀번호에 숫자를 1개 이상 포함해야 합니다.";
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return "너무 흔한 비밀번호입니다. 추측하기 어려운 비밀번호를 사용해 주세요.";
  }
  return null;
}

export type SignInWithEmailParams = {
  email: string;
  password: string;
};

/** "이미 가입된 이메일" 안내 문구 — UI 가 이 문구로 로그인/재설정 CTA 를 띄운다 (웹·iOS 동일 판정). */
export const ALREADY_REGISTERED_MESSAGE =
  "이미 가입된 이메일이에요. 아래에서 로그인하거나 비밀번호를 재설정해 주세요.";

/**
 * Supabase 인증 에러 → 한국어 안내.
 *   ⚠️ 종전에는 "Email not confirmed" 만 번역하고 나머지는 영어 원문 노출
 *   ("User already registered" 등) — 사장님이 중복 기준을 오해한 원인 (2026-07-28).
 *   미지의 에러도 한국어 기본문 + 원문 병기로 통일.
 */
export function getAuthErrorMessage(error: unknown) {
  let raw = "";
  if (error instanceof Error && error.message) raw = error.message;
  else if (error && typeof error === "object" && "message" in error) {
    raw = String((error as { message?: unknown }).message ?? "");
  }
  if (!raw) return "인증에 실패했습니다. 다시 시도해 주세요.";

  const m = raw.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) {
    return ALREADY_REGISTERED_MESSAGE;
  }
  if (m.includes("not confirmed")) {
    return "이메일 인증이 필요합니다. 받은 편지함을 확인해 주세요.";
  }
  if (m.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (m.includes("validate email") || m.includes("invalid format")) {
    return "이메일 주소 형식이 올바르지 않습니다.";
  }
  if (m.includes("password should be") || m.includes("weak password")) {
    return "비밀번호가 너무 약합니다. 8자 이상, 영문과 숫자를 포함해 주세요.";
  }
  const sec = raw.match(/after (\d+) seconds?/i);
  if (sec) return `요청이 너무 잦아요. ${sec[1]}초 후 다시 시도해 주세요.`;
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return "요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.";
  }
  if (m.includes("network") || m.includes("failed to fetch")) {
    return "네트워크 오류가 발생했어요. 연결을 확인하고 다시 시도해 주세요.";
  }
  return `인증에 실패했습니다. 다시 시도해 주세요. (${raw})`;
}

export type SignUpResult =
  | { needsConfirmation: false; user: NonNullable<unknown>; session: NonNullable<unknown> }
  | { needsConfirmation: true; email: string };

export async function signUpWithEmail(
  client: FoundOneAuthClient,
  params: SignUpWithEmailParams
): Promise<SignUpResult> {
  const displayName = `${params.lastName}${params.firstName}`.trim();
  const { data, error } = await client.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        first_name: params.firstName,
        last_name: params.lastName,
        name: displayName,
        ...(params.birthYear ? { birth_year: String(params.birthYear) } : {}),
      },
      // flow=confirm — 콜백이 "이메일 인증 도착"임을 알고, 자동로그인(PKCE 교환) 실패 시에도
      //   "인증 실패"가 아니라 "인증 완료 — 로그인해 주세요"를 보여주기 위한 마커.
      //   (다른 브라우저/메일앱 내장 브라우저에서 링크를 열면 code_verifier 부재로 교환 실패가 정상)
      emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?flow=confirm`,
    }
  });

  if (error) throw error;

  // 이메일 인증이 활성화된 경우 — session이 null이고 user만 존재
  if (data.user && !data.session) {
    return { needsConfirmation: true, email: params.email };
  }

  return { needsConfirmation: false, user: data.user!, session: data.session! };
}

export async function resendConfirmationEmail(
  client: FoundOneAuthClient,
  email: string
) {
  const { error } = await client.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?flow=confirm`,
    },
  });
  if (error) throw error;
}

export async function signInWithEmail(
  client: FoundOneAuthClient,
  params: SignInWithEmailParams
) {
  const { data, error } = await client.auth.signInWithPassword({
    email: params.email,
    password: params.password
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOutUser(client: FoundOneAuthClient) {
  const { error } = await client.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function updateCurrentUserPassword(
  client: FoundOneAuthClient,
  nextPassword: string
) {
  const { data, error } = await client.auth.updateUser({
    password: nextPassword
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 비밀번호 재설정 메일 발송.
 *  redirectTo = `{origin}/auth/callback?type=recovery` 권장 — 메일 링크 클릭 시
 *  콜백이 recovery 세션을 만든 뒤 새 비밀번호 입력 화면으로 전환.
 *  보안: Supabase 는 미가입 이메일이어도 동일 성공 응답(계정 존재 노출 방지).
 */
export async function sendPasswordReset(
  client: FoundOneAuthClient,
  email: string,
  redirectTo: string
) {
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    throw error;
  }
}
