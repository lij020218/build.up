//
//  FranchiseBrandRegistry.swift — 한국 실재 프랜차이즈 215개 데이터 로더.
//
//  웹 SSOT: packages/shared/src/franchise-brands.json (심볼릭 링크로 공유)
//    Resources/franchise-brands.json → ../../../../../packages/shared/src/franchise-brands.json
//
//  데이터 소스:
//    packages/shared/src/franchise-brands.json (웹·iOS 공통 단일 소스 — 215개 브랜드).
//    BBQ·BHC·교촌·도미노피자·본죽·CU·이디야·다이소·올리브영 등 실재 브랜드.
//    각 브랜드는 subIndustryIds + specialtyIds(세부업종) 로 필터링.
//
//  추출 방법:
//    cd packages/shared && ./node_modules/.bin/tsc --module nodenext --moduleResolution nodenext \
//      --target es2022 --outDir /tmp/shared-build src/franchise-data.ts
//    node -e "import('/tmp/shared-build/franchise-data.js').then(m => \
//      require('fs').writeFileSync('apps/ios/Sources/FoundOneCore/Resources/franchise-brands.json', \
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
    /// "curated"(미설정 포함) = 손큐레이션, "kftc" = 공정위 공개데이터 자동 수록.
    public let tier: String?
    public let subIndustryIds: [String]
    /// 세부업종(specialty) 매핑 — sub-industry 보다 세밀한 필터.
    ///   예: korean-casual 안의 "국밥·해장국 전문점" / "한정식" / "분식" 등.
    ///   nil = 매핑 미정의 (sub-industry 매칭만으로 노출).
    ///   [] = 빈 배열 (specialty 선택 시 명시적 제외 — 한식 매핑 오류 brand 등).
    public let specialtyIds: [String]?
    public let categoryId: String
    public let name: FranchiseBrandLocalized
    public let tagline: FranchiseBrandLocalized
    public let startupCostWon: Int           // 만원 단위
    public let franchiseFee: Int             // 만원 단위
    public let monthlyRoyalty: Double        // 만원/월 — 일부 브랜드는 소수 (예: 60계치킨 16.5만)
    /// 정률 로열티 — 매출의 N%. 설정 시 "매출 N%" 로 표시(예: 도미노 6, 투썸 3). 정액 브랜드는 nil.
    public let royaltyPercent: Double?
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
    /// 공정거래위원회 브랜드별 가맹점 현황(공식). scripts/enrich-franchise-official-stats.mts 가 채움.
    ///   손큐레이션 storeCount/avgAnnualRevenueWon 을 덮어쓰지 않고 공식 출처로 병기. 미매칭이면 nil.
    public let officialStats: FranchiseBrandOfficialStats?
}

public struct FranchiseBrandOfficialStats: Decodable, Sendable, Hashable {
    public let year: String
    public let storeCount: Int
    public let newOpenings: Int
    public let terminations: Int
    public let cancellations: Int
    public let avgSalesWon: Int?           // 만원 단위 (미공개면 nil)
    public let avgSalesPerAreaWon: Int?    // 만원 단위, 3.3㎡당 (미공개면 nil)
    public let fetchedAt: String
}

// MARK: - Registry

public enum FranchiseBrandRegistry {

    /// 번들 로드 (lazy, thread-safe via static let) — 중복 제거 후 노출.
    /// 웹 데이터에 같은 브랜드 (같은 한국어 명 + 같은 franchiseUrl) 가 ID 만 다르게 2개 등록된 경우가 있어
    /// (예: saladit + salady 둘 다 "샐러디"), costVerified=true 또는 더 풍부한 sources 를 가진 쪽만 유지.
    public static let all: [FranchiseBrand] = dedupe(loadFromBundle())

    /// 손큐레이션만 (로드맵 선택용 — 공정위 자동 1,400+ 가 선택 UI 를 범람시키지 않도록).
    ///  탐색(FranchiseView)·id 조회는 all(전체) 을 쓴다. 웹 getFranchiseBrandsForCategory 와 일치.
    public static let curated: [FranchiseBrand] = dedupe(decodeResource("franchise-brands"))

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

    /// categoryId 매칭 브랜드 (정렬: startupCost 낮은 순). 로드맵 선택용 → curated 만.
    public static func brands(forCategory categoryId: String) -> [FranchiseBrand] {
        curated.filter { $0.categoryId == categoryId }
            .sorted { $0.startupCostWon < $1.startupCostWon }
    }

