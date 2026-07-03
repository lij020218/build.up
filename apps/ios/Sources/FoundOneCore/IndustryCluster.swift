//
//  IndustryCluster.swift — 공용 industry/cluster 분기 헬퍼.
//
//  웹 SSOT: packages/shared/src/i18n.ts 의 categoryId 9개 (food, cafe-dessert, retail,
//          beauty, fitness, education, pet, living-service, space, online-digital, startup-tech)
//          + sub-industry (selectedIndustryId, 예: korean-casual, ai-application).
//
//  사용법:
//    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
//    private var cluster: IndustryCluster { IndustryCluster.from(industryId: industryId) }
//    if cluster.isFood { ... }
//    switch cluster.category { case .beauty: ... }
//
//  Stage view 마다 따로 enum 만들 필요 X — 9개 cluster + sub-industry id 한 곳에서 관리.
//

import Foundation

public struct IndustryCluster: Sendable, Hashable {

    /// 웹 SSOT (packages/shared/src/i18n.ts) categoryId 와 동일 kebab-case.
    /// ⚠️ Models.swift 의 `IndustryCategory` enum 과는 별개 — 이건 web-canonical id 매핑이고
    ///   Models.swift 의 것은 iOS DashboardStore 내부 카테고리 (restaurant·cafe·ecommerce 등).
    public enum CategoryId: String, Sendable, Hashable, CaseIterable {
        case food
        case cafeDessert         = "cafe-dessert"
        case retail
        case beauty
        case fitness
        case education
        case pet
        case livingService       = "living-service"
        case space
        case onlineDigital       = "online-digital"
        case startupTech         = "startup-tech"

        public var isOffline: Bool {
            switch self {
            case .food, .cafeDessert, .retail, .beauty, .fitness,
                 .education, .pet, .livingService, .space:
                return true
            default:
                return false
            }
        }
        public var isFoodLike: Bool { self == .food || self == .cafeDessert }
        public var isService: Bool {
            switch self {
            case .beauty, .fitness, .pet, .education, .livingService, .space: return true
            default: return false
            }
        }
    }

    /// e.g. "korean-casual"
    public let subIndustryId: String
    /// 정규화된 카테고리. 잘못된 id 인 경우 .food 폴백.
    public let category: CategoryId

    public init(subIndustryId: String, category: CategoryId) {
        self.subIndustryId = subIndustryId
        self.category = category
    }

    /// 진입점 — @AppStorage("roadmap.selectedIndustryId") 값을 그대로 넘기면 됨.
    public static func from(industryId: String) -> IndustryCluster {
        let cid = StarterIndustryData.option(by: industryId)?.categoryId ?? "food"
        let cat = CategoryId(rawValue: cid) ?? .food
        return IndustryCluster(subIndustryId: industryId, category: cat)
    }

    // MARK: - 자주 쓰는 분기 helper

    public var isFood: Bool          { category.isFoodLike }
    public var isService: Bool       { category.isService }
    public var isOnline: Bool        { category == .onlineDigital }
    public var isStartupTech: Bool   { category == .startupTech }
    public var isRetail: Bool        { category == .retail }

    /// 외식·카페·소매 — 점포 영업 신고 + 상권 분석 필요한 클러스터.
    public var isStorefront: Bool {
        category.isOffline && category != .livingService
    }

    /// 음식·카페·뷰티·피트니스·펫 — 영업장 위생/공중위생 의무 있는 클러스터.
    public var hasHygieneRequirement: Bool {
        category == .food || category == .cafeDessert ||
        category == .beauty || category == .fitness ||
        category == .pet
    }

