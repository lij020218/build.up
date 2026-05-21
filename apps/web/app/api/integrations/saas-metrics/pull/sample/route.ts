/**
 * GET /api/integrations/saas-metrics/pull/sample
 *
 * 사장님이 구현해야 할 endpoint 의 응답 shape 과 curl 예시 반환.
 * UI 에서 "예시 복사" 버튼이 이 응답을 사용.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const sampleSaas = {
    as_of: new Date().toISOString().slice(0, 10),
    mode: "saas",
    step_1: 2480, // 방문
    step_2: 287, // 가입
    step_3: 98, // 활성화
    step_4: 23, // 유료
  };
  const sampleCommerce = {
    as_of: new Date().toISOString().slice(0, 10),
    mode: "commerce",
    step_1: 5210, // 방문
    step_2: 412, // 장바구니
    step_3: 184, // 결제시작
    step_4: 96, // 구매완료
  };

  return NextResponse.json({
    ok: true,
    spec: {
      method: "GET",
      auth: "Authorization: Bearer <secret_token>",
      timeout_seconds: 10,
      response_content_type: "application/json",
      schema: {
        as_of: "string (YYYY-MM-DD, 선택)",
        mode: "'saas' | 'commerce' (선택, 미입력 시 등록 시 funnel_mode 사용)",
        step_1: "integer >= 0 (필수) — 방문",
        step_2: "integer >= 0 (필수) — 가입 | 장바구니",
        step_3: "integer >= 0 (필수) — 활성화 | 결제시작",
        step_4: "integer >= 0 (필수) — 유료 | 구매완료",
      },
    },
    examples: {
      saas: sampleSaas,
      commerce: sampleCommerce,
    },
    curl_example: [
      "curl -X GET 'https://api.example.com/buildup/funnel' \\",
      "  -H 'Authorization: Bearer YOUR_SECRET_TOKEN' \\",
      "  -H 'Accept: application/json'",
    ].join("\n"),
    notes: [
      "endpoint 는 반드시 https 여야 합니다.",
      "응답은 10초 이내로 반환되어야 합니다 (timeout).",
      "비밀 토큰은 봉투 암호화(AES-256-GCM + KEK) 후 DB 에 저장됩니다.",
      "매일 04:00 KST 에 자동 수집됩니다.",
      "401/403 응답이 반복되면 연결 status='invalid' 로 마킹됩니다.",
    ],
  });
}
