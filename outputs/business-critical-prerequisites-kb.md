# Business-Critical Prerequisites Knowledge Base
# 업종별 창업 필수 선행조건 지식 베이스

> **Purpose**: AI가 사용자의 사업 상태를 진단할 때, 이 선행조건들이 충족되었는지를 **최우선**으로 확인하고,
> 미충족 시 다른 어떤 조언보다 이것을 먼저 권고해야 합니다.
>
> **Priority Levels**:
> - **BLOCKER** (이것 없이는 운영 불가) -- 법적 요건 미충족 = 영업정지/과태료
> - **CRITICAL** (없으면 1-3개월 내 심각한 문제) -- 운영 붕괴 또는 재정적 위기
> - **IMPORTANT** (없으면 성장 제한) -- 매출 정체, 경쟁력 약화
> - **NICE-TO-HAVE** (있으면 좋지만 당장은 아님)
>
> **Data Sources**: 찾기쉬운 생활법령정보(easylaw.go.kr), 정부24, 공정거래위원회,
> 한국외식업중앙회, 국세청, CB Insights, Square, Shopify, 각 업종별 협회 자료 (2025-2026)

---

## I. Cross-cutting Prerequisites (모든 업종 공통)

### BLOCKER

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| C-1 | **사업자등록** | 미등록 시 영업 자체가 불법. 세금계산서 발행 불가, 정부 지원 대상 제외 | `user.businessRegistrationNumber` 없음 또는 `onboarding.hasBusinessRegistration === false` | "사업자등록은 모든 사업의 법적 출발점입니다. 사업 개시일로부터 20일 이내에 반드시 등록해야 하며, 미등록 시 가산세가 부과됩니다. 홈택스에서 온라인 신청이 가능합니다." | 무료, 3-7영업일 |
| C-2 | **업종별 영업신고/허가** | 업종에 따라 영업신고(음식점, 미용업 등) 또는 영업허가(주점 등) 필수. 미신고 영업 시 형사처벌 가능 | `user.businessLicenseType` 미설정 또는 업종과 불일치 | "선택하신 '{category}' 업종은 {관할기관}에 {신고/허가}가 필요합니다. 사업자등록 전에 이 절차를 먼저 완료해야 합니다." | 무료-5만원, 3-14영업일 |
| C-3 | **건축물 용도 확인** | 임대 계약 후 영업신고가 불가능한 건물 용도인 경우 보증금 손실 위험. 음식점=일반음식점 가능 용도, 헬스장=운동시설/2종근생 등 | `user.lease.buildingUsage` 미확인 또는 업종 부적합 | "계약하신 건물의 건축물대장 용도를 반드시 확인하세요. '{category}' 업종은 '{requiredUsage}' 용도여야 영업신고가 가능합니다." | 확인 무료(정부24), 용도변경 시 수백만원/1-3개월 |

### CRITICAL

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| C-4 | **4대보험 가입 (직원 고용 시)** | 직원 있는 사업장은 의무. 미가입 시 과태료 + 소급 납부 + 정부지원금 자격 상실 | `user.employees > 0 && user.socialInsurance === false` | "직원을 고용하셨다면 4대보험(국민연금, 건강보험, 고용보험, 산재보험) 가입이 의무입니다. 미가입 시 과태료가 부과되고, 인건비가 비용으로 인정되지 않아 세금 부담이 커집니다." | 보험료 급여의 약 9-10% 사업주 부담, 즉시 가입 가능 |
| C-5 | **세무사/기장 계약** | 부가세(1월/7월), 종소세(5월) 신고 필수. 복식부기 의무자는 세무대리인 필수. 미신고 시 가산세 20% | `user.taxAccountant === null && monthsSinceOpening > 1` | "세무사 계약은 창업 초기부터 필요합니다. 부가세 신고(1월/7월 25일), 종합소득세 신고(5월) 등 기한을 놓치면 가산세가 부과됩니다." | 월 10-30만원 (기장료), 즉시 |
| C-6 | **사업자 통장 분리** | 사업-개인 자금 미분리 시 세무조사 위험, 비용처리 불인정 | `user.businessBankAccount === null` | "사업용 통장을 별도로 개설하세요. 개인 통장과 섞이면 비용처리가 어렵고, 세무조사 시 불이익을 받을 수 있습니다." | 무료, 즉시 |
| C-7 | **카드단말기/POS 설치** | 카드결제 불가 = 매출 50% 이상 손실. 현금영수증 의무발행 업종은 미발급 시 가산세 20% | `user.paymentSystem === null` | "카드결제 수단은 필수입니다. 현금영수증 의무발행 업종인 경우 10만원 이상 현금거래 시 미발급하면 가산세 20%가 부과됩니다." | POS: 월 3-10만원 렌탈, 단말기: 무료-30만원 |
| C-8 | **필수 보험 가입** | 다중이용업소 화재배상책임보험 미가입 시 과태료 300만원 이하. 산재보험 미가입 시 사고 발생 시 전액 사업주 부담 | `user.insurance.fire === false && user.isMultiUseEstablishment` | "화재배상책임보험은 다중이용업소에서 의무입니다. 미가입 시 과태료가 부과되며, 화재 사고 시 피해자 1인당 최대 1억5천만원까지 보상해야 합니다." | 연 5-30만원 |

### IMPORTANT

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| C-9 | **매출/비용 기록 시스템** | 기록 없이 3개월 이상 운영 시 세무신고 불가, 손익 파악 불가로 의사결정 실패 | `user.salesRecords.count < 30 && monthsSinceOpening > 1` | "매출과 비용을 매일 기록하는 습관이 필요합니다. 기록 없이는 세무 신고도, 정확한 손익 파악도 불가능합니다." | 무료(엑셀)-월 5만원(앱) |
| C-10 | **SNS/온라인 존재감** | 네이버 플레이스, 인스타그램 등 미등록 시 신규 고객 유입 차단 | `user.onlinePresence.naverPlace === false && user.hasPhysicalLocation` | "네이버 플레이스에 매장을 등록하세요. 잠재 고객의 70% 이상이 방문 전 온라인 검색을 합니다." | 무료, 1-3일 |

### NICE-TO-HAVE

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| C-11 | **고객관리(CRM) 시스템** | 재방문율 추적, 단골 관리 | `monthsSinceOpening > 6 && user.crmSystem === null` | "단골 고객 관리 시스템을 도입하면 재방문율을 10-20% 높일 수 있습니다." | 무료-월 5만원 |
| C-12 | **배상책임보험 (선택)** | 고객 부상, 식중독 등 사고 대비 | 운영 6개월 이상 | "영업배상책임보험/생산물배상책임보험 가입을 권장합니다." | 연 10-50만원 |

