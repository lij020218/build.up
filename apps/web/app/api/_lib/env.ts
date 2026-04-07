import { readFileSync } from "fs";
import { join } from "path";

let _cachedAnthropicKey: string | null = null;

/**
 * ANTHROPIC_API_KEY를 안전하게 가져옵니다.
 * turbo globalEnv가 빈 값으로 덮어쓰는 문제를 우회하여
 * .env.local에서 직접 읽기를 폴백으로 사용합니다.
 */
export function getAnthropicApiKey(): string | undefined {
  // 캐시된 값이 있으면 바로 반환
  if (_cachedAnthropicKey) return _cachedAnthropicKey;

  // 1차: process.env에서 읽기
  const envVal = process.env.ANTHROPIC_API_KEY;
  if (envVal && envVal.trim().length >= 10) {
    _cachedAnthropicKey = envVal.trim();
    return _cachedAnthropicKey;
  }

  // 2차: .env.local 파일에서 직접 읽기 (turbo 문제 우회)
  try {
    const envPath = join(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf8");
    const match = content.match(/ANTHROPIC_API_KEY=(.+)/);
    if (match && match[1].trim().length >= 10) {
      _cachedAnthropicKey = match[1].trim();
      return _cachedAnthropicKey;
    }
  } catch {
    // .env.local 없으면 무시
  }

  return undefined;
}
