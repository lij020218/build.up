-- ─── 업종별 인테리어 자재 · 디자인 컨셉 가이드 ──────────────────────────────
-- construction_setup 단계에서 세부 업종(sub_industry_id)에 따라
-- 최적화된 자재와 공간 디자인 컨셉을 동적으로 제공합니다.
-- 출처: 한국·미국 2025 인테리어 트렌드 조사, 업종별 전문가 인터뷰, 상업공간 전문 매체

CREATE TABLE IF NOT EXISTS public.interior_design_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id text NOT NULL,
  sub_industry_id text,
  guide_type text NOT NULL CHECK (guide_type IN ('material', 'concept')),
  name_ko text NOT NULL,
  name_en text,
  description_ko text NOT NULL,
  description_en text,
  icon_name text,
  tags text[] DEFAULT '{}',
  pros text[],
  cons text[],
  cost_range_ko text,
  cost_range_en text,
  trend_source text,
  priority int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interior_guides_lookup
  ON interior_design_guides(category_id, sub_industry_id, guide_type)
  WHERE is_active = true;

ALTER TABLE interior_design_guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read interior guides" ON interior_design_guides;
CREATE POLICY "Anyone can read interior guides" ON interior_design_guides FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
--  SEED DATA — 전체 업종별 인테리어 자재 · 디자인 컨셉
--  각 세부 업종별 자재 8~12개 + 컨셉 5~6개
-- ═══════════════════════════════════════════════════════════════════════════

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  CAFE-DESSERT: 테이크아웃 커피 (takeout-coffee)              ║
-- ╚═══════════════════════════════════════════════════════════════╝
INSERT INTO interior_design_guides (category_id, sub_industry_id, guide_type, name_ko, name_en, description_ko, description_en, icon_name, tags, pros, cons, cost_range_ko, trend_source, priority) VALUES
-- 자재
('cafe-dessert', 'takeout-coffee', 'material', '마이크로 시멘트 바닥', 'Micro-cement Floor', '노출 콘크리트 느낌의 무줄눈 바닥재. 물청소 가능하며 인더스트리얼·미니멀 카페에 최적.', 'Seamless concrete-look floor. Washable, ideal for industrial/minimal cafes.', 'Layers', '{"바닥", "모던", "10평 이하"}', NULL, NULL, '평당 15~25만원', '한국 2025', 1),
('cafe-dessert', 'takeout-coffee', 'material', '폴리싱 콘크리트 바닥', 'Polished Concrete Floor', '기존 콘크리트를 연마·코팅. 시공비 저렴하고 내구성 최상. 해외 3rd wave 카페 필수 자재.', 'Grind and coat existing concrete. Low cost, top durability. Must-have for 3rd wave cafes.', 'Layers', '{"바닥", "가성비", "인더스트리얼"}', NULL, NULL, '평당 8~15만원', '미국 2025', 2),
('cafe-dessert', 'takeout-coffee', 'material', '원목 슬랩 카운터', 'Live-edge Wood Counter', '자연 엣지를 살린 원목 슬랩. 바리스타 작업대 겸 주문대. SNS 포토 포인트로 활용.', 'Natural-edge slab. Barista workstation + order point. Instagram photo spot.', 'Layers', '{"카운터", "감성", "SNS"}', NULL, NULL, '80~200만원/개', '글로벌 2025', 3),
('cafe-dessert', 'takeout-coffee', 'material', '서브웨이 타일 벽면', 'Subway Tile Wall', '화이트/그레이 직사각 타일. 카운터 뒤 벽면에 시공 시 깔끔+위생적. 그라우트 색상으로 포인트.', 'White/gray rectangular tile. Clean and hygienic behind counter. Grout color as accent.', 'Layers', '{"벽면", "클린", "위생"}', NULL, NULL, '평당 8~15만원', '글로벌 2025', 4),
('cafe-dessert', 'takeout-coffee', 'material', '간접 LED 조명 (2700~3000K)', 'Indirect LED (2700-3000K)', '따뜻한 톤 간접 조명. 카운터 하단·천장 코브·선반 뒤에 설치. 공간감+분위기 동시에.', 'Warm indirect LED. Under-counter, ceiling cove, behind shelves. Space and mood.', 'Lightbulb', '{"조명", "분위기", "필수"}', NULL, NULL, '30~80만원', '한국 2025', 5),
('cafe-dessert', 'takeout-coffee', 'material', '펜던트 조명 (에디슨 벌브/클리어 글로브)', 'Pendant Light (Edison/Globe)', '카운터 상부 포인트 조명. 에디슨 벌브(인더스트리얼) 또는 클리어 글로브(모던).', 'Counter overhead accent. Edison bulb (industrial) or clear globe (modern).', 'Lightbulb', '{"조명", "포인트", "디자인"}', NULL, NULL, '개당 5~30만원', '글로벌 2025', 6),
('cafe-dessert', 'takeout-coffee', 'material', '오픈형 원목 선반', 'Open Wood Shelving', '원두·컵·소품 디스플레이용. 벽면 활용으로 좁은 공간 효율 극대화.', 'For beans, cups, accessories display. Wall-mounted maximizes small space.', 'Layers', '{"가구", "수납", "디스플레이"}', NULL, NULL, '30~80만원', '한국 2025', 7),
('cafe-dessert', 'takeout-coffee', 'material', '스테인리스 드립 스테이션', 'Stainless Drip Station', '핸드드립·푸어오버 전용 스테이션. 배수+작업 효율을 위한 스테인리스 트레이.', 'Hand drip/pour-over station. Stainless tray for drainage and workflow.', 'Layers', '{"장비", "스페셜티", "작업대"}', NULL, NULL, '50~150만원', '미국 2025', 8),
('cafe-dessert', 'takeout-coffee', 'material', '어닝/차양 (외부)', 'Awning / Canopy', '매장 전면 어닝. 테이크아웃 대기 고객을 위한 비·햇빛 차단. 브랜드 로고 인쇄 가능.', 'Front awning. Rain/sun protection for takeout queue. Brand logo printable.', 'Layers', '{"외부", "간판", "실용"}', NULL, NULL, '50~200만원', '한국 2025', 9),
('cafe-dessert', 'takeout-coffee', 'material', '친환경 페인트 (저VOC)', 'Eco-friendly Paint (Low-VOC)', '벽면 도장용 친환경 페인트. VOC 50g/L 이하. 모카무스·웜베이지·화이트 톤 추천.', 'Wall paint. VOC under 50g/L. Mocha mousse, warm beige, white recommended.', 'Palette', '{"벽면", "친환경", "색상"}', NULL, NULL, '평당 3~8만원', '한국 2025', 10),

