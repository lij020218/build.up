//
//  StoreInfoModels.swift — "내 가게" 페이지 데이터 모델 (Swift mirror of web SSOT)
//
//  ⚠️ 웹 SSOT:
//    - apps/web/app/lib/stores/store-info-store.ts (Zustand state shape)
//    - packages/shared/src/supabase/store-data.ts:UserStoreData (DB 컬럼 SSOT)
//
//  Supabase 컬럼: user_store_data 테이블에 모두 top-level. snake_case 변환.
//  배열·객체 필드는 jsonb. 일반 필드는 nullable string/int/double.
//

import Foundation
import FoundOneCore

// MARK: - Entity types (array items)

public struct Permit: Identifiable, Sendable, Codable, Hashable {
    public let id: String
    public var name: String
    public var issuedAt: String?
    public var expiresAt: String?
    public var issuedBy: String?
    public var certNumber: String?
    public var memo: String?

    public init(id: String = UUID().uuidString, name: String = "", issuedAt: String? = nil,
                expiresAt: String? = nil, issuedBy: String? = nil,
                certNumber: String? = nil, memo: String? = nil) {
        self.id = id; self.name = name; self.issuedAt = issuedAt
        self.expiresAt = expiresAt; self.issuedBy = issuedBy
        self.certNumber = certNumber; self.memo = memo
    }
}

public struct InsurancePolicy: Identifiable, Sendable, Codable, Hashable {
    public let id: String
    public var name: String
    public var type: String        // "fire" | "general-liability" | ...
    public var insurer: String?
    public var policyNumber: String?
    public var startDate: String?
    public var expiresAt: String?
    public var annualPremium: Double?
    public var coverageAmount: Double?
    public var memo: String?

    public init(id: String = UUID().uuidString, name: String = "", type: String = "fire",
                insurer: String? = nil, policyNumber: String? = nil, startDate: String? = nil,
                expiresAt: String? = nil, annualPremium: Double? = nil,
                coverageAmount: Double? = nil, memo: String? = nil) {
        self.id = id; self.name = name; self.type = type; self.insurer = insurer
        self.policyNumber = policyNumber; self.startDate = startDate
        self.expiresAt = expiresAt; self.annualPremium = annualPremium
        self.coverageAmount = coverageAmount; self.memo = memo
    }
}

public struct Person: Identifiable, Sendable, Codable, Hashable {
    public let id: String
    public var name: String
    public var kind: String      // "employee-fulltime" | "employee-parttime" | "freelancer" | "vendor-supplier" | "vendor-service" | "landlord"
    public var role: String?
    public var phone: String?
    public var startDate: String?
    public var fourInsurance: String?  // "yes" | "no" | "na"
    public var wage: Double?
    public var memo: String?

    public init(id: String = UUID().uuidString, name: String = "", kind: String = "employee-fulltime",
                role: String? = nil, phone: String? = nil, startDate: String? = nil,
                fourInsurance: String? = nil, wage: Double? = nil, memo: String? = nil) {
        self.id = id; self.name = name; self.kind = kind; self.role = role
        self.phone = phone; self.startDate = startDate
        self.fourInsurance = fourInsurance; self.wage = wage; self.memo = memo
    }
}

public struct Tenancy: Sendable, Codable, Hashable {
    public var leaseStartDate: String?
    public var leaseEndDate: String?
    public var depositKrw: Double?
    public var monthlyRentKrw: Double?
    public var monthlyMaintenanceKrw: Double?
    public var areaSqm: Double?
    public var areaPyeong: Double?
    public var floor: String?
    public var landlordName: String?
    public var landlordPhone: String?
    public var renewalIntent: String?

    public init() {}
}

public struct DigitalFootprintItem: Identifiable, Sendable, Codable, Hashable {
    public let id: String
    public var name: String
    public var kind: String    // "domain" | "hosting" | "platform" | "cdn" | "logistics" | "fulfillment"
    public var vendorName: String?
    public var monthlyFeeKrw: Double?
    public var expiresAt: String?
    public var memo: String?

    public init(id: String = UUID().uuidString, name: String = "", kind: String = "domain",
                vendorName: String? = nil, monthlyFeeKrw: Double? = nil,
                expiresAt: String? = nil, memo: String? = nil) {
        self.id = id; self.name = name; self.kind = kind
        self.vendorName = vendorName; self.monthlyFeeKrw = monthlyFeeKrw
        self.expiresAt = expiresAt; self.memo = memo
    }
}

