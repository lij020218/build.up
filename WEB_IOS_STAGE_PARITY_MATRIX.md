# 웹 ↔ iOS 로드맵 48단계 정밀 비교 매트릭스

> 작성: 2026-06-03. 목적: 웹·앱 콘텐츠 통일(=양 플랫폼 장점 합치기) + 플랫폼별 네이티브 UI/UX 설계의 기준 문서.
> 전제: 48개 stageId·디스패처는 양쪽 **동일**. 차이는 **단계별 콘텐츠 깊이**.

## 0. 한눈에 보는 결론 (전 단계 공통 패턴)

| | 강점 | 약점 |
|---|---|---|
| **웹** | "왜·얼마나 중요한가" 내러티브 — 정량 리스크(손실액·벌금·페널티), 업종별 추천, 벤더/플랫폼 카탈로그, 리드타임 캘린더, 데이터 출처, 함정 시나리오, **업종별 "유리한 길" 전략 카드** | 실행 도구(계산기) 일부 부재, 한국 규제 세부 일부 누락 |
| **iOS** | 실행 — 계산기(4대보험·BEP·런웨이), 한국 규제 디테일(위생교육·원산지·정화조), 정산 수수료 실수치, 인터랙티브 체크리스트·토글, 시간별 스크립트, 네이티브 UX(휠 피커·확장행·시트·햅틱), 1인 사장님 엣지케이스, 서버 즉시 동기화 | **"왜·어떻게 해야 유리한가" 교육 내러티브가 체계적으로 얇음** (= 사용자 핵심 불만) |

**통합 명제**: iOS는 대부분의 단계에서 웹의 *교육 내러티브(이유·정량 스테이크·유리한 길 전략·벤더/데이터 맥락)* 가 빠져 "체크리스트만 있는 느낌". 반대로 웹은 iOS의 *계산기·규제 디테일·실행 도구* 일부가 없음. → **양방향으로 장점을 합치되, 각 플랫폼 네이티브 UI로 렌더.**

## 1. 갭 심각도 분류 (iOS 교육 콘텐츠 격차 기준)

- 🔴 **HIGH** (iOS 체크리스트 위주, 웹의 why/전략 대거 누락): platform-setup, online-registration, sourcing-setup, store-setup, online-marketing, hiring-setup, insurance-tax-setup, operations-setup, registration-setup, construction-setup, vendor-setup, permit-check(협상카드), contract-review(현장·AI), 하드웨어/딥테크 12단계(웹 출처·정량데이터)
- 🟡 **MED** (구조 유사, 웹 프레임워크/데이터가 더 깊음): startup-foundation, customer-discovery, company-setup, mvp-build, launch-gtm, go-live, growth-engine, fundraising-readiness, venture-certification, menu-design, tax-guide, loan-guide, financial-review, pre-launch, pre-launch-final, startup-type, business-model
- 🟢 **LOW / 이미 패리티**: location-candidates(완료), target-customer-definition, biz-registration, industry-selection, budget-setup(주석만 차이)

---

## 2. 단계별 매트릭스

### 클러스터: 공통·선택

**industry-selection** 🟢
- 웹/iOS 거의 동일(업종 탭+그리드+세부). 웹-only: 선택→클러스터→후속경로 미리보기. iOS-only: 동일.
- 통합: iOS에 "이 선택이 이후 단계 경로를 결정" 미리보기 한 줄 추가.

**startup-type** 🟡
- 웹-only: 폐점률 임계값("폐점률 20%↑ 브랜드 회피, 점주 평균 5년 미만 위험") + 폐업률 링크.
- iOS-only: 5축 점수 막대그래프(수익성/안정성/접근성/브랜드/지원) 시각화, 확장행 비용.
- 통합: iOS에 폐점률 임계 경고 추가; 웹에 5축 막대그래프 채택.

**business-model** 🟡
- 거의 동일(수익모델·배달 하이브리드 주의). iOS-only: 휠 피커 영업시간(네이티브).
- 통합: 양쪽 "주 N시간(주52시간 검토)" 요약 인라인.

