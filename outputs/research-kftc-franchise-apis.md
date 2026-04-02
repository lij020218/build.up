# KFTC Franchise Data Sources Research Report

> Date: 2026-03-31
> Target: franchise.ftc.go.kr + data.go.kr + fairdata.go.kr
> Purpose: Identify all franchise data APIs for build.up platform integration

---

## Executive Summary

The Korean Fair Trade Commission (KFTC / 공정거래위원회) provides **20+ Open APIs** across three portals that cover franchise brand information, store counts, sales data, startup costs, store locations, and regulatory decisions. The build.up project already integrates one of these APIs (`FftcBrandFrcsInfoService`) via `packages/shared/src/adapters/kftc-franchise.ts`. This report catalogs every available data source and how each can enhance the platform.

---

## 1. Data Portals Overview

| Portal | URL | Role |
|--------|-----|------|
| **가맹사업거래 정보제공시스템** | https://franchise.ftc.go.kr | Primary franchise info portal; has its own OpenAPI endpoints |
| **공공데이터포털 (data.go.kr)** | https://www.data.go.kr | National open data portal; hosts all KFTC APIs with Swagger docs |
| **공정위 데이터포털 (FairData)** | https://www.fairdata.go.kr | FTC's own data portal; hosts "학습데이터" (learning data) APIs |
| **공정거래위원회 본사이트** | https://www.ftc.go.kr | Press releases, file downloads, violation disclosures |

**Authentication**: All data.go.kr APIs require a free API key (serviceKey) obtained by registering at data.go.kr. Some FairData APIs with pseudonymized data require additional approval via official letter.

---

## 2. APIs Currently Used in build.up

### API A: Brand Franchise Info Service (ALREADY INTEGRATED)
- **Portal ID**: data.go.kr `15110241`
- **Service Name**: `공정거래위원회_가맹정보_브랜드별 가맹점 현황 제공 서비스`
- **Base URL**: `https://apis.data.go.kr/1130000/FftcBrandFrcsInfoService/getBrandFrcsInfo`
- **Current adapter**: `packages/shared/src/adapters/kftc-franchise.ts`
- **Data fields extracted**: brandName, companyName, industryCategory, totalStores, newStores, closedStores, closureRate, franchiseFee, educationFee, deposit, otherCost, totalStartupCost, avgMonthlySales, disclosureYear
- **Request params**: `serviceKey`, `type` (json/xml), `pageNo`, `numOfRows`, `brdNm`, `indutyLclsCd`, `yr`
- **Response fields (raw)**: `brdNm`, `corpNm`, `indutyLclsNm`, `indutySclsNm`, `frcsCo`, `nwBizCo`, `clsBizCo`, `jnFee`, `eduFee`, `assrncFee`, `etcFee`, `avrgSlsAmt`, `yr`
- **Rate limit**: 10,000 calls/day (dev), expandable for production
- **Format**: JSON / XML
- **Update frequency**: Annually (disclosure documents updated within 120 days of fiscal year end)
- **Cache TTL in build.up**: 7 days

---

## 3. NEW APIs Available for Integration

### GROUP A: Franchise Disclosure Document APIs (정보공개서)

#### A1. Disclosure Document List (목록 조회)
- **Portal ID**: data.go.kr `15125569`
- **Service Name**: `공정거래위원회_가맹정보_정보공개서_목록_조회`
- **Endpoint**: `https://apis.data.go.kr/1130000/FftcJngIfrmpListService/...`
- **Data**: List of all registered franchise disclosure documents (brand name, company, registration status, date)
- **Use in build.up**: Master list of all registered franchise brands; discovery/search functionality
- **Access**: Standard API key
- **Format**: JSON/XML

#### A2. Disclosure Document Table of Contents (목차 조회)
- **Portal ID**: data.go.kr `15125570`
- **Service Name**: `공정거래위원회_가맹정보_정보공개서_목차_조회`
- **Endpoint**: `https://apis.data.go.kr/1130000/FftcJngIfrmpTocService/...`
- **Data**: Section headings of each disclosure document (what sections are available per brand)
- **Use in build.up**: Navigate to specific data sections per brand (costs, violations, etc.)
- **Access**: Standard API key

