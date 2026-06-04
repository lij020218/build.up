//
//  IndustryBenchmarkRegistry.swift — 업종별 매출 벤치마크 SSOT (iOS)
//
//  웹 SSOT 1:1 포팅: packages/shared/src/knowledge/franchise-benchmarks.ts
//    (INDUSTRY_BENCHMARKS / getIndustryBenchmark / 백분위 추정)
//  데이터 출처: 공정거래위원회 가맹사업 정보공개서 · 소상공인실태조사 (2024-2025).
//
//  ⚠️ 수치는 웹 SSOT와 동일해야 함. 변경 시 양쪽 동시 수정 (웹·모바일 동기화 원칙).
//

import Foundation

public struct IndustryBenchmark: Sendable, Equatable {
    public let categoryId: String
    public let avgAnnualRevenue: Int      // 만원 (연간)
    public let top10PctRevenue: Int       // 만원 (연간)
    public let bottom10PctRevenue: Int    // 만원 (연간)
    public let keyDifferentiators: [String]
}

public enum IndustryBenchmarkRegistry {

    /// 웹 INDUSTRY_BENCHMARKS 1:1 (11 업종).
    static let all: [IndustryBenchmark] = [
        .init(categoryId: "food", avgAnnualRevenue: 23400, top10PctRevenue: 70000, bottom10PctRevenue: 10000, keyDifferentiators: [
            "메뉴 특화 (3-5개 시그니처)와 빠른 회전율",
            "식재료 원가 33% 이하 관리 (공급처 3곳+ 비교)",
            "배달앱 리뷰 관리 (평점 4.5 이상 유지)",
            "시간대별 매출 분석을 통한 인력 배치 최적화",
        ]),
        .init(categoryId: "cafe-dessert", avgAnnualRevenue: 18000, top10PctRevenue: 55000, bottom10PctRevenue: 8000, keyDifferentiators: [
            "테이크아웃 비중 60%+ 매장은 소형화로 임대료 절감",
            "디저트·브런치 추가로 객단가 1.5배 향상",
            "SNS 마케팅 (인스타 주 3회+)으로 신규 유입",
            "원두 직접 로스팅 또는 스페셜티로 차별화",
        ]),
        .init(categoryId: "retail", avgAnnualRevenue: 52000, top10PctRevenue: 130000, bottom10PctRevenue: 20000, keyDifferentiators: [
            "재고 회전율 월 6-8회 유지 (데드스톡 월 1회 정리)",
            "온·오프라인 동시 판매 (네이버 스마트스토어 병행)",
            "PB 상품 비중 확대로 마진 10%p 향상",
            "시즌 상품 선제 입고 (2개월 전 준비)",
        ]),
        .init(categoryId: "beauty", avgAnnualRevenue: 25000, top10PctRevenue: 75000, bottom10PctRevenue: 10000, keyDifferentiators: [
            "예약 충전율 80%+ 유지 (빈 시간대 프로모션)",
            "단골 재방문율 40% 이상 (멤버십·리마인드 메시지)",
            "시술 메뉴 가격 분석 — 고마진 시술 비중 확대",
            "인스타 비포/애프터 포트폴리오 운영",
        ]),
        .init(categoryId: "fitness", avgAnnualRevenue: 20000, top10PctRevenue: 60000, bottom10PctRevenue: 8000, keyDifferentiators: [
            "회원 리텐션율 60%+ (3개월 이상 유지)",
            "PT 매출 비중 50%+ — 트레이너 역량이 핵심",
            "비수기(여름 후, 연말) 프로모션으로 이탈 방지",
            "소규모 그룹 수업으로 효율 극대화",
        ]),
        .init(categoryId: "education", avgAnnualRevenue: 22000, top10PctRevenue: 65000, bottom10PctRevenue: 9000, keyDifferentiators: [
            "수강생 유지율 70%+ (학부모 만족도 관리)",
            "입시 실적·수상 실적 기반 브랜딩",
            "온·오프 하이브리드 수업으로 지역 제한 극복",
            "방학 특강·캠프로 비수기 매출 보완",
        ]),
        .init(categoryId: "pet", avgAnnualRevenue: 20000, top10PctRevenue: 60000, bottom10PctRevenue: 8000, keyDifferentiators: [
            "반려동물 1인 가구 증가에 따른 프리미엄 수요",
            "미용+용품+호텔 복합 서비스로 객단가 극대화",
            "SNS 귀여운 콘텐츠로 바이럴 마케팅",
        ]),
        .init(categoryId: "living-service", avgAnnualRevenue: 18000, top10PctRevenue: 50000, bottom10PctRevenue: 7000, keyDifferentiators: [
            "단골 기반 안정적 반복 매출 (세탁·수선 등)",
            "무인 매장(셀프빨래방)으로 인건비 제로 모델",
            "지역 커뮤니티 기반 입소문 마케팅",
        ]),
        .init(categoryId: "space", avgAnnualRevenue: 24000, top10PctRevenue: 70000, bottom10PctRevenue: 10000, keyDifferentiators: [
            "플랫폼(에어비앤비/야놀자) 노출 최적화",
            "인테리어·사진 품질이 예약 전환율 직결",
            "비수기 장기 할인 + 성수기 프리미엄 가격 전략",
        ]),
        .init(categoryId: "online-digital", avgAnnualRevenue: 30000, top10PctRevenue: 100000, bottom10PctRevenue: 8000, keyDifferentiators: [
            "광고비 대비 ROAS 300%+ 유지",
            "상품 사진·상세페이지 품질이 전환율 직결",
            "리뷰 100개+ 확보 후 매출 급증 패턴",
            "네이버/쿠팡/자사몰 3채널 동시 운영",
        ]),
        // 스타트업은 매출 기준이 아님 (avgAnnualRevenue 0 → 카드 비표시 가드).
        .init(categoryId: "startup-tech", avgAnnualRevenue: 0, top10PctRevenue: 0, bottom10PctRevenue: 0, keyDifferentiators: [
            "PMF 달성 후 MoM 성장률 15%+ 유지",
            "런웨이 12개월+ 확보 (시드 5-10억, 시리즈A 20-50억)",
            "핵심 지표(North Star Metric) 1개에 집중",
            "고객 인터뷰 주 5회+ — 제품 시장 적합성 검증",
        ]),
    ]

