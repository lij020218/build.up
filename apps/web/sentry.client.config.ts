import * as Sentry from "@sentry/nextjs";

// ⚠️ 세션 리플레이는 사용자 화면(매출·상호명·이메일 등 PII)을 녹화 → 동의 없이는 개인정보 이슈.
//   출시 시점엔 replay 비활성. 추후 동의 흐름 + 개인정보처리방침 위탁(Sentry) 명시 + maskAllInputs/Text
//   설정 후 재활성화할 것. 에러 캡처(메시지·스택)는 그대로 유지.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
