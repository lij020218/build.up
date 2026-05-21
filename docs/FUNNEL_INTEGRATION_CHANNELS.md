# Funnel 데이터 수집 채널 — 구현 가이드 (한국 실제 시장 데이터 기반)

> 2026-05-19 v2. 사장님의 서비스가 사용하는 서버에서 직접 데이터 가져오기.
>
> **v1 → v2 정정**: 우선순위가 제 가정에 의존했음. WebSearch 로 한국 실제 시장 점유율 검증 후 재정렬.

## 한국 SMB 시장 실태 (검증된 데이터)

### 자체몰 솔루션
- **Cafe24**: 점유율 ~70%, 누적 200만 쇼핑몰 — 압도적 1위
- **아임웹 (imweb)**: 신흥 성장, 초보 셀러 + 디자인 친화
- 메이크샵 / NHN커머스(고도몰): 매출 감소 (자체몰 → 마켓플레이스 이동 영향)

### 마켓플레이스
- **쿠팡**: 23% (1위)
- **네이버 스마트스토어**: 20.7% (2위)

### PG (결제 대행) — 한국 SaaS 결제의 표준
2024년 4월 기준 154개사 등록, 상위 4사가 **65-70% 점유**:
- **KG이니시스**: 가맹점 19만 — **국내 최대**
- **NHN KCP**: 4강
- **토스페이먼츠**: 4강, 스타트업/소규모 사업자 선호
- **나이스페이먼츠**: 4강, 스타트업용 "포스타트" 프로그램

간편결제:
- **카카오페이**: 활성 사용자 24M
- **네이버페이**: 네이버 생태계
- Payco / KG모빌리언스 등

### 분석 도구
- **GA4**: 압도적 1위 (UA 후속 자동 전환)
- **Mixpanel**: 한국 스타트업 인기, 무료 plan + 1년 6천만원 credit 프로그램
- **Amplitude**: 전사 데이터팀 표준
- PostHog: indie/기술 사장님 한정

### BaaS
- **Supabase**: PostgreSQL 기반 오픈소스 (45만 개발자, 58k stars)
- **Firebase**: Google, NoSQL 기반 — 한국 스타트업도 많이 사용

### Cloud
- **AWS Korea + NCloud (Naver Cloud) + KT Cloud** — 한국 시장 분점
- NCloud: 60,000 clients, 한국 공공기관 강세

## 정정된 우선순위 (실제 시장 점유율 기반)

| Rank | 채널 | 한국 점유율 | 적용 대상 | 상태 |
|---|---|---|---|---|
| 1 | **Manual Weekly** | 모든 SMB | 모든 사장님 | ✅ Phase 1 완료 |
| 2 | **Custom Pull URL** | 어디든 가능 | 자체 서버 운영자 | ✅ Phase 2A 완료 |
| 3 | **Cafe24 OAuth** | 자체몰 **70%** | Commerce 셀러 압도적 | 🔥 Phase 2B (이 다음) |
| 4 | **GA4 OAuth** | 분석 **압도적 1위** | 거의 모든 사장님 | 🔥 Phase 2C |
| 5 | **쿠팡 Wing API** | 마켓 **23%** | 쿠팡 셀러 | 📅 Phase 2D |
| 6 | **네이버 스마트스토어** | 마켓 **20.7%** | 네이버 셀러 (신 API 제약) | 📅 Phase 2E |
| 7 | **토스페이먼츠** | PG 4강, 스타트업 인기 | SaaS 사장님 | 📅 Phase 2F |
| 8 | **KG이니시스** | PG **최대 (19만 가맹점)** | 가장 많은 사장님 | 📅 Phase 2G |
| 9 | **NHN KCP** | PG 4강 | SaaS 사장님 | 📅 Phase 2H |
| 10 | **나이스페이먼츠** | PG 4강 + 포스타트 | 초기 스타트업 | 📅 Phase 2I |
| 11 | **아임웹** | 자체몰 신흥 | 초보 셀러 | 📅 Phase 2J |
| 12 | **Mixpanel** | 스타트업 분석 표준 | 데이터 팀 운영 사장님 | 📅 Phase 2K |
| 13 | **Amplitude** | 전사 데이터팀 표준 | 중대형 SaaS | 📅 Phase 2L |
| 14 | **Supabase** (사장님 자체 DB) | BaaS 양강 | 기술 사장님 | 📅 Phase 2M |
| 15 | **Firebase** (사장님 자체 DB) | BaaS 양강 | 기술 사장님 | 📅 Phase 2N |
| 16 | **PostHog** | 일부 indie | 셀프호스팅 | 📅 Phase 3 |
| 17 | **카카오페이 / 네이버페이** | 간편결제 | 일부 사장님 | 📅 Phase 3 |
| 18 | Stripe Connect | 한국 점유율 **작음** | 글로벌 지향 SaaS만 | 📅 후순위 |