#### A3. Disclosure Document Body (본문 조회) -- HIGHEST VALUE
- **Portal ID**: data.go.kr `15125571`
- **Service Name**: `공정거래위원회_가맹정보_정보공개서_본문_조회`
- **Endpoint**: `https://apis.data.go.kr/1130000/FftcJngIfrmpBodyService/...`
- **Data**: Full text of disclosure documents including:
  - HQ general info (가맹본부 일반현황)
  - HQ and officer violation history (법위반사실)
  - Franchise dispute resolution (분쟁해결)
  - Franchisee financial obligations (가맹점사업자 부담)
  - Business conditions and restrictions
  - Startup procedures and timeline
  - HQ support and training details
- **Use in build.up**: Deep franchise risk assessment; violation history check; full cost breakdown; franchise comparison
- **Access**: Standard API key
- **Priority**: HIGH -- this is the richest data source

#### A4. XML Viewer (Direct franchise.ftc.go.kr)
- **URL**: `https://franchise.ftc.go.kr/api/viewer.do?jngIfrmpSn={id}&serviceKey={key}`
- **Data**: Full disclosure document in XML format, directly from franchise.ftc.go.kr
- **Use in build.up**: Alternative/supplementary access to disclosure data
- **Access**: Requires serviceKey; `jngIfrmpSn` = disclosure document serial number

---

### GROUP B: Industry Statistics APIs (업종 통계)

#### B1. Industry Overview (업종개황)
- **Portal ID**: data.go.kr `15109821`
- **Service Name**: `공정거래위원회_가맹정보_업종별 업종개황 제공 서비스`
- **Endpoint**: `https://apis.data.go.kr/1130000/FftcIndutyStusStatsService/getIndutyStus`
- **Data**: By industry -- brand count, brand ratio, direct-store count/ratio, franchise-store count/ratio
- **Params**: year, industry classification code
- **Use in build.up**: Industry market size; competitive landscape analysis; market saturation indicators
- **Priority**: HIGH

#### B2. Industry Startup Cost Status (업종별 창업비용)
- **Portal ID**: data.go.kr `15110293`
- **Service Name**: `공정거래위원회_가맹정보_업종별 창업비용 현황 제공 서비스`
- **Data**: By industry -- average franchise fee, education fee, deposit, other costs
- **Use in build.up**: Cost estimation benchmarks; industry comparison for startup planning
- **Priority**: HIGH -- directly supports build.up's cost estimation feature

#### B3. Industry Top Startup Cost Ranking (상위 순위)
- **Portal ID**: data.go.kr `15110379`
- **Service Name**: `공정거래위원회_가맹정보_업종별 평균 창업비용 상위 순위 통계 제공 서비스`
- **Data**: Top-ranked brands by startup cost per industry
- **Use in build.up**: Budget-based franchise filtering; "what can I afford?" feature

#### B4. Regional + Industry Average Sales (지역별 업종별 평균 매출액)
- **Portal ID**: data.go.kr `15110302`
- **Service Name**: `공정거래위원회_가맹정보_지역별 업종별 평균 매출액 현황 제공 서비스`
- **Data**: By region + industry -- average sales per area (sqm), average total sales
- **Params**: year, industry major classification code
- **Use in build.up**: Location-based revenue forecasting; district-level profitability analysis
- **Priority**: HIGH -- key for Seoul district scoring already in build.up

#### B5. Regional + Industry Store Count (지역별 업종별 가맹점수)
- **Portal ID**: data.go.kr `15125527`
- **Service Name**: `공정거래위원회_가맹정보_지역별 업종별 가맹점수 현황 제공 서비스`
- **Data**: Franchise store counts by region and industry
- **Use in build.up**: Market saturation analysis; competition density scoring

#### B6. Major Industry Store Count (주요 업종별 가맹점수)
- **Portal ID**: data.go.kr `15110399`
- **Service Name**: `공정거래위원회_가맹정보_주요 업종별 가맹점수 현황 제공 서비스`
- **Endpoint**: `https://apis.data.go.kr/1130000/FftcIndutyFrcsCntStatsService/getIndutyFrcsCntOutStats`
- **Data**: Total franchise stores by major industry category
- **Use in build.up**: Industry health dashboard; macro trend analysis