public struct Vehicle: Identifiable, Sendable, Codable, Hashable {
    public let id: String
    public var name: String
    public var plateNumber: String?
    public var purchaseDate: String?
    public var purchasePriceKrw: Double?
    public var insuranceExpiresAt: String?
    public var memo: String?

    public init(id: String = UUID().uuidString, name: String = "", plateNumber: String? = nil,
                purchaseDate: String? = nil, purchasePriceKrw: Double? = nil,
                insuranceExpiresAt: String? = nil, memo: String? = nil) {
        self.id = id; self.name = name; self.plateNumber = plateNumber
        self.purchaseDate = purchaseDate; self.purchasePriceKrw = purchasePriceKrw
        self.insuranceExpiresAt = insuranceExpiresAt; self.memo = memo
    }
}

public struct StorePhoto: Sendable, Codable, Hashable {
    public var url: String
    public var caption: String?

    public init(url: String, caption: String? = nil) {
        self.url = url; self.caption = caption
    }
}

public enum BusinessDocumentKind: String, Sendable, Codable, CaseIterable {
    case bizRegistration       = "biz-registration"
    case bizReportFood         = "biz-report-food"
    case bizReportPet          = "biz-report-pet"
    case bizReportBeauty       = "biz-report-beauty"
    case telecomSales          = "telecom-sales"
    case hygieneCert           = "hygiene-cert"
    case healthCert            = "health-cert"
    case fireSafety            = "fire-safety"
    case trademark             = "trademark"
    case patent                = "patent"
    case ventureCert           = "venture-cert"
    case other                 = "other"

    public var labelKo: String {
        switch self {
        case .bizRegistration: return "사업자등록증"
        case .bizReportFood:   return "영업신고증 (일반/휴게음식점)"
        case .bizReportPet:    return "동물미용업 등록증"
        case .bizReportBeauty: return "미용업 영업신고증"
        case .telecomSales:    return "통신판매업 신고증"
        case .hygieneCert:     return "위생교육 수료증"
        case .healthCert:      return "보건증"
        case .fireSafety:      return "소방완비증명서"
        case .trademark:       return "상표등록증"
        case .patent:          return "특허증"
        case .ventureCert:     return "벤처기업 확인서"
        case .other:           return "기타 서류"
        }
    }
}

public struct BusinessDocument: Identifiable, Sendable, Codable, Hashable {
    public let id: String
    public var kind: BusinessDocumentKind
    public var filename: String
    public var url: String
    public var sizeBytes: Int?
    public var uploadedAt: String
    public var expiresAt: String?
    public var issuedAt: String?
    public var registrationNumber: String?
    public var notes: String?

    public init(id: String = UUID().uuidString, kind: BusinessDocumentKind, filename: String,
                url: String, sizeBytes: Int? = nil, uploadedAt: String,
                expiresAt: String? = nil, issuedAt: String? = nil,
                registrationNumber: String? = nil, notes: String? = nil) {
        self.id = id; self.kind = kind; self.filename = filename; self.url = url
        self.sizeBytes = sizeBytes; self.uploadedAt = uploadedAt; self.expiresAt = expiresAt
        self.issuedAt = issuedAt; self.registrationNumber = registrationNumber; self.notes = notes
    }
}

// MARK: - Operations entities (web SSOT: operations-store.ts)

public struct WasteLogEntry: Sendable, Codable, Hashable {
    public var date: String
    public var qty: Double
    public var reason: String

    public init(date: String = "", qty: Double = 0, reason: String = "") {
        self.date = date; self.qty = qty; self.reason = reason
    }
}

/// 재고 항목 — web InventoryItem 완전 미러.
public struct BUInventoryItem: Identifiable, Sendable, Codable, Hashable {
    public let id: String
    public var name: String
    public var quantity: Double
    public var unit: String
    public var minThreshold: Double
    public var unitCost: Double
    public var category: String   // "fresh"|"dry"|"frozen"|"beverage"|"supply"|"other"
    public var itemType: String   // "material"|"product"
    /// 상품류(itemType=product)의 자유분류 — 메뉴(메인/사이드)·소매(의류/잡화). 웹 InventoryItem.displayCategory 정합.
    /// category enum 은 식자재 개념이라 상품엔 부적합 → 사장님 입력 분류를 무손실 보존. material 은 미사용. (2026-07-22 통합)
    public var displayCategory: String?
    public var sellingPrice: Double
    public var leadTimeDays: Int
    public var dailyUsage: Double
    /// 월 판매 수량 — 소매 sell-through 계산용. 웹 SellThroughProduct.monthlySold 정합.
    /// 0 이면 카드에서 dailyUsage × 26 추정 + "추정" 배지. 기존 JSON 미포함 → 0 default.
    public var monthlySold: Double
    public var lastOrderedAt: String?
    public var wasteLog: [WasteLogEntry]

