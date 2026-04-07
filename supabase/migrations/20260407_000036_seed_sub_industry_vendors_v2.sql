-- ═══════════════════════════════════════════════════════
--  세부업종별 공급업체/도구 추천 확장 (22개 세부업종)
--  startup-tech 6개 (완전 신규) + 비스타트업 16개 (범용→전용)
-- ═══════════════════════════════════════════════════════

-- ── STARTUP-TECH: ai-application ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('startup-tech', 'ai-application', 'all', 'equipment',
 'GPU 클라우드 & ML 인프라',
 'VESSL AI(한국), Lambda Cloud, AWS SageMaker 등 GPU 클라우드 및 ML 학습 인프라. 초기에는 Colab Pro로 시작 가능',
 ARRAY['GPU 시간당 비용 비교 (A100 기준)', 'Spot 인스턴스 지원 여부', '한국 리전 유무 (지연시간)', '자동 스케일링 지원', 'W&B/MLflow 연동'], 0),
('startup-tech', 'ai-application', 'all', 'supplies',
 '데이터 라벨링 & 수집',
 'Scale AI, Labelbox, 크라우드웍스(한국) 등 데이터 라벨링 플랫폼. 품질 관리와 비용 효율이 핵심',
 ARRAY['라벨링 품질 검수 프로세스', '한국어 데이터 지원 여부', '건당 비용 vs 시간당 비용', 'API 연동 가능 여부', '보안/NDA 체결'], 1),
('startup-tech', 'ai-application', 'all', 'tools',
 '모델 서빙 & 배포',
 'BentoML, Replicate, Hugging Face Inference 등 모델 서빙 플랫폼. 프로토타입은 Replicate, 프로덕션은 자체 서빙 권장',
 ARRAY['지연시간(Latency) 요구사항', 'Auto-scaling 지원', 'GPU/CPU 선택 유연성', '비용 구조 (요청당 vs 시간당)', '모니터링 대시보드'], 2);

-- ── STARTUP-TECH: b2b-saas ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('startup-tech', 'b2b-saas', 'all', 'tools',
 'CRM & 고객 관리',
 'Relate(한국, 스타트업 특화), HubSpot(스타트업 90% 할인), Pipedrive 등. 초기에는 Notion으로 대체 가능',
 ARRAY['스타트업 할인 프로그램 확인', '한국어 지원 여부', '이메일/캘린더 연동', 'API 연동 가능 여부', '팀 규모별 가격 비교'], 0),
('startup-tech', 'b2b-saas', 'all', 'equipment',
 '빌링 & 결제 인프라',
 'Paddle(글로벌 MoR 모델), Stripe, 토스페이먼츠(국내). SaaS 구독 빌링은 초기부터 자동화 필요',
 ARRAY['구독 관리 기능 (업그레이드/다운그레이드)', '세금계산서 자동 발행', '다국적 결제 지원', '수수료 비교 (2-4%)', '무료 체험 기간 관리'], 1),
('startup-tech', 'b2b-saas', 'all', 'management',
 '제품 분석 & 사용자 추적',
 'Amplitude(스타트업 무료), Mixpanel, PostHog(오픈소스). PMF 검증에 필수',
 ARRAY['이벤트 추적 설계 가이드', '퍼널 분석 기능', 'Retention 분석', 'A/B 테스트 지원', '데이터 내보내기'], 2);

-- ── STARTUP-TECH: developer-tools ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('startup-tech', 'developer-tools', 'all', 'tools',
 'CI/CD & DevOps',
 'GitHub Actions(무료 티어), GitLab CI, CircleCI. 코드 품질과 배포 속도를 자동화',
 ARRAY['무료 빌드 시간 비교', '자체 호스팅 러너 지원', 'Docker/K8s 지원', '병렬 빌드 성능', '시크릿 관리'], 0),
