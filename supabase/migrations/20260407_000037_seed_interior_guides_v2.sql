-- ═══════════════════════════════════════════════════════
--  세부업종별 인테리어 가이드 확장 (20개 세부업종)
--  startup-tech 6개 (오피스/워크스페이스) + 비스타트업 14개
--  각 세부업종: 자재 3-4개 + 디자인 컨셉 2-3개
-- ═══════════════════════════════════════════════════════

-- ══ STARTUP-TECH ══
-- 스타트업은 "인테리어"가 아닌 "오피스/워크스페이스" 가이드

-- ai-application: AI 개발팀 워크스페이스
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('startup-tech', 'ai-application', 'material', '모니터 암 & 듀얼 세팅', 'Monitor Arms & Dual Setup', 'AI 개발자에게 듀얼/트리플 모니터는 필수. 모니터 암으로 책상 공간을 확보하고 자세를 교정', 'Dual/triple monitor arms are essential for AI developers to maximize workspace and improve posture', 'Monitor', '{"개발집중", "인체공학", "AI"}', NULL, NULL, '개당 5~15만원', '한국 2025', 1),
('startup-tech', 'ai-application', 'material', '스탠딩 데스크', 'Standing Desk', '전동 높이 조절 데스크. 장시간 코딩 시 건강과 집중력 유지에 효과적', 'Electric height-adjustable desk for long coding sessions. Improves health and focus', 'Zap', '{"건강", "집중력", "인체공학"}', NULL, NULL, '개당 30~80만원', '글로벌 2025', 2),
('startup-tech', 'ai-application', 'material', '방음 부스 (포커스 팟)', 'Soundproof Focus Pod', '1-2인용 방음 부스. 딥러닝 모델 설계 등 깊은 집중이 필요한 작업에 필수', 'Soundproof pod for 1-2 people. Essential for deep focus work like model design', 'Shield', '{"집중", "방음", "프라이버시"}', NULL, NULL, '개당 300~800만원', '글로벌 2025', 3),
('startup-tech', 'ai-application', 'concept', '테크 미니멀 오피스', 'Tech Minimal Office', '화이트+그레이 톤, 모니터 암, 스탠딩 데스크 중심의 개발 집중형 공간. GPU 서버룸 환기 고려 필요', 'Clean white+gray, monitor arms, standing desks. Consider GPU server room ventilation', 'Monitor', '{"개발집중", "미니멀", "스타트업"}', '{"집중력 향상", "공간 효율 극대화", "확장 용이", "비용 효율적"}', '{"개성 부족 가능", "미팅 공간 별도 필요", "서버룸 방열 설계 필수"}', '인당 50~100만원', '한국 2025', 1),
('startup-tech', 'ai-application', 'concept', '하이브리드 랩 오피스', 'Hybrid Lab Office', '개발 영역 + 화이트보드/브레인스토밍 영역을 분리. ML 실험 토론과 코딩을 오가는 AI팀에 최적', 'Separated coding zone + whiteboard/brainstorm zone. Ideal for ML teams alternating between experiments and code', 'Lightbulb', '{"협업", "실험", "AI팀"}', '{"토론과 집중 모드 전환 용이", "화이트보드로 모델 설계 시각화", "팀 커뮤니케이션 향상", "아이디어 기록 보존"}', '{"공간 분리에 면적 필요", "소음 관리 필요", "가구 배치 변경 빈번"}', '인당 80~150만원', '글로벌 2025', 2);

-- b2b-saas
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('startup-tech', 'b2b-saas', 'material', '화상회의 전용 부스', 'Video Call Booth', 'B2B SaaS는 고객 미팅이 잦으므로 화상회의 전용 방음 부스 필수. 조명과 배경 통일', 'Video-ready soundproof booth with consistent lighting and background for frequent B2B client calls', 'Monitor', '{"B2B", "화상미팅", "영업"}', NULL, NULL, '개당 200~500만원', '한국 2025', 1),
('startup-tech', 'b2b-saas', 'material', '미팅룸 스크린 & 화이트보드', 'Meeting Room Display & Whiteboard', '65인치+ 디스플레이 + 디지털 화이트보드. 고객 데모와 내부 회의에 공용', 'Large display + digital whiteboard for client demos and team meetings', 'Star', '{"프레젠테이션", "협업", "데모"}', NULL, NULL, '세트 100~300만원', '글로벌 2025', 2),
('startup-tech', 'b2b-saas', 'concept', '세일즈 프렌들리 오피스', 'Sales-Friendly Office', '고객 방문 시 신뢰감을 주는 깔끔한 리셉션 + 미팅룸 + 개발 영역 분리. 로고와 브랜드 컬러 적용', 'Clean reception + meeting rooms + dev area separation. Company branding throughout for client trust', 'Crown', '{"B2B신뢰", "브랜딩", "영업효율"}', '{"고객 방문 시 전문적 이미지", "영업/개발 영역 분리로 집중도 향상", "브랜드 일관성"}', '{"인테리어 비용 상승", "공간 분리에 면적 필요", "리셉션 관리 인력 필요"}', '인당 100~200만원', '한국 2025', 1);

