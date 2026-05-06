# build.up 운영 대시보드 — 스타트업 핵심 지표 통합 계획

> **작성일**: 2026-05-05
> **목적**: build.up이 현재 추적하는 자영업·소상공인 중심 지표 위에, 실리콘밸리 VC·액셀러레이터 표준의 스타트업 KPI를 단계적으로 얹어 "운영 대시보드 + 투자자용 지표 대시보드"가 한 화면에서 동작하도록 한다.
> **참고 규칙**: 모든 코드 변경은 구현 전 최신 라이브러리·프레임워크 문서를 WebSearch로 재확인한다 (글로벌 규칙).

---

## 0. Executive Summary

build.up의 현재 데이터 모델은 **자영업/소상공인 운영 지표(매출·비용·현금흐름·이상감지)** 에 매우 잘 맞춰져 있다. 그러나 SaaS·마켓플레이스·소비자앱·핀테크처럼 **반복 수익(recurring) 또는 사용자 활성도(engagement) 기반 비즈니스**의 평가에는 핵심 지표(MRR/ARR, NRR, LTV/CAC, DAU/MAU, K-factor, GMV·Take Rate, Burn Multiple, Magic Number, Rule of 40 등)가 빠져 있다.

본 문서는 다음 세 가지를 한꺼번에 제시한다.

1. **현재 코드 인벤토리**: 어떤 지표가 어디서 계산되고, Supabase의 어느 테이블에 들어가는가.
2. **실리콘밸리 표준 지표 매뉴얼**: 정의·공식·벤치마크·왜 중요한가 (한국어 + 영문 병기).
3. **build.up 구현 우선순위**: 바로 가능 / 데이터 수집 추가 / 장기 — 코드 수정 위치까지 명시.

---

## 1. 현재 build.up이 추적 중인 지표

### 1-1. 매출/비용/이익 (자영업 표준)

| 카테고리 | 지표 | 위치 |
|---|---|---|
| 매출 | 일별 매출 (`DailyEntry.sales`) | [apps/web/app/lib/stores/finance-store.ts:10](apps/web/app/lib/stores/finance-store.ts:10) |
| 매출 | 일별 고객수 (`customers`) | [finance-store.ts:11](apps/web/app/lib/stores/finance-store.ts:11) |
| 매출 | 상품별 매출 (`productSales`) | [finance-store.ts:12](apps/web/app/lib/stores/finance-store.ts:12) |
| 매출 | 주간/월간 합계 + 주간 비교 (%) | [useDashboard.ts:358–360](apps/web/src/hooks/useDashboard.ts:358) |
| 비용 | 7대 비용 항목 (재료비/인건비/임대료/공과금/SG&A/마케팅/기타/이자) | [finance-store.ts:18–25](apps/web/app/lib/stores/finance-store.ts:18) |
| 손익 | 순이익 (`netProfit = totalSales − totalCosts`) | [AnalyticsSurface.tsx:88](apps/web/app/components/AnalyticsSurface.tsx:88) |
| 손익 | 이익률 (%) | [profit-anomaly-detector.ts:150](apps/web/app/lib/services/profit-anomaly-detector.ts:150) |
| 손익 | 프라임 코스트 비율 (재료+인건/매출) | [useDashboard.ts:341](apps/web/src/hooks/useDashboard.ts:341) |
| 손익 | 공헌이익률 (Contribution Margin Rate) | [packages/shared/src/finance/simulation.ts:76](packages/shared/src/finance/simulation.ts:76) |
| 손익 | 손익분기점 (BEP) — 월·일·거래수 | [simulation.ts:70–114](packages/shared/src/finance/simulation.ts:70) |

### 1-2. 현금흐름·생존기간

| 지표 | 위치 | 비고 |
|---|---|---|
| 시작 자본 / 잔여 자본 | [useDashboard.ts:345–346](apps/web/src/hooks/useDashboard.ts:345) | — |
| **Runway (개월)** | [useDashboard.ts:347](apps/web/src/hooks/useDashboard.ts:347) | `capitalLeft / abs(monthlyNet)` — 이미 표준 공식 |
| 생존 가능 개월 (무매출 가정) | [simulation.ts:172–177](packages/shared/src/finance/simulation.ts:172) | — |
| 14일 현금흐름 예측 | [cashflow-projection.ts](apps/web/app/lib/services/cashflow-projection.ts) | 위기일자 자동 감지 |
| 위기 감지 (`willCrisis`, `crisisDay`, `daysUntilCrisis`) | [cashflow-projection.ts:36–44](apps/web/app/lib/services/cashflow-projection.ts:36) | rule-based |

### 1-3. 매출 통합·자동수집 (Unified Revenue)

`useUnifiedRevenue.ts`가 8개 데이터 소스를 우선순위 기반으로 머지한다:

