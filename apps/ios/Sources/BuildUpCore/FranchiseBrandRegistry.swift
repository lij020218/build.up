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
    public let monthlyRoyalty: Double        // 만원/월 — 일부 브랜드는 소수 (예: 60계치킨 16.5만)
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

    /// 번들 로드 (lazy, thread-safe via static let) — 중복 제거 후 노출.
    /// 웹 데이터에 같은 브랜드 (같은 한국어 명 + 같은 franchiseUrl) 가 ID 만 다르게 2개 등록된 경우가 있어
    /// (예: saladit + salady 둘 다 "샐러디"), costVerified=true 또는 더 풍부한 sources 를 가진 쪽만 유지.
    public static let all: [FranchiseBrand] = dedupe(loadFromBundle())

    private static func dedupe(_ brands: [FranchiseBrand]) -> [FranchiseBrand] {
        // 그룹화 키: (한국어 명) + (있다면 franchiseUrl). url 없으면 한국어 명만으로.
        func key(_ b: FranchiseBrand) -> String {
            let name = b.name.ko.trimmingCharacters(in: .whitespaces)
            let url = (b.franchiseUrl ?? "").lowercased().trimmingCharacters(in: .whitespaces)
            return url.isEmpty ? name : "\(name)|\(url)"
        }
        // costVerified true 우선, 그 다음 sources 개수 많은 쪽, 그 다음 storeCount 큰 쪽.
        func quality(_ b: FranchiseBrand) -> (Int, Int, Int) {
            (b.costVerified ? 1 : 0, b.sources?.count ?? 0, b.storeCount)
        }
        var bestByKey: [String: FranchiseBrand] = [:]
        for b in brands {
            let k = key(b)
            if let existing = bestByKey[k] {
                if quality(b) > quality(existing) { bestByKey[k] = b }
            } else {
                bestByKey[k] = b
            }
        }
        // 입력 순서 유지하면서 dedupe — 첫 번째로 키가 등장한 위치에 best 를 배치.
        var seen: Set<String> = []
        var out: [FranchiseBrand] = []
        for b in brands {
            let k = key(b)
            if seen.contains(k) { continue }
            seen.insert(k)
            if let best = bestByKey[k] { out.append(best) }
        }
        return out
    }

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
            // 번들 누락은 dev/test 환경 문제 — production 에서는 빈 리스트로 graceful degrade.
            #if DEBUG
            print("⚠️ franchise-brands.json 번들에 누락")
            #endif
            return []
        }
        do {
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode([FranchiseBrand].self, from: data)
        } catch {
            // 디코딩 실패 시 production 크래시 방지 — 빈 리스트로 graceful degrade + 디버그 로그.
            #if DEBUG
            print("⚠️ franchise-brands.json 디코딩 실패: \(error)")
            #endif
            return []
        }
    }
}
