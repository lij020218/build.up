-- ═══════════════════════════════════════════════════════════════════════════
--  인테리어 가이드 확장 v3: GROUP 5 (Retail) + GROUP 6 (Space) + GROUP 7 (Startup-tech)
--  각 세부업종: 자재 6개 + 디자인 컨셉 3개
--  기존 v2 데이터와 중복되지 않도록 추가 자재/컨셉만 INSERT
--  출처: 한국/미국 2025 인테리어 트렌드, 업종별 전문 매체, 글로벌 디자인 리서치
-- ═══════════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  GROUP 5 — RETAIL                                            ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- ══════════════════════════════════════════
--  1. lifestyle-goods (라이프스타일 편집샵)
--     기존 v2: 모듈형 진열 선반(material), 갤러리형 편집샵(concept)
--     추가: 자재 5개 + 컨셉 2개 = 총 6 materials + 3 concepts
-- ══════════════════════════════════════════

INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
-- 자재 2: 스팟 조명 & 트랙 레일
('retail', 'lifestyle-goods', 'material', '스팟 조명 & 트랙 레일', 'Spot Lighting & Track Rail', '상품별 포인트 조명 연출에 필수. 트랙 레일에 스팟을 자유롭게 이동·추가. 3000K 따뜻한 톤 권장', 'Essential for product-specific accent lighting. Freely move/add spots on track rail. 3000K warm tone recommended', 'Lightbulb', '{"조명", "편집샵", "연출"}', NULL, NULL, '트랙 5m 기준 30~80만원', '글로벌 2025', 2),

-- 자재 3: 디스플레이 테이블 (원목/스틸)
('retail', 'lifestyle-goods', 'material', '디스플레이 테이블', 'Display Table (Wood/Steel)', '매장 중앙 시선 집중용 테이블. 원목 슬랩 또는 스틸 프레임+유리 상판. 큐레이션 핵심 가구', 'Central eye-catching table. Wood slab or steel frame + glass top. Core curation furniture piece', 'Layers', '{"가구", "진열", "큐레이션"}', NULL, NULL, '테이블당 30~120만원', '글로벌 2025', 3),

-- 자재 4: 피팅룸 (거울+조명)
('retail', 'lifestyle-goods', 'material', '피팅룸 (전신 거울+조명)', 'Fitting Room (Full Mirror + Lighting)', '패션 편집샵 필수. 넓은 전신 거울 + 연색성 높은 조명(CRI 90+). 커튼 또는 슬라이딩 도어', 'Essential for fashion select shops. Full-length mirror + high CRI 90+ lighting. Curtain or sliding door', 'Star', '{"피팅룸", "패션", "거울"}', NULL, NULL, '부스당 50~150만원', '한국 2025', 4),

-- 자재 5: 체크아웃 카운터 (POS 통합)
('retail', 'lifestyle-goods', 'material', 'POS 통합 체크아웃 카운터', 'POS-Integrated Checkout Counter', '결제 + 포장 + 고객 소통 공간. 심플한 디자인에 POS·태블릿·쇼핑백 수납 통합', 'Payment + wrapping + customer interaction space. Simple design integrating POS, tablet, and bag storage', 'Monitor', '{"카운터", "결제", "POS"}', NULL, NULL, '세트 80~200만원', '한국 2025', 5),

-- 자재 6: 윈도우 디스플레이 (쇼윈도)
('retail', 'lifestyle-goods', 'material', '윈도우 디스플레이 (쇼윈도)', 'Window Display (Showcase)', '편집샵의 첫인상. 시즌별 테마 연출이 가능한 쇼윈도 공간. LED 간접조명 + 마네킹/소품 배치', 'The first impression of a select shop. Seasonal themed showcase space. LED ambient lighting + mannequins/props', 'Star', '{"외부", "쇼윈도", "첫인상"}', NULL, NULL, '100~300만원', '글로벌 2025', 6),

-- 컨셉 2: 라이프스타일 부티크
('retail', 'lifestyle-goods', 'concept', '라이프스타일 부티크', 'Lifestyle Boutique', '우드+패브릭+식물 조합. 집처럼 편안한 공간에서 상품을 자연스럽게 체험. 체류시간 극대화', 'Wood + fabric + plants combination. Products experienced naturally in home-like comfortable space. Maximizes dwell time', 'Home', '{"라이프스타일", "부티크", "체험"}', '{"체류시간 증가로 구매 전환율 향상", "라이프스타일 제안으로 객단가 상승", "충성 고객 형성", "SNS 공유 유도"}', '{"넓은 면적 필요 (30평+)", "계절별 디스플레이 변경 비용", "가구·소품 관리 부담"}', '평당 150~250만원', '글로벌 2025', 2),

-- 컨셉 3: 인더스트리얼 큐레이션 스토어
('retail', 'lifestyle-goods', 'concept', '인더스트리얼 큐레이션 스토어', 'Industrial Curation Store', '노출 콘크리트+메탈 선반+파이프 행거. 스트릿 패션·리빙 편집샵에 최적. 공사비 절감 효과', 'Exposed concrete + metal shelving + pipe hangers. Optimal for street fashion/living select shops. Saves construction cost', 'Factory', '{"인더스트리얼", "스트릿", "가성비"}', '{"공사비 절감 (노출 마감)", "트렌디한 분위기", "남녀 모두 어필", "상품 교체 용이"}', '{"따뜻함 부족 가능", "소음 반향", "여성 전용 브랜드에 부적합 가능"}', '평당 100~180만원', '한국 2025', 3);


-- ══════════════════════════════════════════
--  2. unmanned-retail (무인매장)
--     기존 v2: 무인 결제 키오스크 & CCTV(material), 스마트 무인 스토어(concept)
--     추가: 자재 5개 + 컨셉 2개 = 총 6 materials + 3 concepts
-- ══════════════════════════════════════════

INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
-- 자재 2: 스마트 선반 (중량 센서)
('retail', 'unmanned-retail', 'material', '스마트 선반 (중량 센서)', 'Smart Shelving (Weight Sensor)', '상품 들어올림/놓음을 중량 센서로 감지. 실시간 재고 관리 + 도난 방지. Amazon Go 방식의 핵심 기술', 'Detects product pick-up/put-back via weight sensors. Real-time inventory + theft prevention. Core Amazon Go technology', 'Monitor', '{"스마트", "재고관리", "센서"}', NULL, NULL, '선반당 50~200만원', '글로벌 2025', 2),