```
PortOne(6) > TOSS Place(5) > CODEF Card(4) > 팝빌 세금계산서(3)
> 팝빌 현금영수증(3) > CODEF Bank(2) > CSV 업로드(1) > 수동 입력
```
- API 라우트: `apps/web/app/api/integrations/{portone,tossplace,codef,popbill,csv}/...`
- Supabase 테이블: `collected_sales`, `sales_collection_config`, `sales_sync_log`, `portone_transactions`, `tossplace_settlements`, `codef_card_accounts`, `popbill_documents`

### 1-4. 이상 감지 (Proactive Insights, rule-based)

`profit-anomaly-detector.ts`가 10가지 이상 패턴을 감지:
- `profit-margin-drop`, `sales-decline`, `cost-spike`, `ticket-price-drop`, `customer-decline`, `prime-cost-breach`(65% 임계), `inventory-stagnant`, `new-customer-low`, `labor-ratio-high`, `marketing-roas-low`

### 1-5. 코칭/액션 페이로드 (`useDashboard` actions)

[useDashboard.ts:405–507](apps/web/src/hooks/useDashboard.ts:405)에서 AI 코칭에 넘기는 25개+ 필드: `monthlySales`, `weeklyChange`, `primeRate`, `runway`, `businessHealthScore`, `operatingPhase`(pre-launch/early/growth/mature), `salesTrendDirection`, `unusedFeatures`, `lowStockItems`, `marketingRoas`, `currentRoadmapStage` 등.

### 1-6. Supabase 데이터 모델 핵심

- **business_profiles** — 업종, 자본금, 직원계획, 입지 우선순위
- **roadmaps / stage_decisions / stage_tasks** — 단계별 진행 상황
- **user_store_data** — 매장 정체성·연락처·법규·은행·세무·industry_specifics(jsonb)
- **collected_sales / sales_collection_config / sales_sync_log** — 외부 매출 동기화
- **customers / customer_visits** — `total_visits`, `last_visit_at`, `visit_type`(visit|appointment|purchase|meeting|class), `meta`(jsonb)
- **financial_benchmarks** — 업종별 평균 COGS·고정비·매출·임대료
- **portone_transactions / tossplace_settlements / codef_card_accounts / popbill_documents** — 결제·세금계산서 원장

### 1-7. 누락 영역 (스타트업 지표 관점)

| 영역 | 현재 | 평가 |
|---|---|---|
| MRR / ARR | `planSignups`, `planChurns` 필드만 정의됨, 계산 없음 | **0% 구현** |
| NRR / GRR / Logo Churn / Revenue Churn | 미구현 | **0%** |
| LTV / CAC / LTV:CAC / Payback | 미구현 | **0%** |
| Burn Multiple | 미구현 | **0%** |
| Magic Number / Quick Ratio / Rule of 40 | 미구현 | **0%** |
| GMV / Take Rate (마켓플레이스) | 미구현 | **0%** |
| AOV / Repeat Purchase Rate / Frequency | 일부 (`total_visits`만) | **20%** |
| DAU / WAU / MAU / Stickiness | 미구현 (세션 트래킹 없음) | **0%** |
| Retention Curve (D1/D7/D30, 코호트) | 미구현 | **0%** |
| Viral Coefficient (K-factor) | 미구현 | **0%** |
| CMGR / 주간 성장률 | 주간 비교만 있음, 누적 성장률 없음 | **30%** |
| 재고회전율 / DIO | 미구현 | **0%** |
| 직원 생산성 (sales/employee) | 미구현 | **0%** |
| 마케팅 다중 터치 / 채널별 CAC | 단순 ROAS만 | **30%** |

---

## 2. 실리콘밸리 스타트업 핵심 지표 매뉴얼

> 각 지표마다 **정의 / 공식 / 벤치마크 / 왜 중요한가** 순서로 정리. 출처는 5절에 모두 명시.

### 2-1. 모든 스타트업 (Universal)

#### 주간 성장률 (Weekly Growth Rate, WoW) — Y Combinator
- **공식**: `(이번 주 값 − 지난 주 값) / 지난 주 값 × 100%`
- **벤치마크**: YC 기준 5–7%/주 = 양호, 10%/주 = exceptional, 1%/주 = 연환산 ~68%(1.01^52)
- **왜 중요**: PG/YC가 office hours에서 가장 먼저 묻는 단 하나의 숫자. 7%/주 유지 시 약 10주마다 두 배.

#### 복합월간성장률 (CMGR, Compound Monthly Growth Rate)
- **공식**: `CMGR = (Ending / Beginning)^(1/n) − 1`
- **벤치마크**: 초기 SaaS 5–15%/월. 시리즈A 직전 마켓플레이스는 6개월 15–20% MoM 일관성.

#### Default Alive vs Default Dead (Paul Graham)
- **정의**: 현재 비용 구조 + 매출 성장률을 그대로 두면, 보유 현금이 0이 되기 전에 흑자 전환에 도달하는가?
- **왜 중요**: PG는 8–9개월차에 모든 스타트업이 자가 진단해야 한다고 강조. "fatal pinch"의 가장 흔한 원인은 **과도한 채용**.

