/**
 * envelope-crypto.ts — 봉투 암호화 (Envelope Encryption)
 *
 * 외부 PG (포트원·토스 등) API Secret 을 우리 DB 에 안전하게 보관하기 위한 표준 암호화.
 *
 * 구조:
 *   plaintext Secret
 *      ↓ AES-256-GCM (per-user DEK, 32 bytes random)
 *   encrypted Secret + IV + AuthTag → DB
 *
 *   DEK
 *      ↓ AES-256-GCM (KEK from env, 32 bytes)
 *   encrypted DEK + IV + AuthTag → DB
 *
 * KEK 는 PORTONE_KEK_BASE64 환경변수로만 접근. 절대 DB 와 같은 곳에 저장 X.
 *
 * 키 회전:
 *   - KEK 변경 시 새 버전(kek_version) 부여 → 기존 row 의 DEK 만 재암호화 (데이터 자체 재암호화 불필요)
 *   - DEK 회전: 사장님이 PG Secret 재발급 시 자동 (새 secret = 새 DEK + 새 암호화)
 *
 * 한국 개인정보보호법 「안전성 확보조치 기준」 (2025.10.31 시행) 의
 * "암호 키 생성·이용·보관·배포·파기 절차" 요구사항 충족.
 */

import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  type CipherGCMTypes,
} from "crypto";
import { getEnvVar } from "./env";

const ALGO: CipherGCMTypes = "aes-256-gcm";
const IV_LEN = 12; // GCM 권장 96-bit
const KEY_LEN = 32; // AES-256

export type EnvelopedSecret = {
  /** base64 — DEK 로 암호화된 평문 시크릿 */
  encryptedSecret: string;
  secretIv: string;
  secretAuthTag: string;
  /** base64 — KEK 로 암호화된 DEK */
  encryptedDek: string;
  dekIv: string;
  dekAuthTag: string;
  /** KEK 버전 — 회전 시 식별용 */
  kekVersion: number;
};

// ─── 내부 유틸 ─────────────────────────────────────────────────────────

function encryptGcm(key: Buffer, plaintext: Buffer) {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { ciphertext, iv, authTag };
}

function decryptGcm(
  key: Buffer,
  ciphertext: Buffer,
  iv: Buffer,
  authTag: Buffer
) {
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * KEK 로드 — 환경변수 PORTONE_KEK_BASE64 에서.
 * 32 bytes (AES-256) base64 인코딩 필요.
 *
 * 생성 방법 (한 번만):
 *   $ openssl rand -base64 32
 *   → 결과를 .env.local 의 PORTONE_KEK_BASE64 에 붙여넣기
 *
 * 향후 키 회전 시 새 KEK 를 PORTONE_KEK_BASE64_V2 로 추가 + 코드에서 version 분기.
 */
function loadKek(version = 1): Buffer {
  const envName = version === 1 ? "PORTONE_KEK_BASE64" : `PORTONE_KEK_BASE64_V${version}`;
  const raw = getEnvVar(envName);
  if (!raw) {
    throw new Error(
      `[envelope-crypto] KEK env var ${envName} not set. ` +
      `Generate one with: openssl rand -base64 32`
    );
  }
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== KEY_LEN) {
    throw new Error(
      `[envelope-crypto] KEK ${envName} must decode to exactly ${KEY_LEN} bytes (got ${buf.length}). ` +
      `Use: openssl rand -base64 32`
    );
  }
  return buf;
}

// ─── 공개 API ──────────────────────────────────────────────────────────

/**
 * 평문 Secret 을 봉투 암호화 → DB 에 저장 가능한 형태로 변환.
 */
export function envelopeEncrypt(plaintextSecret: string, kekVersion = 1): EnvelopedSecret {
  if (!plaintextSecret || plaintextSecret.length === 0) {
    throw new Error("[envelope-crypto] plaintext secret is empty");
  }
  const dek = randomBytes(KEY_LEN);
  try {
    const secretBlob = encryptGcm(dek, Buffer.from(plaintextSecret, "utf8"));
    const kek = loadKek(kekVersion);
    const dekBlob = encryptGcm(kek, dek);
    return {
      encryptedSecret: secretBlob.ciphertext.toString("base64"),
      secretIv: secretBlob.iv.toString("base64"),
      secretAuthTag: secretBlob.authTag.toString("base64"),
      encryptedDek: dekBlob.ciphertext.toString("base64"),
      dekIv: dekBlob.iv.toString("base64"),
      dekAuthTag: dekBlob.authTag.toString("base64"),
      kekVersion,
    };
  } finally {
    // DEK 메모리에서 즉시 제거 (메모리 덤프 방지)
    dek.fill(0);
  }
}

/**
 * 봉투에서 평문 Secret 복호화. 호출 후 결과를 절대 로그에 남기지 말 것.
 */
export function envelopeDecrypt(enc: EnvelopedSecret): string {
  const kek = loadKek(enc.kekVersion);
  const dek = decryptGcm(
    kek,
    Buffer.from(enc.encryptedDek, "base64"),
    Buffer.from(enc.dekIv, "base64"),
    Buffer.from(enc.dekAuthTag, "base64")
  );
  try {
    const secret = decryptGcm(
      dek,
      Buffer.from(enc.encryptedSecret, "base64"),
      Buffer.from(enc.secretIv, "base64"),
      Buffer.from(enc.secretAuthTag, "base64")
    );
    return secret.toString("utf8");
  } finally {
    dek.fill(0);
  }
}

/**
 * KEK 사용 가능 여부 확인 (ConnectAPI 가 시작 시 호출 → 친절한 에러 메시지).
 */
export function isKekAvailable(version = 1): boolean {
  try {
    loadKek(version);
    return true;
  } catch {
    return false;
  }
}

/**
 * 마스킹된 시크릿 미리보기 (감사 로그·UI 용)
 *  예) "abcd1234...XYZ9" → "abcd...XYZ9"
 */
export function maskSecret(secret: string): string {
  if (secret.length <= 8) return "****";
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}