    // MARK: - 인사·산재보험 — 카테고리별 산재율 (%)
    //
    // 웹 SSOT: apps/web/app/lib/components/stages/offline/InsuranceTaxSetupStage.tsx
    //          ACCIDENT_RATE_BY_CATEGORY (고용노동부 2026 사업종류별 산재보험료율 고시)
    // ⚠️ 2026-06-05: 웹 SSOT와 다수 업종이 어긋나 있어 전면 정합화(food·retail·beauty·fitness·space·living).
    //   도소매·음식·숙박 0.8 / 전문·보건·교육·여가 0.6 / 기타서비스·전자상거래 0.7.
    public var accidentInsuranceRatePct: Double {
        switch category {
        case .food, .cafeDessert:    return 0.8   // 도소매·음식·숙박업
        case .retail:                return 0.8   // 도소매·음식·숙박업
        case .pet:                   return 0.8   // 도소매·음식·숙박업
        case .space:                 return 0.8   // 도소매·음식·숙박업
        case .beauty, .fitness:      return 0.6   // 전문·보건·교육·여가 서비스업
        case .education:             return 0.6   // 전문·보건·교육·여가 서비스업
        case .livingService:         return 0.7   // 기타 서비스업
        case .onlineDigital:         return 0.7   // 전자상거래업
        case .startupTech:           return 0.7   // 일반 서비스업(기본)
        }
    }

    // MARK: - Prime Cost 벤치마크 (월 매출 대비 %, 한국외식산업연구원 + 소진공 2024)

    /// 업종 월 비용 벤치마크 — 웹 SSOT (FinancialReviewStage CATEGORY_FALLBACK_BENCHMARKS) 1:1 미러.
    ///   8개 비용 항목 + 영업이익률 + Prime Cost 상한. isBurnBasis=true 면 월 번레이트 대비(스타트업).
    public struct CostBenchmark: Sendable, Hashable {
        public let materialsPctRange: ClosedRange<Int>   // 원재료/매입 (=ingredients, 스타트업은 인프라·SaaS·API)
        public let laborPctRange: ClosedRange<Int>       // 인건비
        public let rentPctRange: ClosedRange<Int>        // 임대료 (스타트업은 사무실·코워킹)
        public let utilitiesPctRange: ClosedRange<Int>   // 공과금 (스타트업은 통신·기기·SaaS)
        public let sgaPctRange: ClosedRange<Int>         // 운영 수수료 (배달·POS·카드, 또는 결제·회계·법무)
        public let marketingPctRange: ClosedRange<Int>   // 마케팅
        public let otherPctRange: ClosedRange<Int>       // 기타 (IP·인증 등)
        public let marginPctRange: ClosedRange<Int>      // 영업이익률 (burn 기준이면 목표 gross margin)
        public let primeMaxPct: Int                      // 재료+인건비 합 상한 (Prime Cost 게이지용)
        public let isBurnBasis: Bool                     // true=월 번레이트 대비 (스타트업, 매출 전)
        public let notes: String                         // 세부업종 핵심 인사이트 (1줄, 카테고리는 빈 문자열)

        public init(materialsPctRange: ClosedRange<Int>, laborPctRange: ClosedRange<Int>, rentPctRange: ClosedRange<Int>,
                    utilitiesPctRange: ClosedRange<Int>, sgaPctRange: ClosedRange<Int>, marketingPctRange: ClosedRange<Int>,
                    otherPctRange: ClosedRange<Int>, marginPctRange: ClosedRange<Int>, primeMaxPct: Int, isBurnBasis: Bool = false, notes: String = "") {
            self.materialsPctRange = materialsPctRange
            self.laborPctRange = laborPctRange
            self.rentPctRange = rentPctRange
            self.utilitiesPctRange = utilitiesPctRange
            self.sgaPctRange = sgaPctRange
            self.marketingPctRange = marketingPctRange
            self.otherPctRange = otherPctRange
            self.marginPctRange = marginPctRange
            self.primeMaxPct = primeMaxPct
            self.isBurnBasis = isBurnBasis
            self.notes = notes
        }
    }

