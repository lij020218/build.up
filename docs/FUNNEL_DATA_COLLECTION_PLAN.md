# 전환율 funnel 데이터 자동 수집 — Phase 2 계획

> 2026-05-19 작성 — Phase 1 (수동 입력 + Supabase 저장) 완료 시점에서 Phase 2/3 의 자동 수집 채널 설계.

## 배경

웹 + iOS 운영 대시보드에 **전환율** 카드를 추가했습니다.
- Phase 1 (완성): 사장님이 4단계 funnel 인원수를 직접 입력 → `saas_metrics_manual_weekly` 저장
- Phase 2 (이 문서): GA4 OAuth · Custom Webhook 두 자동 채널
- Phase 3 (선택): Stripe · 스마트스토어 API · PostHog 셀프호스팅

## Supabase 스키마 (이미 적용됨)

`supabase/migrations/20260519_000001_funnel_metrics.sql`:
- `saas_metrics_manual_weekly` — 사장님 직접 입력 (주간)
- `saas_metrics_ga4_daily` — GA4 cron 적재 (일일)
- `saas_metrics_events_raw` + `saas_metrics_webhook_daily` — Webhook 채널
- `v_saas_metrics_unified` — 세 채널 UNION + 우선순위 (manual > ga4 > webhook)

모든 read 는 view 를 통해 — client 는 어떤 채널에서 왔는지 알 필요 없음.

## Phase 2A — GA4 OAuth 연동

### 사용자 flow

1. 사장님이 iOS 또는 웹에서 "내 정보 → 데이터 연결 → Google Analytics" 진입
2. OAuth 동의 화면: scope `https://www.googleapis.com/auth/analytics.readonly`
3. 콜백: Supabase 에 refresh token 암호화 저장 (`saas_integrations.ga4_refresh_token`)
4. 사장님 GA4 property ID 선택 (드롭다운) → `saas_integrations.ga4_property_id`
5. 즉시 백필: 지난 30일 데이터 pull
6. 매일 새벽 04:00 KST cron: 어제 데이터 pull → `saas_metrics_ga4_daily` upsert

### GA4 Data API 호출

```typescript
// Edge function: cron-funnel-ga4-pull
// 매일 04:00 KST (= UTC 19:00) Cloudflare Cron 또는 Supabase pg_cron 트리거

import { BetaAnalyticsDataClient } from '@google-analytics/data';

// 모든 user 의 GA4 connection 순회
const integrations = await supabase
  .from('saas_integrations')
  .select('user_id, ga4_refresh_token, ga4_property_id, mode')
  .not('ga4_refresh_token', 'is', null);

for (const it of integrations) {
  const client = new BetaAnalyticsDataClient({ /* OAuth refresh */ });
  const [response] = await client.runReport({
    property: `properties/${it.ga4_property_id}`,
    dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
    dimensions: [{ name: 'date' }],
    metrics: it.mode === 'commerce'
      ? [
          { name: 'screenPageViews' },          // step_1
          { name: 'addToCarts' },                // step_2
          { name: 'checkouts' },                  // step_3
          { name: 'ecommercePurchases' },         // step_4
        ]
      : [
          { name: 'screenPageViews' },          // step_1: 방문
          { name: 'eventCount' },                // step_2: sign_up 이벤트 (필터 필요)
          { name: 'eventCount' },                // step_3: activation 이벤트
          { name: 'eventCount' },                // step_4: subscription_start 이벤트
        ],
    dimensionFilter: it.mode === 'saas' ? {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: ['sign_up', 'activation', 'subscription_start'] }
      }
    } : undefined
  });

  // Upsert into saas_metrics_ga4_daily
  await supabase.from('saas_metrics_ga4_daily').upsert({
    user_id: it.user_id,
    date: response.rows[0].dimensionValues[0].value,
    mode: it.mode,
    step_1: response.rows[0].metricValues[0].value,
    step_2: response.rows[0].metricValues[1].value,
    step_3: response.rows[0].metricValues[2].value,
    step_4: response.rows[0].metricValues[3].value,
    property_id: it.ga4_property_id,
  });
}
```

### OAuth 설정

- Google Cloud Console → OAuth 2.0 Client ID 등록
- Redirect URI: `https://buildup.kr/auth/ga4/callback` (web) + `buildup://ga4/callback` (iOS deep link)
- iOS: `ASWebAuthenticationSession` 으로 시스템 브라우저 OAuth (custom URL scheme callback)
- Web: 표준 OAuth redirect flow

### Refresh token 저장

- 별도 테이블 `saas_integrations(user_id, ga4_refresh_token TEXT, ga4_property_id TEXT, ...)` 추가 필요
- Refresh token 은 Supabase Vault 또는 pgcrypto 로 암호화
- RLS: select 본인만, insert/update 본인만 (write through Edge function for token rotation)

## Phase 2B — Custom Webhook

### 사용자 flow

1. 사장님이 "데이터 연결 → 자체 서버 (Webhook)" 진입
2. 토큰 발급: 64자 무작위 token 생성 → `saas_integrations.webhook_token` 저장
3. URL + cURL 예제 노출:
   ```bash
   curl -X POST https://api.buildup.kr/v1/track \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"event_key":"signup","occurred_at":"2026-05-19T10:00:00Z","mode":"saas"}'
   ```