#### B7. Brand + Industry Store Distribution (브랜드별 업종별 직영점/가맹점 분포)
- **Portal ID**: data.go.kr `15110284`
- **Service Name**: `공정거래위원회_가맹정보_브랜드별,업종별 직영점 및 가맹점 분포 현황 제공 서비스`
- **Data**: Direct-store vs franchise-store ratio per brand per industry
- **Use in build.up**: Brand risk assessment (high direct-store ratio = more HQ commitment)

#### B8. Industry Store Change Status (업종별 가맹점 변동현황)
- **Portal ID**: data.go.kr `15125524`
- **Service Name**: `공정거래위원회_가맹정보_업종별 가맹점 변동현황 조회 서비스`
- **Data**: By industry -- average new openings, average contract terminations, average cancellations per year
- **Use in build.up**: Industry stability scoring; closure risk assessment; trend analysis
- **Priority**: HIGH -- critical for risk assessment

---

### GROUP C: FairData APIs (학습데이터 / 페어데이터)

These are from the FTC's dedicated data portal (fairdata.go.kr) but accessible via data.go.kr. Some require pseudonymization approval.

#### C1. Franchise HQ General Info (가맹본부 일반정보)
- **Portal ID**: data.go.kr `15143703`
- **Data**: Franchise business year, HQ management number, HQ name, business registration number
- **Access**: May require approval for pseudonymized fields (e.g., business registration number)
- **Use in build.up**: HQ verification; cross-reference with other data sources

#### C2. Franchise Store Contract Status by Region (지역별 가맹점 계약상태)
- **Portal ID**: data.go.kr `15143694`
- **Data**: Brand, region, franchise contract date, contract status, store status
- **Use in build.up**: Granular store-level turnover analysis; identify brands with high contract churn

#### C3. Disclosure Document Processing Status (정보공개서 처리상태)
- **Portal ID**: data.go.kr `15143696`
- **Data**: Disclosure registration status, processing timeline
- **Use in build.up**: Identify brands with overdue/irregular disclosure updates (red flag detection)

#### C4. Brand Location Data (브랜드별 위치정보)
- **Portal ID**: data.go.kr `15143698`
- **Data**: Franchise store coordinates, addresses, regional info
- **Use in build.up**: Map visualization; proximity analysis; location competition scoring
- **Priority**: MEDIUM-HIGH -- enables geospatial features

#### C5. Regional Direct Store List (브랜드 지역별 직영점 목록)
- **Portal ID**: data.go.kr `15143693`
- **Data**: Direct-operated store locations by brand and region
- **Use in build.up**: Identify areas where HQ operates directly (may indicate premium locations)

#### C6. Brand Average Sales by Region (브랜드 지역별 가맹점 평균 매출액)
- **Portal ID**: data.go.kr `15143709`
- **Data**: Average sales per franchise store, broken down by brand and region
- **Use in build.up**: Hyper-local revenue forecasting per specific brand + district
- **Priority**: HIGH -- most granular sales data available

#### C7. Brand Store/Sales Aggregate (가맹점/직영점 집계 및 평균매출)
- **Portal ID**: data.go.kr `15143710`
- **Data**: Franchise store count, direct store count, average sales amount, average sales per area, currency unit -- aggregated by brand
- **Use in build.up**: Comprehensive brand performance dashboard
- **Priority**: HIGH

#### C8. Regional Area Franchise Brand General Info (가맹지역본부 일반정보)
- **Portal ID**: Available via fairdata.go.kr
- **Service Name**: `BrandJgtrsGnrlInfoLrnDtinService`
- **Data**: Regional franchise area representative/sub-franchisor information
- **Use in build.up**: Understand multi-level franchise structures

---

### GROUP D: Direct franchise.ftc.go.kr APIs

#### D1. Regional Industry Average Stats
- **URL**: `https://franchise.ftc.go.kr/openApi.do?service=FftcAreaIndutyAvrStatsService`
- **Sub-services**:
  - Food service (외식) average sales by region
  - Wholesale/retail average sales by region
  - Service industry average sales by region