-- 자재 3: 전자 출입문 (QR/앱 기반)
('retail', 'unmanned-retail', 'material', '전자 출입문 (QR/앱 인증)', 'Electronic Entry Gate (QR/App)', '입장 시 QR코드·앱 스캔으로 본인 인증. 비인가 출입 차단 + 고객 데이터 수집 동시 가능', 'Identity verification via QR/app scan at entry. Blocks unauthorized access + enables customer data collection simultaneously', 'Shield', '{"출입", "보안", "QR"}', NULL, NULL, '게이트 세트 200~600만원', '글로벌 2025', 3),

-- 자재 4: 디지털 사이니지 (전자 가격표)
('retail', 'unmanned-retail', 'material', '디지털 사이니지 & 전자 가격표', 'Digital Signage & Electronic Shelf Labels', '가격·프로모션 원격 변경 가능. ESL(전자 가격표)은 선반 부착형으로 인건비 제로 운영 핵심', 'Remote price/promotion changes. ESL (electronic shelf labels) are key to zero-labor operations', 'Monitor', '{"디지털", "가격표", "원격관리"}', NULL, NULL, 'ESL 개당 1~3만원, 사이니지 50~200만원', '한국 2025', 4),

-- 자재 5: 상품 보안 태그 & 게이트
('retail', 'unmanned-retail', 'material', '상품 보안 태그 & 도난방지 게이트', 'Product Security Tag & Anti-theft Gate', 'EAS(전자상품감시) 시스템. 결제 안 된 상품 반출 시 알람. 무인매장 도난 방지 최후 방어선', 'EAS (Electronic Article Surveillance) system. Alarm on unpaid product exit. Last defense against theft in unmanned stores', 'Shield', '{"보안", "도난방지", "EAS"}', NULL, NULL, '게이트 100~300만원 + 태그 개당 500~2000원', '한국 2025', 5),

-- 자재 6: 원격 관제 모니터링 시스템
('retail', 'unmanned-retail', 'material', '원격 관제 모니터링 시스템', 'Remote Monitoring & Control System', '스마트폰·PC로 CCTV 실시간 확인 + 조명/냉난방/음악 원격 제어. 무인 운영의 실질적 관리 도구', 'Real-time CCTV + remote control of lighting/HVAC/music via smartphone/PC. Practical management tool for unmanned operation', 'Monitor', '{"원격관리", "CCTV", "스마트"}', NULL, NULL, '월 5~20만원 (구독형)', '한국 2025', 6),

-- 컨셉 2: 미니멀 편의점형 무인매장
('retail', 'unmanned-retail', 'concept', '미니멀 편의점형 무인매장', 'Minimal Convenience Unmanned Store', '밝은 화이트 조명 + 정리된 곤돌라 선반 + 냉장고 벽면. 편의점처럼 익숙한 동선으로 진입장벽 최소화', 'Bright white lighting + organized gondola shelves + refrigerator wall. Familiar convenience store layout minimizes entry barrier', 'Home', '{"편의점형", "익숙함", "미니멀"}', '{"고객 진입장벽 최소화", "넓은 연령대 소구", "상품 구색 다양화 용이", "24시간 안정 운영"}', '{"차별화 어려움", "가격 경쟁 치열", "냉장 전기요금 높음"}', '평당 80~150만원', '한국 2025', 2),

-- 컨셉 3: 쇼룸형 무인 체험매장
('retail', 'unmanned-retail', 'concept', '쇼룸형 무인 체험매장', 'Showroom-style Unmanned Experience Store', '상품을 직접 보고 체험 후 QR로 온라인 주문. 재고 없이 전시만. 렌탈/구독 서비스에 최적', 'View and experience products, then order online via QR. Display-only, no inventory. Optimal for rental/subscription services', 'Star', '{"쇼룸", "체험", "O2O"}', '{"재고 부담 제로", "고가 상품도 전시 가능", "도난 리스크 최소", "온라인 전환 유도"}', '{"즉시 구매 불가로 충동구매 감소", "배송 대기 필요", "체험 공간 관리 필요"}', '평당 120~250만원', '글로벌 2025', 3);


-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  GROUP 6 — SPACE                                             ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- ══════════════════════════════════════════
--  3. shared-office (공유오피스)
--     기존 v2: 방음 파티션 & 포커스 부스(material), 코워킹 라운지(concept)
--     추가: 자재 5개 + 컨셉 2개 = 총 6 materials + 3 concepts
-- ══════════════════════════════════════════

INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
-- 자재 2: 핫데스크 (유연 좌석)
('space', 'shared-office', 'material', '핫데스크 (유연 좌석 시스템)', 'Hot Desk (Flexible Seating System)', '지정 좌석 없이 매일 자유롭게 선택하는 좌석. 전원 콘센트 + 모니터 암 + 개인 로커 세트 구성', 'No assigned seats - choose freely each day. Power outlet + monitor arm + personal locker set included', 'Layers', '{"핫데스크", "유연", "좌석"}', NULL, NULL, '데스크당 30~80만원 + 로커 10~30만원', '글로벌 2025', 2),

-- 자재 3: 폰부스 (1인 방음 부스)
('space', 'shared-office', 'material', '폰부스 (1인 방음 부스)', 'Phone Booth (1-Person Soundproof Pod)', '화상회의·전화통화용 1인 방음 부스. 환기팬 + LED 조명 + 전원 + USB 충전 내장. 오픈 공간 필수 보완재', 'Soundproof pod for video calls and phone calls. Built-in ventilation fan + LED + power + USB. Essential complement to open spaces', 'Shield', '{"폰부스", "방음", "화상회의"}', NULL, NULL, '부스당 200~600만원', '글로벌 2025', 3),

-- 자재 4: 미팅 팟 (4~6인 회의실)
('space', 'shared-office', 'material', '미팅 팟 (4~6인 소회의실)', 'Meeting Pod (4-6 Person Room)', '유리 벽면 소회의실. 디스플레이/화이트보드 + 화상회의 장비 내장. 가변형 벽체로 확장 가능', 'Glass-walled meeting room. Built-in display/whiteboard + video conferencing equipment. Expandable with movable walls', 'Home', '{"미팅룸", "협업", "회의"}', NULL, NULL, '실당 300~800만원', '한국 2025', 4),

