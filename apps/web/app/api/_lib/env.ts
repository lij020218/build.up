import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * 서버 사이드 전용 환경변수 접근.
 * process.env를 먼저 확인하고, 비어있으면 .env.local 파일에서 직접 읽음.
 * (Claude Code 등이 ANTHROPIC_API_KEY=""로 시스템 환경변수를 덮어쓰는 문제 대응)
 */
let _envFileCache: Record<string, string> | null = null;

function readEnvFile(): Record<string, string> {
  if (_envFileCache) return _envFileCache;
  _envFileCache = {};
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      _envFileCache[key] = val;
    }
  } catch { /* file not found — ok */ }
  return _envFileCache;
}

/**
 * 임의 env var 조회 (typed helpers 가 없는 신규 변수용).
 * 항상 process.env 우선, .env.local 폴백. 빈 문자열은 undefined 취급.
 */
export function getEnvVar(name: string): string | undefined {
  // 1. process.env (non-empty)
  const fromEnv = process.env[name]?.trim();
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  // 2. .env.local fallback
  const fromFile = readEnvFile()[name]?.trim();
  return fromFile && fromFile.length > 0 ? fromFile : undefined;
}

export function getAnthropicApiKey(): string | undefined {
  const key = getEnvVar("ANTHROPIC_API_KEY");
  return key && key.length >= 10 ? key : undefined;
}

export function getOpenAiApiKey(): string | undefined {
  const key = getEnvVar("OPENAI_API_KEY");
  return key && key.length >= 10 ? key : undefined;
}

/** 네이버 DataLab·Search API — Client ID/Secret 쌍 */
export function getNaverApiCreds(): { clientId: string; clientSecret: string } | undefined {
  const clientId = getEnvVar("NAVER_CLIENT_ID");
  const clientSecret = getEnvVar("NAVER_CLIENT_SECRET");
  if (!clientId || !clientSecret || clientId.length < 5 || clientSecret.length < 5) return undefined;
  return { clientId, clientSecret };
}

/** Tavily AI 검색 API */
export function getTavilyApiKey(): string | undefined {
  const key = getEnvVar("TAVILY_API_KEY");
  return key && key.length >= 10 ? key : undefined;
}

/** Supabase service_role 키 — RLS 우회 (cron·서버 쓰기 전용) */
export function getSupabaseServiceRoleKey(): string | undefined {
  const key = getEnvVar("SUPABASE_SERVICE_ROLE_KEY");
  return key && key.length >= 20 ? key : undefined;
}

/** Vercel cron 보호용 secret */
export function getCronSecret(): string | undefined {
  const secret = getEnvVar("CRON_SECRET");
  return secret && secret.length >= 10 ? secret : undefined;
}
