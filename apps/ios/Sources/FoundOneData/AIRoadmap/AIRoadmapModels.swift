//
//  AIRoadmapModels.swift — AI 로드맵 생성 입력/결과 Swift 미러
//
//  웹 SSOT: packages/ai/src/roadmap/prompt.ts (RoadmapGenerationInput / RoadmapGenerationResult)
//  핵심 필드만 Codable 로 정의. UI 에서 사용하지 않는 깊은 필드는 생략.
//

import Foundation

// MARK: - Input

public struct AIRoadmapInput: Encodable, Sendable {
    public let ideaText: String
    /// 사용자가 확정한 업종 (2026-08-03 분류 분리) — 서버가 이 값을 강제한다
    public let confirmedSubIndustryId: String?
    public let confirmedCategoryId: String?
    public let budget: Int?
    public let region: String?
    public let storeName: String?
    public let teamSize: Int?
    /// 예산 직접 입력 모드 (2026-08-21 위저드 이원화) — 사용자가 정한 항목은 서버가
    /// budgetAllocation/monthlyCosts 출력에 그대로 보존하고 나머지만 최적 배분한다.
    public let budgetBreakdown: AIBudgetBreakdown?
    public let language: String

    public init(
        ideaText: String,
        confirmedSubIndustryId: String? = nil,
        confirmedCategoryId: String? = nil,
        budget: Int?, region: String?, storeName: String?, teamSize: Int?,
        budgetBreakdown: AIBudgetBreakdown? = nil,
        language: String = "ko"
    ) {
        self.ideaText = ideaText
        self.confirmedSubIndustryId = confirmedSubIndustryId
        self.confirmedCategoryId = confirmedCategoryId
        self.budget = budget
        self.region = region
        self.storeName = storeName
        self.teamSize = teamSize
        self.budgetBreakdown = budgetBreakdown
        self.language = language
    }
}

/// 사용자 직접 입력 예산 (2026-08-21 위저드 예산 이원화).
///  서버 계약 미러: packages/ai prompt.ts `RoadmapBudgetBreakdown` — 필드 추가·수정 시 양쪽 동시.
///  모든 값 **만원 단위 정수**. nil/빈 필드는 인코딩 생략(부분 입력 허용 — 빈 항목은 AI가 채움).
public struct AIBudgetBreakdown: Encodable, Sendable, Equatable {
    /// budget-setup 단계 항목 키(startup-budget-items SSOT: deposit·premium·interior·equipment·
    /// initialStock·permits·openMarketing·franchiseFee·incorporation·development·content·storefront) → 만원
    public let items: [String: Int]?
    /// ② 운영예비자금 (만원) — budgetAllocation.workingCapital 로 그대로 유지
    public let workingCapital: Int?
    /// 월비용 (만원) — monthlyCosts 의 해당 필드로 그대로 유지
    public let monthly: Monthly?

    public struct Monthly: Encodable, Sendable, Equatable {
        public let ingredients: Int?
        public let labor: Int?
        public let rent: Int?
        public let utilities: Int?
        public let other: Int?

        public init(ingredients: Int? = nil, labor: Int? = nil, rent: Int? = nil,
                    utilities: Int? = nil, other: Int? = nil) {
            self.ingredients = ingredients
            self.labor = labor
            self.rent = rent
            self.utilities = utilities
            self.other = other
        }

        public var isEmpty: Bool {
            [ingredients, labor, rent, utilities, other].compactMap { $0 }.isEmpty
        }
    }

    public init(items: [String: Int]? = nil, workingCapital: Int? = nil, monthly: Monthly? = nil) {
        self.items = items
        self.workingCapital = workingCapital
        self.monthly = monthly
    }

    public var isEmpty: Bool {
        (items?.isEmpty ?? true) && workingCapital == nil && (monthly?.isEmpty ?? true)
    }
}

/// 업종 분류 후보 — /api/ai/roadmap/classify (웹 IndustryCandidate 미러)
public struct IndustryCandidateItem: Decodable, Sendable, Hashable {
    public let subIndustryId: String
    public let categoryId: String
    public let label: String
    public let reason: String
}

// MARK: - Result