- **Use in build.up**: Industry-level regional benchmarks

#### D2. Franchise Comparison Popup
- **URL**: `https://franchise.ftc.go.kr/firHope/comparePopup.do`
- **URL**: `https://franchise.ftc.go.kr/mnu/program/userRqst/compareView.do?firMstSn={id}`
- **Data**: Side-by-side franchise brand comparison (designed for prospective franchisees)
- **Access**: Web scraping would be needed; no clean API
- **Use in build.up**: Franchise comparison feature reference

---

### GROUP E: Violation & Regulatory Data

#### E1. FTC Decision Documents (결정문)
- **Portal ID**: data.go.kr `15103301` (File data, not API)
- **Data**: Full text of FTC rulings/decisions since 2008 in PDF format (corrective orders, penalties, arbitration)
- **Format**: PDF file download
- **Update**: Periodically (last known update: 2025-12-05)
- **Use in build.up**: Franchise risk scoring based on regulatory history

#### E2. FTC Decision Document List API (결정문 목록 조회)
- **Portal ID**: data.go.kr `15103246`
- **Data**: Searchable index of all FTC decisions
- **Format**: JSON/XML API
- **Use in build.up**: Search for specific brand violations

#### E3. FTC Decision Document Body API (결정문 본문 조회)
- **Portal ID**: data.go.kr `15103247`
- **Data**: Full text of individual FTC decisions
- **Format**: JSON/XML API
- **Use in build.up**: Deep-dive violation analysis for specific brands

#### E4. Business Violation Disclosure (사업자 정보공개)
- **URL**: `https://www.ftc.go.kr/www/selectBizMtlvlInfoList.do?key=210&searchYr=2025`
- **Data**: Annual list of businesses with FTC violations, organized by year
- **Access**: Web page (scraping needed for structured data)
- **Use in build.up**: Red flag screening for franchise brands

---

### GROUP F: File Downloads (Non-API)

#### F1. FTC Data Downloads Page
- **URL**: `https://ftc.go.kr/www/dataOpen.do?key=259`
- **Data**: Bulk download files for franchise statistics
- **Format**: Excel/CSV
- **Use in build.up**: Offline data seeding; batch processing

#### F2. Annual Franchise Statistics Report
- **URL**: Published at ftc.go.kr press releases (e.g., `nttSn=45987`)
- **Data**: Comprehensive annual report with:
  - Total HQ count: 8,802 (2024)
  - Total brand count: 12,377 (2024)
  - Total store count: 365,014 (2024)
  - Year-over-year trends
  - Average sales by industry (all increased in 2024)
  - Closure rates by industry
  - Startup cost trends
- **Format**: PDF/HWP press release + downloadable statistics file
- **Update**: Annual (published ~Q1 of following year)
- **Use in build.up**: Macro trend data; industry health indicators

---

## 4. Integration Priority Matrix

| Priority | API | Portal ID | Use Case in build.up |
|----------|-----|-----------|---------------------|
| **DONE** | Brand Franchise Info | `15110241` | Core franchise data (already in kftc-franchise.ts) |
| **P0** | Disclosure Doc Body | `15125571` | Full franchise details, violation history, costs |
| **P0** | Industry Startup Cost | `15110293` | Cost estimation benchmarks |
| **P0** | Regional+Industry Sales | `15110302` | Location-based revenue forecasting |
| **P0** | Store Change Status | `15125524` | Closure risk / industry stability |
| **P1** | Brand Regional Sales | `15143709` | Brand+district level revenue data |
| **P1** | Brand Store/Sales Aggregate | `15143710` | Brand performance dashboard |
| **P1** | Industry Overview | `15109821` | Market landscape / saturation |
| **P1** | Brand Location Data | `15143698` | Map features, proximity analysis |
| **P1** | Disclosure Doc List | `15125569` | Brand discovery / search index |
| **P2** | Store Count by Region | `15125527` | Competition density |
| **P2** | Store Distribution | `15110284` | Direct vs franchise ratio |
| **P2** | FTC Decision List/Body | `15103246/47` | Regulatory risk scoring |
| **P2** | Startup Cost Ranking | `15110379` | Budget-based filtering |
| **P3** | Contract Status | `15143694` | Store-level churn analysis |
| **P3** | HQ General Info | `15143703` | HQ verification |
| **P3** | Direct Store List | `15143693` | Premium location identification |
| **P3** | Disclosure Status | `15143696` | Red flag detection |