#### Burn Rate / Runway
- **Gross Burn**: 월 운영비 합계 (매출 무시)
- **Net Burn**: 총비용 − 매출 = 월간 순현금 손실
- **Runway**: `현금잔고 / 평균 월 Net Burn` (개월)
- **벤치마크**: 라운드 직후 18–24개월. 3개월 평균으로 평탄화 권장.
- **build.up 현황**: ✅ 이미 `useDashboard.ts:347`에서 계산 중.

#### Burn Multiple (David Sacks)
- **공식**: `Net Burn / Net New ARR` — "ARR 1달러 만들려고 얼마 태웠나"
- **벤치마크**: <1x amazing / 1–1.5x great / 1.5–2x good / 2–3x suspect / >3x bad
- **왜 중요**: 자본 효율의 단일 숫자 압축. 시리즈A 게이트로 ≤2x 요구 증가.

#### CAC / LTV / LTV:CAC / Payback
- **CAC** = (Sales + Marketing 총비용) / 신규 고객 수
- **LTV (SaaS)** = `ARPA × Gross Margin / Churn Rate`
- **LTV:CAC** — 시장 표준 3:1 (단, blended 평균; marginal은 더 낮을 수 있음)
- **CAC Payback** = `CAC / (월 ARPA × Gross Margin)` — SMB <12개월, Mid <18개월, best 5–7개월
- **핵심 통찰**: "2:1 + 6개월 페이백" > "5:1 + 24개월 페이백" — 현금 제약 회사에는 **페이백이 비율보다 중요**.

#### Gross Margin / Contribution Margin
- **Gross Margin**: SaaS 초기 50%+, 성숙 70–85%, 마켓플레이스 60–80%, 푸드/딜리버리 10–25%
- **Contribution Margin**: 변동비 차감 후. 단위 경제성의 진짜 척도. 성숙 SaaS 60–75%, best 80%+.

#### PMF 신호 — Sean Ellis 40% Test
- **질문**: "이 제품을 더 이상 사용할 수 없다면?"
- **40%+ "Very disappointed"** = PMF 도달. Ellis 100+ 스타트업 분석에서 40% 미만은 모두 트랙션 실패.
- **보조 신호**: 오가닉 비중, retention smile curve, NPS, 코호트 안정화.

### 2-2. B2B SaaS

#### MRR / ARR
- **MRR** = Σ 모든 활성 구독의 월 정규화 매출
- **ARR** = MRR × 12 또는 연간 계약 합계
- **a16z 함정**: 일회성/컨설팅 매출은 ARR에 포함 금지.

#### Logo Churn vs Revenue Churn
- **Logo Churn**: 이탈 고객 수 / 기초 고객 수
- **Revenue Churn (Gross)**: 이탈 MRR / 기초 MRR
- **벤치마크 (월)**: SMB 3–5%, Mid 1.5–3%, Enterprise 1–2%

#### NRR / GRR
- **NRR** = `(기초 MRR + 확장 − 다운그레이드 − 이탈) / 기초 MRR`
- **GRR** = 위 식에서 확장 제외
- **2025 벤치마크**:
  | Segment | NRR Median | GRR |
  |---|---|---|
  | SMB (<$25K ACV) | 97% | 85–90% |
  | Mid ($25–100K) | 108% | 88–92% |
  | Enterprise (>$100K) | 118% | 92–95% |
  | Best-in-class public | 120–130% | 95%+ |
- **Usage-based pricing** NRR이 flat-rate보다 일관되게 10–20%p 높음.
- 시리즈A 게이트: NRR > 100% 사실상 필수.

#### Quick Ratio
- **공식**: `(New + Expansion MRR) / (Churned + Contraction MRR)`
- **벤치마크**: 3–5 양호, 4+ 우수, <1 즉각 위기.

#### Magic Number
- **공식 (Internal)**: `(Q ARR − Q-1 ARR) / Q-1 신규 획득 비용`
- **해석**: 1.0이면 다음 4분기 매출로 S&M 비용 회수 가능
- **벤치마크**: <0.75 비효율 / 0.75–1 양호 / 1–1.5 우수 / >1.5 가속 신호

#### Rule of 40
- **공식**: `Revenue Growth (%) + EBITDA Margin (%) ≥ 40`
- 공기업 SaaS는 40+ 시 EV multiple 프리미엄.

#### T2D3
- Battery Ventures의 Neeraj Agrawal — PMF($1–2M ARR) 후: 3x → 3x → 2x → 2x → 2x
- $2M → $6M → $18M → $36M → $72M → $144M (5년)

### 2-3. 마켓플레이스 / 커머스

#### GMV vs Revenue
- **GMV** = 플랫폼 위에서 거래된 총가치
- **Revenue** = GMV × Take Rate
- **a16z 경고**: GMV를 매출처럼 보고하지 말 것.

#### Take Rate
- **공식**: `Revenue / GMV`
- **벤치마크**: 10–30% (Airbnb ~14%, Etsy ~6.5%, App Store ~30%)

