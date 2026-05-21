//
//  StoreInfoAccessor.swift — FieldSpec.key ↔ StoreInfoState 양방향 라우팅 유틸리티
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/components/my-store/SectionRenderer.tsx 안의
//             `getField(state, key)` / `setField(state, key, value)` 패턴을
//             Swift 의 strongly-typed switch case 로 명시 미러.
//
//  책임:
//   • value(from:sectionId:key:) — state → FieldValue (편집 가능한 단일 표현)
//   • set(_:sectionId:key:in:)    — FieldValue → state 직접 변이 (inout)
//   • displayString(_:field:)     — FieldValue → 사람이 읽을 수 있는 문자열
//                                   (select option label lookup, won 포맷, multiselect 결합)
//   • binding(in:sectionId:field:) — SwiftUI Binding<FieldValue> 자동 생성
//                                   (StoreInfoStore.commit 으로 600ms debounce 저장 트리거)
//
//  책임에서 명시적으로 *제외*:
//   • 배열 섹션의 개별 항목 편집 (Permit/Person/Insurance/DigitalFootprint)
//     → array item 은 Binding<Permit> 등 typed binding 으로 직접 처리
//   • storePhotos · businessDocuments · industrySpecifics
//     → 각각 별도 전용 화면 (PhotosUploader / DocsLibrary / CategorySectionEditor)
//

import Foundation
import SwiftUI

// MARK: - FieldValue

/// FieldType 5종에 대한 통합 표현.
/// SwiftUI Binding<FieldValue> 로 모든 FieldEditor 가 단일 인터페이스 사용.
public enum FieldValue: Sendable, Hashable {
    /// text · textarea · url · email · phone · time · select (raw 값) · date string
    case text(String)
    /// number · won · percent
    case number(Double?)
    /// date 전용 — "YYYY-MM-DD". text 와 분리 이유: DatePicker 가 다른 위젯이라.
    case date(String?)
    /// multiselect — option.value 의 배열
    case stringArray([String])

    public var isEmpty: Bool {
        switch self {
        case .text(let s):         return s.isEmpty
        case .number(let n):       return n == nil
        case .date(let s):         return s == nil || s?.isEmpty == true
        case .stringArray(let a):  return a.isEmpty
        }
    }
}

// MARK: - Accessor

public enum StoreInfoAccessor {

    // MARK: read

    /// state + section context + field key → FieldValue.
    /// 알 수 없는 key 는 빈 .text("") 반환 (Phase B 의 category-specific 필드도 fallthrough).
    public static func value(
        from state: StoreInfoState,
        sectionId: String,
        key: String
    ) -> FieldValue {
        // footprint (tenancy mode) — state.tenancy 의 sub-field
        if sectionId == "footprint" {
            return tenancyValue(from: state.tenancy, key: key)
        }

        switch key {
        // ── Identity (14) ──
        case "mission":               return .text(state.mission)
        case "shortDescription":      return .text(state.shortDescription)
        case "longDescription":       return .text(state.longDescription)
        case "addressRoad":           return .text(state.addressRoad)
        case "addressDetail":         return .text(state.addressDetail)
        case "regionCode":            return .text(state.regionCode)
        case "phone":                 return .text(state.phone)
        case "ownerPhone":            return .text(state.ownerPhone)
        case "websiteUrl":            return .text(state.websiteUrl)
        case "instagramUrl":          return .text(state.instagramUrl)
        case "naverPlaceUrl":         return .text(state.naverPlaceUrl)
        case "kakaoPlaceUrl":         return .text(state.kakaoPlaceUrl)
        case "weeklyHolidays":        return .stringArray(state.weeklyHolidays)
        case "breakTime":             return .text(state.breakTime)

        // ── Legal (6 single) ──
        case "bizRegistrationNumber": return .text(state.bizRegistrationNumber)
        case "bizRegistrationDate":   return .date(state.bizRegistrationDate.nilIfEmpty)
        case "bizRegistrationType":   return .text(state.bizRegistrationType)
        case "industryCode":          return .text(state.industryCode)
        case "telecomSalesNumber":    return .text(state.telecomSalesNumber)
        case "fourInsuranceEstablished": return .text(state.fourInsuranceEstablished)

        // ── Money infra (7) ──
        case "bizBankName":           return .text(state.bizBankName)
        case "bizBankAccountMasked":  return .text(state.bizBankAccountMasked)
        case "bizCardIssued":         return .text(state.bizCardIssued)
        case "posTerminal":           return .text(state.posTerminal)
        case "taxHandling":           return .text(state.taxHandling)
        case "cpaName":               return .text(state.cpaName)
        case "cpaPhone":              return .text(state.cpaPhone)

        default:
            return .text("")
        }
    }

