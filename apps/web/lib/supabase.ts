import { createFoundOneSupabaseClient } from "@foundone/shared";
import type { SupabaseClient } from "@supabase/supabase-js";

// 클라이언트 컴포넌트 전용 Supabase 인스턴스.
// API 라우트에서는 요청별 인증이 필요한 경우 _lib/auth.ts의 별도 클라이언트를 사용할 것.
//
// ⚠️ lazy init — 모듈 로드 시점에 env 체크/throw 하면 `next build` 의 page-data 수집 단계에서
//   (CI 처럼 env 미설정) 이 모듈을 import 하는 API 라우트만으로 빌드가 실패한다.
//   첫 사용 시점에 1회 생성하고, 기존 `supabase.xxx` 호출부는 그대로 두기 위해 Proxy 로 위임한다.
let _client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing Next.js Supabase environment variables.");
  }
  _client = createFoundOneSupabaseClient(url, anonKey);
  return _client;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client as object, prop, receiver);
    // 메서드는 실제 클라이언트에 bind (this 보존). getter 반환 객체(auth 등)는 그대로.
    return typeof value === "function" ? value.bind(client) : value;
  },
});