    public var costBenchmark: CostBenchmark {
        switch category {
        case .food:           return .init(materialsPctRange: 38...45, laborPctRange: 22...28, rentPctRange: 8...12,  utilitiesPctRange: 4...6, sgaPctRange: 4...8,  marketingPctRange: 2...5,  otherPctRange: 3...5,  marginPctRange: 10...18, primeMaxPct: 65)
        case .cafeDessert:    return .init(materialsPctRange: 30...38, laborPctRange: 22...28, rentPctRange: 10...15, utilitiesPctRange: 4...6, sgaPctRange: 3...5,  marketingPctRange: 3...5,  otherPctRange: 3...5,  marginPctRange: 12...22, primeMaxPct: 60)
        case .beauty:         return .init(materialsPctRange: 8...12,  laborPctRange: 45...55, rentPctRange: 12...18, utilitiesPctRange: 3...5, sgaPctRange: 2...4,  marketingPctRange: 4...7,  otherPctRange: 4...6,  marginPctRange: 12...22, primeMaxPct: 70)
        case .fitness:        return .init(materialsPctRange: 3...6,   laborPctRange: 40...55, rentPctRange: 18...25, utilitiesPctRange: 4...7, sgaPctRange: 3...5,  marketingPctRange: 4...7,  otherPctRange: 4...6,  marginPctRange: 10...22, primeMaxPct: 55)
        case .education:      return .init(materialsPctRange: 5...10,  laborPctRange: 40...55, rentPctRange: 15...22, utilitiesPctRange: 3...5, sgaPctRange: 2...4,  marketingPctRange: 5...8,  otherPctRange: 4...6,  marginPctRange: 12...22, primeMaxPct: 65)
        case .pet:            return .init(materialsPctRange: 20...35, laborPctRange: 30...45, rentPctRange: 12...20, utilitiesPctRange: 3...6, sgaPctRange: 3...5,  marketingPctRange: 4...7,  otherPctRange: 4...8,  marginPctRange: 10...20, primeMaxPct: 65)
        case .livingService:  return .init(materialsPctRange: 15...30, laborPctRange: 25...45, rentPctRange: 10...20, utilitiesPctRange: 5...12, sgaPctRange: 3...5, marketingPctRange: 4...7,  otherPctRange: 5...10, marginPctRange: 10...20, primeMaxPct: 55)
        case .space:          return .init(materialsPctRange: 3...6,   laborPctRange: 10...18, rentPctRange: 28...40, utilitiesPctRange: 5...10, sgaPctRange: 4...7, marketingPctRange: 5...8,  otherPctRange: 10...15, marginPctRange: 15...25, primeMaxPct: 45)
        case .retail:         return .init(materialsPctRange: 45...60, laborPctRange: 15...22, rentPctRange: 10...18, utilitiesPctRange: 2...4, sgaPctRange: 3...5,  marketingPctRange: 4...7,  otherPctRange: 3...5,  marginPctRange: 8...15,  primeMaxPct: 78)
        case .onlineDigital:  return .init(materialsPctRange: 25...50, laborPctRange: 15...35, rentPctRange: 0...8,   utilitiesPctRange: 3...8, sgaPctRange: 8...15, marketingPctRange: 12...25, otherPctRange: 3...8, marginPctRange: 20...50, primeMaxPct: 65)
        case .startupTech:    return .init(materialsPctRange: 15...30, laborPctRange: 40...55, rentPctRange: 5...12,  utilitiesPctRange: 2...7, sgaPctRange: 8...15, marketingPctRange: 3...12, otherPctRange: 3...10, marginPctRange: 60...80, primeMaxPct: 75, isBurnBasis: true)
        }
    }

    /// 카테고리 명사 (한국어) — UI 카피용.
    public var categoryNounKo: String {
        switch category {
        case .food:           return "음식점"
        case .cafeDessert:    return "카페"
        case .retail:         return "소매"
        case .beauty:         return "뷰티"
        case .fitness:        return "피트니스"
        case .education:      return "교육"
        case .pet:            return "반려동물"
        case .livingService:  return "생활서비스"
        case .space:          return "공간"
        case .onlineDigital:  return "온라인 커머스"
        case .startupTech:    return "스타트업"
        }
    }

    // MARK: - 인허가 (permit-check / registration-setup 용)

    public struct PermitRequirement: Sendable, Hashable {
        public let label: String
        public let agency: String           // 발급 기관
        public let detail: String           // 핵심 설명
        public let estimatedDays: Int       // 평균 처리일
        public init(label: String, agency: String, detail: String, estimatedDays: Int) {
            self.label = label; self.agency = agency; self.detail = detail
            self.estimatedDays = estimatedDays
        }
    }