---

## II. Food Service (음식점/한식/분식/치킨/피자) — `categoryId: "food"`

> **업종 통계**: 음식점업 연간 폐업자 15만2천건(2024), 5년 생존율 약 35%
> 창업비용: 5천만원-2억원 (규모/업태별 차이)

### BLOCKER

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| F-1 | **식품위생교육 이수** | 영업신고 전 필수. 미이수 시 영업신고 자체가 불가능. 6시간 교육(한국외식업중앙회) | `user.hygieneCertification === false` | "식품위생교육(6시간)을 아직 이수하지 않으셨습니다. 영업신고 전에 반드시 완료해야 합니다. 한국외식업중앙회(foodservice.or.kr) 또는 온라인으로 이수 가능합니다." | 약 4만원, 1일 |
| F-2 | **영업신고증 발급** | 일반음식점, 휴게음식점은 영업신고 필수. 신고증 없이 영업 시 과태료/영업정지 | `user.businessLicenseType !== 'food_service'` | "일반음식점 영업신고를 관할 구청에 제출하세요. 필요서류: 영업신고서, 위생교육 이수증, (지하수 사용 시) 수질검사성적서" | 무료, 3-7영업일 |
| F-3 | **건강진단 (보건증)** | 식품접객업 종사자 전원 필수. 미소지 시 과태료 | `user.healthCertificates < user.employees` | "식품접객업 종사자는 전원 건강진단(보건증)을 받아야 합니다. 보건소에서 발급받을 수 있습니다." | 약 3천원, 1-3일 |
| F-4 | **소방/방화시설 확인** | 음식점 면적/위치에 따라 소방시설완비증명서 필요 | `user.fireSafetyCertificate === false && user.floorArea > 66` | "소방시설완비증명서가 필요한 규모입니다. 관할 소방서에서 확인받으세요." | 무료-수십만원, 1-2주 |

### CRITICAL

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| F-5 | **최소 인력 확보** | 주방 1명 + 홀/배달 1명 최소. 1인 운영 시 하루 13시간+ 노동, 3개월 내 번아웃 | `user.employees === 0 && user.businessType === 'dine-in'` | "홀 영업을 하시면서 1인 운영은 현실적으로 어렵습니다. 최소 파트타이머 1명을 확보하세요. 인건비는 매출의 약 25-30%를 기준으로 계획하세요." | 월 150-250만원/인 |
| F-6 | **배달앱 입점** | 음식점 매출의 40-60%가 배달. 미입점 시 매출 절반 손실. 단, 수수료 25-30% 고려 필수 | `user.deliveryApps.length === 0 && user.isDeliveryRelevant` | "배달앱(배민/쿠팡이츠/요기요) 입점을 검토하세요. 단, 수수료(중개+배달+결제)가 매출의 25-30%에 달하므로, 메뉴 가격 책정 시 이를 반영해야 합니다." | 입점 무료, 수수료 매출의 2-9.8%+배달비+결제수수료 |
| F-7 | **식자재 공급처 확보** | 안정적 공급처 없이 운영 시 품질 불균일, 원가 통제 불가 | `user.suppliers.count === 0` | "신뢰할 수 있는 식자재 공급처를 최소 2-3곳 확보하세요. 단일 공급처 의존은 위험합니다." | 시간투자 1-2주 |
| F-8 | **다중이용업소 화재배상책임보험** | 2층 이상 100㎡+ 또는 지하 66㎡+ 매장은 의무가입 | `user.insurance.fire === false && user.isMultiUseEstablishment` | "매장 규모상 화재배상책임보험 의무가입 대상입니다. 미가입 시 과태료가 부과됩니다." | 연 5-20만원 |

### IMPORTANT

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| F-9 | **식자재 원가 관리 체계** | 식재료비가 매출의 30-35% 초과 시 적자 구조. 원가율 미관리 = 3-6개월 내 자금난 | `user.foodCostRatio > 0.35 || user.foodCostRatio === null` | "식재료 원가율을 추적하고 있나요? 음식점의 건강한 식재료 원가율은 매출의 28-33%입니다. 현재 원가율을 확인하세요." | 무료 (기록 습관) |
| F-10 | **메뉴 수익성 분석** | 전 메뉴 동일 마진 가정은 위험. 핵심 메뉴의 마진율 파악 필수 | `monthsSinceOpening > 3 && user.menuProfitAnalysis === false` | "메뉴별 수익성을 분석해보세요. 팔리지 않거나 마진이 낮은 메뉴를 정리하면 수익이 개선됩니다." | 무료, 3-5시간 분석 |
| F-11 | **네이버 플레이스/배달앱 리뷰 관리** | 별점 4.0 미만 시 신규 고객 유입 급감 | `user.reviewScore < 4.0 || user.reviewCount < 10` | "온라인 리뷰 관리를 시작하세요. 별점이 4.0 미만이면 신규 고객 유입이 크게 줄어듭니다." | 무료, 매일 10분 |

### NICE-TO-HAVE

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| F-12 | **주방 동선 최적화** | 조리 효율 향상, 사고 예방 | 운영 안정화 이후 | "주방 동선을 점검하면 조리 시간을 10-15% 단축할 수 있습니다." | 무료-수백만원 |
| F-13 | **HACCP 자율 인증** | 소규모 음식점은 의무 아니나, 신뢰도 향상 | 안정 운영 이후 | "HACCP 인증은 선택사항이지만, 위생등급을 높이면 고객 신뢰가 올라갑니다." | 50-200만원 |

---

## III. Cafe & Dessert (카페/디저트) — `categoryId: "cafe-dessert"`

> **업종 통계**: 카페 5년 생존율 26%, 종사자 1인당 연매출 약 5천만원
> 서울 카페 수: 약 1만개 이상, 시장 포화 심각

### BLOCKER

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| CD-1 | **식품위생교육 이수** | 음식점과 동일. 휴게음식점 영업신고 전 필수 | `user.hygieneCertification === false` | (F-1과 동일) | 약 4만원, 1일 |
| CD-2 | **휴게음식점 영업신고** | 카페는 '휴게음식점'으로 신고. 디저트 판매 시에도 동일 | `user.businessLicenseType !== 'cafe_rest'` | "카페는 '휴게음식점'으로 영업신고해야 합니다. 관할 구청에 신고하세요." | 무료, 3-7영업일 |