('startup-tech', 'developer-tools', 'all', 'management',
 '모니터링 & 옵저버빌리티',
 'Datadog, Grafana+Prometheus(오픈소스), New Relic. 장애 감지와 성능 모니터링 필수',
 ARRAY['로그/메트릭/트레이스 통합', '알림 채널 (Slack/PagerDuty)', '비용 구조 (호스트당 vs 데이터량)', 'APM 지원 범위', '대시보드 커스터마이징'], 1),
('startup-tech', 'developer-tools', 'all', 'supplies',
 'API 문서 & 개발자 포털',
 'Mintlify, GitBook, ReadMe. 개발자 도구는 문서가 곧 마케팅',
 ARRAY['API 레퍼런스 자동 생성', '코드 샘플 지원 언어', '검색 기능 품질', 'GitHub 연동', '커스텀 도메인'], 2);

-- ── STARTUP-TECH: fintech-startup ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('startup-tech', 'fintech-startup', 'all', 'equipment',
 '결제 & 금융 API',
 '토스페이먼츠(3.4%), NHN KCP(시장점유율 1위), 포트원(멀티PG 통합). 핀테크는 결제 인프라가 핵심',
 ARRAY['PG 수수료 비교', '정산 주기 (D+1~D+5)', 'API 문서 품질', '테스트 환경 제공', '기술 지원 응답 시간'], 0),
('startup-tech', 'fintech-startup', 'all', 'management',
 '금융 데이터 & 규제 컨설팅',
 '쿠콘(금융 데이터 API), CODEF(스크래핑). KISA ISMS 인증은 금융 서비스 필수',
 ARRAY['마이데이터 사업자 등록 요건', 'ISMS-P 인증 범위 확인', '전자금융업 등록 절차', '금융위 규제 샌드박스 신청', '보안 취약점 점검 일정'], 1),
('startup-tech', 'fintech-startup', 'all', 'supplies',
 '보안 인증 & 컴플라이언스',
 'KISA ISMS 컨설팅, 금융보안원 자체점검. 핀테크는 보안 인증 없이 서비스 불가',
 ARRAY['ISMS-P vs ISMS 차이 확인', '인증 소요 기간 (3-6개월)', '컨설팅 비용 (2천만-5천만)', '연간 갱신 절차', '내부 보안 담당자 필요 여부'], 2);

-- ── STARTUP-TECH: healthtech-startup ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('startup-tech', 'healthtech-startup', 'all', 'equipment',
 'EMR/EHR 연동 & 의료 데이터',
 '유비케어 EMR API, HL7 FHIR 표준, 건강보험심사평가원 공공데이터. 의료 데이터 규제 이해 필수',
 ARRAY['HL7 FHIR 표준 준수 여부', '개인정보보호법 의료 데이터 조항', 'IRB 승인 필요 여부', 'EMR 연동 가능 병원 수', '데이터 비식별화 처리'], 0),
('startup-tech', 'healthtech-startup', 'all', 'management',
 '의료기기 인허가 (MFDS)',
 '식약처(MFDS) 의료기기 소프트웨어 인허가. SaMD 등급 분류에 따라 절차 상이',
 ARRAY['SaMD 위험 등급 분류 (1-4등급)', '기술문서 작성 범위', '임상시험 필요 여부', '인허가 소요 기간 (6-18개월)', '해외 인증 (FDA, CE) 병행 검토'], 1),
('startup-tech', 'healthtech-startup', 'all', 'supplies',
 '클라우드 의료 인프라',
 'AWS HealthLake, Google Cloud Healthcare API. HIPAA/PIPA 준수 클라우드 필수',
 ARRAY['의료 데이터 전용 리전 확인', '암호화 (저장 시 + 전송 시)', '접근 로그 감사 기능', '재해 복구 (DR) 계획', 'BAA 계약 체결'], 2);

-- ── STARTUP-TECH: security-startup ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('startup-tech', 'security-startup', 'all', 'equipment',
 '보안 인증 자동화',
 'Vanta, Drata (SOC2 자동화), KISA ISMS-P. 보안 스타트업은 자체 인증이 신뢰 기반',
 ARRAY['SOC2 Type I vs Type II 차이', 'ISMS-P 인증 범위 설정', '자동 증거 수집 기능', '연간 비용 비교', '고객 신뢰도 영향'], 0),
