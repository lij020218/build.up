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

/**
 * Anthropic Prompt Caching 적용 system prompt 빌더.
 *
 * - 1024+ 토큰의 안정적 system prompt 를 cache_control 로 감싸 재사용 시 90% 비용 절감 + 85% 지연 감소
 * - 기본 TTL 5분 (ephemeral) — 짧은 세션 내 반복 호출 (대시보드 코칭 등) 에 최적
 * - "1h" 옵션 — 로드맵 같은 큰 prompt 가 시간대별 안정 재사용 될 때
 *
 * 사용 예:
 *   client.messages.create({
 *     model, max_tokens,
 *     system: systemWithCache(LONG_SYSTEM_PROMPT),
 *     messages: [...]
 *   });
 *
 * 참고: 4개 cache breakpoint 까지 가능 (tools, system, document, conversation).
 *       현재 헬퍼는 system 단일 breakpoint 만 처리. 더 세밀한 분할은 인라인으로.
 */
export function systemWithCache(
  text: string,
  ttl: "5m" | "1h" = "5m",
): Array<{ type: "text"; text: string; cache_control: { type: "ephemeral"; ttl?: "1h" } }> {
  return [
    {
      type: "text",
      text,
      cache_control: ttl === "1h" ? { type: "ephemeral", ttl: "1h" } : { type: "ephemeral" },
    },
  ];
}

export { DEFAULT_TIMEOUT_MS, LONG_TIMEOUT_MS };