**target-customer-definition** 🟢
- 3페이지(Why/Define/Verify) 동일. iOS-only: DataPointRow 정렬 보정, "필수 3개 중 N" 진행.
- 통합: 웹에 진행 표시 추가.

**budget-setup** 🟢(주석만)
- 동일. 웹-only: STARTUP_MATRIX 12×4 검증 출처 주석. iOS-only: 비동기 펀딩 로드 + 시트.
- 통합: 사용자 표시 콘텐츠는 이미 동일(주석은 개발용). 조치 불필요 수준.

**menu-design** 🟡
- 동일(클러스터별 Prime Cost 황금률). 웹-only: 4페이지(랩업). iOS: 3페이지.
- 통합: iOS에 cost-check→wrapup 전환 명시.

**franchise-application** 🟢
- 동일(정보공개서·14일 숙려·가맹점 방문 + 10 체크포인트). iOS-only: 인카드 체크박스+진행뱃지.
- 통합: 웹에 인카드 체크박스 UX 채택(선택).

### 클러스터: 오프라인 코어

**permit-check** 🔴
- 웹-only: **업종별 협상 카드**(빠진 항목=임대인 협상카드, 업종별 근거), 실시간 인허가 생존율 데이터, 업종별 확장 체크리스트.
- iOS-only: StatBox("70% 사전점검 안 함"), 깔끔한 phase-gate.
- 통합: iOS에 업종별 협상 전략 카드 + (가능시) 생존율 데이터 추가.

**contract-review** 🔴
- 웹-only: **현장 방문 절차**(영상+옆가게 30초 인터뷰=리스크 80% 차단), 근저당 부도위험 계산식(근저당÷시세), 업종별 특약 협상 카드, **AI 계약문 분석 UI**, 확정일자 1일 지연 후순위 경고.
- iOS-only: 절대금지 조항 페이지, 후속액션(사진·사본·전입신고) 인라인, 9체크+서명 2-gate.
- 통합: iOS에 현장방문 절차 + 근저당 계산식 + 업종별 특약 카드 추가(AI는 후속).

**registration-setup** 🔴→🟡
- 웹-only: 법적 결과 3점(미등록=3년/3천만원), 운영 인프라 전제, 순차 강조(색상 위계).
- iOS-only: 4페이지 위저드 + "유리한 길"(과세전략) 확장.
- 통합: iOS에 법적 결과 정량(벌칙) 명시; 웹에 과세전략 모듈.

**biz-registration** 🟢
- 거의 동일(이전결정 요약+상호명+통장4). iOS-only: 업종별 placeholder, 토글 즉시 서버저장.
- 통합: 조치 경미.

**construction-setup** 🔴
- 웹-only: 53개 세부업종 디자인 언어 + 컨셉별 자재 스펙(왜 이 자재가 맞는지, 2025 트렌드/Pantone).
- iOS-only: 범위 명확화("부착·고정 자재만 here"), 컴플라이언스 경고(소방·전기·방염) 전면.
- 통합: iOS에 업종별 자재 "왜" 레이어; 웹에 범위 경계 명시.

**vendor-setup** 🔴
- 웹-only: 골든윈도(오픈4~6주전) + "견적→비교→선납" 시퀀스 + 미니카드(견적3·인증·POS먼저).
- iOS-only: "공급처 계약이 원가를 결정" + 검증(HACCP·1년A/S·무허가도매 단속·폐기율).
- 통합: iOS에 골든윈도 타임라인+시퀀스; 웹에 컴플라이언스 검증.

**location-candidates** ✅ 완료(이미 통합: 유리한길·원칙·함정 카드 이식, cfb4dae)

### 클러스터: 오프라인 운영·tail

**hiring-setup** 🔴
- 웹-only: **업종별 채용 플랫폼 추천**(10클러스터, 플랫폼명·근거), 알바vs정직원 타임라인, "F&B 정직원 무리=인건비 40%↑" 근거.
- iOS-only: 4대보험 사업주부담 계산기(10.77%), 실시나리오 임금계산(주30h).
- 통합: iOS에 업종별 플랫폼 추천+알바전환 전략; 웹에 4대보험 계산기.

