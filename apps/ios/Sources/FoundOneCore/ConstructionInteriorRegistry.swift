//
//  ConstructionInteriorRegistry.swift — 업종별 인테리어 자재·컨셉 (웹 SSOT 자동 생성 미러)
//
//  ⚠️ 웹 SSOT: apps/web/.../offline/ConstructionSetupStage.tsx → categoryDataMap.
//             스크립트로 파싱·생성 (수동 편집 금지). 아이콘은 lucide→SF Symbol 매핑.
//

import Foundation

public enum ConstructionInteriorRegistry {
    public struct Material: Sendable, Hashable { public let icon: String; public let name: String; public let desc: String
        public init(icon: String, name: String, desc: String){self.icon=icon;self.name=name;self.desc=desc} }
    public struct Concept: Sendable, Hashable { public let icon: String; public let name: String; public let desc: String; public let tags: [String]
        public init(icon: String, name: String, desc: String, tags: [String]){self.icon=icon;self.name=name;self.desc=desc;self.tags=tags} }

    public static func materials(forCategoryId id: String) -> [Material] { materialsMap[id] ?? materialsMap["food"] ?? [] }
    public static func concepts(forCategoryId id: String) -> [Concept] { conceptsMap[id] ?? conceptsMap["food"] ?? [] }

