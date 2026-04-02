import { createBuildUpSupabaseClient } from "@build-up/shared";

// 클라이언트 컴포넌트 전용 Supabase 인스턴스.
// API 라우트에서는 요청별 인증이 필요한 경우 _lib/auth.ts의 별도 클라이언트를 사용할 것.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Missing Next.js Supabase environment variables.");
}

export const supabase = createBuildUpSupabaseClient(url, anonKey);