-- 컨셉
('cafe-dessert', 'takeout-coffee', 'concept', '미니멀 화이트 카페', 'Minimal White Cafe', '화이트+우드 기반 깔끔한 공간. 테이크아웃 동선 최적화. 인스타 포토존 1곳 배치. 소자본 창업에 최적.', 'White+wood clean space. Takeout flow optimized. One Instagram photo spot. Best for small capital.', 'Layers', '{"2030 여성", "깔끔", "테이크아웃", "소자본"}', '{"동선 최적화로 회전율 극대화", "인테리어 비용 최소화", "유지보수 용이", "확장 용이"}', '{"차별화 어려움", "차가운 느낌 가능", "홀 좌석 제한"}', '평당 120~160만원', '한국 2025', 1),
('cafe-dessert', 'takeout-coffee', 'concept', '인더스트리얼 에스프레소 바', 'Industrial Espresso Bar', '노출 천장+철제 파이프+시멘트 벽. 에스프레소 머신을 바처럼 쇼케이스 배치. 스페셜티 카페.', 'Exposed ceiling + metal pipes + cement. Espresso machine showcased bar-style. Specialty focus.', 'Factory', '{"20-30대 남성", "스페셜티", "바리스타", "SNS"}', '{"공사비 절감(천장 미시공)", "강렬한 브랜드 이미지", "SNS 바이럴 유리", "야간 분위기 좋음"}', '{"소음 문제", "먼지 관리", "추울 수 있음", "여성 단독 방문 저조 가능"}', '평당 100~140만원', '글로벌 2025', 2),
('cafe-dessert', 'takeout-coffee', 'concept', '우드 내추럴 카페', 'Natural Wood Cafe', '원목+식물+자연광 중심. 바이오필릭 디자인. 편안한 분위기로 체류시간·리피트율 증가.', 'Wood + plants + natural light. Biophilic design. Comfortable for longer stays and repeat visits.', 'Leaf', '{"가족", "주거지", "힐링", "바이오필릭"}', '{"따뜻한 분위기", "체류시간 증가", "리피트율 높음", "전연령 소구"}', '{"인테리어비 높음", "식물 관리 필요", "원목 관리 필요"}', '평당 160~220만원', '미국 2025', 3),
('cafe-dessert', 'takeout-coffee', 'concept', '뉴트로 레트로 카페', 'Newtro Retro Cafe', '80-90년대 레트로 감성+현대적 편의. 빈티지 가구+타일+네온사인. MZ세대 인기.', '80s-90s retro vibe + modern convenience. Vintage furniture + tiles + neon. Popular with MZ generation.', 'Star', '{"MZ세대", "레트로", "빈티지", "포토존"}', '{"강한 콘셉트", "SNS 확산력", "빈티지 가구 저렴 구매 가능", "유니크함"}', '{"유행 주기 짧을 수 있음", "통일감 유지 어려움", "소품 관리"}', '평당 130~180만원', '한국 2025', 4),
('cafe-dessert', 'takeout-coffee', 'concept', '모카 톤 프리미엄 카페', 'Mocha Tone Premium Cafe', '2025 팬톤 올해의 색 모카무스 기반. 브라운+베이지+골드 포인트. 고급스러운 분위기.', '2025 Pantone Mocha Mousse based. Brown+beige+gold accents. Sophisticated atmosphere.', 'Palette', '{"프리미엄", "고급", "2025트렌드", "데이트"}', '{"트렌드 반영", "고급 느낌", "객단가 상승", "와이드 연령층"}', '{"색상 톤 맞추기 어려움", "비용 높음"}', '평당 170~230만원', '글로벌 2025', 5),

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  CAFE-DESSERT: 디저트 카페 (dessert-cafe)                    ║
-- ╚═══════════════════════════════════════════════════════════════╝
('cafe-dessert', 'dessert-cafe', 'material', '쇼케이스 냉장 진열대 (곡면 유리)', 'Curved Glass Display Case', '디저트 시각 진열 핵심 장비. 곡면 유리+LED 내장. 150~400만원. 매장 첫인상 결정.', 'Core dessert display. Curved glass + built-in LED. 1.5-4M won. Defines first impression.', 'Layers', '{"필수", "쇼케이스", "디저트"}', NULL, NULL, '150~400만원', '한국 2025', 1),
('cafe-dessert', 'dessert-cafe', 'material', '대리석 패턴 상판 (엔지니어드 스톤)', 'Engineered Stone Countertop', '인조 대리석 또는 포셀린 타일. 프리미엄 느낌+관리 용이. 화이트 마블이 가장 인기.', 'Engineered marble or porcelain. Premium feel + easy maintenance. White marble most popular.', 'Layers', '{"카운터", "프리미엄", "고급"}', NULL, NULL, '평당 20~40만원', '글로벌 2025', 2),
('cafe-dessert', 'dessert-cafe', 'material', '아크릴 케이크 디스플레이 돔', 'Acrylic Cake Display Dome', '개별 디저트를 돋보이게 하는 아크릴 돔. 카운터 위 포인트 소품으로 SNS 사진 유도.', 'Acrylic dome highlighting individual desserts. Counter accent for Instagram photos.', 'Layers', '{"소품", "디스플레이", "SNS"}', NULL, NULL, '개당 2~8만원', '글로벌 2025', 3),
('cafe-dessert', 'dessert-cafe', 'material', '핑크/민트 아치형 벽면', 'Pink/Mint Arch Wall', '반원형 아치 조형물 또는 페인트 아치. 파스텔 톤으로 포토존 자체가 마케팅.', 'Semi-circular arch structure or paint arch. Pastel tones make photo zone = marketing.', 'Palette', '{"벽면", "포토존", "파스텔"}', NULL, NULL, '30~100만원', '한국 2025', 4),
('cafe-dessert', 'dessert-cafe', 'material', '테라조 바닥/카운터', 'Terrazzo Floor/Counter', '다양한 색상 칩이 박힌 시멘트 마감. 디저트 카페의 화려함을 바닥부터 연출.', 'Cement finish with color chips. Brings dessert cafe vibrancy from the floor up.', 'Layers', '{"바닥", "화려", "프리미엄"}', NULL, NULL, '평당 20~35만원', '미국 2025', 5),
('cafe-dessert', 'dessert-cafe', 'material', '골드/로즈골드 악센트', 'Gold/Rose Gold Accents', '선반 브라켓·조명 피팅·거울 프레임 등에 골드·로즈골드. 소비용으로 고급감 극대화.', 'Shelf brackets, light fittings, mirror frames in gold/rose gold. Maximum luxury feel.', 'Star', '{"소품", "고급", "악센트"}', NULL, NULL, '소품당 3~15만원', '글로벌 2025', 6),
('cafe-dessert', 'dessert-cafe', 'material', '조각 조명 (스컬프처 라이트)', 'Sculptural Lighting', '예술적 형태의 펜던트 조명. 공간의 시그니처 포인트. 클라우드·버블·꽃잎 형태 인기.', 'Artistic pendant lights. Space signature point. Cloud, bubble, petal shapes popular.', 'Lightbulb', '{"조명", "포인트", "예술"}', NULL, NULL, '개당 20~100만원', '미국 2025', 7),
('cafe-dessert', 'dessert-cafe', 'material', '벨벳/패브릭 좌석', 'Velvet/Fabric Seating', '디저트 카페 체류형 좌석. 벨벳·린넨 소재. 파스텔 색상으로 디저트와 톤 매칭.', 'Dessert cafe seating for longer stays. Velvet/linen. Pastel colors matching desserts.', 'Layers', '{"가구", "체류", "파스텔"}', NULL, NULL, '의자당 10~30만원', '한국 2025', 8),