public struct AIRoadmapResult: Decodable, Sendable {
    public let conceptSummary: String
    public let parsed: Parsed
    public let identity: Identity?
    public let budgetAllocation: BudgetAllocation
    public let timeline: Timeline
    public let fundingPrograms: [FundingProgram]
    public let recommendations: Recommendations

    public struct Parsed: Decodable, Sendable {
        public let industryCategoryId: String
        public let subIndustryId: String
        public let industryLabel: String
        public let startupType: String
        /// 운영 방식 id — 웹 파리티 (2026-08-03 디코딩 추가: 종전 누락으로 iOS 가 3단계를 못 채웠음)
        public let businessModelId: String?
        public let preferredRegion: String
        public let matchingReason: String
        public let matchingConfidence: Int
        public let alternativeSubIndustries: [AltIndustry]

        public struct AltIndustry: Decodable, Sendable {
            public let id: String
            public let reason: String
        }
    }

    public struct Identity: Decodable, Sendable {
        public let suggestedStoreName: String
        public let mission: String
        public let targetCustomer: String
        public let businessOpenTime: String
        public let businessCloseTime: String
    }

    public struct BudgetAllocation: Decodable, Sendable {
        public let total: Int?
        public let deposit: Int
        public let interior: Int
        public let equipment: Int
        public let workingCapital: Int
        /// 월 고정비(만원). 2026-08-19: 서버가 파생값으로 항상 보내지만, 빌드 4가 non-optional 이라
        /// 누락 시 생성 전멸했던 이력 → 빌드 5부터 optional (미사용 필드가 디코딩을 깨지 않게).
        public let monthlyFixedCost: Int?

        public var displayTotal: Int {
            total ?? (deposit + interior + equipment + workingCapital)
        }
    }

    /// 월비용(만원) — 서버 monthlyCosts 미러 (2026-08-21 예산 이원화 핸드오프용, 구버전 응답 호환 optional).
    public let monthlyCosts: MonthlyCostsOut?

    public struct MonthlyCostsOut: Decodable, Sendable {
        public let ingredients: Int?
        public let labor: Int?
        public let rent: Int?
        public let utilities: Int?
        public let other: Int?