    // MARK: Derived

    /// 재주문 필요 여부 (web: quantity <= minThreshold)
    public var isLowStock: Bool { quantity <= minThreshold && minThreshold > 0 }

    /// 소진까지 남은 일 수 (dailyUsage == 0 이면 999)
    public var daysUntilStockout: Int {
        guard dailyUsage > 0 else { return 999 }
        return max(0, Int(quantity / dailyUsage))
    }

    public init(
        id: String = UUID().uuidString,
        name: String,
        quantity: Double = 0,
        unit: String = "개",
        minThreshold: Double = 0,
        unitCost: Double = 0,
        category: String = "other",
        itemType: String = "material",
        displayCategory: String? = nil,
        sellingPrice: Double = 0,
        leadTimeDays: Int = 1,
        dailyUsage: Double = 0,
        monthlySold: Double = 0,
        lastOrderedAt: String? = nil,
        wasteLog: [WasteLogEntry] = []
    ) {
        self.id = id; self.name = name; self.quantity = quantity; self.unit = unit
        self.minThreshold = minThreshold; self.unitCost = unitCost; self.category = category
        self.itemType = itemType; self.displayCategory = displayCategory; self.sellingPrice = sellingPrice
        self.leadTimeDays = leadTimeDays; self.dailyUsage = dailyUsage
        self.monthlySold = monthlySold
        self.lastOrderedAt = lastOrderedAt; self.wasteLog = wasteLog
    }

    // MARK: Codable — monthlySold 는 기존 JSON 에 없을 수 있어 decodeIfPresent 로 처리
    enum CodingKeys: String, CodingKey {
        case id, name, quantity, unit, minThreshold, unitCost, category, itemType
        case displayCategory
        case sellingPrice, leadTimeDays, dailyUsage, monthlySold, lastOrderedAt, wasteLog
    }

    public init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id             = try c.decode(String.self,           forKey: .id)
        name           = try c.decode(String.self,           forKey: .name)
        quantity       = try c.decode(Double.self,           forKey: .quantity)
        unit           = try c.decode(String.self,           forKey: .unit)
        minThreshold   = try c.decode(Double.self,           forKey: .minThreshold)
        unitCost       = try c.decode(Double.self,           forKey: .unitCost)
        category       = try c.decode(String.self,           forKey: .category)
        itemType       = try c.decode(String.self,           forKey: .itemType)
        displayCategory = try? c.decodeIfPresent(String.self, forKey: .displayCategory)
        sellingPrice   = try c.decode(Double.self,           forKey: .sellingPrice)
        leadTimeDays   = try c.decode(Int.self,              forKey: .leadTimeDays)
        dailyUsage     = try c.decode(Double.self,           forKey: .dailyUsage)
        monthlySold    = (try? c.decodeIfPresent(Double.self, forKey: .monthlySold)) ?? 0
        lastOrderedAt  = try? c.decodeIfPresent(String.self, forKey: .lastOrderedAt)
        wasteLog       = (try? c.decodeIfPresent([WasteLogEntry].self, forKey: .wasteLog)) ?? []
    }
}

/// 고객/회원 관리 유형 — web SSOT: business-context.ts CustomerMode
public enum BUCustomerMode: String, Sendable, Codable, CaseIterable {
    case membership   // 헬스장·학원·스터디카페 (월정액, 이용권, 출석)
    case appointment  // 미용실·펫미용 (예약, 방문 이력, 시술 기록)
    case `repeat`     // 음식점·카페·생활서비스 (단골, 재방문)
    case ecommerce    // 소매·온라인몰 (주문 이력, 재구매)
    case pipeline     // 스타트업 (리드→계약)
    case none
}

/// 회원/고객 — web Member 완전 미러 (operations-store.ts Member type)
public struct BUMember: Identifiable, Sendable, Codable, Hashable {
    public let id: String
    public var name: String
    public var plan: String      // "1개월", "3개월", "PT 20회" 등
    public var fee: Double       // 월 회비 / 결제액 (원)
    public var startDate: String // ISO YYYY-MM-DD
    public var endDate: String   // ISO YYYY-MM-DD

    // MARK: Derived

    public var isActive: Bool {
        guard !endDate.isEmpty else { return true }
        return endDate >= BUMember.today()
    }

    /// 7일 이내 만료 여부
    public var isExpiringSoon: Bool {
        guard !endDate.isEmpty else { return false }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        guard let end = formatter.date(from: endDate) else { return false }
        let diff = end.timeIntervalSince(Date())
        return diff > 0 && diff < 7 * 86400
    }