('cafe-dessert', 'dessert-cafe', 'concept', '파스텔 디저트 부티크', 'Pastel Dessert Boutique', '파스텔 핑크+민트+크림 색상. 쇼케이스 중앙 배치. 포토존 최대화. 보석함 같은 공간.', 'Pastel pink+mint+cream. Central showcase. Maximized photo zones. Jewel box space.', 'Palette', '{"2030 여성", "인스타", "디저트", "부티크"}', '{"SNS 바이럴 극대화", "여성 고객 타겟 명확", "포토존 자체가 마케팅", "프리미엄 느낌"}', '{"유행 변화에 민감", "남성 고객 진입장벽", "색상 관리 필요"}', '평당 180~250만원', '한국 2025', 1),
('cafe-dessert', 'dessert-cafe', 'concept', '모던 파티시에 아틀리에', 'Modern Patissier Atelier', '화이트+스테인리스+유리. 오픈 키친으로 제조 과정 공개. 파티시에가 주인공인 공간.', 'White+stainless+glass. Open kitchen showing production. Patissier as star of the space.', 'Layers', '{"프리미엄", "오픈키친", "장인", "고급"}', '{"신뢰감", "프리미엄 이미지", "체험형 매장", "차별화"}', '{"넓은 공간 필요", "비용 높음", "위생 관리 강화"}', '평당 200~280만원', '글로벌 2025', 2),
('cafe-dessert', 'dessert-cafe', 'concept', '가든 디저트 카페', 'Garden Dessert Cafe', '실내 정원+화분+자연광+우드. 바이오필릭 디자인으로 디저트와 자연의 조화.', 'Indoor garden + pots + natural light + wood. Biophilic design harmonizing desserts and nature.', 'Leaf', '{"가족", "힐링", "자연", "정원"}', '{"편안한 분위기", "전연령 소구", "인스타 가능", "사계절 매력"}', '{"식물 관리 비용", "벌레 관리", "넓은 공간"}', '평당 190~260만원', '미국 2025', 3),
('cafe-dessert', 'dessert-cafe', 'concept', '빈티지 유러피안 살롱', 'Vintage European Salon', '앤티크 가구+샹들리에+레이스. 유럽 귀족 느낌의 디저트 살롱. 애프터눈 티 콘셉트.', 'Antique furniture + chandelier + lace. European aristocratic dessert salon. Afternoon tea concept.', 'Crown', '{"프리미엄", "유럽", "앤티크", "애프터눈 티"}', '{"극강 분위기", "객단가 높음", "차별화 최고", "충성 고객 형성"}', '{"매우 높은 비용", "유지 관리 어려움", "좁은 타겟"}', '평당 250~350만원', '글로벌 2025', 4),
('cafe-dessert', 'dessert-cafe', 'concept', '팝아트 디저트 팩토리', 'Pop Art Dessert Factory', '비비드 컬러+네온+그래피티. 놀이공원 같은 공간에서 디저트 체험. 10-20대 타겟.', 'Vivid colors + neon + graffiti. Amusement park-like space for dessert experience. Teens target.', 'Zap', '{"10-20대", "팝아트", "체험", "비비드"}', '{"SNS 폭발", "회전율 높음", "이벤트 공간 활용", "트렌디"}', '{"유행 주기 짧음", "30대 이상 진입장벽", "시끄러울 수 있음"}', '평당 150~200만원', '미국 2025', 5),

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  FOOD: 한식 일반 (korean-casual)                             ║
-- ╚═══════════════════════════════════════════════════════════════╝
('food', 'korean-casual', 'material', '한옥풍 원목 테이블 (소나무/참나무)', 'Hanok-style Wood Table', '4인 원목 테이블. 전통 한식집 분위기 핵심. 가장자리 라운딩 처리로 안전성 확보.', 'Solid wood 4-seat table. Core Korean restaurant atmosphere. Rounded edges for safety.', 'Layers', '{"가구", "한식", "전통"}', NULL, NULL, '테이블당 30~80만원', '한국 2025', 1),
('food', 'korean-casual', 'material', '차콜/네이비 벽면 도장', 'Charcoal/Navy Wall Paint', '어두운 톤 도장. 따뜻한 조명과 조합 시 고급 한식 분위기. 매트 마감 권장.', 'Dark tone paint. Combined with warm lighting for premium Korean feel. Matte finish recommended.', 'Palette', '{"벽면", "고급", "분위기"}', NULL, NULL, '평당 5~10만원', '한국 2025', 2),
('food', 'korean-casual', 'material', '주방 후드 + 배기 덕트', 'Kitchen Hood + Exhaust Duct', '한식 조리 시 연기·기름 다량 발생. 고성능 후드 필수. 덕트 공사비 별도 주의.', 'Korean cooking heavy smoke/oil. High-performance hood required. Separate duct cost.', 'Wind', '{"주방", "필수", "환기"}', NULL, NULL, '200~500만원', '한국 2025', 3),
('food', 'korean-casual', 'material', '업소용 인덕션/가스레인지 테이블', 'Commercial Induction/Gas Table', '테이블 매립형 인덕션 또는 가스. 1인 전골·찌개용. 안전 자동차단 기능 필수.', 'Table-embedded induction or gas. For individual hot pots. Auto-shutoff safety required.', 'Layers', '{"장비", "테이블", "1인식"}', NULL, NULL, '테이블당 15~40만원', '한국 2025', 4),
('food', 'korean-casual', 'material', '미끄럼 방지 타일 바닥', 'Anti-slip Tile Floor', '주방+홀 바닥. 물·기름에 미끄러지지 않는 논슬립 타일 필수. 200×200 소형 타일 권장.', 'Kitchen+hall floor. Non-slip tile essential. 200x200 small format recommended.', 'Layers', '{"바닥", "안전", "필수"}', NULL, NULL, '평당 10~20만원', '한국 2025', 5),
('food', 'korean-casual', 'material', '한지/창호 패턴 파티션', 'Hanji/Lattice Pattern Partition', '좌석 간 반투명 파티션. 한지 무늬 또는 한옥 격자 패턴. 프라이버시+전통미.', 'Semi-transparent partition between seats. Hanji paper or hanok lattice. Privacy + tradition.', 'Layers', '{"파티션", "전통", "프라이버시"}', NULL, NULL, '파티션당 20~60만원', '한국 2025', 6),
('food', 'korean-casual', 'material', '스테인리스 주방 선반/작업대', 'Stainless Kitchen Shelf/Counter', 'HACCP 기준 충족하는 스테인리스 주방. 위생+내구성 최고. 커스텀 제작 권장.', 'HACCP-compliant stainless kitchen. Best hygiene + durability. Custom fabrication recommended.', 'Shield', '{"주방", "위생", "필수"}', NULL, NULL, '100~300만원', '한국 2025', 7),
('food', 'korean-casual', 'material', '메뉴판 DID (디지털 사이니지)', 'Digital Menu Board (DID)', '벽걸이 또는 카운터형 디지털 메뉴판. 계절 메뉴 교체 용이. 32~55인치.', 'Wall or counter digital menu. Easy seasonal menu change. 32-55 inch.', 'Monitor', '{"장비", "디지털", "메뉴"}', NULL, NULL, '50~150만원', '한국 2025', 8),
('food', 'korean-casual', 'material', '방염 커튼/블라인드', 'Fire-retardant Curtain/Blind', '음식점 필수 방염 인증 커튼. 창문 차단+프라이버시. 소방 점검 대비.', 'Restaurant required fire-retardant curtain. Window blocking + privacy. Fire inspection ready.', 'Shield', '{"창문", "방염", "필수"}', NULL, NULL, '창당 5~15만원', '한국 2025', 9),
('food', 'korean-casual', 'material', '외부 간판 (채널 사인/갈바 사인)', 'Exterior Sign (Channel/Galba)', '매장 정면 간판. 채널 사인(LED 내장 입체)이 가장 대중적. 갈바늄 사인은 모던.', 'Front signage. Channel sign (LED embedded 3D) most popular. Galvanium for modern look.', 'Layers', '{"외부", "간판", "브랜드"}', NULL, NULL, '100~300만원', '한국 2025', 10),