        // 관용 디코딩 — LLM 이 소수·문자열을 내도 전체 결과 디코딩을 깨지 않는다 (2026-08-19 교훈: Phase.tasks).
        private enum CodingKeys: String, CodingKey { case ingredients, labor, rent, utilities, other }
        public init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: CodingKeys.self)
            func lenient(_ k: CodingKeys) -> Int? {
                if let i = try? c.decodeIfPresent(Int.self, forKey: k) { return i }
                if let d = try? c.decodeIfPresent(Double.self, forKey: k) { return Int(d.rounded()) }
                if let s = try? c.decodeIfPresent(String.self, forKey: k) { return Int(s) }
                return nil
            }
            ingredients = lenient(.ingredients)
            labor = lenient(.labor)
            rent = lenient(.rent)
            utilities = lenient(.utilities)
            other = lenient(.other)
        }
    }

    public struct Timeline: Decodable, Sendable {
        /// "YYYY-MM-DD" — 로드맵 D-day 칩 소스 (2026-08-03 디코딩 추가)
        public let targetOpenDate: String?
        public let totalWeeks: Int
        public let phases: [Phase]

        public struct Phase: Decodable, Sendable {
            public let name: String
            public let weeks: Int
            /// 서버 스키마엔 없는 필드 — 빌드 4가 non-optional 이라 phases 있으면 디코딩 전멸(2026-08-19). 빌드 5부터 optional+기본 [].
            public let tasks: [String]

            enum CodingKeys: String, CodingKey { case name, weeks, tasks }
            public init(from decoder: Decoder) throws {
                let c = try decoder.container(keyedBy: CodingKeys.self)
                name = try c.decodeIfPresent(String.self, forKey: .name) ?? ""
                weeks = try Self.decodeInt(c, .weeks) ?? 0
                tasks = try c.decodeIfPresent([String].self, forKey: .tasks) ?? []
            }
            private static func decodeInt(_ c: KeyedDecodingContainer<CodingKeys>, _ k: CodingKeys) throws -> Int? {
                if let i = try? c.decodeIfPresent(Int.self, forKey: k) { return i }
                if let d = try? c.decodeIfPresent(Double.self, forKey: k) { return Int(d.rounded()) }
                return nil
            }
        }
    }

    public struct FundingProgram: Decodable, Sendable {
        public let name: String
        public let kind: String
        public let eligibility: String
        public let amount: String
        public let deadline: String?
    }

    public struct Recommendations: Decodable, Sendable {
        public let suppliers: [Supplier]
        /// 분업 선언(AI가 끝낸 것) 집계용 — 구버전 응답 호환 optional
        public let interiorVendors: [InteriorVendor]?
        public let operationalChannels: [OperationalChannel]?
        /// 내 지역 인테리어 업체 — 서버 부착 실데이터 (업종검색×국토부 대장×소진공 교차, 2026-08-04)
        public let regionalInteriorFirms: [RegionalInteriorFirm]?
        /// 대표 공급 브랜드 — 서버 부착 SSOT (점유율·인증 근거. 프랜차이즈 미부착)
        public let supplyBrands: [SupplyBrandGroup]?
        /// 내 지역 공급처 — Kakao Local 실데이터 (서버 부착)
        public let regionalSupplierPlaces: [RegionalSupplierPlace]?

        public struct Supplier: Decodable, Sendable {
            public let id: String?
            public let name: String
            public let category: String
            public let reason: String
            public let priceRange: String
            /// 실명 후보·비교 포인트 — DB 풀 description (하림·마니커 등 실명이 여기 산다)
            public let description: String?
        }

        public struct InteriorVendor: Decodable, Sendable {
            public let id: String
            public let title: String
        }

        public struct RegionalInteriorFirm: Decodable, Sendable {
            public let name: String
            public let address: String
            public let phone: String?
            public let registeredAt: String?
            public let licensed: Bool
            public let operating: Bool
            public let industryMatch: Bool
            public let distanceM: Double?
            public let mapUrl: String?
        }

        public struct RegionalSupplierPlace: Decodable, Sendable {
            public let keyword: String
            public let name: String
            public let address: String
            public let phone: String?
            public let mapUrl: String?
        }

        public struct SupplyBrandGroup: Decodable, Sendable {
            public let category: String
            public let brands: [SupplyBrand]
            public let basis: String
            public let sourceUrl: String

            public struct SupplyBrand: Decodable, Sendable {
                public let name: String
                public let note: String
                public let url: String?
            }
        }

        public struct OperationalChannel: Decodable, Sendable {
            public let id: String
            public let nameKo: String
        }
    }

    // ── 분업 선언(역할 분담) 섹션용 — 웹 DivisionOfLabor 와 동일 데이터 (전부 optional: 구버전 호환) ──

    public let legal: Legal?
    public let moneyInfra: MoneyInfra?
    public let insurance: [InsuranceItem]?
    public let industrySpecific: IndustrySpecific?

    public struct Legal: Decodable, Sendable {
        public let taxType: String?
        public let permitsDetailed: [Permit]?

        public struct Permit: Decodable, Sendable {
            public let name: String
            public let kind: String
            public let whereTo: String   // JSON 키 "where" — Swift 예약어라 개명
            public let cost: String
            public let duration: String
            public let required: Bool

            private enum CodingKeys: String, CodingKey {
                case name, kind, cost, duration, required
                case whereTo = "where"
            }
        }
    }

    public struct MoneyInfra: Decodable, Sendable {
        public let recommendedBank: String?
    }

    public struct InsuranceItem: Decodable, Sendable {
        public let name: String
    }

    public struct IndustrySpecific: Decodable, Sendable {
        public let menu: [NamedItem]?
        public let services: [NamedItem]?
        public let memberships: [NamedItem]?
        public let products: [NamedItem]?

        public struct NamedItem: Decodable, Sendable {
            public let name: String
        }

        public var hasAny: Bool {
            !(menu ?? []).isEmpty || !(services ?? []).isEmpty
                || !(memberships ?? []).isEmpty || !(products ?? []).isEmpty
        }
    }
}

// MARK: - API Error

public struct AIRoadmapAPIError: Decodable, Sendable {
    public let error: String
}