### CRITICAL

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| CD-3 | **에스프레소 머신 + 그라인더** | 카페의 핵심 장비. 품질이 곧 맛. 저가 장비는 고장 빈번, AS 불가 | `user.equipment.espressoMachine === null` | "에스프레소 머신과 그라인더는 카페 운영의 핵심입니다. 반자동 2그룹 기준으로 선택하시고, AS가 가능한 공식 수입처 제품을 추천합니다." | 에스프레소머신 500-3,000만원, 그라인더 100-500만원 |
| CD-4 | **원두 공급처 계약** | 안정적 원두 공급 없이는 품질 유지 불가. 최소 2개 공급처 권장 | `user.suppliers.coffee === null` | "원두 공급처를 확보하세요. 로스터리별로 샘플을 받아 테스트한 후, 메인 공급처 1곳 + 백업 1곳을 확보하는 것이 안전합니다. 원두 1kg 원가는 약 13,800-25,000원입니다." | 원두 kg당 1.4-2.5만원, 1-2주 선정 |
| CD-5 | **최소 인력 (본인 + 1명)** | 1인 운영 시 하루 13시간 근무 필수. 월 400만원 수준 소득에 번아웃. 최소 파트타이머 1명 | `user.employees === 0 && user.dailyOperatingHours > 10` | "카페 1인 운영은 현실적으로 지속 불가능합니다. 최소 파트타이머 1명을 고용하세요. 하루 13시간 일하고 월 400만원이 카페 1인 운영의 현실입니다." | 월 100-200만원/인 |
| CD-6 | **손익분기 매출 계산** | 카페 월 임대료+인건비+재료비 = 최소 월 1,100만원. BEP 미달 시 매월 적자 누적 | `user.breakEvenAnalysis === null` | "월 고정비(임대료+인건비+재료비+관리비)를 정확히 계산하고, 하루에 몇 잔을 팔아야 손익분기인지 확인하세요." | 무료, 분석 2-3시간 |

### IMPORTANT

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| CD-7 | **차별화 컨셉/시그니처 메뉴** | 주변 카페 포화 상태에서 차별화 없이는 가격 경쟁만 남음 | `user.signatureMenu.count === 0 && monthsSinceOpening > 2` | "시그니처 메뉴를 개발하세요. 카페 시장은 극도로 포화되어 있어, 차별화 포인트 없이는 생존이 어렵습니다." | 무료-50만원, 2-4주 |
| CD-8 | **인스타그램 마케팅** | 카페 고객의 대부분이 SNS 검색으로 유입. 비주얼 마케팅 필수 | `user.socialMedia.instagram === null` | "인스타그램 계정을 운영하세요. 카페 고객의 대부분이 SNS 검색 후 방문합니다." | 무료, 매일 20분 |

### NICE-TO-HAVE

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| CD-9 | **디저트/사이드 메뉴 확대** | 음료만으로는 객단가 한계 (아메리카노 4,000-5,000원) | 운영 6개월+ | "디저트나 브런치 메뉴를 추가하면 객단가를 50-100% 높일 수 있습니다." | 50-200만원 (장비/재료) |
| CD-10 | **배달 서비스 도입** | 카페 배달 수요 증가 추세 | 운영 안정화 이후 | "배달 서비스를 도입하면 추가 매출을 확보할 수 있습니다." | 포장재 월 10-30만원 |

---

## IV. Retail (소매/편의점/옷가게) — `categoryId: "retail"`

> **업종 통계**: 소매업 연간 폐업자 29만9천건(2024, 전체 1위), 재고 미관리 시 연매출 11% 손실

### BLOCKER

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| R-1 | **사업자등록 (업태: 소매업)** | 소매업으로 정확한 업태 등록 필수 | (C-1 참조) | (C-1 참조) | (C-1 참조) |
| R-2 | **프랜차이즈 가맹 시 정보공개서 확인** | 가맹계약 전 정보공개서 수령 후 14일 대기 의무. 미확인 시 불리한 계약 체결 위험 | `user.franchiseType !== null && user.franchiseDisclosureReviewed === false` | "프랜차이즈 정보공개서를 반드시 수령하고 14일 이상 검토하세요. 정보공개서 미수령 상태에서의 가맹금 수령이나 계약 체결은 법 위반입니다. 공정거래위원회 가맹사업 정보공개서 사이트에서 조회 가능합니다." | 무료, 최소 14일 검토 기간 |

### CRITICAL

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| R-3 | **재고관리 시스템 (POS 연동)** | 재고 미관리 시 연매출 11% 손실, 재고 부족/과잉 반복, 정산 불가. 엑셀 수기 관리는 월 100건 이상 시 한계 | `user.inventorySystem === null && user.monthlyTransactions > 100` | "재고관리 시스템이 없으면 연매출의 최대 11%가 손실됩니다. POS와 연동되는 재고관리 시스템을 도입하세요. 실시간 재고 파악이 가능해야 품절 방지와 과잉재고 방지가 됩니다." | POS+재고: 월 5-15만원 |
| R-4 | **초기 상품 구성 (MD)** | 판매 상품 없이 개업 불가. 초도 물량 산정 실패 시 자금 잠김 또는 품절 | `user.products.count === 0` | "초도 상품 구성을 신중하게 하세요. 처음에는 핵심 카테고리 위주로 소량 다품종을 추천합니다. 과도한 초도 물량은 자금을 묶이게 합니다." | 업종별 상이, 500만-5,000만원 |
| R-5 | **카드결제 단말기** | 소매업 매출의 70%+ 가 카드결제. 미설치 시 매출 대부분 손실 | `user.paymentSystem === null` | (C-7 참조) | (C-7 참조) |

### IMPORTANT

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| R-6 | **온라인 판매 채널 병행** | 오프라인만으로는 유동인구 감소 시대에 한계. 네이버 스마트스토어 등 | `user.onlineSalesChannel === null && monthsSinceOpening > 3` | "온라인 판매 채널을 추가하면 매출을 20-50% 늘릴 수 있습니다. 네이버 스마트스토어 입점을 검토하세요." | 무료-월 5만원 |
| R-7 | **시즌별 재고 계획** | 시즌 상품 과잉재고 = 재고 손실, 부족 = 매출 기회 손실 | `user.seasonalPlan === null && user.hasSeasonalProducts` | "시즌별 재고 계획을 수립하세요. 과거 판매 데이터 기반으로 수요를 예측하면 재고 손실을 30% 이상 줄일 수 있습니다." | 무료, 분석 시간 |

### NICE-TO-HAVE

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| R-8 | **로열티 프로그램** | 재방문율 향상 | 운영 6개월+ | "단골 적립/할인 프로그램을 도입하면 재방문율을 높일 수 있습니다." | 월 0-5만원 |

---