('food', 'korean-casual', 'concept', '모던 한식 다이닝', 'Modern Korean Dining', '한옥 디테일(격자·처마선)+모던 미니멀. 1인석+단체석 분리. 고급 접대 한식.', 'Hanok details + modern minimal. Solo + group seating separated. Premium Korean dining.', 'Home', '{"고급", "접대", "1인식", "프리미엄"}', '{"고급 이미지", "접대 수요 확보", "객단가 상승", "와인 페어링 가능"}', '{"공사비 높음", "30평+ 필요", "고급 식기 비용"}', '평당 200~300만원', '한국 2025', 1),
('food', 'korean-casual', 'concept', '가성비 백반집 스타일', 'Budget Korean Home-meal', '깔끔 식탁+스테인리스 주방 노출. 넓은 주방으로 조리 과정 보여주기. 회전율 극대화.', 'Clean tables + exposed stainless kitchen. Wide kitchen shows cooking. Max turnover.', 'Layers', '{"가성비", "점심", "직장인", "회전율"}', '{"저비용 시공", "빠른 회전율", "주방 신뢰감", "점심 매출 강함"}', '{"고급 이미지 한계", "저녁 매출 약함", "소품 최소화"}', '평당 80~130만원', '한국 2025', 2),
('food', 'korean-casual', 'concept', '한옥 감성 술집', 'Hanok Vibe Pub', '한옥 목구조 재현+단청 포인트+좌식 공간. 저녁 술자리·회식 수요 특화.', 'Hanok wood structure + Dancheong accent + floor seating. Evening drinking/corporate dining.', 'Layers', '{"술집", "저녁", "회식", "전통"}', '{"저녁 매출 강함", "단체 수요 확보", "독보적 분위기", "외국인 관광"}', '{"점심 매출 약함", "좌식 불편 가능", "소방 주의"}', '평당 180~260만원', '한국 2025', 3),
('food', 'korean-casual', 'concept', '오픈 키친 캐주얼 한식', 'Open Kitchen Casual Korean', '주방 전면 노출+카운터석. 셰프의 조리 과정이 콘텐츠. 1인 식사 친화적.', 'Fully exposed kitchen + counter seats. Chef''s cooking as content. Solo-diner friendly.', 'Layers', '{"1인식", "오픈키친", "캐주얼", "젊은층"}', '{"라이브 느낌", "1인 고객 친화", "콘텐츠 생산", "트렌디"}', '{"소음", "냄새 관리", "주방 위생 노출"}', '평당 150~200만원', '글로벌 2025', 4),
('food', 'korean-casual', 'concept', '레트로 분식집', 'Retro Korean Snack Bar', '80년대 분식집 감성 재해석. 스테인리스+타일+플라스틱 의자+네온. 저비용 고효과.', '80s Korean snack bar reimagined. Stainless+tile+plastic chairs+neon. Low cost high impact.', 'Star', '{"레트로", "MZ세대", "분식", "가성비"}', '{"초저비용 시공", "SNS 바이럴", "MZ세대 인기", "유니크"}', '{"실제 불편할 수 있음", "유행 변화 빠름"}', '평당 70~120만원', '한국 2025', 5),

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  FOOD: 치킨·버거 (chicken-burger)                           ║
-- ╚═══════════════════════════════════════════════════════════════╝
('food', 'chicken-burger', 'material', '방화 타일 주방 벽면', 'Fire-resistant Kitchen Tile', '튀김 주방 필수. 대형 논슬립 타일. 그리스 오염 쉽게 청소 가능한 유광 권장.', 'Essential for frying kitchen. Large non-slip tile. Glossy finish for easy grease cleaning.', 'Shield', '{"주방", "필수", "안전"}', NULL, NULL, '평당 10~20만원', '한국 2025', 1),
('food', 'chicken-burger', 'material', '배달 전용 패킹 스테이션', 'Delivery Packing Station', '배달 주문 포장 전용 공간. 동선 분리로 홀·배달 동시 운영 효율화. 선반+열 유지 장비.', 'Dedicated delivery packing area. Separated flow. Shelves + heat-holding equipment.', 'Package', '{"배달", "효율", "동선"}', NULL, NULL, '50~150만원', '한국 2025', 2),
('food', 'chicken-burger', 'material', '그리스트랩 (유수분리기)', 'Grease Trap', '튀김 업종 인허가 필수. 하수도 기름 유입 방지. 정기 청소 필수.', 'Required for frying businesses. Prevents grease in sewage. Regular cleaning essential.', 'Droplets', '{"주방", "필수", "인허가"}', NULL, NULL, '30~100만원', '한국 2025', 3),
('food', 'chicken-burger', 'material', '고성능 튀김 전용 후드', 'High-performance Fry Hood', '기름 증기 전용 필터 후드. 일반 후드 대비 3배 흡입. 화재 예방 자동 소화 장치 연동.', 'Oil vapor filter hood. 3x suction vs standard. Auto fire suppression linked.', 'Wind', '{"주방", "필수", "환기"}', NULL, NULL, '200~400만원', '한국 2025', 4),
('food', 'chicken-burger', 'material', '네온 사인 / LED 채널 사인', 'Neon Sign / LED Channel Sign', '매장 내외부 네온 포인트. 브랜드 로고·캐치프레이즈. 야간 가시성 극대화.', 'Interior/exterior neon accent. Brand logo/catchphrase. Maximum night visibility.', 'Zap', '{"외부", "간판", "브랜드"}', NULL, NULL, '30~150만원', '글로벌 2025', 5),
('food', 'chicken-burger', 'material', '세라믹 타일 바닥 (300×300)', 'Ceramic Floor Tile (300x300)', '홀 바닥. 기름 얼룩에 강한 세라믹 타일. 어두운 톤으로 오염 덜 눈에 띄게.', 'Hall floor. Oil-stain resistant ceramic. Dark tones to hide stains.', 'Layers', '{"바닥", "내구성", "실용"}', NULL, NULL, '평당 8~15만원', '한국 2025', 6),
('food', 'chicken-burger', 'material', 'FRP 벽면 (유리섬유강화플라스틱)', 'FRP Wall Panel', '주방 벽면 필수. 기름·습기에 강하고 청소 간편. 화이트 무광으로 깔끔.', 'Kitchen wall essential. Oil/moisture resistant, easy clean. White matte for clean look.', 'Shield', '{"주방", "위생", "필수"}', NULL, NULL, '평당 5~12만원', '한국 2025', 7),
('food', 'chicken-burger', 'material', '키오스크 (무인 주문기)', 'Self-order Kiosk', '인건비 절감 핵심 장비. 15~22인치 터치스크린. 카드·QR 결제 통합.', 'Key labor cost reduction. 15-22 inch touch screen. Integrated card/QR payment.', 'Monitor', '{"장비", "무인", "효율"}', NULL, NULL, '대당 200~400만원', '한국 2025', 8),

