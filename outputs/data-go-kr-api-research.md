# data.go.kr Public API Research for build.up Platform

> Research Date: 2026-03-31
> Scope: Korean Government Open Data Portal APIs & Datasets for Small Business/Startup Management

---

## Table of Contents

1. [Commercial District & Market Data (상권 분석)](#1-commercial-district--market-data-상권-분석)
2. [Franchise Information (프랜차이즈)](#2-franchise-information-프랜차이즈)
3. [Business Registration & Verification (사업자등록)](#3-business-registration--verification-사업자등록)
4. [Business Permits & Licenses (인허가)](#4-business-permits--licenses-인허가)
5. [Government Support Programs (정부 지원 사업)](#5-government-support-programs-정부-지원-사업)
6. [Tax & Finance (세금/재무)](#6-tax--finance-세금재무)
7. [Real Estate & Rent Data (부동산/임대)](#7-real-estate--rent-data-부동산임대)
8. [Demographics (인구통계)](#8-demographics-인구통계)
9. [Industry Statistics (산업통계)](#9-industry-statistics-산업통계)
10. [E-Commerce Registration (통신판매업)](#10-e-commerce-registration-통신판매업)
11. [Building Registry (건축물대장)](#11-building-registry-건축물대장)
12. [Implementation Priority Matrix](#12-implementation-priority-matrix)
13. [General API Access Notes](#13-general-api-access-notes)

---

## 1. Commercial District & Market Data (상권 분석)

### 1-A. 소상공인시장진흥공단_상가(상권)정보 API

| Field | Detail |
|-------|--------|
| **Korean Name** | 소상공인시장진흥공단_상가(상권)정보 API |
| **English Name** | Small Enterprise and Market Service (SEMAS) - Store/Commercial District Information API |
| **Provider** | 소상공인시장진흥공단 (Small Enterprise and Market Service) |
| **Dataset ID** | 15012005 |
| **Portal URL** | https://www.data.go.kr/data/15012005/openapi.do |
| **Type** | REST API (JSON/XML) |
| **Endpoint** | `http://apis.data.go.kr/B553077/api/open/sdsc/baroApi` |
| **Rate Limit** | 30 TPS (transactions per second) |
| **Auth** | Service key required (free registration on data.go.kr) |

**Data Provided:**
- Store/business name (상호명)
- Industry classification codes (업종코드) - 10 major / 75 mid / 247 sub-categories
- Street address (도로명주소) and lot address (지번주소)
- Longitude/Latitude coordinates (경도/위도)
- Administrative district codes (행정동코드)
- Data sourced from: National Tax Service + Credit card companies

**Key Parameters:**
- `resId`: Resource type (`store`)
- `catId`: Category type (`dong` for administrative dong)
- `divId`: Area division (`ctprvnCd`=province, `signguCd`=city/district, `adongCd`=admin dong)
- `key`: Administrative area code
- `pageNo`: Page number
- `type`: Response format (`json`)
- `serviceKey`: API authentication key

**build.up Usage:**
- **Location analysis**: Show entrepreneurs what businesses exist in a target area
- **Competition density**: Count competitors by business type per district
- **Heatmap visualization**: Plot stores on map by industry type
- **Gap analysis**: Identify underserved business types in a given area

---

### 1-B. 소상공인시장진흥공단_소상공인365_상권분석 (File Data)

| Field | Detail |
|-------|--------|
| **Korean Name** | 소상공인시장진흥공단_소상공인365_상권분석 |
| **English Name** | SEMAS - Small Business 365 Commercial District Analysis |
| **Provider** | 소상공인시장진흥공단 |
| **Dataset ID** | 15143517 |
| **Portal URL** | https://www.data.go.kr/data/15143517/fileData.do |
| **Type** | File download (auto-converted to REST API) |
| **Last Updated** | 2025-05-22 |

**Data Provided:**
- Sales/revenue estimates by region and business type (매출)
- Delivery order counts (배달건수)
- Business type distribution (업종분포)
- Floating/foot traffic population data (유동인구)
- Per administrative-dong level analysis

**build.up Usage:**
- **Revenue estimation**: Predict expected revenue for a business type in a specific area
- **Delivery market sizing**: Show delivery demand for food businesses
- **Market entry scoring**: Part of the overall commercial district scoring algorithm

---

### 1-C. 소상공인시장진흥공단_소상공인365_배달상권

| Field | Detail |
|-------|--------|
| **Korean Name** | 소상공인시장진흥공단_소상공인365_배달상권 |
| **English Name** | SEMAS - Small Business 365 Delivery Commercial District |
| **Dataset ID** | 15151045 |
| **Portal URL** | https://www.data.go.kr/data/15151045/fileData.do |
| **Type** | File download |
| **Last Updated** | 2025-08-31 |

**Data Provided:**
- Delivery-specific commercial district data
- Delivery order volumes by area

**build.up Usage:**
- **Delivery business viability**: Critical for F&B entrepreneurs evaluating delivery-focused models

---

### 1-D. 소상공인시장진흥공단_소상공인365_성장상권

| Field | Detail |
|-------|--------|
| **Korean Name** | 소상공인시장진흥공단_소상공인365_성장상권 |
| **English Name** | SEMAS - Small Business 365 Growth Commercial Districts |
| **Dataset ID** | 15151047 |
| **Portal URL** | https://www.data.go.kr/data/15151047/fileData.do |
| **Type** | File download |
| **Last Updated** | 2025-08-31 |

**Data Provided:**
- Identification of growing commercial districts
- Growth trend indicators

**build.up Usage:**
- **Opportunity identification**: Highlight emerging/growing areas to entrepreneurs

---

### 1-E. 전국주요상권현황 표준데이터

| Field | Detail |
|-------|--------|
| **Korean Name** | 전국주요상권현황 표준데이터 |
| **English Name** | National Major Commercial Districts Standard Data |
| **Dataset ID** | 15029180 |
| **Portal URL** | https://www.data.go.kr/data/15029180/standard.do |
| **Type** | Standard data (Grid/OpenAPI/Chart) |

**Data Provided:**
- Major commercial district status nationwide
- Standardized format across all regions

**build.up Usage:**
- **Benchmark comparisons**: Compare commercial districts across the country

---

### 1-F. 서울시 우리마을가게 상권분석서비스 (Seoul-specific)

| Field | Detail |
|-------|--------|
| **Korean Name** | 서울특별시_우리마을가게 상권분석서비스 |
| **English Name** | Seoul My Neighborhood Store Commercial District Analysis |
| **Provider** | 서울특별시 (Seoul Metropolitan Government) |
| **Portal** | https://data.seoul.go.kr (Seoul Open Data Plaza) |
| **Type** | REST API |

**Multiple Sub-datasets Available:**
| Sub-dataset | Seoul Data ID | Description |
|-------------|---------------|-------------|
| 상권-추정유동인구 | OA-13340 | Estimated floating population in commercial districts |
| 상권배후지-추정유동인구 | OA-13332 | Estimated floating population in hinterland areas |
| 추정매출-상권 | OA-15572 | Estimated sales by commercial district |
| 길단위인구-상권 | OA-15568 | Street-level population in commercial areas |
| 길단위인구-상권배후지 | OA-15582 | Street-level population in hinterland |
| 상권영역 | OA-15560 | Commercial district boundary areas |

**Data Provided:**
- Estimated floating population by gender/age for 골목상권 (alley commercial), 발달상권 (developed commercial), 전통시장 (traditional market), 관광특구 (tourist zones)
- Estimated sales by 100 life-related business types (10 food service, 47 service, 43 retail)
- Resident population, apartment complexes, store information

**build.up Usage:**
- **Seoul-focused deep analysis**: Granular foot traffic and sales estimates for Seoul
- **Time-of-day analysis**: Population flow patterns
- **Business type revenue benchmarks**: Expected sales by type and location

---

## 2. Franchise Information (프랜차이즈)

### 2-A. 공정거래위원회_가맹정보_정보공개서_목록_조회

| Field | Detail |
|-------|--------|
| **Korean Name** | 공정거래위원회_가맹정보_정보공개서_목록_조회 |
| **English Name** | FTC - Franchise Information Disclosure Document List Inquiry |
| **Provider** | 공정거래위원회 (Fair Trade Commission, FTC) |
| **Dataset ID** | 15125569 |
| **Portal URL** | https://www.data.go.kr/data/15125569/openapi.do |
| **Type** | REST API |
| **Auth** | Service key required |

**Data Provided:**
- List of registered and publicly available franchise disclosure documents
- Brand names, business types, registration status

**build.up Usage:**
- **Franchise discovery**: Browse all registered franchise brands in Korea

---

### 2-B. 공정거래위원회_가맹정보_정보공개서_목차_조회

| Field | Detail |
|-------|--------|
| **Korean Name** | 공정거래위원회_가맹정보_정보공개서_목차_조회 |
| **English Name** | FTC - Franchise Disclosure Document Table of Contents Inquiry |
| **Dataset ID** | 15125570 |
| **Portal URL** | https://www.data.go.kr/data/15125570/openapi.do |
| **Type** | REST API |

**Data Provided:**
- Table of contents structure for each disclosure document

---

### 2-C. 공정거래위원회_가맹정보_정보공개서_본문_조회

| Field | Detail |
|-------|--------|
| **Korean Name** | 공정거래위원회_가맹정보_정보공개서_본문_조회 |
| **English Name** | FTC - Franchise Disclosure Document Body/Content Inquiry |
| **Dataset ID** | 15125571 |
| **Portal URL** | https://www.data.go.kr/data/15125571/openapi.do |
| **Type** | REST API |

**Data Provided:**
- Full content of franchise disclosure documents
- Initial investment costs, fees, territory rights, obligations

**build.up Usage:**
- **Franchise cost analysis**: Extract initial investment, royalties, advertising fees
- **Risk assessment**: Identify contractual obligations and restrictions

---

### 2-D. 공정거래위원회_가맹정보_브랜드별 가맹점 현황 제공 서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 공정거래위원회_가맹정보_브랜드별 가맹점 현황 제공 서비스 |
| **English Name** | FTC - Franchise Brand Store Status Service |
| **Dataset ID** | 15110241 |
| **Portal URL** | https://www.data.go.kr/data/15110241/openapi.do |
| **Type** | REST API |

**Data Provided:**
- Number of franchise stores per brand per year
- Area-unit average sales amount (면적단위평균매출금액)
- Average sales amount (평균매출금액)
- Brand name (브랜드명), Business name (상호명)

**build.up Usage:**
- **Brand comparison**: Compare franchise brands by performance
- **Revenue benchmarks**: Show average sales per franchise brand
- **Growth tracking**: Year-over-year store count changes

---

### 2-E. 공정거래위원회_페어데이터_브랜드 지역별 가맹점 평균 매출액 제공서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 공정거래위원회_페어데이터_브랜드 지역별 가맹점 평균 매출액 제공서비스 |
| **English Name** | FTC FairData - Brand Regional Franchise Average Sales Service |
| **Dataset ID** | 15143709 |
| **Portal URL** | https://www.data.go.kr/data/15143709/openapi.do |
| **Type** | REST API |

**Data Provided:**
- Average sales by brand and region
- Based on franchise disclosure documents
- Fields: business standard year, brand management number, regional info, brand name, average sales, area-to-sales ratio

**build.up Usage:**
- **Regional performance**: Show how a franchise brand performs in different regions
- **Location decision**: Help entrepreneurs pick the best region for a franchise

---

### 2-F. 공정거래위원회_페어데이터_브랜드_지역별 가맹점 계약상태정보 제공서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 공정거래위원회_페어데이터_브랜드_지역별 가맹점 계약상태정보 제공서비스 |
| **English Name** | FTC FairData - Brand Regional Franchise Contract Status Service |
| **Dataset ID** | 15143694 |
| **Portal URL** | https://www.data.go.kr/data/15143694/openapi.do |
| **Type** | REST API |

**Data Provided:**
- Contract status of franchise stores by brand and region
- New openings, terminations, renewals

**build.up Usage:**
- **Franchise stability indicator**: Show contract termination rates as risk signals
- **Brand health**: Track whether stores are renewing or closing

---

### 2-G. 공정거래위원회_페어데이터_브랜드별 가맹점/직영점 집계 및 가맹사업자 평균매출 학습데이터

| Field | Detail |
|-------|--------|
| **Korean Name** | 공정거래위원회_페어데이터_브랜드별 가맹점/직영점 집계 및 가맹사업자 평균매출 학습데이터 제공서비스 |
| **English Name** | FTC FairData - Brand Franchise/Direct Store Aggregation & Average Sales |
| **Dataset ID** | 15143710 |
| **Portal URL** | https://www.data.go.kr/data/15143710/openapi.do |
| **Type** | REST API |

**Data Provided:**
- Total franchise vs direct store count per brand
- Average franchisor sales

**build.up Usage:**
- **Franchise ratio analysis**: Brands with more direct stores may indicate different strategies
- **Revenue benchmarking**: Franchisor-level performance data

---

### 2-H. 공정거래위원회_가맹정보_지역별 업종별 가맹점수 현황 제공 서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 공정거래위원회_가맹정보_지역별 업종별 가맹점수 현황 제공 서비스 |
| **English Name** | FTC - Franchise Store Count by Region and Business Type |
| **Dataset ID** | 15125527 |
| **Portal URL** | https://www.data.go.kr/data/15125527/openapi.do |
| **Type** | REST API |

**Data Provided:**
- Franchise store counts by region and business type
- Franchise density ratios

**build.up Usage:**
- **Market saturation**: Determine franchise density in target areas
- **Industry trends**: Which franchise sectors are growing

---

### 2-I. 공정거래위원회_가맹정보_업종별 가맹점 변동현황 조회 서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 공정거래위원회_가맹정보_업종별 가맹점 변동현황 조회 서비스 |
| **English Name** | FTC - Franchise Store Change Status by Business Type |
| **Dataset ID** | 15125524 |
| **Portal URL** | https://www.data.go.kr/data/15125524/openapi.do |
| **Type** | REST API |

**Data Provided:**
- Year-over-year changes in franchise store counts by business type
- Openings, closures, net change

**build.up Usage:**
- **Franchise market trends**: Identify growing vs declining franchise sectors

---

### 2-J. 공정거래위원회_페어데이터_브랜드 지역별 직영점 목록 정보 제공서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 공정거래위원회_페어데이터_브랜드 지역별 직영점 목록 정보 제공서비스 |
| **English Name** | FTC FairData - Brand Regional Direct Store List Service |
| **Dataset ID** | 15143693 |
| **Portal URL** | https://www.data.go.kr/data/15143693/openapi.do |
| **Type** | REST API |

---

### 2-K. 공정거래위원회_가맹정보_주요 업종별 가맹점수 현황 제공 서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 공정거래위원회_가맹정보_주요 업종별 가맹점수 현황 제공 서비스 |
| **English Name** | FTC - Major Business Type Franchise Store Count Status |
| **Dataset ID** | 15110399 |
| **Portal URL** | https://www.data.go.kr/data/15110399/openapi.do |
| **Type** | REST API |

---

## 3. Business Registration & Verification (사업자등록)

### 3-A. 국세청_사업자등록정보 진위확인 및 상태조회 서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 국세청_사업자등록정보 진위확인 및 상태조회 서비스 |
| **English Name** | NTS - Business Registration Information Verification & Status Inquiry Service |
| **Provider** | 국세청 (National Tax Service, NTS) |
| **Dataset ID** | 15081808 |
| **Portal URL** | https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15081808 |
| **Type** | REST API (POST) |
| **Endpoint** | `https://api.odcloud.kr/api/nts-businessman/v1/status` |
| **Rate Limit** | 100 records per request, 1,000,000 requests per day |
| **Auth** | Service key + Authorization header |

**Two Core Functions:**

1. **Verification (진위확인)**: Input business registration number + opening date + representative name => validates against NTS records (true/false)

2. **Status Inquiry (상태조회)**: Input business registration number only => returns:
   - Operating status (계속사업자/휴업자/폐업자)
   - Tax type (일반과세/간이과세/면세)
   - Closure date (if applicable)

**build.up Usage:**
- **Onboarding verification**: Verify user's business registration during signup
- **Partner/vendor verification**: Check if a vendor or contractor is legitimate
- **Business status monitoring**: Alert users if a partner's business status changes
- **Contract validation**: Ensure parties in a contract are active businesses

---

### 3-B. 창업진흥원_창업기업확인서발급기업정보_조회서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 창업진흥원_창업기업확인서발급기업정보_조회서비스 |
| **English Name** | KISED - Startup Verification Certificate Issued Company Information |
| **Provider** | 창업진흥원 (Korea Institute of Startup & Entrepreneurship Development) |
| **Dataset ID** | 15125362 |
| **Portal URL** | https://www.data.go.kr/data/15125362/openapi.do |
| **Type** | REST API |

**Data Provided:**
- List of companies with official startup verification certificates
- Product names, product categories, key features, sales channels
- Certified under Small and Medium Enterprise Basic Law

**build.up Usage:**
- **Startup verification**: Help users check their startup certification status
- **Marketplace**: Showcase certified startup products for B2B connections
- **Credibility badge**: Display startup certification status on user profiles

---

## 4. Business Permits & Licenses (인허가)

### 4-A. LOCALDATA - 지방행정인허가데이터 (localdata.go.kr)

| Field | Detail |
|-------|--------|
| **Korean Name** | 지방행정인허가데이터개방 |
| **English Name** | Local Government Permit/License Data Portal |
| **Provider** | 행정안전부 (Ministry of the Interior and Safety, MOIS) |
| **Portal URL** | https://www.localdata.go.kr/ |
| **Type** | REST API + File download |
| **Note** | Being integrated into data.go.kr as of 2026-04-15 |

**Data Provided:**
- **195 types of business permits/licenses** including:
  - 일반음식점 (General restaurants)
  - 통신판매업 (Telemarketing/e-commerce businesses)
  - 미용업 (Beauty/salon businesses)
  - 담배소매업 (Tobacco retail)
  - And 191 more categories
- **14 types of convenience information**: Public restrooms, CCTV, civil defense shelters, etc.

**Key Fields:**
- License/permit date (인허가일자)
- Business status (영업상태) - operating, suspended, closed
- Business name (상호명/업소명)
- Address (소재지)

**Access Methods:**
1. Full data download (monthly snapshots)
2. Open API for incremental updates (변동분)
3. Customizable: select specific fields and business types

**build.up Usage:**
- **Permit checklist**: Show exactly which permits are needed for each business type
- **Competitor intelligence**: Count licensed businesses by type and area
- **Compliance tracking**: Monitor permit status for the user's own business
- **Area analysis**: Show density of specific business types (e.g., restaurants) per district

---

### 4-B. 전국일반음식점 표준데이터

| Field | Detail |
|-------|--------|
| **Korean Name** | 전국일반음식점 표준데이터 |
| **English Name** | National General Restaurant Standard Data |
| **Dataset ID** | 15096283 |
| **Portal URL** | https://www.data.go.kr/data/15096283/standard.do |
| **Type** | Standard data (Grid/OpenAPI/Chart) |

**Data Provided:**
- Standardized restaurant permit/license information nationwide
- License date, business status (operating/normal), business name, location
- Covers all restaurants serving Korean, Chinese, Japanese food, etc.

**build.up Usage:**
- **F&B market analysis**: Restaurant density and distribution analysis
- **Competition mapping**: Map all restaurants in a target area

---

### 4-C. 행정안전부_통신판매업 데이터

| Field | Detail |
|-------|--------|
| **Korean Name** | 행정안전부_통신판매업 |
| **English Name** | MOIS - Telemarketing/E-commerce Business Data |
| **Dataset ID** | 15045060 |
| **Portal URL** | https://www.data.go.kr/data/15045060/fileData.do |
| **Type** | File download |

**Data Provided:**
- All registered e-commerce/telemarketing businesses nationwide
- Registration dates, operating status, business names, locations

---

## 5. Government Support Programs (정부 지원 사업)

### 5-A. 창업진흥원_K-Startup(사업소개, 사업공고, 콘텐츠 등)_조회서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 창업진흥원_K-Startup(사업소개,사업공고,콘텐츠 등)_조회서비스 |
| **English Name** | KISED - K-Startup Service (Business Intro, Announcements, Content) |
| **Provider** | 창업진흥원 (KISED) |
| **Dataset ID** | 15125364 |
| **Portal URL** | https://www.data.go.kr/data/15125364/openapi.do |
| **Endpoint Base** | `apis.data.go.kr/B552735/kisedKstartupService01` |
| **Type** | REST API |
| **Rate Limit** | Dev: 10,000 requests; Prod: increase upon registration |
| **Auth** | Service key (auto-approval for dev) |

**Data Provided:**
- Support project announcements (사업공고)
- Project name, type, overview
- Target recipients (지원대상)
- Recruitment periods (모집기간)
- Application methods (신청방법)
- Contact information
- Startup-related statistics reports
- Startup-related content/articles

**build.up Usage:**
- **Support program feed**: Real-time listing of all K-Startup support programs
- **Smart matching**: Match user's business stage/type to eligible programs
- **Application deadline alerts**: Push notifications for upcoming deadlines
- **Content curation**: Surface relevant startup knowledge articles

---

### 5-B. 중소기업기술정보진흥원_중소벤처24 공고정보

| Field | Detail |
|-------|--------|
| **Korean Name** | 중소기업기술정보진흥원_중소벤처24 공고정보 |
| **English Name** | TIPA - SME Venture 24 Announcement Information |
| **Provider** | 중소기업기술정보진흥원 (TIPA) |
| **Dataset ID** | 15113191 |
| **Portal URL** | https://www.data.go.kr/data/15113191/openapi.do |
| **Type** | REST API |

**Data Provided:**
- Announcement name (공고명)
- Period (기간)
- Supporting agency (지원기관)
- Application status (신청상태)
- Attachments (첨부파일)
- Collected from all MSS-affiliated agencies

**build.up Usage:**
- **Comprehensive program listing**: Aggregates announcements from multiple government agencies
- **Application tracking**: Track which programs are currently accepting applications

---

### 5-C. 중소벤처기업부_사업공고

| Field | Detail |
|-------|--------|
| **Korean Name** | 중소벤처기업부_사업공고 |
| **English Name** | MSS - Business Announcements |
| **Provider** | 중소벤처기업부 (Ministry of SMEs and Startups, MSS) |
| **Dataset ID** | 15113297 |
| **Portal URL** | https://www.data.go.kr/data/15113297/openapi.do |
| **Type** | REST API |

**Data Provided:**
- Business announcement title, author, attachments
- From the Ministry of SMEs and Startups directly

**build.up Usage:**
- **Official MSS announcements**: Direct feed from the ministry

---

### 5-D. 창업진흥원_정부지원사업_주관기관_정보

| Field | Detail |
|-------|--------|
| **Korean Name** | 창업진흥원_정부지원사업_주관기관_정보 |
| **English Name** | KISED - Government Support Project Implementing Organization Info |
| **Dataset ID** | 15125366 |
| **Portal URL** | https://www.data.go.kr/data/15125366/openapi.do |
| **Type** | REST API |

**Data Provided:**
- Implementing organizations for various startup support projects
- Organization types: private companies, associations, public institutions

**build.up Usage:**
- **Organization directory**: Connect users with implementing agencies for support programs

---

### 5-E. 창업진흥원_정부지원사업_중복수행_여부조회(당해년도)

| Field | Detail |
|-------|--------|
| **Korean Name** | 창업진흥원_정부지원사업_중복수행_여부조회(당해년도) |
| **English Name** | KISED - Government Support Project Duplicate Participation Check (Current Year) |
| **Dataset ID** | 15125367 |
| **Portal URL** | https://www.data.go.kr/data/15125367/openapi.do |
| **Type** | REST API |
| **Access** | Restricted - formal application required (not for private use) |

**Data Provided:**
- Check if a startup is already participating in a government support project
- Prevents duplicate support

**build.up Usage:**
- **Eligibility check**: Before applying, check if user is already in another program
- **Application advisor**: Guide users on which programs they can still apply for

---

### 5-F. 중소벤처기업부_중소기업지원사업목록 (File Data)

| Field | Detail |
|-------|--------|
| **Korean Name** | 중소벤처기업부_중소기업지원사업목록 |
| **English Name** | MSS - SME Support Project List |
| **Dataset ID** | 3034791 |
| **Portal URL** | https://www.data.go.kr/data/3034791/fileData.do |
| **Type** | File download (auto-converted to REST API) |
| **Last Updated** | 2025-03-31 |

**Data Provided:**
- Comprehensive list of SME support projects from central + local governments
- **8 categories**: Finance (금융), Technology (기술), Human Resources (인력), Export (수출), Domestic Consumption (내수), Startups (창업), Management (경영), Others (기타)
- Fields: project name, application start/end date, responsible agency, implementing agency, receiving agency

**build.up Usage:**
- **Master support program database**: The most comprehensive list of all SME support programs
- **Category filtering**: Match programs to user needs by category
- **Calendar integration**: Application period tracking

---

### 5-G. 행정안전부_대한민국 공공서비스(혜택) 정보

| Field | Detail |
|-------|--------|
| **Korean Name** | 행정안전부_대한민국 공공서비스(혜택) 정보 |
| **English Name** | MOIS - Republic of Korea Public Service (Benefits) Information |
| **Provider** | 행정안전부 / 정부24 (Government 24) |
| **Dataset ID** | 15113968 |
| **Portal URL** | https://www.data.go.kr/data/15113968/openapi.do |
| **Type** | REST API |

**Data Provided:**
- Service ID, beneficiary categories
- Subsidy business classifications (보조금 사업 분류)
- Service names, related laws
- Guidance information, application procedures
- Selection criteria, support details
- Online application URLs

**build.up Usage:**
- **Government benefits discovery**: Show ALL government services/benefits a business owner may be eligible for
- **Beyond business-specific**: Includes personal benefits for entrepreneurs too
- **Direct application links**: Route users to apply online

---

### 5-H. 기획재정부_국고보조금 정보

| Field | Detail |
|-------|--------|
| **Korean Name** | 기획재정부_국고보조금 정보 |
| **English Name** | MOEF - Government Treasury Subsidy Information |
| **Provider** | 기획재정부 (Ministry of Economy and Finance) |
| **Dataset ID** | 15097584 |
| **Portal URL** | https://www.data.go.kr/data/15097584/openapi.do |
| **Endpoint** | `http://apis.data.go.kr/1051000/MoefOpenAPI/T_OPD_PRMSCT_SBBGST` |
| **Type** | REST API |
| **Rate Limit** | Dev: 10,000; Prod: increase on request |

**Data Provided:**
- Government subsidy (국고보조금) information
- Subsidies from the national government to local governments and private sector
- Project details for subsidy utilization

**build.up Usage:**
- **Subsidy discovery**: Find available government subsidies
- **Financial planning**: Include potential subsidies in business financial projections

---

### 5-I. 기획재정부_국고보조금 집행 및 보조사업 현황

| Field | Detail |
|-------|--------|
| **Korean Name** | 기획재정부_국고보조금 집행 및 보조사업 현황 |
| **English Name** | MOEF - Treasury Subsidy Execution & Subsidy Project Status |
| **Dataset ID** | 15126793 |
| **Portal URL** | https://www.data.go.kr/data/15126793/openapi.do |
| **Type** | REST API |

---

### 5-J. 창업진흥원_창업공간플랫폼(창업공간)_조회서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 창업진흥원_창업공간플랫폼(창업공간)_조회서비스 |
| **English Name** | KISED - Startup Space Platform (Startup Spaces) Inquiry Service |
| **Dataset ID** | 15125365 |
| **Portal URL** | https://www.data.go.kr/data/15125365/openapi.do |
| **Type** | REST API |

**Data Provided:**
- Government-supported startup spaces nationwide
- Office rental information, meeting room reservations
- Detailed center information

**build.up Usage:**
- **Workspace finder**: Help entrepreneurs find affordable government-supported office spaces
- **Cost savings**: Show alternatives to expensive commercial leases
- **Resource access**: Meeting rooms, shared facilities

---

### 5-K. Bizinfo 기업마당 API (External)

| Field | Detail |
|-------|--------|
| **Korean Name** | 기업마당 지원사업정보 API |
| **English Name** | Bizinfo - Support Project Information API |
| **Provider** | 중소벤처기업부 via bizinfo.go.kr |
| **Portal URL** | https://www.bizinfo.go.kr/web/lay1/program/S1T175C174/apiList.do |
| **API Detail** | https://www.bizinfo.go.kr/web/lay1/program/S1T175C174/apiDetail.do?id=bizinfoApi |
| **Type** | REST API |

**Data Provided:**
- Support project announcements from central government, local governments, and affiliated agencies
- Event information (행사정보)
- Policy news (정책뉴스)
- Legislation/administrative notices
- Fields: title, body content, source, registration date, detail link URL

**build.up Usage:**
- **Aggregated policy feed**: Single source for all SME-related government announcements
- **News/event alerts**: Keep users informed about policy changes

---

## 6. Tax & Finance (세금/재무)

### 6-A. 국세청_세무일정 (File Data)

| Field | Detail |
|-------|--------|
| **Korean Name** | 국세청_세무일정 |
| **English Name** | NTS - Tax Schedule/Calendar |
| **Provider** | 국세청 (National Tax Service) |
| **Dataset ID** | 15101035 |
| **Portal URL** | https://www.data.go.kr/data/15101035/fileData.do |
| **Type** | File download (auto-converted to REST API) |
| **Last Updated** | 2025-01-01 |

**Data Provided:**
- Annual tax schedule with all deadlines
- VAT (부가가치세) reporting/payment dates
- Comprehensive income tax (종합소득세) deadlines (May 1-31, or June 30 for confirmed filers)
- Corporate tax, withholding tax deadlines
- Special provisions: deadlines on holidays/Saturdays extend to next business day

**build.up Usage:**
- **Tax calendar**: Automated tax deadline reminders in the app
- **Compliance alerts**: Push notifications before tax filing deadlines
- **Financial planning**: Integrate tax payment dates into cash flow planning

---

### 6-B. 국세청_연도별 및 세목별 세수 현황

| Field | Detail |
|-------|--------|
| **Korean Name** | 국세청_연도별 및 세목별 세수 현황 |
| **English Name** | NTS - Annual Tax Revenue Status by Tax Type |
| **Dataset ID** | 15113680 |
| **Portal URL** | https://www.data.go.kr/data/15113680/fileData.do |
| **Type** | File download |

---

### 6-C. 국세청_종합소득세 확정신고 인원 현황

| Field | Detail |
|-------|--------|
| **Korean Name** | 국세청_종합소득세 확정신고 인원 현황 |
| **English Name** | NTS - Comprehensive Income Tax Final Filing Status |
| **Dataset ID** | 3036449 |
| **Portal URL** | https://www.data.go.kr/data/3036449/fileData.do |
| **Type** | File download |

---

## 7. Real Estate & Rent Data (부동산/임대)

### 7-A. 국토교통부_상업업무용 부동산 매매 실거래가 자료

| Field | Detail |
|-------|--------|
| **Korean Name** | 국토교통부_상업업무용 부동산 매매 실거래가 자료 |
| **English Name** | MOLIT - Commercial/Office Real Estate Sales Transaction Price Data |
| **Provider** | 국토교통부 (Ministry of Land, Infrastructure and Transport) |
| **Dataset ID** | 15126463 |
| **Portal URL** | https://www.data.go.kr/data/15126463/openapi.do |
| **Type** | REST API |
| **Auth** | Service key required |

**Key Parameters:**
- Administrative code (법정동코드 first 5 digits, e.g., 11110 for Seoul Jongno-gu)
- Contract year-month (e.g., 202601)

**Data Provided:**
- Actual transaction prices for commercial/office properties
- Based on Real Estate Transaction Report Act
- Transaction date, price, property details, area

**build.up Usage:**
- **Property price intelligence**: Show actual purchase prices for commercial spaces
- **Market trends**: Track price changes over time by district
- **Investment analysis**: Help entrepreneurs evaluate property purchase vs. lease

---

### 7-B. 한국부동산원_상업용부동산 임대동향 조사 통계 조회 서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 한국부동산원_상업용부동산 임대동향 조사 통계 조회 서비스 |
| **English Name** | Korea Real Estate Board - Commercial Real Estate Rental Trend Survey Statistics |
| **Provider** | 한국부동산원 (Korea Real Estate Board, REB) |
| **Dataset ID** | 15099345 |
| **Portal URL** | https://www.data.go.kr/data/15099345/openapi.do |
| **Type** | REST API |

**Data Provided:**
- Commercial real estate rental trend surveys
- Quarterly regional rental rates for small-scale commercial buildings (소규모상가)
- Units: thousand won/sqm (천원/㎡)

**build.up Usage:**
- **Rent benchmarking**: Show average commercial rents by region
- **Financial planning**: Realistic rent estimates for business plans
- **Trend analysis**: Track rent changes over quarters

---

### 7-C. 한국부동산원_부동산통계 조회 서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 한국부동산원_부동산통계 조회 서비스 |
| **English Name** | Korea Real Estate Board - Real Estate Statistics Inquiry Service |
| **Provider** | 한국부동산원 |
| **Dataset ID** | 15134761 |
| **Portal URL** | https://www.data.go.kr/data/15134761/openapi.do |
| **Type** | REST API |

**Data Provided:**
- National land price change surveys (전국지가변동률조사)
- National housing price trend surveys (전국주택가격동향조사)
- Multi-family housing transaction price indices
- Commercial real estate rental trend surveys (상업용부동산 임대동향조사)

**build.up Usage:**
- **Comprehensive real estate intelligence**: One API for multiple real estate statistics
- **Location cost analysis**: Integrate into commercial district analysis

---

### 7-D. 한국부동산원_상업용부동산 임대동향조사_임대정보 (File Data)

| Field | Detail |
|-------|--------|
| **Korean Name** | 한국부동산원_상업용부동산 임대동향조사_임대정보_분기별 지역별 임대료(소규모상가) |
| **English Name** | REB - Commercial Real Estate Rental Trend - Quarterly Regional Rental Rates (Small Commercial) |
| **Dataset ID** | 15069766 |
| **Portal URL** | https://www.data.go.kr/data/15069766/fileData.do |
| **Type** | File download |
| **Last Updated** | 2025-03-31 |

**Data Provided:**
- Quarterly rental rates by region for small commercial buildings
- Historical trend data

---

## 8. Demographics (인구통계)

### 8-A. 행정안전부_도로명별 주민등록 인구 및 세대현황

| Field | Detail |
|-------|--------|
| **Korean Name** | 행정안전부_도로명별 주민등록 인구 및 세대현황 |
| **English Name** | MOIS - Road Name-based Resident Registration Population & Household Status |
| **Provider** | 행정안전부 |
| **Dataset ID** | 15108092 |
| **Portal URL** | https://www.data.go.kr/data/15108092/openapi.do |
| **Endpoint** | `http://apis.data.go.kr/1741000/rnPpltnHhStus/selectRnPpltnHhStus` |
| **Type** | REST API |
| **Rate Limit** | Dev: 10,000 requests; Prod: increase on request |

**Data Provided:**
- Province name (시도명)
- City/county/district name (시군구명)
- Road name (도로명)
- Total population (총인구수)
- Number of households (세대수)
- Population per household (세대당 인구)
- Male population (남자인구수)
- Female population (여자인구수)
- Male-to-female ratio (남녀비율)

**build.up Usage:**
- **Micro-level population data**: Population at the road/street level for precise location analysis
- **Target market sizing**: Count potential customers in specific streets/areas
- **Gender-based analysis**: Important for businesses targeting specific demographics

---

### 8-B. 행정안전부_법정동별(행정동 통반단위) 주민등록 인구 및 세대현황

| Field | Detail |
|-------|--------|
| **Korean Name** | 행정안전부_법정동별(행정동 통반단위) 주민등록 인구 및 세대현황 |
| **English Name** | MOIS - Legal-dong (Admin-dong Tong/Ban Unit) Population & Household Status |
| **Dataset ID** | 15108071 |
| **Portal URL** | https://www.data.go.kr/data/15108071/openapi.do |
| **Type** | REST API |

**Data Provided:**
- City/province name, city/district name, legal dong name
- Administrative organization code, administrative dong name
- Total population, number of households, population per household
- Male population, female population

**build.up Usage:**
- **Neighborhood-level targeting**: Very granular demographic data
- **Commercial district correlation**: Combine with commercial district data for complete picture

---

### 8-C. 행정안전부_통계연보_지역별 주민등록인구

| Field | Detail |
|-------|--------|
| **Korean Name** | 행정안전부_통계연보_지역별 주민등록인구 |
| **English Name** | MOIS - Statistical Yearbook Regional Population |
| **Dataset ID** | 15107303 |
| **Portal URL** | https://www.data.go.kr/data/15107303/openapi.do |
| **Type** | REST API |

---

### 8-D. 행정안전부_지역별 연령별 주민등록 인구현황 (File Data)

| Field | Detail |
|-------|--------|
| **Korean Name** | 행정안전부_지역별 연령별 주민등록 인구현황 |
| **English Name** | MOIS - Regional Age-based Resident Population Status |
| **Dataset ID** | 3033304 |
| **Portal URL** | https://www.data.go.kr/data/3033304/fileData.do |
| **Type** | File download |
| **Last Updated** | 2025-04-30 |

**Data Provided:**
- Population by region (시도/시군구/읍면동)
- Age brackets: 1-year, 5-year, 10-year intervals
- Updated monthly

**build.up Usage:**
- **Age-based targeting**: Critical for businesses serving specific age groups (e.g., kids, elderly)
- **Demographic shift tracking**: Monitor aging/rejuvenation trends by area

---

### 8-E. 행정안전부_지역별(행정동) 성별 연령별 주민등록 인구수

| Field | Detail |
|-------|--------|
| **Korean Name** | 행정안전부_지역별(행정동) 성별 연령별 주민등록 인구수 |
| **English Name** | MOIS - Regional (Admin-dong) Gender/Age Population Count |
| **Dataset ID** | 15097972 |
| **Portal URL** | https://www.data.go.kr/data/15097972/fileData.do |
| **Type** | File download |
| **Last Updated** | 2025-11-30 |

**Data Provided:**
- Administrative dong-level population by gender and age

---

### 8-F. 행정안전부_지역별 주민등록 인구 평균연령

| Field | Detail |
|-------|--------|
| **Korean Name** | 행정안전부_지역별 주민등록 인구 평균연령 |
| **English Name** | MOIS - Regional Average Age of Registered Population |
| **Dataset ID** | 3033255 |
| **Portal URL** | https://www.data.go.kr/data/3033255/fileData.do |
| **Type** | File download |
| **Last Updated** | 2025-04-30 |

---

## 9. Industry Statistics (산업통계)

### 9-A. 통계청/국가데이터처_SGIS(통계지리정보) 오픈플랫폼

| Field | Detail |
|-------|--------|
| **Korean Name** | 국가데이터처_SGIS(통계지리정보) |
| **English Name** | National Data Agency - SGIS (Statistical Geographic Information System) |
| **Provider** | 국가데이터처 (formerly 통계청, Statistics Korea) |
| **Dataset ID** | 15021230 |
| **Portal URL** | https://www.data.go.kr/data/15021230/openapi.do |
| **Developer Portal** | https://sgis.mods.go.kr/developer/html/main.html |
| **Type** | REST API (Map API + Data API + Mobile SDK) |
| **Auth** | SGIS authentication key required |

**Data Provided:**
- **Map API**: Geographic map services
- **Data API**: Population, household, housing, and business establishment data from census
- **Key Statistics**:
  - Census data (인구총조사)
  - Annual business establishment census surveys (사업체조사)
  - Primary value-added content based on census data
  - Startup and residential area analysis

**build.up Usage:**
- **Business establishment density**: Map businesses by type and location
- **Population overlay**: Combine demographics with business data on maps
- **Startup ecosystem mapping**: Identify startup concentration areas
- **Geographic intelligence**: Visual map-based analytics for location decisions

---

### 9-B. 통계청_SGIS오픈플랫폼_활용서비스(업종별)

| Field | Detail |
|-------|--------|
| **Korean Name** | 통계청_SGIS오픈플랫폼_활용서비스(업종별) |
| **English Name** | Statistics Korea SGIS - Utilization Service (by Business Type) |
| **Dataset ID** | 15072574 |
| **Portal URL** | https://www.data.go.kr/data/15072574/openapi.do |
| **Type** | REST API |

**Data Provided:**
- Statistical thematic map services
- Neighborhood life business types (생활업종)
- Business type to residential population ratio ranking
- Fields: province name, city/county name, theme name, business type ratio

**build.up Usage:**
- **Business-to-population ratio**: Critical metric for market sizing
- **Underserved area identification**: Find areas with low business-to-population ratios
- **Industry density heat maps**: Visual analytics by business type

---

### 9-C. 통계청_SGIS_생활업종시군구업체대비거주인수순위

| Field | Detail |
|-------|--------|
| **Korean Name** | 통계청_SGIS_생활업종시군구업체대비거주인수순위 |
| **English Name** | SGIS - Life Business Type City/District Business vs Resident Population Ranking |
| **Dataset ID** | 15144329 |
| **Portal URL** | https://www.data.go.kr/data/15144329/fileData.do |
| **Type** | File download |

---

### 9-D. 산업연구원_ISTANS_산업별 통계

| Field | Detail |
|-------|--------|
| **Korean Name** | 산업연구원_ISTANS_산업별 통계 |
| **English Name** | KIET ISTANS - Industry Statistics |
| **Provider** | 산업연구원 (Korea Institute for Industrial Economics & Trade) |
| **Dataset ID** | 15090596 |
| **Portal URL** | https://www.data.go.kr/data/15090596/fileData.do |
| **Type** | File download |

**Data Provided:**
- Statistics organized by 40 major manufacturing industries and 20 major service industries
- Covers sectors: automobiles, shipbuilding, retail, publishing, etc.

**build.up Usage:**
- **Industry benchmarks**: Compare user's business performance to industry averages
- **Market size data**: Understand total addressable market by industry

---

### 9-E. 중소벤처기업부_벤처기업명단 (File Data)

| Field | Detail |
|-------|--------|
| **Korean Name** | 중소벤처기업부_벤처기업명단 |
| **English Name** | MSS - Venture Company List |
| **Dataset ID** | 15084581 |
| **Portal URL** | https://www.data.go.kr/data/15084581/fileData.do |
| **Type** | File download |
| **Last Updated** | 2025-02-28 |

**Data Provided:**
- List of all registered venture companies in Korea

---

## 10. E-Commerce Registration (통신판매업)

### 10-A. 공정거래위원회_통신판매사업자 등록상세 제공 서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 공정거래위원회_통신판매사업자 등록상세 제공 서비스 |
| **English Name** | FTC - Telecom Sales Business Registration Detail Service |
| **Provider** | 공정거래위원회 |
| **Dataset ID** | 15126315 |
| **Portal URL** | https://www.data.go.kr/data/15126315/openapi.do |
| **Type** | REST API |

**Data Provided:**
- Detailed information on registered telecom sales businesses
- Corporate name, business registration number, notification date
- Query by: business registration number, business name, business status

**build.up Usage:**
- **E-commerce validation**: Verify e-commerce registration for online businesses
- **Competitor research**: Search for online competitors in specific sectors

---

### 10-B. 공정거래위원회_통신판매사업자 등록현황 제공 서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 공정거래위원회_통신판매사업자 등록현황 제공 서비스 |
| **English Name** | FTC - Telecom Sales Business Registration Status Service |
| **Dataset ID** | 15126311 |
| **Portal URL** | https://www.data.go.kr/data/15126311/openapi.do |
| **Type** | REST API |

---

### 10-C. 공정거래위원회_통신판매사업자 등록현황 통계 제공 서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 공정거래위원회_통신판매사업자 등록현황 통계 제공 서비스 |
| **English Name** | FTC - Telecom Sales Business Registration Statistics Service |
| **Dataset ID** | 15126322 |
| **Portal URL** | https://www.data.go.kr/data/15126322/openapi.do |
| **Type** | REST API |

---

## 11. Building Registry (건축물대장)

### 11-A. 국토교통부_건축HUB_건축물대장정보 서비스

| Field | Detail |
|-------|--------|
| **Korean Name** | 국토교통부_건축HUB_건축물대장정보 서비스 |
| **English Name** | MOLIT - Building HUB Building Registry Information Service |
| **Provider** | 국토교통부 |
| **Dataset ID** | 15134735 |
| **Portal URL** | https://www.data.go.kr/data/15134735/openapi.do |
| **Type** | REST API (JSON/XML) |

**Data Provided (표제부 - Title Section):**
- Location (대지위치), administrative codes
- Building name (건물명)
- Land area (대지면적), building area (건축면적), total floor area (연면적)
- Building coverage ratio (건폐율), floor area ratio (용적률)
- Structure code (구조코드), main use code (주용도코드)
- Number of stories (지상층수/지하층수)
- Number of households/units (세대수/가구수)
- Elevator count (승용승강기수)

**build.up Usage:**
- **Store space evaluation**: Check building use, area, and structure for a potential commercial space
- **Zoning compliance**: Verify a building's approved use matches the intended business
- **Lease negotiation data**: Know the exact floor area before signing

---

## 12. Implementation Priority Matrix

### Tier 1 - Must-Have (Launch Critical)

| API | Reason | Integration Complexity |
|-----|--------|----------------------|
| **1-A. 상가(상권)정보 API** | Core feature - location/market analysis | Medium |
| **3-A. 사업자등록 진위확인/상태조회** | User verification, trust infrastructure | Low |
| **5-A. K-Startup 조회서비스** | Core feature - support program matching | Low |
| **5-F. 중소기업지원사업목록** | Master database for support programs | Low |
| **6-A. 국세청 세무일정** | Tax deadline reminders | Low |
| **8-A. 도로명별 인구 및 세대현황** | Population data for location analysis | Low |

### Tier 2 - High Value (Month 2-3)

| API | Reason | Integration Complexity |
|-----|--------|----------------------|
| **2-A~C. 가맹정보 정보공개서** | Franchise analysis feature | Medium |
| **2-D. 브랜드별 가맹점 현황** | Franchise comparison dashboard | Medium |
| **2-E. 브랜드 지역별 평균매출** | Franchise revenue benchmarks | Medium |
| **4-A. LOCALDATA 인허가데이터** | Permit checklist by business type | High |
| **5-B. 중소벤처24 공고정보** | Additional support program source | Low |
| **5-G. 공공서비스(혜택) 정보** | Government benefits discovery | Low |
| **7-B. 상업용부동산 임대동향** | Rent benchmarking | Medium |

### Tier 3 - Enhancement (Month 4-6)

| API | Reason | Integration Complexity |
|-----|--------|----------------------|
| **1-F. 서울 상권분석서비스** | Deep Seoul-specific analysis | Medium |
| **5-H. 국고보조금 정보** | Subsidy discovery | Low |
| **5-J. 창업공간플랫폼** | Workspace finder feature | Low |
| **7-A. 상업용 부동산 실거래가** | Property price intelligence | Medium |
| **9-A. SGIS 통계지리정보** | Map-based analytics | High |
| **9-B. SGIS 업종별 활용서비스** | Business-to-population ratios | Medium |
| **11-A. 건축물대장정보** | Building details for lease evaluation | Medium |

### Tier 4 - Nice-to-Have (Month 6+)

| API | Reason | Integration Complexity |
|-----|--------|----------------------|
| **1-B~D. 소상공인365 상권분석** | Additional commercial data | Low |
| **2-F~K. Additional franchise APIs** | Complete franchise intelligence | Medium |
| **3-B. 창업기업확인서** | Startup certification display | Low |
| **8-D~F. Additional demographics** | Age-specific population data | Low |
| **9-D. ISTANS 산업통계** | Industry benchmarks | Low |
| **10-A~C. 통신판매사업자** | E-commerce business verification | Low |

---

## 13. General API Access Notes

### Authentication
- **All data.go.kr APIs require a free account** at https://www.data.go.kr
- Register, apply for each API individually
- Receive a `serviceKey` (URL-encoded) for each approved API
- Some APIs use the `api.odcloud.kr` endpoint with Authorization header
- Most use `apis.data.go.kr` with serviceKey query parameter

### Rate Limits
- **Development accounts**: Typically 10,000 requests (some vary)
- **Production accounts**: Can request traffic increase by registering usage cases
- **NTS Business Registration API**: 1,000,000/day (generous)
- **SEMAS Commercial District API**: 30 TPS

### Response Formats
- Most APIs support both JSON and XML
- Default is usually XML; specify `type=json` or `_type=json` for JSON
- File data on data.go.kr is auto-converted to REST API (JSON/XML)

### Approval Process
- Most APIs: **Auto-approved** for development accounts
- Some restricted APIs (e.g., 중복수행 여부조회): Require formal application
- Typical approval time: Instant to 3 business days

### Important Notes
- LOCALDATA (localdata.go.kr) is being **merged into data.go.kr** as of 2026-04-15
- Seoul-specific data is available on data.seoul.go.kr (separate portal, separate API keys)
- SGIS requires its own authentication key from sgis.mods.go.kr
- Bizinfo (bizinfo.go.kr) has its own separate API system
- API documentation available via Swagger UI on each API's detail page

### Recommended Client Libraries
- **PublicDataReader** (Python): https://github.com/WooilJeong/PublicDataReader - Wraps many data.go.kr APIs
- For Node.js/TypeScript: Use standard `fetch` or `axios` with service key

---

## Summary: Total APIs/Datasets Found

| Category | REST APIs | File Datasets | Total |
|----------|-----------|---------------|-------|
| Commercial District/Market | 2 | 4 | 6 |
| Franchise Information | 11 | 0 | 11 |
| Business Registration | 2 | 0 | 2 |
| Business Permits/Licenses | 1 (+localdata) | 2 | 3+ |
| Government Support Programs | 7 | 2 | 9 |
| Tax/Finance | 0 | 3 | 3 |
| Real Estate/Rent | 3 | 1 | 4 |
| Demographics | 3 | 3 | 6 |
| Industry Statistics | 2 | 3 | 5 |
| E-Commerce Registration | 3 | 0 | 3 |
| Building Registry | 1 | 0 | 1 |
| **TOTAL** | **35+** | **18** | **53+** |

Plus external APIs: Seoul Open Data Plaza (6 sub-datasets), Bizinfo API, SGIS Developer API.

---

## Sources

- [소상공인시장진흥공단_상가(상권)정보 API](https://www.data.go.kr/data/15012005/openapi.do)
- [소상공인시장진흥공단_소상공인365_상권분석](https://www.data.go.kr/data/15143517/fileData.do)
- [소상공인시장진흥공단_소상공인365_배달상권](https://www.data.go.kr/data/15151045/fileData.do)
- [소상공인시장진흥공단_소상공인365_성장상권](https://www.data.go.kr/data/15151047/fileData.do)
- [전국주요상권현황 표준데이터](https://www.data.go.kr/data/15029180/standard.do)
- [서울시 상권분석서비스(추정매출-상권)](https://data.seoul.go.kr/dataList/OA-15572/S/1/datasetView.do)
- [공정거래위원회_가맹정보_정보공개서_목록_조회](https://www.data.go.kr/data/15125569/openapi.do)
- [공정거래위원회_가맹정보_정보공개서_본문_조회](https://www.data.go.kr/data/15125571/openapi.do)
- [공정거래위원회_가맹정보_브랜드별 가맹점 현황](https://www.data.go.kr/data/15110241/openapi.do)
- [공정거래위원회_페어데이터_브랜드 지역별 가맹점 평균 매출액](https://www.data.go.kr/data/15143709/openapi.do)
- [공정거래위원회_페어데이터_브랜드_지역별 가맹점 계약상태정보](https://www.data.go.kr/data/15143694/openapi.do)
- [공정거래위원회_페어데이터_브랜드별 가맹점/직영점 집계 및 평균매출](https://www.data.go.kr/data/15143710/openapi.do)
- [공정거래위원회_가맹정보_지역별 업종별 가맹점수 현황](https://www.data.go.kr/data/15125527/openapi.do)
- [공정거래위원회_가맹정보_업종별 가맹점 변동현황](https://www.data.go.kr/data/15125524/openapi.do)
- [공정거래위원회_가맹정보_주요 업종별 가맹점수 현황](https://www.data.go.kr/data/15110399/openapi.do)
- [국세청_사업자등록정보 진위확인 및 상태조회 서비스](https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15081808)
- [창업진흥원_창업기업확인서발급기업정보_조회서비스](https://www.data.go.kr/data/15125362/openapi.do)
- [LOCALDATA - 지방행정인허가데이터개방](https://www.localdata.go.kr/)
- [전국일반음식점 표준데이터](https://www.data.go.kr/data/15096283/standard.do)
- [창업진흥원_K-Startup 조회서비스](https://www.data.go.kr/data/15125364/openapi.do)
- [중소기업기술정보진흥원_중소벤처24 공고정보](https://www.data.go.kr/data/15113191/openapi.do)
- [중소벤처기업부_사업공고](https://www.data.go.kr/data/15113297/openapi.do)
- [창업진흥원_정부지원사업_주관기관_정보](https://www.data.go.kr/data/15125366/openapi.do)
- [창업진흥원_정부지원사업_중복수행_여부조회](https://www.data.go.kr/data/15125367/openapi.do)
- [중소벤처기업부_중소기업지원사업목록](https://www.data.go.kr/data/3034791/fileData.do)
- [행정안전부_대한민국 공공서비스(혜택) 정보](https://www.data.go.kr/data/15113968/openapi.do)
- [기획재정부_국고보조금 정보](https://www.data.go.kr/data/15097584/openapi.do)
- [기획재정부_국고보조금 집행 및 보조사업 현황](https://www.data.go.kr/data/15126793/openapi.do)
- [창업진흥원_창업공간플랫폼_조회서비스](https://www.data.go.kr/data/15125365/openapi.do)
- [기업마당 지원사업정보 API](https://www.bizinfo.go.kr/web/lay1/program/S1T175C174/apiDetail.do?id=bizinfoApi)
- [국세청_세무일정](https://www.data.go.kr/data/15101035/fileData.do)
- [국토교통부_상업업무용 부동산 매매 실거래가 자료](https://www.data.go.kr/data/15126463/openapi.do)
- [한국부동산원_상업용부동산 임대동향 조사 통계 조회 서비스](https://www.data.go.kr/data/15099345/openapi.do)
- [한국부동산원_부동산통계 조회 서비스](https://www.data.go.kr/data/15134761/openapi.do)
- [한국부동산원_상업용부동산 임대동향조사_임대정보](https://www.data.go.kr/data/15069766/fileData.do)
- [행정안전부_도로명별 주민등록 인구 및 세대현황](https://www.data.go.kr/data/15108092/openapi.do)
- [행정안전부_법정동별 주민등록 인구 및 세대현황](https://www.data.go.kr/data/15108071/openapi.do)
- [행정안전부_지역별 연령별 주민등록 인구현황](https://www.data.go.kr/data/3033304/fileData.do)
- [국가데이터처_SGIS(통계지리정보)](https://www.data.go.kr/data/15021230/openapi.do)
- [통계청_SGIS오픈플랫폼_활용서비스(업종별)](https://www.data.go.kr/data/15072574/openapi.do)
- [산업연구원_ISTANS_산업별 통계](https://www.data.go.kr/data/15090596/fileData.do)
- [공정거래위원회_통신판매사업자 등록상세 제공 서비스](https://www.data.go.kr/data/15126315/openapi.do)
- [국토교통부_건축HUB_건축물대장정보 서비스](https://www.data.go.kr/data/15134735/openapi.do)
- [PublicDataReader (Python library)](https://github.com/WooilJeong/PublicDataReader)
- [SGIS 개발지원센터](https://sgis.mods.go.kr/developer/html/main.html)