('startup-tech', 'security-startup', 'all', 'tools',
 '취약점 스캐닝 & 펜테스트',
 'Snyk(코드 보안), Burp Suite(웹 취약점), CrowdStrike(EDR). 제품에 보안 내재화 필수',
 ARRAY['SAST/DAST/SCA 커버리지', 'CI/CD 파이프라인 통합', '오탐률(False Positive) 수준', '취약점 우선순위 분류', '리포팅 기능'], 1),
('startup-tech', 'security-startup', 'all', 'management',
 '보안 관제 & SOC',
 'Igloo Security(한국 SIEM), SK쉴더스, 안랩 MDS. 관제 서비스는 직접 구축 vs 외주 판단 필요',
 ARRAY['24/7 관제 가능 여부', '한국어 대응팀 유무', 'SIEM 로그 수집 범위', '사고 대응 SLA', '비용 구조 (월정액 vs 이벤트당)'], 2);

-- ── STARTUP-TECH: 공통 서비스 ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('startup-tech', NULL, 'all', 'interior',
 '공유오피스 & 워크스페이스',
 'FastFive(국내 1위, WeWork 대비 10-30% 저렴), SparkPlus, WeWork. 초기에는 공유오피스, 10명+ 시 전용 사무실 검토',
 ARRAY['1인당 월 비용 비교', '회의실 무료 사용 시간', '24시간 출입 가능 여부', '주소지 등록 가능(사업자등록)', '네트워킹 프로그램'], 0),
('startup-tech', NULL, 'all', 'management',
 '법률 & 특허 서비스',
 '법무법인 세움/스타트로/인평(스타트업 특화). 특허는 위시특허/상상특허. 창업 3년 이하 KIPO 수수료 70% 감면',
 ARRAY['스타트업 정관/주주간계약 경험', '투자계약 검토 실적', '특허 출원 비용 (50-150만원)', 'KIPO 감면 대상 여부', '월 자문 계약 vs 건별 계약'], 1),
('startup-tech', NULL, 'all', 'supplies',
 '채용 & 외주 플랫폼',
 '원티드(개발자), 로켓펀치(스타트업), 위시켓(외주개발). 초기에는 외주 + 핵심인력 직접 채용 병행',
 ARRAY['채용 수수료 비교 (연봉 5-15%)', '외주 단가 (프론트/백엔드/디자인)', '계약 형태 (도급 vs 파견)', '포트폴리오 검증 방법', 'NDA/IP 양도 계약'], 2);

-- ── FOOD: delivery-meals (배달 전문점) ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('food', 'delivery-meals', 'all', 'packaging',
 '배달 전용 포장재 업체',
 '착한포장, WJ패키지, 배민상회 등 배달 전용 포장재. 로고 인쇄와 보온성이 핵심',
 ARRAY['최소 주문량 확인 (100-500개)', '로고 인쇄 가능 여부 및 비용', '보온/보냉 성능 테스트', '친환경 소재 옵션 (일회용 규제)', '납품 리드타임 (3-7일)'], 0),
('food', 'delivery-meals', 'all', 'ingredient',
 '배달 전문 식자재 유통',
 '식봄(익일배송), 푸디스트(대규모), 배민상회(원스톱). 배달 전문점은 반조리 식자재로 효율 극대화',
 ARRAY['반조리/밀키트 식자재 라인업', '익일 새벽 배송 가능 여부', '최소 주문 금액', '반품/교환 정책', '월 정산 가능 여부'], 1);

-- ── FOOD: ramen-noodle (라면/면류) ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('food', 'ramen-noodle', 'all', 'equipment',
 '제면기 & 면류 설비',
 '나비드쿡(업소용 제면기), 태흥엔지니어링(제면설비). 자가 제면 시 원가 30-40% 절감 가능',
 ARRAY['일 생산량 (100-500인분)', '면 종류 호환성 (우동/라멘/파스타)', '설치 공간 요구사항', 'A/S 대응 시간', '렌탈 vs 구매 비용 비교'], 0),