    private static let map: [String: IndustryBenchmark] = {
        var m: [String: IndustryBenchmark] = [:]
        for b in all { m[b.categoryId] = b }
        return m
    }()

    /// 웹 getIndustryBenchmark(categoryId) 1:1.
    public static func benchmark(categoryId: String) -> IndustryBenchmark? {
        map[categoryId]
    }

    /// iOS `IndustryCategory` → 웹 categoryId 매핑 후 조회. 매핑 없음/스타트업(매출 기준 0)은 nil.
    public static func benchmark(for category: IndustryCategory) -> IndustryBenchmark? {
        guard let cid = category.benchmarkCategoryId, let b = map[cid], b.avgAnnualRevenue > 0 else { return nil }
        return b
    }
}

// MARK: - 백분위 추정 (웹 SocialBenchmarkCard 3점 선형보간 1:1)

public struct IndustryBenchmarkPosition: Sendable, Equatable {
    public let percentile: Int          // 0~100 (반올림)
    public let projectedMonthly: Double // 원 (월 환산)
    public let avgMonthly: Double       // 원
    public let top10Monthly: Double     // 원
    public let bottom10Monthly: Double  // 원
}

public enum IndustryBenchmarkCalc {
    /// projectedMonthly(원) 를 업종 평균·상위10%·하위10%와 비교해 백분위 추정.
    /// 웹: bottom10(=10) → avg(=50) → top10(=90) 3점 선형보간, 초과 시 95.
    public static func position(benchmark b: IndustryBenchmark, projectedMonthly: Double) -> IndustryBenchmarkPosition {
        let avgMonthly = Double(b.avgAnnualRevenue) / 12 * 10000        // 만원/연 → 원/월
        let top10Monthly = Double(b.top10PctRevenue) / 12 * 10000
        let bottom10Monthly = Double(b.bottom10PctRevenue) / 12 * 10000

        let percentile: Double
        if projectedMonthly <= bottom10Monthly {
            percentile = 10
        } else if projectedMonthly <= avgMonthly {
            let ratio = (projectedMonthly - bottom10Monthly) / max(1, avgMonthly - bottom10Monthly)
            percentile = 10 + ratio * 40
        } else if projectedMonthly <= top10Monthly {
            let ratio = (projectedMonthly - avgMonthly) / max(1, top10Monthly - avgMonthly)
            percentile = 50 + ratio * 40
        } else {
            percentile = 95
        }

        return IndustryBenchmarkPosition(
            percentile: Int(percentile.rounded()),
            projectedMonthly: projectedMonthly,
            avgMonthly: avgMonthly,
            top10Monthly: top10Monthly,
            bottom10Monthly: bottom10Monthly
        )
    }
}

// MARK: - IndustryCategory → 웹 categoryId

public extension IndustryCategory {
    /// 벤치마크 조회용 웹-canonical categoryId. 분류 미정(general)은 nil.
    var benchmarkCategoryId: String? {
        switch self {
        case .restaurant:   return "food"
        case .cafe:         return "cafe-dessert"
        case .beauty:       return "beauty"
        case .retail:       return "retail"
        case .ecommerce:    return "online-digital"
        case .fitness:      return "fitness"
        case .education:    return "education"
        case .pet:          return "pet"
        case .livingService: return "living-service"
        case .space:        return "space"
        case .startupTech:  return "startup-tech"
        case .general:      return nil
        }
    }
}