-- developer-tools
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('startup-tech', 'developer-tools', 'material', '개발자 의자 (인체공학)', 'Ergonomic Developer Chair', '허만밀러 에어론, 시디즈 T80 등. 하루 8시간+ 코딩하는 개발자에게 의자 품질은 건강과 생산성에 직결', 'Herman Miller Aeron, Sidiz T80, etc. Chair quality directly impacts health and productivity for 8+ hour coding sessions', 'Zap', '{"인체공학", "건강", "생산성"}', NULL, NULL, '개당 50~150만원', '글로벌 2025', 1),
('startup-tech', 'developer-tools', 'concept', '해커 스페이스', 'Hacker Space', '어두운 톤 + 간접 조명 + 대형 모니터. 개발에 극도로 집중할 수 있는 몰입형 공간. 오픈소스 문화 반영', 'Dark tone + ambient lighting + large monitors. Immersive space for extreme development focus. Open-source culture reflected', 'Zap', '{"몰입", "개발문화", "해커"}', '{"극도의 집중 환경", "개발자 채용 어필 포인트", "개발 문화 형성", "야간 작업에 적합"}', '{"밝기 부족으로 피로 가능", "비개발 직군과 분위기 충돌", "청소/관리 어려움"}', '인당 60~120만원', '글로벌 2025', 1);

-- fintech/healthtech/security 는 공통 "스타트업 오피스" + 각 특수 요소
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('startup-tech', 'fintech-startup', 'material', '보안 서버룸 & 문서 잠금장치', 'Secure Server Room & Document Lock', '핀테크는 금융 데이터 보안이 필수. 잠금 캐비닛, 출입 통제 서버룸, CCTV 설치', 'Financial data security is mandatory. Locked cabinets, access-controlled server room, CCTV', 'Shield', '{"보안", "금융", "컴플라이언스"}', NULL, NULL, '세트 500~1500만원', '한국 2025', 1),
('startup-tech', 'fintech-startup', 'concept', '컴플라이언스 퍼스트 오피스', 'Compliance-First Office', '금융감독원 현장 점검 대비 가능한 깔끔한 오피스. 문서 보관실, CCTV, 출입 기록 시스템 필수', 'Office ready for FSS inspections. Document storage, CCTV, access logging systems mandatory', 'Shield', '{"금융규제", "보안", "신뢰"}', '{"규제 준수 즉시 대응", "고객/투자자 신뢰 향상", "금융 라이선스 취득 용이", "데이터 보안 강화"}', '{"초기 비용 높음", "공간 제약 증가", "운영 프로세스 복잡"}', '인당 120~250만원', '한국 2025', 1),
('startup-tech', 'healthtech-startup', 'material', '클린룸/의료기기 테스트 공간', 'Clean Room / Medical Device Testing', '헬스테크 중 하드웨어가 있는 경우 클린룸 필요. 소프트웨어 전용이면 일반 오피스 + 의료 데이터 보안', 'Clean room for hardware healthtech. Software-only needs standard office + medical data security', 'Shield', '{"의료", "클린룸", "테스트"}', NULL, NULL, '10평 기준 2000~5000만원', '한국 2025', 1),
('startup-tech', 'healthtech-startup', 'concept', '헬스케어 스마트 오피스', 'Healthcare Smart Office', '깨끗한 흰색 톤 + 의료 데이터 전용 보안 구역. 임상시험 데이터 접근 통제 영역 분리', 'Clean white tone + secure medical data zone. Clinical trial data access-controlled area separated', 'Home', '{"의료신뢰", "보안", "청결"}', '{"의료 파트너사 방문 시 신뢰감", "데이터 보안 규제 준수", "청결한 이미지", "IRB 심사 대비"}', '{"인테리어 비용 높음", "관리 부담", "공간 분리 필요"}', '인당 100~200만원', '한국 2025', 1),
('startup-tech', 'security-startup', 'material', 'SOC룸 (보안관제센터)', 'SOC Room Setup', '보안 스타트업은 자체 SOC 운영이 제품 데모이자 신뢰 기반. 대형 모니터 월 + 보안 대시보드', 'Security startup SOC is both product demo and trust foundation. Large monitor wall + security dashboard', 'Monitor', '{"보안관제", "모니터월", "24/7"}', NULL, NULL, '세트 1000~3000만원', '한국 2025', 1),
('startup-tech', 'security-startup', 'concept', '사이버 커맨드 센터', 'Cyber Command Center', '어두운 톤 + 대형 모니터 월 + 보안 대시보드 상시 표시. 고객 방문 시 강력한 인상. 24/7 관제 가능 설계', 'Dark tone + large monitor wall + always-on security dashboard. Strong impression for client visits. 24/7 capable', 'Shield', '{"사이버보안", "관제센터", "신뢰"}', '{"고객에게 강력한 전문 이미지", "실시간 위협 대응 가능", "제품 데모 겸용", "24/7 운영 가능"}', '{"높은 초기 투자", "전력 소모 큼", "상시 인력 필요"}', '인당 150~300만원', '글로벌 2025', 1);