    public init(
        id: String = UUID().uuidString,
        name: String,
        plan: String = "",
        fee: Double = 0,
        startDate: String = "",
        endDate: String = ""
    ) {
        self.id = id; self.name = name; self.plan = plan
        self.fee = fee
        self.startDate = startDate.isEmpty ? BUMember.today() : startDate
        self.endDate = endDate
    }

    private static func today() -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withFullDate]
        return f.string(from: Date())
    }
}

/// 직원 — web Employee 완전 미러 (급여 계산 포함).
/// 웹 SSOT: StaffLaborCard.tsx calcEmployee()
public struct BUEmployee: Identifiable, Sendable, Codable, Hashable {
    public let id: String
    public var name: String
    public var hourlyWage: Double     // 시급 (원)
    public var weeklyHours: Double    // 주당 근무시간
    public var isInsured: Bool        // 4대보험 사업주 부담 여부
    public var hireDate: String?      // ISO YYYY-MM-DD (연차 추적용)

    // MARK: Payroll calculations (web SSOT: StaffLaborCard.tsx calcEmployee)

    /// 주휴수당: 주 15h 이상 → (주당시간/5) × 시급
    public var weeklyAllowance: Double {
        weeklyHours >= 15 ? (weeklyHours / 5) * hourlyWage : 0
    }

    /// 월급 (세전): (시급 × 주당시간 + 주휴수당) × 4.345
    public var monthlyWage: Double {
        (hourlyWage * weeklyHours + weeklyAllowance) * 4.345
    }

    /// 사업주 4대보험 부담금 — 요율 SSOT: FoundOneCore `simulateInsurance` (하드코딩 금지).
    /// 미가입 시 0. 산재 0.7%(일반서비스업) 가정, 주 15h 미만 단시간 분기 자동 처리.
    public var employerInsurance: Double {
        guard isInsured else { return 0 }
        let sim = simulateInsurance(InsuranceSimInput(
            monthlySalary: Int(monthlyWage.rounded()),
            weeklyHours: weeklyHours
        ))
        return Double(sim.employer.total)
    }

    /// 사업주 실부담: 월급 + 4대보험
    public var monthlyBurden: Double { monthlyWage + employerInsurance }

    public init(
        id: String = UUID().uuidString,
        name: String,
        hourlyWage: Double = 10_320,
        weeklyHours: Double = 40,
        isInsured: Bool = false,
        hireDate: String? = nil
    ) {
        self.id = id; self.name = name; self.hourlyWage = hourlyWage
        self.weeklyHours = weeklyHours; self.isInsured = isInsured; self.hireDate = hireDate
    }
}

// MARK: - Aggregate state

public struct StoreInfoState: Sendable, Codable, Equatable {
    // Identity
    public var mission: String = ""
    public var shortDescription: String = ""
    public var longDescription: String = ""
    public var addressRoad: String = ""
    public var addressDetail: String = ""
    public var regionCode: String = ""
    public var latitude: Double?
    public var longitude: Double?
    public var phone: String = ""
    public var ownerPhone: String = ""
    public var websiteUrl: String = ""
    public var instagramUrl: String = ""
    public var naverPlaceUrl: String = ""
    public var kakaoPlaceUrl: String = ""
    public var weeklyHolidays: [String] = []
    public var breakTime: String = ""
    public var storePhotos: [StorePhoto] = []

    // Financial
    public var currentBalanceManualKrw: Double?
    public var currentBalanceUpdatedAt: String?

    // Legal
    public var bizRegistrationNumber: String = ""
    public var bizRegistrationDate: String = ""
    public var bizRegistrationType: String = ""
    public var industryCode: String = ""
    public var telecomSalesNumber: String = ""
    public var fourInsuranceEstablished: String = ""
    public var permits: [Permit] = []

    // Money Infrastructure
    public var bizBankName: String = ""
    public var bizBankAccountMasked: String = ""
    public var bizCardIssued: String = ""
    public var posTerminal: String = ""
    public var taxHandling: String = ""
    public var cpaName: String = ""
    public var cpaPhone: String = ""

    // People
    public var peopleDirectory: [Person] = []

    // Operations (web SSOT: operations-store.ts)
    public var inventory: [BUInventoryItem] = []
    public var employees: [BUEmployee] = []
    public var members: [BUMember] = []

    // Insurance
    public var insurancePolicies: [InsurancePolicy] = []

    // Footprint
    public var tenancy: Tenancy = Tenancy()
    public var digitalFootprint: [DigitalFootprintItem] = []
    public var vehicles: [Vehicle] = []

