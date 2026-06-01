import type { SupabaseClient } from "@supabase/supabase-js";

export type FoundOneAuthClient = SupabaseClient;

export type SignUpWithEmailParams = {
  firstName: string;
  lastName: string;
  birthYear?: number;
  email: string;
  password: string;
};

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
  if (!/\d/.test(password)) return "비밀번호에 숫자를 1개 이상 포함해야 합니다.";
  return null;
}

export type SignInWithEmailParams = {
  email: string;
  password: string;
};

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    if (error.message === "Email not confirmed") {
      return "이메일 인증이 필요합니다. 받은 편지함을 확인해 주세요.";
    }
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "");
    if (message === "Email not confirmed") {
      return "이메일 인증이 필요합니다. 받은 편지함을 확인해 주세요.";
    }
    if (message) return message;
  }

  return "인증에 실패했습니다. 다시 시도해 주세요.";
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
      emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
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
      emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
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