('food', 'ramen-noodle', 'all', 'ingredient',
 '면류 전문 식자재',
 '푸딩팩토리, 식봄 면류 카테고리. 육수용 원재료(돈골, 닭뼈)는 정육점 직거래가 유리',
 ARRAY['육수 원재료 직거래 가격 비교', '면 도매 단가 (자가제면 vs 완제면)', '양념/소스 OEM 가능 여부', '냉동면 vs 생면 품질 비교', '정기 배송 주기 설정'], 1);

-- ── FOOD: salad-healthy (샐러드/건강식) ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('food', 'salad-healthy', 'all', 'ingredient',
 '신선채소 & 건강식 식자재',
 '포켓샐러드(신선채소 전문), 아워푸드(B2B), 로컬 농가 직거래. 신선도가 곧 품질',
 ARRAY['당일 수확·당일 배송 가능 여부', 'GAP 인증 농가 여부', '유기농/무농약 인증 확인', '최소 주문량 (소량 가능 여부)', '계절별 가격 변동 대비'], 0),
('food', 'salad-healthy', 'all', 'packaging',
 '친환경 샐러드 전용 포장재',
 '센스팩, 파피루스몰, 서울포장. 샐러드 전용 투명 용기 + 친환경 소재 필수',
 ARRAY['PLA/사탕수수 친환경 소재', '투명도 (내용물 시인성)', '드레싱 별도 용기 호환', '밀봉 성능 (배달 시 누출 방지)', '소량 주문 가능 여부'], 1);

-- ── CAFE: specialty-coffee (스페셜티커피) ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('cafe-dessert', 'specialty-coffee', 'all', 'ingredient',
 '스페셜티 원두 로스터리',
 '엘카페, 모모스커피, 프릳츠 등 국내 스페셜티 로스터리. 직접 로스팅 vs 납품 로스터리 결정 필요',
 ARRAY['원두 원산지 및 등급 (SCA 85+)', '로스팅 프로파일 커스터마이징', '소량 주문 가능 여부 (5kg 단위)', '샘플 로스팅 제공', '교육/트레이닝 지원'], 0),
('cafe-dessert', 'specialty-coffee', 'all', 'equipment',
 '커피 장비 (에스프레소 머신·그라인더)',
 'DH몰(장비+컨설팅), 엘로치오/오월에(국산 머신). 초기 투자비 2,000-5,000만원',
 ARRAY['머신 가격 대비 추출 품질', '그라인더 버(Burr) 종류', 'A/S 네트워크 (전국 출장 수리)', '렌탈 vs 구매 비용 비교', '바리스타 교육 포함 여부'], 1);

-- ── CAFE: bakery-studio (베이커리) ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('cafe-dessert', 'bakery-studio', 'all', 'ingredient',
 '제과·제빵 재료 도매',
 '빵도사(40년 전통), 비앤씨마켓(새벽배송), 진보람몰(재료+도구+포장). 밀가루/버터는 대량 구매 시 30%+ 절감',
 ARRAY['밀가루/버터 대량 구매 단가', '새벽 배송 가능 지역', '냉장/냉동 배송 품질', '유통기한 관리', '월 정산 가능 여부'], 0),
('cafe-dessert', 'bakery-studio', 'all', 'equipment',
 '제과 장비 (오븐·믹서·발효기)',
 '베이킹맘(장비+재료), 주방뱅크. 데크 오븐 vs 컨벡션 오븐 선택이 핵심',
 ARRAY['오븐 종류 (데크/컨벡션/콤비)', '일 생산량 대비 용량', '전기 용량 확인 (3상 380V)', '반죽기 용량 (20L-60L)', 'A/S 및 부품 수급'], 1);