-- 자재 5: 라운지 & 키친/팬트리
('space', 'shared-office', 'material', '라운지 & 키친/팬트리', 'Lounge & Kitchen/Pantry', '입주사 간 네트워킹 공간. 커피머신 + 냉장고 + 전자레인지 + 소파 + 하이테이블. 공유오피스 만족도의 핵심', 'Networking space for tenants. Coffee machine + fridge + microwave + sofa + high table. Key to coworking satisfaction', 'Home', '{"라운지", "키친", "네트워킹"}', NULL, NULL, '세트 500~1500만원', '글로벌 2025', 5),

-- 자재 6: 리셉션 & 안내 데스크
('space', 'shared-office', 'material', '리셉션 & 안내 데스크', 'Reception & Information Desk', '첫인상을 결정하는 리셉션. 브랜드 로고 + 태블릿 체크인 + 택배 보관함. 프리미엄 공유오피스 필수', 'Reception that determines first impression. Brand logo + tablet check-in + package lockers. Essential for premium coworking', 'Crown', '{"리셉션", "프리미엄", "안내"}', NULL, NULL, '세트 200~600만원', '한국 2025', 6),

-- 컨셉 2: 모던 비즈니스 허브
('space', 'shared-office', 'concept', '모던 비즈니스 허브', 'Modern Business Hub', '화이트+그레이+우드 기반 깔끔한 비즈니스 공간. 유리 회의실 + 포커스존 + 라운지 영역 명확 분리', 'Clean white+gray+wood business space. Glass meeting rooms + focus zone + lounge clearly separated', 'Layers', '{"비즈니스", "모던", "전문적"}', '{"기업 고객 유치에 유리", "다양한 업종 수용 가능", "프리미엄 가격 정당화", "투자자 미팅 공간 활용"}', '{"개성 부족 가능", "높은 인테리어 비용", "관리비 상승"}', '평당 150~280만원', '글로벌 2025', 2),

-- 컨셉 3: 커뮤니티 중심 코워킹
('space', 'shared-office', 'concept', '커뮤니티 중심 코워킹', 'Community-Centered Coworking', '넓은 공용 공간 + 이벤트 홀 + 커뮤니티 보드. 입주사 간 협업·이벤트를 통해 커뮤니티 구축이 핵심 가치', 'Wide common area + event hall + community board. Building community through tenant collaboration and events is core value', 'Star', '{"커뮤니티", "이벤트", "협업"}', '{"입주사 간 시너지 창출", "이벤트 수익 추가", "입소문 마케팅 효과", "장기 입주 유도"}', '{"이벤트 기획 인력 필요", "소음 관리 어려움", "대형 면적 필요"}', '평당 120~220만원', '한국 2025', 3);


-- ══════════════════════════════════════════
--  4. party-room (파티룸)
--     기존 v2: LED 조명 시스템(material), 인스타그래머블 파티룸(concept)
--     추가: 자재 5개 + 컨셉 2개 = 총 6 materials + 3 concepts
-- ══════════════════════════════════════════

INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
-- 자재 2: 사운드 시스템 (블루투스 스피커)
('space', 'party-room', 'material', '사운드 시스템 (블루투스 스피커)', 'Sound System (Bluetooth Speaker)', '파티룸 필수 장비. 천장 매립 스피커 또는 스탠드형 + 서브우퍼 + 블루투스 연결. 방음 공사 병행 필수', 'Party room essential. Ceiling speakers or stand-type + subwoofer + Bluetooth. Must pair with soundproofing', 'Zap', '{"사운드", "음악", "파티"}', NULL, NULL, '세트 50~300만원', '한국 2025', 2),

-- 자재 3: 포토월 & 네온사인
('space', 'party-room', 'material', '포토월 & 네온사인', 'Photo Wall & Neon Sign', '파티 사진 배경용 포토월. 네온사인 문구(Happy Birthday, Celebrate 등) + 풍선 아치 거치대 포함', 'Photo background wall. Neon sign phrases (Happy Birthday, Celebrate, etc.) + balloon arch stand included', 'Star', '{"포토존", "네온사인", "SNS"}', NULL, NULL, '포토월 30~100만원, 네온사인 10~50만원', '한국 2025', 3),

-- 자재 4: 간이 주방 (키치넷)
('space', 'party-room', 'material', '간이 주방 (키치넷)', 'Kitchenette', '미니 냉장고 + 전자레인지 + 싱크대 + 간단한 조리대. 케이터링 음식 세팅·간단한 조리 가능', 'Mini fridge + microwave + sink + simple counter. Catering food setup and simple cooking possible', 'Home', '{"주방", "케이터링", "편의"}', NULL, NULL, '세트 200~500만원', '한국 2025', 4),

-- 자재 5: 좌석 배치 (모듈형 소파/빈백)
('space', 'party-room', 'material', '모듈형 소파 & 빈백', 'Modular Sofa & Bean Bags', '자유롭게 배치 변경 가능한 모듈 소파 + 빈백. 인원수와 파티 유형에 따라 레이아웃 변경', 'Freely rearrangeable modular sofa + bean bags. Layout changes based on group size and party type', 'Layers', '{"가구", "모듈형", "유연"}', NULL, NULL, '소파 세트 100~400만원, 빈백 개당 5~15만원', '한국 2025', 5),

-- 자재 6: 데코레이션 보관 창고
('space', 'party-room', 'material', '데코레이션 보관 창고', 'Decoration Storage Room', '풍선·가랜드·테이블보·소품 등 테마별 데코레이션 보관 공간. 체계적 수납으로 빠른 셋업 가능', 'Storage for balloons, garlands, tablecloths, props by theme. Organized storage enables quick setup between parties', 'Layers', '{"수납", "데코", "효율"}', NULL, NULL, '스틸 선반 세트 30~100만원', '한국 2025', 6),

