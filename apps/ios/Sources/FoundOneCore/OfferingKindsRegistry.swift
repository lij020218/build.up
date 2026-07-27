//
//  OfferingKindsRegistry.swift — 오퍼링(내가 파는 것) 유형 SSOT (iOS)
//
//  ⚠️ 자동 생성 파일 — 직접 수정 금지.
//     원본: packages/shared/src/offering-kinds.ts
//     재생성: npx tsx scripts/gen-offering-kinds-swift.mts
//

import Foundation

public struct BUOfferingKindMeta: Sendable {
    public let kind: String
    public let tabLabelKo: String
    public let tabLabelEn: String
    public let unitLabelKo: String
    public let unitLabelEn: String
    public let pageSubKo: String
    public let pageSubEn: String
    public let stockSection: String   // "none" | "core" | "optional"
    public let showCostRatio: Bool
    public let showSalesCount: Bool
}

public enum BUOfferingKinds {
    /// 세부업종 id → 유형 (70개 전수 — 웹과 동일)
    public static let subIndustryKind: [String: String] = [
        "korean-casual": "menu-bom",
        "delivery-meals": "menu-bom",
        "salad-healthy": "menu-bom",
        "ramen-noodle": "menu-bom",
        "chicken-burger": "menu-bom",
        "western-pasta-brunch": "menu-bom",
        "takeout-coffee": "menu-bom",
        "specialty-coffee": "menu-bom",
        "dessert-cafe": "menu-bom",
        "bakery-studio": "menu-bom",
        "icecream-bingsu": "menu-bom",
        "self-serve-cafe": "menu-bom",
        "convenience-small": "stocked-goods",
        "lifestyle-goods": "stocked-goods",
        "beauty-supplies": "stocked-goods",
        "fashion-accessories": "stocked-goods",
        "health-food-store": "stocked-goods",
        "unmanned-retail": "stocked-goods",
        "hair-salon": "service-menu",
        "nail-studio": "service-menu",
        "skin-care-room": "service-menu",
        "waxing-studio": "service-menu",
        "eyelash-brow": "service-menu",
        "makeup-bridal": "service-menu",
        "pilates-studio": "membership",
        "pt-gym": "membership",
        "yoga-studio": "membership",
        "crossfit-box": "membership",
        "golf-studio": "membership",
        "unmanned-fitness": "membership",
        "study-room": "membership",
        "kids-academy": "membership",
        "adult-class": "membership",
        "language-academy": "membership",
        "coding-class": "membership",
        "small-study-room": "membership",
        "pet-grooming": "service-menu",
        "pet-supplies": "stocked-goods",
        "pet-hotel": "space-booking",
        "pet-cafe": "menu-bom",
        "pet-training-school": "membership",
        "laundry-service": "service-menu",
        "cleaning-service": "service-menu",
        "repair-service": "service-menu",
        "self-laundry": "service-menu",
        "print-copy": "service-menu",
        "device-repair": "service-menu",
        "guesthouse": "space-booking",
        "rental-studio": "space-booking",
        "party-room": "space-booking",
        "study-cafe-space": "membership",
        "shared-office": "membership",
        "practice-room": "space-booking",
        "smart-store": "stocked-goods",
        "digital-products": "digital-goods",
        "creator-service": "project-service",
        "consignment-commerce": "stocked-goods",
        "newsletter-membership": "subscription-plan",
        "global-buying": "stocked-goods",
        "ai-application": "hidden",
        "developer-tools": "hidden",
        "b2b-saas": "hidden",
        "fintech-startup": "hidden",
        "healthtech-startup": "hidden",
        "security-startup": "hidden",
        "hardware-iot": "hidden",
        "robotics-physical-ai": "hidden",
        "semiconductor": "hidden",
        "biotech-medtech": "hidden",
        "climate-energy": "hidden",
    ]

    /// 대분류 폴백 (세부업종 미선택 시)
    public static let categoryFallback: [String: String] = [
        "food": "menu-bom",
        "cafe-dessert": "menu-bom",
        "retail": "stocked-goods",
        "beauty": "service-menu",
        "fitness": "membership",
        "education": "membership",
        "pet": "service-menu",
        "living-service": "service-menu",
        "space": "space-booking",
        "online-digital": "stocked-goods",
        "startup-tech": "hidden",
    ]