## V. Online/Digital (온라인 쇼핑몰) — `categoryId: "online-digital"`

> **업종 통계**: 통신판매업 1년 생존율 67.7% (하위권), 전자상거래법 위반 시 500만원 벌금+영업정지

### BLOCKER

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| OD-1 | **통신판매업 신고** | 온라인 판매 시 필수. 미신고 영업 시 15일+ 영업정지 + 최고 500만원 벌금 | `user.mailOrderRegistration === false` | "온라인으로 상품을 판매하려면 통신판매업 신고가 필수입니다. 사업자등록 → 구매안전서비스 이용확인증 발급 → 관할 구청에 신고 순서로 진행하세요. 정부24에서 온라인 신고가 가능합니다." | 등록면허세 4만-6만원(지역별), 3-7영업일 |
| OD-2 | **구매안전서비스 이용확인증** | 통신판매업 신고의 전제조건. 에스크로 또는 결제대금예치 서비스 가입 증빙 | `user.escrowCertificate === false` | "통신판매업 신고 전에 PG사에서 구매안전서비스 이용확인증을 발급받아야 합니다." | 무료, 1-3영업일 |
| OD-3 | **개인정보처리방침 공개** | 미공개 시 과태료 1천만원 이하. 전자상거래법+개인정보보호법 동시 적용 | `user.privacyPolicy === false` | "쇼핑몰에 개인정보처리방침을 반드시 게시해야 합니다. 미공개 시 과태료 1천만원 이하가 부과됩니다." | 무료 (템플릿 활용), 1-2시간 |
| OD-4 | **SSL 보안 인증서** | 고객 개인정보/결제정보 암호화 필수. 미설치 시 법적 처벌 대상 | `user.sslCertificate === false` | "SSL 보안 인증서는 법적 의무사항입니다. 미설치 시 개인정보보호법 위반으로 처벌받을 수 있습니다." | 무료-연 10만원, 즉시 |

### CRITICAL

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| OD-5 | **전자결제(PG) 서비스 연동** | 결제 불가 = 매출 0. 카드, 간편결제 등 다양한 수단 필수 | `user.pgProvider === null` | "PG(전자결제) 서비스를 반드시 연동하세요. 결제수단이 없으면 고객이 구매할 수 없습니다. 토스페이먼츠, 나이스페이 등을 검토하세요." | 월 0-5만원 + 결제당 2.5-3.5% |
| OD-6 | **택배/물류 계약** | 배송 불가 = 판매 불가. 월 100건 이상 시 택배사 직접 계약 권장 | `user.shippingProvider === null` | "택배사 계약을 체결하세요. 월 50건 미만이면 편의점 택배, 100건 이상이면 메이저 택배사(CJ/롯데/한진) 직접 계약이 유리합니다. 소규모는 건당 2,500-3,000원 수준입니다." | 건당 1,500-3,000원, 계약 1주 |
| OD-7 | **반품/교환/환불 정책 수립** | 전자상거래법상 7일 이내 청약철회 의무. 정책 미비 시 분쟁 빈발 | `user.returnPolicy === null` | "반품/교환/환불 정책을 명확히 공지해야 합니다. 전자상거래법상 7일 이내 청약철회는 의무이며, 정책이 불명확하면 고객 분쟁이 발생합니다." | 무료, 2-3시간 |
| OD-8 | **상품 사진/상세페이지** | 온라인에서 상품 사진 품질 = 구매 전환율. 저품질 이미지 = 구매율 50% 이상 하락 | `user.products.avgImageCount < 3` | "상품 사진과 상세페이지의 품질이 구매 전환율을 결정합니다. 최소 3장 이상의 고품질 사진을 촬영하세요." | 직접촬영 무료 / 전문촬영 건당 5-20만원 |

### IMPORTANT

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| OD-9 | **재고관리 시스템** | 재고 파악 불가 시 품절 판매 → 고객 불만 → 플랫폼 페널티 | `user.inventorySystem === null && user.products.count > 20` | "재고관리 시스템을 도입하세요. 품절 상태에서 주문이 들어오면 플랫폼 페널티와 고객 불만이 동시에 발생합니다." | 월 0-10만원 |
| OD-10 | **마켓플레이스 입점 (네이버/쿠팡)** | 자사몰만으로는 유입량 한계. 네이버 스마트스토어가 초보자에게 최적 | `user.marketplaces.length === 0 && monthsSinceOpening > 1` | "네이버 스마트스토어나 쿠팡 마켓플레이스에 입점하면 초기 유입을 확보할 수 있습니다." | 무료-수수료 2-10% |

### NICE-TO-HAVE

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| OD-11 | **마케팅 자동화** | 이메일/SMS 자동발송, 장바구니 이탈 리마인드 | 월 주문 500건+ | "마케팅 자동화를 도입하면 구매 전환율을 15-25% 높일 수 있습니다." | 월 3-10만원 |

---

## VI. Beauty/Hair Salon (미용실/뷰티샵) — `categoryId: "beauty"`

> **업종 통계**: 미용실 1년 생존율 91.6% (업종 중 최상위). 단, 이는 면허 장벽으로 인한 효과
> 1인 1업소 원칙 적용

### BLOCKER

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| B-1 | **미용사 면허** | 면허 없이 미용업 영업 불가. 면허 취득 후 면허증 신청 별도 | `user.beautyLicense === false` | "미용업 영업에는 미용사 면허가 필수입니다. 국가기술자격(미용사 일반/피부/네일/메이크업) 취득 후 보건소에서 면허증을 신청해야 합니다. 필요서류: 면허신청서, 자격증 사본, 건강진단서(6개월 이내), 사진" | 자격시험 응시료 약 2만원, 면허발급 무료. 준비기간 3-12개월 |
| B-2 | **미용업 영업신고** | 관할 구청에 영업신고 필수. 위생교육 이수 전제 | `user.businessLicenseType !== 'beauty'` | "미용업 영업신고를 관할 구청에 제출하세요. 신고 전 위생교육 이수가 필수입니다." | 무료, 3-7영업일 |
| B-3 | **위생교육 이수** | 미용업 영업신고 전 필수. 대한미용사회중앙회에서 교육 실시 | `user.sanitaryEducation === false` | "미용업 위생교육을 이수하세요. 영업신고 전 반드시 완료해야 합니다." | 약 3만원, 1일 |