    /// 업종별 필수 인허가 리스트. 웹 SSOT: PermitCheckPanels.tsx getPermitsForCategory.
    public var requiredPermits: [PermitRequirement] {
        switch category {
        case .food: return [
            .init(label: "사업자등록",    agency: "관할 세무서·홈택스", detail: "영업 시작 20일 이내 의무. 일반·간이 과세 선택 동시", estimatedDays: 3),
            .init(label: "영업신고 (일반음식점)", agency: "관할 구청 위생과", detail: "건축물대장 용도(근린생활시설) + 정화조 + 식품위생교육 필요", estimatedDays: 5),
            .init(label: "식품위생교육",  agency: "한국외식업중앙회 (6시간)", detail: "온라인 6시간 + 수료증. 영업신고 첨부 의무", estimatedDays: 1),
            .init(label: "보건증",       agency: "관할 보건소", detail: "조리원 전원 의무 + 1년 갱신. 가까운 보건소 5천원", estimatedDays: 5),
            .init(label: "소방완비증명서", agency: "관할 소방서", detail: "100㎡(30평) 이상 또는 지하·2층 이상 필수", estimatedDays: 14),
        ]
        case .cafeDessert: return [
            .init(label: "사업자등록",    agency: "관할 세무서·홈택스", detail: "일반·간이 과세 선택 + 부가세 신고 일정 인지", estimatedDays: 3),
            .init(label: "영업신고 (휴게음식점)", agency: "관할 구청 위생과", detail: "카페는 휴게음식점. 식품위생교육 필요", estimatedDays: 5),
            .init(label: "식품위생교육",  agency: "한국외식업중앙회 (6시간)", detail: "온라인 6시간 + 수료증", estimatedDays: 1),
            .init(label: "보건증",       agency: "관할 보건소", detail: "바리스타·디저트 제조 인력 전원 의무", estimatedDays: 5),
            .init(label: "소방완비증명서", agency: "관할 소방서", detail: "100㎡(30평) 이상 + 가스 사용 시 의무", estimatedDays: 14),
        ]
        case .beauty: return [
            .init(label: "사업자등록",     agency: "관할 세무서·홈택스", detail: "미용업은 간이과세 가능(배제 아님) — 예상 매출 1억 400만↓면 간이로 시작", estimatedDays: 3),
            .init(label: "공중위생영업 신고", agency: "관할 구청 위생과", detail: "미용·이용·피부·네일·세탁 모두 공중위생업. 위생교육 필요", estimatedDays: 5),
            .init(label: "위생교육 (3시간)", agency: "대한미용사회·전국미용사회", detail: "온라인 3시간 + 수료증. 영업신고하는 대표자만 이수(직원은 면허증만 확인)", estimatedDays: 1),
            .init(label: "면허증 확인",    agency: "한국산업인력공단", detail: "미용사·이용사·네일·피부 국가자격증 필요. 무자격 종사자 단속", estimatedDays: 0),
        ]
        case .fitness: return [
            .init(label: "사업자등록",   agency: "관할 세무서·홈택스", detail: "일반·간이 과세 선택", estimatedDays: 3),
            .init(label: "체육시설업 신고", agency: "관할 구청 체육과", detail: "체력단련장·필라테스·요가 모두 자유업 신고. 안전 점검 보고서 필요", estimatedDays: 7),
            .init(label: "안전요원·강사 자격", agency: "대한체육회·생활체육회", detail: "지도자 자격증 (1·2급) + 응급처치 교육 권장", estimatedDays: 14),
            .init(label: "체육시설 책임보험", agency: "민간 보험사", detail: "회원 사고 대비 — 가입 의무는 아니지만 분쟁 시 필수", estimatedDays: 3),
        ]
        case .education: return [
            .init(label: "사업자등록",     agency: "관할 세무서·홈택스", detail: "학원·교습소·개인과외 구분에 따라 신고 다름", estimatedDays: 3),
            .init(label: "학원·교습소 등록", agency: "관할 교육지원청", detail: "학원=다인 / 교습소=개인 + 9명 한도. 강사 자격 별도", estimatedDays: 14),
            .init(label: "강사 자격 확인",  agency: "교육부·시도교육청", detail: "정교사·생활지도사 자격 + 보육교사 (유아 대상)", estimatedDays: 0),
            .init(label: "안전·소방 점검",  agency: "관할 소방서·교육지원청", detail: "비상구·소화기·CCTV 표준 점검", estimatedDays: 7),
        ]
        case .pet: return [
            .init(label: "사업자등록",       agency: "관할 세무서·홈택스", detail: "일반·간이 과세 선택", estimatedDays: 3),
            .init(label: "동물미용업 등록",   agency: "관할 시도청 동물보호과", detail: "동물보호법 — 동물미용·위탁관리(호텔)·판매·전시 모두 등록 의무", estimatedDays: 14),
            .init(label: "동물보건사·미용사 자격", agency: "농식품부·민간자격", detail: "동물보건사 (국가자격) 또는 민간 미용사 자격 — 무자격 단속", estimatedDays: 0),
            .init(label: "동물 폐기물 처리 계약", agency: "관할 환경공단 위탁사", detail: "동물 사체·털·미용 폐기물 — 별도 처리 계약 의무", estimatedDays: 7),
        ]
        case .livingService: return [
            .init(label: "사업자등록",       agency: "관할 세무서·홈택스", detail: "일반과세 권장 (출장 서비스 매출 변동성)", estimatedDays: 3),
            .init(label: "공중위생영업 신고 (세탁업)", agency: "관할 구청 위생과", detail: "세탁업·코인세탁 모두 공중위생업. 폐수 처리 시설 확인", estimatedDays: 7),
            .init(label: "위생교육",         agency: "공중위생협회 (3시간)", detail: "사업주 + 직원 의무", estimatedDays: 1),
            .init(label: "출장서비스 등록 (선택)", agency: "관할 구청", detail: "청소·수리 출장 — 자유업 영업, 사업자등록 외 별도 필요 X", estimatedDays: 0),
        ]
        case .space: return [
            .init(label: "사업자등록",      agency: "관할 세무서·홈택스", detail: "공간 임대업 = 일반·간이 선택. 부동산임대업 (해당시 별도)", estimatedDays: 3),
            .init(label: "공간임대업 신고 (선택)", agency: "관할 구청", detail: "스튜디오·파티룸·쉐어오피스 — 일반 임대업 (별도 신고 X)", estimatedDays: 0),
            .init(label: "소방안전 점검",   agency: "관할 소방서", detail: "다중이용시설 — 비상구·소화기·자동화재경보기", estimatedDays: 7),
            .init(label: "방음·위생 점검 (스튜디오)", agency: "관할 구청 환경과", detail: "공유 스튜디오 — 소음·진동·환기 기준 (이웃 민원 대비)", estimatedDays: 7),
        ]
        case .retail: return [
            .init(label: "사업자등록",     agency: "관할 세무서·홈택스", detail: "일반·간이 과세 선택. 매입세 공제 비교", estimatedDays: 3),
            .init(label: "통신판매업 신고 (옴니채널)", agency: "공정거래위원회 (전자공정거래시스템)", detail: "온라인 동시 판매 시 의무. 자체몰·스마트스토어·쿠팡 모두", estimatedDays: 5),
            .init(label: "상품 안전·KC 인증 (해당시)", agency: "한국제품안전협회·KATS", detail: "전자제품·아동용품·화장품 KC 인증 의무. 미인증 판매 즉시 게시중지", estimatedDays: 30),
            .init(label: "소방·안전 점검",  agency: "관할 소방서", detail: "100㎡ 이상 매장 + 지하·2층 의무", estimatedDays: 14),
        ]
        case .onlineDigital: return [
            .init(label: "사업자등록",      agency: "관할 세무서·홈택스", detail: "일반·간이 과세 선택. 통신판매업 신고 전 필수", estimatedDays: 3),
            .init(label: "통신판매업 신고",  agency: "공정거래위원회 (전자공정거래시스템)", detail: "온라인 판매 의무. 사업용 통장 + 구매안전서비스(에스크로) 필요", estimatedDays: 5),
            .init(label: "구매안전서비스 (에스크로) 가입", agency: "PG사 (이니시스·KG이니시스 등)", detail: "통신판매업 신고 전 필수. PG 가입 시 자동 포함", estimatedDays: 7),
            .init(label: "상품 안전·KC 인증 (해당시)", agency: "한국제품안전협회", detail: "전자제품·아동·화장품 — 미인증 판매는 과태료 + 게시중지", estimatedDays: 30),
            .init(label: "개인정보처리방침 게시", agency: "개인정보보호위원회", detail: "회원·결제 정보 수집 시 의무. 위반 시 과태료", estimatedDays: 1),
        ]
        case .startupTech: return [
            .init(label: "법인설립등기·사업자등록", agency: "법원·세무서", detail: "개인사업자 → 법인 전환 또는 신규 법인 설립. 법무사 5-10만원", estimatedDays: 7),
            .init(label: "이용약관·개인정보처리방침 게시", agency: "개인정보보호위원회", detail: "유저 가입 전 필수. PIPA 2025 (이동권·동의 분리·국내대리인) 준수", estimatedDays: 3),
            .init(label: "통신판매업 신고 (B2C·결제)", agency: "공정거래위원회", detail: "결제 받는 SaaS·앱 모두 의무. PG 가입 동시", estimatedDays: 5),
            .init(label: "상표·특허 출원",     agency: "특허청 (KIPRIS / 특허로)", detail: "공개(데모·베타) 전 출원 필수. 상표 5-30만, 특허 50-150만", estimatedDays: 30),
            .init(label: "벤처기업 인증 (선택)", agency: "벤처기업확인기관 (venture.or.kr)", detail: "세제 50% 감면 + TIPS·창업패키지 자격", estimatedDays: 30),
        ]
        }
    }

