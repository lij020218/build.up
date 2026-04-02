type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  area: "ai";
  route: string;
  requestId?: string;
  event:
    | "auth_failed"
    | "rate_limited"
    | "fallback_used"
    | "parse_failed"
    | "request_failed"
    | "fetch_failed";
  userId?: string;
  status?: number;
  detail?: string;
  meta?: Record<string, string | number | boolean | null | undefined>;
};

function toSafeErrorDetail(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "unknown_error";
}

export function logApiEvent(level: LogLevel, payload: LogPayload) {
  const record = {
    timestamp: new Date().toISOString(),
    ...payload
  };

  const serialized = JSON.stringify(record);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}

export function logApiError(route: string, event: LogPayload["event"], error: unknown, extras?: Omit<LogPayload, "area" | "route" | "event" | "detail">) {
  logApiEvent("error", {
    area: "ai",
    route,
    event,
    detail: toSafeErrorDetail(error),
    ...extras
  });
}

export function getRequestId(request: Request) {
  const incoming =
    request.headers.get("x-request-id") ??
    request.headers.get("X-Request-Id") ??
    request.headers.get("x-correlation-id") ??
    request.headers.get("X-Correlation-Id");

  if (incoming?.trim()) {
    return incoming.trim();
  }

  return crypto.randomUUID();
}