    private static let materialsMap: [String: [Material]] = [
        "cafe-dessert": [
            .init(icon: "square.3.layers.3d", name: "시멘트 질감 마감재 (마이크로토핑)", desc: "노출 콘크리트 느낌 셀프 시공 가능 — 인더스트리얼·모던 감성 모두 사용"),
            .init(icon: "sidebar.left", name: "오픈형 원목 선반 + 철제 브래킷", desc: "원두·컵·소품 디스플레이. FSC 인증 목재 권장 (2025 친환경 트렌드)"),
            .init(icon: "diamond.fill", name: "세라믹/엔지니어드 스톤 상판", desc: "카운터 상판 — 석영 90%+ 프리미엄 마감재. 열·스크래치·오염 내성 최고"),
            .init(icon: "lightbulb.fill", name: "LED 레일 조명 (2700~3000K 전구색)", desc: "카운터·선반 강조. 색온도가 음식·음료 색감 결정 — 전구색 필수"),
            .init(icon: "speaker.slash.fill", name: "방음·단열 복합 패널", desc: "주거 혼합 상권 야간 영업 민원 방지. 내장 흡음재 + 마감 압축재 이중 구조"),
            .init(icon: "square.grid.3x3.fill", name: "미끄럼 방지 논슬립 타일/에폭시", desc: "카페 물기 특성상 필수. 논슬립 타일 또는 에폭시 코팅 — 정사각 600각 강마루도 트렌드"),
        ],
        "food": [
            .init(icon: "wind", name: "스테인리스 상업용 후드·배기 시스템", desc: "법적 의무 — 풍량 계산 선행 필요. 주방 폭 최소 1900mm 확보 후 설계"),
            .init(icon: "square.grid.3x3.fill", name: "내열 세라믹 타일 (주방 벽·바닥)", desc: "기름때·고열 내성. 줄눈 방오 처리 필수 — 청소 난이도 결정 요인"),
            .init(icon: "shield.fill", name: "방화 석고보드 (주방 인접 벽)", desc: "소방법 의무 자재 — 소방 심사 전 반드시 확인. 두께·등급 구분 있음"),
            .init(icon: "bolt.fill", name: "대용량 전기 배선·분전반", desc: "상업용 주방 장비 전용 분전반 선행 공사 필수. 인테리어 착수 전 전기 설계"),
            .init(icon: "drop.fill", name: "에폭시 바닥재 (주방·홀 경계)", desc: "방수·물매 시공 필수. 하수구 위치 먼저 결정 — 청소 동선이 여기서 결정됨"),
            .init(icon: "speaker.slash.fill", name: "방음·흡음재 (홀)", desc: "조리 소음·냉방기 소음 차단. 야간 영업 민원 방지 — 다중 레이어 구조 권장"),
        ],
        "beauty": [
            .init(icon: "viewfinder", name: "대형 경대 거울 + 간접조명", desc: "고객 만족도 직결 — 강화 안전유리 + 간접조명으로 입체감과 고급감 동시 연출"),
            .init(icon: "drop.fill", name: "샴푸대 전용 수전·배관", desc: "미용 시설 전용 설비. 위치 변경이 어려우므로 시공 전 배관 계획 확정 필수"),
            .init(icon: "square.grid.3x3.fill", name: "미끄럼 방지 타일 (샴푸 구역)", desc: "물기 잦은 공간 안전 필수. 600각 정사각 타일 + 방오 줄눈 처리"),
            .init(icon: "paintbrush.fill", name: "저VOC 페인트 + 인테리어 필름", desc: "화학약품 사용 공간 — 저VOC 필수. 필름 마감으로 벽면 패턴·질감 다양하게 표현 가능"),
            .init(icon: "speaker.slash.fill", name: "방음재 (드라이어·음악 소음)", desc: "드라이어 소음 등 고객 불편 최소화. 흡음 패널 또는 흡음 벽지 시공"),
            .init(icon: "leaf.fill", name: "대나무·코르크 등 친환경 자재", desc: "2025 뷰티샵 핵심 트렌드 — 천연 소재로 공기질 개선 + 브랜드 감성 차별화"),
        ],
        "fitness": [
            .init(icon: "square.3.layers.3d", name: "충격 흡수 고무 바닥재 (헬스장)", desc: "운동화 마모·소음·충격 흡수. 두께 10~20mm — 장비 무게별 등급 선택 필수"),
            .init(icon: "sidebar.left", name: "강화마루 + 바닥 단열필름 (스튜디오)", desc: "필라테스·요가 맨발 운동 — 강화마루가 내구성·고급감 최적. 단열로 겨울 냉기 차단"),
            .init(icon: "arrow.up.left.and.arrow.down.right", name: "전신 거울 (강화 안전유리)", desc: "동작 확인 필수 — 공간 여유 시 간접조명 추가로 입체감 연출. 좁은 공간은 벽 밀착 설치"),
            .init(icon: "speaker.slash.fill", name: "방음·흡음 다층 구조 자재", desc: "음악·운동 소음 차단. 내부는 고흡음율 자재, 마감은 얇고 단단한 압축재 조합이 정석"),
            .init(icon: "wind", name: "에어 서큘레이터 + 환기 시스템", desc: "다수 사용자 땀 환기 필수. 환기량 부족은 가장 많은 불만 요인 — 설계 단계 반영 필수"),
            .init(icon: "door.left.hand.open", name: "스테인리스 파티션·로커 (탈의실)", desc: "내구성 + 위생 최우선 소재. 탈의실은 고객 만족도 직결 공간 — 투자 아끼지 말 것"),
        ],
        "education": [
            .init(icon: "shield.fill", name: "방염 인증 마감재 (벽지·천장재)", desc: "다중이용시설 법규 의무 — 불특정 다수 이용 공간 모두 방염 필수. 미준수 시 영업 정지"),
            .init(icon: "door.left.hand.open", name: "방음 도어 (간살+유리 조합)", desc: "수업 중 외부 소음 차단. 간살에 유리 부착으로 방음+채광 동시 확보 — 2025 트렌드"),
            .init(icon: "lightbulb.fill", name: "기능성 조명 (4000K 주백색)", desc: "학습 집중력 최적 색온도. 어두운 조명·눈부심 모두 집중력 저하 원인 — 조도 계산 필수"),
            .init(icon: "paintbrush.fill", name: "단색 계열 저채도 페인트 + 포인트 벽면", desc: "집중력 향상 환경 — 벽 한 면에만 포인트 컬러 적용하는 것이 현재 학원 인테리어 정석"),
            .init(icon: "speaker.slash.fill", name: "방음재·흡음재 (강의실)", desc: "집중력에 방음이 가장 큰 영향. 다층 구조 흡음 패널 + 방음 도어 조합 권장"),
            .init(icon: "square.3.layers.3d", name: "내마모 LVT·강마루 바닥재", desc: "의자 끌기 소음·마모 내성. 학생 다수 이용 → 내구성 최우선, 청소 용이성 고려"),
        ],
        "pet": [
            .init(icon: "square.grid.3x3.fill", name: "항균·미끄럼 방지 세라믹 타일", desc: "동물 발 보호 + 위생 청소 용이. 배뇨 실수 스며들지 않는 무공극 타일 필수"),
            .init(icon: "square.3.layers.3d", name: "고탄성 쿠션 바닥재 (운동·대기 구역)", desc: "높은 곳 착지 충격 흡수 → 관절 보호. 2중 쿠션층 기준 두께 8mm 이상 권장"),
            .init(icon: "shield.fill", name: "방수·항균 벽 마감재", desc: "배변·물 튀김 대응. 타이벡·천연 펄프 계열 친환경 항균 마감재 — 2025 펫 인테리어 핵심"),
            .init(icon: "drop.fill", name: "스테인리스 그루밍 테이블·배수 시스템", desc: "목욕·그루밍 전용 배수 설계 — 위치 변경 어려움. 배수구 경사도(물매) 사전 계획 필수"),
            .init(icon: "viewfinder", name: "강화 유리 케이지·전시 구역", desc: "동물 분리·위생 관리. 강화 안전유리로 고객이 안쪽을 볼 수 있어 구매 전환율 상승"),
            .init(icon: "wind", name: "환기·탈취 시스템 (필수 설비)", desc: "동물 냄새 제거가 고객 재방문 결정 요인 1위. 설계 단계에서 환기 용량 반드시 계산"),
        ],
        "retail": [
            .init(icon: "square.grid.3x3.fill", name: "정사각 타일형 강마루 (600각)", desc: "2024-2025 리테일 바닥 메가 트렌드 — 타일 질감+내구성+청소 편의 삼박자"),
            .init(icon: "film.fill", name: "인테리어 필름 (벽면·집기 마감)", desc: "무몰딩 마감 트렌드 — 내오염성·내구성 뛰어남. 다양한 패턴·질감으로 브랜드 감성 구현"),
            .init(icon: "text.alignleft", name: "이동식 진열 시스템 (슬롯월·행거)", desc: "트렌드·시즌 변화에 따른 레이아웃 변경 필수. 고정 진열대 최소화가 현재 리테일 정석"),
            .init(icon: "lightbulb.fill", name: "스팟 LED + 레일 조명 시스템", desc: "상품 강조 조명 — 색연색지수(CRI) 90 이상 권장. 상품 색감 왜곡 최소화"),
            .init(icon: "viewfinder", name: "강화 유리 쇼케이스·진열장", desc: "고가 상품·뷰티·액세서리 진열 필수. 잠금 기능+LED 내장형이 현재 표준"),
            .init(icon: "shield.fill", name: "방염 벽지·마감재", desc: "다중이용시설 법규 — 연면적 관계없이 상업 매장은 방염 자재 적용 권장"),
        ],
        "living-service": [
            .init(icon: "drop.fill", name: "내수·방수 PVC·에폭시 바닥재", desc: "세탁기 진동·물기·세제 내성 필수. 물매 시공(경사도)으로 배수 원활하게"),
            .init(icon: "rectangle.split.3x1.fill", name: "스테인리스 카운터·작업대", desc: "세탁물·소품 처리 위생 관리. 내식성·내오염성 최강 소재 — 의류 오염 전이 방지"),
            .init(icon: "shield.fill", name: "방염 마감재 (벽·천장)", desc: "다중이용시설 법규 의무. 세탁 화학품 인화성 고려 — 방염 인증 필수"),
            .init(icon: "lightbulb.fill", name: "절전형 LED 조명 (5000K 주광색)", desc: "장시간 영업 전기료 절감 핵심. 작업 공간은 밝은 주광색 — 세탁물 색감 확인 용이"),
            .init(icon: "wind", name: "환기 시스템 (세탁 화학품 배기)", desc: "세탁 용제 환기 필수 — 실내 공기질이 고객 체류 시간 결정. 배기 용량 사전 계산"),
            .init(icon: "film.fill", name: "내구성 인테리어 필름 (집기 마감)", desc: "잦은 접촉·세탁 용제 내성. 내오염성 필름으로 집기 수명 연장 + 청결 이미지 유지"),
        ],
        "space": [
            .init(icon: "shield.fill", name: "방염 마감재 (벽지·천장재)", desc: "다중이용시설 필수 — 연면적 1000㎡ 이상은 불연·방염 의무. 사전 소방 확인 필수"),
            .init(icon: "door.left.hand.open", name: "방음 도어 (간살+유리문)", desc: "개별 룸 방음 핵심 자재. 유리 부착으로 방음+채광 확보 — 2025 스터디카페 표준"),
            .init(icon: "speaker.slash.fill", name: "흡음 패널 (룸 내부)", desc: "룸 내 에코·울림 차단. 내장 고흡음 + 마감 압축재 조합. 집중력 유지에 직결"),
            .init(icon: "sidebar.left", name: "우드 템바보드 벽장재", desc: "따뜻하고 감각적인 분위기 — 2024-2025 스터디카페 트렌드 벽장재 1위"),
            .init(icon: "lightbulb.fill", name: "개별 룸 독립 조명 (온오프 각각)", desc: "개인화 환경 — 룸별 밝기 조절 가능해야 고객 만족도 상승. 4000K 주백색 기본"),
            .init(icon: "powerplug.fill", name: "멀티탭·USB 충전 인프라", desc: "각 좌석 전원 공급 필수. 콘센트 위치가 좌석 만족도 결정 — 설계 단계 확정 필요"),
        ],
        "online-digital": [
            .init(icon: "display", name: "노트북 (업무용)", desc: "일반 사무: LG gram·삼성 갤럭시북 (90~160만). 디자인: MacBook Pro M4 (250~500만). 개발: ThinkPad T (120~200만)"),
            .init(icon: "arrow.up.left.and.arrow.down.right", name: "모니터 (듀얼 추천)", desc: "삼성 S27 FHD (20~40만), LG 울트라와이드 34\\\" (40~60만). 디자인: Dell UltraSharp 4K (60~80만)"),
            .init(icon: "rectangle.split.3x1.fill", name: "사무 데스크", desc: "데스커 15~50만 (소규모 최적), 이케아 5~30만 (초기 가성비), 퍼시스 30~150만 (법인)"),
            .init(icon: "diamond.fill", name: "인체공학 의자", desc: "시디즈 T50 (50~70만), 듀오백 D-ZERO (10~15만 가성비), 허먼밀러 에어론 (150~220만 프리미엄)"),
            .init(icon: "wifi", name: "네트워크 장비", desc: "ipTIME 기업용 공유기 (5~15만), 시놀로지 NAS (30~80만). 안정적 인터넷이 운영 핵심"),
            .init(icon: "shippingbox.fill", name: "포장·물류 장비", desc: "라벨프린터 BIXOLON (15~40만), 포장재 박스코리아·올패키징몰. 풀필먼트: 쿠팡 로켓그로스·품고"),
        ],
        "startup-tech": [
            .init(icon: "display", name: "개발용 노트북", desc: "MacBook Pro M4 Pro (280~350만, ARM 네이티브), ThinkPad T (120~200만, 리눅스 최적), Dell XPS (150~250만)"),
            .init(icon: "arrow.up.left.and.arrow.down.right", name: "외장 모니터 (듀얼/울트라와이드)", desc: "LG 울트라와이드 34\\\" (40~60만) 개발자 필수. 디자인: Dell UltraSharp 4K. BenQ PD2706U (60~80만)"),
            .init(icon: "rectangle.split.3x1.fill", name: "사무 가구 (데스크·의자)", desc: "퍼시스/코아스 (법인 대량), 데스커 (소규모), 시디즈 T80 (80~120만), 허먼밀러 에어론 (150~220만)"),
            .init(icon: "wifi", name: "서버·네트워크·클라우드", desc: "AWS/GCP/Vercel 클라우드. ipTIME 기업공유기. 시놀로지 NAS. 기가비트 인터넷 필수"),
            .init(icon: "lightbulb.fill", name: "회의실 장비", desc: "LG 시네빔 프로젝터 (50~150만), 삼성 Flip 전자칠판 (300~500만), 로지텍 Rally 화상회의 (100~200만)"),
            .init(icon: "cpu.fill", name: "SaaS 구독 스택", desc: "Notion·Slack·Figma·GitHub·Linear·Vercel. 월 인당 5~15만원. Adobe CC 디자인팀 월 6만~"),
        ],
    ]

