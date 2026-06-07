import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ⚠️ lazy init — 모듈 로드 시점에 env 체크/throw 하면 `next build` 의 page-data 수집 단계에서
//   (CI 처럼 env 미설정 환경) 라우트 import 만으로 빌드가 실패한다. 요청 시점에만 생성·검증.
let _supabaseAdminless: SupabaseClient | null = null;
function getAdminlessClient(): SupabaseClient {
  if (_supabaseAdminless) return _supabaseAdminless;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables for API auth.");
  }
  _supabaseAdminless = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  return _supabaseAdminless;
}

export type ApiAuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

/**
 * 요청의 Bearer 토큰을 그대로 설정한 Supabase 클라이언트 (RLS 적용).
 *
 *  service_role(getSupabaseAdmin)과 달리 RLS 가 강제되므로, "본인 데이터 읽기" 경로에서
 *  defense-in-depth 로 사용한다 — 코드에서 user_id 필터를 실수로 빠뜨려도 RLS 가 타 사용자
 *  데이터 노출을 막는다. 쓰기(INSERT/UPDATE)는 해당 테이블에 authenticated RLS 정책이 있을 때만
 *  동작하므로, 정책이 service_role 전용인 경우엔 getSupabaseAdmin 을 사용해야 한다.
 *
 *  토큰이 없거나 env 미설정이면 null. 호출부는 requireApiUser 통과 후 사용하므로 보통 non-null.
 */
export function getUserScopedClient(request: Request): SupabaseClient | null {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

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

  const { data, error } = await getAdminlessClient().auth.getUser(token);

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

  const { data, error } = await getAdminlessClient().auth.getUser(token);

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