---

## 5. Technical Integration Notes

### Authentication
- All data.go.kr APIs: Register at data.go.kr -> Apply for API key -> Use as `serviceKey` param
- FairData pseudonymized APIs: Additional approval via official letter to FTC Information Officer
- franchise.ftc.go.kr direct APIs: May accept the same data.go.kr service key

### Common API Pattern
All data.go.kr APIs follow the same request/response pattern:
```
GET https://apis.data.go.kr/1130000/{ServiceName}/{operation}
  ?serviceKey={key}
  &type=json
  &pageNo=1
  &numOfRows=20
  &yr=2024
  &indutyLclsCd={code}

Response:
{
  "response": {
    "header": { "resultCode": "00", "resultMsg": "NORMAL_SERVICE" },
    "body": {
      "items": { "item": [...] },
      "totalCount": 123,
      "pageNo": 1,
      "numOfRows": 20
    }
  }
}
```

### Existing Adapter Architecture
The build.up project already has a clean adapter pattern in `packages/shared/src/adapters/`:
- `types.ts` -- `DataAdapterConfig`, `AdapterResult<T>`, `DataAdapter`
- `kftc-franchise.ts` -- Currently wraps `FftcBrandFrcsInfoService` only
- `cache.ts` -- TTL-based caching (KFTC data cached for 7 days)

### Recommended New Adapters
```
packages/shared/src/adapters/
  kftc-franchise.ts          -- EXISTING (expand with more endpoints)
  kftc-disclosure.ts         -- NEW: Disclosure list/ToC/body APIs (15125569/70/71)
  kftc-industry-stats.ts     -- NEW: Industry overview, costs, store counts
  kftc-regional-sales.ts     -- NEW: Regional sales + store data
  kftc-store-changes.ts      -- NEW: Store opening/closing trends
  kftc-fairdata.ts           -- NEW: FairData brand-level aggregates
  kftc-violations.ts         -- NEW: FTC decision documents
```

### Environment Variables
```env
# Already exists
KFTC_API_KEY=              # data.go.kr service key

# Potentially needed for FairData
FAIRDATA_API_KEY=          # If fairdata.go.kr uses separate auth
```

### Rate Limits
- Development: 10,000 requests/day per API
- Production: Expandable by registering usage cases on data.go.kr
- Recommendation: Implement per-API rate tracking in the existing rate-limit middleware

### Update Frequency
- Disclosure documents: Updated annually (within 120 days of fiscal year end; 180 days for individual business owners)
- Interim changes: Within 30 days of change event
- Statistics: Published annually by FTC (~Q1)
- Cache strategy: 7-day TTL is appropriate for most data; daily TTL for store change data during peak update season (May-July)

---

## 6. Key Data Points for build.up Features

### Franchise Comparison (프랜차이즈 비교)
- **APIs**: A3 (disclosure body), B7 (store distribution), C7 (brand aggregate)
- **Data**: Side-by-side comparison of startup cost, monthly sales, closure rate, violation history

### Cost Estimation (창업비용 추정)
- **APIs**: B2 (industry startup cost), B3 (cost ranking), A3 (disclosure body for brand-specific)
- **Data**: Industry benchmarks + brand-specific cost breakdowns

### Risk Assessment (리스크 평가)
- **APIs**: B8 (store changes), E1-E3 (violations), C3 (disclosure status), A3 (violation history in disclosure)
- **Data**: Closure trends, regulatory violations, irregular disclosure patterns

### Location Analysis (상권 분석)
- **APIs**: B4 (regional sales), B5 (regional store count), C4 (brand locations), C6 (brand regional sales)
- **Data**: District-level sales benchmarks, competition density, store mapping

### Industry Health Dashboard (업종 건강 지표)
- **APIs**: B1 (industry overview), B6 (major industry store count), B8 (store changes), F2 (annual report)
- **Data**: Market growth/decline, brand count trends, average sales trends