    // MARK: - 상권 (location-candidates 용)

    /// 업종별 상권 검색 키워드 & 분석 포인트. 웹 SSOT: LocationCandidatesStage.
    public var locationKeywords: [String] {
        switch category {
        case .food:           return ["역세권 1층", "오피스 점심", "주거 배달", "대학가 객단가"]
        case .cafeDessert:    return ["역세권 1층", "오피스 출근", "주거 산책", "데이트 명소"]
        case .beauty:         return ["역세권 2-3층", "주거 단지", "젊은층 인구", "전문직 밀집"]
        case .fitness:        return ["역세권 지하·2-3층", "주거·오피스 혼합", "주차 가능", "이용 동선"]
        case .education:      return ["주거 학군", "학교 인근", "주차 안전", "출입 동선"]
        case .pet:            return ["주거 펫 밀집", "공원 인접", "주차 가능", "동물병원 인접"]
        case .livingService:  return ["주거 밀집", "1인 가구", "주차 편의", "출장 거점"]
        case .space:          return ["역세권 + 이미지", "젊은층 인구", "SNS 노출", "주차 가능"]
        case .retail:         return ["유동 인구", "백화점·쇼핑몰 인접", "MD 시너지", "주차"]
        case .onlineDigital:  return ["창고·물류 동선", "택배 일일 수거", "임차 저렴", "오프매장 X"]
        case .startupTech:    return ["코워킹 스페이스", "스타트업 클러스터", "교통 접근성", "재택 가능"]
        }
    }