    // Industry-specific sections (Phase B)
    // sectionId → AnyCodableValue (보통 .array(of objects))
    // 예: industrySpecifics["menu-ingredients"] = .array([{name, kind, costPerUnit, ...}, ...])
    public var industrySpecifics: [String: AnyCodableValue] = [:]

    // Business documents (Phase D)
    public var businessDocuments: [BusinessDocument] = []

    public init() {}

    // MARK: - industrySpecifics array helpers

    /// 카테고리 섹션의 array 항목 목록을 반환. 없으면 빈 배열.
    public func industryArray(_ sectionId: String) -> [[String: AnyCodable]] {
        guard let wrapper = industrySpecifics[sectionId] else { return [] }
        if case .array(let arr) = wrapper.raw.value {
            return arr.compactMap { item in
                if case .object(let obj) = item.value { return obj }
                return nil
            }
        }
        return []
    }

    /// 카테고리 섹션의 array 를 통째로 교체.
    public mutating func setIndustryArray(_ sectionId: String, _ items: [[String: AnyCodable]]) {
        let arr = items.map { AnyCodable(.object($0)) }
        if arr.isEmpty {
            industrySpecifics.removeValue(forKey: sectionId)
        } else {
            industrySpecifics[sectionId] = AnyCodableValue(AnyCodable(.array(arr)))
        }
    }
}

// MARK: - AnyCodable convenience getters

extension AnyCodable {
    public var stringValue: String? {
        if case .string(let s) = value { return s }
        return nil
    }
    public var doubleValue: Double? {
        switch value {
        case .double(let d): return d
        case .int(let i):    return Double(i)
        default:             return nil
        }
    }
    public var boolValue: Bool? {
        if case .bool(let b) = value { return b }
        return nil
    }
    public var arrayValue: [AnyCodable]? {
        if case .array(let a) = value { return a }
        return nil
    }
    public var objectValue: [String: AnyCodable]? {
        if case .object(let o) = value { return o }
        return nil
    }

    public static func string(_ s: String) -> AnyCodable { AnyCodable(.string(s)) }
    public static func double(_ d: Double) -> AnyCodable { AnyCodable(.double(d)) }
    public static func int(_ i: Int) -> AnyCodable { AnyCodable(.int(i)) }
    public static func bool(_ b: Bool) -> AnyCodable { AnyCodable(.bool(b)) }
    public static let null = AnyCodable(.null)
}

// MARK: - Generic JSON value wrapper

/// industrySpecifics 의 임의 jsonb 구조를 그대로 read/write 하기 위한 wrapper.
/// 카테고리별 섹션은 Phase B 에서 typed accessor 추가.
public struct AnyCodableValue: Sendable, Codable, Hashable {
    public let raw: AnyCodable

    public init(_ raw: AnyCodable) { self.raw = raw }

    public init(from decoder: any Decoder) throws {
        self.raw = try AnyCodable(from: decoder)
    }

    public func encode(to encoder: any Encoder) throws {
        try raw.encode(to: encoder)
    }
}

/// Type-erased JSON value — Bool / Int / Double / String / Array / Dict / Null.
public struct AnyCodable: Sendable, Codable, Hashable {
    public enum Value: Sendable, Hashable {
        case null
        case bool(Bool)
        case int(Int)
        case double(Double)
        case string(String)
        case array([AnyCodable])
        case object([String: AnyCodable])
    }

    public let value: Value

    public init(_ value: Value) { self.value = value }
    public init(nilLiteral: ()) { self.value = .null }

    public init(from decoder: any Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self.value = .null; return }
        if let v = try? c.decode(Bool.self)    { self.value = .bool(v); return }
        if let v = try? c.decode(Int.self)     { self.value = .int(v); return }
        if let v = try? c.decode(Double.self)  { self.value = .double(v); return }
        if let v = try? c.decode(String.self)  { self.value = .string(v); return }
        if let v = try? c.decode([AnyCodable].self) { self.value = .array(v); return }
        if let v = try? c.decode([String: AnyCodable].self) { self.value = .object(v); return }
        throw DecodingError.dataCorruptedError(in: c, debugDescription: "Unknown JSON value")
    }

    public func encode(to encoder: any Encoder) throws {
        var c = encoder.singleValueContainer()
        switch value {
        case .null:           try c.encodeNil()
        case .bool(let v):    try c.encode(v)
        case .int(let v):     try c.encode(v)
        case .double(let v):  try c.encode(v)
        case .string(let v):  try c.encode(v)
        case .array(let v):   try c.encode(v)
        case .object(let v):  try c.encode(v)
        }
    }
}
