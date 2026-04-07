/**
 * 서버 사이드 전용 환경변수 접근.
 * process.env에서만 읽으며, 파일시스템 접근 없음.
 */
export function getAnthropicApiKey(): string | undefined {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  return key && key.length >= 10 ? key : undefined;
}

export function getOpenAiApiKey(): string | undefined {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key && key.length >= 10 ? key : undefined;
}
