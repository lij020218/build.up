//
//  FranchiseBenchmarkRegistry.swift — 브랜드별 매출 벤치마크 SSOT (iOS)
//
//  ⚠️ 자동 생성 파일 — 직접 수정 금지.
//  생성기: scripts/gen-franchise-benchmark-swift.mts
//  웹 SSOT: packages/shared/src/knowledge/franchise-benchmarks.ts (FRANCHISE_BENCHMARKS)
//  변경은 웹 SSOT 수정 후 `npx tsx scripts/gen-franchise-benchmark-swift.mts` 재실행.
//
//  ⚠️ 정직성: topStoreMonthlyRevenue 는 평균×배수 모델 추정치(실측 아님).
//     isEstimate=true 는 공개 정보공개서 매출이 없어 업계 자료로 추정한 브랜드.
//  (costStructure·regionalVariance 는 iOS 미렌더라 생성 제외)
//

import Foundation

public struct FranchiseBenchmark: Sendable, Equatable {
    public let brandId: String
    public let avgMonthlyRevenue: Int       // 만원 — 정보공개서 가맹점 평균매출 기반
    public let topStoreMonthlyRevenue: Int  // 만원 — ⚠️ 평균×배수 모델 추정치 (실측 아님)
    public let topStoreMultiplier: Double
    public let operationalInsights: [String]
    public let yearReported: Int?
    public let isEstimate: Bool
}

/// 벤치마크 출처/시점 메타 — 웹 FRANCHISE_BENCHMARK_PROVENANCE 1:1.
public enum FranchiseBenchmarkProvenance {
    public static let source = "공정거래위원회 가맹사업거래 정보공개서 · 소상공인시장진흥공단 상가업소 실태조사"
    public static let disclosureYear = 2023
    public static let modeledNoteKo = "상위 매장 매출은 평균×배수로 산출한 추정치이며, 특정 매장의 실측이 아닙니다."
    public static let estimateNoteKo = "공개된 정보공개서 매출이 없어 업계 자료로 추정한 값입니다."
}

public enum FranchiseBenchmarkRegistry {