#### Liquidity (유동성)
- **정의**: 검색→주문 fill rate, 리스팅 sell-through 등
- **벤치마크**: 시리즈A 기준 60%+, search-to-fill > 25%

#### AOV / Repeat Purchase Rate / Frequency
- **AOV** = Revenue / Order 수
- **RPR**: 재구매 고객 / 전체 고객 — 이커머스 20–40% 양호, 50%+ 탁월
- **LTV ≈ AOV × Frequency × Margin × Years**

### 2-4. 소비자 앱 (Consumer App)

#### DAU/MAU Stickiness
- **공식**: `(평균 DAU / MAU) × 100`
- **벤치마크**: Social 50%+ (FB ~65%), Gaming 20–50%, B2B SaaS 13–40%, E-comm ~10%, Fintech 10–20%
- 일반: 20%+ 건강, 50%+ 탁월

#### Retention Curve (D1/D7/D30)
- **D1**: 온보딩 품질 / **D7**: 습관 형성 / **D30**: 장기 가치 (PMF의 가장 강한 신호)
- **2026 모바일 게임 벤치마크** (GameAnalytics): Median D1 22% / D7 10% / D30 5%. Top 10% D1 40% / D7 20% / D30 10%. 현실 목표 35/15/5.
- **Smile Curve** (장기 retention 상승)는 네트워크 효과의 dream state (Slack, Airbnb).

#### Viral Coefficient (K-factor)
- **공식**: `K = i × c` (i = 사용자당 평균 초대 수, c = 초대→가입 전환율)
- K > 1 지수 성장 / 0.5–1 강한 보조 / <0.5 마케팅 의존

#### Power User Curve (Andrew Chen)
- 30일 중 활성 일수의 분포. **L7+** 사용자(7일+ 활성) 비중이 핵심.

### 2-5. 핀테크

| 지표 | 의미 |
|---|---|
| **NIM** (Net Interest Margin) | (이자수익 − 이자비용) / 평균 자산 |
| **NPL Ratio** | 90일+ 연체 / 총 대출 (자산 건전성) |
| **CoF** (Cost of Funds) | 자금 조달 비용 |
| **OER** (Operating Expense Ratio) | Year1 50% → Year3 30% 압축이 목표 |
| **Fraud Rate (bps)**, **Chargeback Rate** | 규제 산업 특수 |
| **AML/KYC 통과율** | 컴플라이언스 |
- 핀테크 초기 성장 기대치: 분기 15–25% QoQ

### 2-6. 푸드테크 / 딜리버리

| 지표 | 벤치마크/의미 |
|---|---|
| **GOV** (Gross Order Value) / 주문량 | 사이즈 |
| **AOV** | 객단가 |
| **Order Acceptance Time** | 1–3분 |
| **ADD** (Average Delivery Duration) | 30분 이하 |
| **On-Time Delivery Rate** | 95%+ |
| **Rider Utilization** | 라이더당 시간당 배송 |
| **Restaurant Retention / Cohort GMV Retention** | 공급자 측 |
| **Contribution Margin per Order** | 단위 흑자 여부 |

---

## 3. 단계별 권장 우선순위 매트릭스

### 3-1. Pre-seed / Seed (PMF 신호)
- 주간 성장률 (WoW), Sean Ellis 40% Test, D30 retention plateau, Default Alive 12개월 가시성

### 3-2. Series A 게이트 (2025 표준)
- ARR $2M+ (안전 zone $3M), YoY 3x
- LTV:CAC ≥ 3:1, Payback ≤ 18개월
- NRR > 100% (강하게는 110%+)
- Burn Multiple ≤ 2x, Magic Number ≥ 0.75
- 6개월 일관 MoM 성장

### 3-3. Series B+ (효율적 확장)
- Rule of 40 ≥ 40
- T2D3 궤적 진입
- NRR 120%+
- Gross Margin 70%+
- Burn Multiple < 1x

---

## 4. 업종별 필수 지표 매트릭스

| 지표 | B2B SaaS | 마켓플레이스 | 소비자앱 | 이커머스 | 푸드테크 | 핀테크 | 자영업 (현재 build.up) |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 주간/월간 성장률 | ● | ● | ● | ● | ● | ● | ● |
| Net Burn / Runway | ● | ● | ● | ● | ● | ● | ● |
| Burn Multiple | ● | ● | ◐ | ◐ | ● | ● | — |
| MRR / ARR | ● | — | ◐ | — | — | ◐ | — |
| NRR / GRR | ● | — | — | — | — | ◐ | — |
| Logo Churn | ● | ◐ | — | — | ◐ | ● | — |
| LTV / CAC / Payback | ● | ● | ● | ● | ● | ● | ◐ |
| Quick Ratio / Magic Number | ● | — | — | — | — | — | — |
| Rule of 40 | ● | ● | ◐ | ◐ | ● | ● | — |
| GMV / Take Rate | — | ● | — | — | — | — | — |
| Liquidity | — | ● | — | — | — | — | — |
| AOV / Repeat / Frequency | ◐ | ● | ◐ | ● | ● | — | ● |
| DAU / MAU / Stickiness | ◐ | ● | ● | ◐ | ● | ● | — |
| D1/D7/D30 Retention | ◐ | ● | ● | ◐ | ● | ● | — |
| K-factor | — | ◐ | ● | ◐ | ◐ | ◐ | — |
| 프라임 코스트 / 손익분기점 | — | — | — | — | ● | — | ● |
| NIM / NPL / OER | — | — | — | — | — | ● | — |
| ADD / On-Time % / Rider Util | — | ● | — | — | ● | — | — |
| 정부지원금 누적 / 특허 / 고용 | ● | ● | ● | ● | ● | ● | ◐ |