    public var locationAnalysisFocus: String {
        switch category {
        case .food, .cafeDessert: return "유동인구 + 경쟁 점포 + 객단가 — 평일 점심·저녁 시간대 직접 방문 권장"
        case .beauty:             return "타깃 연령대 인구 + 경쟁 살롱·네일샵 + 단가대 — 2-3층 임대료 절감"
        case .fitness:            return "주거 인구 + 주차 + 경쟁 헬스장 — 회원권 가입 동선 (집·회사 5분 룰)"
        case .education:          return "학군·학년대 인구 + 학원 밀집도 + 안전 동선 — 부모 픽업·하원 동선"
        case .pet:                return "반려동물 등록 가구 + 공원 산책로 + 동물병원 인접도"
        case .livingService:      return "1인 가구 비중 + 주거 밀집 + 주차·이동 동선 (출장 가능 반경)"
        case .space:              return "젊은층 인구 + SNS·인스타 인지 + 24시간 출입 가능"
        case .retail:             return "유동인구 + 인근 매장 MD 시너지 + 백화점·쇼핑몰 인근"
        case .onlineDigital:      return "창고·물류 동선 + 임차료 저렴 (오프매장 X) + 일일 택배 수거"
        case .startupTech:        return "팀 거주지 중심·교통 + 코워킹·스타트업 클러스터 (강남·판교·성수)"
        }
    }