-- 컨셉 2: 프라이빗 시네마 파티룸
('space', 'party-room', 'concept', '프라이빗 시네마 파티룸', 'Private Cinema Party Room', '대형 프로젝터 + 서라운드 사운드 + 리클라이너 소파. 영화 상영 + 게임 + 파티 복합 공간', 'Large projector + surround sound + recliner sofas. Movie screening + gaming + party multi-use space', 'Monitor', '{"시네마", "프로젝터", "프라이빗"}', '{"영화/게임 파티 수요 흡수", "프라이빗한 경험 제공", "평일 낮 시간대 활용 가능", "커플/소그룹 특화"}', '{"장비 고장 리스크", "프로젝터 유지비", "어두운 공간 관리 어려움"}', '평당 100~220만원', '한국 2025', 2),

-- 컨셉 3: 키즈 파티룸
('space', 'party-room', 'concept', '키즈 파티룸', 'Kids Party Room', '밝은 파스텔 톤 + 안전 쿠션 매트 + 미끄럼틀/볼풀 + 포토존. 어린이 생일파티 전문 특화 공간', 'Bright pastel tones + safety cushion mats + slide/ball pit + photo zone. Specialized space for children birthday parties', 'Star', '{"키즈", "생일파티", "안전"}', '{"어린이 생일파티 시장 독점 가능", "학부모 단체 예약 빈번", "주말 예약률 극대화", "케이터링 추가 매출"}', '{"평일 비수기", "안전 사고 리스크", "위생 관리 강화 필요"}', '평당 80~180만원', '한국 2025', 3);


-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  GROUP 7 — STARTUP-TECH (6개 세부업종 오피스/워크스페이스)     ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- ══════════════════════════════════════════
--  5. ai-application (AI 스타트업)
--     기존 v2: 모니터 암 & 듀얼 세팅, 스탠딩 데스크, 방음 부스(materials 3)
--             테크 미니멀 오피스, 하이브리드 랩 오피스(concepts 2)
--     추가: 자재 3개 + 컨셉 1개 = 총 6 materials + 3 concepts
-- ══════════════════════════════════════════

INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
-- 자재 4: GPU 서버룸 (냉각 시스템)
('startup-tech', 'ai-application', 'material', 'GPU 서버룸 & 냉각 시스템', 'GPU Server Room & Cooling System', 'AI 모델 학습용 GPU 서버 전용 공간. 항온항습 + 이중 바닥 + UPS 전원. 수냉식 쿨링 권장으로 소음 최소화', 'Dedicated space for GPU servers for AI model training. Temperature/humidity control + raised floor + UPS power. Liquid cooling recommended to minimize noise', 'Zap', '{"GPU", "서버룸", "냉각"}', NULL, NULL, '10평 기준 3000~8000만원', '글로벌 2025', 4),

-- 자재 5: 대형 화이트보드 & 디지털 보드
('startup-tech', 'ai-application', 'material', '대형 화이트보드 & 디지털 보드', 'Large Whiteboard & Digital Board', 'ML 모델 아키텍처 설계 + 브레인스토밍용. 벽면 전체 화이트보드 페인트 또는 전자칠판(65인치+)', 'For ML model architecture design + brainstorming. Full wall whiteboard paint or digital board (65 inch+)', 'Star', '{"화이트보드", "브레인스토밍", "설계"}', NULL, NULL, '화이트보드 벽면 20~50만원, 전자칠판 200~500만원', '글로벌 2025', 5),

-- 자재 6: 데이터 시각화 모니터 월
('startup-tech', 'ai-application', 'material', '데이터 시각화 모니터 월', 'Data Visualization Monitor Wall', 'AI 모델 성능·학습 진행 상황을 실시간 대시보드로 표시. 팀 공유 벽면 모니터(55인치 x 2~4)', 'Real-time dashboard showing AI model performance and training progress. Team shared wall monitors (55 inch x 2-4)', 'Monitor', '{"모니터월", "대시보드", "시각화"}', NULL, NULL, '모니터 2~4개 세트 200~600만원', '한국 2025', 6),

-- 컨셉 3: 리서치 랩 오피스
('startup-tech', 'ai-application', 'concept', '리서치 랩 오피스', 'Research Lab Office', '대학 연구실 감성 + 스타트업 에너지. 개인 연구 부스 + 세미나 공간 + 서버 랙 가시화. 논문 읽기·토론 공간 분리', 'University lab vibe + startup energy. Individual research booths + seminar space + visible server racks. Separated reading and discussion areas', 'Lightbulb', '{"연구", "랩", "학술"}', '{"연구 인력 채용 어필", "학술-산업 협업 유도", "집중 연구 환경 최적화", "투자자에게 기술력 어필"}', '{"상업적 이미지 부족", "비개발 직군 소외감", "장비 유지비 높음"}', '인당 100~180만원', '글로벌 2025', 3);


-- ══════════════════════════════════════════
--  6. b2b-saas (B2B SaaS)
--     기존 v2: 화상회의 전용 부스, 미팅룸 스크린 & 화이트보드(materials 2)
--             세일즈 프렌들리 오피스(concept 1)
--     추가: 자재 4개 + 컨셉 2개 = 총 6 materials + 3 concepts
-- ══════════════════════════════════════════

INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
-- 자재 3: CRM 대시보드 모니터
('startup-tech', 'b2b-saas', 'material', 'CRM 대시보드 모니터', 'CRM Dashboard Monitor', 'Sales/CS팀 공유 벽면 모니터. MRR, 파이프라인, 고객 현황 실시간 표시. 팀 동기 부여와 투명성', 'Sales/CS team shared wall monitor. Real-time MRR, pipeline, customer status display. Team motivation and transparency', 'Monitor', '{"대시보드", "영업", "CRM"}', NULL, NULL, '55인치 모니터 세트 100~200만원', '글로벌 2025', 3),

-- 자재 4: 고객 미팅룸 (브랜딩)
('startup-tech', 'b2b-saas', 'material', '고객 미팅룸 (브랜딩 공간)', 'Client Meeting Room (Branded Space)', '로고 벽면 + 회사 색상 + 대형 디스플레이. 고객 방문 시 전문성과 신뢰를 주는 미팅 전용 공간', 'Logo wall + company colors + large display. Dedicated meeting space that conveys professionalism and trust during client visits', 'Crown', '{"미팅룸", "브랜딩", "B2B"}', NULL, NULL, '세트 300~800만원', '한국 2025', 4),