(● 필수 / ◐ 권장 / — 해당 없음)

---

## 5. build.up 구현 우선순위

### Tier 1 — 기존 데이터로 바로 계산 가능 (≤ 2주)

> 코드 변경만으로 가능. 추가 데이터 수집 불필요.

| # | 지표 | 데이터 소스 | 구현 위치 (제안) |
|---|---|---|---|
| 1 | **CMGR** (3·6·12개월) | `finance-store.dailyEntries` 합산 | `packages/shared/src/finance/growth.ts` (신규) |
| 2 | **WoW 성장률 누적 그래프** | 같은 소스 | `useDashboard.ts` 확장, 차트 추가 |
| 3 | **Net Burn** = 월비용 − 월매출 | 기존 | `useDashboard.ts:340–360` 인근 |
| 4 | **Burn Multiple** = Net Burn / ΔRevenue (월) | 기존 | 같은 위치 |
| 5 | **AOV** = 매출 / 고객수 | 기존 | `useDashboard.ts` 파생 |
| 6 | **Magic Number 단순형** = (이번달 매출 − 지난달 매출)×12 / 지난달 마케팅 | 기존 | 동일 |
| 7 | **Rule of 40** = (YoY 매출성장률) + (이익률) | 12개월 데이터 누적 후 | 동일 |
| 8 | **Default Alive 판정** = 현재 성장률 + 비용으로 흑자 전환 가능? | `simulation.ts` 확장 | `simulation.ts` 신규 함수 `evaluateDefaultAliveDead()` |
| 9 | **Repeat Purchase Rate** = 재방문 고객 / 전체 고객 | `customer_visits.customer_id` count distinct | 신규 hook `useCustomerCohorts.ts` |
| 10 | **Repeat Frequency** = 평균 방문 횟수 (12개월) | 같은 소스 | 동일 |
| 11 | **객단가 추세** (이미 anomaly에 일부) | 기존 | UI 카드만 |

**UI**: 기존 `AnalyticsSurface.tsx`에 "투자자 지표(Investor Metrics)" 토글 섹션 신규 추가. Apple 디자인 가이드(여백, 미니멀, 타이포 중심) 준수, progressive disclosure로 default는 자영업 지표만, 토글 시 스타트업 지표 노출.

### Tier 2 — 데이터 모델 변경 필요 (2–6주)

> Supabase 마이그레이션 + 데이터 입력 UI 추가.

| # | 지표 | 필요한 데이터 추가 | 마이그레이션 |
|---|---|---|---|
| 12 | **MRR / ARR** | 구독·멤버십 테이블: `subscriptions(user_store_id, customer_id, plan_id, mrr_amount, started_at, churned_at, expansion_at)` | 신규 테이블 |
| 13 | **Logo Churn / Revenue Churn** | 위 테이블 위에서 SQL 집계 | view |
| 14 | **NRR / GRR** | `subscription_events(type: new\|expansion\|contraction\|churn, mrr_delta, occurred_at)` | 신규 테이블 |
| 15 | **CAC by 채널** | 기존 `marketing_campaigns`에 `channel_id`, `attributed_signups` 추가 | column add |
| 16 | **LTV** | 위 + Gross Margin + Churn rate 결합 계산 | 코드 |
| 17 | **CAC Payback** | 위 + ARPA, Gross Margin | 코드 |
| 18 | **GMV / Take Rate** | 마켓플레이스 모드 도입: `marketplace_transactions(gmv_amount, fee_amount, ...)` | 신규 테이블 (현재는 자영업 가정으로 모델에 없음) |
| 19 | **Cohort Retention (월)** | `customer_visits` 위에서 SQL window function | view |
| 20 | **Inventory Turnover / DIO** | `inventory_items`에 `current_qty`, `cost_per_unit`, `last_count_date` 보강 | column add |
| 21 | **Sales per Employee** | 기존 직원 데이터(`people_directory`) + 매출 결합 | 코드만 |

### Tier 3 — 신규 데이터 수집 인프라 (장기, 2–3개월)

