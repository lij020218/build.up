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
    public let budget: Int?
    public let region: String?
    public let storeName: String?
    public let teamSize: Int?
    public let language: String

    public init(ideaText: String, budget: Int?, region: String?, storeName: String?, teamSize: Int?, language: String = "ko") {
        self.ideaText = ideaText
        self.budget = budget
        self.region = region
        self.storeName = storeName
        self.teamSize = teamSize
        self.language = language
    }
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
        public let monthlyFixedCost: Int

        public var displayTotal: Int {
            total ?? (deposit + interior + equipment + workingCapital)
        }
    }

    public struct Timeline: Decodable, Sendable {
        public let totalWeeks: Int
        public let phases: [Phase]

        public struct Phase: Decodable, Sendable {
            public let name: String
            public let weeks: Int
            public let tasks: [String]
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

        public struct Supplier: Decodable, Sendable {
            public let id: String?
            public let name: String
            public let category: String
            public let reason: String
            public let priceRange: String
        }

        public struct InteriorVendor: Decodable, Sendable {
            public let id: String
            public let title: String
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