-- 자재 5: 인체공학 개발자 의자
('startup-tech', 'b2b-saas', 'material', '인체공학 의자 & 모니터 세팅', 'Ergonomic Chair & Monitor Setup', '허만밀러/시디즈 의자 + 듀얼 모니터 암. 개발팀과 CS팀 모두 하루 8시간+ 사용. 건강과 생산성에 직결', 'Herman Miller/Sidiz chair + dual monitor arm. Both dev and CS teams use 8+ hours daily. Directly impacts health and productivity', 'Zap', '{"인체공학", "의자", "생산성"}', NULL, NULL, '의자 50~150만원, 모니터암+모니터 50~100만원', '글로벌 2025', 5),

-- 자재 6: 키친 & 스낵바
('startup-tech', 'b2b-saas', 'material', '키친 & 스낵바', 'Kitchen & Snack Bar', '커피머신 + 냉장고 + 간식 진열대. SaaS 스타트업 복지의 상징. 팀 소통·휴식 공간 겸용', 'Coffee machine + fridge + snack display. Symbol of SaaS startup perks. Doubles as team communication and rest space', 'Home', '{"키친", "복지", "팀문화"}', NULL, NULL, '세트 200~500만원', '한국 2025', 6),

-- 컨셉 2: 오픈 플랜 + 코너 오피스
('startup-tech', 'b2b-saas', 'concept', '오픈 플랜 + 코너 오피스', 'Open Plan + Corner Office', '영업·CS팀은 오픈 플랜으로 빠른 소통, 개발팀은 코너 집중 영역. 팀 특성에 맞는 하이브리드 배치', 'Sales/CS in open plan for fast communication, dev team in corner focus area. Hybrid layout matching team characteristics', 'Layers', '{"오픈플랜", "하이브리드", "팀별 분리"}', '{"팀별 최적 환경 제공", "영업-개발 소음 분리", "고객 방문 동선 분리 가능", "확장 시 유연"}', '{"면적 효율 낮음", "팀 간 단절감 가능", "관리 영역 증가"}', '인당 80~150만원', '글로벌 2025', 2),

-- 컨셉 3: 데모 쇼룸 오피스
('startup-tech', 'b2b-saas', 'concept', '데모 쇼룸 오피스', 'Demo Showroom Office', '제품 데모 전용 공간 + 일반 오피스. 대형 터치스크린에서 제품을 직접 시연. 고객 경험이 곧 영업', 'Product demo dedicated space + general office. Live product demos on large touchscreen. Customer experience IS sales', 'Star', '{"데모", "쇼룸", "제품시연"}', '{"고객 이해도 극대화", "성약률 향상", "투자자 IR에도 활용", "제품 자신감 표현"}', '{"장비 투자 필요", "데모 환경 유지 관리", "공간 분리 필요"}', '인당 100~200만원', '한국 2025', 3);


-- ══════════════════════════════════════════
--  7. developer-tools (개발자 도구)
--     기존 v2: 개발자 의자 인체공학(material 1), 해커 스페이스(concept 1)
--     추가: 자재 5개 + 컨셉 2개 = 총 6 materials + 3 concepts
-- ══════════════════════════════════════════

INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
-- 자재 2: 트리플 모니터 + 울트라와이드
('startup-tech', 'developer-tools', 'material', '트리플 모니터 / 울트라와이드', 'Triple Monitor / Ultrawide Setup', '코드·터미널·문서를 동시에 볼 수 있는 트리플 모니터 또는 34인치+ 울트라와이드. 개발 생산성 필수', 'Triple monitor or 34 inch+ ultrawide for viewing code, terminal, and docs simultaneously. Essential for dev productivity', 'Monitor', '{"모니터", "생산성", "개발"}', NULL, NULL, '울트라와이드 40~100만원, 트리플 세트 80~200만원', '글로벌 2025', 2),

-- 자재 3: 전동 높이조절 데스크
('startup-tech', 'developer-tools', 'material', '전동 높이조절 데스크', 'Electric Height-Adjustable Desk', '120~160cm 폭 전동 스탠딩 데스크. 장시간 코딩 시 앉기/서기 전환. 케이블 정리 트레이 필수', '120-160cm wide electric standing desk. Sit/stand switching for long coding sessions. Cable management tray essential', 'Zap', '{"스탠딩", "인체공학", "건강"}', NULL, NULL, '개당 30~80만원', '글로벌 2025', 3),

-- 자재 4: 기계식 키보드 & 방음 매트
('startup-tech', 'developer-tools', 'material', '기계식 키보드 & 방음 데스크매트', 'Mechanical Keyboard & Sound-Dampening Desk Mat', '개발자 생산성 도구. 키감 좋은 기계식 키보드 + 소음 감소 데스크매트. 오피스 소음 관리에도 기여', 'Developer productivity tools. Tactile mechanical keyboard + noise-reducing desk mat. Also contributes to office noise management', 'Zap', '{"키보드", "생산성", "인체공학"}', NULL, NULL, '키보드 10~30만원, 매트 3~10만원', '글로벌 2025', 4),

-- 자재 5: 코드 리뷰 페어링 스테이션
('startup-tech', 'developer-tools', 'material', '코드 리뷰 페어링 스테이션', 'Code Review Pairing Station', '2인이 나란히 앉아 코드 리뷰·페어 프로그래밍하는 전용 데스크. 대형 모니터 1대 + 키보드 2세트', 'Dedicated desk for 2 people to sit side-by-side for code review/pair programming. 1 large monitor + 2 keyboard sets', 'Star', '{"페어프로그래밍", "코드리뷰", "협업"}', NULL, NULL, '스테이션당 50~120만원', '글로벌 2025', 5),

-- 자재 6: 서버 랙 & 테스트 환경
('startup-tech', 'developer-tools', 'material', '서버 랙 & 로컬 테스트 환경', 'Server Rack & Local Test Environment', '개발자 도구 회사는 다양한 환경 테스트 필수. 소형 서버 랙 + 다양한 OS/디바이스 테스트 공간', 'Dev tools companies need diverse environment testing. Small server rack + multi-OS/device testing space', 'Monitor', '{"서버", "테스트", "인프라"}', NULL, NULL, '서버랙 세트 500~2000만원', '한국 2025', 6),