-- ── BEAUTY: nail-studio (네일아트) ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('beauty', 'nail-studio', 'all', 'supplies',
 '네일 재료 도매',
 '더네일샵/경안사(도매전용), 네일판다몰(소모품), 사라센(브랜드). 젤/파우더 품질이 시술 만족도 직결',
 ARRAY['젤 종류별 단가 비교 (하드/소프트)', '컬러 라인업 다양성', '알러지 테스트 인증', '최소 주문 금액', '신제품 샘플 제공'], 0),
('beauty', 'nail-studio', 'all', 'equipment',
 '네일 장비 & 가구',
 '배배뷰티(장비+재료), 네일몰. UV/LED 램프, 드릴 머신, 시술 테이블 등',
 ARRAY['LED 램프 파장 (405nm 추천)', '드릴 머신 RPM 범위', '시술 테이블 인체공학 디자인', '흡진기 성능 (분진 차단율)', '의자 높이 조절 범위'], 1);

-- ── BEAUTY: skin-care-room (피부관리) ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('beauty', 'skin-care-room', 'all', 'equipment',
 '피부관리 기기',
 '씨라인메디랩(국산 제조), 나도미인(기기 비교 플랫폼). 갈바닉, 고주파, LED 등 기기 선택이 핵심',
 ARRAY['기기 안전 인증 (KC/CE)', '시술 효과 임상 데이터', '소모품 교체 주기 및 비용', 'A/S 보증 기간', '렌탈 vs 구매 비교'], 0),
('beauty', 'skin-care-room', 'all', 'supplies',
 '관리용 화장품 & 소모품',
 '웰뷰, 우진코스메틱(관리용 화장품), 올스킨뷰티(창업 컨설팅 포함). 전문가용 제품은 일반 화장품과 유통 채널 다름',
 ARRAY['KFDA 기능성 화장품 인증', '대용량 전문가용 라인', '피부 타입별 라인업', '마진율 (도매가 대비)', '샘플 제공 여부'], 1);

-- ── FITNESS: yoga-studio (요가) ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('fitness', 'yoga-studio', 'all', 'equipment',
 '요가 소품 & 매트',
 '요가몰(센터 도매 할인), 만두카(프리미엄), 소울매트(천연고무). 매트 품질이 수업 만족도에 직결',
 ARRAY['매트 두께 (4-6mm 권장)', '미끄럼 방지 성능', '친환경 소재 (천연고무/TPE)', '센터용 대량 할인율', '블록/스트랩/볼스터 세트 구성'], 0),
('fitness', 'yoga-studio', 'all', 'management',
 '요가 스튜디오 예약 시스템',
 '클래스패스, 네이버 예약, 미니소프트(요가 특화). 수업 관리+결제+출석을 한번에',
 ARRAY['수업 일정 관리 기능', '온라인 결제 연동', '회원 출석 체크 (QR/앱)', '시범 레슨 예약 관리', '월 이용료 비교'], 1);

-- ── FITNESS: pt-gym (PT/헬스장) ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('fitness', 'pt-gym', 'all', 'equipment',
 '헬스장 기구 & 장비',
 '고핏코리아(창업 원스톱), 스포플렉스(종합 장비), 바디엑스(전문 장비). 기구 품질이 회원 만족도와 안전에 직결',
 ARRAY['기구 내구성 (상업용 등급)', '설치 공간 레이아웃 설계', '렌탈 vs 구매 비용 비교', '보증 기간 및 A/S', '중고 장비 시장 가격 확인'], 0),
('fitness', 'pt-gym', 'all', 'supplies',
 '소모품 & 부가 장비',
 '반석스포츠, 바디채널. 수건, 음수대, 락커 등 부대 시설과 운영 소모품',
 ARRAY['수건 세탁 외주 vs 자체 비용', '락커 키 시스템 (전자식 추천)', '음수대/정수기 렌탈 비교', '청소 용품 월 소모량', '바닥재 (충격 흡수 매트)'], 1);