    private static let conceptsMap: [String: [Concept]] = [
        "cafe-dessert": [
            .init(icon: "building.2.fill", name: "미니멀 인더스트리얼", desc: "노출 콘크리트·철제 구조·원목 믹스매치. 강철+알루미늄+원목 상판 조합이 핵심", tags: ["20-30대 남성", "SNS 바이럴", "넓은 공간"]),
            .init(icon: "leaf.fill", name: "내추럴 빈티지 우드", desc: "FSC 원목·라탄·린넨·식물. 2025 바이오필릭 트렌드 — 심리 안정 효과, 재방문율 높음", tags: ["여성 선호", "재방문율", "힐링·웰빙"]),
            .init(icon: "cup.and.saucer.fill", name: "파리지앵 비스트로", desc: "대리석 상판·황동 소품·파스텔 벽. 엔지니어드 스톤 대리석 패턴 활용. 포토존 강점", tags: ["디저트 특화", "SNS 포토존", "프리미엄"]),
            .init(icon: "safari.fill", name: "모던 스칸디나비안", desc: "화이트+우드+패브릭+모카 무스 계열(Pantone 2025). 밝은 채광 극대화, 넓어 보이는 공간감", tags: ["패밀리 친화", "밝은 채광", "전 연령 무난"]),
        ],
        "food": [
            .init(icon: "house.fill", name: "모던 한옥 퓨전", desc: "한지·나무·석재 믹스. 전통과 현대 조화 — 외국인 관광객 많은 상권에서 차별화 강점", tags: ["외국인 친화", "30-50대", "관광지 상권"]),
            .init(icon: "mug.fill", name: "캐주얼 포차·분식", desc: "자연 목재·빈티지 간판·원색 포인트. 친근하고 활기찬 분위기 — 저녁·회식 수요 최강", tags: ["저녁·야간 강점", "회식 수요", "가성비"]),
            .init(icon: "wineglass.fill", name: "클린 이자카야", desc: "다크 우드+간접조명+줄 전구. 2025 MZ세대 외식 트렌드 1순위 — SNS 바이럴 용이", tags: ["20-30대", "SNS 바이럴", "야간 강점"]),
            .init(icon: "leaf.fill", name: "팜투테이블 내추럴", desc: "식물·내추럴 소재·따뜻한 조명. 건강·유기농 이미지 — 객단가 올리기에 유리한 포지셔닝", tags: ["건강 이미지", "여성 선호", "객단가 상승"]),
        ],
        "beauty": [
            .init(icon: "sparkles", name: "클린 모던 화이트", desc: "흰 벽+원목 선반+포인트 컬러. 웨인스코팅 기둥 마감으로 고급감 — 청결·신뢰 이미지 1위", tags: ["청결 이미지", "연령 무관", "신뢰감"]),
            .init(icon: "leaf.fill", name: "내추럴 보타닉 살롱", desc: "식물+원목+간접조명. 2025 바이오필릭 트렌드 정점 — 프리미엄 힐링 살롱 포지셔닝", tags: ["프리미엄", "힐링", "여성 선호"]),
            .init(icon: "crown.fill", name: "럭셔리 블랙 & 골드", desc: "다크 톤+황동+대리석 포인트. 고급 헤어샵 포지셔닝 — 객단가 상승·재방문 고객 확보", tags: ["고단가", "프리미엄", "강남·홍대"]),
            .init(icon: "heart.fill", name: "모카 무스 & 핑크 파스텔", desc: "2025 Pantone 모카 무스 계열 + 파스텔. 따뜻한 베이지·핑크 — 네일·스킨 샵 최강 컨셉", tags: ["네일·피부 특화", "SNS 포토존", "20-30대 여성"]),
        ],
        "fitness": [
            .init(icon: "dumbbell.fill", name: "클린 모던 스포티", desc: "흰 벽+밝은 조명+원목 포인트. 청결·건강 이미지 극대화 — 신규 회원 첫인상 결정", tags: ["청결 이미지", "전 연령", "밝은 공간"]),
            .init(icon: "building.2.fill", name: "인더스트리얼 퍼포먼스", desc: "노출 콘크리트+철제+형광 포인트. 퍼포먼스·강도 이미지 강조 — 헬스장·크로스핏 최적", tags: ["남성 선호", "고강도 운동", "에너지"]),
            .init(icon: "water.waves", name: "힐링 내추럴 스튜디오", desc: "따뜻한 우드+식물+부드러운 간접조명. 심리 안정·웰니스 — 요가·필라테스·명상 전용 컨셉", tags: ["요가·필라테스", "여성 선호", "웰니스"]),
            .init(icon: "rosette", name: "하이엔드 프리미엄 PT", desc: "대리석 포인트+블랙+디자인 조명. 1:1 PT·소수 정예 — 고단가 포지셔닝, 신뢰감 극대화", tags: ["1:1 PT", "고단가", "강남·서래마을"]),
        ],
        "education": [
            .init(icon: "book.fill", name: "클린 아카데믹", desc: "화이트+그레이 계열+집중력 최적화 조명. 학부모 신뢰감·청결 이미지 1위 컨셉", tags: ["학부모 신뢰", "집중력 최적화", "입시 학원"]),
            .init(icon: "paintpalette.fill", name: "모던 창의 스튜디오", desc: "컬러 포인트 벽면+오픈 수납+밝은 조명. 예체능·코딩·창의 학원 — 활기찬 분위기", tags: ["예체능·코딩", "창의적 환경", "어린이"]),
            .init(icon: "rosette", name: "프리미엄 소수정예", desc: "원목+고급 조명+독립 공간 설계. 1:1 과외·소규모 클래스 — 고단가 포지셔닝 필수 컨셉", tags: ["소수 정예", "고단가", "강남·대치"]),
            .init(icon: "star.fill", name: "활기찬 키즈 클래스", desc: "밝은 안전 컬러+라운드 가구+내구성 자재. 어린이 대상 학원 — 안전·위생 최우선", tags: ["어린이 대상", "안전 자재", "학부모 만족"]),
        ],
        "pet": [
            .init(icon: "sparkles", name: "클린 화이트 + 파스텔", desc: "흰 벽+파스텔 포인트. 위생·청결 이미지 극대화 — 보호자 신뢰감 가장 높은 컨셉", tags: ["청결 신뢰", "보호자 만족", "전 연령"]),
            .init(icon: "leaf.fill", name: "내추럴 원목 펫샵", desc: "원목+베이지+따뜻한 조명. 동물 친화적 분위기 — 중·고가 포지셔닝, 반려동물 가족 감성", tags: ["중·고가", "감성 소비", "재방문율"]),
            .init(icon: "paintpalette.fill", name: "팝아트 컬러풀", desc: "밝은 원색+귀여운 그래픽. 접근성·바이럴 마케팅 강점 — 어린 자녀 동반 가족 어필", tags: ["접근성", "SNS 바이럴", "가족 고객"]),
            .init(icon: "scissors", name: "미니멀 프리미엄 그루밍", desc: "블랙+화이트+황동 포인트. 고급 그루밍 살롱 포지셔닝 — 펫 미용 전문관 차별화", tags: ["고단가", "프리미엄 그루밍", "강남·성수"]),
        ],
        "retail": [
            .init(icon: "building.2.fill", name: "에디토리얼 미니멀", desc: "화이트+그레이+중성 톤. 상품이 주인공 — 공간 비움으로 브랜드 밀도 극대화", tags: ["상품 강조", "브랜드 신뢰", "라이프스타일"]),
            .init(icon: "house.fill", name: "웜톤 내추럴", desc: "원목+베이지+모카 무스(Pantone 2025). 친근하고 따뜻한 분위기 — 전 연령 재방문율", tags: ["전 연령", "재방문율", "동네 매장"]),
            .init(icon: "megaphone.fill", name: "볼드 브랜딩 컬러", desc: "시그니처 컬러 포인트+강한 사이니지. 골목 가시성 확보 — SNS 바이럴+브랜드 각인", tags: ["브랜드 구축", "SNS", "독립 매장"]),
            .init(icon: "square.grid.2x2.fill", name: "체험형 쇼룸 (Shop-in-Shop)", desc: "매장 내 체험 존+전시 공간 구분. 2025 오프라인 리테일 1순위 트렌드 — 구매 전환율 상승", tags: ["체험 마케팅", "전환율 상승", "대형 매장"]),
        ],
        "living-service": [
            .init(icon: "cpu.fill", name: "클린 테크 화이트", desc: "흰 벽+스테인리스+그린·블루 포인트. 위생·기술력 이미지 — 고객 신뢰 가장 높은 컨셉", tags: ["위생 신뢰", "청결 이미지", "전 연령"]),
            .init(icon: "leaf.fill", name: "내추럴 라운드리", desc: "원목+화이트+식물. 친근하고 깔끔한 동네 세탁소 감성 — 커뮤니티 기반 재방문 유도", tags: ["동네 친화", "재방문", "패밀리"]),
            .init(icon: "shippingbox.fill", name: "모던 미니멀 그레이", desc: "회색 계열+깔끔한 동선+사이니지. 도심 편의형 프리미엄 세탁 — 직장인 고객 어필", tags: ["직장인", "도심 상권", "프리미엄"]),
            .init(icon: "building.2.fill", name: "로컬 브랜딩 강화", desc: "시그니처 컬러+강한 외부 사이니지. 골목 랜드마크화 — 구전·SNS 바이럴로 고객 확장", tags: ["랜드마크", "SNS 바이럴", "골목 상권"]),
        ],
        "space": [
            .init(icon: "book.fill", name: "모던 스터디 (네이비+화이트)", desc: "차분한 네이비·화이트 혼합+원목. 집중력 1순위 컬러 조합 — 스터디카페 최다 선택 컨셉", tags: ["집중력 최강", "수험생", "장시간 체류"]),
            .init(icon: "cup.and.saucer.fill", name: "카페 감성 스터디", desc: "원목+무드 조명+식물+템바보드. 분위기 좋은 스터디 공간 — SNS 바이럴로 신규 고객 유입", tags: ["SNS 바이럴", "감성 소비", "장시간 체류"]),
            .init(icon: "display", name: "프리미엄 세미나룸", desc: "대리석 포인트+블랙+화이트보드·스크린. 기업 교육·스터디그룹 — 시간당 단가 높음", tags: ["기업 고객", "고단가", "세미나"]),
            .init(icon: "leaf.fill", name: "힐링 내추럴", desc: "베이지+원목+식물+부드러운 조명. 스트레스 없는 공부 환경 — 장시간 체류율 가장 높음", tags: ["힐링", "장시간 체류", "20-30대"]),
        ],
        "online-digital": [
            .init(icon: "house.fill", name: "미니멀 홈오피스", desc: "데스커+이케아 조합. 최소 비용으로 쾌적한 작업 환경 — 1인 이커머스 최적", tags: ["1인 운영", "최저 비용", "홈오피스"]),
            .init(icon: "person.2.fill", name: "공유오피스 활용", desc: "패스트파이브·위워크·스파크플러스. 초기 보증금 부담 없이 시작 — 네트워크 효과 보너스", tags: ["보증금 절약", "네트워킹", "2~5인 팀"]),
            .init(icon: "camera.fill", name: "촬영 스튜디오 겸용", desc: "조명+배경지+삼각대 세팅. 상품 촬영이 매출 직결 — 자체 스튜디오로 외주비 절약", tags: ["상품 촬영", "SNS 콘텐츠", "브랜드 구축"]),
            .init(icon: "shippingbox.fill", name: "소형 창고+사무 겸용", desc: "재고 보관+포장+사무를 한 공간에. 임대료 절약 — 월 50~100만원대 소형 창고 활용", tags: ["재고 관리", "물류 효율", "성장기"]),
        ],
        "startup-tech": [
            .init(icon: "bolt.fill", name: "개러지 MVP 모드", desc: "최소 장비+공유오피스. 검증 전까지 고정비 최소화 — 시드 전 스타트업 정석", tags: ["시드 전", "최소 비용", "빠른 검증"]),
            .init(icon: "cpu.fill", name: "모던 테크 오피스", desc: "코아스 시스템가구+허먼밀러 의자+대형 모니터. IT기업 표준 환경 — 채용 경쟁력", tags: ["채용 경쟁력", "5~15인", "시리즈A+"]),
            .init(icon: "globe", name: "하이브리드 리모트", desc: "핵심 장비만 사무실 + 재택 장비 지원. Notion·Slack·Zoom 기반 — 고정비 대폭 절감", tags: ["리모트", "고정비 절감", "글로벌 팀"]),
            .init(icon: "paintpalette.fill", name: "크리에이티브 스튜디오", desc: "iMac 24\\\"+듀얼모니터+Adobe CC. 디자인·영상 중심 스타트업 — 컬러 정확도 필수", tags: ["디자인 중심", "영상 제작", "크리에이티브"]),
        ],
    ]
}