-- ══ FOOD 세부업종 ══

-- delivery-meals
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('food', 'delivery-meals', 'material', '배달 포장대 & 동선 설계', 'Packaging Station & Workflow', '배달 전문점은 포장 속도가 핵심. 전용 포장대, 봉투/용기 적재 선반, 배달기사 대기 공간', 'Packaging speed is key for delivery shops. Dedicated packing station, container shelves, driver waiting area', 'Zap', '{"배달", "효율", "동선"}', NULL, NULL, '세트 200~500만원', '한국 2025', 1),
('food', 'delivery-meals', 'material', '소형 주방 설비 (배달 최적화)', 'Compact Kitchen for Delivery', '홀 좌석 없이 주방 면적을 극대화. 화구 3-4개, 튀김기, 보온고가 핵심 설비', 'Maximize kitchen area without dining seats. 3-4 burners, fryer, food warmer are core equipment', 'Factory', '{"소형주방", "배달전용", "효율"}', NULL, NULL, '세트 1500~3000만원', '한국 2025', 2),
('food', 'delivery-meals', 'concept', '고스트 키친 (배달 전용)', 'Ghost Kitchen', '홀 없이 주방만 있는 배달 전용 공간. 임대료 50%+ 절감. 배달앱 상위노출에 마케팅비 집중', 'Kitchen-only delivery space. 50%+ rent savings. Focus marketing budget on delivery app visibility', 'Zap', '{"배달전용", "저비용", "효율극대화"}', '{"임대료 대폭 절감", "주방 효율 극대화", "초기 투자 최소화", "다브랜드 운영 가능"}', '{"고객 접점 없음", "브랜드 인지도 구축 어려움", "배달앱 의존도 높음"}', '평당 50~100만원', '한국 2025', 1);

-- ramen-noodle
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('food', 'ramen-noodle', 'material', '라멘 카운터석 (오픈 주방)', 'Ramen Counter Seats', '일본식 라멘 카운터. 주방을 볼 수 있는 카운터석이 라멘집의 정체성. 배관 및 환기 중요', 'Japanese-style ramen counter. Counter seats facing open kitchen define ramen shop identity', 'Star', '{"오픈주방", "라멘", "카운터"}', NULL, NULL, '좌석당 30~60만원', '한국 2025', 1),
('food', 'ramen-noodle', 'concept', '이자카야 라멘 스타일', 'Izakaya Ramen Style', '어두운 우드톤 + 따뜻한 조명 + 일본 주점 분위기. 라멘+사이드(교자/카라아게) 주류 매출 병행 가능', 'Dark wood tone + warm lighting + izakaya atmosphere. Ramen + sides + alcohol sales combination', 'Star', '{"일본감성", "우드톤", "주류"}', '{"객단가 상승 (주류 추가)", "SNS 사진 촬영 유도", "차별화된 분위기", "재방문 유도"}', '{"인테리어 비용 높음", "환기 설비 필수", "청소 관리 까다로움"}', '평당 150~250만원', '한국 2025', 1);

