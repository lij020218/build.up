import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Missing Supabase environment variables for API auth.");
}

const supabaseAdminless = createClient(url, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export type ApiAuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

export async function requireApiUser(request: Request): Promise<ApiAuthResult> {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Authentication required / 로그인이 필요합니다."
    };
  }

  const { data, error } = await supabaseAdminless.auth.getUser(token);

  if (error || !data.user || data.user.is_anonymous) {
    return {
      ok: false,
      status: 401,
      error: "Valid account session required / 유효한 계정 세션이 필요합니다."
    };
  }

  return {
    ok: true,
    userId: data.user.id
  };
}

/**
 * 익명 (anonymous) Supabase 세션도 허용하는 변형.
 *
 * 사용처: 데모 초기화처럼 "본인 user_id 의 본인 데이터를 본인이 지우는" 작업.
 *  - 결제·통합 같은 민감 작업은 `requireApiUser` 를 그대로 사용 (익명 거부).
 *  - 자기 계정 데이터 wipe 는 RLS 와 user_id 일치 조건으로 충분히 안전하므로 anon 도 허용해야 한다.
 *
 * 그렇지 않으면 데모 모드 사용자가 "초기화" 를 눌러도 서버 데이터가 그대로 남아 다음 마운트에 다시 로드됨.
 */
export async function requireApiUserAllowAnon(request: Request): Promise<ApiAuthResult> {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Authentication required / 로그인이 필요합니다."
    };
  }

  const { data, error } = await supabaseAdminless.auth.getUser(token);

  if (error || !data.user) {
    return {
      ok: false,
      status: 401,
      error: "Invalid session / 유효하지 않은 세션입니다."
    };
  }

  return {
    ok: true,
    userId: data.user.id
  };
}