    /// subIndustryId + (선택) specialtyId 매칭 브랜드 (정렬: startupCost 낮은 순).
    /// - specialtyId == nil: sub-industry 매칭만 (기존 동작)
    /// - specialtyId != nil + brand.specialtyIds 정의: specialty 포함된 brand 만
    /// - specialtyId != nil + brand.specialtyIds == nil: sub-industry fallback (포함)
    /// - specialtyId != nil + brand.specialtyIds == []: 명시적 제외 (한식 매핑 오류 brand 등)
    ///
    /// Graceful fallback: specialty 필터 결과가 0개면 (예: '냉면'처럼 한국에 전용
    /// 가맹 프랜차이즈가 없는 세부업종) sub-industry 전체로 fallback — 빈 화면 방지.
    // ── 세부업종 매칭 (웹 getFranchiseBrandsForSubIndustry 1:1 미러, 2026-06-27 재설계) ──
    //   ① 동의어 그룹 확장(스터디카페 study-room≡study-cafe-space) ② 큐레이션+공정위 통합 풀
    //   ③ 중복 병합(큐레이션 우선) ④ 정렬(검증 비용 → 가맹점수) ⑤ 상한(범람 방지).
    //   categoryId 전체 폴백은 호출부에서도 제거 — 무관 업종 오염 방지.

    /// 세부업종 동의어 그룹 (웹 SUB_INDUSTRY_GROUPS 미러).
    public static let subIndustryGroups: [[String]] = [
        ["study-cafe-space", "study-room", "small-study-room"],
    ]
    public static func expandSubIndustryGroup(_ id: String) -> [String] {
        subIndustryGroups.first { $0.contains(id) } ?? [id]
    }

    private static func normName(_ s: String) -> String {
        s.replacingOccurrences(of: " ", with: "").lowercased()
    }
    /// 교차명 중복 — 공정위 영업표지 ↔ 큐레이션 마케팅명 (웹 KFTC_CURATED_ALIAS 미러).
    private static let kftcCuratedAlias: [String: String] = [
        normName("작심"): normName("작심스터디카페"),
        normName("토즈 스터디센터"): normName("토즈"),
    ]
    private static func identityKey(_ b: FranchiseBrand) -> String {
        let n = normName(b.name.ko)
        return kftcCuratedAlias[n] ?? n
    }

    public static func brands(forSubIndustry subIndustryId: String, specialtyId: String? = nil, limit: Int = 60) -> [FranchiseBrand] {
        let group = Set(expandSubIndustryGroup(subIndustryId))
        let sorted = all
            .filter { !Set($0.subIndustryIds).isDisjoint(with: group) }
            .sorted { a, b in
                if a.costVerified != b.costVerified { return a.costVerified } // 검증(큐레이션) 우선
                return a.storeCount > b.storeCount                            // 가맹점수 큰 순
            }
        // 중복 병합 — 정렬 후 첫 등장(큐레이션·검증 우선) 유지.
        var seen = Set<String>()
        let inSub = sorted.filter { seen.insert(identityKey($0)).inserted }

        let result: [FranchiseBrand]
        if let sid = specialtyId {
            let matched = inSub.filter { brand in
                if let specs = brand.specialtyIds { return specs.contains(sid) }
                return true // specialtyIds 미정의 → 노출
            }
            result = matched.isEmpty ? inSub : matched
        } else {
            result = inSub
        }
        return limit > 0 ? Array(result.prefix(limit)) : result
    }

    // MARK: - Bundle loader

    private static func loadFromBundle() -> [FranchiseBrand] {
        // 큐레이션 우선 + 공정위 자동 브랜드 병합 (웹 franchiseBrandsAll 과 동일 순서).
        decodeResource("franchise-brands") + decodeResource("franchise-brands-kftc")
    }

    private static func decodeResource(_ name: String) -> [FranchiseBrand] {
        guard let url = Bundle.module.url(forResource: name, withExtension: "json") else {
            #if DEBUG
            print("⚠️ \(name).json 번들에 누락")
            #endif
            return []
        }
        do {
            return try JSONDecoder().decode([FranchiseBrand].self, from: try Data(contentsOf: url))
        } catch {
            #if DEBUG
            print("⚠️ \(name).json 디코딩 실패: \(error)")
            #endif
            return []
        }
    }
}