4. 사장님 서버에서 가입/구매 발생 시마다 위 endpoint 호출
5. iOS/Web 카드는 자동 갱신 (Supabase realtime 또는 polling)

### Webhook endpoint (Edge function)

```typescript
// POST /v1/track
export async function POST(req: Request) {
  const auth = req.headers.get('Authorization');
  const token = auth?.replace('Bearer ', '');
  if (!token) return new Response('unauthorized', { status: 401 });

  const { data: integration } = await supabaseService
    .from('saas_integrations')
    .select('user_id')
    .eq('webhook_token', token)
    .single();
  if (!integration) return new Response('invalid token', { status: 401 });

  const body = await req.json();
  // Validate event_key, occurred_at, mode
  await supabaseService.from('saas_metrics_events_raw').insert({
    user_id: integration.user_id,
    event_key: body.event_key,
    occurred_at: body.occurred_at,
    mode: body.mode,
    properties: body.properties ?? {},
    ingest_token: token,
  });
  return new Response('ok');
}
```

### Daily rollup (pg_cron)

```sql
-- 매일 04:30 KST (UTC 19:30) — GA4 보다 30분 늦게
CREATE OR REPLACE FUNCTION rollup_webhook_daily()
RETURNS void AS $$
BEGIN
  INSERT INTO saas_metrics_webhook_daily (user_id, date, mode, step_1, step_2, step_3, step_4)
  SELECT
    user_id,
    occurred_at::date AS date,
    mode,
    COUNT(*) FILTER (WHERE event_key IN ('visit','view_item')) AS step_1,
    COUNT(*) FILTER (WHERE event_key IN ('signup','add_to_cart')) AS step_2,
    COUNT(*) FILTER (WHERE event_key IN ('activation','begin_checkout')) AS step_3,
    COUNT(*) FILTER (WHERE event_key IN ('paid','purchase','subscription_start')) AS step_4
  FROM saas_metrics_events_raw
  WHERE occurred_at >= (now() - interval '2 days')
  GROUP BY user_id, occurred_at::date, mode
  ON CONFLICT (user_id, date) DO UPDATE
    SET step_1 = EXCLUDED.step_1, step_2 = EXCLUDED.step_2,
        step_3 = EXCLUDED.step_3, step_4 = EXCLUDED.step_4;
END;
$$ LANGUAGE plpgsql;

-- Schedule (요구사항: pg_cron extension)
SELECT cron.schedule('rollup_webhook_daily', '30 19 * * *', 'SELECT rollup_webhook_daily()');
```

## Phase 3 옵션

### A. Stripe 직접 연동
- 사장님 SaaS 가 Stripe 사용 시 webhook endpoint 추가
- `customer.subscription.created` → step_4 (유료) 증가
- Stripe webhook secret 검증 + 자동 매핑
- 한국: KakaoPay subscription via Stripe 지원 (조사 결과)

### B. 네이버 스마트스토어 API
- 신 API (2024 변경) — agent 등록 필요
- 일일 새벽 동기화만 (rate-limited)
- `네이버 비즈니스 어드바이저` 의 노출수·전환률 가져오기
- 보안 정책상 OAuth-like flow + agent 인증

### C. PostHog 셀프호스팅
- 사장님이 PostHog 자체 운영 (Docker)
- PostHog Funnels API 호출 → `saas_metrics_events_raw` 적재
- 가장 강력하지만 사장님이 자체 인프라 운영해야 함
- Supabase 도 PostHog 사용 — 검증된 조합

### D. AppsFlyer / Adjust (모바일 앱 광고 funnel)
- iOS 앱에서 install → activation → purchase 추적
- 사장님이 모바일 앱 운영 시만 적합

## 우선순위

1. **GA4 OAuth** — 가장 보편적 (대부분 사장님이 이미 사용)
2. **Custom Webhook** — 자체 서버 운영 사장님 대상
3. **Stripe** — SaaS 사장님 대상 (구독 정확도 ↑)
4. **스마트스토어** — 외부 의존성 + 보안 정책 변동 위험
5. **PostHog** — 기술 사장님 대상 (소수)

## 추정 일정

- Phase 2A (GA4): **2-3주**
  - OAuth 등록·앱 인증: 1주
  - Edge function · cron 셋업: 1주
  - iOS/Web "데이터 연결" UI: 1주 (병렬)
- Phase 2B (Webhook): **1주**
  - Endpoint + token 발급 UI
  - Rollup cron
- Phase 3: 사장님 수요 보고 결정

## 비용 예상

- GA4 Data API: 매일 N user × 1 call × 30 free → 100% 무료 (rate limit 500 req/h/property)
- Cloudflare Workers cron: $0 (free tier)
- Supabase storage: 사장님 1000명 × 매주 1KB = 1GB/년 → $0 (free tier)
- Total Phase 2: **$0/월** (초기), 성장 후 Supabase Pro $25/월

## 검증 지표

- "데이터 연결" 완료한 사장님 수
- 사장님당 평균 funnel 데이터 채워진 주차 수 (manual vs auto)
- 카드 daily view 비율 (다른 카드 대비)
- 사장님 만족도 설문: "전환율 카드가 의사결정에 도움이 되었는가" 5점 척도