    public static let meta: [String: BUOfferingKindMeta] = [
        "menu-bom": .init(kind: "menu-bom", tabLabelKo: "메뉴·재료", tabLabelEn: "Menu & Ingredients", unitLabelKo: "메뉴", unitLabelEn: "Menu item", pageSubKo: "메뉴 가격·레시피 원가율·재료 재고를 한곳에서. 판매를 기록하면 재료가 자동 차감돼요.", pageSubEn: "Menu prices, recipe cost ratios, and ingredient stock in one place.", stockSection: "core", showCostRatio: true, showSalesCount: true),
        "stocked-goods": .init(kind: "stocked-goods", tabLabelKo: "상품·재고", tabLabelEn: "Products & Stock", unitLabelKo: "상품", unitLabelEn: "Product", pageSubKo: "상품·수량·마진을 한곳에서. 발주가 필요한 상품을 놓치지 않게.", pageSubEn: "Products, quantities, and margins — never miss a reorder.", stockSection: "core", showCostRatio: false, showSalesCount: true),
        "service-menu": .init(kind: "service-menu", tabLabelKo: "시술·서비스", tabLabelEn: "Services", unitLabelKo: "서비스", unitLabelEn: "Service", pageSubKo: "시술·서비스 가격표를 정리하세요. 소모품 재고는 아래에서 함께 관리돼요.", pageSubEn: "Your service price list, with optional supplies tracking.", stockSection: "optional", showCostRatio: false, showSalesCount: true),
        "membership": .init(kind: "membership", tabLabelKo: "이용권·회원권", tabLabelEn: "Passes & Memberships", unitLabelKo: "권종", unitLabelEn: "Pass", pageSubKo: "권종(시간권·기간권·금액권)을 등록하고, 권종별로 이번 달 몇 명인지 기록하세요.", pageSubEn: "Register pass types and track how many sold this month.", stockSection: "none", showCostRatio: false, showSalesCount: true),
        "space-booking": .init(kind: "space-booking", tabLabelKo: "요금·이용권", tabLabelEn: "Rates & Passes", unitLabelKo: "요금제", unitLabelEn: "Rate", pageSubKo: "공간·시간 단위 요금을 정리하고 이용 건수를 기록하세요.", pageSubEn: "Organize rates by time slot and track bookings.", stockSection: "none", showCostRatio: false, showSalesCount: true),
        "digital-goods": .init(kind: "digital-goods", tabLabelKo: "상품 카탈로그", tabLabelEn: "Catalog", unitLabelKo: "상품", unitLabelEn: "Product", pageSubKo: "디지털 상품 카탈로그 — 재고 걱정 없이 상품과 가격, 판매 수만.", pageSubEn: "Digital catalog — products, prices, and sales counts.", stockSection: "none", showCostRatio: false, showSalesCount: true),
        "subscription-plan": .init(kind: "subscription-plan", tabLabelKo: "플랜·구독", tabLabelEn: "Plans", unitLabelKo: "플랜", unitLabelEn: "Plan", pageSubKo: "플랜 구성과 가격, 플랜별 구독자 수를 정리하세요.", pageSubEn: "Plan tiers, pricing, and subscriber counts.", stockSection: "none", showCostRatio: false, showSalesCount: true),
        "project-service": .init(kind: "project-service", tabLabelKo: "서비스·패키지", tabLabelEn: "Packages", unitLabelKo: "패키지", unitLabelEn: "Package", pageSubKo: "서비스 패키지와 견적 단가를 정리하고 수주 건수를 기록하세요.", pageSubEn: "Service packages, quote rates, and won projects.", stockSection: "none", showCostRatio: false, showSalesCount: true),
    ]

    /// 세부업종(우선) → 대분류 폴백. 못 찾으면 menu-bom (웹 resolveOfferingKind 정합).
    public static func resolve(subIndustryId: String?, categoryId: String?) -> String {
        if let sub = subIndustryId, let k = subIndustryKind[sub] { return k }
        if let cat = categoryId, let k = categoryFallback[cat] { return k }
        return "menu-bom"
    }

    /// hidden 업종은 오퍼링 탭 미노출 (웹 offeringTabVisible 정합)
    public static func tabVisible(subIndustryId: String?, categoryId: String?) -> Bool {
        resolve(subIndustryId: subIndustryId, categoryId: categoryId) != "hidden"
    }

    public static func metaFor(_ kind: String) -> BUOfferingKindMeta? { meta[kind] }
}
