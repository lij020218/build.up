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
  if (process.env.NODE_ENV === "production") return undefined;
  // 2. Local development fallback only
  const fromFile = readEnvFile()[name]?.trim();
  return fromFile && fromFile.length > 0 ? fromFile : undefined;
}

/**
 * @deprecated 함수명은 호환을 위해 유지. 실제로는 OpenAI 키 반환 (2026-05-11 마이그레이션).
 *   Anthropic 결제 잔액 부족으로 GPT-5.4-mini 로 전면 전환. 호출처 변경 최소화 위해
 *   본 함수가 OpenAI 키를 반환하도록 redirect. 새 코드는 `getOpenAIApiKey()` 사용 권장.
 *   Anthropic 결제 복구 후 hybrid 라우팅 원하면 본 함수만 수정.
 */
export function getAnthropicApiKey(): string | undefined {
  // 1순위: OPENAI_API_KEY (현재 메인 LLM)
  const openaiKey = getEnvVar("OPENAI_API_KEY");
  if (openaiKey && openaiKey.length >= 10) return openaiKey;
  // 2순위(fallback): ANTHROPIC_API_KEY — 결제 복구 시 자동 사용
  const anthropicKey = getEnvVar("ANTHROPIC_API_KEY");
  return anthropicKey && anthropicKey.length >= 10 ? anthropicKey : undefined;
}

export function getOpenAiApiKey(): string | undefined {
  const key = getEnvVar("OPENAI_API_KEY");
  return key && key.length >= 10 ? key : undefined;
}

/**
 * 진짜 Anthropic(Claude) 키 — getAnthropicApiKey 의 OpenAI 리다이렉트와 달리 ANTHROPIC_API_KEY 직접 반환.
 *   고위험·고가치 기능(계약서 분석 등)만 선택적으로 진짜 Opus 4.8 로 올릴 때 사용.
 *   미설정이면 호출처가 OpenAI 셔임으로 graceful fallback.
 */
export function getRealAnthropicApiKey(): string | undefined {
  const key = getEnvVar("ANTHROPIC_API_KEY");
  return key && key.length >= 10 ? key : undefined;
}

/** Tavily AI 검색 API */
export function getTavilyApiKey(): string | undefined {
  const key = getEnvVar("TAVILY_API_KEY");
  return key && key.length >= 10 ? key : undefined;
}

/** OpenAI API — RAG embeddings + Anthropic 백업용 LLM. */
export function getOpenAIApiKey(): string | undefined {
  const key = getEnvVar("OPENAI_API_KEY");
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

/**
 * 관리자 콘솔(/admin) 접근 허용 이메일 목록 — 콤마 구분, 소문자 정규화.
 *
 *   서버 전용 allowlist 이므로 사용자가 변조 불가(앱 user_metadata 와 무관).
 *   대표 계정(DEFAULT_ADMIN_EMAILS)은 env 와 무관하게 **항상** 관리자 — env 미설정·오타·
 *   따옴표 혼입 등 설정 실수로 사장님이 잠기는 사고 차단 (2026-07-28 지시). ADMIN_EMAILS 는
 *   추가 관리자를 더하는 용도(합집합)이며 대표 계정을 제거할 수 없다.
 *   ⚠️ 이메일 인증(email_confirmed) 게이트는 admin-auth 에 별도로 있음 — 사칭 차단.
 *   다관리자/세분권한이 필요해지면 app_metadata.is_admin(service-role 만 수정) 으로 승급.
 *   예: ADMIN_EMAILS=ops@foundone.dev
 */
const DEFAULT_ADMIN_EMAILS = ["lij020218@naver.com"]; // 대표(사장님) 계정 — 항상 포함

export function getAdminEmails(): string[] {
  const raw = getEnvVar("ADMIN_EMAILS") ?? "";
  const fromEnv = raw
    .split(",")
    // 대시보드에서 따옴표까지 붙여 넣는 실수 방어: 양끝 "/' 제거 후 정규화
    .map((e) => e.trim().replace(/^["']+|["']+$/g, "").trim().toLowerCase())
    .filter((e) => e.length > 0);
  return [...new Set([...DEFAULT_ADMIN_EMAILS, ...fromEnv])];
}