-- salad-healthy
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('food', 'salad-healthy', 'material', '오픈 샐러드 바 & 쇼케이스', 'Open Salad Bar & Showcase', '신선한 재료를 보여주는 투명 쇼케이스가 건강식 매장의 핵심. 위생 관리 용이한 스테인리스', 'Transparent showcase showing fresh ingredients is key. Stainless steel for easy hygiene management', 'Leaf', '{"신선", "건강", "투명"}', NULL, NULL, '세트 300~800만원', '한국 2025', 1),
('food', 'salad-healthy', 'concept', '그린 내추럴 컨셉', 'Green Natural Concept', '밝은 화이트 + 그린 식물 + 천연 소재(우드, 대나무). 건강한 라이프스타일을 시각적으로 전달', 'Bright white + green plants + natural materials (wood, bamboo). Visually communicates healthy lifestyle', 'Leaf', '{"건강", "자연", "친환경"}', '{"건강식 이미지 강화", "MZ세대 타겟 적합", "SNS 바이럴 유도", "프리미엄 가격 정당화"}', '{"식물 관리 비용", "자연소재 내구성 낮음", "벌레/곰팡이 관리"}', '평당 100~180만원', '한국 2025', 1);

-- ══ CAFE 세부업종 ══

-- specialty-coffee
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('cafe-dessert', 'specialty-coffee', 'material', '로스팅 머신 전시 공간', 'Roaster Display Area', '스페셜티 카페는 로스팅 과정을 보여주는 것이 차별화. 소형 로스터(1-3kg)를 매장 내 배치', 'Showing the roasting process differentiates specialty cafes. Place a small roaster (1-3kg) in-store', 'Factory', '{"로스팅", "스페셜티", "체험"}', NULL, NULL, '로스터 1000~3000만원 + 공간 300만원', '한국 2025', 1),
('cafe-dessert', 'specialty-coffee', 'concept', '서드웨이브 커피 바', 'Third Wave Coffee Bar', '바 형태 카운터 + 원목 + 노출 콘크리트. 바리스타와 대화하며 커피를 받는 경험. 좌석 수보다 경험 중심', 'Bar-style counter + natural wood + exposed concrete. Experience of talking with barista over great coffee', 'Star', '{"서드웨이브", "바카운터", "경험"}', '{"커피 전문성 어필", "높은 객단가 정당화", "마니아 단골 형성", "SNS 차별화"}', '{"좌석 수 제한", "높은 인테리어 비용", "바리스타 역량 의존", "회전율 낮음"}', '평당 180~300만원', '한국 2025', 1);

-- bakery-studio
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('cafe-dessert', 'bakery-studio', 'material', '오픈 베이킹 스테이션', 'Open Baking Station', '반죽부터 굽기까지 보여주는 오픈 주방. 갓 구운 빵 향기가 자연스러운 마케팅', 'Open kitchen showing from dough to baking. Fresh-baked bread aroma is natural marketing', 'Factory', '{"오픈주방", "베이커리", "체험"}', NULL, NULL, '세트 2000~5000만원', '한국 2025', 1),
('cafe-dessert', 'bakery-studio', 'concept', '유러피안 베이커리', 'European Bakery', '따뜻한 우드 + 대리석 + 아이언 선반. 유럽 빵집 감성. 빵을 진열하는 쇼케이스가 인테리어의 핵심', 'Warm wood + marble + iron shelves. European bakery feel. Bread showcase IS the interior design', 'Crown', '{"유럽감성", "프리미엄", "쇼케이스"}', '{"프리미엄 가격 정당화", "선물/이벤트 수요 흡수", "SNS 사진 촬영 명소", "브랜드 가치 향상"}', '{"높은 인테리어 비용", "대리석 관리 어려움", "조리 공간 확보 필요"}', '평당 200~350만원', '한국 2025', 1);

-- ══ BEAUTY 세부업종 ══

-- nail-studio
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('beauty', 'nail-studio', 'material', '네일 시술 테이블 (흡진기 내장)', 'Nail Table with Dust Collector', '흡진기 내장형 시술 테이블이 위생과 고객 만족의 기본. LED 조명 각도 조절 필수', 'Built-in dust collector table is basic for hygiene. Adjustable LED lighting is essential', 'Star', '{"네일", "위생", "흡진"}', NULL, NULL, '테이블당 50~150만원', '한국 2025', 1),
('beauty', 'nail-studio', 'concept', '페미닌 핑크 & 마블', 'Feminine Pink & Marble', '핑크+화이트+대리석 패턴. 네일아트의 정교함을 반영하는 깔끔하고 고급스러운 공간', 'Pink + white + marble pattern. Clean and luxurious space reflecting the precision of nail art', 'Palette', '{"여성", "핑크", "고급"}', '{"MZ 여성 타겟 적합", "SNS 사진 촬영 유도", "프리미엄 가격 정당화", "청결한 이미지"}', '{"트렌드 변화에 취약", "남성 고객 진입 장벽", "대리석 관리 비용"}', '평당 120~200만원', '한국 2025', 1);