('food', 'chicken-burger', 'concept', '스트리트 캐주얼', 'Street Casual', '네온사인+그래피티+스틸 소재. 10-20대 타겟 활기찬 공간. 배달 중심이면 소형 가능.', 'Neon signs + graffiti + steel. Vibrant space for teens/20s. Small format for delivery-focus.', 'Zap', '{"10-20대", "배달", "활기", "스트리트"}', '{"강렬한 브랜드 이미지", "SNS 포토존", "저비용 가능", "야간 매력"}', '{"소음", "고급 이미지 한계", "40대+ 불편 가능"}', '평당 100~150만원', '글로벌 2025', 1),
('food', 'chicken-burger', 'concept', '패밀리 다이닝', 'Family Dining', '밝은 조명+넓은 좌석+아이 의자. 가족 단위 고객 타겟. 주말 매출 극대화.', 'Bright lighting + wide seats + kid chairs. Family customer target. Weekend sales maximized.', 'Home', '{"가족", "주말", "넓은 좌석", "아이"}', '{"주말 매출 강함", "단체 수요", "안정 수요", "테이크아웃 병행"}', '{"평일 점심 약함", "넓은 공간 필요", "청소 부담"}', '평당 120~170만원', '한국 2025', 2),
('food', 'chicken-burger', 'concept', '배달 전문 고스트 키친', 'Delivery-only Ghost Kitchen', '홀 없이 주방만. 최소 인테리어로 초기 비용 극소화. 공유주방 활용 가능.', 'Kitchen-only, no dining. Minimum interior for ultra-low startup cost. Shared kitchen possible.', 'Package', '{"배달", "소자본", "공유주방", "효율"}', '{"초저비용", "1인 운영 가능", "빠른 오픈", "리스크 최소"}', '{"브랜드 인지도 한계", "배달앱 수수료", "홀 매출 없음"}', '평당 40~80만원', '한국 2025', 3),
('food', 'chicken-burger', 'concept', '어반 인더스트리얼 펍', 'Urban Industrial Pub', '노출 천장+벽돌+맥주탭+스포츠 TV. 치맥 문화 특화. 저녁·주말 수요.', 'Exposed ceiling + brick + beer taps + sports TV. Chi-maek culture. Evening/weekend demand.', 'Factory', '{"저녁", "맥주", "치맥", "2030"}', '{"치맥 문화 특화", "저녁 매출 강함", "맥주 마진 높음", "분위기 좋음"}', '{"점심 약함", "소음 민원 가능", "넓은 공간 필요"}', '평당 130~180만원', '글로벌 2025', 4),

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  FOOD: 양식·파스타 (western-pasta-brunch)                    ║
-- ╚═══════════════════════════════════════════════════════════════╝
('food', 'western-pasta-brunch', 'material', '오픈 키친 카운터 (스테인리스+우드)', 'Open Kitchen Counter', '조리 과정을 보여주는 오픈 키친. 스테인리스 작업대+우드 캡으로 따뜻한 느낌.', 'Open kitchen showing cooking. Stainless workstation + wood cap for warmth.', 'Layers', '{"오픈키친", "라이브", "프리미엄"}', NULL, NULL, '150~300만원', '글로벌 2025', 1),
('food', 'western-pasta-brunch', 'material', '테라코타/어스 톤 바닥 타일', 'Terracotta Floor Tile', '이탈리안 트라토리아 느낌. 따뜻한 어스 톤으로 유럽 감성. 300×300 또는 600×600.', 'Italian trattoria feel. Warm earth tones. 300x300 or 600x600 format.', 'Layers', '{"바닥", "유럽", "이탈리안"}', NULL, NULL, '평당 15~30만원', '미국 2025', 2),
('food', 'western-pasta-brunch', 'material', '벽돌 (적벽돌/화이트 벽돌)', 'Brick Wall (Red/White)', '진짜 벽돌 또는 브릭타일. 이탈리안/브런치 분위기 핵심. 화이트 벽돌은 밝은 느낌.', 'Real brick or brick tile. Core Italian/brunch atmosphere. White brick for brightness.', 'Layers', '{"벽면", "유럽", "분위기"}', NULL, NULL, '평당 10~25만원', '글로벌 2025', 3),
('food', 'western-pasta-brunch', 'material', '와인 랙/디스플레이', 'Wine Rack / Display', '벽면 또는 카운터 와인 디스플레이. 와인 매출 유도+인테리어 장식 겸용.', 'Wall or counter wine display. Drives wine sales + doubles as decor.', 'Wine', '{"장비", "와인", "디스플레이"}', NULL, NULL, '30~150만원', '글로벌 2025', 4),
('food', 'western-pasta-brunch', 'material', '캔들/티라이트 테이블 조명', 'Candle/Tealight Table Lighting', '각 테이블 캔들 조명. 저녁 디너 분위기 극대화. LED 캔들로 안전하게.', 'Table candle lighting. Maximizes dinner atmosphere. LED candles for safety.', 'Lightbulb', '{"조명", "분위기", "저녁"}', NULL, NULL, '테이블당 0.5~3만원', '글로벌 2025', 5),
('food', 'western-pasta-brunch', 'material', '패브릭 냅킨/테이블 러너', 'Fabric Napkin / Table Runner', '면 또는 린넨 냅킨. 테이블 러너와 세트로 고급 세팅. 세탁 비용 고려.', 'Cotton or linen napkins. Set with table runner for premium setting. Consider laundry cost.', 'Layers', '{"소품", "고급", "세팅"}', NULL, NULL, '세트당 3~10만원', '글로벌 2025', 6),
('food', 'western-pasta-brunch', 'material', '대형 식물/플랜터', 'Large Plants / Planters', '올리브나무·아레카야자 등 지중해 식물. 파스타 레스토랑 분위기에 최적.', 'Olive tree, areca palm etc. Mediterranean plants. Perfect for pasta restaurant vibe.', 'Leaf', '{"식물", "분위기", "지중해"}', NULL, NULL, '화분당 10~50만원', '글로벌 2025', 7),
('food', 'western-pasta-brunch', 'material', '칠판 메뉴보드 (블랙보드)', 'Chalkboard Menu Board', '일별 스페셜/와인 리스트 표시. 손글씨로 감성적. 벽면 칠판 페인트 시공도 가능.', 'Daily special/wine list display. Handwritten for charm. Wall chalkboard paint option.', 'Layers', '{"메뉴", "감성", "데일리"}', NULL, NULL, '5~30만원', '글로벌 2025', 8),

