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
    public let priority: String?     // primary | recommended | optional
    public let url: String?
    public let budgetTier: String?   // value | standard | premium — 예산 단계 태그

    public var id: String { name }
    /// 섹션 칩에 표시할 태그 — 가격대 우선, 없으면 우선순위.
    public var tag: String? { priceRange ?? priority }
    /// 예산 단계 한글 라벨 (가성비/표준/프리미엄).
    public var budgetLabel: String? {
        switch budgetTier {
        case "value": return "가성비"
        case "standard": return "표준"
        case "premium": return "프리미엄"
        default: return nil
        }
    }
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
        let raw: BUVendorBundle?
        if !subIndustryId.isEmpty, let b = root.subIndustries[subIndustryId] { raw = b }
        else if let cat = categoryId, let b = root.categories[cat] { raw = b }
        else { raw = root.categories["food"] }
        return raw.map(dedupe)
    }

    // 2026-06-26 fix: 같은 공급처가 다른 이름으로 중복 노출되던 버그(예: 헤어앤미·코제트/헤어2000/헤어앤미
    //   모두 hairnmi.co.kr). vendor-data.json 은 웹 getVendorData(머지) 산출이라 dup 포함 → 런타임 dedup.
    //   url(없으면 name) 기준, 첫 항목 유지. (웹 getVendorData 와 동일 규칙)
    private static func dedupe(_ b: BUVendorBundle) -> BUVendorBundle {
        func d(_ items: [BUVendorItem]) -> [BUVendorItem] {
            var seen = Set<String>()
            return items.filter { it in
                let key = (it.url?.trimmingCharacters(in: .whitespaces)).flatMap { $0.isEmpty ? nil : $0 } ?? "name:\(it.name.trimmingCharacters(in: .whitespaces))"
                return seen.insert(key).inserted
            }
        }
        return BUVendorBundle(category: b.category, suppliers: d(b.suppliers), equipment: d(b.equipment), pos: d(b.pos))
    }
}