    // MARK: - 인테리어 (construction-setup 용)

    /// 업종별 인테리어 컨셉 키워드 (4개씩). 웹 SSOT: ConstructionSetupStage categoryDataMap.
    public var interiorConcepts: [String] {
        switch category {
        case .food:           return ["모던 한식", "캐주얼 포차", "클린 이자카야", "팜투테이블"]
        case .cafeDessert:    return ["스페셜티 미니멀", "내추럴 우드", "감성 산업", "디저트 컬러풀"]
        case .beauty:         return ["럭셔리 우드", "내추럴 미니멀", "걸리시 핑크", "프리미엄 화이트"]
        case .fitness:        return ["인더스트리얼", "다크 모티베이션", "내추럴 우드 (필라테스)", "네온 액티브"]
        case .education:      return ["밝은 학습공간", "워크숍 스튜디오", "어린이 컬러풀", "프리미엄 입시"]
        case .pet:            return ["반려동물 친화 자연", "병원형 깔끔", "프리미엄 호텔식", "놀이 컬러풀"]
        case .livingService:  return ["기능 위주 클린", "투명·신뢰감", "산업 효율", "프리미엄 컨시어지"]
        case .space:          return ["미니멀 화이트", "감성 빈티지", "스튜디오 프로", "오피스 모던"]
        case .retail:         return ["럭셔리 갤러리", "감성 빈티지", "트렌디 컬러풀", "효율 매대"]
        case .onlineDigital:  return ["창고·작업장 (오프 비공개)", "사진 스튜디오", "임시 팝업", "쇼룸·체험"]
        case .startupTech:    return ["오피스·코워킹", "라보·작업장", "원격 No-Office", "쇼룸·이벤트"]
        }
    }

    /// 인테리어 핵심 자재 — 6개 카드 (간단 라벨).
    public var interiorMaterials: [String] {
        switch category {
        case .food, .cafeDessert: return ["주방 스테인리스", "타일·바닥재", "조명", "테이블·의자", "간판·사인", "환기 후드"]
        case .beauty:             return ["거울·조명", "샴푸대·세면대", "시술 의자·베드", "수납장", "바닥재", "음향·향"]
        case .fitness:            return ["고무 매트·바닥", "거울 (전면)", "락커룸·샤워", "조명·음향", "환기", "장비 마운트"]
        case .education:          return ["책상·의자", "칠판·프로젝터", "방음·환기", "조명", "사인·게시판", "보안 출입"]
        case .pet:                return ["방수 바닥", "케이지·울타리", "조명·환기", "샴푸 욕조", "CCTV", "방음"]
        case .livingService:      return ["방수 바닥", "배수 시설", "장비 설치", "환기·조명", "고객 대기", "사인"]
        case .space:              return ["스마트락", "방음·환기", "조명·음향", "가구·소품", "Wi-Fi·전기", "사인"]
        case .retail:             return ["진열대·행거", "조명 (상품 강조)", "POS 카운터", "탈의실·미러", "바닥재", "쇼윈도우"]
        case .onlineDigital:      return ["창고 선반·랙", "포장 작업대", "사진 라이팅", "프린터·라벨", "Wi-Fi·전기", "선입선출 관리"]
        case .startupTech:        return ["책상·모니터", "회의실 (방음)", "팬트리·휴게", "Wi-Fi·서버", "보안 출입", "이벤트 공간"]
        }
    }
}