**insurance-tax-setup** 🔴
- 웹-only: **함정 내러티브**(현금급여 미신고=PCI추적), 두루누리 80%(신고시점에만 신청), 2026 요율표, "유리한 길" 조건별 카드.
- iOS-only: 2026 요율 정정(장기요양), 5인이상 연차·연장·야간 1.5배.
- 통합: iOS에 두루누리 기회 + 함정 내러티브; 웹에 5인이상 수당.

**operations-setup** 🔴
- 웹-only: **단계별 정량 임팩트**(배달지연 1주=300~800만 손실, POS첫날오류=별점-0.4), 벤더 카탈로그(네이버/토스/디자인플랫폼 5종 가격티어), D-day 캘린더, 음악 저작권 형사처벌.
- iOS-only: 한국 규제 지뢰(위생교육 갱신·원산지 1억과징금·가족리뷰), 정산수수료 실수치(배민6.8%·쿠팡이츠9.8%), POS 4단계 테스트 모달.
- 통합: iOS에 정량임팩트+벤더카탈로그+리드타임; 웹에 규제디테일+수수료실수치.

**pre-launch** 🟡
- 웹-only: 손님 4유형+가격 옥션(무료/할인/정가), 무기명 피드백카드, 본오픈 5단계, 케이스스터디.
- iOS-only: 72h 하드 점검(영업신고증·소방·CCTV), 비상금 50만+, 냉장온도, 집하시간, 시간별 스크립트.
- 통합: 웹의 손님전략 + iOS의 운영준비 결합.

**tax-guide** 🟡
- 웹-only: 스타트업(벤처인증·R&D인건비·스톡옵션 비과세), 2026 신고 캘린더, 업종별 절세 매트릭스.
- iOS-only: 세무사 선임 의사결정 UI(직원수·매출 임계), 정책자금 기관4+URL.
- 통합: iOS에 신고캘린더+업종별 절세; 웹에 CPA 결정 UI.

**loan-guide** 🟡
- 웹-only: TIPS 운영사 149 매칭, 다중 프로그램 동시지원, 자금사용계획 항목화, 피칭 30%.
- iOS-only: 정책자금 기관 비교표(금리·특징), 현장실사 일정·서류, 햇살론 대안.
- 통합: iOS에 TIPS 매칭/스태킹; 웹에 기관 비교표+실사 절차.

**financial-review** 🟡
- 웹-only: 24개 세부업종 벤치마크(% 범위·계절성 notes·영업이익률).
- iOS-only: Prime Cost 상한 UI, BEP+런웨이 자동, "매출0 가정 몇개월" 보유자본.
- 통합: iOS에 24업종 벤치마크; 웹에 BEP/런웨이 자동계산.

**pre-launch-final** 🟡
- 웹-only: 3모델별(스타트업/온라인/오프라인) 차등, PH 6주 타임라인+2026 알고리즘, 스마트스토어 SLA, 네이버플레이스 알고리즘, 함정카드 대량.
- iOS-only: 시간별 스크립트(-1h→마감), 통일 체크리스트, 하드검증(영업신고·소방·무중단결제).
- 통합: 웹의 모델별 성장전략 + iOS의 시간별 실행 스크립트 결합.

### 클러스터: 온라인

**platform-setup** 🔴
- 웹-only: **개설 순서 전략**(스마트스토어 먼저 → 월100만↑ 시 쿠팡), PG 비교, ROAS 200% 수학.
- iOS-only: 자체몰(카페24/아임웹) 옵션+비용, 멀티채널, 2026 통신판매 신고처 정정(gov.kr/구청).
- 통합: iOS에 개설 순서 시퀀스+임계규칙; 웹에 자체몰 비용.

**online-registration** 🔴
- 웹-only: 과세유형 디테일(간이≤1.04억), 에스크로 제3자보관 모델 설명, 비용(등록면허세 4.05만), 통신판매 5단계.
- iOS-only: 간결 4단계, 신고처 정정(gov.kr/구청).
- 통합: iOS 타임라인을 웹과 일치(사업자 0~3일/통신판매 1~5일) + 에스크로 설명 추가.

