//
//  StoreInfoRepository.swift — "내 가게" 데이터 Supabase 어댑터
//
//  ⚠️ 웹 SSOT: packages/shared/src/supabase/store-data.ts:saveStoreData / loadStoreData
//
//  user_store_data 테이블의 store-info 컬럼들 (camelCase → snake_case 변환):
//    mission, short_description, long_description,
//    address_road, address_detail, region_code, latitude, longitude,
//    phone, owner_phone, website_url, instagram_url, naver_place_url, kakao_place_url,
//    weekly_holidays (jsonb), break_time, store_photos (jsonb),
//    current_balance_manual_krw, current_balance_updated_at,
//    biz_registration_number, biz_registration_date, biz_registration_type,
//    industry_code, telecom_sales_number, four_insurance_established, permits (jsonb),
//    biz_bank_name, biz_bank_account_masked, biz_card_issued, pos_terminal,
//    tax_handling, cpa_name, cpa_phone,
//    people_directory (jsonb), insurance_policies (jsonb),
//    tenancy (jsonb), digital_footprint (jsonb), vehicles (jsonb),
//    industry_specifics (jsonb), business_documents (jsonb)
//

import Foundation
import Supabase

public protocol StoreInfoRepositoryProtocol: Sendable {
    func load() async throws -> StoreInfoState
    func save(_ state: StoreInfoState) async throws
}

public actor StoreInfoRepository: StoreInfoRepositoryProtocol {
    private let supabase: SupabaseClient
    private let getUserId: @Sendable () async throws -> UUID

    public init(supabase: SupabaseClient,
                getUserId: @escaping @Sendable () async throws -> UUID) {
        self.supabase = supabase
        self.getUserId = getUserId
    }

    // MARK: - Load

    public func load() async throws -> StoreInfoState {
        let userId = try await getUserId()

        let rows: [StoreInfoRowDTO] = try await supabase
            .from("user_store_data")
            .select(Self.selectColumns)
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value

        guard let row = rows.first else { return StoreInfoState() }
        return row.toState()
    }

    // MARK: - Save (전체 upsert)

    public func save(_ state: StoreInfoState) async throws {
        let userId = try await getUserId()
        let dto = StoreInfoWriteDTO(from: state, userId: userId)
        try await supabase
            .from("user_store_data")
            .upsert(dto, onConflict: "user_id")
            .execute()
        RealtimeEcho.markLocalWrite(table: "user_store_data")   // 자기 에코 억제
    }

    private static let selectColumns = """
        mission, short_description, long_description, \
        address_road, address_detail, region_code, latitude, longitude, \
        phone, owner_phone, website_url, instagram_url, naver_place_url, kakao_place_url, \
        weekly_holidays, break_time, store_photos, \
        current_balance_manual_krw, current_balance_updated_at, \
        biz_registration_number, biz_registration_date, biz_registration_type, \
        industry_code, telecom_sales_number, four_insurance_established, permits, \
        biz_bank_name, biz_bank_account_masked, biz_card_issued, pos_terminal, \
        tax_handling, cpa_name, cpa_phone, \
        people_directory, insurance_policies, \
        tenancy, digital_footprint, vehicles, \
        industry_specifics, business_documents
        """
}

// MARK: - DTOs

private struct StoreInfoRowDTO: Decodable {
    var mission: String?
    var short_description: String?
    var long_description: String?
    var address_road: String?
    var address_detail: String?
    var region_code: String?
    var latitude: Double?
    var longitude: Double?
    var phone: String?
    var owner_phone: String?
    var website_url: String?
    var instagram_url: String?
    var naver_place_url: String?
    var kakao_place_url: String?
    var weekly_holidays: [String]?
    var break_time: String?
    var store_photos: [StorePhoto]?
    var current_balance_manual_krw: Double?
    var current_balance_updated_at: String?
    var biz_registration_number: String?
    var biz_registration_date: String?
    var biz_registration_type: String?
    var industry_code: String?
    var telecom_sales_number: String?
    var four_insurance_established: String?
    var permits: [Permit]?
    var biz_bank_name: String?
    var biz_bank_account_masked: String?
    var biz_card_issued: String?
    var pos_terminal: String?
    var tax_handling: String?
    var cpa_name: String?
    var cpa_phone: String?
    var people_directory: [Person]?
    var insurance_policies: [InsurancePolicy]?
    var tenancy: Tenancy?
    var digital_footprint: [DigitalFootprintItem]?
    var vehicles: [Vehicle]?
    var industry_specifics: [String: AnyCodableValue]?
    var business_documents: [BusinessDocument]?

