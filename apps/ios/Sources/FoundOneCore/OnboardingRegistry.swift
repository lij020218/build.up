//
//  OnboardingRegistry.swift — 기존 사업자 온보딩 업종 분기·벤치마크 SSOT (iOS)
//
//  ⚠️ 자동 생성 파일 — 직접 수정 금지.
//     원본: packages/shared/src/onboarding-profile.ts · industry-revenue-benchmark.ts · starter-data.ts
//     재생성: cd apps/web && npx tsx ../../scripts/gen-onboarding-swift.mts
//
//  원칙 (2026-07-28 사장님 지시): "SaaS 에 프랜차이즈·쿠팡이츠 질문 금지 — 업종에 맞는 채널·용어".
//  벤치마크는 중소벤처기업부 소상공인실태조사 2023년 (잠정) 원문 수치 — 평균 3단 비교(위/겹침/아래)만 허용.
//

import Foundation

public struct BUOnboardingProfile: Sendable {
    public let placeNoun: String
    public let ownerTitle: String
    public let secondBandLabel: String
    public let revenueLabel: String
    public let teamLabel: String
    public let asksFranchise: Bool
    public let asksBusinessHours: Bool
    public let addressAsk: String     // "required" | "optional" | "skip"
    public let revenueSyncCta: String // "pos" | "ecommerce-csv" | "saas-metrics"
}

public struct BURevenueBand: Sendable, Identifiable {
    public var id: String { bandId }
    public let bandId: String
    public let minManwon: Int
    public let maxManwon: Int?
    public let labelKo: String
    init(id: String, minManwon: Int, maxManwon: Int?, labelKo: String) {
        self.bandId = id; self.minManwon = minManwon; self.maxManwon = maxManwon; self.labelKo = labelKo
    }
}

public struct BURevenueBenchmark: Sendable {
    public let kstatIndustry: String
    public let annualRevenueMillionKrw: Int
    public let monthlyRevenueManwon: Int
}

public struct BUBusinessModelOption: Sendable, Identifiable {
    public var id: String { optionId }
    public let optionId: String
    public let titleKo: String
    init(id: String, titleKo: String) { self.optionId = id; self.titleKo = titleKo }
}

public enum BUOnboardingRegistry {
    public static let benchmarkSourceKo = "중소벤처기업부 소상공인실태조사 2023년 (잠정)"

    static let profiles: [String: BUOnboardingProfile] = [
        "food": .init(placeNoun: "가게", ownerTitle: "사장님", secondBandLabel: "가족과", revenueLabel: "월매출", teamLabel: "함께 일하는 사람", asksFranchise: true, asksBusinessHours: true, addressAsk: "required", revenueSyncCta: "pos"),
        "cafe-dessert": .init(placeNoun: "가게", ownerTitle: "사장님", secondBandLabel: "가족과", revenueLabel: "월매출", teamLabel: "함께 일하는 사람", asksFranchise: true, asksBusinessHours: true, addressAsk: "required", revenueSyncCta: "pos"),
        "retail": .init(placeNoun: "매장", ownerTitle: "사장님", secondBandLabel: "가족과", revenueLabel: "월매출", teamLabel: "함께 일하는 사람", asksFranchise: true, asksBusinessHours: true, addressAsk: "required", revenueSyncCta: "pos"),
        "beauty": .init(placeNoun: "매장", ownerTitle: "사장님", secondBandLabel: "가족과", revenueLabel: "월매출", teamLabel: "함께 일하는 사람", asksFranchise: true, asksBusinessHours: true, addressAsk: "required", revenueSyncCta: "pos"),
        "fitness": .init(placeNoun: "센터", ownerTitle: "사장님", secondBandLabel: "가족과", revenueLabel: "월매출", teamLabel: "함께 일하는 사람", asksFranchise: true, asksBusinessHours: true, addressAsk: "required", revenueSyncCta: "pos"),
        "education": .init(placeNoun: "학원", ownerTitle: "사장님", secondBandLabel: "가족과", revenueLabel: "월매출", teamLabel: "함께 일하는 사람", asksFranchise: true, asksBusinessHours: true, addressAsk: "required", revenueSyncCta: "pos"),
        "pet": .init(placeNoun: "매장", ownerTitle: "사장님", secondBandLabel: "가족과", revenueLabel: "월매출", teamLabel: "함께 일하는 사람", asksFranchise: true, asksBusinessHours: true, addressAsk: "required", revenueSyncCta: "pos"),
        "living-service": .init(placeNoun: "매장", ownerTitle: "사장님", secondBandLabel: "가족과", revenueLabel: "월매출", teamLabel: "함께 일하는 사람", asksFranchise: true, asksBusinessHours: true, addressAsk: "required", revenueSyncCta: "pos"),
        "space": .init(placeNoun: "공간", ownerTitle: "사장님", secondBandLabel: "가족과", revenueLabel: "월매출", teamLabel: "함께 일하는 사람", asksFranchise: true, asksBusinessHours: true, addressAsk: "required", revenueSyncCta: "pos"),
        "online-digital": .init(placeNoun: "스토어", ownerTitle: "사장님", secondBandLabel: "가족과", revenueLabel: "월매출", teamLabel: "함께 일하는 사람", asksFranchise: false, asksBusinessHours: false, addressAsk: "optional", revenueSyncCta: "ecommerce-csv"),
        "startup-tech": .init(placeNoun: "회사", ownerTitle: "대표님", secondBandLabel: "공동창업자와", revenueLabel: "월 매출 (MRR 포함)", teamLabel: "팀 규모", asksFranchise: false, asksBusinessHours: false, addressAsk: "optional", revenueSyncCta: "saas-metrics"),
    ]

