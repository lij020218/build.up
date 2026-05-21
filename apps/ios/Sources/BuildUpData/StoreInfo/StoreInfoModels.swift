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

    public init(from decoder: Decoder) throws {
        self.raw = try AnyCodable(from: decoder)
    }

    public func encode(to encoder: Encoder) throws {
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

    public init(from decoder: Decoder) throws {
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

    public func encode(to encoder: Encoder) throws {
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