-- 컨셉 2: 오픈소스 커뮤니티 오피스
('startup-tech', 'developer-tools', 'concept', '오픈소스 커뮤니티 오피스', 'Open Source Community Office', '넓은 공용 공간 + 이벤트/밋업 공간. 커뮤니티 빌딩이 마케팅인 DevTool 회사에 최적. 라이브 코딩 세션 가능', 'Wide common area + event/meetup space. Optimal for DevTool companies where community building IS marketing. Live coding sessions possible', 'Star', '{"오픈소스", "커뮤니티", "밋업"}', '{"개발자 커뮤니티 구축", "채용 브랜딩 효과", "밋업으로 제품 홍보", "협업 문화 강화"}', '{"이벤트 소음", "보안 관리 필요 (외부인 출입)", "공간 활용 비효율 가능"}', '인당 80~150만원', '글로벌 2025', 2),

-- 컨셉 3: 집중형 딥워크 오피스
('startup-tech', 'developer-tools', 'concept', '집중형 딥워크 오피스', 'Deep Work Focus Office', '개인 부스 중심 + 최소한의 공용 공간. 방음·차단이 극대화된 개발 집중 환경. 비동기 소통 문화 반영', 'Individual booth-centric + minimal common areas. Maximized soundproofing for development focus. Reflects async communication culture', 'Shield', '{"딥워크", "집중", "비동기"}', '{"개발 집중도 최고", "원격 근무 문화와 일관성", "개인 맞춤 환경 가능", "코딩 생산성 극대화"}', '{"팀 유대감 저하 가능", "비용 높음 (개인 부스)", "외부인 방문 시 안내 어려움"}', '인당 100~200만원', '글로벌 2025', 3);


-- ══════════════════════════════════════════
--  8. fintech-startup (핀테크)
--     기존 v2: 보안 서버룸 & 문서 잠금장치(material 1), 컴플라이언스 퍼스트 오피스(concept 1)
--     추가: 자재 5개 + 컨셉 2개 = 총 6 materials + 3 concepts
-- ══════════════════════════════════════════

INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
-- 자재 2: 프라이버시 스크린 & 시선 차단 파티션
('startup-tech', 'fintech-startup', 'material', '프라이버시 스크린 & 시선 차단 파티션', 'Privacy Screen & Visual Partition', '금융 데이터 화면 보호용 프라이버시 필터 + 좌석 간 시선 차단 파티션. 컴플라이언스 기본 요건', 'Privacy filter for financial data screens + visual partitions between seats. Basic compliance requirement', 'Shield', '{"프라이버시", "보안", "금융"}', NULL, NULL, '필터 개당 3~8만원, 파티션 20~50만원', '한국 2025', 2),

-- 자재 3: 출입 통제 시스템 (카드/지문)
('startup-tech', 'fintech-startup', 'material', '출입 통제 시스템 (카드/생체인식)', 'Access Control System (Card/Biometric)', '영역별 출입 제한. 서버룸·임원실·문서실 별도 인증. 출입 로그 자동 기록으로 감사 대비', 'Zone-based access restriction. Separate authentication for server room, executive office, document room. Auto-logged for audit readiness', 'Shield', '{"출입통제", "생체인식", "감사"}', NULL, NULL, '존당 100~300만원', '한국 2025', 3),

-- 자재 4: 보안 문서 보관실 (잠금 캐비닛)
('startup-tech', 'fintech-startup', 'material', '보안 문서 보관실 (잠금 캐비닛)', 'Secure Document Room (Locked Cabinet)', '금융 인허가 서류·고객 계약서 보관용 잠금 캐비닛. 내화 금고 포함. 금융감독원 현장 점검 대비', 'Locked cabinets for financial license documents and customer contracts. Includes fireproof safe. Ready for FSS on-site inspection', 'Shield', '{"문서보관", "보안", "금융감독"}', NULL, NULL, '캐비닛 50~200만원, 내화금고 100~500만원', '한국 2025', 4),

-- 자재 5: 회의실 방음 & 화상회의 장비
('startup-tech', 'fintech-startup', 'material', '보안 회의실 (방음+화상회의)', 'Secure Meeting Room (Soundproof+Video)', '금융 파트너·투자자 미팅용 방음 회의실. 유리벽 대신 불투명 벽체. 화상회의 장비 + 화이트보드', 'Soundproof meeting room for financial partner/investor meetings. Opaque walls instead of glass. Video conferencing + whiteboard', 'Home', '{"회의실", "방음", "보안미팅"}', NULL, NULL, '실당 300~800만원', '한국 2025', 5),

-- 자재 6: UPS & 이중 네트워크
('startup-tech', 'fintech-startup', 'material', 'UPS 무정전 전원 & 이중 네트워크', 'UPS Power & Dual Network', '금융 서비스 중단 방지용 UPS + 이중 인터넷 회선. 정전·네트워크 장애 시에도 서비스 유지 필수', 'UPS + dual internet lines to prevent financial service interruption. Must maintain service during power/network outages', 'Zap', '{"UPS", "무정전", "이중화"}', NULL, NULL, 'UPS 100~500만원, 이중회선 월 10~30만원', '글로벌 2025', 6),

-- 컨셉 2: 프리미엄 파이낸스 오피스
('startup-tech', 'fintech-startup', 'concept', '프리미엄 파이낸스 오피스', 'Premium Finance Office', '고급 가구 + 차분한 네이비/그레이 톤 + 대리석 리셉션. 전통 금융기관 수준의 신뢰감을 주는 공간', 'Premium furniture + calm navy/gray tones + marble reception. Space that provides trust level of traditional financial institutions', 'Crown', '{"프리미엄", "금융", "신뢰"}', '{"금융기관/투자자 신뢰 극대화", "고급 인재 채용에 유리", "라이선스 심사 시 인상 좋음", "브랜드 가치 향상"}', '{"높은 인테리어 비용", "유지 관리비 상승", "스타트업 문화와 괴리 가능"}', '인당 150~300만원', '한국 2025', 2),

