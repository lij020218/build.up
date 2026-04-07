import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_TIMEOUT_MS = 30_000; // 30초
const LONG_TIMEOUT_MS = 60_000; // 60초 (roadmap 등 복잡한 생성)

export function createAiClient(apiKey: string) {
  return new Anthropic({
    apiKey,
    timeout: DEFAULT_TIMEOUT_MS,
  });
}

export function createLongAiClient(apiKey: string) {
  return new Anthropic({
    apiKey,
    timeout: LONG_TIMEOUT_MS,
  });
}

export { DEFAULT_TIMEOUT_MS, LONG_TIMEOUT_MS };