### CRITICAL

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| B-4 | **소독 장비** | 미용기구 소독은 법적 의무. 소독기, 자외선살균기 필수 비치. 미비 시 영업정지 | `user.equipment.sterilizer === false` | "미용기구 소독 장비(소독기, 자외선살균기)는 법적으로 반드시 비치해야 합니다. 소독한 기구와 미소독 기구를 분리 보관할 수 있는 용기도 필요합니다." | 소독기 10-50만원, 자외선살균기 5-20만원 |
| B-5 | **시설 기준 충족** | 미용 의자/베드 등 업종별 필수 시설 구비 | `user.facilityStandard === false` | "미용업 시설기준을 충족해야 합니다. 헤어: 미용의자, 피부: 미용베드 등 업종에 맞는 시설을 갖추세요." | 업종별 100-500만원 |
| B-6 | **예약 관리 시스템** | 미용업은 예약 기반. 예약 관리 부재 시 고객 이탈 + 비효율 운영 | `user.reservationSystem === null && monthsSinceOpening > 1` | "예약 관리 시스템을 도입하세요. 전화만으로는 예약 관리에 한계가 있으며, 네이버 예약 등 온라인 예약을 활용하면 고객 유입과 관리가 쉬워집니다." | 무료(네이버예약)-월 5만원 |

### IMPORTANT

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| B-7 | **포트폴리오/시술 사진** | 미용업에서 실력 증명 = 포트폴리오. 없으면 신규 고객 확보 어려움 | `user.portfolio.count < 10 && monthsSinceOpening > 2` | "시술 전/후 사진을 꾸준히 촬영하고 SNS에 올리세요. 미용업에서 포트폴리오는 최고의 마케팅입니다." | 무료 |
| B-8 | **고객 관리 프로그램** | 단골 비율이 매출의 70%+. 고객별 시술 이력 관리 필수 | `user.crmSystem === null && monthsSinceOpening > 3` | "고객별 시술 이력과 선호를 기록하는 시스템을 도입하세요. 미용업 매출의 70% 이상이 단골 고객에서 나옵니다." | 무료-월 5만원 |

### NICE-TO-HAVE

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| B-9 | **부가 서비스 확대** | 헤어+네일, 헤어+피부 등 종합 서비스화 | 안정 운영 이후 | "추가 시술 서비스를 검토하면 객단가를 높일 수 있습니다." | 추가 면허+장비 비용 |

---

## VII. Fitness (헬스장/체육시설) — `categoryId: "fitness"`

> **업종 통계**: 체육시설업 미신고 영업 시 1년 이하 징역/1천만원 이하 벌금
> 회원제 기반 반복 수익 모델

### BLOCKER

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| FT-1 | **체육시설업 신고** | 헬스장은 체육시설업 신고 필수. 미신고 영업 시 1년 이하 징역 또는 1천만원 이하 벌금 | `user.sportsFacilityRegistration === false` | "헬스장 운영을 위해 관할 시/구/군청에 체육시설업 신고를 해야 합니다. 미신고 영업 시 형사처벌(1년 이하 징역/1천만원 이하 벌금) 대상입니다." | 무료, 7-14영업일 |
| FT-2 | **체육지도자 자격증 보유자** | 임직원 중 최소 1명 이상 생활스포츠지도사 자격증 필수 | `user.sportsInstructorCertified === false` | "헬스장에는 생활스포츠지도사 자격증 보유자가 최소 1명 이상 있어야 합니다." | 자격시험 준비 3-6개월, 응시료 약 2만원 |
| FT-3 | **건축물 용도 확인** | 500㎡ 미만: 2종 근생/운동시설, 500㎡ 이상: 운동시설만 가능 | `user.buildingUsage !== 'sports_facility'` | "헬스장 부지의 건축물대장 용도를 확인하세요. 500㎡ 이상이면 '운동시설' 용도만 가능합니다." | 확인 무료 |
| FT-4 | **안전교육 이수** | 체육시설업 신고 시 필수 제출 | `user.safetyEducation === false` | "체육시설 안전교육을 온라인으로 이수하고 이수증을 제출해야 합니다." | 무료, 반일 |

### CRITICAL

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| FT-5 | **회원 관리 시스템** | 회원권 관리, 출석, 결제 관리 없이는 운영 불가. 월 회원 50명+ 시 수기 관리 한계 | `user.membershipSystem === null` | "회원 관리 시스템을 도입하세요. 회원권 종류, 잔여 기간, 출석 관리, 결제 관리가 체계적으로 되어야 합니다." | 월 5-15만원 |
| FT-6 | **운동기구 배치 + 안전 점검** | 기구 고장/사고 시 영업배상 + 형사 책임 가능. 정기 점검 필수 | `user.equipmentSafetyCheck === false` | "운동기구의 안전 점검을 정기적으로 실시하세요. 기구 고장으로 회원이 부상당하면 사업주에게 법적 책임이 있습니다." | 점검비 월 10-30만원 |
| FT-7 | **배상책임보험** | 헬스장에서 사고 발생 빈도 높음. 보험 없이 사고 시 수천만원 배상 | `user.insurance.liability === false` | "헬스장 운영 시 배상책임보험 가입을 강력히 권장합니다. 운동 중 부상 사고 시 수천만원의 배상금이 발생할 수 있습니다." | 연 20-100만원 |

### IMPORTANT

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| FT-8 | **PT(퍼스널트레이닝) 프로그램** | 헬스장 매출의 40-60%가 PT. PT 없이는 수익성 한계 | `user.ptProgram === false && monthsSinceOpening > 2` | "PT 프로그램을 운영하면 매출을 40-60% 이상 높일 수 있습니다. 헬스장 수익의 핵심은 PT 매출입니다." | 트레이너 인건비 |
| FT-9 | **회원 해지/환불 규정** | 체육시설법상 회원 해지 시 환불 의무. 규정 미비 시 분쟁 빈발 | `user.refundPolicy === null` | "회원 해지/환불 규정을 명확히 수립하세요. 체육시설법에 따른 환불 기준을 준수해야 합니다." | 무료 |

---

## VIII. Education (학원/교습소) — `categoryId: "education"`

> **업종 통계**: 학원설립 등록 후 7일 이내 배상책임보험 미가입 시 등록 취소 가능