    private static let defaultProfile = BUOnboardingProfile(
        placeNoun: "가게", ownerTitle: "사장님", secondBandLabel: "가족과",
        revenueLabel: "월매출", teamLabel: "함께 일하는 사람",
        asksFranchise: true, asksBusinessHours: true, addressAsk: "required", revenueSyncCta: "pos"
    )

    public static func profile(for categoryId: String?) -> BUOnboardingProfile {
        guard let categoryId, let p = profiles[categoryId] else { return defaultProfile }
        return p
    }

    public static let revenueBands: [BURevenueBand] = [
        .init(id: "lt300", minManwon: 0, maxManwon: 300, labelKo: "300만원 미만"),
        .init(id: "300-800", minManwon: 300, maxManwon: 800, labelKo: "300~800만원"),
        .init(id: "800-1500", minManwon: 800, maxManwon: 1500, labelKo: "800~1,500만원"),
        .init(id: "1500-3000", minManwon: 1500, maxManwon: 3000, labelKo: "1,500~3,000만원"),
        .init(id: "3000-5000", minManwon: 3000, maxManwon: 5000, labelKo: "3,000~5,000만원"),
        .init(id: "gte5000", minManwon: 5000, maxManwon: nil, labelKo: "5,000만원 이상"),
    ]

    static let benchmarks: [String: BURevenueBenchmark?] = [
        "food": .init(kstatIndustry: "숙박·음식점업", annualRevenueMillionKrw: 151, monthlyRevenueManwon: 1258),
        "cafe-dessert": .init(kstatIndustry: "숙박·음식점업", annualRevenueMillionKrw: 151, monthlyRevenueManwon: 1258),
        "retail": .init(kstatIndustry: "도·소매업", annualRevenueMillionKrw: 260, monthlyRevenueManwon: 2167),
        "beauty": .init(kstatIndustry: "수리·기타서비스업", annualRevenueMillionKrw: 67, monthlyRevenueManwon: 558),
        "living-service": .init(kstatIndustry: "수리·기타서비스업", annualRevenueMillionKrw: 67, monthlyRevenueManwon: 558),
        "pet": .init(kstatIndustry: "수리·기타서비스업", annualRevenueMillionKrw: 67, monthlyRevenueManwon: 558),
        "fitness": .init(kstatIndustry: "예술·스포츠·여가업", annualRevenueMillionKrw: 92, monthlyRevenueManwon: 767),
        "education": .init(kstatIndustry: "교육서비스업", annualRevenueMillionKrw: 75, monthlyRevenueManwon: 625),
        "space": nil,
        "online-digital": nil,
        "startup-tech": nil,
    ]

    public static func benchmark(for categoryId: String?) -> BURevenueBenchmark? {
        guard let categoryId else { return nil }
        return benchmarks[categoryId] ?? nil
    }

