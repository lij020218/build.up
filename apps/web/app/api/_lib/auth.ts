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
      error: "로그인이 필요합니다."
    };
  }

  const { data, error } = await supabaseAdminless.auth.getUser(token);

  if (error || !data.user || data.user.is_anonymous) {
    return {
      ok: false,
      status: 401,
      error: "유효한 계정 세션이 필요합니다."
    };
  }

  return {
    ok: true,
    userId: data.user.id
  };
}