('food', 'western-pasta-brunch', 'concept', '이탈리안 트라토리아', 'Italian Trattoria', '벽돌+테라코타+와인랙+캔들. 유럽 골목 식당 느낌. 따뜻하고 아늑한 공간.', 'Brick + terracotta + wine rack + candle. European alley restaurant feel. Warm and cozy.', 'Wine', '{"유럽", "데이트", "와인", "이탈리안"}', '{"분위기 최고", "객단가 상승", "와인 매출 추가", "리피트율 높음"}', '{"공사비 높음", "20평+ 필요", "인건비(서빙)"}', '평당 180~250만원', '글로벌 2025', 1),
('food', 'western-pasta-brunch', 'concept', '브런치 카페 스타일', 'Brunch Cafe Style', '화이트+우드+대형 창문+식물. 밝고 개방적. 주말 브런치 수요 + 평일 파스타.', 'White+wood+large windows+plants. Bright and open. Weekend brunch + weekday pasta.', 'Leaf', '{"브런치", "주말", "밝은", "2030 여성"}', '{"주말 매출 강함", "밝은 분위기", "SNS 친화", "전연령 소구"}', '{"오후 공백 가능", "주방 두 종류 대응"}', '평당 150~200만원', '글로벌 2025', 2),
('food', 'western-pasta-brunch', 'concept', '미니멀 원 프레이트', 'Minimal One-plate', '깔끔한 화이트+그레이. 원 프레이트 파스타/리조또 특화. 1인 식사 친화적.', 'Clean white+gray. One-plate pasta/risotto specialty. Solo-diner friendly.', 'Layers', '{"1인식", "미니멀", "직장인", "점심"}', '{"저비용 시공", "1인 고객 특화", "빠른 회전", "점심 강함"}', '{"저녁 분위기 부족", "차별화 한계"}', '평당 100~150만원', '한국 2025', 3),
('food', 'western-pasta-brunch', 'concept', '지중해 비스트로', 'Mediterranean Bistro', '블루+화이트+테라코타+올리브. 그리스·남프랑스 해안가 느낌. 해산물 파스타 특화.', 'Blue+white+terracotta+olive. Greek/South France coastal feel. Seafood pasta specialty.', 'Globe', '{"해산물", "지중해", "데이트", "유럽"}', '{"독보적 분위기", "해산물 특화", "계절 메뉴 가능", "포토제닉"}', '{"식물·소품 관리", "높은 비용", "넓은 공간"}', '평당 200~280만원', '미국 2025', 4),
('food', 'western-pasta-brunch', 'concept', '다크 다이닝 바', 'Dark Dining Bar', '다크 톤+스팟 조명+바 카운터. 야간 파스타+와인바 콘셉트. 성인 타겟.', 'Dark tones + spot lighting + bar counter. Night pasta + wine bar concept. Adult target.', 'Layers', '{"저녁", "와인바", "성인", "고급"}', '{"저녁 매출 극대화", "와인 마진 높음", "분위기 최고"}', '{"점심 매출 약함", "어두운 느낌", "좁은 타겟"}', '평당 160~220만원', '글로벌 2025', 5),

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  BEAUTY: 헤어살롱 (hair-salon)                               ║
-- ╚═══════════════════════════════════════════════════════════════╝
('beauty', 'hair-salon', 'material', '대형 거울 + LED 프레임', 'Large Mirror + LED Frame', '좌석별 대형 거울+측면 LED. 고객 얼굴을 밝게 비춰 시술 만족도 상승.', 'Per-seat large mirror + side LED. Brightens customer face for better service satisfaction.', 'Layers', '{"필수", "시술", "조명"}', NULL, NULL, '좌석당 30~80만원', '한국 2025', 1),
('beauty', 'hair-salon', 'material', '방수 바닥재 (비닐/에폭시)', 'Waterproof Floor (Vinyl/Epoxy)', '염색약·물 사용 많아 방수+청소 용이 바닥 필수. 에폭시 또는 고급 비닐.', 'Heavy dye/water use. Waterproof + easy-clean floor essential. Epoxy or premium vinyl.', 'Droplets', '{"바닥", "필수", "위생"}', NULL, NULL, '평당 8~15만원', '한국 2025', 2),
('beauty', 'hair-salon', 'material', '유압식 미용 의자', 'Hydraulic Styling Chair', '높이 조절 유압 의자. 360도 회전. 가죽 또는 PU 소재. 내구성+편안함 핵심.', 'Height-adjustable hydraulic chair. 360 rotation. Leather or PU. Durability + comfort key.', 'Layers', '{"장비", "필수", "의자"}', NULL, NULL, '의자당 30~100만원', '한국 2025', 3),
('beauty', 'hair-salon', 'material', '샴푸 유닛 (체어+세면대)', 'Shampoo Unit (Chair+Basin)', '리클라이닝 체어+세라믹 세면대 일체형. 편안한 자세로 샴푸 가능.', 'Reclining chair + ceramic basin combo. Comfortable position for shampooing.', 'Droplets', '{"장비", "필수", "샴푸"}', NULL, NULL, '유닛당 80~200만원', '한국 2025', 4),
('beauty', 'hair-salon', 'material', '대기석 소파/벤치', 'Waiting Sofa/Bench', '대기 고객용 편안한 좌석. 카페 같은 느낌으로 잡지·태블릿 비치.', 'Comfortable waiting seats. Cafe-like feel with magazines/tablets.', 'Layers', '{"가구", "대기", "편안"}', NULL, NULL, '50~150만원', '한국 2025', 5),
('beauty', 'hair-salon', 'material', '약품 보관 캐비닛', 'Chemical Storage Cabinet', '염색약·퍼머액 보관 전용. 환기 구멍+잠금 장치. 안전 규정 준수.', 'Dedicated dye/perm storage. Ventilation holes + lock. Safety regulation compliant.', 'Shield', '{"수납", "안전", "약품"}', NULL, NULL, '30~80만원', '한국 2025', 6),
('beauty', 'hair-salon', 'material', '매장 향기 디퓨저 시스템', 'Store Scent Diffuser System', '약품 냄새 상쇄용 디퓨저. 고급 매장 이미지+고객 편안함. 자동 분사형.', 'Diffuser to offset chemical smell. Premium image + customer comfort. Auto-spray type.', 'Layers', '{"소품", "향기", "고급"}', NULL, NULL, '5~30만원', '한국 2025', 7),
('beauty', 'hair-salon', 'material', '플로어 매트 (미끄럼 방지)', 'Anti-slip Floor Mat', '스타일리스트 장시간 서있는 자리에 피로 방지 매트. 물·약품에 강한 소재.', 'Fatigue prevention mat for standing stylists. Water/chemical resistant material.', 'Layers', '{"바닥", "직원", "피로방지"}', NULL, NULL, '매트당 3~10만원', '미국 2025', 8),

('beauty', 'hair-salon', 'concept', '모던 살롱 라운지', 'Modern Salon Lounge', '화이트+골드 포인트. 라운지형 대기석. 카페 같은 대기 공간. 프리미엄 이미지.', 'White + gold accents. Lounge-style waiting. Cafe-like waiting area. Premium image.', 'Star', '{"프리미엄", "2030 여성", "라운지", "고급"}', '{"고급 이미지", "객단가 상승", "리피트율 높음", "SNS 공유"}', '{"유지비 높음", "넓은 공간 필요", "인테리어비 높음"}', '평당 180~250만원', '한국 2025', 1),
('beauty', 'hair-salon', 'concept', '뉴요커 바버샵', 'New Yorker Barber Shop', '다크우드+가죽+빈티지 소품. 남성 전용 이발소 콘셉트. 맥주·위스키 제공.', 'Dark wood+leather+vintage items. Men-only barbershop concept. Beer/whiskey offered.', 'Layers', '{"남성", "바버샵", "빈티지", "성인"}', '{"남성 특화 차별화", "높은 객단가", "충성 고객", "문화 공간"}', '{"여성 고객 배제", "주류 허가 필요 가능", "니치 마켓"}', '평당 160~220만원', '미국 2025', 2),
('beauty', 'hair-salon', 'concept', '미니멀 클린 살롱', 'Minimal Clean Salon', '올화이트+스테인리스+유리. 청결감 극대화. 의료적 신뢰감.', 'All-white+stainless+glass. Maximized cleanliness. Medical-level trust.', 'Layers', '{"미니멀", "청결", "신뢰", "전연령"}', '{"청결 이미지", "전연령 소구", "유지보수 쉬움", "확장 용이"}', '{"차가운 느낌", "차별화 어려움", "포인트 필요"}', '평당 130~170만원', '한국 2025', 3),
('beauty', 'hair-salon', 'concept', '보태니컬 살롱', 'Botanical Salon', '식물+자연광+우드. 힐링 공간으로서의 미용실. 여성 고객 편안함 극대화.', 'Plants+natural light+wood. Hair salon as healing space. Maximum comfort for women.', 'Leaf', '{"여성", "힐링", "자연", "식물"}', '{"편안한 분위기", "리피트율 높음", "차별화", "인스타 가능"}', '{"식물 관리 비용", "공간 넓어야", "습도 관리"}', '평당 170~230만원', '글로벌 2025', 4),

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  FITNESS: 필라테스 (pilates-studio)                           ║
-- ╚═══════════════════════════════════════════════════════════════╝
('fitness', 'pilates-studio', 'material', '충격 흡수 바닥재 (EVA/고무 매트)', 'Shock-absorbing Floor', '리포머·캐딜락 장비 하중+소음 방지. 15mm+ 두께. 롤형 시공으로 이음새 최소화.', 'Reformer/Cadillac equipment load + noise. 15mm+ thick. Roll installation minimizes seams.', 'Layers', '{"바닥", "필수", "방음"}', NULL, NULL, '평당 5~12만원', '한국 2025', 1),
('fitness', 'pilates-studio', 'material', '전면 거울 벽 (비산 방지 필름)', 'Full-wall Mirror (Shatterproof)', '수업 자세 확인 필수. 비산 방지 필름 부착 거울. 최소 벽면 1면 전체 거울.', 'Essential for posture check. Shatterproof film mirror. At least one full wall mirror.', 'Layers', '{"거울", "필수", "시각"}', NULL, NULL, '평당 8~15만원', '한국 2025', 2),
('fitness', 'pilates-studio', 'material', '바레(Barre) 고정 바', 'Fixed Barre', '벽면 고정 바. 스트레칭·바레 수업 겸용. 높이 조절형 추천.', 'Wall-mounted barre. Stretching + barre class dual use. Adjustable height recommended.', 'Layers', '{"장비", "바레", "스트레칭"}', NULL, NULL, '20~50만원', '글로벌 2025', 3),
('fitness', 'pilates-studio', 'material', '간접 조명 (딤머 조절)', 'Dimmable Indirect Lighting', '수업 분위기별 조명 조절. 필라테스 밝게, 요가·명상 어둡게. LED 딤머 필수.', 'Adjustable lighting per class mood. Bright for Pilates, dim for yoga. LED dimmer essential.', 'Lightbulb', '{"조명", "분위기", "조절"}', NULL, NULL, '50~150만원', '글로벌 2025', 4),
('fitness', 'pilates-studio', 'material', '방음 패널 (흡음재)', 'Soundproof Panel', '층간 소음 방지. 장비 진동+음악 소리 차단. 벽면+천장 설치.', 'Floor noise prevention. Equipment vibration + music blocking. Wall + ceiling installation.', 'Shield', '{"방음", "필수", "층간소음"}', NULL, NULL, '평당 5~15만원', '한국 2025', 5),
('fitness', 'pilates-studio', 'material', '바닥 난방 시스템', 'Underfloor Heating', '맨발 수업을 위한 바닥 난방. 겨울철 고객 만족도 결정 요소.', 'Underfloor heating for barefoot classes. Winter customer satisfaction decisive factor.', 'Layers', '{"바닥", "난방", "겨울"}', NULL, NULL, '평당 8~20만원', '한국 2025', 6),
('fitness', 'pilates-studio', 'material', '탈의실 락커 시스템', 'Locker System', '개인 물품 보관 락커. 우드+스틸 조합. 비밀번호/RFID 잠금. 탈의실 필수.', 'Personal item lockers. Wood+steel combo. Password/RFID lock. Locker room essential.', 'Shield', '{"탈의실", "락커", "필수"}', NULL, NULL, '칸당 5~15만원', '한국 2025', 7),
('fitness', 'pilates-studio', 'material', '환기 시스템 (전열교환기)', 'Ventilation (HRV System)', '고강도 운동으로 CO2 증가 빠름. 전열교환기로 환기+냉난방 효율 유지.', 'High-intensity exercise increases CO2 fast. HRV for ventilation + HVAC efficiency.', 'Wind', '{"환기", "필수", "공기질"}', NULL, NULL, '100~300만원', '한국 2025', 8),