    private static func tenancyValue(from t: Tenancy, key: String) -> FieldValue {
        switch key {
        case "leaseStartDate":         return .date(t.leaseStartDate)
        case "leaseEndDate":           return .date(t.leaseEndDate)
        case "depositKrw":             return .number(t.depositKrw)
        case "monthlyRentKrw":         return .number(t.monthlyRentKrw)
        case "monthlyMaintenanceKrw":  return .number(t.monthlyMaintenanceKrw)
        case "areaSqm":                return .number(t.areaSqm)
        case "areaPyeong":             return .number(t.areaPyeong)
        case "floor":                  return .text(t.floor ?? "")
        case "landlordName":           return .text(t.landlordName ?? "")
        case "landlordPhone":          return .text(t.landlordPhone ?? "")
        case "renewalIntent":          return .text(t.renewalIntent ?? "")
        default:                       return .text("")
        }
    }

    // MARK: write

    /// FieldValue → state 직접 변이.
    /// 호출 측에서 store.commit { state in StoreInfoAccessor.set(...) } 형태로 감싸 600ms flush 트리거.
    public static func set(
        _ value: FieldValue,
        sectionId: String,
        key: String,
        in state: inout StoreInfoState
    ) {
        if sectionId == "footprint" {
            setTenancy(value, key: key, in: &state.tenancy)
            return
        }

        switch key {
        // ── Identity ──
        case "mission":               state.mission = value.textValue
        case "shortDescription":      state.shortDescription = value.textValue
        case "longDescription":       state.longDescription = value.textValue
        case "addressRoad":           state.addressRoad = value.textValue
        case "addressDetail":         state.addressDetail = value.textValue
        case "regionCode":            state.regionCode = value.textValue
        case "phone":                 state.phone = value.textValue
        case "ownerPhone":            state.ownerPhone = value.textValue
        case "websiteUrl":            state.websiteUrl = value.textValue
        case "instagramUrl":          state.instagramUrl = value.textValue
        case "naverPlaceUrl":         state.naverPlaceUrl = value.textValue
        case "kakaoPlaceUrl":         state.kakaoPlaceUrl = value.textValue
        case "weeklyHolidays":        state.weeklyHolidays = value.arrayValue
        case "breakTime":             state.breakTime = value.textValue

        // ── Legal (single) ──
        case "bizRegistrationNumber": state.bizRegistrationNumber = value.textValue
        case "bizRegistrationDate":   state.bizRegistrationDate = value.dateValue ?? ""
        case "bizRegistrationType":   state.bizRegistrationType = value.textValue
        case "industryCode":          state.industryCode = value.textValue
        case "telecomSalesNumber":    state.telecomSalesNumber = value.textValue
        case "fourInsuranceEstablished": state.fourInsuranceEstablished = value.textValue

        // ── Money infra ──
        case "bizBankName":           state.bizBankName = value.textValue
        case "bizBankAccountMasked":  state.bizBankAccountMasked = value.textValue
        case "bizCardIssued":         state.bizCardIssued = value.textValue
        case "posTerminal":           state.posTerminal = value.textValue
        case "taxHandling":           state.taxHandling = value.textValue
        case "cpaName":               state.cpaName = value.textValue
        case "cpaPhone":              state.cpaPhone = value.textValue

        default:
            // 알 수 없는 key — silent no-op. (Phase B 의 category 필드 추가될 때 확장.)
            break
        }
    }