| # | 지표 | 필요 인프라 | 비고 |
|---|---|---|---|
| 22 | **DAU / WAU / MAU / Stickiness** | 앱 사용 이벤트 트래킹: `user_sessions(user_id, started_at, ended_at, device, ...)` 또는 PostHog/Amplitude SDK 연동 | build.up 자체 사용자 활성도용 — **별도 빌더 운영 도구 차원의 가치** |
| 23 | **D1/D7/D30 Retention** | 같은 소스 + cohort 정의 | view |
| 24 | **K-factor** | 초대 트래킹: `referrals(referrer_id, invitee_id, signed_up, ...)` | 자영업 고객 referral 시스템(쿠폰/추천) — 매장용 가치 |
| 25 | **Power User Curve** | 위 세션 데이터 위에서 30일 활성일 분포 | view |
| 26 | **NIM / NPL** (핀테크 모드) | 대출/예금 모드 도입 시 | 핀테크 모드 |
| 27 | **ADD / On-Time %** (푸드테크 모드) | 배달 플랫폼 webhook 통합 | 푸드테크 모드 |
| 28 | **다중 터치 마케팅 어트리뷰션** | 이벤트 스트림 인프라 + 첫/마지막 터치 모델 | 큰 작업 |

### Tier 4 — 한국 특화 (Korean Ecosystem)

| # | 지표 | 데이터 소스 |
|---|---|---|
| 29 | **누적 정부지원금 / R&D 과제** | `government_grants(name, amount_krw, awarded_at, program_type)` |
| 30 | **TIPS / 예비창업패키지 단계** | `roadmaps` 확장 또는 별도 `funding_milestones` |
| 31 | **특허·IP 출원 건수** | `intellectual_properties(type: patent\|trademark, status, filed_at)` |
| 32 | **수출 매출 비중** | `collected_sales`에 `is_export` 플래그 |
| 33 | **언론 보도 / 매스컴 노출** | `press_mentions(media, url, mentioned_at)` |

---

## 6. 구체적 코드 수정 계획

### 6-1. 신규 모듈: `packages/shared/src/finance/startup-metrics.ts`

```typescript
export interface StartupMetricsInput {
  monthlySalesSeries: { month: string; sales: number }[]; // 최소 3개월
  monthlyCostsSeries: { month: string; total: number; marketing: number }[];
  newCustomersByMonth: { month: string; count: number }[];
  cashBalance: number;
  // (선택) 구독 데이터
  subscriptions?: {
    mrrStartOfMonth: number;
    newMrr: number;
    expansionMrr: number;
    contractionMrr: number;
    churnedMrr: number;
  };
}

export function calcCMGR(series: number[]): number;
export function calcWoWGrowth(weekly: number[]): number;
export function calcBurnMultiple(netBurn: number, deltaArr: number): number;
export function calcMagicNumber(deltaRevenueMonthly: number, prevMarketing: number): number;
export function calcRuleOf40(yoyGrowthPct: number, ebitdaMarginPct: number): number;
export function calcMRRDelta(s: NonNullable<StartupMetricsInput['subscriptions']>): {
  mrr: number; arr: number; nrr: number; grr: number; quickRatio: number;
};
export function evaluateDefaultAlive(input: StartupMetricsInput): {
  status: 'alive' | 'dead' | 'unclear';
  monthsToProfitability: number | null;
  monthsOfRunway: number;
};
```

### 6-2. 훅 신규/확장

- **신규**: `apps/web/src/hooks/useStartupMetrics.ts` — `useUnifiedRevenue` + `finance-store` + `customer-store`를 묶어 위 함수에 입력 공급. `business_profiles.industry_category_id`로 업종별 토글.
- **확장**: `useDashboard.ts:405–507` actions payload에 새 필드 12개 추가 (`cmgr3m`, `cmgr6m`, `wowGrowth`, `burnMultiple`, `magicNumber`, `ruleOf40`, `defaultAliveStatus`, `mrr`, `arr`, `nrr`, `grr`, `quickRatio`).

### 6-3. UI

- **신규 섹션**: `AnalyticsSurface.tsx`에 `<InvestorMetricsPanel />` 추가. 기본 collapsed (Apple-스타일 disclosure), 펼치면 카드 그리드.
- **카드 그룹**:
  1. **성장 (Growth)**: WoW · CMGR · YoY
  2. **자본 효율 (Capital Efficiency)**: Net Burn · Runway · Burn Multiple · Default Alive
  3. **단위 경제성 (Unit Economics)**: AOV · Repeat Rate · LTV · CAC · Payback
  4. **수익 품질 (Revenue Quality)** (구독 모드 ON 시): MRR · ARR · NRR · GRR · Quick Ratio · Magic Number · Rule of 40
- **업종 토글**: `business_profiles.industry_category_id`에 따라 자동 표시/숨김. 자영업(F&B 등)은 Tier 1 카드만 기본 노출, "투자자 시야" 토글 시 추가 카드.
- **벤치마크 표시**: 각 카드에 업종/단계별 healthy 범위 점선으로 시각화 (예: NRR 100% 라인). 빨강/노랑/초록 신호.

### 6-4. Supabase 마이그레이션 순서