**sourcing-setup** 🔴
- 웹-only: **6파트 상세페이지 구조**(히어로→신뢰→스펙→라이프스타일→리뷰→배송), 포토리뷰 전환율 3배, 무료툴(망고보드/미리캔버스).
- iOS-only: 가격공식("원가×3"), 공급사 평가(견적3·샘플·MOQ), 단일소싱 리스크.
- 통합: iOS에 6파트 상세페이지+전환 데이터; 웹에 가격공식.

**store-setup** 🔴
- 웹-only: 3플랫폼(스마트스토어/쿠팡/11번가) 가이드, 택배 협상(CJ 1588-1255), 멀티툴(샵링커·올라).
- iOS-only: SEO 인라인(키워드·태그10·3단계 카테고리), 스마트스토어 MVP 단순화, 1원 테스트결제.
- 통합: iOS에 쿠팡/11번가 퀵레프; 웹에 SEO 전술; 양쪽 "7일 청약철회" 동등 강조.

**online-marketing** 🔴
- 웹-only: 인플루언서 #광고 법적의무(표시광고법 처벌), 광고 포지셔닝(검색vs상세), 리뷰조작 영구정지.
- iOS-only: 알고리즘 임계(리뷰10개=첫노출), 전환 2배(10→20리뷰), "광고없이 시작" 옵션, 자동SMS 전술.
- 통합: 웹에 알고리즘 임계+전환수치; iOS에 인플루언서 법적의무+포지셔닝; 양쪽 30~50만 예산+ROAS200%.

### 클러스터: 스타트업

**startup-foundation** 🟡 — 웹: 팀모드별(인디/부트/시드/A) 채용·지분·OKR 심화. iOS: 핵심 3결정(문제·팀·법인) 압축. 통합: iOS에 팀모드 운영 깊이.
**customer-discovery** 🟡 — 웹: Mom Test/JTBD 프레임워크+AI 스크립트 생성+PDF. iOS: 진행추적+wedge problem+업종별 의사결정자. 통합: iOS에 프레임워크 라이브러리; 웹에 진행추적.
**company-setup** 🟡 — 웹: KIPRIS 선행검색·PCT·변리사 ROI·스톡옵션 풀. iOS: 4단계 압축+세율 2026+RTI(연구소). 통합: iOS에 IP 절차 깊이; 웹에 RTI.
**mvp-build** 🟡 — 웹: 2026 버티컬AI 플레이북+Musk 5단계+툴 스캐폴딩. iOS: 스코프컷("버릴것 먼저")+기술경로 분기(EVT/DVT/PVT 등). 통합: iOS에 2026 패턴; 웹에 기술경로 분기.
**launch-gtm** 🟡 — 웹: 30일 PMF 골든윈도+런치스택+첫100+Sean Ellis 40%+한국채널. iOS: 인프라 체크(2개+)+업종별 스택. 통합: iOS에 첫100·채널전략; 웹에 업종별 스택예시.
**go-live** 🟡 — 웹: 채널별 정확한 절차(도메인→DNS→SEO→PH/HN)+스토어 정책. iOS: 배포 체크리스트+채널 매트릭스+PH 팁. 통합: iOS에 절차 깊이; 웹에 PH 팁.
**growth-engine** 🟡 — 웹: Sean Ellis·Unit Economics·리텐션 코호트. iOS: NSM 입력+주간30분 의식+리텐션 레드라인. 통합: iOS에 프레임워크; 웹에 주간의식 트리거.
**fundraising-readiness** 🟡 — 웹: Default Alive+70개 정부프로그램 매칭+AI 사업계획서. iOS: 런웨이 계산기+IR 10슬라이드+라운드 기준. 통합: iOS에 프로그램 라이브러리; 웹에 런웨이 계산기.
**venture-certification** 🟡 — 웹: 3유형 완전비교+6세제혜택 정량+신청일정. iOS: 유형선택→즉시링크+9혜택 버킷. 통합: iOS에 유형 완전비교+혜택 정량.

### 클러스터: 하드웨어·딥테크 (12단계, 웹은 ClusterStageTemplate)