### v1 우선순위 vs v2 정정 차이

| 항목 | v1 (제 가정) | v2 (실제 데이터) |
|---|---|---|
| Cafe24 점유율 | 50% | **70%** |
| 마켓플레이스 1위 | "네이버" | **쿠팡 (23%)** |
| Stripe Connect | 4위 (SaaS 30%) | 18위 (한국 점유율 미미) |
| PG 빅4 | 토스만 언급 | KG이니시스 + NHN KCP + 토스 + 나이스 모두 추가 |
| 아임웹 | 누락 | 11위 (신흥) |
| Firebase | 누락 | 15위 (BaaS 양강) |
| Mixpanel / Amplitude | 누락 | 12·13위 |

## 공통 인프라 (이미 완성)

```
saas_metrics_connections    ← 모든 채널 자격증명 (envelope encryption)
  └ source = 'custom_pull' | 'cafe24' | 'naver_pay' | 'kakao_pay' | ...

saas_funnel_source_daily    ← 일일 적재 (source 컬럼)
v_saas_funnel_unified       ← 주간 통합 view (우선순위 머지)
```

## 우선순위 1위 — Cafe24 OAuth 상세 (다음 작업)

자체몰 70% 점유 — 한 채널 잘 하면 한국 셀러의 70% 커버.

### Endpoints (확인 필요)
- `https://{mallid}.cafe24api.com/api/v2/admin/orders`
- `https://{mallid}.cafe24api.com/api/v2/admin/customers`
- `https://{mallid}.cafe24api.com/api/v2/admin/statistics/visitor`
- `https://{mallid}.cafe24api.com/api/v2/admin/statistics/checkout`

### OAuth scope
- `mall.read_order` — 주문 (step_4)
- `mall.read_customer` — 회원 수 (step_2)
- `mall.read_product` — 상품
- `mall.read_application` — 통계 API 접근

### Rate limit
- 1초당 5회 (사장님당)
- cron 분산 필요: 사장님 1000명 처리 시 약 3-4분 (분당 100명 ÷ 동시 5명)

### 일일 cron (`/api/cron/funnel-cafe24-pull`)
- 매일 04:05 KST (Custom Pull 5분 뒤)
- `saas_metrics_connections WHERE source='cafe24' AND status='active'` 순회
- 어제 일자 데이터 → `saas_funnel_source_daily` (source='cafe24') upsert

### 사용자 UX
1. 데이터 연결 → "Cafe24 OAuth" 카드 (점유율 70% 추천 배지)
2. "쇼핑몰 도메인 입력" (예: `mystore.cafe24.com`)
3. → Cafe24 OAuth 동의 화면 (scope 명시)
4. → callback → access_token + refresh_token → encrypt + save
5. 첫 백필 (지난 30일) 즉시 실행 → funnel 카드 데이터 채워짐

## 우선순위 2위 — GA4 OAuth (이미 부분 구현)