---

## Sources

- [공정거래위원회_가맹정보_정보공개서_목록_조회](https://www.data.go.kr/data/15125569/openapi.do)
- [공정거래위원회_가맹정보_정보공개서_목차_조회](https://www.data.go.kr/data/15125570/openapi.do)
- [공정거래위원회_가맹정보_정보공개서_본문_조회](https://www.data.go.kr/data/15125571/openapi.do)
- [공정거래위원회_가맹정보_브랜드별 가맹점 현황 제공 서비스](https://www.data.go.kr/data/15110241/openapi.do)
- [공정거래위원회_가맹정보_업종별 업종개황 제공 서비스](https://www.data.go.kr/data/15109821/openapi.do)
- [공정거래위원회_가맹정보_업종별 창업비용 현황 제공 서비스](https://www.data.go.kr/data/15110293/openapi.do)
- [공정거래위원회_가맹정보_업종별 평균 창업비용 상위 순위 통계](https://www.data.go.kr/data/15110379/openapi.do)
- [공정거래위원회_가맹정보_지역별 업종별 평균 매출액 현황](https://www.data.go.kr/data/15110302/openapi.do)
- [공정거래위원회_가맹정보_지역별 업종별 가맹점수 현황](https://www.data.go.kr/data/15125527/openapi.do)
- [공정거래위원회_가맹정보_주요 업종별 가맹점수 현황](https://www.data.go.kr/data/15110399/openapi.do)
- [공정거래위원회_가맹정보_브랜드별 업종별 직영점/가맹점 분포](https://www.data.go.kr/data/15110284/openapi.do)
- [공정거래위원회_가맹정보_업종별 가맹점 변동현황 조회](https://www.data.go.kr/data/15125524/openapi.do)
- [공정거래위원회_페어데이터_가맹본부 일반정보](https://www.data.go.kr/data/15143703/openapi.do)
- [공정거래위원회_페어데이터_브랜드_지역별 가맹점 계약상태정보](https://www.data.go.kr/data/15143694/openapi.do)
- [공정거래위원회_페어데이터_가맹정보공개서 처리상태](https://www.data.go.kr/data/15143696/openapi.do)
- [공정거래위원회_페어데이터_브랜드별 위치정보](https://www.data.go.kr/data/15143698/openapi.do)
- [공정거래위원회_페어데이터_브랜드 지역별 직영점 목록](https://www.data.go.kr/data/15143693/openapi.do)
- [공정거래위원회_페어데이터_브랜드 지역별 가맹점 평균 매출액](https://www.data.go.kr/data/15143709/openapi.do)
- [공정거래위원회_페어데이터_브랜드별 가맹점/직영점 집계 및 평균매출](https://www.data.go.kr/data/15143710/openapi.do)
- [공정거래위원회_결정문 (파일데이터)](https://www.data.go.kr/data/15103301/fileData.do)
- [공정거래위원회_결정문 목록 조회](https://www.data.go.kr/data/15103246/openapi.do)
- [공정거래위원회_결정문 본문 조회](https://www.data.go.kr/data/15103247/openapi.do)
- [franchise.ftc.go.kr OpenAPI](https://franchise.ftc.go.kr/openApi.do?service=FftcAreaIndutyAvrStatsService)
- [공정거래위원회 공공데이터API 안내](https://www.ftc.go.kr/www/contents.do?key=257)
- [공정거래위원회 자료 다운로드](https://ftc.go.kr/www/dataOpen.do?key=259)
- [2024년 가맹사업 현황 통계 발표](https://www.ftc.go.kr/www/selectBbsNttView.do?bordCd=3&key=12&searchCtgry=01,02&nttSn=45987)
- [사업자 정보공개 (법위반 제재)](https://www.ftc.go.kr/www/selectBizMtlvlInfoList.do?key=210&searchYr=2025)
- [공정위 데이터포털 FairData](https://www.fairdata.go.kr/ext/index.do)
- [FairData OpenAPI 활용 가이드](https://www.fairdata.go.kr/ext/api/openApiGuidePopup.do?apiSrvcNm=BrandLcLrnDtinService)