공통 패턴 — **웹-only**: 권위 출처(Titoma/CISA HBOM/IB-Lenhardt/MFDS/AnySilicon 등) + 정량 데이터(리드타임·수율·가격·시행일) + 글로벌 맥락. **iOS-only**: 원화 비용·국내 공급사·국내 인센티브(RNDIP·바우처)·타임라인·진행 토글.

- **hardware-prototype** — 웹: EVT/DVT/PVT 정의·출처·NPI 리드타임. iOS: 단계별 4~8주·예산(500만~3천만). 통합: 양쪽 합본.
- **bom-supply-chain** — 웹: CISA HBOM 듀얼소싱·리드타임 12~26주. iOS: 원가×3·국내공급사. 통합.
- **certification-kc-ce** — 웹: pre-compliance ROI·2026.4-11 5G NR 시행. iOS: 인증비 원화(300~2000만)·MIC. 통합.
- **manufacturing-partner** — 웹: ISO13485/IATF·툴링 소유권 함정·국내 EMS Big3. iOS: MOQ≤500·중국vs국내·ODM·후속 체크. 통합.
- **lab-setup** — 웹: GLP/BSL·IACUC/IRB·MFDS/OECD. iOS: RNDIP 세액공제·장비바우처80%·공동시설. 통합.
- **prototype-iteration** — 웹: v0~v3 주간스프린트·컷오프 지표·SaMD. iOS: 분야별 예산·외부전문가 데모. 통합.
- **field-or-clinical-test** — 웹: MFDS IND 4~6주·Pre-IND 7일·KGCP. iOS: 피험자보험=거절트리거·1상 타임라인. 통합.
- **regulatory-submission** — 웹: Fast-Track 199품목(AI113)·지정학 수출통제. iOS: 1~4등급 타임라인·소관부처표. 통합.
- **eda-tooling-setup** — 웹: EDA 가격($750K)·토큰·시드범위. iOS: 대학 공유라이선스·파운드리 번들·Hard/Soft IP. 통합.
- **mpw-or-pilot-tape-out** — 웹: TSMC 2027-28 매진·CoWoS 52-78주. iOS: 국내 MPW(씨제이씨/삼성)·테이프아웃 후 일정. 통합.
- **packaging-and-test** — 웹: OSAT 2026 가격 5-30%↑·JEDEC 수율공식. iOS: 패키지타입(QFN/BGA/WLP)·국내 OSAT·첫MPW 수율 50-70%. 통합.
- **partner-foundation-or-pilot-line** — 웹: 지정학 파운드리 리스크·CoWoS 병목·$10M. iOS: FAE 미팅·국내 파운드리 직접경로·PO 선제. 통합.

---

## 3. 통합 실행 로드맵 (웨이브)

원칙: **콘텐츠 = 양쪽 합집합**, **UI/UX = 플랫폼 네이티브**(웹=웹스타일, iOS=BU 디자인+휠/시트/햅틱). SSOT 가능한 카피는 `@foundone/shared` JSON으로 추출 검토.

- **웨이브 1 (🔴 오프라인 코어·운영 — 사용자 체감 최대)**: permit-check, contract-review, hiring-setup, insurance-tax-setup, operations-setup, vendor-setup, construction-setup, registration-setup → iOS에 웹 교육 내러티브(이유·정량·유리한길·협상카드) 이식; 웹에 iOS 계산기·규제디테일 이식.
- **웨이브 2 (🔴 온라인 5)**: platform-setup, online-registration, sourcing-setup, store-setup, online-marketing.
- **웨이브 3 (🟡 스타트업 9)**: 프레임워크·라이브러리 ↔ 계산기·진행추적 교차 이식.
- **웨이브 4 (🟡 하드웨어/딥테크 12)**: 웹 출처·정량데이터 ↔ iOS 원화·국내맥락 합본.
- **웨이브 5 (🟡 tail·잔여)**: tax-guide, loan-guide, financial-review, pre-launch, pre-launch-final, menu-design, startup-type, business-model + 🟢 미세보정.

각 웨이브: 이식 → iOS 빌드 + 웹 typecheck/build → 시뮬/스크린샷 검증 → 커밋.

---

## 4. 검증 완료 결과 (실제 코드 1:1 대조 — 2026-06-03)