```
1. add_subscriptions_table.sql           (Tier 2 #12, #13, #14)
2. add_marketplace_mode.sql              (Tier 2 #18)
3. add_inventory_metrics_columns.sql     (Tier 2 #20)
4. add_government_grants_table.sql       (Tier 4 #29, #30)
5. add_intellectual_properties_table.sql (Tier 4 #31)
6. add_user_sessions_table.sql           (Tier 3 #22 — 또는 PostHog 도입)
7. add_referrals_table.sql               (Tier 3 #24)
```

### 6-5. 단계별 릴리스 계획

| Sprint | 범위 |
|---|---|
| **S1 (2주)** | Tier 1 #1–#11 전부. UI 새 섹션 토글. |
| **S2 (3주)** | Tier 2 #12–#14 (구독 SaaS), #19 (코호트). |
| **S3 (3주)** | Tier 2 #15–#17 (CAC/LTV/Payback) + #20–#21. |
| **S4 (3주)** | Tier 2 #18 (마켓플레이스 모드) + Tier 4 #29–#33 (한국 특화). |
| **S5+ (장기)** | Tier 3 (DAU/MAU, retention, K-factor, 핀테크/푸드테크 모드). |

---

## 7. 의사결정이 필요한 포인트

구현 전 본인이 결정해야 할 항목:

1. **build.up의 1차 사용자**: 자영업 사장님 vs 스타트업 창업자 — 디폴트 화면을 무엇으로?
   → 권장: 업종 분류로 자동 분기. F&B/리테일 → 자영업 뷰, IT/서비스 → 스타트업 뷰.
2. **PostHog/Amplitude 도입 여부**: DAU/MAU/Retention 자체 구축 vs 외부 SDK.
   → 권장: 외부 SDK가 압도적으로 빠름. 데이터 소유권만 확인.
3. **벤치마크 데이터 출처**: 기존 `financial_benchmarks` 테이블 확장 vs 외부 API (예: ChartMogul, OpenView).
   → 권장: 한국 업종별은 자체 누적, SaaS 글로벌 벤치마크는 외부.
4. **마켓플레이스 모드**: 별도 모드로 만들 것인가, 자영업 뷰의 추가 탭으로 통합할 것인가?

---

## 8. 출처 (Sources)