    /// 구간 vs 업종 평균 — 3단 판정만 (평균값이라 분위 주장 금지). nil = 벤치마크 없음(카드 미표시)
    public static func comparePosition(categoryId: String?, bandId: String?) -> (position: String, benchmark: BURevenueBenchmark)? {
        guard let benchmark = benchmark(for: categoryId),
              let band = revenueBands.first(where: { $0.bandId == bandId }) else { return nil }
        let avg = benchmark.monthlyRevenueManwon
        if band.minManwon > avg { return ("above", benchmark) }
        if let max = band.maxManwon, max < avg { return ("below", benchmark) }
        return ("overlaps", benchmark)
    }

    static let businessModels: [String: [BUBusinessModelOption]] = [
        "food": [
            .init(id: "dine-in-restaurant", titleKo: "매장 식사형"),
            .init(id: "takeout-focused", titleKo: "테이크아웃 중심"),
            .init(id: "delivery-hybrid", titleKo: "하이브리드 (홀+배달)"),
        ],
        "cafe-dessert": [
            .init(id: "storefront-cafe", titleKo: "매장형 카페"),
            .init(id: "takeout-focused", titleKo: "테이크아웃 중심"),
            .init(id: "cafe-delivery-hybrid", titleKo: "하이브리드 (매장+배달)"),
            .init(id: "self-serve-light", titleKo: "무인/셀프 운영형"),
        ],
        "retail": [
            .init(id: "small-storefront-retail", titleKo: "오프라인 소형 매장형"),
            .init(id: "unmanned-retail-model", titleKo: "무인 소매형"),
            .init(id: "omni-retail", titleKo: "오프라인+온라인 병행형"),
        ],
        "beauty": [
            .init(id: "appointment-studio", titleKo: "예약 중심 스튜디오형"),
            .init(id: "premium-private-room", titleKo: "프라이빗 프리미엄형"),
            .init(id: "beauty-retail-hybrid", titleKo: "시술+제품 하이브리드형"),
        ],
        "fitness": [
            .init(id: "membership-studio", titleKo: "멤버십 스튜디오형"),
            .init(id: "coach-led-premium", titleKo: "코치 중심 프리미엄형"),
            .init(id: "low-touch-fitness", titleKo: "저접촉/무인 피트니스형"),
        ],
        "education": [
            .init(id: "academy-classroom", titleKo: "클래스룸/학원형"),
            .init(id: "small-group-tutoring", titleKo: "소규모 튜터링형"),
            .init(id: "hybrid-learning", titleKo: "오프라인+온라인 교육형"),
        ],
        "pet": [
            .init(id: "pet-service-studio", titleKo: "예약형 펫 서비스 스튜디오"),
            .init(id: "pet-care-center", titleKo: "펫 돌봄 센터형"),
            .init(id: "pet-retail-hybrid", titleKo: "서비스+용품 하이브리드형"),
        ],
        "living-service": [
            .init(id: "utility-storefront", titleKo: "생활 밀착 점포형"),
            .init(id: "self-service-model", titleKo: "셀프서비스형"),
            .init(id: "visit-service-model", titleKo: "방문/출동 서비스형"),
        ],
        "space": [
            .init(id: "reservation-space", titleKo: "예약형 공간 대여"),
            .init(id: "membership-space", titleKo: "멤버십 공간형"),
            .init(id: "hospitality-operations", titleKo: "숙박/호스피탈리티 운영형"),
        ],
        "online-digital": [
            .init(id: "marketplace-seller", titleKo: "마켓플레이스 판매형"),
            .init(id: "brand-storefront-online", titleKo: "브랜드 자사몰형"),
            .init(id: "content-membership-model", titleKo: "콘텐츠/멤버십형"),
        ],
        "startup-tech": [
            .init(id: "plg-saas", titleKo: "제품 주도형 SaaS"),
            .init(id: "sales-led-b2b", titleKo: "영업 주도형 B2B"),
            .init(id: "usage-based-api", titleKo: "사용량 기반 API / 인프라"),
            .init(id: "hybrid-software-service", titleKo: "소프트웨어 + 서비스 하이브리드"),
        ],
    ]

    public static func businessModelOptions(for categoryId: String?) -> [BUBusinessModelOption] {
        businessModels[categoryId ?? "food"] ?? businessModels["food"] ?? []
    }
}