('fitness', 'pilates-studio', 'concept', '내추럴 웰니스 스튜디오', 'Natural Wellness Studio', '우드+화이트+식물+자연광. 요가 스튜디오 겸용. 편안하고 힐링되는 공간.', 'Wood+white+plants+natural light. Yoga studio compatible. Comfortable healing space.', 'Leaf', '{"여성", "힐링", "웰니스", "자연"}', '{"편안한 분위기", "요가 겸용", "리피트율 높음", "전연령 소구"}', '{"인테리어비 높음", "식물 관리 비용", "원목 관리"}', '평당 150~200만원', '글로벌 2025', 1),
('fitness', 'pilates-studio', 'concept', '모던 그레이 스튜디오', 'Modern Gray Studio', '그레이+블랙+간접조명. 고급 장비가 돋보이는 미니멀 공간. 프리미엄 클래스.', 'Gray+black+indirect lighting. Minimal space highlighting premium equipment. Premium class.', 'Layers', '{"프리미엄", "모던", "장비 중심", "고급"}', '{"장비가 주인공", "고급 이미지", "남녀 모두 소구", "유지보수 쉬움"}', '{"차가운 느낌", "조명 필수", "단조로울 수 있음"}', '평당 120~170만원', '한국 2025', 2),
('fitness', 'pilates-studio', 'concept', '부티크 필라테스', 'Boutique Pilates', '인테리어 자체가 브랜드. 시그니처 컬러+유니폼+향기. 소규모 프리미엄.', 'Interior as brand identity. Signature color+uniform+scent. Small-scale premium.', 'Star', '{"프리미엄", "소규모", "브랜딩", "2030 여성"}', '{"강력한 브랜드", "높은 객단가", "충성 고객", "확장 가능"}', '{"높은 초기 투자", "브랜딩 전문가 필요"}', '평당 180~250만원', '미국 2025', 3),
('fitness', 'pilates-studio', 'concept', '홈필라테스 감성', 'Home Pilates Feel', '거실 같은 편안함. 카펫+쿠션+따뜻한 조명. 1:1 개인 레슨 특화.', 'Living room comfort. Carpet+cushion+warm lighting. 1:1 private lesson specialty.', 'Home', '{"1:1", "프라이빗", "편안", "개인 레슨"}', '{"프라이빗 느낌", "높은 단가", "편안함", "차별화"}', '{"좁은 타겟", "위생 관리 어려움", "확장 한계"}', '평당 130~180만원', '한국 2025', 4),

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  EDUCATION: 코딩 교실 (coding-class)                         ║
-- ╚═══════════════════════════════════════════════════════════════╝
('education', 'coding-class', 'material', '높낮이 조절 데스크', 'Height-adjustable Desk', '학생별 높이 맞춤. 모니터 거치대 내장형 추천. 장시간 수업 피로 감소.', 'Per-student height adjustment. Built-in monitor stand. Reduces long-class fatigue.', 'Monitor', '{"가구", "인체공학", "IT"}', NULL, NULL, '데스크당 15~40만원', '한국 2025', 1),
('education', 'coding-class', 'material', '방음 파티션/흡음 패널', 'Soundproof Partition Panel', '수업 집중도를 위한 흡음 패널. 강의실 간 소음 차단 필수.', 'Sound-absorbing panels for focus. Noise isolation between classrooms essential.', 'Shield', '{"방음", "집중", "교육"}', NULL, NULL, '평당 5~12만원', '한국 2025', 2),
('education', 'coding-class', 'material', '대형 모니터/TV (75인치+)', 'Large Monitor/TV (75 inch+)', '강사 화면 공유용 대형 디스플레이. 75인치+ 4K. 벽걸이 또는 이동식 스탠드.', 'Large display for instructor screen share. 75+ inch 4K. Wall-mount or mobile stand.', 'Monitor', '{"장비", "교육", "디스플레이"}', NULL, NULL, '대당 150~300만원', '한국 2025', 3),
('education', 'coding-class', 'material', '유선 네트워크 + 고성능 공유기', 'Wired Network + Router', '코딩 수업 인터넷 끊김 방지. 유선 LAN + 기업용 공유기(ASUS/ipTIME).', 'Prevent internet drops during coding class. Wired LAN + enterprise router.', 'Globe', '{"네트워크", "필수", "IT"}', NULL, NULL, '30~80만원', '한국 2025', 4),
('education', 'coding-class', 'material', '화이트보드 벽 (전체 벽면)', 'Whiteboard Wall (Full Wall)', '벽면 전체를 화이트보드 페인트로 시공. 브레인스토밍+코드 리뷰에 최적.', 'Full wall with whiteboard paint. Optimal for brainstorming + code review.', 'Layers', '{"벽면", "화이트보드", "교육"}', NULL, NULL, '평당 5~10만원', '미국 2025', 5),
('education', 'coding-class', 'material', '멀티탭/전원 관리 시스템', 'Power Management System', '학생당 2구+ 콘센트 필수. 바닥매립형 또는 데스크 내장형. 안전차단기 연동.', 'Min 2 outlets per student. Floor-embedded or desk-integrated. Circuit breaker linked.', 'Zap', '{"전기", "필수", "안전"}', NULL, NULL, '20~60만원', '한국 2025', 6),