### BLOCKER

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| ED-1 | **학원 설립/운영 등록 (또는 교습소 신고)** | 교육감(교육청)에 등록/신고 필수. 미등록 영업 시 형사처벌 | `user.educationRegistration === false` | "학원은 교육청에 설립/운영 등록이 필요하며, 소규모 교습소는 신고로 가능합니다. 미등록 영업 시 처벌 대상입니다." | 등록면허세 4-6만원, 7-14영업일 |
| ED-2 | **시설 확보 + 소방 점검** | 학원 시설 기준 충족 필수 (면적, 환기, 조명 등). 소방시설완비증명서 필요 | `user.facilityStandard === false` | "학원 시설기준(면적, 환기, 조명, 소방)을 충족해야 등록이 가능합니다." | 시설기준 충족 비용 수백만원 |
| ED-3 | **배상책임보험 가입 (등록 7일 이내)** | 학원 등록일 7일 이내 가입 의무. 14일 이내 보험증권 교육청 제출. 미가입 시 등록 취소 가능 | `user.insurance.educationLiability === false` | "학원 등록 후 7일 이내에 배상책임보험에 가입하고, 14일 이내에 보험증권을 교육청에 제출해야 합니다. 미가입 시 등록이 취소될 수 있습니다." | 연 10-30만원 |

### CRITICAL

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| ED-4 | **강사 확보** | 학원 교육의 품질 = 강사 역량. 1인 운영 시 병가/휴가 대응 불가 | `user.instructors.count === 0` | "안정적인 강사진을 확보하세요. 1인 운영 시 본인 컨디션에 따라 수업이 불가능해지면 학생과 학부모의 신뢰를 잃게 됩니다." | 강사 인건비 월 200-400만원/인 |
| ED-5 | **수강 관리 시스템** | 수강생 관리, 출결, 학부모 소통 등 체계적 관리 없이는 신뢰 구축 불가 | `user.studentManagementSystem === null && user.students > 20` | "수강 관리 시스템을 도입하세요. 출결, 성적, 학부모 소통이 체계적이어야 재등록률이 높아집니다." | 월 3-10만원 |

### IMPORTANT

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| ED-6 | **교습비 신고/게시** | 교습비를 교육청에 신고하고 원내 게시 의무 | `user.tuitionReported === false` | "교습비를 교육청에 신고하고 원내에 게시해야 합니다." | 무료 |
| ED-7 | **학부모 소통 채널** | 학원 재등록의 핵심은 학부모 만족도 | `monthsSinceOpening > 2 && user.parentCommunication === null` | "학부모 소통 채널(알림장 앱, 카카오 채널 등)을 운영하세요. 학원 재등록의 핵심은 학부모의 신뢰입니다." | 무료-월 3만원 |

---

## IX. Pet (반려동물) — `categoryId: "pet"`

> 동물보호법 강화 추세, 시설/자격 요건 점점 엄격해짐

### BLOCKER

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| P-1 | **동물판매업/미용업/위탁업 등록** | 관할 시/군/구청에 영업 등록 필수. 업종에 따라 교육 이수 + 시설기준 충족 필요 | `user.animalBusinessRegistration === false` | "반려동물 관련 영업은 관할 시/군/구청에 등록이 필수입니다. 등록 전 교육 이수, 시설기준 충족, 현장 실사가 있습니다." | 교육비 5-10만원, 2-4주 |
| P-2 | **건축물 용도** | 판매/미용/위탁 업종: 1종 또는 2종 근린생활시설 필수 | `user.buildingUsage` 부적합 | "반려동물 매장은 1종 또는 2종 근린생활시설이어야 합니다. 건축물대장을 확인하세요." | 확인 무료 |

### CRITICAL

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| P-3 | **전문 자격/교육** | 반려동물종합관리사 등 관련 자격/교육 이수 필요 | `user.petCertification === false` | "반려동물 관련 자격이나 교육을 이수하세요. 동물보호법이 지속적으로 강화되고 있어 전문성이 필수입니다." | 교육비 30-100만원, 1-6개월 |
| P-4 | **시설 안전/위생 기준** | 사육/판매/미용 시설 기준 법정 요건. 현장 실사 대비 | `user.facilityInspection === false` | "반려동물 업종의 시설 위생기준을 충족하고, 현장 실사에 대비하세요." | 시설 정비 비용 상이 |

---

## X. Living Service (생활서비스) — `categoryId: "living-service"`

> 세탁소, 수선, 청소업 등. 상대적으로 진입장벽 낮으나 차별화 어려움

### BLOCKER

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| LS-1 | **업종별 영업신고** | 세탁업 등 일부 업종은 영업신고 필요 | 업종별 확인 | "선택하신 생활서비스 업종의 영업신고 요건을 확인하세요." | 무료-소액, 1-2주 |

### CRITICAL

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| LS-2 | **서비스 품질 표준화** | 서비스업은 품질 일관성이 핵심. 표준 없이는 불만 빈발 | `user.serviceStandard === null && monthsSinceOpening > 1` | "서비스 프로세스를 표준화하세요. 누가 하든 동일한 품질이 나와야 고객 신뢰가 쌓입니다." | 무료, 1-2주 |
| LS-3 | **1인 운영 한계 대비** | 서비스업 1인 의존도가 높을수록 이탈 리스크 증가. 본인 아프면 매출 0 | `user.employees === 0 && monthsSinceOpening > 3` | "1인 운영 시 본인의 건강/휴가에 따라 매출이 0이 될 수 있습니다. 최소 백업 인력을 확보하거나, 비상 시 대체 가능한 파트너를 찾아두세요." | 파트타이머 확보 비용 |

---

## XI. Space (공유오피스/스터디카페/코워킹) — `categoryId: "space"`

> 2025년부터 스터디카페 현금영수증 의무발행 업종 추가

### BLOCKER

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| SP-1 | **건축물 용도 확인** | 스터디카페/공유오피스 용도 적합성 | `user.buildingUsage` 미확인 | "공간 기반 사업의 건축물 용도 적합성을 반드시 확인하세요." | 확인 무료 |

### CRITICAL

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| SP-2 | **무인 운영 시스템** | 키오스크, 출입 관리, CCTV 등. 24시간 운영 시 필수 | `user.unmannedSystem === null && user.operatingHours === '24h'` | "무인 운영 시스템(키오스크, 출입관리, CCTV)을 구축하세요. 24시간 운영에는 필수입니다." | 300-1,000만원 |
| SP-3 | **현금영수증 의무발행 대비** | 2025년부터 스터디카페 의무발행업종. 미발급 시 가산세 20% | `user.cashReceiptSystem === false && user.category === 'study-cafe'` | "2025년부터 스터디카페는 현금영수증 의무발행 업종입니다. 10만원 이상 현금거래 시 미발급하면 가산세 20%가 부과됩니다." | 시스템 설정, 즉시 |

---

## XII. Startup/Tech — `categoryId: "startup-tech"`

> **업종 통계**: 스타트업 1년 내 실패율 약 20%, 5년 내 50%. 실패 원인 1위: 시장수요 부재(43%)
> 53%가 첫해 필요 자금을 과소추정