-- 컨셉 3: 애자일 핀테크 오피스
('startup-tech', 'fintech-startup', 'concept', '애자일 핀테크 오피스', 'Agile Fintech Office', '보안 영역 + 오픈 개발 영역 분리. 규제 준수하되 스타트업 특유의 빠른 개발 문화 유지. 카드/키 기반 영역 전환', 'Secure zone + open dev area separated. Compliance-ready while maintaining fast startup dev culture. Card/key-based zone switching', 'Zap', '{"애자일", "핀테크", "보안+속도"}', '{"보안과 속도 양립", "규제 대응 유연", "개발 문화 유지", "확장 시 영역 추가 용이"}', '{"설계 복잡도 높음", "출입 관리 운영 부담", "비용 중간~높음"}', '인당 100~200만원', '글로벌 2025', 3);


-- ══════════════════════════════════════════
--  9. healthtech-startup (헬스테크)
--     기존 v2: 클린룸/의료기기 테스트 공간(material 1), 헬스케어 스마트 오피스(concept 1)
--     추가: 자재 5개 + 컨셉 2개 = 총 6 materials + 3 concepts
-- ══════════════════════════════════════════

INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
-- 자재 2: 의료 데이터 보안 서버
('startup-tech', 'healthtech-startup', 'material', '의료 데이터 보안 서버룸', 'Medical Data Secure Server Room', 'HIPAA/개인정보보호법 준수 서버룸. 의료 데이터 암호화 저장 + 접근 통제 + 출입 로그 기록', 'HIPAA/privacy law compliant server room. Medical data encrypted storage + access control + entry logging', 'Shield', '{"의료데이터", "보안", "HIPAA"}', NULL, NULL, '세트 500~2000만원', '한국 2025', 2),

-- 자재 3: 사용성 테스트 관찰실
('startup-tech', 'healthtech-startup', 'material', '사용성 테스트 관찰실 (원웨이 미러)', 'Usability Test Observation Room (One-Way Mirror)', '의료진/환자가 앱·기기를 테스트하는 모습을 관찰하는 방. 원웨이 미러 또는 카메라 시스템', 'Room for observing medical staff/patients testing apps and devices. One-way mirror or camera system', 'Monitor', '{"UX테스트", "관찰", "의료UX"}', NULL, NULL, '실당 200~500만원', '한국 2025', 3),

-- 자재 4: 항균 마감재 (바닥·벽·가구)
('startup-tech', 'healthtech-startup', 'material', '항균 마감재 (바닥/벽/가구)', 'Antibacterial Finishes (Floor/Wall/Furniture)', '헬스테크 사무실도 청결 이미지 중요. 항균 코팅 바닥재 + 항균 페인트 + 손소독제 거치대 배치', 'Cleanliness image is important even for healthtech offices. Antibacterial flooring + paint + hand sanitizer stands', 'Leaf', '{"항균", "청결", "의료이미지"}', NULL, NULL, '평당 5~15만원 추가', '한국 2025', 4),

-- 자재 5: 의료기기 전시/데모 공간
('startup-tech', 'healthtech-startup', 'material', '의료기기 전시/데모 공간', 'Medical Device Display/Demo Area', '개발 중인 의료기기·웨어러블을 전시하는 쇼케이스. 병원 관계자 방문 시 직접 시연 가능', 'Showcase displaying medical devices and wearables in development. Live demonstrations for hospital visitors', 'Star', '{"전시", "데모", "의료기기"}', NULL, NULL, '세트 100~400만원', '한국 2025', 5),

-- 자재 6: 화상 원격진료 시뮬레이션 부스
('startup-tech', 'healthtech-startup', 'material', '원격진료 시뮬레이션 부스', 'Telemedicine Simulation Booth', '원격진료 서비스를 개발·테스트하는 전용 부스. 카메라 + 조명 + 모니터 + 방음. 실제 진료 환경 재현', 'Dedicated booth for developing and testing telemedicine services. Camera + lighting + monitor + soundproof. Reproduces actual clinical environment', 'Monitor', '{"원격진료", "시뮬레이션", "테스트"}', NULL, NULL, '부스당 200~600만원', '글로벌 2025', 6),

-- 컨셉 2: 클리닉 & 테크 하이브리드
('startup-tech', 'healthtech-startup', 'concept', '클리닉 & 테크 하이브리드', 'Clinic & Tech Hybrid', '전면부는 클린한 의료 이미지 (흰색+유리+스테인리스), 후면부는 스타트업 개발 공간. 병원과 IT의 융합', 'Front is clean medical image (white+glass+stainless), back is startup dev space. Fusion of hospital and IT', 'Home', '{"클리닉", "하이브리드", "융합"}', '{"의료 파트너에게 전문성 어필", "개발팀에겐 자유로운 환경", "투자자에게 양면 역량 시연", "FDA/MFDS 심사 대비"}', '{"이중 설계로 비용 증가", "공간 분리에 면적 필요", "관리 포인트 증가"}', '인당 120~250만원', '한국 2025', 2),

-- 컨셉 3: 웰니스 중심 오피스
('startup-tech', 'healthtech-startup', 'concept', '웰니스 중심 오피스', 'Wellness-Centered Office', '건강 스타트업답게 직원 건강도 실천. 스탠딩 데스크 + 명상실 + 건강 스낵바 + 운동 공간. 제품 가치를 사무실로 체현', 'Practice employee health as a health startup. Standing desks + meditation room + healthy snack bar + exercise area. Embody product values in the office', 'Leaf', '{"웰니스", "건강", "실천"}', '{"제품 철학과 사무실 일치", "직원 만족도·건강 향상", "채용 브랜딩 효과", "미디어 노출 기회"}', '{"부대시설 비용 높음", "넓은 면적 필요", "관리 운영 인력 필요"}', '인당 100~220만원', '글로벌 2025', 3);


-- ══════════════════════════════════════════
--  10. security-startup (보안 스타트업)
--     기존 v2: SOC룸 보안관제센터(material 1), 사이버 커맨드 센터(concept 1)
--     추가: 자재 5개 + 컨셉 2개 = 총 6 materials + 3 concepts
-- ══════════════════════════════════════════

INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
-- 자재 2: 보안 관제 콘솔 데스크
('startup-tech', 'security-startup', 'material', '보안 관제 콘솔 데스크', 'Security Operations Console Desk', 'SOC 분석관 전용 인체공학 콘솔. 모니터 3~6대 장착 + 키보드/마우스 슬라이딩 트레이 + 케이블 관리', 'Ergonomic console for SOC analysts. 3-6 monitors mounted + keyboard/mouse sliding tray + cable management', 'Monitor', '{"콘솔", "관제", "인체공학"}', NULL, NULL, '콘솔당 200~600만원', '글로벌 2025', 2),

-- 자재 3: 물리 보안 시스템 (CCTV + 출입통제)
('startup-tech', 'security-startup', 'material', '물리 보안 시스템 (CCTV + 출입통제)', 'Physical Security System (CCTV + Access Control)', '보안 회사 자체 사무실이 보안 취약하면 신뢰 상실. 고급 CCTV + 생체인식 출입 + 침입 탐지 알람', 'If a security company office is insecure, trust is lost. Premium CCTV + biometric access + intrusion detection alarm', 'Shield', '{"물리보안", "CCTV", "침입탐지"}', NULL, NULL, '세트 500~2000만원', '한국 2025', 3),

-- 자재 4: 침투 테스트 랩 (격리 네트워크)
('startup-tech', 'security-startup', 'material', '침투 테스트 랩 (격리 네트워크)', 'Penetration Testing Lab (Isolated Network)', '모의 해킹 테스트 전용 공간. 메인 네트워크와 물리적으로 격리. 다양한 OS·서버 환경 구축', 'Dedicated space for pen testing. Physically isolated from main network. Various OS and server environments', 'Zap', '{"펜테스트", "격리", "해킹"}', NULL, NULL, '랩 세팅 500~1500만원', '글로벌 2025', 4),

-- 자재 5: 24시간 관제 편의시설 (수면실/샤워)
('startup-tech', 'security-startup', 'material', '24시간 관제 편의시설 (수면실/샤워)', '24/7 Operations Amenities (Sleep Room/Shower)', 'SOC 24시간 운영 시 교대 근무자를 위한 수면실 + 샤워실 + 간이 주방. 야간 근무 복지 필수', 'Sleep room + shower + kitchenette for shift workers in 24/7 SOC operations. Essential night shift welfare', 'Home', '{"24시간", "교대근무", "복지"}', NULL, NULL, '세트 300~800만원', '한국 2025', 5),

-- 자재 6: 보안 문서 파쇄기 & 클린 데스크
('startup-tech', 'security-startup', 'material', '보안 문서 파쇄기 & 클린 데스크', 'Security Shredder & Clean Desk Policy', '기밀 문서 즉시 파쇄. 퇴근 시 모니터 꺼짐 + 서류 잠금 + 클린 데스크 정책 시행 도구', 'Immediate shredding of confidential documents. Monitor off + document lock + clean desk policy enforcement tools at end of day', 'Shield', '{"파쇄기", "클린데스크", "기밀"}', NULL, NULL, '파쇄기 30~100만원, 잠금 서랍 10~30만원', '한국 2025', 6),

-- 컨셉 2: 포트리스 오피스 (요새형)
('startup-tech', 'security-startup', 'concept', '포트리스 오피스 (요새형)', 'Fortress Office', '물리·사이버 보안이 완벽한 요새형 사무실. 다단계 출입 + CCTV 사각지대 제로 + 차폐 회의실. 보안 회사의 쇼케이스', 'Office fortress with perfect physical and cyber security. Multi-layer access + zero CCTV blind spots + shielded meeting rooms. Security company showcase', 'Shield', '{"요새", "완벽보안", "쇼케이스"}', '{"고객에게 보안 역량 즉각 증명", "정부/군 프로젝트 수주 용이", "직원 보안 의식 자연 강화", "매체 노출 시 강력 이미지"}', '{"매우 높은 초기 비용", "운영·유지 복잡", "방문자 불편 가능"}', '인당 200~400만원', '글로벌 2025', 2),

-- 컨셉 3: 레드팀 vs 블루팀 오피스
('startup-tech', 'security-startup', 'concept', '레드팀 vs 블루팀 오피스', 'Red Team vs Blue Team Office', '공격팀(레드)과 방어팀(블루) 공간을 시각적으로 분리. 레드존(어두운 톤) vs 블루존(밝은 톤). 보안 문화를 공간으로 표현', 'Visually separate attack team (red) and defense team (blue) spaces. Red zone (dark tone) vs Blue zone (bright tone). Express security culture through space', 'Zap', '{"레드팀", "블루팀", "보안문화"}', '{"보안 문화를 공간으로 체현", "팀 정체성 강화", "고객/방문자에게 인상적", "채용 브랜딩 효과"}', '{"이원화 설계 비용", "팀 간 물리적 분리로 소통 저하 가능", "팀 재편 시 재배치 필요"}', '인당 120~250만원', '글로벌 2025', 3);


-- ═══════════════════════════════════════════════════════════════════════════
--  데이터 검증: 10개 세부업종 × (6 materials + 3 concepts) = 90 항목 총합
--  기존 v2에서 이미 삽입된 항목 제외, 이 파일에서 추가된 항목:
--
--  lifestyle-goods:  +5 materials, +2 concepts = 7건 (기존 1+1 → 총 6+3)
--  unmanned-retail:  +5 materials, +2 concepts = 7건 (기존 1+1 → 총 6+3)
--  shared-office:    +5 materials, +2 concepts = 7건 (기존 1+1 → 총 6+3)
--  party-room:       +5 materials, +2 concepts = 7건 (기존 1+1 → 총 6+3)
--  ai-application:   +3 materials, +1 concept  = 4건 (기존 3+2 → 총 6+3)
--  b2b-saas:         +4 materials, +2 concepts = 6건 (기존 2+1 → 총 6+3)
--  developer-tools:  +5 materials, +2 concepts = 7건 (기존 1+1 → 총 6+3)
--  fintech-startup:  +5 materials, +2 concepts = 7건 (기존 1+1 → 총 6+3)
--  healthtech:       +5 materials, +2 concepts = 7건 (기존 1+1 → 총 6+3)
--  security-startup: +5 materials, +2 concepts = 7건 (기존 1+1 → 총 6+3)
--  ────────────────────────────────────────────
--  이 파일 총 추가: 66건 신규 INSERT
-- ═══════════════════════════════════════════════════════════════════════════
