/**
 * Sign in with Apple — 서버측 토큰 교환·폐기 (App Store 5.1.1(v): 계정 삭제 시 revoke 필수)
 *
 *  흐름:
 *   가입/로그인(iOS) → ASAuthorizationAppleIDCredential.authorizationCode 를 POST /api/account/apple-link 로 전달
 *   → exchangeAuthorizationCode() 로 refresh_token 획득 → apple_auth_tokens 에 envelope 암호화 저장
 *   계정 삭제 → revokeToken(refresh_token) → 행 삭제(FK CASCADE 로도 정리)
 *
 *  환경변수 (없으면 isAppleSignInConfigured()=false → 조용히 skip; 삭제 자체는 진행):
 *   APPLE_TEAM_ID              (기존)
 *   APPLE_SIGNIN_KEY_ID        Sign in with Apple 키 ID (Certificates ▸ Keys ▸ .p8)
 *   APPLE_SIGNIN_PRIVATE_KEY   .p8 본문 (\n 은 리터럴 개행 또는 "\\n")
 *   APPLE_SIGNIN_CLIENT_ID     iOS 네이티브 = 번들 ID (기본 com.foundone.mobile)
 *
 *  근거: https://developer.apple.com/documentation/signinwithapplerestapi/generate_and_validate_tokens
 *        https://developer.apple.com/documentation/signinwithapplerestapi/revoke_tokens
 */

import { SignJWT, importPKCS8 } from "jose";

const APPLE_AUD = "https://appleid.apple.com";
const TOKEN_URL = "https://appleid.apple.com/auth/token";
const REVOKE_URL = "https://appleid.apple.com/auth/revoke";

function cfg() {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const keyId = process.env.APPLE_SIGNIN_KEY_ID?.trim();
  const rawKey = process.env.APPLE_SIGNIN_PRIVATE_KEY?.trim();
  const clientId = process.env.APPLE_SIGNIN_CLIENT_ID?.trim() || "com.foundone.mobile";
  if (!teamId || !keyId || !rawKey) return null;
  return { teamId, keyId, privateKey: rawKey.replace(/\\n/g, "\n"), clientId };
}

export function isAppleSignInConfigured(): boolean {
  return cfg() !== null;
}

/** client_secret = ES256 JWT (iss=team, sub=client_id, aud=appleid, ≤ 6개월) — 호출마다 짧게 발급 */
export async function makeAppleClientSecret(): Promise<string> {
  const c = cfg();
  if (!c) throw new Error("apple signin not configured");
  const key = await importPKCS8(c.privateKey, "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: c.keyId })
    .setIssuer(c.teamId)
    .setSubject(c.clientId)
    .setAudience(APPLE_AUD)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(key);
}

export type AppleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

/** authorizationCode → { refresh_token, sub } (5분 내 1회만 교환 가능) */
export async function exchangeAuthorizationCode(code: string): Promise<{ refreshToken: string; sub: string | null }> {
  const c = cfg();
  if (!c) throw new Error("apple signin not configured");
  const body = new URLSearchParams({
    client_id: c.clientId,
    client_secret: await makeAppleClientSecret(),
    code,
    grant_type: "authorization_code",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  const json = (await res.json().catch(() => ({}))) as AppleTokenResponse;
  if (!res.ok || !json.refresh_token) {
    throw new Error(`apple token exchange failed: ${res.status} ${json.error ?? ""} ${json.error_description ?? ""}`.trim());
  }
  return { refreshToken: json.refresh_token, sub: decodeJwtSub(json.id_token) };
}

/** refresh_token 폐기 — Apple 은 성공/이미 폐기 모두 200 */
export async function revokeAppleRefreshToken(refreshToken: string): Promise<boolean> {
  const c = cfg();
  if (!c) return false;
  const body = new URLSearchParams({
    client_id: c.clientId,
    client_secret: await makeAppleClientSecret(),
    token: refreshToken,
    token_type_hint: "refresh_token",
  });
  const res = await fetch(REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  return res.ok;
}

function decodeJwtSub(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const payload = idToken.split(".")[1];
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string };
    return json.sub ?? null;
  } catch {
    return null;
  }
}