### BLOCKER (법인 설립 시)

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| ST-1 | **법인 설립 등기** | 투자 유치, 정부 지원 등에 법인 격이 필요한 경우 | `user.corporationType === null && user.needsInvestment` | "투자 유치나 정부 지원사업 참여를 계획한다면 법인 설립을 검토하세요. 주식회사가 일반적이며, 헬프미/ZUZU 등에서 간편하게 진행 가능합니다." | 50-100만원, 1-2주 |
| ST-2 | **사업자등록 (법인 설립 후 20일 이내)** | 법인 설립 후 20일 이내 필수. 미등록 시 세금계산서 발행 불가 | (C-1 참조) | (C-1 참조) | (C-1 참조) |

### CRITICAL

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| ST-3 | **CTO/기술 공동창업자** | 기술 스타트업에서 기술 리더 없이는 제품 개발 불가. 외주만으로는 반복적 개선 한계 | `user.team.cto === null && user.productType === 'tech'` | "기술 스타트업이라면 CTO 또는 기술 공동창업자가 필수입니다. 외주 개발만으로는 빠른 반복 개선과 기술적 의사결정이 어렵습니다." | 공동창업/지분 또는 연봉 5,000만-1억원+ |
| ST-4 | **MVP (최소기능제품)** | 완벽한 제품 대신 6-8주 내 MVP 출시가 핵심. MVP 없이 투자 유치 거의 불가 | `user.mvpStatus === null && monthsSinceOpening > 2` | "MVP를 먼저 만드세요. 2025년에 스타트업이 성공하는 방법은 빠른 MVP 출시입니다. 6-8주 내 핵심 기능만 담은 제품을 시장에 내놓으세요." | 500-5,000만원 (팀/외주), 6-8주 |
| ST-5 | **복식부기 장부 (법인 필수)** | 법인사업자는 복식부기 의무. 재무제표는 투자/대출/지원금 신청 시 필수 제출 서류 | `user.corporationType !== null && user.bookkeeping === null` | "법인은 복식부기 장부 작성이 필수입니다. 세무사를 선임하고 매월 기장을 맡기세요. 재무제표는 투자/대출/정부지원 신청 시 반드시 필요합니다." | 월 15-50만원 (세무기장) |
| ST-6 | **4대보험 + 원천세 신고 (급여 지급 시)** | 직원/대표 급여 지급 시 원천세 신고 + 4대보험 의무 | (C-4 참조) | (C-4 참조) | (C-4 참조) |

### IMPORTANT

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| ST-7 | **Product-Market Fit 검증** | 실패 원인 1위(43%)가 시장수요 부재. 고객 인터뷰 없이 제품만 만드는 것이 가장 위험 | `user.customerInterviews < 10 && user.mvpStatus === 'building'` | "제품 개발 전/중에 최소 10명 이상의 잠재 고객과 인터뷰하세요. 스타트업 실패 원인 1위는 시장수요 부재(43%)입니다." | 무료, 2-4주 |
| ST-8 | **현금 소진율(Burn Rate) 관리** | 53%가 필요 자금 과소추정. 최소 6개월 운영자금 확보 필수 | `user.cashRunway < 6` | "현재 현금 소진율 기준으로 잔여 운영 기간이 {months}개월입니다. 최소 6개월의 런웨이를 확보하세요." | 자금 확보 필요 |
| ST-9 | **지식재산권 (특허/상표)** | 핵심 기술/브랜드 보호. 투자 유치 시 IP 보유 여부 확인 | `user.ipProtection === null && monthsSinceOpening > 6` | "핵심 기술이나 브랜드명에 대한 지식재산권을 검토하세요. 특허/상표 출원은 시간이 걸리므로 일찍 시작하는 것이 좋습니다." | 상표 출원 20-50만원, 특허 100-300만원 |

### NICE-TO-HAVE

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| ST-10 | **정부 지원사업/액셀러레이터** | 초기 자금 확보 + 멘토링 | 법인 설립 후 | "정부 창업지원사업(예비창업패키지, 초기창업패키지 등)이나 액셀러레이터 프로그램을 검토하세요." | 무료, 지원금 최대 1억원 |

---

## XIII. Franchise (프랜차이즈 — 모든 업종 해당) — 추가 레이어

> 프랜차이즈 가맹 시 공통 업종 prerequisites에 추가로 적용

### BLOCKER

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| FR-1 | **정보공개서 수령 + 14일 검토** | 가맹거래법 위반 시 가맹계약 무효 가능. 본부는 정보공개서 제공 후 14일 경과 전 가맹금 수령/계약 체결 금지 | `user.franchiseType !== null && user.disclosureReviewDays < 14` | "정보공개서를 수령한 후 최소 14일간 검토하세요. 14일이 지나지 않은 상태에서 가맹금을 납부하거나 계약을 체결하면 법 위반이며, 계약이 무효가 될 수 있습니다." | 무료, 14일 필수 |
| FR-2 | **정보공개서 핵심 항목 확인** | 가맹점 평균매출, 폐업률, 계약갱신율, 법적제재이력, 필수물품 공급조건, 위약금 조항 | `user.disclosureChecklist.incomplete` | "정보공개서에서 반드시 확인할 항목: (1) 가맹점 평균매출과 표준편차, (2) 가맹점 폐업률, (3) 필수물품 공급 조건과 가격, (4) 계약 갱신/해지 조건, (5) 위약금 조항. 공정거래위원회 사이트에서 정보공개서를 조회할 수 있습니다." | 무료 |
| FR-3 | **인근 가맹점 현황문서** | 가맹본부가 의무적으로 제공해야 하는 서류 | `user.nearbyFranchiseInfo === false` | "가맹본부에 인근 가맹점 현황문서를 요청하세요. 본부는 의무적으로 제공해야 합니다." | 무료 |

### CRITICAL

| # | Item | Why Critical | Detection Signal | AI Response | Cost/Time |
|---|------|-------------|-----------------|-------------|-----------|
| FR-4 | **기존 가맹점주 3명 이상 직접 방문/인터뷰** | 정보공개서 숫자만으로는 현실 파악 불가. 실제 운영자 경험이 가장 정확한 정보 | `user.franchiseeInterviews < 3` | "기존 가맹점주 최소 3명을 직접 방문하고 인터뷰하세요. '실제 순수익이 얼마인지', '본부 지원이 제대로 되는지', '계약서에 없는 추가 비용이 있는지' 확인하세요." | 무료, 1-2주 |
| FR-5 | **총투자비용 정확 산출** | 가맹비+보증금+인테리어+장비+초도물량+운전자금. 본부 제시 금액은 최소치인 경우 다수 | `user.totalInvestmentCalculated === false` | "총투자비용을 정확히 산출하세요. 가맹비 외에 인테리어, 장비, 초도물량, 3-6개월 운전자금까지 포함해야 합니다. 본부 제시 금액의 120-130%를 예상하세요." | 무료, 분석 시간 |