-- skin-care-room
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('beauty', 'skin-care-room', 'material', '관리 베드 & 파티션', 'Treatment Bed & Partition', '유압식 높이 조절 베드 + 커튼/파티션으로 프라이버시 확보. 고객 편안함이 재방문율 직결', 'Hydraulic adjustable bed + curtain/partition for privacy. Client comfort directly impacts retention', 'Home', '{"피부관리", "프라이버시", "편안함"}', NULL, NULL, '베드당 80~200만원', '한국 2025', 1),
('beauty', 'skin-care-room', 'concept', '스파 & 힐링 컨셉', 'Spa & Healing Concept', '어두운 톤 + 간접 조명 + 아로마 + 자연 소재. 도심 속 힐링 공간. 고객이 잠들 수 있는 편안함', 'Dark tone + ambient lighting + aroma + natural materials. Urban healing space. Comfort where clients can fall asleep', 'Leaf', '{"힐링", "스파", "편안함"}', '{"프리미엄 가격 정당화", "재방문율 향상", "입소문 마케팅 효과", "차별화된 경험"}', '{"관리비 높음 (향초/아로마)", "공간 분리에 면적 필요", "청소/위생 관리 강화"}', '평당 150~280만원', '한국 2025', 1);

-- ══ FITNESS 세부업종 ══

-- yoga-studio
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('fitness', 'yoga-studio', 'material', '방음 바닥재 (코르크/고무)', 'Soundproof Flooring (Cork/Rubber)', '요가 스튜디오는 맨발 활동이 많으므로 따뜻하고 쿠셔닝 있는 바닥재 필수. 코르크 또는 고밀도 고무', 'Yoga studios need warm, cushioned flooring for barefoot activities. Cork or high-density rubber', 'Layers', '{"바닥재", "요가", "방음"}', NULL, NULL, '평당 8~20만원', '한국 2025', 1),
('fitness', 'yoga-studio', 'concept', '젠 미니멀 스튜디오', 'Zen Minimal Studio', '밝은 화이트 + 원목 + 간접 조명 + 대형 거울. 넓은 공간감과 차분한 분위기. 소품은 최소화', 'Bright white + wood + ambient lighting + large mirrors. Spacious and calm atmosphere. Minimal props', 'Leaf', '{"선(禪)", "미니멀", "명상"}', '{"수업 집중도 향상", "다양한 요가 스타일 호환", "사진/영상 촬영 적합", "청결 유지 용이"}', '{"공간 효율 낮음 (넓은 면적 필요)", "냉난방 비용", "거울 관리"}', '평당 80~150만원', '한국 2025', 1);

-- pt-gym
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('fitness', 'pt-gym', 'material', '충격 흡수 바닥재 (고무 매트)', 'Impact-Absorbing Rubber Mat Floor', 'PT/헬스장은 중량 운동 시 바닥 보호와 소음 감소를 위해 20mm+ 고무 매트 필수', '20mm+ rubber mats are essential for weight training to protect floors and reduce noise', 'Shield', '{"운동", "안전", "방음"}', NULL, NULL, '평당 5~15만원', '한국 2025', 1),
('fitness', 'pt-gym', 'concept', '인더스트리얼 짐', 'Industrial Gym', '노출 콘크리트 + 메탈 + 어두운 톤. 강한 운동 의지를 자극하는 하드코어 분위기', 'Exposed concrete + metal + dark tone. Hardcore atmosphere that stimulates training motivation', 'Zap', '{"하드코어", "인더스트리얼", "근력"}', '{"운동 동기 부여", "남성 고객 선호", "인테리어 비용 절감 (노출 마감)", "내구성 우수"}', '{"여성 고객 접근성 낮음", "조명 부족 시 안전 위험", "청소 어려움"}', '평당 60~120만원', '한국 2025', 1);

-- ══ RETAIL 세부업종 ══

