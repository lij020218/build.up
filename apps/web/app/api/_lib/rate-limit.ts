type Bucket = {
  count: number;
  windowStartedAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkSimpleRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; status: number; error: string } {
  const now = Date.now();
  const current = buckets.get(params.key);

  if (!current || now - current.windowStartedAt >= params.windowMs) {
    buckets.set(params.key, { count: 1, windowStartedAt: now });
    return { ok: true };
  }

  if (current.count >= params.limit) {
    return {
      ok: false,
      status: 429,
      error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
    };
  }

  current.count += 1;
  buckets.set(params.key, current);
  return { ok: true };
}