---

## XIV. AI Detection Logic Summary (구현 가이드)

### Priority Evaluation Order

AI가 사용자의 상태를 진단할 때 아래 순서로 확인:

```
1. BLOCKER 확인 (업종 공통 C-1~C-3 → 업종별 BLOCKER)
   → 하나라도 미충족이면 다른 모든 조언보다 이것을 최우선으로 안내
   → "이것 없이는 합법적으로 영업할 수 없습니다" 톤

2. CRITICAL 확인 (업종 공통 C-4~C-8 → 업종별 CRITICAL)
   → "1-3개월 내 심각한 문제가 될 수 있습니다" 톤
   → BLOCKER가 모두 해결된 후에만 이 레벨 항목 안내

3. IMPORTANT 확인
   → "지금은 괜찮지만 성장을 위해 필요합니다" 톤
   → CRITICAL까지 해결된 후 안내

4. NICE-TO-HAVE
   → "여유가 되실 때 검토해보세요" 톤
```

### Detection Signal Mapping

```typescript
// 사용자 프로필에서 확인할 핵심 데이터 포인트
interface PrerequisiteCheckData {
  // Cross-cutting
  businessRegistrationNumber: string | null;
  businessLicenseType: string | null;
  buildingUsage: string | null;
  employees: number;
  socialInsurance: boolean;
  taxAccountant: string | null;
  businessBankAccount: string | null;
  paymentSystem: string | null;
  insurance: {
    fire: boolean;
    liability: boolean;
    educationLiability: boolean;
  };

  // Food specific
  hygieneCertification: boolean;
  healthCertificates: number;
  fireSafetyCertificate: boolean;
  suppliers: { count: number; coffee?: string | null };
  deliveryApps: string[];
  foodCostRatio: number | null;

  // Online specific
  mailOrderRegistration: boolean;
  escrowCertificate: boolean;
  privacyPolicy: boolean;
  sslCertificate: boolean;
  pgProvider: string | null;
  shippingProvider: string | null;
  returnPolicy: string | null;

  // Beauty specific
  beautyLicense: boolean;
  sanitaryEducation: boolean;

  // Fitness specific
  sportsFacilityRegistration: boolean;
  sportsInstructorCertified: boolean;
  safetyEducation: boolean;

  // Education specific
  educationRegistration: boolean;

  // Startup specific
  corporationType: string | null;
  mvpStatus: string | null;
  cashRunway: number; // months
  customerInterviews: number;

  // Franchise layer
  franchiseType: string | null;
  disclosureReviewDays: number;
  franchiseeInterviews: number;
  totalInvestmentCalculated: boolean;

  // General
  monthsSinceOpening: number;
  categoryId: string;
  onlinePresence: { naverPlace: boolean };
  reviewScore: number;
  salesRecords: { count: number };
}
```

### Key Statistics Reference

| Metric | Value | Source |
|--------|-------|--------|
| 자영업 1년 내 폐업률 | 22% | 한국경제(2025) |
| 자영업 3년 생존율 | 52.3% | 100대 생활업종 통계 |
| 자영업 5년 생존율 | 40.2% | 100대 생활업종 통계 |
| 2024년 총 폐업자 수 | 100만 8,282명 | 사상 최초 100만 돌파 |
| 카페 5년 생존율 | 26% | 커피전문점 통계 |
| 미용실 1년 생존율 | 91.6% | 업종별 1위 |
| 스타트업 실패 원인 1위 | Product-Market Fit 부재 (43%) | CB Insights |
| 스타트업 자금 과소추정 비율 | 53% | US Chamber |
| 음식점 연간 폐업 | 15만 2,785건 | 2024 |
| 소매업 연간 폐업 | 29만 9,642건 | 2024, 업종 1위 |
| 배달앱 실질 수수료 | 매출의 25-30% | 2025, 수수료+배달비+결제수수료+부가세 합산 |
| 재고 미관리 시 매출 손실 | 최대 11% | SAP/글로벌 통계 |
| 식재료 적정 원가율 | 28-33% | 외식업계 기준 |
| 카페 1인 운영 월 소득 | 약 400만원 / 13시간 근무 | 아시아경제(2025) |

---

## XV. Sources

### Government/Official
- [찾기쉬운 생활법령정보 - 음식점 창업](https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=839)
- [찾기쉬운 생활법령정보 - 미용실 창업](https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=1009)
- [찾기쉬운 생활법령정보 - 체육시설](https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=1453)
- [찾기쉬운 생활법령정보 - 학원 설립](https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=1140)
- [찾기쉬운 생활법령정보 - 프랜차이즈](https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=647)
- [정부24 - 식품관련영업신고](https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=14600000021)
- [정부24 - 체육시설업 신고](https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=13700000094)
- [국세청 - 현금영수증 의무발행](https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7796)
- [행정안전부 - 재난배상책임보험](https://www.mois.go.kr/frt/sub/a06/b11/disasterGuarantee/screen.do)
- [공정거래위원회 - 정보공개서](https://www.kofair.or.kr/home/content.do?menu_cd=000023)

### Industry/Media
- [한국외식업중앙회 - 식품위생교육](https://www.foodservice.or.kr/hygiene_edu/new_business/education_guide/)
- [한국경제 - 자영업자 폐업률 통계](https://www.hankyung.com/article/2025110286751)
- [아시아경제 - 카페 1인 운영 현실](https://www.asiae.co.kr/article/2025120521065809502)
- [한솥창업매거진 - 2025 배달 수수료 비교](https://franchise.hsd.co.kr/magazine/?bmode=view&idx=166846339)
- [토스페이먼츠 - 통신판매업 신고 방법](https://www.tosspayments.com/blog/articles/sales-registration)
- [헬프미 - 법인설립 후 필수 체크리스트](https://www.help-me.kr/blog/article/법인설립후필수체크리스트5가지)
- [CB Insights - Why Startups Fail](https://www.cbinsights.com/research/report/startup-failure-reasons-top/)
- [Square - How To Open a Restaurant](https://squareup.com/us/en/the-bottom-line/starting-your-business/start-a-restaurant)
- [Shopify - Ecommerce Laws](https://www.shopify.com/blog/ecommerce-laws)
- [Salesforce - Retail Inventory Management](https://www.salesforce.com/retail/cloud-pos/retail-inventory-management/)