    func toState() -> StoreInfoState {
        var s = StoreInfoState()
        s.mission = mission ?? ""
        s.shortDescription = short_description ?? ""
        s.longDescription = long_description ?? ""
        s.addressRoad = address_road ?? ""
        s.addressDetail = address_detail ?? ""
        s.regionCode = region_code ?? ""
        s.latitude = latitude
        s.longitude = longitude
        s.phone = phone ?? ""
        s.ownerPhone = owner_phone ?? ""
        s.websiteUrl = website_url ?? ""
        s.instagramUrl = instagram_url ?? ""
        s.naverPlaceUrl = naver_place_url ?? ""
        s.kakaoPlaceUrl = kakao_place_url ?? ""
        s.weeklyHolidays = weekly_holidays ?? []
        s.breakTime = break_time ?? ""
        s.storePhotos = store_photos ?? []
        s.currentBalanceManualKrw = current_balance_manual_krw
        s.currentBalanceUpdatedAt = current_balance_updated_at
        s.bizRegistrationNumber = biz_registration_number ?? ""
        s.bizRegistrationDate = biz_registration_date ?? ""
        s.bizRegistrationType = biz_registration_type ?? ""
        s.industryCode = industry_code ?? ""
        s.telecomSalesNumber = telecom_sales_number ?? ""
        s.fourInsuranceEstablished = four_insurance_established ?? ""
        s.permits = permits ?? []
        s.bizBankName = biz_bank_name ?? ""
        s.bizBankAccountMasked = biz_bank_account_masked ?? ""
        s.bizCardIssued = biz_card_issued ?? ""
        s.posTerminal = pos_terminal ?? ""
        s.taxHandling = tax_handling ?? ""
        s.cpaName = cpa_name ?? ""
        s.cpaPhone = cpa_phone ?? ""
        s.peopleDirectory = people_directory ?? []
        s.insurancePolicies = insurance_policies ?? []
        s.tenancy = tenancy ?? Tenancy()
        s.digitalFootprint = digital_footprint ?? []
        s.vehicles = vehicles ?? []
        s.industrySpecifics = industry_specifics ?? [:]
        s.businessDocuments = business_documents ?? []
        return s
    }
}

private struct StoreInfoWriteDTO: Encodable {
    let user_id: UUID
    let mission: String?
    let short_description: String?
    let long_description: String?
    let address_road: String?
    let address_detail: String?
    let region_code: String?
    let latitude: Double?
    let longitude: Double?
    let phone: String?
    let owner_phone: String?
    let website_url: String?
    let instagram_url: String?
    let naver_place_url: String?
    let kakao_place_url: String?
    let weekly_holidays: [String]
    let break_time: String?
    let store_photos: [StorePhoto]
    let current_balance_manual_krw: Double?
    let current_balance_updated_at: String?
    let biz_registration_number: String?
    let biz_registration_date: String?
    let biz_registration_type: String?
    let industry_code: String?
    let telecom_sales_number: String?
    let four_insurance_established: String?
    let permits: [Permit]
    let biz_bank_name: String?
    let biz_bank_account_masked: String?
    let biz_card_issued: String?
    let pos_terminal: String?
    let tax_handling: String?
    let cpa_name: String?
    let cpa_phone: String?
    let people_directory: [Person]
    let insurance_policies: [InsurancePolicy]
    let tenancy: Tenancy
    let digital_footprint: [DigitalFootprintItem]
    let vehicles: [Vehicle]
    let industry_specifics: [String: AnyCodableValue]
    let business_documents: [BusinessDocument]
    let updated_at: String

    init(from s: StoreInfoState, userId: UUID) {
        self.user_id = userId
        self.mission = s.mission.nilIfEmpty
        self.short_description = s.shortDescription.nilIfEmpty
        self.long_description = s.longDescription.nilIfEmpty
        self.address_road = s.addressRoad.nilIfEmpty
        self.address_detail = s.addressDetail.nilIfEmpty
        self.region_code = s.regionCode.nilIfEmpty
        self.latitude = s.latitude
        self.longitude = s.longitude
        self.phone = s.phone.nilIfEmpty
        self.owner_phone = s.ownerPhone.nilIfEmpty
        self.website_url = s.websiteUrl.nilIfEmpty
        self.instagram_url = s.instagramUrl.nilIfEmpty
        self.naver_place_url = s.naverPlaceUrl.nilIfEmpty
        self.kakao_place_url = s.kakaoPlaceUrl.nilIfEmpty
        self.weekly_holidays = s.weeklyHolidays
        self.break_time = s.breakTime.nilIfEmpty
        self.store_photos = s.storePhotos
        self.current_balance_manual_krw = s.currentBalanceManualKrw
        self.current_balance_updated_at = s.currentBalanceUpdatedAt
        self.biz_registration_number = s.bizRegistrationNumber.nilIfEmpty
        self.biz_registration_date = s.bizRegistrationDate.nilIfEmpty
        self.biz_registration_type = s.bizRegistrationType.nilIfEmpty
        self.industry_code = s.industryCode.nilIfEmpty
        self.telecom_sales_number = s.telecomSalesNumber.nilIfEmpty
        self.four_insurance_established = s.fourInsuranceEstablished.nilIfEmpty
        self.permits = s.permits
        self.biz_bank_name = s.bizBankName.nilIfEmpty
        self.biz_bank_account_masked = s.bizBankAccountMasked.nilIfEmpty
        self.biz_card_issued = s.bizCardIssued.nilIfEmpty
        self.pos_terminal = s.posTerminal.nilIfEmpty
        self.tax_handling = s.taxHandling.nilIfEmpty
        self.cpa_name = s.cpaName.nilIfEmpty
        self.cpa_phone = s.cpaPhone.nilIfEmpty
        self.people_directory = s.peopleDirectory
        self.insurance_policies = s.insurancePolicies
        self.tenancy = s.tenancy
        self.digital_footprint = s.digitalFootprint
        self.vehicles = s.vehicles
        self.industry_specifics = s.industrySpecifics
        self.business_documents = s.businessDocuments
        self.updated_at = ISO8601DateFormatter().string(from: Date())
    }
}

// String.nilIfEmpty 는 StoreInfoAccessor.swift 에 module-internal 로 정의됨.