    private static func setTenancy(_ value: FieldValue, key: String, in t: inout Tenancy) {
        switch key {
        case "leaseStartDate":         t.leaseStartDate = value.dateValue
        case "leaseEndDate":           t.leaseEndDate = value.dateValue
        case "depositKrw":             t.depositKrw = value.doubleValue
        case "monthlyRentKrw":         t.monthlyRentKrw = value.doubleValue
        case "monthlyMaintenanceKrw":  t.monthlyMaintenanceKrw = value.doubleValue
        case "areaSqm":                t.areaSqm = value.doubleValue
        case "areaPyeong":             t.areaPyeong = value.doubleValue
        case "floor":                  t.floor = value.textValue.nilIfEmpty
        case "landlordName":           t.landlordName = value.textValue.nilIfEmpty
        case "landlordPhone":          t.landlordPhone = value.textValue.nilIfEmpty
        case "renewalIntent":          t.renewalIntent = value.textValue.nilIfEmpty
        default: break
        }
    }

    // MARK: display

    /// FieldValue → 사람이 읽을 수 있는 한 줄 문자열.
    /// select/multiselect 는 option.label 로 lookup, won 은 단위 변환, date 는 그대로.
    public static func displayString(_ value: FieldValue, field: FieldSpec) -> String {
        switch (value, field.type) {
        // select — raw value 에 해당하는 label 찾기
        case (.text(let raw), .select):
            if raw.isEmpty { return "" }
            return field.options.first { $0.value == raw }?.label ?? raw

        // multiselect — labels join
        case (.stringArray(let arr), .multiselect):
            if arr.isEmpty { return "" }
            return arr
                .compactMap { v in field.options.first { $0.value == v }?.label ?? v }
                .joined(separator: ", ")

        // phone 타입 — 자동 하이픈 표시
        case (.text(let s), .phone):
            return StoreInfoFormatters.phone(s)

        // text 일반 — key 기반 특수 포맷
        case (.text(let s), _):
            if field.key == "bizRegistrationNumber" {
                return StoreInfoFormatters.businessNumber(s)
            }
            return s

        // number — type 별 포맷
        case (.number(let n?), .won):
            return StoreInfoFormatters.krwAdaptive(n)
        case (.number(let n?), .percent):
            return "\(Int(n.rounded()))%"
        case (.number(let n?), _):
            let unit = field.unit.map { " \($0)" } ?? ""
            // 정수면 콤마, 소수면 1자리까지
            if n == n.rounded() {
                let formatter = NumberFormatter()
                formatter.numberStyle = .decimal
                return (formatter.string(from: NSNumber(value: Int(n))) ?? "\(Int(n))") + unit
            } else {
                return String(format: "%.1f", n) + unit
            }
        case (.number(.none), _):
            return ""

        // date — 한국식 dotted 표시
        case (.date(let s?), _):
            return StoreInfoFormatters.dateDotted(s)
        case (.date(.none), _):
            return ""

        // multiselect → text 등 비매칭 (방어적)
        case (.stringArray(let arr), _):
            return arr.joined(separator: ", ")
        }
    }

    // MARK: binding helper

    /// SwiftUI Binding<FieldValue> — 편집 위젯에 직접 꽂으면 자동 600ms flush.
    @MainActor
    public static func binding(
        in store: StoreInfoStore,
        sectionId: String,
        field: FieldSpec
    ) -> Binding<FieldValue> {
        Binding(
            get: { Self.value(from: store.state, sectionId: sectionId, key: field.key) },
            set: { newValue in
                store.commit { state in
                    Self.set(newValue, sectionId: sectionId, key: field.key, in: &state)
                }
            }
        )
    }

}

// MARK: - FieldValue helpers (module-internal — Validators 등 다른 파일도 사용)

extension FieldValue {
    /// .text 만 raw 반환, 나머지는 빈 문자열.
    public var textValue: String {
        if case .text(let s) = self { return s }
        return ""
    }

    /// .number 만 unwrap.
    public var doubleValue: Double? {
        if case .number(let n) = self { return n }
        return nil
    }

    /// .date 만 unwrap. 빈 문자열은 nil 로 정규화.
    public var dateValue: String? {
        if case .date(let s) = self {
            return (s?.isEmpty == false) ? s : nil
        }
        return nil
    }

    /// .stringArray 만 반환.
    public var arrayValue: [String] {
        if case .stringArray(let a) = self { return a }
        return []
    }
}

public extension String {
    var nilIfEmpty: String? { isEmpty ? nil : self }
}
