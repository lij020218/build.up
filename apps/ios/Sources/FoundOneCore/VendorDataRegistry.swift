//
//  VendorDataRegistry.swift — 세부업종별 공급처·장비·POS 데이터 로더 (웹 SSOT 미러).
//
//  웹 SSOT: apps/web/app/lib/components/stages/offline/vendor-setup-data.ts (getVendorData)
//  데이터: Resources/vendor-data.json — packages/shared/src/vendor-data.json 심볼릭 링크.
//    웹의 getVendorData(subIndustryId) 로 60개 세부업종 전부 resolved (specialty→sub→category 머지).
//
//  생성: cd apps/web && node --experimental-strip-types /tmp/gen-vendor.ts
//    (SUB_TO_CATEGORY 의 모든 sub-industry 에 대해 getVendorData 호출 → JSON 직렬화)
//

import Foundation

public struct BUVendorItem: Decodable, Sendable, Hashable, Identifiable {
    public let name: String
    public let desc: String
    public let priceRange: String?
    public let priority: String?   // primary | recommended | optional
    public let url: String?

    public var id: String { name }
    /// 섹션 칩에 표시할 태그 — 가격대 우선, 없으면 우선순위.
    public var tag: String? { priceRange ?? priority }
}

public struct BUVendorBundle: Decodable, Sendable {
    public let category: String?
    public let suppliers: [BUVendorItem]
    public let equipment: [BUVendorItem]
    public let pos: [BUVendorItem]
}

public enum VendorDataRegistry {

    private struct Root: Decodable {
        let categories: [String: BUVendorBundle]
        let subIndustries: [String: BUVendorBundle]
    }

    private static let root: Root? = {
        guard let url = Bundle.module.url(forResource: "vendor-data", withExtension: "json") else {
            #if DEBUG
            print("⚠️ vendor-data.json 번들 누락")
            #endif
            return nil
        }
        do {
            return try JSONDecoder().decode(Root.self, from: try Data(contentsOf: url))
        } catch {
            #if DEBUG
            print("⚠️ vendor-data.json 디코딩 실패: \(error)")
            #endif
            return nil
        }
    }()

    /// 세부업종 id 로 resolved 공급처 데이터 조회.
    /// - sub-industry 매칭 우선 → 없으면 categoryId 폴백 → 없으면 food 폴백.
    public static func bundle(forSubIndustry subIndustryId: String, categoryId: String? = nil) -> BUVendorBundle? {
        guard let root else { return nil }
        if !subIndustryId.isEmpty, let b = root.subIndustries[subIndustryId] { return b }
        if let cat = categoryId, let b = root.categories[cat] { return b }
        return root.categories["food"]
    }
}