    /// 웹 FRANCHISE_BENCHMARKS 1:1 (33 브랜드).
    static let all: [FranchiseBenchmark] = [
        .init(
            brandId: "kyochon-chicken",
            avgMonthlyRevenue: 5783,
            topStoreMonthlyRevenue: 14000,
            topStoreMultiplier: 2.5,
            operationalInsights: [
                "프리미엄 포지셔닝으로 객단가 극대화 — 업계 최고 객단가",
                "매장 청결도·서비스 품질 관리 철저 (본사 미스터리 쇼퍼)",
                "배달과 홀 매출 비율 최적화 (6:4 배달 우세 지역에서 강세)",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "bhc",
            avgMonthlyRevenue: 4558,
            topStoreMonthlyRevenue: 11000,
            topStoreMultiplier: 2.5,
            operationalInsights: [
                "뿌링클 등 차별화 메뉴로 MZ세대 고객 확보",
                "배달앱 상위노출 전략 (리뷰 관리 + 프로모션 타이밍)",
                "시간대별 프로모션으로 비피크타임 매출 보완",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "bbq",
            avgMonthlyRevenue: 4142,
            topStoreMonthlyRevenue: 12000,
            topStoreMultiplier: 3,
            operationalInsights: [
                "배달 비중 극대화 (주거밀집 상권에서 배달 70%+)",
                "올리브 오일 프리미엄 이미지 활용한 가격 전략",
                "배달앱 3사(배민/쿠팡이츠/요기요) 동시 운영으로 노출 극대화",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "goobne",
            avgMonthlyRevenue: 4108,
            topStoreMonthlyRevenue: 10000,
            topStoreMultiplier: 2.5,
            operationalInsights: [
                "오븐구이 차별화로 건강 트렌드 고객 확보",
                "재료비 비율이 타 브랜드보다 낮아 마진율 우수",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "nene-chicken",
            avgMonthlyRevenue: 1826,
            topStoreMonthlyRevenue: 4382,
            topStoreMultiplier: 2.4,
            operationalInsights: [
                "중가 포지셔닝으로 가성비 시장 공략",
                "스노윙치킨 등 시즌 메뉴로 화제성 확보",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "hosik-chicken",
            avgMonthlyRevenue: 1946,
            topStoreMonthlyRevenue: 4670,
            topStoreMultiplier: 2.4,
            operationalInsights: [
                "두마리 전략으로 가격 대비 양 극대화",
                "저가 시장에서의 가격 리더십 유지",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "moms-touch",
            avgMonthlyRevenue: 5083,
            topStoreMonthlyRevenue: 20600,
            topStoreMultiplier: 4,
            operationalInsights: [
                "상권 리로케이션으로 매출 평균 265% 증가 (목동점 786%)",
                "시간대별 메뉴 전략: 점심 버거 → 저녁 치킨으로 매출 보완",
                "학원가·주거밀집 상권에서 배달 비중 극대화",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "lotteria",
            avgMonthlyRevenue: 4458,
            topStoreMonthlyRevenue: 10000,
            topStoreMultiplier: 2.2,
            operationalInsights: [
                "전국 최다 매장망 활용한 접근성 우위",
                "로컬 메뉴(불고기버거) 기반 충성 고객 확보",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "hansot-lunchbox",
            avgMonthlyRevenue: 3841,
            topStoreMonthlyRevenue: 9000,
            topStoreMultiplier: 2.3,
            operationalInsights: [
                "평당매출 한식 1위 — 소형 매장 고효율 운영",
                "5년 이상 운영 가맹점 80% — 안정적 수익 구조",
                "도시락 + 매장 식사 + 배달 3채널 매출 분산",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "bonjuk-bibimbap",
            avgMonthlyRevenue: 3258,
            topStoreMonthlyRevenue: 7500,
            topStoreMultiplier: 2.3,
            operationalInsights: [
                "본죽 대비 1.5배 매출 — 비빔밥 추가로 점심 매출 보완",
                "식재료 원가 관리 용이 (죽+비빔밥 재료 공유)",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "kimgane",
            avgMonthlyRevenue: 3175,
            topStoreMonthlyRevenue: 7000,
            topStoreMultiplier: 2.2,
            operationalInsights: [
                "김밥 프랜차이즈 매출 1위 — 메뉴 다양성 차별화",
                "오피스가·학원가에서 점심 집중 매출",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "bonjuk",
            avgMonthlyRevenue: 2367,
            topStoreMonthlyRevenue: 5500,
            topStoreMultiplier: 2.3,
            operationalInsights: [
                "죽 전문점 특성상 아침·환자식 시장 안정적",
                "재료비 비율 낮지만 객단가도 낮아 회전율이 핵심",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "twosome-place",
            avgMonthlyRevenue: 4350,
            topStoreMonthlyRevenue: 10000,
            topStoreMultiplier: 2.3,
            operationalInsights: [
                "프리미엄 디저트 매출 비중 40%+ → 객단가 극대화",
                "넓은 매장 면적 활용한 체류시간·추가 주문 유도",
                "케이크 사전주문 시스템으로 폐기율 최소화",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "hollys",
            avgMonthlyRevenue: 3000,
            topStoreMonthlyRevenue: 7000,
            topStoreMultiplier: 2.3,
            operationalInsights: [
                "프리미엄 인테리어로 체류형 고객 확보",
                "브런치·디저트 메뉴 비중 확대로 객단가 향상",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "baskin-robbins",
            avgMonthlyRevenue: 2500,
            topStoreMonthlyRevenue: 6000,
            topStoreMultiplier: 2.4,
            operationalInsights: [
                "시즌 한정 메뉴(아이스크림 케이크)로 이벤트 수요 흡수",
                "여름 성수기 대비 겨울 비수기 전략(핫초코 등)이 관건",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "paiks-dabang",
            avgMonthlyRevenue: 2417,
            topStoreMonthlyRevenue: 6000,
            topStoreMultiplier: 2.5,
            operationalInsights: [
                "저가 커피 중 가맹점 매출 1위 — 백종원 브랜드 파워",
                "원가율 30%로 저가 대비 마진 우수",
                "소형 매장 테이크아웃 중심 운영으로 임대료 비중 낮음",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "mega-coffee",
            avgMonthlyRevenue: 2908,
            topStoreMonthlyRevenue: 9747,
            topStoreMultiplier: 3.4,
            operationalInsights: [
                "매장 수 3,038개 전국 1위 — 브랜드 인지도 급성장",
                "대용량 음료로 가성비 이미지 + 객단가 유지",
                "본사 영업이익 업계 1위 — 안정적 지원 체계",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "compose-coffee",
            avgMonthlyRevenue: 2042,
            topStoreMonthlyRevenue: 5000,
            topStoreMultiplier: 2.4,
            operationalInsights: [
                "면적당 효율 저가 커피 1위 — 초소형 매장 극한 효율",
                "1인 운영 최적화 설계로 인건비 최소화",
                "로열티 0원, 원두 직매입 체계로 가맹점 부담 최소",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "ediya-coffee",
            avgMonthlyRevenue: 1558,
            topStoreMonthlyRevenue: 4000,
            topStoreMultiplier: 2.6,
            operationalInsights: [
                "1세대 카페 브랜드 — 충성 고객 기반 안정적",
                "면적당 매출이 낮아 소형화·테이크아웃 전환이 관건",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "paris-baguette",
            avgMonthlyRevenue: 6250,
            topStoreMonthlyRevenue: 15000,
            topStoreMultiplier: 2.4,
            operationalInsights: [
                "업종 평균(3.4억)의 2배+ — 베이커리 압도적 1위",
                "시간대별 상품 구성: 아침 식빵·샌드위치 → 오후 케이크·선물",
                "시즌 이벤트(발렌타인, 크리스마스) 매출 비중 15%+",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "tous-les-jours",
            avgMonthlyRevenue: 4308,
            topStoreMonthlyRevenue: 10000,
            topStoreMultiplier: 2.3,
            operationalInsights: [
                "해외 매출 30%+ 성장 — 글로벌 브랜드 가치",
                "빵+카페 복합 매장으로 체류시간 증가",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "dominos",
            avgMonthlyRevenue: 6242,
            topStoreMonthlyRevenue: 15000,
            topStoreMultiplier: 2.4,
            operationalInsights: [
                "피자 매출 효율 1위 — 배달 시스템 최적화",
                "자체 배달 앱 비중 높여 수수료 절감",
                "시간 보장 프로모션으로 배달 수요 집중",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "papa-johns",
            avgMonthlyRevenue: 4917,
            topStoreMonthlyRevenue: 11801,
            topStoreMultiplier: 2.4,
            operationalInsights: [
                "6년 연속 매출 확대 — 프리미엄 재료 전략 성공",
                "NFL 등 스포츠 마케팅 기반 브랜드 인지도",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "gs25",
            avgMonthlyRevenue: 5383,
            topStoreMonthlyRevenue: 12000,
            topStoreMultiplier: 2.2,
            operationalInsights: [
                "전국 평균매출 1위 — 마진율 45.7%",
                "PB 상품 비중 확대로 마진 극대화",
                "심야 매출 비중이 높은 매장은 무인화 도입 검토",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "cu",
            avgMonthlyRevenue: 5233,
            topStoreMonthlyRevenue: 12000,
            topStoreMultiplier: 2.3,
            operationalInsights: [
                "점포 수 전국 1위 — 서울 매출 GS25 역전",
                "택배·ATM 등 부가서비스 매출 비중 확대",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "juno-hair",
            avgMonthlyRevenue: 10417,
            topStoreMonthlyRevenue: 25000,
            topStoreMultiplier: 2.4,
            operationalInsights: [
                "프리미엄 미용 최상위 — 디자이너 개인 역량이 핵심",
                "VIP 멤버십 기반 단골 재방문율 관리",
                "스타일리스트 교육·리텐션이 매출 직결",
            ],
            yearReported: nil,
            isEstimate: true
        ),
        .init(
            brandId: "leekajahair",
            avgMonthlyRevenue: 7500,
            topStoreMonthlyRevenue: 18000,
            topStoreMultiplier: 2.4,
            operationalInsights: [
                "30년+ 브랜드 인지도 기반 안정적 고객 확보",
                "주니어→시니어 디자이너 육성 시스템 체계화",
            ],
            yearReported: nil,
            isEstimate: true
        ),
        .init(
            brandId: "blue-club",
            avgMonthlyRevenue: 3500,
            topStoreMonthlyRevenue: 7500,
            topStoreMultiplier: 2.1,
            operationalInsights: [
                "저가 남성 전문 — 빠른 회전율(15분 컷) 기반 수익 모델",
                "인건비 대비 매출 효율 극대화 (1인 운영 가능)",
            ],
            yearReported: nil,
            isEstimate: true
        ),
        .init(
            brandId: "anytime-fitness",
            avgMonthlyRevenue: 5000,
            topStoreMonthlyRevenue: 12000,
            topStoreMultiplier: 2.4,
            operationalInsights: [
                "24시간 무인 운영으로 인건비 최소화",
                "월 회원비 모델 — 안정적 반복 매출",
                "글로벌 브랜드 인지도 + 상호 이용 혜택",
            ],
            yearReported: nil,
            isEstimate: true
        ),
        .init(
            brandId: "curves",
            avgMonthlyRevenue: 4200,
            topStoreMonthlyRevenue: 9000,
            topStoreMultiplier: 2.1,
            operationalInsights: [
                "여성 전용 소규모 서킷 트레이닝 — 낮은 진입 장벽",
                "소형 매장(20평)으로 임대료 절감",
            ],
            yearReported: nil,
            isEstimate: true
        ),
        .init(
            brandId: "washnjoy",
            avgMonthlyRevenue: 2800,
            topStoreMonthlyRevenue: 6000,
            topStoreMultiplier: 2.1,
            operationalInsights: [
                "셀프빨래방 — 무인 운영으로 인건비 제로",
                "장비 투자 대비 안정적 회수 (3-4년 BEP)",
            ],
            yearReported: nil,
            isEstimate: true
        ),
        .init(
            brandId: "zaksim-study",
            avgMonthlyRevenue: 1125,
            topStoreMonthlyRevenue: 2700,
            topStoreMultiplier: 2.4,
            operationalInsights: [
                "무인 픽코(Pickko) 시스템 — 출입·예약·결제·회원 전과정 무인화로 인건비 최소",
                "성인 이용 80% — 자격증·입시·업무 장기 수요로 매출 안정성 확보",
            ],
            yearReported: nil,
            isEstimate: false
        ),
        .init(
            brandId: "friends-screen",
            avgMonthlyRevenue: 6000,
            topStoreMonthlyRevenue: 14000,
            topStoreMultiplier: 2.3,
            operationalInsights: [
                "스크린골프 + F&B 복합 매출 모델",
                "시뮬레이터 장비 고정비 대비 높은 시간당 매출",
            ],
            yearReported: nil,
            isEstimate: true
        ),
    ]

    private static let map: [String: FranchiseBenchmark] = {
        var m: [String: FranchiseBenchmark] = [:]
        for b in all { m[b.brandId] = b }
        return m
    }()

    /// 웹 getFranchiseBenchmark(brandId) 1:1.
    public static func benchmark(brandId: String) -> FranchiseBenchmark? {
        map[brandId]
    }
}