기존 `apps/web/app/api/integrations/saas-metrics/ga4/` 가 존재. funnel 용 metric 추가만 필요:

### Funnel 용 metric 추가
- Commerce: `screenPageViews`, `addToCarts`, `checkouts`, `ecommercePurchases`
- SaaS: `screenPageViews`, custom `sign_up` event, custom `activation` event, custom `subscription_start` event

### 적재 대상 변경
- 기존: `saas_metrics_daily` (DAU/MAU 엔게이지먼트)
- 추가: `saas_funnel_source_daily` (source='ga4', step_1..4)

## 한국 PG 4사 통합 패턴

KG이니시스 / NHN KCP / 토스페이먼츠 / 나이스페이먼츠 — 모두 비슷한 API 구조:
- API Key (시크릿) 인증
- `GET /payments?startDate=...&endDate=...` 엔드포인트
- 결제 성공 건수 → step_4 (유료/구매)

→ **공통 PG 통합 헬퍼** 작성 가능:
```typescript
// apps/web/app/api/_lib/pg-fetcher.ts
async function fetchPaymentsForRange(provider: 'kg_inicis' | 'nhn_kcp' | 'toss' | 'nice',
  apiKey: string, startDate: string, endDate: string): Promise<{ count: number, gmv: number }>
```

→ 사장님 UX: 데이터 연결 → "결제 시스템 (PG)" → 본인 PG 선택 → 시크릿 키 입력 (마스킹) → 즉시 백필

## 비용

| 항목 | 비용 |
|---|---|
| Cafe24 API | 무료 (read scope) |
| GA4 Data API | 무료 (rate 500/h) |
| 쿠팡 Wing API | 무료 (셀러 등록 필요) |
| 네이버 스마트스토어 | 무료 (agent 등록) |
| PG 4사 (KG/NHN/토스/나이스) | 무료 (가맹점 read) |
| 아임웹 API | 확인 필요 (read free 추정) |
| Mixpanel API | 무료 (rate limited) |
| Amplitude Export API | 무료 (1년 6천만원 credit 스타트업) |
| Supabase / Firebase (사장님 자체) | 사장님 본인 비용 |

총 Phase 2 운영비 **$0/월** + Vercel Pro $20 (cron 무제한).

## 우선순위별 일정 (단일 개발자 기준)

| Phase | 작업 | 기간 | 누적 |
|---|---|---|---|
| 2A | Custom Pull URL | ✅ 완료 | — |
| 2B | **Cafe24 OAuth** | 5-7일 | 1주 |
| 2C | **GA4 funnel 확장** | 3-5일 | 1.5주 |
| 2D | 쿠팡 Wing API | 5-7일 | 2.5주 |
| 2E | 네이버 스마트스토어 (agent 등록 포함) | 2주 | 4.5주 |
| 2F | 토스페이먼츠 | 2-3일 | 5주 |
| 2G | KG이니시스 | 2-3일 | 5.5주 |
| 2H | NHN KCP | 2-3일 | 6주 |
| 2I | 나이스페이먼츠 | 2-3일 | 6.5주 |
| 2J | 아임웹 | 3-5일 | 7주 |
| 2K | Mixpanel | 3일 | 7.5주 |
| 2L | Amplitude | 3일 | 8주 |
| 2M | Supabase 사장님 DB | 5일 | 8.5주 |
| 2N | Firebase 사장님 DB | 5일 | 9주 |

전체 Phase 2 (15 채널) — 한 명 기준 **약 2개월**, 두 명 병렬이면 **약 1개월**.

## 우선 다음 작업: **Cafe24 OAuth**

이유:
- 자체몰 70% 점유 → 한국 SMB 셀러 절반 이상이 바로 혜택
- OAuth 표준 (확립된 패턴)
- Rate limit 명확, 비용 0
- 추가 PG·플랫폼은 PG 4사 통합 헬퍼로 batch 가능 (Phase 2F-2I 묶음)