('education', 'coding-class', 'concept', '테크 허브 스타일', 'Tech Hub Style', '화이트보드 벽+네온 포인트+다크 톤. 실리콘밸리 스타트업 사무실 느낌.', 'Whiteboard wall + neon accent + dark tone. Silicon Valley startup office feel.', 'Zap', '{"IT", "청소년", "스타트업", "몰입"}', '{"몰입감 높음", "트렌디", "SNS 효과", "학생 동기부여"}', '{"어두울 수 있음", "유지 관리", "소품 많음"}', '평당 120~170만원', '미국 2025', 1),
('education', 'coding-class', 'concept', '밝은 학원 스탠다드', 'Bright Academy Standard', '화이트+밝은 조명+깔끔한 데스크. 학부모 신뢰감. 넓은 창문으로 채광.', 'White + bright lighting + clean desks. Parent trust. Large windows for natural light.', 'Lightbulb', '{"학부모", "신뢰", "밝은", "표준"}', '{"학부모 안심", "깨끗한 이미지", "저비용", "범용성"}', '{"차별화 어려움", "트렌디하지 않음"}', '평당 80~120만원', '한국 2025', 2),
('education', 'coding-class', 'concept', '게이밍 아카데미', 'Gaming Academy', 'RGB 조명+게이밍 체어+다크 테마. 게임 개발·e스포츠 과정 특화.', 'RGB lighting + gaming chairs + dark theme. Game dev / e-sports course specialty.', 'Monitor', '{"게이밍", "청소년", "e스포츠", "코딩"}', '{"학생 몰입", "차별화 극대화", "바이럴 효과", "트렌디"}', '{"학부모 거부감 가능", "비용 높음", "좁은 과정 타겟"}', '평당 140~190만원', '글로벌 2025', 3),

-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  PET: 펫 미용 (pet-grooming)                                 ║
-- ╚═══════════════════════════════════════════════════════════════╝
('pet', 'pet-grooming', 'material', '방수+항균 바닥재', 'Waterproof Antibacterial Floor', '펫 미용 시 물+털 다량 발생. 배수 용이+항균 처리 필수. 경사 배수.', 'Heavy water + fur. Easy drainage + antibacterial essential. Sloped drainage.', 'Droplets', '{"바닥", "필수", "위생"}', NULL, NULL, '평당 10~20만원', '한국 2025', 1),
('pet', 'pet-grooming', 'material', '투명 유리 파티션', 'Glass Partition', '보호자가 미용 과정 관찰 가능. 신뢰도+안심감 UP. 방음 효과.', 'Owner can watch grooming. Trust + comfort. Soundproofing effect.', 'Layers', '{"파티션", "투명", "신뢰"}', NULL, NULL, '파티션당 50~120만원', '한국 2025', 2),
('pet', 'pet-grooming', 'material', '높낮이 조절 미용 테이블', 'Adjustable Grooming Table', '견종별 높이 조절. 유압식 또는 전동식. 미끄럼 방지 상판+팔 고정.', 'Height adjustable per breed. Hydraulic or electric. Non-slip top + arm restraint.', 'Layers', '{"장비", "필수", "미용"}', NULL, NULL, '테이블당 50~200만원', '한국 2025', 3),
('pet', 'pet-grooming', 'material', '스테인리스 욕조 (대형/소형)', 'Stainless Bathtub (Large/Small)', '반려동물 목욕 전용. 대형견·소형견 분리 권장. 배수+거치대+샤워기 일체형.', 'Pet bathing tub. Separate large/small dog recommended. Drain + stand + shower integrated.', 'Droplets', '{"장비", "필수", "목욕"}', NULL, NULL, '대당 80~250만원', '한국 2025', 4),
('pet', 'pet-grooming', 'material', '드라이어 부스/스탠드 드라이어', 'Dryer Booth/Stand Dryer', '고풍속 저소음 드라이어. 스탠드형 또는 부스형. 반려동물 스트레스 최소화.', 'High-airflow low-noise dryer. Stand or booth type. Minimizes pet stress.', 'Wind', '{"장비", "드라이어", "소음"}', NULL, NULL, '대당 30~100만원', '한국 2025', 5),
('pet', 'pet-grooming', 'material', '공기청정기 (펫 전용 필터)', 'Air Purifier (Pet Filter)', '털+냄새 제거 전용. 2중 HEPA+탈취 필터. 24시간 가동 권장.', 'Fur + odor removal. Dual HEPA + deodorizing filter. 24h operation recommended.', 'Wind', '{"공기", "필수", "냄새"}', NULL, NULL, '대당 30~80만원', '한국 2025', 6),
('pet', 'pet-grooming', 'material', '벽면 미끄럼 방지 타일', 'Wall Anti-slip Tile', '물이 튀는 목욕 구역 벽면. 타일로 방수+청소 용이. 밝은 톤 권장.', 'Bathing area wall where water splashes. Tile for waterproof + easy clean. Bright tone.', 'Shield', '{"벽면", "방수", "위생"}', NULL, NULL, '평당 8~15만원', '한국 2025', 7),
('pet', 'pet-grooming', 'material', '반려동물 대기 케이지/캔넬', 'Pet Waiting Cage/Kennel', '미용 대기 반려동물 보관. 환기+시야 확보. 스테인리스 또는 강화플라스틱.', 'Pet waiting area. Ventilation + visibility. Stainless or reinforced plastic.', 'Layers', '{"장비", "대기", "안전"}', NULL, NULL, '칸당 10~30만원', '한국 2025', 8),

('pet', 'pet-grooming', 'concept', '펫 프렌들리 클린 스튜디오', 'Pet-friendly Clean Studio', '밝은 화이트+민트+스테인리스. 병원 느낌 없이 깔끔하고 안전한 공간.', 'Bright white+mint+stainless. Clean and safe without clinical hospital feel.', 'Heart', '{"안전", "깔끔", "반려동물", "신뢰"}', '{"위생적 이미지", "보호자 신뢰", "관리 용이", "전견종 대응"}', '{"차가운 느낌", "색상 제한적", "소품으로 보완"}', '평당 130~180만원', '한국 2025', 1),
('pet', 'pet-grooming', 'concept', '우드 내추럴 펫 하우스', 'Natural Wood Pet House', '우드+그린+자연 소재. 반려동물과 보호자 모두 편안한 힐링 공간.', 'Wood+green+natural. Healing space comfortable for both pets and owners.', 'Leaf', '{"자연", "힐링", "편안", "보호자"}', '{"편안한 느낌", "SNS 공유", "보호자 대기 만족", "차별화"}', '{"유지 관리 어려움", "털 관리", "비용 높음"}', '평당 160~220만원', '글로벌 2025', 2),
('pet', 'pet-grooming', 'concept', '럭셔리 펫 살롱', 'Luxury Pet Salon', '대리석+골드+고급 조명. 프리미엄 반려동물 미용 서비스. 보호자 라운지 포함.', 'Marble+gold+premium lighting. Premium pet grooming. Includes owner lounge.', 'Star', '{"프리미엄", "럭셔리", "고급", "라운지"}', '{"최고 객단가", "충성 고객", "차별화 극대화", "VIP 서비스"}', '{"매우 높은 비용", "좁은 타겟", "유지비 높음"}', '평당 220~300만원', '한국 2025', 3);