-- ── RETAIL: lifestyle-goods (라이프스타일 편집샵) ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('retail', 'lifestyle-goods', 'all', 'sourcing',
 '편집샵 상품 소싱 채널',
 '도매매/셀파이(B2B 위탁판매), 소소홈/강낭콩(인테리어 소품 도매). 위탁 vs 직매입 혼합 전략 권장',
 ARRAY['위탁 수수료율 비교 (15-30%)', '최소 발주 수량 (MOQ)', '반품 조건 확인', '신상품 업데이트 주기', '독점 계약 가능 여부'], 0),
('retail', 'lifestyle-goods', 'all', 'display',
 '진열 집기 & 디스플레이',
 '이케아 비즈니스, 한샘 프로, 남대문 집기 도매. 편집샵은 진열이 곧 마케팅',
 ARRAY['매장 컨셉에 맞는 소재 (우드/메탈/아크릴)', '모듈형 진열대 (레이아웃 변경 용이)', '조명 연출 (스팟/간접조명)', '가격표/POP 디자인', '월별 디스플레이 교체 계획'], 1);

-- ── RETAIL: unmanned-retail (무인매장) ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('retail', 'unmanned-retail', 'all', 'equipment',
 '무인매장 키오스크 & 결제 시스템',
 '하나시스(AI 무인매장, K-기술대상), 포스뱅크(키오스크 OEM). 무인 결제 안정성이 핵심',
 ARRAY['키오스크 결제 오류율', '현금/카드/QR 복합 결제', '재고 연동 기능', '원격 모니터링 대시보드', '야간 운영 안정성'], 0),
('retail', 'unmanned-retail', 'all', 'management',
 '원격 관리 & 보안',
 '에어포스(IoT 원격제어), SK쉴더스(보안). CCTV + 출입 관리 + 재고 모니터링 통합',
 ARRAY['CCTV 실시간 모니터링', '출입문 자동 잠금 시스템', '재고 감지 센서 (중량/비전)', '이상 감지 시 알림 (앱/SMS)', '보험 가입 (도난/파손)'], 1);

-- ── SPACE: shared-office (공유오피스) ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('space', 'shared-office', 'all', 'equipment',
 '사무가구 & 인테리어',
 '한국오피스, 퍼스트사무용가구, 오피스보이. B2B 도매가로 30-50% 절감 가능',
 ARRAY['책상/의자 인체공학 인증', '파티션/부스 방음 성능', '전원/USB 콘센트 배치', '모듈형 가구 (확장 용이)', 'B2B 대량 할인율'], 0),
('space', 'shared-office', 'all', 'management',
 '공유오피스 운영 플랫폼',
 '패스트파이브 솔루션, 스페이스클라우드. 예약/결제/출입/회의실 관리 통합',
 ARRAY['좌석 예약 시스템', '회의실 시간제 과금', '출입 카드/앱 연동', '월 정산/세금계산서 자동 발행', '입주사 커뮤니티 기능'], 1);

-- ── SPACE: party-room (파티룸) ──
INSERT INTO vendor_recommendations (category_id, sub_industry_id, startup_type, vendor_type, title, description, check_items, priority)
VALUES
('space', 'party-room', 'all', 'supplies',
 '파티 용품 & 데코',
 '조이파티B2B, 파티러쉬B2B(도매), 파티짱(시즌 소품). 테마별 소품 세트가 회전율을 높임',
 ARRAY['시즌별 인기 테마 세트 구성', '풍선/배너/테이블웨어 도매가', '재사용 가능 소품 비율', '소품 보관/정리 시스템', '월별 소모품 예산 책정'], 0),
('space', 'party-room', 'all', 'equipment',
 '음향/영상 장비 & 가전',
 '소꿉노리, 남대문미화(인테리어 소품). 블루투스 스피커, 프로젝터, 빔, 조명 등',
 ARRAY['블루투스 스피커 출력 (30W+)', '프로젝터 밝기 (3000+ 루멘)', 'LED 조명 색상 변경 기능', 'TV/모니터 크기 (55"+)', '노래방 기기 렌탈 비용'], 1);