⚠️ **중요 정정**: §2 매트릭스는 병렬 에이전트가 만든 1차 추정이며, 실제 코드를 열어 검증한 결과
**iOS 갭을 체계적으로 과장**했음이 드러남. iOS는 매트릭스가 시사한 것보다 웹에 훨씬 가까웠고,
진짜 갭은 "업종별 전략/협상 카드·정량 임팩트·PATH" 같은 **특정 교육 카드**에 집중돼 있었음.

### 실제 이식한 진짜 갭 (커밋 완료)
| 단계 | 진짜 갭 | 조치 | 커밋 |
|---|---|---|---|
| location-candidates | 유리한길·원칙·함정 카드 | 이식 | cfb4dae |
| permit-check | 협상카드 4→9업종 | 합본 이식(웹·iOS 동시) | d5d1f7b |
| contract-review | 업종별 특약 카드 | 10업종 이식 | d02e6e5 |
| hiring-setup | 업종별 채용전략 | 9업종 이식 | 3023947 |
| insurance-tax-setup | 두루누리 긴급성·함정·직원수별 PATH | 3종 이식 | 0ad46d6 |
| operations-setup | 정량 임팩트(손실액·별점·노출) | 임팩트 카드 | 3620c03 |
| vendor-setup | 골든타임·견적→비교→선납 | 골든타임 카드 | 39de6a5 |
| sourcing-setup | 상세페이지 6단 구조·포토리뷰 3배 | 6단 카드 | f543414 |
| store-setup | 쿠팡·11번가 확장 퀵레프 | 퀵레프 카드 | f543414 |
| customer-discovery | JTBD 라벨 | Mom Test·JTBD 명시 | (이번) |
| growth-engine | AARRR 라벨 | AARRR 퍼널 명시 | (이번) |

### 검증 결과 "이미 패리티" (이식 불필요 — 실제 코드 확인)
- **construction-setup**: 11개 업종 전부 자재·컨셉 분기 + 트렌드 근거(2025 MZ·Pantone) + 컴플라이언스.
- **registration-setup**: whyPage 3점(법적 3년/3천만원·운영 인프라 전제·순차) + 과세유형 path.
- **platform-setup**: 개설순서(스마트→매출 후 쿠팡)·100만원 임계·ROAS 200%·에스크로 모두 보유.
- **online-marketing**: #광고 표시의무·리뷰조작 영구정지·ROAS·네이버 SEO 모두 보유.
- **online-registration**: 세금유형·PG·에스크로·통신판매 신고 보유(near-parity, 스킵).
- **스타트업 9단계 전체**: 프레임워크(Mom Test·Sean Ellis 40%·Default Alive)+계산기(런웨이·NSM)+
  IR 10슬라이드+벤처 3유형 보유. 체크리스트 아님 — 사실상 패리티.
- **financial-review**: {업종} 고정비 벤치마크 보유(웹 24 세부업종 대비 cluster 단위 — near-parity).
- **tax-guide**: 연간 신고 캘린더·과세유형·절세 5가지·세무사 기준 보유.
- **loan-guide**: 예산별 자금경로·정책자금 기관·신청절차 보유(TIPS는 fundraising-readiness 담당).
- **하드웨어/딥테크 12단계**: 양쪽 모두 풍부. 웹-only는 주로 출처 URL·글로벌 수치(모바일 UX 가치 낮음).
- 기타 🟢(industry-selection·startup-type·business-model·target-customer·budget·biz-registration·
  menu-design·pre-launch·pre-launch-final): 패리티 또는 미세 차이.

### 결론
콘텐츠 통일의 **실질 작업은 오프라인 코어 클러스터 + 일부 온라인**에 집중됐고 모두 완료.
나머지 클러스터는 실제 코드상 이미 동등 → 불필요한 패딩 대신 정직하게 패리티로 기록.
"체크리스트만 있는 느낌"이던 핵심(상권·인허가·계약·채용·보험세무·운영·발주·소싱)은 모두
웹의 교육 내러티브(왜·정량·유리한 길)를 갖추도록 보강됨. **web==app 원칙 달성.**