### Y Combinator / Growth
- [YC Library — Growth for startups](https://www.ycombinator.com/library/6k-growth-for-startups)
- [YC Library — Key Startup Metrics](https://www.ycombinator.com/library/KR-key-startup-metrics)
- [Demo Day Check — Weekly Growth Rate](https://demodaycheck.vercel.app/blog/ideal-weekly-growth-rate-startup)

### a16z Frameworks
- [a16z — 16 Startup Metrics](https://a16z.com/16-startup-metrics/)
- [a16z — 16 More Startup Metrics](https://a16z.com/16-more-startup-metrics/)
- [a16z — 13 Metrics for Marketplace Companies](https://a16z.com/13-metrics-for-marketplace-companies/)

### SaaS Metrics
- [WallStreetPrep — Rule of 40](https://www.wallstreetprep.com/knowledge/rule-of-40/)
- [WallStreetPrep — Burn Multiple](https://www.wallstreetprep.com/knowledge/burn-multiple/)
- [WallStreetPrep — SaaS Magic Number](https://www.wallstreetprep.com/knowledge/saas-magic-number/)
- [WallStreetPrep — Viral Coefficient](https://www.wallstreetprep.com/knowledge/viral-coefficient/)
- [WallStreetPrep — CMGR](https://www.wallstreetprep.com/knowledge/compound-monthly-growth-rate-cmgr/)
- [Stripe — SaaS Quick Ratio](https://stripe.com/resources/more/the-saas-quick-ratio)
- [High Alpha — NRR 2025](https://www.highalpha.com/blog/net-revenue-retention-2025-why-its-crucial-for-saas-growth)
- [Pavilion 2024 B2B SaaS Benchmarks](https://www.joinpavilion.com/resource/b2b-saas-performance-benchmarks)
- [Burkland — 2025 SaaS Benchmarks](https://burklandassociates.com/2025/11/18/2025-saas-benchmarks-what-great-looks-like-and-how-to-reach-it/)
- [Optifai — B2B SaaS Churn](https://optif.ai/learn/questions/b2b-saas-churn-rate-benchmark/)
- [Vitally — SaaS Churn 2025](https://www.vitally.io/post/saas-churn-benchmarks)
- [SaaS Capital — Rule of 40 Private](https://www.saas-capital.com/blog-posts/growth-profitability-and-the-rule-of-40-for-private-saas-companies/)
- [Software Equity — Gross Margin](https://softwareequity.com/blog/gross-margin-saas/)
- [T2D3.pro](https://www.t2d3.pro/) / [Battery — T2D3](https://www.battery.com/blog/helping-entrepreneurs-triple-triple-double-double-double-to-a-billion-dollar-company/)

### Unit Economics & Cash
- [Marketing Case Bootcamp — LTV:CAC Trap](https://www.marketingcasebootcamp.com/post/the-ltv-cac-ratio-trap-why-3x-is-the-wrong-benchmark-for-most-startups)
- [Fiscallion — SaaS Unit Economics](https://www.fiscallion.io/blog/saas-unit-economics)
- [Carta — Burn Rate](https://carta.com/learn/startups/metrics/burn-rate/)
- [Pilot — Runway Calculator](https://pilot.com/blog/burn-rate-calculation-startup-runway-calculator)

### Marketplace
- [Phoenix Strategy — 10 Marketplace KPIs](https://www.phoenixstrategy.group/blog/10-marketplace-kpis-for-vc-backed-companies)
- [Sharetribe — Marketplace Metrics](https://www.sharetribe.com/academy/measure-your-success-key-marketplace-metrics/)

### Consumer / Mobile
- [Sequoia — Measuring Product Health](https://articles.sequoiacap.com/measuring-product-health) / [Retention](https://articles.sequoiacap.com/retention)
- [Gainsight — DAU/MAU](https://www.gainsight.com/essential-guide/product-management-metrics/dau-mau/)
- [Solsten — D1/D7/D30](https://solsten.io/blog/d1-d7-d30-retention-in-gaming)
- [GameAnalytics 2026 Mobile Retention](https://investgame.net/wp-content/uploads/2026/01/2026-01-20-Mobile_retention_benchmarks_2026.pdf)
- [Andrew Chen — Power User Curve](https://andrewchen.com/power-user-curve/)
- [Visible.vc — K-Factor](https://visible.vc/blog/k-factor-what-is-your-saas-companys-viral-coefficient/)

### Founders' Essays
- [Paul Graham — Default Alive or Default Dead](https://paulgraham.com/aord.html)
- [Sean Ellis Score (Learning Loop)](https://learningloop.io/glossary/sean-ellis-score) / [Sean Ellis 40% Test](https://www.fitsignal.com/blog/sean-ellis-40-percent-test)

### Fintech / Foodtech
- [Finro — Fintech KPI Guide](https://www.finrofca.com/news/fintech-kpi-guide)
- [DigitalDefynd — 20 Fintech KPIs](https://digitaldefynd.com/IQ/fintech-kpis/)
- [Burkland — Fintech Metrics](https://burklandassociates.com/2023/09/19/metrics-matter-five-kpis-for-fintech-startups/)
- [Intelivita — Food Delivery KPIs](https://www.intelivita.com/blog/food-delivery-kpis/)
- [ChowNow — Food Delivery KPIs](https://get.chownow.com/blog/kpis-for-online-food-delivery/)

### E-commerce
- [BigCommerce Ecommerce Metrics 2026](https://www.bigcommerce.com/articles/ecommerce/ecommerce-metrics/)
- [Smile.io — Retention](https://blog.smile.io/retention-metrics-you-need-to-know/)
- [NetSuite — 38 Ecommerce Metrics](https://www.netsuite.com/portal/resource/articles/ecommerce/ecommerce-metrics.shtml)

### Series A 2025
- [ICanPitch — Series A 2025](https://learn.icanpitch.com/blog/series-a-valuation-benchmarks-2025/)
- [Valor.vc — Series A 2025](https://valor.vc/blog/raising-a-killer-series-a-in-2025-4-metrics-that-matter)

### Korean Ecosystem
- [ZUZU — 벤처캐피탈 해설서](https://zuzu.network/resource/blog/startup-venture-capital/)
- [매쉬업벤처스 — 가치 산정](https://www.mashupventures.co/contents/how-to-calculate-startup-valuation)
- [THE VC — 한국 투자사 랭킹 2025](https://thevc.kr/discussions/korea_investor_ranking_2025_h1)
- [TIPS 공식](https://www.jointips.or.kr/about.php) / [K-Startup 포털](https://www.k-startup.go.kr/)
- [예비창업패키지 작성법](https://imweb.me/blog?idx=215) / [BM 이해](https://brunch.co.kr/@promise4u/65)
- [KoreaTechDesk — Top Korean VCs](https://koreatechdesk.com/top-korean-venture-capital-firms-backing-startup-success)
- [Seoulz — Top 20 Korean VCs](https://www.seoulz.com/top-20-most-active-korean-venture-capital-firms-private-equity-firms/)

### Cohort & Retention
- [Userpilot — Retention Curve](https://userpilot.com/blog/retention-curve/)
- [Churnkey — Retention Curves](https://churnkey.co/blog/retention-curves/)
- [ChartMogul — Cohort Analysis](https://chartmogul.com/blog/saas-metrics-refresher-cohort-analysis/)

### Strategic
- [Tomasz Tunguz — 10 Financial Metrics](https://tomtunguz.com/ten-financial-metrics/) / [Quick Ratio](https://tomtunguz.com/what-is-quick-ratio-hiding/)
- [Zero to One Summary](https://grahammann.net/book-notes/zero-to-one-peter-thiel)
