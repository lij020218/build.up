//
//  FranchiseBrandRegistry.swift — 한국 실재 프랜차이즈 120개 데이터 로더.
//
//  웹 SSOT: packages/shared/src/franchise-data.ts (franchiseBrands)
//
//  데이터 소스:
//    Resources/franchise-brands.json (TS 에서 자동 추출 — 120개 브랜드).
//    BBQ·BHC·교촌·도미노피자·본죽·CU·이디야·다이소·올리브영 등 실재 브랜드.
//
//  추출 방법:
//    cd packages/shared && ./node_modules/.bin/tsc --module nodenext --moduleResolution nodenext \
//      --target es2022 --outDir /tmp/shared-build src/franchise-data.ts
//    node -e "import('/tmp/shared-build/franchise-data.js').then(m => \
//      require('fs').writeFileSync('apps/ios/Sources/BuildUpCore/Resources/franchise-brands.json', \
//      JSON.stringify(m.franchiseBrands, null, 2)))"
//

import Foundation

// MARK: - JSON shape (웹 SSOT FranchiseBrand 1:1 미러)

public struct FranchiseBrandLocalized: Decodable, Sendable, Hashable {
    public let ko: String
    public let en: String
}

public struct FranchiseBrandStringsLocalized: Decodable, Sendable, Hashable {
    public let ko: [String]
    public let en: [String]
}

public struct FranchiseBrandCostItem: Decodable, Sendable, Hashable {
    public let label: FranchiseBrandLocalized
    public let amountWon: Int   // 단위: 만원
}

public struct FranchiseBrandScores: Decodable, Sendable, Hashable {
    public let profitability: Int
    public let stability: Int
    public let accessibility: Int
    public let brandPower: Int
    public let support: Int
}

public struct FranchiseBrandSource: Decodable, Sendable, Hashable {
    public let label: String
    public let url: String?
    public let tier: String?
}

public struct FranchiseBrand: Decodable, Sendable, Identifiable, Hashable {
    public let id: String
    public let subIndustryIds: [String]
    public let categoryId: String
    public let name: FranchiseBrandLocalized
    public let tagline: FranchiseBrandLocalized
    public let startupCostWon: Int           // 만원 단위
    public let franchiseFee: Int             // 만원 단위
    public let monthlyRoyalty: Int           // 만원/월
    public let avgAnnualRevenueWon: Int      // 만원 단위
    public let storeCount: Int
    public let closureRate: Double
    public let scores: FranchiseBrandScores
    public let roadmapNotes: FranchiseBrandStringsLocalized
    public let costBreakdown: [FranchiseBrandCostItem]?
    public let costVerified: Bool
    public let costSource: String?
    public let basePyeong: Int?
    public let minPyeong: Int?
    public let storeLocatorUrl: String?
    public let franchiseUrl: String?
    public let dataYear: String?
    public let sources: [FranchiseBrandSource]?
    public let confidence: String?
    public let pros: FranchiseBrandStringsLocalized?
    public let cons: FranchiseBrandStringsLocalized?
    public let description: FranchiseBrandStringsLocalized?
    public let bestLocation: FranchiseBrandStringsLocalized?
}

// MARK: - Registry

public enum FranchiseBrandRegistry {

    /// 번들 로드 (lazy, thread-safe via static let).
    public static let all: [FranchiseBrand] = loadFromBundle()

    /// id 로 빠른 조회 (O(1)).
    private static let byId: [String: FranchiseBrand] = {
        var m: [String: FranchiseBrand] = [:]
        for b in all { m[b.id] = b }
        return m
    }()

    public static func brand(by id: String) -> FranchiseBrand? {
        byId[id]
    }

    /// categoryId 매칭 브랜드 (정렬: startupCost 낮은 순).
    public static func brands(forCategory categoryId: String) -> [FranchiseBrand] {
        all.filter { $0.categoryId == categoryId }
            .sorted { $0.startupCostWon < $1.startupCostWon }
    }

    /// subIndustryId 매칭 브랜드 (정렬: startupCost 낮은 순).
    public static func brands(forSubIndustry subIndustryId: String) -> [FranchiseBrand] {
        all.filter { $0.subIndustryIds.contains(subIndustryId) }
            .sorted { $0.startupCostWon < $1.startupCostWon }
    }

    // MARK: - Bundle loader

    private static func loadFromBundle() -> [FranchiseBrand] {
        guard let url = Bundle.module.url(forResource: "franchise-brands", withExtension: "json") else {
            assertionFailure("franchise-brands.json 번들에 누락")
            return []
        }
        do {
            let data = try Data(contentsOf: url)
            let decoder = JSONDecoder()
            return try decoder.decode([FranchiseBrand].self, from: data)
        } catch {
            assertionFailure("franchise-brands.json 디코딩 실패: \(error)")
            return []
        }
    }
}
