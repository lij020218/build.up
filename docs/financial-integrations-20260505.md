# 금융·세무 데이터 연동 (2026-05-05)

## 배경

Found.One 사장님 사용자에게 매출/비용/세금 raw data 를 자동으로 채워주려면
"마이데이터 사업자 인가" 또는 "금융업 인가" 가 필요한 직접 연동 대신,
이미 인가를 가진 **API 중계 사업자** 를 거쳐야 한다.

그래서 사용한 3개 API:

| 공급자 | 용도 | 인가 우회 방식 | 가격 |
|---|---|---|---|
| **CODEF** | 사업자 통장 거래내역 + 여신금융협회 카드매출 | 사장님이 사업자번호·생년월일·계좌만 입력하면 CODEF 가 사장님 명의로 통합조회 회원가입 자동화 | 구독형 (sandbox 무료, 운영 건당 ~₩50) |
| **팝빌 (Popbill)** | 홈택스 세금계산서·현금영수증 | 회원사가 LinkID·SecretKey 보유, 사장님이 홈택스 인증서 위임 등록 | 건당 과금 (수집 ~₩10/건) |
| (CODEF 통합) | 여신금융협회 매통조 (카드매출) | 위와 동일 | CODEF 구독에 포함 |

> 여신금융협회 자체 Open API 는 카드사 본인 발급 정보만 조회 가능 → 가맹점 사장님은
> CODEF 같은 중계 통해 매통조(매출통합조회) 회원가입 자동화 후에 데이터 fetch.

## 구조

```
packages/
  integrations/                       ← 정규화 타입 + 어댑터 인터페이스 (브라우저 호환)
    src/
      types.ts                          ← NormalizedBankTransaction, NormalizedTaxInvoice, …
      adapter.ts                        ← BankAdapter, CardSalesAdapter, HometaxAdapter
      normalize.ts                      ← raw → normalized 변환 (CODEF resTrHistoryList 등)

apps/web/app/api/
  _lib/
    codef-client.ts                   ← 카드매출 + 통장 거래내역 (단일 클라이언트)
    popbill-client.ts                 ← node-popbill SDK promisify 래퍼
    envelope-crypto.ts                ← AES-256-GCM 봉투 암호화 (재사용)
    auth.ts, rate-limit.ts             ← (재사용)
  integrations/
    codef/
      connect/, sync/, status/         ← (기존, 카드매출용)
      bank/
        connect/                       ← 사장님 통장 등록 (보유계좌 검증 후)
        sync/                          ← 거래내역 fetch + 자동 카테고리 분류
        status/                        ← 등록 통장 + 30일 통계
        daily/                         ← useUnifiedRevenue 매출 환산
    popbill/
      connect/                         ← 사업자번호 등록 + 회원사 가입 여부 확인
      sync/                            ← 비동기 Job: RequestJob → poll → Search → upsert
      status/                          ← 30일 통계 + 최근 Job 10건
      daily/                           ← 현금영수증 + 매출 세금계산서 일별 합산

supabase/migrations/
  20260505_add_popbill_codef_bank.sql
    popbill_connections, popbill_jobs, popbill_tax_invoices, popbill_cashbills
    codef_bank_accounts, codef_bank_transactions
    v_revenue_daily_unified (view)
```

## 보안

- 모든 사장님 위임 토큰 (CODEF connectedId) 은 **봉투 암호화** (AES-256-GCM, KEK/DEK 분리) 로 저장.
- 팝빌은 회원사 LinkID/SecretKey 가 우리 자산 → 환경변수만으로 충분, 봉투 암호화 不要.
- 모든 거래/세금계산서 테이블은 **RLS** 본인 select only, write 는 service_role.
- 사업자번호·계좌번호는 마스킹 컬럼 (`business_number_mask`, `account_number_mask`) 별도 보관 →
  화면에는 마스킹된 값만 노출.

## 비동기 Job 패턴 (팝빌)

팝빌 홈택스 수집은 비동기:
1. `RequestJob` → `jobID` (1시간 유효)
2. `GetJobState` 폴링 (state: 1=대기, 2=진행, 3=완료)
3. `Search` 페이지네이션으로 전건 수집 → DB upsert

`/api/integrations/popbill/sync` 는 28초 폴링 한도 → 안 끝나면 jobID 만 `popbill_jobs` 에 기록 후
별도 cron 이 후속 수집 (TODO: `/api/cron/popbill-poll/route.ts`).

## 정규화 매출 우선순위 (`useUnifiedRevenue`)

같은 날 여러 출처가 있을 때:

```
PortOne (실시간 webhook)         ← 가장 정확
TOSS Place (POS 결제)
CODEF Card (10개 카드사 매통조)
팝빌 (현금영수증 + 매출 세금계산서)
CODEF Bank (사업자 통장 입금)
CSV 업로드                        ← 가장 부정확
```

CODEF Bank 입금이 후순위인 이유:
- 카드사 정산은 D+2~3 시점에 합쳐 들어와 매출일자 부정확
- 정산 금액 = 실제 매출 - 수수료 → 매출 합계 underestimate

## 환경변수

```bash
# 기존
PORTONE_KEK_BASE64=...
CODEF_CLIENT_ID=...
CODEF_CLIENT_SECRET=...

# 신규
POPBILL_LINK_ID=                # popbill.com 회원사 가입 후
POPBILL_SECRET_KEY=
POPBILL_IS_TEST=true
```

## 다음 단계

- [ ] 팝빌 cron polling job (Job 28초 초과 시)
- [ ] `codef_bank_transactions` 자동 카테고리 분류 정확도 개선 (현재 단순 keyword)
- [ ] 사업자 통장 거래 → 비용(`monthlyCosts`) 자동 채움 매핑
- [ ] 매입 세금계산서 → COGS / 운영비 자동 분류
- [ ] 부가세 신고 시점 매출/매입 자동 합산 리포트 (`tax-calendar` 와 연결)