-- lifestyle-goods
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('retail', 'lifestyle-goods', 'material', '모듈형 진열 선반', 'Modular Display Shelving', '편집샵은 시즌마다 상품이 바뀌므로 모듈형 선반 필수. 높이/폭 조절 가능한 시스템 선반', 'Modular shelving is essential as products change seasonally. Height/width adjustable system shelves', 'Layers', '{"모듈형", "편집샵", "진열"}', NULL, NULL, '유닛당 20~80만원', '한국 2025', 1),
('retail', 'lifestyle-goods', 'concept', '갤러리형 편집샵', 'Gallery-Style Select Shop', '화이트 큐브 + 스팟 조명 + 여백. 상품을 작품처럼 진열. 29CM/카시나 등 성공 편집샵 레퍼런스', 'White cube + spot lighting + white space. Display products like art. References: 29CM, KASINA', 'Palette', '{"갤러리", "미니멀", "큐레이션"}', '{"상품 가치 극대화", "프리미엄 가격 정당화", "SNS 핫플 가능성", "브랜드 이미지 강화"}', '{"상품 수량 제한", "진열 변경 빈번", "조명 비용 높음"}', '평당 120~220만원', '한국 2025', 1);

-- unmanned-retail
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('retail', 'unmanned-retail', 'material', '무인 결제 키오스크 & CCTV', 'Self-Checkout Kiosk & CCTV', '무인매장 핵심: 키오스크 + AI CCTV + 전자출입문. 도난 방지와 결제 안정성이 생존 조건', 'Unmanned store essentials: kiosk + AI CCTV + electronic door. Anti-theft and payment stability are survival conditions', 'Shield', '{"무인", "키오스크", "보안"}', NULL, NULL, '세트 1000~3000만원', '한국 2025', 1),
('retail', 'unmanned-retail', 'concept', '스마트 무인 스토어', 'Smart Unmanned Store', '밝은 조명 + 투명 유리 + 깔끔한 진열. 고객이 안심하고 들어올 수 있는 개방적 공간', 'Bright lighting + transparent glass + clean display. Open space where customers feel safe entering', 'Monitor', '{"무인", "스마트", "개방"}', '{"24시간 운영 가능", "인건비 제로", "투명 유리로 안전감", "확장 용이"}', '{"도난 리스크", "기기 고장 시 매출 중단", "고객 응대 불가", "보험 필수"}', '평당 100~200만원', '한국 2025', 1);

-- ══ SPACE 세부업종 ══

-- shared-office
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('space', 'shared-office', 'material', '방음 파티션 & 포커스 부스', 'Soundproof Partition & Focus Booth', '공유오피스는 개방과 집중의 균형이 핵심. 이동식 방음 파티션 + 1인 포커스 부스 배치', 'Balance between openness and focus is key. Mobile soundproof partitions + single-person focus booths', 'Shield', '{"방음", "집중", "유연"}', NULL, NULL, '파티션 50~150만원, 부스 200~500만원', '글로벌 2025', 1),
('space', 'shared-office', 'concept', '코워킹 라운지', 'Co-working Lounge', '카페+오피스 하이브리드. 따뜻한 우드 + 소파석 + 집중석 혼합. 입주사 간 네트워킹 유도', 'Cafe + office hybrid. Warm wood + sofa + focus desk mix. Encourages networking between tenants', 'Home', '{"코워킹", "네트워킹", "카페"}', '{"다양한 작업 스타일 수용", "입주사 만족도 향상", "공간 활용도 극대화", "프리미엄 가격 가능"}', '{"소음 관리 어려움", "가구 마모 빈번", "청소 범위 넓음"}', '평당 100~200만원', '글로벌 2025', 1);

-- party-room
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority)
VALUES
('space', 'party-room', 'material', 'LED 조명 시스템 (색상 변경)', 'LED Lighting System (Color Changing)', '파티룸 분위기의 90%는 조명. RGB LED + 간접 조명 + 미러볼로 다양한 테마 연출', 'Lighting is 90% of party room atmosphere. RGB LED + ambient + mirror ball for various themes', 'Lightbulb', '{"파티", "조명", "분위기"}', NULL, NULL, '세트 100~500만원', '한국 2025', 1),
('space', 'party-room', 'concept', '인스타그래머블 파티룸', 'Instagrammable Party Room', '포토존 + 네온사인 + 풍선 아치 + 테마별 벽지. 예약의 70%가 SNS 사진 때문에 옴', 'Photo zone + neon signs + balloon arch + themed wallpaper. 70% of bookings come from SNS photos', 'Star', '{"인스타", "포토존", "SNS"}', '{"예약률 극대화", "자연스러운 바이럴 마케팅", "시즌별 테마 변경 용이", "높은 재예약율"}', '{"소품 교체 비용", "관리/청소 부담", "트렌드 빠른 변화"}', '평당 80~180만원', '한국 2025', 1);
